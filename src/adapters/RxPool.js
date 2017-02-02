import pg from 'pg'
import { Observable } from 'rxjs'
import RxClient from './RxClient'
import { RxPoolError } from '../errors'
import * as util from '../util'

/**
 * Standalone adapter for {@link Pool} class with Reactive API.
 *
 * @see {@link RxClient}
 * @see {@link Client}
 */
export default class RxPool {
  /**
   * @param {Pool} pool Instance of {@link Pool}.
   *
   * @throws {RxClientError} Throws when called with invalid arguments.
   * @throws {TypeError} Throws when called as function.
   */
  constructor (pool) {
    if (!(pool instanceof pg.Pool)) {
      throw new RxPoolError('Pool must be instance of Pool class')
    }

    /**
     * @type {Pool}
     * @private
     */
    this._pool = pool
    /**
     * @type {Observable<RxClient>}
     * @private
     */
    this._txClientSource = undefined
    /**
     * @type {Observable}
     * @private
     */
    this._errorSource = Observable.fromEvent(this._pool, 'error')
  }

  /**
   * @type {Pool} Instance of {@link Pool}.
   */
  get pool () {
    return this._pool
  }

  /**
   * Errors hot observable. Use it to subscribe to the pool errors.
   *
   * @see {@link Client}
   *
   * @type {Observable<Error>}
   */
  get errors () {
    return this._errorSource
  }

  /**
   * Acquires {@link Client} from the {@link Pool} and wraps it into {@link RxClient} adapter.
   *
   * @alias {@link RxPool#take}
   *
   * @see {@link RxPool#end}
   * @see {@link RxClient}
   *
   * @param {boolean} [autoRelease=true] Release client after complete.
   * @return {Observable<RxClient>} Returns single element {@link Observable} sequence
   *    of the connected {@link RxClient}
   */
  connect (autoRelease = true) {
    return Observable.fromPromise(this._pool.connect())
      .flatMap(client => {
        const rxClient = new RxClient(client)

        rxClient.release = function (err) {
          util.log('RxClient: release')

          delete rxClient.release
          client.release(err)
        }

        let clientSource = rxClient.connect().mapTo(rxClient)

        if (autoRelease) clientSource = clientSource.do(undefined, ::rxClient.release, ::rxClient.release)

        return clientSource
      })
      .do(() => util.log('RxPool: client connected'))
  }

  /**
   * Alias of the {@link RxPool#connect} method.
   *
   * @return {Observable<RxClient>} Returns single element {@link Observable} sequence
   *    of the connected {@link RxClient}.
   */
  take () {
    return this.connect()
  }

  /**
   * @return {Observable<boolean>}
   */
  end () {
    return Observable.fromPromise(this._pool.end())
      .mapTo(true)
      .finally(() => {
        this._txClientSource = undefined
      })
      .do(() => util.log('RxPool: pool ended'))
  }

  /**
   * Executes SQL query with arguments and returns {@link Observable} sequence of the query {@link Result} object.
   * You can pass result projection function as second or third argument to map {@link Result} object to
   * another value that will be emitted by the result {@link Observable}.
   *
   * @example <caption>Simple query with arguments</caption>
   * rxPool.query('select * from main where id = $1', [ 1 ] )
   *   .subscribe(
   *     result => console.log('NEXT', result),
   *     err => console.error('ERROR', err.message),
   *     () => console.log('COMPLETE')
   *   )
   *
   * @see {@link RxPool#queryRow}
   * @see {@link RxPool#queryRows}
   * @see {@link RxPool#queryRowsSeq}
   * @see {@link RxClient#query}
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
    return (this._txClientSource || this.connect())
      .mergeMap(client => client.query(queryText, values, projectFunction))
  }

  /**
   * Executes query and maps the query {@link Result} object to the first returned row.
   *
   * @see {@link RxPool#query}
   * @see {@link RxPool#queryRows}
   * @see {@link RxPool#queryRowsSeq}
   * @see {@link RxClient#query}
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
   * @see {@link RxPool#query}
   * @see {@link RxPool#queryRow}
   * @see {@link RxPool#queryRowsSeq}
   * @see {@link RxClient#query}
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
   * @see {@link RxPool#query}
   * @see {@link RxPool#queryRow}
   * @see {@link RxPool#queryRows}
   * @see {@link RxClient#query}
   *
   * @param {string} queryText SQL string.
   * @param {Array} [values] Array of query arguments.
   *
   * @return {Observable<Object>} {@link Observable} sequence of rows returned by the query.
   */
  queryRowsSeq (queryText, values) {
    return this.query(queryText, values, result => Observable.from(result.rows.slice()))
  }

  /**
   * Opens new transaction on the top level when {@link RxClient#txLevel} equals to 0,
   * or creates savepoints for nested transactions when {@link RxClient#txLevel} more than 1 (i.e partial rollback).
   * See PostgreSQL documentation for known limitations of savepoints.
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
    this._txClientSource = (this._txClientSource || this.connect())
      .mergeMap(rxClient => rxClient.begin(mapTo))
      .publishReplay()
      .refCount()

    return this._txClientSource
  }

  // /**
  //  * @param {boolean} [force] Commit transaction with all savepoints.
  //  * @return {Observable<RxPool>}
  //  *
  //  * @throws {RxPoolError}
  //  *
  //  * @experimental
  //  */
  // commit (force) {
  //   if (!this._tclientSource) {
  //     throw new RxPoolError('Client with open transaction does not exists')
  //   }
  //
  //   this._tclientSource = this._tclientSource.flatMap(rxClient => rxClient.commit(force))
  //     .do(rxClient => {
  //       if (rxClient.txLevel === 0) {
  //         this._tclientSource = undefined
  //       }
  //     })
  //     .shareReplay(1)
  //
  //   return this._tclientSource.map(() => this)
  // }
  //
  // /**
  //  * @param {boolean} [force] Rollback transaction with all savepoints.
  //  * @return {Observable<RxPool>}
  //  *
  //  * @throws {RxPoolError}
  //  *
  //  * @experimental
  //  */
  // rollback (force) {
  //   if (!this._tclientSource) {
  //     throw new RxPoolError('Client with open transaction does not exists')
  //   }
  //
  //   this._tclientSource = this._tclientSource.flatMap(rxClient => rxClient.rollback(force))
  //     .do(rxClient => {
  //       if (rxClient.txLevel === 0) {
  //         this._tclientSource = undefined
  //       }
  //     })
  //     .shareReplay(1)
  //
  //   return this._tclientSource.map(() => this)
  // }
}
