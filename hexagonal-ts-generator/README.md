# Hexagonal TS Generator v2 — World-Class Edition

> TypeScript code generator that introspects a PostgreSQL database and emits a
> **fully production-ready Hexagonal-Architecture REST API** with:
>
> - **Domain-Driven Design** (entities, value objects, domain events, aggregate roots, unit of work)
> - **CQRS** (command bus + query bus + per-table handlers)
> - **Enterprise Bus** (async fire-and-forget pub/sub)
> - **Enterprise Repository pattern** (generic CRUD base + per-table repos)
> - **OpenAPI 3 / Swagger UI** auto-generated from introspected schema
> - **Structured JSON logging** with correlation IDs + child loggers at every layer
> - **JWT authentication + RBAC authorization** baked into every controller
> - **Rate limiting, Helmet, CORS hardening, response compression**
> - **Health checks** (liveness + readiness probes for k8s)
> - **Prometheus metrics** endpoint
> - **OpenTelemetry distributed tracing** (auto-instrumentation)
> - **Circuit Breaker + Retry with exponential backoff**
> - **Env validation with zod** (fail-fast on misconfiguration)
> - **Graceful shutdown** with in-flight request tracking
> - **Docker** (multi-stage, distroless, non-root)
> - **docker-compose** (API + PostgreSQL) for local dev
> - **GitHub Actions CI** (lint, type-check, test, security scan, Docker build)
> - **ESLint + Prettier + Husky + commitlint + editorconfig**
> - **Per-table tests**: unit (mocked) + integration (real DB) + e2e (supertest)
>
> Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
> Author: Awase Khirni Syed

---

## Table of Contents

1. [What this generator does](#1-what-this-generator-does)
2. [Architecture overview](#2-architecture-overview)
3. [Quickstart (5 minutes)](#3-quickstart-5-minutes)
4. [Step-by-step implementation guide](#4-step-by-step-implementation-guide)
5. [Configuration reference](#5-configuration-reference)
6. [Testing strategy](#6-testing-strategy)
7. [Observability](#7-observability)
8. [Security](#8-security)
9. [Deployment](#9-deployment)
10. [Migrating from v1](#10-migrating-from-v1)

---

## 1. What this generator does

Given a PostgreSQL connection string, the generator:

1. **Reflects** the schema (tables, columns, PKs, FKs, unique constraints) directly from `information_schema` + `pg_catalog`. No `sqlacodegen` needed.
2. **Analyzes** each table to detect: timestamps, status columns, soft-delete, user relations, enum-like columns, FK relations.
3. **Generates per-table artefacts** (10 files per table):
   - `domain/<table>/<table>.entity.ts` — TypeORM entity
   - `domain/<table>/<table>.repository.interface.ts` — repository contract
   - `domain/<table>/<table>.service.interface.ts` — service contract
   - `domain/<table>/<table>.events.ts` — domain events (Created/Updated/Deleted)
   - `infrastructure/repositories/<table>/<table>.repository.ts` — concrete repo
   - `application/services/<table>/<table>.service.ts` — concrete service
   - `application/cqrs/<table>/<table>.commands.ts` — CQRS command DTOs
   - `application/cqrs/<table>/<table>.queries.ts` — CQRS query DTOs
   - `application/cqrs/<table>/<table>.command-handlers.ts` — command handlers
   - `application/cqrs/<table>/<table>.query-handlers.ts` — query handlers
   - `application/cqrs/<table>/index.ts` — registers handlers
   - `api/controllers/<table>.controller.ts` — Express router (auth + logging + OpenAPI)
   - `api/dtos/<table>.dto.ts` — class-validator DTOs (Create/Update/Response)
   - `api/validations/<table>.validation.ts` — validation wrappers
   - `api/mappers/<table>.mapper.ts` — entity ↔ DTO mapper
   - `api/sito/<table>.sito.ts` — SITO facade (Service-Interface-Transformer-Operation)
   - `tests/unit/<table>.service.test.ts` — unit test (mocked repo)
   - `tests/integration/<table>.repository.test.ts` — integration test (real DB)
   - `tests/e2e/<table>.api.test.ts` — e2e test (supertest)

4. **Generates cross-cutting artefacts** (40+ shared files):
   - **Config**: `config/index.ts`, `config/env-schema.ts` (zod validation)
   - **Database**: `infrastructure/database/database.ts` (TypeORM + slow-query logger)
   - **Observability**: logger, tracing (OTel), metrics (Prometheus), request-logging middleware
   - **DDD**: domain events dispatcher, aggregate root base, unit of work, value objects
   - **CQRS**: command bus + query bus
   - **Enterprise Bus**: in-process pub/sub
   - **Security**: JWT auth middleware, RBAC authorization, rate limiter, Helmet, CORS
   - **Health**: liveness + readiness probes
   - **Resilience**: circuit breaker, retry-with-backoff, graceful shutdown
   - **OpenAPI 3**: spec builder + Swagger UI mount
   - **Express app**: factory + bootstrap
   - **DevOps**: Dockerfile, docker-compose, CI/CD, ESLint, Prettier, Husky, Makefile

---

## 2. Architecture overview

```
                          ┌──────────────────────────────────┐
                          │          API LAYER               │
   HTTP request ─────────►│  controllers, DTOs, mappers,    │
                          │  SITO facades, OpenAPI 3 docs    │
                          └──────────────┬───────────────────┘
                                         │ depends on
                                         ▼
                          ┌──────────────────────────────────┐
                          │      APPLICATION LAYER           │
                          │  services + CQRS handlers        │
                          │  (commands + queries)            │
                          └──────────────┬───────────────────┘
                                         │ depends on
                                         ▼
                          ┌──────────────────────────────────┐
                          │         DOMAIN LAYER             │  ← no TypeORM imports!
                          │  entities, value objects,         │
                          │  domain events, aggregate roots,  │
                          │  repository & service INTERFACES  │
                          │  (ports), unit of work            │
                          └──────────────┬───────────────────┘
                                         ▲ implemented by
                                         │
                          ┌──────────────────────────────────┐
                          │     INFRASTRUCTURE LAYER          │
                          │  TypeORM, PostgreSQL,             │
                          │  concrete repositories,            │
                          │  Enterprise Bus, OTel, etc.      │
                          └──────────────────────────────────┘
```

**Key invariants:**
- Domain layer NEVER imports TypeORM or any infrastructure code.
- Application layer depends on domain interfaces, NOT on infrastructure implementations.
- API layer depends on application services + SITO facades, NOT on repositories directly.

---

## 3. Quickstart (5 minutes)

```bash
# 1. Install the generator's dependencies
cd hexagonal-ts-generator
npm install

# 2. Configure the target database
cp .env.example .env
# Edit .env: set DATABASE_URL, PROJECT_DIR, APP_NAME, JWT_SECRET

# 3. Run the generator
npm start
# → Creates ./project/ with the full REST API

# 4. Boot the generated REST API
cd project
cp .env.example .env
npm install
npm run dev

# 5. Browse the API
open http://localhost:3000/health/live      # liveness probe
open http://localhost:3000/health/ready     # readiness probe
open http://localhost:3000/docs             # Swagger UI
open http://localhost:3000/metrics          # Prometheus metrics
```

---

## 4. Step-by-step implementation guide

This section walks you through every step from zero to a running production API.

### Step 1 — Install the generator

```bash
git clone <your-repo> hexagonal-ts-generator
cd hexagonal-ts-generator
npm install
```

### Step 2 — Configure the target database

```bash
cp .env.example .env
```

Edit `.env`:

```ini
# Required: PostgreSQL connection string used for BOTH introspection AND runtime
DATABASE_URL="postgresql://awasekhirnisyed:YOUR_PASSWORD@localhost:5432/profxdb"

# Where the generated project will be written
PROJECT_DIR="./project"

# Application metadata (surfaced in OpenAPI info.title)
APP_NAME="Hexagonal Architecture API"
APP_VERSION="1.0.0"

# Required: JWT secret (≥16 chars) for the generated API's auth middleware
JWT_SECRET="change-me-to-a-32-char-random-string"
```

### Step 3 — Run the generator

```bash
npm start
```

You'll see output like:

```
Step 1/6 · Creating project folder structure ...
Step 2/6 · Writing shared artefacts (config, observability, security, DDD, CQRS, DevOps) ...
  ✓ Shared artefacts written (config, observability, security, DDD, CQRS, DevOps)
Step 3/6 · Introspecting PostgreSQL schema ...
  ↳ 12 tables discovered.
Step 4/6 · Generating per-table artefacts (entity, repo, service, controller, CQRS, tests) ...
✓ Artifacts emitted for "users" (cols=8, relations=2, status=true, softDel=true, ...)
✓ Artifacts emitted for "posts" (cols=8, relations=1, status=true, softDel=false, ...)
...
Step 5/6 · Writing routes aggregator + CQRS bootstrap + smoke tests ...
Step 6/6 · Generation complete
✓ Done. 12 tables processed.
```

### Step 4 — Install the generated project's dependencies

```bash
cd project
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, NODE_ENV, etc.
npm install
```

### Step 5 — Run database migrations (if any)

```bash
# Create a new migration
npm run migrate:create -- InitialSchema

# Run pending migrations
npm run migrate
```

### Step 6 — Start the dev server

```bash
npm run dev
```

Output:

```
2026-10-29 14:00:00.000 [info] Booting server {"config":{"nodeEnv":"development",...}}
2026-10-29 14:00:00.100 [info] TypeORM DataSource initialized {"durationMs":120,...}
2026-10-29 14:00:00.200 [info] Express application created {...}
2026-10-29 14:00:00.300 [info] Server listening {"port":3000,...}
2026-10-29 14:00:00.301 [info] Swagger UI available {"url":"http://localhost:3000/docs"}
2026-10-29 14:00:00.302 [info] Metrics endpoint available {"url":"http://localhost:3000/metrics"}
2026-10-29 14:00:00.303 [info] Health endpoints {"live":"...","ready":"..."}
```

### Step 7 — Verify the API is up

```bash
# Liveness (process is alive)
curl http://localhost:3000/health/live
# → {"status":"ok","timestamp":"...","uptime":...}

# Readiness (DB reachable)
curl http://localhost:3000/health/ready
# → {"status":"ok","checks":{"database":{"status":"ok","latencyMs":3}}}

# Try an endpoint WITHOUT auth → expect 401
curl http://localhost:3000/api/v1/users
# → {"statusCode":401,"code":"UNAUTHORIZED","message":"Missing or malformed Authorization header"}

# Generate a JWT (use the same JWT_SECRET as in .env)
TOKEN=$(node -e "console.log(require('jsonwebtoken').sign({sub:'test',email:'t@t.com',roles:['admin']}, process.env.JWT_SECRET ?? 'change-me-to-a-32-char-random-string', {issuer:'hexagonal-api',audience:'hexagonal-api-clients',expiresIn:'1h'}))")

# Try WITH auth → expect 200 + paginated envelope
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/users
# → {"data":[...],"pagination":{"skip":0,"take":100,"count":N,"hasMore":false}}
```

### Step 8 — Browse Swagger UI

Open `http://localhost:3000/docs` in your browser. You'll see:
- Every endpoint grouped by table tag
- Request/response schemas
- Standard error responses (400/401/403/404/409/422/500/503)
- Bearer auth scheme (click "Authorize" to set your JWT)

### Step 9 — Run the tests

```bash
# Unit tests (no DB required) — always run
npm run test:unit

# Integration tests (require a real PostgreSQL) — run with RUN_DB_TESTS=true
RUN_DB_TESTS=true npm run test:integration

# End-to-end tests (require a real PostgreSQL + Express app)
RUN_DB_TESTS=true npm run test:e2e

# All tests with coverage
npm run test:coverage
```

### Step 10 — Lint + format + type-check

```bash
npm run lint         # ESLint with auto-fix
npm run format       # Prettier
npm run type-check   # tsc --noEmit
```

### Step 11 — Build for production

```bash
npm run build
# → Compiles to dist/
node dist/server.js  # Run the compiled output
```

### Step 12 — Dockerize

```bash
# Build the Docker image (multi-stage, distroless, non-root)
npm run docker:build
# or
docker build -t hexagonal-api:latest .

# Run it
docker run --rm -p 3000:3000 --env-file .env hexagonal-api:latest

# Or use docker-compose (API + PostgreSQL)
docker compose up -d
docker compose logs -f api
```

### Step 13 — Deploy to Kubernetes (manual)

The Dockerfile includes a healthcheck. Use these probes in your k8s manifest:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
```

### Step 14 — CI/CD (GitHub Actions)

The generator emits `.github/workflows/ci.yml` that runs on every push/PR:
1. **Quality job**: lint + format-check + type-check + test:coverage
2. **Security job**: npm audit + GitHub CodeQL analysis
3. **Build job**: docker build + smoke test (curl /health/live)

Push to `main` and the workflow runs automatically.

---

## 5. Configuration reference

All settings live in `.env` (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development` / `staging` / `production` / `test` |
| `PORT` | `3000` | HTTP port |
| `LOG_LEVEL` | `info` | `error` / `warn` / `info` / `debug` / `verbose` |
| `LOG_FORMAT` | `json` | `json` (prod) or `text` (dev, colorized) |
| `LOG_TO_FILE` | `true` | Enable winston daily-rotate-file transport |
| `LOG_DIR` | `./logs` | Where log files are written |
| `DATABASE_URL` | (required) | `postgresql://user:pass@host:port/db` |
| `DB_POOL_SIZE` | `10` | Connection pool size |
| `DB_MAX_OVERFLOW` | `20` | Extra connections beyond the pool |
| `DB_POOL_RECYCLE` | `1800` | Idle connection timeout (seconds) |
| `DB_STATEMENT_TIMEOUT_MS` | `15000` | Per-statement timeout |
| `DB_QUERY_TIMEOUT_MS` | `30000` | Per-query timeout |
| `DB_SLOW_QUERY_THRESHOLD_MS` | `500` | Queries slower than this are logged at warn |
| `JWT_SECRET` | (required, ≥16 chars) | HMAC secret for signing JWTs |
| `JWT_EXPIRES_IN` | `24h` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `JWT_ISSUER` | `hexagonal-api` | `iss` claim |
| `JWT_AUDIENCE` | `hexagonal-api-clients` | `aud` claim |
| `RATE_LIMIT_WINDOW_MS` | `900000` | 15 min sliding window |
| `RATE_LIMIT_MAX` | `100` | Max requests per window per IP |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Comma-separated allowed origins |
| `CORS_CREDENTIALS` | `true` | Allow cookies in CORS |
| `ENABLE_SWAGGER` | `true` | Mount Swagger UI at `/docs` |
| `ENABLE_PROMETHEUS` | `true` | Expose `/metrics` endpoint |
| `ENABLE_OTEL` | `false` | Enable OpenTelemetry tracing |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | (none) | OTLP collector URL |
| `OTEL_SERVICE_NAME` | `hexagonal-api` | Service name in traces |
| `HEALTH_CHECK_TIMEOUT_MS` | `5000` | DB health check timeout |
| `RUN_DB_TESTS` | (unset) | Set `true` to run integration/e2e tests |

---

## 6. Testing strategy

The generator emits three tiers of tests per table:

### Unit tests (`tests/unit/<table>.service.test.ts`)
- **No database required** — mocks the repository via `jest.mock`.
- Run with `npm run test:unit`.
- Validates business logic, NOT persistence.
- 5 tests per table: instantiation, list, count, delete, getById.

### Integration tests (`tests/integration/<table>.repository.test.ts`)
- **Requires a real PostgreSQL** — exercises the actual TypeORM repository.
- Skipped unless `RUN_DB_TESTS=true` or `CI=true`.
- Run with `RUN_DB_TESTS=true npm run test:integration`.
- 4 tests per table: findById, findMany, count, exists.

### E2E tests (`tests/e2e/<table>.api.test.ts`)
- **Requires a real PostgreSQL + Express app** — uses `supertest`.
- Skipped unless `RUN_DB_TESTS=true` or `CI=true`.
- Run with `RUN_DB_TESTS=true npm run test:e2e`.
- 5 tests per table: 401 without auth, 200 with auth, 404 not found, 400 bad body, 404 delete nonexistent.

### Test fixtures (`tests/helpers/factory.ts`)
- `makeUser(overrides)`, `makePost(overrides)`, `makeId()`, `makeJwt(payload)`.
- Override any field by passing a partial object.

### Test setup
- `tests/setup-env.ts` — runs BEFORE any test imports, sets env vars.
- `tests/setup.ts` — runs AFTER env is set, mocks the logger.

### Coverage
- `npm run test:coverage` produces `coverage/` with HTML + LCOV reports.
- Thresholds: 70% statements, 60% branches, 70% functions, 70% lines.

---

## 7. Observability

### Structured logging
- **Winston** with JSON format in production, colorized text in development.
- **Daily rotating files**: `logs/app-YYYY-MM-DD.log` (14 days) + `logs/error-YYYY-MM-DD.log` (30 days).
- **Correlation IDs**: every request gets an `X-Request-Id` header (auto-generated if missing). The ID propagates via `AsyncLocalStorage` so every log line in the request's async tree carries it.
- **Child loggers**: `childLogger({ component: 'repository', entity: 'UsersRepository' })` tags every line.

### Request/response logging middleware
Logs every HTTP request with: method, path, ip, userAgent, requestId, response status, contentLength, durationMs. Slow requests (>500ms) flagged at warn level.

### Prometheus metrics (`/metrics`)
Default metrics: nodejs_memory_usage_bytes, nodejs_eventloop_lag_seconds, process_cpu_seconds_total. Custom: `http_requests_total{method,route,status}`, `http_request_duration_seconds` (histogram), `db_pool_size`.

### OpenTelemetry tracing
Enable via `ENABLE_OTEL=true` + `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318`. Auto-instruments: http, express, pg, dns, net. Spans exported to Jaeger/Tempo/Honeycomb/Datadog.

### Health checks
- `GET /health/live` — process is alive (always 200).
- `GET /health/ready` — DB reachable + DataSource initialized (200 or 503).

---

## 8. Security

### JWT authentication
- Every API route requires a `Authorization: Bearer <token>` header.
- Token validated against `JWT_SECRET` + `JWT_ISSUER` + `JWT_AUDIENCE`.
- Decoded payload attached to `req.user` (`{ sub, email, roles, iat, exp }`).

### RBAC authorization
- `authorize(...roles)` middleware checks `req.user.roles`.
- Default roles per route:
  - GET (read) → `reader` or `admin`
  - POST/PUT (write) → `writer` or `admin`
  - DELETE → `admin` only

### Rate limiting
- Global limiter: 100 requests / 15 min / IP (configurable).
- Auth-specific limiter: 5 attempts / 15 min / IP (for login endpoints).
- 429 response includes `Retry-After` header.

### HTTP hardening
- **Helmet**: sets security headers (X-Frame-Options, X-Content-Type-Options, etc.).
- **CORS**: configurable origins, methods, credentials.
- **Compression**: gzip responses >1KB.

### Input validation
- **class-validator** + **class-transformer** on every DTO.
- **zod** validates the env config at boot (fail-fast on misconfiguration).

---

## 9. Deployment

### Docker (multi-stage, distroless, non-root)

```dockerfile
# Stage 1: build
FROM node:20-alpine AS builder
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# Stage 2: runtime (non-root, tini for signal handling)
FROM node:20-alpine AS runtime
RUN apk add --no-cache tini
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
RUN addgroup -S api && adduser -S api -G api && USER api
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health/ready || exit 1
```

### docker-compose (local dev)

```yaml
services:
  postgres:  # PostgreSQL 16 with healthcheck
  api:       # Built from Dockerfile, depends on postgres
```

Run with `docker compose up -d`.

### Kubernetes

The Dockerfile's `HEALTHCHECK` is compatible with k8s probes. Sample deployment:

```yaml
spec:
  containers:
  - name: api
    image: hexagonal-api:latest
    ports:
    - containerPort: 3000
    envFrom:
    - secretRef: { name: api-secrets }
    livenessProbe:
      httpGet: { path: /health/live, port: 3000 }
      initialDelaySeconds: 10
    readinessProbe:
      httpGet: { path: /health/ready, port: 3000 }
      initialDelaySeconds: 30
    resources:
      requests: { cpu: 100m, memory: 128Mi }
      limits:   { cpu: 500m, memory: 512Mi }
```

### CI/CD (GitHub Actions)

`.github/workflows/ci.yml` runs on every push/PR:
1. **quality** job: lint + format-check + type-check + test:coverage
2. **security** job: npm audit + CodeQL analysis
3. **build** job: docker build + smoke test (curl /health/live)

---

## 10. Migrating from v1

| v1 feature | v2 enhancement |
|------------|----------------|
| Basic winston logger | Structured JSON + correlation IDs + child loggers + daily-rotate-file |
| (none) | Request/response logging middleware (audit trail) |
| (none) | Domain Events (synchronous, within Unit of Work tx) |
| Enterprise Bus only | Enterprise Bus (async) + Domain Events (sync) |
| (none) | Unit of Work pattern (transaction management) |
| (none) | CQRS (command bus + query bus + per-table handlers) |
| (none) | Value Objects base class (DDD) |
| (none) | JWT auth + RBAC authorization |
| (none) | Rate limiting + Helmet + CORS hardening |
| (none) | Health checks (liveness + readiness) |
| (none) | Prometheus metrics |
| (none) | OpenTelemetry distributed tracing |
| (none) | Circuit Breaker + Retry with backoff |
| (none) | Env validation with zod (fail-fast) |
| (none) | Graceful shutdown (in-flight tracking) |
| Basic HttpError | Typed hierarchy: 400/401/403/404/409/422/500/503 |
| Plain JSON responses | Pagination envelope + HATEOAS-ready |
| (none) | Dockerfile + docker-compose |
| (none) | GitHub Actions CI (lint/test/build/security) |
| (none) | ESLint + Prettier + Husky + commitlint + editorconfig |
| Health smoke test only | Unit (mocked) + integration (real DB) + e2e (supertest) per table |
| (none) | Test fixtures/factories |
| (none) | Makefile for common commands |
| Basic logging in services | Detailed logging at EVERY layer (controller, service, repository) with timing |

---

## License

Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
