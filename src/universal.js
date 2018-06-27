import * as R from 'ramda'
import Bacon from 'baconjs'
import Common from './utils/common-util'
import { record } from './actions/universal-action'
import { loadStates } from './actions/universal-action'

const findRecordByName = (name, records) => (
  R.propOr(
    null,
    'nextState',
    R.find(R.propEq('name', name), records)
  )
)

const findRecordToStartWith = R.converge(
  findRecordByName, [
    R.nthArg(0),
    loadStates
  ]
)

export const getPostReduce = ({ bindToDispatch }) => {
  const postStream = new Bacon.Bus()

  return {
    input: postStream,
    output: postStream
      // record store states.
      .doAction(bindToDispatch(record))
  }
}

export const getDefaultValue = (name, prev) => (
  Common.canUseDOM()
    ? findRecordToStartWith(name)
    : prev
)
