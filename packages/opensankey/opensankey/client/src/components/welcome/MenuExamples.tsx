
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

import React from 'react'
import { Box, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { CONVERTER_CONFIGS } from '../dialogs/PersistenceProcessDialogConfigs'

/**
 * Description placeholder
 *
 * @type {*}
 */
export type ExempleMenuTypes = { [_: string]: ExempleMenuTypes | string[] }

type subtypeFileList = { [_: string]: string[] }
type subtypeObjectList = { [_: string]: ExempleMenuTypes }

/**
 * Description placeholder
 *
 * @type {{ exemple_menu: any; url_prefix: any; data: any; set_data: any; current_path: any; multi_selected_nodes: any; multi_selected_links: any; multi_selected_label: any; launch: any; }}
 */
type ExempleItemTypes = {
  new_data: Class_ApplicationData,
  exemple_menu: JSX.Element | ExempleMenuTypes,
  current_path: string,
  launch: (s: string) => void,
  initial_list: boolean
}

/**
 * Description placeholder
 *
 * @param {ExempleItemTypes} { exemple_menu, url_prefix, data, set_data, current_path, multi_selected_nodes, multi_selected_links,multi_selected_label,launch}
 * @returns {*}
 */
const ExempleItem = (
  {
    new_data,
    exemple_menu,
    current_path,
    launch,
  }: ExempleItemTypes
) => {
  let content = <></>
  let item = Object.keys(exemple_menu).map(
    (key, index) => {
      const tmp_title = key.replaceAll('_', '__').split('__')
      if (tmp_title.length > 1) {
        tmp_title.shift()
      }
      let title = tmp_title.join(' ')
      if (title === 'Formations') {
        title = 'Démos'
      }
      const the_current_path = current_path !== '' ? current_path + '/' + key : key
      if (key === 'Etude' || key === 'Démos') {
        if (typeof (exemple_menu as subtypeObjectList)[key] === 'string') {
          return <></>
        }
        return <ExempleItem
          new_data={new_data}
          exemple_menu={(exemple_menu as subtypeObjectList)[key]}
          current_path={the_current_path}
          launch={launch}
          initial_list={false}
        />
      }
      if (typeof (exemple_menu as subtypeObjectList)[key] === 'string') {
        return <></>
      }
      if (key === 'Files') {
        return <></>
      }
      return (
        <Menu
          variant='menu_subnav_item_demo'
          placement='right-start'
          key={index}
          id={key}
        >
          <MenuButton>
            <Box
              gridColumn='1'
            >
              {title}
            </Box>
            <Box
              gridColumn="2"
              height="1rem"
              width="1rem"
            >
              <ChevronRightIcon
                style={{ 'height': '1rem', 'width': '1rem' }}
              />
            </Box>
          </MenuButton>
          <MenuList>
            <ExempleItem
              new_data={new_data}
              exemple_menu={(exemple_menu as subtypeObjectList)[key]}
              current_path={the_current_path}
              launch={launch}
              initial_list={false}
            />
          </MenuList>
        </Menu>
      )
    }
  )
  if ('Files' in exemple_menu) {
    const files_item = (exemple_menu as subtypeFileList)['Files'].map((item, index) => {
      let path =   current_path + '/' + item
      if (item.includes('.json')) {
        path =current_path+'/'+item
      }

      // Text of the button in the menu
      let text_button = ''
      if (item.includes('xlsx')) {
        if (item.includes('reconciled')) {
          text_button = item.split('.x')[0].replace(/_/g, ' ').replace('reconciled', ' excel')
        } else {
          text_button = item.split('.x')[0].replace(/_/g, ' ') + ' excel'
        }
      } else {
        if (item.includes('json')) {
          text_button= item.replace(/_/g, ' ').replace(' layout.json', ' sankey')
        } else {
          text_button = item.replace('afmsankey_0.9.0.', '')
        }

      }


      return (
        <MenuItem
          key={index}
          onClick={() => {
            // Set app in selection mode
            new_data.drawing_area.purgeSelection()
            if (path.includes('xlsx')) {
              new_data.menu_configuration.ref_universal_converter_set_config.current(
                CONVERTER_CONFIGS['load_example_excel'], '', true
              )
              new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_file_converter.current(true)
            }
          }
          }>{text_button}</MenuItem>
      )
    }
    ) as JSX.Element[]
    item = [...item, ...files_item]
    // content=<>
    //   {list_item}
    // </>
  }
  content = <>{item}</>

  return content

}

export default ExempleItem

