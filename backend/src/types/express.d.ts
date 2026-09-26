import type { UserRole } from "../models/user.model.js";
import type { Permission } from "../constants/permissions.js";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        id: string;
        role: UserRole;
        permissions: Permission[];
        employeeId: string | null;
      };
    }
  }
}

export {};
