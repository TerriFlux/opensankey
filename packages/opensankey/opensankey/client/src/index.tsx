import './css/bootstrap.css'
import './css/main.css'
import React from 'react'
import { render } from 'react-dom'

import SankeyApp from './lib/SankeyApp'
import { convert_data } from './lib/SankeyConvert'
import { SankeyData } from './lib/types'

window.React = React

type sous_filiere = { [ key : string ] : string }

declare const window: Window &
   typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      sankey_data_file:RequestInfo
      sous_filieres : sous_filiere
      units: string[],
      flask_logo? : string,
      flask_header? : string,
      logo_width? : number
    }
   }

window.SankeyToolsStatic = window.SankeyToolsStatic === undefined ? false : window.SankeyToolsStatic

const data : SankeyData = {
  version: '0.4',
  node_width: 10,
  user_scale: 100,
  height: 1500,
  width: 2150,

  nodes: [],
  links: {
    'no_region': []
  },

  display_style : {
    font_size         : 11,
    sector_uppercase  : false,
    sector_bold       : false,
    sector_italic     : false,
    product_uppercase : false,
    product_bold      : false,
    product_italic    : false,
    unit              : false,
    filter            : 0,
    filter_label      : 0,
    global_curvature  : 0.5
  },

  tags : [],
  selected_tags : {},

  region_name: 'no_region',
  region_names: ['no_region']
}

const json_data = localStorage.getItem('data')
if (json_data !== null) {
  const new_data = JSON.parse(json_data)
  convert_data(new_data)
  Object.assign(data, new_data)
  const region_names : string[] = Object.keys(data.links)
  if (!region_names.includes(data.region_name)) {
    data.region_name = region_names[0]
  }
}


render(
  <SankeyApp 
    sankey_data={data} 
  />,
  document.getElementById('react-container')
)
