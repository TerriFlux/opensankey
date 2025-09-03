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

import React, { ChangeEvent, FC, useState, } from 'react'

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
  ModalCloseButton
} from '@chakra-ui/react'


import { default_style_id } from '../../types/Utils'
import { MenuDraggable } from '../topmenus/SankeyMenus'
import { FType_DiagramSelector } from '../SankeyMenuTypes'
import { OSTooltip } from '../configmenus/MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { FType_ClickSaveDiagram, FType_UploadExcelImpl } from '../../Persistence/SankeyPersistenceTypes'


/**
 *
 * @param  { ref_setter_show_modal_apply_layout, set_show_apply_layout, sankey_data, set_sankey_data }
 * @returns {*}
 */
export const ApplyLayoutDialog = ({
  new_data
}: {
  new_data: Class_ApplicationData
}) => {
  const { data_var_to_update, t, menu_configuration } = new_data
  const { node_styles_dict } = new_data.drawing_area.sankey
  const { ref_to_updater_modal_apply_layout } = menu_configuration

  const [, setForceUpdate] = useState(true)
  const [mode_trans, set_mode_trans] = useState('simple')
  const [auto_x, set_auto_x] = useState(node_styles_dict[default_style_id].position.auto_x)

  ref_to_updater_modal_apply_layout.current = () => setForceUpdate(b => !b)
  if (auto_x !== (node_styles_dict[default_style_id].position.auto_x)) {
    set_auto_x(node_styles_dict[default_style_id].position.auto_x)
  }

  const simple_element_to_transform = [
    'posNode', 'posFlux',
    'attrNode', 'attrFlux',
    'attrDrawingArea'
  ]
  const default_element_to_transform = [
    'posNode', 'posFlux',
    'attrNode', 'attrFlux',
    'attrDrawingArea'
  ]



  const content_modal_layout = <Box layerStyle='menuconfigpanel_grid' >
    {OpenSankeyDiagramSelector(new_data)}

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Menu.choseTransforDifficulty')}
      </Box>
      <Box layerStyle='options_3cols' >
        <Button variant={mode_trans == 'simple' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={() => { set_mode_trans('simple'); new_data.menu_configuration.ref_to_menu_updater.current() }}>Basiques</Button>
        <Button variant={mode_trans == 'expert' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={() => { set_mode_trans('expert'); new_data.menu_configuration.ref_to_menu_updater.current() }}>Tous</Button>
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
                new_data.transform_layout_all_attr.forEach(el => data_var_to_update.current.push(el))
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
            >{data_var_to_update.current.includes('Values') ? new_data.icon_library.icon_activated : new_data.icon_library.icon_unactivated}</Button>
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
            >{data_var_to_update.current.includes('tagLevel') ? new_data.icon_library.icon_activated : new_data.icon_library.icon_unactivated}</Button>
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
          >{data_var_to_update.current.includes('attrDrawingArea') ? new_data.icon_library.icon_activated : new_data.icon_library.icon_unactivated}</Button>
        </Box>
      </Box></OSTooltip>
    {mode_trans == 'expert' ? <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.freeLabels')}</Box>
      <Box layerStyle='options_4cols' >
        <Button
          variant={data_var_to_update.current.includes('freeLabels') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
          onClick={() => {
            if (!data_var_to_update.current.includes('freeLabels')) {
              data_var_to_update.current.push('freeLabels')
            } else {
              data_var_to_update.current.splice(data_var_to_update.current.indexOf('freeLabels'), 1)
            }
            menu_configuration.updateComponentApplyLayout()
          }
          }
        >{data_var_to_update.current.includes('freeLabels') ? new_data.icon_library.icon_activated : new_data.icon_library.icon_unactivated}</Button>
      </Box>
    </Box> : <></>}
  </Box>

  const dragLayout = <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
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
export const ApplySaveJSONDialog = ({ new_data, ClickSaveDiagram }: {
  new_data: Class_ApplicationData,
  ClickSaveDiagram: FType_ClickSaveDiagram
}
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
export const ExcelModal = ({ new_data, uploadExcelImpl, launch }: {
  new_data: Class_ApplicationData,
  uploadExcelImpl: FType_UploadExcelImpl,
  launch: (path: string) => void,
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

export const OpenSankeyDiagramSelector = (app_data: Class_ApplicationData) => {
  const { t, data_var_to_update } = app_data
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
                    const json_object = JSON.parse(result)
                    const tmp_DA = app_data.createNewDrawingArea()
                    tmp_DA.fromJSON(json_object)
                    app_data.drawing_area.updateFrom(tmp_DA, data_var_to_update.current)
                    //app_data.fromJSON(json_object)
                    // app_data.drawing_area.drawElements()
                    // app_data.drawing_area.areaAutoFit(true)
                    // app_data.menu_configuration.updateAllMenuComponents()
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

