import { assert } from "chai";
import * as Rx from "rx";
import { PoolMock, ClientMock } from "../pgmock";
import RxPool from "../../../src/adapters/RxPool";
import RxClient from "../../../src/adapters/RxClient";


suite('RxPool Adapter Unit tests', function () {
    test('Initialization', function () {
        const pool = new PoolMock();
        const rxPool = new RxPool(pool);

        assert.strictEqual(rxPool.pool, pool);
        assert.isUndefined(rxPool.tclient);
    });

    test('Test connect / take', function (done) {
        const pool = new PoolMock();
        const rxPool = new RxPool(pool);

        Rx.Observable.merge(
            rxPool.connect(),
            rxPool.take()
        ).subscribe(
            (rxClient : RxClient) => {
                assert.strictEqual(pool.pool.length, 2);

                assert.instanceOf(rxClient, RxClient);
                assert.equal(rxClient.tlevel, 0);
                assert.instanceOf(rxClient.client, ClientMock);
                assert.typeOf((<ClientMock>rxClient.client).release, 'function');
                assert.ok((<ClientMock>rxClient.client).connected);
            },
            done,
            done
        );
    });

    test('Test end', function (done) {
        const pool = new PoolMock();
        const rxPool = new RxPool(pool);

        rxPool.connect()
            .doOnNext((rxClient : RxClient) => {
                assert.strictEqual(pool.pool.length, 1);

                assert.instanceOf(rxClient, RxClient);
                assert.equal(rxClient.tlevel, 0);
                assert.instanceOf(rxClient.client, ClientMock);
                assert.typeOf((<ClientMock>rxClient.client).release, 'function');
                assert.ok((<ClientMock>rxClient.client).connected);
            })
            .concatMap(() => rxPool.end())
            .subscribe(
                (rxPool : RxPool) => {
                    assert.instanceOf(rxPool, RxPool);
                    assert.strictEqual((<PoolMock>rxPool.pool).pool.length, 0);
                },
                done,
                done
            );
    });
});
