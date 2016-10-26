"use strict";
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
            return;
        }
        setTimeout(() => {
            this.connected = true;
            callback(undefined, this);
        }, 100);
    }
    end(callback) {
        setTimeout(() => {
            this.queries = [];
            this.connected = false;
            callback();
        }, 100);
    }
    query(queryText, values, callback) {
        if (!this.connected) {
            throw new Error('Not connected');
        }
        this.queries.push({
            query: queryText,
            args: values
        });
        setTimeout(() => {
            callback(undefined, {
                rows: [],
            });
        }, 100);
        return new QueryMock({
            text: queryText
        });
    }
}
exports.ClientMock = ClientMock;
class QueryMock {
    constructor(config = {}) {
        this.text = config.text;
    }
}
exports.QueryMock = QueryMock;
