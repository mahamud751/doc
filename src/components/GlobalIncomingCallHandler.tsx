"use client";

import { useState, useEffect, useCallback } from "react";
import IncomingCallModal, {
  IncomingCallData,
} from "@/components/IncomingCallModal";

// Define the Agora incoming call interface (same as IncomingCallsDisplay)
interface AgoraIncomingCall {
  callId: string;
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  appointmentId: string;
  channelName: string;
  timestamp: Date;
}

// Global component to show incoming call modals anywhere in the app
export default function GlobalIncomingCallHandler() {
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null
  );
  const [isPolling, setIsPolling] = useState(false);

  // Mount check for SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load user context
  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const loadUserContext = () => {
      if (typeof window === "undefined") {
        console.log("⚠️ GlobalIncomingCallHandler: Window not available (SSR)");
        return;
      }

      const storedUserId = localStorage.getItem("userId");
      const storedUserName = localStorage.getItem("userName");
      const storedUserRole = localStorage.getItem("userRole");

      console.log("✅ GlobalIncomingCallHandler: Loading user context", {
        storedUserId,
        storedUserName,
        storedUserRole,
      });

      if (storedUserId && storedUserName && storedUserRole) {
        setUserId(storedUserId);
        setUserName(storedUserName);
        setUserRole(storedUserRole);
        console.log(
          "✅ GlobalIncomingCallHandler: User context loaded successfully"
        );
      } else {
        console.log("⚠️ GlobalIncomingCallHandler: Missing user context");
      }
    };

    loadUserContext();

    // Listen for storage changes
    const handleStorageChange = () => {
      loadUserContext();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isMounted]);

  // 🔥 NEW: Agora-based incoming call polling AND call status tracking
  const checkForIncomingCalls = useCallback(async () => {
    if (!userId) {
      return; // Need user ID for any polling
    }

    try {
      // Different polling based on user role
      if (userRole === "DOCTOR") {
        // Doctors poll for incoming calls
        const response = await fetch(
          `/api/agora/notify-incoming-call?doctorId=${encodeURIComponent(
            userId
          )}`
        );

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.calls && data.calls.length > 0) {
            console.log(
              "📞 GlobalIncomingCallHandler: Found incoming calls",
              data.calls
            );

            // Show the first incoming call as modal
            const call = data.calls[0];
            const modalCall: IncomingCallData = {
              callId: call.callId,
              callerName: call.callerName,
              channelName: call.channelName,
              appointmentId: call.appointmentId,
            };

            console.log(
              "📞 GlobalIncomingCallHandler: Showing modal for call",
              modalCall
            );

            // Only set incoming call if we don't already have one
            setIncomingCall((prevCall) => {
              if (prevCall && prevCall.callId === modalCall.callId) {
                return prevCall; // Don't update if same call
              }
              // Also check if user is already in a video call
              if (window.location.pathname.includes("/video-call")) {
                console.log(
                  "📞 GlobalIncomingCallHandler: User already in video call, ignoring new call"
                );
                return prevCall;
              }
              // Check if modal is already open to prevent duplicates
              if (prevCall) {
                console.log(
                  "📞 GlobalIncomingCallHandler: Modal already open, ignoring new call"
                );
                return prevCall;
              }
              return modalCall;
            });
          }
        }
      } else if (userRole === "PATIENT") {
        // Patients poll for call status updates (like when doctor joins)
        const response = await fetch(
          `/api/agora/call-status?patientId=${encodeURIComponent(userId)}`
        );

        if (response.ok) {
          const data = await response.json();
          // Handle call status updates for patients (could update UI or show notifications)
          if (data.callUpdates && data.callUpdates.length > 0) {
            console.log(
              "📞 GlobalIncomingCallHandler: Patient call status updates",
              data.callUpdates
            );
            // Could dispatch events or update global state here
          }
        }
      }
    } catch (error) {
      console.error(
        "📞 GlobalIncomingCallHandler: Error checking calls/status:",
        error
      );
    }
  }, [userId, userRole]); // Dependencies memoized

  // Set up polling for incoming calls/status (for both doctors and patients)
  useEffect(() => {
    if (!isMounted || !userId || !userRole) {
      return;
    }

    console.log("📞 GlobalIncomingCallHandler: Starting polling for", userRole);
    setIsPolling(true);

    // Initial check
    checkForIncomingCalls();

    // Poll every 3 seconds - doctors for incoming calls, patients for status updates
    const pollInterval = setInterval(() => {
      checkForIncomingCalls();
    }, 3000);

    return () => {
      console.log("📞 GlobalIncomingCallHandler: Stopping polling");
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [isMounted, userId, userRole, checkForIncomingCalls]); // Added checkForIncomingCalls to dependencies

  // Handle modal close
  const handleModalClose = async () => {
    console.log("📴 GlobalIncomingCallHandler: Closing modal");

    if (incomingCall) {
      // Remove from API storage when closing
      try {
        await fetch(
          `/api/agora/notify-incoming-call?doctorId=${encodeURIComponent(
            userId
          )}&callId=${encodeURIComponent(incomingCall.callId)}`,
          { method: "DELETE" }
        );
      } catch (error) {
        console.error(
          "📞 GlobalIncomingCallHandler: Error removing call:",
          error
        );
      }
    }

    setIncomingCall(null);
  };

  // Don't render anything until mounted on client
  if (!isMounted) {
    return null;
  }

  console.log("🔄 GlobalIncomingCallHandler: Rendering", {
    hasIncomingCall: !!incomingCall,
    userId,
    userName,
    userRole,
    isMounted,
    isPolling,
  });

  return (
    <>
      {/* Status indicator */}
      {userId && (
        <div
          style={{
            position: "fixed",
            top: "10px",
            left: "10px",
            background: incomingCall ? "red" : isPolling ? "green" : "gray",
            padding: "5px 10px",
            borderRadius: "5px",
            fontSize: "12px",
            zIndex: 9999,
            color: "white",
          }}
        >
          {incomingCall
            ? `📞 INCOMING: ${incomingCall.callerName}`
            : isPolling && userRole === "DOCTOR"
            ? `✅ Agora Global: ${userName} (${userRole}) - Listening`
            : isPolling && userRole === "PATIENT"
            ? `✅ Agora Global: ${userName} (${userRole}) - Monitoring`
            : `⚠️ Agora Global: ${userName} (${userRole}) - Not Polling`}
        </div>
      )}

      {/* Incoming call modal */}
      {incomingCall && userId && userName && userRole && (
        <IncomingCallModal
          userId={userId}
          userName={userName}
          userRole={userRole}
          incomingCall={incomingCall}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}
