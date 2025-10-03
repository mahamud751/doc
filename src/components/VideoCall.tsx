"use client";

import { useState, useEffect, useRef } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface VideoCallProps {
  channelName: string;
  userRole: "patient" | "doctor";
  onCallEnd: () => void;
}

export default function VideoCall({
  channelName,
  userRole,
  onCallEnd,
}: VideoCallProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callStartTime = useRef<number>(0);

  // Mock Agora client - In real implementation, initialize Agora SDK here
  const agoraClient = useRef<unknown>(null);

  useEffect(() => {
    // Initialize Agora SDK
    initializeAgoraClient();

    return () => {
      // Cleanup
      const currentClient = agoraClient.current;
      if (currentClient) {
        (currentClient as { leave: () => void }).leave();
      }
    };
  }, [channelName]);

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

  const initializeAgoraClient = async () => {
    try {
      // Mock implementation - replace with actual Agora SDK
      setConnectionStatus("connected");
      setIsCallActive(true);

      // Simulate getting local video stream
      if (localVideoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          localVideoRef.current.srcObject = stream;
        } catch (error) {
          console.error("Error accessing media devices:", error);
        }
      }
    } catch (error) {
      console.error("Failed to initialize video call:", error);
      setConnectionStatus("failed");
    }
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    // In real implementation: agoraClient.current.enableVideo(!isVideoEnabled)
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    // In real implementation: agoraClient.current.enableAudio(!isAudioEnabled)
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    // In real implementation: implement screen sharing
  };

  const endCall = () => {
    setIsCallActive(false);
    const currentClient = agoraClient.current;
    if (currentClient) {
      (currentClient as { leave: () => void }).leave();
    }
    onCallEnd();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

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
              `Duration: ${formatDuration(callDuration)}`}
            {connectionStatus === "failed" && "Connection failed"}
          </p>
        </div>
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
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-gray-900">
        {/* Remote Video (Main) */}
        <div className="w-full h-full relative">
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
          />
          {!isCallActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video size={32} />
                </div>
                <p className="text-lg">Waiting for connection...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
              <VideoOff className="text-white" size={24} />
            </div>
          )}
          <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
            You
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

      {/* Side Panel for Chat/Notes (can be toggled) */}
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
              <Button className="w-full" variant="outline">
                Create Prescription
              </Button>
              <Button className="w-full" variant="outline">
                Order Lab Tests
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
