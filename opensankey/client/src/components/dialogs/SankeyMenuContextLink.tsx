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

import React, {useState } from 'react'
import { ConfigMenuNumberInput } from '../configmenus/SankeyMenuConfiguration'
import { updateElements, ValueElementsType, ValueKey } from '../configmenus/MenuCommon'
import { LINKS_ATTRIBUTES_CONFIG } from '../../Elements/LinkAttributesConfig'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { default_value_option } from '../configmenus/SankeyMenuConfigurationLinksData'
import { value_option_percent_constants } from '../../Elements/LinkValues'

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
  const { selected_links_list_sorted, visible_and_selected_links_list_sorted } = drawing_area
  const {
    ref_to_menu_contextual_config_links_data_updater,
    ref_to_save_in_cache_indicator
  } = menu_configuration

  let selected_links = menu_configuration.is_selector_only_for_visible_links ?
    visible_and_selected_links_list_sorted :
    selected_links_list_sorted
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
    function_on_blur={(_: number | null) => updateElements(
      app_data, selected_links, 'valueCurrent' as ValueKey, _ as ValueElementsType, refreshThisAndUpdateRelatedComponents
    )}
    minimum_value={0}
    stepper={true}
    step={1}
    unit_text={
      (
        selected_links[0]?.value_label_unit_visible &&
        selected_links[0]?.value_label_unit !== LINKS_ATTRIBUTES_CONFIG.value_label_unit.default
      ) ?
        selected_links[0]?.value_label_unit :
        undefined
    }
  />
}

// export const ContextMenuLink = ({ app_data, additionalMenus }: {
//   app_data: Class_ApplicationData,
//   additionalMenus: MutableRefObject<Type_AdditionalMenus>
// }) => {

//   const { t, drawing_area, menu_configuration, history } = app_data

//   // Link on which this menu applies ----------------------------------------------------

//   const contextualised_link = drawing_area.link_contextualised

//   let style_c_l = '0px 0px auto auto'
//   let is_top = true
//   let pos_x = drawing_area.pointer_pos[0]
//   let pos_y = drawing_area.pointer_pos[1]

//   const context_link_value_visible = (contextualised_link !== undefined) ? contextualised_link.value_label_is_visible : false
//   const context_link_name_visible = (contextualised_link !== undefined) ? contextualised_link.name_label_is_visible : false

//   // The limit value of the mouse position that engages the shift of the context menu
//   // is arbitrary and taken by hand because it is not possible to know the dimensions of the menu before it is render
//   if (contextualised_link) {
//     if (drawing_area.pointer_pos[0] + 240 > window.innerWidth) {
//       pos_x = drawing_area.pointer_pos[0] - 245
//     }

//     if (drawing_area.pointer_pos[1] + 360 > window.innerHeight) {
//       pos_y = drawing_area.pointer_pos[1] - 340
//       is_top = false
//     }
//     style_c_l = pos_y + 'px auto auto ' + pos_x + 'px'
//   }

//   const selected_links = drawing_area.visible_and_selected_links_list

//   // Menu updaters ----------------------------------------------------------------------

//   // Boolean used to force this component to reload
//   const [, setCount] = useState(0)

//   // Link this menu's update function
//   menu_configuration.ref_to_menu_context_links_updater.current = () => setCount(a => a + 1)

//   // Functions used to reset menu UI ----------------------------------------------------

//   const refreshThisAndToggleSaving = () => {
//     // Toogle saving indicator
//     menu_configuration.ref_to_save_in_cache_indicator.current(false)
//     // Refresh this menu
//     setCount(a => a + 1)
//   }

//   const closeContextMenu = () => {
//     // Unset contextualized flow
//     drawing_area.link_contextualised = undefined
//     // Refresh this menu
//     setCount(a => a + 1)
//   }

//   // Functions that mutate attribute & save it's undoing ----------------------------------------------------

//   const updateStyle = (sl: Class_LinkStyle) => {
//     const dict_old_value: { [x: string]: Class_LinkStyle[] } = {}
//     selected_links.forEach(l => {
//       dict_old_value[l.id] = l.style
//     })
//     const _updateStyle = () => {
//       selected_links.forEach(_ => {
//         const flow_ref_has_style = selected_links[0].style.includes(sl) ?? false
//         drawing_area.sankey.switchLinkStyle(sl, flow_ref_has_style)
//       })
//       refreshThisAndToggleSaving()

//     }

//     const inv_updateStyle = () => {
//       selected_links.forEach(l => {
//         l.style = dict_old_value[l.id]
//       })
//       refreshThisAndToggleSaving()
//     }
//     // Save undo/redo in data history
//     history.saveUndo(inv_updateStyle)
//     history.saveRedo(_updateStyle)
//     // Execute original attr mutation
//     _updateStyle()
//     closeContextMenu()
//   }

//   const resetAttr = () => {
//     const dict_old_value: { [x: string]: Class_LinkAttribute } = {}
//     selected_links.forEach(l => {
//       dict_old_value[l.id] = l.display.attributes
//     })
//     const _resetAttr = () => {
//       selected_links.forEach(l => {
//         l.resetAttributes()
//       })
//       refreshThisAndToggleSaving()

//     }

//     const inv_resetAttr = () => {
//       selected_links.forEach(l => {
//         l.display.attributes = dict_old_value[l.id]
//       })
//       refreshThisAndToggleSaving()
//     }
//     // Save undo/redo in data history
//     history.saveUndo(inv_resetAttr)
//     history.saveRedo(_resetAttr)
//     // Execute original attr mutation
//     _resetAttr()
//     closeContextMenu()
//   }

//   const updateValueVisibility = () => {
//     const dict_old_value: { [x: string]: Class_LinkAttribute } = {}
//     // Clone Class_attribute of links so in the undo it's doens't affect a value if the original value came from style
//     selected_links.forEach(l => {
//       dict_old_value[l.id] = Object.assign(Object.create(Object.getPrototypeOf(l.display.attributes)), l.display.attributes)
//     })
//     const _updateValueVisibility = () => {
//       selected_links
//         .forEach(link => {
//           link.value_label_is_visible = !context_link_value_visible
//         })
//       refreshThisAndToggleSaving()
//     }

//     const inv_updateValueVisibility = () => {
//       selected_links.forEach(l => {
//         l.display.attributes = dict_old_value[l.id]
//         l.draw()
//       })
//       refreshThisAndToggleSaving()
//     }
//     // Save undo/redo in data history
//     history.saveUndo(inv_updateValueVisibility)
//     history.saveRedo(_updateValueVisibility)
//     // Execute original attr mutation
//     _updateValueVisibility()
//     closeContextMenu()
//   }

//   const updateNameVisibility = () => {
//     const dict_old_name: { [x: string]: Class_LinkAttribute } = {}
//     // Clone Class_attribute of links so in the undo it's doens't affect a name if the original name came from style
//     selected_links.forEach(l => {
//       dict_old_name[l.id] = Object.assign(Object.create(Object.getPrototypeOf(l.display.attributes)), l.display.attributes)
//     })
//     const _updateNameVisibility = () => {
//       selected_links
//         .forEach(link => {
//           link.name_label_is_visible = !context_link_name_visible
//         })
//       refreshThisAndToggleSaving()
//     }

//     const inv_updateNameVisibility = () => {
//       selected_links.forEach(l => {
//         l.display.attributes = dict_old_name[l.id]
//         l.draw()
//       })
//       refreshThisAndToggleSaving()
//     }
//     // Save undo/redo in data history
//     history.saveUndo(inv_updateNameVisibility)
//     history.saveRedo(_updateNameVisibility)
//     // Execute original attr mutation
//     _updateNameVisibility()
//     closeContextMenu()
//   }

//   const moveToFirstPlan = () => {
//     drawing_area.selected_links_list.forEach(link => {
//       const idx_to_shift = drawing_area.list_g_element.indexOf(link)
//       drawing_area.moveOrderElementInDA(idx_to_shift, drawing_area.list_g_element.length - 1)
//     })
//     closeContextMenu()
//   }
//   const moveToLastPlan = () => {
//     drawing_area.selected_links_list.forEach(link => {
//       const idx_to_shift = drawing_area.list_g_element.indexOf(link)
//       drawing_area.moveOrderElementInDA(idx_to_shift, 0)
//     })
//     closeContextMenu()
//   }

//   const list_style_id_context_flow = contextualised_link?.style.map(s => s.id)
//   // JSX Components ---------------------------------------------------------------------
//   // Menu to change some pararmeter concerning the style of the node
//   const dropdown_c_l_style_select = (contextualised_link !== undefined) ?
//     <Menu placement='end'>
//       <MenuButton
//         variant='contextmenu_button'
//         as={Button}
//         rightIcon={<ChevronRightIcon />}
//         className="dropdown-basic"
//       >
//         {t('Noeud.SelectStyle')}
//       </MenuButton>
//       <MenuList >
//         {
//           drawing_area.sankey.link_styles_list
//             .map(sl => {
//               return <MenuItem
//                 onClick={() => {
//                   updateStyle(sl)
//                 }}
//               >
//                 {sl.name}
//                 {checked(list_style_id_context_flow?.includes(sl.id) ?? false)}
//               </MenuItem>
//             })
//         }
//       </MenuList>
//     </Menu> :
//     <></>

//   // Selector of style (we can also reset local link attribute)
//   const dropdown_c_l_style = (contextualised_link !== undefined) ?
//     <Menu placement='end'>
//       <MenuButton
//         variant='contextmenu_button'
//         as={Button}
//         rightIcon={<ChevronRightIcon />}
//         className="dropdown-basic"
//       >
//         {t('Noeud.editStyle')}
//       </MenuButton>
//       <MenuList >
//         <MenuItem
//           as={Button}
//           variant='contextmenu_button'
//           onClick={resetAttr}
//         >
//           {t('Noeud.AS')}
//         </MenuItem>
//         {dropdown_c_l_style_select}
//       </MenuList>
//     </Menu> :
//     <></>

//   const mask_flow_attr = <Menu placement='end'>
//     <MenuButton variant='contextmenu_button' as={Button} rightIcon={<ChevronRightIcon />} className="dropdown-basic">
//       {t('Flux.mask_attr')}
//     </MenuButton>
//     <MenuList>

//       <MenuItem
//         onClick={updateNameVisibility}>
//         {context_link_name_visible ?
//           t('Flux.apparence.hide_link_name') :
//           t('Flux.apparence.display_link_name')}
//       </MenuItem>
//       <MenuItem
//         onClick={updateValueVisibility}>
//         {context_link_value_visible ?
//           t('Flux.apparence.hide_link_lab') :
//           t('Flux.apparence.display_link_lab')}
//       </MenuItem>
//     </MenuList>
//   </Menu>


//   const menu_change_plan = <Menu placement='end'>
//     <MenuButton variant='contextmenu_button' as={Button} rightIcon={<ChevronRightIcon />} className="dropdown-basic">
//       {t('Flux.changePlan')}
//     </MenuButton>
//     <MenuList>

//       <MenuItem
//         onClick={moveToFirstPlan}>
//         {t('Noeud.firstPlan')}
//       </MenuItem>
//       <MenuItem
//         onClick={moveToLastPlan}>
//         {t('Noeud.lastPlan')}
//       </MenuItem>
//     </MenuList>
//   </Menu>



//   // Inverse source & target of the link
//   const btn_edit_value = (contextualised_link !== undefined) ?
//     <Menu placement='end'>
//       <MenuButton
//         variant='contextmenu_button'
//         as={Button}
//         rightIcon={<ChevronRightIcon />}
//         className="dropdown-basic"
//       >
//         {t('Flux.data.edit_value')}
//       </MenuButton>
//       <MenuList>
//         <MenuContextLinksData
//           app_data={app_data}
//         />
//       </MenuList>
//     </Menu> : <></>

//   const btn_inverse_io = <Button
//     variant='contextmenu_button'
//     onClick={() => {
//       drawing_area.inverseSelectedLinks()
//       closeContextMenu()
//     }}
//   >
//     {t('Flux.if')}
//   </Button>

//   const content_context_link: { [_: string]: JSX.Element } = {
//     'inverse': btn_inverse_io,
//     'sep_1': sep,
//     'style': dropdown_c_l_style,
//     'sep_2': sep,
//     'changePlan': menu_change_plan,
//     'mask_attr': mask_flow_attr,
//     'edit_value': btn_edit_value,

//     ...additionalMenus.current.additional_context_link_element
//   }

//   // Box that serve as context menu
//   return (contextualised_link !== undefined) ?
//     <Box
//       layerStyle='context_menu'
//       id="context_link_pop_over"
//       className={'context_popover ' + (is_top ? '' : 'at_bot')}
//       style={{ maxWidth: '100%', position: 'absolute', zIndex: '1', inset: style_c_l }}
//     >
//       <ButtonGroup orientation='vertical' isAttached>
//         {additionalMenus.current.context_link_order.map((key, id) => {
//           return <React.Fragment key={id}>{content_context_link[key]}</React.Fragment>
//         })}
//       </ButtonGroup>
//     </Box> : <></>
// }