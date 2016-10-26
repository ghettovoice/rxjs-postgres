"use strict";
const Pool = require("pg-pool");
const assert = require("assert");
const Rx = require("rx");
const rxclient_1 = require("./rxclient");
const errors_1 = require("../errors");
const util = require('../util');
const connect = Rx.Observable.fromNodeCallback(Pool.prototype.connect);
const query = Rx.Observable.fromNodeCallback(Pool.prototype.query);
const end = Rx.Observable.fromNodeCallback(Pool.prototype.end);
/**
 * Standalone RxJs adapter for `pg.Pool`.
 */
class RxPool {
    /**
     * @param {Pool} pool
     */
    constructor(pool) {
        if (!(this instanceof RxPool)) {
            return new RxPool(pool);
        }
        if (typeof pool.query !== 'function') {
            throw new errors_1.RxPoolError('First argument should be instance of Pool type from "pg-pool" package');
        }
        this._pool = pool;
        this._disposed = false;
    }
    get pool() {
        return this._pool;
    }
    get tclient() {
        return this._tclient;
    }
    get isDisposed() {
        return this._disposed;
    }
    dispose() {
        if (!this._disposed) {
            // TODO Implement ! Where to nullify tclient?
            this._disposed = true;
        }
    }
    /**
     * @return {Rx.Observable<RxClient>}
     */
    connect() {
        return util.call(connect, this._pool)
            .map((client) => new rxclient_1.default(client));
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
        return util.call(end, this._pool)
            .map(() => this);
    }
    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<ResultSet>}
     */
    query(queryText, values) {
        return util.call(query, this._pool, queryText, values);
    }
    /**
     * @return {Rx.Observable<RxClient>}
     */
    begin() {
        const observable = this._tclient ?
            Rx.Observable.return(this._tclient) :
            this.connect();
        return observable.flatMap((client) => {
            this._tclient = client;
            return client.begin();
        });
    }
    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    commit(force) {
        assert(this._tclient, 'Transaction client exists');
        return this._tclient.commit(force);
    }
    /**
     * @param {boolean} [force] Rollback transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    rollback(force) {
        assert(this._tclient, 'Transaction client exists');
        return this._tclient.rollback(force);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RxPool;
