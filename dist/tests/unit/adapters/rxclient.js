"use strict";
const chai_1 = require("chai");
const Pool = require("pg-pool");
/**
 * RxClient Unit tests
 */
describe('RxClient tests', function () {
    it('can run a query with a callback without parameters', function (done) {
        var pool = new Pool();
        pool.query('SELECT 1 as num', function (err, res) {
            chai_1.assert.equal(res.rows[0], { num: 1 });
            pool.end().then(function () {
                done(err);
            });
        });
    });
});
