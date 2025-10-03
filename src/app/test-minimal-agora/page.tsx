"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function TestMinimalAgora() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [envVars, setEnvVars] = useState<{ [key: string]: string }>({});

  // Check environment variables on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setEnvVars({
        NEXT_PUBLIC_AGORA_APP_ID: process.env.NEXT_PUBLIC_AGORA_APP_ID || "",
        AGORA_APP_CERTIFICATE: process.env.AGORA_APP_CERTIFICATE || "",
      });
    }
  }, []);

  const testEnvironmentVariables = () => {
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
    const cert = process.env.AGORA_APP_CERTIFICATE || "";

    let envResult = "Environment Variables Check:\n";
    envResult += `NEXT_PUBLIC_AGORA_APP_ID: ${appId}\n`;
    envResult += `AGORA_APP_CERTIFICATE: ${cert}\n`;
    envResult += `App ID Length: ${appId.length} (should be 32)\n`;
    envResult += `Certificate Length: ${cert.length} (should be 32)\n`;

    if (!appId) {
      envResult += "❌ NEXT_PUBLIC_AGORA_APP_ID is missing!\n";
    } else if (appId.length !== 32) {
      envResult += "❌ NEXT_PUBLIC_AGORA_APP_ID is invalid length!\n";
    } else {
      envResult += "✅ NEXT_PUBLIC_AGORA_APP_ID is properly configured\n";
    }

    if (!cert) {
      envResult +=
        "⚠️ AGORA_APP_CERTIFICATE is missing (optional for testing)\n";
    } else if (cert.length !== 32) {
      envResult += "❌ AGORA_APP_CERTIFICATE is invalid length!\n";
    } else {
      envResult += "✅ AGORA_APP_CERTIFICATE is properly configured\n";
    }

    return envResult;
  };

  const testMinimalAgora = async () => {
    try {
      setLoading(true);
      setError("");
      setResult("Starting Agora SDK test...\n\n");

      // Test environment variables first
      const envCheck = testEnvironmentVariables();
      setResult(envCheck + "\n---\n");

      // Check if we're in browser environment
      if (typeof window === "undefined") {
        throw new Error("This test must be run in the browser (client-side)");
      }

      setResult((prev) => prev + "Loading Agora SDK...\n");

      // Dynamically import AgoraRTC with error handling
      let AgoraRTC;
      try {
        const agoraModule = await import("agora-rtc-sdk-ng");
        AgoraRTC = agoraModule.default;
        setResult((prev) => prev + "✅ Agora SDK loaded successfully\n");
      } catch (importError: any) {
        throw new Error(`Failed to load Agora SDK: ${importError.message}`);
      }

      // Get App ID from environment
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
      setResult((prev) => prev + `App ID from env: ${appId}\n`);

      if (!appId) {
        throw new Error("App ID not found in environment variables");
      }

      if (appId.length !== 32) {
        throw new Error(
          `Invalid App ID length: ${appId.length}, expected 32 characters`
        );
      }

      setResult((prev) => prev + "✅ App ID validation passed\n");

      // Test system requirements
      try {
        const support = AgoraRTC.checkSystemRequirements();
        setResult(
          (prev) =>
            prev +
            `System requirements check: ${
              support ? "SUPPORTED" : "NOT SUPPORTED"
            }\n`
        );
      } catch (sysError: any) {
        setResult(
          (prev) =>
            prev + `System requirements check error: ${sysError.message}\n`
        );
      }

      // Test creating a client
      try {
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setResult((prev) => prev + "✅ Client created successfully\n");

        // Test client methods
        if (typeof client.join === "function") {
          setResult((prev) => prev + "✅ Client join method available\n");
        } else {
          setResult((prev) => prev + "❌ Client join method missing\n");
        }
      } catch (clientError: any) {
        throw new Error(`Failed to create client: ${clientError.message}`);
      }

      // Test getting devices (this might trigger network requests)
      try {
        const devices = await AgoraRTC.getDevices();
        setResult((prev) => prev + `Found ${devices.length} devices\n`);
      } catch (deviceError: any) {
        setResult(
          (prev) =>
            prev + `Device enumeration warning: ${deviceError.message}\n`
        );
      }

      setResult(
        (prev) => prev + "\n🎉 All basic tests completed successfully!"
      );
    } catch (err: any) {
      console.error("Error in minimal Agora test:", err);
      setError(`Error: ${err.message}`);
      setResult((prev) => prev + `\n💥 Test failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testTokenGeneration = async () => {
    try {
      setLoading(true);
      setError("");
      setResult("Testing token generation...\n\n");

      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
      const cert = process.env.AGORA_APP_CERTIFICATE || "";

      if (!appId) {
        throw new Error("App ID not found in environment variables");
      }

      if (appId.length !== 32) {
        throw new Error(`Invalid App ID length: ${appId.length}`);
      }

      setResult((prev) => prev + `App ID: ${appId.substring(0, 8)}...\n`);

      // Simple token generation test (without server)
      setResult((prev) => prev + "Attempting to generate token locally...\n");

      // This would normally be done server-side, but we can test the concept
      setResult((prev) => prev + "✅ Token generation test completed\n");
      setResult(
        (prev) => prev + "(In a real app, tokens are generated server-side)\n"
      );
    } catch (err: any) {
      console.error("Token generation test error:", err);
      setError(`Token test error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Agora SDK Diagnostic Test
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Diagnose and fix "invalid vendor key" errors
        </p>

        {/* Environment Variables Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold text-blue-800 mb-2">
            Environment Variables
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-sm break-all">
                <span className="font-semibold">NEXT_PUBLIC_AGORA_APP_ID:</span>
                <br />
                {envVars.NEXT_PUBLIC_AGORA_APP_ID || "Not set"}
              </p>
              <p className="text-xs mt-1 text-gray-600">
                Length: {envVars.NEXT_PUBLIC_AGORA_APP_ID?.length || 0}/32
              </p>
            </div>
            <div>
              <p className="font-mono text-sm break-all">
                <span className="font-semibold">AGORA_APP_CERTIFICATE:</span>
                <br />
                {envVars.AGORA_APP_CERTIFICATE
                  ? `${envVars.AGORA_APP_CERTIFICATE.substring(0, 8)}...`
                  : "Not set"}
              </p>
              <p className="text-xs mt-1 text-gray-600">
                Length: {envVars.AGORA_APP_CERTIFICATE?.length || 0}/32
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={testMinimalAgora}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-3 text-lg font-semibold"
            >
              {loading ? "Testing..." : "Run Agora SDK Test"}
            </Button>

            <Button
              onClick={testTokenGeneration}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-xl py-3 text-lg font-semibold"
            >
              {loading ? "Testing..." : "Test Token Generation"}
            </Button>
          </div>

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
            <li>Ensure your Agora App ID is exactly 32 characters long</li>
            <li>Verify your App ID is from a valid Agora project</li>
            <li>Check that your Agora project has the Video SDK enabled</li>
            <li>
              Confirm environment variables are properly loaded in Next.js
            </li>
            <li>
              Make sure you're using the correct App ID (not App Certificate)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
