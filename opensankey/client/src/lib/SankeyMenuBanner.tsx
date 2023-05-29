import React, {  useState } from 'react'
import { Row, Col, Form, FormLabel, Button, ButtonGroup, FormGroup, OverlayTrigger, Tooltip, FormCheck, Popover, FormControl, Dropdown, DropdownButton } from 'react-bootstrap'
import {  SankeyData, TagsGroup, TagsCatalog,SankeyLink } from './types'
import { MultiSelect } from 'react-multi-select-component'
import { convert_data } from './SankeyConvert'
import { findMaxLinkValue, set_nodes_level,adjust_sankey_zone } from './SankeyUtils'
import * as d3 from 'd3'
// import { FaNotesMedical } from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShareNodes, faArrowPointer,faFilter,faCodeBranch,faFolderTree, faDiagramProject,faArrowsLeftRight,faArrowsUpDown } from '@fortawesome/free-solid-svg-icons'
import { selected_type } from './SankeyMenu'
import { TFunction } from 'i18next'

export const addSimpleLevelDropDown = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void
) => {
  const {nodeTags} = data
  if (Object.keys(nodeTags['Primaire'].tags).length < 2) {
    return <></>
  }
  const tmp = Object.entries(nodeTags['Primaire'].tags).filter(tag=>tag[1].selected)
  const selected = tmp.length > 0 ? tmp[0][0] : ''
  return (
    <>
      <tr>
        <td >
          {<Form.Select style={{ width: '200px', color: 'black' }} key={nodeTags['Primaire'].group_name} value={selected} placeholder='all' onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => { handleSimpleDropdown(evt, nodeTags['Primaire'], data, set_data) }}>{
            Object.entries(nodeTags['Primaire'].tags).map(([tag_key, tag],i) => {
              return (<option key={i} value={tag_key}>{tag.name}</option>)
            })}
          </Form.Select>}
        </td>
      </tr>
    </>)
  // return (<><tr><th >{t('Banner.ndd_lst')}</th></tr>{allDD}</>)
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
                      set_nodes_level(data)
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
    set_nodes_level(data)
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

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      sous_filieres: { [key: string]: string }
      help: { [key: string]: string }
      excel: string
      structure: boolean,
      advanced: boolean
    } & { [key: string]: SankeyData }
  }

export const setDiagram = (
  the_diagram : string,
  data : SankeyData,
  set_data : (d:SankeyData)=>void
) => {
  //const the_diagram = evt.target.value as string
  const sous_filieres = window.sankey.sous_filieres

  const new_data = JSON.parse(
    JSON.stringify(
      window.sankey[sous_filieres[the_diagram]]
    )
  ) as SankeyData
  //Object.assign(sankey_data, new_data)
  convert_data(new_data)
  new_data.static_sankey = true
  // if (!is_split) {
  //   set_diagram(the_diagram)
  // }

  Object.values(data.nodes).forEach(node => {
    node.node_visible = true
    node.display = true
  })
  set_nodes_level(data)
  // new_data.fit_screen = true
  d3.select(' .opensankey #svg').on('.zoom', null)
  set_data({ ...new_data })
}

export const toolbar_builder = (
  t:TFunction,
  data: SankeyData,
  set_data: (d:SankeyData)=>void,
  mode_selection:{current:string},
  user_scale:number,
  set_user_scale:(n:number)=>void,
  filter:number,
  set_current_filter:(n:number)=>void,
  detail_level: React.ReactElement,
  url_prefix: string,
  first_selected_node:object,
  set_first_selected_node:(o:object)=>void,
  min_width_and_height:(d:SankeyData)=>number[],
  setDiagram : (the_diagram : string,data : SankeyData,set_data : (d:SankeyData)=>void)=>void,
  set_show_modal_welcome:(b:boolean)=>void
) => {
  const opacity_advanced =  !window.SankeyToolsStatic ? '0.3' : '0'
  const level_filter = Object.entries(data.nodeTags).filter(([, v]) => v.banner === 'level').length > 0
  const node_filter = Object.entries(data.nodeTags).filter(([, v]) => v.banner !== 'none' && v.banner !== 'level').length > 0
  const flux_filter = Object.entries(data.fluxTags).filter(([, v]) => v.banner !== 'none').length > 0
  /**
   * Change the mouse behavior
   *
   * @param {string} val
   */
  const setSelectionMode = (val: string) => {
    mode_selection.current = val
    //- trigger update
    const tutu = filter
    set_current_filter(filter+1)
    set_current_filter(tutu)
    d3.selectAll(' .opensankey #svg #path-flux').remove()
    if(val=='s' && (Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0 || Object.keys(first_selected_node).length != 0)){
      data.nodes=Object.fromEntries(Object.entries(data.nodes).filter(n=>n[1].name!='node_tmp'))
      set_first_selected_node({})
    }
    // set_mode_selection(val)
  }
  let sous_filieres = undefined

  if (window.sankey && window.sankey.sous_filieres) {
    sous_filieres = window.sankey.sous_filieres
  }

  let is_split = false
  const diagrams : { [keys :string] : string[] } = {}

  if ( sous_filieres ) {
    is_split = Object.keys(sous_filieres)[0].includes('/')
    if (is_split ) {
      Object.keys(sous_filieres).forEach(s=> {
        const path = s.split('/')
        if ( !(path[0] in diagrams)) {
          diagrams[path[0]] = [path[1]]
        } else {
          diagrams[path[0]].push(path[1])
        }
      })
    } else {
      Object.keys(sous_filieres).forEach(s=>diagrams[s]=[s])
    }
  }

  const [diagram, set_diagram] = useState(Object.keys(diagrams).length > 0 ? Object.keys(diagrams)[0] : '')
  const [diagram2, set_diagram2] = useState(Object.keys(diagrams).length > 0 ? Object.values(diagrams)[0][0] : '')


  const diagram_label = 'Diagrammes'


  let max_link_value = 0

  Object.values(data.links).forEach(link => {
    const new_max_link_value = findMaxLinkValue(
      max_link_value,
      link.value
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })

  max_link_value += 1
  // Create the differents popover of tag filter  and link value filter
  //Popover element to handle filter on links, it contians :
  // - scale of link
  // - filter on link (if value of link is inferior to filter then the link is not displayed)
  // - filter on link label
  // - filter on null link (if link value is null (0), we can display it or not)
  const link_filter=
  <Popover id="popover-link-filter" style={{maxWidth:'100%'}}>
    <Popover.Header as="h3">{t('Banner.ff')}</Popover.Header>
    <Popover.Body >
      <Form style={{width:'600px'}}>
        <Form.Group as={Row} >
          <Col xs={3}>
            <FormLabel >{t('MEP.Echelle')}</FormLabel>
          </Col>
          <Col>
            <FormControl
              type="text"
              value={user_scale}
              onChange={evt => {
                set_user_scale(+evt.target.value)
              }}
              onBlur={() => {
                data.user_scale = user_scale
                set_data({ ...data })
              }}
            />
            <FormControl.Feedback />
            <Form.Text>    ({t('MEP.vp100')})</Form.Text>
          </Col>
        </Form.Group>
        <Form.Group as={Row} >
          <Col>
            <FormLabel >{t('Banner.filtre')}</FormLabel>
          </Col>
          <Col>
            <Form.Range
              min="0"
              max={max_link_value}
              value={filter}
              onChange={evt => set_current_filter(Number(evt.target.value))} />
          </Col>
          <Col>
            <FormControl
              size='sm'
              type='number'
              min={0}
              max={filter}
              value={filter}
              onChange={(evt)=>{
                let tmp=+evt.target.value
                if(tmp>max_link_value){
                  tmp=max_link_value
                }
                set_current_filter(tmp)
              }}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row} >
          <Col>
            <FormLabel>{t('Banner.fl')}</FormLabel>
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
          <Col>
            <FormControl
              size='sm'
              type='number'
              min={0}
              max={max_link_value}
              value={data.display_style.filter_label}
              onChange={(evt)=>{
                let tmp=+evt.target.value
                if(tmp>max_link_value){
                  tmp=max_link_value
                }
                data.display_style.filter_label = tmp
                set_data({...data})
              }}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row} >
          <Col>
            <FormLabel >{t('Banner.fn')}:</FormLabel>
          </Col>
          <Col >
            <FormCheck
              type='checkbox'
              label={t('Banner.visible')}
              onChange={evt => {
                data.display_style.null_flux = evt.target.checked
                set_data({ ...data })
              }}
            />
          </Col>
        </Form.Group>
      </Form>
    </Popover.Body>
  </Popover>
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

  let diagrams_element = <React.Fragment key={'1'}></React.Fragment>
  if (window.SankeyToolsStatic && sous_filieres && !is_split) {
    diagrams_element = 
    <Popover id='popover-diagram' style={{maxWidth:'100%'}}>
      <Popover.Header as="h3">{diagram_label}</Popover.Header>
      <Popover.Body>
        <Form.Group key={'1'} as={Col} style={{ marginLeft: '10px' }} lg="auto">
          <Form.Select style={{ width: '200px', color:'black' }}
            onChange={evt=> {
              set_diagram(evt.target.value)
              setDiagram(evt.target.value, data, set_data)
            }}
            value={diagram}>
            {Object.keys(sous_filieres).map((name, i) => <option key={i} value={name} >{name}</option>)}
          </Form.Select>
        </Form.Group>
      </Popover.Body>
    </Popover>
  }
  if (window.SankeyToolsStatic && sous_filieres && is_split) {
    diagrams_element =
      <Form.Group key={'2'} as={Col} style={{ marginLeft: '10px' }} lg="auto">
        <FormLabel className="text-center" style={{justifyContent: 'center'}}  ><b>{diagram_label}</b></FormLabel>
        <Form.Select style={{ width: '200px', color:'black' }}
          onChange={(evt:React.ChangeEvent<HTMLSelectElement>)=>{
            set_diagram(evt.target.value)
            const diagram_path = evt.target.value+'/'+diagrams[evt.target.value][0]
            setDiagram(diagram_path, data, set_data)
          }}
          value={diagram}>
          {Object.keys(diagrams).map((name, i) => <option key={i} value={name} >{name}</option>)}
        </Form.Select>
        {is_split ?
          (<Form.Select style={{ width: '200px', color:'black' }}
            onChange={(evt:React.ChangeEvent<HTMLSelectElement>) => {
              set_diagram2(evt.target.value)
              const diagram_path = diagram+'/'+evt.target.value
              setDiagram(diagram_path, data, set_data)
            }}
            value={diagram2}>
            {diagrams[diagram] ? (Object.values(diagrams[diagram]).map((name, i) => <option key={i} value={name} >{name}</option>)):(<React.Fragment></React.Fragment>)}
          </Form.Select>) :(<React.Fragment></React.Fragment>)
        }
      </Form.Group>
  }

  const excel_element = window.sankey && window.sankey.excel ? (
    <Form.Group key={'3'} as={Col} lg="auto" style={{marginRight:'10px'}} >
      <Button variant='link' href={window.sankey.excel}>{t('Banner.tl')}</Button>
    </Form.Group>) : (<React.Fragment key={'3'}></React.Fragment>)

  const struc_data_reconciled=
  <Popover id='popover-details-level' style={{maxWidth:'100%'}}>
    <Popover.Header as="h3">{t('Banner.sdr')}</Popover.Header>
    <Popover.Body>
      <FormGroup as={Row}>
        <Col xs={10}>
          <Form.Select
            style={{ width: '200px', color: 'black' }}
            placeholder='all'
            value={data.show_structure}
            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
              data.show_structure = evt.target.value
              set_data({...data})
            }}>
            <option key='structure'  value='structure' >Structure</option>
            <option key='data'       value='data'      >Données collectées</option>
            <option key='reconciled' value='reconciled'>Données réconciliées</option>
            <option key='free_interval' value='free_interval' >Données réconciliées+flux indéterminées (intervalles)</option>
            <option key='free_value' value='free_value' >Données réconciliées+flux indéterminées (valeurs)</option>
          </Form.Select>
        </Col>
      </FormGroup>
    </Popover.Body>
  </Popover>
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
  const ui = [
  ]
  if ((Object.keys(diagrams).length > 0)) {
    ui.push(
      <Col>
        <OverlayTrigger
          key={'tooltip-diagrams'}
          placement={'left'}
          trigger={'click'}
          rootClose
          overlay={diagrams_element}>
          <Button variant='dark' id='button-diagrams' >
            {'Diagramme: ' + diagram}
          </Button>
        </OverlayTrigger>
      </Col>)}
  if (window.sankey && window.sankey.excel) {
    ui.push(excel_element)
  }
  
  let mouse_mode_edition=<></>

  // Add button for the edition of the sankey
  if(!window.SankeyToolsStatic){
    mouse_mode_edition=
    <ButtonGroup as={Col} lg='auto'>
      {/* Boutons Sélection classique des éléments */}
      <OverlayTrigger
        key={'tooltip-selection'}
        placement={'bottom'}
        delay={500}
        overlay={<Tooltip id={'tooltip-selection'}>{t('Banner.tooltipSelection')} </Tooltip>}>
        <Button  variant={(!(mode_selection.current == 's')) ? 'outline-info' : 'info'} onClick={() => { setSelectionMode('s') }} >
          <FontAwesomeIcon icon={faArrowPointer} />
        </Button>
      </OverlayTrigger>
      <OverlayTrigger
        key={'tooltip-liaison'}
        placement={'right'}
        delay={500}
        overlay={<Tooltip id={'tooltip-liason'}>{t('Banner.tooltipLiason')} </Tooltip>}>
        <Button variant={(!(mode_selection.current == 'ln')) ? 'outline-secondary' : 'secondary'} onClick={() => { setSelectionMode('ln') }} >
          {/* Ajout liaison entre noeud */}
          <FontAwesomeIcon icon={faShareNodes}/>
        </Button>
      </OverlayTrigger>
    </ButtonGroup>

  }

  const item_dropdown_filter=<>
    {(node_filter)?
      <OverlayTrigger
        key={'tooltip-link-color-filter'}
        placement={'left'}
        trigger={'click'}
        rootClose
        overlay={filter_color_node}>
        <Dropdown.Item >
          {t('Menu.Noeuds')}
        </Dropdown.Item>
      </OverlayTrigger>
      :
      <></>
    }
  
    {(flux_filter)?
      <OverlayTrigger
        key={'tooltip-node-color-filter'}
        placement={'left'}
        trigger={'click'}
        rootClose
        overlay={filter_color_link}>
        <Dropdown.Item >{t('Menu.flux')}</Dropdown.Item>
      </OverlayTrigger>
    
      :
      <></>
    }
    {(Object.values(data.dataTags).length>0)?
      <OverlayTrigger
        key={'tooltip-data-filter'}
        placement={'left'}
        trigger={'click'}
        rootClose
        overlay={filter_data}>
        <Dropdown.Item>
          <>{t('Banner.data')}</>
        </Dropdown.Item>
      </OverlayTrigger>
      
      :
      <></>
    }
  </>


  ui.push(
    <FormGroup as={Col} lg='auto'>
      {mouse_mode_edition}
      {(node_filter || flux_filter || (Object.values(data.dataTags).length>0))?
        <DropdownButton autoClose={false} as={ButtonGroup} lg='auto' title={t('Banner.filter')}>
          {item_dropdown_filter}
        </DropdownButton>
        :<></>}
        
      <ButtonGroup as={Col} lg='auto' >

        {(level_filter)?<OverlayTrigger
          key={'tooltip-details-level'}
          placement={'left'}
          trigger={'click'}
          rootClose
          overlay={detail_level}>
          <Button variant='warning' id='button-details-level' >
            <FontAwesomeIcon icon={faFolderTree} />
          </Button>
        </OverlayTrigger>
          :
          <></>
        }
        <OverlayTrigger
          key={'tooltip-link-filter'}
          placement={'left'}
          trigger={'click'}
          rootClose
          overlay={link_filter}>
          <Button variant='danger' id='button-filter-link' >
            <FontAwesomeIcon icon={faFilter} />
          </Button>
        </OverlayTrigger>

        <OverlayTrigger
          key={'tooltip-adjust-h'}
          placement={'bottom'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust-h'}>{t('Banner.tooltipAdjust')} </Tooltip>}>
          <Button variant='dark' onClick={() => {adjust_sankey_zone(data,min_width_and_height)}} >
            <FontAwesomeIcon icon={faArrowsLeftRight} />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger
          key={'tooltip-adjust-v'}
          placement={'bottom'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust-v'}>{t('Banner.tooltipAdjust')} </Tooltip>}>
          <Button variant='dark' onClick={() => {adjust_sankey_zone(data,min_width_and_height,false,true)}} >
            <FontAwesomeIcon icon={faArrowsUpDown} />
          </Button>
        </OverlayTrigger>

        { url_prefix !== '' ?
          <OverlayTrigger
            key={'tooltip-structur'}
            placement={'left'}
            trigger={'click'}
            rootClose
            overlay={struc_data_reconciled}>
            <Button variant='success'>
              <FontAwesomeIcon icon={faDiagramProject} />
            </Button>
          </OverlayTrigger>
          :
          <OverlayTrigger
            key={'tooltip-structur'}
            placement={'bottom'}
            delay={500}
            overlay={<Tooltip id={'tooltip-structur'}>{t('Banner.tooltipStructure')} </Tooltip>}>
            <Button variant={(data.show_structure?'outline-success':'success')} onClick={() => {
              data.show_structure = data.show_structure == 'reconciled' ? 'structure' : 'reconciled'
              //data.show_data = false
              set_data({ ...data })
            }} >
              <FontAwesomeIcon icon={faCodeBranch} />
            </Button>
          </OverlayTrigger>}
          {window.SankeyToolsStatic ? <OverlayTrigger
                key={'tooltip-help'}
                placement={'bottom'}
                delay={500}
                overlay={<Tooltip id={'tooltip-help'}>{t('Banner.tooltipHelp')}</Tooltip>
                }
              >
                <Button variant='info' onClick={() => { set_show_modal_welcome(true) }} >
                    ?
                </Button>
              </OverlayTrigger> : <></>}
      </ButtonGroup>
    </FormGroup>
  )

  return ui
}

/**
 * Variable containing the edition row that handle filter and the mouse behavior on the sankey draw zone
 *
 * @param {{ data: any; set_data: any; mode_visualisation: any; set_current_filter: any; url_prefix: any; }}
 * @returns
 */
export const OpenSankeyMenuBanner = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  toolbar:JSX.Element[]
)=>{
  // Compute height of edition element to shift the sankey draw zone below
  //const elementNavBar=document.getElementsByClassName('bg-light')[0]
  // const elementHerowrap=document.getElementsByClassName('herowrap')[0]
  // const height_Herowrap=(elementHerowrap)?elementHerowrap.getBoundingClientRect().height:0
  //const height_navbar=(elementNavBar)?elementNavBar.getBoundingClientRect().height:0
  // if ( window.SankeyToolsStatic) {
  //   height_navbarAndHerowrap = 0
  // }
  const ui ={
    'toolbar': <>
      {toolbar.map((c:JSX.Element,i)=>{
        return <React.Fragment key={i}>{c}</React.Fragment>
      })}
    </>
  }
  return ui
}

