"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function TestYourUrls() {
  const [logs, setLogs] = useState<string[]>([]);
  const [patientWindow, setPatientWindow] = useState<Window | null>(null);
  const [doctorWindow, setDoctorWindow] = useState<Window | null>(null);

  const addLog = (message: string, type: "info" | "success" | "error" | "warning" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [logMessage, ...prev.slice(0, 49)]);
    console.log(logMessage);
  };

  const patientUrl = "http://localhost:3000/patient/video-call?channel=appointment_cmgh1fbmt000yiqpbp1zq1elt&token=007eJxTYJjbdORgdalInKcUx3Kx4oSKHROC1opbnFzL0b7syoLtRdYKDAaJKYYpaeZppmmWRiaGqeZJKcnJyRbGRiYppoZmaUbmV2c%2FzQh9%2BywjKGotAyMDIwMLAyMDCDCBSWYwyQImVRkSCwryM%2FNKclPzSuKTc9MzDNOScksMDAwqMwsLkgoMqwoNU3NKWBnMjC1MDQFx5C4b&uid=63851&appId=0ad1df7f5f9241e7bdccc8324d516f27&callId=call_1759878101538_cmg9wf5cz0002iquja4tlgrz5_cmgh0qpqi0000iqpbzis9po2t&appointmentId=cmgh1fbmt000yiqpbp1zq1elt";
  
  const doctorUrl = "http://localhost:3000/doctor/video-call?channel=appointment_cmgh1fbmt000yiqpbp1zq1elt&token=007eJxTYMhYvDbjvdRrV31%2BxycuX2RLEpRy2l4rH%2F9v%2BWX19FlP1H4oMBgkphimpJmnmaZZGpkYpponpSQnJ1sYG5mkmBqapRmZ3539NCP27bOMuHWLWRgZGBlYGBgZQIAJTDKDSRYwqcqQWFCQn5lXkpuaVxKfnJueYZiWlFtiYGBQmVlYkFRgWFVomJpTwsZgbGBiaWAIAPJ5MPY%3D&uid=304901&appId=0ad1df7f5f9241e7bdccc8324d516f27&appointmentId=cmgh1fbmt000yiqpbp1zq1elt&callId=call_1759878026503_unknown_caller_cmgh0qpqi0000iqpbzis9po2t";

  const openPatientCall = () => {
    addLog("🤒 Opening Patient video call window...", "info");
    const newWindow = window.open(patientUrl, "patient_call", "width=800,height=600");
    if (newWindow) {
      setPatientWindow(newWindow);
      addLog("✅ Patient video call window opened", "success");
    } else {
      addLog("❌ Failed to open patient window - popup blocked?", "error");
    }
  };

  const openDoctorCall = () => {
    addLog("👨‍⚕️ Opening Doctor video call window...", "info");
    const newWindow = window.open(doctorUrl, "doctor_call", "width=800,height=600");
    if (newWindow) {
      setDoctorWindow(newWindow);
      addLog("✅ Doctor video call window opened", "success");
    } else {
      addLog("❌ Failed to open doctor window - popup blocked?", "error");
    }
  };

  const openBothCalls = () => {
    addLog("🚀 Opening both video call windows simultaneously...", "info");
    openPatientCall();
    setTimeout(() => {
      openDoctorCall();
    }, 1000); // Small delay to prevent browser blocking
  };

  const analyzeUrls = () => {
    addLog("🔍 Analyzing your video call URLs...", "info");
    
    const patientUrlObj = new URL(patientUrl);
    const doctorUrlObj = new URL(doctorUrl);
    
    addLog("📊 URL Analysis Results:", "info");
    
    // Check channel consistency
    const patientChannel = patientUrlObj.searchParams.get('channel');
    const doctorChannel = doctorUrlObj.searchParams.get('channel');
    
    if (patientChannel === doctorChannel) {
      addLog(`✅ Channel Match: ${patientChannel}`, "success");
    } else {
      addLog(`❌ Channel Mismatch: Patient=${patientChannel}, Doctor=${doctorChannel}`, "error");
    }
    
    // Check App ID consistency
    const patientAppId = patientUrlObj.searchParams.get('appId');
    const doctorAppId = doctorUrlObj.searchParams.get('appId');
    
    if (patientAppId === doctorAppId) {
      addLog(`✅ App ID Match: ${patientAppId}`, "success");
    } else {
      addLog(`❌ App ID Mismatch: Patient=${patientAppId}, Doctor=${doctorAppId}`, "error");
    }
    
    // Check UIDs
    const patientUid = patientUrlObj.searchParams.get('uid');
    const doctorUid = doctorUrlObj.searchParams.get('uid');
    
    addLog(`📱 Patient UID: ${patientUid}`, "info");
    addLog(`📱 Doctor UID: ${doctorUid}`, "info");
    
    if (patientUid === doctorUid) {
      addLog(`⚠️ Same UID detected - this might cause issues`, "warning");
    } else {
      addLog(`✅ Different UIDs (this is correct)`, "success");
    }
    
    // Check tokens
    const patientToken = patientUrlObj.searchParams.get('token');
    const doctorToken = doctorUrlObj.searchParams.get('token');
    
    if (patientToken && doctorToken) {
      addLog(`✅ Both users have tokens`, "success");
      addLog(`📝 Patient token length: ${patientToken.length}`, "info");
      addLog(`📝 Doctor token length: ${doctorToken.length}`, "info");
    } else {
      addLog(`❌ Missing tokens`, "error");
    }
  };

  const testAgoraDirectly = async () => {
    addLog("🧪 Testing Agora connection directly...", "info");
    
    try {
      // Test token generation with your exact channel
      const response = await fetch('/api/agora/test-token?channelName=appointment_cmgh1fbmt000yiqpbp1zq1elt&uid=99999&role=publisher');
      
      if (response.ok) {
        const data = await response.json();
        addLog("✅ Token generation working", "success");
        addLog(`📊 App ID: ${data.appId}`, "info");
        addLog(`📊 Channel: ${data.channel}`, "info");
      } else {
        addLog("❌ Token generation failed", "error");
      }
    } catch (error) {
      addLog(`❌ Agora test error: ${error}`, "error");
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    addLog("🎯 Testing your exact video call URLs", "info");
    addLog("📋 Instructions: Click 'Open Both Calls' and check browser console for detailed logs", "info");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardTitle className="text-center text-3xl">
              🎯 Test Your Exact Video Call URLs
            </CardTitle>
            <p className="text-center text-purple-100 text-lg">
              Debug the specific connection issue with your URLs
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
              
              <Button
                onClick={testAgoraDirectly}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                🧪 Test Agora Connection
              </Button>
              
              <div className="border-t pt-4">
                <Button
                  onClick={openPatientCall}
                  className="w-full mb-2 bg-orange-600 hover:bg-orange-700"
                >
                  🤒 Open Patient Call Window
                </Button>
                
                <Button
                  onClick={openDoctorCall}
                  className="w-full mb-2 bg-purple-600 hover:bg-purple-700"
                >
                  👨‍⚕️ Open Doctor Call Window
                </Button>
                
                <Button
                  onClick={openBothCalls}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  🚀 Open Both Calls (RECOMMENDED)
                </Button>
              </div>
              
              <Button
                onClick={clearLogs}
                className="w-full bg-gray-600 hover:bg-gray-700"
              >
                🗑️ Clear Logs
              </Button>

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
                  <p className="text-gray-500">Click 'Analyze URLs' to start testing...</p>
                ) : (
                  logs.map((log, index) => (
                    <div 
                      key={index} 
                      className={`mb-1 ${
                        log.includes('❌') ? 'text-red-400' :
                        log.includes('✅') ? 'text-green-400' :
                        log.includes('⚠️') ? 'text-yellow-400' :
                        log.includes('🔍') ? 'text-blue-400' :
                        log.includes('🎯') ? 'text-purple-400' :
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

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Debugging Your Specific Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="font-bold text-green-800 mb-2">✅ What's Working:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                  <li>Same channel name in both URLs</li>
                  <li>Same App ID in both URLs</li>
                  <li>Valid token formats</li>
                  <li>Different UIDs (correct)</li>
                  <li>Video call pages are loading</li>
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h3 className="font-bold text-red-800 mb-2">🚨 Likely Issue:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  <li>Users connecting but not detecting each other</li>
                  <li>Event handlers not firing properly</li>
                  <li>Media track creation/publishing issues</li>
                  <li>Camera/microphone permissions</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-bold text-blue-800 mb-2">🔍 Next Steps:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                <li><strong>Click "Open Both Calls"</strong> to test simultaneously</li>
                <li><strong>Allow camera/microphone permissions</strong> in both windows</li>
                <li><strong>Check browser console</strong> for detailed Agora logs</li>
                <li><strong>Look for "USER PUBLISHED EVENT"</strong> messages in console</li>
                <li><strong>Watch for user-joined/user-published events</strong></li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}