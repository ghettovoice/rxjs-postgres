'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _pg = require('pg');

var _rxjs = require('rxjs');

var _lodash = require('lodash.isfunction');

var _lodash2 = _interopRequireDefault(_lodash);

var _errors = require('../errors');

var _util = require('../util');

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Standalone adapter for `node-postgres` {@link Client} class with Reactive API.
 *
 * @todo Try all examples! and add tests to cover use cases from examples.
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
 *
 * @todo Try to use rxjs Subject behind the scene as single source of values, subscribe it to each async operation
 *    and manually emit results for it's observers, manually complete after closing connection etc...
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
    /**
     * @type {Observable}
     * @private
     */
    this._errorSource = undefined;
    /**
     * @type {Observable}
     * @private
     */
    this._connectSource = undefined;
    /**
     * @type {Observable}
     * @private
     */
    this._endSource = undefined;
    /**
     * @type {Observable}
     * @private
     */
    this._querySource = undefined;
  }

  /**
   * Instance of `node-postgres` {@link Client} type.
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
      this._connectSource = undefined;
      this._endSource = undefined;
      this._querySource = undefined;
      this._errorSource = undefined;
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

  }, {
    key: 'connect',
    value: function connect() {
      if (!this._connectSource) {
        this._connectSource = _rxjs.Observable.of(true);
        // wrap errors with Observable to mixin it in external code
        this._errorSource = _rxjs.Observable.fromEvent(this._client, 'error');

        // subscribe to the end to make RxClient cleanup
        _rxjs.Observable.fromEvent(this._client, 'end').take(1).subscribe({
          error: this._cleanup.bind(this),
          complete: this._cleanup.bind(this)
        });

        if (!this.connected) {
          var _context;

          var connect = _rxjs.Observable.bindNodeCallback((_context = this._client).connect.bind(_context), function () {
            return true;
          });

          this._connectSource = connect().do(function () {
            return util.log('RxClient: client connected');
          }).publishReplay().refCount();
        }
      }
      // todo ignore elements like in begin/commit/rollback ?
      return this._connectSource;
    }

    /**
     * Alias of the {@link RxClient#connect}.
     *
     * @see {@link RxClient#connect}
     *
     * @return {Observable<boolean>} Returns single boolean {@link Observable} sequence
     *    multicasted with {@link ReplaySubject}
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

  }, {
    key: 'end',
    value: function end() {
      var _this = this;

      if (!this._endSource) {
        this._endSource = _rxjs.Observable.of(true);

        if (this._connectSource) {
          (function () {
            var _context2;

            var end = _rxjs.Observable.bindNodeCallback((_context2 = _this._client).end.bind(_context2), function () {
              return true;
            });

            _this._endSource = _this._connectSource.concatMap(function () {
              return end();
            }).do(function () {
              return util.log('RxClient: client ended');
            }).publishReplay().refCount();
          })();
        }
      }

      return this._endSource;
    }

    /**
     * Alias of the {@link RxClient#end}.
     *
     * @see {@link RxClient#end}
     *
     * @return {Observable<boolean>} Returns single boolean {@link Observable} sequence
     *    multicasted with {@link ReplaySubject}
     */

  }, {
    key: 'close',
    value: function close() {
      return this.end();
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

  }, {
    key: 'query',
    value: function query(queryText, values, projectFunction) {
      var _this2 = this;

      if ((0, _lodash2.default)(values)) {
        projectFunction = values;
      }

      this._querySource = (this._querySource || this.connect()).concatMap(function () {
        var _context3;

        var query = _rxjs.Observable.bindNodeCallback((_context3 = _this2._client).query.bind(_context3));

        return query(queryText, values);
      }).do(function () {
        return util.log('RxClient: query executed', queryText, _this2._txLevel);
      }, function () {
        _this2._restoreLevel();
        _this2._querySource = undefined;
      }).publishReplay().refCount();

      var source = this._querySource;
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
     * @see {@link RxClient#queryRowsFlat}
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
     * @see {@link RxClient#queryRowsFlat}
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
    key: 'queryRowsFlat',
    value: function queryRowsFlat(queryText, values) {
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

  }, {
    key: 'begin',
    value: function begin(mapTo) {
      var _this3 = this;

      (0, _assert2.default)(this._txLevel >= 0, 'Current transaction level >= 0');

      var begin = function begin() {
        _this3._savedTxLevel = _this3._txLevel;

        var query = void 0;
        if (_this3._txLevel === 0) {
          query = 'begin';
        } else {
          query = 'savepoint point_' + _this3._txLevel;
        }

        ++_this3._txLevel;

        return _this3.query(query);
      };

      var source = begin();
      if (mapTo != null) {
        source = source.mapTo(mapTo);
      } else {
        source = source.ignoreElements();
      }

      return source;
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

  }, {
    key: 'commit',
    value: function commit(mapTo, force) {
      var _this4 = this;

      (0, _assert2.default)(this._txLevel >= 0, 'Current transaction level >= 0');

      var commit = function commit() {
        if (_this4._txLevel === 0) {
          throw new _errors.RxClientError('The transaction is not open on the client');
        }

        _this4._savedTxLevel = _this4._txLevel;

        var query = void 0;
        if (_this4._txLevel === 1 || force) {
          query = 'commit';
          _this4._txLevel = 0;
        } else {
          query = 'release savepoint point_' + --_this4._txLevel;
        }

        return _this4.query(query);
      };

      var source = commit();
      if (mapTo) {
        source = source.mapTo(mapTo);
      } else {
        source = source.ignoreElements();
      }

      return source;
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

  }, {
    key: 'rollback',
    value: function rollback(mapTo, force) {
      var _this5 = this;

      (0, _assert2.default)(this._txLevel >= 0, 'Current transaction level >= 0');

      var rollback = function rollback() {
        if (_this5._txLevel === 0) {
          throw new _errors.RxClientError('The transaction is not opened on the client');
        }

        _this5._savedTxLevel = _this5._txLevel;

        var query = void 0;
        if (_this5._txLevel === 1 || force) {
          query = 'rollback';
          _this5._txLevel = 0;
        } else {
          query = 'rollback to savepoint point_' + --_this5._txLevel;
        }

        return _this5.query(query);
      };

      var source = rollback();
      if (mapTo != null) {
        source = source.mapTo(mapTo);
      } else {
        source = source.ignoreElements();
      }

      return source;
    }
  }, {
    key: '_restoreLevel',
    value: function _restoreLevel() {
      if (this._savedTxLevel != null) {
        this._txLevel = this._savedTxLevel;
      }
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

  return RxClient;
}();

exports.default = RxClient;
//# sourceMappingURL=RxClient.js.map