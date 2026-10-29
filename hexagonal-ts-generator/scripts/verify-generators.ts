/**
 * scripts/verify-generators.ts
 * -------------------------------------------------------------------
 * Smoke test for the version 2 generator.
 * Synthesizes fake TableMetadata for two imaginary tables (users,
 * posts) and runs every generator against it. Writes the output under
 * ./sample-output/ so you can inspect what the generator produces
 * WITHOUT a live database.
 *
 * Run with:
 *   $ npx ts-node scripts/verify-generators.ts
 */

import path from 'path';
import fs from 'fs';

// Force env vars BEFORE importing config so dotenv picks them up
// regardless of any system-level DATABASE_URL.
process.env.DATABASE_URL = 'postgresql://awasekhirnisyed:YOUR_PASSWORD_HERE@localhost:5432/profxdb';
process.env.PROJECT_DIR = path.resolve(__dirname, '../sample-output');
process.env.APP_NAME = 'Hexagonal Architecture API';
process.env.APP_VERSION = '1.0.0';
process.env.APP_DESCRIPTION = 'REST API built with Hexagonal Architecture, Enterprise Bus, and Enterprise Repository patterns.';
process.env.DEBUG = 'false';

import { config } from '../src/config';
import { TableMetadata } from '../src/types';
import { analyzeTable } from '../src/analyzer/table-analyzer';
import { generateEntity } from '../src/generators/entity.generator';
import { generateRepositoryInterface } from '../src/generators/repository-interface.generator';
import { generateRepositoryImplementation } from '../src/generators/repository-impl.generator';
import { generateServiceInterface } from '../src/generators/service-interface.generator';
import { generateServiceImplementation } from '../src/generators/service-impl.generator';
import { generateController } from '../src/generators/controller.generator';
import { generateDto, generateValidation } from '../src/generators/dto.generator';
import { generateMapper } from '../src/generators/mapper.generator';
import { generateSito } from '../src/generators/sito.generator';
import { generateRoutesAggregator } from '../src/generators/routes.generator';
import {
  appTemplate, baseRepositoryTemplate, baseServiceTemplate, configTemplate,
  databaseConfigTemplate, enterpriseBusTemplate, envExampleTemplate,
  httpErrorTemplate, loggerTemplate, openApiTemplate, packageJsonTemplate,
  serverTemplate, tsConfigTemplate, apiResponseTemplate, requestIdMiddlewareTemplate,
  authMiddlewareTemplate, auditLogMiddlewareTemplate, metricsMiddlewareTemplate,
  healthCheckTemplate, unitOfWorkTemplate, specificationTemplate, valueObjectsTemplate,
} from '../src/generators/shared-templates';
import {
  dockerfileTemplate, dockerComposeTemplate, dockerignoreTemplate, gitignoreTemplate,
  eslintConfigTemplate, prettierConfigTemplate, jestConfigTemplate, jestIntegrationConfigTemplate,
  ciWorkflowTemplate, createMigrationScriptTemplate, runMigrationsScriptTemplate,
  generateOpenApiScriptTemplate, testSetupTemplate, healthTestTemplate,
  testFactoryTemplate, integrationTestTemplate,
} from '../src/generators/devops-templates';

const OUT_DIR = path.resolve(__dirname, '../sample-output');
(config as { projectDir: string }).projectDir = OUT_DIR;

function writeFile(rel: string, contents: string): void {
  const abs = path.resolve(OUT_DIR, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, contents, 'utf8');
  console.log(`  ✓ ${rel} (${contents.length} bytes)`);
}

// ---- Synthesize metadata for two tables ----
const usersTable: TableMetadata = {
  schema: 'public',
  name: 'users',
  columns: [
    { tableSchema: 'public', tableName: 'users', columnName: 'id', ordinalPosition: 1, columnDefault: 'uuid_generate_v4()', isNullable: 'NO', dataType: 'uuid', udtName: 'uuid', characterMaximumLength: null, numericPrecision: null, numericScale: null, isPrimaryKey: true, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: true },
    { tableSchema: 'public', tableName: 'users', columnName: 'email', ordinalPosition: 2, columnDefault: null, isNullable: 'NO', dataType: 'character varying', udtName: 'varchar', characterMaximumLength: 255, numericPrecision: null, numericScale: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: true },
    { tableSchema: 'public', tableName: 'users', columnName: 'full_name', ordinalPosition: 3, columnDefault: null, isNullable: 'NO', dataType: 'character varying', udtName: 'varchar', characterMaximumLength: 100, numericPrecision: null, numericScale: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
    { tableSchema: 'public', tableName: 'users', columnName: 'account_status', ordinalPosition: 4, columnDefault: null, isNullable: 'NO', dataType: 'character varying', udtName: 'varchar', characterMaximumLength: 20, numericPrecision: null, numericScale: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
    { tableSchema: 'public', tableName: 'users', columnName: 'is_deleted', ordinalPosition: 5, columnDefault: 'false', isNullable: 'NO', dataType: 'boolean', udtName: 'bool', characterMaximumLength: null, numericPrecision: null, numericScale: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
    { tableSchema: 'public', tableName: 'users', columnName: 'deleted_at', ordinalPosition: 6, columnDefault: null, isNullable: 'YES', dataType: 'timestamp without time zone', udtName: 'timestamp', characterMaximumLength: null, numericPrecision: null, numericScale: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
    { tableSchema: 'public', tableName: 'users', columnName: 'created_at', ordinalPosition: 7, columnDefault: 'now()', isNullable: 'NO', dataType: 'timestamp without time zone', udtName: 'timestamp', characterMaximumLength: null, numericPrecision: null, numericScale: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
    { tableSchema: 'public', tableName: 'users', columnName: 'updated_at', ordinalPosition: 8, columnDefault: 'now()', isNullable: 'NO', dataType: 'timestamp without time zone', udtName: 'timestamp', characterMaximumLength: null, numericPrecision: null, numericScale: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
  ],
  relations: [
    { constraintName: 'posts_user_id_fkey', tableName: 'posts', columnName: 'user_id', foreignTable: 'users', foreignColumn: 'id', direction: 'ONETOMANY' },
  ],
};

const postsTable: TableMetadata = {
  schema: 'public',
  name: 'posts',
  columns: [
    { tableSchema: 'public', tableName: 'posts', columnName: 'id', ordinalPosition: 1, columnDefault: 'uuid_generate_v4()', isNullable: 'NO', dataType: 'uuid', udtName: 'uuid', characterMaximumLength: null, numericPrecision: null, numericScale: null, isPrimaryKey: true, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: true },
    { tableSchema: 'public', tableName: 'posts', columnName: 'user_id', ordinalPosition: 2, columnDefault: null, isNullable: 'NO', dataType: 'uuid', udtName: 'uuid', characterMaximumLength: null, numericPrecision: null, numericScale: null, isPrimaryKey: false, isForeignKey: true, foreignTable: 'users', foreignColumn: 'id', isUnique: false },
    { tableSchema: 'public', tableName: 'posts', columnName: 'title', ordinalPosition: 3, columnDefault: null, isNullable: 'NO', dataType: 'character varying', udtName: 'varchar', characterMaximumLength: 200, numericPrecision: null, numericScale: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
    { tableSchema: 'public', tableName: 'posts', columnName: 'body', ordinalPosition: 4, columnDefault: null, isNullable: 'YES', dataType: 'text', udtName: 'text', characterMaximumLength: null, numericPrecision: null, numericScale: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
    { tableSchema: 'public', tableName: 'posts', columnName: 'post_status', ordinalPosition: 5, columnDefault: "'draft'", isNullable: 'NO', dataType: 'character varying', udtName: 'varchar', characterMaximumLength: 20, numericPrecision: null, numericScale: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
    { tableSchema: 'public', tableName: 'posts', columnName: 'view_count', ordinalPosition: 6, columnDefault: '0', isNullable: 'NO', dataType: 'integer', udtName: 'int4', characterMaximumLength: null, numericPrecision: 32, numericScale: 0, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
    { tableSchema: 'public', tableName: 'posts', columnName: 'created_at', ordinalPosition: 7, columnDefault: 'now()', isNullable: 'NO', dataType: 'timestamp without time zone', udtName: 'timestamp', characterMaximumLength: null, numericPrecision: null, numericScale: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
    { tableSchema: 'public', tableName: 'posts', columnName: 'updated_at', ordinalPosition: 8, columnDefault: 'now()', isNullable: 'NO', dataType: 'timestamp without time zone', udtName: 'timestamp', characterMaximumLength: null, numericPrecision: null, numericScale: null, isPrimaryKey: false, isForeignKey: false, foreignTable: null, foreignColumn: null, isUnique: false },
  ],
  relations: [
    { constraintName: 'posts_user_id_fkey', tableName: 'posts', columnName: 'user_id', foreignTable: 'users', foreignColumn: 'id', direction: 'MANYTOONE' },
  ],
};

const allTables = [usersTable, postsTable];

console.log('\n=== Hexagonal TS Generator v2 — smoke test ===');
console.log(`Output dir: ${OUT_DIR}\n`);

console.log('· Writing root project files ...');
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

console.log('\n· Writing shared infrastructure files ...');
writeFile('src/config/index.ts', configTemplate(config));
writeFile('src/infrastructure/database/database.ts', databaseConfigTemplate(config));
writeFile('src/shared/utils/logger.ts', loggerTemplate());
writeFile('src/shared/utils/http-error.ts', httpErrorTemplate());
writeFile('src/shared/utils/api-response.ts', apiResponseTemplate());
writeFile('src/shared/bus/enterprise-bus.ts', enterpriseBusTemplate());
writeFile('src/shared/bus/index.ts', `export * from './enterprise-bus';\n`);
writeFile('src/shared/middleware/request-id.ts', requestIdMiddlewareTemplate());
writeFile('src/shared/middleware/auth.ts', authMiddlewareTemplate());
writeFile('src/shared/middleware/audit-log.ts', auditLogMiddlewareTemplate());
writeFile('src/shared/middleware/metrics.ts', metricsMiddlewareTemplate());
writeFile('src/shared/middleware/health.ts', healthCheckTemplate());
writeFile('src/shared/repositories/base.repository.ts', baseRepositoryTemplate());
writeFile('src/shared/repositories/unit-of-work.ts', unitOfWorkTemplate());
writeFile('src/shared/repositories/specification.ts', specificationTemplate());
writeFile('src/shared/services/base.service.ts', baseServiceTemplate());
writeFile('src/shared/domain/value-objects.ts', valueObjectsTemplate());
writeFile('src/openapi.ts', openApiTemplate(config));
writeFile('src/app.ts', appTemplate(config));
writeFile('src/server.ts', serverTemplate());
writeFile('src/scripts/create-migration.ts', createMigrationScriptTemplate());
writeFile('src/scripts/run-migrations.ts', runMigrationsScriptTemplate());
writeFile('src/scripts/generate-openapi.ts', generateOpenApiScriptTemplate());
writeFile('tests/setup.ts', testSetupTemplate());
writeFile('tests/health.test.ts', healthTestTemplate());

for (const meta of allTables) {
  console.log(`\n· Writing per-table artefacts for "${meta.name}" ...`);
  const analysis = analyzeTable(meta);
  console.log(`  analysis: status=${analysis.hasStatus}, softDel=${analysis.hasSoftDelete}, user=${analysis.hasUserRelation}, hasMany=${analysis.hasManyRelations}, hasOne=${analysis.hasOneRelations}`);
  writeFile(`src/domain/${meta.name}/${meta.name}.entity.ts`, generateEntity(meta));
  writeFile(`src/domain/${meta.name}/${meta.name}.repository.interface.ts`, generateRepositoryInterface(meta, analysis));
  writeFile(`src/domain/${meta.name}/${meta.name}.service.interface.ts`, generateServiceInterface(meta, analysis));
  writeFile(`src/infrastructure/repositories/${meta.name}/${meta.name}.repository.ts`, generateRepositoryImplementation(meta, analysis));
  writeFile(`src/application/services/${meta.name}/${meta.name}.service.ts`, generateServiceImplementation(meta, analysis));
  writeFile(`src/api/controllers/${meta.name}.controller.ts`, generateController(meta, analysis));
  writeFile(`src/api/dtos/${meta.name}.dto.ts`, generateDto(meta, analysis));
  writeFile(`src/api/validations/${meta.name}.validation.ts`, generateValidation(meta, analysis));
  writeFile(`src/api/mappers/${meta.name}.mapper.ts`, generateMapper(meta));
  writeFile(`src/api/sito/${meta.name}.sito.ts`, generateSito(meta));
  writeFile(`tests/factories/${meta.name}.factory.ts`, testFactoryTemplate(meta));
  writeFile(`tests/integration/${meta.name}.integration.test.ts`, integrationTestTemplate(meta));
}

console.log('\n· Writing routes aggregator ...');
writeFile('src/api/routes.ts', generateRoutesAggregator(allTables));

console.log('\n=== Smoke test complete ===');
console.log(`Inspect: ${OUT_DIR}`);
