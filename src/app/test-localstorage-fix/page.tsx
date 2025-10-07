"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { callingService } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";

export default function TestLocalStorageFix() {
  const [callLog, setCallLog] = useState<string[]>([]);
  const [localStorageData, setLocalStorageData] = useState<
    Record<string, string | null>
  >({});
  const [isConnected, setIsConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setCallLog((prev) => [...prev, `${timestamp}: ${message}`]);
  };

  const checkLocalStorage = () => {
    const data = {
      authToken: localStorage.getItem("authToken"),
      userId: localStorage.getItem("userId"),
      userName: localStorage.getItem("userName"),
      userRole: localStorage.getItem("userRole"),
    };
    setLocalStorageData(data);
    addLog(`📊 LocalStorage Check: ${JSON.stringify(data)}`);
    return data;
  };

  const forceSetTestUser = (userType: "doctor" | "patient") => {
    const userData =
      userType === "doctor"
        ? {
            authToken: "test-token-doctor-123",
            userId: "doctor_test_456",
            userName: "Dr. Test Smith",
            userRole: "DOCTOR",
          }
        : {
            authToken: "test-token-patient-123",
            userId: "patient_test_789",
            userName: "Test Patient",
            userRole: "PATIENT",
          };

    // Set localStorage
    Object.entries(userData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });

    // Dispatch custom event to notify GlobalIncomingCallHandler
    window.dispatchEvent(new Event("authStateChange"));

    addLog(`✅ Set ${userType} user data in localStorage`);
    addLog(`🔔 Dispatched authStateChange event`);

    // Recheck localStorage
    setTimeout(() => {
      checkLocalStorage();
      addLog(`🔄 GlobalIncomingCallHandler should now initialize...`);
    }, 500);
  };

  const testIncomingCall = async () => {
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const userRole = localStorage.getItem("userRole");

    if (!userId || !userName || !userRole) {
      addLog(`❌ No user context in localStorage. Set test user first.`);
      return;
    }

    addLog(`📞 Testing incoming call notification...`);

    try {
      // Simulate an incoming call by directly calling the calling service
      const mockCall = {
        callId: `test_call_${Date.now()}`,
        callerId:
          userRole === "DOCTOR" ? "patient_test_caller" : "doctor_test_caller",
        callerName:
          userRole === "DOCTOR" ? "Test Patient Caller" : "Dr. Test Caller",
        calleeId: userId,
        calleeName: userName,
        appointmentId: "test_appointment_123",
        channelName: "test_channel_123",
        status: "ringing" as const,
      };

      // Directly emit the incoming call event via socket client
      socketClient.emit("incoming-call", mockCall);

      addLog(`✅ Emitted incoming call: ${mockCall.callId}`);
      addLog(`⏳ GlobalIncomingCallHandler should show incoming call modal...`);
    } catch (error) {
      addLog(`❌ Error testing incoming call: ${error}`);
    }
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    window.dispatchEvent(new Event("authStateChange"));
    addLog(`🗑️ Cleared localStorage and dispatched authStateChange`);
    setTimeout(checkLocalStorage, 500);
  };

  useEffect(() => {
    // Initial check
    checkLocalStorage();

    // Setup calling service listener for testing
    callingService.onIncomingCall((call) => {
      addLog(`📞 RECEIVED INCOMING CALL: ${call.callerName}`);
      setIncomingCall(call);
    });

    // Check connection status
    const checkConnection = () => {
      setIsConnected(socketClient.isConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    addLog(`🔌 Monitoring localStorage and GlobalIncomingCallHandler...`);

    return () => {
      clearInterval(interval);
      callingService.offIncomingCall();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          🔧 LocalStorage & GlobalIncomingCallHandler Fix Test
        </h1>

        {/* Connection Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">System Status</h2>
          <div className="flex items-center space-x-4 mb-2">
            <div
              className={`px-3 py-1 rounded-full text-white ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {isConnected ? "✅ Socket Connected" : "❌ Socket Disconnected"}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Real-time polling: {isConnected ? "Active" : "Inactive"}
          </div>
        </div>

        {/* LocalStorage Status */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">LocalStorage Status</h2>
          <div className="space-y-2 text-sm">
            <div>
              <strong>authToken:</strong>{" "}
              {localStorageData.authToken
                ? `${localStorageData.authToken.substring(0, 20)}...`
                : "❌ Missing"}
            </div>
            <div>
              <strong>userId:</strong> {localStorageData.userId || "❌ Missing"}
            </div>
            <div>
              <strong>userName:</strong>{" "}
              {localStorageData.userName || "❌ Missing"}
            </div>
            <div>
              <strong>userRole:</strong>{" "}
              {localStorageData.userRole || "❌ Missing"}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Test Controls</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => forceSetTestUser("doctor")}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              👨‍⚕️ Set Doctor User
            </Button>
            <Button
              onClick={() => forceSetTestUser("patient")}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              🤒 Set Patient User
            </Button>
            <Button
              onClick={testIncomingCall}
              disabled={!localStorageData.userId}
              className="bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50"
            >
              📞 Test Incoming Call
            </Button>
            <Button
              onClick={clearLocalStorage}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              🗑️ Clear LocalStorage
            </Button>
          </div>
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
                  onClick={() => {
                    addLog(`✅ Test call accepted`);
                    setIncomingCall(null);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  ✅ Accept
                </Button>
                <Button
                  onClick={() => {
                    addLog(`❌ Test call rejected`);
                    setIncomingCall(null);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  ❌ Reject
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Test Instructions */}
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">
            🧪 Fix Test Instructions
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Click "👨‍⚕️ Set Doctor User" or "🤒 Set Patient User" to populate
              localStorage
            </li>
            <li>
              Check console logs for "GlobalIncomingCallHandler: User context
              set"
            </li>
            <li>Wait for "✅ Socket Connected" status</li>
            <li>Click "📞 Test Incoming Call" to simulate an incoming call</li>
            <li>You should see the incoming call modal immediately!</li>
            <li>Check that "hasIncomingCall: true" appears in console</li>
          </ol>
          <p className="mt-4 text-sm font-semibold text-red-700">
            🎯 If GlobalIncomingCallHandler still shows "Still loading user
            info", this fix addresses the race condition!
          </p>
        </div>

        {/* Call Log */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">📋 Test Log</h2>
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
