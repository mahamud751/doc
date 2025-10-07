"use client";

import { Button } from "@/components/ui/Button";
import {
  MessageCircle,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Settings,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { agoraCallingService } from "@/lib/agora-calling-service";

// Type definitions for Agora RTC SDK
interface IAgoraRTCClient {
  join: (
    appId: string,
    channel: string,
    token: string | null,
    uid: number
  ) => Promise<void>;
  leave: () => Promise<void>;
  publish: (
    tracks: (ICameraVideoTrack | IMicrophoneAudioTrack)[]
  ) => Promise<void>;
  subscribe: (user: IAgoraRTCRemoteUser, mediaType: string) => Promise<void>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback: (...args: unknown[]) => void) => void;
}

interface ICameraVideoTrack {
  play: (element: HTMLElement) => void;
  close: () => void;
  setEnabled: (enabled: boolean) => Promise<void>;
  stop?: () => void; // Add optional stop method
}

interface IMicrophoneAudioTrack {
  play: () => void;
  close: () => void;
  setEnabled: (enabled: boolean) => Promise<void>;
  stop?: () => void; // Add optional stop method
}

interface IAgoraRTCRemoteUser {
  uid: number;
  videoTrack?: ICameraVideoTrack;
  audioTrack?: IMicrophoneAudioTrack;
}

interface IAgoraRTC {
  createClient: (config: unknown) => IAgoraRTCClient;
  createCameraVideoTrack: () => Promise<ICameraVideoTrack>;
  createMicrophoneAudioTrack: () => Promise<IMicrophoneAudioTrack>;
}

// Dynamically import AgoraRTC
let AgoraRTC: IAgoraRTC | null = null;

interface VideoCallProps {
  channelName: string;
  appointmentId: string;
  userRole: "patient" | "doctor";
  userId: string;
  authToken: string;
  onCallEnd: () => void;
  onPrescriptionCreate?: () => void;
}

interface AgoraTokenResponse {
  token: string;
  appId: string;
  channel: string;
  uid: number;
  expires: number;
}

export default function AgoraVideoCall({
  channelName,
  appointmentId,
  userRole,
  userId,
  authToken,
  onCallEnd,
  onPrescriptionCreate,
}: VideoCallProps) {
  // Agora client and tracks
  const agoraClient = useRef<IAgoraRTCClient | null>(null);
  const localVideoTrack = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrack = useRef<IMicrophoneAudioTrack | null>(null);

  // UI states
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "failed" | "disconnected"
  >("connecting");
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [localVideoReady, setLocalVideoReady] = useState(false);
  const [agoraInitialized, setAgoraInitialized] = useState(false);

  // Video containers
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const callStartTime = useRef<number>(0);

  // Generate unique UID based on user ID
  const uid = parseInt(userId) || Math.floor(Math.random() * 10000);

  const generateAgoraToken = async (): Promise<AgoraTokenResponse> => {
    try {
      const response = await fetch("/api/agora/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          channelName,
          uid,
          role: userRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: Token generation failed`
        );
      }

      const tokenData = await response.json();
      console.log("AgoraVideoCall: Token generated successfully", {
        hasToken: !!tokenData.token,
        hasAppId: !!tokenData.appId,
        channelName,
        uid,
      });
      return tokenData;
    } catch (error) {
      console.error("Token generation error:", error);
      throw error;
    }
  };

  const initializeAgoraClient = useCallback(async () => {
    if (!AgoraRTC) {
      console.error("AgoraRTC not loaded yet");
      return;
    }

    try {
      setConnectionStatus("connecting");
      console.log("AgoraVideoCall: Initializing Agora client...");

      // Get Agora token
      let tokenData;
      try {
        tokenData = await generateAgoraToken();
        console.log("AgoraVideoCall: Token received", {
          hasToken: !!tokenData.token,
          hasAppId: !!tokenData.appId,
        });
      } catch (error) {
        console.warn(
          "AgoraVideoCall: Failed to generate token, trying with App ID from env:",
          error
        );
        // Use environment App ID as fallback
        const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";

        // Validate App ID format before using it
        if (!appId || appId.length !== 32) {
          throw new Error(
            `Invalid Agora App ID configuration. Expected 32 characters, got ${appId.length}. Please check your environment variables.`
          );
        }

        tokenData = {
          appId: appId,
          token: null, // Use null for testing
          channel: channelName,
          uid: uid,
          expires: 0,
        };
        console.log("AgoraVideoCall: Using fallback configuration", {
          appId: appId.substring(0, 8) + "...",
          hasToken: false,
        });
      }

      // Validate that we have a valid App ID
      if (!tokenData.appId || tokenData.appId.length !== 32) {
        throw new Error(
          `Invalid Agora App ID received. Expected 32 characters, got ${
            tokenData.appId?.length || 0
          }`
        );
      }

      // Create Agora client
      console.log("AgoraVideoCall: Creating Agora client...");
      agoraClient.current = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      });

      // Set up event handlers
      if (agoraClient.current) {
        console.log("AgoraVideoCall: Setting up event handlers...");
        agoraClient.current.on("user-published", handleUserPublished);
        agoraClient.current.on("user-unpublished", handleUserUnpublished);
        agoraClient.current.on("user-joined", handleUserJoined);
        agoraClient.current.on("user-left", handleUserLeft);
        agoraClient.current.on(
          "connection-state-changed",
          handleConnectionStateChanged
        );

        // Join channel
        console.log("AgoraVideoCall: Joining channel...", {
          appId: tokenData.appId.substring(0, 8) + "...",
          channelName,
          hasToken: !!tokenData.token,
          uid,
        });

        await agoraClient.current.join(
          tokenData.appId,
          channelName,
          tokenData.token, // This can be null for testing
          uid
        );

        console.log("AgoraVideoCall: Successfully joined channel");

        // Create and publish local tracks
        console.log("AgoraVideoCall: Creating local tracks...");
        await createLocalTracks();
        console.log("AgoraVideoCall: Publishing local tracks...");
        await publishLocalTracks();

        setConnectionStatus("connected");
        setIsCallActive(true);
        console.log("AgoraVideoCall: Initialization complete");
      }
    } catch (error) {
      console.error(
        "AgoraVideoCall: Failed to initialize Agora client:",
        error
      );
      setConnectionStatus("failed");

      // Provide more specific error feedback
      let errorMessage = "Video call initialization failed. ";
      if (error instanceof Error) {
        if (error.message.includes("Invalid")) {
          errorMessage += "Configuration issue: " + error.message;
        } else if (error.message.includes("vendor key")) {
          errorMessage += "Please check your Agora App ID configuration.";
        } else {
          errorMessage += error.message;
        }
      }
      console.error("AgoraVideoCall: Error details:", errorMessage);
    }
  }, [channelName, uid, generateAgoraToken]);

  // Initialize Agora SDK
  useEffect(() => {
    const initAgora = async () => {
      if (typeof window !== "undefined") {
        // Dynamically import AgoraRTC only on client side
        const AgoraRTCModule = await import("agora-rtc-sdk-ng");
        AgoraRTC = AgoraRTCModule.default as unknown as IAgoraRTC | null;
        setAgoraInitialized(true);
      }
    };

    initAgora();
  }, []);

  useEffect(() => {
    if (agoraInitialized) {
      initializeAgoraClient();
    }

    return () => {
      if (agoraInitialized) {
        cleanupAgoraResources();
      }
    };
  }, [channelName, agoraInitialized, initializeAgoraClient]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      callStartTime.current = Date.now();
      interval = setInterval(() => {
        setCallDuration(
          Math.floor((Date.now() - callStartTime.current) / 1000)
        );
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive]);

  const createLocalTracks = async () => {
    if (!AgoraRTC) {
      console.error("AgoraVideoCall: AgoraRTC not available");
      return;
    }

    try {
      console.log("AgoraVideoCall: Creating camera and microphone tracks...");

      // Create camera and microphone tracks
      localVideoTrack.current = await AgoraRTC.createCameraVideoTrack();
      localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();

      console.log("AgoraVideoCall: Local tracks created successfully");

      // Play local video track
      if (localVideoRef.current && localVideoTrack.current) {
        console.log("AgoraVideoCall: Playing local video track...");
        localVideoTrack.current.play(localVideoRef.current);
        setLocalVideoReady(true);
        console.log("AgoraVideoCall: Local video ready");
      }
    } catch (error) {
      console.error("AgoraVideoCall: Failed to create local tracks:", error);

      // Provide specific error messages
      if (error instanceof Error) {
        if (
          error.name === "NotAllowedError" ||
          error.message.includes("Permission denied")
        ) {
          console.error("AgoraVideoCall: Camera/microphone permission denied");
          // Still continue - user can join without media
        } else if (
          error.message.includes("NotFoundError") ||
          error.message.includes("no camera")
        ) {
          console.error("AgoraVideoCall: No camera/microphone found");
          // Still continue - user can join audio-only or view-only
        } else {
          console.error(
            "AgoraVideoCall: Unexpected media error:",
            error.message
          );
        }
      }
      // Don't throw - allow joining without local media
    }
  };

  const publishLocalTracks = async () => {
    try {
      if (
        agoraClient.current &&
        localVideoTrack.current &&
        localAudioTrack.current
      ) {
        await agoraClient.current.publish([
          localVideoTrack.current,
          localAudioTrack.current,
        ]);
      }
    } catch (error) {
      console.error("Failed to publish local tracks:", error);
    }
  };

  const handleUserPublished = async (...args: unknown[]) => {
    // Type guard to ensure we have the right parameters
    if (args.length < 2) return;

    const user = args[0] as IAgoraRTCRemoteUser;
    const mediaType = args[1] as "audio" | "video";

    if (!agoraClient.current) return;

    await agoraClient.current.subscribe(user, mediaType);

    if (mediaType === "video" && remoteVideoRef.current) {
      user.videoTrack?.play(remoteVideoRef.current);
    }

    if (mediaType === "audio") {
      user.audioTrack?.play();
    }

    setRemoteUsers((prev) => {
      const existingUser = prev.find((u) => u.uid === user.uid);
      if (existingUser) {
        return prev.map((u) => (u.uid === user.uid ? user : u));
      }
      return [...prev, user];
    });
  };

  const handleUserUnpublished = (...args: unknown[]) => {
    // Type guard to ensure we have the right parameters
    if (args.length < 2) return;

    const user = args[0] as IAgoraRTCRemoteUser;
    const mediaType = args[1] as "audio" | "video";

    if (mediaType === "video") {
      user.videoTrack?.stop?.();
    }
  };

  const handleUserJoined = (...args: unknown[]) => {
    // Type guard to ensure we have the right parameters
    if (args.length < 1) return;

    const user = args[0] as IAgoraRTCRemoteUser;
    console.log("User joined:", user.uid);
  };

  const handleUserLeft = (...args: unknown[]) => {
    // Type guard to ensure we have the right parameters
    if (args.length < 1) return;

    const user = args[0] as IAgoraRTCRemoteUser;
    console.log("User left:", user.uid);
    setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
  };

  const handleConnectionStateChanged = (...args: unknown[]) => {
    // Type guard to ensure we have the right parameters
    if (args.length < 2) return;

    const curState = args[0] as string;
    const revState = args[1] as string;

    console.log("Connection state changed:", curState, revState);
    if (curState === "CONNECTED") {
      setConnectionStatus("connected");
    } else if (curState === "DISCONNECTED") {
      setConnectionStatus("disconnected");
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack.current) {
      const newState = !isVideoEnabled;
      await localVideoTrack.current.setEnabled(newState);
      setIsVideoEnabled(newState);
    }
  };

  const toggleAudio = async () => {
    if (localAudioTrack.current) {
      const newState = !isAudioEnabled;
      await localAudioTrack.current.setEnabled(newState);
      setIsAudioEnabled(newState);
    }
  };

  const toggleScreenShare = async () => {
    // Simplified screen sharing toggle for now
    console.log("Screen sharing toggled:", !isScreenSharing);
    setIsScreenSharing(!isScreenSharing);
  };

  const cleanupAgoraResources = async () => {
    try {
      // Close local tracks
      localVideoTrack.current?.close();
      localAudioTrack.current?.close();

      // Leave channel and clean up
      if (agoraClient.current) {
        await agoraClient.current.leave();
        agoraClient.current = null;
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  };

  // Check for call end notifications from other users
  const checkForCallEnd = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/agora/end-call?userId=${encodeURIComponent(userId)}`
      );

      if (response.ok) {
        const data = await response.json();

        if (
          data.success &&
          data.notifications &&
          data.notifications.length > 0
        ) {
          console.log(
            "📞 AgoraVideoCall: Received call end notification",
            data.notifications
          );

          // Check if any notification is for our current session
          const currentSession = agoraCallingService.getCurrentSession();
          if (currentSession) {
            const relevantNotification = data.notifications.find(
              (notif: any) => notif.callId === currentSession.callId
            );

            if (relevantNotification) {
              console.log("📞 AgoraVideoCall: Other user ended the call");
              setConnectionStatus("disconnected");

              // Clean up and end call
              setTimeout(async () => {
                await cleanupAgoraResources();
                onCallEnd();
              }, 2000); // Give user time to see the disconnected status

              return;
            }
          }
        }
      }
    } catch (error) {
      console.error("📞 AgoraVideoCall: Error checking for call end:", error);
    }
  }, [userId, onCallEnd]);

  // Set up polling for call end notifications
  useEffect(() => {
    if (!isCallActive) return;

    const pollInterval = setInterval(checkForCallEnd, 3000); // Check every 3 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [isCallActive, checkForCallEnd]);

  const endCall = async () => {
    try {
      console.log("📞 AgoraVideoCall: User ending call");

      setIsCallActive(false);

      // Get current session and end it via service
      const currentSession = agoraCallingService.getCurrentSession();
      if (currentSession) {
        console.log(
          "📞 AgoraVideoCall: Ending call session:",
          currentSession.callId
        );
        await agoraCallingService.endCall(currentSession.callId);
      }

      // Clean up Agora resources
      await cleanupAgoraResources();

      // Notify parent component
      onCallEnd();
    } catch (error) {
      console.error("📞 AgoraVideoCall: Error ending call:", error);

      // Still clean up and close even if there's an error
      await cleanupAgoraResources();
      onCallEnd();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (!agoraInitialized) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Initializing video call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">
            {userRole === "patient"
              ? "Consultation with Doctor"
              : "Patient Consultation"}
          </h2>
          <p className="text-sm text-gray-300">
            {connectionStatus === "connecting" && "Connecting..."}
            {connectionStatus === "connected" &&
              `Duration: ${formatDuration(callDuration)} • ${
                remoteUsers.length + 1
              } participant(s)`}
            {connectionStatus === "failed" && "Connection failed"}
            {connectionStatus === "disconnected" && "Disconnected"}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-sm capitalize">{connectionStatus}</span>
          </div>
          <div className="flex items-center space-x-1 text-sm">
            <Users size={16} />
            <span>{remoteUsers.length + 1}</span>
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-gray-900">
        {/* Remote Video (Main) */}
        <div className="w-full h-full relative">
          <div ref={remoteVideoRef} className="w-full h-full" />
          {remoteUsers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video size={32} />
                </div>
                <p className="text-lg">
                  Waiting for {userRole === "patient" ? "doctor" : "patient"} to
                  join...
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Appointment ID: {appointmentId}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <div ref={localVideoRef} className="w-full h-full" />
          {(!isVideoEnabled || !localVideoReady) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
              <VideoOff className="text-white" size={24} />
            </div>
          )}
          <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
            You {isScreenSharing && "(Screen)"}
          </div>
        </div>

        {/* Call Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-gray-800 bg-opacity-90 rounded-full px-6 py-4 flex items-center space-x-4">
            {/* Video Toggle */}
            <Button
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full ${
                isVideoEnabled
                  ? "bg-gray-600 hover:bg-gray-500"
                  : "bg-red-600 hover:bg-red-500"
              }`}
            >
              {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </Button>

            {/* Audio Toggle */}
            <Button
              onClick={toggleAudio}
              className={`w-12 h-12 rounded-full ${
                isAudioEnabled
                  ? "bg-gray-600 hover:bg-gray-500"
                  : "bg-red-600 hover:bg-red-500"
              }`}
            >
              {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </Button>

            {/* Screen Share (Doctor only) */}
            {userRole === "doctor" && (
              <Button
                onClick={toggleScreenShare}
                className={`w-12 h-12 rounded-full ${
                  isScreenSharing
                    ? "bg-blue-600 hover:bg-blue-500"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
              >
                <Monitor size={20} />
              </Button>
            )}

            {/* Prescription (Doctor only) */}
            {userRole === "doctor" && onPrescriptionCreate && (
              <Button
                onClick={onPrescriptionCreate}
                className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-500"
                title="Create Prescription"
              >
                <MessageCircle size={20} />
              </Button>
            )}

            {/* Settings */}
            <Button className="w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-500">
              <Settings size={20} />
            </Button>

            {/* End Call */}
            <Button
              onClick={endCall}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500"
            >
              <PhoneOff size={24} />
            </Button>
          </div>
        </div>
      </div>

      {/* Side Panel for Notes (can be toggled) */}
      <div className="hidden lg:block w-80 bg-white border-l border-gray-200">
        <div className="p-4 h-full flex flex-col">
          <h3 className="font-semibold mb-4">Consultation Notes</h3>
          <div className="flex-1 bg-gray-50 rounded-lg p-3 mb-4">
            <textarea
              className="w-full h-full resize-none border-none outline-none bg-transparent"
              placeholder="Add notes during consultation..."
            />
          </div>

          {userRole === "doctor" && (
            <div className="space-y-2">
              <Button
                onClick={onPrescriptionCreate}
                className="w-full"
                variant="outline"
              >
                Create Prescription
              </Button>
              <Button className="w-full" variant="outline">
                Order Lab Tests
              </Button>
              <Button className="w-full" variant="outline">
                Schedule Follow-up
              </Button>
            </div>
          )}

          {userRole === "patient" && (
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>Appointment:</strong> {appointmentId}
              </p>
              <p>
                <strong>Duration:</strong> {formatDuration(callDuration)}
              </p>
              <p>
                <strong>Status:</strong> {connectionStatus}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
