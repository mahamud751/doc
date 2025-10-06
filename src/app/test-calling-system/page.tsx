"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { callingService, ActiveCall } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";
import { Phone, PhoneOff, User, Clock } from "lucide-react";

export default function TestCallingSystemPage() {
  const [userType, setUserType] = useState<"doctor" | "patient" | null>(null);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetUserName, setTargetUserName] = useState("");
  const [outgoingCall, setOutgoingCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<ActiveCall | null>(null);
  const [status, setStatus] = useState("Select user type");
  const [callLog, setCallLog] = useState<string[]>([]);

  useEffect(() => {
    if (!userType) return;

    // Initialize with user values
    const userId = userType === "doctor" ? "doctor_123" : "patient_456";
    const userName = userType === "doctor" ? "Dr. Smith" : "John Doe";
    const targetId = userType === "doctor" ? "patient_456" : "doctor_123";
    const targetName = userType === "doctor" ? "John Doe" : "Dr. Smith";

    setUserId(userId);
    setUserName(userName);
    setTargetUserId(targetId);
    setTargetUserName(targetName);

    // Connect to socket with userId
    const token = "test-token";
    socketClient.connect(token, userId);
    setStatus(`${userType} mode - Connected`);

    // Set up listeners for incoming calls
    const handleIncomingCall = (call: ActiveCall) => {
      // Only show modal if this user is the callee
      if (call.calleeId === userId) {
        setIncomingCall(call);
        setStatus("Incoming call");
        addToLog(`Received incoming call from ${call.callerName}`);
      }
    };

    callingService.onIncomingCall(handleIncomingCall);

    // Set up listeners for call responses
    const handleCallResponse = (response: any) => {
      if (response.callerId === userId) {
        if (response.accepted) {
          setStatus("Call accepted");
          addToLog("Call accepted by other party");
          // In a real app, you would redirect to the video call page here
        } else {
          setStatus("Call rejected");
          addToLog("Call rejected by other party");
          setOutgoingCall(null);
        }
      }
    };

    callingService.onCallResponse(handleCallResponse);

    // Set up listeners for call ended
    const handleCallEnded = (callId: string) => {
      if (
        (outgoingCall && outgoingCall.callId === callId) ||
        (incomingCall && incomingCall.callId === callId)
      ) {
        setStatus("Call ended");
        addToLog("Call ended");
        setOutgoingCall(null);
        setIncomingCall(null);
      }
    };

    callingService.onCallEnded(handleCallEnded);

    return () => {
      callingService.onIncomingCall(() => {});
      callingService.onCallResponse(() => {});
      callingService.onCallEnded(() => {});
    };
  }, [userType, userId, outgoingCall, incomingCall]);

  const addToLog = (message: string) => {
    setCallLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const handleCall = async () => {
    addToLog(`Calling ${targetUserName}...`);

    const call = await callingService.initiateCall(
      {
        calleeId: targetUserId,
        calleeName: targetUserName,
        appointmentId: "appointment_789",
        channelName: "channel_789",
      },
      userId,
      userName
    );

    setOutgoingCall(call);
    setStatus("Calling...");
    addToLog("Call initiated");
  };

  const handleAcceptCall = () => {
    if (incomingCall) {
      callingService.acceptCall(incomingCall.callId, userId);
      setStatus("Call accepted");
      addToLog("Call accepted");
      setIncomingCall(null);
      // In a real app, you would redirect to the video call page here
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      callingService.rejectCall(incomingCall.callId, userId);
      setStatus("Call rejected");
      addToLog("Call rejected");
      setIncomingCall(null);
    }
  };

  const handleEndCall = () => {
    if (outgoingCall) {
      callingService.endCall(outgoingCall.callId);
      setOutgoingCall(null);
      setStatus("Call ended");
      addToLog("Call ended");
    } else if (incomingCall) {
      callingService.endCall(incomingCall.callId);
      setIncomingCall(null);
      setStatus("Call ended");
      addToLog("Call ended");
    }
  };

  if (!userType) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-8">
            Doctor-Patient Calling System Test
          </h1>
          <div className="space-y-4">
            <Button
              onClick={() => setUserType("doctor")}
              className="w-full bg-blue-500 hover:bg-blue-600 py-3"
            >
              Sign in as Doctor
            </Button>
            <Button
              onClick={() => setUserType("patient")}
              className="w-full bg-green-500 hover:bg-green-600 py-3"
            >
              Sign in as Patient
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Doctor-Patient Calling System Test ({userType})
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Current User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User Type
                </label>
                <p className="mt-1 font-semibold capitalize">{userType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <p className="mt-1 font-semibold">{userId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <p className="mt-1 font-semibold">{userName}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Target User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target User Type
                </label>
                <p className="mt-1 font-semibold">
                  {userType === "doctor" ? "Patient" : "Doctor"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target User ID
                </label>
                <p className="mt-1 font-semibold">{targetUserId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target Name
                </label>
                <p className="mt-1 font-semibold">{targetUserName}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Status: {status}</h2>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleCall}
              disabled={outgoingCall !== null || incomingCall !== null}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Call {userType === "doctor" ? "Patient" : "Doctor"}
            </Button>

            {incomingCall && (
              <div className="flex gap-2">
                <Button
                  onClick={handleAcceptCall}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Accept Call
                </Button>
                <Button
                  onClick={handleRejectCall}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Reject Call
                </Button>
              </div>
            )}

            {(outgoingCall || incomingCall) && (
              <Button
                onClick={handleEndCall}
                className="bg-red-500 hover:bg-red-600"
              >
                End Call
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Call Log</h2>
          <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto">
            {callLog.length === 0 ? (
              <p className="text-gray-500">No call activity yet...</p>
            ) : (
              <ul className="space-y-2">
                {callLog.map((log, index) => (
                  <li key={index} className="text-sm">
                    {log}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Incoming Call Modal */}
        {incomingCall && (
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
                  <span>Ringing...</span>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={handleRejectCall}
                    className="bg-red-500 hover:bg-red-600 rounded-full w-14 h-14 flex items-center justify-center"
                  >
                    <PhoneOff className="h-6 w-6" />
                  </Button>

                  <Button
                    onClick={handleAcceptCall}
                    className="bg-green-500 hover:bg-green-600 rounded-full w-14 h-14 flex items-center justify-center"
                  >
                    <Phone className="h-6 w-6 rotate-[135deg]" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
