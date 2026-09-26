import type { NextFunction, Request, Response } from "express";
import { Employee } from "../models/employee.model.js";
import { User } from "../models/user.model.js";
import { resolveStoredRolePermissions } from "../services/role-permissions.js";
import { unauthorized } from "../utils/app-error.js";
import { verifyAccessToken } from "../utils/jwt.js";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw unauthorized("Authentication required");
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      throw unauthorized("Authentication required");
    }

    const payload = verifyAccessToken(token);
    const user = await User.findOne({ _id: payload.sub, deletedAt: null });

    if (!user) {
      throw unauthorized("User not found");
    }

    if (user.status !== "active") {
      throw unauthorized("Account is not active");
    }

    const employee = await Employee.findOne({ userId: user._id, deletedAt: null }).select("_id");

    req.user = {
      id: user.id,
      role: user.role,
      permissions: await resolveStoredRolePermissions(user.role, user.permissions),
      employeeId: employee ? String(employee._id) : null,
    };

    next();
  } catch (error) {
    next(error);
  }
}
