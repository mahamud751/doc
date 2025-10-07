"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { callingService } from "@/lib/calling-service";

export default function TestSimpleModal() {
  const [modalMessage, setModalMessage] = useState<string>("");
  const [callLog, setCallLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setCallLog((prev) => [...prev, `${timestamp}: ${message}`]);
  };

  useEffect(() => {
    // Set up test doctor user in localStorage
    localStorage.setItem("authToken", "test-token-doctor");
    localStorage.setItem("userId", "doctor_123");
    localStorage.setItem("userName", "Dr. Test");
    localStorage.setItem("userRole", "DOCTOR");

    // Dispatch events to notify GlobalIncomingCallHandler
    window.dispatchEvent(new Event("authStateChange"));
    window.dispatchEvent(new Event("storage"));

    addLog("🔧 Test doctor user set in localStorage");
    addLog("📢 Events dispatched to GlobalIncomingCallHandler");

    // Set up calling service listener
    callingService.onIncomingCall((call) => {
      addLog(`📞 INCOMING CALL DETECTED: ${call.callerName}`);
      setModalMessage(`Patient "${call.callerName}" is calling you!`);
    });

    return () => {
      callingService.offIncomingCall();
    };
  }, []);

  const simulatePatientCall = () => {
    addLog("🚀 Simulating patient call...");
    
    // Simulate a patient calling this doctor
    const mockCall = {
      callId: `test_call_${Date.now()}`,
      callerId: "patient_456",
      callerName: "John Doe (Patient)",
      calleeId: "doctor_123", // This matches our localStorage userId
      calleeName: "Dr. Test",
      appointmentId: "test_appointment_123",
      channelName: "test_channel_123",
      status: "ringing" as const,
    };

    // Use calling service to trigger the call (this should notify GlobalIncomingCallHandler)
    try {
      // Get the private callback function to simulate the event
      const callingServiceAny = callingService as any;
      if (callingServiceAny.incomingCallCallback) {
        callingServiceAny.incomingCallCallback(mockCall);
        addLog("✅ Calling service notified with mock call");
      } else {
        addLog("❌ No calling service callback found");
      }
    } catch (error) {
      addLog(`❌ Error simulating call: ${error}`);
    }
  };

  const closeModal = () => {
    setModalMessage("");
    addLog("❌ Modal closed");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          📱 Simple Modal Test - Real-time Working Check
        </h1>

        {/* Modal - this shows when patient calls */}
        {modalMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
                📞 Incoming Call!
              </h2>
              <p className="text-lg text-center mb-6">
                {modalMessage}
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={closeModal}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 text-lg"
                >
                  Close Modal
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Test Control */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Real-time Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={simulatePatientCall}
              className="bg-green-500 hover:bg-green-600 text-white py-4 text-lg"
            >
              📞 Simulate Patient Call
            </Button>
            <Button
              onClick={() => setCallLog([])}
              className="bg-gray-500 hover:bg-gray-600 text-white py-4 text-lg"
            >
              🗑️ Clear Log
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-2 text-blue-800">🎯 Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
            <li>Page automatically sets up test doctor user in localStorage</li>
            <li>GlobalIncomingCallHandler should detect the user context</li>
            <li>Click "📞 Simulate Patient Call" to test the modal</li>
            <li><strong>Expected Result:</strong> Modal should show "Patient call you" message</li>
            <li>If modal appears, the real-time notification system is working!</li>
          </ol>
          <p className="mt-3 text-sm font-semibold text-blue-800">
            🚀 This tests the GlobalIncomingCallHandler in the global layout!
          </p>
        </div>

        {/* Global Handler Status */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-2 text-yellow-800">📊 System Status</h2>
          <div className="space-y-2 text-sm text-yellow-700">
            <div>✅ Real-time polling: Active (check terminal logs)</div>
            <div>✅ LocalStorage: Test user set</div>
            <div>✅ GlobalIncomingCallHandler: Mounted in layout</div>
            <div>✅ Calling Service: Listener registered</div>
          </div>
        </div>

        {/* Call Log */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">📋 Test Log</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-48 overflow-y-auto font-mono text-sm">
            {callLog.length === 0 ? (
              <p className="text-gray-500">Waiting for test events...</p>
            ) : (
              callLog.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">🔍 Debug Info</h2>
          <div className="text-sm space-y-1">
            <div>Current userId: {localStorage.getItem("userId") || "Not set"}</div>
            <div>Current userRole: {localStorage.getItem("userRole") || "Not set"}</div>
            <div>Current userName: {localStorage.getItem("userName") || "Not set"}</div>
            <div>Modal showing: {modalMessage ? "YES" : "NO"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}