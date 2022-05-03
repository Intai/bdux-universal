/* eslint-env mocha */

import chai from 'chai'
import sinon from 'sinon'
import React from 'react'
import * as Bacon from 'baconjs'
import { JSDOM } from 'jsdom'
import { render } from '@testing-library/react'
import Common from '../utils/common-util'
import { reloadStates } from '../actions/universal-action'
import UniversalStore from '../stores/universal-store'
import { UniversalStates } from './universal-states'

describe('UniversalStates Component', () => {

  let sandbox

  beforeEach(() => {
    const dom = new JSDOM('<html></html>')
    global.window = dom.window
    global.document = dom.window.document
    global.Element = dom.window.Element
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })


  it('should have id', () => {
    const { container } = render(<UniversalStates />)
    chai.expect(container.firstChild.id).to.equal('universal')
  })

  it('should render records', () => {
    sandbox.stub(UniversalStore, 'getProperty')
      .returns(Bacon.constant({ records: [] }))
    const { container } = render(<UniversalStates />)
    const universal = container.firstChild
    chai.expect(universal.innerHTML).to.equal('[]')
  })

  it('should default to an empty array on server', () => {
    sandbox.stub(Common, 'canUseDOM').returns(false)
    sandbox.stub(UniversalStore, 'getProperty')
      .returns(Bacon.constant({}))
    const { container } = render(<UniversalStates />)
    const universal = container.firstChild
    chai.expect(universal.innerHTML).to.equal('[]')
  })

  describe('without universal states', () => {

    beforeEach(() => {
      const dom = new JSDOM('<html></html>')

      global.window = dom.window
      global.document = dom.window.document
      reloadStates()
    })

    it('should default to an empty array in browser', () => {
      sandbox.stub(Common, 'canUseDOM').returns(true)
      sandbox.stub(UniversalStore, 'getProperty')
        .returns(Bacon.constant({}))
      const { container } = render(<UniversalStates />)
      const universal = container.firstChild
      chai.expect(universal.innerHTML).to.equal('[]')
    })

  })

  describe('with universal states', () => {

    beforeEach(() => {
      const dom = new JSDOM(' \
        <script id="universal" type="application/json"> \
          [{"name":"test","nextState":"Message from Server"}] \
        </script>')

      global.window = dom.window
      global.document = dom.window.document
      reloadStates()
    })

    it('should default to the records from server', () => {
      sandbox.stub(Common, 'canUseDOM').returns(true)
      sandbox.stub(UniversalStore, 'getProperty')
        .returns(Bacon.constant({ name: 'test' }))
      const { container } = render(<UniversalStates />)
      const universal = container.firstChild
      chai.expect(universal.innerHTML).to.equal('[{"name":"test","nextState":"Message from Server"}]')
    })

  })

})
