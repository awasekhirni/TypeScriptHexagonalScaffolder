# Step-by-Step Setup Guide — Hexagonal TS Generator v2

> Complete walkthrough: from zero to a running production-grade Hexagonal
> Architecture REST API in ~30 minutes.
>
> Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
> Author: Awase Khirni Syed

---

## Prerequisites (verify before you start)

| Tool | Min version | Why | Check |
|------|------------|-----|-------|
| **Node.js** | v20.0+ | Generator runtime + generated API runtime | `node --version` |
| **npm** | v10.0+ | Package management | `npm --version` |
| **PostgreSQL** | v14+ | Source DB to introspect + target DB for the API | `psql --version` |
| **Docker** (optional) | v24+ | Run the generated API in a container | `docker --version` |
| **Git** | any | Version control | `git --version` |

If you're missing any, install:
- Node.js → https://nodejs.org/en/download/
- PostgreSQL → https://www.postgresql.org/download/
- Docker → https://docs.docker.com/get-docker/

---

## Phase 1 — Prepare your PostgreSQL database

The generator reads your DB schema and emits code that matches it exactly. You
need a PostgreSQL instance with at least one table.

### Step 1.1 — Start PostgreSQL

**Option A: Local install (already running on macOS/Linux):**
```bash
# Verify it's running
pg_isready
# → /tmp:5432 - accepting connections
```

**Option B: Docker (fastest, no local install):**
```bash
docker run -d \
  --name hexagonal-pg \
  -e POSTGRES_USER=awasekhirnisyed \
  -e POSTGRES_PASSWORD=YOUR_PASSWORD_HERE \
  -e POSTGRES_DB=profxdb \
  -p 5432:5432 \
  postgres:16-alpine

# Wait for it to be ready
docker exec hexagonal-pg pg_isready -U awasekhirnisyed
```

### Step 1.2 — Verify you can connect

```bash
psql "postgresql://awasekhirnisyed:YOUR_PASSWORD_HERE@localhost:5432/profxdb" -c "\dt"
```

You should see a list of tables (or "Did not find any relations." if the DB is
empty — that's fine for now, we'll add tables next).

### Step 1.3 — Create sample tables (skip if your DB already has tables)

```bash
psql "postgresql://awasekhirnisyed:YOUR_PASSWORD_HERE@localhost:5432/profxdb" <<'SQL'
-- Enable uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (with timestamps, status, soft-delete)
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  full_name       VARCHAR(100) NOT NULL,
  account_status  VARCHAR(20) NOT NULL DEFAULT 'active',
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at      TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Posts table (with FK to users, status, view counter)
CREATE TABLE IF NOT EXISTS posts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id),
  title        VARCHAR(200) NOT NULL,
  body         TEXT,
  post_status  VARCHAR(20) NOT NULL DEFAULT 'draft',
  view_count   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for FK lookups
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

\dt
SQL
```

Expected output:
```
        List of relations
 Schema | Name  | Type  |     Owner
--------+-------+-------+----------------
 public | posts | table | awasekhirnisyed
 public | users | table | awasekhirnisyed
(2 rows)
```

---

## Phase 2 — Set up the generator

### Step 2.1 — Navigate to the generator directory

```bash
cd /home/z/my-project/download/hexagonal-ts-generator
```

### Step 2.2 — Install the generator's dependencies

```bash
npm install --no-audit --no-fund
```

Expected output:
```
added 87 packages in 4s
```

### Step 2.3 — Verify the generator compiles

```bash
npm run type-check
```

Expected: no output (success) or only deprecation warnings.

### Step 2.4 — Create your `.env` file

```bash
cp .env.example .env
```

### Step 2.5 — Edit `.env` with your values

Open `.env` in your editor and set these **required** values:

```ini
# ─── REQUIRED: PostgreSQL connection ───
DATABASE_URL="postgresql://awasekhirnisyed:YOUR_PASSWORD_HERE@localhost:5432/profxdb"

# ─── REQUIRED: Where the generated project will be written ───
PROJECT_DIR="./project"

# ─── REQUIRED: Application metadata ───
APP_NAME="Hexagonal Architecture API"
APP_VERSION="1.0.0"
APP_DESCRIPTION="REST API built with Hexagonal Architecture, Enterprise Bus, and Enterprise Repository patterns."

# ─── REQUIRED for the generated API (≥16 chars) ───
JWT_SECRET="change-me-to-a-32-char-random-string"
```

> **Security**: Replace `YOUR_PASSWORD_HERE` with your real DB password.
> Replace `change-me-to-a-32-char-random-string` with a real random string
> (generate one with `openssl rand -hex 32`).

### Step 2.6 — Verify your `.env` is correct

```bash
# Mask the password and print
cat .env | sed 's/\(.*PASSWORD.*=\).*/\1***/' | sed 's/\(JWT_SECRET=\).*/\1***/'
```

You should see your config with secrets masked.

---

## Phase 3 — Run the generator

### Step 3.1 — Execute the generator

```bash
npm start
```

Expected output:
```
┌─────────────────────────────────────────────────────────────┐
│  Hexagonal TS Generator  ·  β ORI Inc. Canada (c) 2025     │
│  Rewritten from the Python original by Awase Khirni Syed.  │
└─────────────────────────────────────────────────────────────┘
Project dir :hexagonal-ts-generator/project
Database URL: postgresql://awasekhirnisyed:****@localhost:5432/profxdb
App name    : Hexagonal Architecture API
App version : 1.0.0
Debug       : false
Step 1/6 · Creating project folder structure ...
Step 2/6 · Writing shared artefacts (config, observability, security, DDD, CQRS, DevOps) ...
  ✓ Shared artefacts written (config, observability, security, DDD, CQRS, DevOps)
Step 3/6 · Introspecting PostgreSQL schema ...
  ↳ 2 tables discovered.
Step 4/6 · Generating per-table artefacts (entity, repo, service, controller, CQRS, tests) ...
✓ Artifacts emitted for "posts" (cols=8, relations=1, status=true, softDel=false, user=true, hasMany=, hasOne=users)
✓ Artifacts emitted for "users" (cols=8, relations=2, status=true, softDel=true, user=false, hasMany=posts, hasOne=)
Step 5/6 · Writing routes aggregator + CQRS bootstrap + smoke tests ...
Step 6/6 · Generation complete
═══════════════════════════════════════════════════════════
✓ Done. 2 tables processed.
  Output directory : hexagonal-ts-generator/project
═══════════════════════════════════════════════════════════
```

### Step 3.2 — Verify the generated project structure

```bash
cd project
ls -la
```

You should see:
```
.env.example  Dockerfile  Makefile  README.md  docker-compose.yml
.eslintrc.js  .prettierrc  .editorconfig  .gitignore  .dockerignore
commitlint.config.js  jest.config.js  package.json  tsconfig.json
src/  tests/  scripts/  .github/  .husky/
```

### Step 3.3 — Verify the generated TypeScript compiles

```bash
cd project
npm install --no-audit --no-fund
npm run type-check
```

Expected: no output (success — zero TypeScript errors).

---

## Phase 4 — Configure the generated API

### Step 4.1 — Create the runtime `.env`

```bash
cd project
cp .env.example .env
```

### Step 4.2 — Edit the runtime `.env`

Open `.env` and set at minimum:

```ini
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
LOG_FORMAT=text            # colorized output in dev

# ─── Database (same as generator's DATABASE_URL) ───
DATABASE_URL="postgresql://awasekhirnisyed:YOUR_PASSWORD_HERE@localhost:5432/profxdb"

# ─── JWT (≥16 chars) ───
JWT_SECRET="change-me-to-a-32-char-random-string"

# ─── Security ───
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# ─── Enable Swagger + Prometheus ───
ENABLE_SWAGGER=true
ENABLE_PROMETHEUS=true

# ─── OpenTelemetry (leave false for dev) ───
ENABLE_OTEL=false
```

### Step 4.3 — Validate the env config

The generated API validates `.env` at boot using zod. To verify yours is valid
without starting the server:

```bash
npx ts-node -e "import('./src/config').then(m => console.log('✓ Config valid:', JSON.stringify(m.safeConfig(), null, 2)))"
```

Expected output:
```
✓ Config valid: {
  "nodeEnv": "development",
  "port": 3000,
  ...
  "databaseUrl": "postgresql://awasekhirnisyed:****@localhost:5432/profxdb",
  "jwtSecret": "****"
}
```

If anything is invalid, the API will print a clear error and exit(1) — fix
the offending value and retry.

---

## Phase 5 — Run the API in development

### Step 5.1 — Start the dev server

```bash
npm run dev
```

Expected output:
```
2026-10-29 14:00:00.000 [info] Booting server {"config":{"nodeEnv":"development","port":3000,...}}
2026-10-29 14:00:00.100 [info] TypeORM DataSource initialized {"durationMs":120,"poolSize":10,...}
2026-10-29 14:00:00.200 [info] Express application created {"nodeEnv":"development","port":3000,"swagger":true,"prometheus":true,"otel":false}
2026-10-29 14:00:00.300 [info] Server listening {"port":3000,"env":"development","appName":"Hexagonal Architecture API","version":"1.0.0"}
2026-10-29 14:00:00.301 [info] Swagger UI available {"url":"http://localhost:3000/docs"}
2026-10-29 14:00:00.302 [info] Metrics endpoint available {"url":"http://localhost:3000/metrics"}
2026-10-29 14:00:00.303 [info] Health endpoints {"live":"http://localhost:3000/health/live","ready":"http://localhost:3000/health/ready"}
```

Leave this running in a terminal. Open a new terminal for the next steps.

### Step 5.2 — Test the liveness probe

```bash
curl -s http://localhost:3000/health/live | jq .
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "2026-10-29T14:00:05.123Z",
  "uptime": 5.123,
  "checks": {}
}
```

### Step 5.3 — Test the readiness probe (checks DB)

```bash
curl -s http://localhost:3000/health/ready | jq .
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "2026-10-29T14:00:08.456Z",
  "uptime": 8.456,
  "checks": {
    "database": {
      "status": "ok",
      "latencyMs": 3
    }
  }
}
```

If you get `"status": "down"` with an error in the `database` check, your DB
is unreachable — verify Phase 1.

### Step 5.4 — Try an endpoint WITHOUT auth (expect 401)

```bash
curl -i http://localhost:3000/api/v1/users
```

Expected:
```
HTTP/1.1 401 Unauthorized
X-Request-Id: <uuid>
Content-Type: application/json; charset=utf-8
...

{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "Missing or malformed Authorization header",
  "requestId": "<uuid>",
  "timestamp": "2026-10-29T14:00:15.123Z"
}
```

The 401 proves the JWT auth middleware is working.

### Step 5.5 — Generate a JWT for testing

```bash
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
console.log(jwt.sign(
  { sub: 'test-user-id', email: 'test@example.com', roles: ['admin'] },
  process.env.JWT_SECRET || 'change-me-to-a-32-char-random-string',
  { issuer: 'hexagonal-api', audience: 'hexagonal-api-clients', expiresIn: '1h' }
));
")
echo "Token: $TOKEN"
```

### Step 5.6 — Try the endpoint WITH auth

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/users?skip=0&take=10" | jq .
```

Expected:
```json
{
  "data": [],
  "pagination": {
    "skip": 0,
    "take": 10,
    "count": 0,
    "hasMore": false
  }
}
```

### Step 5.7 — Create a user (POST)

```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "full_name": "Alice Wonder",
    "account_status": "active"
  }' \
  http://localhost:3000/api/v1/users | jq .
```

Expected:
```json
{
  "data": {
    "id": "<uuid>",
    "email": "alice@example.com",
    "full_name": "Alice Wonder",
    "account_status": "active",
    "is_deleted": false,
    "deleted_at": null,
    "created_at": "2026-10-29T14:00:30.000Z",
    "updated_at": "2026-10-29T14:00:30.000Z"
  }
}
```

### Step 5.8 — Verify logs are structured

Look back at the terminal where `npm run dev` is running. You should see JSON
log lines with correlation IDs:

```
2026-10-29 14:00:30.001 [info] Incoming request {"method":"POST","path":"/api/v1/users","ip":"::1","userAgent":"curl/8.4.0"}
2026-10-29 14:00:30.050 [info] create {"component":"repository","entity":"UsersRepository","id":"<uuid>","durationMs":49}
2026-10-29 14:00:30.052 [info] create + published event {"component":"service","topic":"users","id":"<uuid>","durationMs":50}
2026-10-29 14:00:30.053 [info] POST /users — created {"component":"controller","aggregate":"users","userId":"test-user-id","id":"<uuid>","durationMs":52}
2026-10-29 14:00:30.054 [info] Request completed {"method":"POST","path":"/api/v1/users","statusCode":201,"durationMs":53,"contentLength":"186"}
```

Every log line carries the request ID + user ID + duration.

---

## Phase 6 — Explore the Swagger UI

### Step 6.1 — Open Swagger UI in your browser

Open: **http://localhost:3000/docs**

You'll see:
- Every endpoint grouped by table tag (users, posts, etc.)
- Request/response schemas for each endpoint
- Standard error responses (400/401/403/404/409/422/500/503)
- Bearer auth scheme

### Step 6.2 — Authorize with your JWT

1. Click the **Authorize** 🔓 button at the top right.
2. Paste your JWT (the `$TOKEN` from Phase 5.5).
3. Click **Authorize**.

Now every "Try it out" call will include the Bearer header automatically.

### Step 6.3 — Try an endpoint from the UI

1. Click `GET /api/v1/users`.
2. Click **Try it out**.
3. Set `skip=0`, `take=10`.
4. Click **Execute**.
5. You should see the 200 response with the user list.

---

## Phase 7 — Run the tests

### Step 7.1 — Run unit tests (always run, no DB required)

```bash
npm run test:unit
```

Expected:
```
PASS  tests/unit/users.service.test.ts
PASS  tests/unit/posts.service.test.ts

Test Suites: 2 passed, 2 total
Tests:       10 passed, 10 total
```

### Step 7.2 — Run integration tests (requires DB)

```bash
RUN_DB_TESTS=true npm run test:integration
```

This exercises the real PostgreSQL. Expected:
```
PASS  tests/integration/users.repository.test.ts
PASS  tests/integration/posts.repository.test.ts

Test Suites: 2 passed, 2 total
Tests:       8 passed, 8 total
```

### Step 7.3 — Run e2e tests (requires DB + Express)

```bash
RUN_DB_TESTS=true npm run test:e2e
```

This boots the real Express app and hits endpoints with supertest. Expected:
```
PASS  tests/e2e/users.api.test.ts
PASS  tests/e2e/posts.api.test.ts

Test Suites: 2 passed, 2 total
Tests:       10 passed, 10 total
```

### Step 7.4 — Run all tests with coverage

```bash
npm run test:coverage
```

Opens `coverage/index.html` in a browser to view the coverage report.

---

## Phase 8 — Lint, format, type-check

### Step 8.1 — Type-check

```bash
npm run type-check
```

Expected: no output (success).

### Step 8.2 — Lint with auto-fix

```bash
npm run lint
```

ESLint will fix style issues automatically. Any remaining errors indicate
real bugs that need your attention.

### Step 8.3 — Format with Prettier

```bash
npm run format
```

### Step 8.4 — Verify clean state

```bash
npm run lint:check && npm run format:check && npm run type-check && echo "✓ All clean"
```

---

## Phase 9 — Build for production

### Step 9.1 — Compile TypeScript

```bash
npm run build
```

This produces `dist/` containing compiled JavaScript:
```
dist/
├── server.js
├── app.js
├── config/
├── api/
├── domain/
├── application/
├── infrastructure/
└── shared/
```

### Step 9.2 — Run the compiled output

```bash
NODE_ENV=production node dist/server.js
```

### Step 9.3 — Generate the OpenAPI spec to a file

```bash
npm run swagger
```

This writes `openapi.json` — useful for:
- Postman collection generation
- API documentation review
- CI validation of the spec

---

## Phase 10 — Dockerize

### Step 10.1 — Build the Docker image

```bash
npm run docker:build
# or
docker build -t hexagonal-api:latest .
```

Expected:
```
=> [builder 1/6] FROM node:20-alpine                            1.2s
=> [builder 2/6] COPY package*.json ./                          0.1s
=> [builder 3/6] RUN npm ci --no-audit --no-fund              12.3s
=> [builder 4/6] COPY tsconfig.json ./                          0.1s
=> [builder 5/6] COPY src ./src                                 0.2s
=> [builder 6/6] RUN npm run build && npm prune --omit=dev     8.7s
=> [runtime 1/3] COPY --from=builder /app/node_modules ./       0.5s
=> [runtime 2/3] COPY --from=builder /app/dist ./dist           0.1s
=> [runtime 3/3] COPY --from=builder /app/package.json ./        0.1s
=> exporting to image                                           2.1s
=> exporting layers                                            2.1s
=> writing image sha256:...                                     0.0s
```

### Step 10.2 — Run the image

```bash
docker run --rm -p 3000:3000 --env-file .env hexagonal-api:latest
```

Open http://localhost:3000/health/live — should return 200.

### Step 10.3 — Run with docker-compose (API + PostgreSQL)

The generator produced `docker-compose.yml`. Start the full stack:

```bash
docker compose up -d
```

This starts:
- `postgres` container (port 5432)
- `api` container (port 3000, depends on postgres being healthy)

Check status:
```bash
docker compose ps
```

Expected:
```
NAME                  STATUS                   PORTS
hexagonal-api         Up (healthy)             0.0.0.0:3000->3000/tcp
hexagonal-postgres    Up (healthy)             0.0.0.0:5432->5432/tcp
```

View logs:
```bash
docker compose logs -f api
```

Stop:
```bash
docker compose down
```

---

## Phase 11 — Set up CI/CD (GitHub Actions)

The generator produced `.github/workflows/ci.yml`. To activate it:

### Step 11.1 — Initialize git + push to GitHub

```bash
git init
git add .
git commit -m "feat: initial commit - hexagonal architecture API"
git branch -M main
git remote add origin https://github.com/<your-username>/hexagonal-api.git
git push -u origin main
```

### Step 11.2 — Verify CI runs

Open your GitHub repo → **Actions** tab. You should see:
1. **quality** job: lint + format-check + type-check + test:coverage
2. **security** job: npm audit + CodeQL analysis
3. **build** job: docker build + smoke test (curl /health/live)

All three should pass on the first push.

### Step 11.3 — Configure required status checks (optional)

In GitHub → Settings → Branches → Branch protection rules → Add rule for `main`:
- ✅ Require status checks to pass before merging
- Select: `quality`, `security`, `build`
- ✅ Require branches to be up to date before merging

---

## Phase 12 — Enable OpenTelemetry tracing (optional)

### Step 12.1 — Start a Jaeger collector locally

```bash
docker run -d --name jaeger \
  -p 4318:4318 \
  -p 16686:16686 \
  jaegertracing/all-in-one:latest
```

### Step 12.2 — Enable OTel in your `.env`

```ini
ENABLE_OTEL=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=hexagonal-api
OTEL_SERVICE_VERSION=1.0.0
```

### Step 12.3 — Restart the API

```bash
npm run dev
```

You'll see a new log line:
```
2026-10-29 14:00:00.050 [info] OpenTelemetry tracing started {"endpoint":"http://localhost:4318","service":"hexagonal-api"}
```

### Step 12.4 — Make some requests

```bash
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/users > /dev/null
```

### Step 12.5 — View the traces

Open: **http://localhost:16686**

Select service `hexagonal-api` → Find traces. You'll see:
- The full HTTP request span
- Nested TypeORM query spans
- Nested Enterprise Bus publish spans

---

## Phase 13 — Promote to production

### Step 13.1 — Build the production image

```bash
NODE_ENV=production npm run build
docker build -t hexagonal-api:v1.0.0 .
docker tag hexagonal-api:v1.0.0 hexagonal-api:latest
```

### Step 13.2 — Push to a registry

```bash
# Log in to your registry (Docker Hub, ECR, GCR, ACR)
docker login

# Tag + push
docker tag hexagonal-api:v1.0.0 <your-registry>/hexagonal-api:v1.0.0
docker tag hexagonal-api:v1.0.0 <your-registry>/hexagonal-api:latest
docker push <your-registry>/hexagonal-api:v1.0.0
docker push <your-registry>/hexagonal-api:latest
```

### Step 13.3 — Deploy to Kubernetes

Sample manifest (`k8s/deployment.yaml`):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hexagonal-api
  labels: { app: hexagonal-api }
spec:
  replicas: 3
  selector: { matchLabels: { app: hexagonal-api } }
  template:
    metadata: { labels: { app: hexagonal-api } }
    spec:
      containers:
      - name: api
        image: <your-registry>/hexagonal-api:v1.0.0
        ports: [{ containerPort: 3000 }]
        envFrom:
        - secretRef: { name: api-secrets }
        livenessProbe:
          httpGet: { path: /health/live, port: 3000 }
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet: { path: /health/ready, port: 3000 }
          initialDelaySeconds: 30
          periodSeconds: 10
        resources:
          requests: { cpu: 100m, memory: 128Mi }
          limits:   { cpu: 500m, memory: 512Mi }
---
apiVersion: v1
kind: Service
metadata: { name: hexagonal-api }
spec:
  selector: { app: hexagonal-api }
  ports: [{ port: 80, targetPort: 3000 }]
---
apiVersion: v1
kind: Secret
metadata: { name: api-secrets }
type: Opaque
stringData:
  DATABASE_URL: "postgresql://..."
  JWT_SECRET: "..."
  NODE_ENV: "production"
  ENABLE_OTEL: "true"
  OTEL_EXPORTER_OTLP_ENDPOINT: "http://otel-collector:4318"
```

Apply:
```bash
kubectl apply -f k8s/
kubectl rollout status deployment/hexagonal-api
```

### Step 13.4 — Verify production deployment

```bash
# Get the service URL (assuming minikube for local k8s testing)
minikube service hexagonal-api --url

# Or with a real cluster + ingress
curl http://<production-domain>/health/ready
```

---

## Phase 14 — Day-2 operations

### Step 14.1 — View logs

**Local dev:**
```bash
tail -f logs/app-$(date +%Y-%m-%d).log | jq .
```

**Docker:**
```bash
docker compose logs -f api | jq .
```

**Kubernetes:**
```bash
kubectl logs -f deployment/hexagonal-api | jq .
```

### Step 14.2 — Scrape Prometheus metrics

Point your Prometheus at `http://<host>:3000/metrics`. Sample scrape config:

```yaml
scrape_configs:
- job_name: 'hexagonal-api'
  scrape_interval: 15s
  static_configs:
  - targets: ['hexagonal-api.default.svc.cluster.local:80']
```

Useful metrics:
- `http_requests_total{method,route,status}` — request count
- `http_request_duration_seconds_bucket` — latency histogram
- `db_pool_size` — active DB connections
- `nodejs_eventloop_lag_seconds` — event loop health

### Step 14.3 — Add a new table to the schema

When you add a new table to PostgreSQL:

```bash
psql "$DATABASE_URL" <<'SQL'
CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID NOT NULL REFERENCES posts(id),
  author_id   UUID NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
SQL
```

Re-run the generator:
```bash
cd /home/z/my-project/download/hexagonal-ts-generator
npm start
```

The generator will:
- Re-introspect the schema
- Emit new artefacts for `comments`
- Update `api/routes.ts` to mount the new controller
- Update `application/register-handlers.ts` to register new CQRS handlers
- NOT overwrite any files you've manually edited in the shared layer (only per-table files are regenerated)

Then in the generated project:
```bash
cd project
npm run dev
```

The new `/api/v1/comments` endpoints are now live.

### Step 14.4 — Run database migrations

When you need to evolve the schema in production:

```bash
# Create a new migration
npm run migrate:create -- AddCommentsTable

# This creates a file like:
# src/infrastructure/database/migrations/1730000000000-AddCommentsTable.ts

# Edit the file with the up/down SQL, then:
npm run migrate
```

---

## Troubleshooting

### Problem: `Error: Invalid DATABASE_URL`

**Cause**: The URL in `.env` doesn't match the expected `postgresql://user:pass@host:port/db` format.

**Fix**: Verify with:
```bash
echo $DATABASE_URL
psql "$DATABASE_URL" -c "SELECT 1"
```

The `psql` command should succeed. If it fails, fix the URL.

### Problem: `❌ Invalid environment configuration` at boot

**Cause**: zod env validation failed.

**Fix**: Read the error message — it tells you exactly which env var is wrong:
```
❌ Invalid environment configuration:
  • JWT_SECRET: JWT_SECRET must be at least 16 characters
  • DATABASE_URL: Must be a postgresql:// URL
```

Fix the listed vars in `.env` and restart.

### Problem: `GET /health/ready` returns 503

**Cause**: The DB health check failed.

**Fix**: Check the response body for the error:
```bash
curl -s http://localhost:3000/health/ready | jq .
```

Common causes:
- DB not running → `docker start hexagonal-pg`
- Wrong credentials → fix `DATABASE_URL`
- Firewall blocking the port → check `pg_isready -h <host> -p 5432`

### Problem: `Cannot find module 'reflect-metadata'`

**Cause**: Forgot to `npm install` in the generated project.

**Fix**:
```bash
cd project
npm install --no-audit --no-fund
```

### Problem: TypeScript compilation errors after re-running the generator

**Cause**: You manually edited a per-table file that the generator overwrote.

**Fix**: The generator overwrites per-table files (entity, repository, service, controller, DTO, mapper, SITO, CQRS handlers). It does NOT overwrite:
- `src/shared/**` (config, logger, middleware, base classes)
- `src/api/routes.ts` (regenerated, but additive)
- `src/application/register-handlers.ts` (regenerated, but additive)
- `tests/setup.ts`, `tests/setup-env.ts`, `tests/helpers/factory.ts`
- `package.json`, `tsconfig.json`, `.env.example`
- All DevOps files (Dockerfile, CI/CD, ESLint, etc.)

If you need to customize a per-table file, edit the GENERATOR source instead so the customization persists across regenerations.

### Problem: Tests fail with `Cannot read properties of undefined (reading 'find')`

**Cause**: You changed `resetMocks: true` in `jest.config.js`.

**Fix**: Keep `resetMocks: false` in `jest.config.js` — the test scaffolding relies on this. (The default generated config already has this set correctly.)

### Problem: CI fails on the security job

**Cause**: `npm audit` found high-severity vulnerabilities.

**Fix**:
```bash
npm audit --audit-level=high
npm audit fix
git add package*.json
git commit -m "chore: security updates"
git push
```

### Problem: Docker build fails with `npm ci` error

**Cause**: `package-lock.json` is out of sync with `package.json`.

**Fix**:
```bash
rm -rf node_modules package-lock.json
npm install
git add package*.json
git commit -m "chore: refresh lockfile"
```

---

## Quick reference card

```bash
# ─── Generator ───
cd hexagonal-ts-generator
npm install
cp .env.example .env  # edit DATABASE_URL, JWT_SECRET, PROJECT_DIR
npm start              # generates ./project/

# ─── Generated API ───
cd project
cp .env.example .env   # edit DATABASE_URL, JWT_SECRET
npm install
npm run dev            # http://localhost:3000

# ─── Verify ───
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
open http://localhost:3000/docs

# ─── Test ───
npm run test:unit                          # no DB needed
RUN_DB_TESTS=true npm run test:integration # needs DB
RUN_DB_TESTS=true npm run test:e2e         # needs DB + Express

# ─── Quality gates ───
npm run lint           # ESLint with auto-fix
npm run format         # Prettier
npm run type-check     # tsc --noEmit

# ─── Build ───
npm run build          # → dist/
npm run swagger        # → openapi.json

# ─── Docker ───
npm run docker:build
docker compose up -d   # API + Postgres
docker compose logs -f api

# ─── Production ───
NODE_ENV=production node dist/server.js
```

---

## What to do next

1. **Customize the generators** for your domain — edit files in `hexagonal-ts-generator/src/generators/` to add domain-specific methods (e.g. `assignRole`, `transferOwnership`) to the per-table service/repository generators.
2. **Add an auth controller** — the generator emits auth middleware but not `/auth/login` and `/auth/refresh` endpoints. Add them under `src/api/controllers/auth.controller.ts`.
3. **Wire up the Enterprise Bus subscribers** — add audit-log, search-index, and notification subscribers under `src/shared/bus/subscribers/`.
4. **Add OpenAPI security schemes** — extend the OpenAPI builder in `src/openapi.ts` to document the auth flow.
5. **Set up database migrations** — replace `synchronize: false` with proper migrations once the schema stabilizes.

For the full architecture overview and feature list, see `README.md`.
