import R from 'ramda';
import Bacon from 'baconjs';
import ActionTypes from './action-types';
import StoreNames from '../stores/store-names';
import Common from '../utils/common-util';
import { bindToDispatch } from 'bdux';

const recordStream = new Bacon.Bus();

const isNotUniversalStore = R.complement(
  R.propEq('name', StoreNames.UNIVERSAL)
);

const isNotUniversalAction = R.complement(
  R.pathEq(['action', 'type'], ActionTypes.UNIVERSAL_RECORDS)
);

const shouldRecord = R.allPass([
  R.complement(Common.canUseDOM),
  isNotUniversalAction,
  isNotUniversalStore
]);

const pushRecord = (record) => {
  recordStream.push(record);
};

const cleanRecord = R.pipe(
  R.nthArg(1),
  R.pick(['name', 'nextState'])
);

const removePrevRecord = (records, record) => (
  R.reject(R.propEq('name', record.name), records)
);

const accumRecords = R.converge(
  // append to the array of records.
  R.append, [
    // get the new record.
    cleanRecord,
    // remove the existing record.
    removePrevRecord
  ]
);

const onceThenNull = (func) => {
  let count = 0;
  return (...args) => (
    (count++ <= 0)
      ? func.apply(func, args)
      : null
  );
};

const recordsProperty = recordStream
  .scan([], accumRecords);

const createStartStream = () => (
  // create an action when records change.
  Bacon.combineTemplate({
    type: ActionTypes.UNIVERSAL_RECORDS,
    records: recordsProperty,
    skipLog: true
  })
  .changes()
);

// start only once.
export const start = onceThenNull(R.ifElse(
  R.complement(Common.canUseDOM),
  createStartStream,
  R.F
));

export const record = R.ifElse(
  // dont record universal related store state.
  shouldRecord,
  // record the store state.
  pushRecord,
  R.F
);

export const loadStates = R.memoize(() => {
  // states recorded on server side.
  let element = document.getElementById('universal');
  return (element && JSON.parse(element.innerHTML)) || [];
});

export default bindToDispatch({
  start,
  record
});
