// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1527 — LE RENDU COMMUN DES LIGNES DE LÉGENDE, en DOM pur : la couronne, le sunburst et la légende
// commune des petits multiples posent leurs lignes (`Type_LegendRow`, cf. `legendRows`) par cette seule
// fonction. La colonne du Sankey (React) lit les mêmes mesures et la même pastille (`legendSwatchMarkup`).
//
// Une ligne : [case] [pastille] nom (qui revient à la ligne en colonne). Titre et en-tête : gras, sans
// pastille ni case. Décochée : texte grisé, pastille grise. Les classes historiques restent (les tests
// et les styles s'y accrochent) : `node_stats_legend_row`, `…_item`, `…_heading`, `…_unchecked`,
// `…_check`, `data-legend-indent`.

import {
  LEGEND_GAP, LEGEND_HEADING_WEIGHT, LEGEND_INDENT_EM, LEGEND_ROW_PAD_X, LEGEND_ROW_PAD_Y, LEGEND_UNCHECKED_INK,
  legendSwatchMarkup, type Type_LegendRow, type Type_LegendSwatchOptions
} from './legendRows'
import { ui_accent } from '../css/uiTokens'

export type Type_AppendLegendRowsOptions = {
  /** Police des lignes, px ; absente : celle du conteneur. */
  font_px?: number
  /** Bandeau sous la figure : lignes enchaînées, sans retrait ni retour à la ligne. */
  below?: boolean
  /** Cocher / décocher une ligne (case). Absent : pas de case, même si la ligne a `checked`. */
  onToggle?: (row: Type_LegendRow, show: boolean) => void
  /** Info-bulle de la case (« Masquer Blé »…) ; défaut : `row.hint`, sinon le nom. */
  hintOf?: (row: Type_LegendRow) => string | undefined
  onHover?: (row: Type_LegendRow, el: HTMLElement) => void
  onLeave?: (row: Type_LegendRow, el: HTMLElement) => void
  /** Clic sur la ligne (hors case). */
  onActivate?: (row: Type_LegendRow, el: HTMLElement) => void
  /** Classe propre au tracé, ajoutée à chaque ligne (`sunburst_branch`…). */
  row_class?: string
  /** Pastille : motif, icônes. */
  swatch?: Omit<Type_LegendSwatchOptions, 'unchecked' | 'pattern_id'>
  /** Préfixe des motifs de hachures (unique dans le document). */
  id_prefix?: string
}

/** Une ligne posée : la ligne du modèle et son élément. */
export type Type_LegendRowElement = { row: Type_LegendRow, el: HTMLDivElement }

/**
 * POSE `rows` dans `host` et rend les éléments posés, dans l'ordre. Les gestes sont ceux que l'appelant
 * donne ; la case garde le clic pour elle (le tracé dessous ne le voit pas).
 */
export function appendLegendRows(
  host: HTMLElement, rows: readonly Type_LegendRow[], options: Type_AppendLegendRowsOptions = {}
): Type_LegendRowElement[] {
  const below = options.below === true
  if (options.font_px !== undefined) host.style.fontSize = `${options.font_px}px`
  const doc = host.ownerDocument ?? document
  return rows.map((row, index) => {
    const el = doc.createElement('div')
    const bold = row.kind === 'title' || row.kind === 'heading'
    el.className = 'node_stats_legend_row ' + (row.kind === 'heading' || row.kind === 'title'
      ? 'node_stats_legend_heading'
      : row.kind === 'context' ? 'node_stats_legend_context' : 'node_stats_legend_item') +
      (options.row_class ? ' ' + options.row_class : '')
    el.setAttribute('data-legend-indent', String(row.indent))
    el.setAttribute('data-legend-key', row.key)
    if (row.description) el.title = row.description
    const s = el.style
    s.display = 'flex'
    s.alignItems = below ? 'center' : 'flex-start'
    s.gap = LEGEND_GAP
    s.paddingTop = LEGEND_ROW_PAD_Y
    s.paddingBottom = LEGEND_ROW_PAD_Y
    s.paddingRight = LEGEND_ROW_PAD_X
    // Le retrait en marge (même mesure que `legendRowPaddingLeft` de la colonne, sans `calc`).
    s.paddingLeft = LEGEND_ROW_PAD_X
    if (!below && row.indent > 0) s.marginLeft = `${row.indent * LEGEND_INDENT_EM}em`
    if (below) s.flex = '0 0 auto'
    if (row.kind === 'title' && index > 0) s.marginTop = '0.5rem'
    if (bold) s.fontWeight = String(LEGEND_HEADING_WEIGHT)
    const unchecked = row.checked === false
    if (unchecked) {
      el.classList.add('node_stats_legend_unchecked')
      s.color = LEGEND_UNCHECKED_INK
    }
    // La case : seulement sur une entrée, et si le tracé sait la servir.
    const toggle = options.onToggle
    if (toggle && row.kind === 'entry' && row.checked !== undefined) {
      const box = doc.createElement('input')
      box.type = 'checkbox'
      box.checked = row.checked
      box.defaultChecked = row.checked
      box.className = 'node_stats_legend_check'
      box.title = options.hintOf?.(row) ?? row.hint ?? row.label
      box.style.margin = below ? '0' : '0.1em 0 0'
      box.style.flex = '0 0 auto'
      box.style.cursor = 'pointer'
      // La case de la colonne du Sankey : l'accent du lecteur.
      box.style.accentColor = ui_accent
      box.addEventListener('pointerdown', e => e.stopPropagation())
      box.addEventListener('click', e => { e.stopPropagation(); toggle(row, box.checked) })
      el.appendChild(box)
    }
    // La pastille : la couleur DESSINÉE, jamais sur un titre ni un en-tête.
    if (!bold && row.kind !== 'context') {
      const markup = legendSwatchMarkup(row.swatch, {
        ...options.swatch, unchecked, pattern_id: `${options.id_prefix ?? 'legend_rows'}_hatch_${index}`
      })
      if (markup !== '') {
        const holder = doc.createElement('span')
        holder.className = 'legend_swatch_holder'
        holder.style.display = 'inline-flex'
        holder.style.flex = '0 0 auto'
        holder.innerHTML = markup
        const svg = holder.firstElementChild as HTMLElement | null
        if (svg !== null && below) svg.style.marginTop = '0'
        el.appendChild(holder)
      }
    }
    const label = doc.createElement('span')
    label.className = 'legend_row_label'
    label.style.flex = '1 1 auto'
    label.style.minWidth = '0'
    label.style.whiteSpace = below ? 'nowrap' : 'normal'
    label.style.overflowWrap = below ? 'normal' : 'anywhere'
    label.textContent = row.label
    el.appendChild(label)
    if (options.onHover) {
      const hover = options.onHover
      el.addEventListener('mouseover', () => hover(row, el))
    }
    if (options.onLeave) {
      const leave = options.onLeave
      el.addEventListener('mouseout', () => leave(row, el))
    }
    if (options.onActivate) {
      const activate = options.onActivate
      el.style.cursor = 'pointer'
      el.addEventListener('click', () => activate(row, el))
    }
    host.appendChild(el)
    return { row, el }
  })
}
