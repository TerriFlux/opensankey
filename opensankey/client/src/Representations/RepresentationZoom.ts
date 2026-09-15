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

// os#1409 - A QUI PARLE LE CONTROLE DE ZOOM DE LA COLONNE D'OUTILS.
//
// Meme forme que `CreationToolScope` (os#1401), et volontairement : la fenetre active de la
// grande zone, sa nature, puis ce que cette nature declare. Ce module ne decide PAS de
// l'affichage - il dit a quelle capacite le geste s'adresse, et `ComponentZoomControl` en tire
// le pourcentage, les boutons et, quand il n'y a rien, la raison du grisage.
//
// FONCTIONS PURES sur des entrees primitives : aucune dependance React ni DOM, donc testables
// sans monter d'application. C'est ce qui permet de figer la regle plutot que son affichage.

import type { Class_ApplicationData } from '../types/ApplicationData'
import { MAIN_ZONE_CANVAS_ID } from '../types/MenuConfig'
import { activeWindowRepresentation } from '../types/CreationToolScope'
import {
  representation_registry,
  type Type_RepresentationContext,
  type Type_RepresentationZoom
} from './RepresentationRegistry'

/**
 * Le cran des boutons -/+ : racine de deux, donc deux crans par doublement. C'est le pas que le
 * diagramme utilise depuis toujours ; il sert de defaut aux natures qui n'en nomment pas d'autre.
 */
export const DEFAULT_ZOOM_STEP = Math.SQRT2

/**
 * LA CAPACITE DU DIAGRAMME : la transformation d3 existante, telle quelle. Rien ne change pour
 * lui - c'est le cas de non-regression du lot, et c'est pour cela que `scaleBy` est declare
 * plutot que laisse au controle : `zoomByFactor` passe par `zoomListener.scaleBy`, qui conserve
 * l'ancrage au centre du viewport, l'animation et le `scaleExtent` de d3.
 *
 * `neutral: 1` : pour le diagramme, 100 % est l'echelle d'une PAGE VIDE. Les bornes sont celles
 * du `scaleExtent` du zoomListener ([0,05 ; 20]) - les recopier ici ne les impose pas, d3 les
 * fait deja respecter ; elles servent au controle a eteindre le bouton qui n'a plus de course.
 */
export const DIAGRAM_ZOOM: Type_RepresentationZoom = {
  getScale: (ctx) => ctx.app_data.drawing_area.getZoomScale(),
  setScale: (k, ctx) => ctx.app_data.drawing_area.zoomToScale(k),
  scaleBy: (factor, ctx) => ctx.app_data.drawing_area.zoomByFactor(factor),
  step: DEFAULT_ZOOM_STEP,
  min: 0.05,
  max: 20,
  neutral: 1
}

/** La capacite trouvee, avec de quoi l'appeler : le contexte de la fenetre visee. */
export type Type_ActiveWindowZoom = {
  /** Id de registre de la nature qui zoome - celui que l'infobulle nomme. */
  representation_id: string
  zoom: Type_RepresentationZoom
  ctx: Type_RepresentationContext
}

/** L'echelle neutre declaree, ou 1 : le denominateur du pourcentage affiche. */
const neutralOf = (zoom: Type_RepresentationZoom): number =>
  (typeof zoom.neutral === 'number' && zoom.neutral > 0) ? zoom.neutral : 1

/** Le pas declare, ou le defaut. Un pas <= 1 n'avancerait jamais : il est ignore. */
const stepOf = (zoom: Type_RepresentationZoom): number =>
  (typeof zoom.step === 'number' && zoom.step > 1) ? zoom.step : DEFAULT_ZOOM_STEP

/**
 * CE QUE ZOOME LE CONTROLE, ou `null` quand la fenetre active ne zoome pas.
 *
 * PERMISSIF QUAND IL N'Y A PAS DE FENETRE, comme `toolAppliesToActiveWindow` : le viewer MIT
 * (os#1383) rend ce controle et n'a PAS de grande zone, le plateau unitaire d'OS+ et les tests
 * non plus. Sans fenetre active, on retombe donc sur la ZONE DE DESSIN - la casser ici ferait
 * perdre son zoom a un viewer embarque sans que rien ne le signale.
 *
 * Et le diagramme garde sa capacite MEME SI LE REGISTRE EST VIDE : un viewer qui n'appelle
 * jamais `registerBaseRepresentations` (rien ne l'y oblige, il n'a pas de selecteur de nature)
 * doit continuer a zoomer. Le registre, quand il est peuple, reste prioritaire : une couche
 * superieure peut remplacer l'entree du canevas, capacite de zoom comprise.
 */
export const activeWindowZoom = (
  app_data: Class_ApplicationData
): Type_ActiveWindowZoom | null => {
  const mc = app_data?.menu_configuration
  if (!app_data?.drawing_area) return null
  const representation_id = activeWindowRepresentation(app_data) ?? MAIN_ZONE_CANVAS_ID
  const entry = representation_registry.get(representation_id)
  const zoom = entry?.zoom ??
    (representation_id === MAIN_ZONE_CANVAS_ID ? DIAGRAM_ZOOM : undefined)
  if (!zoom) return null
  const ctx: Type_RepresentationContext = {
    app_data,
    scale: entry?.scale ?? 'diagram',
    element: null,
    options: {},
    // La fenetre visee, et non seulement sa nature : deux fenetres peuvent montrer la meme
    // (os#1385). Aucune capacite ne s'en sert encore ; celle qui en aura besoin la trouvera.
    window_id: mc?.main_zone_active_id ?? undefined
  }
  if (zoom.isAvailable && !zoom.isAvailable(ctx)) return null
  return { representation_id, zoom, ctx }
}

/** Le pourcentage a afficher : l'echelle courante rapportee a l'echelle neutre de la nature. */
export const activeZoomPercent = (target: Type_ActiveWindowZoom): number =>
  Math.round((target.zoom.getScale(target.ctx) / neutralOf(target.zoom)) * 100)

/**
 * Un cran de zoom. `direction` vaut +1 (avant) ou -1 (arriere).
 *
 * La nature qui declare `scaleBy` le fait elle-meme ; les autres voient le controle composer
 * lecture puis ecriture, en se tenant aux bornes declarees.
 */
export const applyZoomStep = (target: Type_ActiveWindowZoom, direction: 1 | -1): void => {
  const { zoom, ctx } = target
  const factor = direction === 1 ? stepOf(zoom) : 1 / stepOf(zoom)
  if (zoom.scaleBy) {
    zoom.scaleBy(factor, ctx)
    return
  }
  const next = zoom.getScale(ctx) * factor
  const min = typeof zoom.min === 'number' ? zoom.min : next
  const max = typeof zoom.max === 'number' ? zoom.max : next
  zoom.setScale(Math.min(max, Math.max(min, next)), ctx)
}

/** Le clic sur le pourcentage : revenir a l'echelle NEUTRE de cette nature, quelle qu'elle soit. */
export const resetZoomToNeutral = (target: Type_ActiveWindowZoom): void =>
  target.zoom.setScale(neutralOf(target.zoom), target.ctx)

/**
 * Ce cran a-t-il encore de la course ? Faux quand l'echelle est deja a la borne de ce cote.
 * Sert a eteindre le bouton qui ne ferait plus rien - une nature sans bornes declarees ne
 * bute jamais, ce qui est la bonne reponse quand on ne sait pas.
 */
export const canZoomStep = (target: Type_ActiveWindowZoom, direction: 1 | -1): boolean => {
  const { zoom, ctx } = target
  const current = zoom.getScale(ctx)
  if (direction === 1) return typeof zoom.max !== 'number' || current < zoom.max
  return typeof zoom.min !== 'number' || current > zoom.min
}
