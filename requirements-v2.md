# Employee Management & Administration Platform — Requirements V2

## 1. Project Vision

Evolve the original Admin Dashboard into a realistic **Employee Management & Administration Platform**.

The system should support employee lifecycle management, organizational structure, departments, teams, managers, roles, permissions, onboarding, approvals, leave, attendance, notifications, audit history, and administrative controls.

### Stack

- Frontend: Next.js + React + TypeScript + Tailwind CSS
- Backend: Node.js + Express.js + TypeScript
- Database: MongoDB + Mongoose
- Authentication: JWT + refresh tokens
- Password hashing: bcrypt
- Validation: Zod
- API documentation: OpenAPI/Swagger

Local MongoDB:

```text
mongodb://localhost:27017/employee_management
```

---

# 2. Core Architecture

```text
Authentication
      ↓
Authorization
      ↓
Organization Scope
      ↓
Resource Ownership
      ↓
Business Rules
      ↓
MongoDB
```

The backend is the source of truth for permissions and business rules.

Frontend permission checks are for UX only and must never replace backend authorization.

---

# 3. Roles

## Super Admin

Full platform access.

Can:

- Manage employees
- Manage administrators
- Manage departments
- Manage teams
- Manage roles
- Manage permissions
- Approve/reject registrations
- Manage organization settings
- View audit logs
- Manage employee lifecycle

## Admin

Can:

- Manage employees
- Manage departments
- Manage teams
- Approve registrations
- Activate/deactivate employees
- View employee activity

Restrictions:

- Cannot modify Super Admin
- Cannot create Super Admin
- Cannot modify critical system permissions
- Cannot remove the final Super Admin

## HR Manager

Can:

- Manage employee profiles
- Manage onboarding
- Assign departments/teams
- Manage employee lifecycle
- Manage leave
- View employee history

## Manager

Can:

- View direct reports
- View assigned team
- Review team requests
- Approve/reject team leave requests
- View team activity

Manager access must be scope-based.

## Employee

Can:

- View own profile
- Update permitted profile fields
- View own department/team/manager
- Submit requests
- View own leave
- View own attendance
- Change own password
- View own notifications

Employees cannot manage other employees.

---

# 4. Permission System

Use permission-based authorization instead of relying only on role checks.

Example permissions:

```text
users.read
users.create
users.update
users.delete

employees.read
employees.create
employees.update
employees.delete
employees.approve
employees.activate
employees.deactivate

departments.read
departments.create
departments.update
departments.delete

teams.read
teams.create
teams.update
teams.delete

roles.read
roles.create
roles.update
roles.delete

permissions.read
permissions.assign

attendance.read
attendance.manage

leave.read
leave.create
leave.approve
leave.reject

audit.read

settings.read
settings.update
```

Authorization should consider:

```text
Role
+
Permission
+
Resource ownership
+
Organization scope
+
Department scope
+
Team scope
```

---

# 5. Authentication

Support:

```text
Signup
Login
JWT access token
Refresh token
Logout
Change password
```

Preferred token architecture:

```text
Access Token → short lived
Refresh Token → long lived
```

Example:

```text
Access Token: 15 minutes
Refresh Token: 7 days
```

Refresh token should use a secure HttpOnly cookie.

---

# 6. User Signup and Approval

Public signup must create:

```text
role = user
status = pending
```

Flow:

```text
Signup
  ↓
PENDING
  ↓
Admin / Super Admin approval
  ├── APPROVE → ACTIVE
  └── REJECT  → REJECTED
```

Pending and rejected users cannot log in.

---

# 7. Employee Onboarding

Employees should preferably be invited by an administrator.

Flow:

```text
Admin/HR
   ↓
Invite Employee
   ↓
Create Employee
   ↓
Create Pending Account
   ↓
Invitation Token
   ↓
Employee Accepts
   ↓
Set Password
   ↓
Complete Profile
   ↓
ACTIVE
```

Invitation tokens must:

- Be cryptographically random
- Be stored hashed
- Expire
- Be single-use
- Be invalidated after acceptance

Default invitation expiry:

```text
24 hours
```

---

# 8. Employee Model

Suggested fields:

```typescript
{
  _id: ObjectId,

  userId: ObjectId,

  employeeCode: String,

  firstName: String,
  lastName: String,

  email: String,
  phone: String,

  profileImage: String,

  dateOfBirth: Date,
  gender: String,

  joiningDate: Date,

  employmentType: String,
  employmentStatus: String,

  jobTitle: String,

  departmentId: ObjectId,
  teamId: ObjectId,
  managerId: ObjectId,

  location: String,
  workMode: String,

  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },

  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },

  deletedAt: Date,
  deletedBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

---

# 9. Employee Code

Every employee gets a unique backend-generated code.

Format:

```text
EMP-000001
EMP-000002
EMP-000003
```

Rules:

- Unique
- Immutable
- Generated by backend
- Cannot be manually selected by employees

---

# 10. Employment Type

Supported values:

```text
FULL_TIME
PART_TIME
CONTRACT
INTERN
TEMPORARY
FREELANCER
```

---

# 11. Account Status vs Employment Status

These must remain separate.

## Account Status

Controls authentication:

```text
PENDING
ACTIVE
INACTIVE
REJECTED
LOCKED
```

## Employment Status

Describes employee lifecycle:

```text
ONBOARDING
ACTIVE
ON_LEAVE
SUSPENDED
RESIGNED
TERMINATED
RETIRED
```

Example:

```text
Account Status: ACTIVE
Employment Status: ON_LEAVE
```

An employee can therefore be on leave while still being able to log in.

---

# 12. Employee CRUD

```http
POST   /api/employees
GET    /api/employees
GET    /api/employees/:id
PATCH  /api/employees/:id
DELETE /api/employees/:id
```

Additional:

```http
PATCH /api/employees/:id/status
PATCH /api/employees/:id/restore
GET   /api/employees/deleted
```

Use soft deletion for employee records.

---

# 13. Employee Search, Filtering and Pagination

Search by:

```text
Name
Email
Employee Code
Job Title
```

Filters:

```text
Department
Team
Manager
Employment Type
Employment Status
Account Status
Work Mode
Location
Joining Date
```

Example:

```http
GET /api/employees?search=john&department=engineering&employmentStatus=ACTIVE
```

Pagination:

```text
page=1
limit=20
```

Maximum:

```text
limit=100
```

Sorting:

```text
name
joiningDate
employeeCode
department
createdAt
```

---

# 14. Departments

Department model:

```typescript
{
  _id: ObjectId,
  name: String,
  code: String,
  description: String,
  managerId: ObjectId,
  status: "ACTIVE" | "INACTIVE",
  createdAt: Date,
  updatedAt: Date
}
```

APIs:

```http
GET    /api/departments
POST   /api/departments
GET    /api/departments/:id
PATCH  /api/departments/:id
DELETE /api/departments/:id
GET    /api/departments/:id/employees
```

---

# 15. Teams

Teams belong to departments.

Example:

```text
Engineering
 ├── Backend
 ├── Frontend
 └── DevOps
```

Model:

```typescript
{
  _id: ObjectId,
  name: String,
  code: String,
  departmentId: ObjectId,
  managerId: ObjectId,
  description: String,
  status: "ACTIVE" | "INACTIVE",
  createdAt: Date,
  updatedAt: Date
}
```

APIs:

```http
GET    /api/teams
POST   /api/teams
GET    /api/teams/:id
PATCH  /api/teams/:id
DELETE /api/teams/:id
GET    /api/teams/:id/employees
```

---

# 16. Reporting Manager

Employees may have a reporting manager.

Example:

```text
Engineering Manager
       │
       ├── Backend Developer
       ├── Frontend Developer
       └── DevOps Engineer
```

Employee field:

```text
managerId
```

Managers can access their direct reports according to permission and scope.

---

# 17. Organization Tree

Provide:

```http
GET /api/organization/tree
```

Example:

```json
{
  "organization": "KP Technologies",
  "departments": [
    {
      "name": "Engineering",
      "teams": [
        {
          "name": "Backend",
          "manager": {},
          "employees": []
        }
      ]
    }
  ]
}
```

---

# 18. Employee Profile

Employee profile sections:

```text
Overview
Personal Information
Contact Information
Employment
Organization
Manager
Emergency Contact
Leave
Attendance
Activity
```

Employees may edit only permitted fields.

### Employee Editable

```text
Phone
Profile Image
Address
Emergency Contact
```

### HR/Admin Editable

```text
Job Title
Department
Team
Manager
Employment Type
Employment Status
Joining Date
Work Mode
Location
```

### Restricted

```text
Employee Code
System Role
System Permissions
```

---

# 19. Employee Lifecycle

Support:

```text
INVITED
   ↓
ONBOARDING
   ↓
ACTIVE
   ↓
ON_LEAVE
   ↓
ACTIVE
   ↓
RESIGNED / TERMINATED / RETIRED
```

The backend must validate status transitions.

Example:

```text
TERMINATED → ACTIVE
```

must not happen through a normal status update. A future rehire workflow should handle this.

---

# 20. Employee History

Create collection:

```text
employee_history
```

Example:

```json
{
  "employeeId": "employee-id",
  "action": "DEPARTMENT_CHANGED",
  "oldValue": "Engineering",
  "newValue": "DevOps",
  "performedBy": "admin-id",
  "reason": "Team restructuring",
  "createdAt": "2026-09-26T10:00:00Z"
}
```

Track:

```text
DEPARTMENT_CHANGED
TEAM_CHANGED
MANAGER_CHANGED
ROLE_CHANGED
TITLE_CHANGED
STATUS_CHANGED
WORK_MODE_CHANGED
EMPLOYMENT_TYPE_CHANGED
```

---

# 21. Leave Management

Leave types:

```text
ANNUAL
SICK
CASUAL
UNPAID
MATERNITY
PATERNITY
OTHER
```

Leave request:

```typescript
{
  _id: ObjectId,
  employeeId: ObjectId,
  leaveTypeId: ObjectId,
  startDate: Date,
  endDate: Date,
  numberOfDays: Number,
  reason: String,
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED",
  reviewedBy: ObjectId,
  reviewedAt: Date,
  reviewComment: String,
  createdAt: Date,
  updatedAt: Date
}
```

Workflow:

```text
Employee
  ↓
PENDING
  ↓
Manager / HR
  ├── APPROVED
  └── REJECTED
```

APIs:

```http
POST   /api/leaves
GET    /api/leaves/me
GET    /api/leaves/team
GET    /api/leaves/:id
PATCH  /api/leaves/:id/approve
PATCH  /api/leaves/:id/reject
PATCH  /api/leaves/:id/cancel
```

---

# 22. Attendance

Employees can:

```text
Clock In
Clock Out
View Own Attendance
```

Model:

```typescript
{
  _id: ObjectId,
  employeeId: ObjectId,
  date: Date,
  clockIn: Date,
  clockOut: Date,
  totalMinutes: Number,
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE",
  createdAt: Date,
  updatedAt: Date
}
```

APIs:

```http
POST /api/attendance/clock-in
POST /api/attendance/clock-out
GET  /api/attendance/me
GET  /api/attendance/team
GET  /api/attendance/:employeeId
```

Prevent:

- Multiple clock-ins on the same day
- Clock-out without clock-in
- Multiple clock-outs
- Future timestamps
- Invalid attendance states

---

# 23. Notifications

Notification model:

```typescript
{
  _id: ObjectId,
  recipientId: ObjectId,
  type: String,
  title: String,
  message: String,
  readAt: Date,
  metadata: Object,
  createdAt: Date
}
```

Examples:

```text
Account approved
Leave approved
Leave rejected
Profile updated
Team changed
Manager changed
New invitation
Invitation expiring
```

APIs:

```http
GET   /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

---

# 24. Audit Logs

Create:

```text
audit_logs
```

Model:

```typescript
{
  _id: ObjectId,
  actorId: ObjectId,
  action: String,
  resourceType: String,
  resourceId: ObjectId,
  before: Object,
  after: Object,
  metadata: Object,
  ipAddress: String,
  userAgent: String,
  createdAt: Date
}
```

Track:

```text
LOGIN_SUCCESS
LOGIN_FAILED
LOGOUT

EMPLOYEE_CREATED
EMPLOYEE_UPDATED
EMPLOYEE_DELETED
EMPLOYEE_APPROVED
EMPLOYEE_REJECTED
EMPLOYEE_ACTIVATED
EMPLOYEE_DEACTIVATED

DEPARTMENT_CREATED
DEPARTMENT_UPDATED
DEPARTMENT_DELETED

TEAM_CREATED
TEAM_UPDATED
TEAM_DELETED

ROLE_CHANGED
PERMISSION_CHANGED

LEAVE_CREATED
LEAVE_APPROVED
LEAVE_REJECTED

ATTENDANCE_CLOCK_IN
ATTENDANCE_CLOCK_OUT
```

API:

```http
GET /api/audit-logs
```

Filters:

```text
Actor
Action
Resource
Date Range
```

---

# 25. Organization Settings

Model:

```typescript
{
  organizationName: String,
  organizationCode: String,
  timezone: String,
  country: String,
  defaultWorkMode: String,
  workingDays: [],
  defaultLeavePolicy: Object,
  createdAt: Date,
  updatedAt: Date
}
```

APIs:

```http
GET   /api/settings/organization
PATCH /api/settings/organization
```

Only Super Admin can modify critical organization settings.

---

# 26. Dashboard V2

## Super Admin

Show:

```text
Total Employees
Active Employees
Pending Approvals
Departments
Teams
Employees on Leave
Recent Activity
```

## HR Manager

Show:

```text
Total Employees
New Employees
Pending Onboarding
Pending Leave Requests
Employees on Leave
Recent Employee Changes
```

## Manager

Show:

```text
My Team
Team Size
Employees on Leave
Pending Leave Requests
Recent Team Activity
```

## Employee

Show:

```text
My Profile
My Department
My Manager
Today's Attendance
Leave Balance
Pending Requests
Notifications
```

Backend endpoints:

```http
GET /api/dashboard/summary
GET /api/dashboard/recent-activity
GET /api/dashboard/team-summary
```

---

# 27. Frontend Structure

```text
app/
├── (auth)/
│   ├── login/
│   ├── signup/
│   └── invitation/
│
├── (dashboard)/
│   ├── dashboard/
│   ├── employees/
│   │   ├── page.tsx
│   │   ├── new/
│   │   └── [id]/
│   ├── departments/
│   ├── teams/
│   ├── organization/
│   ├── leaves/
│   ├── attendance/
│   ├── notifications/
│   ├── audit-logs/
│   ├── profile/
│   └── settings/
│
└── layout.tsx
```

Navigation:

```text
Dashboard

People
  ├── Employees
  ├── Departments
  └── Teams

Requests
  ├── Leave
  └── Attendance

Organization
  └── Organization Structure

Administration
  ├── Users
  ├── Roles
  ├── Permissions
  ├── Audit Logs
  └── Settings

My Workspace
  ├── Profile
  ├── Attendance
  ├── Leave
  └── Notifications
```

Navigation visibility should be permission-driven.

---

# 28. Employee Management UI

Employee table:

```text
Employee
Employee Code
Department
Team
Manager
Job Title
Status
Joining Date
Actions
```

Features:

```text
Search
Filters
Sorting
Pagination
Bulk Actions
Create Employee
Export
```

Employee profile tabs:

```text
Overview
Personal
Employment
Organization
Leave
Attendance
Activity
```

---

# 29. Bulk Operations

Support:

```text
Assign Department
Assign Team
Change Manager
Activate
Deactivate
Export
```

API:

```http
POST /api/employees/bulk-update
```

Example:

```json
{
  "employeeIds": ["id1", "id2"],
  "operation": "ASSIGN_TEAM",
  "value": "team-id"
}
```

Every bulk operation must be authorized.

---

# 30. Export

Authorized administrators can export employee data.

Initial format:

```text
CSV
```

API:

```http
GET /api/employees/export?format=csv
```

Do not export sensitive fields unless explicitly permitted.

---

# 31. Soft Delete

Employee records should use soft deletion.

Fields:

```text
deletedAt
deletedBy
```

Normal queries must exclude deleted employees.

Restore:

```http
PATCH /api/employees/:id/restore
```

Every delete and restore operation must be audited.

---

# 32. Backend Architecture

Use:

```text
Route
 ↓
Middleware
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
Model
 ↓
MongoDB
```

Controllers should be thin.

Business rules belong in services.

Modules:

```text
auth
users
employees
departments
teams
roles
permissions
invitations
leaves
attendance
notifications
audit
organization
dashboard
```

---

# 33. Backend Folder Structure

```text
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── employees/
│   │   ├── departments/
│   │   ├── teams/
│   │   ├── roles/
│   │   ├── permissions/
│   │   ├── invitations/
│   │   ├── leaves/
│   │   ├── attendance/
│   │   ├── notifications/
│   │   ├── audit/
│   │   ├── organization/
│   │   └── dashboard/
│   │
│   ├── middleware/
│   ├── config/
│   ├── database/
│   ├── utils/
│   ├── types/
│   ├── app.ts
│   └── server.ts
│
├── scripts/
│   ├── seed-super-admin.ts
│   └── seed-permissions.ts
│
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

# 34. Database Collections

```text
users
employees
departments
teams
roles
permissions
invitations
leaves
leave_types
attendance
notifications
audit_logs
employee_history
organization_settings
sessions
```

---

# 35. Database Relationships

```text
User
 │
 └── Employee
       │
       ├── Department
       │      └── Team
       │
       ├── Manager → Employee
       ├── Leave Requests
       ├── Attendance
       ├── Notifications
       └── Employee History
```

---

# 36. Database Indexes

Employees:

```text
employeeCode
email
departmentId
teamId
managerId
employmentStatus
accountStatus
joiningDate
```

Users:

```text
email
role
status
```

Leaves:

```text
employeeId
status
startDate
endDate
```

Attendance:

```text
employeeId
date
```

Audit:

```text
actorId
action
resourceType
resourceId
createdAt
```

---

# 37. Data Integrity

Validate relationships.

Examples:

- Employee cannot belong to a team from another department.
- Manager must belong to the same organization scope.
- Department cannot be deleted while active employees depend on it unless reassignment is handled.
- Team cannot be assigned to an inactive department.
- Duplicate employee codes are prohibited.
- Duplicate emails are prohibited.

---

# 38. Transactions

Use MongoDB transactions where several records must change together.

Example onboarding:

```text
Create User
+
Create Employee
+
Create Invitation
+
Create Audit Log
```

If a required operation fails, rollback the transaction.

---

# 39. Concurrency

Protect against simultaneous administrative actions.

Example:

Two admins approve the same pending employee.

Only one should succeed.

Use:

```text
Atomic status updates
Status checks
Transactions where required
```

---

# 40. API Response Standard

Success:

```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Employee not found",
  "error": {
    "code": "EMPLOYEE_NOT_FOUND",
    "requestId": "req_123"
  }
}
```

HTTP codes:

```text
200
201
400
401
403
404
409
422
429
500
```

---

# 41. Security Requirements

Implement:

```text
Helmet
CORS
Rate limiting
Input validation
JWT validation
RBAC
Permission authorization
MongoDB query sanitization
Request size limits
Secure cookies
Password hashing
```

Never trust frontend values for:

```text
role
status
permissions
userId
employeeId
departmentId
```

Always validate server-side.

---

# 42. Data Privacy

Use least-privilege access.

Employees should not automatically see another employee's:

```text
Personal address
Emergency contact
Attendance
Private HR information
Sensitive employment information
```

Use DTOs instead of returning raw MongoDB documents.

Example DTOs:

```text
EmployeeListDTO
EmployeeDetailsDTO
EmployeeSelfProfileDTO
AdminEmployeeDTO
```

---

# 43. Logging

Log:

```text
timestamp
level
requestId
method
path
statusCode
duration
userId
```

Never log:

```text
Password
JWT
Refresh Token
Password Hash
Sensitive personal data
```

Every request should have:

```text
X-Request-ID
```

---

# 44. Testing

## Unit Tests

Test:

```text
Password hashing
JWT generation
Permission checks
Employee status transitions
Leave rules
Attendance rules
```

## Integration Tests

Test:

```text
Signup
Login
Approval
Employee CRUD
Department CRUD
Team CRUD
Leave workflow
Attendance workflow
Invitation workflow
```

## Authorization Tests

Test:

```text
Employee cannot access admin API
Employee cannot read another employee
Manager cannot access unrelated team
Admin cannot modify Super Admin
Admin cannot create Super Admin
Employee cannot approve own leave
Expired invitation cannot be accepted
Expired JWT cannot be accepted
Deleted employee is excluded from normal queries
```

---

# 45. API Documentation

Provide Swagger/OpenAPI:

```text
/api-docs
```

Document:

- Authentication
- Request schemas
- Response schemas
- Error responses
- Authorization
- Query parameters

---

# 46. Seed Data

Development seed:

```text
1 Super Admin
2 Admins
1 HR Manager
2 Managers
10 Employees
5 Departments
8 Teams
Roles
Permissions
Leave Types
Organization Settings
```

Command:

```bash
npm run seed
```

---

# 47. Development Phases

## Phase 1 — Foundation

```text
Project setup
MongoDB
Authentication
JWT
Refresh tokens
RBAC
Permission system
```

## Phase 2 — Organization

```text
Employees
Departments
Teams
Managers
Organization tree
```

## Phase 3 — Employee Lifecycle

```text
Invitations
Onboarding
Approval
Employee status
Employee history
```

## Phase 4 — Employee Self-Service

```text
Profile
Notifications
Leave
Attendance
```

## Phase 5 — Administration

```text
Audit logs
Roles
Permissions
Settings
Bulk operations
Export
Soft delete
Restore
```

## Phase 6 — Engineering Quality

```text
Tests
Swagger
Logging
Request IDs
Rate limiting
Docker
CI/CD
```

---

# 48. V2 MVP Acceptance Criteria

### Authentication

- [ ] Signup works
- [ ] Login works
- [ ] Password is hashed
- [ ] JWT authentication works
- [ ] Refresh token works
- [ ] Logout works
- [ ] Password change works

### Organization

- [ ] Departments can be created/updated
- [ ] Teams can be created/updated
- [ ] Employees can be assigned to departments
- [ ] Employees can be assigned to teams
- [ ] Employees can have managers
- [ ] Organization tree works

### Employees

- [ ] Employee CRUD works
- [ ] Employee code is generated
- [ ] Employee search works
- [ ] Filtering works
- [ ] Sorting works
- [ ] Pagination works
- [ ] Employee profile works
- [ ] Employee lifecycle works
- [ ] Soft delete works
- [ ] Restore works

### Authorization

- [ ] Super Admin has full access
- [ ] Admin has administrative access
- [ ] HR Manager has HR access
- [ ] Manager has scoped team access
- [ ] Employee has self-service access
- [ ] Permissions are independent of UI
- [ ] Backend authorization cannot be bypassed

### Onboarding

- [ ] Employee invitation works
- [ ] Invitation token expires
- [ ] Invitation is single-use
- [ ] Employee can set password
- [ ] Employee can complete onboarding

### Leave

- [ ] Employee can create leave request
- [ ] Manager can review team leave
- [ ] HR can manage leave
- [ ] Leave approval/rejection is audited

### Attendance

- [ ] Clock-in works
- [ ] Clock-out works
- [ ] Duplicate clock-in is blocked
- [ ] Invalid clock-out is blocked
- [ ] Employee can view own attendance

### Administration

- [ ] Audit logs work
- [ ] Employee history works
- [ ] Notifications work
- [ ] Organization settings work
- [ ] CSV export works
- [ ] Bulk employee operations work

---

# 49. Definition of Done

V2 is complete when:

1. An organization can be configured.
2. Departments and teams can be created.
3. Employees can be created or invited.
4. Employees have unique employee codes.
5. Employees can have managers.
6. Employees can complete onboarding.
7. Employee lifecycle states are tracked.
8. Employees can manage permitted profile information.
9. Managers can access only their authorized scope.
10. HR can manage employee lifecycle information.
11. Roles and permissions are independently enforced.
12. Admin actions are auditable.
13. Employee history is maintained.
14. Leave requests can be submitted and approved.
15. Basic attendance can be recorded.
16. Notifications are generated.
17. Soft deletion and restoration work.
18. Employee data is protected through least privilege.
19. APIs are documented.
20. Core workflows have automated tests.
21. The architecture supports additional HR modules without rewriting the core system.

---

# 50. Future V3 Modules

Keep the architecture extensible for:

```text
Payroll
Performance Reviews
Employee Goals
Asset Management
Expense Management
Recruitment
Job Openings
Candidate Management
Onboarding Checklists
Offboarding
Document Management
Company Policies
Training
Certifications
Employee Skills
Internal Transfers
Promotion Workflow
Salary History
Shift Management
Timesheets
Holiday Calendar
Expense Approval
Travel Requests
Work From Home Requests
```

---

# 51. Final Product Direction

The project should evolve from:

```text
Simple Admin Dashboard
```

into:

```text
Employee Management Platform
```

with:

```text
                    Organization
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     Departments       Teams          Roles
          │              │              │
          └──────────────┼──────────────┘
                         │
                    Employees
                         │
       ┌─────────────────┼──────────────────┐
       │                 │                  │
   Onboarding          Leave            Attendance
       │                 │                  │
       └─────────────────┼──────────────────┘
                         │
                   Notifications
                         │
                    Audit Logs
                         │
                  Administration
```

The main objective is to build a realistic employee-management application rather than a collection of CRUD pages.

The project should demonstrate:

- Authentication
- JWT
- Refresh tokens
- RBAC
- Permission systems
- Resource-level authorization
- Organizational hierarchy
- Employee lifecycle management
- Employee onboarding
- Workflow processing
- Leave management
- Attendance
- Notifications
- Auditability
- Soft deletion
- Data integrity
- MongoDB transactions
- Secure API design
- Scalable modular architecture
- Automated testing
