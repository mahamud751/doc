"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function FinalAgoraDiagnostic() {
  const [step, setStep] = useState(1);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const runFullDiagnostic = async () => {
    setLoading(true);
    setResult("Running final Agora diagnostic...\n\n");

    try {
      // Step 1: Environment variables check
      setStep(1);
      setResult((prev) => prev + "Step 1: Environment variables check\n");
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
      const cert = process.env.AGORA_APP_CERTIFICATE || "";

      setResult(
        (prev) =>
          prev +
          `App ID: ${appId ? `${appId.substring(0, 8)}...` : "NOT SET"}\n`
      );
      setResult((prev) => prev + `App ID length: ${appId.length}/32\n`);
      setResult(
        (prev) =>
          prev +
          `Certificate: ${cert ? `${cert.substring(0, 8)}...` : "NOT SET"}\n`
      );
      setResult((prev) => prev + `Certificate length: ${cert.length}/32\n\n`);

      if (!appId) {
        setResult(
          (prev) => prev + "❌ App ID is missing from environment variables\n"
        );
        return;
      }

      // Step 2: App ID format validation
      setStep(2);
      setResult((prev) => prev + "Step 2: App ID format validation\n");

      if (appId.length !== 32) {
        setResult(
          (prev) => prev + `❌ App ID length is invalid: ${appId.length}/32\n`
        );
        return;
      }

      const hexRegex = /^[0-9a-fA-F]+$/;
      if (!hexRegex.test(appId)) {
        setResult((prev) => prev + "❌ App ID contains invalid characters\n");
        return;
      }

      setResult((prev) => prev + "✅ App ID format validation passed\n\n");

      // Step 3: Token generation test
      setStep(3);
      setResult((prev) => prev + "Step 3: Token generation test\n");

      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setResult(
            (prev) => prev + "⚠️ No auth token found. Using direct API test.\n"
          );

          // Test the test-token endpoint
          const testChannel = `diag_${Math.floor(Math.random() * 10000)}`;
          const testUid = Math.floor(Math.random() * 100000);

          const response = await fetch(
            `/api/agora/test-token?channelName=${testChannel}&uid=${testUid}&role=publisher`
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Test token generation failed");
          }

          const data = await response.json();
          setResult((prev) => prev + "✅ Test token generated successfully\n");
          setResult(
            (prev) => prev + `App ID: ${data.appId.substring(0, 8)}...\n`
          );
          setResult(
            (prev) => prev + `Token: ${data.token.substring(0, 20)}...\n\n`
          );
        } else {
          const testChannel = `diag_${Math.floor(Math.random() * 10000)}`;
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

          const data = await response.json();
          setResult((prev) => prev + "✅ Token generated successfully\n");
          setResult(
            (prev) => prev + `App ID: ${data.appId.substring(0, 8)}...\n`
          );
          setResult(
            (prev) => prev + `Token: ${data.token.substring(0, 20)}...\n\n`
          );
        }
      } catch (error: any) {
        setResult(
          (prev) => prev + `❌ Token generation failed: ${error.message}\n\n`
        );
        return;
      }

      // Step 4: Agora project verification
      setStep(4);
      setResult((prev) => prev + "Step 4: Agora project verification\n");
      setResult((prev) => prev + "To verify your Agora project:\n");
      setResult((prev) => prev + "1. Go to https://console.agora.io/\n");
      setResult(
        (prev) => prev + `2. Find your project with App ID: ${appId}\n`
      );
      setResult(
        (prev) => prev + "3. Check that the project status is 'Active'\n"
      );
      setResult((prev) => prev + "4. Ensure Video SDK is enabled\n");
      setResult(
        (prev) => prev + "5. Verify you're using the correct region\n\n"
      );

      // Step 5: Final recommendation
      setStep(5);
      setResult((prev) => prev + "Step 5: Final recommendations\n");
      setResult(
        (prev) =>
          prev + "🔧 If you're still getting 'invalid vendor key' errors:\n"
      );
      setResult(
        (prev) =>
          prev + "1. Your App ID might be from a deleted/suspended project\n"
      );
      setResult(
        (prev) =>
          prev + "2. Create a new Agora project and update your .env file\n"
      );
      setResult(
        (prev) => prev + "3. Ensure you're using App ID, not App Certificate\n"
      );
      setResult(
        (prev) =>
          prev +
          "4. Contact Agora support with your App ID if issues persist\n\n"
      );

      setResult((prev) => prev + "✅ Final diagnostic completed!\n");
    } catch (error: any) {
      setResult(
        (prev) =>
          prev + `❌ Diagnostic failed at step ${step}: ${error.message}\n`
      );
    } finally {
      setLoading(false);
    }
  };

  const createNewAgoraProject = () => {
    setResult("\n📋 Steps to Create a New Agora Project:\n\n");
    setResult((prev) => prev + "1. Go to https://console.agora.io/\n");
    setResult((prev) => prev + "2. Sign in to your Agora account\n");
    setResult((prev) => prev + "3. Click 'New Project'\n");
    setResult(
      (prev) => prev + "4. Enter a project name (e.g., 'Healthcare App')\n"
    );
    setResult(
      (prev) => prev + "5. Select 'HTTPS' as the authentication method\n"
    );
    setResult((prev) => prev + "6. Click 'Create'\n");
    setResult((prev) => prev + "7. Copy the new App ID and App Certificate\n");
    setResult((prev) => prev + "8. Update your .env file:\n\n");
    setResult(
      (prev) => prev + "NEXT_PUBLIC_AGORA_APP_ID=your_new_app_id_here\n"
    );
    setResult(
      (prev) => prev + "AGORA_APP_CERTIFICATE=your_new_certificate_here\n\n"
    );
    setResult(
      (prev) => prev + "9. Restart your development server: npm run dev\n"
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Final Agora Diagnostic
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Complete diagnostic for the "invalid vendor key" error
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Button
            onClick={runFullDiagnostic}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl py-4 text-lg font-semibold"
          >
            {loading ? `Running... (Step ${step}/5)` : "Run Full Diagnostic"}
          </Button>

          <Button
            onClick={createNewAgoraProject}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl py-4 text-lg font-semibold"
          >
            Create New Project Guide
          </Button>
        </div>

        {result && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Diagnostic Results
            </h2>
            <pre className="text-gray-700 whitespace-pre-wrap font-mono text-sm bg-white p-4 rounded border">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            Critical Insight
          </h3>
          <p className="text-yellow-700">
            The "invalid vendor key" error typically means that while your App
            ID format is correct, Agora's servers don't recognize it. This
            usually happens when:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-yellow-700">
            <li>Your Agora project has been deleted or suspended</li>
            <li>You're using an App ID from a different Agora account</li>
            <li>Your project doesn't have Video SDK enabled</li>
            <li>There's a region mismatch in your Agora project</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
