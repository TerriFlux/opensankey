import React, { useState, ChangeEvent, useRef, useMemo } from 'react'
import ReactQuill from 'react-quill'

// Imported libs
import {
  Box,
  Checkbox,
  Button,
  Input,
  ButtonGroup
} from '@chakra-ui/react'

import { Type_JSON, default_style_id } from '../deps/OpenSankey/types/Utils'
import { Class_ContainerElement } from '../deps/OpenSankey/Elements/TextZone'
import { Class_ContainerStyle } from '../deps/OpenSankey/Elements/ElementStyle'
import { ConfigMenuStyleElementContainer } from '../deps/OpenSankey/components/dialogs/SankeyStyle'
import { ConfigMenuNumberInput, ConfigMenuTextInput } from '../deps/OpenSankey/components/configmenus/SankeyMenuConfiguration'
import { OSMultiSelect } from '../deps/OpenSankey/components/configmenus/MenuCommon'
import { listOptionSizeQuill } from './UtilsOSP'
import { OSTooltip } from '../deps/OpenSankey/components/configmenus/MenuCommon'
import { MenuColorPicker } from '../deps/OpenSankey/components/configmenus/MenuColorPicker'
import { default_font_size } from '../deps/OpenSankey/css/Theme'
import { Class_ApplicationData } from '../deps/OpenSankey/types/ApplicationData'
import { CONTAINERS_ATTRIBUTES_CONFIG } from '../deps/OpenSankey/Elements/ContainerAttributesConfig'

export const sep = <hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

export interface selected_type { 'label': string; 'value': string }

// 🆕 Hook pour gérer la configuration des attributs disable (comme pour nodes/links)
const useContainerAttributeConfig = (
  app_data: Class_ApplicationData,
  elements: (Class_ContainerElement | Class_ContainerStyle)[]
) => {
  return useMemo(() => {
    const { drawing_area, menu_configuration } = app_data
    const { sankey } = drawing_area
    const { ref_selected_style_container } = menu_configuration
    const { container_styles_dict } = sankey

    const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_ContainerStyle)

    // En mode style : utiliser customisable_attribute du style sélectionné
    // En mode direct : utiliser customisable_attribute du style par défaut
    const disable_attr_props = menu_for_style ?
      container_styles_dict[ref_selected_style_container.current]?.customisable_attribute :
      container_styles_dict[default_style_id]?.customisable_attribute

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
  selected_elements: (Class_ContainerElement | Class_ContainerStyle)[],
  propertyGetter: (element: Class_ContainerElement | Class_ContainerStyle) => T,
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
  selected_elements: (Class_ContainerElement | Class_ContainerStyle)[],
  propertyName: string,
  propertyGetter: (element: Class_ContainerElement | Class_ContainerStyle) => T,
  propertySetter: (element: Class_ContainerElement | Class_ContainerStyle, value: T) => void,
  history: any,
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

export const MenuConfigurationFreeLabelsOSP = ({
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
    app_data.menu_configuration.ref_to_menu_config_container_styles_updater.current = () => setCountStyle(a => a + 1)
  }

  // Elements on which this menu applies
  let elements: Class_ContainerStyle[] | Class_ContainerElement[]

  if (menu_for_style) {
    // MODE STYLE: editing the selected style
    const { ref_selected_style_container } = app_data.menu_configuration
    elements = [app_data.drawing_area.sankey.container_styles_dict[ref_selected_style_container.current]]
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
      app_data.drawing_area.containers_list.forEach(container => container.draw())
    }
    // And update this menu also
    app_data.menu_configuration.updateAllComponentsRelatedToContainers()
  }

  // =================== UI REFS AND STATE ===================

  const r_editor_ZDT = useRef<ReactQuill>() as { current: ReactQuill }
  const element_ref = elements[0]
  const zdt_or_image = (element_ref && element_ref instanceof Class_ContainerElement) 
    ? (element_ref.is_image === true ? 'image' : 'text') 
    : 'text'
  const [button_text_or_image, set_button_text_or_image] = useState<'text' | 'image'>(zdt_or_image)
  const ref_set_text_value_input = useRef((_: string | null | undefined) => null)

  // Options selector only for direct mode (not for style editing)
  const options_selector = !menu_for_style 
    ? app_data.drawing_area.containers_list_sorted.map((d) => ({ 
        'label': d.title, 
        'value': d.id, 
        selected: d.is_selected 
      }))
    : []

  const [forceUpdate, setForceUpdate] = useState(false)

  const redrawAndRefresh = () => {
    if (elements[0] instanceof Class_ContainerElement) {
      elements.forEach(zdt => (zdt as Class_ContainerElement).drawAsSelected())
      ref_set_text_value_input.current((elements[0] as Class_ContainerElement)?.title ?? '')
    }
    setForceUpdate(!forceUpdate)
    if (menu_for_style) {
      refreshThisAndUpdateRelatedComponents()
    }
  }

  // =================== DROPDOWN FOR CONTAINER SELECTION ===================
  
  const dropdownMultiLabel = () => {
    if (menu_for_style) return <></> // No dropdown in style mode
    
    return (
      <Box layerStyle='submenuconfig_droplist' width='11vw'>
        <OSMultiSelect
          t={app_data.t}
          elements={options_selector}
          onClick={(entries) => {
            const entries_values = entries.map(d => d.value)
            app_data.drawing_area.containers_list.forEach(zdt => {
              if (entries_values.includes(zdt.id)) {
                app_data.drawing_area.addContainerToSelection(zdt)
              } else {
                app_data.drawing_area.removeFreeLabelFromSelection(zdt)
              }
            })
            redrawAndRefresh()
          }}
        />
      </Box>
    )
  }

  // =================== FACTORIZED FUNCTIONS FOR ALL LABEL PROPERTIES ===================
  
  const allLabelHeight = () => 
    Math.round(getCommonValue(elements, d => d.label_height, -1))

  const allLabelWidth = () => 
    Math.round(getCommonValue(elements, d => d.label_width, -1))

  const allLabelTitle = () => 
    elements.length > 0 && elements[0] instanceof Class_ContainerElement ? elements[0].title : ''

  const allLabelTransparent = () => 
    getCommonValue(elements, d => d.opacity, 0)

  const allLabelThickness = () => 
    getCommonValue(elements, d => d.thickness, 0)

  const allLabelDashed = () => 
    getCommonValue(elements, d => d.dashed, false)

  const allLabelBgVisible = () => 
    getCommonValue(elements, d => d.color_visible, false)

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

  const allLabelVerticalText = () => 
    getCommonValue(elements, d => d.vertical_text, false)

  const allLabelVerticalAlignment = (_: 'left' | 'right') => {
    if (elements.length === 0) return false
    return elements.every(d => d.vertical_alignment === _)
  }

  // =================== FACTORIZED UPDATE FUNCTIONS ===================
  
  const updateTitle = createUpdateFunction(
    elements,
    'title',
    d => (d as Class_ContainerElement).title,
    (d, v) => { if (d instanceof Class_ContainerElement) d.title = v },
    app_data.history,
    redrawAndRefresh
  )

  const updateHeight = createUpdateFunction(
    elements,
    'label_height',
    d => d.label_height,
    (d, v) => d.label_height = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateWidth = createUpdateFunction(
    elements,
    'label_width',
    d => d.label_width,
    (d, v) => d.label_width = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateTransparent = createUpdateFunction(
    elements,
    'opacity',
    d => d.opacity,
    (d, v) => d.opacity = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateThickness = createUpdateFunction(
    elements,
    'thickness',
    d => d.thickness,
    (d, v) => d.thickness = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateDashed = createUpdateFunction(
    elements,
    'dashed',
    d => d.dashed,
    (d, v) => d.dashed = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateLabelBgVisible = createUpdateFunction(
    elements,
    'color_visible',
    d => d.color_visible,
    (d, v) => d.color_visible = v,
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

  const updateVerticalText = createUpdateFunction(
    elements,
    'vertical_text',
    d => d.vertical_text,
    (d, v) => d.vertical_text = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateVerticalAlignment = createUpdateFunction(
    elements,
    'vertical_alignment',
    d => d.vertical_alignment,
    (d, v) => d.vertical_alignment = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateImageSrc = (value: string) => {
    if (menu_for_style) return // Styles don't have image_src
    const containerElements = elements.filter(e => e instanceof Class_ContainerElement) as Class_ContainerElement[]
    const dict_old_val = Object.fromEntries(containerElements.map(d => [d.id, d.image_src]))
    
    const _update = () => {
      containerElements.forEach(d => d.image_src = value)
      redrawAndRefresh()
    }
    const inv_update = () => {
      containerElements.forEach(d => d.image_src = dict_old_val[d.id])
      redrawAndRefresh()
    }
    app_data.history.saveUndo(inv_update)
    app_data.history.saveRedo(_update)
    _update()
  }

  // =================== SPECIAL UPDATE FUNCTIONS ===================

  const updateLabelBorderTransparent = (_: boolean) => {
    const dict_old_val = Object.fromEntries(elements.map(d => [d.id, d.transparent_border]))
    const _updateLabelBorderTransparent = () => {
      elements.map(d => d.transparent_border = !_)
      redrawAndRefresh()
    }
    const inv_updateLabelBorderTransparent = () => {
      elements.map(d => d.transparent_border = dict_old_val[d.id])
      redrawAndRefresh()
    }
    app_data.history.saveUndo(inv_updateLabelBorderTransparent)
    app_data.history.saveRedo(_updateLabelBorderTransparent)
    _updateLabelBorderTransparent()
  }

  const updateTypeLabelToText = () => {
    if (menu_for_style) return
    const containerElements = elements.filter(e => e instanceof Class_ContainerElement) as Class_ContainerElement[]
    const dict_old_val = Object.fromEntries(containerElements.map(d => [d.id, d.is_image]))
    const old_type = button_text_or_image
    
    const _update = () => {
      containerElements.forEach(d => d.is_image = false)
      set_button_text_or_image('text')
      redrawAndRefresh()
    }
    const inv_update = () => {
      containerElements.forEach(d => d.is_image = dict_old_val[d.id])
      set_button_text_or_image(old_type)
      redrawAndRefresh()
    }
    app_data.history.saveUndo(inv_update)
    app_data.history.saveRedo(_update)
    _update()
  }

  const updateTypeLabelToImage = () => {
    if (menu_for_style) return
    const containerElements = elements.filter(e => e instanceof Class_ContainerElement) as Class_ContainerElement[]
    const dict_old_val = Object.fromEntries(containerElements.map(d => [d.id, d.is_image]))
    const old_type = button_text_or_image
    
    const _update = () => {
      containerElements.forEach(d => d.is_image = true)
      set_button_text_or_image('image')
      redrawAndRefresh()
    }
    const inv_update = () => {
      containerElements.forEach(d => d.is_image = dict_old_val[d.id])
      set_button_text_or_image(old_type)
      redrawAndRefresh()
    }
    app_data.history.saveUndo(inv_update)
    app_data.history.saveRedo(_update)
    _update()
  }

  // =================== ADD/DELETE FUNCTIONS (ONLY FOR DIRECT MODE) ===================

  const addFreeLAbel = () => {
    if (menu_for_style) return // Can't add labels in style mode
    
    let new_element: Class_ContainerElement
    const _addFreeLAbel = () => {
      new_element = app_data.drawing_area.addNewDefaultFreeLabel()
      app_data.drawing_area.purgeSelectionOfContainer()
      app_data.drawing_area.addContainerToSelection(new_element)
      redrawAndRefresh()
    }
    const inv_addFreeLAbel = () => {
      app_data.drawing_area.purgeSelectionOfContainer()
      new_element.delete()
      redrawAndRefresh()
    }
    app_data.history.saveUndo(inv_addFreeLAbel)
    app_data.history.saveRedo(_addFreeLAbel)
    _addFreeLAbel()
  }

  const deleteSelectedLabels = () => {
    if (menu_for_style) return // Can't delete in style mode
    
    let dict_old_element: Type_JSON
    const containerElements = elements.filter(e => e instanceof Class_ContainerElement) as Class_ContainerElement[]
    
    const _deleteSelectedLabels = () => {
      dict_old_element = Object.fromEntries(containerElements.map(cont => [cont.id, cont.toJSON()]))
      app_data.drawing_area.deleteSelectedFreeLabels()
      redrawAndRefresh()
    }
    const inv_deleteSelectedLabels = () => {
      Object.values(dict_old_element).forEach(cont => {
        const n_id = (cont as Type_JSON)['id'] as string
        const new_element = app_data.drawing_area.addNewFreeLabel(n_id)
        new_element.fromJSON(cont as Type_JSON)
        app_data.drawing_area.addContainerToSelection(new_element)
      })
      redrawAndRefresh()
    }
    app_data.history.saveUndo(inv_deleteSelectedLabels)
    app_data.history.saveRedo(_deleteSelectedLabels)
    _deleteSelectedLabels()
  }

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
    
  const valAllLabelBorderTransparent = elements[0]?.transparent_border ?? false
  const valAllLabelDashed = elements[0]?.dashed ?? false
  const valAllLabelBorderTransparentIndeterminate = !menu_for_style && !elements.every(zdt => zdt.transparent_border == valAllLabelBorderTransparent)
  const valAllLabelDashedIndeterminate = !menu_for_style && !elements.every(zdt => zdt.dashed == valAllLabelDashed)
  const valAllLabelBgVisible = elements[0]?.color_visible ?? false
  const valAllLabelBgVisibleIndeterminate = !menu_for_style && !elements.every(zdt => zdt.color_visible == elements[0]?.color_visible)
  
  const valAllLabeTiedToNode = elements[0] instanceof Class_ContainerElement ? elements[0].tied_to_nodes : false
  const valAllLabelTiedToNodeIndeterminate = !elements
    .filter(e => e instanceof Class_ContainerElement)
    .every(zdt => (zdt as Class_ContainerElement).tied_to_nodes == valAllLabeTiedToNode)

  const Size = ReactQuill.Quill.import('attributors/style/size')
  Size.whitelist = listOptionSizeQuill
  ReactQuill.Quill.register(Size, true)

  const modules = {
    toolbar: [
      [{ 'font': [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'size': listOptionSizeQuill }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['clean'],
    ],
  }

  const formats = [
    'font', 'size', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'align'
  ]

  const disable_options = menu_for_style 
    ? false // Always enabled in style mode
    : (has_sankey_plus ? (elements.length === 0) : true)

  const is_zdt_at_extremity_top = allLabelTiedToNodesAtExtremityPos('top')
  const is_zdt_at_extremity_bottom = allLabelTiedToNodesAtExtremityPos('bottom')
  const is_zdt_at_extremity_left = allLabelTiedToNodesAtExtremityPos('left')
  const is_zdt_at_extremity_right = allLabelTiedToNodesAtExtremityPos('right')

  // =================== CONTENT BLOCKS ===================

  const content_image = <>
    <OSTooltip label={!has_sankey_plus ? t('Menu.sankeyOSPDisabled') : ''} >
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Noeud.img_src')}
        </Box>
        <Input
          accept='image/*'
          type="file"
          disabled={disable_options || menu_for_style}
          onChange={(evt: ChangeEvent) => {
            if (menu_for_style) return
            const files = (evt.target as HTMLFormElement).files
            const reader = new FileReader()
            reader.onload = (() => {
              return (e: ProgressEvent<FileReader>) => {
                const resultat = (e.target as FileReader).result
                const res = resultat?.toString().replaceAll('=', '')
                updateImageSrc((res as string))
              }
            })()
            reader.readAsDataURL(files[0])
          }}
        />
      </Box>
    </OSTooltip>
  </>

  const content_pos_not_tied_to_nodes = <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>{t('LL.hl')}</Box>
      <ConfigMenuNumberInput
        t={app_data.t}
        disabled={!disable_attr_props['label_height'] || (is_all_zdt_node_tied && (is_zdt_at_extremity_left || is_zdt_at_extremity_right))}
        default_value={allLabelHeight()}
        function_on_blur={updateHeight}
        minimum_value={1}
        stepper={true}
      />
    </Box>
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>{t('LL.ll')}</Box>
      <ConfigMenuNumberInput
        t={app_data.t}
        disabled={!disable_attr_props['label_width'] || (is_all_zdt_node_tied && (is_zdt_at_extremity_top || is_zdt_at_extremity_bottom))}
        default_value={allLabelWidth()}
        function_on_blur={updateWidth}
        minimum_value={1}
        stepper={true}
      />
    </Box>
  </Box>

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
      {!menu_for_style && (
        <Box as='span' layerStyle='menuconfigpanel_zdt_row_droplist'>
          <Button isDisabled={!has_sankey_plus} variant='menuconfigpanel_add_button' size='sizeConfigButton' onClick={addFreeLAbel}>{icon_add_element}</Button>
          {dropdownMultiLabel()}
          <Button variant='menuconfigpanel_del_button' size='sizeConfigButton' isDisabled={disable_options} onClick={deleteSelectedLabels}>{icon_remove_element}</Button>
        </Box>
      )}

      {/* Title only for direct mode */}
      {!menu_for_style && (
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' gridTemplateColumns='1fr 9fr'>
          <Box layerStyle='menuconfigpanel_option_name' textStyle='h3'>{t('LL.title')}</Box>
          <ConfigMenuTextInput disabled={disable_options} default_value={allLabelTitle()} function_on_blur={updateTitle} />
        </Box>
      )}
    {menu_for_style ? <></> : <ConfigMenuStyleElementContainer
      app_data={app_data}
      selected_elements={selected_containers}
      config={CONTAINERS_ATTRIBUTES_CONFIG}
    />}
      {/* Text/Image toggle only for direct mode */}
      {!menu_for_style && (
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('Noeud.illustration_type')}</Box>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Button isDisabled={disable_options} variant='menuconfigpanel_option_button' onClick={updateTypeLabelToText}>Texte</Button>
            <Button disabled={disable_options} variant='menuconfigpanel_option_button' onClick={updateTypeLabelToImage}>Image</Button>
          </Box>
        </Box>
      )}

      {/* Content editor only for direct mode */}
      {!menu_for_style && button_text_or_image === 'text' && (
        <Box style={{ 'height': '300px' }}>
          <ReactQuill
            className='quill_editor'
            value={elements.length > 0 && elements[0] instanceof Class_ContainerElement ? elements[0].content : ''}
            ref={r_editor_ZDT}
            onChange={(evt, _, src) => {
              if (src == 'user') {
                elements
                  .filter(e => e instanceof Class_ContainerElement)
                  .forEach(n => (n as Class_ContainerElement).content = evt)
                redrawAndRefresh()
              }
            }}
            theme="snow"
            modules={modules}
            formats={formats}
            readOnly={disable_options}
            style={{ 'height': '300px', fontSize: default_font_size, color: (disable_options) ? '#666666' : '', backgroundColor: (disable_options) ? '#cccccc' : '', overflowY: 'scroll' }}
          />
        </Box>
      )}
      
      {!menu_for_style && button_text_or_image === 'image' && content_image}
      
      {sep}
      
      {/* Vertical text options - available in both modes */}
      {(menu_for_style || button_text_or_image === 'text') && (
        <>
          <Checkbox variant='menuconfigpanel_option_checkbox' isDisabled={!disable_attr_props['vertical_text']} isChecked={allLabelVerticalText()} onChange={(evt) => updateVerticalText(evt.target.checked)}>
            <OSTooltip label={t('LL.tooltips.verticalText') || 'Orient text vertically'} placement='left'>
              {t('LL.verticalText') || 'Vertical Text'}
            </OSTooltip>
          </Checkbox>

          {allLabelVerticalText() && (
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name'>{t('LL.verticalAlignment') || 'Alignment'}</Box>
              <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                <Button isDisabled={!disable_attr_props['vertical_alignment']} variant='menuconfigpanel_option_button' colorScheme={allLabelVerticalAlignment('left') ? 'blue' : 'gray'} onClick={() => updateVerticalAlignment('left')}>
                  {t('LL.alignLeft') || 'Left'}
                </Button>
                <Button isDisabled={!disable_attr_props['vertical_alignment']} variant='menuconfigpanel_option_button' colorScheme={allLabelVerticalAlignment('right') ? 'blue' : 'gray'} onClick={() => updateVerticalAlignment('right')}>
                  {t('LL.alignRight') || 'Right'}
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}
      
      {/* Style attributes - available in both modes */}
      <Box as='span' layerStyle='menuconfigpanel_row_3cols'>
        <Checkbox variant='menuconfigpanel_option_checkbox' iconColor={valAllLabelBgVisibleIndeterminate ? '#78C2AD' : 'white'} isDisabled={!disable_attr_props['color_visible']} isIndeterminate={valAllLabelBgVisibleIndeterminate} isChecked={allLabelBgVisible()} onChange={(evt) => updateLabelBgVisible(evt.target.checked)}>
          {t('LL.cfl')}
        </Checkbox>
        <MenuColorPicker isDisabled={!disable_attr_props['color']} initialColor={(elements.length === 1) ? elements[0].color : '#ffffff'} onColorChange={(new_color) => { elements.map(d => d.color = new_color); redrawAndRefresh() }} />
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('LL.ft')}</Box>
          <ConfigMenuNumberInput t={app_data.t} disabled={!disable_attr_props['opacity']} default_value={allLabelTransparent()} function_on_blur={updateTransparent} minimum_value={0} stepper={true} />
        </Box>
      </Box>

      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Checkbox variant='menuconfigpanel_option_checkbox' iconColor={valAllLabelBorderTransparentIndeterminate ? '#78C2AD' : 'white'} isDisabled={!disable_attr_props['transparent_border']} isIndeterminate={valAllLabelBorderTransparentIndeterminate} isChecked={!valAllLabelBorderTransparent} onChange={(evt) => updateLabelBorderTransparent(evt.target.checked)}>
          {t('LL.bt')}
        </Checkbox>
        <MenuColorPicker isDisabled={!disable_attr_props['color_border']} initialColor={(elements.length === 1) ? elements[0].color_border : '#ffffff'} onColorChange={(new_color) => { elements.map(d => d.color_border = new_color); redrawAndRefresh() }} />
      </Box>

      <Box as='span' layerStyle='menuconfigpanel_row_3cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('LL.thickness')}</Box>
        <ConfigMenuNumberInput t={app_data.t} disabled={!disable_attr_props['thickness']} default_value={allLabelThickness()} function_on_blur={updateThickness} minimum_value={0} stepper={true} />
        <Checkbox variant='menuconfigpanel_option_checkbox' isDisabled={!disable_attr_props['dashed']} isChecked={allLabelDashed()} onChange={(evt) => updateDashed(evt.target.checked)}>{t('LL.dashed')}</Checkbox>
      </Box>

      {sep}

      {/* Tied to nodes - only for direct mode */}
      {!menu_for_style && (
        <>
          <Checkbox variant='menuconfigpanel_option_checkbox' iconColor={valAllLabelTiedToNodeIndeterminate ? '#78C2AD' : 'white'} isDisabled={disable_options} isIndeterminate={valAllLabelTiedToNodeIndeterminate} isChecked={is_all_zdt_node_tied} onChange={(evt) => updateLabelTiedToNodes(evt.target.checked)}>
            <OSTooltip label={t('LL.tooltips.tiedToNodes')} placement='left'>{t('LL.tiedToNodes')}</OSTooltip>
          </Checkbox>

          {is_all_zdt_node_tied ? content_pos_tied_to_nodes : <></>}
          {(!is_all_zdt_node_tied || (is_all_zdt_node_tied && is_all_node_tied_to_extremity)) ? content_pos_not_tied_to_nodes : <></>}
        </>
      )}
    </Box>
  </OSTooltip>

  return content_menu_zdt
}