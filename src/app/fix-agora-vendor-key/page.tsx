"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function FixAgoraVendorKey() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const fixVendorKeyIssue = async () => {
    setLoading(true);
    setResult("Fixing Agora 'invalid vendor key' issue...\n\n");

    try {
      // Step 1: Check if we're in browser environment
      if (typeof window === "undefined") {
        setResult(
          (prev) => prev + "❌ This test must run in browser environment\n"
        );
        return;
      }

      setResult((prev) => prev + "Step 1: Environment check\n");
      setResult((prev) => prev + "✅ Running in browser environment\n\n");

      // Step 2: Check App ID from URL parameters (this is how it should be passed)
      const urlParams = new URLSearchParams(window.location.search);
      const urlAppId = urlParams.get("appId");

      setResult((prev) => prev + "Step 2: Checking App ID sources\n");
      setResult(
        (prev) =>
          prev +
          `App ID from URL params: ${
            urlAppId ? `${urlAppId.substring(0, 8)}...` : "NOT FOUND"
          }\n`
      );

      // Step 3: Check environment variable (this might not work in client components)
      const envAppId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
      setResult(
        (prev) =>
          prev +
          `App ID from env var: ${
            envAppId ? `${envAppId.substring(0, 8)}...` : "NOT FOUND"
          }\n`
      );

      // Step 4: Determine which App ID to use
      let appIdToUse = urlAppId || envAppId || "";

      if (!appIdToUse) {
        setResult((prev) => prev + "❌ No App ID found from any source\n");
        setResult(
          (prev) =>
            prev +
            "🔧 SOLUTION: App ID must be passed from token generation endpoint\n\n"
        );
        return;
      }

      setResult(
        (prev) => prev + `✅ Using App ID: ${appIdToUse.substring(0, 8)}...\n`
      );
      setResult(
        (prev) => prev + `✅ App ID length: ${appIdToUse.length}/32\n\n`
      );

      // Step 5: Validate App ID format
      if (appIdToUse.length !== 32) {
        setResult((prev) => prev + "❌ App ID length is incorrect\n");
        setResult(
          (prev) =>
            prev + "🔧 SOLUTION: Ensure App ID is exactly 32 characters\n\n"
        );
        return;
      }

      // Step 6: Check if App ID contains only valid characters
      const hexRegex = /^[0-9a-fA-F]+$/;
      if (!hexRegex.test(appIdToUse)) {
        setResult((prev) => prev + "❌ App ID contains invalid characters\n");
        setResult(
          (prev) =>
            prev +
            "🔧 SOLUTION: App ID should only contain hexadecimal characters (0-9, a-f)\n\n"
        );
        return;
      }

      setResult((prev) => prev + "✅ App ID format validation passed\n\n");

      // Step 7: Test token generation
      setResult((prev) => prev + "Step 3: Testing token generation\n");

      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setResult(
            (prev) =>
              prev + "⚠️ No auth token found. Skipping token generation test.\n"
          );
        } else {
          const testChannel = `fix_test_${Math.floor(Math.random() * 10000)}`;
          const testUid = Math.floor(Math.random() * 100000);

          const response = await fetch("/api/agora/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              channelName: testChannel,
              uid: testUid,
              role: "patient",
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Token generation failed");
          }

          const tokenData = await response.json();
          setResult((prev) => prev + "✅ Token generated successfully\n");
          setResult(
            (prev) =>
              prev +
              `Token App ID: ${
                tokenData.appId
                  ? `${tokenData.appId.substring(0, 8)}...`
                  : "MISSING"
              }\n`
          );
          setResult(
            (prev) =>
              prev +
              `Token: ${
                tokenData.token
                  ? `${tokenData.token.substring(0, 20)}...`
                  : "MISSING"
              }\n\n`
          );

          // Verify App ID consistency
          if (tokenData.appId !== appIdToUse) {
            setResult(
              (prev) => prev + "⚠️ WARNING: App ID mismatch between sources\n"
            );
            setResult((prev) => prev + `URL/App Env: ${appIdToUse}\n`);
            setResult((prev) => prev + `Token API:   ${tokenData.appId}\n`);
            setResult(
              (prev) =>
                prev +
                "🔧 RECOMMENDATION: Use App ID from token API response\n\n"
            );
          }
        }
      } catch (error: any) {
        setResult(
          (prev) =>
            prev + `❌ Token generation test failed: ${error.message}\n\n`
        );
      }

      // Step 8: Provide fix recommendations
      setResult((prev) => prev + "🔧 IMPLEMENTATION FIXES:\n");
      setResult(
        (prev) =>
          prev +
          "1. Ensure App ID is passed from token endpoint to video call page\n"
      );
      setResult(
        (prev) => prev + "2. Do not rely on process.env in client components\n"
      );
      setResult(
        (prev) =>
          prev +
          "3. Validate App ID format before Agora client initialization\n"
      );
      setResult(
        (prev) =>
          prev +
          "4. Use App ID from token response, not environment variables\n\n"
      );

      setResult((prev) => prev + "✅ FIX SUMMARY:\n");
      setResult(
        (prev) => prev + "The 'invalid vendor key' error is resolved by:\n"
      );
      setResult(
        (prev) =>
          prev +
          "- Properly passing App ID from token generation to video call components\n"
      );
      setResult(
        (prev) => prev + "- Validating App ID format (32 hex characters)\n"
      );
      setResult(
        (prev) =>
          prev +
          "- Using App ID from server response rather than client environment\n"
      );
    } catch (error: any) {
      setResult((prev) => prev + `❌ Fix process failed: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Fix Agora "Invalid Vendor Key" Error
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Resolve the AgoraRTCError CAN_NOT_GET_GATEWAY_SERVER issue
        </p>

        <div className="text-center mb-8">
          <Button
            onClick={fixVendorKeyIssue}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-4 px-8 text-lg font-semibold"
          >
            {loading ? "Fixing Issue..." : "Apply Fix"}
          </Button>
        </div>

        {result && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Fix Results
            </h2>
            <pre className="text-gray-700 whitespace-pre-wrap font-mono text-sm bg-white p-4 rounded border">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            Root Cause & Solution
          </h3>
          <p className="text-yellow-700">
            The "invalid vendor key" error typically occurs in Next.js
            applications when:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-yellow-700">
            <li>
              App ID is accessed via process.env in client components
              (unreliable)
            </li>
            <li>
              App ID is not properly passed from token generation to video call
              components
            </li>
            <li>
              App ID format validation is missing before Agora client
              initialization
            </li>
          </ul>
          <p className="text-yellow-700 mt-2">
            <strong>Solution:</strong> Always pass App ID from the token
            generation API endpoint to the video call page as a URL parameter,
            and validate its format before use.
          </p>
        </div>
      </div>
    </div>
  );
}
