// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// AJUSTEMENT #5 — RÉSOLUTION D'UN DÉPÔT, isolée du composant.
//
// C'est la seule règle métier du glisser-déposer : « ce bloc, relâché là, donne
// quelle composition ? ». L'extraire du composant la rend TESTABLE sans monter
// React ni simuler un glisser — un geste qu'aucun test automatisé ne reproduit
// fidèlement, alors que c'est précisément là que se logent les erreurs d'index.

import {
  layoutFor, normalizeAllLayouts, placeBlock, unplaceBlock,
  MAX_TABS, MAX_COLS, MAX_ROWS,
  type Type_Composition, type Type_BlockPlacement
} from '../../../types/PresentationComposition'
import type { Type_PanelMode } from '../../../types/PanelManager'

export const CELL = 'cell'
export const NEW_ROW = 'newrow'
export const NEW_COL = 'newcol'
export const NEW_TAB = 'newtab'
export const TRAY = 'tray'

export const cellDropId = (tab: number, col: number, row: number) => `${CELL}|${tab}|${col}|${row}`
export const newRowDropId = (tab: number, col: number) => `${NEW_ROW}|${tab}|${col}`
export const newColDropId = (tab: number) => `${NEW_COL}|${tab}`

/** Forme du tableau, telle qu'affichée : de quoi situer les zones « nouvelle
 *  rangée » et « nouvelle colonne » sans redonner la disposition entière. */
export type Type_LayoutShape = {
  tabs: number
  cols: (tab: number) => number
  rows: (tab: number, col: number) => number
}

/**
 * Cible d'un dépôt, résolue en placement — ou `null` pour « retirer de ce
 * contenant » (la réserve). Rend `undefined` si l'identifiant est inexploitable.
 */
export const dropTarget = (
  droppable_id: string,
  shape: Type_LayoutShape
): Type_BlockPlacement | null | undefined => {
  const [kind, a, b, c] = droppable_id.split('|')
  if (kind === TRAY) return null
  if (kind === NEW_TAB) return { tab: shape.tabs, col: 0, row: 0 }
  if (kind === NEW_COL) {
    const tab = Number(a)
    return Number.isInteger(tab) ? { tab, col: shape.cols(tab), row: 0 } : undefined
  }
  if (kind === NEW_ROW) {
    const tab = Number(a), col = Number(b)
    return Number.isInteger(tab) && Number.isInteger(col)
      ? { tab, col, row: shape.rows(tab, col) }
      : undefined
  }
  if (kind === CELL) {
    const tab = Number(a), col = Number(b), row = Number(c)
    return Number.isInteger(tab) && Number.isInteger(col) && Number.isInteger(row)
      ? { tab, col, row }
      : undefined
  }
  return undefined
}

/**
 * Applique un dépôt et rend la composition résultante.
 *
 * Deux temps, dans cet ordre :
 *  1. le PLACEMENT — quelle cellule du tableau (`placeBlock`) ;
 *  2. le RANG dans la cellule — `placeBlock` met le bloc en queue, or l'auteur
 *     l'a relâché à un endroit précis. On réordonne alors les seules entrées de
 *     cette cellule, chacune reprenant une des positions qu'elles occupaient
 *     déjà dans la liste : rien d'autre ne bouge.
 *
 * La normalisation préalable des trois contenants est ce qui rend ce
 * réordonnancement inoffensif pour les deux autres (cf. `normalizeAllLayouts`).
 */
export const applyDrop = (
  composition: Type_Composition,
  mode: Type_PanelMode,
  block: string,
  droppable_id: string,
  index: number
): Type_Composition => {
  const tabs = layoutFor(composition, mode)
  const target = dropTarget(droppable_id, {
    tabs: tabs.length,
    cols: (t) => tabs[t]?.length ?? 0,
    rows: (t, c) => tabs[t]?.[c]?.length ?? 0
  })
  if (target === undefined) return composition

  const normalized = normalizeAllLayouts(composition)
  if (target === null) return unplaceBlock(normalized, block, mode)
  if (target.tab >= MAX_TABS || target.col >= MAX_COLS || target.row >= MAX_ROWS) return composition

  const placed = placeBlock(normalized, block, mode, target)
  const cell = layoutFor(placed, mode)[target.tab]?.[target.col]?.[target.row] ?? []
  const dragged = cell.find(e => e.block === block)
  if (!dragged || cell.length < 2) return placed

  const wanted = cell.filter(e => e.block !== block)
  wanted.splice(Math.max(0, Math.min(index, wanted.length)), 0, dragged)
  const slots = placed
    .map((e, i) => (cell.some(m => m.block === e.block) ? i : -1))
    .filter(i => i >= 0)
  const out = [...placed]
  slots.forEach((slot, k) => { out[slot] = wanted[k] })
  return out
}
