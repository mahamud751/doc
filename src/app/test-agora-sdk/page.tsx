"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function TestAgoraSDK() {
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

  const testAgoraClient = async () => {
    setLoading(true);
    setResult((prev) => prev + "\nTesting Agora client creation...\n");

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
          `App ID: ${appId ? `${appId.substring(0, 8)}...` : "NOT SET"}\n`
      );

      if (!appId) {
        setResult((prev) => prev + "❌ App ID is missing\n");
        return;
      }

      // Create client
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setResult((prev) => prev + "✅ Client created successfully\n");

      // Test system requirements
      const support = AgoraRTC.checkSystemRequirements();
      setResult(
        (prev) =>
          prev +
          `System requirements: ${support ? "SUPPORTED" : "NOT SUPPORTED"}\n\n`
      );
    } catch (error: any) {
      setResult(
        (prev) => prev + `❌ Client creation failed: ${error.message}\n`
      );
    } finally {
      setLoading(false);
    }
  };

  const testAgoraJoin = async () => {
    setLoading(true);
    setResult(
      (prev) => prev + "\nTesting Agora join with actual parameters...\n"
    );

    try {
      if (!AgoraRTC) {
        setResult((prev) => prev + "❌ AgoraRTC not loaded\n");
        return;
      }

      // Get App ID from environment
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
      if (!appId) {
        setResult((prev) => prev + "❌ App ID is missing\n");
        return;
      }

      // Create client
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setResult((prev) => prev + "✅ Client created\n");

      // Try to join with empty token (this should fail with a different error)
      const testChannel = `test_${Math.floor(Math.random() * 10000)}`;
      const testUid = Math.floor(Math.random() * 100000);

      setResult((prev) => prev + `Attempting to join channel:\n`);
      setResult((prev) => prev + `  App ID: ${appId.substring(0, 8)}...\n`);
      setResult((prev) => prev + `  Channel: ${testChannel}\n`);
      setResult((prev) => prev + `  UID: ${testUid}\n`);
      setResult((prev) => prev + `  Token: (empty)\n\n`);

      try {
        await client.join(appId, testChannel, "", testUid);
        setResult((prev) => prev + "❌ Unexpectedly joined successfully!\n");
      } catch (joinError: any) {
        setResult((prev) => prev + `Join result:\n`);
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
              prev + `This confirms the App ID is not recognized by Agora.\n\n`
          );

          setResult((prev) => prev + `Possible causes:\n`);
          setResult(
            (prev) => prev + `1. App ID is from a deleted/suspended project\n`
          );
          setResult(
            (prev) => prev + `2. App ID is from a different Agora account\n`
          );
          setResult(
            (prev) => prev + `3. App ID is incorrect despite appearing valid\n`
          );
          setResult((prev) => prev + `4. Agora project configuration issue\n`);
        } else {
          setResult(
            (prev) =>
              prev + `\nThis is a different error (not 'invalid vendor key')\n`
          );
        }
      }
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
          Agora SDK Test
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Test Agora SDK directly with your App ID
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Button
            onClick={testAgoraClient}
            disabled={loading || !AgoraRTC}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl py-4 text-lg font-semibold"
          >
            {loading ? "Testing Client..." : "Test Client Creation"}
          </Button>

          <Button
            onClick={testAgoraJoin}
            disabled={loading || !AgoraRTC}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl py-4 text-lg font-semibold"
          >
            {loading ? "Testing Join..." : "Test Channel Join"}
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
