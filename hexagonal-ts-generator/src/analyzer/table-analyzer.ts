/**
 * src/analyzer/table-analyzer.ts
 * -------------------------------------------------------------------
 * Mirrors `analyze_table()` from the Python original.
 *
 * Given a `TableMetadata` (columns + relations), returns a
 * `TableAnalysis` describing which "extra" features the entity has:
 *   - timestamp columns (created_at / updated_at / modified_at)
 *   - status columns (xxx_status)
 *   - soft-delete columns (is_deleted / deleted_at)
 *   - user relation (user_id / xxx_user_id)
 *   - enum-like columns (xxx_type / xxx_role / xxx_kind)
 *   - many-to-one / one-to-many relations
 *
 * The generator uses this analysis to decide which *additional*
 * methods to emit in the repository / service interfaces, the
 * repository / service implementations, and the controller routes.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 */

import { ColumnInfo, RelationInfo, TableAnalysis, TableMetadata } from '../types';

/** Columns that, if present, mark a table as "auditable". */
const TIMESTAMP_COLUMN_NAMES = new Set(['created_at', 'updated_at', 'modified_at']);

/** Columns that, if present, mark a table as "soft-deletable". */
const SOFT_DELETE_COLUMN_NAMES = new Set(['is_deleted', 'deleted_at', 'deleted']);

/** Suffixes that mark a column as enum-like. */
const ENUM_SUFFIXES = ['_type', '_role', '_kind', '_state', '_status'];

/** Suffixes that mark a column as a user foreign key. */
const USER_COLUMN_PATTERNS = [/^user_id$/, /_user_id$/];

/**
 * Analyze a single table's columns + relations.
 */
export function analyzeTable(meta: TableMetadata): TableAnalysis {
  const analysis: TableAnalysis = {
    hasTimestamps: false,
    hasStatus: false,
    hasSoftDelete: false,
    hasUserRelation: false,
    enumColumns: [],
    hasManyRelations: [],
    hasOneRelations: [],
  };

  for (const column of meta.columns) {
    const colName = column.columnName.toLowerCase();
    const colType = (column.dataType ?? '').toLowerCase();

    // Timestamp columns
    if (TIMESTAMP_COLUMN_NAMES.has(colName)) {
      analysis.hasTimestamps = true;
    }

    // Status columns
    if (colName.endsWith('_status')) {
      analysis.hasStatus = true;
      if (colType.startsWith('character varying') || colType.startsWith('varchar')) {
        analysis.enumColumns.push(column.columnName);
      }
    }

    // Soft-delete columns
    if (SOFT_DELETE_COLUMN_NAMES.has(colName)) {
      analysis.hasSoftDelete = true;
    }

    // User-relation columns
    if (USER_COLUMN_PATTERNS.some((re) => re.test(colName))) {
      analysis.hasUserRelation = true;
    }

    // Enum-like columns (type / role / kind / state)
    if (
      ENUM_SUFFIXES.some((suffix) => colName.endsWith(suffix)) &&
      (colType.startsWith('character varying') || colType.startsWith('varchar'))
    ) {
      // avoid duplicates when a column ends with `_status` AND matches here
      if (!analysis.enumColumns.includes(column.columnName)) {
        analysis.enumColumns.push(column.columnName);
      }
    }
  }

  // Relationships
  for (const rel of meta.relations) {
    if (rel.direction === 'MANYTOONE') {
      // we hold the FK -> this is a "belongs-to" relation
      analysis.hasOneRelations.push(rel.foreignTable);
    } else if (rel.direction === 'ONETOMANY') {
      // another table points at us -> we "have many" of those
      analysis.hasManyRelations.push(rel.tableName === meta.name ? rel.foreignTable : rel.tableName);
    }
  }

  return analysis;
}

/** Convenience: analyze every table in one call. */
export function analyzeAllTables(metadata: TableMetadata[]): Array<TableMetadata & { analysis: TableAnalysis }> {
  return metadata.map((meta) => ({ ...meta, analysis: analyzeTable(meta) }));
}

/**
 * Returns true if a column is a timestamp column (helper used by
 * entity / DTO generators).
 */
export function isTimestampColumn(col: ColumnInfo): boolean {
  return TIMESTAMP_COLUMN_NAMES.has(col.columnName.toLowerCase());
}

/** Returns true if a column is a soft-delete flag. */
export function isSoftDeleteColumn(col: ColumnInfo): boolean {
  return SOFT_DELETE_COLUMN_NAMES.has(col.columnName.toLowerCase());
}
