"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rxPool;
/**
 * RxJs decorator for `pg.Client`.
 *
 * @param {Object} [options]
 * @return {Function}
 * @ignore
 */
function rxPool(options) {
  return function (Pool) {
    return Pool;
  };
}
//# sourceMappingURL=rxPool.js.map