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
  version: '0.3',
  file_path: 'sankey_diagram.json',
  node_width: 10,
  user_scale: 100,
  height: 1500,
  width: 2150,

  periods: false,

  nodes: [],
  links: {
    'no_region': []
  },

  animation_tooltips: {},
  show_uncert: true,

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
    global_curvature  : 0.5,
    trade_close       : true
  },

  static_sankey  : window.SankeyToolsStatic,

  subchains : [],
  use_flux_types : false,
  region_names : [],
  tooltip_names : [],

  tooltips: [],
  units_names: [],
  region_name: 'no_region',
  default_tooltip: true
}
let initial_flux_types = ['null_data','computed_data','adjusted_data']
const json_data = localStorage.getItem('data')
if (json_data !== null) {
  const new_data = JSON.parse(json_data)
  convert_data(new_data)
  //const old_static_sankey = data.static_sankey
  Object.assign(data, new_data)
  const region_names : string[] = Object.keys(data.links)
  if (!region_names.includes(data.region_name)) {
    data.region_name = region_names[0]
  }
 
  data.static_sankey = window.SankeyToolsStatic ? window.SankeyToolsStatic : false
  if (window.SankeyToolsStatic) {
    initial_flux_types = ['computed_data','adjusted_data']
  }
}
 
let initial_subchain = ['All']
const stored = localStorage.getItem('subchain')
const subchain_stored = stored ? JSON.parse(stored) : undefined
if (subchain_stored) {
  initial_subchain = subchain_stored
}

render(
  <SankeyApp 
    sankey_data={data} 
    initial_subchain={initial_subchain} 
    initial_flux_types={initial_flux_types} 
  />,
  document.getElementById('react-container')
)
