"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { agoraCallingService, CallSession } from "@/lib/agora-calling-service";
import { callNotifications, CallNotification } from "@/lib/call-notifications";

export default function AgoraOnlyDemo() {
  const [currentRole, setCurrentRole] = useState<"patient" | "doctor">("patient");
  const [activeSessions, setActiveSessions] = useState<CallSession[]>([]);
  const [notifications, setNotifications] = useState<CallNotification[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [logMessage, ...prev.slice(0, 19)]);
    console.log(logMessage);
  };

  useEffect(() => {
    // Set up user based on role
    const userId = currentRole === "patient" ? "demo_patient_123" : "demo_doctor_456";
    const userName = currentRole === "patient" ? "Demo Patient" : "Dr. Demo";
    const userRole = currentRole === "patient" ? "PATIENT" : "DOCTOR";
    const authToken = "demo_auth_token";

    localStorage.setItem("userId", userId);
    localStorage.setItem("userName", userName);
    localStorage.setItem("userRole", userRole);
    localStorage.setItem("authToken", authToken);

    addLog(`👤 Set up ${currentRole}: ${userName}`);

    // Listen for notifications
    const handleNotification = (notification: CallNotification) => {
      addLog(`📢 ${notification.title}: ${notification.message}`);
      setNotifications(prev => [notification, ...prev.slice(0, 9)]);
    };

    callNotifications.onNotification(handleNotification);

    return () => {
      callNotifications.offNotification(handleNotification);
    };
  }, [currentRole]);

  const startVideoCall = async () => {
    try {
      addLog("🚀 Starting video call...");
      
      const appointmentId = "demo_appointment_123";
      const doctorId = "demo_doctor_456";
      const doctorName = "Dr. Demo";

      const { callSession, callUrl } = await agoraCallingService.startVideoCall(
        appointmentId,
        doctorId,
        doctorName
      );

      addLog(`✅ Call started: ${callSession.callId}`);
      addLog(`🔗 Call URL: ${callUrl}`);
      
      // Update active sessions
      setActiveSessions([callSession]);

      // In real app, this would open the video call
      addLog("📺 Video call window would open here");
      
    } catch (error) {
      addLog(`❌ Call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const joinVideoCall = async () => {
    try {
      addLog("🔗 Joining video call...");
      
      const appointmentId = "demo_appointment_123";
      const channelName = "appointment_demo_appointment_123";

      const { callUrl } = await agoraCallingService.joinVideoCall(
        appointmentId,
        channelName
      );

      addLog(`✅ Join URL generated: ${callUrl}`);
      addLog("📺 Video call window would open here");
      
    } catch (error) {
      addLog(`❌ Join failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const endCall = () => {
    const currentSession = agoraCallingService.getCurrentSession();
    if (currentSession) {
      agoraCallingService.endCall(currentSession.callId);
      addLog(`📞 Call ended: ${currentSession.callId}`);
      setActiveSessions([]);
    } else {
      addLog("❌ No active call to end");
    }
  };

  const testNotifications = () => {
    const appointmentId = "demo_appointment_123";
    callNotifications.notifyCallStarted(appointmentId, "Dr. Demo");
    callNotifications.notifyCallJoined(appointmentId, "Demo Patient");
    callNotifications.notifyCallEnded(appointmentId, "5:23");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
            <CardTitle className="text-center text-2xl">
              🎥 Agora SDK Only - No Socket.io Demo
            </CardTitle>
            <p className="text-center text-green-100">
              Simple video calling using only Agora SDK (ChatGPT was right!)
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                🎮 <span>Controls</span>
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
                  >
                    👤 Patient
                  </Button>
                  <Button
                    onClick={() => setCurrentRole("doctor")}
                    variant={currentRole === "doctor" ? "default" : "outline"}
                    size="sm"
                  >
                    👨‍⚕️ Doctor
                  </Button>
                </div>
              </div>

              {/* Current Role Display */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold">Current Role: {currentRole}</div>
                <div className="text-sm text-gray-600">
                  User ID: {currentRole === "patient" ? "demo_patient_123" : "demo_doctor_456"}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={startVideoCall} className="bg-green-600 hover:bg-green-700">
                  🚀 Start Call
                </Button>
                <Button onClick={joinVideoCall} className="bg-blue-600 hover:bg-blue-700">
                  🔗 Join Call
                </Button>
                <Button onClick={endCall} className="bg-red-600 hover:bg-red-700">
                  📞 End Call
                </Button>
                <Button onClick={testNotifications} className="bg-purple-600 hover:bg-purple-700">
                  📢 Test Notifications
                </Button>
              </div>

              {/* Active Sessions */}
              <div>
                <h4 className="font-semibold mb-2">Active Sessions:</h4>
                {activeSessions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No active sessions</p>
                ) : (
                  activeSessions.map(session => (
                    <div key={session.callId} className="p-2 bg-gray-50 rounded text-sm">
                      <div>Call ID: {session.callId.substring(0, 20)}...</div>
                      <div>Status: {session.status}</div>
                      <div>Channel: {session.channelName}</div>
                    </div>
                  ))
                )}
              </div>

            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  📢 <span>Notifications</span>
                </span>
                <Button onClick={() => setNotifications([])} variant="outline" size="sm">
                  Clear
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No notifications yet</p>
                ) : (
                  notifications.map(notification => (
                    <div key={notification.id} className={`p-3 rounded-lg border-l-4 ${
                      notification.type === "call-started" ? "bg-green-50 border-green-500" :
                      notification.type === "call-joined" ? "bg-blue-50 border-blue-500" :
                      notification.type === "call-ended" ? "bg-gray-50 border-gray-500" :
                      "bg-red-50 border-red-500"
                    }`}>
                      <div className="font-semibold text-sm">{notification.title}</div>
                      <div className="text-sm text-gray-600">{notification.message}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {notification.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                📝 <span>Event Logs</span>
              </span>
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

        {/* Instructions */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <h3 className="font-bold mb-2">🎯 How Agora-Only Approach Works:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>No Socket.io needed:</strong> Agora SDK handles all real-time video/audio</li>
              <li><strong>Token-based authentication:</strong> Generate Agora tokens via API</li>
              <li><strong>Channel-based communication:</strong> Users join same channel to communicate</li>
              <li><strong>Simple URL sharing:</strong> Both parties get URL with token + channel info</li>
              <li><strong>Optional notifications:</strong> Use simple state/localStorage for UI updates</li>
            </ul>
            
            <h3 className="font-bold mt-4 mb-2">📞 Call Flow:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Patient clicks "Call Doctor" → generates Agora token + channel</li>
              <li>Patient opens video call page with token/channel info</li>
              <li>Doctor gets notification (via database/polling/email/SMS)</li>
              <li>Doctor joins same channel with their own token</li>
              <li>Both users are now in the same Agora video call</li>
              <li>Either party can end call by leaving the channel</li>
            </ol>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}