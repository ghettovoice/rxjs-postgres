import Pool = require("pg-pool");
import { ResultSet } from "pg";
import * as Rx from "rx";
import RxClient from "./rxclient";
/**
 * Standalone RxJs adapter for `pg.Pool`.
 */
export default class RxPool implements Rx.Disposable {
    private _pool;
    private _tclient;
    private _disposed;
    /**
     * @param {Pool} pool
     */
    constructor(pool: Pool);
    readonly pool: Pool;
    readonly tclient: RxClient;
    readonly isDisposed: boolean;
    dispose(): void;
    /**
     * @return {Rx.Observable<RxClient>}
     */
    connect(): Rx.Observable<RxClient>;
    /**
     * @return {Rx.Observable<RxClient>}
     */
    take(): Rx.Observable<RxClient>;
    /**
     * @return {Rx.Observable<RxPool>}
     */
    end(): Rx.Observable<RxPool>;
    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<ResultSet>}
     */
    query(queryText: string, values?: any[]): Rx.Observable<ResultSet>;
    /**
     * @return {Rx.Observable<RxClient>}
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