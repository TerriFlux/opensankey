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
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

import React from 'react'
import {
  Box,
  Button,
  useBoolean,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  InputGroup,
  Input
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { MenuDraggable } from '../deps/OpenSankey/components/topmenus/SankeyMenus'
import { Class_ApplicationData } from '../deps/OpenSankey/types/ApplicationData'
import { MenuConfigurationFreeLabelsOSP } from './SankeyPlusMenuConfigurationLabels'
import { CutName, default_style_id } from '../deps/OpenSankey/types/Utils'
import { OSTooltip } from '../deps/OpenSankey/components/configmenus/MenuCommon'
import { checked } from '../deps/OpenSankey/components/dialogs/SankeyMenuContext'
import { Type_customisable_container_attr } from '../deps/OpenSankey/Elements/ContainerAttributes'

/**
 * Modal component for editing container styles
 * Similar to SankeyModalStyleNode and SankeyModalStyleLink
 */
export const SankeyModalStyleContainer = ({ new_data }: { new_data: Class_ApplicationData }) => {
  const { t } = new_data
  const [, setForceUpdate] = useBoolean()
  new_data.menu_configuration.ref_to_menu_config_container_styles_editor_updater.current = setForceUpdate.toggle

  const { ref_selected_style_container } = new_data.menu_configuration
  const container_styles_dict = new_data.drawing_area.sankey.container_styles_dict

  let content_container_style = <></>

  // Failsafe for when selected_container_style_id is not in container_styles_dict
  if (!(ref_selected_style_container.current in container_styles_dict)) {
    ref_selected_style_container.current = default_style_id
  } else {
    const style_select = container_styles_dict[ref_selected_style_container.current]

    // 🆕 Menu pour les attributs personnalisables
    const content_container_customisable_attribute = (
      <Menu direction='rtl' placement='left' closeOnSelect={false}>
        <OSTooltip label={t('Menu.tooltips.style_attr_applicated')}>
          <MenuButton as={Button} variant='menuconfigpanel_option_button'>
            {t('Menu.style_attr_applicated')}
            <ChevronDownIcon />
          </MenuButton>
        </OSTooltip>

        <MenuList maxH='40vh' overflow='auto'>
          {Object.entries(style_select.customisable_attribute).map(([key, value]) => {
            return (
              <MenuItem
                key={key}
                style={{ display: 'flex' }}
                isDisabled={ref_selected_style_container.current === default_style_id}
                onClick={() => {
                  // Si l'attribut de style n'est pas personnalisable, supprimer la valeur
                  if (value) {
                    delete style_select[key as Type_customisable_container_attr]
                  }

                  // Mettre à jour la personnalisabilité de l'attribut de style
                  style_select.customisable_attribute[key as Type_customisable_container_attr] = !value

                  // Mettre à jour les composants associés
                  new_data.menu_configuration.updateAllComponentsRelatedToContainersStyles()
                }}
              >
                {t('Container.apparence.' + key) || t('LL.' + key) || key}
                {checked(value)}
              </MenuItem>
            )
          })}
        </MenuList>
      </Menu>
    )

    content_container_style = (
      <WrapperContainerStyleSelector new_data={new_data}>
        <>
          {/* 🆕 Ajout du menu des attributs personnalisables */}
          {content_container_customisable_attribute}

          <MenuConfigurationFreeLabelsOSP
            app_data={new_data}
            menu_for_style={true}
          />
        </>
      </WrapperContainerStyleSelector>
    )
  }

  return (
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_modal_styles_containers'}
      content={content_container_style}
      title={t('Menu.container_style')}
      maxW='20%'
      customPos={{ x: window.innerWidth * 0.59, y: window.innerHeight * 0.2 }}
    />
  )
}

export const WrapperContainerStyleSelector = ({
  new_data,
  children
}: {
  new_data: Class_ApplicationData
  children: JSX.Element
}) => {
  const { t, icon_library } = new_data
  const { icon_add_element, icon_remove_element, icon_open_selector } = icon_library
  const [_update, setUpdate] = useBoolean()

  // Shared refs for external components
  const { ref_selected_style_container } = new_data.menu_configuration

  // Dict of container styles
  const container_styles_dict = new_data.drawing_area.sankey.container_styles_dict

  return (
    <Box layerStyle='menuconfigpanel_grid'>
      <Box
        as='span'
        layerStyle='menustylepanel_row_droplist'
      >
        {/* Bouton pour ajouter un style */}
        <Button
          variant='menuconfigpanel_add_button'
          size='sizeConfigButton'
          onClick={() => {
            // Create default style
            const new_style = new_data.drawing_area.sankey.addNewDefaultContainerStyle()
            // Update Style config menu
            new_data.menu_configuration.ref_selected_style_container.current = new_style.id
            new_data.menu_configuration.updateAllComponentsRelatedToContainers()
            new_data.menu_configuration.updateAllComponentsRelatedToContainersStyles()
            // Need to save
            new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
            setUpdate.toggle()
          }}
        >
          {icon_add_element}
        </Button>

        {/* Liste déroulante pour sélectionner un style */}
        <Menu>
          <MenuButton
            as={Button}
            variant='menuconfigpanel_option_button'
            rightIcon={icon_open_selector}
          >
            {(ref_selected_style_container.current !== '') ?
              CutName(container_styles_dict[ref_selected_style_container.current].name, 30) :
              'Choix Style'
            }
          </MenuButton>
          <MenuList>
            {Object.keys(container_styles_dict).map(id => {
              return (
                <MenuItem
                  key={id}
                  onClick={() => {
                    // Update style appearance menu
                    new_data.menu_configuration.ref_selected_style_container.current = id
                    new_data.menu_configuration.updateAllComponentsRelatedToContainersStyles()
                    setUpdate.toggle()
                  }}
                >
                  {container_styles_dict[id].name}
                </MenuItem>
              )
            })}
          </MenuList>
        </Menu>

        {/* Bouton pour supprimer le style sélectionné */}
        <Button
          variant='menuconfigpanel_del_button'
          size='sizeConfigButton'
          isDisabled={(ref_selected_style_container.current === default_style_id)}
          onClick={() => {
            // Delete style - everything is done inside Sankey Class & ContainerStyle Class
            new_data.drawing_area.sankey.deleteContainerStyle(
              container_styles_dict[ref_selected_style_container.current]
            )
            // Fallback to default style
            new_data.menu_configuration.ref_selected_style_container.current = default_style_id
            new_data.menu_configuration.updateAllComponentsRelatedToContainers()
            new_data.menu_configuration.updateAllComponentsRelatedToContainersStyles()
            // Need to save
            new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
            setUpdate.toggle()
          }}
        >
          {icon_remove_element}
        </Button>
      </Box>

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
        display='flex'
        gap='0.4rem'
      >
        <Box
          layerStyle='menuconfigpanel_option_name'
          textStyle='h3'
        >
          {t('Menu.ns')}
        </Box>
        <Box flex='auto'>
          <InputGroup variant='menuconfigpanel_option_input'>
            <Input
              variant='menuconfigpanel_option_input'
              disabled={(ref_selected_style_container.current === default_style_id)}
              value={container_styles_dict[ref_selected_style_container.current].name}
              onChange={(evt) => {
                // Update current style name
                container_styles_dict[ref_selected_style_container.current].name = evt.target.value
                new_data.menu_configuration.updateAllComponentsRelatedToContainers()
                new_data.menu_configuration.updateAllComponentsRelatedToContainersStyles()
                // Need to save
                new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
              }}
            />
          </InputGroup>
        </Box>
      </Box>

      {children}
    </Box>
  )
}