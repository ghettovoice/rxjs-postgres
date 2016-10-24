"use strict";
const timers_1 = require("timers");
/**
 * node-postgres mocks
 */
class ClientMock {
    constructor(config = {}) {
        this.connected = false;
        this.queries = [];
        this.user = config.user;
        this.database = config.database;
        this.port = config.port;
        this.host = config.host;
        this.password = config.password;
    }
    connect(callback) {
        timers_1.setTimeout(() => {
            this.connected = true;
            callback(null, this);
        }, 100);
    }
    end(callback) {
        timers_1.setTimeout(() => {
            this.queries = [];
            callback();
        }, 100);
    }
    query(queryText, values) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                return reject(new Error('Not connected'));
            }
            const res = {
                command: queryText,
                rowCount: 0,
                oid: 1,
                rows: [],
            };
            this.queries.push({
                queryText,
                values,
                res
            });
            resolve(res);
        });
    }
}
exports.ClientMock = ClientMock;
class PoolMock {
    constructor(config = {}) {
    }
    connect() {
        return Promise.resolve(new ClientMock('qwerty@localhost:4632/qwerty'));
    }
    end() {
        return Promise.resolve(undefined);
    }
    query(queryText, values) {
        return Promise.resolve({});
    }
}
exports.PoolMock = PoolMock;
