import React, { useState, FunctionComponent } from 'react'
import { Button,Modal,Row,FormControl,Form,Col,FormLabel,FormCheck,Tabs, Tab,Table } from 'react-bootstrap'
import PropTypes,{InferProps} from 'prop-types'
import { arrangeNodes, updateLayout } from './SankeyLayout'
import { SankeyDataPropTypes } from './types'

const SankeySettingsEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  subchain: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  set_data: PropTypes.func.isRequired,
  set_show_graphic_attributes: PropTypes.func.isRequired,
  setSubChain: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  set_current_filter: PropTypes.func.isRequired
}

type SankeyEditionTypes = InferProps<typeof SankeySettingsEditionPropTypes>

const SankeySettingsEdition : FunctionComponent<SankeyEditionTypes> = ({
  data,subchain,set_data,set_show_graphic_attributes,setSubChain,show,set_current_filter
}) => {
  let file_layout: Blob[] | undefined
  
  const [shift_left, set_shift_left]  = useState(100)
  const [shift_top,  set_shift_top]   = useState(100)
  const [user_scale, set_user_scale]  = useState(data.user_scale)
  const [height,     set_height]      = useState(data.height)
  const [width,      set_width]       = useState(data.width)
  const [,          set_node_hspace] = useState(100)

  const { display_style,subchains,links,nodes} = data
  const region_names = Object.keys(data.links)
  const {node_width} = data
  const { filter } = display_style
  const keys = Object.keys(links)
  if (!keys.includes(data.region_name)) {
    data.region_name = keys[0]
  }

  let max_link_value = 0
  links[data.region_name].forEach(link=>{
    if (link.value > max_link_value) {
      max_link_value = link.value
    }
  })
  max_link_value +=1

  const nb_partition_elements = subchains.length
  // const units = ['tMS','t','m3']
  // const nb_units = units.length

  return (
    <Modal
      size="lg" 
      show={show}
      onHide={() => set_show_graphic_attributes(false)}
    >
      <Modal.Header closeButton>
        <Modal.Title>Réglages</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs defaultActiveKey="geometry" id="settings-layout">
          <Tab eventKey="geometry" title="Géometrie">
            <br></br>
            <Form>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Echelle</FormLabel>
                </Col>
                <Col>
                  <FormControl
                    type="text" 
                    value={user_scale}
                    onChange={evt => set_user_scale(+evt.target.value )}
                    onBlur={() => (data.user_scale = user_scale ) && (set_data({...data})) } 
                  />
                  <FormControl.Feedback />
                  <Form.Text>    (valeur pour 100px)</Form.Text>
                </Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Hauteur</FormLabel>
                </Col>
                <Col>
                  <FormControl
                    type="text" 
                    value={height}
                    onChange={evt => set_height(+evt.target.value)}
                    onBlur={() => (data.height = height ) && (set_data({...data})) } 
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel>Largeur</FormLabel>
                </Col>
                <Col>
                  <FormControl
                    type="text" 
                    value={width}
                    onChange={evt => set_width(+evt.target.value)}
                    onBlur={() => (data.width = width ) && (set_data({...data})) } 
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel>Shift horizontal</FormLabel>
                </Col>
                <Col>
                  <FormControl
                    type="text" 
                    value={shift_left}
                    onChange={evt => set_shift_left(+evt.target.value)}
                  />
                </Col>
                <Col >
                  <Button
                    size="sm" 
                    onClick={
                      () => { 
                        nodes.forEach((n)=>n.x += shift_left)
                        set_data({...data})
                      }
                    }
                  >Shift</Button>
                </Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel>Shift vertical</FormLabel>
                </Col>
                <Col>
                  <FormControl
                    type="text" 
                    value={shift_top}
                    onChange={evt => set_shift_top(+evt.target.value)}
                  />
                </Col>
                <Col>
                  <Button 
                    size="sm" 
                    onClick={
                      () => { 
                        nodes.forEach((n)=>n.y += shift_top)
                        set_data({...data})
                      }
                    }
                  >Shift</Button>
                </Col>
              </Form.Group> 
            </Form>
          </Tab>
          <Tab eventKey="layout" title="Positionnement"> 
            <br></br>
            <Form >                
              <Form.Group as={Row} >
                <Col>
                  <FormLabel>Layout</FormLabel>
                </Col>
                <Col>
                  <Form.Control
                    type="file" 
                    onChange={(evt : React.ChangeEvent) => file_layout = (evt.target as HTMLFormElement).files}
                  />
                </Col>
                <Col>
                  <Button 
                    size="sm" 
                    onClick={
                      () => {
                        if ( file_layout === undefined ) {
                          return 
                        }
                        const reader = new FileReader()
                        reader.onload = ( () => {
                          return( 
                            (e : ProgressEvent<FileReader> ) => {
                              let result = (e.target as FileReader).result
                              if (result) {
                                result = String(result).split('<br>').join('\\\\n')
                                const new_layout = JSON.parse(result)
                                updateLayout(data,data.region_name,new_layout)
                                set_data({...data})
                              }
                            }
                          )
                        })()
                        reader.readAsText(file_layout[0])
                      }
                    }>Appliquer Layout
                  </Button>
                </Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel>Espacement H</FormLabel>
                </Col>
                <Col>
                  <FormControl
                    type="text" 
                    onChange={evt => set_node_hspace(+evt.target.value)}
                  />
                </Col>
                <Col>
                  <Button 
                    size="sm" 
                    onClick={()=>arrangeNodes(data)}
                  >Arranger noeuds</Button>
                </Col>
              </Form.Group>
              {/* <Form.Group as={Row} >
                <Col sm={8}></Col>
                <Col  sm={4}>
                  <Button 
                    size="sm" 
                    onClick={optimizeLayout}
                  >Positionnement optimal</Button>
                </Col>
              </Form.Group> */}
            </Form>
          </Tab>
          <Tab eventKey="nodes" title="Noeuds">
            <br></br>
            <Form >
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Taille minimum</FormLabel>
                </Col>
                <Col>
                  <Form.Range
                    min="0" max="100"
                    value={node_width}
                    onChange={
                      evt => {
                        data.node_width = +evt.target.value
                        set_data({...data})
                      } 
                    }/>
                </Col>
                <Col>{node_width}</Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Taille police</FormLabel>
                </Col>
                <Col>
                  <Form.Range
                    min="11" max="20"
                    value={display_style.font_size}
                    onChange={evt => (display_style.font_size = +evt.target.value) && set_data({...data})} />
                </Col>
                <Col>{display_style.font_size}</Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Secteurs</FormLabel>
                </Col>
                <Col>
                  <FormCheck  
                    type='checkbox'
                    label='Bold'
                    checked = {display_style.sector_bold }
                    onChange = {
                      evt => {  
                        display_style.sector_bold = evt.target.checked
                        set_data({...data})
                      }
                    }
                  />
                </Col>
                <Col>
                  <FormCheck  
                    type='checkbox'
                    label='Upper'
                    checked = {display_style.sector_uppercase }
                    onChange = {
                      evt => {  
                        display_style.sector_uppercase = evt.target.checked
                        set_data({...data})
                      }
                    }
                  />
                </Col>
                <Col>
                  <FormCheck  
                    type='checkbox'
                    label='Italic'
                    checked = {display_style.sector_italic }
                    onChange = {
                      evt => {  
                        display_style.sector_italic = evt.target.checked
                        set_data({...data})
                      }
                    }
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Produits</FormLabel>
                </Col>
                <Col>
                  <FormCheck  
                    type='checkbox'
                    label='Bold'
                    checked = {display_style.product_bold }
                    onChange = {
                      evt => {  
                        display_style.product_bold = evt.target.checked
                        set_data({...data})
                      }
                    }
                  />
                </Col>
                <Col>
                  <FormCheck  
                    type='checkbox'
                    label='Upper'
                    checked = {display_style.product_uppercase }
                    onChange = {
                      evt => {  
                        display_style.product_uppercase = evt.target.checked
                        set_data({...data})
                      }
                    }
                  />
                </Col>
                <Col>
                  <FormCheck  
                    type='checkbox'
                    label='Italic'
                    checked = {display_style.product_italic }
                    onChange = {
                      evt => {  
                        display_style.product_italic = evt.target.checked
                        set_data({...data})
                      }
                    }
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <Button 
                    size="sm" 
                    onClick={
                      () => {
                        nodes.forEach(
                          node=>node.visible = true
                        ) 
                        set_data({...data})
                      }
                    }
                  >Reset visible</Button>
                </Col>
              </Form.Group>              
            </Form>
          </Tab>
          <Tab eventKey="flux" title="Flux">
            <br></br>
            <Form >
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Filtre</FormLabel>
                </Col>
                <Col>
                  <Form.Range
                    min="0" 
                    max={max_link_value}
                    value={filter}
                    onChange={evt => set_current_filter(Number(evt.target.value)) }/>
                </Col>
                <Col>{filter}</Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel>Filtre label</FormLabel>
                </Col>
                <Col >
                  <Form.Range
                    min="0" 
                    max={max_link_value}
                    value={display_style.filter_label}
                    onChange={evt => ((display_style.filter_label=+evt.target.value) || true) && set_data({...data}) }/>
                </Col>
                <Col>{display_style.filter_label}</Col>
              </Form.Group>
              <Form.Group as={Row} >

                <Col>
                  <FormLabel >Type :</FormLabel>
                </Col>
                <Col >
                  <FormCheck 
                    type='checkbox'
                    label='Courbe'
                    onChange={evt => {
                      region_names.forEach(
                        reg_name=> {
                          data.links[reg_name].forEach(
                            l => l.curved = evt.target.checked
                          )
                        }
                      )
                      set_data({...data})
                    }}
                  />
                </Col>
                <Col >
                  <FormCheck 
                    type='checkbox'
                    label='Flêche'
                    onChange={evt => {
                      region_names.forEach(
                        reg_name=> {
                          data.links[reg_name].forEach(
                            l => l.arrow = evt.target.checked
                          )
                        }
                      )
                      set_data({...data})
                    }}
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Courbure</FormLabel>
                </Col>
                <Col >
                  <Form.Range
                    min="0" max="1" step="0.1"
                    value={display_style.global_curvature}
                    onChange={evt => {
                      region_names.forEach(
                        reg_name=> {
                          display_style.global_curvature= Number(evt.target.value)  
                          data.links[reg_name].forEach(l=>{
                            if (!l.source_name.includes('(I)') && !l.target_name.includes('(E)') ) {
                              l.curvature = +evt.target.value
                            }
                          })
                          set_data({...data})
                        }
                      )
                    }}
                  />
                </Col>
                <Col>{display_style.global_curvature}</Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Label:</FormLabel>
                </Col>
                <Col >
                  <FormCheck 
                    name="label" 
                    label='Début'
                    value="beginning" 
                    type='radio'
                    onChange={
                      evt => {
                        data.links[data.region_name].forEach(
                          l => l.label_position = evt.target.value
                        )
                        set_data({...data}) 
                      }
                    }
                  />
                </Col>
                <Col >
                  <FormCheck
                    name="label" 
                    label='Milieu'
                    value="middle" 
                    type='radio'
                    onChange={evt => {
                      region_names.forEach(
                        reg_name => {
                          data.links[reg_name].forEach(
                            l=>l.label_position = evt.target.value
                          )
                        }
                      )
                      set_data({...data}) 
                    }}
                  />
                </Col>
                <Col >
                  <FormCheck
                    name="label" 
                    label='Fin' 
                    value="end" 
                    type='radio'
                    onChange={evt => {
                      region_names.forEach(
                        reg_name => {
                          data.links[reg_name].forEach(
                            l=>l.label_position = evt.target.value
                          )
                        }
                      )
                      set_data({...data}) 
                    }}
                  />
                </Col>
              </Form.Group>
              <Form.Group>
                <Col>
                  <FormCheck
                    type='checkbox'
                    label='Attaché au flux'
                    onChange={evt => {
                      region_names.forEach(
                        reg_name => {
                          data.links[reg_name].forEach(
                            l=>l.label_on_path = evt.target.checked
                          )
                        }
                      )
                      set_data({...data}) 
                    }}
                  />  
                </Col >
              </Form.Group> 
              <Form.Group as={Row} >
                <Col>
                  <FormCheck
                    value='black'
                    type='radio'
                    label='Label en noir'
                    onChange = {
                      () =>  {
                        region_names.forEach(
                          reg_name => {
                            data.links[reg_name].forEach(
                              l => l.text_color = 'black'
                            )
                          }
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
                    onChange = {
                      () =>  {
                        region_names.forEach(
                          reg_name => {
                            data.links[reg_name].forEach(
                              l => l.text_color = 'white'
                            )
                          }
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
                    onChange = {
                      () =>  {
                        region_names.forEach(
                          reg_name => {
                            data.links[reg_name].forEach(
                              l => l.text_color = l.color
                            )
                          }
                        )
                        set_data({...data})
                      }
                    }
                  />
                </Col>
              </Form.Group> 
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Taille police</FormLabel>
                </Col>
                <Col >
                  <Form.Range
                    min="11" max="20"
                    value={display_style.font_size}
                    onChange={evt => (display_style.font_size = +evt.target.value) && set_data({...data})} />
                </Col>
                <Col >{display_style.font_size}</Col>
              </Form.Group>
            </Form>            
          </Tab>
          <Tab eventKey="partitions" title="Tags" >
            <br></br>
            <Form.Group as={Row} >
              <FormLabel >Nb éléments:</FormLabel>
              <Col>
                <FormControl
                  type="text" 
                  value={nb_partition_elements}
                  onChange={
                    (evt : React.ChangeEvent) => {
                      const {subchains} = data
                      const new_nb_element = Number((evt.target as HTMLInputElement).value)
                      const length = subchains.length
                      if (subchains.length < new_nb_element ) {
                        for (let i=length;i<new_nb_element;i++) {
                          subchains.push('Element '+ i )
                        }
                      } else {
                        for (let i=new_nb_element;i<length;i++) {
                          subchains.pop()
                        }      
                      }
                      set_data({...data})    
                    }
                  } 
                />
              </Col>

              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Visible</th>
                    <th>Couleur</th>
                  </tr>
                </thead>
                <tbody>
                  {subchains.map(
                    (value,i) => { return(
                      <tr key={i.toString()}>
                        <td><FormControl 
                          id={i.toString()}
                          type="text"
                          value={value}
                          onChange={
                            (evt : React.ChangeEvent) => {
                              const {subchains} = data
                              const new_nb_element = evt.target as HTMLInputElement
                              const id = +new_nb_element.id
                              const name = new_nb_element.value
                              subchains[id] = name
                              set_data({...data}) 
                            }
                          }/></td>
                        <td> 
                          <FormCheck 
                            name={'element_visible'+i.toString()} 
                            defaultChecked={subchain.includes(value)}  
                            id={i.toString()}
                            type='checkbox' 
                            onChange={
                              (evt : React.ChangeEvent) => {
                                const {subchains} = data
                                const new_nb_element = evt.target as HTMLInputElement
                                const id = +new_nb_element.id
                                const name = subchains[id] 
                                const visible = new_nb_element.checked
                                let new_subchains = []
                                if (visible) {
                                  new_subchains = subchains
                                } else {
                                  for (let i=0;i<subchain.length;i++) {
                                    if (subchain[i] === name) {
                                      continue
                                    }
                                    new_subchains.push(subchain[i])
                                  }
                                }
                                setSubChain(new_subchains) 
                              }
                            }/>
                        </td>
                        <td></td>
                      </tr>
                    )})}
                </tbody>
              </Table>
            </Form.Group>
          </Tab>
          {/* <Tab eventKey="units" title="Unités" >
            <br></br>
            <Form.Group as={Row} >
              <FormLabel column sm={2}>Nb unités:</FormLabel>
              <Col sm={2}>
                <FormControl
                  type="text" value={nb_units}
                  //onChange={this.set_nb_units} 
                />
              </Col>

              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Unité naturelle</th>
                    <th>Coefficient de conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map(
                    (value,i) => { return(
                      <tr key={i.toString()}>
                        <td>
                          <FormControl 
                            id={i.toString()}
                            type="text"
                            value={value}
                            //onChange={this.set_unit_name}
                          />
                        </td>
                        <td> 
                          <FormCheck 
                            name={'element_visible'+i.toString()} 
                            defaultChecked={subchain.includes(value)}  
                            id={i.toString()}
                            type='checkbox' 
                            //onChange={this.set_natural_unit}
                          />
                        </td>
                        <td>
                          <FormControl 
                            id={i.toString()}
                            type="text"
                            value={value}
                            //onChange={this.set_unit_coeff}
                          />
                        </td>
                      </tr>
                    )})}
                </tbody>
              </Table>
            </Form.Group>
          </Tab> */}
        </Tabs>
      </Modal.Body>
    </Modal>

  )
}

SankeySettingsEdition.propTypes = SankeySettingsEditionPropTypes

export default SankeySettingsEdition