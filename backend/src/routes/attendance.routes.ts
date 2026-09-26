import { Router } from "express";
import * as attendanceController from "../controllers/attendance.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { employeeIdParamSchema } from "../validators/common.validator.js";
import { listAttendanceQuerySchema } from "../validators/attendance.validator.js";

const router = Router();
router.use(authenticate);

router.post("/clock-in", attendanceController.clockIn);
router.post("/clock-out", attendanceController.clockOut);
router.get("/me", requirePermission("attendance.read"), validate(listAttendanceQuerySchema, "query"), attendanceController.listMine);
router.get("/team", requirePermission("attendance.read"), validate(listAttendanceQuerySchema, "query"), attendanceController.listTeam);
router.get("/:employeeId", requirePermission("attendance.read"), validate(employeeIdParamSchema, "params"), validate(listAttendanceQuerySchema, "query"), attendanceController.listEmployee);

export default router;
