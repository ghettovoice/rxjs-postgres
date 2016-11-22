'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _pg = require('pg');

var _pg2 = _interopRequireDefault(_pg);

var _rxjs = require('rxjs');

var _rxjs2 = _interopRequireDefault(_rxjs);

var _errors = require('../errors');

var _util = require('../util');

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Standalone RxJs adapter for `pg.Client`.
 */
var RxClient = function () {
    /**
     * @param {Client} client
     */
    function RxClient(client) {
        _classCallCheck(this, RxClient);

        if (!(client instanceof _pg2.default.Client)) {
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
        this._tlevel = 0;
    }

    /**
     * @type {Client}
     */


    _createClass(RxClient, [{
        key: 'release',


        /**
         * Releases client acquired from pool
         */
        value: function release() {
            typeof this._client.release === 'function' && this._client.release();
            this._tlevel = 0;
        }

        /**
         * @return {Observable<RxClient>}
         */

    }, {
        key: 'connect',
        value: function connect() {
            var _context,
                _this = this;

            if (this.connected) {
                return _rxjs2.default.Observable.of(this);
            }

            var connect = _rxjs2.default.Observable.bindNodeCallback((_context = this._client).connect.bind(_context), function () {
                return _this;
            });

            return connect().do(function () {
                return util.log('RxClient: client connected');
            });
        }

        /**
         * @return {Observable<RxClient>}
         */

    }, {
        key: 'open',
        value: function open() {
            return this.connect();
        }

        /**
         * @return {Observable<RxClient>}
         */

    }, {
        key: 'end',
        value: function end() {
            var _context2,
                _this2 = this;

            if (!this.connected) {
                return _rxjs2.default.Observable.of(this);
            }

            var end = _rxjs2.default.Observable.bindNodeCallback((_context2 = this._client).end.bind(_context2), function () {
                return _this2;
            });

            return end().do(function () {
                _this2._tlevel = 0;
                util.log('RxClient: client ended');
            });
        }

        /**
         * @return {Observable.<RxClient>}
         */

    }, {
        key: 'close',
        value: function close() {
            return this.end();
        }

        /**
         * @param {string} queryText
         * @param {Array} [values]
         * @return {Observable<Object>}
         */

    }, {
        key: 'query',
        value: function query(queryText, values) {
            var _this3 = this;

            return this.connect().flatMap(function () {
                var _context3;

                var query = _rxjs2.default.Observable.bindNodeCallback((_context3 = _this3._client).query.bind(_context3));

                return query(queryText, values);
            }).do(function () {
                return util.log('RxClient: query executed', queryText);
            });
        }

        // /**
        //  * @return {Rx.Observable<RxClient>}
        //  */
        // begin() {
        //     assert(this._tlevel >= 0, 'Current transaction level >= 0');
        //
        //     util.log('begin transaction');
        //      // todo doOnError => reset tlevel
        //     this._transactionSource = (this._transactionSource || Rx.Observable.return(null))
        //         .flatMap(() => {
        //             let query;
        //
        //             if (this._tlevel === 0) {
        //                 query = 'begin';
        //             } else {
        //                 query = `savepoint point_${this._tlevel}`;
        //             }
        //
        //             return this.query(query);
        //         })
        //         .do(() => {
        //             ++this._tlevel;
        //
        //             util.log('transaction started', this._tlevel);
        //         })
        //         .map(() => this)
        //         .shareReplay(1);
        //
        //     return this._transactionSource;
        // }
        //
        // /**
        //  * @param {boolean} [force] Commit transaction with all savepoints.
        //  * @return {Rx.Observable<RxClient>}
        //  * @throws {RxClientError}
        //  */
        // commit(force) {
        //     assert(this._tlevel >= 0, 'Current transaction level >= 0');
        //
        //     if (!this._transactionSource) {
        //         throw new RxClientError('The transaction is not open on the client');
        //     }
        //
        //     util.log('commit transaction');
        //
        //     this._transactionSource = this._transactionSource.flatMap(() => {
        //         if (this._tlevel === 0) {
        //             throw new RxClientError('The transaction is not open on the client');
        //         }
        //
        //         /** @type {Rx.Observable} */
        //         let source;
        //
        //         if (this._tlevel === 1 || force) {
        //             source = this.query('commit')
        //                 .do(() => {
        //                     util.log(`transaction committed ${force ? '(force)' : ''}`, this._tlevel);
        //
        //                     this._tlevel = 0;
        //                     this._transactionSource = undefined;
        //                 });
        //         } else {
        //             source = this.query(`release savepoint point_${this._tlevel - 1}`)
        //                 .do(() => {
        //                     util.log('transaction committed', this._tlevel);
        //
        //                     --this._tlevel;
        //                 });
        //         }
        //
        //         return source;
        //     }).map(() => this)
        //         .shareReplay(1);
        //
        //
        //     return this._transactionSource;
        // }
        //
        // /**
        //  * @param {boolean} [force] Rollback transaction with all savepoints.
        //  * @return {Rx.Observable<RxClient>}
        //  * @throws {RxClientError}
        //  */
        // rollback(force) {
        //     assert(this._tlevel >= 0, 'Current transaction level >= 0');
        //
        //     if (!this._transactionSource) {
        //         throw new RxClientError('The transaction is not open on the client');
        //     }
        //
        //     util.log('rollback transaction');
        //
        //     this._transactionSource = this._transactionSource.flatMap(() => {
        //         if (this._tlevel === 0) {
        //             throw new RxClientError('The transaction is not open on the client');
        //         }
        //
        //         /** @type {Rx.Observable} */
        //         let source;
        //
        //         if (this._tlevel === 1 || force) {
        //             source = this.query('rollback')
        //                 .do(() => {
        //                     util.log(`transaction rolled back ${force ? '(force)' : ''}`, this._tlevel);
        //
        //                     this._tlevel = 0;
        //                     this._transactionSource = undefined;
        //                 });
        //         } else {
        //             source = this.query(`rollback to savepoint point_${this._tlevel - 1}`)
        //                 .do(() => {
        //                     util.log('transaction rolled back', this._tlevel);
        //
        //                     --this._tlevel;
        //                 });
        //         }
        //
        //         return source;
        //     }).map(() => this)
        //         .shareReplay(1);
        //
        //     return this._transactionSource;
        // }

    }, {
        key: 'client',
        get: function get() {
            return this._client;
        }

        /**
         * @type {number}
         */

    }, {
        key: 'tlevel',
        get: function get() {
            return this._tlevel;
        }

        /**
         * @return {boolean}
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