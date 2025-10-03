"use client";

import React, { useState } from "react";
import AgoraVideoCall from "@/components/AgoraVideoCall";

export default function TestVideoCall() {
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [channelName, setChannelName] = useState("test-channel");
  const [userRole, setUserRole] = useState<"patient" | "doctor">("patient");
  const [userId, setUserId] = useState("12345");
  const [authToken, setAuthToken] = useState("test-token");

  const handleStartCall = () => {
    setShowVideoCall(true);
  };

  const handleEndCall = () => {
    setShowVideoCall(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Video Call Test
        </h1>

        {!showVideoCall ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-4">
              Test Video Call Setup
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter channel name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Role
                </label>
                <select
                  value={userRole}
                  onChange={(e) =>
                    setUserRole(e.target.value as "patient" | "doctor")
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter user ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auth Token
                </label>
                <input
                  type="text"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter auth token"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleStartCall}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Start Video Call Test
                </button>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Instructions
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-blue-700">
                <li>
                  Make sure your Agora App ID is properly configured in .env
                </li>
                <li>
                  Open this page in two different browser tabs to test the call
                </li>
                <li>Use the same channel name in both tabs</li>
                <li>
                  Use different user roles (one patient, one doctor) in each tab
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <AgoraVideoCall
            channelName={channelName}
            appointmentId="test-appointment"
            userRole={userRole}
            userId={userId}
            authToken={authToken}
            onCallEnd={handleEndCall}
          />
        )}
      </div>
    </div>
  );
}
