import R from 'ramda'
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
  // dipose store subscriptions.
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

const pushActions = (args, actions) => {
  getActionStream().plug(Bacon.fromArray(actions))
  return args
 }

const renderAsyncElement = (render, createElement, stores) => R.curryN(2, wrapStores(
  R.pipe(
    // dispatch asynchronous actions.
    pushActions,
    // create component element.
    R.apply(createElement),
    // render the element.
    render
  ),
  stores
))

const mapAsyncToHtml = (asyncStream, renderElement) => (
  asyncStream
    .map(renderElement)
    .first()
)

const renderAsyncElementToHtml = (render, createAsyncActions, createElement, stores) => R.converge(
  // map to html string or stream.
  mapAsyncToHtml, [
    // create asynchronous actions.
    createAsyncActions,
    // arguments to an array.
    R.unapply(
      // dispatch the actions and render the element.
      renderAsyncElement(render, createElement, stores)
    )
  ]
)

export const createRoot = (...args) => ({
  // create and render the element.
  renderToString: renderElement(renderToString, ...args),
  renderToNodeStream: renderElement(renderToNodeStream, ...args)
})

export const createAsyncRoot = (...args) => ({
  renderToString: renderAsyncElementToHtml(renderToString, ...args),
  renderToNodeStream: renderAsyncElementToHtml(renderToNodeStream, ...args)
})
