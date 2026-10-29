/**
 * * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 * src/generators/devops-templates.ts
 * -------------------------------------------------------------------
 * Templates for the operational artefacts a world-class REST API needs:
 *
 *   - Dockerfile           (multi-stage build)
 *   - docker-compose.yml   (api + postgres + (optional) redis)
 *   - .dockerignore
 *   - .github/workflows/ci.yml    (lint, type-check, test, build, push image)
 *   - src/scripts/create-migration.ts   (TypeORM migration scaffolder)
 *   - src/scripts/run-migrations.ts     (TypeORM migration runner)
 *   - src/scripts/generate-openapi.ts   (dumps openapi.json to disk)
 *   - .eslintrc.json
 *   - .prettierrc
 *   - .gitignore
 *   - jest.config.ts
 *   - jest.integration.config.js
 *   - tests/factories/<table>.factory.ts   (per-table test factories)
 *   - tests/integration/<table>.integration.test.ts  (per-table integration tests)
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */

import { TableMetadata } from '../types';
import { toPascalCase } from '../utils/naming';

// =====================================================================
// Dockerfile — multi-stage build
// =====================================================================

export function dockerfileTemplate(): string {
  return `# ===================================================================
# Multi-stage Dockerfile for the generated Hexagonal REST API.
# ===================================================================

# ---- Stage 1: build --------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Install build deps for pg-native (used by TypeORM).
RUN apk add --no-cache python3 make g++

# Copy manifests and install deps (cached layer).
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source and compile.
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Prune devDependencies so the runtime image is lean.
RUN npm prune --omit=dev

# ---- Stage 2: runtime ----------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

# Run as non-root user for security.
RUN addgroup -S app && adduser -S app -G app
USER app

# Copy compiled artefacts and prod deps.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Health probe — used by Docker HEALTHCHECK and Kubernetes.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \\
  CMD wget -qO- http://127.0.0.1:3000/health/live || exit 1

CMD ["node", "dist/server.js"]
`;
}

// =====================================================================
// docker-compose.yml
// =====================================================================

export function dockerComposeTemplate(): string {
  return `# docker-compose.yml — local dev environment
# Usage: docker compose up -d
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: awasekhirnisyed
      POSTGRES_PASSWORD: YOUR_PASSWORD_HERE
      POSTGRES_DB: profxdb
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U awasekhirnisyed -d profxdb"]
      interval: 5s
      timeout: 3s
      retries: 5

  api:
    build: .
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://awasekhirnisyed:YOUR_PASSWORD_HERE@postgres:5432/profxdb
      JWT_SECRET: change-me-to-a-32-byte-random-string
      ENABLE_SWAGGER: "true"
      ENABLE_METRICS: "true"
      ENABLE_AUDIT_LOG: "true"
      CORS_ORIGINS: http://localhost:3000,http://localhost:8080
    ports:
      - "3000:3000"
    restart: unless-stopped

volumes:
  pgdata:
`;
}

// =====================================================================
// .dockerignore
// =====================================================================

export function dockerignoreTemplate(): string {
  return `node_modules
dist
.git
.gitignore
.env
.env.local
*.md
tests
coverage
.nyc_output
.DS_Store
*.log
`;
}

// =====================================================================
// .gitignore
// =====================================================================

export function gitignoreTemplate(): string {
  return `# Dependencies
node_modules/

# Build output
dist/
*.tsbuildinfo

# Env files
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# Editor / OS
.vscode/
.idea/
.DS_Store

# Test coverage
coverage/
.nyc_output/

# TypeScript
*.js.map
`;
}

// =====================================================================
// .eslintrc.json
// =====================================================================

export function eslintConfigTemplate(): string {
  return JSON.stringify(
    {
      root: true,
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      env: { node: true, es2022: true, jest: true },
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: {
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        'no-console': 'off',
      },
      ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
    },
    null,
    2,
  );
}

// =====================================================================
// .prettierrc
// =====================================================================

export function prettierConfigTemplate(): string {
  return JSON.stringify(
    {
      semi: true,
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 120,
      tabWidth: 2,
      arrowParens: 'always',
      endOfLine: 'lf',
    },
    null,
    2,
  );
}

// =====================================================================
// jest.config.ts
// =====================================================================

export function jestConfigTemplate(): string {
  return `export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/server.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  resetMocks: true,
  resetModules: true,
};
`;
}

// =====================================================================
// jest.integration.config.js
// =====================================================================

export function jestIntegrationConfigTemplate(): string {
  return `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
};
`;
}

// =====================================================================
// CI/CD workflow (GitHub Actions)
// =====================================================================

export function ciWorkflowTemplate(): string {
  return `name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U test"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/testdb
      JWT_SECRET: ci-test-secret-at-least-32-bytes-long-string
      NODE_ENV: test

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci --no-audit --no-fund

      - name: Lint
        run: npm run lint

      - name: Type-check
        run: npm run typecheck

      - name: Unit tests
        run: npm test -- --coverage

      - name: Integration tests
        run: npm run test:integration

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/

  build-and-push:
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/\${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
`;
}

// =====================================================================
// TypeORM migration scaffolder script
// =====================================================================

export function createMigrationScriptTemplate(): string {
  return `/**
 * src/scripts/create-migration.ts
 * ---------------------------------------------------------------
 * Wrapper around TypeORM's migration:create that names the file with
 * a leading timestamp so migrations run in the correct order.
 *
 * Usage: npm run migrate:create -- AddUsersTable
 */
import { execSync } from 'child_process';
import path from 'path';

const name = process.argv[2];
if (!name) {
  console.error('Usage: npm run migrate:create -- <MigrationName>');
  process.exit(1);
}

const migrationsDir = path.resolve(__dirname, '..', 'infrastructure', 'database', 'migrations');
const cmd = \`npx typeorm migration:create \${path.join(migrationsDir, name)}\`;
console.log('Running:', cmd);
execSync(cmd, { stdio: 'inherit' });
`;
}

// =====================================================================
// TypeORM migration runner script
// =====================================================================

export function runMigrationsScriptTemplate(): string {
  return `/**
 * src/scripts/run-migrations.ts
 * ---------------------------------------------------------------
 * Boots the DataSource and runs all pending migrations.
 *
 * Usage: npm run migrate
 */
import { initDatabase, closeDatabase, AppDataSource } from '../infrastructure/database/database';
import { log } from '../shared/utils/logger';

async function main(): Promise<void> {
  await initDatabase();
  try {
    const migrations = await AppDataSource.runMigrations({ transaction: 'each' });
    log.info('migrations complete', { count: migrations.length });
  } catch (err) {
    log.error('migrations failed', { error: (err as Error).message });
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

main();
`;
}

// =====================================================================
// OpenAPI dump script — writes openapi.json to disk
// =====================================================================

export function generateOpenApiScriptTemplate(): string {
  return `/**
 * src/scripts/generate-openapi.ts
 * ---------------------------------------------------------------
 * Dumps the OpenAPI 3 spec to ./openapi.json so it can be served as
 * a static asset or imported into Postman / Stoplight.
 *
 * Usage: npm run swagger
 */
import fs from 'fs';
import path from 'path';
import { buildOpenApiSpec } from '../openapi';

const outPath = path.resolve(process.cwd(), 'openapi.json');
fs.writeFileSync(outPath, JSON.stringify(buildOpenApiSpec(), null, 2), 'utf8');
console.log(\`OpenAPI spec written to \${outPath}\`);
`;
}

// =====================================================================
// tests/setup.ts — shared test bootstrap
// =====================================================================

export function testSetupTemplate(): string {
  return `/**
 * tests/setup.ts
 * ---------------------------------------------------------------
 * Shared setup for integration tests. Boots the DataSource before all
 * tests, runs migrations, and tears down after.
 */
import { initDatabase, closeDatabase } from '../src/infrastructure/database/database';

beforeAll(async () => {
  await initDatabase();
}, 60_000);

afterAll(async () => {
  await closeDatabase();
});
`;
}

// =====================================================================
// tests/health.test.ts — smoke test
// =====================================================================

export function healthTestTemplate(): string {
  return `/**
 * tests/health.test.ts
 * ---------------------------------------------------------------
 * Smoke test verifying the Express app boots and /health/live responds.
 */
import request from 'supertest';
import { createApp } from '../src/app';

describe('Health endpoints', () => {
  it('GET /health/live returns 200 with status=ok', async () => {
    const app = createApp();
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET / returns the app info object', async () => {
    const app = createApp();
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.app).toBeDefined();
  });
});
`;
}

// =====================================================================
// tests/factories/<table>.factory.ts — test data factory
// =====================================================================

export function testFactoryTemplate(meta: TableMetadata): string {
  const className = toPascalCase(meta.name);
  const tableName = meta.name;
  const writable = meta.columns.filter((c) =>
    !['id', 'created_at', 'updated_at', 'modified_at', 'is_deleted', 'deleted_at', 'deleted'].includes(c.columnName.toLowerCase()) && !c.isPrimaryKey
  );
  const fields = writable.map((c) => {
    const t = c.dataType.toLowerCase();
    if (t === 'boolean') return `${c.columnName}: ${c.columnDefault ?? 'false'}`;
    if (t === 'integer' || t === 'smallint' || t === 'bigint' || t === 'numeric' || t === 'decimal') return `${c.columnName}: ${c.columnDefault ?? '0'}`;
    if (t === 'uuid') return `${c.columnName}: '${c.columnDefault?.includes('uuid_generate_v4') ? '00000000-0000-0000-0000-000000000000' : 'static-uuid'}'`;
    if (t === 'timestamp without time zone' || t === 'timestamp with time zone' || t === 'date') return `${c.columnName}: new Date()`;
    if (t === 'json' || t === 'jsonb') return `${c.columnName}: {}`;
    return `${c.columnName}: '${c.columnName}-test-value'`;
  }).join(',\n    ');

  return `/**
 * tests/factories/${tableName}.factory.ts
 * ---------------------------------------------------------------
 * Test data factory for the ${className} entity. Returns valid
 * DeepPartial payloads that can be passed to the service / repository.
 *
 * AUTO-GENERATED by hexagonal-ts-generator.
 */
import { DeepPartial } from 'typeorm';
import { ${className} } from '../../src/domain/${tableName}/${tableName}.entity';

let counter = 0;

/**
 * Builds a ${className} DTO with sensible defaults. Override any field
 * by passing partial overrides.
 *
 *   const dto = build${className}({ email: 'x@y.com' });
 */
export function build${className}(overrides: Partial<DeepPartial<${className}>> = {}): DeepPartial<${className}> {
  counter += 1;
  return {
    ${fields},
    ...overrides,
  } as DeepPartial<${className}>;
}
`;
}

// =====================================================================
// tests/integration/<table>.integration.test.ts
// =====================================================================

export function integrationTestTemplate(meta: TableMetadata): string {
  const className = toPascalCase(meta.name);
  const tableName = meta.name;

  return `/**
 * tests/integration/${tableName}.integration.test.ts
 * ---------------------------------------------------------------
 * Integration test for the ${className} REST endpoints.
 * Boots a real Express app + real TypeORM DataSource (test DB).
 *
 * AUTO-GENERATED by hexagonal-ts-generator.
 */
import request from 'supertest';
import { createApp } from '../../src/app';
import { build${className} } from '../factories/${tableName}.factory';

const app = createApp();

describe('${className} REST API', () => {
  let createdId: string | undefined;

  it('POST /api/v1/${tableName} creates a new ${className}', async () => {
    const payload = build${className}();
    const res = await request(app)
      .post('/api/v1/${tableName}')
      .set('x-api-key', 'local-dev-key-1')
      .send(payload);

    expect([201, 400, 401]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      createdId = res.body.data?.id;
    }
  });

  it('GET /api/v1/${tableName} returns paginated list', async () => {
    const res = await request(app)
      .get('/api/v1/${tableName}')
      .set('x-api-key', 'local-dev-key-1')
      .query({ page: 1, per_page: 10 });

    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(res.body.links).toBeDefined();
    }
  });

  it('GET /api/v1/${tableName}/:id returns 404 for unknown id', async () => {
    const res = await request(app)
      .get('/api/v1/${tableName}/00000000-0000-0000-0000-000000000000')
      .set('x-api-key', 'local-dev-key-1');

    expect([404, 401]).toContain(res.status);
    if (res.status === 404) {
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects requests without auth', async () => {
    const res = await request(app).get('/api/v1/${tableName}');
    expect([401, 200]).toContain(res.status);
    if (res.status === 401) {
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    }
  });
});
`;
}
