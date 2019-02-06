import { Connection, ConnectionConfig, ConnectionOptions, PoolConfig, Query, MysqlError, raw } from 'mysql';

declare class Santz {
    constructor(conection: Connection, strict?:boolean);
    public select(columns: string[] | string | object, executable?: boolean): this;
    public from (table: string, staticTable?: boolean): this;
    public table(table: string, staticTable?: boolean): this;
    public where(identifier: string, operator: string, value: string | number): this;
    public insert (table: string, staticTable?:boolean): this;
    public update (table: string, staticTable?: boolean): this;
    public values(values: object): this;
    public destroy(table: string): this;
    public hidden (table: string): this;
    public show (table: string): this;
    public rowsHidden(table: string): this;
    public innerJoin (table: string, staticTable?: boolean): this;
    public on (firstIdentifier: string, secondIdentifier: string): this;
    public and (identifier: string, operator: string, value: string | number): this;
    public or (identifier: string, operator: string, value: string | number): this;
    public orderBy(column: string, mode?: string): this;
    public limit(startOrAmount: number, numRows?: number): this;
    public exec (): Promise<Query["RowDataPacket"] | MysqlError>;
    public strToSql(strSql: string): object;
}

declare function connect(config: PoolConfig, showOrHidden?: boolean): Connection;

declare interface IModelConfig {
    connection: Connection,
    strict?: boolean;
    columnNameState?: string;
    showQuery?: boolean;
}

declare function Model(config: IModelConfig): Santz;

export {
    connect,
    Connection,
    PoolConfig,
    ConnectionOptions,
    Model,
    Santz,
    MysqlError
};