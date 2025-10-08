"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { agoraCallingService } from "@/lib/agora-calling-service";

export default function TestBidirectionalConnection() {
  const [logs, setLogs] = useState<string[]>([]);
  const [patientWindow, setPatientWindow] = useState<Window | null>(null);
  const [doctorWindow, setDoctorWindow] = useState<Window | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const addLog = (
    message: string,
    type: "info" | "success" | "error" | "warning" = "info"
  ) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs((prev) => [logMessage, ...prev.slice(0, 49)]);
    console.log(logMessage);
  };

  useEffect(() => {
    addLog("🔧 Bidirectional Connection Test initialized", "info");
    addLog("This will test the SAME channel connection fix", "info");
  }, []);

  const testCompleteFlow = async () => {
    try {
      addLog("🚀 Starting complete bidirectional test...", "info");

      // Simulate patient starting a call
      const appointmentId = `test_appointment_${Date.now()}`;
      const doctorId = "test_doctor_123";
      const doctorName = "Dr. Test";

      // Set up patient context
      localStorage.setItem("userId", "test_patient_456");
      localStorage.setItem("userName", "Test Patient");
      localStorage.setItem("userRole", "PATIENT");
      localStorage.setItem("authToken", "test-token-123");

      addLog("👤 Set up patient context", "info");

      // Step 1: Patient initiates call
      addLog("📞 Patient starting video call...", "info");
      const { callSession, callUrl: patientUrl } =
        await agoraCallingService.startVideoCall(
          appointmentId,
          doctorId,
          doctorName
        );

      addLog(
        `✅ Patient call initiated. Channel: ${callSession.channelName}`,
        "success"
      );
      addLog(`📱 Patient URL: ${patientUrl.substring(0, 100)}...`, "info");

      // Step 2: Open patient video call
      const patientWindow = window.open(
        patientUrl,
        "patient_call",
        "width=800,height=600"
      );
      if (!patientWindow) {
        throw new Error("Failed to open patient window");
      }
      setPatientWindow(patientWindow);
      addLog("🤒 Patient video call window opened", "success");

      // Step 3: Wait 2 seconds, then simulate doctor accepting
      setTimeout(async () => {
        try {
          // Set up doctor context
          localStorage.setItem("userId", doctorId);
          localStorage.setItem("userName", doctorName);
          localStorage.setItem("userRole", "DOCTOR");

          addLog("👨‍⚕️ Setting up doctor context...", "info");

          // Generate doctor token for SAME channel
          const doctorUid = Math.floor(Math.random() * 1000000);
          const response = await fetch("/api/agora/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer test-token-123",
            },
            body: JSON.stringify({
              channelName: callSession.channelName, // SAME channel as patient
              uid: doctorUid,
              role: "DOCTOR",
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to generate doctor token");
          }

          const tokenData = await response.json();
          addLog(
            `✅ Doctor token generated for SAME channel: ${callSession.channelName}`,
            "success"
          );

          // Create doctor URL for SAME channel
          const doctorUrl = `/doctor/video-call?channel=${encodeURIComponent(
            callSession.channelName
          )}&token=${encodeURIComponent(
            tokenData.token
          )}&uid=${doctorUid}&appId=${encodeURIComponent(
            tokenData.appId
          )}&appointmentId=${encodeURIComponent(
            appointmentId
          )}&callId=${encodeURIComponent(callSession.callId)}`;

          addLog(`📱 Doctor URL: ${doctorUrl.substring(0, 100)}...`, "info");
          addLog(
            `🔗 Both using SAME channel: ${callSession.channelName}`,
            "success"
          );

          // Open doctor video call
          const doctorWindow = window.open(
            doctorUrl,
            "doctor_call",
            "width=800,height=600"
          );
          if (!doctorWindow) {
            throw new Error("Failed to open doctor window");
          }
          setDoctorWindow(doctorWindow);
          addLog("👨‍⚕️ Doctor video call window opened", "success");

          // Step 4: Monitor connection status
          addLog("🔍 Monitoring for bidirectional connection...", "info");
          addLog(
            "👀 Check browser console logs for 'USER PUBLISHED EVENT' messages",
            "warning"
          );

          setTimeout(() => {
            addLog(
              "✅ Test complete! Both users should be in SAME channel now",
              "success"
            );
            addLog(
              "💡 Look for console logs showing user-published events",
              "info"
            );
            setIsConnected(true);
          }, 3000);
        } catch (error) {
          addLog(`❌ Doctor setup failed: ${error}`, "error");
        }
      }, 2000);
    } catch (error) {
      addLog(`❌ Test failed: ${error}`, "error");
    }
  };

  const closeWindows = () => {
    if (patientWindow) {
      patientWindow.close();
      setPatientWindow(null);
      addLog("🤒 Patient window closed", "info");
    }
    if (doctorWindow) {
      doctorWindow.close();
      setDoctorWindow(null);
      addLog("👨‍⚕️ Doctor window closed", "info");
    }
    setIsConnected(false);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <CardTitle className="text-center text-3xl">
              🔗 Test Bidirectional Video Connection
            </CardTitle>
            <p className="text-center text-blue-100 text-lg">
              Test the fix for "Connecting to doctor..." and "Waiting for
              patient..." issue
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                🎮 <span>Test Controls</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testCompleteFlow}
                className="w-full bg-green-600 hover:bg-green-700 text-lg py-4"
                disabled={!!patientWindow || !!doctorWindow}
              >
                🚀 Test Complete Bidirectional Flow
              </Button>

              <div className="border-t pt-4">
                <Button
                  onClick={closeWindows}
                  className="w-full mb-2 bg-red-600 hover:bg-red-700"
                  disabled={!patientWindow && !doctorWindow}
                >
                  🗑️ Close Video Call Windows
                </Button>

                <Button
                  onClick={clearLogs}
                  className="w-full bg-gray-600 hover:bg-gray-700"
                >
                  🧹 Clear Logs
                </Button>
              </div>

              {/* Window Status */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-2">Window Status:</h3>
                <div className="text-sm space-y-1">
                  <div
                    className={`${
                      patientWindow ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    🤒 Patient: {patientWindow ? "Open" : "Closed"}
                  </div>
                  <div
                    className={`${
                      doctorWindow ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    👨‍⚕️ Doctor: {doctorWindow ? "Open" : "Closed"}
                  </div>
                  <div
                    className={`${
                      isConnected ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    🔗 Connection:{" "}
                    {isConnected ? "Should Be Connected" : "Not Connected"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                📄 <span>Test Logs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-gray-500">
                    Click 'Test Complete Bidirectional Flow' to start...
                  </p>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className={`mb-1 ${
                        log.includes("❌")
                          ? "text-red-400"
                          : log.includes("✅")
                          ? "text-green-400"
                          : log.includes("⚠️") || log.includes("👀")
                          ? "text-yellow-400"
                          : log.includes("🔍")
                          ? "text-blue-400"
                          : log.includes("🚀")
                          ? "text-purple-400"
                          : "text-gray-300"
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 What This Test Does</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-bold text-blue-800 mb-2">
                  🔧 The Fix Applied:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                  <li>Patient creates channel: appointment_123456</li>
                  <li>Doctor gets notification with EXACT channel name</li>
                  <li>Doctor generates token for SAME channel</li>
                  <li>Both users join the SAME Agora channel</li>
                  <li>Event listeners set up BEFORE joining</li>
                  <li>Both should detect each other's published tracks</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="font-bold text-green-800 mb-2">
                  ✅ Expected Result:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                  <li>Patient stops showing "Connecting to doctor..."</li>
                  <li>Doctor stops showing "Waiting for patient..."</li>
                  <li>Both see each other's video feeds</li>
                  <li>Console shows "USER PUBLISHED EVENT" messages</li>
                  <li>Red hang-up button works properly</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <h3 className="font-bold text-yellow-800 mb-2">
                🔍 Debugging Steps:
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700">
                <li>
                  <strong>Click "Test Complete Bidirectional Flow"</strong>
                </li>
                <li>
                  <strong>Allow camera/microphone permissions</strong> in both
                  windows
                </li>
                <li>
                  <strong>Open browser console</strong> (F12) to see detailed
                  logs
                </li>
                <li>
                  <strong>Look for "USER PUBLISHED EVENT"</strong> in console
                </li>
                <li>
                  <strong>Both videos should start showing</strong> within 5-10
                  seconds
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
