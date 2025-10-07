import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";

// Extend Socket type to include user properties
interface ExtendedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userName?: string;
}

// Store connected users and active calls
const connectedUsers = new Map();
const activeCalls = new Map();

let io: SocketIOServer | null = null;

export function initializeSocketIO(server: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  console.log("[SOCKET.IO] Initializing WebSocket server...");

  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/socket.io/",
  });

  io.on("connection", (socket: ExtendedSocket) => {
    console.log(`[SOCKET.IO] User connected: ${socket.id}`);

    // Handle user authentication
    socket.on("authenticate", (data) => {
      const { token, userId, userRole, userName } = data;

      console.log(`[SOCKET.IO] User authenticated:`, {
        socketId: socket.id,
        userId,
        userRole,
        userName,
      });

      // Store user info on socket
      socket.userId = userId;
      socket.userRole = userRole;
      socket.userName = userName;

      // Add to connected users
      connectedUsers.set(userId, {
        socketId: socket.id,
        userId,
        userRole,
        userName,
        socket: socket,
        connectedAt: new Date(),
      });

      // Join user-specific room
      socket.join(`user_${userId}`);

      // Send confirmation
      socket.emit("authenticated", {
        success: true,
        userId,
        connectedUsers: Array.from(connectedUsers.keys()),
      });

      console.log(
        `[SOCKET.IO] User ${userId} (${userRole}) authenticated - Total users: ${connectedUsers.size}`
      );
    });

    // Handle call initiation
    socket.on("initiate-call", (callData) => {
      console.log(`[SOCKET.IO] Call initiated:`, callData);

      const {
        calleeId,
        callerId,
        callerName,
        calleeName,
        appointmentId,
        channelName,
      } = callData;

      // Create call ID
      const callId = `call_${Date.now()}_${callerId}_${calleeId}`;

      // Store active call
      const activeCall = {
        callId,
        callerId,
        callerName,
        calleeId,
        calleeName,
        appointmentId,
        channelName,
        status: "ringing",
        startTime: new Date(),
      };

      activeCalls.set(callId, activeCall);

      // Send to specific callee
      const calleeUser = connectedUsers.get(calleeId);
      if (calleeUser) {
        console.log(
          `[SOCKET.IO] Routing call to ${calleeId} (socket: ${calleeUser.socketId})`
        );
        io?.to(`user_${calleeId}`).emit("incoming-call", activeCall);

        // Also send response to caller confirming call was sent
        socket.emit("call-initiated", { callId, calleeId, status: "sent" });
      } else {
        console.log(
          `[SOCKET.IO] Callee ${calleeId} not found or not connected`
        );
        // Notify caller that callee is offline
        socket.emit("call-failed", {
          error: "User is offline or not available",
          calleeId,
        });
      }
    });

    // Handle call response (accept/reject)
    socket.on("call-response", (responseData) => {
      console.log(`[SOCKET.IO] Call response:`, responseData);

      const { callId, accepted, callerId, calleeId } = responseData;
      const call = activeCalls.get(callId);

      if (call) {
        // Update call status
        call.status = accepted ? "accepted" : "rejected";
        activeCalls.set(callId, call);

        // Notify caller about response
        const callerUser = connectedUsers.get(callerId);
        if (callerUser) {
          console.log(
            `[SOCKET.IO] Notifying caller ${callerId} about call response`
          );
          io?.to(`user_${callerId}`).emit("call-response", {
            callId,
            accepted,
            callerId,
            calleeId,
            appointmentId: call.appointmentId,
          });
        }

        // If rejected, remove call
        if (!accepted) {
          setTimeout(() => {
            activeCalls.delete(callId);
          }, 5000);
        }
      }
    });

    // Handle call ended
    socket.on("call-ended", (data) => {
      console.log(`[SOCKET.IO] Call ended:`, data);

      const { callId } = data;
      const call = activeCalls.get(callId);

      if (call) {
        // Notify both parties
        io?.to(`user_${call.callerId}`).emit("call-ended", { callId });
        io?.to(`user_${call.calleeId}`).emit("call-ended", { callId });

        // Remove from active calls
        activeCalls.delete(callId);
      }
    });

    // Handle join notifications
    socket.on("join-notifications", () => {
      if (socket.userId) {
        console.log(`[SOCKET.IO] User ${socket.userId} joined notifications`);
        socket.join("notifications");
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`[SOCKET.IO] User disconnected: ${socket.id}`);

      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(
          `[SOCKET.IO] User ${socket.userId} removed - Remaining users: ${connectedUsers.size}`
        );

        // Notify other users about disconnection
        socket.broadcast.emit("user-disconnected", {
          userId: socket.userId,
          userRole: socket.userRole,
        });
      }
    });

    // Send current server status
    socket.emit("server-status", {
      connected: true,
      totalUsers: connectedUsers.size,
      activeCalls: activeCalls.size,
      timestamp: new Date(),
    });
  });

  console.log("[SOCKET.IO] WebSocket server initialized successfully");
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export { io };
