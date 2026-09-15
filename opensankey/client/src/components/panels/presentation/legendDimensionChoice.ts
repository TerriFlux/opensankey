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

// SA#552 — Choisir la tranche affichée d'une dimension (année, unité…) depuis la légende.
//
// La ligne de rappel d'une dimension (« Unité : kt PB », zone `legend-datatag-<groupe>`)
// ouvre au clic la liste des étiquettes du groupe ; en choisir une change la tranche
// affichée. Même contenant que la présentation d'un élément (pop-up non épinglée, HTML
// au-dessus du dessin) : il fonctionne donc partout où elle fonctionne, diagramme
// publié compris.
//
// Module LÉGER, comme openPresentation dont il suit les règles : les gestes de canvas
// (NodeEventsHandler) l'importent, il ne doit pas tirer le rendu.

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Class_DataTagGroup } from '../../../types/TagGroup'
import { isLegendDataTagZoneId, legendDataTagZoneId } from '../../../Elements/legendIds'
import { placePopupNear } from './openPresentation'

const DIMENSION_PREFIX = 'legend-dimension:'

/** Id de panneau de la liste d'une dimension, reconnaissable parmi les panneaux ouverts. */
export const legendDimensionPanelId = (group_id: string): string => DIMENSION_PREFIX + group_id

/** Un id de panneau désigne-t-il la liste d'une dimension ? */
export const isLegendDimensionPanelId = (panel_id: string): boolean => panel_id.startsWith(DIMENSION_PREFIX)

/** Id de groupe porté par un id de panneau de dimension. */
export const groupIdOfLegendDimensionPanel = (panel_id: string): string => panel_id.slice(DIMENSION_PREFIX.length)

/** La zone cliquée est-elle la ligne de rappel d'une dimension ? */
export const isLegendDimensionZoneId = isLegendDataTagZoneId

/** Groupe de dimension désigné par son id. */
export const findLegendDimension = (
  app_data: Class_ApplicationData,
  group_id: string
): Class_DataTagGroup | undefined =>
  app_data.drawing_area.sankey.data_taggs_list.find(group => group.id === group_id)

/**
 * Groupe de dimension dont la zone de légende porte cet id. On recalcule l'id de zone de
 * chaque groupe plutôt que de le décoder : il passe par un `slug` qui n'est pas réversible.
 */
export const dimensionOfLegendZone = (
  app_data: Class_ApplicationData,
  zone_id: string
): Class_DataTagGroup | undefined =>
  app_data.drawing_area.sankey.data_taggs_list.find(group => legendDataTagZoneId(group.id) === zone_id)

/**
 * Ouvre la liste de la dimension rappelée par une zone de légende — geste de CLIC, en
 * lecture comme en édition. Renvoie `false` quand il n'y a rien à ouvrir, ou quand le clic
 * n'a fait que REFERMER la liste (bascule, même règle que openPresentationFor).
 */
export const openLegendDimensionChoice = (
  app_data: Class_ApplicationData,
  zone_id: string,
  anchor?: { x: number, y: number }
): boolean => {
  const group = dimensionOfLegendZone(app_data, zone_id)
  if (group === undefined || group.tags_list.length === 0) return false
  const panels = app_data.menu_configuration.panels
  const id = legendDimensionPanelId(group.id)
  if (panels.consumeJustDismissed(id)) return false
  if (panels.getMode(id) === 'popup') return true
  panels.setMode(id, 'popup', { geometry: placePopupNear(app_data, anchor, id), pinned: false })
  return true
}

/** Une dimension en bannière « Plusieurs » affiche plusieurs tranches à la fois. */
export const isMultiDimension = (group: Class_DataTagGroup): boolean => group.banner === 'multi'

/**
 * Applique le choix d'une étiquette dans la liste.
 *
 * Bannière à valeur unique : l'étiquette REMPLACE la sélection, par `selectTagsFromId` — qui
 * porte l'annuler/rétablir, le mode d'affichage de la dimension (#370) et le redessin (légende
 * comprise). Jamais d'écriture de `is_selected` en direct.
 *
 * Bannière « Plusieurs » : l'étiquette ENTRE dans la sélection ou en SORT, dans l'ordre des
 * étiquettes du groupe, sans jamais laisser la dimension sans tranche. `selectTagsFromIds` ne
 * porte pas d'historique : on l'enregistre ici.
 */
export const chooseLegendDimensionTag = (
  app_data: Class_ApplicationData,
  group: Class_DataTagGroup,
  tag_id: string
): void => {
  if (!group.tags_list.some(tag => tag.id === tag_id)) return
  const before = group.selected_tags_list.map(tag => tag.id)
  if (!isMultiDimension(group)) {
    if (before.length === 1 && before[0] === tag_id) return
    group.selectTagsFromId(tag_id)
    return
  }
  const after = before.includes(tag_id)
    ? before.filter(id => id !== tag_id)
    : group.tags_list.map(tag => tag.id).filter(id => id === tag_id || before.includes(id))
  if (after.length === 0) return
  const apply = (ids: string[]) => {
    group.selectTagsFromIds(ids)
    app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
  }
  app_data.history.saveUndo(() => apply(before))
  app_data.history.saveRedo(() => apply(after))
  apply(after)
}
