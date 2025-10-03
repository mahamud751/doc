"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function TestVideoCallReceiver() {
  const searchParams = useSearchParams();

  const [parameters, setParameters] = useState({
    channel: "",
    token: "",
    uid: "",
    appId: "",
  });

  const [validationResult, setValidationResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setParameters({
      channel: searchParams.get("channel") || "",
      token: searchParams.get("token") || "",
      uid: searchParams.get("uid") || "",
      appId: searchParams.get("appId") || "",
    });
  }, [searchParams]);

  const validateParameters = () => {
    setLoading(true);
    setValidationResult("Validating video call parameters...\n\n");

    try {
      // Validate channel
      setValidationResult((prev) => prev + "1. Validating channel...\n");
      if (!parameters.channel) {
        throw new Error("Channel name is missing");
      }
      setValidationResult(
        (prev) => prev + `   ✓ Channel: ${parameters.channel}\n`
      );

      // Validate App ID
      setValidationResult((prev) => prev + "2. Validating App ID...\n");
      if (!parameters.appId) {
        throw new Error("App ID is missing");
      }
      if (parameters.appId.length !== 32) {
        throw new Error(
          `Invalid App ID length: ${parameters.appId.length}, expected 32`
        );
      }
      const hexRegex = /^[0-9a-fA-F]+$/;
      if (!hexRegex.test(parameters.appId)) {
        throw new Error("App ID contains invalid characters");
      }
      setValidationResult(
        (prev) => prev + `   ✓ App ID: ${parameters.appId}\n`
      );

      // Validate UID
      setValidationResult((prev) => prev + "3. Validating UID...\n");
      if (!parameters.uid) {
        throw new Error("UID is missing");
      }
      const uidNumber = parseInt(parameters.uid, 10);
      if (isNaN(uidNumber)) {
        throw new Error("UID is not a valid number");
      }
      setValidationResult((prev) => prev + `   ✓ UID: ${uidNumber}\n`);

      // Validate token
      setValidationResult((prev) => prev + "4. Validating token...\n");
      if (!parameters.token) {
        setValidationResult(
          (prev) => prev + "   ⚠ Token is missing (may be optional)\n"
        );
      } else {
        setValidationResult(
          (prev) =>
            prev +
            `   ✓ Token provided (${parameters.token.length} characters)\n`
        );
      }

      setValidationResult((prev) => prev + "\n🎉 All parameters are valid!\n");
      setValidationResult(
        (prev) =>
          prev +
          "If you're still having video call issues, the problem is likely in the Agora client initialization.\n"
      );
    } catch (error: any) {
      setValidationResult(
        (prev) => prev + `❌ Validation failed: ${error.message}\n`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Video Call Parameter Receiver
          </h1>
          <p className="text-lg text-gray-600">
            Test receiving and validating video call parameters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Received Parameters
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel
                </label>
                <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm break-all">
                  {parameters.channel || "Not set"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  App ID
                </label>
                <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm break-all">
                  {parameters.appId || "Not set"}
                </div>
                {parameters.appId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Length: {parameters.appId.length}/32{" "}
                    {parameters.appId.length === 32 ? "✓" : "✗"}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UID
                </label>
                <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm">
                  {parameters.uid || "Not set"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token
                </label>
                <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm break-all">
                  {parameters.token
                    ? `${parameters.token.substring(0, 20)}...`
                    : "Not set"}
                </div>
                {parameters.token && (
                  <p className="text-xs text-gray-500 mt-1">
                    Length: {parameters.token.length} characters
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Validation Status
            </h2>
            <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg h-64 overflow-y-auto">
              <pre>
                {validationResult || "Click 'Validate Parameters' to check"}
              </pre>
            </div>
            <Button
              onClick={validateParameters}
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-full shadow-lg transform transition duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Validating...
                </div>
              ) : (
                "Validate Parameters"
              )}
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-blue-800 mb-3">
            Debugging Tips
          </h3>
          <ul className="space-y-2 text-blue-700">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>
                If parameters look correct but video calls still fail, the issue
                is likely in the Agora client initialization
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Check browser console for detailed error messages</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>
                Ensure you have granted camera and microphone permissions
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Try using a different browser or device</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
