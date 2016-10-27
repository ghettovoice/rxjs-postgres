/// <reference types="node" />
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
export declare class RxClientError extends Error {
    name: string;
    message: string;
    constructor(message?: string);
}
/**
 * Error class for all pool specific exceptions.
 */
export declare class RxPoolError extends Error {
    name: string;
    message: string;
    constructor(message?: string);
}
