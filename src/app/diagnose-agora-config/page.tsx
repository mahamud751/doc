"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function DiagnoseAgoraConfig() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const diagnoseConfig = async () => {
    setLoading(true);
    setResult("Diagnosing Agora configuration...\n\n");

    try {
      // Step 1: Check environment variables
      setResult((prev) => prev + "Step 1: Checking environment variables\n");
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
      const cert = process.env.AGORA_APP_CERTIFICATE || "";

      setResult(
        (prev) =>
          prev +
          `NEXT_PUBLIC_AGORA_APP_ID: ${
            appId ? `${appId.substring(0, 8)}...` : "NOT SET"
          }\n`
      );
      setResult(
        (prev) => prev + `NEXT_PUBLIC_AGORA_APP_ID length: ${appId.length}/32\n`
      );
      setResult(
        (prev) =>
          prev +
          `AGORA_APP_CERTIFICATE: ${
            cert ? `${cert.substring(0, 8)}...` : "NOT SET"
          }\n`
      );
      setResult(
        (prev) => prev + `AGORA_APP_CERTIFICATE length: ${cert.length}/32\n\n`
      );

      // Step 2: Validate App ID format
      setResult((prev) => prev + "Step 2: Validating App ID format\n");
      if (!appId) {
        setResult((prev) => prev + "❌ NEXT_PUBLIC_AGORA_APP_ID is not set\n");
        return;
      }

      if (appId.length !== 32) {
        setResult(
          (prev) => prev + `❌ App ID length is invalid: ${appId.length}/32\n`
        );
        return;
      }

      // Check if App ID contains only valid characters
      const hexRegex = /^[0-9a-fA-F]+$/;
      if (!hexRegex.test(appId)) {
        setResult(
          (prev) =>
            prev +
            "❌ App ID contains invalid characters (should be hexadecimal)\n"
        );
        return;
      }

      setResult((prev) => prev + "✅ App ID format is valid\n\n");

      // Step 3: Test token generation endpoint
      setResult((prev) => prev + "Step 3: Testing token generation endpoint\n");

      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setResult(
            (prev) =>
              prev + "⚠️ No auth token found. Cannot test token generation.\n"
          );
        } else {
          const testChannel = `diagnose_${Math.floor(Math.random() * 10000)}`;
          const testUid = Math.floor(Math.random() * 100000);

          setResult((prev) => prev + `Making request to /api/agora/token...\n`);

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

          setResult((prev) => prev + `Response status: ${response.status}\n`);

          if (!response.ok) {
            const errorData = await response.json();
            setResult(
              (prev) =>
                prev + `❌ Token generation failed: ${errorData.error}\n`
            );
            return;
          }

          const data = await response.json();
          setResult((prev) => prev + "✅ Token generated successfully\n");
          setResult(
            (prev) =>
              prev +
              `Returned App ID: ${
                data.appId ? `${data.appId.substring(0, 8)}...` : "MISSING"
              }\n`
          );
          setResult(
            (prev) =>
              prev + `Returned App ID length: ${data.appId?.length || 0}/32\n`
          );
          setResult(
            (prev) =>
              prev +
              `Token: ${
                data.token ? `${data.token.substring(0, 20)}...` : "MISSING"
              }\n\n`
          );

          // Verify App ID consistency
          if (data.appId !== appId) {
            setResult((prev) => prev + "⚠️ WARNING: App ID mismatch!\n");
            setResult((prev) => prev + `Environment: ${appId}\n`);
            setResult((prev) => prev + `Token API:  ${data.appId}\n\n`);
          }
        }
      } catch (error: any) {
        setResult(
          (prev) =>
            prev + `❌ Token generation test failed: ${error.message}\n\n`
        );
      }

      // Step 4: Test Agora project status
      setResult((prev) => prev + "Step 4: Verifying Agora project status\n");
      setResult((prev) => prev + "To verify your Agora project:\n");
      setResult((prev) => prev + "1. Go to https://console.agora.io/\n");
      setResult((prev) => prev + "2. Sign in with your Agora account\n");
      setResult(
        (prev) =>
          prev + "3. Check that your project with App ID " + appId + " exists\n"
      );
      setResult(
        (prev) => prev + "4. Verify that the project status is 'Active'\n"
      );
      setResult(
        (prev) => prev + "5. Ensure Video SDK is enabled for your project\n\n"
      );

      setResult((prev) => prev + "✅ Diagnosis completed!\n");
    } catch (error: any) {
      setResult((prev) => prev + `❌ Diagnosis failed: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const createNewProjectGuide = () => {
    setResult("\nCreating a New Agora Project Guide:\n\n");
    setResult(
      (prev) =>
        prev + "If your current App ID is not working, create a new project:\n"
    );
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
    setResult(
      (prev) => prev + "8. Update your .env file with the new credentials:\n\n"
    );
    setResult(
      (prev) => prev + "NEXT_PUBLIC_AGORA_APP_ID=your_new_app_id_here\n"
    );
    setResult(
      (prev) => prev + "AGORA_APP_CERTIFICATE=your_new_certificate_here\n\n"
    );
    setResult((prev) => prev + "9. Restart your development server\n");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Diagnose Agora Configuration
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Troubleshoot the "invalid vendor key" error
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Button
            onClick={diagnoseConfig}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl py-4 text-lg font-semibold"
          >
            {loading ? "Diagnosing..." : "Run Diagnosis"}
          </Button>

          <Button
            onClick={createNewProjectGuide}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl py-4 text-lg font-semibold"
          >
            New Project Guide
          </Button>
        </div>

        {result && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Diagnosis Results
            </h2>
            <pre className="text-gray-700 whitespace-pre-wrap font-mono text-sm bg-white p-4 rounded border">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            About This Error
          </h3>
          <p className="text-yellow-700">
            The "invalid vendor key" error means Agora's servers don't recognize
            your App ID. This can happen even if the App ID format is correct.
            Common causes:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-yellow-700">
            <li>Your App ID is from a deleted or suspended project</li>
            <li>You're using the App Certificate instead of the App ID</li>
            <li>Your Agora project doesn't have Video SDK enabled</li>
            <li>There's a region mismatch in your Agora project</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
