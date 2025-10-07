"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { socketClient } from "@/lib/socket-client";
import { callingService, ActiveCall } from "@/lib/calling-service";

export default function QuickSocketTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<"patient" | "doctor">("doctor");
  const [logs, setLogs] = useState<string[]>([]);
  const [hasIncomingCall, setHasIncomingCall] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
    console.log(`[QUICK TEST] ${message}`);
  };

  const connect = async () => {
    try {
      const testUserId = `quick_test_${userRole}_${Date.now()}`;
      const testUserName = userRole === "doctor" ? "Quick Test Doctor" : "Quick Test Patient";
      const testUserRole = userRole === "doctor" ? "DOCTOR" : "PATIENT";
      const authToken = `quick_test_token_${userRole}`;

      // Store in localStorage
      localStorage.setItem("userId", testUserId);
      localStorage.setItem("userName", testUserName);
      localStorage.setItem("userRole", testUserRole);
      localStorage.setItem("authToken", authToken);

      setUserId(testUserId);
      addLog(`Setting up ${userRole} connection...`);

      // Connect socket
      await socketClient.connect(authToken, testUserId, testUserRole);
      setIsConnected(true);
      addLog("✅ Socket connected successfully");

      // Set up incoming call listener
      callingService.onIncomingCall((call: ActiveCall) => {
        addLog(`📞 INCOMING CALL: ${call.callerName} -> ${call.calleeName}`);
        setHasIncomingCall(true);
        
        // Auto-dismiss after 5 seconds for testing
        setTimeout(() => {
          setHasIncomingCall(false);
          addLog("📞 Call auto-dismissed after 5 seconds");
        }, 5000);
      });

      addLog("🎧 Incoming call listener registered");

    } catch (error) {
      addLog(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testCall = async () => {
    if (!isConnected) {
      addLog("❌ Please connect first");
      return;
    }

    try {
      const targetUserId = userRole === "doctor" ? "quick_test_patient" : "quick_test_doctor";
      const targetUserName = userRole === "doctor" ? "Test Patient" : "Test Doctor";

      addLog(`🚀 Initiating call to ${targetUserName}...`);

      const call = await callingService.initiateCall(
        {
          calleeId: targetUserId,
          calleeName: targetUserName,
          appointmentId: "quick_test_appointment",
          channelName: `quick_test_${Date.now()}`,
        },
        userId,
        userRole === "doctor" ? "Test Doctor" : "Test Patient"
      );

      addLog(`✅ Call initiated: ${call.callId}`);
    } catch (error) {
      addLog(`❌ Call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testDirectEvent = () => {
    if (!isConnected) {
      addLog("❌ Please connect first");
      return;
    }

    const testEvent = {
      callId: `direct_test_${Date.now()}`,
      callerId: "direct_test_caller",
      callerName: "Direct Test Caller",
      calleeId: userId,
      calleeName: "Test Target",
      appointmentId: "direct_test_appointment",
      channelName: `direct_test_${Date.now()}`,
      status: "ringing" as const
    };

    addLog("⚡ Emitting direct event...");
    socketClient.emit("incoming-call", testEvent);
    addLog("⚡ Direct event emitted");
  };

  const forceCallbackTest = () => {
    addLog("🚨 Force testing calling service callback...");
    callingService.forceTestIncomingCall(userId, `Test ${userRole}`);
  };

  const disconnect = () => {
    socketClient.disconnect();
    callingService.offIncomingCall();
    setIsConnected(false);
    setHasIncomingCall(false);
    addLog("🔌 Disconnected");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <CardTitle className="text-center">⚡ Quick Socket Test</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            
            {/* Status */}
            <div className="text-center mb-6">
              <div className={`inline-flex items-center px-4 py-2 rounded-full font-semibold ${
                isConnected 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
              </div>
              {hasIncomingCall && (
                <div className="mt-2">
                  <div className="inline-flex items-center px-4 py-2 rounded-full font-semibold bg-orange-100 text-orange-800 animate-pulse">
                    📞 Incoming Call Detected!
                  </div>
                </div>
              )}
            </div>

            {/* Role Selection */}
            <div className="flex justify-center space-x-4 mb-6">
              <Button
                onClick={() => setUserRole("patient")}
                variant={userRole === "patient" ? "default" : "outline"}
                disabled={isConnected}
              >
                👤 Patient
              </Button>
              <Button
                onClick={() => setUserRole("doctor")}
                variant={userRole === "doctor" ? "default" : "outline"}
                disabled={isConnected}
              >
                👨‍⚕️ Doctor
              </Button>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Button 
                onClick={connect} 
                disabled={isConnected}
                className="bg-blue-600 hover:bg-blue-700"
              >
                🔌 Connect
              </Button>
              <Button 
                onClick={testCall} 
                disabled={!isConnected}
                className="bg-green-600 hover:bg-green-700"
              >
                📞 Test Call
              </Button>
              <Button 
                onClick={testDirectEvent} 
                disabled={!isConnected}
                className="bg-purple-600 hover:bg-purple-700"
              >
                ⚡ Direct Event
              </Button>
              <Button 
                onClick={forceCallbackTest} 
                disabled={!isConnected}
                className="bg-orange-600 hover:bg-orange-700"
              >
                🚨 Force Test
              </Button>
              <Button 
                onClick={disconnect} 
                disabled={!isConnected}
                className="bg-red-600 hover:bg-red-700"
              >
                🔌 Disconnect
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <h3 className="font-bold mb-2">🧪 Testing Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Open this page in TWO browser tabs</li>
              <li>Set one as "Patient", one as "Doctor"</li>
              <li>Click "Connect" in both tabs</li>
              <li>Click "Test Call" in Patient tab</li>
              <li>Doctor tab should show "Incoming Call Detected!"</li>
              <li>Try "Direct Event" and "Force Test" buttons</li>
              <li>Check logs below for detailed flow</li>
            </ol>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              📝 Logs
              <Button onClick={() => setLogs([])} variant="outline" size="sm">
                Clear
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
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
          </CardContent>
        </Card>

      </div>
    </div>
  );
}