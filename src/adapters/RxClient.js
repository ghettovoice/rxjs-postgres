import assert from 'assert'
import { Client } from 'pg'
import { Observable } from 'rxjs'
import { RxClientError } from '../errors'
import * as util from '../util'

// todo Try all examples! and add tests to cover use cases from examples.
// todo Try to use rxjs Subject as single source of values, subscribe it to each async operation
// and manually emit results for it's observers, manually complete after closing connection etc...
/**
 * Standalone adapter for `node-postgres` {@link Client} class with Reactive API.
 *
 * @example <caption>Basic usage</caption>
 * import { Client } from 'pg'
 * import { Observable } from 'rxjs'
 * import { RxClient } from 'rxjs-postgres'
 *
 * // Instantiate adapter with node-postgres Client instance
 * let rxClient = new RxClient(new Client({
 *   database: 'postgres',
 *   user: 'postgres'
 * }))
 *
 * // get multiple records from the database (connection will be opened automatically on the first query call)
 * rxClient.queryRowsFlat('select * from main'))
 *   .subscribe(
 *     row => console.log('NEXT', row),
 *     err => console.error('ERROR', err.stack),
 *     () => console.log('COMPLETE')
 *   )
 *
 * @see {@link RxPool}
 * @see {@link Client}
 */
export default class RxClient {
  /**
   * Creates new RxClient instance.
   *
   * @example <caption>Initialization</caption>
   * import { Client } from 'pg'
   * import { RxClient } from 'rxjs-postgres'
   *
   * const rxClient = new RxClient(new Client())
   * // now you are ready to work with PostgreSQL
   * // load some record
   * rxClient.queryRow('select * from main where id = $1', [ 1 ])
   *   // then load some additional related records
   *   .flatMap(
   *     mainRow => rxClient.queryRows(
   *       'select * from child where main_id = $1',
   *       [ mainRow.id ]
   *     ),
   *     (mainRow, children) => ({ ...mainRow, children })
   *   )
   *   .subscribe(
   *     mainRow => console.log('NEXT', mainRow),
   *     err => console.error('ERROR', err.message),
   *     () => console.log('COMPLETE')
   *   )
   *
   * @see {@link RxClient#connect}
   * @see {@link RxClient#end}
   * @see {@link RxClient#query}
   *
   * @param {Client} client Instance of `node-postgres` Client type.
   *
   * @throws {RxClientError} Throws when called with invalid arguments.
   * @throws {TypeError} Throws when called as function.
   */
  constructor (client) {
    if (!(client instanceof Client)) {
      throw new RxClientError('Client must be instance of Client class')
    }

    /**
     * @type {Client}
     * @private
     */
    this._client = client
    /**
     * @type {number}
     * @private
     */
    this._txLevel = this._savedTxLevel = 0
    /**
     * @type {Observable}
     * @private
     */
    this._errorSource = undefined
    /**
     * @type {Observable}
     * @private
     */
    this._connectSource = undefined
    /**
     * @type {Observable}
     * @private
     */
    this._endSource = undefined
    /**
     * @type {Observable}
     * @private
     */
    this._querySource = undefined
  }

  /**
   * Instance of `node-postgres` {@link Client} type.
   *
   * @type {Client}
   */
  get client () {
    return this._client
  }

  /**
   * Current transaction level.
   *
   * @type {number}
   */
  get txLevel () {
    return this._txLevel
  }

  /**
   * True if client connected.
   *
   * @type {boolean}
   */
  get connected () {
    return this._client.connection.stream.readyState === 'open'
  }

  /**
   * Errors hot observable. Use it to subscribe to the client error events.
   *
   * @see {@link Client}
   *
   * @type {Observable<Error>}
   */
  get errors () {
    return this._errorSource
  }

  /**
   * Cleanup client instance after closing connection.
   *
   * @private
   */
  _cleanup () {
    util.log('RxClient: cleanup')

    this._txLevel = this._savedTxLevel = 0
    this._connectSource = undefined
    this._endSource = undefined
    this._querySource = undefined
    this._errorSource = undefined
  }

  /**
   * Opens connection to the database if it not already opened.
   *
   * @alias {@link RxClient#open}
   *
   * @example <caption>Connect to the database</caption>
   * rxClient.connect()
   *   .subscribe(
   *     x => console.log('NEXT', 'Connection opened'),
   *     err => console.error('ERROR', err.message),
   *     () => console.log('COMPLETE', 'Connection opened')
   *   )
   *
   * @see {@link RxClient#end}
   *
   * @return {Observable<boolean>} Returns single boolean {@link Observable} sequence
   *    multicasted with {@link ReplaySubject}
   */
  connect () {
    if (!this._connectSource) {
      this._connectSource = Observable.of(true)
      // wrap errors with Observable to mixin it in external code
      this._errorSource = Observable.fromEvent(this._client, 'error')

      // subscribe to the end to make RxClient cleanup
      Observable.fromEvent(this._client, 'end')
        .take(1)
        .subscribe({
          error: ::this._cleanup,
          complete: ::this._cleanup
        })

      if (!this.connected) {
        const connect = Observable.bindNodeCallback(::this._client.connect, () => true)

        this._connectSource = connect()
          .do(() => util.log('RxClient: client connected'))
          .publishReplay()
          .refCount()
      }
    }
    // todo ignore elements like in begin/commit/rollback ?
    return this._connectSource
  }

  /**
   * Alias of the {@link RxClient#connect}.
   *
   * @see {@link RxClient#connect}
   *
   * @return {Observable<boolean>} Returns single boolean {@link Observable} sequence
   *    multicasted with {@link ReplaySubject}
   */
  open () {
    return this.connect()
  }

  /**
   * Closes connection to the database if client connected.
   *
   * @alias {@link RxClient#close}
   *
   * @example <caption>Close database connection</caption>
   * rxClient.connect()
   *   .concat(rxClient.end())
   *   .subscribe(
   *     x => console.log('NEXT', 'Connection closed'),
   *     err => console.error('ERROR', err.message),
   *     () => console.log('COMPLETE', 'Connection closed')
   *   )
   *
   * @see {@link RxClient#connect}
   *
   * @return {Observable<boolean>} Returns single boolean {@link Observable} sequence
   *    multicasted with {@link ReplaySubject}
   */
  end () {
    if (!this._endSource) {
      this._endSource = Observable.of(true)

      if (this._connectSource) {
        const end = Observable.bindNodeCallback(::this._client.end, () => true)

        this._endSource = this._connectSource.concatMap(() => end())
          .do(() => util.log('RxClient: client ended'))
          .publishReplay()
          .refCount()
      }
    }

    return this._endSource
  }

  /**
   * Alias of the {@link RxClient#end}.
   *
   * @see {@link RxClient#end}
   *
   * @return {Observable<boolean>} Returns single boolean {@link Observable} sequence
   *    multicasted with {@link ReplaySubject}
   */
  close () {
    return this.end()
  }

  /**
   * Executes SQL query with arguments and returns {@link Observable} sequence of the query {@link Result} object.
   * You can pass result projection function as second or third argument to map {@link Result} object to
   * another value that will be emitted by the result {@link Observable}.
   * If client not yet connected then {@link RxClient#connect} will be called before query execution.
   *
   * @example <caption>Simple query with arguments</caption>
   * rxClient.query('select * from main where id = $1', [ 1 ] )
   *   .subscribe(
   *     result => console.log('NEXT', result),
   *     err => console.error('ERROR', err.message),
   *     () => console.log('COMPLETE')
   *   )
   * @example <caption>Map result to the first row</caption>
   * rxClient.query(
   *   'select * from main',
   *   result => result.rows.slice().shift()
   * ).subscribe(
   *   firstRow => console.log('NEXT', firstRow),
   *   err => console.error('ERROR', err.message),
   *   () => console.log('COMPLETE', 'Query executed')
   * )
   * @example <caption>Flatten array of rows</caption>
   * rxClient.query(
   *   'select * from main',
   *   result => Observable.from(result.rows.slice())
   * ).subscribe(
   *   row => console.log('NEXT', row),
   *   err => console.error('ERROR', err.message),
   *   () => console.log('COMPLETE', 'Query executed')
   * )
   *
   * @see {@link RxClient#queryRow}
   * @see {@link RxClient#queryRows}
   * @see {@link RxClient#queryRowsFlat}
   *
   * @param {string} queryText SQL string.
   * @param {Array|function(x: Result): *} [values] Array of query arguments or projection function.
   * @param {function(x: Result): *} [projectFunction] A function which takes the query {@link Result}
   *      and maps it ta the another value or inner {@link Observable}.
   *
   * @return {Observable} Returns {@link Observable} sequence of query {@link Result} or
   *      whatever returned by the `projectFunction`.
   */
  query (queryText, values, projectFunction) {
    if (typeof values === 'function') {
      projectFunction = values
    }

    this._querySource = (this._querySource || this.connect())
      .concatMap(() => {
        const query = Observable.bindNodeCallback(::this._client.query)

        return query(queryText, values)
      })
      .do(
        () => {
          this._commitTxLevel()
          util.log('RxClient: query executed', queryText, this._txLevel)
        },
        () => {
          this._rollbackTxLevel()
          this._querySource = undefined
        },
        () => console.log('complete', queryText)
      )
      .publishReplay()
      .refCount()

    let source = this._querySource
    if (projectFunction) {
      source = source.map(result => {
        const projectedValue = projectFunction(result)

        return projectedValue instanceof Observable
          ? projectedValue
          : Observable.of(projectedValue)
      }).concatAll()
    }

    return source
  }

  /**
   * Executes query and maps the query {@link Result} object to the first returned row.
   *
   * @see {@link RxClient#query}
   * @see {@link RxClient#queryRows}
   * @see {@link RxClient#queryRowsFlat}
   *
   * @param {string} queryText SQL string.
   * @param {Array} [values] Array of query arguments.
   *
   * @return {Observable<Object>} Single element {@link Observable} sequence of the first returned row.
   */
  queryRow (queryText, values) {
    return this.query(queryText, values, result => result.rows.slice().shift())
  }

  /**
   * Executes query and maps query {@link Result} object to the array of rows.
   *
   * @see {@link RxClient#query}
   * @see {@link RxClient#queryRow}
   * @see {@link RxClient#queryRowsFlat}
   *
   * @param {string} queryText SQL string.
   * @param {Array} [values] Array of query arguments.
   *
   * @return {Observable<Array<Object>>} {@link Observable} sequence of array of rows.
   */
  queryRows (queryText, values) {
    return this.query(queryText, values, result => result.rows.slice())
  }

  /**
   * Executes query and maps query {@link Result} object to {@link Observable} sequence of returned rows.
   *
   * @see {@link RxClient#query}
   * @see {@link RxClient#queryRow}
   * @see {@link RxClient#queryRows}
   *
   * @param {string} queryText SQL string.
   * @param {Array} [values] Array of query arguments.
   *
   * @return {Observable<Object>} {@link Observable} sequence of rows returned by the query.
   */
  queryRowsFlat (queryText, values) {
    return this.query(queryText, values, result => Observable.from(result.rows.slice()))
  }

  /**
   * Opens new transaction on the top level when {@link RxClient#txLevel} equals to 0,
   * or creates savepoints for nested transactions when {@link RxClient#txLevel} more than 1 (i.e partial rollback).
   * See PostgreSQL documentation for known limitations of savepoints.
   *
   * @example <caption>Execute SQL queries in transactions</caption>
   * // RxClient#txLevel = 0
   * // begin new transaction
   * rxClient.begin() // RxClient#txLevel = 1
   *   .concat(rxClient.queryRow(
   *     'insert into main (name) values ($1) returning *',
   *     [ 'qwerty' ]
   *   ))
   *   // work with inserted record
   *   .mergeMap(
   *     insertedRow => Observable.concat(
   *       rxClient.begin(), // RxClient#txLevel = 2
   *       // try to execute invalid query
   *       rxClient.queryRow(
   *         'update main set (id, name) = ($1, $2) where id = $3 returning *',
   *         [ 1, 'qwerty new name', insertedRow.id ]
   *       ),
   *       rxClient.commit() // RxClient#txLevel = 1
   *     ).catch(() => rxClient.rollback(insertedRow)) // rollback to the last savepoint if query failed
   *   )
   *   // commit the top level transaction
   *   .mergeMap(row => rxClient.commit(row, true)) // RxClient#txLevel = 0
   *   .subscribe(
   *     row => console.log('NEXT', row),
   *     err => console.error('ERROR', err.message),
   *     () => console.log('COMPLETE')
   *   )
   *
   * @see {@link RxClient#txLevel}
   * @see {@link RxClient#commit}
   * @see {@link RxClient#rollback}
   * @see https://www.postgresql.org/docs/current/static/tutorial-transactions.html
   *
   * @param {*} [mapTo] If defined will be emitted by the returned {@link Observable}
   *
   * @return {Observable} Returns empty {@link Observable} sequence that completes
   *      when transaction successfully opened or {@link Observable} sequence of
   *      whatever passed as `mapTo` argument.
   *
   * @experimental
   */
  begin (mapTo) {
    assert(this._txLevel >= 0, 'Current transaction level >= 0')

    const begin = () => {
      this._commitTxLevel()

      let query
      if (this._txLevel === 0) {
        query = 'begin'
      } else {
        query = `savepoint point_${this._txLevel}`
      }

      ++this._txLevel

      return this.query(query)
    }

    let source = begin()
    if (mapTo != null) {
      source = source.mapTo(mapTo)
    } else {
      source = source.ignoreElements()
    }

    return source
  }

  /**
   * Commits current transaction when {@link RxClient#txLevel} equals to 1
   * or releases last savepoint when {@link RxClient#txLevel} more that 1.
   * Call with `force = true` commits current transaction with all savepoints
   * from any depth level.
   *
   * @example <caption>Execute SQL queries in transactions</caption>
   * // RxClient#txLevel = 0
   * // begin new transaction
   * rxClient.begin() // RxClient#txLevel = 1
   *   .concat(rxClient.queryRow(
   *     'insert into main (name) values ($1) returning *',
   *     [ 'qwerty' ]
   *   ))
   *   // work with inserted record
   *   .mergeMap(
   *     insertedRow => Observable.concat(
   *       rxClient.begin(), // RxClient#txLevel = 2
   *       // try to execute invalid query
   *       rxClient.queryRow(
   *         'update main set (id, name) = ($1, $2) where id = $3 returning *',
   *         [ 1, 'qwerty new name', insertedRow.id ]
   *       ),
   *       rxClient.commit() // RxClient#txLevel = 1
   *     ).catch(() => rxClient.rollback(insertedRow)) // rollback to the last savepoint if query failed
   *   )
   *   // commit the top level transaction
   *   .mergeMap(row => rxClient.commit(row, true)) // RxClient#txLevel = 0
   *   .subscribe(
   *     row => console.log('NEXT', row),
   *     err => console.error('ERROR', err.message),
   *     () => console.log('COMPLETE')
   *   )
   *
   * @see {@link RxClient#txLevel}
   * @see {@link RxClient#begin}
   * @see {@link RxClient#rollback}
   * @see https://www.postgresql.org/docs/current/static/tutorial-transactions.html
   *
   * @param {*} [mapTo] If defined will be emitted by the returned {@link Observable}
   * @param {boolean} [force] If `true` commits transaction with all savepoints.
   *
   * @return {Observable} Returns empty {@link Observable} sequence that completes
   *      when transaction successfully committed or {@link Observable} sequence of
   *      whatever passed as `mapTo` argument.
   *
   * @throws {RxClientError} Throws when transaction doesn't exists.
   *
   * @experimental
   */
  commit (mapTo, force) {
    assert(this._txLevel >= 0, 'Current transaction level >= 0')

    const commit = () => {
      if (this._txLevel === 0) {
        throw new RxClientError('The transaction is not open on the client')
      }

      this._commitTxLevel()

      let query
      if (this._txLevel === 1 || force) {
        query = 'commit'
        this._txLevel = 0
      } else {
        query = `release savepoint point_${--this._txLevel}`
      }

      return this.query(query)
    }

    let source = commit()
    if (mapTo) {
      source = source.mapTo(mapTo)
    } else {
      source = source.ignoreElements()
    }

    return source
  }

  /**
   * Rolls back current transaction when {@link RxClient#txLevel} equals to 1
   * or rolls back to the last savepoint when {@link RxClient#txLevel} more that 1.
   * Call with `force = true` rolls back current transaction with all savepoints
   * from any depth level.
   *
   * @example <caption>Execute SQL queries in transactions</caption>
   * // RxClient#txLevel = 0
   * // begin new transaction
   * rxClient.begin() // RxClient#txLevel = 1
   *   .concat(rxClient.queryRow(
   *     'insert into main (name) values ($1) returning *',
   *     [ 'qwerty' ]
   *   ))
   *   // work with inserted record
   *   .mergeMap(
   *     insertedRow => Observable.concat(
   *       rxClient.begin(), // RxClient#txLevel = 2
   *       // try to execute invalid query
   *       rxClient.queryRow(
   *         'update main set (id, name) = ($1, $2) where id = $3 returning *',
   *         [ 1, 'qwerty new name', insertedRow.id ]
   *       ),
   *       rxClient.commit() // RxClient#txLevel = 1
   *     ).catch(() => rxClient.rollback(insertedRow)) // rollback to the last savepoint if query failed
   *   )
   *   // commit the top level transaction
   *   .mergeMap(row => rxClient.commit(row, true)) // RxClient#txLevel = 0
   *   .subscribe(
   *     row => console.log('NEXT', row),
   *     err => console.error('ERROR', err.message),
   *     () => console.log('COMPLETE')
   *   )
   *
   * @see {@link RxClient#txLevel}
   * @see {@link RxClient#begin}
   * @see {@link RxClient#commit}
   * @see https://www.postgresql.org/docs/current/static/tutorial-transactions.html
   *
   * @param {*} [mapTo] If defined will be emitted by the returned {@link Observable}
   * @param {boolean} [force] If `true` rolls back transaction with all savepoints.
   *
   * @return {Observable} Returns empty {@link Observable} sequence that completes
   *      when transaction successfully rolled back or {@link Observable} sequence of
   *      whatever passed as `mapTo` argument.
   *
   * @throws {RxClientError} Throws when transaction doesn't exists.
   *
   * @experimental
   */
  rollback (mapTo, force) {
    assert(this._txLevel >= 0, 'Current transaction level >= 0')

    const rollback = () => {
      if (this._txLevel === 0) {
        throw new RxClientError('The transaction is not opened on the client')
      }

      this._commitTxLevel()

      let query
      if (this._txLevel === 1 || force) {
        query = 'rollback'
        this._txLevel = 0
      } else {
        query = `rollback to savepoint point_${--this._txLevel}`
      }

      return this.query(query)
    }

    let source = rollback()
    if (mapTo != null) {
      source = source.mapTo(mapTo)
    } else {
      source = source.ignoreElements()
    }

    return source
  }

  /**
   * @private
   */
  _commitTxLevel () {
    this._savedTxLevel = this._txLevel
  }

  /**
   * @private
   */
  _rollbackTxLevel () {
    this._txLevel = this._savedTxLevel
  }
}
