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

// OS#305 — MODÈLE de présentation d'un élément, RÉDUIT à un patron imposé.
//
// La composition libre (blocs composés par l'auteur, disposition en tableau) a
// été retirée : le retour en arrière impose une STRUCTURE COMMUNE. Il ne reste
// qu'une liste ordonnée de blocs, chacun porteur de sa visibilité par contenant
// (info-bulle / pop-up / barre latérale). Cette liste est toujours produite par
// `defaultCompositionFor` (cf. openPresentation) à partir des blocs cochés dans
// le sous-menu Info-bulle (`tooltip_hidden_blocks`) — elle n'est plus surchargée
// par un attribut d'élément.
//
// Module de DONNÉES PURES (aucune dépendance au modèle ni à React). On réutilise
// `Type_PanelMode` de #300 pour désigner les contenants.

import { Type_PanelMode } from './PanelManager'
import { Type_JSON } from './Utils'

/** Visibilité d'un bloc dans chacun des trois contenants. */
export type Type_BlockVisibility = { [mode in Type_PanelMode]: boolean }

/** Une entrée de composition : un bloc, sa visibilité, ses réglages propres. */
export type Type_CompositionEntry = {
  /** Identifiant du bloc au catalogue. */
  block: string
  show: Type_BlockVisibility
  /** Réglages propres au bloc — opaques ici, interprétés par le bloc. */
  options?: { [key: string]: unknown }
}

/** Composition = liste ORDONNÉE d'entrées (l'ordre est l'ordre d'affichage). */
export type Type_Composition = Type_CompositionEntry[]

/** Un bloc est visible partout par défaut (absent = visible, comme TooltipBlocks). */
export const DEFAULT_BLOCK_VISIBILITY: Type_BlockVisibility =
  { tooltip: true, popup: true, sidebar: true }

// Garde-fou contre un JSON pathologique (composition absurdement longue).
export const MAX_COMPOSITION_ENTRIES = 100

const PANEL_MODES: Type_PanelMode[] = ['tooltip', 'popup', 'sidebar']

const isPlainObject = (v: unknown): v is { [k: string]: unknown } =>
  v !== null && typeof v === 'object' && !Array.isArray(v)

const asBool = (v: unknown, fallback: boolean): boolean =>
  typeof v === 'boolean' ? v : fallback

// LECTURE / ÉCRITURE JSON ==========================================================

/** Lit une visibilité depuis du JSON quelconque (champs manquants = défaut). */
export const blockVisibilityFromJSON = (raw: unknown): Type_BlockVisibility => {
  const src = isPlainObject(raw) ? raw : {}
  const out = {} as Type_BlockVisibility
  PANEL_MODES.forEach(mode => {
    out[mode] = asBool(src[mode], DEFAULT_BLOCK_VISIBILITY[mode])
  })
  return out
}

/** Lit une composition depuis du JSON quelconque. Ne jette jamais. */
export const compositionFromJSON = (raw: unknown): Type_Composition => {
  if (!Array.isArray(raw)) return []
  const out: Type_Composition = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (out.length >= MAX_COMPOSITION_ENTRIES) break
    if (!isPlainObject(item)) continue
    const block = item.block
    if (typeof block !== 'string' || block === '') continue
    if (seen.has(block)) continue
    seen.add(block)
    const entry: Type_CompositionEntry = {
      block,
      show: blockVisibilityFromJSON(item.show)
    }
    if (isPlainObject(item.options)) entry.options = { ...item.options }
    out.push(entry)
  }
  return out
}

/** Sérialise une composition (forme stable, sans champ vide superflu). */
export const compositionToJSON = (composition: Type_Composition): Type_JSON[] =>
  composition.map(entry => {
    const json: Type_JSON = {
      block: entry.block,
      show: { ...entry.show }
    }
    if (entry.options && Object.keys(entry.options).length > 0) {
      json.options = { ...entry.options } as Type_JSON
    }
    return json
  })

// REQUÊTES =========================================================================

/** Un bloc est-il visible dans ce contenant ? */
export const isBlockVisibleIn = (
  entry: Type_CompositionEntry,
  mode: Type_PanelMode
): boolean => entry.show[mode] === true

/** Blocs à afficher dans un contenant, DANS L'ORDRE de la composition. */
export const blocksFor = (
  composition: Type_Composition,
  mode: Type_PanelMode
): Type_Composition => composition.filter(entry => isBlockVisibleIn(entry, mode))

/** La cible a-t-elle quelque chose à montrer dans ce contenant ? */
export const hasContentFor = (
  composition: Type_Composition,
  mode: Type_PanelMode
): boolean => composition.some(entry => isBlockVisibleIn(entry, mode))
