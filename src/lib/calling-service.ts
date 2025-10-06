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
  private isProcessingIncomingCall: boolean = false; // Flag to prevent duplicate processing

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
    // Listen for incoming calls
    socketClient.on<ActiveCall>("incoming-call", (callData) => {
      console.log("=== CALLING SERVICE: Received incoming call ===", callData);

      // Prevent duplicate processing in mock mode
      if (this.isProcessingIncomingCall) {
        console.log(
          "=== CALLING SERVICE: Skipping duplicate incoming call processing ==="
        );
        this.isProcessingIncomingCall = false; // Reset flag
        return;
      }

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

    // Listen for call initiation requests
    socketClient.on<CallData>("initiate-call", (callData) => {
      console.log(
        "=== CALLING SERVICE: Received call initiation request ===",
        callData
      );

      // Convert CallData to ActiveCall
      const activeCall: ActiveCall = {
        callId: `call_${Date.now()}_${callData.callerId}_${callData.calleeId}`,
        callerId: callData.callerId,
        callerName: callData.callerName,
        calleeId: callData.calleeId,
        calleeName: callData.calleeName,
        appointmentId: callData.appointmentId,
        channelName: callData.channelName,
        status: "ringing",
      };

      console.log(
        "=== CALLING SERVICE: Converted to ActiveCall ===",
        activeCall
      );

      // Store the incoming call
      this.activeCalls.set(activeCall.callId, {
        ...activeCall,
        status: "ringing",
      });

      // In mock mode, we need to emit an "incoming-call" event to simulate
      // the server behavior where it would route the call to the callee
      if (socketClient.isMockMode()) {
        console.log(
          "=== CALLING SERVICE: Mock mode - Emitting incoming-call event to callee ==="
        );
        // Set flag to prevent duplicate processing
        this.isProcessingIncomingCall = true;
        // Emit the incoming-call event to the callee
        socketClient.emit<ActiveCall>("incoming-call", activeCall);
      } else {
        // Notify UI about incoming call directly in non-mock mode
        if (this.incomingCallCallback) {
          console.log(
            "=== CALLING SERVICE: Non-mock mode - Calling incomingCallCallback ==="
          );
          this.incomingCallCallback(activeCall);
        } else {
          console.log(
            "=== CALLING SERVICE: Non-mock mode - No incomingCallCallback registered ==="
          );
        }
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

    // Emit call initiation event with the original call data
    const emitData: CallData = {
      callerId,
      callerName,
      calleeId: callData.calleeId,
      calleeName: callData.calleeName,
      appointmentId: callData.appointmentId,
      channelName: callData.channelName,
    };

    socketClient.emit<CallData>("initiate-call", emitData);

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
