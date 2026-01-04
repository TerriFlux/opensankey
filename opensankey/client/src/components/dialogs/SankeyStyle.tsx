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
import { MenuConfigurationLinkShape } from '../configmenus/SankeyMenuConfigurationLinksShape'

import { MenuDraggable } from '../topmenus/SankeyMenus'
import { default_style_id } from '../../types/Utils'
import { MenuConfigurationNodeStyle } from '../configmenus/SankeyMenuConfigurationNodesShape'
import { MenuConfigurationNodeLabel, MenuConfigurationLinkLabel, MenuConfigurationContainersLabel } from '../configmenus/MenuConfigurationElementsLabel'

import { checked } from './SankeyMenuContext'
import { isElementAttributeOverloaded, MenuResetAttrLocal, OSMultiSelect, OSTooltip, typeElementSelectable, WrapperBoxSubSectionMenu } from '../configmenus/MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_NodeStyle, Class_LinkStyle } from '../../Elements/Element'
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
    ShapeComponent: MenuConfigurationNodeStyle,
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
    ShapeComponent: MenuConfigurationNodeStyle, // Containers utilisent le même composant que nodes
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
                  //@ts-expect-error xxx
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
    deleteStyle: (style: Class_NodeStyle) => new_data.drawing_area.sankey.deleteNodeStyle(style),
    updateAll: () => {
      new_data.menu_configuration.updateAllComponentsRelatedToNodes()
      new_data.menu_configuration.updateComponentRelatedToNodesStyles()
    }
  } : elementType === 'containers' ? {
    stylesDict: new_data.drawing_area.sankey.container_styles_dict,
    selectedRef: new_data.menu_configuration.ref_selected_style_container,
    addNewStyle: () => new_data.drawing_area.sankey.addNewDefaultContainerStyle(),
    deleteStyle: (style: Class_NodeStyle) => new_data.drawing_area.sankey.deleteContainerStyle(style),
    updateAll: () => {
      new_data.menu_configuration.updateAllComponentsRelatedToContainers()
      new_data.menu_configuration.updateComponentRelatedToContainersStyles()
    }
  } : {
    stylesDict: new_data.drawing_area.sankey.link_styles_dict,
    selectedRef: new_data.menu_configuration.ref_selected_style_link,
    addNewStyle: () => new_data.drawing_area.sankey.addNewDefaultLinkStyle(),
    deleteStyle: (style: Class_LinkStyle) => new_data.drawing_area.sankey.deleteLinkStyle(style),
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
            //@ts-expect-error xxx
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

export const ConfigMenuStyleElement = ({ app_data, selected_elements, config, categories, nodesOrLinks }:
  {
    app_data: Class_ApplicationData
    selected_elements: Class_LinkElement[] | Class_NodeElement[] | Class_ContainerElement[],
    config: typeof LINKS_ATTRIBUTES_CONFIG | typeof NODES_ATTRIBUTES_CONFIG,
    categories: string[],
    nodesOrLinks: 'nodes' | 'links' | 'zdt'
  }) => {
  const { t, icon_library, drawing_area, menu_configuration } = app_data
  const { sankey } = drawing_area
  const { ref_selected_style_link, ref_selected_style_node, ref_selected_style_container, dict_setter_show_dialog } = menu_configuration
  const {
    ref_setter_show_modal_styles_links_visual, ref_setter_show_modal_styles_nodes_visual, ref_setter_show_modal_styles_containers_visual,
    ref_setter_show_modal_styles_links_labels, ref_setter_show_modal_styles_nodes_labels, ref_setter_show_modal_styles_containers_labels
  } = dict_setter_show_dialog

  const element_ref = selected_elements[0]

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

  let style_list = sankey.node_styles_list
  if (nodesOrLinks == 'nodes') sankey.node_styles_list
  if (nodesOrLinks == 'links') sankey.link_styles_list
  if (nodesOrLinks == 'zdt') sankey.container_styles_list

  const options_selector: typeElementSelectable = style_list.map(style => {
    return {
      value: style.id,
      label: style.name,
      //@ts-expect-error xxx
      selected: element_ref?.style.includes(style) ?? false,
      disabled: style.id == default_style_id,
    }
  })

  return <WrapperBoxSubSectionMenu new_data={app_data} title={t('Noeud.Style')} is_open={false} ><>
    <Box layerStyle='menuconfigpanel_row_stylechoice' >
      <OSTooltip label={t('Noeud.tooltips.AS')}>
        <MenuResetAttrLocal new_data={app_data} nodesOrLinks={nodesOrLinks} dict_overwritted_attr={dict_overwritted_attr} />
      </OSTooltip>
      <Button
        variant='menuconfigpanel_option_button'
        onClick={() => {
          if (selected_elements.length !== 0) {
            const style = selected_elements[0].style
            const list_id_style = style.map(s => s.id)
            let inchangee = true
            selected_elements.map(el => {
              inchangee = (el.style.every(style => list_id_style.includes(style.id))) ? inchangee : false
            })
            if (inchangee) {
              if (nodesOrLinks == 'nodes')
                ref_selected_style_node.current = [...style].reverse()[0].id
            } else if (nodesOrLinks == 'links') {
              ref_selected_style_link.current = [...style].reverse()[0].id
            } else if (nodesOrLinks == 'zdt') {
              ref_selected_style_container.current = [...style].reverse()[0].id
            }
          }
          if (nodesOrLinks == 'nodes') {
            app_data.menu_configuration.updateComponentRelatedToNodesStyles()
            if (categories.includes('shape')) ref_setter_show_modal_styles_nodes_visual.current(true)
            else ref_setter_show_modal_styles_nodes_labels.current(true)
          } else {
            app_data.menu_configuration.updateComponentRelatedToLinksStyles()
            if (categories.includes('shape')) ref_setter_show_modal_styles_links_visual.current(true)
            else ref_setter_show_modal_styles_links_labels.current(true)
          }

        }}
      >
        {icon_library.icon_edit_style}
      </Button>
      <OSMultiSelect
        t={t}
        elements={options_selector}
        onClick={(entries) => {
          // Update selection list
          const entries_values = entries.map(d => d.value)
          if (nodesOrLinks == 'nodes') {
            sankey.node_styles_list.forEach(style => {
              sankey.switchNodeStyle(style, entries_values.includes(style.id))
            })
          } else if (nodesOrLinks == 'links') {
            sankey.link_styles_list.forEach(style => {
              sankey.switchLinkStyle(style, entries_values.includes(style.id))
            })
          } else if (nodesOrLinks == 'zdt') {
            sankey.container_styles_list.forEach(style => {
              sankey.switchContainerStyle(style, entries_values.includes(style.id))
            })
          }
        }}
      />
    </Box>
    <MenuOrderStylesOfSelectedElements app_data={app_data} nodesOrLinks={nodesOrLinks} />
  </>
  </WrapperBoxSubSectionMenu>
}

const style_TableLineDragging = (isDisabled: boolean, draggableStyle: DraggingStyle | NotDraggingStyle | undefined) => ({
  // change background colour if dragging
  background: isDisabled ? 'lightgrey' : 'unset',
  // styles we need to apply on draggables
  ...draggableStyle
})

/**
* Component to modify order of style in selected elements,
* it take first selected flow has reference to which style must go before/after which style
* (because order of style can be different between flow)
*
* @param {*} { new_data }
* @return {*}
*/
export const MenuOrderStylesOfSelectedElements = ({ app_data, nodesOrLinks }: {
  app_data: Class_ApplicationData
  nodesOrLinks: 'nodes' | 'links' | 'zdt'
}) => {
  const { drawing_area, t, icon_library, menu_configuration } = app_data
  const { icon_move_element_down, icon_move_element_up } = icon_library
  let elements = drawing_area.selected_nodes_list as Class_NodeElement[] | Class_LinkElement[] | Class_ContainerElement[]
  if (nodesOrLinks === 'nodes') {
    elements = drawing_area.selected_nodes_list
  } else if (nodesOrLinks === 'links') {
    elements = drawing_area.selected_links_list
  } else if (nodesOrLinks === 'zdt') {
    elements = drawing_area.selected_containers_list
  }

  const style_list_to_use = elements[0]?.style.slice().reverse() ?? []

  return <WrapperBoxSubSectionMenu is_open={false} new_data={app_data} title={t('Noeud.OrderStyle')} >
    <DragDropContext onDragEnd={(evt) => {
      if (evt.destination?.index == undefined)
        return //early return if problem

      // We can't put a style before default style in flow style order
      let dest_to_use = evt.destination.index
      if (dest_to_use == style_list_to_use.length - 1)
        dest_to_use = style_list_to_use.length - 2

      const style_src = style_list_to_use[evt.source.index]
      const style_trgt = style_list_to_use[dest_to_use]
      if (nodesOrLinks === 'nodes')
        drawing_area.moveOrderStyleInSelectedNodes(style_src as Class_NodeStyle, style_trgt as Class_NodeStyle)
      else if (nodesOrLinks === 'links')
        drawing_area.moveOrderStyleInSelectedFlows(style_src as Class_LinkStyle, style_trgt as Class_LinkStyle)
      else if (nodesOrLinks === 'zdt')
        drawing_area.moveOrderStyleInSelectedContainers(style_src as Class_NodeStyle, style_trgt as Class_NodeStyle)
    }}>
      <Droppable droppableId="droppable">
        {(provided,) => (
          <Box
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{ display: 'grid', gridRowGap: '0.2rem' }}
          >
            {
              style_list_to_use
                .map((style, element_idx) => {

                  const draggDisabled = style.id == default_style_id

                  return (
                    <Draggable isDragDisabled={draggDisabled} key={style.id} index={element_idx} draggableId={'line_drag_' + style.id}>
                      {(provided, _) => (
                        <Box key={style.id} layerStyle='drag_line_element_order' ref={provided.innerRef}
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
                                if (nodesOrLinks === 'nodes') {
                                  drawing_area.moveOrderStyleInSelectedNodes(style_src as Class_NodeStyle, style_trgt as Class_NodeStyle)
                                  menu_configuration.updateComponentRelatedToNodesApparence()
                                } else if (nodesOrLinks === 'links') {
                                  drawing_area.moveOrderStyleInSelectedFlows(style_src as Class_LinkStyle, style_trgt as Class_LinkStyle)
                                  menu_configuration.updateComponentRelatedToLinksApparence()
                                }else if (nodesOrLinks === 'zdt') {
                                  drawing_area.moveOrderStyleInSelectedContainers(style_src as Class_NodeStyle, style_trgt as Class_NodeStyle)
                                  menu_configuration.updateComponentRelatedToContainersApparence()
                                }
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
                                if (nodesOrLinks === 'nodes') {
                                  drawing_area.moveOrderStyleInSelectedNodes(style_src as Class_NodeStyle, style_trgt as Class_NodeStyle)
                                  menu_configuration.updateComponentRelatedToNodesApparence()
                                } else if (nodesOrLinks === 'links') {
                                  drawing_area.moveOrderStyleInSelectedFlows(style_src as Class_LinkStyle, style_trgt as Class_LinkStyle)
                                  menu_configuration.updateComponentRelatedToLinksApparence()
                                } else if (nodesOrLinks === 'zdt') {
                                  drawing_area.moveOrderStyleInSelectedContainers(style_src as Class_NodeStyle, style_trgt as Class_NodeStyle)
                                  menu_configuration.updateComponentRelatedToContainersApparence()
                                }
                              }}
                            >
                              {icon_move_element_down}
                            </Button>
                          </Box>
                        </Box>)}
                    </Draggable>
                  )
                })
            }
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  </WrapperBoxSubSectionMenu>
}

/**
 * Component to display and manage container styles
 * Similar to ConfigMenuStyleElement for nodes/links but adapted for containers
 */
export const ConfigMenuStyleElementContainer = ({
  app_data,
  selected_elements,
  config
}: {
  app_data: Class_ApplicationData
  selected_elements: Class_ContainerElement[]
  config: typeof NODES_ATTRIBUTES_CONFIG
}) => {
  const { drawing_area, t, icon_library, menu_configuration } = app_data
  const { sankey } = drawing_area
  const { icon_edit_style } = icon_library
  const { ref_selected_style_container, dict_setter_show_dialog } = menu_configuration
  const element_ref = selected_elements[0]

  const dict_overwritted_attr: { [_: string]: { overloaded: boolean, name: string } } = {}
  Object.entries(config).forEach(([key, config]) => {
    const label_text = config.labels[(app_data.language ?? 'fr') as 'fr' | 'en']
    dict_overwritted_attr[key] = {
      //@ts-expect-error xxx
      overloaded: isElementAttributeOverloaded(selected_elements, key, config),
      name: label_text
    }
  })

  const options_selector: typeElementSelectable = sankey.container_styles_list.map(style => {
    return {
      value: style.id,
      label: style.name,
      selected: element_ref?.style.includes(style) ?? false,
      disabled: style.id == default_style_id,
    }
  })

  return <WrapperBoxSubSectionMenu new_data={app_data} title={t('Noeud.Style')} is_open={false}><>
    <Box layerStyle='menuconfigpanel_row_stylechoice' >
      <OSTooltip label={t('Noeud.tooltips.AS')}>
        <MenuResetAttrLocal
          new_data={app_data}
          nodesOrLinks='zdt'
          dict_overwritted_attr={dict_overwritted_attr}
        />
      </OSTooltip>
      {/* Edit style button */}
      <OSTooltip label={t('Menu.tooltips.edit_style')}>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => {
            // Set the selected style based on current selection
            if (selected_elements.length !== 0) {
              const styles = selected_elements[0].style
              if (styles && styles.length > 0) {
                const list_id_style = styles.map(s => s.id)
                let unchanged = true

                selected_elements.forEach(el => {
                  if (el.style) {
                    unchanged = el.style.every(style => list_id_style.includes(style.id)) ? unchanged : false
                  }
                })

                if (unchanged && styles.length > 0) {
                  ref_selected_style_container.current = [...styles].reverse()[0].id
                }
              }
            }

            // Update and show the appropriate modal
            menu_configuration.updateComponentRelatedToContainersStyles()
            dict_setter_show_dialog.ref_setter_show_modal_styles_containers_visual.current(true)
          }}
        >
          {icon_edit_style}
        </Button>
      </OSTooltip>

      {/* Multi-select for styles */}
      <OSMultiSelect
        t={t}
        elements={options_selector}
        onClick={(entries) => {
          // Update selection list
          const entries_values = entries.map(d => d.value)

          sankey.container_styles_list.forEach(style => {
            sankey.switchContainerStyle(style, entries_values.includes(style.id))
          })
        }}
      />
    </Box>

    {/* Order styles component */}
    <MenuOrderStylesOfSelectedContainers app_data={app_data} />
  </>
  </WrapperBoxSubSectionMenu>
}

/**
 * Component to modify order of styles in selected containers
 * Similar to MenuOrderStylesOfSelectedElements but for containers
 */
export const MenuOrderStylesOfSelectedContainers = ({
  app_data
}: {
  app_data: Class_ApplicationData
}) => {
  const { drawing_area, t, icon_library, menu_configuration } = app_data
  const { icon_move_element_down, icon_move_element_up } = icon_library
  const elements = drawing_area.selected_containers_list
  const style_list_to_use = elements[0]?.style?.slice().reverse() ?? []

  if (style_list_to_use.length === 0) {
    return <></>
  }

  return (
    <WrapperBoxSubSectionMenu
      is_open={false}
      new_data={app_data}
      title={t('Noeud.OrderStyle')}
    >
      <Box style={{ display: 'grid', gridRowGap: '0.2rem' }}>
        {style_list_to_use.map((style, element_idx) => {
          const isDefault = style.id === default_style_id

          return (
            <Box
              key={style.id}
              layerStyle='drag_line_element_order'
              style={{
                background: isDefault ? 'lightgrey' : 'unset'
              }}
            >
              <Box className='name_element'>{style.name}</Box>
              <Box layerStyle="options_2cols">
                <Button
                  isDisabled={isDefault || element_idx === 0}
                  variant='menuconfigpanel_move_order_node_io'
                  minWidth='0'
                  onClick={() => {
                    const style_src = style_list_to_use[element_idx]
                    const style_trgt = style_list_to_use[element_idx - 1]
                    drawing_area.moveOrderStyleInSelectedContainers(
                      style_src as Class_NodeStyle,
                      style_trgt as Class_NodeStyle
                    )
                    menu_configuration.updateAllComponentsRelatedToContainers()
                  }}
                >
                  {icon_move_element_up}
                </Button>
                <Button
                  isDisabled={element_idx === style_list_to_use.length - 2 || isDefault}
                  variant='menuconfigpanel_move_order_node_io'
                  minWidth='0'
                  onClick={() => {
                    const style_src = style_list_to_use[element_idx]
                    const style_trgt = style_list_to_use[element_idx + 1]
                    drawing_area.moveOrderStyleInSelectedContainers(
                      style_src as Class_NodeStyle,
                      style_trgt as Class_NodeStyle
                    )
                    menu_configuration.updateAllComponentsRelatedToContainers()
                  }}
                >
                  {icon_move_element_down}
                </Button>
              </Box>
            </Box>
          )
        })}
      </Box>
    </WrapperBoxSubSectionMenu>
  )
}