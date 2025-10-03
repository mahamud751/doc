"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function SimulateVideoCallFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const simulateFullFlow = async () => {
    setLoading(true);
    setResult("Simulating full video call flow...\n\n");

    try {
      // Step 1: Token generation
      setStep(1);
      setResult((prev) => prev + "Step 1: Simulating token generation\n");

      const token = localStorage.getItem("authToken");
      if (!token) {
        setResult(
          (prev) => prev + "⚠️ No auth token found. Using test data.\n"
        );

        // Use test data
        const testAppId =
          process.env.NEXT_PUBLIC_AGORA_APP_ID ||
          "00000000000000000000000000000000";
        const testData = {
          token: "test_token_placeholder",
          appId: testAppId,
          channel: "test_channel_12345",
          uid: 123456,
          expires: Math.floor(Date.now() / 1000) + 3600,
        };

        setResult((prev) => prev + `✅ Using test data\n`);
        setResult(
          (prev) => prev + `App ID: ${testData.appId.substring(0, 8)}...\n`
        );
        setResult((prev) => prev + `Channel: ${testData.channel}\n`);
        setResult((prev) => prev + `UID: ${testData.uid}\n\n`);

        // Step 2: Navigate to video call page
        setStep(2);
        setResult(
          (prev) => prev + "Step 2: Simulating navigation to video call page\n"
        );
        const callUrl = `/test-video-call-params?channel=${testData.channel}&token=${testData.token}&uid=${testData.uid}&appId=${testData.appId}`;
        setResult((prev) => prev + `✅ Would navigate to: ${callUrl}\n\n`);

        // Step 3: Simulate video call page initialization
        setStep(3);
        setResult(
          (prev) => prev + "Step 3: Simulating video call page initialization\n"
        );
        setResult(
          (prev) =>
            prev +
            `✅ App ID from URL params: ${testData.appId.substring(0, 8)}...\n`
        );
        setResult(
          (prev) => prev + `✅ App ID length: ${testData.appId.length}/32\n`
        );

        // Validate App ID
        if (testData.appId.length !== 32) {
          setResult((prev) => prev + "❌ App ID length is invalid\n");
          return;
        }

        const hexRegex = /^[0-9a-fA-F]+$/;
        if (!hexRegex.test(testData.appId)) {
          setResult((prev) => prev + "❌ App ID contains invalid characters\n");
          return;
        }

        setResult((prev) => prev + "✅ App ID format validation passed\n\n");

        setResult((prev) => prev + "🎉 Full flow simulation completed!\n");
        setResult(
          (prev) =>
            prev +
            "If you're still getting 'invalid vendor key' errors, the issue is likely with your Agora project configuration.\n"
        );
      } else {
        // Use real token generation
        setResult((prev) => prev + "✅ Auth token found\n");

        const testChannel = `sim_${Math.floor(Math.random() * 10000)}`;
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
          (prev) => prev + `App ID: ${tokenData.appId.substring(0, 8)}...\n`
        );
        setResult((prev) => prev + `Channel: ${tokenData.channel}\n`);
        setResult((prev) => prev + `UID: ${tokenData.uid}\n`);
        setResult(
          (prev) => prev + `Token: ${tokenData.token.substring(0, 20)}...\n\n`
        );

        // Navigate to video call page
        setStep(2);
        setResult(
          (prev) => prev + "Step 2: Simulating navigation to video call page\n"
        );
        const callUrl = `/test-video-call-params?channel=${tokenData.channel}&token=${tokenData.token}&uid=${tokenData.uid}&appId=${tokenData.appId}`;
        setResult((prev) => prev + `✅ Would navigate to: ${callUrl}\n\n`);

        // Simulate video call page initialization
        setStep(3);
        setResult(
          (prev) => prev + "Step 3: Simulating video call page initialization\n"
        );
        setResult(
          (prev) =>
            prev +
            `✅ App ID from URL params: ${tokenData.appId.substring(0, 8)}...\n`
        );
        setResult(
          (prev) => prev + `✅ App ID length: ${tokenData.appId.length}/32\n`
        );

        // Validate App ID
        if (tokenData.appId.length !== 32) {
          setResult((prev) => prev + "❌ App ID length is invalid\n");
          return;
        }

        const hexRegex = /^[0-9a-fA-F]+$/;
        if (!hexRegex.test(tokenData.appId)) {
          setResult((prev) => prev + "❌ App ID contains invalid characters\n");
          return;
        }

        setResult((prev) => prev + "✅ App ID format validation passed\n\n");

        setResult((prev) => prev + "🎉 Full flow simulation completed!\n");
      }
    } catch (error: any) {
      setResult(
        (prev) =>
          prev + `❌ Simulation failed at step ${step}: ${error.message}\n`
      );
    } finally {
      setLoading(false);
    }
  };

  const goToTestParams = () => {
    // Generate test URL with App ID from environment
    const appId =
      process.env.NEXT_PUBLIC_AGORA_APP_ID ||
      "00000000000000000000000000000000";
    const testUrl = `/test-video-call-params?channel=test&token=test&uid=123456&appId=${appId}`;
    router.push(testUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Simulate Video Call Flow
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Test the complete flow from token generation to video call
          initialization
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Button
            onClick={simulateFullFlow}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl py-4 text-lg font-semibold"
          >
            {loading ? `Simulating... (Step ${step}/3)` : "Simulate Full Flow"}
          </Button>

          <Button
            onClick={goToTestParams}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl py-4 text-lg font-semibold"
          >
            Go to Test Params Page
          </Button>
        </div>

        {result && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Simulation Results
            </h2>
            <pre className="text-gray-700 whitespace-pre-wrap font-mono text-sm bg-white p-4 rounded border">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">Flow Steps</h3>
          <ol className="list-decimal pl-5 space-y-2 text-yellow-700">
            <li>Token Generation: API call to /api/agora/token</li>
            <li>Navigation: Redirect to video call page with parameters</li>
            <li>
              Initialization: Video call page uses parameters to initialize
              Agora SDK
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
