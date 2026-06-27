import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { config } from "../config.js";
import { HttpError } from "../utils/http-error.js";

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, `Route not found: ${req.method} ${req.path}`));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: error.issues
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      error: error.message,
      details: error.details
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    error: "Internal server error",
    details: config.nodeEnv === "production" ? undefined : String(error)
  });
}
