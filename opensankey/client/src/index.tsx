import './css/bootstrap.css'
import './css/main.css'
import React from 'react'
import { render } from 'react-dom'

import SankeyApp from './lib/SankeyApp'
import { convert_data } from './lib/SankeyConvert'
import { default_sankey_data } from './lib/SankeyUtils'

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

const data  = default_sankey_data()

const json_data = localStorage.getItem('data')
if (json_data !== null) {
  const new_data = JSON.parse(json_data)
  convert_data(new_data)
  data.tags_catalog = {}
  Object.assign(data, new_data)
}


render(
  <SankeyApp 
    sankey_data={data} 
  />,
  document.getElementById('react-container')
)
