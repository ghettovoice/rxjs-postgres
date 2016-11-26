import ExtendableError from 'es6-error'
/**
 * Library errors module.
 *
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */

/**
 * Error class for all client specific exceptions.
 *
 * @see {@link RxClient}
 * @see {@link ExtendableError}
 */
export class RxClientError extends ExtendableError {
}

/**
 * Error class for all pool specific exceptions.
 *
 * @see {@link RxPool}
 * @see {@link ExtendableError}
 */
export class RxPoolError extends ExtendableError {
}
