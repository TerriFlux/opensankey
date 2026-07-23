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
  MAX_TABS, MAX_ROWS, type Type_Composition
} from '../../../types/PresentationComposition'
import type { Type_PanelMode } from '../../../types/PanelManager'

export const ROW = 'row'
export const NEW_ROW = 'newrow'
export const NEW_TAB = 'newtab'
export const TRAY = 'tray'

export const rowDropId = (tab: number, row: number) => `${ROW}|${tab}|${row}`
export const newRowDropId = (tab: number) => `${NEW_ROW}|${tab}`

/**
 * Cible d'un dépôt, résolue en placement — ou `null` pour « retirer de ce
 * contenant » (la réserve). Rend `undefined` si l'identifiant est inexploitable.
 */
export const dropTarget = (
  droppable_id: string,
  tabs_count: number,
  rows_count: (tab: number) => number
): { tab: number, row: number } | null | undefined => {
  const [kind, a, b] = droppable_id.split('|')
  if (kind === TRAY) return null
  if (kind === NEW_TAB) return { tab: tabs_count, row: 0 }
  if (kind === NEW_ROW) {
    const tab = Number(a)
    return Number.isInteger(tab) ? { tab, row: rows_count(tab) } : undefined
  }
  if (kind === ROW) {
    const tab = Number(a), row = Number(b)
    return Number.isInteger(tab) && Number.isInteger(row) ? { tab, row } : undefined
  }
  return undefined
}

/**
 * Applique un dépôt et rend la composition résultante.
 *
 * Deux temps, dans cet ordre :
 *  1. le PLACEMENT — quel onglet, quelle rangée (`placeBlock`) ;
 *  2. le RANG dans la rangée — `placeBlock` met le bloc en queue, or l'auteur
 *     l'a relâché à un endroit précis. On réordonne alors les seules entrées de
 *     cette rangée, chacune reprenant une des positions qu'elles occupaient déjà
 *     dans la liste : rien d'autre ne bouge.
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
  const target = dropTarget(droppable_id, tabs.length, (i) => tabs[i]?.length ?? 0)
  if (target === undefined) return composition

  const normalized = normalizeAllLayouts(composition)
  if (target === null) return unplaceBlock(normalized, block, mode)
  if (target.tab >= MAX_TABS || target.row >= MAX_ROWS) return composition

  const placed = placeBlock(normalized, block, mode, target)
  const row_members = layoutFor(placed, mode)[target.tab]?.[target.row] ?? []
  const dragged = row_members.find(e => e.block === block)
  if (!dragged || row_members.length < 2) return placed

  const wanted = row_members.filter(e => e.block !== block)
  wanted.splice(Math.max(0, Math.min(index, wanted.length)), 0, dragged)
  const slots = placed
    .map((e, i) => (row_members.some(m => m.block === e.block) ? i : -1))
    .filter(i => i >= 0)
  const out = [...placed]
  slots.forEach((slot, k) => { out[slot] = wanted[k] })
  return out
}
