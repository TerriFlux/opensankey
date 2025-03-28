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

import React, { FunctionComponent, useState } from 'react'

import {
  Box,
  Button,
  Input,
  InputGroup,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useBoolean
} from '@chakra-ui/react'

import {
  CutName
} from '../../types/Utils'
import { MenuConfigurationLinkContext, MenuConfigurationLinksStyle } from '../configmenus/SankeyMenuConfigurationLinksAppearence'
import { FCType_SankeyModalStyleLink, FCType_SankeyModalStyleNode, FCType_WrapperLinkStyleSelector } from './types/SankeyStyleTypes'
import { MenuDraggable } from '../topmenus/SankeyMenus'
import { default_style_id } from '../../types/Utils'
import { MenuConfigurationNodeContext, MenuConfigurationNodeStyle } from '../configmenus/SankeyMenuConfigurationNodesAttributes'


export const SankeyModalStyleNode: FunctionComponent<FCType_SankeyModalStyleNode> = ({
  new_data,
  additionalMenus
}) => {
  const { t } = new_data

  // Component's state
  const [, setForceUpdate] = useBoolean()
  const [selected_node_style_id, setSelectedNodeStyleId] = useState(default_style_id)
  new_data.menu_configuration.ref_to_menu_config_nodes_styles_editor_updater.current = setForceUpdate.toggle

  // Dict of nodes styles
  const node_styles_dict = new_data.drawing_area.sankey.node_styles_dict

  let content_node_style_shape = <></>
  let content_node_style_context = <></>

  // Failsafe for when selected_node_style_id is not in node_styles_dict
  // It can happen when we change view and selected_node_style_id is not anymore in current sankey data
  if (!(selected_node_style_id in node_styles_dict)) {
    setSelectedNodeStyleId(default_style_id)
  } else {
    content_node_style_shape = <WrapperNodeStyleSelector new_data={new_data}>
      {
        <MenuConfigurationNodeStyle
          new_data={new_data}
          menu_for_style={true}
          additional_menus={additionalMenus}
        />}
    </WrapperNodeStyleSelector>

    content_node_style_context = <WrapperNodeStyleSelector new_data={new_data}>
      <MenuConfigurationNodeContext
        new_data={new_data}
        menu_for_style={true}
        additional_menus={additionalMenus}
      />
    </WrapperNodeStyleSelector>
  }

  return <><MenuDraggable
    dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_styles_nodes'}
    content={content_node_style_shape}
    title={t('Menu.esn')}
    maxW='20%'
    customPos={{ x: window.innerWidth * 0.59, y: window.innerHeight * 0.2 }}
  />
  <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_styles_nodes_context'}
    content={content_node_style_context}
    title={t('Menu.esn')}
    maxW='20%'
    customPos={{ x: window.innerWidth * 0.59, y: window.innerHeight * 0.2 }}
  />
  </>
}

const WrapperNodeStyleSelector: FunctionComponent<FCType_WrapperLinkStyleSelector> = ({ new_data, children }) => {
  const { t, icon_library } = new_data
  const { icon_add_element, icon_remove_element, icon_open_selector } = icon_library

  // Shared refs for external components
  const { ref_selected_style_node } = new_data.menu_configuration
  // Dict of links styles
  const node_styles_dict = new_data.drawing_area.sankey.node_styles_dict



  return <Box layerStyle='menuconfigpanel_grid'>
    <Box
      as='span'
      layerStyle='menustylepanel_row_droplist'
    >
      {/* Boutton pour ajouter un style */}
      <Button
        variant='menuconfigpanel_add_button'
        onClick={() => {
          // Create defaut style
          const new_style = new_data.drawing_area.sankey.addNewDefaultNodeStyle()
          // Update Style config menu
          new_data.menu_configuration.ref_selected_style_node.current = new_style.id
          new_data.menu_configuration.updateAllComponentsRelatedToNodes()
          new_data.menu_configuration.updateComponentRelatedToNodesStyles()
          // Need to save
          new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
        }}>
        {icon_add_element}
      </Button>

      {/* Liste déroulante pour selectionner un style */}
      <Menu>
        <MenuButton
          as={Button}
          variant='menuconfigpanel_option_button'
          rightIcon={icon_open_selector}>
          {
            (ref_selected_style_node.current !== '') ?
              CutName(node_styles_dict[ref_selected_style_node.current].name, 30) :
              'Choix Style'
          }
        </MenuButton>
        <MenuList>
          {
            Object
              .keys(node_styles_dict)
              .map(id => {
                return (
                  <MenuItem
                    key={id}
                    onClick={() => {
                      // Update style apparence menu
                      new_data.menu_configuration.ref_selected_style_node.current = id
                      new_data.menu_configuration.updateComponentRelatedToNodesStyles()
                    }}
                  >
                    {node_styles_dict[id].name}
                  </MenuItem>)
              })
          }
        </MenuList>
      </Menu>

      {/* Boutton pour supprimer le noeud selectionné */}
      <Button
        variant='menuconfigpanel_del_button'
        isDisabled={(ref_selected_style_node.current === default_style_id)}
        onClick={() => {
          // Delete style - everything is done inside Sankey Class & NodeStyle Class
          new_data.drawing_area.sankey.deleteNodeStyle(node_styles_dict[ref_selected_style_node.current])
          // Fallback to default style
          new_data.menu_configuration.ref_selected_style_node.current = default_style_id
          new_data.menu_configuration.updateAllComponentsRelatedToNodes()
          new_data.menu_configuration.updateComponentRelatedToNodesStyles()
          // Need to save
          new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)

        }}
      >
        {icon_remove_element}

      </Button>
    </Box>

    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
      gridTemplateColumns='1fr 7fr'
    >
      <Box
        layerStyle='menuconfigpanel_option_name'
        textStyle='h3'
      >
        {t('Menu.ns')}
      </Box>
      <Box>
        <InputGroup
          variant='menuconfigpanel_option_input'
        >
          <Input
            variant='menuconfigpanel_option_input'
            disabled={(ref_selected_style_node.current === default_style_id)}
            value={node_styles_dict[ref_selected_style_node.current].name}
            onChange={(evt) => {
              // Update current style name
              node_styles_dict[ref_selected_style_node.current].name = evt.target.value
              new_data.menu_configuration.updateAllComponentsRelatedToNodes()
              new_data.menu_configuration.updateComponentRelatedToNodesStyles()
              // Need to save
              new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
            }}
          />
        </InputGroup>
      </Box>
    </Box>

    {
      children
    }
  </Box>
}


//Modal et fonctions pour l'edition et affectation des style de flux
export const SankeyModalStyleLink: FunctionComponent<FCType_SankeyModalStyleLink> = ({
  new_data,
  additionalMenus
}) => {
  const { t } = new_data
  const { ref_selected_style_link } = new_data.menu_configuration

  // Component's state
  const [selected_link_style_id, setSelectedLinkStyleId] = useState(default_style_id)
  const [, setForceUpdate] = useBoolean()

  new_data.menu_configuration.ref_to_menu_config_links_styles_editor_updater.current = setForceUpdate.toggle
  // Shared refs for external components
  // Dict of links styles
  const link_styles_dict = new_data.drawing_area.sankey.link_styles_dict

  let content_apparence_shape = <></>
  let content_apparence_contenxt = <></>

  // Failsafe for when selected_link_style_id is not in link_styles_dict
  // It can happen when we change view and selected_link_style_id is not anymore in current sankey data
  if (!(selected_link_style_id in link_styles_dict)) {
    setSelectedLinkStyleId(default_style_id)
  } else {
    content_apparence_shape = <WrapperLinkStyleSelector new_data={new_data}>
      <MenuConfigurationLinksStyle
        new_data={new_data}
        additionMenus={additionalMenus}
        menu_for_style={true}
      />
    </WrapperLinkStyleSelector>

    content_apparence_contenxt = <WrapperLinkStyleSelector new_data={new_data}>
      <MenuConfigurationLinkContext
        new_data={new_data}
        additionMenus={additionalMenus}
        menu_for_style={true}
      />
    </WrapperLinkStyleSelector>
  }

  return <><MenuDraggable
    dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_styles_links'}
    content={content_apparence_shape}
    title={t('Menu.esf')}
    maxW='20%'
    customPos={{ x: window.innerWidth * 0.59, y: window.innerHeight * 0.2 }}

  />
  <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_styles_links_context'}
    content={content_apparence_contenxt}
    title={t('Menu.esf')}
    maxW='20%'
    customPos={{ x: window.innerWidth * 0.59, y: window.innerHeight * 0.2 }}

  />
  </>
}

const WrapperLinkStyleSelector: FunctionComponent<FCType_WrapperLinkStyleSelector> = ({ new_data, children }) => {
  const { t, icon_library } = new_data
  const { icon_add_element, icon_remove_element, icon_open_selector } = icon_library

  // Shared refs for external components
  const { ref_selected_style_link } = new_data.menu_configuration
  // Dict of links styles
  const link_styles_dict = new_data.drawing_area.sankey.link_styles_dict

  return <Box layerStyle='menuconfigpanel_grid'>
    <Box
      as='span'
      layerStyle='menustylepanel_row_droplist'
    >
      {/* Boutton pour ajouter un style */}
      <Button
        variant='menuconfigpanel_add_button'
        onClick={() => {
          // Create default new style
          const new_style = new_data.drawing_area.sankey.addNewDefaultLinkStyle()
          // Update Style config menu
          ref_selected_style_link.current = new_style.id
          new_data.menu_configuration.updateComponentRelatedToLinksApparence()
          new_data.menu_configuration.updateComponentRelatedToLinksStyles()

          // Need to save
          new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
        }}>
        {icon_add_element}
      </Button>

      {/* Liste déroulante pour selectionner un style */}
      <Menu>
        <MenuButton
          as={Button}
          variant='menuconfigpanel_option_button'
          rightIcon={icon_open_selector}>
          {
            (ref_selected_style_link.current !== '') ?
              CutName(link_styles_dict[ref_selected_style_link.current].name, 30) :
              'Choix Style'
          }
        </MenuButton>
        <MenuList>
          {
            Object
              .keys(link_styles_dict)
              .map(id =>
                <MenuItem
                  key={id}
                  onClick={() => {
                    // Update Style config menu
                    ref_selected_style_link.current = id
                    new_data.menu_configuration.updateComponentRelatedToLinksApparence()
                    new_data.menu_configuration.updateComponentRelatedToLinksStyles()
                  }}
                >
                  {link_styles_dict[id].name}
                </MenuItem>
              )
          }
        </MenuList>
      </Menu>

      {/* Boutton pour supprimer le noeud selectionné */}
      <Button
        variant='menuconfigpanel_del_button'
        isDisabled={(ref_selected_style_link.current === default_style_id)}
        onClick={() => {
          // Delete link style from Sankey
          new_data.drawing_area.sankey.deleteLinkStyle(link_styles_dict[ref_selected_style_link.current])
          // Update Style config menu
          ref_selected_style_link.current = default_style_id
          new_data.menu_configuration.updateComponentRelatedToLinksApparence()
          new_data.menu_configuration.updateComponentRelatedToLinksStyles()

          new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
        }}
      >
        {icon_remove_element}
      </Button>
    </Box>

    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
      gridTemplateColumns='1fr 7fr'
    >
      <Box
        layerStyle='menuconfigpanel_option_name'
        textStyle='h3'
      >
        {t('Menu.ns')}
      </Box>
      <Box>
        <InputGroup variant='menuconfigpanel_option_input' >
          <Input
            variant='menuconfigpanel_option_input'
            disabled={(ref_selected_style_link.current === default_style_id)}
            value={
              (ref_selected_style_link.current !== '') ? link_styles_dict[ref_selected_style_link.current].name : ''
            }
            onChange={(evt) => {
              // Update current style name
              link_styles_dict[ref_selected_style_link.current].name = evt.target.value
              new_data.menu_configuration.ref_to_menu_config_links_styles_editor_updater.current()
              // Need to save
              new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
            }}
          />
        </InputGroup>
      </Box>
    </Box>

    {
      children
    }
  </Box>
} 
