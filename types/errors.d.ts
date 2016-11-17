/// <reference types="node" />
/**
 * Library errors module.
 *
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */
export declare class ExtendableError extends Error {
    name: string;
    message: string;
    stack: string;
    constructor(message: any);
}
/**
 * Error class for all client specific exceptions.
 */
export declare class RxClientError extends ExtendableError {
    message: any;
    name: string;
    constructor(message: any);
}
/**
 * Error class for all pool specific exceptions.
 */
export declare class RxPoolError extends Error {
    message: string;
    name: string;
    constructor(message: string);
}
