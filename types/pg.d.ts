/// <reference types="node" />
/// <reference types="es6-shim" />
export interface PgQuery {
    text: string;
}
export interface PgQueryResult {
    rows: any[];
}
export interface PgClient {
    release?: (err?: Error) => void;
    query(queryText: string, values: any[], callback?: (err?: Error, res?: PgQueryResult) => void): PgQuery;
    connect(callback?: (err?: Error, res?: PgClient) => void): void;
    end(callback?: () => void): void;
}
export interface PgPool {
    connect(cb?: (err?: Error, client?: PgClient) => void): Promise<PgClient>;
    take(cb?: (err?: Error, client?: PgClient) => void): Promise<PgClient>;
    query(queryText: string, values: any[], callback?: (err?: Error, res?: PgQueryResult) => void): Promise<PgQueryResult>;
    end(cb?: (err?: Error) => void): Promise<void>;
}
