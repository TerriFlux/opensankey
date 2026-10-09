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

// sa#622 — LA MISE EN FORME PROPRE D'UN VOLET (`Type_MainZoneOccupant.look`).
//
// Un Sankey unitaire dessine les nœuds et les flux du diagramme dans une vignette par nœud. Ses
// réglages de figure vivent dans chaque vignette (`Class_Figure`) ; deux choses, elles, valent pour
// LE VOLET et ne se rangent dans aucune vignette :
//
//  - le CADRE : un titre et une légende dessinés UNE FOIS pour tout le volet, au-dessus et autour
//    de sa grille (arbitrage Alexandre, 09/10/2026) — les clés `title_*` et `legend_*` du catalogue
//    des figures, rangées ici plutôt que sur une vignette ;
//  - les RETOUCHES d'élément : la couleur, la forme, le libellé qu'on donne à un nœud ou à un flux
//    en le touchant dans une vignette. Elles valent pour CET ÉLÉMENT DU DIAGRAMME dans toutes les
//    vignettes du volet où il paraît (arbitrage Alexandre, 09/10/2026 : « le même élément ») — donc
//    rangées par l'identifiant de l'élément dans le document SOURCE, jamais par celui de son proxy
//    d'étoile, qui change à chaque rebâtissage.
//
// Le diagramme n'est pas touché : une retouche faite dans le volet ne s'écrit que dans le volet.
//
// MODULE FEUILLE : aucun import, comme `paneValueMode`. Le modèle (MenuConfig) et le dessin (OS+)
// le lisent tous deux.

/** Un sac de réglages : clé d'attribut → valeur. */
export type Type_PaneLookBag = { [key: string]: unknown }

/** Les deux familles d'éléments qu'un volet retouche. */
export type Type_PaneLookKind = 'nodes' | 'links'

export type Type_PaneLook = {
  /** Le titre et la légende du volet (`title_*`, `legend_*`). */
  frame?: Type_PaneLookBag
  /** Les retouches de nœuds, par identifiant du nœud dans la source. */
  nodes?: { [element_id: string]: Type_PaneLookBag }
  /** Les retouches de flux, par identifiant du flux dans la source. */
  links?: { [element_id: string]: Type_PaneLookBag }
}

const isBag = (v: unknown): v is Type_PaneLookBag =>
  v !== null && typeof v === 'object' && !Array.isArray(v)

/** Une copie profonde, par sérialisation : les valeurs sont celles d'un fichier. */
const cloneBag = (bag: Type_PaneLookBag): Type_PaneLookBag =>
  JSON.parse(JSON.stringify(bag)) as Type_PaneLookBag

/** Le réglage est-il vide (rien à écrire dans le fichier) ? */
export const isEmptyPaneLook = (look: Type_PaneLook | undefined | null): boolean =>
  !look || (
    (!look.frame || Object.keys(look.frame).length === 0) &&
    (!look.nodes || Object.keys(look.nodes).length === 0) &&
    (!look.links || Object.keys(look.links).length === 0)
  )

/**
 * LU D'UN FICHIER (ou d'une vue) : ce qui n'a pas la forme attendue est ignoré, un sac vide aussi.
 * `undefined` quand il n'y a rien — la clé ne se réécrira pas.
 */
export const readPaneLook = (raw: unknown): Type_PaneLook | undefined => {
  if (!isBag(raw)) return undefined
  const look: Type_PaneLook = {}
  if (isBag(raw['frame']) && Object.keys(raw['frame']).length > 0) look.frame = cloneBag(raw['frame'])
  ;(['nodes', 'links'] as const).forEach(kind => {
    const by_id = raw[kind]
    if (!isBag(by_id)) return
    const kept: { [element_id: string]: Type_PaneLookBag } = {}
    Object.entries(by_id).forEach(([id, bag]) => {
      if (isBag(bag) && Object.keys(bag).length > 0) kept[id] = cloneBag(bag)
    })
    if (Object.keys(kept).length > 0) look[kind] = kept
  })
  return isEmptyPaneLook(look) ? undefined : look
}

/** La forme écrite dans le fichier : une copie, ou `undefined` quand il n'y a rien à écrire. */
export const paneLookToJSON = (look: Type_PaneLook | undefined): Type_PaneLookBag | undefined =>
  isEmptyPaneLook(look) ? undefined : readPaneLook(JSON.parse(JSON.stringify(look))) as Type_PaneLookBag

/** Comparaison par sérialisation, comme partout ailleurs pour les réglages de figure. */
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b)

/**
 * POSE (ou retire, `value === undefined`) LA RETOUCHE `key` DE L'ÉLÉMENT `element_id`. Rend le
 * nouveau réglage — `undefined` s'il est devenu vide — et `changed` faux quand rien n'a bougé.
 * Pure : le réglage reçu n'est pas modifié.
 */
export const withPaneElementStyle = (
  look: Type_PaneLook | undefined,
  kind: Type_PaneLookKind,
  element_id: string,
  key: string,
  value: unknown
): { look: Type_PaneLook | undefined, changed: boolean } => {
  const current = look?.[kind]?.[element_id]?.[key]
  if (value === undefined ? current === undefined : same(current, value)) return { look, changed: false }
  const next: Type_PaneLook = readPaneLook(look ?? {}) ?? {}
  const by_id = { ...(next[kind] ?? {}) }
  const bag = { ...(by_id[element_id] ?? {}) }
  if (value === undefined) delete bag[key]
  else bag[key] = JSON.parse(JSON.stringify(value)) as unknown
  if (Object.keys(bag).length > 0) by_id[element_id] = bag
  else delete by_id[element_id]
  if (Object.keys(by_id).length > 0) next[kind] = by_id
  else delete next[kind]
  return { look: isEmptyPaneLook(next) ? undefined : next, changed: true }
}

/** REMPLACE LE CADRE (titre, légende) du volet. Même contrat que `withPaneElementStyle`. */
export const withPaneFrame = (
  look: Type_PaneLook | undefined,
  frame: Type_PaneLookBag
): { look: Type_PaneLook | undefined, changed: boolean } => {
  const kept: Type_PaneLookBag = {}
  Object.entries(frame).forEach(([k, v]) => { if (v !== undefined) kept[k] = v })
  if (same(look?.frame ?? {}, kept)) return { look, changed: false }
  const next: Type_PaneLook = readPaneLook(look ?? {}) ?? {}
  if (Object.keys(kept).length > 0) next.frame = cloneBag(kept)
  else delete next.frame
  return { look: isEmptyPaneLook(next) ? undefined : next, changed: true }
}
