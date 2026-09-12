# Velozity Agency — Real-Time Client Project Dashboard

A full-stack, enterprise-grade project management dashboard built for an agency to manage client projects, track task delivery progress, and monitor team activity in real time.

Built with **React 18 + TypeScript (Vite)** on the frontend, **Node.js + Express with TypeScript** on the backend, **PostgreSQL with Prisma ORM**, **Socket.io** for real-time WebSocket pipelines, and **node-cron** for background overdue task scheduling.

---

## Technical Highlights & Compliance Matrix

| Requirement | Implementation Details | Status |
| :--- | :--- | :---: |
| **Three-Tier Role Access** | Enforced at API level via `authenticateToken`, `requireRole`, and resource-level guards (`verifyProjectAccess`). Developers cannot access PM data even with direct modified requests. | ✅ 100% |
| **Authentication & Refresh** | Short-lived JWT access token + long-lived refresh token stored in **HttpOnly, SameSite=Lax cookie**. Refresh token rotation with DB revocation. | ✅ 100% |
| **Real-Time Activity Feed** | Authenticated Socket.io pipeline with role-scoped room distribution (`role:ADMIN`, `pm:<id>`, `dev:<id>`). Formatted as `"Ravi moved Task #12 from In Progress → In Review · 2 mins ago"`. | ✅ 100% |
| **Missed Event Catchup** | Offline users reconnecting receive the last 20 missed events queried directly from PostgreSQL database with role filtering (not in-memory cache). | ✅ 100% |
| **Scheduled Overdue Tasks** | Background `node-cron` job automatically checks and flags tasks past their due date as `isOverdue = true` and broadcasts live WebSocket sweep events. | ✅ 100% |
| **In-App Notifications** | Triggered on developer task assignment and when tasks are moved to `IN_REVIEW`. Badge counter updates in real time via WebSocket. | ✅ 100% |
| **URL-Shareable Filters** | Task filters (status, priority, timeline, search) are synchronized two-way with browser URL query parameters (`?status=IN_PROGRESS&priority=HIGH`). | ✅ 100% |
| **Seed Data** | 1 Admin, 2 Project Managers, 4 Developers, 3 Clients, 3 Projects, 16+ Tasks, 3 Overdue tasks, and pre-existing activity log history. | ✅ 100% |

---

## Architectural Decisions & Technical Justifications

### 1. WebSocket Library Choice: Socket.io vs. Native WebSocket
- **Why Socket.io?**:
  1. **Built-in Room Architecture**: Native WebSocket requires writing custom multiplexing and room management logic from scratch. Socket.io natively provides robust room isolation (`socket.join('project:123')`, `socket.join('pm:user-id')`), making role-filtered broadcasting clean and reliable.
  2. **Connection State Recovery & Heartbeats**: Socket.io handles automatic reconnection with exponential backoff, ping-pong heartbeat health checks, and connection recovery out of the box.
  3. **Handshake Middleware Authentication**: Allows validating the JWT access token during connection handshake (`io.use()`), preventing unauthenticated sockets from ever connecting.

### 2. Job Queue Choice: node-cron vs. Bull / Redis
- **Why node-cron?**:
  1. **Zero External Infrastructure Dependency**: Bull requires an active Redis cluster. For this application's overdue task sweep, `node-cron` runs within the Node.js runtime, keeping local development, CI/CD, and Docker deployment lightweight and self-contained.
  2. **Predictable Batch Database Updates**: Overdue checking is inherently a scheduled interval batch sweep (`dueDate < NOW() AND status != 'DONE' AND isOverdue = false`), which aligns naturally with cron schedules rather than individual point-in-time job queues.

### 3. Token Storage Approach: Access Token + HttpOnly Refresh Cookie
- **Why HttpOnly Cookie for Refresh Tokens?**:
  1. **XSS Protection**: Storing refresh tokens in `localStorage` leaves them completely vulnerable to cross-site scripting (XSS) extraction. An `HttpOnly`, `SameSite=Lax`, `Secure` cookie cannot be read or stolen by JavaScript.
  2. **Token Rotation**: Each refresh request revokes the used refresh token and generates a new hashed record in the PostgreSQL `RefreshToken` table, mitigating replay attacks.

---

## Database Schema & Indexing Strategy

```
+----------------+       +-------------------+       +-----------------------+
|     Client     | 1   * |      Project      | 1   * |         Task          |
+----------------+-------+-------------------+-------+-----------------------+
| id (PK)        |       | id (PK)           |       | id (PK)               |
| name           |       | name              |       | taskNumber (AutoInc)  |
| company (IX)   |       | description       |       | title                 |
| email          |       | status (IX)       |       | status (IX)           |
| phone          |       | clientId (FK, IX) |       | priority (IX)         |
+----------------+       | pmId (FK, IX)     |       | dueDate (IX)          |
                         +-------------------+       | isOverdue (IX)        |
                                   |                 | projectId (FK, IX)    |
                                   |                 | assignedToId (FK, IX) |
                                   |                 +-----------------------+
                                   |                             |
                                   | 1                           | 1
                                   |                             |
                                   | *                           | *
                         +-------------------+       +-----------------------+
                         |       User        |       |    TaskActivityLog    |
                         +-------------------+       +-----------------------+
                         | id (PK)           |       | id (PK)               |
                         | email (UQ, IX)    |       | taskId (FK, IX)       |
                         | passwordHash      |       | userId (FK, IX)       |
                         | name              |       | previousStatus        |
                         | role (IX)         |       | newStatus             |
                         | avatarUrl         |       | action                |
                         +-------------------+       | details               |
                                                     | timestamp (IX)        |
                                                     +-----------------------+
```

### Indexing Decisions Explained:
1. **`Task [projectId]` & `Task [assignedToId]`**: High-cardinality foreign keys used in every filtered query. Indexing ensures $O(\log N)$ lookups during role-scoped task queries.
2. **`Task [status]`, `Task [priority]`, `Task [dueDate]`, `Task [isOverdue]`**: Crucial for instant filtering when users slice by status, priority, or time ranges, and enables the `node-cron` overdue sweep to scan non-done tasks with minimal I/O.
3. **`TaskActivityLog [timestamp]`**: The activity feed requires ordering by `timestamp DESC` with role joins. A B-Tree index on `timestamp` avoids full table sorts.
4. **`Notification [userId, isRead]`**: Composite index that accelerates unread count aggregation (`SELECT COUNT(*) WHERE userId = ? AND isRead = false`).

---

## Local Setup Instructions

### Option 1: Docker Compose (Standard Evaluation)

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd velozity-dashboard
   ```

2. **Start PostgreSQL via Docker**:
   ```bash
   docker compose up -d
   ```

3. **Install Dependencies & Seed Database**:
   ```bash
   npm install
   npm run prisma:push
   npm run seed
   ```

4. **Start Development Servers**:
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

---

### Option 2: Zero-Dependency Local Setup (No Docker Required)

If Docker is not running on the evaluator's machine, the project includes an embedded native PostgreSQL binary runner:

1. **Start the Embedded PostgreSQL Server**:
   ```bash
   npm run db:local
   ```
   *(Starts PostgreSQL 18.4 on port 5432 with database `velozity_db` in `.pgdata`)*

2. **In a separate terminal, push schema and seed data**:
   ```bash
   npm run prisma:push
   npm run seed
   ```

3. **Start the Full Stack Application**:
   ```bash
   npm run dev
   ```

4. **Run the Automated Verification Test Suite**:
   ```bash
   npm run test:e2e
   ```

---

## Pre-Seeded Test Credentials

The application provides a **1-Click Evaluation Selector** directly on the Login page and a **Quick Role Switcher** in the top navbar:

| Role | Name | Email | Password | Scope & Access |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Alex Mercer | `admin@velozity.com` | `AdminPass123!` | Full access across all clients, projects, and users. Global activity feed. |
| **PM 1** | Priya Sharma | `pm1@velozity.com` | `PMPass123!` | Manages *NextGen Wealth* & *Fleet Logistics*. Project feed only. |
| **PM 2** | Marcus Vance | `pm2@velozity.com` | `PMPass123!` | Manages *Telehealth Portal*. Project feed only. Cannot see PM1 projects. |
| **Dev 1** | Ravi Patel | `dev1@velozity.com` | `DevPass123!` | Assigned tasks only (Fintech & Logistics). Cannot view other devs' tasks. |
| **Dev 2** | Elena Rostova | `dev2@velozity.com` | `DevPass123!` | Assigned tasks only. |
| **Dev 3** | Jordan Lee | `dev3@velozity.com` | `DevPass123!` | Assigned tasks only. |
| **Dev 4** | Aisha Khan | `dev4@velozity.com` | `DevPass123!` | Assigned tasks only. |

---

## Assessment Explanation (150–250 Words)

> **The hardest problem you solved, how you handled the real-time role-filtered feed, and one thing you'd do differently:**

The most challenging engineering problem was ensuring strict multi-tenant role isolation across both asynchronous WebSocket event streams and direct REST endpoints without sacrificing throughput. Rather than relying on fragile frontend role hiding, I implemented defense-in-depth where every query and socket broadcast is enforced at the database and middleware boundary.

For the real-time role-filtered feed, I designed a multi-room pub/sub topology in Socket.io verified by JWT handshake authentication. When a user connects, their socket automatically joins designated rooms: `role:ADMIN`, their personal role room (`pm:<pmId>` or `dev:<devId>`), and active project rooms (`project:<projectId>`). When a task transitions status, the server creates an immutable `TaskActivityLog` in PostgreSQL and dispatches the formatted payload (`"Ravi moved Task #12 from In Progress → In Review · 2 mins ago"`) simultaneously to `role:ADMIN`, `pm:<project.pmId>`, and `dev:<task.assignedToId>`. Offline users reconnecting fetch their last 20 missed events via `GET /api/activity/recent`, executed as a role-filtered SQL query indexed on `timestamp` rather than transient memory.

One thing I would do differently at larger enterprise scale is decoupling the WebSocket state and background scheduler into standalone microservices backed by Redis Streams or RabbitMQ. While Socket.io and `node-cron` provide an elegant, zero-dependency architecture for a small agency, distributed Redis pub/sub would allow horizontal multi-node cluster scaling with sticky sessions and zero duplicate cron sweeps.

---

## Known Limitations
1. **Single-Node WebSocket Presence**: Sockets track active presence in a process-local memory Map. For multi-node load-balanced deployments, Socket.io Redis Adapter (`@socket.io/redis-adapter`) should be enabled.
2. **File Attachments**: Tasks currently support markdown descriptions; binary file uploads are not persisted to S3/GCS.
