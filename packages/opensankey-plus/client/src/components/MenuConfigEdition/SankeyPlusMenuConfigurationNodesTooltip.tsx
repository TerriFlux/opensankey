// External imports
import React, { FunctionComponent, MutableRefObject, useRef, useState } from 'react'
import {
  Box,
  Button,
  Textarea,
} from '@chakra-ui/react'

import { OSTooltip } from '../../deps/OpenSankey/types/Utils'
import { FCType_SankeyMenuConfigurationNodesTooltip } from './types/SankeyMenuConfigurationNodesTooltipTypes'
import { SankeyNodeSelectionSimple } from '../../deps/OpenSankey/components/configmenus/SankeyMenuConfigurationNodes'
import { WrapperBoxSubSectionMenu } from '../../deps/OpenSankey/components/configmenus/SankeyMenuComponents'
import { Class_NodeElement } from '../../deps/OpenSankey/Elements/Node'



// MENU COMPONENT ***********************************************************************

/**
 * Create tootltip modification menu
 *
 * @param {*} {
 *   new_data,
 *   menu_for_modal
 * }
 * @return {*}
 */
export const SankeyMenuConfigurationNodesTooltip: FunctionComponent<FCType_SankeyMenuConfigurationNodesTooltip> = ({
  new_data,
}) => {
  // Data -------------------------------------------------------------------------------
  // Get necessary infos
  const { t } = new_data

  // Selected nodes ---------------------------------------------------------------------
  let selected_nodes: Class_NodeElement[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_nodes) {
    // All availables nodes
    selected_nodes = new_data.drawing_area.selected_nodes_list_sorted
  }
  else {
    // Only visible nodes
    selected_nodes = new_data.drawing_area.visible_and_selected_nodes_list_sorted
  }

  // Editor state ----------------------------------------------------------------------

  const [editor_content_tooltip, setEditorContentTooltip] = useState('')
  const [, setCount] = useState(0)
  const inputRef = useRef() as MutableRefObject<HTMLTextAreaElement>
  let tmp_editor_content_tooltip = editor_content_tooltip

  // Check if there is difference between text in editor and node tooltips
  let s_tmp_editor_content_changed = false
  if (selected_nodes.length > 0) {
    if (selected_nodes[0].tooltip_text !== editor_content_tooltip) {
      s_tmp_editor_content_changed = true
    }
  }

  // Components updaters ---------------------------------------------------------------

  // Update what is displayed in text editor
  const resetTextEditor = () => {
    if (selected_nodes.length > 0) {
      if (typeof selected_nodes[0].tooltip_text !== 'undefined') {
        // Reset textaera
        if (typeof inputRef.current !== 'undefined') {
          if (inputRef.current !== null) {
            inputRef.current.value = selected_nodes[0].tooltip_text
          }
        }
        // Reset state value
        setEditorContentTooltip(selected_nodes[0].tooltip_text)
      }
      else {
        // Reset textaera
        if (typeof inputRef.current !== 'undefined') {
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
      if (typeof inputRef.current !== 'undefined') {
        if (inputRef.current !== null) {
          inputRef.current.value = ''
        }
      }
      // Reset state value
      setEditorContentTooltip('')
    }
  }


  const applyEditor = () => {
    const dict_old_value: { [x: string]: string } = {}
    selected_nodes.map(node => dict_old_value[node.id] = node.tooltip_text)

    const _applyEditor = () => {
      selected_nodes.map(node => node.tooltip_text = tmp_editor_content_tooltip)
      setEditorContentTooltip(tmp_editor_content_tooltip)
      // Toogle saving indicator
      new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    }
    const inv_applyEditor = () => {
      selected_nodes.map(node => node.tooltip_text = dict_old_value[node.id])
      setEditorContentTooltip(selected_nodes[0].tooltip_text)
    }

    new_data.history.saveUndo(inv_applyEditor)
    new_data.history.saveRedo(_applyEditor)

    _applyEditor()
  }


  // Link with new_data components updater
  new_data.menu_configuration.ref_to_menu_config_nodes_tooltips_updater.current = () => { setCount(a => a + 1); resetTextEditor() }

  // JSX Components ---------------------------------------------------------------------

  const content = <WrapperBoxSubSectionMenu new_data={new_data} title={t('Noeud.IB')}>
    <>
      <OSTooltip label={new_data.has_sankey_plus ? t('Flux.tooltips.IB') : t('Menu.sankeyOSPDisabled')}>
        <Textarea
          isDisabled={!new_data.has_sankey_plus}
          rows={5}
          ref={inputRef}
          defaultValue={editor_content_tooltip}
          onChange={(evt) => {
            tmp_editor_content_tooltip = evt.target.value
            if (!s_tmp_editor_content_changed) {
              setEditorContentTooltip(tmp_editor_content_tooltip)
            }
          }}
          onBlur={() => {
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
          onClick={applyEditor}
        >
          {t('Menu.submit')}
        </Button>
      </Box>
    </>
  </WrapperBoxSubSectionMenu>

  return <><SankeyNodeSelectionSimple new_data={new_data} />
    {selected_nodes.length > 0 ? content : <></>}
  </>

}