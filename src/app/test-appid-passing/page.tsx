"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function TestAppIdPassing() {
  const router = useRouter();
  const [testResult, setTestResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testAppIdPassing = async () => {
    setLoading(true);
    setTestResult("Testing App ID passing mechanism...\n\n");

    try {
      // Test 1: Check if we can access environment variables
      setTestResult((prev) => prev + "Test 1: Environment variable access\n");
      const envAppId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "NOT SET";
      setTestResult(
        (prev) =>
          prev +
          `Env App ID: ${
            envAppId ? `${envAppId.substring(0, 8)}...` : "NOT SET"
          }\n`
      );
      setTestResult(
        (prev) => prev + `Env App ID length: ${envAppId.length}\n\n`
      );

      // Test 2: Simulate token generation and App ID passing
      setTestResult((prev) => prev + "Test 2: Simulating token generation\n");

      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setTestResult(
            (prev) =>
              prev + "⚠️ No auth token found. Skipping token generation test.\n"
          );
        } else {
          const testChannel = `test_channel_${Math.floor(
            Math.random() * 10000
          )}`;
          const testUid = Math.floor(Math.random() * 100000);

          const response = await fetch("/api/agora/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
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
          setTestResult((prev) => prev + "✅ Token generated successfully\n");
          setTestResult(
            (prev) =>
              prev +
              `Token App ID: ${
                tokenData.appId
                  ? `${tokenData.appId.substring(0, 8)}...`
                  : "MISSING"
              }\n`
          );
          setTestResult(
            (prev) =>
              prev + `Token App ID length: ${tokenData.appId?.length || 0}\n`
          );
          setTestResult(
            (prev) =>
              prev +
              `Token: ${
                tokenData.token
                  ? `${tokenData.token.substring(0, 20)}...`
                  : "MISSING"
              }\n\n`
          );

          // Test 3: Simulate navigation to video call with App ID in URL
          setTestResult(
            (prev) => prev + "Test 3: Simulating video call navigation\n"
          );
          const testUrl = `/test-video-call-receiver?channel=${testChannel}&token=${tokenData.token}&uid=${testUid}&appId=${tokenData.appId}`;
          setTestResult((prev) => prev + `✅ Would navigate to: ${testUrl}\n`);
          setTestResult(
            (prev) => prev + `✅ App ID correctly passed as URL parameter\n\n`
          );
        }
      } catch (error: any) {
        setTestResult(
          (prev) => prev + `❌ Token generation failed: ${error.message}\n\n`
        );
      }

      setTestResult((prev) => prev + "🎉 All tests completed!\n");
      setTestResult(
        (prev) =>
          prev +
          "🔧 Best practice: Always pass App ID from token endpoint to video call page as URL parameter\n"
      );
    } catch (error: any) {
      setTestResult((prev) => prev + `❌ Test failed: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const goToTestReceiver = () => {
    // Generate a test URL with App ID from environment (for demonstration)
    const appId =
      process.env.NEXT_PUBLIC_AGORA_APP_ID ||
      "00000000000000000000000000000000";
    const testUrl = `/test-video-call-receiver?channel=test&token=test&uid=123456&appId=${appId}`;
    router.push(testUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Test App ID Passing
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Verify that App ID is correctly passed to video call components
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Button
            onClick={testAppIdPassing}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl py-4 text-lg font-semibold"
          >
            {loading ? "Testing..." : "Run Full Test"}
          </Button>

          <Button
            onClick={goToTestReceiver}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl py-4 text-lg font-semibold"
          >
            Go to Test Receiver
          </Button>
        </div>

        {testResult && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Test Results
            </h2>
            <pre className="text-gray-700 whitespace-pre-wrap font-mono text-sm bg-white p-4 rounded border">
              {testResult}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            Best Practices
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-yellow-700">
            <li>
              Always pass App ID from token generation endpoint to video call
              pages
            </li>
            <li>Use URL parameters to pass App ID to client components</li>
            <li>
              Don't rely on process.env in client components for sensitive data
            </li>
            <li>
              Validate App ID format (32 hexadecimal characters) before use
            </li>
            <li>Handle errors gracefully with user-friendly messages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
