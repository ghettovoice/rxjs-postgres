import { Pool } from "pg-pool";
import { Client, QueryResult } from "pg";
import * as Rx from "rx";
import { RxClient } from "./rxclient";
import { RxPoolError } from "./errors";

/**
 * RxJs decorator for `pg.Pool`.
 * todo implement as Rx.Disposable!
 */
export class RxPool {
    private _pool : Pool;
    private _lastTransactionClient : RxClient;

    /**
     * @param {Pool} pool
     */
    constructor(pool : Pool) {
        this._pool = pool;
    }

    get pool() : Pool {
        return this._pool;
    }

    /**
     * @return {Rx.Observable<RxClient>}
     */
    connect() : Rx.Observable<RxClient> {
        return Rx.Observable.fromPromise<Client>(this._pool.connect())
            .map(client => new RxClient(client));
    }

    /**
     * @return {Rx.Observable<void>}
     */
    end() : Rx.Observable<void> {
        return Rx.Observable.fromPromise<void>(this._pool.end());
    }

    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<QueryResult>}
     */
    query(queryText : string, values? : any[]) : Rx.Observable<QueryResult> {
        return this.connect()
            .flatMap<QueryResult>(client => client.query(queryText, values));
    }

    /**
     * @return {Observable<RxClient>}
     */
    begin() : Rx.Observable<RxClient> {
        if (this._lastTransactionClient) {
            return this.rollback(true)
                .flatMap(client => client.begin());
        }

        return this.connect()
            .flatMap<RxClient>(client => {
                this._lastTransactionClient = client;

                return client.begin();
            });
    }

    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {RxPoolError}
     */
    commit(force? : boolean) : Rx.Observable<RxClient> {
        if (!this._lastTransactionClient) {
            throw new RxPoolError('There is no client with opened transaction');
        }

        return this._lastTransactionClient.commit(force);
    }

    /**
     * @param {boolean} [force] Rollback transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {RxPoolError}
     */
    rollback(force? : boolean) : Rx.Observable<RxClient> {
        if (!this._lastTransactionClient) {
            throw new RxPoolError('There is no client with opened transaction');
        }

        return this._lastTransactionClient.rollback(force);
    }
}
