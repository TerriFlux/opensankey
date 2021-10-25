import React, { ChangeEvent, FunctionComponent, useRef, useState } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form, FormGroup, FormControl, FormLabel, Row, Col, Modal, Tabs, Tab, Navbar, Nav, NavDropdown, Button, ButtonGroup, Dropdown, Container, Offcanvas, ToggleButton } from 'react-bootstrap'
import { SankeyData, SankeyNode, SankeyDataPropTypes } from './types'
import { convert_data } from './SankeyConvert'
import { compute_auto_sankey, updateLayout } from './SankeyLayout'
import FileSaver from 'file-saver'
import { default_sankey_data, delete_node, default_node } from './SankeyUtils'
import Accordion from 'react-bootstrap/Accordion'
import { SankeySettingsEditionV2, SankeySettingsEditionTags } from './SankeySettingsEdition'
// import SankeySettingsEditionTags from './SankeySettingsEdition'


import SankeyNodeEditionV2 from './SankeyNodeEdition'
import SankeyLinkEditionV2 from './SankeyLinkEdition'
import { delete_link } from './SankeyUtils'

const MenuPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  open_menu: PropTypes.element,
  save_menu: PropTypes.element,
  edition_menu: PropTypes.element,
  right_menu: PropTypes.element,
  app_name: PropTypes.string.isRequired,
  set_show_nav: PropTypes.func.isRequired,
  show_nav: PropTypes.bool,
  set_nav_item_active: PropTypes.func.isRequired,
  nav_item_active: PropTypes.string,
  set_selected_node: PropTypes.func.isRequired,
  selected_node: PropTypes.number.isRequired,
  set_selected_link: PropTypes.func.isRequired,
  selected_link: PropTypes.number.isRequired,
  set_selected_id_link: PropTypes.func.isRequired,
  selected_id_link: PropTypes.string.isRequired
}


type MenuTypes = InferProps<typeof MenuPropTypes>

const Menu: FunctionComponent<MenuTypes> = (
  { data, set_data, open_menu, save_menu, edition_menu, right_menu, app_name,
    set_show_nav, show_nav, set_nav_item_active, nav_item_active, set_selected_node, selected_node, set_selected_link, selected_link, set_selected_id_link, selected_id_link }
) => {
  //NEW By Vince

  let file_layout: Blob[] | undefined

  /* const [shift_left, set_shift_left] = useState(100)
  const [shift_top, set_shift_top] = useState(100)
  const [user_scale, set_user_scale] = useState(data.user_scale)
  const [height, set_height] = useState(data.height)
  const [width, set_width] = useState(data.width)
  const [, set_node_hspace] = useState(100)
  const [tag_group_id, set_tag_group_id] = useState(0) */
  const [sga, set_sga] = useState(true)
  const [show_node, set_show_node] = useState(true)
  // const [selected_node, set_selected_node] = useState(0)
  // const [show_node_context, set_show_node_context] = useState(false)
  const [show_link, set_show_link] = useState(true)
  // const [selected_link, set_selected_link] = useState(0)




  const { display_style, tags, links, nodes, selected_tags, node_width } = data
  const { filter } = display_style
 
  const add_new_node = () => {
    const { nodes } = data
 
    const node: SankeyNode = default_node()
    node.id = nodes.length
    node.name = 'n' + nodes.length
    node.x = nodes.length * 50
    nodes.push(node)
    set_selected_node(nodes.length - 1)
    set_data({ ...data })
  }


  //-----------------------------------


  const _load_json = useRef<HTMLInputElement>(null)

  const [processing] = useState(false)
  const [show_excel_dialog, set_show_excel_dialog] = useState(false)

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
      const newBlob = new Blob([blob], { type: filetype })
      FileSaver.saveAs(newBlob, file_name)
    }
    fetch(url, fetchData).then(
      response => {
        if (response.ok) {
          response.blob().then(showFile)
        }
      })
  }

  const uploadExemple = (file_name: string) => {
    const path = window.location.href
    const url = path + 'sankey/upload_exemple'
    const fetchData = {
      method: 'POST',
      body: file_name
    }
    let file_type = 'text/plain'
    reinitialization()

    file_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    const callback = (server_data: SankeyData) => {
      Object.assign(data, server_data)
      convert_data(data)
      // const keys : (keyof SankeyData)[] = Object.keys(server_data.links) as (keyof SankeyData)[]
      // data['region_names'] = keys
      //const nodes_to_delete = compute_auto_sankey(data,['International','Reste du monde'],true)
      const nodes_to_delete = compute_auto_sankey(data, true)
      if (nodes_to_delete !== undefined) {
        nodes_to_delete.forEach(
          n => delete_node(data, n)
        )
      }
      set_data({ ...data })
    }

    fetch(url, fetchData).then((response) => {
      response.text().then((text) => {
        try {
          const json_data = JSON.parse(text)
          callback(json_data)
          downloadExamples(file_name, file_type)
        } catch (err) {
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
  ) => {
    const form_data = new FormData()
    form_data.append('file', (input_file.current && input_file.current.files) ? input_file.current.files[0] : '')

    const path = window.location.href

    let url = path + 'sankey/upload_data'
    if (sheet == 'data') {
      url = path + 'sankey/upload_input_excel_data'
    }
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
      // for (const key in server_data) {
      //   data[key] = server_data[key]
      // }
      Object.assign(data, server_data)
      //delete data.display_style.filter_label
      convert_data(data)
      //data.region_names = keys
      // if (data.trade !==null && data.trade !==undefined) {
      //   data.trade_sectors = data.trade.split(',')
      // } else {
      //   data.trade_sectors = ['International']
      // }

      //compute_auto_sankey(data, data.trade_sectors, true)
      compute_auto_sankey(data, true)
      set_data({ ...data })
    }
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
    set_show_excel_dialog(false)
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
        data.tags = []
        data.selected_tags = {}
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

  const handleSelect = (eventKey: string | null, event: React.SyntheticEvent<unknown, Event>) => {
    if (eventKey === 'documentation') {
      return
    }
    event.preventDefault()
    if (eventKey === 'uploadJSON') {
      uploadJSON()
    } else if (eventKey === 'uploadExcel') {
      uploadExcel()
    } else if (eventKey === 'clickSaveDiagram') {
      clickSaveDiagram()
    } else if (eventKey === 'clickSaveSVG') {
      clickSaveSVG()
    } else if (eventKey === 'clickSavePDF') {
      clickSavePDF()
    } else if (eventKey === 'reinitialization') {
      reinitialization()
      // } else if (eventKey === 'static_sankey' ) {
      //   data.static_sankey = !data.static_sankey
      //   set_data({...data})
      //   //setState({})
    } else if (eventKey === 'exemple2') {
      uploadExemple('pommes_poires.xlsx')
    } else if (eventKey === 'exemple3') {
      uploadExemple('sankeys_territoire_.csv')
    }
  }

  const setShow = (t: boolean) => {
    set_show_nav(t)
  }


  // const [show, setShow] = useState(false)
  const handleClose = () => setShow(true)
  const handleShow = () => setShow(true)
  // const toggleShow = () => { setShow((s) => !s) }
  const toggleShow = () => {
    setShow(!show_nav)
  }
  const [checked, setChecked] = useState(false)
  //const handleReglage=()=> SankeySettingsEditionV2()
  const getNavItem = () => {
    const tmp = nav_item_active as string
    return tmp
  }

  if (selected_id_link == '' && links.length != 0) {
    selected_id_link = links[0].idLink as any
  }


  const props = {
    scroll: true,
    backdrop: false,
  }
  return (
    <>
      <Navbar className='bg-light' fixed='top' expand="xl" >
        <Container>
          <Navbar.Brand href="#">{app_name}</Navbar.Brand>
          <Nav onSelect={handleSelect}>
            <NavDropdown title="Fichiers" id="files" >
              <NavDropdown id='ouvrir' title="Ouvrir" >
                <Dropdown.Item eventKey="uploadJSON" >JSON</Dropdown.Item>
                <form><input type="file" name="" ref={_load_json} style={{ display: 'none' }} onChange={uploadJSONImpl} /></form>
                <Dropdown.Item eventKey="uploadExcel" >Excel</Dropdown.Item>
                {open_menu}
              </NavDropdown>
              <NavDropdown id='enregistrer' title="Enregistrer" >
                <Dropdown.Item eventKey="clickSaveDiagram" >JSON</Dropdown.Item>
                {save_menu}
              </NavDropdown>
              <NavDropdown id='exporter' title="Exporter" >
                <Dropdown.Item eventKey="clickSaveSVG" >Exporter SVG</Dropdown.Item>
                <Dropdown.Item eventKey="clickSavePDF" >Exporter PDF</Dropdown.Item>
              </NavDropdown>
            </NavDropdown>
            <NavDropdown id='edition' title="Edition" >
              <Dropdown.Item eventKey="reinitialization" >Réinitialiser</Dropdown.Item>
              {edition_menu}
            </NavDropdown >
            <NavDropdown title="Aide" id="help">
              <Dropdown.Item eventKey="documentation" href="../../doc/user_su-model-sankey.html" target="_blank">Documentation</Dropdown.Item>
              <NavDropdown title="Exemples" id="exemples" >
                <Dropdown.Item eventKey="exemple2" >Pommes Poires Excel</Dropdown.Item>
                <Dropdown.Item eventKey="exemple3" >Energie</Dropdown.Item>
              </NavDropdown>
            </NavDropdown>
            <ButtonGroup className="mb-2" style={{ 'width': '480px' }}>
              <ToggleButton
                id="toggle-check"
                type="checkbox"
                variant="outline-primary"
                checked={checked}
                onChange={(e) => { setChecked(e.currentTarget.checked) }}
                onClick={toggleShow}
                value="1">Configuration Sankey
              </ToggleButton>
            </ButtonGroup>
          </Nav>
          {right_menu}
        </Container>
      </Navbar>
      <Offcanvas show={show_nav} placement='end' onHide={handleClose} {...props} style={{ 'width': '540px', 'margin-top': '70px' }}>
        <Offcanvas.Body style={{ 'padding': '0px' }}>
          <Accordion defaultActiveKey={getNavItem()}>
            <Accordion.Item eventKey="0">
              <Accordion.Header>Shortcut</Accordion.Header>
              <Accordion.Body>
                <p>Fonctionnement des clics :</p><br />
                <p><b>CTRL + Click (noeuds) :</b> Selectionne le noeuds clicke dans l onglet Noeuds du menu</p>
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="1">
              <Accordion.Header>Paramêtres généraux</Accordion.Header>
              <Accordion.Body>
                <SankeySettingsEditionV2
                  show={sga}
                  set_show_graphic_attributes={sga as any}
                  data={data}
                  set_data={set_data}
                  set_current_filter={(
                    new_current_filter: number
                  ) => {
                    const { display_style } = data
                    display_style.filter = +new_current_filter
                    set_data({ ...data })
                  }}
                />
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="2" >
              <Accordion.Header>Noeuds</Accordion.Header>
              <Accordion.Body>
                <br />
                <Row>
                  <Button size="sm" style={{ 'marginBottom': '3px' }} onClick={add_new_node}>
                    Ajouter Noeud
                  </Button>

                </Row>
                <Row>
                  <Col>
                    <Button
                      size="sm"
                      style={{ 'marginBottom': '3px' }}
                      onClick={
                        () => {
                          delete_node(data, selected_node)
                          set_data({ ...data })
                        }
                      }
                    >Supprimer noeud</Button>
                  </Col>
                  <Col>
                    <Form.Select id="selectionNode"
                      onChange={
                        (evt: React.ChangeEvent<HTMLSelectElement>) => {
                          set_selected_node(nodes.filter(f => { return f.name == evt.target.value })[0].id)
                        }
                      }
                    >
                      {nodes.map((n, i) => <option key={i} value={n.name} selected={nodes[i].idNode === nodes[selected_node].idNode} >{nodes[i].name}</option>)}
                    </Form.Select>
                  </Col>
                </Row>

                <br />
                <SankeyNodeEditionV2
                  show={sga}
                  data={data}
                  set_data={set_data}
                  set_show_node={set_show_node}
                  selected_node={selected_node}
                />
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="3">
              <Accordion.Header>Links</Accordion.Header>
              <Accordion.Body>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                <Row>
                  <Col>
                    <Form.Select id="selectionLink"
                      onChange={
                        (evt: React.ChangeEvent<HTMLSelectElement>) => {
                          set_selected_id_link(links.filter(f => { return f.idLink == evt.target.value })[0].idLink)
                        }
                      }
                    >
                      {links.map((n, i) => <option key={i} value={n.idLink as any} selected={n.idLink == selected_id_link}  >{n.idLink}</option>)}
                    </Form.Select>
                  </Col>
                  <Col>

                    <Button
                      size="sm"
                      onClick={
                        () => {
                          delete_link(data, selected_link)
                          set_data({ ...data })
                        }
                      }
                    >Supprimer flux</Button>

                  </Col>

                </Row>
                <br />
                <SankeyLinkEditionV2
                  show={true}
                  data={data}
                  set_data={set_data}
                  set_show_link={set_show_link}
                  selected_link={selected_link}
                  selected_id_link={selected_id_link}
                  set_selected_id_link={set_selected_id_link}
                />
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="4">
              <Accordion.Header>Tags</Accordion.Header>
              <Accordion.Body>
                <SankeySettingsEditionTags
                  show={sga}
                  set_show_graphic_attributes={sga as any}
                  data={data}
                  set_data={set_data}
                  set_current_filter={(
                    new_current_filter: number
                  ) => {
                    const { display_style } = data
                    display_style.filter = +new_current_filter
                    set_data({ ...data })
                  }}
                />
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="5">
              <Accordion.Header>Aide</Accordion.Header>
              <Accordion.Body>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Offcanvas.Body>
      </Offcanvas>

      {show_excel_dialog ? (
        <ExcelModal
          handleCloseDialog={handleCloseExcelDialog}
          uploadExcelImpl={uploadExcelImpl} />
      ) :
        (<div />)
      }
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

const ExcelModalPropTypes = {
  uploadExcelImpl: PropTypes.func.isRequired,
  handleCloseDialog: PropTypes.func.isRequired
}

type ExcelModalTypes = InferProps<typeof ExcelModalPropTypes>

const ExcelModal: FunctionComponent<ExcelModalTypes> = ({ uploadExcelImpl, handleCloseDialog }) => {
  const input_file_ = useRef<HTMLInputElement>(null)
  const [sheet, set_sheet] = useState('results')

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
                  onChange={(evt: ChangeEvent) => {
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
                    evt => set_sheet((evt.target as HTMLInputElement).value)
                  }
                >
                  <option
                    key={0}
                    value='data'
                    selected={sheet === 'data'}
                  >Données</option>
                  <option
                    key={1}
                    value='results'
                    selected={sheet === 'results'}
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