"use strict";
var Rx = require("rx");
var RxClient_1 = require("./RxClient");
var errors_1 = require("../errors");
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
        return Rx.Observable.fromPromise(this._pool.connect())
            .map(function (client) { return new RxClient_1.default(client); });
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
     * @return {Rx.Observable<ResultSet>}
     */
    RxPool.prototype.query = function (queryText, values) {
        return Rx.Observable.fromPromise(this._pool.query(queryText, values));
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
        if (!this._tclient) {
            throw new errors_1.RxPoolError('Client with open transaction does not exists');
        }
        return this._tclient.commit(force);
    };
    /**
     * @param {boolean} [force] Rollback transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    RxPool.prototype.rollback = function (force) {
        if (!this._tclient) {
            throw new errors_1.RxPoolError('Client with open transaction does not exists');
        }
        return this._tclient.rollback(force);
    };
    return RxPool;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RxPool;
