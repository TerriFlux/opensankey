import React, { FunctionComponent, useState } from 'react'
import { Row, Col, Form, FormLabel, Modal, Button, ButtonGroup, Tabs, Tab, FormGroup, OverlayTrigger, Tooltip,FormCheck,Popover, FormControl } from 'react-bootstrap'
import { SankeyDataPropTypes, SankeyData, TagsGroup, TagsCatalog,SankeyLink } from './types'
import PropTypes, { InferProps } from 'prop-types'
import { MultiSelect } from 'react-multi-select-component'
import parse, { DOMNode } from 'html-react-parser'
import { Element } from 'domhandler/lib/node'
import { convert_data } from './SankeyConvert'
import { findMaxLinkValue, set_nodes_level } from './SankeyUtils'
import * as d3 from 'd3'
// import { FaNotesMedical } from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShareNodes, faArrowPointer,faMaximize,faFilter,faCodeBranch,faFolderTree, faDiagramProject,faAngleDoubleUp,faAngleDoubleDown } from '@fortawesome/free-solid-svg-icons'
import { selected_type } from './SankeyMenu'
import { TFunction } from 'i18next'
import { FaBackward, FaForward, FaPlay } from 'react-icons/fa'
// import { FaPlay, FaForward, FaBackward} from 'react-icons/fa'

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
export const addAllDropDownFlux = (fluxTags: TagsCatalog, data: SankeyData, set_data: (data: SankeyData) => void) => {
  const banner_grouptag = Object.values(fluxTags).filter(tags_group => { return ((tags_group as TagsGroup).banner == 'one' || (tags_group as TagsGroup).banner == 'multi') })
  const allDD = banner_grouptag.map(tags_group => {
    const the_tags_group = tags_group as TagsGroup
    const tags_selected=Object.entries(data['fluxTags']).filter((k)=>{return k[1]==the_tags_group})[0]

    if (the_tags_group.banner == 'one') {
      return (
        <>
          <Row><Col><FormLabel>{the_tags_group.group_name}</FormLabel></Col><Col></Col></Row>
          <Row>
            <Col xs={10}>
              {<Form.Select key={the_tags_group.group_name} placeholder='all' onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => { handleSimpleDropdown(evt, the_tags_group, data, set_data) }}>{
                Object.entries(the_tags_group.tags).map(([tag_key, tag],i) => {
                  return (<option key={i} value={tag_key}>{tag.name}</option>)
                })}
              </Form.Select>}
            </Col>
            <Col xs={2}>
              <FormCheck inline
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
            </Col>
          </Row>

        </>)
    } else if (the_tags_group.banner == 'multi') {
      const options = Object.entries(the_tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      const selected = Object.entries(the_tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      return (<>
        <Row>
          <Col><FormLabel>{the_tags_group.group_name}</FormLabel></Col>
          <Col></Col>
        </Row>
        <Row>
          
          <Col><MultiSelect
            style={{ color: 'black' }}
            valueRenderer={(selected: selected_type[]) => {
              return selected.length ? selected.map(({ label }) => label + ', ') : 'Aucun tag sélectionné'
            }}
            labelledBy={'hello'}
            overrideStrings={{
              'selectAll': 'Tout sélectionner',
            }}
            // hasSelectAll={false}
            value={selected}
            options={options}
            onChange={(selected: [{ label: string, value: string }]) => {
              handleMultiDropdown(selected, the_tags_group, data, set_data)
            }} /></Col>

          <Col><FormCheck inline
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
          /></Col>
        </Row></>)
    }
  })
  return (<><Form.Group  as={Row} className='FormForFilterFlux'><Row><Col xs={6}>Liste groupe étiquette</Col><Col xs={6}>Appliquer couleur filtre</Col></Row>{allDD}</Form.Group></>) 
}

/**
 * Define SankeyMenuBanner element
 *
 * @type {{ data: any; set_data: any; additional_selector: any; mode_selection: any; set_mode_selection: any; mode_visualisation: any; set_current_filter: any; url_prefix: any; }}
 */
const SankeyMenuBannerPropTypes = {
  t:PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  additional_selector: PropTypes.element,
  mode_selection: PropTypes.string.isRequired,
  set_mode_selection: PropTypes.func.isRequired,
  set_current_filter: PropTypes.func.isRequired,
  url_prefix: PropTypes.string.isRequired,
  view:PropTypes.string.isRequired

}
type SankeyMenuBannerTypes = InferProps<typeof SankeyMenuBannerPropTypes>

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

export const SankeyBannerRows = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  diagram:string,
  set_diagram:(s:string)=>void,
  diagram2:string,
  set_diagram2:(s:string)=>void,
  sous_filieres:{ [key: string]: string } | undefined,
  is_split:boolean,diagrams:{ [keys :string] : string[] }
) => { 
  // let sous_filieres = undefined
  // if (window.sankey && window.sankey.sous_filieres) {
  //   sous_filieres = window.sankey.sous_filieres
  // }
  // let is_split = false
  // const diagrams : { [keys :string] : string[] } = {}
  // if ( sous_filieres ) {
  //   is_split = Object.keys(sous_filieres)[0].includes('/')
  //   if (is_split ) {
  //     Object.keys(sous_filieres).forEach(s=> {
  //       const path = s.split('/')
  //       if ( !(path[0] in diagrams)) {
  //         diagrams[path[0]] = [path[1]]
  //       } else {
  //         diagrams[path[0]].push(path[1])     
  //       }
  //     })
  //   } else {
  //     Object.keys(sous_filieres).forEach(s=>diagrams[s]=[s])
  //   }
  // }
  
  const diagram_label = 'Diagrammes'
  const setDiagram = (the_diagram : string) => {

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
    new_data.fit_screen = true
    d3.select(' .opensankey #svg').on('.zoom', null)
    set_data({ ...new_data })
    
  }
  return [
    (data.static_sankey && sous_filieres && !is_split) ? (<>
      <Form.Group as={Col} style={{ marginLeft: '10px' }} lg="auto">
        <FormLabel className="text-center" style={{justifyContent: 'center'}}  ><b>{diagram_label}</b></FormLabel>
        <Form.Select style={{ width: '200px', color:'black' }}
          onChange={evt=> {
            set_diagram(evt.target.value)
            setDiagram(evt.target.value)
          }}
          value={diagram}>
          {Object.keys(sous_filieres).map((name, i) => <option key={i} value={name} >{name}</option>)}
        </Form.Select>
      </Form.Group></>) : (<></>)
    ,
    (data.static_sankey && sous_filieres && is_split) ? (<>
      <Form.Group as={Col} style={{ marginLeft: '10px' }} lg="auto">
        <FormLabel className="text-center" style={{justifyContent: 'center'}}  ><b>{diagram_label}</b></FormLabel>
        <Form.Select style={{ width: '200px', color:'black' }}
          onChange={(evt:React.ChangeEvent<HTMLSelectElement>)=>{
            set_diagram(evt.target.value)
            const diagram_path = evt.target.value+'/'+diagrams[evt.target.value][0]
            setDiagram(diagram_path)
          }}
          value={diagram}>
          {Object.keys(diagrams).map((name, i) => <option key={i} value={name} >{name}</option>)}
        </Form.Select>
        {is_split ? 
          (<Form.Select style={{ width: '200px', color:'black' }}
            onChange={(evt:React.ChangeEvent<HTMLSelectElement>) => {
              set_diagram2(evt.target.value)
              const diagram_path = diagram+'/'+evt.target.value
              setDiagram(diagram_path)

            }}
            value={diagram2}>
            {diagrams[diagram] ? (Object.values(diagrams[diagram]).map((name, i) => <option key={i} value={name} >{name}</option>)):(<></>)}
          </Form.Select>) :(<></>)
        }
      </Form.Group></>) : (<></>),
    //data.static_sankey && sous_filieres && additional_selector ? (<></>) : (<Col></Col>),
    window.sankey && window.sankey.excel ? (
      <Form.Group as={Col} lg="auto" >
        <FormLabel className="text-center" >{t('Banner.tl')}</FormLabel>
        <Button href={window.sankey.excel}>{t('Banner.rslt')}</Button>
      </Form.Group>) : (<></>)
  ]
}


/**
 * Variable containing the edition row that handle filter and the mouse behavior on the sankey draw zone
 *
 * @param {{ data: any; set_data: any; mode_selection: any; set_mode_selection: any; mode_visualisation: any; set_current_filter: any; url_prefix: any; }} { data, set_data, additional_selector, mode_selection, set_mode_selection,mode_visualisation,set_current_filter,url_prefix }
 * @returns
 */
export const OpenSankeyMenuBanner = (
  t:TFunction,
  data:SankeyData,
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  mode_selection:string, 
  set_mode_selection:React.Dispatch<React.SetStateAction<string>>,
  set_current_filter:(n:number)=>void,
  url_prefix:string,

)=>{
  const { nodeTags, fluxTags, dataTags } = data
  const [show_readme, set_show_readme] = useState(false)
  const {filter}=data.display_style
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
  let max_link_value = 0
  Object.values(data.links).forEach(link => {
    const new_max_link_value = findMaxLinkValue(
      max_link_value,
      link.value
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })
  max_link_value += 1

  const default_horiz_shift = 50

  /**
   * Search the lowest visual element of the sankey to reajust the draw zone
   *
   * @returns {number[]}
   */
  const min_width_and_height = () => {
    let height = 0
    let width = 0
    Object.values(data.nodes).filter(n => n.node_visible).forEach(n => {
      height = (n.y && n.node_visible) ? Math.max(height, n.y) : height
      width = (n.x && n.node_visible) ? Math.max(width, n.x) : width
    })

    Object.values(data.labels).forEach(n => {
      height = (n.y) ? Math.max(height, n.y) : height
      width = (n.x ) ? Math.max(width, n.x) : width
    })

    height = height + 200
    width = width + 200
    Object.values(data.links).forEach(l => {
      if (l.recycling) {
        height = (l.vert_shift && data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible) ? Math.max(data.nodes[l.idSource].y + l.vert_shift + 100, data.nodes[l.idTarget].y + l.vert_shift + 100, height) : height
      }
    })

    Object.values(data.links).forEach(l => {
      if (l.recycling) {
        width = (data.nodes[l.idTarget].x && data.nodes[l.idTarget].node_visible && l.right_horiz_shift) ? Math.max(width, data.nodes[l.idSource].x + l.right_horiz_shift + default_horiz_shift + 150) : width
      }
    })
    return [Math.max(width, window.innerWidth - 40), Math.max(height, window.innerHeight - 40)]
  }



  const addAllDropDownNode = (level:boolean) => {
    let banner_grouptag = Object.entries(nodeTags).filter(([, tags_group]) => tags_group.banner !== 'none' && tags_group.banner !== 'level')
    if (level) {
      banner_grouptag = Object.entries(nodeTags).filter(([, tags_group]) => tags_group.banner === 'level' && Object.keys(tags_group.tags).length > 1)
    }
    const allDD = banner_grouptag.map(([, tags_group]) => {
      const tags_selected=Object.entries(data['nodeTags']).filter((k)=>{return k[1]==tags_group})[0]

      if (tags_group.banner == 'one' ) {
        return (
          <>
            <Row>
              <Col>
                <FormLabel style={{ color: color }}>{tags_group.group_name}
                </FormLabel></Col>
              <Col></Col>
            </Row>
            <Row >
              <Col>
                {<Form.Select style={{ width: '200px', color: 'black' }} key={tags_group.group_name} placeholder='all' onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => { handleSimpleDropdown(evt, tags_group, data, set_data) }}>{
                  Object.entries(tags_group.tags).map(([tag_key, tag],i) => {
                    return (<option key={i} value={tag_key}>{tag.name}</option>)
                  })}
                </Form.Select>}
              </Col>
              <Col>
                <FormCheck inline
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
              </Col>
            </Row>
          </>)
      } else if (tags_group.banner === 'level' && Object.values(tags_group.tags).length > 0) {
        if (Object.keys(tags_group.tags).length < 2) {
          return <></>
        }
        const tmp = Object.entries(tags_group.tags).filter(tag=>tag[1].selected)
        const selected = tmp.length > 0 ? tmp[0][0] : ''
        return (
          <>
            {banner_grouptag.length > 1 ? <FormLabel style={{ color: color }}>{tags_group.group_name}</FormLabel> : <></>}
            <FormGroup as={Row}>
              <Col xs={10}>
                {<Form.Select style={{ width: '200px', color: 'black' }} key={tags_group.group_name} value={selected} placeholder='all' onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => { handleSimpleDropdown(evt, tags_group, data, set_data) }}>{
                  Object.entries(tags_group.tags).map(([tag_key, tag],i) => {
                    return (<option key={i} value={tag_key}>{tag.name}</option>)
                  })}
                </Form.Select>}
              </Col>
              <Col xs={2}>
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
              </Col>
            </FormGroup>
          </>)
      } else if (tags_group.banner == 'multi') {
        const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
        const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })

        return (
          <>
            <Row>
              <Col>
                <FormLabel style={{ color: color }}>{tags_group.group_name}
                </FormLabel>
              </Col>
              <Col></Col>
            </Row>
            <Row >
              <Col>
                <MultiSelect
                  style={{ color: 'black' }}
                  valueRenderer={(selected:selected_type[]) => {
                    return selected.length ? selected.map(({ label }) => label + ', ') : 'Aucun tag sélectionné'
                  }}
                  labelledBy={'hello'}
                  overrideStrings={{
                    'selectAll': 'Tout sélectionner',
                  }}
                  // hasSelectAll={false}
                  value={selected}
                  options={options}
                  onChange={(selected: [{ label: string, value: string }]) => {
                    handleMultiDropdown(selected, tags_group, data, set_data)
                  }} />
              </Col>
              <Col>
                <FormCheck inline
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
              </Col>
            </Row>
          </>)
      }


    })
    return (<><Form.Group  as={Row} className='FormForFilterNode'><Row><Col xs={6}>Liste groupe étiquette</Col><Col xs={6}>Appliquer couleur filtre</Col></Row>{allDD}</Form.Group></>) 
    
    
  }
  // Function that return a simple or multiple dropdown of groupTag of data and links
  // This allow us to choose wich grouptag to select and wich tag of these group to display
  const addAllDropDownLinks = () => {
    const banner_grouptag = Object.entries(dataTags).filter(([, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi') })
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
      } else if (tags_group.banner == 'multi') {
        const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
        const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name ,'disabled':((selected.length<2 && tag[1].name==selected[0].label))} })
        return (
          <>
            <FormLabel>{tags_group.group_name}</FormLabel>
            <MultiSelect
              style={{ color: 'black' }}
              labelledBy={'hello'}
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



        }else{
          recursionDataTag(DT,ind+1,n_suffix,link_to_copy,new_links)
        }
        
      })
  }
  const [show_banner, set_show_banner] = useState(true)
  const [user_scale, set_user_scale] = useState(data.user_scale)
  const marginTop = data.static_sankey ? '0px' : '0px'
  //const display_banner=Object.values(data.dataTags).filter(d=>d.banner!='none').length==0 &&Object.values(data.nodeTags).filter(d=>d.banner!='none').length==0
  // const banner_grouptag = Object.entries(dataTags).filter(([, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi' ) })
  const color = 'black'
  const backgroundColor = 'gainsboro'

  const opacity_advanced =  !window.SankeyToolsStatic ? '0.3' : '0'
  const level_filter = Object.entries(nodeTags).filter(([, v]) => v.banner === 'level').length > 0
  const node_filter = Object.entries(nodeTags).filter(([, v]) => v.banner !== 'none' && v.banner !== 'level').length > 0
  const flux_filter = Object.entries(fluxTags).filter(([, v]) => v.banner !== 'none').length > 0

  /**
   * Change the mouse behavior
   *
   * @param {string} val
   */
  const setSelectionMode = (val: string) => {
    set_mode_selection(val)
  }

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

  //Popover element to handle node levels (aggregation)
  const detail_level=
  <Popover id='popover-details-level' style={{maxWidth:'100%'}}>
    <Popover.Header as="h3">{t('Banner.ndd')}</Popover.Header>
    <Popover.Body style={{  marginLeft: '5px', width: '350px' }}>
      {(Object.entries(nodeTags).filter(([, v]) => v.banner === 'level').length > 0) ? (<>
        {addAllDropDownNode(true)}</>
      ) : (<>
        <Form.Control placeholder="Pas de filtrage" style={{ opacity: opacity_advanced, color: '#6c757d' }} disabled /></>)}          
    </Popover.Body>
  </Popover>

  //Popover element to handle node tags
  // Its a list of dropdown for each groupNodeTag where we can choose wiche group to apply and wiche tag from these group to display when selected
  const filter_color_node=
  <Popover id='tooltip-link-color-filter' style={{maxWidth:'100%'}}>
    <Popover.Header as="h3">{t('Banner.fdn')}</Popover.Header>
    <Popover.Body style={{  marginLeft: '5px', width: '450px' }}>

      { (Object.entries(nodeTags).filter(([, v]) => v.banner !== 'none').length > 0) ? (<>
        {addAllDropDownNode(false)}</>
      ) : (<>
        <Form.Control placeholder="Pas de filtrage" style={{ opacity: opacity_advanced, color: '#6c757d' }} disabled /></>)
      }
         
    </Popover.Body>
  </Popover>
  //Popover element to handle the display of link tags 
  const filter_color_link=
  <Popover id='tooltip-node-color-filter' style={{maxWidth:'100%'}}>
    <Popover.Header as="h3">{t('Banner.fdf')}</Popover.Header>
    <Popover.Body style={{  marginLeft: '5px', width: '450px' }}>

      {addAllDropDownFlux(data.fluxTags, data, set_data)}
        
    </Popover.Body>
  </Popover>
  const DT_length=Object.keys(data.dataTags).length
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
          <FormCheck type='switch'
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
            <option key='free'       value='free'      >Données réconciliées+flux indéterminées</option>
          </Form.Select>
        </Col>
      </FormGroup>           
    </Popover.Body>
  </Popover>

  // Compute height of edition element to shift the sankey draw zone below
  const elementNavBar=document.getElementsByClassName('bg-light')[0]
  const elementHerowrap=document.getElementsByClassName('herowrap')[0]

  const height_Herowrap=(elementHerowrap)?elementHerowrap.getBoundingClientRect().height:0

  const height_navbar=(elementNavBar)?elementNavBar.getBoundingClientRect().height:0
  let height_navbarAndHerowrap=(elementNavBar )?(elementNavBar.getBoundingClientRect().height+height_Herowrap):0
  if ( window.SankeyToolsStatic) {
    height_navbarAndHerowrap = 0
  }

  // let sous_filieres = undefined
  // if (window.sankey && window.sankey.sous_filieres) {
  //   sous_filieres = window.sankey.sous_filieres
  // }

  const ui={
    'herowrap':<div className='herowrap'
    style={{
      color: color,
      backgroundColor: backgroundColor,
      marginLeft: '0',
      marginTop: height_navbar,
      paddingBottom: '3px',
      alignItems: 'baseline',
      display: ((!(sous_filieres)) && !(window.sankey && window.sankey.excel))?'none':'block'
    }}>
    {/* This div contain a dropdown for selecting a diagram */}
    {
      show_banner?
        (<><Row style={{ marginTop: marginTop, paddingBottom: '5px', paddingTop: '5px', alignItems: 'baseline' }}>
          {SankeyBannerRows(t,data,set_data,diagram,set_diagram,diagram2,set_diagram2,sous_filieres,is_split,diagrams)}
        </Row>
        <Row>
          <Col className='text-end'>
            <Button variant='success' size='sm'
              onClick={()=>{
                set_show_banner(false)
              }}
            >
              <FontAwesomeIcon icon={faAngleDoubleUp} />
            </Button>
          </Col>
        </Row></>)
        :
        <Row>
          <Col className='text-end'>
            <FormGroup as={Col}>
              <Button variant='outline-success' size='sm'
                onClick={()=>{
                  set_show_banner(true)
                }}
              >
                <FontAwesomeIcon icon={faAngleDoubleDown} />
              </Button>
            </FormGroup>
          </Col>
        </Row>
    } 
    
      </div>,
    
    'toolbar':<Row className='sankey-toolbar' style={{'marginTop':height_navbarAndHerowrap}}>
    {/* {(view!=='none')? <Col>
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
    </Col>: }*/
      <Col>
        <FormGroup as={Col} lg='auto'>
          <ButtonGroup >

            {//Boutons Sélection classique des éléments 
            }
            <OverlayTrigger
              key={'tooltip-selection'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'tooltip-selection'}>{t('Banner.tooltipSelection')} </Tooltip>
              }
            >
              <Button  variant={(!(mode_selection == 's')) ? 'outline-info' : 'info'} onClick={() => { setSelectionMode('s') }} >
                <FontAwesomeIcon icon={faArrowPointer} />
              </Button>
            </OverlayTrigger>



            <OverlayTrigger
              key={'tooltip-liaison'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'tooltip-liason'}>{t('Banner.tooltipLiason')} </Tooltip>
              }
            >
              <Button variant={(!(mode_selection == 'ln')) ? 'outline-secondary' : 'secondary'} onClick={() => { setSelectionMode('ln') }} >
                {/* Ajout liaison entre noeud */}

                <FontAwesomeIcon icon={faShareNodes} />
              </Button>
            </OverlayTrigger>
          </ButtonGroup>
        </FormGroup>
      </Col>
    }

    <Col className='text-end'>

      <FormGroup as={Col} lg='auto'>
        <ButtonGroup >


          {(node_filter)?
            <OverlayTrigger
              key={'tooltip-link-color-filter'}
              placement={'left'}
              trigger={'click'}
              rootClose
              overlay={filter_color_node}
              
            >
              <Button variant='primary' id='button-link-color-filter' >
                Filtre Noeuds
              </Button>
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
              overlay={filter_color_link}
            >
              <Button variant='secondary' id='button-node-color-filter' >
                Filtre Flux
              </Button>
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
              overlay={filter_data}
            >
              <Button variant='dark' id='button-data-filter' >
                {Object.entries(data.dataTags).map(v=>{
                  if(Object.values(v[1].tags).filter(vv=>vv.selected).length==1){
                    return v[1].group_name+' : '+Object.values(v[1].tags).filter(vv=>vv.selected)[0].name
                  }else{
                    return v[1].group_name+' ['+Object.values(v[1].tags).filter(vv=>vv.selected).length+']'
                  }
                }).join('/')}
              </Button>
            </OverlayTrigger>
            :
            <></>
          }


          {(level_filter)?
            <OverlayTrigger
              key={'tooltip-details-level'}
              placement={'left'}
              trigger={'click'}
              rootClose
              overlay={detail_level}
            >
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
            overlay={link_filter}
          >
            <Button variant='danger' id='button-filter-link' >
              <FontAwesomeIcon icon={faFilter} />
            </Button>
          </OverlayTrigger>


          <OverlayTrigger
            key={'tooltip-adjust'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'tooltip-adjust'}>{t('Banner.tooltipAdjust')} </Tooltip>
            }
          >
            <Button variant='dark' onClick={() => { 
              data.fit_screen = true
              const zoomed=(transform:string)=> {
                [data.width, data.height] = min_width_and_height()
                  
                d3.select(' .opensankey #svg').attr('transform', transform)
                d3.select(' .opensankey #svg')
                  .style('border', Math.round(2 ) + 'px solid #78c2ad')
                  .style('width', data.width + 'px')
              }
              const zoom = d3.zoom()
                .scaleExtent([1, 40])
                .on('zoom', zoomed)
              zoom.scaleTo(d3.select(' .opensankey #svg'),1)
              set_data({ ...data })
            }} >
              <FontAwesomeIcon icon={faMaximize} />
            </Button>
          </OverlayTrigger>

          { url_prefix !== '' ?
            <OverlayTrigger
              key={'tooltip-structur'}
              placement={'left'}
              trigger={'click'}
              rootClose
              overlay={struc_data_reconciled}
            >
              <Button variant='success'>
                <FontAwesomeIcon icon={faDiagramProject} />
              </Button>
            </OverlayTrigger> : <OverlayTrigger
              key={'tooltip-structur'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'tooltip-structur'}>{t('Banner.tooltipStructure')} </Tooltip>
              }
            >
              <Button variant={(data.show_structure?'outline-success':'success')} onClick={() => { 
                data.show_structure = data.show_structure == 'reconciled' ? 'structure' : 'reconciled'
                //data.show_data = false
                set_data({ ...data })
              }} >
                <FontAwesomeIcon icon={faCodeBranch} />
              </Button>
            </OverlayTrigger>}

          <OverlayTrigger
            key={'tooltip-help'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'tooltip-help'}>{t('Banner.tooltipHelp')}</Tooltip>
            }
          >
            <Button variant='info' onClick={() => { set_show_readme(true) }} >
                ?
            </Button>
          </OverlayTrigger>

        </ButtonGroup>
      </FormGroup>
    </Col>


  </Row>,

    'modal_help':(window.sankey && window.sankey.help && Object.keys(window.sankey.help).length > 0) ? (
      <Modal
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          'color': 'black'
        }}
        size="lg"
        show={show_readme}
        onHide={() => set_show_readme(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Aide</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col>
              <Tabs defaultActiveKey={Object.keys(window.sankey.help)[0]} id="diagram">
                {Object.keys(window.sankey.help).map(
                  (key, i) => (<Tab title={key} eventKey={key} key={i}>{
                    parse(window.sankey.help[key], {
                      replace: (domNode:DOMNode  ) => {
                        interface AFMSankeyData extends SankeyData { 
                          units_names : string[][],
                        }
                        const domElement: Element = domNode as unknown as Element
                        if (domElement.attribs && domElement.attribs.id === 'units') {
                          return <div>
                            {(data as AFMSankeyData).units_names.slice(2).map(
                              (units_desc, i) => { return (<p key={i} > <b>{units_desc[0]}</b> : {units_desc[1]} </p>) }
                            )}</div>
                        } else if (domElement.attribs && domElement.attribs.id === 'selectors') {
                          return <ul>
                            {Object.entries(nodeTags).filter(tags_group => tags_group[1].banner === 'multi' && tags_group[0] !== 'flux_types' && tags_group[0] !== 'Uncert').map(tags_group => { return (<li key={i} >{tags_group[1].group_name}</li>) })}
                          </ul>
                        }
                      }
                    })
                  }</Tab>))
                }
              </Tabs>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>) :
      (<Modal
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          'color': 'black'
        }}
        size="lg"
        show={show_readme}
        onHide={() => set_show_readme(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Aide</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col>
              <Tabs defaultActiveKey="diagram" id="diagram">
                <Tab eventKey="diagram" title="Diagramme">
                  <br></br>
                  <p>L&apos;épaisseur des flèches est proportionnelle aux flux.</p>
                  <p>Le diagramme peut être visualisé avec différents niveaux d&apos;agrégations en utilisant le sélecteur <b>Niveau de détail</b></p>
                  <p>Des filtres peuvent être utilisés pour n&apos;afficher que des parties du diagramme. Pour cela utiliser les selecteurs <b>
                    {Object.entries(nodeTags).filter(tags_group => tags_group[1].banner === 'multi' && tags_group[0] !== 'flux_types' && tags_group[0] !== 'Uncert').map(tags_group => { return ' ' + tags_group[1].group_name })}</b></p>
                  <p>Différents palettes de couleurs peuvent être utiliser pour colorer les noeuds et les flux en utilisant le sélecteur <b>Palette de Couleurs</b></p>
                  <p>La structure du diagramme (sans épaisseur de flux) peut être affiché en cochant <b>Structure du diagramme</b></p>
                  <p>Le diagramme peut être ajusté à l'écran en cochant <b>Ajuster à l'écran</b></p>
                  <p>Pour obtenir des informations sur chaque flux, appuyer sur <b>shift</b> et passer la souris sur le flux.</p>
                </Tab>
              </Tabs>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>)

  }


  return ui
}
// const SankeyMenuBanner: FunctionComponent<SankeyMenuBannerTypes> = ({  t,data, set_data, mode_selection, set_mode_selection,set_current_filter,url_prefix,view }) => {
  
// }

// SankeyMenuBanner.propTypes = SankeyMenuBannerPropTypes

// export default SankeyMenuBanner

