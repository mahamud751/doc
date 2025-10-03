// instrumentation.ts
import { initSocketIO } from "@/lib/socket-initializer";

// This function is called when the Next.js server initializes
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log("Next.js server is initializing...");
    
    // In a production environment with a custom server, we would initialize Socket.IO here
    // For development with Next.js dev server, we'll need to initialize it differently
    
    console.log("Socket.IO initialization will be handled by custom server in production");
  }
}