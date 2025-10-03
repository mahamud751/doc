// src/lib/socket-initializer.ts
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export const initSocketIO = (httpServer: HttpServer) => {
  if (!io) {
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      console.log("A user connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });

      socket.on("join-notifications", (userId) => {
        socket.join(`notifications_${userId}`);
        console.log(`User ${userId} joined notifications room`);
      });

      socket.on("send-heartbeat", (data) => {
        socket.emit("heartbeat-response", { timestamp: Date.now(), ...data });
      });
    });

    console.log("Socket.IO initialized");
  }

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
};
