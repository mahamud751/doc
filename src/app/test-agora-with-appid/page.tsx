"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function TestAgoraWithAppId() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const testAgoraWithAppId = async () => {
    try {
      setLoading(true);
      setError("");
      setResult("Starting Agora SDK test...\n");

      // Dynamically import AgoraRTC
      const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");

      setResult((prev) => prev + "✓ Agora SDK loaded successfully\n");

      // Test App ID from environment
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
      setResult((prev) => prev + `App ID: ${appId}\n`);

      if (!appId) {
        throw new Error("App ID not found in environment variables");
      }

      if (appId.length !== 32) {
        throw new Error(`Invalid App ID length: ${appId.length}, expected 32`);
      }

      setResult((prev) => prev + "✓ App ID validation passed\n");

      // Test creating a client
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setResult((prev) => prev + "✓ Client created successfully\n");

      // Test system requirements
      const support = AgoraRTC.checkSystemRequirements();
      setResult(
        (prev) =>
          prev +
          `System requirements: ${support ? "SUPPORTED" : "NOT SUPPORTED"}\n`
      );

      // Test getting devices (this might trigger network requests)
      try {
        const devices = await AgoraRTC.getDevices();
        setResult((prev) => prev + `Found ${devices.length} devices\n`);
      } catch (deviceError: any) {
        setResult(
          (prev) => prev + `Device enumeration: ${deviceError.message}\n`
        );
      }

      // Test client configuration
      setResult((prev) => prev + "Client created, proceeding with tests\n");

      setResult(
        (prev) => prev + "\n✓ All basic tests completed successfully!\n"
      );
      setResult(
        (prev) =>
          prev + "Note: This test doesn't actually connect to Agora servers,\n"
      );
      setResult(
        (prev) =>
          prev + "so it won't reproduce the 'invalid vendor key' error.\n"
      );
    } catch (err: any) {
      console.error("Error in Agora test:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Test Agora SDK with App ID
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <Button
            onClick={testAgoraWithAppId}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-3 text-lg font-semibold"
          >
            {loading ? "Testing..." : "Run Agora SDK Test"}
          </Button>

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-xl font-bold text-green-800 mb-4">
                Test Results
              </h2>
              <pre className="text-green-700 whitespace-pre-wrap font-mono text-sm">
                {result}
              </pre>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-xl font-bold text-blue-800 mb-4">Note</h2>
            <p className="text-blue-700">
              This test verifies that the Agora SDK can be loaded and basic
              operations can be performed. It does not attempt to connect to
              Agora servers, so it won't reproduce the "invalid vendor key"
              error. The actual error occurs during the join() operation when
              connecting to Agora's gateway servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
