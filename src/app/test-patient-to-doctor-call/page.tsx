"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { callingService, ActiveCall } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";

export default function TestPatientToDoctorCall() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isPatient, setIsPatient] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const [userId, setUserId] = useState("");
  const [doctorId, setDoctorId] = useState("doctor_test_123");

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    addLog("🧪 Test Page Loaded");
  }, []);

  const setupAsPatient = () => {
    const patientId = `patient_${Date.now()}`;
    setUserId(patientId);
    
    localStorage.setItem("authToken", "test_token_patient");
    localStorage.setItem("userId", patientId);
    localStorage.setItem("userName", "Test Patient");
    localStorage.setItem("userRole", "PATIENT");
    
    socketClient.connect("test_token_patient", patientId, "PATIENT");
    setIsPatient(true);
    addLog(`🤒 Set up as PATIENT: ${patientId}`);
  };

  const setupAsDoctor = () => {
    const doctorUserId = doctorId;
    setUserId(doctorUserId);
    
    localStorage.setItem("authToken", "test_token_doctor");
    localStorage.setItem("userId", doctorUserId);
    localStorage.setItem("userName", "Dr. Test");
    localStorage.setItem("userRole", "DOCTOR");
    
    socketClient.connect("test_token_doctor", doctorUserId, "DOCTOR");
    setIsDoctor(true);
    addLog(`👨‍⚕️ Set up as DOCTOR: ${doctorUserId}`);
    
    // Set up incoming call listener for doctor
    callingService.onIncomingCall((call: ActiveCall) => {
      addLog(`📞 DOCTOR RECEIVED INCOMING CALL: ${call.callerName} (${call.callerId})`);
    });
  };

  const patientCallDoctor = async () => {
    if (!isPatient) {
      addLog("❌ Must be set up as patient first");
      return;
    }

    try {
      addLog(`📞 PATIENT calling doctor ${doctorId}...`);
      
      const call = await callingService.initiateCall(
        {
          calleeId: doctorId,
          calleeName: "Dr. Test",
          appointmentId: `test_appointment_${Date.now()}`,
          channelName: `test_channel_${Date.now()}`,
        },
        userId,
        "Test Patient"
      );
      
      addLog(`✅ Call initiated successfully: ${call.callId}`);
      addLog(`📋 Call details: ${call.callerName} → ${call.calleeName}`);
    } catch (error) {
      addLog(`❌ Call failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testDirectEmit = () => {
    addLog("⚡ Testing direct event emit...");
    
    const testCall: ActiveCall = {
      callId: `direct_emit_${Date.now()}`,
      callerId: userId || "test_patient",
      callerName: "Direct Emit Test",
      calleeId: doctorId,
      calleeName: "Dr. Test",
      appointmentId: "direct_test_appointment",
      channelName: `direct_test_${Date.now()}`,
      status: "ringing",
    };
    
    socketClient.emit("initiate-call", testCall);
    addLog("⚡ Emitted initiate-call event directly");
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="text-3xl font-bold text-gray-900">
              🧪 Patient-to-Doctor Call Test
            </CardTitle>
            <p className="text-gray-600">Test the complete patient calling doctor flow</p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Setup Panel */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Setup Test Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button 
                  onClick={setupAsPatient}
                  disabled={isPatient}
                  className={`w-full ${isPatient ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'}`}
                >
                  {isPatient ? '✅ Patient Setup Complete' : '🤒 Setup as Patient'}
                </Button>
                
                <Button 
                  onClick={setupAsDoctor}
                  disabled={isDoctor}
                  className={`w-full ${isDoctor ? 'bg-green-500' : 'bg-purple-500 hover:bg-purple-600'}`}
                >
                  {isDoctor ? '✅ Doctor Setup Complete' : '👨‍⚕️ Setup as Doctor'}
                </Button>
              </div>
              
              {(isPatient || isDoctor) && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Current User:</p>
                  <p className="text-sm text-gray-600">
                    {isPatient ? '🤒 Patient' : '👨‍⚕️ Doctor'}: {userId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Actions */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Test Actions</CardTitle>
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
                onClick={testDirectEmit}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                ⚡ Test Direct Event Emit
              </Button>
              
              <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                <p><strong>Instructions:</strong></p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Open this page in TWO browser tabs</li>
                  <li>Set one as Patient, one as Doctor</li>
                  <li>In Patient tab, click "Patient Call Doctor"</li>
                  <li>Check Doctor tab for incoming call modal</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Panel */}
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

        {/* Status Information */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold">🔍 Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Socket Connected:</strong> {socketClient.isConnected() ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Socket User ID:</strong> {socketClient.getUserId() || 'Not set'}</p>
                <p><strong>Socket User Role:</strong> {socketClient.getUserRole() || 'Not set'}</p>
              </div>
              <div>
                <p><strong>LocalStorage UserID:</strong> {typeof window !== 'undefined' ? localStorage.getItem('userId') || 'Not set' : 'N/A'}</p>
                <p><strong>LocalStorage Role:</strong> {typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'Not set' : 'N/A'}</p>
                <p><strong>Page Setup:</strong> {isPatient ? 'Patient' : isDoctor ? 'Doctor' : 'None'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}