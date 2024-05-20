import React, { FunctionComponent, MutableRefObject, useState } from 'react'

import {
  Box,
  Button,
  InputGroup,
  InputLeftAddon,
  Select,
  Tab,
  TabList,
  TabPanels,
  Tabs
} from '@chakra-ui/react'
import { ReactElementLike } from 'prop-types'

import {
  ComponentUpdaterType,
  LinkFunctionTypes,
  NodeFunctionTypes,
  SankeyLink,
  SankeyNode,
  applicationContextType,
  contextMenuType,
  dict_hook_ref_setter_show_dialog_componentsType,
  dict_variable_application_dataType,
  dict_variable_elements_selectedType,
  uiElementsRefType
} from '../types/Types'

import {
  DefaultLink,
  DeleteLink,
  ReturnValueLink,
  AssignLinkValueToCorrectVar,
  ReturnCorrectLinkAttributeValue,
  AddNewNode,
  windowSankey,
  OSTooltip
} from './SankeyUtils'

import { MultiSelect } from 'react-multi-select-component'
import { selected_type } from '../topmenus/SankeyMenuTop'
import { FaMinus, FaPlus, FaEye, FaEyeSlash } from 'react-icons/fa'
import { MenuConfigurationLinksTags } from './SankeyMenuConfigurationLinksTags'
import { MenuConfigurationLinksTooltip } from './SankeyMenuConfigurationLinksTooltip'
import { ValueSelectedParameter, NodeVisibleOnsSvg, SelectVisualyLinks, DeselectVisualyLinks } from '../draw/SankeyDrawFunction'

import { MenuConfigurationLinksFType } from './types/SankeyMenuConfigurationLinksTypes'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRotate} from '@fortawesome/free-solid-svg-icons'
import { reorganize_inputLinksId } from '../draw/SankeyDrawLayout'
import { SankeyWrapperConfigInModalOrMenu } from './SankeyMenuConfigurationNodesAttributes'
export const MenuConfigurationLinks : MenuConfigurationLinksFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  menu_config_link_data,
  menu_config_link_attr,
  link_function,
  ComponentUpdater,
  node_function,
) => {
  const {t}=applicationContext
  const {data}=dict_variable_application_data
  const {multi_selected_links}=dict_variable_elements_selected

  const { fluxTags } = data
  const ui : {[s:string] : JSX.Element}= {
    'Flux.data.données': <SankeyWrapperConfigInModalOrMenu
      menu_to_wrap = {menu_config_link_data}
      for_modal = {false}
      idTab={'link_data_tab_id'}
    />,
    'Flux.apparence.apparence':<SankeyWrapperConfigInModalOrMenu
      menu_to_wrap = {menu_config_link_attr}
      for_modal = {false}
      idTab={'link_attr_tab_id'}
    />,
    'Flux.IS': <MenuConfigurationLinksTooltip
      ComponentUpdater={ComponentUpdater}
      multi_selected_links={multi_selected_links}
      t={t}
      menu_for_modal={false}
    />
  }
  const pre_tag_menu=<MenuConfigurationLinksTags
    applicationContext={applicationContext}
    dict_variable_application_data={dict_variable_application_data}
    dict_variable_elements_selected={dict_variable_elements_selected}
    menu_for_modal={false}
    ComponentUpdater={ComponentUpdater}
    node_function={node_function}
    link_function={link_function}
  />
  if (Object.keys(fluxTags).length > 0 && data.accordeonToShow.includes('EF')){
    ui['Noeud.tags_node.tags']=pre_tag_menu
  }

  return ui
}

type SankeyMenuConfigurationLinksTypes = {
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  menu_configuration_links : {[s:string]: JSX.Element},
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  contextMenu:contextMenuType,
  uiElementsRef:uiElementsRefType,
  alt_key_pressed:MutableRefObject<boolean>,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  node_function:NodeFunctionTypes

}

const SankeyMenuConfigurationLinks: FunctionComponent<SankeyMenuConfigurationLinksTypes> = (
  { dict_variable_application_data,
    dict_variable_elements_selected,
    applicationContext,
    menu_configuration_links,
    link_function,
    ComponentUpdater,
    contextMenu,
    uiElementsRef,
    alt_key_pressed,
    dict_hook_ref_setter_show_dialog_components,
    node_function
  }
) => {
  const {t}=applicationContext
  const {data,set_data}=dict_variable_application_data
  const { multi_selected_links,multi_selected_nodes, displayedInputLinkValueSetterRef}=dict_variable_elements_selected
  const { fluxTags, dataTags } = data
  const [tags_group_key, set_tags_group_key] = useState(Object.keys(fluxTags).length > 0 ? Object.keys(fluxTags)[0] : '')
  const [pre_idSource,set_pre_idSource]=useState('none')
  const [pre_idTarget,set_pre_idTarget]=useState('none')
  dict_variable_elements_selected.ref_pre_idSource.current = pre_idSource
  dict_variable_elements_selected.ref_pre_idTarget.current = pre_idTarget
  const { ref_pre_idSource, ref_pre_idTarget } = dict_variable_elements_selected
  const {updateComponentMenuConfigLink,updateMenuConfigTextLinkTooltip}=ComponentUpdater
  const {RedrawNodes}=node_function
  const set_show_link = useState(true)[1]
  const node_visible=NodeVisibleOnsSvg()
  const [forceUpdate,setForceUpdate]=useState(false)
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

  const INITIAL_OPTIONS_LINKS = Object.values(data.links).filter(l=>(data.displayed_link_selector)?(node_visible.includes(l.idSource) && node_visible.includes(l.idTarget) ):true).map((d) => { return { 'label': (data.nodes[d.idSource].name + '--->' + data.nodes[d.idTarget].name), 'value': d.idLink } })
  const selected_links = multi_selected_links.current.map((d) => {
    if (data.nodes[d.idSource] == undefined || data.nodes[d.idTarget] == undefined) {
      return
    }
    return { 'label': (data.nodes[d.idSource].name + '--->' + data.nodes[d.idTarget].name), 'value': d.idLink }
  }) as []

  //Renvoie le menue déroulant pour la sélection des flux
  const dropdownMultiLinks = () => {
    const DD = (
      <Box
        layerStyle='submenuconfig_droplist'
      >
        {/* Position custom pour MultiSelect */}
        <Box
          height='2rem'
          width='14.75rem'
        >
          <MultiSelect
            valueRenderer={ (selected :selected_type[]) => {
              return selected.filter(d=>d!==undefined).length ? selected.map( ({label}) => label + ', ') : 'Aucun flux sélectionné'
            }}
            labelledBy='TODO Change'
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
                  displayedInputLinkValueSetterRef.current.forEach(setter=>setter(
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
                  displayedInputLinkValueSetterRef.current.forEach(setter=>setter(
                    ValueSelectedParameter(
                      dict_variable_application_data,
                      multi_selected_links,
                      n_t_s
                    ).value as string
                  ))
                }else{
                  displayedInputLinkValueSetterRef.current.forEach(setter=>setter(
                    ValueSelectedParameter(
                      dict_variable_application_data,
                      multi_selected_links,
                      new_tags_selected
                    ).value as string))
                }
              }
              Object.values(dict_variable_application_data.display_links).forEach(l=>DeselectVisualyLinks(l))
              multi_selected_links.current.forEach(l=>SelectVisualyLinks(l))
              updateComponentMenuConfigLink.current()
              updateMenuConfigTextLinkTooltip.current.forEach(f=>f())

            }}
          />
        </Box>
      </Box>)
    return DD
  }

  //Add new link and selection it
  const add_new_link = () => {
    const { nodes, links } = data

    if (Object.keys(nodes).length < 2) {
      if (Object.keys(nodes).length == 0) {
        AddNewNode(dict_variable_application_data,multi_selected_nodes,node_function)
      }
      AddNewNode(dict_variable_application_data,multi_selected_nodes,node_function)
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
    data.linkZIndex.push(link.idLink)
    ComponentUpdater.updateComponenSaveInCache.current(false)
    set_data({ ...data })
    set_show_link(true)
  }


  //Change the source of selected link
  const source_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    if(multi_selected_links.current.length>0){
      const link = multi_selected_links.current[0]
      //Causait un problème d'acumulation de la valeur de des differents link sur des noeuds non associé
      const previous_node = data.nodes[link.idSource]
      previous_node.outputLinksId.splice(previous_node.outputLinksId.indexOf(link.idLink), 1)

      const source_node = data.nodes[changeEvent.target.value]
      link.idSource = source_node.idNode
      if (link.idSource === link.idTarget) {
        AssignLinkValueToCorrectVar(link,'recycling',true,false)
      }
      source_node.outputLinksId.push(link.idLink)

      // Create a variable containing all links to update
      let link_to_update=[]
      link_to_update.push(link)
      link_to_update=link_to_update.concat(previous_node.outputLinksId.map(lid=>data.links[lid]))
      link_to_update=link_to_update.concat(previous_node.inputLinksId.map(lid=>data.links[lid]))
      link_to_update=link_to_update.concat(source_node.outputLinksId.map(lid=>data.links[lid]))
      link_to_update=link_to_update.concat(source_node.inputLinksId.map(lid=>data.links[lid]))

      RedrawNodes([source_node,previous_node])
      link_function.RedrawLinks(link_to_update)
      ComponentUpdater.updateComponenSaveInCache.current(false)

    } else if(Object.keys(data.nodes).length>1){
      set_pre_idSource(changeEvent.target.value)
    }
    setForceUpdate(!forceUpdate)
  }

  const addDropSource = () => {
    if (Object.keys(data.nodes).length >= 2) {
      return (<>
        <option hidden key={'no_target'} value={''}> </option>
        {Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode}>{n.name}</option>)}
      </>
      )
    }
  }

  const addDropCible = () => {
    if (Object.keys(data.nodes).length >= 2) {
      return (<>
        <option hidden key={'no_cible'} value={''}> </option>
        {Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode} >{n.name}</option>)}
      </>
      )
    }
  }

  //Change the target of selected link
  const target_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    if(multi_selected_links.current.length>0){
      const { nodes } = data
      const link = multi_selected_links.current[0]
      const previous_node = nodes[link.idTarget]
      previous_node.inputLinksId.splice(previous_node.inputLinksId.indexOf(multi_selected_links.current[0].idLink), 1)

      const target_node = nodes[changeEvent.target.value]
      link.idTarget = target_node.idNode
      if (link.idSource === link.idTarget) {
        AssignLinkValueToCorrectVar(link,'recycling',true,false)

      }
      target_node.inputLinksId.push(multi_selected_links.current[0].idLink)



      // Create a variable containing all links to update
      let link_to_update=[]
      link_to_update.push(link)
      link_to_update=link_to_update.concat(previous_node.outputLinksId.map(lid=>data.links[lid]))
      link_to_update=link_to_update.concat(previous_node.inputLinksId.map(lid=>data.links[lid]))
      link_to_update=link_to_update.concat(target_node.outputLinksId.map(lid=>data.links[lid]))
      link_to_update=link_to_update.concat(target_node.inputLinksId.map(lid=>data.links[lid]))

      RedrawNodes([target_node,previous_node])
      link_function.RedrawLinks(link_to_update)
      ComponentUpdater.updateComponenSaveInCache.current(false)

    }else if(Object.keys(data.nodes).length>1){
      set_pre_idTarget(changeEvent.target.value)
    }
    setForceUpdate(!forceUpdate)

  }

  return (<Box layerStyle='menuconfigpanel_grid'>
    <Box
      as='span'
      layerStyle='menuconfigpanel_row_droplist'
    >
      {/* Ajout d'un flux  */}
      <OSTooltip
        label={t('Menu.tooltips.flux.plus')}>
        <Button
          variant='menuconfigpanel_add_button'
          onClick={
            () => {
              add_new_link()
              link_function.DrawAllLinks(contextMenu,dict_variable_application_data,uiElementsRef,dict_variable_elements_selected,applicationContext,alt_key_pressed,(windowSankey.SankeyToolsStatic ? windowSankey.SankeyToolsStatic : false) ? 'relative' : 'absolute',link_function,ComponentUpdater,dict_hook_ref_setter_show_dialog_components)
            }}>
          <FaPlus/>
        </Button>
      </OSTooltip>

      {/* Selection d'un flux  */}
      <OSTooltip label={t('Menu.tooltips.flux.slct')}>
        {dropdownMultiLinks()}
      </OSTooltip>

      {/* Suppression d'un flux  */}
      <OSTooltip label={t('Menu.tooltips.flux.rm')}>
        <Button
          variant='menuconfigpanel_del_button'
          onClick={
            () => {
              multi_selected_links.current.forEach(l => DeleteLink(data, l))
              multi_selected_links.current = []
              set_data({ ...data })
            }}>
          <FaMinus />
        </Button>
      </OSTooltip>

      {/* Activer / Désactiver selection uniquement des flux actuellement visibles */}
      <OSTooltip label={t('Menu.tooltips.noeud.dns')}>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={
            () => {
              data.displayed_link_selector=!data.displayed_link_selector
              setForceUpdate(!forceUpdate)
            }}>
          {data.displayed_link_selector?<FaEye/>:<FaEyeSlash/>}
        </Button>
      </OSTooltip>
    </Box>

    <Box
      display='grid'
      gridTemplateColumns='9fr 1fr'
      gridTemplateRows='1fr 1fr'
      gridColumnGap='0.25rem'
      gridRowGap='0.25rem'
      height='4.25rem'
    >
      <Box
        display='grid'
        gridTemplateColumns='1fr'
        gridTemplateRows='1fr 1fr'
        gridRowGap='0.25rem'
      >
        {/* Choix du point de départ du flux  */}
        <OSTooltip label={t('Flux.tooltips.src')}>
          <InputGroup variant='menuconfigpanel_option_input' >
            <InputLeftAddon width='5rem' >
              {t('Flux.src')}
            </InputLeftAddon>
            <Select
              variant='select_custom_style'
              disabled={multi_selected_links.current.length==0}
              onChange={source_change}
              value={(multi_selected_links.current.length>0)?multi_selected_links.current[0].idSource:''}>
              {addDropSource()}
            </Select>
          </InputGroup>
        </OSTooltip>

        {/* Choix du point d'arrivée du flux  */}
        <OSTooltip label={t('Flux.tooltips.trgt')}>
          <InputGroup
            variant='menuconfigpanel_option_input'
          >
            <InputLeftAddon
              width='5rem'
            >
              {t('Flux.trgt')}
            </InputLeftAddon>
            <Select
              variant='select_custom_style'
              disabled={multi_selected_links.current.length==0}
              onChange={target_change}
              value={(multi_selected_links.current.length>0)?multi_selected_links.current[0].idTarget:''}>
              {addDropCible()}
            </Select>
          </InputGroup>
        </OSTooltip>
      </Box>

      {/* Bouton d'inversions du flux : cible <-> source */}
      <Box>
        <OSTooltip label={t('Flux.tooltips.inv')}>
          <Button
            height='100%'
            onClick={()=>{
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

              node_function.RedrawNodes(nodes_to_reorganize)
              link_function.RedrawLinks(multi_selected_links.current)
              ComponentUpdater.updateComponenSaveInCache.current(false)
              setForceUpdate(!forceUpdate)
            }}
          >
            <FontAwesomeIcon style={{transform:'rotate(90deg)'}} icon={faRotate}/>
          </Button>
        </OSTooltip>
      </Box>
    </Box>

    {
      (multi_selected_links.current.length !== 0) ?
        <Tabs
          isLazy
        >
          <TabList>
            {
              Object
                .keys(menu_configuration_links)
                .map((key) => {
                  return <Tab> 
                    <Box layerStyle='submenuconfig_tab' >
                      {t(key)}
                    </Box>
                  </Tab>
                }
                )
            }
          </TabList>
          <TabPanels>
            {
              Object
                .values(menu_configuration_links)
                .map((c: ReactElementLike) => {
                  return c
                }
                )
            }
          </TabPanels>
        </Tabs>:
        <></>
    }
  </Box>)
}

export default SankeyMenuConfigurationLinks

