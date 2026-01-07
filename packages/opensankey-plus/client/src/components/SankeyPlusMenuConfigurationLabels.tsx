import React, { useState, useRef, useMemo } from 'react'
import ReactQuill from 'react-quill'
import { Box, Checkbox, Button, ButtonGroup } from '@chakra-ui/react'

import { Type_JSON, default_style_id } from '../deps/OpenSankey/types/Utils'
import { Class_ContainerElement } from '../deps/OpenSankey/Elements/TextZone'
import { ConfigMenuStyleElement } from '../deps/OpenSankey/components/dialogs/SankeyStyle'
import { Class_ElementStyle } from '../deps/OpenSankey/Elements/Element'
import { ConfigMenuNumberInput, ConfigMenuTextInput, OSMultiSelect } from '../deps/OpenSankey/components/configmenus/MenuCommon'
import { OSTooltip } from '../deps/OpenSankey/components/configmenus/MenuCommon'
import { Class_ApplicationData } from '../deps/OpenSankey/types/ApplicationData'
import { Class_ApplicationHistory } from '../deps/OpenSankey/types/ApplicationHistory'
import { Class_ProtoElement } from '../deps/OpenSankey/Elements/Element'
import { ALL_ATTRIBUTES_CONFIG } from '../deps/OpenSankey/Elements/ElementsAttributesConfig'

export const sep = <hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

export interface selected_type { 'label': string; 'value': string }

// 🆕 Hook pour gérer la configuration des attributs disable (comme pour nodes/links)
const useContainerAttributeConfig = (
  app_data: Class_ApplicationData,
  elements: (Class_ContainerElement | Class_ElementStyle)[]
) => {
  return useMemo(() => {
    const { drawing_area, menu_configuration } = app_data
    const { sankey } = drawing_area
    const { ref_selected_style } = menu_configuration
    const { styles_dict } = sankey

    const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_ProtoElement)

    // En mode style : utiliser customisable_attribute du style sélectionné
    // En mode direct : utiliser customisable_attribute du style par défaut
    const disable_attr_props = menu_for_style ?
      styles_dict[ref_selected_style.current]?.customisable_attribute :
      styles_dict[default_style_id]?.customisable_attribute

    return {
      menu_for_style,
      disable_attr_props: disable_attr_props || {},
      t: app_data.t
    }
  }, [app_data, elements])
}


// ============= HELPER FUNCTIONS FOR FACTORIZATION =============

/**
 * Generic function to get a common value from all selected elements
 * Returns the value if all elements have the same value, otherwise returns defaultValue
 */
const getCommonValue = <T,>(
  selected_elements: (Class_ContainerElement | Class_ElementStyle)[],
  propertyGetter: (element: Class_ContainerElement | Class_ElementStyle) => T,
  defaultValue: T
): T => {
  if (selected_elements.length === 0) return defaultValue

  const firstValue = propertyGetter(selected_elements[0])
  const allSame = selected_elements.every(d => propertyGetter(d) === firstValue)

  return allSame && firstValue ? firstValue : defaultValue
}

/**
 * Generic function to create an update function with undo/redo support
 * This is the core factorization for all update functions
 */
const createUpdateFunction = <T,>(
  selected_elements: (Class_ContainerElement | Class_ElementStyle)[],
  propertyName: string,
  propertyGetter: (element: Class_ContainerElement | Class_ElementStyle) => T,
  propertySetter: (element: Class_ContainerElement | Class_ElementStyle, value: T) => void,
  history: Class_ApplicationHistory,
  redrawCallback: () => void
) => {
  return (newValue: T | null | undefined) => {
    if (newValue == undefined || newValue == null) return

    const dict_old_values = Object.fromEntries(
      selected_elements.map(d => [d.id, propertyGetter(d)])
    )

    const _update = () => {
      selected_elements.forEach(d => propertySetter(d, newValue))
      redrawCallback()
    }

    const inv_update = () => {
      selected_elements.forEach(d => propertySetter(d, dict_old_values[d.id]))
      redrawCallback()
    }

    history.saveUndo(inv_update)
    history.saveRedo(_update)
    _update()
  }
}

// ============= MAIN COMPONENT WITH STYLE PATTERN =============

export const MenuConfigurationContainersOSP = ({
  app_data,
  menu_for_style = false
}: {
  app_data: Class_ApplicationData
  menu_for_style?: boolean
}) => {
  const { t, icon_library } = app_data
  const { icon_add_element, icon_remove_element, icon_to_the_left, icon_to_the_right, icon_text_vert_pos_top, icon_text_vert_pos_bottom } = icon_library
  const selected_containers = app_data.drawing_area.selected_containers_list
  //@ts-expect-error xxx
  const has_sankey_plus = app_data.has_sankey_plus

  // =================== ELEMENT SELECTION BASED ON MODE ===================
  // State variable to trigger this menu refreshing
  const [, setCount] = useState(0)
  const [, setCountStyle] = useState(0)
  // Link this menu's update function
  if (!menu_for_style) {
    app_data.menu_configuration.ref_to_menu_config_containers_updater.current = () => setCount(a => a + 1)
  } else {
    app_data.menu_configuration.ref_to_menu_config_styles_updater.current = () => setCountStyle(a => a + 1)
  }

  // Elements on which this menu applies
  let elements: Class_ElementStyle[] | Class_ContainerElement[]

  if (menu_for_style) {
    // MODE STYLE: editing the selected style
    const { ref_selected_style } = app_data.menu_configuration
    elements = [app_data.drawing_area.sankey.styles_dict[ref_selected_style.current]]
  } else {
    // MODE DIRECT: editing selected containers
    elements = app_data.drawing_area.selected_containers_list
  }
  // 🆕 Utiliser le hook pour obtenir disable_attr_props
  const { disable_attr_props } = useContainerAttributeConfig(app_data, elements)


  // =================== REFRESH FUNCTIONS ===================

  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)

    if (menu_for_style) {
      app_data.menu_configuration.updateAllComponentsRelatedToContainers()
      // Update menus for container's appearance in case we use this for style
      app_data.menu_configuration.updateAllComponentsRelatedToContainersStyles()
      // Redraw all visible containers if we modify container style
      app_data.drawing_area.sankey.containers_list.forEach(container => container.draw())
    }
    // And update this menu also
    app_data.menu_configuration.updateAllComponentsRelatedToContainers()
  }

  // =================== UI REFS AND STATE ===================

  const r_editor_ZDT = useRef<ReactQuill>() as { current: ReactQuill }
  const element_ref = elements[0]
  // const zdt_or_image = (element_ref && element_ref instanceof Class_ContainerElement) 
  //   ? (element_ref.is_image === true ? 'image' : 'text') 
  //   : 'text'
  // const [button_text_or_image, set_button_text_or_image] = useState<'text' | 'image'>(zdt_or_image)
  const ref_set_text_value_input = useRef((_: string | null | undefined) => null)

  // Options selector only for direct mode (not for style editing)
  const options_selector = !menu_for_style
    ? app_data.drawing_area.sankey.containers_list_sorted.map((d) => ({
      'label': d.name,
      'value': d.id,
      selected: d.is_selected
    }))
    : []

  const [forceUpdate, setForceUpdate] = useState(false)

  const redrawAndRefresh = () => {
    if (elements[0] instanceof Class_ContainerElement) {
      elements.forEach(zdt => (zdt as Class_ContainerElement).drawAsSelected())
      ref_set_text_value_input.current((elements[0] as Class_ContainerElement)?.name ?? '')
    }
    setForceUpdate(!forceUpdate)
    if (menu_for_style) {
      refreshThisAndUpdateRelatedComponents()
    }
  }

  // =================== DROPDOWN FOR CONTAINER SELECTION ===================

  // const dropdownMultiLabel = () => {
  //   if (menu_for_style) return <></> // No dropdown in style mode

  //   return (
  //     <Box layerStyle='submenuconfig_droplist' width='11vw'>
  //       <OSMultiSelect
  //         t={app_data.t}
  //         elements={options_selector}
  //         onClick={(entries) => {
  //           const entries_values = entries.map(d => d.value)
  //           app_data.drawing_area.sankey.containers_list.forEach(zdt => {
  //             if (entries_values.includes(zdt.id)) {
  //               app_data.drawing_area.addContainerToSelection(zdt)
  //             } else {
  //               app_data.drawing_area.removeContainerFromSelection(zdt)
  //             }
  //           })
  //           redrawAndRefresh()
  //         }}
  //       />
  //     </Box>
  //   )
  // }

  const allLabelTiedToNodes = () => {
    if (menu_for_style) return false // Styles don't have tied_to_nodes
    return getCommonValue(
      elements.filter(e => e instanceof Class_ContainerElement) as Class_ContainerElement[],
      d => (d as Class_ContainerElement).tied_to_nodes,
      false
    )
  }

  const allLabelTiedToNodesAtExtremity = () => {
    if (menu_for_style) return false
    return getCommonValue(
      elements.filter(e => e instanceof Class_ContainerElement) as Class_ContainerElement[],
      d => (d as Class_ContainerElement).at_extremity_of_attached_nodes,
      false
    )
  }

  const allLabelTiedToNodesAtExtremityPos = (_: 'top' | 'bottom' | 'left' | 'right') => {
    if (menu_for_style || elements.length === 0) return false
    return elements
      .filter(e => e instanceof Class_ContainerElement)
      .every(d => (d as Class_ContainerElement).extremity_position === _)
  }

  const allNodesTiedToZDTRef = () => {
    if (menu_for_style || elements.length === 0) return []
    const firstElement = elements[0]
    return firstElement instanceof Class_ContainerElement ? firstElement.attached_node : []
  }

  const allLabelMarginLeft = () =>
    getCommonValue(elements, d => d.margin_left, 0)

  const allLabelMarginRight = () =>
    getCommonValue(elements, d => d.margin_right, 0)

  const allLabelMarginTop = () =>
    getCommonValue(elements, d => d.margin_top, 0)

  const allLabelMarginBottom = () =>
    getCommonValue(elements, d => d.margin_bottom, 0)

  const updateTitle = createUpdateFunction(
    elements,
    'title',
    d => (d as Class_ContainerElement).name,
    (d, v) => { if (d instanceof Class_ContainerElement) d.name = v },
    app_data.history,
    redrawAndRefresh
  )

  const updateLabelTiedToNodes = (value: boolean) => {
    if (menu_for_style) return // Can't tie styles to nodes
    const containerElements = elements.filter(e => e instanceof Class_ContainerElement) as Class_ContainerElement[]
    const dict_old_val = Object.fromEntries(containerElements.map(d => [d.id, d.tied_to_nodes]))

    const _update = () => {
      containerElements.forEach(d => d.tied_to_nodes = value)
      redrawAndRefresh()
    }
    const inv_update = () => {
      containerElements.forEach(d => d.tied_to_nodes = dict_old_val[d.id])
      redrawAndRefresh()
    }
    app_data.history.saveUndo(inv_update)
    app_data.history.saveRedo(_update)
    _update()
  }

  const updateLabelTiedToNodesAtExtremity = (value: boolean) => {
    if (menu_for_style) return
    const containerElements = elements.filter(e => e instanceof Class_ContainerElement) as Class_ContainerElement[]
    const dict_old_val = Object.fromEntries(containerElements.map(d => [d.id, d.at_extremity_of_attached_nodes]))

    const _update = () => {
      containerElements.forEach(d => d.at_extremity_of_attached_nodes = value)
      redrawAndRefresh()
    }
    const inv_update = () => {
      containerElements.forEach(d => d.at_extremity_of_attached_nodes = dict_old_val[d.id])
      redrawAndRefresh()
    }
    app_data.history.saveUndo(inv_update)
    app_data.history.saveRedo(_update)
    _update()
  }

  const updateLabelExtremityPos = (value: 'top' | 'bottom' | 'left' | 'right') => {
    if (menu_for_style) return
    const containerElements = elements.filter(e => e instanceof Class_ContainerElement) as Class_ContainerElement[]
    const dict_old_val = Object.fromEntries(containerElements.map(d => [d.id, d.extremity_position]))

    const _update = () => {
      containerElements.forEach(d => d.extremity_position = value)
      redrawAndRefresh()
    }
    const inv_update = () => {
      containerElements.forEach(d => d.extremity_position = dict_old_val[d.id])
      redrawAndRefresh()
    }
    app_data.history.saveUndo(inv_update)
    app_data.history.saveRedo(_update)
    _update()
  }

  const updateMarginLeft = createUpdateFunction(
    elements,
    'margin_left',
    d => d.margin_left,
    (d, v) => d.margin_left = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateMarginRight = createUpdateFunction(
    elements,
    'margin_right',
    d => d.margin_right,
    (d, v) => d.margin_right = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateMarginTop = createUpdateFunction(
    elements,
    'margin_top',
    d => d.margin_top,
    (d, v) => d.margin_top = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateMarginBottom = createUpdateFunction(
    elements,
    'margin_bottom',
    d => d.margin_bottom,
    (d, v) => d.margin_bottom = v,
    app_data.history,
    redrawAndRefresh
  )

  // const addFreeLAbel = () => {
  //   if (menu_for_style) return // Can't add labels in style mode

  //   let new_element: Class_ContainerElement
  //   const _addFreeLAbel = () => {
  //     new_element = app_data.drawing_area.addNewDefaultContainer()
  //     app_data.drawing_area.purgeSelectionOfContainer()
  //     app_data.drawing_area.addContainerToSelection(new_element)
  //     redrawAndRefresh()
  //   }
  //   const inv_addFreeLAbel = () => {
  //     app_data.drawing_area.purgeSelectionOfContainer()
  //     new_element.delete()
  //     redrawAndRefresh()
  //   }
  //   app_data.history.saveUndo(inv_addFreeLAbel)
  //   app_data.history.saveRedo(_addFreeLAbel)
  //   _addFreeLAbel()
  // }

  // const deleteSelectedLabels = () => {
  //   if (menu_for_style) return // Can't delete in style mode

  //   let dict_old_element: Type_JSON
  //   const containerElements = elements.filter(e => e instanceof Class_ContainerElement) as Class_ContainerElement[]

  //   const _deleteSelectedLabels = () => {
  //     const json_object = {}
  //     dict_old_element = Object.fromEntries(containerElements.map(cont => [cont.id, cont.toJSON(json_object)]))
  //     app_data.drawing_area.deleteSelectedContainers()
  //     redrawAndRefresh()
  //   }
  //   const inv_deleteSelectedLabels = () => {
  //     Object.values(dict_old_element).forEach(cont => {
  //       const n_id = (cont as Type_JSON)['id'] as string
  //       const new_element = app_data.drawing_area.addNewContainer(n_id)
  //       new_element.fromJSON(cont as Type_JSON)
  //       app_data.drawing_area.addContainerToSelection(new_element)
  //     })
  //     redrawAndRefresh()
  //   }
  //   app_data.history.saveUndo(inv_deleteSelectedLabels)
  //   app_data.history.saveRedo(_deleteSelectedLabels)
  //   _deleteSelectedLabels()
  // }

  // =================== UI VARIABLES ===================

  const list_node_tied = allNodesTiedToZDTRef()
  const is_all_zdt_node_tied = allLabelTiedToNodes()
  const is_all_node_tied_to_extremity = allLabelTiedToNodesAtExtremity()
  const options_selector_node_tied = !menu_for_style
    ? app_data.drawing_area.sankey.nodes_list_sorted.map((node) => ({
      'label': node.name,
      'value': node.id,
      selected: list_node_tied.includes(node)
    }))
    : []

  const valAllLabeTiedToNode = elements[0] instanceof Class_ContainerElement ? elements[0].tied_to_nodes : false
  const valAllLabelTiedToNodeIndeterminate = !elements
    .filter(e => e instanceof Class_ContainerElement)
    .every(zdt => (zdt as Class_ContainerElement).tied_to_nodes == valAllLabeTiedToNode)

  const disable_options = menu_for_style
    ? false // Always enabled in style mode
    : (has_sankey_plus ? (elements.length === 0) : true)

  const is_zdt_at_extremity_top = allLabelTiedToNodesAtExtremityPos('top')
  const is_zdt_at_extremity_bottom = allLabelTiedToNodesAtExtremityPos('bottom')
  const is_zdt_at_extremity_left = allLabelTiedToNodesAtExtremityPos('left')
  const is_zdt_at_extremity_right = allLabelTiedToNodesAtExtremityPos('right')

  const content_pos_tied_to_nodes = menu_for_style ? <></> : <Box>
    <OSMultiSelect
      t={app_data.t}
      elements={options_selector_node_tied}
      onClick={(entries) => {
        const entries_values = entries.map(d => d.value)
        const containerElements = elements.filter(e => e instanceof Class_ContainerElement) as Class_ContainerElement[]

        app_data.drawing_area.sankey.nodes_list.forEach(node => {
          if (entries_values.includes(node.id)) {
            containerElements.forEach(zdt => { app_data.drawing_area.attachNodeToCont(node, zdt) })
          } else {
            containerElements.forEach(zdt => { app_data.drawing_area.dettachNodeFromCont(node, zdt) })
          }
        })
        redrawAndRefresh()
      }}
    />
    <Box layerStyle='menuconfigpanel_option_name'>{t('LL.margin')}</Box>
    <OSTooltip label={t('LL.tooltips.margin')} placement='left'>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('LL.marginLeft') || 'Left'}</Box>
          <ConfigMenuNumberInput t={app_data.t} disabled={!disable_attr_props['margin_left']} default_value={allLabelMarginLeft()} function_on_blur={updateMarginLeft} minimum_value={0} stepper={true} />
        </Box>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('LL.marginRight') || 'Right'}</Box>
          <ConfigMenuNumberInput t={app_data.t} disabled={!disable_attr_props['margin_right']} default_value={allLabelMarginRight()} function_on_blur={updateMarginRight} minimum_value={0} stepper={true} />
        </Box>
      </Box>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'></Box>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('LL.marginTop') || 'Top'}</Box>
          <ConfigMenuNumberInput t={app_data.t} disabled={!disable_attr_props['margin_top']} default_value={allLabelMarginTop()} function_on_blur={updateMarginTop} minimum_value={0} stepper={true} />
        </Box>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('LL.marginBottom') || 'Bottom'}</Box>
          <ConfigMenuNumberInput t={app_data.t} disabled={!disable_attr_props['margin_bottom']} default_value={allLabelMarginBottom()} function_on_blur={updateMarginBottom} minimum_value={0} stepper={true} />
        </Box>
      </Box>
    </OSTooltip>

    <Checkbox variant='menuconfigpanel_option_checkbox' iconColor={valAllLabelTiedToNodeIndeterminate ? '#78C2AD' : 'white'} isDisabled={disable_options} isIndeterminate={valAllLabelTiedToNodeIndeterminate} isChecked={allLabelTiedToNodesAtExtremity()} onChange={(evt) => updateLabelTiedToNodesAtExtremity(evt.target.checked)}>
      <OSTooltip label={t('LL.tooltips.tiedToNodesExtremity')} placement='left'>{t('LL.tiedToNodesExtremity')}</OSTooltip>
    </Checkbox>
    {allLabelTiedToNodesAtExtremity() ?
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('LL.extremityPos')}</Box>
        <ButtonGroup isAttached>
          <Button variant={is_zdt_at_extremity_top ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={() => { updateLabelExtremityPos('top') }}>{icon_text_vert_pos_top}</Button>
          <Button variant={is_zdt_at_extremity_bottom ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={() => { updateLabelExtremityPos('bottom') }}>{icon_text_vert_pos_bottom}</Button>
          <Button variant={is_zdt_at_extremity_left ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={() => { updateLabelExtremityPos('left') }}>{icon_to_the_left}</Button>
          <Button variant={is_zdt_at_extremity_right ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={() => { updateLabelExtremityPos('right') }}>{icon_to_the_right}</Button>
        </ButtonGroup>
      </Box>
      : <></>}
  </Box>

  // =================== MAIN MENU ===================

  const content_menu_zdt = <OSTooltip label={!has_sankey_plus && !menu_for_style ? t('Menu.sankeyOSPDisabled') : ''} >
    <Box layerStyle='menuconfigpanel_grid'>
      {/* Add/Delete buttons only in direct mode */}
      {/* {!menu_for_style && (
        <Box as='span' layerStyle='menuconfigpanel_zdt_row_droplist'>
          <Button isDisabled={!has_sankey_plus} variant='menuconfigpanel_add_button' size='sizeConfigButton' onClick={addFreeLAbel}>{icon_add_element}</Button>
          {dropdownMultiLabel()}
          <Button variant='menuconfigpanel_del_button' size='sizeConfigButton' isDisabled={disable_options} onClick={deleteSelectedLabels}>{icon_remove_element}</Button>
        </Box>
      )} */}

      {/* Title only for direct mode */}
      {!menu_for_style && (
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' gridTemplateColumns='1fr 9fr'>
          <Box layerStyle='menuconfigpanel_option_name' textStyle='h3'>{t('LL.name')}</Box>
          <ConfigMenuTextInput disabled={disable_options} default_value={'tutu'} function_on_blur={updateTitle} />
        </Box>
      )}
      {menu_for_style ? <></> : <ConfigMenuStyleElement
        app_data={app_data}
        selected_elements={selected_containers}
        config={ALL_ATTRIBUTES_CONFIG}
        categories={['value_label', 'name_label']}
      />}



      {/* Tied to nodes - only for direct mode */}
      {!menu_for_style && (
        <>
          <Checkbox variant='menuconfigpanel_option_checkbox' iconColor={valAllLabelTiedToNodeIndeterminate ? '#78C2AD' : 'white'} isDisabled={disable_options} isIndeterminate={valAllLabelTiedToNodeIndeterminate} isChecked={is_all_zdt_node_tied} onChange={(evt) => updateLabelTiedToNodes(evt.target.checked)}>
            <OSTooltip label={t('LL.tooltips.tiedToNodes')} placement='left'>{t('LL.tiedToNodes')}</OSTooltip>
          </Checkbox>

          {is_all_zdt_node_tied ? content_pos_tied_to_nodes : <></>}
        </>
      )}
    </Box>
  </OSTooltip>

  return content_menu_zdt
}