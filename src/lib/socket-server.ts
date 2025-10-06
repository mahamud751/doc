import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

// Define interfaces for data types
interface NotificationData {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface OrderUpdateData {
  orderId: string;
  status: string;
  // Add other order update properties as needed
}

interface AppointmentUpdateData {
  appointmentId: string;
  status: string;
  // Add other appointment update properties as needed
}

interface CallData {
  callId: string;
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  appointmentId: string;
  channelName: string;
}

interface CallResponse {
  accepted: boolean;
  callerId: string;
  calleeId: string;
  appointmentId: string;
}

export function initializeSocketIO(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    allowEIO3: true,
    transports: ["websocket", "polling"],
    cookie: false,
  });

  // Store connected users
  const connectedUsers = new Map<string, string>(); // userId -> socketId
  // Store active calls
  const activeCalls = new Map<string, CallData>();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Handle authentication
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log("Unauthorized connection attempt");
      socket.disconnect(true);
      return;
    }

    // In a real implementation, you would verify the token and extract user info
    // For now, we'll simulate this
    const userId = `user_${socket.id.substring(0, 8)}`;
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} authenticated with socket ${socket.id}`);

    // Handle joining notifications room
    socket.on("join-notifications", () => {
      socket.join(`notifications_${userId}`);
      console.log(`User ${userId} joined notifications room`);
    });

    // Handle joining appointment room
    socket.on("join-appointment", (appointmentId: string) => {
      socket.join(`appointment_${appointmentId}`);
      console.log(`User ${userId} joined appointment room ${appointmentId}`);
    });

    // Handle leaving appointment room
    socket.on("leave-appointment", (appointmentId: string) => {
      socket.leave(`appointment_${appointmentId}`);
      console.log(`User ${userId} left appointment room ${appointmentId}`);
    });

    // Handle status updates
    socket.on("update-status", (data: { status: string }) => {
      console.log(`User ${userId} updated status to ${data.status}`);
      // Broadcast status update to relevant users
      socket.broadcast.emit("doctor-status-change", {
        doctorId: userId,
        status: data.status,
      });
    });

    // Handle sending messages
    socket.on("send-message", (data: any) => {
      console.log(`Message from ${userId}:`, data);
      // Broadcast message to appointment room
      socket.to(`appointment_${data.appointmentId}`).emit("new-message", data);
    });

    // Handle heartbeat
    socket.on("heartbeat", (data: { timestamp: number }) => {
      console.log(`Heartbeat from ${userId} at ${data.timestamp}`);
      // Send acknowledgment back
      socket.emit("heartbeat-ack", { timestamp: data.timestamp });
    });

    // Handle call initiation
    socket.on("initiate-call", (callData: CallData) => {
      console.log(`Call initiated by ${userId}:`, callData);

      // Store the call
      activeCalls.set(callData.callId, callData);

      // Find the callee's socket
      const calleeSocketId = connectedUsers.get(callData.calleeId);
      if (calleeSocketId) {
        // Send incoming call notification to callee
        socket.to(calleeSocketId).emit("incoming-call", callData);
        console.log(`Sent incoming call to ${callData.calleeId}`);
      } else {
        console.log(`Callee ${callData.calleeId} not connected`);
        // Notify caller that callee is not available
        socket.emit("call-error", {
          callId: callData.callId,
          error: "Callee is not available",
        });
      }
    });

    // Handle call response
    socket.on("call-response", (response: CallResponse) => {
      console.log(`Call response from ${userId}:`, response);

      // Find the caller's socket
      const callerSocketId = connectedUsers.get(response.callerId);
      if (callerSocketId) {
        // Send response to caller
        socket.to(callerSocketId).emit("call-response", response);
        console.log(`Sent call response to ${response.callerId}`);
      }

      // If call was rejected, remove it from active calls
      if (!response.accepted) {
        // Find and remove the call
        for (const [callId, callData] of activeCalls.entries()) {
          if (
            callData.callerId === response.callerId &&
            callData.calleeId === response.calleeId
          ) {
            activeCalls.delete(callId);
            break;
          }
        }
      }
    });

    // Handle call ended
    socket.on("call-ended", (callId: string) => {
      console.log(`Call ended by ${userId}: ${callId}`);

      // Remove call from active calls
      activeCalls.delete(callId);

      // Broadcast call ended to both parties
      socket.broadcast.emit("call-ended", callId);
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log("User disconnected:", socket.id, "Reason:", reason);

      // Remove user from connected users
      let disconnectedUserId = "";
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          disconnectedUserId = userId;
          break;
        }
      }

      // If we found the disconnected user, notify any pending calls
      if (disconnectedUserId) {
        // Check if this user was involved in any active calls
        for (const [callId, callData] of activeCalls.entries()) {
          if (
            callData.callerId === disconnectedUserId ||
            callData.calleeId === disconnectedUserId
          ) {
            // Notify the other party that the call has ended
            const otherUserId =
              callData.callerId === disconnectedUserId
                ? callData.calleeId
                : callData.callerId;

            const otherSocketId = connectedUsers.get(otherUserId);
            if (otherSocketId) {
              socket.to(otherSocketId).emit("call-ended", callId);
            }

            // Remove the call
            activeCalls.delete(callId);
          }
        }
      }
    });
  });

  return io;
}

// Function to send notification to user
export function sendNotificationToUser(
  io: SocketIOServer,
  userId: string,
  notification: NotificationData
) {
  io.to(`notifications-${userId}`).emit("notification", notification);
}

// Function to update order status in real-time
export function broadcastOrderUpdate(
  io: SocketIOServer,
  orderUpdate: OrderUpdateData
) {
  io.emit("order-update", orderUpdate);
}

// Function to notify appointment updates
export function notifyAppointmentUpdate(
  io: SocketIOServer,
  appointmentId: string,
  update: AppointmentUpdateData
) {
  io.to(`appointment-${appointmentId}`).emit("appointment-update", update);
}
