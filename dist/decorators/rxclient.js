"use strict";
var assert = require("assert");
var pg_1 = require("pg");
var Rx = require("rx");
var errors_1 = require("../errors");
var util = require("../util");
var connect = Rx.Observable.fromNodeCallback(pg_1.Client.prototype.connect);
var end = Rx.Observable.fromNodeCallback(pg_1.Client.prototype.end);
/**
 * Standalone RxJs decorator for `pg.Client`.
 */
var RxClient = (function () {
    /**
     * @param {Client} client
     */
    function RxClient(client) {
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
    Object.defineProperty(RxClient.prototype, "disposed", {
        get: function () {
            return this._disposed;
        },
        enumerable: true,
        configurable: true
    });
    RxClient.prototype.release = function () {
        this._client.release();
    };
    RxClient.prototype.dispose = function () {
        if (!this._disposed) {
            this.release();
            this._disposed = true;
        }
    };
    /**
     * @return {Observable<RxClient>}
     */
    RxClient.prototype.connect = function () {
        var _this = this;
        return util.call(connect, this._client)
            .map(function () { return _this; });
    };
    /**
     * @return {Observable<RxClient>}
     */
    RxClient.prototype.end = function () {
        var _this = this;
        return util.call(end, this._client)
            .map(function () { return _this; });
    };
    /**
     * @param {string} query
     * @param {Array} [values]
     * @return {Rx.Observable<QueryResult>}
     */
    RxClient.prototype.query = function (query, values) {
        return Rx.Observable.fromPromise(this._client.query(query, values));
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
        else if (this._tlevel > 1) {
            query = "savepoint point_" + this._tlevel;
        }
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
            return this.query('commit')
                .map(function () { return (_this._tlevel = 0, _this); });
        }
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
            return this.query('rollback')
                .map(function () { return (_this._tlevel = 0, _this); });
        }
        return this.query("rollback to savepoint point_" + (this._tlevel - 1))
            .map(function () { return (--_this._tlevel, _this); });
    };
    return RxClient;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RxClient;
