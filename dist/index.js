'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _adapters = require('./adapters');

Object.keys(_adapters).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
        enumerable: true,
        get: function get() {
            return _adapters[key];
        }
    });
});

var _errors = require('./errors');

Object.keys(_errors).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
        enumerable: true,
        get: function get() {
            return _errors[key];
        }
    });
});
/**
 * RxJs Postgres decorator.
 *
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */

var config = {
    DEBUG: process.env.NODE_ENV === 'development'
};

exports.config = config;
//# sourceMappingURL=index.js.map