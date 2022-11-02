import React, { FunctionComponent, useState } from 'react'
import { Row, Col, Form, FormLabel, Modal, Button, ButtonGroup, Tabs, Tab, FormGroup, OverlayTrigger, Tooltip,FormCheck,Popover, FormControl } from 'react-bootstrap'
import { SankeyDataPropTypes, SankeyData, TagsGroup, TagsCatalog } from './types'
import PropTypes, { InferProps } from 'prop-types'
import { MultiSelect } from 'react-multi-select-component'
import parse, { DOMNode } from 'html-react-parser'
import { Element } from 'domhandler/lib/node'
import { convert_data } from './SankeyConvert'
import { set_nodes_level,findMaxLinkValue } from './SankeyUtils'
import * as d3 from 'd3'
// import { FaNotesMedical } from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShareNodes, faArrowPointer,faMaximize,faFilter,faCodeBranch,faAngleDoubleDown,faAngleDoubleUp } from '@fortawesome/free-solid-svg-icons'
import { selected_type } from './SankeyMenu'
import { agregation, desagregation } from './SankeyLayout'

const handleSimpleDropdown = (evt: React.ChangeEvent<HTMLSelectElement>, tags_group: TagsGroup, data: SankeyData, set_data: (data: SankeyData) => void) => {
  const val = evt.target.value
  Object.entries(tags_group.tags).forEach(tag => tag[1].selected = val === tag[0])
  set_data({ ...data })
}

const handleMultiDropdown = (selected: [{ label: string, value: string }], tags_group: TagsGroup, data: SankeyData, set_data: (data: SankeyData) => void) => {
  const tab_sel = selected.map((d) => {
    return d.value
  })
  Object.entries(tags_group.tags).forEach(tag => tag[1].selected = tab_sel.includes(tag[1].name))
  set_data({ ...data })
}

export const addAllDropDownFlux = (fluxTags: TagsCatalog, data: SankeyData, set_data: (data: SankeyData) => void) => {
  const banner_grouptag = Object.values(fluxTags).filter(tags_group => { return ((tags_group as TagsGroup).banner == 'one' || (tags_group as TagsGroup).banner == 'multi') })
  const allDD = banner_grouptag.map(tags_group => {
    const the_tags_group = tags_group as TagsGroup
    const tags_selected=Object.entries(data['fluxTags']).filter((k)=>{return k[1]==the_tags_group})[0]

    if (the_tags_group.banner == 'one') {
      return (
        <>
          <FormLabel>{the_tags_group.group_name}</FormLabel>
          <FormGroup as={Row}>
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
          </FormGroup>

        </>)
    } else if (the_tags_group.banner == 'multi') {
      const options = Object.entries(the_tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      const selected = Object.entries(the_tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      return (
        <>
          <FormLabel>{the_tags_group.group_name}</FormLabel>
          <FormGroup as={Row}>
            <Col xs={10}>
              <MultiSelect
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
                }} />
            </Col>
            <Col xs={2}>
              <FormCheck inline
                type='switch'
                checked={data.colorMap==tags_selected[0]}
                onChange={evt => {

                  Object.values(data.nodeTags).forEach(tags_group => tags_group.show_legend = false)  
                  Object.values(data.fluxTags).forEach(tags_group => tags_group.show_legend = false)  

    

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
            </Col>
          </FormGroup>
        </>)
    }
  })
  return allDD
}

const SankeyEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  additional_selector: PropTypes.element,
  mode_selection: PropTypes.string.isRequired,
  set_mode_selection: PropTypes.func.isRequired,
  mode_visualisation:PropTypes.bool.isRequired,
  set_current_filter: PropTypes.func.isRequired,

}
type SankeyEditionTypes = InferProps<typeof SankeyEditionPropTypes>

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

const SankeyEdition: FunctionComponent<SankeyEditionTypes> = ({ data, set_data, additional_selector, mode_selection, set_mode_selection,mode_visualisation,set_current_filter }) => {
  const { nodeTags, fluxTags, dataTags } = data
  const [show_readme, set_show_readme] = useState(false)  
  const {filter}=data.display_style
  let max_link_value = 0
  Object.values(data.links).forEach(link => {
    const new_max_link_value = findMaxLinkValue(
      max_link_value,
      link.value
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })
  max_link_value += 1

  const nb_agregation_level : {[key:string]: number } =  {}
  Object.values(data.agregation).forEach(dim => {
    nb_agregation_level[dim.dimension] = 0
    Object.values(data.nodes).forEach( n => 
      nb_agregation_level[dim.dimension]  = dim.dimension in n.dimensions && n.dimensions[dim.dimension].level as number > nb_agregation_level[dim.dimension] ? 
        n.dimensions[dim.dimension].level as number : nb_agregation_level[dim.dimension]
    )
  })
  let has_agregation = false
  Object.values(nb_agregation_level).forEach(nb_level => has_agregation = has_agregation || nb_level>1 )

  const addAllDropDownNode = () => {
    const banner_grouptag = Object.entries(nodeTags).filter(([, tags_group]) => tags_group.banner !== 'none')
    const allDD = banner_grouptag.map(([, tags_group]) => {
      const tags_selected=Object.entries(data['nodeTags']).filter((k)=>{return k[1]==tags_group})[0]

      if (tags_group.banner == 'one') {
        return (
          <>
            <FormLabel style={{ color: color }}>{tags_group.group_name}</FormLabel>
            <FormGroup as={Row}>
              <Col xs={10}>
                {<Form.Select style={{ width: '200px', color: 'black' }} key={tags_group.group_name} placeholder='all' onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => { handleSimpleDropdown(evt, tags_group, data, set_data) }}>{
                  Object.entries(tags_group.tags).map(([tag_key, tag],i) => {
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
            </FormGroup>
          </>)
      } else if (tags_group.banner == 'multi') {
        const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
        const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })

        return (
          <>
            <FormLabel style={{ color: color }}>{tags_group.group_name}</FormLabel>
            <FormGroup as={Row}>
              <Col xs={10}>
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
              <Col xs={2}>
                <FormCheck inline
                  type='switch'
                  checked={data.colorMap==tags_selected[0]}
                  onChange={evt => {
                    Object.values(data.nodeTags).forEach(tags_group => tags_group.show_legend = false)  
                    Object.values(data.fluxTags).forEach(tags_group => tags_group.show_legend = false)  

                    
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
            </FormGroup>
          </>)
      }


    })
    return allDD
  }
  const addAllDropDownLinks = () => {
    const banner_grouptag = Object.entries(dataTags).filter(([, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi') })
    const allDD = banner_grouptag.map(([, tags_group]) => {
      // if (tags_group.banner == 'one') {
      const selected = Object.entries(tags_group.tags).filter(([,v])=>v.selected)[0][0]
      return (
        <>
          <FormLabel>{tags_group.group_name}</FormLabel>
          <FormGroup as={Row}>
            <Col xs={10}>
              {<Form.Select key={tags_group.group_name} placeholder='all' value={selected} onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => { handleSimpleDropdown(evt, tags_group,data,set_data) }}>{
                Object.entries(tags_group.tags).map(([tag_key, tag],i) => {
                  return (<option key={i} value={tag_key} >{tag.name}</option>)
                })}
              </Form.Select>}
            </Col>
          </FormGroup>
        </>)
      // } else if (tags_group.banner == 'multi') {
      //   const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      //   const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      //   return (
      //     <>
      //       <FormLabel>{tags_group.group_name}</FormLabel>
      //       <MultiSelect
      //         style={{ color: 'black' }}
      //         labelledBy={'hello'}
      //         overrideStrings={{
      //           'selectAll': 'Tout sélectionner',
      //         }}
      //         value={selected}
      //         options={options}
      //         onChange={(selected: [{ label: string, value: string }]) => {
      //           handleMultiDropdown(selected, tags_group, data, set_data)
      //         }} />
      //     </>)
      // }


    })
    return allDD
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

  const setDiagram = (evt:React.ChangeEvent<HTMLSelectElement>) => {

    const the_diagram = evt.target.value as string
    const sous_filieres = window.sankey.sous_filieres
    const diagram_path = is_split ? diagram+'/'+the_diagram : the_diagram
    const new_data = JSON.parse(
      JSON.stringify(
        window.sankey[sous_filieres[diagram_path]]
      )
    ) as SankeyData
    //Object.assign(sankey_data, new_data)
    convert_data(new_data)
    new_data.static_sankey = true
    if (!is_split) {
      set_diagram(the_diagram)
    }
 
    Object.values(data.nodes).forEach(node => {
      node.node_visible = true
      node.display = true 
    })
    const selected_tags =  Object.values(data.nodeTags.Dimensions.tags).filter(tag=>tag.selected)
    selected_tags.forEach(tag=>set_nodes_level(data, data.nodes, data.agregation[tag.name].level, data.agregation[tag.name].dimension))
    selected_tags.forEach(tag=>
      Object.values(data.nodes).forEach(node => {
        const node_dim = node.dimensions[data.agregation[tag.name].dimension]
        if (node_dim ) {
          if (node_dim.level! == data.agregation[tag.name].level) {
            const children = Object.values(data.nodes).filter(child_node=> {
              return selected_tags.filter(tag2=> {
                const child_node_dim = child_node.dimensions[data.agregation[tag2.name].dimension]
                return child_node_dim && child_node_dim['parent_name'] === node.idNode
              }).length>0
            })
            if (children.length > 0 && children[0].display == true) {
              node.node_visible = false
              node.display = false
            }
          }
        }
      })
    )
    new_data.fit_screen = true
    d3.select('#svg').on('.zoom', null)
    set_data({ ...new_data })
    
  }

  const diagram_label = 'Diagrammes'
  const marginTop = data.static_sankey ? '0px' : '0px'
  //const display_banner=Object.values(data.dataTags).filter(d=>d.banner!='none').length==0 &&Object.values(data.nodeTags).filter(d=>d.banner!='none').length==0
  const banner_grouptag = Object.entries(dataTags).filter(([, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi') })
  const color = 'black'
  const backgroundColor = 'gainsboro'


  const opacity_advanced =  !window.SankeyToolsStatic ? '0.3' : '0'
  const node_filter = Object.entries(nodeTags).filter(([, v]) => v.banner !== 'none').length > 0
  const flux_filter = Object.entries(fluxTags).filter(([, v]) => v.banner !== 'none').length > 0

  const setSelectionMode = (val: string) => {
    set_mode_selection(val)
  }

  const link_filter=
  <Popover id="popover-link-filter" style={{maxWidth:'100%'}}>
    <Popover.Header as="h3">Filtre Flux</Popover.Header>
    <Popover.Body >
      <Form style={{width:'600px'}}>
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
    </Popover.Body>
  </Popover>
  

  return (
    <>
      <div className='herowrap'
        style={{
          color: color,
          backgroundColor: backgroundColor,
          marginLeft: '0',
          paddingBottom: '3px',
          alignItems: 'baseline',
          display: ((!(banner_grouptag.length > 0 || has_agregation)) && (!( node_filter)) && (!( flux_filter)) && (!(sous_filieres)) && !(window.sankey && window.sankey.excel))?'none':'block'
        }}>

        {
          data.show_banner?
            (<><Row style={{ marginTop: marginTop, paddingBottom: '5px', paddingTop: '5px', alignItems: 'baseline' }}>
              {(data.static_sankey && sous_filieres && !is_split) ? (<>
                <Form.Group as={Col} style={{ marginLeft: '10px' }} lg="auto">
                  <FormLabel className="text-center" style={{justifyContent: 'center'}}  ><b>{diagram_label}</b></FormLabel>
                  <Form.Select style={{ width: '200px', color:'black' }}
                    onChange={setDiagram}
                    value={diagram}>
                    {Object.keys(sous_filieres).map((name, i) => <option key={i} value={name} >{name}</option>)}
                  </Form.Select>
                </Form.Group></>) : (<></>)}
              {(data.static_sankey && sous_filieres && is_split) ? (<>
                <Form.Group as={Col} style={{ marginLeft: '10px' }} lg="auto">
                  <FormLabel className="text-center" style={{justifyContent: 'center'}}  ><b>{diagram_label}</b></FormLabel>
                  <Form.Select style={{ width: '200px', color:'black' }}
                    onChange={(evt:React.ChangeEvent<HTMLSelectElement>)=>set_diagram(evt.target.value)}
                    value={diagram}>
                    {Object.keys(diagrams).map((name, i) => <option key={i} value={name} >{name}</option>)}
                  </Form.Select>
                  {is_split ? 
                    (<Form.Select style={{ width: '200px', color:'black' }}
                      onChange={(evt:React.ChangeEvent<HTMLSelectElement>) => {
                        setDiagram(evt)
                        set_diagram2(evt.target.value)
                      }}
                      value={diagram2}>
                      {diagrams[diagram] ? (Object.values(diagrams[diagram]).map((name, i) => <option key={i} value={name} >{name}</option>)):(<></>)}
                    </Form.Select>) :(<></>)
                  }
                </Form.Group></>) : (<></>)}
              <Form.Group as={Col}
                style={{
                  width: '250px',
                  marginLeft: '0px',
                  display: (banner_grouptag.length > 0 || has_agregation) ? 'block' : 'none'
                }} lg="auto">
                {banner_grouptag.length > 0 ? (<>
                  <FormLabel style={{ justifyContent: 'center' }}><b>Sélection des données</b></FormLabel>
                  {addAllDropDownLinks()}
                </>)
                  : (<Col></Col>)
                }
                { has_agregation ? (
                  <><FormLabel><b>Niveaux de détail</b></FormLabel>
                    {Object.entries(nodeTags['Dimensions'].tags).filter(([, tag]) => tag.selected).map(([key, tag],) => { 
                      return (
                        <>
                          <FormLabel className="text-center" style={{justifyContent: 'center'}}  >{tag.name}</FormLabel>
                          <Form.Select id={key}
                            key={key}
                            style={{ color: 'black'}}
                            onChange={
                              (evt: React.ChangeEvent<HTMLSelectElement>) => {
                                if (evt.target.value === '') {
                                  return
                                }
                                data.agregation[tag.name].level =+evt.target.value
                                Object.values(data.nodes).forEach(node => {
                                  node.node_visible = true
                                  node.display = true 
                                })
                                const selected_tags =  Object.values(data.nodeTags.Dimensions.tags).filter(tag=>tag.selected)
                                selected_tags.forEach(tag=>set_nodes_level(data, data.nodes, data.agregation[tag.name].level, data.agregation[tag.name].dimension))
                                selected_tags.forEach(tag=>
                                  Object.values(data.nodes).forEach(node => {
                                    const node_dim = node.dimensions[data.agregation[tag.name].dimension]
                                    if (node_dim ) {
                                      if (node_dim.level! == data.agregation[tag.name].level) {
                                        const children = Object.values(data.nodes).filter(child_node=> {
                                          return selected_tags.filter(tag2=> {
                                            const child_node_dim = child_node.dimensions[data.agregation[tag2.name].dimension]
                                            return child_node_dim && child_node_dim['parent_name'] === node.idNode
                                          }).length>0
                                        })
                                        if (children.length > 0 && children[0].display == true) {
                                          node.node_visible = false
                                          node.display = false
                                        }
                                      }
                                    }
                                  })
                                )
                                Object.values(data.nodeTags.Dimensions.tags).filter(tag=>tag.selected).forEach(tag=>
                                  Object.values(data.nodes).forEach(node => {
                                    if (node.dimensions[data.agregation[tag.name].dimension] ) {
                                      if (node.dimensions[data.agregation[tag.name].dimension].level! == data.agregation[tag.name].level) {
                                        const parent_id = node.dimensions[data.agregation[tag.name].dimension].parent_name
                                        if (!parent_id) {
                                          return
                                        }
                                        const parent_node = data.nodes[parent_id]
                                        if (parent_node.display == true) {
                                          node.node_visible = false
                                          node.display = false
                                        }
                                      }
                                    }
                                  })
                                )
                                Object.values(data.nodeTags.Dimensions.tags).filter(tag=>tag.selected).forEach(tag=>
                                  Object.values(data.nodes).forEach(node => {  
                                    if (!node.node_visible) {
                                      return false
                                    }
                                    if (!node.dimensions[data.agregation[tag.name].dimension] ) {
                                      return false
                                    }              
                                    desagregation(data,node.idNode,data.agregation[tag.name].dimension,false)
                                    // hide children
                                    agregation(data,node.idNode,data.agregation[tag.name].dimension,false)
                                  }
                                  )
                                )
                                set_data({...data})
                              }

                            }
                            value={data.agregation[tag.name].level}
                          >{[...Array(nb_agregation_level[tag.name]).keys()].map( level => <option key={level+1} value={level+1}  >{'Niveau '+(level+1)}</option>)}
                          </Form.Select>
                        </>
                      )
                    })}
                  </>
                ) : (<></>)}
              </Form.Group>
              <Col lg="auto">
                {additional_selector ? (
                  additional_selector
                ) : (<></>)}
              </Col>

              {//----------------------------
              }

              <Form.Group as={Col}
                style={{ color: 'black', marginLeft: '5px', width: '250px', display: ( node_filter) ? 'block' : 'none' }}
                lg="auto"
              >
                {( node_filter) ? (
                  <FormLabel className="text-center" style={{ justifyContent: 'center', color: color }}><b>Filtrage des noeuds</b></FormLabel>
                ) : (<FormLabel className="text-center" style={{ justifyContent: 'center', opacity: opacity_advanced, color: color }}>Filtrage des noeuds</FormLabel>)}

                { (Object.entries(nodeTags).filter(([, v]) => v.banner !== 'none').length > 0) ? (<>
                  {addAllDropDownNode()}</>
                ) : (<>
                  <Form.Control placeholder="Pas de filtrage" style={{ opacity: opacity_advanced, color: '#6c757d' }} disabled /></>)
                }
              </Form.Group>

              {//----------------------------
              }
              <Form.Group as={Col} style={{ width: '250px', marginLeft: '0px', display: ( flux_filter) ? 'block' : 'none' }} lg="auto">
                { flux_filter ? (
                  <>
                    <FormLabel style={{ justifyContent: 'center' }}><b>Filtrage des flux</b></FormLabel>
                    {addAllDropDownFlux(data.fluxTags, data, set_data)}
                  </>)
                  : (<>
                    <FormLabel className="text-center" style={{ justifyContent: 'center', opacity: opacity_advanced, color: '#6c757d' }}>Filtrage des flux</FormLabel>
                    <Form.Control placeholder="Pas de filtrage" style={{ opacity: opacity_advanced, color: '#6c757d' }} disabled /></>)
                }
              </Form.Group>
              {data.static_sankey && sous_filieres && additional_selector ? (<></>) : (<Col></Col>)}
              {window.sankey && window.sankey.excel ? (
                <Form.Group as={Col} lg="auto" >
                  <FormLabel className="text-center" >Téléchargements</FormLabel>
                  <Button href={window.sankey.excel}>Résultats</Button>
                </Form.Group>
              ) : (<></>)}
            </Row>
            <Row>
              <Col className='text-right'>
                <Button variant='dark' size='sm'
                  onClick={()=>{
                    data.show_banner=false
                    set_data({...data})
                  }}
                >
                  <FontAwesomeIcon icon={faAngleDoubleUp} />
                </Button>
              </Col>
            </Row></>)
            :
            <Row>
              <Col >
                {(Object.values(data.dataTags).length>0)?(<>{Object.values(data.dataTags).filter(d=>Object.values(d.tags).length>0).map(el=>{
                  return (<Form.Label>{el.group_name} : {Object.values(el.tags).filter(d=>d.selected)[0].name}</Form.Label>)

                })}</>):(<></>)}
              </Col>
              <Col className='text-right'>
                <FormGroup as={Col}>
                  <Button variant='outline-dark' size='sm'
                    onClick={()=>{
                      data.show_banner=true
                      set_data({...data})
                    }}
                  >
                    <FontAwesomeIcon icon={faAngleDoubleDown} />
                  </Button>

                </FormGroup>
                
              </Col>
            </Row>
        }
        
      </div>
      { data.static_sankey ? (
        <Row className='sankey-toolbar'>
          <Col className='text-right'>
            <FormGroup as={Col} lg='auto'>
              <ButtonGroup >

                {//Boutons Sélection classique des éléments 
                }
                <OverlayTrigger
                  key={'tooltip-adjust'}
                  placement={'top'}
                  delay={500}
                  overlay={<Tooltip id={'tooltip-adjust'}>Permet de réajuster la zone de dessin à la taille de l'écran </Tooltip>
                  }
                >
                  <Button variant='dark' onClick={() => { 
                    data.fit_screen = true
                    d3.select('#svg').on('.zoom', null)
                    set_data({ ...data })
                  }} >
                    <FontAwesomeIcon icon={faMaximize} />
                  </Button>
                </OverlayTrigger>
              </ButtonGroup>
            </FormGroup>
          </Col>
        </Row>) : (<></>)}
      { data.static_sankey ? (
        <Row className='sankey-toolbar'>
          <Col className='text-right'>
            <FormGroup as={Col} lg='auto'>
              <ButtonGroup >

                {//Boutons Sélection classique des éléments 
                }
                <OverlayTrigger
                  key={'tooltip-structur'}
                  placement={'top'}
                  delay={500}
                  overlay={<Tooltip id={'tooltip-structur'}>Permet d'afficher la structure du diagramme sans proportion des flux selon leur valeur </Tooltip>
                  }
                >
                  <Button variant='info' onClick={() => { 
                    console.log('toto')
                    // data.fit_screen = true
                    // d3.select('#svg').on('.zoom', null)
                    // set_data({ ...data })
                  }} >
                    <FontAwesomeIcon icon={faCodeBranch} />
                    Hello
                  </Button>
                </OverlayTrigger>
              </ButtonGroup>
            </FormGroup>
          </Col>
        </Row>) : (<></>)}
      { !data.static_sankey ? (
        <Row className='sankey-toolbar'>
          <Col>
            <FormGroup as={Col} lg='auto'>
              <ButtonGroup >

                {//Boutons Sélection classique des éléments 
                }
                <OverlayTrigger
                  key={'tooltip-selection'}
                  placement={'top'}
                  delay={500}
                  overlay={<Tooltip id={'tooltip-selection'}>Permet de drag les noeuds </Tooltip>
                  }
                >
                  <Button disabled={mode_visualisation} variant={(!(mode_selection == 's')) ? 'outline-info' : 'info'} onClick={() => { setSelectionMode('s') }} >
                    <FontAwesomeIcon icon={faArrowPointer} />
                  </Button>
                </OverlayTrigger>


                <OverlayTrigger
                  key={'tooltip-ajoutNode'}
                  placement={'top'}
                  delay={500}
                  overlay={<Tooltip id={'tooltip-ajoutNode'}>Ajoute un noeud au click de la souris </Tooltip>
                  }
                >
                  <Button disabled={mode_visualisation} variant={(!(mode_selection == 'n')) ? 'outline-success' : 'success'} onClick={() => { setSelectionMode('n') }} >
                    {/* <FontAwesomeIcon icon={faNotesMedical} /> */}
                    <svg viewBox='0 0 1000 1000' height='20px' width='20px'>
                      <g>
                        <path style={{fill:(mode_selection == 'n')?'white':'#56cc9d'}} d='M55.151 1011.14c-20.896-5.476-37.414-21.547-44.976-43.759-1.876-5.51-1.931-18.611-1.931-458.901 0-441.678 0.051-453.374 1.948-458.901 6.973-20.306 19.469-33.862 38.259-41.504l8.247-3.354 750.003-0.53v84.575h-714.436v839.428h841.24v-600.18h84.536l-0.012 312.723c-0.004 212.75-0.353 314.849-1.086 319.373-3.453 21.287-18.978 40.399-39.628 48.782l-8.247
                 3.348-454.125 0.193c-392.517 0.167-454.895-0.012-459.796-1.293zM496.144 814.818c-15.479-4.95-28.028-18.365-32.372-34.606-1.11-4.15-1.381-26.438-1.391-114.17l-0.012-109.014-110.052-0.304c-109.337-0.302-110.094-0.318-116.493-2.509-39.255-13.44-46.541-64.48-12.521-87.712 2.491-1.701 7.313-4.206 10.715-5.565l6.186-2.472 222.13-0.561 0.276-111.093c0.275-110.769 
                 0.282-111.111 2.488-116.938 11.501-30.393 48.064-42.012 74.593-23.704 6.832 4.715 14.378 14.323 17.681 22.511l2.422 6.006 0.552 223.218 222.13 0.561 5.968 2.256c13.383 5.060 24.816 16.207 29.604 28.862 2.74 7.243 3.797 20.512 2.22 27.868-3.593 16.757-16.519 30.98-33.412 36.764-6.4 2.191-7.156 2.207-116.493 2.509l-110.052 0.304-0.012 109.014c-0.012 87.732-0.282 
                 110.020-1.391 114.17-4.393 16.425-16.977 29.757-32.711 34.655-8.243 2.566-21.94 2.544-30.049-0.050z'></path>
                      </g>
                  
                    </svg>

                  </Button>
                </OverlayTrigger>

                <OverlayTrigger
                  key={'tooltip-liaison'}
                  placement={'top'}
                  delay={500}
                  overlay={<Tooltip id={'tooltip-liason'}>Clické puis relacher entre deux noeuds existant pour les liés avec un flux </Tooltip>
                  }
                >
                  <Button disabled={mode_visualisation} variant={(!(mode_selection == 'ln')) ? 'outline-secondary' : 'secondary'} onClick={() => { setSelectionMode('ln') }} >
                    {/* Ajout liaison entre noeud */}

                    <FontAwesomeIcon icon={faShareNodes} />
                  </Button>
                </OverlayTrigger>
              </ButtonGroup>
            </FormGroup>
          </Col>

          <Col className='text-right'>

            <FormGroup as={Col} lg='auto'>
              <ButtonGroup >

                <OverlayTrigger
                  key={'tooltip-link-filter'}
                  placement={'left'}
                  trigger={'click'}
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
                  overlay={<Tooltip id={'tooltip-adjust'}>Permet de réajuster la zone de dessin à la taille de l'écran </Tooltip>
                  }
                >
                  <Button variant='dark' onClick={() => { 
                    data.fit_screen = true
                    d3.select('#svg').on('.zoom', null)
                    set_data({ ...data })
                  }} >
                    <FontAwesomeIcon icon={faMaximize} />
                  </Button>
                </OverlayTrigger>


                <OverlayTrigger
                  key={'tooltip-structur'}
                  placement={'top'}
                  delay={500}
                  overlay={<Tooltip id={'tooltip-structur'}>Permet d'afficher la structure du diagramme sans proportion des flux selon leur valeur </Tooltip>
                  }
                >
                  <Button variant={(data.show_structure?'outline-success':'success')} onClick={() => { 
                    data.show_structure = !data.show_structure
                    set_data({ ...data })
                  }} >
                    <FontAwesomeIcon icon={faCodeBranch} />
                  </Button>
                </OverlayTrigger>


                <OverlayTrigger
                  key={'tooltip-help'}
                  placement={'top'}
                  delay={500}
                  overlay={<Tooltip id={'tooltip-help'}>Info supplementaires sur le diagramme</Tooltip>
                  }
                >
                  <Button variant='info' onClick={() => { set_show_readme(true) }} >
                    ?
                  </Button>
                </OverlayTrigger>

              </ButtonGroup>
            </FormGroup>
          </Col>


        </Row>
      ) : (<></>)}

      {window.sankey && window.sankey.help && Object.keys(window.sankey.help).length > 0 ? (
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
        </Modal>)}
    </>
  )
}

SankeyEdition.propTypes = SankeyEditionPropTypes

export default SankeyEdition

