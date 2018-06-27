import * as R from 'ramda'
import Bacon from 'baconjs'
import ActionTypes from '../actions/action-types'
import StoreNames from '../stores/store-names'
import { startAsyncRender } from '../actions/universal-action'
import { createStore } from 'bdux'

const isAction = R.pathEq(
  ['action', 'type']
)

const isRecord = isAction(
  ActionTypes.UNIVERSAL_RECORD
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

const removePrevRecord = (record, records) => (
  R.reject(
    R.propEq('name', record.name),
    records || []
  )
)

const appendRecord = ({ state, action }) => (
  // append to the array of records.
  R.append(
    // get the new record.
    action.record,
    // remove the existing record.
    removePrevRecord(
      action.record,
      state && state.records
    )
  )
)

const accumRecords = R.when(
  isRecord,
  mergeState('records',
    appendRecord)
)

const setAsyncRenderId = R.when(
  isStartAsyncRender,
  mergeState('asyncRenderId',
    R.path(['action', 'asyncRenderId']))
)

const dispatch = (createAction) => R.converge(
  R.call, [
    R.prop('dispatch'),
    createAction
  ]
)

const createAsyncRender = R.when(
  isStartAsyncRecord,
  dispatch(
    R.pipe(
      R.path(['action', 'asyncRenderId']),
      startAsyncRender
    )
  )
)

export const getReducer = () => {
  const reducerStream = new Bacon.Bus()

  return {
    input: reducerStream,
    output: reducerStream
      .map(accumRecords)
      .map(setAsyncRenderId)
      .doAction(createAsyncRender)
      .map(R.prop('state'))
  }
}

export default createStore(
  StoreNames.UNIVERSAL, getReducer
)
