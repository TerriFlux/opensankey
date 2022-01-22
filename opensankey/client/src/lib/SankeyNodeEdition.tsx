import React, { FunctionComponent, useState } from 'react'
import { Row, Form, FormLabel, Col, FormCheck, Tabs, Tab, Table, Button, ButtonGroup } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { SankeyDataPropTypes, SankeyNodePropTypes } from './types'
import { default_node } from './SankeyUtils'
import { reorganize_inputLinksId } from './SankeyLayout'

const SankeyNodeEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  selected_node: PropTypes.shape(SankeyNodePropTypes).isRequired,
  radio_selected: PropTypes.string.isRequired
}

type SankeyEditionTypes = InferProps<typeof SankeyNodeEditionPropTypes>

const SankeyNodeEdition: FunctionComponent<SankeyEditionTypes> = ({ data, set_data,
  selected_node, radio_selected, children }) => {
  const { tags_catalog } = data
  const tags_visible = Object.keys(tags_catalog).length > 0
  const [tags_group_key, set_tags_group_key] = useState(tags_visible ? Object.keys(tags_catalog)[0] : '')

  const display_nodes = data.nodes
  const display_links = data.links
  if (tags_group_key == '' && Object.keys(tags_catalog).length > 0) {
    set_tags_group_key(Object.keys(tags_catalog)[0])
  }


  let node = data.nodes[selected_node.idNode]
  if (node === undefined) {
    node = default_node()
    for (const tag_group_key in tags_catalog) {
      node.tags[tag_group_key] = []
    }
  }

  console.log('test')
  console.log(node.nodeParameter)
  //Onglet Tags du menu noeud pour selectionner un tag favorie si présent
  const node_tag = (
    <Tab eventKey="tags" title="Tags"
      disabled={node.nodeParameter !== 'groupTag'} >
      <br></br>
      <Form.Group as={Row} >
        <Col>
          <FormLabel >Tag Groupe:</FormLabel>
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
        <Table striped bordered hover className='node_tags_affiliation'>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Appartenance</th>
            </tr>
          </thead>
          <tbody>
            {tags_visible && tags_group_key != '' ? Object.entries(tags_catalog[tags_group_key].tags).map(
              tags => {
                const node_tags = node.tags[tags_group_key]
                const checked = node_tags ? node_tags.includes(tags[0]) : false
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
            disabled={!(node.nodeParameter == 'local')}> 
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
          <Tab eventKey="node_parameter" title="Déplacements">
            <ButtonGroup style={{ 'marginLeft': '10px' }}>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px', 'marginRight': '3px' }}
                onClick={
                  () => {
                    const current_x = selected_node.x
                    const current_prev_y = selected_node.y - data.v_space
                    const node_to_replace = Object.values(display_nodes).filter(n => n.node_visible && n.x === current_x && n.y === current_prev_y)[0]
                    if (node_to_replace !== undefined) {
                      node_to_replace.y = selected_node.y
                    }
                    selected_node.y = selected_node.y - data.v_space
                    set_data({ ...data })
                  }
                }
              >Monter</Button>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px', 'marginRight': '3px' }}
                onClick={
                  () => {
                    const current_x = selected_node.x
                    const current_prev_y = selected_node.y + data.v_space
                    const node_to_replace = Object.values(display_nodes).filter(n => n.node_visible && n.x === current_x && n.y === current_prev_y)[0]
                    if (node_to_replace !== undefined) {
                      node_to_replace.y = selected_node.y
                    }
                    selected_node.y = selected_node.y + data.v_space
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
                    const current_prev_x = Math.round(selected_node.x / data.h_space) * data.h_space - data.h_space
                    const current_y = selected_node.y
                    const node_to_replace = Object.values(display_nodes).filter(n => n.node_visible && n.x === current_prev_x && n.y === current_y)[0]
                    if (node_to_replace !== undefined) {
                      node_to_replace.x = Math.round(selected_node.x / data.h_space) * data.h_space
                    }
                    selected_node.x = current_prev_x
                    set_data({ ...data })
                  }
                }
              >Décaler gauche</Button>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px' }}
                onClick={
                  () => {
                    const current_prev_x = Math.round(selected_node.x / data.h_space) * data.h_space + data.h_space
                    const current_y = selected_node.y
                    const node_to_replace = Object.values(display_nodes).filter(n => n.node_visible && n.x === current_prev_x && n.y === current_y)[0]
                    if (node_to_replace !== undefined) {
                      node_to_replace.x = Math.round(selected_node.x / data.h_space) * data.h_space
                    }
                    selected_node.x = current_prev_x
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
                    reorganize_inputLinksId(selected_node, true, false, display_nodes, display_links)
                    set_data({ ...data })                    
                  }
                }
              >Réorganiser liens entrants</Button>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px' }}
                onClick={
                  () => {
                    reorganize_inputLinksId(selected_node, false, true, display_nodes, display_links)
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