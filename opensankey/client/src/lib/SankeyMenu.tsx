import React, { ChangeEvent, FunctionComponent, useRef, useState } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form, FormControl, FormLabel, Row, Col, Modal, Navbar, Nav, NavDropdown, Button, ButtonGroup, Dropdown, FormCheck, Container, Offcanvas, ToggleButton } from 'react-bootstrap'
import { SankeyData, SankeyNode, SankeyDataPropTypes, SankeyLink, SankeyNodePropTypes, SankeyLinkPropTypes } from './types'
import { convert_data } from './SankeyConvert'
import { compute_auto_sankey,compute_default_input_outputLinksId,updateLayout,reorganize_node_inputLinksId,reorganize_node_outputLinksId } from './SankeyLayout'
import FileSaver from 'file-saver'
import { default_sankey_data, delete_node, default_node, delete_link, default_link, uploadExemple, set_nodes_level } from './SankeyUtils'
import Accordion from 'react-bootstrap/Accordion'

const MenuPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  open_menu: PropTypes.element,
  save_menu: PropTypes.element,
  edition_menu: PropTypes.element,
  right_menu: PropTypes.element,
  settings_edition: PropTypes.element,
  settings_edition_tags: PropTypes.element,
  node_edition: PropTypes.element,
  link_edition: PropTypes.element,
  app_name: PropTypes.string.isRequired,
  set_show_nav: PropTypes.func.isRequired,
  show_nav: PropTypes.bool,
  set_nav_item_active: PropTypes.func.isRequired,
  nav_item_active: PropTypes.string.isRequired,
  set_selected_node: PropTypes.func.isRequired,
  selected_node: PropTypes.shape(SankeyNodePropTypes).isRequired,
  set_selected_link: PropTypes.func.isRequired,
  selected_link: PropTypes.shape(SankeyLinkPropTypes).isRequired,
  example_menu: PropTypes.element,
  url_prefix: PropTypes.string.isRequired,
  getValueIndex: PropTypes.func.isRequired,
  radio_selected: PropTypes.string.isRequired,
  set_radio_selected: PropTypes.func.isRequired,  
  agregation_level: PropTypes.number.isRequired,
  set_agregation_level: PropTypes.func.isRequired
}


type MenuTypes = InferProps<typeof MenuPropTypes>

const Menu: FunctionComponent<MenuTypes> = (
  { data, set_data,
    open_menu, save_menu, edition_menu, right_menu,
    settings_edition, settings_edition_tags, node_edition, link_edition,
    app_name,
    set_show_nav, show_nav, set_nav_item_active, nav_item_active,
    set_selected_node, selected_node,
    set_selected_link, selected_link,
    example_menu, url_prefix,
    getValueIndex,
    radio_selected, 
    set_radio_selected,
    agregation_level,
    set_agregation_level
  }
) => {
  const set_show_link = useState(true)[1]

  const display_nodes = data.nodes
  const display_links = data.links

  let nb_agregation_level = 0
  Object.values(data.nodes).forEach( n => {
    if ( !n.dimensions) {
      return
    }
    Object.entries(n.dimensions).forEach( dim => { 
      if (!dim[1].level) {
        return
      }
      nb_agregation_level = dim[1].level as number > nb_agregation_level ? dim[1].level as number : nb_agregation_level
    })
  })

  const value_index = getValueIndex(data)
  const add_new_node = () => {
    const { nodes } = data
    const node: SankeyNode = default_node()
    
    // en remplacement de node_idx
    //data.node_idx = data.node_idx + 1
    // Méthode pour incrementer idNode
    const listId = [] as any
    Object.keys(data.nodes).forEach(elt => listId.push(Number(elt.replace('node', ''))))
    const idNode = listId.length > 0 ? Math.max(...listId)+1 : 0

    node.idNode = 'node' + idNode
    node.name = node.idNode
    node.x = Object.keys(nodes).length * 50
    nodes[node.idNode] = node
    set_selected_node(node)
    set_data({ ...data })
  }

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
        data.tags_catalog = {}
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

  const setShow = (t: boolean) => {
    set_show_nav(t)
  }

  const handleClose = () => setShow(true)

  const toggleShow = () => {
    setShow(!show_nav)
  }
  const [checked, setChecked] = useState(false)

  const add_new_link = () => {
    const { nodes, links } = data

    if (Object.keys(nodes).length < 2) {
      return
    }
    const link: SankeyLink = default_link()

    link.idLink = 'link' + Object.keys(links).length
    links[link.idLink] = link
    const node_keys = Object.keys(nodes)
    link.idSource = nodes[node_keys[0]].idNode
    link.idTarget = nodes[node_keys[1]].idNode

    nodes[node_keys[0]].outputLinksId.push(link.idLink)
    nodes[node_keys[1]].inputLinksId.push(link.idLink)

    set_selected_link(link)
    set_data({ ...data })
    set_show_link(true)
  }

  let node = selected_node
  if (node === undefined) {
    node = default_node()
  }

  const source_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    const link = selected_link
    console.log('========1=============')
    //Causait un problème d'acumulation de la valeur de des differents link sur des noeuds non associé
    // const previous_node = nodes.filter(n => n.name === link.target_name)[0]
    const previous_node = data.nodes[link.idSource]
    previous_node.outputLinksId.splice(previous_node.outputLinksId.indexOf(selected_link.idLink), 1)

    const source_node = data.nodes[changeEvent.target.value]
    link.idSource = source_node.idNode
    source_node.outputLinksId.push(selected_link.idLink)

    set_data({ ...data })
  }

  const addDropSource = () => {
    if (Object.keys(data.nodes).length >= 2 && Object.keys(data.links).length != 0) {
      return (
        Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode} selected={selected_link.idSource === n.idNode} >{n.name}</option>)
      )
    }
  }
  const addDropCible = () => {
    if (Object.keys(data.nodes).length >= 2 && Object.keys(data.links).length != 0) {

      return (
        Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode} selected={selected_link.idTarget === n.idNode} >{n.name}</option>)
      )
    }
  }

  const target_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    const { nodes } = data
    const link = selected_link
    const previous_node = nodes[link.idTarget]
    previous_node.inputLinksId.splice(previous_node.inputLinksId.indexOf(selected_link.idLink), 1)

    const target_node = nodes[changeEvent.target.value]
    link.idTarget = target_node.idNode
    target_node.inputLinksId.push(selected_link.idLink)

    set_data({ ...data })
  }

  const addLabelId = () => {
    if (Object.keys(display_nodes).length != 0) {
      return selected_node.idNode
    }
  }

  const link = selected_link

  const props = {
    scroll: true,
    backdrop: false,
  }
  return (
    <>
      <Navbar className='bg-light' fixed='top' expand="xl" >
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
                <Dropdown.Item onClick={() => {
                  if (_load_simple_excel && _load_simple_excel.current) {
                    _load_simple_excel.current.name = ''
                    _load_simple_excel.current.click()
                  }
                }}
                >Excel simple
                </Dropdown.Item>
                <Form.Control
                  style={{ display: 'none' }}
                  ref={_load_simple_excel}
                  type="file"
                  onChange={(evt: ChangeEvent) => {
                    const files = (evt.target as HTMLFormElement).files
                    const form_data = new FormData()
                    form_data.append('file', files ? files[0] : '')
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
                      data.node_idx = Object.keys(data.nodes).length
                      data.link_idx = Object.keys(data.links).length
                      compute_auto_sankey(data, 200)
                      set_data({ ...data })
                    }
                    let root = window.location.href
                    if (root.includes('sankey-diagrams')) {
                      root = root.replace('sankey-diagrams/', '')
                    }
                    const url = root + url_prefix + 'sankey/upload_simple_excel'
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
                <Dropdown.Item onClick={() => uploadExemple(
                  'SyntheticOpenSankey/pommes_poires.xlsx', url_prefix, data, set_data, 
                  (server_data : SankeyData)=>{
                    compute_auto_sankey(server_data, server_data.h_space ? server_data.h_space : 200)
                  }
                )} >Pommes Poires Simple</Dropdown.Item>
                <Dropdown.Item onClick={() => uploadExemple(
                  'Energie/sankeys_territoire_.csv', url_prefix, data, set_data,
                  (server_data : SankeyData) => {
                    compute_default_input_outputLinksId(server_data.nodes, server_data.links)
                    updateLayout(server_data, (server_data as SankeyData & { layout: SankeyData }).layout)
                    Object.values(server_data.nodes).forEach(function (n) {
                      reorganize_node_inputLinksId(n, data.nodes, data.links)
                      reorganize_node_outputLinksId(n, data.nodes, data.links)
                    })
                    delete (data as SankeyData & { layout?: SankeyData }).layout
                  }                    
                )} >Energie</Dropdown.Item>
                <Dropdown.Item onClick={() => uploadExemple(
                  'Forêt Bois/Savoie/v1/filiere_foret_bois_savoie.json', url_prefix, data, set_data,
                  ()=> 0
                )} 
                >Forêt Bois Savoie v1</Dropdown.Item>
                <Dropdown.Item onClick={() => uploadExemple(
                  'Forêt Bois/Savoie/v2/filiere_foret_bois_savoie.json', url_prefix, data, set_data,
                  ()=> 0
                )} 
                >Forêt Bois Savoie v2</Dropdown.Item>
                <Dropdown.Item onClick={() => uploadExemple(
                  'Forêt Bois/Grand Est/filiere_foret_bois_grand_est.json', url_prefix, data, set_data,
                  ()=> 0
                )} 
                >Forêt Bois Grand Est</Dropdown.Item>
                <Dropdown.Item onClick={() => uploadExemple(
                  'Viande/filiere_viande.json', url_prefix, data, set_data,
                  ()=> 0
                )} 
                >Viande</Dropdown.Item>
                <Dropdown.Item onClick={() => uploadExemple(
                  'Lait/filiere_lait.json', url_prefix, data, set_data,
                  ()=> 0
                )}
                >Lait</Dropdown.Item>
                <NavDropdown.Divider />
                {example_menu}
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
            {right_menu}
          </Nav>
        </Container>
      </Navbar>
      <Offcanvas show={show_nav} placement='end' onHide={handleClose} {...props} style={{ 'width': '540px', 'margin-top': '70px' }}>
        <Offcanvas.Body style={{ 'padding': '0px' }}>
          <Accordion activeKey={nav_item_active as string} >
            <Accordion.Item
              eventKey="0"
              onClick={
                evt => {
                  if ((evt.target as any).className === 'accordion-button' && nav_item_active === '0') {
                    set_nav_item_active('')
                  } else {
                    set_nav_item_active('0')
                  }
                }
              }>
              <Accordion.Header>Shortcut</Accordion.Header>
              <Accordion.Body>
                <p>Fonctionnement des clics :</p><br />
                <p><b>CTRL + Click (noeuds) :</b> Selectionne le noeuds click dans l onglet Noeuds du menu</p>
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              eventKey="1"
              onClick={
                evt => {
                  if ((evt.target as any).className === 'accordion-button' && nav_item_active === '1') {
                    set_nav_item_active('')
                  } else {
                    set_nav_item_active('1')
                  }
                }
              }>
              <Accordion.Header>Paramêtres généraux</Accordion.Header>
              <Accordion.Body>
                {settings_edition}
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              eventKey="2"
              onClick={
                evt => {
                  if ((evt.target as any).className === 'accordion-button' && nav_item_active === '2') {
                    set_nav_item_active('')
                  } else {
                    set_nav_item_active('2')
                  }
                }
              }>
              <Accordion.Header>Noeuds</Accordion.Header>
              <Accordion.Body>
                <br />

                <Row >
                  <Col xs={1}>
                    <Button size="sm" style={{ 'marginBottom': '3px' }} onClick={add_new_node}>+</Button>
                  </Col>
                  <Col xs={10}>
                    <Form.Select id="selectionNode"
                      onChange={
                        (evt: React.ChangeEvent<HTMLSelectElement>) => {
                          set_selected_node(display_nodes[evt.target.value])
                        }
                      }
                    > {<option value={'default'} disabled={(selected_node.idNode === 'default') ? false : true} > Choisissez noeud</option>}
                      {Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode} selected={(selected_node.idNode != 'default' && n.idNode === selected_node.idNode) ? true : false} >{n.name}</option>)}
                    </Form.Select>
                  </Col>

                  <Col xs={1}>

                    <Button
                      size="sm"
                      variant='danger'
                      style={{ 'marginBottom': '3px' }}
                      onClick={
                        () => {
                          delete_node(data, selected_node)
                          set_selected_node(default_node())
                          set_data({ ...data })
                        }
                      }
                    >-</Button>

                  </Col>
                </Row>
                <Form>
                  <Form.Group as={Row} >
                    <Col xs={2} >
                      <FormLabel >Nom</FormLabel>
                    </Col>
                    <Col xs={7} >
                      <FormControl
                        value={selected_node.name}
                        onChange={evt => {
                          selected_node.name = evt.target.value
                          set_data({ ...data })
                        }}
                      />
                    </Col>
                    <Col xs={3}>
                      <FormLabel >(id : {addLabelId()})</FormLabel>
                    </Col>
                  </Form.Group>
                  {/* <Form.Group as={Row} >
                    <Col xs={2}>
                      <FormLabel >Parent</FormLabel>
                    </Col>
                    <Col xs={10}>
                      <Form.Select
                        onChange={
                          (evt: React.ChangeEvent<HTMLSelectElement>) => {
                            selected_node.dimensions[data.dimension_name].parent_name = evt.target.value
                            set_data({ ...data })
                          }
                        }
                      > <option>Choisissez parent</option>
                        {Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode} selected={selected_node.dimensions[data.dimension_name].parent_name === n.idNode} >{n.name}</option>)}
                      </Form.Select>
                    </Col>
                  </Form.Group> */}
                </Form>
                <Form>
                  <Form.Group as={Row} >
                    <Col xs={2}>
                      <FormLabel>Héritage</FormLabel>
                    </Col>
                    <Col xs={2}>
                      <FormCheck
                        value="general"
                        type='radio'
                        label='Général'
                        checked={node.node_parameter === 'general'}
                        onChange={evt => {
                          console.log(evt.target.value)
                          node.node_parameter = evt.target.value
                          set_data({ ...data })
                        }}
                      />
                    </Col>
                    <Col xs={3}>
                      <FormCheck
                        value="groupTag"
                        type='radio'
                        label='Groupe Tag'
                        checked={node.node_parameter === 'groupTag'}
                        onChange={evt => {
                          node.node_parameter = evt.target.value
                          set_data({ ...data })
                        }}
                      />
                    </Col>
                    <Col xs={2}>
                      <FormCheck
                        value="local"
                        type='radio'
                        label='local'
                        checked={node.node_parameter === 'local'}
                        onChange={evt => {
                          console.log(evt.target.value)
                          node.node_parameter = evt.target.value
                          set_data({ ...data })
                        }}
                      />
                    </Col>
                  </Form.Group>
                </Form>


                {/* 
                  {(radio_selected === 'GroupTag') ? (
                    < Form.Select >
                      {tags_catalog.filter(d => {
                        return (
                          Object.keys(nodes[selected_node].tags).includes(d.group_name) && nodes[selected_node].tags[d.group_name].length>0
                        )
                      })
                        .map(d => <option key={d.group_name}>{d.group_name}</option>)}
                    </Form.Select>
                    
                  ) : (<></>)} */}



                <br />
                {node_edition}

              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              eventKey="3"
              onClick={evt => {
                if ((evt.target as any).className === 'accordion-button' && nav_item_active === '3') {
                  set_nav_item_active('')
                } else {
                  set_nav_item_active('3')
                }
              }}
            >
              <Accordion.Header>Links</Accordion.Header>
              <Accordion.Body>
                <Row>
                  <Col xs={1}>

                    <Button
                      size="sm"
                      variant="success"
                      onClick={
                        () => {
                          add_new_link()
                          set_data({ ...data })
                        }
                      }
                    >+</Button>

                  </Col>
                  <Col xs={10}>
                    <Form.Select id="selectionLink"
                      onChange={
                        (evt: React.ChangeEvent<HTMLSelectElement>) => {
                          const newLink = Object.values(display_links).filter(f => { return f.idLink == evt.target.value })[0]
                          set_selected_link(newLink)
                          set_data({ ...data })
                        }
                      }
                    >
                      {Object.values(data.links).map((l, i) => <option key={i} value={l.idLink} selected={l.idLink == selected_link.idLink}  >{display_nodes[l.idSource].name + ' -> ' + display_nodes[l.idTarget].name}</option>)}
                    </Form.Select>
                  </Col>

                  <Col xs={1}>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={
                        () => {
                          delete_link(data, selected_link)
                          set_selected_link(default_link())

                          set_data({ ...data })
                        }
                      }
                    >-</Button>
                  </Col>

                </Row>
                <br />

                <Row>
                  <Col>
                    <FormLabel>Source</FormLabel>
                  </Col>
                  <Col>
                    <Form.Select onChange={source_change}>
                      {addDropSource()}
                    </Form.Select>
                  </Col>
                </Row>
                <br></br>
                <Row>
                  <Col>
                    <FormLabel>Cible</FormLabel>
                  </Col>
                  <Col>
                    <Form.Select onChange={target_change}>
                      {addDropCible()}
                    </Form.Select>
                  </Col>
                </Row>
                <br></br>
                <Row>
                  <Col>
                    <FormLabel>Valeur</FormLabel>
                  </Col>
                  <Col>
                    <Form.Control
                      type='text'
                      value={link.value[value_index]}
                      onChange={
                        (evt) => {
                          console.log(selected_link)
                          console.log(selected_link.value[value_index])
                          selected_link.value[value_index] = +evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Row>
                {link_edition}
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              eventKey="4"
              onClick={
                evt => {
                  if ((evt.target as any).className === 'accordion-button' && nav_item_active === '4') {
                    set_nav_item_active('')
                  } else {
                    set_nav_item_active('4')
                  }
                }
              }>
              <Accordion.Header>Tags</Accordion.Header>
              <Accordion.Body>
                {settings_edition_tags}
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              eventKey="5"
              onClick={
                evt => {
                  if ((evt.target as any).className === 'accordion-button' && nav_item_active === '5') {
                    set_nav_item_active('')
                  } else {
                    set_nav_item_active('5')
                  }
                }
              }>
              <Accordion.Header>Niveaux agrégation</Accordion.Header>
              <Accordion.Body>
                <Row>
                  <Col>
                    <FormLabel>Niveau agrégation</FormLabel>
                  </Col>
                  <Col>
                    <Form.Select id="selectionNode"
                      onChange={
                        (evt: React.ChangeEvent<HTMLSelectElement>) => {
                          if (evt.target.value ==='') {
                            return
                          }
                          for (let level = 1; level <= +evt.target.value+1; level++) {
                            set_nodes_level(display_nodes,level)
                          }
                          set_agregation_level(+evt.target.value)
                          set_data({...data})
                        }
                      }
                    >
                      {[...Array(nb_agregation_level).keys()].map( level => <option key={level} value={(level as unknown) as string} selected={level === agregation_level} >{'Niveau ' + (level+1)}</option>)}
                    </Form.Select>
                  </Col>
                </Row>
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item 
              eventKey="6" 
              onClick={ 
                evt => {
                  if ((evt.target as any).className === 'accordion-button' && nav_item_active === '6' ) {
                    set_nav_item_active('')
                  } else {
                    set_nav_item_active('6')                  
                  }
                }
              }>
              <Accordion.Header>Aide</Accordion.Header>
              <Accordion.Body>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Offcanvas.Body>
      </Offcanvas>

      {
        processing ? (
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


