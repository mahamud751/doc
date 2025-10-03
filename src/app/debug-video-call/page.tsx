"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function DebugVideoCall() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testVideoCallParams = async () => {
    setLoading(true);
    setResult("Testing video call parameters...\n\n");

    try {
      // Test token generation
      setResult((prev) => prev + "1. Testing token generation...\n");

      const response = await fetch(
        "/api/agora/test-token?channelName=test-channel&uid=12345&role=publisher"
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Token generation failed");
      }

      const data = await response.json();
      setResult((prev) => prev + "✅ Token generated successfully\n");
      setResult((prev) => prev + `App ID: ${data.appId.substring(0, 8)}...\n`);
      setResult((prev) => prev + `Token: ${data.token.substring(0, 20)}...\n`);
      setResult((prev) => prev + `Channel: ${data.channel}\n`);
      setResult((prev) => prev + `UID: ${data.uid}\n\n`);

      // Validate App ID
      setResult((prev) => prev + "2. Validating App ID...\n");
      if (!data.appId) {
        setResult((prev) => prev + "❌ App ID is missing\n");
        return;
      }

      if (data.appId.length !== 32) {
        setResult(
          (prev) =>
            prev + `❌ App ID length is invalid: ${data.appId.length}/32\n`
        );
        return;
      }

      const hexRegex = /^[0-9a-fA-F]+$/;
      if (!hexRegex.test(data.appId)) {
        setResult((prev) => prev + "❌ App ID contains invalid characters\n");
        return;
      }

      setResult((prev) => prev + "✅ App ID validation passed\n\n");

      // Show the URL that would be generated
      setResult((prev) => prev + "3. Generated video call URL:\n");
      const callUrl = `/patient/video-call?channel=${data.channel}&token=${data.token}&uid=${data.uid}&appId=${data.appId}`;
      setResult((prev) => prev + `${callUrl}\n\n`);

      setResult(
        (prev) => prev + "✅ All tests passed! The video call should work.\n"
      );
      setResult(
        (prev) => prev + "If you're still getting errors, the issue might be:\n"
      );
      setResult(
        (prev) => prev + "1. Agora project configuration on Agora's servers\n"
      );
      setResult((prev) => prev + "2. Network connectivity issues\n");
      setResult(
        (prev) => prev + "3. Browser permissions for camera/microphone\n"
      );
    } catch (error: any) {
      setResult((prev) => prev + `❌ Test failed: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Debug Video Call Issue
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Diagnose why video calls are not working
        </p>

        <div className="text-center mb-8">
          <Button
            onClick={testVideoCallParams}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-4 px-8 text-lg font-semibold"
          >
            {loading ? "Testing..." : "Test Video Call"}
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
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            Troubleshooting Steps
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-yellow-700">
            <li>
              Check that your Agora project is active in the Agora dashboard
            </li>
            <li>Verify that Video SDK is enabled for your project</li>
            <li>Ensure your browser has camera and microphone permissions</li>
            <li>Check your network connection</li>
            <li>Try using a different browser or incognito mode</li>
            <li>If issues persist, create a new Agora project</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
