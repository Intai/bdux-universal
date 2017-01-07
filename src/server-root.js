import R from 'ramda'
import Bacon from 'baconjs'
import UniversalStore from './stores/universal-store'
import { renderToString } from 'react-dom/server'
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

const wrapStores = (stores, render, ...args) => {
  // activate stores before rendering.
  const dispose = activateStores(R.merge(stores, {
    universal: UniversalStore
  }))

  // render to html.
  const html = R.apply(render, args)
  // dipose store subscriptions.
  dispose()

  return html
}

const renderElement = (createElement, stores) => R.partial(
  wrapStores, [
    stores,
    R.pipe(
      // create component element.
      createElement,
      // render the element.
      renderToString
    )
  ]
)

const pushActions = (args, actions) => {
  getActionStream().plug(Bacon.fromArray(actions))
  return args
}

const renderAsyncElement = (createElement, stores) => R.curryN(2, R.partial(
  wrapStores, [
    stores,
    R.pipe(
      // dispatch asynchronous actions.
      pushActions,
      // create component element.
      R.apply(createElement),
      // render the element.
      renderToString
    )
  ]
))

const mapAsyncToString = (asyncStream, renderElement) => (
  asyncStream
    .map(renderElement)
    .first()
)

export const createRoot = (createElement, stores = {}) => ({
  renderToString:
    // create and render the element.
    renderElement(createElement, stores)
})

export const createAsyncRoot = (createAsyncActions, createElement, stores = {}) => ({
  renderToString: R.converge(
    // map to html string.
    mapAsyncToString, [
      // create asynchronous actions.
      createAsyncActions,
      // arguments to an array.
      R.unapply(
        // dispatch the actions and render the element.
        renderAsyncElement(createElement, stores)
      )
    ]
  )
})
