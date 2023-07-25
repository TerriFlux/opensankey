/* eslint @typescript-eslint/no-var-requires: "off" */
import * as d3 from 'd3'
import React, { ChangeEvent, FunctionComponent, useRef, useState, Ref, CSSProperties } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form, Modal, Navbar, Nav, Button, Dropdown, Container, Offcanvas, ToggleButton,Row,Pagination,FormCheck,Col, ButtonGroup,OverlayTrigger,Tooltip,FormGroup,FormLabel,Popover,Card} from 'react-bootstrap'
import { SankeyDataPropTypes, SankeyNodePropTypes, SankeyData,TagsGroup,TagsCatalog,SankeyLink,SankeyNode,SankeyLinkValue} from './types'

import { convert_data,complete_sankey_data } from './SankeyConvert'
import FileSaver from 'file-saver'
import { FaAngleDoubleLeft,FaAngleDoubleRight} from 'react-icons/fa'
import * as SankeyUtils from './SankeyUtils'
import SankeyLoad from './SankeyLoad'
import { SankeyConfigurationMenu } from './SankeyMenuConfiguration'
// import ModalPreference from './SankeyMenuPreferences'
// import { ModalStyleLink, ModalStyleNode } from './SankeyMenuStyles'
import { ExcelModal,ApplyLayoutDialog,ApplySaveJSONDialog } from './SankeyMenuDialogs'
import { reorganize_node_inputLinksId,reorganize_node_outputLinksId } from './SankeyLayout'
import { TFunction } from 'i18next'
import { MultiSelect } from 'react-multi-select-component'
import { faFloppyDisk,faGears,faFolderOpen, faDownload, faFileExport, faTrashCan, faFileInvoice, faPenToSquare,faUpRightFromSquare} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {addAllDropDownNode} from './SankeyMenuBanner'
import { reorganize_inputLinksId } from './SankeyLayout'
import { handleUpLink,handleDownLink } from './SankeyMenuConfigurationLinks'
import { arrangeNodes, compute_auto_sankey } from './SankeyLayout'
import Draggable from 'react-draggable'
import CloseButton from 'react-bootstrap/CloseButton'

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      header?: string
      welcome_text: string
    }
  }
/**
 * Description placeholder
 *
 * @export
 * @typedef {selected_type}
 */
export type selected_type = {'label':string;'value':string}

/**
 * Variable that define the Menu element, it's variable and function
 *
 * @type {{ data: any; set_data: any; right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 */

const MenuPropTypes = {
  t:PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  default_sankey_data:PropTypes.func.isRequired,
  logo: PropTypes.string.isRequired,
  logo_terriflux: PropTypes.string.isRequired,
  logo_width: PropTypes.number,
  app_name: PropTypes.string.isRequired,

  button_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLLabelElement)}).isRequired,
  accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement)}).isRequired,
  selected_node: PropTypes.shape({current:PropTypes.shape(SankeyNodePropTypes).isRequired}).isRequired,

  example_menu: PropTypes.element,
  // portfolio_menu: PropTypes.element,
  formations_menu: PropTypes.object.isRequired,
  url_prefix: PropTypes.string.isRequired,


  nav_item_active: PropTypes.string.isRequired,

  mode_selection: PropTypes.shape({current:PropTypes.string.isRequired}).isRequired,

  style_to_apply: PropTypes.string.isRequired,
  set_style_to_apply: PropTypes.func.isRequired,

  callback:PropTypes.func.isRequired,

  show_load: PropTypes.bool.isRequired,
  set_show_load: PropTypes.func.isRequired,
  processing : PropTypes.bool.isRequired,
  setProcessing : PropTypes.func.isRequired,
  failure : PropTypes.bool.isRequired,
  setFailure : PropTypes.func.isRequired,
  not_started : PropTypes.bool.isRequired,
  setNotStarted : PropTypes.func.isRequired,
  result : PropTypes.string.isRequired,
  setResult : PropTypes.func.isRequired,
  path: PropTypes.string.isRequired,
  launch: PropTypes.func.isRequired,
  configurations_menus: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,

  show_nav: PropTypes.bool.isRequired,
  set_show_nav: PropTypes.func.isRequired,
  show_excel_dialog: PropTypes.bool.isRequired,
  set_show_excel_dialog: PropTypes.func.isRequired,
  show_apply_layout: PropTypes.bool.isRequired,
  set_show_apply_layout: PropTypes.func.isRequired,
  show_save_json: PropTypes.bool.isRequired,
  set_show_save_json: PropTypes.func.isRequired,
  showPreference: PropTypes.bool.isRequired,
  setShowPreference: PropTypes.func.isRequired,
  show_publish_dialog:PropTypes.bool.isRequired,
  set_show_publish_dialog: PropTypes.func.isRequired,

  menus: PropTypes.objectOf(PropTypes.element.isRequired).isRequired,
  show_modalTemplate:PropTypes.bool.isRequired,
  set_show_modalTemplate:PropTypes.func.isRequired,
  cardsTemplate:PropTypes.element.isRequired,
  external_modal:PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
  min_width_and_height :PropTypes.func.isRequired,
  reinitialization:PropTypes.func.isRequired,
  set_show_modale_tuto:PropTypes.func.isRequired,
  show_modale_tuto:PropTypes.bool.isRequired,
  show_modale_support:PropTypes.bool.isRequired,
  set_show_modale_support:PropTypes.func.isRequired,
  additional_nav_item:PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,

  set_contextualised_node:PropTypes.func.isRequired,
  set_contextualised_link:PropTypes.func.isRequired,
  set_show_context_zdd:PropTypes.func.isRequired,
  updateLayout:PropTypes.func.isRequired,

}

const pre_process_export_svg=()=>{
  // Resize the svg scale to be the scale by default
  const svg =window.d3.select(' .opensankey#svg-container svg')
  svg.attr('transform','scale(1)')
  svg.select('#g_legend').style('transform','scale(1)')

  // Get size of g elements that contain visual content
  const g_nodes=document.getElementById('g_nodes')
  const size_nodes = (g_nodes) ? [(g_nodes.getBoundingClientRect().width+g_nodes.getBoundingClientRect().x),(g_nodes.getBoundingClientRect().height+g_nodes.getBoundingClientRect().y)] : [0,0]

  const g_links=document.getElementById('g_links')
  const size_links = (g_links) ? [(g_links.getBoundingClientRect().width+g_links.getBoundingClientRect().x),(g_links.getBoundingClientRect().height+g_links.getBoundingClientRect().y)] : [0,0]

  const g_label=document.getElementById('g_label')
  const size_label = (g_label) ? [(g_label.getBoundingClientRect().width+g_label.getBoundingClientRect().x),(g_label.getBoundingClientRect().height+g_label.getBoundingClientRect().y)] : [0,0]

  // Search the element that go to the most bottom right of the sankey
  const export_dim_unscaled=[Math.max(size_nodes[0],size_links[0],size_label[0]),Math.max(size_nodes[1],size_links[1],size_label[1])]
  // Resize the svg width and height with the minimum value it require to display the elements
  svg.style('width',export_dim_unscaled[0]+'px')
  svg.style('height',export_dim_unscaled[1]+'px')

  // Hidde non-essential visual elements
  svg.selectAll('.sankey-tooltip').remove()
  svg.selectAll('text[visibility=hidden]').remove()
  svg.style('border','0px')
  svg.style('background-color','#fff')
  svg.select('#grid').style('opacity','0')
  svg.selectAll('.box_width_threshold').remove()
  d3.selectAll('.gg_nodes rect').attr('stroke-width',0)
  d3.selectAll(' .opensankey .gg_link_handles rect.handle').attr('fill-opacity', '0').attr('cursor', 'pointer')
  d3.selectAll(' .opensankey .gg_link_handles .drag_zone').attr('cursor', 'pointer').attr('stroke-opacity', '0')
  d3.selectAll(' .opensankey .gg_link_handles .center_handle').attr('stroke-opacity', '0').attr('fill-opacity', '0')
  d3.selectAll('.opensankey .gg_label rect').attr('stroke-width','1')

  return svg
}

const post_process_export_svg=()=>{
  window.d3.select(' .opensankey#svg-container svg').style('background-color','inherit')
  window.d3.select(' .opensankey#svg-container svg').select('#grid').style('opacity','1')
  window.d3.select(' .opensankey#svg-container svg').style('border','2px')
}


export const clickSaveSVG = () => {
  const svg = pre_process_export_svg()
  const html = ((svg.attr('title', 'test2')
    .attr('version', 1.1)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .attr('xhtml', 'http://www.w3.org/1999/xhtml')
    .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    .attr('xmlns:xhtml', 'http://www.w3.org/1999/xhtml')
    .node() as HTMLElement).parentNode as HTMLElement).innerHTML

  const blob = new Blob([html], { type: 'image/svg+xml' })
  const form_data = new FormData()
  form_data.append('svg', blob)

  post_process_export_svg()

  const path = window.location.href
  let url = path + '/opensankey/sankey/save_svg'
  const fetchData = {
    method: 'POST',
    body: form_data
  }

  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: 'application/svg' })
    FileSaver.saveAs(newBlob, 'sankey_diagram.svg')
  }

  const cleanFile = () => {
    const fetchData = {
      method: 'POST'
    }
    url = path + '/opensankey/sankey/clean_svg'
    fetch(url, fetchData)
  }

  fetch(url, fetchData).then(
    r => r.blob()
  )
    .then(showFile).then(cleanFile)
}

const clickSavePDF = (data:SankeyData) => {
  const svg = pre_process_export_svg()
  const html = ((svg.attr('title', 'test2')
    .attr('version', 1.1)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .node() as HTMLElement).parentNode as HTMLElement).innerHTML

  const blob = new Blob([html], { type: 'image/svg+xml' })
  const form_data = new FormData()
  form_data.append('html', blob)
  form_data.append('width', data.width.toString())
  form_data.append('height', data.height.toString())

  post_process_export_svg()

  const path = window.location.href
  let url = path + '/opensankey/sankey/save_pdf'
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
    url = path + '/opensankey/sankey/clean_pdf'
    fetch(url, fetchData)
  }

  fetch(url, fetchData).then(
    r => r.blob()
  )
    .then(showFile).then(cleanFile)
}

const clickSavePNG = () => {
  const svg = pre_process_export_svg()
  const html = ((svg.attr('title', 'test2')
    .attr('version', 1.1)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .node() as HTMLElement).parentNode as HTMLElement).innerHTML

  const blob = new Blob([html], { type: 'image/svg+xml' })
  const form_data = new FormData()
  form_data.append('html', blob)

  post_process_export_svg()

  const path = window.location.href
  let url = path + '/opensankey/sankey/save_png'
  const fetchData = {
    method: 'POST',
    body: form_data
  }

  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: 'application/png' })
    FileSaver.saveAs(newBlob, 'sankey_diagram.png')
  }

  const cleanFile = () => {
    const fetchData = {
      method: 'POST'
    }
    url = path + '/opensankey/sankey/clean_png'
    fetch(url, fetchData)
  }

  fetch(url, fetchData).then(
    r => r.blob()
  )
    .then(showFile).then(cleanFile)
}

const goToUserDoc = () => {
  const path = window.location.href
  const url = path + 'doc'
  fetch(url, {
    method:'GET'
  }).then((response) => {
    if(response.redirected){
      return window.open(response.url, '_blank')
    }
  }).then( win => win?.focus() )
}


/**
 *
 *
 * @param {React.ChangeEvent<HTMLSelectElement>} evt
 * @param {TagsGroup} tags_group
 * @param {SankeyData} data
 * @param {(data: SankeyData) => void} set_data
 * @returns {(void) => void}
 */
const handleSimpleDropdown = (evt: React.ChangeEvent<HTMLSelectElement>, tags_group: TagsGroup, data: SankeyData, set_data: (data: SankeyData) => void) => {
  const val = evt.target.value
  Object.entries(tags_group.tags).forEach(tag => tag[1].selected = val === tag[0])
  set_data({ ...data })
}

/**
 *
 *
 * @param {[{ label: string, value: string }]} selected
 * @param {TagsGroup} tags_group
 * @param {SankeyData} data
 * @param {(data: SankeyData) => void} set_data
 * @returns {(void) => void}
 */
const handleMultiDropdown = (selected: [{ label: string, value: string }], tags_group: TagsGroup, data: SankeyData, set_data: (data: SankeyData) => void) => {
  const tab_sel = selected.map((d) => {
    return d.value
  })
  Object.entries(tags_group.tags).forEach(tag => tag[1].selected = tab_sel.includes(tag[1].name))
  // Permet d'eviter de désélectionner tous les dataTags ce qui créerait une erreur
  if(tab_sel.length==0 && Object.values(data.dataTags).map(dt=>dt.group_name).includes(tags_group.group_name)){
    Object.entries(tags_group.tags)[0][1].selected=true
  }
  set_data({ ...data })
}

/**
 * Function that generate dropdown for each groupTag of linkTags
 *
 * @param {TagsCatalog} fluxTags
 * @param {SankeyData} data
 * @param {(data: SankeyData) => void} set_data
 * @returns {(void) => any}
 */
export const addAllDropDownFlux = (
  t:TFunction,
  fluxTags: TagsCatalog,
  data: SankeyData,
  set_data: (data: SankeyData) => void) =>
{
  const banner_grouptag = Object.values(fluxTags).filter(tags_group => { return ((tags_group as TagsGroup).banner == 'one' || (tags_group as TagsGroup).banner == 'multi') })
  const allDD = banner_grouptag.map(tags_group => {
    const the_tags_group = tags_group as TagsGroup
    const tags_selected=Object.entries(data['fluxTags']).filter((k)=>{return k[1]==the_tags_group})[0]

    if (the_tags_group.banner == 'one') {
      return (
        <FormGroup as={Row}>
          <Row>
            <Col xs={10}>
              <FormLabel>{the_tags_group.group_name}</FormLabel>
            </Col>
          </Row>
          <Row>
            <OverlayTrigger
              key={'Banner.ndd_lst.1'}
              placement={'bottom'}
              delay={500}
              overlay={<Tooltip id={'Banner.ndd_lst.1'}>{t('Banner.ndd_lst')} </Tooltip>}>
              <Col xs={10}>
                {<Form.Select
                  key={the_tags_group.group_name}
                  placeholder='all'
                  onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                    handleSimpleDropdown(evt, the_tags_group, data, set_data) }}>{
                    Object.entries(the_tags_group.tags).map(([tag_key, tag],i) => {
                      return (<option key={i} value={tag_key}>{tag.name}</option>)
                    })}
                </Form.Select>}
              </Col>
            </OverlayTrigger>
            <Col xs={2} >
              <OverlayTrigger
                key={'Banner.ndd_chk.1'}
                placement={'bottom'}
                delay={500}
                overlay={<Tooltip id={'Banner.ndd_chk.1'}>{t('Banner.ndd_chk')} </Tooltip>}>
                <FormCheck
                  inline
                  type='switch'
                  checked={data.colorMap==tags_selected[0]}
                  onChange={evt => {
                    Object.values(data.nodeTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.fluxTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.dataTags).forEach(tags_group => tags_group.show_legend = false)

                    Object.values(data.nodes).forEach(el => {
                      el.colorParameter = 'local'
                      el.colorTag = 'no_colormap'
                    })

                    Object.values(data.links).forEach(el => {
                      el.colorParameter = 'local'
                      el.colorTag = 'no_colormap'
                    })
                    data.colorMap = 'no_colormap'

                    if(evt.target.checked){
                      Object.values(data.nodes).forEach(el => {
                        el.colorParameter = 'groupTag'
                        el.colorTag = tags_selected[0]
                      })
                      Object.values(data.links).forEach(el => {
                        el.colorParameter = 'groupTag'
                        el.colorTag = tags_selected[0]
                      })
                      data.colorMap = tags_selected[0]
                      data.fluxTags[tags_selected[0]].show_legend = true
                    }

                    set_data({ ...data })
                  }}
                />
              </OverlayTrigger>
            </Col>
          </Row>
        </FormGroup>)
    }
    else if (the_tags_group.banner == 'multi') {
      const options = Object.entries(the_tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      const selected = Object.entries(the_tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      return (
        <FormGroup as={Row}>

          <Row>
            <Col xs={10}>
              <FormLabel>{the_tags_group.group_name}</FormLabel>
            </Col>
          </Row>

          {/* Liste déroulante des groupe de filtre  */}
          <Row>
            <OverlayTrigger
              key={'Banner.ndd_lst.2'}
              placement={'bottom'}
              delay={500}
              overlay={<Tooltip id={'Banner.ndd_lst.2'}>{t('Banner.ndd_lst')} </Tooltip>}>
              <Col xs={10}>
                <MultiSelect
                  className={'multidropdown_filter_node_link'}
                  style={{ color: 'black',width:'200px' }}
                  valueRenderer={(selected: selected_type[]) => {
                    return selected.length ? selected.map(({ label }) => label + ', ') : 'Aucun tag sélectionné'
                  }}
                  labelledBy={'dropdown_node_filter'}
                  overrideStrings={{
                    'selectAll': 'Tout sélectionner',
                  }}
                  value={selected}
                  options={options}
                  onChange={(selected: [{ label: string, value: string }]) => {
                    handleMultiDropdown(selected, the_tags_group, data, set_data)
                  }}
                />
              </Col>
            </OverlayTrigger>

            {/* Appliquer le filtrage  */}
            <Col xs={2}>
              <OverlayTrigger
                key={'Banner.ndd_chk.2'}
                placement={'bottom'}
                delay={500}
                overlay={<Tooltip id={'Banner.ndd_chk.2'}>{t('Banner.ndd_chk')} </Tooltip>}>
                <FormCheck
                  inline
                  type='switch'
                  checked={data.colorMap==tags_selected[0]}
                  onChange={evt => {
                    Object.values(data.nodeTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.fluxTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.dataTags).forEach(tags_group => tags_group.show_legend = false)

                    Object.values(data.nodes).forEach(el => {
                      el.colorParameter = 'local'
                      el.colorTag = 'no_colormap'
                    })

                    Object.values(data.links).forEach(el => {
                      el.colorParameter = 'local'
                      el.colorTag = 'no_colormap'
                    })
                    data.colorMap = 'no_colormap'
                    if(evt.target.checked){
                      Object.values(data.nodes).forEach(el => {
                        el.colorParameter = 'groupTag'
                        el.colorTag = tags_selected[0]
                      })
                      Object.values(data['links']).forEach(el => {
                        el.colorParameter = 'groupTag'
                        el.colorTag = tags_selected[0]
                      })
                      data.colorMap = tags_selected[0]
                      data['fluxTags'][tags_selected[0]].show_legend = true
                    }
                    set_data({ ...data })
                  }}
                />
              </OverlayTrigger>
            </Col>
          </Row>
        </FormGroup>)
    }
  })
  return (<><tr><th>{t('Banner.ndd_lst')}</th><th>{t('Banner.ndd_chk')}</th></tr>{allDD.map((c,i)=>{return <React.Fragment key={i}>{c}</React.Fragment>})}</>)
}


export const OpenSankeyMenus = (
  t:TFunction,
  setShowPreference:(b:boolean)=>void,
  reinitialization:()=>void,
  default_sankey_data:()=>SankeyData,
  set_show_apply_layout:(b:boolean)=>void,
  set_show_excel_dialog:(b:boolean)=>void,
  set_show_save_json:(b:boolean)=>void,
  showStyleEdition:()=>void,
  showStyleEditionLink:()=>void,
  set_show_welcome:(b:boolean)=>void,
  set_never_see_again:(b:boolean)=>void,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  set_show_modalTemplate:(b:boolean)=>void,
  set_show_modale_support:(b:boolean)=>void,
  external_edition_item:JSX.Element[],
  externale_save_item:JSX.Element[],
  set_tags_selected:(o:{[x:string]:string})=>void
) => {
  const _load_json = useRef<HTMLInputElement>(null)
  const node_filter = Object.entries(data.nodeTags).filter(([, v]) => v.banner !== 'none' && v.banner !== 'level').length > 0
  const flux_filter = Object.entries(data.fluxTags).filter(([, v]) => v.banner !== 'none').length > 0
  const opacity_advanced =  !window.SankeyToolsStatic ? '0.3' : '0'
  const DT_length=Object.keys(data.dataTags).length



  // Recursive function to create multiple copy of a link,according to the number of dataTags selected, to display the different value of a same link
  const recursionDataTag=(DT:TagsCatalog,ind:number,suffix:string,link_to_copy:SankeyLink,new_links:{ [link_id: string]: SankeyLink })=>{
    const DT_l=Object.values(DT).length
    Object.values((Object.values(DT)[ind] as {group_name:string,show_legend:boolean,color_map:string,tags:Record<string,unknown>}).tags)
      .filter(t=>(t  as {selected:boolean}).selected).forEach((d,i)=>{
        const n_suffix= suffix+'_'+i
        // Depth search of group_dataTag, if it the deepest, a link is created with a specific id to retrieve the right value of the link in getLinkValue
        // (Deepest= last group_dataTag )
        if(ind==DT_l-1){
          const n_l=JSON.parse(JSON.stringify(link_to_copy))
          n_l.idLink=n_l.idLink+n_suffix
          new_links[n_l.idLink]=n_l

          //Ajoute dans les noeuds source/target les id de flux
          const ind_in_src=data.nodes[link_to_copy.idSource].outputLinksId.indexOf(link_to_copy.idLink)
          if(ind_in_src>=0){
            data.nodes[link_to_copy.idSource].outputLinksId.splice(ind_in_src,1)
          }
          const ind_in_trgt=data.nodes[link_to_copy.idTarget].inputLinksId.indexOf(link_to_copy.idLink)
          if(ind_in_trgt>=0){
            data.nodes[link_to_copy.idTarget].inputLinksId.splice(ind_in_trgt,1)
          }
          data.nodes[link_to_copy.idSource].outputLinksId.push(n_l.idLink)
          data.nodes[link_to_copy.idTarget].inputLinksId.push(n_l.idLink)
        }
        else {
          recursionDataTag(DT,ind+1,n_suffix,link_to_copy,new_links)
        }

      })
  }
  // Function that return a simple or multiple dropdown of groupTag of data and links
  // This allow us to choose wich grouptag to select and wich tag of these group to display
  const addAllDropDownLinks = () => {
    const banner_grouptag = Object.entries(data.dataTags).filter(([, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi') })
    const allDD = banner_grouptag.map(([, tags_group]) => {
      if (tags_group.banner == 'one') {
        let selected = ''
        if ( Object.entries(tags_group.tags).filter(([,v])=>v.selected).length>0 ) {
          selected = Object.entries(tags_group.tags).filter(([,v])=>v.selected)[0][0]
        }
        return (
          <>
            <FormLabel>{tags_group.group_name}</FormLabel>
            <FormGroup as={Row}>
              <Col xs={10}>
                {<Form.Select key={tags_group.group_name} placeholder='all' value={selected} onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                  const pl=Object.entries(data.links).map(l=>{
                    const suffixeStart= l[0].indexOf('_')
                    if(suffixeStart>=0){
                      l[0]=l[0].slice(0,suffixeStart)
                      l[1].idLink=l[0]
                      data.nodes[l[1].idSource].outputLinksId=data.nodes[l[1].idSource].outputLinksId.filter(nl=>nl.indexOf('_')==-1)
                      data.nodes[l[1].idTarget].inputLinksId=data.nodes[l[1].idTarget].inputLinksId.filter(nl=>nl.indexOf('_')==-1)

                      //Ajoute dans les noeuds source/target les id de flux
                      const ind_in_src=data.nodes[l[1].idSource].outputLinksId.indexOf(l[1].idLink)
                      if(ind_in_src==-1){
                        data.nodes[l[1].idSource].outputLinksId.push(l[0])
                      }
                      const ind_in_trgt=data.nodes[l[1].idTarget].inputLinksId.indexOf(l[1].idLink)
                      if(ind_in_trgt==-1){
                        data.nodes[l[1].idTarget].inputLinksId.push(l[0])
                      }
                    }
                    return l
                  })
                  // Reforme les flux originel (sans suffixe) et supprime les doublons par la méme occasions
                  const pureLinks=Object.fromEntries(pl)
                  data.links=pureLinks
                  handleSimpleDropdown(evt, tags_group,data,set_data)
                  const newEntries = new Map(Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
                    return (Object.keys(dataTag.tags).length > 0) ? [
                      dataTagKey,
                      Object.entries(dataTag.tags).filter(tag => tag[1].selected).length > 0 ? Object.entries(dataTag.tags).filter(tag => tag[1].selected)[0][0] : Object.keys(dataTag.tags)[0]] : ['n', 'n']
                  }))
                  const dataTagsSelected = Object.fromEntries(newEntries)
                  set_tags_selected(dataTagsSelected)
                }}>
                  {
                    Object.entries(tags_group.tags).map(([tag_key, tag],i) => {
                      return (<option key={i} value={tag_key} >{tag.name}</option>)
                    })}
                </Form.Select>}
              </Col>
            </FormGroup>
          </>)
      }
      else if (tags_group.banner == 'multi') {
        const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
        const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name ,'disabled':((selected.length<2 && tag[1].name==selected[0].label))} })
        return (
          <>
            <FormLabel>{tags_group.group_name}</FormLabel>
            <MultiSelect
              className={'multidropdown_filter_node_link'}
              style={{ color: 'black',width:'200px' }}
              labelledBy={'dropdown_link_filter'}
              overrideStrings={{
                'selectAll': 'Tout sélectionner',
              }}
              value={selected}
              options={options}
              onChange={(selected: [{ label: string, value: string }]) => {
                handleMultiDropdown(selected, tags_group, data, set_data)

                //Multiplie les flux par le nombre de dataTags Sélectionné ( et si le lien à une valeur pour ce dataTags)
                if(Object.keys(data.dataTags).length>0){

                  const pl=Object.entries(data.links).map(l=>{
                    const suffixeStart= l[0].indexOf('_')
                    if(suffixeStart>=0){
                      l[0]=l[0].slice(0,suffixeStart)
                      l[1].idLink=l[0]
                      data.nodes[l[1].idSource].outputLinksId=data.nodes[l[1].idSource].outputLinksId.filter(nl=>nl.indexOf('_')==-1)
                      data.nodes[l[1].idTarget].inputLinksId=data.nodes[l[1].idTarget].inputLinksId.filter(nl=>nl.indexOf('_')==-1)
                    }
                    return l
                  })
                  // Reforme les flux originel (sans suffixe) et supprime les doublons par la méme occasions
                  const pureLinks=Object.fromEntries(pl)

                  const new_links={} as { [link_id: string]: SankeyLink }

                  Object.values(pureLinks).forEach(l=>{
                    const suffix=''
                    recursionDataTag(data.dataTags,0,suffix,(l as SankeyLink),new_links)
                  })
                  data.links=new_links
                  set_data({...data})
                }
              }} />
          </>)
      }
    })
    return allDD
  }



  //Popover element to handle node tags
  // Its a list of dropdown for each groupNodeTag where we can choose wiche group to apply and wiche tag from these group to display when selected
  const filter_color_node=
  <Popover id='tooltip-link-color-filter' style={{maxWidth:'100%'}}>
    <Popover.Header as="h3">{t('Banner.fdn')}</Popover.Header>
    <Popover.Body style={{  marginLeft: '5px', width: '450px' }}>
      <table>{ (Object.entries(data.nodeTags).filter(([, v]) => v.banner !== 'none').length > 0) ? (<>
        {addAllDropDownNode(t,data,set_data,false)}</>
      ) : (<>
        <Form.Control placeholder="Pas de filtrage" style={{ opacity: opacity_advanced, color: '#6c757d' }} disabled /></>)
      }</table>
    </Popover.Body>
  </Popover>

  //Popover element to handle the display of link tags
  const filter_color_link=
  <Popover id='tooltip-node-color-filter' style={{maxWidth:'100%'}}>
    <Popover.Header as="h3">{t('Banner.fdf')}</Popover.Header>
    <Popover.Body style={{  marginLeft: '5px', width: '450px' }}>
      {addAllDropDownFlux(t, data.fluxTags, data, set_data)}
    </Popover.Body>
  </Popover>

  //Popover element to handle the display of data tags
  const filter_data=
  <Popover id='tooltip-data-color-filter' style={{maxWidth:'100%'}}>
    <Popover.Header as="h3">{t('Banner.sdd')}</Popover.Header>
    <Popover.Body>
      <FormGroup as={Row}>
        <Col xs={10}>
          {addAllDropDownLinks()}
        </Col>
        <Col xs={2}>
          <FormCheck
            type='switch'
            style={{marginLeft: '-2em'}}
            checked={(DT_length>0)?(Object.values(data.dataTags).slice(DT_length-1,DT_length)[0].show_legend):false}
            onChange={evt=> {
              //Déselecitonne tous les type de tag
              Object.values(data.nodeTags).forEach(tags_group => tags_group.show_legend = false)
              Object.values(data.fluxTags).forEach(tags_group => tags_group.show_legend = false)
              Object.values(data.dataTags).forEach(tags_group => tags_group.show_legend = false)

              Object.values(data.nodes).forEach(el => {
                el.colorParameter = 'local'
                el.colorTag = 'no_colormap'
              })

              Object.values(data.links).forEach(el => {
                el.colorParameter = 'local'
                el.colorTag = 'no_colormap'
              })

              data.colorMap = 'no_colormap'

              //Met le dernier dataTag en tant que couleur a suivre pour les flux
              if(evt.target.checked){
                Object.values(data.nodes).forEach(el => {
                  el.colorParameter = 'groupTag'
                  el.colorTag = 'no_colormap'
                })
                Object.values(data.links).forEach(el => {
                  el.colorParameter = 'groupTag'
                  el.colorTag = 'no_colormap'
                })
                data.colorMap = 'dataTags_'+Object.keys(data.dataTags).slice(DT_length-1,DT_length)[0]
                Object.values(data.dataTags).slice(DT_length-1,DT_length)[0].show_legend=evt.target.checked
              }

              set_data({...data})
            }}
          />
        </Col>
      </FormGroup>
    </Popover.Body>
  </Popover>


  const item_dropdown_filter=<>
    {(node_filter)?
      <OverlayTrigger
        key={'tooltip-link-color-filter'}
        placement={'bottom'}
        trigger={'click'}
        rootClose
        overlay={filter_color_node}>
        <Button size='sm' variant='light' >
          {t('Menu.Noeuds')}
        </Button>
      </OverlayTrigger>
      :
      <></>
    }

    {(flux_filter)?
      <OverlayTrigger
        key={'tooltip-node-color-filter'}
        placement={'bottom'}
        trigger={'click'}
        rootClose
        overlay={filter_color_link}>
        <Button size='sm' variant='light' >{t('Menu.flux')}</Button>
      </OverlayTrigger>

      :
      <></>
    }
    {(Object.values(data.dataTags).length>0)?
      <OverlayTrigger
        key={'tooltip-data-filter'}
        placement={'bottom'}
        trigger={'click'}
        rootClose
        overlay={filter_data}>
        <Button size='sm' variant='light'>
          <>{t('Banner.data')}</>
        </Button>
      </OverlayTrigger>

      :
      <></>
    }
  </>



  const logo_tempalte=<svg xmlns="http://www.w3.org/2000/svg" aria-hidden='false' data-prefix='fas' className='svg-inline--fa' viewBox="0 0 24 24"><path fill='currentColor' d="M10,7.5c0-.83,.67-1.5,1.5-1.5s1.5,.67,1.5,1.5-.67,1.5-1.5,1.5-1.5-.67-1.5-1.5Zm14-1v5c0,3.03-2.47,5.5-5.5,5.5H10.5c-3.03,0-5.5-2.47-5.5-5.5V6.5c0-3.03,2.47-5.5,5.5-5.5h8c3.03,0,5.5,2.47,5.5,5.5ZM8,11.5c0,1,.59,1.86,1.43,2.26l4.28-4.28c.62-.62,1.64-.62,2.26,0l1.04,1.04c.62,.62,1.64,.62,2.26,0l1.72-1.72v-2.29c0-1.38-1.12-2.5-2.5-2.5H10.5c-1.38,0-2.5,1.12-2.5,2.5v5Zm8.5,7.5H5.5c-1.38,0-2.5-1.12-2.5-2.5v-7c0-.83-.67-1.5-1.5-1.5s-1.5,.67-1.5,1.5v7c0,3.03,2.47,5.5,5.5,5.5h11c.83,0,1.5-.67,1.5-1.5s-.67-1.5-1.5-1.5Z"/></svg>



  // OBJECT THAT CONTAIN DIFFERENT MENUS
  const ui :{[s:string] : JSX.Element}=  {}

  if(!window.SankeyToolsStatic){
    ui['file']=<>
      <Dropdown className='buttonSubNav'  drop='end'  id='ouvrir'  >
        <Dropdown.Toggle size='sm' variant='light'><><Col><FontAwesomeIcon icon={faFolderOpen} /></Col><Col className='textIcon'>{t('Menu.ouvrir')}</Col></></Dropdown.Toggle>
        <Dropdown.Menu>
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
                  reinitialization()
                  const result = String((e.target as FileReader).result)
                  const new_data = default_sankey_data()
                  const result_data = JSON.parse(result)
                  Object.assign(new_data, result_data)
                  if (result_data.version === undefined) {
                    (new_data.version as unknown as undefined) = undefined
                  }
                  convert_data(new_data)
                  complete_sankey_data(new_data,default_sankey_data,SankeyUtils.default_node,SankeyUtils.default_link)
                  // SankeyUtils.set_nodes_level(data)
                  console.log('open json')

                  set_data(new_data)
                  const test = document.getElementsByClassName('navbar')
                  let margin_top = 0
                  if (test && test.length > 0) {
                    margin_top = test[0].getBoundingClientRect().height
                    d3.select(' .opensankey #svg-container').style('margin-top',margin_top+'px')
                  }
                }
              })()
              reader.readAsText(files[0])
            }}
          />
          <Dropdown.Item
            onClick={() => set_show_excel_dialog(true)}
          >Excel</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      <Dropdown className='buttonSubNav' drop='end'  id='enregistrer' >
        <Dropdown.Toggle size='sm' variant='light'><><Col><FontAwesomeIcon icon={faDownload} /></Col><Col className='textIcon'>{t('Menu.enregistrer')}</Col></></Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item onClick={()=>{
            set_show_save_json(true)
          }} >JSON</Dropdown.Item>
          {/* <Dropdown.Item onClick={()=>SankeyUtils.clickSaveExcelSimple(url_prefix,data)} >Excel Simple</Dropdown.Item> */}
          <Dropdown.Item onClick={()=>SankeyUtils.clickSaveExcel('/opensankey/',data)} >Excel</Dropdown.Item>
          {externale_save_item}
        </Dropdown.Menu>
      </Dropdown>
      <Dropdown className='buttonSubNav'drop='end'  id='exporter' >
        <Dropdown.Toggle size='sm' variant='light'><><Col><FontAwesomeIcon icon={faFileExport} /></Col><Col className='textIcon'>{t('Menu.exporter')}</Col></></Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item onClick={clickSaveSVG} >{t('Menu.exporter')} SVG</Dropdown.Item>
          <Dropdown.Item onClick={()=>clickSavePDF(data)} >{t('Menu.exporter')} PDF</Dropdown.Item>
          <Dropdown.Item onClick={()=>clickSavePNG()} >{t('Menu.exporter')} PNG</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      <Button size='sm' variant='light' onClick={() => { setShowPreference(true) }}>{<><Col><FontAwesomeIcon icon={faGears} /></Col><Col className='textIcon'>{t('Menu.preference')}</Col></>}</Button>
      <Button size='sm' variant='light' onClick={() => { set_show_modalTemplate(true) }}>{<><Col>{logo_tempalte}</Col><Col className='textIcon'>{t('Menu.templates')}</Col></>}</Button>
      <OverlayTrigger
        key={'buttonCheckpoint'}
        placement={'left'}
        delay={500}
        overlay={(<Tooltip id={'buttonCheckpoint'}>{t('Menu.tooltips.checkpoint')} </Tooltip>)}
      >
        <Button size='sm' variant='light' onClick={() => {const ev = document;const tmp = new KeyboardEvent('keydown',{key:'s',ctrlKey:true})
          if (ev.onkeydown) {
            ev.onkeydown(tmp)
          }
        }}  ><><Col><FontAwesomeIcon icon={faFloppyDisk} /></Col><Col className='textIcon'>{t('Menu.check')}</Col></></Button></OverlayTrigger>
    </>

    ui['edition']=<>
      <Button size='sm' variant='light' onClick={reinitialization} ><><Col><FontAwesomeIcon icon={faTrashCan} /></Col><Col className='textIcon'>{t('Menu.reinit')}</Col></></Button>
      {/* <Button size='sm' variant='light' onClick={() => set_show_publish_dialog(true)} >{t('Menu.pub')}</Button>     */}
      <Button size='sm' variant='light' onClick={() => set_show_apply_layout(true)}><><Col><FontAwesomeIcon icon={faFileInvoice} /></Col><Col className='textIcon'>{t('Menu.amp_short')}</Col></></Button>
      <Dropdown className='buttonSubNav'drop='end'  id='exporter' >
        <Dropdown.Toggle size='sm' variant='light'><><Col><FontAwesomeIcon icon={faPenToSquare} /></Col><Col className='textIcon'>{t('Menu.style')}</Col></></Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item size='sm' variant='light' onClick={showStyleEdition}>{t('Menu.esn')}</Dropdown.Item>
          <Dropdown.Item size='sm' variant='light' onClick={showStyleEditionLink}>{t('Menu.esf')}</Dropdown.Item>
        </Dropdown.Menu></Dropdown>
      {external_edition_item}
    </>
    ui['aide']=<><Button size='sm' variant='light' onClick={() =>{
      set_show_welcome(true)
      set_never_see_again(false)
      localStorage.setItem('dontSeeAggainWelcome','0')
    }}>
      {t('DisplayWelcome')}</Button>
    <Button size='sm' variant='light' onClick={() => goToUserDoc()} >{t('Menu.doc')}</Button>
    <Button size='sm' variant='light' onClick={() => set_show_modale_support(true)} >{t('Menu.support')}</Button></>

  }

  if(node_filter || flux_filter || (Object.values(data.dataTags).length>0)){
    ui['filter']=
    <OverlayTrigger
      key={'tooltip-filter'}
      placement={'right'}
      rootClose
      overlay={<Tooltip id={'tooltip-filter'}>{t('Banner.hlp_1_txt_9')} </Tooltip>}>

      {item_dropdown_filter}
    </OverlayTrigger>
  }


  return ui


}

/**
 * Description placeholder
 *
 * @typedef {MenuTypes}
 */
type MenuTypes = InferProps<typeof MenuPropTypes>




/**
 * Description placeholder
 *
 * @param {{ data: any; set_data: any;right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 *
 * @returns
 */
const Menu: FunctionComponent<MenuTypes> = (
  { t,data, set_data,
    default_sankey_data,
    nav_item_active,
    show_nav,
    set_show_nav,
    logo,logo_terriflux, logo_width,app_name,
    button_ref,
    accordion_ref,
    selected_node,
    url_prefix,
    callback,
    show_load,
    set_show_load,
    processing,setProcessing,
    failure,setFailure,
    not_started,setNotStarted,
    result,setResult,
    path,
    launch,
    configurations_menus,
    show_excel_dialog, set_show_excel_dialog,
    show_apply_layout, set_show_apply_layout,
    show_save_json, set_show_save_json,
    menus,
    show_modalTemplate,
    set_show_modalTemplate,
    cardsTemplate,
    
    external_modal,
    min_width_and_height,
    formations_menu,reinitialization,set_show_modale_tuto,show_modale_tuto,
    show_modale_support,set_show_modale_support,
    additional_nav_item,
    set_contextualised_node,
    set_contextualised_link,
    set_show_context_zdd,
    updateLayout,
  }
) => {
  const [menu_acivated,set_menu_activated]=useState(Object.keys(menus)[0])
  const [modale_sub_tuto,set_modale_sub_tuto]=useState(Object.keys(formations_menu)[0]!==undefined?Object.keys(formations_menu)[0]:'')
  let max_link_value = 0
  Object.values(data.links).forEach(link => {
    const new_max_link_value = SankeyUtils.findMaxLinkValue(
      max_link_value,
      link.value
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })
  max_link_value += 1


  if (not_started == false && processing == false) {
    const path = window.location.href
    const url = path + url_prefix + 'loads_retrieves_result'
    const form_data = new FormData()
    const fetchData = {
      method: 'POST',
      body: form_data
    }
    fetch(url, fetchData).then(response => {
      response.text().then(text => {
        try {
          const server_data = JSON.parse(text)
          if ((data as SankeyData & { layout?: SankeyData }).layout ) {
            server_data.layout = (data as SankeyData & { layout?: SankeyData }).layout
          }

          const new_data=Object.assign(default_sankey_data(),SankeyUtils.processExample(server_data,updateLayout))
          callback(new_data)
          delete (new_data as SankeyData & { layout?: SankeyData }).layout
          set_data({ ...new_data })
          //set_show_load(false)
        } catch(err) {
          alert(err)
        }
      })
    })
    setProcessing(false)
    setFailure(false)
    setNotStarted(true)
  }

  //Switch the variable value that handle opening and closing the configuration menu
  const toggleShow = () => {
    set_show_nav(!show_nav)


    if(!show_nav){
      [data.width, data.height] = min_width_and_height(data)
      const transform=d3.select('.opensankey #svg').attr('transform').split('scale(')
      let scale_svg=1
      if(transform!==undefined){
        scale_svg=Number(transform[1].replace(')',''))
      }
      d3.select('.scroll_zone').style('width',((data.width+600)*scale_svg-(600*(scale_svg-1.1)))+'px')
    }else{
      d3.select('.scroll_zone').style('width',null)
    }
  }
  const setChecked = useState(false)[1]

  let node = data.nodes[selected_node.current.idNode]
  if (node === undefined) {
    node = SankeyUtils.default_node(data)
  }

  const props = {
    scroll: true,
    backdrop: false,
  }

  const menuButton = () => {
    if (show_nav) {
      return <FaAngleDoubleRight />
    } else {
      return <FaAngleDoubleLeft />
    }

  }


  const has_scrollbar_shift=window.innerWidth-document.getElementsByTagName('html')[0].clientWidth


  
  const ordered_menu:{[s:string]:JSX.Element}={}
  const oredred_key=['file','edition','diagramme','excel','filter','view','afm','formation','demo','aide']
  oredred_key.forEach((k:string)=>{
    if(Object.keys(menus).includes(k)){
      ordered_menu[k]=menus[k]
    }
  })

  // Pré-traitement du menu tuto pour trier les groupes
  const n_a=new Array(50)

  Object.keys(formations_menu).map(d=>{
    return d.replace('_','__').split('__')
  }).forEach(element => {
    if(element.length>1){
      n_a[Number(element[0])]=element[0]+'_'+element[1]
    }else{
      n_a[n_a.length-1]=element[0]
    }
  })
  // Return l'objet formations_menu mais trier selon le numéro du groupe (quand il y en a un)
  const new_array_for_exemple=Object.fromEntries(n_a.filter(f=>f).map((d)=>{
    return [d,(formations_menu as {[k:string]:string})[d]]
  }))
  let modal_tuto=<></>
  const tuto_sub_nav:{[s:string]:JSX.Element}={}
  Object.entries(new_array_for_exemple).forEach(d=>{
    tuto_sub_nav[d[0]]=<>
      {(d[1] as {['Files']:string[]})['Files'].filter((f:string)=>!f.includes('.xlsx')).map((dd:string)=>{
        return <Card>
          <Card.Img className='img-card' variant="top" src={'/fm/userfiles/Formations/'+(d[0])+'/images/'+(dd.replace('_layout.json',''))+'.png'} style={{'objectFit':'contain'/*,'minHeight':'350px','maxHeight':'500px'*/}} />
          <Card.Body>
            <Card.Title>{dd.replace('_layout.json','').replaceAll('_',' ')}</Card.Title>
            <Card.Text>

            </Card.Text>
            <ButtonGroup>
              <Button variant='primary'
                onClick={() => {
                  SankeyUtils.uploadExemple(
                    ('Formations/'+(d[0])+'/sankey/'+dd), url_prefix, data, set_data,reinitialization
                  )
                  set_data({...data})
                  set_show_modale_tuto(false)
                }}
              >{t('useTutoJSON')}</Button>
              {(d[1] as {['Files']:string[]})['Files'].includes(dd.replace('_layout.json','.xlsx'))?
                <Button variant='info'
                  onClick={() => {


                    launch('Formations/'+(d[0])+'/'+dd.replace('_layout.json','.xlsx'))

                    SankeyUtils.uploadExemple(
                      'Formations/'+(d[0])+'/'+dd.replace('_layout.json','.xlsx'), url_prefix, data, set_data,reinitialization
                    )
                    set_show_modale_tuto(false)

                  }
                  }
                >{t('useTutoExcel')}</Button>
                :<></>}
              {(d[1] as {['Files']:string[]})['Files'].includes(dd.replace('_layout.json','_reconciled.xlsx'))?
                <Button variant='info'
                  onClick={() => {


                    launch('Formations/'+(d[0])+'/'+dd.replace('_layout.json','_reconciled.xlsx'))

                    SankeyUtils.uploadExemple(
                      'Formations/'+(d[0])+'/'+dd.replace('_layout.json','_reconciled.xlsx'), url_prefix, data, set_data,reinitialization
                    )
                    set_show_modale_tuto(false)

                  }
                  }
                >{t('useTutoExcel')}</Button>
                :<></>}

            </ButtonGroup>
          </Card.Body>
        </Card>
      })}

    </>

  })

  modal_tuto=<Modal size={'xl'} fullscreen={true}  show={show_modale_tuto} onHide={() => set_show_modale_tuto(false)}>
    <Modal.Header closeButton>{t('Menu.formation')}</Modal.Header>
    <Modal.Body>
      <Row>
        <Nav variant="tabs" className='sub_nav' activeKey={modale_sub_tuto}>
          {Object.keys(tuto_sub_nav).map(m=>{
            return <Nav.Item>
              <Nav.Link eventKey={m} onClick={()=>set_modale_sub_tuto(m)}>
                {/*FORMAT THE TITLE OF TUTO */}
                {(m.split('_').length>1)?m.split('_').filter(s=>isNaN(+s)).join(' '):m}
              </Nav.Link>
            </Nav.Item>
          })}
        </Nav>
      </Row>
      <Row md={4}>
        {tuto_sub_nav[modale_sub_tuto]}
      </Row>
    </Modal.Body>
  </Modal>
  // Create the menu nav that can be slightly different if it in static
  const menu_nav=(!window.SankeyToolsStatic)?(<Col>
    <Row>
      <Nav variant="tabs" className='sub_nav' activeKey={menu_acivated}>
        {Object.keys(ordered_menu).map(m=>{

          if(m=='formation'){

            // Special behavior for formation nav, instead of opening a subnav it open a modal with the tutos
            return <Nav.Item>
              <Nav.Link  eventKey={m} onClick={()=>set_show_modale_tuto(true)}>
                {t('Menu.'+m)}
              </Nav.Link>
            </Nav.Item>
          }else{

            // Nav item that aopen a subnav when clicked
            return <Nav.Item>
              <Nav.Link eventKey={m} onClick={()=>set_menu_activated(m)}>
                {t('Menu.'+m)}
              </Nav.Link>
            </Nav.Item>
          }
        })}
      </Nav>
    </Row>
    <Row lg={'auto'}  style={{whiteSpace:'nowrap'}}>
      <ButtonGroup className={'subMenu '+menu_acivated}>
        {ordered_menu[menu_acivated]}
      </ButtonGroup>
    </Row>
  </Col> ): <ButtonGroup> {Object.keys(ordered_menu).map(k=><React.Fragment key={k}>{ordered_menu[k]}</React.Fragment>)}</ButtonGroup>


  const modal_support= <Modal size={'lg'} show={show_modale_support} onHide={() => set_show_modale_support(false)}>
    <Modal.Header closeButton><h2>{t('Menu.c_support')}</h2></Modal.Header>
    <Modal.Body>
      <h3>{t('Menu.rth_support')} :</h3>
      <p>{t('Menu.support_explication').split('[]')[0]}<a href='mailto:support@open-sankey.fr	'>support@open-sankey.fr</a>{t('Menu.support_explication').split('[]')[1]}</p>
    </Modal.Body>
  </Modal>




  return (
    <>
      {external_modal.map((c,i)=>{return <React.Fragment key={i}>{c}</React.Fragment>})}
      {/* Top Navbar with navigation and edition elements */}
      <Navbar className='bg-light' fixed='top' style={{ 'display': 'block' }} onClick={()=>{
        set_contextualised_node(undefined)
        set_contextualised_link(undefined)
        set_show_context_zdd(false)
      }} >
        <Container className='MenuNavigation'>
          {!window.SankeyToolsStatic?<>
            <Navbar.Brand style={{marginRight:'0px'}} href="https://terriflux.com/" ><img src={logo_terriflux} width={100} /> </Navbar.Brand>
            <div style={{display:'inline-block',width:'0px',marginLeft:'5px',marginRight:'5px',height:'40px',borderRight:'solid 1px #ddd',borderLeft:'solid 1px #ddd',padding:'0'}}></div>
          </>:<></>
          }

          <Navbar.Brand /*onClick={()=>set_welcome_text(window.sankey.welcome_text)}*/><img src={logo} width={logo_width ? logo_width : 200} /> {window.SankeyToolsStatic?window.sankey.header:<></>} </Navbar.Brand>
          {menu_nav}
          {Object.keys(menus).includes('unité')?<>
            {menus['unité']}
          </>:<></>}
          {additional_nav_item}
          
        </Container>
      </Navbar>
      {/* Bottom Navbar with some more info */}
      <Navbar bg='light' fixed='bottom' style={{fontSize:'0.85em'}} >
        <Container className='sankeyFooter' >

          <span style={{display:'inline'}}>
        ©<a  href="https://terriflux.com/" ><img width={75} src={logo_terriflux} /></a> - {t('tdr')}
          </span>
          <span style={{display:'inline'}}>
            {app_name}
          </span>
          <span style={{display:'inline'}}><a href='https://terriflux.com/mentions-legales/'>{t('legal')}</a></span>
          <span style={{display:'inline'}}><a href='mailto:support@open-sankey.fr	'>support@open-sankey.fr</a></span>
          <span style={{display:'inline'}}>
          9 rue du Rocher de Lorzier, 38430 Moirans  +33 (0)6 21 83 56 76
          </span>

        </Container>
      </Navbar>

      {(!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) ?<Offcanvas className='sankey-menu' show={show_nav} placement='end' /*onHide={set_show_nav(false)}*/ {...props} style={{ 'width': '540px', 'marginTop':document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().y+document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().height }}>
        <Offcanvas.Body style={{ 'padding': '0px 0px 0px 0px' }}>
          <SankeyConfigurationMenu
            nav_item_active={nav_item_active}
            accordion_ref={accordion_ref}
            configuration_menus={configurations_menus} />
        </Offcanvas.Body>
      </Offcanvas>
        : <></>}

      <ButtonGroup vertical
        className='sideBar'
        style={{top:window.innerHeight/2-120,left:window.innerWidth-40-((show_nav)?540+has_scrollbar_shift:has_scrollbar_shift)}}
      >
        {menus['toolbar']}
        {!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false) ? (
          <ToggleButton
            ref={button_ref as Ref<HTMLLabelElement>}
            id="toggle-check"
            className='openMenu'
            type="checkbox"
            variant="outline-primary"
            checked={show_nav}
            onChange={(e) => { setChecked(e.currentTarget.checked)}}
            onClick={toggleShow}
            value="menuConfigButton">{menuButton()}
          </ToggleButton>
        ) : (<></>)}
      </ButtonGroup>


      {
        processing ? (
          <Modal.Dialog >
            <Button className="btn btn-sm btn-warning col-md-12">
              <span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Processing...
            </Button></Modal.Dialog>) : (<></>)
      }
      <ApplySaveJSONDialog
        t={t}
        show_save_json={show_save_json}
        set_show_save_json={set_show_save_json}
        sankey_data={data}
        set_sankey_data={set_data}
      />
      <ApplyLayoutDialog
        t={t}
        show_apply_layout={show_apply_layout}
        set_show_apply_layout={set_show_apply_layout}
        sankey_data={data}
        set_sankey_data={set_data}
        updateLayout={updateLayout}
      />

      <ExcelModal
        t={t}
        launch={launch}
        handleCloseDialog={() => set_show_excel_dialog(false)}
        uploadExcelImpl={SankeyUtils.uploadExcelImpl}
        set_data={set_data}
        data={data}
        show_excel_dialog={show_excel_dialog}
        set_show_excel_dialog={set_show_excel_dialog}
        url_prefix={url_prefix}
        callback={callback} />

      <SankeyLoad
        url_prefix={url_prefix}
        successAction={()=>SankeyUtils.downloadExamples(path, url_prefix, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        show_dialog={show_load}
        set_show_dialog={set_show_load}
        processing={processing}
        setProcessing={setProcessing}
        failure={failure}
        setFailure={setFailure}
        setNotStarted={setNotStarted}
        result={result}
        setResult={setResult}
      />

      {
      // {modalTemplate}
        <Modal size={'xl'}  show={show_modalTemplate} onHide={() => set_show_modalTemplate(false)}>
          <Modal.Header closeButton>{t('Banner.sdr')}</Modal.Header>
          <Modal.Body>
            <Row md={4}>
              {cardsTemplate}
            </Row>
          </Modal.Body>
        </Modal>
      }
      {modal_tuto}
      {modal_support}

    </>
  )
}

Menu.propTypes = MenuPropTypes

export default Menu

// export //Modal for shortcut
// const OpenSankeyModalShortcut = (t:TFunction,
//   showShortcut:boolean,
//   setshowShortcut:React.Dispatch<React.SetStateAction<boolean>>,
//   additional_shortcut_item:JSX.Element[]
// )=>{
//   return <Modal size={'lg'} show={showShortcut} onHide={() => setshowShortcut(false)}>
//     <Modal.Header closeButton>
//       <Modal.Title>{t('Menu.rc')}</Modal.Title>
//     </Modal.Header>
//     <Modal.Body >
//       <h4 style={{textAlign:'center'}}>{t('Menu.rcc_titre_princ')}</h4>

//       <h5>{t('Menu.rcc_titre_select')}:</h5>
//       <p>{t('Menu.rcc_cn')}</p>
//       <p>{t('Menu.rcc_ctrl_')}</p>
//       <p><b>Click (flux) :</b> Sélectionne le flux cliqué</p>
//       <p><b>CTRL + Click (flux) :</b> Sélectionne le flux cliqué et ouvre l'onglet "<b>Flux</b>" du menu</p>
//       <p><b>Click (en dehors d'un noeud/flux) :</b>  Désélectionne les noeuds et flux sélectionnés</p>
//       <p><b>Click droit (noeuds) :</b>  Agrége le noeud</p>
//       <p><b>Alt Click droit (noeuds) :</b>  Désagrége le noeud</p>
//       <p><b>Alt + Drag (label noeuds) :</b>  Déplace le label</p>
//       <p><b>Shift + survole (noeuds) :</b>  Affiche la valeur des flux entrant et sortant du noeud dans une tooltip</p>
//       <p><b>Shift + survole (flux) :</b>  Affiche la valeur du flux dans une tooltip </p>

//       <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

//       <h5>Avec la souris en mode édition :</h5>
//       <p><b>Click (zone de dessin) :</b> Ajoute un noeud à l'endroit cliqué</p>
//       <p><b>Drag (à partir de la zone de dessin) :</b> Crée un noeud au point de départ du drag puis crée un flux partir du noeud crée vers : soit un noeud déjà existant si l'on drop dessus, soit crée un noeud si l'on drop sur la zone de dessin </p>
//       <p><b>Drag (à partir d'un noeud) :</b> Créer un flux partir du  noeud de départ du drag vers : soit un noeud déjà existant si l'on drop dessus, soit crée un noeud si l'on drop sur la zone de dessin  </p>

//       <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

//       <h5>Autres raccourcis :</h5>
//       <p><b>Suppr :</b> Supprime les noeuds et flux sélectionnés</p>
//       <p><b>Flèche du clavier :</b> Permet de déplacer les noeuds sélectionnés en fonction du grillage  </p>
//       <p><b>Drag (bouton du milieu de la souris et en dehors d'un noeud/flux)</b> Permet de déplacer le sankey complet  </p>

//       <p><b>Echap :</b> Ferme le Menu si il est ouvert et remet la fonction de la souris en tant que sélecteur </p>

//       {additional_shortcut_item}

//     </Modal.Body>
//     <Modal.Footer>
//       <Button variant="secondary" onClick={() => setshowShortcut(false)}>
//         Close
//       </Button>
//     </Modal.Footer>
//   </Modal>
// }

export const OpenSankeyModalWelcome=(t:TFunction,
  active_page:string,
  set_active_page:(s:string)=>void,
  show_modal_welcome:boolean,
  set_show_modal_welcome:(b:boolean)=>void,
  never_see_again:boolean,
  set_never_see_again:(b:boolean)=>void,
  additional_shortcut_item:JSX.Element[],
  external_pagination:JSX.Element[],
  external_content:{[s:string]:JSX.Element},
  exemple_menu: object,
)=>{




  const content_rc_static=<>
    <h4 style={{textAlign:'center'}}>{t('Menu.rcc_titre_princ')}</h4>
    <p><b>{t('Menu.rcc_cdn_bold')}</b>{t('Menu.rcc_cdn')}</p>
    <p><b>{t('Menu.rcc_acdn_bold')}</b>{t('Menu.rcc_acdn')}</p>
    <p><b>{t('Menu.rcc_ctrl_scrll_bold')}</b>{t('Menu.rcc_ctrl_scrll')}</p>
    
    <p><b>{t('Menu.rcc_F7_bold')}</b>{t('Menu.rcc_F7')}</p>
    <p><b>{t('Menu.rcc_F8_bold')}</b>{t('Menu.rcc_F8')}</p>
    <p><b>{t('Menu.rcc_F9_bold')}</b>{t('Menu.rcc_F9')}</p>

  </>

  const content_rc_not_static=<>
    <h4 style={{textAlign:'center'}}>{t('Menu.rcc_titre_princ')}</h4>

    <h5>{t('Menu.rcc_titre_select')}:</h5>
    <p><b>{t('Menu.rcc_cn_bold')}</b>{t('Menu.rcc_cn')}</p>
    <p><b>{t('Menu.rcc_ctrl_cn_bold')}</b>{t('Menu.rcc_ctrl_cn')}</p>
    <p><b>{t('Menu.rcc_cf_bold')}</b>{t('Menu.rcc_cf')}</p>
    <p><b>{t('Menu.rcc_ctrl_cf_bold')}</b>{t('Menu.rcc_ctrl_cf')}</p>
    <p><b>{t('Menu.rcc_cs_bold')}</b>{t('Menu.rcc_cs')}</p>
    <p><b>{t('Menu.rcc_cdn_bold')}</b>{t('Menu.rcc_cdn')}</p>
    <p><b>{t('Menu.rcc_acdn_bold')}</b>{t('Menu.rcc_acdn')}</p>
    <p><b>{t('Menu.rcc_ad_bold')}</b>{t('Menu.rcc_ad')}</p>

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

    <h5>{t('Menu.rcc_titre_edi')} :</h5>

    <p><b>{t('Menu.rcc_e_cn_bold')}</b>{t('Menu.rcc_e_cn')}</p>
    <p><b>{t('Menu.rcc_e_ds_bold')}</b>{t('Menu.rcc_e_ds')}</p>
    <p><b>{t('Menu.rcc_e_dn_bold')}</b>{t('Menu.rcc_e_dn')}</p>

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

    <h5>{t('Menu.rcc_titre_autre')} :</h5>

    <p><b>{t('Menu.rcc_a_s_bold')}</b>{t('Menu.rcc_a_s')}</p>
    <p><b>{t('Menu.rcc_a_fc_bold')}</b>{t('Menu.rcc_a_fc')}</p>
    <p><b>{t('Menu.rcc_a_dbm_bold')}</b>{t('Menu.rcc_a_dbm')}</p>
    <p><b>{t('Menu.rcc_a_ech_bold')}</b>{t('Menu.rcc_a_ech')}</p>
    <p><b>{t('Menu.rcc_ctrl_scrll_bold')}</b>{t('Menu.rcc_ctrl_scrll')}</p>
    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

    {additional_shortcut_item}
  </>
  external_content['rc']=window.SankeyToolsStatic?content_rc_static:content_rc_not_static

  const tmp=JSON.parse(JSON.stringify(exemple_menu))
  let list_template_data=[] as string[]
  // Si exemple_menu contient OpenSankey et que ce sous dossier contient les templates simple alors remple la liste des templates avec les modèle simples
  if(Object.keys(tmp).length!==0 && Object.keys(tmp).includes('OpenSankey') && Object.keys(tmp['OpenSankey']).includes('easy_template') ){
    list_template_data=tmp['OpenSankey']['easy_template'].filter((f:string)=>!f.includes('.xlsx'))
    // Si l'un des sous dossier d'OpenSankey dans exemple_menu est expert_template alors ajoute les modèles expert à la liste des modèles
    if( Object.keys(tmp['OpenSankey']).includes('expert_template') ){
      list_template_data.push(tmp['OpenSankey']['expert_template'])
      list_template_data=list_template_data.flat()
    }
  }




  // external_content['licence']=content_licence


  return <Modal scrollable size='xl' show={show_modal_welcome && !never_see_again} onHide={()=>{
    set_show_modal_welcome(false)
  }}>
    <Modal.Header closeButton>
      <Modal.Title>{t('welcome.'+active_page)}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {external_content[active_page]}
    </Modal.Body>

    <Modal.Footer style={{justifyContent:'center'}}>
      <Pagination >
        {external_pagination.map((c,i)=>{return <React.Fragment key={i}>{c}</React.Fragment>})}

        <Pagination.Item active={active_page==='rc'} key={'rc'} onClick={()=>{
          set_active_page('rc')
        }}>
          {t('welcome.rc')}
        </Pagination.Item>
        
      </Pagination>
      <FormCheck type='checkbox' label={t('dontSeeAgain')} checked={never_see_again} onChange={evt=>{
        set_never_see_again(evt.target.checked)
        localStorage.setItem('dontSeeAggainWelcome','1')
      }}/>
    </Modal.Footer>
  </Modal>
}

const style_menu_draggable={'display':'flex',width:'25%', 'paddingLeft':'0.75rem','paddingRight':'0.75rem',
  'position': 'fixed',
  'flexDirection': 'column',
  'backgroundColor': '#fff',
  'backgroundClip': 'padding-box',
  'border': '1px solid rgba(0, 0, 0, 0.2)',
  'borderRadius':' 0.6rem',
  'zIndex':'1',
  overflowY:'auto'
} as CSSProperties

export const menu_draggable=(content:JSX.Element|JSX.Element[],pointer_pos:{current:number[]},title:string,set_display_menu:(b:boolean)=>void)=>{
  const class_name=title.replaceAll('/','').replaceAll('.','').split(' ').join('_')
  return <Draggable  handle='.title_menu' 
    defaultPosition={{x:pointer_pos.current[0],y:pointer_pos.current[1]}}
    onStart={()=>{d3.selectAll('.menu_conf').style('z-index','1')
      d3.select('.menu_conf.'+class_name).style('z-index','2')
    }} 
  >
    <div className={'menu_conf '+class_name}
      style={style_menu_draggable}       
    >
      <Row className='title_menu' style={{'borderBottom':' 1px solid #eceeef','lineHeight':'1.5rem','zIndex':'1','backgroundColor':'white','position':'sticky','top':'0','padding':'1rem'}}>
        <Col><h3>{title}</h3></Col>
        <Col className='text-end'>{<CloseButton onClick={()=>{set_display_menu(false)}}/>}</Col>
      </Row>  
      {content}
    </div>
  </Draggable>
}


const icon_open_modal=<FontAwesomeIcon style={{float:'right'}} icon={faUpRightFromSquare} />
const sep=<Button variant='light' disabled><hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></Button>
const checked=(b:boolean)=><span style={{float:'right'}}>{b?'✓':''}</span>

export const context_menu_node=(contextualised_node:SankeyNode|undefined,set_contextualised_node:(n:SankeyNode|undefined)=>void,
  data:SankeyData,set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]},
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction,
  set_show_menu_node_apparence:React.Dispatch<React.SetStateAction<boolean>>,
  set_show_menu_node_label:React.Dispatch<React.SetStateAction<boolean>>,
  set_show_menu_node_io:React.Dispatch<React.SetStateAction<boolean>>,
  set_agregation_node:React.Dispatch<React.SetStateAction<string>>,
  set_is_agregation:React.Dispatch<React.SetStateAction<boolean>>,
  set_show_agregation:React.Dispatch<React.SetStateAction<boolean>>,
  set_display_link_opacity:React.Dispatch<React.SetStateAction<string>>,
  pointer_pos:{current:number[]},
  additional_context_element:JSX.Element[]
)=>{
  let style_c_n='0px 0px auto auto'
  if(contextualised_node!==undefined){
    style_c_n=(pointer_pos.current[1]-20)+'px auto auto '+(pointer_pos.current[0]+10)+'px'
  } 

  // Dropdown to change some pararmeter concerning the appearence of the node  
  const has_node_tags=Object.values(data.nodeTags).filter(nt=>nt.group_name!=='Type de noeud').length>0
  const dropdown_c_n_tag=(contextualised_node!==undefined && has_node_tags) ?<Dropdown as={ButtonGroup} variant='light' autoClose='outside' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Menu.tagNode_assign')}
    </Dropdown.Toggle>
    <Dropdown.Menu  variant='light'>
      {Object.entries(data.nodeTags).filter(nt=>Object.keys(nt[1].tags).length>0).map(nt=>{
        return <Dropdown autoClose='outside' drop='end'>
          <Dropdown.Toggle variant="light" id="dropdown-basic">
            {nt[1].group_name}
          </Dropdown.Toggle>
          <Dropdown.Menu  variant='light'>
            {Object.keys(nt[1].tags).map(t=>{
              return <Dropdown.Item as={Button} variant='light' onClick={()=>{
                // Contextualised node
                if(!Object.keys(contextualised_node.tags).includes(nt[0])){
                  contextualised_node.tags[nt[0]]=[]
                }
                if(!contextualised_node.tags[nt[0]].includes(t)){
                  contextualised_node.tags[nt[0]].push(t)
                }else{
                  contextualised_node.tags[nt[0]].splice(contextualised_node.tags[nt[0]].indexOf(t))
                }
                //Selected nodes
                multi_selected_nodes.current.filter(n=>n!=contextualised_node).forEach(n=>{
                  if(!Object.keys(n.tags).includes(nt[0])){
                    n.tags[nt[0]]=[]
                  }
                  if(!n.tags[nt[0]].includes(t)){
                    n.tags[nt[0]].push(t)
                  }else{
                    n.tags[nt[0]].splice(n.tags[nt[0]].indexOf(t))
                  }
                })

                set_data({...data})
              }}>
                {nt[1].tags[t].name}{checked(contextualised_node.tags[nt[0]] &&contextualised_node.tags[nt[0]].includes(t))}
              </Dropdown.Item>
            })}
          </Dropdown.Menu>
        </Dropdown>
      })}

    </Dropdown.Menu>
  </Dropdown>:<></>

  
  const dropdown_c_n_label=contextualised_node!==undefined?<Button onClick={()=>{
    set_show_menu_node_label(true)
    set_contextualised_node(undefined)
  }} variant='light'>{t('Noeud.labels.labels')} {icon_open_modal}</Button>:<></>



  const dropdown_c_n_apparence=contextualised_node!==undefined?<Button onClick={()=>{
    set_show_menu_node_apparence(true)
    set_contextualised_node(undefined)
  }} variant='light'>{t('Noeud.apparence.apparence')} {icon_open_modal}</Button>:<></>


  // Dropdown to change some pararmeter concerning the style of the node  
  const dropdown_c_n_style_select=contextualised_node!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.SelectStyle')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      {
        Object.values(data.style_node).map(sn=>{
          return <Dropdown.Item onClick={()=>{
            contextualised_node.style=sn.idNode
            multi_selected_nodes.current.filter(n=>n!=contextualised_node).forEach(n=>n.style=sn.idNode)

            set_data({...data})
          }}>{sn.name}{checked(contextualised_node.style==sn.idNode)}</Dropdown.Item>
        })
      }
    </Dropdown.Menu>
  </Dropdown>:<></>

  const dropdown_c_n_style=contextualised_node!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.Style')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item  as={Button} variant='light' onClick={()=>{
        delete contextualised_node.local
        multi_selected_nodes.current.filter(n=>n!=contextualised_node).forEach(n=>delete n.local)
        set_data({...data})
      }}>{t('Noeud.AS')}</Dropdown.Item>
      {dropdown_c_n_style_select}
    </Dropdown.Menu>
  </Dropdown>:<></>

  const dropdown_c_n_io=contextualised_node!==undefined?<Button onClick={()=>{
    set_show_menu_node_io(true)
    set_contextualised_node(undefined)
  }} variant='light'>{t('Noeud.PF.PFM')}{icon_open_modal}</Button>:<></>

  // Pop over that serve as context menu 
  return contextualised_node!==undefined?<Popover  id="context_node_pop_over" style={{maxWidth:'100%',position:'absolute',inset:style_c_n}}>
    <Popover.Body>
      <ButtonGroup vertical>
        {multi_selected_nodes.current.filter(n=>n!=contextualised_node).length==0 && SankeyUtils.node_context_has_aggregate(contextualised_node,data)?<Button variant='light' onClick={()=>{
          SankeyUtils.aggregate(contextualised_node,data,set_agregation_node,set_is_agregation,set_show_agregation)
          set_data({...data})
          set_contextualised_node(undefined)
        }}>Aggregation</Button>:<></>}
        {multi_selected_nodes.current.filter(n=>n!=contextualised_node).length==0 && SankeyUtils.node_context_has_desaggregate(contextualised_node,data)?<Button variant='light' onClick={()=>{
          SankeyUtils.desaggregate(contextualised_node,data,set_agregation_node,set_is_agregation,set_show_agregation)
          set_data({...data})
          set_contextualised_node(undefined)
        }}>Desaggregation</Button>:<></>}
        {sep}        
        <Button
          variant='light'
          onClick={() => {
            multi_selected_links.current = [] as SankeyLink[]
            multi_selected_links.current = Object.values(data.links).filter(l=>contextualised_node.outputLinksId.includes(l.idLink))
            const opacity=SankeyUtils.return_value_link(data,multi_selected_links.current[0],'opacity') as string
            set_display_link_opacity(opacity)
            set_contextualised_node(undefined)
            set_data(data)
          }}>
          {t('Noeud.SlctOutLink')}
        </Button>
        <Button
          variant='light'
          onClick={() => {
            multi_selected_links.current = [] as SankeyLink[]
            multi_selected_links.current = Object.values(data.links).filter(l=>contextualised_node.inputLinksId.includes(l.idLink))
            const opacity=SankeyUtils.return_value_link(data,multi_selected_links.current[0],'opacity') as string
            set_display_link_opacity(opacity)
            set_contextualised_node(undefined)
            set_data(data)
          }}>
          {t('Noeud.SlctInLink')}
        </Button>
        <Button
          variant='light'
          onClick={() => {
            reorganize_node_inputLinksId(data,contextualised_node, data.nodes, data.links)
            reorganize_node_outputLinksId(data,contextualised_node, data.nodes, data.links)
            multi_selected_nodes.current.filter(n=>n!=contextualised_node).forEach(n=>{
              reorganize_node_inputLinksId(data,n, data.nodes, data.links)
              reorganize_node_outputLinksId(data,n, data.nodes, data.links)
            })
            set_contextualised_node(undefined)
            set_data({ ...data })
          }}>
          {t('Noeud.Reorg')}
        </Button>
        {multi_selected_nodes.current.length==1?dropdown_c_n_io:<></>}

        {has_node_tags?sep:<></>}
        {dropdown_c_n_tag}
        {sep}

        {dropdown_c_n_apparence}
        {dropdown_c_n_label}
        {additional_context_element}
        {sep}
        {dropdown_c_n_style}

      </ButtonGroup>
    </Popover.Body>
  </Popover>:<></>
}

export const context_menu_link=(contextualised_link:SankeyLink|undefined,set_contextualised_node:(n:SankeyLink|undefined)=>void,
  set_show_menu_link_data:(b:boolean)=>void,
  set_show_menu_link_appearence:(b:boolean)=>void,
  set_show_menu_link_label:(b:boolean)=>void,
  data:SankeyData,set_data:(d:SankeyData)=>void,
  tags_selected:{[k: string]: string},
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction,
  pointer_pos:{current:number[]}
)=>{
  let style_c_l='0px 0px auto auto'
  if(contextualised_link!==undefined){
    style_c_l=(pointer_pos.current[1]-20)+'px auto auto '+(pointer_pos.current[0]+10)+'px'
  }

  const invert_flux=(l:SankeyLink,nodes_to_reorganize: SankeyNode[])=>{
              
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
              
              
  }
  
  const value_selected_parameter_contextualised_link = (): SankeyLinkValue => {
    if(contextualised_link===undefined){
      return ({} as SankeyLinkValue)
    }else{
      if ( Object.keys(data.links).length === 0 || !(contextualised_link.idLink in data.links) ) {
        let val = JSON.parse(JSON.stringify(Object(contextualised_link.value)))
        Object.values(tags_selected).map(tag_selected => {
          if (val[tag_selected] === undefined) {
            val[tag_selected] = {}
          }
          val = val[tag_selected]
        })
        return val
      }
      let val = JSON.parse(JSON.stringify(Object(data.links[contextualised_link.idLink].value)))
      Object.values(tags_selected).map(tag_selected => {
        if (val[tag_selected] === undefined) {
          val[tag_selected] = {'display_value': '',tags:{},value:0}
        }
        val = val[tag_selected]
      })
      return val
    }
    
  }
  const has_flux_tags=Object.values(data.fluxTags).length>0
  // Dropdown to change some pararmeter concerning the appearence of the node  
  const dropdown_c_l_tag=(contextualised_link!==undefined && has_flux_tags) && Object.entries(data.nodeTags).length>0?<Dropdown as={ButtonGroup} variant='light' autoClose='outside' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Menu.tagFlux_assign')}
    </Dropdown.Toggle>

    <Dropdown.Menu  variant='light'>
      {Object.entries(data.fluxTags).filter(nt=>Object.keys(nt[1].tags).length>0).map(nt=>{
        return <Dropdown as={Button} variant='light' autoClose='outside' drop='end'>
          <Dropdown.Toggle variant="light" id="dropdown-basic">
            {nt[1].group_name}
          </Dropdown.Toggle>
          <Dropdown.Menu  variant='light'>
            {Object.keys(nt[1].tags).map(t=>{
              return <Dropdown.Item onClick={()=>{
                // Assign tag to selected links
                multi_selected_links.current.filter(l=>l!==contextualised_link).forEach(l=>{
                  let val = Object(l.value)
                  Object.values(tags_selected).forEach(tag => {
                    if (val[tag] === undefined) {
                      val[tag] = {}
                    }
                    val = val[tag]
                  })
                  val.tags[nt[0]] = !(value_selected_parameter_contextualised_link().tags[nt[0]] === t)? t : ''
                })

                // Assign tag to contextualised link
                let val = Object(contextualised_link.value)
                Object.values(tags_selected).forEach(tag => {
                  if (val[tag] === undefined) {
                    val[tag] = {}
                  }
                  val = val[tag]
                })
                val.tags[nt[0]] = !(value_selected_parameter_contextualised_link().tags[nt[0]] === t)? t : ''

                
                set_data({...data})
              }}>
                {nt[1].tags[t].name}{checked(value_selected_parameter_contextualised_link().tags[nt[0]] === t)}
              </Dropdown.Item>
            })}
          </Dropdown.Menu>
        </Dropdown>
      })}

    </Dropdown.Menu>
  </Dropdown>:<></>

  const button_open_link_label=contextualised_link!==undefined?<Button onClick={()=>{
    set_show_menu_link_label(true)
    set_contextualised_node(undefined)
  }} variant='light'>{t('Flux.label.label')} {icon_open_modal}</Button>:<></>
 
  const button_open_link_appearence=contextualised_link!==undefined?<Button onClick={()=>{
    set_show_menu_link_appearence(true)
    set_contextualised_node(undefined)
  }} variant='light'>{t('Flux.apparence.apparence')} {icon_open_modal}</Button>:<></>

  // Dropdown to change some pararmeter concerning the style of the node  
  const dropdown_c_l_style_select=contextualised_link!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.SelectStyle')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      {
        Object.values(data.style_node).map(sn=>{
          return <Dropdown.Item onClick={()=>{
            contextualised_link.style=sn.idNode
            multi_selected_links.current.filter(n=>n!=contextualised_link).forEach(n=>n.style=sn.idNode)

            set_data({...data})
          }}>{sn.name}{checked(contextualised_link.style==sn.idNode)}</Dropdown.Item>
        })
      }
    </Dropdown.Menu>
  </Dropdown>:<></>
  const dropdown_c_l_style=contextualised_link!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.Style')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item as={Button} variant='light' onClick={()=>{
        delete contextualised_link.local
        multi_selected_links.current.filter(n=>n!=contextualised_link).forEach(n=>delete n.local)
        set_data({...data})
      }}>{t('Noeud.AS')}</Dropdown.Item>
      {dropdown_c_l_style_select}
    </Dropdown.Menu>
  </Dropdown>:<></>

  const dropdown_c_l_layout=contextualised_link!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Flux.layout')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>      
      <Dropdown.Item onClick={()=>{
        multi_selected_links.current.forEach(n=>handleDownLink(data,n.idLink))
        set_data({...data})
      }}>{t('Flux.layoutUp')}</Dropdown.Item>
      <Dropdown.Item onClick={()=>{
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
        set_data({...data})
      }}>{t('Flux.layoutTop')}</Dropdown.Item>





      <Dropdown.Item onClick={()=>{
        multi_selected_links.current.forEach(n=>handleUpLink(data,n.idLink))
        set_data({...data})
      }}>{t('Flux.layoutDown')}</Dropdown.Item>

      <Dropdown.Item onClick={()=>{
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
        set_data({...data})
      }}>{t('Flux.layoutBottom')}</Dropdown.Item>
     
    </Dropdown.Menu>
  </Dropdown>:<></>

  const button_open_link_data=contextualised_link!==undefined?<Button onClick={()=>{
    set_show_menu_link_data(true)
    set_contextualised_node(undefined)
  }} variant='light'>{t('Flux.data.données')} {icon_open_modal}</Button>:<></>

  // Pop over that serve as context menu 
  return contextualised_link!==undefined?<Popover id="context_link_pop_over" style={{maxWidth:'100%',position:'absolute',inset:style_c_l}}>
    <Popover.Body >
      <ButtonGroup vertical>
        <Button variant='light' onClick={()=>{
          const nodes_to_reorganize: SankeyNode[] = []
          invert_flux(contextualised_link,nodes_to_reorganize)
          multi_selected_links.current.filter(l=>l!==contextualised_link).forEach(l => {
            invert_flux(l,nodes_to_reorganize)
          })
          nodes_to_reorganize.forEach(n => {
            reorganize_inputLinksId(data,n, true, true, data.nodes, data.links)
          })
          set_data({ ...data })
        }}>{t('Flux.if')}</Button>

        {sep}
        {dropdown_c_l_layout}
        {has_flux_tags && sep}
        {dropdown_c_l_tag}
        {sep}
        {button_open_link_data}
        {button_open_link_appearence}
        {button_open_link_label}
        {sep}
        {dropdown_c_l_style}

      </ButtonGroup>
    </Popover.Body>
  </Popover>:<></>
}

export const context_zdd=(show_context_zdd:boolean,set_show_context_zdd:(b:boolean)=>void,
  data:SankeyData,set_data:(d:SankeyData)=>void,
  pointer_pos:{current:number[]},
  node_hspace:number,
  set_node_hspace:(n:number)=>void,
  node_vspace:number,
  set_node_vspace:(n:number)=>void,
  t:TFunction
)=>{

  let style_c_zdd='0px 0px auto auto'
  if(show_context_zdd){
    style_c_zdd=(pointer_pos.current[1]-20)+'px auto auto '+(pointer_pos.current[0]+10)+'px'
  }
    
  const button_bg_color=<Form as={Button} variant='light'><Form.Control hidden type='color' id='color_bg_zdd' name='color_bg_zdd' onChange={(evt)=>{
    data.couleur_fond_sankey=evt.target.value
    set_data({...data})
  }}></Form.Control>
  <Form.Label htmlFor='color_bg_zdd'>{t('Menu.BgC')}</Form.Label>
  </Form>

  const button_bg_grid=<><Button variant='light' onClick={()=>{
    data.grid_visible = !data.grid_visible
    set_data({...data})
  }}>{t('MEP.TCG')}{checked(data.grid_visible)}</Button>
  </>


  const dropdown_c_zdd_scale=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('MEP.Echelle')}
    </Dropdown.Toggle>

    <Dropdown.Menu variant='light'>
      <Dropdown.Item as={Button} variant='light'>
        <Form.Control
          type="text"
          value={data.user_scale}
          onChange={evt => {
            data.user_scale = +evt.target.value
            set_data({ ...data })
          }}
        />
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>

  const dropdown_c_zdd_max_size_link=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('MEP.MaxFlux')}
    </Dropdown.Toggle>

    <Dropdown.Menu variant='light'>
      <Dropdown.Item as={Button} variant='light'>
        <Form.Control
          type="text"
          value={data.maximum_flux == null ? undefined :data.maximum_flux}
          onChange={(evt) => {
            const maximum_flux =isNaN(+evt.target.value)?null:+evt.target.value
            data.maximum_flux = maximum_flux
            set_data({ ...data })
          }}
        />
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>

  const button_pa=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('MEP.PA')}
    </Dropdown.Toggle>

    <Dropdown.Menu variant='light'>

      {/* Set vertical value for automatic positionning */}
      <Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
        <Dropdown.Toggle variant="light" id="dropdown-basic">
          {t('MEP.Horizontal')}
        </Dropdown.Toggle>
        <Dropdown.Menu variant='light'>
          <Dropdown.Item as={Button} variant='light'>
            <Form.Control
              type="text"
              value={node_hspace}
              onChange={evt => {
                set_node_hspace(+evt.target.value)
                data.h_space = +evt.target.value
              }}
            /></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* Set vertical value for automatic positionning */}
      <Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
        <Dropdown.Toggle variant="light" id="dropdown-basic">
          {t('MEP.Vertical')}
        </Dropdown.Toggle>
        <Dropdown.Menu variant='light'>
          <Dropdown.Item as={Button} variant='light'>
            <Form.Control
              type="text"
              value={node_vspace}
              onChange={evt => {
                set_node_vspace(+evt.target.value)
                data.h_space = +evt.target.value
              }}
            /></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    
      <Dropdown.Item as={Button} variant='light' onClick={() => {
        compute_auto_sankey(data, node_hspace)
        set_data({ ...data })
      }}>{t('MEP.PA_action')}</Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>
  
  
  
  const button_an=<Button variant='light'
    onClick={() => {
      arrangeNodes(data)
      set_data({ ...data })
    }}>
    {t('MEP.AN')}
  </Button>




  return show_context_zdd?<Popover id="context_zdd_pop_over" style={{maxWidth:'100%',position:'absolute',inset:style_c_zdd}}>
    <Popover.Body >
      <ButtonGroup vertical>
        {button_bg_color}
        {button_bg_grid}
        {dropdown_c_zdd_scale}
        {dropdown_c_zdd_max_size_link}
        {sep}
        {button_pa}
        {button_an}
      </ButtonGroup>
    </Popover.Body>
  </Popover>:<></>
}