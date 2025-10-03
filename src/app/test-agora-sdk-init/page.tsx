"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function TestAgoraSDKInit() {
  const [AgoraRTC, setAgoraRTC] = useState<any>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Load AgoraRTC dynamically
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("agora-rtc-sdk-ng")
        .then((module) => {
          setAgoraRTC(() => module.default);
          setResult((prev) => prev + "✅ AgoraRTC module loaded\n");
        })
        .catch((err) => {
          setResult(
            (prev) => prev + `❌ Failed to load AgoraRTC: ${err.message}\n`
          );
        });
    }
  }, []);

  const testSDKInit = async () => {
    setLoading(true);
    setResult((prev) => prev + "\nTesting Agora SDK initialization...\n");

    try {
      if (!AgoraRTC) {
        setResult((prev) => prev + "❌ AgoraRTC not loaded\n");
        return;
      }

      // Get App ID from environment
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
      setResult(
        (prev) =>
          prev +
          `\nApp ID from environment: ${
            appId ? `${appId.substring(0, 8)}...` : "NOT SET"
          }\n`
      );
      setResult((prev) => prev + `App ID length: ${appId.length}/32\n`);

      if (!appId) {
        setResult((prev) => prev + "❌ App ID is missing\n");
        return;
      }

      if (appId.length !== 32) {
        setResult((prev) => prev + "❌ App ID length is invalid\n");
        return;
      }

      // Validate App ID format
      const hexRegex = /^[0-9a-fA-F]+$/;
      if (!hexRegex.test(appId)) {
        setResult((prev) => prev + "❌ App ID contains invalid characters\n");
        return;
      }

      setResult((prev) => prev + "✅ App ID format validation passed\n\n");

      // Test 1: Create client
      setResult((prev) => prev + "Test 1: Creating Agora client\n");
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setResult((prev) => prev + "✅ Client created successfully\n\n");

      // Test 2: Check system requirements
      setResult((prev) => prev + "Test 2: Checking system requirements\n");
      const support = AgoraRTC.checkSystemRequirements();
      setResult(
        (prev) =>
          prev +
          `System requirements: ${support ? "SUPPORTED" : "NOT SUPPORTED"}\n\n`
      );

      // Test 3: Try to join with empty token (should fail with token error, not vendor key error)
      setResult(
        (prev) => prev + "Test 3: Attempting to join channel with empty token\n"
      );
      const testChannel = `test_${Math.floor(Math.random() * 10000)}`;
      const testUid = Math.floor(Math.random() * 100000);

      setResult((prev) => prev + `Channel: ${testChannel}\n`);
      setResult((prev) => prev + `UID: ${testUid}\n`);
      setResult((prev) => prev + `App ID: ${appId.substring(0, 8)}...\n\n`);

      try {
        // This should fail with a token error, not a vendor key error
        await client.join(appId, testChannel, "", testUid);
        setResult(
          (prev) =>
            prev +
            "❌ Unexpectedly joined successfully (this shouldn't happen with empty token)\n"
        );
      } catch (joinError: any) {
        setResult((prev) => prev + `Join attempt result:\n`);
        setResult((prev) => prev + `  Name: ${joinError.name}\n`);
        setResult((prev) => prev + `  Message: ${joinError.message}\n`);
        setResult((prev) => prev + `  Code: ${joinError.code}\n`);

        if (
          joinError.message &&
          joinError.message.includes("invalid vendor key")
        ) {
          setResult(
            (prev) => prev + `\n🚨 REPRODUCED 'invalid vendor key' error!\n`
          );
          setResult(
            (prev) =>
              prev +
              `This confirms the App ID is not recognized by Agora servers.\n\n`
          );

          setResult((prev) => prev + `🔧 SOLUTIONS:\n`);
          setResult(
            (prev) => prev + `1. Verify App ID in Agora dashboard: ${appId}\n`
          );
          setResult(
            (prev) =>
              prev + `2. Check if project is active and Video SDK is enabled\n`
          );
          setResult(
            (prev) =>
              prev + `3. Ensure you're using App ID, not App Certificate\n`
          );
          setResult(
            (prev) =>
              prev +
              `4. Create a new Agora project if current one is problematic\n`
          );
        } else if (joinError.message && joinError.message.includes("token")) {
          setResult(
            (prev) =>
              prev + `\n✅ This is a token error (expected with empty token)\n`
          );
          setResult(
            (prev) => prev + `The App ID is recognized by Agora servers.\n`
          );
        } else {
          setResult(
            (prev) =>
              prev + `\nThis is a different error. Continue investigation...\n`
          );
        }
      }

      setResult((prev) => prev + `\n🎉 SDK initialization test completed!\n`);
    } catch (error: any) {
      setResult((prev) => prev + `❌ SDK test failed: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Test Agora SDK Initialization
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Diagnose the "invalid vendor key" error at the SDK level
        </p>

        <div className="text-center mb-8">
          <Button
            onClick={testSDKInit}
            disabled={loading || !AgoraRTC}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-4 px-8 text-lg font-semibold"
          >
            {loading ? "Testing..." : "Test SDK Init"}
          </Button>
        </div>

        {!AgoraRTC && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">Loading AgoraRTC SDK...</p>
          </div>
        )}

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
            About This Test
          </h3>
          <p className="text-yellow-700">
            This test directly uses the Agora SDK with your configured App ID to
            determine if the "invalid vendor key" error is due to:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-yellow-700">
            <li>Incorrect App ID configuration</li>
            <li>Issues with your Agora project</li>
            <li>Problems with the App ID itself</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
