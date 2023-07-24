import React, { FunctionComponent, useState } from 'react'
import { Row, Form, Col, FormLabel, Tabs,  Button, ButtonGroup, Dropdown, FormGroup, FormCheck, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { reorganize_inputLinksId } from './SankeyLayout'
import { SankeyDataPropTypes, SankeyLink, SankeyLinkPropTypes, SankeyNode,SankeyData } from './types'
import PropTypes, { InferProps } from 'prop-types'
import { cut_name, default_link, delete_link,node_displayed,return_value_link,assign_link_value_to_correct_var,return_correct_link_attribute_value } from './SankeyUtils'
import { MultiSelect } from 'react-multi-select-component'
import { selected_type } from './SankeyMenu'
import { FaAngleDoubleDown, FaAngleDoubleUp, FaAngleDown, FaAngleUp, FaArrowsAltH, FaMinus, FaPlus } from 'react-icons/fa'
import {SankeyMenuConfigurationLinksData} from './SankeyMenuConfigurationLinksData'
import {SankeyMenuConfigurationLinksAppearence} from './SankeyMenuConfigurationLinksAppearence'
import {SankeyMenuConfigurationLinksLabel} from './SankeyMenuConfigurationLinksLabel'
import {SankeyMenuConfigurationLinksTags} from './SankeyMenuConfigurationLinksTags'
import {SankeyMenuConfigurationLinksTooltip} from './SankeyMenuConfigurationLinksTooltip'
import {value_selected_parameter} from './SankeyDrawFunction'

import { TFunction } from 'i18next'

const SankeyMenuConfigurationLinksPropTypes = {
  t: PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  selected_link: PropTypes.shape({current:PropTypes.shape(SankeyLinkPropTypes).isRequired}).isRequired,
  multi_selected_links: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired}).isRequired,
  menu_configuration_links: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
  style_editable:PropTypes.bool.isRequired,
  set_displayed_input_link_value:PropTypes.func.isRequired,
  tags_selected:PropTypes.objectOf(PropTypes.string.isRequired).isRequired,
  set_tags_selected:PropTypes.func.isRequired,
  set_display_link_opacity:PropTypes.func.isRequired,
}

type SankeyMenuConfigurationLinksTypes = InferProps<typeof SankeyMenuConfigurationLinksPropTypes>
export const OpenSankeyMenuConfigurationLinks = (
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  selected_link:{current:SankeyLink},
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction,
  tags_group_key:string,
  set_tags_group_key:React.Dispatch<React.SetStateAction<string>>,
  tags_selected:{[k: string]: string},
  set_tags_selected:React.Dispatch<React.SetStateAction<{[k: string]: string}>>,
  additional_data_element:JSX.Element[],
  displayed_input_link_value:string,
  set_displayed_input_link_value:(s:string)=>void,
  additional_link_appearence_items:JSX.Element[],
  display_link_opacity:string,
  set_display_link_opacity:(s:string)=>void,
) => {
  const { fluxTags } = data
  const ui : {[s:string] : JSX.Element}= {
    'data'      : SankeyMenuConfigurationLinksData(data,tags_selected,set_tags_selected,selected_link,multi_selected_links,set_data,t,additional_data_element,displayed_input_link_value,set_displayed_input_link_value),
    'appearence': SankeyMenuConfigurationLinksAppearence(data,selected_link,multi_selected_links,set_data,t,additional_link_appearence_items,false,'default',display_link_opacity,set_display_link_opacity),
    'label': SankeyMenuConfigurationLinksLabel(data,multi_selected_links,set_data,t,false,'default'),
    'tooltip':SankeyMenuConfigurationLinksTooltip(data,set_data,selected_link,t)
  }

  if (Object.keys(fluxTags).length > 0 && data.accordeonToShow.includes('EF')){
    ui['tags']=SankeyMenuConfigurationLinksTags(data,multi_selected_links,set_data,tags_group_key,set_tags_group_key,tags_selected,set_tags_selected,t)
  }

  return ui
}

const SankeyMenuConfigurationLinks: FunctionComponent<SankeyMenuConfigurationLinksTypes> = (
  { t,data, set_data, selected_link, multi_selected_links,menu_configuration_links,style_editable,set_displayed_input_link_value,tags_selected,set_tags_selected,set_display_link_opacity}
) => {
  const { fluxTags, dataTags } = data
  const [, set_style_to_apply_to_link] = useState('default')
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

  if (Object.keys(tags_selected).length !== Object.keys(dataTagsSelected).length) {
    set_tags_selected(dataTagsSelected)
  }

  const INITIAL_OPTIONS_LINKS = Object.values(data.links).filter(l=>(data.displayed_link_selector)?(node_displayed(data,data.nodes[l.idSource]) && node_displayed(data,data.nodes[l.idTarget]) ):true).map((d) => { return { 'label': (data.nodes[d.idSource].name + '--->' + data.nodes[d.idTarget].name), 'value': d.idLink } })
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
            if(m_s.length>0){
              set_display_link_opacity(return_value_link(data,m_s[0],'opacity'))
            }           

            if(multi_selected_links.current.length>0){
              let new_tags_selected=tags_selected

              if(multi_selected_links.current[0].idLink.includes('_')){
                const index_grp_tag=multi_selected_links.current[0].idLink.split('_')
                // Supprime le première élément du tableau qui ne contient que l'id du flux
                index_grp_tag.shift()
                new_tags_selected={}
                // On fabrique un tags_selected pour récupérer la bonne valeur pour value_selected_parameter
                for(const i in index_grp_tag){
                  const key=Object.keys(data.dataTags)[Number(i)]
                  new_tags_selected[key]=Object.keys(Object.values(data.dataTags)[Number(i)].tags)[Number(index_grp_tag[i])]
                }
                set_tags_selected(new_tags_selected)
                set_displayed_input_link_value(value_selected_parameter(data,multi_selected_links,new_tags_selected).value)

              }else if(Object.values(data.dataTags).length>0){
                // Dans le cas où il n'y a pas de '_' ce qui implique que les datatags sont en mode selection simple
                const tmp=[] as string[]
                Object.values(data.dataTags).forEach(dt=>{
                  tmp.push(Object.entries(dt.tags).filter(t=>t[1].selected)[0][0])
                })
                const n_t_s={} as {[x:string]:string}
                Object.keys(data.dataTags).forEach((dt,i)=>{
                  n_t_s[dt]=tmp[i]
                })
                set_tags_selected(n_t_s)
                set_displayed_input_link_value(value_selected_parameter(data,multi_selected_links,n_t_s).value)
              }else{
                set_displayed_input_link_value(value_selected_parameter(data,multi_selected_links,new_tags_selected).value)
              }
            }
           

            set_data({...data})
          }}
          labelledBy={'hello'}
        />
      </div>)
    return DD
  }



  //Add new link and selection it
  const add_new_link = () => {
    const { nodes, links } = data

    if (Object.keys(nodes).length < 2) {
      return
    }
    const link: SankeyLink = default_link(data)
    // Méthode pour incrementer idNode
    let idLink = Object.keys(data.links).length
    while (data.links['link'+idLink]) {
      idLink = idLink+1
    }
    link.idLink = 'link' + idLink
    links[link.idLink] = link
    const node_keys = Object.keys(nodes)
    link.idSource = nodes[node_keys[0]].idNode
    link.idTarget = nodes[node_keys[1]].idNode
    if (link.idSource === link.idTarget) {
      // link.recycling = true
      assign_link_value_to_correct_var(link,'recycling',true,false)

    }

    nodes[node_keys[0]].outputLinksId.push(link.idLink)
    nodes[node_keys[1]].inputLinksId.push(link.idLink)

    selected_link.current = link
    multi_selected_links.current = [link]
    set_display_link_opacity(return_correct_link_attribute_value(data,link,'opacity',false))
    
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
      assign_link_value_to_correct_var(link,'recycling',true,false)
    }
    source_node.outputLinksId.push(multi_selected_links.current[0].idLink)

    set_data({ ...data })
  }

  const addDropSource = () => {
    if (Object.keys(data.nodes).length >= 2 && Object.keys(data.links).length != 0 && multi_selected_links.current.length != 0) {
      return (
        Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode}>{n.name}</option>)
      )
    }
  }

  const addDropCible = () => {
    if (Object.keys(data.nodes).length >= 2 && Object.keys(data.links).length != 0 && multi_selected_links.current.length != 0) {
      return (
        Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode} >{n.name}</option>)
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
      // link.recycling = true
      assign_link_value_to_correct_var(link,'recycling',true,false)

    }

    target_node.inputLinksId.push(multi_selected_links.current[0].idLink)

    set_data({ ...data })
  }

  const apply_style_to_selected_links = () => {
    multi_selected_links.current.map(d => {
      delete d.local
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
    <FormLabel style={{ justifyContent: 'center', marginBottom: '5px' }} ><b>{t('Flux.pg')}</b></FormLabel>

    {/* Police des labels de flux  */}
    <Form.Group as={Row} >
      <Col xs={4}>
        <FormLabel>{t('Flux.pdl')}</FormLabel>
      </Col>
      <Col xs={8}>
        <Form.Select
          value={data.display_style.link_font_family_selected}
          onChange={
            (evt: React.ChangeEvent<HTMLSelectElement>) => {
              data.display_style.link_font_family_selected = evt.target.value
              set_data({ ...data })
            }}>
          {data.display_style.font_family.map((d) => {
            return <option
              style={{fontFamily:d}}

              key={'ff-' + d}
              value={d}
              // selected={d == data.display_style.link_font_family_selected}
            >{d}</option>
          })}
        </Form.Select>
      </Col>
    </Form.Group>

    <FormLabel style={{ justifyContent: 'center', marginTop: '20px', marginBottom: '5px' }} ><b>{t('Flux.pl')}</b></FormLabel>

    {/* Ajout d'un flux  */}
    <Form.Group as={Row}>
      <Col xs={1}>
        <OverlayTrigger
          key={'Menu.tooltips.flux.plus'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Menu.tooltips.flux.plus'}>{t('Menu.tooltips.flux.plus')} </Tooltip>}>
          <Button
            size="sm"
            variant="success"
            onClick={
              () => {
                add_new_link()
                set_data({ ...data })
              }}>
            <FaPlus/>
          </Button>
        </OverlayTrigger>
      </Col>

      {/* Selection d'un flux  */}
      <Col xs={10}>
        <OverlayTrigger
          key={'Menu.tooltips.flux.slct'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Menu.tooltips.flux.slct'}>{t('Menu.tooltips.flux.slct')} </Tooltip>}>
          {dropdownMultiLinks()}
        </OverlayTrigger>
      </Col>

      {/* Suppression d'un flux  */}
      <Col xs={1}>
        <OverlayTrigger
          key={'Menu.tooltips.flux.rm'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Menu.tooltips.flux.rm'}>{t('Menu.tooltips.flux.rm')} </Tooltip>}>
          <Button
            size="sm"
            variant="danger-right"
            onClick={
              () => {
                multi_selected_links.current.forEach(l => delete_link(data, l))
                multi_selected_links.current = []
                set_data({ ...data })
              }}>
            <FaMinus />
          </Button>
        </OverlayTrigger>
      </Col>
    </Form.Group>

    {/* Checkbox pour n'affihcer que les flux visibles  */}
    <FormGroup as={Row}>
      <Col xs={1}>
        <OverlayTrigger
          key={'Menu.tooltips.flux.dls'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Menu.tooltips.flux.dls'}>{t('Menu.tooltips.flux.dls')} </Tooltip>}>
          <FormCheck
            inline
            type='switch'
            checked={data.displayed_link_selector}
            onChange={evt=>{
              // const c=evt.target.checkeds
              data.displayed_link_selector=evt.target.checked
              set_data({...data})
            }}/>
        </OverlayTrigger>
      </Col>
      <Col xs={11}>
        <FormLabel >{t('Menu.dls')}</FormLabel>
      </Col>
    </FormGroup>

    {/* Choix du point de départ du flux  */}
    <FormGroup as={Row}>
      <Col xs={2}>
        <FormLabel>{t('Flux.src')}</FormLabel>
      </Col>
      <Col xs={10}>
        <OverlayTrigger
          key={'Menu.tooltips.flux.src'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Menu.tooltips.flux.src'}>{t('Flux.tooltips.src')} </Tooltip>}>
          <Form.Select disabled={multi_selected_links.current.length != 1} onChange={source_change} value={(multi_selected_links.current.length>0)?multi_selected_links.current[0].idSource:''}>
            {addDropSource()}
          </Form.Select>
        </OverlayTrigger>
      </Col>
    </FormGroup>

    {/* Choix du point d'arrivée du flux  */}
    <FormGroup as={Row}>
      <Col xs={2}>
        <FormLabel>{t('Flux.trgt')}</FormLabel>
      </Col>
      <Col xs={10}>
        <OverlayTrigger
          key={'Menu.tooltips.flux.trgt'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Menu.tooltips.flux.trgt'}>{t('Flux.tooltips.trgt')} </Tooltip>}>
          <Form.Select disabled={multi_selected_links.current.length != 1} onChange={target_change} value={(multi_selected_links.current.length>0)?multi_selected_links.current[0].idTarget:''}>
            {addDropCible()}
          </Form.Select>
        </OverlayTrigger>
      </Col>
    </FormGroup>

    {/* Inversion du flux  */}
    <FormGroup as={Row}>
      <Col xs={7}>
        <FormLabel>{t('Flux.if')}</FormLabel>
      </Col>
      <Col xs={5}>
        <OverlayTrigger
          key={'Menu.tooltips.flux.if'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Menu.tooltips.flux.if'}>{t('Flux.tooltips.if')} </Tooltip>}>
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
                reorganize_inputLinksId(data,n, true, true, data.nodes, data.links)
              })
              set_data({ ...data })
            }}>
            <FaArrowsAltH/>
          </Button>
        </OverlayTrigger>
      </Col>
    </FormGroup>

    <FormGroup as={Row}>
      <Col xs={7}>
        <FormLabel>{t('Flux.dzf')}</FormLabel>
      </Col>
      <Col xs={5}>
        {/* Boutton pour monter le lien sélctionné */}
        <ButtonGroup>
          <OverlayTrigger
            key={'Menu.tooltips.flux.up'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'Menu.tooltips.flux.up'}>{t('Flux.tooltips.up')} </Tooltip>}>
            <Button variant='info' disabled={multi_selected_links.current.length != 1}
              onClick={() => {
                multi_selected_links.current.map(l => {
                  handleDownLink(data,l.idLink)
                })
                set_data({ ...data })
              }}>
              <FaAngleUp/>
            </Button>
          </OverlayTrigger>

          <OverlayTrigger
            key={'Menu.tooltips.flux.upup'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'Menu.tooltips.flux.upup'}>{t('Flux.tooltips.upup')} </Tooltip>}>
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
              }}>
              <FaAngleDoubleUp />
            </Button>
          </OverlayTrigger>

          {/* Boutton pour baisser le lien sélctionné */}
          <OverlayTrigger
            key={'Menu.tooltips.flux.dwn'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'Menu.tooltips.flux.dwn'}>{t('Flux.tooltips.dwn')} </Tooltip>}>
            <Button variant='warning' disabled={multi_selected_links.current.length != 1}
              onClick={() => {
                multi_selected_links.current.map(l => {
                  handleUpLink(data,l.idLink)
                })
                set_data({ ...data })

              }}>
              <FaAngleDown />
            </Button>
          </OverlayTrigger>

          <OverlayTrigger
            key={'Menu.tooltips.flux.dwndwn'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'Menu.tooltips.flux.dwndwn'}>{t('Flux.tooltips.dwndwn')} </Tooltip>}>
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
              }}>
              <FaAngleDoubleDown />
            </Button>
          </OverlayTrigger>
        </ButtonGroup>
      </Col>
    </FormGroup>

    {/* Appliquer un style par défaut  */}
    <FormGroup as={Row}>
      <Col xs={2}>
        <FormLabel>{t('Flux.style')}:</FormLabel>
      </Col>

      {/* Choxi du style  */}
      <Col xs={5}>
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

      {/* Appliquer le style  */}
      <Col xs={5}>
        <OverlayTrigger
          key={'Menu.tooltips.flux.as'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Menu.tooltips.flux.as'}>{t('Flux.tooltips.as')} </Tooltip>}>
          <Button
            size="sm"
            variant='info'
            onClick={
              () => {
                apply_style_to_selected_links()
                set_data({ ...data })
              }}>
            {t('Flux.as')}
          </Button>
        </OverlayTrigger>
      </Col>
    </FormGroup>

    { (multi_selected_links.current.length !== 0) ? (
      <FormGroup as={Row}>
        <Col xs={12}>
          <Tabs defaultActiveKey="flux_data" id="settings-layout" fill={true}>
            {menu_configuration_links}
          </Tabs>
        </Col>
      </FormGroup>
    ):(<></>)
    }</>)
}

SankeyMenuConfigurationLinks.propTypes = SankeyMenuConfigurationLinksPropTypes

export default SankeyMenuConfigurationLinks


//Dépalce la place des flux sélectionnés vers le début dans le tableau de flux de data
//Permet donc de les déssiner avant
export const handleUpLink = (data:SankeyData,i: string) => {
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
}

//Dépalce la place des flux sélectionnés vers la fin dans le tableau de flux de data
//Permet donc de les déssiner après
export const handleDownLink = (data:SankeyData,i: string) => {
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
}