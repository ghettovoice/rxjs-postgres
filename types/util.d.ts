/**
 * Typed dynamic call.
 *
 * @param {function} fn
 * @param {*} [context]
 * @param {...*} [args]
 * @return {T}
 */
export declare function call<T>(fn: Function, context?: any, ...args: any[]): T;
/**
 * Typed dynamic apply.
 *
 * @param {function} fn
 * @param {*} [context]
 * @param {Array} [args]
 * @return {T}
 */
export declare function apply<T>(fn: Function, context?: any, args?: any[]): T;
