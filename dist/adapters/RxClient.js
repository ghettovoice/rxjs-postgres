'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _pg = require('pg');

var _pg2 = _interopRequireDefault(_pg);

var _rx = require('rx');

var Rx = _interopRequireWildcard(_rx);

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
     * @param {pg.Client} client
     */
    function RxClient(client) {
        _classCallCheck(this, RxClient);

        if (!(client instanceof _pg2.default.Client)) {
            throw new _errors.RxClientError('Client must be instance of pg.Client class');
        }

        /**
         * @type {pg.Client}
         * @private
         */
        this._client = client;
        /**
         * @type {number}
         * @private
         */
        this._tlevel = 0;
        /**
         * @type {boolean}
         * @private
         */
        this._disposed = false;

        /**
         * @type {Rx.Observable}
         * @private
         */
        this._connectSource = undefined;
    }

    /**
     * @type {pg.Client}
     */


    _createClass(RxClient, [{
        key: 'release',
        value: function release() {
            typeof this._client.release === 'function' && this._client.release();
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            if (!this._disposed) {
                this.release();
                this._disposed = true;
            }
        }

        /**
         * @return {Rx.Observable<RxClient>}
         */

    }, {
        key: 'connect',
        value: function connect() {
            var _this = this;

            var connect = Rx.Observable.fromNodeCallback(this._client.connect, this._client);

            if (!this._connectSource) {
                this._connectSource = connect().do(function () {
                    return util.log('connect');
                }).map(function () {
                    return _this;
                }).shareReplay(1);
            }

            return this._connectSource;
        }

        /**
         * @return {Rx.Observable<RxClient>}
         */

    }, {
        key: 'end',
        value: function end() {
            var _this2 = this;

            var end = Rx.Observable.fromNodeCallback(this._client.end, this._client);

            return end().do(function () {
                _this2._connectSource = undefined;

                util.log('close');
            }).map(function () {
                return _this2;
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
            var query = Rx.Observable.fromNodeCallback(this._client.query, this._client);

            return this.connect().flatMap(function () {
                return query(queryText, values);
            }).do(function () {
                return util.log('execute query', queryText);
            });
        }

        /**
         * @return {Rx.Observable<RxClient>}
         */

    }, {
        key: 'begin',
        value: function begin() {
            var _this3 = this;

            (0, _assert2.default)(this._tlevel >= 0, 'Current transaction level >= 0');

            var query = void 0;

            if (this._tlevel === 0) {
                query = 'begin';
            } else {
                query = 'savepoint point_' + this._tlevel;
            }

            return this.query(query).do(function () {
                ++_this3._tlevel;

                util.log('begin transaction', _this3._tlevel);
            }).map(function () {
                return _this3;
            });
        }

        /**
         * @param {boolean} [force] Commit transaction with all savepoints.
         * @return {Rx.Observable<RxClient>}
         * @throws {RxClientError}
         */

    }, {
        key: 'commit',
        value: function commit(force) {
            var _this4 = this;

            (0, _assert2.default)(this._tlevel >= 0, 'Current transaction level >= 0');

            if (this._tlevel === 0) {
                throw new _errors.RxClientError('The transaction is not open on the client');
            }

            /** @type {Rx.Observable} */
            var source = void 0;

            if (this._tlevel === 1 || force) {
                source = this.query('commit').do(function () {
                    util.log('commit ' + (force ? '(force)' : '') + ' transaction', _this4._tlevel);

                    _this4._tlevel = 0;
                });
            } else {
                source = this.query('release savepoint point_' + (this._tlevel - 1)).do(function () {
                    util.log('commit transaction', _this4._tlevel);

                    --_this4._tlevel;
                });
            }

            return source.map(function () {
                return _this4;
            });
        }

        /**
         * @param {boolean} [force] Rollback transaction with all savepoints.
         * @return {Rx.Observable<RxClient>}
         * @throws {RxClientError}
         */

    }, {
        key: 'rollback',
        value: function rollback(force) {
            var _this5 = this;

            (0, _assert2.default)(this._tlevel >= 0, 'Current transaction level >= 0');

            if (this._tlevel === 0) {
                throw new _errors.RxClientError('The transaction is not open on the client');
            }

            /** @type {Rx.Observable} */
            var source = void 0;

            if (this._tlevel === 1 || force) {
                source = this.query('rollback').do(function () {
                    util.log('rollback ' + (force ? '(force)' : '') + ' transaction', _this5._tlevel);

                    _this5._tlevel = 0;
                });
            } else {
                source = this.query('rollback to savepoint point_' + (this._tlevel - 1)).do(function () {
                    util.log('rollback transaction', _this5._tlevel);

                    --_this5._tlevel;
                });
            }

            return source.map(function () {
                return _this5;
            });
        }
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
         * @type {boolean}
         */

    }, {
        key: 'isDisposed',
        get: function get() {
            return this._disposed;
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