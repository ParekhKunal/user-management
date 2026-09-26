# Admin Dashboard — Requirements Specification

## 1. Project Overview

Build a role-based Admin Dashboard application with:

- **Frontend:** Next.js
- **Backend:** Node.js + Express.js
- **Database:** MongoDB running locally
- **Authentication:** JWT token-based authentication
- **Authorization:** Role-Based Access Control (RBAC)
- **User Management:** CRUD operations
- **Approval Workflow:** New user registrations require approval from an Admin or Super Admin before the account becomes active.

The system supports three roles:

1. **Super Admin**
2. **Admin**
3. **User**

---

# 2. Goals

The application should provide:

- Secure JWT-based authentication.
- Controlled user registration and approval.
- Role-based access to dashboard functionality.
- User CRUD management for authorized administrators.
- Self-profile management for normal users.
- Clear separation between frontend and backend.
- MongoDB-based persistence.
- Proper API validation and error handling.
- Audit-friendly status and role management.

---

# 3. Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Axios or native `fetch`
- React Hook Form
- Zod for client-side validation

## Backend

- Node.js
- Express.js
- TypeScript
- JWT
- bcrypt
- Mongoose
- Zod/Joi for request validation
- Helmet
- CORS
- Morgan/Pino for logging

## Database

- MongoDB
- MongoDB running locally

Example connection:

```text
mongodb://localhost:27017/admin_dashboard
```

---

# 4. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      Next.js        │
                         │      Frontend       │
                         └──────────┬──────────┘
                                    │
                              HTTPS / REST
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Node.js + Express │
                         │       Backend       │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
          Authentication       Authorization       User APIs
              JWT                  RBAC              CRUD
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    ▼
                         ┌─────────────────────┐
                         │       MongoDB       │
                         │       Local DB      │
                         └─────────────────────┘
```

---

# 5. User Roles

## 5.1 Super Admin

The Super Admin has full system access.

Permissions:

- Login
- View dashboard
- View users
- Create users
- Update users
- Delete users
- Approve pending user registrations
- Reject pending user registrations
- Change user roles
- Activate/deactivate users
- View and update own profile

Role:

```text
super-admin
```

---

## 5.2 Admin

Admin has administrative user-management permissions.

Permissions:

- Login
- View dashboard
- View users
- Create users
- Update users
- Delete users
- Approve pending user registrations
- Reject pending user registrations
- Activate/deactivate users
- View and update own profile

Restrictions:

- Cannot create/delete another Super Admin.
- Cannot demote or modify the Super Admin.
- Cannot assign the `super-admin` role.
- Cannot perform Super Admin-only operations.

Role:

```text
admin
```

---

## 5.3 User

Normal users have limited access.

Permissions:

- Login
- View dashboard
- View own profile
- Update own profile
- Change own password

Restrictions:

- Cannot view other users.
- Cannot create users.
- Cannot update other users.
- Cannot delete users.
- Cannot approve registrations.
- Cannot change roles.

Role:

```text
user
```

---

# 6. Permission Matrix

| Operation | Super Admin | Admin | User |
|---|---:|---:|---:|
| Login | Yes | Yes | Yes |
| View dashboard | Yes | Yes | Yes |
| View all users | Yes | Yes | No |
| Create user | Yes | Yes | No |
| Update any user | Yes | Yes* | No |
| Delete user | Yes | Yes* | No |
| Approve signup | Yes | Yes | No |
| Reject signup | Yes | Yes | No |
| Activate/deactivate user | Yes | Yes* | No |
| Change role | Yes | Limited | No |
| Manage Super Admin | Yes | No | No |
| View own profile | Yes | Yes | Yes |
| Update own profile | Yes | Yes | Yes |
| Change own password | Yes | Yes | Yes |

`*` Admin cannot modify protected Super Admin accounts.

---

# 7. Authentication Requirements

Authentication must be JWT-based.

## Login Flow

```text
User
  │
  │ POST /api/auth/login
  ▼
Backend
  │
  ├── Validate email/password
  ├── Check account status
  ├── Compare password using bcrypt
  ├── Generate JWT
  │
  ▼
Frontend
  │
  └── Store authentication state
```

The JWT should contain:

```json
{
  "sub": "user_id",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

Do not store passwords inside the JWT.

---

# 8. Authentication Rules

A user can log in only when:

```text
status = ACTIVE
```

The following users cannot log in:

```text
PENDING
REJECTED
INACTIVE
```

Password requirements:

- Minimum 8 characters.
- Password must be hashed using bcrypt.
- Plain-text passwords must never be stored.
- Password must never be returned from an API response.

---

# 9. User Signup and Approval Workflow

This is a key business requirement.

A normal user must not immediately receive an active account after signup.

## Signup Flow

```text
                User Signup
                     │
                     ▼
             Create PENDING user
                     │
                     ▼
          Admin/Super Admin reviews
                     │
             ┌───────┴────────┐
             │                │
           APPROVE           REJECT
             │                │
             ▼                ▼
           ACTIVE          REJECTED
             │
             ▼
       User can login
```

## Important Rule

The signup request must create a user record with:

```text
status = PENDING
role = USER
```

The user must not be able to log in while the account is `PENDING`.

---

# 10. Signup API

### Endpoint

```http
POST /api/auth/signup
```

### Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password@123"
}
```

### Backend behavior

1. Validate request.
2. Check whether email already exists.
3. Hash password.
4. Create user.
5. Set role to `user`.
6. Set status to `pending`.
7. Do not generate a login JWT.
8. Return pending-registration response.

### Response

```json
{
  "success": true,
  "message": "Registration submitted for approval."
}
```

---

# 11. User Status

Use the following statuses:

```text
PENDING
ACTIVE
REJECTED
INACTIVE
```

### PENDING

User has registered but is waiting for administrator approval.

### ACTIVE

User has been approved and can log in.

### REJECTED

Registration was rejected.

### INACTIVE

Existing account has been disabled.

---

# 12. Approval APIs

## Get Pending Users

```http
GET /api/users/pending
```

Required role:

```text
super-admin
admin
```

---

## Approve User

```http
PATCH /api/users/:id/approve
```

Required role:

```text
super-admin
admin
```

Backend changes:

```text
status = ACTIVE
```

The user can now log in.

---

## Reject User

```http
PATCH /api/users/:id/reject
```

Required role:

```text
super-admin
admin
```

Backend changes:

```text
status = REJECTED
```

---

# 13. User CRUD

## Create User

```http
POST /api/users
```

Allowed:

```text
super-admin
admin
```

Request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password@123",
  "role": "user"
}
```

Administrators may create an account directly.

The backend must enforce role restrictions regardless of what the frontend sends.

---

## Get All Users

```http
GET /api/users
```

Allowed:

```text
super-admin
admin
```

Optional query parameters:

```text
?page=1
&limit=10
&search=john
&role=user
&status=active
```

Example:

```http
GET /api/users?page=1&limit=10&search=john&role=user&status=active
```

---

## Get User By ID

```http
GET /api/users/:id
```

Allowed:

```text
super-admin
admin
```

Normal users must not use this endpoint to access another user's profile.

---

## Update User

```http
PATCH /api/users/:id
```

Allowed:

```text
super-admin
admin
```

Example:

```json
{
  "name": "John Updated",
  "role": "user",
  "status": "active"
}
```

The backend must enforce role hierarchy and protected-account rules.

---

## Delete User

```http
DELETE /api/users/:id
```

Allowed:

```text
super-admin
admin
```

Rules:

- Admin cannot delete Super Admin.
- A Super Admin can delete Admin/User accounts.
- Prevent accidental self-deletion unless explicitly supported.
- Prefer soft deletion for production systems.

---

# 14. Own Profile APIs

Every authenticated user can manage their own profile.

## Get Own Profile

```http
GET /api/users/me
```

Allowed:

```text
super-admin
admin
user
```

---

## Update Own Profile

```http
PATCH /api/users/me
```

Example:

```json
{
  "name": "Updated Name"
}
```

A normal user cannot modify:

```text
role
status
permissions
```

---

## Change Password

```http
PATCH /api/auth/change-password
```

Request:

```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@123"
}
```

---

# 15. API Structure

Base URL:

```text
/api
```

## Authentication

```text
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
PATCH  /api/auth/change-password
```

## Users

```text
GET    /api/users
POST   /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id

GET    /api/users/me
PATCH  /api/users/me

GET    /api/users/pending
PATCH  /api/users/:id/approve
PATCH  /api/users/:id/reject
```

---

# 16. Middleware Architecture

Backend should use middleware in the following order:

```text
Request
   │
   ▼
CORS
   │
   ▼
Helmet
   │
   ▼
Request Logger
   │
   ▼
JWT Authentication
   │
   ▼
Role Authorization
   │
   ▼
Request Validation
   │
   ▼
Controller
   │
   ▼
Service
   │
   ▼
Repository / Model
   │
   ▼
MongoDB
```

---

# 17. JWT Middleware

Create:

```text
middleware/auth.middleware.ts
```

Responsibilities:

1. Read JWT from the configured authentication mechanism.
2. Verify token.
3. Validate expiration.
4. Extract user ID.
5. Load/verify current user status where required.
6. Attach authenticated user to request.
7. Reject unauthorized requests.

Example request context:

```typescript
req.user = {
  id: "user-id",
  role: "admin"
};
```

---

# 18. RBAC Middleware

Create:

```text
middleware/role.middleware.ts
```

Example:

```typescript
authorize("super-admin", "admin")
```

The middleware must reject users without the required role.

Important:

> Authorization must always be enforced by the backend. Frontend route hiding is only a UI concern and is not a security mechanism.

---

# 19. MongoDB User Model

Collection:

```text
users
```

Suggested schema:

```typescript
{
  _id: ObjectId,

  name: String,

  email: {
    type: String,
    unique: true,
    index: true
  },

  passwordHash: String,

  role: {
    type: String,
    enum: ["super-admin", "admin", "user"]
  },

  status: {
    type: String,
    enum: ["pending", "active", "rejected", "inactive"]
  },

  approvedBy: {
    type: ObjectId,
    ref: "User",
    default: null
  },

  approvedAt: {
    type: Date,
    default: null
  },

  rejectedBy: {
    type: ObjectId,
    ref: "User",
    default: null
  },

  rejectedAt: {
    type: Date,
    default: null
  },

  createdAt: Date,

  updatedAt: Date
}
```

---

# 20. Database Rules

## Unique Email

Email must be unique.

```text
users.email UNIQUE
```

Email comparison should be case-insensitive.

Example:

```text
John@example.com
john@example.com
```

These should be treated as the same account.

---

# 21. Seed Super Admin

The application must provide a seed mechanism for the first Super Admin.

Example:

```bash
npm run seed:admin
```

Seed data:

```json
{
  "name": "System Super Admin",
  "email": "superadmin@example.com",
  "role": "super-admin",
  "status": "active"
}
```

The password must be configured securely through environment variables and hashed before storage.

---

# 22. Frontend Pages

Next.js application should contain:

```text
/
├── login
├── signup
├── dashboard
├── profile
└── admin
    ├── users
    ├── users/new
    └── users/[id]
```

Suggested App Router structure:

```text
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── signup/
│       └── page.tsx
│
├── (dashboard)/
│   ├── layout.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   └── users/
│       ├── page.tsx
│       ├── new/
│       │   └── page.tsx
│       └── [id]/
│           └── page.tsx
│
└── page.tsx
```

---

# 23. Dashboard Requirements

The dashboard should change based on the authenticated user's role.

## Super Admin Dashboard

Show:

- Total users
- Pending approvals
- Active users
- Inactive users
- Admin count
- Recent registrations
- User management
- Pending approval queue

## Admin Dashboard

Show:

- Total users
- Pending approvals
- Active users
- Recent registrations
- User management

## User Dashboard

Show:

- Welcome message
- Own profile summary
- Account status
- Profile update option

---

# 24. User Management UI

Admin/Super Admin should have a user-management page.

Table columns:

```text
Name
Email
Role
Status
Created At
Actions
```

Actions:

```text
View
Edit
Delete
Approve
Reject
Activate
Deactivate
```

Actions should be displayed according to the logged-in user's permissions.

---

# 25. Pending Approval UI

Create a dedicated section:

```text
Pending Approvals
```

Example table:

```text
Name | Email | Registered At | Actions
```

Actions:

```text
Approve
Reject
```

When approved:

```text
PENDING → ACTIVE
```

When rejected:

```text
PENDING → REJECTED
```

---

# 26. Signup Page

Fields:

```text
Name
Email
Password
Confirm Password
```

After successful signup:

```text
Registration submitted successfully.
Your account is waiting for administrator approval.
```

The user should not automatically enter the dashboard.

---

# 27. Login Page

Fields:

```text
Email
Password
```

Possible responses:

### Successful

```text
Login successful
```

### Pending

```text
Your account is waiting for administrator approval.
```

### Rejected

```text
Your registration has been rejected.
```

### Inactive

```text
Your account is inactive. Please contact an administrator.
```

---

# 28. Frontend Authorization

The frontend must support role-based route protection.

Example:

```text
/admin/users
```

Accessible only by:

```text
super-admin
admin
```

The frontend should redirect unauthorized users.

However, frontend protection is not sufficient.

The backend must independently validate every protected API request.

---

# 29. Authentication Storage

Preferred production approach:

- Short-lived access token.
- Refresh token using a secure, HttpOnly cookie.
- `Secure` cookie in production.
- Appropriate `SameSite` configuration.
- Never expose refresh tokens to JavaScript.

For a simple MVP, JWT authentication can start with a short-lived access token, but the authentication design should allow migration to access-token + refresh-token architecture.

---

# 30. Logout

Logout must invalidate the client authentication state.

If refresh tokens are implemented:

```text
POST /api/auth/logout
```

should revoke/delete the refresh-token session.

---

# 31. Security Requirements

The backend must implement:

- bcrypt password hashing
- JWT expiration
- Helmet
- CORS configuration
- Request validation
- MongoDB query sanitization
- Rate limiting on authentication endpoints
- No password in API responses
- No sensitive information in logs
- Centralized error handling
- HTTP status codes
- Input sanitization
- Protection against privilege escalation

Never trust:

```text
role
status
userId
permissions
```

sent by the frontend.

These values must be validated server-side.

---

# 32. Environment Variables

Backend `.env`:

```env
NODE_ENV=development

PORT=5000

MONGODB_URI=mongodb://localhost:27017/admin_dashboard

JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=15m

REFRESH_TOKEN_SECRET=change_this_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000

SUPER_ADMIN_EMAIL=superadmin@example.com
SUPER_ADMIN_PASSWORD=change_this_password
```

Do not commit `.env` to Git.

Provide:

```text
.env.example
```

---

# 33. Backend Folder Structure

Recommended:

```text
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── env.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│   │
│   ├── models/
│   │   └── user.model.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── user.routes.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── user.service.ts
│   │
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   └── user.validator.ts
│   │
│   ├── utils/
│   │   ├── jwt.ts
│   │   └── password.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── scripts/
│   └── seed-super-admin.ts
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

---

# 34. Frontend Folder Structure

Recommended:

```text
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── profile/
│   │   └── users/
│   │
│   └── layout.tsx
│
├── components/
│   ├── layout/
│   ├── users/
│   ├── forms/
│   └── ui/
│
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── permissions.ts
│
├── hooks/
│   ├── useAuth.ts
│   └── useUsers.ts
│
├── types/
│   ├── auth.ts
│   └── user.ts
│
└── middleware.ts
```

---

# 35. API Response Standard

Use a consistent API response structure.

## Success

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {}
}
```

## Error

```json
{
  "success": false,
  "message": "You are not authorized to perform this action",
  "error": {
    "code": "FORBIDDEN"
  }
}
```

---

# 36. HTTP Status Codes

Use standard status codes:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

---

# 37. Important Authorization Rules

These rules must be enforced on the backend.

### Rule 1

A normal user can only access their own profile.

### Rule 2

A normal user cannot modify their own role.

### Rule 3

A normal user cannot modify their own status.

### Rule 4

An Admin cannot create a Super Admin.

### Rule 5

An Admin cannot modify a Super Admin.

### Rule 6

An Admin cannot delete a Super Admin.

### Rule 7

Only Admin/Super Admin can approve registrations.

### Rule 8

New public registrations always have:

```text
role = user
status = pending
```

### Rule 9

Only Super Admin can perform Super Admin-level role management.

### Rule 10

Frontend permissions must never replace backend authorization.

---

# 38. User Lifecycle

```text
                  ┌──────────────┐
                  │   SIGNUP     │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │    PENDING   │
                  └──────┬───────┘
                         │
              ┌──────────┴──────────┐
              │                     │
           APPROVE                REJECT
              │                     │
              ▼                     ▼
        ┌───────────┐         ┌───────────┐
        │  ACTIVE   │         │ REJECTED  │
        └─────┬─────┘         └───────────┘
              │
          DEACTIVATE
              │
              ▼
        ┌───────────┐
        │ INACTIVE  │
        └───────────┘
```

---

# 39. Error Handling

Create centralized error handling.

Example:

```typescript
app.use(errorHandler);
```

The API must not expose:

- Stack traces in production.
- Database connection details.
- Password hashes.
- JWT secrets.
- Internal implementation details.

---

# 40. Validation

Validate every incoming request.

Signup:

```text
name
email
password
confirmPassword
```

Login:

```text
email
password
```

User creation:

```text
name
email
password
role
```

User update:

```text
name
email
role
status
```

The backend must validate the allowed fields based on the current user's role.

---

# 41. Search, Filtering and Pagination

Admin user management should support:

### Search

```text
name
email
```

### Filters

```text
role
status
```

### Pagination

```text
page
limit
```

Example:

```http
GET /api/users?page=1&limit=20&search=john&role=user&status=active
```

Backend response:

```json
{
  "success": true,
  "data": {
    "users": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

# 42. Audit Considerations

For important administrative actions, maintain an audit trail.

Recommended future collection:

```text
audit_logs
```

Example:

```json
{
  "actorId": "admin-id",
  "action": "USER_APPROVED",
  "targetUserId": "user-id",
  "metadata": {},
  "createdAt": "2026-09-26T10:00:00Z"
}
```

Actions to track:

```text
USER_CREATED
USER_UPDATED
USER_DELETED
USER_APPROVED
USER_REJECTED
USER_ACTIVATED
USER_DEACTIVATED
ROLE_CHANGED
PASSWORD_CHANGED
LOGIN_SUCCESS
LOGIN_FAILED
```

Audit logging can be implemented after the MVP.

---

# 43. MVP Development Phases

## Phase 1 — Project Setup

- Initialize Next.js frontend.
- Initialize Node.js/Express backend.
- Configure TypeScript.
- Configure MongoDB.
- Configure environment variables.
- Configure CORS.
- Create basic project structure.

## Phase 2 — Authentication

- User model.
- Signup.
- Login.
- Password hashing.
- JWT generation.
- JWT verification.
- Logout.
- Authentication middleware.

## Phase 3 — RBAC

- Implement roles.
- Implement authorization middleware.
- Implement role restrictions.
- Protect backend routes.

## Phase 4 — User Approval

- Pending status.
- Pending users API.
- Approve API.
- Reject API.
- Admin approval UI.

## Phase 5 — User CRUD

- Create user.
- List users.
- Get user.
- Update user.
- Delete user.
- Search.
- Filtering.
- Pagination.

## Phase 6 — Frontend Dashboard

- Dashboard layout.
- Sidebar.
- Header.
- Role-aware navigation.
- User table.
- User forms.
- Approval screen.
- Profile page.

## Phase 7 — Security

- Rate limiting.
- Helmet.
- Validation.
- Secure cookies/refresh tokens.
- Error handling.
- Security testing.

## Phase 8 — Testing

- Unit tests.
- API integration tests.
- Authentication tests.
- RBAC tests.
- User approval tests.
- Frontend tests.

---

# 44. Acceptance Criteria

## Authentication

- [ ] User can signup.
- [ ] Password is hashed.
- [ ] Signup creates a pending account.
- [ ] Pending users cannot log in.
- [ ] Admin can approve users.
- [ ] Super Admin can approve users.
- [ ] Approved users can log in.
- [ ] Rejected users cannot log in.
- [ ] Inactive users cannot log in.
- [ ] JWT expiration is enforced.

## Authorization

- [ ] Super Admin has full administrative access.
- [ ] Admin can manage normal users.
- [ ] Admin cannot manage Super Admin.
- [ ] Admin cannot create Super Admin.
- [ ] Normal user cannot access other users.
- [ ] Normal user can update only their own profile.
- [ ] Backend validates every permission.

## User Management

- [ ] Admin can create users.
- [ ] Admin can view users.
- [ ] Admin can update users.
- [ ] Admin can delete users.
- [ ] Super Admin can perform user CRUD.
- [ ] User search works.
- [ ] User filtering works.
- [ ] Pagination works.

## Frontend

- [ ] Login page works.
- [ ] Signup page works.
- [ ] Dashboard works.
- [ ] User management page works.
- [ ] Pending approval page works.
- [ ] Profile page works.
- [ ] Role-based navigation works.
- [ ] Unauthorized routes are protected.

## Security

- [ ] Passwords are never stored in plain text.
- [ ] Passwords are never returned through APIs.
- [ ] JWT secrets are stored in environment variables.
- [ ] `.env` is excluded from Git.
- [ ] Backend authorization cannot be bypassed through frontend requests.
- [ ] Validation is applied to all user-controlled input.

---

# 45. Definition of Done

The MVP is considered complete when:

1. A visitor can register.
2. Registration creates a `PENDING` user.
3. The pending user cannot log in.
4. Admin/Super Admin can see pending registrations.
5. Admin/Super Admin can approve or reject registrations.
6. Approved users can log in using JWT authentication.
7. Users see functionality according to their role.
8. Admin can perform user CRUD according to authorization rules.
9. Super Admin has full administrative control.
10. Normal users can only manage their own profile.
11. MongoDB persists all user data.
12. API validation and centralized error handling are implemented.
13. Authentication and authorization are enforced on the backend.
14. The frontend provides a usable admin dashboard.
15. Core authentication, approval, RBAC, and CRUD flows have automated tests.

---

# 46. Future Enhancements

After the MVP:

- Email notification after signup.
- Email notification after approval/rejection.
- Forgot password.
- Reset password.
- Two-factor authentication.
- Refresh-token rotation.
- Audit log UI.
- Admin activity tracking.
- Session management.
- Account lockout after repeated failed login attempts.
- Dockerized local development.
- CI/CD pipeline.
- Production MongoDB.
- Redis for session/rate-limit support.
- Automated API documentation using OpenAPI/Swagger.

---

# 47. Core Business Rule Summary

The most important workflow is:

```text
PUBLIC USER
    │
    │ Signup
    ▼
PENDING USER
    │
    │ Admin / Super Admin Approval
    ▼
ACTIVE USER
    │
    │ Login
    ▼
JWT AUTHENTICATED SESSION
    │
    ├── Super Admin → Full management
    │
    ├── Admin       → User management
    │
    └── User        → Own profile only
```

The backend is the source of truth for authentication, authorization, role assignment, account status, and user permissions.
