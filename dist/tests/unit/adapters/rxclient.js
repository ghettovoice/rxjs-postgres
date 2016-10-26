"use strict";
const chai_1 = require("chai");
const pgmock_1 = require("../pgmock");
const rxclient_1 = require("../../../src/adapters/rxclient");
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
});
