import { Server, Socket } from "socket.io";
import { RedisController } from "./redis.controller";
import { z } from "zod";
import { Room, ConnectPayload } from "@typesWs/room";
import { LogController } from "./log.controller";
import { studentContoller } from "./student.controller";
import { timerController } from "./timer.controller";
interface Result {
  success: boolean;
  message: string;
  data?: any;
}

// Schema do payload de entrada
const toConnectSchema = z.object({
  roomId: z.string().trim().length(8),
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(["student", "instructor"])
});

export const RoomController = {
  async authenticateRoom(roomId: string): Promise<Result> {
    const room = await RedisController.getRoom(roomId);
    if (!room) {
      return { success: false, message: "Room not found" };
    }
    return { success: true, message: "Room found", data: room };
  },

  async joinRoom(io: Server, socket: Socket, payload: unknown): Promise<void> {
    LogController.LogEvent("Join Room", `Socket tentando entrar na sala: ${JSON.stringify(payload)}`);
    const parsed = toConnectSchema.safeParse(payload);
    if (!parsed.success) {
      io.to(socket.id).emit("error", {
        success: false,
        message: parsed.error,
      });
      return;
    }

    const { roomId, role, id, name } = parsed.data;
    const auth = await this.authenticateRoom(roomId);
    if (!auth.success) {
      io.to(socket.id).emit("error", {
        success: false,
        message: "RoomID not found",
      });
      return;
    }

    const room: Room = auth.data;

    this.updateRoom(io, socket, "join", {roomId, id, name, role});

    socket.join(room.id);

    io.to(socket.id).emit("join_room", {
      success: true,
      message: `Connected successfully`,
    });
  },

  async leaveRoom(io: Server, socket: Socket, payload: ConnectPayload): Promise<void> {
    const room = await RedisController.getRoom(payload.roomId);
    if (!room) {
      io.to(socket.id).emit("error", { success: false, message: "Room not found" });
      return;
    }

    this.updateRoom(io, socket, "leave", payload);

    socket.leave(payload.roomId);

    io.to(socket.id).emit("leave_room", {
      success: true,
      message: `Left room ${payload.roomId} successfully`,
    });
  },

  async updateRoom( io: Server, socket: Socket, action: 'join' | 'leave', payload?: ConnectPayload): Promise<void> {

    const roomId = action === 'join' ? payload!.roomId : socket.data.roomId;
    if (!roomId) {
      LogController.LogError("UpdateRoom", `Action '${action}' failed for socket ${socket.id}: roomId is missing.`);
      return;
    }

    const auth = await this.authenticateRoom(roomId);
    if (!auth.success) {
      LogController.LogEvent("UpdateRoom", `Room ${roomId} not found. No update performed.`);
      return;
    }

    const room: Room = auth.data!;

    if (action === 'join') {
      if (!payload) {
        LogController.LogError("UpdateRoom", `Join action for room ${roomId} failed: payload is missing.`);
        return;
      }

      socket.data.roomId = roomId;
      socket.data.role = payload.role;

      if (payload.role === 'student') {
        const student = { id: payload.id, name: payload.name };
        studentContoller.reconnect(room, student);
        room.students.set(socket.id, student);
        LogController.LogEvent("UpdateRoom", `Student ${payload.name} (${socket.id}) JOINED Room ${roomId}`);
      } else {
        const instructor = { id: socket.id, name: payload.name };
        room.instructor = instructor;
        LogController.LogEvent("UpdateRoom", `Instructor ${payload.name} (${socket.id}) JOINED Room ${roomId}`);
      }
    } else {
      if (socket.data.role === 'student' && room.students.has(socket.id)) {
        const studentName = room.students.get(socket.id)?.name || 'Unknown';
        room.students.delete(socket.id);
        LogController.LogEvent("UpdateRoom", `Student ${studentName} (${socket.id}) LEFT Room ${roomId}`);
      } else if (socket.data.role === 'instructor' && room.instructor?.id === socket.id) {
        const instructorName = room.instructor.name;
      
        room.instructor = null;
        LogController.LogEvent("UpdateRoom", `Instructor ${instructorName} (${socket.id}) LEFT Room ${roomId}`);
      }
    }
  
    await RedisController.setRoom(room);

    const serializableRoom = {
      ...room,
      students: Object.fromEntries(room.students) // Map to object 
    };

    io.to(roomId).emit("room_update", serializableRoom);
  },

  async startTest(io: Server, socket: Socket, roomId: string) {
    const idSchema = z.string().length(8)
    const parse = idSchema.safeParse(roomId);

    if (parse.error) {
      return io.to(socket.id).emit("error", parse.error.message);
    }

    const auth = await this.authenticateRoom(parse.data!);
    if (!auth.success) {
      return io.to(socket.id).emit("error", auth.message);
    }

    const room: Room = auth.data;

    if (room.status !== "waiting") {
      return io.to(socket.id).emit("error", "Prova não pode começar porque a sala não estava no estado correto.");
    } 
    else if (socket.id !== room.instructor!.id) {
      return io.to(socket.id).emit("error", "Você não tem permissão para iniciar a prova.")
    }
    room.status = "in_progress";
    const serializableRoom = {
      ...room,
      students: Object.fromEntries(room.students) // Map to object 
    };
    await RedisController.setRoom(room);

    timerController.startTimer(io, room.id, room.time_limit);

    io.to(roomId).emit("room_update", serializableRoom);
  },

  async endTest(io: Server, roomId: string): Promise<void> {
    const auth = await this.authenticateRoom(roomId);
    if (!auth.success) return;

    const room = auth.data!;
    room.status = 'finished';

    const serializableRoom = { ...room, students: Object.fromEntries(room.students) };
    io.to(roomId).emit("room_update", serializableRoom);
    LogController.LogEvent("RoomController", `Test in room ${roomId} has ended.`);
    await RedisController.deleteRoom(room.id);
  }
};
