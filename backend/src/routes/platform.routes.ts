import { Router } from "express";
import * as invitationController from "../controllers/invitation.controller.js";
import * as miscController from "../controllers/misc.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { requireSuperAdmin } from "../middleware/super-admin.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { acceptInvitationSchema } from "../validators/employee.validator.js";
import { listAuditQuerySchema } from "../validators/audit.validator.js";
import {
  createRoleSchema,
  replaceRolePermissionsSchema,
  roleIdParamSchema,
  updateOrganizationSchema,
  updateRoleSchema,
} from "../validators/organization.validator.js";

export const invitationRouter = Router();
invitationRouter.get("/:token", invitationController.getInvitation);
invitationRouter.post("/accept", validate(acceptInvitationSchema), invitationController.acceptInvitation);

export const organizationRouter = Router();
organizationRouter.use(authenticate);
organizationRouter.get("/tree", requirePermission("departments.read"), miscController.organizationTree);

export const settingsRouter = Router();
settingsRouter.use(authenticate);
settingsRouter.get("/organization", requirePermission("settings.read"), miscController.getSettings);
settingsRouter.patch("/organization", requirePermission("settings.update"), validate(updateOrganizationSchema), miscController.updateSettings);

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);
dashboardRouter.get("/summary", miscController.dashboardSummary);
dashboardRouter.get("/recent-activity", miscController.dashboardActivity);
dashboardRouter.get("/team-summary", miscController.dashboardTeam);

export const auditRouter = Router();
auditRouter.use(authenticate);
auditRouter.get("/", requirePermission("audit.read"), validate(listAuditQuerySchema, "query"), miscController.auditLogs);

export const roleRouter = Router();
roleRouter.use(authenticate, requireSuperAdmin);
roleRouter.get("/", miscController.listRoles);
roleRouter.post("/", validate(createRoleSchema), miscController.createRole);
roleRouter.put(
  "/:id/permissions",
  validate(roleIdParamSchema, "params"),
  validate(replaceRolePermissionsSchema),
  miscController.replaceRolePermissions
);
roleRouter.post(
  "/:id/permissions/reset",
  validate(roleIdParamSchema, "params"),
  miscController.resetRolePermissions
);
roleRouter.get("/:id", validate(roleIdParamSchema, "params"), miscController.getRole);
roleRouter.patch("/:id", validate(roleIdParamSchema, "params"), validate(updateRoleSchema), miscController.updateRole);
roleRouter.delete("/:id", validate(roleIdParamSchema, "params"), miscController.deleteRole);

export const permissionRouter = Router();
permissionRouter.use(authenticate, requireSuperAdmin);
permissionRouter.get("/", miscController.listPermissions);
