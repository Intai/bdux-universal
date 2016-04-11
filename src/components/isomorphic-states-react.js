import R from 'ramda';
import React from 'react';
import Common from '../utils/common-util';
import IsomorphicStore from '../stores/isomorphic-store';
import { loadStates } from '../actions/isomorphic-action';
import { createComponent } from 'bdux'

const hasRecords = R.allPass([
  R.is(Object),
  R.propIs(Array, 'records')
]);

const stringifyRecords = (states) => (
  JSON.stringify(states.records)
);

const stringifyStatesInDOM = R.ifElse(
  Common.canUseDOM,
  R.pipe(loadStates, JSON.stringify),
  R.always('[]')
);

const renderStates = R.ifElse(
  hasRecords,
  stringifyRecords,
  stringifyStatesInDOM
);

export const IsomorphicStates = ({ states }) => (
  <script id="isomorphic" type="application/json"
    dangerouslySetInnerHTML={{ __html: renderStates(states) }}>
  </script>
);

export default createComponent(IsomorphicStates, {
  states: IsomorphicStore
});
