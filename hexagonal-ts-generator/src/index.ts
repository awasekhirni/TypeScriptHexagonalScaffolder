/**
 *  * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 * src/index.ts
 * -------------------------------------------------------------------
 * Main entrypoint of the TypeScript hexagonal-architecture generator (v2).
 *
 * Produces a world-class REST API with:
 *   - JWT + API-key + RBAC authentication
 *   - Request ID / correlation ID middleware
 *   - Structured JSON logging with per-request context
 *   - Audit log for every mutation
 *   - Prometheus metrics endpoint
 *   - Liveness vs readiness health probes
 *   - Standardized JSON envelope (success + error)
 *   - Cursor + offset pagination with HATEOAS links
 *   - Unit of Work pattern (transactions)
 *   - Specification pattern (query DSL)
 *   - Domain Events + Value Objects (DDD)
 *   - Graceful shutdown with connection drain
 *   - Env validation (fail-fast)
 *   - Dockerfile + docker-compose
 *   - TypeORM migration scripts
 *   - GitHub Actions CI/CD
 *   - ESLint + Prettier config
 *   - Per-table test factories + integration tests
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 */

import path from 'path';
import { config } from './config';
import { logger } from './utils/logger';
import { closeIntrospectionPool, introspectDatabase } from './introspection/database';
import { analyzeTable } from './analyzer/table-analyzer';
import { ensureDir, createFolderStructure, writeFile, writeFileIfMissing } from './generators/folder.generator';
import { generateEntity } from './generators/entity.generator';
import { generateRepositoryInterface } from './generators/repository-interface.generator';
import { generateRepositoryImplementation } from './generators/repository-impl.generator';
import { generateServiceInterface } from './generators/service-interface.generator';
import { generateServiceImplementation } from './generators/service-impl.generator';
import { generateController } from './generators/controller.generator';
import { generateDto, generateValidation } from './generators/dto.generator';
import { generateMapper } from './generators/mapper.generator';
import { generateSito } from './generators/sito.generator';
import { generateRoutesAggregator } from './generators/routes.generator';
import {
  appTemplate, baseRepositoryTemplate, baseServiceTemplate, configTemplate,
  databaseConfigTemplate, enterpriseBusTemplate, envExampleTemplate,
  httpErrorTemplate, loggerTemplate, openApiTemplate, packageJsonTemplate,
  serverTemplate, tsConfigTemplate, apiResponseTemplate, requestIdMiddlewareTemplate,
  authMiddlewareTemplate, auditLogMiddlewareTemplate, metricsMiddlewareTemplate,
  healthCheckTemplate, unitOfWorkTemplate, specificationTemplate, valueObjectsTemplate,
} from './generators/shared-templates';
import {
  dockerfileTemplate, dockerComposeTemplate, dockerignoreTemplate, gitignoreTemplate,
  eslintConfigTemplate, prettierConfigTemplate, jestConfigTemplate, jestIntegrationConfigTemplate,
  ciWorkflowTemplate, createMigrationScriptTemplate, runMigrationsScriptTemplate,
  generateOpenApiScriptTemplate, testSetupTemplate, healthTestTemplate,
  testFactoryTemplate, integrationTestTemplate,
} from './generators/devops-templates';
import { TableMetadata } from './types';

function printBanner(): void {
  logger.info('┌──────────────────────────────────────────────────────────────────────────┐');
  logger.info('│  Hexagonal TS Generator v2 (world-class edition)                          │');
  logger.info('│  β ORI Inc. Canada (c) 2025 — Awase Khirni Syed                            │');
  logger.info('│  Features: JWT+APIkey+RBAC | Metrics | Audit | Bus | UoW | Spec | VO     │');
  logger.info('└──────────────────────────────────────────────────────────────────────────┘');
  logger.info(`Project dir : ${config.projectDir}`);
  logger.info(`Database URL: ${config.databaseUrl.replace(/:[^:@]+@/, ':****@')}`);
  logger.info(`App name    : ${config.appName}`);
  logger.info(`App version : ${config.appVersion}`);
  logger.info(`Debug       : ${config.debug}`);
}

/** Write the cross-cutting, table-independent shared artefacts. */
function writeSharedFiles(): void {
  // ---- root project files ----
  writeFile('package.json', packageJsonTemplate(config));
  writeFile('tsconfig.json', tsConfigTemplate());
  writeFile('.env.example', envExampleTemplate(config));
  writeFile('Dockerfile', dockerfileTemplate());
  writeFile('docker-compose.yml', dockerComposeTemplate());
  writeFile('.dockerignore', dockerignoreTemplate());
  writeFile('.gitignore', gitignoreTemplate());
  writeFile('.eslintrc.json', eslintConfigTemplate());
  writeFile('.prettierrc', prettierConfigTemplate());
  writeFile('jest.config.ts', jestConfigTemplate());
  writeFile('jest.integration.config.js', jestIntegrationConfigTemplate());
  writeFile('.github/workflows/ci.yml', ciWorkflowTemplate());

  // ---- src/config ----
  writeFile('src/config/index.ts', configTemplate(config));

  // ---- src/infrastructure/database ----
  writeFile('src/infrastructure/database/database.ts', databaseConfigTemplate(config));

  // ---- src/shared/utils ----
  writeFile('src/shared/utils/logger.ts', loggerTemplate());
  writeFile('src/shared/utils/http-error.ts', httpErrorTemplate());
  writeFile('src/shared/utils/api-response.ts', apiResponseTemplate());

  // ---- src/shared/bus ----
  writeFile('src/shared/bus/enterprise-bus.ts', enterpriseBusTemplate());
  writeFile('src/shared/bus/index.ts', `export * from './enterprise-bus';\n`);

  // ---- src/shared/middleware ----
  writeFile('src/shared/middleware/request-id.ts', requestIdMiddlewareTemplate());
  writeFile('src/shared/middleware/auth.ts', authMiddlewareTemplate());
  writeFile('src/shared/middleware/audit-log.ts', auditLogMiddlewareTemplate());
  writeFile('src/shared/middleware/metrics.ts', metricsMiddlewareTemplate());
  writeFile('src/shared/middleware/health.ts', healthCheckTemplate());
  writeFile('src/shared/middleware/index.ts', `export * from './request-id';\nexport * from './auth';\nexport * from './audit-log';\nexport * from './metrics';\nexport * from './health';\n`);

  // ---- src/shared/repositories ----
  writeFile('src/shared/repositories/base.repository.ts', baseRepositoryTemplate());
  writeFile('src/shared/repositories/unit-of-work.ts', unitOfWorkTemplate());
  writeFile('src/shared/repositories/specification.ts', specificationTemplate());
  writeFile('src/shared/repositories/index.ts', `export * from './base.repository';\nexport * from './unit-of-work';\nexport * from './specification';\n`);

  // ---- src/shared/services ----
  writeFile('src/shared/services/base.service.ts', baseServiceTemplate());
  writeFile('src/shared/services/index.ts', `export * from './base.service';\n`);

  // ---- src/shared/domain ----
  writeFile('src/shared/domain/value-objects.ts', valueObjectsTemplate());
  writeFile('src/shared/domain/index.ts', `export * from './value-objects';\n`);

  // ---- src/openapi + app + server ----
  writeFile('src/openapi.ts', openApiTemplate(config));
  writeFile('src/app.ts', appTemplate(config));
  writeFile('src/server.ts', serverTemplate());

  // ---- src/scripts ----
  writeFile('src/scripts/create-migration.ts', createMigrationScriptTemplate());
  writeFile('src/scripts/run-migrations.ts', runMigrationsScriptTemplate());
  writeFile('src/scripts/generate-openapi.ts', generateOpenApiScriptTemplate());

  // ---- barrel files ----
  writeFile('src/shared/index.ts', `export * from './bus';\nexport * from './repositories';\nexport * from './services';\nexport * from './utils/logger';\nexport * from './utils/http-error';\nexport * from './utils/api-response';\nexport * from './middleware';\nexport * from './domain';\n`);

  // ---- tests ----
  writeFile('tests/setup.ts', testSetupTemplate());
  writeFile('tests/health.test.ts', healthTestTemplate());
}

/** Write every per-table artefact for one table. */
function writeTableArtifacts(meta: TableMetadata): void {
  const analysis = analyzeTable(meta);
  const tableName = meta.name;

  ensureDir(`src/domain/${tableName}`);
  ensureDir(`src/infrastructure/repositories/${tableName}`);
  ensureDir(`src/application/services/${tableName}`);
  ensureDir(`src/api/sito`);
  ensureDir(`tests/factories`);
  ensureDir(`tests/integration`);

  // Domain layer
  writeFile(`src/domain/${tableName}/${tableName}.entity.ts`, generateEntity(meta));
  writeFile(`src/domain/${tableName}/${tableName}.repository.interface.ts`, generateRepositoryInterface(meta, analysis));
  writeFile(`src/domain/${tableName}/${tableName}.service.interface.ts`, generateServiceInterface(meta, analysis));
  writeFileIfMissing(`src/domain/${tableName}/index.ts`, `export * from './${tableName}.entity';\nexport * from './${tableName}.repository.interface';\nexport * from './${tableName}.service.interface';\n`);

  // Infrastructure layer
  writeFile(`src/infrastructure/repositories/${tableName}/${tableName}.repository.ts`, generateRepositoryImplementation(meta, analysis));
  writeFileIfMissing(`src/infrastructure/repositories/${tableName}/index.ts`, `export * from './${tableName}.repository';\n`);

  // Application layer
  writeFile(`src/application/services/${tableName}/${tableName}.service.ts`, generateServiceImplementation(meta, analysis));
  writeFileIfMissing(`src/application/services/${tableName}/index.ts`, `export * from './${tableName}.service';\n`);

  // API layer
  writeFile(`src/api/controllers/${tableName}.controller.ts`, generateController(meta, analysis));
  writeFile(`src/api/dtos/${tableName}.dto.ts`, generateDto(meta, analysis));
  writeFile(`src/api/validations/${tableName}.validation.ts`, generateValidation(meta, analysis));
  writeFile(`src/api/mappers/${tableName}.mapper.ts`, generateMapper(meta));
  writeFile(`src/api/sito/${tableName}.sito.ts`, generateSito(meta));

  // Test layer
  writeFile(`tests/factories/${tableName}.factory.ts`, testFactoryTemplate(meta));
  writeFile(`tests/integration/${tableName}.integration.test.ts`, integrationTestTemplate(meta));

  logger.info(`✓ ${tableName} (cols=${meta.columns.length}, rel=${meta.relations.length}, status=${analysis.hasStatus}, softDel=${analysis.hasSoftDelete}, user=${analysis.hasUserRelation})`);
}

/** Write the routes aggregator after every table has been emitted. */
function writeRoutesAggregator(metadata: TableMetadata[]): void {
  writeFile('src/api/routes.ts', generateRoutesAggregator(metadata));
  logger.info(`✓ Routes aggregator emitted (${metadata.length} tables wired).`);
}

/** Main orchestrator. */
async function main(): Promise<void> {
  printBanner();

  logger.info('Step 1/6 · Creating project folder structure ...');
  createFolderStructure();

  logger.info('Step 2/6 · Writing shared artefacts (config, db, bus, base repo, app, server, Dockerfile, CI/CD) ...');
  writeSharedFiles();

  logger.info('Step 3/6 · Introspecting PostgreSQL schema ...');
  const metadata = await introspectDatabase();
  logger.info(`  ↳ ${metadata.length} tables discovered.`);

  logger.info('Step 4/6 · Generating per-table artefacts ...');
  for (const meta of metadata) {
    writeTableArtifacts(meta);
  }

  logger.info('Step 5/6 · Writing routes aggregator ...');
  writeRoutesAggregator(metadata);

  logger.info('Step 6/6 · Generation complete.');
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info(`✓ Done. ${metadata.length} tables processed.`);
  logger.info(`  Output directory : ${path.resolve(config.projectDir)}`);
  logger.info('  Run the generated API:');
  logger.info(`    $ cd ${path.resolve(config.projectDir)}`);
  logger.info(`    $ cp .env.example .env  # then edit JWT_SECRET + DATABASE_URL`);
  logger.info(`    $ npm install`);
  logger.info(`    $ npm run dev           # http://localhost:3000`);
  logger.info(`    $ open http://localhost:3000/docs`);
  logger.info(`    $ open http://localhost:3000/health/ready`);
  logger.info(`    $ open http://localhost:3000/metrics`);
  logger.info('═══════════════════════════════════════════════════════════');

  await closeIntrospectionPool();
}

main().catch((err) => {
  logger.error(`Generator failed: ${err.message}`, { stack: err.stack });
  closeIntrospectionPool().finally(() => process.exit(1));
});
