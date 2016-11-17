"use strict";
/**
 * RxJs decorator for `pg.Client`.
 */
function RxPool(options) {
    return function (Pool) {
        return Pool;
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * RxJs decorator for `pg.Client`.
 */
exports.default = RxPool;
//# sourceMappingURL=rxpool.js.map