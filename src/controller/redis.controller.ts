import { redisStore } from "@config/redis";
import { Student, Room, Instructor, studentSchema, instructorSchema, roomSchema, rawRoomSchema, RawRoom } from "@typesWs/room";
import dotenv from "dotenv";
import { LogController } from "./log.controller";

dotenv.config();

export const RedisController = {
  async setKey<T>(key: string, value: T, expireSeconds?: number): Promise<void> {
    const json = JSON.stringify(value);
    await redisStore.set(key, json);
    if (expireSeconds) await redisStore.expire(key, expireSeconds);
  },

  async getKey<T>(key: string): Promise<T | null> {
    const data = await redisStore.get(key);
    return data ? JSON.parse(data) : null;
  },

  async setRoom(room: Room): Promise<void> {
    const roomForStorage = {
        ...room,
        students: Object.fromEntries(room.students),
    };
    const r = rawRoomSchema.parse(roomForStorage);
    await this.setKey<RawRoom>(`${process.env.REDIS_PREFIX}-room:${room.id}`, r);
  },

  async getRoom(roomId: string): Promise<Room | null> {
    const room = await this.getKey<Room>(`${process.env.REDIS_PREFIX}-room:${roomId}`);
    if (!room) return null;
    try {
      LogController.LogEvent("Dados de GetRoom", JSON.stringify(room));
      return roomSchema.parse(room);
    } catch (e) {
      LogController.LogError("Redis GetRoom", JSON.stringify(e));
      return null;
    }
  },

  async getStudents(roomId: string): Promise<Student[] | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;
    return Object.values(room.students);
  },

  async getStudentById(roomId: string, studentId: string): Promise<Student | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;
    const student = room.students.get(studentId);
    return student ? studentSchema.parse(student) : null;
  },

  async getInstructor(roomId: string): Promise<Instructor | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;
    return instructorSchema.parse(room.instructor);
  },

  async setStudent(roomId: string, student: Student): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    studentSchema.parse(student);

    if (student.id) {
      room.students.set(student.id, student)
      await this.setRoom(room);
    }

  },
  async deleteRoom(roomId: string): Promise<boolean> {
    const roomKey = `${process.env.REDIS_PREFIX}-room:${roomId}`;
    try {
      // The .del() command returns the number of keys that were removed.
      const result = await redisStore.del(roomKey);

      if (result > 0) {
        LogController.LogEvent("Redis DeleteRoom", `Successfully deleted room: ${roomKey}`);
        return true;
      } else {
        LogController.LogEvent("Redis DeleteRoom", `Room not found, no deletion needed: ${roomKey}`);
        return false;
      }
    } catch (error) {
      LogController.LogError("Redis DeleteRoom", `Error deleting room ${roomKey}: ${JSON.stringify(error)}`);
      return false;
    }
},
};