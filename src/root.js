import R from 'ramda';
import Bacon from 'baconjs';
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

const renderObservable = (observable) => (
  observable.first()
    .map(renderToString)
);

const renderElement = R.ifElse(
  R.is(Bacon.Observable),
  // render the first value to a string.
  renderObservable,
  // render to a string.
  renderToString
);

const doActionDispose = (observable, dispose) => (
  observable.doAction(dispose)
);

const doAction = R.ifElse(
  R.is(Bacon.Observable),
  // dispose as side effect of the stream.
  doActionDispose,
  // call dispose function.
  R.pipe(R.nthArg(1), R.call)
);

const wrapStores = (stores, render, ...args) => {
  // activate stores before rendering.
  let dispose = activateStores(R.merge(stores, {
    universal: UniversalStore
  }));

  // render to html.
  let html = R.apply(render, args);
  // dipose store subscriptions.
  doAction(html, dispose)

  return html;
};

export const createRoot = (createElement, stores = {}) => ({
  renderToString: R.wrap(
    R.pipe(
      // create component element.
      createElement,
      // render the element.
      renderElement
    ),
    // activate stores before rendering.
    R.partial(wrapStores, [stores])
  )
});
