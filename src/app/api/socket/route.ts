import { NextRequest, NextResponse } from "next/server";
import { initializeSocketIO } from "@/lib/socket-server";

// Export the functions for external use
export {
  initializeSocketIO,
};

// API endpoint to get current online doctors would go here
// For now, we'll return a placeholder response
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Socket server API endpoint",
  });
}