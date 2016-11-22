import { assert } from 'chai';
import { PoolMock } from '../pgmock';
import { RxPool, RxPoolError } from '../../src';

suite('RxPool Adapter tests', function () {
    test('Test initialization', function () {
        assert.throws(() => new RxPool({ query() {} }), RxPoolError, 'Pool must be instance of Pool class');

        const pool = new PoolMock();
        const rxPool = new RxPool(pool);

        assert.strictEqual(rxPool.pool, pool);
    });

    // test('Test connect / take', function (done) {
    //     const pool = new PoolMock();
    //     const rxPool = new RxPool(pool);
    //     let rxClient;
    //     let i = 0;
    //
    //     Rx.Observable.merge(
    //         rxPool.connect(),
    //         rxPool.take()
    //     ).subscribe(
    //         rxClient_ => {
    //             assert.instanceOf(rxClient_, RxClient);
    //             assert.strictEqual(rxClient_.tlevel, 0);
    //             assert.instanceOf(rxClient_.client, ClientMock);
    //             assert.typeOf(rxClient_.client.release, 'function');
    //             assert.ok(rxClient_.client.connected);
    //
    //             rxClient = rxClient_;
    //
    //             ++i;
    //         },
    //         done,
    //         () => {
    //             assert.strictEqual(i, 2);
    //             assert.strictEqual(pool.pool.getPoolSize(), 2);
    //
    //             assert.ok(rxClient.isDisposed);
    //             rxClient.dispose();
    //             assert.ok(rxClient.isDisposed);
    //
    //             done();
    //         }
    //     );
    // });
    //
    // test('Test end', function (done) {
    //     const pool = new PoolMock();
    //     const rxPool = new RxPool(pool);
    //
    //     rxPool.connect()
    //         .flatMap(rxClient => rxPool.end())
    //         .subscribe(
    //             rxPool_ => {
    //                 assert.strictEqual(rxPool_, rxPool);
    //                 assert.strictEqual(pool.pool.getPoolSize(), 0);
    //             },
    //             done,
    //             done
    //         );
    // });
    //
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
