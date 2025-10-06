"use client";

import { useState, useEffect } from "react";
import { callingService, ActiveCall } from "@/lib/calling-service";
import { socketClient } from "@/lib/socket-client";
import IncomingCallModal from "@/components/IncomingCallModal";

export default function GlobalIncomingCallHandler() {
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [incomingCall, setIncomingCall] = useState<ActiveCall | null>(null);

  // Get user info from localStorage
  useEffect(() => {
    const fetchUserInfo = () => {
      try {
        const token = localStorage.getItem("authToken");
        const storedUserId = localStorage.getItem("userId");
        const storedUserName = localStorage.getItem("userName");
        const userRole = localStorage.getItem("userRole");

        console.log(
          "GlobalIncomingCallHandler: Fetching user info from localStorage",
          {
            token,
            storedUserId,
            storedUserName,
            userRole,
          }
        );

        if (token && storedUserId && storedUserName) {
          setUserId(storedUserId);
          setUserName(storedUserName);
          console.log(
            "GlobalIncomingCallHandler: User info set from localStorage",
            {
              userId: storedUserId,
              userName: storedUserName,
            }
          );
        }
      } catch (error) {
        console.error(
          "GlobalIncomingCallHandler: Error fetching user info:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();

    // Also listen for storage changes in case user logs in/out
    const handleStorageChange = (e: StorageEvent) => {
      console.log("GlobalIncomingCallHandler: Storage change event", e);
      if (e.key === "authToken" || e.key === "userId" || e.key === "userName") {
        fetchUserInfo();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Initialize socket connection and set up calling service listeners
  useEffect(() => {
    console.log("GlobalIncomingCallHandler: User effect triggered", {
      userId,
      userName,
      isLoading,
    });

    // For testing purposes, if we don't have user info from localStorage,
    // check if we're in a test environment
    if (!userId || !userName) {
      // In test environments, we might want to use dummy values
      // But only if we're not in production and localStorage is empty
      const isTestEnv =
        typeof window !== "undefined" &&
        window.location.hostname === "localhost";
      if (isTestEnv) {
        console.log(
          "GlobalIncomingCallHandler: Test environment detected, but no user info"
        );
      }
      return;
    }

    const token = localStorage.getItem("authToken");
    if (token) {
      console.log(
        "GlobalIncomingCallHandler: Setting up socket and listeners",
        { token, userId, userName }
      );

      // Connect socket if not already connected, with userId
      if (!socketClient.isConnected()) {
        socketClient.connect(token, userId);
      } else {
        // Update the userId in socketClient if it's already connected
        socketClient.connect(token, userId);
      }

      // Set up listener for incoming calls
      const handleIncomingCall = (call: ActiveCall) => {
        console.log("GlobalIncomingCallHandler: Received incoming call", call);
        console.log("GlobalIncomingCallHandler: Current user info", {
          userId,
          userName,
        });
        console.log("GlobalIncomingCallHandler: Call info", {
          calleeId: call.calleeId,
          callerId: call.callerId,
          isCallee: call.calleeId === userId,
        });

        // Only set incoming call if this user is the callee
        if (call.calleeId === userId) {
          console.log(
            "GlobalIncomingCallHandler: Setting incoming call for user"
          );
          setIncomingCall(call);
        } else {
          console.log(
            "GlobalIncomingCallHandler: This call is not for this user"
          );
        }
      };

      callingService.onIncomingCall(handleIncomingCall);

      // Set up listener for call responses
      const handleCallResponse = (response: any) => {
        console.log(
          "GlobalIncomingCallHandler: Received call response",
          response
        );
      };

      callingService.onCallResponse(handleCallResponse);

      // Set up listener for call ended
      const handleCallEnded = (callId: string) => {
        console.log("GlobalIncomingCallHandler: Received call ended", callId);
        // Clear incoming call if it matches
        if (incomingCall && incomingCall.callId === callId) {
          setIncomingCall(null);
        }
      };

      callingService.onCallEnded(handleCallEnded);

      // Cleanup function to remove listeners
      return () => {
        console.log("GlobalIncomingCallHandler: Cleaning up listeners");
        callingService.offIncomingCall();
        callingService.offCallResponse();
        callingService.offCallEnded();
        setIncomingCall(null); // Clear incoming call on cleanup
      };
    }
  }, [userId, userName, incomingCall]); // Add incomingCall to dependencies

  console.log("GlobalIncomingCallHandler: Rendering", {
    isLoading,
    userId,
    userName,
    incomingCall,
  });

  if (isLoading) {
    console.log("GlobalIncomingCallHandler: Still loading");
    return null;
  }

  if (!userId || !userName) {
    console.log("GlobalIncomingCallHandler: No user info, returning null");
    return null;
  }

  // Only render the modal if there's an incoming call
  console.log("GlobalIncomingCallHandler: Checking if modal should be shown", {
    hasIncomingCall: !!incomingCall,
  });
  return incomingCall ? (
    <IncomingCallModal
      userId={userId}
      userName={userName}
      incomingCall={incomingCall} // Pass the incoming call to the modal
    />
  ) : null;
}
