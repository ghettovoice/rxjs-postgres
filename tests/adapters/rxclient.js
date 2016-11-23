import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { ClientMock } from '../pgmock';
import { RxClient, RxClientError } from '../../src';

chai.use(sinonChai);

describe('RxClient Adapter tests', function () {
    describe('Initialization', function () {
        it('Should raise error on wrong constructor usage', function () {
            expect(() => new RxClient({ query() {} })).to.throw(RxClientError, 'Client must be instance of Client class');
            expect(() => new RxClient()).to.throw(RxClientError, 'Client must be instance of Client class');
            expect(() => RxClient()).to.throw(TypeError, "Cannot call a class as a function");
        });

        it('Should be constructed with valid properties', function () {
            const client = new ClientMock();
            const rxClient = new RxClient(client);

            expect(rxClient.client).to.be.equal(client);
            expect(rxClient.tlevel).to.be.equal(0);
        });
    });

    describe('Work with client', function () {
        let client, rxClient;

        beforeEach(function () {
            client = new ClientMock();
            rxClient = new RxClient(client);
        });

        afterEach(function () {
            client = rxClient = undefined;
        });

        describe('Connect', function () {
            it('Should connect not connected pg.Client and return Observable<RxClient>', function (done) {
                sinon.spy(client, 'connect');

                rxClient.connect()
                    .subscribe(
                        rxClient_ => {
                            expect(rxClient_).to.be.equal(rxClient);
                            expect(rxClient_.client).to.be.equal(client);
                            expect(rxClient.connected).is.true;
                            expect(rxClient.tlevel).to.be.equal(0);
                            expect(client.connect).has.been.called;
                        },
                        done,
                        () => {
                            client.connect.restore();
                            client.end(done);
                        }
                    );
            });

            it('Should not call pg.Client connect if already connected', function (done) {
                client.connect(function (err) {
                    if (err) {
                        return done(err);
                    }

                    sinon.spy(client, 'connect');

                    rxClient.connect()
                        .subscribe(
                            rxClient_ => {
                                expect(rxClient_).to.be.equal(rxClient);
                                expect(rxClient_.client).to.be.equal(client);
                                expect(rxClient.connected).is.true;
                                expect(rxClient.tlevel).to.be.equal(0);
                                expect(client.connect).has.not.been.called;
                            },
                            done,
                            () => {
                                client.connect.restore();
                                client.end(done);
                            }
                        );
                });
            });

            it('Should emit error when connection failed', function (done) {
                sinon.stub(client, 'connect', function (cb) {
                    cb(new Error('Failed'));
                });

                rxClient.connect()
                    .subscribe(
                        () => done(new Error('Should not be called')),
                        err => {
                            expect(err).is.instanceOf(Error);
                            expect(client.connect).has.been.called;

                            client.connect.restore();
                            done();
                        },
                        () => done(new Error('Should not be called')),
                    );
            });
        });

        describe('Disconnect', function () {
            it('Should disconnect client and return Observable<RxClient>', function (done) {
                sinon.spy(client, 'end');

                rxClient.connect()
                    .concatMap(rxClient_ => rxClient_.end())
                    .subscribe(
                        rxClient_ => {
                            expect(rxClient).to.be.equal(rxClient);
                            expect(rxClient_.client).to.be.equal(client);
                            expect(rxClient.connected).is.false;
                            expect(rxClient.tlevel).to.be.equal(0);
                            expect(client.end).has.been.called;
                        },
                        done,
                        () => {
                            client.end.restore();
                            client.end(done);
                        }
                    );
            });

            it('Should not call disconnect if client not connected', function (done) {
                sinon.spy(client, 'end');

                rxClient.end()
                    .subscribe(
                        rxClient_ => {
                            expect(rxClient).to.be.equal(rxClient);
                            expect(rxClient_.client).to.be.equal(client);
                            expect(rxClient.connected).is.false;
                            expect(rxClient.tlevel).to.be.equal(0);
                            expect(client.end).has.not.been.called;
                        },
                        done,
                        () => {
                            client.end.restore();
                            done();
                        }
                    );
            });

            it('Should emit error when disconnect failed', function (done) {
                sinon.stub(client, 'end', function (cb) {
                    cb(new Error('Failed'));
                });

                rxClient.connect()
                    .concatMap(rxClient_ => rxClient_.end())
                    .subscribe(
                        () => done(new Error('Should not be called')),
                        err => {
                            expect(err).is.instanceOf(Error);
                            expect(client.end).has.been.called;

                            client.end.restore();
                            client.end(done);
                        },
                        () => done(new Error('Should not be called'))
                    );
            });
        });

        describe('Query execution', function () {
            it('Should return query result object', function (done) {
                sinon.spy(client, 'query');

                rxClient.connect()
                    .concatMap(rxClient_ => rxClient_.query('select $1 :: int col1, $2 :: text col2', [ 123, 'qwerty' ]))
                    .subscribe(
                        result => {
                            expect(result).is.an('object');
                            expect(result.rows).is.an('array');
                            expect(result.rows).to.be.deep.equal([
                                { col1: 123, col2: 'qwerty' }
                            ]);
                            expect(client.query).has.been.called;
                            expect(client.query).has.been.calledWith('select $1 :: int col1, $2 :: text col2', [ 123, 'qwerty' ]);
                        },
                        done,
                        () => {
                            client.query.restore();
                            client.end(done);
                        }
                    );
            });

            it('Should connect before query if not already connected', function (done) {
                sinon.spy(client, 'connect');
                sinon.spy(client, 'query');

                rxClient.query('select $1 :: int col1, $2 :: text col2', [ 123, 'qwerty' ])
                    .subscribe(
                        result => {
                            expect(result).is.an('object');
                            expect(result.rows).is.an('array');
                            expect(result.rows).to.be.deep.equal([
                                { col1: 123, col2: 'qwerty' }
                            ]);
                            expect(client.connect).has.been.called;
                            expect(client.query).has.been.called;
                            expect(client.query).has.been.calledWith('select $1 :: int col1, $2 :: text col2', [ 123, 'qwerty' ]);
                        },
                        done,
                        () => {
                            client.connect.restore();
                            client.query.restore();
                            client.end(done);
                        }
                    );
            });

            it('Should raise error if query failed', function (done) {
                sinon.spy(client, 'connect');
                sinon.spy(client, 'query');

                rxClient.query('select $1 col1, $2 col2 from not_exists_schema.not_exists_table', [ 123, 'qwerty' ])
                    .subscribe(
                        () => done(new Error('Should not be called')),
                        err => {
                            expect(err).is.instanceOf(Error);
                            expect(client.connect).has.been.called;
                            expect(client.query).has.been.called;

                            client.connect.restore();
                            client.query.restore();
                            client.end(done);
                        },
                        () => done(new Error('Should not be called')),
                    );
            });
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
