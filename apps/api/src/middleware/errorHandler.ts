import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { isProduction } from "../config/env";

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: "Not found" } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  const isAppError = err instanceof AppError;

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        message: "Validation failed",
        errors: err.flatten().fieldErrors,
      },
    });
    return;
  }

  // Mongo duplicate-key errors (E11000) are a routine validation
  // outcome (phone/email/username already taken), not a server
  // fault — surface them as a clean 409 instead of a raw Mongo
  // error message or a generic 500.
  const mongoErr = err as { code?: number; keyPattern?: Record<string, unknown> };
  if (!isAppError && mongoErr?.code === 11000) {
    const field = Object.keys(mongoErr.keyPattern ?? {})[0] ?? "value";
    res.status(409).json({ error: { message: `This ${field} is already registered.` } });
    return;
  }

  const statusCode = isAppError ? err.statusCode : 500;

  const message = isAppError || !isProduction
    ? (err as Error).message
    : "Something went wrong. Please try again.";

  if (!isAppError) {
    // Log full detail server-side; never send it to the client.
    console.error("[unhandled error]", err);
  }

  res.status(statusCode).json({ error: { message } });
}
