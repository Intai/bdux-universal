import * as R from 'ramda'
import Bacon from 'baconjs'
import UniversalStore from './stores/universal-store'
import { renderToString, renderToNodeStream } from 'react-dom/server'
import { getActionStream } from 'bdux'

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

const mergeArgs = (args) => (actions) => ({
  args,
  actions
})

const combineStoreChanges = (stores) => (
  Bacon.combineTemplate(
    R.map(
      store => store.getProperty().changes(),
      R.merge(stores || {}, {
        universal: UniversalStore
      })
    )
  )
)

const pushActions = (data) => {
  if (data.actions && data.actions.length > 0) {
    const bus = getActionStream()
    R.forEach(action => bus.push(action), data.actions)
  } else {
    getActionStream().push({})
  }
}

const wrapAsyncElement = (createElement) => (data) => (
  R.merge(data, {
    element: createElement(...data.args)
  })
)

const wrapAsyncRender = (render) => (data) => (
  R.merge(data, {
    html: render(data.element)
  })
)

const renderAsyncElementToHtml = (render, createAsyncActions, createElement, stores) => (...args) => {
  const actionsValve = combineStoreChanges(stores)
    .map(R.F)
    .startWith(true)

  // create asynchronous actions.
  return createAsyncActions(...args)
    .map(mergeArgs(args))
    // dispatch the asynchronous actions.
    .doAction(pushActions)
    // hold unitl the actions dispatched.
    .holdWhen(actionsValve)
    // create component element.
    .map(wrapAsyncElement(createElement))
    // render the element.
    .map(wrapAsyncRender(render))
    // return html string or stream.
    .map(R.prop('html'))
    .first()
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
