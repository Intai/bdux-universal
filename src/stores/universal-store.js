import {
  append,
  assocPath,
  path,
  pathEq,
  pipe,
  prop,
  propEq,
  reject,
  when,
} from 'ramda'
import * as Bacon from 'baconjs'
import ActionTypes from '../actions/action-types'
import StoreNames from '../stores/store-names'
import { startAsyncRender } from '../actions/universal-action'
import { createStore } from 'bdux'

const isAction = pathEq(
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

const mergeState = (name, func) => (args) => (
  assocPath(['state', name], func(args), args)
)

const removePrevRecord = (record, records) => (
  reject(
    propEq('name', record.name),
    records || []
  )
)

const appendRecord = ({ state, action }) => (
  // append to the array of records.
  append(
    // get the new record.
    action.record,
    // remove the existing record.
    removePrevRecord(
      action.record,
      state && state.records
    )
  )
)

const accumRecords = when(
  isRecord,
  mergeState('records',
    appendRecord)
)

const setAsyncRenderId = when(
  isStartAsyncRender,
  mergeState('asyncRenderId',
    path(['action', 'asyncRenderId']))
)

const dispatch = (createAction) => (args) => (
  args.dispatch(createAction(args))
)

const createAsyncRender = when(
  isStartAsyncRecord,
  dispatch(
    pipe(
      path(['action', 'asyncRenderId']),
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
      .map(prop('state'))
  }
}

export default createStore(
  StoreNames.UNIVERSAL, getReducer
)
