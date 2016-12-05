/* eslint-env mocha */

import chai from 'chai'
import sinon from 'sinon'
import Bacon from 'baconjs'
import { getActionStream } from 'bdux'
import Common from '../utils/common-util'
import ActionTypes from '../actions/action-types'
import UniversalStore, {
  getReducer } from './universal-store'

describe('Universal Store', () => {

  let sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  it('should have reducer input', () => {
    chai.expect(getReducer()).to.have.property('input')
      .and.is.instanceof(Bacon.Observable)
  })

  it('should have reducer output', () => {
    chai.expect(getReducer()).to.have.property('output')
      .and.is.instanceof(Bacon.Observable)
  })

  it('should keep records in store', () => {
    const records = [{
      name: 'test',
      nextState: true
    }]

    const callback = sinon.stub()
    sandbox.stub(Common, 'canUseDOM').returns(false)
    UniversalStore.getProperty().onValue(callback)
    getActionStream().push({
      type: ActionTypes.UNIVERSAL_RECORDS,
      records: records
    })

    chai.expect(callback.calledTwice).to.be.true
    chai.expect(callback.lastCall.args[0]).to.eql({
      records: records
    })
  })

  afterEach(() => {
    sandbox.restore()
  })

})
