import R from 'ramda';
import Bacon from 'baconjs';
import ActionTypes from './action-types';
import StoreNames from '../stores/store-names';
import Common from '../utils/common-util';
import { bindToDispatch } from 'bdux';

const recordStream = new Bacon.Bus();

const isNotIsomorphicStore = R.complement(
  R.propEq('name', StoreNames.ISOMORPHIC)
);

const isNotIsomorphicAction = R.pipe(
  R.path(['action', 'type']),
  R.flip(R.contains)([
    ActionTypes.ISOMORPHIC_RECORDS,
    ActionTypes.ISOMORPHIC_INIT
  ]),
  R.not
);

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

const loadStates = () => {
  let element = document.getElementById('isomorphic');
  return (element && JSON.parse(element.innerHTML)) || [];
};

const mapInitRecords = (records) => (
  (new Bacon.Bus()).startWith({
    type: ActionTypes.ISOMORPHIC_INIT,
    records: records
  })
  .first()
);

const recordsProperty = recordStream
  .scan([], accumRecords);

const createInit = R.pipe(
  loadStates,
  mapInitRecords
);

const createStartStream = () => (
  // create an action when records change.
  Bacon.combineTemplate({
    type: ActionTypes.ISOMORPHIC_RECORDS,
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

export const resume = R.ifElse(
  Common.canUseDOM,
  createInit,
  R.F
);

export const record = R.ifElse(
  // dont record isomorphic related store state.
  R.allPass([isNotIsomorphicAction, isNotIsomorphicStore]),
  // record the store state.
  pushRecord,
  R.F
);

export default bindToDispatch({
  start,
  resume,
  record
});
