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
import { PDFDocument } from 'pdf-lib'

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
          () => clickSavePNG(h, v, dpi, app_data),
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
          () => clickSavePDF(app_data, dpi),
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
  // Convert foreignObjects (rich-text Quill HTML) into native SVG <text> so the
  // standalone SVG renders without external CSS — same conversion as the PNG/PDF
  // pipeline.
  const svg = app_data.pre_process_export_svg(true)
  const blob = new Blob([svg], { type: 'image/svg+xml' })

  FileSaver.saveAs(blob, 'sankey_diagram.svg')

  post_process_export_svg()
}

/**
 * Rasterize a standalone SVG string to a PNG blob, entirely client-side.
 *
 * The export SVG produced by `pre_process_export_svg(true)` is self-contained
 * (foreignObjects already converted to native <text>, images inlined as data
 * URIs), so the browser renders it pixel-identically to the saved .svg — same
 * font metrics, same text-box sizes, no body margin, no smart-shrinking. This
 * replaces the previous server round-trip through wkhtmltoimage, which re-rendered
 * the SVG in a different webkit engine and introduced gray borders, a left crop
 * and undersized label backgrounds.
 *
 * A viewBox equal to the SVG's intrinsic size is injected and the root
 * width/height are overridden to the target pixel size, so the SVG rasterizes
 * crisply at full resolution instead of being scaled up from a smaller bitmap.
 */
export const rasterizeSVGToPNGBlob = (
  svg_string: string,
  target_w: number,
  target_h: number
): Promise<Blob> => {
  // Inject viewBox + override root dimensions on the opening <svg> tag only
  // (root attrs use single quotes; element attrs in the body use double quotes,
  // so these regexes never touch the content).
  const header_end = svg_string.indexOf('>')
  let prepared = svg_string
  if (header_end >= 0) {
    let header = svg_string.slice(0, header_end)
    const body = svg_string.slice(header_end)
    const src_w = parseFloat(header.match(/width='([\d.]+)'/)?.[1] ?? String(target_w))
    const src_h = parseFloat(header.match(/height='([\d.]+)'/)?.[1] ?? String(target_h))
    header = header
      .replace(/width='[\d.]+'/, `width='${target_w}'`)
      .replace(/height='[\d.]+'/, `height='${target_h}'`)
    if (!/viewBox=/.test(header)) header += ` viewBox='0 0 ${src_w} ${src_h}'`
    prepared = header + body
  }

  return new Promise<Blob>((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([prepared], { type: 'image/svg+xml;charset=utf-8' }))
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(target_w))
      canvas.height = Math.max(1, Math.round(target_h))
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('No 2D context for PNG export'))
        return
      }
      // Flatten on white so the PNG isn't transparent in the padding around the
      // drawing-area background rect.
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob((png) => {
        if (png) resolve(png)
        else reject(new Error('canvas.toBlob returned null'))
      }, 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('SVG image failed to load for PNG export'))
    }
    img.src = url
  })
}

/**
 * Save sankey as PNG (client-side rasterization, faithful to the SVG export).
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
  const svg = app_data.pre_process_export_svg(true)
  post_process_export_svg()

  const legend_w = !app_data.drawing_area.legend.masked ? app_data.drawing_area.legend.width : 0

  // Intrinsic SVG size (used as the default 1:1 target when no explicit size is set)
  const src_w = parseFloat(svg.match(/width='([\d.]+)'/)?.[1] ?? '0')
  const src_h = parseFloat(svg.match(/height='([\d.]+)'/)?.[1] ?? '0')

  let target_w = src_w
  let target_h = src_h
  if (app_data.drawing_area.is_paper_mode) {
    // Paper mode: compute raster size from paper dimensions and DPI
    const dims = app_data.drawing_area.getPaperDimensionsMm()
    target_w = Math.round(dims.width / 25.4 * dpi)
    target_h = Math.round(dims.height / 25.4 * dpi)
  } else if (h !== undefined && v !== undefined) {
    target_w = Math.round(h + legend_w)
    target_h = Math.round(v)
  }

  return rasterizeSVGToPNGBlob(svg, target_w, target_h)
    .then((png) => FileSaver.saveAs(png, app_data.file_name + '.png'))
}

/**
 * Wrap a client-rasterized PNG of the SVG into a single-page PDF (pdf-lib).
 *
 * The PDF is a high-resolution raster of the export SVG, so it's pixel-faithful
 * to the .svg / .png exports — no wkhtmltopdf re-render, no server round-trip.
 * The page is sized in points and the raster supersampled to `dpi`; page aspect
 * equals the SVG aspect, so the image fills the page without distortion.
 */
export const rasterizeSVGToPDFBlob = async (
  svg_string: string,
  page_w_pt: number,
  page_h_pt: number,
  raster_w: number,
  raster_h: number
): Promise<Blob> => {
  const png = await rasterizeSVGToPNGBlob(svg_string, raster_w, raster_h)
  const png_bytes = new Uint8Array(await png.arrayBuffer())
  const pdf = await PDFDocument.create()
  const image = await pdf.embedPng(png_bytes)
  const page = pdf.addPage([page_w_pt, page_h_pt])
  page.drawImage(image, { x: 0, y: 0, width: page_w_pt, height: page_h_pt })
  const out = await pdf.save()
  // Re-wrap so the BlobPart buffer type is a plain ArrayBuffer (strict tsc).
  return new Blob([new Uint8Array(out)], { type: 'application/pdf' })
}

/**
 * Save sankey as PDF (client-side high-resolution raster, faithful to the SVG).
 *
 * @param {Class_ApplicationData} app_data
 */
export const clickSavePDF = (app_data: Class_ApplicationData, dpi: Type_ExportDPI = default_export_dpi) => {
  const svg = app_data.pre_process_export_svg(true)
  post_process_export_svg()

  // The export SVG width/height already include the legend and the padding.
  const src_w = parseFloat(svg.match(/width='([\d.]+)'/)?.[1] ?? '0')
  const src_h = parseFloat(svg.match(/height='([\d.]+)'/)?.[1] ?? '0')

  // Source pixels-per-inch: in paper mode the drawing-area px map to physical mm
  // (Class_DrawingArea.mmToPx); in free mode treat them as CSS px at 96 dpi.
  const px_per_inch = app_data.drawing_area.is_paper_mode
    ? Class_DrawingArea.mmToPx(1) * 25.4
    : 96

  const page_w_pt = src_w / px_per_inch * 72
  const page_h_pt = src_h / px_per_inch * 72
  const raster_w = Math.round(src_w / px_per_inch * dpi)
  const raster_h = Math.round(src_h / px_per_inch * dpi)

  return rasterizeSVGToPDFBlob(svg, page_w_pt, page_h_pt, raster_w, raster_h)
    .then((pdf) => FileSaver.saveAs(pdf, app_data.file_name + '.pdf'))
}

/**
 * Post process svg obtained from d3
 */
const post_process_export_svg = () => {
  d3.select(' .opensankey#svg-container svg').select('#grid').style('opacity', '1')
  d3.select(' .opensankey#svg-container svg').style('border', '2px')
}

