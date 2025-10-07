"use client";

import { useState, useEffect } from "react";
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

  // 🔥 NEW: Agora-based incoming call polling (same as IncomingCallsDisplay)
  const checkForIncomingCalls = async () => {
    if (!userId || userRole !== "DOCTOR") {
      return; // Only doctors receive calls globally
    }

    try {
      const response = await fetch(
        `/api/agora/notify-incoming-call?doctorId=${encodeURIComponent(userId)}`
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
          setIncomingCall(modalCall);
        }
      }
    } catch (error) {
      console.error(
        "📞 GlobalIncomingCallHandler: Error checking calls:",
        error
      );
    }
  };

  // Set up polling for incoming calls (only for doctors)
  useEffect(() => {
    if (!isMounted || !userId || userRole !== "DOCTOR" || isPolling) {
      return;
    }

    console.log(
      "📞 GlobalIncomingCallHandler: Starting Agora polling for",
      userRole
    );
    setIsPolling(true);

    // Initial check
    checkForIncomingCalls();

    // Poll every 3 seconds for incoming calls
    const pollInterval = setInterval(checkForIncomingCalls, 3000);

    return () => {
      console.log("📞 GlobalIncomingCallHandler: Stopping Agora polling");
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [isMounted, userId, userRole, isPolling]);

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
            : isPolling
            ? `✅ Agora Global: ${userName} (${userRole})`
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
