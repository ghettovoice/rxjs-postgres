import chai, { expect } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { config } from '../src'
import * as util from '../src/util'

chai.use(sinonChai)

describe('Util functions tests', function () {
  /** @test {datetime} */
  it('Test util.datetime', function () {
    let ts = new Date(2016, 0, 1, 0, 0, 0, 0).getTime()
    let dt = util.datetime(ts)

    expect(dt).to.equal('01.01.2016 00:00:00.0')

    let date = new Date()
    dt = util.datetime()

    expect(dt).to.equal(('0' + date.getDate()).slice(-2) + '.' +
                        ('0' + (date.getMonth() + 1)).slice(-2) + '.' +
                        date.getFullYear() + ' ' +
                        ('0' + date.getHours()).slice(-2) + ':' +
                        ('0' + date.getMinutes()).slice(-2) + ':' +
                        ('0' + date.getSeconds()).slice(-2) + '.' +
                        date.getMilliseconds())
  })

  /** @test {log} */
  describe('Test util.log', function () {
    const oldDebugValue = config.DEBUG

    beforeEach(function () {
      sinon.spy(console, 'log')
    })

    afterEach(function () {
      console.log.restore()
    })

    it('Test with config.DEBUG = false', function () {
      config.DEBUG = false

      util.log('test message')
      expect(console.log).has.not.been.called

      config.DEBUG = oldDebugValue
    })

    it('Test with config.DEBUG = true', function () {
      config.DEBUG = true

      util.log('test message', 1, 2, 'arg')

      expect(console.log).has.been.calledOnce

      const call = console.log.getCall(0)
      expect(call.args[ 1 ].match(/test message/)).is.ok
      expect(call.args.slice(2)).to.deep.equal([ 1, 2, 'arg' ])

      config.DEBUG = oldDebugValue
    })
  })
})
