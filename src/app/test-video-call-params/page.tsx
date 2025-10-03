"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function TestVideoCallParams() {
  const searchParams = useSearchParams();

  const channelName = searchParams.get("channel") || "";
  const token = searchParams.get("token") || "";
  const uid = searchParams.get("uid") || "";
  const appId = searchParams.get("appId") || "";

  const [testResult, setTestResult] = useState("");

  useEffect(() => {
    setTestResult("Testing video call parameters...\n\n");

    setTestResult((prev) => prev + "Received parameters:\n");
    setTestResult((prev) => prev + `Channel: ${channelName || "MISSING"}\n`);
    setTestResult(
      (prev) =>
        prev + `Token: ${token ? `${token.substring(0, 20)}...` : "MISSING"}\n`
    );
    setTestResult((prev) => prev + `UID: ${uid || "MISSING"}\n`);
    setTestResult(
      (prev) =>
        prev + `App ID: ${appId ? `${appId.substring(0, 8)}...` : "MISSING"}\n`
    );
    setTestResult((prev) => prev + `App ID length: ${appId.length}/32\n\n`);

    // Validate parameters
    if (!channelName) {
      setTestResult((prev) => prev + "❌ Channel name is missing\n");
    } else {
      setTestResult((prev) => prev + "✅ Channel name is present\n");
    }

    if (!token) {
      setTestResult(
        (prev) => prev + "⚠️ Token is missing (expected in test)\n"
      );
    } else {
      setTestResult((prev) => prev + "✅ Token is present\n");
    }

    if (!uid) {
      setTestResult((prev) => prev + "❌ UID is missing\n");
    } else {
      setTestResult((prev) => prev + "✅ UID is present\n");
    }

    if (!appId) {
      setTestResult((prev) => prev + "❌ App ID is missing\n");
    } else {
      setTestResult((prev) => prev + "✅ App ID is present\n");

      // Validate App ID format
      if (appId.length !== 32) {
        setTestResult(
          (prev) => prev + `❌ App ID length is invalid: ${appId.length}/32\n`
        );
      } else {
        setTestResult((prev) => prev + "✅ App ID length is correct\n");

        // Check if App ID contains only valid characters
        const hexRegex = /^[0-9a-fA-F]+$/;
        if (!hexRegex.test(appId)) {
          setTestResult(
            (prev) => prev + "❌ App ID contains invalid characters\n"
          );
        } else {
          setTestResult(
            (prev) => prev + "✅ App ID format is valid (hexadecimal)\n"
          );
        }
      }
    }

    setTestResult((prev) => prev + "\n🎉 Parameter validation completed!\n");
  }, [channelName, token, uid, appId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Test Video Call Parameters
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Verify that video call parameters are correctly passed and validated
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Parameter Validation Results
          </h2>
          <pre className="text-gray-700 whitespace-pre-wrap font-mono text-sm bg-white p-4 rounded border">
            {testResult}
          </pre>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-green-800 mb-2">
            Implementation Notes
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-green-700">
            <li>
              This page correctly receives all parameters via URL search params
            </li>
            <li>
              App ID is properly passed from the token generation endpoint
            </li>
            <li>App ID format is validated (32 hexadecimal characters)</li>
            <li>
              This approach avoids issues with process.env in client components
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
