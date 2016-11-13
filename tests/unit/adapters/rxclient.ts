import { assert } from "chai";
import { ResultSet } from "pg";
import { Rx } from "../../boot";
import { ClientMock } from "../pgmock";
import RxClient from "../../../src/adapters/RxClient";
import { RxClientError } from "../../../src/errors";
import { PgClient } from "../../../src/pg";


suite('RxClient Adapter Unit tests', function () {
    test('Test initialization', function () {
        const client = new ClientMock();
        const rxClient = new RxClient(<PgClient>client);

        assert.strictEqual(rxClient.client, client);
        assert.equal(rxClient.tlevel, 0);
        assert.equal(rxClient.isDisposed, false);
    });

    test('Test connect', function (done) {
        const client = new ClientMock();
        const rxClient = new RxClient(<PgClient>client);

        rxClient.connect()
            .subscribe(
                (rxClient : any) => {
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
        const rxClient = new RxClient(<PgClient>client);

        rxClient.connect()
            .flatMap<RxClient>((rxClient : RxClient) => rxClient.end())
            .subscribe(
                (rxClient : any) => {
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
        const rxClient = new RxClient(<PgClient>client);
        let i = 0;

        Rx.Observable.merge<ResultSet>(
            rxClient.query('select 1'),
            rxClient.query('select current_timestamp'),
            rxClient.query("select 'qwerty")
        ).subscribe(
            (res : any) => {
                assert.typeOf(res, 'object');
                assert.ok(Array.isArray(res.rows));
                assert.equal(client.queries.length, 3);
                assert.deepEqual(client.queries.map((q : any) => q.query), [
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
        const rxClient = new RxClient(<PgClient>client);

        rxClient.begin()
            .doOnNext((rxClient : any) => {
                assert.instanceOf(rxClient, RxClient);
                assert.instanceOf(rxClient.client, ClientMock);
                assert.strictEqual(rxClient.tlevel, 1);
            })
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .doOnNext((rxClient : RxClient) => {
                assert.strictEqual(rxClient.tlevel, 2);
            })
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .subscribe(
                (rxClient : RxClient) => {
                    assert.ok(client.connected);
                    assert.equal(rxClient.tlevel, 3);
                    assert.equal(client.queries.length, 3);
                    assert.deepEqual(client.queries.map((q : any) => q.query), [
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
        const rxClient = new RxClient(<PgClient>client);

        assert.throw(() => rxClient.commit(), RxClientError, 'The transaction is not open on the client');

        rxClient.connect()
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
                    assert.ok(client.connected);
                    assert.equal(rxClient.tlevel, 0);
                    assert.equal(client.queries.length, 5);
                    assert.deepEqual(client.queries.map((q : any) => q.query), [
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
        const rxClient = new RxClient(<PgClient>client);

        assert.throw(() => rxClient.commit(), RxClientError, 'The transaction is not open on the client');

        rxClient.connect()
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.begin())
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.rollback())
            .doOnNext((rxClient : any) => {
                assert.instanceOf(rxClient, RxClient);
                assert.instanceOf(rxClient.client, ClientMock);
                assert.strictEqual(rxClient.tlevel, 3);
            })
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.rollback())
            .concatMap<RxClient>((rxClient : RxClient) => rxClient.rollback(true))
            .subscribe(
                (rxClient : RxClient) => {
                    assert.ok(client.connected);
                    assert.equal(rxClient.tlevel, 0);
                    assert.equal(client.queries.length, 7);
                    assert.deepEqual(client.queries.map((q : any) => q.query), [
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
        const rxClient = new RxClient(<PgClient>client);
        let errThrown = false;

        rxClient.begin()
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
                assert.equal(err.message, 'The transaction is not open on the client');
                errThrown = true;

                return Rx.Observable.return(rxClient);
            })
            .subscribe(
                (rxClient : RxClient) => {
                    assert.ok(errThrown);
                    assert.ok(client.connected);
                    assert.equal(rxClient.tlevel, 0);
                    assert.equal(client.queries.length, 9);
                    assert.deepEqual(client.queries.map((q : any) => q.query), [
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
