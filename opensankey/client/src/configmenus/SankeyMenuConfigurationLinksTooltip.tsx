// External imports
import React, { FunctionComponent, MutableRefObject, useRef, useState } from 'react'
import {
  Box,
  Button,
  TabPanel,
  Textarea
} from '@chakra-ui/react'

// Local types
import type { MenuConfigurationLinksTooltipFType } from './types/SankeyMenuConfigurationLinksTooltipTypes'
import type { Type_GenericLinkElementOS } from '../types/TypesOS'

// Local functions
import { OSTooltip } from '../types/Utils'

// MENU COMPONENT ***********************************************************************

/**
 * Create tootltip modification menu
 *
 * @param {*} {
 *   applicationData,
 *   applicationContext,
 *   menu_for_modal
 * }
 * @return {*}
 */
export const MenuConfigurationLinksTooltip : FunctionComponent<MenuConfigurationLinksTooltipFType> = ({
  applicationData,
  menu_for_modal
})=>{

  // Data -------------------------------------------------------------------------------

  // Get necessary infos
  const { new_data } = applicationData
  const { t } = applicationData.new_data

  // Selected links ---------------------------------------------------------------------

  let selected_links: Type_GenericLinkElementOS[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_links) {
    // All availables links
    selected_links = new_data.drawing_area.selected_links_list_sorted
  }
  else {
    // Only visible links
    selected_links = new_data.drawing_area.visible_and_selected_links_list_sorted
  }

  // Editor state ----------------------------------------------------------------------

  // State & refs for text input
  const [editor_content_tooltip, setEditorContentTooltip] = useState('')
  const inputRef = useRef() as MutableRefObject<HTMLTextAreaElement>
  let tmp_editor_content_tooltip = editor_content_tooltip

  // Check if there is difference between text in editor and link tooltips
  let s_tmp_editor_content_changed = false
  if ( selected_links.length > 0 ) {
    if (selected_links[0].tooltip_text !== editor_content_tooltip) {
      s_tmp_editor_content_changed = true
    }
  }

  // Components updaters ---------------------------------------------------------------

  // Update what is displayed in text editor
  const resetTextEditor = () => {
    if (selected_links.length>0) {
      if ( typeof selected_links[0].tooltip_text !== 'undefined' ) {
      // Reset textaera
        if ( typeof inputRef.current !== 'undefined') {
          if (inputRef.current !== null) {
            inputRef.current.value = selected_links[0].tooltip_text
          }
        }
        // Reset state value
        setEditorContentTooltip(selected_links[0].tooltip_text)
      }
      else {
      // Reset textaera
        if ( typeof inputRef.current !== 'undefined') {
          if (inputRef.current !== null) {
            inputRef.current.value = ''
          }
        }
        // Reset state value
        setEditorContentTooltip('')
      }
    }
    else {
      // Reset textaera
      if ( typeof inputRef.current !== 'undefined') {
        if (inputRef.current !== null) {
          inputRef.current.value = ''
        }
      }
      // Reset state value
      setEditorContentTooltip('')
    }
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
  }

  // Link with new_data components updater
  new_data.menu_configuration.ref_to_menu_config_links_tooltips_updater.current = resetTextEditor

  // JSX Components ---------------------------------------------------------------------

  const content = <>
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'
    >
      {t('Noeud.IB')}
    </Box>
    <OSTooltip label={t('Flux.tooltips.IB')}>
      <Textarea
        rows={5}
        ref={inputRef}
        defaultValue={editor_content_tooltip}
        onChange={(evt) => {
          tmp_editor_content_tooltip = evt.target.value
          if (!s_tmp_editor_content_changed) {
            setEditorContentTooltip(tmp_editor_content_tooltip)
          }
        }}
        onBlur={()=>{
          setEditorContentTooltip(tmp_editor_content_tooltip)
        }}
      />
    </OSTooltip>
    <Box
      as='span'
      layerStyle='options_2cols'
    >
      <Button
        variant='menuconfigpanel_option_button_left'
        isDisabled={!s_tmp_editor_content_changed}
        backgroundColor='red.200'
        onClick={() => {
          resetTextEditor()
        }}
      >
        {t('Menu.annuler')}
      </Button>
      <Button
        variant='menuconfigpanel_option_button_right'
        isDisabled={!s_tmp_editor_content_changed}
        onClick={() => {
          selected_links.map(link => link.tooltip_text = tmp_editor_content_tooltip)
          setEditorContentTooltip(tmp_editor_content_tooltip)
        }}
      >
        {t('Menu.submit')}
      </Button>
    </Box>
  </>

  return menu_for_modal ?
    content
    :
    <TabPanel >
      {content}
    </TabPanel>
}