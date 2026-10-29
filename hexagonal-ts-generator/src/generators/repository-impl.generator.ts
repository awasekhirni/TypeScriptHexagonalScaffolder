/**
 * * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 * src/generators/repository-impl.generator.ts
 * -------------------------------------------------------------------
 * Mirrors `generate_repository_implementation()` from the Python original.
 *
 * Emits the concrete TypeORM-backed repository that lives in the
 * infrastructure layer:
 *   src/infrastructure/repositories/<table>/<table>.repository.ts
 *
 * It extends `EnterpriseBaseRepository<TEntity>` and implements the
 * matching domain-layer interface. Per-table methods are emitted only
 * when the analyzer flagged the corresponding column types as present.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 */

import { TableAnalysis, TableMetadata } from '../types';
import { toPascalCase } from '../utils/naming';

/** Emit the repository implementation file contents for one table. */
export function generateRepositoryImplementation(meta: TableMetadata, analysis: TableAnalysis): string {
  const className = toPascalCase(meta.name);
  const tableName = meta.name;
  const implName = `${className}Repository`;
  const interfaceName = `IAsync${className}Repository`;
  const primaryKeyColumn = meta.columns.find((c) => c.isPrimaryKey)?.columnName ?? 'id';

  const methods: string[] = [];

  // ---- findMany is inherited from EnterpriseBaseRepository<TEntity> ----
  // (No per-table override — the base implementation already handles
  // skip/take/where/order/relations.)

  // ---- findByStatus ----
  if (analysis.hasStatus) {
    // Find the status column name. Default to "status" if present.
    const statusCol = meta.columns.find((c) => c.columnName.toLowerCase().endsWith('_status'))?.columnName ?? 'status';
    methods.push(`  async findByStatus(status: string, skip = 0, take = 100): Promise<${className}[]> {
    return this.repo.find({
      skip,
      take,
      where: { ${statusCol}: status } as unknown as FindOptionsWhere<${className}>,
    });
  }`);

    methods.push(`  async changeStatus(id: string | number, newStatus: string): Promise<${className} | null> {
    await this.repo
      .createQueryBuilder()
      .update(${className})
      .set({ ${statusCol}: newStatus } as unknown as QueryDeepPartialEntity<${className}>)
      .where(\`${primaryKeyColumn} = :id\`, { id })
      .execute();
    return this.findById(id);
  }`);
  }

  // ---- findCreatedAfter / findUpdatedAfter ----
  if (analysis.hasTimestamps) {
    if (meta.columns.some((c) => c.columnName.toLowerCase() === 'created_at')) {
      methods.push(`  async findCreatedAfter(timestamp: Date, skip = 0, take = 100): Promise<${className}[]> {
    return this.repo.find({
      skip,
      take,
      where: { createdAt: timestamp } as unknown as FindOptionsWhere<${className}>,
      order: { createdAt: 'DESC' } as Record<string, 'ASC' | 'DESC'>,
    });
  }`);
    }

    if (meta.columns.some((c) => c.columnName.toLowerCase() === 'updated_at')) {
      methods.push(`  async findUpdatedAfter(timestamp: Date, skip = 0, take = 100): Promise<${className}[]> {
    return this.repo.find({
      skip,
      take,
      where: { updatedAt: timestamp } as unknown as FindOptionsWhere<${className}>,
      order: { updatedAt: 'DESC' } as Record<string, 'ASC' | 'DESC'>,
    });
  }`);
    }
  }

  // ---- softDelete / restore ----
  if (analysis.hasSoftDelete) {
    const hasDeletedAt = meta.columns.some((c) => c.columnName.toLowerCase() === 'deleted_at');
    const hasIsDeleted = meta.columns.some((c) => c.columnName.toLowerCase() === 'is_deleted');

    if (hasIsDeleted) {
      methods.push(`  async softDelete(id: string | number): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(${className})
      .set({ isDeleted: true${hasDeletedAt ? ', deletedAt: new Date()' : ''} } as unknown as QueryDeepPartialEntity<${className}>)
      .where(\`${primaryKeyColumn} = :id\`, { id })
      .execute();
    return (result.affected ?? 0) > 0;
  }`);

      methods.push(`  async restore(id: string | number): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(${className})
      .set({ isDeleted: false${hasDeletedAt ? ', deletedAt: null' : ''} } as unknown as QueryDeepPartialEntity<${className}>)
      .where(\`${primaryKeyColumn} = :id\`, { id })
      .execute();
    return (result.affected ?? 0) > 0;
  }`);
    } else if (hasDeletedAt) {
      // Tables with deleted_at but no is_deleted flag
      methods.push(`  async softDelete(id: string | number): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(${className})
      .set({ deletedAt: new Date() } as unknown as QueryDeepPartialEntity<${className}>)
      .where(\`${primaryKeyColumn} = :id\`, { id })
      .execute();
    return (result.affected ?? 0) > 0;
  }`);

      methods.push(`  async restore(id: string | number): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(${className})
      .set({ deletedAt: null } as unknown as QueryDeepPartialEntity<${className}>)
      .where(\`${primaryKeyColumn} = :id\`, { id })
      .execute();
    return (result.affected ?? 0) > 0;
  }`);
    }
  }

  // ---- findByUserId ----
  if (analysis.hasUserRelation) {
    const userCol = meta.columns.find((c) => /(^user_id$|_user_id$)/.test(c.columnName.toLowerCase()))?.columnName ?? 'user_id';
    methods.push(`  async findByUserId(userId: string | number, skip = 0, take = 100): Promise<${className}[]> {
    return this.repo.find({
      skip,
      take,
      where: { ${userCol}: userId } as unknown as FindOptionsWhere<${className}>,
    });
  }`);
  }

  // ---- findWithRelations ----
  if (analysis.hasManyRelations.length || analysis.hasOneRelations.length) {
    methods.push(`  async findWithRelations(id: string | number, relationNames: string[]): Promise<${className} | null> {
    return this.repo.findOne({
      where: { ${primaryKeyColumn}: id } as unknown as FindOptionsWhere<${className}>,
      relations: relationNames,
    });
  }`);
  }

  // ---- exists / bulkCreate are inherited from EnterpriseBaseRepository<TEntity> ----
  // (No per-table override needed.)

  return `/**
 * src/infrastructure/repositories/${tableName}/${tableName}.repository.ts
 * ---------------------------------------------------------------
 * Concrete TypeORM-backed repository for ${className}.
 *
 * AUTO-GENERATED by hexagonal-ts-generator.
 *
 * Pattern: Enterprise Repository (extends EnterpriseBaseRepository<TEntity>).
 * The class implements the domain-layer interface so domain code never
 * imports TypeORM.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import { DeepPartial, FindOptionsWhere, FindOptionsOrder, QueryDeepPartialEntity } from 'typeorm';
import { ${className} } from '../../../domain/${tableName}/${tableName}.entity';
import { ${interfaceName} } from '../../../domain/${tableName}/${tableName}.repository.interface';
import { EnterpriseBaseRepository } from '../../../shared/repositories/base.repository';

export class ${implName} extends EnterpriseBaseRepository<${className}> implements ${interfaceName} {
  protected readonly entityTarget = ${className};

  // NOTE: findMany is inherited from EnterpriseBaseRepository with the
  // default behaviour (skip=0, take=100, order by ${primaryKeyColumn} DESC).
  // Override it here only if the table needs something different.

${methods.join('\n\n')}
}
`;
}
