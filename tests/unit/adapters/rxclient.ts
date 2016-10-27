import { assert } from "chai";
import * as Rx from "rx";
import { ClientMock } from "../pgmock";
import RxClient from "../../../src/adapters/rxclient";
import { ResultSet } from "pg";

(Rx.config as any).longStackSupport = true;

/**
 * RxClient Unit tests
 */
suite('RxClient tests', function () {
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

        rxClient.connect()
            .flatMap<ResultSet>((client : RxClient) => client.query('select 1'))
            .subscribe(
                (res : any) => {
                    assert.typeOf(res, 'object');
                    assert.ok(Array.isArray(res.rows));
                    assert.equal(clientMock.queries.length, 1);
                    assert.equal(clientMock.queries[ 0 ].query, 'select 1');
                },
                done,
                done
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

    test('Test begin / commit / rollback all together', function () {
        assert.ok(false);
    });

    test('Test disposing', function () {
        assert.ok(false);
    });
});
