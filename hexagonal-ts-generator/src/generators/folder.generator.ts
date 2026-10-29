/**
 * * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 * src/generators/folder.generator.ts
 * -------------------------------------------------------------------
 * Mirrors `create_folders_and_files()` from the Python original.
 *
 * Creates the standard hexagonal-architecture directory tree under
 * PROJECT_DIR and writes an empty `index.ts` barrel file in each
 * directory so TypeScript path resolution is uniform.
 *
 * Layout:
 *
 *   project/
 *   ├── api/
 *   │   ├── controllers/
 *   │   ├── dtos/
 *   │   ├── mappers/
 *   │   ├── validations/
 *   │   └── routes.ts
 *   ├── domain/
 *   │   └── <table>/
 *   │       ├── <table>.entity.ts
 *   │       ├── <table>.repository.interface.ts
 *   │       └── <table>.service.interface.ts
 *   ├── infrastructure/
 *   │   ├── database/
 *   │   └── repositories/<table>/
 *   ├── application/services/<table>/
 *   ├── shared/
 *   │   ├── bus/
 *   │   ├── repositories/
 *   │   ├── services/
 *   │   └── utils/
 *   ├── config/
 *   └── tests/
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */

import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Directories that will always exist in the generated project.
 * Per-table subdirectories (domain/<table>/, infrastructure/repositories/<table>/,
 * application/services/<table>/, application/cqrs/<table>/) are created on
 * demand by the table generators themselves.
 */
export const BASE_FOLDER_STRUCTURE: string[] = [
  'api/controllers',
  'api/dtos',
  'api/mappers',
  'api/validations',
  'api/sito',
  'api',
  'application/cqrs',
  'application/services',
  'application',
  'domain',
  'infrastructure/database/migrations',
  'infrastructure/database',
  'infrastructure/repositories',
  'infrastructure',
  'shared/bus',
  'shared/cqrs',
  'shared/domain/events',
  'shared/domain/value-objects',
  'shared/domain',
  'shared/health',
  'shared/metrics',
  'shared/middleware',
  'shared/repositories',
  'shared/services',
  'shared/tracing',
  'shared/utils',
  'shared',
  'config',
  'scripts',
  'tests/unit',
  'tests/integration',
  'tests/e2e',
  'tests/helpers',
  'tests',
];

/**
 * Recursively create every directory in BASE_FOLDER_STRUCTURE and drop
 * an `index.ts` barrel file in each one. Existing files are NOT
 * overwritten so re-runs are safe.
 */
export function createFolderStructure(): void {
  const projectDir = path.resolve(config.projectDir);

  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  for (const folder of BASE_FOLDER_STRUCTURE) {
    const folderPath = path.join(projectDir, folder);
    fs.mkdirSync(folderPath, { recursive: true });

    // Drop a barrel file (index.ts) so the folder is treated as a module.
    const barrelPath = path.join(folderPath, 'index.ts');
    if (!fs.existsSync(barrelPath)) {
      const comment = `// ${folder.split('/').pop()} package barrel export\nexport {};\n`;
      fs.writeFileSync(barrelPath, comment, 'utf8');
    }
  }

  logger.info(`Folder structure created under ${projectDir}`);
}

/**
 * Ensures a subdirectory exists under PROJECT_DIR and returns its
 * absolute path. Used by per-table generators when they need to drop
 * files in `domain/<table>/`, `infrastructure/repositories/<table>/`,
 * etc.
 */
export function ensureDir(relativePath: string): string {
  const abs = path.resolve(config.projectDir, relativePath);
  fs.mkdirSync(abs, { recursive: true });
  return abs;
}

/** Write a file, creating parent dirs as needed. Overwrites existing. */
export function writeFile(relativePath: string, contents: string): string {
  const abs = path.resolve(config.projectDir, relativePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, contents, 'utf8');
  return abs;
}

/** Write a file only if it doesn't already exist (used for barrels). */
export function writeFileIfMissing(relativePath: string, contents: string): string | null {
  const abs = path.resolve(config.projectDir, relativePath);
  if (fs.existsSync(abs)) return null;
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, contents, 'utf8');
  return abs;
}
