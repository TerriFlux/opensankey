/* eslint @typescript-eslint/no-var-requires: "off" */
import React, { ChangeEvent, FunctionComponent, useRef, useEffect, useState } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form, FormControl, FormLabel, Row, Col, Modal, Navbar, Nav, NavDropdown, Button, ButtonGroup, Dropdown, FormCheck, Container, Offcanvas, ToggleButton } from 'react-bootstrap'
import { SankeyData, SankeyNode, SankeyDataPropTypes, SankeyLink, SankeyNodePropTypes, SankeyLinkPropTypes } from './types'
import { convert_data } from './SankeyConvert'
import { compute_auto_sankey } from './SankeyLayout'
import FileSaver from 'file-saver'
import { default_sankey_data, delete_node, default_node, delete_link, default_link, uploadExemple, set_nodes_level } from './SankeyUtils'
import Accordion from 'react-bootstrap/Accordion'
import { FaPlus, FaMinus } from 'react-icons/fa'
import * as d3 from 'd3'
import { MultiSelect } from 'react-multi-select-component'
import SankeyEdition from './SankeyEdition'


const MenuPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  open_menu: PropTypes.element,
  save_menu: PropTypes.element,
  edition_menu: PropTypes.element,
  right_menu: PropTypes.element,
  settings_edition: PropTypes.element,
  settings_edition_tags: PropTypes.element,
  settings_edition_tags_links: PropTypes.element,
  node_edition: PropTypes.element,
  link_edition: PropTypes.element,
  logo: PropTypes.string.isRequired,
  app_name: PropTypes.string.isRequired,
  set_show_nav: PropTypes.func.isRequired,
  show_nav: PropTypes.bool,
  set_nav_item_active: PropTypes.func.isRequired,
  nav_item_active: PropTypes.string.isRequired,
  set_selected_node: PropTypes.func.isRequired,
  selected_node: PropTypes.shape(SankeyNodePropTypes).isRequired,

  set_multi_selected_node: PropTypes.func.isRequired,
  multi_selected_node: PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired,

  set_multi_selected_links: PropTypes.func.isRequired,
  multi_selected_links: PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired,


  set_selected_link: PropTypes.func.isRequired,
  selected_link: PropTypes.shape(SankeyLinkPropTypes).isRequired,
  example_menu: PropTypes.element,
  portfolio_menu: PropTypes.element,
  url_prefix: PropTypes.string.isRequired,

  agregation_level: PropTypes.number.isRequired,
  set_agregation_level: PropTypes.func.isRequired

}


type MenuTypes = InferProps<typeof MenuPropTypes>

export const ArtefactsItem = ({ artefacts_menu, current_path }: any) => {
  return (
    <>
      { Array.isArray(artefacts_menu)
        ? artefacts_menu.map((item, index) => {
          let url = window.location.origin + '/fm/userfiles/' + current_path + '/artefacts/' + item
          if (!item.includes('zip')) {
            url = url + '/index.html'
          }
          return (
            <Dropdown.Item key={index} href={url} target="_blank">{item}</Dropdown.Item>
          )
        }
        ) : Object.keys(artefacts_menu).map(
          (key, index) => {
            return (
              <>
                <NavDropdown key={index} title={key} id={key} >
                  <ArtefactsItem
                    artefacts_menu={artefacts_menu[key]}
                    current_path={current_path !== '' ? current_path + '/' + key : key}
                  />
                </NavDropdown>
              </>
            )
          }
        )
      }
    </>
  )
}

export const ExempleItem = ({ exemple_menu, url_prefix, data, set_data, current_path }: any) => {
  return (
    <>
      { Array.isArray(exemple_menu)
        ? exemple_menu.map((item, index) => {
          let callback = (server_data: SankeyData) => 0
          let path = current_path + '/sankey/' + item
          if (item.includes('simple.xlsx')) {
            path = current_path + '/' + item
            callback = (server_data: SankeyData) => {
              set_nodes_level(server_data.nodes, 2)
              compute_auto_sankey(server_data, server_data.h_space ? server_data.h_space : 200)
              set_nodes_level(server_data.nodes, 1)
              compute_auto_sankey(server_data, server_data.h_space ? server_data.h_space : 200)
              return 0
            }
          }
          return (
            <Dropdown.Item
              onClick={() => uploadExemple(
                path, url_prefix, data, set_data, callback
              )}
            >{item.split('.')[0].replace(/_/g, ' ').replace(' layout', '').replace('simple.xlsx', ' xl').split(/(?=[A-Z0-9])/).join(' ').replace('A F M', 'AFM').replace('T E C', 'TEC')}</Dropdown.Item>
          )
        }
        ) : Object.keys(exemple_menu).map(
          (key, index) => {
            return (
              <>
                <NavDropdown title={key} id={key} >
                  <ExempleItem
                    exemple_menu={exemple_menu[key]}
                    url_prefix={url_prefix}
                    data={data}
                    set_data={set_data}
                    current_path={current_path !== '' ? current_path + '/' + key : key}
                  />
                </NavDropdown>
              </>
            )
          }
        )
      }
    </>
  )
}

const Menu: FunctionComponent<MenuTypes> = (
  { data, set_data,
    open_menu, save_menu, edition_menu, right_menu,
    settings_edition, settings_edition_tags, settings_edition_tags_links, node_edition, link_edition,
    logo, app_name,
    set_show_nav, show_nav, set_nav_item_active, nav_item_active,
    set_selected_node, selected_node,
    set_multi_selected_node, multi_selected_node,
    set_multi_selected_links, multi_selected_links,
    set_selected_link, selected_link,
    example_menu, portfolio_menu, url_prefix,
    agregation_level,
    set_agregation_level,
  }
) => {
  const set_show_link = useState(true)[1]

  const display_nodes = data.nodes
  const display_links = data.links
  //const { dataTags } = data
  let nb_agregation_level = 0
  Object.values(data.nodes).forEach(n => {
    if (!n.dimensions) {
      return
    }
    Object.entries(n.dimensions).forEach(dim => {
      if (!dim[1].level) {
        return
      }
      nb_agregation_level = dim[1].level as number > nb_agregation_level ? dim[1].level as number : nb_agregation_level
    })
  })

  const add_new_node = () => {
    const { nodes } = data
    const node: SankeyNode = default_node(data)

    // Méthode pour incrementer idNode
    const listId: number[] = []
    Object.keys(data.nodes).forEach(elt => listId.push(Number(elt.replace('node', ''))))
    const idNode = listId.length > 0 ? Math.max(...listId) + 1 : 0
    node.idNode = 'node' + idNode
    node.name = node.idNode
    node.x = Object.keys(nodes).length * 200 + 200
    nodes[node.idNode] = node
    for (const tag_group_key in data.tags_catalog) {
      node.tags[tag_group_key] = []
    }
    set_selected_node(node)
    set_multi_selected_node([node])
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

  const clickSaveExcel = () => {
    let root = window.location.href
    if (root.includes('sankey-diagrams') && url_prefix !== '') {
      root = root.replace('sankey-diagrams/', '')
    }
    let url = root + url_prefix + 'sankey/save_excel'
    const fetchData = {
      method: 'POST',
      body: JSON.stringify(data)
    }
    const showFile = (blob: BlobPart) => {
      const newBlob = new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      FileSaver.saveAs(newBlob, 'sankey.xlsx')
    }
    const cleanFile = () => {
      const fetchData = {
        method: 'POST'
      }
      url = root + url_prefix + 'sankey/clean_excel'
      fetch(url, fetchData)
    }

    fetch(url, fetchData).then(
      r => r.blob()
    )
      .then(showFile).then(cleanFile)
  }

  const clickSaveSVG = () => {
    const svg = window.d3.select('#svg-container svg')
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
    const svg = window.d3.select('#svg-container svg')
    svg.selectAll('.tooltip').remove()
    svg.selectAll('text[visibility=hidden]').remove()
    svg.attr('viewBox', [0, 0, data.width, data.height])
    const html = ((svg.attr('title', 'test2')
      .attr('version', 1.1)
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .node() as HTMLElement).parentNode as HTMLElement).innerHTML

    const blob = new Blob([html], { type: 'image/svg+xml' })
    const form_data = new FormData()
    form_data.append('svg', blob)

    const path = window.location.href
    let url = path + 'sankey/save_pdf'
    const fetchData = {
      method: 'POST',
      body: form_data
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
    const link: SankeyLink = default_link(data)
    // Méthode pour incrementer idNode
    const listId: number[] = []
    Object.keys(data.links).forEach(elt => listId.push(Number(elt.replace('link', ''))))
    const idLink = listId.length > 0 ? Math.max(...listId) + 1 : 0
    link.idLink = 'link' + idLink
    links[link.idLink] = link
    const node_keys = Object.keys(nodes)
    link.idSource = nodes[node_keys[0]].idNode
    link.idTarget = nodes[node_keys[1]].idNode

    nodes[node_keys[0]].outputLinksId.push(link.idLink)
    nodes[node_keys[1]].inputLinksId.push(link.idLink)

    set_selected_link(link)
    set_multi_selected_links([link])
    set_data({ ...data })
    set_show_link(true)
  }

  let node = data.nodes[selected_node.idNode]
  if (node === undefined) {
    node = default_node(data)
  }

  const source_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    // const link = selected_link
    const link = multi_selected_links[0]
    //Causait un problème d'acumulation de la valeur de des differents link sur des noeuds non associé
    // const previous_node = nodes.filter(n => n.name === link.target_name)[0]
    const previous_node = data.nodes[link.idSource]
    // previous_node.outputLinksId.splice(previous_node.outputLinksId.indexOf(selected_link.idLink), 1)
    previous_node.outputLinksId.splice(previous_node.outputLinksId.indexOf(multi_selected_links[0].idLink), 1)

    const source_node = data.nodes[changeEvent.target.value]
    link.idSource = source_node.idNode
    // source_node.outputLinksId.push(selected_link.idLink)
    source_node.outputLinksId.push(multi_selected_links[0].idLink)

    if (link.idTarget === link.idSource) {
      link.recycling = true
    }
    set_data({ ...data })
  }

  const addDropSource = () => {
    if (Object.keys(data.nodes).length >= 2 && Object.keys(data.links).length != 0 && multi_selected_links.length != 0) {
      return (
        // Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode} selected={selected_link.idSource === n.idNode} >{n.name}</option>)
        Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode} selected={multi_selected_links[0].idSource === n.idNode} >{n.name}</option>)
      )
    }
  }
  const addDropCible = () => {
    if (Object.keys(data.nodes).length >= 2 && Object.keys(data.links).length != 0 && multi_selected_links.length != 0) {
      return (
        // Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode} selected={selected_link.idTarget === n.idNode} >{n.name}</option>)
        Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode} selected={multi_selected_links[0].idTarget === n.idNode} >{n.name}</option>)
      )
    }
  }

  const target_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    const { nodes } = data
    // const link = selected_link
    const link = multi_selected_links[0]
    const previous_node = nodes[link.idTarget]
    // previous_node.inputLinksId.splice(previous_node.inputLinksId.indexOf(selected_link.idLink), 1)
    previous_node.inputLinksId.splice(previous_node.inputLinksId.indexOf(multi_selected_links[0].idLink), 1)

    const target_node = nodes[changeEvent.target.value]
    link.idTarget = target_node.idNode
    if (link.idTarget === link.idSource) {
      link.recycling = true
    }
    // target_node.inputLinksId.push(selected_link.idLink)
    target_node.inputLinksId.push(multi_selected_links[0].idLink)

    set_data({ ...data })
  }

  const INITIAL_OPTIONS = Object.values(data.nodes).map((d) => { return { 'label': d.name, 'value': d.name } })
  const selected = multi_selected_node.map((d) => { return { 'label': d.name, 'value': d.name } })
  const props = {
    scroll: true,
    backdrop: false,
  }
  const dropdownMultiNode = () => {
    const DD = (
      <div id='DD_multi_node'>


        <MultiSelect
          valueRenderer={(selected: any, _options: any) => {
            return selected.length ? selected.map(({ label }: any) => label + ', ') : 'Aucun noeud sélectionné'
          }}
          options={INITIAL_OPTIONS}
          value={selected}
          onChange={(selected: [{ label: string, value: string }]) => {
            const new_sel = selected.map(d => d.value)
            const m_s = Object.values(data.nodes).filter(d => (new_sel.includes(d.name)))
            set_multi_selected_node(m_s)
          }}
          labelledBy={'hello'}
        />
      </div>)
    return DD
  }



  const INITIAL_OPTIONS_LINKS = Object.values(data.links).map((d) => { return { 'label': d.idLink, 'value': d.idLink } })
  const selected_links = multi_selected_links.map((d) => { return { 'label': d.idLink, 'value': d.idLink } })
  const dropdownMultiLinks = () => {
    const DD = (
      <div id='DD_multi_links'>
        <MultiSelect
          valueRenderer={(selected: any, _options: any) => {
            return selected.length ? selected.map(({ label }: any) => label + ', ') : 'Aucun flux sélectionné'
          }}
          options={INITIAL_OPTIONS_LINKS}
          value={selected_links}
          onChange={(selected: [{ label: string, value: string }]) => {
            const new_sel = selected.map(d => d.value)
            const m_s = Object.values(data.links).filter(d => (new_sel.includes(d.idLink)))
            set_multi_selected_links(m_s)
          }}
          labelledBy={'hello'}
        />
      </div>)
    return DD
  }


  const [modalshow, setModalShow] = useState(false)

  const handleModalClose = () => setModalShow(false)
  const handleModalShow = () => setModalShow(true)


  return (
    <>
      <Modal show={modalshow} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Suppression noeud connecté</Modal.Title>
        </Modal.Header>
        <Modal.Body>Êtes-vous sûr de vouloir supprimer ce noeud ? Il est relié à différents flux:

        Entrant:
        {node.inputLinksId.map(k => { return <> <br /> -{data.nodes[data.links[k].idSource].name} </> })}<br />

        Sortant:
        {node.outputLinksId.map(k => { return <> <br /> -{data.nodes[data.links[k].idTarget].name} </> })}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Refuse
          </Button>
          <Button variant="primary" onClick={() => {
            delete_node(data, selected_node)
            set_selected_node(default_node(data))
            set_data({ ...data })
            handleModalClose()
          }}>
            Accept
          </Button>
        </Modal.Footer>
      </Modal>

      <Navbar className='bg-light' fixed='top' style={{ 'display': 'block' }} >
        <Container>

          <Navbar.Brand href="#"><img src={logo} width="100" /> {app_name} </Navbar.Brand>
          <Form.Check
            type="switch"
            checked={data.static_sankey}
            onClick={(evt: any) => {
              data.static_sankey = evt.target.checked
              set_data({ ...data })
            }}
            label="Static"
          />
          <Nav>
            <NavDropdown title="Fichiers" id="files" >
              <NavDropdown id='ouvrir' title="Ouvrir" >
                <Dropdown.Item
                  onClick={() => {
                    if (_load_json.current) {
                      _load_json.current.name = ''
                      _load_json.current.click()
                    }
                  }} >JSON</Dropdown.Item>
                <Form.Control
                  type="file"
                  ref={_load_json}
                  style={{ display: 'none' }}
                  onChange={(evt: ChangeEvent) => {
                    const files = (evt.target as HTMLFormElement).files
                    const reader = new FileReader()
                    reader.onload = (() => {
                      return (e: ProgressEvent<FileReader>) => {
                        let result = String((e.target as FileReader).result)
                        const new_data = default_sankey_data()
                        result = result.split('<br>').join('\\\\n')
                        const result_data = JSON.parse(result)
                        Object.assign(new_data, result_data)
                        if (result_data.version === undefined) {
                          (new_data.version as any) = undefined
                        }
                        convert_data(new_data)
                        let height = 0
                        Object.values(new_data.nodes).forEach(n => height = (n.y && n.node_visible) ? Math.max(height, n.y) : height)
                        let min_height = 2000
                        Object.values(new_data.nodes).forEach(n => min_height = (n.y && n.node_visible) ? Math.min(min_height, n.y) : min_height)
                        let max_vert_shift = 0
                        Object.values(new_data.links).forEach(l => max_vert_shift = l.vert_shift ? Math.max(max_vert_shift, l.vert_shift) : max_vert_shift)

                        new_data.height = Math.max(500, height + max_vert_shift + 200)
                        set_data(new_data)
                      }
                    })()
                    reader.readAsText(files[0])
                  }}
                />
                <Dropdown.Item
                  onClick={() => {
                    if (_load_simple_excel && _load_simple_excel.current) {
                      _load_simple_excel.current.name = ''
                      _load_simple_excel.current.click()
                    }
                  }}>Excel simple</Dropdown.Item>
                <Form.Control
                  type="file"
                  ref={_load_simple_excel}
                  style={{ display: 'none' }}
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
                      compute_auto_sankey(data, 200)
                      let height = 0
                      Object.values(data.nodes).forEach(n => height = (n.y && n.node_visible) ? Math.max(height, n.y) : height)
                      let min_height = 2000
                      Object.values(data.nodes).forEach(n => min_height = (n.y && n.node_visible) ? Math.min(min_height, n.y) : min_height)
                      let max_vert_shift = 0
                      Object.values(data.links).forEach(l => max_vert_shift = l.vert_shift ? Math.max(max_vert_shift, l.vert_shift) : max_vert_shift)

                      data.height = Math.max(500, height + max_vert_shift + 200)
                      set_data({ ...data })
                    }
                    let root = window.location.href
                    if (root.includes('sankey-diagrams')) {
                      root = root.replace('sankey-diagrams/', '')
                    }
                    const url = root + url_prefix + '/sankey/upload_simple_excel'
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
                <Dropdown.Item onClick={clickSaveExcel} >Excel</Dropdown.Item>
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
            <NavDropdown title="Exemples" id="exemples" >
              {example_menu}
            </NavDropdown >
            <NavDropdown title="Portfolio" id="portfolio" >
              {portfolio_menu}
            </NavDropdown >
            {!data.static_sankey ? (
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
              </ButtonGroup>) : (<></>)
            }
            {right_menu}
          </Nav>
        </Container>
        <SankeyEdition
          data={data}
          set_data={set_data} />
      </Navbar>
      <Offcanvas show={show_nav} placement='end' onHide={handleClose} {...props} style={{ 'width': '540px', 'margin-top': '70px' }}>
        <Offcanvas.Body style={{ 'padding': '0px' }}>
          <Accordion activeKey={nav_item_active as string} >
            {//MENU AIDE 
            }

            <Accordion.Item
              eventKey="1"
              onClick={
                evt => {
                  if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === '1') {
                    set_nav_item_active('')
                  } else {
                    set_nav_item_active('1')
                  }
                }
              }>
              {
                //MENU PARAMETRE GENERAUX
              }
              <Accordion.Header>Paramêtres généraux</Accordion.Header>
              <Accordion.Body>
                {settings_edition}
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              eventKey="2"
              onClick={
                evt => {
                  if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === '2') {
                    set_nav_item_active('')
                  } else {
                    set_nav_item_active('2')
                  }
                }
              }>
              {
                //PARAMETRE NOEUD
              }
              <Accordion.Header>Noeuds</Accordion.Header>
              <Accordion.Body>
                <Row >
                  <Col xs={1}>
                    <Button size="sm" onClick={add_new_node}><FaPlus /></Button>
                  </Col>
                  {/*-------DEPRECIATED--------*/}
                  {/* <Col xs={10}>
                    <Form.Select id="selectionNode"
                      onChange={
                        (evt: React.ChangeEvent<HTMLSelectElement>) => {
                          set_selected_node(display_nodes[evt.target.value])
                        }
                      }
                    > {<option value={'default'} disabled={(selected_node.idNode === 'default') ? false : true} > Choisissez noeud</option>}
                      {Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode} selected={(selected_node.idNode != 'default' && n.idNode === selected_node.idNode) ? true : false} >{n.name}</option>)}
                    </Form.Select>
                  </Col> */}
                  <Col xs={10}>
                    {dropdownMultiNode()}
                  </Col>

                  <Col xs={1}>
                    <Button
                      size="sm"
                      variant='danger'
                      disabled={multi_selected_node.length ==0}
                      onClick={
                        () => {
                          if (selected_node.inputLinksId.length > 0 || selected_node.outputLinksId.length > 0) {
                            setModalShow(true)

                          } else {
                            //Boutton pour supprimer le noeud selectionné
                            multi_selected_node.map(d=>delete_node(data, d))
                            set_selected_node(default_node(data))
                            set_multi_selected_node([])
                            set_data({ ...data })
                          }



                        }
                      }
                    ><FaMinus /></Button>

                  </Col>
                </Row>

                <Form>
                  <Form.Group as={Row} >
                    <Col xs={1} >
                      <FormLabel >Nom</FormLabel>
                    </Col>
                    <Col xs={10} >

                      <FormControl

                        value={
                          (multi_selected_node.length != 1) ? '' : multi_selected_node[0].name
                        }

                        onChange={evt => {
                          const sel = (multi_selected_node.length != 1) ? '' : multi_selected_node[0].name
                          // sel = evt.target.value
                          Object.values(data.nodes).filter(d => d.name == sel)[0].name = evt.target.value
                          set_data({ ...data })
                        }}
                        disabled={(multi_selected_node.length == 1) ? false : true} />
                    </Col>
                    <Col xs={3}>
                    </Col>
                  </Form.Group>
                </Form>

                <div style={{ 'display': (multi_selected_node.length == 0) ? 'none' : 'block' }}>{node_edition}</div>

              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              eventKey="4"
              onClick={
                evt => {
                  if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === '4') {
                    set_nav_item_active('')
                  } else {
                    set_nav_item_active('4')
                  }
                }
              }>
              <Accordion.Header>Étiquette Noeuds</Accordion.Header>
              <Accordion.Body>
                {settings_edition_tags}
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              eventKey="3"
              onClick={evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === '3') {
                  set_nav_item_active('')
                } else {
                  set_nav_item_active('3')
                }
              }}
            >
              <Accordion.Header>Flux</Accordion.Header>
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
                    ><FaPlus /></Button>

                  </Col>
                  {/* <Col xs={10}>
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
                  </Col> */}
                  <Col xs={10}>
                    {dropdownMultiLinks()}
                  </Col>

                  <Col xs={1}>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={
                        () => {
                          delete_link(data, selected_link)
                          set_selected_link(default_link(data))

                          set_data({ ...data })
                        }
                      }
                    ><FaMinus /></Button>
                  </Col>

                </Row>

                <Row>
                  <Col>
                    <FormLabel>Source</FormLabel>
                  </Col>
                  <Col>
                    <Form.Select disabled={multi_selected_links.length != 1} onChange={source_change}>
                      {addDropSource()}
                    </Form.Select>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <FormLabel>Cible</FormLabel>
                  </Col>
                  <Col>
                    <Form.Select disabled={multi_selected_links.length != 1} onChange={target_change}>
                      {addDropCible()}
                    </Form.Select>
                  </Col>
                </Row>
                {/* <Row>
                  <Col>
                    <FormLabel>Valeur</FormLabel>
                  </Col>
                  <Col>
                    <Form.Control
                      type='text'
                      value={link.value[value_index]}
                      onChange={
                        (evt) => {
                          selected_link.value[value_index] = +evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  
                </Row> */}
                <div style={{ 'display': (multi_selected_links.length == 0) ? 'none' : 'block' }}>{link_edition}</div>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="7"
              onClick={evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === '7') {
                  set_nav_item_active('')
                } else {
                  set_nav_item_active('7')
                }
              }}
            >
              <Accordion.Header>Étiquette Flux</Accordion.Header>
              <Accordion.Body>{settings_edition_tags_links}</Accordion.Body>
            </Accordion.Item>

            <Accordion.Item
              eventKey="5"
              onClick={
                evt => {
                  if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === '5') {
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
                          if (evt.target.value === '') {
                            return
                          }
                          for (let level = 1; level <= +evt.target.value + 1; level++) {
                            set_nodes_level(display_nodes, level)
                          }
                          set_agregation_level(+evt.target.value)
                          set_data({ ...data })
                        }
                      }
                    >
                      {[...Array(nb_agregation_level).keys()].map(level => <option key={level} value={(level as unknown) as string} selected={level === agregation_level} >{'Niveau ' + (level + 1)}</option>)}
                    </Form.Select>
                  </Col>
                </Row>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item
              eventKey="0"
              onClick={
                evt => {
                  if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === '0') {
                    set_nav_item_active('')
                  } else {
                    set_nav_item_active('0')
                  }
                }
              }>
              <Accordion.Header>Raccourci Clavier</Accordion.Header>
              <Accordion.Body>
                <p>Fonctionnement des clics :</p><br />
                <p><b>CTRL + Click (noeuds) :</b> Selectionne le noeuds click dans l onglet Noeuds du menu</p>
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              eventKey="6"
              onClick={
                evt => {
                  if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === '6') {
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
            </Button></Modal.Dialog>) : (<></>)
      }

    </>
  )
}

Menu.propTypes = MenuPropTypes


export default Menu


