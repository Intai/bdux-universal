/* eslint-env mocha */

import chai from 'chai'
import sinon from 'sinon'
import Common, {
  canUseDOM } from './common-util'

describe('Common Utilities', () => {

  it('should not be able to use dom when there is no window', () => {
    global.window = undefined
    chai.expect(canUseDOM()).to.not.be.ok
  })

  it('should not be able to use dom when there is no document', () => {
    global.window = { document: undefined }
    chai.expect(canUseDOM()).to.not.be.ok
  })

  it('should not be able to use dom when there is no function to create element', () => {
    global.window = { document: { createElement: undefined }}
    chai.expect(canUseDOM()).to.not.be.ok
  })

  it('should be able to use dom when there is function to create element', () => {
    global.window = { document: { createElement: () => {} }}
    chai.expect(canUseDOM()).to.be.ok
  })

  it('should generate an object of constants', () => {
    const storeNames = Common.createObjOfConsts(['UNIVERSAL'])
    chai.expect(storeNames).to.eql({
      UNIVERSAL: 'BDUXIS_UNIVERSAL'
    })
  })

})
