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

import React, { FC, useState } from 'react'

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
import {
  CutName
} from '../../types/Utils'
import { MenuConfigurationLinkShape } from '../configmenus/SankeyMenuConfigurationLinksShape'

import { MenuDraggable } from '../topmenus/SankeyMenus'
import { default_style_id } from '../../types/Utils'
import { MenuConfigurationNodeStyle } from '../configmenus/SankeyMenuConfigurationNodesShape'
import { MenuConfigurationNodeContext } from '../configmenus/SankeyMenuConfigurationNodesLabel'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { checked } from './SankeyMenuContextZDD'
import { Class_NodeAttribute, Type_customisable_node_style_attr } from '../../Elements/NodeAttributes'
import { Class_LinkAttribute, Type_customisable_flow_style_attr } from '../../Elements/LinkAttributes'
import { FCType_SankeyModalStyle, FCType_WrapperLinkStyleSelector } from '../SankeyMenuTypes'
import { isElementAttributeOverloaded, MenuResetAttrLocal, OSMultiSelect, OSTooltip, typeElementSelectable, WrapperBoxSubSectionMenu } from '../configmenus/MenuCommon'
import { MenuConfigurationLinkLabel } from '../configmenus/SankeyMenuConfigurationLinksLabel'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_LinkElement } from '../../Elements/Link'
import { LINKS_ATTRIBUTES_CONFIG } from '../../Elements/LinkAttributesConfig'
import { Class_NodeElement } from '../../Elements/Node'
import { NODES_ATTRIBUTES_CONFIG } from '../../Elements/NodeAttributesConfig'
import { Class_LinkStyle, Class_NodeStyle } from '../../Elements/ElementStyle'


export const SankeyModalStyleNode: FC<FCType_SankeyModalStyle> = ({
  new_data,
  additionalMenus
}) => {
  const { t } = new_data
  const { ref_selected_style_node } = new_data.menu_configuration

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
    const style_select = node_styles_dict[ref_selected_style_node.current]
    const content_node_customisable_attribute_style = <Menu direction='rtl' placement='left' closeOnSelect={false}>
      <OSTooltip label={t('Menu.tooltips.style_attr_applicated')}>
        <MenuButton as={Button} variant='menuconfigpanel_option_button'>
          {t('Menu.style_attr_applicated')}
          <ChevronDownIcon />
        </MenuButton>
      </OSTooltip>

      <MenuList maxH='40vh' overflow='auto'>
        {
          Object.entries(style_select.customisable_attribute).map(ent => {
            // Early return to not show props for labels
            if (!ent[0].includes('shape_'))
              return <></>

            return <MenuItem
              style={{ display: 'flex' }}
              isDisabled={ref_selected_style_node.current == default_style_id}
              onClick={() => {
                //if style attribute is not customisable delete value
                if (ent[1])
                  delete style_select[ent[0] as Type_customisable_node_style_attr]

                //Update style attribute customisability
                style_select.customisable_attribute[ent[0] as Type_customisable_node_style_attr] = !ent[1]

                // Update related components
                new_data.menu_configuration.updateComponentRelatedToNodesStyles()
              }}>{t('Noeud.apparence.' + ent[0])}{checked(ent[1])}</MenuItem>
          })
        }
      </MenuList>
    </Menu>

    content_node_style_shape = <WrapperNodeStyleSelector new_data={new_data}><>
      {content_node_customisable_attribute_style}
      {

        <MenuConfigurationNodeStyle
          app_data={new_data}
          menu_for_style={true}
          additional_menus={additionalMenus}
        />}
    </>
    </WrapperNodeStyleSelector>

    const content_node_customisable_attribute_labels = <Menu direction='rtl' placement='left' closeOnSelect={false}>
      <OSTooltip label={t('Menu.tooltips.style_attr_applicated')}>
        <MenuButton as={Button} variant='menuconfigpanel_option_button'>
          {t('Menu.style_attr_applicated')}
          <ChevronDownIcon />
        </MenuButton>
      </OSTooltip>

      <MenuList maxH='40vh' overflow='auto'>
        {
          Object.entries(style_select.customisable_attribute).map(ent => {
            // Early return to not show props for shape
            if (ent[0].includes('shape_'))
              return <></>

            const labelOrValue = ent[0].includes('name_') ? 'name_label_is_visible' : 'value_label_is_visible'

            return <MenuItem
              style={{ display: 'flex' }}
              isDisabled={ref_selected_style_node.current == default_style_id}
              onClick={() => {
                //if style attribute is not customisable delete value
                if (ent[1])
                  delete style_select[ent[0] as Type_customisable_node_style_attr]

                //Update style attribute customisability
                style_select.customisable_attribute[ent[0] as Type_customisable_node_style_attr] = !ent[1]
                // Update related components
                new_data.menu_configuration.updateComponentRelatedToLinksStyles()
              }}>{t('Noeud.labels.' + labelOrValue)} {t('Noeud.labels.' + ent[0])}{checked(ent[1])}</MenuItem>
          })
        }
      </MenuList>
    </Menu>

    content_node_style_context = <WrapperNodeStyleSelector new_data={new_data}>
      <>
        {content_node_customisable_attribute_labels}
        <MenuConfigurationNodeContext
          app_data={new_data}
          menu_for_style={true}
        />
      </>
    </WrapperNodeStyleSelector>
  }

  return <><MenuDraggable
    dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_styles_nodes_visual'}
    content={content_node_style_shape}
    title={t('Menu.esn')}
    maxW='20%'
    customPos={{ x: window.innerWidth * 0.59, y: window.innerHeight * 0.2 }}
  />
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_modal_styles_nodes_labels'}
      content={content_node_style_context}
      title={t('Menu.esn_labels')}
      maxW='20%'
      customPos={{ x: window.innerWidth * 0.59, y: window.innerHeight * 0.2 }}
    />
  </>
}

export const WrapperNodeStyleSelector: FC<FCType_WrapperLinkStyleSelector> = ({ new_data, children }) => {
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
        size='sizeConfigButton'
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
        size='sizeConfigButton'
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
export const SankeyModalStyleLink: FC<FCType_SankeyModalStyle> = ({
  new_data,
  additionalMenus
}) => {
  const { t } = new_data

  // Component's state
  const [selected_link_style_id, setSelectedLinkStyleId] = useState(default_style_id)
  const [, setForceUpdate] = useBoolean()

  new_data.menu_configuration.ref_to_menu_config_links_styles_editor_updater.current = setForceUpdate.toggle
  // Shared refs for external components
  // Dict of links styles
  const link_styles_dict = new_data.drawing_area.sankey.link_styles_dict
  const { ref_selected_style_link } = new_data.menu_configuration

  let content_apparence_shape = <></>
  let content_apparence_contenxt = <></>

  // Failsafe for when selected_link_style_id is not in link_styles_dict
  // It can happen when we change view and selected_link_style_id is not anymore in current sankey data
  if (!(selected_link_style_id in link_styles_dict)) {
    setSelectedLinkStyleId(default_style_id)
  } else {
    const style_select = link_styles_dict[ref_selected_style_link.current]

    const content_node_customisable_attribute_style = <Menu direction='rtl' placement='left' closeOnSelect={false}>
      <OSTooltip label={t('Menu.tooltips.style_attr_applicated')}>
        <MenuButton as={Button} variant='menuconfigpanel_option_button'>
          {t('Menu.style_attr_applicated')}
          <ChevronDownIcon />
        </MenuButton>
      </OSTooltip>

      <MenuList maxH='40vh' overflow='auto'>
        {
          Object.entries(style_select.customisable_attribute).map(ent => {
            // Early return to not show props for labels
            if (!ent[0].includes('shape_'))
              return <></>

            return <MenuItem
              style={{ display: 'flex' }}
              isDisabled={ref_selected_style_link.current == default_style_id}
              onClick={() => {
                //if style attribute is not customisable delete value
                if (ent[1])
                  delete style_select[ent[0] as Type_customisable_flow_style_attr]

                //Update style attribute customisability
                style_select.customisable_attribute[ent[0] as Type_customisable_flow_style_attr] = !ent[1]

                // Update related components
                new_data.menu_configuration.updateComponentRelatedToLinksStyles()
              }}>{t('Flux.apparence.' + ent[0])}{checked(ent[1])}</MenuItem>
          })
        }
      </MenuList>
    </Menu>

    content_apparence_shape = <WrapperLinkStyleSelector new_data={new_data}><>
      {content_node_customisable_attribute_style}
      <MenuConfigurationLinkShape
        new_data={new_data}
        additionMenus={additionalMenus}
        menu_for_style={true}
      />
    </>
    </WrapperLinkStyleSelector>

    const content_flow_customisable_attribute_context = <Menu direction='rtl' placement='left' closeOnSelect={false}>
      <OSTooltip label={t('Menu.tooltips.style_attr_applicated')}>
        <MenuButton as={Button} variant='menuconfigpanel_option_button'>
          {t('Menu.style_attr_applicated')}
          <ChevronDownIcon />
        </MenuButton>
      </OSTooltip>

      <MenuList maxH='40vh' overflow='auto'>
        {
          Object.entries(style_select.customisable_attribute).map(ent => {
            // Early return to not show props for labels
            if (ent[0].includes('shape_'))
              return <></>

            const labelOrValue = ent[0].includes('name_') ? 'name_label_is_visible' : 'value_label_is_visible'

            return <MenuItem
              style={{ display: 'flex' }}
              isDisabled={ref_selected_style_link.current == default_style_id}
              onClick={() => {
                //if style attribute is not customisable delete value
                if (ent[1])
                  delete style_select[ent[0] as Type_customisable_flow_style_attr]

                //Update style attribute customisability
                style_select.customisable_attribute[ent[0] as Type_customisable_flow_style_attr] = !ent[1]

                // Update related components
                new_data.menu_configuration.updateComponentRelatedToLinksStyles()
              }}>{t('Noeud.labels.' + labelOrValue)} {t('Flux.labels.' + ent[0])}{checked(ent[1])}</MenuItem>
          })
        }
      </MenuList>
    </Menu>

    content_apparence_contenxt = <WrapperLinkStyleSelector new_data={new_data}><>
      {content_flow_customisable_attribute_context}
      <MenuConfigurationLinkLabel
        new_data={new_data}
        additionMenus={additionalMenus}
        menu_for_style={true}
      />
    </>
    </WrapperLinkStyleSelector>
  }

  return <><MenuDraggable
    dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_styles_links_visual'}
    content={content_apparence_shape}
    title={t('Menu.esf')}
    maxW='20%'
    customPos={{ x: window.innerWidth * 0.59, y: window.innerHeight * 0.2 }}

  />
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_modal_styles_links_labels'}
      content={content_apparence_contenxt}
      title={t('Menu.esf_labels')}
      maxW='20%'
      customPos={{ x: window.innerWidth * 0.59, y: window.innerHeight * 0.2 }}

    />
  </>
}

export const WrapperLinkStyleSelector: FC<FCType_WrapperLinkStyleSelector> = ({ new_data, children }) => {
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
        size='sizeConfigButton'
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
        size='sizeConfigButton'
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

export const ConfigMenuStyleElement = ({ app_data, selected_elements, config, categories, nodesOrLinks }:
  {
    app_data: Class_ApplicationData
    selected_elements: Class_LinkElement[] | Class_NodeElement[],
    config: typeof LINKS_ATTRIBUTES_CONFIG | typeof NODES_ATTRIBUTES_CONFIG,
    categories: string[],
    nodesOrLinks: 'nodes' | 'links'
  }) => {
  const { t, icon_library, drawing_area, menu_configuration } = app_data
  const { sankey } = drawing_area
  const { ref_selected_style_link, ref_selected_style_node, dict_setter_show_dialog } = menu_configuration
  const { ref_setter_show_modal_styles_links_visual, ref_setter_show_modal_styles_nodes_visual } = dict_setter_show_dialog

  const element_ref = selected_elements[0]

  const dict_overwritted_attr: { [_: string]: { overloaded: boolean, name: string } } = {};
  Object.entries(config).forEach(([key, config]) => {
    if (categories.some(_ => _ === config.category)) {
      let label_text = config.labels[(app_data.language ?? 'fr') as 'fr' | 'en']
      dict_overwritted_attr[key] = {
        overloaded: isElementAttributeOverloaded(selected_elements, key as (keyof Class_LinkAttribute | keyof Class_NodeAttribute)),
        name: label_text
      }
    }
  })

  const style_list = nodesOrLinks == 'nodes' ? sankey.node_styles_list : sankey.link_styles_list

  const options_selector: typeElementSelectable = style_list.map(style => {
    return {
      value: style.id,
      label: style.name,
      //@ts-expect-error xxx
      selected: element_ref?.style.includes(style) ?? false,
      disabled: style.id == default_style_id,
    }
  })

  return <WrapperBoxSubSectionMenu new_data={app_data} title={t('Noeud.Style')} ><>
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
              else
                ref_selected_style_link.current = [...style].reverse()[0].id
            }
          }
          if (nodesOrLinks == 'nodes') app_data.menu_configuration.updateComponentRelatedToNodesStyles()
          else app_data.menu_configuration.updateComponentRelatedToLinksStyles()
          if (nodesOrLinks == 'nodes') ref_setter_show_modal_styles_nodes_visual.current(true)
          else ref_setter_show_modal_styles_links_visual.current(true)

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
          if (nodesOrLinks == 'nodes')
            sankey.node_styles_list.forEach(style => {
              sankey.switchNodeStyle(style, entries_values.includes(style.id))
            })
          else
            sankey.link_styles_list.forEach(style => {
              sankey.switchLinkStyle(style, entries_values.includes(style.id))
            })
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
  nodesOrLinks: 'nodes' | 'links'
}) => {
  const { drawing_area, t, icon_library, menu_configuration } = app_data
  const { icon_move_element_down, icon_move_element_up } = icon_library
  const elements = nodesOrLinks === 'nodes' ? drawing_area.selected_links_list : drawing_area.selected_nodes_list
  const style_list_to_use = elements[0]?.style.slice().reverse() ?? []

  return <WrapperBoxSubSectionMenu collapse={false} new_data={app_data} title={t('Noeud.OrderStyle')} >
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
      else
        drawing_area.moveOrderStyleInSelectedFlows(style_src as Class_LinkStyle, style_trgt as Class_LinkStyle)
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
                                } else {
                                  drawing_area.moveOrderStyleInSelectedFlows(style_src as Class_LinkStyle, style_trgt as Class_LinkStyle)
                                  menu_configuration.updateComponentRelatedToLinksApparence()
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
                                } else {
                                  drawing_area.moveOrderStyleInSelectedFlows(style_src as Class_LinkStyle, style_trgt as Class_LinkStyle)
                                  menu_configuration.updateComponentRelatedToLinksApparence()
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