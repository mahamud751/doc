"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { agoraCallingService } from "@/lib/agora-calling-service";
import { callNotifications } from "@/lib/call-notifications";
import { useRouter } from "next/navigation";

// Simplified call data interface for Agora-only approach
export interface IncomingCallData {
  callId: string;
  callerName: string;
  channelName: string;
  appointmentId: string;
}

interface IncomingCallModalProps {
  userId: string;
  userName: string;
  userRole: string;
  incomingCall: IncomingCallData;
  onClose: () => void;
}

export default function IncomingCallModal({
  userId,
  userName,
  userRole,
  incomingCall,
  onClose,
}: IncomingCallModalProps) {
  const [isRinging, setIsRinging] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const router = useRouter();
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("IncomingCallModal: Modal mounted with call", incomingCall);
    console.log("IncomingCallModal: Current user context", {
      userId,
      userRole,
    });

    // Start call duration timer
    const startTime = Date.now();
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Auto-reject after 30 seconds
    ringTimeoutRef.current = setTimeout(() => {
      if (isRinging) {
        console.log("IncomingCallModal: Auto-rejecting call due to timeout");
        rejectCall();
      }
    }, 30000);

    return () => {
      console.log("IncomingCallModal: Cleaning up timers");
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [incomingCall.callId, isRinging, userId, userRole]);

  const handleClose = () => {
    console.log("IncomingCallModal: Closing modal");
    setIsRinging(false);
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    onClose();
  };

  const acceptCall = async () => {
    try {
      console.log("IncomingCallModal: Accepting call", incomingCall.callId);

      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
      }

      // Notify about call acceptance
      callNotifications.notifyCallJoined(incomingCall.appointmentId, userName);

      // Join video call using Agora
      await joinVideoCall();

      handleClose();
    } catch (error) {
      console.error("IncomingCallModal: Error accepting call:", error);
      alert("Failed to accept call. Please try again.");
      handleClose();
    }
  };

  const rejectCall = () => {
    console.log("IncomingCallModal: Rejecting call", incomingCall.callId);

    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
    }

    // Notify about call rejection
    callNotifications.notifyCallEnded(
      incomingCall.appointmentId,
      "Call rejected"
    );

    handleClose();
  };

  const joinVideoCall = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        console.error("IncomingCallModal: No auth token found");
        router.push("/auth/login");
        return;
      }

      // 🔥 CRITICAL FIX: Generate token for the EXACT same channel the caller is using
      const uid = Math.floor(Math.random() * 1000000);

      console.log("IncomingCallModal: Generating token for EXACT channel:", {
        channelName: incomingCall.channelName,
        uid,
        userRole,
      });

      const response = await fetch("/api/agora/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          channelName: incomingCall.channelName, // Use EXACT channel from incoming call
          uid,
          role: userRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `HTTP ${response.status}: Failed to generate video call token`
        );
      }

      const tokenData = await response.json();
      console.log(
        "IncomingCallModal: Token response received for EXACT channel:",
        {
          channel: incomingCall.channelName,
          hasToken: !!tokenData.token,
          hasAppId: !!tokenData.appId,
          tokenLength: tokenData.token?.length,
          appIdLength: tokenData.appId?.length,
          uid,
        }
      );

      // Validate required data
      if (!tokenData.token || !tokenData.appId) {
        throw new Error("Invalid token response from server");
      }

      // 🔥 CRITICAL: Create video call URL for EXACT same channel
      const callUrl =
        userRole === "DOCTOR"
          ? `/doctor/video-call?channel=${encodeURIComponent(
              incomingCall.channelName
            )}&token=${encodeURIComponent(
              tokenData.token
            )}&uid=${uid}&appId=${encodeURIComponent(
              tokenData.appId
            )}&appointmentId=${encodeURIComponent(
              incomingCall.appointmentId
            )}&callId=${encodeURIComponent(incomingCall.callId)}`
          : `/patient/video-call?channel=${encodeURIComponent(
              incomingCall.channelName
            )}&token=${encodeURIComponent(
              tokenData.token
            )}&uid=${uid}&appId=${encodeURIComponent(
              tokenData.appId
            )}&appointmentId=${encodeURIComponent(
              incomingCall.appointmentId
            )}&callId=${encodeURIComponent(incomingCall.callId)}`;

      console.log("IncomingCallModal: Redirecting to EXACT same channel:", {
        channel: incomingCall.channelName,
        uid,
        url: callUrl.substring(0, 100) + "...",
      });

      // Open video call in new tab with EXACT same channel
      const newWindow = window.open(callUrl, "_blank");

      if (!newWindow) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      console.log(
        "✅ IncomingCallModal: Should connect to same channel:",
        incomingCall.channelName
      );
    } catch (error) {
      console.error("IncomingCallModal: Error joining video call:", error);

      let errorMessage = "Failed to join video call. ";
      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += "Please try again.";
      }

      // Provide specific guidance for common errors
      if (errorMessage.includes("vendor key")) {
        errorMessage +=
          "\n\nThis is usually a configuration issue. Please contact support or try the debugging tool.";
        // Open the debug page to help diagnose the issue
        window.open("/agora-debug", "_blank");
      }

      alert(errorMessage);
      throw error; // Re-throw to be handled by acceptCall
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-auto border-4 border-green-200 animate-pulse">
        <div className="text-center">
          {/* Animated ringing icon */}
          <div className="mx-auto bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-green-300 animate-ping opacity-20"></div>
            <Phone className="h-12 w-12 text-green-600 rotate-[135deg]" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            📞{" "}
            {userRole === "DOCTOR" ? "Patient call you" : "Doctor calling you"}
          </h2>

          <p className="text-gray-600 mb-2 text-lg">From</p>
          <div className="flex items-center justify-center mb-6">
            <User className="h-6 w-6 text-gray-500 mr-3" />
            <p className="text-2xl font-semibold text-gray-900 bg-gray-100 px-4 py-2 rounded-lg">
              {incomingCall.callerName}
            </p>
          </div>

          <div className="flex items-center justify-center text-gray-600 mb-8 text-lg">
            <Clock className="h-5 w-5 mr-2" />
            <span className="font-medium">
              {isRinging
                ? "Ringing..."
                : `Call Duration: ${formatDuration(callDuration)}`}
            </span>
          </div>

          {isRinging && (
            <div className="flex justify-center space-x-6">
              {/* Reject Button */}
              <div className="flex flex-col items-center">
                <Button
                  onClick={rejectCall}
                  className="bg-red-500 hover:bg-red-600 rounded-full w-16 h-16 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-200"
                >
                  <PhoneOff className="h-7 w-7" />
                </Button>
                <span className="text-red-600 font-medium mt-2">Decline</span>
              </div>

              {/* Accept Button */}
              <div className="flex flex-col items-center">
                <Button
                  onClick={acceptCall}
                  className="bg-green-500 hover:bg-green-600 rounded-full w-16 h-16 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-200"
                >
                  <Phone className="h-7 w-7 rotate-[135deg]" />
                </Button>
                <span className="text-green-600 font-medium mt-2">Accept</span>
              </div>
            </div>
          )}

          {/* Call info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Call ID:</strong> {incomingCall.callId.substring(0, 8)}...
            </p>
            <p className="text-sm text-gray-600">
              <strong>Channel:</strong> {incomingCall.channelName}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Your Role:</strong> {userRole}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
