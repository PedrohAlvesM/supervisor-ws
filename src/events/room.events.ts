import { Server, Socket } from "socket.io";
import { RoomController } from "@controller/room.controller";

export default function roomEvents(io: Server, socket: Socket) {
  socket.on("join_room", async (payload) => {
    await RoomController.joinRoom(io, socket, payload);
  });

  socket.on("leave_room", async (payload) => {
    await RoomController.leaveRoom(io, socket, payload);
  });

  socket.on("room_update", async (payload) => {
    await RoomController.updateRoom(io, socket, payload);
  });

  socket.on("start_test", async (roomId) => {
    await RoomController.startTest(io, socket, roomId);
  });

  socket.on("end_test", async (roomId) => {
    await RoomController.endTest(io, roomId);
  });
}
