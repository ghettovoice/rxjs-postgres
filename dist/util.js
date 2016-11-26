'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.datetime = datetime;
exports.log = log;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _ = require('./');

var _stackTrace = require('stack-trace');

var _stackTrace2 = _interopRequireDefault(_stackTrace);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
function datetime(ts) {
  if (ts == null) {
    ts = Date.now();
  }

  var date = new Date(ts);

  return ('0' + date.getDate()).slice(-2) + '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + date.getFullYear() + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2) + '.' + date.getMilliseconds();
}

/**
 * Logs to STDOUT with simple formatting.
 *
 * @param {string} message
 * @param {...*} [args]
 *
 * @private
 */
function log(message) {
  if (_.config.DEBUG) {
    var _console;

    var trace = _stackTrace2.default.get();
    var callerFile = trace[1].getFileName().replace(_path2.default.dirname(__dirname) + '/', '');
    var callerFileLine = trace[1].getLineNumber();

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    (_console = console).log.apply(_console, [_chalk2.default.cyan('[ ' + Date.now() /* datetime() */ + ' ' + _chalk2.default.grey(callerFile + ':' + callerFileLine) + ' ]'), _chalk2.default.blue(message)].concat(args));
  }
}
//# sourceMappingURL=util.js.map