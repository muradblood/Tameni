import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initSocketIO(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log("[Socket.IO] Client connected:", socket.id);

    socket.on("joinAdmin", () => {
      socket.join("admin");
      console.log("[Socket.IO] Admin joined:", socket.id);
    });

    socket.on("joinVisitor", (ip: string) => {
      socket.join(`visitor:${ip}`);
      console.log("[Socket.IO] Visitor joined:", ip);
    });

    socket.on("disconnect", () => {
      console.log("[Socket.IO] Client disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// إرسال حدث لجميع المشرفين
export function emitToAdmins(event: string, data: unknown) {
  io?.to("admin").emit(event, data);
}

// إرسال حدث لزائر محدد
export function emitToVisitor(ip: string, event: string, data: unknown) {
  io?.to(`visitor:${ip}`).emit(event, data);
}

// إرسال حدث لجميع الزوار
export function emitToAll(event: string, data: unknown) {
  io?.emit(event, data);
}
