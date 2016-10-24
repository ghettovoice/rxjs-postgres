"use strict";
/**
 * Reactive ES Decorator for `pg.Client`.
 */
function RxPool(options) {
    return function (Pool) {
        return Pool;
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RxPool;
