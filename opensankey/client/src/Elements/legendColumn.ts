// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// os#1511 / os#1527 — CE QUE MONTRE LA LÉGENDE EN COLONNE, sans React ni modèle : le filtre « seule la
// dimension qui porte la couleur » (lu par la colonne ET par l'export), et la ligne qui résume la
// navigation en tête de la légende exportée (« Volailles · 2023 · kt »).
//
// Module léger (types structurels, deux modules feuilles) : l'export (`ApplicationData`) l'importe
// sans tirer le panneau React, et un test le charge seul.

import type { Type_LegendItem } from './legendItems'
import { LEGEND_BLOCK_PREFIX, isLegendDataTagZoneId, legendSlug } from './legendIds'
import { pluralGroupName } from './titleTokens'

/** Ce que le filtre lit d'une dimension (groupe de dataTags). */
export type Type_DimensionForColumn = {
  id: string
  name: string
  draws_bands?: boolean
  paints_member_bands_flows?: boolean
  selected_tags_list: { display_name?: string, name: string }[]
}

/** Ce que le filtre lit de l'application. */
export type Type_AppForColumn = {
  drawing_area: {
    legend: { tagGroupIdOfTitle(zone_id: string): string | undefined }
    sankey: { data_taggs_list: unknown[] }
  }
}

/**
 * os#1511 (Julien, 10/10 : « la légende montre le dataTag qui porte la couleur ») — LA dimension qui
 * colore le dessin : celle qui fait des bandes à plusieurs membres colore les flux à la place de toute
 * autre ; sans bandes, celle qui peint les flux. `undefined` : aucune.
 */
export const legendColorerOf = <T extends Type_DimensionForColumn>(dims: readonly T[]): T | undefined =>
  dims.find(g => g.draws_bands === true && g.selected_tags_list.length > 1)
  ?? dims.find(g => g.paints_member_bands_flows === true)

/**
 * os#1511 (Julien, 10/10 : « je ne pense pas qu'il faille garder la légende pour les choses qui ne
 * sont pas de la couleur ») — LA COLONNE NE LÉGENDE QUE CE QUI EST EN COULEUR : une dimension de
 * données n'y paraît que si ses couleurs se voient sur le dessin. Les autres se choisissent dans la
 * navigation, en haut de la même colonne (et l'export les résume en une ligne, `navigationSummary`).
 *
 * `titleGroupOf` : groupe que désigne un titre de bloc ; par défaut le relevé de la légende.
 */
export const colouredLegendItems = (
  app_data: Type_AppForColumn,
  items: readonly Type_LegendItem[],
  titleGroupOf?: (zone_id: string) => string | undefined
): readonly Type_LegendItem[] => {
  const legend = app_data.drawing_area.legend
  const groupOfTitle = titleGroupOf ?? ((id: string) => legend.tagGroupIdOfTitle(id))
  const dims = app_data.drawing_area.sankey.data_taggs_list as Type_DimensionForColumn[]
  const colorer = legendColorerOf(dims)
  const hidden = new Set(dims.filter(g => g !== colorer).map(g => g.id))
  if (hidden.size === 0) return items
  // Les BLOCS des dimensions écartées (titre compris, que `tagGroupIdOfTitle` ne rattache pas
  // toujours), et les lignes de rappel « Année : 2023 ▾ », qui se choisissent dans la navigation.
  const hidden_blocks = new Set([...hidden].map(id => LEGEND_BLOCK_PREFIX + legendSlug(id)))
  return items.filter(item => {
    if (isLegendDataTagZoneId(item.id)) return false
    if (item.block_id !== undefined && hidden_blocks.has(item.block_id)) return false
    const group = item.tag_group_id ?? groupOfTitle(item.id)
    return group === undefined || !hidden.has(group)
  })
}

/**
 * os#1527 (arbitrage de Julien, 10/10) — LA LIGNE QUI RÉSUME LA NAVIGATION en tête de la légende
 * exportée : le membre choisi de chaque dimension qui ne porte pas la couleur (« Volailles · 2023 ·
 * kt »), ou « Sélection de filières » quand plusieurs sont montrés — le même mot que le titre
 * (`TextZone.name_label_effective`). Une image exportée n'a pas de navigation : c'est la seule trace
 * de ce qu'elle montre. Vide : aucune dimension à résumer.
 */
export const navigationSummary = (
  dims: readonly Type_DimensionForColumn[],
  t?: (key: string, options?: { [k: string]: unknown }) => unknown
): string => {
  const colorer = legendColorerOf(dims)
  return dims
    .filter(g => g !== colorer)
    .map(g => {
      const tags = g.selected_tags_list
      if (tags.length === 0) return ''
      if (tags.length === 1) return tags[0].display_name ?? tags[0].name
      const plural = pluralGroupName(g.name)
      const translated = t ? t('Banner.title_selection', { name: plural, defaultValue: 'Sélection de {{name}}' }) : undefined
      return typeof translated === 'string' && translated !== '' ? translated : `Sélection de ${plural}`
    })
    .filter(s => s !== '')
    .join(' · ')
}
