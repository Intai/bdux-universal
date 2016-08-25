import R from 'ramda'
import chai from 'chai'
import sinon from 'sinon'
import React from 'react'
import Bacon from 'baconjs'
import UniversalStore from './stores/universal-store'
import {
  createRoot,
  createAsyncRoot } from './server-root'
import {
  getActionStream,
  createStore,
  createComponent } from 'bdux'


const createPluggable = (log) => () => {
  const stream = new Bacon.Bus()
  return {
    input: stream,
    output: stream
      .doAction(log)
  }
}

const createAsyncActions = () => (
  Bacon.once([{ type: 'test' }])
    .delay(1)
)

describe('Server Root', () => {

  let sandbox, clock, App

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
    clock = sinon.useFakeTimers(Date.now())
    App = sinon.stub().returns(false)
  })

  it('should create a root to render to string', () => {
    const root = createRoot(() => <App />)
    chai.expect(root).to.have.property('renderToString')
      .and.is.a('function')
  })

  it('should render to html string', () => {
    const root = createRoot(() => <App />)
    chai.expect(root.renderToString()).to.match(/^<!--.*-->$/)
  })

  it('should subscribe to stores', () => {
    const createElement = () => {
      getActionStream().push({})
      return <App />
    }

    const logReduce = sinon.stub()
    const root = createRoot(createElement, {
      test: createStore('name', createPluggable(logReduce))
    })

    root.renderToString()
    chai.expect(logReduce.calledOnce).to.be.true
    chai.expect(logReduce.lastCall.args[0]).to.eql({
      name: 'name',
      action: {},
      state: null
    })
  })

  it('should subscribe to universal store', () => {
    const createElement = () => {
      getActionStream().push({})
      return <App />
    }

    const logReduce = sinon.stub()
    sandbox.stub(UniversalStore, 'getProperty').returns(
      createStore('name', createPluggable(logReduce)).getProperty())

    createRoot(createElement).renderToString()
    chai.expect(logReduce.calledOnce).to.be.true
    chai.expect(logReduce.lastCall.args[0]).to.eql({
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

  it('should render asynchronously to html string', () => {
    const callback = sinon.stub()
    const root = createAsyncRoot(createAsyncActions, () => <App />)
    root.renderToString().onValue(callback)
    clock.tick(1)
    chai.expect(callback.calledOnce).to.be.true
    chai.expect(callback.lastCall.args[0]).to.match(/^<!--.*-->$/)
  })

  it('should dispatch an asynchronous action', () => {
    const callback = sinon.stub()
    const root = createAsyncRoot(createAsyncActions, () => <App />)
    getActionStream().onValue(callback)
    root.renderToString().onValue()
    clock.tick(1)
    chai.expect(callback.calledOnce).to.be.true
    chai.expect(callback.lastCall.args[0]).to.eql({
      type: 'test'
    })
  })

  it('should dispatch multiple asynchronous actions', () => {
    const callback = sinon.stub()
    const createActions = () => Bacon.once([{ type: 'first' }, { type: 'second' }])
    const root = createAsyncRoot(createActions, () => <App />)
    getActionStream().onValue(callback)
    root.renderToString().onValue()
    chai.expect(callback.calledTwice).to.be.true
    chai.expect(callback.lastCall.args[0]).to.eql({
      type: 'second'
    })
  })

  it('should receive all asynchronous actions at once', () => {
    const callback = sinon.stub()
    const createActions = () => Bacon.fromArray([[{ type: 'first' }], [{ type: 'second' }]])
    const root = createAsyncRoot(createActions, () => <App />)
    getActionStream().onValue(callback)
    root.renderToString().onValue()
    chai.expect(callback.calledOnce).to.be.true
    chai.expect(callback.lastCall.args[0]).to.eql({
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
    chai.expect(logReduce.calledOnce).to.be.true
    chai.expect(logReduce.lastCall.args[0]).to.eql({
      name: 'name',
      state: null,
      action: {
        type: 'test'
      }
    })
  })

  it('should subscribe to universal store to render asynchronously', () => {
    const logReduce = sinon.stub()
    sandbox.stub(UniversalStore, 'getProperty').returns(
      createStore('name', createPluggable(logReduce)).getProperty())

    const root = createAsyncRoot(createAsyncActions, () => <App />)
    root.renderToString().onValue()
    clock.tick(1)
    chai.expect(logReduce.calledOnce).to.be.true
    chai.expect(logReduce.lastCall.args[0]).to.eql({
      name: 'name',
      state: null,
      action: {
        type: 'test'
      }
    })
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
    sandbox.stub(UniversalStore, 'getProperty').returns(
      createStore('name', createPluggable(logReduce)).getProperty())

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
