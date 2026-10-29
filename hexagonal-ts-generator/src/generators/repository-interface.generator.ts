/**
 * * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 * src/generators/repository-interface.generator.ts
 * -------------------------------------------------------------------
 * Mirrors `generate_repository_interface()` from the Python original.
 *
 * Emits the **abstract** TypeScript interface for one table's async
 * repository. Concrete implementations live in
 * src/infrastructure/repositories/<table>/<table>.repository.ts.
 *
 * The interface extends `IAsyncBaseRepository<TEntity>` so all the
 * generic CRUD is implied; the per-table interface only declares
 * table-specific extras (e.g. `getByStatus`, `getByUserId`).
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 */

import { TableAnalysis, TableMetadata } from '../types';
import { toPascalCase } from '../utils/naming';

/** Emit the repository interface file contents for one table. */
export function generateRepositoryInterface(meta: TableMetadata, analysis: TableAnalysis): string {
  const className = toPascalCase(meta.name);
  const tableName = meta.name;
  const interfaceName = `IAsync${className}Repository`;

  const methods: string[] = [];

  // Always-declared basic CRUD (declared here even though the base
  // interface also declares them, so the per-table interface is
  // self-documenting).
  methods.push(`  /**
   * Find a ${className} by its primary key.
   * Returns \`null\` if no row matches.
   */
  findById(id: string | number): Promise<${className} | null>;`);

  // findMany is inherited from EnterpriseBaseRepository — the per-table
  // interface re-declares it for self-documentation purposes only.
  // The signature must match the base EXACTLY so the per-table
  // interface is structurally compatible.
  methods.push(`  /**
   * List ${className} rows with pagination + optional filters.
   * Inherited from EnterpriseBaseRepository<TEntity>; re-declared here
   * for self-documentation purposes only.
   */
  findMany(options?: {
    skip?: number;
    take?: number;
    where?: FindOptionsWhere<${className}> | FindOptionsWhere<${className}>[];
    order?: FindOptionsOrder<${className}>;
    relations?: string[];
  }): Promise<${className}[]>;`);

  methods.push(`  /** Create a new ${className}. */
  create(data: DeepPartial<${className}>): Promise<${className}>;`);

  methods.push(`  /** Update a ${className} by id. Returns \`null\` if not found. */
  update(id: string | number, data: DeepPartial<${className}>): Promise<${className} | null>;`);

  methods.push(`  /** Hard-delete a ${className} by id. Returns true if a row was removed. */
  delete(id: string | number): Promise<boolean>;`);

  // Context-specific extras, mirroring the Python original.
  if (analysis.hasStatus) {
    methods.push(`  /** Find ${className} rows matching the given status. */
  findByStatus(status: string, skip?: number, take?: number): Promise<${className}[]>;`);
    methods.push(`  /** Atomically change the status of one ${className}. */
  changeStatus(id: string | number, newStatus: string): Promise<${className} | null>;`);
  }

  if (analysis.hasTimestamps) {
    methods.push(`  /** Find ${className} rows created on/after the given timestamp. */
  findCreatedAfter(timestamp: Date, skip?: number, take?: number): Promise<${className}[]>;`);
    methods.push(`  /** Find ${className} rows updated on/after the given timestamp. */
  findUpdatedAfter(timestamp: Date, skip?: number, take?: number): Promise<${className}[]>;`);
  }

  if (analysis.hasSoftDelete) {
    methods.push(`  /** Soft-delete a ${className} (sets is_deleted=true, deleted_at=now). */
  softDelete(id: string | number): Promise<boolean>;`);
    methods.push(`  /** Restore a previously soft-deleted ${className}. */
  restore(id: string | number): Promise<boolean>;`);
  }

  if (analysis.hasUserRelation) {
    methods.push(`  /** Find every ${className} belonging to the given user id. */
  findByUserId(userId: string | number, skip?: number, take?: number): Promise<${className}[]>;`);
  }

  if (analysis.hasManyRelations.length || analysis.hasOneRelations.length) {
    methods.push(`  /** Eagerly load the named relations for one ${className}. */
  findWithRelations(id: string | number, relationNames: string[]): Promise<${className} | null>;`);
  }

  // Advanced helpers
  methods.push(`  /** Total number of rows in the ${className} table. */
  count(where?: FindOptionsWhere<${className}>): Promise<number>;`);
  methods.push(`  /** Returns true if at least one row matches the filter. */
  exists(where: FindOptionsWhere<${className}>): Promise<boolean>;`);
  methods.push(`  /** Bulk-insert many ${className} rows in a single transaction. */
  bulkCreate(items: Array<DeepPartial<${className}>>): Promise<${className}[]>;`);

  return `/**
 * src/domain/${tableName}/${tableName}.repository.interface.ts
 * ---------------------------------------------------------------
 * Domain-layer repository contract for the "${tableName}" table.
 *
 * AUTO-GENERATED by hexagonal-ts-generator.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import { DeepPartial, FindOptionsWhere, FindOptionsOrder } from 'typeorm';
import { ${className} } from './${tableName}.entity';
import { EnterpriseBaseRepository } from '../../shared/repositories/base.repository';

/**
 * Async repository interface for ${className}.
 *
 * Domain code depends on this interface — never on the concrete
 * implementation. That keeps the dependency arrows pointing inward
 * (the hexagonal-architecture invariant).
 */
export interface ${interfaceName} extends EnterpriseBaseRepository<${className}> {
${methods.join('\n\n')}
}
`;
}
