/**
 * Library errors module.
 *
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */
export class ExtendableError extends Error {
    public name : string;
    public message : string;
    public stack : string;

    constructor(message) {
        super(message);
        this.name = (<any>this.constructor).name;
        this.message = message;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }
    }
}
console.dir(ExtendableError);
/**
 * Error class for all client specific exceptions.
 */
export class RxClientError extends ExtendableError {
    public name : string = 'RxClientError';

    constructor(public message) {
        super(message);
    }
}

/**
 * Error class for all pool specific exceptions.
 */
export class RxPoolError extends Error {
    public name : string = 'RxPoolError';

    constructor(public message : string) {
        super(message);
    }
}
