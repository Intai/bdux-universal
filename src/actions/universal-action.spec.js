import chai from 'chai'
import sinon from 'sinon'
import Bacon from 'baconjs'
import Common from '../utils/common-util'
import {
  start,
  record } from './universal-action'

describe('Universal Action', () => {

  let sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  it('should not start recording in browser', () => {
    sandbox.stub(Common, 'canUseDOM').returns(true)
    chai.expect(start()).to.not.be.ok
  })

  it('should not record in browser', () => {
    sandbox.stub(Common, 'canUseDOM').returns(true)
    chai.expect(record({})).to.not.be.ok
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

  afterEach(() => {
    sandbox.restore()
  })

})