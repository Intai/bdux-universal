import R from 'ramda'
import chai from 'chai'
import sinon from 'sinon'
import React from 'react'
import Bacon from 'baconjs'
import UniversalStore from './stores/universal-store'
import { createRoot } from './server-root'
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

describe('Server Root', () => {

  let sandbox, App

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
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

  afterEach(() => {
    sandbox.restore()
  })

})
