"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function VerifyAgoraProject() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyProject = async () => {
    setLoading(true);
    setResult("Verifying Agora project configuration...\n\n");

    try {
      // Get App ID from environment
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
      const cert = process.env.AGORA_APP_CERTIFICATE || "";

      setResult(
        (prev) =>
          prev +
          `Your App ID: ${appId ? `${appId.substring(0, 8)}...` : "NOT SET"}\n`
      );
      setResult((prev) => prev + `App ID length: ${appId.length}/32\n\n`);

      if (!appId) {
        setResult(
          (prev) => prev + "❌ App ID is missing from environment variables\n"
        );
        return;
      }

      if (appId.length !== 32) {
        setResult((prev) => prev + "❌ App ID length is invalid\n");
        return;
      }

      // Check if App ID contains only valid characters
      const hexRegex = /^[0-9a-fA-F]+$/;
      if (!hexRegex.test(appId)) {
        setResult((prev) => prev + "❌ App ID contains invalid characters\n");
        return;
      }

      setResult((prev) => prev + "✅ App ID format is valid\n\n");

      // Test token generation
      setResult((prev) => prev + "Testing token generation...\n");

      try {
        const testChannel = `verify_${Math.floor(Math.random() * 10000)}`;
        const testUid = Math.floor(Math.random() * 100000);

        const response = await fetch(
          `/api/agora/test-token?channelName=${testChannel}&uid=${testUid}&role=publisher`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Token generation failed");
        }

        const data = await response.json();
        setResult((prev) => prev + "✅ Token generated successfully\n");
        setResult(
          (prev) => prev + `Token: ${data.token.substring(0, 20)}...\n\n`
        );
      } catch (error: any) {
        setResult(
          (prev) => prev + `❌ Token generation failed: ${error.message}\n\n`
        );
        return;
      }

      setResult((prev) => prev + "🎉 All tests passed!\n\n");
      setResult(
        (prev) =>
          prev +
          "If you're still getting 'invalid vendor key' errors, the issue is likely with your Agora project configuration.\n\n"
      );

      setResult((prev) => prev + "🔧 To fix this issue:\n");
      setResult((prev) => prev + "1. Go to https://console.agora.io/\n");
      setResult((prev) => prev + "2. Sign in to your Agora account\n");
      setResult(
        (prev) => prev + "3. Find your project with App ID: " + appId + "\n"
      );
      setResult((prev) => prev + "4. Check that:\n");
      setResult((prev) => prev + "   - Project status is 'Active'\n");
      setResult((prev) => prev + "   - Video SDK is enabled\n");
      setResult((prev) => prev + "   - App ID matches exactly\n");
      setResult(
        (prev) => prev + "   - Project is not suspended or deleted\n\n"
      );

      setResult(
        (prev) =>
          prev +
          "If you can't find your project or it's not active, create a new one:\n"
      );
      setResult((prev) => prev + "1. Click 'New Project'\n");
      setResult((prev) => prev + "2. Give it a name\n");
      setResult((prev) => prev + "3. Copy the new App ID\n");
      setResult(
        (prev) => prev + "4. Update your .env file with the new App ID\n"
      );
    } catch (error: any) {
      setResult((prev) => prev + `❌ Verification failed: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Verify Agora Project
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Check if your Agora project is properly configured
        </p>

        <div className="text-center mb-8">
          <Button
            onClick={verifyProject}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-4 px-8 text-lg font-semibold"
          >
            {loading ? "Verifying..." : "Verify Project"}
          </Button>
        </div>

        {result && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Verification Results
            </h2>
            <pre className="text-gray-700 whitespace-pre-wrap font-mono text-sm bg-white p-4 rounded border">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            About This Error
          </h3>
          <p className="text-yellow-700">
            The "invalid vendor key" error occurs when Agora's servers don't
            recognize your App ID. This can happen even if the App ID format is
            correct. Common causes:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-yellow-700">
            <li>Project is deleted or suspended</li>
            <li>App ID is from a different Agora account</li>
            <li>Video SDK is not enabled for your project</li>
            <li>Region mismatch in your Agora project</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
