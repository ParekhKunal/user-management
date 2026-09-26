import { Router } from "express";
import * as employeeController from "../controllers/employee.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { objectIdParamSchema } from "../validators/common.validator.js";
import {
  bulkUpdateSchema,
  createEmployeeSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
  updateEmployeeStatusSchema,
} from "../validators/employee.validator.js";

const router = Router();
router.use(authenticate);

router.get("/me", employeeController.getMe);
router.patch("/me", validate(updateEmployeeSchema), employeeController.updateMe);
router.get("/deleted", requirePermission("employees.read"), validate(listEmployeesQuerySchema, "query"), employeeController.listDeleted);
router.get("/export", requirePermission("employees.read"), validate(listEmployeesQuerySchema, "query"), employeeController.exportCsv);
router.post("/bulk-update", requirePermission("employees.update"), validate(bulkUpdateSchema), employeeController.bulk);
router.get("/", requirePermission("employees.read"), validate(listEmployeesQuerySchema, "query"), employeeController.list);
router.post("/", requirePermission("employees.create"), validate(createEmployeeSchema), employeeController.create);
router.get("/:id/history", requirePermission("employees.read"), validate(objectIdParamSchema, "params"), employeeController.history);
router.patch("/:id/status", requirePermission("employees.update"), validate(objectIdParamSchema, "params"), validate(updateEmployeeStatusSchema), employeeController.updateStatus);
router.patch("/:id/restore", requirePermission("employees.update"), validate(objectIdParamSchema, "params"), employeeController.restore);
router.patch("/:id/activate", requirePermission("employees.activate"), validate(objectIdParamSchema, "params"), employeeController.activate);
router.patch("/:id/deactivate", requirePermission("employees.deactivate"), validate(objectIdParamSchema, "params"), employeeController.deactivate);
router.get("/:id", requirePermission("employees.read"), validate(objectIdParamSchema, "params"), employeeController.getOne);
router.patch("/:id", requirePermission("employees.update"), validate(objectIdParamSchema, "params"), validate(updateEmployeeSchema), employeeController.update);
router.delete("/:id", requirePermission("employees.delete"), validate(objectIdParamSchema, "params"), employeeController.remove);

export default router;
