/* eslint @typescript-eslint/no-var-requires: "off" */
import React, { ChangeEvent, FunctionComponent, useRef, useEffect, useState } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form, FormControl, FormLabel, Row, Col, Modal, Navbar, Nav, NavDropdown, Button, ButtonGroup, Dropdown, Container, Offcanvas, ToggleButton, Toast, Table, Tabs, Tab, FormCheck, FormGroup } from 'react-bootstrap'
import { SankeyData, SankeyNode, SankeyDataPropTypes, SankeyLink, SankeyNodePropTypes, SankeyLinkPropTypes, SankeyLinkValue, SankeyLinkValueDict, SankeyLabel, SankeyLabelPropTypes } from './types'
import { convert_data } from './SankeyConvert'
import { compute_auto_sankey, updateLayout } from './SankeyLayout'
import FileSaver from 'file-saver'
import { default_sankey_data, delete_node, default_node, delete_link, default_link, uploadExemple, set_nodes_level, link_text, findMaxLinkValue } from './SankeyUtils'
import Accordion from 'react-bootstrap/Accordion'
import { FaPlus, FaMinus, FaArrowUp, FaArrowDown, FaAngleDoubleLeft, FaAngleUp, FaAngleDoubleUp, FaAngleDown, FaAngleDoubleDown, FaSave, FaArrowsAltH } from 'react-icons/fa'
import { MultiSelect } from 'react-multi-select-component'
import SankeyEdition from './SankeyEdition'
import SankeyDraw from './SankeyDraw'
import { nodeTooltipsContent, linkTooltipsContent } from './SankeyTooltip'

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      header? : string,
      advanced? : boolean
    }
  }


const MenuPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  open_menu: PropTypes.element,
  save_menu: PropTypes.element,
  edition_menu: PropTypes.element,
  right_menu: PropTypes.element,
  settings_edition: PropTypes.element,
  settings_edition_node_tags: PropTypes.element,
  settings_edition_link_tags: PropTypes.element,
  settings_edition_data_tags: PropTypes.element,
  node_edition: PropTypes.element,
  link_edition: PropTypes.element,
  logo: PropTypes.string.isRequired,
  app_name: PropTypes.string.isRequired,
  set_show_nav: PropTypes.func.isRequired,
  show_nav: PropTypes.bool.isRequired,
  set_show_toast: PropTypes.func.isRequired,
  show_toast: PropTypes.bool.isRequired,
  set_nav_item_active: PropTypes.func.isRequired,
  nav_item_active: PropTypes.string.isRequired,
  set_selected_node: PropTypes.func.isRequired,
  selected_node: PropTypes.shape(SankeyNodePropTypes).isRequired,

  set_multi_selected_nodes: PropTypes.func.isRequired,
  multi_selected_nodes: PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired,

  set_multi_selected_links: PropTypes.func.isRequired,
  multi_selected_links: PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired,

  set_multi_selected_label: PropTypes.func.isRequired,
  multi_selected_label: PropTypes.arrayOf(PropTypes.shape(SankeyLabelPropTypes).isRequired).isRequired,



  set_selected_link: PropTypes.func.isRequired,
  selected_link: PropTypes.shape(SankeyLinkPropTypes).isRequired,
  example_menu: PropTypes.element,
  portfolio_menu: PropTypes.element,
  url_prefix: PropTypes.string.isRequired,

  agregation_level: PropTypes.number.isRequired,
  set_agregation_level: PropTypes.func.isRequired,

  view: PropTypes.string.isRequired,
  set_view: PropTypes.func.isRequired,

  additional_selector: PropTypes.element,
  flux_selector: PropTypes.element,
  set_current_filter: PropTypes.func.isRequired
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

export const ExempleItem = ({ exemple_menu, url_prefix, data, set_data, current_path,set_multi_selected_nodes,set_multi_selected_links }: any) => {
  return (
    <>
      { Array.isArray(exemple_menu)
        ? exemple_menu.map((item) => {
          let callback = (server_data: SankeyData) => 0
          let path = current_path + '/sankey/' + item
          if (item.includes('simple.xlsx')) {
            path = current_path + '/' + item
            callback = (server_data: SankeyData) => {
              set_nodes_level(server_data,server_data.nodes, 2)
              compute_auto_sankey(server_data, server_data.h_space ? server_data.h_space : 200)
              set_nodes_level(server_data,server_data.nodes, 1)
              compute_auto_sankey(server_data, server_data.h_space ? server_data.h_space : 200)
              return 0
            }
          }
          return (
            <Dropdown.Item
              onClick={() => uploadExemple(
                path, url_prefix, data, set_data, callback,set_multi_selected_nodes,set_multi_selected_links
              )}
            >{item.split('.')[0].replace(/_/g, ' ').replace(' layout', '').replace('simple.xlsx', ' xl').split(/(?=[A-Z0-9])/).join(' ').replace('A F M', 'AFM').replace('T E C', 'TEC')}</Dropdown.Item>
          )
        }
        ) : Object.keys(exemple_menu).map(
          (key) => {
            return (
              <>
                <NavDropdown title={key} id={key} >
                  <ExempleItem
                    exemple_menu={exemple_menu[key]}
                    url_prefix={url_prefix}
                    data={data}
                    set_data={set_data}
                    current_path={current_path !== '' ? current_path + '/' + key : key}
                    set_multi_selected_links={set_multi_selected_links}
                    set_multi_selected_nodes={set_multi_selected_nodes}
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
    settings_edition, 
    settings_edition_node_tags, settings_edition_link_tags,settings_edition_data_tags, 
    node_edition, link_edition,
    logo, app_name,
    set_show_nav, show_nav, set_nav_item_active, nav_item_active,
    set_selected_node, selected_node,
    set_multi_selected_nodes, multi_selected_nodes,
    set_multi_selected_links, multi_selected_links,
    set_selected_link, selected_link,
    example_menu, portfolio_menu, url_prefix,
    agregation_level,
    set_agregation_level,
    show_toast,
    set_show_toast,
    view, set_view,
    multi_selected_label, set_multi_selected_label,
    set_current_filter,
    additional_selector,
    flux_selector

  }
) => {
  const set_show_link = useState(true)[1]
  const [legend_position, set_legend_position] = useState(data.legend_position)
  const [show_apply_layout, set_show_apply_layout] = useState(false)
  const { filter } = data.display_style

  let max_link_value = 0
  Object.values(data.links).forEach(link => {
    const new_max_link_value = findMaxLinkValue(
      max_link_value,
      link.value
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })
  max_link_value += 1

  const display_nodes = data.nodes
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
    if (Object.keys(nodes).length < 5) {
      node.x = Object.keys(nodes).length * 200 + 200
    } else {
      node.x = 200
    }
    nodes[node.idNode] = node
    for (const tag_group_key in data.nodeTags) {
      node.tags[tag_group_key] = []
    }
    set_selected_node(node)
    set_multi_selected_nodes([node])
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
    svg.attr('viewBox', [0, 0, data.width, data.height] as any)
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
    set_multi_selected_nodes([])
    set_multi_selected_links([])
    set_data({ ...data })
  }

  const setShow = (t: boolean) => {
    set_show_nav(t)
  }

  // const handleClose = () => setShow(false)

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
    const link = multi_selected_links[0]
    //Causait un problème d'acumulation de la valeur de des differents link sur des noeuds non associé
    const previous_node = data.nodes[link.idSource]
    previous_node.outputLinksId.splice(previous_node.outputLinksId.indexOf(multi_selected_links[0].idLink), 1)

    const source_node = data.nodes[changeEvent.target.value]
    link.idSource = source_node.idNode
    source_node.outputLinksId.push(multi_selected_links[0].idLink)


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
    const link = multi_selected_links[0]
    const previous_node = nodes[link.idTarget]
    previous_node.inputLinksId.splice(previous_node.inputLinksId.indexOf(multi_selected_links[0].idLink), 1)

    const target_node = nodes[changeEvent.target.value]
    link.idTarget = target_node.idNode

    target_node.inputLinksId.push(multi_selected_links[0].idLink)

    set_data({ ...data })
  }
  const INITIAL_OPTIONS = Object.values(data.nodes).map(d => d.name).sort().map((d) => { return { 'label': d, 'value': d } })
  const selected = multi_selected_nodes.map((d) => { return { 'label': d.name, 'value': d.name } })
  const props = {
    scroll: true,
    backdrop: false,
  }
  const dropdownMultiNode = () => {
    const DD = (
      <div id='DD_multi_node'>


        <MultiSelect
          valueRenderer={(selected: any) => {
            return selected.length ? selected.map(({ label }: any) => label + ', ') : 'Aucun noeud sélectionné'
          }}
          options={INITIAL_OPTIONS}
          value={selected}
          overrideStrings = {{
            'selectAll': 'Tout sélectionner',
          }}
          onChange={(selected: [{ label: string, value: string }]) => {
            const new_sel = selected.map(d => d.value)
            const m_s = Object.values(data.nodes).filter(d => (new_sel.includes(d.name)))
            set_multi_selected_nodes(m_s)
          }}
          labelledBy={'hello'}
        />
      </div>)
    return DD
  }

  const INITIAL_OPTIONS_label = data.labels.map(d => d.name).sort().map((d) => { return { 'label': d, 'value': d } })
  const selected_label = multi_selected_label.map((d) => { return { 'label': d.name, 'value': d.name } })
  const dropdownMultiLabel = () => {
    const DD = (
      <div id='DD_multi_label'>


        <MultiSelect
          valueRenderer={(selected: any) => {
            return selected.length ? selected.map(({ label }: any) => label + ', ') : 'Aucun label sélectionné'
          }}
          options={INITIAL_OPTIONS_label}
          value={selected_label}
          overrideStrings = {{
            'selectAll': 'Tout sélectionner',
          }}
          onChange={(selected: [{ label: string, value: string }]) => {
            const new_sel = selected.map(d => d.value)
            const m_s = data.labels.filter(d => (new_sel.includes(d.name)))
            set_multi_selected_label(m_s)
          }}
          labelledBy={'hello'}
        />
      </div>)
    return DD
  }


  const INITIAL_OPTIONS_LINKS = Object.values(data.links).map((d) => { return { 'label': (data.nodes[d.idSource].name + '--->' + data.nodes[d.idTarget].name), 'value': d.idLink } })
  const selected_links = multi_selected_links.map((d) => { 
    if (data.nodes[d.idSource] == undefined || data.nodes[d.idTarget] == undefined ) {
      return
    }
    return { 'label': (data.nodes[d.idSource].name + '--->' + data.nodes[d.idTarget].name), 'value': d.idLink } 
  })
  const dropdownMultiLinks = () => {
    const DD = (
      <div id='DD_multi_links'>
        <MultiSelect
          valueRenderer={(selected: any) => {
            return selected.length ? selected.map(({ label }: any) => label + ', ') : 'Aucun flux sélectionné'
          }}
          options={INITIAL_OPTIONS_LINKS}
          value={selected_links}
          overrideStrings = {{
            'selectAll': 'Tout sélectionner',
          }}
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
  const menuButton = () => {
    if (show_nav) {
      return 'Configuration Sankey'
    } else {
      return <FaAngleDoubleLeft />
    }

  }


  const handleUpLink = (i: string) => {
    const { links } = data
    const listElmt = Object.keys(links)
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt - 1, 0, i)
    const new_cat: { [key: string]: SankeyLink } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = links[elt]
    })
    for (const member in links) delete links[member]
    Object.assign(links, new_cat)
    set_data({ ...data })
  }


  const handleDownLink = (i: string) => {
    const { links } = data
    const listElmt = Object.keys(links)
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt + 1, 0, i)
    const new_cat: { [key: string]: SankeyLink } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = links[elt]
    })
    for (const member in links) delete links[member]
    Object.assign(links, new_cat)
    set_data({ ...data })
  }

  const allLabelHeight = () => {
    let display_size = true
    let size = 25
    if (multi_selected_label.length != 0) {
      size = multi_selected_label[0].label_height
    }
    multi_selected_label.map((d) => {
      display_size = (d.label_height == size) ? display_size : false
    })
    return (display_size) ? size : -1
  }

  const allLabelWidth = () => {
    let display_size = true
    let size = 25
    if (multi_selected_label.length != 0) {
      size = multi_selected_label[0].label_width
    }
    multi_selected_label.map((d) => {
      display_size = (d.label_width == size) ? display_size : false
    })
    return (display_size) ? size : -1
  }
  // const [modalshow, setModalShow] = useState(false)

  return (
    <>
      <Navbar className='bg-light' fixed='top' style={{ 'display': 'block' }} >
        <Container>
          <Navbar.Brand href="#"><img src={logo} width="100" /> {app_name} </Navbar.Brand>
          { !window.SankeyToolsStatic ? (<>
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
                          set_data(new_data)
                          localStorage.setItem('initial_data', JSON.stringify(new_data))
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
                <Dropdown.Item onClick={ ()=>set_show_apply_layout(true) }>Appliquer mise en page</Dropdown.Item>
                {edition_menu}
              </NavDropdown >
              <NavDropdown title="Exemples" id="exemples" className={'tutu'}>
                {example_menu}
              </NavDropdown >
              <NavDropdown title="Portfolio" id="portfolio" >
                {portfolio_menu}
              </NavDropdown >
              {!data.static_sankey ? (
                <ButtonGroup className="mb-2" style={{ 'width': (show_nav) ? '480px' : '80px' }}>
                  <ToggleButton
                    id="toggle-check"
                    type="checkbox"
                    variant="outline-primary"
                    checked={show_nav}
                    onChange={(e) => { setChecked(e.currentTarget.checked) }}
                    onClick={toggleShow}
                    value="1">{menuButton()}
                  </ToggleButton>
                </ButtonGroup>) : (<></>)
              }
              {right_menu}
            </Nav></>
          ) :(<><br/>
            <h2>{window.sankey.header}</h2>
            <br/></>)}
          <Form.Check
            type="switch"
            checked={window.sankey.advanced}
            onClick={(evt: any) => {
              window.sankey.advanced = evt.target.checked
              set_data({...data})
            }}
            label="Options de filtrage"
          />
        </Container>

        {(view == 'none') ? <SankeyEdition
          data={data}
          set_data={set_data}
          additional_selector={additional_selector}
          flux_selector={flux_selector} /> : <></>}
      </Navbar>

      {(show_nav) ? <Offcanvas show={true} placement='end' /*onHide={set_show_nav(false)}*/ {...props} style={{ 'width': '540px', 'marginTop': '70px' }}>
        <Offcanvas.Body style={{ 'padding': '0px' }}>
          <Accordion activeKey={nav_item_active as string} >
            {//MENU AIDE 
            }

            <Accordion.Item
              style={{ 'display': (view == 'none') ? 'block' : 'none' }}
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
              <Accordion.Header>Mise en page</Accordion.Header>
              <Accordion.Body>
                {settings_edition}
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              style={{ 'display': (view == 'none') ? 'block' : 'none' }}
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
                <Form >
                  <Form.Group>
                    <FormLabel style={{justifyContent: 'center'}} ><b>Paramétres généraux</b></FormLabel>
                    <Row>
                      <Col xs={6}>Police des labels</Col>
                      <Col xs={6}><Form.Select
                        onChange={
                          (evt: React.ChangeEvent<HTMLSelectElement>) => {
                            data.display_style.font_family_selected = evt.target.value
                            set_data({ ...data })
                          }
                        }
                      >
                        {data.display_style.font_family.map((d) => {
                          return <option
                            key={'ff-' + d}
                            value={d}
                            selected={d == data.display_style.font_family_selected}
                          >{d}</option>

                        })}
                      </Form.Select></Col>
                    </Row>
                  </Form.Group>
                  <FormLabel style={{justifyContent: 'center'}} ><b>Paramétres par défaut</b></FormLabel>
                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel >Taille police</FormLabel>
                    </Col>
                    <Col>
                      <Form.Range
                        min="11" max="20"
                        value={data.display_style.node_font_size}
                        onChange={evt => {
                          data.display_style.node_font_size = +evt.target.value
                          set_data({ ...data })
                        }}
                      />
                    </Col>
                    <Col>{data.display_style.node_font_size}</Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel >Labels</FormLabel>
                    </Col>
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label='Gras'
                        checked={data.display_style.sector_bold}
                        onChange={
                          evt => {
                            data.display_style.sector_bold = evt.target.checked
                            data.display_style.product_bold = evt.target.checked
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label='Majuscule'
                        checked={data.display_style.sector_uppercase}
                        onChange={
                          evt => {
                            data.display_style.sector_uppercase = evt.target.checked
                            data.display_style.product_uppercase = evt.target.checked
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label='Italique'
                        checked={data.display_style.sector_italic}
                        onChange={
                          evt => {
                            data.display_style.sector_italic = evt.target.checked
                            data.display_style.product_italic = evt.target.checked
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                  </Form.Group>
                </Form>
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
                      disabled={multi_selected_nodes.length == 0}
                      onClick={
                        () => {
                          
                          //Boutton pour supprimer le noeud selectionné
                          multi_selected_nodes.map(d => delete_node(data, d))
                          set_selected_node(default_node(data))
                          set_multi_selected_nodes([])
                          set_data({ ...data })
                          



                        }
                      }
                    ><FaMinus /></Button>

                  </Col>
                </Row>

                <Form.Group as={Row} >
                  <Col xs={1} >
                    <FormLabel >Nom</FormLabel>
                  </Col>
                  <Col xs={10} >

                    <FormControl
                      value={
                        (multi_selected_nodes.length != 1) ? '' : multi_selected_nodes[0].name
                      }

                      onChange={evt => {
                        const sel = (multi_selected_nodes.length != 1) ? '' : multi_selected_nodes[0].name
                        Object.values(data.nodes).filter(d => d.name == sel)[0].name = evt.target.value
                        set_data({ ...data })
                      }}
                      disabled={(multi_selected_nodes.length == 1) ? false : true} />
                  </Col>
                  <Col xs={3}>
                  </Col>
                </Form.Group>
                {/* </Form> */}

                <div style={{ 'display':'block' }}>{node_edition}</div>

              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              style={{ 'display': (view == 'none') ? 'block' : 'none' }}
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
              <Accordion.Header>Étiquettes Noeuds</Accordion.Header>
              <Accordion.Body>
                {settings_edition_node_tags}
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              style={{ 'display': (view == 'none') ? 'block' : 'none' }}

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
                  <Col xs={10}>
                    {dropdownMultiLinks()}
                  </Col>

                  <Col xs={1}>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={
                        () => {
                          multi_selected_links.forEach( l=> delete_link(data, l))
                          set_multi_selected_links([])
                          //set_selected_link(default_link(data))

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
                <Row>
                  <Col>
                    <FormLabel>Inverser Flux</FormLabel>
                  </Col>
                  <Col >
                    <Button variant='info'
                      onClick={() => {
                        multi_selected_links.map(l => {
                          const tmp = l.idSource

                          const previous_node_s = data.nodes[l.idSource]
                          previous_node_s.outputLinksId.splice(previous_node_s.outputLinksId.indexOf(l.idLink), 1)
                          const source_node = data.nodes[l.idTarget]
                          l.idSource = source_node.idNode
                          source_node.outputLinksId.push(l.idLink)

                          const previous_node_t = data.nodes[l.idTarget]
                          previous_node_t.inputLinksId.splice(previous_node_t.inputLinksId.indexOf(l.idLink), 1)
                          const target_node = data.nodes[tmp]
                          l.idTarget = target_node.idNode
                          target_node.inputLinksId.push(l.idLink)
                        })
                        set_data({ ...data })
                      }}><FaArrowsAltH /></Button>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <FormLabel>Déplacement z-index flux</FormLabel>
                  </Col>
                  <Col >
                    {//Boutton pour monter le lien sélctionné
                    }
                    <ButtonGroup>
                      <Button variant='info' disabled={multi_selected_links.length != 1}
                        onClick={() => {
                          multi_selected_links.map(l => {
                            handleDownLink(l.idLink)
                          })


                        }}><FaAngleUp /></Button>

                      <Button variant='info' disabled={multi_selected_links.length != 1}
                        onClick={() => {
                          multi_selected_links.map(l => {
                            const i = l.idLink
                            const { links } = data
                            const listElmt = Object.keys(links)
                            const posElemt = listElmt.indexOf(i)
                            listElmt.splice(posElemt, 1)
                            listElmt.splice(listElmt.length, 0, i)
                            const new_cat: { [key: string]: SankeyLink } = {}
                            listElmt.forEach(elt => {
                              new_cat[elt] = links[elt]
                            })
                            for (const member in links) delete links[member]
                            Object.assign(links, new_cat)

                          })
                          set_data({ ...data })


                        }}><FaAngleDoubleUp /></Button>


                      <Button variant='warning' disabled={multi_selected_links.length != 1}
                        onClick={() => {
                          multi_selected_links.map(l => {
                            handleUpLink(l.idLink)
                          })


                        }}><FaAngleDown /></Button>
                      {//Boutton pour baisser le lien sélctionné
                      }
                      <Button variant='warning' disabled={multi_selected_links.length != 1}
                        onClick={() => {
                          multi_selected_links.map(l => {
                            const i = l.idLink
                            const { links } = data
                            const listElmt = Object.keys(links)
                            const posElemt = listElmt.indexOf(i)
                            listElmt.splice(posElemt, 1)
                            listElmt.splice(0, 0, i)
                            const new_cat: { [key: string]: SankeyLink } = {}
                            listElmt.forEach(elt => {
                              new_cat[elt] = links[elt]
                            })
                            for (const member in links) delete links[member]
                            Object.assign(links, new_cat)

                          })
                          set_data({ ...data })


                        }}><FaAngleDoubleDown /></Button>
                    </ButtonGroup>
                  </Col>
                </Row>



                <div style={{ 'display': (multi_selected_links.length == 0) ? 'none' : 'block' }}>{link_edition}</div>



                {/* <Table bordered size='sm'>
                  <thead>
                    <tr>
                      <th>Id Flux</th>
                      <th>Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(data.links).reverse().map(d => {
                      return (
                        <tr style={{ 'border': (multi_selected_links.map(d => d.idLink).includes(d)) ? '2px solid ' + data.links[d].color : 'none' }}>
                          <td> <FormLabel>{d}</FormLabel></td>
                          <td>
                            <ButtonGroup className="button_position" size="sm">
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleDownLink(d)}
                              ><FaArrowUp /></Button><Button
                                size="sm"
                                variant="success"
                                onClick={() => handleUpLink(d)}

                              ><FaArrowDown /></Button>
                            </ButtonGroup>

                          </td>

                        </tr>
                      )
                    })}
                  </tbody>

                </Table> */}




              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              eventKey="8"
              style={{ 'display': (view == 'none') ? 'block' : 'none' }}
              onClick={evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === '8') {
                  set_nav_item_active('')
                } else {
                  set_nav_item_active('8')
                }
              }}
            >
              <Accordion.Header>Étiquettes Flux</Accordion.Header>
              <Accordion.Body>{settings_edition_link_tags}</Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              eventKey="dimension"
              style={{ 'display': (view == 'none') ? 'block' : 'none' }}
              onClick={evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === 'dimension') {
                  set_nav_item_active('')
                } else {
                  set_nav_item_active('dimension')
                }
              }}
            >
              <Accordion.Header>Étiquettes Données</Accordion.Header>
              <Accordion.Body>{settings_edition_data_tags}</Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              eventKey="7"
              style={{ 'display': (view == 'none') ? 'block' : 'none' }}
              onClick={evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === '7') {
                  set_nav_item_active('')
                } else {
                  set_nav_item_active('7')
                }
              }}
            >
              <Accordion.Header>Labels Libres</Accordion.Header>
              <Accordion.Body>
                <Form.Group as={Row}>
                  <Col xs={1}>
                    <Button size="sm" onClick={evt => {
                      const new_label = {
                        idLabel: 'label_' + String(new Date().getTime()),
                        name: 'Label' + data.labels.length,
                        label_width: 50,
                        label_height: 25,
                        color: 'white',
                        color_border: 'black',
                        x: 50,
                        y: 50,
                      }
                      data.labels.push(new_label)
                      set_multi_selected_label([new_label])
                      set_data({ ...data })
                    }
                    }><FaPlus /></Button>
                  </Col>
                  <Col xs={9}>{dropdownMultiLabel()}</Col>
                  <Col xs={1}>
                    <Button size="sm" variant='danger' onClick={evt => {
                      data.labels = data.labels.filter(d => !multi_selected_label.map(l => l.name).includes(d.name))
                      set_multi_selected_label([])
                      set_data({ ...data })
                    }
                    }><FaMinus /></Button>
                  </Col>
                </Form.Group>

                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >Hauteur Label</FormLabel>
                  </Col>
                  <Col xs={8}>
                    <FormControl size='sm'
                      min={0}
                      max={100}
                      type={'number'}
                      value={allLabelHeight()}
                      onChange={evt => {
                        multi_selected_label.map(d => d.label_height = +evt.target.value)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >Largeur Label</FormLabel>
                  </Col>
                  <Col xs={8}>
                    <FormControl size='sm'
                      min={0}
                      max={100}
                      type={'number'}
                      value={allLabelWidth()}
                      onChange={evt => {
                        multi_selected_label.map(d => d.label_width = +evt.target.value)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >Couleur Fond Label</FormLabel>
                  </Col>
                  <Col xs={8}>
                    <FormControl size='sm'

                      type={'color'}
                      value={(multi_selected_label.length == 1) ? multi_selected_label[0].color : 'white'}
                      onChange={evt => {
                        multi_selected_label.map(d => d.color = evt.target.value)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>


              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              eventKey="Visualisation"
              onClick={
                evt => {
                  if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === 'Visualisation') {
                    set_nav_item_active('')
                  } else {
                    set_nav_item_active('Visualisation')
                  }
                }
              }>
              <Accordion.Header>Visualisation</Accordion.Header>
              <Accordion.Body>
                <Tabs defaultActiveKey="vue" id="visualisation">
                  <Tab eventKey="vue" title="Vue">
                    <Row>
                      <Col xs={3}>
                        <FormLabel>Sélection Vue</FormLabel>
                      </Col>
                      <Col xs={9}>
                        <Form.Select id="selectionNode"
                          onChange={
                            (evt: React.ChangeEvent<HTMLSelectElement>) => {
                              if (evt.target.value === '') {
                                return
                              }
                              set_multi_selected_nodes([])
                              set_multi_selected_links([])
                              set_view(evt.target.value)
                            }
                          }
                        >
                          <option selected={view == 'none'} value={'none'}>Données actuelles</option>
                          {data.view.map(d => {
                            return <option key={d.id} selected={view == d.id} value={d.id}>{d.nom}</option>
                          })}
                        </Form.Select>
                      </Col>
                    </Row>

                    <Table bordered size='sm'>
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Position</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(data.view).map(d => {
                          return (
                            <tr style={{ 'border': (d.id == view) ? '2px solid red' : 'none' }}>
                              <td><FormControl size='sm'
                                value={d.nom}
                                onChange={evt => {
                                  data.view.filter(v => v.id == d.id)[0].nom = evt.target.value
                                  set_data({ ...data })
                                }}
                              /></td>
                              <td>
                                <ButtonGroup className="button_position" size="sm">
                                  <Button
                                    size="sm"
                                    variant="success"
                                    onClick={
                                      () => {
                                        let ind = -1
                                        data.view.map((v, i) => {
                                          ind = (v.id == d.id) ? i : ind
                                        })
                                        const toShift = data.view[ind]
                                        data.view.splice(ind, 1)
                                        data.view.splice(ind - 1, 0, toShift)
                                        set_data({ ...data })

                                      }
                                    }
                                  ><FaArrowUp /></Button><Button
                                    size="sm"
                                    variant="success"
                                    onClick={
                                      () => {
                                        let ind = -1
                                        data.view.map((v, i) => {
                                          ind = (v.id == d.id) ? i : ind
                                        })
                                        const toShift = data.view[ind]
                                        data.view.splice(ind, 1)
                                        data.view.splice(ind + 1, 0, toShift)
                                        set_data({ ...data })
                                      }
                                    }
                                  ><FaArrowDown /></Button>
                                </ButtonGroup>

                              </td>
                              <td><Button
                                size="sm"
                                variant='danger'
                                onClick={
                                  () => {
                                    let ind = -1
                                    data.view.map((v, i) => {
                                      ind = (v.id == d.id) ? i : ind
                                    })
                                    data.view.splice(ind, 1)
                                    set_view('none')
                                    set_data({ ...data })
                                  }
                                }
                              ><FaMinus /></Button></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </Table>
                  </Tab>
                  <Tab eventKey="flux" title="Filtres Flux">
                    <Form >
                      <Form.Group as={Row} >
                        <Col >
                          <FormCheck
                            type='checkbox'
                            label='Mode structure'
                            checked={data.show_structure}
                            onChange={evt => {
                              data.show_structure = evt.target.checked
                              set_data({ ...data })
                            }}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group as={Row} >
                        <Col>
                          <FormLabel >Filtre</FormLabel>
                        </Col>
                        <Col>
                          <Form.Range
                            min="0"
                            max={max_link_value}
                            value={filter}
                            onChange={evt => set_current_filter(Number(evt.target.value))} />
                        </Col>
                        <Col>{filter}</Col>
                      </Form.Group>
                      <Form.Group as={Row} >
                        <Col>
                          <FormLabel>Filtre label</FormLabel>
                        </Col>
                        <Col >
                          <Form.Range
                            min="0"
                            max={max_link_value}
                            value={data.display_style.filter_label}
                            onChange={evt => {
                              data.display_style.filter_label = +evt.target.value
                              set_data({ ...data })
                            }}
                          />
                        </Col>
                        <Col>{data.display_style.filter_label}</Col>
                      </Form.Group>
                      <Form.Group as={Row} >
                        <Col>
                          <FormLabel >Flux Nuls:</FormLabel>
                        </Col>
                        <Col >
                          <FormCheck
                            type='checkbox'
                            label='Visible'
                            onChange={evt => {
                              data.display_style.null_flux = evt.target.checked
                              set_data({ ...data })
                            }}
                          />
                        </Col>
                      </Form.Group>
                    </Form>
                  </Tab>
                </Tabs>
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              style={{ 'display': (view == 'none') ? 'block' : 'none' }}
              eventKey="legend"
              onClick={
                evt => {
                  if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === 'legend') {
                    set_nav_item_active('')
                  } else {
                    set_nav_item_active('legend')
                  }
                }
              }>
              <Accordion.Header>Légendes</Accordion.Header>
              <Accordion.Body>
                <Form.Group as={Row} >
                  <Col xs={3}>
                    <FormLabel >Légende X</FormLabel>
                  </Col>
                  <Col>
                    <FormControl
                      type="text"
                      value={legend_position[0]}
                      onChange={evt => set_legend_position([+evt.target.value, legend_position[1]])}
                      onBlur={() => {
                        data.legend_position = legend_position
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={3}>
                    <FormLabel>Légende Y</FormLabel>
                  </Col>
                  <Col>
                    <FormControl
                      type="text"
                      value={legend_position[1]}
                      onChange={evt => set_legend_position([legend_position[0], +evt.target.value])}
                      onBlur={() => {
                        data.legend_position = legend_position
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              style={{ 'display': (view == 'none') ? 'block' : 'none' }}
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
                <p><b>CTRL + Click (noeuds) :</b> Selectionne le noeuds click dans l'onglet Noeuds du menu</p><br />
                <p><b>CTRL + Click (flux) :</b> Selectionne le flux click dans l'onglet Flux du menu</p><br />
                <p><b>Click (en dehors d'un noeud/flux) :</b>  Désélectionne les noeuds et flux sélectionnés</p><br />
                <p><b>CTRL + S :</b> Sauvegarde le data actuelle dans une vue, qui peut ensuite être visualisé dans le Menu Vue </p><br />
                <p><b>Flèche du clavier :</b> Permet de dépalcer les noeuds sélectionnés en fonction du grillage  </p><br />
                <p><b>Echap :</b> Ferme le Menu si il est ouvert </p><br />

              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              style={{ 'display': (view == 'none') ? 'block' : 'none' }}
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
        : <></>}

      <Toast bg='success' className='toastView' show={show_toast} style={{ 'position': 'absolute', 'marginTop': '300px', 'marginLeft': '250px', 'zIndex': 1 }}>
        <Toast.Header closeButton={false}><FaSave /> <small className='me-auto'>Enregistrement</small> </Toast.Header>
        <Toast.Body>Vue sauvegardée</Toast.Body>
      </Toast>

      {
        processing ? (
          <Modal.Dialog >
            <Button className="btn btn-sm btn-warning col-md-12">
              <span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Processing...
            </Button></Modal.Dialog>) : (<></>)
      }

      {
        (view != 'none') ? (<SankeyDraw
          data={data.view.filter(d => d.id == view)[0].view_data as SankeyData}
          set_data={() => null}
          set_multi_selected_nodes={() => null}
          multi_selected_nodes={multi_selected_nodes}
          set_multi_selected_links={() => null}
          multi_selected_links={multi_selected_links}
          multi_selected_label={multi_selected_label}

          select_node={() => null}
          node_arrow_visible={() => null}
          select_link={() => null}

          link_text={link_text}
          test_link_value={(nodes: { [node_id: string]: SankeyNode }, d: SankeyLink) => {
            const n_data = data.view.filter(d => d.id == view)[0].view_data as SankeyData

            const { dataTags } = n_data
            let val = ((d.value as unknown) as { [key: string]: SankeyLinkValueDict })
            const listKey: string[] = []
            /* console.log(val)
            console.log(dataTags) */
            let missing_key = false
            Object.values(dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) ? true : false }).map(dataTag => {
              const selected_tags = Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })
              if (selected_tags.length == 0 || missing_key) {
                missing_key = true
                return
              }
              listKey.push(Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })[0][0])
            })
            if (missing_key) {
              return {
                value: 0,
                display_value: 'default',
                tags: {},
                extension: {}
              }
            }
            // //Récupère la liste des tags selectionné pour chaque dataTags ayant au moins un groupe tag
            // Object.values(dataTags).filter(d => { return (Object.keys(d.tags).length != 0)  ? true : false }).map(d => {
            //   listKey.push(Object.entries(d.tags).filter(([,tag]) => { return tag.selected })[0][0])
            // })

            for (const i in listKey) {
              val = ((val as unknown) as { [key: string]: SankeyLinkValueDict })[listKey[i]]
            }
            if (val === undefined) {
              return 0
            }
            return ((val as unknown) as SankeyLinkValue).value
          }}
          set_show_nav={set_show_nav}
          set_nav_item_active={set_nav_item_active}
          nodeTooltipsContent={nodeTooltipsContent}
          linkTooltipsContent={linkTooltipsContent}
          set_show_toast={set_show_toast}
          current={false}
        />) : (<></>)
      }
      <ApplyLayoutDialog
        show_apply_layout={show_apply_layout}
        set_show_apply_layout={set_show_apply_layout}
        sankey_data={data}
        set_sankey_data={set_data}
      /> 
    </>
  )
}

const ApplyLayoutDialog = ({show_apply_layout,set_show_apply_layout,sankey_data,set_sankey_data} : any) => {
  let file_layout: Blob[] | undefined
  return (
    <Modal 
      bsSize="large" 
      show={show_apply_layout} 
      onHide={ () => set_show_apply_layout(false) }
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Modal.Header closeButton>
        <Modal.Title>Appliquer mise en page</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form >
          <Form.Group as={Row} >
            <Col xs={3}>
              <FormLabel>Fichier de mise en page</FormLabel>
            </Col>
            <Col xs={5}>
              <Form.Control
                type="file"
                onChange={(evt: React.ChangeEvent) => file_layout = (evt.target as HTMLFormElement).files}
              />
            </Col>
            <Col xs={4}>
              <Button
                size="sm"
                onClick={
                  () => {
                    if (file_layout === undefined) {
                      return
                    }
                    const reader = new FileReader()
                    reader.onload = (() => {
                      return (
                        (e: ProgressEvent<FileReader>) => {
                          let result = (e.target as FileReader).result
                          if (result) {
                            result = String(result).split('<br>').join('\\\\n')
                            const new_layout = JSON.parse(result)
                            updateLayout(sankey_data, new_layout)
                            set_sankey_data({ ...sankey_data })
                          }
                        }
                      )
                    })()
                    reader.readAsText(file_layout[0])
                  }
                }>Appliquer Disposition
              </Button>
            </Col>
          </Form.Group>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

Menu.propTypes = MenuPropTypes

export default Menu


