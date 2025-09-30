"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Settings,
  Users,
  MessageSquare,
  Camera,
  CameraOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";

export default function VideoCallPage() {
  const router = useRouter();
  const params = useParams();
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState("DISCONNECTED");

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const callStartTime = useRef<number>(0);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isJoined) {
      callStartTime.current = Date.now();
      durationInterval.current = setInterval(() => {
        setCallDuration(
          Math.floor((Date.now() - callStartTime.current) / 1000)
        );
      }, 1000);
    } else {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [isJoined]);

  const initializeCall = async () => {
    try {
      setLoading(true);

      // Get appointment details and generate token
      const appointmentId = params.id as string;
      const token = localStorage.getItem("authToken");

      if (!token) {
        router.push("/auth/login");
        return;
      }

      // Get Agora token for this call
      const response = await fetch("/api/agora/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channelName: appointmentId,
          uid: 0, // Let Agora assign UID
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get video call token");
      }

      const { token: agoraToken, appId } = await response.json();

      // Initialize Agora client
      const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setClient(agoraClient);

      // Setup event listeners
      agoraClient.on("user-published", handleUserPublished);
      agoraClient.on("user-unpublished", handleUserUnpublished);
      agoraClient.on("user-left", handleUserLeft);
      agoraClient.on("connection-state-changed", (state) => {
        setConnectionState(state);
      });

      // Join the channel
      await agoraClient.join(appId, appointmentId, agoraToken, 0);
      setIsJoined(true);

      // Create and publish local tracks
      await createAndPublishTracks(agoraClient);
    } catch (error: any) {
      console.error("Error initializing call:", error);
      setError(error.message || "Failed to join video call");
    } finally {
      setLoading(false);
    }
  };

  const createAndPublishTracks = async (agoraClient: IAgoraRTCClient) => {
    try {
      // Create audio and video tracks
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const videoTrack = await AgoraRTC.createCameraVideoTrack();

      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);

      // Play local video
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      // Publish tracks
      await agoraClient.publish([audioTrack, videoTrack]);
    } catch (error) {
      console.error("Error creating tracks:", error);
      setError("Failed to access camera/microphone");
    }
  };

  const handleUserPublished = async (
    user: IAgoraRTCRemoteUser,
    mediaType: "audio" | "video"
  ) => {
    if (!client) return;

    await client.subscribe(user, mediaType);

    if (mediaType === "video") {
      setRemoteUsers((prev) => [
        ...prev.filter((u) => u.uid !== user.uid),
        user,
      ]);

      // Play remote video
      if (remoteVideoRef.current && user.videoTrack) {
        user.videoTrack.play(remoteVideoRef.current);
      }
    }

    if (mediaType === "audio" && user.audioTrack) {
      user.audioTrack.play();
    }
  };

  const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
    setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
  };

  const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
    setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
  };

  const toggleMute = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const endCall = async () => {
    await cleanup();
    router.push("/patient/dashboard");
  };

  const cleanup = async () => {
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
    }
    if (client && isJoined) {
      await client.leave();
    }
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p>Connecting to video call...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhoneOff className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mr-4"
          >
            Go Back
          </Button>
          <Button onClick={initializeCall}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4 text-white">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionState === "CONNECTED"
                  ? "bg-green-500"
                  : connectionState === "CONNECTING"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm font-medium">
              {isJoined
                ? `Call Duration: ${formatDuration(callDuration)}`
                : "Connecting..."}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-white">
            <Users className="w-5 h-5" />
            <span className="text-sm">{remoteUsers.length + 1}</span>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="relative w-full h-screen">
        {/* Remote Video (Main) */}
        <div className="absolute inset-0">
          {remoteUsers.length > 0 ? (
            <div
              ref={remoteVideoRef}
              className="w-full h-full bg-gray-800"
            ></div>
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <div className="text-center text-white">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Waiting for other participant...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-20 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-white/20">
          {isVideoEnabled ? (
            <div ref={localVideoRef} className="w-full h-full"></div>
          ) : (
            <div className="w-full h-full bg-gray-600 flex items-center justify-center">
              <CameraOff className="w-8 h-8 text-white opacity-50" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center justify-center space-x-6 py-6">
          <Button
            onClick={toggleMute}
            variant={isMuted ? "destructive" : "outline"}
            className={`w-14 h-14 rounded-full ${
              isMuted
                ? "bg-red-600 hover:bg-red-700"
                : "bg-white/20 hover:bg-white/30"
            }`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>

          <Button
            onClick={toggleVideo}
            variant={!isVideoEnabled ? "destructive" : "outline"}
            className={`w-14 h-14 rounded-full ${
              !isVideoEnabled
                ? "bg-red-600 hover:bg-red-700"
                : "bg-white/20 hover:bg-white/30"
            }`}
          >
            {isVideoEnabled ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </Button>

          <Button
            onClick={endCall}
            variant="destructive"
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>

          <Button
            variant="outline"
            className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>

          <Button
            variant="outline"
            className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30"
          >
            <Settings className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
