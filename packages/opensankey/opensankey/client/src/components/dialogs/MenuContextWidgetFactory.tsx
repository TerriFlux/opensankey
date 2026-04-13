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

import React, { useState } from 'react'
import { MenuList, MenuButton, MenuItem, Menu, Box, Checkbox, Text } from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'
import { Button } from '@chakra-ui/react'

import { ConfigMenuNumberInput} from '../configmenus/MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { default_value_option } from '../configmenus/SankeyMenuConfigurationLinksData'
import { value_option_percent_constants } from '../../Elements/LinkValues'
import { ALL_ATTRIBUTES_CONFIG } from '../../Elements/ElementsAttributesConfig'
import { Class_LinkElement } from '../../Elements/Link'

/*************************************************************************************************/

export const sep = <hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
export const checked = (b: boolean) => <span style={{ margin: 'auto 0 auto auto' }}>{b ? '✓' : ''}</span>

/*************************************************************************************************/

/**
 * Component developped for number input of the link data config menu
 * @param {app_data}
 * @return {JSX.Elmement}
 */
export const MenuContextLinksData = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { drawing_area, menu_configuration } = app_data
  const { selected_links_list_sorted } = drawing_area
  const {
    ref_to_menu_contextual_config_links_data_updater,
    ref_to_save_in_cache_indicator
  } = menu_configuration

  const selected_links = selected_links_list_sorted
  const first_link = selected_links[0]
  const first_link_value = first_link?.value
  const value_option = first_link_value?.value_option ?? default_value_option
  const default_value = value_option_percent_constants.includes(value_option) ?
    first_link_value?.valueData ?? null :
    first_link?.valueCurrent
  // Function used to force this component to reload
  const [, setCount] = useState(0)
  ref_to_menu_contextual_config_links_data_updater.current = () => setCount(a => a + 1)

  const refreshThisAndUpdateRelatedComponents = () => {
    // Toogle saving indicator
    drawing_area.updateScaleAtLinkValueSetting()
    ref_to_save_in_cache_indicator.current(false)
    // Update data menu for link
    menu_configuration.updateComponentRelatedToLinksData()
    setCount(a => a + 1)
    // And update this menu also
  }

  return <ConfigMenuNumberInput
    t={app_data.t}
    default_value={default_value}
    function_on_blur={(_: number | null) => Class_LinkElement.updateLinks(
      app_data, selected_links, 'valueCurrent' , _!, refreshThisAndUpdateRelatedComponents
    )}
    minimum_value={0}
    stepper={true}
    step={1}
    unit_text={
      (
        selected_links[0]?.value_label_unit_visible &&
        selected_links[0]?.value_label_unit !== ALL_ATTRIBUTES_CONFIG.value_label_unit.default
      ) ?
        selected_links[0]?.value_label_unit :
        undefined
    }
  />
}


export const ButtonLinkContextAssignTag = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t, drawing_area, menu_configuration } = app_data
  const [, setUpdate] = useState(0)
  const contextualised_link = drawing_area.link_contextualised
  const has_flux_tags = Object.values(drawing_area.sankey.flux_taggs_dict).length > 0
  return (
    (contextualised_link !== undefined) &&
    (has_flux_tags)
  ) ? <>
      <Menu placement='end'>
        <MenuButton
          variant='contextmenu_button'
          as={Button}
          rightIcon={<ChevronRightIcon />}
          className="dropdown-basic"
        >
          {t('Menu.Transformation.tagFlux_assign')}
        </MenuButton>

        <MenuList>
          {
            drawing_area.sankey.flux_taggs_list
              .filter(tagg => tagg.has_tags)
              .map((tagg, i) => {
                return <Menu key={i} placement='end'>
                  <MenuButton
                    variant='contextmenu_button'
                    as={Button}
                    rightIcon={<ChevronRightIcon />}
                    className="dropdown-basic"
                  >
                    {tagg.name}
                  </MenuButton>
                  <MenuList>
                    {
                      tagg.tags_list
                        .map(tag => {
                          const has_tag = contextualised_link.hasGivenTag(tag)
                          return <MenuItem
                            display='flex'
                            closeOnSelect={false}
                            onClick={(event) => {
                              event.stopPropagation()
                              event.preventDefault()
                              drawing_area.updateSelectedLinksTagAssignation(!has_tag, tag)
                              menu_configuration.ref_to_menu_context_links_updater.current()
                              setUpdate(a => a + 1)
                            }}
                          >
                            {tag.name}
                            {checked(has_tag)}
                          </MenuItem>
                        })
                    }
                  </MenuList>
                </Menu>
              })
          }
        </MenuList>
      </Menu></> :
    <></>
}

export const ButtonNodeContextAssignTag = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t, drawing_area, menu_configuration } = app_data
  const [, setUpdate] = useState(0)
  const contextualised_node = drawing_area.node_contextualised
  const has_node_tags = Object.values(drawing_area.sankey.node_taggs_dict).length > 0
  return (
    (contextualised_node !== undefined) &&
    (has_node_tags)
  ) ? <>
      <Menu placement='end'>
        <MenuButton
          variant='contextmenu_button'
          as={Button}
          rightIcon={<ChevronRightIcon />}
          className="dropdown-basic"
        >
          {t('Menu.Transformation.tagFlux_assign')}
        </MenuButton>

        <MenuList>
          {
            drawing_area.sankey.node_taggs_list
              .filter(tagg => tagg.has_tags)
              .map((tagg, i) => {
                return <Menu key={i} placement='end'>
                  <MenuButton
                    variant='contextmenu_button'
                    as={Button}
                    rightIcon={<ChevronRightIcon />}
                    className="dropdown-basic"
                  >
                    {tagg.name}
                  </MenuButton>
                  <MenuList>
                    {
                      tagg.tags_list
                        .map(tag => {
                          const has_tag = contextualised_node.hasGivenTag(tag)
                          return <MenuItem
                            display='flex'
                            closeOnSelect={false}
                            onClick={() => {
                            // event.stopPropagation()
                            // event.preventDefault()
                              drawing_area.updateSelectedNodesTagAssignation(!has_tag, tag)
                              menu_configuration.ref_to_menu_context_nodes_updater.current()
                              setUpdate(a => a + 1)
                            }}
                          >
                            {tag.name}
                            {checked(has_tag)}
                          </MenuItem>
                        })
                    }
                  </MenuList>
                </Menu>
              })
          }
        </MenuList>
      </Menu></> :
    <></>
}

export const ButtonNodeContextAssignStyle = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { drawing_area } = app_data
  const [, setUpdate] = useState(0)
  const contextualised_node = drawing_area.node_contextualised
  const has_node_style = drawing_area.sankey.styles_list.length > 0
  return (
    (contextualised_node !== undefined) &&
    (has_node_style)
  ) ? <Menu placement='end'>
        <MenuButton
          variant='contextmenu_button'
          as={Button}
          rightIcon={<ChevronRightIcon />}
          className="dropdown-basic"
        >
          {'Assigner styles'}
        </MenuButton>

        <MenuList>
          {
            drawing_area.sankey.styles_list
              .map((_) => {
                const has_style = contextualised_node.style.includes(_)
                return <MenuItem
                  display='flex'
                  closeOnSelect={false}
                  onClick={() => {
                    if (!has_style) {
                      contextualised_node.addStyle(_)
                    } else {
                      contextualised_node.removeStyle(_)
                    }
                    setUpdate(a => a + 1)
                  }}
                >
                  {_.name}
                  {checked(has_style)}
                </MenuItem>
              })
          }
        </MenuList>
      </Menu> :
    <></>
}

export const ButtonContainerContextAssignStyle = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { drawing_area } = app_data
  const [, setUpdate] = useState(0)
  const contextualised_container = drawing_area.contextualised_container
  const selected_containers = drawing_area.selected_containers_list
  const has_styles = drawing_area.sankey.styles_list.length > 0
  return (
    (contextualised_container !== undefined) &&
    (has_styles)
  ) ? <Menu placement='end'>
        <MenuButton
          variant='contextmenu_button'
          as={Button}
          rightIcon={<ChevronRightIcon />}
          className="dropdown-basic"
        >
          {'Assigner styles'}
        </MenuButton>
        <MenuList>
          {
            drawing_area.sankey.styles_list
              .map((_) => {
                const has_style = contextualised_container.style.includes(_)
                return <MenuItem
                  display='flex'
                  closeOnSelect={false}
                  onClick={() => {
                    selected_containers.forEach(container => {
                      if (!has_style) {
                        container.addStyle(_)
                      } else {
                        container.removeStyle(_)
                      }
                    })
                    setUpdate(a => a + 1)
                  }}
                >
                  {_.name}
                  {checked(has_style)}
                </MenuItem>
              })
          }
        </MenuList>
      </Menu> :
    <></>
}

export const ButtonLinkContextAssignStyle = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { drawing_area } = app_data
  const [, setUpdate] = useState(0)
  const contextualised_link = drawing_area.link_contextualised
  const has_node_style = drawing_area.sankey.styles_list.length > 0
  return (
    (contextualised_link !== undefined) &&
    (has_node_style)
  ) ? <>
      <Menu placement='end'>
        <MenuButton
          variant='contextmenu_button'
          as={Button}
          rightIcon={<ChevronRightIcon />}
          className="dropdown-basic"
        >
          {'Assigner styles'}
        </MenuButton>

        <MenuList>
          {
            drawing_area.sankey.styles_list
              .map((_) => {
                const has_style = contextualised_link.style.includes(_)
                return <MenuItem
                  display='flex'
                  closeOnSelect={false}
                  onClick={() => {
                    if (!has_style) {
                      contextualised_link.addStyle(_)
                    } else {
                      contextualised_link.removeStyle(_)
                    }
                    setUpdate(a => a + 1)
                  }}
                >
                  {_.name}
                  {checked(has_style)}
                </MenuItem>
              })
          }
        </MenuList>
      </Menu></> :
    <></>
}

// Session-persisted layout spacing (survives widget remounts, not saved to JSON).
// v_spacing is shared between auto-layout widgets and reset-vertical-intervals widget.
const session_layout_spacing: { h: number | null, v: number | null } = { h: null, v: null }

export const MenuContextAutoLayout = ({ app_data, optimize_crossing = false }: { app_data: Class_ApplicationData, optimize_crossing?: boolean }) => {
  const { drawing_area, menu_configuration } = app_data
  const default_dx = drawing_area.sankey.styles_dict['default'].shape_position_dx ?? 0
  const default_dy = drawing_area.sankey.styles_dict['default'].shape_position_dy ?? 0
  const [h_spacing, setHSpacing] = useState<number>(session_layout_spacing.h ?? default_dx)
  const [v_spacing, setVSpacing] = useState<number>(session_layout_spacing.v ?? default_dy)

  const launchAutoLayout = () => {
    session_layout_spacing.h = h_spacing
    session_layout_spacing.v = v_spacing
    drawing_area.nodePositioning.computeAutoSankeyWithToast(
      false,
      optimize_crossing,
      h_spacing,
      v_spacing
    )
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
  }

  const resetToDefault = () => {
    session_layout_spacing.h = null
    session_layout_spacing.v = null
    setHSpacing(default_dx)
    setVSpacing(default_dy)
  }

  return <Box display='flex' flexDirection='column' gap='4px' p='4px'>
    <Box display='flex' alignItems='center' gap='4px'>
      <Text fontSize='xs' whiteSpace='nowrap' minW='90px'>Ecart horiz.</Text>
      <ConfigMenuNumberInput
        t={app_data.t}
        default_value={h_spacing}
        function_on_blur={(v) => {
          setHSpacing(v)
          session_layout_spacing.h = v
        }}
        stepper={true}
        step={10}
        minimum_value={0}
        unit_text='px'
      />
    </Box>
    <Box display='flex' alignItems='center' gap='4px'>
      <Text fontSize='xs' whiteSpace='nowrap' minW='90px'>Ecart vert.</Text>
      <ConfigMenuNumberInput
        t={app_data.t}
        default_value={v_spacing}
        function_on_blur={(v) => {
          setVSpacing(v)
          session_layout_spacing.v = v
        }}
        stepper={true}
        step={10}
        minimum_value={0}
        unit_text='px'
      />
    </Box>
    <Button
      variant='menuconfigpanel_option_button'
      size='xs'
      onClick={resetToDefault}
    >
      Réinitialiser au défaut
    </Button>
    <Button
      variant='menuconfigpanel_option_button'
      size='xs'
      onClick={launchAutoLayout}
    >
      {optimize_crossing ? 'Minimiser croisements' : 'Centrer les nœuds'}
    </Button>
  </Box>
}

export const MenuContextResetVerticalIntervals = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { drawing_area, menu_configuration } = app_data
  const default_dy = drawing_area.sankey.styles_dict['default'].shape_position_dy ?? 0
  const [v_spacing, setVSpacing] = useState<number>(session_layout_spacing.v ?? default_dy)

  const apply = () => {
    session_layout_spacing.v = v_spacing
    drawing_area.resetAllVerticalIntervals(v_spacing)
    drawing_area.draw()
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
  }

  const resetToDefault = () => {
    session_layout_spacing.v = null
    setVSpacing(default_dy)
  }

  return <Box display='flex' flexDirection='column' gap='4px' p='4px'>
    <Box display='flex' alignItems='center' gap='4px'>
      <Text fontSize='xs' whiteSpace='nowrap' minW='90px'>Ecart vert.</Text>
      <ConfigMenuNumberInput
        t={app_data.t}
        default_value={v_spacing}
        function_on_blur={(v) => {
          setVSpacing(v)
          session_layout_spacing.v = v
        }}
        stepper={true}
        step={10}
        minimum_value={0}
        unit_text='px'
      />
    </Box>
    <Button
      variant='menuconfigpanel_option_button'
      size='xs'
      onClick={resetToDefault}
    >
      Réinitialiser au défaut
    </Button>
    <Button
      variant='menuconfigpanel_option_button'
      size='xs'
      onClick={apply}
    >
      Appliquer
    </Button>
  </Box>
}

export const MenuContextNodeStock = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { drawing_area, menu_configuration } = app_data
  const node = drawing_area.node_contextualised
  const [, setUpdate] = useState(0)

  if (!node) return <></>

  const stock_val = node.stock_value

  const refreshAll = () => {
    node.drawStockBox()
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
    setUpdate(a => a + 1)
  }

  return <Box display='flex' flexDirection='column' gap='4px'>
    <Checkbox
      isChecked={node.stock_label_is_visible}
      onChange={(e) => {
        drawing_area.selected_nodes_list.forEach(n => {
          n.stock_label_is_visible = e.target.checked
          n.draw()
        })
        menu_configuration.ref_to_save_in_cache_indicator.current(false)
        setUpdate(a => a + 1)
      }}
    >
      <Text fontSize='sm'>Afficher stocks</Text>
    </Checkbox>
    <Box display='flex' alignItems='center' gap='4px'>
      <Text fontSize='xs' whiteSpace='nowrap' minW='70px'>Stock ini.</Text>
      <ConfigMenuNumberInput
        t={app_data.t}
        default_value={stock_val?.stockInitialData ?? null}
        function_on_blur={(v) => {
          drawing_area.selected_nodes_list.forEach(n => {
            const s = n.stock_value; if (s) s.stockInitialData = v
          })
          refreshAll()
        }}
        stepper={true}
        step={1}
      />
    </Box>
    <Box display='flex' alignItems='center' gap='4px'>
      <Text fontSize='xs' whiteSpace='nowrap' minW='70px'>{'\u0394 Stock'}</Text>
      <ConfigMenuNumberInput
        t={app_data.t}
        default_value={stock_val?.stockVariationData ?? null}
        function_on_blur={(v) => {
          drawing_area.selected_nodes_list.forEach(n => {
            const s = n.stock_value; if (s) s.stockVariationData = v
          })
          refreshAll()
        }}
        stepper={true}
        step={1}
      />
    </Box>
  </Box>
}
