"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { callingService, ActiveCall } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";

export default function TestCallPage() {
  const [userId, setUserId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [targetUserName, setTargetUserName] = useState("");
  const [outgoingCall, setOutgoingCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<ActiveCall | null>(null);
  const [status, setStatus] = useState("Not connected");

  useEffect(() => {
    // Initialize with test values
    const testUserId = `user_${Math.floor(Math.random() * 1000)}`;
    const testUserName = `User ${Math.floor(Math.random() * 1000)}`;
    setUserId(testUserId);
    setUserName(testUserName);

    // Connect to socket
    const token = "test-token";
    socketClient.connect(token);

    // Set up listeners
    callingService.onIncomingCall((call) => {
      setIncomingCall(call);
      setStatus("Incoming call");
    });

    callingService.onCallResponse((response) => {
      if (response.accepted) {
        setStatus("Call accepted");
        setOutgoingCall(null);
      } else {
        setStatus("Call rejected");
        setOutgoingCall(null);
      }
    });

    callingService.onCallEnded((callId) => {
      setStatus("Call ended");
      setOutgoingCall(null);
      setIncomingCall(null);
    });

    return () => {
      socketClient.disconnect();
    };
  }, []);

  const handleCall = async () => {
    if (!targetUserId || !targetUserName) {
      alert("Please enter target user ID and name");
      return;
    }

    const call = await callingService.initiateCall(
      {
        calleeId: targetUserId,
        calleeName: targetUserName,
        appointmentId: "test-appointment",
        channelName: "test-channel",
      },
      userId,
      userName
    );

    setOutgoingCall(call);
    setStatus("Calling...");
  };

  const handleAccept = () => {
    if (incomingCall) {
      callingService.acceptCall(incomingCall.callId, userId);
      setIncomingCall(null);
      setStatus("Call accepted");
    }
  };

  const handleReject = () => {
    if (incomingCall) {
      callingService.rejectCall(incomingCall.callId, userId);
      setIncomingCall(null);
      setStatus("Call rejected");
    }
  };

  const handleEndCall = () => {
    if (outgoingCall) {
      callingService.endCall(outgoingCall.callId);
      setOutgoingCall(null);
      setStatus("Call ended");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Test Calling System
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">User Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Your User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Target User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target User ID
                </label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target Name
                </label>
                <input
                  type="text"
                  value={targetUserName}
                  onChange={(e) => setTargetUserName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Status: {status}</h2>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleCall}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Call Target User
            </Button>

            {outgoingCall && (
              <Button
                onClick={handleEndCall}
                className="bg-red-500 hover:bg-red-600"
              >
                Cancel Call
              </Button>
            )}

            {incomingCall && (
              <>
                <Button
                  onClick={handleAccept}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Accept Call
                </Button>
                <Button
                  onClick={handleReject}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Reject Call
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 bg-purple-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Current Calls</h2>
          <div className="space-y-4">
            {outgoingCall && (
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium">Outgoing Call</h3>
                <p>Call ID: {outgoingCall.callId}</p>
                <p>
                  To: {outgoingCall.calleeName} ({outgoingCall.calleeId})
                </p>
              </div>
            )}

            {incomingCall && (
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium">Incoming Call</h3>
                <p>Call ID: {incomingCall.callId}</p>
                <p>
                  From: {incomingCall.callerName} ({incomingCall.callerId})
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
