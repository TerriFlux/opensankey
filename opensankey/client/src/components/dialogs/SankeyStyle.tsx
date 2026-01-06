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
import { MenuConfigurationLinkShape, MenuConfigurationContainerShape } from '../configmenus/MenuElementsShape'

import { MenuDraggable } from '../topmenus/SankeyMenus'
import { default_style_id } from '../../types/Utils'
import { MenuConfigurationNodeShape } from '../configmenus/MenuElementsShape'
import { MenuConfigurationNodeLabel, MenuConfigurationLinkLabel, MenuConfigurationContainersLabel } from '../configmenus/MenuElementsLabel'

import { checked } from './SankeyMenuContext'
import { isElementAttributeOverloaded, MenuResetAttrLocal, OSMultiSelect, OSTooltip, typeElementSelectable, WrapperBoxSubSectionMenu } from '../configmenus/MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_ElementStyle } from '../../Elements/Element'
import { Type_AdditionalMenus } from '../../types/MenuConfig'
import { Class_ContainerElement } from '../../Elements/TextZone'
import { LINKS_ATTRIBUTES_CONFIG, NODES_ATTRIBUTES_CONFIG, Type_customisable_flow_style_attr, Type_customisable_node_style_attr } from '../../Elements/ElementsAttributesConfig'

// ✅ COMPOSANT GÉNÉRIQUE POUR LES MODALES DE STYLE
const GenericModalStyle = ({
  new_data,
  elementType,
  additionalMenus
}: {
  new_data: Class_ApplicationData
  elementType: 'nodes' | 'links' | 'containers'
  additionalMenus?: MutableRefObject<Type_AdditionalMenus>
}) => {
  const { t } = new_data
  const [, setForceUpdate] = useBoolean()
  const [selectedStyleId, setSelectedStyleId] = useState(default_style_id)

  // ✅ Configuration selon le type
  const config = elementType === 'nodes' ? {
    stylesDict: new_data.drawing_area.sankey.node_styles_dict,
    selectedRef: new_data.menu_configuration.ref_selected_style_node,
    attributesConfig: NODES_ATTRIBUTES_CONFIG,
    updateStyleRef: new_data.menu_configuration.ref_to_menu_config_nodes_styles_editor_updater,
    updateStyle: () => new_data.menu_configuration.updateComponentRelatedToNodesStyles(),
    attributePrefix: 'Noeud',
    ShapeComponent: MenuConfigurationNodeShape,
    LabelComponent: MenuConfigurationNodeLabel,
    dialogShapeName: 'ref_setter_show_modal_styles_nodes_visual' as const,
    dialogLabelName: 'ref_setter_show_modal_styles_nodes_labels' as const,
    titleShape: 'Menu.esn',
    titleLabel: 'Menu.esn_labels'
  } : elementType === 'containers' ? {
    stylesDict: new_data.drawing_area.sankey.container_styles_dict,
    selectedRef: new_data.menu_configuration.ref_selected_style_container,
    attributesConfig: NODES_ATTRIBUTES_CONFIG, // Containers utilisent la même config que nodes
    updateStyleRef: new_data.menu_configuration.ref_to_menu_config_containers_styles_updater,
    updateStyle: () => new_data.menu_configuration.updateComponentRelatedToContainersStyles(),
    attributePrefix: 'Container',
    ShapeComponent: MenuConfigurationContainerShape,
    LabelComponent: MenuConfigurationContainersLabel,
    dialogShapeName: 'ref_setter_show_modal_styles_containers_visual' as const,
    dialogLabelName: 'ref_setter_show_modal_styles_containers_labels' as const,
    titleShape: 'Menu.esc',
    titleLabel: 'Menu.esc_labels'
  } : {
    stylesDict: new_data.drawing_area.sankey.link_styles_dict,
    selectedRef: new_data.menu_configuration.ref_selected_style_link,
    attributesConfig: LINKS_ATTRIBUTES_CONFIG,
    updateStyleRef: new_data.menu_configuration.ref_to_menu_config_links_styles_editor_updater,
    updateStyle: () => new_data.menu_configuration.updateComponentRelatedToLinksStyles(),
    attributePrefix: 'Flux',
    ShapeComponent: MenuConfigurationLinkShape,
    LabelComponent: MenuConfigurationLinkLabel,
    dialogShapeName: 'ref_setter_show_modal_styles_links_visual' as const,
    dialogLabelName: 'ref_setter_show_modal_styles_links_labels' as const,
    titleShape: 'Menu.esf',
    titleLabel: 'Menu.esf_labels'
  }

  config.updateStyleRef.current = setForceUpdate.toggle

  // Failsafe
  if (!(selectedStyleId in config.stylesDict)) {
    setSelectedStyleId(default_style_id)
  }

  const style_select = config.stylesDict[config.selectedRef.current]

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
              isDisabled={config.selectedRef.current == default_style_id}
              onClick={() => {
                if (ent[1]) {
                  style_select.deleteAttribute(ent[0] as keyof typeof config.attributesConfig)
                }
                style_select.customisable_attribute[ent[0] as keyof typeof config.attributesConfig] = !ent[1]
                config.updateStyle()
              }}
            >
              {t(`${config.attributePrefix}.apparence.${ent[0]}`)}
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
              isDisabled={config.selectedRef.current == default_style_id}
              onClick={() => {
                if (ent[1]) {
                  //@ts-expect-error xxx
                  delete style_select[ent[0] as Type_customisable_node_style_attr | Type_customisable_flow_style_attr]
                }
                style_select.customisable_attribute[ent[0] as keyof typeof config.attributesConfig] = !ent[1]
                config.updateStyle()
              }}
            >
              {t('Noeud.labels.' + labelOrValue)} {t(`${config.attributePrefix}.labels.${ent[0]}`)}
              {checked(ent[1])}
            </MenuItem>
          )
        })}
      </MenuList>
    </Menu>
  )

  const WrapperComponent = elementType === 'nodes'
    ? WrapperNodeStyleSelector
    : elementType === 'containers'
      ? WrapperContainerStyleSelector
      : WrapperLinkStyleSelector

  const content_style_shape = (
    <WrapperComponent new_data={new_data}>
      <>
        {content_customisable_attribute_style}
        <config.ShapeComponent
          app_data={new_data}
          new_data={new_data}
          menu_for_style={true}
          additional_menus={additionalMenus!}
        />
      </>
    </WrapperComponent>
  )

  const content_style_labels = (
    <WrapperComponent new_data={new_data}>
      <>
        {content_customisable_attribute_labels}
        <config.LabelComponent app_data={new_data} menu_for_style={true} />
      </>
    </WrapperComponent>
  )

  return (
    <>
      <MenuDraggable
        dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
        dialog_name={config.dialogShapeName}
        content={content_style_shape}
        title={t(config.titleShape)}
        maxW='20%'
        customPos={{ x: window.innerWidth * 0.59, y: window.innerHeight * 0.2 }}
      />
      <MenuDraggable
        dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
        dialog_name={config.dialogLabelName}
        content={content_style_labels}
        title={t(config.titleLabel)}
        maxW='20%'
        customPos={{ x: window.innerWidth * 0.59, y: window.innerHeight * 0.2 }}
      />
    </>
  )
}

// ✅ WRAPPERS POUR COMPATIBILITÉ
export const SankeyModalStyleNode = (props: {
  new_data: Class_ApplicationData
  additionalMenus: MutableRefObject<Type_AdditionalMenus>
}) => <GenericModalStyle {...props} elementType='nodes' />

export const SankeyModalStyleLink = (props: {
  new_data: Class_ApplicationData
  additionalMenus: MutableRefObject<Type_AdditionalMenus>
}) => <GenericModalStyle {...props} elementType='links' />

export const SankeyModalStyleContainer = (props: {
  new_data: Class_ApplicationData
  additionalMenus: MutableRefObject<Type_AdditionalMenus>
}) => <GenericModalStyle {...props} elementType='containers' />

// ✅ COMPOSANT GÉNÉRIQUE POUR LE WRAPPER DE SÉLECTEUR DE STYLE
const GenericStyleSelector = ({
  new_data,
  children,
  elementType
}: {
  new_data: Class_ApplicationData
  children: JSX.Element
  elementType: 'nodes' | 'links' | 'containers'
}) => {
  const { t, icon_library } = new_data
  const { icon_add_element, icon_remove_element, icon_open_selector } = icon_library

  const config = elementType === 'nodes' ? {
    stylesDict: new_data.drawing_area.sankey.node_styles_dict,
    selectedRef: new_data.menu_configuration.ref_selected_style_node,
    addNewStyle: () => new_data.drawing_area.sankey.addNewDefaultNodeStyle(),
    deleteStyle: (style: Class_ElementStyle) => new_data.drawing_area.sankey.deleteNodeStyle(style),
    updateAll: () => {
      new_data.menu_configuration.updateAllComponentsRelatedToNodes()
      new_data.menu_configuration.updateComponentRelatedToNodesStyles()
    }
  } : elementType === 'containers' ? {
    stylesDict: new_data.drawing_area.sankey.container_styles_dict,
    selectedRef: new_data.menu_configuration.ref_selected_style_container,
    addNewStyle: () => new_data.drawing_area.sankey.addNewDefaultContainerStyle(),
    deleteStyle: (style: Class_ElementStyle) => new_data.drawing_area.sankey.deleteContainerStyle(style),
    updateAll: () => {
      new_data.menu_configuration.updateAllComponentsRelatedToContainers()
      new_data.menu_configuration.updateComponentRelatedToContainersStyles()
    }
  } : {
    stylesDict: new_data.drawing_area.sankey.link_styles_dict,
    selectedRef: new_data.menu_configuration.ref_selected_style_link,
    addNewStyle: () => new_data.drawing_area.sankey.addNewDefaultLinkStyle(),
    deleteStyle: (style: Class_ElementStyle) => new_data.drawing_area.sankey.deleteLinkStyle(style),
    updateAll: () => {
      new_data.menu_configuration.updateComponentRelatedToLinksApparence()
      new_data.menu_configuration.updateComponentRelatedToLinksStyles()
    }
  }

  return (
    <Box layerStyle='menuconfigpanel_grid'>
      <Box as='span' layerStyle='menustylepanel_row_droplist'>
        {/* Bouton pour ajouter un style */}
        <Button
          variant='menuconfigpanel_add_button'
          size='sizeConfigButton'
          onClick={() => {
            const new_style = config.addNewStyle()
            config.selectedRef.current = new_style.id
            config.updateAll()
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
            {config.selectedRef.current !== ''
              ? CutName(config.stylesDict[config.selectedRef.current].name, 30)
              : 'Choix Style'}
          </MenuButton>
          <MenuList>
            {Object.keys(config.stylesDict).map(id => (
              <MenuItem
                key={id}
                onClick={() => {
                  config.selectedRef.current = id
                  config.updateAll()
                }}
              >
                {config.stylesDict[id].name}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        {/* Bouton pour supprimer le style sélectionné */}
        <Button
          variant='menuconfigpanel_del_button'
          size='sizeConfigButton'
          isDisabled={config.selectedRef.current === default_style_id}
          onClick={() => {
            config.deleteStyle(config.stylesDict[config.selectedRef.current])
            config.selectedRef.current = default_style_id
            config.updateAll()
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
              disabled={config.selectedRef.current === default_style_id}
              value={config.stylesDict[config.selectedRef.current].name}
              onChange={(evt) => {
                config.stylesDict[config.selectedRef.current].name = evt.target.value
                config.updateAll()
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

// ✅ WRAPPERS POUR COMPATIBILITÉ
export const WrapperNodeStyleSelector = (props: {
  new_data: Class_ApplicationData
  children: JSX.Element
}) => <GenericStyleSelector {...props} elementType='nodes' />

export const WrapperLinkStyleSelector = (props: {
  new_data: Class_ApplicationData
  children: JSX.Element
}) => <GenericStyleSelector {...props} elementType='links' />

export const WrapperContainerStyleSelector = (props: {
  new_data: Class_ApplicationData
  children: JSX.Element
}) => <GenericStyleSelector {...props} elementType='containers' />

// ✅ COMPOSANT GÉNÉRIQUE UNIFIÉ POUR LA CONFIGURATION DES STYLES
export const ConfigMenuStyleElement = ({ 
  app_data, 
  selected_elements, 
  config, 
  categories, 
  nodesOrLinks 
}: {
  app_data: Class_ApplicationData
  selected_elements: Class_LinkElement[] | Class_NodeElement[] | Class_ContainerElement[]
  config: typeof LINKS_ATTRIBUTES_CONFIG | typeof NODES_ATTRIBUTES_CONFIG
  categories: string[]
  nodesOrLinks: 'nodes' | 'links' | 'zdt'
}) => {
  const { t, icon_library, drawing_area, menu_configuration } = app_data
  const { sankey } = drawing_area
  const { 
    ref_selected_style_link, 
    ref_selected_style_node, 
    ref_selected_style_container, 
    dict_setter_show_dialog 
  } = menu_configuration
  
  const {
    ref_setter_show_modal_styles_links_visual, 
    ref_setter_show_modal_styles_nodes_visual, 
    ref_setter_show_modal_styles_containers_visual,
    ref_setter_show_modal_styles_links_labels, 
    ref_setter_show_modal_styles_nodes_labels, 
    ref_setter_show_modal_styles_containers_labels
  } = dict_setter_show_dialog

  const element_ref = selected_elements[0]

  // ✅ Configuration selon le type
  const typeConfig = nodesOrLinks === 'nodes' ? {
    stylesList: sankey.node_styles_list,
    selectedRef: ref_selected_style_node,
    updateStyles: () => menu_configuration.updateComponentRelatedToNodesStyles(),
    switchStyle: (style: Class_ElementStyle, selected: boolean) => 
      sankey.switchNodeStyle(style as Class_ElementStyle, selected),
    visualModal: ref_setter_show_modal_styles_nodes_visual,
    labelsModal: ref_setter_show_modal_styles_nodes_labels
  } : nodesOrLinks === 'links' ? {
    stylesList: sankey.link_styles_list,
    selectedRef: ref_selected_style_link,
    updateStyles: () => menu_configuration.updateComponentRelatedToLinksStyles(),
    switchStyle: (style: Class_ElementStyle, selected: boolean) => 
      sankey.switchLinkStyle(style as Class_ElementStyle, selected),
    visualModal: ref_setter_show_modal_styles_links_visual,
    labelsModal: ref_setter_show_modal_styles_links_labels
  } : {
    stylesList: sankey.container_styles_list,
    selectedRef: ref_selected_style_container,
    updateStyles: () => menu_configuration.updateComponentRelatedToContainersStyles(),
    switchStyle: (style: Class_ElementStyle, selected: boolean) => 
      sankey.switchContainerStyle(style as Class_ElementStyle, selected),
    visualModal: ref_setter_show_modal_styles_containers_visual,
    labelsModal: ref_setter_show_modal_styles_containers_labels
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

  const options_selector: typeElementSelectable = typeConfig.stylesList.map(style => {
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
              nodesOrLinks={nodesOrLinks} 
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
                  typeConfig.selectedRef.current = [...style].reverse()[0].id
                }
              }
              
              typeConfig.updateStyles()
              if (categories.includes('shape')) {
                typeConfig.visualModal.current(true)
              } else {
                typeConfig.labelsModal.current(true)
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
              typeConfig.stylesList.forEach(style => {
                typeConfig.switchStyle(style, entries_values.includes(style.id))
              })
            }}
          />
        </Box>
        
        <MenuOrderStylesOfSelectedElements app_data={app_data} nodesOrLinks={nodesOrLinks} />
      </>
    </WrapperBoxSubSectionMenu>
  )
}

// ✅ WRAPPER POUR COMPATIBILITÉ (maintenant juste un alias)
export const ConfigMenuStyleElementContainer = ConfigMenuStyleElement

const style_TableLineDragging = (isDisabled: boolean, draggableStyle: DraggingStyle | NotDraggingStyle | undefined) => ({
  background: isDisabled ? 'lightgrey' : 'unset',
  ...draggableStyle
})

/**
 * ✅ Composant unifié pour modifier l'ordre des styles (nodes, links, containers)
 */
export const MenuOrderStylesOfSelectedElements = ({ 
  app_data, 
  nodesOrLinks 
}: {
  app_data: Class_ApplicationData
  nodesOrLinks: 'nodes' | 'links' | 'zdt'
}) => {
  const { drawing_area, t, icon_library, menu_configuration } = app_data
  const { icon_move_element_down, icon_move_element_up } = icon_library
  
  // ✅ Sélection des éléments selon le type
  const elements = nodesOrLinks === 'nodes' 
    ? drawing_area.selected_nodes_list
    : nodesOrLinks === 'links'
    ? drawing_area.selected_links_list
    : drawing_area.selected_containers_list

  const style_list_to_use = elements[0]?.style?.slice().reverse() ?? []

  if (style_list_to_use.length === 0) {
    return <></>
  }

  // ✅ Configuration des fonctions selon le type
  const moveOrderStyle = (style_src: any, style_trgt: any) => {
    if (nodesOrLinks === 'nodes') {
      drawing_area.moveOrderStyleInSelectedNodes(style_src as Class_ElementStyle, style_trgt as Class_ElementStyle)
      menu_configuration.updateComponentRelatedToNodesApparence()
    } else if (nodesOrLinks === 'links') {
      drawing_area.moveOrderStyleInSelectedFlows(style_src as Class_ElementStyle, style_trgt as Class_ElementStyle)
      menu_configuration.updateComponentRelatedToLinksApparence()
    } else if (nodesOrLinks === 'zdt') {
      drawing_area.moveOrderStyleInSelectedContainers(style_src as Class_ElementStyle, style_trgt as Class_ElementStyle)
      menu_configuration.updateComponentRelatedToContainersApparence()
    }
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

// ✅ WRAPPER POUR COMPATIBILITÉ (maintenant juste un alias)
export const MenuOrderStylesOfSelectedContainers = ({ app_data }: { app_data: Class_ApplicationData }) => 
  <MenuOrderStylesOfSelectedElements app_data={app_data} nodesOrLinks='zdt' />