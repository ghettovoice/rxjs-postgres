'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _pg = require('pg');

var _pg2 = _interopRequireDefault(_pg);

var _rx = require('rx');

var Rx = _interopRequireWildcard(_rx);

var _RxClient = require('./RxClient');

var _RxClient2 = _interopRequireDefault(_RxClient);

var _errors = require('../errors');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Standalone RxJs adapter for `pg.Pool`.
 */
var RxPool = function () {
    /**
     * @param {pg.Pool} pool
     */
    function RxPool(pool) {
        _classCallCheck(this, RxPool);

        if (!(pool instanceof _pg2.default.Pool)) {
            throw new _errors.RxPoolError('Pool must be instance of pg.Pool class');
        }

        /**
         * @type {pg.Pool}
         * @private
         */
        this._pool = pool;
        /**
         * @type {Rx.ConnectableObservable<RxClient>}
         * @private
         */
        this._tclientSource = undefined;
    }

    /**
     * @return {pg.Pool}
     */


    _createClass(RxPool, [{
        key: 'connect',


        /**
         * @return {Rx.Observable<RxClient>}
         */
        value: function connect() {
            return Rx.Observable.fromPromise(this._pool.connect()).map(function (client) {
                return new _RxClient2.default(client);
            });
        }

        /**
         * @return {Rx.Observable<RxClient>}
         */

    }, {
        key: 'take',
        value: function take() {
            return this.connect();
        }

        /**
         * @return {Rx.Observable<RxPool>}
         */

    }, {
        key: 'end',
        value: function end() {
            var _this = this;

            return Rx.Observable.fromPromise(this._pool.end()).map(function () {
                return _this;
            });
        }

        /**
         * @param {string} queryText
         * @param {Array} [values]
         * @return {Rx.Observable<Object>}
         */

    }, {
        key: 'query',
        value: function query(queryText, values) {
            return Rx.Observable.fromPromise(this._pool.query(queryText, values));
        }

        /**
         * @return {Rx.Observable<RxPool>}
         */

    }, {
        key: 'begin',
        value: function begin() {
            var _this2 = this;

            if (!this._tclientSource) {
                this._tclientSource = this.connect().shareReplay(1);
            }

            return this._tclientSource.flatMap(function (rxClient) {
                return rxClient.begin();
            }, function () {
                return _this2;
            });
        }

        /**
         * @param {boolean} [force] Commit transaction with all savepoints.
         * @return {Rx.Observable<RxPool>}
         * @throws {RxPoolError}
         */

    }, {
        key: 'commit',
        value: function commit(force) {
            var _this3 = this;

            if (!this._tclientSource) {
                throw new _errors.RxPoolError('Client with open transaction does not exists');
            }
            // todo release when tlevel = 0
            return this._tclientSource.flatMap(function (rxClient) {
                return rxClient.commit(force);
            }).do(function (rxClient) {
                if (!rxClient.tlevel) {
                    rxClient.release();
                    _this3._tclientSource = null;
                }
            });
        }

        /**
         * @param {boolean} [force] Rollback transaction with all savepoints.
         * @return {Rx.Observable<RxPool>}
         * @throws {RxPoolError}
         */

    }, {
        key: 'rollback',
        value: function rollback(force) {
            var _this4 = this;

            if (!this._tclientSource) {
                throw new _errors.RxPoolError('Client with open transaction does not exists');
            }
            // todo release when tlevel = 0
            return this._tclientSource.flatMap(function (rxClient) {
                return rxClient.rollback(force);
            }, function () {
                return _this4;
            });
            ;
        }
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