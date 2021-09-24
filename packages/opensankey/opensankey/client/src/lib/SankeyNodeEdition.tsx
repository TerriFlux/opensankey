import React, { FunctionComponent } from 'react'
import { Modal,Row,FormControl,Form,FormLabel,Col,FormCheck,Tabs, Tab } from 'react-bootstrap'
import PropTypes,{InferProps} from 'prop-types'
import { default_node_tooltip } from './SankeyTooltip'
import { SankeyDataPropTypes } from './types'

const SankeyNodeEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  set_show_node: PropTypes.func.isRequired,
  default_node:  PropTypes.func.isRequired,
  selected_node: PropTypes.number.isRequired,
  show: PropTypes.bool.isRequired,
}

type SankeyEditionTypes = InferProps<typeof SankeyNodeEditionPropTypes>

const SankeyNodeEdition : FunctionComponent<SankeyEditionTypes> = ({data,set_data,set_show_node,default_node,selected_node,show}) => {
  const { links,nodes} = data
  if (selected_node === -1) {
    selected_node = 0
  }
  let node = nodes[selected_node]
  if (node === undefined) {
    node = default_node()
  }
  let node_tooltip_text = (!node.tooltip_text || node.tooltip_text === '') ? default_node_tooltip(data,node) : node.tooltip_text
  node_tooltip_text = node_tooltip_text.split('\\n').join('\n')

  const keys = Object.keys(links)
  if (!keys.includes(data.region_name)) {
    data.region_name = keys[0]
  }

  return (
    <Modal size="lg" show={show} onHide={()=>set_show_node(false)}>
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
                    <FormLabel column sm={2} style={{ 'marginLeft' : '3px'}}>Nom</FormLabel>
                    <Col sm={8}>
                      <FormControl
                        value={node.name}
                        onChange = {(evt) =>  {
                          keys.forEach(region_name=>{
                            const source_links = links[region_name].filter(l=>l.source_name===nodes[selected_node].name)
                            const target_links = links[region_name].filter(l=>l.target_name===nodes[selected_node].name)
                            source_links.forEach(l=>l.source_name = evt.target.value)
                            target_links.forEach(l=>l.target_name = evt.target.value)
                          })
                          nodes[selected_node].name = evt.target.value
                          set_data({...data})
                        }}
                      />
                    </Col>
                    <FormLabel column sm={1}>id {selected_node}</FormLabel>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <FormLabel column sm={2}>Couleur</FormLabel>
                    <Col sm={8}>
                      <FormControl
                        value={node.color}
                        onChange = {(evt) =>  
                          (nodes[selected_node].color = evt.target.value) &&
                            set_data({...data})
                        }
                      />
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col sm={12}>
                      <FormCheck  inline  
                        type='checkbox'
                        label='Label visible'
                        checked = {node.label_visible || node.label_visible === undefined }
                        onChange = {(evt) =>  
                          ((node.label_visible = evt.target.checked) || true )&&
                            set_data({...data})
                        }
                      />
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <FormLabel column sm={3}>Type</FormLabel>
                    <FormCheck
                      inline  
                      value="product" 
                      type='radio'
                      label='Produit'
                      checked = {node.type === 'product'}
                      onChange = {(evt) =>  
                        (nodes[selected_node].type = evt.target.value) &&
                          set_data({...data})
                      }
                    />
                    <FormCheck
                      inline  
                      value="sector"  
                      type='radio'
                      label='Secteur'
                      checked = {node.type === 'sector'}
                      onChange = {(evt) =>  
                        (nodes[selected_node].type = evt.target.value) &&
                          set_data({...data})
                      }
                    />
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col sm={12}>
                      <FormCheck inline
                        type='checkbox'
                        label='Visible'
                        checked = {node.visible || node.visible === undefined}
                        onChange = {(evt) =>  
                          ((node.visible = evt.target.checked) || true) && 
                            set_data({...data})
                        }
                      />
                    </Col>
                  </Form.Group>
                  {/* <Form.Group as={Row} >
                        <FormLabel column sm={3} >Tags</FormLabel>
                        <Col sm={9}>
                          <Form.Control as="select" multiple htmlSize={3} onChange={group_value_change}>
                            {subchains.map((value,i) => { return(
                              <option key={i.toString()} selected={node.subchain !== undefined && node.subchain.includes(value)}>{value}</option>
                            )})}
                          </Form.Control>
                        </Col>                        
                      </Form.Group> */}
                </Form>
              </Tab>
              <Tab eventKey="node_tooltip" title="Tooltip">
                <Form >
                  <Row>
                    <FormLabel column sm={1}>Tooltip:</FormLabel>
                    <Col sm={11}>
                      <FormControl
                        as="textarea"
                        rows={10}
                        value = {node_tooltip_text}
                        onChange={
                          (evt) => 
                          {
                            node.tooltip_text = evt.target.value.split('\n').join('\\n') 
                            set_data({...data})
                          }
                        } 
                      />
                    </Col>  
                  </Row>
                </Form>
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  )
}

SankeyNodeEdition.propTypes = SankeyNodeEditionPropTypes

export default SankeyNodeEdition