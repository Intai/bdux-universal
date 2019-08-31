/* eslint-env mocha */

import chai from 'chai'
import sinon from 'sinon'
import * as Bacon from 'baconjs'
import { createDispatcher } from 'bdux'
import ActionTypes from '../actions/action-types'
import UniversalStore, { getReducer } from './universal-store'

describe('Universal Store', () => {

  let dispatcher, props

  beforeEach(() => {
    dispatcher = createDispatcher()
    props = {
      bdux: {
        dispatcher,
        stores: new WeakMap()
      }
    }
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
    const record = {
      name: 'test',
      nextState: true
    }

    const callback = sinon.stub()
    UniversalStore.getProperty(props).onValue(callback)
    dispatcher.getActionStream().push({
      type: ActionTypes.UNIVERSAL_RECORD,
      record
    })

    chai.expect(callback.calledTwice).to.be.true
    chai.expect(callback.lastCall.args[0]).to.deep.include({
      records: [record]
    })
  })

  it('should record multiple stores', () => {
    const callback = sinon.stub()
    UniversalStore.getProperty(props).onValue(callback)
    dispatcher.getActionStream().push({
      type: ActionTypes.UNIVERSAL_RECORD,
      record: { name: 'test1', nextState: 'next' }
    })
    dispatcher.getActionStream().push({
      type: ActionTypes.UNIVERSAL_RECORD,
      record: { name: 'test2', nextState: {} }
    })

    chai.expect(callback.calledThrice).to.be.true
    chai.expect(callback.lastCall.args[0]).to.have.property('records')
      .and.eql([{
        name: 'test1',
        nextState: 'next'
      }, {
        name: 'test2',
        nextState: {}
      }])
  })

  it('should overwrite records', () => {
    const callback = sinon.stub()
    UniversalStore.getProperty(props).onValue(callback)
    dispatcher.getActionStream().push({
      type: ActionTypes.UNIVERSAL_RECORD,
      record: { name: 'test', nextState: 'next' }
    })
    dispatcher.getActionStream().push({
      type: ActionTypes.UNIVERSAL_RECORD,
      record: { name: 'test', nextState: {} }
    })

    chai.expect(callback.calledThrice).to.be.true
    chai.expect(callback.lastCall.args[0]).to.have.property('records')
      .and.eql([{
        name: 'test',
        nextState: {}
      }])
  })

  it('should update async render id', () => {
    const callback = sinon.stub()
    UniversalStore.getProperty(props).onValue(callback)
    dispatcher.getActionStream().push({
      type: ActionTypes.UNIVERSAL_ASYNC_RENDER,
      asyncRenderId: 1
    })

    chai.expect(callback.calledTwice).to.be.true
    chai.expect(callback.lastCall.args[0])
      .to.have.property('asyncRenderId', 1)
  })

  it('should pass on async render id', () => {
    const callback = sinon.stub()
    UniversalStore.getProperty(props).onValue(callback)
    dispatcher.getActionStream().push({
      type: ActionTypes.UNIVERSAL_ASYNC_RECORD,
      asyncRenderId: 2
    })

    chai.expect(callback.calledThrice).to.be.true
    chai.expect(callback.secondCall.args[0]).to.be.null
    chai.expect(callback.lastCall.args[0])
      .to.have.property('asyncRenderId', 2)
  })

})
