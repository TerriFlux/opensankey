import React, { FunctionComponent, useState } from 'react'
import { Tabs,  Button, OverlayTrigger, Tooltip, InputGroup } from 'react-bootstrap'
import { SankeyLink, applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from '../types/Types'

import {  DefaultLink, DeleteLink,ReturnValueLink,AssignLinkValueToCorrectVar,ReturnCorrectLinkAttributeValue, AddNewNode } from './SankeyUtils'
import { MultiSelect } from 'react-multi-select-component'
import { selected_type } from './SankeyMenuTop'
import { FaMinus, FaPlus, FaEye, FaEyeSlash } from 'react-icons/fa'
import {MenuConfigurationLinksData} from './SankeyMenuConfigurationLinksData'
import {MenuConfigurationLinksAppearence} from './SankeyMenuConfigurationLinksAppearence'
import {MenuConfigurationLinksTags} from './SankeyMenuConfigurationLinksTags'
import {MenuConfigurationLinksTooltip} from './SankeyMenuConfigurationLinksTooltip'
import {ValueSelectedParameter,NodeVisibleOnsSvg} from './SankeyDrawFunction'

import { t } from 'i18next'
import { GetLinkValueFuncType } from '../types/SankeyUtilsTypes'
import { MenuConfigurationLinksFType } from '../types/SankeyMenuConfigurationLinksTypes'

export const MenuConfigurationLinks : MenuConfigurationLinksFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  additional_data_element:JSX.Element[],
  additional_link_appearence_items:JSX.Element[],
  GetLinkValue:GetLinkValueFuncType,

) => {
  const {data,set_data}=dict_variable_application_data
  const {multi_selected_links}=dict_variable_elements_selected

  const { fluxTags } = data
  const ui : {[s:string] : JSX.Element}= {
    'data'      : MenuConfigurationLinksData(
      dict_variable_application_data,
      dict_variable_elements_selected,
      applicationContext,
      additional_data_element,
      false
    ),
    'appearence': MenuConfigurationLinksAppearence(
      dict_variable_application_data,
      dict_variable_elements_selected,
      applicationContext,
      additional_link_appearence_items,
      false,
      GetLinkValue
    ),
    'tooltip':MenuConfigurationLinksTooltip(data,set_data,multi_selected_links,t)
  }
  const pre_tag_menu=MenuConfigurationLinksTags(
    dict_variable_application_data,
    dict_variable_elements_selected,
    applicationContext
  )
  if (Object.keys(fluxTags).length > 0 && data.accordeonToShow.includes('EF')){
    ui['tags']=pre_tag_menu
  }

  return ui
}

type SankeyMenuConfigurationLinksTypes = {
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  menu_configuration_links : JSX.Element[]
}

const SankeyMenuConfigurationLinks: FunctionComponent<SankeyMenuConfigurationLinksTypes> = (
  { dict_variable_application_data,
    dict_variable_elements_selected,
    applicationContext,
    menu_configuration_links
  }
) => {
  const {t}=applicationContext
  const {data,set_data}=dict_variable_application_data
  const { multi_selected_links,multi_selected_nodes, displayedInputLinkValueRef}=dict_variable_elements_selected
  const { fluxTags, dataTags } = data
  const [tags_group_key, set_tags_group_key] = useState(Object.keys(fluxTags).length > 0 ? Object.keys(fluxTags)[0] : '')

  const { ref_pre_idSource, ref_pre_idTarget } = dict_variable_elements_selected

  const set_show_link = useState(true)[1]
  const node_visible=NodeVisibleOnsSvg()

  if ((tags_group_key == '' && Object.keys(fluxTags).length > 0) || (!Object.keys(fluxTags).includes(tags_group_key) && Object.keys(fluxTags).length > 0)) {
    set_tags_group_key(Object.keys(fluxTags)[0])
  }

  const newEntries = new Map(Object.entries(dataTags).map(([dataTagKey, dataTag]) => {
    return (Object.keys(dataTag.tags).length > 0) ? [
      dataTagKey,
      Object.entries(dataTag.tags).filter(tag => tag[1].selected).length > 0 ? Object.entries(dataTag.tags).filter(tag => tag[1].selected)[0][0] : Object.keys(dataTag.tags)[0]] : ['n', 'n']
  }))

  //Créer un objet contenant la clé de chaque dataTag avec pour valeur la première tag de ces groupe
  let tags_selected = Object.fromEntries(newEntries)

  //supprime les groupe tag qui n'ont pas de tag car on ne peux pas choisir de tags pour affecter une valeur au flux
  delete tags_selected['n']

  // if (Object.keys(tags_selected).length !== Object.keys(dataTagsSelected).length) {
  //   set_tags_selected(dataTagsSelected)
  // }

  const INITIAL_OPTIONS_LINKS = Object.values(data.links).filter(l=>(data.displayed_link_selector)?(node_visible.includes(l.idSource) && node_visible.includes(l.idTarget) ):true).map((d) => { return { 'label': (data.nodes[d.idSource].name + '--->' + data.nodes[d.idTarget].name), 'value': d.idLink } })
  const selected_links = multi_selected_links.current.map((d) => {
    if (data.nodes[d.idSource] == undefined || data.nodes[d.idTarget] == undefined) {
      return
    }
    return { 'label': (data.nodes[d.idSource].name + '--->' + data.nodes[d.idTarget].name), 'value': d.idLink }
  })

  //Renvoie le menue déroulant pour la sélection des flux
  const dropdownMultiLinks = () => {
    const DD = (
      <div id='DD_multi_links'
        style={{width:'70%',zIndex:'3'}}>
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
              dict_variable_elements_selected.ref_display_link_opacity.current.forEach(
                setter=>setter(ReturnValueLink(data,m_s[0],'opacity') as string)
              )
            }

            if(multi_selected_links.current.length>0){
              let new_tags_selected=tags_selected

              if(multi_selected_links.current[0].idLink.includes('_')){
                const index_grp_tag=multi_selected_links.current[0].idLink.split('_')
                // Supprime le première élément du tableau qui ne contient que l'id du flux
                index_grp_tag.shift()
                new_tags_selected={}
                // On fabrique un tags_selected pour récupérer la bonne valeur pour ValueSelectedParameter
                for(const i in index_grp_tag){
                  const key=Object.keys(data.dataTags)[Number(i)]
                  new_tags_selected[key]=Object.keys(Object.values(data.dataTags)[Number(i)].tags)[Number(index_grp_tag[i])]
                }
                tags_selected = new_tags_selected
                displayedInputLinkValueRef.current.forEach(setter=>setter(
                  ValueSelectedParameter(
                    dict_variable_application_data,
                    multi_selected_links,
                    new_tags_selected
                  ).value as string
                ))

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
                tags_selected = (n_t_s)
                displayedInputLinkValueRef.current.forEach(setter=>setter(
                  ValueSelectedParameter(
                    dict_variable_application_data,
                    multi_selected_links,
                    n_t_s
                  ).value as string
                ))
              }else{
                displayedInputLinkValueRef.current.forEach(setter=>setter(
                  ValueSelectedParameter(
                    dict_variable_application_data,
                    multi_selected_links,
                    new_tags_selected
                  ).value as string))
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
      if (Object.keys(nodes).length == 0) {
        AddNewNode(data,()=>null,multi_selected_nodes)
      }
      AddNewNode(data,()=>null,multi_selected_nodes)
    }
    const link: SankeyLink = DefaultLink(data)
    // Méthode pour incrementer idNode
    let idLink = Object.keys(data.links).length
    while (data.links['link'+idLink]) {
      idLink = idLink+1
    }
    link.idLink = 'link' + idLink
    links[link.idLink] = link
    const node_keys = Object.keys(nodes)
    let ids=node_keys[0]
    let idt=node_keys[1]

    if ( ref_pre_idSource.current!=='none' ){
      ids=ref_pre_idSource.current
    }
    if ( ref_pre_idTarget.current !== 'none' ){
      idt = ref_pre_idTarget.current
    }
    
    link.idSource = nodes[ids].idNode
    link.idTarget = nodes[idt].idNode
    if (link.idSource === link.idTarget) {
      AssignLinkValueToCorrectVar(link,'recycling',true,false)

    }

    nodes[ids].outputLinksId.push(link.idLink)
    nodes[idt].inputLinksId.push(link.idLink)

    multi_selected_links.current = [link]
    dict_variable_elements_selected.ref_display_link_opacity.current.forEach(setter=>setter(
      ReturnCorrectLinkAttributeValue(data,link,'opacity',false) as string)
    )
    data.linkZIndex.push(
      link.idLink)
    set_data({ ...data })
    set_show_link(true)
  }

  return (<>
    {/* Ajout d'un flux  */}
    <InputGroup>
      <OverlayTrigger
        key={'Menu.tooltips.flux.plus'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'Menu.tooltips.flux.plus'}>{t('Menu.tooltips.flux.plus')} </Tooltip>}>
        <Button
          size="sm"
          variant="outline-primary"
          style={{width:'10%'}}
          className='btn_menu_config'
          onClick={
            () => {
              add_new_link()
              set_data({ ...data })
            }}>
          <FaPlus/>
        </Button>
      </OverlayTrigger>

      {/* Selection d'un flux  */}
      <OverlayTrigger
        key={'Menu.tooltips.flux.slct'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'Menu.tooltips.flux.slct'}>{t('Menu.tooltips.flux.slct')} </Tooltip>}>
        {dropdownMultiLinks()}
      </OverlayTrigger>
      {/* Suppression d'un flux  */}
      <OverlayTrigger
        key={'Menu.tooltips.flux.rm'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'Menu.tooltips.flux.rm'}>{t('Menu.tooltips.flux.rm')} </Tooltip>}>
        <Button
          size="sm"
          variant="outline-primary"
          className='btn_menu_config'
          style={{width:'10%'}}
          onClick={
            () => {
              multi_selected_links.current.forEach(l => DeleteLink(data, l))
              multi_selected_links.current = []
              set_data({ ...data })
            }}>
          <FaMinus />
        </Button>
      </OverlayTrigger>
      <OverlayTrigger
        key={'menu.tooltips.noeud.4'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'menu.tooltips.noeud.4'}>{t('Menu.tooltips.noeud.dns')} </Tooltip>}>
        <Button
          style={{width:'10%'}}
          size="sm"
          variant={data.displayed_link_selector?'primary':'outline-primary'}
          className='btn_menu_config'
          onClick={
            () => {
              data.displayed_link_selector=!data.displayed_link_selector
              set_data({...data})
            }}>
          {data.displayed_link_selector?<FaEye/>:<FaEyeSlash/>}
        </Button>
      </OverlayTrigger>
    </InputGroup>

    { (multi_selected_links.current.length !== 0) ? (
      <Tabs defaultActiveKey="flux_data" id="settings-layout" fill={true}>
        {menu_configuration_links as unknown as JSX.Element}
      </Tabs>
    ):(<></>)
    }</>)
}

export default SankeyMenuConfigurationLinks

