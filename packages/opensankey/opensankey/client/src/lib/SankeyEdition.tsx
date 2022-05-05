import React, { FunctionComponent, useState } from 'react'
import { Row, Col, Form, FormCheck, FormLabel, Modal, Button, Tabs, Tab } from 'react-bootstrap'
import { SankeyDataPropTypes, TagsGroup, } from './types'
import PropTypes, { InferProps } from 'prop-types'
import { MultiSelect } from 'react-multi-select-component'
import parse from 'html-react-parser'
import { convert_data } from './SankeyConvert'
import { set_nodes_level } from './SankeyUtils'

const SankeyEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  additional_selector: PropTypes.element,
}

declare const window: Window &
  typeof globalThis & {
    sankey: {
      sous_filieres: { [key: string]: string }
      help: { [key: string]: string }
      excel: string
      structure: boolean
    }
  }

type SankeyEditionTypes = InferProps<typeof SankeyEditionPropTypes>

const SankeyEdition: FunctionComponent<SankeyEditionTypes> = ({ data, set_data,additional_selector }) => {
  const { nodeTags,fluxTags, dataTags } = data
  const node_tags_visible = Object.keys(data.nodeTags).length > 0 
  const flux_tags_visible = Object.keys(data.fluxTags).length > 0
  const [node_colormap, set_node_colormap] = useState(
    node_tags_visible ? Object.keys(data.nodeTags).filter(tags_key => data.nodeTags[tags_key].banner !== 'one').length > 0 ? Object.keys(data.nodeTags).filter(tags_key => data.nodeTags[tags_key].banner !== 'one')[0] : '' : ''
  )
  const [flux_colormap, set_flux_colormap] = useState('node_colormap')
  const [diagram, set_diagram] = useState('')
  const [agregation_level,set_agregation_level] = useState(0)
  const [use_node_colormap,set_use_node_colormap] = useState(
    node_tags_visible && Object.keys(data.nodeTags).filter(tags_key => data.nodeTags[tags_key].banner !== 'one').length > 0
  )
  const [use_link_colormap,set_use_link_colormap] = useState(
    flux_tags_visible && Object.keys(data.fluxTags).filter(tags_key => data.fluxTags[tags_key].banner !== 'one').length > 0
  )
  const [use_level,set_use_level] = useState(false)
  const [show_readme,set_show_readme] = useState(false)

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

  const handleSimpleDropdown = (evt: React.ChangeEvent<HTMLSelectElement>, tags_group: TagsGroup) => {
    const val = evt.target.value
    Object.entries(tags_group.tags).forEach(tag => tag[1].selected = val === tag[0])
    set_data({ ...data })
  }

  // const handleMultiDropdown = (selected: string[], tags_group: TagsGroup) => {
  //   Object.entries(tags_group.tags).forEach(tag => tag[1].selected = selected.includes(tag[1].name))
  //   set_data({ ...data })
  // }
  const handleMultiDropdown = (selected: [{ label: string, value: string }], tags_group: TagsGroup) => {
    const tab_sel = selected.map((d) => {
      console.log(d)
      return d.value
    })
    Object.entries(tags_group.tags).forEach(tag => tag[1].selected = tab_sel.includes(tag[1].name))
    set_data({ ...data })
  }
  const addAllDropDownNode = () => {
    const banner_grouptag = Object.entries(nodeTags).filter(([key, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi')  && key !== 'Exchanges' })
    const allDD = banner_grouptag.map(([, tags_group]) => {
      if (tags_group.banner == 'one') {
        return (
          <Row key={tags_group.group_name}>
            <Col>{tags_group.group_name}</Col>
            <Col style={{ width: '200px', color:'black' }}>
              {<Form.Select key={tags_group.group_name} placeholder='all' onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => { handleSimpleDropdown(evt, tags_group) }}>{
                Object.entries(tags_group.tags).map(([tag_key, tag]) => {
                  return (<option key={tag_key} value={tag_key}>{tag.name}</option>)
                })}
              </Form.Select>}
            </Col>
          </Row>)
      } else if (tags_group.banner == 'multi') {
        const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
        const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
        return (
          <Row key={tags_group.group_name}>
            <Col>{tags_group.group_name}</Col>
            <Col style={{ width: '200px', color:'black' }}>
              {/* <DropdownMultiselect
                key={tags_group.group_name}
                selected={Object.entries(tags_group.tags).map(tag => tag[1].selected ? tag[1].name : null).filter(tag_name => tag_name !== null)}
                name={tags_group.group_name}
                options={Object.entries(tags_group.tags).map(tag => tag[1].name)}
                handleOnChange={(selected: string[]) => { handleMultiDropdown(selected, tags_group) }} />
                 */}
              <MultiSelect
                valueRenderer={(selected : any, _options :any) => {
                  return selected.length? selected.map(({ label } : any) => label+', '): 'Aucun tag sélectionné'
                }}
                labelledBy={'hello'}
                // hasSelectAll={false}
                value={selected}
                options={options}
                onChange={(selected: [{ label: string, value: string }]) => {
                  handleMultiDropdown(selected, tags_group)
                }} />
            </Col>
          </Row>)
      }


    })
    return allDD
  }
  const addAllDropDownFlux = () => {
    const banner_grouptag = Object.entries(fluxTags).filter(([key, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi') })
    const allDD = banner_grouptag.map(([, tags_group]) => {
      if (tags_group.banner == 'one') {
        return (
          <Row key={tags_group.group_name}>
            <Col>{tags_group.group_name}</Col>
            <Col style={{ width: '200px', color:'black' }}>
              {<Form.Select key={tags_group.group_name} placeholder='all' onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => { handleSimpleDropdown(evt, tags_group) }}>{
                Object.entries(tags_group.tags).map(([tag_key, tag]) => {
                  return (<option key={tag_key} value={tag_key}>{tag.name}</option>)
                })}
              </Form.Select>}
            </Col>
          </Row>)
      } else if (tags_group.banner == 'multi') {
        const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
        const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
        return (
          <Row key={tags_group.group_name}>
            <Col>{tags_group.group_name}</Col>
            <Col style={{ width: '200px', color:'black' }}>
              <MultiSelect
                valueRenderer={(selected : any, _options :any) => {
                  return selected.length? selected.map(({ label } : any) => label+', '): 'Aucun tag sélectionné'
                }}
                labelledBy={'hello'}
                // hasSelectAll={false}
                value={selected}
                options={options}
                onChange={(selected: [{ label: string, value: string }]) => {
                  handleMultiDropdown(selected, tags_group)
                }} />
            </Col>
          </Row>)
      }
    })
    return allDD
  }
  const addAllDropDownLinks = () => {
    const banner_grouptag = Object.entries(dataTags).filter(([, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi') })
    const allDD = banner_grouptag.map(([, tags_group]) => {
      if (tags_group.banner == 'one') {
        return (
          <Row key={tags_group.group_name}>
            <Col>{tags_group.group_name}</Col>
            <Col /* style={{ width: '100px' }} */>
              {<Form.Select key={tags_group.group_name} placeholder='all' onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => { handleSimpleDropdown(evt, tags_group) }}>{
                Object.entries(tags_group.tags).map(([tag_key, tag]) => {
                  return (<option key={tag_key} value={tag.name} selected={tag.selected}>{tag.name}</option>)
                })}
              </Form.Select>}
            </Col>
          </Row>)
      } else if (tags_group.banner == 'multi') {
        const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
        const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
        return (
          <Row key={tags_group.group_name}>
            <Col>{tags_group.group_name}</Col>
            <Col /* style={{ width: '100px' }} */>
              {/* <DropdownMultiselect
                key={tags_group.group_name}
                selected={Object.entries(tags_group.tags).map(tag => tag[1].selected ? tag[1].name : null).filter(tag_name => tag_name !== null)}
                name={tags_group.group_name}
                options={Object.entries(tags_group.tags).map(tag => tag[1].name)}
              handleOnChange={(selected: string[]) => { handleMultiDropdown(selected, tags_group) }}
              /> */}
              <MultiSelect
                labelledBy={'hello'}
                value={selected}
                options={options}
                onChange={(selected: [{ label: string, value: string }]) => {
                  handleMultiDropdown(selected, tags_group)
                }} />
            </Col>
          </Row>)
      }


    })
    return allDD
  }

  const addPalette = (elementGroupNameParam:string,elementNameParam:string,set_use_colormap:(b:boolean)=>void,set_colormap:(s:string)=>void) => {
    const elementGroupName = elementGroupNameParam === 'nodeTags' ? 'nodeTags' : 'fluxTags'
    const elementName = elementNameParam === 'nodes' ? 'nodes' : 'links'
    const title = elementNameParam === 'nodes' ? 'Noeuds' : 'Flux'
    const use_colormap = elementNameParam === 'nodes' ? use_node_colormap : use_link_colormap
    const colormap = elementNameParam === 'nodes' ? node_colormap : flux_colormap
    const tags_visible = elementNameParam === 'nodes' ? node_tags_visible : flux_tags_visible
    if (Object.entries(data[elementGroupName]).length === 0) {
      return (<></>)
    }
    return (
      <Row>
        <Col>
          <FormCheck
            type='switch'
            label={title}
            checked={use_colormap === true}
            onChange={evt => {
              let the_colormap = colormap
              if (colormap === '' || colormap === undefined) {
                the_colormap = tags_visible ? Object.keys(data[elementGroupName]).filter(tags_key => data[elementGroupName][tags_key].banner !== 'one')[0] : ''
              }
              if (evt.target.checked) {
                Object.values(data[elementName]).forEach(el => {
                  el.colorParameter = 'groupTag'
                  el.colorTag = the_colormap
                })
              } else {
                Object.values(data[elementName]).forEach(el => {
                  el.colorParameter = 'local'
                })
              }
              set_use_colormap(evt.target.checked)
              Object.values(data[elementGroupName]).forEach(tags_group => tags_group.show_legend = false)
              if (the_colormap in data[elementGroupName]) {
                data[elementGroupName][the_colormap].show_legend = evt.target.checked
              }
              set_colormap(the_colormap)
              set_data({ ...data })
            }}
          />
        </Col>
        <Col>
          <Form.Select
            disabled={!use_colormap}
            onChange={
              (evt: React.ChangeEvent<HTMLSelectElement>) => {
                Object.values(data[elementName]).forEach(el => {
                  el.colorParameter = 'groupTag'
                  el.colorTag = evt.target.value
                })
                set_colormap(evt.target.value)
                Object.values(data[elementGroupName]).forEach(tags_group => tags_group.show_legend = false)
                if ( evt.target.value !== 'node_colormap' ) {
                  data[elementGroupName][evt.target.value].show_legend = true
                }
                set_data({ ...data })
              }}>
            { elementNameParam === 'links' ? (
              <option
                key={node_colormap}
                value={'node_colormap'}
                selected={colormap === 'node_colormap'} >
                Couleur des noeuds
              </option>) : (<></>)
            }
            {Object.entries(data[elementGroupName]).map(
              (tags_group, i) =>
                <option
                  key={i}
                  value={tags_group[0]}
                  selected={colormap === tags_group[0]} >
                  {tags_group[1].group_name}
                </option>)}
          </Form.Select>
        </Col>
      </Row>
    )
  }

  const setDiagram = (evt:any) => {

    const the_diagram = (evt.target as HTMLInputElement).value as string
    const sous_filieres = window.sankey.sous_filieres
    const new_data = JSON.parse(JSON.stringify((window.sankey as any)[sous_filieres[the_diagram] as any]))
    //Object.assign(sankey_data, new_data)
    convert_data(new_data)
    new_data.static_sankey = true
    //set_level(agregation_level)
    set_diagram(the_diagram)
    // let height = 0
    // Object.values(data.nodes).forEach(n => height = (n.y && n.node_visible) ? Math.max(height, n.y) : height)
    // let min_height = 2000
    // Object.values(data.nodes).forEach(n => min_height = (n.y && n.node_visible) ? Math.min(min_height, n.y) : min_height)
    // let max_vert_shift = 0
    // Object.values(data.links).forEach(l => max_vert_shift = l.vert_shift ? Math.max(max_vert_shift, l.vert_shift) : max_vert_shift)

    // new_data.height = Math.max(500, height + max_vert_shift + 200)
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
    //for (let level = 1; level <= +evt.target.value + 1; level++) {
    set_nodes_level(data,data.nodes,agregation_level+1)
    //}
    localStorage.setItem('initial_data',JSON.stringify(new_data))
    set_data({...new_data})
  }

  let sous_filieres = undefined
  if (window.sankey && window.sankey.sous_filieres) {
    sous_filieres = window.sankey.sous_filieres
  }
  const diagram_label = 'Diagrammes'
  const marginTop = data.static_sankey ? '0px' : '0px'
  //const display_banner=Object.values(data.dataTags).filter(d=>d.banner!='none').length==0 &&Object.values(data.nodeTags).filter(d=>d.banner!='none').length==0
  const banner_grouptag = Object.entries(dataTags).filter(([, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi') })
  let color = 'black'
  let backgroundColor = 'gainsboro'
  if (data.static_sankey) {
    color = 'white'
    backgroundColor = '#3c3c3c'
  }

  return (
    <>
      <div className='herowrap'
        style={{
          color : color,
          backgroundColor: backgroundColor,
          marginLeft: '0',
          paddingBottom: '3px',
          justifyContent: 'space-evenly',
          alignItems: '<baseline-position>',
          display: 'block'
        }}>
        <Row style={{ marginTop: marginTop, 'paddingBottom': '5px', 'paddingTop': '5px' }}>
          {(data.static_sankey && sous_filieres) ? (
            <Col>
              <Form.Group as={Col} style={{ marginLeft: '30px' }}>
                <Row>
                  <FormLabel className="text-center" >{diagram_label}</FormLabel>
                </Row>
                <Row>
                  <Form.Select
                    onChange={setDiagram}>
                    {Object.keys(sous_filieres).map((name, i) => <option key={i} value={name} selected={diagram === name} >{name}</option>)}
                  </Form.Select>
                </Row>
              </Form.Group>
            </Col>) : (<div />)}
          <Col>
            { Object.entries(nodeTags).length > 0 || nb_agregation_level > 1 ? (
              <FormLabel style={{justifyContent: 'center'}}><b>Filtrage des noeuds</b></FormLabel>) : (<></>)
            }
            <Form id='dropdown_banner_node' className='dropdown_banner_node' >
              {addAllDropDownNode()}
              { nb_agregation_level > 1 ? (
                <Form.Group as={Row}>
                  <Col>
                    <FormCheck
                      type='switch'
                      label='Niveau de détail'
                      checked={use_level === true}
                      onChange={ evt => {
                        if (evt.target.checked) {
                          set_nodes_level(data,data.nodes, agregation_level+1)

                          set_data({...data})
                        } else {
                          const json_data = localStorage.getItem('initial_data')
                          if (json_data) {
                            const initial_data = JSON.parse(json_data as string)
                            Object.values(data.nodes).forEach(n=> {
                              n.display = initial_data.nodes[n.idNode].display
                              n.node_visible = initial_data.nodes[n.idNode].node_visible
                            })
                            //initial_data.static_sankey = true
                            set_data({...data})
                          }
                        }
                        set_use_level(evt.target.checked)
                      }}
                    />
                  </Col>
                  <Col>
                    <Form.Select id="selectionNode"
                      disabled={!use_level}
                      onChange={
                        (evt: React.ChangeEvent<HTMLSelectElement>) => {
                          if (evt.target.value ==='') {
                            return
                          }
                          for (let level = 1; level <= +evt.target.value + 1; level++) {
                            set_nodes_level(data,data.nodes, level)
                          }
                          set_agregation_level(+evt.target.value)
                          set_data({...data})
                        }
                      }
                    >
                      {[...Array(nb_agregation_level).keys()].map( level => <option key={level} value={level} selected={level === agregation_level} >{'Niveau '+(level+1)}</option>)}
                    </Form.Select>
                  </Col>
                </Form.Group>
              ) : (<></>)}
            </Form>
          </Col>
          <Col>
            { Object.entries(fluxTags).filter(([key, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi')}).length > 0 ? (
              <FormLabel style={{justifyContent: 'center'}}><b>Filtrage des flux</b></FormLabel>) : (<></>)
            }
            <Form id='dropdown_banner_flux' className='dropdown_banner_flux' >
              {addAllDropDownFlux()}
            </Form>
          </Col>
          {banner_grouptag.length > 0 ?
            (<Col>
              <FormLabel style={{justifyContent: 'center'}}><b>Filtrage des données</b></FormLabel>
              <Form id='dropdown_banner_node' className='dropdown_banner_node' >
                {addAllDropDownLinks()}
              </Form>
            </Col>) : (<></>)
          }
          {additional_selector ? (additional_selector) : (<></>)}
          { Object.entries(nodeTags).length > 0 || Object.entries(fluxTags).length > 0 ? (
            <Col>
              <Form id='dropdown_banner_node' className='dropdown_banner_node'>
                <Col><FormLabel style={{justifyContent: 'center'}}><b>Palettes de couleurs</b></FormLabel></Col>
                <Col>{addPalette('nodeTags','nodes',set_use_node_colormap,set_node_colormap)}</Col>
                <Col>{addPalette('fluxTags','links',set_use_link_colormap,set_flux_colormap)}</Col>
                {/* { !data.static_sankey || (window.sankey && window.sankey.structure) ?
                  (<Col>
                    <FormCheck
                      type="checkbox"
                      checked={data.show_structure}
                      onChange={evt => {
                        data.show_structure = evt.target.checked
                        set_data({ ...data })
                      }}
                      label='Structure du diagramme'
                    />
                  </Col>) : (<></>)} */}
              </Form>
            </Col>
          ) : (<></>)}
          { window.sankey && window.sankey.excel ? (
            <Form.Group as={Col} >
              <FormLabel className="text-center" >Téléchargements</FormLabel>
              <Button  href={window.sankey.excel}>
                Résultats
              </Button>
            </Form.Group>
          ) : (<></> )}
          <Col lg="auto"> 
            <br/>
            <Button 
              onClick={()=>set_show_readme(true)}
            >
                Aide
            </Button>
            <br/><br/><br/>      
            <FormCheck
              type="checkbox"
              checked={data.fit_screen}
              onChange={evt => {
                data.fit_screen = evt.target.checked
                set_data({ ...data })
              }}
              label='Ajuster à l écran'
            />
          </Col>  
        </Row>

      </div>
      {window.sankey && window.sankey.help && Object.keys(window.sankey.help).length > 0 ? (
        <Modal 
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            'color':'black'
          }}
          size="lg"
          show={show_readme} 
          onHide={()=>set_show_readme(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Aide</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col>
                <Tabs defaultActiveKey={Object.keys(window.sankey.help)[0]} id="diagram">
                  { Object.keys(window.sankey.help).map(
                    (key,i)=>(<Tab title={key} eventKey={key} key={i}>{
                      parse(window.sankey.help[key], {
                        replace: (domNode : any) => {
                          if (domNode.attribs && domNode.attribs.id === 'units') {
                            return <div>
                              {(data as any).units_names.slice(2).map(
                                (units_desc : any,i:number) => { return (<p key={i} > <b>{units_desc[0]}</b> : {units_desc[1]} </p>)}
                              )}</div>
                          } else if (domNode.attribs && domNode.attribs.id === 'selectors') {
                            return <ul>
                              {Object.entries(nodeTags).filter(tags_group => tags_group[1].banner === 'multi' && tags_group[0] !== 'Exchanges' &&  tags_group[0] !== 'flux_types' &&  tags_group[0] !== 'Uncert' ).map(tags_group => { return (<li key={i} >{tags_group[1].group_name}</li>)})}
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
        </Modal>) : (
        <Modal 
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            'color':'black'
          }}
          size="lg"
          show={show_readme} 
          onHide={()=>set_show_readme(false)}
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
                      {Object.entries(nodeTags).filter(tags_group => tags_group[1].banner === 'multi' && tags_group[0] !== 'Exchanges' &&  tags_group[0] !== 'flux_types' &&  tags_group[0] !== 'Uncert' ).map(tags_group => { return ' '+tags_group[1].group_name })}</b></p>
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

