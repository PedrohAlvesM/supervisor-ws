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
  status: z.boolean(),
  students: z.record(z.string(), studentSchema), //Map -> {}
  instructor: instructorSchema,
  test_id: z.number(),
});

export const roomSchema = z.object({
  id: z.string().length(8),
  status: z.boolean(),
  students: rawRoomSchema.shape.students.transform((obj) => new Map(Object.entries(obj))), //{} -> Map
  instructor: instructorSchema,
  test_id: z.number()
});


export type Student = z.infer<typeof studentSchema>;
export type Instructor = z.infer<typeof instructorSchema>;
export type Room = z.infer<typeof roomSchema>;
export type RawRoom = z.infer<typeof rawRoomSchema>;
