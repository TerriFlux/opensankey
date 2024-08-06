import React, { FunctionComponent, useState } from 'react'
import {
  FaPlus,
  FaMinus,
  FaChevronDown,
} from 'react-icons/fa'

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
} from '../configmenus/SankeyUtils'
import { SankeyWrapperConfigInModalOrMenu } from '../configmenus/SankeyMenuConfigurationNodesAttributes'
import { MenuConfigurationLinksAppearence } from '../configmenus/SankeyMenuConfigurationLinksAppearence'
import { SankeyModalStyleLinkFType, SankeyModalStyleNodeFType } from './types/SankeyStyleTypes'
import { MenuDraggable } from '../topmenus/SankeyMenuTop'
import { default_style_id } from '../types/Sankey'


export const SankeyModalStyleNode: FunctionComponent<SankeyModalStyleNodeFType> = ({
  applicationData,
  node_attribute_tab
}) => {
  const { new_data } = applicationData
  const { t } = new_data

  // Component's state
  const [, setForceUpdate] = useBoolean()
  const [selected_node_style_id, setSelectedNodeStyleId] = useState(default_style_id)

  // Shared refs with external components
  new_data.menu_configuration.ref_selected_style_node.current = selected_node_style_id

  // Dict of nodes styles
  const node_styles_dict = new_data.drawing_area.sankey.node_styles_dict

  const content = <Box layerStyle='menuconfigpanel_grid'>
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
          new_data.menu_configuration.ref_to_menu_config_node_apparence_updater.current()
          // Need to save
          new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
          // Update display for this component
          setSelectedNodeStyleId(new_style.id)
        }}>
        <FaPlus />
      </Button>

      {/* Liste déroulante pour selectionner un style */}
      <Menu>
        <MenuButton
          as={Button}
          variant='menuconfigpanel_option_button'
          rightIcon={<FaChevronDown />}>
          {
            (selected_node_style_id !== '') ?
              CutName(node_styles_dict[selected_node_style_id].name, 30) :
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
                      new_data.menu_configuration.ref_to_menu_config_node_apparence_updater.current()
                      // Update this menu
                      setSelectedNodeStyleId(id)
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
        isDisabled={(selected_node_style_id === default_style_id)}
        onClick={() => {
          // Delete style - everything is done inside Sankey Class & NodeStyle Class
          new_data.drawing_area.sankey.deleteNodeStyle(node_styles_dict[selected_node_style_id])
          // Fallback to default style
          new_data.menu_configuration.ref_selected_style_node.current = default_style_id
          new_data.menu_configuration.ref_to_menu_config_node_apparence_updater.current()
          // Need to save
          new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
          // Update this menu
          setSelectedNodeStyleId(default_style_id)
        }}
      >
        <FaMinus />
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
            disabled={(selected_node_style_id === default_style_id)}
            value={node_styles_dict[selected_node_style_id].name}
            onChange={(evt) => {
              // Update current style name
              node_styles_dict[selected_node_style_id].name = evt.target.value
              setForceUpdate.toggle()
              // Need to save
              new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
            }}
          />
        </InputGroup>
      </Box>
    </Box>

    {
      <SankeyWrapperConfigInModalOrMenu
        menu_to_wrap={node_attribute_tab}
        for_modal={true}
        idTab={'node_attr'}
      />
    }
  </Box>

  return <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={applicationData.new_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_style_node'}
    content={content}
    title={t('Menu.esn')}
  />
}


//Modal et fonctions pour l'edition et affectation des style de flux
export const SankeyModalStyleLink: FunctionComponent<SankeyModalStyleLinkFType> = ({
  applicationData,
  additional_link_appearence_items
}) => {
  const { new_data } = applicationData
  const { t } = new_data
  const { ref_selected_style_link } = new_data.menu_configuration

  // Component's state
  const [ selected_link_style_id, setSelectedLinkStyleId ] = useState(default_style_id)
  const [ ,setForceUpdate ] = useBoolean()

  // Shared refs for external components
  ref_selected_style_link.current = selected_link_style_id

  // Dict of links styles
  const link_styles_dict = new_data.drawing_area.sankey.link_styles_dict

  const content = <Box layerStyle='menuconfigpanel_grid'>
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
          new_data.menu_configuration.ref_to_menu_config_link_updater.current()
          // Need to save
          new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
          // Update this component
          setSelectedLinkStyleId(new_style.id)
        }}>
        <FaPlus />
      </Button>

      {/* Liste déroulante pour selectionner un style */}
      <Menu>
        <MenuButton
          as={Button}
          variant='menuconfigpanel_option_button'
          rightIcon={<FaChevronDown />}>
          {
            (selected_link_style_id !== '') ?
              CutName(link_styles_dict[selected_link_style_id].name, 30) :
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
                    new_data.menu_configuration.ref_to_menu_config_link_updater.current()
                    // Update this menu
                    setSelectedLinkStyleId(id)
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
        isDisabled={(selected_link_style_id === default_style_id)}
        onClick={() => {
          // Delete link style from Sankey
          new_data.drawing_area.sankey.deleteLinkStyle(link_styles_dict[selected_link_style_id])
          // Update Style config menu
          ref_selected_style_link.current = default_style_id
          new_data.menu_configuration.ref_to_menu_config_link_updater.current()
          // Need to save
          new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
          // Update this component
          setSelectedLinkStyleId(default_style_id)
        }}
      >
        <FaMinus />
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
            disabled={(selected_link_style_id === default_style_id)}
            value={
              (selected_link_style_id !== '') ? link_styles_dict[selected_link_style_id].name : ''
            }
            onChange={(evt) => {
              // Update current style name
              link_styles_dict[selected_link_style_id].name = evt.target.value
              setForceUpdate.toggle()
              // Need to save
              new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
            }}
          />
        </InputGroup>
      </Box>
    </Box>

    {
      <MenuConfigurationLinksAppearence
        applicationData={applicationData}
        additional_link_appearence_items={additional_link_appearence_items}
        menu_for_style={true}
      />
    }
  </Box>

  return <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={applicationData.new_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_style_link'}
    content={content}
    title={t('Menu.esf')}
  />
}
