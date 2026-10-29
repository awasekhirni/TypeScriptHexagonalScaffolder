/**
 * * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 * src/utils/logger.ts
 * -------------------------------------------------------------------
 * Thin winston-backed logger used by the generator.
 * The generated REST API ships its own logger (see
 * `generators/shared-templates.ts` -> `logger.template`).
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}] ${stack ?? message}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat,
  ),
  transports: [new winston.transports.Console()],
});
