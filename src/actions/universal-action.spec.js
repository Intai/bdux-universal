/* eslint-env mocha */

import chai from 'chai'
import sinon from 'sinon'
import Bacon from 'baconjs'
import { JSDOM } from 'jsdom'
import ActionTypes from './action-types'
import StoreNames from '../stores/store-names'
import Common from '../utils/common-util'
import UniversalAction, {
  start,
  record,
  loadStates,
  reloadStates,
  hasUniversalStates } from './universal-action'

describe('Universal Action', () => {

  let sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  it('should have no universal states', () => {
    chai.expect(hasUniversalStates()).to.be.false
  })

  it('should have universal states', () => {
    const dom = new JSDOM(' \
      <script id="universal" type="application/json"> \
      </script>')

    global.window = dom.window
    global.document = dom.window.document
    sandbox.stub(Common, 'canUseDOM').returns(true)
    chai.expect(hasUniversalStates()).to.be.true
  })

  it('should not start recording in browser', () => {
    sandbox.stub(Common, 'canUseDOM').returns(true)
    chai.expect(start()).to.not.be.ok
  })

  it('should not record in browser', () => {
    sandbox.stub(Common, 'canUseDOM').returns(true)
    chai.expect(record({})).to.not.be.ok
  })

  it('should not record universal store', () => {
    sandbox.stub(Common, 'canUseDOM').returns(false)
    chai.expect(record({ name: StoreNames.UNIVERSAL })).to.not.be.ok
  })

  it('should not record universal actions', () => {
    sandbox.stub(Common, 'canUseDOM').returns(false)
    chai.expect(record({ action: { type: ActionTypes.UNIVERSAL_RECORDS }})).to.not.be.ok
  })

  it('should create a stream to start recording', () => {
    sandbox.stub(Common, 'canUseDOM').returns(false)
    chai.expect(start()).to.be.instanceof(Bacon.Observable)
  })

  it('should not create any action to start recording', () => {
    const callback = sinon.stub()
    sandbox.stub(Common, 'canUseDOM').returns(false)
    start().onValue(callback)
    chai.expect(callback.called).to.be.false
  })

  it('should record on server', () => {
    const callback = sinon.stub()
    sandbox.stub(Common, 'canUseDOM').returns(false)
    start().onValue(callback)
    chai.expect(record({ name: 'test' })).to.not.be.ok
    chai.expect(callback.calledOnce).to.be.true
    chai.expect(callback.lastCall.args[0]).to.eql({
      type: ActionTypes.UNIVERSAL_RECORDS,
      records: [{ name: 'test' }],
      skipLog: true
    })
  })

  it('should record nextState on server', () => {
    const callback = sinon.stub()
    const state = { name: 'test', nextState: 'next' }
    sandbox.stub(Common, 'canUseDOM').returns(false)
    start().onValue(callback)
    record(state)
    chai.expect(callback.calledOnce).to.be.true
    chai.expect(callback.lastCall.args[0]).to.have.property('records')
      .and.eql([state])
  })

  it('should record only name and nextState on server', () => {
    const callback = sinon.stub()
    sandbox.stub(Common, 'canUseDOM').returns(false)
    start().onValue(callback)
    record({ name: 'test', nextState: {}, unknown: true })
    chai.expect(callback.calledOnce).to.be.true
    chai.expect(callback.lastCall.args[0]).to.have.property('records')
      .and.eql([{
        name: 'test',
        nextState: {}
      }])
  })

  it('should record multiple stores on server', () => {
    const callback = sinon.stub()
    sandbox.stub(Common, 'canUseDOM').returns(false)
    start().onValue(callback)
    record({ name: 'test1', nextState: 'next' })
    record({ name: 'test2', nextState: {} })
    chai.expect(callback.calledTwice).to.be.true
    chai.expect(callback.lastCall.args[0]).to.have.property('records')
      .and.eql([{
        name: 'test1',
        nextState: 'next'
      }, {
        name: 'test2',
        nextState: {}
      }])
  })

  it('should overwrite records on server', () => {
    const callback = sinon.stub()
    sandbox.stub(Common, 'canUseDOM').returns(false)
    start().onValue(callback)
    record({ name: 'test', nextState: 'next' })
    record({ name: 'test', nextState: {} })
    chai.expect(callback.calledTwice).to.be.true
    chai.expect(callback.lastCall.args[0]).to.have.property('records')
      .and.eql([{
        name: 'test',
        nextState: {}
      }])
  })

  it('should start recording only once on server', () => {
    sandbox.stub(Common, 'canUseDOM').returns(false)
    UniversalAction.start()
    chai.expect(UniversalAction.start()).to.not.be.ok
  })

  it('should load states from server', () => {
    const dom = new JSDOM(' \
      <script id="universal" type="application/json"> \
        [{"name":"test","nextState":""}] \
      </script>')

    global.window = dom.window
    global.document = dom.window.document
    chai.expect(reloadStates()).to.be.an('array')
      .and.eql([{
        name: 'test',
        nextState: ''
      }])
  })

  it('should load empty state from server', () => {
    const dom = new JSDOM(' \
      <script id="universal" type="application/json"> \
      </script>')

    global.window = dom.window
    global.document = dom.window.document
    chai.expect(reloadStates()).to.be.an('array')
      .and.is.empty
  })

  it('should not load state from server', () => {
    const dom = new JSDOM('<html></html>')

    global.window = dom.window
    global.document = dom.window.document
    chai.expect(reloadStates()).to.be.an('array')
      .and.is.empty
  })

  it('should cache states from server', () => {
    const domEmpty = new JSDOM('<html></html>')

    global.window = domEmpty.window
    global.document = domEmpty.window.document
    chai.expect(reloadStates()).to.be.an('array')
      .and.is.empty

    const domTest = new JSDOM(' \
      <script id="universal" type="application/json"> \
        [{"name":"test","nextState":""}] \
      </script>')

    global.window = domTest.window
    global.document = domTest.window.document
    chai.expect(loadStates()).to.be.an('array')
      .and.is.empty
  })

  afterEach(() => {
    sandbox.restore()
  })

})
