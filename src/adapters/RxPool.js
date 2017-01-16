import pg from 'pg'
import { Observable } from 'rxjs'
import RxClient from './RxClient'
import { RxPoolError } from '../errors'
import * as util from '../util'

/**
 * Standalone RxJs adapter for `pg.Pool`.
 */
export default class RxPool {
  /**
   * @param {Pool} pool
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
  }

  /**
   * @return {Pool}
   */
  get pool () {
    return this._pool
  }

  /**
   * Acquires {@link Client} from the {@link Pool} and wraps it into {@link RxClient} adapter.
   *
   * @alias {@link RxPool#take}
   *
   * @see {@link RxPool#end}
   * @see {@link RxClient}
   *
   * @return {Observable<RxClient>} Returns single element {@link Observable} sequence
   *    of the connected {@link RxClient}
   */
  connect () {
    return Observable.fromPromise(this._pool.connect())
      .flatMap(client => {
        const rxClient = new RxClient(client)

        rxClient.release = function (err) {
          util.log('RxClient: release')

          delete rxClient.release
          client.release(err)
        }

        return rxClient.connect().mapTo(rxClient)
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
   * @return {Observable<RxPool>}
   */
  end () {
    return Observable.fromPromise(this._pool.end())
      .map(() => this)
      .do(() => util.log('RxPool: pool ended'))
  }

  /**
   * Executes SQL query with arguments and returns {@link Observable} sequence of the query {@link Result} object.
   * You can pass result projection function as second or third argument to map {@link Result} object to
   * another value that will be emitted by the result {@link Observable}.
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
    return this.connect()
      .mergeMap(
        client => client.query(queryText, values, projectFunction)
          .do(undefined, ::client.release, ::client.release)
      )
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

  // /**
  //  * @return {Observable<RxPool>}
  //  */
  // begin() {
  //     this._tclientSource = (this._tclientSource || this.connect())
  //         .flatMap(rxClient => rxClient.begin())
  //         .shareReplay(1);
  //
  //     return this._tclientSource.map(() => this);
  // }
  //
  // /**
  //  * @param {boolean} [force] Commit transaction with all savepoints.
  //  * @return {Observable<RxPool>}
  //  * @throws {RxPoolError}
  //  */
  // commit(force) {
  //     if (!this._tclientSource) {
  //         throw new RxPoolError('Client with open transaction does not exists');
  //     }
  //
  //     this._tclientSource = this._tclientSource.flatMap(rxClient => rxClient.commit(force))
  //         .do(rxClient => {
  //             if (rxClient.txLevel === 0) {
  //                 this._tclientSource = undefined;
  //             }
  //         })
  //         .shareReplay(1);
  //
  //     return this._tclientSource.map(() => this);
  // }
  //
  // /**
  //  * @param {boolean} [force] Rollback transaction with all savepoints.
  //  * @return {Observable<RxPool>}
  //  * @throws {RxPoolError}
  //  */
  // rollback(force) {
  //     if (!this._tclientSource) {
  //         throw new RxPoolError('Client with open transaction does not exists');
  //     }
  //
  //     this._tclientSource = this._tclientSource.flatMap(rxClient => rxClient.rollback(force))
  //         .do(rxClient => {
  //             if (rxClient.txLevel === 0) {
  //                 this._tclientSource = undefined;
  //             }
  //         })
  //         .shareReplay(1);
  //
  //     return this._tclientSource.map(() => this);
  // }
}
