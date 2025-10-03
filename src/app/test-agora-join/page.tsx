"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function TestAgoraJoin() {
  const [AgoraRTC, setAgoraRTC] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  // Load AgoraRTC dynamically
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("agora-rtc-sdk-ng")
        .then((module) => {
          setAgoraRTC(() => module.default);
          setResult((prev) => prev + "✅ AgoraRTC module loaded\n");
        })
        .catch((err) => {
          setError(`Failed to load AgoraRTC: ${err.message}`);
        });
    }
  }, []);

  const testAgoraJoin = async () => {
    try {
      setLoading(true);
      setError("");
      setResult("Starting Agora join test...\n\n");

      if (!AgoraRTC) {
        throw new Error("AgoraRTC not loaded yet. Please wait and try again.");
      }

      // Get environment variables
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
      setResult(`App ID from environment: ${appId.substring(0, 8)}...\n`);

      if (!appId) {
        throw new Error(
          "NEXT_PUBLIC_AGORA_APP_ID not found in environment variables"
        );
      }

      if (appId.length !== 32) {
        throw new Error(
          `Invalid App ID length: ${appId.length}, expected 32 characters`
        );
      }

      // Create a test client
      setResult((prev) => prev + "Creating Agora client...\n");
      const testClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setClient(testClient);
      setResult((prev) => prev + "✅ Client created successfully\n");

      // Try to join with invalid parameters to see the exact error
      setResult(
        (prev) => prev + "\nAttempting to join with test parameters...\n"
      );

      // Use a test channel name and generated UID
      const channelName = `test_channel_${Math.floor(Math.random() * 10000)}`;
      const uid = Math.floor(Math.random() * 1000000);

      // Generate a test token (this would normally come from your server)
      const token = ""; // Empty token for testing - this should cause a different error

      setResult((prev) => prev + `Channel: ${channelName}\n`);
      setResult((prev) => prev + `UID: ${uid}\n`);
      setResult((prev) => prev + `Token: ${token || "(empty)"}\n`);
      setResult((prev) => prev + `App ID: ${appId.substring(0, 8)}...\n`);

      try {
        // This should fail with a token error, not an App ID error
        await testClient.join(appId, channelName, token, uid);
        setResult(
          (prev) =>
            prev +
            "❌ Unexpectedly joined successfully (this shouldn't happen with empty token)\n"
        );
      } catch (joinError: any) {
        setResult((prev) => prev + `\nJoin attempt result:\n`);
        setResult((prev) => prev + `Error name: ${joinError.name}\n`);
        setResult((prev) => prev + `Error message: ${joinError.message}\n`);
        setResult((prev) => prev + `Error code: ${joinError.code}\n`);

        // Check if this is the specific "invalid vendor key" error we're looking for
        if (
          joinError.message &&
          joinError.message.includes("invalid vendor key")
        ) {
          setResult(
            (prev) =>
              prev + `\n🚨 This is the exact error we're investigating!\n`
          );
          setResult(
            (prev) =>
              prev +
              `It suggests the App ID is not recognized by Agora servers.\n`
          );
        } else {
          setResult(
            (prev) =>
              prev +
              `\nThis is a different error than the one we're investigating.\n`
          );
        }
      }

      setResult((prev) => prev + "\nTest completed.");
    } catch (err: any) {
      console.error("Agora join test error:", err);
      setError(`Test failed: ${err.message}`);
      setResult((prev) => prev + `\n❌ Test failed: ${err.message}\n`);
    } finally {
      setLoading(false);

      // Clean up client if it was created
      if (client) {
        try {
          client.leave();
        } catch (e) {
          console.log("Error leaving client:", e);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Agora Join Test
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Test Agora client join functionality to diagnose "invalid vendor key"
          errors
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
              onClick={testAgoraJoin}
              disabled={loading || !AgoraRTC}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-3 text-lg font-semibold"
            >
              {loading ? "Testing..." : "Run Agora Join Test"}
            </Button>
          </div>

          {!AgoraRTC && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
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
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            About This Test
          </h3>
          <p className="text-yellow-700">
            This test attempts to join an Agora channel with your configured App
            ID to see if the "invalid vendor key" error occurs. If it does, it
            means Agora's servers don't recognize your App ID, which could be
            due to:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-yellow-700">
            <li>Incorrect App ID (not 32 characters or wrong value)</li>
            <li>App ID from a different Agora project</li>
            <li>Disabled or suspended Agora project</li>
            <li>App ID copied from the wrong place in Agora dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
