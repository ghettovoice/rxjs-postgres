import path from 'path';
import chalk from 'chalk';
import { config } from './';
import stackTrace from 'stack-trace';
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
 * @returns {string} Return UTC date/time string
 */
export function datetime(ts) {
    if (ts == null) {
        ts = Date.now();
    }

    const date = new Date(ts);

    return ( '0' + date.getDate() ).slice(-2) + '.' +
           ( '0' + ( date.getMonth() + 1 ) ).slice(-2) + '.' +
           date.getFullYear() + ' ' +
           ( '0' + date.getHours() ).slice(-2) + ':' +
           ( '0' + date.getMinutes() ).slice(-2) + ':' +
           ( '0' + date.getSeconds() ).slice(-2);
}

/**
 * @param {string} message
 * @param {...*} [args]
 */
export function log(message, ...args) {
    if (config.DEBUG) {
        const trace = stackTrace.get();
        let callerFile = trace[ 1 ].getFileName().replace(path.dirname(__dirname) + '/', '');
        let callerFileLine = trace[ 1 ].getLineNumber();

        console.log(
            chalk.cyan('[ ' + datetime() + ' ' + chalk.grey(callerFile + ':' + callerFileLine) + ' ]'),
            chalk.blue(message),
            ...args
        );
    }
}
