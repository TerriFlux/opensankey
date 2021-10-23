import React, { useState, FunctionComponent } from 'react'
import { Button, Modal, Row, FormControl, Form, Col, FormLabel, FormCheck, Tabs, Tab, Table } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { arrangeNodes, compute_auto_sankey, updateLayout } from './SankeyLayout'
import { SankeyDataPropTypes } from './types'
import { setSelectedTags } from './SankeyUtils'

const SankeySettingsEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  set_show_graphic_attributes: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  set_current_filter: PropTypes.func.isRequired
}

type SankeyEditionTypes = InferProps<typeof SankeySettingsEditionPropTypes>

const SankeySettingsEdition: FunctionComponent<SankeyEditionTypes> = ({
  data, set_data, set_show_graphic_attributes, show, set_current_filter, children
}) => {
  let file_layout: Blob[] | undefined

  const [shift_left, set_shift_left] = useState(100)
  const [shift_top, set_shift_top] = useState(100)
  const [user_scale, set_user_scale] = useState(data.user_scale)
  const [height, set_height] = useState(data.height)
  const [width, set_width] = useState(data.width)
  const [node_hspace, set_node_hspace] = useState(100)
  const [tag_group_id, set_tag_group_id] = useState(0)

  const { display_style, tags_catalog, links, nodes, node_width } = data
  const { filter } = display_style

  let region_index = 0
  const tags_group = tags_catalog.filter(tags_group => tags_group.group_name === 'Regions')
  if (tags_group.length > 1) {
    region_index = tags_group[0].tags.indexOf(tags_group[0].selected_tags[0])
  }

  let max_link_value = 0
  links.forEach(link => {
    if (link.value[region_index] > max_link_value) {
      max_link_value = link.value[region_index]
    }
  })
  max_link_value += 1

  const current_tags_group = tags_catalog[tag_group_id]
  let selected_tags : string[] = []
  if (current_tags_group) {
    selected_tags = current_tags_group.selected_tags
  }
  // const nb_partition_elements = tags.length
  // const units = ['tMS','t','m3']
  // const nb_units = units.length

  return (
    <Modal
      size="lg"
      show={show}
      onHide={() => set_show_graphic_attributes(false)}
    >
      <Modal.Header closeButton>
        <Modal.Title>Réglages</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
                  <FormLabel>Espacement Horizontal</FormLabel>
                </Col>
                <Col>
                  <FormControl
                    type="text"
                    value={node_hspace}
                    onChange={evt => set_node_hspace(+evt.target.value)}
                  />
                </Col>
                <Col>
                  <Button
                    size="sm"
                    onClick={() => arrangeNodes(data)}
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
                          node=> {
                            node.visible = true
                            node.label_visible = true
                          }
                        ) 
                        set_data({...data})
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
          <Tab eventKey="tags_groups" title="Tags Groups" >
            <Form.Group as={Row} >
              <Col>
                <FormLabel >Nb tags groupes:</FormLabel>
              </Col>
              <Col>
                <FormControl
                  type="text"
                  value={Object.keys(tags_catalog).length}
                  onChange={
                    (evt: React.ChangeEvent) => {
                      const new_nb_element = +(evt.target as HTMLInputElement).value
                      const length = tags_catalog.length
                      if (tags_catalog.length < new_nb_element) {
                        for (let i = length; i < new_nb_element; i++) {
                          tags_catalog[i] = {
                            group_name: 'Tag Group ' + i,
                            tags: [],
                            selected_tags: []
                          }
                        }
                      } else {
                        for (let i = new_nb_element; i < length; i++) {
                          delete tags_catalog[i]
                        }
                      }
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
            </Form.Group>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Nom</th>
                </tr>
              </thead>
              <tbody>
                {tags_catalog.map(
                  (tags_group, i) => {
                    return (
                      <tr key={i.toString()}>
                        <td>
                          <FormControl
                            id={i.toString()}
                            type="text"
                            value={tags_group.group_name}
                            onChange={
                              (evt: React.ChangeEvent) => {
                                const new_name = (evt.target as HTMLInputElement).value
                                tags_catalog[i].group_name = new_name
                                set_data({ ...data })
                              }
                            } />
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </Table>
          </Tab>
          <Tab eventKey="tags" title="Tags" >
            <br></br>
            <Form.Group as={Row} >
              <Col>
                <FormLabel >Tag Groupe:</FormLabel>
              </Col>
              <Col>
                <Form.Select
                  onChange={
                    (evt: React.ChangeEvent<HTMLSelectElement>) => set_tag_group_id(+evt.target.value)}>
                  {tags_catalog.map(
                    (tags_group, i) =>
                      <option
                        key={i}
                        value={i}
                        selected={tag_group_id === i} >
                        {tags_group.group_name}
                      </option>)}
                </Form.Select>
              </Col>
            </Form.Group>
            <Form.Group as={Row} >
              <Col>
                <FormLabel >Nb éléments:</FormLabel>
              </Col>
              <Col>
                <FormControl
                  type="text"
                  value={tags_catalog.length > 0 ? current_tags_group.tags.length : 0}
                  onChange={
                    (evt: React.ChangeEvent) => {
                      const new_nb_element = Number((evt.target as HTMLInputElement).value)
                      const length = current_tags_group.tags.length
                      if (current_tags_group.tags.length < new_nb_element) {
                        for (let i = length; i < new_nb_element; i++) {
                          current_tags_group.tags.push('Element ' + i)
                        }
                      } else {
                        for (let i = new_nb_element; i < length; i++) {
                          current_tags_group.tags.pop()
                        }
                      }
                      set_data({ ...data })
                    }
                  }
                />
              </Col>

              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Visible</th>
                    <th>Couleur</th>
                  </tr>
                </thead>
                <tbody>
                  {tags_catalog.length > 0 ? (current_tags_group.tags.map(
                    (tag, i) => {
                      return (
                        <tr key={i.toString()}>
                          <td><FormControl
                            id={i.toString()}
                            type="text"
                            value={tag}
                            onChange={
                              (evt: React.ChangeEvent) => {
                                const new_nb_element = evt.target as HTMLInputElement
                                const id = +new_nb_element.id
                                const name = new_nb_element.value
                                current_tags_group.tags[id] = name
                                set_data({ ...data })
                              }
                            } /></td>
                          <td>
                            <Form.Check
                              name={'element_visible' + tag}
                              checked={selected_tags.includes(current_tags_group.tags[i])}
                              id={i.toString()}
                              type='checkbox'
                              onChange={
                                (evt: React.ChangeEvent) => {
                                  const new_nb_element = evt.target as HTMLInputElement
                                  const id = +new_nb_element.id
                                  const name = current_tags_group.tags[id]
                                  const visible = new_nb_element.checked
                                  if (visible) {
                                    if (!selected_tags) {
                                      selected_tags = []
                                    }
                                    selected_tags.push(name)
                                  } else {
                                    selected_tags.splice(selected_tags.indexOf(name), 1)
                                  }
                                  setSelectedTags(data)
                                  set_data({ ...data })
                                }
                              } />
                          </td>
                          <td></td>
                        </tr>
                      )
                    })) : (<></>)}
                </tbody>
              </Table>
            </Form.Group>
          </Tab>
          {children}
        </Tabs>
      </Modal.Body>
    </Modal>

  )
}

SankeySettingsEdition.propTypes = SankeySettingsEditionPropTypes

export default SankeySettingsEdition