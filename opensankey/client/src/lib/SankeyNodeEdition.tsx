import React, { FunctionComponent, useState } from 'react'
import { Row, Form, FormControl, FormLabel, Col, FormCheck, Tabs, Tab, Table, Button, ButtonGroup } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { SankeyDataPropTypes, SankeyNodePropTypes } from './types'
import { default_node } from './SankeyUtils'
import { reorganize_inputLinksId } from './SankeyLayout'



const SankeyNodeEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  selected_node: PropTypes.shape(SankeyNodePropTypes).isRequired,
  radio_selected: PropTypes.string.isRequired,
  set_multi_selected_node: PropTypes.func.isRequired,
  multi_selected_node: PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired,

}

type SankeyEditionTypes = InferProps<typeof SankeyNodeEditionPropTypes>

const SankeyNodeEdition: FunctionComponent<SankeyEditionTypes> = ({ data, set_data,
  selected_node, radio_selected, set_multi_selected_node, multi_selected_node, children }) => {
  const { tags_catalog } = data
  const tags_visible = Object.keys(tags_catalog).length > 0
  const [tags_group_key, set_tags_group_key] = useState(tags_visible ? Object.keys(tags_catalog)[0] : '')
  // let tags_group_key = tags_visible ? Object.keys(tags_catalog)[0] : ''
  const display_nodes = data.nodes
  const display_links = data.links
  if ((tags_group_key == '' && Object.keys(tags_catalog).length > 0) || (!Object.keys(tags_catalog).includes(tags_group_key) && Object.keys(tags_catalog).length > 0)) {
    set_tags_group_key(Object.keys(tags_catalog)[0])
  }

  let node = data.nodes[selected_node.idNode]
  if (node === undefined) {
    node = default_node(data)
    for (const tag_group_key in tags_catalog) {
      node.tags[tag_group_key] = []
    }
  }
  //Creation des fonctions qui check si les noeuds selectionnés ont tous la même valeurs de leurs attributs
  const isAllNodeVisible = () => {
    let visible = false
    multi_selected_node.map(d => visible = (d.shape_visible) ? true : visible)
    return visible
  }
  const isAllNodeRect = () => {
    let rect = true
    if (multi_selected_node.length > 0) {
      multi_selected_node.map(d => rect = (d.type !== 'sector') ? false : rect)
    } else {
      rect = false
    }
    return rect
  }
  const isAllNodeCircle = () => {
    let circle = true
    if (multi_selected_node.length > 0) {
      multi_selected_node.map(d => circle = (d.type !== 'product') ? false : circle)
    } else {
      circle = false
    }
    return circle
  }
  const isAllLabelVisible = () => {
    let visible = false
    multi_selected_node.map(d => visible = (d.label_visible) ? true : visible)
    return visible
  }

  const displayedValueNodeWidth = () => {
    let display_width = true
    let width = 0
    if (multi_selected_node.length != 0) {
      width = multi_selected_node[0].node_width
    }
    multi_selected_node.map((d) => {
      display_width = (d.node_width == width) ? display_width : false
    })
    return (display_width) ? width : 0
  }
  const displayedValueNodeHeight = () => {
    let display_height = true
    let width = 0
    if (multi_selected_node.length != 0) {
      width = multi_selected_node[0].node_height
    }
    multi_selected_node.map((d) => {
      display_height = (d.node_height == width) ? display_height : false
    })
    return (display_height) ? width : 0
  }

  const allNodeLabelFontSize = () => {
    let display_size = true
    let size = 11
    if (multi_selected_node.length != 0) {
      size = multi_selected_node[0].display_style.font_size
    }
    multi_selected_node.map((d) => {
      display_size = (d.display_style.font_size == size) ? display_size : false
    })
    return (display_size) ? size : 11
  }

  const isAllNodeBold = () => {
    let visible = true
    multi_selected_node.map(d => visible = (!d.display_style.bold) ? false : visible)
    return (multi_selected_node.length > 0) ? visible : false
  }
  const isAllNodeUpper = () => {
    let visible = true
    multi_selected_node.map(d => visible = (!d.display_style.uppercase) ? false : visible)
    return (multi_selected_node.length > 0) ? visible : false
  }
  const isAllNodeItalic = () => {
    let visible = true
    multi_selected_node.map(d => visible = (!d.display_style.italic) ? false : visible)
    return (multi_selected_node.length > 0) ? visible : false
  }

  const isAllNodeLabelVert = (arg: string, pos: string) => {
    let all_same = true
    if (multi_selected_node.length > 0) {
      if (arg == 'vert') {
        multi_selected_node.map(d => all_same = (d.display_style.label_vert !== pos) ? false : all_same)
      } else if (arg == 'horiz') {
        multi_selected_node.map(d => all_same = (d.display_style.label_horiz !== pos) ? false : all_same)
      }
    } else {
      all_same = false
    }
    return all_same
  }
  const valueAllNodeLabelBox = () => {
    let display_size = true
    let size = 110
    if (multi_selected_node.length != 0) {
      size = multi_selected_node[0].display_style.label_box_width
    }
    multi_selected_node.map((d) => {
      display_size = (d.display_style.label_box_width == size) ? display_size : false
    })
    const d = (size == 0) ? '' : size
    return (display_size) ? d : 110
  }
  const isAllIconSame = (param: string) => {
    let icon = true

    multi_selected_node.map(d => {
      icon = (d.iconName == param) ? icon : false
    })
    return icon
  }

  const valueAllIconRatio = () => {
    let display_ratio = true
    let ratio = 100
    if (multi_selected_node.length != 0) {
      ratio = multi_selected_node[0].iconRatio
    }
    multi_selected_node.map((d) => {
      display_ratio = (d.iconRatio == ratio) ? display_ratio : false
    })
    const d = (ratio == 0) ? '' : ratio
    return (display_ratio) ? d : 100
  }
  const isAllIconVisible = () => {
    let visible = false
    multi_selected_node.map(d => visible = (d.iconVisible) ? true : visible)
    return visible
  }



  //Onglet Tags du menu noeud pour selectionner un tag favorie si présent
  const node_tag = (
    <Tab eventKey="tags" title="Tags"
      disabled={/*node.nodeParameter !== 'groupTag'*/false} >
      <Form.Group as={Row} >
        <Col xs={2}>
          <FormLabel >TagGroupe:</FormLabel>
        </Col>
        <Col xs={6}>
          <Form.Select
            onChange={
              (evt: React.ChangeEvent<HTMLSelectElement>) => set_tags_group_key(evt.target.value)

            }
          >
            {Object.entries(tags_catalog).map(
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
            disabled={node.nodeParameter !== 'groupTag'}
            checked={node.colorTag == tags_group_key}
            label='Palette'
            onChange={() => {
              node.colorTag = (node.colorTag === tags_group_key) ? Object.keys(tags_catalog)[0] : tags_group_key

              set_data({ ...data })
            }}
          />
        </Col>
      </Form.Group>
      <Form.Group xs={12} as={Row} >
        <Table striped bordered hover className='node_tags_affiliation'>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Appartenance</th>
            </tr>
          </thead>
          <tbody>
            {tags_visible && tags_group_key != '' && Object.keys(tags_catalog).includes(tags_group_key) ? Object.entries(tags_catalog[tags_group_key].tags).map(
              tags => {
                // const node_tags = node.tags[tags_group_key]
                const verif = tags[0]
                let allChecked = true
                multi_selected_node.map((d) => {
                  allChecked = (d.tags[tags_group_key].includes(verif)) ? allChecked : false
                })
                // const checked = node_tags ? node_tags.includes(tags[0]) : false
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

                            // if (visible) {
                            //   if (!node.tags[tags_group_key]) {
                            //     node.tags[tags_group_key] = []
                            //   }
                            //   node.tags[tags_group_key].push(tag_key)
                            // } else {
                            //   node.tags[tags_group_key].splice(node.tags[tags_group_key].indexOf(tag_key))
                            // }

                            Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => {
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
      </Form.Group>
    </Tab >)
  return (
    <Row>
      <Col sm={12}>
        <Tabs defaultActiveKey="nodes_desc" id="settings-layout">
          <Tab eventKey="nodes_desc" title="Description"
            disabled={/*!(node.nodeParameter == 'local')*/false}>
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
                      // node.shape_visible = evt.target.checked
                      // node.node_visible = node.label_visible || node.shape_visible
                      Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => d.shape_visible = evt.target.checked)
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
                    value={(multi_selected_node.length == 1) ? multi_selected_node[0].color : '#ffffff'}
                    onChange={evt => {
                      const color = evt.target.value
                      Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => d.color = color)
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
                    label='Circle'
                    checked={isAllNodeCircle()}
                    onChange={evt => {
                      // node.type = evt.target.value
                      Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => d.type = evt.target.value)
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
                      // node.type = evt.target.value
                      Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => d.type = evt.target.value)
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
                        multi_selected_node.map(d => d.node_width = +evt.target.value)
                        set_multi_selected_node(multi_selected_node)
                        Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => d.node_width = +evt.target.value)
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
                        // multi_selected_node.map(d => d.node_width = +evt.target.value)
                        set_multi_selected_node(multi_selected_node)
                        Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => d.node_height = +evt.target.value)
                        set_data({ ...data })
                      }
                    } />
                </Col>
                <Col>px</Col>
              </Form.Group>


            </Form>
          </Tab>
          {<Tab eventKey="label_desc" title="Labels">
            <Form>



              <Form.Group as={Row} >
                <Col xs={4}>Visibilité</Col>
                <Col xs={1}>
                  <FormCheck inline
                    type='switch'
                    checked={isAllLabelVisible()}
                    onChange={evt => {
                      // node.label_visible = evt.target.checked
                      // node.node_visible = node.label_visible || node.shape_visible
                      Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => d.label_visible = evt.target.checked)
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
                      // data.display_style.font_size = +evt.target.value
                      Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => d.display_style.font_size = +evt.target.value)
                      set_data({ ...data })
                    }}
                  />
                </Col>
                <Col>px</Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col xs={3}>
                  <FormLabel >Font</FormLabel>
                </Col>
                <Col>
                  <FormCheck
                    type='checkbox'
                    label='Gras'
                    checked={isAllNodeBold()}
                    onChange={
                      evt => {
                        // data.display_style.sector_bold = evt.target.checked
                        Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => d.display_style.bold = evt.target.checked)
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
                        // data.display_style.sector_uppercase = evt.target.checked
                        Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => d.display_style.uppercase = evt.target.checked)
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
                        // data.display_style.sector_italic = evt.target.checked
                        Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => d.display_style.italic = evt.target.checked)
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
                        Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => d.display_style.label_box_width = val)
                        set_data({ ...data })
                      }
                      // else if(evt.target.value==''){
                      //   Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => d.display_style.label_box_width = 110)
                      //   set_data({ ...data })
                      // }
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
                        // data.display_style.sector_uppercase = evt.target.checked
                        Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => {
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
                        // data.display_style.sector_uppercase = evt.target.checked
                        Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => {
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
                        // data.display_style.sector_uppercase = evt.target.checked
                        Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => {
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
                        // data.display_style.sector_uppercase = evt.target.checked
                        Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => {
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
                        // data.display_style.sector_uppercase = evt.target.checked
                        Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => {
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
                        // data.display_style.sector_uppercase = evt.target.checked
                        Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => {
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
          </Tab>}
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
                      // node.shape_visible = evt.target.checked
                      // node.node_visible = node.label_visible || node.shape_visible
                      Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => d.iconVisible = evt.target.checked)
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

                    onChange={evt => {
                      Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => {
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
                    value={(multi_selected_node.length == 1) ? multi_selected_node[0].iconColor : '#ffffff'}
                    onChange={evt => {
                      const color = evt.target.value
                      Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => d.iconColor = color)
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
                      Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => d.iconRatio = ratio)
                      set_data({ ...data })
                    }}
                  />
                </Col>
                <Col xs={4}>
                  <FormLabel >%</FormLabel>
                </Col>
              </Form.Group>
            </Form>
          </Tab>

          {Object.keys(tags_catalog).length > 0 ? node_tag : (<></>)}
          <Tab eventKey="node_tooltip" title="Tooltip">
            <Form >
              <Row>
                <FormLabel column sm={1}>Tooltip:</FormLabel>
                <Col sm={11}>
                  <Form.Control
                    as="textarea"
                    rows={10}
                    value={node.tooltip_text ? node.tooltip_text : ''}
                    onChange={
                      (evt) => {
                        node.tooltip_text = evt.target.value.split('\n').join('\\n')
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
              </Row>
            </Form>
          </Tab>
          <Tab eventKey="node_parameter" title="Déplacements">
            <ButtonGroup style={{ 'marginLeft': '10px' }}>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px', 'marginRight': '3px' }}
                onClick={
                  () => {
                    // const current_x = selected_node.x
                    // const current_prev_y = selected_node.y - data.v_space
                    // const node_to_replace = Object.values(display_nodes).filter(n => n.node_visible && n.x === current_x && n.y === current_prev_y)[0]
                    // if (node_to_replace !== undefined) {
                    //   node_to_replace.y = selected_node.y
                    // }
                    // selected_node.y = selected_node.y - data.v_space

                    Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => {
                      // const current_x = d.x
                      // const current_prev_y = d.y - data.v_space
                      // const node_to_replace = Object.values(display_nodes).filter(n => n.node_visible && n.x === current_x && n.y === current_prev_y)[0]
                      // if (node_to_replace !== undefined) {
                      //   node_to_replace.y = d.y
                      // }
                      // // d.y = d.y - data.v_space
                      
                      //Réalligne les noeuds sélectionnés avec le grillage de fond, si le noeud est à la même hauteur alors ils remonte d'un cran
                      const n_pos=Math.trunc(d.y/data.grid_square_size)
                      d.y=(n_pos*data.grid_square_size==d.y)?(n_pos-1)*data.grid_square_size:n_pos*data.grid_square_size

                    })
                    set_data({ ...data })
                  }
                }
              >Monter</Button>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px', 'marginRight': '3px' }}
                onClick={
                  () => {
                    Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => {
                      // const current_x = d.x
                      // const current_prev_y = d.y + data.v_space
                      // const node_to_replace = Object.values(display_nodes).filter(n => n.node_visible && n.x === current_x && n.y === current_prev_y)[0]
                      // if (node_to_replace !== undefined) {
                      //   node_to_replace.y = d.y
                      // }
                      // d.y = d.y + data.v_space

                      //Réalligne les noeuds sélectionnés avec le grillage de fond en descendant
                      const n_pos=Math.trunc(d.y/data.grid_square_size)
                      d.y=(n_pos+1)*data.grid_square_size
                    })

                    set_data({ ...data })
                  }
                }
              >Descendre</Button>
            </ButtonGroup>
            <ButtonGroup style={{ 'marginLeft': '10px' }}>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px' }}
                onClick={
                  () => {
                    Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => {
                      // const current_prev_x = Math.round(d.x / data.h_space) * data.h_space - data.h_space
                      // const current_y = d.y
                      // const node_to_replace = Object.values(display_nodes).filter(n => n.node_visible && n.x === current_prev_x && n.y === current_y)[0]
                      // if (node_to_replace !== undefined) {
                      //   node_to_replace.x = Math.round(d.x / data.h_space) * data.h_space
                      // }
                      // d.x = current_prev_x

                      const n_pos=Math.trunc(d.x/data.grid_square_size)
                      d.x=(n_pos*data.grid_square_size==d.x)?(n_pos-1)*data.grid_square_size:n_pos*data.grid_square_size
                
                    })

                    set_data({ ...data })
                  }
                }
              >Décaler gauche</Button>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px' }}
                onClick={
                  () => {
                    Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => {
                      // const current_prev_x = Math.round(d.x / data.h_space) * data.h_space + data.h_space
                      // const current_y = d.y
                      // const node_to_replace = Object.values(display_nodes).filter(n => n.node_visible && n.x === current_prev_x && n.y === current_y)[0]
                      // if (node_to_replace !== undefined) {
                      //   node_to_replace.x = Math.round(d.x / data.h_space) * data.h_space
                      // }
                      // d.x = current_prev_x

                      const n_pos=Math.trunc(d.x/data.grid_square_size)
                      d.x=(n_pos+1)*data.grid_square_size
                    })

                    set_data({ ...data })
                  }
                }
              >Décaler droite</Button>
            </ButtonGroup>
            <ButtonGroup style={{ 'marginLeft': '10px' }}>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px', 'marginRight': '3px' }}
                onClick={
                  () => {
                    // reorganize_inputLinksId(selected_node, true, false, display_nodes, display_links)
                    Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => {
                      reorganize_inputLinksId(d, true, false, display_nodes, display_links)
                    })
                    set_data({ ...data })
                  }
                }
              >Réorganiser liens entrants</Button>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px' }}
                onClick={
                  () => {
                    // reorganize_inputLinksId(selected_node, false, true, display_nodes, display_links)
                    Object.values(data.nodes).filter(f => multi_selected_node.map(d => d.name).includes(f.name)).map(d => {
                      reorganize_inputLinksId(d, false, true, display_nodes, display_links)
                    })
                    set_data({ ...data })
                  }
                }
              >Réorganiser liens sortants</Button>
            </ButtonGroup>
            {/* <ButtonGroup style={{ 'marginLeft': '10px' }}>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px' }}
                onClick={
                  () => {
                    delete_node(data, selected_node)
                    set_data({ ...data })
                  }
                }
              >Supprimer noeud</Button>
            </ButtonGroup>
            <ButtonGroup style={{ 'marginLeft': '10px' }}>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px', 'marginRight': '3px' }}
                onClick={
                  () => {
                    while (selected_node.inputLinksId.length > 0) {
                      const link = display_links[selected_node.inputLinksId[0]]
                      delete_link(data, link)
                    }
                    set_data({ ...data })
                  }
                }
              >Supprimer flux entrant</Button>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px' }}
                onClick={
                  () => {
                    while (selected_node.outputLinksId.length > 0) {
                      const link = display_links[selected_node.outputLinksId[0]]
                      delete_link(data, link)
                    }
                    set_data({ ...data })
                  }
                }
              >Supprimer flux sortant</Button>
            </ButtonGroup> */}


          </Tab>
          {children}
        </Tabs>

      </Col>
    </Row >
  )
}

SankeyNodeEdition.propTypes = SankeyNodeEditionPropTypes

export default SankeyNodeEdition