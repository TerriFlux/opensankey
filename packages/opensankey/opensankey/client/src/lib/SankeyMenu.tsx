import React, { ChangeEvent, FunctionComponent, useRef, useState } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form, FormGroup, FormControl, FormLabel, Row, Col, Modal, Navbar, Nav, NavDropdown, Button, ButtonGroup, Dropdown, Container, Offcanvas, ToggleButton } from 'react-bootstrap'
import { SankeyData, SankeyNode, SankeyDataPropTypes, SankeyLink } from './types'
import { convert_data } from './SankeyConvert'
import { compute_auto_sankey } from './SankeyLayout'
import FileSaver from 'file-saver'
import { default_sankey_data, delete_node, default_node, default_link } from './SankeyUtils'
import Accordion from 'react-bootstrap/Accordion'
import { SankeySettingsEditionV2, SankeySettingsEditionTags } from './SankeySettingsEdition'
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

  selected_id_link: PropTypes.string.isRequired,

  set_selected_key_group_tag: PropTypes.func.isRequired,
  selected_key_group_tag: PropTypes.number.isRequired,
  key_tag: PropTypes.number.isRequired,
  set_key_tag: PropTypes.func.isRequired


}


type MenuTypes = InferProps<typeof MenuPropTypes>

const Menu: FunctionComponent<MenuTypes> = (
  { data, set_data, open_menu, save_menu, edition_menu, right_menu, app_name,
    set_show_nav, show_nav, set_nav_item_active, nav_item_active,
    set_selected_node, selected_node, set_selected_link, selected_link,
    set_selected_id_link, selected_id_link,
    set_selected_key_group_tag, selected_key_group_tag, key_tag, set_key_tag
  }
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

  const [key_group_tag, set_key_group_tag] = useState(0)
  const [duplicate, set_duplicate] = useState(false)

  const { display_style, links, nodes } = data

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
      nId = (nodes[nodes.length - 1].idNode as any)
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
      compute_auto_sankey(data, 200)
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
      Object.assign(data, server_data)
      convert_data(data)
      compute_auto_sankey(data, 200)
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


  const { tags_catalog, tags_catalog_v2 } = data
  const [tag_group_id, set_tag_group_id] = useState(0)
  const [radio_selected, set_radio_selected] = useState<string>('local')


  if (selected_node === -1) {
    selected_node = 0
  }
  let node = nodes[selected_node]
  if (node === undefined) {
    node = default_node()
  }
  if (tags_catalog.length > 0) {
    const tag_group_name = tags_catalog[tag_group_id].group_name
    if (!node.tags[tag_group_name]) {
      node.tags[tag_group_name] = []
    }
  }

  //---------------------------
  if (Object.keys(tags_catalog_v2).length > 0) {
    const tag_cat = tags_catalog_v2[selected_key_group_tag]
    if (tag_cat != undefined) {
      const tag_group_name = tag_cat.group_name
      if (!node.tags[tag_group_name]) {
        node.tags[tag_group_name] = []

      }
    }
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
  const tags_group_region = data.tags_catalog.filter(tags_group => tags_group.group_name === 'Regions')
  if (tags_group_region.length > 1) {
    region_index = tags_group_region[0].tags.indexOf(tags_group_region[0].selected_tags[0])
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
                  key_tag={key_tag}
                  key_group_tag={key_group_tag}
                  selected_key_group_tag={selected_key_group_tag}
                  set_key_tag={set_key_tag}
                  set_key_group_tag={set_key_group_tag}
                  set_selected_key_group_tag={set_selected_key_group_tag}
                />
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="2" >
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
                <SankeyNodeEditionV2
                  show={sga}
                  data={data}
                  set_data={set_data}
                  set_show_node={set_show_node}
                  selected_node={selected_node}
                  tag_group_id={tag_group_id}
                  set_tag_group_id={set_tag_group_id}
                  set_radio_selected={set_radio_selected}
                  radio_selected={radio_selected}
                  key_group_tag={key_group_tag}
                  selected_key_group_tag={selected_key_group_tag}
                  set_key_group_tag={set_key_group_tag}
                  set_selected_key_group_tag={set_selected_key_group_tag}
                />
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="3">
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
                      {links.map((n, i) => <option key={i} value={n.idLink as any} selected={n.idLink == selected_id_link}  >{n.idLink}</option>)}
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

                <SankeyLinkEditionV2
                  show={true}
                  data={data}
                  set_data={set_data}
                  set_show_link={set_show_link}
                  selected_link={selected_link}
                  selected_id_link={selected_id_link}
                  set_selected_id_link={set_selected_id_link}
                  duplicate={duplicate}
                  set_duplicate={set_duplicate}
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
                  key_tag={key_tag}
                  key_group_tag={key_group_tag}
                  selected_key_group_tag={selected_key_group_tag}
                  set_key_tag={set_key_tag}
                  set_key_group_tag={set_key_group_tag}
                  set_selected_key_group_tag={set_selected_key_group_tag}
                />
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="5">
              <Accordion.Header>Aide</Accordion.Header>
              <Accordion.Body>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Offcanvas.Body>
      </Offcanvas>

      {
        show_excel_dialog ? (
          <ExcelModal
            handleCloseDialog={handleCloseExcelDialog}
            uploadExcelImpl={uploadExcelImpl} />
        ) :
          (<div />)
      }
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