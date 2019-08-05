import {
  allPass,
  always,
  ifElse,
  is,
  pipe,
  propIs,
} from 'ramda'
import React from 'react'
import Common from '../utils/common-util'
import UniversalStore from '../stores/universal-store'
import { loadStates } from '../actions/universal-action'
import { createUseBdux } from 'bdux'

const canUseDOM = () => (
  Common.canUseDOM()
)

const hasRecords = allPass([
  is(Object),
  propIs(Array, 'records')
])

const stringifyRecords = (states) => (
  JSON.stringify(states.records)
)

const stringifyStatesInDOM = ifElse(
  canUseDOM,
  pipe(loadStates, JSON.stringify),
  always('[]')
)

const renderStates = ifElse(
  hasRecords,
  stringifyRecords,
  stringifyStatesInDOM
)

const useBdux = createUseBdux({
  states: UniversalStore
})

/* eslint-disable react/no-danger */
export const UniversalStates = (props) => {
  const { state } = useBdux(props)
  return (
    <script id="universal" type="application/json"
      dangerouslySetInnerHTML={{ __html: renderStates(state.states) }}>
    </script>
  )
}

export default UniversalStates
