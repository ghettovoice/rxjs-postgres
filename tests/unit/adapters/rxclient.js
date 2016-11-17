import { assert } from "chai";
import { Rx } from "../../boot";
import { ClientMock } from "../pgmock";
import RxClient from "../../../src/adapters/RxClient";
import { RxClientError } from "../../../src/errors";

suite('RxClient Adapter Unit tests', function () {
    test('Test initialization', function () {
        const client = new ClientMock();
        const rxClient = new RxClient(client);

        assert.strictEqual(rxClient.client, client);
        assert.equal(rxClient.tlevel, 0);
        assert.equal(rxClient.isDisposed, false);
    });

    test('Test connect', function (done) {
        const client = new ClientMock();
        const rxClient = new RxClient(client);

        rxClient.connect()
            .subscribe(
                rxClient => {
                    assert.instanceOf(rxClient, RxClient);
                    assert.ok(rxClient.connected);
                    assert.instanceOf(rxClient.client, ClientMock);
                    assert.ok(client.connected);
                    assert.equal(rxClient.tlevel, 0);
                },
                done,
                done
            );
    });

    test('Test end', function (done) {
        const client = new ClientMock();
        const rxClient = new RxClient(client);

        rxClient.connect()
            .flatMap(rxClient => rxClient.end())
            .subscribe(
                rxClient => {
                    assert.instanceOf(rxClient, RxClient);
                    assert.instanceOf(rxClient.client, ClientMock);
                    assert.notOk(client.connected);
                    assert.strictEqual(rxClient.tlevel, 0);
                },
                done,
                done
            );
    });

    test('Test query', function (done) {
        const client = new ClientMock();
        const rxClient = new RxClient(client);
        let i = 0;

        Rx.Observable.merge(
            rxClient.query('select 1'),
            rxClient.query('select current_timestamp'),
            rxClient.query("select 'qwerty")
        ).subscribe(
            res => {
                assert.typeOf(res, 'object');
                assert.ok(Array.isArray(res.rows));
                assert.equal(client.queries.length, 3);
                assert.deepEqual(client.queries.map(q => q.query), [
                    'select 1',
                    'select current_timestamp',
                    "select 'qwerty"
                ]);

                ++i;
            },
            done,
            () => {
                assert.equal(i, 3);
                done();
            }
        );
    });

    test('Test begin', function (done) {
        const client = new ClientMock();
        const rxClient = new RxClient(client);

        rxClient.begin()
            .doOnNext(rxClient => {
                assert.instanceOf(rxClient, RxClient);
                assert.instanceOf(rxClient.client, ClientMock);
                assert.strictEqual(rxClient.tlevel, 1);
            })
            .concatMap(rxClient => rxClient.begin())
            .doOnNext(rxClient => {
                assert.strictEqual(rxClient.tlevel, 2);
            })
            .concatMap(rxClient => rxClient.begin())
            .subscribe(
                rxClient => {
                    assert.ok(client.connected);
                    assert.equal(rxClient.tlevel, 3);
                    assert.equal(client.queries.length, 3);
                    assert.deepEqual(client.queries.map(q => q.query), [
                        'begin',
                        'savepoint point_1',
                        'savepoint point_2'
                    ]);
                },
                done,
                done
            );
    });

    test('Test commit', function (done) {
        const client = new ClientMock();
        const rxClient = new RxClient(client);
        // todo WTF? Breaks with constructor checking
        assert.throws(::rxClient.commit, RxClientError, 'The transaction is not open on the client');

        rxClient.connect()
            .concatMap(rxClient => rxClient.begin())
            .concatMap(rxClient => rxClient.begin())
            .concatMap(rxClient => rxClient.begin())
            .concatMap(rxClient => rxClient.commit())
            .doOnNext(rxClient => {
                assert.instanceOf(rxClient, RxClient);
                assert.instanceOf(rxClient.client, ClientMock);
            })
            .concatMap(rxClient => rxClient.commit(true))
            .subscribe(
                rxClient => {
                    assert.ok(client.connected);
                    assert.equal(rxClient.tlevel, 0);
                    assert.lengthOf(client.queries, 5);
                    assert.deepEqual(client.queries.map(q => q.query), [
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

    test('Test rollback', function (done) {
        const client = new ClientMock();
        const rxClient = new RxClient(client);

        assert.throws(::rxClient.commit, 'The transaction is not open on the client');

        rxClient.connect()
            .concatMap(rxClient => rxClient.begin())
            .concatMap(rxClient => rxClient.begin())
            .concatMap(rxClient => rxClient.begin())
            .concatMap(rxClient => rxClient.begin())
            .concatMap(rxClient => rxClient.rollback())
            .doOnNext(rxClient => {
                assert.instanceOf(rxClient, RxClient);
                assert.instanceOf(rxClient.client, ClientMock);
                assert.strictEqual(rxClient.tlevel, 3);
            })
            .concatMap(rxClient => rxClient.rollback())
            .concatMap(rxClient => rxClient.rollback(true))
            .subscribe(
                rxClient => {
                    assert.ok(client.connected);
                    assert.equal(rxClient.tlevel, 0);
                    assert.lengthOf(client.queries, 7);
                    assert.deepEqual(client.queries.map(q => q.query), [
                        'begin',
                        'savepoint point_1',
                        'savepoint point_2',
                        'savepoint point_3',
                        'rollback to savepoint point_3',
                        'rollback to savepoint point_2',
                        'rollback'
                    ]);
                },
                done,
                done
            );
    });

    test('Test query/ begin / commit / rollback all together', function (done) {
        const client = new ClientMock();
        const rxClient = new RxClient(client);
        let errThrown = false;

        try {
            console.dir(RxClientError);
            rxClient.commit();
        } catch (err) {
            console.log(err instanceof RxClientError, err instanceof Error);
        }

        rxClient.begin()
            .concatMap(
                rxClient => rxClient.query('insert into t (q, w, e) values ($1, $2, $3)', [ 1, 2, 3 ]),
                rxClient => rxClient
            )
            .doOnNext(rxClient => {
                assert.strictEqual(rxClient.tlevel, 1);
                assert.deepEqual(rxClient.client.queries[ 1 ], {
                    query: 'insert into t (q, w, e) values ($1, $2, $3)',
                    args: [ 1, 2, 3 ]
                });
            })
            .concatMap(rxClient => rxClient.begin())
            .concatMap(
                rxClient => rxClient.query('delete from t where id = 100500'),
                rxClient => rxClient
            )
            .concatMap(rxClient => rxClient.commit())
            .doOnNext(rxClient => {
                assert.equal(rxClient.tlevel, 1);
            })
            .concatMap(rxClient => rxClient.begin())
            .concatMap(
                rxClient => rxClient.query('update t set id = id'),
                rxClient => rxClient
            )
            .concatMap(rxClient => rxClient.rollback())
            .doOnNext(rxClient => {
                assert.strictEqual(rxClient.tlevel, 1);
            })
            .concatMap(rxClient => rxClient.rollback())
            .concatMap(rxClient => rxClient.rollback())
            .catch(err => {
                assert.instanceOf(err, RxClientError);
                assert.equal(err.message, 'The transaction is not open on the client');
                errThrown = true;

                return Rx.Observable.return(rxClient);
            })
            .subscribe(
                rxClient => {
                    assert.ok(errThrown);
                    assert.ok(client.connected);
                    assert.equal(rxClient.tlevel, 0);
                    assert.equal(client.queries.length, 9);
                    assert.deepEqual(client.queries.map(q => q.query), [
                        'begin',
                        'insert into t (q, w, e) values ($1, $2, $3)',
                        'savepoint point_1',
                        'delete from t where id = 100500',
                        'release savepoint point_1',
                        'savepoint point_1',
                        'update t set id = id',
                        'rollback to savepoint point_1',
                        'rollback'
                    ]);
                },
                done,
                done
            );
    });

    test('Test disposing', function () {
        // todo implement
        assert.ok(true);
    });
});
