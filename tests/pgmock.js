import pg from 'pg'
import * as util from '../src/util'
/**
 * node-postgres mocks
 */

/**
 * pg.Client mock
 *
 * @extends {Client}
 */
export class ClientMock extends pg.Client {
  constructor () {
    super({
      user: 'postgres',
      database: 'postgres'
    })

    this.queries = []
  }

  connect (callback) {
    super.connect((err) => {
      if (err) {
        util.err('ClientMock: connection terminated. Error: ' + err.message)
        typeof callback === 'function' && callback(err)
      } else {
        util.log('ClientMock: connected')
        typeof callback === 'function' && callback(undefined, this)
      }
    })
  }

  end (callback) {
    super.end(err => {
      if (err) {
        util.err('ClientMock: ending failed. Error: ' + err.message)
        typeof callback === 'function' && callback(err)
      } else {
        util.log('ClientMock: ended')
        typeof callback === 'function' && callback()
      }
    })
  }

  query (queryText, values, callback) {
    return super.query(queryText, values, (err, res) => {
      if (err) {
        util.err('ClientMock: query failed. Error: ' + err.message, [ queryText ])
        typeof callback === 'function' && callback(err)
      } else {
        this.queries.push({ queryText, values })
        util.log('ClientMock: query executed', queryText)
        typeof callback === 'function' && callback(undefined, res)
      }
    })
  }
}

/**
 * pg.Pool mock, used with ClientMock
 */
export class PoolMock extends pg.Pool {
  constructor (...args) {
    super({
      ...args,
      Client: ClientMock,
      log: util.log
    })

    this.queries = []
  }

  query (queryText, values, cb) {
    return super.query(queryText, values, cb)
      .then(res => {
        this.queries.push({ queryText, values })
        util.log('PoolMock: query executed', [ queryText ])

        return res
      })
      .catch(err => {
        util.err('PoolMock: query failed. Error: ' + err.message)

        throw err
      })
  }
}
