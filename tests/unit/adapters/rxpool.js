import { assert } from 'chai';
import * as Rx from 'rx';
import { PoolMock, ClientMock } from '../pgmock';
import { RxPool, RxClient, RxPoolError } from '../../../src';

suite('RxPool Adapter Unit tests', function () {
    test('Initialization', function () {
        assert.throws(() => new RxPool({ query() {} }), RxPoolError, 'Pool must be instance of pg.Pool class');

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
        )
            .subscribe(
                rxClient => {
                    assert.instanceOf(rxClient, RxClient);
                    assert.equal(rxClient.tlevel, 0);
                    assert.instanceOf(rxClient.client, ClientMock);
                    assert.strictEqual(pool.pool._count, 2);
                    assert.isOk(pool.pool._inUseObjects.includes(rxClient.client));
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
        // FIXME timed out
        rxPool.connect()
            .doOnNext(rxClient => {
                assert.instanceOf(rxClient, RxClient);
                assert.equal(rxClient.tlevel, 0);
                assert.instanceOf(rxClient.client, ClientMock);
                assert.strictEqual(pool.pool._count, 1);
                assert.isOk(pool.pool._inUseObjects.includes(rxClient.client));
                assert.typeOf(rxClient.client.release, 'function');
                assert.ok(rxClient.client.connected);
            })
            .concatMap(() => rxPool.end())
            .subscribe(
                rxPool_ => {
                    assert.instanceOf(rxPool_, RxPool);
                    assert.strictEqual(rxPool_, rxPool);
                    assert.strictEqual(pool.pool._count, 0);
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
        )
            .doOnNext(result => {
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
                    assert.strictEqual(pool.pool._count, 0);
                    done();
                }
            );
    });

    test('Test begin', function (done) {
        const pool = new PoolMock();
        const rxPool = new RxPool(pool);

        rxPool.begin()
            .do(rxPool_ => {
                assert.strictEqual(rxPool_, rxPool);
            })
            .flatMap(rxPool => rxPool.begin())
            .flatMap(rxPool => rxPool.begin())
            .do(rxPool_ => {
                assert.strictEqual(rxPool_, rxPool);
            })
            .zip(
                rxPool._tclientSource,
                (rxPool_, rxClient) => ({ rxPool_, rxClient })
            )
            .subscribe(
                ({ rxClient }) => {
                    assert.strictEqual(pool.pool._count, 1);
                    assert.equal(rxClient.tlevel, 3);
                    assert.lengthOf(rxClient.client.queries, 3);
                    assert.deepEqual(rxClient.client.queries.map(q => q.query), [
                        'begin',
                        'savepoint point_1',
                        'savepoint point_2',
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

        rxPool.begin()
            .flatMap(rxPool => rxPool.begin())
            .flatMap(rxPool => rxPool.begin())
            .zip(
                rxPool._tclientSource,
                (rxPool_, rxClient) => ({ rxPool_, rxClient })
            )
            .flatMap(
                ({ rxPool_ }) => rxPool_.commit(),
                obj => obj
            )
            .do(({ rxPool_, rxClient }) => {
                assert.strictEqual(rxPool_, rxPool);
                assert.strictEqual(pool.pool._count, 1);
                assert.strictEqual(rxClient.tlevel, 2);
            })
            .flatMap(
                ({ rxPool_ }) => rxPool_.commit(true),
                obj => obj
            )
            .subscribe(
                ({ rxPool_, rxClient }) => {
                    assert.throws(::rxPool_.commit, RxPoolError, 'Client with open transaction does not exists');
                    assert.strictEqual(pool.pool._count, 0);
                    assert.notOk(rxClient.connected);
                    assert.ok(rxClient.released);
                    assert.equal(rxClient.tlevel, 0);
                    assert.lengthOf(rxClient.client.queries, 5);
                    assert.deepEqual(rxClient.client.queries.map(q => q.query), [
                        'begin',
                        'savepoint point_1',
                        'savepoint point_2',
                        'release savepoint point_2',
                        'commit'
                    ]);
                },
                done,
                done
            );
    });

    test('Test rollback', function () {
        const pool = new PoolMock();
        const rxPool = new RxPool(pool);

        assert.throws(::rxPool.rollback, RxPoolError, 'Client with open transaction does not exists');
    });
});
