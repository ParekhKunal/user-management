import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { requestId } from "./middleware/request-id.middleware.js";
import { requestLogger } from "./middleware/request-logger.middleware.js";
import { openApiSpec } from "./docs/openapi.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import teamRoutes from "./routes/team.routes.js";
import leaveRoutes from "./routes/leave.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import {
  auditRouter,
  dashboardRouter,
  invitationRouter,
  organizationRouter,
  permissionRouter,
  roleRouter,
  settingsRouter,
} from "./routes/platform.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestId);
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
    })
  );
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    })
  );
  app.use(requestLogger);
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 400,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      message: "API is healthy",
      data: { status: "ok" },
    });
  });

  app.get("/api-docs.json", (_req, res) => {
    res.json(openApiSpec);
  });

  app.get("/api-docs", (_req, res) => {
    res.type("html").send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Employee Management API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({ url: "/api-docs.json", dom_id: "#swagger-ui" });
    </script>
  </body>
</html>`);
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/employees", employeeRoutes);
  app.use("/api/departments", departmentRoutes);
  app.use("/api/teams", teamRoutes);
  app.use("/api/leaves", leaveRoutes);
  app.use("/api/attendance", attendanceRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/invitations", invitationRouter);
  app.use("/api/organization", organizationRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/audit-logs", auditRouter);
  app.use("/api/roles", roleRouter);
  app.use("/api/permissions", permissionRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
