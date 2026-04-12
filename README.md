# UrbanPulse

UrbanPulse is a neighborhood coordination app built with Bun, Hono, React, and Postgres/PostGIS.

The current app focuses on helping nearby people discover urgent local needs, publish resources, respond to community requests, and receive live notifications when something important happens around them.

## What The App Can Do Right Now

### Authentication And Access
- Sign up and sign in flows
- Forgot password flow
- Protected app shell for authenticated users

### Dashboard
- Neighborhood dashboard route
- Live neighborhood pulse feed driven by backend data
- Feed filtering by:
  - distance
  - pulse type
  - urgency
  - status
- Severe weather banner that can launch a safety check-in flow

### Map And Pulse Reporting
- Map view centered on the user’s geolocation
- Pulse heatmap overlay
- Pulse markers rendered on the map
- Create a pulse from the map
- Emergency launch shortcut for urgent pulse creation
- Pulse retrieval based on the user’s location
- Pulse update actions for existing pulses

### Real-Time Behavior
- Nearby users receive a live notification when a pulse is uploaded near them
- Pulse owners receive a live notification when someone offers help
- Notifications update without a full page refresh
- Pulse lists refresh in response to live events
- User location is synced to the notification socket so “nearby” behavior works in real time

### Alerts And Response Handling
- Alerts page with notification history
- Live alert rows with payload details
- Quick actions to accept or reject help offers directly from alerts
- Snackbar prompt when a new help offer arrives for one of your pulses

### Skills, Resources, And Borrowing
- Skills & Resources area with tabbed sections
- Resource upload flow
- Resource listing flow
- Borrow request creation
- Pending borrow requests view for lenders
- Accept / reject actions for borrow requests

### Messaging
- Current messages page acts as a coordination surface for pending borrow requests
- Transaction decisions can be handled from the UI

### Backend And Data Layer
- Hono API with typed client integration
- Shared validation and types across client and server
- Postgres-backed repositories
- WebSocket support for pulse and notification flows
- Real repository integration tests using Bun + a Docker-backed Postgres test database

## Current Product Status

The app already demonstrates the core UrbanPulse interaction model:

1. A user opens the dashboard or map
2. The app retrieves nearby pulses using location-aware queries
3. A user can create a new pulse from the map
4. Nearby connected users receive a live notification
5. Another user can offer help
6. The pulse owner receives the help offer in real time
7. The owner can accept or reject the offer from the alerts UI

That means the project already has a working base for:
- local discovery
- urgent reporting
- community response
- real-time notifications
- lightweight coordination

## Screens In The App

- `/` landing page
- `/signup`
- `/signin`
- `/forgot-password`
- `/dashboard`
- `/map`
- `/resources`
- `/alerts`
- `/messages`
- `/admin`
- `/settings`
- `/profile`

## Still In Progress

Some parts of the product are still partial or placeholder-level:

- `Profile`
- `Settings`
- `Admin / moderation`
- Full messaging / inbox experience
- Some dashboard stats still need to be fully backend-driven
- Trust / verification / moderation workflows are not complete yet

The implementation roadmap for the missing work lives in [IMPLEMENTATION_GAPS.md](./IMPLEMENTATION_GAPS.md).

## Tech Stack

- Bun
- Hono
- React
- Vite
- TanStack Query
- HeroUI
- Better Auth
- Drizzle ORM
- Postgres + PostGIS
- Turbo
- Biome

## Monorepo Structure

```text
.
├── ai/          # Public FastAPI microservice
├── client/      # React frontend
├── server/      # Hono API, services, repositories, websocket flows
├── shared/      # Shared validators, contracts, and types
└── docker-compose.test.yaml
```

## Development

### Install

```bash
bun install
```

### Run The App

```bash
bun run dev
```

Useful workspace-specific commands:

```bash
bun run dev:ai
bun run dev:client
bun run dev:server
```

The FastAPI service is exposed directly to the frontend as a separate public API.
Use `VITE_AI_URL` in the client when you start calling FastAPI endpoints from the
browser. Locally, the AI service runs on `http://localhost:8000` by default and
exposes `/docs`, `/openapi.json`, `/health`, and `/api/v1/ping`.

### Build

```bash
bun run build
```

## Testing

Testing is workspace-based locally, matching the CI workflow rather than repo-root `bun test`.

Client verification:

```bash
bun run --cwd client test
bun run --cwd client type-check
bun run --cwd client build
```

Server tests run against a real Postgres test database started through Docker. From
`server/`, plain `bun test` manages the repository-test lifecycle automatically, and
`test:services` now uses the same DB-backed setup for service tests that call
`resetDatabase`:

```bash
cd server
bun test
bun run test:services
```

Helpful server DB scripts:

```bash
bun run test:db:up
bun run test:db:down
```

The canonical deploy, Railway env, and database contract now live in
[DEPLOYMENT.md](/Volumes/Projects/urbanpulse/DEPLOYMENT.md).

## Project Goals

UrbanPulse is being built toward a neighborhood resilience product that supports:
- live local pulse reporting
- safety check-ins
- skills and resource sharing
- real-time coordination
- moderation and trust systems
- broader community support workflows

## Notes

- The README reflects the app as it currently exists in the repository, not the final target spec.
- If you want the missing features grouped into execution phases, see [IMPLEMENTATION_GAPS.md](./IMPLEMENTATION_GAPS.md).
