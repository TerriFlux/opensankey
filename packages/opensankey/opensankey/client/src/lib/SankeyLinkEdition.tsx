import React, { FunctionComponent, useState } from 'react'
import { Row, Form, Col, FormLabel, FormCheck, Tabs, Tab, Table } from 'react-bootstrap'
import { SankeyDataPropTypes, SankeyLink, SankeyLinkPropTypes, SankeyNode } from './types'
import PropTypes, { InferProps } from 'prop-types'
import { linkTooltipsContent } from './SankeyTooltip'
import { default_link, normalize_name } from './SankeyUtils'

const SankeyLinkEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  selected_link: PropTypes.shape(SankeyLinkPropTypes).isRequired,
  show: PropTypes.bool.isRequired,
  duplicate:PropTypes.bool.isRequired,
  set_duplicate:PropTypes.func.isRequired,
  getValueIndex: PropTypes.func.isRequired,
}

type SankeyLinkEditionTypes = InferProps<typeof SankeyLinkEditionPropTypes>



const SankeyLinkEdition: FunctionComponent<SankeyLinkEditionTypes> = (
  { data, set_data, selected_link, duplicate ,set_duplicate,getValueIndex,children }
) => {
  const [tag_group_key, set_tag_group_key] = useState('')

  const { links, tags_catalog } = data
  const link = selected_link

  const value_index = getValueIndex(data)
  const tags_visible = Object.keys(data.tags_catalog).length > 0
  const last_selected_link = links.filter((t: SankeyLink) => { return (t.idLink as string) == selected_link.idLink })
  return (

    <Row>
      <Col sm={12}>
        <Tabs defaultActiveKey="flux_data" id="settings-layout">
          <Tab eventKey="flux_data" title="Données">
            <br></br>
            <Form >
              {/*  <Row>
                <Col>
                  <FormLabel>Source</FormLabel>
                </Col>
                <Col>
                  <Form.Select onChange={source_change}>
                    {addDropSource()}



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

                    {addDropCible()}

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
                        console.log(selected_link)
                        console.log(links[selected_link].value[value_index])
                        links[selected_link].value[value_index] = +evt.target.value
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
              </Row> */}
              <br></br>
              <Row >
                <Col>
                  <FormLabel>Affichage</FormLabel>
                </Col>
                <Col>
                  <Form.Control
                    type='text'
                    value={link.display_value}
                    onChange={
                      (evt) => {
                        selected_link.display_value[value_index] = evt.target.value
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
                  {
                    () => {
                      if (last_selected_link.length == 0) {
                        return ''
                      } else {
                        return (<FormCheck
                          type='checkbox'
                          label='Visible'
                          checked={
                            last_selected_link[0].visible || last_selected_link[0].visible === undefined
                          }
                          onChange={
                            evt => {
                              last_selected_link.forEach(
                                l => l.visible = evt.target.checked
                              )
                              set_data({ ...data })
                            }
                          }
                        />)
                      }
                    }
                  }

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
                        last_selected_link.forEach(
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
                        last_selected_link.forEach(
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
                        last_selected_link.forEach(
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
                        last_selected_link.forEach(
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
                        last_selected_link.forEach(
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
                        last_selected_link.forEach(
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
                        last_selected_link.forEach(
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
                        last_selected_link.forEach(
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
                        last_selected_link.forEach(
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
                      last_selected_link.forEach(
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
                      last_selected_link.forEach(
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
                      last_selected_link.forEach(
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
                    last_selected_link.forEach(
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
                      last_selected_link.forEach(
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
                      last_selected_link.forEach(
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
                      last_selected_link.forEach(
                        l => l.label_position = evt.target.value
                      )
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
              <Col>
                <FormCheck
                  value='frozen'
                  type='radio'
                  label='Figé'
                  checked={link.label_position === 'frozen'}
                  onChange={
                    evt => {
                      last_selected_link.forEach(
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
                    last_selected_link.forEach(
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
                      (evt: React.ChangeEvent<HTMLSelectElement>) => set_tag_group_key(evt.target.value)}>
                    {Object.entries(tags_catalog).map(
                      (tags_group,i) =>
                        <option
                          key={i}
                          value={tags_group[0]}
                          selected={tag_group_key === tags_group[0]} >
                          {tags_group[1].group_name}
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
                    {tags_visible && tag_group_key != '' ? Object.entries(tags_catalog[tag_group_key].tags).map(
                      tags => {
                        const link_tags = link.tags[tag_group_key]
                        const checked = link_tags ? link_tags.includes(tags_catalog[tag_group_key].tags[tags[0]].name) : true
                        return (
                          <tr key={tags[0]}>
                            <td><FormLabel>{tags[1].name}</FormLabel></td>
                            <td>
                              <FormCheck
                                name={'element_visible' + tags[0]}
                                checked={checked}
                                id={tags[0]}
                                type='checkbox'
                                onChange={
                                  (evt: React.ChangeEvent) => {
                                    const { tags_catalog } = data
                                    const new_nb_element = evt.target as HTMLInputElement
                                    const tag_key = new_nb_element.id
                                    const name = tags_catalog[tag_group_key].tags[tag_key].name
                                    const visible = new_nb_element.checked
                                    const tag_group_name = tags_catalog[tag_group_key].group_name
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
                      }) : (<></>)}
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
                    value={link.tooltip_text ? link.tooltip_text : ''}
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

  )
}

SankeyLinkEdition.propTypes = SankeyLinkEditionPropTypes

export default SankeyLinkEdition