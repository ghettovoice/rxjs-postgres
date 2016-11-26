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
const config = {
  DEBUG: process.env.NODE_ENV === 'development'
}

export {
  config
}

export * from './adapters'
export * from './errors'
