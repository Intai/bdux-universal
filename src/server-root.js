import * as R from 'ramda'
import Bacon from 'baconjs'
import UniversalStore from './stores/universal-store'
import { startAsyncRecord } from './actions/universal-action'
import { renderToString, renderToNodeStream } from 'react-dom/server'
import { generateActionId, getActionStream } from 'bdux'

const subscribe = (store) => (
  // subscribe to a store.
  store.getProperty().onValue()
)

const hasFuncs = R.allPass([
  R.is(Array),
  R.complement(R.isEmpty)
])

const pipeFuncs = R.ifElse(
  hasFuncs,
  R.apply(R.pipe),
  R.always(R.F)
)

const activateStores = R.pipe(
  // get the array of stores.
  R.values,
  // subscribe to stores.
  R.map(subscribe),
  // pipe all dispose functions.
  pipeFuncs
)

const wrapStores = (render, stores) => (...args) => {
  // activate stores before rendering.
  const dispose = activateStores(R.merge(
    stores || {}, {
      universal: UniversalStore
    }
  ))

  // render to html.
  const html = render(...args)
  // dispose store subscriptions.
  dispose()

  return html
}

const renderElement = (render, createElement, stores) => wrapStores(
  R.pipe(
    // create component element.
    createElement,
    // render the element.
    render
  ),
  stores
)

const combineStoreChanges = (stores) => (
  Bacon.combineAsArray(
    R.map(
      store => store.getProperty().changes(),
      R.append(
        UniversalStore,
        R.values(stores || {})
      )
    )
  )
)

const isAsyncRender = (id) => R.pipe(
  R.last,
  R.when(
    R.identity,
    R.propEq('asyncRenderId', id)
  )
)

const addActionId = R.converge(
  R.assoc('id'), [
    generateActionId,
    R.identity
  ]
)

const pushActions = (id) => (actions) => {
  const bus = getActionStream()
  R.forEach(action => bus.push(addActionId(action)), actions || [])
  bus.push(startAsyncRecord(id))
}

const wrapAsyncElement = (createElement, args) => (data) => (
  R.merge(data, {
    element: createElement(...args)
  })
)

const wrapAsyncRender = (render) => (data) => (
  R.merge(data, {
    html: render(data.element)
  })
)

const renderAsyncElementToHtml = (render, createAsyncActions, createElement, stores) => (...args) => {
  const asyncRenderId = generateActionId()
  const ret = combineStoreChanges(stores)
    // hold unitl the actions dispatched and stores updated.
    .filter(isAsyncRender(asyncRenderId))
    // create component element.
    .map(wrapAsyncElement(createElement, args))
    // render the element.
    .map(wrapAsyncRender(render))
    // return html string or stream.
    .map(R.prop('html'))
    .first()

  // create asynchronous actions.
  createAsyncActions(...args)
    .first()
    // dispatch the asynchronous actions.
    .onValue(pushActions(asyncRenderId))

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
