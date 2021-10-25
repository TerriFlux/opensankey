import React, { ChangeEvent, FunctionComponent, useRef, useState } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form, Modal, Navbar, Nav, NavDropdown, Button, Dropdown, Container } from 'react-bootstrap'
import { SankeyData, SankeyDataPropTypes } from './types'
import { convert_data } from './SankeyConvert'
import { compute_auto_sankey } from './SankeyLayout'
import FileSaver from 'file-saver'
import { default_sankey_data,uploadExemple } from './SankeyUtils'

const MenuPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  open_menu: PropTypes.element,
  save_menu: PropTypes.element,
  edition_menu: PropTypes.element,
  right_menu: PropTypes.element,
  example_menu: PropTypes.element,
  app_name: PropTypes.string.isRequired,
  url_prefix: PropTypes.string.isRequired
}

type MenuTypes = InferProps<typeof MenuPropTypes>

const Menu: FunctionComponent<MenuTypes> = (
  { data, set_data, open_menu, save_menu, edition_menu, right_menu,example_menu, app_name,url_prefix }
) => {

  const _load_json = useRef<HTMLInputElement>(null)
  const _load_simple_excel = useRef<HTMLInputElement>(null)

  const [processing] = useState(false)

  const clickSaveDiagram = () => {
    const data_to_save = { ...data }
    const str_data = JSON.stringify(data_to_save, null, 3)
    const blob = new Blob([str_data], { type: 'text/plain;charset=utf-8' })
    FileSaver.saveAs(blob, 'sankey_diagram.json')
  }

  const clickSaveSVG = () => {
    const svg = window.d3.select('svg')
    svg.selectAll('.tooltip').remove()
    svg.selectAll('text[visibility=hidden]').remove()
    const html = ((svg.attr('title', 'test2')
      .attr('version', 1.1)
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .node() as HTMLElement).parentNode as HTMLElement).innerHTML

    const blob = new Blob([html], { type: 'image/svg+xml' })
    FileSaver.saveAs(blob, 'sankey_diagram.svg')
  }
  const clickSavePDF = () => {
    const svg = window.d3.select('svg')
    svg.selectAll('.tooltip').remove()
    svg.selectAll('text[visibility=hidden]').remove()
    const html = ((svg.attr('title', 'test2')
      .attr('version', 1.1)
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .node() as HTMLElement).parentNode as HTMLElement).innerHTML

    const blob = new Blob([html], { type: 'image/svg+xml' })
    const data = new FormData()
    data.append('svg', blob)

    const path = window.location.href
    let url = path + 'sankey/save_pdf'
    const fetchData = {
      method: 'POST',
      body: data
    }

    const showFile = (blob: BlobPart) => {
      const newBlob = new Blob([blob], { type: 'application/pdf' })
      FileSaver.saveAs(newBlob, 'sankey_diagram.pdf')
    }
    const cleanFile = () => {
      const fetchData = {
        method: 'POST'
      }
      url = path + 'sankey/clean_pdf'
      fetch(url, fetchData)
    }

    fetch(url, fetchData).then(
      r => r.blob()
    )
      .then(showFile).then(cleanFile)
  }

  const uploadJSON = () => {
    if (_load_json.current) {
      _load_json.current.name = ''
      _load_json.current.click()
    }
  }

  const uploadJSONImpl = (evt: ChangeEvent) => {
    const files = (evt.target as HTMLFormElement).files
    const reader = new FileReader()
    reader.onload = (() => {
      return (e: ProgressEvent<FileReader>) => {
        let result = String((e.target as FileReader).result)
        result = result.split('<br>').join('\\\\n')
        const new_data = JSON.parse(result)
        data.tags_catalog = []
        Object.assign(data, new_data)
        convert_data(data)
        set_data({ ...data })
      }
    })()
    reader.readAsText(files[0])
  }

  const reinitialization = () => {
    const data = default_sankey_data()
    set_data({ ...data })
  }

  return (
    <>
      <Navbar className='bg-light' expand="lg" >
        <Container>
          <Navbar.Brand href="#">{app_name}</Navbar.Brand>
          <Nav>
            <NavDropdown title="Fichiers" id="files" >
              <NavDropdown id='ouvrir' title="Ouvrir" >
                <Dropdown.Item onClick={uploadJSON} >JSON</Dropdown.Item>
                <Form.Control 
                  type="file" 
                  ref={_load_json} 
                  style={{ display: 'none' }} 
                  onChange={uploadJSONImpl} 
                />
                <Dropdown.Item onClick={ () => {
                  if (_load_simple_excel && _load_simple_excel.current) {
                    _load_simple_excel.current.name = ''
                    _load_simple_excel.current.click() 
                  }}}
                >Excel simple
                </Dropdown.Item>
                <Form.Control
                  style={{ display: 'none' }}
                  ref={_load_simple_excel}
                  type="file"
                  onChange={ (evt: ChangeEvent) => {
                    const files = (evt.target as HTMLFormElement).files
                    const form_data = new FormData()
                    form_data.append('file', files ? files[0] : '' )
                    const fetchData = {
                      method: 'POST',
                      body: form_data
                    }
                    const callback = (server_data: SankeyData & { error: string }) => {
                      const error = server_data['error']
                      if (error && error.length != 0) {
                        alert(error)
                        return
                      }
                      Object.assign(data, server_data)
                      convert_data(data)
                      compute_auto_sankey(data, 200)
                      set_data({ ...data })
                    }
                    const url =  window.location.href + url_prefix + 'sankey/upload_simple_excel'
                    fetch(url, fetchData).then(response => {
                      response.text().then(text => {
                        // try {
                        const json_data = JSON.parse(text)
                        callback(json_data)
                        // } catch(err) {
                        //   alert(err)
                        // }
                      })
                    })                                      
                  }} 
                />
                {open_menu}
              </NavDropdown>
              <NavDropdown id='enregistrer' title="Enregistrer" >
                <Dropdown.Item onClick={clickSaveDiagram} >JSON</Dropdown.Item>
                {save_menu}
              </NavDropdown>
              <NavDropdown id='exporter' title="Exporter" >
                <Dropdown.Item onClick={clickSaveSVG} >Exporter SVG</Dropdown.Item>
                <Dropdown.Item onClick={clickSavePDF} >Exporter PDF</Dropdown.Item>
              </NavDropdown>
            </NavDropdown>
            <NavDropdown id='edition' title="Edition" >
              <Dropdown.Item onClick={reinitialization} >Réinitialiser</Dropdown.Item>
              {edition_menu}
            </NavDropdown >
            <NavDropdown title="Aide" id="help">
              <Dropdown.Item eventKey="documentation" href="../../doc/user_su-model-sankey.html" target="_blank">Documentation</Dropdown.Item>
              <NavDropdown title="Exemples" id="exemples" >
                <Dropdown.Item onClick={()=>uploadExemple('pommes_poires.xlsx',url_prefix,data,set_data)} >Pommes Poires Simple</Dropdown.Item>
                <Dropdown.Item onClick={()=>uploadExemple('sankeys_territoire_.csv',url_prefix,data,set_data)} >Energie</Dropdown.Item>
                <NavDropdown.Divider />
                {example_menu}
              </NavDropdown>
            </NavDropdown>
          </Nav>
          {right_menu}
        </Container>
      </Navbar>

      {processing ? (
        <Modal.Dialog >
          <Button className="btn btn-sm btn-warning col-md-12">
            <span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Processing...
          </Button></Modal.Dialog>) : (<div></div>)
      }
    </>
  )
}

Menu.propTypes = MenuPropTypes


export default Menu