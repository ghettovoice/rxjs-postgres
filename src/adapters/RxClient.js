import pg from 'pg';
import Rx from 'rxjs';
import { RxClientError } from '../errors';
import * as util from '../util';

/**
 * Standalone RxJs adapter for `pg.Client`.
 */
export default class RxClient {
    /**
     * @param {Client} client
     */
    constructor(client) {
        if (!(client instanceof pg.Client)) {
            throw new RxClientError('Client must be instance of Client class');
        }

        /**
         * @type {Client}
         * @private
         */
        this._client = client;
        /**
         * @type {number}
         * @private
         */
        this._tlevel = 0;
    }

    /**
     * @type {Client}
     */
    get client() {
        return this._client;
    }

    /**
     * @type {number}
     */
    get tlevel() {
        return this._tlevel;
    }

    /**
     * @return {boolean}
     */
    get connected() {
        return this._client.connection.stream.readyState === 'open';
    }

    /**
     * @return {Observable<RxClient>}
     */
    connect() {
        if (this.connected) {
            return Rx.Observable.of(this);
        }

        const connect = Rx.Observable.bindNodeCallback(::this._client.connect, () => this);

        return connect().do(() => util.log('RxClient: client connected'));
    }

    /**
     * @return {Observable<RxClient>}
     */
    end() {
        if (!this.connected) {
            return Rx.Observable.of(this);
        }

        const end = Rx.Observable.bindNodeCallback(::this._client.end, () => this);
        this._tlevel = 0;

        return end().do(() => util.log('RxClient: client ended'));
    }

    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Observable<Object>}
     */
    query(queryText, values) {
        return this.connect()
            .flatMap(() => {
                const query = Rx.Observable.bindNodeCallback(::this._client.query);

                return query(queryText, values);
            })
            .do(() => util.log('RxClient: query executed', queryText));
    }

    // /**
    //  * @return {Rx.Observable<RxClient>}
    //  */
    // begin() {
    //     assert(this._tlevel >= 0, 'Current transaction level >= 0');
    //
    //     util.log('begin transaction');
    //      // todo doOnError => reset tlevel
    //     this._transactionSource = (this._transactionSource || Rx.Observable.return(null))
    //         .flatMap(() => {
    //             let query;
    //
    //             if (this._tlevel === 0) {
    //                 query = 'begin';
    //             } else {
    //                 query = `savepoint point_${this._tlevel}`;
    //             }
    //
    //             return this.query(query);
    //         })
    //         .do(() => {
    //             ++this._tlevel;
    //
    //             util.log('transaction started', this._tlevel);
    //         })
    //         .map(() => this)
    //         .shareReplay(1);
    //
    //     return this._transactionSource;
    // }
    //
    // /**
    //  * @param {boolean} [force] Commit transaction with all savepoints.
    //  * @return {Rx.Observable<RxClient>}
    //  * @throws {RxClientError}
    //  */
    // commit(force) {
    //     assert(this._tlevel >= 0, 'Current transaction level >= 0');
    //
    //     if (!this._transactionSource) {
    //         throw new RxClientError('The transaction is not open on the client');
    //     }
    //
    //     util.log('commit transaction');
    //
    //     this._transactionSource = this._transactionSource.flatMap(() => {
    //         if (this._tlevel === 0) {
    //             throw new RxClientError('The transaction is not open on the client');
    //         }
    //
    //         /** @type {Rx.Observable} */
    //         let source;
    //
    //         if (this._tlevel === 1 || force) {
    //             source = this.query('commit')
    //                 .do(() => {
    //                     util.log(`transaction committed ${force ? '(force)' : ''}`, this._tlevel);
    //
    //                     this._tlevel = 0;
    //                     this._transactionSource = undefined;
    //                 });
    //         } else {
    //             source = this.query(`release savepoint point_${this._tlevel - 1}`)
    //                 .do(() => {
    //                     util.log('transaction committed', this._tlevel);
    //
    //                     --this._tlevel;
    //                 });
    //         }
    //
    //         return source;
    //     }).map(() => this)
    //         .shareReplay(1);
    //
    //
    //     return this._transactionSource;
    // }
    //
    // /**
    //  * @param {boolean} [force] Rollback transaction with all savepoints.
    //  * @return {Rx.Observable<RxClient>}
    //  * @throws {RxClientError}
    //  */
    // rollback(force) {
    //     assert(this._tlevel >= 0, 'Current transaction level >= 0');
    //
    //     if (!this._transactionSource) {
    //         throw new RxClientError('The transaction is not open on the client');
    //     }
    //
    //     util.log('rollback transaction');
    //
    //     this._transactionSource = this._transactionSource.flatMap(() => {
    //         if (this._tlevel === 0) {
    //             throw new RxClientError('The transaction is not open on the client');
    //         }
    //
    //         /** @type {Rx.Observable} */
    //         let source;
    //
    //         if (this._tlevel === 1 || force) {
    //             source = this.query('rollback')
    //                 .do(() => {
    //                     util.log(`transaction rolled back ${force ? '(force)' : ''}`, this._tlevel);
    //
    //                     this._tlevel = 0;
    //                     this._transactionSource = undefined;
    //                 });
    //         } else {
    //             source = this.query(`rollback to savepoint point_${this._tlevel - 1}`)
    //                 .do(() => {
    //                     util.log('transaction rolled back', this._tlevel);
    //
    //                     --this._tlevel;
    //                 });
    //         }
    //
    //         return source;
    //     }).map(() => this)
    //         .shareReplay(1);
    //
    //     return this._transactionSource;
    // }
}
