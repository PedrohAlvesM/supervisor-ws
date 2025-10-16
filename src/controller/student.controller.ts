import { Server, Socket } from "socket.io";
import { InstructorToStudentMessagePayload } from "@typesWs/client";
import { LogController } from "./log.controller";

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
    }
}