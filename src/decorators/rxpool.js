/**
 * RxJs decorator for `pg.Client`.
 *
 * @param {Object} [options]
 * @return {Function}
 */
export default function RxPool(options) {
    return function (Pool) {
        return Pool;
    };
}
