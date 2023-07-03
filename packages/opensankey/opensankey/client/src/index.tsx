/* eslint @typescript-eslint/no-var-requires: "off" */
import './css/bootstrap.css'
import './css/main.css'
import React from 'react'
import { render } from 'react-dom'

import SankeyApp from './lib/SankeyApp'
import { convert_data,complete_sankey_data } from './lib/SankeyConvert'
import { default_link, default_node, default_sankey_data } from './lib/SankeyUtils'
import LZString from 'lz-string'
import { SankeyData } from './lib/types'
import './lib/traduction'

let logo = ''
try {
  /* eslint-disable */
  // @ts-ignore
  logo = require('./css/opensankey.png')
  /* eslint-enable */
  const path = window.location.href
  if ( !path.includes('localhost') ) {
    logo = logo.replace('static/', 'static/opensankey/')
  }
} catch (expt) {
  console.log('opensankey.png not found')
}

let logo_terriflux = ''
try {
  /* eslint-disable */
  // @ts-ignore
  logo_terriflux = require('./css/terriflux.png')
  /* eslint-enable */
  const path = window.location.href
  if ( !path.includes('localhost') ) {
    logo_terriflux = logo_terriflux.replace('static/', 'static/opensankey/')
  }
} catch (expt) {
  console.log('terriflux.png not found')
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
// Create a default sankey
const data = default_sankey_data()

if (!window.SankeyToolsStatic) {
  if (!window.sankey) {
    window.sankey = {}
  }
  // Search if a data is stored in localStorage of the navigator
  const json_data = LZString.decompress(localStorage.getItem('data') as string)
  // const json_data = localStorage.getItem('data')

  // If there is, store the data in the sankey_data
  if (json_data !== null && json_data != '' && json_data!='null') {
    const new_data = JSON.parse(json_data)
    Object.assign(data, new_data)
    convert_data(data)
    complete_sankey_data(data,default_sankey_data,default_node,default_link)
  }
  data.static_sankey = window.SankeyToolsStatic ? window.SankeyToolsStatic : false

  const fetchData = {
    method: 'POST'
  }
  // Search if can find example located on a server
  let exemple_menu = {}
  let formations_menu = {}
  const path = window.location.origin
  const url = path + '/opensankey/sankey/menu_examples'
  fetch(url, fetchData).then(response => {
    response.text().then(text => {
      const json_data = JSON.parse(text)
      exemple_menu = json_data.exemples_menu
      formations_menu = {...Object.fromEntries(Object.entries(json_data.exemples_menu['Formations']).filter(m=>m[0]=='0_OpenSankey'))}
      delete json_data.exemples_menu['Formations']
      render(
        <>
          <SankeyApp
            initial_sankey_data={data}
            exemple_menu={exemple_menu}
            formations_menu={formations_menu}
            logo={logo}
            logo_terriflux={logo_terriflux}
          />
        </>,
        document.getElementById('react-container')
      )
    }).catch(() =>
      render(
        <>
          <SankeyApp
            initial_sankey_data={data}
            exemple_menu={{}}
            formations_menu={{}}
            logo={logo}
            logo_terriflux={logo_terriflux}
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
    complete_sankey_data(data,default_sankey_data,default_node,default_link)
    data.static_sankey = window.SankeyToolsStatic ? window.SankeyToolsStatic : false
  }
  render(
    <>
      <SankeyApp
        initial_sankey_data={data}
        exemple_menu={{}}
        formations_menu={{}}
        logo={logo}
        logo_terriflux={logo_terriflux}
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
