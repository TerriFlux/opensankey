/* eslint @typescript-eslint/no-var-requires: "off" */
import * as d3 from 'd3'
import React, { ChangeEvent, FunctionComponent, useRef, useState, Ref } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form, Modal, Navbar, Nav, Button, Dropdown, Container, Offcanvas, ToggleButton,Row,Pagination,FormCheck,Col, DropdownButton, ButtonGroup,OverlayTrigger,Tooltip,FormGroup,FormLabel,Popover,Card} from 'react-bootstrap'
import { SankeyDataPropTypes, SankeyNodePropTypes, SankeyData,TagsGroup,TagsCatalog,SankeyLink} from './types'
import { convert_data,complete_sankey_data } from './SankeyConvert'
import FileSaver from 'file-saver'
import { FaAngleDoubleLeft,FaUser,FaPowerOff,FaAngleDoubleRight} from 'react-icons/fa'
import * as SankeyUtils from './SankeyUtils'
import SankeyLoad from './SankeyLoad'
import { SankeyConfigurationMenu } from './SankeyMenuConfiguration'
// import ModalPreference from './SankeyMenuPreferences'
// import { ModalStyleLink, ModalStyleNode } from './SankeyMenuStyles'
import { ExcelModal,ApplyLayoutDialog,ApplySaveJSONDialog } from './SankeyMenuDialogs'
import { TFunction } from 'i18next'
import { MultiSelect } from 'react-multi-select-component'

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
  set_welcome_text: PropTypes.func.isRequired,
  show_modalTemplate:PropTypes.bool.isRequired,
  set_show_modalTemplate:PropTypes.func.isRequired,
  cardsTemplate:PropTypes.element.isRequired,
  token:PropTypes.bool.isRequired,
  useNavigate:PropTypes.func.isRequired,
  external_modal:PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
  // menu_banner:PropTypes.object.isRequired,
  loginOut:PropTypes.func.isRequired,
  unsetTokens:PropTypes.func.isRequired,
  // modalShortcut:PropTypes.element.isRequired,
  min_width_and_height :PropTypes.func.isRequired,
  name_user:PropTypes.string.isRequired,
  reinitialization:PropTypes.func.isRequired,
  set_show_modale_tuto:PropTypes.func.isRequired,
  show_modale_tuto:PropTypes.bool.isRequired,

}

const pre_process_export_svg=()=>{
  // Create a copy of the svg so we can alter it before exporting it 
  // without having to revert our changerment after the export
  const svg =window.d3.select(' .opensankey#svg-container svg')
  svg.selectAll('.sankey-tooltip').remove()
  svg.selectAll('text[visibility=hidden]').remove()
  svg.style('border','0px')
  svg.style('background-color','#fff')
  svg.select('#grid').style('opacity','0')
  svg.selectAll('.box_width_threshold').remove()
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
    .node() as HTMLElement).parentNode as HTMLElement).innerHTML
 
  const blob = new Blob([html], { type: 'image/svg+xml' })
  FileSaver.saveAs(blob, 'sankey_diagram.svg')
  post_process_export_svg()
}

const clickSavePDF = (data:SankeyData) => {
  const svg = pre_process_export_svg()
  svg.attr('viewBox', [0, 0, data.width, data.height] as unknown as string)
  const html = ((svg.attr('title', 'test2')
    .attr('version', 1.1)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .node() as HTMLElement).parentNode as HTMLElement).innerHTML
  post_process_export_svg()
  const blob = new Blob([html], { type: 'image/svg+xml' })
  const form_data = new FormData()
  form_data.append('svg', blob)

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

const clickSavePNG = (data:SankeyData) => {
  const svg = pre_process_export_svg()
  svg.attr('viewBox', [0, 0, data.width, data.height] as unknown as string)
  const html = ((svg.attr('title', 'test2')
    .attr('version', 1.1)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .node() as HTMLElement).parentNode as HTMLElement).innerHTML

  const blob = new Blob([html], { type: 'image/svg+xml' })
  const form_data = new FormData()
  form_data.append('svg', blob)
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
export const addAllDropDownNode = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  level:boolean
) => {
  const color = 'black'
  const {nodeTags} = data
  let banner_grouptag = Object.entries(nodeTags).filter(([, tags_group]) => tags_group.banner !== 'none' && tags_group.banner !== 'level')
  if (level) {
    const nb_level_tag = Object.values(nodeTags).filter(tags_group=>tags_group.banner === 'level' && (Object.keys(tags_group.tags).length > 0 )).length
    if (nb_level_tag > 1) {
      banner_grouptag = Object.entries(nodeTags).filter(([, tags_group]) => tags_group.banner === 'level' && tags_group.group_name !== 'Primaire' && Object.keys(tags_group.tags).length > 0)
    } else {
      banner_grouptag = Object.entries(nodeTags).filter(([, tags_group]) => tags_group.banner === 'level' && Object.keys(tags_group.tags).length > 1)
    }
  }
  const allDD = banner_grouptag.map(([, tags_group]) => {
    const tags_selected=Object.entries(data['nodeTags']).filter((k)=>{return k[1]==tags_group})[0]

    if (tags_group.banner == 'one' ) {
      return (
        <FormGroup as={Row}>
          <Row>
            <Col xs={10}>
              <FormLabel style={{ color: color }}>
                {tags_group.group_name}
              </FormLabel>
            </Col>
          </Row>
          <Row>
            <OverlayTrigger
              key={'Banner.ndd_lst.5'}
              placement={'bottom'}
              delay={500}
              overlay={<Tooltip id={'Banner.ndd_lst.5'}>{t('Banner.ndd_lst')} </Tooltip>}>
              <Col xs={10}>
                {<Form.Select
                  style={{ width: '200px', color: 'black' }}
                  key={tags_group.group_name}
                  placeholder='all'
                  onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                    handleSimpleDropdown(evt, tags_group, data, set_data) }}>{
                    Object.entries(tags_group.tags).map(([tag_key, tag],i) => {
                      return (<option key={i} value={tag_key}>{tag.name}</option>)
                    })}
                </Form.Select>}
              </Col>
            </OverlayTrigger>
            <Col xs={2}>
              <OverlayTrigger
                key={'Banner.ndd_chk.5'}
                placement={'bottom'}
                delay={500}
                overlay={<Tooltip id={'Banner.ndd_chk.5'}>{t('Banner.ndd_chk')} </Tooltip>}>
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
                        el.colorTag = 'no_colormap'
                      })
                      data.colorMap = tags_selected[0]
                      data['nodeTags'][tags_selected[0]].show_legend = true
                    }
                    set_data({ ...data })
                  }}
                />
              </OverlayTrigger>
            </Col>
          </Row>
        </FormGroup>)
    }
    else if (tags_group.banner === 'level' && Object.values(tags_group.tags).length > 0) {
      if (Object.keys(tags_group.tags).length < 1 ) {
        return <></>
      }
      const tmp = Object.entries(tags_group.tags).filter(tag=>tag[1].selected)
      const selected = tmp.length > 0 ? tmp[0][0] : ''
      return (
        <FormGroup as={Row}>
          <Row>
            {banner_grouptag.length > 1 ? <FormLabel style={{ color: color }}>{tags_group.group_name}</FormLabel> : <></>}
          </Row>
          <Row>
            <OverlayTrigger
              key={'Banner.ndd_lst.4'}
              placement={'bottom'}
              delay={500}
              overlay={<Tooltip id={'Banner.ndd_lst.4'}>{t('Banner.ndd_lst')} </Tooltip>}>
              <Col xs={10}>
                <Form.Select
                  style={{ width: '200px', color: 'black' }}
                  key={tags_group.group_name}
                  value={selected}
                  placeholder='all'
                  onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                    handleSimpleDropdown(evt, tags_group, data, set_data) }}>{
                    Object.entries(tags_group.tags).map(([tag_key, tag],i) => {
                      return (<option key={i} value={tag_key}>{tag.name}</option>)
                    })}
                </Form.Select>
              </Col>
            </OverlayTrigger>
            {tags_group.siblings !== undefined && tags_group.siblings.length > 0 ?
              <Col xs={2}>
                <OverlayTrigger
                  key={'Banner.ndd_chk.4'}
                  placement={'bottom'}
                  delay={500}
                  overlay={<Tooltip id={'Banner.ndd_chk.4'}>{t('Banner.ndd_chk')} </Tooltip>}>
                  <FormCheck inline
                    type='switch'
                    checked={tags_group.activated}
                    onChange={evt => {
                      tags_group.activated = evt.target.checked
                      tags_group.siblings.forEach(sibling=>data.nodeTags[sibling].activated = false)
                      SankeyUtils.set_nodes_level(data)
                      set_data({ ...data })
                    }}
                  />
                </OverlayTrigger>
              </Col> : <></>
            }
          </Row>
        </FormGroup>)
    }
    else if (tags_group.banner == 'multi') {
      const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })

      return (
        <FormGroup as={Row}>
          <Row>
            <Col xs={10}>
              <FormLabel style={{ color: color }}>{tags_group.group_name}
              </FormLabel>
            </Col>
          </Row>
          <Row>
            <OverlayTrigger
              key={'Banner.ndd_lst.3'}
              placement={'bottom'}
              delay={500}
              overlay={<Tooltip id={'Banner.ndd_lst.3'}>{t('Banner.ndd_lst')} </Tooltip>}>
              <Col xs={10}>
                <MultiSelect
                  className={'multidropdown_filter_node_link'}
                  style={{widthMax:'200px', color: 'black' }}
                  valueRenderer={(selected:selected_type[]) => {
                    return selected.length ? selected.map(({ label }) => label + ', ') : 'Aucun tag sélectionné'
                  }}
                  labelledBy={'dropdown_node_filter'}
                  overrideStrings={{
                    'selectAll': 'Tout sélectionner',
                  }}
                  // hasSelectAll={false}
                  value={selected}
                  options={options}
                  onChange={(selected: [{ label: string, value: string }]) => {
                    handleMultiDropdown(selected, tags_group, data, set_data)
                  }}
                />
              </Col>
            </OverlayTrigger>
            <Col xs={2}>
              <OverlayTrigger
                key={'Banner.ndd_chk.3'}
                placement={'bottom'}
                delay={500}
                overlay={<Tooltip id={'Banner.ndd_chk.3'}>{t('Banner.ndd_chk')} </Tooltip>}>
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
                        el.colorTag = 'no_colormap'
                      })
                      data.colorMap = tags_selected[0]
                      data['nodeTags'][tags_selected[0]].show_legend = true
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
  // if (!level) {
  //   return (<><tr><th >{t('Banner.ndd_lst')}</th><th>{t('Banner.ndd_chk')}</th></tr>{allDD}</>)
  // } else {
  //   return (<><tr><th >{t('Banner.ndd_lst')}</th><th></th></tr>{allDD}</>)
  // }
  return (<>{allDD}</>)
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
  if (tags_group.banner === 'level' ) {
    SankeyUtils.set_nodes_level(data)
  }
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
                  // hasSelectAll={false}
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
  url_prefix:string,
  set_show_modalTemplate:(b:boolean)=>void,
  external_edition_item:JSX.Element[],
  externale_save_item:JSX.Element[],
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






  // OBJECT THAT CONTAIN DIFFERENT MENUS
  const ui :{[s:string] : JSX.Element}=  {}

  if(!window.SankeyToolsStatic){
    ui['file']=<>
      <DropdownButton size='sm' variant='light' drop='down' id='ouvrir' title={t('Menu.ouvrir')}  >
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
                //result = result.split('<br>').join('\\\\n')
                const result_data = JSON.parse(result)
                Object.assign(new_data, result_data)
                if (result_data.version === undefined) {
                  (new_data.version as unknown as undefined) = undefined
                }
                convert_data(new_data)
                complete_sankey_data(new_data,default_sankey_data,SankeyUtils.default_node,SankeyUtils.default_link)
                SankeyUtils.set_nodes_level(data)
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
      </DropdownButton>
      <DropdownButton size='sm' variant='light'  drop='down' id='enregistrer' title={t('Menu.enregistrer')} >
        <Dropdown.Item onClick={()=>{
          set_show_save_json(true)
        }} >JSON</Dropdown.Item>
        {/* <Dropdown.Item onClick={()=>SankeyUtils.clickSaveExcelSimple(url_prefix,data)} >Excel Simple</Dropdown.Item> */}
        <Dropdown.Item onClick={()=>SankeyUtils.clickSaveExcel('/opensankey/',data)} >Excel</Dropdown.Item>
        {externale_save_item}
      </DropdownButton>
      <DropdownButton size='sm' variant='light' drop='down' id='exporter' title={t('Menu.exporter')} >
        <Dropdown.Item onClick={clickSaveSVG} >{t('Menu.exporter')} SVG</Dropdown.Item>
        <Dropdown.Item onClick={()=>clickSavePDF(data)} >{t('Menu.exporter')} PDF</Dropdown.Item>
        <Dropdown.Item onClick={()=>clickSavePNG(data)} >{t('Menu.exporter')} PNG</Dropdown.Item>
      </DropdownButton>
      <Button size='sm' variant='light' onClick={() => { setShowPreference(true) }}>{t('Menu.preference')}</Button>
      <Button size='sm' variant='light' onClick={() => { set_show_modalTemplate(true) }}>{t('Menu.templates')}</Button>
    </>

    ui['edition']=<>
      <Button size='sm' variant='light' onClick={reinitialization} >{t('Menu.reinit')}</Button>
      {/* <Button size='sm' variant='light' onClick={() => set_show_publish_dialog(true)} >{t('Menu.pub')}</Button>     */}
      <Button size='sm' variant='light' onClick={() => set_show_apply_layout(true)}>{t('Menu.amp')}</Button>
      <Button size='sm' variant='light' onClick={showStyleEdition}>{t('Menu.esn')}</Button>
      <Button size='sm' variant='light' onClick={showStyleEditionLink}>{t('Menu.esf')}</Button>
      {external_edition_item}
    </>
    ui['aide']=<><Button size='sm' variant='light' onClick={() =>{
      set_show_welcome(true)
      set_never_see_again(false)
      localStorage.setItem('dontSeeAggainWelcome','0')
    }}>
      {t('DisplayWelcome')}</Button>
    <Button size='sm' variant='light' onClick={() => goToUserDoc()} >{t('Menu.doc')}</Button></>

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
    set_welcome_text,
    show_modalTemplate,
    set_show_modalTemplate,
    cardsTemplate,
    token,
    useNavigate,
    external_modal,
    // menu_banner,
    loginOut,
    unsetTokens,
    min_width_and_height,
    name_user,formations_menu,reinitialization,set_show_modale_tuto,show_modale_tuto
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

          const new_data=Object.assign(default_sankey_data(),SankeyUtils.processExample(server_data))
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
      // Lors de l'ouverture du menu, enregistre l'échelle de la zone de sankey
      // et la position des scroll bar

      const scaleOfSVG=d3.select(' .opensankey #svg').attr('transform').split(' ').filter(s=>s.includes('scale'))[0].replace('scale(','').replace(')','')
      sessionStorage.setItem('scale',scaleOfSVG)

      const SL=document.getElementsByTagName ('html')[0]?.scrollLeft
      const string_SL=(SL!==undefined)?SL.toString():'none'
      sessionStorage.setItem('scrollLeft',string_SL)

      const ST=document.getElementsByTagName ('html')[0]?.scrollTop
      const string_ST=(ST!==undefined)?ST.toString():'none'
      sessionStorage.setItem('scrollTop',string_ST)

      SankeyUtils.adjust_sankey_zone(data,min_width_and_height,true)
    }else{
      // Lors de la fermeture du menu, remet l'échelle de la zone de sankey avant l'ouverture du menu
      // et replace la position des scroll bar comme elles etaient avant
      const scaleToUse=sessionStorage.getItem('scale')
      const SlToUse=sessionStorage.getItem('scrollLeft')
      const StToUse=sessionStorage.getItem('scrollTop')

      if(scaleToUse){
        d3.select(' .opensankey #svg').attr('transform','translate(0,0) scale('+scaleToUse+')')
      }else{
        SankeyUtils.adjust_sankey_zone(data,min_width_and_height)
      }
      if(SlToUse && StToUse){
        document.getElementsByTagName ('html')[0]?.scrollTo(+SlToUse,+StToUse)
      }
      sessionStorage.removeItem('scale')
      sessionStorage.removeItem('scrollLeft')
      sessionStorage.removeItem('scrollTop')
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
      return <FaAngleDoubleRight style={{marginTop:'50px'}} />
    } else {
      return <FaAngleDoubleLeft style={{marginTop:'50px'}} />
    }

  }


  const has_scrollbar_shift=window.innerWidth-document.getElementsByTagName('html')[0].clientWidth


  const navigate=useNavigate()
  const returnToApp=()=>{
    navigate('/')
    set_data({...data})
  }
  const ordered_menu:{[s:string]:JSX.Element}={}
  const oredred_key=['file','edition','toolbar','filter','view','afm','formation','demo','aide']
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








  return (
    <>
      {external_modal.map((c,i)=>{return <React.Fragment key={i}>{c}</React.Fragment>})}
      {/* Top Navbar with navigation and edition elements */}
      <Navbar className='bg-light' fixed='top' style={{ 'display': 'block' }} >
        <Container className='MenuNavigation'>
          {!window.SankeyToolsStatic?<>
            <Navbar.Brand style={{marginRight:'0px'}} href="https://terriflux.com/" ><img src={logo_terriflux} width={100} /> </Navbar.Brand>
            <div style={{display:'inline-block',width:'0px',marginLeft:'5px',marginRight:'5px',height:'40px',borderRight:'solid 1px #ddd',borderLeft:'solid 1px #ddd',padding:'0'}}></div>
          </>:<></>
          }

          <Navbar.Brand href="#" onClick={()=>set_welcome_text(window.sankey.welcome_text)}><img src={logo} width={logo_width ? logo_width : 200} /> </Navbar.Brand>
          {/* {!window.SankeyToolsStatic ? (<>
            <Nav className='me-auto'>
              {menus.map((c,i)=>{
                return <React.Fragment key={i}>{c}</React.Fragment>
              })}
            </Nav>
            {toolbar}

            <Nav>
              <Col>
                <Button style={{'marginRight':'15px','width':'35px','height':'35px','backgroundColor':(!token)?'#ff7851':'#78c2ad','borderColor':(!token)?'#ff7851':'#78c2ad'}} onClick={()=> (token)?navigate('/dashboard'):navigate('/login')}><FaUser/></Button>
                <Form.Label style={{display:'contents'}}>{(token)?name_user:t('connect')}</Form.Label>
                {token?<Button style={{'marginRight':'15px','width':'35px','height':'35px'}}variant='danger' onClick={()=>loginOut(unsetTokens,returnToApp)}><FaPowerOff/></Button>:<></>}

              </Col>
            </Nav>
          </>
          ) : (<>

            <Col><h4 onClick={()=>set_welcome_text(window.sankey.welcome_text)}><a href="#" style={{color:"#666"}}>{window.sankey.header}</a></h4></Col>
            {toolbar}
          </>)}  */}
          <Col>
            <Row>
              <Nav variant="tabs" className='sub_nav' activeKey={menu_acivated}>
                {Object.keys(ordered_menu).map(m=>{

                  return <Nav.Item>
                    <Nav.Link eventKey={m} onClick={()=>set_menu_activated(m)}>
                      {t('Menu.'+m)}
                    </Nav.Link>
                  </Nav.Item>
                })}
              </Nav>
            </Row>
            <Row lg={'auto'}  style={{whiteSpace:'nowrap'}}>
              <ButtonGroup>
                {ordered_menu[menu_acivated]}
              </ButtonGroup>
            </Row>
          </Col>
          {!window.SankeyToolsStatic ?<Nav>
            <Col>
              <Button style={{'marginRight':'15px','width':'35px','height':'35px','backgroundColor':(!token)?'#ff7851':'#78c2ad','borderColor':(!token)?'#ff7851':'#78c2ad'}} onClick={()=> (token)?navigate('/dashboard'):navigate('/login')}><FaUser/></Button>
              <Form.Label style={{display:'contents'}}>{(token)?name_user:t('connect')}</Form.Label>
              {token?<Button style={{'marginRight':'15px','width':'35px','height':'35px'}}variant='danger' onClick={()=>loginOut(unsetTokens,returnToApp)}><FaPowerOff/></Button>:<></>}
            </Col>
          </Nav>:<></>}
        </Container>
      </Navbar>
      {/* Bottom Navbar with some more info */}
      <Navbar bg='light' fixed='bottom' style={{fontSize:'0.85em'}} >
        <Container className='sankeyFooter' >

          <span style={{display:'inline'}}>
        ©<a  href="https://terriflux.com/" ><img width={75} src={logo_terriflux} /></a> - Tous droits réservés
          </span>
          <span style={{display:'inline'}}>
            {app_name}
          </span>
          <span style={{display:'inline'}}><a href='https://terriflux.com/mentions-legales/'>Mention légales</a></span>
          <span style={{display:'inline'}}>
          9 rue du Rocher de Lorzier, 38430 Moirans  +33 (0)6 21 83 56 76
          </span>

        </Container>
      </Navbar>

      {(!data.static_sankey) ?<Offcanvas className='sankey-menu' show={show_nav} placement='end' /*onHide={set_show_nav(false)}*/ {...props} style={{ 'width': '540px', 'marginTop':document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().y+document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().height }}>
        <Offcanvas.Body style={{ 'padding': '0px 0px 0px 0px' }}>
          <SankeyConfigurationMenu
            nav_item_active={nav_item_active}
            accordion_ref={accordion_ref}
            configuration_menus={configurations_menus} />
        </Offcanvas.Body>
      </Offcanvas>
        : <></>}

      {!data.static_sankey ? (
        <ToggleButton style={{ 'width':'40px',height:'120px', position:'fixed',top:window.innerHeight/2,left:window.innerWidth-40-((show_nav)?540+has_scrollbar_shift:has_scrollbar_shift),zIndex:100 }}
          ref={button_ref as Ref<HTMLLabelElement>}
          id="toggle-check"
          type="checkbox"
          variant="outline-primary"
          checked={show_nav}
          onChange={(e) => { setChecked(e.currentTarget.checked)}}
          onClick={toggleShow}
          value="menuConfigButton">{menuButton()}
        </ToggleButton>
      ) : (<></>)
      }

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

    </>
  )
}

Menu.propTypes = MenuPropTypes

export default Menu

export //Modal for shortcut
const OpenSankeyModalShortcut = (t:TFunction,
  showShortcut:boolean,
  setshowShortcut:React.Dispatch<React.SetStateAction<boolean>>,
  additional_shortcut_item:JSX.Element[]
)=>{
  return <Modal size={'lg'} show={showShortcut} onHide={() => setshowShortcut(false)}>
    <Modal.Header closeButton>
      <Modal.Title>{t('Menu.rc')}</Modal.Title>
    </Modal.Header>
    <Modal.Body >
      <h4 style={{textAlign:'center'}}>Raccourcis de l'application OpenSankey</h4>

      <h5>Avec la souris en mode sélection :</h5>
      <p><b>Click (noeuds) :</b> Sélectionne le noeud cliqué</p>
      <p><b>CTRL + Click (noeuds) :</b> Sélectionne le noeud cliqué et ouvre l'onglet "<b>Noeuds</b>" du menu</p>
      <p><b>Click (flux) :</b> Sélectionne le flux cliqué</p>
      <p><b>CTRL + Click (flux) :</b> Sélectionne le flux cliqué et ouvre l'onglet "<b>Flux</b>" du menu</p>
      <p><b>Click (en dehors d'un noeud/flux) :</b>  Désélectionne les noeuds et flux sélectionnés</p>
      <p><b>Click droit (noeuds) :</b>  Agrége le noeud</p>
      <p><b>Alt Click droit (noeuds) :</b>  Désagrége le noeud</p>
      <p><b>Alt + Drag (label noeuds) :</b>  Déplace le label</p>
      <p><b>Shift + survole (noeuds) :</b>  Affiche la valeur des flux entrant et sortant du noeud dans une tooltip</p>
      <p><b>Shift + survole (flux) :</b>  Affiche la valeur du flux dans une tooltip </p>

      <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

      <h5>Avec la souris en mode édition :</h5>
      <p><b>Click (zone de dessin) :</b> Ajoute un noeud à l'endroit cliqué</p>
      <p><b>Drag (à partir de la zone de dessin) :</b> Crée un noeud au point de départ du drag puis crée un flux partir du noeud crée vers : soit un noeud déjà existant si l'on drop dessus, soit crée un noeud si l'on drop sur la zone de dessin </p>
      <p><b>Drag (à partir d'un noeud) :</b> Créer un flux partir du  noeud de départ du drag vers : soit un noeud déjà existant si l'on drop dessus, soit crée un noeud si l'on drop sur la zone de dessin  </p>

      <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

      <h5>Autres raccourcis :</h5>
      <p><b>Suppr :</b> Supprime les noeuds et flux sélectionnés</p>
      <p><b>Flèche du clavier :</b> Permet de déplacer les noeuds sélectionnés en fonction du grillage  </p>
      <p><b>Drag (bouton du milieu de la souris et en dehors d'un noeud/flux)</b> Permet de déplacer le sankey complet  </p>

      <p><b>Echap :</b> Ferme le Menu si il est ouvert et remet la fonction de la souris en tant que sélecteur </p>

      {additional_shortcut_item}

    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={() => setshowShortcut(false)}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>
}

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
  logo_OS:string,
  logo_OSP:string,
  logo_OSS:string,
)=>{





  const content_rc=<>
    <h4 style={{textAlign:'center'}}>Raccourcis de l'application OpenSankey</h4>

    <h5>Avec la souris en mode sélection :</h5>
    <p><b>Click (noeuds) :</b> Sélectionne le noeud cliqué</p>
    <p><b>CTRL + Click (noeuds) :</b> Sélectionne le noeud cliqué et ouvre l'onglet "<b>Noeuds</b>" du menu</p>
    <p><b>Click (flux) :</b> Sélectionne le flux cliqué</p>
    <p><b>CTRL + Click (flux) :</b> Sélectionne le flux cliqué et ouvre l'onglet "<b>Flux</b>" du menu</p>
    <p><b>Click (en dehors d'un noeud/flux) :</b>  Désélectionne les noeuds et flux sélectionnés</p>
    <p><b>Click droit (noeuds) :</b>  Agrége le noeud</p>
    <p><b>Alt Click droit (noeuds) :</b>  Désagrége le noeud</p>
    <p><b>Alt Drag (label noeuds) :</b>  Déplace le label</p>

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

    <h5>Avec la souris en mode édition :</h5>
    <p><b>Click (zone de dessin) :</b> Ajoute un noeud à l'endroit cliqué</p>
    <p><b>Drag (à partir de la zone de dessin) :</b> Crée un noeud au point de départ du drag puis crée un flux à partir du noeud crée vers : soit un noeud déjà existant si l'on drop dessus, soit un noeud que l'on crée à l'endroit où l'on drop sur la zone de dessin</p>
    <p><b>Drag (à partir d'un noeud) :</b> Créer un flux à partir du  noeud de départ du drag vers : soit un noeud déjà existant si l'on drop dessus, soit un noeud que l'on crée à l'endroit où l'on drop sur la zone de dessin  </p>

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

    <h5>Autres raccourcis :</h5>
    <p><b>Suppr :</b> Supprime les noeuds et flux sélectionnés</p>
    <p><b>Flèche du clavier :</b> Permet de déplacer les noeuds sélectionnés en fonction du grillage  </p>
    <p><b>Drag (bouton du milieu de la souris et en dehors d'un noeud/flux)</b> Permet de déplacer le sankey complet  </p>

    <p><b>Echap :</b> Ferme le Menu quand il est ouvert et remet la fonction de la souris en tant que sélecteur </p>

    {additional_shortcut_item}

  </>
  external_content['rc']=content_rc

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


  

  const content_licence=<>
    <Row>
      <Col xs={3}><img src={logo_OS} style={{'objectFit':'contain','width':'250px'}} /></Col><Col>{t('Menu.presentation_OS')}<Button>{t('desire_to_know_more')}</Button></Col>
    </Row>

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }} />

    <Row>
      <Col>{t('Menu.presentation_OSP')}
        <Button href="https://terriflux.com/downloads/open-sankey-plus/" target="_blank" rel="noopener noreferrer">
          {t('desire_to_know_more')}
        </Button></Col>
      <Col xs={3}><img src={logo_OSP} style={{'objectFit':'contain','width':'250px'}} /></Col>
    </Row>

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }} />

    <Row>
      <Col xs={3}><img src={logo_OSS} style={{'objectFit':'contain','width':'250px'}} /></Col><Col>{t('Menu.presentation_OSS')}
        <Button href="https://terriflux.com/downloads/sankey-suite/" target="_blank" rel="noopener noreferrer">
          {t('desire_to_know_more')}
        </Button></Col>
    </Row>
  </>

  external_content['licence']=content_licence


  return <Modal scrollable size='xl' show={show_modal_welcome && !never_see_again} onHide={()=>{
    set_show_modal_welcome(false)
  }}>
    <Modal.Header closeButton>
      <Modal.Title>{t('welcome.welcome')}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {external_content[active_page]}
    </Modal.Body>

    {window.SankeyToolsStatic ? <></> : <Modal.Footer style={{justifyContent:'center'}}>
      <Pagination >
        {external_pagination.map((c,i)=>{return <React.Fragment key={i}>{c}</React.Fragment>})}

        <Pagination.Item active={active_page==='rc'} key={'rc'} onClick={()=>{
          set_active_page('rc')
        }}>
          {t('Menu.rc')}
        </Pagination.Item>
        <Pagination.Item active={active_page==='licence'} key={'licence'} onClick={()=>{
          set_active_page('licence')
        }}>
          {t('Menu.licence')}
        </Pagination.Item>
      </Pagination>
      <FormCheck type='checkbox' label={t('dontSeeAgain')} checked={never_see_again} onChange={evt=>{
        set_never_see_again(evt.target.checked)
        localStorage.setItem('dontSeeAggainWelcome','1')
      }}/>
    </Modal.Footer>}
  </Modal>
}
