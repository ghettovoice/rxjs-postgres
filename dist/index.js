'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _adapters = require('./adapters');

Object.keys(_adapters).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _adapters[key];
    }
  });
});

var _errors = require('./errors');

Object.keys(_errors).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _errors[key];
    }
  });
});
/**
 * RxJs Postgres decorator.
 *
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */

// External type definitions
/**
 * @external {Observable} http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html
 */
/**
 * @external {ReplaySubject} http://reactivex.io/rxjs/class/es6/ReplaySubject.js~ReplaySubject.html
 */
/**
 * @external {Client} https://github.com/brianc/node-postgres/blob/master/lib/client.js
 */
/**
 * @external {Pool} https://github.com/brianc/node-pg-pool/blob/master/index.js
 */
/**
 * @external {Result} https://github.com/brianc/node-postgres/blob/master/lib/result.js
 */
/**
 * @external {ExtendableError} https://github.com/bjyoungblood/es6-error/blob/master/src/index.js
 */

/**
 * @type {Object}
 * @property {boolean} DEBUG On/off debug mode (logs, ...). Default: `process.env.NODE_ENV === 'development'`
 */
var config = {
  DEBUG: process.env.NODE_ENV === 'development'
};

exports.config = config;
//# sourceMappingURL=index.js.map