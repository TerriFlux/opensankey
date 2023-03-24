import React, { FunctionComponent, useState } from 'react'
import { Row, Form, Col, FormLabel, Tabs,  Button, ButtonGroup, Dropdown,FormGroup,FormCheck } from 'react-bootstrap'
import { reorganize_inputLinksId } from './SankeyLayout'
import { SankeyDataPropTypes, SankeyLink, SankeyLinkPropTypes, SankeyNode,SankeyData } from './types'
import PropTypes, { InferProps } from 'prop-types'
import { cut_name, default_link, delete_link } from './SankeyUtils'
import * as d3 from 'd3'
import { MultiSelect } from 'react-multi-select-component'
import { selected_type } from './SankeyMenu'
import { FaAngleDoubleDown, FaAngleDoubleUp, FaAngleDown, FaAngleUp, FaArrowsAltH, FaMinus, FaPlus } from 'react-icons/fa'
import {SankeyMenuConfigurationLinksData} from './SankeyMenuConfigurationLinksData'
import {SankeyMenuConfigurationLinksAppearence} from './SankeyMenuConfigurationLinksAppearence'
import {SankeyMenuConfigurationLinksLabel} from './SankeyMenuConfigurationLinksLabel'
import {SankeyMenuConfigurationLinksTags} from './SankeyMenuConfigurationLinksTags'
import {SankeyMenuConfigurationLinksTooltip} from './SankeyMenuConfigurationLinksTooltip'
import { TFunction } from 'i18next'

const SankeyMenuConfigurationLinksPropTypes = {
  t: PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  selected_link: PropTypes.shape({current:PropTypes.shape(SankeyLinkPropTypes).isRequired}).isRequired,
  multi_selected_links: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired}).isRequired,
  menu_configuration_links: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
  style_editable:PropTypes.bool.isRequired
}

type SankeyMenuConfigurationLinksTypes = InferProps<typeof SankeyMenuConfigurationLinksPropTypes>
export const OpenSankeyMenuConfigurationLinks = (
  data:SankeyData,
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  selected_link:{current:SankeyLink},
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction,
  tags_group_key:string,
  set_tags_group_key:React.Dispatch<React.SetStateAction<string>>,
  tags_selected:{[k: string]: string},
  set_tags_selected:React.Dispatch<React.SetStateAction<{[k: string]: string}>>,
  additional_data_element:JSX.Element[],
  displayed_value:string,
  set_displayed_value:(s:string)=>void,
  additional_link_appearence_items:JSX.Element[]
) => {
  
  const { fluxTags } = data
  


  const ui : {[s:string] : JSX.Element}= {
    'data'      : SankeyMenuConfigurationLinksData(data,tags_selected,set_tags_selected,selected_link,multi_selected_links,set_data,t,additional_data_element,displayed_value,set_displayed_value),
    'appearence': SankeyMenuConfigurationLinksAppearence(data,selected_link,multi_selected_links,set_data,t,additional_link_appearence_items),
    'label': SankeyMenuConfigurationLinksLabel(data,multi_selected_links,set_data,t),
    'tooltip':SankeyMenuConfigurationLinksTooltip(data,set_data,selected_link,t)
    
  }
  if (Object.keys(fluxTags).length > 0 && data.accordeonToShow.includes('EF')){
    ui['tags']=SankeyMenuConfigurationLinksTags(data,multi_selected_links,set_data,tags_group_key,set_tags_group_key,tags_selected,set_tags_selected,t)
  }
 
  return ui
}
const SankeyMenuConfigurationLinks: FunctionComponent<SankeyMenuConfigurationLinksTypes> = (
  { t,data, set_data, selected_link, multi_selected_links,menu_configuration_links,style_editable}
) => {
  const { fluxTags,dataTags } = data
  const [forceUpdate, setForceUpdate] = useState(false)
  const [style_to_apply_to_link, set_style_to_apply_to_link] = useState('default')
  const [tags_group_key, set_tags_group_key] = useState(Object.keys(fluxTags).length > 0 ? Object.keys(fluxTags)[0] : '')
  
  const set_show_link = useState(true)[1]


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

  //Dépalce la place des flux sélectionnés vers le début dans le tableau de flux de data
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

  //Dépalce la place des flux sélectionnés vers la fin dans le tableau de flux de data
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
    <FormGroup as={Row}>
      <Col xs={10}>
        <FormLabel >{t('Menu.dls')}</FormLabel>        
      </Col>
      <Col xs={2}>
        <FormCheck inline type='switch' checked={data.displayed_link_selector} onChange={evt=>{
          // const c=evt.target.checkeds
          data.displayed_link_selector=evt.target.checked
          set_data({...data})
        }}/>        
      </Col>
    </FormGroup>
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
        {(style_editable)?<Dropdown>
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
        </Dropdown>:<Form.Label>{style_of_selected_links()}</Form.Label>}
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
            {menu_configuration_links}
            
          </Tabs>
        </Col>
      </Row>
    ):(<></>)
    }</>)
}

SankeyMenuConfigurationLinks.propTypes = SankeyMenuConfigurationLinksPropTypes

export default SankeyMenuConfigurationLinks