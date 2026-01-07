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

import React, { useState, MutableRefObject } from 'react'

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
import { DragDropContext, Draggable, DraggingStyle, Droppable, NotDraggingStyle } from 'react-beautiful-dnd'
import { ChevronDownIcon } from '@chakra-ui/icons'
import {
  CutName
} from '../../types/Utils'

import { MenuDraggable } from '../topmenus/SankeyMenus'
import { default_style_id } from '../../types/Utils'
import { MenuConfigurationAppearance } from '../configmenus/MenuElementsAppearance'

import { checked } from './SankeyMenuContext'
import { isElementAttributeOverloaded, MenuResetAttrLocal, OSMultiSelect, OSTooltip, typeElementSelectable, WrapperBoxSubSectionMenu } from '../configmenus/MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_ElementStyle } from '../../Elements/Element'
import { Type_AdditionalMenus } from '../../types/MenuConfig'
import { Class_ContainerElement } from '../../Elements/TextZone'
import { ALL_ATTRIBUTES_CONFIG } from '../../Elements/ElementsAttributesConfig'

// ✅ COMPOSANT GÉNÉRIQUE POUR LES MODALES DE STYLE
export const GenericModalStyle = ({
  new_data
}: {
  new_data: Class_ApplicationData
}) => {
  const { t } = new_data
  const [, setForceUpdate] = useBoolean()
  const [selectedStyleId, setSelectedStyleId] = useState(default_style_id)

  // // ✅ Configuration selon le type
  // const config = elementType === 'nodes' ? {
  //   updateStyle: () => new_data.menu_configuration.updateComponentRelatedToStyles(),
  //   attributePrefix: 'Noeud',
  //   titleShape: 'Menu.esn',
  //   titleLabel: 'Menu.esn_labels'
  // } : elementType === 'containers' ? {
  //   updateStyle: () => new_data.menu_configuration.updateComponentRelatedToStyles(),
  //   attributePrefix: 'Container',
  //   titleShape: 'Menu.esc',
  //   titleLabel: 'Menu.esc_labels'
  // } : {
  //   updateStyle: () => new_data.menu_configuration.updateComponentRelatedToStyles(),
  //   attributePrefix: 'Flux',
  //   titleShape: 'Menu.esf',
  //   titleLabel: 'Menu.esf_labels'
  // }

  new_data.menu_configuration.ref_to_menu_config_styles_editor_updater.current = setForceUpdate.toggle

  // Failsafe
  if (!(selectedStyleId in new_data.drawing_area.sankey.styles_dict)) {
    setSelectedStyleId(default_style_id)
  }

  const style_select = new_data.drawing_area.sankey.styles_dict[new_data.menu_configuration.ref_selected_style.current]

  // ✅ Menu des attributs personnalisables pour la forme
  const content_customisable_attribute_style = (
    <Menu direction='rtl' placement='left' closeOnSelect={false}>
      <OSTooltip label={t('Menu.tooltips.style_attr_applicated')}>
        <MenuButton as={Button} variant='menuconfigpanel_option_button'>
          {t('Menu.style_attr_applicated')}
          <ChevronDownIcon />
        </MenuButton>
      </OSTooltip>
      <MenuList maxH='40vh' overflow='auto'>
        {Object.entries(style_select.customisable_attribute).map(ent => {
          if (!ent[0].includes('shape_')) return <></>

          return (
            <MenuItem
              key={ent[0]}
              style={{ display: 'flex' }}
              isDisabled={new_data.menu_configuration.ref_selected_style.current == default_style_id}
              onClick={() => {
                if (ent[1]) {
                  style_select.deleteAttribute(ent[0] as keyof typeof ALL_ATTRIBUTES_CONFIG)
                }
                style_select.customisable_attribute[ent[0] as keyof typeof ALL_ATTRIBUTES_CONFIG] = !ent[1]
                new_data.menu_configuration.updateComponentRelatedToStyles()
              }}
            >
              {t(`Noeud.apparence.${ent[0]}`)}
              {checked(ent[1])}
            </MenuItem>
          )
        })}
      </MenuList>
    </Menu>
  )

  // ✅ Menu des attributs personnalisables pour les labels
  const content_customisable_attribute_labels = (
    <Menu direction='rtl' placement='left' closeOnSelect={false}>
      <OSTooltip label={t('Menu.tooltips.style_attr_applicated')}>
        <MenuButton as={Button} variant='menuconfigpanel_option_button'>
          {t('Menu.style_attr_applicated')}
          <ChevronDownIcon />
        </MenuButton>
      </OSTooltip>
      <MenuList maxH='40vh' overflow='auto'>
        {Object.entries(style_select.customisable_attribute).map(ent => {
          if (ent[0].includes('shape_')) return <></>

          const labelOrValue = ent[0].includes('name_') ? 'name_label_is_visible' : 'value_label_is_visible'

          return (
            <MenuItem
              key={ent[0]}
              style={{ display: 'flex' }}
              isDisabled={new_data.menu_configuration.ref_selected_style.current == default_style_id}
              onClick={() => {
                if (ent[1]) {
                  //@ts-expect-error xxx
                  delete style_select[ent[0] as Type_customisable_node_style_attr | Type_customisable_flow_style_attr]
                }
                style_select.customisable_attribute[ent[0] as keyof typeof ALL_ATTRIBUTES_CONFIG] = !ent[1]
                new_data.menu_configuration.updateComponentRelatedToStyles()
              }}
            >
              {t('Noeud.labels.' + labelOrValue)} {t(`Noeud.labels.${ent[0]}`)}
              {checked(ent[1])}
            </MenuItem>
          )
        })}
      </MenuList>
    </Menu>
  )

  const content_style_shape = (
    <GenericStyleSelector new_data={new_data}>
      <>
        {content_customisable_attribute_style}
        <MenuConfigurationAppearance
          app_data={new_data}
          menu_for_style={true}
        />
      </>
    </GenericStyleSelector>
  )

  const content_style_labels = (
    <GenericStyleSelector new_data={new_data}>
      <>
        {content_customisable_attribute_labels}
        <MenuConfigurationAppearance app_data={new_data} menu_for_style={true} />
      </>
    </GenericStyleSelector>
  )

  return (
    <>
      <MenuDraggable
        dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
        dialog_name={'ref_setter_show_modal_styles_visual'}
        content={content_style_shape}
        title={t('Menu.esn')}
        maxW='20%'
        customPos={{ x: window.innerWidth * 0.59, y: window.innerHeight * 0.2 }}
      />
      <MenuDraggable
        dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
        dialog_name={'ref_setter_show_modal_styles_labels'}
        content={content_style_labels}
        title={t('Menu.esn_labels')}
        maxW='20%'
        customPos={{ x: window.innerWidth * 0.59, y: window.innerHeight * 0.2 }}
      />
    </>
  )
}

// ✅ COMPOSANT GÉNÉRIQUE POUR LE WRAPPER DE SÉLECTEUR DE STYLE
export const GenericStyleSelector = ({new_data,children}: React.PropsWithChildren<{
  new_data: Class_ApplicationData
  children: JSX.Element
}>) => {
  const { t, icon_library } = new_data
  const { icon_add_element, icon_remove_element, icon_open_selector } = icon_library

  // const config = elementType === 'nodes' ? {
  //   selectedRef: new_data.menu_configuration.ref_selected_style,
  const updateAll = () => {
      new_data.menu_configuration.updateAllComponentsRelatedToNodes()
      new_data.menu_configuration.updateComponentRelatedToStyles()
      new_data.menu_configuration.updateAllComponentsRelatedToContainers()
      new_data.menu_configuration.updateComponentRelatedToLinksApparence()
    }
  

  return (
    <Box layerStyle='menuconfigpanel_grid'>
      <Box as='span' layerStyle='menustylepanel_row_droplist'>
        {/* Bouton pour ajouter un style */}
        <Button
          variant='menuconfigpanel_add_button'
          size='sizeConfigButton'
          onClick={() => {
            const new_style = new_data.drawing_area.sankey.addNewDefaultElementStyle()
            new_data.menu_configuration.ref_selected_style.current = new_style.id
            updateAll()
            new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
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
            {new_data.menu_configuration.ref_selected_style.current !== ''
              ? CutName(new_data.drawing_area.sankey.styles_dict[new_data.menu_configuration.ref_selected_style.current].name, 30)
              : 'Choix Style'}
          </MenuButton>
          <MenuList>
            {Object.keys(new_data.drawing_area.sankey.styles_dict).map(id => (
              <MenuItem
                key={id}
                onClick={() => {
                  new_data.menu_configuration.ref_selected_style.current = id
                  updateAll()
                }}
              >
                {new_data.drawing_area.sankey.styles_dict[id].name}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        {/* Bouton pour supprimer le style sélectionné */}
        <Button
          variant='menuconfigpanel_del_button'
          size='sizeConfigButton'
          isDisabled={new_data.menu_configuration.ref_selected_style.current === default_style_id}
          onClick={() => {
            new_data.drawing_area.sankey.deleteElementStyle(new_data.drawing_area.sankey.styles_dict[new_data.menu_configuration.ref_selected_style.current])
            new_data.menu_configuration.ref_selected_style.current = default_style_id
            updateAll()
            new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
          }}
        >
          {icon_remove_element}
        </Button>
      </Box>

      <Box as='span' layerStyle='menuconfigpanel_row_2cols' display='flex' gap='0.4rem'>
        <Box layerStyle='menuconfigpanel_option_name' textStyle='h3'>
          {t('Menu.ns')}
        </Box>
        <Box flex='auto'>
          <InputGroup variant='menuconfigpanel_option_input'>
            <Input
              variant='menuconfigpanel_option_input'
              disabled={new_data.menu_configuration.ref_selected_style.current === default_style_id}
              value={new_data.drawing_area.sankey.styles_dict[new_data.menu_configuration.ref_selected_style.current].name}
              onChange={(evt) => {
                new_data.drawing_area.sankey.styles_dict[new_data.menu_configuration.ref_selected_style.current].name = evt.target.value
                updateAll()
                new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
              }}
            />
          </InputGroup>
        </Box>
      </Box>

      {children}
    </Box>
  )
}

// ✅ COMPOSANT GÉNÉRIQUE UNIFIÉ POUR LA CONFIGURATION DES STYLES
export const ConfigMenuStyleElement = ({ 
  app_data, 
  selected_elements, 
  config, 
  categories
}: {
  app_data: Class_ApplicationData
  selected_elements: Class_LinkElement[] | Class_NodeElement[] | Class_ContainerElement[]
  config: typeof ALL_ATTRIBUTES_CONFIG
  categories: string[]
}) => {
  const { t, icon_library, drawing_area, menu_configuration } = app_data
  const { sankey } = drawing_area
  const { 
    ref_selected_style,
    dict_setter_show_dialog 
  } = menu_configuration
  
  const {
    ref_setter_show_modal_styles_visual, 
    ref_setter_show_modal_styles_labels, 
  } = dict_setter_show_dialog

  const element_ref = selected_elements[0]

  const updateStyles = () => {
    menu_configuration.updateComponentRelatedToStyles()
  }

  const dict_overwritted_attr: { [_: string]: { overloaded: boolean, name: string } } = {}
  Object.entries(config).forEach(([key, config]) => {
    if (categories.some(_ => _ === config.category)) {
      const label_text = config.labels[(app_data.language ?? 'fr') as 'fr' | 'en']
      dict_overwritted_attr[key] = {
        //@ts-expect-error xxx
        overloaded: isElementAttributeOverloaded(selected_elements, key, config),
        name: label_text
      }
    }
  })

  const options_selector: typeElementSelectable = sankey.styles_list.map(style => {
    return {
      value: style.id,
      label: style.name,
      selected: element_ref?.style.includes(style) ?? false,
      disabled: style.id == default_style_id,
    }
  })

  return (
    <WrapperBoxSubSectionMenu new_data={app_data} title={t('Noeud.Style')} is_open={false}>
      <>
        <Box layerStyle='menuconfigpanel_row_stylechoice'>
          <OSTooltip label={t('Noeud.tooltips.AS')}>
            <MenuResetAttrLocal 
              new_data={app_data}
              dict_overwritted_attr={dict_overwritted_attr} 
            />
          </OSTooltip>
          
          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              if (selected_elements.length !== 0) {
                const style = selected_elements[0].style
                const list_id_style = style.map(s => s.id)
                let unchanged = true
                
                selected_elements.forEach(el => {
                  unchanged = el.style.every(style => list_id_style.includes(style.id)) ? unchanged : false
                })
                
                if (unchanged) {
                  ref_selected_style.current = [...style].reverse()[0].id
                }
              }
              
              updateStyles()
              if (categories.includes('shape')) {
                ref_setter_show_modal_styles_visual.current(true)
              } else {
                ref_setter_show_modal_styles_labels.current(true)
              }
            }}
          >
            {icon_library.icon_edit_style}
          </Button>
          
          <OSMultiSelect
            t={t}
            elements={options_selector}
            onClick={(entries) => {
              const entries_values = entries.map(d => d.value)
              sankey.styles_list.forEach(style => {
                sankey.switchElementStyle(style, entries_values.includes(style.id))
              })
            }}
          />
        </Box>
        
        <MenuOrderStylesOfSelectedElements app_data={app_data} />
      </>
    </WrapperBoxSubSectionMenu>
  )
}

const style_TableLineDragging = (isDisabled: boolean, draggableStyle: DraggingStyle | NotDraggingStyle | undefined) => ({
  background: isDisabled ? 'lightgrey' : 'unset',
  ...draggableStyle
})

/**
 * ✅ Composant unifié pour modifier l'ordre des styles (nodes, links, containers)
 */
export const MenuOrderStylesOfSelectedElements = ({ app_data}: {app_data: Class_ApplicationData}) => {
  const { drawing_area, t, icon_library, menu_configuration } = app_data
  const { icon_move_element_down, icon_move_element_up } = icon_library
  
  // ✅ Sélection des éléments selon le type
  const elements = drawing_area.selected_elements_list

  const style_list_to_use = elements[0]?.style?.slice().reverse() ?? []

  if (style_list_to_use.length === 0) {
    return <></>
  }

  // ✅ Configuration des fonctions selon le type
  const moveOrderStyle = (style_src: any, style_trgt: any) => {
    drawing_area.moveOrderStyleInSelectedElements(style_src as Class_ElementStyle, style_trgt as Class_ElementStyle)
    menu_configuration.updateComponentRelatedToNodesApparence()
    menu_configuration.updateComponentRelatedToLinksApparence()
    menu_configuration.updateComponentRelatedToContainersApparence()
  }

  return (
    <WrapperBoxSubSectionMenu is_open={false} new_data={app_data} title={t('Noeud.OrderStyle')}>
      <DragDropContext onDragEnd={(evt) => {
        if (evt.destination?.index == undefined) return

        // On ne peut pas mettre un style avant le style par défaut
        let dest_to_use = evt.destination.index
        if (dest_to_use == style_list_to_use.length - 1) {
          dest_to_use = style_list_to_use.length - 2
        }

        const style_src = style_list_to_use[evt.source.index]
        const style_trgt = style_list_to_use[dest_to_use]
        moveOrderStyle(style_src, style_trgt)
      }}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <Box
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{ display: 'grid', gridRowGap: '0.2rem' }}
            >
              {style_list_to_use.map((style, element_idx) => {
                const draggDisabled = style.id == default_style_id

                return (
                  <Draggable 
                    isDragDisabled={draggDisabled} 
                    key={style.id} 
                    index={element_idx} 
                    draggableId={'line_drag_' + style.id}
                  >
                    {(provided) => (
                      <Box 
                        key={style.id} 
                        layerStyle='drag_line_element_order' 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={style_TableLineDragging(draggDisabled, provided.draggableProps.style)}
                      >
                        <Box className='name_element'>{style.name}</Box>
                        <Box layerStyle="options_2cols">
                          <Button
                            isDisabled={draggDisabled || element_idx == 0}
                            variant='menuconfigpanel_move_order_node_io'
                            minWidth='0'
                            onClick={() => {
                              const style_src = style_list_to_use[element_idx]
                              const style_trgt = style_list_to_use[element_idx - 1]
                              moveOrderStyle(style_src, style_trgt)
                            }}
                          >
                            {icon_move_element_up}
                          </Button>
                          <Button
                            isDisabled={element_idx == style_list_to_use.length - 2 || draggDisabled}
                            variant='menuconfigpanel_move_order_node_io'
                            minWidth='0'
                            onClick={() => {
                              const style_src = style_list_to_use[element_idx]
                              const style_trgt = style_list_to_use[element_idx + 1]
                              moveOrderStyle(style_src, style_trgt)
                            }}
                          >
                            {icon_move_element_down}
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>
    </WrapperBoxSubSectionMenu>
  )
}