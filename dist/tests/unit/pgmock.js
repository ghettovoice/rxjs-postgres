"use strict";
const timers_1 = require("timers");
/**
 * node-postgres mocks
 */
class ClientMock {
    constructor(config) {
        this.connected = false;
        this.queries = [];
    }
    connect(callback) {
        if (this.connected) {
            callback(undefined, this);
        }
        timers_1.setTimeout(() => {
            this.connected = true;
            callback(undefined, this);
        }, 100);
    }
    end(callback) {
        timers_1.setTimeout(() => {
            this.queries = [];
            this.connected = false;
            callback();
        }, 100);
    }
    query(query, values) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                return reject(new Error('Not connected'));
            }
            const res = {
                command: query,
                rowCount: 0,
                oid: 1,
                rows: [],
            };
            this.queries.push({
                query,
                values,
                res
            });
            resolve(res);
        });
    }
}
exports.ClientMock = ClientMock;
