"use client";

import { useState, useEffect } from "react";
import { Phone, PhoneOff, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { callingService, ActiveCall } from "@/lib/calling-service";

interface OutgoingCallIndicatorProps {
  call: ActiveCall;
  onCancel: () => void;
}

export default function OutgoingCallIndicator({
  call,
  onCancel,
}: OutgoingCallIndicatorProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState("ringing"); // ringing, connected, ended

  useEffect(() => {
    // Set up listener for call responses
    const handleCallResponse = (response: any) => {
      if (
        response.callerId === call.callerId &&
        response.appointmentId === call.appointmentId
      ) {
        if (response.accepted) {
          setCallStatus("connected");
          // Call is connected, but we'll close this indicator since the video call
          // will open in a new window/tab
          onCancel();
        } else {
          setCallStatus("ended");
          setTimeout(() => {
            onCancel();
          }, 3000);
        }
      }
    };

    callingService.onCallResponse(handleCallResponse);

    // Set up listener for call ended
    const handleCallEnded = (callId: string) => {
      if (callId === call.callId) {
        setCallStatus("ended");
        setTimeout(() => {
          onCancel();
        }, 3000);
      }
    };

    callingService.onCallEnded(handleCallEnded);

    // Auto-cancel call after 30 seconds if not answered
    const timeout = setTimeout(() => {
      if (callStatus === "ringing") {
        setCallStatus("ended");
        callingService.endCall(call.callId);
        setTimeout(() => {
          onCancel();
        }, 3000);
      }
    }, 30000);

    return () => {
      clearTimeout(timeout);
      callingService.onCallResponse(() => {});
      callingService.onCallEnded(() => {});
    };
  }, [call, callStatus, onCancel]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="text-center">
          <div className="mx-auto bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mb-4">
            <Phone className="h-10 w-10 text-blue-600 rotate-[135deg]" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {callStatus === "ringing"
              ? "Calling..."
              : callStatus === "connected"
              ? "Connected"
              : "Call Ended"}
          </h2>
          <p className="text-gray-600 mb-1">To</p>
          <div className="flex items-center justify-center mb-4">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            <p className="text-xl font-semibold text-gray-900">
              {call.calleeName}
            </p>
          </div>

          <div className="flex items-center justify-center text-gray-500 mb-6">
            <Clock className="h-4 w-4 mr-1" />
            <span>
              {callStatus === "ringing"
                ? "Ringing..."
                : callStatus === "connected"
                ? "Connected"
                : "Call ended"}
            </span>
          </div>

          {callStatus === "ringing" && (
            <div className="flex justify-center">
              <Button
                onClick={onCancel}
                className="bg-red-500 hover:bg-red-600 rounded-full w-14 h-14 flex items-center justify-center"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
