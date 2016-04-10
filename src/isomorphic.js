import R from 'ramda';
import Bacon from 'baconjs';
import ActionTypes from './actions/action-types';
import IsomorphicAction from './actions/isomorphic-action';

const isInit = R.pathEq(
  ['action', 'type'],
  ActionTypes.ISOMORPHIC_INIT
);

const findRecordByName = (name, records) => (
  R.find(R.propEq('name', name), records)
);

const findRecord = R.converge(
  findRecordByName, [
    R.prop('name'),
    R.path(['action', 'records'])
  ]
);

const getRecord = R.converge(
  R.merge, [
    R.identity,
    R.pipe(findRecord, R.defaultTo({}))
  ]
);

const mapIsomorphicInit = R.when(
  isInit,
  getRecord
);

export const getPostReduce = () => {
  let postStream = new Bacon.Bus();

  // start recording on server.
  IsomorphicAction.start();
  // resume on client.
  IsomorphicAction.resume();

  return {
    input: postStream,
    output: postStream
      // record store states.
      .doAction(IsomorphicAction.record)
      // handle init action.
      .map(mapIsomorphicInit)
  };
};
