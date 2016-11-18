'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.datetime = datetime;
exports.log = log;

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _ = require('./');

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
 * @param {number} [ts]
 * @returns {string}
 */
function datetime(ts) {
    if (ts == null) {
        ts = Date.now();
    }

    return new Date(ts).toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

/**
 * @param {string} message
 * @param {...*} [args]
 */
function log(message) {
    if (_.config.DEBUG) {
        var _console;

        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }

        (_console = console).log.apply(_console, [_chalk2.default.cyan('[ ' + datetime() + ' ]'), _chalk2.default.blue(message)].concat(args));
    }
}
//# sourceMappingURL=util.js.map