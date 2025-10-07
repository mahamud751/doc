"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

// Create a separate component for the video call content
function DoctorVideoCallContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get parameters from URL - this is the correct way to pass data to client components
  const channelName = searchParams.get("channel") || "";
  const token = searchParams.get("token") || "";
  const uid = searchParams.get("uid") || "";
  const appId = searchParams.get("appId") || ""; // App ID should come from URL params, not env vars

  // Log all parameters for debugging
  useEffect(() => {
    console.log("Video call parameters:", { channelName, token, uid, appId });
    console.log("App ID length:", appId.length);
  }, [channelName, token, uid, appId]);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<unknown[]>([]);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  type AgoraClient = {
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    subscribe: (user: unknown, mediaType: string) => Promise<void>;
    leave: () => Promise<void>;
    join: (
      appId: string,
      channelName: string,
      token: string | null,
      uid: number
    ) => Promise<void>;
    publish: (tracks: unknown[]) => Promise<void>;
    createClient: (config: unknown) => unknown;
  };

  type AgoraTrack = {
    close: () => void;
    setMuted: (muted: boolean) => void;
    play?: (element: HTMLDivElement) => void;
  };

  const clientRef = useRef<AgoraClient | null>(null);
  const localAudioTrackRef = useRef<AgoraTrack | null>(null);
  const localVideoTrackRef = useRef<AgoraTrack | null>(null);
  const isMountedRef = useRef(true);
  const cancelTokenRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  // Dynamically import AgoraRTC only on the client side
  const [AgoraRTC, setAgoraRTC] = useState<{
    createClient: (config: unknown) => unknown;
    createMicrophoneAudioTrack: () => Promise<unknown>;
    createCameraVideoTrack: () => Promise<unknown>;
  } | null>(null);

  useEffect(() => {
    // Set isMounted ref to true
    isMountedRef.current = true;
    cancelTokenRef.current = { cancelled: false };

    // Load AgoraRTC only on client side
    if (typeof window !== "undefined") {
      import("agora-rtc-sdk-ng")
        .then((agora) => {
          if (isMountedRef.current && !cancelTokenRef.current.cancelled) {
            setAgoraRTC(
              agora.default as {
                createClient: (config: unknown) => unknown;
                createMicrophoneAudioTrack: () => Promise<unknown>;
                createCameraVideoTrack: () => Promise<unknown>;
              }
            );
          }
        })
        .catch((err: unknown) => {
          console.error("Failed to load AgoraRTC:", err);
          if (isMountedRef.current && !cancelTokenRef.current.cancelled) {
            setError(
              "Failed to load video call library. Please refresh the page."
            );
          }
        });
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      cancelTokenRef.current.cancelled = true;
      cleanup();
    };
  }, []);

  const initializeAgora = useCallback(async () => {
    // Prevent multiple initializations
    if (
      initializing ||
      !isMountedRef.current ||
      cancelTokenRef.current.cancelled
    ) {
      return;
    }

    setInitializing(true);
    setError(null);

    try {
      if (
        !AgoraRTC ||
        !isMountedRef.current ||
        cancelTokenRef.current.cancelled
      ) {
        return;
      }

      console.log("Initializing Agora with params:", {
        appId: appId.substring(0, 8) + "...",
        channelName,
        uid,
      });

      // Validate App ID one more time before use
      if (!appId || appId.length !== 32) {
        throw new Error(
          `Invalid App ID: ${appId} (length: ${appId?.length || 0})`
        );
      }

      // Additional validation - check if App ID is valid hex
      const hexRegex = /^[0-9a-fA-F]+$/;
      if (!hexRegex.test(appId)) {
        throw new Error("App ID contains invalid characters");
      }

      // Create Agora client
      if (!clientRef.current && AgoraRTC) {
        clientRef.current = AgoraRTC.createClient({
          mode: "rtc",
          codec: "vp8",
          role: "host",
        }) as AgoraClient;
        console.log("🔧 DOCTOR: Agora client created");
      }

      // CRITICAL FIX: Set up event listeners BEFORE joining channel
      const handleUserPublished = async (
        user: { uid: string; videoTrack?: unknown; audioTrack?: unknown },
        mediaType: "audio" | "video"
      ) => {
        if (!isMountedRef.current || cancelTokenRef.current.cancelled) return;

        console.log("🎉 DOCTOR: USER PUBLISHED EVENT:", {
          userUid: user.uid,
          mediaType,
          myUid: uid,
          channelName,
          hasVideoTrack: !!user.videoTrack,
          hasAudioTrack: !!user.audioTrack,
        });

        try {
          if (clientRef.current) {
            console.log(
              "📺 DOCTOR: Subscribing to user:",
              user.uid,
              "for",
              mediaType
            );
            await clientRef.current.subscribe(user, mediaType);
            console.log(
              "✅ DOCTOR: Successfully subscribed to user:",
              user.uid,
              "for",
              mediaType
            );
          }

          if (mediaType === "video") {
            const remoteVideoTrack = user.videoTrack;
            if (remoteVideoTrack && remoteVideoRef.current) {
              console.log(
                "🎥 DOCTOR: Playing remote video track for user:",
                user.uid
              );
              (
                remoteVideoTrack as { play: (element: HTMLDivElement) => void }
              ).play(remoteVideoRef.current);
              console.log("✅ DOCTOR: Remote video track playing");
            }
          }

          if (mediaType === "audio") {
            const remoteAudioTrack = user.audioTrack;
            if (remoteAudioTrack) {
              console.log(
                "🔊 DOCTOR: Playing remote audio track for user:",
                user.uid
              );
              (remoteAudioTrack as { play: () => void }).play();
              console.log("✅ DOCTOR: Remote audio track playing");
            }
          }

          if (isMountedRef.current && !cancelTokenRef.current.cancelled) {
            setRemoteUsers((prev) => {
              const exists = prev.find(
                (u) => (u as { uid: string }).uid === user.uid
              );
              if (exists) {
                console.log(
                  "👤 DOCTOR: User already in remote users list:",
                  user.uid
                );
                return prev;
              }
              console.log(
                "➕ DOCTOR: Adding user to remote users list:",
                user.uid
              );
              return [...prev, user];
            });

            setIsConnected(true);
            console.log(
              "✅ DOCTOR: Connection established with user:",
              user.uid
            );
          }
        } catch (error) {
          if (
            !(
              error instanceof Error &&
              error.name === "AgoraRTCError" &&
              error.message.includes("OPERATION_ABORTED")
            )
          ) {
            console.error("❌ DOCTOR: Error handling user-published:", error);
          }
        }
      };

      const handleUserUnpublished = (user: { uid: string }) => {
        if (isMountedRef.current && !cancelTokenRef.current.cancelled) {
          setRemoteUsers((prev) =>
            prev.filter((u) => (u as { uid: string }).uid !== user.uid)
          );
        }
      };

      const handleUserLeft = (user: { uid: string }) => {
        if (isMountedRef.current && !cancelTokenRef.current.cancelled) {
          setRemoteUsers((prev) =>
            prev.filter((u) => (u as { uid: string }).uid !== user.uid)
          );
        }
      };

      // Set up event listeners BEFORE joining
      if (clientRef.current) {
        console.log("📡 DOCTOR: Setting up event listeners BEFORE joining...");
        clientRef.current.on(
          "user-published",
          handleUserPublished as (...args: unknown[]) => void
        );
        clientRef.current.on(
          "user-unpublished",
          handleUserUnpublished as (...args: unknown[]) => void
        );
        clientRef.current.on(
          "user-left",
          handleUserLeft as (...args: unknown[]) => void
        );
        console.log("✅ DOCTOR: Event listeners registered successfully");
      }

      // Create local tracks BEFORE joining
      console.log("🎥 DOCTOR: Creating local tracks...");
      if (AgoraRTC) {
        const [audioTrack, videoTrack] = await Promise.all([
          (
            AgoraRTC as { createMicrophoneAudioTrack: () => Promise<unknown> }
          ).createMicrophoneAudioTrack(),
          (
            AgoraRTC as { createCameraVideoTrack: () => Promise<unknown> }
          ).createCameraVideoTrack(),
        ]);

        if (!cancelTokenRef.current.cancelled) {
          localAudioTrackRef.current = audioTrack as AgoraTrack;
          localVideoTrackRef.current = videoTrack as AgoraTrack;
          console.log("✅ DOCTOR: Local tracks created successfully");
        }
      }

      // Play local video
      if (
        localVideoTrackRef.current &&
        localVideoRef.current &&
        isMountedRef.current &&
        !cancelTokenRef.current.cancelled
      ) {
        if (localVideoTrackRef.current.play) {
          localVideoTrackRef.current.play(localVideoRef.current);
          console.log("✅ DOCTOR: Local video playing");
        }
      }

      // Join the channel
      console.log("🚪 DOCTOR: Joining channel...");
      if (!isMountedRef.current || cancelTokenRef.current.cancelled) return;

      const uidNumber = Number(uid);
      if (isNaN(uidNumber)) {
        throw new Error("Invalid user ID format");
      }

      // Join with token
      if (clientRef.current) {
        await clientRef.current.join(
          appId,
          channelName,
          token || null,
          uidNumber
        );
        console.log("✅ DOCTOR: Successfully joined channel");
      }

      // Publish local tracks AFTER joining
      if (
        isMountedRef.current &&
        clientRef.current &&
        !cancelTokenRef.current.cancelled &&
        localAudioTrackRef.current &&
        localVideoTrackRef.current
      ) {
        console.log("📤 DOCTOR: Publishing local tracks...");
        await clientRef.current.publish(
          [localAudioTrackRef.current, localVideoTrackRef.current].filter(
            Boolean
          ) as unknown[]
        );
        console.log("✅ DOCTOR: Local tracks published successfully");
      }

      if (isMountedRef.current && !cancelTokenRef.current.cancelled) {
        setIsConnected(true);
      }
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.name === "AgoraRTCError" &&
        error.message.includes("OPERATION_ABORTED")
      ) {
        return;
      }

      console.error("❌ DOCTOR: Error initializing Agora:", error);

      if (isMountedRef.current && !cancelTokenRef.current.cancelled) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(`Failed to initialize video call: ${errorMessage}`);
      }
    } finally {
      if (isMountedRef.current && !cancelTokenRef.current.cancelled) {
        setInitializing(false);
      }
    }
  }, [AgoraRTC, appId, channelName, token, uid, initializing]);

  useEffect(() => {
    // Validate required parameters
    if (!channelName || !uid || !appId) {
      console.error("Missing required parameters:", {
        channelName,
        uid,
        appId,
      });
      if (isMountedRef.current && !cancelTokenRef.current.cancelled) {
        setError(
          "Missing required video call parameters. Redirecting to dashboard..."
        );
        setTimeout(() => {
          if (isMountedRef.current && !cancelTokenRef.current.cancelled) {
            router.push("/doctor/dashboard");
          }
        }, 3000);
      }
      return;
    }

    // Validate App ID format
    if (appId.length !== 32) {
      console.error("Invalid App ID length:", appId.length);
      if (isMountedRef.current && !cancelTokenRef.current.cancelled) {
        setError(
          `Invalid App ID format. Expected 32 characters, got ${appId.length}. For debugging, visit: /agora-debug`
        );
        return;
      }
    }

    // Check if App ID contains only valid characters
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (!hexRegex.test(appId)) {
      console.error("Invalid App ID characters");
      if (isMountedRef.current && !cancelTokenRef.current.cancelled) {
        setError(
          "Invalid App ID format. App ID should only contain hexadecimal characters. For debugging, visit: /agora-debug"
        );
        return;
      }
    }

    if (
      AgoraRTC &&
      !initializing &&
      isMountedRef.current &&
      !cancelTokenRef.current.cancelled
    ) {
      initializeAgora();
    }

    return () => {
      cancelTokenRef.current.cancelled = true;
      cleanup();
    };
  }, [
    AgoraRTC,
    channelName,
    token,
    uid,
    appId,
    initializing,
    router,
    initializeAgora,
  ]);

  const cleanup = async () => {
    try {
      // Close local tracks
      if (localAudioTrackRef.current) {
        try {
          localAudioTrackRef.current.close();
        } catch (e) {
          // Ignore errors during cleanup
        }
        localAudioTrackRef.current = null;
      }

      if (localVideoTrackRef.current) {
        try {
          localVideoTrackRef.current.close();
        } catch (e) {
          // Ignore errors during cleanup
        }
        localVideoTrackRef.current = null;
      }

      // Leave channel
      if (clientRef.current) {
        try {
          await clientRef.current.leave();
        } catch (error) {
          // Ignore cancellation errors during cleanup
          if (
            !(
              error instanceof Error &&
              error.name === "AgoraRTCError" &&
              error.message.includes("OPERATION_ABORTED")
            )
          ) {
            console.log("Error leaving channel:", error);
          }
        }
        clientRef.current = null;
      }

      if (isMountedRef.current) {
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  };

  const leaveChannel = async () => {
    try {
      await cleanup();
      if (isMountedRef.current && !cancelTokenRef.current.cancelled) {
        router.push("/doctor/dashboard");
      }
    } catch (error) {
      console.error("Error leaving channel:", error);
    }
  };

  const toggleMute = () => {
    if (localAudioTrackRef.current) {
      if (isMuted) {
        localAudioTrackRef.current.setMuted(false);
      } else {
        localAudioTrackRef.current.setMuted(true);
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrackRef.current) {
      if (isVideoOff) {
        localVideoTrackRef.current.setMuted(false);
      } else {
        localVideoTrackRef.current.setMuted(true);
      }
      setIsVideoOff(!isVideoOff);
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-2xl p-8">
          <h1 className="text-2xl font-bold mb-4 text-red-400">
            Video Call Error
          </h1>
          <p className="mb-6 text-lg">{error}</p>

          {error.includes("vendor key") && (
            <div className="mb-6 p-4 bg-yellow-900 rounded-lg">
              <h2 className="font-bold mb-2">Recommended Solution:</h2>
              <p className="mb-3">
                Your App ID format is correct, but Agora&apos;s servers
                aren&apos;t recognizing it. This typically happens when:
              </p>
              <ul className="text-left list-disc pl-5 mb-3 space-y-1">
                <li>The Agora project is not properly configured</li>
                <li>The project has been suspended or deactivated</li>
                <li>The App ID belongs to a different Agora account</li>
                <li>The App ID has been revoked or is invalid</li>
                <li>
                  You&apos;re using a static key with a dynamic token
                  (CAN_NOT_GET_GATEWAY_SERVER)
                </li>
              </ul>
              <p>
                <strong>Solution:</strong> You&apos;re using a static key with a
                dynamic token (CAN_NOT_GET_GATEWAY_SERVER). This is a common
                configuration issue. Try these steps:
              </p>
            </div>
          )}

          {(error.includes("token") || error.includes("Token")) && (
            <div className="mb-6 p-4 bg-yellow-900 rounded-lg">
              <h2 className="font-bold mb-2">Token Issue:</h2>
              <p className="mb-3">
                The video call token appears to be invalid or expired. This can
                happen when:
              </p>
              <ul className="text-left list-disc pl-5 mb-3 space-y-1">
                <li>The token has expired (tokens are valid for 1 hour)</li>
                <li>There was a network issue during token generation</li>
                <li>The App ID or channel name has changed</li>
                <li>
                  There&apos;s a temporary issue with Agora&apos;s servers
                </li>
              </ul>
              <p>
                <strong>Solution:</strong> Return to your dashboard and try
                joining the call again. This will generate a fresh token. If the
                problem persists, try refreshing the page or check your internet
                connection.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/doctor/dashboard")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Return to Dashboard
            </Button>

            {error.includes("vendor key") && (
              <Button
                onClick={() => router.push("/agora-debug")}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Run Debug Tool
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show parameter validation state
  if (!channelName || !uid || !appId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">
            Invalid Video Call Parameters
          </h1>
          <p className="mb-6">
            Missing required information to join the video call.
          </p>
          <p className="mb-6 text-gray-300">Redirecting to dashboard...</p>
          <Button
            onClick={() => router.push("/doctor/dashboard")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Return to Dashboard Now
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state while AgoraRTC is loading
  if (!AgoraRTC) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading video call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Video Container */}
      <div className="relative h-screen">
        {/* Remote Video */}
        <div ref={remoteVideoRef} className="w-full h-full bg-black">
          {remoteUsers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Waiting for patient to join...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video */}
        <div
          ref={localVideoRef}
          className="absolute top-4 right-4 w-1/4 h-1/4 bg-gray-800 rounded-lg border-2 border-white"
        ></div>

        {/* Call Info */}
        <div className="absolute top-4 left-4 text-white">
          <h1 className="text-xl font-bold">Doctor Consultation</h1>
          <p className="text-sm opacity-75">Channel: {channelName}</p>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
          <Button
            onClick={toggleMute}
            className={`p-4 rounded-full ${
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
            onClick={leaveChannel}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>

          <Button
            onClick={toggleVideo}
            className={`p-4 rounded-full ${
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

        {/* Connection Status */}
        <div className="absolute top-4 right-4">
          <div
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              isConnected
                ? "bg-green-500 text-white"
                : "bg-yellow-500 text-gray-900"
            }`}
          >
            {isConnected ? "Connected" : "Connecting..."}
          </div>
        </div>
      </div>
    </div>
  );
}

// Create a loading component for the Suspense fallback
function VideoCallLoading() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>Loading video call...</p>
      </div>
    </div>
  );
}

// Main component wrapped with Suspense
export default function DoctorVideoCall() {
  return (
    <Suspense fallback={<VideoCallLoading />}>
      <DoctorVideoCallContent />
    </Suspense>
  );
}
