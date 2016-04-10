import R from 'ramda';

const PREFIX = 'IS';

const mapToKeyValue = (obj, key) => {
  obj[key] = PREFIX + '_' + key;
  return obj
};

export default {

  canUseDOM: R.once(() => (
    typeof window !== 'undefined'
      && window.document
      && window.document.createElement
  )),

  // map an array of strings to
  // object keys and prefixed values.
  createObjOfConsts: R.reduce(
    mapToKeyValue, {}
  )
};
