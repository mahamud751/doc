"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function TestAgoraClient() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [AgoraRTC, setAgoraRTC] = useState<any>(null);

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

  const testAgoraClient = async () => {
    try {
      setLoading(true);
      setError("");
      setResult("Starting Agora client test...\n\n");
      setStep("Initializing...");

      if (!AgoraRTC) {
        throw new Error("AgoraRTC not loaded yet. Please wait and try again.");
      }

      // Test 1: Check system requirements
      setStep("Checking system requirements...");
      setResult((prev) => prev + "1. Checking system requirements...\n");

      try {
        const support = AgoraRTC.checkSystemRequirements();
        setResult(
          (prev) =>
            prev +
            `   System requirements: ${
              support ? "✅ SUPPORTED" : "❌ NOT SUPPORTED"
            }\n`
        );
      } catch (err: any) {
        setResult(
          (prev) =>
            prev + `   System requirements check failed: ❌ ${err.message}\n`
        );
      }

      // Test 2: Get App ID from environment
      setStep("Getting App ID...");
      setResult((prev) => prev + "\n2. Getting App ID from environment...\n");

      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
      setResult((prev) => prev + `   App ID: ${appId}\n`);

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

      setResult((prev) => prev + "   ✅ App ID validation passed\n");

      // Test 3: Create client
      setStep("Creating client...");
      setResult((prev) => prev + "\n3. Creating Agora client...\n");

      let client;
      try {
        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setResult((prev) => prev + "   ✅ Client created successfully\n");
      } catch (err: any) {
        throw new Error(`Failed to create client: ${err.message}`);
      }

      // Test 4: Check client methods
      setStep("Checking client methods...");
      setResult((prev) => prev + "\n4. Checking client methods...\n");

      const requiredMethods = ["join", "leave", "publish", "subscribe"];
      const missingMethods = requiredMethods.filter(
        (method) => typeof client[method] !== "function"
      );

      if (missingMethods.length > 0) {
        setResult(
          (prev) =>
            prev + `   ❌ Missing methods: ${missingMethods.join(", ")}\n`
        );
      } else {
        setResult(
          (prev) => prev + "   ✅ All required client methods present\n"
        );
      }

      // Test 5: Try to get devices (may trigger network requests)
      setStep("Getting devices...");
      setResult((prev) => prev + "\n5. Getting media devices...\n");

      try {
        const devices = await AgoraRTC.getDevices();
        setResult((prev) => prev + `   Found ${devices.length} devices\n`);

        const audioDevices = devices.filter(
          (d: any) => d.kind === "audioinput"
        ).length;
        const videoDevices = devices.filter(
          (d: any) => d.kind === "videoinput"
        ).length;

        setResult((prev) => prev + `   Audio input devices: ${audioDevices}\n`);
        setResult((prev) => prev + `   Video input devices: ${videoDevices}\n`);
      } catch (err: any) {
        setResult(
          (prev) => prev + `   Device enumeration warning: ${err.message}\n`
        );
      }

      setResult((prev) => prev + "\n🎉 All tests completed successfully!");
      setStep("Completed");
    } catch (err: any) {
      console.error("Agora client test error:", err);
      setError(`Test failed at step "${step}": ${err.message}`);
      setResult((prev) => prev + `\n💥 Test failed: ${err.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Agora Client Initialization Test
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Test Agora client creation and initialization
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
              onClick={testAgoraClient}
              disabled={loading || !AgoraRTC}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-3 text-lg font-semibold"
            >
              {loading ? `Testing... (${step})` : "Run Agora Client Test"}
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

        {/* Troubleshooting Guide */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            Troubleshooting Guide
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-yellow-700">
            <li>
              "Invalid vendor key" usually means the App ID is not recognized by
              Agora
            </li>
            <li>
              Ensure your App ID is exactly 32 characters and from a valid Agora
              project
            </li>
            <li>Check that your Agora project has the Video SDK enabled</li>
            <li>
              Verify that your App ID is not confused with the App Certificate
            </li>
            <li>
              Make sure you're using the correct region/project settings in
              Agora dashboard
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
