import { assert } from "chai";
import { ClientMock } from "../pgmock";
import RxClient from "../../../src/adapters/rxclient";
/**
 * RxClient Unit tests
 */
describe('RxClient tests', function () {
    it('Test initialization', function () {
        const client = new ClientMock();
        const rxClient = new RxClient(client);

        assert.strictEqual(rxClient.client, client);
        assert.equal(rxClient.tlevel, 0);
        assert.equal(rxClient.isDisposed, false);
    });
});
