"use client";

import { Button } from "@/components/ui/Button";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";

// Agora types
interface AgoraClient {
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
  subscribe: (user: unknown, mediaType: string) => Promise<void>;
  leave: () => Promise<void>;
  join: (
    appId: string,
    channelName: string,
    token: string | null,
    uid: number
  ) => Promise<void>;
  publish: (tracks: unknown[]) => Promise<void>;
}

interface AgoraTrack {
  close: () => void;
  setMuted: (muted: boolean) => void;
  play?: (element: HTMLDivElement) => void;
}

interface RemoteUser {
  uid: string;
  videoTrack?: unknown;
  audioTrack?: unknown;
}

function DoctorVideoCallContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const channelName = searchParams.get("channel") || "";
  const token = searchParams.get("token") || "";
  const uid = searchParams.get("uid") || "";
  const appId = searchParams.get("appId") || "";

  // States
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<
    "waiting" | "connecting" | "connected"
  >("waiting");

  // Refs
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<AgoraClient | null>(null);
  const localAudioTrackRef = useRef<AgoraTrack | null>(null);
  const localVideoTrackRef = useRef<AgoraTrack | null>(null);
  const isMountedRef = useRef(true);

  const [AgoraRTC, setAgoraRTC] = useState<{
    createClient: (config: unknown) => unknown;
    createMicrophoneAudioTrack: () => Promise<unknown>;
    createCameraVideoTrack: () => Promise<unknown>;
  } | null>(null);

  // Cleanup function
  const cleanup = async () => {
    try {
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }
      if (isMountedRef.current) {
        setIsConnected(false);
        setRemoteUsers([]);
      }
    } catch (error) {
      console.error("❌ DOCTOR: Cleanup error:", error);
    }
  };

  // Initialize Agora
  const initializeAgora = async () => {
    if (!AgoraRTC || !channelName || !uid || !appId) return;

    try {
      setCallStatus("connecting");

      // Create client
      clientRef.current = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
        role: "host",
      }) as AgoraClient;

      // Set up event listeners
      console.log("🔗 DOCTOR: Setting up event listeners for remote video...");
      clientRef.current.on("user-published", async (...args: unknown[]) => {
        const user = args[0] as any;
        const mediaType = args[1] as "audio" | "video";
        console.log("🎉 DOCTOR: Patient published", mediaType);

        try {
          await clientRef.current!.subscribe(user, mediaType);

          if (
            mediaType === "video" &&
            user.videoTrack &&
            remoteVideoRef.current
          ) {
            user.videoTrack.play(remoteVideoRef.current);
            setIsConnected(true);
            setCallStatus("connected");
            console.log(
              "✅ DOCTOR: PATIENT VIDEO CONNECTED! Both cameras should now be visible."
            );
          }

          if (mediaType === "audio" && user.audioTrack) {
            user.audioTrack.play();
          }

          setRemoteUsers((prev) => {
            const exists = prev.find((u) => u.uid === user.uid);
            return exists ? prev : [...prev, user];
          });
        } catch (error) {
          console.error("❌ DOCTOR: Subscribe error:", error);
        }
      });

      clientRef.current.on("user-unpublished", (...args: unknown[]) => {
        const user = args[0] as any;
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        if (remoteUsers.length <= 1) {
          setIsConnected(false);
          setCallStatus("waiting");
        }
      });

      // Create local tracks
      console.log("📹 DOCTOR: Creating local camera and microphone tracks...");
      const [audioTrack, videoTrack] = await Promise.all([
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack(),
      ]);
      console.log("✅ DOCTOR: Local tracks created successfully");

      localAudioTrackRef.current = audioTrack as AgoraTrack;
      localVideoTrackRef.current = videoTrack as AgoraTrack;

      // Play local video IMMEDIATELY - don't wait for remote connection
      if (localVideoTrackRef.current?.play && localVideoRef.current) {
        localVideoTrackRef.current.play(localVideoRef.current);
        console.log("✅ DOCTOR: Local camera started - should be visible now!");
      }

      // Join channel
      await clientRef.current.join(
        appId,
        channelName,
        token || null,
        Number(uid)
      );
      console.log("✅ DOCTOR: Joined channel");

      // Publish tracks
      await clientRef.current.publish([
        localAudioTrackRef.current,
        localVideoTrackRef.current,
      ]);
      console.log("✅ DOCTOR: Published tracks, ready for patient");

      // Notify joining
      await fetch("/api/agora/channel-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: channelName,
          uid: Number(uid),
          role: "DOCTOR",
          action: "join",
        }),
      });

      setCallStatus("waiting");
    } catch (error) {
      console.error("❌ DOCTOR: Initialize error:", error);
      setError("Failed to connect to video call");
      setCallStatus("waiting");
    }
  };

  // Load Agora SDK
  useEffect(() => {
    isMountedRef.current = true;

    if (typeof window !== "undefined") {
      import("agora-rtc-sdk-ng")
        .then((agora) => {
          if (isMountedRef.current) {
            setAgoraRTC(agora.default as any);
          }
        })
        .catch((err) => {
          console.error("❌ Failed to load Agora SDK:", err);
          setError("Failed to load video call library");
        });
    }

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  // Initialize when SDK is ready
  useEffect(() => {
    if (AgoraRTC && channelName && uid && appId) {
      // Add small delay to ensure DOM is ready
      const initTimer = setTimeout(() => {
        initializeAgora();
      }, 500);

      return () => clearTimeout(initTimer);
    }
  }, [AgoraRTC, channelName, uid, appId]);

  // 🔥 PROGRESSIVE CONNECTION STATUS: Poll for patient presence
  useEffect(() => {
    if (!channelName || isConnected) return;

    let pollInterval: NodeJS.Timeout;

    const checkPatientPresence = async () => {
      try {
        const response = await fetch(
          `/api/agora/channel-status?channel=${encodeURIComponent(channelName)}`
        );
        if (response.ok) {
          const data = await response.json();
          const patientPresent = data.participants?.some(
            (p: any) => p.role === "PATIENT"
          );
          const doctorPresent = data.participants?.some(
            (p: any) => p.role === "DOCTOR"
          );

          if (patientPresent && doctorPresent && !isConnected) {
            console.log(
              "🔥 DOCTOR: Both patient and doctor in channel - should connect soon!"
            );
            setCallStatus("connecting"); // Patient connecting video
          } else if (patientPresent) {
            console.log(
              "✅ DOCTOR: Patient joined channel - waiting for video connection"
            );
            setCallStatus("connecting");
          } else {
            setCallStatus("waiting"); // Still waiting for patient
          }
        }
      } catch (error) {
        console.log("Error checking patient presence:", error);
      }
    };

    // Check every 2 seconds
    pollInterval = setInterval(checkPatientPresence, 2000);
    checkPatientPresence(); // Check immediately

    return () => {
      clearInterval(pollInterval);
    };
  }, [channelName, isConnected]);

  // Control functions with real functionality
  const toggleMute = () => {
    if (localAudioTrackRef.current) {
      const newMuted = !isMuted;
      localAudioTrackRef.current.setMuted(newMuted);
      setIsMuted(newMuted);
      console.log(`🔊 DOCTOR: Audio ${newMuted ? "muted" : "unmuted"}`);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrackRef.current) {
      const newVideoOff = !isVideoOff;
      localVideoTrackRef.current.setMuted(newVideoOff);
      setIsVideoOff(newVideoOff);
      console.log(`📹 DOCTOR: Video ${newVideoOff ? "disabled" : "enabled"}`);
    }
  };

  const hangUp = async () => {
    try {
      // Notify leaving
      await fetch("/api/agora/channel-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: channelName,
          uid: Number(uid),
          role: "DOCTOR",
          action: "leave",
        }),
      });

      await cleanup();
      router.push("/doctor/dashboard");
    } catch (error) {
      console.error("❌ Hang up error:", error);
      router.push("/doctor/dashboard");
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md p-8">
          <h1 className="text-2xl font-bold mb-4 text-red-400">
            Video Call Error
          </h1>
          <p className="mb-6">{error}</p>
          <Button onClick={() => router.push("/doctor/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!channelName || !uid || !appId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Invalid Call Parameters</h1>
          <Button onClick={() => router.push("/doctor/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Remote Video (Patient) */}
      <div className="w-full h-screen bg-black relative">
        {!isConnected || !remoteUsers.length ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              {callStatus === "waiting" && (
                <>
                  <p className="text-lg">👨‍⚕️ Waiting for patient...</p>
                  <p className="text-sm text-gray-300 mt-2">
                    Ready to accept call
                  </p>
                </>
              )}
              {callStatus === "connecting" && (
                <>
                  <p className="text-lg">🔗 Patient connecting video...</p>
                  <p className="text-sm text-gray-300 mt-2">
                    Establishing video connection
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Patient's video (remote) */}
            <div ref={remoteVideoRef} className="w-full h-full" />
            {/* Patient label overlay */}
            <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-2 rounded-lg text-base font-semibold shadow-lg">
              🤒 Patient
            </div>
          </>
        )}
      </div>

      {/* Local Video (Doctor) - Always visible like Messenger */}
      <div className="absolute top-4 right-4 w-2/5 h-2/5 bg-gray-800 rounded-lg border-4 border-blue-500 overflow-hidden shadow-2xl z-10">
        {!isVideoOff ? (
          <>
            <div ref={localVideoRef} className="w-full h-full" />
            <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-3 py-2 rounded text-sm font-bold shadow-lg">
              👨‍⚕️ You (Doctor)
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gray-600 flex flex-col items-center justify-center">
            <VideoOff className="h-16 w-16 text-white mb-3" />
            <span className="text-white text-base font-semibold">
              Camera Off
            </span>
            <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-3 py-2 rounded text-sm font-bold shadow-lg">
              👨‍⚕️ You (Doctor)
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <div
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            isConnected
              ? "bg-green-500 text-white"
              : callStatus === "connecting"
              ? "bg-blue-500 text-white"
              : "bg-yellow-500 text-gray-900"
          }`}
        >
          {isConnected
            ? "🎥 Connected with Patient"
            : callStatus === "connecting"
            ? "🔗 Patient Joining..."
            : "👨‍⚕️ Ready for Call"}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
        <Button
          onClick={toggleMute}
          className={`p-4 rounded-full transition-all ${
            isMuted
              ? "bg-red-500 hover:bg-red-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {isMuted ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

        <Button
          onClick={hangUp}
          className="p-4 rounded-full bg-red-500 hover:bg-red-600"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>

        <Button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-all ${
            isVideoOff
              ? "bg-red-500 hover:bg-red-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {isVideoOff ? (
            <VideoOff className="h-6 w-6" />
          ) : (
            <Video className="h-6 w-6" />
          )}
        </Button>
      </div>
    </div>
  );
}

function VideoCallLoading() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>Loading video call...</p>
      </div>
    </div>
  );
}

export default function DoctorVideoCall() {
  return (
    <Suspense fallback={<VideoCallLoading />}>
      <DoctorVideoCallContent />
    </Suspense>
  );
}
