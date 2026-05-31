import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  // Log the full error to the backend console so developers can debug it easily
  console.error("Error caught by errorHandler:", err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      details: err.flatten()
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      code: err.code
    });
  }

  // Handle express body-parser limit (PayloadTooLargeError)
  if (err.name === "PayloadTooLargeError" || err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({
      message: "Request payload is too large. Please upload a smaller file or send less data.",
      code: "PAYLOAD_TOO_LARGE"
    });
  }

  // Handle Multer upload size limit error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File size exceeds the limit of 10MB.",
      code: "FILE_TOO_LARGE"
    });
  }

  return res.status(err.status || 500).json({ 
    message: err.message || "Internal server error",
    code: err.code || "INTERNAL_SERVER_ERROR"
  });
};
