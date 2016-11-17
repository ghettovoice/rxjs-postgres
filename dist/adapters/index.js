'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RxClient = exports.RxPool = undefined;

var _RxPool2 = require('./RxPool');

var _RxPool3 = _interopRequireDefault(_RxPool2);

var _RxClient2 = require('./RxClient');

var _RxClient3 = _interopRequireDefault(_RxClient2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.RxPool = _RxPool3.default; /**
                                    * Standalone RxJs adapters for `node-postgres`.
                                    *
                                    * @package rxjs-postgres
                                    * @author Vladimir Vershinin
                                    * @license MIT
                                    * @copyright (c) 2016, Vladimir Vershinin
                                    */

exports.RxClient = _RxClient3.default;
//# sourceMappingURL=index.js.map