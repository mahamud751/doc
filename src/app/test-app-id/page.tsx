"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function TestAppId() {
  const searchParams = useSearchParams();

  const channelName = searchParams.get("channel") || "";
  const token = searchParams.get("token") || "";
  const uid = searchParams.get("uid") || "";
  const appId = searchParams.get("appId") || "";

  const [testResult, setTestResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testAgoraConnection = async () => {
    setLoading(true);
    setTestResult("Testing Agora connection...\n");

    try {
      // Test 1: Validate App ID format
      setTestResult((prev) => prev + "1. Validating App ID format...\n");

      if (!appId) {
        throw new Error("App ID is missing");
      }

      if (appId.length !== 32) {
        throw new Error(`Invalid App ID length: ${appId.length}, expected 32`);
      }

      const hexRegex = /^[0-9a-fA-F]+$/;
      if (!hexRegex.test(appId)) {
        throw new Error("App ID contains invalid characters");
      }

      setTestResult((prev) => prev + "   ✓ App ID format is valid\n");

      // Test 2: Try to initialize Agora client (without joining)
      setTestResult(
        (prev) => prev + "2. Testing Agora client initialization...\n"
      );

      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setTestResult(
        (prev) => prev + "   ✓ Agora client created successfully\n"
      );

      // Test 3: Check system requirements
      setTestResult((prev) => prev + "3. Checking system requirements...\n");

      const support = AgoraRTC.checkSystemRequirements();
      setTestResult(
        (prev) =>
          prev +
          `   ${support ? "✓" : "⚠"} System requirements: ${
            support ? "SUPPORTED" : "NOT FULLY SUPPORTED"
          }\n`
      );

      setTestResult(
        (prev) => prev + "\n🎉 All tests completed successfully!\n"
      );
      setTestResult(
        (prev) =>
          prev + "If you're still experiencing video call issues, try:\n"
      );
      setTestResult((prev) => prev + "1. Refreshing the page\n");
      setTestResult((prev) => prev + "2. Checking your internet connection\n");
      setTestResult(
        (prev) => prev + "3. Ensuring your browser supports WebRTC\n"
      );
    } catch (error: any) {
      setTestResult((prev) => prev + `❌ Test failed: ${error.message}\n`);

      if (error.message.includes("vendor key")) {
        setTestResult(
          (prev) => prev + "\n🚨 Agora Vendor Key Error Detected!\n"
        );
        setTestResult(
          (prev) =>
            prev +
            "This usually means your App ID is not recognized by Agora servers.\n"
        );
        setTestResult((prev) => prev + "Possible causes:\n");
        setTestResult(
          (prev) => prev + "- The Agora project has been deactivated\n"
        );
        setTestResult(
          (prev) => prev + "- The App ID belongs to a different Agora account\n"
        );
        setTestResult((prev) => prev + "- The App ID has been revoked\n\n");
        setTestResult(
          (prev) =>
            prev +
            "Solution: Create a new Agora project and update your environment variables.\n"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Agora App ID Test
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Verify that the App ID is correctly passed to the video call page
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">
              Parameters Received
            </h2>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Channel Name</p>
                <p className="font-mono text-sm break-all bg-white p-2 rounded border">
                  {channelName || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">UID</p>
                <p className="font-mono text-sm break-all bg-white p-2 rounded border">
                  {uid || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">App ID</p>
                <p className="font-mono text-sm break-all bg-white p-2 rounded border">
                  {appId || "Not set"}
                </p>
                {appId && (
                  <p className="text-sm mt-1">
                    Length: {appId.length}/32 {appId.length === 32 ? "✓" : "✗"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-green-800 mb-2">
              Validation
            </h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 rounded-full mr-2 ${
                    channelName ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span>Channel Name: {channelName ? "Set" : "Missing"}</span>
              </div>
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 rounded-full mr-2 ${
                    token ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span>Token: {token ? "Set" : "Missing"}</span>
              </div>
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 rounded-full mr-2 ${
                    uid ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span>UID: {uid ? "Set" : "Missing"}</span>
              </div>
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 rounded-full mr-2 ${
                    appId && appId.length === 32 ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span>
                  App ID: {appId && appId.length === 32 ? "Valid" : "Invalid"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 text-green-400 font-mono text-sm p-4 rounded-lg mb-6 h-64 overflow-y-auto">
          <pre>
            {testResult || "Click 'Test Agora Connection' to run diagnostics"}
          </pre>
        </div>

        <div className="flex justify-center">
          <button
            onClick={testAgoraConnection}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Testing...
              </div>
            ) : (
              "Test Agora Connection"
            )}
          </button>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Debugging Tips
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-yellow-700">
            <li>
              Make sure you're using the correct App ID from your Agora
              dashboard
            </li>
            <li>Verify that your Agora project is active and not suspended</li>
            <li>Check that the App Certificate is correctly configured</li>
            <li>
              If issues persist, visit{" "}
              <a href="/agora-debug" className="text-blue-600 hover:underline">
                /agora-debug
              </a>{" "}
              for detailed diagnostics
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
