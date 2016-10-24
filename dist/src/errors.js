/**
 * Library errors module.
 *
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */
"use strict";
/**
 * Error class for all client specific exceptions.
 */
class RxClientError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'RxClientError';
    }
}
exports.RxClientError = RxClientError;
/**
 * Error class for all pool specific exceptions.
 */
class RxPoolError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'RxPoolError';
    }
}
exports.RxPoolError = RxPoolError;
