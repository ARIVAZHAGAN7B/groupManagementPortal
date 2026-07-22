# Group Management Portal

Group Management Portal is a full-stack web application for running student group operations from a single place. It combines a React admin and student dashboard with an Express + MySQL backend that handles authentication, groups, memberships, phases, eligibility, events, teams, hubs, event groups, audit logs, and real-time notifications.

The repository is split into two standalone apps:

- `client/`: Vite + React frontend
- `server/`: Express API, Socket.IO server, scheduled jobs, and MySQL schema/scripts

## What The Project Covers

The platform supports two main user experiences:

- `STUDENT`: personal dashboard, group details, team and hub discovery, event participation, event-group requests, leaderboard, and eligibility history
- `ADMIN` / `SYSTEM_ADMIN`: group creation and maintenance, membership management, student management, event management, team and hub operations, phase configuration/history, eligibility controls, holidays and incubation settings, leadership and tier requests, and audit logs

Core domain areas already present in the codebase:

- Cookie-based authentication with JWT-backed sessions
- Role-based access control
- Group and membership lifecycle management
- Join request flows for groups and event groups
- Team, hub, and event-group management
- Event lifecycle management
- Phase scheduling, finalization, and target tracking
- Eligibility scoring and base-point management
- Group points and leaderboard support
- Leadership-role and group-tier request workflows
- Audit logging
- Real-time updates with Socket.IO

## Tech Stack

### Frontend

- React 19
- React Router 7
- Redux Toolkit
- Axios
- Socket.IO client
- Material UI
- Tailwind CSS 4
- Vite 7

### Backend

- Node.js
- Express 5
- MySQL 8 with `mysql2`
- JWT + cookie-based auth
- Socket.IO
- Joi validation
- `node-cron` for scheduled jobs
- `nodemon` for local server startup

## Repository Layout

```text
groupManagementPortal/
|-- client/
|   |-- public/
|   |-- src/
|   |   |-- admin/                # Admin routes, pages, and components
|   |   |-- students/             # Student routes, pages, and components
|   |   |-- shared/               # Shared pages, UI, theme, route helpers
|   |   |-- service/              # API wrappers by domain
|   |   |-- store/                # Redux store and slices
|   |   |-- hooks/                # Reusable frontend hooks
|   |   |-- lib/                  # Axios base client, cache, realtime client
|   |   `-- utils/
|   |-- .env.example
|   `-- package.json
|-- server/
|   |-- config/                   # Env loading, runtime config, DB pool
|   |-- controllers/              # Auth and registration controllers
|   |-- middlewares/              # Auth and role middleware
|   |-- jobs/                     # Phase scheduling and cron finalization
|   |-- modules/                  # Domain modules (groups, phases, events, etc.)
|   |-- realtime/                 # Socket.IO setup and room sync helpers
|   |-- routes/                   # Auth and registration routes
|   |-- scripts/                  # Schema, index, and bootstrap utilities
|   |-- sql/                      # Core auth schema files
|   |-- .env.example
|   `-- package.json
`-- README.md
```

## Architecture Overview

At a high level, the app works like this:

1. The Vite frontend calls the Express API with `withCredentials: true`.
2. The backend authenticates users from the `token` cookie.
3. Business logic is organized by domain module under `server/modules/*`.
4. Data is stored in MySQL and initialized from SQL schema files in the repo.
5. Socket.IO reuses the authenticated cookie and places users into scoped rooms for real-time updates.
6. Background jobs handle phase-end scheduling and phase finalization sweeps.

## Main Functional Areas

### Frontend Areas

- Admin routes are defined in `client/src/admin/adminRoutes.jsx`
- Student routes are defined in `client/src/students/studentRoutes.jsx`

Important admin screens include:

- dashboard
- audit logs
- groups and group details/edit flows
- event management and event details
- student management
- membership management
- team management
- team membership management
- team target management
- phase configuration and phase history
- eligibility management
- holiday management
- incubation configuration
- leadership request management
- tier change request management

Important student screens include:

- dashboard
- my group
- all groups
- group details
- teams and team details
- hubs and hub details
- events and event-group details
- my teams / my hubs / my event groups
- leaderboard
- eligibility history

### Backend Modules

The Express app mounts the following API areas:

| Route Prefix | Purpose |
| --- | --- |
| `/api/auth` | login, logout, session inspection |
| `/api/register` | create students, admins, or seed students |
| `/api/groups` | group CRUD, status, and tier operations |
| `/api/membership` | group membership and rank management |
| `/api/join-requests` | group join request workflow |
| `/api/phases` | phase creation, targets, scheduling, and history |
| `/api/eligibility` | eligibility status, base points, overrides, and history |
| `/api/events` | event CRUD and lifecycle actions |
| `/api/teams` | teams, hubs, memberships, and team operations |
| `/api/event-groups` | alias of team routes for event-group UX |
| `/api/event-join-requests` | event-group join requests |
| `/api/event-group-join-requests` | alias of event join request routes |
| `/api/audit-logs` | audit log listing |
| `/api/system-config` | policy, incubation, holidays |
| `/api/leadership-requests` | leadership role request workflow |
| `/api/group-tier-requests` | group tier change requests |
| `/api/team-change-tier` | team tier preview and apply endpoints |
| `/api/team-targets` | team target configuration |
| `/api/group-points` | group point ledger and totals |
| `/api/profile` | authenticated profile lookup |

## Data Model Snapshot

The main MySQL tables are grouped roughly like this:

- Authentication and identity: `users`, `students`, `admins`
- Groups: `sgroup`, `memberships`, `join_requests`, `group_rank`, `group_rank_rules`
- Events and team structures: `events`, `teams`, `team_membership`, `event_join_request`
- Phases and targets: `phases`, `phase_targets`, `individual_phase_target`, `phase_end_jobs`
- Eligibility: `base_points`, `base_point_history`, `individual_eligibility`, `group_eligibility`, related points and totals tables
- Governance and operations: `system_settings`, `holidays`, `audit_logs`
- Requests and changes: `leadership_role_requests`, `group_tier_change_requests`, `team_change_tier`, `team_target`, `group_points`

Terminology used in the project:

- `Group`: the main student group entity
- `Team`: a general sub-entity with `team_type = TEAM`
- `Hub`: a team with `team_type = HUB`
- `Event Group`: represented in the backend by team records with `team_type = EVENT`
- `Phase`: a dated operational period with targets and end-of-phase processing

## Local Development Setup

### Prerequisites

- Node.js LTS installed locally
- npm installed locally
- MySQL 8+ available
- A database created ahead of time for the app to connect to

This repo does not have a root `package.json`, so install and run the frontend and backend separately.

### 1. Install Dependencies

```powershell
cd server
npm install

cd ..\client
npm install
```

### 2. Create Environment Files

Copy the example files:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

For local development on `http://localhost`, update the server env so cookies work without HTTPS. A practical local setup looks like this:

```dotenv
# server/.env
NODE_ENV=development
PORT=5000

JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=1d

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=group_management_portal
DB_WAIT_FOR_CONNECTIONS=true
DB_CONNECTION_LIMIT=10
DB_MAX_IDLE=10
DB_IDLE_TIMEOUT_MS=60000
DB_QUEUE_LIMIT=0
DB_ENABLE_KEEPALIVE=true
DB_KEEPALIVE_INITIAL_DELAY_MS=0

CORS_ALLOWED_ORIGINS=http://localhost:5173
FRONTEND_ORIGIN=http://localhost:5173
COOKIE_SAME_SITE=lax
COOKIE_SECURE=false
COOKIE_DOMAIN=

PHASE_FINALIZER_CRON_ENABLED=true
PHASE_FINALIZER_CRON=*/15 * * * * *
HOLIDAY_CACHE_TTL_MS=300000
```

The client needs to know where the API lives:

```dotenv
# client/.env
VITE_API_BASE_URL=http://localhost:5000
```

Notes:

- `server/config/env.js` treats most backend env vars as required.
- `client/src/lib/api.ts` falls back to `window.location.origin` if `VITE_API_BASE_URL` is missing, which is usually not correct during local Vite development. Set it explicitly.
- The example server env is closer to a deployed HTTPS setup. For local HTTP development, `COOKIE_SECURE=false` and `COOKIE_SAME_SITE=lax` are usually required.

### 3. Create The Database Schema

Create the database manually first, then apply the repo schema from the `server` directory:

```powershell
cd server
npm run schema:apply
npm run indexes:apply
```

What these scripts do:

- `schema:apply`: runs all SQL files listed in `server/scripts/applySchema.js`
- `indexes:apply`: applies additional performance-oriented indexes if they do not already exist

### 4. Bootstrap The First Admin

After the schema is ready, create an initial admin account.

PowerShell example:

```powershell
cd server
$env:BOOTSTRAP_ADMIN_ID="ADM001"
$env:BOOTSTRAP_ADMIN_NAME="System Admin"
$env:BOOTSTRAP_ADMIN_EMAIL="admin@example.com"
$env:BOOTSTRAP_ADMIN_PASSWORD="ChangeMe123!"
$env:BOOTSTRAP_ADMIN_ROLE="SYSTEM_ADMIN"
npm run admin:bootstrap
```

Accepted bootstrap roles:

- `ADMIN`
- `SYSTEM_ADMIN`

### 5. Start The Backend

```powershell
cd server
npm start
```

The backend startup does more than just run Express:

- verifies the MySQL connection
- starts the phase-end scheduler
- starts the cron-based phase-finalization sweep
- warms up membership rank review syncing
- warms up eligibility point allocation syncing
- initializes Socket.IO on the same HTTP server

### 6. Start The Frontend

In a second terminal:

```powershell
cd client
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Environment Variables

### Server Environment

The backend loads `.env` from `server/.env`.

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | Yes | runtime environment name |
| `PORT` | Yes | API server port |
| `JWT_SECRET` | Yes | secret used to sign auth tokens |
| `JWT_EXPIRES_IN` | Yes | session duration string such as `1d` |
| `DB_HOST` | Yes | MySQL host |
| `DB_PORT` | Yes | MySQL port |
| `DB_USER` | Yes | MySQL username |
| `DB_PASSWORD` | Yes | MySQL password |
| `DB_NAME` | Yes | MySQL database name |
| `DB_WAIT_FOR_CONNECTIONS` | Yes | pool wait mode, boolean |
| `DB_CONNECTION_LIMIT` | Yes | max pool size |
| `DB_MAX_IDLE` | Yes | max idle connections |
| `DB_IDLE_TIMEOUT_MS` | Yes | idle timeout for pooled connections |
| `DB_QUEUE_LIMIT` | Yes | queued request limit |
| `DB_ENABLE_KEEPALIVE` | Yes | enables TCP keepalive |
| `DB_KEEPALIVE_INITIAL_DELAY_MS` | Yes | keepalive start delay |
| `CORS_ALLOWED_ORIGINS` | Recommended | comma-separated allowed origins |
| `FRONTEND_ORIGIN` | Recommended | frontend origin list merged into CORS allowlist |
| `COOKIE_SAME_SITE` | Yes | `lax`, `strict`, or `none` |
| `COOKIE_SECURE` | Yes | `true` for HTTPS-only cookies |
| `COOKIE_DOMAIN` | Optional | cookie domain override |
| `PHASE_FINALIZER_CRON_ENABLED` | Yes | enables or disables cron sweep |
| `PHASE_FINALIZER_CRON` | Yes | cron expression for phase finalization |
| `HOLIDAY_CACHE_TTL_MS` | Yes | holiday cache TTL in milliseconds |

### Client Environment

The frontend reads `.env` from `client/.env`.

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Strongly recommended | absolute base URL for the Express API |
| `VITE_BACKEND_API` | Optional fallback | legacy fallback name also supported by the client |

## Available Scripts

### Server Scripts

| Command | Description |
| --- | --- |
| `npm start` | starts the API with `nodemon` |
| `npm run schema:apply` | applies all SQL schema files |
| `npm run indexes:apply` | applies missing performance indexes |
| `npm run admin:bootstrap` | creates the first admin account |

### Client Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | starts the Vite development server |
| `npm run build` | creates a production build |
| `npm run preview` | previews the production build locally |
| `npm run lint` | runs ESLint |

## Authentication And Session Model

- Login is handled at `/api/auth/login`
- Auth state is stored in an HTTP-only `token` cookie
- Protected routes use `server/middlewares/auth.middleware.js`
- Role checks use `server/middlewares/role.middleware.js`
- Session expiry is derived from the configured JWT expiry and returned to the client
- The client auto-checks `/api/auth/me` on load and clears local session state when the token expires

## Real-Time Layer

Socket.IO is initialized in `server/realtime/socket.js`.

Important implementation details:

- socket auth is based on the same `token` cookie used by the API
- connected users are automatically placed into rooms for:
  - all authenticated users
  - their user id
  - their role
  - their student/admin scope
  - their groups
  - their teams
- the client reconnects and triggers `realtime:sync` after connecting
- reusable event constants live in `client/src/lib/realtime.js`

This makes the system ready for real-time updates to dashboards, request queues, memberships, eligibility views, and admin notifications.

## Scheduled Jobs And Automation

Two background flows matter in development and production:

### Phase End Scheduler

Implemented in `server/jobs/phaseEndScheduler.js`.

It:

- stores pending phase end jobs in `phase_end_jobs`
- calculates the next due wake-up time
- retries failed jobs with backoff
- calls phase finalization when a phase reaches its end time

### Phase Finalization Cron

Implemented in `server/jobs/phaseFinalization.cron.js`.

It:

- runs on the cron expression from `PHASE_FINALIZER_CRON`
- can be disabled with `PHASE_FINALIZER_CRON_ENABLED=false`
- performs a catch-up sweep on startup

## Production Notes

For a deployed environment:

- serve the API and frontend over HTTPS
- set `COOKIE_SECURE=true`
- if frontend and backend use different origins, `COOKIE_SAME_SITE=none` is commonly required
- make sure `CORS_ALLOWED_ORIGINS` and `FRONTEND_ORIGIN` exactly match the deployed frontend URL(s)
- set `VITE_API_BASE_URL` to the public API origin before building the client
- run schema and index scripts before first production startup

## Troubleshooting

### Login Works But The Session Does Not Persist

Check the cookie settings first:

- local HTTP development usually needs `COOKIE_SECURE=false`
- cross-origin HTTPS deployments usually need `COOKIE_SAME_SITE=none`
- the frontend must call the correct backend origin via `VITE_API_BASE_URL`

### CORS Errors

- make sure the frontend origin is included in `CORS_ALLOWED_ORIGINS` or `FRONTEND_ORIGIN`
- the runtime strips trailing slashes, so use clean origin values like `http://localhost:5173`

### Schema Script Fails

- verify the database already exists
- verify the credentials in `server/.env`
- confirm the MySQL user can create tables, indexes, and foreign keys

### Realtime Events Do Not Arrive

- confirm the browser is authenticated
- confirm the cookie is being sent to the API origin
- check that the Socket.IO origin matches `VITE_API_BASE_URL`

## Testing Status

There is currently no meaningful automated backend test suite in the repository, and the backend `test` script is still a placeholder. The main validation paths available today are:

- `client`: `npm run lint`
- `client`: `npm run build`
- manual end-to-end verification in the browser

If you continue developing this project, adding API tests around auth, phases, eligibility, and membership workflows would be a strong next step.
