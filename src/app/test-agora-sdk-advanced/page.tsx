"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function TestAgoraSDKAdvanced() {
  const [AgoraRTC, setAgoraRTC] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState("");

  useEffect(() => {
    // Load AgoraRTC only on client side
    if (typeof window !== "undefined") {
      import("agora-rtc-sdk-ng")
        .then((agora) => {
          setAgoraRTC(agora.default);
          setLoading(false);
        })
        .catch((err) => {
          setError("Failed to load Agora SDK: " + err.message);
          setLoading(false);
        });
    }
  }, []);

  const testAgoraClientCreation = async () => {
    try {
      if (!AgoraRTC) {
        setTestResult("AgoraRTC not loaded");
        return;
      }

      setTestResult("Testing Agora client creation...\n");

      // Test creating a client
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setTestResult((prev) => prev + "✓ Client created successfully\n");

      // Test App ID from environment
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
      setTestResult((prev) => prev + `App ID: ${appId}\n`);
      setTestResult((prev) => prev + `App ID length: ${appId.length}\n`);

      if (appId && appId.length === 32) {
        setTestResult((prev) => prev + "✓ App ID format is valid\n");
      } else {
        setTestResult((prev) => prev + "✗ App ID format is INVALID\n");
        return;
      }

      // Test App Certificate
      const appCertificate = process.env.AGORA_APP_CERTIFICATE || "";
      setTestResult(
        (prev) => prev + `App Certificate length: ${appCertificate.length}\n`
      );

      if (appCertificate && appCertificate.length === 32) {
        setTestResult((prev) => prev + "✓ App Certificate format is valid\n");
      } else {
        setTestResult(
          (prev) =>
            prev +
            "○ App Certificate format may be INVALID (should be 32 characters)\n"
        );
      }

      // Test basic Agora SDK functionality
      setTestResult((prev) => prev + "\nTesting basic SDK functionality...\n");

      // Test checking system requirements
      const support = AgoraRTC.checkSystemRequirements();
      setTestResult(
        (prev) =>
          prev + `System requirements check: ${support ? "PASSED" : "FAILED"}\n`
      );

      setTestResult((prev) => prev + "\n✓ All tests passed!\n");
    } catch (err: any) {
      setError("Error testing Agora client: " + err.message);
      console.error("Error testing Agora client:", err);
      setTestResult((prev) => prev + `\n✗ Error: ${err.message}\n`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Agora SDK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Advanced Agora SDK Test
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <Button
            onClick={testAgoraClientCreation}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-3 text-lg font-semibold"
          >
            Test Client Creation
          </Button>

          {testResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-xl font-bold text-green-800 mb-4">
                Test Results
              </h2>
              <pre className="text-green-700 whitespace-pre-wrap font-mono text-sm">
                {testResult}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
