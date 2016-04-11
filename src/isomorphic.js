import R from 'ramda';
import Bacon from 'baconjs';
import Common from './utils/common-util';
import StoreNames from './stores/store-names';
import ActionTypes from './actions/action-types';
import IsomorphicAction from './actions/isomorphic-action';
import { loadStates } from './actions/isomorphic-action';

const findRecordByName = (name, records) => (
  R.find(R.propEq('name', name), records || [])
);

const getPostOutputStream = (postStream) => (
  postStream
    // record store states.
    .doAction(IsomorphicAction.record)
);

const findRecordToStartWith = R.converge(
  findRecordByName, [
    R.nthArg(0),
    loadStates
  ]
);

const addStartWithRecord = (record, outputStream) => (
  (record)
    ? outputStream.startWith(record)
    : outputStream
);

const addStartWithToOutput = R.converge(
  // start with the state from server.
  addStartWithRecord, [
    // find the associated state from server.
    findRecordToStartWith,
    // get the base output stream.
    R.nthArg(1)
  ]
);

const startWithResumeState = R.ifElse(
  // when on client.
  Common.canUseDOM,
  // add bacon startWith to the base output stream.
  addStartWithToOutput,
  // otherwise simply the base output stream.
  R.nthArg(1)
);

const getPostOutput = R.converge(
  // setup a initial value.
  startWithResumeState, [
    // get the store name.
    R.nthArg(0),
    // get the base output stream.
    R.pipe(R.nthArg(1), getPostOutputStream)
  ]
);

export const getPostReduce = (name) => {
  let postStream = new Bacon.Bus();

  // start recording on server.
  IsomorphicAction.start();

  return {
    input: postStream,
    output: getPostOutput(name, postStream)
  };
};
