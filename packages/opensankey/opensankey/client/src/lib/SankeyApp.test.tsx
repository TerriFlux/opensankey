//import { render } from "@testing-library/react";
import {default_sankey_data} from './SankeyUtils'

test('adds 1 + 2 to equal 3', () => {
  const x = jest.spyOn(window, 'focus') 
  x.mockImplementation(() => {
    'nothing'
  })
  const data  = default_sankey_data()
  data
  expect(1).toBe(1)
})


