/**
 * RxJs decorator for `pg.Client`.
 *
 * @param {Object} [options]
 * @return {Function}
 */
export default function RxClient(options = {}) {
    return function (Client) {
        return Client;
    };
}
