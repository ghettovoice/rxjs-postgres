import pg from 'pg';
import * as Rx from 'rx';
import RxClient from './RxClient';
import { RxPoolError } from '../errors';

/**
 * Standalone RxJs adapter for `pg.Pool`.
 */
export default class RxPool {
    /**
     * @param {pg.Pool} pool
     */
    constructor(pool) {
        if (!(pool instanceof pg.Pool)) {
            throw new RxPoolError('Pool must be instance of pg.Pool class');
        }

        /**
         * @type {pg.Pool}
         * @private
         */
        this._pool = pool;
        /**
         * @type {Rx.ConnectableObservable<RxClient>}
         * @private
         */
        this._tclientSource = undefined;
    }

    /**
     * @return {pg.Pool}
     */
    get pool() {
        return this._pool;
    }

    /**
     * @return {Rx.Observable<RxClient>}
     */
    connect() {
        return Rx.Observable.fromPromise(this._pool.connect())
            .map(client => new RxClient(client));
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
        return Rx.Observable.fromPromise(this._pool.end())
            .map(() => this);
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
        if (!this._tclientSource) {
            this._tclientSource = this.connect().shareReplay(1);
        }

        return this._tclientSource.flatMap(
            rxClient => rxClient.begin(),
            () => this
        );
    }

    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxPool>}
     * @throws {RxPoolError}
     */
    commit(force) {
        if (!this._tclientSource) {
            throw new RxPoolError('Client with open transaction does not exists');
        }
        // todo release when tlevel = 0
        return this._tclientSource.flatMap(rxClient => rxClient.commit(force))
            .do(rxClient => {
                if (!rxClient.tlevel) {
                    rxClient.release();
                    this._tclientSource = null;
                }
            });
    }

    /**
     * @param {boolean} [force] Rollback transaction with all savepoints.
     * @return {Rx.Observable<RxPool>}
     * @throws {RxPoolError}
     */
    rollback(force) {
        if (!this._tclientSource) {
            throw new RxPoolError('Client with open transaction does not exists');
        }
        // todo release when tlevel = 0
        return this._tclientSource.flatMap(
            rxClient => rxClient.rollback(force),
            () => this
        );
        ;
    }
}
