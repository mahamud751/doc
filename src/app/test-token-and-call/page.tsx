"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function TestTokenAndCall() {
  const [channelName, setChannelName] = useState("test_channel");
  const [uid, setUid] = useState("123456");
  const [role, setRole] = useState<"doctor" | "patient">("doctor");
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState("");

  const generateToken = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/test-agora-token-no-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelName,
          uid: parseInt(uid),
          role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate token");
      }

      const data = await response.json();
      setTokenResult(data);
      setTestResult("Token generated successfully");
    } catch (err: any) {
      console.error("Error generating token:", err);
      setError(err.message || "Failed to generate token");
    } finally {
      setLoading(false);
    }
  };

  const testVideoCall = async () => {
    if (!tokenResult) {
      setError("Please generate a token first");
      return;
    }

    try {
      setTestResult("Testing video call initialization...");

      // Create URL for video call page
      const callUrl = `/${role}/video-call?channel=${tokenResult.channel}&token=${tokenResult.token}&uid=${tokenResult.uid}&appId=${tokenResult.appId}`;

      setTestResult(`Video call URL generated: ${callUrl}`);

      // Open in new tab
      window.open(callUrl, "_blank");

      setTestResult("Video call page opened in new tab");
    } catch (err: any) {
      console.error("Error testing video call:", err);
      setError(err.message || "Failed to test video call");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Test Token Generation and Video Call
        </h1>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel Name
              </label>
              <Input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Enter channel name"
                className="w-full rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID (UID)
              </label>
              <Input
                type="text"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="Enter user ID"
                className="w-full rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <div className="flex space-x-4">
              <Button
                variant={role === "doctor" ? "default" : "outline"}
                onClick={() => setRole("doctor")}
                className="flex-1 rounded-xl"
              >
                Doctor
              </Button>
              <Button
                variant={role === "patient" ? "default" : "outline"}
                onClick={() => setRole("patient")}
                className="flex-1 rounded-xl"
              >
                Patient
              </Button>
            </div>
          </div>

          <Button
            onClick={generateToken}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-3 text-lg font-semibold"
          >
            {loading ? "Generating Token..." : "Generate Agora Token"}
          </Button>

          {tokenResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-xl font-bold text-green-800 mb-4">
                Token Generated Successfully
              </h2>
              <div className="space-y-2">
                <p>
                  <strong>App ID:</strong> {tokenResult.appId}
                </p>
                <p>
                  <strong>Channel:</strong> {tokenResult.channel}
                </p>
                <p>
                  <strong>UID:</strong> {tokenResult.uid}
                </p>
                <p>
                  <strong>Token:</strong> {tokenResult.token.substring(0, 50)}
                  ...
                </p>
                <p>
                  <strong>Expires:</strong>{" "}
                  {new Date(tokenResult.expires * 1000).toLocaleString()}
                </p>
              </div>

              <Button
                onClick={testVideoCall}
                className="mt-4 w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-xl py-3 text-lg font-semibold"
              >
                Test Video Call
              </Button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {testResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">{testResult}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
