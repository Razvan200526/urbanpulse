# UrbanPulse AI Service

This directory contains the public FastAPI microservice for AI-specific endpoints.
It is separate from the Bun API in `/server` and is intended to be called directly
from the client.

## Local Development

Run the AI service on its own:

```bash
bun run dev:ai
```

Or run the full monorepo stack, which now includes the AI workspace:

```bash
bun run dev
```

The service starts on `http://localhost:8000` by default and exposes:

- `/`
- `/docs`
- `/openapi.json`
- `/health`
- `/api/v1/ping`

## Environment

Copy the values from `.env.example` into your environment or your deploy target.

- `PORT`: Public HTTP port for the FastAPI server. Defaults to `8000`.
- `CLIENT_URL`: Comma-separated frontend origins that may call this API.
- `AI_CORS_ORIGINS`: Explicit comma-separated CORS allowlist for public browser access.

If both `CLIENT_URL` and `AI_CORS_ORIGINS` are unset, the service falls back to
local Vite-friendly origins such as `http://localhost:5173`.

## Client Setup

When the React app starts calling the FastAPI service directly, point it at the
public URL with:

```bash
VITE_AI_URL=http://localhost:8000
```

## Railway

This service has its own Railway config at `ai/railway.toml` and deploys
independently from the Bun server and Vite client.

1. Create a new Railway service from this repository.
2. Point that service at `/ai/railway.toml`.
3. Generate a public domain for the service.
4. Set `CLIENT_URL` or `AI_CORS_ORIGINS` to your frontend domain.
5. Set `VITE_AI_URL` on the frontend service to the generated FastAPI domain.

The Railway deployment uses `ai/Dockerfile` so the Python build is isolated from
the Node/Bun workspaces in the rest of the monorepo.
