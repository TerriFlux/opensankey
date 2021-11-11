import React, { ChangeEvent, FunctionComponent, useRef, useState } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form, FormControl, FormLabel, Row, Col, Modal, Navbar, Nav, NavDropdown, Button, ButtonGroup, Dropdown, Container, Offcanvas, ToggleButton } from 'react-bootstrap'
import { SankeyData, SankeyNode, SankeyDataPropTypes, SankeyLink } from './types'
import { convert_data } from './SankeyConvert'
import { compute_auto_sankey } from './SankeyLayout'
import FileSaver from 'file-saver'
import { default_sankey_data, delete_node, default_node,delete_link, default_link,uploadExemple } from './SankeyUtils'
import Accordion from 'react-bootstrap/Accordion'
import { SankeySettingsEdition, SankeySettingsEditionTags } from './SankeySettingsEdition'
import SankeyNodeEdition from './SankeyNodeEdition'
import SankeyLinkEdition from './SankeyLinkEdition'

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
  nav_item_active: PropTypes.string.isRequired,
  set_selected_node: PropTypes.func.isRequired,
  selected_node: PropTypes.number.isRequired,
  set_selected_link: PropTypes.func.isRequired,
  selected_link: PropTypes.number.isRequired,
  set_selected_id_link: PropTypes.func.isRequired,
  selected_id_link: PropTypes.string.isRequired,
  example_menu: PropTypes.element,
  url_prefix: PropTypes.string.isRequired,
  getValueIndex: PropTypes.func.isRequired
}


type MenuTypes = InferProps<typeof MenuPropTypes>

const Menu: FunctionComponent<MenuTypes> = (
  { data, set_data, open_menu, save_menu, edition_menu, right_menu, app_name,
    set_show_nav, show_nav, set_nav_item_active, nav_item_active,
    set_selected_node, selected_node, set_selected_link, selected_link,
    set_selected_id_link, selected_id_link,example_menu,url_prefix,
    getValueIndex
  }
) => {
  const set_show_link = useState(true)[1]
  const [duplicate, set_duplicate] = useState(false)

  const { links, nodes } = data

  const add_new_node = () => {
    const { nodes } = data
    // permet de definir un id unique (même en cas de delete node)
    let nId = 'node0'
    let newId = 0
    // nodes.map((n, i) => {
    // //   if (n.id > max) {
    // //     max = n.id
    // //   }
    // // })
    if (nodes.length > 0) {
      nId = (nodes[nodes.length - 1].idNode as string)
      newId = parseInt(nId.replace('node', '')) + 1
    }

    const node: SankeyNode = default_node()
    node.id = newId
    node.idNode = 'node' + newId
    node.name = 'n' + newId
    // node.x = nodes.length * 50
    node.x = newId * 50
    nodes.push(node)
    set_selected_node(nodes.length - 1)
    set_data({ ...data })
    // console.log(JSON.parse(JSON.stringify(nodes)))
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

  if (selected_id_link == '' && links.length != 0) {
    selected_id_link = (links[0].idLink as string)
  }

  const add_new_link = () => {
    const { nodes, links } = data

    if (nodes.length < 2) {
      return
    }
    const link: SankeyLink = default_link()
    const link_pos = links.length

    links.push(link)
    link.idLink = 'link' + links.length
    link.source_name = nodes[0].name
    link.target_name = nodes[1].name

    nodes[0].output_links.push(link_pos)
    nodes[1].input_links.push(link_pos)

    set_selected_link(links.length - 1)
    set_data({ ...data })
    set_show_link(true)
  }

  const [radio_selected, set_radio_selected] = useState<string>('local')

  if (selected_node === -1) {
    selected_node = 0
  }
  let node = nodes[selected_node]
  if (node === undefined) {
    node = default_node()
  }

  const source_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    const { nodes, links } = data
    let link = links[selected_link]
    if (duplicate) {
      link = JSON.parse(JSON.stringify(links[selected_link]))
      links.push(link)
      selected_link = links.length - 1
      const target_node = nodes.filter(n => n.name === link.target_name)[0]
      target_node.input_links.push(selected_link)
    } else {
      console.log('========1=============')
      //Causait un problème d'acumulation de la valeur de des differents link sur des noeuds non associé
      // const previous_node = nodes.filter(n => n.name === link.target_name)[0]
      const previous_node = nodes.filter(n => n.name === link.source_name)[0]

      const link_pos = previous_node.output_links.indexOf(selected_link)
      previous_node.output_links.splice(link_pos, 1)
    }

    const source_node = nodes.filter(n => n.name === changeEvent.target.value)[0]
    link.source_name = source_node.name
    source_node.output_links.push(selected_link)

    set_data({ ...data })
  }

  const addDropSource = () => {
    if (nodes.length >= 2 && links.length != 0) {
      return (
        nodes.map((n, i) => <option key={i} value={n.name} selected={links[selected_link].source_name === n.name} >{n.name}</option>)
      )
    }
  }
  const addDropCible = () => {
    if (nodes.length >= 2 && links.length != 0) {

      return (
        nodes.map((n, i) => <option key={i} value={n.name} selected={links[selected_link].target_name === n.name} >{n.name}</option>)
      )
    }
  }

  const target_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    const { nodes, links } = data
    let link = links[selected_link]
    if (duplicate) {
      link = JSON.parse(JSON.stringify(links[selected_link]))
      links.push(link)
      selected_link = links.length - 1
      const source_node = nodes.filter(n => n.name === link.source_name)[0]
      source_node.output_links.push(selected_link)
    } else {
      const previous_node = nodes.filter(n => n.name === link.target_name)[0]
      const link_pos = previous_node.input_links.indexOf(selected_link)
      previous_node.input_links.splice(link_pos, 1)
    }

    const target_node = nodes.filter(n => n.name === changeEvent.target.value)[0]
    link.target_name = target_node.name
    target_node.input_links.push(selected_link)

    set_data({ ...data })
  }


  const addLabelId = () => {
    if (nodes.length != 0) {
      return nodes[selected_node].idNode
    }
  }

  const selected_links: SankeyLink[] = []
  const the_link = links[selected_link]
  selected_links.push(the_link)

  let link = links[selected_link]
  if (selected_links[0] === undefined) {
    selected_links[0] = default_link()
    link = selected_links[0]
  }

  let region_index = 0
  const tags_group = data.tags_catalog['Regions']
  if (tags_group) {
    region_index = 0
    Object.keys(tags_group.tags).forEach((tag_key,i)=> {
      if (tags_group.tags[tag_key].selected) {
        region_index = i
      }
    })
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
                    let root = window.location.href
                    if (root.includes('sankey-diagrams')) {
                      root = root.replace('sankey-diagrams/','')
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
                <Dropdown.Item onClick={()=>uploadExemple('pommes_poires.xlsx',url_prefix,data,set_data)} >Pommes Poires Simple</Dropdown.Item>
                <Dropdown.Item onClick={()=>uploadExemple('sankeys_territoire_.csv',url_prefix,data,set_data)} >Energie</Dropdown.Item>
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
            <Accordion.Item eventKey="0" onClick={() => set_nav_item_active('0')}>
              <Accordion.Header>Shortcut</Accordion.Header>
              <Accordion.Body>
                <p>Fonctionnement des clics :</p><br />
                <p><b>CTRL + Click (noeuds) :</b> Selectionne le noeuds clicke dans l onglet Noeuds du menu</p>
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="1" onClick={() => set_nav_item_active('1')} >
              <Accordion.Header>Paramêtres généraux</Accordion.Header>
              <Accordion.Body>
                <SankeySettingsEdition
                  data={data}
                  set_data={set_data}
                  set_current_filter={(
                    new_current_filter: number
                  ) => {
                    const { display_style } = data
                    display_style.filter = +new_current_filter
                    set_data({ ...data })
                  }}
                  getValueIndex={getValueIndex}
                />
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="2" onClick={() => set_nav_item_active('2')}>
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
                          set_selected_node(nodes.filter(f => { return f.name == evt.target.value })[0].id)
                        }
                      }
                    >
                      {nodes.map((n, i) => <option key={i} value={n.name} selected={nodes[i].idNode === nodes[selected_node].idNode} >{nodes[i].name}</option>)}
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
                          // on change le selected_node car il n'existe plus, met le dernier node de la liste nodes
                          set_selected_node(data.nodes.length - 1)
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
                        value={node.name}
                        onChange={evt => {
                          const source_links = links.filter(l => l.source_name === nodes[selected_node].name)
                          const target_links = links.filter(l => l.target_name === nodes[selected_node].name)
                          source_links.forEach(l => l.source_name = evt.target.value)
                          target_links.forEach(l => l.target_name = evt.target.value)
                          nodes[selected_node].name = evt.target.value
                          set_data({ ...data })
                        }}
                      />
                    </Col>
                    <Col xs={3}>
                      <FormLabel >(id : {addLabelId()})</FormLabel>
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col xs={2}>
                      <FormLabel >Parent</FormLabel>
                    </Col>
                    <Col xs={10}>
                      <Form.Select
                        onChange={
                          (evt: React.ChangeEvent<HTMLSelectElement>) => {
                            nodes[selected_node].parent_name = evt.target.value
                            set_data({ ...data })
                          }
                        }
                      > <option>Choisissez parent</option>
                        {nodes.map((n, i) => <option key={i} value={n.name} selected={nodes[selected_node].parent_name === n.name} >{n.name}</option>)}
                      </Form.Select>
                    </Col>
                  </Form.Group>
                </Form>

                <Form>
                  <Form.Group as={Row} onChange={evt => {
                    console.log(evt)
                    // set_radio_selected(evt.target.value)
                    // node.nodeParameter=evt.target.value
                  }}>
                    <div key='radioTypeCouelurNoeud'>
                      <Form.Check inline type='radio' checked={radio_selected === 'Général'} name='TypeCouleurNoeud' id='radioGeneral' value='Général' label='Général'
                        onChange={evt => {
                          set_radio_selected(evt.target.value)
                          node.nodeParameter = evt.target.value
                        }} />
                      <Form.Check inline type='radio' checked={radio_selected === 'GroupTag'} name='TypeCouleurNoeud' id='radioGroupTag' value='GroupTag' label='GroupTag'
                        onChange={evt => {
                          set_radio_selected(evt.target.value)
                          node.nodeParameter = evt.target.value

                        }} />
                      <Form.Check inline type='radio' checked={radio_selected === 'local'} name='TypeCouleurNoeud' id='radioLocal' value='local' label='Local'
                        onChange={evt => {
                          set_radio_selected(evt.target.value)
                          node.nodeParameter = evt.target.value

                        }} />
                    </div>


                  </Form.Group>

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


                </Form>

                <br />
                <SankeyNodeEdition
                  data={data}
                  set_data={set_data}
                  selected_node={selected_node}
                  radio_selected={radio_selected}
                />
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="3" onClick={() => set_nav_item_active('3')}>
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
                          const newLink = links.filter(f => { return f.idLink == evt.target.value })[0].idLink
                          let newLinkId = 0
                          links.map((d, i) => {
                            if (d.idLink == evt.target.value) {
                              newLinkId = i
                            }
                          })
                          // console.log(newLinkId)
                          console.log(nodes)

                          // set_selected_id_link(links.filter(f => { return f.idLink == evt.target.value })[0].idLink)
                          set_selected_id_link(newLink)
                          set_selected_link(newLinkId as number)

                          set_data({ ...data })
                          // console.log(selected_link)

                        }
                      }
                    >
                      {links.map((n, i) => <option key={i} value={n.idLink as string} selected={n.idLink == selected_id_link}  >{n.idLink}</option>)}
                    </Form.Select>
                  </Col>

                  <Col xs={1}>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={
                        () => {
                          delete_link(data, selected_link)
                          set_selected_link(links.length - 1)

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
                      value={link.value[region_index]}
                      onChange={
                        (evt) => {
                          console.log(selected_link)
                          console.log(links[selected_link].value[region_index])
                          links[selected_link].value[region_index] = +evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Row>

                <SankeyLinkEdition
                  show={true}
                  data={data}
                  set_data={set_data}
                  set_show_link={set_show_link}
                  selected_link={selected_link}
                  selected_id_link={selected_id_link}
                  set_selected_id_link={set_selected_id_link}
                  duplicate={duplicate}
                  set_duplicate={set_duplicate}
                  getValueIndex={getValueIndex}
                />
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="4" onClick={() => set_nav_item_active('4')}>
              <Accordion.Header>Tags</Accordion.Header>
              <Accordion.Body>
                <SankeySettingsEditionTags
                  data={data}
                  set_data={set_data}
                  getValueIndex={getValueIndex}
                />
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="5" onClick={() => set_nav_item_active('5')}>
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