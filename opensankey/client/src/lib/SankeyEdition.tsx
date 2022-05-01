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
  const { tags_catalog, dataTags } = data
  const tags_visible = Object.keys(data.tags_catalog).length > 0 || Object.keys(data.dataTags).filter(tags_key => data.dataTags[tags_key].banner === 'display').length > 0
  const [colormap, set_colormap] = useState(
    tags_visible ?
      (Object.keys(data.tags_catalog).filter(tags_key => data.tags_catalog[tags_key].banner !== 'one').length > 0 ?
        Object.keys(data.tags_catalog).filter(tags_key => data.tags_catalog[tags_key].banner !== 'one')[0] :
        (Object.keys(data.dataTags).filter(tags_key => data.dataTags[tags_key].banner === 'display').length > 0 ?
          Object.keys(data.dataTags).filter(tags_key => data.dataTags[tags_key].banner === 'display')[0] : '')
      ) : '')
  //const [use_colormap, set_use_colormap] = useState(false)
  const [diagram, set_diagram] = useState('')
  const [agregation_level,set_agregation_level] = useState(0)
  const [use_colormap,set_use_colormap] = useState(
    tags_visible &&
      (Object.keys(data.tags_catalog).filter(tags_key => data.tags_catalog[tags_key].banner !== 'one').length > 0 || 
      Object.keys(data.dataTags).filter(tags_key => data.dataTags[tags_key].banner === 'display').length > 0) 
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
    const banner_grouptag = Object.entries(tags_catalog).filter(([key, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi')  && key !== 'Exchanges' })
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

  const addPalette = () => {
    if (Object.entries(data.dataTags).filter(tags => tags[1].banner === 'display' && tags[0] !== 'Exchanges').length === 0 && Object.entries(data.tags_catalog).filter(tags => tags[0] !== 'Exchanges').length == 0) {
      return (<></>)
    }
    return (
      <Col>
        <FormCheck
          type='switch'
          label='Palette de couleurs'
          checked={use_colormap === true}
          onChange={evt => {
            let the_colormap = colormap
            const apply_to_node = Object.keys(data.tags_catalog).includes(colormap)
            if (colormap === '' || colormap === undefined) {
              the_colormap = tags_visible ? Object.keys(data.tags_catalog).filter(tags_key => data.tags_catalog[tags_key].banner !== 'one' && tags_key !== 'Exchanges' )[0] : ''
              if (the_colormap === '' || colormap === undefined) {
                the_colormap = tags_visible ? Object.keys(data.dataTags).filter(tags_key => data.dataTags[tags_key].banner === 'display')[0] : ''
              }
            }
            if (evt.target.checked) {
              Object.values(data.links).forEach(link => link.colormap = the_colormap)
              if (apply_to_node) {
                Object.values(data.nodes).forEach(node => {
                  if (node.type === 'sector') {
                    return
                  }
                  node.nodeParameter = 'groupTag'
                  node.colorTag = the_colormap
                })
              }
            } else {
              Object.values(data.links).forEach(link => link.colormap = '')
              if (apply_to_node) {
                Object.values(data.nodes).forEach(node => {
                  node.nodeParameter = 'local'
                  //node.colorTag = the_colormap
                })
              }
            }
            set_use_colormap(evt.target.checked)
            Object.values(tags_catalog).forEach(tags_group => tags_group.show_legend = false)
            Object.values(dataTags).forEach(tags_group => tags_group.show_legend = false)
            if (the_colormap in tags_catalog) {
              tags_catalog[the_colormap].show_legend = evt.target.checked
            }
            if (the_colormap in dataTags) {
              dataTags[the_colormap].show_legend = evt.target.checked
            }
            set_colormap(the_colormap)
            set_data({ ...data })
          }}
        />

        <Form.Select
          disabled={!use_colormap}
          onChange={
            (evt: React.ChangeEvent<HTMLSelectElement>) => {
              const apply_to_node = Object.keys(data.tags_catalog).includes(evt.target.value)
              Object.values(data.links).forEach(link => link.colormap = evt.target.value)
              if (apply_to_node) {
                Object.values(data.nodes).forEach(node => {
                  if (node.type === 'sector') {
                    return
                  }
                  node.nodeParameter = 'groupTag'
                  node.colorTag = evt.target.value
                })
              } else {
                Object.values(data.nodes).forEach(node => {
                  if (node.type === 'sector') {
                    return
                  }
                  node.nodeParameter = 'general'
                })
              }
              //set_link_tag_favorite((link_tag_favorite === tags_group_key) ? '' : tags_group_key)
              set_colormap(evt.target.value)
              if (evt.target.value in tags_catalog) {
                Object.values(tags_catalog).forEach(tags_group => tags_group.show_legend = false)
                tags_catalog[evt.target.value].show_legend = true
              }
              Object.values(tags_catalog).forEach(tags_group => tags_group.show_legend = false)
              Object.values(dataTags).forEach(tags_group => tags_group.show_legend = false)
              if (evt.target.value in tags_catalog) {
                tags_catalog[evt.target.value].show_legend = true
              }
              if (evt.target.value in dataTags) {
                dataTags[evt.target.value].show_legend = true
              }
              set_data({ ...data })
            }}>
          {Object.entries(data.dataTags).filter(tags_group => tags_group[1].banner === 'display').map(
            (tags_group, i) =>
              <option
                key={i}
                value={tags_group[0]}
                selected={colormap === tags_group[0]} >
                {tags_group[1].group_name}
              </option>)}
          {Object.entries(data.tags_catalog).filter(tags_group => tags_group[1].banner === 'multi').map(
            (tags_group, i) =>
              <option
                key={i}
                value={tags_group[0]}
                selected={colormap === tags_group[0]} >
                {tags_group[1].group_name}
              </option>)}
        </Form.Select>
      </Col>
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
    let height = 0
    Object.values(data.nodes).forEach(n => height = (n.y && n.node_visible) ? Math.max(height, n.y) : height)
    let min_height = 2000
    Object.values(data.nodes).forEach(n => min_height = (n.y && n.node_visible) ? Math.min(min_height, n.y) : min_height)
    let max_vert_shift = 0
    Object.values(data.links).forEach(l => max_vert_shift = l.vert_shift ? Math.max(max_vert_shift, l.vert_shift) : max_vert_shift)

    new_data.height = Math.max(500, height + max_vert_shift + 200)
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
  //const display_banner=Object.values(data.dataTags).filter(d=>d.banner!='none').length==0 &&Object.values(data.tags_catalog).filter(d=>d.banner!='none').length==0
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
            <Form id='dropdown_banner_node' className='dropdown_banner_node' >
              {addAllDropDownNode()}
            </Form>
          </Col>
          {banner_grouptag.length > 0 ?
            (<Col>
              <Form id='dropdown_banner_node' className='dropdown_banner_node' >
                {addAllDropDownLinks()}
              </Form>
            </Col>) : (<></>)
          }
          {additional_selector ? (additional_selector) : (<></>)}
          { nb_agregation_level > 1 ? (<Col><Form.Group >
            <FormCheck
              type='switch'
              label='Niveau de détail'
              checked={use_level === true}
              onChange={ evt => {
                if (evt.target.checked) {
                  set_nodes_level(data,data.nodes, agregation_level+1)
                  // let height = 0
                  // Object.values(data.nodes).forEach(n => height = (n.y && n.node_visible) ? Math.max(height, n.y) : height)
                  // let min_height = 2000
                  // Object.values(data.nodes).forEach(n => min_height = (n.y && n.node_visible) ? Math.min(min_height, n.y) : min_height)
                  // let max_vert_shift = 0
                  // Object.values(data.links).forEach(l => max_vert_shift = l.vert_shift ? Math.max(max_vert_shift, l.vert_shift) : max_vert_shift)
                
                  // data.height = Math.max(500, height + max_vert_shift + 200)
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
            <Form.Select id="selectionNode"
              disabled={!use_level}
              onChange={
                (evt: React.ChangeEvent<HTMLSelectElement>) => {
                  if (evt.target.value ==='') {
                    return
                  }
                  //set_level(+evt.target.value)
                  for (let level = 1; level <= +evt.target.value + 1; level++) {
                    set_nodes_level(data,data.nodes, level)
                  }
                  set_agregation_level(+evt.target.value)
                  // let height = 0
                  // Object.values(data.nodes).forEach(n => height = (n.y && n.node_visible) ? Math.max(height, n.y) : height)
                  // let min_height = 2000
                  // Object.values(data.nodes).forEach(n => min_height = (n.y && n.node_visible) ? Math.min(min_height, n.y) : min_height)
                  // let max_vert_shift = 0
                  // Object.values(data.links).forEach(l => max_vert_shift = l.vert_shift ? Math.max(max_vert_shift, l.vert_shift) : max_vert_shift)
                
                  // data.height = Math.max(500, height + max_vert_shift + 200)
                  set_data({...data})
                }
              }
            >
              {[...Array(nb_agregation_level).keys()].map( level => <option key={level} value={level} selected={level === agregation_level} >{'Niveau '+(level+1)}</option>)}
            </Form.Select>
          </Form.Group>
          </Col>) : (<></>)}
          <Col>
            <Form id='dropdown_banner_node' className='dropdown_banner_node'>
              {addPalette()}
              { !data.static_sankey || (window.sankey && window.sankey.structure) ?
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
                </Col>) : (<></>)}
              <Col>
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
            </Form>
          </Col>
          { window.sankey && window.sankey.excel ? (
            <Form.Group as={Col} >
              <FormLabel className="text-center" >Téléchargements</FormLabel>
              <Button  href={window.sankey.excel}>
                Résultats
              </Button>
            </Form.Group>
          ) : (<></> )}
          <Col > 
            <br/>
            <Button 
              onClick={()=>set_show_readme(true)}
            >
                Aide
            </Button>               
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
                              {Object.entries(tags_catalog).filter(tags_group => tags_group[1].banner === 'multi' && tags_group[0] !== 'Exchanges' &&  tags_group[0] !== 'flux_types' &&  tags_group[0] !== 'Uncert' ).map(tags_group => { return (<li key={i} >{tags_group[1].group_name}</li>)})}
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
                      {Object.entries(tags_catalog).filter(tags_group => tags_group[1].banner === 'multi' && tags_group[0] !== 'Exchanges' &&  tags_group[0] !== 'flux_types' &&  tags_group[0] !== 'Uncert' ).map(tags_group => { return ' '+tags_group[1].group_name })}</b></p>
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

