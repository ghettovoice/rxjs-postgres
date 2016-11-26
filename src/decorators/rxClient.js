/**
 * RxJs decorator for `pg.Client`.
 *
 * @param {Object} [options]
 * @return {Function}
 * @ignore
 */
export default function rxClient (options = {}) {
  return function (Client) {
    return Client
  }
}
