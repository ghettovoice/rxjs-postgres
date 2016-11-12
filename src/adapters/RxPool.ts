import Pool = require("pg-pool");
import { ResultSet } from "pg";
import * as Rx from "rx";
import RxClient from "./RxClient";
import { PgPool, PgClient } from "../pg";
import { RxPoolError } from "../errors";

/**
 * Standalone RxJs adapter for `pg.Pool`.
 */
export default class RxPool {
    private _pool : PgPool;
    private _tclient : RxClient;

    /**
     * @param {Pool} pool
     */
    constructor(pool : Pool | PgPool) {
        /* istanbul ignore if */
        if (!(this instanceof RxPool)) {
            return new RxPool(pool);
        }

        this._pool = <PgPool>pool;
    }

    get pool() : Pool | PgPool {
        return this._pool;
    }

    get tclient() : RxClient {
        return this._tclient;
    }

    /**
     * @return {Rx.Observable<RxClient>}
     */
    connect() : Rx.Observable<RxClient> {
        return Rx.Observable.fromPromise<PgClient>(this._pool.connect())
            .map<RxClient>((client : PgClient) => new RxClient(client));
    }

    /**
     * @return {Rx.Observable<RxClient>}
     */
    take() : Rx.Observable<RxClient> {
        return this.connect();
    }

    /**
     * @return {Rx.Observable<RxPool>}
     */
    end() : Rx.Observable<RxPool> {
        return Rx.Observable.fromPromise<void>(this._pool.end())
            .map<RxPool>(() => this);
    }

    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<ResultSet>}
     */
    query(queryText : string, values? : any[]) : Rx.Observable<ResultSet> {
        return Rx.Observable.fromPromise<ResultSet>(this._pool.query(queryText, values));
    }

    /**
     * @return {Rx.Observable<RxClient>}
     */
    begin() : Rx.Observable<RxClient> {
        const observable = this._tclient ?
                           Rx.Observable.return<RxClient>(this._tclient) :
                           this.connect();

        return observable.flatMap<RxClient>((client : RxClient) => {
                this._tclient = client;

                return client.begin();
            });
    }

    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    commit(force? : boolean) : Rx.Observable<RxClient> {
        if (!this._tclient) {
            throw new RxPoolError('Client with open transaction does not exists');
        }

        return this._tclient.commit(force);
    }

    /**
     * @param {boolean} [force] Rollback transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    rollback(force? : boolean) : Rx.Observable<RxClient> {
        if (!this._tclient) {
            throw new RxPoolError('Client with open transaction does not exists');
        }

        return this._tclient.rollback(force);
    }
}
