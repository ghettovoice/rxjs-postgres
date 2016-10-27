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
 */
export class RxClientError extends Error {
    public name : string = 'RxClientError';
    public message : string;

    constructor(message? : string) {
        super(message);
        this.message = message;
    }
}

/**
 * Error class for all pool specific exceptions.
 */
export class RxPoolError extends Error {
    public name : string = 'RxPoolError';
    public message : string;

    constructor(message? : string) {
        super(message);
        this.message = message;
    }
}
