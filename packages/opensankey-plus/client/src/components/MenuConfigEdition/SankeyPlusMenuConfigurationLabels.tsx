// Standard libs
import React, { useState, ChangeEvent, FunctionComponent, useRef, MutableRefObject } from 'react'
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

// OpenSankey ts-code
import { OSTooltip, Type_JSON } from '../../deps/OpenSankey/types/Utils'

// Local libs
import {
  FCType_MenuConfigurationFreeLabelsOSP,
  FCType_ContextZDTOSP,
} from './types/SankeyPlusMenuConfigurationLabelsTypes'
import { Class_ContainerElement } from '../../types/FreeLabel'
import { ClassTemplate_SankeyOSP } from '../../types/SankeyOSP'
import { Type_GenericDrawingAreaOSP, Type_GenericNodeElementOSP, Type_GenericLinkElementOSP } from '../../types/TypesOSP'
import { ConfigMenuNumberInput, ConfigMenuTextInput } from '../../deps/OpenSankey/components/configmenus/SankeyMenuConfiguration'
import { OSMultiSelect } from '../../deps/OpenSankey/components/configmenus/SankeyMenuComponents'
import { listOptionSizeQuill } from '../UtilsOSP'

type Type_GenericFreeLabelOSP = Class_ContainerElement<Type_GenericDrawingAreaOSP, ClassTemplate_SankeyOSP<Type_GenericDrawingAreaOSP, Type_GenericNodeElementOSP, Type_GenericLinkElementOSP>>

const sep = <hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

/**
 * Description placeholder
 *
 * @export
 * @typedef {selected_type}
 */
export interface selected_type { 'label': string; 'value': string }

export const MenuConfigurationFreeLabelsOSP: FunctionComponent<FCType_MenuConfigurationFreeLabelsOSP> = ({
  new_data_plus,
}) => {
  const { t, icon_library, OSColorPicker } = new_data_plus
  const { icon_add_element, icon_remove_element, icon_order_up, icon_order_down, icon_to_the_left, icon_to_the_right, icon_text_vert_pos_top, icon_text_vert_pos_bottom } = icon_library
  const selected_zdt = new_data_plus.drawing_area.selected_containers_list

  const r_editor_ZDT = useRef<ReactQuill>() as { current: ReactQuill }
  const zdt_or_image = (selected_zdt.length > 0 ? (selected_zdt[0].is_image === true ? 'image' : 'text') : 'text')
  const [button_text_or_image, set_button_text_or_image] = useState<'text' | 'image'>(zdt_or_image)
  const ref_set_text_value_input = useRef((_: string | null | undefined) => null)
  const options_selector = new_data_plus.drawing_area.sankey.containers_list_sorted.map((d) => { return { 'label': d.title, 'value': d.id, selected: d.is_selected } })


  const [forceUpdate, setForceUpdate] = useState(false)
  // Link current component updater to menu config class
  new_data_plus.menu_configuration.ref_to_menu_config_containers_updater.current = () => setForceUpdate(!forceUpdate)

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
      >
        {/* Position custom pour MultiSelect */}

        <OSMultiSelect
          t={new_data_plus.t}
          elements={options_selector}
          onClick={(entries) => {
            // Update selection list
            const entries_values = entries.map(d => d.value)
            new_data_plus.drawing_area.sankey.containers_list.forEach(zdt => {
              if (entries_values.includes(zdt.id)) {
                new_data_plus.drawing_area.addContainerToSelection(zdt)
              }
              else {
                new_data_plus.drawing_area.removeFreeLabelFromSelection(zdt)
              }
            })
            redrawAndRefresh()
          }}
        />
      </Box>)
    return DD
  }

  //=================FONCTION POUR TEST VALEUR MULTI SELECT LABEL===========================
  const allLabelHeight = () => {
    let display_size = true
    let size = 25
    if (selected_zdt.length !== 0) {
      size = selected_zdt[0].label_height
    }
    selected_zdt.map((d) => {
      display_size = (d.label_height === size) ? display_size : false
    })
    return (display_size) ? Math.round(size) : -1
  }

  const allLabelWidth = () => {
    let display_size = true
    let size = 25
    if (selected_zdt.length !== 0) {
      size = selected_zdt[0].label_width
    }
    selected_zdt.map((d) => {
      display_size = (d.label_width === size) ? display_size : false
    })
    return (display_size) ? Math.round(size) : -1
  }

  const allLabelTitle = () => {
    return selected_zdt.length > 0 ? selected_zdt[0].title : ''
  }

  const allLabelTransparent = () => {
    let display_size = true
    let opa = 100
    if (selected_zdt.length !== 0) {
      opa = selected_zdt[0].opacity
    }
    selected_zdt.map((d) => {
      display_size = (d.opacity === opa) ? display_size : false
    })
    return (display_size) ? opa : 0
  }

  const allLabelBgVisible = () => {
    let display_value = true
    let visible = true
    if (selected_zdt.length !== 0) {
      visible = selected_zdt[0].color_visible
    }
    selected_zdt.map((d) => {
      display_value = (d.color_visible === visible) ? display_value : false
    })
    return (display_value) ? visible : false
  }

  const allLabelTiedToNodes = () => {
    let display_value = true
    let visible = false
    if (selected_zdt.length !== 0) {
      visible = selected_zdt[0].tied_to_nodes
    }
    selected_zdt.map((d) => {
      display_value = (d.tied_to_nodes === visible) ? display_value : false
    })
    return (display_value) ? visible : false
  }

  const allLabelTiedToNodesAtExtremity = () => {
    let display_value = true
    let visible = false
    if (selected_zdt.length !== 0) {
      visible = selected_zdt[0].at_extremity_of_attached_nodes
    }
    selected_zdt.map((d) => {
      display_value = (d.at_extremity_of_attached_nodes === visible) ? display_value : false
    })
    return (display_value) ? visible : false
  }
  const allLabelTiedToNodesAtExtremityPos = (_: 'top' | 'bottom' | 'left' | 'right') => {
    let display_value = false
    let position = _
    if (selected_zdt.length !== 0) {
      display_value = true
    }
    selected_zdt.map((d) => {
      display_value = (d.extremity_position === position) ? display_value : false
    })
    return display_value
  }

  const allNodesTiedToZDTRef = () => {
    if (selected_zdt.length > 0)
      return selected_zdt[0].attached_node
    else
      return []
  }

  const allLabelMargin = () => {
    let display_size = true
    let margin = 0
    if (selected_zdt.length !== 0) {
      margin = selected_zdt[0].margin_from_attached_nodes
    }
    selected_zdt.map((d) => {
      display_size = (d.margin_from_attached_nodes === margin) ? display_size : false
    })
    return (display_size) ? margin : 0
  }

  const list_node_tied = allNodesTiedToZDTRef()
  const is_all_zdt_node_tied = allLabelTiedToNodes()
  const is_all_node_tied_to_extremity = allLabelTiedToNodesAtExtremity()
  const options_selector_node_tied = new_data_plus.drawing_area.sankey.nodes_list_sorted.map((node) => { return { 'label': node.name, 'value': node.id, selected: list_node_tied.includes(node) } })
  const valAllLabelBorderTransparent = selected_zdt[0]?.transparent_border ?? false
  // Check if every transparent_border of selected zdt are the same as the first selected, if it true value is not indeterminate
  const valAllLabelBorderTransparentIndeterminate = !selected_zdt.every(zdt => zdt.transparent_border == valAllLabelBorderTransparent)

  const valAllLabelBgVisible = selected_zdt[0]?.color_visible ?? false
  // Check if every transparent_border of selected zdt are the same as the first selected, if it true value is not indeterminate
  const valAllLabelBgVisibleIndeterminate = !selected_zdt.every(zdt => zdt.color_visible == valAllLabelBgVisible)

  const valAllLabeTiedToNode = selected_zdt[0]?.tied_to_nodes ?? false
  const valAllLabelTiedToNodeIndeterminate = !selected_zdt.every(zdt => zdt.tied_to_nodes == valAllLabeTiedToNode)
  const Size = ReactQuill.Quill.import('attributors/style/size');
  Size.whitelist = listOptionSizeQuill;
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
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'bullet',
    'align'
  ]

  const disable_options = new_data_plus.has_sankey_plus ? (selected_zdt.length === 0) : true

  //=================Function to Mutate container & undo function===========================

  /**
   * Add a container in the DA; & add it's undoing in history
   *
   */
  const addFreeLAbel = () => {
    let new_element: Type_GenericFreeLabelOSP

    const _addFreeLAbel = () => {// Create default node
      new_element = new_data_plus.drawing_area.sankey.addNewDefaultFreeLabel()
      //Deselect previously selected container
      new_data_plus.drawing_area.purgeSelectionOfContainer()
      // Add node to selection
      new_data_plus.drawing_area.addContainerToSelection(new_element)
      // Update menus
      redrawAndRefresh()
    }

    const inv_addFreeLAbel = () => {
      new_data_plus.drawing_area.purgeSelectionOfContainer()
      // Delete previous element created
      new_element.delete()
      // Update menus
      redrawAndRefresh()
    }

    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_addFreeLAbel)
    new_data_plus.history.saveRedo(_addFreeLAbel)
    // Execute original attr mutation
    _addFreeLAbel()
  }

  const deleteSelectedLabels = () => {
    let dict_old_element: Type_JSON
    const _deleteSelectedLabels = () => {
      dict_old_element = Object.fromEntries(new_data_plus.drawing_area.selected_containers_list.map(cont => [cont.id, cont.toJSON()]))
      // Delete all selected nodes
      new_data_plus.drawing_area.sankey.deleteSelectedFreeLabels()
      // Update all menus
      redrawAndRefresh()
    }

    const inv_deleteSelectedLabels = () => {
      Object.values(dict_old_element).forEach(cont => {
        const n_id = (cont as Type_JSON)['id'] as string
        const new_element = new_data_plus.drawing_area.sankey.addNewFreeLabel(n_id)
        new_element.fromJSON(cont as Type_JSON)
        new_data_plus.drawing_area.addContainerToSelection(new_element)

      })
      // Update menus
      redrawAndRefresh()
    }

    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_deleteSelectedLabels)
    new_data_plus.history.saveRedo(_deleteSelectedLabels)
    // Execute original attr mutation
    _deleteSelectedLabels()
  }

  const updateTitle = (_: string | null | undefined) => {
    if (_ == undefined || _ == null) //Failsafe
      return

    const dict_old_title = Object.fromEntries(selected_zdt.map(d => [d.id, d.title]))
    const _updateTitle = () => {
      selected_zdt.map(d => d.title = _)
      // Update all menus
      redrawAndRefresh()
    }

    const inv_updateTitle = () => {
      selected_zdt.map(d => d.title = dict_old_title[d.id])
      // Update menus
      redrawAndRefresh()
    }

    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateTitle)
    new_data_plus.history.saveRedo(_updateTitle)
    // Execute original attr mutation
    _updateTitle()
  }

  const updateHeight = (_: number | null | undefined) => {
    if (_ == undefined || _ == null) //Failsafe
      return

    const dict_old_title = Object.fromEntries(selected_zdt.map(d => [d.id, d.label_height]))
    const _updateHeight = () => {
      selected_zdt.map(d => d.label_height = _)
      // Update all menus
      redrawAndRefresh()
    }

    const inv_updateHeight = () => {
      selected_zdt.map(d => d.label_height = dict_old_title[d.id])
      // Update menus
      redrawAndRefresh()
    }

    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateHeight)
    new_data_plus.history.saveRedo(_updateHeight)
    // Execute original attr mutation
    _updateHeight()
  }

  const updateWidth = (_: number | null | undefined) => {
    if (_ == undefined || _ == null) //Failsafe
      return

    const dict_old_title = Object.fromEntries(selected_zdt.map(d => [d.id, d.label_width]))
    const _updateWidth = () => {
      selected_zdt.map(d => d.label_width = _)
      // Update all menus
      redrawAndRefresh()
    }

    const inv_updateWidth = () => {
      selected_zdt.map(d => d.label_width = dict_old_title[d.id])
      // Update menus
      redrawAndRefresh()
    }

    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateWidth)
    new_data_plus.history.saveRedo(_updateWidth)
    // Execute original attr mutation
    _updateWidth()
  }

  const updateTransparent = (_: number | null | undefined) => {
    if (_ == undefined || _ == null) //Failsafe
      return

    const dict_old_title = Object.fromEntries(selected_zdt.map(d => [d.id, d.opacity]))
    const _updateTransparent = () => {
      selected_zdt.map(d => d.opacity = _)
      // Update all menus
      redrawAndRefresh()
    }

    const inv_updateTransparent = () => {
      selected_zdt.map(d => d.opacity = dict_old_title[d.id])
      // Update menus
      redrawAndRefresh()
    }

    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateTransparent)
    new_data_plus.history.saveRedo(_updateTransparent)
    // Execute original attr mutation
    _updateTransparent()
  }

  const updateTypeLabelToText = () => {
    const dict_old_val = Object.fromEntries(selected_zdt.map(d => [d.id, d.is_image]))
    const old_type = button_text_or_image
    const _updateTypeLabelToText = () => {
      selected_zdt.map(d => d.is_image = false)
      set_button_text_or_image('text')
      // Update all menus
      redrawAndRefresh()
    }

    const inv_updateTypeLabelToText = () => {
      selected_zdt.map(d => d.is_image = dict_old_val[d.id])
      set_button_text_or_image(old_type)
      // Update menus
      redrawAndRefresh()
    }

    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateTypeLabelToText)
    new_data_plus.history.saveRedo(_updateTypeLabelToText)
    // Execute original attr mutation
    _updateTypeLabelToText()
  }

  const updateTypeLabelToImage = () => {
    const dict_old_val = Object.fromEntries(selected_zdt.map(d => [d.id, d.is_image]))
    const old_type = button_text_or_image
    const _updateTypeLabelToImage = () => {
      selected_zdt.map(d => d.is_image = true)
      set_button_text_or_image('image')
      // Update all menus
      redrawAndRefresh()
    }

    const inv_updateTypeLabelToImage = () => {
      selected_zdt.map(d => d.is_image = dict_old_val[d.id])
      set_button_text_or_image(old_type)
      // Update menus
      redrawAndRefresh()
    }

    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateTypeLabelToImage)
    new_data_plus.history.saveRedo(_updateTypeLabelToImage)
    // Execute original attr mutation
    _updateTypeLabelToImage()
  }


  const updateLabelBorderTransparent = (_: boolean) => {
    const dict_old_val = Object.fromEntries(selected_zdt.map(d => [d.id, d.transparent_border]))
    const _updateLabelBorderTransparent = () => {
      selected_zdt.map(d => d.transparent_border = _)
      // Update all menus
      redrawAndRefresh()
    }

    const inv_updateLabelBorderTransparent = () => {
      selected_zdt.map(d => d.transparent_border = dict_old_val[d.id])
      // Update menus
      redrawAndRefresh()
    }

    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateLabelBorderTransparent)
    new_data_plus.history.saveRedo(_updateLabelBorderTransparent)
    // Execute original attr mutation
    _updateLabelBorderTransparent()
  }

  const updateImageSrc = (_: string) => {
    const dict_old_val = Object.fromEntries(selected_zdt.map(d => [d.id, d.image_src]))
    const _updateImageSrc = () => {
      selected_zdt.map(d => d.image_src = _)
      // Update all menus
      redrawAndRefresh()
    }

    const inv_updateImageSrc = () => {
      selected_zdt.map(d => d.image_src = dict_old_val[d.id])
      // Update menus
      redrawAndRefresh()
    }

    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateImageSrc)
    new_data_plus.history.saveRedo(_updateImageSrc)
    // Execute original attr mutation
    _updateImageSrc()
  }

  const updateLabelBgVisible = (_: boolean) => {
    const dict_old_val = Object.fromEntries(selected_zdt.map(d => [d.id, d.color_visible]))
    const _updateLabelBgVisible = () => {
      selected_zdt.map(d => d.color_visible = _)
      // Update all menus
      redrawAndRefresh()
    }

    const inv_updateLabelBgVisible = () => {
      selected_zdt.map(d => d.color_visible = dict_old_val[d.id])
      // Update menus
      redrawAndRefresh()
    }

    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateLabelBgVisible)
    new_data_plus.history.saveRedo(_updateLabelBgVisible)
    // Execute original attr mutation
    _updateLabelBgVisible()
  }

  const updateLabelTiedToNodes = (_: boolean) => {
    const dict_old_val = Object.fromEntries(selected_zdt.map(d => [d.id, d.tied_to_nodes]))
    const _updateLabelTiedToNodes = () => {
      selected_zdt.map(d => d.tied_to_nodes = _)
      // Update all menus
      redrawAndRefresh()
    }

    const inv_updateLabelTiedToNodes = () => {
      selected_zdt.map(d => d.tied_to_nodes = dict_old_val[d.id])
      // Update menus
      redrawAndRefresh()
    }

    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateLabelTiedToNodes)
    new_data_plus.history.saveRedo(_updateLabelTiedToNodes)
    // Execute original attr mutation
    _updateLabelTiedToNodes()
  }

  const updateLabelTiedToNodesAtExtremity = (_: boolean) => {
    const dict_old_val = Object.fromEntries(selected_zdt.map(d => [d.id, d.at_extremity_of_attached_nodes]))
    const _updateLabelTiedToNodes = () => {
      selected_zdt.map(d => d.at_extremity_of_attached_nodes = _)
      // Update all menus
      redrawAndRefresh()
    }

    const inv_updateLabelTiedToNodes = () => {
      selected_zdt.map(d => d.at_extremity_of_attached_nodes = dict_old_val[d.id])
      // Update menus
      redrawAndRefresh()
    }

    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateLabelTiedToNodes)
    new_data_plus.history.saveRedo(_updateLabelTiedToNodes)
    // Execute original attr mutation
    _updateLabelTiedToNodes()
  }

  const updateLabelExtremityPos = (_: 'top' | 'bottom' | 'left' | 'right') => {
    const dict_old_val = Object.fromEntries(selected_zdt.map(d => [d.id, d.extremity_position]))
    const _updateLabelTiedToNodes = () => {
      selected_zdt.map(d => d.extremity_position = _)
      // Update all menus
      redrawAndRefresh()
    }

    const inv_updateLabelTiedToNodes = () => {
      selected_zdt.map(d => d.extremity_position = dict_old_val[d.id])
      // Update menus
      redrawAndRefresh()
    }

    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateLabelTiedToNodes)
    new_data_plus.history.saveRedo(_updateLabelTiedToNodes)
    // Execute original attr mutation
    _updateLabelTiedToNodes()
  }

  const updateMargin = (_: number | null | undefined) => {
    if (_ == undefined || _ == null) //Failsafe
      return

    const dict_old_title = Object.fromEntries(selected_zdt.map(d => [d.id, d.margin_from_attached_nodes]))
    const _updateMargin = () => {
      selected_zdt.map(d => d.margin_from_attached_nodes = _)
      // Update all menus
      redrawAndRefresh()
    }

    const inv_updateMargin = () => {
      selected_zdt.map(d => d.margin_from_attached_nodes = dict_old_title[d.id])
      // Update menus
      redrawAndRefresh()
    }

    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateMargin)
    new_data_plus.history.saveRedo(_updateMargin)
    // Execute original attr mutation
    _updateMargin()
  }

  // Ref to number input setter --------------------------------------
  const number_of_input = 4
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))
  // Be sure that values are updated in inputs when refreshing this component
  ref_set_number_inputs[0].current(String(allLabelHeight()))
  ref_set_number_inputs[1].current(String(allLabelWidth()))
  ref_set_number_inputs[2].current(String(allLabelTransparent()))
  ref_set_number_inputs[3].current(String(allLabelMargin()))

  const is_zdt_at_extremity_top = allLabelTiedToNodesAtExtremityPos('top')
  const is_zdt_at_extremity_bottom = allLabelTiedToNodesAtExtremityPos('bottom')
  const is_zdt_at_extremity_left = allLabelTiedToNodesAtExtremityPos('left')
  const is_zdt_at_extremity_right = allLabelTiedToNodesAtExtremityPos('right')

  const content_image = <>
    {/* Import image */}
    <OSTooltip label={!new_data_plus.has_sankey_plus ? t('Menu.sankeyOSPDisabled') : ''} >

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
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

  // Content for when selecteds container have their pos & size managed by the container itself
  const content_pos_not_tied_to_nodes = <Box
    as='span'
    layerStyle='menuconfigpanel_row_2cols'
  >
    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
    >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('LL.hl')}
      </Box>
      <ConfigMenuNumberInput
        t={new_data_plus.t}
        disabled={disable_options || (is_all_zdt_node_tied && (is_zdt_at_extremity_left || is_zdt_at_extremity_right))}
        ref_to_set_value={ref_set_number_inputs[0]}
        default_value={allLabelHeight()}
        function_on_blur={updateHeight}
        minimum_value={1}
        stepper={true}
      />

    </Box>
    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
    >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('LL.ll')}
      </Box>
      <ConfigMenuNumberInput
        t={new_data_plus.t}
        disabled={disable_options || (is_all_zdt_node_tied && (is_zdt_at_extremity_top || is_zdt_at_extremity_bottom))}
        ref_to_set_value={ref_set_number_inputs[1]}
        default_value={allLabelWidth()}
        function_on_blur={updateWidth}
        minimum_value={1}
        stepper={true}
      />
    </Box>
  </Box>

  // Content for when selecteds container have their pos & size tied to nodes associated
  const content_pos_tied_to_nodes = <Box>
    <OSMultiSelect
      t={new_data_plus.t}
      elements={options_selector_node_tied}
      onClick={(entries) => {
        // Update selection list
        const entries_values = entries.map(d => d.value)
        new_data_plus.drawing_area.sankey.nodes_list.forEach(node => {
          if (entries_values.includes(node.id)) {
            new_data_plus.drawing_area.selected_containers_list.forEach(zdt => { new_data_plus.drawing_area.sankey.attachNodeToCont(node, zdt) })
          } else {
            new_data_plus.drawing_area.selected_containers_list.forEach(zdt => { new_data_plus.drawing_area.sankey.dettachNodeFromCont(node, zdt) })
          }
        })
        redrawAndRefresh()
      }}
    />

    <OSTooltip label={t('LL.tooltips.margin')} placement='left'>
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('LL.margin')}
        </Box>
        <ConfigMenuNumberInput
          t={new_data_plus.t}
          disabled={disable_options}
          ref_to_set_value={ref_set_number_inputs[3]}
          default_value={allLabelMargin()}
          function_on_blur={updateMargin}
          minimum_value={1}
          stepper={true}
        />
      </Box>
    </OSTooltip>

    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      iconColor={valAllLabelTiedToNodeIndeterminate ? '#78C2AD' : 'white'}
      isDisabled={disable_options}
      isIndeterminate={valAllLabelTiedToNodeIndeterminate}
      isChecked={allLabelTiedToNodesAtExtremity()}
      onChange={(evt) => updateLabelTiedToNodesAtExtremity(evt.target.checked)}>
      <OSTooltip label={t('LL.tooltips.tiedToNodesExtremity')} placement='left'>
        {t('LL.tiedToNodesExtremity')}
      </OSTooltip>
    </Checkbox>
    {allLabelTiedToNodesAtExtremity() ?
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('LL.extremityPos')}
        </Box>
        <ButtonGroup isAttached>
          <Button variant={is_zdt_at_extremity_top ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={() => { updateLabelExtremityPos('top') }}>{icon_text_vert_pos_top}</Button>
          <Button variant={is_zdt_at_extremity_bottom ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={() => { updateLabelExtremityPos('bottom') }}>{icon_text_vert_pos_bottom}</Button>
          <Button variant={is_zdt_at_extremity_left ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={() => { updateLabelExtremityPos('left') }}>{icon_to_the_left}</Button>
          <Button variant={is_zdt_at_extremity_right ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={() => { updateLabelExtremityPos('right') }}>{icon_to_the_right}</Button>
        </ButtonGroup>

      </Box>
      : <></>}
  </Box>

  const content_menu_zdt = <OSTooltip label={!new_data_plus.has_sankey_plus ? t('Menu.sankeyOSPDisabled') : ''} >
    <Box layerStyle='menuconfigpanel_grid'>
      <Box
        as='span'
        layerStyle='menuconfigpanel_zdt_row_droplist'
      >
        <Button
          isDisabled={!new_data_plus.has_sankey_plus}
          variant='menuconfigpanel_add_button'
          size='sizeConfigButton'
          onClick={addFreeLAbel}>
          {icon_add_element}
        </Button>

        {dropdownMultiLabel()}

        <Button
          variant='menuconfigpanel_del_button'
          size='sizeConfigButton'
          isDisabled={disable_options}
          onClick={deleteSelectedLabels}>
          {icon_remove_element}
        </Button>

      </Box>

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
        gridTemplateColumns='1fr 9fr'
      >
        <Box
          layerStyle='menuconfigpanel_option_name'
          textStyle='h3'
        >
          {t('LL.title')}
        </Box>
        <ConfigMenuTextInput
          disabled={disable_options}
          ref_to_set_value={ref_set_text_value_input}
          function_get_value={allLabelTitle}
          function_on_blur={updateTitle}
        />
      </Box>

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Noeud.illustration_type')}
        </Box>
        <Box
          as='span'
          layerStyle='menuconfigpanel_row_2cols'
        >
          <Button
            isDisabled={disable_options}
            variant='menuconfigpanel_option_button'
            onClick={updateTypeLabelToText}>Texte</Button>

          <Button
            disabled={disable_options}
            variant='menuconfigpanel_option_button'
            onClick={updateTypeLabelToImage}>Image</Button></Box>
      </Box>

      {button_text_or_image === 'text' ? <Box style={{ 'height': '300px' }}><ReactQuill
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
        style={{
          'height': '300px',
          fontSize: '0.6rem',
          color: (disable_options) ? '#666666' : '',
          backgroundColor: (disable_options) ? '#cccccc' : '',
          overflowY: 'scroll'
        }}
      /></Box> : content_image}

      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        iconColor={valAllLabelTiedToNodeIndeterminate ? '#78C2AD' : 'white'}
        isDisabled={disable_options}
        isIndeterminate={valAllLabelTiedToNodeIndeterminate}
        isChecked={is_all_zdt_node_tied}
        onChange={(evt) => updateLabelTiedToNodes(evt.target.checked)}>
        <OSTooltip label={t('LL.tooltips.tiedToNodes')} placement='left'>
          {t('LL.tiedToNodes')}
        </OSTooltip>
      </Checkbox>

      {is_all_zdt_node_tied ? content_pos_tied_to_nodes : <></>}
      {(!is_all_zdt_node_tied || (is_all_zdt_node_tied && is_all_node_tied_to_extremity)) ? content_pos_not_tied_to_nodes : <></>}

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_3cols'
      >
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          iconColor={valAllLabelBgVisibleIndeterminate ? '#78C2AD' : 'white'}
          isDisabled={disable_options}
          isIndeterminate={valAllLabelBgVisibleIndeterminate}
          isChecked={allLabelBgVisible()}
          onChange={(evt) => updateLabelBgVisible(evt.target.checked)}>
          {t('LL.cfl')}
        </Checkbox>
        <OSColorPicker
          isDisabled={disable_options}
          initialColor={(selected_zdt.length === 1) ? selected_zdt[0].color : '#ffffff'}
          functionOnBlur={(new_color) => {
            selected_zdt.map(d => d.color = new_color)
            redrawAndRefresh()
          }}
        />
        <Box
          as='span'
          layerStyle='menuconfigpanel_row_2cols'
        >
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('LL.ft')}
          </Box>

          <ConfigMenuNumberInput
            t={new_data_plus.t}
            disabled={disable_options}
            ref_to_set_value={ref_set_number_inputs[2]}
            default_value={allLabelTransparent()}
            function_on_blur={updateTransparent}
            minimum_value={0}
            stepper={true}
          />
        </Box>
      </Box>

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('LL.cbl')}
        </Box>
        <Box
          as='span'
          layerStyle='menuconfigpanel_row_2cols'
        >
          <OSColorPicker
            isDisabled={!new_data_plus.has_sankey_plus && !valAllLabelBorderTransparent}
            initialColor={(selected_zdt.length === 1) ? selected_zdt[0].color_border : '#ffffff'}
            functionOnBlur={(new_color) => {
              selected_zdt.map(d => d.color_border = new_color)
              redrawAndRefresh()
            }}
          />

          <Checkbox
            variant='menuconfigpanel_part_title_1_checkbox'
            iconColor={valAllLabelBorderTransparentIndeterminate ? '#78C2AD' : 'white'}
            isDisabled={disable_options}
            isIndeterminate={valAllLabelBorderTransparentIndeterminate}
            isChecked={valAllLabelBorderTransparent}
            onChange={(evt) => updateLabelBorderTransparent(evt.target.checked)}>
            {t('LL.bt')}
          </Checkbox>
        </Box>
      </Box>
    </Box>
  </OSTooltip>

  return content_menu_zdt
}


export const ContextZDTOSP: FunctionComponent<FCType_ContextZDTOSP> = (
  { new_data_plus }
) => {
  const { t, OSColorPicker, drawing_area } = new_data_plus

  const selected_zdt = new_data_plus.drawing_area.selected_containers_list
  const zdt_to_contextualise = new_data_plus.drawing_area.contextualised_container

  const [, setCount] = useState(0)
  new_data_plus.menu_configuration.ref_to_menu_context_container_updater.current = () => setCount(a => a + 1)
  let style_c_zdd = '0px 0px auto auto'
  let pos_x = new_data_plus.drawing_area.pointer_pos[0] + 10
  let pos_y = new_data_plus.drawing_area.pointer_pos[1] - 20
  let is_top = true
  const size_context_menu = 6 * 40 // Get approx. height of context menu

  if (zdt_to_contextualise) {
    if (new_data_plus.drawing_area.pointer_pos[0] + 450 > window.innerWidth) {
      pos_x = new_data_plus.drawing_area.pointer_pos[0] - 455
    }

    if (new_data_plus.drawing_area.pointer_pos[1] + size_context_menu > window.innerHeight) {
      pos_y = new_data_plus.drawing_area.pointer_pos[1] - size_context_menu
      is_top = false
    }
    style_c_zdd = pos_y + 'px auto auto ' + pos_x + 'px'
  }
  else {
    // Early return in case zdt zdt_to_contextualise isn't defined, it avoid testing if zdt is defined in each function
    return <></>
  }

  const redrawAndRefresh = () => {
    // Refresh menu config free label
    new_data_plus.menu_configuration.ref_to_menu_config_containers_updater.current()
    // Redraw selected elements
    selected_zdt.forEach(zdt => zdt.draw())
    // Refresh this menu
    setCount(a => a + 1)
  }

  const closeContextMenu = () => {
    // Unset contextualized node
    new_data_plus.drawing_area.contextualised_container = undefined
    setCount(a => a + 1)

  }

  /**
   * Return a list of node which position are inside contextualised zdt
   *
   */
  const getNodeInsideContextZDT = () => new_data_plus.drawing_area.sankey.visible_nodes_list
    .filter(n => {
      // Check if node is horizontally in zdt
      const is_node_horizontally_in_zone = (
        (n.position_x >= zdt_to_contextualise.position_x) &&
        (n.position_x <= (zdt_to_contextualise.position_x + zdt_to_contextualise.label_width)) &&
        ((n.position_x + n.getShapeWidthToUse()) <= (zdt_to_contextualise.position_x + zdt_to_contextualise.label_width))
      )
      // Check if node is vertically in zdt
      const is_node_vertically_in_zone = (
        (n.position_y >= zdt_to_contextualise.position_y) &&
        (n.position_y <= (zdt_to_contextualise.position_y + zdt_to_contextualise.label_height)) &&
        ((n.position_y + n.getShapeHeightToUse()) <= (zdt_to_contextualise.position_y + zdt_to_contextualise.label_height))
      )
      // Must be in zdt
      return (is_node_horizontally_in_zone && is_node_vertically_in_zone)
    })

  const moveToFirstPlan = () => {
    drawing_area.selected_containers_list.forEach(cont => {
      const idx_to_shift = drawing_area.list_g_element.indexOf(cont.id)
      drawing_area.moveOrderElementInDA(idx_to_shift, drawing_area.list_g_element.length - 1)
    })
  }

  const moveToLastPlan = () => {
    drawing_area.selected_containers_list.forEach(cont => {
      const idx_to_shift = drawing_area.list_g_element.indexOf(cont.id)
      drawing_area.moveOrderElementInDA(idx_to_shift, 0)
    })
  }

  // Check if every transparent_border of selected zdt are the same as the first selected, if it true value is not indeterminate
  const valAllLabelBorderTransparent = selected_zdt[0]?.transparent_border ?? false

  const btn_mask_border = <Button onClick={() => {
    selected_zdt.forEach(zdt => zdt.transparent_border = !valAllLabelBorderTransparent)
    redrawAndRefresh()
  }} variant='contextmenu_button'>{valAllLabelBorderTransparent ? t('LL.display_border') : t('LL.hide_border')}</Button>


  const btn_change_color = <>
    <Button variant='contextmenu_button'>
      <Box style={{ display: 'grid', gridTemplateColumns: '1fr 3fr' }}>
        <label style={{ margin: 0 }}>{t('LL.cfl')}</label>
        <OSColorPicker
          initialColor={(selected_zdt.length === 1) ? selected_zdt[0].color : '#ffffff'}
          functionOnBlur={(new_color) => {
            selected_zdt.map(d => d.color = new_color)
            redrawAndRefresh()
          }}
        />
      </Box>
    </Button>
  </>


  const button_open_layout = <Button onClick={() => {
    new_data_plus.menu_configuration.dict_setter_show_dialog_plus.ref_setter_show_menu_zdt.current(true)
    closeContextMenu()
  }}
    variant='contextmenu_button'
    rightIcon={new_data_plus.icon_library.icon_popup_menu}
  >{t('Menu.LL')} </Button>

  // Add selected nodes to tied nodes to ZDT
  const button_add_selected_nodes_to_tied_nodes = <Button onClick={() => {
    zdt_to_contextualise.tied_to_nodes = true
    new_data_plus.drawing_area.selected_nodes_list.forEach(node => {
      new_data_plus.drawing_area.selected_containers_list.forEach(zdt => { new_data_plus.drawing_area.sankey.attachNodeToCont(node, zdt) })
    })
    zdt_to_contextualise.draw()
    closeContextMenu()
  }}
    variant='contextmenu_button'
  >{t('Menu.TieNodes')} </Button>

  // Detach all nodes from ZDT 
  const button_detach_all_tied_nodes = <Button onClick={() => {
    // Loop throught attached nodes in reverse index order to avoid problem when deleting element from array 
    for (let i = zdt_to_contextualise.attached_node.length - 1; i >= 0; i--) {
      new_data_plus.drawing_area.sankey.dettachNodeFromCont(zdt_to_contextualise.attached_node[i], zdt_to_contextualise)
    }
    zdt_to_contextualise.tied_to_nodes = false
    zdt_to_contextualise.draw()
    closeContextMenu()
  }}
    variant='contextmenu_button'
  >{t('Menu.detachTiedNodes')} </Button>

  // Select nodes 'inside' zdt
  const btn_select_node_inside = <Button onClick={() => {
    new_data_plus.drawing_area.purgeSelection()
    getNodeInsideContextZDT()
      .forEach(n => {
        new_data_plus.drawing_area.addNodeToSelection(n)
      })
    zdt_to_contextualise.draw()
    closeContextMenu()
  }}
    variant='contextmenu_button'
  >{t('Menu.SNI')}
  </Button>

  const btn_move_to_first_plan = <Button
    variant='contextmenu_button'
    onClick={moveToFirstPlan}>
    {t('Noeud.firstPlan')}
  </Button>
  const btn_move_to_last_plan = <Button
    variant='contextmenu_button'
    onClick={moveToLastPlan}>
    {t('Noeud.lastPlan')}
  </Button>


  return zdt_to_contextualise ? <Box
    layerStyle='context_menu'
    id="context_zdd_pop_over"
    style={{
      inset: style_c_zdd,
      maxWidth: '100%',
      position: 'absolute',
      zIndex: '1',

    }}>
    <ButtonGroup orientation='vertical' isAttached>
      {btn_select_node_inside}
      {sep}
      {btn_mask_border}
      {btn_change_color}
      {sep}
      {btn_move_to_first_plan}
      {btn_move_to_last_plan}
      {sep}
      {button_add_selected_nodes_to_tied_nodes}
      {button_detach_all_tied_nodes}
      {sep}
      {button_open_layout}
    </ButtonGroup>
  </Box> : <></>
}
