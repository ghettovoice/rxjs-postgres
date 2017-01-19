'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _pg = require('pg');

var _pg2 = _interopRequireDefault(_pg);

var _rxjs = require('rxjs');

var _RxClient = require('./RxClient');

var _RxClient2 = _interopRequireDefault(_RxClient);

var _errors = require('../errors');

var _util = require('../util');

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Standalone adapter for {@link Pool} class with Reactive API.
 *
 * @see {@link RxClient}
 * @see {@link Client}
 */
var RxPool = function () {
  /**
   * @param {Pool} pool Instance of {@link Pool}.
   *
   * @throws {RxClientError} Throws when called with invalid arguments.
   * @throws {TypeError} Throws when called as function.
   */
  function RxPool(pool) {
    _classCallCheck(this, RxPool);

    if (!(pool instanceof _pg2.default.Pool)) {
      throw new _errors.RxPoolError('Pool must be instance of Pool class');
    }

    /**
     * @type {Pool}
     * @private
     */
    this._pool = pool;
    /**
     * @type {Observable<RxClient>}
     * @private
     */
    this._txClientSource = undefined;
    /**
     * @type {Observable}
     * @private
     */
    this._errorSource = _rxjs.Observable.fromEvent(this._pool, 'error');
  }

  /**
   * @type {Pool} Instance of {@link Pool}.
   */


  _createClass(RxPool, [{
    key: 'connect',


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
    value: function connect() {
      var autoRelease = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      return _rxjs.Observable.fromPromise(this._pool.connect()).flatMap(function (client) {
        var rxClient = new _RxClient2.default(client);

        rxClient.release = function (err) {
          util.log('RxClient: release');

          delete rxClient.release;
          client.release(err);
        };

        var clientSource = rxClient.connect().mapTo(rxClient);

        if (autoRelease) clientSource = clientSource.do(undefined, rxClient.release.bind(rxClient), rxClient.release.bind(rxClient));

        return clientSource;
      }).do(function () {
        return util.log('RxPool: client connected');
      });
    }

    /**
     * Alias of the {@link RxPool#connect} method.
     *
     * @return {Observable<RxClient>} Returns single element {@link Observable} sequence
     *    of the connected {@link RxClient}.
     */

  }, {
    key: 'take',
    value: function take() {
      return this.connect();
    }

    /**
     * @return {Observable<boolean>}
     */

  }, {
    key: 'end',
    value: function end() {
      var _this = this;

      return _rxjs.Observable.fromPromise(this._pool.end()).mapTo(true).finally(function () {
        _this._txClientSource = undefined;
      }).do(function () {
        return util.log('RxPool: pool ended');
      });
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

  }, {
    key: 'query',
    value: function query(queryText, values, projectFunction) {
      return (this._txClientSource || this.connect()).mergeMap(function (client) {
        return client.query(queryText, values, projectFunction);
      });
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

  }, {
    key: 'queryRow',
    value: function queryRow(queryText, values) {
      return this.query(queryText, values, function (result) {
        return result.rows.slice().shift();
      });
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

  }, {
    key: 'queryRows',
    value: function queryRows(queryText, values) {
      return this.query(queryText, values, function (result) {
        return result.rows.slice();
      });
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

  }, {
    key: 'queryRowsSeq',
    value: function queryRowsSeq(queryText, values) {
      return this.query(queryText, values, function (result) {
        return _rxjs.Observable.from(result.rows.slice());
      });
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

  }, {
    key: 'begin',
    value: function begin(mapTo) {
      this._txClientSource = (this._txClientSource || this.connect()).mergeMap(function (rxClient) {
        return rxClient.begin(mapTo);
      }).publishReplay().refCount();

      return this._txClientSource;
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

  }, {
    key: 'pool',
    get: function get() {
      return this._pool;
    }

    /**
     * Errors hot observable. Use it to subscribe to the client error events.
     *
     * @see {@link Client}
     *
     * @type {Observable<Error>}
     */

  }, {
    key: 'errors',
    get: function get() {
      return this._errorSource;
    }
  }]);

  return RxPool;
}();

exports.default = RxPool;
//# sourceMappingURL=RxPool.js.map