"use client";

import { useState } from "react";
import { Database, Users, Stethoscope, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  const initializeDemoData = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/demo/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize demo data");
      }

      setCompleted(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Database className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Setup Demo Platform
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Initialize the telemedicine platform with demo data
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!completed ? (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Demo Data Setup
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  This will create demo users, appointments, and sample data for
                  testing the platform.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span>Demo patient, doctor, and admin accounts</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Stethoscope className="w-5 h-5 text-green-500" />
                  <span>Sample appointments and consultations</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Database className="w-5 h-5 text-purple-500" />
                  <span>Medicine inventory and lab packages</span>
                </div>
              </div>

              <Button
                onClick={initializeDemoData}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Setting up..." : "Initialize Demo Data"}
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Demo Accounts
                </h4>
                <div className="text-xs text-blue-800 space-y-1">
                  <p>
                    <strong>Patient:</strong> patient@demo.com / password123
                  </p>
                  <p>
                    <strong>Doctor:</strong> doctor@demo.com / password123
                  </p>
                  <p>
                    <strong>Admin:</strong> admin@demo.com / password123
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Setup Complete!
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Demo data has been successfully created. You can now test the
                  platform.
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/auth/login">
                  <Button className="w-full">Go to Login</Button>
                </Link>
                <Link href="/landing">
                  <Button variant="outline" className="w-full">
                    Back to Home
                  </Button>
                </Link>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 mb-2">
                  Ready to Test
                </h4>
                <div className="text-xs text-green-800 space-y-1">
                  <p>✅ User accounts created</p>
                  <p>✅ Sample appointment scheduled</p>
                  <p>✅ Medicine inventory loaded</p>
                  <p>✅ Doctor verification approved</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
