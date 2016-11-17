'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _pg = require('pg');

var _rx = require('rx');

var Rx = _interopRequireWildcard(_rx);

var _errors = require('../errors');

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

        /* istanbul ignore if */
        if (!(this instanceof RxClient)) {
            return new RxClient(client);
        }

        if (!(client instanceof _pg.Client)) {
            throw new _errors.RxClientError('Client must be instance of pg.Client class');
        }

        this._client = client;
        this._tlevel = 0;
        this._disposed = false;
    }

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

            if (this.connected) {
                return Rx.Observable.return(this);
            }

            var connect = Rx.Observable.fromNodeCallback(this._client.connect, this._client);

            return connect().map(function () {
                return _this;
            });
        }

        /**
         * @return {Rx.Observable<RxClient>}
         */

    }, {
        key: 'end',
        value: function end() {
            var _this2 = this;

            var end = Rx.Observable.fromNodeCallback(this._client.end, this._client);

            return end().map(function () {
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

            //noinspection CommaExpressionJS
            return this.query(query).map(function () {
                return ++_this3._tlevel, _this3;
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

            if (this._tlevel === 1 || force) {
                //noinspection CommaExpressionJS
                return this.query('commit').map(function () {
                    return _this4._tlevel = 0, _this4;
                });
            }

            //noinspection CommaExpressionJS
            return this.query('release savepoint point_' + (this._tlevel - 1)).map(function () {
                return --_this4._tlevel, _this4;
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

            if (this._tlevel === 1 || force) {
                //noinspection CommaExpressionJS
                return this.query('rollback').map(function () {
                    return _this5._tlevel = 0, _this5;
                });
            }

            //noinspection CommaExpressionJS
            return this.query('rollback to savepoint point_' + (this._tlevel - 1)).map(function () {
                return --_this5._tlevel, _this5;
            });
        }
    }, {
        key: 'client',
        get: function get() {
            return this._client;
        }
    }, {
        key: 'tlevel',
        get: function get() {
            return this._tlevel;
        }
    }, {
        key: 'isDisposed',
        get: function get() {
            return this._disposed;
        }
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