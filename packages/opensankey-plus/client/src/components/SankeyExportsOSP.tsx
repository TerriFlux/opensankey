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

import FileSaver from 'file-saver'
import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import JSZip from 'jszip'
import { PDFDocument } from 'pdf-lib'

import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { Class_DrawingArea } from '../deps/OpenSankey/types/DrawingArea'
import { Class_DataTagGroup } from '../deps/OpenSankey/types/TagGroup'
import { default_main_sankey_id } from '../deps/OpenSankey/types/Utils'
import { default_export_dpi, Type_ExportDPI } from '../deps/OpenSankey/Elements/ElementsAttributesConfig'

// ===========================================================================
// Helpers
// ===========================================================================

const waitForNextFrame = () => new Promise<void>((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
})

const sanitizeFileName = (name: string): string =>
  (name || 'view').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120)

const getViewLabel = (app_data: Class_ApplicationDataOSP, view_id: string): string => {
  if (view_id === default_main_sankey_id) return 'master'
  return app_data.views_dict[view_id]?.name ?? view_id
}

// Build the form body used by /opensankey/save/png — same contract as clickSavePNG in OS
const buildPNGFormData = (app_data: Class_ApplicationDataOSP, dpi: Type_ExportDPI): FormData => {
  const svg = app_data.pre_process_export_svg(true)
  const form_data = new FormData()
  form_data.append('html', new Blob([svg], { type: 'image/svg+xml' }))
  const legend_w = !app_data.drawing_area.legend.masked ? app_data.drawing_area.legend.width : 0
  let size_to_send = ''
  if (app_data.drawing_area.is_paper_mode) {
    const dims = app_data.drawing_area.getPaperDimensionsMm()
    const w_px = Math.round(dims.width / 25.4 * dpi)
    const h_px = Math.round(dims.height / 25.4 * dpi)
    size_to_send = w_px + ' ' + h_px
  } else {
    const w = Math.round(app_data.drawing_area.width) + legend_w
    const h = Math.round(app_data.drawing_area.height)
    size_to_send = w + ' ' + h
  }
  form_data.append('size', size_to_send)
  return form_data
}

// Build the form body used by /opensankey/save/pdf — same contract as clickSavePDF in OS
const buildPDFFormData = (app_data: Class_ApplicationDataOSP, dpi: Type_ExportDPI): FormData => {
  const svg = app_data.pre_process_export_svg(true)
  const form_data = new FormData()
  form_data.append('html', new Blob([svg], { type: 'image/svg+xml' }))
  form_data.append('dpi', String(dpi))
  if (app_data.drawing_area.is_paper_mode) {
    const dims = app_data.drawing_area.getPaperDimensionsMm()
    form_data.append('paper_format', app_data.drawing_area.paper_format)
    form_data.append('paper_orientation', app_data.drawing_area.paper_orientation)
    form_data.append('margin_top', app_data.drawing_area.margin_top_mm + 'mm')
    form_data.append('margin_right', app_data.drawing_area.margin_right_mm + 'mm')
    form_data.append('margin_bottom', app_data.drawing_area.margin_bottom_mm + 'mm')
    form_data.append('margin_left', app_data.drawing_area.margin_left_mm + 'mm')
    form_data.append('width', Class_DrawingArea.mmToPx(dims.width).toString())
    form_data.append('height', Class_DrawingArea.mmToPx(dims.height).toString())
  } else {
    form_data.append('width', app_data.drawing_area.width.toString())
    form_data.append('height', app_data.drawing_area.height.toString())
  }
  return form_data
}

// ===========================================================================
// Iterate all views, switch to each, capture, run callback. Restores original view.
// ===========================================================================

/**
 * Iterate over a list of views. For each view, switch the active drawing area,
 * wait a frame for D3 to commit the redraw, then call captureFn(view_id, label).
 * The indicator `ref_to_save_in_cache_indicator_value` is forced true during the
 * loop so switching doesn't trigger the "unsaved view" modal.
 *
 * Defaults to `[master, ...views_order]` (used by PNG zip / PDF merge). Pass an
 * explicit `view_ids` to filter or reorder (animated GIF excludes master).
 */
const iterateAllViews = async <T,>(
  app_data: Class_ApplicationDataOSP,
  captureFn: (view_id: string, label: string) => Promise<T>,
  view_ids?: string[]
): Promise<Array<{ view_id: string; label: string; payload: T }>> => {
  const original_view_id = app_data.drawing_area.sankey.id
  const indicator_ref = app_data.menu_configuration.ref_to_save_in_cache_indicator_value
  const original_indicator = indicator_ref.current
  indicator_ref.current = true

  const ids_to_iterate = view_ids ?? [default_main_sankey_id, ...app_data.views_order]
  const results: Array<{ view_id: string; label: string; payload: T }> = []
  try {
    for (const view_id of ids_to_iterate) {
      app_data.setCurrentView(view_id)
      await waitForNextFrame()
      const label = getViewLabel(app_data, view_id)
      const payload = await captureFn(view_id, label)
      results.push({ view_id, label, payload })
    }
  } finally {
    app_data.setCurrentView(original_view_id)
    indicator_ref.current = original_indicator
  }
  return results
}

// ===========================================================================
// Public entry points
// ===========================================================================

/**
 * Export every view (master included) as a PNG and package them into a single .zip.
 * Uses the existing /opensankey/save/png endpoint once per view.
 */
export const exportAllViewsAsPNGZip = async (
  app_data: Class_ApplicationDataOSP,
  dpi: Type_ExportDPI = default_export_dpi
): Promise<void> => {
  const endpoint = window.location.origin + '/opensankey/save/png'
  const zip = new JSZip()
  const used_names = new Set<string>()

  const results = await iterateAllViews(app_data, async (_view_id, label) => {
    const form_data = buildPNGFormData(app_data, dpi)
    const response = await fetch(endpoint, { method: 'POST', body: form_data })
    const blob = await response.blob()
    // Best-effort backend cleanup, same as clickSavePNG
    fetch(window.location.origin + '/opensankey/save/png/post_clean', { method: 'POST' }).catch(() => undefined)
    return blob
  })

  results.forEach(({ label, payload }) => {
    let file_name = sanitizeFileName(label) + '.png'
    let dedup = 2
    while (used_names.has(file_name)) {
      file_name = sanitizeFileName(label) + '_' + dedup + '.png'
      dedup += 1
    }
    used_names.add(file_name)
    zip.file(file_name, payload)
  })

  const zip_blob = await zip.generateAsync({ type: 'blob' })
  FileSaver.saveAs(zip_blob, sanitizeFileName(app_data.file_name) + '_all_views.zip')
}

/**
 * Export every view (master included) as PDF pages concatenated into a single PDF.
 * Calls /opensankey/save/pdf once per view, then merges client-side with pdf-lib.
 */
export const exportAllViewsAsPDFMerged = async (
  app_data: Class_ApplicationDataOSP,
  dpi: Type_ExportDPI = default_export_dpi
): Promise<void> => {
  const endpoint = window.location.origin + '/opensankey/save/pdf'

  const results = await iterateAllViews(app_data, async () => {
    const form_data = buildPDFFormData(app_data, dpi)
    const response = await fetch(endpoint, { method: 'POST', body: form_data })
    const buf = await response.arrayBuffer()
    fetch(window.location.origin + '/opensankey/save/pdf/post_clean', { method: 'POST' }).catch(() => undefined)
    return buf
  })

  const merged = await PDFDocument.create()
  for (const { payload } of results) {
    const src = await PDFDocument.load(payload)
    const pages = await merged.copyPages(src, src.getPageIndices())
    pages.forEach((p) => merged.addPage(p))
  }
  const merged_bytes = await merged.save()
  const merged_blob = new Blob([new Uint8Array(merged_bytes)], { type: 'application/pdf' })
  FileSaver.saveAs(merged_blob, sanitizeFileName(app_data.file_name) + '_all_views.pdf')
}

// ===========================================================================
// Animated sequence export (GIF / WebM / PNG zip with reordering)
// ===========================================================================

export type AnimExportFormat = 'gif' | 'webm' | 'png_zip'
export type AnimExportLoopMode = 'once' | 'loop' | 'pingpong'

export interface AnimExportOpts {
  format: AnimExportFormat
  delay_ms: number        // per-frame duration (1500 = 1.5s/frame)
  dpi: Type_ExportDPI
  loop_mode: AnimExportLoopMode
}

// Expand the user-ordered list according to loop mode. Pingpong appends the
// reverse of interior frames so the animation bounces back (V1,V2,V3 -> V1,V2,V3,V2).
const buildSequence = (view_ids: string[], loop_mode: AnimExportLoopMode): string[] => {
  if (loop_mode === 'pingpong' && view_ids.length > 2) {
    return [...view_ids, ...view_ids.slice(1, -1).reverse()]
  }
  return view_ids
}

// Capture each unique view once via the server PNG endpoint. Returns blobs keyed
// by view_id so a sequence with repeats (pingpong) doesn't re-render needlessly.
const captureSelectedViewsAsPNG = async (
  app_data: Class_ApplicationDataOSP,
  unique_view_ids: string[],
  dpi: Type_ExportDPI
): Promise<Map<string, { label: string; blob: Blob }>> => {
  const endpoint = window.location.origin + '/opensankey/save/png'
  const results = await iterateAllViews(app_data, async () => {
    const form_data = buildPNGFormData(app_data, dpi)
    const response = await fetch(endpoint, { method: 'POST', body: form_data })
    const blob = await response.blob()
    fetch(window.location.origin + '/opensankey/save/png/post_clean', { method: 'POST' }).catch(() => undefined)
    return blob
  }, unique_view_ids)
  const map = new Map<string, { label: string; blob: Blob }>()
  results.forEach(({ view_id, label, payload }) => map.set(view_id, { label, blob: payload }))
  return map
}

// Decode a PNG blob to ImageData via canvas, flattening transparency on white.
const decodePNGToImageData = async (blob: Blob): Promise<ImageData> => {
  const bitmap = await createImageBitmap(blob)
  const c = document.createElement('canvas')
  c.width = bitmap.width
  c.height = bitmap.height
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('No 2D context for frame decode')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, bitmap.width, bitmap.height)
  ctx.drawImage(bitmap, 0, 0)
  const image_data = ctx.getImageData(0, 0, bitmap.width, bitmap.height)
  bitmap.close?.()
  return image_data
}

const encodeAnimatedGIF = async (
  ordered_blobs: Blob[],
  opts: AnimExportOpts
): Promise<Blob> => {
  const gif = GIFEncoder()
  // gifenc: repeat=0 => infinite loop, repeat=-1 => play once. Set on first frame only.
  const repeat = opts.loop_mode === 'once' ? -1 : 0
  for (let i = 0; i < ordered_blobs.length; i++) {
    const image_data = await decodePNGToImageData(ordered_blobs[i])
    const palette = quantize(image_data.data, 256)
    const indexed = applyPalette(image_data.data, palette)
    gif.writeFrame(indexed, image_data.width, image_data.height, {
      palette,
      delay: opts.delay_ms,
      ...(i === 0 ? { repeat } : {})
    })
  }
  gif.finish()
  // Re-wrap in a fresh Uint8Array so the buffer type is ArrayBuffer (not the
  // generic ArrayBufferLike, which includes SharedArrayBuffer and is rejected
  // by the strict BlobPart signature in production tsc). Same pattern as the
  // PDF merge above.
  return new Blob([new Uint8Array(gif.bytes())], { type: 'image/gif' })
}

const encodeAnimatedWebM = async (
  ordered_blobs: Blob[],
  opts: AnimExportOpts
): Promise<Blob> => {
  if (ordered_blobs.length === 0) throw new Error('No frames to encode')
  // Decode first frame to size the canvas.
  const first = await createImageBitmap(ordered_blobs[0])
  const canvas = document.createElement('canvas')
  canvas.width = first.width
  canvas.height = first.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No 2D context for WebM canvas')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(first, 0, 0)
  first.close?.()

  // Real-time recording: capture the canvas at a sampling rate well above the frame rate.
  const fps = Math.max(1, Math.round(1000 / opts.delay_ms) * 4)
  const stream = (canvas as HTMLCanvasElement).captureStream(fps)
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'
  const recorder = new MediaRecorder(stream, { mimeType: mime })
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
  const stopped = new Promise<void>((resolve) => { recorder.onstop = () => resolve() })
  recorder.start()

  // First frame already drawn; hold it for delay_ms before drawing the next.
  await new Promise((r) => setTimeout(r, opts.delay_ms))
  for (let i = 1; i < ordered_blobs.length; i++) {
    const bitmap = await createImageBitmap(ordered_blobs[i])
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close?.()
    await new Promise((r) => setTimeout(r, opts.delay_ms))
  }
  recorder.stop()
  await stopped
  return new Blob(chunks, { type: mime })
}

const packageSelectedViewsAsZip = async (
  ordered_entries: Array<{ view_id: string; label: string; blob: Blob }>
): Promise<Blob> => {
  const zip = new JSZip()
  const used_names = new Set<string>()
  ordered_entries.forEach(({ label, blob }, idx) => {
    // Prefix with frame index to preserve order in the zip listing.
    const prefix = String(idx + 1).padStart(3, '0')
    let file_name = prefix + '_' + sanitizeFileName(label) + '.png'
    let dedup = 2
    while (used_names.has(file_name)) {
      file_name = prefix + '_' + sanitizeFileName(label) + '_' + dedup + '.png'
      dedup += 1
    }
    used_names.add(file_name)
    zip.file(file_name, blob)
  })
  return zip.generateAsync({ type: 'blob' })
}

// Shared tail for every animated export source: expand the captured frames per
// loop mode, encode according to format, and save. `captures_by_id` maps each
// unique id (view or tag) to its label + PNG blob; `ordered_ids` is the user's
// ordered selection (repeats allowed — pingpong is handled by buildSequence).
const finalizeAnimatedExport = async (
  app_data: Class_ApplicationDataOSP,
  ordered_ids: string[],
  captures_by_id: Map<string, { label: string; blob: Blob }>,
  opts: AnimExportOpts
): Promise<void> => {
  const sequence = buildSequence(ordered_ids, opts.loop_mode)
  const ordered_entries = sequence.map((id) => {
    const entry = captures_by_id.get(id)
    if (!entry) throw new Error('Missing capture for ' + id)
    return { view_id: id, label: entry.label, blob: entry.blob }
  })
  const ordered_blobs = ordered_entries.map((e) => e.blob)

  const file_base = sanitizeFileName(app_data.file_name) + '_animation'
  let blob: Blob
  let extension: string
  switch (opts.format) {
    case 'gif':
      blob = await encodeAnimatedGIF(ordered_blobs, opts)
      extension = '.gif'
      break
    case 'webm':
      blob = await encodeAnimatedWebM(ordered_blobs, opts)
      extension = '.webm'
      break
    case 'png_zip':
      blob = await packageSelectedViewsAsZip(ordered_entries)
      extension = '.zip'
      break
  }
  FileSaver.saveAs(blob, file_base + extension)
}

/**
 * Animated export with the views as source. Captures each selected view once via
 * the server PNG endpoint, then expands and encodes according to format & loop mode.
 *
 * Assumes all selected views share the same export dimensions. gifenc &
 * MediaRecorder both require constant frame size.
 */
export const exportAnimatedSequence = async (
  app_data: Class_ApplicationDataOSP,
  view_ids: string[],
  opts: AnimExportOpts
): Promise<void> => {
  if (view_ids.length === 0) throw new Error('No views selected')
  const captures_by_id = await captureSelectedViewsAsPNG(app_data, view_ids, opts.dpi)
  await finalizeAnimatedExport(app_data, view_ids, captures_by_id, opts)
}

// Capture each selected tag of a sequence data-tag group once. Selecting a tag
// redraws the whole sankey (Class_DataTagGroup.selectTagsFromIds -> updateTagsReferences
// -> drawing_area.draw()). We use selectTagsFromIds (not selectTagsFromId) on purpose:
// it skips the undo/redo bookkeeping, so the capture loop leaves the history untouched.
// The original selection is restored in the finally block.
const captureSequenceTagsAsPNG = async (
  app_data: Class_ApplicationDataOSP,
  tagg: Class_DataTagGroup,
  tag_ids: string[],
  dpi: Type_ExportDPI
): Promise<Map<string, { label: string; blob: Blob }>> => {
  const endpoint = window.location.origin + '/opensankey/save/png'
  const tags_by_id = new Map(tagg.tags_list.map((t) => [t.id, t]))
  const original_selected_ids = tagg.selected_tags_list.map((t) => t.id)
  const map = new Map<string, { label: string; blob: Blob }>()
  try {
    // Capture each unique tag once (pingpong repeats are expanded later by buildSequence).
    for (const tag_id of [...new Set(tag_ids)]) {
      const tag = tags_by_id.get(tag_id)
      if (!tag) continue
      tagg.selectTagsFromIds([tag_id])
      await waitForNextFrame()
      const form_data = buildPNGFormData(app_data, dpi)
      const response = await fetch(endpoint, { method: 'POST', body: form_data })
      const blob = await response.blob()
      fetch(window.location.origin + '/opensankey/save/png/post_clean', { method: 'POST' }).catch(() => undefined)
      map.set(tag_id, { label: tag.name, blob })
    }
  } finally {
    if (original_selected_ids.length > 0) {
      tagg.selectTagsFromIds(original_selected_ids)
      await waitForNextFrame()
    }
  }
  return map
}

/**
 * Animated export with a sequence-type data-tag group as source: each frame is
 * the sankey with one tag of the group selected. Mirrors exportAnimatedSequence
 * but iterates the group's tags instead of the views.
 */
export const exportAnimatedDataTagSequence = async (
  app_data: Class_ApplicationDataOSP,
  group_id: string,
  tag_ids: string[],
  opts: AnimExportOpts
): Promise<void> => {
  if (tag_ids.length === 0) throw new Error('No tags selected')
  const tagg = app_data.drawing_area.sankey.getTagGroupsAsDict('data_taggs')[group_id] as Class_DataTagGroup | undefined
  if (!tagg) throw new Error('Sequence group not found: ' + group_id)
  const captures_by_id = await captureSequenceTagsAsPNG(app_data, tagg, tag_ids, opts.dpi)
  await finalizeAnimatedExport(app_data, tag_ids, captures_by_id, opts)
}

// ===========================================================================
// Register extra menu items on the OS export dropdown
// ===========================================================================

export const registerExtraExportMenuItems = (app_data: Class_ApplicationDataOSP): void => {
  const mc = app_data.menu_configuration
  // All multi-view exports (PNG/PDF/GIF) are OpenSankey+ features. SVG stays free in MenuTop.
  const disabled_guard = () => !app_data.has_sankey_plus || !app_data.has_views || app_data.views_order.length === 0
  // Empty string => no tooltip wrapper (entry is enabled and self-explanatory).
  const tooltip_guard = () => {
    if (!app_data.has_sankey_plus) return app_data.t('Menu.sankeyOSPDisabled')
    if (!app_data.has_views || app_data.views_order.length === 0) return 'Aucune vue à exporter'
    return ''
  }
  // Animation can also iterate a sequence data-tag group, so it stays enabled
  // when there are no views but at least one 'sequence'-banner data-tag group.
  const has_sequence_groups = () => app_data.drawing_area.sankey
    .getTagGroupsAsList('data_taggs')
    .some((g) => (g as Class_DataTagGroup).banner === 'sequence')
  const no_animatable_source = () =>
    (!app_data.has_views || app_data.views_order.length === 0) && !has_sequence_groups()
  const animated_disabled = () => !app_data.has_sankey_plus || no_animatable_source()
  const animated_tooltip = () => {
    if (!app_data.has_sankey_plus) return app_data.t('Menu.sankeyOSPDisabled')
    if (no_animatable_source()) return 'Aucune vue ni séquence à exporter'
    return ''
  }
  mc.extra_export_menu_items = [
    {
      type: 'group',
      key: 'all_views_group',
      label: 'Toutes les vues',
      children: [
        {
          key: 'all_views_png',
          label: 'PNG',
          disabled: disabled_guard,
          tooltip: tooltip_guard,
          onClick: () => {
            app_data.sendWaitingToast(
              () => exportAllViewsAsPNGZip(app_data),
              {
                success: { title: app_data.t('toast.save_as_png.success.title') },
                loading: { title: app_data.t('toast.save_as_png.loading.title') },
                error: { title: app_data.t('toast.save_as_png.error.title') }
              }
            )
          }
        },
        {
          key: 'all_views_pdf',
          label: 'PDF',
          disabled: disabled_guard,
          tooltip: tooltip_guard,
          onClick: () => {
            app_data.sendWaitingToast(
              () => exportAllViewsAsPDFMerged(app_data),
              {
                success: { title: app_data.t('toast.save_as_pdf.success.title') },
                loading: { title: app_data.t('toast.save_as_pdf.loading.title') },
                error: { title: app_data.t('toast.save_as_pdf.error.title') }
              }
            )
          }
        },
        {
          key: 'all_views_animated',
          label: 'Animation...',
          disabled: animated_disabled,
          tooltip: animated_tooltip,
          onClick: () => {
            app_data.menu_configuration_osp.ref_show_modal_animated_export.current(true)
          }
        }
      ]
    }
  ]
}
