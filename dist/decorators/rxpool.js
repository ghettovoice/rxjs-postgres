"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = RxPool;
/**
 * RxJs decorator for `pg.Client`.
 *
 * @param {Object} [options]
 * @return {Function}
 */
function RxPool(options) {
    return function (Pool) {
        return Pool;
    };
}
//# sourceMappingURL=rxpool.js.map