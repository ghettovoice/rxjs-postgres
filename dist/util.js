"use strict";
/**
 * Typed dynamic call.
 *
 * @param {function} fn
 * @param {*} [context]
 * @param {...*} [args]
 * @return {T}
 */
function call(fn, context) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return fn.call.apply(fn, [context].concat(args));
}
exports.call = call;
/**
 * Typed dynamic apply.
 *
 * @param {function} fn
 * @param {*} [context]
 * @param {Array} [args]
 * @return {T}
 */
function apply(fn, context, args) {
    return fn.apply(context, args);
}
exports.apply = apply;
//# sourceMappingURL=util.js.map