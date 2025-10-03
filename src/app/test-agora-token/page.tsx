"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function TestAgoraToken() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const testTokenGeneration = async () => {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      // Generate a random channel name and UID for testing
      const channelName = `test-channel-${Math.floor(Math.random() * 10000)}`;
      const uid = Math.floor(Math.random() * 100000);

      const response = await fetch(
        `/api/agora/test-token?channelName=${channelName}&uid=${uid}&role=publisher`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate token");
      }

      setResult(data);
    } catch (err: any) {
      console.error("Token generation error:", err);
      setError(err.message || "Failed to generate token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Agora Token Generation Test
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Test token generation without authentication
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <Button
            onClick={testTokenGeneration}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-3 text-lg font-semibold"
          >
            {loading ? "Generating Token..." : "Generate Test Token"}
          </Button>

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-xl font-bold text-green-800 mb-4">
                Token Generation Result
              </h2>
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Success:</span>{" "}
                  {result.success ? "Yes" : "No"}
                </p>
                <p>
                  <span className="font-semibold">App ID:</span> {result.appId}
                </p>
                <p>
                  <span className="font-semibold">Channel:</span>{" "}
                  {result.channel}
                </p>
                <p>
                  <span className="font-semibold">UID:</span> {result.uid}
                </p>
                <p>
                  <span className="font-semibold">Token:</span>{" "}
                  <span className="font-mono text-sm break-all">
                    {result.token}
                  </span>
                </p>
                <p>
                  <span className="font-semibold">Expires:</span>{" "}
                  {new Date(result.expires * 1000).toLocaleString()}
                </p>
                {result.message && (
                  <p>
                    <span className="font-semibold">Message:</span>{" "}
                    {result.message}
                  </p>
                )}
              </div>
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
              If you get "invalid vendor key" errors, check your Agora project
              settings
            </li>
            <li>
              Ensure your App ID is from a valid Agora project with Video SDK
              enabled
            </li>
            <li>
              Verify that your App ID and Certificate are correctly copied from
              Agora dashboard
            </li>
            <li>Check that your Agora project is not suspended or disabled</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
