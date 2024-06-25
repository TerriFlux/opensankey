import React, { FunctionComponent, MutableRefObject, useRef, useState } from 'react'
import { MenuConfigurationLinksTooltipFType } from './types/SankeyMenuConfigurationLinksTooltipTypes'
import { Box, Button, TabPanel, Textarea, useBoolean } from '@chakra-ui/react'
import { OSTooltip } from './SankeyUtils'

export const MenuConfigurationLinksTooltip : FunctionComponent<MenuConfigurationLinksTooltipFType> = ({
  applicationData,
  ComponentUpdater,
  t,
  menu_for_modal
})=>{
  const [ , setForceUpdate ]=useBoolean()
  const {new_data}=applicationData
  const {selected_links_list}=new_data.drawing_area
  const inputRef = useRef() as MutableRefObject<HTMLTextAreaElement>
  const [editor_content_tooltip, sEditorContentNodeTooltip] = useState('')
  let tmp_editor_content_tooltip = editor_content_tooltip
  let s_tmp_editor_content_changed = false
  if (selected_links_list.length>0) {
    if (selected_links_list[0].tooltip_text !== editor_content_tooltip) {
      s_tmp_editor_content_changed = true
    }
  }
  const resetTextEditor=()=>{
    if (selected_links_list.length>0) {
      if ( typeof selected_links_list[0].tooltip_text !== 'undefined' ) {
      // Reset textaera
        if ( typeof inputRef.current !== 'undefined') {
          if (inputRef.current !== null) {
            inputRef.current.value = selected_links_list[0].tooltip_text
          }
        }
        // Reset state value
        sEditorContentNodeTooltip(selected_links_list[0].tooltip_text)
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

  const content=    <>
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
          selected_links_list.map(link => link.tooltip_text = tmp_editor_content_tooltip)
          sEditorContentNodeTooltip(tmp_editor_content_tooltip)
        }}
      >
        {t('Menu.submit')}
      </Button>
    </Box>
  </>

  return menu_for_modal?content:
    // [ 
    //   <Tab>
    //     <Box
    //       layerStyle='submenuconfig_tab'
    //     >
    //       {t('Flux.IS')}
    //     </Box>
    //   </Tab>,
    <TabPanel >
      {content}
    </TabPanel>

}