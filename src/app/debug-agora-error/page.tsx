"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function DebugAgoraError() {
  const [step, setStep] = useState(1);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const runFullDebug = async () => {
    setLoading(true);
    setResult("Starting full Agora error debug...\n\n");

    try {
      // Step 1: Check environment variables
      setStep(1);
      setResult((prev) => prev + "Step 1: Checking environment variables\n");
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
      const cert = process.env.AGORA_APP_CERTIFICATE || "";

      setResult(
        (prev) =>
          prev +
          `App ID: ${appId ? `${appId.substring(0, 8)}...` : "NOT SET"}\n`
      );
      setResult((prev) => prev + `App ID length: ${appId.length}/32\n`);
      setResult(
        (prev) =>
          prev +
          `Certificate: ${cert ? `${cert.substring(0, 8)}...` : "NOT SET"}\n`
      );
      setResult((prev) => prev + `Certificate length: ${cert.length}/32\n\n`);

      if (!appId) {
        throw new Error("App ID is missing from environment variables");
      }

      if (appId.length !== 32) {
        throw new Error(`App ID length is invalid: ${appId.length}/32`);
      }

      // Step 2: Validate App ID format
      setStep(2);
      setResult((prev) => prev + "Step 2: Validating App ID format\n");
      const hexRegex = /^[0-9a-fA-F]+$/;
      if (!hexRegex.test(appId)) {
        throw new Error(
          "App ID contains invalid characters (should be hexadecimal)"
        );
      }
      setResult((prev) => prev + "✅ App ID format is valid\n\n");

      // Step 3: Test token generation
      setStep(3);
      setResult((prev) => prev + "Step 3: Testing token generation\n");

      const token = localStorage.getItem("authToken");
      if (!token) {
        setResult(
          (prev) =>
            prev + "⚠️ No auth token found. Skipping token generation test.\n"
        );
      } else {
        try {
          const testChannel = `debug_channel_${Math.floor(
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
          setResult((prev) => prev + "✅ Token generated successfully\n");
          setResult(
            (prev) =>
              prev +
              `Token App ID: ${
                tokenData.appId
                  ? `${tokenData.appId.substring(0, 8)}...`
                  : "MISSING"
              }\n`
          );
          setResult(
            (prev) =>
              prev +
              `Token: ${
                tokenData.token
                  ? `${tokenData.token.substring(0, 20)}...`
                  : "MISSING"
              }\n\n`
          );

          // Compare App IDs
          if (tokenData.appId !== appId) {
            setResult(
              (prev) =>
                prev + "❌ MISMATCH: Environment App ID ≠ Token App ID\n"
            );
            setResult((prev) => prev + `Environment: ${appId}\n`);
            setResult((prev) => prev + `Token:      ${tokenData.appId}\n\n`);
          }
        } catch (error: any) {
          setResult(
            (prev) => prev + `❌ Token generation failed: ${error.message}\n\n`
          );
        }
      }

      // Step 4: Test Agora SDK directly
      setStep(4);
      setResult((prev) => prev + "Step 4: Testing Agora SDK directly\n");

      try {
        const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");
        setResult((prev) => prev + "✅ AgoraRTC module loaded\n");

        // Create client
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setResult((prev) => prev + "✅ Client created successfully\n");

        // Test system requirements
        const support = AgoraRTC.checkSystemRequirements();
        setResult(
          (prev) =>
            prev +
            `System requirements: ${
              support ? "SUPPORTED" : "NOT SUPPORTED"
            }\n\n`
        );

        // Try to join with empty token to see the exact error
        const testChannel = `debug_${Math.floor(Math.random() * 10000)}`;
        const testUid = Math.floor(Math.random() * 100000);

        setResult((prev) => prev + `Attempting to join channel with App ID:\n`);
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
                prev +
                `This confirms the App ID is not recognized by Agora.\n\n`
            );

            setResult((prev) => prev + `🔧 SOLUTIONS:\n`);
            setResult(
              (prev) => prev + `1. Verify App ID in Agora dashboard: ${appId}\n`
            );
            setResult(
              (prev) =>
                prev +
                `2. Check if project is active and Video SDK is enabled\n`
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
          } else {
            setResult(
              (prev) =>
                prev +
                `\nThis is a different error. Continue investigation...\n`
            );
          }
        }
      } catch (error: any) {
        setResult(
          (prev) => prev + `❌ Agora SDK test failed: ${error.message}\n\n`
        );
      }

      setStep(5);
      setResult((prev) => prev + "🎉 Debug completed!\n");
    } catch (error: any) {
      setResult(
        (prev) => prev + `❌ Debug failed at step ${step}: ${error.message}\n`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Agora Error Debug
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Debug the "invalid vendor key" error step by step
        </p>

        <div className="text-center mb-8">
          <Button
            onClick={runFullDebug}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-4 px-8 text-lg font-semibold"
          >
            {loading ? `Debugging... (Step ${step}/5)` : "Run Full Debug"}
          </Button>
        </div>

        {result && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Debug Results
            </h2>
            <pre className="text-gray-700 whitespace-pre-wrap font-mono text-sm bg-white p-4 rounded border">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            Understanding the Error
          </h3>
          <p className="text-yellow-700">
            The "invalid vendor key" error means Agora's servers don't recognize
            your App ID. This can happen even if the App ID format is correct.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-yellow-700">
            <li>Your App ID might be from a deleted or suspended project</li>
            <li>
              You might be using the App Certificate instead of the App ID
            </li>
            <li>Your Agora project might not have Video SDK enabled</li>
            <li>There might be a region mismatch in your Agora project</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
