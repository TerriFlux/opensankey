// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// 04/10/2026 — LES CASES DE LA LÉGENDE PAR DIMENSION (os#1511). Julien : « quand on est en mode
// dimensions croisées, on n'a pas accès à la sélection dans la légende ». Les cases de sa!878 ne
// vivaient que dans la couronne à une dimension en secteurs (`legend_toggle` de `drawDonutChart`).
// Dès que deux dimensions découpent, la légende s'écrit en BLOCS PAR DIMENSION — dans le tracé à
// anneaux (anneaux emboîtés, sunburst) et dans la légende commune des petits multiples. Ce module
// est leur point commun : le modèle des blocs (fourni par la nature, qui connaît la coupe) et la case.
//
// LA RÈGLE D'ORDRE STABLE (sa!879) vaut ici aussi : un bloc liste les membres de sa dimension COMME
// SI TOUT ÉTAIT COCHÉ, dans l'ordre de la dimension ; décocher grise la ligne, rien ne bouge.
//
// Module sans modèle ni React : le tracé n'a pas à connaître les dimensions.

import { memberSectorId, parseMemberSectorPath } from './memberSectorId'

/** Une ligne d'un bloc de dimension. */
export interface Type_LegendCheckEntry {
  /** L'identifiant de secteur du membre (`memberSectorId(dim, membre)`), celui que `toggle` reçoit. */
  id: string
  label: string
  /** La profondeur du membre dans sa dimension : le retrait, relatif au bloc. */
  depth: number
  /** Dessiné (coché) ou retiré (décoché). */
  checked: boolean
  /**
   * Un ancêtre ouvert (sunburst) : une ligne sans case, montrée seulement si un anneau le dessine.
   */
  heading?: boolean
}

export interface Type_LegendChecks {
  /** Les lignes de chaque dimension qui découpe, par identifiant de dimension. */
  blocks: { [dimension_id: string]: Type_LegendCheckEntry[] }
  /** Cocher / décocher un membre (`id` d'une ligne) : le geste annulable de la figure. */
  toggle: (id: string, show: boolean) => void
  hint?: (label: string) => string
}

/**
 * Le membre qu'un secteur dessine, en identifiant de secteur de membre : le DERNIER cran de son
 * chemin (`membre:pays/FR||produits/ble` → `membre:produits/ble`). Un secteur qui n'est pas un membre
 * garde son identifiant.
 */
export const legendMemberKeyOf = (sector_id: string): string => {
  const last = (parseMemberSectorPath(sector_id) ?? []).slice(-1)[0]
  return last === undefined ? sector_id : memberSectorId(last.dimension_id, last.member_id)
}

/** La case d'une ligne de légende : cochée = dessinée. Le clic reste à la légende. */
export const legendCheckBox = (
  checks: Type_LegendChecks, entry: Type_LegendCheckEntry, below = false
): HTMLInputElement => {
  const box = document.createElement('input')
  box.type = 'checkbox'
  box.checked = entry.checked
  box.className = 'node_stats_legend_check'
  box.title = checks.hint?.(entry.label) ?? entry.label
  box.style.margin = below ? '0' : '0.1em 0 0'
  box.style.flex = '0 0 auto'
  box.style.cursor = 'pointer'
  box.addEventListener('pointerdown', e => e.stopPropagation())
  box.addEventListener('click', e => { e.stopPropagation(); checks.toggle(entry.id, box.checked) })
  return box
}

/**
 * os#1527 — UNE LIGNE DE RAPPEL DES COORDONNÉES (« Année : 2015 »), sous les entrées d'une légende de
 * figure, comme dans la légende du diagramme. `open` : la ligne se clique et ouvre la liste de la
 * dimension.
 */
export interface Type_LegendContextRow {
  label: string
  hint?: string
  open?: (anchor: { x: number, y: number }) => void
}

/**
 * os#1527 — POSE LES LIGNES DE RAPPEL sous les entrées d'une légende de figure (couronne, sunburst,
 * petits multiples) : une ligne par dimension, séparée du bloc ; le clic reste à la légende.
 */
export const appendLegendContextRows = (
  legend: HTMLElement, rows: readonly Type_LegendContextRow[] | undefined, below = false
): void => {
  (rows ?? []).forEach((row, i) => {
    const line = document.createElement('div')
    line.className = 'node_stats_legend_context'
    line.textContent = row.label
    line.style.padding = '0.1rem 0.2rem'
    line.style.marginTop = i === 0 ? '0.5rem' : '0'
    line.style.flexBasis = below ? '100%' : 'auto'
    line.style.textAlign = below ? 'center' : 'left'
    line.style.cursor = row.open ? 'pointer' : 'default'
    if (row.hint) line.title = row.hint
    const open = row.open
    if (open) {
      line.addEventListener('pointerdown', e => e.stopPropagation())
      line.addEventListener('click', e => {
        e.stopPropagation()
        const rect = line.getBoundingClientRect()
        open({ x: rect.left, y: rect.bottom })
      })
    }
    legend.appendChild(line)
  })
}

/** os#1527 — la capsule qui cache ou montre la légende d'une figure (cf. `appendLegendCapsule`). */
export interface Type_LegendCapsule {
  /** « Légende », traduit. */
  label: string
  toggle: (show: boolean) => void
}

/**
 * os#1527 — LA CAPSULE DE LA LÉGENDE d'une figure, comme celle du diagramme : posée en surimpression
 * dans le coin de la figure du côté de la légende (`position` : left / right / bottom), elle ne prend
 * aucune place. Légende affichée : « ‹ » (ou « › », « ▾ » selon le côté) la replie ; masquée :
 * « Légende » et la flèche la rouvrent. Le clic reste à la capsule.
 */
export const appendLegendCapsule = (
  root: HTMLElement, capsule: Type_LegendCapsule, shown: boolean, position: string
): HTMLButtonElement => {
  root.style.position = 'relative'
  const side = position === 'left' ? 'left' : position === 'bottom' ? 'bottom' : 'right'
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'figure_legend_capsule'
  b.title = capsule.label
  b.setAttribute('aria-label', capsule.label)
  b.setAttribute('aria-expanded', String(shown))
  const arrow = side === 'left' ? (shown ? '‹' : '›') : side === 'right' ? (shown ? '›' : '‹') : (shown ? '▾' : '▴')
  b.textContent = shown ? arrow : (side === 'right' ? `${arrow} ${capsule.label}` : `${capsule.label} ${arrow}`)
  Object.assign(b.style, {
    position: 'absolute', zIndex: '2', top: side === 'bottom' ? 'auto' : '0.25rem',
    bottom: side === 'bottom' ? '0.25rem' : 'auto',
    left: side === 'left' ? '0' : 'auto', right: side === 'left' ? 'auto' : '0',
    padding: shown ? '0.3rem 0.2rem' : '0.3rem 0.5rem', fontSize: '0.75rem', lineHeight: '1',
    color: '#4a5568', cursor: 'pointer', background: 'white', border: '1px solid #e2e8f0',
    borderRadius: side === 'left' ? '0 999px 999px 0' : side === 'right' ? '999px 0 0 999px' : '999px',
    boxShadow: '1px 1px 3px rgba(0, 0, 0, 0.12)'
  })
  b.addEventListener('pointerdown', e => e.stopPropagation())
  b.addEventListener('click', e => { e.stopPropagation(); capsule.toggle(!shown) })
  root.appendChild(b)
  return b
}

/** La teinte d'une ligne décochée (pastille et texte). */
export const LEGEND_UNCHECKED_SWATCH = '#cbd5e0'
export const LEGEND_UNCHECKED_INK = '#a0aec0'

/**
 * Les lignes d'un bloc à poser : chaque membre retrouve la couleur d'un secteur qui le dessine ;
 * décoché, il reste à sa place, grisé ; un en-tête (ancêtre) ne vient que si un anneau le dessine.
 * Le retrait part du membre le moins profond du bloc.
 */
export const legendCheckRows = (
  entries: readonly Type_LegendCheckEntry[], colorOf: (id: string) => string | undefined, fallback: string
): { entry: Type_LegendCheckEntry, color: string, indent: number }[] => {
  const kept = entries
    .map(entry => ({ entry, drawn: colorOf(entry.id) }))
    .filter(r => !r.entry.heading || r.drawn !== undefined)
  const base = Math.min(...kept.map(r => r.entry.depth))
  return kept.map(({ entry, drawn }) => ({
    entry,
    color: !entry.checked ? LEGEND_UNCHECKED_SWATCH : drawn ?? fallback,
    indent: entry.depth - base
  }))
}
