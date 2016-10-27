/// <reference types="node" />
import { PgClient, PgQuery, PgQueryResult } from "../../src/pg";
import { Query } from "pg";
import { ResultSet } from "pg";
/**
 * node-postgres mocks
 */
export declare class ClientMock implements PgClient {
    connected: boolean;
    queries: any[];
    constructor(config?: any);
    connect(callback?: (err?: Error, res?: PgClient) => void): void;
    end(callback?: () => void): void;
    query(queryText: string, values: any[], callback?: (err?: Error, res?: PgQueryResult | ResultSet) => void): PgQuery | Query;
}
export declare class QueryMock implements PgQuery {
    text: string;
    constructor(config?: any);
}
export declare class PoolMock {
}
