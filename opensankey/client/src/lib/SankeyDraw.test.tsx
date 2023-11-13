/* eslint @typescript-eslint/no-var-requires: "off" */
import React from 'react'
import { render } from '@testing-library/react'
//import renderer from 'react-test-renderer';
//import {default_sankey_data, getLinkValue} from './SankeyUtils'
import SankeyDraw,{SankeyDrawDefaultProps} from './SankeyDraw'
import { SankeyData } from './types'
import { convert_data } from './SankeyConvert'
import { compute_auto_sankey } from './SankeyLayout'
// const fs = require('fs')
import fs from 'fs'
// const path = require('path')
import path from 'path'
beforeEach(() => {
  (window.SVGElement.prototype as SVGTextContentElement).getComputedTextLength = () => 200
})


const the_tests : string[] = []
const mfadata = process.env.MFAData as string
const parse_folder = (current_dir : string) => {
  const folder_content = fs.readdirSync(current_dir)
  for (const idx in folder_content) {
    const file_or_folder = folder_content[idx]
    if ( file_or_folder.includes('.vscode') || file_or_folder.includes('.git') || file_or_folder.includes('.md') || file_or_folder.includes('Archive') || file_or_folder.includes('not_tested') || file_or_folder.includes('artefacts')) {
      continue
    }
    const new_path = path.join(current_dir,file_or_folder)
    const stats = fs.statSync(new_path)
    if (stats.isFile()) {
      continue
    }
    if (file_or_folder !== 'sankey') {
      parse_folder(new_path)
    } else {
      if (!new_path.includes('Exercices')) {
        continue
      }
      const file_names = fs.readdirSync(new_path)
      for (const file_idx in file_names) {
        if (file_names[file_idx].includes('layout')) {
          continue
        }
        const full_path = path.join(new_path,file_names[file_idx])
        the_tests.push(full_path)
      }
    }
  }
}
parse_folder(mfadata)

test.each(the_tests)( 'tyty',(full_path) => {
  const x = jest.spyOn(window, 'focus')
  x.mockImplementation(() => {
    'nothing'
  })

  const new_data = require(full_path)
  convert_data(new_data as SankeyData)
  compute_auto_sankey(new_data as SankeyData,200)
  const base_file_name = path.basename(full_path,'.json')
  const sankey_file_name = path.join(path.dirname(full_path),base_file_name+'_auto_layout.json')
  fs.writeFile(
    sankey_file_name,
    JSON.stringify(new_data, null, 3),
    function (err:Error | null) {
      if (err) throw err
      console.log('File is created successfully.')
    }
  )

  const component = render(
    <SankeyDraw
      data={(new_data as unknown) as SankeyData}
      display_nodes={new_data.nodes}
      // test_link_value= {(nodes: { [node_id: string]: SankeyNode }, l: SankeyLink) => 10}
      {...SankeyDrawDefaultProps}
    />
  )
  const tree = component.container
  expect(tree).toMatchSnapshot()
})


