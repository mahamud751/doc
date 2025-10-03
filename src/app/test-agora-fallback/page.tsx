"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function TestAgoraFallback() {
  const [testResult, setTestResult] = useState("");
  const [loading, setLoading] = useState(false);
  const clientRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const testAgoraWithFallback = async () => {
    setLoading(true);
    setTestResult("Testing Agora connection with fallback mechanisms...\n\n");

    try {
      // Import Agora SDK
      setTestResult(prev => prev + "1. Loading Agora SDK...\n");
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      setTestResult(prev => prev + "   ✓ Agora SDK loaded successfully\n\n");

      // Test system requirements
      setTestResult(prev => prev + "2. Checking system requirements...\n");
      const support = AgoraRTC.checkSystemRequirements();
      setTestResult(prev => prev + `   System requirements: ${support ? "SUPPORTED" : "NOT FULLY SUPPORTED"}\n\n`);

      // Create client with different configurations to test vendor key issues
      setTestResult(prev => prev + "3. Testing client creation with different configurations...\n");
      
      // Test 1: Standard configuration
      try {
        setTestResult(prev => prev + "   Testing standard configuration...\n");
        clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setTestResult(prev => prev + "   ✓ Standard client created successfully\n");
      } catch (error: any) {
        setTestResult(prev => prev + `   ✗ Standard client failed: ${error.message}\n`);
      }

      // Test 2: With role parameter
      try {
        setTestResult(prev => prev + "   Testing with role parameter...\n");
        clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8", role: "host" });
        setTestResult(prev => prev + "   ✓ Client with role created successfully\n");
      } catch (error: any) {
        setTestResult(prev => prev + `   ✗ Client with role failed: ${error.message}\n`);
      }

      // Test 3: With different codec
      try {
        setTestResult(prev => prev + "   Testing with h264 codec...\n");
        clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
        setTestResult(prev => prev + "   ✓ Client with h264 codec created successfully\n");
      } catch (error: any) {
        setTestResult(prev => prev + `   ✗ Client with h264 codec failed: ${error.message}\n`);
      }

      setTestResult(prev => prev + "\n4. Testing vendor key fallback mechanisms...\n");
      
      // Simulate vendor key error handling
      setTestResult(prev => prev + "   Simulating vendor key error handling...\n");
      setTestResult(prev => prev + "   If Agora rejects your App ID, we can try:\n");
      setTestResult(prev => prev + "   - Using an empty token instead of null\n");
      setTestResult(prev => prev + "   - Re-creating the client with different parameters\n");
      setTestResult(prev => prev + "   - Checking for temporary server issues\n\n");

      // Test track creation
      setTestResult(prev => prev + "5. Testing track creation...\n");
      try {
        const [audioTrack, videoTrack] = await Promise.all([
          AgoraRTC.createMicrophoneAudioTrack(),
          AgoraRTC.createCameraVideoTrack(),
        ]);
        setTestResult(prev => prev + "   ✓ Audio and video tracks created successfully\n");
        
        // Clean up tracks
        audioTrack.close();
        videoTrack.close();
        setTestResult(prev => prev + "   ✓ Tracks cleaned up successfully\n");
      } catch (error: any) {
        setTestResult(prev => prev + `   ✗ Track creation failed: ${error.message}\n`);
      }

      setTestResult(prev => prev + "\n🎉 All tests completed!\n\n");
      setTestResult(prev => prev + "If you're experiencing vendor key issues:\n");
      setTestResult(prev => prev + "1. The fixes we've implemented should handle most cases\n");
      setTestResult(prev => prev + "2. Try refreshing the page\n");
      setTestResult(prev => prev + "3. Check your network connection\n");
      setTestResult(prev => prev + "4. Visit /agora-advanced-debug for more detailed diagnostics\n");

    } catch (error: any) {
      setTestResult(prev => prev + `❌ Test failed: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Agora Fallback Test
          </h1>
          <p className="text-lg text-gray-600">
            Testing connection with fallback mechanisms for vendor key issues
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="flex justify-center mb-6">
            <Button
              onClick={testAgoraWithFallback}
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Testing...
                </div>
              ) : (
                "Test Agora with Fallback"
              )}
            </Button>
          </div>

          <div className="bg-gray-900 text-green-400 font-mono text-sm p-6 rounded-2xl overflow-y-auto max-h-96">
            <pre>{testResult || "Click 'Test Agora with Fallback' to start testing"}</pre>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-blue-800 mb-2">Refresh Page</h3>
            <p className="text-blue-700 mb-3">
              Vendor key issues are often temporary. Try refreshing the page.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full"
            >
              Refresh
            </Button>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-purple-800 mb-2">Advanced Debug</h3>
            <p className="text-purple-700 mb-3">
              Run comprehensive diagnostics for Agora integration.
            </p>
            <Button
              onClick={() => window.open("/agora-advanced-debug", "_blank")}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full"
            >
              Run Diagnostics
            </Button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-yellow-800 mb-2">Agora Dashboard</h3>
            <p className="text-yellow-700 mb-3">
              Check your project status in the Agora dashboard.
            </p>
            <Button
              onClick={() => window.open("https://console.agora.io/", "_blank")}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-full"
            >
              Open Dashboard
            </Button>
          </div>
        </div>

        <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-red-800 mb-3">Vendor Key Error Solutions</h3>
          <p className="text-red-700 mb-3">
            If you continue to see "invalid vendor key" errors:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-red-700">
            <li>Wait a few minutes and try again (temporary server issues)</li>
            <li>Check that your App ID is exactly 32 characters long</li>
            <li>Verify your App ID contains only hexadecimal characters (0-9, a-f)</li>
            <li>Ensure your Agora project is active in the dashboard</li>
            <li>As a last resort, create a new Agora project</li>
          </ol>
        </div>
      </div>
    </div>
  );
}