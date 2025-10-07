"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function TestOriginalUrls() {
  const [logs, setLogs] = useState<string[]>([]);
  const [patientWindow, setPatientWindow] = useState<Window | null>(null);
  const [doctorWindow, setDoctorWindow] = useState<Window | null>(null);

  const addLog = (message: string, type: "info" | "success" | "error" | "warning" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [logMessage, ...prev.slice(0, 49)]);
    console.log(logMessage);
  };

  // Your exact original URLs
  const patientUrl = "http://localhost:3000/patient/video-call?channel=appointment_cmgh1fbmt000yiqpbp1zq1elt&token=007eJxTYJjbdORgdalInKcUx3Kx4oSKHROC1opbnFzL0b7syoLtRdYKDAaJKYYpaeZppmmWRiaGqeZJKcnJyRbGRiYppoZmaUbmV2c%2FzQh9%2BywjKGotAyMDIwMLAyMDCDCBSWYwyQImVRkSCwryM%2FNKclPzSuKTc9MzDNOScksMDAwqMwsLkgoMqwoNU3NKWBnMjC1MDQFx5C4b&uid=63851&appId=0ad1df7f5f9241e7bdccc8324d516f27&callId=call_1759878101538_cmg9wf5cz0002iquja4tlgrz5_cmgh0qpqi0000iqpbzis9po2t&appointmentId=cmgh1fbmt000yiqpbp1zq1elt";
  
  const doctorUrl = "http://localhost:3000/doctor/video-call?channel=appointment_cmgh1fbmt000yiqpbp1zq1elt&token=007eJxTYMhYvDbjvdRrV31%2BxycuX2RLEpRy2l4rH%2F9v%2BWX19FlP1H4oMBgkphimpJmnmaZZGpkYpponpSQnJ1sYG5mkmBqapRmZ3539NCP27bOMuHWLWRgZGBlYGBgZQIAJTDKDSRYwqcqQWFCQn5lXkpuaVxKfnJueYZiWlFtiYGBQmVlYkFRgWFVomJpTwsZgbGBiaWAIAPJ5MPY%3D&uid=304901&appId=0ad1df7f5f9241e7bdccc8324d516f27&appointmentId=cmgh1fbmt000yiqpbp1zq1elt&callId=call_1759878026503_unknown_caller_cmgh0qpqi0000iqpbzis9po2t";

  useEffect(() => {
    addLog("🎯 Testing your EXACT original URLs", "info");
    addLog("🔧 With all applied fixes: same channel coordination + race condition fix", "info");
  }, []);

  const analyzeUrls = () => {
    addLog("🔍 Analyzing your exact URLs...", "info");
    
    const patientUrlObj = new URL(patientUrl);
    const doctorUrlObj = new URL(doctorUrl);
    
    const patientChannel = patientUrlObj.searchParams.get('channel');
    const doctorChannel = doctorUrlObj.searchParams.get('channel');
    const patientUid = patientUrlObj.searchParams.get('uid');
    const doctorUid = doctorUrlObj.searchParams.get('uid');
    const patientAppId = patientUrlObj.searchParams.get('appId');
    const doctorAppId = doctorUrlObj.searchParams.get('appId');
    
    addLog(`📊 Channel Analysis:`, "info");
    if (patientChannel === doctorChannel) {
      addLog(`✅ Same Channel: ${patientChannel}`, "success");
    } else {
      addLog(`❌ Different Channels: Patient=${patientChannel}, Doctor=${doctorChannel}`, "error");
    }
    
    addLog(`📊 UID Analysis:`, "info");
    addLog(`🤒 Patient UID: ${patientUid}`, "info");
    addLog(`👨‍⚕️ Doctor UID: ${doctorUid}`, "info");
    if (patientUid !== doctorUid) {
      addLog(`✅ Different UIDs (correct for Agora)`, "success");
    } else {
      addLog(`❌ Same UIDs (would cause conflicts)`, "error");
    }
    
    addLog(`📊 App ID Analysis:`, "info");
    if (patientAppId === doctorAppId) {
      addLog(`✅ Same App ID: ${patientAppId}`, "success");
    } else {
      addLog(`❌ Different App IDs`, "error");
    }
    
    addLog(`📊 Expected Behavior:`, "info");
    addLog(`🔧 With fixes applied:`, "warning");
    addLog(`   1. Event listeners set up BEFORE joining`, "warning");
    addLog(`   2. Both join same channel: ${patientChannel}`, "warning");
    addLog(`   3. Patient publishes → Doctor gets user-published event`, "warning");
    addLog(`   4. Doctor publishes → Patient gets user-published event`, "warning");
    addLog(`   5. Both see each other's video feeds`, "warning");
  };

  const openPatientCall = () => {
    addLog("🤒 Opening Patient video call window...", "info");
    const newWindow = window.open(patientUrl, "patient_call", "width=900,height=700");
    if (newWindow) {
      setPatientWindow(newWindow);
      addLog("✅ Patient window opened - Check console for logs", "success");
      addLog("👀 Look for: 'PATIENT: Successfully joined channel'", "warning");
    } else {
      addLog("❌ Failed to open patient window - popup blocked?", "error");
    }
  };

  const openDoctorCall = () => {
    addLog("👨‍⚕️ Opening Doctor video call window...", "info");
    const newWindow = window.open(doctorUrl, "doctor_call", "width=900,height=700");
    if (newWindow) {
      setDoctorWindow(newWindow);
      addLog("✅ Doctor window opened - Check console for logs", "success");
      addLog("👀 Look for: 'DOCTOR: Successfully joined channel'", "warning");
    } else {
      addLog("❌ Failed to open doctor window - popup blocked?", "error");
    }
  };

  const openBothCalls = () => {
    addLog("🚀 Opening both video call windows with your EXACT URLs...", "info");
    openPatientCall();
    setTimeout(() => {
      openDoctorCall();
    }, 2000); // 2 second delay
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
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
            <CardTitle className="text-center text-3xl">
              🎯 Test Your EXACT Original URLs
            </CardTitle>
            <p className="text-center text-red-100 text-lg">
              Test the bidirectional connection fix with your specific URLs
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                🎮 <span>Test Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <Button
                onClick={analyzeUrls}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                🔍 Analyze Your URLs
              </Button>
              
              <div className="border-t pt-4">
                <Button
                  onClick={openPatientCall}
                  className="w-full mb-2 bg-orange-600 hover:bg-orange-700"
                >
                  🤒 Open Patient Call (Your URL)
                </Button>
                
                <Button
                  onClick={openDoctorCall}
                  className="w-full mb-2 bg-purple-600 hover:bg-purple-700"
                >
                  👨‍⚕️ Open Doctor Call (Your URL)
                </Button>
                
                <Button
                  onClick={openBothCalls}
                  className="w-full bg-red-600 hover:bg-red-700 text-lg py-4"
                >
                  🚀 Open Both Calls (RECOMMENDED)
                </Button>
              </div>
              
              <div className="border-t pt-4">
                <Button
                  onClick={closeWindows}
                  className="w-full mb-2 bg-gray-600 hover:bg-gray-700"
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
                  <div className={`${patientWindow ? 'text-green-600' : 'text-gray-500'}`}>
                    🤒 Patient: {patientWindow ? 'Open' : 'Closed'}
                  </div>
                  <div className={`${doctorWindow ? 'text-green-600' : 'text-gray-500'}`}>
                    👨‍⚕️ Doctor: {doctorWindow ? 'Open' : 'Closed'}
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
                  <p className="text-gray-500">Click 'Analyze Your URLs' to start...</p>
                ) : (
                  logs.map((log, index) => (
                    <div 
                      key={index} 
                      className={`mb-1 ${
                        log.includes('❌') ? 'text-red-400' :
                        log.includes('✅') ? 'text-green-400' :
                        log.includes('⚠️') || log.includes('👀') ? 'text-yellow-400' :
                        log.includes('🔍') ? 'text-blue-400' :
                        log.includes('🚀') ? 'text-purple-400' :
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

        {/* Debug Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>🔍 Debug Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="font-bold text-green-800 mb-2">✅ What Should Happen:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                  <li>Patient joins channel: appointment_cmgh1fbmt000yiqpbp1zq1elt</li>
                  <li>Patient publishes video/audio tracks</li>
                  <li>Doctor joins SAME channel</li>
                  <li>Doctor receives \"USER PUBLISHED EVENT\" from patient</li>
                  <li>Doctor publishes tracks</li>
                  <li>Patient receives \"USER PUBLISHED EVENT\" from doctor</li>
                  <li>Both see each other's video feeds</li>
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h3 className="font-bold text-red-800 mb-2">🚨 What to Check:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  <li>Browser console logs for \"USER PUBLISHED EVENT\"</li>
                  <li>Camera/microphone permissions granted</li>
                  <li>Both windows show video after ~5-10 seconds</li>
                  <li>\"Connecting...\" messages should disappear</li>
                  <li>Green \"Connected\" status should appear</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-bold text-blue-800 mb-2">🔧 Applied Fixes:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
                <div>
                  <strong>🎯 Same Channel Fix:</strong><br/>
                  Both users use exact same channel name
                </div>
                <div>
                  <strong>⚡ Race Condition Fix:</strong><br/>
                  Event listeners set up BEFORE joining
                </div>
                <div>
                  <strong>🔗 GlobalIncomingCallHandler Fix:</strong><br/>
                  Now connected to Agora polling system
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}