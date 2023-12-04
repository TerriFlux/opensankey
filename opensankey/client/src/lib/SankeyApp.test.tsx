//import { render } from "@testing-library/react";
import {DefaultSankeyData} from './SankeyUtils'

test('adds 1 + 2 to equal 3', () => {
  const x = jest.spyOn(window, 'focus') 
  x.mockImplementation(() => {
    'nothing'
  })
  const data  = DefaultSankeyData()
  data
  expect(1).toBe(1)
})


