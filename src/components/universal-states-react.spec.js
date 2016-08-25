import chai from 'chai'
import sinon from 'sinon'
import React from 'react'
import { render, shallow } from 'enzyme'
import { UniversalStates } from './universal-states-react'

describe('UniversalStates Component', () => {

  it('should have id', () => {
    const wrapper = shallow(<UniversalStates />)
    chai.expect(wrapper.props('id')).to.equal('universal')
  })

})
