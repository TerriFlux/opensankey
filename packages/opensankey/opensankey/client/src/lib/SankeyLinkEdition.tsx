import React, { FunctionComponent, useState } from 'react'
import { Row, Form, Col, FormLabel, FormCheck, Tabs, Tab, FormControl, Table } from 'react-bootstrap'
import { SankeyDataPropTypes, SankeyLinkPropTypes, SankeyLinkValue } from './types'
import PropTypes, { InferProps } from 'prop-types'
import { default_link } from './SankeyUtils'

const SankeyLinkEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  //selected_link: PropTypes.shape(SankeyLinkPropTypes).isRequired,
  selected_link: PropTypes.shape({current:PropTypes.shape(SankeyLinkPropTypes).isRequired}).isRequired,

  show: PropTypes.bool.isRequired,

  multi_selected_links: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired}).isRequired,
}

type SankeyLinkEditionTypes = InferProps<typeof SankeyLinkEditionPropTypes>

const SankeyLinkEdition: FunctionComponent<SankeyLinkEditionTypes> = (
  { data, set_data, selected_link, multi_selected_links, children }
) => {
  const { fluxTags,dataTags } = data

  const tags_visible = Object.keys(fluxTags).length > 0
  const [tags_group_key, set_tags_group_key] = useState(tags_visible ? Object.keys(fluxTags)[0] : '')
  if ((tags_group_key == '' && Object.keys(fluxTags).length > 0) || (!Object.keys(fluxTags).includes(tags_group_key) && Object.keys(fluxTags).length > 0)) {
    set_tags_group_key(Object.keys(fluxTags)[0])
  }

  let link = selected_link.current
  if (link === undefined) {
    link = default_link(data)
  }

  const newEntries = new Map(Object.entries(dataTags).map(([dataTagKey, dataTag]) => {
    return (Object.keys(dataTag.tags).length > 0) ? [
      dataTagKey,
      Object.entries(dataTag.tags).filter(tag => tag[1].selected).length > 0 ? Object.entries(dataTag.tags).filter(tag => tag[1].selected)[0][0] : Object.keys(dataTag.tags)[0]] : ['n', 'n']
  }))
  //Créer un objet contenant la clé de chaque dataTag avec pour valeur la première tag de ces groupe
  const dataTagsSelected = Object.fromEntries(newEntries)
  //supprime les groupe tag qui n'ont pas de tag car on ne peux pas choisir de tags pour affecter une valeur au flux
  delete dataTagsSelected['n']
  const [tags_selected, set_tags_selected] = useState(dataTagsSelected)
  if (Object.keys(tags_selected).length !== Object.keys(dataTagsSelected).length) {
    set_tags_selected(dataTagsSelected)
  }

  //renvoie la valeur correspondant aux paramètre selectionné
  const value_selected_parameter = (): SankeyLinkValue => {
    if ( Object.keys(data.links).length === 0 || !(multi_selected_links.current[0].idLink in data.links) ) {
      let val = JSON.parse(JSON.stringify(Object(multi_selected_links.current[0].value)))
      Object.values(tags_selected).map(tag_selected => {
        if (val[tag_selected] === undefined) {
          val[tag_selected] = {}
        }
        val = val[tag_selected]
      })
      return val
    }
    let val = JSON.parse(JSON.stringify(Object(data.links[multi_selected_links.current[0].idLink].value)))
    Object.values(tags_selected).map(tag_selected => {
      if (val[tag_selected] === undefined) {
        val[tag_selected] = {}
      }
      val = val[tag_selected]
    })
    return val
  }

  const test_value=(v:number | null | undefined)=>{
    return (v || v==0) ? v:''
  }
  const center = selected_link.current.left_horiz_shift && selected_link.current.right_horiz_shift ? (selected_link.current.left_horiz_shift + selected_link.current.right_horiz_shift) / 2 : 0.5

  // DEFINITION DES FONCTIONS VERIFIANT QUE TOUTES LES VALEURS DES DIFÉRENTS PARAMÈTRES SOIENT IDENTIQUES 
  const gradChecked = () => {
    let gradChecked = true
    multi_selected_links.current.map(d => {
      gradChecked = (d.gradient) ? gradChecked : false
    })
    return gradChecked
  }
  const dashChecked = () => {
    let dashChecked = true
    multi_selected_links.current.map(d => {
      dashChecked = (d.dashed) ? dashChecked : false
    })
    return dashChecked
  }
  const labelVisibleChecked = () => {
    let labelVisibleChecked = true
    multi_selected_links.current.map(d => {
      labelVisibleChecked = (d.label_visible) ? labelVisibleChecked : false
    })
    return labelVisibleChecked
  }
  const shiftCenter = () => {
    let display_shift = true
    let center = 0.5
    if (multi_selected_links.current.length != 0) {
      center = multi_selected_links.current[0].left_horiz_shift && multi_selected_links.current[0].right_horiz_shift ? (multi_selected_links.current[0].left_horiz_shift + multi_selected_links.current[0].right_horiz_shift) / 2 : 0.5
    }
    multi_selected_links.current.map((d) => {
      const tmp = d.left_horiz_shift && d.right_horiz_shift ? (d.left_horiz_shift + d.right_horiz_shift) / 2 : 0.5
      display_shift = (tmp == center) ? display_shift : false
    })
    return (display_shift) ? center : 0
  }
  const shift = () => {
    let display_shift = true
    let shift = 0.5
    if (multi_selected_links.current.length != 0) {
      shift = multi_selected_links.current[0].shift_gap
    }
    multi_selected_links.current.map((d) => {
      display_shift = (d.shift_gap == shift) ? display_shift : false
    })
    return (display_shift) ? shift : 0
  }
  const linkOrientation = (param: string) => {
    let allChecked = true
    switch (param) {
    case 'hh':
      multi_selected_links.current.map(d => {
        allChecked = (d.orientation == 'hh') ? allChecked : false
      })
      return allChecked
      break
    case 'vv':
      multi_selected_links.current.map(d => {
        allChecked = (d.orientation == 'vv') ? allChecked : false
      })
      return allChecked

      break
    case 'hv':
      multi_selected_links.current.map(d => {
        allChecked = (d.orientation == 'hv') ? allChecked : false
      })
      return allChecked
      break
    case 'vh':
      multi_selected_links.current.map(d => {
        allChecked = (d.orientation == 'vh') ? allChecked : false
      })
      return allChecked

      break
    }

  }
  const courbure = () => {
    let display_courbe = true
    let courbe = 0.5
    if (multi_selected_links.current.length != 0) {
      courbe = multi_selected_links.current[0].curvature
    }
    multi_selected_links.current.map((d) => {
      display_courbe = (d.curvature == courbe) ? display_courbe : false
    })
    return (display_courbe) ? courbe : 0
  }
  const linkType = (param: string) => {
    let allChecked = true
    if (multi_selected_links.current.length != 0) {
      switch (param) {
      case 'courbe':
        multi_selected_links.current.map(d => {
          allChecked = (d.curved) ? allChecked : false
        })
        break
      case 'arrow':
        multi_selected_links.current.map(d => {
          allChecked = (d.arrow) ? allChecked : false
        })
        break
      case 'recycle':
        multi_selected_links.current.map(d => {
          allChecked = (d.recycling) ? allChecked : false
        })
        break
      }
      return allChecked
    } else {
      return false
    }
  }
  const linkLabelColor = (param: string) => {
    let allChecked = true

    if (multi_selected_links.current.length != 0) {
      switch (param) {
      case 'white':
        multi_selected_links.current.map(d => {
          allChecked = (d.text_color == 'white') ? allChecked : false
        })
        break
      case 'black':
        multi_selected_links.current.map(d => {
          allChecked = (d.text_color == 'black') ? allChecked : false
        })
        break
      case 'color':
        multi_selected_links.current.map(d => {
          allChecked = (d.text_color == d.color) ? allChecked : false
        })
        break
      }
      return allChecked
    } else {
      return false
    }
  }

  const labelPositionVert = (param: string) => {
    let allChecked = true
    if (multi_selected_links.current.length != 0) {
      switch (param) {
      case 'beginning':
        multi_selected_links.current.map(d => {
          allChecked = (d.label_position == 'beginning') ? allChecked : false
        })
        break
      case 'middle':
        multi_selected_links.current.map(d => {
          allChecked = (d.label_position == 'middle') ? allChecked : false
        })
        break
      case 'end':
        multi_selected_links.current.map(d => {
          allChecked = (d.label_position == 'end') ? allChecked : false
        })
        break
      }
      return allChecked
    } else {
      return false
    }
  }
  // const labelSticktoLink = () => {
  //   let labelSticktoLink = true
  //   multi_selected_links.current.map(d => {
  //     labelSticktoLink = (d.label_on_path && d.label_position !== 'frozen') ? labelSticktoLink : false
  //   })
  //   return labelSticktoLink
  // }
  const labelSticktoLinkDisabled = () => {
    let labelSticktoLink = false
    multi_selected_links.current.map(d => {
      labelSticktoLink = (d.label_on_path) ? true : labelSticktoLink
    })
    return labelSticktoLink
  }
  const labelLinkFree = () => {
    let labelLinkFree = false
    multi_selected_links.current.map(d => {
      labelLinkFree = (d.label_position === 'frozen'&& d.orthogonal_label_position === 'frozen') ? true : labelLinkFree
    })
    return labelLinkFree
  }
  const labelPositionOrtho = (param: string) => {
    let allChecked = true
    if (multi_selected_links.current.length != 0) {
      switch (param) {
      case 'above':
        multi_selected_links.current.map(d => {
          allChecked = (d.orthogonal_label_position == 'above') ? allChecked : false
        })
        break
      case 'middle':
        multi_selected_links.current.map(d => {
          allChecked = (d.orthogonal_label_position == 'middle') ? allChecked : false
        })
        break
      case 'below':
        multi_selected_links.current.map(d => {
          allChecked = (d.orthogonal_label_position == 'below') ? allChecked : false
        })
        break
      }
      return allChecked
    } else {
      return false
    }
  }

  //Onglet Tags du menu noeud pour selectionner un tag favorie si présent
  const link_tag = (
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
            {Object.entries(fluxTags).map(
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
            disabled={multi_selected_links.current.length === 0 || multi_selected_links.current[0].colorParameter !== 'groupTag'}
            checked={multi_selected_links.current.length > 0  && multi_selected_links.current[0].colorTag == tags_group_key}
            label='Palette'
            onChange={() => {
              multi_selected_links.current.forEach(link => link.colorTag = (link.colorTag === tags_group_key) ? Object.keys(fluxTags)[0] : tags_group_key)
              set_data({ ...data })
            }}
          />
        </Col>
      </Form.Group>
      {
        //Définition des valeurs selon les paramètre dataTags
        Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
          if (Object.keys(dataTag.tags).length != 0) {

            return (
              <Row key={dataTagKey}>
                <Col >
                  <FormLabel>
                    {dataTag.group_name} :
                  </FormLabel>
                </Col>

                <Col >

                  <Form.Select
                    name={dataTagKey}
                    value={tags_selected[dataTagKey]}
                    onChange={
                      (evt: React.ChangeEvent<HTMLSelectElement>) => {
                        //Modifie les paramètres selectionnés 
                        const { name, value } = evt.target
                        set_tags_selected(prevState => ({
                          ...prevState,
                          [name]: value
                        }))
                      }
                    }
                  >
                    {Object.entries(dataTag.tags).map(([tag_key, tag]) => {
                      return (
                        <option key={tag.name} value={tag_key}>{tag.name}</option>
                      )
                    })}
                  </Form.Select>
                </Col>
              </Row>
            )
          }

        })}
      <Form.Group xs={12} as={Row} >
        <Table striped bordered hover className='link_tags_affiliation'>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Appartenance</th>
            </tr>
          </thead>
          <tbody>
            {tags_visible && tags_group_key != '' && Object.keys(fluxTags).includes(tags_group_key) ? Object.entries(fluxTags[tags_group_key].tags).map(
              ([tag_key,tag]) => {
               
                return (
                  <tr key={tag_key}>
                    <td><FormLabel>{tag.name}</FormLabel></td>
                    <td>
                      <FormCheck
                        name={'element_visible' + tag_key}
                        checked={value_selected_parameter().tags[tags_group_key] === tag_key}
                        id={tag_key}
                        type='checkbox'
                        onChange={
                          (evt: React.ChangeEvent) => {
                            const new_nb_element = evt.target as HTMLInputElement
                            const new_tag_key = new_nb_element.id
                            const visible = new_nb_element.checked
                            Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                              let val = Object(d.value)
                              Object.values(tags_selected).forEach(tag => {
                                if (val[tag] === undefined) {
                                  val[tag] = {}
                                }
                                val = val[tag]
                              })
                              val.tags[tags_group_key] = visible ? new_tag_key : ''
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
        <Tabs defaultActiveKey="flux_data" id="settings-layout">
          <Tab eventKey="flux_data" title="Données">
            <Form >
              {
                //Définition des valeurs selon les paramètre dataTags
                Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
                  if (Object.keys(dataTag.tags).length != 0) {

                    return (
                      <Row key={dataTagKey}>
                        <Col >
                          <FormLabel>
                            {dataTag.group_name} :
                          </FormLabel>
                        </Col>

                        <Col >

                          <Form.Select
                            name={dataTagKey}
                            value={tags_selected[dataTagKey]}
                            onChange={
                              (evt: React.ChangeEvent<HTMLSelectElement>) => {
                                //Modifie les paramètres selectionnés 
                                const { name, value } = evt.target
                                set_tags_selected(prevState => ({
                                  ...prevState,
                                  [name]: value
                                }))
                              }
                            }
                          >
                            {Object.entries(dataTag.tags).map(([tag_key, tag]) => {
                              return (
                                <option key={tag.name} value={tag_key}>{tag.name}</option>
                              )
                            })}
                          </Form.Select>
                        </Col>
                      </Row>
                    )
                  }

                })}
              <Row >
                <Col>
                  <FormLabel>Valeur pour ces paramètres</FormLabel>
                </Col>
                <Col>
                  <Form.Control
                    type='text'
                    value={test_value(value_selected_parameter().value)}
                    onChange={
                      evt => {
                        if(!isNaN(+evt.target.value)){
                          let val = Object(selected_link.current.value)
                          multi_selected_links.current.map(d => {
                            val = d.value
                            Object.values(tags_selected).forEach(tag => {
                              if (val[tag] === undefined) {
                                val[tag] = {}
                              }
                              val = val[tag]
                            })
                            val.value = +evt.target.value
  
                          })
                        }else{
                          console.log('hello')
                          let val = Object(selected_link.current.value)
                          multi_selected_links.current.map(d => {
                            val = d.value
                            Object.values(tags_selected).forEach(tag => {
                              if (val[tag] === undefined) {
                                val[tag] = {}
                              }
                              val = val[tag]
                            })
                            val.value = ''
  
                          })
                        }
                        
      
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
              </Row>
              <Row >
                <Col>
                  <FormLabel>Affichage</FormLabel>
                </Col>
                <Col>
                  <Form.Control
                    type='text'
                    value={value_selected_parameter().display_value}
                    onChange={
                      evt => {
                        let val = Object(selected_link.current.value)
                        multi_selected_links.current.map(d => {
                          val = d.value
                          Object.values(tags_selected).forEach(tag => {
                            if (val[tag] === undefined) {
                              val[tag] = {}
                            }
                            val = val[tag]
                          })
                          val.display_value = evt.target.value
                          

                        })
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
              </Row>

            </Form>
          </Tab>
          <Tab eventKey="flux_attributes" title="Apparence">
            <Form >

              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Couleur:</FormLabel>
                </Col>
                <Col>
                  <Form.Control
                    type="color"
                    value={(multi_selected_links.current.length == 1) ? multi_selected_links.current[0].color : '#ffffff'}
                    onChange={
                      evt => {
                        // selected_link.current.color = evt.target.value
                        const color = evt.target.value
                        multi_selected_links.current.map(d => d.color = evt.target.value)
                        Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => d.color = color)
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
              </Form.Group>


              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Gradient:</FormLabel>
                </Col>
                <Col>
                  <Form.Check
                    inline
                    type="checkbox"
                    checked={
                      gradChecked()
                    }
                    onChange={
                      evt => {
                        // selected_link.gradient = evt.target.checked
                        Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => d.gradient = evt.target.checked)
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Hachuré:</FormLabel>
                </Col>
                <Col>
                  <Form.Check
                    inline
                    type="checkbox"
                    checked={
                      dashChecked()
                    }
                    onChange={
                      evt => {
                        // selected_link.gradient = evt.target.checked
                        Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => d.dashed = evt.target.checked)
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Position du centre</FormLabel>
                </Col>
                <Col>
                 
                  <FormControl
                    min={0} max={1} step={0.01}
                    type={'number'}
                    value={shiftCenter()}
                    onChange={
                      evt => {
                        Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                          if (+evt.target.value - d.shift_gap < 0) {
                            return
                          }
                          if (+evt.target.value + d.shift_gap > 1) {
                            return
                          }
                          d.left_horiz_shift = +evt.target.value - d.shift_gap
                          d.right_horiz_shift = +evt.target.value + d.shift_gap
                        })

                        set_data({ ...data })
                      }
                    } />
                </Col>
                <Col sm={2}>{selected_link.current.shift_gap}</Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel >Ecart entre Poignées</FormLabel>
                </Col>
                <Col>
                  

                  <FormControl
                    min={0} max={0.5} step={0.01}
                    type={'number'}
                    value={shift()}
                    onChange={
                      evt => {
                        Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                          if (center - +evt.target.value < 0) {
                            return
                          }
                          if (center + +evt.target.value > 1) {
                            return
                          }
                          d.shift_gap = +evt.target.value
                          d.left_horiz_shift = center - d.shift_gap
                          d.right_horiz_shift = center + d.shift_gap
                        })

                        set_data({ ...data })
                      }
                    } />
                </Col>
                <Col sm={2}>{selected_link.current.shift_gap}</Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel>Type:</FormLabel>
                </Col>
                <Col>
                  <FormCheck
                    type='checkbox'
                    label='Courbe'
                    checked={linkType('courbe')}
                    onChange={
                      evt => {
                        Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => d.curved = evt.target.checked)

                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
                <Col>
                  <FormCheck
                    type='checkbox'
                    label='Flèche'
                    checked={linkType('arrow')}
                    onChange={
                      evt => {
                        Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => d.arrow = evt.target.checked)
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
                <Col>
                  <FormCheck
                    type='checkbox'
                    label='Recyclage'
                    checked={linkType('recycle')}
                    onChange={
                      evt => {
         
                        Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                          d.recycling = evt.target.checked
                          delete d.left_horiz_shift
                          delete d.right_horiz_shift
                        })


                        set_data({ ...data })
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
                  <FormControl

                    min={0} max={1} step={0.01}
                    type={'number'}
                    value={courbure()}
                    onChange={
                      evt => {
                        Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                          d.curvature = +evt.target.value
                        })

                        set_data({ ...data })
                      }
                    } />
                </Col>
                <Col sm={2}>{selected_link.current.curvature}</Col>
              </Form.Group>
              <Form.Group as={Row} >
                <Col sm={12}>
                  <FormCheck
                    inline
                    name='orientation'
                    type='radio'
                    label='Horiz-Horiz'
                    value='hh'
                    checked={linkOrientation('hh')}
                    onChange={
                      evt => {
                        Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                          d.orientation = evt.target.value
                        })
                        set_data({ ...data })
                      }
                    }
                  />
                  <FormCheck
                    inline
                    name='orientation'
                    type='radio'
                    label='Vert-Vert'
                    value='vv'
                    checked={linkOrientation('vv')}
                    onChange={
                      evt => {
                        Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                          d.orientation = evt.target.value
                        })
                        set_data({ ...data })
                      }
                    }
                  />
                  <FormCheck
                    inline
                    name='orientation'
                    type='radio'
                    label='Vert-Horiz'
                    value='vh'
                    checked={linkOrientation('vh')}
                    onChange={
                      evt => {
                        Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                          d.orientation = evt.target.value
                        })
                        set_data({ ...data })
                      }
                    }
                  />
                  <FormCheck
                    inline
                    name='orientation'
                    type='radio'
                    label='Horiz-Vert'
                    value='hv'
                    checked={linkOrientation('hv')}
                    onChange={
                      evt => {
                        Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                          d.orientation = evt.target.value
                        })
                        set_data({ ...data })
                      }
                    }
                  />
                </Col>
              </Form.Group>
            </Form>
          </Tab>
          <Tab eventKey="label" title="Label">
            <Form.Group as={Row} >
              <Col>
                <FormCheck
                  value='black'
                  type='radio'
                  label='Label en noir'
                  checked={linkLabelColor('black')}
                  onChange={
                    (evt) => {
                      Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                        d.text_color = evt.target.value
                      })
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
              <Col>
                <FormCheck
                  value='white'
                  type='radio'
                  label='Label blanc'
                  checked={linkLabelColor('white')}
                  onChange={
                    (evt) => {
                      Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                        d.text_color = evt.target.value
                      })
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
              <Col>
                <FormCheck
                  value='same_color'
                  type='radio'
                  label='Label en couleur'
                  checked={linkLabelColor('color')}
                  onChange={
                    () => {
                      Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                        d.text_color = d.color
                      })
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
            </Form.Group>
            <Form.Group >
              <FormCheck
                type='checkbox'
                label='Label visible'
                checked={labelVisibleChecked()}
                onChange={
                  evt => {
                    Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                      d.label_visible = evt.target.checked
                    })
                    set_data({ ...data })
                  }
                }
              />
            </Form.Group>
            <Form.Group as={Row}>
              <Col>
                <FormCheck
                  type='checkbox'
                  label='Aligner avec le chemin du flux'
                  // disabled={selected_link.current.label_position === 'frozen'}
                  checked={labelSticktoLinkDisabled()}
                  onChange={
                    evt => {
                      Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                        d.label_on_path = evt.target.checked
                        d.label_position=(d.label_position=='frozen')?'middle':d.label_position
                        d.orthogonal_label_position=(d.orthogonal_label_position=='frozen')?'middle':d.orthogonal_label_position
                      })
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
              <Col>
                <FormCheck 
                  type='checkbox'
                  label='Label Flux Libre'
                  // disabled={selected_link.current.label_position === 'frozen'}
                  checked={labelLinkFree()}
                  onChange={
                    evt => {
                      Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                        d.label_on_path = (evt.target.checked)?false:d.label_on_path
                        d.label_position=(evt.target.checked)?'frozen':'middle'
                        d.orthogonal_label_position=(evt.target.checked)?'frozen':'middle'
                      })
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} >
              <Col>
                <FormLabel>Position laterale:</FormLabel>
              </Col>
              <Col>
                <Form.Check
                  value='beginning'
                  type='radio'
                  label='Début'
                  checked={labelPositionVert('beginning')}
                  onChange={
                    evt => {
                      Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                        d.label_position = evt.target.value
                        d.orthogonal_label_position=(d.orthogonal_label_position=='frozen')?'middle':d.orthogonal_label_position
                      })
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
              <Col>
                <Form.Check
                  value='middle'
                  type='radio'
                  label='Milieu'
                  checked={labelPositionVert('middle')}
                  onChange={
                    evt => {
                      Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                        d.label_position = evt.target.value
                        d.orthogonal_label_position=(d.orthogonal_label_position=='frozen')?'middle':d.orthogonal_label_position
                      })
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
              <Col>
                <Form.Check
                  value='end'
                  type='radio'
                  label='Fin'
                  checked={labelPositionVert('end')}
                  onChange={
                    evt => {
                      Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                        d.label_position = evt.target.value
                        d.orthogonal_label_position=(d.orthogonal_label_position=='frozen')?'middle':d.orthogonal_label_position
                      })
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} >
              <Col>
                <FormLabel>Position orthogonale:</FormLabel>
              </Col>
              <Col>
                <Form.Check
                  value='below'
                  type='radio'
                  label='Dessous'
                  checked={labelPositionOrtho('below')}

                  onChange={
                    evt => {
                      Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                        d.orthogonal_label_position = evt.target.value
                        d.label_position=(d.label_position=='frozen')?'middle':d.label_position
                      })
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
              <Col>
                <Form.Check
                  value='middle'
                  type='radio'
                  label='Milieu'
                  checked={labelPositionOrtho('middle')}
                  onChange={
                    evt => {
                      Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                        d.orthogonal_label_position = evt.target.value
                        d.label_position=(d.label_position=='frozen')?'middle':d.label_position
                      })
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
              <Col>
                <Form.Check
                  value='above'
                  type='radio'
                  label='Dessus'
                  checked={labelPositionOrtho('above')}

                  onChange={
                    evt => {
                      Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                        d.orthogonal_label_position = evt.target.value
                        d.label_position=(d.label_position=='frozen')?'middle':d.label_position
                      })
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
            </Form.Group>
          </Tab>
          {Object.keys(fluxTags).length > 0 ? link_tag : (<></>)}
          <Tab eventKey="flux_tooltip" title="Info-bulle">
            <Form >
              <Row>
                <FormLabel column sm={1}>Info-bulle:</FormLabel>
                <Col sm={11}>
                  <Form.Control
                    as="textarea"
                    rows={10}
                    value={selected_link.current.tooltip_text ? selected_link.current.tooltip_text : ''}
                    onChange={evt => {
                      selected_link.current.tooltip_text = evt.target.value
                      set_data({ ...data })
                    }}
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
}

SankeyLinkEdition.propTypes = SankeyLinkEditionPropTypes

export default SankeyLinkEdition