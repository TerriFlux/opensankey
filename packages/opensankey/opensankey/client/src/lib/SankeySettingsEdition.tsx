import React, { useState, FunctionComponent } from 'react'
import { Button, Row, FormControl, Form, Col, FormLabel, FormCheck, Tabs, Tab, Table, ButtonGroup } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { arrangeNodes, compute_auto_sankey, updateLayout, reorganize_node_inputLinksId, reorganize_node_outputLinksId } from './SankeyLayout'
import { findMaxLinkValue } from './SankeyUtils'
import { SankeyDataPropTypes, SankeyLinkValueDict, TagsGroup } from './types'
import { FaArrowAltCircleUp, FaArrowAltCircleDown, FaPlus, FaMinus } from 'react-icons/fa'
import { addDataTags } from './SankeyUtils'
import colormap from 'colormap'



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
  const [width, set_width] = useState(data.width)
  const [node_hspace, set_node_hspace] = useState(data.h_space)
  const [node_vspace, set_node_vspace] = useState(data.v_space)
  const [link_tag_favorite,set_link_tag_favorite] = useState('')
  const tags_visible = Object.keys(data.dataTags).length > 0
  const [tags_group_key, set_tags_group_key] = useState(tags_visible ? Object.keys(data.dataTags).filter(tags_key=>data.dataTags[tags_key].banner === 'display')[0]: '')

  const { display_style, links, nodes, node_width } = data
  const { filter } = display_style

  let max_link_value = 0
  Object.values(links).forEach(link => {
    const new_max_link_value  = findMaxLinkValue(
      max_link_value, 
      link.value
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })
  max_link_value += 1

  return (
    <Tabs defaultActiveKey="geometry" id="settings-layout">
      <Tab eventKey="geometry" title="Géometrie">
        <Form>
          <Form.Group as={Row} >
            <Col  xs={3}>
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
          {/* <Form.Group as={Row} >
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
          </Form.Group> */}
          <Form.Group as={Row} >
            <Col  xs={3}>
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
            <Col   xs={3}>
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
                    if (shift_visible) {
                      Object.values(nodes).filter(n => n.node_visible).forEach(n => n.x += shift_left)
                      Object.values(links).filter(l => nodes[l.idSource].node_visible && nodes[l.idTarget].node_visible && l.x_label).forEach(l => (l.x_label as number) += shift_left)
                    } else {
                      Object.values(nodes).forEach(n => n.x += shift_left)
                      Object.values(links).filter(l => l.x_label).forEach(l => (l.x_label as number) += shift_left)
                    }
                    set_data({ ...data })
                  }
                }
              >Déplacer</Button>
            </Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col   xs={3}>
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
                    if (shift_visible) {
                      Object.values(nodes).filter(n => n.node_visible).forEach(n => n.y += shift_top)
                      Object.values(links).filter(l => nodes[l.idSource].node_visible && nodes[l.idTarget].node_visible && l.y_label).forEach(l => (l.y_label as number) += shift_top)
                    } else {
                      Object.values(nodes).forEach(n => n.y += shift_top)
                      Object.values(links).filter(l => l.y_label).forEach(l => (l.y_label as number) += shift_top)
                    }
                    set_data({ ...data })
                  }
                }
              >Déplacer</Button>
            </Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col   xs={3}>
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
            <Col   xs={3}>
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
      <Tab eventKey="layout" title="Positionnement">
        <Form >
          <Form.Group as={Row} >
            <Col  xs={3}>
              <FormLabel>Layout</FormLabel>
            </Col>
            <Col   xs={5}>
              <Form.Control
                type="file"
                onChange={(evt: React.ChangeEvent) => file_layout = (evt.target as HTMLFormElement).files}
              />
            </Col>
            <Col  xs={4}>
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
                }>Appliquer Layout
              </Button>
            </Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col   xs={3}>
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
            <Col  xs={2}>
              <FormLabel>Vertical</FormLabel>
            </Col>
            <Col  xs={2}>
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
            <Col  xs={3}>
              <Button
                size="sm"
                onClick={() => {
                  arrangeNodes(data, node_hspace, node_vspace)
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
      <Tab eventKey="nodes" title="Noeuds">
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
                style={{ 'marginBottom': '3px' }}
                onClick={
                  () => {
                    Object.values(data.nodes).filter(n => n.node_visible).forEach(n => {
                      delete n.x_label
                      delete n.y_label
                    })
                  }
                }
              >Reset label position</Button>
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
                  Object.values(data.links).forEach(link=>link.colormap = (link.colormap === tags_group_key) ? '' : tags_group_key)
                  set_link_tag_favorite((link_tag_favorite === tags_group_key) ? '' : tags_group_key)
                  set_data({ ...data })
                }}
              />
            </Col>
            <Col>
              <Form.Select
                onChange={
                  (evt: React.ChangeEvent<HTMLSelectElement>) => set_tags_group_key(evt.target.value)}>
                {Object.entries(data.dataTags).filter(tags_group=>tags_group[1].banner === 'display').map(
                  (tags_group, i) =>
                    <option
                      key={i}
                      value={tags_group[0]}
                      selected={tags_group_key === tags_group[0]} >
                      {tags_group[1].group_name}
                    </option>)}
                {Object.entries(data.tags_catalog).filter(tags_group=>tags_group[1].banner === 'multi').map(
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
                  Object.values(data.links).filter(l => data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible).forEach(
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
                  Object.values(data.links).filter(l => data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible).forEach(
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
                  Object.values(data.links).filter(l => data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible).forEach(l => l.curvature = +evt.target.value)
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
                    Object.values(data.links).filter(l => data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible).forEach(
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
                  Object.values(data.links).filter(l => data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible).forEach(
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
                  Object.values(data.links).filter(l => data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible).forEach(
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
                  Object.values(data.links).filter(l => data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible).forEach(
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
                name='color'
                value='black'
                type='radio'
                label='Label en noir'
                onChange={
                  () => {
                    Object.values(data.links).filter(l => data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible).forEach(
                      l => l.text_color = 'black'
                    )
                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col>
              <FormCheck
                name='color'
                value='white'
                type='radio'
                label='Label blanc'
                onChange={
                  () => {
                    Object.values(data.links).filter(l => data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible).forEach(
                      l => l.text_color = 'white'
                    )
                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col>
              <FormCheck
                name='color'
                value='same_color'
                type='radio'
                label='Label en couleur'
                onChange={
                  () => {
                    Object.values(data.links).filter(l => data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible).forEach(
                      l => l.text_color = l.color
                    )
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
              onChange={
                evt => {
                  Object.values(data.links).filter(l => data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible).forEach(
                    l => l.label_visible = evt.target.checked
                  )
                  set_data({ ...data })
                }
              }
            />
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


  )
}

const SankeySettingsEditionTagsPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired
}
type SankeySettingsEditionTagsTypes = InferProps<typeof SankeySettingsEditionTagsPropTypes>

const SankeySettingsEditionTags: FunctionComponent<SankeySettingsEditionTagsTypes> = ({ data, set_data }) => {
  const [tags_group_key, set_tags_group_key] = useState(Object.keys(data.tags_catalog).length > 0 ? Object.keys(data.tags_catalog)[0] : '')
  //const [tagColorMap, setTagColorMap] = useState('jet')
  //const [tag_key, set_tag_key] = useState('')

  const { links, tags_catalog } = data

  let max_link_value = 0
  Object.values(links).forEach(link => {
    const new_max_link_value  = findMaxLinkValue(
      max_link_value, 
      link.value
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })
  max_link_value += 1

  const colormaps = [
    'custom',
    'jet', 'hsv','hot','cool','spring','summer','autumn','winter','bone',
    'copper','greys','YIGnBu','greens','YIOrRd','bluered','RdBu','picnic',
    'rainbow','portland','blackbody','earth','electric',

    'viridis', 'inferno', 'magma', 'plasma', 'warm', 'cool', 'rainbow-soft',

    'bathymetry', 'cdom', 'chlorophyll', 'density', 'freesurface-blue', 'freesurface-red', 'oxygen', 'par', 'phase', 'salinity', 'temperature', 'turbidity', 'velocity-blue', 'velocity-green',

    'cubehelix'
  ]

  //Permet de modifier le type de bannier pour le groupTag (si ce non None)
  const handleBanner = (tags_group_key: string, evt: React.ChangeEvent<HTMLSelectElement>) => {
    tags_catalog[tags_group_key].banner = evt.target.value
    set_data({ ...data })
  }
  // --------------------------------------------
  //ajoute un tag au group selectionné 
  const handleAddTagButton = () => {
    const { tags_catalog } = data
    // Méthode pour incrementer idElement
    const listId : number[] = []
    Object.keys(tags_catalog[tags_group_key].tags).forEach(elt => listId.push(Number(elt.replace('element', ''))))
    const idElement = listId.length > 0 ? Math.max(...listId) + 1 : 0
    tags_catalog[tags_group_key].tags['element' + idElement] = { name: 'tag' + idElement, color: '#000000', selected: true }
    const nb_tags = Object.keys(tags_catalog[tags_group_key].tags).length
    const colors = colormap({
      colormap: tags_catalog[tags_group_key].color_map,
      nshades: Math.max(11,nb_tags),
      format: 'hex',
      alpha: 1
    })
    let step = 1
    if (nb_tags<11) {
      step = Math.round(11/nb_tags)
    }
    Object.keys(tags_catalog[tags_group_key].tags).forEach(
      (tag_key, i) => tags_catalog[tags_group_key].tags[tag_key].color = colors[i*step]
    )
    set_data({ ...data })
  }
  //Ajoute un groupTag
  const handleAddTagGrpButton = () => {
    const { tags_catalog } = data
    // Méthode pour incrementer idGroup
    const listId : number[] = []
    Object.keys(tags_catalog).forEach(elt => listId.push(Number(elt.replace('tag_group_', ''))))
    const idGroup = listId.length > 0 ? Math.max(...listId) + 1 : 0
    tags_catalog['tag_group_' + idGroup] = {
      group_name: 'Tag Group ' + idGroup,
      show_legend: false,
      color_map: 'jet',
      tags: {},
      banner: 'none'
    }
    Object.values(data.nodes).forEach(n => n.tags['tag_group_' + idGroup]=[])
    if (Object.keys(tags_catalog).length === 1) {
      Object.values(data.nodes).forEach(n => n.colorTag = Object.keys(tags_catalog)[0] )      
    }
     
    //set_key_group_tag(tmp_key + 1)
    // if (Object.keys(tags_catalog).length == 1) {
    //   set_tags_group_key(tmp_key)
    // }
    set_tags_group_key('tag_group_' + idGroup)
    set_data({ ...data })
  }

  const handleDelTag = (n: string) => {
    const { tags_catalog } = data
    delete tags_catalog[tags_group_key].tags[n]

    set_data({ ...data })
  }

  const handleDelGroupTag = (tags_group_key: string) => {
    const { tags_catalog } = data
    //console.log(i)
    delete tags_catalog[tags_group_key]
    Object.values(data.nodes).forEach(
      n=> {
        if (n.colorTag === tags_group_key) { 
          n.colorTag = ''   
        }})
    if (Object.keys(tags_catalog).length > 0) {
      const lastElmt = Object.keys(tags_catalog)[Object.keys(tags_catalog).length - 1]
      set_tags_group_key(lastElmt)
    }
    set_data({ ...data })
  }

  const handleUpGrpTag = (i: string) => {
    const { tags_catalog } = data
    const listElmt = Object.keys(tags_catalog)
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt - 1, 0, i)
    const new_cat : {[key:string]:TagsGroup} = {}
    listElmt.forEach(elt => {
      new_cat [elt] = tags_catalog[elt]
    })
    for (const member in tags_catalog) delete tags_catalog[member]
    Object.assign(tags_catalog, new_cat)
    set_data({ ...data })
  }

  const handleDownGrpTag = (i: string) => {
    const { tags_catalog } = data
    const listElmt = Object.keys(tags_catalog)
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt + 1, 0, i)
    const new_cat : {[key:string]:TagsGroup} = {}
    listElmt.forEach(elt => {

      new_cat[elt] = tags_catalog[elt]
    })
    for (const member in tags_catalog) delete tags_catalog[member]
    Object.assign(tags_catalog, new_cat)
    set_data({ ...data })
  }

  // const handleBanner = (i: string, evt: React.ChangeEvent<HTMLSelectElement>) => {
  //   const { tags_catalog } = data
  //   tags_catalog[i].banner = evt.target.value
  //   set_data({ ...data })
  // }

  // const optionTag = () => {

  //   if (Object.keys(tags_catalog).length == 0) {
  //     return <option></option>
  //   } else {
  //     return Object.entries(tags_catalog[tags_group_key].tags).map(
  //       (tag, i) =>
  //         <option
  //           key={i}
  //           value={tag[0]}
  //           selected={tags_catalog[tags_group_key].tags[tag[0]] == tags_catalog[tags_group_key].tags[tag[0]]} >
  //           {tag[1].name}
  //         </option>)
  //   }
  // }
  const tagSetting = (<>
    <Form.Group as={Row} >
      <Col>
        <FormLabel >Tag Groupe:</FormLabel>
      </Col>
      <Col>
        <Form.Select onChange={
          (evt: React.ChangeEvent<HTMLSelectElement>) => {
            set_tags_group_key(evt.target.value)
            set_data({ ...data })
          }}>
          {Object.keys(tags_catalog).map(
            (key, i) =>
              <option
                key={i}
                value={key}
                selected={tags_group_key === key} >
                {tags_catalog[key].group_name}
              </option>
          )}
        </Form.Select>
      </Col>
      <Col>
        <Form.Select onChange={
          (evt: React.ChangeEvent<HTMLSelectElement>) => {
            //setTagColorMap(evt.target.value)
            tags_catalog[tags_group_key].color_map = evt.target.value
            const nb_tags = Object.keys(tags_catalog[tags_group_key].tags).length
            if (evt.target.value === 'custom') {
              return
            }
            const colors = colormap({
              colormap: evt.target.value,
              nshades: Math.max(11,nb_tags),
              format: 'hex',
              alpha: 1
            })
            let step = 1
            if (nb_tags<11) {
              step = Math.round(11/nb_tags)
            }
            Object.keys(tags_catalog[tags_group_key].tags).forEach(
              (tag_key, i) => tags_catalog[tags_group_key].tags[tag_key].color = colors[i*step]
            )
            set_data({ ...data })
          }}>
          {colormaps.map(
            (cur_colormap, i) =>
              <option
                key={i}
                value={cur_colormap}
                selected={tags_catalog[tags_group_key] && tags_catalog[tags_group_key].color_map === cur_colormap} >
                {cur_colormap}
              </option>
          )}
        </Form.Select>
      </Col>
    </Form.Group>

    <Table striped bordered hover responsive='sm' size='sm' className='node_tags_definition'>
      <thead>
        <tr>

          <th><Button variant="success" value='+' onClick={handleAddTagButton}><FaPlus /></Button> </th>
          <th>Nom</th>
          <th>Visible</th>
          <th>Couleur</th>
          <th>Shape</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(tags_catalog).length > 0 && tags_group_key !== '' ? Object.keys(tags_catalog[tags_group_key].tags).map(
          (tag_key, i) => {
            return (
              <tr key={i.toString()}>
                <td style={{ 'width': '10%' }}><Button variant="danger" value='-' onClick={() => { handleDelTag(tag_key) }}><FaMinus /></Button></td>

                <td style={{ 'width': '33%' }}>
                  <FormControl /* size='sm' */
                    id={i.toString()}
                    type="text"
                    value={tags_catalog[tags_group_key].tags[tag_key].name}
                    onChange={
                      (evt: React.ChangeEvent) => {
                        const { tags_catalog } = data
                        const new_nb_element = evt.target as HTMLInputElement
                        const name = new_nb_element.value
                        tags_catalog[tags_group_key].tags[tag_key].name = name
                        set_data({ ...data })
                      }
                    } /></td>
                <td style={{ 'width': '10%' }}>
                  <Form.Check inline={true}
                    name={'element_visible' + tag_key}
                    checked={tags_catalog[tags_group_key].tags[tag_key].selected}
                    id={tag_key}
                    type='switch'
                    onChange={
                      (evt: React.ChangeEvent) => {
                        const new_nb_element = evt.target as HTMLInputElement
                        const tag_key = new_nb_element.id
                        const visible = new_nb_element.checked
                        tags_catalog[tags_group_key].tags[tag_key].selected = visible
                        set_data({ ...data })
                      }
                    } />
                </td>
                <td><Form.Control
                  type="color"
                  value={tags_catalog[tags_group_key].tags[tag_key].color as string}
                  onChange={
                    evt => {
                      tags_catalog[tags_group_key].tags[tag_key].color = evt.target.value
                      set_data({ ...data })
                    }
                  }
                /></td>
                <Form.Select onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                  tags_catalog[tags_group_key].tags[tag_key].shape = evt.target.value
                  set_data({ ...data })
                }

                }>
                  <option key={'rect' + i} id='rect' selected={tags_catalog[tags_group_key].banner === 'one'} value='rect'>Rectangle</option>
                  <option key={'circle' + i} id='circle' selected={tags_catalog[tags_group_key].banner === 'multi'} value='circle'>Circle</option>
                </Form.Select>
              </tr>
            )
          }) : (<></>)}
      </tbody>
    </Table>

  </>
  )


  return (
    <>
      <Table striped bordered hover className='node_group_tags_definition'>
        <thead>
          <tr>
            <th><Button variant="success" onClick={handleAddTagGrpButton}><FaPlus /></Button></th>
            <th>Nom</th>
            <th>Legend</th>
            <th>Tag</th>
            <th>Bannière</th>
            <th>Position</th>
          </tr>
        </thead>
        <tbody>
          {

            Object.keys(tags_catalog).map(
              (tags_group_key, i) => {
                return (
                  <tr key={i.toString()}>
                    <td style={{ 'width': '10%' }}>
                      <Button variant="danger" onClick={() => handleDelGroupTag(tags_group_key)}><FaMinus /></Button>
                    </td>
                    <td>
                      <FormControl
                        id={i.toString()}
                        type="text"
                        value={tags_catalog[tags_group_key].group_name}
                        onChange={
                          (evt: React.ChangeEvent) => {
                            const { tags_catalog } = data
                            const new_name = (evt.target as HTMLInputElement).value
                            tags_catalog[tags_group_key].group_name = new_name
                            set_data({ ...data })
                          }
                        } />
                    </td>
                    <td>
                      <Form.Check inline={true}
                        // Permet de selection le tag pour l'affichage dans la légende
                        name={'element_legend_' + tags_group_key}
                        checked={tags_catalog[tags_group_key].show_legend}
                        id={tags_group_key}
                        type='switch'
                        onChange={
                          (evt: React.ChangeEvent) => {
                            const new_nb_element = evt.target as HTMLInputElement
                            const tags_group_key = new_nb_element.id
                            const visible = new_nb_element.checked
                            tags_catalog[tags_group_key].show_legend = visible
                            set_data({ ...data })
                          }
                        } />
                    </td>
                    <td>{Object.keys(tags_catalog[tags_group_key].tags).length}</td>
                    <Form.Select onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => handleBanner(tags_group_key, evt)}>
                      <option key={'none' + i}  id='NoneBaner' selected={tags_catalog[tags_group_key].banner === 'none' || !tags_catalog[tags_group_key].banner} value='none'>None</option>
                      <option key={'one' + i}   id='OneBaner' selected={tags_catalog[tags_group_key].banner === 'one'} value='one'>One</option>
                      <option key={'multi' + i} id='MultipleBaner' selected={tags_catalog[tags_group_key].banner === 'multi'} value='multi'>Multi</option>
                    </Form.Select>
                    <td style={{ 'width': '10%' }}>
                      <ButtonGroup className="button_position" size="sm">
                        <Button variant="info" onClick={() => handleUpGrpTag(tags_group_key)}><FaArrowAltCircleUp /></Button>
                        <Button variant="info" onClick={() => handleDownGrpTag(tags_group_key)}><FaArrowAltCircleDown /></Button>
                      </ButtonGroup>
                    </td>

                  </tr>
                )
              })
          }
        </tbody>
      </Table>
      {Object.keys(tags_catalog).length > 0 ? tagSetting : <></>}
    </>
  )
}

const SankeySettingsEditionTagsLinks: FunctionComponent<SankeySettingsEditionTagsTypes> = ({ data, set_data }) => {
  const [links_tags_group_key, set_links_tags_group_key] = useState(Object.keys(data.dataTags).length > 0 ? Object.keys(data.dataTags)[0] : '')
  //const [tag_key, set_tag_key] = useState('')

  const { links, dataTags } = data

  let max_link_value = 0
  Object.values(links).forEach(link => {
    const new_max_link_value  = findMaxLinkValue(
      max_link_value, 
      link.value
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })
  max_link_value += 1

  //Permet de modifier le type de bannier pour le groupTag (si ce non None)
  const handleBanner = (links_tags_group_key: string, evt: React.ChangeEvent<HTMLSelectElement>) => {
    dataTags[links_tags_group_key].banner = evt.target.value
    set_data({ ...data })
  }
  // --------------------------------------------
  //ajoute un tag au group selectionné 
  const handleAddTagButton = () => {
    const { dataTags } = data
    //Si le DataTag n'a pas de tag alors le premier crée sera selectionné par defaut
    const selectedDefault = (Object.keys(dataTags[links_tags_group_key].tags).length == 0) ? true : false
    //création d'un tag par defaut
    // Méthode pour incrementer idElement
    const listId : number[] = []
    Object.keys(dataTags[links_tags_group_key].tags).forEach(elt => listId.push(Number(elt.replace('element', ''))))
    const idElement = listId.length > 0 ? Math.max(...listId) + 1 : 0
    dataTags[links_tags_group_key].tags['element' + idElement] = { name: 'tag' + idElement, color: '#000000', selected: selectedDefault }

    const dataTagsArray = Object.values(dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) && dataTag.banner !== 'display' ? true : false })
    Object.values(data.links).forEach(
      l=> {
        addDataTags(dataTagsArray,l.value,0)
      }
    )

    set_data({ ...data })
  }
  //Ajoute un groupTag
  const handleAddTagGrpButton = () => {
    const { dataTags } = data

    // Méthode pour incrementer idGroup
    const listId : number[] = []
    Object.keys(dataTags).forEach(elt => listId.push(Number(elt.replace('tag_group_', ''))))
    const idGroup = listId.length > 0 ? Math.max(...listId) + 1 : 0
    dataTags['tag_group_' + idGroup] = {
      group_name: 'Tag Group ' + idGroup,
      show_legend: false,
      color_map: 'jet',
      tags: {},
      banner: 'none'
    }

    set_links_tags_group_key('tag_group_' + idGroup)
    set_data({ ...data })
  }
  //supprime tag
  const handleDelTag = (n: string) => {
    const { dataTags } = data
    delete dataTags[links_tags_group_key].tags[n]

    set_data({ ...data })
  }
  //supprime groupTag
  const handleDelGroupTag = (tags_group_key: string) => {
    const { dataTags } = data
    //console.log(i)
    delete dataTags[tags_group_key]
    if (Object.keys(dataTags).length > 0) {
      const lastElmt = Object.keys(dataTags)[Object.keys(dataTags).length - 1]
      set_links_tags_group_key(lastElmt)
    }
    set_data({ ...data })
  }
  //Deplace groupeTag vers le haut de l'objet
  // const handleUpGrpTag = (i: string) => {
  //   const { dataTags } = data
  //   const tmp = dataTags[i]
  //   const cpyCat = dataTags
  //   const listElmt = Object.keys(dataTags)
  //   const posElemt = listElmt.indexOf(i)
  //   listElmt.splice(posElemt, 1)
  //   listElmt.splice(posElemt - 1, 0, i)
  //   const new_cat = ({} as any)
  //   listElmt.forEach(elt => {

  //     new_cat[elt] = dataTags[elt]
  //   })
  //   for (const member in dataTags) delete dataTags[member]
  //   Object.assign(dataTags, new_cat)
  //   set_data({ ...data })
  // }
  //Deplace groupeTag vers le bas de l'objet

  // const handleDownGrpTag = (i: string) => {
  //   const { dataTags } = data
  //   const tmp = dataTags[i]
  //   const cpyCat = dataTags
  //   const listElmt = Object.keys(dataTags)
  //   const posElemt = listElmt.indexOf(i)
  //   listElmt.splice(posElemt, 1)
  //   listElmt.splice(posElemt + 1, 0, i)
  //   const new_cat = ({} as any)
  //   listElmt.forEach(elt => {

  //     new_cat[elt] = dataTags[elt]
  //   })
  //   for (const member in dataTags) delete dataTags[member]
  //   Object.assign(dataTags, new_cat)
  //   set_data({ ...data })
  // }
  const tagSetting = (<>
    <Form.Group as={Row} >
      <Col xs={2}>
        <FormLabel >TagGroupe:</FormLabel>
      </Col>
      <Col>
        <Form.Select onChange={
          (evt: React.ChangeEvent<HTMLSelectElement>) => {
            set_links_tags_group_key(evt.target.value)
            set_data({ ...data })
          }}>
          {Object.keys(dataTags).map(
            (key, i) =>
              <option
                key={i}
                value={key}
                selected={links_tags_group_key === key} >
                {dataTags[key].group_name}
              </option>
          )}
        </Form.Select>
      </Col>
    </Form.Group>

    <Table striped bordered hover responsive='sm' size='sm' className='link_tags_definition'>
      <thead>
        <tr>
          <th><Button variant="success" value='+' onClick={handleAddTagButton}><FaPlus /></Button></th>
          <th>Nom</th>
          {Object.keys(dataTags).length > 0 && dataTags[links_tags_group_key].banner === 'display' ? (<th>Color</th>) :(<></>)}
          <th>Selected</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(dataTags).length > 0 && links_tags_group_key !== '' ? Object.keys(dataTags[links_tags_group_key].tags).map(
          (tag_key, i) => {
            return (
              <tr key={i.toString()}>
                <td style={{ 'width': '10%' }}><Button variant="danger" onClick={() => { handleDelTag(tag_key) }}><FaMinus /></Button></td>

                <td /* style={{ 'width': '33%' }} */>
                  <FormControl size='sm'
                    id={i.toString()}
                    type="text"
                    value={dataTags[links_tags_group_key].tags[tag_key].name}
                    onChange={
                      (evt: React.ChangeEvent) => {
                        const { dataTags } = data
                        const new_nb_element = evt.target as HTMLInputElement
                        const name = new_nb_element.value
                        for (const l in data.links) {
                          ((data.links[l].value as unknown) as SankeyLinkValueDict) = JSON.parse(JSON.stringify(data.links[l].value).replaceAll('"' + dataTags[links_tags_group_key].tags[tag_key].name + '"', '"' + name + '"')) as SankeyLinkValueDict
                          // data.links[l].valueV2 = JSON.parse(JSON.stringify(data.links[l].valueV2).replaceAll(dataTags[links_tags_group_key].tags[tag_key].name, name)) as any

                        }
                        dataTags[links_tags_group_key].tags[tag_key].name = name
                        set_data({ ...data })
                      }
                    } /></td>
                {/* <td >
                  <Form.Check inline={true}
                    name={'element_visible' + tag_key}
                    checked={dataTags[links_tags_group_key].tags[tag_key].selected}
                    id={tag_key}
                    type='switch'
                    onChange={
                      (evt: React.ChangeEvent) => {
                        const new_nb_element = evt.target as HTMLInputElement
                        const tag_key = new_nb_element.id
                        const visible = new_nb_element.checked
                        dataTags[links_tags_group_key].tags[tag_key].selected = visible
                        set_data({ ...data })
                      }
                    } />
                </td> */}
                {dataTags[links_tags_group_key].banner === 'display' ? (
                  <td><Form.Control
                    type="color"
                    value={dataTags[links_tags_group_key].tags[tag_key].color as string}
                    onChange={
                      evt => {
                        dataTags[links_tags_group_key].tags[tag_key].color = evt.target.value
                        set_data({ ...data })
                      }
                    }
                  /></td>
                ) : (<></>)}
                <td /* style={{ 'width': '10%' }} */>
                  <Form.Check inline={true}
                    name={'element_selected' + tag_key}
                    checked={dataTags[links_tags_group_key].tags[tag_key].selected}
                    id={tag_key}
                    type='switch'
                    onChange={
                      (evt: React.ChangeEvent) => {
                        const new_nb_element = evt.target as HTMLInputElement
                        const tag_key = new_nb_element.id
                        const visible = new_nb_element.checked
                        if (dataTags[links_tags_group_key].banner !== 'display') {
                          Object.values(dataTags[links_tags_group_key].tags).map(d => {
                            d.selected = false
                          })
                        }
                        dataTags[links_tags_group_key].tags[tag_key].selected = visible
                        set_data({ ...data })
                        console.log(dataTags)
                      }
                    } />
                </td>


              </tr>
            )
          }) : (<></>)}
      </tbody>
    </Table>

  </>
  )


  return (
    <>
      <Table striped bordered responsive='sm' size='sm' hover className='link_group_tag_definition'>
        <thead>
          <tr>
            <th><Button variant="success" onClick={handleAddTagGrpButton}><FaPlus /></Button></th>
            <th>Nom</th>
            {/* <th>Legend</th> */}
            <th>Tag</th>
            <th>Bannière</th>
            {/* <th>Position</th> */}
          </tr>
        </thead>
        <tbody>
          {

            Object.keys(dataTags).map(
              (links_tags_group_key, i) => {
                return (
                  <tr key={i.toString()}>
                    <td style={{ 'width': '10%' }}>
                      <Button variant="danger" onClick={() => handleDelGroupTag(links_tags_group_key)}><FaMinus /></Button>
                    </td>
                    <td>
                      <FormControl
                        id={i.toString()}
                        type="text"
                        value={dataTags[links_tags_group_key].group_name}
                        onChange={
                          (evt: React.ChangeEvent) => {
                            const { dataTags } = data
                            const new_name = (evt.target as HTMLInputElement).value
                            dataTags[links_tags_group_key].group_name = new_name
                            set_data({ ...data })
                          }
                        } />
                    </td>
                    {/* <td>
                    -------------------------------
                      LEGEND
                    -------------------------------

                      <Form.Check inline={true}
                        // Permet de selection le tag pour l'affichage dans la légende
                        name={'element_legend_' + links_tags_group_key}
                        checked={dataTags[links_tags_group_key].show_legend}
                        id={links_tags_group_key}
                        type='switch'
                        onChange={
                          (evt: React.ChangeEvent) => {
                            const new_nb_element = evt.target as HTMLInputElement
                            const links_tags_group_key = new_nb_element.id
                            const visible = new_nb_element.checked
                            dataTags[links_tags_group_key].show_legend = visible
                            set_data({ ...data })
                          }
                        } />
                    </td> */}
                    <td>{Object.keys(dataTags[links_tags_group_key].tags).length}</td>
                    <Form.Select onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => handleBanner(links_tags_group_key, evt)}>
                      <option key={'none' + i}    id='NoneBaner' selected={dataTags[links_tags_group_key].banner === 'none' || !dataTags[links_tags_group_key].banner} value='none'>None</option>
                      <option key={'one' + i}     id='OneBaner' selected={dataTags[links_tags_group_key].banner === 'one'} value='one'>Donnée</option>
                      <option key={'display' + i} id='DisplayBaner' selected={dataTags[links_tags_group_key].banner === 'display'} value='display'>Affichage</option>                   
                    </Form.Select>
                    {/* <td style={{ 'width': '10%' }}>
                      <ButtonGroup className="button_position" size="sm">
                        <Button variant="info" onClick={() => handleUpGrpTag(links_tags_group_key)}><FaArrowAltCircleUp /></Button>
                        <Button variant="info" onClick={() => handleDownGrpTag(links_tags_group_key)}><FaArrowAltCircleDown /></Button>
                      </ButtonGroup>
                    </td> */}

                  </tr>
                )
              })
          }
        </tbody>
      </Table>
      {Object.keys(dataTags).length > 0 ? tagSetting : <></>}
    </>
  )
}





SankeySettingsEdition.propTypes = SankeySettingsEditionPropTypes
SankeySettingsEditionTags.propTypes = SankeySettingsEditionTagsPropTypes
SankeySettingsEditionTagsLinks.propTypes = SankeySettingsEditionTagsPropTypes


export default null

export { SankeySettingsEditionTags, SankeySettingsEdition, SankeySettingsEditionTagsLinks }