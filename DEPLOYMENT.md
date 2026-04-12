# Deployment

`DEPLOYMENT.md` is the canonical reference for UrbanPulse runtime wiring, database requirements, and release verification.

## Topology

- Cloudflare Pages is the canonical frontend host.
- Railway hosts the `urbanpulse` API, the `AI` service, `Redis`, and the managed `PostGIS` database.
- `urbanpulse` and `AI` share the same Railway Postgres database.

## Production Database Contract

UrbanPulse production expects a Railway PostgreSQL database with both of these extensions installed in the target database:

- `postgis`
- `vector`

The repo now enforces that contract in the server migration path:

- `bun run --cwd server db:migrate` bootstraps `postgis` and `vector` before Drizzle migrations run.
- `bun run --cwd server db:verify --smoke` confirms both extensions exist and runs a PostGIS plus vector-backed schema smoke test.
- Railway server deploys use `bun run start:railway`, which runs both of those steps before starting the API.

## Railway Environment Contract

For in-project service-to-service traffic, both app services must use Railway private networking:

- `urbanpulse` `DATABASE_URL` => `${{PostGIS.DATABASE_PRIVATE_URL}}`
- `AI` `DATABASE_URL` => `${{PostGIS.DATABASE_PRIVATE_URL}}`

Use the PostGIS public TCP proxy URL only for manual debugging from outside Railway. It should not be the steady-state production connection string for app services.

## Local Database Parity

Local Docker Postgres must match production expectations:

- image base: `postgis/postgis`
- vector support: installed through `postgresql-16-pgvector`

Those requirements live in:

- [docker/postgres/Dockerfile](/Volumes/Projects/urbanpulse/docker/postgres/Dockerfile)
- [docker-compose.yaml](/Volumes/Projects/urbanpulse/docker-compose.yaml)
- [docker-compose.test.yaml](/Volumes/Projects/urbanpulse/docker-compose.test.yaml)

## Canonical Deploy Flow

1. Deploy the frontend to Cloudflare Pages.
2. Deploy the Railway `urbanpulse` service with [railway.toml](/Volumes/Projects/urbanpulse/railway.toml).
3. Deploy the Railway `AI` service with [ai/railway.toml](/Volumes/Projects/urbanpulse/ai/railway.toml).
4. Confirm both Railway app services reference the PostGIS private database URL.
5. Run the release verification command after deployment.

## Release Verification

Run the deployment check from an environment that can reach the configured `DATABASE_URL`:

```bash
bun run verify:deploy
```

`verify:deploy` checks:

- Pages homepage returns `200`
- server `/api/health` returns `200`
- AI `/health` returns `200`
- `pg_extension` contains both `postgis` and `vector`
- a PostGIS smoke query succeeds
- the vector-backed `public.pet_alert.imageEmbedding` schema path is present

Optional override env vars for the verification command:

- `DEPLOY_CHECK_WEB_URL`
- `DEPLOY_CHECK_SERVER_URL`
- `DEPLOY_CHECK_AI_URL`

If those are unset, the command falls back to `CLIENT_URL`, `SERVER_URL`, `AI_PUBLIC_URL`, `VITE_AI_URL`, and `RAILWAY_SERVICE_AI_URL`.

## Blank Database Recovery

If Railway reprovisions the database or you point the stack at a fresh database:

1. Set both app services to the target database URL.
2. Run the server deploy/start path so `db:migrate` executes.
3. Run `bun run verify:deploy`.

No manual extension creation should be required after this hardening work.
