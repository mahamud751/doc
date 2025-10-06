"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { callingService, ActiveCall } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";

export default function TestGlobalHandlerPage() {
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetUserName, setTargetUserName] = useState("");
  const [outgoingCall, setOutgoingCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<ActiveCall | null>(null);
  const [status, setStatus] = useState("Not connected");
  const [callLog, setCallLog] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Set up listeners for incoming calls
    const handleIncomingCall = (call: ActiveCall) => {
      console.log("Test page received incoming call:", call);
      if (call.calleeId === userId) {
        setIncomingCall(call);
        setStatus("Incoming call");
        addToLog(`Incoming call from ${call.callerName}`);
      }
    };

    const handleCallResponse = (response: any) => {
      console.log("Test page received call response:", response);
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
      console.log("Test page received call ended:", callId);
      setStatus("Call ended");
      setOutgoingCall(null);
      setIncomingCall(null);
      addToLog("Call ended");
    };

    callingService.onIncomingCall(handleIncomingCall);
    callingService.onCallResponse(handleCallResponse);
    callingService.onCallEnded(handleCallEnded);

    return () => {
      callingService.offIncomingCall();
      callingService.offCallResponse();
      callingService.offCallEnded();
    };
  }, [userId]);

  const setUserInfo = () => {
    // Set localStorage values for GlobalIncomingCallHandler
    localStorage.setItem("authToken", "test-token");
    localStorage.setItem("userId", userId);
    localStorage.setItem("userName", userName);
    
    // Dispatch storage event to trigger GlobalIncomingCallHandler to update
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'userId',
      newValue: userId
    }));
    
    addToLog(`Set user info: ${userId} (${userName})`);
  };

  const connectSocket = () => {
    const token = "test-token";
    console.log("Connecting socket with userId:", userId);
    socketClient.connect(token, userId);
    setIsConnected(true);
    setStatus("Connected to mock socket");
    addToLog("Connected to mock socket with userId: " + userId);
  };

  const addToLog = (message: string) => {
    setCallLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const handleCall = async () => {
    if (!targetUserId || !targetUserName) {
      alert("Please enter target user ID and name");
      return;
    }

    addToLog(`Calling ${targetUserName} (${targetUserId})`);

    const call = await callingService.initiateCall(
      {
        calleeId: targetUserId,
        calleeName: targetUserName,
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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Test Global Handler
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Current User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Your User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Button
                onClick={setUserInfo}
                className="bg-purple-500 hover:bg-purple-600"
              >
                Set User Info
              </Button>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Target User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target User ID
                </label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target Name
                </label>
                <input
                  type="text"
                  value={targetUserName}
                  onChange={(e) => setTargetUserName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Status: {status}</h2>
          <div className="flex flex-wrap gap-4">
            {!isConnected && (
              <Button
                onClick={connectSocket}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Connect Socket
              </Button>
            )}

            {isConnected && (
              <Button
                onClick={handleCall}
                disabled={!targetUserId || !targetUserName || outgoingCall !== null || incomingCall !== null}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Call Target User
              </Button>
            )}

            {(outgoingCall || incomingCall) && (
              <Button
                onClick={handleEndCall}
                className="bg-red-500 hover:bg-red-600"
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
              <p>
                From: {incomingCall.callerName} ({incomingCall.callerId})
              </p>
              <p>Appointment: {incomingCall.appointmentId}</p>
            </div>
          </div>
        )}

        {outgoingCall && (
          <div className="mt-8 bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Outgoing Call</h2>
            <div className="bg-white p-4 rounded-lg shadow">
              <p>
                To: {outgoingCall.calleeName} ({outgoingCall.calleeId})
              </p>
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
      </div>
    </div>
  );
}