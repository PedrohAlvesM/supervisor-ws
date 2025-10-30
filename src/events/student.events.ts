import { studentContoller } from "@controller/student.controller";
import { Server, Socket } from "socket.io";

export default function studentEvents(io: Server, socket: Socket) {
    socket.on("student_message", async (payload) => {await studentContoller.sendMessageToInstructor(io, socket, payload)});
    socket.on("student_off_test", async (payload) => {await studentContoller.sendStudentOffTestStatus(io, socket, payload)});
}