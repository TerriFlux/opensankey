import React, { FunctionComponent, useState } from 'react'
import { Modal, Row, Form, Col, FormLabel, FormCheck, Tabs, Tab, Table } from 'react-bootstrap'
import { SankeyDataPropTypes, SankeyLink } from './types'
import PropTypes, { InferProps } from 'prop-types'
import { linkTooltipsContent } from './SankeyTooltip'
import { default_link } from './SankeyUtils'

const SankeyLinkEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  set_show_link: PropTypes.func.isRequired,
  selected_link: PropTypes.number.isRequired,
  show: PropTypes.bool.isRequired,
  getValueIndex: PropTypes.func.isRequired,
}

type SankeyLinkEditionTypes = InferProps<typeof SankeyLinkEditionPropTypes>

const SankeyLinkEdition: FunctionComponent<SankeyLinkEditionTypes> = (
  { data, set_data, set_show_link, selected_link, show, getValueIndex, children }
) => {
  const [tag_group_id, set_tag_group_id] = useState(0)
  const [duplicate, set_duplicate] = useState(false)

  const source_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    const { nodes, links } = data
    let link = links[selected_link]
    if (duplicate) {
      link = JSON.parse(JSON.stringify(links[selected_link]))
      links.push(link)
      selected_link = links.length - 1
      const target_node = nodes.filter(n => n.name === link.target_name)[0]
      target_node.input_links.push(selected_link)
    } else {
      const previous_node = nodes.filter(n => n.name === link.target_name)[0]
      const link_pos = previous_node.output_links.indexOf(selected_link)
      previous_node.output_links.splice(link_pos, 1)
    }

    const source_node = nodes.filter(n => n.name === changeEvent.target.value)[0]
    link.source_name = source_node.name
    source_node.output_links.push(selected_link)

    set_data({ ...data })
  }

  const target_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    const { nodes, links } = data
    let link = links[selected_link]
    if (duplicate) {
      link = JSON.parse(JSON.stringify(links[selected_link]))
      links.push(link)
      selected_link = links.length - 1
      const source_node = nodes.filter(n => n.name === link.source_name)[0]
      source_node.output_links.push(selected_link)
    } else {
      const previous_node = nodes.filter(n => n.name === link.target_name)[0]
      const link_pos = previous_node.input_links.indexOf(selected_link)
      previous_node.input_links.splice(link_pos, 1)
    }

    const target_node = nodes.filter(n => n.name === changeEvent.target.value)[0]
    link.target_name = target_node.name
    target_node.input_links.push(selected_link)

    set_data({ ...data })
  }

  const { links, nodes, tags_catalog } = data
  if (selected_link === -1) {
    selected_link = 0
  }
  const selected_links: SankeyLink[] = []
  const the_link = links[selected_link]
  selected_links.push(the_link)

  let link = links[selected_link]
  if (selected_links[0] === undefined) {
    selected_links[0] = default_link()
    link = selected_links[0]
  }

  const value_index = getValueIndex(data)

  const tags_visible = tags_catalog.length > 0

  return (
    <Modal size="lg" show={show} onHide={(() => set_show_link(false))}>
      <Modal.Header closeButton>
        <Modal.Title>FLUX</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col sm={12}>
            <Tabs defaultActiveKey="flux_data" id="settings-layout">
              <Tab eventKey="flux_data" title="Données">
                <br></br>
                <Form >
                  <Row>
                    <Col>
                      <FormLabel>Source</FormLabel>
                    </Col>
                    <Col>
                      <Form.Select onChange={source_change}>
                        {nodes.map((n, i) => <option key={i} value={n.name} selected={selected_links[0].source_name === n.name} >{n.name}</option>)}
                      </Form.Select>
                    </Col>
                  </Row>
                  <br></br>
                  <Row>
                    <Col>
                      <FormLabel>Cible</FormLabel>
                    </Col>
                    <Col>
                      <Form.Select onChange={target_change}>
                        {nodes.map((n, i) => <option key={i} value={n.name} selected={selected_links[0].target_name === n.name} >{n.name}</option>)}
                      </Form.Select>
                    </Col>
                  </Row>
                  <br></br>
                  <Row>
                    <Col>
                      <FormLabel>Valeur</FormLabel>
                    </Col>
                    <Col>
                      <Form.Control
                        type='text'
                        value={link.value[value_index]}
                        onChange={
                          (evt) => {
                            links[selected_link].value[value_index] = +evt.target.value
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                  </Row>
                  <br></br>
                  <Row >
                    <Col>
                      <FormLabel>Affichage</FormLabel>
                    </Col>
                    <Col>
                      <Form.Control
                        type='text'
                        value={link.display_value[value_index]}
                        onChange={
                          (evt) => {
                            links[selected_link].display_value[value_index] = evt.target.value
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                  </Row>
                  <Form.Group as={Row} >
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label='Dupliquer'
                        checked={duplicate}
                        onChange={
                          evt => set_duplicate(evt.target.checked)
                        }
                      />
                    </Col>
                  </Form.Group>
                </Form>
              </Tab>
              <Tab eventKey="flux_attributes" title="Apparence">
                <br></br>
                <Form >
                  <Form.Group as={Row} >
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label='Visible'
                        checked={selected_links[0].visible || selected_links[0].visible === undefined}
                        onChange={
                          evt => {
                            selected_links.forEach(
                              l => l.visible = evt.target.checked
                            )
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel >Couleur:</FormLabel>
                    </Col>
                    <Col>
                      <Form.Control
                        type="color"
                        defaultValue={link.color}
                        onChange={
                          evt => {
                            selected_links.forEach(
                              l => l.color = evt.target.value
                            )
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel >Courbure</FormLabel>
                    </Col>
                    <Col>
                      <Form.Range
                        min="0" max="1" step="0.1"
                        value={link.curvature}
                        onChange={
                          evt => {
                            selected_links.forEach(
                              l => l.curvature = +evt.target.value
                            )
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                    <Col sm={2}>{link.curvature}</Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel>Type:</FormLabel>
                    </Col>
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label='Courbe'
                        checked={link.curved}
                        onChange={
                          evt => {
                            selected_links.forEach(
                              l => l.curved = evt.target.checked
                            )
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label='Flêche'
                        checked={link.arrow}
                        onChange={
                          evt => {
                            selected_links.forEach(
                              l => l.arrow = evt.target.checked
                            )
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label='Recyclage'
                        checked={link.recycling ? link.recycling : undefined}
                        onChange={
                          evt => {
                            selected_links.forEach(
                              l => l.recycling = evt.target.checked
                            )
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col sm={12}>
                      <FormCheck
                        inline
                        name='orientation'
                        type='radio'
                        label='Horiz-Horiz'
                        value='hh'
                        checked={link.orientation === 'hh'}
                        onChange={
                          evt => {
                            selected_links.forEach(
                              l => l.orientation = evt.target.value
                            )
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
                        checked={link.orientation === 'vv'}
                        onChange={
                          evt => {
                            selected_links.forEach(
                              l => l.orientation = evt.target.value
                            )
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
                        checked={link.orientation === 'vh'}
                        onChange={
                          evt => {
                            selected_links.forEach(
                              l => l.orientation = evt.target.value
                            )
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
                        checked={link.orientation === 'hv'}
                        onChange={
                          evt => {
                            selected_links.forEach(
                              l => l.orientation = evt.target.value
                            )
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                  </Form.Group>
                </Form>
              </Tab>
              <Tab eventKey="label" title="Label">
                <br />
                <Form.Group as={Row} >
                  <Col>
                    <FormCheck
                      value='black'
                      type='radio'
                      label='Label en noir'
                      checked={link.text_color === 'black'}
                      onChange={
                        () => {
                          selected_links.forEach(
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
                      checked={link.text_color === 'white'}
                      onChange={
                        () => {
                          selected_links.forEach(
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
                      checked={link.text_color === link.color}
                      onChange={
                        () => {
                          selected_links.forEach(
                            l => l.text_color = l.color
                          )
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>
                <Form.Group >
                  <FormCheck
                    type='checkbox'
                    label='Label visible'
                    checked={link.label_visible || link.label_visible === undefined}
                    onChange={
                      evt => {
                        selected_links.forEach(
                          l => l.label_visible = evt.target.checked
                        )
                        set_data({ ...data })
                      }
                    }
                  />
                </Form.Group>
                <Form.Group as={Row} >
                  <Col>
                    <FormLabel>Position:</FormLabel>
                  </Col>
                  <Col>
                    <Form.Check
                      value='beginning'
                      type='radio'
                      label='Début'
                      checked={link.label_position === 'beginning'}
                      onChange={
                        evt => {
                          selected_links.forEach(
                            l => l.label_position = evt.target.value
                          )
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <Form.Check
                      value='middle'
                      type='radio'
                      label='Milieu'
                      checked={link.label_position === 'middle'}
                      onChange={
                        evt => {
                          selected_links.forEach(
                            l => l.label_position = evt.target.value
                          )
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <Form.Check
                      value='end'
                      type='radio'
                      label='Fin'
                      checked={link.label_position === 'end'}
                      onChange={
                        evt => {
                          selected_links.forEach(
                            l => l.label_position = evt.target.value
                          )
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <Form.Check
                      value='frozen'
                      type='radio'
                      label='Figé'
                      checked={link.label_position === 'frozen'}
                      onChange={
                        evt => {
                          selected_links.forEach(
                            l => l.label_position = evt.target.value
                          )
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>
                <Form.Group>
                  <FormCheck
                    type='checkbox'
                    label='Attaché au flux'
                    disabled={link.label_position === 'frozen'}
                    checked={link.label_on_path && link.label_position !== 'frozen'}
                    onChange={
                      evt => {
                        selected_links.forEach(
                          l => l.label_on_path = evt.target.checked
                        )
                        set_data({ ...data })
                      }
                    }
                  />
                </Form.Group>
              </Tab>
              {Object.keys(tags_catalog).length ? (
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
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Appartenance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tags_visible ? (tags_catalog[tag_group_id].tags.map(
                          (tag, tag_id) => {
                            const link_tag_groups = link.tags[tags_catalog[tag_group_id].group_name]
                            const checked = link_tag_groups ? link_tag_groups.includes(tags_catalog[tag_group_id].tags[tag_id]) : true
                            return (
                              <tr key={tag_id.toString()}>
                                <td><FormLabel>{tag}</FormLabel></td>
                                <td>
                                  <Form.Check
                                    name={'element_visible' + tag_id.toString()}
                                    checked={checked}
                                    id={tag_id.toString()}
                                    type='checkbox'
                                    onChange={
                                      (evt: React.ChangeEvent) => {
                                        const new_nb_element = evt.target as HTMLInputElement
                                        const id = +new_nb_element.id
                                        const name = tags_catalog[tag_group_id].tags[id]
                                        const visible = new_nb_element.checked
                                        const tag_group_name = tags_catalog[tag_group_id].group_name
                                        if (visible) {
                                          if (!link.tags[tag_group_name]) {
                                            link.tags[tag_group_name] = []
                                          }
                                          link.tags[tag_group_name].push(name)
                                        } else {
                                          link.tags[tag_group_name].splice(link.tags[tag_group_name].indexOf(name))
                                        }
                                        set_data({ ...data })
                                      }
                                    } />
                                </td>
                              </tr>
                            )
                          })) : (<></>)}
                      </tbody>
                    </Table>
                  </Form.Group>
                </Tab>) : (<></>)}
              <Tab eventKey="flux_tooltip" title="Tooltip">
                <Form >
                  <Row>
                    <FormLabel column sm={1}>Tooltip:</FormLabel>
                    <Col sm={11}>
                      <Form.Control
                        as="textarea"
                        rows={10}
                        value={link.tooltip_text ? link.tooltip_text : linkTooltipsContent(data,link,getValueIndex)}
                        onChange={evt => {
                          link.tooltip_text = evt.target.value.split('\n').join('\\n')
                          set_data({ ...data })
                        }}
                      />
                    </Col>
                  </Row>
                </Form>
              </Tab>
              {children}
            </Tabs>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  )
}
SankeyLinkEdition.propTypes = SankeyLinkEditionPropTypes
export default SankeyLinkEdition