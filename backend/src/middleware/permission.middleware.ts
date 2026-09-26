import type { NextFunction, Request, Response } from "express";
import type { Permission } from "../constants/permissions.js";
import { forbidden, unauthorized } from "../utils/app-error.js";

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(unauthorized("Authentication required"));
      return;
    }

    const granted = req.user.permissions;
    const allowed = permissions.some((permission) => granted.includes(permission));
    if (!allowed) {
      next(forbidden("Missing required permission"));
      return;
    }

    next();
  };
}
