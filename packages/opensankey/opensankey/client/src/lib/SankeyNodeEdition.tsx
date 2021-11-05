import React, { FunctionComponent, useState } from 'react'
import { Modal, Row, FormControl, Form, FormLabel, Col, FormCheck, Tabs, Tab, Table } from 'react-bootstrap'
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
  getValueIndex: PropTypes.func.isRequired
}

type SankeyEditionTypes = InferProps<typeof SankeyNodeEditionPropTypes>

const SankeyNodeEdition: FunctionComponent<SankeyEditionTypes> = ({ data, set_data, set_show_node, selected_node, show,getValueIndex, children }) => {
  const [tag_group_id, set_tag_group_id] = useState(0)

  const { links, nodes, tags_catalog } = data
  if (selected_node === -1) {
    selected_node = 0
  }
  let node = nodes[selected_node]
  if (node === undefined) {
    node = default_node()
  }

  let tags_group_name = ''
  if (tags_catalog.length > 0) {
    tags_group_name = tags_catalog[tag_group_id].group_name
    if (!node.tags[tags_group_name]) {
      node.tags[tags_group_name] = []
    }
  }
  const tags_visible = tags_catalog.length > 0

  return (
    <Modal size="lg" show={show} onHide={() => set_show_node(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Noeuds</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col sm={12}>
            <Tabs defaultActiveKey="nodes_desc" id="settings-layout">
              <Tab eventKey="nodes_desc" title="Description">
                <br></br>
                <Form >
                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel style={{ 'marginLeft' : '3px'}}>Nom</FormLabel>
                    </Col>
                    <Col>
                      <FormControl
                        value={node.name}
                        onChange={evt => {
                          const source_links = links.filter(l => l.source_name === nodes[selected_node].name)
                          const target_links = links.filter(l => l.target_name === nodes[selected_node].name)
                          source_links.forEach(l => l.source_name = evt.target.value)
                          target_links.forEach(l => l.target_name = evt.target.value)
                          nodes[selected_node].name = evt.target.value
                          set_data({ ...data })
                        }}
                      />
                    </Col>
                    <Col>
                      <FormLabel >id {selected_node}</FormLabel>
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel style={{ 'marginLeft' : '3px'}}>Parent</FormLabel>
                    </Col>
                    <Col>
                      <Form.Select 
                        onChange={
                          (evt : React.ChangeEvent<HTMLSelectElement>) => {
                            nodes[selected_node].parent_name = evt.target.value
                            set_data({...data})
                          } 
                        }
                      >
                        {nodes.map( (n,i) => <option key={i} value={n.name} selected={nodes[selected_node] && nodes[selected_node].parent_name === n.name} >{n.name}</option>)}
                      </Form.Select>
                    </Col>
                  </Form.Group>                  
                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel >Couleur</FormLabel>
                    </Col>
                    <Col>
                      <Form.Control
                        type='color'
                        value={node.color}
                        onChange={evt => {
                          nodes[selected_node].color = evt.target.value
                          set_data({ ...data })
                        }}
                      />
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label='Label visible'
                        checked={node.label_visible}
                        onChange={evt => {
                          nodes[selected_node].label_visible = evt.target.checked
                          if ( !nodes[selected_node].label_visible && !nodes[selected_node].visible) {
                            nodes[selected_node].input_links.forEach(
                              l_idx => links[l_idx].visible = false
                            )
                            nodes[selected_node].output_links.forEach(
                              l_idx => links[l_idx].visible = false
                            )
                          }
                          set_data({...data})
                        }}
                      />
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel>Type</FormLabel>
                    </Col>
                    <Col>
                      <FormCheck
                        value="product"
                        type='radio'
                        label='Produit'
                        checked={node.type === 'product'}
                        onChange={evt => {
                          nodes[selected_node].type = evt.target.value
                          set_data({ ...data })
                        }}
                      />
                    </Col>
                    <Col>
                      <FormCheck
                        value="sector"
                        type='radio'
                        label='Secteur'
                        checked={node.type === 'sector'}
                        onChange={evt => {
                          nodes[selected_node].type = evt.target.value
                          set_data({ ...data })
                        }}
                      />
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col sm={12}>
                      <FormCheck inline
                        type='checkbox'
                        label='Visible'
                        checked={node.visible}
                        onChange={evt => {
                          node.visible = evt.target.checked
                          if ( !node.label_visible && !node.visible) {
                            node.input_links.forEach(
                              l_idx => links[l_idx].visible = false
                            )
                            node.output_links.forEach(
                              l_idx => links[l_idx].visible = false
                            )
                          }
                          set_data({...data})
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
                          (tag, i) => {
                            return (
                              <tr key={i.toString()}>
                                <td><FormLabel>{tag}</FormLabel></td>
                                <td>
                                  <Form.Check
                                    name={'element_visible' + i.toString()}
                                    checked={node.tags[tags_group_name].includes(tags_catalog[tag_group_id].tags[i])}
                                    id={i.toString()}
                                    type='checkbox'
                                    onChange={
                                      (evt: React.ChangeEvent) => {
                                        const new_nb_element = evt.target as HTMLInputElement
                                        const id = +new_nb_element.id
                                        const name = tags_catalog[tag_group_id].tags[id]
                                        const visible = new_nb_element.checked
                                        //const tag_group_name = tags[tag_group_id].group_name
                                        if (visible) {
                                          if (!node.tags[tags_group_name]) {
                                            node.tags[tags_group_name] = []
                                          }
                                          node.tags[tags_group_name].push(name)
                                        } else {
                                          node.tags[tags_group_name].splice(node.tags[tags_group_name].indexOf(name))
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
              <Tab eventKey="node_tooltip" title="Tooltip">
                <Form >
                  <Row>
                    <FormLabel column sm={1}>Tooltip:</FormLabel>
                    <Col sm={11}>
                      <Form.Control
                        as="textarea"
                        rows={10}
                        value={node.tooltip_text ? node.tooltip_text : nodeTooltipsContent(data,node,getValueIndex)}
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
      </Modal.Body>
    </Modal>
  )
}

SankeyNodeEdition.propTypes = SankeyNodeEditionPropTypes

export default SankeyNodeEdition