import { assert } from "chai";
import { Rx } from "../../boot";
import { ClientMock } from "../pgmock";
import { RxClient, RxClientError, config } from "../../../src";

suite('RxClient Adapter Unit tests', function () {
    test('Test initialization', function () {
        assert.throws(() => new RxClient({ query() {} }), RxClientError, 'Client must be instance of pg.Client class');

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
                rxClient_ => {
                    assert.strictEqual(rxClient_, rxClient);
                    assert.strictEqual(rxClient_.client, client);
                    assert.ok(rxClient.connected);
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
                rxClient_ => {
                    assert.strictEqual(rxClient_, rxClient);
                    assert.strictEqual(rxClient_.client, client);
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
            rxClient.query("select 'qwerty'")
        ).subscribe(
            res => {
                assert.typeOf(res, 'object');
                assert.ok(Array.isArray(res.rows));

                ++i;
            },
            done,
            () => {
                assert.equal(i, 3);
                assert.deepEqual(client.queries.map(q => q.query), [
                    'select 1',
                    'select current_timestamp',
                    "select 'qwerty'"
                ]);

                done();
            }
        );
    });

    test('Test begin', function (done) {
        const client = new ClientMock();
        const rxClient = new RxClient(client);
        let i = 0;

        Rx.Observable.merge(
            rxClient.begin(),
            rxClient.begin(),
            rxClient.begin()
        ).subscribe(
            rxClient_ => {
                assert.strictEqual(rxClient_, rxClient);
                assert.strictEqual(rxClient_.client, client);
                assert.ok(client.connected);

                ++i;
            },
            done,
            () => {
                assert.equal(i, 3);
                assert.equal(rxClient.tlevel, 3);
                assert.deepEqual(client.queries.map(q => q.query), [
                    'begin',
                    'savepoint point_1',
                    'savepoint point_2'
                ]);

                done();
            }
        );
    });

    test('Test commit', function (done) {
        const client = new ClientMock();
        const rxClient = new RxClient(client);

        assert.throws(::rxClient.commit, RxClientError, 'The transaction is not open on the client');

        rxClient.connect()
            .flatMap(rxClient => rxClient.begin())
            .flatMap(rxClient => rxClient.begin())
            .flatMap(rxClient => rxClient.begin())
            .flatMap(rxClient => rxClient.commit())
            .do(rxClient => {
                assert.instanceOf(rxClient, RxClient);
                assert.instanceOf(rxClient.client, ClientMock);
                assert.strictEqual(rxClient.tlevel, 2);
            })
            .flatMap(rxClient => rxClient.commit(true))
            .subscribe(
                rxClient => {
                    assert.ok(client.connected);
                    assert.strictEqual(rxClient.tlevel, 0);
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

        assert.throws(::rxClient.commit, RxClientError, 'The transaction is not open on the client');

        rxClient.connect()
            .flatMap(rxClient => rxClient.begin())
            .flatMap(rxClient => rxClient.begin())
            .flatMap(rxClient => rxClient.begin())
            .flatMap(rxClient => rxClient.begin())
            .flatMap(rxClient => rxClient.rollback())
            .do(rxClient => {
                assert.instanceOf(rxClient, RxClient);
                assert.instanceOf(rxClient.client, ClientMock);
                assert.strictEqual(rxClient.tlevel, 3);
            })
            .flatMap(rxClient => rxClient.rollback())
            .flatMap(rxClient => rxClient.rollback(true))
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

        rxClient.begin()
            .flatMap(
                rxClient => rxClient.query('insert into t (q, w, e) values ($1, $2, $3)', [ 1, 2, 3 ]),
                rxClient => rxClient
            )
            .do(rxClient => {
                assert.strictEqual(rxClient.tlevel, 1);
                assert.deepEqual(rxClient.client.queries[ 1 ], {
                    query: 'insert into t (q, w, e) values ($1, $2, $3)',
                    args: [ 1, 2, 3 ]
                });
            })
            .flatMap(rxClient => rxClient.begin())
            .flatMap(
                rxClient => rxClient.query('delete from t where id = 100500'),
                rxClient => rxClient
            )
            .flatMap(rxClient => rxClient.commit())
            .do(rxClient => {
                assert.equal(rxClient.tlevel, 1);
            })
            .flatMap(rxClient => rxClient.begin())
            .flatMap(
                rxClient => rxClient.query('update t set id = id'),
                rxClient => rxClient
            )
            .flatMap(rxClient => rxClient.rollback())
            .do(rxClient => {
                assert.strictEqual(rxClient.tlevel, 1);
            })
            .flatMap(rxClient => rxClient.rollback())
            .flatMap(rxClient => rxClient.rollback())
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
