"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { callingService, ActiveCall } from "@/lib/calling-service";

export default function TestDoctorCalls() {
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [hasIncomingCall, setHasIncomingCall] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [logMessage, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    // Check current user context
    const storedUserId = localStorage.getItem("userId");
    const storedUserRole = localStorage.getItem("userRole");
    const authToken = localStorage.getItem("authToken");
    
    if (storedUserId && storedUserRole && authToken) {
      setUserId(storedUserId);
      setUserRole(storedUserRole);
      addLog(`✅ Loaded user: ${storedUserId} (${storedUserRole})`);
      
      // Set up incoming call listener
      callingService.onIncomingCall((call: ActiveCall) => {
        addLog(`📞 INCOMING CALL from ${call.callerName}!`);
        setHasIncomingCall(true);
      });
      
    } else {
      addLog("❌ No user logged in - please log in first");
    }
  }, []);

  const testIncomingCall = () => {
    if (!userId) {
      addLog("❌ No user logged in");
      return;
    }
    
    addLog("🧪 Testing incoming call directly...");
    
    const testCall: ActiveCall = {
      callId: `manual_test_${Date.now()}`,
      callerId: "test_patient_123",
      callerName: "Manual Test Patient",
      calleeId: userId,
      calleeName: "Test Doctor",
      appointmentId: "manual_test_appointment",
      channelName: `manual_test_channel_${Date.now()}`,
      status: "ringing",
    };
    
    // Trigger the calling service callback directly
    callingService.simulateIncomingCall(testCall);
    addLog("✅ Manual test call triggered");
  };

  const testEmitEvent = async () => {
    if (!userId) {
      addLog("❌ No user logged in");
      return;
    }
    
    addLog("📡 Testing event emission...");
    
    try {
      const response = await fetch('/api/events/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          userId: 'test_patient_456',
          eventType: 'initiate-call',
          data: {
            callId: `emit_test_${Date.now()}`,
            callerId: 'test_patient_456',
            callerName: 'Emit Test Patient',
            calleeId: userId,
            calleeName: 'Test Doctor',
            appointmentId: 'emit_test_appointment',
            channelName: `emit_test_channel_${Date.now()}`,
            status: 'ringing'
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        addLog(`✅ Event emitted successfully: ${result.eventId}`);
      } else {
        addLog(`❌ Event emission failed: ${response.status}`);
      }
    } catch (error) {
      addLog(`❌ Event emission error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
            <CardTitle className="text-3xl font-bold text-gray-900">
              👨‍⚕️ Doctor Incoming Call Test
            </CardTitle>
            <p className="text-gray-600">Test if doctor can receive incoming calls properly</p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold">👤 User Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userId ? (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p><strong>User ID:</strong> {userId}</p>
                  <p><strong>Role:</strong> {userRole}</p>
                  <p><strong>Status:</strong> <span className="text-green-600">✅ Logged In</span></p>
                  <p><strong>Incoming Call:</strong> {hasIncomingCall ? '📞 YES' : '📵 No'}</p>
                </div>
              ) : (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-red-600">❌ No user logged in</p>
                  <p className="text-sm text-gray-600">Please log in as a doctor first</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold">🧪 Test Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testIncomingCall}
                disabled={!userId}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                📞 Test Manual Incoming Call
              </Button>
              
              <Button 
                onClick={testEmitEvent}
                disabled={!userId}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                📡 Test Event Emission
              </Button>
              
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <p><strong>How to use:</strong></p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Make sure you're logged in as a doctor</li>
                  <li>Click "Test Manual Incoming Call" to test the calling service</li>
                  <li>Click "Test Event Emission" to test the real-time API</li>
                  <li>Watch the logs and check for incoming call modals</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold">📝 Test Logs</CardTitle>
            <Button onClick={clearLogs} variant="outline" size="sm">
              Clear Logs
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-y-auto bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet...</p>
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