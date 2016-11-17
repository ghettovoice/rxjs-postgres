/**
 * Library errors module.
 *
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */

/**
 * Base error class for extending
 */
class BaseError extends Error {
    /**
     * @param {string} message
     */
    constructor(message) {
        super(message);
        /** @type {string} */
        this.name = this.constructor.name;
        /** @type {string | undefined} */
        this.message = message;
        /** @type {string} */
        this.stack = new Error().stack;
    }
}

/**
 * Error class for all client specific exceptions.
 */
export class RxClientError extends BaseError {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        this.message = message + 123;
    }
}

/**
 * Error class for all pool specific exceptions.
 */
export class RxPoolError extends BaseError {
}
