import pg from 'pg';
import Rx from 'rxjs';
import RxClient from './RxClient';
import { RxPoolError } from '../errors';
import * as util from '../util';

/**
 * Standalone RxJs adapter for `pg.Pool`.
 */
export default class RxPool {
    /**
     * @param {Pool} pool
     */
    constructor(pool) {
        if (!(pool instanceof pg.Pool)) {
            throw new RxPoolError('Pool must be instance of Pool class');
        }

        /**
         * @type {Pool}
         * @private
         */
        this._pool = pool;
    }

    /**
     * @return {Pool}
     */
    get pool() {
        return this._pool;
    }

    /**
     * @return {Observable<RxClient>}
     */
    connect() {
        return Rx.Observable.fromPromise(this._pool.connect())
            .map(client => {
                const rxClient = new RxClient(client);

                rxClient.release = function (err) {
                    util.log('RxClient: release');

                    delete rxClient.release;
                    client.release(err);
                };

                return rxClient;
            })
            .do(() => util.log('RxPool: client connected'));
    }

    /**
     * @return {Observable<RxClient>}
     */
    take() {
        return this.connect();
    }

    /**
     * @return {Observable<RxPool>}
     */
    end() {
        return Rx.Observable.fromPromise(this._pool.end())
            .map(() => this)
            .do(() => util.log('RxPool: pool ended'));
    }

    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<Object>}
     */
    query(queryText, values) {
        return Rx.Observable.fromPromise(this._pool.query(queryText, values))
            .do(() => util.log('RxPool: query executed'));
    }

    // /**
    //  * @return {Rx.Observable<RxPool>}
    //  */
    // begin() {
    //     this._tclientSource = (this._tclientSource || this.connect())
    //         .flatMap(rxClient => rxClient.begin())
    //         .shareReplay(1);
    //
    //     return this._tclientSource.map(() => this);
    // }
    //
    // /**
    //  * @param {boolean} [force] Commit transaction with all savepoints.
    //  * @return {Rx.Observable<RxPool>}
    //  * @throws {RxPoolError}
    //  */
    // commit(force) {
    //     if (!this._tclientSource) {
    //         throw new RxPoolError('Client with open transaction does not exists');
    //     }
    //
    //     this._tclientSource = this._tclientSource.flatMap(rxClient => rxClient.commit(force))
    //         .do(rxClient => {
    //             if (rxClient.tlevel === 0) {
    //                 this._tclientSource = undefined;
    //             }
    //         })
    //         .shareReplay(1);
    //
    //     return this._tclientSource.map(() => this);
    // }
    //
    // /**
    //  * @param {boolean} [force] Rollback transaction with all savepoints.
    //  * @return {Rx.Observable<RxPool>}
    //  * @throws {RxPoolError}
    //  */
    // rollback(force) {
    //     if (!this._tclientSource) {
    //         throw new RxPoolError('Client with open transaction does not exists');
    //     }
    //
    //     this._tclientSource = this._tclientSource.flatMap(rxClient => rxClient.rollback(force))
    //         .do(rxClient => {
    //             if (rxClient.tlevel === 0) {
    //                 this._tclientSource = undefined;
    //             }
    //         })
    //         .shareReplay(1);
    //
    //     return this._tclientSource.map(() => this);
    // }
}
