"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { callingService } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";
import { Phone, Users, Video } from "lucide-react";

export default function VideoCallTestPage() {
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("Not connected");
  const [logs, setLogs] = useState<string[]>([]);
  const [agoraConfigured, setAgoraConfigured] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    fetch("/api/agora/test-connection")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAgoraConfigured(true);
          addLog("✅ Agora configuration is valid");
        } else {
          addLog(`❌ Agora error: ${data.error}`);
        }
      })
      .catch((err) => addLog(`❌ Config check failed: ${err.message}`));
  }, []);

  const setupUser = (role: "doctor" | "patient") => {
    const newUserId = role === "doctor" ? "doctor_001" : "patient_001";
    setUserId(newUserId);

    localStorage.setItem("authToken", "test_token_123");
    localStorage.setItem("userId", newUserId);
    localStorage.setItem(
      "userName",
      role === "doctor" ? "Dr. Smith" : "John Doe"
    );
    localStorage.setItem("userRole", role);

    socketClient.connect("test_token_123", newUserId, role);
    setStatus(`Connected as ${role}`);
    addLog(`🎭 Set up as ${role}: ${newUserId}`);

    callingService.onIncomingCall((call) => {
      addLog(`📞 Incoming call from ${call.callerName}`);
    });
  };

  const testTokenGeneration = async () => {
    try {
      addLog("🔑 Testing token generation...");
      const response = await fetch("/api/agora/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test_token_123",
        },
        body: JSON.stringify({
          channelName: "test_channel",
          uid: 12345,
          role: "publisher",
        }),
      });

      if (response.ok) {
        const tokenData = await response.json();
        addLog(`✅ Token generated successfully`);
        addLog(`📋 Token: ${tokenData.token?.substring(0, 20)}...`);
      } else {
        const errorData = await response.json();
        addLog(`❌ Token failed: ${errorData.error}`);
      }
    } catch (error) {
      addLog(
        `❌ Token test failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const initiateCall = async () => {
    if (!userId) {
      addLog("❌ User not set up");
      return;
    }

    const targetUserId = userId === "doctor_001" ? "patient_001" : "doctor_001";

    try {
      const channelName = `call_${Date.now()}_${userId}_${targetUserId}`;

      addLog(`📞 Initiating call to ${targetUserId}...`);
      addLog(`📺 Channel: ${channelName}`);

      const call = await callingService.initiateCall(
        {
          calleeId: targetUserId,
          calleeName: userId === "doctor_001" ? "John Doe" : "Dr. Smith",
          appointmentId: `apt_${Date.now()}`,
          channelName: channelName,
        },
        userId,
        userId === "doctor_001" ? "Dr. Smith" : "John Doe"
      );

      addLog(`✅ Call initiated successfully`);
      addLog(`📋 Call ID: ${call.callId}`);
      addLog(`⏳ Waiting for ${targetUserId} to accept the call...`);
      setStatus("Call initiated - waiting for response");
    } catch (error) {
      addLog(
        `❌ Failed to initiate call: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const simulateAcceptCall = () => {
    if (!userId) {
      addLog("❌ User not set up");
      return;
    }

    addLog(`✅ Simulating call acceptance by ${userId}`);
    addLog(`🎥 Opening video call for both users...`);

    openVideoCall();

    addLog(`💡 Other user should also click 'Open Video Call' to connect`);
  };

  const openVideoCall = () => {
    const uid = Math.floor(Math.random() * 1000000);
    const channelName = `test_channel_${Date.now()}`;

    const appId =
      process.env.NEXT_PUBLIC_AGORA_APP_ID ||
      "0ad1df7f5f9241e7bdccc8324d516f27";

    const videoCallUrl =
      userId === "doctor_001"
        ? `/doctor/video-call?channel=${encodeURIComponent(
            channelName
          )}&uid=${uid}&appId=${appId}`
        : `/patient/video-call?channel=${encodeURIComponent(
            channelName
          )}&uid=${uid}&appId=${appId}`;

    addLog(`🎥 Opening video call: ${videoCallUrl}`);
    window.open(videoCallUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Video className="mr-3 text-blue-600" />
            Video Call System Test
          </h1>

          <div className="mb-6">
            <div
              className={`p-4 rounded-lg border-2 ${
                agoraConfigured
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <h3 className="font-semibold">Agora Configuration</h3>
              <p className="text-sm text-gray-600">
                {agoraConfigured ? "Valid" : "Invalid"}
              </p>
            </div>
          </div>

          {!userId && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Choose User Role</h3>
              <div className="flex space-x-4">
                <Button
                  onClick={() => setupUser("doctor")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  👨‍⚕️ Setup as Doctor
                </Button>
                <Button
                  onClick={() => setupUser("patient")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  🤒 Setup as Patient
                </Button>
              </div>
            </div>
          )}

          {userId && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Test Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={testTokenGeneration}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  🔑 Test Token Generation
                </Button>
                <Button
                  onClick={initiateCall}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Initiate Call
                </Button>
                <Button
                  onClick={simulateAcceptCall}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  ✅ Accept Call & Open Video
                </Button>
                <Button
                  onClick={openVideoCall}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  🎥 Open Video Call
                </Button>
                <Button
                  onClick={() => {
                    setUserId("");
                    setStatus("Not connected");
                    localStorage.clear();
                    socketClient.disconnect();
                    addLog("🔄 Reset user session");
                  }}
                  variant="outline"
                >
                  🔄 Reset
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">System Logs</h2>
          <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
