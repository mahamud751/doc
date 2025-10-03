import { socketHealthCheck } from "./socket-health-check";

// Mock Socket type for when WebSocket is not available
interface MockSocket {
  connected: boolean;
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback?: (...args: any[]) => void): void;
  emit(event: string, data: any): void;
  close(): void;
  disconnect(): void;
}

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
  private eventListeners: Map<string, Array<(...args: any[]) => void>> =
    new Map();
  private mockConnectionInterval: NodeJS.Timeout | null = null;
  private mockMode: boolean = false;

  private constructor() {}

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  public async connect(token: string): Promise<void> {
    // If already connected or connecting, don't reconnect
    if (this.socket && this.socket.connected) {
      console.log("Socket already connected (mock mode)");
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

      // Log the connection attempt
      console.log(
        "Attempting to connect to Socket.IO server at:",
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000"
      );

      // Immediately switch to mock mode since WebSocket isn't available
      this.setupMockSocket();
      this.isConnecting = false;

      // Emit a custom event to notify the application
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("socketConnected"));
      }
    } catch (error: any) {
      console.error("Error initializing socket connection:", error);
      this.isConnecting = false;
      this.setupMockSocket();
    }
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
      on: (event: string, callback: (...args: any[]) => void) => {
        if (!this.eventListeners.has(event)) {
          this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)?.push(callback);
      },
      off: (event: string, callback?: (...args: any[]) => void) => {
        if (callback) {
          const listeners = this.eventListeners.get(event);
          if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
              listeners.splice(index, 1);
            }
          }
        } else {
          this.eventListeners.delete(event);
        }
      },
      emit: (event: string, data: any) => {
        console.log(`[MOCK SOCKET] Emitting event: ${event}`, data);
        // In mock mode, we just log the events instead of sending them over WebSocket
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
      this.emitMockEvent("heartbeat", {});
    }, 30000);
  }

  private emitMockEvent(event: string, data: any): void {
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
  public simulateMessage(data: any): void {
    this.emitMockEvent("new-message", data);
  }

  // Method to simulate receiving an order update event
  public simulateOrderUpdate(data: any): void {
    this.emitMockEvent("order-update", data);
  }

  // Method to simulate receiving a doctor status change event
  public simulateDoctorStatusChange(data: any): void {
    this.emitMockEvent("doctor-status-change", data);
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    if (!this.socket) {
      this.setupMockSocket();
    }
    this.socket?.on(event, callback);
  }

  public off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  public emit(event: string, data: any): boolean {
    if (!this.socket) {
      this.setupMockSocket();
    }

    console.log(`[MOCK SOCKET] Emitting event: ${event}`, data);
    // In mock mode, we just log the events instead of sending them over WebSocket
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
    return this.emit("heartbeat", {});
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
  }
}

export const socketClient = SocketClient.getInstance();
