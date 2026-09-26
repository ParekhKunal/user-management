export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Employee Management API",
    version: "2.0.0",
    description:
      "JWT-authenticated employee management platform. Authorization is permission-based and enforced on the backend.",
  },
  servers: [{ url: "/api", description: "Local API" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Success: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: { type: "object" },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              requestId: { type: "string" },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": { get: { security: [], summary: "Health check", responses: { "200": { description: "OK" } } } },
    "/auth/signup": {
      post: {
        security: [],
        summary: "Public signup (pending user)",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { "201": { description: "Pending registration created" }, "409": { description: "Email exists" } },
      },
    },
    "/auth/login": {
      post: {
        security: [],
        summary: "Login and receive access token + refresh cookie",
        responses: { "200": { description: "Login successful" }, "401": { description: "Invalid credentials" } },
      },
    },
    "/auth/refresh": { post: { security: [], summary: "Refresh access token", responses: { "200": { description: "Token refreshed" } } } },
    "/auth/logout": { post: { summary: "Revoke refresh token", responses: { "200": { description: "Logged out" } } } },
    "/auth/change-password": { patch: { summary: "Change own password", responses: { "200": { description: "Password changed" } } } },
    "/users": {
      get: { summary: "List users", parameters: [{ name: "search", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Users" } } },
      post: { summary: "Create user", responses: { "201": { description: "Created" } } },
    },
    "/users/me": { get: { summary: "Own profile", responses: { "200": { description: "Profile" } } } },
    "/users/pending": { get: { summary: "Pending registrations", responses: { "200": { description: "Pending users" } } } },
    "/employees": {
      get: {
        summary: "Search, filter, sort and paginate employees",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "department", in: "query", schema: { type: "string" } },
          { name: "employmentStatus", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "sort", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Employees" } },
      },
      post: { summary: "Create or invite an employee", responses: { "201": { description: "Created" } } },
    },
    "/employees/export": { get: { summary: "Export employees as CSV", responses: { "200": { description: "CSV" } } } },
    "/employees/bulk-update": { post: { summary: "Bulk employee operations", responses: { "200": { description: "Updated" } } } },
    "/employees/{id}": {
      get: { summary: "Employee details", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Employee" } } },
      patch: { summary: "Update employee", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } },
      delete: { summary: "Soft delete employee", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } },
    },
    "/employees/{id}/status": { patch: { summary: "Change employment status", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } } },
    "/employees/{id}/restore": { patch: { summary: "Restore deleted employee", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Restored" } } } },
    "/departments": { get: { summary: "List departments", responses: { "200": { description: "Departments" } } }, post: { summary: "Create department", responses: { "201": { description: "Created" } } } },
    "/teams": { get: { summary: "List teams", responses: { "200": { description: "Teams" } } }, post: { summary: "Create team", responses: { "201": { description: "Created" } } } },
    "/organization/tree": { get: { summary: "Organization tree", responses: { "200": { description: "Tree" } } } },
    "/leaves": { post: { summary: "Create leave request", responses: { "201": { description: "Created" } } } },
    "/leaves/me": { get: { summary: "Own leave requests", responses: { "200": { description: "Leaves" } } } },
    "/leaves/team": { get: { summary: "Team leave requests", responses: { "200": { description: "Leaves" } } } },
    "/leaves/{id}/approve": { patch: { summary: "Approve leave", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Approved" } } } },
    "/leaves/{id}/reject": { patch: { summary: "Reject leave", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Rejected" } } } },
    "/attendance/clock-in": { post: { summary: "Clock in", responses: { "200": { description: "Clocked in" } } } },
    "/attendance/clock-out": { post: { summary: "Clock out", responses: { "200": { description: "Clocked out" } } } },
    "/attendance/me": { get: { summary: "Own attendance", responses: { "200": { description: "Attendance" } } } },
    "/notifications": { get: { summary: "List notifications", responses: { "200": { description: "Notifications" } } } },
    "/audit-logs": { get: { summary: "Audit logs", responses: { "200": { description: "Logs" } } } },
    "/settings/organization": { get: { summary: "Organization settings", responses: { "200": { description: "Settings" } } }, patch: { summary: "Update organization settings", responses: { "200": { description: "Updated" } } } },
    "/dashboard/summary": { get: { summary: "Role-aware dashboard summary", responses: { "200": { description: "Summary" } } } },
    "/invitations/{token}": { get: { security: [], summary: "Read invitation", parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Invitation" } } } },
    "/invitations/accept": { post: { security: [], summary: "Accept invitation and set password", responses: { "200": { description: "Accepted" } } } },
    "/roles": {
      get: { summary: "List roles with stored permissions (Super Admin)", responses: { "200": { description: "Roles" }, "403": { description: "Not Super Admin" } } },
      post: { summary: "Create a custom role (Super Admin)", responses: { "201": { description: "Created" }, "403": { description: "Not Super Admin" } } },
    },
    "/roles/{id}": {
      get: { summary: "Get a role (Super Admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Role" }, "403": { description: "Not Super Admin" } } },
      patch: { summary: "Update a role (Super Admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" }, "403": { description: "Not Super Admin" } } },
      delete: { summary: "Delete a custom role (Super Admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" }, "403": { description: "Not Super Admin" } } },
    },
    "/roles/{id}/permissions": {
      put: {
        summary: "Replace a role's permission set (Super Admin). Super Admin locked permissions cannot be removed.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { permissions: { type: "array", items: { type: "string" } } } } } },
        },
        responses: { "200": { description: "Updated" }, "403": { description: "Not Super Admin" } },
      },
    },
    "/roles/{id}/permissions/reset": {
      post: { summary: "Reset a role to default permissions (Super Admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Reset" }, "403": { description: "Not Super Admin" } } },
    },
    "/permissions": {
      get: { summary: "Permission catalog, grouped (Super Admin)", responses: { "200": { description: "Catalog" }, "403": { description: "Not Super Admin" } } },
    },
  },
};
