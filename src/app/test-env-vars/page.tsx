"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function TestEnvVars() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check environment variables in browser
    setEnvVars({
      NEXT_PUBLIC_AGORA_APP_ID:
        process.env.NEXT_PUBLIC_AGORA_APP_ID || "NOT SET",
      AGORA_APP_CERTIFICATE: process.env.AGORA_APP_CERTIFICATE || "NOT SET",
      NODE_ENV: process.env.NODE_ENV || "NOT SET",
    });
    setLoading(false);
  }, []);

  const testEnvAccess = () => {
    // Try to access environment variables again
    setEnvVars({
      NEXT_PUBLIC_AGORA_APP_ID:
        process.env.NEXT_PUBLIC_AGORA_APP_ID || "NOT SET",
      AGORA_APP_CERTIFICATE: process.env.AGORA_APP_CERTIFICATE || "NOT SET",
      NODE_ENV: process.env.NODE_ENV || "NOT SET",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading environment variables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Environment Variables Test
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Check if environment variables are accessible in client components
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-xl">
            <h2 className="text-lg font-bold text-blue-800 mb-2">
              NEXT_PUBLIC_AGORA_APP_ID
            </h2>
            <p className="font-mono text-sm break-all bg-white p-2 rounded">
              {envVars.NEXT_PUBLIC_AGORA_APP_ID}
            </p>
            <p className="text-xs mt-2 text-gray-600">
              Length: {envVars.NEXT_PUBLIC_AGORA_APP_ID?.length || 0} characters
            </p>
            {envVars.NEXT_PUBLIC_AGORA_APP_ID &&
            envVars.NEXT_PUBLIC_AGORA_APP_ID !== "NOT SET" ? (
              <p className="text-green-600 mt-2">✅ Available</p>
            ) : (
              <p className="text-red-600 mt-2">❌ Not available</p>
            )}
          </div>

          <div className="bg-purple-50 p-6 rounded-xl">
            <h2 className="text-lg font-bold text-purple-800 mb-2">
              AGORA_APP_CERTIFICATE
            </h2>
            <p className="font-mono text-sm break-all bg-white p-2 rounded">
              {envVars.AGORA_APP_CERTIFICATE === "NOT SET"
                ? "NOT SET"
                : `${envVars.AGORA_APP_CERTIFICATE.substring(0, 8)}...`}
            </p>
            <p className="text-xs mt-2 text-gray-600">
              Length:{" "}
              {envVars.AGORA_APP_CERTIFICATE === "NOT SET"
                ? 0
                : envVars.AGORA_APP_CERTIFICATE.length}{" "}
              characters
            </p>
            {envVars.AGORA_APP_CERTIFICATE &&
            envVars.AGORA_APP_CERTIFICATE !== "NOT SET" ? (
              <p className="text-green-600 mt-2">✅ Available</p>
            ) : (
              <p className="text-yellow-600 mt-2">⚠️ Not set (optional)</p>
            )}
          </div>

          <div className="bg-green-50 p-6 rounded-xl">
            <h2 className="text-lg font-bold text-green-800 mb-2">NODE_ENV</h2>
            <p className="font-mono text-sm break-all bg-white p-2 rounded">
              {envVars.NODE_ENV}
            </p>
            <p className="text-green-600 mt-2">✅ Available</p>
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={testEnvAccess}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl py-3 px-8 text-lg font-semibold"
          >
            Refresh Environment Variables
          </Button>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            Environment Variable Notes
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-yellow-700">
            <li>
              Only environment variables prefixed with NEXT_PUBLIC_ are
              available in browser
            </li>
            <li>
              Environment variables are embedded at build time, not runtime
            </li>
            <li>
              If you change .env files, you need to restart the development
              server
            </li>
            <li>
              For production builds, environment variables are compiled into the
              bundle
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
