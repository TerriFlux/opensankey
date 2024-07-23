import React, { FunctionComponent } from 'react'
import { ReactElementLike } from 'prop-types'
import { MultiSelect } from 'react-multi-select-component'
import { FaMinus, FaPlus, FaEye, FaEyeSlash } from 'react-icons/fa'

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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRotate } from '@fortawesome/free-solid-svg-icons'

/*************************************************************************************************/
import {
  SankeyMenuConfigurationLinksTypes
} from './types/SankeyMenuConfigurationLinksTypes'
import {
  OSTooltip
} from './SankeyUtils'

/*************************************************************************************************/
import { Type_MenuSelectionEntry } from '../topmenus/SankeyMenuTop'
import { MenuConfigurationLinksTags } from './SankeyMenuConfigurationLinksTags'
import { MenuConfigurationLinksTooltip } from './SankeyMenuConfigurationLinksTooltip'
import { SankeyWrapperConfigInModalOrMenu } from './SankeyMenuConfigurationNodesAttributes'


/*************************************************************************************************/
const SankeyMenuConfigurationLinks: FunctionComponent<SankeyMenuConfigurationLinksTypes> = (
  {
    applicationData,
    applicationContext,
    menu_config_link_data,
    menu_config_link_attr,
  }
) => {
  // Traduction
  const { t } = applicationContext
  // Old TODO menage
  const { data, new_data } = applicationData
  // Boolean used to force this component to reload
  const [, refreshThis] = useBoolean()
  // Link this menu's update function
  new_data.menu_configuration.ref_to_menu_config_link_updater.current = refreshThis.toggle

  // Links to display in selection menus ------------------------------------------------
  let links, selected_links
  if (data.displayed_link_selector) {
    // All availables links
    links = new_data.drawing_area.sankey.links_list
    selected_links = new_data.drawing_area.selected_links_list
  }
  else {
    // Only visible links
    links = new_data.drawing_area.sankey.visible_links_list
    selected_links = new_data.drawing_area.visible_and_selected_links_list
  }
  const entries_for_links = links.map((d) => { return { 'label': d.name, 'value': d.id } })
  const entries_for_selected_links = selected_links.map((d) => { return { 'label': d.name, 'value': d.id } })

  // Nodes to display in selection menus ------------------------------------------------
  const nodes = new_data.drawing_area.sankey.nodes_list
  const addDropSource = () => {
    if (nodes.length >= 2) {
      return (
        <>
          <option hidden key={'no_target'} value={''}> </option>
          {nodes.map((n, i) => <option key={i} value={n.id}>{n.name}</option>)}
        </>
      )
    }
  }
  const addDropTarget = () => {
    if (nodes.length >= 2) {
      return (
        <>
          <option hidden key={'no_cible'} value={''}> </option>
          {nodes.map((n, i) => <option key={i} value={n.id} >{n.name}</option>)}
        </>
      )
    }
  }

  // Function used to reset menu UI -----------------------------------------------------
  const refreshThisAndToggleSaving = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // Refresh this menu
    refreshThis.toggle()
  }

  const refreshThisAndUpdateRelatedComponents = () => {
    // Update values displayed in menus for link's configuration
    new_data.menu_configuration.updateAllComponentsRelatedToLinksConfig()
    // Update and update saving indicator
    refreshThisAndToggleSaving()
  }

  // Sub-menus --------------------------------------------------------------------------
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
      applicationContext={applicationContext}
      menu_for_modal={false}
    />
  }

  if (
    (new_data.drawing_area.sankey.flux_taggs_list.length > 0) &&
    data.accordeonToShow.includes('EF')
  ) {
    ui['Noeud.tags_node.tags'] = <MenuConfigurationLinksTags
      applicationContext={applicationContext}
      applicationData={applicationData}
      menu_for_modal={false}
    />
  }

  // Selection menu for links -----------------------------------------------------------
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
            valueRenderer={(entries: Type_MenuSelectionEntry[]) => {
              return entries.filter(d => d !== undefined).length ? entries.map(({ label }) => label + ', ') : 'Aucun flux sélectionné'
            }}
            labelledBy='TODO Change'
            options={entries_for_links}
            value={entries_for_selected_links}
            overrideStrings={{
              'selectAll': 'Tout sélectionner',
            }}
            onChange={(entries: Type_MenuSelectionEntry[]) => {
              // Update selection of links
              const entries_values = entries.map(d => d.value)
              links.forEach(link => {
                if (entries_values.includes(link.id)) {
                  new_data.drawing_area.addLinkToSelection(link)
                }
                else {
                  new_data.drawing_area.removeLinkFromSelection(link)
                }
              })
              // Update all link menus
              refreshThisAndUpdateRelatedComponents()
            }}
          />
        </Box>
      </Box>)
    return DD
  }

  // Links upper menu -------------------------------------------------------------------
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
              // Create new link
              const new_link = new_data.drawing_area.addNewDefaultLinkToSankey()
              // Add link to selection
              new_data.drawing_area.addLinkToSelection(new_link)
              // Toogle saving indicator
              refreshThisAndUpdateRelatedComponents()
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
              // Delete all selected links
              applicationData.new_data.drawing_area.deleteSelectedLinks()
              // Toogle saving indicator
              refreshThisAndUpdateRelatedComponents()
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
              // Update UI with only visible links / all links
              data.displayed_link_selector = !data.displayed_link_selector
              // Simple refresh of this menu - No need to save
              refreshThis.toggle()
            }}>
          {new_data.drawing_area.sankey.filter_displayed_link_selector ? <FaEye /> : <FaEyeSlash />}
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
              disabled={selected_links.length == 0}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                const new_source = new_data.drawing_area.sankey.getNode(event.target.value)
                if (new_source !== null) {
                  // Update link's source
                  selected_links.forEach(link => link.source = new_source)
                  // Toogle saving indicator
                  refreshThisAndToggleSaving()
                }
              }}
              value={(selected_links.length > 0) ? selected_links[0].source.id : ''}>
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
              disabled={selected_links.length == 0}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                const new_target = new_data.drawing_area.sankey.getNode(event.target.value)
                if (new_target !== null) {
                  // Update link's target
                  selected_links.forEach(link => link.target = new_target)
                  // Toogle saving indicator
                  refreshThisAndToggleSaving()
                }
              }}
              value={(selected_links.length > 0) ? selected_links[0].target.id : ''}>
              {addDropTarget()}
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
              // Inverse link source & target
              selected_links.forEach(link => link.inverse())
              // Toogle saving indicator
              refreshThisAndToggleSaving()
            }}
          >
            <FontAwesomeIcon style={{ transform: 'rotate(90deg)' }} icon={faRotate} />
          </Button>
        </OSTooltip>
      </Box>
    </Box>

    {
      (selected_links.length !== 0) ?
        <Tabs
          isLazy
        >
          <TabList>
            {
              Object
                .keys(ui)
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
                .values(ui)
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

