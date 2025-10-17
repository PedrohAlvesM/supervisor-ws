import z from "zod";

export const studentSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1),
});

export const instructorSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
});

export const rawRoomSchema = z.object({
  id: z.string().length(8),
  status: z.enum(["waiting", "in_progress", "finished"]),
  students: z.record(z.string(), studentSchema), //Map -> {}
  instructor: instructorSchema,
  test_id: z.number(),
  time_limit: z.number()
});

export const roomSchema = z.object({
  id: z.string().length(8),
  status: z.enum(["waiting", "in_progress", "finished"]),
  students: rawRoomSchema.shape.students.transform((obj) => new Map(Object.entries(obj))), //{} -> Map
  instructor: instructorSchema.nullable(),
  test_id: z.number(),
  time_limit: z.number()
});

export const connectPayloadSchema = z.object({
  roomId: z.string({ required_error: "Room ID is required" })
           .min(1, "Room ID cannot be empty"),

  role: z.enum(['student', 'instructor'], {
    required_error: "Role is required",
    invalid_type_error: "Role must be either 'student' or 'instructor'",
  }),
  
  id: z.string({ required_error: "User ID is required" })
      .min(1, "User ID cannot be empty"), 

  name: z.string({ required_error: "Name is required" })
        .min(2, "Name must be at least 2 characters long"),
});


export type Student = z.infer<typeof studentSchema>;
export type Instructor = z.infer<typeof instructorSchema>;
export type Room = z.infer<typeof roomSchema>;
export type RawRoom = z.infer<typeof rawRoomSchema>;
export type ConnectPayload = z.infer<typeof connectPayloadSchema>;