"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var pg_pool_1 = require("pg-pool");
/**
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */
var RxPool = (function (_super) {
    __extends(RxPool, _super);
    function RxPool() {
        _super.apply(this, arguments);
    }
    return RxPool;
}(pg_pool_1.Pool));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RxPool;
//# sourceMappingURL=RxPool.js.map