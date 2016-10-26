import { assert } from "chai";
import * as Rx from "rx";
import { ClientMock } from "../pgmock";
import RxClient from "../../../src/adapters/rxclient";
import { ResultSet } from "pg";

const config : any = Rx.config;
config.longStackSupport = true;

/**
 * RxClient Unit tests
 */
describe('RxClient tests', function () {
    it('Test initialization', function () {
        const client = new ClientMock();
        const rxClient = new RxClient(client);

        assert.strictEqual(rxClient.client, client);
        assert.equal(rxClient.tlevel, 0);
        assert.equal(rxClient.isDisposed, false);
    });

    it('Test connect', function (done) {
        const rxClient = new RxClient(new ClientMock());

        rxClient.connect()
            .subscribe(
                (rxClient : any) => {
                    assert.instanceOf(rxClient, RxClient);
                    assert.instanceOf(rxClient.client, ClientMock);
                    assert.ok(rxClient.client.connected);
                },
                done,
                done
            );
    });

    it('Test end', function (done) {
        const rxClient = new RxClient(new ClientMock());

        rxClient.connect()
            .flatMap<RxClient>((client : RxClient) => client.end())
            .subscribe(
                (rxClient : any) => {
                    assert.instanceOf(rxClient, RxClient);
                    assert.instanceOf(rxClient.client, ClientMock);
                    assert.notOk(rxClient.client.connected);
                },
                done,
                done
            );
    });

    it('Test query', function (done) {
        const clientMock = new ClientMock();
        const rxClient = new RxClient(clientMock);

        rxClient.connect()
            .flatMap<ResultSet>((client : RxClient) => client.query('select 1'))
            .subscribe(
                (res : ResultSet) => {
                    assert.typeOf(res, 'object');
                    assert.ok(Array.isArray(res.rows));
                    assert.equal(clientMock.queries.length, 1);
                    assert.equal(clientMock.queries[ 0 ].query, 'select 1');
                },
                done,
                done
            );
    });

    it('Test begin', function (done) {
        const rxClient = new RxClient(new ClientMock());

        rxClient.connect()
            .concatMap<RxClient>((client : RxClient) => client.begin())
            .concatMap<RxClient>((client : RxClient) => client.begin())
            .concatMap<RxClient>((client : RxClient) => client.begin())
            .subscribe(
                (rxClient : RxClient) => {
                    const clientMock = <ClientMock>(rxClient.client);

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
});
