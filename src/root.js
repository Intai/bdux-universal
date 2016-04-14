import R from 'ramda';
import UniversalStore from './stores/universal-store';
import { renderToString } from 'react-dom/server';

const subscribe = (store) => (
  // subscribe to a store.
  store.getProperty().onValue()
);

const pipeFuncs = R.ifElse(
  R.isEmpty,
  R.always(),
  R.apply(R.pipe)
);

const activateStores = R.pipe(
  // subscribe to stores.
  R.map(subscribe),
  // get the array of dispose functions.
  R.values,
  // pipe all dispose functions.
  pipeFuncs
);

const wrapStores = (stores, render, ...args) => {
  // activate stores before rendering.
  let dispose = activateStores(R.merge(stores, {
    universal: UniversalStore
  }));

  // render to html.
  let html = R.apply(render, args);
  // dipose store subscriptions.
  dispose();

  return html;
};

export const createRoot = (createElement, stores = {}) => ({
  renderToString: R.wrap(
    R.pipe(
      // create component element.
      createElement,
      // render to a string.
      renderToString
    ),
    // activate stores before rendering.
    R.partial(wrapStores, [stores])
  )
});
