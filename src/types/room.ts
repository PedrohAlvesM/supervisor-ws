import z from "zod";

export const studentSchema = z.object({
  id: z.string().trim().length(8),
  name: z.string().trim().min(1),
  studentId: z.string().trim().min(1)
});

export const instructorSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const roomSchema = z.object({
  id: z.string().length(8),
  status: z.boolean(),
  students: z.map(z.string(), studentSchema),
  instructor: instructorSchema,
});

export type Student = z.infer<typeof studentSchema>;
export type Instructor = z.infer<typeof instructorSchema>;
export type Room = z.infer<typeof roomSchema>;
