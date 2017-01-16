import chai, { expect } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { Observable } from 'rxjs'
import { PoolMock, ClientMock } from '../../pgmock'
import { RxPool, RxClient, RxPoolError } from '../../../src'

chai.use(sinonChai)

/** @test {RxPool} */
describe('RxPool Adapter tests', function () {
  let pool, rxPool

  beforeEach(function () {
    pool = new PoolMock()
    rxPool = new RxPool(pool)
  })

  afterEach(function () {
    pool = rxPool = undefined
  })

  /** @test {RxPool#constructor} */
  describe('Initialization', function () {
    it('Should raise error on wrong constructor usage', function () {
      expect(() => new RxPool({ query () {} })).to.throw(RxPoolError, 'Pool must be instance of Pool class')
      expect(() => new RxPool()).to.throw(RxPoolError, 'Pool must be instance of Pool class')
      expect(() => RxPool()).to.throw(TypeError, 'Cannot call a class as a function')
    })

    it('Should be constructed with valid properties', function () {
      const pool = new PoolMock()
      const rxPool = new RxPool(pool)

      expect(rxPool.pool, pool).to.be.equal(pool)
    })
  })

  /** @test {RxPool#connect} */
  describe('Connect new client', function () {
    it('Should acquire client from pool wrapped with RxClient adapter', function (done) {
      sinon.spy(pool, 'connect')

      rxPool.connect()
        .subscribe(
          rxClient => {
            expect(rxClient).is.instanceOf(RxClient)
            expect(rxClient.client).is.instanceOf(ClientMock)
            expect(rxClient.connected).is.true
            expect(rxClient.release).is.an('function')

            rxClient.release()
          },
          done,
          () => {
            expect(pool.pool.getPoolSize()).to.be.equal(1)
            expect(pool.connect).has.been.called

            pool.connect.restore()
            pool.end(done)
          }
        )
    })

    /** @test {RxPool#take} */
    it('Should work through the alias: take', function (done) {
      sinon.spy(pool, 'connect')

      rxPool.take()
        .subscribe(
          rxClient => {
            expect(rxClient).is.instanceOf(RxClient)
            expect(rxClient.client).is.instanceOf(ClientMock)
            expect(rxClient.connected).is.true
            expect(rxClient.client.release).is.an('function')

            rxClient.release()
          },
          done,
          () => {
            expect(pool.pool.getPoolSize()).to.be.equal(1)
            expect(pool.connect).has.been.called

            pool.connect.restore()
            pool.end(done)
          }
        )
    })

    it('Should acquire new client on each call', function (done) {
      sinon.spy(pool, 'connect')

      Observable.zip(rxPool.take(), rxPool.take())
        .subscribe(
          ([ rxClient1, rxClient2 ]) => {
            expect(rxClient1).to.not.equal(rxClient2)

            rxClient1.release()
            rxClient2.release()
          },
          done,
          () => {
            expect(pool.connect).has.been.calledTwice
            expect(pool.pool.getPoolSize()).to.be.equal(2)

            pool.connect.restore()
            pool.end(done)
          }
        )
    })

    it('Should raise error when connection failed', function (done) {
      sinon.stub(ClientMock.prototype, 'connect', function (cb) {
        cb(new Error('Connection failed'))
      })
      sinon.spy(pool, 'connect')

      rxPool.connect()
        .subscribe(
          () => done(new Error('Should not be called')),
          err => {
            expect(err).is.instanceOf(Error)
            expect(pool.connect).has.been.called
            expect(ClientMock.prototype.connect).has.been.called
            expect(pool.pool.getPoolSize()).to.be.equal(0)

            ClientMock.prototype.connect.restore()
            pool.connect.restore()
            pool.end()
            done()
          },
          () => done(new Error('Should not be called'))
        )
    })

    it('Should raise error when release with error', function (done) {
      sinon.spy(pool.pool, 'destroy')
      sinon.spy(pool.pool, 'release')

      rxPool.connect()
        .flatMap(
          rxClient => {
            sinon.spy(rxClient.client, 'release')

            return rxClient.query('broken query')
              .do(
                () => done(new Error('Should not be called')),
                err => {
                  rxClient.release(err)
                  expect(rxClient.client.release).has.been.calledOnce
                  expect(rxClient.client.release).has.been.calledWith(err)
                }
              )
          }
        )
        .subscribe(
          () => done(new Error('Should not be called')),
          err => {
            expect(err).is.instanceOf(Error)

            pool.pool.destroy.restore()
            pool.pool.release.restore()
            pool.end(done)
          },
          () => done(new Error('Should not be called'))
        )
    })
  })

  /** @test {RxPool#end} */
  describe('Destroy pool', function () {
    it('Should end pool after all clients had been released', function (done) {
      sinon.spy(pool, 'connect')
      sinon.spy(pool, 'end')

      Observable.merge(rxPool.take(), rxPool.take())
        .flatMap(
          rxClient => rxClient.query('select now()')
            .do(() => rxClient.release(), ::rxClient.release)
        )
        .last()
        .flatMap(() => rxPool.end())
        .subscribe(
          rxPool_ => {
            expect(rxPool_).to.be.equal(rxPool)
          },
          done,
          () => {
            expect(pool.connect).has.been.calledTwice
            expect(pool.end).has.been.calledOnce
            expect(pool.pool.getPoolSize()).to.be.equal(0)

            pool.connect.restore()
            pool.end.restore()
            done()
          }
        )
    })

    it('Should raise error when pool end failed', function (done) {
      sinon.spy(pool, 'connect')
      sinon.spy(pool, 'end')
      sinon.stub(pool.pool, 'destroyAllNow').throws()

      Observable.merge(rxPool.take(), rxPool.take())
        .flatMap(
          rxClient => rxClient.query('select now()')
            .do(() => rxClient.release(), ::rxClient.release)
        )
        .last()
        .flatMap(() => rxPool.end())
        .subscribe(
          () => done(new Error('Should not be called')),
          err => {
            expect(err).is.instanceOf(Error)
            expect(pool.connect).has.been.calledTwice
            expect(pool.end).has.been.calledOnce
            expect(pool.pool.getPoolSize()).to.be.equal(2)

            pool.connect.restore()
            pool.end.restore()
            pool.pool.destroyAllNow.restore()
            done()
          },
          () => done(new Error('Should not be called'))
        )
    })
  })

  /** @test RxPool#query */
  describe('Query execution', function () {
    it('Should return query result object', function (done) {
      sinon.spy(ClientMock.prototype, 'query')

      rxPool.query('select $1 :: int col1, $2 :: text col2', [ 123, 'qwerty' ])
        .subscribe(
          result => {
            expect(result).is.an('object')
            expect(result.rows).is.an('array')
            expect(result.rows).to.be.deep.equal([
              { col1: 123, col2: 'qwerty' }
            ])
          },
          done,
          () => {
            expect(ClientMock.prototype.query).has.been.calledWith(
              'select $1 :: int col1, $2 :: text col2',
              [ 123, 'qwerty' ]
            )
            expect(pool.pool.getPoolSize()).to.be.equal(1)
            expect(pool.pool.inUseObjectsCount()).to.be.equal(0)

            ClientMock.prototype.query.restore()
            pool.end(done)
          }
        )
    })

    it('Should raise error on failed queries', function (done) {
      sinon.spy(ClientMock.prototype, 'query')

      rxPool.query('select * from not_exists_table')
        .subscribe(
          () => done(new Error('Should not be called')),
          err => {
            expect(err).is.instanceOf(Error)
            expect(err.message).to.be.equal('relation "not_exists_table" does not exist')
            expect(ClientMock.prototype.query).has.been.calledOnce

            ClientMock.prototype.query.restore()
            pool.end(done)
          },
          () => done(new Error('Should not be called'))
        )
    })

    it('Should map result through projection function', function (done) {
      rxPool.query(
        'select $1 :: int col1, $2 :: varchar col2',
        [ 123, 'qwerty' ],
        result => result.rows.shift()
      ).do(row => {
        expect(row).to.be.deep.equal({ col1: 123, col2: 'qwerty' })
      }).concatMap(() => rxPool.query(
        'select * from generate_series(1, 3) as t(col)',
        result => result.rows
      )).subscribe(
        rows => {
          expect(rows).to.be.deep.equal([
            { col: 1 },
            { col: 2 },
            { col: 3 }
          ])
        },
        done,
        () => {
          expect(pool.pool.getPoolSize()).to.be.equal(2)
          expect(pool.pool.inUseObjectsCount()).to.be.equal(0)

          pool.end(done)
        }
      )
    })

    /** @test {RxPool#queryRow} */
    it('Should return single row when use queryRow helper', function (done) {
      rxPool.queryRow('select * from generate_series(1, 3) as t(col) order by 1 desc')
        .subscribe(
          row => {
            expect(row).to.be.deep.equal({ col: 3 })
          },
          done,
          () => {
            expect(pool.pool.getPoolSize()).to.be.equal(1)
            expect(pool.pool.inUseObjectsCount()).to.be.equal(0)

            pool.end(done)
          }
        )
    })

    /** @test {RxPool#queryRows} */
    it('Should return array of rows when use queryRows helper', function (done) {
      rxPool.queryRows('select * from generate_series(1, 3) as t(col) order by 1 desc')
        .subscribe(
          rows => {
            expect(rows).to.be.deep.equal([
              { col: 3 },
              { col: 2 },
              { col: 1 }
            ])
          },
          done,
          () => {
            expect(pool.pool.getPoolSize()).to.be.equal(1)
            expect(pool.pool.inUseObjectsCount()).to.be.equal(0)

            pool.end(done)
          }
        )
    })

    /** @test {RxPool#queryRowsSeq} */
    it('Should emit each row as separate value when use queryRowsSeq helper', function (done) {
      const rows = []

      rxPool.queryRowsSeq('select * from generate_series(1, 3) as t(col)')
        .subscribe(
          row => rows.push(row),
          done,
          () => {
            expect(rows).to.be.deep.equal([
              { col: 1 },
              { col: 2 },
              { col: 3 }
            ])
            expect(pool.pool.getPoolSize()).to.be.equal(1)
            expect(pool.pool.inUseObjectsCount()).to.be.equal(0)

            pool.end(done)
          }
        )
    })
  })

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
  //                 assert.equal(rxClient.txLevel, 3);
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
  //             assert.strictEqual(rxClient.txLevel, 2);
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
  //                 assert.equal(rxClient.txLevel, 0);
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
})
