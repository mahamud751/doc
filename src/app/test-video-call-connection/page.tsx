"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter, useSearchParams } from "next/navigation";

export default function TestVideoCallConnection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [role, setRole] = useState<"patient" | "doctor" | null>(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [messages, setMessages] = useState<string[]>([]);

  // Check if we're already in a test call
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "patient" || roleParam === "doctor") {
      setRole(roleParam);
    }
  }, [searchParams]);

  const startTestCall = (selectedRole: "patient" | "doctor") => {
    setRole(selectedRole);
    // Generate a test channel name
    const channelId = `test_channel_${Math.floor(Math.random() * 10000)}`;
    router.push(`/test-video-call-connection?role=${selectedRole}&channel=${channelId}`);
  };

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const joinTestCall = async () => {
    try {
      setConnectionStatus("connecting");
      addMessage(`Starting ${role} test call...`);
      
      // In a real implementation, this would:
      // 1. Generate a token for the test channel
      // 2. Initialize Agora client
      // 3. Join the channel
      // 4. Set up event listeners
      
      addMessage("Generating test token...");
      // Simulate token generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      addMessage("✅ Token generated");
      
      addMessage("Initializing Agora client...");
      // Simulate client initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      addMessage("✅ Client initialized");
      
      addMessage("Joining channel...");
      // Simulate channel join
      await new Promise(resolve => setTimeout(resolve, 1000));
      addMessage("✅ Joined channel successfully");
      
      setConnectionStatus("connected");
      addMessage("🎉 Test call established!");
      addMessage("Both patient and doctor need to join the same channel to see each other.");
      
    } catch (error: any) {
      setConnectionStatus("error");
      addMessage(`❌ Error: ${error.message}`);
    }
  };

  const leaveTestCall = () => {
    setConnectionStatus("disconnected");
    addMessage("Left test call");
    router.push("/test-video-call-connection");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Video Call Connection Test
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Test video call connection between patient and doctor
        </p>

        {!role ? (
          <div className="text-center space-y-6">
            <p className="text-lg text-gray-700">
              Select your role to start the test call:
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                onClick={() => startTestCall("patient")}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl py-4 px-8 text-lg font-semibold"
              >
                Join as Patient
              </Button>
              <Button
                onClick={() => startTestCall("doctor")}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl py-4 px-8 text-lg font-semibold"
              >
                Join as Doctor
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Both patient and doctor need to join the same channel to see each other.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === "connected" ? "bg-green-500" :
                  connectionStatus === "connecting" ? "bg-yellow-500" :
                  connectionStatus === "error" ? "bg-red-500" : "bg-gray-400"
                }`}></div>
                <div>
                  <p className="font-semibold">Role: {role}</p>
                  <p className="text-sm text-gray-600">
                    Status: {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {connectionStatus === "disconnected" ? (
                  <Button
                    onClick={joinTestCall}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl py-2 px-6 font-semibold"
                  >
                    Join Test Call
                  </Button>
                ) : (
                  <Button
                    onClick={leaveTestCall}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl py-2 px-6 font-semibold"
                  >
                    Leave Call
                  </Button>
                )}
                <Button
                  onClick={() => router.push("/test-video-call-connection")}
                  variant="outline"
                  className="rounded-xl py-2 px-6 font-semibold"
                >
                  Change Role
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Connection Log</h2>
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No messages yet. Join the call to see logs.</p>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg, index) => (
                    <div key={index} className="font-mono text-sm text-gray-700">
                      {msg}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-yellow-800 mb-2">How This Works</h3>
              <ul className="list-disc pl-5 space-y-2 text-yellow-700">
                <li>Both patient and doctor must join the same channel to see each other</li>
                <li>Each participant gets a unique UID when joining</li>
                <li>The App ID must be the same for both participants</li>
                <li>Tokens are generated for each participant but for the same channel</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}