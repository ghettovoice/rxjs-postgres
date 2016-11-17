import { assert } from "chai";
import * as Rx from "rx";
import { PoolMock, ClientMock } from "../pgmock";
import RxPool from "../../../src/adapters/RxPool";
import RxClient from "../../../src/adapters/RxClient";
import { RxPoolError } from "../../../src/errors";


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
            rxClient => {
                assert.lengthOf(pool.pool, 2);
                assert.instanceOf(rxClient, RxClient);
                assert.equal(rxClient.tlevel, 0);
                assert.instanceOf(rxClient.client, ClientMock);
                assert.isOk(pool.pool.indexOf(rxClient.client) !== -1);
                assert.typeOf(rxClient.client.release, 'function');
                assert.ok(rxClient.client.connected);
            },
            done,
            done
        );
    });

    test('Test end', function (done) {
        const pool = new PoolMock();
        const rxPool = new RxPool(pool);

        rxPool.connect()
            .doOnNext(rxClient => {
                assert.strictEqual(pool.pool.length, 1);
                assert.instanceOf(rxClient, RxClient);
                assert.equal(rxClient.tlevel, 0);
                assert.instanceOf(rxClient.client, ClientMock);
                assert.ok(pool.pool[ 0 ] === rxClient.client);
                assert.typeOf(rxClient.client.release, 'function');
                assert.ok(rxClient.client.connected);
            })
            .concatMap(() => rxPool.end())
            .subscribe(
                rxPool_ => {
                    assert.instanceOf(rxPool_, RxPool);
                    assert.strictEqual(rxPool_, rxPool);
                    assert.lengthOf(rxPool_.pool.pool, 0);
                },
                done,
                done
            );
    });

    test('Test query', function (done) {
        const pool = new PoolMock();
        const rxPool = new RxPool(pool);

        Rx.Observable.merge(
            rxPool.query('select 1'),
            rxPool.query('select current_timestamp'),
            rxPool.query("select 'qwerty")
        ).doOnNext(result => {
                assert.lengthOf(result.client.queries, 1);
            })
            .flatMap(
                result => Rx.Observable.fromEvent(result.client, 'end'),
                result => result
            )
            .take(3)
            .subscribe(
                result => {
                    assert.typeOf(result, 'object');
                    assert.ok(Array.isArray(result.rows));
                    assert.ok(result.client.released);
                    assert.notOk(result.client.connected);
                },
                done,
                () => {
                    assert.lengthOf(rxPool.pool.pool, 0);
                    done();
                }
            );
    });

    test('Test begin', function (done) {
        const pool = new PoolMock();
        const rxPool = new RxPool(pool);

        rxPool.begin()
            .doOnNext(rxPool_ => {
                assert.instanceOf(rxPool_, RxPool);
                assert.strictEqual(rxPool_, rxPool);
                assert.strictEqual(rxPool.tclient.tlevel, 1);
            })
            .concatMap(rxPool_ => rxPool_.begin())
            .subscribe(
                rxPool_ => {
                    assert.strictEqual(rxPool_, rxPool);
                    assert.equal(rxPool_.tclient.tlevel, 2);
                    assert.lengthOf(rxPool_.tclient.client.queries, 2);
                    assert.deepEqual(rxPool_.tclient.client.queries.map(q => q.query), [
                        'begin',
                        'savepoint point_1'
                    ]);
                },
                done,
                done
            );
    });

    test('Test commit', function (done) {
        const pool = new PoolMock();
        const rxPool = new RxPool(pool);

        assert.throws(::rxPool.commit, RxPoolError, 'Client with open transaction does not exists');
        done();
        // Rx.Observable.merge<RxPool>(
        //     rxPool.begin(),
        //     rxPool.begin(),
        //     rxPool.begin()
        // ).doOnNext((rxPool_ : RxPool) => {
        //     console.log(rxPool_.tclient);
        // })/*.flatMap<RxPool>(() => {
        //     console.log(rxPool.tclient);
        //     return rxPool.commit();
        // })
        //     .doOnNext((rxPool_ : RxPool) => {
        //         assert.instanceOf(rxPool_, RxPool);
        //         assert.strictEqual(rxPool_, rxPool);
        //         assert.strictEqual(rxPool_.tclient.tlevel, 1);
        //     })
        //     .flatMap<RxPool>(() => rxPool.commit(true))*/
        //     .subscribe(
        //         (rxPool_ : RxPool) => {
        //             // assert.strictEqual(rxPool_.tclient.tlevel, 0);
        //             // assert.lengthOf((<ClientMock>rxPool_.tclient.client).queries, 5);
        //             // assert.deepEqual((<ClientMock>rxPool_.tclient.client).queries.map((q : any) => q.query), [
        //             //     'begin',
        //             //     'savepoint point_1',
        //             //     'savepoint point_2',
        //             //     'release savepoint point_2',
        //             //     'commit'
        //             // ]);
        //         },
        //         done,
        //         done
        //     );
    });

    test('Test rollback', function () {
        const pool = new PoolMock();
        const rxPool = new RxPool(pool);

        assert.throws(::rxPool.rollback, RxPoolError, 'Client with open transaction does not exists');
    });
});
