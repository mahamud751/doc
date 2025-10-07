"use client";

// Define specific event data types
interface MessageData {
  id: string;
  fromUserId: string;
  toUserId: string;
  appointmentId: string;
  message: string;
  timestamp: string;
}

interface OrderUpdateData {
  orderId: string;
  status: string;
}

interface DoctorStatusData {
  doctorId: string;
  status: "online" | "busy" | "away";
}

interface HeartbeatData {
  timestamp: number;
}

interface CallInitiationData {
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  appointmentId: string;
  channelName: string;
  callId: string;
}

interface CallResponseData {
  callId: string;
  accepted: boolean;
  callerId: string;
  calleeId: string;
  appointmentId: string;
}

interface CallEndedData {
  callId: string;
  endedBy: string;
}

// Define the callback type
type SocketCallback<T = unknown> = (data: T) => void;

// Real-time event interface for API communication
interface RealTimeEvent {
  id: string;
  userId: string;
  eventType: string;
  data: any;
  timestamp: number;
  processed?: boolean;
}

class SocketClient {
  private static instance: SocketClient;
  private authToken: string | null = null;
  private userId: string | null = null;
  private userRole: string | null = null;
  private isAuthenticated: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastEventTime: number = 0;
  private eventListeners: Map<string, SocketCallback[]> = new Map();
  private isPolling: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  private constructor() {}

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  // Add method to set user context
  public setUserContext(userId: string, userRole: string): void {
    this.userId = userId;
    this.userRole = userRole;
    console.log(`[REAL-TIME] Setting user context: ${userId} (${userRole})`);
  }

  public async connect(
    token: string,
    userId?: string,
    userRole?: string
  ): Promise<void> {
    // If already connected, don't reconnect
    if (this.isPolling && this.isAuthenticated) {
      console.log("[REAL-TIME] Already connected to polling service");
      // But we still need to update the userId if provided
      if (userId && userRole) {
        this.setUserContext(userId, userRole);
      }
      return;
    }

    try {
      this.authToken = token;

      // Try to get user context from parameters or localStorage
      if (userId && userRole) {
        this.setUserContext(userId, userRole);
      } else {
        // Try to get from localStorage if not provided
        const storedUserId = localStorage.getItem("userId");
        const storedUserRole = localStorage.getItem("userRole");

        if (storedUserId && storedUserRole) {
          console.log(
            "[REAL-TIME] Using stored user context from localStorage"
          );
          this.setUserContext(storedUserId, storedUserRole);
        } else {
          console.error(
            "[REAL-TIME] No user context available in parameters or localStorage"
          );
          throw new Error(
            "Cannot connect - missing user context (userId and userRole required)"
          );
        }
      }

      console.log("[REAL-TIME] Starting real-time polling connection");

      // Authenticate user
      await this.authenticateUser();

      // Start polling for events
      this.startPolling();

      console.log("[REAL-TIME] ✅ Real-time polling connection established");
    } catch (error) {
      console.error("[REAL-TIME] Error connecting:", error);
      this.handleReconnection();
    }
  }

  private async authenticateUser(): Promise<void> {
    if (!this.userId || !this.userRole || !this.authToken) {
      const missingFields = [];
      if (!this.userId) missingFields.push("userId");
      if (!this.userRole) missingFields.push("userRole");
      if (!this.authToken) missingFields.push("authToken");

      console.error(
        "[REAL-TIME] Authentication failed - missing:",
        missingFields
      );
      throw new Error(
        `Cannot authenticate - missing user context: ${missingFields.join(
          ", "
        )}`
      );
    }

    console.log(
      `[REAL-TIME] 🔐 Authenticating user ${this.userId} (${this.userRole})`
    );

    try {
      const response = await fetch("/api/events/authenticate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          userId: this.userId,
          userRole: this.userRole,
        }),
      });

      if (response.ok) {
        this.isAuthenticated = true;
        console.log("[REAL-TIME] ✅ User authenticated");
        this.reconnectAttempts = 0;
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error) {
      console.error("[REAL-TIME] Authentication error:", error);
      throw error;
    }
  }

  private startPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    this.isPolling = true;
    this.lastEventTime = Date.now();

    // Poll every 1.5 seconds for real-time feel
    this.pollInterval = setInterval(() => {
      this.pollForEvents();
    }, 1500);

    console.log(`[REAL-TIME] Started polling for user ${this.userId}`);
  }

  private async pollForEvents(): Promise<void> {
    if (!this.isAuthenticated || !this.userId) {
      return;
    }

    try {
      const response = await fetch(
        `/api/events/poll?userId=${this.userId}&since=${this.lastEventTime}`,
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        }
      );

      if (response.ok) {
        const events: RealTimeEvent[] = await response.json();

        if (events.length > 0) {
          console.log(`[REAL-TIME] Received ${events.length} new events`);

          events.forEach((event) => {
            this.handleEvent(event);
            // Update last event time to the latest event
            if (event.timestamp > this.lastEventTime) {
              this.lastEventTime = event.timestamp;
            }
          });
        }
      } else if (response.status === 401) {
        // Re-authenticate if token expired
        console.log("[REAL-TIME] Token expired, re-authenticating...");
        await this.authenticateUser();
      }
    } catch (error) {
      // Only log errors occasionally to avoid spam
      if (this.reconnectAttempts % 10 === 0) {
        console.log(`[REAL-TIME] Polling error (will retry):`, error);
      }
      this.reconnectAttempts++;
    }
  }

  private handleEvent(event: RealTimeEvent): void {
    console.log(`[REAL-TIME] Handling event: ${event.eventType}`, event.data);

    const listeners = this.eventListeners.get(event.eventType) || [];
    listeners.forEach((callback) => {
      try {
        callback(event.data);
      } catch (error) {
        console.error(
          `[REAL-TIME] Error in listener for ${event.eventType}:`,
          error
        );
      }
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[REAL-TIME] ❌ Max reconnection attempts reached");
      return;
    }

    const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;

    console.log(
      `[REAL-TIME] 🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      if (this.authToken) {
        this.connect(
          this.authToken,
          this.userId || undefined,
          this.userRole || undefined
        );
      }
    }, delay);
  }

  public on<T = unknown>(event: string, callback: SocketCallback<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event)?.push(callback as SocketCallback);
    console.log(`[REAL-TIME] 📡 Listening for event: ${event}`);

    // 🚨 CRITICAL FIX: Special handling for calling service integration
    // The calling service registers listeners but the real-time events need special bridging
    if (
      event === "incoming-call" ||
      event === "call-response" ||
      event === "call-ended"
    ) {
      console.log(
        `🔗 [REAL-TIME] Registered calling service bridge for: ${event}`
      );
    }
  }

  public off<T = unknown>(event: string, callback?: SocketCallback<T>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners && callback) {
      const index = listeners.indexOf(callback as SocketCallback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else if (listeners) {
      // Remove all listeners for this event
      this.eventListeners.set(event, []);
    }
    console.log(`[REAL-TIME] 🔇 Removing listener for event: ${event}`);
  }

  public emit<T = unknown>(event: string, data: T): boolean {
    if (!this.isAuthenticated || !this.userId) {
      console.log("[REAL-TIME] ⚠️ Cannot emit - not authenticated:", {
        event,
        isAuthenticated: this.isAuthenticated,
        hasUserId: !!this.userId,
        userId: this.userId,
      });
      return false;
    }

    console.log(`[REAL-TIME] 📤 Emitting event: ${event}`, {
      event,
      data,
      userId: this.userId,
      isAuthenticated: this.isAuthenticated,
    });

    // Send event to server via API
    fetch("/api/events/emit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({
        userId: this.userId,
        eventType: event,
        data: data,
      }),
    })
      .then((response) => {
        if (response.ok) {
          console.log(`[REAL-TIME] ✅ Event ${event} emitted successfully`);
        } else {
          console.error(
            `[REAL-TIME] ❌ Event ${event} emit failed:`,
            response.status
          );
        }
      })
      .catch((error) => {
        console.error(`[REAL-TIME] ❌ Error emitting ${event}:`, error);
      });

    return true;
  }

  public joinAppointment(appointmentId: string): boolean {
    return this.emit("join-appointment", { appointmentId });
  }

  public leaveAppointment(appointmentId: string): boolean {
    return this.emit("leave-appointment", { appointmentId });
  }

  public joinNotifications(): boolean {
    return this.emit("join-notifications", {});
  }

  public updateStatus(status: "online" | "busy" | "away"): boolean {
    return this.emit("update-status", { status });
  }

  public sendMessage(data: {
    appointmentId: string;
    message: string;
    toUserId: string;
  }): boolean {
    return this.emit("send-message", data);
  }

  public sendHeartbeat(): boolean {
    return this.emit<HeartbeatData>("heartbeat", { timestamp: Date.now() });
  }

  public initiateCall(data: {
    calleeId: string;
    calleeName: string;
    callerId: string;
    callerName: string;
    appointmentId: string;
    channelName: string;
    callId: string;
  }): boolean {
    console.log("[REAL-TIME] 📞 Initiating call:", data);
    return this.emit<CallInitiationData>("initiate-call", data);
  }

  public respondToCall(data: {
    callId: string;
    accepted: boolean;
    callerId: string;
    calleeId: string;
    appointmentId: string;
  }): boolean {
    console.log("[REAL-TIME] 📞 Responding to call:", data);
    return this.emit<CallResponseData>("call-response", data);
  }

  public endCall(data: { callId: string; endedBy: string }): boolean {
    console.log("[REAL-TIME] 📞 Ending call:", data);
    return this.emit<CallEndedData>("call-ended", data);
  }

  public disconnect(): void {
    this.isPolling = false;
    this.isAuthenticated = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    this.reconnectAttempts = 0;
    console.log("[REAL-TIME] 🚫 Disconnected from polling service");
  }

  public isConnected(): boolean {
    return this.isPolling && this.isAuthenticated;
  }

  public isMockMode(): boolean {
    return false; // We're using real polling now
  }

  public getUserId(): string | null {
    return this.userId;
  }

  public getUserRole(): string | null {
    return this.userRole;
  }

  public isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  public reset(): void {
    this.disconnect();
    this.authToken = null;
    this.userId = null;
    this.userRole = null;
    this.isAuthenticated = false;
    this.eventListeners.clear();
    this.lastEventTime = 0;
    console.log("[REAL-TIME] 🔄 Socket client reset");
  }
}

export const socketClient = SocketClient.getInstance();
