/**
 * src/types.ts
 * -------------------------------------------------------------------
 * Shared type definitions used across the generator.
 *
 * These types describe the **introspected** shape of the PostgreSQL
 * database (see `introspection/database.ts`) and the **analysis**
 * produced for each table (see `analyzer/table-analyzer.ts`).
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 */

/** A single column row from `information_schema.columns`. */
export interface ColumnInfo {
  tableSchema: string;
  tableName: string;
  columnName: string;
  ordinalPosition: number;
  columnDefault: string | null;
  isNullable: 'YES' | 'NO';
  dataType: string;        // e.g. "integer", "character varying", "uuid"
  udtName: string;         // e.g. "int4", "varchar", "uuid", "_varchar" (array)
  characterMaximumLength: number | null;
  numericPrecision: number | null;
  numericScale: number | null;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignTable: string | null;
  foreignColumn: string | null;
  isUnique: boolean;
}

/** A foreign-key relationship row from the catalog. */
export interface RelationInfo {
  constraintName: string;
  tableName: string;
  columnName: string;
  foreignTable: string;
  foreignColumn: string;
  /** "MANYTOONE" if our column references another table's PK. */
  direction: 'MANYTOONE' | 'ONETOMANY';
}

/** A single table's introspected metadata. */
export interface TableMetadata {
  schema: string;
  name: string;
  columns: ColumnInfo[];
  relations: RelationInfo[];
}

/**
 * Structural analysis of a table — drives which extra methods/interfaces
 * are emitted for the entity, repository, and service.
 */
export interface TableAnalysis {
  hasTimestamps: boolean;
  hasStatus: boolean;
  hasSoftDelete: boolean;
  hasUserRelation: boolean;
  enumColumns: string[];
  hasManyRelations: string[];   // relation keys pointing to children
  hasOneRelations: string[];    // relation keys pointing to parents
}

/** What the generator produces for one table. */
export interface GeneratedArtifacts {
  entityPath: string;
  repositoryInterfacePath: string;
  serviceInterfacePath: string;
  repositoryImplPath: string;
  serviceImplPath: string;
  controllerPath: string;
  dtoPath: string;
  mapperPath: string;
  sitoPath: string;
  validationPath: string;
}

/** Generator runtime configuration (loaded from .env). */
export interface GeneratorConfig {
  databaseUrl: string;
  projectDir: string;
  appName: string;
  appVersion: string;
  appDescription: string;
  debug: boolean;
  /** Connection pool settings passed through to the generated project. */
  dbPoolSize: number;
  dbMaxOverflow: number;
  dbPoolRecycle: number;
}
