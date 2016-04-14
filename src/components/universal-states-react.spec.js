import chai from 'chai';
import sinon from 'sinon';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import { UniversalStates } from './universal-states-react';

const render = () => {
  let renderer = TestUtils.createRenderer();
  renderer.render(<UniversalStates />);
  return renderer.getRenderOutput();
};

describe('UniversalStates Component', () => {

  it('should have id', () => {
    let output = render();
    chai.expect(output.props.id).to.equal('universal');
  });

});
