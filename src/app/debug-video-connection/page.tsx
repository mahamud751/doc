"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function VideoCallDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<any>({});

  const addLog = (message: string, type: "info" | "success" | "error" | "warning" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [logMessage, ...prev.slice(0, 49)]);
    console.log(logMessage);
  };

  const testAgoraConnection = async () => {
    addLog("🧪 Starting Agora connection test...", "info");
    
    try {
      // Test 1: Check if AgoraRTC is available
      addLog("📋 Test 1: Checking AgoraRTC availability...", "info");
      
      const script = document.createElement('script');
      script.src = 'https://download.agora.io/sdk/release/AgoraRTC_N-4.14.0.js';
      script.onload = () => {
        addLog("✅ AgoraRTC SDK loaded successfully", "success");
        
        // Test 2: Create Agora client
        const AgoraRTC = (window as any).AgoraRTC;
        if (AgoraRTC) {
          addLog("✅ AgoraRTC object found", "success");
          
          try {
            const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
            addLog("✅ Agora client created successfully", "success");
            
            // Test 3: Check token generation
            testTokenGeneration();
            
          } catch (clientError) {
            addLog(`❌ Failed to create Agora client: ${clientError}`, "error");
          }
        } else {
          addLog("❌ AgoraRTC object not found after loading", "error");
        }
      };
      
      script.onerror = () => {
        addLog("❌ Failed to load AgoraRTC SDK", "error");
      };
      
      document.head.appendChild(script);
      
    } catch (error) {
      addLog(`❌ Connection test failed: ${error}`, "error");
    }
  };

  const testTokenGeneration = async () => {
    addLog("📋 Test 2: Testing token generation...", "info");
    
    try {
      const response = await fetch('/api/agora/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          channelName: 'test_channel_debug',
          uid: 12345,
          role: 'patient'
        })
      });
      
      if (response.ok) {
        const tokenData = await response.json();
        addLog("✅ Token generated successfully", "success");
        addLog(`📊 App ID: ${tokenData.appId}`, "info");
        addLog(`📊 Token length: ${tokenData.token?.length || 0}`, "info");
        addLog(`📊 Channel: ${tokenData.channel}`, "info");
        addLog(`📊 UID: ${tokenData.uid}`, "info");
        
        setTestResults(prev => ({ ...prev, tokenData }));
        
        // Test 3: Simulate join attempt
        testChannelJoin(tokenData);
        
      } else {
        const errorData = await response.text();
        addLog(`❌ Token generation failed: ${response.status} - ${errorData}`, "error");
      }
    } catch (error) {
      addLog(`❌ Token test failed: ${error}`, "error");
    }
  };

  const testChannelJoin = async (tokenData: any) => {
    addLog("📋 Test 3: Testing Agora channel join...", "info");
    
    try {
      const AgoraRTC = (window as any).AgoraRTC;
      if (!AgoraRTC) {
        addLog("❌ AgoraRTC not available for join test", "error");
        return;
      }
      
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      
      addLog(`📊 Attempting to join channel: ${tokenData.channel}`, "info");
      addLog(`📊 Using App ID: ${tokenData.appId}`, "info");
      addLog(`📊 Using UID: ${tokenData.uid}`, "info");
      addLog(`📊 Token provided: ${!!tokenData.token}`, "info");
      
      // Add event listeners for debugging
      client.on('user-published', (user: any, mediaType: string) => {
        addLog(`🎉 User published ${mediaType}: ${user.uid}`, "success");
      });
      
      client.on('user-joined', (user: any) => {
        addLog(`👋 User joined: ${user.uid}`, "success");
      });
      
      client.on('connection-state-change', (curState: string, revState: string) => {
        addLog(`🔄 Connection state: ${revState} → ${curState}`, "info");
      });
      
      // Attempt to join
      await client.join(
        tokenData.appId,
        tokenData.channel,
        tokenData.token,
        tokenData.uid
      );
      
      addLog("✅ Successfully joined Agora channel!", "success");
      addLog("🎯 Agora connection is working properly", "success");
      
      // Clean up
      setTimeout(async () => {
        try {
          await client.leave();
          addLog("🚪 Left channel for cleanup", "info");
        } catch (e) {
          addLog(`⚠️ Cleanup warning: ${e}`, "warning");
        }
      }, 3000);
      
    } catch (error) {
      addLog(`❌ Channel join failed: ${error}`, "error");
      
      // Provide specific guidance based on error
      const errorMessage = String(error);
      if (errorMessage.includes('invalid vendor key')) {
        addLog("💡 Solution: App ID issue - check environment variables", "warning");
      } else if (errorMessage.includes('token')) {
        addLog("💡 Solution: Token issue - check token generation logic", "warning");
      } else if (errorMessage.includes('CAN_NOT_GET_GATEWAY_SERVER')) {
        addLog("💡 Solution: Network issue - check firewall/proxy settings", "warning");
      }
    }
  };

  const testVideoCallUrls = () => {
    addLog("📋 Testing video call URLs from your example...", "info");
    
    const patientUrl = new URL("http://localhost:3000/patient/video-call?channel=appointment_cmgh1fbmt000yiqpbp1zq1elt&token=007eJxTYJjbdORgdalInKcUx3Kx4oSKHROC1opbnFzL0b7syoLtRdYKDAaJKYYpaeZppmmWRiaGqeZJKcnJyRbGRiYppoZmaUbmV2c%2FzQh9%2BywjKGotAyMDIwMLAyMDCDCBSWYwyQImVRkSCwryM%2FNKclPzSuKTc9MzDNOScksMDAwqMwsLkgoMqwoNU3NKWBnMjC1MDQFx5C4b&uid=63851&appId=0ad1df7f5f9241e7bdccc8324d516f27&callId=call_1759878101538_cmg9wf5cz0002iquja4tlgrz5_cmgh0qpqi0000iqpbzis9po2t&appointmentId=cmgh1fbmt000yiqpbp1zq1elt");
    
    const doctorUrl = new URL("http://localhost:3000/doctor/video-call?channel=appointment_cmgh1fbmt000yiqpbp1zq1elt&token=007eJxTYMhYvDbjvdRrV31%2BxycuX2RLEpRy2l4rH%2F9v%2BWX19FlP1H4oMBgkphimpJmnmaZZGpkYpponpSQnJ1sYG5mkmBqapRmZ3539NCP27bOMuHWLWRgZGBlYGBgZQIAJTDKDSRYwqcqQWFCQn5lXkpuaVxKfnJueYZiWlFtiYGBQmVlYkFRgWFVomJpTwsZgbGBiaWAIAPJ5MPY%3D&uid=304901&appId=0ad1df7f5f9241e7bdccc8324d516f27&appointmentId=cmgh1fbmt000yiqpbp1zq1elt&callId=call_1759878026503_unknown_caller_cmgh0qpqi0000iqpbzis9po2t");
    
    addLog("📊 Patient URL Analysis:", "info");
    addLog(`   Channel: ${patientUrl.searchParams.get('channel')}`, "info");
    addLog(`   UID: ${patientUrl.searchParams.get('uid')}`, "info");
    addLog(`   App ID: ${patientUrl.searchParams.get('appId')}`, "info");
    addLog(`   Call ID: ${patientUrl.searchParams.get('callId')}`, "info");
    
    addLog("📊 Doctor URL Analysis:", "info");
    addLog(`   Channel: ${doctorUrl.searchParams.get('channel')}`, "info");
    addLog(`   UID: ${doctorUrl.searchParams.get('uid')}`, "info");
    addLog(`   App ID: ${doctorUrl.searchParams.get('appId')}`, "info");
    addLog(`   Call ID: ${doctorUrl.searchParams.get('callId')}`, "info");
    
    // Check for consistency
    const patientChannel = patientUrl.searchParams.get('channel');
    const doctorChannel = doctorUrl.searchParams.get('channel');
    const patientAppId = patientUrl.searchParams.get('appId');
    const doctorAppId = doctorUrl.searchParams.get('appId');
    
    if (patientChannel === doctorChannel) {
      addLog("✅ Both users using same channel name", "success");
    } else {
      addLog("❌ Different channel names - this will prevent connection!", "error");
    }
    
    if (patientAppId === doctorAppId) {
      addLog("✅ Both users using same App ID", "success");
    } else {
      addLog("❌ Different App IDs - this will prevent connection!", "error");
    }
    
    const patientCallId = patientUrl.searchParams.get('callId');
    const doctorCallId = doctorUrl.searchParams.get('callId');
    
    if (patientCallId !== doctorCallId) {
      addLog("⚠️ Different call IDs - this indicates session coordination issue", "warning");
      addLog("💡 This might be why users can't see each other", "warning");
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setTestResults({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
            <CardTitle className="text-center text-3xl">
              🔍 Video Call Connection Debugger
            </CardTitle>
            <p className="text-center text-red-100 text-lg">
              Diagnose and fix Agora connection issues
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                🛠️ <span>Debug Tools</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <Button
                onClick={testAgoraConnection}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                🧪 Test Agora Connection
              </Button>
              
              <Button
                onClick={testVideoCallUrls}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                📊 Analyze Your Call URLs
              </Button>
              
              <Button
                onClick={clearLogs}
                className="w-full bg-gray-600 hover:bg-gray-700"
              >
                🗑️ Clear Logs
              </Button>

              {/* Test Results Summary */}
              {Object.keys(testResults).length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2">Test Results:</h3>
                  {testResults.tokenData && (
                    <div className="text-sm space-y-1">
                      <div>✅ Token generation: Working</div>
                      <div>📱 App ID: {testResults.tokenData.appId?.substring(0, 8)}...</div>
                      <div>🔑 Token: {testResults.tokenData.token ? 'Generated' : 'Missing'}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Debug Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  📄 <span>Debug Logs</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-gray-500">Click "Test Agora Connection" to start debugging...</p>
                ) : (
                  logs.map((log, index) => (
                    <div 
                      key={index} 
                      className={`mb-1 ${
                        log.includes('❌') ? 'text-red-400' :
                        log.includes('✅') ? 'text-green-400' :
                        log.includes('⚠️') ? 'text-yellow-400' :
                        log.includes('💡') ? 'text-blue-400' :
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
            <CardTitle className="flex items-center space-x-2">
              📋 <span>Debugging Instructions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <h3 className="font-bold text-yellow-800 mb-2">🔍 How to Debug:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700">
                <li><strong>Run Agora Test:</strong> Click "Test Agora Connection" to verify SDK and token generation</li>
                <li><strong>Analyze URLs:</strong> Click "Analyze Your Call URLs" to check parameter consistency</li>
                <li><strong>Check Browser Console:</strong> Open DevTools and look for Agora-related errors</li>
                <li><strong>Verify Network:</strong> Ensure no firewall blocking Agora servers</li>
                <li><strong>Test Permissions:</strong> Check camera/microphone permissions in browser</li>
              </ol>
            </div>

            <div className="mt-4 bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
              <h3 className="font-bold text-red-800 mb-2">🚨 Common Issues:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                <li><strong>Invalid vendor key:</strong> App ID not recognized by Agora</li>
                <li><strong>Token errors:</strong> Token generation or validation issues</li>
                <li><strong>Different channels:</strong> Users joining different channel names</li>
                <li><strong>Network blocking:</strong> Firewall blocking Agora servers</li>
                <li><strong>Session mismatch:</strong> Different call IDs causing coordination issues</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}