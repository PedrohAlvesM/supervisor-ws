import { Server, Socket } from "socket.io";
import { InstructorController } from "@controller/instructor.controller";

export default function instructorEvents(io: Server, socket: Socket) {
  socket.on("instructor_broadcast", async (payload) => {
    await InstructorController.broadcastToRoom(io, socket, payload);
  });

  socket.on("instructor_message_to_student", async (payload) => {
    await InstructorController.messageToStudent(io, socket, payload);
  });
}