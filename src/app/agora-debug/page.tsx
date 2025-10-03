"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

export default function AgoraDebugPage() {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [testTokenResult, setTestTokenResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("validation");

  const validateProject = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/agora/validate-project");
      const data = await response.json();
      setValidationResult(data);
    } catch (error: any) {
      setValidationResult({
        error: "Failed to validate project",
        message: error.message || "Network error",
      });
    } finally {
      setLoading(false);
    }
  };

  const testTokenGeneration = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/agora/test-token?channelName=debug_test&uid=12345&role=publisher"
      );
      const data = await response.json();
      setTestTokenResult(data);
    } catch (error: any) {
      setTestTokenResult({
        error: "Failed to generate test token",
        message: error.message || "Network error",
      });
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    await validateProject();
    await testTokenGeneration();
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Agora Video Call Debug
          </h1>
          <p className="text-lg text-gray-600">
            Diagnose and fix issues with your Agora video call integration
          </p>
        </div>

        <div className="flex space-x-4 mb-6">
          <Button
            onClick={runAllTests}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-full"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Run All Tests
          </Button>

          <Button
            onClick={() => window.open("https://console.agora.io/", "_blank")}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Agora Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-500" />
                Project Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={validateProject}
                disabled={loading}
                className="w-full mb-4 bg-blue-500 hover:bg-blue-600 rounded-full"
              >
                Validate Project
              </Button>

              {validationResult && (
                <div className="space-y-4">
                  {validationResult.success ? (
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-700 font-medium">
                        {validationResult.message}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start p-3 bg-red-50 rounded-lg">
                      <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-red-700 font-medium">
                          {validationResult.error}
                        </p>
                        {validationResult.solution && (
                          <p className="text-red-600 text-sm mt-1">
                            Solution: {validationResult.solution}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {validationResult.instructions && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-yellow-700 text-sm">
                        {validationResult.instructions}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2 text-purple-500" />
                Token Generation Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testTokenGeneration}
                disabled={loading}
                className="w-full mb-4 bg-purple-500 hover:bg-purple-600 rounded-full"
              >
                Test Token Generation
              </Button>

              {testTokenResult && (
                <div className="space-y-4">
                  {testTokenResult.success ? (
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-700 font-medium">
                        {testTokenResult.message}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start p-3 bg-red-50 rounded-lg">
                      <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-red-700 font-medium">
                          {testTokenResult.error}
                        </p>
                        {testTokenResult.message && (
                          <p className="text-red-600 text-sm mt-1">
                            Details: {testTokenResult.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {testTokenResult.token && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Generated Token Info:
                      </h4>
                      <div className="text-sm space-y-1 text-gray-600">
                        <p>App ID: {testTokenResult.appId}</p>
                        <p>Channel: {testTokenResult.channel}</p>
                        <p>UID: {testTokenResult.uid}</p>
                        <p>
                          Token: {testTokenResult.token.substring(0, 20)}...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Troubleshooting Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900">
                If you're seeing "invalid vendor key" errors:
              </h3>

              <ol className="list-decimal pl-5 space-y-3 text-gray-700">
                <li>
                  <span className="font-medium">
                    Check your Agora Dashboard:
                  </span>
                  <p className="text-sm mt-1">
                    Make sure your Agora project is active and Video SDK is
                    enabled.
                    <a
                      href="https://console.agora.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline ml-1"
                    >
                      Open Agora Dashboard
                    </a>
                  </p>
                </li>

                <li>
                  <span className="font-medium">Verify App ID ownership:</span>
                  <p className="text-sm mt-1">
                    Ensure the App ID belongs to your Agora account and hasn't
                    been copied from another source.
                  </p>
                </li>

                <li>
                  <span className="font-medium">Check project status:</span>
                  <p className="text-sm mt-1">
                    Projects can be suspended due to billing issues or policy
                    violations. Check your project status in the Agora
                    dashboard.
                  </p>
                </li>

                <li>
                  <span className="font-medium">Create a new project:</span>
                  <p className="text-sm mt-1">
                    If the current project is problematic, create a new one in
                    the Agora dashboard and update your environment variables.
                  </p>
                </li>

                <li>
                  <span className="font-medium">
                    Verify environment variables:
                  </span>
                  <p className="text-sm mt-1">
                    Make sure your .env file contains the correct App ID and
                    Certificate:
                  </p>
                  <pre className="bg-gray-800 text-gray-100 p-3 rounded mt-2 text-sm overflow-x-auto">
                    {`NEXT_PUBLIC_AGORA_APP_ID=your_32_char_app_id
AGORA_APP_CERTIFICATE=your_32_char_certificate`}
                  </pre>
                </li>
              </ol>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-2">
                  Quick Fix Recommendation:
                </h4>
                <p className="text-blue-700">
                  Since your App ID format is correct but Agora's servers aren't
                  recognizing it, the most reliable solution is to create a new
                  Agora project:
                </p>
                <ol className="list-decimal pl-5 mt-2 space-y-1 text-blue-700">
                  <li>
                    Go to{" "}
                    <a
                      href="https://console.agora.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Agora Dashboard
                    </a>
                  </li>
                  <li>Click "Projects" in the left sidebar</li>
                  <li>Click "Create Project"</li>
                  <li>Choose "App ID + App Certificate (Recommended)"</li>
                  <li>Copy the new App ID and Certificate to your .env file</li>
                  <li>Restart your development server</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
