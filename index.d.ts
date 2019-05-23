import { Pool, PoolConfig, raw } from 'mysql';

type OrderMode = 'ASC' | 'DESC';

declare class Santz {
  constructor(pool: Pool, strict?: boolean);
  public select(
    columns: string[] | string | object,
    executable?: boolean,
  ): this;
  public from(table: string, staticTable?: boolean): this;
  public where(
    identifier: string,
    operator: string,
    value: string | number,
  ): this;
  public insert(table: string, staticTable?: boolean): this;
  public update(table: string, staticTable?: boolean): this;
  public values(values: object): this;
  public destroy(table: string): this;
  public hidden(table: string): this;
  public show(table: string): this;
  public rowsHidden(table: string, columns?: string[]): this;
  public innerJoin(table: string, staticTable?: boolean): this;
  public leftJoin(table: string, staticTable?: boolean): this;
  public rightJoin(table: string, staticTable?: boolean): this;
  public on(firstIdentifier: string, secondIdentifier: string): this;
  public and(
    identifier: string,
    operator: string,
    value: string | number,
  ): this;
  public or(identifier: string, operator: string, value: string | number): this;
  public orderBy(column: string, mode?: OrderMode): this;
  public limit(startOrAmount: number, numRows?: number): this;
  public testConnection(): void;
  public exec(): Promise<any>;
  public strToSql(strSql: string): object;
}

declare interface QueryResult {
  fieldCount: number;
  affectedRows: number;
  insertId: number;
  serverStatus: number;
  warningCount: number;
  message: string;
  protocol41: boolean;
  changedRows: number;
}

declare function createPool(config: PoolConfig): Pool;

declare interface ModelConfig {
  pool: Pool;
  strict?: boolean;
  columnNameState?: string;
  showQuery?: boolean;
}

declare function santzModel(
  config: ModelConfig,
  nestTables?: boolean | '_',
): Santz;

export {
  Santz,
  Pool,
  createPool,
  santzModel,
  PoolConfig,
  ModelConfig,
  QueryResult,
};
