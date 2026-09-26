import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createUserSchema,
  listUsersQuerySchema,
  objectIdParamSchema,
  updateMeSchema,
  updateUserSchema,
} from "../validators/user.validator.js";

const router = Router();
const staff = authorize("super-admin", "admin");

router.use(authenticate);

router.get("/me", userController.getMe);
router.patch("/me", validate(updateMeSchema), userController.updateMe);

router.get("/stats", staff, userController.getStats);
router.get("/pending", staff, userController.listPendingUsers);

router.get("/", staff, validate(listUsersQuerySchema, "query"), userController.listUsers);
router.post("/", staff, validate(createUserSchema), userController.createUser);

router.get("/:id", staff, validate(objectIdParamSchema, "params"), userController.getUser);
router.patch(
  "/:id",
  staff,
  validate(objectIdParamSchema, "params"),
  validate(updateUserSchema),
  userController.updateUser
);
router.delete("/:id", staff, validate(objectIdParamSchema, "params"), userController.deleteUser);
router.patch(
  "/:id/approve",
  staff,
  validate(objectIdParamSchema, "params"),
  userController.approveUser
);
router.patch(
  "/:id/reject",
  staff,
  validate(objectIdParamSchema, "params"),
  userController.rejectUser
);

export default router;
