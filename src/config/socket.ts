import { Server } from "socket.io";
import http from "http";
import dotenv from 'dotenv';
import { LogController } from "@controller/log.controller";
import { readFileSync } from "fs";

dotenv.config();
const HOST = process.env.SERVER_HOST;

export default function createSocketServer(server: http.Server) {
  const io = new Server(server, {
    cors: {
      origin: HOST, 
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    LogController.LogEvent('Socket', `Connected: ${socket.id}`);

    socket.on("disconnect", () => {
      LogController.LogEvent('Socket', `Disconnected: ${socket.id}`);
    });
  });

  return io;
}