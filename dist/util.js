'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.datetime = datetime;
exports.log = log;
exports.err = err;
exports.values = values;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _ = require('./');

var _stackTrace = require('stack-trace');

var _stackTrace2 = _interopRequireDefault(_stackTrace);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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
 * @param {Array} [args]
 * @param {string} [msgCol=blue]
 * @param {string} [argsCol=white]
 *
 * @private
 */
function log(message) {
  var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var msgCol = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'blue';
  var argsCol = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'white';

  if (_.config.DEBUG) {
    var trace = _stackTrace2.default.get();
    var callerFile = trace[1].getFileName().replace(_path2.default.dirname(__dirname) + '/', '');
    var callerFileLine = trace[1].getLineNumber();

    console.log(_chalk2.default.cyan('[ ' + Date.now() + ' ' + _chalk2.default.grey(callerFile + ':' + callerFileLine) + ' ]'), _chalk2.default[msgCol](message), _chalk2.default[argsCol].apply(_chalk2.default, _toConsumableArray(args)));
  }
}

/**
 * @param message
 * @param args
 *
 * @private
 */
function err(message) {
  var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  log(message, args, 'red');
}

/**
 * @param {Object} obj
 * @return {Array}
 */
function values(obj) {
  if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object') return [];
  if (Array.isArray(obj)) return obj.slice();

  return Object.keys(obj).map(function (key) {
    return obj[key];
  });
}
//# sourceMappingURL=util.js.map