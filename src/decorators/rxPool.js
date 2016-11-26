/**
 * RxJs decorator for `pg.Client`.
 *
 * @param {Object} [options]
 * @return {Function}
 * @ignore
 */
export default function rxPool (options) {
  return function (Pool) {
    return Pool
  }
}
