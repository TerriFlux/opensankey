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

// OS#305 (Lot 3) — Ouverture d'une présentation, ISOLÉE du rendu.
//
// Ce module est volontairement LÉGER : il n'importe que le modèle pur
// (PresentationComposition) et des types. Les gestes de canvas
// (NodeEventsHandler, Link) l'appellent ; s'ils importaient le module de RENDU,
// on refermerait un cycle — PresentationPanels tire les blocs, qui tirent
// ElementsAttributesConfig, qui redescend jusqu'à NodeEventsHandler.

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import {
  compositionFromJSON, containerPolicyFromJSON, resolveOpenContainer
} from '../../../types/PresentationComposition'

const PRESENTATION_PREFIX = 'presentation:'

/** Vue structurelle minimale d'un élément présentable. */
export type Type_Presentable = {
  id: string
  name?: string
  getElementProperty: (k: string) => unknown
}

/** Id de panneau d'un élément, reconnaissable parmi les panneaux ouverts. */
export const presentationPanelId = (element_id: string): string =>
  PRESENTATION_PREFIX + element_id

/** Un id de panneau désigne-t-il une présentation d'élément ? */
export const isPresentationPanelId = (panel_id: string): boolean =>
  panel_id.startsWith(PRESENTATION_PREFIX)

/** Id d'élément porté par un id de panneau de présentation. */
export const elementIdOfPanel = (panel_id: string): string =>
  panel_id.slice(PRESENTATION_PREFIX.length)

/**
 * Ouvre la présentation composée d'un élément dans le contenant que sa politique
 * désigne. Rend `false` — et n'ouvre RIEN — quand l'auteur n'a rien composé :
 * c'est le repli retenu au point ouvert n°2 de l'issue (mieux vaut ne rien
 * ouvrir qu'exposer un panneau vide, ou pire l'inspecteur d'édition).
 */
export const openPresentationFor = (
  app_data: Class_ApplicationData,
  element: Type_Presentable,
  anchor?: { x: number, y: number }
): boolean => {
  const composition = compositionFromJSON(element.getElementProperty('presentation_blocks'))
  const policy = containerPolicyFromJSON(element.getElementProperty('presentation_containers'))
  const mode = resolveOpenContainer(composition, policy)
  if (mode === null) return false
  app_data.menu_configuration.panels.setMode(
    presentationPanelId(element.id),
    mode,
    anchor ? { anchor } : undefined
  )
  return true
}

/** La présentation d'un élément est-elle ouvrable (quelque chose à montrer) ? */
export const canPresent = (element: Type_Presentable): boolean => {
  const composition = compositionFromJSON(element.getElementProperty('presentation_blocks'))
  const policy = containerPolicyFromJSON(element.getElementProperty('presentation_containers'))
  return resolveOpenContainer(composition, policy) !== null
}
