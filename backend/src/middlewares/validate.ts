import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query
    });
    if (parsed.body !== undefined) req.body = parsed.body;
    next();
  };
};
