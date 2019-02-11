import { Pool } from 'mysql';

export declare interface ModelConfig {
    pool: Pool,
    strict?: boolean;
    columnNameState?: string;
    showQuery?: boolean;
}

export declare interface QueryResult {
    fieldCount: number;
    affectedRows: number;
    insertId: number;
    serverStatus: number;
    warningCount: number;
    message: string;
    protocol41: boolean;
    changedRows: number;
}