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

// Standard libs
import React, { useState } from 'react'

// Imported libs
import {
  Box,
  InputGroup,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button
} from '@chakra-ui/react'
import FileSaver from 'file-saver'

// Local libs
import * as d3 from 'd3'
import { MenuDraggable } from './SankeyMenus'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { FType_ModalResolutionPNG } from '../SankeyMenuTypes'


// COMPONENTS ===========================================================================

export declare const window: Window & typeof globalThis

/**
 * Create modal to update PNG resolution for export
 * @param {*} new_data
 * @return {*}
 */
export const modalResolutionPNG: FType_ModalResolutionPNG = (
  new_data
) => {
  const { t } = new_data
  const [h, set_h] = useState<number>()
  const [v, set_v] = useState<number>()
  const valid_input = (h === undefined && v === undefined) || (v !== undefined && h !== undefined && !isNaN(+v) && !isNaN(+h))
  new_data.menu_configuration.dict_setter_show_dialog.ref_setter_png_saver_res_h.current = set_h
  new_data.menu_configuration.dict_setter_show_dialog.ref_setter_png_saver_res_v.current = set_v
  const content = <>
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Menu.larg')}
      </Box>
      <InputGroup
        variant='menuconfigpanel_option_input'
      >
        <NumberInput
          variant='menuconfigpanel_option_numberinput'
          allowMouseWheel
          min={0}
          step={1}
          value={h}
          onChange={(_, val) => {
            if (!isNaN(val)) {
              set_h(val)
            }
          }}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </InputGroup>
    </Box>

    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Menu.haut')}
      </Box>
      <InputGroup
        variant='menuconfigpanel_option_input'
      >
        <NumberInput
          variant='menuconfigpanel_option_numberinput'
          allowMouseWheel
          min={0}
          step={1}
          value={v}
          onChange={(_, val) => {
            if (!isNaN(val)) {
              set_v(val)
            }
          }}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </InputGroup>
    </Box>

    <Button
      disabled={!valid_input}
      onClick={() => {
        new_data.sendWaitingToast(
          () => {
            clickSavePNG(h, v, new_data)
          },
          {
            success: {
              title: new_data.t('toast.save_as_png.success.title')
            },
            loading: {
              title: new_data.t('toast.save_as_png.loading.title')
            },
            error: {
              title: new_data.t('toast.save_as_png.error.title')
            }
          })
      }}
    >
      Save
    </Button>
  </>

  return <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_png_saver'}
    content={content}
    title={t('Menu.setResolutionPNG')} />
}

/**
 * Save sankey as PNG
 *
 * @param {(number | undefined)} h
 * @param {(number | undefined)} v
 * @param {Class_ApplicationData} new_data
 */
const clickSavePNG = (
  h: number | undefined,
  v: number | undefined,
  new_data: Class_ApplicationData
) => {
  const svg = new_data.pre_process_export_svg()
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const form_data = new FormData()
  form_data.append('html', blob)
  let size_to_send = ''
  const legend_w = !new_data.drawing_area.legend.masked ? new_data.drawing_area.legend.width : 0

  if (h !== undefined && v !== undefined) {
    size_to_send = parseInt(String(h + legend_w)) + ' ' + parseInt(String(v))
  }

  form_data.append('size', size_to_send)

  post_process_export_svg()

  const path = window.location.origin
  let url = path + '/opensankey/save/png'
  const fetchData = {
    method: 'POST',
    body: form_data
  }

  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: 'application/png' })
    FileSaver.saveAs(newBlob, new_data.file_name+'.png')
  }

  const cleanFile = () => {
    const fetchData = {
      method: 'POST'
    }
    url = path + '/opensankey/save/png/post_clean'
    fetch(url, fetchData)
  }

  fetch(url, fetchData).then(
    r => r.blob()
  )
    .then(showFile).then(cleanFile)
}

/**
 * Save sankey as PDF
 *
 * @param {Class_ApplicationData} new_data
 */
export const clickSavePDF = (new_data: Class_ApplicationData) => {
  const svg = new_data.pre_process_export_svg()
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const form_data = new FormData()
  form_data.append('html', blob)
  form_data.append('width', new_data.drawing_area.width.toString())
  form_data.append('height', new_data.drawing_area.height.toString())

  post_process_export_svg()

  const path = window.location.origin
  let url = path + '/opensankey/save/pdf'
  const fetchData = {
    method: 'POST',
    body: form_data
  }

  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: 'application/pdf' })
    FileSaver.saveAs(newBlob, new_data.file_name+'.pdf')
  }

  const cleanFile = () => {
    const fetchData = {
      method: 'POST'
    }
    url = path + '/opensankey/save/pdf/post_clean'
    fetch(url, fetchData)
  }

  fetch(url, fetchData).then(
    r => r.blob()
  )
    .then(showFile)
    .then(cleanFile)
}

/**
 * Post process svg obtained from d3
 */
const post_process_export_svg = () => {
  d3.select(' .opensankey#svg-container svg').select('#grid').style('opacity', '1')
  d3.select(' .opensankey#svg-container svg').style('border', '2px')
}

