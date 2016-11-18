import chalk from 'chalk';
import { config } from './';
/**
 * Library utils.
 *
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */

/**
 * @param {number} [ts]
 * @returns {string}
 */
export function datetime(ts) {
    if (ts == null) {
        ts = Date.now();
    }

    return new Date(ts).toISOString()
        .replace(/T/, ' ')
        .replace(/\..+/, '');
}

/**
 * @param {string} message
 * @param {...*} [args]
 */
export function log(message, ...args) {
    if (config.DEBUG) {
        console.log(
            chalk.cyan(`[ ${datetime()} ]`),
            chalk.blue(message),
            ...args
        );
    }
}
