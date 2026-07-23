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

/** Une entrée de composition : un bloc, sa visibilité, ses réglages propres. */
export type Type_CompositionEntry = {
  /** Identifiant du bloc au catalogue (Lot 1). Volontairement `string` : un id
   *  INCONNU (produit par une version plus récente) reste porté par le modèle. */
  block: string
  show: Type_BlockVisibility
  /** Réglages propres au bloc — opaques ici, interprétés par le bloc (Lot 1). */
  options?: { [key: string]: unknown }
}

/** Composition = liste ORDONNÉE d'entrées (l'ordre est l'ordre d'affichage). */
export type Type_Composition = Type_CompositionEntry[]

/** Politique de contenants d'une cible : contenant par défaut + alternatives
 *  permises (décision #7 : un choix unique + des cases, pas deux booléens
 *  arbitrés par une règle de priorité cachée). */
export type Type_ContainerPolicy = {
  default: Type_PanelMode
  allow: { [mode in Type_PanelMode]: boolean }
}

/** Un bloc ajouté par l'auteur est visible partout par défaut — il le restreint
 *  ensuite. Même esprit que TooltipBlocks (absent = visible). */
export const DEFAULT_BLOCK_VISIBILITY: Type_BlockVisibility =
  { tooltip: true, popup: true, sidebar: true }

/** Défaut de politique : pop-up (elle se superpose, donc n'impose rien au
 *  lecteur), les trois contenants restant permis. */
export const DEFAULT_CONTAINER_POLICY: Type_ContainerPolicy = {
  default: 'popup',
  allow: { tooltip: true, popup: true, sidebar: true }
}

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

/** Lit une politique de contenants depuis du JSON quelconque. */
export const containerPolicyFromJSON = (raw: unknown): Type_ContainerPolicy => {
  const src = isPlainObject(raw) ? raw : {}
  const raw_default = src.default
  const def: Type_PanelMode = (typeof raw_default === 'string'
    && PANEL_MODES.includes(raw_default as Type_PanelMode))
    ? raw_default as Type_PanelMode
    : DEFAULT_CONTAINER_POLICY.default
  const raw_allow = isPlainObject(src.allow) ? src.allow : {}
  const allow = {} as Type_ContainerPolicy['allow']
  PANEL_MODES.forEach(mode => {
    allow[mode] = asBool(raw_allow[mode], DEFAULT_CONTAINER_POLICY.allow[mode])
  })
  // INVARIANT : le contenant par défaut est toujours permis (sinon la cible
  // n'aurait aucun contenant à ouvrir).
  allow[def] = true
  return { default: def, allow }
}

/** Sérialise une politique de contenants. */
export const containerPolicyToJSON = (policy: Type_ContainerPolicy): Type_JSON => ({
  default: policy.default,
  allow: { ...policy.allow }
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

/** Contenants réellement ouvrables pour une cible : permis par la politique ET
 *  pourvus d'au moins un bloc visible. */
export const openableContainers = (
  composition: Type_Composition,
  policy: Type_ContainerPolicy
): Type_PanelMode[] =>
  PANEL_MODES.filter(mode => policy.allow[mode] && hasContentFor(composition, mode))

/** Contenant à ouvrir pour une cible : le défaut s'il est ouvrable, sinon le
 *  premier ouvrable, sinon `null` (rien à montrer). */
export const resolveOpenContainer = (
  composition: Type_Composition,
  policy: Type_ContainerPolicy
): Type_PanelMode | null => {
  const openable = openableContainers(composition, policy)
  if (openable.length === 0) return null
  return openable.includes(policy.default) ? policy.default : openable[0]
}

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
