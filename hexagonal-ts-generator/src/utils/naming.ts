/**
 * * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 * Author: Awase Khirni Syed
 * src/utils/naming.ts
 * -------------------------------------------------------------------
 * Naming-convention helpers shared by every generator.
 *
 * The PostgreSQL catalog gives us snake_case identifiers (`user_account`).
 * The generated TypeScript code needs PascalCase classes (`UserAccount`),
 * camelCase fields (`userAccount`), and kebab-case file names
 * (`user-account.entity.ts`).
 *
 * Copyright 2025 β ORI Inc. Canada. All Rights Reserved.
 */

import pluralize from 'pluralize';

/** snake_case -> PascalCase. e.g. `user_account` -> `UserAccount`. */
export function toPascalCase(snake: string): string {
  return snake
    .split('_')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join('');
}

/** snake_case -> camelCase. e.g. `user_account` -> `userAccount`. */
export function toCamelCase(snake: string): string {
  const pascal = toPascalCase(snake);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/** snake_case -> kebab-case. e.g. `user_account` -> `user-account`. */
export function toKebabCase(snake: string): string {
  return snake.toLowerCase().replace(/_/g, '-');
}

/** Singularize then pascal-case. e.g. `users` -> `User`. */
export function singularPascal(name: string): string {
  return toPascalCase(pluralize.singular(name));
}

/** Pluralize a snake_case word for route paths. e.g. `user` -> `users`. */
export function pluralizeSnake(name: string): string {
  return pluralize(name);
}

/** Map a PostgreSQL data type to a TypeScript type literal. */
export function pgTypeToTsType(col: {
  dataType: string;
  udtName: string;
  isNullable: boolean;
}): string {
  let ts: string;
  const t = col.dataType.toLowerCase();
  const udt = col.udtName.toLowerCase();

  if (udt.startsWith('_')) {
    // Array types in PG are stored with a leading underscore (e.g. `_int4`)
    ts = `${pgTypeToTsType({ dataType: t, udtName: udt.slice(1), isNullable: false })}[]`;
  } else if (t === 'uuid') ts = 'string';
  else if (t === 'integer' || t === 'smallint' || t === 'bigint' || t === 'int2' || t === 'int4' || t === 'int8') ts = 'number';
  else if (t === 'numeric' || t === 'decimal' || t === 'real' || t === 'double precision') ts = 'number';
  else if (t === 'boolean') ts = 'boolean';
  else if (t === 'date' || t === 'timestamp without time zone' || t === 'timestamp with time zone' || t === 'time without time zone') ts = 'Date';
  else if (t === 'json' || t === 'jsonb') ts = 'Record<string, unknown>';
  else if (t === 'bytea') ts = 'Buffer';
  else ts = 'string'; // varchar/char/text fall through here

  return col.isNullable ? `${ts} | null` : ts;
}
