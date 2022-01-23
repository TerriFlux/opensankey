/* eslint @typescript-eslint/no-var-requires: "off" */
import './css/bootstrap.css'
import './css/main.css'
import React from 'react'
import { render } from 'react-dom'

import SankeyApp from './lib/SankeyApp'
import { convert_data } from './lib/SankeyConvert'
import { default_sankey_data } from './lib/SankeyUtils'
import { Col, Row } from 'react-bootstrap'
const logo = require('./css/logo_terriflux.jpg')
const logo_auraee = require('./css/logo_energie.jpg')
const logo_scan = require('./css/scandatamining.jpg')

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
  <>
    <SankeyApp 
      sankey_data={data} 
    />
    <div id="copyright">
      <div className="container">
        <Row style={{ 'marginTop' : '0px' }} >
          <Col>
            <h4>Réalisé par:</h4>
          </Col>
          <Col>
            <img src={logo.replace('static/', 'static/opensankey/')} width="200" />
          </Col>
          <Col>
            <h4>Contributeurs:</h4>
          </Col>
          <Col>
            <img src={logo_auraee.replace('static/', 'static/opensankey/')} width="150" />
          </Col>
          <Col>
            <img src={logo_scan.replace('static/', 'static/opensankey/')} width="100" />
          </Col>
        </Row>
        <br></br>
      </div>
    </div>
  </>,
  document.getElementById('react-container')
)
