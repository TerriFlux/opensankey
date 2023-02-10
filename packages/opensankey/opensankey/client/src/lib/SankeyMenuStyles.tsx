/* eslint @typescript-eslint/no-var-requires: "off" */
import React, { FunctionComponent} from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Form, FormControl, FormLabel, Row, Col, Modal, Button, Dropdown, Tabs, Tab, FormCheck } from 'react-bootstrap'
import { SankeyDataPropTypes, SankeyLinkPropTypes } from './types'

import { default_node, default_link,cut_name } from './SankeyUtils'
import { FaPlus, FaMinus} from 'react-icons/fa'


/**
 * Variable that define the Menu element, it's variable and function
 *
 * @type {{ data: any; set_data: any; right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 */
const MenuStyleNodePropTypes = {
  t:PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  setShowStyle:PropTypes.func.isRequired,
  showStyle:PropTypes.bool.isRequired,
  selected_style_node: PropTypes.string.isRequired,
  set_selected_style_node:PropTypes.func.isRequired
}


/**
 * Description placeholder
 *
 * @typedef {MenuTypes}
 */
type MenuStyleNodeTypes = InferProps<typeof MenuStyleNodePropTypes>

export const ModalStyleNode : FunctionComponent<MenuStyleNodeTypes> = ({t,data,set_data,showStyle,setShowStyle,selected_style_node, set_selected_style_node}) => { 
  const closeStyleEdition = () => {
    setShowStyle(false)
  }
  const applyStyleToNodes = () => {
    const style = data.style_node[selected_style_node]
    Object.values(data.nodes).filter(d => d.style != '' && d.style == selected_style_node).map(d => {
      //Style Noeud
      d.shape_visible = style.shape_visible
      d.color = style.color
      d.shape = style.shape


      d.node_width = style.node_width
      d.node_height = style.node_height

      //Syle label
      d.label_visible = style.label_visible
      d.show_value = style.show_value
      d.display_style.font_size = style.display_style.font_size
      d.display_style.bold = style.display_style.bold
      d.display_style.uppercase = style.display_style.uppercase
      d.display_style.italic = style.display_style.italic
      d.display_style.label_box_width = style.display_style.label_box_width
      d.display_style.label_vert = style.display_style.label_vert
      d.display_style.label_horiz = style.display_style.label_horiz
      d.display_style.font_family = style.display_style.font_family

    })

    set_data({ ...data })
  }
  return(
    <Modal show={showStyle} onHide={closeStyleEdition} size={'lg'} >
      <Modal.Header closeButton>
        <Modal.Title>Édition Style</Modal.Title>
      </Modal.Header>
      <Modal.Body>

        <Row >
          <Col xs={1}>
            <Button size="sm" onClick={() => {
              const new_style = default_node(data)
              new_style.name = 'New Style'
              const new_id = 'style_node_' + String(new Date().getTime())
              data.style_node[new_id] = new_style
              set_data({ ...data })

            }}><FaPlus /></Button>
          </Col>

          <Col xs={5}>
            <Dropdown>
              <Dropdown.Toggle variant="success" id="dropdown-basic">{(selected_style_node != '') ? cut_name(data.style_node[selected_style_node].name, 30) : 'Choix Style'}</Dropdown.Toggle>

              <Dropdown.Menu>
                {Object.keys(data.style_node).map((d,i) => {
                  return (<Dropdown.Item key={i} onClick={() => { set_selected_style_node(d) }}>{data.style_node[d].name}</Dropdown.Item>)

                })}


              </Dropdown.Menu>
            </Dropdown>
          </Col>

          <Col xs={1}>
            <Button
              size="sm"
              variant='danger'
              disabled={selected_style_node == 'default'}
              onClick={
                () => {
                  delete data.style_node[selected_style_node]
                  set_selected_style_node((Object.keys(data.style_node).length > 0) ? Object.keys(data.style_node)[0] : '')
                }
              }
            ><FaMinus /></Button>

          </Col>

          <Col xs={5}>
            <Button variant="warning" onClick={applyStyleToNodes}>{t('Noeud.apparence.asn')}</Button>
          </Col>
        </Row>

        <Form.Group as={Row} >
          <Col xs={2} >
            <FormLabel >{t('Menu.ns')}</FormLabel>
          </Col>
          <Col xs={10} >

            <FormControl
              value={
                (selected_style_node != '') ? data.style_node[selected_style_node].name : ''
              }

              onChange={evt => {
                data.style_node[selected_style_node].name = evt.target.value
                set_data({ ...data })
              }}
            />
          </Col>

        </Form.Group>


        <Col md={12}>
          <Tabs defaultActiveKey="nodes_desc" id="node_attributes">
            <Tab eventKey="nodes_desc" title={t('Noeud.apparence.apparence')}>
              <Form >
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.apparence.Visibilité')}</FormLabel>
                  </Col>
                  <Col xs={1}>
                    <FormCheck inline
                      type='switch'
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].shape_visible : false
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].shape_visible = evt.target.checked
                        set_data({ ...data })
                      }}
                    />
                  </Col>

                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.apparence.Couleur')}</FormLabel>
                  </Col>
                  <Col xs={3}>
                    <Form.Control
                      type='color'
                      value={
                        (selected_style_node != '') ? data.style_node[selected_style_node].color : '#ffffff'
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].color = evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel>{t('Noeud.apparence.Forme')}</FormLabel>
                  </Col>
                  <Col xs={2}>
                    <FormCheck
                      value="ellipse"
                      type='radio'
                      label={t('Noeud.apparence.Cercle')}

                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].shape == 'ellipse' : false
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].shape = evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>

                  <Col xs={2}>
                    <FormCheck
                      value="rect"
                      type='radio'
                      label={t('Noeud.apparence.Rectangle')}

                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].shape == 'rect' : false
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].shape = evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
              </Form>
              <Form >
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.apparence.TML')}</FormLabel>
                  </Col>
                  <Col>
                    <FormControl
                      min={0} max={100}
                      type={'number'}
                      value={
                        (selected_style_node != '') ? data.style_node[selected_style_node].node_width : 0
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].node_width = +evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>px</Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.apparence.TMH')}</FormLabel>
                  </Col>
                  <Col>
                    <FormControl
                      min={0} max={100}
                      type={'number'}

                      value={
                        (selected_style_node != '') ? data.style_node[selected_style_node].node_height : 0
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].node_height = +evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>px</Col>
                </Form.Group>


              </Form>
            </Tab>

            <Tab eventKey="label_desc" title={t('Noeud.labels.labels')}>
              <Form>

                <Row>
                  <Col xs={6}>{t('Flux.pdl')}</Col>
                  <Col xs={6}><Form.Select
                    onChange={
                      (evt: React.ChangeEvent<HTMLSelectElement>) => {
                        data.style_node[selected_style_node].display_style.font_family = evt.target.value
                        set_data({ ...data })
                      }
                    }
                  >
                    {data.display_style.font_family.map((d) => {
                      return <option
                        key={'ff-' + d}
                        value={d}
                        selected={d == data.style_node[selected_style_node].display_style.font_family}
                      >{d}</option>

                    })}
                  </Form.Select></Col>
                </Row>

                <Form.Group as={Row} >
                  <Col xs={4}>{t('Noeud.apparence.Visibilité')}</Col>
                  <Col xs={1}>
                    <FormCheck inline
                      type='switch'
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].label_visible : false
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].label_visible = evt.target.checked
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.labels.vdv')}</FormLabel>
                  </Col>
                  <Col xs={1}>
                    <FormCheck inline
                      type='switch'
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].show_value : false
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].show_value = evt.target.checked
                        set_data({ ...data })
                      }}
                    />
                  </Col>

                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.labels.tp')}</FormLabel>
                  </Col>
                  <Col xs={5}>
                    <FormControl
                      min={11} max={20}
                      type={'number'}
                      value={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.font_size : 0
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].display_style.font_size = +evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>px</Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={3}>
                    <FormLabel >{t('Noeud.labels.police')}</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label={t('LL.gras')}
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.bold : false
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].display_style.bold = evt.target.checked
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label={t('LL.maj')}
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.uppercase : false
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].display_style.uppercase = evt.target.checked
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label={t('LL.ita')}
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.italic : false
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].display_style.italic = evt.target.checked
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel>{t('Noeud.labels.cl')}</FormLabel>
                  </Col>
                  <Col xs={5}>
                    <FormControl
                      type={'number'}
                      placeholder={'110'}
                      min={0}
                      max={500}
                      value={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.label_box_width : 0
                      }

                      onChange={evt => {
                        data.style_node[selected_style_node].display_style.label_box_width = +evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>px</Col>
                </Form.Group>


                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.labels.pv')}</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.haut')}

                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.label_vert == 'top' : false
                      }

                      onChange={() => {
                        data.style_node[selected_style_node].display_style.label_vert = 'top'
                        set_data({ ...data })
                      }}

                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.Milieu')}
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.label_vert == 'middle' : false
                      }

                      onChange={() => {
                        data.style_node[selected_style_node].display_style.label_vert = 'middle'
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.Bas')}
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.label_vert == 'bottom' : false
                      }

                      onChange={() => {
                        data.style_node[selected_style_node].display_style.label_vert = 'bottom'
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.labels.ph')}</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.gauche')}
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.label_horiz == 'left' : false
                      }

                      onChange={() => {
                        data.style_node[selected_style_node].display_style.label_horiz = 'left'
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.Milieu')}
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.label_horiz == 'middle' : false
                      }

                      onChange={() => {
                        data.style_node[selected_style_node].display_style.label_horiz = 'middle'
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.droite')}
                      checked={
                        (selected_style_node != '') ? data.style_node[selected_style_node].display_style.label_horiz == 'right' : false
                      }

                      onChange={() => {
                        data.style_node[selected_style_node].display_style.label_horiz = 'right'
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
              </Form>
            </Tab>
          </Tabs>
        </Col>
        <Row>Noeuds affectés au style :{Object.values(data.nodes).filter(d => d.style == selected_style_node).map(d => d.name).join('/')}</Row>

      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeStyleEdition}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

const MenuStyleLinkPropTypes = {
  t: PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  setShowStyleLink:PropTypes.func.isRequired,
  showStyleLink:PropTypes.bool.isRequired,
  selected_link:PropTypes.shape({current:PropTypes.shape(SankeyLinkPropTypes).isRequired}).isRequired,
  selected_style_link: PropTypes.string.isRequired,
  set_selected_style_link:PropTypes.func.isRequired
}


/**
 * Description placeholder
 *
 * @typedef {MenuTypes}
 */
type MenuStyleLinkTypes = InferProps <typeof MenuStyleLinkPropTypes>
//Modal et fonctions pour l'edition et affectation des style de flux
export const ModalStyleLink : FunctionComponent<MenuStyleLinkTypes> = ({t,data,set_data,showStyleLink,setShowStyleLink,selected_link,selected_style_link, set_selected_style_link}) => { 
  const closeStyleEditionLink = () => {
    setShowStyleLink(false)
  }
  const applyStyleToLinks = () => {
    const style = data.style_link[selected_style_link]
    Object.values(data.links).filter(d => d.style != '' && d.style == selected_style_link).map(d => {
      d.recycling = style.recycling
      d.orientation = style.orientation
      d.arrow = style.arrow

      // display_attribute
      d.label_position = style.label_position
      d.orthogonal_label_position = style.orthogonal_label_position
      d.label_on_path = style.label_on_path
      d.label_visible = style.label_visible
      d.text_color = style.text_color
      d.color = style.color

      d.gradient = style.gradient

      d.curvature = style.curvature
      d.curved = style.curved
    })

    set_data({ ...data })
  }

  return (
    <Modal show={showStyleLink} onHide={closeStyleEditionLink} size={'lg'} >
      <Modal.Header closeButton>
        <Modal.Title>Édition Style</Modal.Title>
      </Modal.Header>
      <Modal.Body>

        <Row >
          <Col xs={1}>
            <Button size="sm" onClick={() => {
              const new_style = default_link(data)
              new_style.idLink = 'New Style'
              const new_id = 'style_link_' + String(new Date().getTime())
              data.style_link[new_id] = new_style
              set_data({ ...data })

            }}><FaPlus /></Button>
          </Col>

          <Col xs={5}>
            <Dropdown>
              <Dropdown.Toggle variant="success" id="dropdown-basic">{(selected_style_link != '') ? cut_name(data.style_link[selected_style_link].idLink, 30) : 'Choix Style'}</Dropdown.Toggle>

              <Dropdown.Menu>
                {Object.keys(data.style_link).map((d,i) => {

                  return (<Dropdown.Item key={i} onClick={() => { set_selected_style_link(d) }}>{data.style_link[d].idLink}</Dropdown.Item>)

                })}


              </Dropdown.Menu>
            </Dropdown>
          </Col>

          <Col xs={1}>
            <Button
              size="sm"
              variant='danger'
              disabled={selected_style_link == 'default'}
              onClick={
                () => {
                  delete data.style_link[selected_style_link]
                  set_selected_style_link((Object.keys(data.style_link).length > 0) ? Object.keys(data.style_link)[0] : '')
                }
              }
            ><FaMinus /></Button>

          </Col>

          <Col xs={5}>
            <Button variant="warning" onClick={applyStyleToLinks}>{t('Flux.asf')}</Button>
          </Col>
        </Row>

        <Form.Group as={Row} >
          <Col xs={2} >
            <FormLabel >{t('Menu.ns')}</FormLabel>
          </Col>
          <Col xs={10} >

            <FormControl
              value={
                (selected_style_link != '') ? data.style_link[selected_style_link].idLink : ''
              }

              onChange={evt => {
                data.style_link[selected_style_link].idLink = evt.target.value
                set_data({ ...data })
              }}
            />
          </Col>

        </Form.Group>


        <Row>
          <Col md={12}>
            <Tabs defaultActiveKey="flux_attributes" id="settings-layout">
              <Tab eventKey="flux_attributes" title={t('Noeud.apparence.apparence')}>
                <Form >

                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel >{t('Noeud.apparence.Visibilité')}:</FormLabel>
                    </Col>
                    <Col>
                      <Form.Control
                        type="color"
                        value={data.style_link[selected_style_link].color}
                        onChange={
                          evt => {
                            // selected_link.current.color = evt.target.value
                            const color = evt.target.value
                            data.style_link[selected_style_link].color = color
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                  </Form.Group>


                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel >{t('Flux.apparence.grad')}:</FormLabel>
                    </Col>
                    <Col>
                      <Form.Check
                        inline
                        type="checkbox"
                        checked={data.style_link[selected_style_link].gradient}
                        onChange={
                          evt => {
                            // selected_link.current.color = evt.target.value
                            data.style_link[selected_style_link].gradient = evt.target.checked
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                  </Form.Group>



                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel>{t('Flux.apparence.type')}:</FormLabel>
                    </Col>
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label={t('Flux.apparence.courbe')}
                        checked={data.style_link[selected_style_link].curved}
                        onChange={
                          evt => {
                            data.style_link[selected_style_link].curved = evt.target.checked
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label={t('Flux.apparence.fleche')}
                        checked={data.style_link[selected_style_link].arrow}
                        onChange={
                          evt => {
                            data.style_link[selected_style_link].arrow = evt.target.checked
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label={t('Flux.apparence.recy')}
                        checked={(data.style_link[selected_style_link].recycling) ? true : false}
                        onChange={
                          evt => {
                            data.style_link[selected_style_link].recycling = evt.target.checked
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel >{t('Flux.apparence.courbure')}</FormLabel>
                    </Col>

                    <Col>
                      <FormControl

                        min={0} max={1} step={0.01}
                        type={'number'}
                        value={data.style_link[selected_style_link].curvature}
                        onChange={
                          evt => {
                            data.style_link[selected_style_link].curvature = +evt.target.value

                            set_data({ ...data })
                          }
                        } />
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
                        checked={data.style_link[selected_style_link].orientation == 'hh'}
                        onChange={
                          () => {
                            data.style_link[selected_style_link].orientation = 'hh'
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
                        checked={data.style_link[selected_style_link].orientation == 'vv'}
                        onChange={
                          () => {
                            data.style_link[selected_style_link].orientation == 'vv'
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
                        checked={data.style_link[selected_style_link].orientation == 'vh'}
                        onChange={
                          () => {
                            data.style_link[selected_style_link].orientation = 'vh'
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
                        checked={data.style_link[selected_style_link].orientation == 'hv'}
                        onChange={
                          () => {
                            data.style_link[selected_style_link].orientation = 'hv'
                            set_data({ ...data })
                          }
                        }
                      />
                    </Col>
                  </Form.Group>
                </Form>
              </Tab>
              <Tab eventKey="label" title={t('Flux.label.label')}>
                <Form.Group as={Row} >
                  <Col>
                    <FormCheck
                      value='black'
                      type='radio'
                      label={t('Flux.label.len')}
                      checked={data.style_link[selected_style_link].text_color == 'black'}
                      onChange={
                        () => {
                          data.style_link[selected_style_link].text_color = 'black'
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      value='white'
                      type='radio'
                      label={t('Flux.label.lb')}
                      checked={data.style_link[selected_style_link].text_color == 'white'}
                      onChange={
                        (evt) => {
                          data.style_link[selected_style_link].text_color = evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      value='same_color'
                      type='radio'
                      label={t('Flux.label.lec')}
                      checked={data.style_link[selected_style_link].text_color == 'color'}
                      onChange={
                        () => {
                          data.style_link[selected_style_link].text_color = data.style_link[selected_style_link].color
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>
                <Form.Group >
                  <FormCheck
                    type='checkbox'
                    label='Visibilité du label'
                    checked={data.style_link[selected_style_link].label_visible}
                    onChange={
                      evt => {
                        data.style_link[selected_style_link].label_visible = evt.target.checked
                        set_data({ ...data })
                      }
                    }
                  />
                </Form.Group>
                <Form.Group as={Row} >
                  <Col>
                    <FormLabel>{t('Flux.label.pl')}:</FormLabel>
                  </Col>
                  <Col>
                    <Form.Check
                      value='beginning'
                      type='radio'
                      label={t('Flux.label.deb')}
                      checked={data.style_link[selected_style_link].label_position == 'beginning'}
                      onChange={
                        evt => {
                          data.style_link[selected_style_link].label_position = evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <Form.Check
                      value='middle'
                      type='radio'
                      label={t('Noeud.labels.Milieu')}
                      checked={data.style_link[selected_style_link].label_position == 'middle'}
                      onChange={
                        evt => {
                          data.style_link[selected_style_link].label_position = evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <Form.Check
                      value='end'
                      type='radio'
                      label={t('Flux.label.fin')}
                      checked={data.style_link[selected_style_link].label_position == 'end'}
                      onChange={
                        evt => {
                          data.style_link[selected_style_link].label_position = evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>
                <Form.Group>
                  <FormCheck
                    type='checkbox'
                    label={t('Flux.label.acf')}
                    disabled={selected_link.current.label_position === 'frozen'}
                    checked={data.style_link[selected_style_link].label_on_path}
                    onChange={
                      evt => {
                        data.style_link[selected_style_link].label_on_path = evt.target.checked
                        set_data({ ...data })
                      }
                    }
                  />
                </Form.Group>
                <Form.Group as={Row} >
                  <Col>
                    <FormLabel>{t('Flux.label.po')}:</FormLabel>
                  </Col>
                  <Col>
                    <Form.Check
                      value='below'
                      type='radio'
                      label={t('Flux.label.dessous')}
                      checked={data.style_link[selected_style_link].orthogonal_label_position == 'below'}

                      onChange={
                        evt => {
                          data.style_link[selected_style_link].orthogonal_label_position = evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <Form.Check
                      value='middle'
                      type='radio'
                      label={t('Noeud.labels.Milieu')}
                      checked={data.style_link[selected_style_link].orthogonal_label_position == 'middle'}
                      onChange={
                        evt => {
                          data.style_link[selected_style_link].orthogonal_label_position = evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <Form.Check
                      value='above'
                      type='radio'
                      label={t('Flux.label.dessus')}
                      checked={data.style_link[selected_style_link].orthogonal_label_position == 'above'}

                      onChange={
                        evt => {
                          data.style_link[selected_style_link].orthogonal_label_position = evt.target.value
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>
              </Tab>
            </Tabs>
          </Col>
        </Row>
        <Row>Noeuds affectés au style :{Object.values(data.links).filter(d => d.style == selected_style_link).map(d => d.idSource + '-->' + d.idTarget).join('/')}</Row>

      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeStyleEditionLink}>Close</Button>
      </Modal.Footer>
    </Modal>
  )

}
