"use strict";
/**
 * RxJs decorator for `pg.Client`.
 */
function RxClient(options) {
    return function (Client) {
        return Client;
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * RxJs decorator for `pg.Client`.
 */
exports.default = RxClient;
//# sourceMappingURL=rxclient.js.map