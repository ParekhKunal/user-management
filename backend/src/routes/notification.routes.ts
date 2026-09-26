import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { objectIdParamSchema } from "../validators/common.validator.js";

const router = Router();
router.use(authenticate);

router.get("/", notificationController.list);
router.patch("/read-all", notificationController.readAll);
router.patch("/:id/read", validate(objectIdParamSchema, "params"), notificationController.readOne);

export default router;
