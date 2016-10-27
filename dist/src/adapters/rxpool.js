"use strict";
var Pool = require("pg-pool");
var assert = require("assert");
var Rx = require("rx");
var rxclient_1 = require("./rxclient");
var util = require('../util');
var connect = Rx.Observable.fromNodeCallback(Pool.prototype.connect);
var query = Rx.Observable.fromNodeCallback(Pool.prototype.query);
var end = Rx.Observable.fromNodeCallback(Pool.prototype.end);
/**
 * Standalone RxJs adapter for `pg.Pool`.
 */
var RxPool = (function () {
    /**
     * @param {Pool} pool
     */
    function RxPool(pool) {
        /* istanbul ignore if */
        if (!(this instanceof RxPool)) {
            return new RxPool(pool);
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
        return util.call(connect, this._pool)
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
        return util.call(end, this._pool)
            .map(function () { return _this; });
    };
    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<ResultSet>}
     */
    RxPool.prototype.query = function (queryText, values) {
        return util.call(query, this._pool, queryText, values);
    };
    /**
     * @return {Rx.Observable<RxClient>}
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
