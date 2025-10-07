"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { callingService, ActiveCall } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";

export default function DirectCallTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [patientId] = useState("patient_debug_direct_test");
  const [doctorId] = useState("cmgh0qpqi0000iqpbzis9po2t"); // Use real doctor ID from logs
  const [isConnected, setIsConnected] = useState(false);

  const addLog = (
    message: string,
    type: "info" | "success" | "error" | "warning" = "info"
  ) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(
      `%c${logMessage}`,
      `color: ${
        type === "success"
          ? "green"
          : type === "error"
          ? "red"
          : type === "warning"
          ? "orange"
          : "blue"
      }`
    );
    setLogs((prev) => [logMessage, ...prev.slice(0, 29)]);
  };

  const setupPatient = () => {
    localStorage.setItem("authToken", "debug_token_patient");
    localStorage.setItem("userId", patientId);
    localStorage.setItem("userName", "Direct Test Patient");
    localStorage.setItem("userRole", "PATIENT");

    addLog(`🤒 Setting up patient: ${patientId}`, "info");

    socketClient.connect("debug_token_patient", patientId, "PATIENT");
    setIsConnected(true);

    addLog("✅ Patient setup complete", "success");
  };

  const testDirectAPICall = async () => {
    addLog("🧪 Testing direct API call to doctor...", "info");

    try {
      // Test emit API directly
      const response = await fetch("/api/events/emit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer debug_token_patient",
        },
        body: JSON.stringify({
          userId: patientId,
          eventType: "initiate-call",
          data: {
            callId: `direct_api_test_${Date.now()}`,
            callerId: patientId,
            callerName: "Direct Test Patient",
            calleeId: doctorId,
            calleeName: "Test Doctor",
            appointmentId: `direct_appointment_${Date.now()}`,
            channelName: `direct_channel_${Date.now()}`,
            status: "ringing",
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        addLog(`✅ Direct API call successful: ${result.eventId}`, "success");
        addLog(`📊 Result: ${JSON.stringify(result)}`, "info");

        // Now check if doctor received it
        setTimeout(async () => {
          await checkDoctorEvents();
        }, 2000);
      } else {
        const errorText = await response.text();
        addLog(
          `❌ Direct API call failed: ${response.status} - ${errorText}`,
          "error"
        );
      }
    } catch (error) {
      addLog(
        `❌ Direct API test failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "error"
      );
    }
  };

  const checkDoctorEvents = async () => {
    addLog("🔍 Checking if doctor received the call...", "info");

    try {
      const response = await fetch(
        `/api/events/poll?userId=${doctorId}&since=0`,
        {
          headers: {
            Authorization: "Bearer debug_token_patient",
          },
        }
      );

      if (response.ok) {
        const events = await response.json();
        addLog(`📥 Doctor has ${events.length} total events`, "info");

        const callEvents = events.filter(
          (event: any) =>
            event.eventType === "initiate-call" ||
            event.eventType === "incoming-call"
        );

        addLog(
          `📞 Doctor has ${callEvents.length} call-related events`,
          callEvents.length > 0 ? "success" : "warning"
        );

        callEvents.forEach((event: any, index: number) => {
          addLog(
            `📋 Call Event ${index + 1}: ${event.eventType} - From: ${
              event.data.callerName
            }`,
            "info"
          );
        });

        if (callEvents.length === 0) {
          addLog("❌ Doctor did not receive any call events!", "error");
        }
      } else {
        addLog(`❌ Failed to check doctor events: ${response.status}`, "error");
      }
    } catch (error) {
      addLog(
        `❌ Error checking doctor events: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "error"
      );
    }
  };

  const testCallingService = async () => {
    if (!isConnected) {
      addLog("❌ Must setup patient first", "error");
      return;
    }

    addLog("📞 Testing calling service...", "info");

    try {
      const call = await callingService.initiateCall(
        {
          calleeId: doctorId,
          calleeName: "Test Doctor",
          appointmentId: `service_test_${Date.now()}`,
          channelName: `service_channel_${Date.now()}`,
        },
        patientId,
        "Direct Test Patient"
      );

      addLog(`✅ Calling service call initiated: ${call.callId}`, "success");
      addLog(`📊 Call details: ${JSON.stringify(call)}`, "info");

      // Check doctor events after calling service
      setTimeout(async () => {
        await checkDoctorEvents();
      }, 2000);
    } catch (error) {
      addLog(
        `❌ Calling service failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "error"
      );
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    addLog("🚀 Direct Call Test Loaded", "info");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
            <CardTitle className="text-3xl font-bold text-gray-900">
              🎯 Direct Call Test - Patient to Doctor
            </CardTitle>
            <p className="text-gray-600">
              Test direct calling mechanism with known doctor ID
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                🧪 Direct Tests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={setupPatient}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                🤒 Setup Patient
              </Button>

              <Button
                onClick={testDirectAPICall}
                disabled={!isConnected}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                🧪 Test Direct API Call
              </Button>

              <Button
                onClick={testCallingService}
                disabled={!isConnected}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                📞 Test Calling Service
              </Button>

              <Button
                onClick={checkDoctorEvents}
                className="w-full bg-purple-500 hover:bg-purple-600"
              >
                🔍 Check Doctor Events
              </Button>

              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p>
                  <strong>Target Doctor ID:</strong>
                </p>
                <p className="font-mono text-xs">{doctorId}</p>
                <p>
                  <strong>Patient ID:</strong>
                </p>
                <p className="font-mono text-xs">{patientId}</p>
                <p>
                  <strong>Socket Connected:</strong>{" "}
                  {isConnected ? "🟢 Yes" : "🔴 No"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                📊 System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between">
                  <span>Socket Connected:</span>
                  <span
                    className={
                      socketClient.isConnected()
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {socketClient.isConnected() ? "✅ Yes" : "❌ No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Socket User ID:</span>
                  <span className="text-xs font-mono">
                    {socketClient.getUserId() || "None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Socket Role:</span>
                  <span>{socketClient.getUserRole() || "None"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Authenticated:</span>
                  <span
                    className={
                      socketClient.isUserAuthenticated()
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {socketClient.isUserAuthenticated() ? "✅ Yes" : "❌ No"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold">📝 Test Results</CardTitle>
            <Button onClick={clearLogs} variant="outline" size="sm">
              🗑️ Clear
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-96 overflow-y-auto bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet... Start testing!</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1 whitespace-pre-wrap">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold">📋 Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="font-bold">Direct Test Flow:</p>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Click "🤒 Setup Patient" to establish connection</li>
                <li>
                  Click "🧪 Test Direct API Call" to test the API directly
                </li>
                <li>
                  Click "📞 Test Calling Service" to test the full service
                </li>
                <li>
                  Click "🔍 Check Doctor Events" to see if events reached the
                  doctor
                </li>
                <li>Watch the logs to see exactly what happens at each step</li>
              </ol>
              <p className="mt-3 text-gray-600">
                This test uses the real doctor ID from the terminal logs to
                ensure we're targeting an actual connected user.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
