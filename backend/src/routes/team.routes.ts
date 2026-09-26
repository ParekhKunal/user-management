import { Router } from "express";
import * as teamController from "../controllers/team.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { objectIdParamSchema } from "../validators/common.validator.js";
import { createTeamSchema, listOrgQuerySchema, updateTeamSchema } from "../validators/organization.validator.js";

const router = Router();
router.use(authenticate);

router.get("/", requirePermission("teams.read"), validate(listOrgQuerySchema, "query"), teamController.list);
router.post("/", requirePermission("teams.create"), validate(createTeamSchema), teamController.create);
router.get("/:id/employees", requirePermission("teams.read"), validate(objectIdParamSchema, "params"), teamController.employees);
router.get("/:id", requirePermission("teams.read"), validate(objectIdParamSchema, "params"), teamController.getOne);
router.patch("/:id", requirePermission("teams.update"), validate(objectIdParamSchema, "params"), validate(updateTeamSchema), teamController.update);
router.delete("/:id", requirePermission("teams.delete"), validate(objectIdParamSchema, "params"), teamController.remove);

export default router;
