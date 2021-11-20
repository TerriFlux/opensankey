import React, { FunctionComponent, useState } from 'react'
import { Row, Form, FormLabel, Col, FormCheck, Tabs, Tab, Table, Button } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { SankeyDataPropTypes, SankeyLink, SankeyNodePropTypes } from './types'
import { default_node } from './SankeyUtils'

const SankeyNodeEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  selected_node: PropTypes.shape(SankeyNodePropTypes).isRequired,
  radio_selected: PropTypes.string.isRequired,
  getValueIndex: PropTypes.func.isRequired
}

type SankeyEditionTypes = InferProps<typeof SankeyNodeEditionPropTypes>

const SankeyNodeEdition: FunctionComponent<SankeyEditionTypes> = ({ data, set_data,selected_node,radio_selected,getValueIndex,children}) => {
  const { tags_catalog } = data
  const tags_visible = Object.keys(tags_catalog).length > 0
  const [tags_group_key, set_tags_group_key] = useState(tags_visible ? Object.keys(tags_catalog)[0] : '')

  let node = selected_node
  if (node === undefined) {
    node = default_node()
  }

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
                        checked={checked}
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
                    checked={node.shape_visible}
                    onChange={evt => {
                      node.shape_visible = evt.target.checked
                      node.node_visible = node.label_visible || node.shape_visible

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
                      node.color = evt.target.value
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
                      node.type = evt.target.value
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
                      node.type = evt.target.value
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
                      node.label_visible = evt.target.checked
                      node.node_visible = node.label_visible || node.shape_visible
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
}

SankeyNodeEdition.propTypes = SankeyNodeEditionPropTypes

export default SankeyNodeEdition