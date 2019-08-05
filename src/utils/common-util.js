import {
  once,
  reduce,
} from 'ramda'

const PREFIX = 'BDUXIS'

export const canUseDOM = () => (
  typeof window !== 'undefined'
    && window.document
    && window.document.createElement
)

const mapToKeyValue = (obj, key) => {
  obj[key] = PREFIX + '_' + key
  return obj
}

export default {

  canUseDOM: once(canUseDOM),

  // map an array of strings to
  // object keys and prefixed values.
  createObjOfConsts: (values) => reduce(
    mapToKeyValue, {}, values
  )
}
