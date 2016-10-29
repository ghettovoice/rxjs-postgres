import { Client, ResultSet } from "pg";
import * as Rx from "rx";
import { PgClient } from "../pg";
/**
 * Standalone RxJs adapter for `pg.Client`.
 */
export default class RxClient implements Rx.Disposable {
    private _client;
    private _tlevel;
    private _disposed;
    /**
     * @param {PgClient | Client} client
     */
    constructor(client: PgClient | Client);
    readonly client: Client | PgClient;
    readonly tlevel: number;
    readonly isDisposed: boolean;
    release(): void;
    dispose(): void;
    /**
     * @return {Rx.Observable<RxClient>}
     */
    connect(): Rx.Observable<RxClient>;
    /**
     * @return {Rx.Observable<RxClient>}
     */
    end(): Rx.Observable<RxClient>;
    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<ResultSet>}
     */
    query(queryText: string, values?: any[]): Rx.Observable<ResultSet>;
    /**
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    begin(): Rx.Observable<RxClient>;
    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    commit(force?: boolean): Rx.Observable<RxClient>;
    /**
     * @param {boolean} [force] Rollback transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    rollback(force?: boolean): Rx.Observable<RxClient>;
}
