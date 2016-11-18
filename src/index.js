/**
 * RxJs Postgres decorator.
 *
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */

export * from './adapters';
export * from './errors';

const config = {
    DEBUG: process.env.NODE_ENV === 'development'
};

export {
    config
};
