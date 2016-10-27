"use strict";
/**
 * node-postgres mocks
 */
var ClientMock = (function () {
    function ClientMock(config) {
        this.connected = false;
        this.queries = [];
    }
    ClientMock.prototype.connect = function (callback) {
        var _this = this;
        if (this.connected) {
            return;
        }
        setTimeout(function () {
            _this.connected = true;
            callback(undefined, _this);
        }, 100);
    };
    ClientMock.prototype.end = function (callback) {
        var _this = this;
        setTimeout(function () {
            _this.queries = [];
            _this.connected = false;
            callback();
        }, 100);
    };
    ClientMock.prototype.query = function (queryText, values, callback) {
        if (!this.connected) {
            throw new Error('Not connected');
        }
        this.queries.push({
            query: queryText,
            args: values
        });
        setTimeout(function () {
            callback(undefined, {
                rows: [],
            });
        }, 100);
        return new QueryMock({
            text: queryText
        });
    };
    return ClientMock;
}());
exports.ClientMock = ClientMock;
var QueryMock = (function () {
    function QueryMock(config) {
        if (config === void 0) { config = {}; }
        this.text = config.text;
    }
    return QueryMock;
}());
exports.QueryMock = QueryMock;
var PoolMock = (function () {
    function PoolMock() {
    }
    return PoolMock;
}());
exports.PoolMock = PoolMock;
