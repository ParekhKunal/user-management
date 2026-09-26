import type { NextFunction, Request, Response } from "express";
import { forbidden, unauthorized } from "../utils/app-error.js";

export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(unauthorized("Authentication required"));
    return;
  }

  if (req.user.role !== "super-admin") {
    next(forbidden("Only Super Admin can manage role permissions"));
    return;
  }

  next();
}
