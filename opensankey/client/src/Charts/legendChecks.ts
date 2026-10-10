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
import { ui_ink_secondary, ui_line } from '../css/uiTokens'
import {
  LEGEND_UNCHECKED_INK, LEGEND_UNCHECKED_SWATCH, dimensionLegendRows, sortLegendRowsByDrawing,
  type Type_LegendMember, type Type_LegendRow
} from '../Elements/legendRows'

export { LEGEND_UNCHECKED_INK, LEGEND_UNCHECKED_SWATCH }

/**
 * os#1527 — LES BLOCS DE LA LÉGENDE PAR DIMENSION, en lignes du modèle commun (`Type_LegendRow`, cf.
 * `Elements/legendRows`) : posées par `dimensionLegendRows` comme celles du Sankey, chaque entrée
 * désigne son membre (`target`) ; la couleur est celle du secteur, posée au tracé (`drawnLegendRows`).
 */
export interface Type_LegendChecks {
  /** Les lignes de chaque dimension qui découpe, par identifiant de dimension (sans titre). */
  blocks: { [dimension_id: string]: Type_LegendRow[] }
  /** Cocher / décocher un membre (identifiant de secteur de membre) : le geste annulable de la figure. */
  toggle: (id: string, show: boolean) => void
  hint?: (label: string) => string
}

/** L'identifiant de secteur de membre d'une ligne (`memberSectorId`), ou sa clé. */
export const legendRowSectorId = (row: Type_LegendRow): string =>
  row.target !== undefined ? memberSectorId(row.target.dimension_id, row.target.member_id) : row.key

/** Un membre de dimension tel que la couronne le lit. */
type Type_CouronneMember = Type_LegendMember & { children?: Type_CouronneMember[] }

/**
 * LE BLOC D'UNE DIMENSION DE COURONNE : les membres listés par le plan (`listed`, cochés ou non), comme
 * si tout était coché (ordre stable, sa!879), en lignes communes — en-têtes des ancêtres ouverts dans la
 * portée (`focus`), retraits relatifs. L'ordre du DESSIN est posé au tracé (`drawnLegendRows`) ; ici,
 * celui de la dimension.
 */
export const couronneLegendRows = <M extends Type_CouronneMember>(
  dim: { id: string },
  roots: readonly M[],
  listed: ReadonlyMap<string, { checked: boolean }>,
  focus: readonly M[],
  labelOf: (member: M) => string,
  hasAncestor: (member: M, ancestor: M) => boolean
): Type_LegendRow[] => {
  // Les listés, dans l'ordre de l'arbre de la dimension.
  const members: M[] = []
  const visit = (m: M) => {
    if (listed.has(m.id)) { members.push(m); return }
    ;((m.children ?? []) as M[]).forEach(visit)
  }
  roots.forEach(visit)
  const inScope = (m: M) => focus.length === 0 || focus.some(f => m !== f && hasAncestor(m, f))
  return dimensionLegendRows(dim, {
    listed: members,
    labelOf,
    checkedOf: m => listed.get(m.id)?.checked ?? true,
    keyOf: m => memberSectorId(dim.id, m.id),
    headingKeyOf: route => memberSectorId(dim.id, route[route.length - 1]),
    inScope
  })
}

/**
 * Les lignes d'un bloc À POSER : chaque entrée prend la couleur du secteur qui la dessine
 * (`colorOf(identifiant de secteur de membre)`, sinon `fallback`), et le bloc se range dans l'ORDRE
 * DES SECTEURS DESSINÉS (`rankOf`, arbitrage 1) — une ligne non dessinée (décochée) reste derrière sa
 * voisine.
 */
export const drawnLegendRows = (
  rows: readonly Type_LegendRow[],
  colorOf: (sector_id: string) => string | undefined,
  fallback: string,
  rankOf?: (sector_id: string) => number | undefined
): Type_LegendRow[] => {
  const coloured = rows.map(row => row.kind === 'entry'
    ? { ...row, swatch: colorOf(legendRowSectorId(row)) ?? fallback }
    : row)
  return rankOf === undefined
    ? coloured
    : sortLegendRowsByDrawing(coloured, row => rankOf(legendRowSectorId(row)))
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
    color: ui_ink_secondary, cursor: 'pointer', background: 'white', border: `1px solid ${ui_line}`,
    borderRadius: side === 'left' ? '0 999px 999px 0' : side === 'right' ? '999px 0 0 999px' : '999px',
    boxShadow: '1px 1px 3px rgba(0, 0, 0, 0.12)'
  })
  b.addEventListener('pointerdown', e => e.stopPropagation())
  b.addEventListener('click', e => { e.stopPropagation(); capsule.toggle(!shown) })
  root.appendChild(b)
  return b
}

/**
 * os#1527 (Julien, 10/10 : « sur le Sankey la pastille est bien placée, pas sur la couronne ») — la
 * capsule d'une légende OUVERTE à côté se colle au bord INTÉRIEUR de sa colonne, côté dessin, en haut,
 * comme celle du Sankey. `root` est le conteneur positionné où elle vit ; `legend`, la colonne.
 */
export const placeCapsuleAtColumnEdge = (
  capsule: HTMLElement, root: HTMLElement, legend: HTMLElement, position: string
): void => {
  if (position !== 'left' && position !== 'right') return
  const place = () => {
    const r = root.getBoundingClientRect()
    const l = legend.getBoundingClientRect()
    if (l.width === 0) return
    if (position === 'left') {
      capsule.style.left = `${Math.round(l.right - r.left)}px`
      capsule.style.right = 'auto'
    } else {
      capsule.style.right = `${Math.round(r.right - l.left)}px`
      capsule.style.left = 'auto'
    }
    capsule.style.top = `${Math.round(l.top - r.top) + 8}px`
  }
  place()
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(place)
}

// ── os#1527 (10/10) — LE TABLEAU DE NAVIGATION EN HAUT DE LA COLONNE DE LÉGENDE ──────────────────────
//
// Julien : « la même chose pour les couronnes » que le Sankey (`main_zone_canvas_column_navigation`).
// Légende À CÔTÉ du disque : le tableau, en rendu vertical, se pose en tête de sa colonne, au-dessus
// des lignes, séparé d'un filet ; la bande horizontale au-dessus du disque disparaît. Légende dessous
// ou masquée : la bande reste (c'est l'appelant qui choisit, cf. `registerAnalysisRepresentations`).

/** La largeur sous laquelle une colonne qui porte le tableau ne descend pas (si la figure la permet). */
export const LEGEND_NAVIGATION_MIN_PX = 200

/**
 * La place de la légende à côté, élargie pour le tableau : au moins `LEGEND_NAVIGATION_MIN_PX`, sans
 * dépasser 42 % de la largeur disponible (la borne de la couronne). Sans tableau : inchangée.
 */
export const legendRoomWithNavigation = (room: number, available: number, has_navigation: boolean): number =>
  has_navigation ? Math.max(room, Math.min(LEGEND_NAVIGATION_MIN_PX, available * 0.42)) : room

/**
 * Pose `navigation` en tête de la colonne `legend`, un filet dessous. `position` : le côté de la
 * légende — la capsule occupe le coin haut de ce côté, le tableau s'en écarte d'autant.
 */
export const prependLegendNavigation = (legend: HTMLElement, navigation: HTMLElement, position: string): HTMLElement => {
  const wrap = document.createElement('div')
  wrap.className = 'figure_legend_navigation'
  wrap.style.borderBottom = `1px solid ${ui_line}`
  wrap.style.marginBottom = '0.3rem'
  wrap.style.flexBasis = '100%'
  // Julien, 10/10 (« ça pourrait être collé plus à gauche ») : le tableau s'aligne sur les lignes de
  // la légende ; la capsule est au bord de la colonne, côté dessin (`placeCapsuleAtColumnEdge`).
  void position
  wrap.appendChild(navigation)
  legend.insertBefore(wrap, legend.firstChild)
  return wrap
}
