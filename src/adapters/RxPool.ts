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
    private _obs : Rx.Observable<RxClient>;

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
     * @return {Rx.Observable<RxPool>}
     */
    begin() : Rx.Observable<RxPool> {
        // const observable = this._tclient ?
        //                    Rx.Observable.return<RxClient>(this._tclient) :
        //                    this.connect().doOnNext((rxClient : RxClient) => this._tclient = rxClient);
        //
        // return observable.flatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
        //     .map<RxPool>(() => this);
        // todo test test test
        this._obs = this._obs || this.connect().doOnNext((rxClient : RxClient) => (console.log(1),this._tclient = rxClient)).shareReplay(1);

        return this._obs.flatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .map<RxPool>(() => this);
    }

    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxPool>}
     * @throws {RxPoolError}
     */
    commit(force? : boolean) : Rx.Observable<RxPool> {
        if (!this._tclient) {
            throw new RxPoolError('Client with open transaction does not exists');
        }

        return this._tclient.commit(force)
            .map<RxPool>(() => this);
    }

    /**
     * @param {boolean} [force] Rollback transaction with all savepoints.
     * @return {Rx.Observable<RxPool>}
     * @throws {RxPoolError}
     */
    rollback(force? : boolean) : Rx.Observable<RxPool> {
        if (!this._tclient) {
            throw new RxPoolError('Client with open transaction does not exists');
        }

        return this._tclient.rollback(force)
            .map<RxPool>(() => this);
    }
}
