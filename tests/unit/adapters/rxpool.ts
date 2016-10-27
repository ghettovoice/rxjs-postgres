import { assert } from "chai";
import { PoolMock } from "../pgmock";
import RxPool from "../../../src/adapters/rxpool";


suite('RxPool Adapter Unit tests', function () {
    test('Initialization', function () {
        const pool = new PoolMock({});
        const rxPool = new RxPool(pool);

        assert.strictEqual(rxPool.pool, pool);
        assert.isUndefined(rxPool.tclient);
    });
});
