/* eslint-env mocha */

import chai from 'chai'
import sinon from 'sinon'
import { JSDOM } from 'jsdom'
import ActionTypes from './action-types'
import StoreNames from '../stores/store-names'
import Common from '../utils/common-util'
import { hasUniversalStates } from './has-universal-states'
import {
  record,
  loadStates,
  reloadStates,
  startAsyncRecord,
  startAsyncRender,
} from './universal-action'

describe('Universal Action', () => {

  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
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

  it('should not record in browser', () => {
    sandbox.stub(Common, 'canUseDOM').returns(true)
    chai.expect(record({})).to.not.be.ok
  })

  it('should not record universal store', () => {
    sandbox.stub(Common, 'canUseDOM').returns(false)
    chai.expect(record({ name: StoreNames.UNIVERSAL })).to.not.be.ok
  })

  it('should not record universal record action', () => {
    sandbox.stub(Common, 'canUseDOM').returns(false)
    chai.expect(record({ action: { type: ActionTypes.UNIVERSAL_RECORD }})).to.not.be.ok
  })

  it('should not record universal async record action', () => {
    sandbox.stub(Common, 'canUseDOM').returns(false)
    chai.expect(record({ action: { type: ActionTypes.UNIVERSAL_ASYNC_RECORD }})).to.not.be.ok
  })

  it('should not record universal async render action', () => {
    sandbox.stub(Common, 'canUseDOM').returns(false)
    chai.expect(record({ action: { type: ActionTypes.UNIVERSAL_ASYNC_RENDER }})).to.not.be.ok
  })

  it('should record on server', () => {
    sandbox.stub(Common, 'canUseDOM').returns(false)
    chai.expect(record({ name: 'test' })).to.eql({
      type: ActionTypes.UNIVERSAL_RECORD,
      record: { name: 'test' },
      skipLog: true
    })
  })

  it('should record only name and nextState on server', () => {
    sandbox.stub(Common, 'canUseDOM').returns(false)
    chai.expect(record({ name: 'test', nextState: {}, unknown: true }))
      .to.eql({
        type: ActionTypes.UNIVERSAL_RECORD,
        record: { name: 'test', nextState: {} },
        skipLog: true
      })
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

  it('should create async record action', () => {
    chai.expect(startAsyncRecord(1)).to.eql({
      type: ActionTypes.UNIVERSAL_ASYNC_RECORD,
      asyncRenderId: 1,
      skipLog: true
    })
  })

  it('should create async render action', () => {
    chai.expect(startAsyncRender(2)).to.eql({
      type: ActionTypes.UNIVERSAL_ASYNC_RENDER,
      asyncRenderId: 2,
      skipLog: true
    })
  })

  afterEach(() => {
    sandbox.restore()
  })

})
