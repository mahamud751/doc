import { NextRequest, NextResponse } from "next/server";

// This API route can be used to check if Socket.IO is initialized
// In a custom server environment, Socket.IO would be initialized automatically
// In development, you might need to trigger initialization through an API call

let socketInitialized = false;

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    socketInitialized,
    message: "Socket initialization status",
  });
}

// This POST endpoint could be used to manually initialize Socket.IO in development
export async function POST(request: NextRequest) {
  // In a real implementation with a custom server, this would initialize Socket.IO
  // For now, we'll just simulate the initialization
  socketInitialized = true;
  
  return NextResponse.json({
    success: true,
    socketInitialized,
    message: "Socket.IO initialization triggered (simulated)",
  });
}