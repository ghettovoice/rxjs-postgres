"use strict";
var Rx = require("rx");
var errors_1 = require("./errors");
/**
 * RxJs decorator for `pg.Client`.
 * todo implement as Rx.Disposable!
 */
var RxClient = (function () {
    /**
     * @param {Client} client
     */
    function RxClient(client) {
        this._transactionLevel = 0;
        this._client = client;
    }
    Object.defineProperty(RxClient.prototype, "client", {
        get: function () {
            return this._client;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<QueryResult>}
     */
    RxClient.prototype.query = function (queryText, values) {
        return Rx.Observable.fromPromise(this._client.query(queryText, values));
    };
    /**
     * @return {Rx.Observable<RxClient>}
     * @throws {RxClientError}
     */
    RxClient.prototype.begin = function () {
        var _this = this;
        if (this._transactionLevel < 0) {
            throw new errors_1.RxClientError('Transaction chain is broken');
        }
        var query;
        if (this._transactionLevel === 0) {
            query = 'begin';
        }
        else if (this._transactionLevel > 1) {
            query = "savepoint point_" + this._transactionLevel;
        }
        return this.query(query)
            .map(function () { return (++_this._transactionLevel, _this); });
    };
    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {RxClientError}
     */
    RxClient.prototype.commit = function (force) {
        var _this = this;
        if (this._transactionLevel < 0) {
            throw new errors_1.RxClientError('Transaction chain is broken');
        }
        if (this._transactionLevel === 1 || force) {
            return this.query('commit')
                .map(function () { return (_this._transactionLevel = 0, _this); });
        }
        else if (this._transactionLevel > 1) {
            return this.query("release savepoint point_" + this._transactionLevel)
                .map(function () { return (--_this._transactionLevel, _this); });
        }
    };
    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {RxClientError}
     */
    RxClient.prototype.rollback = function (force) {
        var _this = this;
        if (this._transactionLevel < 0) {
            throw new errors_1.RxClientError('Transaction chain is broken');
        }
        if (this._transactionLevel === 1 || force) {
            return this.query('rollback')
                .map(function () { return (_this._transactionLevel = 0, _this); });
        }
        else if (this._transactionLevel > 1) {
            return this.query("rollback to savepoint point_" + this._transactionLevel)
                .map(function () { return (--_this._transactionLevel, _this); });
        }
    };
    return RxClient;
}());
exports.RxClient = RxClient;
