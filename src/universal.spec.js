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

  it('should apply middleware before reducer', () => {
    chai.expect(Universal).to.have.property('getPreReduce')
      .and.is.a('function')
  })

  it('should apply middleware after reducer', () => {
    chai.expect(Universal).to.have.property('getPostReduce')
      .and.is.a('function')
  })

  describe('on server', () => {

    beforeEach(() => {
      sandbox.stub(Common, 'canUseDOM').returns(false)
    })

    it('should be transparent before reducer', () => {
      const pluggable = Universal.getPreReduce()
      const callback = sinon.stub()
      const value = {}

      pluggable.output.onValue(callback)
      pluggable.input.push(value)
      chai.expect(callback.calledOnce).to.be.true
      chai.expect(callback.lastCall.args[0]).to.equal(value)
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

      it('should resume states before reducer', () => {
        const pluggable = Universal.getPreReduce('test')
        const callback = sinon.stub()

        pluggable.output.onValue(callback)
        pluggable.input.push({ state: null })
        chai.expect(callback.calledOnce).to.be.true
        chai.expect(callback.lastCall.args[0]).to.eql({
          state: 'Message from Server'
        })
      })

      it('should only resume states once before reducer', () => {
        const pluggable = Universal.getPreReduce('test')
        const callback = sinon.stub()

        pluggable.output.onValue(callback)
        pluggable.input.push({ state: null })
        pluggable.input.push({ state: null })
        chai.expect(callback.calledTwice).to.be.true
        chai.expect(callback.lastCall.args[0]).to.eql({
          state: null
        })
      })

      it('should not resume unknown states before reducer', () => {
        const pluggable = Universal.getPreReduce('unknown')
        const callback = sinon.stub()

        pluggable.output.onValue(callback)
        pluggable.input.push({ state: null })
        chai.expect(callback.calledOnce).to.be.true
        chai.expect(callback.lastCall.args[0]).to.eql({
          state: null
        })
      })

      it('should not overwrite states before reducer', () => {
        const pluggable = Universal.getPreReduce('test')
        const callback = sinon.stub()

        pluggable.output.onValue(callback)
        pluggable.input.push({ state: 'Message' })
        chai.expect(callback.calledOnce).to.be.true
        chai.expect(callback.lastCall.args[0]).to.eql({
          state: 'Message'
        })
      })

      it('should plug before multiple reducers', () => {
        const pluggable1 = Universal.getPreReduce('test')
        const pluggable2 = Universal.getPreReduce('test')
        const callback1 = sinon.stub()
        const callback2 = sinon.stub()

        pluggable1.output.onValue(callback1)
        pluggable1.input.push({ state: null })
        chai.expect(callback1.calledOnce).to.be.true
        chai.expect(callback1.lastCall.args[0]).to.eql({
          state: 'Message from Server'
        })

        pluggable2.output.onValue(callback2)
        pluggable2.input.push({ state: null })
        chai.expect(callback2.calledOnce).to.be.true
        chai.expect(callback2.lastCall.args[0]).to.eql({
          state: 'Message from Server'
        })

        pluggable1.input.push({ state: null })
        chai.expect(callback1.lastCall.args[0]).to.eql({
          state: null
        })

        pluggable2.input.push({ state: null })
        chai.expect(callback2.lastCall.args[0]).to.eql({
          state: null
        })
      })

      it('should start with states after reducer', () => {
        const pluggable = Universal.getPostReduce('test')
        const callback = sinon.stub()

        pluggable.output.toProperty({ nextState: null }).onValue(callback)
        chai.expect(callback.calledTwice).to.be.true
        chai.expect(callback.lastCall.args[0]).to.include({
          nextState: 'Message from Server'
        })
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

    })

    describe('without universal states', () => {

      beforeEach(() => {
        const dom = new JSDOM('<html></html>')

        global.window = dom.window
        global.document = dom.window.document
        reloadStates()
      })

      it('should not resume states before reducer', () => {
        const pluggable = Universal.getPreReduce('empty')
        const callback = sinon.stub()

        pluggable.output.onValue(callback)
        pluggable.input.push({ state: null })
        chai.expect(callback.calledOnce).to.be.true
        chai.expect(callback.lastCall.args[0]).to.eql({
          state: null
        })
      })

      it('should plug before multiple reducers', () => {
        const pluggable1 = Universal.getPreReduce('empty')
        const pluggable2 = Universal.getPreReduce('empty')
        const callback1 = sinon.stub()
        const callback2 = sinon.stub()

        pluggable1.output.onValue(callback1)
        pluggable1.input.push({ state: null })
        chai.expect(callback1.calledOnce).to.be.true
        chai.expect(callback1.lastCall.args[0]).to.eql({
          state: null
        })

        pluggable2.output.onValue(callback2)
        pluggable2.input.push({ state: null })
        chai.expect(callback2.calledOnce).to.be.true
        chai.expect(callback2.lastCall.args[0]).to.eql({
          state: null
        })

        pluggable1.input.push({ state: 'Message' })
        chai.expect(callback1.lastCall.args[0]).to.eql({
          state: 'Message'
        })

        pluggable2.input.push({ state: 'Message' })
        chai.expect(callback2.lastCall.args[0]).to.eql({
          state: 'Message'
        })
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

    })

  })

  afterEach(() => {
    sandbox.restore()
  })

})
