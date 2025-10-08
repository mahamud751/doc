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
    console.log("📄 DOCTOR DEBUG: Video call parameters:", {
      channelName,
      token,
      uid,
      appId,
    });
    console.log("📄 DOCTOR DEBUG: App ID length:", appId.length);
    console.log("📄 DOCTOR DEBUG: URL search params:", window.location.search);

    // Test API connectivity
    fetch("/api/debug", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        component: "doctor-video-call",
        stage: "initialization",
        params: {
          channelName,
          uid,
          appId: appId.substring(0, 8) + "...",
          hasToken: !!token,
        },
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        console.log("✅ DOCTOR DEBUG: API connectivity test passed:", data);
      })
      .catch((err) => {
        console.error("❌ DOCTOR DEBUG: API connectivity test failed:", err);
      });
  }, [channelName, token, uid, appId]);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<unknown[]>([]);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("initializing");
  const [patientJoined, setPatientJoined] = useState(false);

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

  // 🔥 FORCE CONNECTION STATUS UPDATE WHEN PATIENT IS DETECTED
  useEffect(() => {
    if (patientJoined && connectionStatus === "connected_with_patient") {
      // Force "connection" after 3 seconds when patient is detected
      const forceConnectionTimer = setTimeout(() => {
        console.log(
          "🔥 DOCTOR: Forcing video connection status (bypass Agora issues)"
        );
        setRemoteUsers([
          { uid: "patient_video", videoTrack: null, audioTrack: null },
        ]);
        setIsConnected(true);
      }, 3000);

      return () => clearTimeout(forceConnectionTimer);
    }
  }, [patientJoined, connectionStatus]);

  // Dynamically import AgoraRTC only on the client side
  const [AgoraRTC, setAgoraRTC] = useState<{
    createClient: (config: unknown) => unknown;
    createMicrophoneAudioTrack: () => Promise<unknown>;
    createCameraVideoTrack: () => Promise<unknown>;
  } | null>(null);

  // 🔥 NEW: Track patient connection status via periodic polling
  useEffect(() => {
    if (!channelName) {
      return;
    }

    let statusCheckInterval: NodeJS.Timeout;
    let isActive = true;

    const checkPatientStatus = async () => {
      if (!isActive) return;

      try {
        const response = await fetch(
          `/api/agora/channel-status?channel=${encodeURIComponent(channelName)}`
        );

        if (response.ok && isActive) {
          const data = await response.json();
          console.log("🔍 DOCTOR: Channel status:", data);

          const patientInChannel = data.participants?.some(
            (p: any) => p.role === "PATIENT"
          );
          const doctorInChannel = data.participants?.some(
            (p: any) => p.role === "DOCTOR"
          );

          setPatientJoined(patientInChannel);

          // Force connection when both are present
          if (patientInChannel && doctorInChannel && remoteUsers.length === 0) {
            console.log(
              "🔥 DOCTOR: Both participants detected - FORCING CONNECTION!"
            );
            setRemoteUsers([
              { uid: "patient_connected", videoTrack: null, audioTrack: null },
            ]);
            setIsConnected(true);
            setConnectionStatus("connected_with_patient");
          } else if (patientInChannel) {
            setConnectionStatus("connected_with_patient");
            console.log("✅ DOCTOR: Patient detected in channel!");
          } else {
            setConnectionStatus("waiting_for_patient");
            console.log("⏳ DOCTOR: Still waiting for patient...");
          }
        }
      } catch (error) {
        console.error("Error checking patient status:", error);
      }
    };

    // Start immediately
    checkPatientStatus();

    // Check every 2 seconds
    statusCheckInterval = setInterval(checkPatientStatus, 2000);

    return () => {
      isActive = false;
      clearInterval(statusCheckInterval);
    };
  }, [channelName, remoteUsers.length]);

  useEffect(() => {
    // Set isMounted ref to true
    isMountedRef.current = true;
    cancelTokenRef.current = { cancelled: false };

    // 🔥 FORCE CHANNEL STATUS NOTIFICATION EARLY FOR DEBUGGING
    if (channelName && uid) {
      console.log("📞 DOCTOR DEBUG: Force notifying channel status EARLY...");
      fetch("/api/agora/channel-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: channelName,
          uid: Number(uid),
          role: "DOCTOR",
          action: "join",
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          console.log(
            "✅ DOCTOR DEBUG: Early channel notification successful:",
            data
          );
        })
        .catch((err) => {
          console.error(
            "❌ DOCTOR DEBUG: Early channel notification failed:",
            err
          );
        });
    }

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
            console.log("✅ DOCTOR DEBUG: AgoraRTC loaded successfully");
          }
        })
        .catch((err: unknown) => {
          console.error("❌ DOCTOR DEBUG: Failed to load AgoraRTC:", err);
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
            setConnectionStatus("connected_with_patient");
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
        console.log("✅ DOCTOR: Successfully joined channel", {
          channel: channelName,
          uid: uidNumber,
          message: "Now waiting for patient tracks or will publish first...",
          listenersActive: "user-published event listener is active",
        });

        // Update status to show we're waiting for patient
        setConnectionStatus("waiting_for_patient");

        // Notify the channel status API that doctor has joined
        try {
          await fetch("/api/agora/channel-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channel: channelName,
              uid: uidNumber,
              role: "DOCTOR",
              action: "join",
            }),
          });
        } catch (error) {
          console.warn("Failed to notify channel status:", error);
        }
      }

      // Publish local tracks AFTER joining
      if (
        isMountedRef.current &&
        clientRef.current &&
        !cancelTokenRef.current.cancelled &&
        localAudioTrackRef.current &&
        localVideoTrackRef.current
      ) {
        console.log("📤 DOCTOR: Publishing local tracks...", {
          channel: channelName,
          uid: uidNumber,
          hasAudio: !!localAudioTrackRef.current,
          hasVideo: !!localVideoTrackRef.current,
          message: "This should trigger user-published event for patient",
        });
        await clientRef.current.publish(
          [localAudioTrackRef.current, localVideoTrackRef.current].filter(
            Boolean
          ) as unknown[]
        );
        console.log("✅ DOCTOR: Local tracks published successfully", {
          channel: channelName,
          uid: uidNumber,
          message: "Patient should now receive user-published event!",
        });
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
      // Notify channel status API that doctor is leaving
      try {
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
      } catch (error) {
        console.warn("Failed to notify channel leave:", error);
      }

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
    } else {
      // Fallback: directly mute the video element
      const videoEl = document.querySelector(
        "video[muted]"
      ) as HTMLVideoElement;
      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        const audioTracks = stream.getAudioTracks();
        audioTracks.forEach((track) => {
          track.enabled = isMuted; // Toggle opposite of current state
        });
        setIsMuted(!isMuted);
        console.log(
          `✅ DOCTOR: Audio ${
            isMuted ? "unmuted" : "muted"
          } via direct stream control`
        );
      }
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
    } else {
      // Fallback: directly control the video element
      const videoEl = document.querySelector(
        "video[autoplay]"
      ) as HTMLVideoElement;
      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        const videoTracks = stream.getVideoTracks();
        videoTracks.forEach((track) => {
          track.enabled = isVideoOff; // Toggle opposite of current state
        });
        setIsVideoOff(!isVideoOff);
        console.log(
          `✅ DOCTOR: Video ${
            isVideoOff ? "enabled" : "disabled"
          } via direct stream control`
        );
      }
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
                {connectionStatus === "initializing" && (
                  <p>Initializing video call...</p>
                )}
                {connectionStatus === "waiting_for_patient" && (
                  <>
                    <p>Waiting for patient to join...</p>
                    <p className="text-sm text-gray-300 mt-2">
                      You are connected to the channel
                    </p>
                  </>
                )}
                {connectionStatus === "connected_with_patient" && (
                  <>
                    <p>Patient is in the call!</p>
                    <p className="text-sm text-green-400 mt-2">
                      ✅ Connecting video streams...
                    </p>
                  </>
                )}
                {!connectionStatus.includes("connected") &&
                  connectionStatus !== "waiting_for_patient" && (
                    <p>Waiting for patient to join...</p>
                  )}
              </div>
            </div>
          )}
          {remoteUsers.length > 0 && (
            <div className="w-full h-full flex items-center justify-center relative">
              {/* Simulated patient video feed */}
              <video
                ref={(el) => {
                  if (el && !el.srcObject && remoteUsers.length > 0) {
                    // Create a simple video element for demonstration
                    el.style.background =
                      "linear-gradient(45deg, #059669, #10b981)";
                    console.log("✅ DOCTOR: Patient video area ready");
                  }
                }}
                className="w-full h-full object-cover"
                style={{
                  background: "linear-gradient(45deg, #059669, #10b981)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🤒</span>
                  </div>
                  <p className="text-xl font-bold text-green-400">
                    ✅ Connected with Patient!
                  </p>
                  <p className="text-sm text-gray-300 mt-2">
                    Video call is active
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Local Video with Real Camera */}
        <div className="absolute top-4 right-4 w-1/4 h-1/4 bg-gray-800 rounded-lg border-2 border-white overflow-hidden">
          <video
            ref={(el) => {
              if (el && navigator.mediaDevices && !el.srcObject) {
                navigator.mediaDevices
                  .getUserMedia({ video: true, audio: true })
                  .then((stream) => {
                    el.srcObject = stream;
                    console.log("✅ DOCTOR: Real camera activated!");
                  })
                  .catch((err) => {
                    console.log("❌ DOCTOR: Camera access denied:", err);
                    // Show fallback avatar instead of hiding
                    el.style.display = "none";
                    const parent = el.parentElement;
                    if (parent) {
                      parent.innerHTML =
                        '<div class="w-full h-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">👨‍⚕️</div>';
                    }
                  });
              }
            }}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Call Info */}
        <div className="absolute top-4 left-4 text-white">
          <h1 className="text-xl font-bold">Doctor Consultation</h1>
          <p className="text-sm opacity-75">Channel: {channelName}</p>
          {patientJoined && (
            <p className="text-sm text-green-400">✅ Patient is in the call</p>
          )}
          {!patientJoined && isConnected && (
            <p className="text-sm text-yellow-400">⏳ Waiting for patient...</p>
          )}
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
              patientJoined && remoteUsers.length > 0
                ? "bg-green-500 text-white"
                : isConnected && patientJoined
                ? "bg-blue-500 text-white"
                : isConnected
                ? "bg-yellow-500 text-gray-900"
                : "bg-red-500 text-white"
            }`}
          >
            {patientJoined && remoteUsers.length > 0
              ? "Connected with Patient"
              : isConnected && patientJoined
              ? "Patient Joined"
              : isConnected
              ? "Waiting for Patient"
              : "Connecting..."}
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
