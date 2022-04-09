/* eslint @typescript-eslint/no-var-requires: "off" */
import './css/bootstrap.css'
import './css/main.css'
import React from 'react'
import { render } from 'react-dom'

import SankeyApp from './lib/SankeyApp'
import { convert_data } from './lib/SankeyConvert'
import { default_sankey_data } from './lib/SankeyUtils'

window.React = React

declare const window: Window &
   typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      filiere?:     string
      header? : string,
      has_header? : boolean,
      footer? : boolean,
      logo_width? : number,
      excel? : string,
      publish?: boolean
      logo? : string
    }
   }

window.SankeyToolsStatic = window.SankeyToolsStatic === undefined ? false : window.SankeyToolsStatic

const data  = default_sankey_data()

if (!window.SankeyToolsStatic) {
  const json_data = localStorage.getItem('data')
  if (json_data !== null) {
    const new_data = JSON.parse(json_data)
    convert_data(new_data)
    data.tags_catalog = {}
    Object.assign(data, new_data)
  }
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
          />
        </>,
        document.getElementById('react-container')
      )
    }).catch( ()=> 
      render(
        <>
          <SankeyApp 
            sankey_data={data}
            exemple_menu={{}}
            artefacts_menu={{}}
          />
        </>,
        document.getElementById('react-container')
      )    
    )
  })

} else {
  localStorage.setItem('data',JSON.stringify(window.sankey.filiere))
  localStorage.setItem('initial_data',JSON.stringify(window.sankey.filiere))
  const json_data = localStorage.getItem('data')
  if (json_data !== null && json_data !== 'undefined' ) {
    const new_data = JSON.parse(json_data)
    Object.assign(data, new_data)
    convert_data(data)
    let height = 0
    Object.values(data.nodes).forEach(n => height = (n.y && n.node_visible) ? Math.max(height, n.y) : height)
    let min_height = 2000
    Object.values(data.nodes).forEach(n => min_height = (n.y && n.node_visible) ? Math.min(min_height, n.y) : min_height)
    let max_vert_shift = 0
    Object.values(data.links).forEach(l => max_vert_shift = l.vert_shift ? Math.max(max_vert_shift, l.vert_shift) : max_vert_shift)

    data.height = Math.max(500, height + max_vert_shift + 200)
    data.static_sankey = window.SankeyToolsStatic ? window.SankeyToolsStatic : false
  }
  render(
    <>
      {window.sankey.has_header ? (
        <div className="container">
          <div className="row">
            <div className="col-sm-4">
              <br/>
              <img src={window.sankey.logo} width={window.sankey.logo_width}/>
              <br/>
            </div>
            <div className="col-sm-8">
              <br/>
              <h2>{window.sankey.header}</h2>
              <br/>
            </div>
          </div>
        </div>
      ) : (<></>)
      }
      <SankeyApp 
        sankey_data={data}
        exemple_menu={{}}
        artefacts_menu={{}}
      />
      {window.sankey.footer ? (
        <div id="copyright">
          <div className="container">
            <div className="row" style={{ 'marginTop' : '0px' }} >
              <div className="col-sm-11">
                <br/>
                <p>Réalisé par TerriFlux - <a href="https://terriflux.fr">www.terriflux.fr</a></p>
              </div>
              <div className="col-sm-1">
                <img src="logo_terriflux.png" width="100"/>
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
