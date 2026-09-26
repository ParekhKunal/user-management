import { Router } from "express";
import * as leaveController from "../controllers/leave.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { objectIdParamSchema } from "../validators/common.validator.js";
import { createLeaveSchema, listLeavesQuerySchema, reviewLeaveSchema } from "../validators/leave.validator.js";

const router = Router();
router.use(authenticate);

router.get("/types", requirePermission("leave.read"), leaveController.types);
router.get("/me", requirePermission("leave.read"), validate(listLeavesQuerySchema, "query"), leaveController.listMine);
router.get("/team", requirePermission("leave.read"), validate(listLeavesQuerySchema, "query"), leaveController.listTeam);
router.post("/", requirePermission("leave.create"), validate(createLeaveSchema), leaveController.create);
router.get("/:id", requirePermission("leave.read"), validate(objectIdParamSchema, "params"), leaveController.getOne);
router.patch("/:id/approve", requirePermission("leave.approve"), validate(objectIdParamSchema, "params"), validate(reviewLeaveSchema), leaveController.approve);
router.patch("/:id/reject", requirePermission("leave.reject"), validate(objectIdParamSchema, "params"), validate(reviewLeaveSchema), leaveController.reject);
router.patch("/:id/cancel", requirePermission("leave.create"), validate(objectIdParamSchema, "params"), leaveController.cancel);

export default router;
