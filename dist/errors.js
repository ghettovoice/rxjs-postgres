/**
 * Library errors module.
 *
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * Error class for all client specific exceptions.
 */
var RxClientError = (function (_super) {
    __extends(RxClientError, _super);
    function RxClientError() {
        _super.apply(this, arguments);
        this.name = 'RxClientError';
    }
    return RxClientError;
}(Error));
exports.RxClientError = RxClientError;
/**
 * Error class for all pool specific exceptions.
 */
var RxPoolError = (function (_super) {
    __extends(RxPoolError, _super);
    function RxPoolError() {
        _super.apply(this, arguments);
        this.name = 'RxPoolError';
    }
    return RxPoolError;
}(Error));
exports.RxPoolError = RxPoolError;
