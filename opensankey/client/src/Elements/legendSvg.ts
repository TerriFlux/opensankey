// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// os#1527 (lot 1) — LA LÉGENDE EN COLONNE, DANS UNE IMAGE. Les exports (SVG, PNG, PDF, animations) et
// les vignettes de vues ne recollent plus les anciennes zones de légende du modèle : ils dessinent les
// entrées de la colonne (`colouredLegendItems`) en SVG, à gauche du dessin, précédées d'une ligne qui
// résume la navigation (arbitrage de Julien, 10/10 : une image n'a pas de navigation).
//
// Fonction PURE : des entrées et des réglages en entrée, une chaîne SVG (un `<g>`) et sa taille en
// sortie. Aucun DOM : la largeur des textes est ESTIMÉE (`estimateTextWidth`, 0,55 em par caractère),
// comme la mise en page de l'ancienne légende sans rendu.
//
// Ce qu'elle reprend de la colonne (`SankeyLegendPanel`) : la pastille (couleur, bordure, pointillés,
// hachures, icône, valeur d'exemple — cf. `Swatch`), le nom (gras, italique, capitales, police, couleur
// du style), le retrait des membres, les titres de groupe, la barre d'échelle. Ce qu'elle reprend de
// l'ANCIENNE légende (arbitrage b) : la police (`legend_police`), la largeur (`legend_width`), la
// disposition horizontale (`legend_horizontal`), le fond, sa bordure et son opacité. Pas de cases :
// une image ne se coche pas ; une étiquette décochée n'y paraît pas (sauf réglage « étiquettes
// masquées gardées », grisée).

import { estimateTextWidth, type Type_LegendItem } from './legendItems'
import { LEGEND_SAMPLE_VALUE } from './legendTagStyle'
import { ui_ink, ui_ink_disabled, ui_ink_secondary, ui_ink_strong, ui_font_stack, ui_line_strong } from '../css/uiTokens'

export type Type_LegendSvgConfig = {
  /** Légende masquée (`mask_legend`) : rien. */
  masked?: boolean
  /** Police des entrées, px (`legend_police`), avant le facteur `k`. */
  police: number
  /** Largeur du texte avant retour à la ligne, px (`legend_width`), avant `k`. */
  width: number
  /** Entrées enchaînées sur une ligne (`legend_horizontal`). */
  horizontal: boolean
  bg_color: string
  /** Opacité du fond, 0-100 (`legend_bg_opacity`). */
  bg_opacity: number
  bg_border: boolean
  /** Ligne de résumé de la navigation, en tête (« Volailles · 2023 · kt »). Vide : pas de ligne. */
  summary?: string
  /** Hauteur de la barre d'échelle, px FINAUX (épaisseur d'un flux de la valeur écrite à l'échelle de l'image). */
  scale_bar_height?: number
  /** Étiquettes masquées gardées dans la légende, grisées (`show_hidden_tags`). */
  show_hidden_tags?: boolean
  /** Tracé d'une icône du catalogue du diagramme, par son nom. */
  iconPath?: (icon_name: string) => string | undefined
  /** Préfixe des identifiants de motifs (hachures), pour deux légendes dans un même document. */
  id_prefix?: string
}

export type Type_LegendSvg = { svg: string, width: number, height: number }

const EMPTY: Type_LegendSvg = { svg: '', width: 0, height: 0 }

// Les hachures d'un nœud (`shape_hatch`), dans l'orientation du style (cf. `Swatch` de la colonne).
const HATCH_ANGLE: { [k: string]: number } = { vertical: 0, horizontal: 90, diagonal: 45, antidiagonal: -45 }

// Mesures de la colonne, en polices (cf. `SankeyLegendPanel` : pastille 0,7 em, écart 0,35 rem…)
const SWATCH_EM = 0.7
const GAP_EM = 0.35
const LINE_EM = 1.25
const ROW_PAD_EM = 0.1
const GROUP_GAP_EM = 0.6
const PAD_EM = 0.5
const INLINE_GAP_EM = 1
const BASELINE_EM = 0.93

const esc = (s: string): string => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const n = (v: number): string => String(Math.round(v * 100) / 100)

// Le préfixe « ☑ / ☐ » qu'écrit la légende dessinée en tête d'un membre de dimension (os#1526).
const textOf = (item: Type_LegendItem): string =>
  item.checked !== undefined ? item.text.replace(/^[☑☐]\s*/, '') : item.text

/** L'étiquette est-elle décochée (masquée du dessin, ou membre non choisi) ? */
const isUnchecked = (item: Type_LegendItem): boolean => item.dimmed === true || item.checked === false

/** Coupe un texte en lignes d'au plus `max_w` px (estimation), mot à mot ; un mot trop long reste entier. */
export const wrapText = (text: string, font: number, max_w: number): string[] => {
  const words = text.split(/\s+/).filter(w => w !== '')
  if (words.length === 0) return ['']
  const lines: string[] = []
  let line = ''
  words.forEach(word => {
    const candidate = line === '' ? word : line + ' ' + word
    if (line !== '' && estimateTextWidth(candidate, font) > max_w) {
      lines.push(line)
      line = word
    } else line = candidate
  })
  if (line !== '') lines.push(line)
  return lines
}

type Type_Swatch = { w: number, h: number, svg: (x: number, y: number) => string }

/** La pastille d'une entrée (cf. `Swatch` de la colonne), ou `undefined` si l'entrée n'en a pas. */
const swatchOf = (
  item: Type_LegendItem, P: number, unchecked: boolean, config: Type_LegendSvgConfig, pattern_id: string
): Type_Swatch | undefined => {
  if (item.heading === true) return undefined
  if (item.scale_bar === true) {
    const h = Math.max(4, config.scale_bar_height ?? 50)
    const w = Math.max(2, P / 6)
    return { w: w + 0.3 * P, h, svg: (x, y) => `<rect x="${n(x + 0.15 * P)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="black"/>` }
  }
  const swatch = item.format?.swatch
  const color = unchecked ? ui_line_strong : (swatch?.color ?? item.swatch_color)
  const icon = item.format?.icon
  if (color === undefined && icon === undefined) return undefined
  const has_value = item.format?.value !== undefined
  const h = SWATCH_EM * P
  // Élargie quand elle porte la valeur d'exemple (30 × 14 dans la colonne), ou des tirets de flux.
  const w = has_value ? h * 30 / 14 : (swatch?.link_dashed === true ? h * 2 : h)
  const border = swatch?.border_visible === true
  const dashed = swatch?.border_dashed === true || swatch?.link_dashed === true
  const hatch = swatch?.hatch !== undefined && swatch.hatch !== 'none' ? HATCH_ANGLE[swatch.hatch] : undefined
  const ink = unchecked ? ui_ink_disabled : ui_ink
  const unit = h / 14
  return {
    w, h,
    svg: (x, y) => {
      const parts: string[] = []
      if (hatch !== undefined) {
        parts.push(`<defs><pattern id="${pattern_id}" width="${n(3 * unit)}" height="${n(3 * unit)}" patternUnits="userSpaceOnUse" patternTransform="rotate(${hatch})">` +
          `<rect width="${n(3 * unit)}" height="${n(3 * unit)}" fill="${esc(color ?? 'none')}"/>` +
          `<line x1="0" y1="0" x2="0" y2="${n(3 * unit)}" stroke="${ink}" stroke-width="${n(unit)}"/></pattern></defs>`)
      }
      const stroke = border || dashed ? esc(swatch?.border_color ?? ui_ink_secondary) : 'none'
      const stroke_w = border ? Math.min(3, swatch?.border_thickness ?? 1) * unit : unit
      parts.push(`<rect x="${n(x + 0.5 * unit)}" y="${n(y + 0.5 * unit)}" width="${n(w - unit)}" height="${n(h - unit)}" rx="${n(2 * unit)}"` +
        ` fill="${hatch !== undefined ? `url(#${pattern_id})` : esc(color ?? 'none')}"` +
        ` fill-opacity="${unchecked ? 1 : (swatch?.opacity ?? 1)}" stroke="${stroke}" stroke-width="${n(stroke_w)}"` +
        (dashed ? ` stroke-dasharray="${n(3 * unit)} ${n(2 * unit)}"` : '') + '/>')
      if (icon?.is_image === true && icon.image_src !== undefined) {
        parts.push(`<image href="${esc(icon.image_src)}" x="${n(x + unit)}" y="${n(y + unit)}" width="${n(h - 2 * unit)}" height="${n(h - 2 * unit)}"/>`)
      } else if (icon !== undefined && icon.icon_name) {
        const d = config.iconPath?.(icon.icon_name)
        if (d) {
          parts.push(`<svg x="${n(x + unit)}" y="${n(y + unit)}" width="${n(h - 2 * unit)}" height="${n(h - 2 * unit)}" viewBox="${esc(icon.view_box || '0 0 24 24')}">` +
            `<path d="${esc(d)}" fill="${esc(unchecked ? ui_ink_disabled : (icon.color ?? ink))}"/></svg>`)
        }
      }
      const value = item.format?.value
      if (value !== undefined) {
        const sample = value.uppercase === true ? LEGEND_SAMPLE_VALUE.toLocaleUpperCase() : LEGEND_SAMPLE_VALUE
        parts.push(`<text x="${n(x + w / 2)}" y="${n(y + h / 2 + 3.2 * unit)}" text-anchor="middle" font-size="${n(9 * unit)}"` +
          ` fill="${esc(value.color ?? ui_ink_strong)}" font-weight="${value.bold === true ? 700 : 400}"` +
          (value.italic === true ? ' font-style="italic"' : '') +
          (value.font_family ? ` font-family="${esc(value.font_family)}"` : '') + `>${esc(sample)}</text>`)
      }
      return parts.join('')
    }
  }
}

/** Le `<text>` d'une entrée, ligne par ligne, avec le nom souligné d'un groupe épinglé. */
const textSvg = (
  item: Type_LegendItem | undefined, lines: string[], x: number, top: number, P: number, unchecked: boolean, bold: boolean
): string => {
  const name = item?.format?.name
  const attrs = [
    `font-size="${n(P)}"`,
    `fill="${esc(unchecked ? ui_ink_disabled : (name?.color ?? ui_ink_strong))}"`,
    `font-weight="${bold || item?.bold === true || name?.bold === true ? 600 : 400}"`
  ]
  if (name?.italic === true || item?.pinned === true) attrs.push('font-style="italic"')
  if (name?.font_family) attrs.push(`font-family="${esc(name.font_family)}"`)
  const pinned = item?.pinned_name
  const tspans = lines.map((line, i) => {
    const shown = name?.uppercase === true ? line.toLocaleUpperCase() : line
    const y = n(top + i * LINE_EM * P + BASELINE_EM * P)
    if (i === 0 && pinned !== undefined && shown.startsWith(pinned)) {
      return `<tspan x="${n(x)}" y="${y}"><tspan text-decoration="underline">${esc(pinned)}</tspan>${esc(shown.slice(pinned.length))}</tspan>`
    }
    return `<tspan x="${n(x)}" y="${y}">${esc(shown)}</tspan>`
  })
  return `<text ${attrs.join(' ')}>${tspans.join('')}</text>`
}

/** Le titre d'un groupe (ligne seule, sans étiquette, dans un bloc) : un écart le précède. */
const startsBlock = (item: Type_LegendItem): boolean =>
  item.starts_group === true || (item.own_line === true && item.block_id !== undefined && item.tag_group_id === undefined)

/**
 * os#1527 — la légende de la colonne en SVG : un `<g>` dont l'origine est son coin haut-gauche, sa
 * largeur et sa hauteur. `k` multiplie toutes les mesures de texte (police, largeur, marges) : 1 pour
 * un export en police verrouillée, le zoom d'export sinon, l'échelle de la vignette pour un aperçu.
 * Rien (`svg` vide, taille nulle) quand la légende est masquée ou n'a rien à dire.
 */
export function legendToSvg(items: readonly Type_LegendItem[], config: Type_LegendSvgConfig, k: number = 1): Type_LegendSvg {
  if (config.masked === true) return EMPTY
  const shown = items.filter(item => !isUnchecked(item) || config.show_hidden_tags === true)
  const summary = (config.summary ?? '').trim()
  if (shown.length === 0 && summary === '') return EMPTY
  const P = Math.max(1, config.police * k)
  const pad = PAD_EM * P
  const max_w = Math.max(config.width * k, 4 * P)
  const line_h = LINE_EM * P
  const prefix = config.id_prefix ?? 'legend_export'
  const body: string[] = []
  let y = pad
  let right = 0

  if (summary !== '') {
    const lines = wrapText(summary, P, max_w)
    body.push(textSvg(undefined, lines, pad, y, P, false, true).replace('<text ', '<text class="legend_export_summary" '))
    right = Math.max(right, ...lines.map(l => estimateTextWidth(l, P) * 1.1))
    y += lines.length * line_h + (shown.length > 0 ? GROUP_GAP_EM * P : 0)
  }

  if (!config.horizontal) {
    shown.forEach((item, index) => {
      if (index > 0 && startsBlock(item)) y += GROUP_GAP_EM * P
      const unchecked = isUnchecked(item)
      const indent = (item.indent ?? 0) * P
      const swatch = swatchOf(item, P, unchecked, config, `${prefix}_hatch_${index}`)
      const text_x = indent + (swatch !== undefined ? swatch.w + GAP_EM * P : 0)
      const lines = wrapText(textOf(item), P, Math.max(P, max_w - text_x))
      const top = y + ROW_PAD_EM * P
      const text_h = lines.length * line_h
      if (swatch !== undefined) {
        // La pastille en face de la première ligne (la barre d'échelle, elle, part du haut de la ligne)
        const sy = item.scale_bar === true ? top : top + (line_h - swatch.h) / 2
        body.push(swatch.svg(pad + indent, sy))
      }
      body.push(textSvg(item, lines, pad + text_x, top, P, unchecked, false))
      right = Math.max(right, text_x + Math.max(...lines.map(l => estimateTextWidth(l, P) * (item.bold === true ? 1.1 : 1))))
      const row_h = Math.max(text_h, swatch?.h ?? 0)
      y = top + row_h + ROW_PAD_EM * P
    })
  } else {
    // Horizontal : le titre d'un groupe ouvre sa ligne, ses étiquettes le suivent et passent à la
    // ligne à la largeur de la légende ; les lignes d'info, l'échelle et les groupes épinglés
    // occupent la leur (même règle que `layoutLegendItems`).
    let x = 0
    let entries_x = 0
    let row_top = y
    let row_h = 0
    const newLine = () => {
      if (row_h > 0) row_top += row_h + 2 * ROW_PAD_EM * P
      x = 0
      row_h = 0
    }
    shown.forEach((item, index) => {
      const unchecked = isUnchecked(item)
      const swatch = swatchOf(item, P, unchecked, config, `${prefix}_hatch_${index}`)
      const sw = swatch !== undefined ? swatch.w + GAP_EM * P : 0
      const text = textOf(item)
      const title = item.group_title === true
      const own_line = item.own_line === true && !title
      if (item.wrap === true) {
        newLine()
        const lines = wrapText(text, P, max_w)
        body.push(textSvg(item, lines, pad, row_top, P, unchecked, false))
        right = Math.max(right, ...lines.map(l => estimateTextWidth(l, P)))
        row_h = lines.length * line_h
        newLine()
        return
      }
      const text_w = estimateTextWidth(text, P) * (title || item.bold === true ? 1.1 : 1)
      const entry_w = sw + text_w
      if (title || own_line || item.starts_group === true) {
        newLine()
        if (index > 0 && startsBlock(item)) row_top += GROUP_GAP_EM * P
        entries_x = 0
      } else if (x > entries_x && x + entry_w > max_w) {
        if (entries_x + entry_w > max_w || entries_x > max_w / 2) entries_x = 0
        const keep = entries_x
        newLine()
        x = keep
      }
      if (swatch !== undefined) {
        const sy = item.scale_bar === true ? row_top : row_top + (line_h - swatch.h) / 2
        body.push(swatch.svg(pad + x, sy))
      }
      body.push(textSvg(item, [text], pad + x + sw, row_top, P, unchecked, false))
      right = Math.max(right, x + entry_w)
      row_h = Math.max(row_h, line_h, swatch?.h ?? 0)
      if (title) {
        x += entry_w + 0.6 * P
        entries_x = x
      } else if (own_line) {
        newLine()
      } else {
        x += entry_w + INLINE_GAP_EM * P
      }
    })
    y = row_top + row_h
  }

  const width = right + 2 * pad
  const height = y + pad
  const bg_opacity = Math.max(0, Math.min(100, config.bg_opacity)) / 100
  const background = bg_opacity > 0 || config.bg_border
    ? `<rect class="legend_export_background" x="0" y="0" width="${n(width)}" height="${n(height)}"` +
      (config.bg_border ? ` rx="${n(4 * k)}" stroke="${ui_ink_disabled}" stroke-width="${n(Math.max(0.5, k))}"` : '') +
      ` fill="${bg_opacity > 0 ? esc(config.bg_color) : 'none'}" fill-opacity="${bg_opacity}"/>`
    : ''
  const svg = `<g class="sankey_legend_export" font-family="${esc(ui_font_stack)}">${background}${body.join('')}</g>`
  return { svg, width, height }
}
