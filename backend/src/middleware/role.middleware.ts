import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../models/user.model.js";
import { forbidden, unauthorized } from "../utils/app-error.js";

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(unauthorized("Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(forbidden());
      return;
    }

    next();
  };
}
