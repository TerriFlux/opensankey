// import React, { useState, useRef, useMemo } from 'react'
// import { Box, Checkbox, Button, ButtonGroup } from '@chakra-ui/react'
// import { default_style_id } from '../deps/OpenSankey/types/Utils'
// import { Class_ContainerElement } from '../deps/OpenSankey/Elements/TextZone'
// import { Class_ElementStyle } from '../deps/OpenSankey/Elements/Element'
// import { ConfigMenuNumberInput, OSMultiSelect } from '../deps/OpenSankey/components/configmenus/MenuCommon'
// import { OSTooltip } from '../deps/OpenSankey/components/configmenus/MenuCommon'
// import { Class_ApplicationData } from '../deps/OpenSankey/types/ApplicationData'
// import { Class_ProtoElement } from '../deps/OpenSankey/Elements/Element'
// import { getNodeShapeValues, NODE_SHAPE_SPECIFIC_CONFIG } from '../deps/OpenSankey/Elements/ElementsAttributesConfig'
// import { SankeyContainerSelectionSimple } from '../deps/OpenSankey/components/configmenus/MenuElementsSelection'

// export interface selected_type { 'label': string; 'value': string }

// const useContainerAttributeConfig = (
//   app_data: Class_ApplicationData,
//   elements: (Class_ContainerElement | Class_ElementStyle)[]
// ) => {
//   return useMemo(() => {
//     const { drawing_area, menu_configuration } = app_data
//     const { sankey } = drawing_area
//     const { ref_selected_style } = menu_configuration
//     const { styles_dict } = sankey

//     const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_ProtoElement)

//     // En mode style : utiliser customisable_attribute du style sélectionné
//     // En mode direct : utiliser customisable_attribute du style par défaut
//     const disable_attr_props = menu_for_style ?
//       styles_dict[ref_selected_style.current]?.customisable_attribute :
//       styles_dict[default_style_id]?.customisable_attribute

//     return {
//       menu_for_style,
//       disable_attr_props: disable_attr_props || {},
//       t: app_data.t
//     }
//   }, [app_data, elements])
// }

// export const MenuConfigurationContainersOSP = ({
//   app_data,
//   menu_for_style = false
// }: {
//   app_data: Class_ApplicationData
//   menu_for_style?: boolean
// }) => {
//   const { t, icon_library } = app_data
//   const { icon_to_the_left, icon_to_the_right, icon_text_vert_pos_top, icon_text_vert_pos_bottom } = icon_library
//   //@ts-expect-error xxx
//   const has_sankey_plus = app_data.has_sankey_plus

//   const [, setCount] = useState(0)
//   const [, setCountStyle] = useState(0)
//   if (!menu_for_style) {
//     app_data.menu_configuration.ref_to_menu_config_containers_updater.current = () => setCount(a => a + 1)
//   } else {
//     app_data.menu_configuration.ref_to_menu_config_styles_updater.current = () => setCountStyle(a => a + 1)
//   }
//   let elements: Class_ElementStyle[] | Class_ContainerElement[]

//   if (menu_for_style) {
//     // MODE STYLE: editing the selected style
//     const { ref_selected_style } = app_data.menu_configuration
//     elements = [app_data.drawing_area.sankey.styles_dict[ref_selected_style.current]]
//   } else {
//     // MODE DIRECT: editing selected containers
//     elements = app_data.drawing_area.selected_containers_list
//   }
//   // 🆕 Utiliser le hook pour obtenir disable_attr_props
//   const { disable_attr_props } = useContainerAttributeConfig(app_data, elements)

//   const refreshThisAndUpdateRelatedComponents = () => {
//     // Whatever is done, set saving indicator
//     app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)

//     if (menu_for_style) {
//       app_data.menu_configuration.updateAllComponentsRelatedToContainers()
//       // Update menus for container's appearance in case we use this for style
//       app_data.menu_configuration.updateAllComponentsRelatedToContainersStyles()
//       // Redraw all visible containers if we modify container style
//       app_data.drawing_area.sankey.containers_list.forEach(container => container.draw())
//     }
//     // And update this menu also
//     app_data.menu_configuration.updateAllComponentsRelatedToContainers()
//   }
//   const ref_set_text_value_input = useRef((_: string | null | undefined) => null)

//   const [forceUpdate, setForceUpdate] = useState(false)

//   const redrawAndRefresh = () => {
//     if (elements[0] instanceof Class_ContainerElement) {
//       elements.forEach(zdt => (zdt as Class_ContainerElement).drawAsSelected())
//       ref_set_text_value_input.current((elements[0] as Class_ContainerElement)?.name ?? '')
//     }
//     setForceUpdate(!forceUpdate)
//     if (menu_for_style) {
//       refreshThisAndUpdateRelatedComponents()
//     }
//   }
//   const nodeShapeValues = elements.length > 0
//     ? getNodeShapeValues(elements, redrawAndRefresh)
//     : Object.fromEntries(Object.entries(NODE_SHAPE_SPECIFIC_CONFIG).map(([key, value]) => [key, value.default])) as {
//       -readonly [K in keyof typeof NODE_SHAPE_SPECIFIC_CONFIG]:
//       ReturnType<(typeof NODE_SHAPE_SPECIFIC_CONFIG)[K]['type']>
//     }



//   const disable_options = menu_for_style
//     ? false // Always enabled in style mode
//     : (has_sankey_plus ? (elements.length === 0) : true)

//   // =================== MAIN MENU ===================

//   const content_menu_zdt = <OSTooltip label={!has_sankey_plus && !menu_for_style ? t('Menu.sankeyOSPDisabled') : ''} >
//     <Box layerStyle='menuconfigpanel_grid'>
//       <SankeyContainerSelectionSimple app_data={app_data} />

//       {/* Tied to nodes - only for direct mode */}
//       {!menu_for_style && (
//         <>
//           <Checkbox
//             variant='menuconfigpanel_option_checkbox'
//             iconColor={'white'}
//             isDisabled={disable_options}
//             isChecked={elements.length > 0 ? container_element.tied_to_nodes : false}
//             onChange={(evt) => {
//               container_element.tied_to_nodes = evt.target.checked
//               setForceUpdate(!forceUpdate)
//             }}>
//             <OSTooltip label={t('LL.tooltips.tiedToNodes')} placement='left'>{t('LL.tiedToNodes')}</OSTooltip>
//           </Checkbox>

//           {elements.length > 0 && container_element.tied_to_nodes ? <Box>
//     <OSMultiSelect
//       t={app_data.t}
//       elements={options_selector_node_tied}
//       onClick={(entries) => {
//         const entries_values = entries.map(d => d.value)
//         const containerElements = elements.filter(e => e instanceof Class_ContainerElement) as Class_ContainerElement[]

//         app_data.drawing_area.sankey.nodes_list.forEach(node => {
//           if (entries_values.includes(node.id)) {
//             containerElements.forEach(zdt => { zdt.attachNodeToCont(node) })
//           } else {
//             containerElements.forEach(zdt => { zdt.dettachNodeFromCont(node) })
//           }
//         })
//         redrawAndRefresh()
//       }}
//     />
//     <Box layerStyle='menuconfigpanel_option_name'>{t('LL.margin')}</Box>
//     <OSTooltip label={t('LL.tooltips.margin')} placement='left'>
//       <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
//         <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
//           <Box layerStyle='menuconfigpanel_option_name'>{t('LL.marginLeft') || 'Left'}</Box>
//           <ConfigMenuNumberInput
//             t={app_data.t}
//             disabled={!disable_attr_props['margin_left']}
//             default_value={nodeShapeValues.margin_left}
//             function_on_blur={(value: number | null) => nodeShapeValues.margin_left = value!}
//             minimum_value={0}
//             stepper={true} />
//         </Box>
//         <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
//           <Box layerStyle='menuconfigpanel_option_name'>{t('LL.marginTop') || 'Top'}</Box>
//           <ConfigMenuNumberInput
//             t={app_data.t}
//             disabled={!disable_attr_props['margin_right']}
//             default_value={nodeShapeValues.margin_right}
//             function_on_blur={(value: number | null) => nodeShapeValues.margin_right = value!}
//             minimum_value={0}
//             stepper={true} />
//         </Box>
//       </Box>
//       <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
//         <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
//           <Box layerStyle='menuconfigpanel_option_name'>{t('LL.marginLeft') || 'Left'}</Box>
//           <ConfigMenuNumberInput
//             t={app_data.t}
//             disabled={!disable_attr_props['margin_top']}
//             default_value={nodeShapeValues.margin_top}
//             function_on_blur={(value: number | null) => nodeShapeValues.margin_top = value!}
//             minimum_value={0}
//             stepper={true} />
//         </Box>
//         <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
//           <Box layerStyle='menuconfigpanel_option_name'>{t('LL.marginLeft') || 'Left'}</Box>
//           <ConfigMenuNumberInput
//             t={app_data.t}
//             disabled={!disable_attr_props['margin_bottom']}
//             default_value={nodeShapeValues.margin_bottom}
//             function_on_blur={(value: number | null) => nodeShapeValues.margin_bottom = value!}
//             minimum_value={0}
//             stepper={true} />
//         </Box>
//       </Box>
//     </OSTooltip>

//     <Checkbox
//       variant='menuconfigpanel_option_checkbox'
//       iconColor={'white'}
//       isDisabled={disable_options}
//       isChecked={elements.length > 0 ? container_element.at_extremity_of_attached_nodes : false}
//       onChange={(evt) => updateLabelTiedToNodesAtExtremity(evt.target.checked)}>
//       <OSTooltip label={t('LL.tooltips.tiedToNodesExtremity')} placement='left'>{t('LL.tiedToNodesExtremity')}</OSTooltip>
//     </Checkbox>

//     <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
//       <Box layerStyle='menuconfigpanel_option_name'>{t('LL.extremityPos')}</Box>
//       <ButtonGroup isAttached>
//         <Button
//           variant={elements.length > 0 && container_element.extremity_position === 'top' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
//           onClick={() => { updateLabelExtremityPos('top') }}>{icon_text_vert_pos_top}</Button>
//         <Button
//           variant={elements.length > 0 && container_element.extremity_position === 'bottom' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
//           onClick={() => { updateLabelExtremityPos('bottom') }}>{icon_text_vert_pos_bottom}</Button>
//         <Button
//           variant={elements.length > 0 && container_element.extremity_position === 'left' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
//           onClick={() => { updateLabelExtremityPos('left') }}>{icon_to_the_left}</Button>
//         <Button
//           variant={elements.length > 0 && container_element.extremity_position === 'right' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
//           onClick={() => { updateLabelExtremityPos('right') }}>{icon_to_the_right}</Button>
//       </ButtonGroup>
//     </Box>
//   </Box> : <></>}
//         </>
//       )}
//     </Box>
//   </OSTooltip>

//   return content_menu_zdt
// }