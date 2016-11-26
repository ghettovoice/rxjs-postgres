import path from 'path'
import chalk from 'chalk'
import { config } from './'
import stackTrace from 'stack-trace'
/**
 * Library utils.
 *
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */

/**
 * Formats timestamp as Date/Time string in form of DD.MM.YYYY HH:mm:ss.
 *
 * @param {number} [ts] UTC timestamp.
 *
 * @returns {string} Return UTC Date/Time string.
 *
 * @private
 */
export function datetime (ts) {
  if (ts == null) {
    ts = Date.now()
  }

  const date = new Date(ts)

  return ('0' + date.getDate()).slice(-2) + '.' +
         ('0' + (date.getMonth() + 1)).slice(-2) + '.' +
         date.getFullYear() + ' ' +
         ('0' + date.getHours()).slice(-2) + ':' +
         ('0' + date.getMinutes()).slice(-2) + ':' +
         ('0' + date.getSeconds()).slice(-2) + '.' +
         date.getMilliseconds()
}

/**
 * Logs to STDOUT with simple formatting.
 *
 * @param {string} message
 * @param {...*} [args]
 *
 * @private
 */
export function log (message, ...args) {
  if (config.DEBUG) {
    const trace = stackTrace.get()
    let callerFile = trace[ 1 ].getFileName().replace(path.dirname(__dirname) + '/', '')
    let callerFileLine = trace[ 1 ].getLineNumber()

    console.log(
      chalk.cyan('[ ' + Date.now()/* datetime() */ + ' ' + chalk.grey(callerFile + ':' + callerFileLine) + ' ]'),
      chalk.blue(message),
      ...args
    )
  }
}
