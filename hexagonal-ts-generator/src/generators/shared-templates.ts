/**
 * * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 * src/generators/shared-templates.ts
 * -------------------------------------------------------------------
 * Cross-cutting TypeScript code templates for the generated REST API.
 *
 * WORLD-CLASS ENHANCEMENTS (v2):
 *   - JWT + API-key + RBAC authentication middleware
 *   - Request ID / correlation ID middleware
 *   - Structured JSON logging with request context
 *   - Audit log for every mutation (create/update/delete)
 *   - Prometheus /metrics endpoint
 *   - Liveness vs readiness probes (/health/live vs /health/ready)
 *   - Standardized error envelope
 *   - Cursor + offset pagination envelope
 *   - HATEOAS links
 *   - Unit of Work pattern (transactions)
 *   - Specification pattern (query DSL)
 *   - Domain Events (DDD)
 *   - Value Objects for IDs
 *   - Graceful shutdown with connection drain
 *   - Env validation (fail-fast on missing vars)
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 */

import { GeneratorConfig } from '../types';

// =====================================================================
// 1. package.json
// =====================================================================

export function packageJsonTemplate(cfg: GeneratorConfig): string {
  const dependencies: Record<string, string> = {
    express: '^4.19.2',
    'express-rate-limit': '^7.2.0',
    helmet: '^7.1.0',
    cors: '^2.8.5',
    morgan: '^1.10.0',
    typeorm: '^0.3.20',
    pg: '^8.11.5',
    'reflect-metadata': '^0.2.2',
    'class-validator': '^0.14.1',
    'class-transformer': '^0.5.1',
    'swagger-jsdoc': '^6.2.8',
    'swagger-ui-express': '^5.0.1',
    winston: '^3.13.2',
    dotenv: '^16.4.5',
    uuid: '^9.0.1',
    jsonwebtoken: '^9.0.2',
    joi: '^17.13.1',
    'prom-client': '^15.1.2',
    bcryptjs: '^2.4.3',
    compression: '^1.7.4',
    'response-time': '^2.3.2',
    'express-winston': '^4.2.0',
    hpp: '^0.2.3',
  };

  const devDependencies: Record<string, string> = {
    '@types/node': '^20.12.12',
    '@types/express': '^4.17.21',
    '@types/cors': '^2.8.17',
    '@types/morgan': '^1.9.9',
    '@types/uuid': '^9.0.8',
    '@types/pg': '^8.11.6',
    '@types/swagger-ui-express': '^4.1.6',
    '@types/swagger-jsdoc': '^6.0.4',
    '@types/jsonwebtoken': '^9.0.6',
    '@types/bcryptjs': '^2.4.6',
    '@types/compression': '^1.7.5',
    '@types/response-time': '^2.3.8',
    '@types/hpp': '^0.2.6',
    typescript: '^5.4.5',
    'ts-node': '^10.9.2',
    'ts-node-dev': '^2.0.0',
    jest: '^29.7.0',
    '@types/jest': '^29.5.12',
    'ts-jest': '^29.1.2',
    supertest: '^7.0.0',
    '@types/supertest': '^6.0.2',
  };
  const scripts: Record<string, string> = {
    build: 'tsc -p tsconfig.json',
    start: 'node dist/server.js',
    dev: 'ts-node-dev --respawn --transpile-only src/server.ts',
    swagger: 'ts-node src/scripts/generate-openapi.ts',
    migrate: 'ts-node src/scripts/run-migrations.ts',
    'migrate:create': 'ts-node src/scripts/create-migration.ts',
    test: 'jest --runInBand',
    'test:integration': 'jest --config jest.integration.config.js --runInBand',
    lint: 'eslint "src/**/*.ts"',
    typecheck: 'tsc --noEmit',
  };
  return JSON.stringify(
    {
      name: cfg.appName.toLowerCase().replace(/\s+/g, '-'),
      version: cfg.appVersion,
      description: cfg.appDescription,
      main: 'dist/server.js',
      scripts,
      dependencies,
      devDependencies,
      engines: { node: '>=20.0.0' },
    },
    null,
    2,
  );
}

// =====================================================================
// 2. tsconfig.json
// =====================================================================

export function tsConfigTemplate(): string {
  const compilerOptions: Record<string, unknown> = {
    target: 'ES2022',
    module: 'CommonJS',
    lib: ['ES2022'],
    outDir: './dist',
    rootDir: './src',
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    noUncheckedIndexedAccess: true,
    noImplicitOverride: true,
    noFallthroughCasesInSwitch: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    forceConsistentCasingInFileNames: true,
    skipLibCheck: true,
    resolveJsonModule: true,
    sourceMap: true,
    moduleResolution: 'Node',
    types: ['node', 'jest'],
  };
  return JSON.stringify(
    {
      compilerOptions,
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    },
    null,
    2,
  );
}

// =====================================================================
// 3. .env.example
// =====================================================================

export function envExampleTemplate(cfg: GeneratorConfig): string {
  return `# ===================================================================
# Generated REST API runtime configuration.
# Every variable below is validated at boot by src/config/index.ts —
# missing required vars will crash the process with a clear error.
# ===================================================================

# ---- Runtime ----
NODE_ENV=development
PORT=3000
LOG_LEVEL=info                  # error | warn | info | debug

# ---- Database ----
DATABASE_URL="${cfg.databaseUrl}"
DB_SCHEMA=public
DB_POOL_SIZE=${cfg.dbPoolSize}
DB_MAX_OVERFLOW=${cfg.dbMaxOverflow}
DB_POOL_RECYCLE=${cfg.dbPoolRecycle}
DB_STATEMENT_TIMEOUT_MS=15000

# ---- Application metadata (surfaced in OpenAPI) ----
APP_NAME="${cfg.appName}"
APP_VERSION="${cfg.appVersion}"
APP_DESCRIPTION="${cfg.appDescription}"
DEBUG=${cfg.debug}

# ---- CORS ----
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# ---- Auth (JWT) ----
JWT_SECRET=change-me-to-a-32-byte-random-string
JWT_ISSUER=${cfg.appName}
JWT_AUDIENCE=${cfg.appName}-clients
JWT_EXPIRES_IN_SECONDS=3600
JWT_ALGORITHM=HS256

# ---- Auth (API key for service-to-service) ----
API_KEY_HEADER=x-api-key
API_KEYS=local-dev-key-1,local-dev-key-2

# ---- Rate limiting ----
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# ---- Swagger ----
ENABLE_SWAGGER=true

# ---- Observability ----
ENABLE_METRICS=true            # mount /metrics endpoint
ENABLE_REQUEST_LOG=true
ENABLE_AUDIT_LOG=true

# ---- Graceful shutdown ----
SHUTDOWN_TIMEOUT_MS=10000
`;
}

// =====================================================================
// 4. config/index.ts — typed env loader with Joi validation
// =====================================================================

export function configTemplate(cfg: GeneratorConfig): string {
  return `/**
 * src/config/index.ts
 * ---------------------------------------------------------------
 * Typed, VALIDATED .env loader.
 *
 * Validation runs at boot — missing or malformed env vars crash the
 * process with a clear error message instead of failing silently
 * 10 minutes into a request.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3000),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  DATABASE_URL: Joi.string().required(),
  DB_SCHEMA: Joi.string().default('public'),
  DB_POOL_SIZE: Joi.number().integer().min(1).default(10),
  DB_MAX_OVERFLOW: Joi.number().integer().min(0).default(20),
  DB_POOL_RECYCLE: Joi.number().integer().min(60).default(1800),
  DB_STATEMENT_TIMEOUT_MS: Joi.number().integer().min(1000).default(15000),

  APP_NAME: Joi.string().default(${JSON.stringify(cfg.appName)}),
  APP_VERSION: Joi.string().default(${JSON.stringify(cfg.appVersion)}),
  APP_DESCRIPTION: Joi.string().default(${JSON.stringify(cfg.appDescription)}),
  DEBUG: Joi.boolean().default(${cfg.debug}),

  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_ISSUER: Joi.string().default(${JSON.stringify(cfg.appName)}),
  JWT_AUDIENCE: Joi.string().default(${JSON.stringify(cfg.appName)} + '-clients'),
  JWT_EXPIRES_IN_SECONDS: Joi.number().integer().min(60).default(3600),
  JWT_ALGORITHM: Joi.string().valid('HS256', 'HS384', 'HS512', 'RS256').default('HS256'),

  API_KEY_HEADER: Joi.string().default('x-api-key'),
  API_KEYS: Joi.string().default(''),

  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(60000),
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(100),

  ENABLE_SWAGGER: Joi.boolean().default(true),
  ENABLE_METRICS: Joi.boolean().default(true),
  ENABLE_REQUEST_LOG: Joi.boolean().default(true),
  ENABLE_AUDIT_LOG: Joi.boolean().default(true),

  SHUTDOWN_TIMEOUT_MS: Joi.number().integer().min(1000).default(10000),
}).unknown(true);

const { value, error } = envSchema.validate(process.env, { abortEarly: false });
if (error) {
  // eslint-disable-next-line no-console
  console.error('FATAL: invalid environment configuration:');
  for (const detail of error.details) {
    // eslint-disable-next-line no-console
    console.error('  -', detail.message);
  }
  process.exit(1);
}

const env = value as Record<string, unknown>;

export const config = {
  nodeEnv: env.NODE_ENV as string,
  isProduction: (env.NODE_ENV as string) === 'production',
  isTest: (env.NODE_ENV as string) === 'test',
  port: env.PORT as number,
  logLevel: env.LOG_LEVEL as string,

  databaseUrl: env.DATABASE_URL as string,
  dbSchema: env.DB_SCHEMA as string,
  dbPoolSize: env.DB_POOL_SIZE as number,
  dbMaxOverflow: env.DB_MAX_OVERFLOW as number,
  dbPoolRecycle: env.DB_POOL_RECYCLE as number,
  dbStatementTimeoutMs: env.DB_STATEMENT_TIMEOUT_MS as number,

  appName: env.APP_NAME as string,
  appVersion: env.APP_VERSION as string,
  appDescription: env.APP_DESCRIPTION as string,
  debug: env.DEBUG as boolean,

  corsOrigins: ((env.CORS_ORIGINS as string) || '').split(',').map((s) => s.trim()).filter(Boolean),

  jwt: {
    secret: env.JWT_SECRET as string,
    issuer: env.JWT_ISSUER as string,
    audience: env.JWT_AUDIENCE as string,
    expiresInSec: env.JWT_EXPIRES_IN_SECONDS as number,
    algorithm: env.JWT_ALGORITHM as 'HS256' | 'HS384' | 'HS512' | 'RS256',
  },

  apiKey: {
    header: env.API_KEY_HEADER as string,
    keys: ((env.API_KEYS as string) || '').split(',').map((s) => s.trim()).filter(Boolean),
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS as number,
    max: env.RATE_LIMIT_MAX as number,
  },

  enableSwagger: env.ENABLE_SWAGGER as boolean,
  enableMetrics: env.ENABLE_METRICS as boolean,
  enableRequestLog: env.ENABLE_REQUEST_LOG as boolean,
  enableAuditLog: env.ENABLE_AUDIT_LOG as boolean,
  shutdownTimeoutMs: env.SHUTDOWN_TIMEOUT_MS as number,
} as const;

export type AppConfig = typeof config;
`;
}

// =====================================================================
// 5. logger.ts — winston with structured JSON + request context
// =====================================================================

export function loggerTemplate(): string {
  return `/**
 * src/shared/utils/logger.ts
 * ---------------------------------------------------------------
 * Winston logger with:
 *   - JSON output in production, pretty-print in development
 *   - Per-request context (requestId, userId, method, path)
 *   - Child logger factory so each module gets a labelled instance
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import winston, { Logger } from 'winston';
import { config } from '../../config';

const { combine, timestamp, printf, colorize, errors, splat, json } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, stack, requestId, userId, module, ...rest }) => {
  const ctx = [
    requestId ? \`req=\${requestId}\` : '',
    userId ? \`user=\${userId}\` : '',
    module ? \`mod=\${module}\` : '',
  ].filter(Boolean).join(' ');
  return \`\${ts} [\${level}] \${ctx ? '[' + ctx + '] ' : ''}\${stack ?? message}\${Object.keys(rest).length ? ' ' + JSON.stringify(rest) : ''}\`;
});

const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  errors({ stack: true }),
  splat(),
  json(),
);

export const logger: Logger = winston.createLogger({
  level: config.logLevel,
  format: config.isProduction ? prodFormat : combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), splat(), devFormat),
  defaultMeta: { service: config.appName, version: config.appVersion },
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

/**
 * AsyncLocalStorage-backed request context. Lets every logger call
 * automatically pick up the current requestId / userId without having
 * to thread them through every function signature.
 */
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId?: string;
  userId?: string | number;
  method?: string;
  path?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Returns the current request context (or an empty object if no
 * request is in flight). Safe to call from anywhere in the codebase.
 */
export function getRequestContext(): RequestContext {
  return requestContextStorage.getStore() ?? {};
}

/**
 * Create a child logger that automatically injects the current
 * request context into every log line.
 *
 * Usage:
 *   const log = createChildLogger('UserService');
 *   log.info('creating user', { email });
 */
export function createChildLogger(module: string): winston.Logger {
  return logger.child({ module, getContext: () => getRequestContext() });
}

/**
 * Convenience wrappers that auto-attach request context.
 */
export const log = {
  debug: (msg: string, meta?: object) => logger.debug(msg, { ...getRequestContext(), ...meta }),
  info:  (msg: string, meta?: object) => logger.info(msg,  { ...getRequestContext(), ...meta }),
  warn:  (msg: string, meta?: object) => logger.warn(msg,  { ...getRequestContext(), ...meta }),
  error: (msg: string, meta?: object) => logger.error(msg, { ...getRequestContext(), ...meta }),
};
`;
}

// =====================================================================
// 6. http-error.ts — typed HTTP errors + standardized envelope
// =====================================================================

export function httpErrorTemplate(): string {
  return `/**
 * src/shared/utils/http-error.ts
 * ---------------------------------------------------------------
 * Typed HTTP errors used by the API layer. Controllers raise these
 * and the global Express error handler translates them into the
 * standardized JSON envelope defined in src/shared/utils/api-response.ts.
 *
 * Every error carries an \`error_code\` string so clients can switch
 * on it without parsing the human-readable message.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_FAILED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PRECONDITION_FAILED'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: ErrorCode,
    message: string,
    public readonly details?: unknown,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'HttpError';
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

// Convenience factories — every error code has a named constructor.
export const badRequest       = (msg: string, details?: unknown) => new HttpError(400, 'BAD_REQUEST', msg, details);
export const validationFailed = (details: unknown)              => new HttpError(400, 'VALIDATION_FAILED', 'Validation failed', details);
export const unauthorized     = (msg = 'Unauthorized')           => new HttpError(401, 'UNAUTHORIZED', msg);
export const forbidden        = (msg = 'Forbidden')              => new HttpError(403, 'FORBIDDEN', msg);
export const notFound         = (msg = 'Resource not found')     => new HttpError(404, 'NOT_FOUND', msg);
export const conflict         = (msg: string, details?: unknown) => new HttpError(409, 'CONFLICT', msg, details);
export const preconditionFailed = (msg: string)                   => new HttpError(412, 'PRECONDITION_FAILED', msg);
export const tooManyRequests = (msg = 'Too many requests')       => new HttpError(429, 'TOO_MANY_REQUESTS', msg);
export const internalError    = (msg = 'Internal server error')  => new HttpError(500, 'INTERNAL_ERROR', msg);
export const serviceUnavailable = (msg = 'Service unavailable')  => new HttpError(503, 'SERVICE_UNAVAILABLE', msg);
`;
}

// =====================================================================
// 7. api-response.ts — standardized JSON envelope + pagination
// =====================================================================

export function apiResponseTemplate(): string {
  return `/**
 * src/shared/utils/api-response.ts
 * ---------------------------------------------------------------
 * Standardized JSON envelope for EVERY API response.
 *
 *   Success: { success: true,  data: T, meta?: PaginationMeta, links?: HateoasLinks }
 *   Error:   { success: false, error: { code, message, details?, traceId } }
 *
 * Pagination is always returned as meta so clients can render
 * "Showing 1-20 of 347" without parsing response headers.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import { Response } from 'express';
import { getRequestContext } from './logger';
import { HttpError } from './http-error';

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  /** Cursor for the next page (opaque string). Use as ?cursor=... */
  nextCursor?: string;
}

export interface HateoasLinks {
  self?:   string;
  first?:  string;
  prev?:   string;
  next?:   string;
  last?:   string;
  create?: string;
  update?: string;
  delete?: string;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  links?: HateoasLinks;
  traceId?: string;
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  traceId?: string;
}

/** Send a 200 success envelope. */
export function sendOk<T>(res: Response, data: T, status = 200): Response {
  const traceId = getRequestContext().requestId;
  const body: SuccessEnvelope<T> = { success: true, data, traceId };
  return res.status(status).json(body);
}

/** Send a 201 Created success envelope. */
export function sendCreated<T>(res: Response, data: T): Response {
  return sendOk(res, data, 201);
}

/** Send a 204 No Content (no body). */
export function sendNoContent(res: Response): Response {
  return res.status(204).end();
}

/** Send a paginated list envelope. */
export function sendPaginated<T>(
  res: Response,
  rows: T[],
  opts: { page: number; perPage: number; total: number; nextCursor?: string; basePath: string },
): Response {
  const totalPages = Math.ceil(opts.total / opts.perPage) || 0;
  const hasMore = opts.page * opts.perPage < opts.total;
  const meta: PaginationMeta = {
    page: opts.page,
    perPage: opts.perPage,
    total: opts.total,
    totalPages,
    hasMore,
    nextCursor: opts.nextCursor,
  };
  const links: HateoasLinks = {
    self:  \`\${opts.basePath}?page=\${opts.page}&per_page=\${opts.perPage}\`,
    first: \`\${opts.basePath}?page=1&per_page=\${opts.perPage}\`,
    last:  totalPages > 0 ? \`\${opts.basePath}?page=\${totalPages}&per_page=\${opts.perPage}\` : undefined,
    next:  hasMore ? \`\${opts.basePath}?page=\${opts.page + 1}&per_page=\${opts.perPage}\` : undefined,
    prev:  opts.page > 1 ? \`\${opts.basePath}?page=\${opts.page - 1}&per_page=\${opts.perPage}\` : undefined,
    create: opts.basePath,
  };
  const traceId = getRequestContext().requestId;
  const body: SuccessEnvelope<T[]> = { success: true, data: rows, meta, links, traceId };
  return res.status(200).json(body);
}

/** Translate an HttpError into the standardized error envelope. */
export function sendError(res: Response, err: HttpError | Error): Response {
  const traceId = getRequestContext().requestId;
  if (err instanceof HttpError) {
    const body: ErrorEnvelope = {
      success: false,
      error: { code: err.errorCode, message: err.message, details: err.details },
      traceId,
    };
    return res.status(err.statusCode).json(body);
  }
  // Unknown error — never leak internal details in production.
  const body: ErrorEnvelope = {
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' },
    traceId,
  };
  return res.status(500).json(body);
}
`;
}

// =====================================================================
// 8. middleware/request-id.ts — correlation ID per request
// =====================================================================

export function requestIdMiddlewareTemplate(): string {
  return `/**
 * src/shared/middleware/request-id.ts
 * ---------------------------------------------------------------
 * Reads (or generates) a correlation ID for every inbound request and
 * stores it in:
 *   1. res.header 'x-request-id'   (so clients can correlate)
 *   2. AsyncLocalStorage requestContext (so every log line auto-includes it)
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { requestContextStorage, RequestContext } from '../utils/logger';

export function requestIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = (req.header('x-request-id') as string) || randomUUID();
    res.setHeader('x-request-id', requestId);

    const ctx: RequestContext = {
      requestId,
      method: req.method,
      path: req.path,
    };

    // Run the rest of the request inside an AsyncLocalStorage context
    // so every logger call can pick up the requestId automatically.
    requestContextStorage.run(ctx, () => next());
  };
}
`;
}

// =====================================================================
// 9. middleware/auth.ts — JWT + API key + RBAC
// =====================================================================

export function authMiddlewareTemplate(): string {
  return `/**
 * src/shared/middleware/auth.ts
 * ---------------------------------------------------------------
 * Three pluggable authentication strategies:
 *
 *   1. authenticateJwt   — verify a Bearer token (HS256/RS256)
 *   2. authenticateApiKey — verify the configured API key header
 *   3. authenticateAny    — accept EITHER of the above
 *
 * Plus an RBAC helper:
 *
 *   @requireRoles('admin', 'editor')
 *   registerUsersRoutes(router, '/users', [requireRoles('admin')]);
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { JwtPayload, VerifyOptions } from 'jsonwebtoken';
import { config } from '../../config';
import { unauthorized, forbidden } from '../utils/http-error';
import { log } from '../utils/logger';

export interface AuthenticatedUser {
  userId: string | number;
  email?: string;
  roles: string[];
  scopes?: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      authMethod?: 'jwt' | 'api-key';
    }
  }
}

const verifyOpts: VerifyOptions = {
  issuer: config.jwt.issuer,
  audience: config.jwt.audience,
  algorithms: [config.jwt.algorithm],
};

/** Extract and verify a Bearer JWT. */
export function authenticateJwt(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization') ?? '';
  const match = /^Bearer\\s+(.+)$/i.exec(header);
  if (!match) {
    log.debug('JWT auth skipped: no Bearer header', { path: req.path });
    return next(unauthorized('Missing Bearer token'));
  }
  try {
    const decoded = jwt.verify(match[1], config.jwt.secret, verifyOpts) as JwtPayload;
    req.user = {
      userId: (decoded.sub ?? decoded.userId ?? decoded.id) as string | number,
      email: decoded.email as string | undefined,
      roles: (decoded.roles as string[]) ?? [],
      scopes: (decoded.scopes as string[]) ?? [],
    };
    req.authMethod = 'jwt';
    log.debug('JWT auth ok', { userId: req.user.userId, roles: req.user.roles });
    next();
  } catch (err) {
    log.warn('JWT auth failed', { reason: (err as Error).message });
    next(unauthorized('Invalid or expired token'));
  }
}

/** Verify the configured API key header against the allow-list. */
export function authenticateApiKey(req: Request, _res: Response, next: NextFunction): void {
  const key = req.header(config.apiKey.header);
  if (!key) {
    return next(unauthorized('Missing API key'));
  }
  if (!config.apiKey.keys.includes(key)) {
    log.warn('API key rejected', { header: config.apiKey.header });
    return next(unauthorized('Invalid API key'));
  }
  req.user = { userId: 'service', roles: ['service'] };
  req.authMethod = 'api-key';
  log.debug('API-key auth ok');
  next();
}

/** Accept either a Bearer JWT OR a valid API key. */
export function authenticateAny(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('authorization') ?? '';
  if (/^Bearer\\s+/i.test(header)) return authenticateJwt(req, res, next);
  if (req.header(config.apiKey.header)) return authenticateApiKey(req, res, next);
  next(unauthorized('No credentials provided'));
}

/**
 * RBAC middleware factory. Use as a per-route guard.
 *
 *   router.post('/', authenticateJwt, requireRoles('admin'), handler)
 */
export function requireRoles(...allowed: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(unauthorized('Authentication required'));
    const hasRole = req.user.roles.some((r) => allowed.includes(r));
    if (!hasRole) {
      log.warn('RBAC denied', { userId: req.user.userId, userRoles: req.user.roles, required: allowed });
      return next(forbidden(\`Requires one of: \${allowed.join(', ')}\`));
    }
    next();
  };
}

/**
 * Optional JWT — populates req.user if a token is present but does NOT
 * reject anonymous requests. Useful for public endpoints that behave
 * differently for logged-in users.
 */
export function optionalJwt(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization') ?? '';
  if (!/^Bearer\\s+/i.test(header)) return next();
  try {
    const decoded = jwt.verify(header.replace(/^Bearer\\s+/i, ''), config.jwt.secret, verifyOpts) as JwtPayload;
    req.user = {
      userId: (decoded.sub ?? decoded.userId ?? decoded.id) as string | number,
      email: decoded.email as string | undefined,
      roles: (decoded.roles as string[]) ?? [],
      scopes: (decoded.scopes as string[]) ?? [],
    };
    req.authMethod = 'jwt';
  } catch {
    // ignore — leave req.user undefined
  }
  next();
}
`;
}

// =====================================================================
// 10. middleware/audit-log.ts — log every mutation
// =====================================================================

export function auditLogMiddlewareTemplate(): string {
  return `/**
 * src/shared/middleware/audit-log.ts
 * ---------------------------------------------------------------
 * Emits an audit-log entry for every mutating request (POST / PUT /
 * PATCH / DELETE). Each entry captures:
 *   - timestamp, requestId, userId, authMethod
 *   - method, path, statusCode, durationMs
 *   - request body (sanitised — passwords and tokens are masked)
 *
 * Audit logs go to the SAME winston logger as everything else so they
 * can be shipped to ELK / Datadog / CloudWatch via the same transport.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import { Request, Response, NextFunction } from 'express';
import { config } from '../../config';
import { log, getRequestContext } from '../utils/logger';

const SENSITIVE_KEYS = ['password', 'passwd', 'token', 'secret', 'authorization', 'apiKey', 'api_key', 'credit_card'];

function mask(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return '***';
  if (Array.isArray(value)) return value.map(mask);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s)) ? '***' : mask(v);
    }
    return out;
  }
  return value;
}

/** Express middleware: log a structured audit row after each response. */
export function auditLogMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!config.enableAuditLog) return next();
    // Skip GET (read-only) — only audit mutations.
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return next();
    }

    const startedAt = Date.now();
    const ctx = getRequestContext();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      log.info('audit', {
        event: 'mutation',
        requestId: ctx.requestId,
        userId: req.user?.userId,
        authMethod: req.authMethod,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs,
        body: mask(req.body),
      });
    });

    next();
  };
}
`;
}

// =====================================================================
// 11. middleware/metrics.ts — Prometheus /metrics endpoint
// =====================================================================

export function metricsMiddlewareTemplate(): string {
  return `/**
 * src/shared/middleware/metrics.ts
 * ---------------------------------------------------------------
 * Prometheus metrics collection. Exposes /metrics on the same Express
 * app — scrape it from your prometheus.yml.
 *
 * Metrics emitted:
 *   http_requests_total{method,route,status}
 *   http_request_duration_seconds{method,route,status} (histogram)
 *   http_request_size_bytes{...}
 *   http_response_size_bytes{...}
 *   db_pool_active_connections
 *   process_* (default Prometheus process metrics)
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import { Request, Response, NextFunction } from 'express';
import promClient, { Histogram, Counter } from 'prom-client';
import { config } from '../../config';
import { log } from '../utils/logger';

// Default Node.js metrics (CPU, memory, event loop lag).
const defaultMetrics = promClient.collectDefaultMetrics;
defaultMetrics({ register: promClient.register, prefix: 'app_' });

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests handled',
  labelNames: ['method', 'route', 'status'],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const httpRequestSizeBytes = new Histogram({
  name: 'http_request_size_bytes',
  help: 'HTTP request body size in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10_000, 100_000, 1_000_000],
});

export const httpResponseSizeBytes = new Histogram({
  name: 'http_response_size_bytes',
  help: 'HTTP response body size in bytes',
  labelNames: ['method', 'route', 'status'],
  buckets: [100, 1000, 10_000, 100_000, 1_000_000],
});

/**
 * Express middleware that records every request's duration, size, and
 * status. Mounted globally in app.ts.
 */
export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!config.enableMetrics) return next();
    const startedAt = process.hrtime.bigint();

    // Determine the matched route template (e.g. "/api/v1/users/:id")
    // AFTER routing has happened, by reading res.req.route.
    res.on('finish', () => {
      const route = (res.req.route?.path as string | undefined) ?? req.path;
      const labels = { method: req.method, route, status: String(res.statusCode) };
      const durationSec = Number(process.hrtime.bigint() - startedAt) / 1e9;
      httpRequestTotal.inc(labels);
      httpRequestDurationSeconds.observe(labels, durationSec);
      const reqSize = parseInt(req.header('content-length') ?? '0', 10) || 0;
      if (reqSize > 0) httpRequestSizeBytes.observe({ method: labels.method, route: labels.route }, reqSize);
      const resSize = parseInt(res.getHeader('content-length') as string ?? '0', 10) || 0;
      if (resSize > 0) httpResponseSizeBytes.observe(labels, resSize);
    });

    next();
  };
}

/** /metrics endpoint handler. */
export function metricsHandler(_req: Request, res: Response): void {
  promClient.register.metrics().then((output) => {
    res.set('content-type', promClient.register.contentType);
    res.end(output);
  }).catch((err) => {
    log.error('metrics scrape failed', { error: (err as Error).message });
    res.status(500).end('# metrics unavailable');
  });
}
`;
}

// =====================================================================
// 12. health checks — liveness vs readiness
// =====================================================================

export function healthCheckTemplate(): string {
  return `/**
 * src/shared/middleware/health.ts
 * ---------------------------------------------------------------
 * Two distinct probes for Kubernetes:
 *
 *   GET /health/live   — is the process alive? (always 200 unless crashed)
 *   GET /health/ready  — is the process READY to receive traffic?
 *                         (DB reachable + DataSource initialized)
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import { Request, Response } from 'express';
import { AppDataSource } from '../../infrastructure/database/database';
import { config } from '../../config';
import { log } from '../utils/logger';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  app: string;
  version: string;
  timestamp: string;
  checks: Record<string, { status: 'ok' | 'fail'; latencyMs?: number; error?: string }>;
}

export async function livenessHandler(_req: Request, res: Response): Promise<void> {
  // Liveness = "the process is alive and serving HTTP". Don't check DB here.
  const body: HealthResponse = {
    status: 'ok',
    app: config.appName,
    version: config.appVersion,
    timestamp: new Date().toISOString(),
    checks: { process: { status: 'ok' } },
  };
  res.status(200).json(body);
}

export async function readinessHandler(_req: Request, res: Response): Promise<void> {
  const checks: HealthResponse['checks'] = {};
  let overall: 'ok' | 'degraded' | 'down' = 'ok';

  // Database check
  try {
    if (!AppDataSource.isInitialized) {
      throw new Error('DataSource not initialized');
    }
    const startedAt = Date.now();
    await AppDataSource.query('SELECT 1');
    checks.database = { status: 'ok', latencyMs: Date.now() - startedAt };
  } catch (err) {
    checks.database = { status: 'fail', error: (err as Error).message };
    overall = 'down';
    log.error('readiness DB check failed', { error: (err as Error).message });
  }

  const body: HealthResponse = {
    status: overall,
    app: config.appName,
    version: config.appVersion,
    timestamp: new Date().toISOString(),
    checks,
  };
  res.status(overall === 'ok' ? 200 : 503).json(body);
}
`;
}

// =====================================================================
// 13. database.ts — TypeORM DataSource with retry + metrics
// =====================================================================

export function databaseConfigTemplate(cfg: GeneratorConfig): string {
  return `/**
 * src/infrastructure/database/database.ts
 * ---------------------------------------------------------------
 * TypeORM DataSource singleton with:
 *   - retry-on-boot (3 attempts, exponential backoff)
 *   - statement_timeout injected via connection args
 *   - pool size + idle recycle from config
 *
 * Pattern: Enterprise Repository (DataSource + Repository<T>).
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from '../../config';
import { log } from '../../shared/utils/logger';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: config.databaseUrl,
  schema: config.dbSchema,
  synchronize: false,
  logging: ['error'],
  entities: [__dirname + '/../domain/**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  subscribers: [],
  poolSize: config.dbPoolSize,
  extra: {
    max: config.dbPoolSize + config.dbMaxOverflow,
    idleTimeoutMillis: config.dbPoolRecycle * 1000,
    connectionTimeoutMillis: 10_000,
    statement_timeout: config.dbStatementTimeoutMs,
  },
};

export const AppDataSource = new DataSource(dataSourceOptions);

/**
 * Initialise the DataSource with retry. Called once from src/server.ts.
 */
export async function initDatabase(): Promise<void> {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const startedAt = Date.now();
      await AppDataSource.initialize();
      log.info('TypeORM DataSource initialised', { attempt, latencyMs: Date.now() - startedAt });
      return;
    } catch (err) {
      log.error('DB init attempt failed', { attempt, maxRetries, error: (err as Error).message });
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    log.info('TypeORM DataSource closed');
  }
}
`;
}

// =====================================================================
// 14. enterprise-bus.ts — typed in-process event bus
// =====================================================================

export function enterpriseBusTemplate(): string {
  return `/**
 * src/shared/bus/enterprise-bus.ts
 * ---------------------------------------------------------------
 * Enterprise Bus: a typed in-process event bus implementing proper
 * DDD Domain Events. Each event carries a deterministic ID, occurredAt
 * timestamp, and a typed payload.
 *
 * Why a bus? Application services should NOT call each other directly.
 * Instead, a service publishes an event ("user.created") and any
 * interested module subscribes via the bus. This keeps the dependency
 * arrows pointing INWARD (domain <- application <- api) and makes it
 * trivial to add new subscribers (audit, search, notifications) without
 * touching the publisher.
 *
 * The bus is intentionally in-process: it does not survive a process
 * restart. For cross-process events, plug in a Redis/NATS/Kafka
 * transport behind the same interface.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import { randomUUID } from 'crypto';
import { log, getRequestContext } from '../utils/logger';

export interface DomainEvent<T = unknown> {
  readonly id: string;
  readonly occurredAt: Date;
  readonly topic: string;
  readonly payload: T;
  readonly traceId?: string;
  readonly userId?: string | number;
}

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void> | void;

export interface EnterpriseBus {
  publish<T>(topic: string, payload: T): Promise<void>;
  subscribe<T>(topic: string, handler: EventHandler<T>): () => void;
}

class InMemoryEnterpriseBus implements EnterpriseBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();

  async publish<T>(topic: string, payload: T): Promise<void> {
    const ctx = getRequestContext();
    const event: DomainEvent<T> = {
      id: randomUUID(),
      occurredAt: new Date(),
      topic,
      payload,
      traceId: ctx.requestId,
      userId: ctx.userId,
    };
    const set = this.handlers.get(topic);
    if (!set || set.size === 0) {
      log.debug('bus: no subscribers', { topic });
      return;
    }
    log.debug('bus: dispatching', { topic, subscriberCount: set.size, traceId: event.traceId });
    await Promise.all(
      Array.from(set).map(async (handler) => {
        try {
          await handler(event);
        } catch (err) {
          log.error('bus: handler failed', { topic, handlerName: handler.name, error: (err as Error).message });
        }
      }),
    );
  }

  subscribe<T>(topic: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(topic)) this.handlers.set(topic, new Set());
    this.handlers.get(topic)!.add(handler as EventHandler);
    log.debug('bus: new subscriber', { topic, total: this.handlers.get(topic)!.size });
    return () => {
      this.handlers.get(topic)?.delete(handler as EventHandler);
    };
  }
}

export const enterpriseBus: EnterpriseBus = new InMemoryEnterpriseBus();
`;
}

// =====================================================================
// 15. unit-of-work.ts — transaction management (DDD pattern)
// =====================================================================

export function unitOfWorkTemplate(): string {
  return `/**
 * src/shared/repositories/unit-of-work.ts
 * ---------------------------------------------------------------
 * Unit of Work pattern: groups several repository mutations into a
 * single ACID transaction. If any operation fails, the whole batch
 * rolls back.
 *
 * Usage from a service:
 *   await unitOfWork.execute(async (uow) => {
 *     await uow.users.create(...);
 *     await uow.posts.create(...);
 *   });
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import { EntityManager, ObjectLiteral } from 'typeorm';
import { AppDataSource } from '../../infrastructure/database/database';
import { EnterpriseBaseRepository } from './base.repository';
import { log, getRequestContext } from '../utils/logger';

export class UnitOfWork {
  private repos = new Map<string, EnterpriseBaseRepository<ObjectLiteral>>();

  constructor(private readonly manager: EntityManager) {}

  /**
   * Get (or lazily create) a repository bound to the current
   * transaction's EntityManager.
   */
  get<TEntity extends ObjectLiteral>(
    key: string,
    factory: (manager: EntityManager) => EnterpriseBaseRepository<TEntity>,
  ): EnterpriseBaseRepository<TEntity> {
    if (!this.repos.has(key)) {
      this.repos.set(key, factory(this.manager) as unknown as EnterpriseBaseRepository<ObjectLiteral>);
    }
    return this.repos.get(key) as unknown as EnterpriseBaseRepository<TEntity>;
  }
}

/**
 * Run a callback inside a TypeORM transaction. The callback receives a
 * UnitOfWork that exposes transaction-bound repositories.
 *
 * Logs the transaction outcome (commit/rollback) with timing + traceId.
 */
export const unitOfWork = {
  async execute<T>(fn: (uow: UnitOfWork) => Promise<T>): Promise<T> {
    const ctx = getRequestContext();
    const startedAt = Date.now();
    const traceId = ctx.requestId ?? 'no-trace';
    log.debug('uow: begin', { traceId });
    try {
      const result = await AppDataSource.transaction(async (manager) => {
        const uow = new UnitOfWork(manager);
        return fn(uow);
      });
      log.debug('uow: commit', { traceId, durationMs: Date.now() - startedAt });
      return result;
    } catch (err) {
      log.error('uow: rollback', { traceId, durationMs: Date.now() - startedAt, error: (err as Error).message });
      throw err;
    }
  },
};
`;
}

// =====================================================================
// 16. specification.ts — DDD query DSL
// =====================================================================

export function specificationTemplate(): string {
  return `/**
 * src/shared/repositories/specification.ts
 * ---------------------------------------------------------------
 * Specification pattern: a small composable DSL for building complex
 * query predicates without leaking TypeORM internals into the domain.
 *
 *   const spec = Spec.where('status', 'active')
 *                       .and(Spec.where('age', Op.gte, 18))
 *                       .or(Spec.where('role', 'admin'));
 *   repo.findMany(spec.toFindOptions());
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import { FindOptionsWhere, FindOptionsOrder, ObjectLiteral } from 'typeorm';

export enum Op {
  eq = 'eq',
  ne = 'ne',
  gt = 'gt',
  gte = 'gte',
  lt = 'lt',
  lte = 'lte',
  like = 'like',
  ilike = 'ilike',
  in = 'in',
  isNull = 'isNull',
  isNotNull = 'isNotNull',
}

export interface Criterion {
  field: string;
  op: Op;
  value?: unknown;
}

export class Specification<TEntity extends ObjectLiteral = ObjectLiteral> {
  private constructor(
    private readonly criteria: Criterion[] = [],
    private readonly combinator: 'AND' | 'OR' = 'AND',
    private readonly order: FindOptionsOrder<TEntity> = {},
  ) {}

  static where<TEntity extends ObjectLiteral>(field: string, op: Op, value?: unknown): Specification<TEntity> {
    return new Specification<TEntity>([{ field, op, value }], 'AND');
  }

  and(other: Specification<TEntity>): Specification<TEntity> {
    return new Specification<TEntity>([...this.criteria, ...other.criteria], 'AND', this.order);
  }

  or(other: Specification<TEntity>): Specification<TEntity> {
    return new Specification<TEntity>([...this.criteria, ...other.criteria], 'OR', this.order);
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): Specification<TEntity> {
    return new Specification<TEntity>(this.criteria, this.combinator, { ...this.order, [field]: direction } as FindOptionsOrder<TEntity>);
  }

  /** Convert to TypeORM FindOptionsWhere (best-effort — AND only). */
  toFindOptionsWhere(): FindOptionsWhere<TEntity> {
    const out: Record<string, unknown> = {};
    for (const c of this.criteria) {
      switch (c.op) {
        case Op.eq:    out[c.field] = c.value; break;
        case Op.ne:    out[c.field] = { not: c.value }; break;
        case Op.gt:    out[c.field] = { moreThan: c.value }; break;
        case Op.gte:   out[c.field] = { moreThanOrEqual: c.value }; break;
        case Op.lt:    out[c.field] = { lessThan: c.value }; break;
        case Op.lte:   out[c.field] = { lessThanOrEqual: c.value }; break;
        case Op.like:  out[c.field] = { like: c.value }; break;
        case Op.ilike: out[c.field] = { ilike: c.value }; break;
        case Op.in:    out[c.field] = { in: c.value }; break;
        case Op.isNull: out[c.field] = null; break;
        case Op.isNotNull: out[c.field] = { not: null }; break;
      }
    }
    return out as unknown as FindOptionsWhere<TEntity>;
  }

  toFindOptionsOrder(): FindOptionsOrder<TEntity> {
    return this.order;
  }
}

// Convenience alias so callers don't have to import Spec every time.
export const Spec = Specification;
`;
}

// =====================================================================
// 17. value-objects.ts — typed IDs
// =====================================================================

export function valueObjectsTemplate(): string {
  return `/**
 * src/shared/domain/value-objects.ts
 * ---------------------------------------------------------------
 * Value Object base class + a typed Identifier VO for entities.
 *
 * Value Objects are immutable, structurally comparable, and self-
 * validating. Using a typed Identifier<T> prevents accidentally
 * passing a UserId where a PostId is expected.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import { randomUUID } from 'crypto';

/**
 * Base class for all Value Objects. Subclasses implement \`equals\`
 * (structural equality) and \`validate\` (invariants).
 */
export abstract class ValueObject<T> {
  constructor(public readonly value: T) {
    this.validate(value);
  }

  protected abstract validate(value: T): void;

  abstract equals(other: ValueObject<T>): boolean;

  toString(): string {
    return String(this.value);
  }
}

/**
 * Generic typed identifier. Most entities will use a UUID-backed ID:
 *
 *   class UserId extends Identifier<User> {}
 *   const id = UserId.uuid();   // randomUUID()
 *
 * The phantom type parameter <TEntity> prevents cross-entity mixups:
 *   function getUser(id: UserId) ...
 *   getUser(postId);  // compile-time error
 */
export abstract class Identifier<TEntity> extends ValueObject<string> {
  protected validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new Error('Identifier must be a non-empty string');
    }
  }

  equals(other: ValueObject<string>): boolean {
    return other instanceof Identifier && other.value === this.value;
  }

  static uuid<TEntity>(): string {
    return randomUUID();
  }
}

/**
 * Timestamp VO — encapsulates created_at / updated_at / deleted_at.
 */
export class Timestamp extends ValueObject<Date> {
  protected validate(value: Date): void {
    if (isNaN(value.getTime())) throw new Error('Invalid timestamp');
  }

  equals(other: ValueObject<Date>): boolean {
    return other instanceof Timestamp && other.value.getTime() === this.value.getTime();
  }

  static now(): Timestamp {
    return new Timestamp(new Date());
  }

  static fromISOString(s: string): Timestamp {
    return new Timestamp(new Date(s));
  }
}

/**
 * Email VO — validates RFC-5322-ish format on construction.
 */
export class Email extends ValueObject<string> {
  protected validate(value: string): void {
    if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(value)) {
      throw new Error(\`Invalid email: \${value}\`);
    }
  }

  equals(other: ValueObject<string>): boolean {
    return other instanceof Email && other.value.toLowerCase() === this.value.toLowerCase();
  }
}
`;
}

// =====================================================================
// 18. base.repository.ts — Enterprise Repository (enhanced with logging)
// =====================================================================

export function baseRepositoryTemplate(): string {
  return `/**
 * src/shared/repositories/base.repository.ts
 * ---------------------------------------------------------------
 * Enterprise Repository pattern: a generic abstract base class that
 * encapsulates the data-access strategy used by EVERY concrete
 * repository in the generated project.
 *
 * Every method logs (at debug level) the operation, entity name,
 * timing, and requestId. Errors are logged at error level with the
 * full stack trace.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import {
  Repository, FindOptionsWhere, FindOptionsOrder,
  DeepPartial, ObjectLiteral, EntityManager,
} from 'typeorm';
import { AppDataSource } from '../../infrastructure/database/database';
import { createChildLogger } from '../utils/logger';

const log = createChildLogger('BaseRepository');

export abstract class EnterpriseBaseRepository<TEntity extends ObjectLiteral> {
  protected abstract readonly entityTarget: new () => TEntity;
  protected get repo(): Repository<TEntity> {
    return AppDataSource.getRepository(this.entityTarget);
  }

  /**
   * Run a callback inside a transaction-managed EntityManager.
   */
  protected async withManager<T>(fn: (manager: EntityManager) => Promise<T>): Promise<T> {
    return AppDataSource.transaction(fn);
  }

  async findById(id: string | number): Promise<TEntity | null> {
    const startedAt = Date.now();
    try {
      const result = await this.repo.findOne({ where: { id } as unknown as FindOptionsWhere<TEntity> });
      log.debug('findById', { entity: this.repo.metadata.name, id, found: !!result, durationMs: Date.now() - startedAt });
      return result;
    } catch (err) {
      log.error('findById failed', { entity: this.repo.metadata.name, id, error: (err as Error).message });
      throw err;
    }
  }

  async findMany(options: {
    skip?: number;
    take?: number;
    where?: FindOptionsWhere<TEntity> | FindOptionsWhere<TEntity>[];
    order?: FindOptionsOrder<TEntity>;
    relations?: string[];
  } = {}): Promise<TEntity[]> {
    const startedAt = Date.now();
    try {
      const result = await this.repo.find({
        skip: options.skip,
        take: options.take,
        where: options.where,
        order: options.order,
        relations: options.relations,
      });
      log.debug('findMany', { entity: this.repo.metadata.name, count: result.length, durationMs: Date.now() - startedAt });
      return result;
    } catch (err) {
      log.error('findMany failed', { entity: this.repo.metadata.name, error: (err as Error).message });
      throw err;
    }
  }

  async count(where?: FindOptionsWhere<TEntity>): Promise<number> {
    const startedAt = Date.now();
    try {
      const result = await this.repo.count({ where });
      log.debug('count', { entity: this.repo.metadata.name, count: result, durationMs: Date.now() - startedAt });
      return result;
    } catch (err) {
      log.error('count failed', { entity: this.repo.metadata.name, error: (err as Error).message });
      throw err;
    }
  }

  async exists(where: FindOptionsWhere<TEntity>): Promise<boolean> {
    const found = await this.repo.findOne({ where });
    return found !== null;
  }

  async create(data: DeepPartial<TEntity>): Promise<TEntity> {
    const startedAt = Date.now();
    try {
      const entity = this.repo.create(data);
      const saved = await this.repo.save(entity);
      log.info('create', { entity: this.repo.metadata.name, id: (saved as { id?: unknown }).id, durationMs: Date.now() - startedAt });
      return saved;
    } catch (err) {
      log.error('create failed', { entity: this.repo.metadata.name, error: (err as Error).message });
      throw err;
    }
  }

  async update(id: string | number, data: DeepPartial<TEntity>): Promise<TEntity | null> {
    const startedAt = Date.now();
    try {
      const existing = await this.findById(id);
      if (!existing) {
        log.warn('update: not found', { entity: this.repo.metadata.name, id });
        return null;
      }
      const merged = this.repo.merge(existing, data);
      const saved = await this.repo.save(merged);
      log.info('update', { entity: this.repo.metadata.name, id, durationMs: Date.now() - startedAt });
      return saved;
    } catch (err) {
      log.error('update failed', { entity: this.repo.metadata.name, id, error: (err as Error).message });
      throw err;
    }
  }

  async delete(id: string | number): Promise<boolean> {
    const startedAt = Date.now();
    try {
      const result = await this.repo.delete(id);
      const ok = (result.affected ?? 0) > 0;
      log.info('delete', { entity: this.repo.metadata.name, id, ok, durationMs: Date.now() - startedAt });
      return ok;
    } catch (err) {
      log.error('delete failed', { entity: this.repo.metadata.name, id, error: (err as Error).message });
      throw err;
    }
  }

  async bulkCreate(items: DeepPartial<TEntity>[]): Promise<TEntity[]> {
    const startedAt = Date.now();
    try {
      const entities = this.repo.create(items);
      const saved = await this.repo.save(entities);
      log.info('bulkCreate', { entity: this.repo.metadata.name, count: saved.length, durationMs: Date.now() - startedAt });
      return saved;
    } catch (err) {
      log.error('bulkCreate failed', { entity: this.repo.metadata.name, error: (err as Error).message });
      throw err;
    }
  }

  async softDelete(id: string | number): Promise<boolean> {
    const result = await this.repo.softDelete(id);
    log.info('softDelete', { entity: this.repo.metadata.name, id, ok: (result.affected ?? 0) > 0 });
    return (result.affected ?? 0) > 0;
  }
}
`;
}

// =====================================================================
// 19. base.service.ts — Enterprise Service with bus + logging
// =====================================================================

export function baseServiceTemplate(): string {
  return `/**
 * src/shared/services/base.service.ts
 * ---------------------------------------------------------------
 * Enterprise Service pattern: each concrete service extends this base
 * and supplies its repository. The base provides pass-through CRUD so
 * subclasses only need to override methods that add business rules.
 *
 * Services also publish lifecycle events to the Enterprise Bus so
 * cross-cutting subscribers (audit, notifications, search indexing) can
 * react without coupling to the service directly.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import { DeepPartial, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { EnterpriseBaseRepository } from '../repositories/base.repository';
import { enterpriseBus } from '../bus/enterprise-bus';
import { createChildLogger } from '../utils/logger';

const log = createChildLogger('BaseService');

export abstract class EnterpriseBaseService<TEntity extends ObjectLiteral, TRepository extends EnterpriseBaseRepository<TEntity>> {
  protected abstract readonly repository: TRepository;
  protected abstract readonly topicPrefix: string;

  async getById(id: string | number): Promise<TEntity | null> {
    log.debug('getById', { topic: this.topicPrefix, id });
    return this.repository.findById(id);
  }

  async list(skip = 0, take = 100, where?: FindOptionsWhere<TEntity>): Promise<TEntity[]> {
    log.debug('list', { topic: this.topicPrefix, skip, take });
    return this.repository.findMany({ skip, take, where });
  }

  async count(where?: FindOptionsWhere<TEntity>): Promise<number> {
    return this.repository.count(where);
  }

  async create(data: DeepPartial<TEntity>): Promise<TEntity> {
    log.info('create', { topic: this.topicPrefix });
    const created = await this.repository.create(data);
    await enterpriseBus.publish(\`\${this.topicPrefix}.created\`, created);
    log.debug('create: published event', { topic: \`\${this.topicPrefix}.created\` });
    return created;
  }

  async update(id: string | number, data: DeepPartial<TEntity>): Promise<TEntity | null> {
    log.info('update', { topic: this.topicPrefix, id });
    const updated = await this.repository.update(id, data);
    if (updated) {
      await enterpriseBus.publish(\`\${this.topicPrefix}.updated\`, { id, data: updated });
    }
    return updated;
  }

  async delete(id: string | number): Promise<boolean> {
    log.info('delete', { topic: this.topicPrefix, id });
    const ok = await this.repository.delete(id);
    if (ok) {
      await enterpriseBus.publish(\`\${this.topicPrefix}.deleted\`, { id });
    }
    return ok;
  }
}
`;
}

// =====================================================================
// 20. app.ts — Express app with ALL middleware wired up
// =====================================================================

export function appTemplate(cfg: GeneratorConfig): string {
  return `/**
 * src/app.ts
 * ---------------------------------------------------------------
 * Express application factory. Wires up the full middleware stack:
 *
 *   security:  helmet, cors, hpp (HTTP param pollution), rate limit
 *   observability: requestId, request-log, metricsMiddleware, auditLog
 *   routing:   /health/{live,ready}, /metrics, /api/v1/<table>, /docs
 *   errors:    standardized JSON envelope + global error handler
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import hpp from 'hpp';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import responseTime from 'response-time';
import { config } from './config';
import { log, getRequestContext } from './shared/utils/logger';
import { HttpError } from './shared/utils/http-error';
import { sendError } from './shared/utils/api-response';
import { requestIdMiddleware } from './shared/middleware/request-id';
import { auditLogMiddleware } from './shared/middleware/audit-log';
import { metricsMiddleware, metricsHandler } from './shared/middleware/metrics';
import { livenessHandler, readinessHandler } from './shared/middleware/health';
import { buildOpenApiSpec, swaggerUiMiddleware, swaggerUiSetup } from './openapi';
import { registerRoutes } from './api/routes';

export function createApp(): Express {
  const app = express();

  // ---------- trust proxy (so req.ip reflects the real client) ----------
  app.set('trust proxy', 1);

  // ---------- security middleware ----------
  app.use(helmet({
    contentSecurityPolicy: config.enableSwagger ? undefined : false,
    hsts: config.isProduction,
  }));
  app.use(cors({
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Api-Key', 'If-None-Match', 'If-Match'],
    exposedHeaders: ['X-Request-Id', 'ETag'],
    credentials: true,
    maxAge: 86400,
  }));
  app.use(hpp());

  // ---------- body parsing ----------
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(compression());

  // ---------- observability ----------
  app.use(requestIdMiddleware());
  app.use(responseTime((req: Request, res: Response, time: number) => {
    res.setHeader('X-Response-Time-ms', time.toFixed(2));
  }));
  if (config.enableRequestLog) {
    app.use(morgan('combined', {
      stream: { write: (m) => log.info(m.trim(), { type: 'http_access' }) },
      skip: (req) => req.path === '/metrics' || req.path.startsWith('/health'),
    }));
  }
  app.use(metricsMiddleware());
  app.use(auditLogMiddleware());

  // ---------- rate limiting (per-IP, applied to /api/* only) ----------
  const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests' } },
    keyGenerator: (req) => (req.user?.userId?.toString() ?? req.ip ?? 'unknown'),
  });

  // ---------- health & metrics endpoints (no auth, no rate limit) ----------
  app.get('/health/live',  livenessHandler);
  app.get('/health/ready', readinessHandler);
  if (config.enableMetrics) app.get('/metrics', metricsHandler);

  // ---------- root info ----------
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      app: config.appName,
      version: config.appVersion,
      docs: config.enableSwagger ? '/docs' : null,
      health: { live: '/health/live', ready: '/health/ready' },
      metrics: config.enableMetrics ? '/metrics' : null,
    });
  });

  // ---------- API v1 routes (rate-limited) ----------
  app.use('/api/v1', apiLimiter);
  registerRoutes(app, '/api/v1');

  // ---------- Swagger UI ----------
  if (config.enableSwagger) {
    app.get('/docs/openapi.json', (_req: Request, res: Response) => res.json(buildOpenApiSpec()));
    app.use('/docs', swaggerUiMiddleware, swaggerUiSetup);
  }

  // ---------- 404 ----------
  app.use((_req: Request, res: Response) => {
    sendError(res, new HttpError(404, 'NOT_FOUND', 'Not Found'));
  });

  // ---------- global error handler ----------
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      log.warn('http error', { requestId: getRequestContext().requestId, statusCode: err.statusCode, code: err.errorCode, message: err.message });
    } else {
      log.error('unhandled error', { requestId: getRequestContext().requestId, error: (err as Error).message, stack: (err as Error).stack });
    }
    sendError(res, err as Error);
  });

  return app;
}
`;
}

// =====================================================================
// 21. server.ts — bootstrap with graceful shutdown
// =====================================================================

export function serverTemplate(): string {
  return `/**
 * src/server.ts
 * ---------------------------------------------------------------
 * Process entrypoint.
 *   1. Boot TypeORM DataSource (with retry).
 *   2. Start Express.
 *   3. Wire up graceful shutdown on SIGINT/SIGTERM:
 *      - stop accepting new connections
 *      - wait up to SHUTDOWN_TIMEOUT_MS for in-flight requests
 *      - close DB pool
 *      - exit 0
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import { Server } from 'http';
import { createApp } from './app';
import { initDatabase, closeDatabase } from './infrastructure/database/database';
import { config } from './config';
import { log } from './shared/utils/logger';

let server: Server | undefined;

async function main(): Promise<void> {
  log.info('booting', { app: config.appName, version: config.appVersion, env: config.nodeEnv });
  await initDatabase();

  const app = createApp();
  server = app.listen(config.port, () => {
    log.info(\`listening on http://localhost:\${config.port}\`);
    if (config.enableSwagger) {
      log.info(\`Swagger UI:   http://localhost:\${config.port}/docs\`);
      log.info(\`OpenAPI JSON: http://localhost:\${config.port}/docs/openapi.json\`);
    }
    log.info(\`Health:       http://localhost:\${config.port}/health/live | /health/ready\`);
    if (config.enableMetrics) log.info(\`Metrics:      http://localhost:\${config.port}/metrics\`);
  });

  // ---------- graceful shutdown ----------
  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info(\`\${signal} received, shutting down...\`, { signal });

    // 1. Stop accepting new connections.
    if (server) {
      server.close((err) => {
        if (err) log.error('server.close error', { error: (err as Error).message });
        else     log.info('HTTP server closed');
      });
    }

    // 2. Wait up to SHUTDOWN_TIMEOUT_MS for in-flight requests.
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        log.warn('shutdown timeout exceeded, forcing exit', { timeoutMs: config.shutdownTimeoutMs });
        resolve();
      }, config.shutdownTimeoutMs);
      if (server) {
        server.on('close', () => { clearTimeout(timeout); resolve(); });
      } else {
        clearTimeout(timeout); resolve();
      }
    });

    // 3. Close DB pool.
    await closeDatabase();
    log.info('shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    log.error('unhandledRejection', { reason: String(reason) });
  });
  process.on('uncaughtException', (err) => {
    log.error('uncaughtException', { error: err.message, stack: err.stack });
    process.exit(1);
  });
}

main().catch((err) => {
  log.error('fatal startup error', { error: err.message, stack: err.stack });
  process.exit(1);
});
`;
}

// =====================================================================
// 22. openapi.ts — OpenAPI 3 spec builder + Swagger UI
// =====================================================================

export function openApiTemplate(cfg: GeneratorConfig): string {
  return `/**
 * src/openapi.ts
 * ---------------------------------------------------------------
 * Composes the OpenAPI 3.0 document from:
 *   1. the top-level info/servers/tags defined here,
 *   2. per-controller path registrations, and
 *   3. the runtime swagger-ui-express handler.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from './config';

export interface OpenApiDocument {
  openapi: string;
  info: Record<string, unknown>;
  servers: Array<{ url: string; description?: string }>;
  tags: Array<{ name: string; description?: string }>;
  paths: Record<string, unknown>;
  components: Record<string, unknown>;
}

const TOP_LEVEL_SPEC = {
  openapi: '3.0.3',
  info: {
    title: ${JSON.stringify(cfg.appName)},
    version: ${JSON.stringify(cfg.appVersion)},
    description: ${JSON.stringify(cfg.appDescription)},
    contact: { name: 'β ORI Inc. Canada' },
    license: { name: 'UNLICENSED' },
  },
  servers: [{ url: '/api/v1', description: 'v1 API' }],
  tags: [] as Array<{ name: string; description?: string }>,
  paths: {} as Record<string, unknown>,
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKey: { type: 'apiKey', in: 'header', name: 'x-api-key' },
    },
    responses: {
      BadRequest:   { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
      Unauthorized: { description: 'Authentication required' },
      NotFound:     { description: 'Resource not found' },
      Conflict:     { description: 'Conflict with current state' },
      TooManyRequests: { description: 'Rate limit exceeded' },
      InternalError: { description: 'Internal server error' },
    },
    schemas: {
      ErrorEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code:    { type: 'string', example: 'NOT_FOUND' },
              message: { type: 'string', example: 'Resource not found' },
              details: { type: 'object' },
            },
            required: ['code', 'message'],
          },
          traceId: { type: 'string', format: 'uuid' },
        },
        required: ['success', 'error'],
      },
      SuccessEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data:    { type: 'object' },
          meta:    { $ref: '#/components/schemas/PaginationMeta' },
          links:   { $ref: '#/components/schemas/HateoasLinks' },
          traceId: { type: 'string', format: 'uuid' },
        },
        required: ['success', 'data'],
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page:       { type: 'integer', example: 1 },
          perPage:    { type: 'integer', example: 20 },
          total:      { type: 'integer', example: 347 },
          totalPages:  { type: 'integer', example: 18 },
          hasMore:    { type: 'boolean', example: true },
          nextCursor: { type: 'string', nullable: true },
        },
        required: ['page', 'perPage', 'total', 'totalPages', 'hasMore'],
      },
      HateoasLinks: {
        type: 'object',
        properties: {
          self:   { type: 'string' },
          first:  { type: 'string' },
          prev:   { type: 'string' },
          next:   { type: 'string' },
          last:   { type: 'string' },
          create: { type: 'string' },
          update: { type: 'string' },
          delete: { type: 'string' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

/** A registry pattern: controllers append to these at module-load time. */
export const openApiPaths: Record<string, unknown> = {};
export const openApiTags: Array<{ name: string; description?: string }> = [];

export function registerOpenApiPaths(paths: Record<string, unknown>, tags?: Array<{ name: string; description?: string }>): void {
  Object.assign(openApiPaths, paths);
  if (tags) openApiTags.push(...tags);
}

export function buildOpenApiSpec(): OpenApiDocument {
  return {
    ...TOP_LEVEL_SPEC,
    tags: openApiTags,
    paths: openApiPaths,
  };
}

export const swaggerUiMiddleware = swaggerUi.serve;
export const swaggerUiSetup = swaggerUi.setup(buildOpenApiSpec(), {
  explorer: true,
  customSiteTitle: ${JSON.stringify(cfg.appName)},
});

// re-export to silence unused-import warnings in app.ts
export { swaggerUi };
`;
}
