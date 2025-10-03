"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function VerifyAgoraConfig() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const verifyAgoraConfiguration = async () => {
    try {
      setLoading(true);
      setError("");
      setResult("Starting Agora configuration verification...\n\n");

      // Get environment variables
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
      const cert = process.env.AGORA_APP_CERTIFICATE || "";

      setResult(`1. Environment Variables Check:\n`);
      setResult(
        (prev) =>
          prev +
          `   App ID: ${appId ? `${appId.substring(0, 8)}...` : "NOT SET"}\n`
      );
      setResult((prev) => prev + `   App ID Length: ${appId.length}/32\n`);
      setResult(
        (prev) =>
          prev +
          `   Certificate: ${cert ? `${cert.substring(0, 8)}...` : "NOT SET"}\n`
      );
      setResult(
        (prev) => prev + `   Certificate Length: ${cert.length}/32\n\n`
      );

      // Validate App ID format
      if (!appId) {
        throw new Error(
          "NEXT_PUBLIC_AGORA_APP_ID is not set in environment variables"
        );
      }

      if (appId.length !== 32) {
        throw new Error(
          `Invalid App ID length: ${appId.length}, expected 32 characters`
        );
      }

      // Check if App ID contains only valid characters (hexadecimal)
      const hexRegex = /^[0-9a-fA-F]+$/;
      if (!hexRegex.test(appId)) {
        setResult(
          (prev) =>
            prev + "⚠️ WARNING: App ID contains non-hexadecimal characters\n"
        );
        setResult(
          (prev) =>
            prev +
            "   Agora App IDs should only contain hexadecimal characters (0-9, a-f)\n\n"
        );
      } else {
        setResult(
          (prev) => prev + "✅ App ID format is valid (hexadecimal)\n\n"
        );
      }

      // Test token generation
      setResult((prev) => prev + "2. Testing token generation...\n");

      try {
        const channelName = `verify_test_${Math.floor(Math.random() * 10000)}`;
        const uid = Math.floor(Math.random() * 100000);

        const response = await fetch(
          `/api/agora/test-token?channelName=${channelName}&uid=${uid}&role=publisher`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Token generation failed");
        }

        setResult((prev) => prev + "   ✅ Token generated successfully\n");
        setResult(
          (prev) => prev + `   Token: ${data.token.substring(0, 20)}...\n\n`
        );
      } catch (tokenError: any) {
        setResult(
          (prev) =>
            prev + `   ❌ Token generation failed: ${tokenError.message}\n\n`
        );
        throw tokenError;
      }

      // Test Agora SDK loading
      setResult((prev) => prev + "3. Testing Agora SDK loading...\n");

      try {
        const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");
        setResult((prev) => prev + "   ✅ Agora SDK loaded successfully\n");

        // Test client creation
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setResult((prev) => prev + "   ✅ Client created successfully\n\n");
      } catch (sdkError: any) {
        setResult(
          (prev) =>
            prev +
            `   ❌ SDK loading/initialization failed: ${sdkError.message}\n\n`
        );
        throw sdkError;
      }

      setResult((prev) => prev + "🎉 All verification tests passed!\n");
      setResult(
        (prev) => prev + "Your Agora configuration appears to be correct.\n"
      );
      setResult(
        (prev) =>
          prev + "If you're still getting 'invalid vendor key' errors,\n"
      );
      setResult(
        (prev) =>
          prev + "the issue might be with how the parameters are passed\n"
      );
      setResult((prev) => prev + "to the video call components.\n");
    } catch (err: any) {
      console.error("Agora configuration verification error:", err);
      setError(`Verification failed: ${err.message}`);
      setResult((prev) => prev + `\n❌ Verification failed: ${err.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const checkAgoraDashboard = () => {
    setResult("Agora Dashboard Check:\n\n");
    setResult((prev) => prev + "To verify your Agora project settings:\n");
    setResult((prev) => prev + "1. Go to https://console.agora.io/\n");
    setResult((prev) => prev + "2. Sign in to your Agora account\n");
    setResult((prev) => prev + "3. Select your project\n");
    setResult((prev) => prev + "4. Check that:\n");
    setResult((prev) => prev + "   - Project status is 'Active'\n");
    setResult((prev) => prev + "   - Video SDK is enabled\n");
    setResult(
      (prev) =>
        prev +
        "   - App ID matches: " +
        (process.env.NEXT_PUBLIC_AGORA_APP_ID || "NOT SET") +
        "\n"
    );
    setResult(
      (prev) =>
        prev + "   - App Certificate is properly configured (if using)\n\n"
    );
    setResult((prev) => prev + "Common issues:\n");
    setResult((prev) => prev + "- Using App Certificate instead of App ID\n");
    setResult((prev) => prev + "- Using a deleted or suspended project\n");
    setResult((prev) => prev + "- Copying App ID from the wrong location\n");
    setResult((prev) => prev + "- Project region mismatch\n");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Agora Configuration Verification
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Verify your Agora setup and troubleshoot "invalid vendor key" errors
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={verifyAgoraConfiguration}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-3 text-lg font-semibold"
            >
              {loading ? "Verifying..." : "Verify Agora Configuration"}
            </Button>

            <Button
              onClick={checkAgoraDashboard}
              className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-xl py-3 text-lg font-semibold"
            >
              Check Agora Dashboard Guide
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
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            Troubleshooting Steps
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-yellow-700">
            <li>Verify your App ID is exactly 32 characters long</li>
            <li>
              Check that your App ID is from a valid, active Agora project
            </li>
            <li>
              Ensure you're using the correct App ID (not the App Certificate)
            </li>
            <li>
              Confirm the App ID in your environment matches the one in Agora
              dashboard
            </li>
            <li>Check that your Agora project has the Video SDK enabled</li>
            <li>
              Make sure tokens are generated with the same App ID used in client
              initialization
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
