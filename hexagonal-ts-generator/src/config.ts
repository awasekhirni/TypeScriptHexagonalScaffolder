/**
 * * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 * src/config.ts
 * -------------------------------------------------------------------
 * Loads .env, parses DATABASE_URL into individual fields needed by
 * `pg`, and exposes a strongly-typed `config` object the rest of the
 * generator consumes.
 *
 
 */

import dotenv from 'dotenv';
import path from 'path';
import { GeneratorConfig } from './types';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface ParsedUrl {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
  schema: string;
}

/**
 * Parses a `postgresql://user:password@host:port/database` URL.
 * Throws a helpful error if the URL is malformed so the user can fix
 * their `.env` instead of getting a cryptic pg error.
 */
export function parsePostgresUrl(url: string): ParsedUrl {
  const match = url.match(/^postgresql(?:\+psycopg2)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (!match) {
    throw new Error(
      `Invalid DATABASE_URL: "${url}". Expected postgresql://user:password@host:port/database`,
    );
  }
  const [, user, password, host, portStr, database] = match;
  return {
    user,
    password,
    host,
    port: parseInt(portStr, 10),
    database,
    schema: process.env.DB_SCHEMA ?? 'public',
  };
}

export const config: GeneratorConfig = {
  databaseUrl: process.env.DATABASE_URL ?? '',
  projectDir: path.resolve(process.env.PROJECT_DIR ?? './project'),
  appName: process.env.APP_NAME ?? 'Hexagonal Architecture API',
  appVersion: process.env.APP_VERSION ?? '1.0.0',
  appDescription:
    process.env.APP_DESCRIPTION ??
    'REST API built with Hexagonal Architecture, Enterprise Bus, and Enterprise Repository patterns.',
  debug: (process.env.DEBUG ?? 'false').toLowerCase() === 'true',
  dbPoolSize: parseInt(process.env.DB_POOL_SIZE ?? '10', 10),
  dbMaxOverflow: parseInt(process.env.DB_MAX_OVERFLOW ?? '20', 10),
  dbPoolRecycle: parseInt(process.env.DB_POOL_RECYCLE ?? '1800', 10),
};

export const parsedUrl = parsePostgresUrl(config.databaseUrl);
