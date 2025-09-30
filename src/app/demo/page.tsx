"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function DemoPage() {
  const [testResult, setTestResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult(
          `✅ Login successful for ${data.user.name} (${data.user.role})`
        );
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userName", data.user.name);
      } else {
        setTestResult(`❌ Login failed: ${data.error}`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testDoctorsAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/doctors");
      const data = await response.json();

      if (response.ok) {
        setTestResult(`✅ Found ${data.doctors.length} doctors in the system`);
      } else {
        setTestResult(`❌ Failed to fetch doctors: ${data.error}`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🏥 Doctor Consultation Platform - Demo & Testing
          </h1>

          <div className="space-y-8">
            {/* Test Credentials */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Test Credentials</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h3 className="font-medium text-gray-700">Admin</h3>
                  <p>Email: admin@mediconnect.com</p>
                  <p>Password: admin123</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Doctor</h3>
                  <p>Email: sarah.wilson@mediconnect.com</p>
                  <p>Password: doctor123</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Patient</h3>
                  <p>Email: patient@example.com</p>
                  <p>Password: patient123</p>
                </div>
              </div>
            </div>

            {/* Quick Tests */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Quick System Tests</h2>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() =>
                      testLogin("admin@mediconnect.com", "admin123")
                    }
                    disabled={loading}
                    variant="outline"
                  >
                    Test Admin Login
                  </Button>
                  <Button
                    onClick={() =>
                      testLogin("sarah.wilson@mediconnect.com", "doctor123")
                    }
                    disabled={loading}
                    variant="outline"
                  >
                    Test Doctor Login
                  </Button>
                  <Button
                    onClick={() =>
                      testLogin("patient@example.com", "patient123")
                    }
                    disabled={loading}
                    variant="outline"
                  >
                    Test Patient Login
                  </Button>
                  <Button
                    onClick={testDoctorsAPI}
                    disabled={loading}
                    variant="outline"
                  >
                    Test Doctors API
                  </Button>
                </div>

                {testResult && (
                  <div className="mt-4 p-3 bg-white border rounded-md">
                    <p className="text-sm font-mono">{testResult}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Links */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Navigate to Pages</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/landing">
                  <Button variant="outline" className="w-full">
                    Landing Page
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="outline" className="w-full">
                    Register
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="/doctors">
                  <Button variant="outline" className="w-full">
                    Find Doctors
                  </Button>
                </Link>
                <Link href="/booking">
                  <Button variant="outline" className="w-full">
                    Book Appointment
                  </Button>
                </Link>
                <Link href="/patient/dashboard">
                  <Button variant="outline" className="w-full">
                    Patient Dashboard
                  </Button>
                </Link>
                <Link href="/doctor/dashboard">
                  <Button variant="outline" className="w-full">
                    Doctor Dashboard
                  </Button>
                </Link>
                <Link href="/admin/dashboard">
                  <Button variant="outline" className="w-full">
                    Admin Dashboard
                  </Button>
                </Link>
              </div>
            </div>

            {/* Features Implemented */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                ✅ Features Implemented
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    Authentication & User Management
                  </h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>✅ User registration (no email verification needed)</li>
                    <li>✅ Role-based login (Patient, Doctor, Admin)</li>
                    <li>✅ JWT token authentication</li>
                    <li>✅ Doctor verification workflow</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    Doctor & Patient Features
                  </h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>✅ Doctor search and filtering</li>
                    <li>✅ Appointment booking system</li>
                    <li>✅ Video call integration (Agora SDK)</li>
                    <li>✅ Patient & Doctor dashboards</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    Admin & Management
                  </h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>✅ Admin dashboard with analytics</li>
                    <li>✅ Medicine management system</li>
                    <li>✅ Lab packages management</li>
                    <li>✅ User management & verification</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    Technical Implementation
                  </h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>✅ PostgreSQL database with Prisma ORM</li>
                    <li>✅ Beautiful responsive UI with Tailwind CSS</li>
                    <li>✅ API endpoints for all functionality</li>
                    <li>✅ Email notifications (development mode)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Usage Instructions */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">🚀 How to Use</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>
                  Start by testing the login credentials above to see different
                  user roles
                </li>
                <li>
                  Try <strong>Register</strong> to create a new account (no
                  email verification required)
                </li>
                <li>
                  Visit the <strong>Landing Page</strong> to see the public
                  marketing site
                </li>
                <li>
                  Try <strong>Find Doctors</strong> to see available verified
                  doctors
                </li>
                <li>
                  Use <strong>Book Appointment</strong> (requires patient login)
                  to schedule consultations
                </li>
                <li>
                  Access role-specific dashboards for different user experiences
                </li>
                <li>Admin can manage doctors, medicines, and lab packages</li>
                <li>Video calls use Agora SDK for real-time communication</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
