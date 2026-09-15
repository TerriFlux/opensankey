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

// os#1401 — LA PORTÉE D'UN OUTIL : dans quelles natures de fenêtre son geste EXISTE.
//
// Les outils de la colonne (nœud, flux, zone de texte, ligne, sélection, pinceau de style)
// n'étaient gouvernés que par un booléen global de mode publication. Rien ne regardait la
// fenêtre active de la grande zone : ils étaient proposés à l'identique quand celle-ci montre
// un tableur, une documentation, un JSON ou une étoile — où ils ne peuvent rien produire. Un
// outil pouvait même être ARMÉ pendant que le tableur occupait l'écran.
//
// Le principe est celui du chantier de la configuration contextuelle
// (NOTE-NAVIGATION-CONTEXTUELLE.md) : une commande n'est proposée que si elle a un effet
// VISIBLE dans la représentation active. L'argument est plus fort ici qu'ailleurs — un outil
// de dessin proposé hors du dessin n'est pas encombrant, il est faux.
//
// CE FICHIER NE DÉCIDE PAS DE L'AFFICHAGE. Il dit la règle ; la colonne d'outils la lit pour
// griser (et dire pourquoi au survol), et `Class_DrawingArea.setCreationTool` la lit pour
// REFUSER d'armer. Les deux lectures sont nécessaires : un bouton grisé dont l'action reste
// atteignable autrement est un garde-fou en trompe-l'œil.

import type { Class_ApplicationData } from './ApplicationData'
import type { Type_CreationTool } from './DrawingArea'
import { MAIN_ZONE_CANVAS_ID } from './MenuConfig'

/**
 * Les gestes de la colonne d'outils. Les quatre outils de création, plus les deux boutons qui
 * les encadrent et agissent eux aussi sur le dessin : la sélection (qui commande les flèches de
 * création rapide au survol d'un nœud) et le pinceau de style.
 */
export type Type_ToolGesture = Type_CreationTool | 'selection' | 'style_paint'

/**
 * LA DÉCLARATION : chaque geste nomme les natures de fenêtre où il existe.
 *
 * Des FONCTIONS et non un tableau de constantes : l'identifiant du canevas vit dans
 * `MenuConfig`, que ce module et `DrawingArea` s'importent en cercle. Le lire au chargement du
 * module exposerait la table à l'ordre des imports (une case à `undefined` ne jette pas, elle
 * ment). Évalué à l'appel, il est toujours posé.
 *
 * Les six gestes ne valent aujourd'hui que dans LE CANEVAS du diagramme, et c'est un constat,
 * pas une propriété : le jour où une représentation saura accueillir la pose d'un nœud, elle
 * s'ajoute ici, sur la ligne de son outil, sans toucher ni au modèle ni à la colonne.
 */
export const TOOL_GESTURE_SCOPE: { [gesture in Type_ToolGesture]: () => string[] } = {
  // Poser un nœud, tracer un flux : le geste produit des éléments du diagramme, et il n'y a
  // qu'un endroit pour les voir apparaître.
  node: () => [MAIN_ZONE_CANVAS_ID],
  link: () => [MAIN_ZONE_CANVAS_ID],
  // Zone de texte et ligne libre : des conteneurs posés au glisser SUR le dessin.
  text_zone: () => [MAIN_ZONE_CANVAS_ID],
  line: () => [MAIN_ZONE_CANVAS_ID],
  // La sélection porte l'interrupteur des flèches de création rapide (os#1344) : son effet se
  // voit au survol d'un nœud DESSINÉ, donc là aussi, et nulle part ailleurs.
  selection: () => [MAIN_ZONE_CANVAS_ID],
  // Le pinceau recopie l'apparence d'un élément sur ceux qu'on clique ensuite : ces clics se
  // font sur le dessin.
  style_paint: () => [MAIN_ZONE_CANVAS_ID]
}

/**
 * La NATURE de la fenêtre active de la grande zone, ou `null` quand il n'y en a pas.
 *
 * Même chemin que l'inspecteur (`activeRepresentation`, os#1394) : `main_zone_active_id` puis
 * l'occupant, dont on ne retient que sa représentation — deux fenêtres peuvent montrer la même
 * (le canevas d'une autre feuille, os#1385), et c'est la nature qui décide, pas l'identité.
 */
export const activeWindowRepresentation = (
  app_data: Class_ApplicationData
): string | null => {
  const mc = app_data?.menu_configuration
  if (!mc) return null
  const id = mc.main_zone_active_id
  if (!id) return null
  return mc.mainZoneOccupantById(id)?.representation ?? null
}

/**
 * Ce geste a-t-il un effet dans la fenêtre active ?
 *
 * PERMISSIF QUAND IL N'Y A PAS DE FENÊTRE (`null`) : le viewer embarqué, le plateau unitaire
 * d'OS+ et les tests montent une application sans grande zone. Rien à contredire là-bas —
 * refuser y retirerait des gestes qui marchent, ce que ce lot ne doit surtout pas faire. Le
 * refus ne vaut que contre une fenêtre CONNUE dont la nature ne sert pas le geste.
 */
export const toolAppliesToActiveWindow = (
  app_data: Class_ApplicationData,
  gesture: Type_ToolGesture
): boolean => {
  const representation = activeWindowRepresentation(app_data)
  if (representation === null) return true
  return TOOL_GESTURE_SCOPE[gesture]().includes(representation)
}
