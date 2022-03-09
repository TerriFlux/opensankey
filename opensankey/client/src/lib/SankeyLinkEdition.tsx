import React, { FunctionComponent, useState } from 'react'
import { Row, Form, Col, FormLabel, FormCheck, Tabs, Tab } from 'react-bootstrap'
import { SankeyDataPropTypes, SankeyLinkPropTypes, SankeyLinkValue } from './types'
import PropTypes, { InferProps } from 'prop-types'
import { default_link } from './SankeyUtils'


const SankeyLinkEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  selected_link: PropTypes.shape({current:PropTypes.shape(SankeyLinkPropTypes).isRequired}).isRequired,
  show: PropTypes.bool.isRequired
}

type SankeyLinkEditionTypes = InferProps<typeof SankeyLinkEditionPropTypes>

const SankeyLinkEdition: FunctionComponent<SankeyLinkEditionTypes> = (
  { data, set_data, selected_link, children }
) => {
  const { dataTags } = data
  const tags_visible = Object.keys(dataTags).filter(key => dataTags[key].banner === 'display').length > 0
  const [tags_group_key, set_tags_group_key] = useState(tags_visible ? Object.keys(dataTags).filter(key => dataTags[key].banner === 'display')[0] : '')
  // let link = selected_link
  // if (link === undefined) {
  //   link = default_link(data)
  // }

  const newEntries = new Map(Object.entries(dataTags).filter(([, dataTag]) => dataTag.banner !== 'display').map(([dataTagKey, dataTag]) => {
    return (Object.keys(dataTag.tags).length > 0) ? [
      dataTagKey, 
      Object.entries(dataTag.tags).filter(tag => tag[1].selected).length>0 ? Object.entries(dataTag.tags).filter(tag => tag[1].selected)[0][0] : Object.keys(dataTag.tags)[0]] : ['n', 'n']
  }))
  //Créer un objet contenant la clé de chaque dataTag avec pour valeur la première tag de ces groupe
  const dataTagsSelected = Object.fromEntries(newEntries)
  //supprime les groupe tag qui n'ont pas de tag car on ne peux pas choisir de tags pour affecter une valeur au flux
  delete dataTagsSelected['n']
  const [tags_selected, set_tags_selected] = useState(dataTagsSelected)
  if (Object.keys(tags_selected).length !== Object.keys(dataTagsSelected).length) {
    set_tags_selected(dataTagsSelected)
  }

  //renvoie la valeur correspondant aux paramètre selectionné 
  const value_selected_parameter = (): SankeyLinkValue => {
    let val = JSON.parse(JSON.stringify(Object(selected_link.current.value)))
    Object.values(tags_selected).map(tag_selected => {
      if (val[tag_selected] === undefined) {
        val[tag_selected] = {}
      }
      val = val[tag_selected]
    })
    return val
  }
  const center = selected_link.current.left_horiz_shift && selected_link.current.right_horiz_shift ? (selected_link.current.left_horiz_shift + selected_link.current.right_horiz_shift)/2 : 0.5

  return (

    <Row>
      <Col sm={12}>
        <Tabs defaultActiveKey="flux_data" id="settings-layout">
          <Tab eventKey="flux_data" title="Données">
            <Form >
              

              {
                //Définition des valeurs selon les paramètre dataTags
                Object.entries(data.dataTags).filter(([, dataTag]) => dataTag.banner !== 'display').map(([dataTagKey, dataTag]) => {
                  if (Object.keys(dataTag.tags).length != 0) {

                    return (
                      <Row key={dataTagKey}>
                        <Col >
                          <FormLabel>
                            {dataTag.group_name} :
                          </FormLabel>
                        </Col>

                        <Col >

                          <Form.Select
                            name={dataTagKey}
                            value={tags_selected[dataTagKey]}
                            onChange={
                              (evt: React.ChangeEvent<HTMLSelectElement>) => {
                                //Modifie les paramètres selectionnés 
                                const { name, value } = evt.target
                                set_tags_selected(prevState => ({
                                  ...prevState,
                                  [name]: value
                                }))
                              }
                            }
                          >
                            {Object.entries(dataTag.tags).map(([tag_key, tag]) => {
                              return (
                                <option key={tag.name} value={tag_key}>{tag.name}</option>
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
                    value={value_selected_parameter().value}
                    onChange={
                      evt => {
                        let val = Object(selected_link.current.value)
                        Object.values(tags_selected).forEach(tag => {
                          if (val[tag] === undefined) {
                            val[tag] = {}
                          }
                          val = val[tag]
                        })
                        val.value = +evt.target.value
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
                    value={value_selected_parameter().display_value}
                    onChange={
                      evt => {
                        let val = Object(selected_link.current.value)
                        Object.values(tags_selected).forEach(tag => {
                          if (val[tag] === undefined) {
                            val[tag] = {}
                          }
                          val = val[tag]
                        })
                        val.display_value = evt.target.value


                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
              </Row>

            </Form>
          </Tab>
          <Tab eventKey="flux_attributes" title="Apparence">
            <Form >

              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Couleur:</FormLabel>
                </Col>
                <Col>
                  <Form.Control
                    type="color"
                    value={selected_link.current.color}
                    onChange={
                      evt => {
                        selected_link.current.color = evt.target.value
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
              </Form.Group>


              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Gradient:</FormLabel>
                </Col>
                <Col>
                  <Form.Check
                    type="checkbox"
                    checked={selected_link.current.gradient}
                    onChange={
                      evt => {
                        selected_link.current.gradient = evt.target.checked
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
                    min="0" max="1" step="0.01"
                    value={center}
                    onChange={
                      evt => {
                        if ( +evt.target.value - selected_link.current.shift_gap < 0 ) {
                          return
                        }
                        if ( +evt.target.value + selected_link.current.shift_gap > 1 ) {
                          return
                        }                        
                        selected_link.current.left_horiz_shift = +evt.target.value - selected_link.current.shift_gap
                        selected_link.current.right_horiz_shift = +evt.target.value + selected_link.current.shift_gap
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
                <Col sm={2}>{center}</Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Ecart entre Poignées</FormLabel>
                </Col>
                <Col>
                  <Form.Range
                    min="0" max="0.5" step="0.01"
                    value={selected_link.current.shift_gap}
                    onChange={
                      evt => {
                        if ( center - +evt.target.value < 0 ) {
                          return
                        }
                        if ( center + +evt.target.value > 1 ) {
                          return
                        }                            
                        selected_link.current.shift_gap = +evt.target.value
                        selected_link.current.left_horiz_shift = center - selected_link.current.shift_gap
                        selected_link.current.right_horiz_shift = center + selected_link.current.shift_gap
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
                <Col sm={2}>{selected_link.current.shift_gap}</Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel>Type:</FormLabel>
                </Col>
                <Col>
                  <FormCheck
                    type='checkbox'
                    label='Courbe'
                    checked={selected_link.current.curved}
                    onChange={
                      evt => {
                        selected_link.current.curved = evt.target.checked
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
                <Col>
                  <FormCheck
                    type='checkbox'
                    label='Flêche'
                    checked={selected_link.current.arrow}
                    onChange={
                      evt => {
                        selected_link.current.arrow = evt.target.checked
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
                <Col>
                  <FormCheck
                    type='checkbox'
                    label='Recyclage'
                    checked={selected_link.current.recycling ? selected_link.current.recycling : undefined}
                    onChange={
                      evt => {
                        selected_link.current.recycling = evt.target.checked
                        delete selected_link.current.left_horiz_shift
                        delete selected_link.current.right_horiz_shift
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
                    value={selected_link.current.curvature}
                    disabled={!selected_link.current.curved}
                    onChange={
                      evt => {
                        selected_link.current.curvature = +evt.target.value
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
                <Col sm={2}>{selected_link.current.curvature}</Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col sm={12}>
                  <FormCheck
                    inline
                    name='orientation'
                    type='radio'
                    label='Horiz-Horiz'
                    value='hh'
                    checked={selected_link.current.orientation === 'hh'}
                    onChange={
                      evt => {
                        selected_link.current.orientation = evt.target.value
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
                    checked={selected_link.current.orientation === 'vv'}
                    onChange={
                      evt => {
                        selected_link.current.orientation = evt.target.value
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
                    checked={selected_link.current.orientation === 'vh'}
                    onChange={
                      evt => {
                        selected_link.current.orientation = evt.target.value
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
                    checked={selected_link.current.orientation === 'hv'}
                    onChange={
                      evt => {
                        selected_link.current.orientation = evt.target.value
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
              </Form.Group>
            </Form>
          </Tab>
          <Tab eventKey="label" title="Label">
            <Form.Group as={Row} >
              <Col>
                <FormCheck
                  value='black'
                  type='radio'
                  label='Label en noir'
                  checked={selected_link.current.text_color === 'black'}
                  onChange={
                    () => {
                      selected_link.current.text_color = 'black'
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
                  checked={selected_link.current.text_color === 'white'}
                  onChange={
                    () => {
                      selected_link.current.text_color = 'white'
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
                  checked={selected_link.current.text_color === selected_link.current.color}
                  onChange={
                    () => {
                      selected_link.current.text_color = selected_link.current.color
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
                checked={selected_link.current.label_visible}
                onChange={
                  evt => {
                    selected_link.current.label_visible = evt.target.checked
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
                  checked={selected_link.current.label_position === 'beginning'}
                  onChange={
                    evt => {
                      selected_link.current.label_position = evt.target.value
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
                  checked={selected_link.current.label_position === 'middle'}
                  onChange={
                    evt => {
                      selected_link.current.label_position = evt.target.value
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
                  checked={selected_link.current.label_position === 'end'}
                  onChange={
                    evt => {
                      selected_link.current.label_position = evt.target.value
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
                  checked={selected_link.current.label_position === 'frozen'}
                  onChange={
                    evt => {
                      selected_link.current.label_position = evt.target.value
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
                disabled={selected_link.current.label_position === 'frozen'}
                checked={selected_link.current.label_on_path && selected_link.current.label_position !== 'frozen'}
                onChange={
                  evt => {
                    selected_link.current.label_on_path = evt.target.checked
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
                  checked={selected_link.current.orthogonal_label_position === 'below'}
                  onChange={
                    evt => {
                      selected_link.current.orthogonal_label_position = evt.target.value
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
                  checked={selected_link.current.orthogonal_label_position === 'middle'}
                  onChange={
                    evt => {
                      selected_link.current.orthogonal_label_position = evt.target.value
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
                  checked={selected_link.current.orthogonal_label_position === 'above'}
                  onChange={
                    evt => {
                      selected_link.current.orthogonal_label_position = evt.target.value
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
            </Form.Group>
          </Tab>
          {Object.keys(dataTags).filter(key => dataTags[key].banner === 'display').length ? (
            <Tab eventKey="tags" title="Tags" >
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Tag Groupe:</FormLabel>
                </Col>
                <Col>
                  <FormCheck inline
                    type='switch'
                    checked={selected_link.current.colormap === tags_group_key}
                    onChange={() => {
                      selected_link.current.colormap = (selected_link.current.colormap === tags_group_key) ? '' : tags_group_key

                      set_data({ ...data })
                    }}
                  />
                </Col>
                <Col>
                  <Form.Select
                    onChange={
                      (evt: React.ChangeEvent<HTMLSelectElement>) => set_tags_group_key(evt.target.value)}>
                    {Object.entries(dataTags).filter(d => d[1].banner === 'display').map(
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
              
            </Tab>) : (<></>)}
          <Tab eventKey="flux_tooltip" title="Tooltip">
            <Form >
              <Row>
                <FormLabel column sm={1}>Tooltip:</FormLabel>
                <Col sm={11}>
                  <Form.Control
                    as="textarea"
                    rows={10}
                    value={selected_link.current.tooltip_text ? selected_link.current.tooltip_text : ''}
                    onChange={evt => {
                      selected_link.current.tooltip_text = evt.target.value.split('\n').join('\\n')
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