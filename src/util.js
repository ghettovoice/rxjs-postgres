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
 * Logs to STDOUT with simple formatting.
 *
 * @param {string} message
 * @param {Array} [args]
 * @param {string} [msgCol=blue]
 * @param {string} [argsCol=white]
 *
 * @private
 */
export function log (message, args = [], msgCol = 'blue', argsCol = 'white') {
  if (config.DEBUG) {
    const trace = stackTrace.get()
    let callerFile = trace[ 1 ].getFileName().replace(path.dirname(__dirname) + '/', '')
    let callerFileLine = trace[ 1 ].getLineNumber()

    console.log(
      chalk.cyan('[ ' + Date.now() + ' ' + chalk.grey(callerFile + ':' + callerFileLine) + ' ]'),
      chalk[ msgCol ](message),
      chalk[ argsCol ](...args)
    )
  }
}

/**
 * @param message
 * @param args
 *
 * @private
 */
export function err (message, args = []) {
  log(message, args, 'red')
}

/**
 * @param {Object} obj
 * @return {Array}
 */
export function values (obj) {
  if (typeof obj !== 'object') return []
  if (Array.isArray(obj)) return obj.slice()

  return Object.keys(obj).map(key => obj[ key ])
}
