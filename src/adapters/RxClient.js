import assert from 'assert';
import pg from 'pg';
import * as Rx from 'rx';
import { RxClientError } from '../errors';

/**
 * Standalone RxJs adapter for `pg.Client`.
 */
export default class RxClient {
    /**
     * @param {pg.Client} client
     */
    constructor(client) {
        if (!(client instanceof pg.Client)) {
            throw new RxClientError('Client must be instance of pg.Client class');
        }

        /**
         * @type {pg.Client}
         * @private
         */
        this._client = client;
        /**
         * @type {number}
         * @private
         */
        this._tlevel = 0;
        /**
         * @type {boolean}
         * @private
         */
        this._disposed = false;
    }

    /**
     * @type {pg.Client}
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
     * @type {boolean}
     */
    get isDisposed() {
        return this._disposed;
    }

    /**
     * @return {boolean}
     */
    get connected() {
        return this._client.connection.stream.readyState === 'open';
    }

    release() {
        typeof this._client.release === 'function' && this._client.release();
    }

    dispose() {
        if (!this._disposed) {
            this.release();
            this._disposed = true;
        }
    }

    /**
     * @return {Rx.Observable<RxClient>}
     */
    connect() {
        if (this.connected) {
            return Rx.Observable.return(this);
        }

        const connect = Rx.Observable.fromNodeCallback(this._client.connect, this._client);

        return connect().map(() => this);
    }

    /**
     * @return {Rx.Observable<RxClient>}
     */
    end() {
        const end = Rx.Observable.fromNodeCallback(this._client.end, this._client);

        return end().map(() => this);
    }

    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<Object>}
     */
    query(queryText, values) {
        const query = Rx.Observable.fromNodeCallback(this._client.query, this._client);

        return this.connect().flatMap(() => query(queryText, values));
    }

    /**
     * @return {Rx.Observable<RxClient>}
     */
    begin() {
        assert(this._tlevel >= 0, 'Current transaction level >= 0');

        let query;

        if (this._tlevel === 0) {
            query = 'begin';
        } else {
            query = `savepoint point_${this._tlevel}`;
        }

        //noinspection CommaExpressionJS
        return this.query(query).map(() => (++this._tlevel, this));
    }

    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {RxClientError}
     */
    commit(force) {
        assert(this._tlevel >= 0, 'Current transaction level >= 0');

        if (this._tlevel === 0) {
            throw new RxClientError('The transaction is not open on the client');
        }

        if (this._tlevel === 1 || force) {
            //noinspection CommaExpressionJS
            return this.query('commit').map(() => (this._tlevel = 0, this));
        }

        //noinspection CommaExpressionJS
        return this.query(`release savepoint point_${this._tlevel - 1}`)
            .map(() => (--this._tlevel, this));
    }

    /**
     * @param {boolean} [force] Rollback transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {RxClientError}
     */
    rollback(force) {
        assert(this._tlevel >= 0, 'Current transaction level >= 0');

        if (this._tlevel === 0) {
            throw new RxClientError('The transaction is not open on the client');
        }

        if (this._tlevel === 1 || force) {
            //noinspection CommaExpressionJS
            return this.query('rollback').map(() => (this._tlevel = 0, this));
        }

        //noinspection CommaExpressionJS
        return this.query(`rollback to savepoint point_${this._tlevel - 1}`)
            .map(() => (--this._tlevel, this));
    }
}
