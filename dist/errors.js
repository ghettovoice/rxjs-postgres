"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Library errors module.
 *
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */

/**
 * Base error class for extending
 */
var BaseError = function (_Error) {
  _inherits(BaseError, _Error);

  /**
   * @param {string} message
   */
  function BaseError(message) {
    _classCallCheck(this, BaseError);

    /** @type {string} */
    var _this = _possibleConstructorReturn(this, (BaseError.__proto__ || Object.getPrototypeOf(BaseError)).call(this, message));

    _this.name = _this.constructor.name;
    /** @type {string | undefined} */
    _this.message = message;
    /** @type {string} */
    _this.stack = new Error().stack;
    return _this;
  }

  return BaseError;
}(Error);

/**
 * Error class for all client specific exceptions.
 */


var RxClientError = exports.RxClientError = function (_BaseError) {
  _inherits(RxClientError, _BaseError);

  function RxClientError(message) {
    _classCallCheck(this, RxClientError);

    var _this2 = _possibleConstructorReturn(this, (RxClientError.__proto__ || Object.getPrototypeOf(RxClientError)).call(this, message));

    _this2.name = _this2.constructor.name;
    _this2.message = message + 123;
    return _this2;
  }

  return RxClientError;
}(BaseError);

/**
 * Error class for all pool specific exceptions.
 */


var RxPoolError = exports.RxPoolError = function (_BaseError2) {
  _inherits(RxPoolError, _BaseError2);

  function RxPoolError() {
    _classCallCheck(this, RxPoolError);

    return _possibleConstructorReturn(this, (RxPoolError.__proto__ || Object.getPrototypeOf(RxPoolError)).apply(this, arguments));
  }

  return RxPoolError;
}(BaseError);
//# sourceMappingURL=errors.js.map