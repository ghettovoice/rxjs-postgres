"use strict";
const chai_1 = require("chai");
const Rx = require("rx");
const pgmock_1 = require("../pgmock");
const rxclient_1 = require("../../../src/adapters/rxclient");
const config = Rx.config;
config.longStackSupport = true;
/**
 * RxClient Unit tests
 */
describe('RxClient tests', function () {
    it('Test initialization', function () {
        const client = new pgmock_1.ClientMock();
        const rxClient = new rxclient_1.default(client);
        chai_1.assert.strictEqual(rxClient.client, client);
        chai_1.assert.equal(rxClient.tlevel, 0);
        chai_1.assert.equal(rxClient.isDisposed, false);
    });
    it('Test connect', function (done) {
        const rxClient = new rxclient_1.default(new pgmock_1.ClientMock());
        rxClient.connect()
            .subscribe((rxClient) => {
            chai_1.assert.instanceOf(rxClient, rxclient_1.default);
            chai_1.assert.instanceOf(rxClient.client, pgmock_1.ClientMock);
            chai_1.assert.ok(rxClient.client.connected);
        }, done, done);
    });
    it('Test end', function (done) {
        const rxClient = new rxclient_1.default(new pgmock_1.ClientMock());
        rxClient.connect()
            .flatMap((client) => client.end())
            .subscribe((rxClient) => {
            chai_1.assert.instanceOf(rxClient, rxclient_1.default);
            chai_1.assert.instanceOf(rxClient.client, pgmock_1.ClientMock);
            chai_1.assert.notOk(rxClient.client.connected);
        }, done, done);
    });
    it('Test query', function (done) {
        const clientMock = new pgmock_1.ClientMock();
        const rxClient = new rxclient_1.default(clientMock);
        rxClient.connect()
            .flatMap((client) => client.query('select 1'))
            .subscribe((res) => {
            chai_1.assert.typeOf(res, 'object');
            chai_1.assert.ok(Array.isArray(res.rows));
            chai_1.assert.equal(clientMock.queries.length, 1);
            chai_1.assert.equal(clientMock.queries[0].query, 'select 1');
        }, done, done);
    });
    it('Test begin', function (done) {
        const rxClient = new rxclient_1.default(new pgmock_1.ClientMock());
        rxClient.connect()
            .concatMap((client) => client.begin())
            .concatMap((client) => client.begin())
            .concatMap((client) => client.begin())
            .subscribe((rxClient) => {
            const clientMock = (rxClient.client);
            chai_1.assert.ok(clientMock.connected);
            chai_1.assert.equal(rxClient.tlevel, 3);
            chai_1.assert.equal(clientMock.queries.length, 3);
            chai_1.assert.deepEqual(clientMock.queries.map(q => q.query), [
                'begin',
                'savepoint point_1',
                'savepoint point_2'
            ]);
        }, done, done);
    });
});
