"use strict";
const assert = require("assert");
const pg_1 = require("pg");
const Rx = require("rx");
const errors_1 = require("../errors");
const util = require("../util");
const connect = Rx.Observable.fromNodeCallback(pg_1.Client.prototype.connect);
const query = Rx.Observable.fromNodeCallback(pg_1.Client.prototype.query);
const end = Rx.Observable.fromNodeCallback(pg_1.Client.prototype.end);
/**
 * Standalone RxJs adapter for `pg.Client`.
 */
class RxClient {
    /**
     * @param {Client} client
     */
    constructor(client) {
        if (!(this instanceof RxClient)) {
            return new RxClient(client);
        }
        this._client = client;
        this._tlevel = 0;
        this._disposed = false;
    }
    get client() {
        return (this._client);
    }
    get tlevel() {
        return this._tlevel;
    }
    get isDisposed() {
        return this._disposed;
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
     * @return {Observable<RxClient>}
     */
    connect() {
        return util.call(connect, this._client)
            .map(() => this);
    }
    /**
     * @return {Observable<RxClient>}
     */
    end() {
        return util.call(end, this._client)
            .map(() => this);
    }
    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<ResultSet>}
     */
    query(queryText, values) {
        return util.call(query, this._client, queryText, values);
    }
    /**
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    begin() {
        assert(this._tlevel >= 0, 'Current transaction level >= 0');
        let query;
        if (this._tlevel === 0) {
            query = 'begin';
        }
        else if (this._tlevel > 1) {
            query = `savepoint point_${this._tlevel}`;
        }
        return this.query(query)
            .map(() => (++this._tlevel, this));
    }
    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    commit(force) {
        assert(this._tlevel >= 0, 'Current transaction level >= 0');
        if (this._tlevel === 0) {
            throw new errors_1.RxClientError('No opened transaction on the client, nothing to commit');
        }
        if (this._tlevel === 1 || force) {
            return this.query('commit')
                .map(() => (this._tlevel = 0, this));
        }
        return this.query(`release savepoint point_${this._tlevel - 1}`)
            .map(() => (--this._tlevel, this));
    }
    /**
     * @param {boolean} [force] Rollback transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    rollback(force) {
        assert(this._tlevel >= 0, 'Current transaction level >= 0');
        if (this._tlevel === 0) {
            throw new errors_1.RxClientError('No opened transaction on the client, nothing to rollback');
        }
        if (this._tlevel === 1 || force) {
            return this.query('rollback')
                .map(() => (this._tlevel = 0, this));
        }
        return this.query(`rollback to savepoint point_${this._tlevel - 1}`)
            .map(() => (--this._tlevel, this));
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RxClient;
