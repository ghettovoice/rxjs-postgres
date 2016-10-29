"use strict";
var assert = require("assert");
var Rx = require("rx");
var RxClient_1 = require("./RxClient");
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
    /**
     * @return {Rx.Observable<RxClient>}
     */
    RxPool.prototype.connect = function () {
        var connect = Rx.Observable.fromNodeCallback(this._pool.connect, this._pool);
        return connect().map(function (client) { return new RxClient_1.default(client); });
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
        var end = Rx.Observable.fromNodeCallback(this._pool.end, this._pool);
        return end().map(function () { return _this; });
    };
    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<ResultSet>}
     */
    RxPool.prototype.query = function (queryText, values) {
        var query = Rx.Observable.fromNodeCallback(this._pool.query, this._pool);
        return query(queryText, values);
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
