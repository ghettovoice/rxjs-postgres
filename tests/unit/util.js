import { assert } from 'chai';
import sinon from 'sinon';
import { config } from '../../src';
import * as util from '../../src/util';

suite('Util functions Unit tests', function () {
    test('Test util.datetime', function () {
        let ts = new Date(2016, 0, 1, 0, 0, 0).getTime();
        let dt = util.datetime(ts);

        assert.strictEqual(dt, '01.01.2016 00:00:00');

        let date = new Date();
        dt = util.datetime();

        assert.strictEqual(dt, ( '0' + date.getDate() ).slice(-2) + '.' +
                               ( '0' + ( date.getMonth() + 1 ) ).slice(-2) + '.' +
                               date.getFullYear() + ' ' +
                               ( '0' + date.getHours() ).slice(-2) + ':' +
                               ( '0' + date.getMinutes() ).slice(-2) + ':' +
                               ( '0' + date.getSeconds() ).slice(-2));
    });

    suite('Test util.log', function () {
        const oldDebugValue = config.DEBUG;

        setup(function () {
            sinon.spy(console, 'log');
        });

        teardown(function () {
            console.log.restore();
        });

        test('Test with config.DEBUG = false', function () {
            config.DEBUG = false;

            util.log('test message');
            assert.notOk(console.log.called);

            config.DEBUG = oldDebugValue;
        });

        test('Test with config.DEBUG = true', function () {
            config.DEBUG = true;

            util.log('test message', 1, 2, 'arg');

            assert.ok(console.log.calledOnce);
            assert.ok(console.log.getCall(0).args[1].match, '/test message/');
            assert.deepEqual(console.log.getCall(0).args.slice(2), [1, 2, 'arg']);

            config.DEBUG = oldDebugValue;
        });
    });
});
