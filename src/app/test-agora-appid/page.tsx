"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function TestAgoraAppId() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testAppId = async () => {
    setLoading(true);
    setResult("Testing App ID configuration...\n\n");
    
    try {
      // Get App ID from environment
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
      const cert = process.env.AGORA_APP_CERTIFICATE || "";
      
      setResult(prev => prev + `App ID from env: ${appId ? `${appId.substring(0, 8)}...` : "NOT SET"}\n`);
      setResult(prev => prev + `App ID length: ${appId.length}/32\n`);
      setResult(prev => prev + `Certificate from env: ${cert ? `${cert.substring(0, 8)}...` : "NOT SET"}\n`);
      setResult(prev => prev + `Certificate length: ${cert.length}/32\n\n`);
      
      // Validate App ID
      if (!appId) {
        setResult(prev => prev + "❌ App ID is missing from environment variables\n");
        return;
      }
      
      if (appId.length !== 32) {
        setResult(prev => prev + `❌ App ID length is invalid: ${appId.length}/32\n`);
        return;
      }
      
      // Check if App ID contains only valid characters
      const hexRegex = /^[0-9a-fA-F]+$/;
      if (!hexRegex.test(appId)) {
        setResult(prev => prev + "❌ App ID contains invalid characters (should be hexadecimal)\n");
        return;
      }
      
      setResult(prev => prev + "✅ App ID format is valid\n\n");
      
      // Test token generation
      setResult(prev => prev + "Testing token generation...\n");
      
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setResult(prev => prev + "⚠️ No auth token found. Skipping token generation test.\n");
          return;
        }
        
        const testChannel = `test_channel_${Math.floor(Math.random() * 10000)}`;
        const testUid = Math.floor(Math.random() * 100000);
        
        const response = await fetch("/api/agora/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            channelName: testChannel,
            uid: testUid,
            role: "patient",
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Token generation failed");
        }
        
        const tokenData = await response.json();
        setResult(prev => prev + "✅ Token generated successfully\n");
        setResult(prev => prev + `Token App ID: ${tokenData.appId ? `${tokenData.appId.substring(0, 8)}...` : "MISSING"}\n`);
        setResult(prev => prev + `Token length: ${tokenData.appId?.length || 0}/32\n`);
        setResult(prev => prev + `Token: ${tokenData.token ? `${tokenData.token.substring(0, 20)}...` : "MISSING"}\n\n`);
        
        // Compare App IDs
        if (tokenData.appId !== appId) {
          setResult(prev => prev + "❌ MISMATCH: Environment App ID ≠ Token App ID\n");
          setResult(prev => prev + `Environment: ${appId}\n`);
          setResult(prev => prev + `Token:      ${tokenData.appId}\n`);
        } else {
          setResult(prev => prev + "✅ App IDs match\n");
        }
        
      } catch (error: any) {
        setResult(prev => prev + `❌ Token generation failed: ${error.message}\n`);
      }
      
    } catch (error: any) {
      setResult(prev => prev + `❌ Test failed: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Agora App ID Test
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Test App ID configuration and token generation
        </p>

        <div className="text-center mb-8">
          <Button
            onClick={testAppId}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-4 px-8 text-lg font-semibold"
          >
            {loading ? "Testing..." : "Test App ID"}
          </Button>
        </div>

        {result && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Test Results
            </h2>
            <pre className="text-gray-700 whitespace-pre-wrap font-mono text-sm bg-white p-4 rounded border">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">Troubleshooting</h3>
          <ul className="list-disc pl-5 space-y-2 text-yellow-700">
            <li>If App ID is missing, check your .env file</li>
            <li>If App ID length is wrong, ensure it's exactly 32 characters</li>
            <li>If App IDs don't match, there may be a configuration issue</li>
            <li>If token generation fails, check server logs for details</li>
          </ul>
        </div>
      </div>
    </div>
  );
}