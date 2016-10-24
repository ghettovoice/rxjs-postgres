import { assert } from "chai";
import Pool = require("pg-pool");
/**
 * RxClient Unit tests
 */

describe('RxClient tests', function () {
    it('can run a query with a callback without parameters', function (done) {
        var pool = new Pool();

        pool.query('SELECT 1 as num', function (err : any, res : any) {
            assert.equal(res.rows[ 0 ], { num: 1 });

            pool.end().then(function () {
                done(err);
            });
        });
    });
});
