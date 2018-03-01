import * as R from 'ramda'
import Bacon from 'baconjs'
import ActionTypes from './action-types'
import StoreNames from '../stores/store-names'
import Common from '../utils/common-util'
import { bindToDispatch } from 'bdux'

const recordStream = new Bacon.Bus()

const canUseDOM = () => (
  Common.canUseDOM()
)

const parseJson = (json) => {
  try {
    return JSON.parse(json)
  } catch (e) {
    // continue regardless of error.
  }
}

const isNotUniversalStore = R.complement(
  R.propEq('name', StoreNames.UNIVERSAL)
)

const isNotUniversalAction = R.complement(
  R.pathEq(['action', 'type'], ActionTypes.UNIVERSAL_RECORDS)
)

const shouldRecord = R.allPass([
  R.complement(canUseDOM),
  isNotUniversalAction,
  isNotUniversalStore
])

const pushRecord = (record) => {
  recordStream.push(record)
}

const cleanRecord = R.pipe(
  R.nthArg(1),
  R.pick(['name', 'nextState'])
)

const removePrevRecord = (records, record) => (
  R.reject(R.propEq('name', record.name), records)
)

const accumRecords = R.converge(
  // append to the array of records.
  R.append, [
    // get the new record.
    cleanRecord,
    // remove the existing record.
    removePrevRecord
  ]
)

const onceThenNull = (func) => {
  let count = 0
  return () => (
    (count++ <= 0)
      ? func()
      : null
  )
}

const createStartStream = () => (
  // create an action when records change.
  Bacon.combineTemplate({
    type: ActionTypes.UNIVERSAL_RECORDS,
    records: recordStream.scan([], accumRecords),
    skipLog: true
  })
  .changes()
)

const createLoadStates = () => (
  R.once(() => {
    // states recorded on server side.
    let element = document.getElementById('universal')
    return (element && parseJson(element.innerHTML)) || []
  })
)

let loadStatesOnce = createLoadStates()

export const start = R.ifElse(
  // only start recording in browser.
  R.complement(canUseDOM),
  // create a stream to dispatch records of store states.
  createStartStream,
  R.F
)

export const record = R.ifElse(
  // dont record universal related store state.
  shouldRecord,
  // record the store state.
  pushRecord,
  R.F
)

export const loadStates = () => (
  loadStatesOnce()
)

export const reloadStates = () => {
  loadStatesOnce = createLoadStates()
  return loadStatesOnce()
}

export default bindToDispatch({
  // start only once.
  start: onceThenNull(start),
  record
})
