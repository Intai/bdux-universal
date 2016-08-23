import chai from 'chai'
import sinon from 'sinon'
import Bacon from 'baconjs'
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

    })

    describe('without universal states', () => {

    })

  })

  afterEach(() => {
    sandbox.restore()
  })

})
