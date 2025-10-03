"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function TestTokenGeneration() {
  const [testResult, setTestResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testTokenGeneration = async () => {
    setLoading(true);
    setTestResult("Testing token generation...\n\n");

    try {
      // Get auth token from localStorage
      const authToken = localStorage.getItem("authToken");
      
      if (!authToken) {
        setTestResult(prev => prev + "❌ No auth token found in localStorage\n");
        setTestResult(prev => prev + "   Please log in first\n");
        setLoading(false);
        return;
      }

      setTestResult(prev => prev + "✓ Auth token found\n");
      setTestResult(prev => prev + `  Token preview: ${authToken.substring(0, 20)}...\n\n`);

      // Test token generation endpoint
      setTestResult(prev => prev + "2. Testing token generation endpoint...\n");
      
      const response = await fetch("/api/agora/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          channelName: "test_channel_123",
          uid: 123456,
          role: "patient",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error || "Unknown error"}`);
      }

      const tokenData = await response.json();
      setTestResult(prev => prev + "✓ Token generated successfully\n");
      setTestResult(prev => prev + `  App ID: ${tokenData.appId}\n`);
      setTestResult(prev => prev + `  Channel: ${tokenData.channel}\n`);
      setTestResult(prev => prev + `  UID: ${tokenData.uid}\n`);
      setTestResult(prev => prev + `  Token preview: ${tokenData.token.substring(0, 20)}...\n`);
      setTestResult(prev => prev + `  Expires: ${new Date(tokenData.expires * 1000).toLocaleString()}\n\n`);

      // Test parameters that would be passed to video call page
      setTestResult(prev => prev + "3. Testing URL parameter generation...\n");
      const callUrl = `/test-video-call-receiver?channel=${tokenData.channel}&token=${encodeURIComponent(tokenData.token)}&uid=${tokenData.uid}&appId=${tokenData.appId}`;
      setTestResult(prev => prev + "✓ URL parameters generated\n");
      setTestResult(prev => prev + `  Test URL: ${callUrl}\n\n`);

      setTestResult(prev => prev + "🎉 All tests passed!\n");
      setTestResult(prev => prev + "The token generation is working correctly.\n");
      setTestResult(prev => prev + "If you're still having video call issues, the problem is likely in the video call page implementation.\n");

    } catch (error: any) {
      setTestResult(prev => prev + `❌ Test failed: ${error.message}\n`);
      
      if (error.message.includes("jwt")) {
        setTestResult(prev => prev + "   This suggests an issue with your authentication token.\n");
        setTestResult(prev => prev + "   Try logging out and logging back in.\n");
      } else if (error.message.includes("401")) {
        setTestResult(prev => prev + "   Unauthorized - check your authentication token.\n");
      } else if (error.message.includes("500")) {
        setTestResult(prev => prev + "   Server error - check server logs for details.\n");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Token Generation Test
          </h1>
          <p className="text-lg text-gray-600">
            Verify that the Agora token generation is working correctly
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="flex justify-center mb-6">
            <Button
              onClick={testTokenGeneration}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Testing...
                </div>
              ) : (
                "Test Token Generation"
              )}
            </Button>
          </div>

          <div className="bg-gray-900 text-green-400 font-mono text-sm p-6 rounded-2xl overflow-y-auto max-h-96">
            <pre>{testResult || "Click 'Test Token Generation' to start testing"}</pre>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-yellow-800 mb-3">Common Issues</h3>
            <ul className="space-y-2 text-yellow-700">
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>Expired authentication token - try logging out and back in</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>Invalid App ID or Certificate in environment variables</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>Network connectivity issues to the token generation endpoint</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-green-800 mb-3">Quick Fixes</h3>
            <ol className="list-decimal pl-5 space-y-2 text-green-700">
              <li>Refresh the page and try again</li>
              <li>Log out and log back in to refresh your auth token</li>
              <li>Check that your .env file has correct Agora credentials</li>
              <li>Restart your development server</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}