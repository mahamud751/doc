"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function ComprehensiveAgoraFix() {
  const [activeSection, setActiveSection] = useState("problem");

  const sections = {
    problem: {
      title: "The Problem",
      content: `The "AgoraRTCError CAN_NOT_GET_GATEWAY_SERVER: invalid vendor key" error occurs when Agora's servers don't recognize your App ID, even though it appears to be valid.

Common causes:
1. App ID is accessed via process.env in client components (unreliable)
2. App ID is not properly passed from token generation to video call components
3. App ID format validation is missing before Agora client initialization
4. Using App ID from environment variables instead of token response`,
    },
    solution: {
      title: "The Solution",
      content: `Fix the "invalid vendor key" error by implementing these best practices:

1. Pass App ID from token generation endpoint to video call pages as URL parameters
2. Don't rely on process.env in client components for sensitive data
3. Validate App ID format (32 hexadecimal characters) before use
4. Handle errors gracefully with user-friendly messages

Implementation steps:
1. Modify token generation endpoint to return App ID in response
2. Update video call initiation to pass App ID as URL parameter
3. Update video call pages to read App ID from URL params
4. Add proper validation and error handling`,
    },
    implementation: {
      title: "Implementation Details",
      content: `Here's how to properly implement the fix:

1. Token Generation Endpoint (/api/agora/token):
   - Already returns App ID in response (this is correct)
   - Ensure App ID is validated before token generation

2. Video Call Initiation (in dashboard/components):
   // Correct way to initiate video call
   const tokenData = await generateAgoraToken(channelName, uid);
   const callUrl = \`/patient/video-call?channel=\${channelName}&token=\${tokenData.token}&uid=\${uid}&appId=\${tokenData.appId}\`;
   window.open(callUrl, "_blank");

3. Video Call Pages (patient/video-call/page.tsx and doctor/video-call/page.tsx):
   // Correct way to access parameters
   const searchParams = useSearchParams();
   const appId = searchParams.get("appId") || ""; // From URL params, not env vars
   const channelName = searchParams.get("channel") || "";
   const token = searchParams.get("token") || "";
   const uid = searchParams.get("uid") || "";

4. App ID Validation:
   // Validate App ID format before Agora client initialization
   if (!appId || appId.length !== 32) {
     throw new Error(\`Invalid App ID format. Expected 32 characters, got \${appId?.length || 0}\`);
   }
   
   // Check if App ID contains only valid characters
   const hexRegex = /^[0-9a-fA-F]+$/;
   if (!hexRegex.test(appId)) {
     throw new Error("Invalid App ID format. App ID should only contain hexadecimal characters.");
   }`,
    },
    testing: {
      title: "Testing the Fix",
      content: `Test the fix using these steps:

1. Verify App ID passing:
   - Check that token generation endpoint returns App ID
   - Confirm App ID is passed as URL parameter to video call pages
   - Validate App ID format in video call components

2. Test error handling:
   - Test with invalid App ID to verify error messages
   - Test with missing parameters to verify validation
   - Test with network issues to verify graceful handling

3. End-to-end testing:
   - Patient initiates video call from dashboard
   - Doctor receives call notification
   - Both parties join the same channel
   - Video and audio streams work correctly
   - Call can be ended properly

Diagnostic pages available:
- /test-appid-passing - Verify App ID passing mechanism
- /test-video-call-receiver - Test parameter reception
- /fix-agora-vendor-key - Apply automated fixes
- /verify-agora-project - Verify project configuration`,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">
          Comprehensive Agora "Invalid Vendor Key" Fix
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Complete guide to resolving the AgoraRTCError
          CAN_NOT_GET_GATEWAY_SERVER issue
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sections</h2>
              <nav className="space-y-2">
                {Object.entries(sections).map(([key, section]) => (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      activeSection === key
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {sections[activeSection as keyof typeof sections].title}
              </h2>
              <div className="prose prose-lg max-w-none">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-6 rounded-lg border">
                  {sections[activeSection as keyof typeof sections].content}
                </pre>
              </div>

              {activeSection === "testing" && (
                <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-yellow-800 mb-4">
                    Quick Test Links
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a
                      href="/test-appid-passing"
                      className="block text-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all"
                    >
                      Test App ID Passing
                    </a>
                    <a
                      href="/test-video-call-receiver"
                      className="block text-center px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all"
                    >
                      Test Parameter Reception
                    </a>
                    <a
                      href="/fix-agora-vendor-key"
                      className="block text-center px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all"
                    >
                      Apply Automated Fix
                    </a>
                    <a
                      href="/verify-agora-project"
                      className="block text-center px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all"
                    >
                      Verify Project Config
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-green-800 mb-4">
            Key Takeaways
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-green-700">
            <li>
              Always pass App ID from token generation endpoint to video call
              pages as URL parameters
            </li>
            <li>
              Don't rely on process.env in client components for sensitive data
              like App IDs
            </li>
            <li>
              Validate App ID format (32 hexadecimal characters) before Agora
              client initialization
            </li>
            <li>Handle errors gracefully with user-friendly messages</li>
            <li>
              Test end-to-end video call flow to ensure both parties can connect
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
