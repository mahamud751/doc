"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

export default function DoctorVideoCall() {
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
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  const clientRef = useRef<any>(null);
  const localAudioTrackRef = useRef<any>(null);
  const localVideoTrackRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // Dynamically import AgoraRTC only on the client side
  const [AgoraRTC, setAgoraRTC] = useState<any>(null);

  useEffect(() => {
    // Set isMounted ref to true
    isMountedRef.current = true;

    // Load AgoraRTC only on client side
    if (typeof window !== "undefined") {
      import("agora-rtc-sdk-ng")
        .then((agora) => {
          if (isMountedRef.current) {
            setAgoraRTC(agora.default);
          }
        })
        .catch((err) => {
          console.error("Failed to load AgoraRTC:", err);
          if (isMountedRef.current) {
            setError(
              "Failed to load video call library. Please refresh the page."
            );
          }
        });
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  useEffect(() => {
    // Validate required parameters
    if (!channelName || !token || !uid || !appId) {
      console.error("Missing required parameters:", {
        channelName,
        token,
        uid,
        appId,
      });
      if (isMountedRef.current) {
        setError(
          "Missing required video call parameters. Redirecting to dashboard..."
        );
        setTimeout(() => {
          router.push("/doctor/dashboard");
        }, 3000);
      }
      return;
    }

    // Validate App ID format
    if (appId.length !== 32) {
      console.error("Invalid App ID length:", appId.length);
      if (isMountedRef.current) {
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
      if (isMountedRef.current) {
        setError(
          "Invalid App ID format. App ID should only contain hexadecimal characters. For debugging, visit: /agora-debug"
        );
        return;
      }
    }

    if (AgoraRTC && !initializing) {
      initializeAgora();
    }

    return () => {
      cleanup();
    };
  }, [AgoraRTC, channelName, token, uid, appId]);

  const cleanup = async () => {
    try {
      // Close local tracks
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }

      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }

      // Leave channel
      if (clientRef.current) {
        try {
          await clientRef.current.leave();
        } catch (error) {
          console.log("Error leaving channel:", error);
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

  const initializeAgora = async () => {
    // Prevent multiple initializations
    if (initializing || !isMountedRef.current) {
      return;
    }

    setInitializing(true);
    setError(null);

    try {
      if (!AgoraRTC || !isMountedRef.current) {
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

      // Create Agora client with additional options to handle vendor key issues
      if (!clientRef.current) {
        clientRef.current = AgoraRTC.createClient({
          mode: "rtc",
          codec: "vp8",
          role: "host", // Explicitly set role
        });
      }

      // Handle user-published event
      const handleUserPublished = async (
        user: any,
        mediaType: "audio" | "video"
      ) => {
        if (!isMountedRef.current) return;

        try {
          await clientRef.current.subscribe(user, mediaType);

          if (mediaType === "video") {
            const remoteVideoTrack = user.videoTrack;
            if (remoteVideoTrack && remoteVideoRef.current) {
              remoteVideoTrack.play(remoteVideoRef.current);
            }
          }

          if (mediaType === "audio") {
            const remoteAudioTrack = user.audioTrack;
            if (remoteAudioTrack) {
              remoteAudioTrack.play();
            }
          }

          if (isMountedRef.current) {
            setRemoteUsers((prev) => {
              // Check if user already exists
              const exists = prev.find((u) => u.uid === user.uid);
              if (exists) return prev;
              return [...prev, user];
            });
          }
        } catch (error) {
          console.error("Error handling user-published:", error);
        }
      };

      // Handle user-unpublished event
      const handleUserUnpublished = (user: any) => {
        if (isMountedRef.current) {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        }
      };

      // Handle user-left event
      const handleUserLeft = (user: any) => {
        if (isMountedRef.current) {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        }
      };

      // Set up event listeners
      clientRef.current.on("user-published", handleUserPublished);
      clientRef.current.on("user-unpublished", handleUserUnpublished);
      clientRef.current.on("user-left", handleUserLeft);

      // Join the channel
      console.log("Attempting to join channel...");
      if (!isMountedRef.current) return;

      // Log the exact parameters being used
      console.log("Join parameters:", {
        appId,
        channelName,
        token: token ? token.substring(0, 10) + "..." : "null",
        uid: Number(uid),
      });

      // Validate parameters before joining
      if (!channelName) {
        throw new Error("Channel name is required");
      }

      if (!uid) {
        throw new Error("User ID is required");
      }

      // Try to join with error handling
      try {
        // Convert uid to number and validate
        const uidNumber = Number(uid);
        if (isNaN(uidNumber)) {
          throw new Error("Invalid user ID format");
        }

        // Try joining with different parameter combinations to handle vendor key issues
        try {
          await clientRef.current.join(
            appId,
            channelName,
            token || null,
            uidNumber
          );
          console.log("Successfully joined channel with token");
        } catch (tokenError: any) {
          // If token fails, try without token (for testing)
          if (
            tokenError.message &&
            tokenError.message.includes("invalid vendor key")
          ) {
            console.warn(
              "Token join failed with vendor key error, trying without token..."
            );
            // Try with empty string instead of null
            await clientRef.current.join(appId, channelName, "", uidNumber);
            console.log("Successfully joined channel without token");
          } else {
            // Re-throw if it's not a vendor key error
            throw tokenError;
          }
        }

        console.log("Successfully joined channel");
      } catch (joinError: any) {
        console.error("Failed to join channel:", joinError);
        console.error("Join error details:", {
          name: joinError.name,
          message: joinError.message,
          code: joinError.code,
          appId,
          channelName,
          uid,
        });

        // Provide more specific error messages
        if (
          joinError.message &&
          joinError.message.includes("invalid vendor key")
        ) {
          throw new Error(
            "Invalid vendor key. Your App ID is not recognized by Agora servers. " +
              "This could be due to project configuration issues."
          );
        } else if (
          joinError.message &&
          (joinError.message.includes("token") ||
            joinError.message.includes("Token"))
        ) {
          throw new Error(
            "Invalid token. The token provided is not valid for this App ID or channel. " +
              "This could be due to an expired token, incorrect App ID, or server issues. " +
              "Please try joining the call again."
          );
        } else if (joinError.message && joinError.message.includes("join")) {
          throw new Error(
            "Failed to join the video call. " +
              "This could be due to network issues, an invalid App ID, or server problems. " +
              "Please check your connection and try again."
          );
        } else {
          throw joinError;
        }
      }

      // Create local audio and video tracks
      if (!isMountedRef.current) return;

      try {
        [localAudioTrackRef.current, localVideoTrackRef.current] =
          await Promise.all([
            AgoraRTC.createMicrophoneAudioTrack(),
            AgoraRTC.createCameraVideoTrack(),
          ]);
      } catch (trackError: any) {
        console.error("Failed to create local tracks:", trackError);
        throw new Error(
          "Failed to access camera or microphone. " +
            "Please ensure you have granted permission and that your devices are working properly."
        );
      }

      // Play local video
      if (
        localVideoTrackRef.current &&
        localVideoRef.current &&
        isMountedRef.current
      ) {
        localVideoTrackRef.current.play(localVideoRef.current);
      }

      // Publish local tracks
      if (isMountedRef.current) {
        await clientRef.current.publish([
          localAudioTrackRef.current,
          localVideoTrackRef.current,
        ]);
      }

      if (isMountedRef.current) {
        setIsConnected(true);
      }
    } catch (error: any) {
      console.error("Error initializing Agora:", error);
      console.error("App ID:", appId);
      console.error("App ID length:", appId?.length);
      console.error("Channel name:", channelName);
      console.error("UID:", uid);

      // Show user-friendly error message
      if (isMountedRef.current) {
        const errorMessage = error.message || "Unknown error";
        console.error("Full error:", error);

        // If it's the specific vendor key error, provide more guidance
        if (errorMessage.includes("invalid vendor key")) {
          setError(
            "Video call service error: Invalid vendor key. " +
              "Your App ID appears correct but Agora servers aren't recognizing it. " +
              "This is often a temporary issue with Agora's servers. " +
              "Please try these solutions:\n\n" +
              "1. Refresh the page and try again\n" +
              "2. Check your internet connection\n" +
              "3. Visit /agora-debug for detailed diagnostics\n" +
              "4. If the issue persists, create a new Agora project\n\n" +
              "Technical details: " +
              errorMessage
          );
        } else if (
          errorMessage.includes("token") ||
          errorMessage.includes("Token")
        ) {
          setError(
            "Video call service error: Invalid token. " +
              "The token may have expired or is not valid for this App ID/channel. " +
              "Please return to your dashboard and try joining the call again.\n\n" +
              "Technical details: " +
              errorMessage
          );
        } else {
          setError(`Failed to initialize video call: ${errorMessage}`);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setInitializing(false);
      }
    }
  };

  const leaveChannel = async () => {
    try {
      await cleanup();
      if (isMountedRef.current) {
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
                Your App ID format is correct, but Agora's servers aren't
                recognizing it. This typically happens when:
              </p>
              <ul className="text-left list-disc pl-5 mb-3 space-y-1">
                <li>The Agora project is not properly configured</li>
                <li>The project has been suspended or deactivated</li>
                <li>The App ID belongs to a different Agora account</li>
                <li>The App ID has been revoked or is invalid</li>
              </ul>
              <p>
                <strong>Solution:</strong> Create a new Agora project and update
                your environment variables. For detailed debugging, visit:
                <a
                  href="/agora-debug"
                  className="text-blue-300 hover:text-blue-100 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  /agora-debug
                </a>
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
  if (!channelName || !token || !uid || !appId) {
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
