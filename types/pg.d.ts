/// <reference types="node" />
/// <reference types="es6-shim" />
/**
 * Internal `node-postgres` interfaces for.
 * Used for mocking.
 *
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */
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
    connect(callback?: (err?: Error, client?: PgClient) => void): Promise<PgClient>;
    take(callback?: (err?: Error, client?: PgClient) => void): Promise<PgClient>;
    query(queryText: string, values: any[], callback?: (err?: Error, res?: PgQueryResult) => void): Promise<PgQueryResult>;
    end(callback?: (err?: Error) => void): Promise<void>;
}
