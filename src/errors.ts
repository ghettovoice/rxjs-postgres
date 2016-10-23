/**
 * Library errors module.
 *
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */

export class RxClientError extends Error {
    public name : string = 'RxClientError';
}

export class RxPoolError extends Error {
    public name : string = 'RxPoolError';
}
