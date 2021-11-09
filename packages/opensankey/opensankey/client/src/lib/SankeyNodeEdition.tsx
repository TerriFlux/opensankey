import React, { FunctionComponent, useState } from 'react'
import { Modal, Row, FormControl, Form, FormLabel, Col, FormCheck, Tabs, Tab, Table, Button } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { SankeyDataPropTypes } from './types'
import { nodeTooltipsContent } from './SankeyTooltip'
import { default_node } from './SankeyUtils'

const SankeyNodeEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  set_show_node: PropTypes.func.isRequired,
  selected_node: PropTypes.number.isRequired,
  show: PropTypes.bool.isRequired,
  tag_group_id: PropTypes.number.isRequired,
  set_tag_group_id: PropTypes.func.isRequired,
  set_radio_selected: PropTypes.func.isRequired,
  radio_selected: PropTypes.string.isRequired,
  key_group_tag: PropTypes.number.isRequired,
  selected_key_group_tag: PropTypes.number.isRequired,
  set_key_group_tag: PropTypes.func.isRequired,
  set_selected_key_group_tag: PropTypes.func.isRequired,
}

type SankeyEditionTypes = InferProps<typeof SankeyNodeEditionPropTypes>

const SankeyNodeEditionV2: FunctionComponent<SankeyEditionTypes> = ({ data, set_data, set_show_node,
  selected_node, show,
  tag_group_id,
  set_tag_group_id,
  set_radio_selected,
  radio_selected,

  key_group_tag,
  selected_key_group_tag,

  set_key_group_tag,
  set_selected_key_group_tag,
  children

}) => {

  /*  const { links, nodes, tags_catalog } = data
   if (selected_node === -1) {
     selected_node = 0
   }
   let node = nodes[selected_node]
   if (node === undefined) {
     node = default_node()
   }
   if (tags_catalog.length > 0) {
     const tag_group_name = tags_catalog[tag_group_id].group_name
     if (!node.tags[tag_group_name]) {
       node.tags[tag_group_name] = []
     }
   }
   const tags_visible = tags_catalog.length > 0 */



  const { links, nodes, tags_catalog_v2 } = data
  if (selected_node === -1) {
    selected_node = 0
  }
  let node = nodes[selected_node]

  if (node === undefined) {
    node = default_node()
  }
  if (Object.keys(tags_catalog_v2).length > 0) {
    const tag_group_name = 'tag_group_' + selected_key_group_tag
    if (!node.tags[tag_group_name]) {
      node.tags[tag_group_name] = []
    }
  }
  const tags_visible = Object.keys(tags_catalog_v2).length > 0

  const outline_Fav_Button = (tag_key: string) => {
    if (node != undefined && node.colorFavoriteTags['tag_group_' + selected_key_group_tag] != undefined && (node.colorFavoriteTags['tag_group_' + selected_key_group_tag].tag_associated === tag_key)) {
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
              //+evt.target.value
              (evt: React.ChangeEvent<HTMLSelectElement>) => {
                set_selected_key_group_tag(evt.target.value as any)
                set_data({ ...data })
              }}>

            {Object.keys(tags_catalog_v2).map(
              (tags_group, i) =>
                <option
                  key={i}
                  value={parseInt(tags_group.slice(10))}
                  selected={selected_key_group_tag === i} >
                  {tags_catalog_v2[tags_group].group_name}
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
            {tags_visible ? (Object.keys(tags_catalog_v2['tag_group_' + selected_key_group_tag].tags).map(
              (tag_key, i) => {
                return (

                  <tr key={i.toString()}>
                    <td><FormLabel>{tags_catalog_v2['tag_group_' + selected_key_group_tag].tags[tag_key].name}</FormLabel></td>
                    <td>
                      <FormCheck inline
                        name={'element_visible' + i.toString()}
                        // checked={node.tags[tags_catalog_v2['tag_group_'+selected_key_group_tag].group_name].includes('tag'+tag_key)}
                        id={i.toString()}
                        type='checkbox'
                        onChange={
                          (evt: React.ChangeEvent) => {
                            /*  const new_nb_element = evt.target as HTMLInputElement
                             const id = +new_nb_element.id
                             const name = tags_catalog_v2[key_group_tag].tags[]
                             const visible = new_nb_element.checked
                             const tag_group_name = tags_catalog_v2[tag_group_id].group_name
                             if (visible) {
                               if (!node.tags[tag_group_name]) {
                                 node.tags[tag_group_name] = []
                               }
                               node.tags[tag_group_name].push(name)
                             } else {
                               node.tags[tag_group_name].splice(node.tags[tag_group_name].indexOf(name))
                             } */

                            // const new_nb_element = evt.target as HTMLInputElement
                            // const id = +new_nb_element.id
                            // console.log(id)
                            // const name = tags_catalog_v2[selected_key_group_tag].tags['tag' + id].name
                            // const visible = new_nb_element.checked
                            // const tag_group_name = tags_catalog_v2[selected_key_group_tag].group_name
                            // if (visible) {
                            //   if (!node.tags[tag_group_name]) {
                            //     node.tags[tag_group_name] = []
                            //   }
                            //   node.tags[tag_group_name].push(name)
                            // } else {
                            //   node.tags[tag_group_name].splice(node.tags[tag_group_name].indexOf(name))
                            // }


                            set_data({ ...data })
                          }
                        }
                      />
                    </td>
                    <td>
                      <Button
                        size="sm"

                        variant={outline_Fav_Button(tag_key)}
                        onClick={
                          () => {

                            const newFavColor = {
                              tag_associated: tag_key,
                              color: tags_catalog_v2['tag_group_' + selected_key_group_tag].tags[tag_key].color
                            }

                            if (node.colorFavoriteTags === undefined || node.colorFavoriteTags === null) {
                              node.colorFavoriteTags = {}
                            }
                            if (Object.keys(node.colorFavoriteTags).includes('tag_group_' + selected_key_group_tag)) {
                              delete node.colorFavoriteTags['tag_group_' + selected_key_group_tag]
                            } else {
                              node.colorFavoriteTags['tag_group_' + selected_key_group_tag] = newFavColor

                            }
                            set_data({ ...data })
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

    </Tab>)

  // return (<></>)




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
                        node.input_links.forEach(
                          l_idx => links[l_idx].visible = false
                        )
                        node.output_links.forEach(
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
          {<Tab eventKey="label_desc" title="Labels">
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
                        nodes[selected_node].input_links.forEach(
                          l_idx => links[l_idx].visible = false
                        )
                        nodes[selected_node].output_links.forEach(
                          l_idx => links[l_idx].visible = false
                        )
                      }
                      set_data({ ...data })
                    }}
                  />
                </Col>
              </Form.Group>
            </Form>
          </Tab>}




          {Object.keys(tags_catalog_v2).length > 0 ? node_tag : (<></>)}


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
                          node.input_links.forEach(
                            l_idx => links[l_idx].visible = false
                          )
                          node.output_links.forEach(
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
                          nodes[selected_node].input_links.forEach(
                            l_idx => links[l_idx].visible = false
                          )
                          nodes[selected_node].output_links.forEach(
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
SankeyNodeEditionV2.propTypes = SankeyNodeEditionPropTypes

export default /* SankeyNodeEdition; */SankeyNodeEditionV2