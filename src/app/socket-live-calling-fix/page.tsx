"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { socketClient } from "@/lib/socket-client";
import { callingService, ActiveCall } from "@/lib/calling-service";

interface ConnectionStatus {
  socketConnected: boolean;
  socketAuthenticated: boolean;
  socketUserId: string | null;
  socketUserRole: string | null;
  callingServiceReady: boolean;
  globalHandlerRegistered: boolean;
}

interface TestResult {
  test: string;
  status: "pending" | "success" | "failed";
  message: string;
  timestamp: Date;
}

export default function SocketLiveCallingFix() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    socketConnected: false,
    socketAuthenticated: false,
    socketUserId: null,
    socketUserRole: null,
    callingServiceReady: false,
    globalHandlerRegistered: false,
  });

  const [logs, setLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [userMode, setUserMode] = useState<"patient" | "doctor">("doctor");
  const [incomingCall, setIncomingCall] = useState<ActiveCall | null>(null);
  const [isIncomingCallListenerActive, setIsIncomingCallListenerActive] = useState(false);

  const logRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: "info" | "success" | "error" | "warning" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = {
      info: "ℹ️",
      success: "✅",
      error: "❌",
      warning: "⚠️"
    }[type];
    
    const logMessage = `[${timestamp}] ${emoji} ${message}`;
    setLogs(prev => [logMessage, ...prev.slice(0, 49)]);
    console.log(logMessage);
    
    // Auto-scroll to top
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  };

  const addTestResult = (test: string, status: "success" | "failed", message: string) => {
    setTestResults(prev => [
      { test, status, message, timestamp: new Date() },
      ...prev.slice(0, 9)
    ]);
  };

  // Initialize socket connection with proper user context
  const initializeConnection = async () => {
    try {
      addLog("🔧 Initializing socket connection...", "info");

      // Set up user context based on mode
      const userId = userMode === "patient" ? "test_patient_fix" : "test_doctor_fix";
      const userName = userMode === "patient" ? "Test Patient Fix" : "Dr. Test Fix";
      const userRole = userMode === "patient" ? "PATIENT" : "DOCTOR";
      const authToken = `test_token_${userMode}_fix`;

      // Store in localStorage
      localStorage.setItem("userId", userId);
      localStorage.setItem("userName", userName);
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("authToken", authToken);

      addLog(`👤 Set user context: ${userName} (${userRole})`, "info");

      // Connect socket with full context
      await socketClient.connect(authToken, userId, userRole);
      addLog("🔌 Socket connected successfully", "success");

      // Wait a moment for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));

      updateConnectionStatus();
      
    } catch (error) {
      addLog(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  };

  // Update connection status
  const updateConnectionStatus = () => {
    const status: ConnectionStatus = {
      socketConnected: socketClient.isConnected(),
      socketAuthenticated: socketClient.isUserAuthenticated(),
      socketUserId: socketClient.getUserId(),
      socketUserRole: socketClient.getUserRole(),
      callingServiceReady: true, // CallingService is a singleton, always ready
      globalHandlerRegistered: isIncomingCallListenerActive,
    };

    setConnectionStatus(status);
    addLog(`📊 Connection Status: Socket=${status.socketConnected}, Auth=${status.socketAuthenticated}, User=${status.socketUserId}`, "info");
  };

  // Set up incoming call listener
  const setupIncomingCallListener = () => {
    addLog("🎧 Setting up incoming call listener...", "info");
    
    const handleIncomingCall = (call: ActiveCall) => {
      addLog(`📞 INCOMING CALL RECEIVED: ${call.callerName} (${call.callerId}) -> ${call.calleeName} (${call.calleeId})`, "success");
      setIncomingCall(call);
    };

    // Register with calling service
    callingService.onIncomingCall(handleIncomingCall);
    setIsIncomingCallListenerActive(true);
    
    addLog("✅ Incoming call listener registered with calling service", "success");
    updateConnectionStatus();
  };

  // Test socket event emission
  const testSocketEmission = async () => {
    addLog("🚀 Testing socket event emission...", "info");
    
    try {
      const testData = {
        callId: `test_emit_${Date.now()}`,
        callerId: "test_emitter",
        callerName: "Test Emitter",
        calleeId: connectionStatus.socketUserId || "unknown",
        calleeName: "Test Target",
        appointmentId: "test_appointment",
        channelName: `test_channel_${Date.now()}`,
        status: "ringing" as const
      };

      // Test direct socket emission
      const emitResult = socketClient.emit("incoming-call", testData);
      addLog(`📤 Direct socket emit result: ${emitResult}`, emitResult ? "success" : "error");
      
      addTestResult("Socket Emission", emitResult ? "success" : "failed", 
        emitResult ? "Event emitted successfully" : "Event emission failed");

    } catch (error) {
      addLog(`❌ Socket emission test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
      addTestResult("Socket Emission", "failed", error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Test calling service flow
  const testCallingServiceFlow = async () => {
    addLog("🔄 Testing calling service flow...", "info");
    
    try {
      const targetUserId = userMode === "doctor" ? "test_patient_fix" : "test_doctor_fix";
      const targetUserName = userMode === "doctor" ? "Test Patient Fix" : "Dr. Test Fix";
      
      const call = await callingService.initiateCall(
        {
          calleeId: targetUserId,
          calleeName: targetUserName,
          appointmentId: "test_calling_service",
          channelName: `test_cs_${Date.now()}`,
        },
        connectionStatus.socketUserId || "test_caller",
        "Test Caller"
      );

      addLog(`📞 Calling service initiated call: ${call.callId}`, "success");
      addTestResult("Calling Service", "success", `Call ${call.callId} initiated successfully`);
      
    } catch (error) {
      addLog(`❌ Calling service test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
      addTestResult("Calling Service", "failed", error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Test API endpoints
  const testAPIEndpoints = async () => {
    addLog("🌐 Testing API endpoints...", "info");
    
    try {
      const authToken = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");
      
      if (!authToken || !userId) {
        throw new Error("Missing auth token or user ID");
      }

      // Test emit endpoint
      const emitResponse = await fetch("/api/events/emit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId,
          eventType: "test-event",
          data: { message: "API test" }
        })
      });

      if (emitResponse.ok) {
        addLog("✅ Emit API endpoint working", "success");
        addTestResult("Emit API", "success", "Endpoint responded successfully");
      } else {
        throw new Error(`Emit API failed: ${emitResponse.status}`);
      }

      // Test poll endpoint
      const pollResponse = await fetch(`/api/events/poll?userId=${userId}&since=0`, {
        headers: {
          "Authorization": `Bearer ${authToken}`,
        }
      });

      if (pollResponse.ok) {
        const events = await pollResponse.json();
        addLog(`✅ Poll API endpoint working (${events.length} events)`, "success");
        addTestResult("Poll API", "success", `Retrieved ${events.length} events`);
      } else {
        throw new Error(`Poll API failed: ${pollResponse.status}`);
      }
      
    } catch (error) {
      addLog(`❌ API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
      addTestResult("API Endpoints", "failed", error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Force trigger test call
  const forceTestCall = () => {
    addLog("🚨 Force triggering test call...", "warning");
    
    const testCall: ActiveCall = {
      callId: `force_test_${Date.now()}`,
      callerId: "force_test_caller",
      callerName: "Force Test Caller",
      calleeId: connectionStatus.socketUserId || "unknown",
      calleeName: "Test Target",
      appointmentId: "force_test_appointment",
      channelName: `force_test_${Date.now()}`,
      status: "ringing",
    };

    // Trigger through calling service
    callingService.simulateIncomingCall(testCall);
    addLog("🚨 Force test call triggered via calling service", "warning");
  };

  // Run comprehensive diagnostics
  const runDiagnostics = async () => {
    addLog("🔍 Running comprehensive diagnostics...", "info");
    setTestResults([]);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    await testSocketEmission();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    await testAPIEndpoints();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    await testCallingServiceFlow();
    
    addLog("🔍 Diagnostics complete", "info");
  };

  // Handle incoming call accept
  const acceptCall = (call: ActiveCall) => {
    addLog(`✅ Accepting call: ${call.callId}`, "success");
    callingService.acceptCall(call.callId, connectionStatus.socketUserId || "unknown");
    setIncomingCall(null);
  };

  // Handle incoming call reject
  const rejectCall = (call: ActiveCall) => {
    addLog(`❌ Rejecting call: ${call.callId}`, "warning");
    callingService.rejectCall(call.callId, connectionStatus.socketUserId || "unknown");
    setIncomingCall(null);
  };

  // Initialize on component mount
  useEffect(() => {
    addLog("🚀 Socket Live Calling Fix initialized", "info");
    updateConnectionStatus();
  }, []);

  // Update connection status periodically
  useEffect(() => {
    const interval = setInterval(updateConnectionStatus, 3000);
    return () => clearInterval(interval);
  }, [isIncomingCallListenerActive]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="border-red-200">
          <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
            <CardTitle className="text-2xl font-bold text-center">
              🔧 Socket.IO Live Calling System Fix
            </CardTitle>
            <p className="text-center text-red-100">
              Comprehensive diagnostics and fix for real-time calling issues
            </p>
          </CardHeader>
        </Card>

        {/* User Mode Selection */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center space-x-4 mb-4">
              <Button
                onClick={() => setUserMode("patient")}
                variant={userMode === "patient" ? "default" : "outline"}
                className="w-32"
              >
                👤 Patient Mode
              </Button>
              <Button
                onClick={() => setUserMode("doctor")}
                variant={userMode === "doctor" ? "default" : "outline"}
                className="w-32"
              >
                👨‍⚕️ Doctor Mode
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={initializeConnection} className="bg-blue-600 hover:bg-blue-700">
                🔌 Initialize Connection
              </Button>
              <Button onClick={setupIncomingCallListener} className="bg-green-600 hover:bg-green-700" 
                disabled={!connectionStatus.socketConnected}>
                🎧 Setup Listener
              </Button>
              <Button onClick={runDiagnostics} className="bg-purple-600 hover:bg-purple-700"
                disabled={!connectionStatus.socketConnected}>
                🔍 Run Diagnostics
              </Button>
              <Button onClick={forceTestCall} className="bg-red-600 hover:bg-red-700"
                disabled={!isIncomingCallListenerActive}>
                🚨 Force Test Call
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                📊 <span>Connection Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>Socket Connected:</span>
                  <span className={connectionStatus.socketConnected ? "text-green-600 font-bold" : "text-red-600"}>
                    {connectionStatus.socketConnected ? "✅ Yes" : "❌ No"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>Authenticated:</span>
                  <span className={connectionStatus.socketAuthenticated ? "text-green-600 font-bold" : "text-red-600"}>
                    {connectionStatus.socketAuthenticated ? "✅ Yes" : "❌ No"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>User ID:</span>
                  <span className="font-mono text-xs">{connectionStatus.socketUserId || "None"}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>User Role:</span>
                  <span className="font-bold">{connectionStatus.socketUserRole || "None"}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>Calling Service:</span>
                  <span className={connectionStatus.callingServiceReady ? "text-green-600 font-bold" : "text-red-600"}>
                    {connectionStatus.callingServiceReady ? "✅ Ready" : "❌ Not Ready"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>Listener Active:</span>
                  <span className={connectionStatus.globalHandlerRegistered ? "text-green-600 font-bold" : "text-red-600"}>
                    {connectionStatus.globalHandlerRegistered ? "✅ Active" : "❌ Inactive"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                🧪 <span>Test Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testResults.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No tests run yet</div>
                ) : (
                  testResults.map((result, index) => (
                    <div key={index} className={`p-3 rounded-lg border-l-4 ${
                      result.status === "success" 
                        ? "bg-green-50 border-green-500" 
                        : "bg-red-50 border-red-500"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{result.test}</span>
                        <span className={`text-sm ${
                          result.status === "success" ? "text-green-600" : "text-red-600"
                        }`}>
                          {result.status === "success" ? "✅" : "❌"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{result.message}</div>
                      <div className="text-xs text-gray-400 mt-1">{result.timestamp.toLocaleTimeString()}</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Incoming Call Modal */}
        {incomingCall && (
          <Card className="border-green-500 border-2 bg-green-50">
            <CardHeader className="bg-green-500 text-white">
              <CardTitle className="text-center">📞 Incoming Call</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{incomingCall.callerName}</h3>
                  <p className="text-gray-600">is calling you</p>
                  <p className="text-sm text-gray-500">Call ID: {incomingCall.callId}</p>
                </div>
                <div className="flex justify-center space-x-4">
                  <Button onClick={() => acceptCall(incomingCall)} className="bg-green-600 hover:bg-green-700">
                    ✅ Accept
                  </Button>
                  <Button onClick={() => rejectCall(incomingCall)} className="bg-red-600 hover:bg-red-700">
                    ❌ Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                📝 <span>Live Logs</span>
              </span>
              <Button onClick={() => setLogs([])} variant="outline" size="sm">
                Clear
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={logRef}
              className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-80 overflow-y-auto"
            >
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1 break-words">
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