"use client";

import { useState, useEffect } from "react";
import { callingService, ActiveCall } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";

export default function DebugGlobalHandlerPage() {
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  useEffect(() => {
    // Initialize with test values
    const testUserId = `debug_user_${Math.floor(Math.random() * 1000)}`;
    const testUserName = `Debug User ${Math.floor(Math.random() * 1000)}`;
    setUserId(testUserId);
    setUserName(testUserName);

    addToLog("Initialized with user ID: " + testUserId);

    // Set up listeners for incoming calls
    const handleIncomingCall = (call: ActiveCall) => {
      console.log("=== GLOBAL HANDLER DEBUG: Received incoming call ===", call);
      addToLog(`=== GLOBAL HANDLER DEBUG: Received incoming call from ${call.callerName} (${call.callerId}) ===`);
      addToLog(`Current user ID: ${userId}`);
      addToLog(`Call callee ID: ${call.calleeId}`);
      addToLog(`Is this user the callee? ${call.calleeId === userId ? "YES" : "NO"}`);
    };

    callingService.onIncomingCall(handleIncomingCall);

    return () => {
      callingService.offIncomingCall();
    };
  }, [userId]);

  const connectSocket = () => {
    const token = "test-token";
    console.log("Connecting socket with userId:", userId);
    socketClient.connect(token, userId);
    setIsConnected(true);
    addToLog("Connected to mock socket with userId: " + userId);
  };

  const addToLog = (message: string) => {
    setDebugLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Debug Global Handler
        </h1>

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
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="flex flex-wrap gap-4">
            {!isConnected && (
              <button
                onClick={connectSocket}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Connect Socket
              </button>
            )}
            {isConnected && (
              <span className="px-4 py-2 bg-green-500 text-white rounded">
                Connected
              </span>
            )}
          </div>
        </div>

        <div className="mt-8 bg-purple-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Debug Log</h2>
          <div className="bg-white p-4 rounded-lg shadow h-96 overflow-y-auto">
            {debugLog.length === 0 ? (
              <p className="text-gray-500">No debug messages yet...</p>
            ) : (
              <ul className="space-y-2">
                {debugLog.map((log, index) => (
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