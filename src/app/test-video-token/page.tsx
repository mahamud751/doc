"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function TestVideoToken() {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateTestToken = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/agora/test-token?channelName=test-channel&uid=12345&role=publisher"
      );
      const data = await response.json();
      setTokenInfo(data);
    } catch (error: any) {
      console.error("Error generating token:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateToken = async () => {
    if (!tokenInfo) return;

    setLoading(true);
    try {
      // Try to validate the token by attempting to join a channel with it
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      try {
        await client.join(
          tokenInfo.appId,
          tokenInfo.channel,
          tokenInfo.token,
          tokenInfo.uid
        );

        // If we get here, the token is valid
        setValidationResult({
          success: true,
          message: "Token is valid and can be used to join the channel",
        });

        // Leave the channel
        await client.leave();
      } catch (error: any) {
        setValidationResult({
          success: false,
          message: `Token validation failed: ${error.message}`,
          error: error,
        });
      }
    } catch (error: any) {
      setValidationResult({
        success: false,
        message: `Failed to load Agora SDK: ${
          error.message || "Unknown error"
        }`,
        error: error,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Video Token Test</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Generate Test Token</h2>

          <Button
            onClick={generateTestToken}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 mb-4"
          >
            {loading ? "Generating..." : "Generate Test Token"}
          </Button>

          {tokenInfo && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Generated Token Info:</h3>
              <div className="bg-gray-900 p-4 rounded font-mono text-sm overflow-auto">
                <pre>{JSON.stringify(tokenInfo, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {tokenInfo && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Validate Token</h2>

            <Button
              onClick={validateToken}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 mb-4"
            >
              {loading ? "Validating..." : "Validate Token"}
            </Button>

            {validationResult && (
              <div
                className={`p-4 rounded ${
                  validationResult.success ? "bg-green-900" : "bg-red-900"
                }`}
              >
                <h3 className="font-semibold mb-2">
                  {validationResult.success
                    ? "Validation Passed"
                    : "Validation Failed"}
                </h3>
                <p>{validationResult.message}</p>

                {!validationResult.success && validationResult.error && (
                  <div className="mt-2">
                    <p className="font-medium">Error Details:</p>
                    <div className="bg-black p-3 rounded text-sm">
                      <pre>
                        {JSON.stringify(validationResult.error, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting Guide</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg mb-2">Common Token Issues</h3>

              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Expired Tokens:</strong> Tokens are valid for 1 hour.
                  Generate a new token if the current one has expired.
                </li>
                <li>
                  <strong>App ID Mismatch:</strong> Ensure the App ID used to
                  generate the token matches the one used in the client.
                </li>
                <li>
                  <strong>Channel Name Mismatch:</strong> The channel name must
                  match exactly between token generation and client usage.
                </li>
                <li>
                  <strong>UID Mismatch:</strong> The UID used to generate the
                  token must match the one used in the client.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
