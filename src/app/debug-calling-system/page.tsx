"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { callingService, ActiveCall } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";

export default function DebugCallingSystem() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isPatient, setIsPatient] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const [userId, setUserId] = useState("");
  const [doctorId, setDoctorId] = useState("doctor_debug_123");
  const [hasIncomingCall, setHasIncomingCall] = useState(false);
  const [callDetails, setCallDetails] = useState<ActiveCall | null>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`%c${logMessage}`, `color: ${
      type === 'success' ? 'green' : 
      type === 'error' ? 'red' : 
      type === 'warning' ? 'orange' : 'blue'
    }`);
    setLogs(prev => [logMessage, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    addLog("🚀 Debug Calling System Loaded", 'info');
    
    // Monitor socket connection status
    const checkStatus = () => {
      addLog(`📡 Socket Status: ${socketClient.isConnected() ? 'Connected' : 'Disconnected'}`, 
        socketClient.isConnected() ? 'success' : 'error');
    };
    
    checkStatus();
    const statusInterval = setInterval(checkStatus, 5000);
    
    return () => clearInterval(statusInterval);
  }, []);

  const setupAsPatient = () => {
    const patientId = `patient_debug_${Date.now()}`;
    setUserId(patientId);
    
    localStorage.setItem("authToken", "debug_token_patient");
    localStorage.setItem("userId", patientId);
    localStorage.setItem("userName", "Debug Patient");
    localStorage.setItem("userRole", "PATIENT");
    
    addLog(`🤒 Setting up as PATIENT: ${patientId}`, 'info');
    
    socketClient.connect("debug_token_patient", patientId, "PATIENT");
    setIsPatient(true);
    
    addLog(`✅ Patient setup complete: ${patientId}`, 'success');
  };

  const setupAsDoctor = () => {
    const doctorUserId = doctorId;
    setUserId(doctorUserId);
    
    localStorage.setItem("authToken", "debug_token_doctor");
    localStorage.setItem("userId", doctorUserId);
    localStorage.setItem("userName", "Debug Doctor");
    localStorage.setItem("userRole", "DOCTOR");
    
    addLog(`👨‍⚕️ Setting up as DOCTOR: ${doctorUserId}`, 'info');
    
    socketClient.connect("debug_token_doctor", doctorUserId, "DOCTOR");
    setIsDoctor(true);
    
    // Enhanced doctor incoming call listener
    callingService.onIncomingCall((call: ActiveCall) => {
      addLog(`📞 DOCTOR RECEIVED INCOMING CALL!`, 'success');
      addLog(`📋 From: ${call.callerName} (${call.callerId})`, 'info');
      addLog(`📋 To: ${call.calleeName} (${call.calleeId})`, 'info');
      addLog(`📋 Call ID: ${call.callId}`, 'info');
      addLog(`📋 Channel: ${call.channelName}`, 'info');
      
      setHasIncomingCall(true);
      setCallDetails(call);
    });
    
    // Enhanced socket event listeners
    socketClient.on("incoming-call", (callData: any) => {
      addLog(`🔔 Socket Event: incoming-call received`, 'warning');
      addLog(`📊 Data: ${JSON.stringify(callData)}`, 'info');
    });
    
    socketClient.on("initiate-call", (callData: any) => {
      addLog(`🔔 Socket Event: initiate-call received`, 'warning');
      addLog(`📊 Data: ${JSON.stringify(callData)}`, 'info');
    });
    
    addLog(`✅ Doctor setup complete: ${doctorUserId}`, 'success');
  };

  const patientCallDoctor = async () => {
    if (!isPatient) {
      addLog("❌ Must be set up as patient first", 'error');
      return;
    }

    try {
      addLog(`📞 PATIENT initiating call to doctor ${doctorId}...`, 'info');
      addLog(`📊 Patient ID: ${userId}`, 'info');
      addLog(`📊 Doctor ID: ${doctorId}`, 'info');
      
      const appointmentId = `debug_appointment_${Date.now()}`;
      const channelName = `debug_channel_${Date.now()}`;
      
      addLog(`📊 Appointment ID: ${appointmentId}`, 'info');
      addLog(`📊 Channel Name: ${channelName}`, 'info');
      
      const call = await callingService.initiateCall(
        {
          calleeId: doctorId,
          calleeName: "Debug Doctor",
          appointmentId: appointmentId,
          channelName: channelName,
        },
        userId,
        "Debug Patient"
      );
      
      addLog(`✅ Call initiated successfully!`, 'success');
      addLog(`📊 Call ID: ${call.callId}`, 'info');
      addLog(`📊 Status: ${call.status}`, 'info');
      
      // Monitor call status
      setTimeout(() => {
        addLog(`⏰ Checking if doctor received call after 2 seconds...`, 'warning');
      }, 2000);
      
    } catch (error) {
      addLog(`❌ Call failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };

  const testAPIDirectly = async () => {
    addLog(`🧪 Testing API directly...`, 'info');
    
    try {
      // Test emit API
      const emitResponse = await fetch('/api/events/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer debug_token`,
        },
        body: JSON.stringify({
          userId: userId || 'test_patient',
          eventType: 'initiate-call',
          data: {
            callId: `api_test_${Date.now()}`,
            callerId: userId || 'test_patient',
            callerName: 'API Test Patient',
            calleeId: doctorId,
            calleeName: 'Debug Doctor',
            appointmentId: 'api_test_appointment',
            channelName: 'api_test_channel',
            status: 'ringing'
          }
        })
      });
      
      if (emitResponse.ok) {
        const emitResult = await emitResponse.json();
        addLog(`✅ API Emit successful: ${emitResult.eventId}`, 'success');
      } else {
        addLog(`❌ API Emit failed: ${emitResponse.status}`, 'error');
      }
      
      // Test poll API
      setTimeout(async () => {
        const pollResponse = await fetch(`/api/events/poll?userId=${doctorId}&since=0`, {
          headers: {
            'Authorization': `Bearer debug_token`,
          }
        });
        
        if (pollResponse.ok) {
          const events = await pollResponse.json();
          addLog(`📥 Poll API returned ${events.length} events`, 'info');
          events.forEach((event: any, index: number) => {
            addLog(`📊 Event ${index + 1}: ${event.eventType} - ${JSON.stringify(event.data)}`, 'info');
          });
        } else {
          addLog(`❌ Poll API failed: ${pollResponse.status}`, 'error');
        }
      }, 1000);
      
    } catch (error) {
      addLog(`❌ API test failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };

  const acceptCall = () => {
    if (callDetails) {
      addLog(`✅ Doctor accepting call: ${callDetails.callId}`, 'success');
      callingService.acceptCall(callDetails.callId, userId);
      setHasIncomingCall(false);
      setCallDetails(null);
    }
  };

  const rejectCall = () => {
    if (callDetails) {
      addLog(`❌ Doctor rejecting call: ${callDetails.callId}`, 'warning');
      callingService.rejectCall(callDetails.callId, userId);
      setHasIncomingCall(false);
      setCallDetails(null);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
            <CardTitle className="text-3xl font-bold text-gray-900">
              🐛 Real-Time Calling System Debug
            </CardTitle>
            <p className="text-gray-600">Debug patient-to-doctor calling with detailed logging</p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Setup Panel */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold">🛠️ Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={setupAsPatient}
                disabled={isPatient}
                className={`w-full ${isPatient ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {isPatient ? '✅ Patient Ready' : '🤒 Setup as Patient'}
              </Button>
              
              <Button 
                onClick={setupAsDoctor}
                disabled={isDoctor}
                className={`w-full ${isDoctor ? 'bg-green-500' : 'bg-purple-500 hover:bg-purple-600'}`}
              >
                {isDoctor ? '✅ Doctor Ready' : '👨‍⚕️ Setup as Doctor'}
              </Button>
              
              {(isPatient || isDoctor) && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p><strong>Current User:</strong></p>
                  <p>{isPatient ? '🤒 Patient' : '👨‍⚕️ Doctor'}: {userId}</p>
                  <p><strong>Socket:</strong> {socketClient.isConnected() ? '🟢 Connected' : '🔴 Disconnected'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Actions */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold">🧪 Test Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={patientCallDoctor}
                disabled={!isPatient}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                📞 Patient Call Doctor
              </Button>
              
              <Button 
                onClick={testAPIDirectly}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                🧪 Test API Directly
              </Button>
              
              {hasIncomingCall && callDetails && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="font-bold text-red-800">📞 INCOMING CALL!</p>
                  <p className="text-sm">From: {callDetails.callerName}</p>
                  <div className="flex space-x-2 mt-3">
                    <Button onClick={acceptCall} className="bg-green-500 hover:bg-green-600 text-xs">
                      ✅ Accept
                    </Button>
                    <Button onClick={rejectCall} className="bg-red-500 hover:bg-red-600 text-xs">
                      ❌ Reject
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Panel */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold">📊 Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between">
                  <span>Socket Connected:</span>
                  <span className={socketClient.isConnected() ? 'text-green-600' : 'text-red-600'}>
                    {socketClient.isConnected() ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Socket User ID:</span>
                  <span className="text-xs">{socketClient.getUserId() || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Socket Role:</span>
                  <span>{socketClient.getUserRole() || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Page Setup:</span>
                  <span>{isPatient ? '🤒 Patient' : isDoctor ? '👨‍⚕️ Doctor' : '❌ None'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Has Incoming Call:</span>
                  <span className={hasIncomingCall ? 'text-green-600' : 'text-gray-500'}>
                    {hasIncomingCall ? '📞 YES' : '📵 No'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Panel */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold">📝 Real-Time Debug Logs</CardTitle>
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

        {/* Instructions */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold">📋 Debug Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="font-bold">To Test the Complete Flow:</p>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Open this page in TWO browser tabs</li>
                <li>In Tab 1: Click "🤒 Setup as Patient"</li>
                <li>In Tab 2: Click "👨‍⚕️ Setup as Doctor"</li>
                <li>In Patient Tab: Click "📞 Patient Call Doctor"</li>
                <li>Watch the logs in both tabs to see what happens</li>
                <li>Check Doctor Tab for the "📞 INCOMING CALL!" notification</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}