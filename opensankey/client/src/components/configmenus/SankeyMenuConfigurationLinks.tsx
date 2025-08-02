// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import React, { FC, useState } from 'react'

import {
  Box,
  Button,
  InputGroup,
  InputLeftAddon,
  Select,
} from '@chakra-ui/react'

import {
  OSTooltip
} from '../../types/Utils'


/*************************************************************************************************/
import { OSMultiSelect, typeElementSelectable } from './SankeyMenuComponents'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_NodeElement } from '../../Elements/Node'
import { BaseApplicationDataType } from '../SankeyMenuTypes'


/*************************************************************************************************/
export const SankeyLinkSelection: FC<BaseApplicationDataType> = (
  {
    new_data,
  }
) => {

  // Data -------------------------------------------------------------------------------

  // Traduction
  const { t, icon_library } = new_data
  const { icon_add_element, icon_remove_element, icon_repeat, icon_element_visible, icon_element_invisible } = icon_library
  // Links to display in selection menus ------------------------------------------------

  let links: Class_LinkElement[]
  let selected_links: Class_LinkElement[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_links) {
    // All availables links
    links = new_data.drawing_area.sankey.links_list
    selected_links = new_data.drawing_area.selected_links_list
  }
  else {
    // Only visible links
    links = new_data.drawing_area.sankey.visible_links_list
    selected_links = new_data.drawing_area.visible_and_selected_links_list
  }
  const entries_for_links = links.map((d) => { return { 'label': d.name, 'value': d.id, selected: selected_links.includes(d) } })

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

  // Components updaters ----------------------------------------------------------------

  // Boolean used to force this component to reload
  const [, setCount] = useState(0)
  // Link this menu's update function
  new_data.menu_configuration.ref_to_menu_config_links_selection_updater.current = () => setCount(a => a + 1)

  // Function used to reset menu UI -----------------------------------------------------

  const refreshThisAndToggleSaving = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // Refresh this menu
    setCount(a => a + 1)
  }

  const refreshThisAndUpdateRelatedComponents = () => {
    // Update values displayed in menus for link's configuration
    new_data.menu_configuration.updateAllComponentsRelatedToLinksConfig()
    // Update and update saving indicator
    refreshThisAndToggleSaving()
  }

  // Sub-menus --------------------------------------------------------------------------

  /**
   * Create new link
   *
   */
  const addLinkConfig = () => {
    const sankey = new_data.drawing_area.sankey
    const nodeToDel: { list: Class_NodeElement[] } = { list: [] }
    let presentNode = 0
    const _addLinkConfig = () => {
      presentNode = sankey.nodes_list.length
      const new_link = new_data.drawing_area.addNewDefaultLinkToSankey()
      //Deselect previously selected links
      new_data.drawing_area.purgeSelectionOfLinks()
      // Add link to selection
      new_data.drawing_area.addLinkToSelection(new_link)

      if (presentNode == 0) {
        nodeToDel.list.push(sankey.nodes_list[0])
        nodeToDel.list.push(sankey.nodes_list[1])
      }
      else if (presentNode == 1) {
        nodeToDel.list.push(sankey.nodes_list[1])
      }
      // Toogle saving indicator
      refreshThisAndUpdateRelatedComponents()
    }

    const inv_addLinkConfig = () => {
      nodeToDel.list.forEach(n => sankey.drawing_area.deleteNode(n))
      if (presentNode > 1)
        new_data.drawing_area.deleteLink(new_data.drawing_area.sankey.links_list[new_data.drawing_area.sankey.links_list.length - 1])
      // Toogle saving indicator
      refreshThisAndUpdateRelatedComponents()
    }

    new_data.history.saveUndo(inv_addLinkConfig)
    new_data.history.saveRedo(_addLinkConfig)
    _addLinkConfig()
  }

  // Selection menu for links -----------------------------------------------------------



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
          size='sizeConfigButton'
          onClick={addLinkConfig}>
          {icon_add_element}
        </Button>
      </OSTooltip>

      {/* Selection d'un flux  */}
      <OSTooltip label={t('Menu.tooltips.flux.slct')}>
        <OSMultiSelect
          t={new_data.t}
          elements={entries_for_links}
          onClick={(entries: typeElementSelectable) => {
            // Update selection list
            const entries_values = entries.map(d => d.value)
            links.forEach(n => {
              if (entries_values.includes(n.id)) {
                new_data.drawing_area.addLinkToSelection(n)
              }
              else {
                new_data.drawing_area.removeLinkFromSelection(n)
              }
            })
            // Update all menus
            refreshThisAndUpdateRelatedComponents()
          }}
        />      </OSTooltip>

      {/* Suppression d'un flux  */}
      <OSTooltip label={t('Menu.tooltips.flux.rm')}>
        <Button
          variant='menuconfigpanel_del_button'
          size='sizeConfigButton'
          onClick={
            () => {
              // Delete all selected links
              new_data.drawing_area.deleteSelectedLinks()
              // Toogle saving indicator
              refreshThisAndUpdateRelatedComponents()
            }}>
          {icon_remove_element}
        </Button>
      </OSTooltip>

      {/* Activer / Désactiver selection uniquement des flux actuellement visibles */}
      <OSTooltip label={t('Menu.tooltips.noeud.dns')}>
        <Button
          variant='menuconfigpanel_option_button'
          size='sizeConfigButton'
          onClick={
            () => {
              // Update UI with only visible links / all links
              new_data.menu_configuration.toggle_selector_on_visible_links()
            }}>
          {new_data.menu_configuration.is_selector_only_for_visible_links ? icon_element_visible : icon_element_invisible}
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
            <InputLeftAddon height='1.5rem' width='5rem' >
              {t('Flux.src')}
            </InputLeftAddon>
            <Select
              variant='select_custom_style'
              isDisabled={selected_links.length !== 1}
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
              height='1.5rem'
              width='5rem'
            >
              {t('Flux.trgt')}
            </InputLeftAddon>
            <Select
              variant='select_custom_style'
              isDisabled={selected_links.length !== 1}
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
            onClick={new_data.drawing_area.inverseSelectedLinks}
          >
            {icon_repeat}
          </Button>
        </OSTooltip>
      </Box>
    </Box>
  </Box>)
}
export const SankeyLinkSelectionSimple: FC<BaseApplicationDataType> = (
  {
    new_data,
  }
) => {

  // Data -------------------------------------------------------------------------------

  // Traduction
  const { t, icon_library } = new_data
  const { icon_element_visible, icon_element_invisible } = icon_library
  // Links to display in selection menus ------------------------------------------------

  let links: Class_LinkElement[]
  let selected_links: Class_LinkElement[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_links) {
    // All availables links
    links = new_data.drawing_area.sankey.links_list
    selected_links = new_data.drawing_area.selected_links_list
  }
  else {
    // Only visible links
    links = new_data.drawing_area.sankey.visible_links_list
    selected_links = new_data.drawing_area.visible_and_selected_links_list
  }

  const entries_for_links = links.map((d) => { return { 'label': d.name, 'value': d.id, selected: selected_links.includes(d) } })

  // Components updaters ----------------------------------------------------------------
  // Boolean used to force this component to reload
  const [, setCount] = useState(0)
  // Link this menu's update function
  new_data.menu_configuration.ref_to_menu_config_links_selection_updater.current = () => setCount(a => a + 1)

  // Function used to reset menu UI -----------------------------------------------------

  const refreshThisAndToggleSaving = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // Refresh this menu
    setCount(a => a + 1)
  }

  const refreshThisAndUpdateRelatedComponents = () => {
    // Update values displayed in menus for link's configuration
    new_data.menu_configuration.updateAllComponentsRelatedToLinksConfig()
    // Update and update saving indicator
    refreshThisAndToggleSaving()
  }

  // Sub-menus --------------------------------------------------------------------------
  // Links upper menu -------------------------------------------------------------------
  return (<Box layerStyle='menuconfigpanel_grid'>
    <Box
      as='span'
      layerStyle='menuconfigpanel_row_droplist_simple'
    >
      {/* Selection d'un flux  */}
      <OSTooltip label={t('Menu.tooltips.flux.slct')}>
        <OSMultiSelect
          t={new_data.t}
          elements={entries_for_links}
          onClick={(entries: typeElementSelectable) => {
            // Update selection list
            const entries_values = entries.map(d => d.value)
            links.forEach(n => {
              if (entries_values.includes(n.id)) {
                new_data.drawing_area.addLinkToSelection(n)
              }
              else {
                new_data.drawing_area.removeLinkFromSelection(n)
              }
            })
            // Update all menus
            refreshThisAndUpdateRelatedComponents()
          }}
        />
      </OSTooltip>

      {/* Activer / Désactiver selection uniquement des flux actuellement visibles */}
      <OSTooltip label={t('Menu.tooltips.noeud.dns')}>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={
            () => {
              // Update UI with only visible links / all links
              new_data.menu_configuration.toggle_selector_on_visible_links()
            }}>
          {new_data.menu_configuration.is_selector_only_for_visible_links ? icon_element_visible : icon_element_invisible}
        </Button>
      </OSTooltip>
    </Box>
  </Box>)
}