"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { callingService, ActiveCall } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";

export default function TestDoctorPatientCallPage() {
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

    // Add to call log
    addToLog(`Initialized as ${userType}: ${userName} (${userId})`);

    // Set up listeners for incoming calls
    const handleIncomingCall = (call: ActiveCall) => {
      console.log("Received incoming call:", call);
      if (call.calleeId === userId) {
        setIncomingCall(call);
        setStatus("Incoming call");
        addToLog(`Incoming call from ${call.callerName}`);
      }
    };

    const handleCallResponse = (response: any) => {
      console.log("Received call response:", response);
      if (response.callerId === userId) {
        if (response.accepted) {
          setStatus("Call accepted");
          setOutgoingCall(null);
          addToLog("Call accepted");
        } else {
          setStatus("Call rejected");
          setOutgoingCall(null);
          addToLog("Call rejected");
        }
      }
    };

    const handleCallEnded = (callId: string) => {
      console.log("Call ended:", callId);
      setStatus("Call ended");
      setOutgoingCall(null);
      setIncomingCall(null);
      addToLog("Call ended");
    };

    callingService.onIncomingCall(handleIncomingCall);
    callingService.onCallResponse(handleCallResponse);
    callingService.onCallEnded(handleCallEnded);

    return () => {
      socketClient.disconnect();
      callingService.onIncomingCall(() => {});
      callingService.onCallResponse(() => {});
      callingService.onCallEnded(() => {});
    };
  }, [userType]);

  const addToLog = (message: string) => {
    setCallLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const handleCall = async () => {
    if (!targetUserId || !targetUserName) {
      alert("Target user not set");
      return;
    }

    addToLog(`Calling ${targetUserName} (${targetUserId})`);

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

  const handleAccept = () => {
    if (incomingCall) {
      callingService.acceptCall(incomingCall.callId, userId);
      setIncomingCall(null);
      setStatus("Call accepted");
      addToLog("Call accepted");
    }
  };

  const handleReject = () => {
    if (incomingCall) {
      callingService.rejectCall(incomingCall.callId, userId);
      setIncomingCall(null);
      setStatus("Call rejected");
      addToLog("Call rejected");
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
            Doctor-Patient Calling Test
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
          Doctor-Patient Calling Test ({userType})
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div
            className={`p-6 rounded-lg ${
              userType === "doctor" ? "bg-blue-50" : "bg-green-50"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">Current User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User Type
                </label>
                <p className="mt-1 font-semibold">
                  {userType === "doctor" ? "Doctor" : "Patient"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Your User ID
                </label>
                <p className="mt-1 font-semibold">{userId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Your Name
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
              className="bg-blue-500 hover:bg-blue-600"
            >
              Call {userType === "doctor" ? "Patient" : "Doctor"}
            </Button>

            {(outgoingCall || incomingCall) && (
              <Button
                onClick={handleEndCall}
                className="bg-purple-500 hover:bg-purple-600"
              >
                End Call
              </Button>
            )}

            {incomingCall && (
              <>
                <Button
                  onClick={handleAccept}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Accept Call
                </Button>
                <Button
                  onClick={handleReject}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Reject Call
                </Button>
              </>
            )}
          </div>
        </div>

        {incomingCall && (
          <div className="mt-8 bg-red-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Incoming Call</h2>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="font-semibold">From: {incomingCall.callerName}</p>
              <p>User ID: {incomingCall.callerId}</p>
              <p>Appointment: {incomingCall.appointmentId}</p>
            </div>
          </div>
        )}

        {outgoingCall && (
          <div className="mt-8 bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Outgoing Call</h2>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="font-semibold">To: {outgoingCall.calleeName}</p>
              <p>User ID: {outgoingCall.calleeId}</p>
              <p>Appointment: {outgoingCall.appointmentId}</p>
            </div>
          </div>
        )}

        <div className="mt-8 bg-purple-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Call Log</h2>
          <div className="bg-white p-4 rounded-lg shadow h-64 overflow-y-auto">
            {callLog.length === 0 ? (
              <p className="text-gray-500">No calls yet...</p>
            ) : (
              <ul className="space-y-2">
                {callLog.map((log, index) => (
                  <li key={index} className="text-sm font-mono">
                    {log}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={() => {
              setUserType(null);
              setOutgoingCall(null);
              setIncomingCall(null);
              setCallLog([]);
            }}
            className="bg-gray-500 hover:bg-gray-600"
          >
            Switch User Type
          </Button>
        </div>
      </div>
    </div>
  );
}
