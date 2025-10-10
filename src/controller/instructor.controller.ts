import { Server, Socket } from "socket.io";
import { RedisController } from "@controller/redis.controller";
import { BroadcastPayload, StudentToInstructorMessagePayload } from "@typesWs/client";
import { LogController } from "./log.controller";

export const InstructorController = {
  async broadcastToRoom(io: Server, socket: Socket, { roomId, message }: BroadcastPayload) {
    try {
      const room = await RedisController.getRoom(roomId);
      if (!room) throw new Error(`Room ${roomId} not found`);

      io.to(roomId).emit("receive_instructor_message", {
        from: room.instructor.name,
        message,
      });

      LogController.LogEvent(`InstructorController`, `Broadcast to room ${roomId}: ${message}`);
    } catch (err: any) {
      LogController.LogError("InstructorController", err.message);
      socket.emit("error", { error: err.message });
    }
  },

  async messageToStudent(io: Server, socket: Socket, { studentSocketId, message }: StudentToInstructorMessagePayload) {
    try {
      if (!studentSocketId) throw new Error("Missing studentSocketId");

      io.to(studentSocketId).emit("receive_instructor_message", {
        from: "instructor",
        message,
      });

      LogController.LogEvent('InstructorController', `Message to ${studentSocketId}: ${message}`);
    } catch (err: any) {
      LogController.LogError("InstructorController", err.message);
      socket.emit("error", { error: err.message });
    }
  },
};
