import R from 'ramda'
import React from 'react'
import Common from '../utils/common-util'
import UniversalStore from '../stores/universal-store'
import { loadStates } from '../actions/universal-action'
import { createComponent } from 'bdux'

const canUseDOM = () => (
  Common.canUseDOM()
)

const hasRecords = R.allPass([
  R.is(Object),
  R.propIs(Array, 'records')
])

const stringifyRecords = (states) => (
  JSON.stringify(states.records)
)

const stringifyStatesInDOM = R.ifElse(
  canUseDOM,
  R.pipe(loadStates, JSON.stringify),
  R.always('[]')
)

const renderStates = R.ifElse(
  hasRecords,
  stringifyRecords,
  stringifyStatesInDOM
)

/* eslint-disable react/no-danger */
export const UniversalStates = ({ states }) => (
  <script id="universal" type="application/json"
    dangerouslySetInnerHTML={{ __html: renderStates(states) }}>
  </script>
)

export default createComponent(UniversalStates, {
  states: UniversalStore
})
