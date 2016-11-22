'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _pg = require('pg');

var _pg2 = _interopRequireDefault(_pg);

var _rxjs = require('rxjs');

var _rxjs2 = _interopRequireDefault(_rxjs);

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
        /**
         * @type {Observable}
         * @private
         */
        this._tclientSource = undefined;
    }

    /**
     * @return {Pool}
     */


    _createClass(RxPool, [{
        key: 'connect',


        /**
         * @param {boolean} [autoRelease=true] Wrap client as `Rx.Disposable` resource
         * @return {Observable<RxClient>}
         */
        value: function connect() {
            var autoRelease = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

            util.log('RxPool: connecting client...');

            return _rxjs2.default.Observable.fromPromise(this._pool.connect()).flatMap(function (client) {
                return autoRelease ? _rxjs2.default.Observable.using(function () {
                    return new _RxClient2.default(client);
                }, function (rxClient) {
                    return _rxjs2.default.Observable.of(rxClient);
                }) : _rxjs2.default.Observable.of(new _RxClient2.default(client));
            }).do(function () {
                return util.log('RxPool: client connected');
            });
        }

        /**
         * @return {Observable<RxClient>}
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

            util.log('RxPool: ending pool...');

            return _rxjs2.default.Observable.fromPromise(this._pool.end()).map(function () {
                return _this;
            }).do(function () {
                _this._tclientSource = undefined;

                util.log('RxPool: pool ended');
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
            return (this._tclientSource || this.connect()).flatMap(function (rxClient) {
                return rxClient.query(queryText, values);
            });
        }

        // /**
        //  * @return {Rx.Observable<RxPool>}
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
        //  * @return {Rx.Observable<RxPool>}
        //  * @throws {RxPoolError}
        //  */
        // commit(force) {
        //     if (!this._tclientSource) {
        //         throw new RxPoolError('Client with open transaction does not exists');
        //     }
        //
        //     this._tclientSource = this._tclientSource.flatMap(rxClient => rxClient.commit(force))
        //         .do(rxClient => {
        //             if (rxClient.tlevel === 0) {
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
        //  * @return {Rx.Observable<RxPool>}
        //  * @throws {RxPoolError}
        //  */
        // rollback(force) {
        //     if (!this._tclientSource) {
        //         throw new RxPoolError('Client with open transaction does not exists');
        //     }
        //
        //     this._tclientSource = this._tclientSource.flatMap(rxClient => rxClient.rollback(force))
        //         .do(rxClient => {
        //             if (rxClient.tlevel === 0) {
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