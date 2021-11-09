import React, { useState, FunctionComponent } from 'react'
import { Button, Row, FormControl, Form, Col, FormLabel, FormCheck, Tabs, Tab, Table, ButtonGroup } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { setSelectedTags } from './SankeyUtils'
import { SankeyDataPropTypes } from './types'

const SankeySettingsEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  set_show_graphic_attributes: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  set_current_filter: PropTypes.func.isRequired,
  key_tag: PropTypes.number.isRequired,
  key_group_tag: PropTypes.number.isRequired,
  selected_key_group_tag: PropTypes.number.isRequired,
  set_key_tag: PropTypes.func.isRequired,
  set_key_group_tag: PropTypes.func.isRequired,
  set_selected_key_group_tag: PropTypes.func.isRequired,
}

type SankeyEditionTypes = InferProps<typeof SankeySettingsEditionPropTypes>

const SankeySettingsEditionV2: FunctionComponent<SankeyEditionTypes> = (
  { data, set_data, set_show_graphic_attributes, show,
    set_current_filter, key_group_tag, key_tag, selected_key_group_tag,
    set_key_tag,
    set_key_group_tag,
    set_selected_key_group_tag,
    children }
) => {
  let file_layout: Blob[] | undefined

  const [shift_left, set_shift_left] = useState(100)
  const [shift_top, set_shift_top] = useState(100)
  const [user_scale, set_user_scale] = useState(data.user_scale)
  const [height, set_height] = useState(data.height)
  const [width, set_width] = useState(data.width)
  const [node_hspace, set_node_hspace] = useState(100)
  const [tag_group_id, set_tag_group_id] = useState(0)


  const { display_style, tags_catalog, links, nodes, node_width } = data
  const { filter } = display_style

  let region_index = 0
  const tags_group = tags_catalog.filter(tags_group => tags_group.group_name === 'Regions')
  if (tags_group.length > 1) {
    region_index = tags_group[0].tags.indexOf(tags_group[0].selected_tags[0])
  }

  let max_link_value = 0
  links.forEach(link => {
    if (link.value[region_index] > max_link_value) {
      max_link_value = link.value[region_index]
    }
  })
  max_link_value += 1

  const current_tags_group = tags_catalog[tag_group_id]
  let selected_tags: string[] = []
  if (current_tags_group) {
    selected_tags = current_tags_group.selected_tags
  }

  return (
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
                onChange={evt => set_user_scale(+evt.target.value)}
                onBlur={() => {
                  data.user_scale = user_scale
                  set_data({ ...data })
                }}
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
                onBlur={() => {
                  data.height = height
                  set_data({ ...data })
                }}
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
                onBlur={() => {
                  data.width = width
                  set_data({ ...data })
                }}
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
                    nodes.forEach((n) => n.x += shift_left)
                    set_data({ ...data })
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
                    nodes.forEach((n) => n.y += shift_top)
                    set_data({ ...data })
                  }
                }
              >Shift</Button>
            </Col>
          </Form.Group>
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
                    set_data({ ...data })
                  }
                } />
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
                onChange={evt => {
                  display_style.font_size = +evt.target.value
                  set_data({ ...data })
                }}
              />
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
                checked={display_style.sector_bold}
                onChange={
                  evt => {
                    display_style.sector_bold = evt.target.checked
                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col>
              <FormCheck
                type='checkbox'
                label='Upper'
                checked={display_style.sector_uppercase}
                onChange={
                  evt => {
                    display_style.sector_uppercase = evt.target.checked
                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col>
              <FormCheck
                type='checkbox'
                label='Italic'
                checked={display_style.sector_italic}
                onChange={
                  evt => {
                    display_style.sector_italic = evt.target.checked
                    set_data({ ...data })
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
                checked={display_style.product_bold}
                onChange={
                  evt => {
                    display_style.product_bold = evt.target.checked
                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col>
              <FormCheck
                type='checkbox'
                label='Upper'
                checked={display_style.product_uppercase}
                onChange={
                  evt => {
                    display_style.product_uppercase = evt.target.checked
                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col>
              <FormCheck
                type='checkbox'
                label='Italic'
                checked={display_style.product_italic}
                onChange={
                  evt => {
                    display_style.product_italic = evt.target.checked
                    set_data({ ...data })
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
                      node => {
                        node.visible = true
                        node.label_visible = true
                      }
                    )
                    set_data({ ...data })
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
                onChange={evt => set_current_filter(Number(evt.target.value))} />
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
                onChange={evt => {
                  display_style.filter_label = +evt.target.value
                  set_data({ ...data })
                }}
              />
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
                  data.links.filter(l => l.visible).forEach(
                    l => l.curved = evt.target.checked
                  )
                  set_data({ ...data })
                }}
              />
            </Col>
            <Col >
              <FormCheck
                type='checkbox'
                label='Flêche'
                onChange={evt => {
                  data.links.filter(l => l.visible).forEach(
                    l => l.arrow = evt.target.checked
                  )
                  set_data({ ...data })
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
                  display_style.global_curvature = +evt.target.value
                  data.links.filter(l => l.visible).forEach(l => l.curvature = +evt.target.value)
                  set_data({ ...data })
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
                    data.links.filter(l => l.visible).forEach(
                      l => l.label_position = evt.target.value
                    )
                    set_data({ ...data })
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
                  data.links.filter(l => l.visible).forEach(
                    l => l.label_position = evt.target.value
                  )
                  set_data({ ...data })
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
                  data.links.filter(l => l.visible).forEach(
                    l => l.label_position = evt.target.value
                  )
                  set_data({ ...data })
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
                  data.links.filter(l => l.visible).forEach(
                    l => l.label_on_path = evt.target.checked
                  )
                  set_data({ ...data })
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
                onChange={
                  () => {
                    data.links.filter(l => l.visible).forEach(
                      l => l.text_color = 'black'
                    )
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
                onChange={
                  () => {
                    data.links.filter(l => l.visible).forEach(
                      l => l.text_color = 'white'
                    )
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
                onChange={
                  () => {
                    data.links.filter(l => l.visible).forEach(
                      l => l.text_color = l.color
                    )
                    set_data({ ...data })
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
                onChange={evt => {
                  display_style.font_size = +evt.target.value
                  set_data({ ...data })
                }}
              />
            </Col>
            <Col >{display_style.font_size}</Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col>
              <Button
                size="sm"
                onClick={
                  () => {
                    links.forEach(
                      link => {
                        link.visible = true
                        link.label_visible = true
                      }
                    )
                    set_data({ ...data })
                  }
                }
              >Reset visible</Button>
            </Col>
          </Form.Group>
        </Form>
      </Tab>
      {children}
    </Tabs>


  )
}






const SankeySettingsEditionTags: FunctionComponent<SankeyEditionTypes> = ({
  data, set_data, set_show_graphic_attributes, show, set_current_filter,
  key_tag, key_group_tag, selected_key_group_tag, children,
  set_key_tag,
  set_key_group_tag,
  set_selected_key_group_tag,
}) => {
  let file_layout: Blob[] | undefined


  const [tag_group_id, set_tag_group_id] = useState(0)
  const [tag_id, set_tag_id] = useState<number>(-1)

  console.log(data)

  const { display_style, tags_catalog, links, node_width, tags_catalog_v2 } = data

  let region_index = 0
  const tags_group = tags_catalog.filter(tags_group => tags_group.group_name === 'Regions')
  if (tags_group.length > 1) {
    region_index = tags_group[0].tags.indexOf(tags_group[0].selected_tags[0])
  }

  let max_link_value = 0
  links.forEach(link => {
    if (link.value[region_index] > max_link_value) {
      max_link_value = link.value[region_index]
    }
  })
  max_link_value += 1


  let tmp_select_group_key = selected_key_group_tag

  if (Object.keys(tags_catalog_v2).length > 0 && tags_catalog_v2['tag_group_' + selected_key_group_tag] === undefined) {
    set_selected_key_group_tag(parseInt(Object.keys(tags_catalog_v2)[0].slice(10)))
    tmp_select_group_key = parseInt(Object.keys(tags_catalog_v2)[0].slice(10))

  }








  // if (tags_catalog[tag_group_id]) {
  //   const tag_group_name = tags_catalog[tag_group_id].group_name
  //   if (!selected_tags[tag_group_name]) {
  //     selected_tags[tag_group_name] = []
  //   }
  // }
  // const nb_partition_elements = tags.length
  // const units = ['tMS','t','m3']
  // const nb_units = units.length



  const handleAddTagGrpButton = () => {
    const { tags_catalog } = data
    const length = tags_catalog.length

    tags_catalog[length] = {
      group_name: 'Tag Group ' + length,
      tags: [],
      selected_tags: []
    }

    set_data({ ...data })

  }



  const handleAddTagButton = () => {
    const { tags_catalog } = data
    const length = tags_catalog[tag_group_id].tags.length
    tags_catalog[tag_group_id].tags.push('Element ' + length)
    set_data({ ...data })

  }



  const handleDelTag = (n: number) => {
    const { tags_catalog } = data
    tags_catalog[tag_group_id].tags.splice(n, 1)
    set_data({ ...data })
  }

  const handleDelGroupTag = (i: number) => {
    const { tags_catalog } = data
    tags_catalog.splice(i, 1)
    set_data({ ...data })
  }

  /*   const handleBanner = (i: number, evt: React.ChangeEvent<HTMLSelectElement>) => {
      tags_catalog[i].banner = evt.target.value
      set_data({ ...data })
    } */
  const handleBanner = (i: number, evt: React.ChangeEvent<HTMLSelectElement>) => {
    tags_catalog_v2['tag_group_' + i].banner = evt.target.value
    set_data({ ...data })
  }
  // ------------------V2--------------------------
  const handleAddTagButtonV2 = () => {
    const { tags_catalog_v2 } = data
    tags_catalog_v2['tag_group_' + selected_key_group_tag].tags['element' + key_tag] = { name: 'tag' + key_tag, color: '' }
    set_key_tag(key_tag + 1)
    set_data({ ...data })
  }

  const handleAddTagGrpButtonV2 = () => {
    const { tags_catalog_v2 } = data
    const tab_key = Object.keys(tags_catalog_v2)
    let tmp_key = key_group_tag
    if (tab_key.length > 0) {
      tmp_key = parseInt(tab_key[tab_key.length - 1].slice(10)) + 1
    }
    tags_catalog_v2['tag_group_' + tmp_key] = {
      group_name: 'Tag Group ' + tmp_key,
      tags: {},
      selected_tags: []
    }
    set_key_group_tag(tmp_key + 1)
    if (Object.keys(tags_catalog_v2).length == 1) {
      set_selected_key_group_tag(tmp_key)
    }
    set_data({ ...data })
  }



  const handleDelTagV2 = (n: string) => {
    const { tags_catalog_v2 } = data
    delete tags_catalog_v2['tag_group_' + selected_key_group_tag].tags[n]

    set_data({ ...data })
  }

  const handleDelGroupTagV2 = (i: string) => {
    const { tags_catalog_v2 } = data
    console.log(i)
    delete tags_catalog_v2[i]
    if (Object.keys(tags_catalog_v2).length > 0) {
      const lastElmt = Object.keys(tags_catalog_v2)[Object.keys(tags_catalog_v2).length - 1]
      set_selected_key_group_tag(parseInt(lastElmt.slice(10)))
    }
    set_data({ ...data })

  }

  const handleBannerV2 = (i: string, evt: React.ChangeEvent<HTMLSelectElement>) => {
    const { tags_catalog_v2 } = data
    tags_catalog_v2[i].banner = evt.target.value
    set_data({ ...data })
  }












  const current_tags_group = tags_catalog[tag_group_id]
  let selected_tags: string[] = []
  if (current_tags_group) {
    selected_tags = current_tags_group.selected_tags
  }
  const optionTag = () => {

    if (tags_catalog.length == 0) {
      return <option></option>
    } else {
      return (tags_catalog[tag_group_id].tags.map(
        (t, i) =>
          <option
            key={i}
            value={i}
            selected={tags_catalog[tag_group_id].tags[i] == tags_catalog[tag_group_id].tags[0]} >
            {t}
          </option>))
    }
  }
  const tagSetting = (<>
    <Form.Group as={Row} >
      <Col>
        <FormLabel >Tag Groupe:</FormLabel>
      </Col>
      <Col>
        <Form.Select onChange={
          (evt: React.ChangeEvent<HTMLSelectElement>) => {
            set_selected_key_group_tag(evt.target.value as any)
            set_data({ ...data })
          }}>
          {Object.keys(tags_catalog_v2).map(
            (key, i) =>
              <option
                key={i}
                value={parseInt(key.substring(10, key.length))}
                selected={'tag_group_' + selected_key_group_tag === key} >
                {tags_catalog_v2[key].group_name}
              </option>
          )}
        </Form.Select>
      </Col>
    </Form.Group>


    <Table striped bordered hover responsive='sm' size='sm'>
      <thead>
        <tr>
          <th></th>
          <th>Nom</th>
          <th>Visible</th>
          <th>Couleur</th>
        </tr>
      </thead>
      <tbody>




        {Object.keys(tags_catalog_v2).length > 0 ? Object.keys(tags_catalog_v2['tag_group_' + tmp_select_group_key].tags).map(
          (tag_key, i) => {
            return (
              <tr key={i.toString()}>
                <td style={{ 'width': '10%' }}><Button variant="danger" value='-' onClick={() => { handleDelTagV2(tag_key) }}>-</Button></td>

                <td style={{ 'width': '33%' }}>
                  <FormControl size='sm'
                    id={i.toString()}
                    type="text"
                    value={tag_key}
                    onChange={
                      (evt: React.ChangeEvent) => {
                        const { tags_catalog_v2 } = data
                        const new_nb_element = evt.target as HTMLInputElement
                        const name = new_nb_element.value
                        tags_catalog_v2['tag_group_' + selected_key_group_tag].tags[tag_key].name = name
                        set_data({ ...data })
                      }
                    } /></td>
                <td style={{ 'width': '10%' }}>
                  <Form.Check inline={true}
                    name={'element_visible' + tag_key}
                    checked={false/* selected_tags.includes(current_tags_group.tags[i]) */}
                    id={i.toString()}
                    type='switch'
                    onChange={
                      (evt: React.ChangeEvent) => {
                        const new_nb_element = evt.target as HTMLInputElement
                        const id = +new_nb_element.id
                        const name = current_tags_group.tags[id]
                        const visible = new_nb_element.checked
                        if (visible) {
                          if (!selected_tags) {
                            selected_tags = []
                          }
                          selected_tags.push(name)
                        } else {
                          selected_tags.splice(selected_tags.indexOf(name), 1)
                        }
                        setSelectedTags(data)
                        set_data({ ...data })
                      }
                    } />
                </td>

                <td><Form.Control
                  type="color"
                  value={'red'}
                  onChange={
                    evt => {
                      tags_catalog_v2['tag_group_' + selected_key_group_tag].tags[tag_key].color = evt.target.value
                      set_data({ ...data })
                    }
                  }
                /></td>
              </tr>
            )
          }) : (<></>)}


      </tbody>
    </Table>

    <Button variant="success" value='+' onClick={handleAddTagButtonV2}>+</Button> </>
  )

  return (
    <>
      {/*  <Table striped bordered hover>
        <thead>
          <tr>
            <th></th>
            <th>Nom</th>
            <th>Nombre tag</th>
            <th>Bannière</th>
          </tr>
        </thead>
        <tbody>
          {tags_catalog.map(
            (tags_group, i) => {
              return (
                <tr key={i.toString()}>
                  <td style={{ 'width': '10%' }}>
                    <Button variant="danger" onClick={() => handleDelGroupTag(i)}>-</Button>
                  </td>
                  <td>
                    <FormControl
                      id={i.toString()}
                      type="text"
                      value={tags_group.group_name}
                      onChange={
                        (evt: React.ChangeEvent) => {
                          const { tags_catalog } = data
                          const new_name = (evt.target as HTMLInputElement).value
                          tags_catalog[i].group_name = new_name
                          set_data({ ...data })
                        }
                      } />
                  </td>
                  <td>{tags_catalog[i].tags.length}</td>
                  <Form.Select onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => handleBanner(i as number, evt)}>
                    <option key={i} id='NoneBaner' selected={tags_group.banner === 'none' || !tags_group.banner} value='none'>None</option>
                    <option key={i} id='OneBaner' selected={tags_group.banner === 'one'} value='one'>One</option>
                    <option key={i} id='MultipleBaner' selected={tags_group.banner === 'multi'} value='multi'>Multi</option>
                  </Form.Select>

                </tr>
              )
            })}
        </tbody>
      </Table> */}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th></th>
            <th>Nom</th>
            <th>Nombre tag</th>
            <th>Bannière</th>
          </tr>
        </thead>
        <tbody>
          {
            Object.keys(tags_catalog_v2).map(
              (key, i) => {
                return (
                  <tr key={i.toString()}>
                    <td style={{ 'width': '10%' }}>
                      <Button variant="danger" onClick={() => handleDelGroupTagV2(key)}>-</Button>
                    </td>
                    <td>
                      <FormControl
                        id={i.toString()}
                        type="text"
                        value={tags_catalog_v2[key].group_name}
                        onChange={
                          (evt: React.ChangeEvent) => {
                            const { tags_catalog_v2 } = data
                            const new_name = (evt.target as HTMLInputElement).value
                            tags_catalog_v2[key].group_name = new_name
                            set_data({ ...data })
                          }
                        } />
                    </td>
                    <td>{Object.keys(tags_catalog_v2[key].tags).length}</td>
                    <Form.Select onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => handleBanner(i as number, evt)}>
                      <option key={'none' + i} id='NoneBaner' selected={tags_catalog_v2[key].banner === 'none' || !tags_catalog_v2[key].banner} value='none'>None</option>
                      <option key={'one' + i} id='OneBaner' selected={tags_catalog_v2[key].banner === 'one'} value='one'>One</option>
                      <option key={'multi' + i} id='MultipleBaner' selected={tags_catalog_v2[key].banner === 'multi'} value='multi'>Multi</option>
                    </Form.Select>

                  </tr>
                )
              })
          }
        </tbody>
      </Table>

      <Button variant="success" onClick={handleAddTagGrpButtonV2}>+</Button>

      <br></br>
      {/* 
      <Form.Group as={Row} >
        <Col>
          <FormLabel >Tag Groupe:</FormLabel>
        </Col>
        <Col>
          <Form.Select onChange={
            (evt: React.ChangeEvent<HTMLSelectElement>) => {
              set_tag_group_id(evt.target.value as any)
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
      </Form.Group> */}




      {/* <Col>
          <FormLabel >Element du groupe:</FormLabel>
        </Col>
        <Col>
          <Form.Select
            onChange={
              (evt: React.ChangeEvent<HTMLSelectElement>) => {
                set_tag_id(evt.target.value as any)
              }}
          >

            {optionTag()}

          </Form.Select>
        </Col> */}


      {/*  <Table striped bordered hover responsive='sm' size='sm'>
        <thead>
          <tr>
            <th></th>
            <th>Nom</th>
            <th>Visible</th>
            <th>Couleur</th>
          </tr>
        </thead>
        <tbody>
          {tags_catalog.length > 0 ? (tags_catalog[tag_group_id].tags.map(
            (tag, i) => {
              return (
                <tr key={i.toString()}>
                  <td style={{ 'width': '10%' }}><Button variant="danger" value='-' onClick={() => { handleDelTag(i) }}>-</Button></td>

                  <td style={{ 'width': '33%' }}>
                    <FormControl size='sm'
                      id={i.toString()}
                      type="text"
                      value={tag}
                      onChange={
                        (evt: React.ChangeEvent) => {
                          const { tags_catalog } = data
                          const new_nb_element = evt.target as HTMLInputElement
                          const id = +new_nb_element.id
                          const name = new_nb_element.value
                          tags_catalog[tag_group_id].tags[id] = name
                          set_data({ ...data })
                        }
                      } /></td>
                  <td style={{ 'width': '10%' }}>
                    <Form.Check inline={true}
                      name={'element_visible' + tag}
                      checked={selected_tags.includes(current_tags_group.tags[i])}
                      id={i.toString()}
                      type='switch'
                      onChange={
                        (evt: React.ChangeEvent) => {
                          const new_nb_element = evt.target as HTMLInputElement
                          const id = +new_nb_element.id
                          const name = current_tags_group.tags[id]
                          const visible = new_nb_element.checked
                          if (visible) {
                            if (!selected_tags) {
                              selected_tags = []
                            }
                            selected_tags.push(name)
                          } else {
                            selected_tags.splice(selected_tags.indexOf(name), 1)
                          }
                          setSelectedTags(data)
                          set_data({ ...data })
                        }
                      } />
                  </td>

                  <td ></td>
                </tr>
              )
            })) : (<></>)}


        </tbody>
      </Table>
 */}

      {Object.keys(tags_catalog_v2).length > 0 ? tagSetting : <></>}



      {/* <Tabs defaultActiveKey="apparence">
          <Tab title="Apparence" eventKey="apparence">
            {console.log(tags_catalog[tag_group_id])}
            <Row>
              <Col>Nom :</Col>
              <Col><FormControl
                id={tag_id.toString()}
                type="text"
                value={data.tags_catalog[tag_group_id].tags[tag_id]}
                onChange={
                  (evt: React.ChangeEvent) => {
                    const { tags_catalog } = data
                    const new_nb_element = evt.target as HTMLInputElement
                    const id = +new_nb_element.id
                    const name = new_nb_element.value
                    tags_catalog[tag_group_id].tags[id] = name
                    set_data({ ...data })
                  }
                } /></Col>
            </Row>

            <Row>
              <Col>Visible :</Col>
              {  <Col> <FormCheck
                name={'element_visible' + tag_id.toString()}
                defaultChecked={selected_tags[tags_catalog[tag_group_id].tags_group_name].includes(tags[tag_group_id].tags_group[tag_id])}
                id={tag_id.toString()}
                type='checkbox'
                onChange={
                  (evt: React.ChangeEvent) => {
                    const { selected_tags, tags_catalog } = data
                    const new_nb_element = evt.target as HTMLInputElement
                    const id = +new_nb_element.id
                    const name = tags_catalog[tag_group_id].tags_group[id]
                    const visible = new_nb_element.checked
                    const tag_group_name = tags_catalog[tag_group_id].tags_group_name
                    if (visible) {
                      if (!selected_tags[tag_group_name]) {
                        selected_tags[tag_group_name] = []
                      }
                      selected_tags[tag_group_name].push(name)
                    } else {
                      selected_tags[tag_group_name].splice(selected_tags[tag_group_name].indexOf(name), 1)
                    }
                    setSelectedTags(data, selected_tags)
                    set_data({ ...data })
                  }
                } /></Col> }
            </Row>

      <Row>
        <Col>Couleur :</Col>

        <Col>
          <Form.Control
            type='color'
            value={'red'}
            onChange={evt => {
              console.log(data.tags[tag_group_id])
              // set_data({ ...data })
            }
                />
        </Col> }
            </Row>
    </Tab>
        </Tabs >
         */}


      { children}
    </>
  )
}



//-------------




{// const SankeySettingsEdition: FunctionComponent<SankeyEditionTypes> = ({
  //   data, set_data, set_show_graphic_attributes, show, set_current_filter, children
  // }) => {
  //   let file_layout: Blob[] | undefined

  //   const [shift_left, set_shift_left] = useState(100)
  //   const [shift_top, set_shift_top] = useState(100)
  //   const [user_scale, set_user_scale] = useState(data.user_scale)
  //   const [height, set_height] = useState(data.height)
  //   const [width, set_width] = useState(data.width)
  //   const [, set_node_hspace] = useState(100)
  //   const [tag_group_id, set_tag_group_id] = useState(0)

  //   const { display_style, tags, links, nodes, selected_tags, node_width } = data
  //   const { filter } = display_style

  //   let region_index = 0
  //   const tags_group = tags.filter(tag => tag.tags_group_name === 'Regions')
  //   if (tags_group.length > 1) {
  //     region_index = tags_group[0].tags_group.indexOf(data.selected_tags['Regions'][0])
  //   }

  //   let max_link_value = 0
  //   links.forEach(link => {
  //     if (link.value[region_index] > max_link_value) {
  //       max_link_value = link.value[region_index]
  //     }
  //   })
  //   max_link_value += 1

  //   if (tags[tag_group_id]) {
  //     const tag_group_name = tags[tag_group_id].tags_group_name
  //     if (!selected_tags[tag_group_name]) {
  //       selected_tags[tag_group_name] = []
  //     }
  //   }
  //   // const nb_partition_elements = tags.length
  //   // const units = ['tMS','t','m3']
  //   // const nb_units = units.length

  //   return (
  //     <Modal
  //       size="lg"
  //       show={show}
  //       onHide={() => set_show_graphic_attributes(false)}
  //     >
  //       <Modal.Header closeButton>
  //         <Modal.Title>Réglages</Modal.Title>
  //       </Modal.Header>
  //       <Modal.Body>
  //         <Tabs defaultActiveKey="geometry" id="settings-layout">
  //           <Tab eventKey="geometry" title="Géometrie">
  //             <br></br>
  //             <Form>
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormLabel >Echelle</FormLabel>
  //                 </Col>
  //                 <Col>
  //                   <FormControl
  //                     type="text"
  //                     value={user_scale}
  //                     onChange={evt => set_user_scale(+evt.target.value)}
  //                     onBlur={() => {
  //                       data.user_scale = user_scale
  //                       set_data({ ...data })
  //                     }}
  //                   />
  //                   <FormControl.Feedback />
  //                   <Form.Text>    (valeur pour 100px)</Form.Text>
  //                 </Col>
  //               </Form.Group>
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormLabel >Hauteur</FormLabel>
  //                 </Col>
  //                 <Col>
  //                   <FormControl
  //                     type="text"
  //                     value={height}
  //                     onChange={evt => set_height(+evt.target.value)}
  //                     onBlur={() => {
  //                       data.height = height
  //                       set_data({ ...data })
  //                     }}
  //                   />
  //                 </Col>
  //               </Form.Group>
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormLabel>Largeur</FormLabel>
  //                 </Col>
  //                 <Col>
  //                   <FormControl
  //                     type="text"
  //                     value={width}
  //                     onChange={evt => set_width(+evt.target.value)}
  //                     onBlur={() => {
  //                       data.width = width
  //                       set_data({ ...data })
  //                     }}
  //                   />
  //                 </Col>
  //               </Form.Group>
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormLabel>Shift horizontal</FormLabel>
  //                 </Col>
  //                 <Col>
  //                   <FormControl
  //                     type="text"
  //                     value={shift_left}
  //                     onChange={evt => set_shift_left(+evt.target.value)}
  //                   />
  //                 </Col>
  //                 <Col >
  //                   <Button
  //                     size="sm"
  //                     onClick={
  //                       () => {
  //                         nodes.forEach((n) => n.x += shift_left)
  //                         set_data({ ...data })
  //                       }
  //                     }
  //                   >Shift</Button>
  //                 </Col>
  //               </Form.Group>
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormLabel>Shift vertical</FormLabel>
  //                 </Col>
  //                 <Col>
  //                   <FormControl
  //                     type="text"
  //                     value={shift_top}
  //                     onChange={evt => set_shift_top(+evt.target.value)}
  //                   />
  //                 </Col>
  //                 <Col>
  //                   <Button
  //                     size="sm"
  //                     onClick={
  //                       () => {
  //                         nodes.forEach((n) => n.y += shift_top)
  //                         set_data({ ...data })
  //                       }
  //                     }
  //                   >Shift</Button>
  //                 </Col>
  //               </Form.Group>
  //             </Form>
  //           </Tab>
  //           <Tab eventKey="layout" title="Positionnement">
  //             <br></br>
  //             <Form >
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormLabel>Layout</FormLabel>
  //                 </Col>
  //                 <Col>
  //                   <Form.Control
  //                     type="file"
  //                     onChange={(evt: React.ChangeEvent) => file_layout = (evt.target as HTMLFormElement).files}
  //                   />
  //                 </Col>
  //                 <Col>
  //                   <Button
  //                     size="sm"
  //                     onClick={
  //                       () => {
  //                         if (file_layout === undefined) {
  //                           return
  //                         }
  //                         const reader = new FileReader()
  //                         reader.onload = (() => {
  //                           return (
  //                             (e: ProgressEvent<FileReader>) => {
  //                               let result = (e.target as FileReader).result
  //                               if (result) {
  //                                 result = String(result).split('<br>').join('\\\\n')
  //                                 const new_layout = JSON.parse(result)
  //                                 updateLayout(data, new_layout)
  //                                 set_data({ ...data })
  //                               }
  //                             }
  //                           )
  //                         })()
  //                         reader.readAsText(file_layout[0])
  //                       }
  //                     }>Appliquer Layout
  //                   </Button>
  //                 </Col>
  //               </Form.Group>
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormLabel>Espacement H</FormLabel>
  //                 </Col>
  //                 <Col>
  //                   <FormControl
  //                     type="text"
  //                     onChange={evt => set_node_hspace(+evt.target.value)}
  //                   />
  //                 </Col>
  //                 <Col>
  //                   <Button
  //                     size="sm"
  //                     onClick={() => arrangeNodes(data)}
  //                   >Arranger noeuds</Button>
  //                 </Col>
  //               </Form.Group>
  //               {/* <Form.Group as={Row} >
  //                 <Col sm={8}></Col>
  //                 <Col  sm={4}>
  //                   <Button 
  //                     size="sm" 
  //                     onClick={optimizeLayout}
  //                   >Positionnement optimal</Button>
  //                 </Col>
  //               </Form.Group> */}
  //             </Form>
  //           </Tab>
  //           <Tab eventKey="nodes" title="Noeuds">
  //             <br></br>
  //             <Form >
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormLabel >Taille minimum</FormLabel>
  //                 </Col>
  //                 <Col>
  //                   <Form.Range
  //                     min="0" max="100"
  //                     value={node_width}
  //                     onChange={
  //                       evt => {
  //                         data.node_width = +evt.target.value
  //                         set_data({ ...data })
  //                       }
  //                     } />
  //                 </Col>
  //                 <Col>{node_width}</Col>
  //               </Form.Group>
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormLabel >Taille police</FormLabel>
  //                 </Col>
  //                 <Col>
  //                   <Form.Range
  //                     min="11" max="20"
  //                     value={display_style.font_size}
  //                     onChange={evt => {
  //                       display_style.font_size = +evt.target.value
  //                       set_data({ ...data })
  //                     }}
  //                   />
  //                 </Col>
  //                 <Col>{display_style.font_size}</Col>
  //               </Form.Group>
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormLabel >Secteurs</FormLabel>
  //                 </Col>
  //                 <Col>
  //                   <FormCheck
  //                     type='checkbox'
  //                     label='Bold'
  //                     checked={display_style.sector_bold}
  //                     onChange={
  //                       evt => {
  //                         display_style.sector_bold = evt.target.checked
  //                         set_data({ ...data })
  //                       }
  //                     }
  //                   />
  //                 </Col>
  //                 <Col>
  //                   <FormCheck
  //                     type='checkbox'
  //                     label='Upper'
  //                     checked={display_style.sector_uppercase}
  //                     onChange={
  //                       evt => {
  //                         display_style.sector_uppercase = evt.target.checked
  //                         set_data({ ...data })
  //                       }
  //                     }
  //                   />
  //                 </Col>
  //                 <Col>
  //                   <FormCheck
  //                     type='checkbox'
  //                     label='Italic'
  //                     checked={display_style.sector_italic}
  //                     onChange={
  //                       evt => {
  //                         display_style.sector_italic = evt.target.checked
  //                         set_data({ ...data })
  //                       }
  //                     }
  //                   />
  //                 </Col>
  //               </Form.Group>
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormLabel >Produits</FormLabel>
  //                 </Col>
  //                 <Col>
  //                   <FormCheck
  //                     type='checkbox'
  //                     label='Bold'
  //                     checked={display_style.product_bold}
  //                     onChange={
  //                       evt => {
  //                         display_style.product_bold = evt.target.checked
  //                         set_data({ ...data })
  //                       }
  //                     }
  //                   />
  //                 </Col>
  //                 <Col>
  //                   <FormCheck
  //                     type='checkbox'
  //                     label='Upper'
  //                     checked={display_style.product_uppercase}
  //                     onChange={
  //                       evt => {
  //                         display_style.product_uppercase = evt.target.checked
  //                         set_data({ ...data })
  //                       }
  //                     }
  //                   />
  //                 </Col>
  //                 <Col>
  //                   <FormCheck
  //                     type='checkbox'
  //                     label='Italic'
  //                     checked={display_style.product_italic}
  //                     onChange={
  //                       evt => {
  //                         display_style.product_italic = evt.target.checked
  //                         set_data({ ...data })
  //                       }
  //                     }
  //                   />
  //                 </Col>
  //               </Form.Group>
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <Button
  //                     size="sm"
  //                     onClick={
  //                       () => {
  //                         nodes.forEach(
  //                           node => {
  //                             node.visible = true
  //                             node.label_visible = true
  //                           }
  //                         )
  //                         set_data({ ...data })
  //                       }
  //                     }
  //                   >Reset visible</Button>
  //                 </Col>
  //               </Form.Group>
  //             </Form>
  //           </Tab>
  //           <Tab eventKey="flux" title="Flux">
  //             <br></br>
  //             <Form >
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormLabel >Filtre</FormLabel>
  //                 </Col>
  //                 <Col>
  //                   <Form.Range
  //                     min="0"
  //                     max={max_link_value}
  //                     value={filter}
  //                     onChange={evt => set_current_filter(Number(evt.target.value))} />
  //                 </Col>
  //                 <Col>{filter}</Col>
  //               </Form.Group>
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormLabel>Filtre label</FormLabel>
  //                 </Col>
  //                 <Col >
  //                   <Form.Range
  //                     min="0"
  //                     max={max_link_value}
  //                     value={display_style.filter_label}
  //                     onChange={evt => {
  //                       display_style.filter_label = +evt.target.value
  //                       set_data({ ...data })
  //                     }}
  //                   />
  //                 </Col>
  //                 <Col>{display_style.filter_label}</Col>
  //               </Form.Group>
  //               <Form.Group as={Row} >

  //                 <Col>
  //                   <FormLabel >Type :</FormLabel>
  //                 </Col>
  //                 <Col >
  //                   <FormCheck
  //                     type='checkbox'
  //                     label='Courbe'
  //                     onChange={evt => {
  //                       data.links.filter(l => l.visible).forEach(
  //                         l => l.curved = evt.target.checked
  //                       )
  //                       set_data({ ...data })
  //                     }}
  //                   />
  //                 </Col>
  //                 <Col >
  //                   <FormCheck
  //                     type='checkbox'
  //                     label='Flêche'
  //                     onChange={evt => {
  //                       data.links.filter(l => l.visible).forEach(
  //                         l => l.arrow = evt.target.checked
  //                       )
  //                       set_data({ ...data })
  //                     }}
  //                   />
  //                 </Col>
  //               </Form.Group>
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormLabel >Courbure</FormLabel>
  //                 </Col>
  //                 <Col >
  //                   <Form.Range
  //                     min="0" max="1" step="0.1"
  //                     value={display_style.global_curvature}
  //                     onChange={evt => {
  //                       display_style.global_curvature = +evt.target.value
  //                       data.links.filter(l => l.visible).forEach(l => l.curvature = +evt.target.value)
  //                       set_data({ ...data })
  //                     }}
  //                   />
  //                 </Col>
  //                 <Col>{display_style.global_curvature}</Col>
  //               </Form.Group>
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormLabel >Label:</FormLabel>
  //                 </Col>
  //                 <Col >
  //                   <FormCheck
  //                     name="label"
  //                     label='Début'
  //                     value="beginning"
  //                     type='radio'
  //                     onChange={
  //                       evt => {
  //                         data.links.filter(l => l.visible).forEach(
  //                           l => l.label_position = evt.target.value
  //                         )
  //                         set_data({ ...data })
  //                       }
  //                     }
  //                   />
  //                 </Col>
  //                 <Col >
  //                   <FormCheck
  //                     name="label"
  //                     label='Milieu'
  //                     value="middle"
  //                     type='radio'
  //                     onChange={evt => {
  //                       data.links.filter(l => l.visible).forEach(
  //                         l => l.label_position = evt.target.value
  //                       )
  //                       set_data({ ...data })
  //                     }}
  //                   />
  //                 </Col>
  //                 <Col >
  //                   <FormCheck
  //                     name="label"
  //                     label='Fin'
  //                     value="end"
  //                     type='radio'
  //                     onChange={evt => {
  //                       data.links.filter(l => l.visible).forEach(
  //                         l => l.label_position = evt.target.value
  //                       )
  //                       set_data({ ...data })
  //                     }}
  //                   />
  //                 </Col>
  //               </Form.Group>
  //               <Form.Group>
  //                 <Col>
  //                   <FormCheck
  //                     type='checkbox'
  //                     label='Attaché au flux'
  //                     onChange={evt => {
  //                       data.links.filter(l => l.visible).forEach(
  //                         l => l.label_on_path = evt.target.checked
  //                       )
  //                       set_data({ ...data })
  //                     }}
  //                   />
  //                 </Col >
  //               </Form.Group>
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormCheck
  //                     value='black'
  //                     type='radio'
  //                     label='Label en noir'
  //                     onChange={
  //                       () => {
  //                         data.links.filter(l => l.visible).forEach(
  //                           l => l.text_color = 'black'
  //                         )
  //                         set_data({ ...data })
  //                       }
  //                     }
  //                   />
  //                 </Col>
  //                 <Col>
  //                   <FormCheck
  //                     value='white'
  //                     type='radio'
  //                     label='Label blanc'
  //                     onChange={
  //                       () => {
  //                         data.links.filter(l => l.visible).forEach(
  //                           l => l.text_color = 'white'
  //                         )
  //                         set_data({ ...data })
  //                       }
  //                     }
  //                   />
  //                 </Col>
  //                 <Col>
  //                   <FormCheck
  //                     value='same_color'
  //                     type='radio'
  //                     label='Label en couleur'
  //                     onChange={
  //                       () => {
  //                         data.links.filter(l => l.visible).forEach(
  //                           l => l.text_color = l.color
  //                         )
  //                         set_data({ ...data })
  //                       }
  //                     }
  //                   />
  //                 </Col>
  //               </Form.Group>
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <FormLabel >Taille police</FormLabel>
  //                 </Col>
  //                 <Col >
  //                   <Form.Range
  //                     min="11" max="20"
  //                     value={display_style.font_size}
  //                     onChange={evt => {
  //                       display_style.font_size = +evt.target.value
  //                       set_data({ ...data })
  //                     }}
  //                   />
  //                 </Col>
  //                 <Col >{display_style.font_size}</Col>
  //               </Form.Group>
  //               <Form.Group as={Row} >
  //                 <Col>
  //                   <Button
  //                     size="sm"
  //                     onClick={
  //                       () => {
  //                         links.forEach(
  //                           link => {
  //                             link.visible = true
  //                             link.label_visible = true
  //                           }
  //                         )
  //                         set_data({ ...data })
  //                       }
  //                     }
  //                   >Reset visible</Button>
  //                 </Col>
  //               </Form.Group>
  //             </Form>
  //           </Tab>
  //           <Tab eventKey="tags_groups" title="Tags Groups" >
  //             <Form.Group as={Row} >
  //               <Col>
  //                 <FormLabel >Nb tags groupes:</FormLabel>
  //               </Col>
  //               <Col>
  //                 <FormControl
  //                   type="text"
  //                   value={Object.keys(tags).length}
  //                   onChange={
  //                     (evt: React.ChangeEvent) => {
  //                       const { tags } = data
  //                       const new_nb_element = +(evt.target as HTMLInputElement).value
  //                       const length = tags.length
  //                       if (tags.length < new_nb_element) {
  //                         for (let i = length; i < new_nb_element; i++) {
  //                           tags[i] = {
  //                             tags_group_name: 'Tag Group ' + i,
  //                             tags_group: []
  //                           }
  //                         }
  //                       } else {
  //                         for (let i = new_nb_element; i < length; i++) {
  //                           delete tags[i]
  //                         }
  //                       }
  //                       set_data({ ...data })
  //                     }
  //                   }
  //                 />
  //               </Col>
  //             </Form.Group>
  //             <Table striped bordered hover>
  //               <thead>
  //                 <tr>
  //                   <th>Nom</th>
  //                 </tr>
  //               </thead>
  //               <tbody>
  //                 {tags.map(
  //                   (tags_group, i) => {
  //                     return (
  //                       <tr key={i.toString()}>
  //                         <td>
  //                           <FormControl
  //                             id={i.toString()}
  //                             type="text"
  //                             value={tags_group.tags_group_name}
  //                             onChange={
  //                               (evt: React.ChangeEvent) => {
  //                                 const { tags } = data
  //                                 const new_name = (evt.target as HTMLInputElement).value
  //                                 tags[i].tags_group_name = new_name
  //                                 set_data({ ...data })
  //                               }
  //                             } />
  //                         </td>
  //                       </tr>
  //                     )
  //                   })}
  //               </tbody>
  //             </Table>
  //           </Tab>
  //           <Tab eventKey="tags" title="Tags" >
  //             <br></br>
  //             <Form.Group as={Row} >
  //               <Col>
  //                 <FormLabel >Tag Groupe:</FormLabel>
  //               </Col>
  //               <Col>
  //                 <Form.Select
  //                   onChange={
  //                     (evt: React.ChangeEvent<HTMLSelectElement>) => set_tag_group_id(+evt.target.value)}>
  //                   {tags.map(
  //                     (tags_group, i) =>
  //                       <option
  //                         key={i}
  //                         value={i}
  //                         selected={tag_group_id === i} >
  //                         {tags_group.tags_group_name}
  //                       </option>)}
  //                 </Form.Select>
  //               </Col>
  //             </Form.Group>
  //             <Form.Group as={Row} >
  //               <Col>
  //                 <FormLabel >Nb éléments:</FormLabel>
  //               </Col>
  //               <Col>
  //                 <FormControl
  //                   type="text"
  //                   value={tags.length > 0 ? tags[tag_group_id].tags_group.length : 0}
  //                   onChange={
  //                     (evt: React.ChangeEvent) => {
  //                       const { tags } = data
  //                       const new_nb_element = Number((evt.target as HTMLInputElement).value)
  //                       const length = tags[tag_group_id].tags_group.length
  //                       if (tags[tag_group_id].tags_group.length < new_nb_element) {
  //                         for (let i = length; i < new_nb_element; i++) {
  //                           tags[tag_group_id].tags_group.push('Element ' + i)
  //                         }
  //                       } else {
  //                         for (let i = new_nb_element; i < length; i++) {
  //                           tags[tag_group_id].tags_group.pop()
  //                         }
  //                       }
  //                       set_data({ ...data })
  //                     }
  //                   }
  //                 />
  //               </Col>

  //               <Table striped bordered hover>
  //                 <thead>
  //                   <tr>
  //                     <th>Nom</th>
  //                     <th>Visible</th>
  //                     <th>Couleur</th>
  //                   </tr>
  //                 </thead>
  //                 <tbody>
  //                   {tags.length > 0 ? (tags[tag_group_id].tags_group.map(
  //                     (tag, i) => {
  //                       return (
  //                         <tr key={i.toString()}>
  //                           <td><FormControl
  //                             id={i.toString()}
  //                             type="text"
  //                             value={tag}
  //                             onChange={
  //                               (evt: React.ChangeEvent) => {
  //                                 const { tags } = data
  //                                 const new_nb_element = evt.target as HTMLInputElement
  //                                 const id = +new_nb_element.id
  //                                 const name = new_nb_element.value
  //                                 tags[tag_group_id].tags_group[id] = name
  //                                 set_data({ ...data })
  //                               }
  //                             } /></td>
  //                           <td>
  //                             <FormCheck
  //                               name={'element_visible' + i.toString()}
  //                               defaultChecked={selected_tags[tags[tag_group_id].tags_group_name].includes(tags[tag_group_id].tags_group[i])}
  //                               id={i.toString()}
  //                               type='checkbox'
  //                               onChange={
  //                                 (evt: React.ChangeEvent) => {
  //                                   const { selected_tags, tags } = data
  //                                   const new_nb_element = evt.target as HTMLInputElement
  //                                   const id = +new_nb_element.id
  //                                   const name = tags[tag_group_id].tags_group[id]
  //                                   const visible = new_nb_element.checked
  //                                   const tag_group_name = tags[tag_group_id].tags_group_name
  //                                   if (visible) {
  //                                     if (!selected_tags[tag_group_name]) {
  //                                       selected_tags[tag_group_name] = []
  //                                     }
  //                                     selected_tags[tag_group_name].push(name)
  //                                   } else {
  //                                     selected_tags[tag_group_name].splice(selected_tags[tag_group_name].indexOf(name), 1)
  //                                   }
  //                                   setSelectedTags(data, selected_tags)
  //                                   set_data({ ...data })
  //                                 }
  //                               } />
  //                           </td>
  //                           <td></td>
  //                         </tr>
  //                       )
  //                     })) : (<></>)}
  //                 </tbody>
  //               </Table>
  //             </Form.Group>
  //           </Tab>
  //           {children}
  //         </Tabs>
  //       </Modal.Body>
  //     </Modal>

  //   )
  // }
  //}
  // SankeySettingsEdition.propTypes = SankeySettingsEditionPropTypes
}

SankeySettingsEditionV2.propTypes = SankeySettingsEditionPropTypes
SankeySettingsEditionTags.propTypes = SankeySettingsEditionPropTypes

export default null



export { SankeySettingsEditionTags, SankeySettingsEditionV2 }