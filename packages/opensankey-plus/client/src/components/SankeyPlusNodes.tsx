import React, { useState, FC } from 'react'

import { Box, Button, Input, InputGroup, InputRightElement, MenuItem } from '@chakra-ui/react'
import { OSTooltip, WrapperBoxSubSectionMenu } from '../deps/OpenSankey/components/configmenus/MenuCommon'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'

interface BaseComponentPropsPlus {
  new_data_plus: Class_ApplicationDataOSP
}

export const NodeHyperLinkOSP: FC<BaseComponentPropsPlus> = ({
  new_data_plus,
}) => {
  const { drawing_area, t, menu_configuration_osp } = new_data_plus
  const selected_nodes = drawing_area.selected_nodes_list
  const is_activated = new_data_plus.has_sankey_plus

  const [, setCount] = useState(0)
  menu_configuration_osp.ref_to_node_hyperlink_updater.current = () => setCount(a => a + 1)
  if (selected_nodes.length == 0)
    return <></>

  const hasHyperLink = () => {
    let visible = ''
    visible = selected_nodes[0]?.hyperlink ?? ''
    return visible
  }

  const updateHyperlinkValue = (_: string) => {
    const dict_old_value: { [x: string]: string } = {}
    selected_nodes.forEach(n => {
      dict_old_value[n.id] = n.hyperlink as string
    })
    const _updateHyperlinkValue = () => {
      selected_nodes.forEach(n => {
        n.hyperlink = _
      })
      setCount(a => a + 1)

    }

    const inv_updateHyperlinkValue = () => {
      selected_nodes.forEach(n => {
        n.hyperlink = dict_old_value[n.id]
      })
      setCount(a => a + 1)
    }
    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateHyperlinkValue)
    new_data_plus.history.saveRedo(_updateHyperlinkValue)
    // Execute original attr mutation
    _updateHyperlinkValue()
  }

  const node_hyperlink = hasHyperLink()
  const content_image_tab = selected_nodes.length > 0 ?
    <Box
      layerStyle='menuconfigpanel_grid'
    >
      <OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >

        <Box
          layerStyle='menuconfigpanel_grid'
        >
          <InputGroup
            variant='menuconfigpanel_option_input'
          >
            <Input
              value={node_hyperlink}
              isDisabled={!is_activated}
              onChange={(evt) => {
                updateHyperlinkValue(evt.target.value)
              }}
            />
            <InputRightElement >
              <Button
                variant='menuconfigpanel_option_button'
                isDisabled={hasHyperLink() === ''}
                onClick={() => {
                  window.open(node_hyperlink)
                }}
              >
                {new_data_plus.icon_library.icon_popup_menu}
              </Button>
            </InputRightElement>
          </InputGroup>
        </Box>
      </OSTooltip>
    </Box> :
    <></>

  return <WrapperBoxSubSectionMenu new_data={new_data_plus} title={t('Noeud.HL')}>
    {content_image_tab}
  </WrapperBoxSubSectionMenu>

}

export const ButtonNodeContextCreateUnitaryView = ({ app_data }: { app_data: Class_ApplicationDataOSP }) => {
  const { t, drawing_area, menu_configuration_osp } = app_data

  const closeContextMenu = () => {
    // Unset contextualized node
    drawing_area.node_contextualised = undefined
    // Refresh this menu
    menu_configuration_osp.ref_to_menu_context_nodes_updater.current()
  }

  return <Button
    as={MenuItem}
    onClick={() => {
      // Sankey unitaire ouvert dans un panneau draggable (second diagramme),
      // au lieu d'être généré comme une vue qui remplace la zone principale.
      if (drawing_area.node_contextualised) {
        menu_configuration_osp.ref_open_unitary_sankey_modal.current(drawing_area.node_contextualised)
      }
      closeContextMenu()
    }}
    variant='contextmenu_button'
  >
    {t('view.context_node_unit')}
  </Button>
}

