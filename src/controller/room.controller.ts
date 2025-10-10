import { Server, Socket } from "socket.io";
import { RedisController } from "./redis.controller";
import { z } from "zod";
import { Room, Student, Instructor, studentSchema, instructorSchema } from "@typesWs/room";
import { LogController } from "./log.controller";
interface Result {
  success: boolean;
  message: string;
  data?: any;
}

// Schema do payload de entrada
const toConnectSchema = z.object({
  roomId: z.string().trim().length(8),
  toJoin: z.union([
    studentSchema,
    instructorSchema
  ]),
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
    const parsed = toConnectSchema.safeParse(payload);
    if (!parsed.success) {
      io.to(socket.id).emit("error", {
        success: false,
        message: "RoomID invalid or Student/Instructor invalid",
      });
      return;
    }

    const { roomId, toJoin } = parsed.data;
    const auth = await this.authenticateRoom(roomId);
    if (!auth.success) {
      io.to(socket.id).emit("error", {
        success: false,
        message: "RoomID not found",
      });
      return;
    }

    const room: Room = auth.data;
    socket.join(room.id);

    if ("studentId" in toJoin) {
      const student = toJoin as Student;
      room.students.set(toJoin.id, student);
      await RedisController.setRoom(room);
      LogController.LogEvent("RoomController", `Student ${student.id} connected to Room ${roomId}`);
    } else {
      const instructor = toJoin as Instructor;
      room.instructor = instructor;
      await RedisController.setRoom(room);
      LogController.LogEvent("RoomController", `Instructor ${instructor.id} connected to Room ${roomId}`);
    }

    io.to(socket.id).emit("join_room", {
      success: true,
      message: `Connected successfully`,
    });

    io.to(roomId).emit("room_update", room);
  },

  async leaveRoom(io: Server, socket: Socket, payload: { roomId: string; userId: string }): Promise<void> {
    const { roomId, userId } = payload;

    const room = await RedisController.getRoom(roomId);
    if (!room) {
      io.to(socket.id).emit("error", { success: false, message: "Room not found" });
      return;
    }

    if (room.instructor?.id === userId) {
      room.instructor = { id: "", name: "" }; 
      LogController.LogEvent("RoomController", `Instructor ${userId} left room ${roomId}`);
    } else if (room.students.get(userId)) {
      room.students.delete(userId);
      LogController.LogEvent("RoomController", `Student ${userId} left room ${roomId}`);
    }

    await RedisController.setRoom(room);
    socket.leave(roomId);

    io.to(roomId).emit("room_update", room);
    io.to(socket.id).emit("leave_room", {
      success: true,
      message: `Left room ${roomId} successfully`,
    });
  },
};
