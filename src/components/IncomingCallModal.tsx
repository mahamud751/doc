"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { callingService, ActiveCall } from "@/lib/calling-service";
import { useRouter } from "next/navigation";

interface IncomingCallModalProps {
  userId: string;
  userName: string;
  incomingCall: ActiveCall; // Add incomingCall prop
}

export default function IncomingCallModal({
  userId,
  userName,
  incomingCall, // Destructure incomingCall from props
}: IncomingCallModalProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isRinging, setIsRinging] = useState(true);
  const router = useRouter();
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set up the ring timeout when incomingCall changes
    if (incomingCall) {
      setCallDuration(0);
      setIsRinging(true);

      // Auto-reject call after 30 seconds if not answered
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
      }
      ringTimeoutRef.current = setTimeout(() => {
        if (incomingCall) {
          rejectCall();
        }
      }, 30000);
    }

    // Set up listener for call responses
    const handleCallResponse = (response: any) => {
      console.log("IncomingCallModal: Received call response", response);
      // If this user initiated the call, handle the response
      if (response.callerId === userId) {
        if (response.accepted) {
          // Call accepted - redirect to video call
          const call =
            callingService.getActiveCall(response.appointmentId) ||
            callingService.getActiveCall(response.callerId);
          if (call) {
            joinVideoCall(call);
          }
        } else {
          // Call rejected
          if (ringTimeoutRef.current) {
            clearTimeout(ringTimeoutRef.current);
          }
          alert("Call was rejected by the other party.");
        }
      }
    };

    callingService.onCallResponse(handleCallResponse);

    // Set up listener for call ended
    const handleCallEnded = (callId: string) => {
      console.log("IncomingCallModal: Received call ended", callId);
      if (incomingCall && incomingCall.callId === callId) {
        setIsRinging(false);
        if (ringTimeoutRef.current) {
          clearTimeout(ringTimeoutRef.current);
        }
      }
    };

    callingService.onCallEnded(handleCallEnded);

    // Cleanup function
    return () => {
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
      }
      callingService.offCallResponse();
      callingService.offCallEnded();
    };
  }, [userId, incomingCall]);

  const acceptCall = () => {
    if (incomingCall) {
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
      }
      callingService.acceptCall(incomingCall.callId, userId);
      joinVideoCall(incomingCall);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
      }
      callingService.rejectCall(incomingCall.callId, userId);
      setIsRinging(false);
    }
  };

  const joinVideoCall = async (call: ActiveCall) => {
    try {
      // Generate a random UID for Agora
      const uid = Math.floor(Math.random() * 1000000);

      // Determine if user is patient or doctor to set the correct route
      const isDoctor =
        (userId === call.calleeId && call.calleeName.includes("Dr.")) ||
        (userId === call.callerId && call.callerName.includes("Dr."));

      // Generate Agora token for video call
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch("/api/agora/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channelName: call.channelName,
          uid,
          role: isDoctor ? "doctor" : "patient",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate video call token"
        );
      }

      const tokenData = await response.json();

      // Validate that we have all required data
      if (!tokenData.token || !tokenData.appId || !call.channelName || !uid) {
        throw new Error("Missing required video call parameters");
      }

      // Redirect to video call page with token data
      const callUrl = isDoctor
        ? `/doctor/video-call?channel=${call.channelName}&token=${tokenData.token}&uid=${uid}&appId=${tokenData.appId}`
        : `/patient/video-call?channel=${call.channelName}&token=${tokenData.token}&uid=${uid}&appId=${tokenData.appId}`;

      // Close the modal
      setIsRinging(false);

      // Open video call in new tab
      window.open(callUrl, "_blank");
    } catch (error) {
      console.error("Error joining video call:", error);
      setIsRinging(false);

      // Provide more specific error messages
      let errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("vendor key")) {
        errorMessage =
          "Video call service error. Please contact support or try the debugging tool.";
        // Open the debug page in a new tab to help diagnose the issue
        window.open("/agora-debug", "_blank");
      }

      alert(`Failed to join video call: ${errorMessage}. Please try again.`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="text-center">
          <div className="mx-auto bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mb-4">
            <Phone className="h-10 w-10 text-green-600 rotate-[135deg]" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Incoming Call
          </h2>
          <p className="text-gray-600 mb-1">From</p>
          <div className="flex items-center justify-center mb-4">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            <p className="text-xl font-semibold text-gray-900">
              {incomingCall.callerName}
            </p>
          </div>

          <div className="flex items-center justify-center text-gray-500 mb-6">
            <Clock className="h-4 w-4 mr-1" />
            <span>{isRinging ? "Ringing..." : "Call ended"}</span>
          </div>

          {isRinging && (
            <div className="flex justify-center space-x-4">
              <Button
                onClick={rejectCall}
                className="bg-red-500 hover:bg-red-600 rounded-full w-14 h-14 flex items-center justify-center"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>

              <Button
                onClick={acceptCall}
                className="bg-green-500 hover:bg-green-600 rounded-full w-14 h-14 flex items-center justify-center"
              >
                <Phone className="h-6 w-6 rotate-[135deg]" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
