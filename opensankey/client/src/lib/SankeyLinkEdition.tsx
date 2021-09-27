import React, { FunctionComponent } from 'react'
import { Modal,Row,FormControl,Form,Col,FormLabel,FormCheck,Tabs, Tab } from 'react-bootstrap'
import { SankeyDataPropTypes, SankeyLink } from './types'
import PropTypes,{InferProps} from 'prop-types'

const SankeyLinkEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  set_show_link: PropTypes.func.isRequired,
  default_link: PropTypes.func.isRequired,
  selected_link: PropTypes.number.isRequired,
  show: PropTypes.bool.isRequired
}

type SankeyLinkEditionTypes = InferProps<typeof SankeyLinkEditionPropTypes>

const SankeyLinkEdition: FunctionComponent<SankeyLinkEditionTypes> = (
  {data, set_data, set_show_link, default_link, selected_link, show}
) => {
  const source_change = (changeEvent : React.ChangeEvent) => {
    const { nodes,links,region_name } = data
    const link = links[region_name][selected_link]
    const previous_node = nodes.filter(n=>n.name === link.source_name)[0]
    const node = nodes.filter(n=>n.name === (changeEvent.target as HTMLInputElement).value)[0]

    const region_names = Object.keys(data.links)
    region_names.forEach( reg_name => links[reg_name][selected_link].source_name = node.name )   

    // Remove link from old source
    const link_pos = previous_node.output_links.indexOf(selected_link)
    previous_node.output_links.splice(link_pos,1)
    // Add link to new source
    node.output_links.push(selected_link)

    set_data({...data})
  }

  const target_change = (changeEvent : React.ChangeEvent) => {
    const { nodes, links, region_name } = data
    const link = links[region_name][selected_link]
    const previous_node = nodes.filter(n=>n.name === link.target_name)[0]
    const node = nodes.filter(n=>n.name === (changeEvent.target as HTMLInputElement).value)[0]
    const region_names = Object.keys(data.links)
    region_names.forEach( reg_name => links[reg_name][selected_link].target_name = node.name )   

    // Remove link from old target
    const link_pos = previous_node.input_links.indexOf(selected_link)
    previous_node.input_links.splice(link_pos,1)
    // Add link to new source
    node.input_links.push(selected_link)

    set_data({...data})
  }

  const { links,nodes} = data
  if (selected_link === -1) {
    selected_link = 0
  }
  const keys = Object.keys(links)
  if (!keys.includes(data.region_name)) {
    data.region_name = keys[0]
  }
  const selected_links : SankeyLink[] = []
  const the_link = links[data.region_name][selected_link]
  selected_links.push(the_link)

  let link = links[data.region_name][selected_link]
  if (selected_links[0] === undefined) {
    selected_links[0] = default_link()
    link = selected_links[0]
  }

  let max_link_value = 0
  links[data.region_name].forEach( link => {
    if (link.value > max_link_value) {
      max_link_value = link.value
    }
  })
  max_link_value +=1

  return (
    <Modal size="lg" show={show} onHide={(()=>set_show_link(false))}>
      <Modal.Header closeButton>
        <Modal.Title>FLUX</Modal.Title>
      </Modal.Header>
      <Modal.Body>          
        <Row>
          <Col sm={12}>
            <Tabs defaultActiveKey="flux_data" id="settings-layout">
              <Tab eventKey="flux_data" title="Données">
                <br></br>
                <Form >
                  <Form.Group as={Row} >
                    <FormLabel column sm={3}>Source</FormLabel>
                    <Col sm={9}>
                      <Form.Group controlId="formControlsSelect">
                        <FormControl as="select" onChange={source_change}>
                          {nodes.map( (n,i) => <option key={i} value={n.name} selected={selected_links[0].source_name === n.name} >{n.name}</option>)}
                        </FormControl>
                      </Form.Group>
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <FormLabel column sm={3}>Cible</FormLabel>
                    <Col sm={9}>
                      <Form.Group controlId="formControlsSelect">
                        <FormControl as="select" onChange={target_change}>
                          {nodes.map( (n,i) => <option key={i} value={n.name} selected={selected_links[0].target_name === n.name} >{n.name}</option>)}
                        </FormControl>
                      </Form.Group>
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <FormLabel column sm={3} >Valeur</FormLabel>
                    <Col sm={9}>
                      <FormControl
                        value = {link.value}
                        onChange = {
                          (evt) => {
                            links[data.region_name][selected_link].value = +evt.target.value
                            set_data({...data})
                          }
                        }
                      />
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <FormLabel column sm={3} >Affichage</FormLabel>
                    <Col sm={9}>
                      <FormControl
                        value = {link.display_value}
                        onChange = {
                          (evt) => { 
                            links[data.region_name][selected_link].display_value = evt.target.value
                            set_data({...data})
                          }
                        }
                      />
                    </Col>
                  </Form.Group>
                </Form>
              </Tab>
              <Tab eventKey="flux_attributes" title="Apparence">
                <br></br>
                <Form >
                  <Form.Group as={Row} >
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label='Visible'
                        checked = {selected_links[0].visible || selected_links[0].visible === undefined}
                        onChange = {
                          evt => {
                            selected_links.forEach(
                              l => l.visible = evt.target.checked
                            )
                            set_data({...data})
                          }
                        }
                      />
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel >Couleur:</FormLabel>
                    </Col>
                    <Col>
                      <Form.Control
                        type="color"
                        defaultValue={link.color}
                        onChange = {
                          evt => {
                            selected_links.forEach(
                              l => l.color = evt.target.value
                            )
                            set_data({...data})
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
                        value={link.curvature}
                        onChange = {
                          evt => {
                            selected_links.forEach(
                              l => l.curvature = +evt.target.value
                            )
                            set_data({...data})
                          }
                        }
                      />
                    </Col>
                    <Col sm={2}>{link.curvature}</Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col>
                      <FormLabel>Type:</FormLabel>
                    </Col>
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label='Courbe'
                        checked = {link.curved}
                        onChange = {
                          evt =>  {
                            selected_links.forEach(
                              l => l.curved = evt.target.checked
                            )
                            set_data({...data})
                          }
                        }
                      />
                    </Col>
                    <Col>
                      <FormCheck
                        type='checkbox'
                        label='Flêche'
                        checked = {link.arrow}
                        onChange = {
                          evt =>  {
                            selected_links.forEach(
                              l => l.arrow = evt.target.checked
                            )
                            set_data({...data})
                          }
                        }
                      />
                    </Col>
                    <Col>
                      <FormCheck 
                        type='checkbox'
                        label='Recyclage'
                        checked = {link.recycling ? link.recycling : undefined}
                        onChange = {
                          evt =>  {
                            selected_links.forEach(
                              l => l.recycling = evt.target.checked
                            )
                            set_data({...data})
                          }
                        }
                      />
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} >
                    <Col sm={12}>
                      <FormCheck
                        inline
                        name='orientation'
                        type='radio'
                        label='Horiz-Horiz'
                        value='hh'
                        checked = {link.orientation === 'hh'}
                        onChange = {
                          evt =>  {
                            selected_links.forEach(
                              l => l.orientation = evt.target.value
                            )
                            set_data({...data})
                          }
                        }
                      />
                      <FormCheck
                        inline
                        name='orientation'
                        type='radio'
                        label='Vert-Vert'
                        value='vv'
                        checked = {link.orientation === 'vv'}
                        onChange = {
                          evt =>  {
                            selected_links.forEach(
                              l => l.orientation = evt.target.value
                            )
                            set_data({...data})
                          }
                        }
                      />
                      <FormCheck
                        inline
                        name='orientation'
                        type='radio'
                        label='Vert-Horiz'
                        value='vh'
                        checked = {link.orientation === 'vh'}
                        onChange = {
                          evt =>  {
                            selected_links.forEach(
                              l => l.orientation = evt.target.value
                            )
                            set_data({...data})
                          }
                        }
                      />
                      <FormCheck
                        inline
                        name='orientation'
                        type='radio'
                        label='Horiz-Vert'
                        value='hv'
                        checked = {link.orientation === 'hv'}
                        onChange = {
                          evt =>  {
                            selected_links.forEach(
                              l => l.orientation = evt.target.value
                            )
                            set_data({...data})
                          }
                        }
                      />
                    </Col>
                  </Form.Group>
                </Form>
              </Tab>
              <Tab eventKey="label" title="Label">
                <br/>
                <Form.Group as={Row} >
                  <Col>
                    <FormCheck
                      value='black'
                      type='radio'
                      label='Label en noir'
                      checked = {link.text_color === 'black' }
                      onChange = {
                        () =>  {
                          selected_links.forEach(
                            l => l.text_color = 'black'
                          )
                          set_data({...data})
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      value='white'
                      type='radio'
                      label='Label blanc'
                      checked = {link.text_color === 'white' }
                      onChange = {
                        () =>  {
                          selected_links.forEach(
                            l => l.text_color = 'white'
                          )
                          set_data({...data})
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      value='same_color'
                      type='radio'
                      label='Label en couleur'
                      checked = {link.text_color === link.color }
                      onChange = {
                        () =>  {
                          selected_links.forEach(
                            l => l.text_color = l.color
                          )
                          set_data({...data})
                        }
                      }
                    />
                  </Col>
                </Form.Group>
                <Form.Group >
                  <FormCheck
                    type='checkbox'
                    label='Label visible'
                    checked = {link.label_visible || link.label_visible === undefined }
                    onChange = {
                      evt => {
                        selected_links.forEach(                              
                          l => l.label_visible = evt.target.checked
                        )
                        set_data({...data})
                      }
                    }
                  />
                </Form.Group>
                <Form.Group as={Row} >
                  <Col>
                    <FormLabel>Position:</FormLabel>
                  </Col>
                  <Col>
                    <Form.Check
                      value ='beginning'
                      type='radio'
                      label='Début'
                      checked = {link.label_position === 'beginning'}
                      onChange = {
                        evt => {
                          selected_links.forEach(                              
                            l => l.label_position = evt.target.value
                          )
                          set_data({...data})
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <Form.Check
                      value ='middle'
                      type='radio'
                      label='Milieu'
                      checked = {link.label_position === 'middle'}
                      onChange = {
                        evt => {
                          selected_links.forEach(                              
                            l => l.label_position = evt.target.value
                          )
                          set_data({...data})
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <Form.Check
                      value ='end'
                      type='radio'
                      label='Fin'
                      checked = {link.label_position === 'end'}
                      onChange = {
                        evt => {
                          selected_links.forEach(                              
                            l => l.label_position = evt.target.value
                          )
                          set_data({...data})
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      value ='frozen'
                      type='radio'
                      label='Figé'
                      checked = {link.label_position === 'frozen'}
                      onChange = {
                        evt => {
                          selected_links.forEach(                              
                            l => l.label_position = evt.target.value
                          )
                          set_data({...data})
                        }
                      }
                    />
                  </Col>
                </Form.Group> 
                <Form.Group>
                  <FormCheck
                    type='checkbox'
                    label='Attaché au flux'
                    disabled = {link.label_position === 'frozen'}
                    checked = {link.label_on_path && link.label_position !== 'frozen'}
                    onChange = {
                      evt => {
                        selected_links.forEach(                              
                          l => l.label_on_path = evt.target.checked
                        )
                        set_data({...data})
                      }
                    }
                  />  
                </Form.Group>              
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  )
}
SankeyLinkEdition.propTypes = SankeyLinkEditionPropTypes
export default SankeyLinkEdition