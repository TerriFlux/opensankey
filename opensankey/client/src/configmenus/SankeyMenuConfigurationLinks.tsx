import React, { FunctionComponent, useState } from 'react'

import {
  Box,
  Button,
  InputGroup,
  InputLeftAddon,
  Select,
  Tab,
  TabList,
  TabPanels,
  Tabs,
  useBoolean
} from '@chakra-ui/react'
import { ReactElementLike } from 'prop-types'

import {
  SankeyLink,
  SankeyNode,
  applicationContextType,
  applicationDataType,
  applicationStateType
} from '../types/Types'
import { SankeyMenuConfigurationLinksTypes } from './types/SankeyMenuConfigurationLinksTypes'
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
import { faRotate } from '@fortawesome/free-solid-svg-icons'
import { reorganize_inputLinksId } from '../draw/SankeyDrawLayout'
import { SankeyWrapperConfigInModalOrMenu } from './SankeyMenuConfigurationNodesAttributes'
import { Class_LinkElement } from '../types/Link'
export const MenuConfigurationLinks: MenuConfigurationLinksFType = (
  applicationData: applicationDataType,
  applicationState: applicationStateType,
  applicationContext: applicationContextType,
  menu_config_link_data,
  menu_config_link_attr,
  link_function,
  ComponentUpdater,
  node_function,
) => {
  const { t } = applicationContext
  const { data } = applicationData
  const { multi_selected_links } = applicationState

  const { fluxTags } = data
  const ui: { [s: string]: JSX.Element } = {
    'Flux.data.données': <SankeyWrapperConfigInModalOrMenu
      menu_to_wrap={menu_config_link_data}
      for_modal={false}
      idTab={'link_data_tab_id'}
    />,
    'Flux.apparence.apparence': <SankeyWrapperConfigInModalOrMenu
      menu_to_wrap={menu_config_link_attr}
      for_modal={false}
      idTab={'link_attr_tab_id'}
    />,
    'Flux.IS': <MenuConfigurationLinksTooltip
      applicationData={applicationData}
      ComponentUpdater={ComponentUpdater}
      multi_selected_links={multi_selected_links}
      t={t}
      menu_for_modal={false}
    />
  }
  const pre_tag_menu = <MenuConfigurationLinksTags
    applicationContext={applicationContext}
    applicationData={applicationData}
    applicationState={applicationState}
    menu_for_modal={false}
    ComponentUpdater={ComponentUpdater}
    node_function={node_function}
    link_function={link_function}
  />
  if (Object.keys(fluxTags).length > 0 && data.accordeonToShow.includes('EF')) {
    ui['Noeud.tags_node.tags'] = pre_tag_menu
  }

  return ui
}



const SankeyMenuConfigurationLinks: FunctionComponent<SankeyMenuConfigurationLinksTypes> = (
  { applicationData,
    applicationState,
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
  const { data, set_data, new_data } = applicationData

  const [, setForceUpdate] = useBoolean()
  new_data.menu_configuration.updateComponentMenuConfigLink.current = setForceUpdate.toggle
  const { t } = applicationContext
  const { multi_selected_links, multi_selected_nodes, displayedInputLinkValueSetterRef } = applicationState
  const { fluxTags, dataTags } = data
  const [tags_group_key, set_tags_group_key] = useState(Object.keys(fluxTags).length > 0 ? Object.keys(fluxTags)[0] : '')
  const [pre_idSource, set_pre_idSource] = useState('none')
  const [pre_idTarget, set_pre_idTarget] = useState('none')
  applicationState.ref_pre_idSource.current = pre_idSource
  applicationState.ref_pre_idTarget.current = pre_idTarget
  const { ref_pre_idSource, ref_pre_idTarget } = applicationState
  const { RedrawNodes } = node_function
  const set_show_link = useState(true)[1]
  const node_visible = NodeVisibleOnsSvg()

  if ((tags_group_key == '' && Object.keys(fluxTags).length > 0) || (!Object.keys(fluxTags).includes(tags_group_key) && Object.keys(fluxTags).length > 0)) {
    set_tags_group_key(Object.keys(fluxTags)[0])
  }

  const newEntries = new Map(Object.entries(dataTags).map(([dataTagKey, dataTag]) => {
    return (Object.keys(dataTag.tags).length > 0) ? [
      dataTagKey,
      Object.entries(dataTag.tags).filter(tag => tag[1].selected).length > 0 ? Object.entries(dataTag.tags).filter(tag => tag[1].selected)[0][0] : Object.keys(dataTag.tags)[0]] : ['n', 'n']
  }))

  //Créer un objet contenant la clé de chaque dataTag avec pour valeur la première tag de ces groupe
  const tags_selected = Object.fromEntries(newEntries)

  //supprime les groupe tag qui n'ont pas de tag car on ne peux pas choisir de tags pour affecter une valeur au flux
  delete tags_selected['n']

  const list_nodes = new_data.drawing_area.sankey.nodes_list
  const list_links = new_data.drawing_area.sankey.links_list
  const list_links_selected = new_data.drawing_area.selected_links_list

  // const INITIAL_OPTIONS_LINKS = Object.values(data.links).filter(l=>(data.displayed_link_selector)?(node_visible.includes(l.idSource) && node_visible.includes(l.idTarget) ):true).map((d) => { return { 'label': (data.nodes[d.idSource].name + '--->' + data.nodes[d.idTarget].name), 'value': d.idLink } })
  const INITIAL_OPTIONS_LINKS = list_links.map((d) => { return { 'label': (d.source.name + '--->' + d.target.name), 'value': d.id } })
  const selected_links = list_links_selected.map((d) => { return { 'label': (d.source.name + '--->' + d.target.name), 'value': d.id } })

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
            valueRenderer={(selected: selected_type[]) => {
              return selected.filter(d => d !== undefined).length ? selected.map(({ label }) => label + ', ') : 'Aucun flux sélectionné'
            }}
            labelledBy='TODO Change'
            options={INITIAL_OPTIONS_LINKS}
            value={selected_links}
            overrideStrings={{
              'selectAll': 'Tout sélectionner',
            }}
            onChange={(selected: [{ label: string, value: string }]) => {
              const new_sel = selected.map(d => d.value)
              list_links.forEach(link => {
                if (new_sel.includes(link.id)) {
                  new_data.drawing_area.addLinkToSelection(link)
                } else {
                  new_data.drawing_area.removeLinkFromSelection(link)
                }
              })

              setForceUpdate.toggle()
              new_data.menu_configuration.updateMenuConfigTextLinkTooltip.current.forEach(f => f())


            }}
          />
        </Box>
      </Box>)
    return DD
  }

  //Add new link and selection it
  const add_new_link = () => {
    // const { nodes, links } = data

    // if (Object.keys(nodes).length < 2) {
    //   if (Object.keys(nodes).length == 0) {
    //     AddNewNode(applicationData, multi_selected_nodes, node_function)
    //   }
    //   AddNewNode(applicationData, multi_selected_nodes, node_function)
    // }
    // const link: SankeyLink = DefaultLink(data)
    // // Méthode pour incrementer idNode
    // let idLink = Object.keys(data.links).length
    // while (data.links['link' + idLink]) {
    //   idLink = idLink + 1
    // }
    // link.idLink = 'link' + idLink
    // links[link.idLink] = link
    // const node_keys = Object.keys(nodes)
    // let ids = node_keys[0]
    // let idt = node_keys[1]

    // if (ref_pre_idSource.current !== 'none') {
    //   ids = ref_pre_idSource.current
    // }
    // if (ref_pre_idTarget.current !== 'none') {
    //   idt = ref_pre_idTarget.current
    // }

    // link.idSource = nodes[ids].idNode
    // link.idTarget = nodes[idt].idNode
    // if (link.idSource === link.idTarget) {
    //   AssignLinkValueToCorrectVar(link, 'recycling', true, false)

    // }

    // nodes[ids].outputLinksId.push(link.idLink)
    // nodes[idt].inputLinksId.push(link.idLink)

    // multi_selected_links.current = [link]
    // applicationState.ref_display_link_opacity.current.forEach(setter => setter(
    //   ReturnCorrectLinkAttributeValue(data, link, 'opacity', false) as string)
    // )
    // data.linkZIndex.push(link.idLink)
    // ComponentUpdater.updateComponenSaveInCache.current(false)
    // set_data({ ...data })
    // set_show_link(true)
    const node_src = new_data.drawing_area.addNewDefaultNodeToSankey()
    node_src.name = 'Unknown source'
    // Set position
    node_src.setPosXY(50, 50)
    new_data.drawing_area.addNodeToSelection(node_src)
    node_src.reset()

    const node_trgt = new_data.drawing_area.addNewDefaultNodeToSankey()
    node_src.name = 'Unknown target'
    // Set position
    node_trgt.setPosXY(150, 150)
    new_data.drawing_area.addNodeToSelection(node_trgt)
    node_trgt.reset()


    const n_link=new Class_LinkElement(node_src,node_trgt,new_data.drawing_area,new_data.menu_configuration)
    new_data.drawing_area.sankey.addLink(n_link)
    new_data.drawing_area.addLinkToSelection(n_link)
    console.log(n_link)
    n_link.reset()
    setForceUpdate.toggle()
    ComponentUpdater.updateComponenSaveInCache.current(false)

  }


  //Change the source of selected link
  const source_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    if (list_links_selected.length > 0) {
      const nodes = new_data.drawing_area.sankey.nodes_dict
      const link = list_links_selected[0]

      //Causait un problème d'acumulation de la valeur de des differents link sur des noeuds non associé
      const previous_node = link.source
      previous_node.output_links_list.splice(previous_node.output_links_list.indexOf(link), 1)

      const source_node = nodes[changeEvent.target.value]
      link.source = source_node
      if (link.source === link.target) {
        // TODO : when a version of AssignLinkValueToCorrectVar is implemented
        // with the class system then use it here

        // AssignLinkValueToCorrectVar(link,'recycling',true,false)
      }
      source_node.output_links_list.push(link)

      // Create a variable containing all links to update
      let link_to_update = []
      link_to_update.push(link)
      link_to_update = link_to_update.concat(previous_node.output_links_list.map(lid => lid))
      link_to_update = link_to_update.concat(previous_node.input_links_list.map(lid => lid))
      link_to_update = link_to_update.concat(source_node.output_links_list.map(lid => lid))
      link_to_update = link_to_update.concat(source_node.input_links_list.map(lid => lid))

      // RedrawNodes([source_node, previous_node])
      source_node.reset()
      previous_node.reset()
      // link_function.RedrawLinks(link_to_update)
      link_to_update.forEach(l=>l.reset())
      ComponentUpdater.updateComponenSaveInCache.current(false)

    } else if (list_nodes.length > 1) {
      set_pre_idSource(changeEvent.target.value)
    }
    setForceUpdate.toggle()
  }

  const addDropSource = () => {
    if (list_nodes.length >= 2) {
      return (<>
        <option hidden key={'no_target'} value={''}> </option>
        {list_nodes.map((n, i) => <option key={i} value={n.id}>{n.name}</option>)}
      </>
      )
    }
  }

  const addDropCible = () => {
    if (list_nodes.length >= 2) {
      return (<>
        <option hidden key={'no_cible'} value={''}> </option>
        {list_nodes.map((n, i) => <option key={i} value={n.id} >{n.name}</option>)}
      </>
      )
    }
  }

  //Change the target of selected link
  const target_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    if (list_links_selected.length > 0) {
      const nodes = new_data.drawing_area.sankey.nodes_dict
      const link = list_links_selected[0]
      const previous_node = nodes[link.id]
      previous_node.input_links_list.splice(previous_node.input_links_list.indexOf(list_links_selected[0]), 1)

      const target_node = nodes[changeEvent.target.value]
      link.target = target_node
      if (link.source === link.target) {
        // TODO : when a version of AssignLinkValueToCorrectVar is implemented
        // with the class system then use it here

        // AssignLinkValueToCorrectVar(link,'recycling',true,false)
      }
      target_node.input_links_list.push(list_links_selected[0])



      // Create a variable containing all links to update
      let link_to_update = []
      link_to_update.push(link)
      link_to_update = link_to_update.concat(previous_node.output_links_list.map(lid => lid))
      link_to_update = link_to_update.concat(previous_node.input_links_list.map(lid => lid))
      link_to_update = link_to_update.concat(target_node.output_links_list.map(lid => lid))
      link_to_update = link_to_update.concat(target_node.input_links_list.map(lid => lid))

      // RedrawNodes([target_node,previous_node])
      previous_node.reset()
      target_node.reset()

      // link_function.RedrawLinks(link_to_update)
      link_to_update.forEach(l => l.reset())
      ComponentUpdater.updateComponenSaveInCache.current(false)

    } else if (Object.keys(data.nodes).length > 1) {
      set_pre_idTarget(changeEvent.target.value)
    }
    setForceUpdate.toggle()

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
              // new_data.drawing_area.createNewLinkAndNewNodes()
              add_new_link()
              // link_function.DrawAllLinks(contextMenu, applicationData, uiElementsRef, applicationState, applicationContext, alt_key_pressed, (windowSankey.SankeyToolsStatic ? windowSankey.SankeyToolsStatic : false) ? 'relative' : 'absolute', link_function, ComponentUpdater, dict_hook_ref_setter_show_dialog_components)
            }}>
          <FaPlus />
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
              data.displayed_link_selector = !data.displayed_link_selector
              setForceUpdate.toggle()
            }}>
          {data.displayed_link_selector ? <FaEye /> : <FaEyeSlash />}
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
              disabled={list_links_selected.length == 0}
              onChange={source_change}
              value={(list_links_selected.length > 0) ? list_links_selected[0].source.id : ''}>
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
              disabled={list_links_selected.length == 0}
              onChange={target_change}
              value={(list_links_selected.length > 0) ? list_links_selected[0].target.id : ''}>
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
                reorganize_inputLinksId(data, n, true, true, data.nodes, data.links)
              })

              node_function.RedrawNodes(nodes_to_reorganize)
              link_function.RedrawLinks(multi_selected_links.current)
              ComponentUpdater.updateComponenSaveInCache.current(false)
              setForceUpdate.toggle()
            }}
          >
            <FontAwesomeIcon style={{ transform: 'rotate(90deg)' }} icon={faRotate} />
          </Button>
        </OSTooltip>
      </Box>
    </Box>

    {
      (list_links_selected.length !== 0) ?
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
        </Tabs> :
        <></>
    }
  </Box>)
}

export default SankeyMenuConfigurationLinks

