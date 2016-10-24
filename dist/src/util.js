"use strict";
/**
 * Typed dynamic call.
 *
 * @param {function} fn
 * @param {*} [context]
 * @param {...*} [args]
 * @return {T}
 */
function call(fn, context, ...args) {
    return fn.call(context, ...args);
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
