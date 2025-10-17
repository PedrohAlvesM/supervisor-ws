import { Server, Socket } from "socket.io";
import { InstructorToStudentMessagePayload } from "@typesWs/client";
import { LogController } from "./log.controller";
import { Room, Student } from "@typesWs/room";

export const studentContoller = {
    async sendMessageToInstructor(io: Server, socket: Socket, { instructorSocketId, message}: InstructorToStudentMessagePayload) {
        try {
            if (!instructorSocketId) throw new Error("Missing InstructorSocketId");
            LogController.LogEvent("on student message", String(message.data));
            io.to(instructorSocketId).emit("receive_instructor_message", {
                from: "student",
                message: message
            });
        } catch (err: any) {
            console.error("InstructorController", `messageToStudent error: ${err.message}`);
            socket.emit("error", { error: err.message });
        }
    },

    reconnect(room: Room, student: Student) {
        let oldSocketId: string | null = null;
        for (const [socketId, existingStudent] of room.students.entries()) {
          if (existingStudent.id === student.id) {
            oldSocketId = socketId;
            break;
          }
        }

        if (oldSocketId) {
          room.students.delete(oldSocketId);
          LogController.LogEvent(
            "UpdateRoom", 
            `Student ${student.name} (ID: ${student.id}) RECONNECTED.`
          );
        }
    }
}