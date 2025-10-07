"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { callingService } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";
import {
  Phone,
  Users,
  Video,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function DebugCallSystemPage() {
  const [currentUser, setCurrentUser] = useState({
    id: "",
    name: "",
    role: "",
    token: "",
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [incomingCalls, setIncomingCalls] = useState<any[]>([]);
  const [targetUserId, setTargetUserId] = useState("");

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-20), `[${timestamp}] ${message}`]);
    console.log(`[DEBUG_CALL_SYSTEM] ${message}`);
  };

  // Check current user info and socket status
  const checkSystemStatus = () => {
    try {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");
      const userName = localStorage.getItem("userName");
      const userRole = localStorage.getItem("userRole");

      setCurrentUser({
        id: userId || "",
        name: userName || "",
        role: userRole || "",
        token: token || "",
      });

      const isConnected = socketClient.isConnected();
      setSocketStatus(isConnected ? "connected" : "disconnected");

      addLog(`System Status Check:`);
      addLog(`- User ID: ${userId || "NOT SET"}`);
      addLog(`- User Name: ${userName || "NOT SET"}`);
      addLog(`- User Role: ${userRole || "NOT SET"}`);
      addLog(`- Auth Token: ${token ? "PRESENT" : "NOT SET"}`);
      addLog(`- Socket Status: ${isConnected ? "CONNECTED" : "DISCONNECTED"}`);
      addLog(`- Socket User Context: ${socketClient.getUserId() || "NOT SET"}`);
    } catch (error) {
      addLog(
        `❌ Error checking system status: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  // Force reconnect socket with current user
  const forceReconnectSocket = () => {
    try {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole");

      if (!token || !userId || !userRole) {
        addLog("❌ Cannot reconnect: Missing user credentials");
        return;
      }

      addLog("🔄 Force reconnecting socket...");

      // Disconnect first
      socketClient.disconnect();

      // Wait a moment then reconnect
      setTimeout(() => {
        socketClient.setUserContext(userId, userRole);
        socketClient.connect(token, userId, userRole);

        addLog("✅ Socket reconnected");
        checkSystemStatus();
      }, 500);
    } catch (error) {
      addLog(
        `❌ Error reconnecting socket: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  // Setup calling service listeners
  const setupCallListeners = () => {
    addLog("🎧 Setting up call listeners...");

    // Listen for incoming calls
    callingService.onIncomingCall((call) => {
      addLog(`📞 INCOMING CALL RECEIVED:`);
      addLog(`- From: ${call.callerName} (${call.callerId})`);
      addLog(`- To: ${call.calleeName} (${call.calleeId})`);
      addLog(`- Channel: ${call.channelName}`);
      addLog(`- Call ID: ${call.callId}`);

      setIncomingCalls((prev) => [...prev, call]);
    });

    // Listen for call responses
    callingService.onCallResponse((response) => {
      addLog(`📞 CALL RESPONSE:`);
      addLog(`- Accepted: ${response.accepted}`);
      addLog(`- Caller: ${response.callerId}`);
      addLog(`- Callee: ${response.calleeId}`);
    });

    addLog("✅ Call listeners set up");
  };

  // Test call to specific user
  const testCallToUser = async () => {
    if (!targetUserId.trim()) {
      addLog("❌ Please enter a target user ID");
      return;
    }

    if (!currentUser.id) {
      addLog("❌ Current user not set");
      return;
    }

    try {
      const channelName = `call_${Date.now()}_${
        currentUser.id
      }_${targetUserId}`;

      addLog(`📞 Initiating call to ${targetUserId}...`);

      const call = await callingService.initiateCall(
        {
          calleeId: targetUserId,
          calleeName: "Target User",
          appointmentId: `apt_${Date.now()}`,
          channelName: channelName,
        },
        currentUser.id,
        currentUser.name || "Current User"
      );

      addLog(`✅ Call initiated successfully:`);
      addLog(`- Call ID: ${call.callId}`);
      addLog(`- Channel: ${call.channelName}`);
    } catch (error) {
      addLog(
        `❌ Failed to initiate call: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  // Accept incoming call
  const acceptCall = (callId: string) => {
    try {
      addLog(`✅ Accepting call: ${callId}`);
      callingService.acceptCall(callId, currentUser.id);

      // Remove from incoming calls
      setIncomingCalls((prev) => prev.filter((call) => call.callId !== callId));
    } catch (error) {
      addLog(
        `❌ Failed to accept call: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  // Reject incoming call
  const rejectCall = (callId: string) => {
    try {
      addLog(`❌ Rejecting call: ${callId}`);
      callingService.rejectCall(callId, currentUser.id);

      // Remove from incoming calls
      setIncomingCalls((prev) => prev.filter((call) => call.callId !== callId));
    } catch (error) {
      addLog(
        `❌ Failed to reject call: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  useEffect(() => {
    checkSystemStatus();
    setupCallListeners();

    // Check status periodically
    const statusInterval = setInterval(checkSystemStatus, 5000);

    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
            <Video className="mr-3 text-red-600" />
            Debug Call System
          </h1>

          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg border-2 ${
                currentUser.id
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <h3 className="font-semibold flex items-center">
                {currentUser.id ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2 text-red-600" />
                )}
                User Authentication
              </h3>
              <p className="text-sm text-gray-600 truncate">
                {currentUser.id
                  ? `${currentUser.name} (${currentUser.role})`
                  : "Not authenticated"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                ID: {currentUser.id || "N/A"}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border-2 ${
                socketStatus === "connected"
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <h3 className="font-semibold flex items-center">
                {socketStatus === "connected" ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2 text-red-600" />
                )}
                Socket Connection
              </h3>
              <p className="text-sm text-gray-600 capitalize">{socketStatus}</p>
              <p className="text-xs text-gray-500">
                User Context: {socketClient.getUserId() || "None"}
              </p>
            </div>

            <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
              <h3 className="font-semibold flex items-center">
                <Phone className="w-4 h-4 mr-2 text-blue-600" />
                Incoming Calls
              </h3>
              <p className="text-sm text-gray-600">
                {incomingCalls.length} active
              </p>
            </div>

            <div className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
              <h3 className="font-semibold flex items-center">
                <Users className="w-4 h-4 mr-2 text-purple-600" />
                Mock Mode
              </h3>
              <p className="text-sm text-gray-600">
                {socketClient.isMockMode() ? "Active" : "Disabled"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Debug Actions</h3>
            <div className="flex flex-wrap gap-3 mb-4">
              <Button
                onClick={checkSystemStatus}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Status
              </Button>
              <Button
                onClick={forceReconnectSocket}
                className="bg-orange-600 hover:bg-orange-700"
              >
                🔄 Reconnect Socket
              </Button>
              <Button
                onClick={setupCallListeners}
                className="bg-purple-600 hover:bg-purple-700"
              >
                🎧 Setup Listeners
              </Button>
            </div>

            {/* Test Call */}
            <div className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="Enter target user ID"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <Button
                onClick={testCallToUser}
                className="bg-green-600 hover:bg-green-700"
              >
                📞 Test Call
              </Button>
            </div>
          </div>

          {/* Incoming Calls */}
          {incomingCalls.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Incoming Calls</h3>
              {incomingCalls.map((call) => (
                <div
                  key={call.callId}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-2"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{call.callerName}</p>
                      <p className="text-sm text-gray-600">
                        From: {call.callerId}
                      </p>
                      <p className="text-xs text-gray-500">
                        Call ID: {call.callId}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => acceptCall(call.callId)}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        ✅ Accept
                      </Button>
                      <Button
                        onClick={() => rejectCall(call.callId)}
                        className="bg-red-600 hover:bg-red-700"
                        size="sm"
                      >
                        ❌ Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Debug Logs</h2>
            <Button onClick={() => setLogs([])} variant="outline" size="sm">
              Clear Logs
            </Button>
          </div>
          <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🔧 Debugging Instructions
          </h3>
          <div className="space-y-2 text-blue-800 text-sm">
            <p>
              <strong>Step 1:</strong> Make sure you're logged in as a doctor or
              patient
            </p>
            <p>
              <strong>Step 2:</strong> Check if all status indicators are green
            </p>
            <p>
              <strong>Step 3:</strong> If socket is disconnected, click
              "Reconnect Socket"
            </p>
            <p>
              <strong>Step 4:</strong> Test calling by entering another user's
              ID and clicking "Test Call"
            </p>
            <p>
              <strong>Step 5:</strong> Open this page in another browser with
              different user to test incoming calls
            </p>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-sm">
              <strong>Current User ID:</strong>{" "}
              {currentUser.id || "Please log in first"}
            </p>
            {currentUser.role === "DOCTOR" && (
              <p className="text-yellow-800 text-sm">
                <strong>Test with a Patient ID</strong> to simulate patient
                calling doctor
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
