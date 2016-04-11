import R from 'ramda';
import Bacon from 'baconjs';
import ActionTypes from '../actions/action-types';
import StoreNames from '../stores/store-names';
import { createStore } from 'bdux';

const isRecords =  R.pathEq(
  ['action', 'type'], ActionTypes.ISOMORPHIC_RECORDS
);

const mergeState = (name, func) => (
  R.converge(R.mergeWith(R.merge), [
    R.identity,
    R.pipe(
      func,
      R.objOf(name),
      R.objOf('state')
    )
  ])
);

const getRecords = R.when(
  isRecords,
  mergeState('records',
    R.path(['action', 'records']))
);

const getOutputStream = (reducerStream) => (
  reducerStream
    .map(getRecords)
    .map(R.prop('state'))
);

export const getReducer = () => {
  let reducerStream = new Bacon.Bus();

  return {
    input: reducerStream,
    output: getOutputStream(reducerStream)
  };
};

export default createStore(
  StoreNames.ISOMORPHIC, getReducer
);
