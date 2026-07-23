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

// OS#305 (Lot 0) — MODÈLE de la « présentation composée par l'auteur ».
//
// L'auteur compose UNE seule liste ordonnée de blocs d'information ; chaque bloc
// porte sa visibilité dans les trois contenants (info-bulle / pop-up / barre
// latérale). Un contenant n'est donc pas une composition à part : c'est un
// NIVEAU DE DÉTAIL de la même liste — l'info-bulle reçoit l'essentiel, la barre
// latérale reçoit tout. (Décision #2 de l'issue : une liste, trois cases.)
//
// Module de DONNÉES PURES (aucune dépendance au modèle ni à React), sur le même
// patron que TooltipBlocks.ts : les couches supérieures lisent l'attribut résolu
// par la cascade de styles et interrogent les helpers ci-dessous.
//
// Vocabulaire : on réutilise `Type_PanelMode` de #300 ('tooltip' | 'popup' |
// 'sidebar') plutôt que d'introduire un second jeu de termes pour les mêmes
// contenants.

import { Type_PanelMode } from './PanelManager'
import { Type_JSON } from './Utils'

/** Visibilité d'un bloc dans chacun des trois contenants. */
export type Type_BlockVisibility = { [mode in Type_PanelMode]: boolean }

/**
 * AJUSTEMENT #5 — PLACEMENT d'un bloc dans un contenant. La disposition est un
 * TABLEAU : des onglets, chacun découpé en colonnes, chaque colonne empilant
 * des rangées. Un bloc occupe donc une cellule (onglet, colonne, rangée).
 *
 * Trois gestes, trois dimensions : ajouter une rangée allonge une colonne,
 * ajouter une colonne partage la largeur, ajouter un onglet ouvre un second
 * tableau. C'est la grammaire de l'ancienne info-bulle (Valeurs / Autres
 * informations / Sankey unitaire), désormais entre les mains de l'auteur.
 *
 * Le placement est PAR CONTENANT : une info-bulle veut deux colonnes serrées là
 * où un panneau latéral, étroit et haut, veut une seule colonne. C'est la même
 * composition, disposée différemment.
 *
 * Plusieurs blocs peuvent partager une cellule ; ils s'y empilent, comme un
 * groupe qu'on déplace d'un bloc.
 */
export type Type_BlockPlacement = { tab: number, col: number, row: number }
export type Type_BlockLayout = { [mode in Type_PanelMode]?: Type_BlockPlacement }

/** Une entrée de composition : un bloc, sa visibilité, sa disposition, ses réglages. */
export type Type_CompositionEntry = {
  /** Identifiant du bloc au catalogue (Lot 1). Volontairement `string` : un id
   *  INCONNU (produit par une version plus récente) reste porté par le modèle. */
  block: string
  show: Type_BlockVisibility
  /** Placement par contenant. ABSENT = disposition par défaut : une rangée pour
   *  soi, dans le premier onglet — c'est-à-dire l'empilement d'avant #5, ce qui
   *  laisse inchangé tout document déjà composé. */
  layout?: Type_BlockLayout
  /** Réglages propres au bloc — opaques ici, interprétés par le bloc (Lot 1). */
  options?: { [key: string]: unknown }
}

/** Composition = liste ORDONNÉE d'entrées (l'ordre est l'ordre d'affichage). */
export type Type_Composition = Type_CompositionEntry[]

/** Un bloc ajouté par l'auteur est visible partout par défaut — il le restreint
 *  ensuite. Même esprit que TooltipBlocks (absent = visible). */
export const DEFAULT_BLOCK_VISIBILITY: Type_BlockVisibility =
  { tooltip: true, popup: true, sidebar: true }

// AJUSTEMENT #4 — il n'y a plus de « politique de contenants » par cible.
//
// Le contenant ne se choisit plus, il se DÉDUIT du geste : le survol n'ouvre
// jamais qu'une info-bulle, le clic n'ouvre jamais d'info-bulle. Reste à
// départager pop-up et panneau, ce que fait l'état de la barre latérale
// (ouverte -> panneau, fermée -> pop-up) — un état que le lecteur pilote
// lui-même. Un réglage d'auteur par élément ne pouvait qu'entrer en conflit
// avec ce geste. Ce qui subsiste ici, c'est la seule question qui garde du
// sens : quels BLOCS apparaissent dans quel contenant.

// Garde-fou contre un JSON pathologique (composition absurdement longue).
export const MAX_COMPOSITION_ENTRIES = 100

const PANEL_MODES: Type_PanelMode[] = ['tooltip', 'popup', 'sidebar']

const isPlainObject = (v: unknown): v is { [k: string]: unknown } =>
  v !== null && typeof v === 'object' && !Array.isArray(v)

const asBool = (v: unknown, fallback: boolean): boolean =>
  typeof v === 'boolean' ? v : fallback

// LECTURE / ÉCRITURE JSON ==========================================================
// Principe de TOLÉRANCE (décision #11) : un JSON abîmé ou plus récent ne doit
// jamais casser l'ouverture. On distingue deux cas :
//  - entrée structurellement invalide (pas d'objet, pas d'id de bloc) -> ignorée ;
//  - bloc INCONNU de cette version -> CONSERVÉ tel quel. C'est volontaire : le
//    laisser tomber ferait perdre le travail de l'auteur dès qu'une version plus
//    ancienne rouvre puis réenregistre le document. Le rendu (Lot 3) se contente
//    de sauter les blocs qu'il ne sait pas dessiner.

/** Lit une visibilité depuis du JSON quelconque (champs manquants = défaut). */
export const blockVisibilityFromJSON = (raw: unknown): Type_BlockVisibility => {
  const src = isPlainObject(raw) ? raw : {}
  const out = {} as Type_BlockVisibility
  PANEL_MODES.forEach(mode => {
    out[mode] = asBool(src[mode], DEFAULT_BLOCK_VISIBILITY[mode])
  })
  return out
}

/** Borne les index d'onglet / de rangée : un JSON abîmé ne doit pas produire une
 *  disposition à 10^9 rangées vides. */
export const MAX_TABS = 8
export const MAX_COLS = 6
export const MAX_ROWS = 40

const asIndex = (v: unknown, max: number): number | null => {
  if (typeof v !== 'number' || !isFinite(v)) return null
  const i = Math.trunc(v)
  return i >= 0 && i < max ? i : null
}

/** Lit un placement. Rend `null` si un index est inexploitable : un placement à
 *  moitié valide vaudrait moins que pas de placement du tout. La colonne, elle,
 *  peut manquer — les placements écrits avant que la disposition ne devienne un
 *  tableau n'en portaient pas ; ils tombent dans la première colonne. */
export const blockPlacementFromJSON = (raw: unknown): Type_BlockPlacement | null => {
  if (!isPlainObject(raw)) return null
  const tab = asIndex(raw.tab, MAX_TABS)
  const row = asIndex(raw.row, MAX_ROWS)
  if (tab === null || row === null) return null
  return { tab, col: raw.col === undefined ? 0 : (asIndex(raw.col, MAX_COLS) ?? 0), row }
}

/** Lit une disposition (placement par contenant). Rend `undefined` si aucun
 *  contenant n'est placé, pour ne pas semer d'objets vides dans le modèle. */
export const blockLayoutFromJSON = (raw: unknown): Type_BlockLayout | undefined => {
  if (!isPlainObject(raw)) return undefined
  const out: Type_BlockLayout = {}
  let any = false
  PANEL_MODES.forEach(mode => {
    const placement = blockPlacementFromJSON(raw[mode])
    if (placement !== null) { out[mode] = placement; any = true }
  })
  return any ? out : undefined
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
    // Un même bloc ne figure qu'une fois : on garde la PREMIÈRE occurrence.
    if (seen.has(block)) continue
    seen.add(block)
    const entry: Type_CompositionEntry = {
      block,
      show: blockVisibilityFromJSON(item.show)
    }
    const layout = blockLayoutFromJSON(item.layout)
    if (layout) entry.layout = layout
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
    if (entry.layout && Object.keys(entry.layout).length > 0) {
      json.layout = { ...entry.layout } as unknown as Type_JSON
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

/** La cible a-t-elle quelque chose à montrer dans ce contenant ? Sert au repli
 *  « rien de composé -> pas d'ouverture » (point ouvert n°2 de l'issue). */
export const hasContentFor = (
  composition: Type_Composition,
  mode: Type_PanelMode
): boolean => composition.some(entry => isBlockVisibleIn(entry, mode))

// DISPOSITION (ajustement #5) ======================================================

/** Une cellule : les blocs qui l'occupent, empilés, dans l'ordre. */
export type Type_LayoutCell = Type_CompositionEntry[]
/** Une colonne : ses cellules, de haut en bas. */
export type Type_LayoutColumn = Type_LayoutCell[]
/** Un onglet : ses colonnes, de gauche à droite. */
export type Type_LayoutTab = Type_LayoutColumn[]

/**
 * Résout la disposition d'un contenant : onglets -> colonnes -> cellules -> blocs.
 *
 * Point de vérité UNIQUE, partagé par le rendu lecteur et par l'éditeur — les
 * deux doivent voir exactement la même chose, sans quoi l'auteur composerait à
 * l'aveugle.
 *
 * Trois règles, dans cet ordre :
 *  1. seuls les blocs VISIBLES dans ce contenant participent ;
 *  2. un bloc PLACÉ va à sa cellule ; plusieurs blocs dans la même cellule s'y
 *     empilent, dans l'ordre de la composition ;
 *  3. un bloc NON PLACÉ prend une rangée pour lui, à la suite, dans la première
 *     colonne du premier onglet — ce qui reproduit l'empilement d'avant #5 pour
 *     un document qui n'a jamais été disposé.
 *
 * Onglets, colonnes et rangées VIDES sont COMPACTÉS : l'auteur peut vider la
 * colonne du milieu sans laisser une bande blanche chez son lecteur.
 */
export const layoutFor = (
  composition: Type_Composition,
  mode: Type_PanelMode
): Type_LayoutTab[] => {
  const visible = blocksFor(composition, mode)
  // Les non-placés passent APRÈS les placés de la première colonne, chacun sur
  // sa propre rangée, en gardant l'ordre de la liste.
  const cells = new Map<string, { tab: number, col: number, row: number, blocks: Type_LayoutCell }>()
  let next_free_row = MAX_ROWS
  visible.forEach(entry => {
    const placement = entry.layout?.[mode]
    const tab = placement ? placement.tab : 0
    const col = placement ? placement.col : 0
    const row = placement ? placement.row : next_free_row++
    const key = tab + ':' + col + ':' + row
    const cell = cells.get(key)
    if (cell) cell.blocks.push(entry)
    else cells.set(key, { tab, col, row, blocks: [entry] })
  })

  const sorted = [...cells.values()]
    .sort((a, b) => a.tab - b.tab || a.col - b.col || a.row - b.row)
  const tabs: Type_LayoutTab[] = []
  const tab_index = new Map<number, number>()
  const col_index = new Map<string, number>()
  sorted.forEach(cell => {
    let ti = tab_index.get(cell.tab)
    if (ti === undefined) { ti = tabs.length; tab_index.set(cell.tab, ti); tabs.push([]) }
    const col_key = cell.tab + ':' + cell.col
    let ci = col_index.get(col_key)
    if (ci === undefined) { ci = tabs[ti].length; col_index.set(col_key, ci); tabs[ti].push([]) }
    tabs[ti][ci].push(cell.blocks)
  })
  return tabs
}

/**
 * Fige la disposition COURANTE d'un contenant en placements explicites.
 *
 * `layoutFor` compacte : des rangées stockées 0 et 5 s'affichent en 0 et 1. Sans
 * cette remise à plat, l'éditeur travaillerait sur des index affichés qui ne
 * désignent pas les rangées stockées — déposer sur « la deuxième rangée »
 * créerait une rangée intercalaire au lieu de rejoindre celle qu'on vise. Après
 * normalisation, index affiché = index stocké, et le geste devient littéral.
 *
 * Ne change RIEN à ce qui est affiché : c'est la même disposition, écrite
 * explicitement.
 */
export const normalizeLayout = (
  composition: Type_Composition,
  mode: Type_PanelMode
): Type_Composition => {
  const placements = new Map<string, Type_BlockPlacement>()
  layoutFor(composition, mode).forEach((cols, tab) => {
    cols.forEach((rows, col) => {
      rows.forEach((cell, row) => {
        cell.forEach(entry => placements.set(entry.block, { tab, col, row }))
      })
    })
  })
  return composition.map(e => {
    const placement = placements.get(e.block)
    return placement
      ? { ...e, layout: { ...(e.layout ?? {}), [mode]: placement } }
      : e
  })
}

/**
 * Normalise les TROIS contenants d'un coup — à appeler avant toute édition de
 * disposition.
 *
 * Sans placement, un bloc se range d'après l'ordre de la composition. L'éditeur,
 * lui, a besoin de réordonner cette liste pour dire « ce bloc-ci vient avant
 * celui-là dans la rangée » ; ce réordonnancement déplacerait alors, en douce,
 * les blocs non placés des DEUX AUTRES contenants. Les figer d'abord rend
 * l'ordre de la liste sans effet sur l'affichage, donc l'édition d'un contenant
 * inoffensive pour les autres.
 */
export const normalizeAllLayouts = (composition: Type_Composition): Type_Composition =>
  PANEL_MODES.reduce((acc, mode) => normalizeLayout(acc, mode), composition)

/** Étiquettes d'onglets par contenant, rédigées par l'auteur. Une étiquette vide
 *  ou absente laisse le rendu nommer l'onglet d'après son premier bloc. */
export type Type_TabLabels = { [mode in Type_PanelMode]?: string[] }

export const tabLabelsFromJSON = (raw: unknown): Type_TabLabels => {
  if (!isPlainObject(raw)) return {}
  const out: Type_TabLabels = {}
  PANEL_MODES.forEach(mode => {
    const list = raw[mode]
    if (!Array.isArray(list)) return
    out[mode] = list.slice(0, MAX_TABS).map(v => (typeof v === 'string' ? v : ''))
  })
  return out
}

export const tabLabelsToJSON = (labels: Type_TabLabels): Type_JSON => {
  const out: Type_JSON = {}
  PANEL_MODES.forEach(mode => {
    const list = labels[mode]
    // On n'écrit que ce qui porte au moins un nom : sinon le JSON se remplit de
    // tableaux de chaînes vides à chaque ouverture du composeur.
    if (list && list.some(s => s.trim() !== '')) out[mode] = [...list]
  })
  return out
}

/** Étiquette de l'onglet `index` pour ce contenant ('' si l'auteur n'en a pas mis). */
export const tabLabelAt = (
  labels: Type_TabLabels,
  mode: Type_PanelMode,
  index: number
): string => labels[mode]?.[index] ?? ''

/** Renomme un onglet (immuable ; complète le tableau au besoin). */
export const setTabLabel = (
  labels: Type_TabLabels,
  mode: Type_PanelMode,
  index: number,
  label: string
): Type_TabLabels => {
  if (index < 0 || index >= MAX_TABS) return labels
  const list = [...(labels[mode] ?? [])]
  while (list.length <= index) list.push('')
  list[index] = label
  return { ...labels, [mode]: list }
}

/**
 * Place un bloc dans un contenant — le geste unique de l'éditeur par
 * glisser-déposer. Rend une composition dans laquelle le bloc est VISIBLE dans
 * ce contenant (on ne dépose pas un bloc là où il ne s'afficherait pas) et placé
 * en (tab, row).
 */
export const placeBlock = (
  composition: Type_Composition,
  block: string,
  mode: Type_PanelMode,
  placement: Type_BlockPlacement
): Type_Composition => {
  if (placement.tab < 0 || placement.tab >= MAX_TABS) return composition
  if (placement.col < 0 || placement.col >= MAX_COLS) return composition
  if (placement.row < 0 || placement.row >= MAX_ROWS) return composition
  return composition.map(e => e.block === block
    ? {
      ...e,
      show: { ...e.show, [mode]: true },
      layout: { ...(e.layout ?? {}), [mode]: { ...placement } }
    }
    : e)
}

/** Retire un bloc d'un contenant : il n'y est plus visible, et son placement y
 *  est oublié (le rapatrier plus tard doit repartir d'une rangée propre). */
export const unplaceBlock = (
  composition: Type_Composition,
  block: string,
  mode: Type_PanelMode
): Type_Composition => composition.map(e => {
  if (e.block !== block) return e
  const layout = { ...(e.layout ?? {}) }
  delete layout[mode]
  const next: Type_CompositionEntry = { ...e, show: { ...e.show, [mode]: false } }
  if (Object.keys(layout).length > 0) next.layout = layout
  else delete next.layout
  return next
})

/** Oublie toute disposition d'un contenant : retour à l'empilement, un bloc par
 *  rangée, sans toucher à ce qui y est visible. */
export const clearLayout = (
  composition: Type_Composition,
  mode: Type_PanelMode
): Type_Composition => composition.map(e => {
  if (!e.layout?.[mode]) return e
  const layout = { ...e.layout }
  delete layout[mode]
  const next = { ...e }
  if (Object.keys(layout).length > 0) next.layout = layout
  else delete next.layout
  return next
})

// ÉDITION (helpers immuables, utilisés par l'UI de composition au Lot 2) ===========

/** Ajoute un bloc en fin de composition (sans doublon). */
export const addBlock = (
  composition: Type_Composition,
  block: string,
  show: Type_BlockVisibility = DEFAULT_BLOCK_VISIBILITY
): Type_Composition =>
  composition.some(e => e.block === block) || composition.length >= MAX_COMPOSITION_ENTRIES
    ? composition
    : [...composition, { block, show: { ...show } }]

/** Retire un bloc. */
export const removeBlock = (
  composition: Type_Composition,
  block: string
): Type_Composition => composition.filter(e => e.block !== block)

/** Bascule la visibilité d'un bloc dans un contenant. */
export const toggleBlockVisibility = (
  composition: Type_Composition,
  block: string,
  mode: Type_PanelMode
): Type_Composition => composition.map(e =>
  e.block === block ? { ...e, show: { ...e.show, [mode]: !e.show[mode] } } : e)

/** Déplace un bloc à un nouvel index (réordonnancement par glisser, Lot 2). */
export const moveBlock = (
  composition: Type_Composition,
  from: number,
  to: number
): Type_Composition => {
  if (from < 0 || from >= composition.length) return composition
  const clamped = Math.max(0, Math.min(to, composition.length - 1))
  if (clamped === from) return composition
  const next = [...composition]
  const [moved] = next.splice(from, 1)
  next.splice(clamped, 0, moved)
  return next
}
