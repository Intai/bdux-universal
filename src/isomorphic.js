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

const mapIsomorphicStates = R.converge(
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
  mapIsomorphicStates
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

export const getPostReduce = () => {
  let postStream = new Bacon.Bus();

  // start recording on server.
  IsomorphicAction.start();

  return {
    input: postStream,
    output: postStream
      // record store states.
      .doAction(IsomorphicAction.record)
  };
};
