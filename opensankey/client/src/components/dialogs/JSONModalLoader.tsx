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

import React, { ChangeEvent, useState } from 'react'
import { Class_ApplicationData } from "../../types/ApplicationData"
import { Box, Button, Input } from '@chakra-ui/react'
import { MenuDraggable } from '../topmenus/SankeyMenus'
import { decompressUploadedFileUniversal } from '../../Persistence/UniversalJSONCompression'
import { Type_JSON } from '../../types/Utils'

/**
 *
 * @param {FCType_SaveJSONDialog}
 * @returns {*}
 */
export const LoadJSONDialog = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t } = app_data
  const [input_file_name, set_input_file_name] = useState<File | undefined>(undefined)
  const [, setCount] = useState(0)
  app_data.menu_configuration.ref_to_load_diagram_updater.current = () => setCount(a => a + 1)

  const content = <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box>
      {t('Menu.input_file_json')}
      <Input
        type="file"
        accept='.json,.gz,.zip'
        onChange={(evt: ChangeEvent<HTMLInputElement>) => {
          const file = evt.target.files?.[0]
          set_input_file_name(file)
        }}
      />
    </Box>
    <Box layerStyle='menuconfigpanel_grid' >
      {app_data.menu_configuration.additionalMenus.current.additional_file_load_json_option.map(el => 
      <React.Fragment key={'add_load_'}>{el}</React.Fragment>)
      }
    </Box>

    <Box layerStyle='menuconfigpanel_row_2cols'>
      <Box />
      <Button
        variant="menuconfigpanel_option_button_secondary"
        isActive
        size='sizeButtonDialog'
        onClick={
          () => {
            decompressUploadedFileUniversal(input_file_name!).then(JSON_data => {
              app_data.fromJSON(JSON_data as Type_JSON)
            }
          )}}>{t('Menu.ouvrir')}
      </Button>
    </Box>
  </Box>

  return <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={app_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_json_loader'}
    content={content}
    title={t('Menu.open_json')}
  />
}
