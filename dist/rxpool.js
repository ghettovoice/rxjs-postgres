"use strict";
var Rx = require("rx");
var rxclient_1 = require("./rxclient");
var errors_1 = require("./errors");
/**
 * RxJs decorator for `pg.Pool`.
 * todo implement as Rx.Disposable!
 */
var RxPool = (function () {
    /**
     * @param {Pool} pool
     */
    function RxPool(pool) {
        this._pool = pool;
    }
    Object.defineProperty(RxPool.prototype, "pool", {
        get: function () {
            return this._pool;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @return {Rx.Observable<RxClient>}
     */
    RxPool.prototype.connect = function () {
        return Rx.Observable.fromPromise(this._pool.connect())
            .map(function (client) { return new rxclient_1.RxClient(client); });
    };
    /**
     * @return {Rx.Observable<void>}
     */
    RxPool.prototype.end = function () {
        return Rx.Observable.fromPromise(this._pool.end());
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
        if (this._lastTransactionClient) {
            return this.rollback(true)
                .flatMap(function (client) { return client.begin(); });
        }
        return this.connect()
            .flatMap(function (client) {
            _this._lastTransactionClient = client;
            return client.begin();
        });
    };
    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {RxPoolError}
     */
    RxPool.prototype.commit = function (force) {
        if (!this._lastTransactionClient) {
            throw new errors_1.RxPoolError('There is no client with opened transaction');
        }
        return this._lastTransactionClient.commit(force);
    };
    /**
     * @param {boolean} [force] Rollback transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {RxPoolError}
     */
    RxPool.prototype.rollback = function (force) {
        if (!this._lastTransactionClient) {
            throw new errors_1.RxPoolError('There is no client with opened transaction');
        }
        return this._lastTransactionClient.rollback(force);
    };
    return RxPool;
}());
exports.RxPool = RxPool;
