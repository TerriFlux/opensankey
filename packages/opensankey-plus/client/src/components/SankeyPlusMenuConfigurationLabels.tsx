import React, { useState, ChangeEvent, useRef } from 'react'
import ReactQuill from 'react-quill'
// 'react-quill' seem to not be updated anymore, for new it doesn't create problem but it make a warning error in console
// to solve it when time will come we can use 'react-quill-new' wich solve this issu (https://github.com/zenoamaro/react-quill/issues/988#issuecomment-2241533429)

// Imported libs
import {
  Box,
  Checkbox,
  Button,
  Input,
  ButtonGroup
} from '@chakra-ui/react'

import { Type_JSON } from '../deps/OpenSankey/types/Utils'
import { Class_ContainerElement } from '../deps/OpenSankey/Elements/TextZone'

import { ConfigMenuNumberInput, ConfigMenuTextInput } from '../deps/OpenSankey/components/configmenus/SankeyMenuConfiguration'
import { OSMultiSelect } from '../deps/OpenSankey/components/configmenus/MenuCommon'
import { listOptionSizeQuill } from './UtilsOSP'
import { OSTooltip } from '../deps/OpenSankey/components/configmenus/MenuCommon'
import { MenuColorPicker } from '../deps/OpenSankey/components/configmenus/MenuColorPicker'
import { default_font_size } from '../deps/OpenSankey/css/Theme'
import { Class_ApplicationData } from '../deps/OpenSankey/types/ApplicationData'

export const sep = <hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

export interface selected_type { 'label': string; 'value': string }

// ============= HELPER FUNCTIONS FOR FACTORIZATION =============

/**
 * Generic function to get a common value from all selected elements
 * Returns the value if all elements have the same value, otherwise returns defaultValue
 */
const getCommonValue = <T,>(
  selected_zdt: Class_ContainerElement[],
  propertyGetter: (element: Class_ContainerElement) => T,
  defaultValue: T
): T => {
  if (selected_zdt.length === 0) return defaultValue
  
  const firstValue = propertyGetter(selected_zdt[0])
  const allSame = selected_zdt.every(d => propertyGetter(d) === firstValue)
  
  return allSame ? firstValue : defaultValue
}

/**
 * Generic function to create an update function with undo/redo support
 * This is the core factorization for all update functions
 */
const createUpdateFunction = <T,>(
  selected_zdt: Class_ContainerElement[],
  propertyName: string,
  propertyGetter: (element: Class_ContainerElement) => T,
  propertySetter: (element: Class_ContainerElement, value: T) => void,
  history: any,
  redrawCallback: () => void
) => {
  return (newValue: T | null | undefined) => {
    if (newValue == undefined || newValue == null) return

    const dict_old_values = Object.fromEntries(
      selected_zdt.map(d => [d.id, propertyGetter(d)])
    )

    const _update = () => {
      selected_zdt.forEach(d => propertySetter(d, newValue))
      redrawCallback()
    }

    const inv_update = () => {
      selected_zdt.forEach(d => propertySetter(d, dict_old_values[d.id]))
      redrawCallback()
    }

    history.saveUndo(inv_update)
    history.saveRedo(_update)
    _update()
  }
}

export const MenuConfigurationFreeLabelsOSP = ({app_data}:{app_data: Class_ApplicationData}) => {
  const { t, icon_library } = app_data
  const { icon_add_element, icon_remove_element, icon_to_the_left, icon_to_the_right, icon_text_vert_pos_top, icon_text_vert_pos_bottom } = icon_library
  const selected_zdt = app_data.drawing_area.selected_containers_list

  //@ts-expect-error xxx
  const has_sankey_plus = app_data.has_sankey_plus

  const r_editor_ZDT = useRef<ReactQuill>() as { current: ReactQuill }
  const zdt_or_image = (selected_zdt.length > 0 ? (selected_zdt[0].is_image === true ? 'image' : 'text') : 'text')
  const [button_text_or_image, set_button_text_or_image] = useState<'text' | 'image'>(zdt_or_image)
  const ref_set_text_value_input = useRef((_: string | null | undefined) => null)
  const options_selector = app_data.drawing_area.containers_list_sorted.map((d) => { return { 'label': d.title, 'value': d.id, selected: d.is_selected } })


  const [forceUpdate, setForceUpdate] = useState(false)
  // Link current component updater to menu config class
  app_data.menu_configuration.ref_to_menu_config_containers_updater.current = () => setForceUpdate(!forceUpdate)

  const redrawAndRefresh = () => {
    selected_zdt.forEach(zdt => zdt.drawAsSelected())
    ref_set_text_value_input.current(selected_zdt[0]?.title ?? '')
    setForceUpdate(!forceUpdate)
  }

  //Renvoie le menue déroulant pour la sélection des labels libres
  const dropdownMultiLabel = () => {
    const DD = (
      <Box
        layerStyle='submenuconfig_droplist'
        width='11vw'
      >
        <OSMultiSelect
          t={app_data.t}
          elements={options_selector}
          onClick={(entries) => {
            const entries_values = entries.map(d => d.value)
            app_data.drawing_area.containers_list.forEach(zdt => {
              if (entries_values.includes(zdt.id)) {
                app_data.drawing_area.addContainerToSelection(zdt)
              }
              else {
                app_data.drawing_area.removeFreeLabelFromSelection(zdt)
              }
            })
            redrawAndRefresh()
          }}
        />
      </Box>)
    return DD
  }

  //=================FACTORIZED FUNCTIONS FOR ALL LABEL PROPERTIES===========================
  
  const allLabelHeight = () => 
    Math.round(getCommonValue(selected_zdt, d => d.label_height, -1))

  const allLabelWidth = () => 
    Math.round(getCommonValue(selected_zdt, d => d.label_width, -1))

  const allLabelTitle = () => 
    selected_zdt.length > 0 ? selected_zdt[0].title : ''

  const allLabelTransparent = () => 
    getCommonValue(selected_zdt, d => d.opacity, 0)

  const allLabelThickness = () => 
    getCommonValue(selected_zdt, d => d.thickness, 0)

  const allLabelDashed = () => 
    getCommonValue(selected_zdt, d => d.dashed, false)

  const allLabelBgVisible = () => 
    getCommonValue(selected_zdt, d => d.color_visible, false)

  const allLabelTiedToNodes = () => 
    getCommonValue(selected_zdt, d => d.tied_to_nodes, false)

  const allLabelTiedToNodesAtExtremity = () => 
    getCommonValue(selected_zdt, d => d.at_extremity_of_attached_nodes, false)

  const allLabelTiedToNodesAtExtremityPos = (_: 'top' | 'bottom' | 'left' | 'right') => {
    if (selected_zdt.length === 0) return false
    return selected_zdt.every(d => d.extremity_position === _)
  }

  const allNodesTiedToZDTRef = () => 
    selected_zdt.length > 0 ? selected_zdt[0].attached_node : []

  const allLabelMarginLeft = () => 
    getCommonValue(selected_zdt, d => d.margin_left, 0)

  const allLabelMarginRight = () => 
    getCommonValue(selected_zdt, d => d.margin_right, 0)

  const allLabelMarginTop = () => 
    getCommonValue(selected_zdt, d => d.margin_top, 0)

  const allLabelMarginBottom = () => 
    getCommonValue(selected_zdt, d => d.margin_bottom, 0)

  const allLabelVerticalText = () => 
    getCommonValue(selected_zdt, d => d.vertical_text, false)

  const allLabelVerticalAlignment = (_: 'left' | 'right') => {
    if (selected_zdt.length === 0) return false
    return selected_zdt.every(d => d.vertical_alignment === _)
  }

  //=================FACTORIZED UPDATE FUNCTIONS===========================
  
  // Simple property updates using the generic factory
  const updateTitle = createUpdateFunction(
    selected_zdt, 'title',
    d => d.title,
    (d, v) => d.title = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateHeight = createUpdateFunction(
    selected_zdt, 'label_height',
    d => d.label_height,
    (d, v) => d.label_height = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateWidth = createUpdateFunction(
    selected_zdt, 'label_width',
    d => d.label_width,
    (d, v) => d.label_width = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateTransparent = createUpdateFunction(
    selected_zdt, 'opacity',
    d => d.opacity,
    (d, v) => d.opacity = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateThickness = createUpdateFunction(
    selected_zdt, 'thickness',
    d => d.thickness,
    (d, v) => d.thickness = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateDashed = createUpdateFunction(
    selected_zdt, 'dashed',
    d => d.dashed,
    (d, v) => d.dashed = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateLabelBgVisible = createUpdateFunction(
    selected_zdt, 'color_visible',
    d => d.color_visible,
    (d, v) => d.color_visible = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateLabelTiedToNodes = createUpdateFunction(
    selected_zdt, 'tied_to_nodes',
    d => d.tied_to_nodes,
    (d, v) => d.tied_to_nodes = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateLabelTiedToNodesAtExtremity = createUpdateFunction(
    selected_zdt, 'at_extremity_of_attached_nodes',
    d => d.at_extremity_of_attached_nodes,
    (d, v) => d.at_extremity_of_attached_nodes = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateLabelExtremityPos = createUpdateFunction(
    selected_zdt, 'extremity_position',
    d => d.extremity_position,
    (d, v) => d.extremity_position = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateMarginLeft = createUpdateFunction(
    selected_zdt, 'margin_left',
    d => d.margin_left,
    (d, v) => d.margin_left = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateMarginRight = createUpdateFunction(
    selected_zdt, 'margin_right',
    d => d.margin_right,
    (d, v) => d.margin_right = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateMarginTop = createUpdateFunction(
    selected_zdt, 'margin_top',
    d => d.margin_top,
    (d, v) => d.margin_top = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateMarginBottom = createUpdateFunction(
    selected_zdt, 'margin_bottom',
    d => d.margin_bottom,
    (d, v) => d.margin_bottom = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateVerticalText = createUpdateFunction(
    selected_zdt, 'vertical_text',
    d => d.vertical_text,
    (d, v) => d.vertical_text = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateVerticalAlignment = createUpdateFunction(
    selected_zdt, 'vertical_alignment',
    d => d.vertical_alignment,
    (d, v) => d.vertical_alignment = v,
    app_data.history,
    redrawAndRefresh
  )

  const updateImageSrc = createUpdateFunction(
    selected_zdt, 'image_src',
    d => d.image_src,
    (d, v) => d.image_src = v,
    app_data.history,
    redrawAndRefresh
  )

  // Special update functions with custom logic
  const updateLabelBorderTransparent = (_: boolean) => {
    const dict_old_val = Object.fromEntries(selected_zdt.map(d => [d.id, d.transparent_border]))
    const _updateLabelBorderTransparent = () => {
      selected_zdt.map(d => d.transparent_border = !_)
      redrawAndRefresh()
    }
    const inv_updateLabelBorderTransparent = () => {
      selected_zdt.map(d => d.transparent_border = dict_old_val[d.id])
      redrawAndRefresh()
    }
    app_data.history.saveUndo(inv_updateLabelBorderTransparent)
    app_data.history.saveRedo(_updateLabelBorderTransparent)
    _updateLabelBorderTransparent()
  }

  const updateTypeLabelToText = () => {
    const dict_old_val = Object.fromEntries(selected_zdt.map(d => [d.id, d.is_image]))
    const old_type = button_text_or_image
    const _updateTypeLabelToText = () => {
      selected_zdt.map(d => d.is_image = false)
      set_button_text_or_image('text')
      redrawAndRefresh()
    }
    const inv_updateTypeLabelToText = () => {
      selected_zdt.map(d => d.is_image = dict_old_val[d.id])
      set_button_text_or_image(old_type)
      redrawAndRefresh()
    }
    app_data.history.saveUndo(inv_updateTypeLabelToText)
    app_data.history.saveRedo(_updateTypeLabelToText)
    _updateTypeLabelToText()
  }

  const updateTypeLabelToImage = () => {
    const dict_old_val = Object.fromEntries(selected_zdt.map(d => [d.id, d.is_image]))
    const old_type = button_text_or_image
    const _updateTypeLabelToImage = () => {
      selected_zdt.map(d => d.is_image = true)
      set_button_text_or_image('image')
      redrawAndRefresh()
    }
    const inv_updateTypeLabelToImage = () => {
      selected_zdt.map(d => d.is_image = dict_old_val[d.id])
      set_button_text_or_image(old_type)
      redrawAndRefresh()
    }
    app_data.history.saveUndo(inv_updateTypeLabelToImage)
    app_data.history.saveRedo(_updateTypeLabelToImage)
    _updateTypeLabelToImage()
  }

  //=================OTHER FUNCTIONS===========================

  const list_node_tied = allNodesTiedToZDTRef()
  const is_all_zdt_node_tied = allLabelTiedToNodes()
  const is_all_node_tied_to_extremity = allLabelTiedToNodesAtExtremity()
  const options_selector_node_tied = app_data.drawing_area.sankey.nodes_list_sorted.map((node) => { return { 'label': node.name, 'value': node.id, selected: list_node_tied.includes(node) } })
  const valAllLabelBorderTransparent = selected_zdt[0]?.transparent_border ?? false
  const valAllLabelDashed = selected_zdt[0]?.dashed ?? false
  const valAllLabelBorderTransparentIndeterminate = !selected_zdt.every(zdt => zdt.transparent_border == valAllLabelBorderTransparent)
  const valAllLabelDashedIndeterminate = !selected_zdt.every(zdt => zdt.dashed == valAllLabelDashed)
  const valAllLabelBgVisible = selected_zdt[0]?.color_visible ?? false
  const valAllLabelBgVisibleIndeterminate = !selected_zdt.every(zdt => zdt.color_visible == valAllLabelBgVisible)
  const valAllLabeTiedToNode = selected_zdt[0]?.tied_to_nodes ?? false
  const valAllLabelTiedToNodeIndeterminate = !selected_zdt.every(zdt => zdt.tied_to_nodes == valAllLabeTiedToNode)

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

  const disable_options = has_sankey_plus ? (selected_zdt.length === 0) : true

  const addFreeLAbel = () => {
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
    let dict_old_element: Type_JSON
    const _deleteSelectedLabels = () => {
      dict_old_element = Object.fromEntries(app_data.drawing_area.selected_containers_list.map(cont => [cont.id, cont.toJSON()]))
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

  const is_zdt_at_extremity_top = allLabelTiedToNodesAtExtremityPos('top')
  const is_zdt_at_extremity_bottom = allLabelTiedToNodesAtExtremityPos('bottom')
  const is_zdt_at_extremity_left = allLabelTiedToNodesAtExtremityPos('left')
  const is_zdt_at_extremity_right = allLabelTiedToNodesAtExtremityPos('right')

  const content_image = <>
    <OSTooltip label={!has_sankey_plus ? t('Menu.sankeyOSPDisabled') : ''} >
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Noeud.img_src')}
        </Box>
        <Input
          accept='image/*'
          type="file"
          disabled={disable_options}
          onChange={(evt: ChangeEvent) => {
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
        disabled={disable_options || (is_all_zdt_node_tied && (is_zdt_at_extremity_left || is_zdt_at_extremity_right))}
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
        disabled={disable_options || (is_all_zdt_node_tied && (is_zdt_at_extremity_top || is_zdt_at_extremity_bottom))}
        default_value={allLabelWidth()}
        function_on_blur={updateWidth}
        minimum_value={1}
        stepper={true}
      />
    </Box>
  </Box>

  const content_pos_tied_to_nodes = <Box>
    <OSMultiSelect
      t={app_data.t}
      elements={options_selector_node_tied}
      onClick={(entries) => {
        const entries_values = entries.map(d => d.value)
        app_data.drawing_area.sankey.nodes_list.forEach(node => {
          if (entries_values.includes(node.id)) {
            app_data.drawing_area.selected_containers_list.forEach(zdt => { app_data.drawing_area.attachNodeToCont(node, zdt) })
          } else {
            app_data.drawing_area.selected_containers_list.forEach(zdt => { app_data.drawing_area.dettachNodeFromCont(node, zdt) })
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
          <ConfigMenuNumberInput t={app_data.t} disabled={disable_options} default_value={allLabelMarginLeft()} function_on_blur={updateMarginLeft} minimum_value={0} stepper={true} />
        </Box>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('LL.marginRight') || 'Right'}</Box>
          <ConfigMenuNumberInput t={app_data.t} disabled={disable_options} default_value={allLabelMarginRight()} function_on_blur={updateMarginRight} minimum_value={0} stepper={true} />
        </Box>
      </Box>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'></Box>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('LL.marginTop') || 'Top'}</Box>
          <ConfigMenuNumberInput t={app_data.t} disabled={disable_options} default_value={allLabelMarginTop()} function_on_blur={updateMarginTop} minimum_value={0} stepper={true} />
        </Box>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('LL.marginBottom') || 'Bottom'}</Box>
          <ConfigMenuNumberInput t={app_data.t} disabled={disable_options} default_value={allLabelMarginBottom()} function_on_blur={updateMarginBottom} minimum_value={0} stepper={true} />
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

  const content_menu_zdt = <OSTooltip label={!has_sankey_plus ? t('Menu.sankeyOSPDisabled') : ''} >
    <Box layerStyle='menuconfigpanel_grid'>
      <Box as='span' layerStyle='menuconfigpanel_zdt_row_droplist'>
        <Button isDisabled={!has_sankey_plus} variant='menuconfigpanel_add_button' size='sizeConfigButton' onClick={addFreeLAbel}>{icon_add_element}</Button>
        {dropdownMultiLabel()}
        <Button variant='menuconfigpanel_del_button' size='sizeConfigButton' isDisabled={disable_options} onClick={deleteSelectedLabels}>{icon_remove_element}</Button>
      </Box>

      <Box as='span' layerStyle='menuconfigpanel_row_2cols' gridTemplateColumns='1fr 9fr'>
        <Box layerStyle='menuconfigpanel_option_name' textStyle='h3'>{t('LL.title')}</Box>
        <ConfigMenuTextInput disabled={disable_options} default_value={allLabelTitle()} function_on_blur={updateTitle} />
      </Box>

      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Noeud.illustration_type')}</Box>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Button isDisabled={disable_options} variant='menuconfigpanel_option_button' onClick={updateTypeLabelToText}>Texte</Button>
          <Button disabled={disable_options} variant='menuconfigpanel_option_button' onClick={updateTypeLabelToImage}>Image</Button>
        </Box>
      </Box>

      {button_text_or_image === 'text' ? <Box style={{ 'height': '300px' }}>
        <ReactQuill
          className='quill_editor'
          value={selected_zdt.length > 0 ? selected_zdt[0].content : ''}
          ref={r_editor_ZDT}
          onChange={(evt, _, src) => {
            if (src == 'user') {
              selected_zdt.forEach(n => n.content = evt)
              redrawAndRefresh()
            }
          }}
          theme="snow"
          modules={modules}
          formats={formats}
          readOnly={disable_options}
          style={{ 'height': '300px', fontSize: default_font_size, color: (disable_options) ? '#666666' : '', backgroundColor: (disable_options) ? '#cccccc' : '', overflowY: 'scroll' }}
        />
      </Box> : content_image}
      {sep}
      {button_text_or_image === 'text' ? (
        <>
          <Checkbox variant='menuconfigpanel_option_checkbox' isDisabled={disable_options} isChecked={allLabelVerticalText()} onChange={(evt) => updateVerticalText(evt.target.checked)}>
            <OSTooltip label={t('LL.tooltips.verticalText') || 'Orient text vertically'} placement='left'>
              {t('LL.verticalText') || 'Vertical Text'}
            </OSTooltip>
          </Checkbox>

          {allLabelVerticalText() && (
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name'>{t('LL.verticalAlignment') || 'Alignment'}</Box>
              <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                <Button isDisabled={disable_options} variant='menuconfigpanel_option_button' colorScheme={allLabelVerticalAlignment('left') ? 'blue' : 'gray'} onClick={() => updateVerticalAlignment('left')}>
                  {t('LL.alignLeft') || 'Left'}
                </Button>
                <Button isDisabled={disable_options} variant='menuconfigpanel_option_button' colorScheme={allLabelVerticalAlignment('right') ? 'blue' : 'gray'} onClick={() => updateVerticalAlignment('right')}>
                  {t('LL.alignRight') || 'Right'}
                </Button>
              </Box>
            </Box>
          )}
        </>
      ) : null}
      <Box as='span' layerStyle='menuconfigpanel_row_3cols'>
        <Checkbox variant='menuconfigpanel_option_checkbox' iconColor={valAllLabelBgVisibleIndeterminate ? '#78C2AD' : 'white'} isDisabled={disable_options} isIndeterminate={valAllLabelBgVisibleIndeterminate} isChecked={allLabelBgVisible()} onChange={(evt) => updateLabelBgVisible(evt.target.checked)}>
          {t('LL.cfl')}
        </Checkbox>
        <MenuColorPicker isDisabled={disable_options} initialColor={(selected_zdt.length === 1) ? selected_zdt[0].color : '#ffffff'} onColorChange={(new_color) => { selected_zdt.map(d => d.color = new_color); redrawAndRefresh() }} />
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('LL.ft')}</Box>
          <ConfigMenuNumberInput t={app_data.t} disabled={disable_options} default_value={allLabelTransparent()} function_on_blur={updateTransparent} minimum_value={0} stepper={true} />
        </Box>
      </Box>

      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Checkbox variant='menuconfigpanel_option_checkbox' iconColor={valAllLabelBorderTransparentIndeterminate ? '#78C2AD' : 'white'} isDisabled={disable_options} isIndeterminate={valAllLabelBorderTransparentIndeterminate} isChecked={!valAllLabelBorderTransparent} onChange={(evt) => updateLabelBorderTransparent(evt.target.checked)}>
          {t('LL.bt')}
        </Checkbox>
        <MenuColorPicker isDisabled={!has_sankey_plus && !valAllLabelBorderTransparent} initialColor={(selected_zdt.length === 1) ? selected_zdt[0].color_border : '#ffffff'} onColorChange={(new_color) => { selected_zdt.map(d => d.color_border = new_color); redrawAndRefresh() }} />
      </Box>

      <Box as='span' layerStyle='menuconfigpanel_row_3cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('LL.thickness')}</Box>
        <ConfigMenuNumberInput t={app_data.t} disabled={false} default_value={allLabelThickness()} function_on_blur={updateThickness} minimum_value={0} stepper={true} />
        <Checkbox variant='menuconfigpanel_option_checkbox' isChecked={allLabelDashed()} onChange={(evt) => updateDashed(evt.target.checked)}>{t('LL.dashed')}</Checkbox>
      </Box>

      {sep}

      <Checkbox variant='menuconfigpanel_option_checkbox' iconColor={valAllLabelTiedToNodeIndeterminate ? '#78C2AD' : 'white'} isDisabled={disable_options} isIndeterminate={valAllLabelTiedToNodeIndeterminate} isChecked={is_all_zdt_node_tied} onChange={(evt) => updateLabelTiedToNodes(evt.target.checked)}>
        <OSTooltip label={t('LL.tooltips.tiedToNodes')} placement='left'>{t('LL.tiedToNodes')}</OSTooltip>
      </Checkbox>

      {is_all_zdt_node_tied ? content_pos_tied_to_nodes : <></>}
      {(!is_all_zdt_node_tied || (is_all_zdt_node_tied && is_all_node_tied_to_extremity)) ? content_pos_not_tied_to_nodes : <></>}


    </Box>
  </OSTooltip>

  return content_menu_zdt
}