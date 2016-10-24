/**
 * Typed dynamic call.
 *
 * @param {function} fn
 * @param {*} [context]
 * @param {...*} [args]
 * @return {T}
 */
export function call<T>(fn : Function, context? : any, ...args : any[]) : T {
    return <T>fn.call(context, ...args);
}

/**
 * Typed dynamic apply.
 *
 * @param {function} fn
 * @param {*} [context]
 * @param {Array} [args]
 * @return {T}
 */
export function apply<T>(fn : Function, context? : any, args? : any[]) : T {
    return <T>fn.apply(context, args);
}
