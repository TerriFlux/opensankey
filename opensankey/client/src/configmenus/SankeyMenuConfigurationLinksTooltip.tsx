// External imports
import React, { FunctionComponent, MutableRefObject, useRef, useState } from 'react'
import {
  Box,
  Button,
  TabPanel,
  Textarea,
  useBoolean
} from '@chakra-ui/react'

// Local types
import { MenuConfigurationLinksTooltipFType } from './types/SankeyMenuConfigurationLinksTooltipTypes'

// Local functions
import { OSTooltip } from './SankeyUtils'


// MENU COMPONENT ***********************************************************************

export const MenuConfigurationLinksTooltip : FunctionComponent<MenuConfigurationLinksTooltipFType> = ({
  applicationData,
  applicationContext,
  menu_for_modal
})=>{
  // Get necessary infos
  const { new_data, data } = applicationData
  const { t } = applicationContext

  // Set state & Ref for UI update
  const [ , setForceUpdate ] = useBoolean()
  const [editor_content_tooltip, sEditorContentNodeTooltip] = useState('')
  const inputRef = useRef() as MutableRefObject<HTMLTextAreaElement>
  let tmp_editor_content_tooltip = editor_content_tooltip

  // Get selected links
  let selected_links
  if (data.displayed_link_selector) {
    // All availables links
    selected_links = new_data.drawing_area.selected_links_list
  }
  else {
    // Only visible links
    selected_links = new_data.drawing_area.visible_and_selected_links_list
  }

  // Check if there is difference between text in editor and link tooltips
  let s_tmp_editor_content_changed = false
  if ( selected_links.length > 0 ) {
    if (selected_links[0].tooltip_text !== editor_content_tooltip) {
      s_tmp_editor_content_changed = true
    }
  }

  // TODO a checker
  const resetTextEditor=()=>{
    if (selected_links.length>0) {
      if ( typeof selected_links[0].tooltip_text !== 'undefined' ) {
      // Reset textaera
        if ( typeof inputRef.current !== 'undefined') {
          if (inputRef.current !== null) {
            inputRef.current.value = selected_links[0].tooltip_text
          }
        }
        // Reset state value
        sEditorContentNodeTooltip(selected_links[0].tooltip_text)
      }else {
      // Reset textaera
        if ( typeof inputRef.current !== 'undefined') {
          if (inputRef.current !== null) {
            inputRef.current.value = ''
          }
        }
        // Reset state value
        sEditorContentNodeTooltip('')
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
      sEditorContentNodeTooltip('')
    }
    setForceUpdate.toggle()
  }
  new_data.menu_configuration.updateMenuConfigTextLinkTooltip.current.push(resetTextEditor)

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
            sEditorContentNodeTooltip(tmp_editor_content_tooltip)
          }
        }}
        onBlur={()=>{
          sEditorContentNodeTooltip(tmp_editor_content_tooltip)
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
          sEditorContentNodeTooltip(tmp_editor_content_tooltip)
        }}
      >
        {t('Menu.submit')}
      </Button>
    </Box>
  </>

  return menu_for_modal?content:
    <TabPanel >
      {content}
    </TabPanel>
}