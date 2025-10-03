import React from "react";

// Server component to get environment variables
async function getEnvVars() {
  return {
    NEXT_PUBLIC_AGORA_APP_ID: process.env.NEXT_PUBLIC_AGORA_APP_ID || "NOT SET",
    AGORA_APP_CERTIFICATE: process.env.AGORA_APP_CERTIFICATE || "NOT SET",
  };
}

export default async function TestAgoraEnv() {
  const envVars = await getEnvVars();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Agora Environment Variables Test
        </h1>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              NEXT_PUBLIC_AGORA_APP_ID
            </h2>
            <p className="font-mono text-sm break-all bg-gray-50 p-2 rounded">
              {envVars.NEXT_PUBLIC_AGORA_APP_ID}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Length: {envVars.NEXT_PUBLIC_AGORA_APP_ID?.length || 0}/32
            </p>
            {envVars.NEXT_PUBLIC_AGORA_APP_ID &&
            envVars.NEXT_PUBLIC_AGORA_APP_ID.length === 32 ? (
              <p className="text-green-600 text-sm mt-2">✓ Valid length</p>
            ) : (
              <p className="text-red-600 text-sm mt-2">✗ Invalid length</p>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              AGORA_APP_CERTIFICATE
            </h2>
            <p className="font-mono text-sm break-all bg-gray-50 p-2 rounded">
              {envVars.AGORA_APP_CERTIFICATE
                ? `${envVars.AGORA_APP_CERTIFICATE.substring(0, 8)}...`
                : "NOT SET"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Length: {envVars.AGORA_APP_CERTIFICATE?.length || 0}/32
            </p>
            {envVars.AGORA_APP_CERTIFICATE &&
            envVars.AGORA_APP_CERTIFICATE.length === 32 ? (
              <p className="text-green-600 text-sm mt-2">✓ Valid length</p>
            ) : (
              <p className="text-red-600 text-sm mt-2">✗ Invalid length</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Instructions
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-blue-700">
              <li>
                If NEXT_PUBLIC_AGORA_APP_ID shows "NOT SET", check your .env
                file
              </li>
              <li>
                If the length is not 32, verify your App ID in the Agora
                dashboard
              </li>
              <li>
                Make sure to restart your development server after changing .env
                files
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
