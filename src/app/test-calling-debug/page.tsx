"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { callingService, ActiveCall } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";

export default function TestCallingDebugPage() {
  const [callerId] = useState("caller_123");
  const [calleeId] = useState("callee_456");
  const [callerName] = useState("Caller User");
  const [calleeName] = useState("Callee User");
  const [outgoingCall, setOutgoingCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<ActiveCall | null>(null);
  const [status, setStatus] = useState("Ready");
  const [isCallerMode, setIsCallerMode] = useState(true);
  const [callLog, setCallLog] = useState<string[]>([]);

  const addToLog = (message: string) => {
    setCallLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  useEffect(() => {
    // Connect to socket with user ID
    const userId = isCallerMode ? callerId : calleeId;
    const token = "test-token";

    console.log(
      `Connecting socket for ${isCallerMode ? "caller" : "callee"} with userId: ${userId}`
    );
    socketClient.connect(token, userId);
    setStatus(`${isCallerMode ? "Caller" : "Callee"} mode - Connected`);
    addToLog(`Connected as ${isCallerMode ? "caller" : "callee"} (${userId})`);

    // Set up listeners for incoming calls
    const handleIncomingCall = (call: ActiveCall) => {
      console.log("Test page received incoming call:", call);
      addToLog(`Received incoming call from ${call.callerName}`);
      // Only show modal if this user is the callee
      if (call.calleeId === userId) {
        setIncomingCall(call);
        setStatus("Incoming call");
        addToLog("Showing incoming call notification");
      }
    };

    callingService.onIncomingCall(handleIncomingCall);

    // Set up listeners for call responses
    const handleCallResponse = (response: any) => {
      console.log("Test page received call response:", response);
      addToLog(
        `Received call response: ${response.accepted ? "accepted" : "rejected"}`
      );
      if (response.callerId === userId) {
        if (response.accepted) {
          setStatus("Call accepted");
          setOutgoingCall(null);
          addToLog("Call accepted by other party");
        } else {
          setStatus("Call rejected");
          setOutgoingCall(null);
          addToLog("Call rejected by other party");
        }
      }
    };

    callingService.onCallResponse(handleCallResponse);

    // Set up listeners for call ended
    const handleCallEnded = (callId: string) => {
      console.log("Test page received call ended:", callId);
      setStatus("Call ended");
      setOutgoingCall(null);
      setIncomingCall(null);
      addToLog("Call ended");
    };

    callingService.onCallEnded(handleCallEnded);

    return () => {
      callingService.offIncomingCall();
      callingService.offCallResponse();
      callingService.offCallEnded();
    };
  }, [isCallerMode, callerId, calleeId]);

  const handleCall = async () => {
    const targetId = isCallerMode ? calleeId : callerId;
    const targetName = isCallerMode ? calleeName : callerName;
    const userId = isCallerMode ? callerId : calleeId;
    const userName = isCallerMode ? callerName : calleeName;

    setStatus(`Calling ${targetName}...`);
    addToLog(`Calling ${targetName} (${targetId})`);

    const call = await callingService.initiateCall(
      {
        calleeId: targetId,
        calleeName: targetName,
        appointmentId: "test-appointment",
        channelName: "test-channel",
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
      callingService.acceptCall(incomingCall.callId, isCallerMode ? callerId : calleeId);
      setIncomingCall(null);
      setStatus("Call accepted");
      addToLog("Call accepted");
    }
  };

  const handleReject = () => {
    if (incomingCall) {
      callingService.rejectCall(incomingCall.callId, isCallerMode ? callerId : calleeId);
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
      addToLog("Call ended by caller");
    } else if (incomingCall) {
      callingService.endCall(incomingCall.callId);
      setIncomingCall(null);
      setStatus("Call ended");
      addToLog("Call ended by callee");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Test Calling Debug
        </h1>

        <div className="mb-6">
          <Button
            onClick={() => setIsCallerMode(!isCallerMode)}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Switch to {isCallerMode ? "Callee" : "Caller"} Mode
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div
            className={`p-6 rounded-lg ${
              isCallerMode ? "bg-blue-50" : "bg-green-50"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">Current User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User Type
                </label>
                <p className="mt-1 font-semibold">
                  {isCallerMode ? "Caller" : "Callee"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <p className="mt-1 font-semibold">
                  {isCallerMode ? callerId : calleeId}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <p className="mt-1 font-semibold">
                  {isCallerMode ? callerName : calleeName}
                </p>
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
                  {isCallerMode ? "Callee" : "Caller"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target User ID
                </label>
                <p className="mt-1 font-semibold">
                  {isCallerMode ? calleeId : callerId}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target Name
                </label>
                <p className="mt-1 font-semibold">
                  {isCallerMode ? calleeName : callerName}
                </p>
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
              Call {isCallerMode ? "Callee" : "Caller"}
            </Button>

            {incomingCall && (
              <div className="flex gap-2">
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
      </div>
    </div>
  );
}