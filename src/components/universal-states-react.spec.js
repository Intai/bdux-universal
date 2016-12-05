/* eslint-env mocha */

import chai from 'chai'
import sinon from 'sinon'
import React from 'react'
import { jsdom } from 'jsdom'
import { shallow } from 'enzyme'
import Common from '../utils/common-util'
import { reloadStates } from '../actions/universal-action'
import { UniversalStates } from './universal-states-react'

describe('UniversalStates Component', () => {

  let sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  it('should have id', () => {
    const wrapper = shallow(<UniversalStates />)
    chai.expect(wrapper.prop('id')).to.equal('universal')
  })

  it('should render records', () => {
    const wrapper = shallow(UniversalStates({ states: { records: [] }}))
    chai.expect(wrapper.prop('dangerouslySetInnerHTML')).to.eql({
      __html: '[]'
    })
  })

  it('should default to an empty array on server', () => {
    sandbox.stub(Common, 'canUseDOM').returns(false)
    const wrapper = shallow(UniversalStates({}))
    chai.expect(wrapper.prop('dangerouslySetInnerHTML')).to.eql({
      __html: '[]'
    })
  })

  describe('without universal states', () => {

    beforeEach(() => {
      const doc = jsdom('<html></html>')

      global.document = doc
      global.window = doc.defaultView
      reloadStates()
    })

    it('should default to an empty array in browser', () => {
      sandbox.stub(Common, 'canUseDOM').returns(true)
      const wrapper = shallow(UniversalStates({}))
      chai.expect(wrapper.prop('dangerouslySetInnerHTML')).to.eql({
        __html: '[]'
      })
    })

  })

  describe('with universal states', () => {

    beforeEach(() => {
      const doc = jsdom(' \
        <script id="universal" type="application/json"> \
          [{"name":"test","nextState":"Message from Server"}] \
        </script>')

      global.document = doc
      global.window = doc.defaultView
      reloadStates()
    })

    it('should default to the records from server', () => {
      sandbox.stub(Common, 'canUseDOM').returns(true)
      const wrapper = shallow(UniversalStates({ states: { name: 'test' }}))
      chai.expect(wrapper.prop('dangerouslySetInnerHTML')).to.eql({
        __html: '[{"name":"test","nextState":"Message from Server"}]'
      })
    })

  })

  afterEach(() => {
    sandbox.restore()
  })

})
