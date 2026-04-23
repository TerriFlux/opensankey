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
  Button,
  Select
} from '@chakra-ui/react'
import FileSaver from 'file-saver'

// Local libs
import * as d3 from 'd3'
import { MenuDraggable } from './SankeyMenus'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_DrawingArea } from '../../types/DrawingArea'
import { PAPER_DIMENSIONS_MM, Type_PaperFormat, Type_ExportDPI, default_export_dpi } from '../../Elements/ElementsAttributesConfig'

type FType_ModalResolutionPNG = (
  app_data: Class_ApplicationData
) => JSX.Element

type FType_ModalResolutionPDF = (
  app_data: Class_ApplicationData
) => JSX.Element

// COMPONENTS ===========================================================================

export declare const window: Window & typeof globalThis

/**
 * Create modal to update PNG resolution for export
 * @param {*} app_data
 * @return {*}
 */
/** Compute PNG pixel dimensions for a paper format at a given DPI */
const paperFormatToPixels = (
  format: Exclude<Type_PaperFormat, 'free'>,
  orientation: 'landscape' | 'portrait',
  dpi: number
): { w: number; h: number } => {
  const base = PAPER_DIMENSIONS_MM[format]
  const w_mm = orientation === 'landscape' ? Math.max(base.width, base.height) : Math.min(base.width, base.height)
  const h_mm = orientation === 'landscape' ? Math.min(base.width, base.height) : Math.max(base.width, base.height)
  return {
    w: Math.round(w_mm / 25.4 * dpi),
    h: Math.round(h_mm / 25.4 * dpi)
  }
}

export const modalResolutionPNG: FType_ModalResolutionPNG = (
  app_data
) => {
  const { t } = app_data

  // Pre-select format if drawing area is in paper mode
  const initial_preset = app_data.drawing_area.is_paper_mode ? app_data.drawing_area.paper_format : 'custom'
  const [preset, set_preset] = useState<string>(initial_preset)
  const [dpi, set_dpi] = useState<Type_ExportDPI>(default_export_dpi)

  // Compute initial h/v from paper mode if active
  const initial_dims = app_data.drawing_area.is_paper_mode
    ? paperFormatToPixels(
      app_data.drawing_area.paper_format as Exclude<Type_PaperFormat, 'free'>,
      app_data.drawing_area.paper_orientation,
      default_export_dpi
    )
    : undefined

  const [h, set_h] = useState<number | undefined>(initial_dims?.w)
  const [v, set_v] = useState<number | undefined>(initial_dims?.h)

  const valid_input = (h === undefined && v === undefined) || (v !== undefined && h !== undefined && !isNaN(+v) && !isNaN(+h))
  app_data.menu_configuration.dict_setter_show_dialog.ref_setter_png_saver_res_h.current = set_h
  app_data.menu_configuration.dict_setter_show_dialog.ref_setter_png_saver_res_v.current = set_v

  const recomputeDims = (next_preset: string, next_dpi: Type_ExportDPI) => {
    if (next_preset !== 'custom') {
      const orientation = app_data.drawing_area.is_paper_mode
        ? app_data.drawing_area.paper_orientation
        : 'landscape'
      const dims = paperFormatToPixels(next_preset as Exclude<Type_PaperFormat, 'free'>, orientation, next_dpi)
      set_h(dims.w)
      set_v(dims.h)
    }
  }

  const onPresetChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    const val = evt.target.value
    set_preset(val)
    if (val !== 'custom') {
      recomputeDims(val, dpi)
    } else {
      set_h(undefined)
      set_v(undefined)
    }
  }

  const onDpiChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(evt.target.value) as Type_ExportDPI
    set_dpi(val)
    recomputeDims(preset, val)
  }

  const content = <>
    {/* Paper format preset selector */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('MEP.PaperFormat')}
      </Box>
      <Select
        variant='menuconfigpanel_option_select'
        value={preset}
        onChange={onPresetChange}
      >
        <option value='custom'>{t('MEP.PaperFree')}</option>
        <option value='A3'>A3</option>
        <option value='A4'>A4</option>
        <option value='A5'>A5</option>
      </Select>
    </Box>

    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('MEP.ExportDPI')}
      </Box>
      <Select
        variant='menuconfigpanel_option_select'
        value={dpi}
        onChange={onDpiChange}
      >
        <option value={150}>150 DPI</option>
        <option value={300}>300 DPI</option>
      </Select>
    </Box>

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
              set_preset('custom')
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
              set_preset('custom')
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
        app_data.sendWaitingToast(
          () => {
            clickSavePNG(h, v, dpi, app_data)
          },
          {
            success: {
              title: app_data.t('toast.save_as_png.success.title')
            },
            loading: {
              title: app_data.t('toast.save_as_png.loading.title')
            },
            error: {
              title: app_data.t('toast.save_as_png.error.title')
            }
          })
      }}
    >
      Save
    </Button>
  </>

  return <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={app_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_png_saver'}
    content={content}
    title={t('Menu.setResolutionPNG')} />
}

export const modalResolutionPDF: FType_ModalResolutionPDF = (
  app_data
) => {
  const { t } = app_data
  const [dpi, set_dpi] = useState<Type_ExportDPI>(default_export_dpi)

  const onDpiChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    set_dpi(Number(evt.target.value) as Type_ExportDPI)
  }

  const content = <>
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('MEP.ExportDPI')}
      </Box>
      <Select
        variant='menuconfigpanel_option_select'
        value={dpi}
        onChange={onDpiChange}
      >
        <option value={150}>150 DPI</option>
        <option value={300}>300 DPI</option>
      </Select>
    </Box>

    <Button
      onClick={() => {
        app_data.sendWaitingToast(
          () => {
            clickSavePDF(app_data, dpi)
          },
          {
            success: {
              title: app_data.t('toast.save_as_pdf.success.title')
            },
            loading: {
              title: app_data.t('toast.save_as_pdf.loading.title')
            },
            error: {
              title: app_data.t('toast.save_as_pdf.error.title')
            }
          })
      }}
    >
      Save
    </Button>
  </>

  return <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={app_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_pdf_saver'}
    content={content}
    title={t('Menu.setResolutionPDF')} />
}

export const clickSaveSVG = (
  app_data: Class_ApplicationData
) => {
  const svg = app_data.pre_process_export_svg(false)
  const blob = new Blob([svg], { type: 'image/svg+xml' })

  // Sauvegarder directement côté client
  FileSaver.saveAs(blob, 'sankey_diagram.svg')

  post_process_export_svg()
}

/**
 * Inject a "réalisé avec OpenSankey.fr" watermark in the bottom-right of the
 * SVG string produced by pre_process_export_svg. No-op when the user has an
 * active OpenSankey+ license (or trial).
 */
const addWatermarkIfNoLicense = (svg: string, app_data: Class_ApplicationData): string => {
  if (app_data.has_sankey_plus) return svg

  const width_match = svg.match(/<svg[^>]*\swidth=['"]([\d.]+)['"]/)
  const height_match = svg.match(/<svg[^>]*\sheight=['"]([\d.]+)['"]/)
  if (!width_match || !height_match) return svg
  const width = parseFloat(width_match[1])
  const height = parseFloat(height_match[1])

  const font_size = Math.max(12, Math.min(width, height) * 0.018)
  const margin = font_size * 0.8
  const watermark =
    `<text x='${width - margin}' y='${height - margin}'` +
    ' text-anchor=\'end\' dominant-baseline=\'alphabetic\'' +
    ` font-family='Arial, Helvetica, sans-serif' font-size='${font_size}'` +
    ' fill=\'#000000\' fill-opacity=\'0.45\'>' +
    'réalisé avec OpenSankey.fr' +
    '</text>'

  return svg.replace(/<\/svg>\s*$/, watermark + '</svg>')
}

/**
 * Save sankey as PNG
 *
 * @param {(number | undefined)} h
 * @param {(number | undefined)} v
 * @param {Class_ApplicationData} app_data
 */
const clickSavePNG = (
  h: number | undefined,
  v: number | undefined,
  dpi: Type_ExportDPI,
  app_data: Class_ApplicationData
) => {
  const svg = addWatermarkIfNoLicense(app_data.pre_process_export_svg(true), app_data)
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const form_data = new FormData()
  form_data.append('html', blob)
  let size_to_send = ''
  const legend_w = !app_data.drawing_area.legend.masked ? app_data.drawing_area.legend.width : 0

  if (app_data.drawing_area.is_paper_mode) {
    // Paper mode: compute raster size from paper dimensions and DPI
    const dims = app_data.drawing_area.getPaperDimensionsMm()
    const w_px = Math.round(dims.width / 25.4 * dpi)
    const h_px = Math.round(dims.height / 25.4 * dpi)
    size_to_send = w_px + ' ' + h_px
  } else if (h !== undefined && v !== undefined) {
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
    FileSaver.saveAs(newBlob, app_data.file_name + '.png')
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
 * @param {Class_ApplicationData} app_data
 */
export const clickSavePDF = (app_data: Class_ApplicationData, dpi: Type_ExportDPI = default_export_dpi) => {
  const svg = addWatermarkIfNoLicense(app_data.pre_process_export_svg(true), app_data)
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const form_data = new FormData()
  form_data.append('html', blob)
  form_data.append('dpi', String(dpi))

  if (app_data.drawing_area.is_paper_mode) {
    const dims = app_data.drawing_area.getPaperDimensionsMm()
    form_data.append('paper_format', app_data.drawing_area.paper_format)
    form_data.append('paper_orientation', app_data.drawing_area.paper_orientation)
    form_data.append('margin_top', app_data.drawing_area.margin_top_mm + 'mm')
    form_data.append('margin_right', app_data.drawing_area.margin_right_mm + 'mm')
    form_data.append('margin_bottom', app_data.drawing_area.margin_bottom_mm + 'mm')
    form_data.append('margin_left', app_data.drawing_area.margin_left_mm + 'mm')
    // Fallback width/height
    form_data.append('width', Class_DrawingArea.mmToPx(dims.width).toString())
    form_data.append('height', Class_DrawingArea.mmToPx(dims.height).toString())
  } else {
    form_data.append('width', app_data.drawing_area.width.toString())
    form_data.append('height', app_data.drawing_area.height.toString())
  }

  post_process_export_svg()

  const path = window.location.origin
  let url = path + '/opensankey/save/pdf'
  const fetchData = {
    method: 'POST',
    body: form_data
  }

  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: 'application/pdf' })
    FileSaver.saveAs(newBlob, app_data.file_name + '.pdf')
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

