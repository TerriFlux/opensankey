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

import React, { ChangeEvent, useState, } from 'react'
import { Box, Button, Input } from '@chakra-ui/react'

import { MenuDraggable } from '../topmenus/SankeyMenus'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { uploadExcelImpl } from '../../Persistence/SankeyPersistence'

/**
 * Return the modal when we try to open an excel file
 *
 * @param {{ uploadExcelImpl: any; handleCloseDialog: any; set_data: any; data: any; set_show_excel_dialog: any; url_prefix: any; postProcessLoadExcel: any; launch: any; }} { uploadExcelImpl, handleCloseDialog, set_data, data, set_show_excel_dialog,url_prefix,postProcessLoadExcel,launch }
 * @returns
 */
export const ExcelModalLoader = ({ new_data, launch }: {
  new_data: Class_ApplicationData,
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
