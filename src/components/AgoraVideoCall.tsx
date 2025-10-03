"use client";

import { useState, useEffect, useRef } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Monitor,
  Settings,
  Users,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

// Type definitions for Agora RTC SDK
interface IAgoraRTCClient {
  join: (
    appId: string,
    channel: string,
    token: string | null,
    uid: number
  ) => Promise<void>;
  leave: () => Promise<void>;
  publish: (tracks: any[]) => Promise<void>;
  subscribe: (user: any, mediaType: string) => Promise<void>;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback: Function) => void;
}

interface ICameraVideoTrack {
  play: (element: HTMLElement) => void;
  close: () => void;
  setEnabled: (enabled: boolean) => Promise<void>;
}

interface IMicrophoneAudioTrack {
  play: () => void;
  close: () => void;
  setEnabled: (enabled: boolean) => Promise<void>;
}

interface IRemoteVideoTrack {
  play: (element: HTMLElement) => void;
  stop: () => void;
}

interface IRemoteAudioTrack {
  play: () => void;
  stop: () => void;
}

// Dynamically import AgoraRTC
let AgoraRTC: any;

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
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [localVideoReady, setLocalVideoReady] = useState(false);
  const [agoraInitialized, setAgoraInitialized] = useState(false);

  // Video containers
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const callStartTime = useRef<number>(0);

  // Generate unique UID based on user ID
  const uid = parseInt(userId) || Math.floor(Math.random() * 10000);

  // Initialize Agora SDK
  useEffect(() => {
    const initAgora = async () => {
      if (typeof window !== "undefined") {
        // Dynamically import AgoraRTC only on client side
        const AgoraRTCModule = await import("agora-rtc-sdk-ng");
        AgoraRTC = AgoraRTCModule.default;
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
  }, [channelName, agoraInitialized]);

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
        throw new Error("Failed to generate Agora token");
      }

      return await response.json();
    } catch (error) {
      console.error("Token generation error:", error);
      throw error;
    }
  };

  const initializeAgoraClient = async () => {
    if (!AgoraRTC) return;

    try {
      setConnectionStatus("connecting");

      // Get Agora token (can be null for testing)
      let tokenData;
      try {
        tokenData = await generateAgoraToken();
      } catch (error) {
        console.warn(
          "Failed to generate Agora token, proceeding without token:",
          error
        );
        // Use null token for testing purposes
        // Make sure we have a valid App ID
        const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";

        // Validate App ID format before using it
        if (!appId || appId.length !== 32) {
          throw new Error("Invalid Agora App ID configuration");
        }

        tokenData = {
          appId: appId,
          token: null,
          channel: channelName,
          uid: uid,
          expires: 0,
        };
      }

      // Validate that we have a valid App ID
      if (!tokenData.appId || tokenData.appId.length !== 32) {
        throw new Error("Invalid Agora App ID received from token endpoint");
      }

      // Create Agora client
      agoraClient.current = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      });

      // Set up event handlers
      if (agoraClient.current) {
        agoraClient.current.on("user-published", handleUserPublished);
        agoraClient.current.on("user-unpublished", handleUserUnpublished);
        agoraClient.current.on("user-joined", handleUserJoined);
        agoraClient.current.on("user-left", handleUserLeft);
        agoraClient.current.on(
          "connection-state-changed",
          handleConnectionStateChanged
        );

        // Join channel
        await agoraClient.current.join(
          tokenData.appId,
          channelName,
          tokenData.token || null, // Use null if token is empty
          uid
        );

        // Create and publish local tracks
        await createLocalTracks();
        await publishLocalTracks();

        setConnectionStatus("connected");
        setIsCallActive(true);
      }
    } catch (error) {
      console.error("Failed to initialize Agora client:", error);
      setConnectionStatus("failed");
    }
  };

  const createLocalTracks = async () => {
    if (!AgoraRTC) return;

    try {
      // Create camera and microphone tracks
      localVideoTrack.current = await AgoraRTC.createCameraVideoTrack();
      localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();

      // Play local video track
      if (localVideoRef.current && localVideoTrack.current) {
        localVideoTrack.current.play(localVideoRef.current);
        setLocalVideoReady(true);
      }
    } catch (error) {
      console.error("Failed to create local tracks:", error);
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

  const handleUserPublished = async (
    user: any,
    mediaType: "audio" | "video"
  ) => {
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

  const handleUserUnpublished = (user: any, mediaType: "audio" | "video") => {
    if (mediaType === "video") {
      user.videoTrack?.stop();
    }
  };

  const handleUserJoined = (user: any) => {
    console.log("User joined:", user.uid);
  };

  const handleUserLeft = (user: any) => {
    console.log("User left:", user.uid);
    setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
  };

  const handleConnectionStateChanged = (curState: string, revState: string) => {
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

  const endCall = async () => {
    setIsCallActive(false);
    await cleanupAgoraResources();
    onCallEnd();
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
