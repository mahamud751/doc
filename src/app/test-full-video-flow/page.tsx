"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function TestFullVideoFlow() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [AgoraRTC, setAgoraRTC] = useState<any>(null);
  const [client, setClient] = useState<any>(null);

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

  const testFullVideoFlow = async () => {
    try {
      setLoading(true);
      setError("");
      setResult("Starting full video call flow test...\n\n");
      setStep(1);

      // Step 1: Verify environment variables
      setResult(
        (prev) => prev + "Step 1: Verifying environment variables...\n"
      );
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";

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

      setResult((prev) => prev + `✅ App ID: ${appId.substring(0, 8)}...\n`);
      setResult((prev) => prev + `✅ App ID length: ${appId.length}/32\n\n`);
      setStep(2);

      // Step 2: Generate token (simulate API call)
      setResult((prev) => prev + "Step 2: Generating token...\n");
      const channelName = `test_channel_${Math.floor(Math.random() * 10000)}`;
      const uid = Math.floor(Math.random() * 1000000);

      const tokenResponse = await fetch(
        `/api/agora/test-token?channelName=${channelName}&uid=${uid}&role=publisher`
      );
      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(tokenData.error || "Failed to generate token");
      }

      setResult(
        (prev) => prev + `✅ Token generated for channel: ${channelName}\n`
      );
      setResult((prev) => prev + `✅ UID: ${uid}\n`);
      setResult(
        (prev) => prev + `✅ Token: ${tokenData.token.substring(0, 20)}...\n\n`
      );
      setStep(3);

      // Step 3: Verify token data contains correct App ID
      setResult((prev) => prev + "Step 3: Verifying token data...\n");

      if (!tokenData.appId) {
        throw new Error("Token response missing appId");
      }

      if (tokenData.appId !== appId) {
        throw new Error(
          "Token response App ID doesn't match environment App ID"
        );
      }

      setResult(
        (prev) =>
          prev +
          `✅ Token App ID matches environment: ${tokenData.appId.substring(
            0,
            8
          )}...\n\n`
      );
      setStep(4);

      // Step 4: Initialize Agora client
      setResult((prev) => prev + "Step 4: Initializing Agora client...\n");

      if (!AgoraRTC) {
        throw new Error("AgoraRTC not loaded");
      }

      const testClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setClient(testClient);
      setResult((prev) => prev + "✅ Agora client created\n\n");
      setStep(5);

      // Step 5: Attempt to join channel (this is where the error might occur)
      setResult((prev) => prev + "Step 5: Attempting to join channel...\n");
      setResult((prev) => prev + `Using parameters:\n`);
      setResult(
        (prev) => prev + `  App ID: ${tokenData.appId.substring(0, 8)}...\n`
      );
      setResult((prev) => prev + `  Channel: ${channelName}\n`);
      setResult(
        (prev) => prev + `  Token: ${tokenData.token.substring(0, 20)}...\n`
      );
      setResult((prev) => prev + `  UID: ${uid}\n\n`);

      try {
        // This is the critical step that might cause the "invalid vendor key" error
        await testClient.join(
          tokenData.appId,
          channelName,
          tokenData.token,
          uid
        );
        setResult(
          (prev) =>
            prev +
            "✅ Successfully joined channel (unexpected with test token)\n"
        );

        // If we successfully joined, leave the channel
        await testClient.leave();
        setResult((prev) => prev + "✅ Left channel\n");
      } catch (joinError: any) {
        setResult((prev) => prev + `Join attempt result:\n`);
        setResult((prev) => prev + `  Error name: ${joinError.name}\n`);
        setResult((prev) => prev + `  Error message: ${joinError.message}\n`);
        setResult((prev) => prev + `  Error code: ${joinError.code}\n`);

        // Check for the specific error we're investigating
        if (
          joinError.message &&
          joinError.message.includes("invalid vendor key")
        ) {
          setResult((prev) => prev + `\n🚨 REPRODUCED THE EXACT ERROR!\n`);
          setResult(
            (prev) =>
              prev + `This confirms the issue is with the App ID validation.\n`
          );
          setResult((prev) => prev + `Possible causes:\n`);
          setResult(
            (prev) => prev + `  1. App ID not recognized by Agora servers\n`
          );
          setResult((prev) => prev + `  2. App ID format is incorrect\n`);
          setResult(
            (prev) => prev + `  3. Agora project configuration issue\n`
          );
        } else {
          setResult(
            (prev) => prev + `\nThis is a different error. Continuing...\n`
          );
        }
      }

      setStep(6);
      setResult((prev) => prev + "\n🎉 Full flow test completed!\n");
    } catch (err: any) {
      console.error("Full video flow test error:", err);
      setError(`Test failed at step ${step}: ${err.message}`);
      setResult((prev) => prev + `\n❌ Test failed: ${err.message}\n`);
    } finally {
      setLoading(false);

      // Clean up client if it was created
      if (client) {
        try {
          await client.leave();
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
          Full Video Call Flow Test
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Test the complete flow from token generation to channel join
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <Button
            onClick={testFullVideoFlow}
            disabled={loading || !AgoraRTC}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-3 text-lg font-semibold"
          >
            {loading
              ? `Testing... (Step ${step}/6)`
              : "Run Full Video Flow Test"}
          </Button>

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
            What This Test Does
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-yellow-700">
            <li>Verifies your Agora App ID environment variable</li>
            <li>Generates a test token using your configured credentials</li>
            <li>Validates that the token contains the correct App ID</li>
            <li>Initializes the Agora client</li>
            <li>
              Attempts to join a channel (where "invalid vendor key" errors
              typically occur)
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
