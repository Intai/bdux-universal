import * as R from 'ramda'
import Bacon from 'baconjs'
import ActionTypes from '../actions/action-types'
import StoreNames from '../stores/store-names'
import UniversalAction from '../actions/universal-action'
import { createStore } from 'bdux'

const isAction = R.pathEq(
  ['action', 'type']
)

const isRecords = isAction(
  ActionTypes.UNIVERSAL_RECORDS
)

const isStartAsyncRender = isAction(
  ActionTypes.UNIVERSAL_ASYNC_RENDER
)

const isStartAsyncRecord = isAction(
  ActionTypes.UNIVERSAL_ASYNC_RECORD
)

const mergeState = (name, func) => (
  R.converge(R.mergeWith(R.merge), [
    R.identity,
    R.pipe(
      func,
      R.objOf(name),
      R.objOf('state')
    )
  ])
)

const getRecords = R.when(
  isRecords,
  mergeState('records',
    R.path(['action', 'records']))
)

const setAsyncRenderId = R.when(
  isStartAsyncRender,
  mergeState('asyncRenderId',
    R.path(['action', 'asyncRenderId']))
)

const createAsyncRender = R.when(
  isStartAsyncRecord,
  R.pipe(
    R.path(['action', 'asyncRenderId']),
    UniversalAction.startAsyncRender
  )
)

const getOutputStream = (reducerStream) => (
  reducerStream
    .map(getRecords)
    .map(setAsyncRenderId)
    .doAction(createAsyncRender)
    .map(R.prop('state'))
)

export const getReducer = () => {
  const reducerStream = new Bacon.Bus()

  return {
    input: reducerStream,
    output: getOutputStream(reducerStream)
  }
}

export default createStore(
  StoreNames.UNIVERSAL, getReducer
)
