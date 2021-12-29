import React, { FunctionComponent, useState } from 'react'
import { Row, Form, Col, FormLabel, FormCheck, Tabs, Tab} from 'react-bootstrap'
import { SankeyDataPropTypes, SankeyLinkPropTypes } from './types'
import PropTypes, { InferProps } from 'prop-types'
import { default_link,getLinkValue } from './SankeyUtils'


const SankeyLinkEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  selected_link: PropTypes.shape(SankeyLinkPropTypes).isRequired,
  show: PropTypes.bool.isRequired
}

type SankeyLinkEditionTypes = InferProps<typeof SankeyLinkEditionPropTypes>

const SankeyLinkEdition: FunctionComponent<SankeyLinkEditionTypes> = (
  { data, set_data, selected_link, children }
) => {
  const { dataTags } = data
  const tags_visible = Object.keys(dataTags).filter(key=>dataTags[key].banner === 'display').length > 0
  const [tags_group_key, set_tags_group_key] = useState(tags_visible ? Object.keys(dataTags).filter(key=>dataTags[key].banner === 'display')[0] : '')

  let link = selected_link
  if (link === undefined) {
    link = default_link(data)
  }

  //renvoie la valeur correspondant aux paramètre selectionné 
  const value_selected_parameter = (): number => {
    let val = selected_link.value as any
    Object.keys(dataTags).filter(key=>dataTags[key].banner !== 'display' && Object.keys(dataTags[key].tags).length > 0).forEach(key => {
      const selected_tag = Object.entries(dataTags[key].tags).filter(tag=>tag[1].selected)[0][0]
      if ( val[selected_tag] ) {
        val = val[selected_tag]
      }
    })
    return val['value']
  }

  return (

    <Row>
      <Col sm={12}>
        <Tabs defaultActiveKey="flux_data" id="settings-layout">
          <Tab eventKey="flux_data" title="Données">
            <br></br>
            <Form >
              <br></br>
              {/* <Row >
                <Col>
                  <FormLabel>Affichage</FormLabel>
                </Col>
                <Col>
                  <Form.Control
                    type='text'
                    value={selected_link.display_value[value_index]}
                    onChange={
                      (evt) => {
                        selected_link.display_value[value_index] = evt.target.value
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
              </Row> */}

              {
                //Définition des valeurs selon les paramètre dataTags
                Object.entries(data.dataTags).filter(tag=>tag[1].banner !== 'display').map(d => {
                  if (Object.keys(d[1]['tags']).length != 0) {
                    return (
                      <Row key={d[0]}>
                        <Col >
                          <FormLabel>
                            {d[1]['group_name']} :
                          </FormLabel>
                        </Col>

                        <Col >

                          <Form.Select
                            name={d[0]}
                            value={d[1].tags[Object.entries(d[1].tags).filter(tag=>tag[1].selected)[0][0]].name}
                            // onChange={
                            //   (evt: React.ChangeEvent<HTMLSelectElement>) => {
                            //     //Modifie les paramètres selectionnés 
                            //     const { name, value } = evt.target
                            //     set_tags_selected(prevState => ({
                            //       ...prevState,
                            //       [name]: value
                            //     }))
                            //   }
                            // }
                          >
                            {Object.values(d[1]['tags']).map(v => {
                              return (
                                <option key={v.name} value={v.name}>{v.name}</option>
                              )
                            })}
                          </Form.Select>




                        </Col>
                      </Row>

                    )
                  }

                })}
              <Row >
                <Col>
                  <FormLabel>Valeur pour ces paramètres</FormLabel>
                </Col>
                <Col>
                  <Form.Control
                    type='text'
                    value={value_selected_parameter()}
                    onChange={
                      evt => {
                        let val = Object(selected_link.value)
                        Object.keys(dataTags).filter(key=>dataTags[key].banner !== 'display').forEach(key => {
                          const selected_tag = Object.entries(dataTags[key].tags).filter(tag=>tag[1].selected)[0][0]
                          val = val[selected_tag]
                        })
                        val['value'] = +evt.target.value
                        console.log(selected_link.value)
                        console.log(val)

                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
              </Row>
              <Row >
                <Col>
                  <FormLabel>Affichage</FormLabel>
                </Col>
                <Col>
                  <Form.Control
                    type='text'
                    value={Object.keys(data.links).length > 0 ? getLinkValue(data,selected_link.idLink).display_value : 'default'}
                    onChange={
                      evt => {
                        let val = Object(selected_link.value)
                        Object.keys(dataTags).filter(key=>dataTags[key].banner !== 'display').forEach(key => {
                          const selected_tag = Object.entries(dataTags[key].tags).filter(tag=>tag[1].selected)[0][0]
                          val = val[selected_tag]
                        })
                        val['display_value'] = evt.target.value
                        console.log(selected_link.value)
                        console.log(val)

                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
              </Row>

            </Form>
          </Tab>
          <Tab eventKey="flux_attributes" title="Apparence">
            <br></br>
            <Form >

              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Couleur:</FormLabel>
                </Col>
                <Col>
                  <Form.Control
                    type="color"
                    value={selected_link.color}
                    onChange={
                      evt => {
                        selected_link.color = evt.target.value
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Position du centre</FormLabel>
                </Col>
                <Col>
                  <Form.Range
                    min="0" max="1" step="0.05"
                    value={(selected_link.left_horiz_shift + selected_link.right_horiz_shift) / 2}
                    onChange={
                      evt => {
                        selected_link.left_horiz_shift = +evt.target.value - selected_link.shift_gap
                        selected_link.right_horiz_shift = +evt.target.value + selected_link.shift_gap
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
                <Col sm={2}>{(selected_link.left_horiz_shift + selected_link.right_horiz_shift) / 2}</Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Ecart entre Poignées</FormLabel>
                </Col>
                <Col>
                  <Form.Range
                    min="0" max="0.5" step="0.05"
                    value={selected_link.shift_gap}
                    onChange={
                      evt => {
                        selected_link.shift_gap = +evt.target.value
                        const center = (selected_link.left_horiz_shift + selected_link.right_horiz_shift) / 2
                        selected_link.left_horiz_shift = center - selected_link.shift_gap
                        selected_link.right_horiz_shift = center + selected_link.shift_gap
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
                <Col sm={2}>{selected_link.shift_gap}</Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel>Type:</FormLabel>
                </Col>
                <Col>
                  <FormCheck
                    type='checkbox'
                    label='Courbe'
                    checked={selected_link.curved}
                    onChange={
                      evt => {
                        selected_link.curved = evt.target.checked
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
                <Col>
                  <FormCheck
                    type='checkbox'
                    label='Flêche'
                    checked={selected_link.arrow}
                    onChange={
                      evt => {
                        selected_link.arrow = evt.target.checked
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
                <Col>
                  <FormCheck
                    type='checkbox'
                    label='Recyclage'
                    checked={selected_link.recycling ? selected_link.recycling : undefined}
                    onChange={
                      evt => {
                        selected_link.recycling = evt.target.checked
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
                    value={selected_link.curvature}
                    disabled={!selected_link.curved}
                    onChange={
                      evt => {
                        selected_link.curvature = +evt.target.value
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
                <Col sm={2}>{selected_link.curvature}</Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col sm={12}>
                  <FormCheck
                    inline
                    name='orientation'
                    type='radio'
                    label='Horiz-Horiz'
                    value='hh'
                    checked={selected_link.orientation === 'hh'}
                    onChange={
                      evt => {
                        selected_link.orientation = evt.target.value
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
                    checked={selected_link.orientation === 'vv'}
                    onChange={
                      evt => {
                        selected_link.orientation = evt.target.value
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
                    checked={selected_link.orientation === 'vh'}
                    onChange={
                      evt => {
                        selected_link.orientation = evt.target.value
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
                    checked={selected_link.orientation === 'hv'}
                    onChange={
                      evt => {
                        selected_link.orientation = evt.target.value
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
                  checked={selected_link.text_color === 'black'}
                  onChange={
                    () => {
                      selected_link.text_color = 'black'
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
                  checked={selected_link.text_color === 'white'}
                  onChange={
                    () => {
                      selected_link.text_color = 'white'
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
                  checked={selected_link.text_color === selected_link.color}
                  onChange={
                    () => {
                      selected_link.text_color = selected_link.color
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
                checked={selected_link.label_visible}
                onChange={
                  evt => {
                    selected_link.label_visible = evt.target.checked
                    set_data({ ...data })
                  }
                }
              />
            </Form.Group>
            <Form.Group as={Row} >
              <Col>
                <FormLabel>Position laterale:</FormLabel>
              </Col>
              <Col>
                <Form.Check
                  value='beginning'
                  type='radio'
                  label='Début'
                  checked={selected_link.label_position === 'beginning'}
                  onChange={
                    evt => {
                      selected_link.label_position = evt.target.value
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
                  checked={selected_link.label_position === 'middle'}
                  onChange={
                    evt => {
                      selected_link.label_position = evt.target.value
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
                  checked={selected_link.label_position === 'end'}
                  onChange={
                    evt => {
                      selected_link.label_position = evt.target.value
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
                  checked={selected_link.label_position === 'frozen'}
                  onChange={
                    evt => {
                      selected_link.label_position = evt.target.value
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
                disabled={selected_link.label_position === 'frozen'}
                checked={selected_link.label_on_path && selected_link.label_position !== 'frozen'}
                onChange={
                  evt => {
                    selected_link.label_on_path = evt.target.checked
                    set_data({ ...data })
                  }
                }
              />
            </Form.Group>
            <Form.Group as={Row} >
              <Col>
                <FormLabel>Position orthogonale:</FormLabel>
              </Col>
              <Col>
                <Form.Check
                  value='below'
                  type='radio'
                  label='Dessous'
                  checked={selected_link.orthogonal_label_position === 'below'}
                  onChange={
                    evt => {
                      selected_link.orthogonal_label_position = evt.target.value
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
                  checked={selected_link.orthogonal_label_position === 'middle'}
                  onChange={
                    evt => {
                      selected_link.orthogonal_label_position = evt.target.value
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
              <Col>
                <Form.Check
                  value='above'
                  type='radio'
                  label='Dessus'
                  checked={selected_link.orthogonal_label_position === 'above'}
                  onChange={
                    evt => {
                      selected_link.orthogonal_label_position = evt.target.value
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
            </Form.Group>
          </Tab>
          {Object.keys(dataTags).length ? (
            <Tab eventKey="tags" title="Tags" >
              <br></br>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Tag Groupe:</FormLabel>
                </Col>
                <Col>
                  <FormCheck inline
                    type='switch'
                    checked={link.colormap === tags_group_key}
                    onChange={() => {
                      link.colormap = (link.colormap === tags_group_key) ? '' : tags_group_key

                      set_data({ ...data })
                    }}
                  />
                </Col>
                <Col>
                  <Form.Select
                    onChange={
                      (evt: React.ChangeEvent<HTMLSelectElement>) => set_tags_group_key(evt.target.value)}>
                    {Object.entries(dataTags).filter(d=>d[1].banner === 'display').map(
                      (tags_group, i) =>
                        <option
                          key={i}
                          value={tags_group[0]}
                          selected={tags_group_key === tags_group[0]} >
                          {tags_group[1].group_name}
                        </option>)}
                  </Form.Select>
                </Col>
              </Form.Group>
              {/* <Form.Group as={Row} >
                <Table striped bordered hover className='link_tags_affiliation'>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Appartenance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tags_visible && tags_group_key != '' ? Object.entries(dataTags[tags_group_key].tags).map(
                      tags => {
                        const link_tags = selected_link.tags[tags_group_key]
                        const checked = link_tags ? link_tags.includes(tags[0]) : true
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
                                    const new_nb_element = evt.target as HTMLInputElement
                                    const tag_key = new_nb_element.id
                                    const visible = new_nb_element.checked
                                    if (visible) {
                                      if (!selected_link.tags[tags_group_key]) {
                                        selected_link.tags[tags_group_key] = []
                                      }
                                      selected_link.tags[tags_group_key].push(tag_key)
                                    } else {
                                      selected_link.tags[tags_group_key].splice(selected_link.tags[tags_group_key].indexOf(tag_key))
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
              </Form.Group> */}
            </Tab>) : (<></>)}
          <Tab eventKey="flux_tooltip" title="Tooltip">
            <Form >
              <Row>
                <FormLabel column sm={1}>Tooltip:</FormLabel>
                <Col sm={11}>
                  <Form.Control
                    as="textarea"
                    rows={10}
                    value={selected_link.tooltip_text ? selected_link.tooltip_text : ''}
                    onChange={evt => {
                      selected_link.tooltip_text = evt.target.value.split('\n').join('\\n')
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