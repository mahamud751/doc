"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { agoraCallingService } from "@/lib/agora-calling-service";
import { callNotifications } from "@/lib/call-notifications";
import Link from "next/link";

export default function TestCompleteVideoFlow() {
  const [currentRole, setCurrentRole] = useState<"patient" | "doctor">("patient");
  const [logs, setLogs] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [activeCall, setActiveCall] = useState<any>(null);

  const addLog = (message: string, type: "info" | "success" | "error" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [logMessage, ...prev.slice(0, 29)]);
    console.log(logMessage);
  };

  useEffect(() => {
    // Set up demo user
    const userId = currentRole === "patient" ? "test_patient_123" : "test_doctor_456";
    const userName = currentRole === "patient" ? "Test Patient" : "Dr. Test";
    const userRole = currentRole === "patient" ? "PATIENT" : "DOCTOR";
    const authToken = "demo_auth_token";

    localStorage.setItem("userId", userId);
    localStorage.setItem("userName", userName);
    localStorage.setItem("userRole", userRole);
    localStorage.setItem("authToken", authToken);

    addLog(`👤 Set up ${currentRole}: ${userName} (${userId})`);
    setConnectionStatus("ready");

    // Listen for notifications
    const handleNotification = (notification: any) => {
      addLog(`📢 ${notification.title}: ${notification.message}`, "success");
    };

    callNotifications.onNotification(handleNotification);

    return () => {
      callNotifications.offNotification(handleNotification);
    };
  }, [currentRole]);

  const startPatientCall = async () => {
    try {
      addLog("🚀 PATIENT: Starting video call to doctor...", "info");
      
      const appointmentId = "test_appointment_123";
      const doctorId = "test_doctor_456";
      const doctorName = "Dr. Test";

      const { callSession, callUrl } = await agoraCallingService.startVideoCall(
        appointmentId,
        doctorId,
        doctorName
      );

      addLog(`✅ PATIENT: Call session created - ${callSession.callId}`, "success");
      addLog(`📞 PATIENT: Channel name - ${callSession.channelName}`, "info");
      addLog(`🔗 PATIENT: Generated call URL`, "success");
      
      setActiveCall(callSession);
      
      // Simulate opening video call
      addLog("📺 PATIENT: Opening video call window...", "info");
      window.open(callUrl, "_blank");
      
    } catch (error) {
      addLog(`❌ PATIENT: Call failed - ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  };

  const doctorJoinCall = async () => {
    try {
      addLog("🔗 DOCTOR: Joining video call...", "info");
      
      const appointmentId = "test_appointment_123";
      const channelName = "appointment_test_appointment_123";

      const { callUrl, callSession } = await agoraCallingService.joinVideoCall(
        appointmentId,
        channelName
      );

      addLog(`✅ DOCTOR: Generated join URL`, "success");
      addLog(`📞 DOCTOR: Joining channel - ${channelName}`, "info");
      
      if (callSession) {
        addLog(`🔄 DOCTOR: Found existing session - ${callSession.callId}`, "success");
        setActiveCall(callSession);
      }
      
      // Simulate opening video call
      addLog("📺 DOCTOR: Opening video call window...", "info");
      window.open(callUrl, "_blank");
      
    } catch (error) {
      addLog(`❌ DOCTOR: Join failed - ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  };

  const endCall = async () => {
    try {
      if (activeCall) {
        addLog(`📞 Ending call: ${activeCall.callId}`, "info");
        await agoraCallingService.endCall(activeCall.callId);
        addLog(`✅ Call ended successfully`, "success");
        setActiveCall(null);
      } else {
        addLog("❌ No active call to end", "error");
      }
    } catch (error) {
      addLog(`❌ Error ending call: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  };

  const checkForIncomingCalls = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const response = await fetch(`/api/agora/notify-incoming-call?doctorId=${encodeURIComponent(userId)}`);
      
      if (response.ok) {
        const data = await response.json();
        addLog(`📥 Incoming calls check: ${data.calls?.length || 0} calls found`, "info");
        
        if (data.calls && data.calls.length > 0) {
          data.calls.forEach((call: any) => {
            addLog(`📞 Found incoming call: ${call.callerName} (${call.callId})`, "success");
          });
        }
      }
    } catch (error) {
      addLog(`❌ Error checking incoming calls: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
            <CardTitle className="text-center text-3xl">
              🎥 Complete Video Call Flow Test
            </CardTitle>
            <p className="text-center text-green-100 text-lg">
              End-to-end testing for patient-doctor video calls
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Controls */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                🎮 <span>Test Controls</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Role:</label>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setCurrentRole("patient")}
                    variant={currentRole === "patient" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                  >
                    👤 Patient
                  </Button>
                  <Button
                    onClick={() => setCurrentRole("doctor")}
                    variant={currentRole === "doctor" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                  >
                    👨‍⚕️ Doctor
                  </Button>
                </div>
              </div>

              {/* Status */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold">Current Role: {currentRole}</div>
                <div className="text-sm text-gray-600">
                  Status: {connectionStatus}
                </div>
                {activeCall && (
                  <div className="text-sm text-green-600 mt-1">
                    Active Call: {activeCall.callId}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  onClick={startPatientCall}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={currentRole !== "patient"}
                >
                  🚀 Start Call (Patient)
                </Button>
                
                <Button
                  onClick={doctorJoinCall}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={currentRole !== "doctor"}
                >
                  🔗 Join Call (Doctor)
                </Button>
                
                <Button
                  onClick={checkForIncomingCalls}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={currentRole !== "doctor"}
                >
                  📥 Check Incoming Calls
                </Button>
                
                <Button
                  onClick={endCall}
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={!activeCall}
                >
                  📞 End Call
                </Button>
              </div>

              {/* Navigation */}
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-semibold text-sm">Quick Links:</h4>
                <div className="space-y-1">
                  <Link href="/patient/dashboard" className="block">
                    <Button variant="outline" size="sm" className="w-full text-left justify-start">
                      👤 Patient Dashboard
                    </Button>
                  </Link>
                  <Link href="/doctor/dashboard" className="block">
                    <Button variant="outline" size="sm" className="w-full text-left justify-start">
                      👨‍⚕️ Doctor Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Instructions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                📋 <span>Testing Instructions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <h3 className="font-bold text-yellow-800 mb-2">🧪 Complete Test Flow:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700">
                  <li><strong>Open two browser tabs/windows</strong></li>
                  <li><strong>Tab 1:</strong> Select "Patient" role, click "Start Call"</li>
                  <li><strong>Tab 2:</strong> Select "Doctor" role, click "Check Incoming Calls"</li>
                  <li><strong>Tab 2:</strong> Click "Join Call" to join the same channel</li>
                  <li><strong>Both tabs:</strong> Video call windows should open</li>
                  <li><strong>Test:</strong> Both users should see each other's video</li>
                  <li><strong>Test:</strong> Click red "End Call" button to test hang-up</li>
                </ol>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="font-bold text-green-800 mb-2">✅ Expected Results:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                  <li>Both users connect to same Agora channel</li>
                  <li>Video and audio work bidirectionally</li>
                  <li>End call button works for both users</li>
                  <li>Connection status updates properly</li>
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h3 className="font-bold text-red-800 mb-2">🚨 Troubleshooting:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  <li>Check browser console for errors</li>
                  <li>Verify camera/microphone permissions</li>
                  <li>Ensure both users use same channel name</li>
                  <li>Check logs for connection details</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Logs */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  📄 <span>System Logs</span>
                </span>
                <Button onClick={clearLogs} variant="outline" size="sm">
                  Clear
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-gray-500">No logs yet...</p>
                ) : (
                  logs.map((log, index) => (
                    <div 
                      key={index} 
                      className={`mb-1 ${
                        log.includes('❌') ? 'text-red-400' :
                        log.includes('✅') ? 'text-green-400' :
                        log.includes('📞') ? 'text-blue-400' :
                        'text-gray-300'
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
      </div>
    </div>
  );
}