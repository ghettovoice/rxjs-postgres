import { assert } from 'chai';
import sinon from 'sinon';
import { PoolMock } from '../pgmock';
import { RxPool, RxClient, RxPoolError } from '../../src';
import Rx from 'rxjs';

suite('RxPool Adapter tests', function () {
    let pool, rxPool;

    setup(function () {
        pool = new PoolMock();
        rxPool = new RxPool(pool);

        sinon.spy(pool, 'connect');
        sinon.spy(pool, 'end');
    });

    teardown(function () {
        pool.connect.restore();
        pool.end.restore();

        pool = rxPool = undefined;
    });

    test('Test initialization', function () {
        assert.throws(() => new RxPool({ query() {} }), RxPoolError, 'Pool must be instance of Pool class');
        assert.strictEqual(rxPool.pool, pool);
    });

    suite('Connect -> rxClient query tests -> pool end', function () {
        test('Test valid chain', function (done) {
            let i = 0;

            Rx.Observable.merge(
                rxPool.connect(),
                rxPool.take()
            ).do(rxClient => {
                assert.instanceOf(rxClient, RxClient);
                assert.ok(rxClient.connected);
                assert.typeOf(rxClient.client.release, 'function');
            }).flatMap(
                rxClient => rxClient.query('select $1 :: int col', [ 123 ]),
                (rxClient, result) => ({ rxClient, result })
            ).concatMap(
                ({ rxClient }) => rxClient.release(),
                prev => prev
            ).concatMap(
                () => rxPool.end(),
                prev => prev
            ).subscribe(
                ({ rxClient, result }) => {
                    assert.typeOf(result, 'object');
                    assert.deepEqual(result.rows, [
                        { col: 123 }
                    ]);
                    assert.deepEqual(rxClient.client.queries, [
                        { queryText: 'select $1 :: int col', values: [ 123 ] }
                    ]);

                    ++i;
                },
                done,
                () => {
                    assert.strictEqual(i, 2);
                    assert.strictEqual(pool.pool.getPoolSize(), 0);

                    done();
                }
            );
        });

        test('Test invalid chain', function (done) {
            let errThrown;

            rxPool.take()
                .do(rxClient => {
                    assert.instanceOf(rxClient, RxClient);
                    assert.ok(rxClient.connected);
                    assert.typeOf(rxClient.client.release, 'function');
                    assert.strictEqual(pool.pool.getPoolSize(), 1);
                })
                .flatMap(
                    rxClient => rxClient.query('select SQL Syntax Error', [ 'qwe' ])
                        .catch(err => {
                            errThrown = err;

                            return rxClient.release(err);
                        })
                        .do(() => {
                            assert.notOk(rxClient.connected);
                        }),
                    (rxClient, result) => ({ rxClient, result })
                )
                .concatMap(
                    () => rxPool.end(),
                    prev => prev
                )
                .subscribe(
                    () => {
                        assert.instanceOf(errThrown, Error);
                        assert.equal(errThrown.message, 'syntax error at or near "Error"');
                        assert.strictEqual(pool.pool.getPoolSize(), 0);
                    },
                    done,
                    done
                );
        });
    });


    // test('Test query', function (done) {
    //     const pool = new PoolMock();
    //     const rxPool = new RxPool(pool);
    //     let i = 0;
    //
    //     Rx.Observable.merge(
    //         rxPool.query('select 1'),
    //         rxPool.query('select current_timestamp'),
    //         rxPool.query("select 'qwerty'")
    //     ).subscribe(
    //         result => {
    //             assert.typeOf(result, 'object');
    //             assert.ok(Array.isArray(result.rows));
    //
    //             ++i;
    //         },
    //         done,
    //         () => {
    //             assert.strictEqual(pool.pool.waitingClientsCount(), 0);
    //             assert.strictEqual(pool.pool.getPoolSize(), 3);
    //             done();
    //         }
    //     );
    // });

    // test('Test begin', function (done) {
    //     const pool = new PoolMock();
    //     const rxPool = new RxPool(pool);
    //
    //     rxPool.begin()
    //         .do(rxPool_ => {
    //             assert.strictEqual(rxPool_, rxPool);
    //         })
    //         .flatMap(rxPool => rxPool.begin())
    //         .flatMap(rxPool => rxPool.begin())
    //         .do(rxPool_ => {
    //             assert.strictEqual(rxPool_, rxPool);
    //         })
    //         .zip(
    //             rxPool._tclientSource,
    //             (rxPool_, rxClient) => ({ rxPool_, rxClient })
    //         )
    //         .subscribe(
    //             ({ rxClient }) => {
    //                 assert.strictEqual(pool.pool._count, 1);
    //                 assert.equal(rxClient.tlevel, 3);
    //                 assert.lengthOf(rxClient.client.queries, 3);
    //                 assert.deepEqual(rxClient.client.queries.map(q => q.query), [
    //                     'begin',
    //                     'savepoint point_1',
    //                     'savepoint point_2',
    //                 ]);
    //             },
    //             done,
    //             done
    //         );
    // });

    // test('Test commit', function (done) {
    //     const pool = new PoolMock();
    //     const rxPool = new RxPool(pool);
    //
    //     assert.throws(::rxPool.commit, RxPoolError, 'Client with open transaction does not exists');
    //
    //     rxPool.begin()
    //         .flatMap(rxPool => rxPool.begin())
    //         .flatMap(rxPool => rxPool.begin())
    //         .zip(
    //             rxPool._tclientSource,
    //             (rxPool_, rxClient) => ({ rxPool_, rxClient })
    //         )
    //         .flatMap(
    //             ({ rxPool_ }) => rxPool_.commit(),
    //             obj => obj
    //         )
    //         .do(({ rxPool_, rxClient }) => {
    //             assert.strictEqual(rxPool_, rxPool);
    //             assert.strictEqual(pool.pool._count, 1);
    //             assert.strictEqual(rxClient.tlevel, 2);
    //         })
    //         .flatMap(
    //             ({ rxPool_ }) => rxPool_.commit(true),
    //             obj => obj
    //         )
    //         .subscribe(
    //             ({ rxPool_, rxClient }) => {
    //                 assert.throws(::rxPool_.commit, RxPoolError, 'Client with open transaction does not exists');
    //                 assert.strictEqual(pool.pool._count, 0);
    //                 assert.notOk(rxClient.connected);
    //                 assert.ok(rxClient.released);
    //                 assert.equal(rxClient.tlevel, 0);
    //                 assert.lengthOf(rxClient.client.queries, 5);
    //                 assert.deepEqual(rxClient.client.queries.map(q => q.query), [
    //                     'begin',
    //                     'savepoint point_1',
    //                     'savepoint point_2',
    //                     'release savepoint point_2',
    //                     'commit'
    //                 ]);
    //             },
    //             done,
    //             done
    //         );
    // });
    //
    // test('Test rollback', function () {
    //     const pool = new PoolMock();
    //     const rxPool = new RxPool(pool);
    //
    //     assert.throws(::rxPool.rollback, RxPoolError, 'Client with open transaction does not exists');
    // });
});
