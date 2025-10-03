import { io, Socket } from "socket.io-client";

class SocketClient {
  private static instance: SocketClient;
  private socket: Socket | null = null;
  private authToken: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10; // Increased from 5 to 10
  private reconnectDelay: number = 2000; // Increased from 1000 to 2000ms
  private isConnecting: boolean = false;

  private constructor() {}

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  public connect(token: string): void {
    // If already connected or connecting, don't reconnect
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    if (this.isConnecting) {
      console.log("Socket connection already in progress");
      return;
    }

    try {
      this.isConnecting = true;
      this.authToken = token;

      // Close existing socket if it exists
      if (this.socket) {
        this.socket.close();
      }

      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
      console.log("Attempting to connect to Socket.IO server at:", socketUrl);

      this.socket = io(socketUrl, {
        auth: {
          token: this.authToken,
        },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 20000, // Increased from 10s to 20s timeout
        // Add additional connection options for better reliability
        upgrade: true,
        rememberUpgrade: false,
        rejectUnauthorized: false,
      });

      this.setupEventListeners();
    } catch (error: any) {
      this.isConnecting = false;
      console.error("Error initializing socket connection:", error);
      throw new Error(
        `Failed to initialize socket connection: ${error.message}`
      );
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Connected to socket server");
      this.isConnecting = false;
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from socket server:", reason);
      this.isConnecting = false;

      // If the disconnection was initiated by the server, don't attempt to reconnect
      if (reason === "io server disconnect") {
        console.log("Server initiated disconnect, will not reconnect");
        return;
      }

      // For other disconnections, the client will automatically try to reconnect
      console.log("Attempting to reconnect...");
    });

    this.socket.on("connect_error", (error: any) => {
      this.isConnecting = false;
      console.error("Socket connection error:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        type: error.type,
        description: error.description,
      });

      // Log the connection URL for debugging
      console.error(
        "Attempting to connect to:",
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000"
      );

      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnect attempts reached. Giving up.");
        console.error("Please check if the Socket.IO server is running.");
        this.reconnectAttempts = 0;
      } else {
        console.log(
          `Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
        );
      }
    });

    this.socket.on("reconnect", (attempt) => {
      console.log("Reconnected to socket server on attempt:", attempt);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    });

    this.socket.on("reconnect_attempt", (attempt) => {
      console.log("Reconnection attempt:", attempt);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("Failed to reconnect to socket server after max attempts");
      this.isConnecting = false;
    });
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  public off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  public emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn("Socket not connected. Cannot emit event:", event);
    }
  }

  public joinAppointment(appointmentId: string): void {
    this.emit("join-appointment", appointmentId);
  }

  public leaveAppointment(appointmentId: string): void {
    this.emit("leave-appointment", appointmentId);
  }

  public joinNotifications(): void {
    this.emit("join-notifications", {});
  }

  public updateStatus(status: "online" | "busy" | "away"): void {
    this.emit("update-status", { status });
  }

  public sendMessage(data: {
    appointmentId: string;
    message: string;
    toUserId: string;
  }): void {
    this.emit("send-message", data);
  }

  public sendHeartbeat(): void {
    // Only send heartbeat if connected
    if (this.socket?.connected) {
      this.emit("heartbeat", {});
    }
  }

  public disconnect(): void {
    this.isConnecting = false;
    this.socket?.disconnect();
    this.reconnectAttempts = 0;
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketClient = SocketClient.getInstance();
