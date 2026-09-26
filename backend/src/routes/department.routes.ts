import { Router } from "express";
import * as departmentController from "../controllers/department.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { objectIdParamSchema } from "../validators/common.validator.js";
import {
  createDepartmentSchema,
  listOrgQuerySchema,
  updateDepartmentSchema,
} from "../validators/organization.validator.js";

const router = Router();
router.use(authenticate);

router.get("/", requirePermission("departments.read"), validate(listOrgQuerySchema, "query"), departmentController.list);
router.post("/", requirePermission("departments.create"), validate(createDepartmentSchema), departmentController.create);
router.get("/:id/employees", requirePermission("departments.read"), validate(objectIdParamSchema, "params"), departmentController.employees);
router.get("/:id", requirePermission("departments.read"), validate(objectIdParamSchema, "params"), departmentController.getOne);
router.patch("/:id", requirePermission("departments.update"), validate(objectIdParamSchema, "params"), validate(updateDepartmentSchema), departmentController.update);
router.delete("/:id", requirePermission("departments.delete"), validate(objectIdParamSchema, "params"), departmentController.remove);

export default router;
