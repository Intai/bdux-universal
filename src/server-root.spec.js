/* eslint-env mocha */

import chai from 'chai'
import sinon from 'sinon'
import * as R from 'ramda'
import React from 'react'
import * as Bacon from 'baconjs'
import ActionTypes from './actions/action-types'
import { StringDecoder } from 'string_decoder'
import UniversalStore, { getReducer as getUniversalReducer } from './stores/universal-store'
import {
  createRoot,
  createAsyncRoot } from './server-root'
import {
  getActionStream,
  createStore } from 'bdux'

const createPluggable = (log) => () => {
  const stream = new Bacon.Bus()
  return {
    input: stream,
    output: stream
      .doAction(log)
  }
}

const createUniversal = (log) => () => {
  const reducer = getUniversalReducer()
  return R.assoc('output', reducer.output.doAction(log), reducer)
}

const createAsyncActions = () => (
  Bacon.once([{ type: 'test' }])
)

const removeReserved = R.pipe(
  R.dissocPath(['action', 'id']),
  R.omit(['bdux', 'dispatch', 'bindToDispatch'])
)

describe('Server Root', () => {

  let sandbox, clock, App

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    clock = sinon.useFakeTimers(Date.now())
    App = sinon.stub().returns(false)
  })

  it('should create a root to render to string', () => {
    const root = createRoot(() => <App />)
    chai.expect(root).to.have.property('renderToString')
      .and.is.a('function')
  })

  it('should create a root to render to node stream', () => {
    const root = createRoot(() => <App />)
    chai.expect(root).to.have.property('renderToNodeStream')
      .and.is.a('function')
  })

  it('should render to html string', () => {
    const root = createRoot(() => <App />)
    chai.expect(root.renderToString()).to.equal('')
  })

  it('should render to html stream', (done) => {
    const root = createRoot(() => <App />)
    const decoder = new StringDecoder('utf8')
    const readable = root.renderToNodeStream()
    let html = ''

    readable.on('data', chunk => html += decoder.write(chunk))
    readable.on('end', () => {
      html += decoder.end()
      chai.expect(html).to.equal('')
      done()
    })
  })

  it('should pass arguments to create element', () => {
    const callback = sinon.stub().returns(<App />)
    const root = createRoot(callback)
    root.renderToString('req', 'res')
    chai.expect(callback.calledOnce).to.be.true
    chai.expect(callback.lastCall.args.slice(1)).to.eql(['req', 'res'])
    chai.expect(callback.lastCall.args[0]).to.have.keys(
      'bdux', 'dispatch', 'bindToDispatch')
  })

  it('should subscribe to stores', () => {
    const createElement = ({ dispatch }) => {
      dispatch({})
      return <App />
    }

    const logReduce = sinon.stub()
    const root = createRoot(createElement, {
      test: createStore('name', createPluggable(logReduce))
    })

    root.renderToString()
    chai.expect(logReduce.calledOnce).to.be.true
    chai.expect(removeReserved(logReduce.lastCall.args[0])).to.eql({
      name: 'name',
      action: {},
      state: null
    })
  })

  it('should subscribe to universal store', () => {
    const createElement = ({ dispatch }) => {
      dispatch({})
      return <App />
    }

    const logReduce = sinon.stub()
    sandbox.stub(UniversalStore, 'getProperty').callsFake(
      createStore('name', createPluggable(logReduce)).getProperty)

    createRoot(createElement).renderToString()
    chai.expect(logReduce.calledOnce).to.be.true
    chai.expect(removeReserved(logReduce.lastCall.args[0])).to.eql({
      name: 'name',
      action: {},
      state: null
    })
  })

  it('should unsubscribe from stores', () => {
    const logReduce = sinon.stub()
    const root = createRoot(() => <App />, {
      test: createStore('name', createPluggable(logReduce))
    })

    root.renderToString()
    getActionStream().push({})
    chai.expect(logReduce.called).to.be.false
  })

  it('should unsubscribe from universal store', () => {
    const logReduce = sinon.stub()
    sandbox.stub(UniversalStore, 'getProperty').returns(
      createStore('name', createPluggable(logReduce)).getProperty())

    createRoot(() => <App />).renderToString()
    getActionStream().push({})
    chai.expect(logReduce.called).to.be.false
  })

  it('should create a async root to render to string', () => {
    const root = createAsyncRoot(createAsyncActions, () => <App />)
    chai.expect(root).to.have.property('renderToString')
      .and.is.a('function')
  })

  it('should create a async root to render to node stream', () => {
    const root = createAsyncRoot(createAsyncActions, () => <App />)
    chai.expect(root).to.have.property('renderToNodeStream')
      .and.is.a('function')
  })

  it('should pass arguments to create async actions', () => {
    const callback = sinon.stub().returns(Bacon.once([]))
    const root = createAsyncRoot(callback, () => <App />)
    root.renderToString('req', 'res')
    chai.expect(callback.calledOnce).to.be.true
    chai.expect(callback.lastCall.args.slice(1)).to.eql(['req', 'res'])
    chai.expect(callback.lastCall.args[0]).to.have.keys(
      'bdux', 'dispatch', 'bindToDispatch')
  })

  it('should pass arguments to create async element', () => {
    const callback = sinon.stub().returns(<App />)
    const root = createAsyncRoot(createAsyncActions, callback)
    root.renderToString('req', 'res').onValue()
    clock.tick(1)
    chai.expect(callback.calledOnce).to.be.true
    chai.expect(callback.lastCall.args.slice(1)).to.eql(['req', 'res'])
    chai.expect(callback.lastCall.args[0]).to.have.keys(
      'bdux', 'dispatch', 'bindToDispatch')
  })

  it('should render asynchronously to html string', () => {
    const callback = sinon.stub()
    const root = createAsyncRoot(createAsyncActions, () => <App />)
    root.renderToString().onValue(callback)
    clock.tick(1)
    chai.expect(callback.calledOnce).to.be.true
    chai.expect(callback.lastCall.args[0]).to.equal('')
  })

  it('should render asynchronously to html stream', (done) => {
    const callback = sinon.stub()
    const root = createAsyncRoot(createAsyncActions, () => <div />)
    root.renderToNodeStream().onValue(callback)

    clock.tick(1)
    chai.expect(callback.calledOnce).to.be.true

    const decoder = new StringDecoder('utf8')
    const readable = callback.lastCall.args[0]
    let html = ''

    readable.on('data', chunk => html += decoder.write(chunk))
    readable.on('end', () => {
      html += decoder.end()
      chai.expect(html).to.match(/<div[^>]*><\/div>/)
      done()
    })
  })

  it('should render asynchronously without async action', () => {
    const callback = sinon.stub()
    const actionBus = new Bacon.Bus()
    const createActions = () => actionBus
    const root = createAsyncRoot(createActions, () => <App />)
    root.renderToString().onValue(callback)
    actionBus.push([])
    chai.expect(callback.calledOnce).to.be.true
    chai.expect(callback.lastCall.args[0]).to.equal('')
  })

  it('should render asynchronously with falsy async action', () => {
    const callback = sinon.stub()
    const actionBus = new Bacon.Bus()
    const createActions = () => actionBus
    const root = createAsyncRoot(createActions, () => <App />)
    root.renderToString().onValue(callback)
    actionBus.push(null)
    chai.expect(callback.calledOnce).to.be.true
    chai.expect(callback.lastCall.args[0]).to.equal('')
  })

  it('should dispatch an asynchronous action', () => {
    const callback = sinon.stub()
    const createActions = ({ bdux }) => {
      bdux.dispatcher.getActionStream().onValue(callback)
      return Bacon.once([{ type: 'test' }])
    }

    const root = createAsyncRoot(createActions, () => <App />)
    root.renderToString().onValue()
    clock.tick(1)
    chai.expect(callback.calledThrice).to.be.true
    chai.expect(callback.firstCall.args[0])
      .to.have.property('type', 'test')
    chai.expect(callback.secondCall.args[0])
      .to.have.property('type', ActionTypes.UNIVERSAL_ASYNC_RECORD)
    chai.expect(callback.thirdCall.args[0])
      .to.have.property('type', ActionTypes.UNIVERSAL_ASYNC_RENDER)
  })

  it('should dispatch multiple asynchronous actions', () => {
    const callback = sinon.stub()
    const createActions = ({ bdux }) => {
      bdux.dispatcher.getActionStream().onValue(callback)
      return Bacon.once([{ type: 'first' }, { type: 'second' }])
    }

    const root = createAsyncRoot(createActions, () => <App />)
    root.renderToString().onValue()
    clock.tick(1)
    chai.expect(callback.callCount).to.equal(4)
    chai.expect(callback.secondCall.args[0]).to.include({
      type: 'second'
    })
  })

  it('should receive only the first set of asynchronous actions', () => {
    const callback = sinon.stub()
    const createActions = ({ bdux }) => {
      bdux.dispatcher.getActionStream().onValue(callback)
      return Bacon.fromArray([[{ type: 'first' }], [{ type: 'second' }]])
    }

    const root = createAsyncRoot(createActions, () => <App />)
    root.renderToString().onValue()
    clock.tick(1)
    chai.expect(callback.callCount).to.equal(3)
    chai.expect(callback.firstCall.args[0]).to.include({
      type: 'first'
    })
  })

  it('should subscribe to stores to render asynchronously', () => {
    const logReduce = sinon.stub()
    const root = createAsyncRoot(createAsyncActions, () => <App />, {
      test: createStore('name', createPluggable(logReduce))
    })

    root.renderToString().onValue()
    clock.tick(1)
    chai.expect(logReduce.calledThrice).to.be.true
    chai.expect(logReduce.firstCall.args[0]).to.nested.include({
      name: 'name',
      state: null,
      'action.type': 'test'
    })
  })

  it('should subscribe to universal store to render asynchronously', () => {
    const logReduce = sinon.stub()
    sandbox.stub(UniversalStore, 'getProperty').callsFake(
      createStore('name', createPluggable(logReduce)).getProperty)

    const root = createAsyncRoot(createAsyncActions, () => <App />)
    root.renderToString().onValue()
    clock.tick(1)
    chai.expect(logReduce.called).to.be.true
    chai.expect(logReduce.firstCall.args[0]).to.nested.include({
      name: 'name',
      state: null,
      'action.type': 'test'
    })
  })

  it('should update universal store to render asynchronously', () => {
    const logReduce = sinon.stub()
    sandbox.stub(UniversalStore, 'getProperty').callsFake(
      createStore('universal', createUniversal(logReduce)).getProperty)

    const root = createAsyncRoot(createAsyncActions, () => <App />)
    root.renderToString().onValue()
    clock.tick(1)
    chai.expect(logReduce.calledThrice).to.be.true
    chai.expect(logReduce.lastCall.args[0]).to.have.property('asyncRenderId')
  })

  it('should unsubscribe from stores after rendering asynchronously', () => {
    const logReduce = sinon.stub()
    const root = createAsyncRoot(createAsyncActions, () => <App />, {
      test: createStore('name', createPluggable(logReduce))
    })

    root.renderToString().onValue()
    clock.tick(1)
    logReduce.reset()
    getActionStream().push({})
    chai.expect(logReduce.called).to.be.false
  })

  it('should unsubscribe from universal store after rendering asynchronously', () => {
    const logReduce = sinon.stub()
    sandbox.stub(UniversalStore, 'getProperty').callsFake(
      createStore('universal', createUniversal(logReduce)).getProperty)

    const root = createAsyncRoot(createAsyncActions, () => <App />)
    root.renderToString().onValue()
    clock.tick(1)
    logReduce.reset()
    getActionStream().push({})
    chai.expect(logReduce.called).to.be.false
  })

  afterEach(() => {
    clock.restore()
    sandbox.restore()
  })

})
