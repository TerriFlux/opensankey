import React, { MutableRefObject, useRef, useState } from 'react'
import { SankeyMenuConfigurationNodesTooltipFType } from './types/SankeyMenuConfigurationNodesTooltipTypes'
import { Box, Button, Tab, TabPanel, Textarea } from '@chakra-ui/react'
import { OSTooltip } from './SankeyUtils'

export const SankeyMenuConfigurationNodesTooltip : SankeyMenuConfigurationNodesTooltipFType = (
  applicationContext,
  dict_variable_elements_selected,
  ComponentUpdater,
  menu_for_modal
) => {
  const { t } = applicationContext
  const {updateMenuConfigTextNodeTooltip}=ComponentUpdater
  const { multi_selected_nodes } = dict_variable_elements_selected
  const [ forceUpdate, setForceUpdate ]=useState(false)

  const inputRef = useRef() as MutableRefObject<HTMLTextAreaElement>
  const [editor_content_tooltip, sEditorContentNodeTooltip] = useState('')
  let tmp_editor_content_tooltip = editor_content_tooltip
  let s_tmp_editor_content_changed = false
  if (multi_selected_nodes.current.length>0) {
    if (multi_selected_nodes.current[0].tooltip_text !== editor_content_tooltip) {
      s_tmp_editor_content_changed = true
    }
  }
  const resetTextEditor=()=>{
    if (multi_selected_nodes.current.length>0) {
      if ( typeof multi_selected_nodes.current[0].tooltip_text !== 'undefined' ) {
      // Reset textaera
        if ( typeof inputRef.current !== 'undefined') {
          if (inputRef.current !== null) {
            inputRef.current.value = multi_selected_nodes.current[0].tooltip_text
          }
        }
        // Reset state value
        sEditorContentNodeTooltip(multi_selected_nodes.current[0].tooltip_text)
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
    setForceUpdate(!forceUpdate)

  }

  updateMenuConfigTextNodeTooltip.current.push(resetTextEditor)

  const content = <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'
    >
      {t('Noeud.IB')}
    </Box>

    <OSTooltip label={t('Noeud.tooltips.IB')}>
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
          multi_selected_nodes.current.map(node => node.tooltip_text = tmp_editor_content_tooltip)
          sEditorContentNodeTooltip(tmp_editor_content_tooltip)
        }}
      >
        {t('Menu.submit')}
      </Button>
    </Box>
  </Box>

  return menu_for_modal?
    [
      content
    ]:[
      <Tab>
        <Box
          layerStyle='submenuconfig_tab'
        >
          {t('Noeud.tabs.infos')}
        </Box>
      </Tab>,
      <TabPanel>
        {content}
      </TabPanel>
    ]
}