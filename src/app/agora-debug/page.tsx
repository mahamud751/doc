"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AgoraDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    // Collect debug information
    const envAppId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "NOT SET";
    const envCert = process.env.AGORA_APP_CERTIFICATE || "NOT SET";

    setDebugInfo({
      envAppId: {
        value: envAppId,
        length: envAppId.length,
        valid: envAppId.length === 32,
      },
      envCert: {
        value: envCert,
        length: envCert.length,
        valid: envCert.length === 32,
      },
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
    });
  }, []);

  const testTokenGeneration = async () => {
    setIsTesting(true);
    setTestResults(null);

    try {
      // Get auth token from localStorage or cookie
      const authToken = localStorage.getItem("authToken") || "";

      const response = await fetch("/api/agora/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          channelName: "test-channel",
          uid: 12345,
          role: "patient",
        }),
      });

      const data = await response.json();

      setTestResults({
        success: response.ok,
        data: response.ok ? data : null,
        error: response.ok ? null : data,
        status: response.status,
      });
    } catch (error: any) {
      setTestResults({
        success: false,
        error: error.message,
        data: null,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testAgoraConnection = async () => {
    setIsTesting(true);
    setTestResults(null);

    try {
      // Dynamically import AgoraRTC
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;

      // Create client
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      // Try to initialize with test parameters
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";

      setTestResults({
        success: true,
        data: {
          message: "AgoraRTC loaded successfully",
          appId: appId ? `${appId.substring(0, 8)}...` : "NOT SET",
          clientCreated: !!client,
        },
      });
    } catch (error: any) {
      setTestResults({
        success: false,
        error: error.message,
        data: null,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Agora Debug Tool</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Environment Configuration
          </h2>

          {debugInfo ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">App ID:</h3>
                <p className="text-sm font-mono break-all">
                  {debugInfo.envAppId.value}
                </p>
                <p
                  className={
                    debugInfo.envAppId.valid ? "text-green-400" : "text-red-400"
                  }
                >
                  Length: {debugInfo.envAppId.length} characters
                  {debugInfo.envAppId.valid ? " ✓" : " ✗ (should be 32)"}
                </p>
              </div>

              <div>
                <h3 className="font-medium">Certificate:</h3>
                <p className="text-sm font-mono break-all">
                  {debugInfo.envCert.value}
                </p>
                <p
                  className={
                    debugInfo.envCert.valid ? "text-green-400" : "text-red-400"
                  }
                >
                  Length: {debugInfo.envCert.length} characters
                  {debugInfo.envCert.valid ? " ✓" : " ✗ (should be 32)"}
                </p>
              </div>

              <div>
                <h3 className="font-medium">Browser Info:</h3>
                <p className="text-sm">User Agent: {debugInfo.userAgent}</p>
                <p className="text-sm">Platform: {debugInfo.platform}</p>
                <p className="text-sm">Language: {debugInfo.language}</p>
              </div>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Tests</h2>

          <div className="flex flex-wrap gap-4 mb-6">
            <Button
              onClick={testTokenGeneration}
              disabled={isTesting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isTesting ? "Testing..." : "Test Token Generation"}
            </Button>

            <Button
              onClick={testAgoraConnection}
              disabled={isTesting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isTesting ? "Testing..." : "Test Agora Connection"}
            </Button>
          </div>

          {testResults && (
            <div
              className={`p-4 rounded ${
                testResults.success ? "bg-green-900" : "bg-red-900"
              }`}
            >
              <h3 className="font-semibold mb-2">
                {testResults.success ? "Test Passed" : "Test Failed"}
              </h3>

              {testResults.data && (
                <pre className="text-sm bg-black p-3 rounded overflow-auto">
                  {JSON.stringify(testResults.data, null, 2)}
                </pre>
              )}

              {testResults.error && (
                <div>
                  <p className="mb-2">Error: {testResults.error}</p>
                  {testResults.status && <p>Status: {testResults.status}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting Guide</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg mb-2">
                Common Issues & Solutions
              </h3>

              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>"Invalid vendor key" error:</strong> Check that your
                  App ID is exactly 32 characters and contains only hexadecimal
                  characters (0-9, a-f)
                </li>
                <li>
                  <strong>"CAN_NOT_GET_GATEWAY_SERVER" error:</strong> This
                  usually indicates a mismatch between static and dynamic keys.
                  Make sure you're using the correct App ID and certificate.
                </li>
                <li>
                  <strong>Token generation fails:</strong> Verify that both
                  NEXT_PUBLIC_AGORA_APP_ID and AGORA_APP_CERTIFICATE are set
                  correctly in your .env file
                </li>
                <li>
                  <strong>Connection fails:</strong> Check your firewall
                  settings and ensure WebSocket connections are allowed
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-2">
                Required Environment Variables
              </h3>

              <div className="bg-gray-900 p-4 rounded font-mono text-sm">
                <p>NEXT_PUBLIC_AGORA_APP_ID=your_32_char_app_id</p>
                <p>AGORA_APP_CERTIFICATE=your_32_char_certificate</p>
              </div>

              <p className="mt-2 text-sm text-gray-300">
                Both values should be exactly 32 characters long and contain
                only hexadecimal characters.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
