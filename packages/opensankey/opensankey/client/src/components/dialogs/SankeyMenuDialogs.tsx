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

import React, { ChangeEvent, FunctionComponent, useState, } from 'react'

import {
  Box,
  Checkbox,
  Button,
  NumberInput,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInputField,
  NumberInputStepper,
  TabList,
  Tab,
  Tabs,
  TabPanels,
  TabPanel,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton
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
import { isPositionOverloaded } from '../../Elements/Node'

import { MenuDraggable } from '../topmenus/SankeyMenus'


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
  const { node_styles_dict, link_styles_dict } = applicationData.drawing_area.sankey
  const { ref_to_updater_modal_apply_layout } = menu_configuration

  const [forceUpdate, setForceUpdate] = useState(true)
  const [mode_trans, set_mode_trans] = useState('simple')
  const [parametric, set_parametric] = useState(node_styles_dict[default_style_id].position.type == 'parametric')
  const [auto_x, set_auto_x] = useState(node_styles_dict[default_style_id].position.auto_x)
  let trade_close = true
  if ('NodeImportStyle' in node_styles_dict) {
    trade_close = node_styles_dict['NodeImportStyle'].position.type == 'relative'
  }
  //const [trade_close, set_trade_close] = useState(true)

  ref_to_updater_modal_apply_layout.current = () => setForceUpdate(b => !b)

  if (parametric !== (node_styles_dict[default_style_id].position.type == 'parametric')) {
    set_parametric(node_styles_dict[default_style_id].position.type == 'parametric')
  }
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

  const setTrade = (trade_close: boolean) => {
    applicationData.drawing_area.bypass_redraws = true
    if (trade_close) {
      // nodes of type
      node_styles_dict['NodeImportStyle'].position.type = 'relative'
      node_styles_dict['NodeImportStyle'].shape_visible = false
      node_styles_dict['NodeImportStyle'].shape_min_height = 40
      node_styles_dict['NodeImportStyle'].name_label_is_visible = false
      node_styles_dict['NodeImportStyle'].value_label_is_visible = false
      // node_styles_dict['NodeImportStyle'].value_label_horiz = 'middle'
      // node_styles_dict['NodeImportStyle'].value_label_vert = 'top'

      node_styles_dict['NodeExportStyle'].position.type = 'relative'
      node_styles_dict['NodeExportStyle'].shape_visible = false
      node_styles_dict['NodeExportStyle'].shape_min_height = 40
      node_styles_dict['NodeExportStyle'].name_label_is_visible = false
      node_styles_dict['NodeExportStyle'].value_label_is_visible = false
      // node_styles_dict['NodeExportStyle'].value_label_horiz = 'middle'
      // node_styles_dict['NodeExportStyle'].value_label_vert = 'bottom'

      link_styles_dict['LinkImportStyle'].shape_orientation = 'vh'
      link_styles_dict['LinkExportStyle'].shape_orientation = 'hv'
    } else {
      node_styles_dict['NodeImportStyle'].position.type = 'parametric'
      node_styles_dict['NodeImportStyle'].shape_visible = false
      node_styles_dict['NodeImportStyle'].shape_min_height = 1
      node_styles_dict['NodeImportStyle'].name_label_is_visible = true
      node_styles_dict['NodeImportStyle'].name_label_horiz = 'left'
      node_styles_dict['NodeImportStyle'].name_label_horiz_shift = -200
      node_styles_dict['NodeImportStyle'].value_label_is_visible = true
      node_styles_dict['NodeImportStyle'].value_label_horiz = 'left'
      node_styles_dict['NodeImportStyle'].value_label_vert = 'middle'
      node_styles_dict['NodeImportStyle'].value_label_horiz_shift = -10

      node_styles_dict['NodeExportStyle'].position.type = 'parametric'
      node_styles_dict['NodeExportStyle'].shape_visible = false
      node_styles_dict['NodeExportStyle'].shape_min_height = 1
      node_styles_dict['NodeExportStyle'].name_label_is_visible = true
      node_styles_dict['NodeExportStyle'].name_label_horiz = 'right'
      node_styles_dict['NodeExportStyle'].name_label_horiz_shift = 200
      node_styles_dict['NodeExportStyle'].value_label_is_visible = true
      node_styles_dict['NodeExportStyle'].value_label_horiz = 'right'
      node_styles_dict['NodeExportStyle'].value_label_vert = 'middle'
      node_styles_dict['NodeExportStyle'].value_label_horiz_shift = 10

      link_styles_dict['LinkImportStyle'].shape_orientation = 'hh'
      link_styles_dict['LinkImportStyle'].value_label_is_visible = false
      link_styles_dict['LinkExportStyle'].shape_orientation = 'hh'
      link_styles_dict['LinkExportStyle'].value_label_is_visible = false
    }
  }

  const content_modal_layout = <Tabs>
    <TabList>
      <Box layerStyle='submenuconfig_tab' >
        <Tab>{t('Menu.Transformation.amp_import')}</Tab>
      </Box>
      <Box layerStyle='submenuconfig_tab' >
        <Tab>{t('Menu.Transformation.amp_manuelle')}</Tab>
      </Box>
    </TabList>

    <TabPanels>
      {/* Import data */}
      <TabPanel >
        <Box layerStyle='menuconfigpanel_grid' >

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
      </TabPanel>

      {/* Geometry */}
      <TabPanel>
        <Box layerStyle='menuconfigpanel_grid' >
          <h5><center>{t('MEP.columnsParameters')}</center></h5>
          {/* Ecart horizontal */}
          <OSTooltip label={t('MEP.tooltips.EEN_h')} >
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name'>{t('MEP.Horizontal')}</Box>
              <NumberInput
                variant='menuconfigpanel_option_numberinput'
                step={1}
                min={0}
                allowMouseWheel
                value={applicationData.drawing_area.horizontal_spacing}
                onChange={evt => {
                  applicationData.drawing_area.horizontal_spacing = +evt
                  menu_configuration.updateComponentApplyLayout()
                }}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>

              </NumberInput>
            </Box>
          </OSTooltip>

          {/* Ecart Vertical */}
          <OSTooltip label={t('MEP.tooltips.EEN_v')} >
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name'>{t('MEP.Vertical')}</Box>
              <NumberInput
                variant='menuconfigpanel_option_numberinput'
                step={1}
                min={0}
                allowMouseWheel
                value={applicationData.drawing_area.vertical_spacing}
                onChange={(evt: string | number) => {
                  applicationData.drawing_area.vertical_spacing = +evt
                  node_styles_dict['default'].position.dy = +evt
                  if (node_styles_dict['NodeSectorStyle']) {
                    node_styles_dict['NodeSectorStyle'].position.dy = +evt
                  }
                  if (node_styles_dict['NodeProductStyle']) {
                    node_styles_dict['NodeProductStyle'].position.dy = +evt
                  }
                  menu_configuration.updateComponentApplyLayout()
                }}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Box>
          </OSTooltip></Box>
        <Box layerStyle='menuconfigpanel_grid' >
          <h5><center>{t('MEP.positioningMode')}</center></h5>
          <Box as='span' layerStyle='menuconfigpanel_row_4cols'>
            <Checkbox
              variant='menuconfigpanel_option_checkbox'
              isChecked={auto_x}
              onChange={(evt: { target: { checked: boolean } }) => {
                node_styles_dict['default'].position.auto_x = evt.target.checked
                set_auto_x(evt.target.checked)
                node_styles_dict[default_style_id].position.auto_x = evt.target.checked
                if (evt.target.checked) {
                  // Object.values(node_styles_dict)
                  //   .filter(style => style.id !== 'NodeExportStyle' && style.id !== 'NodeImportStyle')
                  //   .forEach(style => style.position.type = 'parametric')
                  // applicationData.drawing_area.sankey.nodes_list.forEach(n => n.position_v = -1)
                  applicationData.drawing_area.computeParametrization()
                } /*else {
                  Object.values(node_styles_dict)
                    .filter(style => style.id !== 'NodeExportStyle' && style.id !== 'NodeImportStyle')
                    .forEach(style => style.position.type = 'absolute')
                }*/
              }}
            >
              <OSTooltip label={t('MEP.tooltips.parametricMode')}>
                {t('MEP.autoX')}
              </OSTooltip>
            </Checkbox>
            <Checkbox
              variant='menuconfigpanel_option_checkbox'
              isChecked={parametric}
              onChange={(evt: { target: { checked: boolean } }) => {
                node_styles_dict['default'].position.type = evt.target.checked ? 'parametric' : 'absolute'
                set_parametric(evt.target.checked)
                if (evt.target.checked) {
                  Object.values(node_styles_dict)
                    .filter(style => style.id !== 'NodeExportStyle' && style.id !== 'NodeImportStyle')
                    .forEach(style => style.position.type = 'parametric')
                  applicationData.drawing_area.sankey.nodes_list.forEach(n => n.position_v = -1)
                  applicationData.drawing_area.computeParametrization()
                } else {
                  Object.values(node_styles_dict)
                    .filter(style => style.id !== 'NodeExportStyle' && style.id !== 'NodeImportStyle')
                    .forEach(style => style.position.type = 'absolute')
                }
              }}
            >
              <OSTooltip label={t('MEP.tooltips.parametricMode')}>
                {t('MEP.parametricMode')}
              </OSTooltip>
            </Checkbox>
            <Checkbox
              variant='menuconfigpanel_option_checkbox'
              isChecked={!parametric}
              onChange={(evt: { target: { checked: boolean } }) => {
                set_parametric(!evt.target.checked)
                if (!evt.target.checked) {
                  Object.values(node_styles_dict)
                    .filter(style => style.id !== 'NodeExportStyle' && style.id !== 'NodeImportStyle')
                    .forEach(style => style.position.type = 'parametric')
                  applicationData.drawing_area.computeParametrization()
                } else {
                  Object.values(node_styles_dict)
                    .filter(style => style.id !== 'NodeExportStyle' && style.id !== 'NodeImportStyle')
                    .forEach(style => style.position.type = 'absolute')
                }
              }}
            >
              <OSTooltip label={t('MEP.tooltips.absoluteMode')}>
                {t('MEP.absoluteMode')}
              </OSTooltip>
            </Checkbox>
            {parametric ? <Button
              variant='menuconfigpanel_option_button'
              onClick={() => {
                if (parametric) {
                  Object.values(applicationData.drawing_area.sankey.nodes_dict)
                    .filter(node => node.display.position.type !== 'relative')
                    .forEach(node => {
                      if (isPositionOverloaded([node], 'dy')) {
                        node.resetPositionAttribute('dy')
                        node.applyPosition()
                      }
                    })
                }
                applicationData.draw()
              }}>
              {t('MEP.reInitDY')}
            </Button> : <></>}
          </Box>
          <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
          <Box layerStyle='menuconfigpanel_grid' >
            <h5><center>{t('MEP.importExport')}</center></h5>
            <Box as='span' layerStyle='menuconfigpanel_row_3cols'>
              <Checkbox
                variant='menuconfigpanel_option_checkbox'
                isChecked={trade_close}
                onChange={(evt: { target: { checked: boolean } }) => {
                  setTrade(evt.target.checked)
                  applicationData.drawing_area.arrangeTrade(true)
                  applicationData.draw()
                  setForceUpdate(!forceUpdate)
                }}
              >
                <OSTooltip label={t('MEP.tooltips.importExportClose')}>
                  {t('MEP.importExportClose')}
                </OSTooltip>
              </Checkbox>
              <Checkbox
                isDisabled={!parametric}
                variant='menuconfigpanel_option_checkbox'
                isChecked={!trade_close}
                onChange={(evt: { target: { checked: boolean } }) => {
                  setTrade(!evt.target.checked)
                  applicationData.drawing_area.arrangeTrade(true)
                  applicationData.draw()
                  setForceUpdate(!forceUpdate)
                }}
              >
                <OSTooltip label={t('MEP.tooltips.importExportAboveBelow')}>
                  {t('MEP.importExportAboveBelow')}
                </OSTooltip>
              </Checkbox>
            </Box>
          </Box>

          <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

          { /* Positionnement des noeuds */}
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            { /* Mise en forme automatique */}
            <OSTooltip label={t('MEP.tooltips.PA')} >
              <Button
                variant={'menuconfigpanel_option_button'}
                onClick={() => {
                  applicationData.drawing_area.computeAutoSankey(false)
                }}>
                {t('MEP.PA')}
              </Button>
            </OSTooltip>{/* Arranger les noeud */}
            <OSTooltip label={t('MEP.tooltips.AN')}>
              <Button
                variant={'menuconfigpanel_option_button'}
                onClick={() => {
                  // arrangeNodes(data)
                  // set_data({ ...data })
                }}>
                {t('MEP.AN')}
              </Button>
            </OSTooltip>

          </Box>
        </Box>
      </TabPanel>

    </TabPanels>

  </Tabs>
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