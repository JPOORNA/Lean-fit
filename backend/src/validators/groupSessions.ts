import { z } from "zod";

export const groupSessionCreateSchema = z.object({
  body: z.object({
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start time" }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end time" }),
    pricePaise: z.number().int().min(0),
    maxPeople: z.number().int().min(1)
  })
});

export const groupSessionUpdateSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    pricePaise: z.number().int().min(0),
    maxPeople: z.number().int().min(1)
  })
});

export const groupSessionBookSchema = z.object({
  params: z.object({
    id: z.string()
  })
});
