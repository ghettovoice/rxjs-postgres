/**
 * node-postgres mocks
 */
"use strict";
var ClientMock = (function () {
    function ClientMock(connectionString) {
        this.connectionString = connectionString;
    }
    ClientMock.prototype.connect = function (callback) {
        return;
    };
    ClientMock.prototype.end = function () {
        return;
    };
    ClientMock.prototype.release = function () {
        return;
    };
    ClientMock.prototype.query = function (queryText, values) {
        return Promise.resolve({});
    };
    return ClientMock;
}());
exports.ClientMock = ClientMock;
var PoolMock = (function () {
    function PoolMock() {
    }
    PoolMock.prototype.connect = function () {
        return Promise.resolve(new ClientMock('qwerty'));
    };
    PoolMock.prototype.end = function () {
        return Promise.resolve(undefined);
    };
    PoolMock.prototype.query = function (queryText, values) {
        return Promise.resolve({});
    };
    return PoolMock;
}());
exports.PoolMock = PoolMock;
