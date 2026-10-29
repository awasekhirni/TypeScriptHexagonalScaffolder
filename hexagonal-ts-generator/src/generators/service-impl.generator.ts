/**
 * * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 * src/generators/service-impl.generator.ts
 * -------------------------------------------------------------------
 * Mirrors `generate_service_implementation()` from the Python original.
 *
 * Emits the concrete service that lives in the application layer:
 *   src/application/services/<table>/<table>.service.ts
 *
 * It extends `EnterpriseBaseService<TEntity, TRepository>` and implements
 * the domain-layer service interface. Lifecycle events are published to
 * the Enterprise Bus so cross-cutting subscribers can react.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 */

import { TableAnalysis, TableMetadata } from '../types';
import { toPascalCase } from '../utils/naming';

/** Emit the service implementation file contents for one table. */
export function generateServiceImplementation(meta: TableMetadata, analysis: TableAnalysis): string {
  const className = toPascalCase(meta.name);
  const tableName = meta.name;
  const implName = `${className}Service`;
  const interfaceName = `IAsync${className}Service`;
  const repoImplName = `${className}Repository`;
  const statusCol = meta.columns.find((c) => c.columnName.toLowerCase().endsWith('_status'))?.columnName ?? 'status';
  const searchFields = ['name', 'title', 'description']
    .filter((f) => meta.columns.some((c) => c.columnName.toLowerCase() === f));
  const searchFieldList = searchFields.length ? `'${searchFields.join("','")}'` : "'id'";

  const methods: string[] = [];

  methods.push(`  override async list(skip = 0, take = 100): Promise<${className}[]> {
    return this.repository.findMany({ skip, take });
  }`);

  if (analysis.hasStatus) {
    methods.push(`  async listByStatus(status: string, skip = 0, take = 100): Promise<${className}[]> {
    return this.repository.findByStatus(status, skip, take);
  }`);

    methods.push(`  async changeStatus(id: string | number, newStatus: string, reason?: string): Promise<${className} | null> {
    if (reason) {
      logger.info(\`Changing status of \${id} to \${newStatus}. Reason: \${reason}\`);
    }
    const updated = await this.repository.changeStatus(id, newStatus);
    if (updated) {
      await enterpriseBus.publish(\`\${this.topicPrefix}.status_changed\`, { id, newStatus, reason });
    }
    return updated;
  }`);
  }

  if (analysis.hasTimestamps) {
    if (meta.columns.some((c) => c.columnName.toLowerCase() === 'created_at')) {
      methods.push(`  async listRecentlyCreated(days = 7, skip = 0, take = 100): Promise<${className}[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.repository.findCreatedAfter(cutoff, skip, take);
  }`);
    }

    if (meta.columns.some((c) => c.columnName.toLowerCase() === 'updated_at')) {
      methods.push(`  async listRecentlyUpdated(days = 7, skip = 0, take = 100): Promise<${className}[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.repository.findUpdatedAfter(cutoff, skip, take);
  }`);
    }
  }

  if (analysis.hasSoftDelete) {
    methods.push(`  async softDelete(id: string | number, reason?: string): Promise<boolean> {
    if (reason) {
      logger.info(\`Soft deleting \${id}. Reason: \${reason}\`);
    }
    const ok = await this.repository.softDelete(id);
    if (ok) {
      await enterpriseBus.publish(\`\${this.topicPrefix}.soft_deleted\`, { id, reason });
    }
    return ok;
  }`);

    methods.push(`  async restore(id: string | number): Promise<boolean> {
    const ok = await this.repository.restore(id);
    if (ok) {
      await enterpriseBus.publish(\`\${this.topicPrefix}.restored\`, { id });
    }
    return ok;
  }`);
  }

  if (analysis.hasUserRelation) {
    methods.push(`  async listForUser(userId: string | number, skip = 0, take = 100): Promise<${className}[]> {
    return this.repository.findByUserId(userId, skip, take);
  }`);
  }

  // Search: use TypeORM ILIKE on the picked fields.
  methods.push(`  async search(query: string, fields: string[] = [${searchFieldList}], skip = 0, take = 100): Promise<${className}[]> {
    // TypeORM's FindOptionsWhere doesn't expose ILIKE directly, so we
    // build a query builder against the entity table.
    const repo = AppDataSource.getRepository(${className});
    const qb = repo.createQueryBuilder('e');
    fields.forEach((field, idx) => {
      const clause = \`e.\${field} ILIKE :q\`;
      if (idx === 0) qb.where(clause, { q: \`%\${query}%\` });
      else qb.orWhere(clause, { q: \`%\${query}%\` });
    });
    return qb.skip(skip).take(take).getMany();
  }`);

  // Stats
  const statsLines: string[] = [];
  statsLines.push(`    const stats: Record<string, unknown> = {
      total_count: await this.repository.count(),
    };`);
  if (analysis.hasStatus) {
    statsLines.push(`    const statusCounts: Record<string, number> = {};
    for (const status of ['active', 'inactive', 'pending']) {
      statusCounts[status] = await this.repository.count({ ${statusCol}: status } as unknown as Record<string, unknown>);
    }
    stats['status_counts'] = statusCounts;`);
  }
  statsLines.push(`    return stats;`);
  methods.push(`  async getStats(): Promise<Record<string, unknown>> {
${statsLines.join('\n')}
  }`);

  // CSV export
  methods.push(`  async exportToCsv(filters?: Record<string, unknown>): Promise<string> {
    const rows = await this.repository.findMany({ skip: 0, take: 100_000 });
    const header = '${meta.columns.map((c) => c.columnName).slice(0, 5).join(',')}';
    const lines = rows.map((r) => [${meta.columns.slice(0, 5).map((c) => `(r as unknown as Record<string, unknown>).${c.columnName}`).join(', ')}].join(','));
    return [header, ...lines].join('\\n');
  }`);

  methods.push(`  async importFromCsv(csvData: string): Promise<number> {
    const lines = csvData.trim().split('\\n');
    const header = lines.shift()?.split(',') ?? [];
    const items: Array<DeepPartial<${className}>> = lines.map((line) => {
      const cells = line.split(',');
      const row: Record<string, unknown> = {};
      header.forEach((h, i) => { row[h] = cells[i]; });
      return row as DeepPartial<${className}>;
    });
    const created = await this.repository.bulkCreate(items);
    return created.length;
  }`);

  return `/**
 * src/application/services/${tableName}/${tableName}.service.ts
 * ---------------------------------------------------------------
 * Concrete application-layer service for ${className}.
 *
 * AUTO-GENERATED by hexagonal-ts-generator.
 *
 * Pattern: Enterprise Service (extends EnterpriseBaseService<TEntity, TRepository>).
 * The service orchestrates repository calls and publishes lifecycle
 * events on the Enterprise Bus.
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */
import { DeepPartial } from 'typeorm';
import { ${className} } from '../../../domain/${tableName}/${tableName}.entity';
import { ${interfaceName} } from '../../../domain/${tableName}/${tableName}.service.interface';
import { ${repoImplName} } from '../../../infrastructure/repositories/${tableName}/${tableName}.repository';
import { EnterpriseBaseService } from '../../../shared/services/base.service';
import { enterpriseBus } from '../../../shared/bus/enterprise-bus';
import { AppDataSource } from '../../../infrastructure/database/database';
import { logger } from '../../../shared/utils/logger';

export class ${implName} extends EnterpriseBaseService<${className}, ${repoImplName}> implements ${interfaceName} {
  protected readonly repository = new ${repoImplName}();
  protected readonly topicPrefix = '${tableName}';

${methods.join('\n\n')}
}
`;
}
