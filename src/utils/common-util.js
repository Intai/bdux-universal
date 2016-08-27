import R from 'ramda'

const PREFIX = 'IS'

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

  canUseDOM: R.once(canUseDOM),

  // map an array of strings to
  // object keys and prefixed values.
  createObjOfConsts: (values) => R.reduce(
    mapToKeyValue, {}, values
  )
}
