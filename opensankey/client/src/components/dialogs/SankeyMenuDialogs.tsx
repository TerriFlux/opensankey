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

import React, { ChangeEvent, FunctionComponent, MutableRefObject, useRef, useState, } from 'react'

import {
  Box,
  Checkbox,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  ButtonGroup,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Select
} from '@chakra-ui/react'

import {
  FCType_ApplyLayoutDialog,
  FType_DiagramSelector
} from './types/SankeyMenuDialogsTypes'
import { default_style_id, OSTooltip } from '../../types/Utils'
import {
  FCType_ApplySaveJSONDialog,
  FCType_ExcelModal
} from '../../types/FunctionTypes'

import { MenuDraggable } from '../topmenus/SankeyMenus'
import { OSMultiSelect, typeElementSelectable, WrapperCheckBoxSubSectionMenu } from '../configmenus/SankeyMenuComponents'
import { checked } from './SankeyMenuContextLink'
import { Class_ApplicationData } from '../../types/ApplicationData'


/**
 *
 * @param {FCType_ApplyLayoutDialog} { ref_setter_show_modal_apply_layout, set_show_apply_layout, sankey_data, set_sankey_data }
 * @returns {*}
 */
export const ApplyLayoutDialog: FunctionComponent<FCType_ApplyLayoutDialog> = ({
  applicationData,
  diagramSelector,
  apply_transformation_additional_elements
}: FCType_ApplyLayoutDialog) => {
  const { data_var_to_update, t, menu_configuration } = applicationData
  const { node_styles_dict } = applicationData.drawing_area.sankey
  const { ref_to_updater_modal_apply_layout } = menu_configuration

  const [, setForceUpdate] = useState(true)
  const [mode_trans, set_mode_trans] = useState('simple')
  const [auto_x, set_auto_x] = useState(node_styles_dict[default_style_id].position.auto_x)

  ref_to_updater_modal_apply_layout.current = () => setForceUpdate(b => !b)
  if (auto_x !== (node_styles_dict[default_style_id].position.auto_x)) {
    set_auto_x(node_styles_dict[default_style_id].position.auto_x)
  }

  const simple_element_to_transform = [
    'posNode',
    'attrNode', 'attrFlux',
    'attrDrawingArea'
  ]
  const default_element_to_transform = [
    'posNode',
    'attrNode', 'attrFlux',
    'attrDrawingArea'
  ]



  const content_modal_layout = <Box layerStyle='menuconfigpanel_grid' >
    {diagramSelector(applicationData)}

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Menu.choseTransforDifficulty')}
      </Box>
      <Box layerStyle='options_3cols' >
        <Button variant={mode_trans == 'simple' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={() => { set_mode_trans('simple'); applicationData.menu_configuration.ref_to_menu_updater.current() }}>Basiques</Button>
        <Button variant={mode_trans == 'expert' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={() => { set_mode_trans('expert'); applicationData.menu_configuration.ref_to_menu_updater.current() }}>Tous</Button>
      </Box>
    </Box>

    <OSTooltip label={t('Menu.Transformation.tooltips.Shortcuts')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Shortcuts')}</Box>
        <Box layerStyle='options_4cols' >

          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              data_var_to_update.current.length = 0
              menu_configuration.updateComponentApplyLayout()
            }}
          >{t('Menu.Transformation.unSelectAll')}</Button>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              data_var_to_update.current.length = 0
              if (mode_trans === 'simple') {
                simple_element_to_transform.forEach(el => data_var_to_update.current.push(el))
              } else {
                applicationData.transform_layout_all_attr.forEach(el => data_var_to_update.current.push(el))
              }
              menu_configuration.updateComponentApplyLayout()
            }}
          >{t('Menu.Transformation.selectAll')}</Button>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              data_var_to_update.current.length = 0
              default_element_to_transform.forEach(el => data_var_to_update.current.push(el))
              menu_configuration.updateComponentApplyLayout()
            }}
          >{t('Menu.Transformation.selectDefault')}</Button>

        </Box>
      </Box>
    </OSTooltip>

    {mode_trans != 'simple' ?
      <OSTooltip label={t('Menu.Transformation.tooltips.Topology')}>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Topology')}</Box>
          <Box layerStyle='options_4cols' >
            <Button
              variant={data_var_to_update.current.includes('addNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.current.includes('addNode')) {
                  data_var_to_update.current.push('addNode')
                  menu_configuration.updateComponentApplyLayout()
                } else {
                  data_var_to_update.current.splice(data_var_to_update.current.indexOf('addNode'), 1)
                  menu_configuration.updateComponentApplyLayout()
                }
              }
              }
            >{t('Menu.Transformation.addNode')}</Button>
            <Button
              variant={data_var_to_update.current.includes('removeNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.current.includes('removeNode')) {
                  data_var_to_update.current.push('removeNode')
                  menu_configuration.updateComponentApplyLayout()
                } else {
                  data_var_to_update.current.splice(data_var_to_update.current.indexOf('removeNode'), 1)
                  menu_configuration.updateComponentApplyLayout()
                }
              }
              }
            >{t('Menu.Transformation.removeNode')}</Button>
            <Button
              variant={data_var_to_update.current.includes('addFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.current.includes('addFlux')) {
                  data_var_to_update.current.push('addFlux')
                  menu_configuration.updateComponentApplyLayout()
                } else {
                  data_var_to_update.current.splice(data_var_to_update.current.indexOf('addFlux'), 1)
                  menu_configuration.updateComponentApplyLayout()
                }
              }
              }>{t('Menu.Transformation.addFlux')}</Button>
            <Button
              variant={data_var_to_update.current.includes('removeFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.current.includes('removeFlux')) {
                  data_var_to_update.current.push('removeFlux')
                  menu_configuration.updateComponentApplyLayout()
                } else {
                  data_var_to_update.current.splice(data_var_to_update.current.indexOf('removeFlux'), 1)
                  menu_configuration.updateComponentApplyLayout()
                }
              }
              }>{t('Menu.Transformation.removeFlux')}</Button>
          </Box>
        </Box></OSTooltip> : <></>}

    {/* Taille et pos des noeud/flux */}
    <OSTooltip label={t('Menu.Transformation.tooltips.Geometry')}  >
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Geometry')}</Box>
        <Box layerStyle='options_4cols' >
          <Button
            variant={data_var_to_update.current.includes('posNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => {
              if (!data_var_to_update.current.includes('posNode')) {
                data_var_to_update.current.push('posNode')
                menu_configuration.updateComponentApplyLayout()
              } else {
                data_var_to_update.current.splice(data_var_to_update.current.indexOf('posNode'), 1)
                menu_configuration.updateComponentApplyLayout()
              }
            }
            }>{t('Menu.Transformation.PosNoeud')}</Button>
          <Button
            variant={data_var_to_update.current.includes('posFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => {
              if (!data_var_to_update.current.includes('posFlux')) {
                data_var_to_update.current.push('posFlux')
                menu_configuration.updateComponentApplyLayout()
              } else {
                data_var_to_update.current.splice(data_var_to_update.current.indexOf('posFlux'), 1)
                menu_configuration.updateComponentApplyLayout()
              }
            }
            }> {t('Menu.Transformation.posFlux')}</Button>
        </Box>

      </Box>
    </OSTooltip>

    {/* Valeur des flux */}
    {mode_trans != 'simple' ?
      <OSTooltip label={t('Menu.Transformation.tooltips.Values')}>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Values')}</Box>
          <Box layerStyle='options_4cols' >
            <Button
              variant={data_var_to_update.current.includes('Values') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.current.includes('Values')) {
                  data_var_to_update.current.push('Values')
                  // Also need dataTags because we can't only import values without the structur of dataTags
                  // (but we can import dataTags without values)
                  if (!data_var_to_update.current.includes('tagData')) {
                    data_var_to_update.current.push('tagData')
                  }
                  menu_configuration.updateComponentApplyLayout()
                } else {
                  data_var_to_update.current.splice(data_var_to_update.current.indexOf('Values'), 1)
                  menu_configuration.updateComponentApplyLayout()
                }
              }
              }
            >{data_var_to_update.current.includes('Values') ? applicationData.icon_library.icon_activated : applicationData.icon_library.icon_unactivated}</Button>
          </Box>
        </Box></OSTooltip> : <></>}

    <OSTooltip label={t('Menu.Transformation.tooltips.Attribut')} >
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'><Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Attribut')}</Box>
        <Box layerStyle='options_4cols' >
          <Button
            variant={data_var_to_update.current.includes('attrNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => {
              if (!data_var_to_update.current.includes('attrNode')) {
                data_var_to_update.current.push('attrNode')
                menu_configuration.updateComponentApplyLayout()

              } else {
                data_var_to_update.current.splice(data_var_to_update.current.indexOf('attrNode'), 1)
                menu_configuration.updateComponentApplyLayout()
              }
            }
            }
          >{t('Menu.Transformation.attrNode')}</Button>
          <Button
            variant={data_var_to_update.current.includes('attrFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => {
              if (!data_var_to_update.current.includes('attrFlux')) {
                data_var_to_update.current.push('attrFlux')
                menu_configuration.updateComponentApplyLayout()
              } else {
                data_var_to_update.current.splice(data_var_to_update.current.indexOf('attrFlux'), 1)
                menu_configuration.updateComponentApplyLayout()
              }
            }
            }
          >{t('Menu.Transformation.attrFlux')}</Button>
        </Box>
      </Box></OSTooltip>

    {/* Etiquette */}
    {mode_trans == 'expert' ?
      <OSTooltip label={t('Menu.Transformation.tooltips.Tags')} >
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Tags')}</Box>
          <Box layerStyle='options_4cols' >
            <Button
              variant={data_var_to_update.current.includes('tagNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.current.includes('tagNode')) {
                  data_var_to_update.current.push('tagNode')
                  menu_configuration.updateComponentApplyLayout()
                } else {
                  data_var_to_update.current.splice(data_var_to_update.current.indexOf('tagNode'), 1)
                  menu_configuration.updateComponentApplyLayout()

                }
              }
              }
            >{t('Menu.Transformation.tagNode')}</Button>
            <Button
              variant={data_var_to_update.current.includes('tagFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.current.includes('tagFlux')) {
                  data_var_to_update.current.push('tagFlux')
                  menu_configuration.updateComponentApplyLayout()
                } else {
                  data_var_to_update.current.splice(data_var_to_update.current.indexOf('tagFlux'), 1)
                  menu_configuration.updateComponentApplyLayout()
                }
              }
              }
            >{t('Menu.Transformation.tagFlux')}</Button>
            <Button
              variant={data_var_to_update.current.includes('tagData') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.current.includes('tagData')) {
                  data_var_to_update.current.push('tagData')
                  menu_configuration.updateComponentApplyLayout()
                } else if (!data_var_to_update.current.includes('Values')) {
                  data_var_to_update.current.splice(data_var_to_update.current.indexOf('tagData'), 1)
                  menu_configuration.updateComponentApplyLayout()
                }
              }
              }
            >{t('Menu.Transformation.tagData')}</Button>
          </Box>
        </Box></OSTooltip> : <></>}

    {/* Aggrégation */}
    {mode_trans == 'expert' ?
      <OSTooltip label={t('Menu.Transformation.tooltips.tagLevel')} >
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.tagLevel')}</Box>
          <Box layerStyle='options_4cols' >
            <Button
              variant={data_var_to_update.current.includes('tagLevel') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.current.includes('tagLevel')) {
                  data_var_to_update.current.push('tagLevel')
                  menu_configuration.updateComponentApplyLayout()
                } else {
                  data_var_to_update.current.splice(data_var_to_update.current.indexOf('tagLevel'), 1)
                  menu_configuration.updateComponentApplyLayout()
                }
              }
              }
            >{data_var_to_update.current.includes('tagLevel') ? applicationData.icon_library.icon_activated : applicationData.icon_library.icon_unactivated}</Button>
          </Box>
        </Box></OSTooltip> : <></>}

    <OSTooltip label={t('Menu.Transformation.tooltips.attrDrawingArea')} >
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.attrGeneral')}</Box>
        <Box layerStyle='options_4cols' >
          <Button
            variant={data_var_to_update.current.includes('attrDrawingArea') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => {
              if (!data_var_to_update.current.includes('attrDrawingArea')) {
                data_var_to_update.current.push('attrDrawingArea')
                menu_configuration.updateComponentApplyLayout()
              } else {
                data_var_to_update.current.splice(data_var_to_update.current.indexOf('attrDrawingArea'), 1)
                menu_configuration.updateComponentApplyLayout()
              }
            }
            }
          >{data_var_to_update.current.includes('attrDrawingArea') ? applicationData.icon_library.icon_activated : applicationData.icon_library.icon_unactivated}</Button>
        </Box>
      </Box></OSTooltip>
    {mode_trans == 'expert' ? apply_transformation_additional_elements.map((c: JSX.Element, i: number) => {
      return <React.Fragment key={i}>{c}</React.Fragment>
    }) : <></>}
  </Box>

  const dragLayout = <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={applicationData.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_apply_layout'}
    content={content_modal_layout}
    title={t('Menu.Transformation.title')}
  />
  return dragLayout

}

/**
 *
 * @param {FCType_ApplySaveJSONDialog}
 * @returns {*}
 */
export const ApplySaveJSONDialog: FunctionComponent<FCType_ApplySaveJSONDialog> = (
  {
    new_data,
    ClickSaveDiagram
  }: FCType_ApplySaveJSONDialog
) => {
  const { t } = new_data
  const [show_save_json_modal, set_show_save_json_modal] = useState(false)
  const [, setCount] = useState(0)
  new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_json_saver.current = set_show_save_json_modal

  // Set ref of update of ApplySaveJSONDialog components
  new_data.menu_configuration.ref_to_save_diagram_updater.current = () => setCount(a => a + 1)

  return <Modal
    isOpen={show_save_json_modal}
    onClose={() => set_show_save_json_modal(false)}
    variant='modal_dialog'
  >
    <ModalContent
      maxWidth='inherit'
    >
      <ModalHeader>
        {t('Menu.SaveJSON')}
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Box layerStyle='menuconfigpanel_grid' >
          <Checkbox
            variant='menuconfigpanel_option_checkbox'
            isChecked={new_data.options_save_json.mode_save}
            onChange={(evt) => { new_data.options_save_json.mode_save = evt.target.checked; setCount(a => a + 1) }}>
            {t('Menu.SaveValue')}
          </Checkbox>
          <Checkbox
            variant='menuconfigpanel_option_checkbox'
            isChecked={new_data.options_save_json.mode_visible_element}
            onChange={(evt) => { new_data.options_save_json.mode_visible_element = evt.target.checked; setCount(a => a + 1) }}>
            {t('Menu.VisibleElement')}
          </Checkbox>
          {new_data.menu_configuration.additionalMenus.current.additional_file_save_json_option.map(el => <React.Fragment key={'add_save_'}>{el}</React.Fragment>)}
        </Box>
      </ModalBody>
      <ModalFooter>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='options_2cols' >
            <Button
              onClick={
                () => {
                  ClickSaveDiagram(new_data)
                }
              }>{t('Menu.SaveJSON')}
            </Button>
            <Button
              onClick={
                () => {
                  set_show_save_json_modal(false)
                }
              }>{t('Menu.close')}
            </Button>
          </Box>
        </Box>
      </ModalFooter>
    </ModalContent>
  </Modal>
}

/**
 * Return the modal when we try to open an excel file
 *
 * @param {{ uploadExcelImpl: any; handleCloseDialog: any; set_data: any; data: any; set_show_excel_dialog: any; url_prefix: any; postProcessLoadExcel: any; launch: any; }} { uploadExcelImpl, handleCloseDialog, set_data, data, set_show_excel_dialog,url_prefix,postProcessLoadExcel,launch }
 * @returns
 */
export const ExcelModal: FunctionComponent<FCType_ExcelModal> = (
  {
    new_data,
    uploadExcelImpl,
    launch,
  }
) => {
  const { t, url_prefix } = new_data
  const [input_file_name, set_input_file_name] = useState<Blob | undefined>(undefined)
  const content = <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box>
      {t('Menu.input_file_excel')}
      <Input
        type="file"
        accept='.xlsx'
        onChange={(evt: ChangeEvent) => {
          set_input_file_name((evt.target as HTMLFormElement).files[0])
        }}
      />
    </Box>

    <Box layerStyle='menuconfigpanel_row_2cols'>
      <Box />
      <Button
        variant="menuconfigpanel_option_button_secondary"
        isActive
        size='sizeButtonDialog'
        onClick={
          () => {
            // Reset navigator data without redrawing sankey (uploadExcelImpl will do it after downloading data from server)
            new_data.reinitialization(false)
            launch((input_file_name as unknown as { [name: string]: string }).name)
            uploadExcelImpl(
              new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_excel_loader.current, input_file_name as Blob, url_prefix
            )
          }
        }
      >{t('Menu.ouvrir')}</Button>
    </Box>
  </Box>
  return <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_excel_loader'}
    content={content}
    title={t('Menu.open_excel_file')}
  />

}

export const OpenSankeyDiagramSelector: FType_DiagramSelector = (
  new_data
) => {
  const { t, data_var_to_update } = new_data
  const [file_layout, set_file_layout] = useState<Blob[] | undefined>(undefined)
  return <Box>
    <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
      {t('Menu.Transformation.fmep')}
    </Box>
    <Box layerStyle='menuconfigpanel_row_2cols'>
      <Input
        type="file"
        aria-label=''
        onChange={(evt: React.ChangeEvent) => set_file_layout((evt.target as HTMLFormElement).files)} />
      <Box layerStyle='options_2cols' >
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => {
            if (file_layout === undefined) {
              return
            }

            const reader = new FileReader()
            reader.onload = (() => {
              return (
                (e: ProgressEvent<FileReader>) => {
                  let result = (e.target as FileReader).result
                  if (result) {
                    // TODO verifier fonctionnement de ce qui suit
                    result = String(result)
                    const new_layout = JSON.parse(result)
                    const tmp_DA = new_data.createNewDrawingArea()
                    tmp_DA.fromJSON(new_layout)
                    new_data.drawing_area.updateFrom(tmp_DA, data_var_to_update.current)
                    new_data.drawing_area.drawElements()
                    new_data.drawing_area.areaAutoFit(true)
                    new_data.menu_configuration.updateAllMenuComponents()
                  }
                }
              )
            })()
            reader.readAsText(file_layout[0])
          }}>{t('Menu.Transformation.ad')}
        </Button>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => {
            // set_sankey_data(JSON.parse(JSON.stringify(prev_sankey_data)))
          }}>{t('Menu.Transformation.undo')}
        </Button>
      </Box>
    </Box>
  </Box>
}

// export const PopoverSelectorDetailNodes:FunctionComponent<popoverSelectorDetailNodesFType>=({
//   applicationContext,
//   applicationData,
//   applicationDraw,
//   node_function,
//   link_function
// }
// )=>{
//   const redrawAllNodes=()=>node_function.RedrawNodes(Object.values(applicationData.display_nodes))
//   const redrawAllLinks=()=>link_function.RedrawLinks(Object.values(applicationData.display_links))

//   return <Popover id='popover-details-level' style={{maxWidth:'100%'}}>
//     <Popover.Header as="h3">{applicationContext.t('Banner.ndd')}</Popover.Header>
//     <Popover.Body style={{  marginLeft: '5px', width: '350px' }}>
//       <>{(Object.entries(applicationData.data.levelTags).length > 0) ? (<>
//         {addSimpleLevelDropDown(
//           applicationData,applicationDraw.reDrawLegend,redrawAllNodes,redrawAllLinks,node_function.recomputeDisplayedElement
//         )}</>
//       ) : (<>
//         <Form.Control placeholder="Pas de filtrage" style={{ opacity: !new_data.is_static ? '0.3' : '0', color: '#6c757d' }} disabled /></>)}</>
//     </Popover.Body>
//   </Popover>
// }
// export default PopoverSelectorDetailNodesetailNodes

type excelOptionType = {
  with_sheet_formating?: boolean,
  // Node
  with_node?: boolean,
  has_separated_nodes_sheets?: boolean,
  separated_nodes_sheets?: 'dimensions' | 'families',
  dimensions_to_ignore?: string[],
  dimensions_max_levels?: { [x: string]: number },
  with_flux_sheets?: boolean,
  activate_data_table?: boolean,
  activate_flux_matrix?: boolean,
  data_table_with_all_flux?: boolean
  flux_matrix_with_data?: boolean,
  with_tags?: boolean,
  ignore_nodetaggroups?: string[],
  ignore_fluxtaggroups?: string[],
  ignore_datataggroups?: string[][],


}

const defaultExcelNodeSheetsValue = {
  separated_nodes_sheets: undefined,
}

const defaultFluxOptionValue = {
  activate_data_table: true,
  activate_flux_matrix: true,
  data_table_with_all_flux: false,
  flux_matrix_with_data: false,
}

const default_otpion: excelOptionType = {
  with_node: true,
  has_separated_nodes_sheets: true,
  ...defaultExcelNodeSheetsValue,
  dimensions_to_ignore: [],
  dimensions_max_levels: {},
  with_flux_sheets: true,
  ...defaultFluxOptionValue,
  with_tags: true,
  ignore_nodetaggroups: [],
  ignore_fluxtaggroups: [],
  ignore_datataggroups: [],

}

/**
 * Return the modal when we try to save an excel file
 *
 * @param {{ uploadExcelImpl: any; handleCloseDialog: any; set_data: any; data: any; set_show_excel_dialog: any; url_prefix: any; postProcessLoadExcel: any; launch: any; }} { uploadExcelImpl, handleCloseDialog, set_data, data, set_show_excel_dialog,url_prefix,postProcessLoadExcel,launch }
 * @returns
 */
export const ExcelModalSaver: FunctionComponent<{ new_data: Class_ApplicationData }> = (
  {
    new_data,
  }
) => {
  const { t } = new_data
  const [, setUpdate] = useState(0)

  const dict_option: MutableRefObject<excelOptionType> = useRef({})
  const valNodeSheet = dict_option.current['separated_nodes_sheets']

  // ----------------Options for ignored taggs----------------
  const optionsDataTaggList = new_data.drawing_area.sankey.data_taggs_list
    .map((tag) => {
      return {
        'label': tag.name,
        'value': tag.id,
        selected: dict_option.current['ignore_datataggroups']?.map(val => val[0])?.includes(tag.id) ?? false
      }
    })

  const optionsNodeTaggList = new_data.drawing_area.sankey.node_taggs_list
    .map((tag) => {
      return {
        'label': tag.name,
        'value': tag.id,
        selected: dict_option.current['ignore_nodetaggroups']?.includes(tag.id) ?? false
      }
    })

  const optionsFluxTaggList = new_data.drawing_area.sankey.flux_taggs_list
    .map((tag) => {
      return {
        'label': tag.name,
        'value': tag.id,
        selected: dict_option.current['ignore_fluxtaggroups']?.includes(tag.id) ?? false
      }
    })

  const optionsDimTaggList = new_data.drawing_area.sankey.level_taggs_list
    .map((tag) => {
      return {
        'label': tag.name,
        'value': tag.id,
        selected: dict_option.current['dimensions_to_ignore']?.includes(tag.id) ?? false
      }
    })


  // ----------------Function change wrapperCheckbox value----------------
  const changeHasSeparatedNodeSheet = (evt: boolean) => {
    if (evt) {
      dict_option.current['has_separated_nodes_sheets'] = true
      dict_option.current = { ...dict_option.current, ...defaultExcelNodeSheetsValue }
    } else {
      delete dict_option.current['has_separated_nodes_sheets']
      delete dict_option.current['separated_nodes_sheets']
    }
    setUpdate(a => a + 1)
  }

  const changeWithNode = (evt: boolean) => {
    if (evt) {
      dict_option.current['with_node'] = true
      dict_option.current['has_separated_nodes_sheets'] = true
      dict_option.current = { ...dict_option.current, ...defaultExcelNodeSheetsValue }
      dict_option.current['dimensions_to_ignore'] = []
      dict_option.current['dimensions_max_levels'] = {}
    } else {
      delete dict_option.current['with_node']
      delete dict_option.current['has_separated_nodes_sheets']
      delete dict_option.current['separated_nodes_sheets']
      delete dict_option.current['dimensions_to_ignore']
      delete dict_option.current['dimensions_max_levels']
    }
    setUpdate(a => a + 1)
  }

  const changeHAsDimensionsToIgnore = (evt: boolean) => {
    if (evt) {
      dict_option.current.dimensions_to_ignore = []
      dict_option.current.dimensions_max_levels = {}
    } else {
      delete dict_option.current['dimensions_to_ignore']
      delete dict_option.current['dimensions_max_levels']
    }
    setUpdate(a => a + 1)
  }

  const changeWithFlux = (evt: boolean) => {
    if (evt) {
      dict_option.current['with_flux_sheets'] = true
      dict_option.current = { ...dict_option.current, ...defaultFluxOptionValue }
    } else {
      dict_option.current['with_flux_sheets'] = false
      delete dict_option.current['activate_data_table']
      delete dict_option.current['data_table_with_all_flux']
      delete dict_option.current['activate_flux_matrix']
      delete dict_option.current['flux_matrix_with_data']

    }
    setUpdate(a => a + 1)
  }

  const changeWithTags = (evt: boolean) => {
    if (evt) {
      dict_option.current['with_tags'] = true
      dict_option.current['ignore_nodetaggroups'] = []
      dict_option.current['ignore_fluxtaggroups'] = []
      dict_option.current['ignore_datataggroups'] = []
    } else {
      dict_option.current['with_tags'] = false
      delete dict_option.current['ignore_nodetaggroups']
      delete dict_option.current['ignore_fluxtaggroups']
      delete dict_option.current['ignore_datataggroups']
    }
    setUpdate(a => a + 1)
  }

  const changeIgnoreTagGroup = (evt: boolean) => {
    if (evt) {
      dict_option.current['ignore_nodetaggroups'] = []
      dict_option.current['ignore_fluxtaggroups'] = []
      dict_option.current['ignore_datataggroups'] = []
    } else {
      delete dict_option.current['ignore_nodetaggroups']
      delete dict_option.current['ignore_fluxtaggroups']
      delete dict_option.current['ignore_datataggroups']
    }
    setUpdate(a => a + 1)
  }

  const changeDataTable = (evt: boolean) => {
    if (evt) {
      dict_option.current['activate_data_table'] = true
      dict_option.current['data_table_with_all_flux'] = false
    } else {
      dict_option.current['activate_data_table'] = false
      delete dict_option.current['data_table_with_all_flux']
    }
    setUpdate(a => a + 1)
  }

  const changeMatrixTable = (evt: boolean) => {
    if (evt) {
      dict_option.current['activate_flux_matrix'] = true
      dict_option.current['flux_matrix_with_data'] = false
    } else {
      dict_option.current['activate_flux_matrix'] = false
      delete dict_option.current['flux_matrix_with_data']
    }
    setUpdate(a => a + 1)
  }

  // ----------------Contents of component----------------
  const content_rewrite_excel = <Checkbox
    key={'rewrite_excel'}
    variant='menuconfigpanel_option_checkbox'
    isChecked={dict_option.current['with_sheet_formating'] === true}
    onChange={(evt: { target: { checked: boolean } }) => {
      if (evt.target.checked) dict_option.current['with_sheet_formating'] = true
      else delete dict_option.current['with_sheet_formating']
      setUpdate(a => a + 1)
    }}
  >
    {t('Menu.saveExcel.formatSheet')}
  </Checkbox>

  const content_node = <WrapperCheckBoxSubSectionMenu
    open={dict_option.current['with_node'] === true}
    onClick={changeWithNode}
    title={t('Menu.Config.element_node')}>
    <>
      <WrapperCheckBoxSubSectionMenu
        open={dict_option.current['has_separated_nodes_sheets'] === true}
        onClick={changeHasSeparatedNodeSheet}
        title={t('Menu.saveExcel.nodeSheets')}>
        <>
          {/* Select criteria for node split sheets */}
          <Box layerStyle='menuconfigpanel_option_name' >
            {t('Menu.saveExcel.nodeSheetsCriteria')}
          </Box>
          <ButtonGroup isAttached>
            <Button variant={valNodeSheet === 'dimensions' ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'} onClick={() => {
              if (valNodeSheet === 'dimensions') delete dict_option.current['separated_nodes_sheets']
              else dict_option.current['separated_nodes_sheets'] = 'dimensions'
              setUpdate(a => a + 1)
            }}>
              {t('Menu.saveExcel.dim')}
            </Button>
            <Button variant={valNodeSheet === 'families' ? 'menuconfigpanel_option_button_activated_center' : 'menuconfigpanel_option_button_center'} onClick={() => {
              if (valNodeSheet === 'families') delete dict_option.current['separated_nodes_sheets']
              else dict_option.current['separated_nodes_sheets'] = 'families'
              setUpdate(a => a + 1)
            }}>
              {t('Menu.saveExcel.fam')}
            </Button>
          </ButtonGroup>
        </>
      </WrapperCheckBoxSubSectionMenu>

      <WrapperCheckBoxSubSectionMenu
        open={dict_option.current.dimensions_to_ignore !== undefined}
        onClick={changeHAsDimensionsToIgnore}
        title='Dimensions'>
        <>

          {/* Select level tag group to ignore */}
          <Box layerStyle='menuconfigpanel_row_2cols'>
            <Box>{t('Menu.saveExcel.ignDimTagg')}</Box>
            <OSMultiSelect
              t={new_data.t}
              elements={optionsDimTaggList}
              onClick={(entries: typeElementSelectable) => {
                dict_option.current['dimensions_to_ignore'] = []
                entries.forEach(sel => {
                  dict_option.current['dimensions_to_ignore']!.push(sel.value)
                  delete (dict_option.current?.dimensions_max_levels ?? {})[sel.value]  //delete entrie in dimensions_max_levels
                })
                setUpdate(a => a + 1)
              }}
            />
          </Box>
          <Box layerStyle='menuconfigpanel_option_name' >
            {t('Menu.saveExcel.dimMaxLevel')}
          </Box>

          {/* For each level tag group select max level saved */}
          {new_data.drawing_area.sankey.level_taggs_list.map(lvl => {
            // If dimensions is ignored don't create a list to select max level
            if (dict_option.current.dimensions_to_ignore?.includes(lvl.id))
              return <></>

            const dim_lvl_max_selected = ((dict_option.current?.dimensions_max_levels ?? {})[lvl.id] ?? undefined)

            return <Box layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name' >
                {lvl.name}
              </Box>
              <Menu key={lvl.id}>
                <MenuButton
                  as={Button}
                  variant='menuconfigpanel_option_button'
                  rightIcon={new_data.icon_library.icon_open_selector}
                >
                  {dim_lvl_max_selected !== undefined ? lvl.tags_list[dim_lvl_max_selected].name : t('Menu.saveExcel.noMaxLevel')}
                </MenuButton>
                <MenuList>
                  {lvl.tags_list.map((lvlTag, idx) => {
                    return <MenuItem key={lvlTag.name}
                      display='flex'
                      onClick={() => {
                        if (!dict_option.current['dimensions_max_levels'])
                          return
                        if (dict_option.current['dimensions_max_levels'][lvl.id] == idx) delete dict_option.current['dimensions_max_levels'][lvl.id]
                        else dict_option.current['dimensions_max_levels'][lvl.id] = idx
                        setUpdate(a => a + 1)
                      }}>
                      {lvlTag.name}{checked((dict_option.current?.dimensions_max_levels ?? {})[lvl.id] == idx)}
                    </MenuItem>
                  })}
                </MenuList>
              </Menu>
            </Box>
          })
          }
        </>
      </WrapperCheckBoxSubSectionMenu>
    </>
  </WrapperCheckBoxSubSectionMenu>

  const content_flow = <WrapperCheckBoxSubSectionMenu
    open={dict_option.current['with_flux_sheets'] === true}
    onClick={changeWithFlux}
    title={t('Menu.Config.element_flow')}>
    <>

      <WrapperCheckBoxSubSectionMenu
        open={dict_option.current['activate_flux_matrix'] === true}
        onClick={changeMatrixTable}
        title={t('Menu.saveExcel.matrixTable')}>
        <Checkbox
          key={'matrixTable'}
          variant='menuconfigpanel_option_checkbox'
          isChecked={dict_option.current['flux_matrix_with_data'] === true}
          onChange={(evt: { target: { checked: boolean } }) => {
            dict_option.current['flux_matrix_with_data'] = evt.target.checked
            setUpdate(a => a + 1)
          }}>
          {t('Menu.saveExcel.fluxData')}
        </Checkbox>
      </WrapperCheckBoxSubSectionMenu>

      <WrapperCheckBoxSubSectionMenu
        open={dict_option.current['activate_data_table'] === true}
        onClick={changeDataTable}
        title={t('Menu.saveExcel.dataTable')}>
        <Checkbox
          key={'dataTable'}
          variant='menuconfigpanel_option_checkbox'
          isChecked={dict_option.current['data_table_with_all_flux'] === true}
          onChange={(evt: { target: { checked: boolean } }) => {
            dict_option.current['data_table_with_all_flux'] = evt.target.checked
            setUpdate(a => a + 1)
          }}>
          {t('Menu.saveExcel.fluxAllData')}
        </Checkbox>
      </WrapperCheckBoxSubSectionMenu>

    </>
  </WrapperCheckBoxSubSectionMenu>

  const content_tag = <WrapperCheckBoxSubSectionMenu
    open={dict_option.current['with_tags'] === true}
    onClick={changeWithTags}
    title={t('Menu.Etiquettes')}
  >
    <WrapperCheckBoxSubSectionMenu
      open={dict_option.current['ignore_nodetaggroups'] !== undefined}
      onClick={changeIgnoreTagGroup}
      title={t('Menu.saveExcel.ignTagg')}>

      {/* Select node tag group to ignore */}
      <Box layerStyle='menuconfigpanel_row_2cols'>
        <Box>{t('Menu.saveExcel.ignNodeTagg')}</Box>
        <OSMultiSelect
          t={new_data.t}
          elements={optionsNodeTaggList}
          onClick={(entries: typeElementSelectable) => {
            dict_option.current['ignore_nodetaggroups'] = []
            entries.forEach(sel => {
              dict_option.current['ignore_nodetaggroups']!.push(sel.value)
            })
            setUpdate(a => a + 1)
          }}
        />
      </Box>

      {/* Select flux tag group to ignore */}
      <Box layerStyle='menuconfigpanel_row_2cols'>
        <Box>{t('Menu.saveExcel.ignFlowTagg')}</Box>
        <OSMultiSelect
          t={new_data.t}
          elements={optionsFluxTaggList}
          onClick={(entries: typeElementSelectable) => {
            dict_option.current['ignore_fluxtaggroups'] = []
            entries.forEach(sel => {
              dict_option.current['ignore_fluxtaggroups']!.push(sel.value)
            })
            setUpdate(a => a + 1)
          }}
        />
      </Box>


      {/* Select data tag group to ignore */}
      <Box layerStyle='menuconfigpanel_row_2cols'>
        <Box>{t('Menu.saveExcel.ignDataTagg')}</Box>
        <OSMultiSelect
          t={new_data.t}
          elements={optionsDataTaggList}
          onClick={(entries: typeElementSelectable) => {
            dict_option.current['ignore_datataggroups'] = []
            entries.forEach(sel => {
              dict_option.current['ignore_datataggroups']!.push([sel.value, new_data.drawing_area.sankey.data_taggs_dict[sel.value].tags_list[0].id])
            })
            setUpdate(a => a + 1)
          }}
        />
      </Box>

      <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
        {t('Menu.saveExcel.PreferenceTag')}
      </Box>
      {dict_option.current['ignore_datataggroups']?.map(ent => {
        const taggs_dict = new_data.drawing_area.sankey.data_taggs_dict
        return <Box layerStyle='menuconfigpanel_row_2cols'>
          <Box>{taggs_dict[ent[0]].name}</Box>
          <Select
            value={ent[1]}
            onChange={(evt) => {
              dict_option.current['ignore_datataggroups']?.forEach(val => {
                if (val[0] == ent[0]) {
                  val[1] = evt.target.value
                }
                setUpdate(a => a + 1)
              })
            }}>
            {taggs_dict[ent[0]].tags_list.map((tag, idx) => {
              return <option key={'val_' + idx} value={tag.id}>{tag.name}</option>
            })}
          </Select>
        </Box>
      })}

    </WrapperCheckBoxSubSectionMenu>
  </WrapperCheckBoxSubSectionMenu>

  const option = <Box layerStyle='menu_sub_section' w='30vw' maxH='70vh' overflowY='auto' fontSize='0.6rem'><WrapperCheckBoxSubSectionMenu
    open={Object.keys(dict_option.current).length !== 0}
    onClick={(evt) => {
      if (evt) dict_option.current = Object.assign({}, default_otpion)
      else dict_option.current = {}
      setUpdate(a => a + 1)
    }} title='Options'>
    <>
      {content_rewrite_excel}
      {content_node}
      {content_flow}
      {content_tag}
    </>
  </WrapperCheckBoxSubSectionMenu>
  </Box>

  const content = <>
    {option}
    <Box layerStyle='menuconfigpanel_row_2cols'>
      <Box />
      <Button
        variant="menuconfigpanel_option_button_secondary"
        isActive
        size='sizeButtonDialog'
        onClick={() => {
          new_data.saveToExcel('/opensankey/', dict_option.current as JSON)
        }}
      >{t('Menu.enregistrer')}</Button>
    </Box>
  </>

  return <MenuDraggable
    maxW='45vw'
    dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_excel_saver'}
    content={content}
    title={t('Menu.save_excel_file')}
  />

}