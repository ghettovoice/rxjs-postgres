'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _pg = require('pg');

var _rxjs = require('rxjs');

var _errors = require('../errors');

var _util = require('../util');

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Standalone adapter for {@link Client} class with Reactive API.
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
 * rxClient.queryRowsSeq('select * from main'))
 *   .subscribe(
 *     row => console.log('NEXT', row),
 *     err => console.error('ERROR', err.stack),
 *     () => console.log('COMPLETE')
 *   )
 *
 * @see {@link RxPool}
 * @see {@link Client}
 *
 * @todo helpers for column value selection
 */
var RxClient = function () {
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
   *   .mergeMap(
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
   * @param {Client} client Instance of {@link Client}.
   *
   * @throws {RxClientError} Throws when called with invalid arguments.
   * @throws {TypeError} Throws when called as function.
   */
  function RxClient(client) {
    _classCallCheck(this, RxClient);

    if (!(client instanceof _pg.Client)) {
      throw new _errors.RxClientError('Client must be instance of Client class');
    }

    /**
     * @type {Client}
     * @private
     */
    this._client = client;
    /**
     * @type {number}
     * @private
     */
    this._txLevel = this._savedTxLevel = 0;
  }

  /**
   * Instance of {@link Client}.
   *
   * @type {Client}
   */


  _createClass(RxClient, [{
    key: '_cleanup',


    /**
     * Cleanup client instance after closing connection.
     *
     * @private
     */
    value: function _cleanup() {
      util.log('RxClient: cleanup');

      this._txLevel = this._savedTxLevel = 0;
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
     * @return {Observable<boolean>} Returns single element {@link Observable} sequence.
     */

  }, {
    key: 'connect',
    value: function connect() {
      var source = _rxjs.Observable.of(true);

      if (!this.connected) {
        var _context;

        // subscribe to the end to make RxClient cleanup
        // noinspection JSUnresolvedFunction
        _rxjs.Observable.fromEvent(this._client, 'end').take(1).finally(this._cleanup.bind(this)).subscribe();

        var connect = _rxjs.Observable.bindNodeCallback((_context = this._client).connect.bind(_context), function () {
          return true;
        });
        source = connect().do(function () {
          return util.log('RxClient: client connected');
        });
      }

      return source;
    }

    /**
     * Alias of the {@link RxClient#connect}.
     *
     * @see {@link RxClient#connect}
     *
     * @return {Observable<boolean>} Returns single element {@link Observable} sequence.
     */

  }, {
    key: 'open',
    value: function open() {
      return this.connect();
    }

    /**
     * Closes connection to the database if client connected.
     *
     * @alias {@link RxClient#close}
     *
     * @example <caption>Close database connection</caption>
     * rxClient.connect()
     *   .concatMap(() => rxClient.end())
     *   .subscribe(
     *     x => console.log('NEXT', 'Connection closed'),
     *     err => console.error('ERROR', err.message),
     *     () => console.log('COMPLETE', 'Connection closed')
     *   )
     *
     * @see {@link RxClient#connect}
     *
     * @return {Observable<boolean>} Returns single element {@link Observable} sequence.
     */

  }, {
    key: 'end',
    value: function end() {
      var source = _rxjs.Observable.of(true);

      if (this.connected) {
        var _context2;

        var end = _rxjs.Observable.bindNodeCallback((_context2 = this._client).end.bind(_context2), function () {
          return true;
        });
        source = end().do(function () {
          return util.log('RxClient: client ended');
        });
      }

      return source;
    }

    /**
     * Alias of the {@link RxClient#end}.
     *
     * @see {@link RxClient#end}
     *
     * @return {Observable<boolean>} Returns single boolean {@link Observable} sequence
     */

  }, {
    key: 'close',
    value: function close() {
      return this.end();
    }

    /**
     * Executes SQL query with arguments and returns {@link Observable} sequence of the query {@link Result} object.
     * You can pass result projection function as second or third argument to map {@link Result} object to
     * another value that will be emitted by the outer {@link Observable}.
     * If client not yet connected then {@link RxClient#connect} will be called before query execution.
     *
     * @example <caption>Simple query with arguments</caption>
     * rxClient.query('select * from main where id = $1', [ 1 ])
     *   .subscribe(
     *     result => console.log('NEXT', result),
     *     err => console.error('ERROR', err.message),
     *     () => console.log('COMPLETE')
     *   )
     * @example <caption>Query with arguments and result projection function</caption>
     * rxClient.query(
     *   'select * from main where id = $1',
     *   [ 123 ],
     *   result => result.rows.slice().shift()
     * ).subscribe(
     *   firstRow => console.log('NEXT', firstRow),
     *   err => console.error('ERROR', err.message),
     *   () => console.log('COMPLETE', 'Query executed')
     * )
     *
     * @see {@link RxClient#queryRow}
     * @see {@link RxClient#queryRows}
     * @see {@link RxClient#queryRowsSeq}
     *
     * @param {string} queryText SQL string.
     * @param {Array|function(x: Result): *} [values] Array of query arguments or projection function.
     * @param {function(x: Result): *} [projectFunction] A function which takes the query {@link Result}
     *      and maps it ta the another value or inner {@link Observable}.
     *
     * @return {Observable<T>} Returns {@link Observable} sequence of query {@link Result} or
     *      whatever returned by the `projectFunction`.
     */

  }, {
    key: 'query',
    value: function query(queryText, values, projectFunction) {
      var _this = this;

      if (typeof values === 'function') {
        projectFunction = values;
      }

      var source = this.connect().concatMap(function () {
        var _context3;

        var query = _rxjs.Observable.bindNodeCallback((_context3 = _this._client).query.bind(_context3));

        return query(queryText, values);
      }).do(function () {
        util.log('RxClient: query executed', [queryText, _this._txLevel]);
        _this._commitTxLevel();
      }, function (err) {
        util.err('RxClient: query failed', [queryText, _this._txLevel, err.stack]);
        _this._rollbackTxLevel();
      });

      if (projectFunction) {
        source = source.map(function (result) {
          var projectedValue = projectFunction(result);

          return projectedValue instanceof _rxjs.Observable ? projectedValue : _rxjs.Observable.of(projectedValue);
        }).concatAll();
      }

      return source;
    }

    /**
     * Executes query and maps the query {@link Result} object to the first returned row.
     *
     * @see {@link RxClient#query}
     * @see {@link RxClient#queryRows}
     * @see {@link RxClient#queryRowsSeq}
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
     * @see {@link RxClient#query}
     * @see {@link RxClient#queryRow}
     * @see {@link RxClient#queryRowsSeq}
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
     * @see {@link RxClient#query}
     * @see {@link RxClient#queryRow}
     * @see {@link RxClient#queryRows}
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
     * @example <caption>Execute SQL queries in transactions</caption>
     * // RxClient#txLevel = 0
     * // begin new transaction
     * rxClient.begin() // RxClient#txLevel = 1
     *   .mergeMap(() => rxClient.queryRow(
     *     'insert into main (name) values ($1) returning *',
     *     [ 'qwerty' ]
     *   ))
     *   // work with inserted record
     *   .mergeMap(
     *     insertedRow => rxClient.begin() // RxClient#txLevel = 2
     *       // try to execute invalid query
     *       .mergeMap(() => rxClient.queryRow(
     *         'update main set (id, name) = ($1, $2) where id = $3 returning *',
     *         [ 1, 'qwerty new name', insertedRow.id ]
     *       ))
     *       .mergeMap(updatedRow => rxClient.commit(updatedRow)) // RxClient#txLevel = 1
     *       .catch(() => rxClient.rollback(insertedRow))  // rollback to the last savepoint if query failed
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
     * @return {Observable} Returns single element {@link Observable} sequence that completes
     *      when transaction successfully opened or {@link Observable} sequence of
     *      whatever passed as `mapTo` argument.
     *
     * @experimental
     */

  }, {
    key: 'begin',
    value: function begin() {
      var _this2 = this;

      var mapTo = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      (0, _assert2.default)(this._txLevel >= 0, 'Current transaction level >= 0');

      var begin = function begin() {
        _this2._commitTxLevel();

        var query = void 0;
        if (_this2._txLevel === 0) {
          query = 'begin';
        } else {
          query = 'savepoint point_' + _this2._txLevel;
        }

        ++_this2._txLevel;

        return _this2.query(query);
      };

      return begin().mapTo(mapTo);
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
     *   .mergeMap(() => rxClient.queryRow(
     *     'insert into main (name) values ($1) returning *',
     *     [ 'qwerty' ]
     *   ))
     *   // work with inserted record
     *   .mergeMap(
     *     insertedRow => rxClient.begin() // RxClient#txLevel = 2
     *       // try to execute invalid query
     *       .mergeMap(() => rxClient.queryRow(
     *         'update main set (id, name) = ($1, $2) where id = $3 returning *',
     *         [ 1, 'qwerty new name', insertedRow.id ]
     *       ))
     *       .mergeMap(updatedRow => rxClient.commit(updatedRow)) // RxClient#txLevel = 1
     *       .catch(() => rxClient.rollback(insertedRow))  // rollback to the last savepoint if query failed
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
     * @return {Observable} Returns single element {@link Observable} sequence that completes
     *      when transaction successfully committed or {@link Observable} sequence of
     *      whatever passed as `mapTo` argument.
     *
     * @throws {RxClientError} Throws when transaction doesn't exists.
     *
     * @experimental
     */

  }, {
    key: 'commit',
    value: function commit() {
      var _this3 = this;

      var mapTo = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      (0, _assert2.default)(this._txLevel >= 0, 'Current transaction level >= 0');

      var commit = function commit() {
        if (_this3._txLevel === 0) {
          throw new _errors.RxClientError('The transaction is not opened on the client');
        }

        _this3._commitTxLevel();

        var query = void 0;
        if (_this3._txLevel === 1 || force) {
          query = 'commit';
          _this3._txLevel = 0;
        } else {
          query = 'release savepoint point_' + --_this3._txLevel;
        }

        return _this3.query(query);
      };

      return commit().mapTo(mapTo);
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
     *   .mergeMap(() => rxClient.queryRow(
     *     'insert into main (name) values ($1) returning *',
     *     [ 'qwerty' ]
     *   ))
     *   // work with inserted record
     *   .mergeMap(
     *     insertedRow => rxClient.begin() // RxClient#txLevel = 2
     *       // try to execute invalid query
     *       .mergeMap(() => rxClient.queryRow(
     *         'update main set (id, name) = ($1, $2) where id = $3 returning *',
     *         [ 1, 'qwerty new name', insertedRow.id ]
     *       ))
     *       .mergeMap(updatedRow => rxClient.commit(updatedRow)) // RxClient#txLevel = 1
     *       .catch(() => rxClient.rollback(insertedRow))  // rollback to the last savepoint if query failed
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
     * @return {Observable} Returns single element {@link Observable} sequence that completes
     *      when transaction successfully rolled back or {@link Observable} sequence of
     *      whatever passed as `mapTo` argument.
     *
     * @throws {RxClientError} Throws when transaction doesn't exists.
     *
     * @experimental
     */

  }, {
    key: 'rollback',
    value: function rollback() {
      var _this4 = this;

      var mapTo = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      (0, _assert2.default)(this._txLevel >= 0, 'Current transaction level >= 0');

      var rollback = function rollback() {
        if (_this4._txLevel === 0) {
          throw new _errors.RxClientError('The transaction is not opened on the client');
        }

        _this4._commitTxLevel();

        var query = void 0;
        if (_this4._txLevel === 1 || force) {
          query = 'rollback';
          _this4._txLevel = 0;
        } else {
          query = 'rollback to savepoint point_' + --_this4._txLevel;
        }

        return _this4.query(query);
      };

      return rollback().mapTo(mapTo);
    }

    /**
     * @param {function(): Observable} func
     * @return {Observable<T>}
     */

  }, {
    key: 'tx',
    value: function tx(func) {
      var _this5 = this;

      return this.begin().concatMap(function () {
        return func();
      }).concatMap(function (result) {
        return _this5.commit(result);
      }).catch(function (err) {
        util.err(err.message, [err.stack]);

        return _this5.rollback().mergeMap(function () {
          return _rxjs.Observable.throw(err);
        });
      });
    }

    /**
     * @private
     */

  }, {
    key: '_commitTxLevel',
    value: function _commitTxLevel() {
      this._savedTxLevel = this._txLevel;
    }

    /**
     * @private
     */

  }, {
    key: '_rollbackTxLevel',
    value: function _rollbackTxLevel() {
      this._txLevel = this._savedTxLevel;
    }
  }, {
    key: 'client',
    get: function get() {
      return this._client;
    }

    /**
     * Current transaction level.
     *
     * @type {number}
     */

  }, {
    key: 'txLevel',
    get: function get() {
      return this._txLevel;
    }

    /**
     * True if client connected.
     *
     * @type {boolean}
     */

  }, {
    key: 'connected',
    get: function get() {
      return this._client.connection.stream.readyState === 'open';
    }
  }]);

  return RxClient;
}();

exports.default = RxClient;
//# sourceMappingURL=RxClient.js.map