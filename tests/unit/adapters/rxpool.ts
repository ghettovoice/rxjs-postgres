import { assert } from "chai";
import * as Rx from "rx";
import { PoolMock, ClientMock } from "../pgmock";
import RxPool from "../../../src/adapters/RxPool";
import RxClient from "../../../src/adapters/RxClient";
import { ResultSet } from "pg";
import { RxPoolError } from "../../../src/errors";
import { PgPool } from "../../../src/pg";


suite('RxPool Adapter Unit tests', function () {
    test('Initialization', function () {
        const pool = new PoolMock();
        const rxPool = new RxPool(<PgPool>pool);

        assert.strictEqual(rxPool.pool, pool);
        assert.isUndefined(rxPool.tclient);
    });

    test('Test connect / take', function (done) {
        const pool = new PoolMock();
        const rxPool = new RxPool(<PgPool>pool);

        Rx.Observable.merge<RxClient>(
            rxPool.connect(),
            rxPool.take()
        ).subscribe(
            (rxClient : RxClient) => {
                assert.strictEqual(pool.pool.length, 2);
                assert.instanceOf(rxClient, RxClient);
                assert.equal(rxClient.tlevel, 0);
                assert.instanceOf(rxClient.client, ClientMock);
                assert.isOk(pool.pool.indexOf(<ClientMock>rxClient.client) !== -1);
                assert.typeOf((<ClientMock>rxClient.client).release, 'function');
                assert.ok((<ClientMock>rxClient.client).connected);
            },
            done,
            done
        );
    });

    test('Test end', function (done) {
        const pool = new PoolMock();
        const rxPool = new RxPool(<PgPool>pool);

        rxPool.connect()
            .doOnNext((rxClient : RxClient) => {
                assert.strictEqual(pool.pool.length, 1);
                assert.instanceOf(rxClient, RxClient);
                assert.equal(rxClient.tlevel, 0);
                assert.instanceOf(rxClient.client, ClientMock);
                assert.ok(pool.pool[ 0 ] === rxClient.client);
                assert.typeOf((<ClientMock>rxClient.client).release, 'function');
                assert.ok((<ClientMock>rxClient.client).connected);
            })
            .concatMap<RxPool>(() => rxPool.end())
            .subscribe(
                (rxPool_ : RxPool) => {
                    assert.instanceOf(rxPool_, RxPool);
                    assert.strictEqual(rxPool_, rxPool);
                    assert.strictEqual((<PoolMock>rxPool_.pool).pool.length, 0);
                },
                done,
                done
            );
    });

    test('Test query', function (done) {
        const pool = new PoolMock();
        const rxPool = new RxPool(<PgPool>pool);

        Rx.Observable.merge<ResultSet>(
            rxPool.query('select 1'),
            rxPool.query('select current_timestamp'),
            rxPool.query("select 'qwerty")
        ).doOnNext((result : any) => {
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

    test('Test begin', function (done) {
        const pool = new PoolMock();
        const rxPool = new RxPool(<PgPool>pool);

        rxPool.begin()
            .doOnNext((rxPool_ : RxPool) => {
                assert.instanceOf(rxPool_, RxPool);
                assert.strictEqual(rxPool_, rxPool);
                assert.strictEqual(rxPool.tclient.tlevel, 1);
            })
            .concatMap<RxPool>((rxPool_ : RxPool) => rxPool_.begin())
            .subscribe(
                (rxPool_ : RxPool) => {
                    assert.strictEqual(rxPool_, rxPool);
                    assert.equal(rxPool_.tclient.tlevel, 2);
                    assert.lengthOf((<ClientMock>rxPool_.tclient.client).queries, 2);
                    assert.deepEqual((<ClientMock>rxPool_.tclient.client).queries.map((q : any) => q.query), [
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
        const rxPool = new RxPool(<PgPool>pool);

        assert.throws(() => rxPool.commit(), RxPoolError, 'Client with open transaction does not exists');
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
        const rxPool = new RxPool(<PgPool>pool);

        assert.throws(() => rxPool.rollback(), RxPoolError, 'Client with open transaction does not exists');
    });
});
