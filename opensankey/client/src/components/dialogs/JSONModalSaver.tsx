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

import React, { useState, } from 'react'
import { ClickSaveDiagram } from "../../Persistence/SankeyPersistence"
import { Class_ApplicationData } from "../../types/ApplicationData"
import {Box,Checkbox,Button,Modal,ModalContent,ModalHeader,ModalBody,ModalFooter,ModalCloseButton} from '@chakra-ui/react'

/**
 *
 * @param {FCType_SaveJSONDialog}
 * @returns {*}
 */
export const SaveJSONDialog = ({ app_data }: {app_data: Class_ApplicationData}) => {
  const { t } = app_data
  const [show_save_json_modal, set_show_save_json_modal] = useState(false)
  const [, setCount] = useState(0)
  app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_json_saver.current = set_show_save_json_modal

  // Set ref of update of ApplySaveJSONDialog components
  app_data.menu_configuration.ref_to_save_diagram_updater.current = () => setCount(a => a + 1)

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
            isChecked={app_data.options_save_json.with_values}
            onChange={(evt) => { app_data.options_save_json.with_values = evt.target.checked; setCount(a => a + 1) }}>
            {t('Menu.SaveValue')}
          </Checkbox>
          <Checkbox
            variant='menuconfigpanel_option_checkbox'
            isChecked={app_data.options_save_json.save_only_visible_elements}
            onChange={(evt) => { app_data.options_save_json.save_only_visible_elements = evt.target.checked; setCount(a => a + 1) }}>
            {t('Menu.VisibleElement')}
          </Checkbox>
          <Checkbox
            variant='menuconfigpanel_option_checkbox'
            isChecked={app_data.options_save_json.save_only_elements_with_tags}
            onChange={(evt) => { app_data.options_save_json.save_only_elements_with_tags = evt.target.checked; setCount(a => a + 1) }}>
            {t('Menu.VisibleTagElement')}
          </Checkbox>
          <Checkbox
            variant='menuconfigpanel_option_checkbox'
            isChecked={app_data.options_save_json.mode_compressed}
            onChange={(evt) => { app_data.options_save_json.mode_compressed = evt.target.checked; setCount(a => a + 1) }}>
            {'ZIP file'}
          </Checkbox>
          {app_data.menu_configuration.additionalMenus.current.additional_file_save_json_option.map(el => <React.Fragment key={'add_save_'}>{el}</React.Fragment>)}
        </Box>
      </ModalBody>
      <ModalFooter>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='options_2cols' >
            <Button
              onClick={
                () => {
                  app_data.saveToJSON()
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
