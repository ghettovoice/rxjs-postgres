"use strict";
var assert = require("assert");
var Rx = require("rx");
var errors_1 = require("../errors");
/**
 * Standalone RxJs adapter for `pg.Client`.
 */
var RxClient = (function () {
    /**
     * @param {PgClient | Client} client
     */
    function RxClient(client) {
        /* istanbul ignore if */
        if (!(this instanceof RxClient)) {
            return new RxClient(client);
        }
        this._client = client;
        this._tlevel = 0;
        this._disposed = false;
    }
    Object.defineProperty(RxClient.prototype, "client", {
        get: function () {
            return this._client;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RxClient.prototype, "tlevel", {
        get: function () {
            return this._tlevel;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RxClient.prototype, "isDisposed", {
        get: function () {
            return this._disposed;
        },
        enumerable: true,
        configurable: true
    });
    RxClient.prototype.release = function () {
        typeof this._client.release === 'function' && this._client.release();
    };
    RxClient.prototype.dispose = function () {
        if (!this._disposed) {
            this.release();
            this._disposed = true;
        }
    };
    /**
     * @return {Rx.Observable<RxClient>}
     */
    RxClient.prototype.connect = function () {
        var _this = this;
        var connect = Rx.Observable.fromNodeCallback(this._client.connect, this._client);
        return connect().map(function (client) { return _this; });
    };
    /**
     * @return {Rx.Observable<RxClient>}
     */
    RxClient.prototype.end = function () {
        var _this = this;
        var end = Rx.Observable.fromNodeCallback(this._client.end, this._client);
        return end().map(function () { return _this; });
    };
    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<ResultSet>}
     */
    RxClient.prototype.query = function (queryText, values) {
        var query = Rx.Observable.fromNodeCallback(this._client.query, this._client);
        return query(queryText, values);
    };
    /**
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    RxClient.prototype.begin = function () {
        var _this = this;
        assert(this._tlevel >= 0, 'Current transaction level >= 0');
        var query;
        if (this._tlevel === 0) {
            query = 'begin';
        }
        else {
            query = "savepoint point_" + this._tlevel;
        }
        //noinspection CommaExpressionJS
        return this.query(query)
            .map(function () { return (++_this._tlevel, _this); });
    };
    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    RxClient.prototype.commit = function (force) {
        var _this = this;
        assert(this._tlevel >= 0, 'Current transaction level >= 0');
        if (this._tlevel === 0) {
            throw new errors_1.RxClientError('No opened transaction on the client, nothing to commit');
        }
        if (this._tlevel === 1 || force) {
            //noinspection CommaExpressionJS
            return this.query('commit')
                .map(function () { return (_this._tlevel = 0, _this); });
        }
        //noinspection CommaExpressionJS
        return this.query("release savepoint point_" + (this._tlevel - 1))
            .map(function () { return (--_this._tlevel, _this); });
    };
    /**
     * @param {boolean} [force] Rollback transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    RxClient.prototype.rollback = function (force) {
        var _this = this;
        assert(this._tlevel >= 0, 'Current transaction level >= 0');
        if (this._tlevel === 0) {
            throw new errors_1.RxClientError('No opened transaction on the client, nothing to rollback');
        }
        if (this._tlevel === 1 || force) {
            //noinspection CommaExpressionJS
            return this.query('rollback')
                .map(function () { return (_this._tlevel = 0, _this); });
        }
        //noinspection CommaExpressionJS
        return this.query("rollback to savepoint point_" + (this._tlevel - 1))
            .map(function () { return (--_this._tlevel, _this); });
    };
    return RxClient;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RxClient;
