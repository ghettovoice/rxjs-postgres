/// <reference types="node" />
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
