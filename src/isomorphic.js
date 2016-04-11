import R from 'ramda';
import Bacon from 'baconjs';
import Common from './utils/common-util';
import ActionTypes from './actions/action-types';
import IsomorphicAction from './actions/isomorphic-action';
import { loadStates } from './actions/isomorphic-action';

const findRecordByName = (name, records) => (
  R.find(R.propEq('name', name), records || [])
);

const findRecord = R.converge(
  findRecordByName, [
    R.prop('name'),
    loadStates
  ]
);

const mergeState = (args, record) => (
  (record)
    ? R.merge(args, { state: record.nextState })
    : args
);

const mergeStates = R.converge(
  mergeState, [
    R.identity,
    findRecord
  ]
);

const shouldResume = R.allPass([
  // only on client.
  Common.canUseDOM,
  // there is no state yet.
  R.pipe(R.prop('state'), R.isNil),
  // there are states from server.
  R.pipe(loadStates, R.isEmpty, R.not)
]);

const mapResumeState = R.when(
  shouldResume,
  mergeStates
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
  addStartWithRecord, [
    findRecordToStartWith,
    R.nthArg(1)
  ]
);

const startWithResumeState = R.ifElse(
  Common.canUseDOM,
  addStartWithToOutput,
  R.nthArg(1)
);

const getPostOutput = R.converge(
  startWithResumeState, [
    R.nthArg(0),
    R.pipe(R.nthArg(1), getPostOutputStream)
  ]
);

export const getPreReduce = () => {
  let preStream = new Bacon.Bus();

  return {
    input: preStream,
    output: preStream
      // resume on client.
      .map(mapResumeState)
  };
};

export const getPostReduce = (name) => {
  let postStream = new Bacon.Bus();

  // start recording on server.
  IsomorphicAction.start();

  return {
    input: postStream,
    output: getPostOutput(name, postStream)
  };
};
