import { Server, Socket } from "socket.io";
import { ClientMessage, InstructorToStudentMessagePayload } from "@typesWs/client";
import { LogController } from "./log.controller";
import { Room, Student, StudentOffTestStatus, studentOffTestStatusSchema } from "@typesWs/room";

export const studentContoller = {
    async sendMessageToInstructor(io: Server, socket: Socket, { instructorSocketId, message}: InstructorToStudentMessagePayload) {
        try {
            if (!instructorSocketId) throw new Error("Missing InstructorSocketId");
            LogController.LogEvent("on student message", String(message.data));
            const send: ClientMessage = {
              id: socket.id,
              questionId: message.questionId,
              questionType: message.questionType,
              data: message.data
            }
            io.to(instructorSocketId).emit("receive_instructor_message", send);
        } catch (err: any) {
            console.error("InstructorController", `messageToStudent error: ${err.message}`);
            socket.emit("error", { error: err.message });
        }
    },

    async sendStudentOffTestStatus(io: Server, socket: Socket, payload: StudentOffTestStatus) {
      const parse = studentOffTestStatusSchema.safeParse(payload);
      if (parse.error) {
        return io.to(socket.id).emit("error", parse.error.message);
      }
      const {status, roomId, studentId, instructorId} = parse.data;
      LogController.LogEvent("Student off Test", `Student ${studentId} is ${status ? 'back on Test' : 'off Test'} on ${roomId} to instructor ${instructorId}`);

      return io.to(instructorId).emit('student_off_test', {status, roomId, studentId, instructorId});
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