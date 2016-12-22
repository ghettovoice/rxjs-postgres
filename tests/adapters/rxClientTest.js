import chai, { expect } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { Observable } from 'rxjs'
import { ClientMock } from '../pgmock'
import { RxClient, RxClientError } from '../../src'

chai.use(sinonChai)

/** @test {RxClient} */
describe('RxClient Adapter tests', function () {
  let client, rxClient

  beforeEach(function () {
    client = new ClientMock()
    rxClient = new RxClient(client)
  })

  afterEach(function () {
    client = rxClient = undefined
  })

  /** @test {RxClient#constructor} */
  describe('Initialization', function () {
    it('Should raise error on wrong constructor usage', function () {
      expect(() => new RxClient({ query () {} })).to.throw(RxClientError, 'Client must be instance of Client class')
      expect(() => new RxClient()).to.throw(RxClientError, 'Client must be instance of Client class')
      expect(() => RxClient()).to.throw(TypeError, 'Cannot call a class as a function')
    })

    it('Should be constructed with valid properties', function () {
      const client = new ClientMock()
      const rxClient = new RxClient(client)

      expect(rxClient.client).to.be.equal(client)
      expect(rxClient.txLevel).to.be.equal(0)
    })
  })

  /** @test {RxClient#connect} */
  describe('Open connection', function () {
    it('Should connect not already connected pg.Client', function (done) {
      sinon.spy(client, 'connect')

      rxClient.connect()
        .subscribe(
          x => {
            expect(x).is.true
            expect(rxClient.connected).is.true
            expect(rxClient.txLevel).to.be.equal(0)
          },
          done,
          () => {
            expect(client.connect).has.been.calledOnce

            client.connect.restore()
            client.end(done)
          }
        )
    })

    it('Should not call pg.Client#connect if it already connected', function (done) {
      client.connect(function (err) {
        if (err) {
          return done(err)
        }

        sinon.spy(client, 'connect')

        rxClient.connect()
          .subscribe(
            x => {
              expect(x).is.true
              expect(rxClient.connected).is.true
              expect(rxClient.txLevel).to.be.equal(0)
            },
            done,
            () => {
              expect(client.connect).has.not.been.called

              client.connect.restore()
              client.end(done)
            }
          )
      })
    })

    it('Should call pg.Client#connect exactly once', function (done) {
      sinon.spy(client, 'connect')

      Observable.merge(rxClient.connect(), rxClient.connect(), rxClient.connect())
        .subscribe(
          x => {
            expect(x).is.true
            expect(rxClient.connected).is.true
            expect(rxClient.txLevel).to.be.equal(0)
          },
          done,
          () => {
            expect(client.connect).has.been.calledOnce

            client.connect.restore()
            client.end(done)
          }
        )
    })

    it('Should replay result for each subscription', function (done) {
      sinon.spy(client, 'connect')

      let source = rxClient.connect()

      source.subscribe(
        x => {
          expect(x).is.true
        },
        done
      )

      source.subscribe(
        x => {
          expect(x).is.true
        },
        done
      )

      source.subscribe({
        complete: () => {
          expect(client.connect).has.been.calledOnce

          client.connect.restore()
          client.end(done)
        },
        error: done
      })
    })

    it('Should raise error when connection failed', function (done) {
      sinon.stub(client, 'connect', function (cb) {
        cb(new Error('Failed'))
      })

      rxClient.connect()
        .subscribe(
          () => done(new Error('Should not be called')),
          err => {
            expect(err).is.instanceOf(Error)
            expect(err.message).to.be.equal('Failed')
            expect(client.connect).has.been.calledOnce

            client.connect.restore()
            done()
          },
          () => done(new Error('Should not be called')),
        )
    })

    /** @test {RxClient#open} */
    it('Should work through the alias', function (done) {
      sinon.spy(client, 'connect')

      rxClient.open()
        .subscribe(
          x => {
            expect(x).is.true
            expect(rxClient.connected).is.true
          },
          done,
          () => {
            expect(client.connect).has.been.calledOnce

            client.connect.restore()
            client.end(done)
          }
        )
    })
  })

  /** @test {RxClient#end} */
  describe('Close connection', function () {
    it('Should close connection', function (done) {
      sinon.spy(client, 'end')

      rxClient.connect()
        .mergeMapTo(rxClient.end())
        .subscribe(
          x => {
            expect(x).is.true
            expect(rxClient.connected).is.false
            expect(rxClient.txLevel).to.be.equal(0)
          },
          done,
          () => {
            expect(client.end).has.been.calledOnce

            client.end.restore()
            client.end(done)
          }
        )
    })

    it('Should do RxClient cleanup on "end" event', function (done) {
      sinon.spy(rxClient, '_cleanup')

      rxClient.connect()
        .delay(100)
        .subscribe(() => {
          client.end(() => {
            expect(rxClient.connected).is.false
            expect(rxClient._cleanup).has.been.called
            done()
          })
        })
    })

    it('Should not call pg.Client#end if connection already closed', function (done) {
      sinon.spy(client, 'end')

      rxClient.end()
        .subscribe(
          x => {
            expect(x).is.true
            expect(rxClient.connected).is.false
            expect(rxClient.txLevel).to.be.equal(0)
          },
          done,
          () => {
            expect(client.end).has.not.been.calledOnce

            client.end.restore()
            done()
          }
        )
    })

    it('Should replay result for each subscription', function (done) {
      sinon.spy(client, 'end')

      let source = rxClient.connect()
        .mergeMapTo(rxClient.end())

      source.subscribe(
        x => {
          expect(x).is.true
        },
        done
      )

      source.subscribe(
        x => {
          expect(x).is.true
        },
        done
      )

      source.subscribe({
        complete: () => {
          expect(client.end).has.been.calledOnce

          client.end.restore()
          done()
        },
        error: done
      })
    })

    it('Should call pg.Client#end exactly once', function (done) {
      sinon.spy(client, 'end')

      rxClient.connect()
        .merge(rxClient.end(), rxClient.end(), rxClient.end())
        .subscribe(
          x => {
            expect(x).is.true
          },
          done,
          () => {
            expect(rxClient.connected).is.false
            expect(rxClient.txLevel).to.be.equal(0)
            expect(client.end).has.been.calledOnce

            client.end.restore()
            done()
          }
        )
    })

    it('Should raise error when closing connection failed', function (done) {
      sinon.stub(client, 'end', function (cb) {
        cb(new Error('Failed'))
      })

      rxClient.connect()
        .mergeMapTo(rxClient.end())
        .subscribe(
          () => done(new Error('Should not be called')),
          err => {
            expect(err).is.instanceOf(Error)
            expect(err.message).to.be.equal('Failed')
            expect(client.end).has.been.calledOnce

            client.end.restore()
            client.end(done)
          },
          () => done(new Error('Should not be called'))
        )
    })

    /** @test {RxClient#close} */
    it('Should work through the alias', function (done) {
      sinon.spy(client, 'end')

      rxClient.open()
        .mergeMapTo(rxClient.close())
        .subscribe(
          x => {
            expect(x).is.true
            expect(rxClient.connected).is.false
          },
          done,
          () => {
            expect(client.end).has.been.calledOnce

            client.end.restore()
            done()
          }
        )
    })
  })

  /** @test {RxClient#errors} */
  describe('Errors source', function () {
    it('Should raise error when pg.Client emits error', function (done) {
      sinon.spy(client, 'connect')

      rxClient.connect()
        .delay(20)
        .merge(rxClient.errors.flatMap(Observable.throw))
        .subscribe(
          () => done(new Error('Should not be called')),
          err => {
            expect(err).is.instanceOf(Error)
            expect(err.message).to.be.equal('Failed')

            client.connect.restore()
            client.end(done)
          },
          () => done(new Error('Should not be called')),
        )

      setTimeout(() => client.emit('error', new Error('Failed')), 10)
    })
  })

  /** @test {RxClient#query} */
  describe('Query execution', function () {
    it('Should return query result object', function (done) {
      sinon.spy(client, 'query')

      rxClient.query('select $1 :: int col1, $2 :: text col2', [ 123, 'qwerty' ])
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
            expect(client.query).has.been.calledOnce
            expect(client.query).has.been.calledWith('select $1 :: int col1, $2 :: text col2', [ 123, 'qwerty' ])

            client.query.restore()
            client.end(done)
          }
        )
    })

    it('Should connect before execute query if not already connected', function (done) {
      sinon.spy(client, 'connect')
      sinon.spy(client, 'query')

      rxClient.query('select $1 :: int col1, $2 :: text col2', [ 123, 'qwerty' ])
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
            expect(client.connect).has.been.calledOnce
            expect(client.query).has.been.calledOnce
            expect(client.query).has.been.calledWith('select $1 :: int col1, $2 :: text col2', [ 123, 'qwerty' ])

            client.connect.restore()
            client.query.restore()
            client.end(done)
          }
        )
    })

    it('Should raise error if query failed', function (done) {
      sinon.spy(client, 'connect')
      sinon.spy(client, 'query')

      rxClient.query('select $1 col1, $2 col2 from not_exists_table', [ 123, 'qwerty' ])
        .subscribe(
          () => done(new Error('Should not be called')),
          err => {
            expect(err).is.instanceOf(Error)
            expect(err.message).to.be.equal('relation "not_exists_table" does not exist')
            expect(client.connect).has.been.calledOnce
            expect(client.query).has.been.calledOnce

            client.connect.restore()
            client.query.restore()
            client.end(done)
          },
          () => done(new Error('Should not be called')),
        )
    })

    it('Should map result through projection function', function (done) {
      rxClient.query(
        'select * from main where id = $1',
        [ 1 ],
        result => result.rows.shift()
      ).do(row => {
        expect(row).to.be.deep.equal({ id: 1, name: 'row1' })
      }).concatMap(() => rxClient.query(
        'select * from child order by id',
        result => result.rows
      )).subscribe(
        rows => {
          expect(rows).to.be.deep.equal([
            { id: 1, field: 'field value', main_id: 1 },
            { id: 2, field: 'field value 2', main_id: 1 },
            { id: 3, field: 'super value', main_id: 2 }
          ])
        },
        done,
        () => client.end(done)
      )
    })

    /** @test {RxClient#queryRow} */
    it('Should return single row when use queryRow helper', function (done) {
      rxClient.queryRow('select * from main where id = $1', [ 2 ])
        .subscribe(
          row => {
            expect(row).to.be.deep.equal({ id: 2, name: 'row2' })
          },
          done,
          () => client.end(done)
        )
    })

    /** @test {RxClient#queryRows} */
    it('Should return array of rows when use queryRows helper', function (done) {
      rxClient.queryRows('select * from child')
        .subscribe(
          rows => {
            expect(rows).to.be.deep.equal([
              { id: 1, field: 'field value', main_id: 1 },
              { id: 2, field: 'field value 2', main_id: 1 },
              { id: 3, field: 'super value', main_id: 2 }
            ])
          },
          done,
          () => client.end(done)
        )
    })

    /** @test {RxClient#queryRowsSeq} */
    it('Should emit each row as separate value when use queryRowsSeq helper', function (done) {
      const rows = []

      rxClient.queryRowsSeq('select * from child')
        .subscribe(
          row => rows.push(row),
          done,
          () => {
            expect(rows).to.be.deep.equal([
              { id: 1, field: 'field value', main_id: 1 },
              { id: 2, field: 'field value 2', main_id: 1 },
              { id: 3, field: 'super value', main_id: 2 }
            ])

            client.end(done)
          }
        )
    })

    it('Should run queries sequentially in order of RxClient#query call', function (done) {
      rxClient.query('select current_timestamp')
        .merge(
          rxClient.query('select * from main'),
          rxClient.query('select * from child')
        )
        .concat(rxClient.query('select $1 :: text', [ 'qwerty' ]))
        .subscribe(
          () => {},
          done,
          () => {
            expect(client.queries).to.be.deep.equal([
              { queryText: 'select current_timestamp', values: undefined },
              { queryText: 'select * from main', values: undefined },
              { queryText: 'select * from child', values: undefined },
              { queryText: 'select $1 :: text', values: [ 'qwerty' ] }
            ])

            client.end(done)
          }
        )
    })

    it('Should replay result and share subscriptions', function (done) {
      sinon.spy(client, 'query')

      let source = rxClient.queryRows('select * from pg_catalog.pg_tables')

      source.subscribe(x => {
        expect(x).is.an('array')
      }, done)

      source.subscribe(x => {
        expect(x).is.an('array')
      }, done)

      source.subscribe({
        complete: () => {
          expect(client.query).has.been.calledOnce

          client.query.restore()
          client.end(done)
        },
        error: done
      })
    })
  })

  /** @test {RxClient#begin} */
  describe('Begin transaction', function () {
    it('Should open transaction or savepoint', function (done) {
      sinon.spy(client, 'connect')
      sinon.spy(client, 'query')

      rxClient.begin()
        .do(() => done('Should not been called. Should ignores elements by default'))
        .concat(rxClient.begin())
        .concat(rxClient.begin())
        .subscribe(
          () => {
            done(new Error('Should not been called. Should ignores elements by default'))
          },
          done,
          () => {
            expect(rxClient.txLevel).to.equal(3)
            expect(client.connect).has.been.calledOnce
            expect(client.query).has.been.calledThrice
            expect(client.queries.map(q => q.queryText)).to.be.deep.equal([
              'begin',
              'savepoint point_1',
              'savepoint point_2'
            ])

            client.connect.restore()
            client.query.restore()
            client.end(done)
          }
        )
    })

    it('Should save transaction level if error raised', function (done) {
      rxClient.begin()
        .concat(rxClient.query('select current_timestamp'))
        .mergeMap(x => {
          sinon.stub(client, 'query', function (queryText, values, cb) {
            cb(new Error('Failed'))
          })

          return rxClient.query('broken query')
        })
        .mergeMap(x => {
          done(new Error('Should not been called'))
          return rxClient.begin(x)
        })
        .catch(err => {
          expect(err).is.instanceOf(Error)
          expect(err.message).to.be.equal('Failed')
          expect(rxClient.txLevel).to.be.equal(1)

          client.query.restore()

          return rxClient.queryRow('select 123 val')
        })
        .subscribe(
          x => {
            expect(x).is.an('object')
            expect(x.val).to.be.equal(123)
          },
          done,
          () => {
            expect(rxClient.txLevel).to.be.equal(1)

            client.end(done)
          }
        )
    })

    it('Should map to provided argument', function (done) {
      const obj = {}

      rxClient.begin(obj)
        .subscribe(
          x => {
            expect(x).to.be.equal(obj)
          },
          done,
          done
        )
    })
  })

  /** @test {RxClient#commit} */
  describe('Commit transaction', function () {
    it('Should throw error when called without opened transaction', function () {
      expect(() => rxClient.commit()).to.throws(RxClientError, 'The transaction is not opened on the client')
      expect(rxClient.txLevel).to.be.equal(0)
    })

    it('Should execute "commit" query to commit transaction', function (done) {
      sinon.spy(client, 'query')

      rxClient.begin()
        .do(() => done('Should not been called. Should ignores elements by default'))
        .concat(rxClient.commit())
        .subscribe({
          complete: () => {
            expect(client.query).has.been.calledTwice
            expect(client.queries.map(q => q.queryText)).to.be.deep.equal([
              'begin',
              'commit'
            ])
            expect(rxClient.txLevel).to.be.equal(0)

            client.query.restore()
            client.end(done)
          }
        })
    })

    it('Should execute "release savepoint" query when txLevel >= 1', function (done) {
      sinon.spy(client, 'query')

      rxClient.begin()
        .concat(rxClient.query('select 1'))
        .concat(rxClient.begin())
        .concat(rxClient.query('select 2'))
        .concat(rxClient.begin())
        .concat(rxClient.query('select 3'))
        .concat(rxClient.commit())
        .concat(rxClient.commit())
        .concat(rxClient.commit())
        .subscribe({
          complete: () => {
            expect(client.query).has.callCount(9)
            expect(client.queries.map(q => q.queryText)).to.be.deep.equal([
              'begin',
              'select 1',
              'savepoint point_1',
              'select 2',
              'savepoint point_2',
              'select 3',
              'release savepoint point_2',
              'release savepoint point_1',
              'commit'
            ])
            expect(rxClient.txLevel).to.be.equal(0)

            client.query.restore()
            client.end(done)
          }
        })
    })

    it('Should map to provided argument', function (done) {
      const obj = {}

      rxClient.begin(obj)
        .delay(10)
        .mergeMap(x => rxClient.commit(x))
        .subscribe(
          x => {
            expect(x).to.be.equal(obj)
            expect(rxClient.txLevel).to.be.equal(0)
          },
          done,
          done
        )
    })

    it('Should commit transaction with all savepoints when called in force mode', function (done) {
      sinon.spy(client, 'query')

      rxClient.begin()
        .concat(rxClient.query('select 1'))
        .concat(rxClient.begin())
        .concat(rxClient.query('select 2'))
        .concat(rxClient.begin())
        .concat(rxClient.query('select 3'))
        .concat(rxClient.commit())
        .concat(rxClient.commit(undefined, true))
        .subscribe({
          complete: () => {
            expect(client.query).has.callCount(8)
            expect(client.queries.map(q => q.queryText)).to.be.deep.equal([
              'begin',
              'select 1',
              'savepoint point_1',
              'select 2',
              'savepoint point_2',
              'select 3',
              'release savepoint point_2',
              'commit'
            ])
            expect(rxClient.txLevel).to.be.equal(0)

            client.query.restore()
            client.end(done)
          }
        })
    })
  })

  /** @test {RxClient#rollback} */
  describe('Rollback transaction', function () {
    it('Should throw error when called without opened transaction', function () {
      expect(() => rxClient.rollback()).to.throws(RxClientError, 'The transaction is not opened on the client')
      expect(rxClient.txLevel).to.be.equal(0)
    })

    it('Should execute "rollback" query to roll back transaction', function (done) {
      sinon.spy(client, 'query')

      rxClient.begin()
        .do(() => done('Should not been called. Should ignores elements by default'))
        .concat(rxClient.rollback())
        .subscribe({
          complete: () => {
            expect(client.query).has.been.calledTwice
            expect(client.queries.map(q => q.queryText)).to.be.deep.equal([
              'begin',
              'rollback'
            ])
            expect(rxClient.txLevel).to.be.equal(0)

            client.query.restore()
            client.end(done)
          }
        })
    })

    it('Should execute "rollback to savepoint" query when txLevel >= 1', function (done) {
      sinon.spy(client, 'query')

      rxClient.begin()
        .concat(rxClient.query('select 1'))
        .concat(rxClient.begin())
        .concat(rxClient.query('select 2'))
        .concat(rxClient.begin())
        .concat(rxClient.query('select 3'))
        .concat(rxClient.rollback())
        .concat(rxClient.rollback())
        .concat(rxClient.rollback())
        .subscribe({
          complete: () => {
            expect(client.query).has.callCount(9)
            expect(client.queries.map(q => q.queryText)).to.be.deep.equal([
              'begin',
              'select 1',
              'savepoint point_1',
              'select 2',
              'savepoint point_2',
              'select 3',
              'rollback to savepoint point_2',
              'rollback to savepoint point_1',
              'rollback'
            ])
            expect(rxClient.txLevel).to.be.equal(0)

            client.query.restore()
            client.end(done)
          }
        })
    })

    it('Should map to provided argument', function (done) {
      const obj = {}

      rxClient.begin(obj)
        .delay(10)
        .mergeMap(x => rxClient.rollback(x))
        .subscribe(
          x => {
            expect(x).to.be.equal(obj)
            expect(rxClient.txLevel).to.be.equal(0)
          },
          done,
          done
        )
    })

    it('Should roll back transaction with all savepoints when called in force mode', function (done) {
      sinon.spy(client, 'query')

      rxClient.begin()
        .concat(rxClient.query('select 1'))
        .concat(rxClient.begin())
        .concat(rxClient.query('select 2'))
        .concat(rxClient.begin())
        .concat(rxClient.query('select 3'))
        .concat(rxClient.rollback())
        .concat(rxClient.rollback(undefined, true))
        .subscribe({
          complete: () => {
            expect(client.query).has.callCount(8)
            expect(client.queries.map(q => q.queryText)).to.be.deep.equal([
              'begin',
              'select 1',
              'savepoint point_1',
              'select 2',
              'savepoint point_2',
              'select 3',
              'rollback to savepoint point_2',
              'rollback'
            ])
            expect(rxClient.txLevel).to.be.equal(0)

            client.query.restore()
            client.end(done)
          }
        })
    })

    it('Should save transaction level if error raised', function (done) {
      rxClient.begin()
        .concat(rxClient.query('select current_timestamp'))
        .mergeMap(x => {
          sinon.stub(client, 'query', function (queryText, values, cb) {
            cb(new Error('Failed'))
          })

          return rxClient.rollback()
        })
        .mergeMap(x => {
          done(new Error('Should not been called'))
          return rxClient.query('Should not been called')
        })
        .catch(err => {
          expect(err).is.instanceOf(Error)
          expect(err.message).to.be.equal('Failed')
          expect(rxClient.txLevel).to.be.equal(1)

          client.query.restore()

          return rxClient.rollback()
        })
        .subscribe(
          () => {},
          done,
          () => {
            expect(rxClient.txLevel).to.be.equal(0)

            client.end(done)
          }
        )
    })
  })
})
