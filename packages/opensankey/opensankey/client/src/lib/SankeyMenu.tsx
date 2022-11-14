/* eslint @typescript-eslint/no-var-requires: "off" */
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import React, { ChangeEvent, FunctionComponent, useRef, useState, Validator, Ref } from 'react'
import PropTypes, { InferProps,ReactElementLike } from 'prop-types'
import { Form, FormControl, FormLabel, Row, Col, Modal, Navbar, Nav, NavDropdown, Button, ButtonGroup, Dropdown, Container, Offcanvas, ToggleButton, Toast, Tabs, Tab, FormCheck, FormGroup } from 'react-bootstrap'
import { SankeyData, SankeyNode, SankeyDataPropTypes, SankeyLink, SankeyNodePropTypes, SankeyLinkPropTypes, SankeyLabel, SankeyLabelPropTypes } from './types'
import { convert_data } from './SankeyConvert'
import { reorganize_inputLinksId, updateLayout } from './SankeyLayout'
import FileSaver from 'file-saver'
import { default_sankey_data, delete_node, default_node, delete_link, default_link, uploadExemple, set_nodes_level, link_text, findMaxLinkValue,uploadExcelImpl } from './SankeyUtils'
import Accordion from 'react-bootstrap/Accordion'
import { FaPlus, FaMinus, FaAngleDoubleLeft, FaAngleUp, FaAngleDoubleUp, FaAngleDown, FaAngleDoubleDown, FaSave, FaArrowsAltH, FaPlay, FaForward, FaBackward, } from 'react-icons/fa'
import { MultiSelect } from 'react-multi-select-component'
import SankeyEdition from './SankeyEdition'
import SankeyDraw from './SankeyDraw'
import { nodeTooltipsContent, linkTooltipsContent } from './SankeyTooltip'
import SankeyNodeEdition from './SankeyNodeEdition'
import SankeyLinkEdition from './SankeyLinkEdition'
import {useTranslation} from 'react-i18next'
import ReactCountryFlag from 'react-country-flag'
import i18n from 'i18next'
declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      header?: string,
      advanced?: boolean
    }
  }

export type selected_type = {'label':string;'value':string}

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
  logo_width: PropTypes.number.isRequired,
  app_name: PropTypes.string.isRequired,
  set_show_toast: PropTypes.func.isRequired,
  show_toast: PropTypes.bool.isRequired,

  button_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLLabelElement)}),
  accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement)}),
  nodes_accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement)}),
  links_accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement)}),

  multi_selected_nodes: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired}).isRequired,
  multi_selected_links: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired}).isRequired,
  multi_selected_label: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLabelPropTypes).isRequired).isRequired}).isRequired,
  selected_link: PropTypes.shape({current:PropTypes.shape(SankeyLinkPropTypes).isRequired}).isRequired,
  selected_node: PropTypes.shape({current:PropTypes.shape(SankeyNodePropTypes).isRequired}).isRequired,

  example_menu: PropTypes.element,
  // portfolio_menu: PropTypes.element,
  formations_menu: PropTypes.element,
  url_prefix: PropTypes.string.isRequired,

  view: PropTypes.string.isRequired,
  set_view: PropTypes.func.isRequired,

  additional_selector: PropTypes.element,
  set_current_filter: PropTypes.func.isRequired,

  mode_selection: PropTypes.string.isRequired,
  set_mode_selection: PropTypes.func.isRequired,


  style_to_apply: PropTypes.string.isRequired,
  set_style_to_apply: PropTypes.func.isRequired,

  mode_visualisation:PropTypes.bool.isRequired,
  set_mode_visualisation:PropTypes.func.isRequired,

  callback:PropTypes.func.isRequired
}


type MenuTypes = InferProps<typeof MenuPropTypes>

const ExempleMenuDictTypes = PropTypes.objectOf(PropTypes.element.isRequired).isRequired
type ExempleMenuTypes = InferProps<typeof ExempleMenuDictTypes>

const ExempleItemPropTypes = {
  exemple_menu : PropTypes.oneOf([PropTypes.element.isRequired,ExempleMenuDictTypes]).isRequired, 
  url_prefix : PropTypes.string.isRequired, 
  data : PropTypes.shape(SankeyDataPropTypes).isRequired, 
  set_data : PropTypes.func.isRequired, 
  current_path : PropTypes.string.isRequired, 
  multi_selected_nodes: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired}).isRequired,
  multi_selected_links: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired}).isRequired,
  multi_selected_label: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLabelPropTypes).isRequired).isRequired}).isRequired,
  callback: PropTypes.func.isRequired
}

type ExempleItemTypes = InferProps<typeof ExempleItemPropTypes>

export const ExempleItem = ({ exemple_menu, url_prefix, data, set_data, current_path, multi_selected_nodes, multi_selected_links,multi_selected_label,callback}: ExempleItemTypes) => {
  return (
    <>
      { Array.isArray(exemple_menu) 
        ? exemple_menu.map( (item,index)=> {
          let the_callback = ()=> 0
          let path = current_path+'/sankey/'+item
          if (!item.includes('.xlsx') && !item.includes('.json')) {
            let url = window.location.origin + '/fm/userfiles/' + current_path + '/' + item
            let suffix = 'ZIP'
            if (!item.includes('zip')) {
              url = url + '/index.html'
              suffix = 'HTML'
            }
            return (
              <Dropdown.Item key={index} href={url} target="_blank">{current_path.split('/').slice(0, -1).pop() + ' ' + suffix}</Dropdown.Item>
            )
          }
          if (item.includes('.xlsx')) {
            the_callback = callback
            path = current_path+'/'+item
          }
          return (
            <Dropdown.Item
              key={index}
              onClick={() => {
                multi_selected_nodes.current = []
                multi_selected_links.current = []
                multi_selected_label.current = []
                uploadExemple(
                  path, url_prefix, data, set_data,the_callback
                )} 
              }
            >{item.includes('xlsx') ? item.includes('reconciled') ? item.split('.x')[0].replace(/_/g, ' ').replace('reconciled',' sortie') : item.split('.x')[0].replace(/_/g, ' ') + ' entrée'
                : item.includes('json') ? item.replace(/_/g, ' ').replace(' layout.json','') : item.replace('afmsankey_0.9.0.','')
              }</Dropdown.Item>
          )
        }
        ) : Object.keys(exemple_menu).map(
          (key, index) => {
            let title = key
            if (title === 'artefacts') {
              title = 'Page Web et Zip' 
            }
            let the_current_path = current_path
            if (!key.includes('OpenSankey')) {
              the_current_path = current_path !== '' ? current_path + '/' + key.replace('Sankey', '').replace('Excel', '') : key.replace('Sankey', '').replace('Excel', '')
            } else {
              the_current_path = current_path + '/' + key
            }
            return (
              <>
                <NavDropdown drop='start' key={index} title={title} id={key} >
                  <ExempleItem
                    exemple_menu={(exemple_menu as unknown as {[key:string]:ExempleMenuTypes})[key] as unknown as Validator<ReactElementLike> | Validator<{ [x: string]: ReactElementLike; }>}
                    url_prefix={url_prefix}
                    data={data}
                    set_data={set_data}
                    current_path={the_current_path}
                    multi_selected_links={multi_selected_links}
                    multi_selected_nodes={multi_selected_nodes}
                    multi_selected_label={multi_selected_label}
                    callback={callback}
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
    settings_edition_node_tags, settings_edition_link_tags, settings_edition_data_tags,
    node_edition, link_edition,
    logo, logo_width,app_name,

    button_ref,
    accordion_ref,
    nodes_accordion_ref,
    links_accordion_ref,

    selected_node,
    multi_selected_nodes,
    multi_selected_links,
    selected_link,
    example_menu, formations_menu,url_prefix,
    show_toast,
    set_show_toast,
    view, set_view,
    multi_selected_label,// set_multi_selected_label,
    set_current_filter,
    additional_selector,
    mode_selection,
    set_mode_selection
    , style_to_apply,
    set_style_to_apply,
    mode_visualisation,
    set_mode_visualisation,
    callback
  }
) => {
  const set_show_link = useState(true)[1]
  const [show_excel_dialog, set_show_excel_dialog] = useState(false)
  const [legend_position, set_legend_position] = useState(data.legend_position)
  const [show_apply_layout, set_show_apply_layout] = useState(false)
  // const { filter } = data.display_style

  const [show_nav,set_show_nav] = useState(false)
  const [nav_item_active, set_nav_item_active] = useState<string>('')
  const [sub_nav_item_active, set_sub_nav_item_active] = useState<string>('')
  const [radio_selected] = useState<string>('local')
  
  const [forceUpdate, setForceUpdate] = useState(false)
  const {t} =useTranslation()



  let max_link_value = 0
  Object.values(data.links).forEach(link => {
    const new_max_link_value = findMaxLinkValue(
      max_link_value,
      link.value
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })
  max_link_value += 1

  //Ajoute un nouveau noeud puis le selectionne
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
    //WARNING : le set_multi_select ne semble pas changer les noeuds sélectionnés avant d'appliquer le style 
    //set_multi_selected_nodes([node])
    multi_selected_nodes.current = [node]
    style_to_apply = 'default'
    apply_style_to_nodes()
    set_data({...data})

  }

  const _load_json = useRef<HTMLInputElement>(null)

  const [processing] = useState(false)

  const clickSaveDiagram = () => {
    const data_to_save = { ...data }
    const str_data = JSON.stringify(data_to_save, null, 2)
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
    svg.selectAll('.sankey-tooltip').remove()
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
    svg.selectAll('.sankey-tooltip').remove()
    svg.selectAll('text[visibility=hidden]').remove()
    svg.attr('viewBox', [0, 0, data.width, data.height] as unknown as string)
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

  //Réinitialise data et vide les noeud/liens sélectionnés 
  const reinitialization = () => {
    const data = default_sankey_data()
    multi_selected_nodes.current = []
    multi_selected_links.current = []
    multi_selected_label.current = []
    localStorage.removeItem('diff')
    localStorage.removeItem('data')
    localStorage.removeItem('initial_data')
    set_selected_style_node('default')
    set_selected_style_link('default')
    set_view('none')
    set_data({ ...data })
  }
  //Modifie la variable qui permet d'afficher le menu accordéon
  const toggleShow = () => {
    set_show_nav(!show_nav)
    if (button_ref && button_ref.current ) {
      button_ref.current.click()
    }
  }
  const setChecked = useState(false)[1]


  //Ajoute un nouveau flux et le sélectionne
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
    if (link.idSource === link.idTarget) {
      link.recycling = true
    }

    nodes[node_keys[0]].outputLinksId.push(link.idLink)
    nodes[node_keys[1]].inputLinksId.push(link.idLink)

    selected_link.current = link
    multi_selected_links.current = [link]
    set_data({ ...data })
    set_show_link(true)
  }

  let node = data.nodes[selected_node.current.idNode]
  if (node === undefined) {
    node = default_node(data)
  }
  //Change la source du flux sélectionné
  const source_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    const link = multi_selected_links.current[0]
    //Causait un problème d'acumulation de la valeur de des differents link sur des noeuds non associé
    const previous_node = data.nodes[link.idSource]
    previous_node.outputLinksId.splice(previous_node.outputLinksId.indexOf(multi_selected_links.current[0].idLink), 1)

    const source_node = data.nodes[changeEvent.target.value]
    link.idSource = source_node.idNode
    if (link.idSource === link.idTarget) {
      link.recycling = true
    }
    source_node.outputLinksId.push(multi_selected_links.current[0].idLink)


    set_data({ ...data })
  }

  const addDropSource = () => {
    if (Object.keys(data.nodes).length >= 2 && Object.keys(data.links).length != 0 && multi_selected_links.current.length != 0) {
      return (
        Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode} selected={multi_selected_links.current[0].idSource === n.idNode} >{n.name}</option>)
      )
    }
  }
  const addDropCible = () => {
    if (Object.keys(data.nodes).length >= 2 && Object.keys(data.links).length != 0 && multi_selected_links.current.length != 0) {
      return (
        Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode} selected={multi_selected_links.current[0].idTarget === n.idNode} >{n.name}</option>)
      )
    }
  }

  //Change la cible du flux sélectionné
  const target_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    const { nodes } = data
    const link = multi_selected_links.current[0]
    const previous_node = nodes[link.idTarget]
    previous_node.inputLinksId.splice(previous_node.inputLinksId.indexOf(multi_selected_links.current[0].idLink), 1)

    const target_node = nodes[changeEvent.target.value]
    link.idTarget = target_node.idNode
    if (link.idSource === link.idTarget) {
      link.recycling = true
    }


    target_node.inputLinksId.push(multi_selected_links.current[0].idLink)

    set_data({ ...data })
  }
  const tmpNodes = Object.fromEntries(Object.entries(data.nodes).sort(([, a], [, b]) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)))
  const INITIAL_OPTIONS = Object.values(tmpNodes).map((d) => { return { 'label': d.name, 'value': d.idNode } })
  // const INITIAL_OPTIONS = Object.values(data.nodes).map(d => d.name).sort().map((d) => { return { 'label': d, 'value': d } })

  const selected : selected_type[] = multi_selected_nodes.current.map((d) => { return { 'label': d.name, 'value': d.idNode } })
  const props = {
    scroll: true,
    backdrop: false,
  }

  //Renvoie le menue déroulant pour la sélection des noeuds
  const dropdownMultiNode = () => {
    const DD = (
      <div id='DD_multi_node'>
        <MultiSelect
          valueRenderer={(selected: selected_type[]) => {
            return selected.length ? selected.map(({ label })=> label + ', ') : 'Aucun noeud sélectionné'
          }}
          options={INITIAL_OPTIONS}
          value={selected}
          overrideStrings={{
            'selectAll': 'Tout sélectionner',
          }}
          onChange={(selected: [{ label: string, value: string }]) => {
            const new_sel = selected.map(d => d.value)
            const m_s = Object.values(data.nodes).filter(d => (new_sel.includes(d.idNode)))
            multi_selected_nodes.current = m_s
            Object.values(data.nodes).forEach( n => 
              d3.select('#' + n.idNode).attr('stroke-width',0)
            )
            multi_selected_nodes.current.forEach( n => 
              d3.select('#' + n.idNode).attr('stroke-width',2)
            )
            setForceUpdate(!forceUpdate)          
          }}
          labelledBy={'hello'}
        />
      </div>)
    return DD
  }
  const tmplabel = Object.fromEntries(Object.entries(data.labels).sort(([, a], [, b]) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)))
  const INITIAL_OPTIONS_label = Object.values(tmplabel).map((d) => { return { 'label': d.name, 'value': d.idLabel } })
  const selected_label = multi_selected_label.current.map((d) => { return { 'label': d.name, 'value': d.idLabel } })
  //Renvoie le menue déroulant pour la sélection des labels libres
  const dropdownMultiLabel = () => {
    const DD = (
      <div id='DD_multi_label'>


        <MultiSelect
          valueRenderer={(selected: selected_type[]) => {
            return selected.length ? selected.map(({ label }) => label + ', ') : 'Aucun label sélectionné'
          }}
          options={INITIAL_OPTIONS_label}
          value={selected_label}
          overrideStrings={{
            'selectAll': 'Tout sélectionner',
          }}
          onChange={(selected: [{ label: string, value: string }]) => {
            const new_sel = selected.map(d => d.value)
            const m_s = Object.values(data.labels).filter(d => (new_sel.includes(d.idLabel)))
            multi_selected_label.current = m_s
            setForceUpdate(!forceUpdate) 
          }}
          labelledBy={'hello'}
        />
      </div>)
    return DD
  }


  const INITIAL_OPTIONS_LINKS = Object.values(data.links).map((d) => { return { 'label': (data.nodes[d.idSource].name + '--->' + data.nodes[d.idTarget].name), 'value': d.idLink } })
  const selected_links = multi_selected_links.current.map((d) => {
    if (data.nodes[d.idSource] == undefined || data.nodes[d.idTarget] == undefined) {
      return
    }
    return { 'label': (data.nodes[d.idSource].name + '--->' + data.nodes[d.idTarget].name), 'value': d.idLink }
  })
  //Renvoie le menue déroulant pour la sélection des flux
  const dropdownMultiLinks = () => {
    const DD = (
      <div id='DD_multi_links'>
        <MultiSelect
          valueRenderer={ (selected :selected_type[]) => {
            return selected.length ? selected.map( ({label}) => label + ', ') : 'Aucun flux sélectionné'
          }}
          options={INITIAL_OPTIONS_LINKS}
          value={selected_links}
          overrideStrings={{
            'selectAll': 'Tout sélectionner',
          }}
          onChange={(selected: [{ label: string, value: string }]) => {
            const new_sel = selected.map(d => d.value)
            const m_s = Object.values(data.links).filter(d => (new_sel.includes(d.idLink)))
            multi_selected_links.current = m_s
            Object.values(data.links).forEach( l => {
              
              d3.selectAll('#gg_' + l.idLink + ' rect').attr('fill-opacity', '0')
              d3.selectAll('#gg_' + l.idLink + ' .drag_zone').attr('stroke-opacity', '0')

            } 
            )
            multi_selected_links.current.forEach( l => {
              const sel = d3.selectAll('#gg_' + l.idLink + ' rect')
              sel.attr('fill-opacity', '1')
              d3.selectAll('#gg_' + l.idLink + ' .drag_zone').attr('stroke-opacity', '1')

              
            })
            setForceUpdate(!forceUpdate) 
          }}
          labelledBy={'hello'}
        />
      </div>)
    return DD
  }
  const menuButton = () => {
    if (show_nav) {
      return t('Menu.confSankey')
    } else {
      return <FaAngleDoubleLeft />
    }

  }


  //Dépalce la place des liens sélectionnés vers le début dans le tableau de liens de data
  //Permet donc de les déssiner avant 
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

  //Dépalce la place des liens sélectionnés vers la fin dans le tableau de liens de data
  //Permet donc de les déssiner après 
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


  //=================FONCTION POUR TEST VALEUR MULTI SELECT LABEL===========================
  const allLabelHeight = () => {
    let display_size = true
    let size = 25
    if (multi_selected_label.current.length != 0) {
      size = multi_selected_label.current[0].label_height
    }
    multi_selected_label.current.map((d) => {
      display_size = (d.label_height == size) ? display_size : false
    })
    return (display_size) ? size : -1
  }

  const allLabelWidth = () => {
    let display_size = true
    let size = 25
    if (multi_selected_label.current.length != 0) {
      size = multi_selected_label.current[0].label_width
    }
    multi_selected_label.current.map((d) => {
      display_size = (d.label_width == size) ? display_size : false
    })
    return (display_size) ? size : -1
  }

  const allLabelTransparent = () => {
    let transparent = false

    multi_selected_label.current.map((d) => {
      transparent = (d.transparent) ? true : transparent
    })
    return transparent
  }
  const allLabelBorderTransparent = () => {
    let transparent = false

    multi_selected_label.current.map((d) => {
      transparent = (d.transparent_border) ? true : transparent
    })
    return transparent
  }

  const allNodeLabelVert = (arg: string, pos: string) => {
    let all_same = true
    if (multi_selected_label.current.length > 0) {
      if (arg == 'vert') {
        multi_selected_label.current.map(d => all_same = (d.position_vert !== pos) ? false : all_same)
      } else if (arg == 'horiz') {
        multi_selected_label.current.map(d => all_same = (d.position_horiz !== pos) ? false : all_same)
      }
    } else {
      all_same = false
    }
    return all_same
  }


  const allLabelFontSize = () => {
    let display_size = true
    let size = 1
    if (multi_selected_label.current.length != 0) {
      size = multi_selected_label.current[0].font_size
    }
    multi_selected_label.current.map((d) => {
      display_size = (d.font_size == size) ? display_size : false
    })
    return (display_size) ? size : -1
  }

  const allLabelTextBold = () => {
    let bold = false

    multi_selected_label.current.map((d) => {
      bold = (d.font_weight) ? true : bold
    })
    return bold
  }

  const allLabelTextItalic = () => {
    let italic = false

    multi_selected_label.current.map((d) => {
      italic = (d.font_style) ? true : italic
    })
    return italic
  }

  const allLabelTextUpper = () => {
    let up = false

    multi_selected_label.current.map((d) => {
      up = (d.font_uppercase) ? true : up
    })
    return up
  }

  const label_libre_align_vert=()=>{
    multi_selected_label.current.map(d=>{
      switch(d.position_vert){
      case 'milieu':
        d.y_label=d.label_height/2
        break
      case 'bas':
        d.y_label=d.label_height-3
        break
      default:
        d.y_label=d.label_height-3
        break
      }
    })
  }
  const label_libre_align_horiz=()=>{
    multi_selected_label.current.map(d=>{
      switch(d.position_horiz){
      case 'milieu':
        d.x_label=d.label_width/2
        break
      case 'droite':
        d.x_label=d.label_width-3
        break
      default:
        d.x_label=d.label_width-3
        break
      }
    })
  }


  //Dépalce la place des labels libres sélectionnés vers le debut dans le tableau de liens de data
  //Permet donc de les déssiner après 
  const handleUplabel = (i: string) => {
    const { labels } = data
    const listElmt = Object.keys(labels)
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt - 1, 0, i)
    const new_cat: { [key: string]: SankeyLabel } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = labels[elt]
    })
    for (const member in labels) delete labels[member]
    Object.assign(labels, new_cat)
    set_data({ ...data })
  }


  //Dépalce la place des labels libres sélectionnés vers la fin dans le tableau de liens de data
  //Permet donc de les déssiner après 
  const handleDownlabel = (i: string) => {
    const { labels } = data
    const listElmt = Object.keys(labels)
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt + 1, 0, i)
    const new_cat: { [key: string]: SankeyLabel } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = labels[elt]
    })
    for (const member in labels) delete labels[member]
    Object.assign(labels, new_cat)
    set_data({ ...data })
  }

  const [showPreference, setShowPreference] = useState(false)
  const preferenceCheck = (str: string) => {
    if (!data.accordeonToShow.includes(str)) {
      data.accordeonToShow.push(str)
    } else {
      const posElemt = data.accordeonToShow.indexOf(str)
      data.accordeonToShow.splice(posElemt, 1)
    }

  }
  const modalPreference = (<Modal show={showPreference} onHide={() => { setShowPreference(false) }}>
    <Modal.Header closeButton>
      <Modal.Title>Édition Préferences</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form.Group as={Row}>
        <Col xs={6}>Charger une police d'icones</Col>
        <Col xs={6}><FormControl
          //Permet de charger les icon, pour l'instant permet de formater les données issus de https://icomoon.io/
          type='file'
          onChange={(evt: ChangeEvent) => {
            const files = (evt.target as HTMLFormElement).files
            const reader = new FileReader()
            reader.onload = (() => {
              return (e: ProgressEvent<FileReader>) => {
                const result = String((e.target as FileReader).result)
                const js = JSON.parse(result)
                type name_type = {name:string}   
                type icon_type = {paths:string[]}   
                type type1 = {
                  properties: name_type
                  icon: icon_type
                }
                js.icons.map((d : type1) => {
                  const name = d.properties.name as string
                  data.icon_catalog[name] = d.icon.paths[0]
                })
              }
            })()
            reader.readAsText(files[0])
            set_data(data)
          }}
        >
        </FormControl>
        </Col>
      </Form.Group>

      <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }} ></hr>
      <ButtonGroup>
        <Button variant={(mode_visualisation)?'success':'outline-success'}
          onClick={() => {
            data.accordeonToShow = ['Vis','Leg']
            set_mode_selection('s')
            set_mode_visualisation(true)
            set_data({ ...data })

          }}
        >Visualisation</Button>
        <Button variant={(mode_visualisation)?'outline-warning':'warning'}
          onClick={() => {
            set_mode_visualisation(false)
          }}
        >Construction</Button>
      </ButtonGroup>

      <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }} ></hr>
      
      <ButtonGroup>
        <Button variant='info'
          disabled={mode_visualisation}
          onClick={() => {
            data.accordeonToShow = ['MEP']
            set_data({ ...data })

          }}
        >Simple</Button>
        <Button variant='dark'
          disabled={mode_visualisation}
          onClick={() => {
            data.accordeonToShow = ['MEP', 'EN', 'EF', 'ED', 'LL', 'Vis', 'Leg']
            set_data({ ...data })
          }}
        >Expert</Button>
      </ButtonGroup>
      <Form>
        <Form.Check disabled={mode_visualisation} checked={data.accordeonToShow.includes('MEP')} type="checkbox" label={t('Menu.MEP')} onChange={() => {
          preferenceCheck('MEP')
          set_data({ ...data })
        }} />
        <Form.Check checked={!mode_visualisation} disabled type="checkbox" label={t('Menu.Noeuds')} />
        <Form.Check disabled={mode_visualisation} checked={data.accordeonToShow.includes('EN')} type="checkbox" label={t('Menu.EN')} onChange={() => {Form.Check
          preferenceCheck('EN')
          set_data({ ...data })
        }} />
        <Form.Check checked={!mode_visualisation} disabled type="checkbox" label={t('Menu.flux')} />
        <Form.Check disabled={mode_visualisation} checked={data.accordeonToShow.includes('EF')} type="checkbox" label={t('Menu.EF')} onChange={() => {
          preferenceCheck('EF')
          set_data({ ...data })
        }} />
        <Form.Check disabled={mode_visualisation} checked={data.accordeonToShow.includes('ED')} type="checkbox" label={t('Menu.ED')} onChange={() => {
          preferenceCheck('ED')
          set_data({ ...data })
        }} />
        <Form.Check disabled={mode_visualisation} checked={data.accordeonToShow.includes('LL')} type="checkbox" label={t('Menu.LL')} onChange={() => {
          preferenceCheck('LL')
          set_data({ ...data })
        }} />
        {/* <Form.Check disabled={mode_visualisation} checked={data.accordeonToShow.includes('Vis')} type="checkbox" label="Storytelling" onChange={() => {
          preferenceCheck('Vis')
          set_data({ ...data })
        }} /> */}
        <Form.Check disabled={mode_visualisation} checked={data.accordeonToShow.includes('Leg')} type="checkbox" label="Légends" onChange={() => {
          preferenceCheck('Leg')
          set_data({ ...data })
        }} />

      </Form>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={() => { setShowPreference(false) }}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>)

  //Modal et fonctions pour l'édition et affectation des styles de noeud
  const [showStyle, setShowStyle] = useState(false)
  const showStyleEdition = () => {
    setShowStyle(true)
  }
  const closeStyleEdition = () => {
    setShowStyle(false)
  }
  const applyStyleToNodes = () => {
    const style = data.style_node[selected_style_node]
    Object.values(data.nodes).filter(d => d.style != '' && d.style == selected_style_node).map(d => {
      //Style Noeud
      d.shape_visible = style.shape_visible
      d.color = style.color
      d.shape = style.shape


      d.node_width = style.node_width
      d.node_height = style.node_height

      //Syle label
      d.label_visible = style.label_visible
      d.show_value = style.show_value
      d.display_style.font_size = style.display_style.font_size
      d.display_style.bold = style.display_style.bold
      d.display_style.uppercase = style.display_style.uppercase
      d.display_style.italic = style.display_style.italic
      d.display_style.label_box_width = style.display_style.label_box_width
      d.display_style.label_vert = style.display_style.label_vert
      d.display_style.label_horiz = style.display_style.label_horiz
      d.display_style.font_family = style.display_style.font_family

    })

    set_data({ ...data })

  }
  const cut_name = (t: string, n: number) => {
    return (t.length > n) ? t.slice(0, n) + '...' : t
  }

  const viewOfData = () => {

    const d = JSON.parse(JSON.stringify(data.view.filter(d => d.id == view)[0].view_data)) as SankeyData
    d.view = JSON.parse(JSON.stringify(data.view))
    return d as SankeyData

  }


  const [selected_style_node, set_selected_style_node] = useState('default')
  // const [style_to_apply, set_style_to_apply] = useState('default')

  const modalStyleNode = (
    <Modal show={showStyle} onHide={closeStyleEdition} size={'lg'} >
      <Modal.Header closeButton>
        <Modal.Title>Édition Style</Modal.Title>
      </Modal.Header>
      <Modal.Body>

        <Row >
          <Col xs={1}>
            <Button size="sm" onClick={() => {
              const new_style = default_node(data)
              new_style.name = 'New Style'
              const new_id = 'style_node_' + String(new Date().getTime())
              data.style_node[new_id] = new_style
              set_data({ ...data })

            }}><FaPlus /></Button>
          </Col>

          <Col xs={5}>
            <Dropdown>
              <Dropdown.Toggle variant="success" id="dropdown-basic">{(selected_style_node != '') ? cut_name(data.style_node[selected_style_node].name, 30) : 'Choix Style'}</Dropdown.Toggle>

              <Dropdown.Menu>
                {Object.keys(data.style_node).map((d,i) => {
                  return (<Dropdown.Item key={i} onClick={() => { set_selected_style_node(d) }}>{data.style_node[d].name}</Dropdown.Item>)

                })}


              </Dropdown.Menu>
            </Dropdown>
          </Col>

          <Col xs={1}>
            <Button
              size="sm"
              variant='danger'
              disabled={selected_style_node == 'default'}
              onClick={
                () => {
                  delete data.style_node[selected_style_node]
                  set_selected_style_node((Object.keys(data.style_node).length > 0) ? Object.keys(data.style_node)[0] : '')
                }
              }
            ><FaMinus /></Button>

          </Col>

          <Col xs={5}>
            <Button variant="warning" onClick={applyStyleToNodes}>{t('Noeud.apparence.asn')}</Button>
          </Col>
        </Row>

        <Form.Group as={Row} >
          <Col xs={2} >
            <FormLabel >{t('Menu.ns')}</FormLabel>
          </Col>
          <Col xs={10} >

            <FormControl
              value={
                (selected_style_node != '') ? data.style_node[selected_style_node].name : ''
              }

              onChange={evt => {
                data.style_node[selected_style_node].name = evt.target.value
                set_data({ ...data })
              }}
            />
          </Col>

        </Form.Group>


        <Col md={12}>
          <Tabs defaultActiveKey="nodes_desc" id="node_attributes">
            <Tab eventKey="nodes_desc" title={t('Noeud.apparence.apparence')}>
              <Form >
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.apparence.Visibilité')}</FormLabel>
                  </Col>
                  <Col xs={1}>
                    <FormCheck inline
                      type='switch'
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].shape_visible : false
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].shape_visible = evt.target.checked
                        set_data({ ...data })
                      }}
                    />
                  </Col>

                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.apparence.Couleur')}</FormLabel>
                  </Col>
                  <Col xs={3}>
                    <Form.Control
                      type='color'
                      value={
                        (selected_style_node != '') ? data.style_node[selected_style_node].color : '#ffffff'
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].color = evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel>{t('Noeud.apparence.Forme')}</FormLabel>
                  </Col>
                  <Col xs={2}>
                    <FormCheck
                      value="ellipse"
                      type='radio'
                      label={t('Noeud.apparence.Cercle')}

                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].shape == 'ellipse' : false
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].shape = evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>

                  <Col xs={2}>
                    <FormCheck
                      value="rect"
                      type='radio'
                      label={t('Noeud.apparence.Rectangle')}

                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].shape == 'rect' : false
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].shape = evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
              </Form>
              <Form >
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.apparence.TML')}</FormLabel>
                  </Col>
                  <Col>
                    <FormControl
                      min={0} max={100}
                      type={'number'}
                      value={
                        (selected_style_node != '') ? data.style_node[selected_style_node].node_width : 0
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].node_width = +evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>px</Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.apparence.TMH')}</FormLabel>
                  </Col>
                  <Col>
                    <FormControl
                      min={0} max={100}
                      type={'number'}

                      value={
                        (selected_style_node != '') ? data.style_node[selected_style_node].node_height : 0
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].node_height = +evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>px</Col>
                </Form.Group>


              </Form>
            </Tab>

            <Tab eventKey="label_desc" title={t('Noeud.labels.labels')}>
              <Form>

                <Row>
                  <Col xs={6}>{t('Flux.pdl')}</Col>
                  <Col xs={6}><Form.Select
                    onChange={
                      (evt: React.ChangeEvent<HTMLSelectElement>) => {
                        data.style_node[selected_style_node].display_style.font_family = evt.target.value
                        set_data({ ...data })
                      }
                    }
                  >
                    {data.display_style.font_family.map((d) => {
                      return <option
                        key={'ff-' + d}
                        value={d}
                        selected={d == data.style_node[selected_style_node].display_style.font_family}
                      >{d}</option>

                    })}
                  </Form.Select></Col>
                </Row>

                <Form.Group as={Row} >
                  <Col xs={4}>{t('Noeud.apparence.Visibilité')}</Col>
                  <Col xs={1}>
                    <FormCheck inline
                      type='switch'
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].label_visible : false
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].label_visible = evt.target.checked
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.labels.vdv')}</FormLabel>
                  </Col>
                  <Col xs={1}>
                    <FormCheck inline
                      type='switch'
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].show_value : false
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].show_value = evt.target.checked
                        set_data({ ...data })
                      }}
                    />
                  </Col>

                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.labels.tp')}</FormLabel>
                  </Col>
                  <Col xs={5}>
                    <FormControl
                      min={11} max={20}
                      type={'number'}
                      value={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.font_size : 0
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].display_style.font_size = +evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>px</Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={3}>
                    <FormLabel >{t('Noeud.labels.police')}</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label={t('LL.gras')}
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.bold : false
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].display_style.bold = evt.target.checked
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label={t('LL.maj')}
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.uppercase : false
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].display_style.uppercase = evt.target.checked
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label={t('LL.ita')}
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.italic : false
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].display_style.italic = evt.target.checked
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel>{t('Noeud.labels.cl')}</FormLabel>
                  </Col>
                  <Col xs={5}>
                    <FormControl
                      type={'number'}
                      placeholder={'110'}
                      min={0}
                      max={500}
                      value={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.label_box_width : 0
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].display_style.label_box_width = +evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>px</Col>
                </Form.Group>


                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.labels.pv')}</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.haut')}

                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.label_vert == 'haut' : false
                      }

                      onChange={() => {
                        data.style_node[selected_style_node].display_style.label_vert = 'haut'
                        set_data({ ...data })
                      }}

                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.Milieu')}
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.label_vert == 'milieu' : false
                      }

                      onChange={() => {
                        data.style_node[selected_style_node].display_style.label_vert = 'milieu'
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.Bas')}
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.label_vert == 'bas' : false
                      }

                      onChange={() => {
                        data.style_node[selected_style_node].display_style.label_vert = 'bas'
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.labels.ph')}</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.gauche')}
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.label_horiz == 'gauche' : false
                      }

                      onChange={() => {
                        data.style_node[selected_style_node].display_style.label_horiz = 'gauche'
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.Milieu')}
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.label_horiz == 'milieu' : false
                      }

                      onChange={() => {
                        data.style_node[selected_style_node].display_style.label_horiz = 'milieu'
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.droite')}
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.label_horiz == 'droite' : false
                      }

                      onChange={() => {
                        data.style_node[selected_style_node].display_style.label_horiz = 'droite'
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
              </Form>
            </Tab>
          </Tabs>
        </Col>
        <Row>Noeuds affectés au style :{Object.values(data.nodes).filter(d => d.style == selected_style_node).map(d => d.name).join('/')}</Row>

      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeStyleEdition}>Close</Button>
      </Modal.Footer>
    </Modal>)

  const apply_style_to_nodes = () => {
    const style = data.style_node[style_to_apply]
    multi_selected_nodes.current.map(d => {
      //Style Noeud
      d.shape_visible = style.shape_visible
      d.color = style.color
      d.shape = style.shape
      d.node_width = style.node_width
      d.node_height = style.node_height

      //Syle label
      d.label_visible = style.label_visible
      d.show_value = style.show_value
      d.display_style.font_size = style.display_style.font_size
      d.display_style.bold = style.display_style.bold
      d.display_style.uppercase = style.display_style.uppercase
      d.display_style.italic = style.display_style.italic
      d.display_style.label_box_width = style.display_style.label_box_width
      d.display_style.label_vert = style.display_style.label_vert
      d.display_style.label_horiz = style.display_style.label_horiz
      d.display_style.font_family = style.display_style.font_family


    })
    set_data({ ...data })


  }

  const style_of_selected_nodes = () => {
    let style_to_display = 'Aucun'
    if (multi_selected_nodes.current.length != 0) {
      style_to_display = multi_selected_nodes.current[0].style
      let inchangee = true
      multi_selected_nodes.current.map(d => {
        inchangee = (d.style == style_to_display) ? inchangee : false
      })
      if (style_to_display != '' && style_to_display !== undefined) {
        return (inchangee) ? cut_name(data.style_node[style_to_display].name, 20) : 'Multiple style parmi les noeuds sélectionnés'

      } else {
        return 'Aucun'
      }
    } else {
      return style_to_display
    }
  }



  //Modal et fonctions pour l'edition et affectation des style de flux
  const [showStyleLink, setShowStyleLink] = useState(false)
  const showStyleEditionLink = () => {
    setShowStyleLink(true)
  }
  const closeStyleEditionLink = () => {
    setShowStyleLink(false)
  }
  const applyStyleToLinks = () => {
    const style = data.style_link[selected_style_link]
    Object.values(data.links).filter(d => d.style != '' && d.style == selected_style_link).map(d => {
      d.recycling = style.recycling
      d.orientation = style.orientation
      d.arrow = style.arrow

      // display_attribute
      d.label_position = style.label_position
      d.orthogonal_label_position = style.orthogonal_label_position
      d.label_on_path = style.label_on_path
      d.label_visible = style.label_visible
      d.text_color = style.text_color
      d.color = style.color

      d.gradient = style.gradient

      d.curvature = style.curvature
      d.curved = style.curved
    })

    set_data({ ...data })

  }
  const apply_style_to_selected_links = () => {
    const style = data.style_link[style_to_apply_to_link]

    multi_selected_links.current.map(d => {

      // type of link
      d.recycling = style.recycling
      d.orientation = style.orientation
      d.arrow = style.arrow

      // display_attribute
      d.label_position = style.label_position
      d.orthogonal_label_position = style.orthogonal_label_position
      d.label_on_path = style.label_on_path
      d.label_visible = style.label_visible
      d.text_color = style.text_color
      d.color = style.color

      d.gradient = style.gradient

      d.curvature = style.curvature
      d.curved = style.curved
    })
  }
  const [selected_style_link, set_selected_style_link] = useState('default')
  const [style_to_apply_to_link, set_style_to_apply_to_link] = useState('default')

  const modalStyleLink = (
    <Modal show={showStyleLink} onHide={closeStyleEditionLink} size={'lg'} >
      <Modal.Header closeButton>
        <Modal.Title>Édition Style</Modal.Title>
      </Modal.Header>
      <Modal.Body>

        <Row >
          <Col xs={1}>
            <Button size="sm" onClick={() => {
              const new_style = default_link(data)
              new_style.idLink = 'New Style'
              const new_id = 'style_link_' + String(new Date().getTime())
              data.style_link[new_id] = new_style
              set_data({ ...data })

            }}><FaPlus /></Button>
          </Col>

          <Col xs={5}>
            <Dropdown>
              <Dropdown.Toggle variant="success" id="dropdown-basic">{(selected_style_link != '') ? cut_name(data.style_link[selected_style_link].idLink, 30) : 'Choix Style'}</Dropdown.Toggle>

              <Dropdown.Menu>
                {Object.keys(data.style_link).map((d,i) => {

                  return (<Dropdown.Item key={i} onClick={() => { set_selected_style_link(d) }}>{data.style_link[d].idLink}</Dropdown.Item>)

                })}


              </Dropdown.Menu>
            </Dropdown>
          </Col>

          <Col xs={1}>
            <Button
              size="sm"
              variant='danger'
              disabled={selected_style_link == 'default'}
              onClick={
                () => {
                  delete data.style_link[selected_style_link]
                  set_selected_style_link((Object.keys(data.style_link).length > 0) ? Object.keys(data.style_link)[0] : '')
                }
              }
            ><FaMinus /></Button>

          </Col>

          <Col xs={5}>
            <Button variant="warning" onClick={applyStyleToLinks}>{t('Flux.asf')}</Button>
          </Col>
        </Row>

        <Form.Group as={Row} >
          <Col xs={2} >
            <FormLabel >{t('Menu.ns')}</FormLabel>
          </Col>
          <Col xs={10} >

            <FormControl
              value={
                (selected_style_link != '') ? data.style_link[selected_style_link].idLink : ''
              }

              onChange={evt => {
                data.style_link[selected_style_link].idLink = evt.target.value
                set_data({ ...data })
              }}
            />
          </Col>

        </Form.Group>


        <Row>
          <Col md={12}>
            <Tabs defaultActiveKey="flux_attributes" id="settings-layout">
              <Tab eventKey="flux_attributes" title={t('Noeud.apparence.apparence')}>
                <Form >

                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel >{t('Noeud.apparence.Visibilité')}:</FormLabel>
                    </Col>
                    <Col>
                      <Form.Control
                        type="color"
                        value={data.style_link[selected_style_link].color}
                        onChange={
                          evt => {
                            // selected_link.current.color = evt.target.value
                            const color = evt.target.value
                            data.style_link[selected_style_link].color = color
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                  </Form.Group>


                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel >{t('Flux.apparence.grad')}:</FormLabel>
                    </Col>
                    <Col>
                      <Form.Check
                        inline
                        type="checkbox"
                        checked={data.style_link[selected_style_link].gradient}
                        onChange={
                          evt => {
                            // selected_link.current.color = evt.target.value
                            data.style_link[selected_style_link].gradient = evt.target.checked
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                  </Form.Group>



                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel>{t('Flux.apparence.type')}:</FormLabel>
                    </Col>
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label={t('Flux.apparence.courbe')}
                        checked={data.style_link[selected_style_link].curved}
                        onChange={
                          evt => {
                            data.style_link[selected_style_link].curved = evt.target.checked
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label={t('Flux.apparence.fleche')}
                        checked={data.style_link[selected_style_link].arrow}
                        onChange={
                          evt => {
                            data.style_link[selected_style_link].arrow = evt.target.checked
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label={t('Flux.apparence.recy')}
                        checked={(data.style_link[selected_style_link].recycling) ? true : false}
                        onChange={
                          evt => {
                            data.style_link[selected_style_link].recycling = evt.target.checked
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel >{t('Flux.apparence.courbure')}</FormLabel>
                    </Col>

                    <Col>
                      <FormControl

                        min={0} max={1} step={0.01}
                        type={'number'}
                        value={data.style_link[selected_style_link].curvature}
                        onChange={
                          evt => {
                            data.style_link[selected_style_link].curvature = +evt.target.value

                            set_data({ ...data })
                          }
                        } />
                    </Col>
                    <Col sm={2}>{selected_link.current.curvature}</Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col sm={12}>
                      <FormCheck
                        inline
                        name='orientation'
                        type='radio'
                        label='Horiz-Horiz'
                        value='hh'
                        checked={data.style_link[selected_style_link].orientation == 'hh'}
                        onChange={
                          () => {
                            data.style_link[selected_style_link].orientation = 'hh'
                            set_data({ ...data })
                          }
                        }
                      />
                      <FormCheck
                        inline
                        name='orientation'
                        type='radio'
                        label='Vert-Vert'
                        value='vv'
                        checked={data.style_link[selected_style_link].orientation == 'vv'}
                        onChange={
                          () => {
                            data.style_link[selected_style_link].orientation == 'vv'
                            set_data({ ...data })
                          }
                        }
                      />
                      <FormCheck
                        inline
                        name='orientation'
                        type='radio'
                        label='Vert-Horiz'
                        value='vh'
                        checked={data.style_link[selected_style_link].orientation == 'vh'}
                        onChange={
                          () => {
                            data.style_link[selected_style_link].orientation = 'vh'
                            set_data({ ...data })
                          }
                        }
                      />
                      <FormCheck
                        inline
                        name='orientation'
                        type='radio'
                        label='Horiz-Vert'
                        value='hv'
                        checked={data.style_link[selected_style_link].orientation == 'hv'}
                        onChange={
                          () => {
                            data.style_link[selected_style_link].orientation = 'hv'
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                  </Form.Group>
                </Form>
              </Tab>
              <Tab eventKey="label" title={t('Flux.label.label')}>
                <Form.Group as={Row} >
                  <Col>
                    <FormCheck
                      value='black'
                      type='radio'
                      label={t('Flux.label.len')}
                      checked={data.style_link[selected_style_link].text_color == 'black'}
                      onChange={
                        () => {
                          data.style_link[selected_style_link].text_color = 'black'
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      value='white'
                      type='radio'
                      label={t('Flux.label.lb')}
                      checked={data.style_link[selected_style_link].text_color == 'white'}
                      onChange={
                        (evt) => {
                          data.style_link[selected_style_link].text_color = evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      value='same_color'
                      type='radio'
                      label={t('Flux.label.lec')}
                      checked={data.style_link[selected_style_link].text_color == 'color'}
                      onChange={
                        () => {
                          data.style_link[selected_style_link].text_color = data.style_link[selected_style_link].color
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>
                <Form.Group >
                  <FormCheck
                    type='checkbox'
                    label='Visibilité du label'
                    checked={data.style_link[selected_style_link].label_visible}
                    onChange={
                      evt => {
                        data.style_link[selected_style_link].label_visible = evt.target.checked
                        set_data({ ...data })
                      }
                    }
                  />
                </Form.Group>
                <Form.Group as={Row} >
                  <Col>
                    <FormLabel>{t('Flux.label.pl')}:</FormLabel>
                  </Col>
                  <Col>
                    <Form.Check
                      value='beginning'
                      type='radio'
                      label={t('Flux.label.deb')}
                      checked={data.style_link[selected_style_link].label_position == 'beginning'}
                      onChange={
                        evt => {
                          data.style_link[selected_style_link].label_position = evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <Form.Check
                      value='middle'
                      type='radio'
                      label={t('Noeud.labels.Milieu')}
                      checked={data.style_link[selected_style_link].label_position == 'middle'}
                      onChange={
                        evt => {
                          data.style_link[selected_style_link].label_position = evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <Form.Check
                      value='end'
                      type='radio'
                      label={t('Flux.label.fin')}
                      checked={data.style_link[selected_style_link].label_position == 'end'}
                      onChange={
                        evt => {
                          data.style_link[selected_style_link].label_position = evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>
                <Form.Group>
                  <FormCheck
                    type='checkbox'
                    label={t('Flux.label.acf')}
                    disabled={selected_link.current.label_position === 'frozen'}
                    checked={data.style_link[selected_style_link].label_on_path}
                    onChange={
                      evt => {
                        data.style_link[selected_style_link].label_on_path = evt.target.checked
                        set_data({ ...data })
                      }
                    }
                  />
                </Form.Group>
                <Form.Group as={Row} >
                  <Col>
                    <FormLabel>{t('Flux.label.po')}:</FormLabel>
                  </Col>
                  <Col>
                    <Form.Check
                      value='below'
                      type='radio'
                      label={t('Flux.label.dessous')}
                      checked={data.style_link[selected_style_link].orthogonal_label_position == 'below'}

                      onChange={
                        evt => {
                          data.style_link[selected_style_link].orthogonal_label_position = evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <Form.Check
                      value='middle'
                      type='radio'
                      label={t('Noeud.labels.Milieu')}
                      checked={data.style_link[selected_style_link].orthogonal_label_position == 'middle'}
                      onChange={
                        evt => {
                          data.style_link[selected_style_link].orthogonal_label_position = evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <Form.Check
                      value='above'
                      type='radio'
                      label={t('Flux.label.dessus')}
                      checked={data.style_link[selected_style_link].orthogonal_label_position == 'above'}

                      onChange={
                        evt => {
                          data.style_link[selected_style_link].orthogonal_label_position = evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>
              </Tab>
            </Tabs>
          </Col>
        </Row>
        <Row>Noeuds affectés au style :{Object.values(data.links).filter(d => d.style == selected_style_link).map(d => d.idSource + '-->' + d.idTarget).join('/')}</Row>

      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeStyleEditionLink}>Close</Button>
      </Modal.Footer>
    </Modal>)

  const [show_publish_dialog,set_show_publish_dialog] = useState(false)

  const publishImpl = (file_path:string) =>{
    // const form_data = new FormData()
    // form_data.append('file', input_file)

    const path = window.location.href

    const url = path + url_prefix + 'sankey/publish'

    const new_data = JSON.parse(JSON.stringify(data))
    new_data.file_name = file_path

    const fetchData = {
      method: 'POST',
      body: JSON.stringify(new_data, null, 2)
    }

    fetch(url, fetchData).then( response => {
      if (!response.ok) {
        alert(response)
      }
    })
    set_show_publish_dialog(false)
  }


  //Change le style des flux sélectionnés
  const style_of_selected_links = () => {
    let style_to_display = 'Aucun'
    if (multi_selected_links.current.length != 0) {
      style_to_display = multi_selected_links.current[0].style
      let inchangee = true
      multi_selected_links.current.map(d => {
        inchangee = (d.style == style_to_display) ? inchangee : false
      })
      if (style_to_display != '' && style_to_display !== undefined) {
        return (inchangee) ? cut_name(data.style_link[style_to_display].idLink, 25) : 'Multiple style parmi les noeuds sélectionnés'

      } else {
        return 'Aucun'
      }
    } else {
      return style_to_display
    }
  }

  //Modal pour les raccourcis clavier
  const [showShortcut, setshowShortcut] = useState(false)
  const modalShortcut = (
    <Modal size={'lg'} show={showShortcut} onHide={() => setshowShortcut(false)}>
      <Modal.Header closeButton>
        <Modal.Title>{t('Menu.rc')}</Modal.Title>
      </Modal.Header>
      <Modal.Body >
        <p>Fonctionnement des clics :</p>
        <p><b>CTRL + Clic (noeuds) :</b> Sélectionne le noeuds click dans l'onglet "<b>Noeuds</b>" du menu</p>
        <p><b>CTRL + Clic (flux) :</b> Sélectionne le flux click dans l'onglet "<b>Flux</b>" du menu</p>
        <p><b>Suppr</b> ou <b>Retour arrière :</b> Supprime les noeuds et flux sélectionnés</p>
        <p><b>Clic (en dehors d'un noeud/flux) :</b>  Désélectionne les noeuds et flux sélectionnés</p>
        <p><b>Clic droit (noeuds) :</b>  Agrége le noeud</p>
        <p><b>Alt Clic droit (noeuds) :</b>  Désagrége le noeud</p>
        <p><b>Alt Clic (label noeuds) :</b>  Déplace le label</p>
        <p><b>CTRL + S :</b> Sauvegarde la configuration actuelle dans une vue, qui peut ensuite être visualisé dans le Menu Vue </p>
        <p><b>Flèche du clavier :</b> Permet de déplacer les noeuds sélectionnés en fonction du grillage  </p>
        <p><b>Echap :</b> Ferme le Menu si il est ouvert </p>

      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setshowShortcut(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>

  )



  const [showHelp, setshowHelp] = useState(false)
  const modalHelp = (
    <Modal size={'lg'} show={showHelp} onHide={() => setshowHelp(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Aide</Modal.Title>
      </Modal.Header>
      <Modal.Body >
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setshowHelp(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>

  )



  return (
    <>
      {//Ajout des pop up des différents menu d'edition (style,raccourci clavier, aide supplémentaire)
      
      } 
      { !data.static_sankey ? (
        modalStyleNode
      ): (<></>)}
      { !data.static_sankey ? (
        modalPreference
      ): (<></>)}
      { !data.static_sankey ? (
        modalStyleLink
      ): (<></>)}
      { !data.static_sankey ? (
        modalShortcut
      ): (<></>)}
      { !data.static_sankey ? (
        modalHelp
      ): (<></>)}

      <Navbar className='bg-light' fixed='top' style={{ 'display': 'block' }} >
        <Container className='MenuNavigation'>
          <Navbar.Brand href="#"><img src={logo} width={logo_width} /> {app_name} </Navbar.Brand>
          {!window.SankeyToolsStatic ? (<>
            <Nav>
              <NavDropdown  title={t('Menu.Fichiers')} id="files" >
                <NavDropdown drop='start' id='ouvrir' title={t('Menu.ouvrir')}  >
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
                            (new_data.version as unknown as undefined) = undefined
                          }
                          convert_data(new_data)
                          set_nodes_level(data)
                          set_data(new_data)
                          const test = document.getElementsByClassName('navbar')
                          let margin_top = 0
                          if (test && test.length > 0) {
                            margin_top = test[0].getBoundingClientRect().height
                            d3.select('#svg-container').style('margin-top',margin_top+'px')
                          }
                        }
                      })()
                      reader.readAsText(files[0])
                    }}
                  />
                  <Dropdown.Item
                    onClick={() => set_show_excel_dialog(true)}
                  >Excel</Dropdown.Item>
                  {open_menu}
                </NavDropdown>
                <NavDropdown  drop='start' id='enregistrer' title={t('Menu.enregistrer')} >
                  <Dropdown.Item onClick={clickSaveDiagram} >JSON</Dropdown.Item>
                  <Dropdown.Item onClick={clickSaveExcel} >Excel</Dropdown.Item>
                  {save_menu}
                </NavDropdown>
                <NavDropdown drop='start' id='exporter' title={t('Menu.exporter')} >
                  <Dropdown.Item onClick={clickSaveSVG} >{t('Menu.exporter')} SVG</Dropdown.Item>
                  <Dropdown.Item onClick={clickSavePDF} >{t('Menu.exporter')} PDF</Dropdown.Item>
                </NavDropdown>
                <Dropdown.Item onClick={() => { setShowPreference(true) }}>{t('Menu.preference')}</Dropdown.Item>
              </NavDropdown>
              <NavDropdown id='edition' title={t('Menu.Edition')} >
                <Dropdown.Item onClick={reinitialization} >{t('Menu.reinit')}</Dropdown.Item>
                <Dropdown.Item onClick={() => set_show_publish_dialog(true)} >{t('Menu.pub')}</Dropdown.Item>    
                <Dropdown.Item onClick={() => set_show_apply_layout(true)}>{t('Menu.amp')}</Dropdown.Item>
                <Dropdown.Item onClick={showStyleEdition}>{t('Menu.esn')}</Dropdown.Item>
                <Dropdown.Item onClick={showStyleEditionLink}>{t('Menu.esf')}</Dropdown.Item>
              </NavDropdown >
              {edition_menu}
              { formations_menu ? (
                <NavDropdown title={t('Menu.Formations')} id="formation" >
                  {formations_menu}
                </NavDropdown > ) :(<></>)
              }
              <NavDropdown title={t('Menu.Exemples')} id="exemples" >
                {example_menu}
              </NavDropdown >
              {/* <NavDropdown title="Portfolio" id="portfolio" >
                {portfolio_menu}
              </NavDropdown > */}

              <NavDropdown id='Aide' title={t('Menu.Aide')} >
                <Dropdown.Item onClick={() => setshowShortcut(true)} >{t('Menu.rc')}</Dropdown.Item>
                <Dropdown.Item onClick={() => setshowHelp(true)}>{t('Menu.as')}</Dropdown.Item>
              </NavDropdown >
              <ReactCountryFlag countryCode={'GB'} svg title={'GB'}
                style={{
                  fontSize: '2em',
                  lineHeight: '2em',
                }}
              ></ReactCountryFlag>
              <Form.Check
                type='switch'
                checked={i18n.language=='en'}
                onChange={evt => {
                  i18n.changeLanguage((evt.target.checked)?'en':'fr')

                }}
              />

              {!data.static_sankey && !mode_visualisation ? (
                <ButtonGroup className="mb-2" style={{ 'width': (show_nav) ? '537px' : '80px' }}>
                  <ToggleButton
                    ref={button_ref as Ref<HTMLLabelElement>}
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
          ) : (<><br />
            <h2>{window.sankey.header}</h2>
            <br /></>)}
        </Container>

        {// Si nous travaillons sur les données actuelle alors on affiche le bandeau de filtrage 
          //si on affiche une vue, fait apparaitre des boutons pour changer de vue avec des animations
        }
        {(view == 'none') ? <SankeyEdition
          data={data}
          set_data={set_data}
          additional_selector={additional_selector}
          mode_selection={mode_selection}
          set_mode_selection={set_mode_selection}
          mode_visualisation={mode_visualisation}
          set_current_filter={set_current_filter}
        /> : <><Row>
          <FormGroup as={Col} lg='auto'>
            <ButtonGroup >
              <Button variant={(!(mode_selection == 's')) ? 'outline-info' : 'info'} onClick={() => {
                const ev = document
                const tmp = { key: 'p' }
                if (ev.onkeydown) {
                  ev.onkeydown(tmp as KeyboardEvent)
                }
              }}>
                <FaPlay />
              </Button>
              <Button variant={'outline-success'} onClick={() => {
                const ev = document
                const tmp = { key: 'ArrowUp' }
                if (ev.onkeydown) {
                  ev.onkeydown(tmp as KeyboardEvent)
                }
              }}>
                <FaBackward />
              </Button>
              <Button variant={'outline-warning'} onClick={() => {
                const ev = document
                const tmp = { key: 'ArrowDown' }
                if (ev.onkeydown) {
                  ev.onkeydown(tmp as KeyboardEvent)
                }
              }}>
                <FaForward />
              </Button>
            </ButtonGroup>
          </FormGroup>
        </Row>{/* {set_data({ ...data })} */}</>}

        {/* <SankeyEdition
          data={data}
          set_data={set_data}
          additional_selector={additional_selector}
          mode_selection={mode_selection}
          set_mode_selection={set_mode_selection}
        /> */}
      </Navbar>

      {(show_nav && !mode_visualisation) ? <Offcanvas className='sankey-menu' show={true} placement='end' /*onHide={set_show_nav(false)}*/ {...props} style={{ 'width': '540px', 'marginTop': '71px', 'marginRight': '15px'}}>
        <Offcanvas.Body style={{ 'padding': '0px 0px 0px 0px' }}>
          <Accordion ref={accordion_ref as Ref<HTMLDivElement>} activeKey={nav_item_active as string} >
            {//MENU AIDE 
            }

            <Accordion.Item
              id='MEP'
              style={{ 'display': (view == 'none' && data.accordeonToShow.includes('MEP')) ? 'block' : 'none' }}
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
              <Accordion.Header>{t('Menu.MEP')}</Accordion.Header>
              <Accordion.Body>
                {settings_edition}
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              style={{ 'display': (view == 'none') ? 'block' : 'none' }}
              eventKey="2"
              id="Nodes"
              onClick={
                evt => {
                  if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && ((evt.target as unknown) as { textContent: string }).textContent === t('Menu.Noeuds') && nav_item_active === '2') {
                    set_nav_item_active('')
                  } else {
                    set_nav_item_active('2')
                  }
                }
              }
            >

              <Accordion.Header>{t('Menu.Noeuds')}</Accordion.Header>
              <Accordion.Body style={{ padding: '0px' }}>

                <Accordion ref={nodes_accordion_ref  as Ref<HTMLDivElement>} activeKey={sub_nav_item_active as string} >
                  <Accordion.Item
                    style={{ 'display': (view == 'none' && data.accordeonToShow.includes('EN')) ? 'block' : 'none' }}
                    eventKey="EtiquetteNoeud"
                    onClick={
                      evt => {
                        if (((evt.target as unknown) as { className: string }).className === 'accordion-button') {
                          set_sub_nav_item_active('')
                          set_nav_item_active('2')
                          set_show_nav(true)
                        } else {
                          set_sub_nav_item_active('EtiquetteNoeud')
                          set_nav_item_active('2')
                          set_show_nav(true)

                        }
                      }
                    }
                  >
                    <Accordion.Header style={{ marginLeft: '25px'/*,padding:'10px' */ }} >
                      {t('Menu.EN')}
                    </Accordion.Header>
                    <Accordion.Body>
                      {settings_edition_node_tags}
                    </Accordion.Body>
                  </Accordion.Item>

                  <Accordion.Item eventKey='editionNoeud'
                    onClick={
                      evt => {
                        if (((evt.target as unknown) as { className: string }).className === 'accordion-button') {
                          set_sub_nav_item_active('')
                          set_nav_item_active('2')
                          set_show_nav(true)
                        } else {
                          set_sub_nav_item_active('editionNoeud')
                          set_nav_item_active('2')
                          set_show_nav(true)

                        }
                      }
                    }
                  >
                    <Accordion.Header className='level2' >{t('Menu.EdN')}</Accordion.Header>
                    <Accordion.Body>
                      <Row >
                        <Col xs={1}>
                          <Button size="sm" onClick={() => {
                            set_style_to_apply('default')

                            add_new_node()

                          }}><FaPlus /></Button>
                        </Col>

                        <Col xs={10}>
                          {dropdownMultiNode()}
                        </Col>

                        <Col xs={1}>
                          <Button
                            size="sm"
                            variant='danger'
                            disabled={multi_selected_nodes.current.length == 0}
                            onClick={
                              () => {
                                //Boutton pour supprimer le noeud selectionné
                                multi_selected_nodes.current.map(d => delete_node(data, d))
                                selected_node.current = default_node(data)
                                multi_selected_nodes.current = []
                                // Object.values(data.nodes).forEach( n => 
                                //   d3.select('#' + n.idNode).attr('stroke-width',0)
                                // )
                                // setForceUpdate(!forceUpdate)
                                set_data({ ...data })
                              }
                            }
                          ><FaMinus /></Button>

                        </Col>
                      </Row>

                      <Row >
                        <Col xs={1}>
                          <FormLabel>Style:</FormLabel>
                        </Col>

                        <Col xs={6}>
                          <Dropdown>
                            <Dropdown.Toggle variant="success" id="dropdown-basic">{style_of_selected_nodes()}</Dropdown.Toggle>

                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => {
                                set_style_to_apply('')
                                multi_selected_nodes.current.map(n => {
                                  n.style = ''
                                })
                                set_data({ ...data })
                              }}>{'Aucun'}</Dropdown.Item>
                              {Object.keys(data.style_node).map((d,i) => {
                                return (<Dropdown.Item 
                                  key={i}
                                  onClick={() => {
                                    set_style_to_apply(d)
                                    multi_selected_nodes.current.map(n => {
                                      n.style = d
                                    })
                                    set_data({ ...data })
                                  }}
                                >{data.style_node[d].name}</Dropdown.Item>)

                              })}

                            </Dropdown.Menu>
                          </Dropdown>
                        </Col>

                        <Col xs={5}>
                          <Button
                            size="sm"
                            variant='info'

                            onClick={
                              () => {
                                apply_style_to_nodes()
                              }
                            }
                          >{t('Flux.as')}</Button>

                        </Col>
                      </Row>


                      <Form.Group as={Row} >
                        <Col xs={1} >
                          <FormLabel >Nom</FormLabel>
                        </Col>
                        <Col xs={10} >

                          <FormControl
                            value={
                              (multi_selected_nodes.current.length != 1) ? '' : multi_selected_nodes.current[0].name
                            }

                            onChange={evt => {
                              if (multi_selected_nodes.current.length != 1) {
                                return
                              }
                              multi_selected_nodes.current[0].name = evt.target.value
                              const d = multi_selected_nodes.current[0]
                              d3.select('#' + d.idNode + '_text').text(evt.target.value)            
                              const wrap = textwrap()
                                .bounds({ height: 100, width: (d.display_style.label_box_width != 0) ? d.display_style.label_box_width : 110 })
                                .method('tspans')
                              d3.select('#ggg_' + d.idNode + ' text')
                                .call(wrap)
                              if (!d.x_label || data.show_structure) {
                                d3.selectAll('#ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
                                  const width = +d3.select('#' + d.idNode).attr('width')
                      
                                  if (d.display_style.label_horiz == 'milieu') {
                                    return width / 2
                                  } else if (d.display_style.label_horiz == 'droite') {
                                    return d.display_style.label_vert == 'milieu' ? width : 0
                                  } else {
                                    return 0
                                  }
                                })
                              }
                      
                              d3.selectAll('#ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
                                const width = +d3.select('#' + d.idNode).attr('width')
                                if (d.x_label) {
                                  return d.x_label
                                } else if (d.display_style.label_horiz == 'milieu') {
                                  return width / 2
                                } else if (d.display_style.label_horiz == 'droite') {
                                  return width
                                } else {
                                  return 0
                                }
                              })
                              setForceUpdate(!forceUpdate)
                            }}
                            disabled={(multi_selected_nodes.current.length == 1) ? false : true} />
                        </Col>
                        <Col xs={3}>
                        </Col>
                      </Form.Group>

                      <SankeyNodeEdition
                        data={data}
                        set_data={set_data}
                        radio_selected={radio_selected}
                        multi_selected_nodes={multi_selected_nodes}
                        multi_selected_links={multi_selected_links}
                      >{node_edition}</SankeyNodeEdition>


                      {/* <Form.Group as={Row}>
                        <Col xs={6}>Charger une police d'icones</Col>
                        <Col xs={6}><FormControl
                          //Permet de charger les icon, pour l'instant permet de formater les données issus de https://icomoon.io/
                          type='file'
                          onChange={(evt: ChangeEvent) => {
                            const files = (evt.target as HTMLFormElement).files
                            const reader = new FileReader()
                            reader.onload = (() => {
                              return (e: ProgressEvent<FileReader>) => {
                                const result = String((e.target as FileReader).result)
                                const js = JSON.parse(result)
                                js.icons.map((d: any) => {
                                  const name = d.properties.name as string
                                  data.icon_catalog[name] = d.icon.paths[0]
                                })
                              }
                            })()
                            reader.readAsText(files[0])
                            set_data(data)
                          }}
                        >
                        </FormControl>
                        </Col>
                      </Form.Group> */}



                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>


              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item
              style={{ 'display': (view == 'none') ? 'block' : 'none' }}
              id='Flux'
              eventKey="3"
              onClick={evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === '3') {
                  set_nav_item_active('')
                } else {
                  set_nav_item_active('3')
                }
              }}
            >
              <Accordion.Header >{t('Menu.flux')}</Accordion.Header>
              <Accordion.Body  style={{ padding: '0px' }}>

                <Accordion ref={links_accordion_ref as Ref<HTMLDivElement>} activeKey={sub_nav_item_active as string}>
                  <Accordion.Item
                    eventKey="8"
                    style={{ 'display': (view == 'none' && data.accordeonToShow.includes('EF')) ? 'block' : 'none' }}
                    onClick={evt => {
                      if (((evt.target as unknown) as { className: string }).className === 'accordion-button') {
                        set_sub_nav_item_active('')
                        set_nav_item_active('3')
                        set_show_nav(true)
                      } else {
                        set_sub_nav_item_active('8')
                        set_nav_item_active('3')
                        set_show_nav(true)
                      }
                    }}
                  >
                    <Accordion.Header className='level2' >{t('Menu.EF')}</Accordion.Header>
                    <Accordion.Body>{settings_edition_link_tags}</Accordion.Body>
                  </Accordion.Item>


                  <Accordion.Item  
                    eventKey='editionFlux'
                    onClick={
                      evt => {
                        if (((evt.target as unknown) as { className: string }).className === 'accordion-button') {
                          set_sub_nav_item_active('')
                          set_nav_item_active('3')
                          set_show_nav(true)
                        } else {
                          set_sub_nav_item_active('editionFlux')
                          set_nav_item_active('3')
                          set_show_nav(true)

                        }
                      }
                    }>
                    <Accordion.Header className='level2'>Edition Flux</Accordion.Header>
                    <Accordion.Body>
                      <Form.Group>
                        <FormLabel style={{ justifyContent: 'center' }} ><b>Paramétres généraux</b></FormLabel>
                        <Row>
                          <Col xs={6}>{t('Flux.pdl')}</Col>
                          <Col xs={6}><Form.Select
                            onChange={
                              (evt: React.ChangeEvent<HTMLSelectElement>) => {
                                data.display_style.link_font_family_selected = evt.target.value
                                set_data({ ...data })
                              }
                            }
                          >
                            {data.display_style.font_family.map((d) => {
                              return <option
                                key={'ff-' + d}
                                value={d}
                                selected={d == data.display_style.link_font_family_selected}
                              >{d}</option>

                            })}
                          </Form.Select></Col>
                        </Row>
                      </Form.Group>
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
                                multi_selected_links.current.forEach(l => delete_link(data, l))
                                multi_selected_links.current = []
                                set_data({ ...data })
                              }
                            }
                          ><FaMinus /></Button>
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          <FormLabel>{t('Flux.src')}</FormLabel>
                        </Col>
                        <Col>
                          <Form.Select disabled={multi_selected_links.current.length != 1} onChange={source_change}>
                            {addDropSource()}
                          </Form.Select>
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          <FormLabel>{t('Flux.trgt')}</FormLabel>
                        </Col>
                        <Col>
                          <Form.Select disabled={multi_selected_links.current.length != 1} onChange={target_change}>
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
                              const nodes_to_reorganize: SankeyNode[] = []
                              multi_selected_links.current.forEach(l => {
                                const tmp = l.idSource

                                const previous_node_s = data.nodes[l.idSource]
                                previous_node_s.outputLinksId.splice(previous_node_s.outputLinksId.indexOf(l.idLink), 1)
                                const source_node = data.nodes[l.idTarget]
                                l.idSource = source_node.idNode
                                source_node.outputLinksId.push(l.idLink)
                                nodes_to_reorganize.push(source_node)

                                const previous_node_t = data.nodes[l.idTarget]
                                previous_node_t.inputLinksId.splice(previous_node_t.inputLinksId.indexOf(l.idLink), 1)
                                const target_node = data.nodes[tmp]
                                l.idTarget = target_node.idNode
                                target_node.inputLinksId.push(l.idLink)
                                nodes_to_reorganize.push(target_node)
                              })
                              nodes_to_reorganize.forEach(n => {
                                reorganize_inputLinksId(n, true, true, data.nodes, data.links)
                              })
                              set_data({ ...data })
                            }}><FaArrowsAltH /></Button>
                        </Col>
                      </Row>

                      <Row>
                        <Col>
                          <FormLabel>{t('Flux.dzf')}</FormLabel>
                        </Col>
                        <Col >
                          {//Boutton pour monter le lien sélctionné
                          }
                          <ButtonGroup>
                            <Button variant='info' disabled={multi_selected_links.current.length != 1}
                              onClick={() => {
                                multi_selected_links.current.map(l => {
                                  handleDownLink(l.idLink)
                                })


                              }}><FaAngleUp /></Button>

                            <Button variant='info' disabled={multi_selected_links.current.length != 1}
                              onClick={() => {
                                multi_selected_links.current.map(l => {
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


                            <Button variant='warning' disabled={multi_selected_links.current.length != 1}
                              onClick={() => {
                                multi_selected_links.current.map(l => {
                                  handleUpLink(l.idLink)
                                })


                              }}><FaAngleDown /></Button>
                            {//Boutton pour baisser le lien sélctionné
                            }
                            <Button variant='warning' disabled={multi_selected_links.current.length != 1}
                              onClick={() => {
                                multi_selected_links.current.map(l => {
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

                      <Row >
                        <Col xs={1}>
                          <FormLabel>{t('Flux.style')}:</FormLabel>
                        </Col>

                        <Col xs={6}>
                          <Dropdown>
                            <Dropdown.Toggle variant="success" id="dropdown-basic">{style_of_selected_links()}</Dropdown.Toggle>

                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => {
                                set_style_to_apply_to_link('')
                                multi_selected_links.current.map(n => {
                                  n.style = ''
                                })
                                set_data({ ...data })
                              }}>{'Aucun'}</Dropdown.Item>
                              {Object.keys(data.style_link).map((d,i) => {
                                return (<Dropdown.Item key={i} onClick={() => {
                                  set_style_to_apply_to_link(d)
                                  multi_selected_links.current.map(n => {
                                    n.style = d
                                  })
                                  set_data({ ...data })
                                }}>{data.style_link[d].idLink}</Dropdown.Item>)

                              })}

                            </Dropdown.Menu>
                          </Dropdown>
                        </Col>

                        <Col xs={5}>
                          <Button
                            size="sm"
                            variant='info'

                            onClick={
                              () => {
                                apply_style_to_selected_links()
                                set_data({ ...data })
                              }
                            }
                          >{t('Flux.as')}</Button>

                        </Col>
                      </Row>

                      { (multi_selected_links.current.length !== 0) ? (
                        <SankeyLinkEdition
                          show={true}
                          data={data}
                          set_data={set_data}
                          selected_link={selected_link}
                          multi_selected_links={multi_selected_links}
                        >{link_edition}</SankeyLinkEdition>) : (<></>)}


                    </Accordion.Body>

                  </Accordion.Item>

                </Accordion>


              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item
              eventKey="dimension"
              style={{ 'display': (view == 'none' && data.accordeonToShow.includes('ED')) ? 'block' : 'none' }}
              onClick={evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === 'dimension') {
                  set_nav_item_active('')
                } else {
                  set_nav_item_active('dimension')
                }
              }}
            >
              <Accordion.Header>{t('Menu.ED')}</Accordion.Header>
              <Accordion.Body>{settings_edition_data_tags}</Accordion.Body>
            </Accordion.Item>
            <Accordion.Item
              eventKey="7"
              id="LL"
              style={{ 'display': (view == 'none' && data.accordeonToShow.includes('LL')) ? 'block' : 'none' }}
              onClick={evt => {
                if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === '7') {
                  set_nav_item_active('')
                } else {
                  set_nav_item_active('7')
                }
              }}
            >
              <Accordion.Header>{t('Menu.LL')}</Accordion.Header>
              <Accordion.Body>
                <Form.Group as={Row}>
                  <Col xs={1}>
                    <Button size="sm" onClick={() => {
                      const new_label = {
                        idLabel: 'label_' + String(new Date().getTime()),
                        name: 'Text Label ...',
                        label_width: 100,
                        label_height: 25,
                        color: 'white',
                        color_border: 'black',
                        transparent: false,
                        transparent_border: false,
                        position_vert: 'milieu',
                        position_horiz: 'gauche',
                        font_size: 12,
                        font_weight: false,
                        font_style: false,
                        font_uppercase: false,
                        x: 50,
                        y: 50,
                        x_label: 50,
                        y_label: 12,
                      }
                      data.labels[new_label.idLabel] = new_label
                      multi_selected_label.current = [new_label]
                      set_data({ ...data })
                    }
                    }><FaPlus /></Button>
                  </Col>
                  <Col xs={7}>{dropdownMultiLabel()}</Col>
                  <Col xs={1}>
                    <Button size="sm" variant='danger' onClick={() => {
                      data.labels = Object.fromEntries(Object.entries(data.labels).filter(d => !multi_selected_label.current.map(l => l.idLabel).includes(d[0])))
                      multi_selected_label.current = []
                      set_data({ ...data })
                    }
                    }><FaMinus /></Button>
                  </Col>

                  <Col xs={2}>
                    {//Boutton pour monter le label sélctionné
                    }
                    <ButtonGroup>
                      <Button variant='info' disabled={multi_selected_label.current.length != 1}
                        onClick={() => {
                          multi_selected_label.current.map(l => {
                            handleDownlabel(l.idLabel)
                          })


                        }}><FaAngleUp /></Button>

                      <Button variant='warning' disabled={multi_selected_label.current.length != 1}
                        onClick={() => {
                          multi_selected_label.current.map(l => {
                            handleUplabel(l.idLabel)
                          })


                        }}><FaAngleDown /></Button>
                    </ButtonGroup>
                  </Col>
                </Form.Group>


                <Form.Group as={Row}>
                  <Row>
                    <FormLabel column sm={1}>Text:</FormLabel>
                    <Col sm={11}>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        disabled={multi_selected_label.current.length != 1}
                        value={multi_selected_label.current.length > 0 ? multi_selected_label.current[0].name : ''}
                        onChange={
                          (evt) => {
                            multi_selected_label.current.map(label => label.name = evt.target.value)
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                  </Row>


                </Form.Group>

                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >{t('LL.hl')}</FormLabel>
                  </Col>
                  <Col xs={8}>
                    <FormControl size='sm'
                      min={0}
                      max={1000}
                      type={'number'}
                      value={allLabelHeight()}
                      onChange={evt => {
                        multi_selected_label.current.map(d => d.label_height = +evt.target.value)
                        label_libre_align_vert()
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >{t('LL.ll')}</FormLabel>
                  </Col>
                  <Col xs={8}>
                    <FormControl size='sm'
                      min={0}
                      max={1000}
                      type={'number'}
                      value={allLabelWidth()}
                      onChange={evt => {
                        multi_selected_label.current.map(d => d.label_width = +evt.target.value)
                        label_libre_align_horiz()
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>

                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >{t('LL.ft')}</FormLabel>
                  </Col>
                  <Col xs={8}>
                    <Form.Check
                      inline
                      type='switch'
                      checked={allLabelTransparent()}
                      onChange={evt => {
                        multi_selected_label.current.map(d => d.transparent = evt.target.checked)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>


                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >{t('LL.cfl')}</FormLabel>
                  </Col>
                  <Col xs={8}>
                    <FormControl size='sm'
                      type='color'
                      value={(multi_selected_label.current.length == 1) ? multi_selected_label.current[0].color : '#ffffff'}
                      onChange={evt => {
                        const val = evt.target.value
                        multi_selected_label.current.map(d => d.color = val)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>





                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >{t('LL.bt')}</FormLabel>
                  </Col>
                  <Col xs={8}>
                    <Form.Check
                      inline
                      type='switch'
                      checked={allLabelBorderTransparent()}
                      onChange={evt => {
                        multi_selected_label.current.map(d => d.transparent_border = evt.target.checked)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>


                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >{t('LL.cbl')}</FormLabel>
                  </Col>
                  <Col xs={8}>
                    <FormControl size='sm'
                      type='color'
                      value={(multi_selected_label.current.length == 1) ? multi_selected_label.current[0].color_border : '#ffffff'}
                      onChange={evt => {
                        const val = evt.target.value
                        multi_selected_label.current.map(d => d.color_border = val)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>




                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >{t('LL.pvt')}</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.haut')}
                      checked={allNodeLabelVert('vert', 'haut')}
                      onChange={
                        () => {
                          multi_selected_label.current.map(d => {
                            d.position_vert = 'haut'
                            // d.x_label = d.label_width / 2
                            d.y_label = d.font_size + 3
                          })

                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.Milieu')}
                      checked={allNodeLabelVert('vert', 'milieu')}
                      onChange={
                        () => {
                          multi_selected_label.current.map(d => {
                            d.position_vert = 'milieu'
                            // d.x_label = d.label_width / 2
                            d.y_label = d.label_height / 2
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.Bas')}

                      checked={allNodeLabelVert('vert', 'bas')}
                      onChange={
                        () => {
                          multi_selected_label.current.map(d => {
                            d.position_vert = 'bas'
                            // d.x_label = d.label_width / 2
                            d.y_label = d.label_height - 3
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group><Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >{t('LL.at')}</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.gauche')}
                      checked={allNodeLabelVert('horiz', 'gauche')}
                      onChange={
                        () => {
                          multi_selected_label.current.map(d => {
                            d.position_horiz = 'gauche'
                          })

                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('LL.centre')}
                      checked={allNodeLabelVert('horiz', 'centre')}
                      onChange={
                        () => {
                          multi_selected_label.current.map(d => {
                            d.position_horiz = 'centre'
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.droite')}

                      checked={allNodeLabelVert('horiz', 'droite')}
                      onChange={
                        () => {
                          multi_selected_label.current.map(d => {
                            d.position_horiz = 'droite'
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>





                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.labels.tp')}</FormLabel>
                  </Col>
                  <Col xs={8}>
                    <FormControl size='sm'
                      min={0}
                      max={100}
                      type={'number'}
                      value={allLabelFontSize()}
                      onChange={evt => {
                        let val = +evt.target.value
                        val = (val <= 0) ? 1 : val
                        multi_selected_label.current.map(d => d.font_size = val)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>

                <Form.Group as={Row} >
                  <Col>
                    <FormLabel >{t('LL.labels')}</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label={t('LL.gras')}
                      checked={allLabelTextBold()}
                      onChange={
                        evt => {
                          multi_selected_label.current.map(d => d.font_weight = evt.target.checked)
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label={t('LL.maj')}
                      checked={allLabelTextUpper()}
                      onChange={
                        evt => {
                          multi_selected_label.current.map(d => d.font_uppercase = evt.target.checked)
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label={t('LL.ita')}
                      checked={allLabelTextItalic()}
                      onChange={
                        evt => {
                          multi_selected_label.current.map(d => d.font_style = evt.target.checked)
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>









              </Accordion.Body>
            </Accordion.Item>
            {/* <Accordion.Item
              eventKey="Visualisation"
              style={{ 'display': (data.accordeonToShow.includes('Vis')) ? 'block' : 'none' }}
              onClick={
                evt => {
                  if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === 'Visualisation') {
                    set_nav_item_active('')
                  } else {
                    set_nav_item_active('Visualisation')
                  }
                }
              }>
              <Accordion.Header>Storytelling</Accordion.Header>
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
                              multi_selected_nodes.current = []
                              multi_selected_links.current = []
                              multi_selected_label.current = []
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
                          <FormLabel >Flux nuls:</FormLabel>
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
            </Accordion.Item> */}
            <Accordion.Item
              style={{ 'display': (view == 'none' && data.accordeonToShow.includes('Leg')) ? 'block' : 'none' }}
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
              <Accordion.Header>{t('Menu.Leg')}</Accordion.Header>
              <Accordion.Body>
                <Form.Group as={Row} >
                  <Col xs={3}>
                    <FormLabel >{t('Menu.LegX')}</FormLabel>
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
                    <FormLabel>{t('Menu.LegY')}</FormLabel>
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

                <Form.Group as={Row} >
                  <Col xs={3}>
                    <FormLabel>{t('Menu.LegWidth')}</FormLabel>
                  </Col>
                  <Col>
                    <FormControl
                      type="number"
                      step={1}
                      value={data.legend_width}
                      onChange={evt =>{
                        data.legend_width=+evt.target.value
                        set_data({ ...data })
                      }}
                     
                    />
                  </Col>
                </Form.Group>
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
          data={viewOfData()}
          set_data={() => null}
          //set_multi_selected_nodes={() => null}
          multi_selected_nodes={multi_selected_nodes}
          //set_multi_selected_links={() => null}
          multi_selected_links={multi_selected_links}
          //set_multi_selected_label={set_multi_selected_label}
          multi_selected_label={multi_selected_label}

          select_node={() => null}
          node_arrow_visible={
            (n: SankeyNode) => !n.node_visible || (n.inputLinksId.length === 0) || (!viewOfData().links[n.inputLinksId[0]].arrow) ? false : true
          }
          select_link={() => null}

          link_text={link_text}
          // test_link_value={test_link_value}
          // set_show_nav={set_show_nav}
          // set_nav_item_active={set_nav_item_active}
          // set_sub_nav_item_active={set_sub_nav_item_active}
          nodeTooltipsContent={nodeTooltipsContent}
          linkTooltipsContent={linkTooltipsContent}
          set_show_toast={set_show_toast}
          current={false}
          mode_selection={mode_selection}
          set_mode_selection={set_mode_selection}
          view={view}
          set_view={set_view}
          mode_visualisation={mode_visualisation}
          
        />) : (<></>)
      }
      <ApplyLayoutDialog
        show_apply_layout={show_apply_layout}
        set_show_apply_layout={set_show_apply_layout}
        sankey_data={data}
        set_sankey_data={set_data}
      />
      {show_excel_dialog ? (
        <ExcelModal
          handleCloseDialog={() => set_show_excel_dialog(false)}
          uploadExcelImpl={uploadExcelImpl}
          set_data={set_data}
          data={data}
          set_show_excel_dialog={set_show_excel_dialog}
          url_prefix={url_prefix}
          callback={callback} />
      ) :
        (<div />)
      }
      { show_publish_dialog ?  (
        <PublishModal 
          set_show_publish_dialog={set_show_publish_dialog} 
          publishImpl = {publishImpl} 
          file_path_initial = {data.file_name as string}/>
      ) :
        (<div/>)
      }
    </>
  )
}

const ApplyLayoutDialogPropTypes = {
  show_apply_layout : PropTypes.bool.isRequired,
  set_show_apply_layout: PropTypes.func.isRequired, 
  sankey_data : SankeyDataPropTypes,
  set_sankey_data : PropTypes.func.isRequired
}

type ApplyLayoutDialogTypes = InferProps<typeof ApplyLayoutDialogPropTypes>

const ApplyLayoutDialog = ({ show_apply_layout, set_show_apply_layout, sankey_data, set_sankey_data }: ApplyLayoutDialogTypes) => {
  let file_layout: Blob[] | undefined
  const {t} =useTranslation()

  return (
    <Modal
      bsSize="large"
      show={show_apply_layout}
      onHide={() => set_show_apply_layout(false)}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Modal.Header closeButton>
        <Modal.Title>{t('Menu.amp')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form >
          <Form.Group as={Row} >
            <Col xs={3}>
              <FormLabel>{t('Menu.fmep')}</FormLabel>
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
                }>{t('Menu.ad')}
              </Button>
            </Col>
          </Form.Group>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

const ExcelModalPropTypes = {
  uploadExcelImpl: PropTypes.func.isRequired,
  handleCloseDialog: PropTypes.func.isRequired,
  set_data: PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_show_excel_dialog: PropTypes.func.isRequired,
  url_prefix: PropTypes.string.isRequired,
  callback: PropTypes.func.isRequired,
}
type ExcelModalTypes = InferProps<typeof ExcelModalPropTypes>

const ExcelModal: FunctionComponent<ExcelModalTypes> = ({ uploadExcelImpl, handleCloseDialog, set_data, data, set_show_excel_dialog,url_prefix,callback }) => {
  const [input_file_name, set_input_file_name] = useState<Blob | undefined>(undefined)
  const [layout_file, set_layout_file] = useState<Blob | undefined>(undefined)
  const {t} =useTranslation()

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
          <Form.Group as={Row}>
            <Form.Label>Fichier d&apos;entrée excel</Form.Label>
            <Form.Control
              type="file"
              onChange={(evt: ChangeEvent) => {
                set_input_file_name((evt.target as HTMLFormElement).files[0])
              }}
            />
          </Form.Group>
          <Form.Group as={Row}>
            <Form.Label>Diagramme de mise en page</Form.Label>
            <Form.Control
              type="file"
              //ref={layout_file_}
              name=""
              onChange={(evt: ChangeEvent) => {
                set_layout_file((evt.target as HTMLFormElement).files[0])
              }}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={
            () => {
              if (layout_file !== undefined) {
                const reader = new FileReader()
                reader.onload = (() => {
                  return (
                    (e: ProgressEvent<FileReader>) => {
                      let result = (e.target as FileReader).result
                      if (result) {
                        result = String(result).split('<br>').join('\\\\n')
                        const layout : SankeyData = JSON.parse(result);
                        (data as SankeyData & { layout?: SankeyData }).layout = layout
                      }
                    }
                  )
                })
                reader.readAsText(layout_file)
              }
              uploadExcelImpl(
                data,
                set_data,
                set_show_excel_dialog,
                input_file_name,
                url_prefix,
                callback
              )
            }
          }
        >Ouvrir</Button>
        <Button
          variant="secondary"
          onClick={handleCloseDialog}
        >{t('Menu.ca')}</Button>
      </Modal.Footer>
    </Modal>)
}

ExcelModal.propTypes = ExcelModalPropTypes

const PublishModalPropTypes = {
  publishImpl: PropTypes.func.isRequired,
  set_show_publish_dialog: PropTypes.func.isRequired,
  file_path_initial: PropTypes.string.isRequired
}
type PublishModalTypes = InferProps<typeof PublishModalPropTypes>

const PublishModal: FunctionComponent<PublishModalTypes> = ({ publishImpl,set_show_publish_dialog,file_path_initial } : PublishModalTypes) => {
  const [file_path,set_file_path] = useState(file_path_initial)
  const {t} =useTranslation()

  return (
    <Modal show={true} onHide={()=>set_show_publish_dialog(false)} >
      <Modal.Header closeButton>
        <Modal.Title>{t('Menu.pdd')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group as={Row}>
            <Form.Label>{t('Menu.ca')}</Form.Label>
            <Col>    
              <Form.Control
                type='text'
                placeholder={file_path_initial}
                onChange={(evt)=>set_file_path(evt.target.value)}
              />
            </Col>     
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={()=>publishImpl(file_path)}>{t('Menu.pub')}</Button>
        <Button variant="secondary" onClick={()=>set_show_publish_dialog(false)}>{t('Menu.ca')}</Button>
      </Modal.Footer>
    </Modal>
  )
}
PublishModal.propTypes = PublishModalPropTypes

Menu.propTypes = MenuPropTypes

export default Menu


