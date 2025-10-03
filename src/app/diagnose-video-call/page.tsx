"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function DiagnoseVideoCall() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [AgoraRTC, setAgoraRTC] = useState<any>(null);

  // Load AgoraRTC dynamically
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("agora-rtc-sdk-ng")
        .then((module) => {
          setAgoraRTC(() => module.default);
        })
        .catch((err) => {
          setError(`Failed to load AgoraRTC: ${err.message}`);
        });
    }
  }, []);

  const diagnoseVideoCall = async () => {
    try {
      setLoading(true);
      setError("");
      setResult("Starting comprehensive video call diagnosis...\n\n");
      setStep(1);

      // Step 1: Check environment variables
      setResult((prev) => prev + "Step 1: Checking environment variables\n");
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";

      setResult(
        (prev) =>
          prev +
          `App ID from process.env: ${
            appId ? `${appId.substring(0, 8)}...` : "NOT SET"
          }\n`
      );
      setResult((prev) => prev + `App ID length: ${appId.length}/32\n\n`);

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

      setStep(2);

      // Step 2: Test token generation
      setResult((prev) => prev + "Step 2: Testing token generation\n");
      const channelName = `diagnose_${Math.floor(Math.random() * 10000)}`;
      const uid = Math.floor(Math.random() * 100000);

      const tokenResponse = await fetch(
        `/api/agora/test-token?channelName=${channelName}&uid=${uid}&role=publisher`
      );
      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(`Token generation failed: ${tokenData.error}`);
      }

      setResult((prev) => prev + `✅ Token generated successfully\n`);
      setResult(
        (prev) =>
          prev + `App ID in token: ${tokenData.appId.substring(0, 8)}...\n`
      );
      setResult(
        (prev) => prev + `Token: ${tokenData.token.substring(0, 20)}...\n\n`
      );
      setStep(3);

      // Step 3: Compare App IDs
      setResult((prev) => prev + "Step 3: Comparing App IDs\n");

      if (tokenData.appId !== appId) {
        setResult(
          (prev) => prev + `❌ MISMATCH: Environment App ID ≠ Token App ID\n`
        );
        setResult((prev) => prev + `Environment: ${appId}\n`);
        setResult((prev) => prev + `Token:      ${tokenData.appId}\n\n`);
      } else {
        setResult((prev) => prev + `✅ App IDs match\n\n`);
      }
      setStep(4);

      // Step 4: Test Agora client initialization
      setResult(
        (prev) => prev + "Step 4: Testing Agora client initialization\n"
      );

      if (!AgoraRTC) {
        throw new Error("AgoraRTC not loaded");
      }

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setResult((prev) => prev + `✅ Client created successfully\n\n`);
      setStep(5);

      // Step 5: Simulate video call flow with actual parameters
      setResult((prev) => prev + "Step 5: Simulating video call flow\n");

      // This is the critical test - using the exact same parameters that would be used in a real call
      const simulationParams = {
        appId: tokenData.appId,
        channelName: channelName,
        token: tokenData.token,
        uid: uid,
      };

      setResult((prev) => prev + `Simulation parameters:\n`);
      setResult(
        (prev) =>
          prev + `  App ID: ${simulationParams.appId.substring(0, 8)}...\n`
      );
      setResult(
        (prev) => prev + `  Channel: ${simulationParams.channelName}\n`
      );
      setResult(
        (prev) =>
          prev + `  Token: ${simulationParams.token.substring(0, 20)}...\n`
      );
      setResult((prev) => prev + `  UID: ${simulationParams.uid}\n\n`);

      // Try to join (this is where the error typically occurs)
      try {
        await client.join(
          simulationParams.appId,
          simulationParams.channelName,
          simulationParams.token,
          simulationParams.uid
        );

        setResult(
          (prev) =>
            prev +
            `✅ Successfully joined channel (unexpected with test token)\n`
        );
        await client.leave();
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
            (prev) =>
              prev + `\n🚨 DIAGNOSED: 'invalid vendor key' error reproduced!\n`
          );
          setResult(
            (prev) =>
              prev + `This confirms the issue is with App ID validation.\n\n`
          );

          // Provide specific fixes
          setResult((prev) => prev + `🔧 SPECIFIC FIXES:\n`);
          setResult(
            (prev) =>
              prev +
              `1. Verify App ID in Agora dashboard: ${simulationParams.appId}\n`
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
            (prev) => prev + `4. Confirm App ID has exactly 32 characters\n`
          );
        } else {
          setResult(
            (prev) =>
              prev + `\nThis is a different error. Continue investigation...\n`
          );
        }
      }

      setStep(6);
      setResult((prev) => prev + `\n🎉 Diagnosis complete!\n`);
    } catch (err: any) {
      console.error("Video call diagnosis error:", err);
      setError(`Diagnosis failed at step ${step}: ${err.message}`);
      setResult((prev) => prev + `\n❌ Diagnosis failed: ${err.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Video Call Diagnosis
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Comprehensive diagnosis of video call issues
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <Button
            onClick={diagnoseVideoCall}
            disabled={loading || !AgoraRTC}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-3 text-lg font-semibold"
          >
            {loading ? `Diagnosing... (Step ${step}/6)` : "Run Full Diagnosis"}
          </Button>

          {!AgoraRTC && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">Loading AgoraRTC SDK...</p>
            </div>
          )}

          {result && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Diagnosis Results
              </h2>
              <pre className="text-gray-700 whitespace-pre-wrap font-mono text-sm bg-white p-4 rounded border">
                {result}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            Diagnosis Steps
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-yellow-700">
            <li>Verify environment variables are correctly set</li>
            <li>Test token generation with your Agora credentials</li>
            <li>Compare App IDs from environment and token response</li>
            <li>Initialize Agora client to ensure SDK is working</li>
            <li>Simulate the exact video call flow that's causing issues</li>
            <li>Provide specific fixes based on the diagnosis results</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
