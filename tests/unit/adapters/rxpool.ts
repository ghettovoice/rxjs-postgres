import { assert } from "chai";
import * as Rx from "rx";
import { PoolMock, ClientMock } from "../pgmock";
import RxPool from "../../../src/adapters/RxPool";
import RxClient from "../../../src/adapters/RxClient";
import { ResultSet } from "pg";


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

        Rx.Observable.merge<RxClient>(
            rxPool.connect(),
            rxPool.take()
        ).subscribe(
            (rxClient : RxClient) => {
                assert.strictEqual(pool.pool.length, 2);
                assert.instanceOf(rxClient, RxClient);
                assert.equal(rxClient.tlevel, 0);
                assert.instanceOf(rxClient.client, ClientMock);
                assert.isOk((<PoolMock>rxPool.pool).pool.indexOf(<ClientMock>rxClient.client) !== -1);
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
                assert.ok((<PoolMock>rxPool.pool).pool[ 0 ] === rxClient.client);
                assert.typeOf((<ClientMock>rxClient.client).release, 'function');
                assert.ok((<ClientMock>rxClient.client).connected);
            })
            .concatMap<RxPool>(() => rxPool.end())
            .subscribe(
                (rxPool : RxPool) => {
                    assert.instanceOf(rxPool, RxPool);
                    assert.strictEqual((<PoolMock>rxPool.pool).pool.length, 0);
                },
                done,
                done
            );
    });

    test('Test query', function (done) {
        const pool = new PoolMock();
        const rxPool = new RxPool(pool);

        Rx.Observable.merge<ResultSet>(
            rxPool.query('select 1'),
            rxPool.query('select current_timestamp'),
            rxPool.query("select 'qwerty")
        )
            .doOnNext((result : any) => {
                assert.lengthOf(result.client.queries, 1);
            })
            .flatMap<any, any>(
                (result : any) => Rx.Observable.fromEvent<void>(result.client, 'end'),
                (result : any) => result
            )
            .take(3)
            .subscribe(
                (result : any) => {
                    assert.typeOf(result, 'object');
                    assert.ok(Array.isArray(result.rows));
                    assert.ok(result.client.released);
                    assert.notOk(result.client.connected);
                },
                done,
                () => {
                    assert.lengthOf((<PoolMock>rxPool.pool).pool, 0);
                    done();
                }
            );
    });
});
