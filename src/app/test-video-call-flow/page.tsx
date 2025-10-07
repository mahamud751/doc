"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { callingService } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";

export default function TestVideoCallFlow() {
  const [status, setStatus] = useState("Disconnected");
  const [logs, setLogs] = useState<string[]>([]);
  const [userType, setUserType] = useState<"patient" | "doctor">("patient");

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs((prev) => [logMessage, ...prev.slice(0, 19)]); // Keep last 20 logs
    console.log(logMessage);
  };

  useEffect(() => {
    // Simulate user login
    const userId =
      userType === "patient" ? "test_patient_123" : "test_doctor_456";
    const userName = userType === "patient" ? "Test Patient" : "Dr. Test";
    const userRole = userType === "patient" ? "PATIENT" : "DOCTOR";
    const authToken = `test_token_${userType}`;

    // Store in localStorage to simulate login
    localStorage.setItem("userId", userId);
    localStorage.setItem("userName", userName);
    localStorage.setItem("userRole", userRole);
    localStorage.setItem("authToken", authToken);

    // Connect to socket
    socketClient
      .connect(authToken, userId, userRole)
      .then(() => {
        setStatus("Connected");
        addLog(`✅ Connected as ${userType}: ${userName}`);
      })
      .catch((error) => {
        setStatus("Error");
        addLog(`❌ Connection failed: ${error.message}`);
      });

    // Listen for incoming calls
    const handleIncomingCall = (call: any) => {
      addLog(`📞 Incoming call from ${call.callerName} (ID: ${call.callerId})`);
    };

    callingService.onIncomingCall(handleIncomingCall);
    socketClient.on("incoming-call", (data) => {
      addLog(`🔔 Socket event - incoming call: ${JSON.stringify(data)}`);
    });

    return () => {
      socketClient.disconnect();
      callingService.offIncomingCall();
    };
  }, [userType]);

  const simulatePatientCall = async () => {
    try {
      addLog("🚀 Patient initiating call to doctor...");

      const call = await callingService.initiateCall(
        {
          calleeId: "test_doctor_456",
          calleeName: "Dr. Test",
          appointmentId: "test_appointment_123",
          channelName: `test_channel_${Date.now()}`,
        },
        "test_patient_123",
        "Test Patient"
      );

      addLog(`✅ Call initiated successfully: ${call.callId}`);
    } catch (error) {
      addLog(
        `❌ Call initiation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const simulateDoctorCall = async () => {
    try {
      addLog("🚀 Doctor initiating call to patient...");

      const call = await callingService.initiateCall(
        {
          calleeId: "test_patient_123",
          calleeName: "Test Patient",
          appointmentId: "test_appointment_123",
          channelName: `test_channel_${Date.now()}`,
        },
        "test_doctor_456",
        "Dr. Test"
      );

      addLog(`✅ Call initiated successfully: ${call.callId}`);
    } catch (error) {
      addLog(
        `❌ Call initiation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const testDirectEvent = () => {
    const testEvent = {
      callId: `direct_test_${Date.now()}`,
      callerId: "direct_test_caller",
      callerName: "Direct Test Caller",
      calleeId: localStorage.getItem("userId"),
      calleeName: localStorage.getItem("userName"),
      appointmentId: "direct_test_appointment",
      channelName: `direct_test_${Date.now()}`,
      status: "ringing",
    };

    addLog("⚡ Emitting direct socket event...");
    socketClient.emit("incoming-call", testEvent);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              🧪 Video Call Flow Test
            </CardTitle>
            <p className="text-center text-gray-600">
              Test the end-to-end video calling system
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Type Selection */}
            <div className="flex space-x-4 justify-center">
              <Button
                onClick={() => setUserType("patient")}
                variant={userType === "patient" ? "default" : "outline"}
                className="w-32"
              >
                👤 Patient
              </Button>
              <Button
                onClick={() => setUserType("doctor")}
                variant={userType === "doctor" ? "default" : "outline"}
                className="w-32"
              >
                👨‍⚕️ Doctor
              </Button>
            </div>

            {/* Status */}
            <div className="text-center">
              <span
                className={`px-4 py-2 rounded-full font-semibold ${
                  status === "Connected"
                    ? "bg-green-100 text-green-800"
                    : status === "Error"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                Status: {status}
              </span>
            </div>

            {/* Test Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={simulatePatientCall}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={status !== "Connected"}
              >
                📞 Patient → Doctor Call
              </Button>

              <Button
                onClick={simulateDoctorCall}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={status !== "Connected"}
              >
                📞 Doctor → Patient Call
              </Button>

              <Button
                onClick={testDirectEvent}
                className="bg-green-600 hover:bg-green-700"
                disabled={status !== "Connected"}
              >
                ⚡ Test Direct Event
              </Button>
            </div>

            {/* Instructions */}
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">📋 Testing Instructions:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Open this page in TWO browser tabs</li>
                  <li>Set one tab as "Patient", another as "Doctor"</li>
                  <li>Both should show "Connected" status</li>
                  <li>Click "Patient → Doctor Call" in patient tab</li>
                  <li>Doctor tab should show incoming call notification</li>
                  <li>Check logs below for detailed flow</li>
                </ol>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              📝 <span>Real-time Logs</span>
              <Button
                onClick={() => setLogs([])}
                variant="outline"
                size="sm"
                className="ml-auto"
              >
                Clear
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-80 overflow-y-auto">
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
