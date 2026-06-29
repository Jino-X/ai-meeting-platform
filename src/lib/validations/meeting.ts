import { z } from "zod";

export const createMeetingSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  participants: z.array(z.string().email()).optional().default([]),
  scheduledAt: z.coerce.date().optional(),
  duration: z.number().int().positive().optional(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});

export const updateMeetingSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  participants: z.array(z.string().email()).optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
