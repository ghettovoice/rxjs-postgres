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
     * @return {Rx.Observable<RxPool>}
     */
    RxPool.prototype.begin = function () {
        var _this = this;
        // const observable = this._tclient ?
        //                    Rx.Observable.return<RxClient>(this._tclient) :
        //                    this.connect().doOnNext((rxClient : RxClient) => this._tclient = rxClient);
        //
        // return observable.flatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
        //     .map<RxPool>(() => this);
        // todo test test test
        this._obs = this._obs || this.connect().doOnNext(function (rxClient) { return (console.log(1), _this._tclient = rxClient); }).shareReplay(1);
        return this._obs.flatMap(function (rxClient) { return rxClient.begin(); })
            .map(function () { return _this; });
    };
    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxPool>}
     * @throws {RxPoolError}
     */
    RxPool.prototype.commit = function (force) {
        var _this = this;
        if (!this._tclient) {
            throw new errors_1.RxPoolError('Client with open transaction does not exists');
        }
        return this._tclient.commit(force)
            .map(function () { return _this; });
    };
    /**
     * @param {boolean} [force] Rollback transaction with all savepoints.
     * @return {Rx.Observable<RxPool>}
     * @throws {RxPoolError}
     */
    RxPool.prototype.rollback = function (force) {
        var _this = this;
        if (!this._tclient) {
            throw new errors_1.RxPoolError('Client with open transaction does not exists');
        }
        return this._tclient.rollback(force)
            .map(function () { return _this; });
    };
    return RxPool;
}());
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Standalone RxJs adapter for `pg.Pool`.
 */
exports.default = RxPool;
//# sourceMappingURL=RxPool.js.map