import React, { FunctionComponent, useState } from 'react'
import { Row, Form, FormControl, FormLabel, Col, FormCheck, Tabs, Tab, Table, Button, ButtonGroup } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { SankeyDataPropTypes, SankeyNodePropTypes } from './types'
import { reorganize_node_inputLinksId,reorganize_node_outputLinksId } from './SankeyLayout'
import { default_link } from './SankeyUtils'



const SankeyNodeEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  radio_selected: PropTypes.string.isRequired,
  // set_multi_selected_nodes: PropTypes.func.isRequired,
  // multi_selected_nodes: PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired,
  multi_selected_nodes: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired}).isRequired,

}

type SankeyEditionTypes = InferProps<typeof SankeyNodeEditionPropTypes>

const SankeyNodeEdition: FunctionComponent<SankeyEditionTypes> = ({ data, set_data,
  radio_selected, multi_selected_nodes, children }) => {
  const { nodeTags } = data
  const tags_visible = Object.keys(nodeTags).length > 0
  const [tags_group_key, set_tags_group_key] = useState(tags_visible ? Object.keys(nodeTags)[0] : '')

  const display_nodes = data.nodes
  const display_links = data.links
  if ((tags_group_key == '' && Object.keys(nodeTags).length > 0) || (!Object.keys(nodeTags).includes(tags_group_key) && Object.keys(nodeTags).length > 0)) {
    set_tags_group_key(Object.keys(nodeTags)[0])
  }


  //Creation des fonctions qui check si les noeuds selectionnés ont tous la même valeurs de leurs attributs
  const isAllNodeVisible = () => {
    let visible = false
    multi_selected_nodes.current.map(d => visible = (d.shape_visible) ? true : visible)
    return visible
  }
  const isAllNodeTotal = () => {
    let show_value = false
    multi_selected_nodes.current.map(d => show_value = (d.show_value) ? true : show_value)
    return show_value
  }
  const isAllNodeRect = () => {
    let rect = true
    if (multi_selected_nodes.current.length > 0) {
      multi_selected_nodes.current.map(d => rect = (d.type !== 'sector') ? false : rect)
    } else {
      rect = false
    }
    return rect
  }
  const isAllNodeCircle = () => {
    let circle = true
    if (multi_selected_nodes.current.length > 0) {
      multi_selected_nodes.current.map(d => circle = (d.type !== 'product') ? false : circle)
    } else {
      circle = false
    }
    return circle
  }
  const isAllLabelVisible = () => {
    let visible = false
    multi_selected_nodes.current.map(d => visible = (d.label_visible) ? true : visible)
    return visible
  }

  const displayedValueNodeWidth = () => {
    let display_width = true
    let width = 0
    if (multi_selected_nodes.current.length != 0) {
      width = multi_selected_nodes.current[0].node_width
    }
    multi_selected_nodes.current.map((d) => {
      display_width = (d.node_width == width) ? display_width : false
    })
    return (display_width) ? width : 0
  }
  const displayedValueNodeHeight = () => {
    let display_height = true
    let width = 0
    if (multi_selected_nodes.current.length != 0) {
      width = multi_selected_nodes.current[0].node_height
    }
    multi_selected_nodes.current.map((d) => {
      display_height = (d.node_height == width) ? display_height : false
    })
    return (display_height) ? width : 0
  }

  const allNodeLabelFontSize = () => {
    let display_size = true
    let size = 11
    if (multi_selected_nodes.current.length != 0) {
      size = multi_selected_nodes.current[0].display_style.font_size
    }
    multi_selected_nodes.current.map((d) => {
      display_size = (d.display_style.font_size == size) ? display_size : false
    })
    return (display_size) ? size : 11
  }

  const isAllNodeBold = () => {
    let visible = true
    multi_selected_nodes.current.map(d => visible = (!d.display_style.bold) ? false : visible)
    return (multi_selected_nodes.current.length > 0) ? visible : false
  }
  const isAllNodeUpper = () => {
    let visible = true
    multi_selected_nodes.current.map(d => visible = (!d.display_style.uppercase) ? false : visible)
    return (multi_selected_nodes.current.length > 0) ? visible : false
  }
  const isAllNodeItalic = () => {
    let visible = true
    multi_selected_nodes.current.map(d => visible = (!d.display_style.italic) ? false : visible)
    return (multi_selected_nodes.current.length > 0) ? visible : false
  }

  const isAllNodeLabelVert = (arg: string, pos: string) => {
    let all_same = true
    if (multi_selected_nodes.current.length > 0) {
      if (arg == 'vert') {
        multi_selected_nodes.current.map(d => all_same = (d.display_style.label_vert !== pos) ? false : all_same)
      } else if (arg == 'horiz') {
        multi_selected_nodes.current.map(d => all_same = (d.display_style.label_horiz !== pos) ? false : all_same)
      }
    } else {
      all_same = false
    }
    return all_same
  }
  const valueAllNodeLabelBox = () => {
    let display_size = true
    let size = 110
    if (multi_selected_nodes.current.length != 0) {
      size = multi_selected_nodes.current[0].display_style.label_box_width
    }
    multi_selected_nodes.current.map((d) => {
      display_size = (d.display_style.label_box_width == size) ? display_size : false
    })
    const d = (size == 0) ? '' : size
    return (display_size) ? d : 110
  }
  const isAllIconSame = (param: string) => {
    let icon = true

    multi_selected_nodes.current.map(d => {
      icon = (d.iconName == param) ? icon : false
    })
    return icon
  }

  const valueAllIconRatio = () => {
    let display_ratio = true
    let ratio = 100
    if (multi_selected_nodes.current.length != 0) {
      ratio = multi_selected_nodes.current[0].iconRatio
    }
    multi_selected_nodes.current.map((d) => {
      display_ratio = (d.iconRatio == ratio) ? display_ratio : false
    })
    const d = (ratio == 0) ? '' : ratio
    return (display_ratio) ? d : 100
  }
  const isAllIconVisible = () => {
    let visible = false
    multi_selected_nodes.current.map(d => visible = (d.iconVisible) ? true : visible)
    return visible
  }

  //Onglet Tags du menu noeud pour selectionner un tag favorie si présent
  const node_tag = (
    <Tab eventKey="tags" title="Étiquettes"
      disabled={/*node.colorParameter !== 'groupTag'*/false} >
      <Form.Group as={Row} >
        <Col xs={2}>
          <FormLabel >Groupe d'étiquettes:</FormLabel>
        </Col>
        <Col xs={6}>
          <Form.Select
            onChange={
              (evt: React.ChangeEvent<HTMLSelectElement>) => set_tags_group_key(evt.target.value)

            }
          >
            {Object.entries(nodeTags).map(
              (tags_group, i) =>
                <option
                  key={i}
                  value={tags_group[0]}
                  selected={tags_group_key === tags_group[0]} >
                  {tags_group[1].group_name}
                </option>)}
          </Form.Select>
        </Col>
        <Col>
          <FormCheck inline
            type='switch'
            disabled={multi_selected_nodes.current.length === 0 || multi_selected_nodes.current[0].colorParameter !== 'groupTag'}
            checked={multi_selected_nodes.current.length > 0  && multi_selected_nodes.current[0].colorTag == tags_group_key}
            label='Palette'
            onChange={() => {
              multi_selected_nodes.current.forEach(node => node.colorTag = (node.colorTag === tags_group_key) ? Object.keys(nodeTags)[0] : tags_group_key)

              set_data({ ...data })
            }}
          />
        </Col>
      </Form.Group>
      <Table striped bordered hover className='node_tags_affiliation' >
        <thead>
          <tr>
            <th>Nom</th>
            <th>Appartenance</th>
          </tr>
        </thead>
        <tbody>
          {tags_visible && tags_group_key != '' && Object.keys(nodeTags).includes(tags_group_key) ? Object.entries(nodeTags[tags_group_key].tags).map(
            tags => {
              const verif = tags[0]
              let allChecked = true
              multi_selected_nodes.current.map((d) => {
                allChecked = (tags_group_key in d.tags && d.tags[tags_group_key].includes(verif)) ? allChecked : false
              })
              return (
                <tr key={tags[0]}>
                  <td><FormLabel>{tags[1].name}</FormLabel></td>
                  <td>
                    <FormCheck
                      name={'element_visible' + tags[0]}
                      checked={allChecked}
                      id={tags[0]}
                      type='checkbox'
                      onChange={
                        (evt: React.ChangeEvent) => {
                          const new_nb_element = evt.target as HTMLInputElement
                          const tag_key = new_nb_element.id
                          const visible = new_nb_element.checked
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => {
                            if (visible) {
                              if (!d.tags[tags_group_key]) {
                                d.tags[tags_group_key] = []
                              }
                              d.tags[tags_group_key].push(tag_key)
                            } else {
                              d.tags[tags_group_key].splice(d.tags[tags_group_key].indexOf(tag_key))
                            }
                          })
                          set_data({ ...data })
                        }
                      } />
                  </td>
                </tr>
              )
            }) : (<></>)}
        </tbody>
      </Table>
    </Tab >)
  return (
    <Row>
      <Col sm={12}>
        <Tabs defaultActiveKey="nodes_desc" id="node_attributes">

          {(multi_selected_nodes.current.length !== 0) ? (
            <Tab eventKey="nodes_desc" title="Apparence"
              disabled={/*!(node.colorParameter == 'local')*/false}>
              <Form >
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >Visibilité</FormLabel>
                  </Col>
                  <Col xs={1}>
                    <FormCheck inline
                      type='switch'
                      checked={isAllNodeVisible()}
                      onChange={evt => {

                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => d.shape_visible = evt.target.checked)
                        set_data({ ...data })
                      }}
                    />
                  </Col>

                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >Couleur</FormLabel>
                  </Col>
                  <Col xs={3}>
                    <Form.Control
                      type='color'
                      disabled={radio_selected !== 'local'}
                      value={(multi_selected_nodes.current.length == 1) ? multi_selected_nodes.current[0].color : '#ffffff'}
                      onChange={evt => {
                        const color = evt.target.value
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => d.color = color)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel>Forme</FormLabel>
                  </Col>
                  <Col xs={2}>
                    <FormCheck
                      value="product"
                      type='radio'
                      label='Cercle'
                      checked={isAllNodeCircle()}
                      onChange={evt => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => d.type = evt.target.value)
                        set_data({ ...data })
                      }}
                    />
                  </Col>

                  <Col xs={2}>
                    <FormCheck
                      value="sector"
                      type='radio'
                      label='Rectangle'
                      checked={isAllNodeRect()}
                      onChange={evt => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => d.type = evt.target.value)
                        set_data({ ...data })

                      }}
                    />
                  </Col>
                </Form.Group>
              </Form>
              <Form >
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >Taille minimum Largeur</FormLabel>
                  </Col>
                  <Col>
                    <FormControl
                      min={0} max={100}
                      type={'number'}
                      value={displayedValueNodeWidth()}
                      onChange={
                        evt => {
                          multi_selected_nodes.current.map(d => d.node_width = +evt.target.value)
                          //set_multi_selected_nodes(multi_selected_nodes)
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => d.node_width = +evt.target.value)
                          set_data({ ...data })
                        }
                      } />
                  </Col>
                  <Col>px</Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >Taille minimum Hauteur</FormLabel>
                  </Col>
                  <Col>
                    <FormControl
                      min={0} max={100}
                      type={'number'}
                      value={displayedValueNodeHeight()}
                      onChange={
                        evt => {
                          //set_multi_selected_nodes(multi_selected_nodes)
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => d.node_height = +evt.target.value)
                          set_data({ ...data })
                        }
                      } />
                  </Col>
                  <Col>px</Col>
                </Form.Group>


              </Form>
            </Tab>) : (<></>)}
          {(multi_selected_nodes.current.length !== 0) ? (
            <Tab eventKey="label_desc" title="Labels">
              <Form>



                <Form.Group as={Row} >
                  <Col xs={4}>Visibilité</Col>
                  <Col xs={1}>
                    <FormCheck inline
                      type='switch'
                      checked={isAllLabelVisible()}
                      onChange={evt => {

                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => d.label_visible = evt.target.checked)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >Afficher la valeur du noeud</FormLabel>
                  </Col>
                  <Col xs={1}>
                    <FormCheck inline
                      type='switch'
                      checked={isAllNodeTotal()}
                      onChange={evt => {
                      // node.shape_visible = evt.target.checked
                      // node.node_visible = node.label_visible || node.shape_visible
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => d.show_value = evt.target.checked)
                        set_data({ ...data })
                      }}
                    />
                  </Col>

                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >Taille police</FormLabel>
                  </Col>
                  <Col xs={5}>
                    <FormControl
                      min={11} max={20}
                      type={'number'}
                      value={allNodeLabelFontSize()}
                      onChange={evt => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => d.display_style.font_size = +evt.target.value)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col>px</Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={3}>
                    <FormLabel >Police</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label='Gras'
                      checked={isAllNodeBold()}
                      onChange={
                        evt => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => d.display_style.bold = evt.target.checked)
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label='Majuscule'
                      checked={isAllNodeUpper()}
                      onChange={
                        evt => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => d.display_style.uppercase = evt.target.checked)
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label='Italique'
                      checked={isAllNodeItalic()}
                      onChange={
                        evt => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => d.display_style.italic = evt.target.checked)
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel>
                    Coupure des labels
                    </FormLabel>
                  </Col>
                  <Col xs={5}>
                    <FormControl
                      value={valueAllNodeLabelBox()}
                      type={'number'}
                      placeholder={'110'}
                      min={0}
                      max={500}
                      onChange={evt => {
                        if (!isNaN(+evt.target.value)) {
                          const val = (+evt.target.value < 0) ? 0 : +evt.target.value
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => d.display_style.label_box_width = val)
                          set_data({ ...data })
                        }

                      }}
                    />
                  </Col>
                  <Col>px</Col>
                </Form.Group>


                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >Position vertical</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label='Haut'
                      checked={isAllNodeLabelVert('vert', 'haut')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => {
                            d.display_style.label_vert = 'haut'
                            delete d.x_label
                            delete d.y_label
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label='Milieu'
                      checked={isAllNodeLabelVert('vert', 'milieu')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => {
                            d.display_style.label_vert = 'milieu'
                            delete d.x_label
                            delete d.y_label
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label='Bas'

                      checked={isAllNodeLabelVert('vert', 'bas')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => {
                            d.display_style.label_vert = 'bas'
                            delete d.x_label
                            delete d.y_label
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >Position horizontal</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label='Gauche'
                      checked={isAllNodeLabelVert('horiz', 'gauche')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => {
                            d.display_style.label_horiz = 'gauche'
                            delete d.x_label
                            delete d.y_label
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label='Milieu'
                      checked={isAllNodeLabelVert('horiz', 'milieu')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => {
                            d.display_style.label_horiz = 'milieu'
                            delete d.x_label
                            delete d.y_label
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label='Droite'
                      checked={isAllNodeLabelVert('horiz', 'droite')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => {
                            d.display_style.label_horiz = 'droite'
                            delete d.x_label
                            delete d.y_label
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>
              </Form>
            </Tab>) : (<></>)}
          {(multi_selected_nodes.current.length !== 0) ? (
            <Tab eventKey="node_icon" title="Icon">
              <Form >
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >Visibilité</FormLabel>
                  </Col>
                  <Col xs={5}>
                    <FormCheck inline
                      type='switch'
                      checked={isAllIconVisible()}
                      onChange={evt => {

                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => d.iconVisible = evt.target.checked)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>


                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel>Sélection Icon</FormLabel>
                  </Col>
                  <Col xs={5}>
                    <Form.Select

                      onChange={(evt : React.ChangeEvent<HTMLSelectElement>) => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => {
                          d.iconName = evt.target.value
                        })
                        set_data({ ...data })
                      }}
                    >
                      <option key={0} value={'none'} selected={isAllIconSame('none')}>{'Aucun'}</option>

                      {Object.keys(data.icon_catalog).map((n, i) => {
                        return <option key={i + 1} value={n} selected={isAllIconSame(n)}>{n}</option>
                      })}
                    </Form.Select>
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >Couleur</FormLabel>
                  </Col>
                  <Col xs={3}>
                    <Form.Control
                      type='color'
                      disabled={radio_selected !== 'local'}
                      value={(multi_selected_nodes.current.length == 1) ? multi_selected_nodes.current[0].iconColor : '#ffffff'}
                      onChange={evt => {
                        const color = evt.target.value
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => d.iconColor = color)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >Ratio ICON/NOEUD</FormLabel>
                  </Col>
                  <Col xs={3}>
                    <Form.Control
                      type='number'
                      disabled={radio_selected !== 'local'}
                      value={valueAllIconRatio()}
                      onChange={evt => {
                        let ratio = +evt.target.value
                        ratio = (ratio > 100) ? 100 : ratio
                        ratio = (ratio < 0) ? 0 : ratio
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => d.iconRatio = ratio)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col xs={4}>
                    <FormLabel >%</FormLabel>
                  </Col>
                </Form.Group>
              </Form>
            </Tab>) : (<></>)}
          {Object.keys(nodeTags).length > 0 && multi_selected_nodes.current.length !== 0 ? node_tag : (<></>)}
          {(multi_selected_nodes.current.length !== 0) ? (
            <Tab eventKey="node_tooltip" title="Info-bulle">
              <Form >
                <Row>
                  <FormLabel column sm={1}>Info-bulle:</FormLabel>
                  <Col sm={11}>
                    <Form.Control
                      as="textarea"
                      rows={10}
                      value={multi_selected_nodes.current.length>0 && multi_selected_nodes.current[0].tooltip_text ? multi_selected_nodes.current[0].tooltip_text : ''}
                      onChange={
                        (evt) => {
                          multi_selected_nodes.current.map(node => node.tooltip_text = evt.target.value)
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Row>
              </Form>
            </Tab>): (<></>)}
          {children} 
        </Tabs>
        {(multi_selected_nodes.current.length !== 0) ? (
          <ButtonGroup as={Row}>
            <Col>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px', 'marginRight': '3px' }}
                onClick={
                  () => {
                    Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => {
                      reorganize_node_inputLinksId(d, display_nodes, display_links)
                      reorganize_node_outputLinksId(d, display_nodes, display_links)
                    })
                    set_data({ ...data })
                  }
                }
              >Réorganiser flux entrants/sortants</Button>
            </Col>
            <Col xs={4}>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px', 'marginRight': '3px' }}
                onClick={
                  () => {
                    const listId: number[] = []
                    Object.keys(data.links).forEach(elt => listId.push(Number(elt.replace('link', ''))))
                    let idLink = listId.length > 0 ? Math.max(...listId) + 1 : 0
                    Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.name).includes(f.name)).map(d => {
                      const child_nodes = Object.values(data.nodes).filter(n=>n.dimensions['Primaire'].parent_name === d.idNode)
                      const new_input_nodes : string[] = []
                      child_nodes.forEach(n1=> {
                        const input_links = n1.inputLinksId.filter(idLink => new_input_nodes.includes(data.links[idLink].idSource) === false)
                        input_links.forEach( idLink => new_input_nodes.push(data.links[idLink].idSource))
                      })
                      const new_output_nodes : string[] = []
                      child_nodes.forEach(n1=> {
                        const output_links = n1.outputLinksId.filter(idLink => new_output_nodes.includes(data.links[idLink].idSource) === false)
                        output_links.forEach( idLink => new_output_nodes.push(data.links[idLink].idTarget))
                      })
                      new_input_nodes.forEach(idSource => {
                        const new_link = default_link(data)
                        new_link.idSource = idSource
                        new_link.idTarget = d.idNode
                        new_link.idLink = 'link' + idLink
                        data.links[new_link.idLink] = new_link
                        idLink = idLink+1
                        reorganize_node_outputLinksId(data.nodes[new_link.idSource], display_nodes, display_links)
                      })
                      new_output_nodes.forEach(() => {
                        const new_link = default_link(data)
                        new_link.idSource = d.idNode
                        new_link.idLink = 'link' + idLink
                        data.links[new_link.idLink] = new_link
                        idLink = idLink+1
                        reorganize_node_inputLinksId(data.nodes[new_link.idTarget], display_nodes, display_links)
                      })
                      reorganize_node_inputLinksId(d, display_nodes, display_links)
                      reorganize_node_outputLinksId(d, display_nodes, display_links)

                      set_data({ ...data })
                    })
                  }
                }
              >Copier liens enfants</Button>
            </Col>

          </ButtonGroup>) : (<></>)}
      </Col>
    </Row >
  )
}

SankeyNodeEdition.propTypes = SankeyNodeEditionPropTypes

export default SankeyNodeEdition