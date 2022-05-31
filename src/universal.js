import {
  find,
  propEq,
  propOr,
} from 'ramda'
import { Bus } from 'baconjs'
import Common from './utils/common-util'
import { record } from './actions/universal-action'
import { loadStates } from './actions/universal-action'

const findRecordToStartWith = (name) => (
  propOr(null, 'nextState',
    find(propEq('name', name), loadStates())
  )
)

export const getPostReduce = ({ bindToDispatch }) => {
  const postStream = new Bus()

  return {
    input: postStream,
    output: postStream
      // record store states.
      .doAction(bindToDispatch(record))
  }
}

export const getDefaultValue = (name, prev) => (
  Common.canUseDOM()
    ? (findRecordToStartWith(name) || prev)
    : prev
)
