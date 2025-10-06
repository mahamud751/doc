"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Video, VideoOff, Mic, MicOff, PhoneOff } from "lucide-react";

export default function VideoCallPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callInfo, setCallInfo] = useState({
    channel: "",
    token: "",
    uid: "",
    appId: ""
  });

  useEffect(() => {
    // Get call parameters from URL
    const channel = searchParams.get("channel") || "";
    const token = searchParams.get("token") || "";
    const uid = searchParams.get("uid") || "";
    const appId = searchParams.get("appId") || "";
    
    setCallInfo({ channel, token, uid, appId });
    
    // In a real implementation, you would initialize the Agora SDK here
    console.log("Initializing video call with:", { channel, token, uid, appId });
  }, [searchParams]);

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    // In a real implementation, you would toggle the video stream
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    // In a real implementation, you would toggle the audio stream
  };

  const endCall = () => {
    // In a real implementation, you would properly leave the Agora channel
    router.push("/"); // Redirect to home page
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Video Consultation</h2>
          <p className="text-sm text-gray-300">Channel: {callInfo.channel}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm">Connected</span>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-gray-900">
        {/* Remote Video (Main) */}
        <div className="w-full h-full relative flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video size={32} />
            </div>
            <p className="text-lg mb-2">Video Call in Progress</p>
            <p className="text-gray-300">Channel: {callInfo.channel}</p>
            <p className="text-gray-300">This is a mock video call interface</p>
          </div>
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg flex items-center justify-center">
          <div className="text-center text-white">
            <Video size={24} className="mx-auto mb-2" />
            <p className="text-xs">Your Video</p>
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
    </div>
  );
}