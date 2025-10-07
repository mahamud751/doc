"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { callingService } from "@/lib/calling-service";

export default function QuickCallTest() {
  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [testResult, setTestResult] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserId(localStorage.getItem("userId") || "");
      setUserRole(localStorage.getItem("userRole") || "");
    }
  }, []);

  const testPatientCallDoctor = async () => {
    if (userRole === "PATIENT") {
      setTestResult("Testing patient calling doctor...");
      try {
        // Simulate the exact same call flow that patients use
        const call = await callingService.initiateCall(
          {
            calleeId: "cmgh0qpqi0000iqpbzis9po2t", // Hardcoded doctor ID from logs
            calleeName: "Dr. aminul",
            appointmentId: `quick_test_${Date.now()}`,
            channelName: `quick_test_channel_${Date.now()}`,
          },
          userId,
          localStorage.getItem("userName") || "Test Patient"
        );

        setTestResult(`✅ SUCCESS: Call initiated! Call ID: ${call.callId}`);
        console.log("Quick test call initiated:", call);
      } catch (error) {
        setTestResult(`❌ FAILED: ${error}`);
        console.error("Quick test failed:", error);
      }
    } else {
      setTestResult(
        "❌ This test is only for patients. Please login as a patient."
      );
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        background: "white",
        border: "2px solid #e2e8f0",
        borderRadius: "10px",
        padding: "20px",
        zIndex: 10000,
        maxWidth: "400px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0", color: "#1a202c" }}>
        🧪 Quick Call Test
      </h3>
      <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#4a5568" }}>
        User: {userId || "Not logged in"} ({userRole || "Unknown"})
      </p>
      <Button
        onClick={testPatientCallDoctor}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
        disabled={!userId || userRole !== "PATIENT"}
      >
        📞 Test Patient → Doctor Call
      </Button>
      {testResult && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "#f7fafc",
            borderRadius: "5px",
            fontSize: "12px",
          }}
        >
          {testResult}
        </div>
      )}
    </div>
  );
}
