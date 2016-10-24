"use strict";
var assert = require("assert");
var Rx = require("rx");
var rxclient_1 = require("./rxclient");
var errors_1 = require("../errors");
/**
 * Standalone RxJs adapter for `pg.Pool`.
 */
var RxPool = (function () {
    /**
     * @param {Pool} pool
     */
    function RxPool(pool) {
        if (!(this instanceof RxPool)) {
            return new RxPool(pool);
        }
        if (typeof pool.query !== 'function') {
            throw new errors_1.RxPoolError('First argument should be instance of Pool type from "pg-pool" package');
        }
        this._pool = pool;
        this._disposed = false;
    }
    Object.defineProperty(RxPool.prototype, "pool", {
        get: function () {
            return this._pool;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RxPool.prototype, "tclient", {
        get: function () {
            return this._tclient;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RxPool.prototype, "isDisposed", {
        get: function () {
            return this._disposed;
        },
        enumerable: true,
        configurable: true
    });
    RxPool.prototype.dispose = function () {
        if (!this._disposed) {
            // TODO Implement ! Where to nullify tclient?
            this._disposed = true;
        }
    };
    /**
     * @return {Rx.Observable<RxClient>}
     */
    RxPool.prototype.connect = function () {
        return Rx.Observable.fromPromise(this._pool.connect())
            .map(function (client) { return new rxclient_1.default(client); });
    };
    /**
     * @return {Rx.Observable<RxClient>}
     */
    RxPool.prototype.take = function () {
        return this.connect();
    };
    /**
     * @return {Rx.Observable<RxPool>}
     */
    RxPool.prototype.end = function () {
        var _this = this;
        return Rx.Observable.fromPromise(this._pool.end())
            .map(function () { return _this; });
    };
    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<QueryResult>}
     */
    RxPool.prototype.query = function (queryText, values) {
        return this.connect()
            .flatMap(function (client) { return client.query(queryText, values); });
    };
    /**
     * @return {Observable<RxClient>}
     */
    RxPool.prototype.begin = function () {
        var _this = this;
        var observable = this._tclient ?
            Rx.Observable.return(this._tclient) :
            this.connect();
        return observable.flatMap(function (client) {
            _this._tclient = client;
            return client.begin();
        });
    };
    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    RxPool.prototype.commit = function (force) {
        assert(this._tclient, 'Transaction client exists');
        return this._tclient.commit(force);
    };
    /**
     * @param {boolean} [force] Rollback transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    RxPool.prototype.rollback = function (force) {
        assert(this._tclient, 'Transaction client exists');
        return this._tclient.rollback(force);
    };
    return RxPool;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RxPool;
