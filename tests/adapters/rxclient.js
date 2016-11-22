import { assert } from 'chai';
import sinon from 'sinon';
import Rx from 'rxjs';
import { ClientMock } from '../pgmock';
import { RxClient, RxClientError } from '../../src';

suite('RxClient Adapter tests', function () {
    test('Test initialization', function () {
        assert.throws(() => new RxClient({ query() {} }), RxClientError, 'Client must be instance of Client class');

        const client = new ClientMock();
        const rxClient = new RxClient(client);

        assert.strictEqual(rxClient.client, client);
        assert.equal(rxClient.tlevel, 0);
    });

    suite('Connect / end tests', function () {
        let client, rxClient;

        setup(function () {
            client = new ClientMock();
            rxClient = new RxClient(client);

            sinon.spy(client, 'connect');
            sinon.spy(client, 'end');
        });

        teardown(function (done) {
            client.connect.restore();
            client.end.restore();

            client.end(done);

            client = rxClient = undefined;
        });

        test('Test with not connected pg client', function (done) {
            rxClient.connect()
                .do(rxClient_ => {
                    assert.strictEqual(rxClient_, rxClient);
                    assert.strictEqual(rxClient_.client, client);
                    assert.ok(rxClient.connected);
                    assert.equal(rxClient.tlevel, 0);
                })
                .flatMap(rxClient_ => rxClient_.connect())
                .flatMap(rxClient_ => rxClient_.end())
                .subscribe(
                    rxClient_ => {
                        assert.strictEqual(rxClient_, rxClient);
                        assert.strictEqual(rxClient_.client, client);
                        assert.notOk(rxClient.connected);
                        assert.equal(rxClient.tlevel, 0);
                        assert.ok(client.connect.calledOnce);
                        assert.ok(client.end.calledOnce);
                    },
                    done,
                    done
                );
        });

        test('Test with already connected pg client', function (done) {
            // connect pg client before calling RxClient.prototype.connect method
            client.connect(err => {
                if (err) {
                    return done(err);
                }

                rxClient.connect()
                    .do(rxClient_ => {
                        assert.strictEqual(rxClient_, rxClient);
                        assert.strictEqual(rxClient_.client, client);
                        assert.ok(rxClient.connected);
                        assert.strictEqual(rxClient.tlevel, 0);
                    })
                    .flatMap(rxClient_ => rxClient_.end())
                    .flatMap(rxClient_ => rxClient_.end())
                    .subscribe(
                        rxClient_ => {
                            assert.strictEqual(rxClient_, rxClient);
                            assert.strictEqual(rxClient_.client, client);
                            assert.notOk(rxClient.connected);
                            assert.strictEqual(rxClient.tlevel, 0);
                            assert.ok(client.connect.calledOnce);
                            assert.ok(client.end.calledOnce);
                        },
                        done,
                        done
                    );
            });
        });
    });

    suite('Test queries execution', function () {
        let client, rxClient;

        setup(function () {
            client = new ClientMock();
            rxClient = new RxClient(client);

            sinon.spy(client, 'connect');
            sinon.spy(client, 'end');
            sinon.spy(client, 'query');
        });

        teardown(function () {
            client.connect.restore();
            client.end.restore();
            client.query.restore();

            client = rxClient = undefined;
        });

        test('Test query with pre-connect', function (done) {
            rxClient.connect()
                .flatMap(rxClient_ => rxClient_.query("select $1 :: text str", [ 'qwerty' ]))
                .flatMap(
                    () => rxClient.end(),
                    result => result
                )
                .subscribe(
                    result => {
                        assert.typeOf(result, 'object');
                        assert.deepEqual(result.rows, [ {
                            str: 'qwerty'
                        } ]);
                        assert.notOk(rxClient.connected);
                        assert.strictEqual(rxClient.tlevel, 0);
                        assert.deepEqual(client.queries, [ {
                            queryText: "select $1 :: text str",
                            values: [ 'qwerty' ]
                        } ]);
                        assert.ok(client.query.calledOnce);
                    },
                    done,
                    done
                );
        });

        test('Test query with auto connect', function (done) {
            rxClient.query("select $1 :: text str", [ 'qwerty' ])
                .flatMap(
                    () => rxClient.end(),
                    result => result
                )
                .subscribe(
                    result => {
                        assert.typeOf(result, 'object');
                        assert.deepEqual(result.rows, [ {
                            str: 'qwerty'
                        } ]);
                        assert.notOk(rxClient.connected);
                        assert.strictEqual(rxClient.tlevel, 0);
                        assert.deepEqual(client.queries, [ {
                            queryText: "select $1 :: text str",
                            values: [ 'qwerty' ]
                        } ]);
                        assert.ok(client.query.calledOnce);
                    },
                    done,
                    done
                );
        });

        test('Test parallel queries', function (done) {
            let i = 0;

            rxClient.connect()
                .flatMap(() => Rx.Observable.zip(
                    rxClient.query("select $1 :: text str", [ 'qwerty' ]),
                    rxClient.query("select $1 :: int num, $2 :: text str", [ 2, 'name' ]),
                    rxClient.query('select 123 col')
                ))
                .flatMap(
                    () => rxClient.end(),
                    results => results
                )
                .subscribe(
                    results => {
                        assert.ok(Array.isArray(results));
                        assert.deepEqual(results.map(res => res.rows), [
                            [ { str: 'qwerty' } ],
                            [ { num: 2, str: 'name' } ],
                            [ { col: 123 } ]
                        ]);

                        ++i;
                    },
                    done,
                    () => {
                        assert.strictEqual(i, 1);
                        assert.notOk(rxClient.connected);
                        assert.ok(client.connect.calledOnce);
                        assert.ok(client.end.calledOnce);
                        assert.strictEqual(client.query.callCount, 3);
                        assert.deepEqual(client.queries, [
                            { queryText: "select $1 :: text str", values: [ 'qwerty' ] },
                            { queryText: "select $1 :: int num, $2 :: text str", values: [ 2, 'name' ] },
                            { queryText: "select 123 col", values: undefined },
                        ]);

                        done();
                    }
                );
        });

        test('Test with failed query', function (done) {
            let errThrown;

            rxClient.query("select $1 :: text str", [ 'qwerty' ])
                .flatMap(result => rxClient.query('select * from pg_tables where table_name = $1'))
                .catch(err => {
                    errThrown = err;

                    return rxClient.end();
                })
                .subscribe(
                    () => {
                        assert.notOk(rxClient.connected);
                        assert.ok(client.connect.calledOnce);
                        assert.ok(client.end.calledOnce);
                        assert.strictEqual(client.query.callCount, 2);
                        assert.instanceOf(errThrown, Error);
                        assert.equal(errThrown.message, 'column "table_name" does not exist');
                    },
                    done,
                    done
                );
        });
    });

    // test('Test begin', function (done) {
    //     const client = new ClientMock();
    //     const rxClient = new RxClient(client);
    //     let i = 0;
    //
    //     Rx.Observable.merge(
    //         rxClient.begin(),
    //         rxClient.begin(),
    //         rxClient.begin()
    //     ).subscribe(
    //         rxClient_ => {
    //             assert.strictEqual(rxClient_, rxClient);
    //             assert.strictEqual(rxClient_.client, client);
    //             assert.ok(rxClient.connected);
    //             assert.ok(client.connected);
    //
    //             ++i;
    //         },
    //         done,
    //         () => {
    //             assert.equal(i, 3);
    //             assert.equal(rxClient.tlevel, 3);
    //             assert.deepEqual(client.queries.map(q => q.queryText), [
    //                 'begin',
    //                 'savepoint point_1',
    //                 'savepoint point_2'
    //             ]);
    //
    //             done();
    //         }
    //     );
    // });
    //
    // test('Test commit', function (done) {
    //     const client = new ClientMock();
    //     const rxClient = new RxClient(client);
    //
    //     assert.throws(::rxClient.commit, RxClientError, 'The transaction is not open on the client');
    //
    //     Rx.Observable.zip(
    //         rxClient.begin(),
    //         rxClient.begin(),
    //         rxClient.begin(),
    //         rxClient_ => rxClient_
    //     ).flatMap(rxClient_ => rxClient_.commit())
    //         .do(rxClient_ => {
    //             assert.strictEqual(rxClient_, rxClient);
    //             assert.strictEqual(rxClient_.client, client);
    //             assert.strictEqual(rxClient_.tlevel, 2);
    //         })
    //         .flatMap(rxClient_ => Rx.Observable.zip(rxClient_.commit(true), rxClient_.commit(), rxClient_ => rxClient_))
    //         .catch(err => {
    //             assert.instanceOf(err, RxClientError);
    //             assert.equal(err.message, 'The transaction is not open on the client');
    //
    //             return Rx.Observable.return(rxClient);
    //         })
    //         .do(rxClient_ => {
    //             assert.throws(::rxClient_.commit, RxClientError, 'The transaction is not open on the client');
    //         })
    //         .flatMap(rxClient_ => Rx.Observable.zip(rxClient_.begin(), rxClient_.commit(), rxClient_ => rxClient_))
    //         .subscribe(
    //             rxClient_ => {
    //                 assert.strictEqual(rxClient_, rxClient);
    //                 assert.strictEqual(rxClient_.client, client);
    //                 assert.ok(rxClient.connected);
    //                 assert.ok(client.connected);
    //                 assert.isUndefined(rxClient._transactionSource);
    //                 assert.strictEqual(rxClient.tlevel, 0);
    //                 assert.lengthOf(client.queries, 7);
    //                 assert.deepEqual(client.queries.map(q => q.queryText), [
    //                     'begin',
    //                     'savepoint point_1',
    //                     'savepoint point_2',
    //                     'release savepoint point_2',
    //                     'commit',
    //                     'begin',
    //                     'commit'
    //                 ]);
    //             },
    //             done,
    //             done
    //         );
    // });
    //
    // test('Test rollback', function (done) {
    //     const client = new ClientMock();
    //     const rxClient = new RxClient(client);
    //
    //     assert.throws(::rxClient.rollback, RxClientError, 'The transaction is not open on the client');
    //
    //     Rx.Observable.zip(
    //         rxClient.begin(),
    //         rxClient.begin(),
    //         rxClient.begin(),
    //         rxClient_ => rxClient_
    //     ).flatMap(rxClient_ => rxClient_.rollback())
    //         .do(rxClient_ => {
    //             assert.strictEqual(rxClient_, rxClient);
    //             assert.strictEqual(rxClient_.client, client);
    //             assert.strictEqual(rxClient_.tlevel, 2);
    //         })
    //         .flatMap(rxClient_ => rxClient_.begin())
    //         .flatMap(rxClient_ => Rx.Observable.zip(rxClient_.rollback(true), rxClient_.rollback(), rxClient_ => rxClient_))
    //         .catch(err => {
    //             assert.instanceOf(err, RxClientError);
    //             assert.equal(err.message, 'The transaction is not open on the client');
    //
    //             return Rx.Observable.return(rxClient);
    //         })
    //         .do(rxClient_ => {
    //             assert.throws(::rxClient_.rollback, RxClientError, 'The transaction is not open on the client');
    //         })
    //         .flatMap(rxClient_ => Rx.Observable.zip(rxClient_.begin(), rxClient_.rollback(), rxClient_ => rxClient_))
    //         .subscribe(
    //             rxClient_ => {
    //                 assert.strictEqual(rxClient_, rxClient);
    //                 assert.strictEqual(rxClient_.client, client);
    //                 assert.ok(rxClient.connected);
    //                 assert.ok(client.connected);
    //                 assert.isUndefined(rxClient._transactionSource);
    //                 assert.equal(rxClient.tlevel, 0);
    //                 assert.lengthOf(client.queries, 8);
    //                 assert.deepEqual(client.queries.map(q => q.queryText), [
    //                     'begin',
    //                     'savepoint point_1',
    //                     'savepoint point_2',
    //                     'rollback to savepoint point_2',
    //                     'savepoint point_2',
    //                     'rollback',
    //                     'begin',
    //                     'rollback'
    //                 ]);
    //             },
    //             done,
    //             done
    //         );
    // });
    //
    // test('Test query/ begin / commit / rollback all together', function (done) {
    //     const client = new ClientMock();
    //     const rxClient = new RxClient(client);
    //
    //     rxClient.begin()
    //         .flatMap(
    //             rxClient_ => rxClient_.query('insert into t (q, w, e) values ($1, $2, $3)', [ 1, 2, 3 ]),
    //             rxClient_ => rxClient_
    //         )
    //         .do(rxClient_ => {
    //             assert.strictEqual(rxClient_.tlevel, 1);
    //             assert.deepEqual(rxClient_.client.queries[ 1 ], {
    //                 queryText: 'insert into t (q, w, e) values ($1, $2, $3)',
    //                 values: [ 1, 2, 3 ]
    //             });
    //         })
    //         .flatMap(rxClient_ => rxClient_.begin())
    //         .flatMap(
    //             rxClient_ => rxClient_.query('delete from t where id = 100500'),
    //             rxClient_ => rxClient_
    //         )
    //         .flatMap(rxClient_ => rxClient_.commit())
    //         .do(rxClient_ => {
    //             assert.strictEqual(rxClient_.tlevel, 1);
    //         })
    //         .flatMap(rxClient_ => rxClient_.begin())
    //         .flatMap(
    //             rxClient_ => rxClient_.query('update t set id = id'),
    //             rxClient_ => rxClient_
    //         )
    //         .flatMap(rxClient_ => rxClient_.rollback())
    //         .do(rxClient_ => {
    //             assert.strictEqual(rxClient_.tlevel, 1);
    //         })
    //         .flatMap(rxClient_ => rxClient_.rollback())
    //         .do(rxClient_ => {
    //             assert.throws(::rxClient_.commit, RxClientError, 'The transaction is not open on the client');
    //             assert.throws(::rxClient_.rollback, RxClientError, 'The transaction is not open on the client');
    //         })
    //         .subscribe(
    //             rxClient_ => {
    //                 assert.strictEqual(rxClient_, rxClient);
    //                 assert.strictEqual(rxClient_.client, client);
    //                 assert.ok(rxClient.connected);
    //                 assert.ok(client.connected);
    //                 assert.isUndefined(rxClient._transactionSource);
    //                 assert.strictEqual(rxClient.tlevel, 0);
    //                 assert.lengthOf(client.queries, 9);
    //                 assert.deepEqual(client.queries.map(q => q.queryText), [
    //                     'begin',
    //                     'insert into t (q, w, e) values ($1, $2, $3)',
    //                     'savepoint point_1',
    //                     'delete from t where id = 100500',
    //                     'release savepoint point_1',
    //                     'savepoint point_1',
    //                     'update t set id = id',
    //                     'rollback to savepoint point_1',
    //                     'rollback'
    //                 ]);
    //             },
    //             done,
    //             done
    //         );
    // });
});
