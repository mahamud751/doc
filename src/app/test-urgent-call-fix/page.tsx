"use client";

import { useState, useEffect } from "react";
import { callingService, ActiveCall } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";

export default function UrgentCallFixPage() {
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [incomingCalls, setIncomingCalls] = useState<ActiveCall[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);

  // Log function
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    setDebugLog((prev) => [...prev, logEntry].slice(-20)); // Keep last 20 logs
  };

  // Initialize user context
  useEffect(() => {
    const initializeUser = () => {
      if (typeof window !== "undefined") {
        const storedUserId = localStorage.getItem("userId");
        const storedUserName = localStorage.getItem("userName");
        const storedUserRole = localStorage.getItem("userRole");
        const authToken = localStorage.getItem("authToken");

        addLog(
          `Initializing user context: ${storedUserId} (${storedUserRole})`
        );

        if (storedUserId && storedUserName && storedUserRole && authToken) {
          setUserId(storedUserId);
          setUserName(storedUserName);
          setUserRole(storedUserRole);

          // Connect socket
          socketClient.setUserContext(storedUserId, storedUserRole);
          socketClient.connect(authToken, storedUserId, storedUserRole);

          // Check connection status
          setTimeout(() => {
            setIsConnected(socketClient.isConnected());
            addLog(`Socket connected: ${socketClient.isConnected()}`);
          }, 1000);

          // Set up calling service listeners
          callingService.onIncomingCall((call: ActiveCall) => {
            addLog(
              `🚨 INCOMING CALL RECEIVED: ${call.callerName} -> ${call.calleeName}`
            );
            setIncomingCalls((prev) => [...prev, call]);
          });

          callingService.onCallResponse((response) => {
            addLog(`📞 Call response: ${JSON.stringify(response)}`);
          });

          callingService.onCallEnded((callId) => {
            addLog(`📵 Call ended: ${callId}`);
            setIncomingCalls((prev) =>
              prev.filter((call) => call.callId !== callId)
            );
          });
        } else {
          addLog("❌ Missing user context - please login first");
        }
      }
    };

    initializeUser();
  }, []);

  // Test functions
  const testIncomingCallDirect = () => {
    addLog("🧪 Testing direct incoming call...");
    callingService.forceTestIncomingCall(userId, userName);
    setTestResults((prev) => [...prev, "Direct test triggered"]);
  };

  const testRealTimeEvent = () => {
    addLog("🧪 Testing real-time event emission...");

    const testCall: ActiveCall = {
      callId: `realtime_test_${Date.now()}`,
      callerId: "test_patient_999",
      callerName: "Real Time Test Patient",
      calleeId: userId,
      calleeName: userName,
      appointmentId: "realtime_test_appointment",
      channelName: `realtime_test_channel_${Date.now()}`,
      status: "ringing",
    };

    socketClient.emit("incoming-call", testCall);
    setTestResults((prev) => [...prev, "Real-time event emitted"]);
  };

  const testFullCallFlow = async () => {
    addLog("🧪 Testing full call initiation flow...");

    try {
      const testCallData = {
        calleeId: userId,
        calleeName: userName,
        appointmentId: "full_test_appointment",
        channelName: `full_test_channel_${Date.now()}`,
      };

      const activeCall = await callingService.initiateCall(
        testCallData,
        "full_test_patient_123",
        "Full Test Patient"
      );

      addLog(`✅ Full call flow initiated: ${activeCall.callId}`);
      setTestResults((prev) => [
        ...prev,
        `Full call flow: ${activeCall.callId}`,
      ]);
    } catch (error) {
      addLog(`❌ Full call flow error: ${error}`);
      setTestResults((prev) => [...prev, `Full call flow ERROR: ${error}`]);
    }
  };

  const testRealPatientCall = async () => {
    addLog("📞 TESTING EXACT PATIENT CALL SCENARIO...");

    try {
      // This simulates exactly what happens when a patient clicks "Call Doctor"
      const realCallData = {
        calleeId: userId,
        calleeName: userName,
        appointmentId: "real_patient_scenario_appointment",
        channelName: `real_patient_scenario_${Date.now()}`,
      };

      addLog(`🎯 Target Doctor: ${userId} (${userName})`);

      const activeCall = await callingService.initiateCall(
        realCallData,
        "real_patient_999",
        "Real Scenario Patient"
      );

      addLog(`✅ Patient call initiated: ${activeCall.callId}`);
      addLog(`🔔 Doctor should now see incoming call modal...`);
      setTestResults((prev) => [
        ...prev,
        `REAL PATIENT SCENARIO: ${activeCall.callId}`,
      ]);
    } catch (error) {
      addLog(`❌ Real patient scenario failed: ${error}`);
      setTestResults((prev) => [
        ...prev,
        `REAL PATIENT SCENARIO ERROR: ${error}`,
      ]);
    }
  };

  const clearLogs = () => {
    setDebugLog([]);
    setTestResults([]);
    setIncomingCalls([]);
  };

  const acceptCall = (call: ActiveCall) => {
    addLog(`✅ Accepting call: ${call.callId}`);
    callingService.acceptCall(call.callId, userId);
    setIncomingCalls((prev) => prev.filter((c) => c.callId !== call.callId));
  };

  const rejectCall = (call: ActiveCall) => {
    addLog(`❌ Rejecting call: ${call.callId}`);
    callingService.rejectCall(call.callId, userId);
    setIncomingCalls((prev) => prev.filter((c) => c.callId !== call.callId));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4 mb-6">
        <h1 className="text-2xl font-bold text-red-800 mb-2">
          🚨 URGENT CALL SYSTEM FIX
        </h1>
        <p className="text-red-700">
          Emergency debugging page for fixing patient-to-doctor calling system
        </p>
      </div>

      {/* User Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">User Context</h3>
          <p className="text-sm">ID: {userId || "❌ Missing"}</p>
          <p className="text-sm">Name: {userName || "❌ Missing"}</p>
          <p className="text-sm">Role: {userRole || "❌ Missing"}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Socket Status</h3>
          <p className="text-sm">
            Connected: {isConnected ? "✅ Yes" : "❌ No"}
          </p>
          <p className="text-sm">
            User ID: {socketClient.getUserId() || "❌ Missing"}
          </p>
          <p className="text-sm">
            Role: {socketClient.getUserRole() || "❌ Missing"}
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">Incoming Calls</h3>
          <p className="text-sm">Active: {incomingCalls.length}</p>
          <p className="text-sm">Tests Run: {testResults.length}</p>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={testIncomingCallDirect}
          className="bg-red-500 text-white p-4 rounded-lg hover:bg-red-600 font-semibold"
        >
          🧪 Test Direct Incoming Call
        </button>

        <button
          onClick={testRealTimeEvent}
          className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 font-semibold"
        >
          🧪 Test Real-Time Event
        </button>

        <button
          onClick={testFullCallFlow}
          className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 font-semibold"
        >
          🧪 Test Full Call Flow
        </button>

        <button
          onClick={testRealPatientCall}
          className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 font-semibold"
        >
          📞 Test REAL Patient Call
        </button>
      </div>

      {/* Clear Button */}
      <div className="mb-6">
        <button
          onClick={clearLogs}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          🗑️ Clear All Logs
        </button>
      </div>

      {/* Incoming Calls */}
      {incomingCalls.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-4">
            📞 Active Incoming Calls ({incomingCalls.length})
          </h3>
          {incomingCalls.map((call) => (
            <div key={call.callId} className="bg-white p-4 rounded border mb-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{call.callerName} is calling</p>
                  <p className="text-sm text-gray-600">
                    Call ID: {call.callId}
                  </p>
                  <p className="text-sm text-gray-600">
                    Channel: {call.channelName}
                  </p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => acceptCall(call)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    ✅ Accept
                  </button>
                  <button
                    onClick={() => rejectCall(call)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Debug Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-4">🔍 Debug Logs</h3>
          <div className="bg-black text-green-400 p-3 rounded font-mono text-xs h-64 overflow-y-auto">
            {debugLog.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              debugLog.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-4">📋 Test Results</h3>
          <div className="bg-white p-3 rounded border h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-2 p-2 bg-blue-100 rounded">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">
          🎯 Testing Instructions
        </h3>
        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
          <li>Ensure you're logged in as a DOCTOR</li>
          <li>
            Click "Test Direct Incoming Call" to test direct callback system
          </li>
          <li>
            Click "Test Real-Time Event" to test the socket-based event system
          </li>
          <li>
            Click "Test Full Call Flow" to test the complete initiation process
          </li>
          <li>
            <strong>
              Click "Test REAL Patient Call" to simulate exact patient call
              scenario
            </strong>
          </li>
          <li>Watch the debug logs and incoming calls section for activity</li>
          <li>
            If calls appear, accept/reject them to test the response system
          </li>
        </ol>
      </div>
    </div>
  );
}
