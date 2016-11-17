"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * Library errors module.
 *
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */
var ExtendableError = (function (_super) {
    __extends(ExtendableError, _super);
    function ExtendableError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = _this.constructor.name;
        _this.message = message;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(_this, _this.constructor);
        }
        else {
            _this.stack = (new Error(message)).stack;
        }
        return _this;
    }
    return ExtendableError;
}(Error));
exports.ExtendableError = ExtendableError;
console.dir(ExtendableError);
/**
 * Error class for all client specific exceptions.
 */
var RxClientError = (function (_super) {
    __extends(RxClientError, _super);
    function RxClientError(message) {
        var _this = _super.call(this, message) || this;
        _this.message = message;
        _this.name = 'RxClientError';
        return _this;
    }
    return RxClientError;
}(ExtendableError));
exports.RxClientError = RxClientError;
/**
 * Error class for all pool specific exceptions.
 */
var RxPoolError = (function (_super) {
    __extends(RxPoolError, _super);
    function RxPoolError(message) {
        var _this = _super.call(this, message) || this;
        _this.message = message;
        _this.name = 'RxPoolError';
        return _this;
    }
    return RxPoolError;
}(Error));
exports.RxPoolError = RxPoolError;
//# sourceMappingURL=errors.js.map