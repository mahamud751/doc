"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { callingService } from "@/lib/calling-service";

export default function ForceTestIncomingCall() {
  const [callLog, setCallLog] = useState<string[]>([]);
  const [incomingCall, setIncomingCall] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setCallLog((prev) => [...prev, `${timestamp}: ${message}`]);
  };

  useEffect(() => {
    // FORCE SET localStorage immediately
    const userData = {
      authToken: "test-force-token-123",
      userId: "force_test_doctor_456",
      userName: "Dr. Force Test",
      userRole: "DOCTOR"
    };

    Object.entries(userData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });

    // Dispatch multiple events to ensure GlobalIncomingCallHandler picks it up
    window.dispatchEvent(new Event("authStateChange"));
    window.dispatchEvent(new Event("storage"));
    
    addLog("🔥 FORCED localStorage data set");
    addLog("📢 Dispatched authStateChange and storage events");

    // Setup calling service listener
    callingService.onIncomingCall((call) => {
      addLog(`📞 INCOMING CALL RECEIVED: ${call.callerName}`);
      setIncomingCall(call);
    });

    return () => {
      callingService.offIncomingCall();
    };
  }, []);

  const forceIncomingCall = () => {
    addLog("🚀 FORCING INCOMING CALL TEST...");
    
    const mockCall = {
      callId: `force_test_${Date.now()}`,
      callerId: "test_patient_caller",
      callerName: "Test Patient Emergency",
      calleeId: "force_test_doctor_456", // Match localStorage userId
      calleeName: "Dr. Force Test",
      appointmentId: "emergency_appointment",
      channelName: "emergency_channel",
      status: "ringing" as const,
    };

    // DIRECTLY trigger the calling service
    const handleIncomingCall = (callingService as any).incomingCallCallback;
    if (handleIncomingCall) {
      addLog("✅ Directly calling incomingCallCallback");
      handleIncomingCall(mockCall);
    } else {
      addLog("❌ No incomingCallCallback found on calling service");
    }

    addLog(`📞 Force test call: ${mockCall.callId}`);
  };

  const acceptCall = () => {
    if (incomingCall) {
      addLog("✅ Call accepted!");
      setIncomingCall(null);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      addLog("❌ Call rejected!");
      setIncomingCall(null);
    }
  };

  const checkGlobalHandler = () => {
    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("userRole");
    const userName = localStorage.getItem("userName");
    const authToken = localStorage.getItem("authToken");

    addLog(`🔍 LocalStorage Check:`);
    addLog(`  - userId: ${userId}`);
    addLog(`  - userRole: ${userRole}`);
    addLog(`  - userName: ${userName}`);
    addLog(`  - authToken: ${authToken ? `${authToken.substring(0, 20)}...` : "null"}`);
    
    // Force another authStateChange event
    window.dispatchEvent(new Event("authStateChange"));
    addLog("📢 Dispatched another authStateChange event");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          🔥 Force Test Incoming Call System
        </h1>

        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-2 text-red-800">🚨 Emergency Test Mode</h2>
          <p className="text-red-700">
            This page forces localStorage data and directly tests the incoming call system 
            to bypass any race conditions.
          </p>
        </div>

        {/* Incoming Call Modal */}
        {incomingCall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
              <h2 className="text-2xl font-bold mb-4 text-center">📞 INCOMING CALL</h2>
              <div className="text-center mb-6">
                <div className="text-lg font-semibold mb-2">From: {incomingCall.callerName}</div>
                <div className="text-sm text-gray-600">Call ID: {incomingCall.callId}</div>
                <div className="text-sm text-gray-600">Channel: {incomingCall.channelName}</div>
              </div>
              <div className="flex space-x-4">
                <Button
                  onClick={acceptCall}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white text-lg py-3"
                >
                  ✅ Accept
                </Button>
                <Button
                  onClick={rejectCall}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-lg py-3"
                >
                  ❌ Reject
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Test Controls */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Test Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={forceIncomingCall}
              className="bg-red-500 hover:bg-red-600 text-white py-3"
            >
              🚀 Force Incoming Call
            </Button>
            <Button
              onClick={checkGlobalHandler}
              className="bg-blue-500 hover:bg-blue-600 text-white py-3"
            >
              🔍 Check Global Handler
            </Button>
            <Button
              onClick={() => {
                setCallLog([]);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white py-3"
            >
              🗑️ Clear Log
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">🎯 Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Page automatically sets localStorage with test doctor user</li>
            <li>Click "🔍 Check Global Handler" to verify localStorage</li>
            <li>Check console for "GlobalIncomingCallHandler: User context set"</li>
            <li>Click "🚀 Force Incoming Call" to directly trigger incoming call</li>
            <li><strong>Expected Result:</strong> Incoming call modal should appear immediately!</li>
          </ol>
          <p className="mt-3 text-sm font-semibold text-yellow-800">
            If this test works, the LocalStorage race condition is fixed!
          </p>
        </div>

        {/* Call Log */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">📋 Test Log</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
            {callLog.length === 0 ? (
              <p className="text-gray-500">No events yet...</p>
            ) : (
              callLog.map((log, index) => (
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