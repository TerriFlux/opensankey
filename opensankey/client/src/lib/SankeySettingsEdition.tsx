import React, { useState, FunctionComponent } from 'react'
import { Button, Row, FormControl, Form, Col, FormLabel, FormCheck, Tabs, Tab, Table } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { setSelectedTags } from './SankeyUtils'
import { arrangeNodes, compute_auto_sankey, updateLayout } from './SankeyLayout'
import { SankeyDataPropTypes } from './types'

const SankeySettingsEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  set_current_filter: PropTypes.func.isRequired,
  getValueIndex: PropTypes.func.isRequired
}

type SankeyEditionTypes = InferProps<typeof SankeySettingsEditionPropTypes>

const SankeySettingsEdition: FunctionComponent<SankeyEditionTypes> = ({ 
  data, 
  set_data,
  set_current_filter,
  getValueIndex,
  children 
}) => {
  let file_layout: Blob[] | undefined

  const [shift_left, set_shift_left] = useState(100)
  const [shift_top, set_shift_top] = useState(100)
  const [user_scale, set_user_scale] = useState(data.user_scale)
  const [height, set_height] = useState(data.height)
  const [width, set_width] = useState(data.width)
  const [node_hspace, set_node_hspace] = useState(data.h_space)
  const [node_vspace, set_node_vspace] = useState(data.v_space)

  const { display_style, links, nodes, node_width } = data
  const { filter } = display_style

  const value_index = getValueIndex(data)

  let max_link_value = 0
  links.forEach(link => {
    if (link.value[value_index] > max_link_value) {
      max_link_value = link.value[value_index]
    }
  })
  max_link_value += 1

  return (
    <Tabs defaultActiveKey="geometry" id="settings-layout">
      <Tab eventKey="geometry" title="Géometrie">
        <br></br>
        <Form>
          <Form.Group as={Row} >
            <Col>
              <FormLabel >Echelle</FormLabel>
            </Col>
            <Col>
              <FormControl
                type="text"
                value={user_scale}
                onChange={evt => set_user_scale(+evt.target.value)}
                onBlur={() => {
                  data.user_scale = user_scale
                  set_data({ ...data })
                }}
              />
              <FormControl.Feedback />
              <Form.Text>    (valeur pour 100px)</Form.Text>
            </Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col>
              <FormLabel >Hauteur</FormLabel>
            </Col>
            <Col>
              <FormControl
                type="text"
                value={height}
                onChange={evt => set_height(+evt.target.value)}
                onBlur={() => {
                  data.height = height
                  set_data({ ...data })
                }}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col>
              <FormLabel>Largeur</FormLabel>
            </Col>
            <Col>
              <FormControl
                type="text"
                value={width}
                onChange={evt => set_width(+evt.target.value)}
                onBlur={() => {
                  data.width = width
                  set_data({ ...data })
                }}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col>
              <FormLabel>Shift horizontal</FormLabel>
            </Col>
            <Col>
              <FormControl
                type="text"
                value={shift_left}
                onChange={evt => set_shift_left(+evt.target.value)}
              />
            </Col>
            <Col >
              <Button
                size="sm"
                onClick={
                  () => {
                    nodes.forEach((n) => n.x += shift_left)
                    set_data({ ...data })
                  }
                }
              >Shift</Button>
            </Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col>
              <FormLabel>Shift vertical</FormLabel>
            </Col>
            <Col>
              <FormControl
                type="text"
                value={shift_top}
                onChange={evt => set_shift_top(+evt.target.value)}
              />
            </Col>
            <Col>
              <Button
                size="sm"
                onClick={
                  () => {
                    nodes.forEach((n) => n.y += shift_top)
                    set_data({ ...data })
                  }
                }
              >Shift</Button>
            </Col>
          </Form.Group>
        </Form>
      </Tab>
      <Tab eventKey="layout" title="Positionnement">
        <br></br>
        <Form >
          <Form.Group as={Row} >
            <Col>
              <FormLabel>Layout</FormLabel>
            </Col>
            <Col>
              <Form.Control
                type="file"
                onChange={(evt: React.ChangeEvent) => file_layout = (evt.target as HTMLFormElement).files}
              />
            </Col>
            <Col>
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
                            updateLayout(data, new_layout)
                            set_data({ ...data })
                          }
                        }
                      )
                    })()
                    reader.readAsText(file_layout[0])
                  }
                }>Appliquer Layout
              </Button>
            </Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col>
              <FormLabel>Définition de la Grille</FormLabel>
            </Col>
            <Col>
              <FormLabel>Horizontal</FormLabel>
            </Col>
            <Col>
              <FormControl
                type="text"
                value={node_hspace}
                onChange={evt => {
                  set_node_hspace(+evt.target.value)
                  data.h_space = +evt.target.value
                }}
              />
            </Col>
            <Col>
              <FormLabel>Vertical</FormLabel>
            </Col>
            <Col>
              <FormControl
                type="text"
                value={node_vspace}
                onChange={evt => {
                  set_node_vspace(+evt.target.value)
                  data.v_space = +evt.target.value
                }}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col>
              <Button
                size="sm"
                onClick={() => {
                  arrangeNodes(data,node_hspace,node_vspace)
                  set_data({...data})
                }}
              >Arranger noeuds</Button>
            </Col>
            <Col>
              <Button
                size="sm"
                onClick={() => {
                  compute_auto_sankey(data,node_hspace)
                  set_data({...data})
                }}
              > Positionnement automatique</Button>
            </Col>
          </Form.Group>
        </Form>
      </Tab>
      <Tab eventKey="nodes" title="Noeuds">
        <br></br>
        <Form >
          <Form.Group as={Row} >
            <Col>
              <FormLabel >Taille minimum</FormLabel>
            </Col>
            <Col>
              <Form.Range
                min="0" max="100"
                value={node_width}
                onChange={
                  evt => {
                    data.node_width = +evt.target.value
                    set_data({ ...data })
                  }
                } />
            </Col>
            <Col>{node_width}</Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col>
              <FormLabel >Taille police</FormLabel>
            </Col>
            <Col>
              <Form.Range
                min="11" max="20"
                value={display_style.font_size}
                onChange={evt => {
                  display_style.font_size = +evt.target.value
                  set_data({ ...data })
                }}
              />
            </Col>
            <Col>{display_style.font_size}</Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col>
              <FormLabel >Secteurs</FormLabel>
            </Col>
            <Col>
              <FormCheck
                type='checkbox'
                label='Bold'
                checked={display_style.sector_bold}
                onChange={
                  evt => {
                    display_style.sector_bold = evt.target.checked
                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col>
              <FormCheck
                type='checkbox'
                label='Upper'
                checked={display_style.sector_uppercase}
                onChange={
                  evt => {
                    display_style.sector_uppercase = evt.target.checked
                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col>
              <FormCheck
                type='checkbox'
                label='Italic'
                checked={display_style.sector_italic}
                onChange={
                  evt => {
                    display_style.sector_italic = evt.target.checked
                    set_data({ ...data })
                  }
                }
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col>
              <FormLabel >Produits</FormLabel>
            </Col>
            <Col>
              <FormCheck
                type='checkbox'
                label='Bold'
                checked={display_style.product_bold}
                onChange={
                  evt => {
                    display_style.product_bold = evt.target.checked
                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col>
              <FormCheck
                type='checkbox'
                label='Upper'
                checked={display_style.product_uppercase}
                onChange={
                  evt => {
                    display_style.product_uppercase = evt.target.checked
                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col>
              <FormCheck
                type='checkbox'
                label='Italic'
                checked={display_style.product_italic}
                onChange={
                  evt => {
                    display_style.product_italic = evt.target.checked
                    set_data({ ...data })
                  }
                }
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col>
              <Button
                size="sm"
                onClick={
                  () => {
                    nodes.forEach(
                      node => {
                        node.visible = true
                        node.label_visible = true
                      }
                    )
                    set_data({ ...data })
                  }
                }
              >Reset visible</Button>
            </Col>
          </Form.Group>
        </Form>
      </Tab>
      <Tab eventKey="flux" title="Flux">
        <br></br>
        <Form >
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
                value={display_style.filter_label}
                onChange={evt => {
                  display_style.filter_label = +evt.target.value
                  set_data({ ...data })
                }}
              />
            </Col>
            <Col>{display_style.filter_label}</Col>
          </Form.Group>
          <Form.Group as={Row} >

            <Col>
              <FormLabel >Type :</FormLabel>
            </Col>
            <Col >
              <FormCheck
                type='checkbox'
                label='Courbe'
                onChange={evt => {
                  data.links.filter(l => l.visible).forEach(
                    l => l.curved = evt.target.checked
                  )
                  set_data({ ...data })
                }}
              />
            </Col>
            <Col >
              <FormCheck
                type='checkbox'
                label='Flêche'
                onChange={evt => {
                  data.links.filter(l => l.visible).forEach(
                    l => l.arrow = evt.target.checked
                  )
                  set_data({ ...data })
                }}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col>
              <FormLabel >Courbure</FormLabel>
            </Col>
            <Col >
              <Form.Range
                min="0" max="1" step="0.1"
                value={display_style.global_curvature}
                onChange={evt => {
                  display_style.global_curvature = +evt.target.value
                  data.links.filter(l => l.visible).forEach(l => l.curvature = +evt.target.value)
                  set_data({ ...data })
                }}
              />
            </Col>
            <Col>{display_style.global_curvature}</Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col>
              <FormLabel >Label:</FormLabel>
            </Col>
            <Col >
              <FormCheck
                name="label"
                label='Début'
                value="beginning"
                type='radio'
                onChange={
                  evt => {
                    data.links.filter(l => l.visible).forEach(
                      l => l.label_position = evt.target.value
                    )
                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col >
              <FormCheck
                name="label"
                label='Milieu'
                value="middle"
                type='radio'
                onChange={evt => {
                  data.links.filter(l => l.visible).forEach(
                    l => l.label_position = evt.target.value
                  )
                  set_data({ ...data })
                }}
              />
            </Col>
            <Col >
              <FormCheck
                name="label"
                label='Fin'
                value="end"
                type='radio'
                onChange={evt => {
                  data.links.filter(l => l.visible).forEach(
                    l => l.label_position = evt.target.value
                  )
                  set_data({ ...data })
                }}
              />
            </Col>
          </Form.Group>
          <Form.Group>
            <Col>
              <FormCheck
                type='checkbox'
                label='Attaché au flux'
                onChange={evt => {
                  data.links.filter(l => l.visible).forEach(
                    l => l.label_on_path = evt.target.checked
                  )
                  set_data({ ...data })
                }}
              />
            </Col >
          </Form.Group>
          <Form.Group as={Row} >
            <Col>
              <FormCheck
                value='black'
                type='radio'
                label='Label en noir'
                onChange={
                  () => {
                    data.links.filter(l => l.visible).forEach(
                      l => l.text_color = 'black'
                    )
                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col>
              <FormCheck
                value='white'
                type='radio'
                label='Label blanc'
                onChange={
                  () => {
                    data.links.filter(l => l.visible).forEach(
                      l => l.text_color = 'white'
                    )
                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col>
              <FormCheck
                value='same_color'
                type='radio'
                label='Label en couleur'
                onChange={
                  () => {
                    data.links.filter(l => l.visible).forEach(
                      l => l.text_color = l.color
                    )
                    set_data({ ...data })
                  }
                }
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col>
              <FormLabel >Taille police</FormLabel>
            </Col>
            <Col >
              <Form.Range
                min="11" max="20"
                value={display_style.font_size}
                onChange={evt => {
                  display_style.font_size = +evt.target.value
                  set_data({ ...data })
                }}
              />
            </Col>
            <Col >{display_style.font_size}</Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col>
              <Button
                size="sm"
                onClick={
                  () => {
                    links.forEach(
                      link => {
                        link.visible = true
                        link.label_visible = true
                      }
                    )
                    set_data({ ...data })
                  }
                }
              >Reset visible</Button>
            </Col>
          </Form.Group>
        </Form>
      </Tab>
      {children}
    </Tabs>


  )
}

const SankeySettingsEditionTagsPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  getValueIndex: PropTypes.func.isRequired
}
type SankeySettingsEditionTagsTypes = InferProps<typeof SankeySettingsEditionTagsPropTypes>

const SankeySettingsEditionTags: FunctionComponent<SankeySettingsEditionTagsTypes> = ({data, set_data,getValueIndex}) => {
  const [tags_group_key,set_tags_group_key] = useState(Object.keys(data.tags_catalog).length>0 ? Object.keys(data.tags_catalog)[0] : '')
  //const [tag_key, set_tag_key] = useState('')

  console.log(data)

  const { links, tags_catalog } = data

  const value_index = getValueIndex(data)
  let max_link_value = 0
  links.forEach(link => {
    if (link.value[value_index] > max_link_value) {
      max_link_value = link.value[value_index]
    }
  })
  max_link_value += 1


  //let tmp_select_group_key = selected_key_group_tag

  // if (Object.keys(tags_catalog).length > 0 && tags_catalog['tag_group_' + selected_key_group_tag] === undefined) {
  //   set_selected_key_group_tag(parseInt(Object.keys(tags_catalog)[0].slice(10)))
  //   tmp_select_group_key = parseInt(Object.keys(tags_catalog)[0].slice(10))

  // }

  // if (tags_catalog[tag_group_id]) {
  //   const tag_group_name = tags_catalog[tag_group_id].group_name
  //   if (!selected_tags[tag_group_name]) {
  //     selected_tags[tag_group_name] = []
  //   }
  // }
  // const nb_partition_elements = tags.length
  // const units = ['tMS','t','m3']
  // const nb_units = units.length

  /*   const handleBanner = (i: number, evt: React.ChangeEvent<HTMLSelectElement>) => {
      tags_catalog[i].banner = evt.target.value
      set_data({ ...data })
    } */
  const handleBanner = (tags_group_key: string, evt: React.ChangeEvent<HTMLSelectElement>) => {
    tags_catalog[tags_group_key].banner = evt.target.value
    set_data({ ...data })
  }
  // --------------------------------------------
  const handleAddTagButton = () => {
    const { tags_catalog } = data
    tags_catalog[tags_group_key].tags['element' + data.tag_idx] = { name: 'tag' + data.tag_idx, color: '',selected: true }
    data.tag_idx +=1
    set_data({ ...data })
  }

  const handleAddTagGrpButton = () => {
    const { tags_catalog } = data
    //const tab_key = Object.keys(tags_catalog)
    // let tmp_key = key_group_tag
    // if (tab_key.length > 0) {
    //   tmp_key = parseInt(tab_key[tab_key.length - 1].slice(10)) + 1
    // }
    data.tags_group_idx +=1
    tags_catalog['tag_group_' + data.tags_group_idx] = {
      group_name: 'Tag Group ' + data.tags_group_idx,
      tags: {},
      banner: 'multi'
    }
    //set_key_group_tag(tmp_key + 1)
    // if (Object.keys(tags_catalog).length == 1) {
    //   set_tags_group_key(tmp_key)
    // }
    set_tags_group_key('tag_group_' + data.tags_group_idx) 
    set_data({ ...data })
  }

  const handleDelTag = (n: string) => {
    const { tags_catalog } = data
    delete tags_catalog[tags_group_key].tags[n]

    set_data({ ...data })
  }

  const handleDelGroupTag = (i: string) => {
    const { tags_catalog } = data
    console.log(i)
    delete tags_catalog[i]
    if (Object.keys(tags_catalog).length > 0) {
      const lastElmt = Object.keys(tags_catalog)[Object.keys(tags_catalog).length - 1]
      set_tags_group_key(lastElmt)
    }
    set_data({ ...data })

  }

  // const handleBanner = (i: string, evt: React.ChangeEvent<HTMLSelectElement>) => {
  //   const { tags_catalog } = data
  //   tags_catalog[i].banner = evt.target.value
  //   set_data({ ...data })
  // }

  // const optionTag = () => {

  //   if (Object.keys(tags_catalog).length == 0) {
  //     return <option></option>
  //   } else {
  //     return Object.entries(tags_catalog[tags_group_key].tags).map(
  //       (tag, i) =>
  //         <option
  //           key={i}
  //           value={tag[0]}
  //           selected={tags_catalog[tags_group_key].tags[tag[0]] == tags_catalog[tags_group_key].tags[tag[0]]} >
  //           {tag[1].name}
  //         </option>)
  //   }
  // }
  const tagSetting = (<>
    <Form.Group as={Row} >
      <Col>
        <FormLabel >Tag Groupe:</FormLabel>
      </Col>
      <Col>
        <Form.Select onChange={
          (evt: React.ChangeEvent<HTMLSelectElement>) => {
            set_tags_group_key(evt.target.value)
            set_data({ ...data })
          }}>
          {Object.keys(tags_catalog).map(
            (key, i) =>
              <option
                key={i}
                value={key}
                selected={tags_group_key === key} >
                {tags_catalog[key].group_name}
              </option>
          )}
        </Form.Select>
      </Col>
    </Form.Group>


    <Table striped bordered hover responsive='sm' size='sm'>
      <thead>
        <tr>
          <th></th>
          <th>Nom</th>
          <th>Visible</th>
          <th>Couleur</th>
        </tr>
      </thead>
      <tbody>




        {Object.keys(tags_catalog).length > 0 && tags_group_key !=='' ? Object.keys(tags_catalog[tags_group_key].tags).map(
          (tag_key, i) => {
            return (
              <tr key={i.toString()}>
                <td style={{ 'width': '10%' }}><Button variant="danger" value='-' onClick={() => { handleDelTag(tag_key) }}>-</Button></td>

                <td style={{ 'width': '33%' }}>
                  <FormControl size='sm'
                    id={i.toString()}
                    type="text"
                    value={tags_catalog[tags_group_key].tags[tag_key].name}
                    onChange={
                      (evt: React.ChangeEvent) => {
                        const { tags_catalog } = data
                        const new_nb_element = evt.target as HTMLInputElement
                        const name = new_nb_element.value
                        tags_catalog[tags_group_key].tags[tag_key].name = name
                        set_data({ ...data })
                      }
                    } /></td>
                <td style={{ 'width': '10%' }}>
                  <Form.Check inline={true}
                    name={'element_visible' + tag_key}
                    checked={tags_catalog[tags_group_key].tags[tag_key].selected}
                    id={tag_key}
                    type='switch'
                    onChange={
                      (evt: React.ChangeEvent) => {
                        const new_nb_element = evt.target as HTMLInputElement
                        const tag_key = new_nb_element.id
                        //const name = tags_catalog[tags_group_key].tags[tag_key]
                        const visible = new_nb_element.checked
                        tags_catalog[tags_group_key].tags[tag_key].selected = visible
                        setSelectedTags(data)
                        set_data({ ...data })
                      }
                    } />
                </td>

                <td><Form.Control
                  type="color"
                  value={tags_catalog[tags_group_key].tags[tag_key].color as string}
                  onChange={
                    evt => {
                      tags_catalog[tags_group_key].tags[tag_key].color = evt.target.value
                      set_data({ ...data })
                    }
                  }
                /></td>
              </tr>
            )
          }) : (<></>)}


      </tbody>
    </Table>

    <Button variant="success" value='+' onClick={handleAddTagButton}>+</Button> </>
  )

  return (
    <>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th></th>
            <th>Nom</th>
            <th>Nombre tag</th>
            <th>Bannière</th>
          </tr>
        </thead>
        <tbody>
          {
            Object.keys(tags_catalog).map(
              (tags_group_key, i) => {
                return (
                  <tr key={i.toString()}>
                    <td style={{ 'width': '10%' }}>
                      <Button variant="danger" onClick={() => handleDelGroupTag(tags_group_key)}>-</Button>
                    </td>
                    <td>
                      <FormControl
                        id={i.toString()}
                        type="text"
                        value={tags_catalog[tags_group_key].group_name}
                        onChange={
                          (evt: React.ChangeEvent) => {
                            const { tags_catalog } = data
                            const new_name = (evt.target as HTMLInputElement).value
                            tags_catalog[tags_group_key].group_name = new_name
                            set_data({ ...data })
                          }
                        } />
                    </td>
                    <td>{Object.keys(tags_catalog[tags_group_key].tags).length}</td>
                    <Form.Select onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => handleBanner(tags_group_key, evt)}>
                      <option key={'none' + i} id='NoneBaner' selected={tags_catalog[tags_group_key].banner === 'none' || !tags_catalog[tags_group_key].banner} value='none'>None</option>
                      <option key={'one' + i} id='OneBaner' selected={tags_catalog[tags_group_key].banner === 'one'} value='one'>One</option>
                      <option key={'multi' + i} id='MultipleBaner' selected={tags_catalog[tags_group_key].banner === 'multi'} value='multi'>Multi</option>
                    </Form.Select>

                  </tr>
                )
              })
          }
        </tbody>
      </Table>

      <Button variant="success" onClick={handleAddTagGrpButton}>+</Button>

      <br></br>

      {Object.keys(tags_catalog).length > 0 ? tagSetting : <></>}
    </>
  )
}

SankeySettingsEdition.propTypes = SankeySettingsEditionPropTypes
SankeySettingsEditionTags.propTypes = SankeySettingsEditionPropTypes

export default null

export { SankeySettingsEditionTags, SankeySettingsEdition }