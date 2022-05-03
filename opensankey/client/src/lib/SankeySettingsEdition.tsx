import React, { ChangeEvent, useState, FunctionComponent } from 'react'
import { Button, Row, FormControl, Form, Col, FormLabel, FormCheck, Tabs, Tab } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { arrangeNodes, compute_auto_sankey, updateLayout, reorganize_node_inputLinksId, reorganize_node_outputLinksId } from './SankeyLayout'
import { findMaxLinkValue } from './SankeyUtils'
import { SankeyDataPropTypes } from './types'

const SankeySettingsEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  set_current_filter: PropTypes.func.isRequired
}
type SankeyEditionTypes = InferProps<typeof SankeySettingsEditionPropTypes>

const SankeySettingsEdition: FunctionComponent<SankeyEditionTypes> = ({
  data,
  set_data,
  set_current_filter,
  children
}) => {
  let file_layout: Blob[] | undefined

  const [shift_left, set_shift_left] = useState(100)
  const [shift_top, set_shift_top] = useState(100)
  const [shift_visible, set_shift_visible] = useState(true)
  const [user_scale, set_user_scale] = useState(data.user_scale)
  const [legend_position, set_legend_position] = useState(data.legend_position)
  const [width, set_width] = useState(data.width_min)
  const [height, set_height] = useState(data.height_min)
  const [node_hspace, set_node_hspace] = useState(data.h_space)
  const [node_vspace, set_node_vspace] = useState(data.v_space)
  const [link_tag_favorite, set_link_tag_favorite] = useState('')
  const tags_visible = Object.keys(data.dataTags).length > 0
  const [tags_group_key, set_tags_group_key] = useState(tags_visible ? Object.keys(data.fluxTags)[0] : '')

  const { display_style, links, nodes} = data
  const { filter } = display_style

  let max_link_value = 0
  Object.values(links).forEach(link => {
    const new_max_link_value = findMaxLinkValue(
      max_link_value,
      link.value
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })
  max_link_value += 1
  return (
    <>
      <Form>
        <Form.Group>
          <Row>
            <Col xs={6}>Font Family pour le Sankey</Col>
            <Col xs={6}><Form.Select
              onChange={
                (evt: React.ChangeEvent<HTMLSelectElement>) => {
                  data.display_style.font_family_selected = evt.target.value
                  set_data({ ...data })
                }
              }
            >
              {data.display_style.font_family.map((d) => {
                return <option
                  key={'ff-' + d}
                  value={d}
                  selected={d == data.display_style.font_family_selected}
                >{d}</option>

              })}
            </Form.Select></Col>
          </Row>
        </Form.Group>
        <Form.Group as={Row}>

          <Col xs={6}>Font Charger des icones</Col>
          <Col xs={6}><FormControl
            //Permet de charger les icon, pour l'instant permet de formater les données issus de https://icomoon.io/
            type='file'
            onChange={(evt: ChangeEvent) => {
              const files = (evt.target as HTMLFormElement).files
              const reader = new FileReader()
              reader.onload = (() => {
                return (e: ProgressEvent<FileReader>) => {
                  const result = String((e.target as FileReader).result)
                  const js = JSON.parse(result)
                  js.icons.map((d: any) => {
                    const name = d.properties.name as string
                    data.icon_catalog[name] = d.icon.paths[0]
                  })
                }
              })()
              reader.readAsText(files[0])
              set_data(data)
            }}
          >
          </FormControl>
          </Col>

        </Form.Group>
      </Form>
      <Tabs defaultActiveKey="geometry" id="settings-layout">
        <Tab eventKey="geometry" title="Géométrie">
          <Form>
            <Form.Group as={Row} >
              <Col xs={3}>
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
              <Col xs={3}>
                <FormLabel >Hauteur Minimum</FormLabel>
              </Col>
              <Col>
                <FormControl
                  type="text"
                  value={height}
                  onChange={evt => set_height(+evt.target.value)}
                  onBlur={() => {
                    data.height_min = height
                    // data.height = height
                    set_data({ ...data })
                  }}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} >
              <Col xs={3}>
                <FormLabel>Largeur Minimum</FormLabel>
              </Col>
              <Col>
                <FormControl
                  type="text"
                  value={width}
                  onChange={evt => set_width(+evt.target.value)}
                  onBlur={() => {
                    data.width_min = width
                    // data.width = width
                    set_data({ ...data })
                  }}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} >
              <Col>
                <FormCheck
                  type='checkbox'
                  label='Déplacer visible seulement'
                  checked={shift_visible}
                  onChange={
                    evt => {
                      set_shift_visible(evt.target.checked)
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
            </Form.Group>


            <Form.Group as={Row} >
              <Col xs={3}>
                <FormLabel >Taille Carré Grille</FormLabel>
              </Col>
              <Col xs={4}>
                <FormControl
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={data.grid_square_size}
                  onChange={evt => {
                    data.grid_square_size = (+evt.target.value >= 1) ? +evt.target.value : 10
                    set_data({ ...data })
                  }}

                />
              </Col>

              <Col >
                <FormCheck
                  inline
                  type='switch'
                  checked={data.grid_visible}
                  label='Grille visible'
                  onChange={() => {
                    data.grid_visible = !data.grid_visible
                    set_data({ ...data })
                  }}
                />
              </Col>
            </Form.Group>


            <Form.Group as={Row} >
              <Col xs={3}>
                <FormLabel>Déplacement horizontal</FormLabel>
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
                      if (shift_visible) {
                        Object.values(nodes).filter(n => n.node_visible).filter(n => n.position !== 'relative').forEach(n => n.x += shift_left)
                        Object.values(links).filter(l => nodes[l.idSource].node_visible && nodes[l.idTarget].node_visible && l.x_label).forEach(l => (l.x_label as number) += shift_left)
                      } else {
                        Object.values(nodes).filter(n => n.position !== 'relative').forEach(n => n.x += shift_left)
                        Object.values(links).filter(l => l.x_label).forEach(l => (l.x_label as number) += shift_left)
                      }
                      set_data({ ...data })
                    }
                  }
                >Déplacer</Button>
              </Col>
            </Form.Group>
            <Form.Group as={Row} >
              <Col xs={3}>
                <FormLabel>Déplacement vertical</FormLabel>
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
                      if (shift_visible) {
                        Object.values(nodes).filter(n => n.node_visible).filter(n => n.position !== 'relative').forEach(n => n.y += shift_top)
                        Object.values(links).filter(l => nodes[l.idSource].node_visible && nodes[l.idTarget].node_visible && l.y_label).forEach(l => (l.y_label as number) += shift_top)
                      } else {
                        Object.values(nodes).filter(n => n.position !== 'relative').forEach(n => n.y += shift_top)
                        Object.values(links).filter(l => l.y_label).forEach(l => (l.y_label as number) += shift_top)
                      }
                      set_data({ ...data })
                    }
                  }
                >Déplacer</Button>
              </Col>
            </Form.Group>
            <Form.Group as={Row} >
              <Col xs={3}>
                <FormLabel >Légende X</FormLabel>
              </Col>
              <Col>
                <FormControl
                  type="text"
                  value={legend_position[0]}
                  onChange={evt => set_legend_position([+evt.target.value, legend_position[1]])}
                  onBlur={() => {
                    data.legend_position = legend_position
                    set_data({ ...data })
                  }}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} >
              <Col xs={3}>
                <FormLabel>Légende Y</FormLabel>
              </Col>
              <Col>
                <FormControl
                  type="text"
                  value={legend_position[1]}
                  onChange={evt => set_legend_position([legend_position[0], +evt.target.value])}
                  onBlur={() => {
                    data.legend_position = legend_position
                    set_data({ ...data })
                  }}
                />
              </Col>
            </Form.Group>
          </Form>
        </Tab>
        <Tab eventKey="layout" title="Disposition">
          <Form >
            <Form.Group as={Row} >
              <Col xs={3}>
                <FormLabel>Plan</FormLabel>
              </Col>
              <Col xs={5}>
                <Form.Control
                  type="file"
                  onChange={(evt: React.ChangeEvent) => file_layout = (evt.target as HTMLFormElement).files}
                />
              </Col>
              <Col xs={4}>
                <Button
                  size="sm"
                  onClick={
                    () => {
                      if (file_layout === undefined) {
                        return
                      }
                      const reader = new FileReader()
                      reader.onload = (() => {
                        return (
                          (e: ProgressEvent<FileReader>) => {
                            let result = (e.target as FileReader).result
                            if (result) {
                              result = String(result).split('<br>').join('\\\\n')
                              const new_layout = JSON.parse(result)
                              updateLayout(data, new_layout)
                              set_data({ ...data })
                            }
                          }
                        )
                      })()
                      reader.readAsText(file_layout[0])
                    }
                  }>Appliquer Disposition
                </Button>
              </Col>
            </Form.Group>
            <Form.Group as={Row} >
              <Col xs={3}>
                <FormLabel>Définition de la Grille</FormLabel>
              </Col>
              <Col xs={2}>
                <FormLabel>Horizontal</FormLabel>
              </Col>
              <Col xs={2}>
                <FormControl
                  type="text"
                  value={node_hspace}
                  onChange={evt => {
                    set_node_hspace(+evt.target.value)
                    data.h_space = +evt.target.value
                  }}
                />
              </Col>
              <Col xs={2}>
                <FormLabel>Vertical</FormLabel>
              </Col>
              <Col xs={2}>
                <FormControl
                  type="text"
                  value={node_vspace}
                  onChange={evt => {
                    set_node_vspace(+evt.target.value)
                    data.v_space = +evt.target.value
                  }}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} >
              <Col xs={3}>
                <Button
                  size="sm"
                  onClick={() => {
                    arrangeNodes(data)
                    set_data({ ...data })
                  }}
                >Arranger noeuds</Button>
              </Col>
              <Col xs={4}>
                <Button
                  size="sm"
                  onClick={() => {
                    compute_auto_sankey(data, node_hspace)
                    set_data({ ...data })
                  }}
                > Positionnement automatique</Button>
              </Col>
              <Col xs={5}>
                <Button
                  size="sm"
                  onClick={() => {
                    Object.values(data.nodes).forEach(n => {
                      reorganize_node_inputLinksId(n, data.nodes, data.links)
                      reorganize_node_outputLinksId(n, data.nodes, data.links)
                    })
                    set_data({ ...data })
                  }}
                >Reorganiser liens entrants et sortant</Button>
              </Col>
            </Form.Group>
          </Form>
        </Tab>
        <Tab eventKey="nodes" title="Création noeuds">
          <Form >
            <Form.Group as={Row} >
              <Col>
                <FormLabel >Taille police</FormLabel>
              </Col>
              <Col>
                <Form.Range
                  min="11" max="20"
                  value={display_style.node_font_size}
                  onChange={evt => {
                    display_style.node_font_size = +evt.target.value
                    set_data({ ...data })
                  }}
                />
              </Col>
              <Col>{display_style.node_font_size}</Col>
            </Form.Group>
            <Form.Group as={Row} >
              <Col>
                <FormLabel >Labels</FormLabel>
              </Col>
              <Col>
                <FormCheck
                  type='checkbox'
                  label='Gras'
                  checked={display_style.sector_bold}
                  onChange={
                    evt => {
                      display_style.sector_bold = evt.target.checked
                      display_style.product_bold = evt.target.checked
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
              <Col>
                <FormCheck
                  type='checkbox'
                  label='Majuscule'
                  checked={display_style.sector_uppercase}
                  onChange={
                    evt => {
                      display_style.sector_uppercase = evt.target.checked
                      display_style.product_uppercase = evt.target.checked
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
              <Col>
                <FormCheck
                  type='checkbox'
                  label='Italique'
                  checked={display_style.sector_italic}
                  onChange={
                    evt => {
                      display_style.sector_italic = evt.target.checked
                      display_style.product_italic = evt.target.checked
                      set_data({ ...data })
                    }
                  }
                />
              </Col>
            </Form.Group>
          </Form>
        </Tab>
        <Tab eventKey="flux" title="Flux">
          <Form >
            <Form.Group as={Row} >
              <Col>
                <FormLabel >Palette:</FormLabel>
              </Col>
              <Col>
                <FormCheck inline
                  type='switch'
                  checked={link_tag_favorite === tags_group_key}
                  onChange={() => {
                    Object.values(data.links).forEach(link => link.colorTag = (link.colorTag === tags_group_key) ? '' : tags_group_key)
                    set_link_tag_favorite((link_tag_favorite === tags_group_key) ? '' : tags_group_key)
                    set_data({ ...data })
                  }}
                />
              </Col>
              <Col>
                <Form.Select
                  onChange={
                    (evt: React.ChangeEvent<HTMLSelectElement>) => set_tags_group_key(evt.target.value)}>

                  {Object.entries(data.fluxTags).map(
                    (tags_group, i) =>
                      <option
                        key={i}
                        value={tags_group[0]}
                        selected={tags_group_key === tags_group[0]} >
                        {tags_group[1].group_name}
                      </option>)}
                  {Object.entries(data.nodeTags).filter(tags_group => tags_group[1].banner === 'multi').map(
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
              <Col >
                <FormCheck
                  type='checkbox'
                  label='Mode structure'
                  checked={data.show_structure}
                  onChange={evt => {
                    data.show_structure = evt.target.checked
                    set_data({ ...data })
                  }}
                />
              </Col>
            </Form.Group>
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
                <FormLabel >Flux Nuls:</FormLabel>
              </Col>
              <Col >
                <FormCheck
                  type='checkbox'
                  label='Visible'
                  onChange={evt => {
                    data.display_style.null_flux = evt.target.checked
                    set_data({ ...data })
                  }}
                />
              </Col>
            </Form.Group>
          </Form>
        </Tab>
        {children}
      </Tabs>
    </>
  )
}

SankeySettingsEdition.propTypes = SankeySettingsEditionPropTypes

export default null

export { SankeySettingsEdition}