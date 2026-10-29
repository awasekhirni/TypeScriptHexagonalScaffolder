/**
 * * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 * src/introspection/database.ts
 * -------------------------------------------------------------------
 * Connects to the target PostgreSQL database using the `pg` driver and
 * reads the catalog (information_schema + pg_catalog) so the rest of
 * the generator can reason about tables, columns, primary keys, foreign
 * keys, and uniqueness constraints WITHOUT executing `sqlacodegen`.
 *
 * The Python original used SQLAlchemy `automap_base()` to reflect the
 * schema. We achieve the same effect by querying `information_schema`
 * directly — that way the generator has no hard runtime dependency on
 * an ORM (TypeORM is only used by the *generated* project, not by the
 * generator itself).
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 */

import { Pool, QueryResult } from 'pg';
import { config, parsedUrl } from '../config';
import { logger } from '../utils/logger';
import { ColumnInfo, RelationInfo, TableMetadata } from '../types';

/**
 * Opens a long-lived connection pool used throughout the generation run.
 * Closed at the end by `closeIntrospectionPool()`.
 */
const pool = new Pool({
  user: parsedUrl.user,
  password: parsedUrl.password,
  host: parsedUrl.host,
  port: parsedUrl.port,
  database: parsedUrl.database,
  max: 5,
  idleTimeoutMillis: 30_000,
});

/**
 * Returns the list of base-tables (no views, no system tables) in the
 * configured schema. Materialized views are excluded because TypeORM
 * cannot reliably map them to writable entities.
 */
export async function listTables(): Promise<string[]> {
  const res: QueryResult<{ table_name: string }> = await pool.query(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = $1
        AND table_type = 'BASE TABLE'
      ORDER BY table_name`,
    [parsedUrl.schema],
  );
  return res.rows.map((r) => r.table_name);
}

/**
 * Returns column metadata for a single table. We join
 * `information_schema.columns` with `pg_constraint` so we can flag
 * primary keys, foreign keys, and uniqueness in a single round-trip
 * per table.
 */
export async function describeTable(tableName: string): Promise<ColumnInfo[]> {
  const res: QueryResult<ColumnInfo> = await pool.query(
    `SELECT
        c.table_schema  AS "tableSchema",
        c.table_name    AS "tableName",
        c.column_name   AS "columnName",
        c.ordinal_position AS "ordinalPosition",
        c.column_default AS "columnDefault",
        c.is_nullable   AS "isNullable",
        c.data_type     AS "dataType",
        c.udt_name      AS "udtName",
        c.character_maximum_length AS "characterMaximumLength",
        c.numeric_precision AS "numericPrecision",
        c.numeric_scale AS "numericScale",
        COALESCE(pk.is_pk, false)  AS "isPrimaryKey",
        COALESCE(fk.is_fk, false)  AS "isForeignKey",
        fk.foreign_table  AS "foreignTable",
        fk.foreign_column AS "foreignColumn",
        COALESCE(uq.is_unique, false) AS "isUnique"
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT kcu.table_schema, kcu.table_name, kcu.column_name, TRUE AS is_pk
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema = kcu.table_schema
         WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk ON pk.table_schema = c.table_schema
          AND pk.table_name    = c.table_name
          AND pk.column_name   = c.column_name
      LEFT JOIN (
        SELECT kcu.table_schema, kcu.table_name, kcu.column_name,
               ccu.table_name AS foreign_table,
               ccu.column_name AS foreign_column,
               TRUE AS is_fk
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
         WHERE tc.constraint_type = 'FOREIGN KEY'
      ) fk ON fk.table_schema = c.table_schema
          AND fk.table_name    = c.table_name
          AND fk.column_name   = c.column_name
      LEFT JOIN (
        SELECT kcu.table_schema, kcu.table_name, kcu.column_name, TRUE AS is_unique
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema = kcu.table_schema
         WHERE tc.constraint_type = 'UNIQUE'
      ) uq ON uq.table_schema = c.table_schema
          AND uq.table_name    = c.table_name
          AND uq.column_name   = c.column_name
      WHERE c.table_schema = $1
        AND c.table_name = $2
      ORDER BY c.ordinal_position`,
    [parsedUrl.schema, tableName],
  );
  return res.rows;
}

/**
 * Returns all foreign-key relationships for a table — both inbound
 * (children pointing at us) and outbound (us pointing at a parent).
 *
 * The `direction` field is computed by comparing which side of the
 * relation the current table sits on.
 */
export async function describeRelations(tableName: string): Promise<RelationInfo[]> {
  const res: QueryResult<RelationInfo> = await pool.query(
    `SELECT
        con.conname AS "constraintName",
        rel.table_name AS "tableName",
        att2.attname AS "columnName",
        rel2.table_name AS "foreignTable",
        att.attname AS "foreignColumn",
        CASE
          WHEN rel.table_name = $1 AND rel2.table_name <> $1 THEN 'MANYTOONE'
          WHEN rel2.table_name = $1 AND rel.table_name <> $1 THEN 'ONETOMANY'
        END AS "direction"
      FROM pg_constraint con
      JOIN pg_class rel  ON con.conrelid = rel.oid
      JOIN pg_class rel2 ON con.confrelid = rel2.oid
      JOIN pg_namespace nsp  ON nsp.oid = rel.relnamespace
      JOIN pg_namespace nsp2 ON nsp2.oid = rel2.relnamespace
      JOIN pg_attribute att  ON att.attrelid = rel2.oid AND att.attnum = con.confkey[1]
      JOIN pg_attribute att2 ON att2.attrelid = rel.oid AND att2.attnum = con.conkey[1]
      WHERE con.contype = 'f'
        AND nsp.nspname = $2
        AND nsp2.nspname = $2
        AND (rel.table_name = $1 OR rel2.table_name = $1)`,
    [tableName, parsedUrl.schema],
  );
  return res.rows.filter((r) => r.direction !== null);
}

/**
 * Top-level entrypoint: returns fully resolved metadata for every
 * table in the schema. Tables with no columns are silently skipped.
 */
export async function introspectDatabase(): Promise<TableMetadata[]> {
  logger.info(`Connecting to PostgreSQL at ${parsedUrl.host}:${parsedUrl.port}/${parsedUrl.database} ...`);
  const tables = await listTables();
  logger.info(`Found ${tables.length} tables in schema "${parsedUrl.schema}".`);

  const metadata: TableMetadata[] = [];
  for (const tableName of tables) {
    const [columns, relations] = await Promise.all([
      describeTable(tableName),
      describeRelations(tableName),
    ]);
    if (columns.length === 0) {
      logger.warn(`Table "${tableName}" has no columns — skipping.`);
      continue;
    }
    metadata.push({
      schema: parsedUrl.schema,
      name: tableName,
      columns,
      relations,
    });
  }
  return metadata;
}

/** Closes the underlying pg pool. Call at the very end of generation. */
export async function closeIntrospectionPool(): Promise<void> {
  await pool.end();
  logger.info('Introspection pool closed.');
}
