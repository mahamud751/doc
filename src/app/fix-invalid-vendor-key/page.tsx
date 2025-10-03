"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function FixInvalidVendorKey() {
  const [step, setStep] = useState(1);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const runFixStep = async (stepNumber: number) => {
    setLoading(true);
    setStep(stepNumber);

    switch (stepNumber) {
      case 1:
        setResult("🔍 Step 1: Verifying Agora App ID Configuration\n\n");
        const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
        setResult(
          (prev) =>
            prev +
            `Current App ID: ${
              appId ? `${appId.substring(0, 8)}...` : "NOT SET"
            }\n`
        );
        setResult(
          (prev) => prev + `App ID Length: ${appId.length}/32 characters\n\n`
        );

        if (!appId) {
          setResult(
            (prev) =>
              prev + "❌ ISSUE FOUND: NEXT_PUBLIC_AGORA_APP_ID is not set\n"
          );
          setResult(
            (prev) =>
              prev + "🔧 FIX: Add NEXT_PUBLIC_AGORA_APP_ID to your .env file\n"
          );
        } else if (appId.length !== 32) {
          setResult(
            (prev) => prev + "❌ ISSUE FOUND: App ID length is incorrect\n"
          );
          setResult(
            (prev) => prev + "🔧 FIX: Ensure App ID is exactly 32 characters\n"
          );
        } else {
          setResult((prev) => prev + "✅ App ID configuration looks correct\n");
        }
        break;

      case 2:
        setResult("🔍 Step 2: Testing Token Generation\n\n");
        try {
          const testChannel = `fix_test_${Math.floor(Math.random() * 10000)}`;
          const testUid = Math.floor(Math.random() * 100000);

          const response = await fetch(
            `/api/agora/test-token?channelName=${testChannel}&uid=${testUid}&role=publisher`
          );
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Token generation failed");
          }

          setResult((prev) => prev + "✅ Token generation successful\n");
          setResult(
            (prev) =>
              prev + `App ID in token: ${data.appId.substring(0, 8)}...\n`
          );
          setResult(
            (prev) => prev + `Token: ${data.token.substring(0, 20)}...\n`
          );
        } catch (error: any) {
          setResult(
            (prev) => prev + `❌ Token generation failed: ${error.message}\n`
          );
          setResult(
            (prev) =>
              prev +
              "🔧 FIX: Check your Agora project settings and credentials\n"
          );
        }
        break;

      case 3:
        setResult("🔍 Step 3: Checking Video Call Parameter Flow\n\n");
        setResult((prev) => prev + "In your video call components, ensure:\n");
        setResult(
          (prev) =>
            prev +
            "1. App ID is passed from token response to video call page\n"
        );
        setResult(
          (prev) =>
            prev +
            "2. App ID is exactly 32 characters when passed to Agora client\n"
        );
        setResult(
          (prev) =>
            prev +
            "3. App ID is not undefined or null when client.join() is called\n\n"
        );

        setResult(
          (prev) => prev + "🔧 Recommended fix for video call components:\n"
        );
        setResult((prev) => prev + "```javascript\n");
        setResult((prev) => prev + "// In your video call page component\n");
        setResult((prev) => prev + "const searchParams = useSearchParams();\n");
        setResult(
          (prev) =>
            prev +
            "const appId = searchParams.get('appId') || process.env.NEXT_PUBLIC_AGORA_APP_ID;\n\n"
        );
        setResult((prev) => prev + "// Validate before using\n");
        setResult((prev) => prev + "useEffect(() => {\n");
        setResult((prev) => prev + "  if (!appId || appId.length !== 32) {\n");
        setResult(
          (prev) => prev + "    console.error('Invalid App ID:', appId);\n"
        );
        setResult((prev) => prev + "    // Handle error appropriately\n");
        setResult((prev) => prev + "  }\n");
        setResult((prev) => prev + "}, [appId]);\n");
        setResult((prev) => prev + "```\n");
        break;

      case 4:
        setResult("🔍 Step 4: Agora Dashboard Verification\n\n");
        setResult((prev) => prev + "Verify your Agora project settings:\n");
        setResult((prev) => prev + "1. Go to https://console.agora.io/\n");
        setResult((prev) => prev + "2. Check that your project is 'Active'\n");
        setResult(
          (prev) =>
            prev +
            "3. Verify App ID matches: " +
            (process.env.NEXT_PUBLIC_AGORA_APP_ID || "NOT SET") +
            "\n"
        );
        setResult((prev) => prev + "4. Ensure Video SDK is enabled\n");
        setResult(
          (prev) => prev + "5. Check that you're using the correct region\n\n"
        );

        setResult((prev) => prev + "🔧 Common fixes:\n");
        setResult(
          (prev) =>
            prev +
            "- Create a new Agora project if current one is problematic\n"
        );
        setResult(
          (prev) =>
            prev +
            "- Double-check you're copying the App ID, not the App Certificate\n"
        );
        setResult(
          (prev) => prev + "- Ensure your Agora account is not suspended\n"
        );
        break;

      case 5:
        setResult("✅ Step 5: Complete Solution Summary\n\n");
        setResult(
          (prev) =>
            prev +
            "Based on our investigation, here's how to fix the 'invalid vendor key' error:\n\n"
        );

        setResult((prev) => prev + "1. 🔍 VERIFY YOUR APP ID\n");
        setResult(
          (prev) =>
            prev + "   - Ensure NEXT_PUBLIC_AGORA_APP_ID is set in .env\n"
        );
        setResult(
          (prev) => prev + "   - Confirm it's exactly 32 characters long\n"
        );
        setResult(
          (prev) =>
            prev + "   - Verify it contains only hexadecimal characters\n\n"
        );

        setResult((prev) => prev + "2. 🔄 CHECK PARAMETER FLOW\n");
        setResult(
          (prev) =>
            prev +
            "   - Make sure App ID is correctly passed from token endpoint\n"
        );
        setResult(
          (prev) =>
            prev + "   - Validate App ID before using it in client.join()\n"
        );
        setResult(
          (prev) => prev + "   - Add error handling for undefined App IDs\n\n"
        );

        setResult((prev) => prev + "3. 🌐 VERIFY AGORA PROJECT\n");
        setResult(
          (prev) =>
            prev + "   - Check that your project is active in Agora dashboard\n"
        );
        setResult(
          (prev) =>
            prev + "   - Confirm you're using App ID, not App Certificate\n"
        );
        setResult(
          (prev) =>
            prev + "   - Ensure Video SDK is enabled for your project\n\n"
        );

        setResult((prev) => prev + "4. 🧪 TEST WITH NEW PROJECT\n");
        setResult(
          (prev) =>
            prev + "   - If issues persist, create a new Agora project\n"
        );
        setResult(
          (prev) => prev + "   - Use the new App ID in your configuration\n\n"
        );

        setResult(
          (prev) =>
            prev + "If you're still experiencing issues after these steps,\n"
        );
        setResult(
          (prev) =>
            prev +
            "the problem may be with Agora's servers recognizing your specific App ID.\n"
        );
        setResult(
          (prev) =>
            prev +
            "In that case, contact Agora support with your App ID for assistance.\n"
        );
        break;
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Fix "Invalid Vendor Key" Error
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Step-by-step solution to resolve Agora's "invalid vendor key" error
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map((num) => (
            <Button
              key={num}
              onClick={() => runFixStep(num)}
              disabled={loading && step === num}
              className={`py-3 px-4 rounded-xl font-semibold ${
                step === num
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800"
              }`}
            >
              {loading && step === num ? "Running..." : `Step ${num}`}
            </Button>
          ))}
        </div>

        {result && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {step === 1 && "Verify App ID Configuration"}
              {step === 2 && "Test Token Generation"}
              {step === 3 && "Check Parameter Flow"}
              {step === 4 && "Verify Agora Dashboard"}
              {step === 5 && "Complete Solution Summary"}
            </h2>
            <pre className="text-gray-700 whitespace-pre-wrap font-mono text-sm bg-white p-4 rounded border">
              {result}
            </pre>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-green-800 mb-2">
            Quick Fix Checklist
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-green-700">
            <li>Confirm NEXT_PUBLIC_AGORA_APP_ID is set in .env file</li>
            <li>Verify App ID is exactly 32 characters long</li>
            <li>
              Check that App ID is passed correctly to video call components
            </li>
            <li>
              Validate App ID before using it in Agora client initialization
            </li>
            <li>
              Verify your Agora project is active and Video SDK is enabled
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
