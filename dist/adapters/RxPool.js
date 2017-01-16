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
 * Standalone RxJs adapter for `pg.Pool`.
 */
var RxPool = function () {
  /**
   * @param {Pool} pool
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
  }

  /**
   * @return {Pool}
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
     * @return {Observable<RxClient>} Returns single element {@link Observable} sequence
     *    of the connected {@link RxClient}
     */
    value: function connect() {
      return _rxjs.Observable.fromPromise(this._pool.connect()).flatMap(function (client) {
        var rxClient = new _RxClient2.default(client);

        rxClient.release = function (err) {
          util.log('RxClient: release');

          delete rxClient.release;
          client.release(err);
        };

        return rxClient.connect().mapTo(rxClient);
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
     * @return {Observable<RxPool>}
     */

  }, {
    key: 'end',
    value: function end() {
      var _this = this;

      return _rxjs.Observable.fromPromise(this._pool.end()).map(function () {
        return _this;
      }).do(function () {
        return util.log('RxPool: pool ended');
      });
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

  }, {
    key: 'query',
    value: function query(queryText, values, projectFunction) {
      return this.connect().mergeMap(function (client) {
        return client.query(queryText, values, projectFunction).do(undefined, client.release.bind(client), client.release.bind(client));
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

  }, {
    key: 'pool',
    get: function get() {
      return this._pool;
    }
  }]);

  return RxPool;
}();

exports.default = RxPool;
//# sourceMappingURL=RxPool.js.map