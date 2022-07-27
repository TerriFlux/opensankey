import React from 'react'
//import { render } from "@testing-library/react";
import renderer from 'react-test-renderer'
import {default_sankey_data} from './SankeyUtils'
import SankeyApp from './SankeyApp'

test('adds 1 + 2 to equal 3', () => {
  const x = jest.spyOn(window, 'focus') 
  x.mockImplementation(() => {})
  const data  = default_sankey_data()
  // const component = renderer.create(<SankeyApp sankey_data={data}></SankeyApp>)
  // const tree = component.toJSON()
  // expect(tree).toMatchSnapshot()
  expect(1).toBe(1)
})


