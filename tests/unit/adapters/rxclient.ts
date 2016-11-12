import { assert } from "chai";
import { ResultSet } from "pg";
import { Rx } from "../../boot";
import { ClientMock } from "../pgmock";
import RxClient from "../../../src/adapters/RxClient";


suite('RxClient Adapter Unit tests', function () {
    test('Test initialization', function () {
        const client = new ClientMock();
        const rxClient = new RxClient(client);

        assert.strictEqual(rxClient.client, client);
        assert.equal(rxClient.tlevel, 0);
        assert.equal(rxClient.isDisposed, false);
    });

    test('Test connect', function (done) {
        const rxClient = new RxClient(new ClientMock());

        rxClient.connect()
            .subscribe(
                (rxClient : any) => {
                    assert.instanceOf(rxClient, RxClient);
                    assert.instanceOf(rxClient.client, ClientMock);

                    rxClient = <RxClient>rxClient;
                    const clientMock = <ClientMock>rxClient.client;

                    assert.ok(clientMock.connected);
                    assert.equal(rxClient.tlevel, 0);
                },
                done,
                done
            );
    });

    test('Test end', function (done) {
        const rxClient = new RxClient(new ClientMock());

        rxClient.connect()
            .flatMap<RxClient>((client : RxClient) => client.end())
            .subscribe(
                (rxClient : any) => {
                    assert.instanceOf(rxClient, RxClient);
                    assert.instanceOf(rxClient.client, ClientMock);

                    rxClient = <RxClient>rxClient;
                    const clientMock = <ClientMock>rxClient.client;

                    assert.notOk(clientMock.connected);
                    assert.strictEqual(rxClient.tlevel, 0);
                },
                done,
                done
            );
    });

    test('Test query', function (done) {
        const clientMock = new ClientMock();
        const rxClient = new RxClient(clientMock);
        let i = 0;

        rxClient.connect()
            .concatMap<ResultSet>((rxClient : RxClient) => {
                return Rx.Observable.merge<ResultSet>(
                    rxClient.query('select 1'),
                    rxClient.query('select current_timestamp'),
                    rxClient.query("select 'qwerty")
                );
            })
            .subscribe(
                (res : any) => {
                    assert.typeOf(res, 'object');
                    assert.ok(Array.isArray(res.rows));
                    assert.equal(clientMock.queries.length, 3);
                    assert.deepEqual(clientMock.queries.map(q => q.query), [
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
        const rxClient = new RxClient(new ClientMock());

        rxClient.connect()
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .doOnNext((rxClient: any) => {
                assert.instanceOf(rxClient, RxClient);
                assert.instanceOf(rxClient.client, ClientMock);

                rxClient = <RxClient>rxClient;
                assert.strictEqual(rxClient.tlevel, 1);
            })
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .doOnNext((rxClient: RxClient) => {
                assert.strictEqual(rxClient.tlevel, 2);
            })
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .subscribe(
                (rxClient : RxClient) => {
                    const clientMock = <ClientMock>rxClient.client;

                    assert.ok(clientMock.connected);
                    assert.equal(rxClient.tlevel, 3);
                    assert.equal(clientMock.queries.length, 3);
                    assert.deepEqual(clientMock.queries.map(q => q.query), [
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
        const rxClient = new RxClient(new ClientMock());
        let errThrown = false;

        rxClient.connect()
            .concatMap<RxClient>((client : RxClient) => client.commit())
            .catch((err : Error) => {
                assert.equal(err.message, 'No opened transaction on the client, nothing to commit');
                errThrown = true;

                return Rx.Observable.return(rxClient);
            })
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.commit())
            .doOnNext((rxClient : RxClient) => {
                assert.instanceOf(rxClient, RxClient);
                assert.instanceOf(rxClient.client, ClientMock);
            })
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.commit(true))
            .subscribe(
                (rxClient : RxClient) => {
                    assert.ok(errThrown);

                    const clientMock = <ClientMock>rxClient.client;

                    assert.ok(clientMock.connected);
                    assert.equal(rxClient.tlevel, 0);
                    assert.equal(clientMock.queries.length, 5);
                    assert.deepEqual(clientMock.queries.map(q => q.query), [
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
        const rxClient = new RxClient(new ClientMock());
        let errThrown = false;

        rxClient.connect()
            .concatMap<RxClient>((client : RxClient) => client.rollback())
            .catch((err : Error) => {
                assert.equal(err.message, 'No opened transaction on the client, nothing to rollback');
                errThrown = true;

                return Rx.Observable.return(rxClient);
            })
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.rollback())
            .doOnNext((rxClient: any) => {
                assert.instanceOf(rxClient, RxClient);
                assert.instanceOf(rxClient.client, ClientMock);
                assert.strictEqual(rxClient.tlevel, 3);
            })
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.rollback())
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.rollback(true))
            .subscribe(
                (rxClient : RxClient) => {
                    assert.ok(errThrown);

                    const clientMock = <ClientMock>rxClient.client;

                    assert.ok(clientMock.connected);
                    assert.equal(rxClient.tlevel, 0);
                    assert.equal(clientMock.queries.length, 7);
                    assert.deepEqual(clientMock.queries.map(q => q.query), [
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
        const rxClient = new RxClient(new ClientMock());
        let errThrown = false;

        rxClient.connect()
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .concatMap<ResultSet, RxClient>(
                (rxClient : RxClient) => rxClient.query('insert into t (q, w, e) values ($1, $2, $3)', [ 1, 2, 3 ]),
                (rxClient : RxClient) => rxClient
            )
            .doOnNext((rxClient : RxClient) => {
                assert.strictEqual(rxClient.tlevel, 1);
                assert.deepEqual((<ClientMock>rxClient.client).queries[ 1 ], {
                    query: 'insert into t (q, w, e) values ($1, $2, $3)',
                    args: [ 1, 2, 3 ]
                });
            })
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .concatMap<ResultSet, RxClient>(
                (rxClient : RxClient) => rxClient.query('delete from t where id = 100500'),
                (rxClient : RxClient) => rxClient
            )
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.commit())
            .doOnNext((rxClient : RxClient) => {
                assert.equal(rxClient.tlevel, 1);
            })
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .concatMap<ResultSet, RxClient>(
                (rxClient : RxClient) => rxClient.query('update t set id = id'),
                (rxClient : RxClient) => rxClient
            )
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.rollback())
            .doOnNext((rxClient : RxClient) => {
                assert.strictEqual(rxClient.tlevel, 1);
            })
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.rollback())
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.rollback())
            .catch((err : Error) => {
                assert.equal(err.message, 'No opened transaction on the client, nothing to rollback');
                errThrown = true;

                return Rx.Observable.return(rxClient);
            })
            .subscribe(
                (rxClient : RxClient) => {
                    assert.ok(errThrown);

                    const clientMock = <ClientMock>rxClient.client;

                    assert.ok(clientMock.connected);
                    assert.equal(rxClient.tlevel, 0);
                    assert.equal(clientMock.queries.length, 9);
                    assert.deepEqual(clientMock.queries.map(q => q.query), [
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
