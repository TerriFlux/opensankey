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

// sa#568 — LES RÉGLAGES PARTAGÉS ENTRE VOLETS : lesquels, avec qui, et comment ils voyagent.
//
// CE QUI A ÉTÉ DEMANDÉ (Alexandre, 02/10, après une première passe par clés de figure qu'il ne
// lisait pas) :
//  - les réglages sont ceux du menu Transformations — positions, attributs et styles des nœuds,
//    des flux et des zones de texte, zone de dessin, échelle —, plus ce qu'on regarde (étiquettes
//    de données, niveau de détail, filtres, élément) ;
//  - pour CHAQUE réglage, on choisit AVEC QUELS VOLETS il est partagé ; la mise en page ne se
//    partage qu'entre volets de même type, les données entre tous ;
//  - à la création d'un volet, TOUT est partagé : un second Sankey est le même que le premier, et
//    c'est en désynchronisant qu'on les fait diverger.
//
// LE MODÈLE : DES GROUPES. Pour un réglage donné, chaque volet appartient au plus à un groupe
// (`Type_MainZoneOccupant.sync[réglage] = identifiant de groupe`) ; deux volets du même groupe
// partagent ce réglage, un volet sans groupe le garde pour lui. Les groupes et non des paires :
// si A suit B et B suit C, A suit C — sans quoi un changement n'aurait pas d'ordre de propagation.
//
// Ce module est PUR (ni interface, ni registre, ni dessin) : c'est ce qui le rend vérifiable.

import type { Class_FigureNature, Type_OptionBag } from './Figure'
import { familyOfKey } from './figureControls'
import { FIGURE_DATA_TAGS_KEY } from '../Charts/FigureNavigation'

/** Comparaison par sérialisation, comme partout ailleurs pour les réglages de figure. */
const sameValue = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b)

// --- Le catalogue ---------------------------------------------------------------------------------

/**
 * LA MISE EN PAGE D'UN VOLET SANKEY, réglage par réglage : les cases du menu Transformations, et
 * le mode d'`updateFrom` que chacune commande (ceux de `PANE_LAYOUT_MODES`, sauf `keepPositionType`
 * qui n'est pas un réglage mais une précaution). Rangées comme le menu les montre : par sorte
 * d'élément, puis positions, attributs, styles ; la zone de dessin et l'échelle à part.
 */
export const SANKEY_LAYOUT_SETTINGS: { mode: string, element: 'node' | 'flux' | 'label' | 'area' }[] = [
  { mode: 'posNode', element: 'node' },
  { mode: 'attrNode', element: 'node' },
  { mode: 'styleNode', element: 'node' },
  { mode: 'posFlux', element: 'flux' },
  { mode: 'attrFlux', element: 'flux' },
  { mode: 'styleFlux', element: 'flux' },
  { mode: 'posFreeLabel', element: 'label' },
  { mode: 'attrFreeLabel', element: 'label' },
  { mode: 'styleFreeLabel', element: 'label' },
  { mode: 'attrDrawingArea', element: 'area' },
  { mode: 'scale', element: 'area' }
]

/** Le réglage qui porte un mode de mise en page Sankey, et l'inverse. */
export const layoutSetting = (mode: string): string => 'layout:' + mode
export const layoutModeOf = (setting: string): string | null =>
  setting.startsWith('layout:') ? setting.slice('layout:'.length) : null
export const SANKEY_LAYOUT_SETTING_IDS = SANKEY_LAYOUT_SETTINGS.map(s => layoutSetting(s.mode))

/**
 * LA MISE EN FORME D'UNE FIGURE, par famille : les onglets de l'inspecteur (Graphe, Forme,
 * Libellé, Valeur, Titre, Légende). Une figure n'a ni positions ni zones de texte ; ce qui
 * correspond chez elle aux cases de Transformations, ce sont ces familles.
 */
export const FIGURE_FORMAT_FAMILIES = ['graph', 'shape', 'name_label', 'value_label', 'title', 'legend']
export const formatSetting = (family: string): string => 'format:' + family

/**
 * LE RÉGLAGE QUI PORTE UNE CLÉ DE FIGURE, ou `null` pour une clé qui ne se partage pas :
 *  - l'IDENTITÉ (le flux de référence d'une étoile, l'endroit où une couronne est descendue) : la
 *    recopier sur un autre volet y désignerait un objet qui n'est pas le sien ;
 *  - l'ÉTIQUETTE DE DONNÉES épinglée : elle relève de ce qu'on regarde (les réglages de données),
 *    pas de la mise en forme ;
 *  - une clé que la nature ne déclare pas.
 * Le reste va à sa famille, et ce qui n'en a pas (l'axe, la profondeur, le centre…) au Graphe.
 */
export const figureSettingOfKey = (nature: Class_FigureNature, key: string): string | null => {
  const sort = nature.sortOf(key)
  if (sort === undefined || sort === 'identity' || key === FIGURE_DATA_TAGS_KEY) return null
  const family = familyOfKey(key) || (nature.config[key]?.ui?.family ?? '')
  return formatSetting(FIGURE_FORMAT_FAMILIES.includes(family) ? family : 'graph')
}

/** Les familles qu'une nature déclare vraiment, dans l'ordre des onglets. */
export const figureFormatSettingsOf = (nature: Class_FigureNature): string[] => {
  const present = new Set<string>()
  nature.declared_keys.forEach(key => {
    const setting = figureSettingOfKey(nature, key)
    if (setting) present.add(setting)
  })
  return FIGURE_FORMAT_FAMILIES.map(formatSetting).filter(s => present.has(s))
}

/**
 * UNE FIGURE, au sens où ses réglages se partagent et s'annulent : une nature qui déclare au moins un
 * réglage de STYLE (couronne, histogramme, étoile…). Le tableur, la documentation ou la vue JSON n'en
 * déclarent pas : leurs « réglages » sont des états d'affichage (un onglet, un mode).
 */
export const isFigureNature = (nature: Class_FigureNature): boolean =>
  nature.declared_keys.some(key => nature.sortOf(key) === 'style')

/** Les clés dont la valeur diffère d'un sac de réglages à l'autre (une clé retirée compte). */
export const changedOptionKeys = (prev: Type_OptionBag, next: Type_OptionBag): string[] =>
  [...new Set([...Object.keys(prev), ...Object.keys(next)])].filter(key => !sameValue(prev[key], next[key])).sort()

/**
 * UN RÉGLAGE DE MISE EN PAGE ne se partage qu'entre volets de MÊME TYPE (deux Sankey, deux
 * couronnes) : une position de nœud n'a pas de sens sur une couronne. Les données — ce qu'on
 * regarde — se partagent entre tous.
 */
export const isLayoutSetting = (setting: string): boolean =>
  setting.startsWith('layout:') || setting.startsWith('format:')

// --- Les groupes ----------------------------------------------------------------------------------

/** Le minimum qu'on lit d'un volet pour raisonner sur les groupes (structurel : testable seul). */
export type Type_SyncPane = { id: string, representation: string, sync?: { [setting: string]: string } }

/** Deux volets PEUVENT-ils partager ce réglage ? (même type pour la mise en page) */
export const canShare = (a: Type_SyncPane, b: Type_SyncPane, setting: string): boolean =>
  a.id !== b.id && (!isLayoutSetting(setting) || a.representation === b.representation)

/** Les AUTRES volets du groupe de `pane` pour ce réglage. */
export const partnersOf = <T extends Type_SyncPane>(panes: T[], pane: T, setting: string): T[] => {
  const group = pane.sync?.[setting]
  if (group === undefined) return []
  return panes.filter(p => p.id !== pane.id && p.sync?.[setting] === group && canShare(pane, p, setting))
}

/** Un identifiant de groupe libre : `g` suivi du plus grand rang employé, plus un. */
export const nextSyncGroupId = (panes: Type_SyncPane[]): string => {
  let max = 0
  panes.forEach(p => Object.values(p.sync ?? {}).forEach(g => {
    const n = /^g(\d+)$/.exec(g)
    if (n) max = Math.max(max, Number(n[1]))
  }))
  return 'g' + (max + 1)
}

/** Retire `pane` de son groupe ; un groupe réduit à un seul volet se dissout (il ne relie rien). */
export const leaveGroup = (panes: Type_SyncPane[], pane: Type_SyncPane, setting: string): void => {
  const group = pane.sync?.[setting]
  if (group === undefined || !pane.sync) return
  delete pane.sync[setting]
  if (Object.keys(pane.sync).length === 0) delete pane.sync
  const rest = panes.filter(p => p.id !== pane.id && p.sync?.[setting] === group)
  if (rest.length === 1) leaveGroup(panes, rest[0], setting)
}

/**
 * `pane` SE SYNCHRONISE SUR `source` pour ce réglage : son groupe — lui et tout ce qui le suivait
 * déjà — FUSIONNE dans celui de `source` (qui en ouvre un s'il n'en a pas).
 *
 * C'est le geste « cocher, dans le menu du volet A, la colonne du volet B » (retour d'Alexandre,
 * 03/10 : « chaque case cochée détermine ce qui sera appliqué au volet actif, et non l'inverse ») :
 * A prend ce que montre B. Fusionner plutôt que de faire quitter son groupe à A, parce que les
 * volets qui suivaient A le suivent toujours — la case de leur colonne, dans le menu de A, reste
 * cochée — et prennent donc la valeur de B avec lui.
 *
 * Rend les volets qui ont CHANGÉ de groupe — ceux qui doivent prendre la valeur de `source` —, ou
 * `null` quand les deux ne peuvent pas partager ce réglage.
 */
export const mergeInto = <T extends Type_SyncPane>(panes: T[], pane: T, source: T, setting: string): T[] | null => {
  if (!canShare(pane, source, setting)) return null
  const mine = pane.sync?.[setting]
  let group = source.sync?.[setting]
  if (mine !== undefined && mine === group) return []
  if (group === undefined) {
    group = nextSyncGroupId(panes)
    source.sync = { ...(source.sync ?? {}), [setting]: group }
  }
  const movers = mine === undefined ? [pane] : panes.filter(p => p.sync?.[setting] === mine)
  movers.forEach(p => { p.sync = { ...(p.sync ?? {}), [setting]: group as string } })
  return movers
}

// --- Ce qui a changé dans un dessin -----------------------------------------------------------------

/**
 * L'EMPREINTE D'UN DESSIN, élément par élément : de quoi savoir, après un geste, QUELS éléments ont
 * changé — pour ne recopier et ne redessiner qu'eux dans les volets synchronisés. Faite sur la
 * sérialisation du dessin (`DrawingAreaPersistence.toJSON`), qui coûte quelques millisecondes là où
 * un dessin complet en coûte plus d'une seconde (mesuré le 03/10 sur 300 nœuds et 500 flux).
 */
export type Type_LayoutPrint = {
  nodes: { [id: string]: string }
  links: { [id: string]: string }
  labels: { [id: string]: string }
  /** Tout ce qui n'est pas un élément : attributs de la zone, légende, échelle. */
  area: string
}

const ELEMENT_FAMILIES = ['nodes', 'links', 'labels'] as const

export const layoutPrintOf = (json: { [key: string]: unknown }): Type_LayoutPrint => {
  const out: Type_LayoutPrint = { nodes: {}, links: {}, labels: {}, area: '' }
  const rest: { [key: string]: unknown } = {}
  Object.entries(json).forEach(([key, value]) => {
    if ((ELEMENT_FAMILIES as readonly string[]).includes(key) && value && typeof value === 'object') {
      const family = out[key as typeof ELEMENT_FAMILIES[number]]
      Object.entries(value as { [id: string]: unknown }).forEach(([id, element]) => {
        family[id] = JSON.stringify(element)
      })
    } else rest[key] = value
  })
  out.area = JSON.stringify(rest)
  return out
}

/** Les éléments qui ont changé (ou sont apparus) d'une empreinte à l'autre. */
export type Type_LayoutChanges = { nodes: string[], links: string[], labels: string[], area: boolean }

export const layoutChangesOf = (before: Type_LayoutPrint, after: Type_LayoutPrint): Type_LayoutChanges => {
  const changed = (a: { [id: string]: string }, b: { [id: string]: string }) =>
    Object.keys(b).filter(id => a[id] !== b[id])
  return {
    nodes: changed(before.nodes, after.nodes),
    links: changed(before.links, after.links),
    labels: changed(before.labels, after.labels),
    area: before.area !== after.area
  }
}

export const hasLayoutChanges = (c: Type_LayoutChanges): boolean =>
  c.area || c.nodes.length > 0 || c.links.length > 0 || c.labels.length > 0

/**
 * LES MODES À REJOUER pour ces changements, parmi ceux que deux volets partagent : rien ne sert de
 * recopier les styles des flux quand seul un nœud a bougé. L'ordre des flux à un nœud (`posFlux`)
 * est porté par le NŒUD (`links_order`) : il suit les nœuds.
 */
export const modesForChanges = (changes: Type_LayoutChanges, shared: string[]): string[] =>
  shared.filter(mode => {
    if (mode === 'attrDrawingArea' || mode === 'scale') return changes.area
    if (mode.endsWith('FreeLabel')) return changes.labels.length > 0
    if (mode === 'posFlux') return changes.nodes.length > 0 || changes.links.length > 0
    if (mode.endsWith('Flux')) return changes.links.length > 0
    if (mode.endsWith('Node')) return changes.nodes.length > 0
    return true
  })

// --- Ce qui voyage --------------------------------------------------------------------------------

/**
 * CE QUI DOIT VOYAGER après un geste sur une figure : les clés dont la valeur EFFECTIVE a changé,
 * rangées par réglage. Une clé RETIRÉE voyage (sous la forme `undefined`, d'où `key in` chez
 * l'appelant) : revenir à la valeur du style est un changement comme un autre.
 */
export const figureChangesBySetting = (
  nature: Class_FigureNature, prev: Type_OptionBag, next: Type_OptionBag
): { [setting: string]: Type_OptionBag } => {
  const out: { [setting: string]: Type_OptionBag } = {}
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)])
  keys.forEach(key => {
    if (sameValue(prev[key], next[key])) return
    const setting = figureSettingOfKey(nature, key)
    if (!setting) return
    out[setting] = { ...(out[setting] ?? {}), [key]: next[key] }
  })
  return out
}

/** La table des groupes relue d'un fichier : des chaînes non vides des deux côtés. */
export const readSyncMap = (raw: unknown): { [setting: string]: string } | undefined => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const out: { [setting: string]: string } = {}
  Object.entries(raw as { [k: string]: unknown }).forEach(([setting, group]) => {
    if (setting !== '' && typeof group === 'string' && group !== '') out[setting] = group
  })
  return Object.keys(out).length > 0 ? out : undefined
}
