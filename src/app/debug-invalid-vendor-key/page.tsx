"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function DebugInvalidVendorKey() {
  const [AgoraRTC, setAgoraRTC] = useState<any>(null);
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

  const testInvalidVendorKey = async () => {
    try {
      setLoading(true);
      setError("");
      setResult("Starting 'invalid vendor key' error investigation...\n\n");

      if (!AgoraRTC) {
        throw new Error("AgoraRTC not loaded yet. Please wait and try again.");
      }

      // Get the actual App ID from environment
      const actualAppId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
      setResult(
        `Actual App ID from environment: ${actualAppId.substring(0, 8)}...\n`
      );
      setResult(`Actual App ID length: ${actualAppId.length}/32\n\n`);

      // Test 1: Try with the actual App ID (this might reproduce the error)
      setResult(
        (prev) => prev + "Test 1: Using actual App ID from environment\n"
      );

      try {
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

        // Try to join with empty token (should fail with token error, not vendor key error)
        const testChannel = `test_${Math.floor(Math.random() * 10000)}`;
        const testUid = Math.floor(Math.random() * 100000);

        await client.join(actualAppId, testChannel, "", testUid);
        setResult((prev) => prev + "❌ Unexpectedly joined successfully!\n");
      } catch (err: any) {
        setResult((prev) => prev + `Error: ${err.name} - ${err.message}\n`);

        if (err.message && err.message.includes("invalid vendor key")) {
          setResult(
            (prev) => prev + "🚨 REPRODUCED 'invalid vendor key' error!\n"
          );
          setResult(
            (prev) =>
              prev + "This confirms the App ID is not recognized by Agora.\n\n"
          );

          // Suggest solutions
          setResult((prev) => prev + "Possible solutions:\n");
          setResult(
            (prev) =>
              prev +
              "1. Verify App ID in Agora dashboard matches: " +
              actualAppId +
              "\n"
          );
          setResult(
            (prev) => prev + "2. Check if your Agora project is active\n"
          );
          setResult(
            (prev) =>
              prev + "3. Ensure you're using App ID, not App Certificate\n"
          );
          setResult(
            (prev) => prev + "4. Confirm App ID has exactly 32 characters\n"
          );
          return;
        } else {
          setResult(
            (prev) =>
              prev + "This is a different error (not 'invalid vendor key')\n\n"
          );
        }
      }

      // Test 2: Try with known invalid App ID to see the difference
      setResult((prev) => prev + "Test 2: Using known invalid App ID\n");

      try {
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        const invalidAppId = "00000000000000000000000000000000"; // 32 chars but invalid
        const testChannel = `test_${Math.floor(Math.random() * 10000)}`;
        const testUid = Math.floor(Math.random() * 100000);

        await client.join(invalidAppId, testChannel, "", testUid);
        setResult(
          (prev) => prev + "❌ Unexpectedly joined with invalid App ID!\n"
        );
      } catch (err: any) {
        setResult((prev) => prev + `Error: ${err.name} - ${err.message}\n`);

        if (err.message && err.message.includes("invalid vendor key")) {
          setResult(
            (prev) =>
              prev +
              "This is the 'invalid vendor key' error with invalid App ID.\n\n"
          );
        } else {
          setResult(
            (prev) => prev + "Different error with invalid App ID.\n\n"
          );
        }
      }

      // Test 3: Verify environment variable is accessible
      setResult(
        (prev) => prev + "Test 3: Verifying environment variable access\n"
      );
      setResult(
        (prev) =>
          prev +
          `process.env.NEXT_PUBLIC_AGORA_APP_ID: ${typeof process.env
            .NEXT_PUBLIC_AGORA_APP_ID}\n`
      );
      setResult((prev) => prev + `Value type: ${typeof actualAppId}\n`);
      setResult((prev) => prev + `Value length: ${actualAppId.length}\n`);
      setResult(
        (prev) => prev + `Is string: ${typeof actualAppId === "string"}\n\n`
      );

      setResult((prev) => prev + "Investigation completed.\n");
      setResult(
        (prev) =>
          prev + "If you didn't see the 'invalid vendor key' error above,\n"
      );
      setResult(
        (prev) =>
          prev +
          "the issue might be in how the App ID is passed to the video call components.\n"
      );
    } catch (err: any) {
      console.error("Invalid vendor key investigation error:", err);
      setError(`Investigation failed: ${err.message}`);
      setResult((prev) => prev + `\n❌ Investigation failed: ${err.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Debug "Invalid Vendor Key" Error
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Investigate and fix the Agora "invalid vendor key" error
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <Button
            onClick={testInvalidVendorKey}
            disabled={loading || !AgoraRTC}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-3 text-lg font-semibold"
          >
            {loading ? "Investigating..." : "Investigate Vendor Key Error"}
          </Button>

          {!AgoraRTC && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">Loading AgoraRTC SDK...</p>
            </div>
          )}

          {result && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Investigation Results
              </h2>
              <pre className="text-gray-700 whitespace-pre-wrap font-mono text-sm bg-white p-4 rounded border">
                {result}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            About This Error
          </h3>
          <p className="text-yellow-700">
            The "invalid vendor key" error typically occurs when Agora's servers
            don't recognize the App ID you're using. This can happen if:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-yellow-700">
            <li>The App ID is incorrect or mistyped</li>
            <li>You're using the App Certificate instead of the App ID</li>
            <li>Your Agora project is disabled or deleted</li>
            <li>The App ID is from a different Agora account</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
