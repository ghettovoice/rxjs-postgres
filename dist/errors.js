'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RxPoolError = exports.RxClientError = undefined;

var _es6Error = require('es6-error');

var _es6Error2 = _interopRequireDefault(_es6Error);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
 * Error class for all client specific exceptions.
 *
 * @see {@link RxClient}
 * @see {@link ExtendableError}
 */
var RxClientError = exports.RxClientError = function (_ExtendableError) {
  _inherits(RxClientError, _ExtendableError);

  function RxClientError() {
    _classCallCheck(this, RxClientError);

    return _possibleConstructorReturn(this, (RxClientError.__proto__ || Object.getPrototypeOf(RxClientError)).apply(this, arguments));
  }

  return RxClientError;
}(_es6Error2.default);

/**
 * Error class for all pool specific exceptions.
 *
 * @see {@link RxPool}
 * @see {@link ExtendableError}
 */


var RxPoolError = exports.RxPoolError = function (_ExtendableError2) {
  _inherits(RxPoolError, _ExtendableError2);

  function RxPoolError() {
    _classCallCheck(this, RxPoolError);

    return _possibleConstructorReturn(this, (RxPoolError.__proto__ || Object.getPrototypeOf(RxPoolError)).apply(this, arguments));
  }

  return RxPoolError;
}(_es6Error2.default);
//# sourceMappingURL=errors.js.map