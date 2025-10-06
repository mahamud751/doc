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
  // Add other order update properties as needed
}

interface DoctorStatusData {
  doctorId: string;
  status: "online" | "busy" | "away";
  // Add other doctor status properties as needed
}

interface HeartbeatData {
  timestamp: number;
}

// Global mock event bus for routing events between different user instances in mock mode
const mockEventBus: {
  listeners: Map<
    string,
    Array<{ userId: string | null; callback: (data: any) => void }>
  >;
  emit: (event: string, data: any, targetUserId?: string) => void;
  subscribe: (
    event: string,
    userId: string | null,
    callback: (data: any) => void
  ) => void;
  unsubscribe: (
    event: string,
    userId: string | null,
    callback: (data: any) => void
  ) => void;
} = {
  listeners: new Map(),

  emit(event: string, data: any, targetUserId?: string) {
    console.log(
      `[MOCK EVENT BUS] Emitting event: ${event}`,
      data,
      "Target:",
      targetUserId
    );
    const listeners = this.listeners.get(event) || [];
    console.log(
      `[MOCK EVENT BUS] Found ${listeners.length} listeners for event ${event}`
    );
    let calledCount = 0;
    listeners.forEach(({ userId, callback }, index) => {
      // If targetUserId is specified, only send to that user
      // If targetUserId is not specified, send to all users
      if (
        targetUserId === undefined ||
        userId === targetUserId ||
        userId === null
      ) {
        console.log(
          `[MOCK EVENT BUS] Calling callback ${index} for user: ${userId}`
        );
        calledCount++;
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in mock event listener for ${event}:`, error);
        }
      } else {
        console.log(
          `[MOCK EVENT BUS] Skipping callback ${index} for user: ${userId} (target: ${targetUserId})`
        );
      }
    });
    console.log(
      `[MOCK EVENT BUS] Called ${calledCount} callbacks for event ${event}`
    );
  },

  subscribe(
    event: string,
    userId: string | null,
    callback: (data: any) => void
  ) {
    console.log(
      `[MOCK EVENT BUS] Subscribing to event: ${event} for user: ${userId}`
    );
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push({ userId, callback });
    console.log(
      `[MOCK EVENT BUS] Now have ${
        this.listeners.get(event)?.length
      } listeners for event ${event}`
    );
  },

  unsubscribe(
    event: string,
    userId: string | null,
    callback: (data: any) => void
  ) {
    console.log(
      `[MOCK EVENT BUS] Unsubscribing from event: ${event} for user: ${userId}`
    );
    const listeners = this.listeners.get(event) || [];
    const index = listeners.findIndex(
      (listener) => listener.userId === userId && listener.callback === callback
    );
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    console.log(
      `[MOCK EVENT BUS] Now have ${listeners.length} listeners for event ${event}`
    );
  },
};

interface MockSocket {
  connected: boolean;
  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback?: (...args: unknown[]) => void): void;
  emit(event: string, data: unknown): void;
  close(): void;
  disconnect(): void;
}

// Define the callback type with specific event data
type SocketCallback<T = unknown> = (data: T) => void;

class SocketClient {
  private static instance: SocketClient;
  private socket: MockSocket | null = null;
  private authToken: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private baseReconnectDelay: number = 2000;
  private maxReconnectDelay: number = 10000;
  private isConnecting: boolean = false;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, SocketCallback[]> = new Map();
  private mockConnectionInterval: NodeJS.Timeout | null = null;
  private mockMode: boolean = false;
  private userId: string | null = null; // Add user ID tracking
  private subscriptions: Array<{ event: string; callback: SocketCallback }> =
    []; // Track subscriptions

  private constructor() {}

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  public async connect(token: string, userId?: string): Promise<void> {
    // If already connected or connecting, don't reconnect
    if (this.socket && this.socket.connected) {
      console.log("Socket already connected (mock mode)");
      // But we still need to update the userId if provided
      if (userId) {
        const oldUserId = this.userId;
        this.userId = userId;
        // Update subscriptions in the mock event bus
        if (oldUserId !== userId) {
          this.updateSubscriptions(oldUserId, userId);
        }
      }
      return;
    }

    if (this.isConnecting) {
      console.log("Socket connection already in progress (mock mode)");
      return;
    }

    // Clear any existing timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    try {
      this.isConnecting = true;
      this.authToken = token;
      this.userId = userId || null; // Store user ID if provided

      // Log the connection attempt
      console.log(
        "Attempting to connect to Socket.IO server at:",
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000"
      );

      // In a real implementation, we would connect to the WebSocket server here
      // For now, we'll use mock mode but simulate real behavior
      this.setupMockSocket();
      this.isConnecting = false;

      // Emit a custom event to notify the application
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("socketConnected"));
      }
    } catch (error) {
      console.error("Error initializing socket connection:", error);
      this.isConnecting = false;
      this.setupMockSocket();
    }
  }

  // Update subscriptions when userId changes
  private updateSubscriptions(
    oldUserId: string | null,
    newUserId: string | null
  ) {
    if (oldUserId === newUserId) return;

    console.log(
      `Updating subscriptions from user ${oldUserId} to ${newUserId}`
    );

    // Unsubscribe from all events with old userId
    this.subscriptions.forEach(({ event, callback }) => {
      if (oldUserId !== null) {
        mockEventBus.unsubscribe(event, oldUserId, callback);
      }
    });

    // Subscribe to all events with new userId
    this.subscriptions.forEach(({ event, callback }) => {
      mockEventBus.subscribe(event, newUserId, callback);
    });
  }

  private setupMockSocket(): void {
    // Clear any existing interval
    if (this.mockConnectionInterval) {
      clearInterval(this.mockConnectionInterval);
      this.mockConnectionInterval = null;
    }

    this.mockMode = true;

    // Create a mock socket object
    this.socket = {
      connected: true,
      on: (event: string, callback: SocketCallback) => {
        if (!this.eventListeners.has(event)) {
          this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)?.push(callback);

        // Track subscription for later updates
        this.subscriptions.push({ event, callback });

        // Subscribe to global event bus
        // If userId is not available yet, subscribe with null (will receive all events)
        mockEventBus.subscribe(event, this.userId, callback);
      },
      off: (event: string, callback?: SocketCallback) => {
        if (callback) {
          const listeners = this.eventListeners.get(event);
          if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
              listeners.splice(index, 1);
            }
          }

          // Remove from tracked subscriptions
          this.subscriptions = this.subscriptions.filter(
            (sub) => sub.event !== event || sub.callback !== callback
          );

          // Unsubscribe from global event bus
          if (this.userId !== null) {
            mockEventBus.unsubscribe(event, this.userId, callback);
          }
        } else {
          this.eventListeners.delete(event);

          // Remove all subscriptions for this event
          const subscriptionsToRemove = this.subscriptions.filter(
            (sub) => sub.event === event
          );
          this.subscriptions = this.subscriptions.filter(
            (sub) => sub.event !== event
          );

          // Unsubscribe all listeners for this event from global event bus
          if (this.userId !== null) {
            subscriptionsToRemove.forEach(({ callback }) => {
              mockEventBus.unsubscribe(event, this.userId, callback);
            });
          }
        }
      },
      emit: (event: string, data: unknown) => {
        console.log(`[MOCK SOCKET] Emitting event: ${event}`, data);
        // In mock mode, we route events through the global event bus
        if (this.mockMode) {
          // For call events, we need to route them to the correct user
          if (
            event === "initiate-call" &&
            typeof data === "object" &&
            data !== null &&
            "calleeId" in data
          ) {
            console.log(
              `[MOCK SOCKET] Routing initiate-call to callee: ${
                (data as any).calleeId
              }`
            );
            // Route call initiation to the callee
            mockEventBus.emit(event, data, (data as any).calleeId);
          } else if (
            event === "call-response" &&
            typeof data === "object" &&
            data !== null &&
            "callerId" in data
          ) {
            console.log(
              `[MOCK SOCKET] Routing call-response to caller: ${
                (data as any).callerId
              }`
            );
            // Route call response to the caller
            mockEventBus.emit(event, data, (data as any).callerId);
          } else if (
            event === "incoming-call" &&
            typeof data === "object" &&
            data !== null &&
            "calleeId" in data
          ) {
            console.log(
              `[MOCK SOCKET] Routing incoming-call to callee: ${
                (data as any).calleeId
              }`
            );
            // Route incoming call to the callee
            mockEventBus.emit(event, data, (data as any).calleeId);
          } else if (event === "call-ended") {
            console.log(`[MOCK SOCKET] Broadcasting call-ended event`);
            // For call-ended events, we broadcast to all users
            // Each user will check if they have that callId and handle accordingly
            mockEventBus.emit(event, data);
          } else {
            console.log(`[MOCK SOCKET] Broadcasting event: ${event}`);
            // For other events, broadcast to all users
            mockEventBus.emit(event, data);
          }
        }
      },
      close: () => {
        this.disconnect();
      },
      disconnect: () => {
        this.disconnect();
      },
    };

    console.log(
      "Switched to mock socket mode - events will be logged instead of sent over WebSocket"
    );

    // Simulate periodic events
    this.setupMockEvents();
  }

  private setupMockEvents(): void {
    // Clear any existing interval
    if (this.mockConnectionInterval) {
      clearInterval(this.mockConnectionInterval);
    }

    // Simulate periodic heartbeat events
    this.mockConnectionInterval = setInterval(() => {
      // Emit mock heartbeat events
      this.emitMockEvent<HeartbeatData>("heartbeat", { timestamp: Date.now() });
    }, 30000);
  }

  private emitMockEvent<T>(event: string, data: T): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in mock event listener for ${event}:`, error);
        }
      });
    }
  }

  // Method to simulate receiving a message event
  public simulateMessage(data: MessageData): void {
    this.emitMockEvent<MessageData>("new-message", data);
  }

  // Method to simulate receiving an order update event
  public simulateOrderUpdate(data: OrderUpdateData): void {
    this.emitMockEvent<OrderUpdateData>("order-update", data);
  }

  // Method to simulate receiving a doctor status change event
  public simulateDoctorStatusChange(data: DoctorStatusData): void {
    this.emitMockEvent<DoctorStatusData>("doctor-status-change", data);
  }

  public on<T = unknown>(event: string, callback: SocketCallback<T>): void {
    if (!this.socket) {
      this.setupMockSocket();
    }
    this.socket?.on(event, callback as unknown as (...args: unknown[]) => void);
  }

  public off<T = unknown>(event: string, callback?: SocketCallback<T>): void {
    this.socket?.off(
      event,
      callback as unknown as ((...args: unknown[]) => void) | undefined
    );
  }

  public emit<T = unknown>(event: string, data: T): boolean {
    if (!this.socket) {
      this.setupMockSocket();
    }

    console.log(`[SOCKET] Emitting event: ${event}`, data);

    // Emit the event through the socket
    this.socket?.emit(event, data);

    return true;
  }

  public joinAppointment(appointmentId: string): boolean {
    return this.emit("join-appointment", appointmentId);
  }

  public leaveAppointment(appointmentId: string): boolean {
    return this.emit("leave-appointment", appointmentId);
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

  public disconnect(): void {
    this.isConnecting = false;
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.mockConnectionInterval) {
      clearInterval(this.mockConnectionInterval);
      this.mockConnectionInterval = null;
    }
    this.socket = null;
    this.reconnectAttempts = 0;
    this.mockMode = false;
    this.subscriptions = []; // Clear subscriptions
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public isMockMode(): boolean {
    return this.mockMode;
  }

  public reset(): void {
    this.disconnect();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.authToken = null;
    this.mockMode = false;
    this.subscriptions = []; // Clear subscriptions
  }
}

export const socketClient = SocketClient.getInstance();
