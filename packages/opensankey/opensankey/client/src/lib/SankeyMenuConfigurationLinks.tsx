import React, { FunctionComponent, useState } from 'react'
import { Row, Form, Col, FormLabel, FormCheck, Tabs, Tab, FormControl, Table, Button, ButtonGroup, Dropdown } from 'react-bootstrap'
import { reorganize_inputLinksId } from './SankeyLayout'
import { SankeyDataPropTypes, SankeyLink, SankeyLinkPropTypes, SankeyLinkValue, SankeyNode } from './types'
import PropTypes, { InferProps } from 'prop-types'
import { cut_name, default_link, delete_link } from './SankeyUtils'
import * as d3 from 'd3'
import { MultiSelect } from 'react-multi-select-component'
import { selected_type } from './SankeyMenu'
import { FaAngleDoubleDown, FaAngleDoubleUp, FaAngleDown, FaAngleUp, FaArrowsAltH, FaMinus, FaPlus } from 'react-icons/fa'

const SankeyMenuConfigurationLinksPropTypes = {
  t: PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  selected_link: PropTypes.shape({current:PropTypes.shape(SankeyLinkPropTypes).isRequired}).isRequired,
  multi_selected_links: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired}).isRequired,
}

type SankeyMenuConfigurationLinksTypes = InferProps<typeof SankeyMenuConfigurationLinksPropTypes>

const SankeyMenuConfigurationLinks: FunctionComponent<SankeyMenuConfigurationLinksTypes> = (
  { t,data, set_data, selected_link, multi_selected_links }
) => {
  const { fluxTags,dataTags } = data
  const [forceUpdate, setForceUpdate] = useState(false)
  const [style_to_apply_to_link, set_style_to_apply_to_link] = useState('default')
  const set_show_link = useState(true)[1]

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
        val[tag_selected] = {'display_value': '',tags:{},value:0}
      }
      val = val[tag_selected]
    })
    return val
  }

  const test_value=(v:number | null | undefined)=>{
    return ((v || v===0)&& v!==undefined) ? v:''
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
  const allNodeLabelFontSize = () => {
    let display_size = true
    let size = 11
    if (multi_selected_links.current.length != 0) {
      size = multi_selected_links.current[0].label_font_size
    }
    multi_selected_links.current.map((d) => {
      display_size = (d.label_font_size == size) ? display_size : false
    })
    return (display_size) ? size : 11
  }
  const isAllLinkToPrecision=()=>{
    let toPrecision = true
    multi_selected_links.current.map(d => {
      toPrecision = (d.to_precision) ? toPrecision : false
    })
    return toPrecision
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

  const INITIAL_OPTIONS_LINKS = Object.values(data.links).filter(l=>(data.displayed_link_selector)?(data.nodes[l.idSource].display && data.nodes[l.idTarget].display):true).map((d) => { return { 'label': (data.nodes[d.idSource].name + '--->' + data.nodes[d.idTarget].name), 'value': d.idLink } })
  const selected_links = multi_selected_links.current.map((d) => {
    if (data.nodes[d.idSource] == undefined || data.nodes[d.idTarget] == undefined) {
      return
    }
    return { 'label': (data.nodes[d.idSource].name + '--->' + data.nodes[d.idTarget].name), 'value': d.idLink }
  })
  //Renvoie le menue déroulant pour la sélection des flux
  const dropdownMultiLinks = () => {
    const DD = (
      <div id='DD_multi_links'>
        <MultiSelect
          valueRenderer={ (selected :selected_type[]) => {
            return selected.filter(d=>d!==undefined).length ? selected.map( ({label}) => label + ', ') : 'Aucun flux sélectionné'
          }}
          options={INITIAL_OPTIONS_LINKS}
          value={selected_links}
          overrideStrings={{
            'selectAll': 'Tout sélectionner',
          }}
          onChange={(selected: [{ label: string, value: string }]) => {
            const new_sel = selected.map(d => d.value)
            const m_s = Object.values(data.links).filter(d => (new_sel.includes(d.idLink)))
            multi_selected_links.current = m_s
            Object.values(data.links).forEach( l => {
            
              d3.selectAll(' .opensankey #gg_' + l.idLink + ' rect').attr('fill-opacity', '0')
              d3.selectAll(' .opensankey #gg_' + l.idLink + ' .drag_zone').attr('stroke-opacity', '0')

            } 
            )
            multi_selected_links.current.forEach( l => {
              const sel = d3.selectAll(' .opensankey #gg_' + l.idLink + ' rect')
              sel.attr('fill-opacity', '1')
              d3.selectAll(' .opensankey #gg_' + l.idLink + ' .drag_zone').attr('stroke-opacity', '1')

            
            })
            setForceUpdate(!forceUpdate) 
          }}
          labelledBy={'hello'}
        />
      </div>)
    return DD
  }

  //Dépalce la place des liens sélectionnés vers le début dans le tableau de liens de data
  //Permet donc de les déssiner avant 
  const handleUpLink = (i: string) => {
    const { links } = data
    const listElmt = Object.keys(links)
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt - 1, 0, i)
    const new_cat: { [key: string]: SankeyLink } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = links[elt]
    })
    for (const member in links) delete links[member]
    Object.assign(links, new_cat)
    set_data({ ...data })
  }

  //Dépalce la place des liens sélectionnés vers la fin dans le tableau de liens de data
  //Permet donc de les déssiner après 
  const handleDownLink = (i: string) => {
    const { links } = data
    const listElmt = Object.keys(links)
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt + 1, 0, i)
    const new_cat: { [key: string]: SankeyLink } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = links[elt]
    })
    for (const member in links) delete links[member]
    Object.assign(links, new_cat)
    set_data({ ...data })
  }
  
  //Add new link and selection it
  const add_new_link = () => {
    const { nodes, links } = data

    if (Object.keys(nodes).length < 2) {
      return
    }
    const link: SankeyLink = default_link(data)
    // Méthode pour incrementer idNode
    const listId: number[] = []
    Object.keys(data.links).forEach(elt => listId.push(Number(elt.replace('link', ''))))
    const idLink = listId.length > 0 ? Math.max(...listId) + 1 : 0
    link.idLink = 'link' + idLink
    links[link.idLink] = link
    const node_keys = Object.keys(nodes)
    link.idSource = nodes[node_keys[0]].idNode
    link.idTarget = nodes[node_keys[1]].idNode
    if (link.idSource === link.idTarget) {
      link.recycling = true
    }

    nodes[node_keys[0]].outputLinksId.push(link.idLink)
    nodes[node_keys[1]].inputLinksId.push(link.idLink)

    selected_link.current = link
    multi_selected_links.current = [link]
    set_data({ ...data })
    set_show_link(true)
  }

  //Change the source of selected link
  const source_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    const link = multi_selected_links.current[0]
    //Causait un problème d'acumulation de la valeur de des differents link sur des noeuds non associé
    const previous_node = data.nodes[link.idSource]
    previous_node.outputLinksId.splice(previous_node.outputLinksId.indexOf(multi_selected_links.current[0].idLink), 1)

    const source_node = data.nodes[changeEvent.target.value]
    link.idSource = source_node.idNode
    if (link.idSource === link.idTarget) {
      link.recycling = true
    }
    source_node.outputLinksId.push(multi_selected_links.current[0].idLink)


    set_data({ ...data })
  }

  const addDropSource = () => {
    if (Object.keys(data.nodes).length >= 2 && Object.keys(data.links).length != 0 && multi_selected_links.current.length != 0) {
      return (
        Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode} selected={multi_selected_links.current[0].idSource === n.idNode} >{n.name}</option>)
      )
    }
  }
  const addDropCible = () => {
    if (Object.keys(data.nodes).length >= 2 && Object.keys(data.links).length != 0 && multi_selected_links.current.length != 0) {
      return (
        Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode} selected={multi_selected_links.current[0].idTarget === n.idNode} >{n.name}</option>)
      )
    }
  }

  //Change the target of selected link
  const target_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    const { nodes } = data
    const link = multi_selected_links.current[0]
    const previous_node = nodes[link.idTarget]
    previous_node.inputLinksId.splice(previous_node.inputLinksId.indexOf(multi_selected_links.current[0].idLink), 1)

    const target_node = nodes[changeEvent.target.value]
    link.idTarget = target_node.idNode
    if (link.idSource === link.idTarget) {
      link.recycling = true
    }


    target_node.inputLinksId.push(multi_selected_links.current[0].idLink)

    set_data({ ...data })
  }


 
  const apply_style_to_selected_links = () => {
    const style = data.style_link[style_to_apply_to_link]

    multi_selected_links.current.map(d => {

      // type of link
      d.recycling = style.recycling
      d.orientation = style.orientation
      d.arrow = style.arrow

      // display_attribute
      d.label_position = style.label_position
      d.orthogonal_label_position = style.orthogonal_label_position
      d.label_on_path = style.label_on_path
      d.label_visible = style.label_visible
      d.text_color = style.text_color
      d.color = style.color

      d.gradient = style.gradient

      d.curvature = style.curvature
      d.curved = style.curved
    })
  }

  //Change le style des flux sélectionnés
  const style_of_selected_links = () => {
    let style_to_display = 'Aucun'
    if (multi_selected_links.current.length != 0) {
      style_to_display = multi_selected_links.current[0].style
      let inchangee = true
      multi_selected_links.current.map(d => {
        inchangee = (d.style == style_to_display) ? inchangee : false
      })
      if (style_to_display != '' && style_to_display !== undefined) {
        return (inchangee) ? cut_name(data.style_link[style_to_display].idLink, 25) : 'Multiple style parmi les noeuds sélectionnés'

      } else {
        return 'Aucun'
      }
    } else {
      return style_to_display
    }
  }

  //Onglet Tags du menu noeud pour selectionner un tag favorie si présent
  const link_tag = (
    <Tab eventKey="tags" title={t('Noeud.tags_node.tags')}
      disabled={/*node.colorParameter !== 'groupTag'*/false} >
      <Form.Group as={Row} >
        <Col xs={2}>
          <FormLabel >{t('Tags.GE')}:</FormLabel>
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
              <th>{t('Tags.Nom')}</th>
              <th>{t('Noeud.tags_node.Appartenance')}</th>
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
  return (<>
    <Form.Group>
      <FormLabel style={{ justifyContent: 'center' }} ><b>Paramétres généraux</b></FormLabel>
      <Row>
        <Col xs={6}>{t('Flux.pdl')}</Col>
        <Col xs={6}><Form.Select
          onChange={
            (evt: React.ChangeEvent<HTMLSelectElement>) => {
              data.display_style.link_font_family_selected = evt.target.value
              set_data({ ...data })
            }
          }
        >
          {data.display_style.font_family.map((d) => {
            return <option
              key={'ff-' + d}
              value={d}
              selected={d == data.display_style.link_font_family_selected}
            >{d}</option>

          })}
        </Form.Select></Col>
      </Row>
    </Form.Group>
    <Row>
      <Col xs={1}>

        <Button
          size="sm"
          variant="success"
          onClick={
            () => {
              add_new_link()
              set_data({ ...data })
            }
          }
        ><FaPlus /></Button>

      </Col>
      <Col xs={10}>
        {dropdownMultiLinks()}
      </Col>

      <Col xs={1}>
        <Button
          size="sm"
          variant="danger"
          onClick={
            () => {
              multi_selected_links.current.forEach(l => delete_link(data, l))
              multi_selected_links.current = []
              set_data({ ...data })
            }
          }
        ><FaMinus /></Button>
      </Col>
    </Row>
    <Row>
      <Col>
        <FormLabel>{t('Flux.src')}</FormLabel>
      </Col>
      <Col>
        <Form.Select disabled={multi_selected_links.current.length != 1} onChange={source_change}>
          {addDropSource()}
        </Form.Select>
      </Col>
    </Row>
    <Row>
      <Col>
        <FormLabel>{t('Flux.trgt')}</FormLabel>
      </Col>
      <Col>
        <Form.Select disabled={multi_selected_links.current.length != 1} onChange={target_change}>
          {addDropCible()}
        </Form.Select>
      </Col>
    </Row>

    <Row>
      <Col>
        <FormLabel>{t('Flux.if')}</FormLabel>
      </Col>
      <Col >
        <Button variant='info'
          onClick={() => {
            const nodes_to_reorganize: SankeyNode[] = []
            multi_selected_links.current.forEach(l => {
              const tmp = l.idSource

              const previous_node_s = data.nodes[l.idSource]
              previous_node_s.outputLinksId.splice(previous_node_s.outputLinksId.indexOf(l.idLink), 1)
              const source_node = data.nodes[l.idTarget]
              l.idSource = source_node.idNode
              source_node.outputLinksId.push(l.idLink)
              nodes_to_reorganize.push(source_node)

              const previous_node_t = data.nodes[l.idTarget]
              previous_node_t.inputLinksId.splice(previous_node_t.inputLinksId.indexOf(l.idLink), 1)
              const target_node = data.nodes[tmp]
              l.idTarget = target_node.idNode
              target_node.inputLinksId.push(l.idLink)
              nodes_to_reorganize.push(target_node)
            })
            nodes_to_reorganize.forEach(n => {
              reorganize_inputLinksId(n, true, true, data.nodes, data.links)
            })
            set_data({ ...data })
          }}><FaArrowsAltH /></Button>
      </Col>
    </Row>

    <Row>
      <Col>
        <FormLabel>{t('Flux.dzf')}</FormLabel>
      </Col>
      <Col >
        {//Boutton pour monter le lien sélctionné
        }
        <ButtonGroup>
          <Button variant='info' disabled={multi_selected_links.current.length != 1}
            onClick={() => {
              multi_selected_links.current.map(l => {
                handleDownLink(l.idLink)
              })


            }}><FaAngleUp /></Button>

          <Button variant='info' disabled={multi_selected_links.current.length != 1}
            onClick={() => {
              multi_selected_links.current.map(l => {
                const i = l.idLink
                const { links } = data
                const listElmt = Object.keys(links)
                const posElemt = listElmt.indexOf(i)
                listElmt.splice(posElemt, 1)
                listElmt.splice(listElmt.length, 0, i)
                const new_cat: { [key: string]: SankeyLink } = {}
                listElmt.forEach(elt => {
                  new_cat[elt] = links[elt]
                })
                for (const member in links) delete links[member]
                Object.assign(links, new_cat)

              })
              set_data({ ...data })


            }}><FaAngleDoubleUp /></Button>


          <Button variant='warning' disabled={multi_selected_links.current.length != 1}
            onClick={() => {
              multi_selected_links.current.map(l => {
                handleUpLink(l.idLink)
              })


            }}><FaAngleDown /></Button>
          {//Boutton pour baisser le lien sélctionné
          }
          <Button variant='warning' disabled={multi_selected_links.current.length != 1}
            onClick={() => {
              multi_selected_links.current.map(l => {
                const i = l.idLink
                const { links } = data
                const listElmt = Object.keys(links)
                const posElemt = listElmt.indexOf(i)
                listElmt.splice(posElemt, 1)
                listElmt.splice(0, 0, i)
                const new_cat: { [key: string]: SankeyLink } = {}
                listElmt.forEach(elt => {
                  new_cat[elt] = links[elt]
                })
                for (const member in links) delete links[member]
                Object.assign(links, new_cat)

              })
              set_data({ ...data })


            }}><FaAngleDoubleDown /></Button>
        </ButtonGroup>
      </Col>
    </Row>

    <Row >
      <Col xs={1}>
        <FormLabel>{t('Flux.style')}:</FormLabel>
      </Col>

      <Col xs={6}>
        <Dropdown>
          <Dropdown.Toggle variant="success" id="dropdown-basic">{style_of_selected_links()}</Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item onClick={() => {
              set_style_to_apply_to_link('')
              multi_selected_links.current.map(n => {
                n.style = ''
              })
              set_data({ ...data })
            }}>{'Aucun'}</Dropdown.Item>
            {Object.keys(data.style_link).map((d,i) => {
              return (<Dropdown.Item key={i} onClick={() => {
                set_style_to_apply_to_link(d)
                multi_selected_links.current.map(n => {
                  n.style = d
                })
                set_data({ ...data })
              }}>{data.style_link[d].idLink}</Dropdown.Item>)

            })}

          </Dropdown.Menu>
        </Dropdown>
      </Col>

      <Col xs={5}>
        <Button
          size="sm"
          variant='info'

          onClick={
            () => {
              apply_style_to_selected_links()
              set_data({ ...data })
            }
          }
        >{t('Flux.as')}</Button>

      </Col>
    </Row>
    { (multi_selected_links.current.length !== 0) ? (
      <Row>
        <Col sm={12}>
          <Tabs defaultActiveKey="flux_data" id="settings-layout">
            <Tab eventKey="flux_data" title={t('Flux.data.données')}>
              <Form >
                {
                //Définition des valeurs selon les paramètre dataTags
                  Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
                    if (Object.keys(dataTag.tags).length != 0) {
                    // console.log(dataTagKey)
                    // console.log(tags_selected)
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
                <Col>
                  <FormLabel style={{color:(!value_selected_parameter().is_percent)?'#555555':'#DADADA'}}>Valeur pour ces paramètres</FormLabel>
                </Col>
                <Col>
                  <Form.Control
                    disabled={value_selected_parameter().is_percent}
                    type='text'
                    value={test_value(value_selected_parameter().value)}
                    onChange={
                      evt => {
                        if(evt.target.value!=='' && !isNaN(+evt.target.value )){
                          const was_empty=test_value(value_selected_parameter().value)===''
                          let val = Object(selected_link.current.value)
                          multi_selected_links.current.map(d => {
                            d.dashed=(was_empty)?false:d.dashed
                            val = d.value
                            Object.values(tags_selected).forEach(tag => {
                              if (val[tag] === undefined) {
                                val[tag] = {}
                              }
                              val = val[tag]
                            })
                            val.value = +evt.target.value

                          })

                          const scale = d3.scaleLinear()
                            .domain([0, data.user_scale])
                            .range([0, 100])
                          if (scale(+evt.target.value) > 500) {
                            data.user_scale = +evt.target.value
                          }
                        }else{

                          let val = Object(selected_link.current.value)
                          multi_selected_links.current.map(d => {
                            val = d.value
                            d.dashed=true
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
                <Row>
                  <Col>
                    <Form.Label>{t('Flux.data.toPrecision')}</Form.Label>
                  </Col>
                  <Col>

                    <FormCheck inline type='switch' checked={isAllLinkToPrecision()} onChange={evt=>{
                      Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => d.to_precision = evt.target.checked)
                      set_data({...data})
                    }}></FormCheck>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      checked={value_selected_parameter().is_percent}
                      label='Valeur proportinnel à la valeur du noeuds source'
                      onChange={evt=>{
                        let val = Object(selected_link.current.value)

                        multi_selected_links.current.map(d => {
                        
                          val = d.value
                          Object.values(tags_selected).forEach(tag => {
                            if (val[tag] === undefined) {
                              val[tag] = {}
                            }
                            val = val[tag]
                          })
                          val.is_percent = evt.target.checked

                        })
                        set_data({...data})
                      }}
                    />
                  </Col>
                </Row>

                <Row >
                  <Col xs={3}>
                    <FormLabel style={{color:(value_selected_parameter().is_percent)?'#555555':'#DADADA'}}>Pourcent</FormLabel>
                  </Col>
                  <Col xs={3}>
                    <FormLabel style={{color:(value_selected_parameter().is_percent)?'#555555':'#DADADA'}}>{value_selected_parameter().percent}</FormLabel>
                  </Col>
                  <Col>
                    <Form.Range
                      disabled={!value_selected_parameter().is_percent}
                      value={value_selected_parameter().percent}
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
                            val.percent = +evt.target.value
                          })
      
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Row>
                <Row >
                  <Col>
                    <FormLabel>{t('Flux.data.affichage')}</FormLabel>
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
            <Tab eventKey="flux_attributes" title={t('Flux.apparence.apparence')}>
              <Form >

                <Form.Group as={Row} >
                  <Col>
                    <FormLabel >{t('Flux.apparence.couleur')}:</FormLabel>
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
                    <FormLabel >{t('Flux.apparence.grad')}:</FormLabel>
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
                    <FormLabel >{t('Flux.apparence.hach')}:</FormLabel>
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
                    <FormLabel>{t('Flux.apparence.of')}:</FormLabel>
                  </Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col sm={3}>
                    <FormCheck
                    
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
                  </Col>
                  <Col sm={3}>

                    <FormCheck
                    
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
                  </Col>
                  <Col sm={3}>

                    <FormCheck
                    
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
                  </Col>
                  <Col sm={3}>
                    <FormCheck
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

                <Form.Group as={Row} >
                  <Col>
                    <FormLabel >{t('Flux.apparence.pdc')}</FormLabel>
                  </Col>
                  <Col>
                 
                    <FormControl
                      min={0} max={1} step={0.01}
                      type={'number'}
                      value={shiftCenter()}
                      disabled={(linkOrientation('hv')||linkOrientation('vh'))}
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
                    <FormLabel >{t('Flux.apparence.eep')}</FormLabel>
                  </Col>
                  <Col>
                  

                    <FormControl
                      min={0} max={0.5} step={0.01}
                      type={'number'}
                      value={shift()}
                      disabled={(linkOrientation('hv')||linkOrientation('vh'))}
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
                    <FormLabel>{t('Flux.apparence.type')}:</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label={t('Flux.apparence.courbe')}
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
                      label={t('Flux.apparence.fleche')}
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
                      label={t('Flux.apparence.recy')}
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
                    <FormLabel >{t('Flux.apparence.courbure')}</FormLabel>
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
              
              </Form>
            </Tab>
            <Tab eventKey="label" title={t('Flux.label.label')}>
              <Form.Group >
                <FormCheck
                  type='switch'
                  label='Visibilité du label'
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
              <Form.Group as={Row} >
                <Col>
                  <FormCheck
                    value='black'
                    disabled={!labelVisibleChecked()}
                    type='radio'
                    label={t('Flux.label.len')}
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
                    disabled={!labelVisibleChecked()}
                    type='radio'
                    label={t('Flux.label.lb')}
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
                    disabled={!labelVisibleChecked()}
                    type='radio'
                    label={t('Flux.label.lec')}
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
              <Form.Group as={Row} >
                <Col xs={4}>
                  <FormLabel style={{color:(labelVisibleChecked())?'#555555':'#DADADA'}} >{t('Noeud.labels.tp')}</FormLabel>
                </Col>
                <Col xs={5}>
                  <FormControl
                    min={11}
                    type={'number'}
                    disabled={!labelVisibleChecked()}
                    value={allNodeLabelFontSize()}
                    onChange={evt => {
                      Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => d.label_font_size = +evt.target.value)
                      set_data({ ...data })
                    }}
                  />
                </Col>
                <Col style={{color:(labelVisibleChecked())?'#555555':'#DADADA'}}>px</Col>
              </Form.Group>
            
              <Form.Group as={Row}>
                <Col>
                  <FormCheck
                    disabled={!labelVisibleChecked()}
                    type='radio'
                    label={t('Flux.label.acf')}
                    // disabled={selected_link.current.label_position === 'frozen'}
                    checked={labelSticktoLinkDisabled()}
                    onClick={()=>{
                      const val=labelSticktoLinkDisabled()
                      Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                        d.label_on_path = !val
                        if(!val){
                          d.label_position=(d.label_position=='frozen')?'middle':d.label_position
                          d.orthogonal_label_position=(d.orthogonal_label_position=='frozen')?'middle':d.orthogonal_label_position
                        }
                      })
                      set_data({ ...data })

                    }

                    }
                  // onChange={
                  //   evt => {
                  //     Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  //       d.label_on_path = evt.target.checked
                  //       d.label_position=(d.label_position=='frozen')?'middle':d.label_position
                  //       d.orthogonal_label_position=(d.orthogonal_label_position=='frozen')?'middle':d.orthogonal_label_position
                  //     })
                  //     set_data({ ...data })
                  //   }
                  // }
                  />
                </Col>
              
              </Form.Group>
              <Form.Group as={Row} >
                <Col>
                  <FormLabel style={{color:(labelVisibleChecked())?'#555555':'#DADADA'}}>{t('Flux.label.pl')}:</FormLabel>
                </Col>
                <Col>
                  <Form.Check
                    value='beginning'
                    disabled={!labelVisibleChecked()}
                    type='radio'
                    label={t('Flux.label.deb')}
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
                    disabled={!labelVisibleChecked()}
                    type='radio'
                    label={t('Noeud.labels.Milieu')}
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
                    disabled={!labelVisibleChecked()}
                    type='radio'
                    label={t('Flux.label.fin')}
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
                  <FormLabel style={{color:(labelVisibleChecked())?'#555555':'#DADADA'}}>{t('Flux.label.po')}:</FormLabel>
                </Col>
                <Col>
                  <Form.Check
                    value='below'
                    disabled={!labelVisibleChecked()}
                    type='radio'
                    label={t('Flux.label.dessous')}
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
                    disabled={!labelVisibleChecked()}
                    type='radio'
                    label={t('Noeud.labels.Milieu')}
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
                    disabled={!labelVisibleChecked()}
                    type='radio'
                    label={t('Flux.label.dessus')}
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
              <Form.Group as={Row}>
                <Col>
                  <FormCheck 
                    disabled={!labelVisibleChecked()}
                    type='checkbox'
                    label={t('Flux.label.pls')}
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
            </Tab>
            {Object.keys(fluxTags).length > 0 ? link_tag : (<></>)}
            <Tab eventKey="flux_tooltip" title={t('Noeud.IB')}>
              <Form >
                <Row>
                  <FormLabel column sm={1}>{t('Noeud.IB')}:</FormLabel>
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
          </Tabs>
        </Col>
      </Row>
    ):(<></>)
    }</>)
}

SankeyMenuConfigurationLinks.propTypes = SankeyMenuConfigurationLinksPropTypes

export default SankeyMenuConfigurationLinks