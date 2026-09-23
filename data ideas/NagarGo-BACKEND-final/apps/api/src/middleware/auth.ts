import { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler";
import { verifyAccessToken, AccessTokenPayload } from "../services/jwtService";
import { AdminAccount } from "../models/AdminAccount";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AccessTokenPayload;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError("Authentication required.", 401);
  }

  const token = header.slice("Bearer ".length);
  const payload = verifyAccessToken(token);
  if (!payload) {
    throw new AppError("Invalid or expired session.", 401);
  }

  if (payload.role === "ADMIN") {
    const admin = await AdminAccount.findById(payload.sub).select("sessionVersion status");
    if (!admin || admin.status !== "ACTIVE" || admin.sessionVersion !== (payload.sessionVersion ?? 0)) throw new AppError("Invalid or expired session.", 401);
  }
  req.auth = payload;
  next();
}

/** Restricts a route to one or more roles (CUSTOMER, RIDER, ADMIN). */
export function requireRole(...roles: AccessTokenPayload["role"][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      throw new AppError("You do not have permission to do that.", 403);
    }
    next();
  };
}

/**
 * Object-level authorization helper: confirms the authenticated
 * subject actually owns the resource being accessed, so a
 * customer or rider can never reach another party's order by ID
 * alone. Call this inside controllers after loading the resource.
 */
export function assertOwnsResource(ownerId: string, requesterId: string, message = "Not found.") {
  if (String(ownerId) !== String(requesterId)) {
    throw new AppError(message, 404); // 404, not 403 — avoid confirming the resource exists.
  }
}
