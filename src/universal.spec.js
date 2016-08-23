import chai from 'chai'
import sinon from 'sinon'
import Bacon from 'baconjs'
import { jsdom } from 'jsdom'
import Common from './utils/common-util'
import UniversalAction from './actions/universal-action'
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

    it('should be transparent before reducer on server', () => {
      const pluggable = Universal.getPreReduce()
      const callback = sinon.stub()
      const value = {}

      pluggable.output.onValue(callback)
      pluggable.input.push(value)
      chai.expect(callback.calledOnce).to.be.true
      chai.expect(callback.lastCall.args[0]).to.equal(value)
    })

    it('should be transparent after reducer on server', () => {
      const pluggable = Universal.getPostReduce()
      const callback = sinon.stub()
      const value = {}
      
      pluggable.output.onValue(callback)
      pluggable.input.push(value)
      chai.expect(callback.calledOnce).to.be.true
      chai.expect(callback.lastCall.args[0]).to.equal(value)
    })

    it('should start recording after reducer on server', () => {
      sandbox.spy(UniversalAction, 'start')
      Universal.getPostReduce()
      chai.expect(UniversalAction.start.calledOnce).to.be.true
    })

    it('should record after reducer on server', () => {
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
        const doc = jsdom(
          '<html><body><script id="universal" type="application/json"> \
            [{"name":"test","nextState":"Message from Server"}] \
          </script></body></html>')

        global.document = doc
        global.window = doc.defaultView
      })

      it('should resume states before reducer in browser', () => {
        const pluggable = Universal.getPreReduce('test')
        const callback = sinon.stub()

        pluggable.output.onValue(callback)
        pluggable.input.push({ state: null })
        chai.expect(callback.calledOnce).to.be.true
        chai.expect(callback.lastCall.args[0]).to.eql({
          state: 'Message from Server'
        })
      })

      it('should not resume unknown states before reducer in browser', () => {
        const pluggable = Universal.getPreReduce('unknown')
        const callback = sinon.stub()

        pluggable.output.onValue(callback)
        pluggable.input.push({ state: null })
        chai.expect(callback.calledOnce).to.be.true
        chai.expect(callback.lastCall.args[0]).to.eql({
          state: null
        })
      })

      it('should not overwrite states before reducer in browser', () => {
        const pluggable = Universal.getPreReduce('test')
        const callback = sinon.stub()

        pluggable.output.onValue(callback)
        pluggable.input.push({ state: 'Message' })
        chai.expect(callback.calledOnce).to.be.true
        chai.expect(callback.lastCall.args[0]).to.eql({
          state: 'Message'
        })
      })

    })

    describe('without universal states', () => {

    })

  })

  afterEach(() => {
    sandbox.restore()
  })

})
