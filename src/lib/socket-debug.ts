/**
 * Socket Debug Utility
 *
 * Provides debugging helpers for socket connection issues
 */

export class SocketDebug {
  /**
   * Check browser WebSocket support
   */
  public static checkWebSocketSupport(): boolean {
    if (typeof window === "undefined") return true; // Server-side, assume support

    return "WebSocket" in window || "MozWebSocket" in window;
  }

  /**
   * Check if the current environment supports Socket.IO
   */
  public static checkEnvironment(): {
    isBrowser: boolean;
    isWebSocketSupported: boolean;
    envVars: {
      socketUrl?: string;
    };
    isMockMode: boolean;
  } {
    const isBrowser = typeof window !== "undefined";
    const isWebSocketSupported = this.checkWebSocketSupport();

    const envVars = {
      socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL,
    };

    // We're in mock mode if there's no socket URL or if we're using the default localhost
    const isMockMode =
      !envVars.socketUrl || envVars.socketUrl === "http://localhost:3000";

    return {
      isBrowser,
      isWebSocketSupported,
      envVars,
      isMockMode,
    };
  }

  /**
   * Log detailed debug information
   */
  public static logDebugInfo(): void {
    console.group("Socket Debug Information");

    const env = this.checkEnvironment();
    console.log("Environment:", env);

    // Check for common issues
    if (!env.envVars.socketUrl) {
      console.warn(
        "Warning: NEXT_PUBLIC_SOCKET_URL is not set. Defaulting to http://localhost:3000"
      );
    }

    if (env.isMockMode) {
      console.log(
        "Info: Running in mock mode - WebSocket connections are simulated"
      );
    }

    if (!env.isWebSocketSupported) {
      console.error("Error: WebSocket is not supported in this environment");
    }

    console.groupEnd();
  }

  /**
   * Test basic connectivity to the socket server endpoint
   */
  public static async testConnectivity(): Promise<{
    success: boolean;
    message: string;
    details?: any;
    isMockMode: boolean;
  }> {
    try {
      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

      // Check if we're in mock mode
      const isMockMode = socketUrl === "http://localhost:3000";

      if (isMockMode) {
        return {
          success: true,
          message: "Running in mock mode - no real server connection needed",
          isMockMode: true,
        };
      }

      // Test HTTP connectivity first
      const response = await fetch(`${socketUrl}/api/socket`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `HTTP connectivity test failed with status ${response.status}`,
          details: await response.text(),
          isMockMode: false,
        };
      }

      return {
        success: true,
        message: "HTTP connectivity test passed",
        details: {
          status: response.status,
          statusText: response.statusText,
        },
        isMockMode: false,
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Connectivity test failed",
        details: {
          error: error.message,
          type: error.name,
        },
        isMockMode: false,
      };
    }
  }
}

// Run debug info on load in development
if (process.env.NODE_ENV === "development") {
  SocketDebug.logDebugInfo();
}
