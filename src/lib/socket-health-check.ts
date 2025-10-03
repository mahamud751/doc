/**
 * Socket Health Check Utility
 *
 * This utility checks if the socket server is available before attempting to connect.
 * It prevents unnecessary connection attempts when the server is known to be down.
 */

class SocketHealthCheck {
  private static instance: SocketHealthCheck;
  private isServerAvailable: boolean = false; // Default to false since we're using mock mode
  private lastCheckTime: number = 0;
  private checkInterval: number = 30000; // 30 seconds
  private healthCheckTimeout: number = 5000; // 5 seconds

  private constructor() {}

  public static getInstance(): SocketHealthCheck {
    if (!SocketHealthCheck.instance) {
      SocketHealthCheck.instance = new SocketHealthCheck();
    }
    return SocketHealthCheck.instance;
  }

  /**
   * Check if the socket server is available
   * This performs a lightweight check to determine server availability
   */
  public async checkServerAvailability(): Promise<boolean> {
    const now = Date.now();

    // If we checked recently, return the cached result
    if (now - this.lastCheckTime < this.checkInterval) {
      return this.isServerAvailable;
    }

    this.lastCheckTime = now;

    try {
      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

      // Try to fetch a simple endpoint to check if server is responding
      const response = await fetch(`${socketUrl}/api/socket`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(this.healthCheckTimeout),
      });

      this.isServerAvailable = response.ok;
      return this.isServerAvailable;
    } catch (error) {
      console.warn(
        "Socket server health check failed (this is expected in mock mode):",
        error
      );
      // In mock mode, we return false but this is expected
      this.isServerAvailable = false;
      return false;
    }
  }

  /**
   * Get the current server availability status
   */
  public isAvailable(): boolean {
    return this.isServerAvailable;
  }

  /**
   * Mark server as available (manual override)
   */
  public markAsAvailable(): void {
    this.isServerAvailable = true;
    this.lastCheckTime = Date.now();
  }

  /**
   * Mark server as unavailable (manual override)
   */
  public markAsUnavailable(): void {
    this.isServerAvailable = false;
    this.lastCheckTime = Date.now();
  }

  /**
   * Check if we're in mock mode (no real WebSocket server)
   */
  public isMockMode(): boolean {
    // We're in mock mode if the server is not available
    return !this.isServerAvailable;
  }
}

export const socketHealthCheck = SocketHealthCheck.getInstance();
