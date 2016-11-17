import { Pool } from 'pg';
import * as Rx from "rx";
import RxClient from "./RxClient";
import { RxPoolError } from "../errors";

/**
 * Standalone RxJs adapter for `pg.Pool`.
 */
export default class RxPool {
    /**
     * @param {Pool} pool
     */
    constructor(pool) {
        /* istanbul ignore if */
        if (!(this instanceof RxPool)) {
            return new RxPool(pool);
        }

        if (!(pool instanceof Pool)) {
            throw new RxPoolError('Pool must be instance of pg.Pool class');
        }

        this._pool = pool;
        this._tclient = undefined;
    }

    get pool() {
        return this._pool;
    }

    get tclient() {
        return this._tclient;
    }

    /**
     * @return {Rx.Observable<RxClient>}
     */
    connect() {
        return Rx.Observable.fromPromise(this._pool.connect()).map(client => new RxClient(client));
    }

    /**
     * @return {Rx.Observable<RxClient>}
     */
    take() {
        return this.connect();
    }

    /**
     * @return {Rx.Observable<RxPool>}
     */
    end() {
        return Rx.Observable.fromPromise(this._pool.end()).map(() => this);
    }

    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<Object>}
     */
    query(queryText, values) {
        return Rx.Observable.fromPromise(this._pool.query(queryText, values));
    }

    /**
     * @return {Rx.Observable<RxPool>}
     */
    begin() {
        // const observable = this._tclient ?
        //                    Rx.Observable.return<RxClient>(this._tclient) :
        //                    this.connect().doOnNext((rxClient : RxClient) => this._tclient = rxClient);
        //
        // return observable.flatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
        //     .map<RxPool>(() => this);
        // todo test test test
        this._obs = this._obs || this.connect().doOnNext(rxClient => (console.log(1), this._tclient = rxClient)).shareReplay(1);

        return this._obs.flatMap(rxClient => rxClient.begin()).map(() => this);
    }

    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxPool>}
     * @throws {RxPoolError}
     */
    commit(force) {
        if (!this._tclient) {
            throw new RxPoolError('Client with open transaction does not exists');
        }

        return this._tclient.commit(force).map(() => this);
    }

    /**
     * @param {boolean} [force] Rollback transaction with all savepoints.
     * @return {Rx.Observable<RxPool>}
     * @throws {RxPoolError}
     */
    rollback(force) {
        if (!this._tclient) {
            throw new RxPoolError('Client with open transaction does not exists');
        }

        return this._tclient.rollback(force).map(() => this);
    }
}
