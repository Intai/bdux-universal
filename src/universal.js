import R from 'ramda'
import Bacon from 'baconjs'
import Common from './utils/common-util'
import UniversalAction from './actions/universal-action'
import { loadStates } from './actions/universal-action'

const canUseDOM = () => (
  Common.canUseDOM()
)

const findRecordByName = (name, records) => (
  R.find(R.propEq('name', name), records)
)

const getPostRecordStream = (postStream) => (
  postStream
    // record store states.
    .doAction(UniversalAction.record)
)

const findRecordToStartWith = R.converge(
  findRecordByName, [
    R.nthArg(0),
    loadStates
  ]
)

const addStartWithRecord = (record, outputStream) => (
  (record)
    ? outputStream.startWith(record)
    : outputStream
)

const once = (func) => {
  let count = 0
  return (args) => (
    (count++ <= 0)
      ? func(args)
      : args
  )
}

const mapRecordStateOnce = (record) => once(R.when(
  R.propEq('state', null),
  R.flip(R.merge)({
    state: record.nextState
  })
))

const mapRecordState = (record, outputStream) => (
  (record)
    ? outputStream.map(mapRecordStateOnce(record))
    : outputStream
)

const mapRecordStateToOutput = R.converge(
  // map to the state from server.
  mapRecordState, [
    // find the associated state from server.
    findRecordToStartWith,
    // get the input stream.
    R.nthArg(1)
  ]
)

const mapResumeState = R.ifElse(
  // when on client.
  canUseDOM,
  // map the output stream to resume.
  mapRecordStateToOutput,
  // otherwise simply the input stream.
  R.nthArg(1)
)

const addStartWithToOutput = R.converge(
  // start with the state from server.
  addStartWithRecord, [
    // find the associated state from server.
    findRecordToStartWith,
    // get the base output stream.
    R.nthArg(1)
  ]
)

const startWithResumeState = R.ifElse(
  // when on client.
  canUseDOM,
  // add bacon startWith to the base output stream.
  addStartWithToOutput,
  // otherwise simply the base output stream.
  R.nthArg(1)
)

const getPostOutput = R.converge(
  // setup a initial value.
  startWithResumeState, [
    // get the store name.
    R.nthArg(0),
    // get the base output stream.
    R.pipe(R.nthArg(1), getPostRecordStream)
  ]
)

export const getPreReduce = (name) => {
  const preStream = new Bacon.Bus()

  return {
    input: preStream,
    output: mapResumeState(name, preStream)
  }
}

export const getPostReduce = (name) => {
  const postStream = new Bacon.Bus()

  // start recording on server.
  UniversalAction.start()

  return {
    input: postStream,
    output: getPostOutput(name, postStream)
  }
}
