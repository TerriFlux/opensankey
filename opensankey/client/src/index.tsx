/* eslint @typescript-eslint/no-var-requires: "off" */
import './css/bootstrap.css'
import './css/main.css'
import React from 'react'
import { render } from 'react-dom'

import SankeyApp from './lib/SankeyApp'
import { convert_data } from './lib/SankeyConvert'
import { default_sankey_data } from './lib/SankeyUtils'
import LZString from 'lz-string'
import { SankeyData } from './lib/types'

let logo = ''
try {
  logo = require('./css/opensankey.png')
} catch (expt) {
  console.log('opensankey.png not found')
}

window.React = React

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      filiere?: SankeyData,
      header?: string,
      has_header?: boolean,
      footer?: boolean,
      logo_width?: number,
      excel?: string,
      publish?: boolean
      logo?: string
    }
  }

window.SankeyToolsStatic = window.SankeyToolsStatic === undefined ? false : window.SankeyToolsStatic
if (!window.sankey) {
  window.sankey = {}
}

const data = default_sankey_data()
if (!window.SankeyToolsStatic) {
  if (!window.sankey) {
    window.sankey = {}
  }
  const json_data = LZString.decompress(localStorage.getItem('data') as string) as string
  // const json_data = localStorage.getItem('data')

  if (json_data !== null && json_data != '' && json_data!='null') {

    const new_data = JSON.parse(json_data)
    convert_data(new_data)
    data.nodeTags = {}
    Object.assign(data, new_data)
  }
  data.static_sankey = window.SankeyToolsStatic ? window.SankeyToolsStatic : false

  const fetchData = {
    method: 'POST'
  }

  let exemple_menu = {}
  let artefacts_menu = {}
  const path = window.location.origin
  const url = path + '/sankey/menu_examples'
  fetch(url, fetchData).then(response => {
    response.text().then(text => {
      const json_data = JSON.parse(text)
      exemple_menu = json_data.exemples_menu
      artefacts_menu = json_data.artefacts_menu
      render(
        <>
          <SankeyApp
            sankey_data={data}
            exemple_menu={exemple_menu}
            artefacts_menu={artefacts_menu}
            logo={logo}
          />
        </>,
        document.getElementById('react-container')
      )
    }).catch(() =>
      render(
        <>
          <SankeyApp
            sankey_data={data}
            exemple_menu={{}}
            artefacts_menu={{}}
            logo={logo}
          />
        </>,
        document.getElementById('react-container')
      )
    )
  })

} else {
  if (window.sankey.filiere) { 
    localStorage.setItem('data', LZString.compress(JSON.stringify(window.sankey.filiere)))
  }

  const json_data = LZString.decompress(localStorage.getItem('data') as string) as string
  //console.log(json_data)
  if (json_data !== null && json_data !== 'undefined' && json_data != '') {
    const new_data = JSON.parse(json_data)
    Object.assign(data, new_data)
    convert_data(data)
    if (data.agregation.level === -1) {
      localStorage.setItem('initial_data', LZString.compress(JSON.stringify(window.sankey.filiere)))
    }
    data.static_sankey = window.SankeyToolsStatic ? window.SankeyToolsStatic : false
  }
  render(
    <>
      <SankeyApp
        sankey_data={data}
        exemple_menu={{}}
        artefacts_menu={{}}
        logo={logo}
      />
      {window.sankey.footer ? (
        <div id="copyright">
          <div className="container">
            <div className="row" style={{ 'marginTop': '0px' }} >
              <div className="col-sm-11">
                <br />
                <p>Réalisé par TerriFlux - <a href="https://terriflux.com">www.terriflux.fr</a></p>
              </div>
              <div className="col-sm-1">
                <img src="logo_terriflux.png" width="100" />
              </div>
            </div>
          </div>
        </div>
      ) : (<></>)
      }
    </>,
    document.getElementById('react-container')
  )
}
