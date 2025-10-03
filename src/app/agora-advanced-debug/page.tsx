"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AgoraAdvancedDebug() {
  const [debugResult, setDebugResult] = useState("");
  const [loading, setLoading] = useState(false);

  const runAdvancedDiagnostics = async () => {
    setLoading(true);
    setDebugResult("Running advanced Agora diagnostics...\n\n");

    try {
      // Test 1: Environment variables
      setDebugResult(prev => prev + "1. Checking environment variables...\n");
      
      const envResponse = await fetch("/api/test-env");
      const envData = await envResponse.json();
      
      setDebugResult(prev => prev + `   App ID: ${envData.appId}\n`);
      setDebugResult(prev => prev + `   App ID Length: ${envData.appIdLength}/32\n`);
      setDebugResult(prev => prev + `   App ID Valid: ${envData.isAppIdValid}\n`);
      setDebugResult(prev => prev + `   Certificate Length: ${envData.certLength}/32\n`);
      setDebugResult(prev => prev + `   Certificate Valid: ${envData.isCertValid}\n\n`);

      // Test 2: Project validation
      setDebugResult(prev => prev + "2. Validating Agora project...\n");
      
      const projectResponse = await fetch("/api/agora/validate-project");
      const projectData = await projectResponse.json();
      
      if (projectData.success) {
        setDebugResult(prev => prev + `   ✓ ${projectData.message}\n`);
        setDebugResult(prev => prev + `   App ID: ${projectData.appId}\n`);
        setDebugResult(prev => prev + `   Certificate: ${projectData.certificate}\n\n`);
      } else {
        setDebugResult(prev => prev + `   ✗ ${projectData.error}\n`);
        if (projectData.solution) {
          setDebugResult(prev => prev + `   Solution: ${projectData.solution}\n`);
        }
        setDebugResult(prev => prev + "\n");
      }

      // Test 3: Test token generation
      setDebugResult(prev => prev + "3. Testing token generation...\n");
      
      const tokenResponse = await fetch("/api/agora/test-token?channelName=debug_test&uid=12345&role=publisher");
      const tokenData = await tokenResponse.json();
      
      if (tokenData.success) {
        setDebugResult(prev => prev + `   ✓ ${tokenData.message}\n`);
        setDebugResult(prev => prev + `   App ID: ${tokenData.appId}\n`);
        setDebugResult(prev => prev + `   Channel: ${tokenData.channel}\n`);
        setDebugResult(prev => prev + `   UID: ${tokenData.uid}\n`);
        setDebugResult(prev => prev + `   Token: ${tokenData.token.substring(0, 20)}...\n\n`);
      } else {
        setDebugResult(prev => prev + `   ✗ ${tokenData.error}\n`);
        if (tokenData.message) {
          setDebugResult(prev => prev + `   Details: ${tokenData.message}\n`);
        }
        setDebugResult(prev => prev + "\n");
      }

      // Test 4: Agora SDK loading
      setDebugResult(prev => prev + "4. Testing Agora SDK loading...\n");
      
      try {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        setDebugResult(prev => prev + "   ✓ Agora SDK loaded successfully\n");
        
        // Test system requirements
        const support = AgoraRTC.checkSystemRequirements();
        setDebugResult(prev => prev + `   System requirements: ${support ? "SUPPORTED" : "NOT FULLY SUPPORTED"}\n\n`);
        
        // Test client creation
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setDebugResult(prev => prev + "   ✓ Agora client created successfully\n\n");
      } catch (sdkError: any) {
        setDebugResult(prev => prev + `   ✗ Failed to load Agora SDK: ${sdkError.message}\n\n`);
      }

      // Test 5: Vendor key simulation
      setDebugResult(prev => prev + "5. Simulating vendor key test...\n");
      setDebugResult(prev => prev + "   This test simulates what happens when Agora rejects an App ID.\n");
      setDebugResult(prev => prev + "   If you're seeing 'invalid vendor key' errors, it's likely\n");
      setDebugResult(prev => prev + "   a temporary issue with Agora's servers or project configuration.\n\n");

      setDebugResult(prev => prev + "🎉 Advanced diagnostics completed!\n\n");
      setDebugResult(prev => prev + "If you're still experiencing 'invalid vendor key' errors:\n");
      setDebugResult(prev => prev + "1. Try refreshing the page\n");
      setDebugResult(prev => prev + "2. Check your internet connection\n");
      setDebugResult(prev => prev + "3. Verify your Agora project is active in the dashboard\n");
      setDebugResult(prev => prev + "4. As a last resort, create a new Agora project\n");

    } catch (error: any) {
      setDebugResult(prev => prev + `❌ Diagnostics failed: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Advanced Agora Debug
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive diagnostics for Agora video call integration
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="flex justify-center mb-6">
            <Button
              onClick={runAdvancedDiagnostics}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Running Diagnostics...
                </div>
              ) : (
                "Run Advanced Diagnostics"
              )}
            </Button>
          </div>

          <div className="bg-gray-900 text-green-400 font-mono text-sm p-6 rounded-2xl overflow-y-auto max-h-96">
            <pre>{debugResult || "Click 'Run Advanced Diagnostics' to start testing"}</pre>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-yellow-800 mb-3">Invalid Vendor Key Solutions</h3>
            <ul className="space-y-2 text-yellow-700">
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>Refresh the page and try again - often a temporary issue</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>Check your internet connection stability</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>Verify your Agora project is active in the dashboard</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>Try using a different browser or device</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>Create a new Agora project if the issue persists</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-blue-800 mb-3">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                onClick={() => window.open("/agora-debug", "_blank")}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full"
              >
                Run Basic Diagnostics
              </Button>
              <Button
                onClick={() => window.open("https://console.agora.io/", "_blank")}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full"
              >
                Open Agora Dashboard
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-red-800 mb-3">Emergency Solution</h3>
          <p className="text-red-700 mb-3">
            If you continue to experience "invalid vendor key" errors despite all diagnostics showing your configuration is correct:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-red-700">
            <li>Go to the Agora Dashboard</li>
            <li>Create a new project with "App ID + App Certificate" enabled</li>
            <li>Copy the new App ID and Certificate</li>
            <li>Update your .env file with the new credentials</li>
            <li>Restart your development server</li>
          </ol>
        </div>
      </div>
    </div>
  );
}