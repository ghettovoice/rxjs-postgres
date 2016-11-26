"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rxClient;
/**
 * RxJs decorator for `pg.Client`.
 *
 * @param {Object} [options]
 * @return {Function}
 * @ignore
 */
function rxClient() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return function (Client) {
    return Client;
  };
}
//# sourceMappingURL=rxClient.js.map