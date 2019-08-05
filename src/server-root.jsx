import {
  append,
  apply,
  assoc,
  map,
  merge,
  pipe,
  prop,
  forEach,
  values,
} from 'ramda'
import React from 'react'
import Bacon from 'baconjs'
import UniversalStore from './stores/universal-store'
import { startAsyncRecord } from './actions/universal-action'
import { renderToString, renderToNodeStream } from 'react-dom/server'
import { BduxContext, createDispatcher } from 'bdux'

const createContext = () => {
  const dispatcher = createDispatcher()
  return {
    dispatcher,
    props: {
      bdux: {
        dispatcher,
        stores: new WeakMap()
      },
      dispatch: dispatcher.dispatchAction,
      bindToDispatch: dispatcher.bindToDispatch
    }
  }
}

const subscribe = (props) => (store) => (
  // subscribe to a store.
  store.getProperty(props).onValue()
)

const activateStores = (props) => pipe(
  // get the array of stores.
  values,
  // subscribe to stores.
  map(subscribe(props)),
  // pipe all dispose functions.
  apply(pipe)
)

const renderElement = (render, createElement, stores) => (...args) => {
  const { props } = createContext()

  // activate stores before rendering.
  const dispose = activateStores(props)({
    ...stores,
    universal: UniversalStore
  })

  // create component element.
  const element = (
    <BduxContext.Provider value={props.bdux}>
      {createElement(props, ...args)}
    </BduxContext.Provider>
  )

  // render to html.
  const html = render(element)
  // dispose store subscriptions.
  dispose()

  return html
}

const combineStoreChanges = (props, stores) => (
  Bacon.combineAsArray(
    map(
      store => store.getProperty(props).changes(),
      append(
        UniversalStore,
        values(stores || {})
      )
    )
  )
)

const isAsyncRender = (id) => (changes) => {
  const lastChange = changes[changes.length - 1]
  return lastChange && lastChange.asyncRenderId === id
}

const pushActions = (dispatcher, id) => (actions) => {
  const bus = dispatcher.getActionStream()
  forEach(
    action => bus.push(assoc('id', dispatcher.generateActionId(), action)),
    actions || []
  )
  bus.push(startAsyncRecord(id))
}

const wrapAsyncElement = (createElement, props, args) => (data) => (
  merge(data, {
    element: (
      <BduxContext.Provider value={props.bdux}>
        {createElement(props, ...args)}
      </BduxContext.Provider>
    )
  })
)

const wrapAsyncRender = (render) => (data) => (
  merge(data, {
    html: render(data.element)
  })
)

const renderAsyncElementToHtml = (render, createAsyncActions, createElement, stores) => (...args) => {
  const { dispatcher, props } = createContext()

  const asyncRenderId = dispatcher.generateActionId()
  const ret = combineStoreChanges(props, stores)
    // hold unitl the actions dispatched and stores updated.
    .filter(isAsyncRender(asyncRenderId))
    // create component element.
    .map(wrapAsyncElement(createElement, props, args))
    // render the element.
    .map(wrapAsyncRender(render))
    // return html string or stream.
    .map(prop('html'))
    .first()

  // create asynchronous actions.
  createAsyncActions(props, ...args)
    .first()
    // dispatch the asynchronous actions.
    .onValue(pushActions(dispatcher, asyncRenderId))

  return ret
}

export const createRoot = (...args) => ({
  // create and render the element.
  renderToString: renderElement(renderToString, ...args),
  renderToNodeStream: renderElement(renderToNodeStream, ...args)
})

export const createAsyncRoot = (...args) => ({
  renderToString: renderAsyncElementToHtml(renderToString, ...args),
  renderToNodeStream: renderAsyncElementToHtml(renderToNodeStream, ...args)
})
