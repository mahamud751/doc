"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { callingService } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";

export default function TestCallFixPage() {
  const [callLog, setCallLog] = useState<string[]>([]);
  const [doctorUserId] = useState("doctor_123");
  const [patientUserId] = useState("patient_456");
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userMode, setUserMode] = useState<"doctor" | "patient">("doctor");

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setCallLog((prev) => [...prev, `${timestamp}: ${message}`]);
  };

  useEffect(() => {
    // Setup mock user context for testing
    const currentUserId = userMode === "doctor" ? doctorUserId : patientUserId;
    const currentUserRole = userMode === "doctor" ? "DOCTOR" : "PATIENT";
    const currentUserName = userMode === "doctor" ? "Dr. Smith" : "John Doe";

    // Set localStorage for the current user
    localStorage.setItem("userId", currentUserId);
    localStorage.setItem("userRole", currentUserRole);
    localStorage.setItem("userName", currentUserName);
    localStorage.setItem("authToken", "test-token-123");

    // Connect socket client
    socketClient.connect("test-token-123", currentUserId, currentUserRole);

    // Setup calling service listeners
    callingService.onIncomingCall((call) => {
      addLog(`📞 INCOMING CALL from ${call.callerName}`);
      setIncomingCall(call);
    });

    callingService.onCallResponse((response) => {
      addLog(`📞 Call ${response.accepted ? "ACCEPTED" : "REJECTED"}`);
    });

    callingService.onCallEnded((callId) => {
      addLog(`📞 Call ENDED: ${callId}`);
      setIncomingCall(null);
    });

    // Check connection status
    const checkConnection = () => {
      setIsConnected(socketClient.isConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    addLog(`🔄 Switched to ${userMode} mode (${currentUserId})`);
    addLog(`🔌 Connecting to real-time system...`);

    return () => {
      clearInterval(interval);
      callingService.offIncomingCall();
      callingService.offCallResponse();
      callingService.offCallEnded();
    };
  }, [userMode]);

  const testCall = async () => {
    const callerId = userMode === "doctor" ? doctorUserId : patientUserId;
    const callerName = userMode === "doctor" ? "Dr. Smith" : "John Doe";
    const targetId = userMode === "doctor" ? patientUserId : doctorUserId;
    const targetName = userMode === "doctor" ? "John Doe" : "Dr. Smith";

    addLog(`📞 ${callerName} calling ${targetName}...`);

    try {
      const call = await callingService.initiateCall(
        {
          calleeId: targetId,
          calleeName: targetName,
          appointmentId: "test-appointment-123",
          channelName: "test-channel-123",
        },
        callerId,
        callerName
      );

      addLog(`✅ Call initiated: ${call.callId}`);
      addLog(`⏳ Waiting for ${targetName} to receive call...`);
    } catch (error) {
      addLog(`❌ Error initiating call: ${error}`);
    }
  };

  const acceptCall = () => {
    if (incomingCall) {
      const currentUserId =
        userMode === "doctor" ? doctorUserId : patientUserId;
      callingService.acceptCall(incomingCall.callId, currentUserId);
      addLog(`✅ Call accepted`);
      setIncomingCall(null);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      const currentUserId =
        userMode === "doctor" ? doctorUserId : patientUserId;
      callingService.rejectCall(incomingCall.callId, currentUserId);
      addLog(`❌ Call rejected`);
      setIncomingCall(null);
    }
  };

  const clearLog = () => {
    setCallLog([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          🔧 Test Call Notification Fix
        </h1>

        {/* Connection Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
          <div className="flex items-center space-x-4">
            <div
              className={`px-3 py-1 rounded-full text-white ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {isConnected ? "✅ Connected" : "❌ Disconnected"}
            </div>
            <div className="text-sm text-gray-600">
              Real-time polling: {isConnected ? "Active" : "Inactive"}
            </div>
          </div>
        </div>

        {/* User Mode Switcher */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Switch User Mode</h2>
          <div className="flex space-x-4">
            <Button
              onClick={() => setUserMode("doctor")}
              className={`${
                userMode === "doctor"
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            >
              👨‍⚕️ Doctor Mode
            </Button>
            <Button
              onClick={() => setUserMode("patient")}
              className={`${
                userMode === "patient"
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            >
              🤒 Patient Mode
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Currently:{" "}
            <strong>{userMode === "doctor" ? "Dr. Smith" : "John Doe"}</strong>
          </p>
        </div>

        {/* Incoming Call Modal */}
        {incomingCall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl">
              <h2 className="text-2xl font-bold mb-4">📞 Incoming Call</h2>
              <p className="mb-4">
                From: <strong>{incomingCall.callerName}</strong>
              </p>
              <p className="mb-6 text-sm text-gray-600">
                Call ID: {incomingCall.callId}
              </p>
              <div className="flex space-x-4">
                <Button
                  onClick={acceptCall}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  ✅ Accept
                </Button>
                <Button
                  onClick={rejectCall}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  ❌ Reject
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Test Controls */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Test Call</h2>
          <div className="flex space-x-4">
            <Button
              onClick={testCall}
              disabled={!isConnected}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              📞 Initiate Call to {userMode === "doctor" ? "Patient" : "Doctor"}
            </Button>
            <Button
              onClick={clearLog}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              🗑️ Clear Log
            </Button>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">🧪 Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Wait for "✅ Connected" status</li>
            <li>Click "👨‍⚕️ Doctor Mode" to test as doctor</li>
            <li>Click "📞 Initiate Call to Patient" to make a call</li>
            <li>Switch to "🤒 Patient Mode" in another tab</li>
            <li>You should see an incoming call modal immediately</li>
            <li>Accept or reject the call to test responses</li>
          </ol>
          <p className="mt-4 text-sm font-semibold text-blue-700">
            🎯 Expected result: Instant call notifications between users!
          </p>
        </div>

        {/* Call Log */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">📋 Call Log</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
            {callLog.length === 0 ? (
              <p className="text-gray-500">No events yet...</p>
            ) : (
              callLog.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
