// src/lib/calling-service.ts

import { socketClient } from "@/lib/socket-client";

// Define types for calling functionality
export interface CallData {
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  appointmentId: string;
  channelName: string;
}

export interface CallResponse {
  accepted: boolean;
  callerId: string;
  calleeId: string;
  appointmentId: string;
}

export interface ActiveCall {
  callId: string;
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  appointmentId: string;
  channelName: string;
  status: "ringing" | "accepted" | "rejected" | "ended";
  startTime?: Date;
}

class CallingService {
  private static instance: CallingService;
  private activeCalls: Map<string, ActiveCall> = new Map();
  private incomingCallCallback: ((call: ActiveCall) => void) | null = null;
  private callResponseCallback: ((response: CallResponse) => void) | null =
    null;
  private callEndedCallback: ((callId: string) => void) | null = null;

  private constructor() {
    this.setupSocketListeners();
  }

  public static getInstance(): CallingService {
    if (!CallingService.instance) {
      CallingService.instance = new CallingService();
    }
    return CallingService.instance;
  }

  private setupSocketListeners() {
    // Listen for incoming calls - this is what the target user receives
    socketClient.on<ActiveCall>("incoming-call", (callData) => {
      console.log("=== CALLING SERVICE: Received incoming call ===", callData);

      // Store the incoming call
      this.activeCalls.set(callData.callId, {
        ...callData,
        status: "ringing",
      });

      // Notify UI about incoming call
      if (this.incomingCallCallback) {
        console.log("=== CALLING SERVICE: Calling incomingCallCallback ===");
        this.incomingCallCallback(callData);
      } else {
        console.log(
          "=== CALLING SERVICE: No incomingCallCallback registered ==="
        );
      }
    });

    // Listen for call responses
    socketClient.on<CallResponse>("call-response", (response) => {
      console.log("=== CALLING SERVICE: Received call response ===", response);

      // Notify UI about call response
      if (this.callResponseCallback) {
        this.callResponseCallback(response);
      }
    });

    // Listen for call ended notifications
    socketClient.on<string>("call-ended", (callId) => {
      console.log("=== CALLING SERVICE: Call ended ===", callId);

      // Remove call from active calls
      this.activeCalls.delete(callId);

      // Notify UI about call ended
      if (this.callEndedCallback) {
        this.callEndedCallback(callId);
      }
    });

    // 🚨 CRITICAL FIX: Bridge real-time events to calling service
    // This is the missing link that prevents real patient calls from showing modals
    console.log("🔗 CALLING SERVICE: Setting up real-time event bridge");

    // Also listen for "initiate-call" events (what patients send)
    socketClient.on<ActiveCall>("initiate-call", (callData) => {
      console.log(
        "🔗 CALLING SERVICE: Received initiate-call event ===",
        callData
      );

      // Check if this call is for the current user
      const currentUserId = localStorage.getItem("userId");
      console.log("🔗 CALLING SERVICE: Current user ID:", currentUserId);
      console.log("🔗 CALLING SERVICE: Call target ID:", callData.calleeId);

      if (callData.calleeId !== currentUserId) {
        console.log("🔗 CALLING SERVICE: Call not for current user, ignoring");
        return;
      }

      console.log("🔗 CALLING SERVICE: ✅ This call IS for the current user!");

      // Convert initiate-call to incoming-call for the target user
      const incomingCall: ActiveCall = {
        callId:
          callData.callId ||
          `call_${Date.now()}_${callData.callerId}_${callData.calleeId}`,
        callerId: callData.callerId,
        callerName: callData.callerName,
        calleeId: callData.calleeId,
        calleeName: callData.calleeName,
        appointmentId: callData.appointmentId,
        channelName: callData.channelName,
        status: "ringing",
      };

      console.log(
        "🔗 CALLING SERVICE: Converted to incoming call:",
        incomingCall
      );

      // Store the incoming call
      this.activeCalls.set(incomingCall.callId, incomingCall);

      // 🚨 CRITICAL: Force trigger the incoming call callback
      if (this.incomingCallCallback) {
        console.log(
          "🔗 CALLING SERVICE: 🚨 TRIGGERING INCOMING CALL CALLBACK 🚨"
        );
        // Use setTimeout to ensure it runs after current execution
        setTimeout(() => {
          if (this.incomingCallCallback) {
            console.log("🔗 CALLING SERVICE: 🚨 CALLBACK EXECUTING NOW 🚨");
            this.incomingCallCallback(incomingCall);
          } else {
            console.error("🔗 CALLING SERVICE: ❌ CALLBACK WAS REMOVED!");
          }
        }, 50);
      } else {
        console.error(
          "🔗 CALLING SERVICE: ❌ NO INCOMING CALL CALLBACK REGISTERED!"
        );
        console.error("🔗 CALLING SERVICE: Available callbacks:", {
          incomingCallCallback: !!this.incomingCallCallback,
          callResponseCallback: !!this.callResponseCallback,
          callEndedCallback: !!this.callEndedCallback,
        });
      }
    });
  }

  // Set callback for incoming calls
  public onIncomingCall(callback: (call: ActiveCall) => void) {
    console.log("=== CALLING SERVICE: Setting incoming call callback ===");
    this.incomingCallCallback = callback;
  }

  // Remove callback for incoming calls
  public offIncomingCall() {
    console.log("=== CALLING SERVICE: Removing incoming call callback ===");
    this.incomingCallCallback = null;
  }

  // Set callback for call responses
  public onCallResponse(callback: (response: CallResponse) => void) {
    console.log("=== CALLING SERVICE: Setting call response callback ===");
    this.callResponseCallback = callback;
  }

  // Remove callback for call responses
  public offCallResponse() {
    console.log("=== CALLING SERVICE: Removing call response callback ===");
    this.callResponseCallback = null;
  }

  // Set callback for call ended
  public onCallEnded(callback: (callId: string) => void) {
    console.log("=== CALLING SERVICE: Setting call ended callback ===");
    this.callEndedCallback = callback;
  }

  // Remove callback for call ended
  public offCallEnded() {
    console.log("=== CALLING SERVICE: Removing call ended callback ===");
    this.callEndedCallback = null;
  }

  // Initiate a call
  public async initiateCall(
    callData: Omit<CallData, "callerId" | "callerName">,
    callerId: string,
    callerName: string
  ): Promise<ActiveCall> {
    console.log(
      "=== CALLING SERVICE: Initiating call ===",
      callData,
      callerId,
      callerName
    );

    const callId = `call_${Date.now()}_${callerId}_${callData.calleeId}`;

    const activeCall: ActiveCall = {
      callId,
      callerId,
      callerName,
      calleeId: callData.calleeId,
      calleeName: callData.calleeName,
      appointmentId: callData.appointmentId,
      channelName: callData.channelName,
      status: "ringing",
    };

    // Store the outgoing call
    this.activeCalls.set(callId, activeCall);

    // CRITICAL FIX: Emit to the real-time system correctly
    console.log(
      "=== CALLING SERVICE: Emitting initiate-call event for target user ===",
      callData.calleeId
    );
    console.log("=== CALLING SERVICE: Active call data ===", activeCall);

    // 🚨 CRITICAL: Emit BOTH event types to ensure compatibility
    // Emit initiate-call for the calling service bridge
    const emitResult1 = socketClient.emit<ActiveCall>(
      "initiate-call",
      activeCall
    );
    console.log(
      "=== CALLING SERVICE: Emit initiate-call result ===",
      emitResult1
    );

    // Also emit incoming-call directly for immediate compatibility
    const emitResult2 = socketClient.emit<ActiveCall>(
      "incoming-call",
      activeCall
    );
    console.log(
      "=== CALLING SERVICE: Emit incoming-call result ===",
      emitResult2
    );

    console.log(
      "=== CALLING SERVICE: Emitted BOTH initiate-call AND incoming-call events ==="
    );

    // 🚨 ADDITIONAL DEBUG: Check socket connection status
    console.log(
      "=== CALLING SERVICE: Socket connected? ===",
      socketClient.isConnected()
    );
    console.log(
      "=== CALLING SERVICE: Socket user ID ===",
      socketClient.getUserId()
    );
    console.log(
      "=== CALLING SERVICE: Socket authenticated? ===",
      socketClient.isUserAuthenticated()
    );

    // IMMEDIATE TEST: Also trigger the callback directly for testing
    console.log("=== CALLING SERVICE: Testing direct callback trigger ===");
    if (this.incomingCallCallback) {
      setTimeout(() => {
        console.log("=== CALLING SERVICE: Direct callback test triggered ===");
        this.incomingCallCallback!(activeCall);
      }, 100);
    }

    return activeCall;
  }

  // Accept an incoming call
  public acceptCall(callId: string, userId: string) {
    console.log("=== CALLING SERVICE: Accepting call ===", callId, userId);
    const call = this.activeCalls.get(callId);
    if (call) {
      // Update call status
      this.activeCalls.set(callId, {
        ...call,
        status: "accepted",
        startTime: new Date(),
      });

      // Emit call accepted event
      const response: CallResponse = {
        accepted: true,
        callerId: call.callerId,
        calleeId: call.calleeId, // This should be the calleeId, not userId
        appointmentId: call.appointmentId,
      };

      socketClient.emit<CallResponse>("call-response", response);
    }
  }

  // Reject an incoming call
  public rejectCall(callId: string, userId: string) {
    console.log("=== CALLING SERVICE: Rejecting call ===", callId, userId);
    const call = this.activeCalls.get(callId);
    if (call) {
      // Update call status
      this.activeCalls.set(callId, {
        ...call,
        status: "rejected",
      });

      // Emit call rejected event
      const response: CallResponse = {
        accepted: false,
        callerId: call.callerId,
        calleeId: call.calleeId, // This should be the calleeId, not userId
        appointmentId: call.appointmentId,
      };

      socketClient.emit<CallResponse>("call-response", response);

      // Remove call after rejection
      setTimeout(() => {
        this.activeCalls.delete(callId);
      }, 1000);
    }
  }

  // End an active call
  public endCall(callId: string) {
    console.log("=== CALLING SERVICE: Ending call ===", callId);
    const call = this.activeCalls.get(callId);
    if (call) {
      // Update call status
      this.activeCalls.set(callId, {
        ...call,
        status: "ended",
      });

      // Emit call ended event with just the callId
      socketClient.emit<string>("call-ended", callId);

      // Remove call after ending
      setTimeout(() => {
        this.activeCalls.delete(callId);
      }, 1000);
    }
  }

  // Simulate an incoming call (for testing purposes)
  public simulateIncomingCall(callData: ActiveCall): void {
    console.log("=== CALLING SERVICE: Simulating incoming call ===", callData);
    // Store the incoming call
    this.activeCalls.set(callData.callId, {
      ...callData,
      status: "ringing",
    });

    // Notify UI about incoming call
    if (this.incomingCallCallback) {
      this.incomingCallCallback(callData);
    }
  }

  // EMERGENCY TEST METHOD: Force trigger incoming call for debugging
  public forceTestIncomingCall(doctorId: string, doctorName: string): void {
    console.log(
      "🚨 EMERGENCY TEST: Forcing incoming call for doctor",
      doctorId
    );

    const testCall: ActiveCall = {
      callId: `test_call_${Date.now()}`,
      callerId: "test_patient_123",
      callerName: "Test Patient",
      calleeId: doctorId,
      calleeName: doctorName,
      appointmentId: "test_appointment_123",
      channelName: `test_channel_${Date.now()}`,
      status: "ringing",
    };

    // Store the test call
    this.activeCalls.set(testCall.callId, testCall);

    // Force trigger both pathways
    console.log("🚨 EMERGENCY TEST: Triggering direct callback");
    if (this.incomingCallCallback) {
      this.incomingCallCallback(testCall);
    }

    // Also emit to real-time system
    console.log("🚨 EMERGENCY TEST: Emitting to real-time system");
    socketClient.emit<ActiveCall>("incoming-call", testCall);
  }

  // Get active call by ID
  public getActiveCall(callId: string): ActiveCall | undefined {
    return this.activeCalls.get(callId);
  }

  // Get all active calls for a user
  public getUserActiveCalls(userId: string): ActiveCall[] {
    return Array.from(this.activeCalls.values()).filter(
      (call) => call.callerId === userId || call.calleeId === userId
    );
  }
}

export const callingService = CallingService.getInstance();
