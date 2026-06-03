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
import { default_main_sankey_id, Type_JSON } from '../deps/OpenSankey/types/Utils'
import { default_export_dpi, Type_ExportDPI } from '../deps/OpenSankey/Elements/ElementsAttributesConfig'
import { rasterizeSVGToPNGBlob, rasterizeSVGToPDFBlob } from '../deps/OpenSankey/components/topmenus/SankeyExports'

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

// Capture the current view as a PNG blob, rendered client-side (same path as
// clickSavePNG in OS). Replaces the previous /opensankey/save/png round-trip
// through wkhtmltoimage, so multi-view exports (zip / GIF / WebM) are now pixel
// -faithful to the SVG export. Size logic mirrors the former buildPNGFormData.
const captureViewAsPNGBlob = (app_data: Class_ApplicationDataOSP, dpi: Type_ExportDPI): Promise<Blob> => {
  const svg = app_data.pre_process_export_svg(true)
  const legend_w = !app_data.drawing_area.legend.masked ? app_data.drawing_area.legend.width : 0
  let target_w: number, target_h: number
  if (app_data.drawing_area.is_paper_mode) {
    const dims = app_data.drawing_area.getPaperDimensionsMm()
    target_w = Math.round(dims.width / 25.4 * dpi)
    target_h = Math.round(dims.height / 25.4 * dpi)
  } else {
    target_w = Math.round(app_data.drawing_area.width) + legend_w
    target_h = Math.round(app_data.drawing_area.height)
  }
  return rasterizeSVGToPNGBlob(svg, target_w, target_h)
}

// Capture the current view as a single-page PDF blob, rendered client-side (same
// path as clickSavePDF in OS): a high-resolution raster of the SVG embedded via
// pdf-lib. Faithful to the SVG export, mirrors clickSavePDF's page/raster sizing.
const captureViewAsPDFBlob = (app_data: Class_ApplicationDataOSP, dpi: Type_ExportDPI): Promise<Blob> => {
  const svg = app_data.pre_process_export_svg(true)
  // The export SVG width/height already include the legend and padding.
  const src_w = parseFloat(svg.match(/width='([\d.]+)'/)?.[1] ?? '0')
  const src_h = parseFloat(svg.match(/height='([\d.]+)'/)?.[1] ?? '0')
  // Paper mode: drawing-area px map to physical mm; free mode: CSS px at 96 dpi.
  const px_per_inch = app_data.drawing_area.is_paper_mode
    ? Class_DrawingArea.mmToPx(1) * 25.4
    : 96
  const page_w_pt = src_w / px_per_inch * 72
  const page_h_pt = src_h / px_per_inch * 72
  const raster_w = Math.round(src_w / px_per_inch * dpi)
  const raster_h = Math.round(src_h / px_per_inch * dpi)
  return rasterizeSVGToPDFBlob(svg, page_w_pt, page_h_pt, raster_w, raster_h)
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
 * Renders each view client-side (same path as clickSavePNG in OS).
 */
export const exportAllViewsAsPNGZip = async (
  app_data: Class_ApplicationDataOSP,
  dpi: Type_ExportDPI = default_export_dpi
): Promise<void> => {
  const zip = new JSZip()
  const used_names = new Set<string>()

  const results = await iterateAllViews(app_data, async (_view_id, _label) => {
    return captureViewAsPNGBlob(app_data, dpi)
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
 * Renders each view client-side (raster of the SVG), then merges with pdf-lib.
 */
export const exportAllViewsAsPDFMerged = async (
  app_data: Class_ApplicationDataOSP,
  dpi: Type_ExportDPI = default_export_dpi
): Promise<void> => {
  const results = await iterateAllViews(app_data, async () => {
    const blob = await captureViewAsPDFBlob(app_data, dpi)
    return blob.arrayBuffer()
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

/**
 * Export every view (master included) as a standalone JSON, packaged into a
 * single .zip — one .json file per view. Each view is switched in turn (via
 * iterateAllViews) and serialized with ``only_current_view: true`` so the
 * produced file is a self-contained diagram that re-opens on its own. The
 * master view is serialized as the plain base diagram: its embedded ``views`` /
 * ``current_view`` metadata is stripped so the file isn't the whole multi-view
 * bundle. ``output_options`` are the JSON save options from the dialog
 * (with_values, keep_siblings, ...), forwarded verbatim to toJSON.
 */
export const exportAllViewsAsJSONZip = async (
  app_data: Class_ApplicationDataOSP,
  output_options: Type_JSON = {}
): Promise<void> => {
  const zip = new JSZip()
  const used_names = new Set<string>()

  const results = await iterateAllViews(app_data, async (view_id) => {
    const json = app_data.toJSON({ ...output_options, only_current_view: true }) as Type_JSON
    if (view_id === default_main_sankey_id) {
      // Master: drop the embedded views so the file is the master diagram alone,
      // not a duplicate of the full multi-view bundle.
      delete json['views']
      delete json['current_view']
    }
    return JSON.stringify(json)
  })

  results.forEach(({ label, payload }) => {
    let file_name = sanitizeFileName(label) + '.json'
    let dedup = 2
    while (used_names.has(file_name)) {
      file_name = sanitizeFileName(label) + '_' + dedup + '.json'
      dedup += 1
    }
    used_names.add(file_name)
    zip.file(file_name, payload)
  })

  const zip_blob = await zip.generateAsync({ type: 'blob' })
  FileSaver.saveAs(zip_blob, sanitizeFileName(app_data.file_name) + '_all_views_json.zip')
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
  const results = await iterateAllViews(app_data, async () => {
    return captureViewAsPNGBlob(app_data, dpi)
  }, unique_view_ids)
  const map = new Map<string, { label: string; blob: Blob }>()
  results.forEach(({ view_id, label, payload }) => map.set(view_id, { label, blob: payload }))
  return map
}

// Decode every PNG blob to ImageData on a SHARED canvas sized to the largest
// frame, flattening transparency on white and padding smaller frames at the
// top-left. Each captured view/tag is auto-fitted independently, so frames come
// back with different pixel sizes; gifenc fixes the GIF logical-screen size on
// the first frame (and MediaRecorder on the first canvas), which would clip any
// taller/wider later frame at the bottom/right. Normalizing to a common size up
// front guarantees the constant frame size both encoders require — no clipping.
// Content origin is already aligned to the top-left across frames (see the
// g_drawing counter-translate in _pre_process_export_svg), so top-left padding
// keeps every diagram in register.
const decodeFramesToCommonCanvas = async (ordered_blobs: Blob[]): Promise<ImageData[]> => {
  const bitmaps = await Promise.all(ordered_blobs.map((b) => createImageBitmap(b)))
  const max_w = Math.max(...bitmaps.map((b) => b.width))
  const max_h = Math.max(...bitmaps.map((b) => b.height))
  const c = document.createElement('canvas')
  c.width = max_w
  c.height = max_h
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('No 2D context for frame decode')
  const frames: ImageData[] = []
  for (const bitmap of bitmaps) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, max_w, max_h)
    ctx.drawImage(bitmap, 0, 0)
    frames.push(ctx.getImageData(0, 0, max_w, max_h))
    bitmap.close?.()
  }
  return frames
}

const encodeAnimatedGIF = async (
  frames: ImageData[],
  opts: AnimExportOpts
): Promise<Blob> => {
  const gif = GIFEncoder()
  // gifenc: repeat=0 => infinite loop, repeat=-1 => play once. Set on first frame only.
  const repeat = opts.loop_mode === 'once' ? -1 : 0
  for (let i = 0; i < frames.length; i++) {
    const image_data = frames[i]
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
  frames: ImageData[],
  opts: AnimExportOpts
): Promise<Blob> => {
  if (frames.length === 0) throw new Error('No frames to encode')
  // All frames already share the common canvas size (see decodeFramesToCommonCanvas).
  const canvas = document.createElement('canvas')
  canvas.width = frames[0].width
  canvas.height = frames[0].height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No 2D context for WebM canvas')
  ctx.putImageData(frames[0], 0, 0)

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
  for (let i = 1; i < frames.length; i++) {
    ctx.putImageData(frames[i], 0, 0)
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
    blob = await encodeAnimatedGIF(await decodeFramesToCommonCanvas(ordered_blobs), opts)
    extension = '.gif'
    break
  case 'webm':
    blob = await encodeAnimatedWebM(await decodeFramesToCommonCanvas(ordered_blobs), opts)
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
      const blob = await captureViewAsPNGBlob(app_data, dpi)
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
  // Expose the "one JSON per view" save to the OS persistence dialog. The dialog
  // (OpenSankey, view-agnostic) calls this when its ``save_one_json_per_view``
  // JSON output option is checked. Views are an OSP concept, so the actual
  // serialization lives here.
  mc.save_all_views_as_json = (kwargs: Type_JSON) => exportAllViewsAsJSONZip(app_data, kwargs)
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
