/**
 * WebRTC Video Call Service
 * Handles real peer-to-peer video calls with working camera and audio
 */

export interface PeerConnection {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isConnected: boolean;
  isInitiator: boolean;
}

export class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private isConnected = false;
  private channelName: string;
  private role: "DOCTOR" | "PATIENT";
  private uid: string;

  // Callbacks
  private onLocalStream?: (stream: MediaStream) => void;
  private onRemoteStream?: (stream: MediaStream) => void;
  private onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  private onDisconnected?: () => void;

  constructor(channelName: string, role: "DOCTOR" | "PATIENT", uid: string) {
    this.channelName = channelName;
    this.role = role;
    this.uid = uid;
  }

  /**
   * Initialize local media and create peer connection
   */
  async initialize(callbacks: {
    onLocalStream?: (stream: MediaStream) => void;
    onRemoteStream?: (stream: MediaStream) => void;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
    onDisconnected?: () => void;
  }) {
    this.onLocalStream = callbacks.onLocalStream;
    this.onRemoteStream = callbacks.onRemoteStream;
    this.onConnectionStateChange = callbacks.onConnectionStateChange;
    this.onDisconnected = callbacks.onDisconnected;

    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log(`✅ ${this.role}: Local media obtained`, this.localStream);
      this.onLocalStream?.(this.localStream);

      // Create peer connection
      this.createPeerConnection();

      // Add local stream to peer connection
      this.localStream.getTracks().forEach((track) => {
        this.pc?.addTrack(track, this.localStream!);
      });

      return true;
    } catch (error) {
      console.error(`❌ ${this.role}: Failed to initialize:`, error);
      throw error;
    }
  }

  /**
   * Create RTCPeerConnection with proper configuration
   */
  private createPeerConnection() {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
      iceCandidatePoolSize: 10,
    };

    this.pc = new RTCPeerConnection(configuration);

    // Handle incoming tracks (remote stream)
    this.pc.ontrack = (event) => {
      console.log(`📺 ${this.role}: Received remote track`, event);
      this.remoteStream = event.streams[0];
      this.onRemoteStream?.(this.remoteStream);
      this.isConnected = true;
    };

    // Handle connection state changes
    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      console.log(`🔗 ${this.role}: Connection state:`, state);
      this.onConnectionStateChange?.(state!);

      if (state === "connected") {
        this.isConnected = true;
      } else if (
        state === "disconnected" ||
        state === "failed" ||
        state === "closed"
      ) {
        this.isConnected = false;
        this.onDisconnected?.();
      }
    };

    // Handle ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`🧊 ${this.role}: ICE candidate:`, event.candidate);
        // In a real app, send this to the remote peer via signaling server
        this.sendSignalingMessage({
          type: "ice-candidate",
          candidate: event.candidate,
          from: this.role,
          channel: this.channelName,
        });
      }
    };
  }

  /**
   * Create and send offer (caller)
   */
  async createOffer() {
    if (!this.pc) throw new Error("Peer connection not initialized");

    try {
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.pc.setLocalDescription(offer);
      console.log(`📤 ${this.role}: Created offer`, offer);

      // Send offer via signaling
      this.sendSignalingMessage({
        type: "offer",
        offer: offer,
        from: this.role,
        channel: this.channelName,
      });

      return offer;
    } catch (error) {
      console.error(`❌ ${this.role}: Failed to create offer:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming offer and create answer (callee)
   */
  async handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.pc) throw new Error("Peer connection not initialized");

    try {
      await this.pc.setRemoteDescription(offer);

      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      console.log(`📤 ${this.role}: Created answer`, answer);

      // Send answer via signaling
      this.sendSignalingMessage({
        type: "answer",
        answer: answer,
        from: this.role,
        channel: this.channelName,
      });

      return answer;
    } catch (error) {
      console.error(`❌ ${this.role}: Failed to handle offer:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming answer (caller)
   */
  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.pc) throw new Error("Peer connection not initialized");

    try {
      await this.pc.setRemoteDescription(answer);
      console.log(`✅ ${this.role}: Set remote description with answer`);
    } catch (error) {
      console.error(`❌ ${this.role}: Failed to handle answer:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.pc) throw new Error("Peer connection not initialized");

    try {
      await this.pc.addIceCandidate(candidate);
      console.log(`✅ ${this.role}: Added ICE candidate`);
    } catch (error) {
      console.error(`❌ ${this.role}: Failed to add ICE candidate:`, error);
    }
  }

  /**
   * Toggle audio mute
   */
  toggleAudio(muted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
      console.log(`🔊 ${this.role}: Audio ${muted ? "muted" : "unmuted"}`);
      return true;
    }
    return false;
  }

  /**
   * Toggle video
   */
  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
      console.log(`📹 ${this.role}: Video ${enabled ? "enabled" : "disabled"}`);
      return true;
    }
    return false;
  }

  /**
   * Hang up and cleanup
   */
  async hangUp() {
    console.log(`📞 ${this.role}: Hanging up`);

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    this.remoteStream = null;
    this.isConnected = false;

    // Notify via signaling
    this.sendSignalingMessage({
      type: "hang-up",
      from: this.role,
      channel: this.channelName,
    });
  }

  /**
   * Send signaling message (to be implemented with your signaling server)
   */
  private async sendSignalingMessage(message: {
    type: string;
    from: string;
    channel: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
  }) {
    try {
      // Use your existing channel status API as signaling
      await fetch("/api/agora/webrtc-signaling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error(`❌ ${this.role}: Failed to send signaling:`, error);
    }
  }

  /**
   * Listen for signaling messages
   */
  startSignalingListener() {
    const pollSignaling = async () => {
      try {
        const response = await fetch(
          `/api/agora/webrtc-signaling?channel=${this.channelName}&role=${this.role}`
        );
        if (response.ok) {
          const messages = await response.json();

          for (const message of messages.messages || []) {
            await this.handleSignalingMessage(message);
          }
        }
      } catch (error) {
        console.error(`❌ ${this.role}: Signaling polling error:`, error);
      }

      // Poll every 2 seconds
      setTimeout(pollSignaling, 2000);
    };

    pollSignaling();
  }

  /**
   * Handle incoming signaling messages
   */
  private async handleSignalingMessage(message: {
    type: string;
    from: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
  }) {
    if (message.from === this.role) return; // Ignore own messages

    console.log(`📨 ${this.role}: Received signaling:`, message.type);

    switch (message.type) {
      case "offer":
        if (message.offer) {
          await this.handleOffer(message.offer);
        }
        break;
      case "answer":
        if (message.answer) {
          await this.handleAnswer(message.answer);
        }
        break;
      case "ice-candidate":
        if (message.candidate) {
          await this.handleIceCandidate(message.candidate);
        }
        break;
      case "hang-up":
        await this.hangUp();
        break;
    }
  }

  // Getters
  getLocalStream() {
    return this.localStream;
  }
  getRemoteStream() {
    return this.remoteStream;
  }
  getConnectionState() {
    return this.pc?.connectionState || "new";
  }
  isStreamConnected() {
    return this.isConnected;
  }
}
