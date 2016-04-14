import chai from 'chai';
import sinon from 'sinon';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import { IsomorphicStates } from './isomorphic-states-react';

const render = () => {
  let renderer = TestUtils.createRenderer();
  renderer.render(<IsomorphicStates />);
  return renderer.getRenderOutput();
};

describe('IsomorphicStates Component', () => {

  it('should have id', () => {
    let output = render();
    chai.expect(output.props.id).to.equal('isomorphic');
  });

});
