/**
 * * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 * src/generators/entity.generator.ts
 * -------------------------------------------------------------------
 * Mirrors `generate_entity_file()` from the Python original.
 *
 * Emits a TypeORM entity for one table under:
 *   src/domain/<table>/<table>.entity.ts
 *
 * The entity uses TypeORM decorators (@Entity, @Column, @PrimaryColumn,
 * @ManyToOne, @OneToMany) so the same class is used both for typing AND
 * for runtime database access. The Python original used SQLAlchemy; we
 * use TypeORM because it is the de-facto TypeScript ORM.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 */

import { ColumnInfo, RelationInfo, TableAnalysis, TableMetadata } from '../types';
import { toCamelCase, toPascalCase } from '../utils/naming';
import pluralize from 'pluralize';

/** Returns the TypeScript import for the entity on the "other side" of a FK. */
function relationEntityImport(tableName: string): string {
  const pascal = toPascalCase(tableName);
  return `import { ${pascal} } from '../${tableName}/${tableName}.entity';`;
}

/**
 * Map a PostgreSQL data type string to a TypeORM column decorator type.
 * Returns undefined for types we leave to TypeORM's auto-detection.
 */
function pgTypeToTypeOrmType(col: ColumnInfo): string | undefined {
  const t = col.dataType.toLowerCase();
  const udt = col.udtName.toLowerCase();

  if (udt.startsWith('_')) {
    return `'${udt.slice(1)}'`; // array types: '_int4' -> 'int4'
  }
  switch (t) {
    case 'uuid':
      return "'uuid'";
    case 'integer':
    case 'smallint':
    case 'bigint':
      return "'int'";
    case 'numeric':
    case 'decimal':
      return "'decimal'";
    case 'real':
    case 'double precision':
      return "'double'";
    case 'boolean':
      return "'boolean'";
    case 'date':
      return "'date'";
    case 'timestamp without time zone':
      return "'timestamp'";
    case 'timestamp with time zone':
      return "'timestamptz'";
    case 'time without time zone':
      return "'time'";
    case 'json':
    case 'jsonb':
      return "'jsonb'";
    case 'bytea':
      return "'bytea'";
    case 'character varying':
    case 'character':
    case 'text':
      return undefined; // TypeORM infers from TS type
    default:
      return undefined;
  }
}

/** Build the @Column / @PrimaryColumn / @ManyToOne / @OneToMany decorators. */
function buildColumnDecorators(col: ColumnInfo): string[] {
  const decorators: string[] = [];

  if (col.isPrimaryKey) {
    if (col.columnDefault && col.columnDefault.includes('uuid_generate_v4')) {
      decorators.push("@PrimaryGeneratedColumn('uuid')");
    } else if (col.dataType === 'integer' || col.dataType === 'bigint') {
      decorators.push("@PrimaryGeneratedColumn({ type: 'integer' })");
    } else {
      decorators.push(`@PrimaryColumn({ type: '${col.udtName}', name: '${col.columnName}' })`);
    }
  } else {
    const opts: string[] = [];
    opts.push(`name: '${col.columnName}'`);
    const type = pgTypeToTypeOrmType(col);
    if (type) opts.push(`type: ${type}`);
    if (col.characterMaximumLength) opts.push(`length: ${col.characterMaximumLength}`);
    // PG isNullable is 'YES' or 'NO' — both are truthy strings, so
    // we must compare against the literal 'YES'.
    if (col.isNullable === 'YES') opts.push(`nullable: true`);
    if (col.isUnique) opts.push(`unique: true`);
    if (col.columnDefault) {
      // Sanitize the default value so the generated code is valid SQL.
      // Examples: 'now()' -> () => 'now()', "'draft'" -> () => "'draft'"
      const d = col.columnDefault.replace(/'/g, "\\'");
      opts.push(`default: () => '${d}'`);
    }
    decorators.push(`@Column({ ${opts.join(', ')} })`);
  }

  return decorators;
}

/** Build a TS field declaration for one column. */
function buildColumnField(col: ColumnInfo): string {
  const tsType = (() => {
    const t = col.dataType.toLowerCase();
    const udt = col.udtName.toLowerCase();
    if (udt.startsWith('_')) {
      const inner = pgPrimitiveToTs(udt.slice(1));
      return `${inner}[]`;
    }
    return pgPrimitiveToTs(t);
  })();
  // Mark field as optional only when the DB column allows NULL.
  // Use the definite-assignment assertion `!` for required fields
  // because TypeORM populates them at load time, not in the constructor.
  // (Without `!`, TypeScript's strict mode rejects `name: string;`.)
  const nullable = col.isNullable === 'YES';
  const marker = nullable ? '?' : '!';
  return `  ${col.columnName}${marker}: ${tsType};`;
}

function pgPrimitiveToTs(pgType: string): string {
  switch (pgType) {
    case 'uuid':
    case 'character varying':
    case 'character':
    case 'text':
      return 'string';
    case 'integer':
    case 'smallint':
    case 'bigint':
    case 'numeric':
    case 'decimal':
    case 'real':
    case 'double precision':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
    case 'timestamp without time zone':
    case 'timestamp with time zone':
    case 'time without time zone':
      return 'Date';
    case 'json':
    case 'jsonb':
      return 'Record<string, unknown>';
    case 'bytea':
      return 'Buffer';
    default:
      return 'string';
  }
}

/**
 * Build @ManyToOne / @OneToMany decorators for each inbound / outbound
 * FK relation. The Python original emitted relationship() calls; we use
 * TypeORM's equivalents.
 *
 * Naming conventions:
 *   - @ManyToOne side (we hold the FK): property is the SINGULAR form
 *     of the referenced table (e.g. post.user points at users).
 *   - @OneToMany side (others point at us): property is the PLURAL form
 *     of the referring table (e.g. users.posts is the collection).
 */
function buildRelationDecorators(meta: TableMetadata): string[] {
  const lines: string[] = [];

  for (const rel of meta.relations) {
    if (rel.direction === 'MANYTOONE') {
      // we hold the FK -> @ManyToOne
      const target = toPascalCase(rel.foreignTable);
      // singularize: posts.user_id -> post.user (singular)
      const propName = pluralize.singular(toCamelCase(rel.foreignTable));
      lines.push(
        `  @ManyToOne(() => ${target}, { eager: false, nullable: ${getRelationNullable(rel) ? 'true' : 'false'} })`,
        `  @JoinColumn({ name: '${rel.columnName}' })`,
        `  ${propName}?: ${target};`,
      );
    } else if (rel.direction === 'ONETOMANY') {
      // someone points at us -> @OneToMany
      // For an ONETOMANY, the OTHER table is the one that holds the FK.
      const otherTable = rel.foreignTable === meta.name ? rel.tableName : rel.foreignTable;
      const target = toPascalCase(otherTable);
      // PLURAL property name (matches the table name since we already
      // name tables in plural form: users, posts, etc.).
      const propName = toCamelCase(target);
      // The back-reference is the singular form of OUR table name.
      const backRef = pluralize.singular(toCamelCase(meta.name));
      lines.push(
        `  @OneToMany(() => ${target}, (entity) => entity.${backRef})`,
        `  ${propName}?: ${target}[];`,
      );
    }
  }

  return lines;
}

function getRelationNullable(_rel: RelationInfo): boolean {
  return true; // be conservative on first pass; refinements go in the analyzer
}

/** Build the imports section for the entity file. */
function buildImports(meta: TableMetadata): string {
  const typeormImports = [
    'Entity',
    'Column',
    'PrimaryColumn',
    'PrimaryGeneratedColumn',
    'ManyToOne',
    'OneToMany',
    'JoinColumn',
    'Index',
  ];
  const relationsImported = meta.relations
    .map((r) =>
      r.direction === 'MANYTOONE'
        ? r.foreignTable
        : r.direction === 'ONETOMANY'
        ? r.foreignTable === meta.name
          ? r.tableName
          : r.foreignTable
        : '',
    )
    .filter(Boolean);
  const uniqueTables = Array.from(new Set(relationsImported));
  const relationImports = uniqueTables.map((t) => relationEntityImport(t)).join('\n');

  return `import {
  ${typeormImports.join(',\n  ')},
} from 'typeorm';
${relationImports ? relationImports + '\n' : ''}`;
}

/**
 * Generate the full entity file contents for one table.
 */
export function generateEntity(meta: TableMetadata): string {
  const className = toPascalCase(meta.name);

  const imports = buildImports(meta);

  const enumBlocks: string[] = []; // we no longer fabricate enums for unknown varchar columns
  // (the analyzer can flag enum-like columns but we cannot guess their
  // allowed values without querying the DB for distinct values; that
  // would slow down generation. Concrete enums can be added by hand or
  // by extending the analyzer with a `distinct_values` query.)

  const decorators: string[] = [];
  decorators.push(`@Entity({ name: '${meta.name}', schema: '${meta.schema}' })`);

  const primaryKeys = meta.columns.filter((c) => c.isPrimaryKey);
  if (primaryKeys.length === 1 && primaryKeys[0].isUnique) {
    decorators.push(`@Index('idx_${meta.name}_pk', ['${primaryKeys[0].columnName}'], { unique: true })`);
  }

  const columnLines: string[] = [];
  for (const col of meta.columns) {
    const ds = buildColumnDecorators(col);
    for (const d of ds) columnLines.push(`  ${d}`);
    columnLines.push(buildColumnField(col));
    columnLines.push('');
  }

  const relationLines = buildRelationDecorators(meta);

  const classBody = [
    ...columnLines,
    ...relationLines,
  ].filter(Boolean).join('\n');

  const methods = `
  // ---------------------------------------------------------------
  // Convenience helpers
  // ---------------------------------------------------------------

  /** Pretty-print for logs — first three columns only. */
  toString(): string {
    const head = [${meta.columns.slice(0, 3).map((c) => `'${c.columnName}=' + String(this.${c.columnName})`).join(', ')}].join(', ');
    return '<${className} ' + head + '>';
  }

  /** Convert entity to a plain object (relations excluded by default). */
  toDTO(includeRelations = false): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const key of Object.keys(this)) {
      if (key.startsWith('_')) continue;
      const value = (this as Record<string, unknown>)[key];
      if (value !== undefined) data[key] = value;
    }
    if (includeRelations) {
      // TypeORM relations are also on the instance — we trust them to
      // be loaded or undefined.
    }
    return data;
  }
`;

  return `/**
 * src/domain/${meta.name}/${meta.name}.entity.ts
 * ---------------------------------------------------------------
 * TypeORM entity for the "${meta.name}" table.
 *
 * AUTO-GENERATED by hexagonal-ts-generator. Edit by hand ONLY to add
 * domain logic — re-running the generator will overwrite this file.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
${imports}

${enumBlocks.join('\n\n')}
${decorators.join('\n')}
export class ${className} {
${classBody}
${methods}
}
`;
}
