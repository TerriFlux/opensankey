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
import { MenuList, MenuButton, MenuItem, Menu, Box, Checkbox, Text, Select } from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'
import { Button } from '@chakra-ui/react'

import { ConfigMenuNumberInput, OSTooltip } from '../configmenus/MenuCommon'
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

/**
 * Shared spacing inputs for the auto-layout widgets and the Excel import dialog.
 * Reads/writes app_data.layout_h_spacing / layout_v_spacing (session-only).
 * `null` means "use the style default".
 */
export const AutoLayoutSpacingInputs = ({
  app_data,
  show_horizontal = true,
  show_extremities = false,
  show_optimize_mode = false,
  label_min_width = '100px'
}: {
  app_data: Class_ApplicationData,
  show_horizontal?: boolean,
  show_extremities?: boolean,
  show_optimize_mode?: boolean,
  label_min_width?: string
}) => {
  const { drawing_area } = app_data
  const default_dx = drawing_area.sankey.styles_dict['default'].shape_position_dx ?? 0
  const default_dy = drawing_area.sankey.styles_dict['default'].shape_position_dy ?? 0
  const [, setTick] = useState(0)
  const redraw = () => setTick((t) => t + 1)

  const h_value = app_data.layout_h_spacing ?? default_dx
  const v_value = app_data.layout_v_spacing ?? default_dy

  const resetToDefault = () => {
    app_data.layout_h_spacing = null
    app_data.layout_v_spacing = null
    if (show_extremities) {
      app_data.layout_sources_mode = 'before_neighbor'
      app_data.layout_sinks_mode = 'after_neighbor'
    }
    if (show_optimize_mode) {
      app_data.layout_optimize_crossing = true
    }
    redraw()
  }

  const t = app_data.t
  return <Box display='flex' flexDirection='column' gap='4px'>
    {show_horizontal && <Box display='flex' alignItems='center' gap='4px'>
      <OSTooltip label={t('ProcessDialog.layout_h_spacing_tt')}>
        <Text fontSize='xs' whiteSpace='nowrap' minW={label_min_width}>{t('ProcessDialog.layout_h_spacing')}</Text>
      </OSTooltip>
      <ConfigMenuNumberInput
        t={t}
        default_value={h_value}
        function_on_blur={(v) => {
          app_data.layout_h_spacing = (v !== undefined && v !== default_dx) ? v : null
          redraw()
        }}
        stepper={true}
        step={10}
        minimum_value={0}
        unit_text='px'

      />
    </Box>}
    <Box display='flex' alignItems='center' gap='4px'>
      <OSTooltip label={t('ProcessDialog.layout_v_spacing_tt')}>
        <Text fontSize='xs' whiteSpace='nowrap' minW={label_min_width}>{t('ProcessDialog.layout_v_spacing')}</Text>
      </OSTooltip>
      <ConfigMenuNumberInput
        t={t}
        default_value={v_value}
        function_on_blur={(v) => {
          app_data.layout_v_spacing = (v !== undefined && v !== default_dy) ? v : null
          redraw()
        }}
        stepper={true}
        step={10}
        minimum_value={0}
        unit_text='px'

      />
    </Box>
    {show_extremities && <Box display='flex' alignItems='center' gap='4px'>
      <OSTooltip label={t('ProcessDialog.layout_sources_tt')}>
        <Text fontSize='xs' whiteSpace='nowrap' minW={label_min_width}>{t('ProcessDialog.layout_sources')}</Text>
      </OSTooltip>
      <Select
        size='xs'
        value={app_data.layout_sources_mode}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          app_data.layout_sources_mode = e.target.value as 'before_neighbor' | 'left_extremity'
          redraw()
        }}
      >
        <option value='before_neighbor'>{t('ProcessDialog.layout_before_neighbor')}</option>
        <option value='left_extremity'>{t('ProcessDialog.layout_left_extremity')}</option>
      </Select>
    </Box>}
    {show_extremities && <Box display='flex' alignItems='center' gap='4px'>
      <OSTooltip label={t('ProcessDialog.layout_sinks_tt')}>
        <Text fontSize='xs' whiteSpace='nowrap' minW={label_min_width}>{t('ProcessDialog.layout_sinks')}</Text>
      </OSTooltip>
      <Select
        size='xs'
        value={app_data.layout_sinks_mode}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          app_data.layout_sinks_mode = e.target.value as 'after_neighbor' | 'right_extremity'
          redraw()
        }}
      >
        <option value='after_neighbor'>{t('ProcessDialog.layout_after_neighbor')}</option>
        <option value='right_extremity'>{t('ProcessDialog.layout_right_extremity')}</option>
      </Select>
    </Box>}
    {show_optimize_mode && <Box display='flex' alignItems='center' gap='4px'>
      <OSTooltip label={t('ProcessDialog.layout_mode_tt')}>
        <Text fontSize='xs' whiteSpace='nowrap' minW={label_min_width}>{t('ProcessDialog.layout_mode')}</Text>
      </OSTooltip>
      <Select
        size='xs'
        value={app_data.layout_optimize_crossing ? 'minimize' : 'center'}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          app_data.layout_optimize_crossing = e.target.value === 'minimize'
          redraw()
        }}
      >
        <option value='center'>{t('ProcessDialog.layout_center')}</option>
        <option value='minimize'>{t('ProcessDialog.layout_minimize')}</option>
      </Select>
    </Box>}
    <OSTooltip label={t('ProcessDialog.layout_reset_tt')}>
      <Button
        variant='menuconfigpanel_option_button'
        size='xs'
        onClick={resetToDefault}
      >
        {t('ProcessDialog.layout_reset')}
      </Button>
    </OSTooltip>
  </Box>
}

export const MenuContextAutoLayout = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { drawing_area, menu_configuration } = app_data
  const [skipHorizontal, setSkipHorizontal] = useState(false)
  const [skipVertical, setSkipVertical] = useState(false)
  const [applyFonts, setApplyFonts] = useState(true)

  const launchAutoLayout = () => {
    const default_dx = drawing_area.sankey.styles_dict['default'].shape_position_dx ?? 0
    const default_dy = drawing_area.sankey.styles_dict['default'].shape_position_dy ?? 0
    drawing_area.nodePositioning.computeAutoSankeyWithToast(
      false,
      app_data.layout_optimize_crossing,
      app_data.layout_h_spacing ?? default_dx,
      app_data.layout_v_spacing ?? default_dy,
      app_data.layout_sources_mode,
      app_data.layout_sinks_mode,
      skipHorizontal,
      skipVertical,
      applyFonts
    )
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
  }

  return <Box display='flex' flexDirection='column' gap='4px' p='8px' minW='280px'>
    <AutoLayoutSpacingInputs app_data={app_data} show_extremities show_optimize_mode />
    <Box display='flex' alignItems='center' gap='4px'>
      <Checkbox
        size='sm'
        isChecked={skipHorizontal}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSkipHorizontal(e.target.checked)}
      >
        <Text fontSize='xs'>{app_data.t('MEP.SkipHorizontal')}</Text>
      </Checkbox>
    </Box>
    <Box display='flex' alignItems='center' gap='4px'>
      <Checkbox
        size='sm'
        isChecked={skipVertical}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSkipVertical(e.target.checked)}
      >
        <Text fontSize='xs'>{app_data.t('MEP.SkipVertical')}</Text>
      </Checkbox>
    </Box>
    {drawing_area.is_paper_mode && <Box display='flex' alignItems='center' gap='4px'>
      <Checkbox
        size='sm'
        isChecked={applyFonts}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApplyFonts(e.target.checked)}
      >
        <Text fontSize='xs'>{app_data.t('MEP.ApplyTargetFonts')}</Text>
      </Checkbox>
    </Box>}
    <OSTooltip label={app_data.t('ProcessDialog.layout_apply_tt')}>
      <Button
        variant='menuconfigpanel_option_button'
        size='xs'
        onClick={launchAutoLayout}
      >
        {app_data.t('ProcessDialog.layout_apply')}
      </Button>
    </OSTooltip>
  </Box>
}

export const MenuContextResetVerticalIntervals = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { drawing_area, menu_configuration } = app_data

  const apply = () => {
    const default_dy = drawing_area.sankey.styles_dict['default'].shape_position_dy ?? 0
    drawing_area.resetAllVerticalIntervals(app_data.layout_v_spacing ?? default_dy)
    drawing_area.draw()
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
  }

  return <Box display='flex' flexDirection='column' gap='4px' p='4px'>
    <AutoLayoutSpacingInputs app_data={app_data} show_horizontal={false} label_min_width='90px' />
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
