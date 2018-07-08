/* eslint-env mocha */

import R from 'ramda'
import chai from 'chai'
import sinon from 'sinon'
import { JSDOM } from 'jsdom'
import { createDispatcher } from 'bdux'
import Common from './utils/common-util'
import ActionTypes from './actions/action-types'
import { reloadStates } from './actions/universal-action'
import * as Universal from './universal'

const removeReserved = R.omit(
  ['id', 'skipLog']
)

describe('Universal Middleware', () => {

  let sandbox, dispatcher, params

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    dispatcher = createDispatcher()
    params = {
      name: 'name',
      dispatch: dispatcher.dispatchAction,
      bindToDispatch: dispatcher.bindToDispatch
    }
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
      const pluggable = Universal.getPostReduce(params)
      const callback = sinon.stub()
      const value = {}

      pluggable.output.onValue(callback)
      pluggable.input.push(value)
      chai.expect(callback.calledOnce).to.be.true
      chai.expect(callback.lastCall.args[0]).to.equal(value)
    })

    it('should record after reducer', () => {
      const pluggable = Universal.getPostReduce(params)
      const callback = sinon.stub()
      const value = {}

      dispatcher.getActionStream().onValue(callback)
      pluggable.output.onValue()
      pluggable.input.push(value)
      chai.expect(callback.calledOnce).to.be.true
      chai.expect(removeReserved(callback.lastCall.args[0])).to.eql({
        type: ActionTypes.UNIVERSAL_RECORD,
        record: {}
      })
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
        const pluggable = Universal.getPostReduce(params)
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
        const pluggable = Universal.getPostReduce(params)
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
