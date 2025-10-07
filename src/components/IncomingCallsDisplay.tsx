"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { agoraCallingService } from "@/lib/agora-calling-service";
import { callNotifications } from "@/lib/call-notifications";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Phone, PhoneOff, User, Clock } from "lucide-react";

interface IncomingCallsDisplayProps {
  userRole: string;
}

// Updated interface for Agora-only calls
interface AgoraIncomingCall {
  callId: string;
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  channelName: string;
  appointmentId: string;
  timestamp?: Date;
}

export default function IncomingCallsDisplay({
  userRole,
}: IncomingCallsDisplayProps) {
  const [incomingCalls, setIncomingCalls] = useState<AgoraIncomingCall[]>([]);
  const [callHistory, setCallHistory] = useState<
    { call: AgoraIncomingCall; timestamp: Date; status: string }[]
  >([]);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  // Polling function to check for incoming calls
  const checkForIncomingCalls = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId || userRole !== "DOCTOR") {
        return;
      }

      const response = await fetch(
        `/api/agora/notify-incoming-call?doctorId=${encodeURIComponent(userId)}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.calls && data.calls.length > 0) {
          console.log(
            "📞 IncomingCallsDisplay: Found incoming calls",
            data.calls
          );

          // Update incoming calls (avoid duplicates)
          setIncomingCalls((prev) => {
            const newCalls = data.calls.filter(
              (newCall: AgoraIncomingCall) =>
                !prev.find(
                  (existingCall) => existingCall.callId === newCall.callId
                )
            );

            // Add to history
            newCalls.forEach((call: AgoraIncomingCall) => {
              setCallHistory((prevHistory) => [
                { call, timestamp: new Date(), status: "Incoming" },
                ...prevHistory.slice(0, 9), // Keep only last 10
              ]);
            });

            return [...prev, ...newCalls];
          });
        }
      }
    } catch (error) {
      console.error(
        "📞 IncomingCallsDisplay: Error checking for calls:",
        error
      );
    }
  };

  // Set up polling for incoming calls
  useEffect(() => {
    console.log(
      "📞 IncomingCallsDisplay: Setting up Agora polling for",
      userRole
    );

    if (userRole !== "DOCTOR") {
      console.log("📞 IncomingCallsDisplay: Not a doctor, skipping polling");
      return;
    }

    // Initial check
    checkForIncomingCalls();

    // Poll every 2 seconds for incoming calls
    const pollInterval = setInterval(checkForIncomingCalls, 2000);

    // Add manual test button for doctors
    const addManualTestCall = () => {
      const testCall: AgoraIncomingCall = {
        callId: `manual_test_${Date.now()}`,
        callerId: "test_patient_456",
        callerName: "Manual Test Patient",
        calleeId: localStorage.getItem("userId") || "unknown",
        calleeName: localStorage.getItem("userName") || "Unknown Doctor",
        appointmentId: "manual_test_appointment",
        channelName: `manual_test_channel_${Date.now()}`,
        timestamp: new Date(),
      };

      console.log("🎆 IncomingCallsDisplay: Adding manual test call", testCall);
      setIncomingCalls((prev) => [...prev, testCall]);
      setCallHistory((prev) => [
        { call: testCall, timestamp: new Date(), status: "Manual Test" },
        ...prev.slice(0, 9),
      ]);
    };

    // Add test button for development
    if (typeof window !== "undefined") {
      let testBtn = document.getElementById("agora-test-call");
      if (!testBtn) {
        testBtn = document.createElement("button");
        testBtn.id = "agora-test-call";
        testBtn.innerHTML = "👩‍⚕️ AGORA TEST CALL";
        testBtn.style.cssText = `
          position: fixed; 
          top: 160px; 
          right: 10px; 
          z-index: 10000; 
          background: #16a34a; 
          color: white; 
          padding: 10px; 
          border: none; 
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
        `;
        testBtn.onclick = addManualTestCall;
        document.body.appendChild(testBtn);
      }
    }

    return () => {
      console.log("📞 IncomingCallsDisplay: Cleaning up Agora polling");
      clearInterval(pollInterval);

      // Remove test button
      const testBtn = document.getElementById("agora-test-call");
      if (testBtn) {
        testBtn.remove();
      }
    };
  }, [userRole]); // Only depend on userRole

  const acceptCall = async (call: AgoraIncomingCall) => {
    try {
      console.log("✅ DOCTOR: Accepting Agora call:", call.callId);
      const userId = localStorage.getItem("userId");
      const userName = localStorage.getItem("userName");
      const authToken = localStorage.getItem("authToken");

      if (!userId || !userName) {
        console.error("No user ID/name found in localStorage");
        return;
      }

      if (!authToken) {
        console.error("No auth token found");
        return;
      }

      // 🔥 CRITICAL FIX: Generate doctor's token for the EXACT same channel the patient is using
      console.log(
        "🎥 DOCTOR: Generating token for exact channel:",
        call.channelName
      );

      const doctorUid = Math.floor(Math.random() * 1000000);
      const response = await fetch("/api/agora/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          channelName: call.channelName, // Use EXACT channel name from patient
          uid: doctorUid,
          role: "DOCTOR",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: Failed to generate token`
        );
      }

      const tokenData = await response.json();
      console.log("✅ DOCTOR: Token generated for channel:", call.channelName);

      // 🔥 CRITICAL: Create doctor's video call URL with SAME channel as patient
      const doctorCallUrl = `/doctor/video-call?channel=${encodeURIComponent(
        call.channelName
      )}&token=${encodeURIComponent(
        tokenData.token
      )}&uid=${doctorUid}&appId=${encodeURIComponent(
        tokenData.appId
      )}&appointmentId=${encodeURIComponent(
        call.appointmentId
      )}&callId=${encodeURIComponent(call.callId)}`;

      console.log(
        "✅ DOCTOR: Generated video call URL for same channel as patient:",
        {
          channel: call.channelName,
          doctorUid,
          url: doctorCallUrl.substring(0, 100) + "...",
        }
      );

      // Notify about call acceptance
      callNotifications.notifyCallJoined(call.appointmentId, userName);

      // Remove from active calls
      setIncomingCalls((prev) => prev.filter((c) => c.callId !== call.callId));

      // Remove from API storage
      await fetch(
        `/api/agora/notify-incoming-call?doctorId=${encodeURIComponent(
          userId
        )}&callId=${encodeURIComponent(call.callId)}`,
        { method: "DELETE" }
      );

      // Update call history
      setCallHistory((prev) =>
        prev.map((item) =>
          item.call.callId === call.callId
            ? { ...item, status: "Accepted" }
            : item
        )
      );

      // 🔥 CRITICAL: Open video call with EXACT same channel
      console.log(
        "🚀 DOCTOR: Opening video call window with same channel as patient"
      );
      const newWindow = window.open(doctorCallUrl, "_blank");
      if (!newWindow) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      console.log(
        "✅ DOCTOR: Should now connect to patient in channel:",
        call.channelName
      );
    } catch (error) {
      console.error("❌ DOCTOR: Error accepting call:", error);
      alert(
        `Failed to accept call: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const rejectCall = async (call: AgoraIncomingCall) => {
    try {
      console.log("❌ Rejecting Agora call:", call.callId);
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.error("No user ID found in localStorage");
        return;
      }

      // Notify about call rejection
      callNotifications.notifyCallEnded(call.appointmentId, "Call rejected");

      // Remove from active calls
      setIncomingCalls((prev) => prev.filter((c) => c.callId !== call.callId));

      // Remove from API storage
      await fetch(
        `/api/agora/notify-incoming-call?doctorId=${encodeURIComponent(
          userId
        )}&callId=${encodeURIComponent(call.callId)}`,
        { method: "DELETE" }
      );

      // Update call history
      setCallHistory((prev) =>
        prev.map((item) =>
          item.call.callId === call.callId
            ? { ...item, status: "Rejected" }
            : item
        )
      );
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Incoming Calls */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
            <Phone className="h-6 w-6 mr-2 text-green-600" />
            Incoming Calls
            {incomingCalls.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                {incomingCalls.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <AnimatePresence>
            {incomingCalls.length > 0 ? (
              <div className="space-y-4">
                {incomingCalls.map((call) => (
                  <motion.div
                    key={call.callId}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-16 h-16 flex items-center justify-center text-white font-bold text-xl mr-4 animate-pulse">
                          {call.callerName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-xl">
                            📞 {call.callerName} is calling you!
                          </h3>
                          <p className="text-gray-600">
                            {userRole === "DOCTOR" ? "Patient" : "Doctor"} wants
                            to start a video call
                          </p>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Clock className="h-4 w-4 mr-1" />
                            Just now
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            onClick={() => acceptCall(call)}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full shadow-lg"
                          >
                            <Phone className="h-5 w-5 mr-2" />
                            Accept
                          </Button>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            onClick={() => rejectCall(call)}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full shadow-lg"
                          >
                            <PhoneOff className="h-5 w-5 mr-2" />
                            Reject
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Phone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No incoming calls</p>
                <p className="text-gray-500 text-sm mt-2">
                  When {userRole === "DOCTOR" ? "patients" : "doctors"} call
                  you, they'll appear here
                </p>
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Call History */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
            <Clock className="h-6 w-6 mr-2 text-blue-600" />
            Recent Call Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {callHistory.length > 0 ? (
            <div className="space-y-3">
              {callHistory.map((item, index) => (
                <motion.div
                  key={`${item.call.callId}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center">
                    <div className="bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center text-gray-700 font-bold mr-3">
                      {item.call.callerName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.call.callerName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.status === "Accepted"
                        ? "bg-green-100 text-green-800"
                        : item.status === "Rejected"
                        ? "bg-red-100 text-red-800"
                        : item.status === "Ended"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
