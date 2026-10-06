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

// sa#603 — CE QU'UN VOLET SANKEY MONTRE DES DONNÉES : sa LECTURE.
//
// CE QUI A ÉTÉ DEMANDÉ (Alexandre, 05/10, suite de sa#568). Les données restent UNIQUES dans le
// fichier — nœuds, flux, valeurs, étiquettes et leurs assignations. Mais un volet Sankey peut
// choisir, depuis le bandeau sous son en-tête (la règle de sa#594), ce qu'il en MONTRE pour un
// groupe d'étiquettes : l'étiquette de données (année, unité…), le niveau de détail, les étiquettes
// de nœuds et de flux sélectionnées (les filtres). Rien de choisi : il suit la barre générale.
//
// LA LECTURE D'UN GROUPE est ce que le modèle garde sur le groupe lui-même : les étiquettes
// sélectionnées (et l'étiquette générée « sans étiquette », SA#553), l'activation d'un groupe de
// niveaux et, pour les niveaux, l'ÉTAT DES DIMENSIONS de nœuds — agrégé, désagrégé, englobant… —,
// qui est ce que le niveau de détail fait réellement au dessin (cf. `applyLevelSelection`).
//
// Ce module la RELÈVE sur un modèle et la POSE sur un autre, sans jamais toucher à la structure
// (le parent d'une dimension reste celui du modèle qui reçoit) ni redessiner : c'est l'appelant
// qui sait s'il faut un dessin, et lequel. Repris du moteur prototypé en sa#568 (lot 2, retiré).

import type { Class_Sankey } from '../types/Sankey'
import type { Class_DataTagGroup, Class_LevelTagGroup, Class_TagGroup } from '../types/TagGroup'
import type { Type_JSON } from '../types/Utils'

// --- Les réglages de données ----------------------------------------------------------------------

/**
 * LES QUATRE FAMILLES de groupes dont un volet choisit ce qu'il montre, dans l'ordre du menu
 * Transformations : étiquettes de données, niveaux de détail, étiquettes de nœuds, de flux. Les
 * étiquettes de VUE n'en sont pas : c'est la vue de chaque volet qui les porte (sa#581).
 */
export type Type_DataFamily = 'dt' | 'lt' | 'nt' | 'ft'
export const DATA_FAMILIES: readonly Type_DataFamily[] = ['dt', 'lt', 'nt', 'ft']

/** Le réglage de données d'un groupe : `data:<famille>:<groupe>`. */
export const dataSetting = (family: Type_DataFamily, group_id: string): string => `data:${family}:${group_id}`

export const isDataSetting = (setting: string): boolean => setting.startsWith('data:')

export const parseDataSetting = (setting: string): { family: Type_DataFamily, group_id: string } | null => {
  const m = /^data:(dt|lt|nt|ft):(.+)$/.exec(setting)
  return m ? { family: m[1] as Type_DataFamily, group_id: m[2] } : null
}

/** Ce qu'on lit d'un groupe, quelle que soit sa famille. */
type Type_ReadableGroup = { id: string, name: string, tags_list: { id: string, name: string, is_selected: boolean }[] }

const dictOf = (sankey: Class_Sankey, family: Type_DataFamily): { [id: string]: Type_ReadableGroup } => {
  switch (family) {
  case 'dt': return sankey.data_taggs_dict as unknown as { [id: string]: Type_ReadableGroup }
  case 'lt': return sankey.level_taggs_dict as unknown as { [id: string]: Type_ReadableGroup }
  case 'nt': return sankey.node_taggs_dict as unknown as { [id: string]: Type_ReadableGroup }
  case 'ft': return sankey.flux_taggs_dict as unknown as { [id: string]: Type_ReadableGroup }
  }
}

/** Le groupe qu'un réglage de données désigne dans ce modèle, s'il y existe. */
export const groupOfDataSetting = (sankey: Class_Sankey, setting: string): Type_ReadableGroup | undefined => {
  const parsed = parseDataSetting(setting)
  return parsed ? dictOf(sankey, parsed.family)[parsed.group_id] : undefined
}

/**
 * LE RÉGLAGE D'UN GROUPE DE CE MODÈLE, s'il en a un : on le cherche par IDENTITÉ dans chaque famille
 * (deux familles peuvent nommer leurs groupes pareil). `null` pour un groupe de vue ou étranger.
 */
export const dataSettingOfGroup = (sankey: Class_Sankey, group: unknown): string | null => {
  const id = (group as { id?: unknown })?.id
  if (typeof id !== 'string') return null
  const family = DATA_FAMILIES.find(f => dictOf(sankey, f)[id] === group)
  return family ? dataSetting(family, id) : null
}

/** Les réglages de données d'un volet Sankey : tous les groupes du modèle, famille par famille. */
export const sankeyDataSettings = (sankey: Class_Sankey): string[] =>
  DATA_FAMILIES.flatMap(family => Object.keys(dictOf(sankey, family)).map(id => dataSetting(family, id)))

// --- La lecture -----------------------------------------------------------------------------------

/** Ce qu'un volet montre d'un groupe. */
export type Type_GroupReading = {
  /** Les étiquettes sélectionnées, dans l'ordre du groupe. */
  selected: string[]
  /** L'étiquette générée « sans étiquette » (filtres de nœuds et de flux, SA#553). */
  untagged?: boolean
  /** Un groupe de niveaux est-il actif ? */
  activated?: boolean
  /** Niveaux : l'état de la dimension de chaque nœud enfant — sans son parent, qui est du modèle. */
  dims?: { [node_id: string]: Type_JSON }
}

/** La lecture d'un volet, réglage de données par réglage de données. */
export type Type_PaneReading = { [setting: string]: Type_GroupReading }

/** Une entrée de dimension, sans le parent, aux clés triées : de quoi la comparer à une autre. */
const dimFlags = (entry: Type_JSON | undefined): Type_JSON => {
  const out: Type_JSON = {}
  Object.keys(entry ?? {}).sort().forEach(key => {
    if (key !== 'parent_name') out[key] = (entry as Type_JSON)[key]
  })
  return out
}

/** L'état des dimensions de ce groupe de niveaux, nœud enfant par nœud enfant (les neutres omis). */
const levelDimsOf = (sankey: Class_Sankey, group_id: string): { [node_id: string]: Type_JSON } => {
  const out: { [node_id: string]: Type_JSON } = {}
  sankey.nodes_list.forEach(node => {
    if (!node.dimensions_as_child.some(dim => dim.id === group_id)) return
    const flags = dimFlags(node.dimensionsStateToJSON([group_id])[group_id] as Type_JSON | undefined)
    if (Object.keys(flags).length > 0) out[node.id] = flags
  })
  return out
}

/**
 * POSE l'état des dimensions d'un groupe de niveaux, en gardant à chaque nœud le parent que lui
 * donne ce modèle-ci : la lecture d'un volet ne déplace jamais un nœud dans la hiérarchie, même
 * relue d'un fichier plus ancien que la structure. Un nœud déjà dans l'état voulu n'est pas
 * touché — reposer un drapeau réordonne les flux du nœud.
 */
const applyLevelDims = (sankey: Class_Sankey, group_id: string, dims: { [node_id: string]: Type_JSON }): void => {
  sankey.nodes_list.forEach(node => {
    const dim = node.dimensions_as_child.find(d => d.id === group_id)
    if (!dim) return
    const wanted = dimFlags(dims[node.id])
    const current = dimFlags(node.dimensionsStateToJSON([group_id])[group_id] as Type_JSON | undefined)
    if (JSON.stringify(current) === JSON.stringify(wanted)) return
    node.applyDimensionsState({ [group_id]: { ...wanted, parent_name: dim.parent.id } })
  })
}

/** RELÈVE la lecture de ces réglages sur un modèle (un réglage dont le groupe n'existe pas est omis). */
export const readingOf = (sankey: Class_Sankey, settings: string[]): Type_PaneReading => {
  const out: Type_PaneReading = {}
  settings.forEach(setting => {
    const parsed = parseDataSetting(setting)
    const group = groupOfDataSetting(sankey, setting)
    if (!parsed || !group) return
    const reading: Type_GroupReading = { selected: group.tags_list.filter(t => t.is_selected).map(t => t.id) }
    if (parsed.family !== 'dt') {
      const untagged = (group as unknown as Class_TagGroup).untagged_tag
      if (untagged) reading.untagged = untagged.is_selected
    }
    if (parsed.family === 'lt') {
      reading.activated = (group as unknown as Class_LevelTagGroup).activated
      reading.dims = levelDimsOf(sankey, parsed.group_id)
    }
    out[setting] = reading
  })
  return out
}

/** L'empreinte d'une lecture, réglage par réglage : deux lectures égales ont la même. */
export const readingPrintOf = (reading: Type_PaneReading): { [setting: string]: string } => {
  const out: { [setting: string]: string } = {}
  Object.entries(reading).forEach(([setting, r]) => { out[setting] = JSON.stringify(r) })
  return out
}

/** Les réglages dont la lecture diffère d'une empreinte à l'autre (un réglage absent compte). */
export const changedReadingSettings = (
  before: { [setting: string]: string }, after: { [setting: string]: string }
): string[] => [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(s => before[s] !== after[s])

/**
 * POSE une lecture sur un modèle, sans dessiner. Rend `true` si un réglage a été posé.
 *
 * Les étiquettes se choisissent sans redessiner leurs porteurs (`setSelected(false)`) : l'appelant
 * fait UN dessin complet ensuite, la lecture changeant ce qui se voit dans tout le diagramme. Un
 * groupe de données ne reste jamais sans étiquette choisie (même règle que le modèle,
 * `checkSelectionCoherence`).
 */
export const applyReading = (sankey: Class_Sankey, reading: Type_PaneReading): boolean => {
  let any = false
  let levels = false
  Object.entries(reading).forEach(([setting, r]) => {
    const parsed = parseDataSetting(setting)
    const group = groupOfDataSetting(sankey, setting)
    if (!parsed || !group) return
    const wanted = new Set(r.selected)
    if (parsed.family === 'dt') {
      const data_group = group as unknown as Class_DataTagGroup
      data_group.tags_list.forEach(tag => { if (wanted.has(tag.id)) tag.setSelected(); else tag.setUnSelected() })
      if (data_group.selected_tags_list.length === 0) data_group.tags_list[0]?.setSelected()
    } else {
      const tag_group = group as unknown as Class_TagGroup
      tag_group.tags_list.forEach(tag => { if (wanted.has(tag.id)) tag.setSelected(false); else tag.setUnSelected(false) })
      const untagged = tag_group.untagged_tag
      if (untagged && r.untagged !== undefined) {
        if (r.untagged) untagged.setSelected(false)
        else untagged.setUnSelected(false)
      }
      if (parsed.family === 'lt') {
        const level_group = group as unknown as Class_LevelTagGroup
        if (r.activated !== undefined && level_group.activated !== r.activated) level_group.activated = r.activated
        applyLevelDims(sankey, parsed.group_id, r.dims ?? {})
        levels = true
      }
    }
    any = true
  })
  // Un niveau change ce que chaque nœud montre : la visibilité mémorisée se recalcule partout.
  if (levels) sankey.nodes_list.forEach(node => node.dimensionsUpdated())
  return any
}

/** Les réglages de `reading` restreints à `settings`. */
export const pickReading = (reading: Type_PaneReading, settings: string[]): Type_PaneReading => {
  const out: Type_PaneReading = {}
  settings.forEach(s => { if (reading[s]) out[s] = reading[s] })
  return out
}

/** Relit une lecture écrite dans un fichier ; une entrée malformée est ignorée. */
export const readPaneReading = (raw: unknown): Type_PaneReading | undefined => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const out: Type_PaneReading = {}
  Object.entries(raw as { [k: string]: unknown }).forEach(([setting, v]) => {
    if (!parseDataSetting(setting) || !v || typeof v !== 'object' || Array.isArray(v)) return
    const r = v as { [k: string]: unknown }
    if (!Array.isArray(r['selected'])) return
    const reading: Type_GroupReading = {
      selected: r['selected'].filter((x): x is string => typeof x === 'string')
    }
    if (typeof r['untagged'] === 'boolean') reading.untagged = r['untagged']
    if (typeof r['activated'] === 'boolean') reading.activated = r['activated']
    if (r['dims'] && typeof r['dims'] === 'object' && !Array.isArray(r['dims'])) {
      reading.dims = JSON.parse(JSON.stringify(r['dims'])) as { [node_id: string]: Type_JSON }
    }
    out[setting] = reading
  })
  return Object.keys(out).length > 0 ? out : undefined
}
