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

// sa#568 — SYNCHRONISER DES RÉGLAGES ENTRE VOLETS, RÉGLAGE PAR RÉGLAGE ET VOLET PAR VOLET.
//
// CE QUI A ÉTÉ DEMANDÉ : l'auteur choisit quels réglages se suivent d'un volet à l'autre —
// « l'année sélectionnée oui, l'axe d'analyse non ». Arbitrage rendu au #566 (23/09) : PAR
// RÉGLAGE ET PAR VOLET. Chaque volet dit, pour chacun de ses réglages, s'il suit les autres ;
// ce n'est ni une règle du document, ni un choix par sorte de réglage (la sorte 'navigation'
// porte à la fois l'année et l'axe, qu'on veut pouvoir séparer).
//
// LA RÈGLE, en une phrase : un changement d'un réglage coché dans un volet est posé sur les
// figures des autres volets qui ont coché LE MÊME réglage. Un volet qui n'a rien coché ne donne
// ni ne reçoit rien — c'est l'état de départ, donc aucun changement de comportement.
//
// CE QUI SE COCHE : les clés que la nature du volet DÉCLARE, sauf celles d'identité. Une clé
// d'identité nomme un objet du sujet (le flux de référence d'une étoile, le chemin où une
// couronne est descendue) : la recopier sur un autre volet y désignerait un objet qui n'est pas
// le sien. C'est la même frontière que celle des styles (`Class_FigureNature.assignStyle`), à
// une différence près, voulue : la NAVIGATION se synchronise, alors qu'elle n'entre jamais dans
// un style. Un style dit comment regarder TOUTE figure ; une synchronisation relie DEUX volets
// que l'auteur a choisis, et l'année est précisément ce qu'il veut leur voir partager.
//
// La clé suit son NOM, pas sa nature : l'année épinglée d'une couronne et celle d'une étoile
// sont la même clé (`data_tags`), et cocher l'année des deux côtés les relie.
//
// Ce module est PUR (ni interface, ni registre) : c'est ce qui le rend vérifiable sous jest.

import type { Class_FigureNature, Type_AttributeSort, Type_OptionBag } from './Figure'

/** Comparaison par sérialisation, comme partout ailleurs pour les réglages de figure. */
const sameValue = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b)

/** L'ordre dans lequel la liste à cocher présente les sortes : ce qu'on regarde d'abord. */
export const PANE_SYNC_SORT_ORDER: Type_AttributeSort[] = ['navigation', 'display', 'style']

/** Ce réglage peut-il se synchroniser d'un volet à l'autre ? Déclaré, et pas d'identité. */
export const isSyncableKey = (nature: Class_FigureNature, key: string): boolean => {
  const sort = nature.sortOf(key)
  return sort !== undefined && sort !== 'identity'
}

/**
 * Les réglages qu'un volet de cette nature peut cocher, rangés par sorte (navigation, affichage,
 * mise en forme), dans l'ordre de déclaration à l'intérieur d'une sorte.
 */
export const syncableKeysOf = (nature: Class_FigureNature): string[] => {
  const keys = nature.declared_keys.filter(key => isSyncableKey(nature, key))
  const rank = (key: string) => PANE_SYNC_SORT_ORDER.indexOf(nature.sortOf(key) ?? 'style')
  return keys
    .map((key, i) => ({ key, i }))
    .sort((a, b) => (rank(a.key) - rank(b.key)) || (a.i - b.i))
    .map(({ key }) => key)
}

/**
 * CE QUI DOIT VOYAGER après un geste : les clés cochées dont la valeur EFFECTIVE a changé.
 *
 * À la différence de la portée « toutes » (`transposableBagChanges`), UNE CLÉ RETIRÉE VOYAGE :
 * retirer l'épingle d'année, c'est revenir à « suit le diagramme », et un volet relié doit y
 * revenir aussi. Elle voyage sous la forme `undefined` — d'où le test `key in out` plutôt que
 * la valeur, chez l'appelant.
 */
export const syncedChanges = (
  prev: Type_OptionBag,
  next: Type_OptionBag,
  synced: readonly string[]
): Type_OptionBag => {
  const out: Type_OptionBag = {}
  synced.forEach(key => {
    if (!sameValue(prev[key], next[key])) out[key] = next[key]
  })
  return out
}

/** La liste des réglages cochés relue d'un fichier : des chaînes non vides, sans doublon. */
export const readSyncedKeys = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  raw.forEach(k => { if (typeof k === 'string' && k !== '' && !out.includes(k)) out.push(k) })
  return out
}
