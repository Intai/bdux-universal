/* eslint-env mocha */

import chai from 'chai'
import sinon from 'sinon'
import { JSDOM } from 'jsdom'
import Common from './utils/common-util'
import UniversalAction, {
  reloadStates } from './actions/universal-action'
import * as Universal from './universal'

describe('Universal Middleware', () => {

  let sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  it('should apply middleware after reducer', () => {
    chai.expect(Universal).to.have.property('getPostReduce')
      .and.is.a('function')
  })

  it('should apply middleware to set store default value', () => {
    chai.expect(Universal).to.have.property('getDefaultValue')
      .and.is.a('function')
  })

  describe('on server', () => {

    beforeEach(() => {
      sandbox.stub(Common, 'canUseDOM').returns(false)
    })

    it('should be transparent after reducer', () => {
      const pluggable = Universal.getPostReduce()
      const callback = sinon.stub()
      const value = {}

      pluggable.output.onValue(callback)
      pluggable.input.push(value)
      chai.expect(callback.calledOnce).to.be.true
      chai.expect(callback.lastCall.args[0]).to.equal(value)
    })

    it('should start recording after reducer', () => {
      sandbox.spy(UniversalAction, 'start')
      Universal.getPostReduce()
      chai.expect(UniversalAction.start.calledOnce).to.be.true
    })

    it('should record after reducer', () => {
      sandbox.spy(UniversalAction, 'record')
      const pluggable = Universal.getPostReduce()
      const callback = sinon.stub()
      const value = {}

      pluggable.output.onValue(callback)
      pluggable.input.push(value)
      chai.expect(UniversalAction.record.calledOnce).to.be.true
      chai.expect(UniversalAction.record.lastCall.args[0]).to.equal(value)
    })

    it('should set store default value to be null', () => {
      const defaultValue = Universal.getDefaultValue('test', null)
      chai.expect(defaultValue).to.be.null
    })

  })

  describe('in browser', () => {

    beforeEach(() => {
      sandbox.stub(Common, 'canUseDOM').returns(true)
    })

    describe('with universal states', () => {

      beforeEach(() => {
        const dom = new JSDOM(' \
          <script id="universal" type="application/json"> \
            [{"name":"test","nextState":"Message from Server"}] \
          </script>')

        global.window = dom.window
        global.document = dom.window.document
        reloadStates()
      })

      it('should not start with unknown states after reducer', () => {
        const pluggable = Universal.getPostReduce('unknown')
        const callback = sinon.stub()

        pluggable.output.toProperty({ nextState: null }).onValue(callback)
        chai.expect(callback.calledOnce).to.be.true
        chai.expect(callback.lastCall.args[0]).to.include({
          nextState: null
        })
      })

      it('should set store default value', () => {
        const defaultValue = Universal.getDefaultValue('test', null)
        chai.expect(defaultValue).to.equal('Message from Server')
      })

    })

    describe('without universal states', () => {

      beforeEach(() => {
        const dom = new JSDOM('<html></html>')

        global.window = dom.window
        global.document = dom.window.document
        reloadStates()
      })

      it('should not start with states after reducer', () => {
        const pluggable = Universal.getPostReduce('empty')
        const callback = sinon.stub()

        pluggable.output.toProperty({ nextState: null }).onValue(callback)
        chai.expect(callback.calledOnce).to.be.true
        chai.expect(callback.lastCall.args[0]).to.include({
          nextState: null
        })
      })

      it('should set store default value to be null', () => {
        const defaultValue = Universal.getDefaultValue('test', null)
        chai.expect(defaultValue).to.be.null
      })

    })

  })

  afterEach(() => {
    sandbox.restore()
  })

})
