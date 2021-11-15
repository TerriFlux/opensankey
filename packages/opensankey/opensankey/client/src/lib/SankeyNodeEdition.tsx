import React, { FunctionComponent, useState } from 'react'
import { Row, Form, FormLabel, Col, FormCheck, Tabs, Tab, Table, Button } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { SankeyDataPropTypes, SankeyLink, SankeyNode, SankeyNodePropTypes } from './types'
import { nodeTooltipsContent } from './SankeyTooltip'
import { default_node, normalize_name } from './SankeyUtils'

const SankeyNodeEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  selected_node: PropTypes.shape(SankeyNodePropTypes).isRequired,
  radio_selected: PropTypes.string.isRequired,
  getValueIndex: PropTypes.func.isRequired
}

type SankeyEditionTypes = InferProps<typeof SankeyNodeEditionPropTypes>

const SankeyNodeEdition: FunctionComponent<SankeyEditionTypes> = ({ data, set_data,selected_node,radio_selected,getValueIndex,children}) => {
  const [tags_group_key,set_tags_group_key] = useState('')

  const { tags_catalog } = data
  const display_links : SankeyLink[] = data.links.filter( l=> {
    const source_node = data.nodes.filter(n => normalize_name(n.name) === normalize_name(l.source_name))[0]
    const target_node = data.nodes.filter(n => normalize_name(n.name) === normalize_name(l.target_name))[0]
    return source_node.display &&  target_node.display
  })


  let node = selected_node
  if (node === undefined) {
    node = default_node()
  }
  
  const tags_visible = Object.keys(tags_catalog).length > 0

  const outline_Fav_Button = (tag_key: string) => {
    if (node.colorFavoriteTags != undefined && node.colorFavoriteTags[tags_group_key] != undefined && (node.colorFavoriteTags[tags_group_key].tag_associated === tag_key)) {
      return 'warning'
    } else {
      return 'outline-warning'
    }
  }

  const node_tag = (
    <Tab eventKey="tags" title="Tags" >
      <br></br>
      <Form.Group as={Row} >
        <Col>
          <FormLabel >Tag Groupe:</FormLabel>
        </Col>
        <Col>
          <Form.Select
            onChange={
              (evt: React.ChangeEvent<HTMLSelectElement>) => set_tags_group_key(evt.target.value)}
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
      </Form.Group>
      <Form.Group as={Row} >
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Appartenance</th>
              <th>Favoris</th>
            </tr>
          </thead>
          <tbody>
            {tags_visible && tags_group_key != '' ? Object.entries(tags_catalog[tags_group_key].tags).map(
              tags => {
                const node_tags = node.tags[tags_group_key]
                const checked = node_tags ? node_tags.includes(tags[0]) : true
                return (
                  <tr key={tags[0]}>
                    <td><FormLabel>{tags[1].name}</FormLabel></td>
                    <td>
                      <FormCheck
                        name={'element_visible' + tags[0]}
                        defaultChecked={checked}
                        id={tags[0]}
                        type='checkbox'
                        onChange={
                          (evt: React.ChangeEvent) => {
                            const new_nb_element = evt.target as HTMLInputElement
                            const tag_key = new_nb_element.id
                            const visible = new_nb_element.checked
                            if (visible) {
                              if (!node.tags[tags_group_key]) {
                                node.tags[tags_group_key] = []
                              }
                              node.tags[tags_group_key].push(tag_key)
                            } else {
                              node.tags[tags_group_key].splice(node.tags[tags_group_key].indexOf(tag_key))
                            }
                            set_data({ ...data })
                          }
                        } />
                    </td>
                    <td>
                      <Button
                        size="sm"

                        variant={outline_Fav_Button(tags[0])}
                        onClick={
                          () => {

                            const newFavColor = {
                              tag_associated: tags[0],
                              color: tags_catalog[tags_group_key].tags[tags[0]].color
                            }

                            if (node.colorFavoriteTags === undefined || node.colorFavoriteTags === null) {
                              node.colorFavoriteTags = {}
                            }
                            if (Object.keys(node.colorFavoriteTags).includes(tags_group_key)) {
                              delete node.colorFavoriteTags[tags_group_key]
                            } else {
                              node.colorFavoriteTags[tags_group_key] = newFavColor

                            }
                            set_data({ ...data })
                          }
                        }
                      >★</Button>
                    </td>
                  </tr>
                )
              }) : (<></>)}
          </tbody>
        </Table>
      </Form.Group>
    </Tab>)

  return (
    <Row>
      <Col sm={12}>
        <Tabs defaultActiveKey="nodes_desc" id="settings-layout">
          <Tab eventKey="nodes_desc" title="Description">
            <br></br>
            <Form >

              <Form.Group as={Row} >
                <Col xs={2}>
                  <FormLabel >Visibilité</FormLabel>
                </Col>
                <Col xs={1}>
                  <FormCheck inline
                    type='switch'
                    //label='Visible'
                    checked={node.visible}
                    onChange={evt => {
                      node.visible = evt.target.checked
                      if (!node.label_visible && !node.visible) {
                        node.inputLinksId.forEach(
                          idLink => display_links[display_links.findIndex(l=>l.idLink===idLink)].visible = false
                        )
                        node.outputLinksId.forEach(
                          idLink => display_links[display_links.findIndex(l=>l.idLink===idLink)].visible = false
                        )
                      }
                      set_data({ ...data })
                    }}
                  />
                </Col>
                <Col xs={2}>
                  <FormLabel >Couleur</FormLabel>
                </Col>
                <Col xs={3}>
                  <Form.Control
                    type='color'
                    disabled={radio_selected !== 'local'}
                    value={node.color}
                    onChange={evt => {
                      selected_node.color = evt.target.value
                      set_data({ ...data })
                    }}
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col xs={2}>
                  <FormLabel>Shape</FormLabel>
                </Col>
                <Col xs={2}>
                  <FormCheck
                    value="product"
                    type='radio'
                    label='Circle'
                    checked={node.type === 'product'}
                    onChange={evt => {
                      selected_node.type = evt.target.value
                      set_data({ ...data })
                    }}
                  />
                </Col>
                <Col xs={2}>
                  <FormCheck
                    value="sector"
                    type='radio'
                    label='Rectangle'
                    checked={node.type === 'sector'}
                    onChange={evt => {
                      selected_node.type = evt.target.value
                      set_data({ ...data })
                    }}
                  />
                </Col>
              </Form.Group>


            </Form>
          </Tab>
          {<Tab eventKey="label_desc" title="Labels">
            <Form>
              <Form.Group as={Row} >
                <Col>
                  <FormCheck
                    type='checkbox'
                    label='Label visible'
                    checked={node.label_visible}
                    onChange={evt => {
                      selected_node.label_visible = evt.target.checked
                      if (!selected_node.label_visible && !selected_node.visible) {
                        selected_node.inputLinksId.forEach(
                          idLink => display_links[display_links.findIndex(l=>l.idLink===idLink)].visible = false
                        )
                        selected_node.outputLinksId.forEach(
                          idLink => display_links[display_links.findIndex(l=>l.idLink===idLink)].visible = false
                        )
                      }
                      set_data({ ...data })
                    }}
                  />
                </Col>
              </Form.Group>
            </Form>
          </Tab>}




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

          {children}

        </Tabs>
      </Col>

    </Row >

  )


  {/* 
    return (

      <Row>
        <Col sm={12}>
          <Tabs defaultActiveKey="nodes_desc" id="settings-layout">
            <Tab eventKey="nodes_desc" title="Description">
              <br></br>
              <Form >

                <Form.Group as={Row} >
                  <Col xs={2}>
                    <FormLabel >Visibilité</FormLabel>
                  </Col>
                  <Col xs={1}>
                    <FormCheck inline
                      type='switch'
                      //label='Visible'
                      checked={node.visible}
                      onChange={evt => {
                        node.visible = evt.target.checked
                        if (!node.label_visible && !node.visible) {
                          node.inputLinksId.forEach(
                            l_idx => links[l_idx].visible = false
                          )
                          node.outputLinksId.forEach(
                            l_idx => links[l_idx].visible = false
                          )
                        }
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col xs={2}>
                    <FormLabel >Couleur</FormLabel>
                  </Col>
                  <Col xs={3}>
                    <Form.Control
                      type='color'
                      disabled={radio_selected !== 'local'}
                      value={node.color}
                      onChange={evt => {
                        nodes[selected_node].color = evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={2}>
                    <FormLabel>Shape</FormLabel>
                  </Col>
                  <Col xs={2}>
                    <FormCheck
                      value="product"
                      type='radio'
                      label='Circle'
                      checked={node.type === 'product'}
                      onChange={evt => {
                        nodes[selected_node].type = evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col xs={2}>
                    <FormCheck
                      value="sector"
                      type='radio'
                      label='Rectangle'
                      checked={node.type === 'sector'}
                      onChange={evt => {
                        nodes[selected_node].type = evt.target.value
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>


              </Form>
            </Tab>
            <Tab eventKey="label_desc" title="Labels">
              <Form>
                <Form.Group as={Row} >
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label='Label visible'
                      checked={node.label_visible}
                      onChange={evt => {
                        nodes[selected_node].label_visible = evt.target.checked
                        if (!nodes[selected_node].label_visible && !nodes[selected_node].visible) {
                          nodes[selected_node].inputLinksId.forEach(
                            l_idx => links[l_idx].visible = false
                          )
                          nodes[selected_node].outputLinksId.forEach(
                            l_idx => links[l_idx].visible = false
                          )
                        }
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
              </Form>
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
                        //+evt.target.value
                        (evt: React.ChangeEvent<HTMLSelectElement>) => {
                          set_tag_group_id(+evt.target.value)
                        }}>
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
                        <th>Favoris</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tags_visible ? (tags_catalog[tag_group_id].tags.map(
                        (tag, i) => {
                          return (
                            <tr key={i.toString()}>
                              <td><FormLabel>{tag}</FormLabel></td>
                              <td>
                                <FormCheck inline
                                  name={'element_visible' + i.toString()}
                                  checked={node.tags[tags_catalog[tag_group_id].group_name].includes(tags_catalog[tag_group_id].tags[i])}
                                  id={i.toString()}
                                  type='checkbox'
                                  onChange={
                                    (evt: React.ChangeEvent) => {
                                      const new_nb_element = evt.target as HTMLInputElement
                                      const id = +new_nb_element.id
                                      const name = tags_catalog[tag_group_id].tags[id]
                                      const visible = new_nb_element.checked
                                      const tag_group_name = tags_catalog[tag_group_id].group_name
                                      if (visible) {
                                        if (!node.tags[tag_group_name]) {
                                          node.tags[tag_group_name] = []
                                        }
                                        node.tags[tag_group_name].push(name)
                                      } else {
                                        node.tags[tag_group_name].splice(node.tags[tag_group_name].indexOf(name))
                                      }


                                      set_data({ ...data })
                                    }
                                  } />
                              </td>
                              <td>
                                <Button
                                  size="sm"

                                  variant="outline-warning"
                                  onClick={
                                    () => {

                                      if (nodes[selected_node].colorFavoriteTags != undefined) {
                                        const indTag = tags_catalog[tag_group_id].tags
                                      }
                                    }
                                  }
                                >★</Button>
                              </td>
                            </tr>
                          )
                        })) : (<></>)}
                    </tbody>
                  </Table>
                </Form.Group>
              </Tab>) : (<></>)}
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
            {children}

          </Tabs>
        </Col>
      </Row>

    )
   */}
}








// SankeyNodeEdition.propTypes = SankeyNodeEditionPropTypes
SankeyNodeEdition.propTypes = SankeyNodeEditionPropTypes

export default /* SankeyNodeEdition; */SankeyNodeEdition