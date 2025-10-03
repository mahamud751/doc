import { NextRequest, NextResponse } from "next/server";
import { initializeSocketIO } from "@/lib/socket-server";

// Export the functions for external use
export { initializeSocketIO };

// Health check endpoint for socket server
export async function GET(request: NextRequest) {
  // In a standard Next.js setup without custom server, we can't actually check Socket.IO status
  // We'll return a response indicating the API is accessible
  return NextResponse.json({
    success: true,
    message: "Socket API endpoint is accessible",
    timestamp: new Date().toISOString(),
  });
}

// Endpoint to test if WebSocket upgrade is supported (for health checking)
export async function POST(request: NextRequest) {
  // This would be used in a custom server setup to test WebSocket connectivity
  // In standard Next.js, we just return a success response
  return NextResponse.json({
    success: true,
    message: "Socket endpoint is reachable",
    timestamp: new Date().toISOString(),
  });
}
