import React, { ChangeEvent, FunctionComponent, useRef, useState } from 'react'
import PropTypes,{InferProps} from 'prop-types'
import { Form, FormGroup,FormControl,FormLabel,Row,Col,Modal,Navbar,Nav,NavDropdown,Button,Dropdown,Container} from 'react-bootstrap'
import {SankeyData, SankeyDataPropTypes} from './types'
import { convert_data } from './SankeyConvert'
import { compute_auto_sankey } from './SankeyLayout'
import FileSaver from 'file-saver'

const MenuPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  delete_node: PropTypes.func.isRequired
}

type MenuTypes = InferProps<typeof MenuPropTypes>

const Menu : FunctionComponent<MenuTypes> = (
  {data,set_data,delete_node}
) => {

  const _load_json = useRef<HTMLInputElement>(null)

  const [processing]                                  = useState(false)
  const [show_excel_dialog,    set_show_excel_dialog] = useState(false)

  const clickSaveDiagram = (current_region : boolean) => {
    const { region_name } = data
    const data_to_save = {...data}
    if ( current_region) {
      data_to_save.links = {}
      data_to_save.links[region_name] =  data.links[region_name]
    }
    const str_data = JSON.stringify(data_to_save, null, 3)
    const blob = new Blob([str_data], {type: 'text/plain;charset=utf-8'})
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

    const blob = new Blob([html], {type: 'image/svg+xml'})
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

    const blob = new Blob([html], {type: 'image/svg+xml'})
    const data = new FormData()
    data.append('svg', blob)

    const path = window.location.href
    let url = path + 'sankey/save_pdf'
    const fetchData = {
      method: 'POST',
      body: data
    }
        
    const showFile = (blob: BlobPart) => {
      const newBlob = new Blob([blob], {type: 'application/pdf'})
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

  const downloadExamples = (
    file_name: string,
    filetype: string
  ) => {
    const path = window.location.href
    const url = path + 'sankey/download_examples'
    const fetchData = {
      method: 'POST',
      body: file_name
    }
    const showFile = (blob: BlobPart) => {
      const newBlob = new Blob([blob], {type: filetype })
      FileSaver.saveAs(newBlob, file_name)
    }
    fetch(url, fetchData).then(
      response => {
        if (response.ok) {
          response.blob().then(showFile)
        }
      })   
  }

  const uploadExemple = (file_name : string) => {
    const path = window.location.href
    const url = path + 'sankey/upload_exemple'
    const fetchData = {
      method: 'POST',
      body: file_name
    }
    let callback: { (server_data: SankeyData): void }
    let file_type= 'text/plain'
    reinitialization()
    if (file_name === 'pommes_poires.txt') {
      callback = (server_data : SankeyData) => {
        set_data(server_data)
      }
    } else {
      file_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      callback = (server_data : SankeyData) => {
        Object.assign(data, server_data)
        convert_data(data)
        const keys : (keyof SankeyData)[] = Object.keys(server_data.links) as (keyof SankeyData)[]
        data['region_names'] = keys
        //const nodes_to_delete = compute_auto_sankey(data,['International','Reste du monde'],true)
        const nodes_to_delete = compute_auto_sankey(data,true)
        if (nodes_to_delete !== undefined) {
          nodes_to_delete.forEach(
            n =>  delete_node(n)
          )
        }
        set_data({...data})
      }           
    }
    fetch(url, fetchData).then((response) => {
      response.text().then((text)=> {
        try {
          const json_data = JSON.parse(text)
          callback(json_data)
          downloadExamples(file_name,file_type)
        } catch(err) {
          alert(err)
        }
      })
    })        
  }

  const handleCloseExcelDialog = () => {
    set_show_excel_dialog(false)
  }

  const uploadExcel = () => {
    set_show_excel_dialog(true)
  }

  const uploadExcelImpl = (
    input_file: React.RefObject<HTMLInputElement>,
    sheet: string
  ) =>{
    const form_data = new FormData()
    form_data.append('file', (input_file.current && input_file.current.files) ? input_file.current.files[0] : '')

    const path = window.location.href

    let url = path + 'sankey/upload_data'
    if (sheet == 'data' ) {
      url = path + 'sankey/upload_input_excel_data'      
    }
    const fetchData = {
      method: 'POST',
      body: form_data
    }
    const callback = (server_data : SankeyData & { error : string}) => {
      const error = server_data['error']
      if (error && error.length != 0 ) {
        alert(error)
        return
      } 
      // for (const key in server_data) {
      //   data[key] = server_data[key]
      // }
      Object.assign(data, server_data)
      //delete data.display_style.filter_label
      convert_data(data)
      const keys = Object.keys(server_data.links)
      data.region_names = keys
      data.use_flux_types = true
      // if (data.trade !==null && data.trade !==undefined) {
      //   data.trade_sectors = data.trade.split(',')
      // } else {
      //   data.trade_sectors = ['International']
      // }

      //compute_auto_sankey(data, data.trade_sectors, true)
      compute_auto_sankey(data, true)
      set_data({...data})
    }
    fetch(url, fetchData).then(response=> {
      response.text().then(text=> {
        // try {
        const json_data = JSON.parse(text)
        callback(json_data)
        // } catch(err) {
        //   alert(err)
        // }
      })
    })
    set_show_excel_dialog(false)
  }

  const uploadJSON = () => {
    if (_load_json.current ) {
      _load_json.current.name = ''
      _load_json.current.click()
    }
  }

  const uploadJSONImpl = (evt : ChangeEvent) => {
    const files = (evt.target as HTMLFormElement).files
    const reader = new FileReader()
    reader.onload = (() => {
      return (e : ProgressEvent<FileReader>) => {
        let result = String((e.target as FileReader).result)
        result = result.split('<br>').join('\\\\n')
        const new_data = JSON.parse(result)
        if (Array.isArray(new_data.links) ) {
          const the_links = new_data.links
          new_data.links = {
            'no_region': the_links
          }
        }
        Object.assign(data, new_data)
        convert_data(data)
        set_data({...data})
      }
    })()
    reader.readAsText(files[0])
  }

  const reinitialization = () => {
    const data = {
      version: '0.3',
      file_path: '',
      periods : false,
      show_uncert: false,
      region_name: 'no_region',
      animation_tooltips: '',
      default_tooltip: true,
      tooltip_names: [],
      tooltips: [],

      nodes: [],
      links: {'no_region':[]},
      units_names: [],
      user_scale : 100,
      height: 1500,
      width: 2150,
      node_width: 10,

      display_style : {
        font_size: 11,
        sector_uppercase: true,
        sector_bold: true,
        sector_italic: false,
        product_uppercase: false,
        product_bold: false,
        product_italic: true,
        unit: false,
        filter: 0,
        filter_label: 0,
        global_curvature: 0.5,
        trade_close: true
      },

      static_sankey  : false,

      subchains : [],
      use_flux_types : false,
      region_names : []
    }
    set_data({...data})
  }

  const handleSelect = (eventKey: string | null, event: React.SyntheticEvent<unknown, Event> ) => {
    if (eventKey === 'documentation' ) {
      return 
    }
    event.preventDefault()
    if (eventKey === 'uploadJSON' ) {
      uploadJSON()
    } else if (eventKey === 'uploadExcel' ) {
      uploadExcel()
    } else if (eventKey === 'clickSaveDiagram' ) {
      clickSaveDiagram(false)
    } else if (eventKey === 'clickSaveDiagramRegion' ) {
      clickSaveDiagram(true)
    } else if (eventKey === 'clickSaveSVG' ) {
      clickSaveSVG()
    } else if (eventKey === 'clickSavePDF' ) {
      clickSavePDF()
    } else if (eventKey === 'reinitialization' ) {
      reinitialization()
    // } else if (eventKey === 'static_sankey' ) {
    //   data.static_sankey = !data.static_sankey
    //   set_data({...data})
    //   //setState({})
    } else if (eventKey === 'exemple2' ) {
      uploadExemple('pommes_poires.xlsx')
    } else if (eventKey === 'exemple3' ) {
      uploadExemple('soja_v2.0.xlsx')
    } 
  }

  return (
    <>
      <Navbar className='bg-light' expand="lg" >
        <Container>
          <Navbar.Brand href="#">Open-Sankey</Navbar.Brand>
          <Nav onSelect={handleSelect}>
            <NavDropdown title="Fichiers" id="files" >
              <NavDropdown id='ouvrir' title="Ouvrir" >
                <Dropdown.Item eventKey="uploadJSON" >JSON</Dropdown.Item>
                <form><input type="file" name="" ref={_load_json} style={{ display: 'none' }} onChange={uploadJSONImpl} /></form>
                <Dropdown.Item eventKey="uploadExcel" >Excel</Dropdown.Item>
              </NavDropdown>
              <NavDropdown id= 'enregistrer' title="Enregistrer" >
                <Dropdown.Item eventKey="clickSaveDiagram" >Tout</Dropdown.Item>
                <Dropdown.Item eventKey="clickSaveDiagramRegion" >Région courante</Dropdown.Item>
              </NavDropdown>
              <NavDropdown id='exporter' title="Exporter" >
                <Dropdown.Item eventKey="clickSaveSVG" >Exporter SVG</Dropdown.Item>
                <Dropdown.Item eventKey="clickSavePDF" >Exporter PDF</Dropdown.Item>
              </NavDropdown>
            </NavDropdown>
            <NavDropdown id='edition' title="Edition" >
              <Dropdown.Item eventKey="reinitialization" >Réinitialiser</Dropdown.Item>    
            </NavDropdown >
            <NavDropdown title="Aide" id="help">
              <Dropdown.Item eventKey="documentation" href="../../doc/user_su-model-sankey.html" target="_blank">Documentation</Dropdown.Item>
              <NavDropdown title="Exemples" id="exemples" >
                <Dropdown.Item eventKey="exemple2" >Pommes Poires Excel</Dropdown.Item>
                <Dropdown.Item eventKey="exemple3" >Soja Excel</Dropdown.Item>
              </NavDropdown>
            </NavDropdown>            
          </Nav>
        </Container>
      </Navbar>

      { show_excel_dialog ?  (
        <ExcelModal 
          handleCloseDialog = {handleCloseExcelDialog} 
          uploadExcelImpl = {uploadExcelImpl} />
      ) :
        (<div/>)
      }
      {processing ? (
        <Modal.Dialog > 
          <Button className="btn btn-sm btn-warning col-md-12">
            <span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Processing...
          </Button></Modal.Dialog>):(<div></div>)
      } 
    </>
  )
}

Menu.propTypes = MenuPropTypes

const ExcelModalPropTypes = {
  uploadExcelImpl   :   PropTypes.func.isRequired,
  handleCloseDialog : PropTypes.func.isRequired
}

type ExcelModalTypes = InferProps<typeof ExcelModalPropTypes>

const ExcelModal : FunctionComponent<ExcelModalTypes> = ({uploadExcelImpl,handleCloseDialog}) => {
  const input_file_ = useRef<HTMLInputElement>(null)
  const [sheet,set_sheet] = useState('results')

  return (
    <Modal 
      show={true} 
      onHide={handleCloseDialog}
    >
      <Modal.Header closeButton>
        <Modal.Title>Ouvrir Fichier Excel</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <FormGroup>
            <Row>
              <Col as={FormLabel} sm={4}>Fichier d&apos;entrée excel</Col>
              <Col sm={8}>    
                <Form.Control 
                  ref={input_file_}                  
                  type="file" 
                  name=""
                  onChange={(evt : ChangeEvent) => {
                    if (!input_file_.current) {
                      return
                    }
                    input_file_.current.files = (evt.target as HTMLFormElement).files
                  }}
                /></Col>

            </Row>
            <Row>
              <Col as={FormLabel} sm={4}>Onglet</Col>
              <Col sm={4}>  
                <FormControl as="select"
                  onChange={
                    evt=>set_sheet((evt.target as HTMLInputElement).value)
                  }
                >
                  <option 
                    key={0} 
                    value='data' 
                    selected={ sheet === 'data'}
                  >Données</option>
                  <option 
                    key={1} 
                    value='results' 
                    selected={ sheet === 'results'}
                  >Résultats</option>
                </FormControl>
              </Col> 
            </Row>       
          </FormGroup>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={
            () => uploadExcelImpl(
              input_file_,
              sheet
            )
          }
        >Ouvrir</Button>
        <Button 
          variant="secondary" 
          onClick={handleCloseDialog}
        >Annuler</Button>
      </Modal.Footer>
    </Modal>)
}

ExcelModal.propTypes = ExcelModalPropTypes

export default Menu