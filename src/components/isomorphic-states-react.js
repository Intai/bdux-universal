import R from 'ramda';
import React from 'react';
import IsomorphicStore from '../stores/isomorphic-store';
import { createComponent } from 'bdux'

const hasRecords = R.allPass([
  R.is(Object),
  R.propIs(Array, 'records')
]);

const stringifyRecords = (states) => (
  JSON.stringify(states.records)
);

const renderStates = R.when(
  hasRecords,
  stringifyRecords
);

export const IsomorphicStates = ({ states }) => (
  <script id="isomorphic" type="application/json"
    dangerouslySetInnerHTML={{ __html: renderStates(states) }}>
  </script>
);

export default createComponent(IsomorphicStates, {
  states: IsomorphicStore
});
