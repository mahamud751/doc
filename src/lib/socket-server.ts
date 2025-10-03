"use client";

import { Server as SocketIOServer, Socket } from "socket.io";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";
import { User } from "@prisma/client";
import { Server as HttpServer } from "http";

interface DoctorData {
  userId: string;
  socketId: string;
  lastSeen: Date;
  status: "online" | "busy" | "away";
}

interface MessageData {
  appointmentId: string;
  message: string;
  toUserId: string;
}

interface OrderUpdateData {
  orderId: string;
  status: string;
  orderType: string;
  patientId: string;
}

interface StatusUpdateData {
  status: "online" | "busy" | "away";
}

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: Date;
  isRead: boolean;
}

interface AppointmentUpdateData {
  appointmentId: string;
  status: string;
  // Add other appointment update properties as needed
}

// Store for tracking online doctors
const onlineDoctors = new Map<string, DoctorData>();

export function initializeSocketIO(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Middleware for authentication
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = verifyJWT(token) as User & { userId: string };

      // Fetch user details
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          doctor_profile: true,
        },
      });

      if (!user || !user.is_active) {
        return next(new Error("User not found or inactive"));
      }

      (socket.data as { user: typeof user }).user = user;
      next();
    } catch (_error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket.data as { user: User & { doctor_profile?: unknown } })
      .user;
    console.log(`User connected: ${user.name} (${user.id})`);

    // Handle doctor status updates
    if (user.role === "DOCTOR" && user.doctor_profile) {
      // Add doctor to online list
      onlineDoctors.set(user.id, {
        userId: user.id,
        socketId: socket.id,
        lastSeen: new Date(),
        status: "online",
      });

      // Update doctor profile with online status
      prisma.doctorProfile
        .update({
          where: { user_id: user.id },
          data: { is_available_online: true },
        })
        .catch(console.error);

      // Broadcast doctor online status
      socket.broadcast.emit("doctor-status-change", {
        doctorId: user.id,
        doctorName: user.name,
        status: "online",
        timestamp: new Date(),
      });

      // Handle doctor status change
      socket.on("update-status", async (data: StatusUpdateData) => {
        const { status } = data; // 'online', 'busy', 'away'

        if (onlineDoctors.has(user.id)) {
          onlineDoctors.set(user.id, {
            ...onlineDoctors.get(user.id)!,
            status,
            lastSeen: new Date(),
          });

          // Broadcast status change
          io.emit("doctor-status-change", {
            doctorId: user.id,
            doctorName: user.name,
            status,
            timestamp: new Date(),
          });

          // Log status change
          await prisma.auditLog.create({
            data: {
              user_id: user.id,
              action: "UPDATE",
              resource: "DoctorStatus",
              resource_id: user.id,
              details: {
                new_status: status,
                socket_id: socket.id,
              },
            },
          });
        }
      });
    }

    // Handle appointment notifications
    socket.on("join-appointment", (appointmentId: string) => {
      socket.join(`appointment-${appointmentId}`);
      console.log(`${user.name} joined appointment ${appointmentId}`);
    });

    socket.on("leave-appointment", (appointmentId: string) => {
      socket.leave(`appointment-${appointmentId}`);
      console.log(`${user.name} left appointment ${appointmentId}`);
    });

    // Handle real-time messaging
    socket.on("send-message", async (data: MessageData) => {
      const { appointmentId, message, toUserId } = data;

      try {
        // Save message to database
        const savedMessage = await prisma.message.create({
          data: {
            from_user_id: user.id,
            to_user_id: toUserId,
            appointment_id: appointmentId,
            body: message,
            is_read: false,
          },
          include: {
            from_user: {
              select: { name: true, role: true },
            },
          },
        });

        // Send to appointment room
        io.to(`appointment-${appointmentId}`).emit("new-message", {
          id: savedMessage.id,
          message: savedMessage.body,
          from: {
            id: savedMessage.from_user_id,
            name: savedMessage.from_user.name,
            role: savedMessage.from_user.role,
          },
          timestamp: savedMessage.created_at,
          appointmentId,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message-error", { error: "Failed to send message" });
      }
    });

    // Handle order status updates
    socket.on("order-status-update", (data: OrderUpdateData) => {
      const { orderId, status, orderType, patientId } = data;

      // Emit to patient
      io.emit("order-update", {
        orderId,
        status,
        orderType,
        patientId,
        timestamp: new Date(),
      });
    });

    // Handle notification system
    socket.on("join-notifications", () => {
      socket.join(`notifications-${user.id}`);
    });

    // Handle heartbeat for tracking online status
    socket.on("heartbeat", () => {
      if (user.role === "DOCTOR" && onlineDoctors.has(user.id)) {
        const doctorData = onlineDoctors.get(user.id)!;
        onlineDoctors.set(user.id, {
          ...doctorData,
          lastSeen: new Date(),
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${user.name} (${user.id})`);

      if (user.role === "DOCTOR" && onlineDoctors.has(user.id)) {
        // Remove from online doctors
        onlineDoctors.delete(user.id);

        // Update doctor profile
        await prisma.doctorProfile
          .update({
            where: { user_id: user.id },
            data: { is_available_online: false },
          })
          .catch(console.error);

        // Broadcast doctor offline status
        socket.broadcast.emit("doctor-status-change", {
          doctorId: user.id,
          doctorName: user.name,
          status: "offline",
          timestamp: new Date(),
        });
      }
    });
  });

  // Cleanup function to remove stale connections
  setInterval(() => {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [doctorId, data] of onlineDoctors.entries()) {
      if (now.getTime() - data.lastSeen.getTime() > staleThreshold) {
        onlineDoctors.delete(doctorId);

        // Update database
        prisma.doctorProfile
          .update({
            where: { user_id: doctorId },
            data: { is_available_online: false },
          })
          .catch(console.error);

        // Broadcast offline status
        io.emit("doctor-status-change", {
          doctorId,
          status: "offline",
          timestamp: now,
        });
      }
    }
  }, 60000); // Check every minute

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
