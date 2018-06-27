import * as R from 'ramda'
import ActionTypes from './action-types'
import StoreNames from '../stores/store-names'
import Common from '../utils/common-util'

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
  R.pipe(
    R.path(['action', 'type']),
    R.flip(R.contains)([
      ActionTypes.UNIVERSAL_RECORD,
      ActionTypes.UNIVERSAL_ASYNC_RECORD,
      ActionTypes.UNIVERSAL_ASYNC_RENDER
    ])
  )
)

const shouldRecord = R.allPass([
  R.complement(canUseDOM),
  isNotUniversalAction,
  isNotUniversalStore
])

const cleanRecord = R.pick(
  ['name', 'nextState']
)

const createRecord = (record) => ({
  type: ActionTypes.UNIVERSAL_RECORD,
  record: cleanRecord(record),
  skipLog: true
})

export const record = R.ifElse(
  // dont record universal related store state.
  shouldRecord,
  // record the store state.
  createRecord,
  R.F
)

const createLoadStates = () => (
  R.once(() => {
    // states recorded on server side.
    const element = document.getElementById('universal')
    return (element && parseJson(element.innerHTML)) || []
  })
)

let loadStatesOnce = createLoadStates()

export const hasUniversalStates = () => (
  Common.canUseDOM() && !!document.getElementById('universal')
)

export const loadStates = () => (
  loadStatesOnce()
)

export const reloadStates = () => {
  loadStatesOnce = createLoadStates()
  return loadStatesOnce()
}

export const startAsyncRecord = (id) => ({
  type: ActionTypes.UNIVERSAL_ASYNC_RECORD,
  asyncRenderId: id,
  skipLog: true
})

export const startAsyncRender = (id) => ({
  type: ActionTypes.UNIVERSAL_ASYNC_RENDER,
  asyncRenderId: id,
  skipLog: true
})
