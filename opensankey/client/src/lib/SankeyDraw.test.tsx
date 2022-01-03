import React from 'react'
import { render } from "@testing-library/react";
//import renderer from 'react-test-renderer';
import {default_sankey_data, getLinkValue} from './SankeyUtils'
import SankeyDraw,{SankeyDrawDefaultProps} from './SankeyDraw'
import { SankeyData, SankeyLink, SankeyNode } from './types';
import { convert_data } from './SankeyConvert';
import new_data from 'mfa-data/SyntheticAFMSankey/sankey/pommes_poires.json'
import { compute_auto_sankey } from './SankeyLayout';

beforeEach(() => {
  (window.SVGElement.prototype as any).getComputedTextLength = () => 200;
});

test('adds 1 + 2 to equal 3', () => {
  let x = jest.spyOn(window, 'focus') 
  x.mockImplementation(() => {})
  //let data : SankeyData = default_sankey_data()
  // fetch("./test2.json")
  //   .then(response => response.json())
  //   .then(new_data => {
  //data = Object.assign(data,new_data)
  convert_data(new_data as any)
  compute_auto_sankey(new_data as any,200)
  console.log(new_data)
    //   })
    // .catch( ()=>
    //   expect(1).toBe(2)
    // )
  
  // const tree = render(
  //   <SankeyDraw 
  //     data={(new_data as unknown) as SankeyData}
  //     link_text={(l:SankeyLink) => getLinkValue((new_data as unknown) as SankeyData,l.idLink).value}
  //     test_link_value= {(nodes: { [node_id: string]: SankeyNode }, l: SankeyLink) => getLinkValue((new_data as unknown) as SankeyData,l.idLink).value}
  //     {...SankeyDrawDefaultProps}
  //   />
  // )
  const component = render(
    <SankeyDraw 
      data={(new_data as unknown) as SankeyData}
      link_text={(l:SankeyLink) => 'tutu'}
      test_link_value= {(nodes: { [node_id: string]: SankeyNode }, l: SankeyLink) => 10}
      {...SankeyDrawDefaultProps}
    />
  )
  let tree = component.container
  expect(tree).toMatchSnapshot()
});


