import { redisStore } from "@config/redis";
import { Student, Room, Instructor, studentSchema, instructorSchema, roomSchema } from "@typesWs/room";

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
    roomSchema.parse(room);
    await this.setKey<Room>(`room:${room.id}`, room);
  },

  async getRoom(roomId: string): Promise<Room | null> {
    const room = await this.getKey<Room>(`room:${roomId}`);
    if (!room) return null;
    try {
      return roomSchema.parse(room);
    } catch {
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

    room.students.set(student.id, student);
    await this.setRoom(room);
  },
};