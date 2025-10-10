import { Server, Socket } from "socket.io";
import instructorEvents from "./instructor.events";
import roomEvents from "./room.events";
import studentEvents from "./student.events";

export default function registerEvents(io: Server, socket: Socket) {
  instructorEvents(io, socket);
  roomEvents(io, socket);
  studentEvents(io, socket);
}
