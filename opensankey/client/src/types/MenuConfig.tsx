// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// External imports
import React, { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react'

import {
  Type_MacroTagGroup, Type_JSON,
  getBooleanFromJSON, getNumberFromJSON, getStringFromJSON
} from '../types/Utils'
import { Class_DataTagGroup } from './TagGroup'
import { Class_DataTag } from './Tag'
import {
  Class_EventBus, HOST_TOPICS, MAIN_ZONE_TOPIC, SAVE_STATE_TOPIC, SELECTION_TOPIC
} from './EventBus'
import { Class_PanelManager, Type_PanelMode, Type_PopupGeometry } from './PanelManager'
// os#1482 — le magasin des tableaux de bord est PUR (aucune arête vers le dessin), comme `PanelManager`.
import { Class_DashboardsStore } from './Dashboards'
// `ConverterConfig` est une interface : `import type` suffit, et l'arête vers la zone d'édition
// disparaît à la compilation (#1331 — le viewer ne doit rien importer de l'éditeur).
import type { ConverterConfig } from './ConverterConfig'
import type { Type_TemplateSource } from './TemplateSource'
import { Class_NodeBase } from '../Elements/NodeBase'
import { Class_LinkElement } from '../Elements/Link'
import { Class_ElementStyle } from '../Elements/Element'
// os#1418 — LES FIGURES SONT DES ÉLÉMENTS. `Figure.ts` porte la nature, ses styles, la cascade
// et le rapport de migration ; ce fichier n'en garde que l'ANNUAIRE (quelle figure pour quelle
// vignette) et les gestes de la grande zone.
import {
  Class_Figure, Class_FigureNature, Class_FigureMigrationReport,
  FIGURE_DIAGRAM_PANE_KEY, transposableBagChanges,
  type Type_FigureAttributesConfig, type Type_OptionBag
} from '../Representations/Figure'
// os#1418 — la DÉCLARATION des attributs d'une nature vit dans son entrée de registre. Import de
// VALEUR, donc arête réelle : `RepresentationRegistry` ne prend de ce fichier qu'un `import type`
// (`Type_RepresentationOptionScope`) et `RepresentationContextMenu`, qu'il importe en valeur, ne
// prend lui-même que des types. Aucun cycle à l'exécution.
import {
  canonicalRepresentationId, retiredRepresentationOptions
} from '../Representations/retiredRepresentations'
import { representation_registry } from '../Representations/RepresentationRegistry'
// os#1421 — LE PLACEMENT : le TYPE et les helpers purs vivent dans `Placement.ts`, le REGISTRE des
// figures par identifiant de document vit ici (c'est lui qui sait quelle figure un placement cite).
import {
  FIGURE_PLACEMENTS_ATTR, readFigurePlacements, withFigurePlacement, withoutFigure,
  nodePlacementFigureId, type Type_FigurePlacement
} from '../Representations/Placement'
// `import type` : l'hôte d'un placement est un NŒUD, mais ce fichier n'a aucune arête d'exécution
// vers les éléments de dessin (il n'en prend que la forme), et `Class_NodeElement` importé en
// valeur ferait remonter toute la zone de dessin dans le menu.
import type { Class_NodeElement } from '../Elements/Node'

export type Type_AdditionalMenus = {
  external_top_buttons_item: { [x: string]: JSX.Element },

  // #1243 — Le contrat d'injection du menu de config (additional_menu_type,
  // additional_menu_button_element_configurable, additional_new_menu_config_content)
  // est DÉPOSÉ avec la matrice type×élément qu'il alimentait. Les couches
  // supérieures enregistrent désormais leurs contenus dans les REGISTRES :
  //  - inspector_registry     (onglets de l'inspecteur, par cible)
  //  - filter_panel_registry  (sections « Éditer » du panneau Filtres)
  // — id idempotent, ordre, gate de licence, au lieu de dictionnaires imbriqués.

  extra_background_element: JSX.Element
  additional_nav_item: JSX.Element[],
  additional_bottom_item: JSX.Element[],
  /**
   * os#1488 — BOUTONS DE LA COLONNE D'OUTILS (droite), injectés par une couche supérieure.
   *
   * La colonne est rendue par l'éditeur (`SankeyMenus`), mais un panneau d'OpenSankey+ — la
   * gestion des vues et des tableaux de bord — doit pouvoir y poser son bouton, comme l'Explorateur y a
   * le sien. Sans ce créneau il fallait soit descendre le panneau dans l'éditeur, soit lui
   * prendre une place dans la barre du haut, qui en porte déjà neuf.
   */
  additional_tools_item: JSX.Element[],

  formations_menu: object,
  template_module_key: string[]
}

// Position de la doc dans la grande zone :
//  - sheet-right / -left / -top / -bottom : doc accolée au tableur dans le slot droit.
//  - diagram-bottom : doc sous le diagramme (zone gauche), tableur inchangé à droite.
//  - window-bottom : doc en bandeau pleine largeur en bas (diagramme ET tableur raccourcis).
export type Type_MainZoneDocLayout =
  'sheet-right' | 'sheet-left' | 'sheet-top' | 'sheet-bottom' | 'diagram-bottom' | 'window-bottom'
// Positions « groupe tableur » : la doc partage le slot droit avec le tableur (sinon elle est en bas).
export const DOC_LAYOUTS_WITH_SHEET: Type_MainZoneDocLayout[] =
  ['sheet-right', 'sheet-left', 'sheet-top', 'sheet-bottom']
// Positions qui placent la doc en bas et raccourcissent le diagramme (réserve verticale).
export const DOC_LAYOUTS_BOTTOM: Type_MainZoneDocLayout[] = ['diagram-bottom', 'window-bottom']
// (Les six dispositions ci-dessus ne sont plus qu'un format de LECTURE : cf. mainZoneStateFromJSON.)

// os#1355/1361 — GRANDE ZONE À N OCCUPANTS. Un occupant est un id du registre des
// représentations et une PLACE parmi trois piles — c'est tout ce que la disposition a
// besoin de savoir pour se calculer :
//  - 'main'   : la zone principale (le canevas SVG quand le diagramme est affiché) ;
//  - 'right'  : une colonne à droite, occupants empilés VERTICALEMENT ;
//  - 'bottom' : un bandeau en bas, occupants côte à côte.
// `size` est un POIDS dans sa pile (normalisé à l'affichage), pas une fraction figée : ajouter
// un occupant ne demande pas de recalculer les autres.
// os#1495 / sa#563 — LA TROISIÈME PLACE : 'floating', au-dessus de la grille et non dedans.
//
// Un volet flottant est un occupant ORDINAIRE — même sujet, même nature, même en-tête, même
// liséré d'active — qui ne prend sa place à personne : il se pose sur la grande zone avec sa
// propre géométrie (cf. `Type_MainZoneOccupant.geometry`) au lieu d'occuper une case calculée.
// C'est ce que la pop-up de présentation d'un élément est devenue : un volet, à une troisième
// place, et non un panneau qui ressemble à un volet.
//
// LES TROIS PLACES DE LA GRILLE gardent leur nom et leurs règles ; 'floating' n'entre dans
// AUCUNE d'elles, et c'est ce que dit `MAIN_ZONE_GRID_PLACES`. Deux listes, parce que deux
// questions différentes se posent : « cette place existe-t-elle ? » (lecture d'un fichier) et
// « cette place occupe-t-elle une case ? » (disposition, réserve du dessin, invariant du `main`).
export type Type_MainZonePlace = 'main' | 'right' | 'bottom' | 'floating'
export const MAIN_ZONE_PLACES: Type_MainZonePlace[] = ['main', 'right', 'bottom', 'floating']
/** Les places qui prennent une CASE de la grille : celles dont la disposition se calcule. */
export const MAIN_ZONE_GRID_PLACES: Type_MainZonePlace[] = ['main', 'right', 'bottom']
/** Taille de naissance d'un volet flottant, quand personne ne lui en donne une. */
export const MAIN_ZONE_FLOATING_DEFAULT_SIZE = { w: 420, h: 360 }
/** Bornes de redimensionnement d'un volet flottant. */
export const MAIN_ZONE_FLOATING_MIN_SIZE = { w: 240, h: 160 }
export const MAIN_ZONE_FLOATING_MAX_SIZE = { w: 1400, h: 1100 }
/**
 * sa#563 — LE PLAFOND DE VOLETS FLOTTANTS, repris tel quel de celui des pop-ups de présentation
 * (`MAX_PRESENTATION_POPUPS`) : sur un diagramme dense, des volets accolés se recouvrent et
 * masquent ce qu'ils décrivent. La règle n'a pas changé de raison en changeant de place.
 */
export const MAX_MAIN_ZONE_FLOATING = 5
/**
 * sa#563 — CE QU'ON GARDE TOUJOURS À PORTÉE DE SOURIS d'un volet flottant, en px.
 * Même valeur et même raison que `PANEL_GRAB_MARGIN_PX` (os#1494) : de quoi voir le volet et le
 * rattraper par son en-tête, quelle que soit la géométrie qu'un fichier lui donne.
 */
const MAIN_ZONE_FLOATING_GRAB_PX = 80

/** Largeur/hauteur de la fenêtre, avec le repli des tests (pas de `window` sous Node). */
const viewportSize = (): { w: number, h: number } => ({
  w: (typeof window !== 'undefined' && window.innerWidth) || 1280,
  h: (typeof window !== 'undefined' && window.innerHeight) || 720
})

/** Taille bornée, puis position bornée de façon qu'il reste toujours de quoi saisir le volet. */
export const clampMainZoneFloatingGeometry = (g: Type_PopupGeometry): Type_PopupGeometry => {
  const { w: vw, h: vh } = viewportSize()
  const w = Math.max(MAIN_ZONE_FLOATING_MIN_SIZE.w, Math.min(MAIN_ZONE_FLOATING_MAX_SIZE.w, Math.round(g.w)))
  const h = Math.max(MAIN_ZONE_FLOATING_MIN_SIZE.h, Math.min(MAIN_ZONE_FLOATING_MAX_SIZE.h, Math.round(g.h)))
  return {
    w,
    h,
    x: Math.max(0, Math.min(Math.round(g.x), vw - MAIN_ZONE_FLOATING_GRAB_PX)),
    y: Math.max(0, Math.min(Math.round(g.y), vh - MAIN_ZONE_FLOATING_GRAB_PX))
  }
}

/** Géométrie de naissance d'un volet flottant à qui personne n'en donne : centrée en haut. */
export const defaultMainZoneFloatingGeometry = (): Type_PopupGeometry => {
  const { w: vw } = viewportSize()
  const { w, h } = MAIN_ZONE_FLOATING_DEFAULT_SIZE
  return clampMainZoneFloatingGeometry({ x: Math.round(vw / 2 - w / 2), y: 120, w, h })
}
// os#1387 — LE SUJET d'une fenêtre : ce qu'elle regarde (NOTE-FENETRES-ET-POINTAGE.md).
//  - 'diagram'   : le document ;
//  - 'selection' : elle SUIT l'élément sélectionné dans le dessin (fil d'Ariane) ;
//  - 'node' / 'link' : ÉPINGLÉE sur un objet, quoi qu'on sélectionne ensuite.
// `sheet` (os#1386) : la feuille regardée ; absente = la feuille courante.
// `view` (os#1482) : la VUE de cette feuille à montrer ; absente = la vue courante du document.
//   Posée par une TABLEAU DE BORD (cf. Dashboards.ts) : c'est ce qui permet à une disposition de dire « la
//   feuille B, dans sa vue Riz » — le couple (feuille, vue) est la seule extension du modèle des
//   fenêtres qu'exigent les tableaux de bord. Une fenêtre ouverte à la main n'en porte pas.
export type Type_MainZoneSubject =
  | { kind: 'diagram', sheet?: string, view?: string }
  | { kind: 'selection' }
  | { kind: 'node', id: string, sheet?: string }
  | { kind: 'link', id: string, sheet?: string }
  // Plusieurs objets épinglés (nœuds et/ou flux, par id) : une vignette par objet.
  //
  // os#1387 (10/09/2026) — `keys` est un tableau PARALLÈLE à `ids` : `keys[i]` est la clé
  // STABLE de la vignette qui montre `ids[i]`. Il existe parce qu'un même objet a désormais le
  // droit de figurer DEUX FOIS dans la même fenêtre — « pour le même nœud on peut vouloir
  // plusieurs diagrammes suivant la décomposition » — et que l'identifiant de l'élément ne
  // suffit alors plus à distinguer les deux vignettes : ni pour leur donner chacune ses
  // réglages, ni pour en retirer une sans emporter l'autre, ni pour les monter séparément.
  // Absent (fichiers d'avant cette date, où les doublons étaient impossibles) : la clé VAUT
  // l'identifiant de l'élément — cf. mainZonePaneKeyAt.
  | { kind: 'elements', ids: string[], keys?: string[], sheet?: string }
  /**
   * os#1420 (16/09/2026) — LE TROISIÈME SUJET : ÉPINGLÉ À UN CRITÈRE, et non à des objets.
   *
   * « Les nœuds portant l'étiquette Importations » — le groupe d'étiquettes `tagg_id`, l'étiquette
   * `tag_id`, et c'est le diagramme qui dit, à chaque instant, quels nœuds cela fait.
   *
   * POURQUOI un troisième sujet plutôt qu'une liste d'ids bien remplie : une liste (`elements`) est
   * figée sur des IDENTIFIANTS, et une figure qui suit la navigation change de nœuds sous elle — un
   * changement de niveau en fait disparaître une partie, et le groupe se vide à moitié pendant que
   * la fenêtre garde son titre. Elle annonce alors quelque chose qu'elle ne montre plus. Un critère,
   * lui, se REPOSE à chaque résolution : il désigne toujours ce qu'il dit.
   *
   * POURQUOI SEULEMENT LES ÉTIQUETTES DE NŒUDS, pour l'instant : une étiquette de nœuds est un
   * critère au sens strict — un nœud la porte ou non (`Class_NodeTag._references`). Une étiquette de
   * DONNÉES n'en est pas un : `Class_DataTag._references` vaut `sankey.links_dict`, donc TOUS les
   * flux — elle ne sélectionne rien, elle nomme une lecture des valeurs. Une dimension (niveau,
   * ancêtre) ferait un critère recevable et viendra si l'usage le demande ; on n'ouvre pas deux
   * formes à la fois pour une seule dont on sait ce qu'elle doit faire.
   *
   * `sheet` s'y lit comme sur les autres sujets épinglés : le critère s'applique à la feuille
   * nommée, sinon à la feuille courante.
   */
  | { kind: 'tag', tagg_id: string, tag_id: string, sheet?: string }
export const MAIN_ZONE_SUBJECT_KINDS = ['diagram', 'selection', 'node', 'link', 'elements', 'tag']
/**
 * Une FENÊTRE de la grande zone = un sujet + une représentation (une entrée du registre), plus
 * sa place et son poids. Pour une fenêtre à sujet DIAGRAMME sur la feuille courante,
 * `id === representation` : il n'y en a qu'une par représentation, et c'est ce que lisent la
 * barre du haut, le paramètre d'URL `rep` et les accesseurs de compatibilité. Une fenêtre à
 * sujet ÉLÉMENT a un id propre (`w_N`) — on peut en ouvrir plusieurs sur la même
 * représentation, épinglées sur des objets différents ; une fenêtre à sujet DIAGRAMME qui nomme
 * une AUTRE FEUILLE aussi, pour la même raison (os#1385 lot 0) ; et, depuis os#1498, une fenêtre
 * dont la NATURE déclare `allow_many` — plusieurs vues de groupe sur la même feuille, une par
 * groupe d'étiquettes regardé. Deux juges, et il faut prendre le bon :
 * `mainZoneSubjectUsesOwnWindowId` avant qu'une fenêtre existe (on n'a qu'un sujet),
 * `mainZoneOccupantUsesOwnWindowId` dès qu'on tient l'occupant — LUI SEUL voit le troisième cas,
 * dont le sujet est un diagramme comme les autres.
 */
export type Type_MainZoneOccupant = {
  id: string
  subject: Type_MainZoneSubject
  representation: string
  place: Type_MainZonePlace
  size: number
  /**
   * sa#563 — OÙ ET DE QUELLE TAILLE, quand la place est 'floating'.
   *
   * `size` est un POIDS dans une pile : il ne dit rien d'un volet qui n'est dans aucune pile.
   * D'où ce champ, et d'où le fait qu'il SURVIVE à un aller-retour par la grille — « Ancrer en
   * volet » puis « Faire flotter » repose le volet là où il était, au lieu de le renvoyer au
   * milieu de l'écran. C'est la même mémoire que `Class_PanelManager._popup_geometry_memory`, et
   * c'est le même type : une géométrie flottante est une géométrie flottante, qu'elle porte un
   * menu ou un volet (pratique P1 — un mot par concept).
   *
   * Absent sur un volet de la grille qui n'a jamais flotté : la géométrie se pose alors à la
   * première demande (cf. `setMainZoneOccupantPlace`).
   */
  geometry?: Type_PopupGeometry
  /**
   * sa#566 — LA VUE QUE CE VOLET EST, quand il est enregistré.
   *
   * Une vue et un volet sont le même objet ; la seule différence est qu'une vue est enregistrée
   * dans le fichier et qu'un volet est éphémère. Ce champ est ce qui les distingue : présent, le
   * volet EST la vue `saved_view` du document principal — sa nature, ses réglages, sa place et sa
   * géométrie sont ceux de la vue, et fermer le volet ne l'efface pas (elle se rappelle depuis le
   * sélecteur de vues). Absent, le volet est éphémère : le fermer le fait disparaître.
   *
   * Absent de tout fichier antérieur, et de tout volet qu'on n'a pas enregistré : la clé ne
   * s'écrit que si elle est posée, et un document sans vue enregistrée garde son fichier d'avant.
   */
  saved_view?: string
  // os#1418 — `options` A DISPARU. Un occupant ne porte plus de réglages : il dit ce qu'il
  // montre et où il est, et les réglages appartiennent aux FIGURES (`Class_Figure`, une par
  // vignette, cf. `figureOf`). C'est ce qui permet à une figure de suivre le style de sa nature
  // au lieu d'en recevoir une copie au moment de sa création.
}
export const isDiagramSubject = (s: Type_MainZoneSubject): boolean => s.kind === 'diagram'
/**
 * os#1386 — La FEUILLE d'un sujet, ou `''` pour la feuille courante.
 *
 * Un seul endroit pour lire ce champ optionnel, parce qu'il y a deux façons de dire « la
 * feuille courante » et qu'elles doivent rester interchangeables : l'absence de la clé
 * (fichiers d'avant os#1386, et sujets qu'on n'a jamais dépaysés) et la chaîne vide. Un
 * sujet 'selection' n'en porte jamais : il SUIT le dessin, donc la feuille vivante.
 */
export const mainZoneSubjectSheet = (s: Type_MainZoneSubject): string =>
  ('sheet' in s && typeof s.sheet === 'string') ? s.sheet : ''
/**
 * os#1482 — La VUE demandée par un sujet diagramme, ou `''` : « la vue courante du document ».
 * Même règle de lecture que `mainZoneSubjectSheet` : l'absence de la clé et la chaîne vide
 * disent la même chose, et un sujet qui n'est pas un diagramme n'en porte jamais.
 */
export const mainZoneSubjectView = (s: Type_MainZoneSubject): string =>
  (s.kind === 'diagram' && typeof s.view === 'string') ? s.view : ''

/**
 * os#1385 lot 0 — Cette fenêtre a-t-elle un identifiant PROPRE (`w_N`), plutôt que son
 * identifiant de représentation ?
 *
 * La règle historique était binaire : sujet diagramme = une fenêtre par représentation, donc
 * `id === representation` ; sujet élément = un identifiant propre, puisqu'on peut en épingler
 * plusieurs sur la même nature. Le second canevas la casse : « le diagramme de la feuille B »
 * et « le diagramme de la feuille courante » sont deux fenêtres de MÊME nature
 * (`MAIN_ZONE_CANVAS_ID`) qui doivent coexister — l'identifiant de représentation ne peut plus
 * les distinguer. Une fenêtre à sujet diagramme DÉPAYSÉE (elle nomme une feuille) rejoint donc
 * les fenêtres d'élément : identifiant propre, représentation gardée à part.
 *
 * Le cas SANS feuille, lui, ne bouge pas d'un iota, et c'est délibéré : c'est l'invariant que
 * lisent la barre du haut, le paramètre d'URL `rep` et les accesseurs de compatibilité
 * (`main_zone_show_spreadsheet`…), qui désignent tous une fenêtre par son identifiant de
 * registre. La règle se relit à quatre endroits (ouverture, normalisation, changement de nature,
 * état d'URL) et ils DOIVENT s'accorder : si l'un d'eux croyait qu'une fenêtre de feuille est
 * nommée par sa représentation, il l'écraserait avec le canevas de la feuille courante.
 *
 * os#1498 — CE PRÉDICAT NE VOIT QUE LE SUJET, et ne suffit donc plus à lui seul : une fenêtre de
 * nature `allow_many` a un sujet diagramme de la feuille courante ET un identifiant propre. Il
 * reste le juge de L'OUVERTURE, où il n'y a encore qu'un sujet ; partout où l'on tient une
 * fenêtre, c'est `mainZoneOccupantUsesOwnWindowId` qui tranche.
 */
export const mainZoneSubjectUsesOwnWindowId = (s: Type_MainZoneSubject): boolean =>
  s.kind !== 'diagram' || mainZoneSubjectSheet(s) !== ''

/**
 * LA GRAPHIE d'un identifiant propre — `w_` suivi du rang du compteur —, en un seul endroit.
 *
 * Elle n'était qu'une convention d'écriture (`w_${seq}`, relue à la volée pour réaligner le
 * compteur à l'ouverture d'un fichier). Depuis os#1498 elle DÉCIDE : c'est à elle qu'on reconnaît
 * une fenêtre à identifiant propre dont le sujet, lui, ne dit rien (cf.
 * `mainZoneOccupantUsesOwnWindowId`). Deux graphies divergentes feraient prendre une telle fenêtre
 * pour une fenêtre nommée par sa représentation, et la normalisation lui donnerait `w_N` pour
 * nature.
 */
const OWN_MAIN_ZONE_WINDOW_ID = /^w_(\d+)$/
/** Cet identifiant est-il un identifiant PROPRE (`w_N`), plutôt qu'un id du registre ? */
export const isOwnMainZoneWindowId = (id: string): boolean => OWN_MAIN_ZONE_WINDOW_ID.test(id)

/**
 * os#1498 — CETTE FENÊTRE-CI A-T-ELLE UN IDENTIFIANT PROPRE ? LE SEUL JUGE QUAND ON TIENT
 * L'OCCUPANT.
 *
 * `mainZoneSubjectUsesOwnWindowId` ne voit que le SUJET, et c'était assez tant que le sujet
 * suffisait à trancher (élément, ou diagramme dépaysé sur une autre feuille). Une nature
 * `allow_many` casse cette équivalence : son sujet est un diagramme sur la feuille courante — le
 * prédicat de sujet répond donc « non » — alors que la fenêtre porte bel et bien un `w_N`, parce
 * qu'on peut en ouvrir plusieurs sur cette même nature (cf. `Type_RepresentationEntry.allow_many`).
 *
 * D'où ce second prédicat, qui lit aussi l'IDENTIFIANT. Il ne dit jamais « non » là où celui du
 * sujet dit « oui » : c'est un sur-ensemble, et aucune fenêtre d'aujourd'hui ne change de camp.
 * Partout où un occupant est sous la main — normalisation, changement de nature, état d'URL —,
 * c'est lui qu'on interroge ; le prédicat de sujet reste pour les décisions qui se prennent AVANT
 * qu'une fenêtre existe (l'ouverture, où il n'y a encore qu'un sujet et une nature).
 */
export const mainZoneOccupantUsesOwnWindowId = (
  o: { id: string, subject: Type_MainZoneSubject }
): boolean => mainZoneSubjectUsesOwnWindowId(o.subject) || isOwnMainZoneWindowId(o.id)

/**
 * os#1387 (10/09/2026) — LA CLÉ DE LA VIGNETTE de rang `i` d'un sujet `elements`.
 *
 * Un seul endroit pour appliquer le repli, parce qu'il y a deux façons d'écrire la même
 * fenêtre et qu'elles doivent rester interchangeables : avec `keys` (fichiers d'aujourd'hui,
 * seuls capables de porter deux fois le même objet) et sans (fichiers antérieurs, où un objet
 * ne pouvait figurer qu'une fois — sa clé est donc son identifiant, sans ambiguïté possible).
 * Une entrée vide ou absente de `keys` retombe sur l'identifiant pour la même raison.
 */
export const mainZonePaneKeyAt = (s: { ids: string[], keys?: string[] }, i: number): string => {
  const k = s.keys?.[i]
  return (typeof k === 'string' && k !== '') ? k : s.ids[i]
}
/** Les clés des vignettes d'un sujet `elements`, dans l'ordre des objets. */
export const mainZonePaneKeys = (s: { ids: string[], keys?: string[] }): string[] =>
  s.ids.map((_, i) => mainZonePaneKeyAt(s, i))
/**
 * Une clé de vignette LIBRE pour un objet qu'on ajoute à une fenêtre.
 *
 * L'identifiant de l'objet tant qu'il est libre — les fenêtres ordinaires gardent donc des
 * clés lisibles, et surtout IDENTIQUES à celles qu'un fichier antérieur sous-entendait, ce qui
 * fait que ses réglages retombent sur leur vignette au rechargement. Ce n'est qu'au doublon
 * qu'on suffixe, et le suffixe n'a aucun sens à lui seul : il ne sert qu'à séparer.
 */
export const freshMainZonePaneKey = (id: string, used: string[]): string => {
  if (!used.includes(id)) return id
  let n = 2
  while (used.includes(`${id}#${n}`)) n += 1
  return `${id}#${n}`
}

/**
 * ⚠️ os#1418 — LES CINQ HELPERS QUI SUIVENT SONT UN FORMAT DE LECTURE HÉRITÉE.
 *
 * Ils décrivent `occupant.options` : le sac par fenêtre, son sous-dictionnaire `panes`, et le
 * repli de l'un sur l'autre. Ce format N'EST PLUS ÉCRIT depuis os#1418 — les réglages sont des
 * FIGURES (`Class_Figure`) — et ces fonctions ne servent plus qu'à MIGRER un fichier d'avant
 * (cf. `mainZoneStateFromJSON`). Elles restent exportées parce que la migration n'est pas le
 * seul lecteur possible d'un fichier ancien, et pures parce qu'elles ne lisent rien d'autre que
 * le JSON qu'on leur donne. N'en câblez PAS de nouveau code : `figureOf(id, key).attributes`
 * est la seule lecture vivante.
 *
 * os#1387 (10/09/2026) — LES RÉGLAGES SONT PAR VIGNETTE, PAS PAR FENÊTRE.
 *
 * « Pour normaliser il faut le faire par diagramme » (Julien) : le mode de valeur et le flux
 * de référence d'un Sankey unitaire appartiennent à UN diagramme — un flux de référence
 * n'existe même pas dans l'étoile d'un autre nœud — et il en va de même de l'axe de
 * décomposition d'une couronne ou d'un histogramme. Une barre de réglages partagée par toutes
 * les vignettes d'une fenêtre était donc fausse par construction.
 *
 * Forme retenue : `occupant.options.panes[clé de vignette]` porte les réglages d'UNE vignette,
 * et le RESTE de `occupant.options` — tout ce qui n'est pas `panes` — reste la valeur de REPLI
 * pour une vignette qui n'a pas encore d'entrée. C'est ce repli qui fait qu'un fichier
 * enregistré du temps de la barre partagée se rouvre en montrant exactement les mêmes
 * graphiques : ses réglages, écrits au niveau de la fenêtre, s'appliquent à chaque vignette
 * tant que personne n'y touche. C'est aussi ce qui donne son réglage à une vignette qu'on
 * vient d'ajouter : elle hérite de ce que la fenêtre disait, plutôt que de repartir de zéro.
 */
export const MAIN_ZONE_PANES_KEY = 'panes'
/** Les réglages AU NIVEAU DE LA FENÊTRE : tout sauf le dictionnaire des vignettes. */
export const mainZoneWindowLevelOptions = (options: Type_JSON | undefined): Type_JSON => {
  if (!options) return {}
  const rest: Type_JSON = { ...options }
  delete rest[MAIN_ZONE_PANES_KEY]
  return rest
}
/**
 * os#1394 — Les réglages PROPRES d'une vignette, ou `null` quand elle n'en a pas encore.
 *
 * Distinguer « la vignette n'a rien dit » de « la vignette a dit ceci » est ce qui permet au
 * DÉFAUT PAR NATURE de s'intercaler avant le repli au niveau de la fenêtre (cf.
 * `mainZonePaneOptionsOf`) : sans ce `null`, les deux cas se confondaient en un objet vide.
 */
export const ownMainZonePaneOptions = (options: Type_JSON | undefined, key: string): Type_JSON | null => {
  const panes = options?.[MAIN_ZONE_PANES_KEY]
  if (panes && typeof panes === 'object' && !Array.isArray(panes)) {
    const own = (panes as Type_JSON)[key]
    if (own && typeof own === 'object' && !Array.isArray(own)) return { ...(own as Type_JSON) }
  }
  return null
}
/** Les réglages EFFECTIFS d'une vignette : les siens, ou — à défaut — ceux de la fenêtre. */
export const mainZonePaneOptions = (options: Type_JSON | undefined, key: string): Type_JSON =>
  ownMainZonePaneOptions(options, key) ?? mainZoneWindowLevelOptions(options)

/**
 * os#1394 — LES RÉGLAGES QUI DÉSIGNENT UN OBJET DU SUJET NE SONT JAMAIS UN DÉFAUT DE NATURE.
 *
 * Un réglage de représentation vaut pour toutes les figures de sa nature : afficher des valeurs
 * plutôt que des pourcentages, colorer comme le diagramme. Mais certains ne nomment pas une
 * FAÇON de regarder, ils nomment un OBJET : le flux de référence d'un Sankey unitaire
 * (`normalize_link_id`), l'axe de décomposition d'une analyse (`descriptor`), la racine d'un
 * sunburst (`root_ids`). Ceux-là n'ont aucun sens hors de leur sujet, et le fichier de la grande
 * zone le disait déjà : « un flux de référence n'existe pas dans l'étoile d'un autre nœud ».
 *
 * Les propager ferait rapporter l'étoile d'un nœud à un flux qui ne lui appartient pas, ou
 * décomposer une couronne selon une dimension étrangère. Ils restent donc là où ils ont été
 * posés, sur leur vignette.
 *
 * os#1418 — CETTE LISTE EST DEVENUE UN REPLI. La règle vit désormais dans la DÉCLARATION de la
 * nature (`sort: 'identity' | 'navigation'`, cf. `Figure.ts`), c'est-à-dire auprès de la clé
 * qu'elle qualifie et non dans un fichier qui ne sait rien d'elle. La liste ne sert plus qu'aux
 * clés qu'AUCUNE nature ne déclare — celles des natures pas encore portées sur le nouveau
 * contrat, et celles d'un fichier écrit par une version qui les offrait. La résorber plutôt que
 * l'allonger : une clé de plus ici est une déclaration qui manque là-bas.
 */
const SUBJECT_BOUND_OPTION_KEYS: readonly string[] = [
  'normalize_link_id', 'descriptor', 'root_ids'
]

/**
 * os#1416 — LA PORTÉE D'UN RÉGLAGE DE FIGURE : cette vignette, ou toutes celles de la fenêtre.
 *
 * Une fenêtre d'élément porte N vignettes, et le volet de représentation ne réglait que
 * l'active, sans le dire. « Régler cette vignette » et « régler toutes les vignettes » sont
 * deux portées, comme l'édition d'un élément en a déjà une dans l'inspecteur (la sélection, ou
 * le style qu'elle suit) : ce n'est pas une case de plus, c'est la réponse à « à quoi ce que je
 * règle s'applique-t-il ».
 *
 * L'union est OUVERTE par construction : le jour où les vignettes seront sélectionnables, une
 * portée « la sélection » s'ajoute ici et tout ce qui la lit la traite comme les deux autres.
 *
 * os#1418 — TROIS PORTÉES (arbitrage Julien du 16/09/2026), et la troisième est celle qui
 * manquait :
 *  - 'pane'  : CETTE figure. Surcharge propre, et rien d'autre — c'est le défaut.
 *  - 'all'   : les figures de CETTE FENÊTRE. Le diff transposable, posé sur chacune (cf.
 *              `transposableChanges`) ; les voisines gardent ce qu'elles disent par ailleurs.
 *  - 'style' : LE STYLE de la nature (`default`). Seule portée qui écrit un style, et donc
 *              seule façon de régler d'un geste toutes les figures d'une nature, ouvertes ou
 *              à venir. Régler une figure n'écrit PLUS le défaut de sa nature : c'est la fin
 *              de l'écriture immédiate de os#1394, qui faisait qu'un réglage local devenait
 *              silencieusement le réglage de tout le monde.
 *
 * os#1423 — LE JOUR ANNONCÉ EST VENU : les vignettes sont SÉLECTIONNABLES (cf.
 * `main_zone_selected_pane_keys`), et 'selection' s'ajoute comme le commentaire ci-dessus le
 * prévoyait.
 *  - 'selection' : les figures SÉLECTIONNÉES de la fenêtre active. Même diff transposable que
 *                  'all', posé sur la sélection au lieu de la fenêtre entière. Sélection vide =
 *                  la seule vignette active, donc cette portée DÉGÉNÈRE en 'pane' quand rien
 *                  n'est sélectionné — et c'est pour cela qu'elle peut remplacer les deux
 *                  premières dans le volet sans rien perdre.
 *
 * CE QUE LE VOLET OFFRE DÉSORMAIS : 'selection' et 'style'. 'pane' et 'all' restent DANS L'UNION
 * — le menu contextuel des figures et les tests les passent encore, et un fichier de réglages
 * peut les porter — mais le sélecteur de portée du volet de représentation ne les propose plus :
 * « cette vignette » est la sélection réduite à elle-même, « toutes » est la sélection étendue à
 * toute la fenêtre (`selectAllMainZonePanes`). Trois entrées pour deux gestes, c'était une de
 * trop.
 */
export type Type_RepresentationOptionScope = 'pane' | 'selection' | 'all' | 'style'

/**
 * os#1416 — UN RÉGLAGE EST-IL TRANSPOSABLE, c'est-à-dire a-t-il un sens sur la figure voisine ?
 *
 * C'est la MÊME question que celle du défaut par nature juste au-dessus, posée d'un autre côté :
 * un réglage qui nomme une façon de regarder (mode de valeur, gris ou couleurs) se transpose à
 * n'importe quelle figure ; un réglage qui nomme un objet du sujet ne se transpose à aucune. La
 * liste reste donc unique — deux listes de la même chose finiraient par diverger, et la seconde
 * rendrait « toutes les vignettes » possible là où le défaut par nature l'interdit déjà.
 */
export const isTransposableOption = (key: string): boolean =>
  !SUBJECT_BOUND_OPTION_KEYS.includes(key)

/**
 * os#1416 — CE QU'UNE PORTÉE « TOUTES » A LE DROIT DE PORTER : ce qui vient de changer, moins
 * ce qui est lié au sujet.
 *
 * Le diff, et non les réglages entiers : recopier tout le jeu de l'auteur sur ses voisines
 * écraserait ce qu'elles disent par ailleurs — deux étoiles peuvent partager un mode de valeur
 * et garder chacune sa référence de normalisation. Seul le geste qu'on vient de faire voyage.
 *
 * Une clé RETIRÉE ne voyage pas : aucun réglage ne se supprime aujourd'hui (tous réécrivent
 * `{ ...options, clé: valeur }`), et propager une absence demanderait de distinguer « effacé »
 * de « jamais dit », ce que le porteur de la portée n'a pas à trancher.
 *
 * os#1418 — LA TRANSPOSABILITÉ VIENT MAINTENANT DE LA NATURE, pas de la liste en dur : le
 * troisième paramètre reçoit `figureNature(id).isTransposable`, qui lit la SORTE déclarée de la
 * clé et ne retombe sur `isTransposableOption` que pour une clé qu'aucune nature ne déclare.
 * Absent, on garde exactement le comportement d'avant — les appelants qui ne connaissent pas la
 * nature de la figure (et il y en a) n'ont rien à changer.
 *
 * Le corps, lui, vit dans `Figure.ts` (`transposableBagChanges`) : c'est là que se décide ce
 * qu'un réglage de figure a le droit de faire, et deux copies de la même règle divergeraient.
 */
export const transposableChanges = (
  prev: { [key: string]: unknown } | undefined,
  next: { [key: string]: unknown } | undefined,
  isTransposable: (key: string) => boolean = isTransposableOption
): { [key: string]: unknown } => transposableBagChanges(prev, next, isTransposable)
/** Les réglages de la fenêtre, une vignette mise à jour. Les autres vignettes ne bougent pas. */
export const withMainZonePaneOptions = (
  options: Type_JSON | undefined, key: string, next: Type_JSON
): Type_JSON => {
  const panes = options?.[MAIN_ZONE_PANES_KEY]
  const prev = (panes && typeof panes === 'object' && !Array.isArray(panes)) ? panes as Type_JSON : {}
  return { ...(options ?? {}), [MAIN_ZONE_PANES_KEY]: { ...prev, [key]: { ...next } } }
}
// Les quatre occupants historiques, par leur id de registre. Nommés ici (et non dans le
// registre) parce que la grande zone a besoin d'en reconnaître UN : le canevas, qui est le
// SVG sous tout le reste et ne peut être que `main`.
export const MAIN_ZONE_CANVAS_ID = 'os.repr.sankey'
export const MAIN_ZONE_SPREADSHEET_ID = 'os.repr.spreadsheet'
export const MAIN_ZONE_DOC_ID = 'os.repr.doc'
export const MAIN_ZONE_UNITARY_ID = 'os.repr.unitary'
// La vue JSON du format natif. Elle était un SOUS-ONGLET du tableur (`main_zone_spreadsheet_mode`,
// supprimé) : le dernier câblage « un par un » que le registre des représentations devait solder.
// C'est pourtant le même sujet — le document entier — rendu autrement, donc une entrée de l'axe
// représentation exactement comme le tableur ou la doc. Trois conséquences, toutes voulues :
// l'en-tête de fenêtre perd une ligne (son sélecteur de nature porte déjà le choix), le JSON et
// la grille peuvent être ouverts CÔTE À CÔTE (impossible avec un mode exclusif), et une
// publication peut l'offrir ou le retirer par `PublishOptions.representations` comme le reste.
export const MAIN_ZONE_JSON_ID = 'os.repr.json'
// os#1387 — la représentation « Unit. » d'ÉLÉMENT (OS+), qui remplace le panneau unitaire à
// hôte externe. Nommée ici pour que la grande zone sache y rediriger les anciens appels.
export const MAIN_ZONE_UNIT_WINDOW_ID = 'osp.repr.unit'
/**
 * CETTE NATURE ACCEPTE-T-ELLE PLUSIEURS FENÊTRES SUR LA FEUILLE COURANTE ?
 *
 * Lu au registre, et SEULEMENT à l'ouverture (cf. `openMainZoneWindow`) : ce que la réponse
 * décide — un identifiant propre `w_N` — est ensuite porté par la fenêtre elle-même et persisté.
 * Une nature inconnue (module non chargé, fichier plus récent) répond « non », donc le
 * comportement d'aujourd'hui : on ne fabrique pas une fenêtre supplémentaire au nom d'une nature
 * dont on ne sait rien.
 */
export const representationAllowsMany = (representation: string): boolean =>
  representation_registry.get(representation)?.allow_many === true
// Noms courts des quatre occupants historiques dans le paramètre d'URL `rep` (sa#1354) :
// les adresses déjà partagées les portent, et un id de registre y serait moins lisible.
export const URL_MAIN_ZONE_SHORT_NAMES: { [id: string]: string } = {
  [MAIN_ZONE_CANVAS_ID]: 'diagram',
  [MAIN_ZONE_SPREADSHEET_ID]: 'spreadsheet',
  [MAIN_ZONE_DOC_ID]: 'doc',
  [MAIN_ZONE_UNITARY_ID]: 'unitary',
  [MAIN_ZONE_JSON_ID]: 'json'
}
export const URL_MAIN_ZONE_LONG_NAMES: { [short: string]: string } = Object.fromEntries(
  Object.entries(URL_MAIN_ZONE_SHORT_NAMES).map(([id, short]) => [short, id])
)
// Bornes de la colonne droite et de la zone principale (px). Une seule définition, lue par la
// réserve du diagramme ET par la mise en page : les deux DOIVENT donner la même largeur, sinon
// le dessin se recadre sur une colonne que l'écran ne montre pas.
export const MAIN_ZONE_MIN_RIGHT_PX = 320
export const MAIN_ZONE_MIN_MAIN_PX = 160
export const MAIN_ZONE_MIN_BOTTOM_PX = 120
/** Largeur (px) de la colonne droite pour une part `split_ratio` donnée à la zone principale. */
export const mainZoneRightColumnWidthPx = (split_ratio: number): number => {
  const W = window.innerWidth
  let w = (1 - split_ratio) * W
  w = Math.max(MAIN_ZONE_MIN_RIGHT_PX, w)
  w = Math.min(w, Math.max(MAIN_ZONE_MIN_RIGHT_PX, W - MAIN_ZONE_MIN_MAIN_PX))
  return w
}
/** Hauteur (px) du bandeau du bas pour une hauteur demandée, bornée par ce que l'écran laisse. */
export const mainZoneBottomBandHeightPx = (wanted_px: number, content_h: number): number =>
  Math.min(Math.max(MAIN_ZONE_MIN_BOTTOM_PX, wanted_px), Math.max(MAIN_ZONE_MIN_BOTTOM_PX, content_h - MAIN_ZONE_MIN_BOTTOM_PX))
// Largeur (px) de la colonne d'outils rétractable à droite (barre verticale + config + filtres +
// undo/redo/save). Quand ouverte, cette largeur est réservée par le diagramme (cf.
// getToolsColumnWidthPx / getMainZoneRightReservedPx) pour que la zone de dessin ne morde pas dessus.
export const TOOLS_COLUMN_WIDTH_PX = 48
// Dimensions du panneau de configuration (drawer/inspecteur). Source de vérité
// ici (et non dans SankeyMenus) : getConfigPanelPinnedReservedPx en a besoin
// pour la réserve de largeur du mode épinglé (#1243).
export const MENU_CONFIG_WIDTH_PCT = 20
export const MENU_CONFIG_MIN_WIDTH_PX = 420
// Largeur (px) de la galerie de modèles. Source de vérité ici (et non dans
// SankeyTemplates) : getTemplateGalleryPinnedReservedPx en a besoin pour la
// réserve de largeur du mode épinglé.
export const TEMPLATE_GALLERY_WIDTH_PX = 300
// #1243 — `keyTypeConfig` (axe Type) et `keyTypeElements` (axe Élément) étaient
// les coordonnées de la matrice du menu de config : supprimés avec elle.
export interface IType_DictHookRefSetterShowDialogComponents {
  // Config menu - Layout
  // Modal - Welcome
  ref_setter_modal_welcome_active_page: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_welcome: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_support: MutableRefObject<Dispatch<SetStateAction<boolean>>>

  ref_setter_show_modal_file_converter: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_rich_text_editor: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_shape_attribute_editor: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_value_type_editor: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // #1243 — éditeur d'infobulle en panneau draggable (l'onglet Infobulle de
  // l'inspecteur n'embarque qu'un texte simple + ce bouton d'ouverture).
  ref_setter_show_tooltip_editor: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // OS#1286 — éditeur du registre d'unités (grandeurs/unités/défauts) en
  // panneau draggable, ouvert depuis l'onglet Valeur de l'inspecteur.
  ref_setter_show_units_editor: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // sa#503 (U1) — éditeur du MODE BRIQUE (section `process` : nœud central,
  // ports typés, coefficients), ouvert depuis l'onglet Brique de l'inspecteur.
  ref_setter_show_unitary_process_editor: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // sa#514 (U7), renommé sa#519 — explorateur d'un CATALOGUE ACV externe
  // (recherche d'activité, ouverture de sa brique en nouvelle feuille), ouvert
  // depuis Fichier › Ouvrir. Le dialogue lui-même, ses traductions et le
  // catalogue qu'il interroge vivent hors de ce paquet : ce n'est ici qu'un
  // emplacement de fenêtre, et ce paquet public n'a pas à nommer une base de
  // données commerciale.
  ref_setter_show_lca_catalog_explorer: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // Éditeur texte SankeyMATIC en dialogue draggable : ouvert après un import
  // SankeyMATIC (openSankeymaticEditor) ou depuis le menu d'import. Sorti du
  // panneau Tableur, dont le sous-onglet texte est devenu la vue JSON.
  ref_setter_show_sankeymatic_editor: MutableRefObject<Dispatch<SetStateAction<boolean>>>

  // sa#424 (lot 3) — fenêtre « Exporter » UNIQUE : le choix du format de rendu
  // et ses réglages au même endroit, là où le menu Exporter de la barre
  // dispersait PNG / PDF / SVG en commandes, chacune rouvrant sa propre modale.
  ref_setter_show_modal_export: MutableRefObject<Dispatch<SetStateAction<boolean>>>

  // sa#424 (lot 5) — fenêtre de choix « Nouveau » (vierge / modèle / classeur
  // Excel vierge), dernière section du menu Fichier devenue une commande.
  ref_setter_show_modal_new_document: MutableRefObject<Dispatch<SetStateAction<boolean>>>

  // Modales héritées, encore ouvertes par le bouton `export_sankey` conservé
  // pour les `menu_top_order` personnalisés.
  ref_setter_show_modal_png_saver: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_png_saver_res_h: MutableRefObject<Dispatch<SetStateAction<number | undefined>>>
  ref_setter_png_saver_res_v: MutableRefObject<Dispatch<SetStateAction<number | undefined>>>

  ref_setter_show_modal_pdf_saver: MutableRefObject<Dispatch<SetStateAction<boolean>>>

  // Modal - Style & Layout
  ref_setter_show_modal_styles: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_apply_layout: MutableRefObject<Dispatch<SetStateAction<boolean>>>

  ref_setter_show_modal_styles_containers: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // Other modals
  ref_setter_show_modal_preference: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_templates_lib: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // Ouvre le panneau de galerie sur une source donnée, null pour le fermer. Les
  // modèles ont leur propre setter booléen ci-dessus (rétro-compat) ; celui-ci
  // sert aux galeries des couches supérieures (la sankeythèque, côté SA).
  ref_setter_show_gallery_source: MutableRefObject<Dispatch<SetStateAction<Type_TemplateSource | null>>>
  ref_setter_show_spreadsheet: MutableRefObject<Dispatch<SetStateAction<boolean>>>

  ref_setter_show_menu_node_icon: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modal_import_icons: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
}

/**
 * sa#283 lot 2 — Le créneau d'enregistrement de vue contextuelle, nommé.
 *
 * Nommé (et non écrit en place) depuis os#1385 : le membre est délégué à l'hôte, donc son
 * type s'écrit maintenant trois fois — champ, getter, setter — et trois copies d'une même
 * forme d'objet finiraient par diverger.
 */
export type Type_ContextRecordingUI = {
  armed: (group_id: string) => string | null
  arm: (group_id: string, tag_id: string) => void
  disarm: () => void
}

/**
 * os#1385 — LES POINTS D'INJECTION DE MENUS, nommés.
 *
 * Mêmes formes qu'avant, sorties de la classe pour la même raison que
 * `Type_ContextRecordingUI` : délégués à l'hôte, ils s'écrivent désormais en champ, en
 * getter et en setter, et trois copies d'une union de dix lignes divergeraient.
 */
/** Optional extra tab injected into UpdateModeGrid by OSP or other extensions */
export type Type_ExtraApplyLayoutTab = {
  label: string
  /** If provided and returns true: tab header is greyed and content disabled */
  disabled?: () => boolean
  render: (attrs: string[], onToggle: (key: string) => void, t: (key: string) => string) => React.ReactNode
}
/** Entrées supplémentaires du menu Exporter (liste plate, ou section titrée avec enfants). */
export type Type_ExtraExportMenuItems = Array<
  | {
      // Optional discriminator. Absent or 'item' => flat menu entry; 'group' => titled section with children.
      type?: 'item'
      key: string
      label: string
      icon?: React.ReactNode
      onClick: () => void
      disabled?: () => boolean
      // Returns the tooltip text for the item. Empty string => no tooltip wrapper.
      tooltip?: () => string
    }
  | {
      type: 'group'
      key: string
      label: string
      children: Array<{
        key: string
        label: string
        icon?: React.ReactNode
        onClick: () => void
        disabled?: () => boolean
        tooltip?: () => string
      }>
    }
>
/**
 * Entrées à libellé ÉVALUÉ AU RENDU (menus Enregistrer et Fichier) : l'entrée suit la langue
 * active et peut n'apparaître que pour un compte connecté (une entrée `hidden` n'est pas
 * rendue du tout, contrairement à `disabled`).
 */
export type Type_LazyLabelMenuItems = Array<{
  key: string
  label: () => string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: () => boolean
  // Returns the tooltip text for the item. Empty string => no tooltip wrapper.
  tooltip?: () => string
  hidden?: () => boolean
}>
/** Entrées supplémentaires du menu « Aide ». */
export type Type_ExtraHelpMenuItems = Array<{
  key: string
  // Chaîne, ou FONCTION quand le libellé doit suivre la langue : les entrées sont
  // enregistrées une seule fois (à l'initialisation des menus), donc une chaîne y est
  // figée dans la langue du démarrage, alors qu'une fonction est réévaluée à chaque
  // rendu du menu. Les deux formes restent acceptées (les intégrations hors de ce
  // dépôt passent une chaîne).
  label: string | (() => string)
  icon?: React.ReactNode
  onClick: () => void
  disabled?: () => boolean
  // Returns the tooltip text for the item. Empty string => no tooltip wrapper.
  tooltip?: () => string
}>

/**
 * sa#560 — geste de retour proposé quand un traitement ÉCHOUE (import, conversion).
 *
 * L'éditeur sait qu'un traitement a échoué et détient le journal ; il ne sait pas à
 * qui l'envoyer. La couche SaaS sait (formulaire de retour, ticket, adresse de
 * support) mais ne voit pas l'échec. Ce point d'extension les relie, dans le même
 * esprit que `extra_help_menu_items` : posé par la couche haute, appelé par
 * l'éditeur, absent en OpenSankey open-source — où le bouton ne s'affiche alors pas.
 *
 * Libellés en FONCTION, pour la même raison qu'au-dessus : la surface est
 * enregistrée une fois, une chaîne y resterait figée dans la langue du démarrage.
 */
export type Type_ReportProcessFailure = {
  label: () => string
  tooltip?: () => string
  // `title` = ce que l'utilisateur lit dans le bandeau d'échec ; `log` = le journal
  // brut du traitement, tel que le Terminal l'affiche.
  onClick: (failure: { title: string, log: string }) => void
}

// CLASS MENU CONFIG *******************************************************************/
/**
 * Define shortcut to update menu components
 *
 * os#1385 — UNE CLASSE, DEUX RÔLES, SÉPARÉS PAR DÉLÉGATION.
 *
 *  - `new Class_MenuConfig()` : la configuration de l'HÔTE (l'espace de travail). Elle porte
 *    le STOCKAGE de tout ce qui est unique quel que soit le nombre de documents ouverts :
 *    les panneaux, la colonne d'outils, les dialogues, les injections de menus, les refs de
 *    l'interface (barre d'outils, préférences, page d'accueil…).
 *  - `new Class_MenuConfig(host)` : la configuration d'un DOCUMENT. Elle porte ce qui est par
 *    document (refs de contenu, séquence de dataTags, tableur, feuilles…) et DÉLÈGUE à `host`
 *    tout membre d'hôte — le champ de stockage existe encore sur elle, il n'est simplement
 *    jamais lu : l'API publique passe par `this._host`.
 *
 * Les sites d'appel ne changent pas : `mc.panels`, `mc.ref_toolbar`, `mc.tools_column_open`
 * disent la même chose qu'avant, sur l'unique exemplaire de l'hôte.
 *
 * LA GRANDE ZONE (occupants, fenêtre active, sélection de vignettes, `doc_external`, ratios) est
 * MONTÉE à l'hôte au dernier geste du chantier : il n'y a qu'un écran. Les FIGURES sont restées
 * au document — ce sont des objets du fichier (cf. l'en-tête du bloc grande zone).
 *
 * @export
 * @class Class_MenuConfig
 */
export class Class_MenuConfig {

  // PROTECTED  ATTRIBUTES ==============================================================

  /**
   * os#1385 — L'HÔTE de cette configuration : l'espace de travail, ou soi-même quand on EST
   * l'hôte. Posé par le constructeur, jamais réassigné.
   */
  protected _host: Class_MenuConfig
  /** L'hôte auquel les membres d'espace de travail sont délégués (soi-même si on est l'hôte). */
  public get host(): Class_MenuConfig { return this._host }
  /** Cette configuration EST-elle celle de l'espace de travail ? */
  public get is_host(): boolean { return this._host === this }

  /* ========================================
    Configuration menu
    ========================================*/
  // Timeout between steps in sequence (in ms)
  private _timeout_sequence: number = 2000

  /**
   * Order of buttons in top menu
   *
   * @protected
   * @memberof Class_MenuConfig
   */
  protected _menu_top_order = [
    [
      // Document operations grouped together (no internal divider): Fichier
      // (Nouveau/Ouvrir/Enregistrer dropdown), Exporter, and Édition (MEP,
      // spreadsheet editor, Index/TER/TES shortcuts). Legacy split keys
      // (resetDA, open_sankey, save_sankey, export_sankey, mep) stay registered
      // in dict_components_menu_top for backwards-compatible custom orders.
      'fichier',
      // sa#424 (lot 3) — 'export_sankey' RETIRÉ de la barre : Exporter est
      // devenu une commande du menu Fichier. La clé reste enregistrée dans
      // dict_components_menu_top pour les menu_top_order personnalisés.
      'edition',
      'edit_style',
    ],
    [
      // Consolidated "Aide" dropdown gathering Visite guidée + Tutoriels (and
      // any entry an upper layer injects via extra_help_menu_items).
      // Legacy split keys ('tour', 'tutoriel') stay registered in
      // dict_components_menu_top for backwards-compatible custom menu_top_order.
      'aide',
    ],
  //   [
  //     'contact',
  //   ]
  ]

  // #1333 (lot A) — les motifs de flux (dégradé, couleur déduite des extrémités)
  // sont esthétiques : ils font partie de la base gratuite. OpenSankey+ les
  // ajoutait auparavant sous condition de licence.
  protected _flow_color_origin_type: ('flow' | 'source' | 'target' | 'gradient' | 'auto')[] = ['flow', 'source', 'target', 'gradient', 'auto']
  protected _shape_type: string[] = ['bezier_path', 'bezier_outline', 'bezier_outline_exact']

  protected _spreadsheet_freeze = false

  // Mode de placement des nœuds créés depuis le tableur (ajout de flux/nœud) :
  //  - 'auto'      : relance la disposition automatique complète (comportement historique)
  //  - 'none'      : ne replace rien, le nouveau nœud garde sa position par défaut
  //  - 'increment' : ne bouge pas les nœuds existants, le nouveau nœud devine sa position
  //                  à partir de ses voisins (cf. UniverSankeyBridge.placeNewNodesIncrementally)
  // Réglage de session (non persisté).
  protected _spreadsheet_placement_mode: 'auto' | 'none' | 'increment' = 'auto'

  // Affichage des matrices de flux (onglets TES/TER) du tableur :
  //  - 'cross' : 'x' dès qu'un flux origine→destination existe (vue structurelle pure)
  //  - 'value' : valeur du flux pour le data_type sélectionné (sinon 'x' si le flux existe)
  // Réglage de session (non persisté).
  protected _spreadsheet_matrix_mode: 'cross' | 'value' = 'cross'

  // #1243 — `_style_config` (thème + éléments configurables par type) et
  // `_elements_configurable_selected` étaient l'état de la MATRICE type×élément :
  // déposés avec elle. L'inspecteur dérive sa cible de la sélection.
  protected _tab_selected: 'shape' | 'name_label' | 'value_label' | 'icon' | 'stock' = 'shape'
  public get tab_selected() { return this._host._tab_selected }
  public set tab_selected(tab_selected) { this._host._tab_selected = tab_selected }

  // ---------------------------------------------------------------------------------------
  // GRANDE ZONE — os#1385 : ELLE EST DE L'ESPACE DE TRAVAIL, PAS DU DOCUMENT.
  //
  // Il n'y a qu'UNE grande zone à l'écran quel que soit le nombre de documents ouverts : la
  // disposition (occupants, places, poids, détachements, ratios), la SÉLECTION de vignettes et
  // la FENÊTRE ACTIVE décrivent cet écran unique, pas un fichier. Elles montent donc à l'hôte
  // comme les panneaux au lot 1 : le stockage reste un champ de cette classe, mais toute lecture
  // et toute écriture passent par `this._host` (dix champs, cf. lot-3-contrat §5).
  // Les FIGURES, elles, restent au DOCUMENT (`_figures`, `_figures_by_id`, `_figure_natures`,
  // `_figure_seq`, `_figure_report`) : ce sont des objets du fichier, deux documents ne
  // partagent ni leurs `f_N` ni leurs styles. `figureOf` indexe donc les figures du document par
  // une fenêtre de l'hôte, et la persistance ne lit/écrit `main_zone` que `if (is_main)`.
  // ---------------------------------------------------------------------------------------
  // os#1355/1361 : N OCCUPANTS venus du registre des représentations, plus quatre noms en dur.
  //
  // Jusqu'ici la grande zone connaissait quatre occupants nommés (diagramme, tableur, doc,
  // unitaire), chacun avec son booléen, son ratio, son drapeau de détachement, et quatre
  // dispositions rien que pour la doc. Le registre avait rendu l'AXE des représentations
  // extensible ; l'ESPACE, lui, restait codé en dur — un sunburst enregistré n'avait nulle
  // part où se dessiner. Ici, un occupant est un id du registre, et la disposition se
  // CALCULE depuis la liste au lieu d'être écrite : afficher, c'est ajouter un id ; placer,
  // c'est dire dans quelle pile il va ; détacher est une propriété de tout occupant.
  //
  // Les six dispositions historiques de la doc se ramènent aux trois piles à la lecture d'un
  // fichier ancien (cf. mainZoneStateFromJSON) ; « doc à droite du tableur DANS la colonne »
  // devient « doc sous le tableur » — simplification arbitrée (Julien, 08/09/2026).
  //
  // Le diagramme (MAIN_ZONE_CANVAS_ID) est une fenêtre COMME LES AUTRES (arbitrage Julien,
  // 09/09/2026 : « la fenêtre principale peut contenir des graphes ») : il va dans la colonne
  // droite ou le bandeau du bas, et se ferme. Ce modèle ne sait rien du SVG : l'hôte
  // (MainZoneTabs) donne à la drawing area le CADRE de sa case quand il n'est pas `main` (cf.
  // ApplicationData.main_zone_canvas_frame), et le SVG s'y cadre comme une zone détachée.
  // Seul invariant : exactement un occupant `main`, garanti par `_normalizeMainZoneOccupants`
  // après chaque mutation, plutôt que par chaque appelant.
  // ---------------------------------------------------------------------------------------
  protected _main_zone_occupants: Type_MainZoneOccupant[] = [
    { id: MAIN_ZONE_CANVAS_ID, subject: { kind: 'diagram' }, representation: MAIN_ZONE_CANVAS_ID, place: 'main', size: 1 }
  ]
  // Occupants DÉTACHÉS (fenêtre séparée ou dialogue flottant) : ils gardent leur place dans la
  // liste — la refermer les ré-attache là où ils étaient — mais ne réservent plus d'espace.
  // État TRANSITOIRE : une fenêtre détachée ne survit pas au fichier.
  protected _main_zone_detached: Set<string> = new Set()
  /**
   * sa#563 — LA GRANDE ZONE EST-ELLE RENDUE PAR CET HÔTE ?
   *
   * `false` par défaut, et ce n'est pas une précaution théorique : le viewer du paquet MIT
   * (`ViewerOpenSankeyApp`, ViewApp.tsx) monte le dessin et `PresentationPanels`, mais PAS
   * `MainZoneTabs`. Y ouvrir un volet flottant reviendrait à ouvrir une fenêtre que personne ne
   * dessine — c'est-à-dire à perdre en silence la présentation d'un élément chez tous les
   * intégrateurs du paquet.
   *
   * Un DRAPEAU DE L'HÔTE, posé par le composant qui rend la grande zone (au montage, retiré au
   * démontage) et jamais persisté : c'est une propriété de la page, pas du document. Son seul
   * lecteur est le geste d'ouverture d'une présentation (`openPresentationFor`), qui choisit
   * entre le volet flottant — quand il y a une grande zone pour le porter — et la pop-up de
   * panneau, qui reste le seul contenant des hôtes sans grande zone.
   */
  protected _main_zone_hosted: boolean = false
  // os#1387 — Compteur des ids de fenêtres à sujet élément (`w_N`). Réaligné à la lecture d'un
  // fichier sur le plus grand N rencontré, sinon une fenêtre nouvelle prendrait l'id d'une ancienne.
  protected _main_zone_window_seq: number = 0
  /**
   * sa#566 — LE DERNIER ÉTAT DES VOLETS ENREGISTRÉS QU'ON A FERMÉS, par identifiant de vue.
   *
   * Une vue retrouve son volet tel qu'on l'a quitté. Or la fermeture a lieu ici, et cette classe ne
   * connaît pas les vues (elles sont au document) : elle note donc le volet au moment où il part, et
   * c'est le document qui reverse la note dans la vue (`ApplicationData.captureSavedViewWindows`),
   * à l'enregistrement du fichier comme au rappel de la vue. TRANSITOIRE : vidé à la lecture d'une
   * grande zone, qui ouvre un autre état.
   */
  protected _saved_window_snapshots: { [view_id: string]: Type_JSON } = {}
  /**
   * sa#566 — LE VOLET QUI PREND TOUTE LA GRANDE ZONE, ou `null`.
   *
   * Ni flottant, ni ancré : en plein écran. Le volet GARDE sa place (`main`, `right`, `bottom`,
   * `floating`) — c'est elle qu'il retrouve en quittant le plein écran —, et les autres volets
   * restent ouverts, simplement non dessinés tant qu'il l'occupe. Un état de la grille, écrit sous
   * `main_zone.maximized` seulement quand il est posé (fichier inchangé sinon), et levé dès qu'un
   * volet s'ouvre (il doit se voir) ou que le volet en plein écran se ferme.
   */
  protected _main_zone_maximized_id: string | null = null
  // Fenêtre ACTIVE : la dernière cliquée. Ne sert qu'aux raccourcis et au liséré — rien dans
  // l'interface n'a à la deviner (le sélecteur de nature vit dans chaque fenêtre). TRANSITOIRE.
  protected _main_zone_active_id: string | null = null
  // os#1394 — LA VIGNETTE active DANS la fenêtre active (sa clé), pour que le menu de
  // configuration sache de quel dessin il montre les réglages : une fenêtre d'élément en porte
  // N, et « la fenêtre active » ne suffit donc pas à désigner un sujet. TRANSITOIRE elle aussi,
  // et volontairement minimale : ce n'est pas un système de focus, juste la dernière vignette
  // avec laquelle l'utilisateur a interagi. `null` = la première vignette de la fenêtre.
  protected _main_zone_active_pane_key: string | null = null
  // os#1423 — LA SÉLECTION DE VIGNETTES de la fenêtre active. TRANSITOIRE comme la vignette
  // active, et jamais persistée : elle ne décrit pas le document, elle décrit le geste en cours.
  //
  // Elle vit TOUJOURS dans la fenêtre active — une sélection qui survivrait au changement de
  // fenêtre désignerait des clés que la nouvelle fenêtre ne porte pas, ou pire, des clés
  // homonymes qui y désignent d'autres objets. Elle se vide donc partout où la vignette active
  // se vide, aux mêmes endroits et pour la même raison.
  //
  // INVARIANT : la vignette active fait partie de la sélection. Une liste VIDE ne veut pas dire
  // « rien de sélectionné » mais « seulement l'active » (cf. `main_zone_selected_pane_keys`) :
  // c'est ce qui permet à la portée 'selection' de dégénérer en 'pane' sans que personne ait à
  // traiter le cas.
  protected _main_zone_selected_pane_keys: string[] = []
  // os#1394 — CE QUE L'AUTEUR A TOUCHÉ EN DERNIER, et donc ce dont le menu de configuration doit
  // parler. TRANSITOIRE.
  //
  // La règle posée au départ était « une sélection dans le diagramme gagne toujours sur la
  // représentation active ». L'usage l'a démentie : après avoir sélectionné un nœud, cliquer sur
  // la fenêtre d'une étoile pour en régler l'affichage ne donnait rien, le nœud gardait
  // l'inspecteur, et il fallait d'abord le désélectionner. Ce n'est pas une hiérarchie entre
  // sélection et représentation qu'il faut, c'est la RÉCENCE du geste : le dernier gagne.
  //
  // Aucun ordre subtil à maintenir : un clic sur un nœud du canevas active d'abord le canevas
  // (qui n'a rien à régler, donc ne prend pas l'inspecteur) puis pose la sélection, qui repasse
  // le drapeau à 'selection'.
  protected _inspector_focus: 'selection' | 'representation' = 'selection'
  // os#1418 — LES NATURES DE FIGURE ET LEURS STYLES, indexées par identifiant de registre,
  // persistées avec le document (clé racine `figure_styles`). Une nature naît PARESSEUSEMENT, au
  // premier besoin (cf. `figureNature`) : le document ne porte que ce qu'on a réglé.
  //
  // Ce qui a changé par rapport au « défaut par nature » de os#1394, qu'elles remplacent : le
  // style `default` ne s'écrit plus tout seul quand on règle une figure (arbitrage Julien du
  // 16/09/2026), il s'écrit en portée « style » et seulement là — et une figure qui n'a rien
  // surchargé le SUIT, au lieu d'en avoir reçu une copie à sa naissance. Changer le style change
  // donc ce que montrent les figures déjà ouvertes, ce que le défaut recopié ne savait pas faire.
  protected _figure_natures: { [nature_id: string]: Class_FigureNature } = {}
  // os#1418 — L'ANNUAIRE DES FIGURES : une par (fenêtre, clé de vignette). La clé de vignette
  // est `FIGURE_DIAGRAM_PANE_KEY` ('') pour une fenêtre à sujet diagramme, qui n'en a qu'une.
  // Créées paresseusement elles aussi : une figure qui n'a rien à dire n'existe pas, et donc ne
  // s'écrit pas — c'est ce qui garde les fichiers d'aujourd'hui octet pour octet identiques.
  protected _figures: { [occupant_id: string]: { [pane_key: string]: Class_Figure } } = {}
  // os#1421 — LE REGISTRE DES FIGURES DU DOCUMENT, indexé par identifiant `f_N` (clé racine
  // `figures`). C'est le SECOND annuaire, et il ne fait pas double emploi avec le premier :
  //
  //   - `_figures[fenêtre][vignette]` dit OÙ une figure se montre. Il suit la grande zone, il se
  //     vide quand une fenêtre se ferme, et ses clés n'ont de sens que dans la session courante.
  //   - `_figures_by_id[f_N]` dit QUI une figure est. Il ne suit rien : un placement sur un nœud
  //     cite un `f_N`, et ce nom doit survivre à la fermeture de la fenêtre où la figure a été
  //     réglée — sans quoi poser une figure sur un nœud puis refermer sa fenêtre effacerait le
  //     dessin du nœud.
  //
  // L'OBJET EST LE MÊME dans les deux : promouvoir n'en recopie pas un second (c'est tout le sens
  // du placement — un LIEN, pas une copie), ça lui donne un nom et l'indexe une fois de plus.
  // Rerégler la vignette change donc ce que le nœud montre, immédiatement.
  protected _figures_by_id: { [figure_id: string]: Class_Figure } = {}
  // Compteur des identifiants de figure (`f_N`). Réaligné à la lecture d'un fichier sur le plus
  // grand N rencontré, comme `_main_zone_window_seq` : sans cela une figure neuve prendrait le nom
  // d'une figure du fichier, et un placement se retrouverait à citer le mauvais dessin.
  protected _figure_seq: number = 0
  // os#1419 — CE QUE LA MIGRATION N'A PAS SU PORTER. Accumulé par les trois lecteurs (styles,
  // défauts hérités, grande zone) et VIDÉ par `flushFigureMigrationReport`, que la persistance
  // appelle une fois les trois lectures faites : la vider à la fin de chacune la rendrait
  // illisible aux tests et dirait trois fois la moitié de l'histoire (cf. la méthode).
  protected _figure_report: Class_FigureMigrationReport = new Class_FigureMigrationReport()
  // Document EXTERNE affiché à la place de la documentation du diagramme : présentation d'une
  // étude de la sankeythèque (son README). TRANSITOIRE et en lecture seule — il ne touche jamais
  // `documentation_markdown`, qui appartient au diagramme et serait persisté.
  protected _doc_external: { title: string, markdown: string } | null = null
  // os#1482 — LES TABLEAUX DE BORD : la vue de l'espace de travail (cf. Dashboards.ts et NOTE-TABLEAUX DE BORD.md). De
  // l'HÔTE, comme la liste des fenêtres qu'elles figent : un seul magasin par écran, lu et écrit
  // par le document principal seul (clé racine `dashboards`).
  protected _dashboards: Class_DashboardsStore = new Class_DashboardsStore()
  public get dashboards(): Class_DashboardsStore { return this._host._dashboards }
  // Part de la largeur donnée à la zone principale face à la colonne droite (0..1).
  protected _main_zone_split_ratio: number = 2 / 3
  // Hauteur (px) du bandeau du bas, réglée par sa poignée.
  protected _main_zone_bottom_px: number = 280
  // Colonne d'outils à droite (éditeur uniquement). `tools_column_enabled` est posé par
  // SankeyMenu (= !is_static) : en mode publish/statique la colonne n'existe pas et ne réserve rien.
  // OS#300 Lot 2 avait rendu la barre TOUJOURS visible et neutralisé
  // `_tools_column_open`. Il REPILOTE de nouveau l'affichage et la réserve
  // (07/08) : la colonne se replie par sa poignée, ce que demande une page
  // publiée — la colonne y sert un seul bouton et n'a pas à rogner le dessin en
  // permanence. Le pli n'est PAS mémorisé d'une visite à l'autre : chaque
  // chargement rouvre la colonne, sinon un lecteur qui l'a repliée une fois ne
  // retrouverait plus ses filtres.
  // DEUX DRAPEAUX POSÉS PAR UN RENDU, LUS PAR UN AUTRE — d'où la notification
  // (08/08). `filter_bar_available` est écrit par `ToolbarFilter`,
  // `tools_column_enabled` par `SankeyMenus`, et tous deux sont lus par la
  // BARRE DU HAUT (poignée de pli) et par la colonne elle-même.
  //
  // Au premier rendu d'une page publiée, l'ordre joue contre nous : la barre et
  // la colonne se rendent avant que le filtre ait annoncé sa disponibilité,
  // donc avec `false`. Sans notification, rien ne les redessinait ensuite : ni
  // ouvreur de filtres, ni poignée, pour toute la session. Mesuré sur
  // ProjetsORBE le 08/08 — le bundle CONTENAIT le bouton, il ne s'affichait
  // jamais.
  //
  // Notifier au CHANGEMENT seulement : ces deux affectations ont lieu à chaque
  // rendu, et notifier inconditionnellement ferait boucler le rendu sur
  // lui-même.
  protected _tools_column_enabled: boolean = false
  public get tools_column_enabled() { return this._host._tools_column_enabled }
  public set tools_column_enabled(v: boolean) {
    if (this._host._tools_column_enabled === v) return
    this._host._tools_column_enabled = v
    this._notifyMainZone()
  }
  protected _filter_bar_available: boolean = false
  public get filter_bar_available() { return this._host._filter_bar_available }
  public set filter_bar_available(v: boolean) {
    if (this._host._filter_bar_available === v) return
    this._host._filter_bar_available = v
    this._notifyMainZone()
  }
  protected _tools_column_open: boolean = true
  // #248 — bus pub/sub générique par topic (remplace la liste plate `_main_zone_listeners`).
  //
  // os#1385 — UN BUS PAR INSTANCE, mais deux destinations. Les signaux d'ESPACE DE TRAVAIL
  // (cf. HOST_TOPICS) montent sur le bus de l'hôte, les signaux de CONTENU restent sur celui
  // du document. Pour le document principal, hôte et document partagent de fait le même bus
  // qu'aujourd'hui — rien ne change à l'écran. Pour un document secondaire, ses signaux de
  // contenu restent chez lui (le lot 2 les rebranchera à l'actif) et ses signaux d'espace de
  // travail montent, de sorte qu'un panneau ouvert par lui repeint bien la barre latérale.
  protected _event_bus: Class_EventBus = new Class_EventBus()
  /** Le bus qui porte ce topic : celui de l'hôte pour un signal d'espace de travail, le sien sinon. */
  protected _busFor(topic: string): Class_EventBus {
    return HOST_TOPICS.has(topic) ? this._host._event_bus : this._event_bus
  }
  protected _notifyMainZone() { this._host._event_bus.notify(MAIN_ZONE_TOPIC) }
  public get tools_column_open() { return this._host._tools_column_open }
  public set tools_column_open(v: boolean) { this._host._tools_column_open = v; this._notifyMainZone() }
  /** Largeur (px) réservée à droite par la colonne d'outils.
   *
   *  Nulle quand la colonne est REPLIÉE (07/08) : repliée, elle ne laisse
   *  qu'une poignée flottante, elle ne doit donc plus rogner le dessin — c'est
   *  tout l'intérêt de la replier sur une page publiée, où chaque pixel de
   *  diagramme compte. */
  public getToolsColumnWidthPx(): number {
    return (this.tools_column_enabled && this.tools_column_open)
      ? TOOLS_COLUMN_WIDTH_PX : 0
  }

  // #1283 — Éditeur de groupe de tags injecté par OSP (l'édition vit dans OSP,
  // le filtre dans OS base). Le filtre appelle ce renderer pour déplier l'édition
  // d'un groupe EN PLACE, sous sa rangée de filtre (fusion usage/édition). Null
  // en OS pur / sans licence : le crayon d'édition ne s'affiche pas.
  protected _render_tag_group_editor:
    ((element_tag_name_prop: string, group_id: string) => JSX.Element | null) | null = null
  public get render_tag_group_editor():
    ((element_tag_name_prop: string, group_id: string) => JSX.Element | null) | null {
    return this._host._render_tag_group_editor
  }
  public set render_tag_group_editor(
    v: ((element_tag_name_prop: string, group_id: string) => JSX.Element | null) | null
  ) { this._host._render_tag_group_editor = v }

  // sa#283 lot 2 — Enregistrement de vue contextuelle (« personnaliser pour ‹tag› »)
  // injecté par OSP (même pattern que render_tag_group_editor : la feature vit dans OSP,
  // le tiroir de filtres dans l'éditeur OS). Sur la carte d'un groupe de dataTags ou de
  // fluxTags dont UN tag est sélectionné, le tiroir affiche un interrupteur : armé, les
  // modifications sont capturées par diff au désarmement dans le contexte lié au tag.
  //  - `armed(group_id)` : id du tag en enregistrement pour ce groupe, sinon null ;
  //  - `arm(group_id, tag_id)` : arme (désarme AVEC capture un éventuel autre) ;
  //  - `disarm()` : désarme AVEC capture.
  // Null en OS pur : la feature n'existe pas sans la couche OSP.
  protected _context_recording_ui: Type_ContextRecordingUI | null = null
  public get context_recording_ui(): Type_ContextRecordingUI | null {
    return this._host._context_recording_ui
  }
  public set context_recording_ui(v: Type_ContextRecordingUI | null) {
    this._host._context_recording_ui = v
  }

  // OS#300 — Modèle central des « panneaux » (info-bulle / pop-up / barre
  // latérale). Instancié dans le constructeur avec le bus de ce menu, de sorte
  // que les coquilles PanelShell s'abonnent via `subscribe(PANELS_TOPIC, …)`.
  //
  // os#1385 — UN SEUL PanelManager pour tout l'espace de travail : il n'est construit que
  // sur l'hôte (cf. constructeur), sur le bus de l'hôte, et un document rend le sien. C'est
  // ce qui fait que la barre latérale ouverte depuis un document est LA barre latérale.
  protected _panels!: Class_PanelManager
  public get panels(): Class_PanelManager { return this._host._panels }

  // OS#300 — Le panneau de Configuration est désormais un « panneau » unifié
  // (id 'config') piloté par `panels`. `config_panel_pinned` (lu par
  // l'inspecteur, l'assemblage et le tableur) devient une VUE de son mode :
  // ancré = barre latérale, dé-ancré = pop-up déplaçable. Le dernier contenant
  // choisi est mémorisé pour rouvrir la config dans le même mode.
  // Défaut = POP-UP (superposée, ne réserve PAS de largeur) : l'ouverture
  // AUTOMATIQUE de la config (sélection de nœud/flux, stock, légende… cf.
  // DrawingAreaInteractions) ne doit jamais recadrer le dessin — invariant
  // historique. L'ancrage en barre latérale reste un choix délibéré (en-tête).
  protected _config_last_container: Type_PanelMode = 'popup'
  public get config_last_container(): Type_PanelMode { return this._host._config_last_container }
  public get config_panel_pinned() { return this.panels.getMode('config') === 'sidebar' }
  public set config_panel_pinned(v: boolean) {
    this._host._config_last_container = v ? 'sidebar' : 'popup'
    // Ne re-router que si la config est ouverte : sinon on ne fait que mémoriser
    // le mode de réouverture (l'ouverture elle-même passe par setConfigOpen).
    if (this.panels.isOpen('config')) this.panels.setMode('config', this.config_last_container)
  }
  /** Largeur (px) réservée à droite par la config quand elle est la barre
   *  latérale (0 sinon). La réserve GLOBALE passe par panels.getSidebarReservedPx().
   *  ⚠️ OS#388 — Ne JAMAIS s'en servir pour déclencher un recadrage : la barre
   *  latérale est partagée, donc changer de menu ancré fait basculer cette valeur
   *  (270 -> 0) et sa symétrique (0 -> 270) sans que la réserve totale bouge.
   *  Plus aucun consommateur interne ; conservé pour l'API publique. */
  public getConfigPanelPinnedReservedPx(): number {
    return this.panels.sidebar_id === 'config' ? this.panels.getSidebarReservedPx() : 0
  }
  // OS#300 — Le tiroir de FILTRES est un « panneau » unifié (id 'filter') en
  // ÉDITEUR : pop-up ou barre latérale partagée (270px), piloté par `panels`
  // (comme la config). `filter_panel_pinned` devient une VUE de son mode ancré.
  // Vaut en ÉDITEUR comme en PUBLISH (le filtre est au même endroit, à droite).
  // Dernier contenant mémorisé pour la réouverture ; défaut = pop-up (comme la
  // config), superposée sans recadrer le dessin.
  protected _filter_last_container: Type_PanelMode = 'popup'
  public get filter_last_container(): Type_PanelMode { return this._host._filter_last_container }
  /** Une page PUBLIÉE ouvre ce panneau ANCRÉ (07/08) : c'est sa légende, elle
   *  accompagne la lecture au lieu de flotter par-dessus le diagramme. Posé UNE
   *  fois par chargement — `filter_panel_docked_by_default` retient que le
   *  défaut a été appliqué, pour qu'un lecteur qui dépingle ne se le voie pas
   *  ré-imposer au rendu suivant. En édition, rien ne change : le filtre reste
   *  une pop-up tant qu'on ne l'ancre pas. */
  protected _filter_panel_docked_by_default = false
  public get filter_panel_docked_by_default(): boolean {
    return this._host._filter_panel_docked_by_default
  }
  public set filter_panel_docked_by_default(v: boolean) {
    this._host._filter_panel_docked_by_default = v
  }
  public applyPublishedFilterDock() {
    if (this.filter_panel_docked_by_default) return
    this.filter_panel_docked_by_default = true
    this._host._filter_last_container = 'sidebar'
  }
  public get filter_panel_pinned() { return this.panels.getMode('filter') === 'sidebar' }
  public set filter_panel_pinned(v: boolean) {
    this._host._filter_last_container = v ? 'sidebar' : 'popup'
    if (this.panels.isOpen('filter')) this.panels.setMode('filter', this.filter_last_container)
  }
  // Largeur publiée par la Toolbar (informative ; la réserve passe désormais par
  // la largeur partagée de la barre latérale de `panels`).
  protected _filter_drawer_open: boolean = false
  public get filter_drawer_open(): boolean { return this._host._filter_drawer_open }
  public set filter_drawer_open(v: boolean) { this._host._filter_drawer_open = v }
  protected _filter_drawer_width_px: number = 0
  public get filter_drawer_width_px(): number { return this._host._filter_drawer_width_px }
  public set filter_drawer_width_px(v: number) { this._host._filter_drawer_width_px = v }
  /** Largeur (px) réservée à droite par le filtre quand il est la barre latérale
   *  (0 sinon). La réserve GLOBALE passe par panels.getSidebarReservedPx().
   *  ⚠️ OS#388 — Même mise en garde que getConfigPanelPinnedReservedPx : ce n'est
   *  pas un déclencheur de recadrage. Plus aucun consommateur interne. */
  public getFilterPanelPinnedReservedPx(): number {
    return this.panels.sidebar_id === 'filter' ? this.panels.getSidebarReservedPx() : 0
  }

  // OS#321 — la galerie de modèles n'a plus d'épinglage ni de bande réservée
  // PROPRES : c'est un panneau unifié ('templates'), pop-up transitoire ou barre
  // latérale partagée, comme la config et les filtres. Sa réserve, quand elle est
  // ancrée, passe donc par panels.getSidebarReservedPx().

  /** Réserve TOTALE de « chrome » à droite : colonne d'outils + barre latérale
   *  unifiée. C'est l'offset commun de la colonne tableur/doc/unitaire
   *  (MainZoneTabs) et de la réserve du diagramme — même système de fenêtrage
   *  pour tous les panneaux dockés (#1243). */
  public getRightChromeReservedPx(): number {
    // La barre latérale unifiée (config / filtre / recherche / modèles) est
    // couverte par panels.getSidebarReservedPx() — ne PAS ré-additionner la
    // réserve du filtre.
    return this.getToolsColumnWidthPx() + this.panels.getSidebarReservedPx()
  }
  // --- Occupants de la grande zone (os#1355/1361) -----------------------------------------

  /** Les occupants dans l'ordre des piles. COPIE : les mutations passent par les méthodes. */
  public get main_zone_occupants(): Type_MainZoneOccupant[] {
    return this._host._main_zone_occupants.map(o => ({ ...o }))
  }
  public isMainZoneOccupant(id: string): boolean {
    return this._host._main_zone_occupants.some(o => o.id === id)
  }
  /** Occupants EFFECTIFS d'une pile : présents et non détachés (un détaché ne réserve rien). */
  public mainZoneOccupantsIn(place: Type_MainZonePlace): Type_MainZoneOccupant[] {
    return this._host._main_zone_occupants
      .filter(o => o.place === place && !this._host._main_zone_detached.has(o.id))
      .map(o => ({ ...o }))
  }
  /** L'occupant principal, ou null (jamais après normalisation, sauf liste vide transitoire). */
  public get main_zone_main_id(): string | null {
    return this._host._main_zone_occupants.find(o => o.place === 'main')?.id ?? null
  }
  public mainZonePlaceOf(id: string): Type_MainZonePlace | null {
    return this._host._main_zone_occupants.find(o => o.id === id)?.place ?? null
  }
  /** sa#563 — Ce volet flotte-t-il au-dessus de la grille ? */
  public isMainZoneFloating(id: string): boolean {
    return this.mainZonePlaceOf(id) === 'floating'
  }
  /**
   * sa#563 — Les occupants de la GRILLE : ceux qui prennent une case. Un volet flottant n'en
   * prend aucune, et c'est la seule différence entre lui et ses voisins — d'où cette lecture,
   * dont se servent l'invariant du `main`, la réserve du dessin et le refus de fermer le dernier.
   */
  public get main_zone_grid_occupants(): Type_MainZoneOccupant[] {
    return this._host._main_zone_occupants
      .filter(o => o.place !== 'floating')
      .map(o => ({ ...o }))
  }
  /** sa#563 — cf. `_main_zone_hosted` : la grande zone est-elle rendue par cette page ? */
  public get main_zone_hosted(): boolean { return this._host._main_zone_hosted }
  public set main_zone_hosted(v: boolean) {
    if (this._host._main_zone_hosted === v) return
    this._host._main_zone_hosted = v
    this._notifyMainZone()
  }
  /**
   * sa#563 — LA GÉOMÉTRIE d'un volet flottant, bornée.
   *
   * Les bornes sont celles des pop-ups, à un détail près qui compte : la POSITION est bornée
   * elle aussi, pour qu'un volet garde toujours de quoi être attrapé par son en-tête. Une
   * géométrie enregistrée sur un écran plus large replaçait sinon le volet hors de la fenêtre,
   * où il est ouvert, invisible et insaisissable (même défaut qu'os#1494 sur les panneaux).
   */
  public setMainZoneOccupantGeometry(id: string, geometry: Type_PopupGeometry): void {
    const o = this._host._main_zone_occupants.find(x => x.id === id)
    if (!o) return
    o.geometry = clampMainZoneFloatingGeometry(geometry)
    this._notifyMainZone()
  }

  /**
   * Affiche un occupant. Sans `place`, il va en `main` si la zone principale est libre, sinon
   * dans la colonne droite — c'est le geste « ouvrir » de la barre du haut. Déjà présent : ne
   * change de place que si on la demande.
   */
  public showMainZoneOccupant(id: string, place?: Type_MainZonePlace): void {
    const existing = this._host._main_zone_occupants.find(o => o.id === id)
    if (existing) {
      if (place && existing.place !== place) existing.place = place
    } else if (id === MAIN_ZONE_CANVAS_ID && !place) {
      // Le diagramme qui revient reprend la principale ; celui qui l'occupait prend sa place.
      this._pushMainZoneOccupant({ id, subject: { kind: 'diagram' }, representation: id }, 'right')
      this._normalizeMainZoneOccupants()
      this.makeMainZoneOccupantMain(id)
      return
    } else {
      // Une fenêtre à sujet DIAGRAMME : son id est sa représentation (cf. Type_MainZoneOccupant).
      this._pushMainZoneOccupant({ id, subject: { kind: 'diagram' }, representation: id }, place)
    }
    // os#1431 — LA FENÊTRE QU'ON VIENT D'OUVRIR EST CELLE QU'ON REGARDE, comme le fait déjà
    // `openMainZoneWindow` pour les fenêtres d'élément. Sans cela, elle naîtrait inactive : depuis
    // que l'en-tête ne paraît que sur la fenêtre active (cf. `OccupantHeader`), elle n'aurait ni
    // nom ni croix de fermeture tant qu'on n'aurait pas cliqué dedans.
    this._host._main_zone_active_id = id
    this._normalizeMainZoneOccupants()
    this._notifyMainZone()
  }
  /** Ajoute une fenêtre à la place demandée (ou `main` si libre, sinon la colonne droite). */
  protected _pushMainZoneOccupant(
    o: { id: string, subject: Type_MainZoneSubject, representation: string }, place?: Type_MainZonePlace
  ): void {
    const wanted = place ?? (this.main_zone_main_id === null ? 'main' : 'right')
    // sa#566 — un volet qu'on ouvre doit se voir : le plein écran d'un autre cède, sauf devant un
    // volet FLOTTANT, qui se pose par-dessus (cf. `mainZoneLayout`).
    if (wanted !== 'floating') this._host._main_zone_maximized_id = null
    // Poids d'arrivée = poids moyen de la pile, pour partager sans écraser les réglages.
    const peers = this._host._main_zone_occupants.filter(x => x.place === wanted)
    const size = peers.length > 0 ? peers.reduce((s, x) => s + x.size, 0) / peers.length : 1
    // os#1418 — PLUS AUCUN DÉFAUT RECOPIÉ ICI. Une fenêtre neuve naît sans réglages, et ses
    // figures SUIVENT le style `default` de leur nature (cf. `Class_Figure`) : elle est donc
    // réglée comme les autres sans qu'on lui ait rien écrit, et elle le restera si l'auteur
    // change le style ensuite. La recopie de os#1394 figeait au contraire l'état du style à
    // l'instant de l'ouverture.
    this._host._main_zone_occupants.push({ ...o, place: wanted, size })
  }

  // --- os#1387 : fenêtres = (sujet, représentation) ------------------------------------------

  /**
   * Ouvre une fenêtre. Sujet diagramme SUR LA FEUILLE COURANTE : c'est `showMainZoneOccupant`
   * (une par représentation). Sujet élément, ou sujet diagramme sur une AUTRE FEUILLE : une
   * fenêtre NEUVE à id propre, pour pouvoir en avoir plusieurs sur la même représentation —
   * épinglées sur des objets différents, ou pointées sur des feuilles différentes (os#1385
   * lot 0 : le canevas de la feuille B à côté de celui qu'on édite). Rend l'id de la fenêtre.
   *
   * os#1498 — TROISIÈME CAS D'IDENTIFIANT PROPRE : LA NATURE LE DEMANDE. Un sujet diagramme sur
   * la feuille courante suffisait à dire « une seule fenêtre, nommée par sa représentation » tant
   * que toute nature de cette échelle montrait LE document. Une nature qui déclare `allow_many`
   * montre le document SOUS UN ANGLE que sa figure porte — le groupe d'étiquettes de la vue par
   * groupe —, et deux angles côte à côte sont l'usage même : un id de registre ne peut pas nommer
   * deux fenêtres, elle rejoint donc les fenêtres d'élément. Le registre n'est consulté QU'ICI
   * (cf. `representationAllowsMany`) ; tout ce qui suit lit l'identifiant, pas la nature.
   */
  public openMainZoneWindow(
    subject: Type_MainZoneSubject, representation: string, place?: Type_MainZonePlace,
    /**
     * sa#563 — La géométrie du volet quand `place` vaut 'floating' : elle vient de l'APPELANT,
     * qui seul sait à côté de quoi poser le volet (l'élément cliqué, cf. `placeFloatingNear`).
     * Absente, la naissance se fait au centre — c'est le cas d'un geste qui ne désigne rien.
     */
    geometry?: Type_PopupGeometry
  ): string {
    if (!mainZoneSubjectUsesOwnWindowId(subject) && !representationAllowsMany(representation)) {
      // sa#563 — une fenêtre DÉJÀ ouverte ne se fait pas déménager par un second geste
      // d'ouverture : si l'auteur l'a ancrée en volet, la rouvrir depuis la légende ne doit pas
      // la ré-arracher à la grille. Seule une fenêtre NEUVE reçoit la place demandée.
      const known = this.isMainZoneOccupant(representation)
      this.showMainZoneOccupant(representation, known ? undefined : place)
      if (!known && place === 'floating') this._ensureFloatingGeometry(representation, geometry)
      return representation
    }
    let id = ''
    do {
      this._host._main_zone_window_seq += 1
      id = `w_${this._host._main_zone_window_seq}`
    } while (this.isMainZoneOccupant(id))
    this._pushMainZoneOccupant({ id, subject, representation }, place ?? 'right')
    if (place === 'floating') this._ensureFloatingGeometry(id, geometry)
    this._normalizeMainZoneOccupants()
    this._host._main_zone_active_id = id
    // os#1394 — la fenêtre qu'on vient d'ouvrir devient l'active, sur sa PREMIÈRE vignette :
    // la clé de la vignette active d'une autre fenêtre n'a aucun sens ici.
    this._host._main_zone_active_pane_key = null
    // os#1423 — et sur une sélection VIERGE, pour la même raison : les clés sélectionnées dans la
    // fenêtre qu'on quitte ne nomment rien ici.
    this._host._main_zone_selected_pane_keys = []
    this._notifyMainZone()
    return id
  }
  // --- sa#566 : un volet enregistré EST une vue --------------------------------------------
  //
  // Une vue et un volet sont le même objet : ils prennent la même forme, portent les mêmes
  // réglages, et la seule différence est qu'une vue est enregistrée dans le fichier là où un volet
  // est éphémère. Cette classe porte la moitié « volet » du lien — quel volet est quelle vue, et la
  // forme sous laquelle une vue garde son volet ; les vues elles-mêmes sont au document
  // (`ApplicationData.views_dict`), qui porte l'autre moitié.

  /**
   * sa#566 — Le volet en plein écran, ou `null`. Un volet détaché ne l'est pas : il vit dans sa
   * fenêtre du système, et la grande zone n'a rien à lui donner.
   */
  public get main_zone_maximized_id(): string | null {
    const id = this._host._main_zone_maximized_id
    if (id === null || !this.isMainZoneOccupant(id) || this.isMainZoneDetached(id)) return null
    return id
  }
  /** Met un volet en plein écran, ou en fait sortir la grande zone (`null`). */
  public setMainZoneMaximized(id: string | null): void {
    const next = (id !== null && this.isMainZoneOccupant(id)) ? id : null
    if (this._host._main_zone_maximized_id === next) return
    this._host._main_zone_maximized_id = next
    if (next !== null) this._host._main_zone_active_id = next
    this._notifyMainZone()
  }

  /**
   * sa#566 — RAMÈNE UN VOLET AU PREMIER PLAN, dans l'affichage où il est, comme on sélectionne
   * une fenêtre du système : il devient actif ; flottant, il passe devant les autres flottants
   * (leur ordre de rendu est celui de la liste) ; dans la grille, il fait sortir du plein écran
   * un AUTRE volet qui le cacherait. Sa place, elle, ne change pas : c'est dans son bandeau qu'on
   * la change ensuite.
   */
  public bringMainZoneOccupantForward(id: string): void {
    const host = this._host
    const at = host._main_zone_occupants.findIndex(o => o.id === id)
    if (at < 0) return
    const o = host._main_zone_occupants[at]
    if (o.place === 'floating') {
      host._main_zone_occupants.splice(at, 1)
      host._main_zone_occupants.push(o)
    } else if (host._main_zone_maximized_id !== null && host._main_zone_maximized_id !== id) {
      host._main_zone_maximized_id = null
    }
    host._main_zone_active_id = id
    host._main_zone_active_pane_key = null
    host._main_zone_selected_pane_keys = []
    this._notifyMainZone()
  }

  /** Le volet ouvert qui EST la vue `view_id`, s'il y en a un. */
  public mainZoneOccupantOfSavedView(view_id: string): Type_MainZoneOccupant | undefined {
    const o = this._host._main_zone_occupants.find(x => x.saved_view === view_id)
    return o ? { ...o } : undefined
  }

  /**
   * Relie un volet à une vue — il devient ce qu'elle est — ou l'en délie (`undefined`) : il
   * redevient éphémère, sans que rien d'autre ne change à l'écran. Une vue n'a qu'un volet : le
   * lier en délie tout autre qui la portait.
   */
  public setMainZoneOccupantSavedView(id: string, view_id: string | undefined): void {
    const o = this._host._main_zone_occupants.find(x => x.id === id)
    if (!o) return
    if (view_id) {
      this._host._main_zone_occupants.forEach(x => { if (x !== o && x.saved_view === view_id) delete x.saved_view })
      o.saved_view = view_id
    } else delete o.saved_view
    this._notifyMainZone()
  }

  /**
   * Le volet `id` sous la forme qu'en garde sa vue : une entrée de `main_zone.occupants`, sans rang
   * ni lien (cf. `_mainZoneOccupantToJSON`). `undefined` si le volet n'est pas ouvert.
   */
  public mainZoneWindowToJSON(id: string): Type_JSON | undefined {
    const o = this._host._main_zone_occupants.find(x => x.id === id)
    return o ? this._mainZoneOccupantToJSON(o) : undefined
  }

  /** Note l'état des volets ENREGISTRÉS parmi `ids`, qui s'apprêtent à quitter la grande zone. */
  protected _snapshotSavedWindows(ids: string[]): void {
    ids.forEach(id => {
      const o = this._host._main_zone_occupants.find(x => x.id === id)
      if (o?.saved_view) this._host._saved_window_snapshots[o.saved_view] = this._mainZoneOccupantToJSON(o)
    })
  }

  /** Rend, et oublie, les notes des volets enregistrés fermés depuis le dernier relevé. */
  public takeSavedWindowSnapshots(): { [view_id: string]: Type_JSON } {
    const notes = this._host._saved_window_snapshots
    this._host._saved_window_snapshots = {}
    return notes
  }

  /**
   * Ouvre le volet d'une vue depuis la forme qu'elle en garde, et le relie à elle.
   *
   * Même règle d'identifiant qu'à l'ouverture d'un volet (`openMainZoneWindow`) : une nature
   * d'échelle diagramme sur la feuille courante n'a qu'une fenêtre, qu'on RÉUTILISE si elle est déjà
   * là — la vue lui rend sa place et ses réglages —, tout autre sujet prend un identifiant neuf. La
   * place `main` s'obtient par l'échange ordinaire (`makeMainZoneOccupantMain`) : la principale du
   * moment prend la place du volet, rien ne disparaît.
   *
   * Rend l'identifiant du volet, ou `null` quand la forme ne nomme aucune nature.
   */
  public openMainZoneWindowFromJSON(json: Type_JSON, view_id: string): string | null {
    const e = this._parseMainZoneOccupantEntry('', json)
    // La vue qu'on rappelle doit se voir : un autre volet en plein écran cède — sauf si elle
    // flotte, auquel cas elle se pose par-dessus, comme une fenêtre qu'on ramène au premier plan.
    if (e.place !== 'floating' || e.maximized) this._host._main_zone_maximized_id = null
    let id = ''
    if (!mainZoneSubjectUsesOwnWindowId(e.subject)) {
      id = e.representation
      if (id === '') return null
      if (!this.isMainZoneOccupant(id)) {
        this._pushMainZoneOccupant({ id, subject: { kind: 'diagram' }, representation: id }, e.place)
      }
    } else {
      if (e.representation === '') return null
      do {
        this._host._main_zone_window_seq += 1
        id = `w_${this._host._main_zone_window_seq}`
      } while (this.isMainZoneOccupant(id))
      this._pushMainZoneOccupant({ id, subject: e.subject, representation: e.representation }, e.place)
    }
    const o = this._host._main_zone_occupants.find(x => x.id === id)!
    // La place `main` est posée par l'échange, plus bas : l'écrire ici ferait deux principales.
    if (e.place !== 'main') o.place = e.place
    o.size = e.size
    if (e.geometry) o.geometry = e.geometry
    this._host._main_zone_occupants.forEach(x => { if (x !== o && x.saved_view === view_id) delete x.saved_view })
    o.saved_view = view_id
    this._host._main_zone_detached.delete(id)
    if (e.place === 'floating') this.enforceMainZoneFloatingCap(id)
    // Les réglages de la VUE remplacent ceux que portait une fenêtre réutilisée.
    this._dropFigures(id)
    this._normalizeMainZoneOccupants()
    this._loadFiguresFromJSON(new Map([[id, { figures: e.figures, options: e.options }]]))
    this._host._main_zone_active_id = id
    this._host._main_zone_active_pane_key = null
    this._host._main_zone_selected_pane_keys = []
    if (e.place === 'main') this.makeMainZoneOccupantMain(id)
    // Une vue quittée en plein écran s'y rouvre.
    if (e.maximized) this._host._main_zone_maximized_id = id
    this._notifyMainZone()
    return id
  }

  /**
   * Change la NATURE d'une fenêtre sur le même sujet — le geste « type de graphique » d'Excel.
   * Fenêtre à id propre (sujet élément, ou diagramme d'une autre feuille) : on change la
   * représentation, l'id ne bouge pas. Fenêtre diagramme de la feuille courante : l'id EST la
   * représentation, donc la fenêtre est remplacée en place (même place, même poids) ; si la
   * représentation visée est déjà ouverte ailleurs, celle-ci se referme simplement.
   *
   * Le remplacement en place ne vaut QUE pour ce dernier cas : appliqué à une fenêtre de
   * feuille, il lui donnerait l'identifiant de la représentation — donc celui du canevas de la
   * feuille courante — et les deux canevas fusionneraient en un seul (os#1385 lot 0).
   *
   * os#1418 — CHANGER DE NATURE JETTE LES FIGURES DE LA FENÊTRE, et c'est un changement
   * OBSERVABLE : passer une fenêtre de l'étoile à la couronne puis revenir à l'étoile ne
   * retrouve plus les réglages qu'on y avait faits. C'est délibéré — les réglages d'une nature
   * n'ont pas de sens dans une autre (un flux de référence d'étoile dans un sunburst, un axe de
   * décomposition dans le tableur) — et c'est aussi ce que faisait l'ancien mécanisme, qui
   * gardait certes le sac `options` mais le donnait à lire à une entrée de registre qui n'y
   * reconnaissait rien. La différence est qu'on le dit, et qu'on ne traîne plus les clés mortes.
   */
  public setMainZoneWindowRepresentation(id: string, representation: string): void {
    const o = this._host._main_zone_occupants.find(x => x.id === id)
    if (!o || o.representation === representation) return
    // Jeté AVANT la mutation : dans la branche « remplacement en place » l'occupant change d'id,
    // et ses figures resteraient sinon indexées sous l'ancien — orphelines et persistées.
    this._dropFigures(id)
    // os#1498 — LE JUGE EST L'OCCUPANT, PAS SON SUJET. Une fenêtre de nature `allow_many` a un
    // sujet diagramme sans feuille mais un identifiant propre : la traiter par le remplacement en
    // place la rebaptiserait du nom de sa nouvelle nature, et deux vues de groupe qui changent
    // pour la même nature fusionneraient en une — exactement le piège d'os#1385 lot 0.
    if (mainZoneOccupantUsesOwnWindowId(o)) {
      o.representation = representation
    } else if (this.isMainZoneOccupant(representation)) {
      this._host._main_zone_occupants = this._host._main_zone_occupants.filter(x => x.id !== id)
      this._host._main_zone_detached.delete(id)
    } else {
      o.id = representation
      o.representation = representation
      if (this._host._main_zone_active_id === id) this._host._main_zone_active_id = representation
    }
    this._normalizeMainZoneOccupants()
    // os#1423 — la sélection est relue APRÈS la normalisation, et sur l'id COURANT de la fenêtre
    // (la branche « remplacement en place » vient peut-être de le changer). Un sujet `elements`
    // garde ses vignettes en changeant de nature — donc sa sélection ; un sujet à critère, dont
    // les vignettes se redemandent au diagramme, la perd (cf. `_resyncMainZoneSelection`).
    this._resyncMainZoneSelection(o.id)
    this._notifyMainZone()
  }
  /**
   * Épingle (node/link/elements/tag) ou remet à suivre (selection) une fenêtre à sujet élément.
   *
   * os#1420 — UN SUJET À CRITÈRE N'ÉLAGUE PAS LES FIGURES, et c'est délibéré. Le ménage de
   * `elements` s'appuie sur la liste des clés VIVANTES, que le sujet porte ; un critère ne la porte
   * pas — les clés sont les nœuds que le diagramme désigne à cet instant, et cette classe ne
   * connaît pas le diagramme. Élaguer sur ce qu'on sait ici reviendrait à tout jeter. Le coût de ne
   * pas élaguer est qu'une figure réglée sur un nœud qui cesse de porter l'étiquette survit dans
   * l'annuaire, et se retrouve telle quelle si le nœud la porte à nouveau — ce qui est plutôt le
   * comportement attendu d'un critère : ce n'est pas l'auteur qui a retiré la vignette.
   */
  public setMainZoneWindowSubject(id: string, subject: Type_MainZoneSubject): void {
    const o = this._host._main_zone_occupants.find(x => x.id === id)
    if (!o || o.subject.kind === 'diagram' || subject.kind === 'diagram') return
    if (subject.kind === 'elements') {
      // Les deux tableaux sont RECOPIÉS ensemble : ils sont parallèles, et n'en recopier qu'un
      // ferait qu'un appelant qui garde le sien décalerait silencieusement les clés des
      // vignettes — donc leurs réglages — sur les objets voisins.
      o.subject = { ...subject, ids: [...subject.ids], keys: mainZonePaneKeys(subject) }
      // os#1387 — les réglages des vignettes qui ne sont PLUS là s'en vont avec elles. Sans ce
      // ménage, l'annuaire des figures grossirait à chaque objet ajouté puis retiré, et — plus
      // gênant — un objet remis dans la fenêtre ressusciterait des réglages que l'auteur avait
      // oubliés. La liste des clés VIVANTES est celle qu'on vient d'écrire.
      this._pruneFigures(o.id, o.subject.keys ?? [])
    } else o.subject = { ...subject }
    // os#1423 — la sélection de vignettes suit le même ménage que les figures : une clé qui ne
    // nomme plus de vignette ne peut pas rester sélectionnée.
    this._resyncMainZoneSelection(o.id)
    this._notifyMainZone()
  }

  /**
   * os#1423 — LA SÉLECTION APRÈS UN CHANGEMENT DE SUJET OU DE NATURE : on garde ce qui vit
   * encore, et rien d'autre.
   *
   * Sans effet quand `id` n'est pas la fenêtre active : la sélection n'existe QUE là (cf.
   * `_main_zone_selected_pane_keys`), régler une fenêtre voisine n'a donc rien à élaguer.
   *
   * Sujet `elements` : les clés vivantes sont celles que le sujet porte, la même liste qui sert
   * au ménage des figures. Sujet `selection` ou `tag` : les vignettes sont les objets que le
   * DIAGRAMME désigne à cet instant, et cette classe ne le connaît pas (même raison qu'en
   * os#1420, où l'élagage des figures a été renoncé pour les sujets à critère). Ne sachant pas
   * ce qui survit, on VIDE — ce qui, l'invariant aidant, revient à « seulement l'active » et non
   * à « plus rien » : le geste perdu est une sélection multiple, pas la vignette qu'on regarde.
   * C'est le choix prudent, l'autre étant de garder des clés qui ne désignent peut-être plus
   * rien et de les propager au prochain réglage de portée 'selection'.
   */
  protected _resyncMainZoneSelection(id: string): void {
    if (this.main_zone_active_id !== id) return
    if (this._host._main_zone_selected_pane_keys.length === 0) return
    const o = this._host._main_zone_occupants.find(x => x.id === id)
    const alive: string[] = (o && o.subject.kind === 'elements') ? mainZonePaneKeys(o.subject) : []
    const kept = this._host._main_zone_selected_pane_keys.filter(k => alive.includes(k))
    this._host._main_zone_selected_pane_keys = kept
    // La vignette active suit la sélection quand il en reste une — l'invariant veut qu'elle en
    // fasse partie. Sélection VIDÉE, en revanche, on ne touche PAS à la vignette active : vide
    // veut dire « seulement l'active », et l'effacer ici retirerait à l'inspecteur le dessin
    // qu'il montre pour un changement de sujet qui ne le concerne pas forcément (le ménage de la
    // vignette active, lui, se fait au changement de FENÊTRE).
    if (kept.length > 0 && this._host._main_zone_active_pane_key !== null
      && !kept.includes(this._host._main_zone_active_pane_key)) {
      this._host._main_zone_active_pane_key = kept[0]
    }
  }

  // --- os#1418 : les figures de la grande zone ------------------------------------------------

  /**
   * LA NATURE d'un identifiant de registre, créée au premier besoin.
   *
   * Sa déclaration d'attributs vient de l'ENTRÉE DE REGISTRE (`attributes`) : c'est là qu'une
   * représentation dit ce qu'elle se laisse régler, comme un nœud le dit dans
   * `ALL_ATTRIBUTES_CONFIG`. Une nature inconnue du registre (fichier plus récent, module non
   * chargé) obtient une déclaration VIDE plutôt qu'une erreur : ses réglages restent lisibles et
   * persistés en tant que clés non déclarées, et redeviennent des attributs le jour où le module
   * qui les déclare est là.
   */
  public figureNature(nature_id: string): Class_FigureNature {
    const existing = this._figure_natures[nature_id]
    if (existing) return existing
    const entry = representation_registry.get(nature_id)
    // Lu par indexation défensive : le champ `attributes` arrive avec le lot 1 de os#1418, et
    // ce fichier doit compiler quel que soit l'ordre des merges.
    const config = (entry as { attributes?: Type_FigureAttributesConfig } | undefined)?.attributes ?? {}
    const nature = new Class_FigureNature(nature_id, config)
    this._figure_natures[nature_id] = nature
    return nature
  }
  /** La nature de repli d'une figure ORPHELINE (fenêtre disparue) : déclare zéro attribut. */
  public static readonly UNKNOWN_FIGURE_NATURE_ID = 'unknown'
  /**
   * LA FIGURE d'une vignette, créée au premier besoin.
   *
   * Paresseuse des deux côtés, et c'est ce qui garde les fichiers propres : lire les réglages
   * d'une vignette crée une figure qui ne porte rien, donc qui ne s'écrit pas (`toJSON()` rend
   * `undefined`). Une fenêtre inconnue rend une figure ORPHELINE, sur une nature sans attributs,
   * plutôt que de lever : les appelants d'avant retournaient silencieusement sur un occupant
   * absent, et une figure vide se comporte exactement comme ce retour — on peut lui écrire sans
   * rien casser, elle n'est simplement rattachée à rien.
   *
   * os#1385 — LES DEUX ÉTAGES SE CROISENT ICI, et c'est voulu : la FENÊTRE est de l'hôte (une
   * seule grande zone à l'écran), la FIGURE est du DOCUMENT (elle s'écrit dans le fichier). Cette
   * méthode indexe donc les figures de `this` par un identifiant de fenêtre de `this._host`. Le
   * couplage ne change pas avec la montée : les fenêtres vivaient déjà dans la configuration du
   * principal, les figures aussi, et l'appelant reste `MainZoneTabs` avec la configuration du
   * document principal — pour qui hôte et document sont la même grande zone qu'hier.
   */
  public figureOf(occupant_id: string, pane_key: string): Class_Figure {
    const o = this._host._main_zone_occupants.find(x => x.id === occupant_id)
    const nature = this.figureNature(o?.representation ?? Class_MenuConfig.UNKNOWN_FIGURE_NATURE_ID)
    if (!o) return new Class_Figure(nature, pane_key)
    const by_key = this._figures[occupant_id] ?? (this._figures[occupant_id] = {})
    const existing = by_key[pane_key]
    if (existing && existing.nature === nature) return existing
    const fig = new Class_Figure(nature, pane_key)
    // os#1425 — CHANGER DE NATURE NE PERD PAS LES RÉGLAGES (arbitrage Julien, 18/09/2026).
    //
    // C'est le geste d'Excel : on change le type d'un graphique, la mise en forme reste. Elle le
    // peut parce que les natures parlent le même vocabulaire — ce sont les attributs des nœuds et
    // des flux (`name_label_font_size`, `value_label_unit_visible`, `shape_border_color`…), pas
    // des clés inventées par chacune. Une couronne réglée en Arial 12 sans unité le reste en
    // sunburst.
    //
    // Ce que la nouvelle nature ne déclare pas est GARDÉ sans être lu (la cascade ne rend que les
    // clés déclarées) : revenir à la nature d'avant retrouve ses réglages. Les STYLES SUIVIS, eux,
    // ne se transportent pas — un style appartient à une nature, celui d'une couronne n'existe pas
    // pour un sunburst ; la figure repart donc sur le style d'usine de sa nouvelle nature.
    if (existing) fig.loadOwn(existing.own)
    by_key[pane_key] = fig
    return fig
  }
  /** Un réglage de CETTE nature a-t-il un sens sur la figure voisine ? (cf. `isTransposableOption`) */
  public isTransposableFigureOption(nature_id: string, key: string): boolean {
    return this.figureNature(nature_id).isTransposable(key, isTransposableOption)
  }
  /**
   * os#1421 — UNE FIGURE PROMUE NE SE JETTE PAS AVEC SA VIGNETTE.
   *
   * Les trois ménages ci-dessous (fenêtre fermée, nature changée, vignette retirée) ont été écrits
   * quand une figure n'existait QUE pour sa vignette : la jeter avec elle était exact. Depuis
   * qu'un nœud peut en poser une, ce n'est plus vrai — la figure a un second référent, que cette
   * classe ne voit pas, et la jeter viderait le dessin d'un nœud parce qu'on a fermé une fenêtre.
   *
   * Règle unique, ici et nulle part ailleurs : on ne jette qu'une figure que le registre ne
   * connaît pas. Une figure promue reste indexée, et c'est `_pruneUnreferencedFigures` — appelé
   * par qui SAIT les placements — qui la solde quand elle n'a plus ni vignette ni hôte.
   */
  protected _isDroppableFigure(fig: Class_Figure): boolean { return fig.id === null }
  /** Les figures NON PROMUES d'une fenêtre s'en vont (fenêtre fermée, nature changée). */
  protected _dropFigures(occupant_id: string): void {
    const by_key = this._figures[occupant_id]
    if (!by_key) return
    Object.keys(by_key).forEach(k => { if (this._isDroppableFigure(by_key[k])) delete by_key[k] })
    if (Object.keys(by_key).length === 0) delete this._figures[occupant_id]
  }
  /** Les figures d'une fenêtre, débarrassées des vignettes NON PROMUES qui n'existent plus. */
  protected _pruneFigures(occupant_id: string, live_keys: string[]): void {
    const by_key = this._figures[occupant_id]
    if (!by_key) return
    Object.keys(by_key).forEach(k => {
      // La figure de la fenêtre à sujet diagramme ('') n'est jamais dans `keys` : elle ne
      // désigne pas un objet, elle EST la fenêtre.
      if (k === FIGURE_DIAGRAM_PANE_KEY || live_keys.includes(k)) return
      if (this._isDroppableFigure(by_key[k])) delete by_key[k]
    })
  }
  /** Les figures des fenêtres qui n'existent plus (toute voie de fermeture confondue). */
  protected _pruneOrphanFigures(): void {
    // os#1385 — les fenêtres VIVANTES sont celles de l'hôte, les figures élaguées celles de CE
    // document : pour le principal c'est exactement le ménage d'hier. Un document secondaire n'y
    // passe que par `mainZoneStateFromJSON`, que la persistance garde désormais par `is_main`.
    const live = new Set(this._host._main_zone_occupants.map(o => o.id))
    Object.keys(this._figures).forEach(id => { if (!live.has(id)) this._dropFigures(id) })
  }

  // --- os#1421 : le REGISTRE des figures du document et les PLACEMENTS -------------------------

  /**
   * L'IDENTIFIANT DE DOCUMENT de la figure d'une vignette — et, du même geste, sa PROMOTION.
   *
   * C'est le seul point d'entrée du registre, et c'est délibéré : on ne promeut pas « au cas où »,
   * on promeut parce que quelqu'un a besoin de NOMMER cette figure (la poser sur un nœud, demain
   * l'annoncer dans une info-bulle ou sur le canevas). Une figure qu'on se contente de regarder
   * n'entre jamais dans le registre, et le fichier ne porte donc que ce qui est cité.
   *
   * Idempotent : la même vignette rend toujours le même `f_N`.
   */
  public figureIdOf(occupant_id: string, pane_key: string): string {
    return this._promoteFigure(this.figureOf(occupant_id, pane_key))
  }
  /** Donne un nom libre à une figure qui n'en a pas, et l'indexe. Rend son nom. */
  protected _promoteFigure(fig: Class_Figure): string {
    if (fig.id !== null) {
      // Déjà nommée : on ré-indexe sans discuter. Une figure relue du fichier porte son id avant
      // que le registre ne la connaisse (`Class_Figure.fromJSON`), et sans cette ligne elle
      // resterait invisible de `figureById` — donc d'un placement qui la cite.
      this._figures_by_id[fig.id] = fig
      return fig.id
    }
    const id = this._nextFigureId()
    fig.id = id
    this._figures_by_id[id] = fig
    return id
  }
  /** Le prochain nom libre du registre (`f_N`), sans rien indexer. */
  protected _nextFigureId(): string {
    let id = ''
    do { this._figure_seq += 1; id = `f_${this._figure_seq}` } while (this._figures_by_id[id])
    return id
  }
  /**
   * os#1421 — UNE FIGURE DU DOCUMENT QUI N'EST LA VIGNETTE DE PERSONNE.
   *
   * `figureIdOf` promeut la figure d'une VIGNETTE : elle existe déjà, la grande zone la montre, on
   * lui donne un nom. Il faut aussi savoir en CRÉER une qui n'est montrée nulle part — c'est le cas
   * d'une migration, qui reprend un réglage posé sur un nœud d'un fichier d'avant et n'a aucune
   * fenêtre ouverte à quoi la rattacher.
   *
   * API GÉNÉRIQUE, et c'est délibéré : la nature arrive par son identifiant (`osp.repr.donut`…),
   * la surcharge propre par un sac. `Class_MenuConfig` vit dans OS et ne connaît aucune nature
   * d'OS+ ; c'est la couche qui les déclare qui sait laquelle choisir.
   *
   * La figure est promue d'emblée (`id` posé, indexée) et sa CLÉ de vignette vaut son identifiant
   * de document, comme pour une figure relue du registre (cf. `figuresFromJSON`) : elle n'est dans
   * `_figures` d'aucune fenêtre, donc `_pruneUnreferencedFigures` la soldera dès que plus aucun
   * placement ne la citera. Rend son identifiant.
   */
  public promoteStandaloneFigure(nature_id: string, own: Type_OptionBag): string {
    const id = this._nextFigureId()
    const fig = new Class_Figure(this.figureNature(nature_id), id)
    fig.id = id
    // `loadOwn` et non `assign` : une migration reprend TELLE QUELLE la valeur d'avant, sans
    // minimisation — ce que le fichier portait doit se retrouver dans le fichier d'après.
    fig.loadOwn(own)
    this._figures_by_id[id] = fig
    return id
  }
  /** La figure que porte cet identifiant de document, ou `undefined` (placement orphelin). */
  public figureById(figure_id: string): Class_Figure | undefined {
    return this._figures_by_id[figure_id]
  }

  /**
   * POSE la figure d'une vignette SUR UN NŒUD : « ce dessin est le dessin de ce nœud ».
   *
   * Un LIEN, pas une copie (cf. `Representations/Placement`) : le nœud n'apprend que le NOM de la
   * figure, et rerégler la vignette change ce qu'il montre. Rend l'identifiant posé, pour que
   * l'appelant sache quoi retirer.
   */
  public placeFigureOnNode(occupant_id: string, pane_key: string, node: Class_NodeElement): string {
    const figure_id = this.figureIdOf(occupant_id, pane_key)
    this.placeFigureIdOnNode(figure_id, node)
    return figure_id
  }
  /**
   * LE PLACEMENT SEUL : pose une figure DÉJÀ NOMMÉE sur un nœud, sans rien promouvoir.
   *
   * Séparé de `placeFigureOnNode` (qui n'est plus que « promouvoir la vignette, puis appeler
   * ceci ») pour l'appelant qui tient déjà un identifiant : une migration qui vient de créer une
   * figure hors vignette (`promoteStandaloneFigure`), demain un glisser-déposer d'une figure du
   * registre sur un autre nœud.
   *
   * `silent` — pour le CHARGEMENT : n'écrit ni pas d'annulation, ni redessin, ni notification de
   * la grande zone. Un geste de l'auteur doit être annulable et se voir tout de suite ; une
   * migration qui s'exécute au milieu d'une lecture de fichier, non — une pile d'annulation
   * pré-remplie ferait qu'un Ctrl+Z après ouverture défait un bout de migration, et le dessin
   * complet qui suit le chargement (ou le premier dessin tout court) rend le redessin par nœud
   * inutile.
   */
  public placeFigureIdOnNode(
    figure_id: string, node: Class_NodeElement, opts?: { silent?: boolean }
  ): void {
    // UN NŒUD NE PORTE QU'UNE FIGURE, et c'est ici qu'on le garantit. `withFigurePlacement` ne
    // déduplique que le COUPLE (figure, hôte) : poser B sur un nœud qui porte déjà A donnerait une
    // liste de deux, dont `nodePlacementFigureId` — qui prend la première — ne rendrait que A. La
    // figure qu'on vient de poser serait ignorée sans que rien ne le dise. On retire donc ce que
    // l'hôte 'node' portait avant d'y poser la nouvelle.
    const others = readFigurePlacements(node).filter(p => p.host !== 'node')
    this._writeNodePlacements(
      node,
      withFigurePlacement(others, { figure: figure_id, host: 'node', frame: 'bounds' }),
      opts?.silent === true
    )
    if (opts?.silent !== true) this._notifyMainZone()
  }
  /** RETIRE une figure d'un nœud. La figure n'est pas détruite : elle reste sa vignette. */
  public unplaceFigureFromNode(figure_id: string, node: Class_NodeElement): void {
    const before = readFigurePlacements(node)
    const next = withoutFigure(before, figure_id)
    // Rien posé : ne rien écrire du tout, plutôt qu'un undo vide et un redessin pour rien.
    if (next.length === before.length) return
    this._writeNodePlacements(node, next)
    this._notifyMainZone()
  }
  /** La figure POSÉE sur ce nœud, ou `null` (rien de posé, ou référent perdu). */
  public nodePlacedFigure(node: Class_NodeElement): Class_Figure | null {
    const id = nodePlacementFigureId(readFigurePlacements(node))
    return id === null ? null : (this._figures_by_id[id] ?? null)
  }
  /**
   * Écrit la liste des placements sur le nœud, undo compris.
   *
   * ÉCRITURE DIRECTE `attributes[clé] = valeur`, le patron de l'ancien onglet Analyse : le setter
   * dynamique de `Class_ProtoElement` redessinerait à chaque pas d'un geste groupé, et l'undo doit
   * pouvoir reposer l'ancienne valeur SANS relancer d'action. On redessine donc nous-mêmes, une
   * fois — et le NŒUD seulement : un placement ne change que ce qui est dessiné dans sa boîte.
   *
   * LISTE VIDE = ATTRIBUT EFFACÉ. `readFigurePlacements` rend `[]` dans les deux cas, et laisser
   * un tableau vide ferait écrire la clé dans le fichier pour ne rien dire.
   *
   * L'undo est OPTIONNEL parce que l'historique l'est : un nœud de test, ou un nœud d'une zone de
   * dessin détachée, n'a pas de `application_data.history`. On écrit alors sans pile d'annulation
   * plutôt que de lever.
   *
   * `silent` — l'écriture NUE : l'attribut, et rien d'autre. Réservée au chargement (cf.
   * `placeFigureIdOnNode`), où l'annulation n'a pas de sens et où le dessin n'a pas encore eu lieu.
   */
  protected _writeNodePlacements(
    node: Class_NodeElement, next: Type_FigurePlacement[], silent = false
  ): void {
    const host = node as unknown as {
      attributes: { [key: string]: unknown }
      draw?: () => void
      drawing_area?: {
        draw?: () => void
        application_data?: {
          history?: { saveUndo?: (f: () => void) => void, saveRedo?: (f: () => void) => void }
        }
      }
    }
    const attrs = host.attributes
    const before = attrs[FIGURE_PLACEMENTS_ATTR]
    const value = next.length > 0 ? next : undefined
    if (silent) { attrs[FIGURE_PLACEMENTS_ATTR] = value; return }
    const redraw = () => {
      if (host.draw) host.draw()
      else host.drawing_area?.draw?.()
    }
    const apply = () => { attrs[FIGURE_PLACEMENTS_ATTR] = value; redraw() }
    const undo = () => { attrs[FIGURE_PLACEMENTS_ATTR] = before; redraw() }
    const history = host.drawing_area?.application_data?.history
    history?.saveUndo?.(undo)
    history?.saveRedo?.(apply)
    apply()
  }

  /**
   * LES FIGURES POSÉES, d'après les nœuds qu'on lui donne.
   *
   * Prend la liste en PARAMÈTRE, et ce n'est pas une facilité : `Class_MenuConfig` ne connaît ni
   * la zone de dessin ni le diagramme (elle n'a aucune référence vers `application_data`), donc
   * elle ne peut pas aller chercher les nœuds elle-même. L'appelant qui les a — la persistance, un
   * ménage — les passe ; personne ne les a, personne ne balaie, et le registre garde tout. C'est
   * l'arbitrage assumé de ce lot : un registre qui grossit d'une figure oubliée est moins grave
   * qu'un placement qui perd son référent.
   */
  public placedFigureIds(nodes: Iterable<{ getElementProperty: (k: string) => unknown }>): Set<string> {
    const out = new Set<string>()
    for (const n of nodes) readFigurePlacements(n).forEach(p => out.add(p.figure))
    return out
  }
  /** Cette figure est-elle posée quelque part, parmi les nœuds donnés ? (cf. `placedFigureIds`) */
  public figureHasPlacement(
    figure_id: string, nodes: Iterable<{ getElementProperty: (k: string) => unknown }>
  ): boolean {
    return this.placedFigureIds(nodes).has(figure_id)
  }
  /**
   * SOLDE les figures du registre que plus rien ne cite : ni vignette VIVANTE, ni placement.
   *
   * N'est JAMAIS appelée d'office, et c'est le point délicat de ce lot. Les deux erreurs possibles
   * ne se valent pas : garder une figure que personne ne regarde coûte quelques octets dans le
   * fichier, tandis que jeter une figure encore posée vide le dessin d'un nœud sans rien dire.
   * Seul un appelant qui SAIT les placements (il a les nœuds) peut trancher — d'où le paramètre,
   * et d'où le fait que `_pruneOrphanFigures`, qui ne sait rien d'eux, ne l'appelle pas.
   *
   * Rend les identifiants soldés.
   */
  protected _pruneUnreferencedFigures(placed_ids: Set<string>): string[] {
    // Une vignette ne compte que si sa FENÊTRE existe encore : l'annuaire garde les figures
    // promues des fenêtres fermées (cf. `_dropFigures`), et les compter ici rendrait le ménage
    // inopérant — précisément sur les figures qu'il est censé solder.
    const live = new Set(this._host._main_zone_occupants.map(o => o.id))
    const shown = new Set<string>()
    Object.entries(this._figures).forEach(([occupant_id, by_key]) => {
      if (!live.has(occupant_id)) return
      Object.values(by_key).forEach(f => { if (f.id !== null) shown.add(f.id) })
    })
    const dropped: string[] = []
    Object.keys(this._figures_by_id).forEach(id => {
      if (shown.has(id) || placed_ids.has(id)) return
      const fig = this._figures_by_id[id]
      delete this._figures_by_id[id]
      // Dénommée : elle redevient une figure de vignette ordinaire, donc `_pruneOrphanFigures`
      // sait de nouveau la jeter de l'annuaire d'une fenêtre morte.
      fig.id = null
      dropped.push(id)
    })
    if (dropped.length > 0) this._pruneOrphanFigures()
    return dropped
  }
  /** `_pruneUnreferencedFigures` pour l'extérieur (cf. `placedFigureIds` pour les placements). */
  public pruneUnreferencedFigures(placed_ids: Set<string>): string[] {
    const dropped = this._pruneUnreferencedFigures(placed_ids)
    if (dropped.length > 0) this._notifyMainZone()
    return dropped
  }

  /**
   * os#1387 — Réglages d'UNE VIGNETTE d'une fenêtre. Sac COMPLET (cf. `Class_Figure.assign`) :
   * une clé absente est retirée, une valeur égale à ce que le style dit déjà n'est pas posée.
   *
   * os#1418 — N'ÉCRIT QUE CETTE FIGURE (arbitrage Julien du 16/09/2026). L'écriture immédiate du
   * défaut de nature (os#1394) est terminée : elle faisait qu'un réglage posé sur une étoile
   * devenait, sans que rien ne le dise, le réglage de toutes les étoiles à venir — et l'auteur ne
   * découvrait la propagation qu'en ouvrant la suivante. Régler toutes les figures d'une nature
   * se demande désormais, en portée « style » (`setRepresentationStyleOptions`).
   */
  public setMainZonePaneOptions(id: string, pane_key: string, options: Type_JSON): void {
    if (!this.isMainZoneOccupant(id)) return
    this.figureOf(id, pane_key).assign(options as Type_OptionBag)
    this._notifyMainZone()
  }
  /**
   * Réglages d'une fenêtre à sujet DIAGRAMME, qui n'a qu'une figure (clé `''`). Même contrat
   * que ci-dessus : sac complet, et rien d'autre que cette figure n'est touché.
   */
  public setMainZoneWindowOptions(id: string, options: Type_JSON): void {
    if (!this.isMainZoneOccupant(id)) return
    this.figureOf(id, FIGURE_DIAGRAM_PANE_KEY).assign(options as Type_OptionBag)
    this._notifyMainZone()
  }

  // --- os#1418 : le STYLE d'une nature de figure ----------------------------------------------

  /**
   * ÉCRIT LE STYLE `default` d'une nature — la portée « style », et la seule qui l'écrive.
   *
   * Sac COMPLET : une clé absente reprend sa valeur d'usine (c'est un style `default`, il est
   * pré-rempli). Rend les clés REFUSÉES, celles que la nature déclare d'une autre sorte que
   * 'style' — un axe de décomposition ou un flux de référence n'entre pas dans un style, quelle
   * que soit la surface qui le propose (garde-fou à l'écriture, os#1416). À l'appelant de les
   * poser sur la figure active, ou de les dire.
   *
   * Les figures qui n'ont rien surchargé suivent immédiatement, celles qui ont surchargé gardent
   * leur surcharge : c'est la cascade des éléments, et rien n'est recopié nulle part.
   */
  public setRepresentationStyleOptions(nature_id: string, options: Type_OptionBag): string[] {
    const nature = this.figureNature(nature_id)
    const refused = nature.assignStyle(nature.default_style, options)
    this._notifyMainZone()
    return refused
  }
  /** Ce que le style `default` de cette nature dit, clé par clé (ce que montre la portée « style »). */
  public representationStyleOptions(nature_id: string): Type_OptionBag {
    const nature = this.figureNature(nature_id)
    return nature.styleBag(nature.default_style)
  }
  /**
   * ALIAS HÉRITÉ de `representationStyleOptions` : « le défaut de la nature » et « son style
   * `default` » sont devenus le même objet. Conservé parce que plusieurs appelants (et les
   * tests) le nomment ainsi, et parce que le mot reste juste.
   */
  public representationDefaultOptions(nature_id: string): Type_OptionBag {
    return this.representationStyleOptions(nature_id)
  }
  /**
   * Les réglages EFFECTIFS d'une vignette : LA CASCADE de la figure (surcharge propre, styles
   * suivis, usine), et plus une résolution maison à trois sources.
   *
   * Ce qui change par rapport à os#1394, clé par clé et non plus en bloc : une vignette qui
   * surchargeait le mode de valeur n'effaçait plus, pour elle, tout le reste du défaut de sa
   * nature — elle prenait son propre sac ENTIER, défaut compris ou non. La cascade répond
   * attribut par attribut, comme pour un nœud.
   */
  public mainZonePaneOptionsOf(id: string, pane_key: string): Type_JSON {
    if (!this.isMainZoneOccupant(id)) return {}
    return this.figureOf(id, pane_key).attributes as Type_JSON
  }

  // --- os#1418 : persistance des styles de figure ---------------------------------------------

  /**
   * Sérialise les styles de figure (clé racine `figure_styles`). Dictionnaire indexé par
   * identifiant de nature — la forme que `Type_JSON` sait porter, et l'unicité de la nature y
   * devient structurelle. Clé ADDITIVE : rien à écrire tant que rien n'a été réglé.
   */
  public figureStylesToJSON(): Type_JSON | undefined {
    const out: Type_JSON = {}
    Object.entries(this._figure_natures).forEach(([id, nature]) => {
      const json = nature.toJSON()
      if (json) out[id] = json
    })
    return Object.keys(out).length > 0 ? out : undefined
  }
  /**
   * os#1421 — SÉRIALISE LE REGISTRE DES FIGURES (clé racine `figures`).
   *
   * Dictionnaire `f_N → { id, nature, attributes?, styles? }`. Clé ADDITIVE : tant que personne n'a
   * posé de figure nulle part, rien n'est promu, et le fichier est identique à ce qu'il était.
   *
   * Pourquoi une clé RACINE et non les fenêtres : une figure promue survit à sa fenêtre — c'est
   * tout l'intérêt — donc l'écrire dans `main_zone.occupants[…]` la perdrait exactement dans le cas
   * où elle compte. La vignette, elle, n'écrit plus qu'un renvoi (`{ ref: 'f_N' }`, cf.
   * `mainZoneStateToJSON`) : une seule copie des réglages, à un seul endroit.
   */
  public figuresToJSON(): Type_JSON | undefined {
    const out: Type_JSON = {}
    Object.entries(this._figures_by_id).forEach(([id, fig]) => {
      const json = fig.toJSON()
      // Une figure promue écrit toujours au moins `id` et `nature` : ce `if` n'est là que pour le
      // type, et une entrée vide ne partirait de toute façon pas dans le fichier.
      if (json) out[id] = json
    })
    return Object.keys(out).length > 0 ? out : undefined
  }
  /**
   * Relit le registre. À lire AVANT `main_zone` : les vignettes citent le registre par `ref`, et
   * une vignette lue d'abord ne trouverait qu'un renvoi dans le vide.
   *
   * REMPLACE le registre de la session — le registre appartient au DOCUMENT, et deux documents ne
   * partagent pas leurs `f_N`. Un fichier qui ne porte PAS la clé ne remplace rien (même règle que
   * `figure_styles`) : un basculement de vue ne porte pas les métadonnées du document.
   */
  public figuresFromJSON(json: unknown): void {
    if (!json || typeof json !== 'object' || Array.isArray(json)) return
    // Les figures de la session PERDENT LEUR NOM avec l'ancien registre. Sans cela, une vignette
    // restée en place (lecture partielle qui ne referait pas la grande zone) écrirait `{ ref }`
    // vers un identifiant que le nouveau registre ne porte plus : un renvoi dans le vide, alors
    // qu'une figure dénommée réécrit simplement ses réglages en clair.
    Object.values(this._figures).forEach(by_key => Object.values(by_key).forEach(f => { f.id = null }))
    this._figures_by_id = {}
    this._figure_seq = 0
    Object.entries(json as Type_JSON).forEach(([id, v]) => {
      if (!v || typeof v !== 'object' || Array.isArray(v)) return
      const entry = v as Type_JSON
      const raw_nature = entry['nature']
      const nature_id = (typeof raw_nature === 'string' && raw_nature !== '')
        ? raw_nature : Class_MenuConfig.UNKNOWN_FIGURE_NATURE_ID
      // La CLÉ DE VIGNETTE d'une figure du registre n'est pas dans le fichier, et ne peut pas y
      // être : la même figure peut être posée sur un nœud et n'être montrée dans AUCUNE fenêtre.
      // On lui donne son identifiant de document comme clé — `Class_Figure.key` n'est lue nulle
      // part ailleurs que dans ses tests, et l'annuaire (`_figures`) reste seul à dire où elle se
      // montre. C'est la vignette qui rejoint la figure (`ref`), pas l'inverse.
      const fig = new Class_Figure(this.figureNature(nature_id), id)
      fig.fromJSON(entry, this._figure_report, `figures[${id}]`)
      fig.id = id
      this._figures_by_id[id] = fig
      const m = /^f_(\d+)$/.exec(id)
      if (m) this._figure_seq = Math.max(this._figure_seq, Number(m[1]))
    })
  }
  /** Relit les styles de figure. Entrée malformée ignorée (fichier fabriqué à la main). */
  public figureStylesFromJSON(json: unknown): void {
    if (!json || typeof json !== 'object' || Array.isArray(json)) return
    Object.entries(json as Type_JSON).forEach(([id, v]) => {
      this.figureNature(id).fromJSON(v, this._figure_report, 'figure_styles')
    })
  }
  /**
   * LECTEUR HÉRITÉ des défauts par nature de os#1394 (clé racine `representation_defaults`).
   *
   * Un défaut d'alors est exactement ce qu'est aujourd'hui le style `default` : on le lui donne
   * à lire sous cette forme, et c'est `Class_FigureNature.fromJSON` qui FILTRE — seules les clés
   * de sorte 'style' entrent dans le style, les autres sont ÉCARTÉES et rapportées
   * ('not_transposable'). Ce filtre remplace le nettoyage à la lecture de os#1394 : les
   * documents écrits entre la livraison du défaut par nature et son correctif portent des flux
   * de référence étrangers, et les relire referait la figure fausse à chaque ouverture.
   */
  public representationDefaultsFromJSON(json: unknown): void {
    if (!json || typeof json !== 'object' || Array.isArray(json)) return
    Object.entries(json as Type_JSON).forEach(([id, v]) => {
      if (!v || typeof v !== 'object' || Array.isArray(v)) return
      this.figureNature(id).fromJSON(
        { default: { attributes: v } }, this._figure_report, 'representation_defaults'
      )
    })
  }
  /**
   * os#1419 — CE QUE LA MIGRATION N'A PAS PORTÉ, dit une fois pour tout le chargement.
   *
   * Vidé ICI et non à la fin de chaque lecteur, et c'est un choix : styles, défauts hérités et
   * grande zone se lisent à la suite, et trois `console.warn` successifs raconteraient trois
   * fois un tiers de l'histoire — le lecteur ne saurait pas si la clé qu'on lui signale a été
   * reprise par la passe suivante. La persistance appelle donc cette méthode une fois les trois
   * faites ; les tests, eux, lisent `figure_migration_report` avant.
   *
   * Rend le résumé (et l'écrit en console), ou `null` s'il n'y a rien à dire.
   */
  public flushFigureMigrationReport(): string | null {
    const summary = this._figure_report.summary()
    if (summary) console.warn(summary)
    this._figure_report.reset()
    return summary
  }
  /** Le rapport de migration EN COURS, avant qu'il ne soit vidé (tests, diagnostic). */
  public get figure_migration_report(): Class_FigureMigrationReport { return this._figure_report }
  public mainZoneOccupantById(id: string): Type_MainZoneOccupant | undefined {
    const o = this._host._main_zone_occupants.find(x => x.id === id)
    return o ? { ...o, subject: { ...o.subject } } : undefined
  }
  public get main_zone_active_id(): string | null {
    return this._host._main_zone_active_id ?? this.main_zone_main_id
  }
  public set main_zone_active_id(id: string | null) {
    if (this._host._main_zone_active_id === id) return
    this._host._main_zone_active_id = id
    // os#1394 — changer de fenêtre PÉRIME la vignette active : sa clé n'a de sens que dans la
    // fenêtre qui la porte, et deux fenêtres peuvent nommer la même. À id inchangé, en
    // revanche, on ne touche à rien : un clic sur une vignette active d'abord celle-ci, puis
    // remonte jusqu'à la fenêtre — l'effacer ici défairait le geste qu'on vient de faire.
    this._host._main_zone_active_pane_key = null
    // os#1423 — et la SÉLECTION part avec elle, exactement pour la même raison : ses clés ne
    // nomment rien dans la fenêtre qui devient active, et deux fenêtres peuvent nommer la même.
    this._host._main_zone_selected_pane_keys = []
    this._notifyMainZone()
  }
  /** os#1394 — La vignette active de la fenêtre active ; `null` = la première de la fenêtre. */
  public get main_zone_active_pane_key(): string | null {
    return this._host._main_zone_active_pane_key
  }
  /**
   * os#1423 — LES VIGNETTES SÉLECTIONNÉES de la fenêtre active, la vignette active comprise.
   *
   * Rend TOUJOURS ce sur quoi un réglage de portée 'selection' doit tomber, et jamais une liste
   * qu'il faudrait interpréter : sélection explicite si elle existe, sinon la seule vignette
   * active, sinon rien (aucune vignette touchée — la fenêtre n'en porte peut-être qu'une, dont
   * la clé est `null` par convention historique, et l'appelant retombe alors sur la première).
   *
   * C'est ici que l'invariant « l'active fait partie de la sélection » se paie une fois pour
   * toutes : personne d'autre n'a à se demander si une sélection vide veut dire « rien » ou
   * « celle-là ».
   */
  public get main_zone_selected_pane_keys(): string[] {
    const selected = this._host._main_zone_selected_pane_keys
    if (selected.length > 0) return [...selected]
    const active = this._host._main_zone_active_pane_key
    return active !== null ? [active] : []
  }
  /**
   * os#1423 — Cette vignette est-elle sélectionnée ? Faux dès que `id` n'est PAS la fenêtre
   * active : la sélection n'existe que là, et un liséré posé sur la vignette d'une fenêtre
   * voisine mentirait sur ce que le prochain réglage touchera.
   */
  public isMainZonePaneSelected(id: string, pane_key: string): boolean {
    if (this.main_zone_active_id !== id) return false
    return this.main_zone_selected_pane_keys.includes(pane_key)
  }
  /**
   * os#1397 - LE CANEVAS DEVIENT LA FENÊTRE ACTIVE, comme n'importe quelle autre.
   *
   * Il ne pouvait pas, et c'est une asymétrie qui se voyait à l'usage : les fenêtres hébergées
   * portent un `onMouseDown` qui les désigne, mais le canevas principal est dessiné HORS de
   * l'arbre React, en coordonnées d'écran, et se trouve écarté du composant qui porte ce geste.
   * Une fois une étoile touchée, elle restait donc active jusqu'à sa fermeture : le liséré ne
   * revenait pas, et le menu de configuration continuait de montrer ses réglages au lieu de ceux
   * de la vue. Il n'y avait aucun moyen de désélectionner, seulement des contournements.
   *
   * Sans effet quand le canevas n'est pas dans la grande zone (masqué, ou remplacé par une autre
   * fenêtre principale) : on n'active pas ce qui ne s'affiche pas.
   */
  public activateMainZoneCanvas(): void {
    if (this.mainZonePlaceOf(MAIN_ZONE_CANVAS_ID) === null) return
    this.main_zone_active_id = MAIN_ZONE_CANVAS_ID
  }
  /**
   * Active une fenêtre ET la vignette qu'on y a touchée (clic sur une vignette).
   *
   * os#1423 — `extend` est le Ctrl/Cmd+clic, et il ne fait qu'une chose : BASCULER la vignette
   * dans la sélection de la fenêtre active. Le clic simple, lui, REFAIT la sélection autour de
   * ce qu'on vient de toucher — c'est le geste de toutes les listes, et c'est ce qui garantit
   * qu'un clic ordinaire ne traîne jamais une sélection oubliée jusqu'au prochain réglage.
   *
   * Deux garde-fous, et ce sont les seuls :
   *  - étendre dans une AUTRE fenêtre que l'active n'étend rien : on ne sélectionne pas à cheval
   *    sur deux fenêtres (la sélection vit dans l'active), donc le Ctrl+clic y vaut clic simple ;
   *  - retirer la DERNIÈRE vignette sélectionnée ne fait rien. Une sélection vide se lit
   *    « seulement l'active » (cf. `main_zone_selected_pane_keys`), donc tout désélectionner ne
   *    mènerait nulle part : le volet parlerait quand même de la dernière touchée, mais sans
   *    liséré pour le dire.
   */
  public setMainZoneActivePane(id: string, pane_key: string | null, extend: boolean = false): void {
    // Toucher une figure est une demande de parler d'ELLE, même quand un nœud reste sélectionné
    // dans le diagramme : c'est le dernier geste qui dit de quoi l'inspecteur parle. Vrai du
    // Ctrl+clic comme du clic simple, et même quand rien d'autre ne bouge — c'est la RÉCENCE du
    // geste qu'il note, pas son effet.
    this._host._inspector_focus = 'representation'
    // Fenêtre active lue par l'ACCESSEUR : une fenêtre principale que personne n'a encore
    // désignée est déjà l'active pour tout le reste de l'interface (le liséré, les raccourcis),
    // et un Ctrl+clic dedans doit donc étendre, pas repartir de zéro.
    if (extend && this.main_zone_active_id === id && pane_key !== null) {
      this._host._main_zone_active_id = id
      const current = this._host._main_zone_selected_pane_keys.length > 0
        ? [...this._host._main_zone_selected_pane_keys]
        : (this._host._main_zone_active_pane_key !== null
          ? [this._host._main_zone_active_pane_key]
          : [])
      const at = current.indexOf(pane_key)
      if (at === -1) {
        current.push(pane_key)
        this._host._main_zone_selected_pane_keys = current
        this._host._main_zone_active_pane_key = pane_key
      } else {
        // Le seul sélectionné : on ne désélectionne pas tout (cf. en-tête).
        if (current.length === 1) return
        current.splice(at, 1)
        this._host._main_zone_selected_pane_keys = current
        // L'active s'en allait : la première restante prend sa place, l'invariant tient.
        if (this._host._main_zone_active_pane_key === pane_key) {
          this._host._main_zone_active_pane_key = current[0]
        }
      }
      this._notifyMainZone()
      return
    }
    // Clic simple, ou Ctrl+clic dans une fenêtre qui n'était pas active : la sélection REPART de
    // la vignette touchée. Écrit même quand la vignette active ne change pas — la fenêtre, elle,
    // vient peut-être de changer, et une sélection héritée n'y voudrait rien dire.
    const selection = pane_key !== null ? [pane_key] : []
    const unchanged = this._host._main_zone_active_id === id
      && this._host._main_zone_active_pane_key === pane_key
      && this._host._main_zone_selected_pane_keys.length === selection.length
      && this._host._main_zone_selected_pane_keys.every((k, i) => k === selection[i])
    if (unchanged) return
    this._host._main_zone_active_id = id
    this._host._main_zone_active_pane_key = pane_key
    this._host._main_zone_selected_pane_keys = selection
    this._notifyMainZone()
  }
  /**
   * os#1423 — SÉLECTIONNE LES VIGNETTES DONNÉES d'une fenêtre, qui devient active (« tout
   * sélectionner » de la fenêtre, Ctrl+A, glissé de cadre).
   *
   * Dédoublonne en gardant l'ORDRE donné : c'est celui des vignettes à l'écran, et un réglage de
   * portée 'selection' les parcourt dans cet ordre. La vignette active est CONSERVÉE si elle est
   * dans le lot — sélectionner tout ne doit pas déplacer ce dont le volet parle — et devient la
   * première sinon. Liste vide : sélection vide et plus de vignette active, la fenêtre redevient
   * ce qu'elle est à son ouverture.
   */
  public selectAllMainZonePanes(id: string, pane_keys: string[]): void {
    this._host._inspector_focus = 'representation'
    const unique = pane_keys.filter((k, i) => pane_keys.indexOf(k) === i)
    this._host._main_zone_active_id = id
    this._host._main_zone_selected_pane_keys = unique
    if (unique.length === 0) this._host._main_zone_active_pane_key = null
    else if (this._host._main_zone_active_pane_key === null
      || !unique.includes(this._host._main_zone_active_pane_key)) {
      this._host._main_zone_active_pane_key = unique[0]
    }
    this._notifyMainZone()
  }
  /**
   * os#1394 — De quoi le menu de configuration doit parler : de la figure qu'on vient de toucher,
   * ou de la sélection. `true` seulement si le dernier geste visait une représentation.
   *
   * Le résolveur d'inspecteur en fait ce qu'il veut : une fenêtre sans réglages ne prend pas
   * l'inspecteur pour autant (cf. InspectorResolver et activeRepresentation).
   */
  public get inspector_focus_is_representation(): boolean {
    return this._host._inspector_focus === 'representation'
  }
  /**
   * os#1431 — ET ON PEUT LE DIRE EXPLICITEMENT (retour de Julien, 19/09 : « j'ai réussi à aller sur
   * la figure et là je n'y arrive plus, je suis dans l'interface du diagramme »).
   *
   * Jusqu'ici le focus ne se posait que par RÉCENCE : toucher une vignette le mettait sur la
   * figure, sélectionner un nœud le rendait à la sélection. Deux gestes implicites, et aucun
   * chemin pour revenir à la figure sans re-cliquer dedans — or on clique dans le diagramme
   * précisément pour y choisir ce qu'on veut régler. Le fil d'Ariane de l'inspecteur s'en sert
   * pour offrir l'aller-retour, nommé.
   */
  public set inspector_focus_is_representation(v: boolean) {
    this._host._inspector_focus = v ? 'representation' : 'selection'
    this._ref_to_inspector_updater.current()
  }
  /**
   * Masque un occupant. Refuse (rend false) d'enlever le DERNIER : la grande zone vide n'a
   * rien pour se rallumer que le bouton qu'on vient de cliquer. Un occupant `main` qui part
   * cède la place au premier de la colonne droite (cf. normalisation).
   */
  public hideMainZoneOccupant(id: string): boolean {
    // sa#563 — LE REFUS NE PORTE QUE SUR LA GRILLE. Il existe parce qu'une grande zone vide n'a
    // rien pour se rallumer que le bouton qu'on vient de cliquer ; un volet FLOTTANT, lui, se
    // ferme toujours — il ne laisse aucune case vide derrière lui, et sa croix est le seul moyen
    // de s'en débarrasser. Le compte porte donc sur les occupants de la grille, et le volet
    // flottant qu'on ferme n'en fait pas partie.
    const grid = this._host._main_zone_occupants.filter(o => o.place !== 'floating')
    if (grid.length <= 1 && grid.some(o => o.id === id)) return false
    // sa#566 — un volet ENREGISTRÉ qu'on ferme laisse son dernier état à sa vue.
    this._snapshotSavedWindows([id])
    this._host._main_zone_occupants = this._host._main_zone_occupants.filter(o => o.id !== id)
    this._host._main_zone_detached.delete(id)
    this._normalizeMainZoneOccupants()
    this._notifyMainZone()
    return true
  }
  public toggleMainZoneOccupant(id: string): void {
    if (this.isMainZoneOccupant(id)) this.hideMainZoneOccupant(id)
    else this.showMainZoneOccupant(id)
  }

  /**
   * os#1433 (19/09/2026) — LA GRANDE ZONE REVIENT AU DIAGRAMME SEUL.
   *
   * Arbitrage de Julien : « quand on ouvre une feuille vierge, il n'y a plus qu'une seule
   * fenêtre, la zone de dessin. Pareil quand on fait Nouveau diagramme : ça doit supprimer les
   * fenêtres. »
   *
   * C'est la limite de la règle « la grille est de l'espace de travail », et elle est juste :
   * garder sa mise en page d'un onglet à l'autre est un service, la garder devant une page
   * BLANCHE n'en est pas un. Une feuille vierge n'a rien dont un tableur, une doc ou une
   * couronne puissent parler ; les fenêtres y regardent toutes le vide, et il faut les fermer
   * une par une avant de pouvoir travailler. Repartir du diagramme seul est le seul état qui ne
   * demande rien à personne.
   *
   * La différence avec `closeWindowsPinnedOnSheet` est celle des deux gestes : BASCULER vers une
   * feuille qui existe garde la grille (on retrouve sa mise en page, seuls les épinglages
   * partent), CRÉER une feuille ou un diagramme la remet à zéro. Le premier reprend un travail,
   * le second en commence un.
   *
   * On ne repose rien à la main : la liste vidée, `_normalizeMainZoneOccupants` y met le canevas
   * en principale — c'est son cas « aucune fenêtre », déjà écrit et déjà le défaut d'un document
   * neuf. Une règle, un seul endroit.
   */
  public resetMainZoneToCanvas(): void {
    const host = this._host
    this._snapshotSavedWindows(host._main_zone_occupants.map(o => o.id))
    host._main_zone_occupants = []
    host._main_zone_detached.clear()
    host._main_zone_maximized_id = null
    host._main_zone_active_id = null
    host._main_zone_active_pane_key = null
    host._main_zone_selected_pane_keys = []
    this._normalizeMainZoneOccupants()
    this._notifyMainZone()
  }

  /**
   * os#1433 (19/09/2026) — QUITTER UNE FEUILLE FERME LES FENÊTRES ÉPINGLÉES SUR SES ÉLÉMENTS.
   *
   * C'est la seconde moitié de « à qui appartient la disposition », l'autre étant la garde
   * d'écriture de `main_zone` (cf. `ApplicationData._toJSON`). La grille — les cases, leurs
   * tailles, les fenêtres à sujet DIAGRAMME — est de l'espace de travail : elle survit au
   * changement de feuille, et c'est un service (personne ne veut refaire sa mise en page à
   * chaque onglet). Ce qu'une fenêtre REGARDE, lui, peut être de la feuille.
   *
   * Un sujet épinglé (`node`, `link`, `elements`, `tag`) nomme des identifiants ou un critère
   * qui n'ont de sens que dans UN diagramme. Sans `sheet`, il désigne « la feuille courante » —
   * donc, après une bascule, des identifiants de la feuille d'arrivée, qui n'existent pas. La
   * fenêtre ne se trompait même pas bruyamment : elle s'ouvrait vide en continuant d'annoncer
   * le nœud d'avant. Constaté par Julien le 19/09 : « on ouvre une feuille avec le +, ça vient
   * avec les mêmes fenêtres — diagramme, doc et sunburst ».
   *
   * CE QUI SURVIT, ET POURQUOI :
   *  - `diagram`, y compris sur une AUTRE feuille : c'est le geste du lot 0, une fenêtre qui
   *    montre une feuille voisine, et il est délibéré ;
   *  - `selection` : elle ne nomme rien, elle suit ce qu'on touche et se repointe seule ;
   *  - un sujet épinglé qui NOMME une autre feuille que celle qu'on quitte : ses identifiants
   *    sont ailleurs et restent valides. Une fenêtre sur le nœud « Blé » de la feuille B garde
   *    son sens quand on passe de A à C — et quand on arrive SUR B, elle devient une fenêtre
   *    sur la feuille courante, ce qu'elle disait déjà.
   *
   * @param sheet_id la feuille qu'on QUITTE. Un sujet sans `sheet` la désigne implicitement.
   * @returns les identifiants des fenêtres fermées (pour les journaux et les tests).
   */
  public closeWindowsPinnedOnSheet(sheet_id: string): string[] {
    const pinned = new Set(['node', 'link', 'elements', 'tag'])
    const doomed = this._host._main_zone_occupants
      .filter(o => {
        if (!pinned.has(o.subject.kind)) return false
        const on = mainZoneSubjectSheet(o.subject)
        return on === '' || on === sheet_id
      })
      .map(o => o.id)
    if (doomed.length === 0) return []
    const condemned = new Set(doomed)
    this._snapshotSavedWindows(doomed)
    // Retrait en UN geste, et non `hideMainZoneOccupant` en boucle : celle-ci refuse de retirer
    // la dernière fenêtre, garde juste pour un geste de l'utilisateur (on ne vide pas la grande
    // zone d'un clic) et fausse ici — une feuille dont on ne garde aucune fenêtre doit pouvoir
    // n'en garder aucune, le canevas de la feuille d'arrivée prenant la place au rendu suivant.
    this._host._main_zone_occupants = this._host._main_zone_occupants.filter(o => !condemned.has(o.id))
    condemned.forEach(id => this._host._main_zone_detached.delete(id))
    // L'active a pu partir avec elles : `_normalizeMainZoneOccupants` la repose sur ce qui reste.
    this._normalizeMainZoneOccupants()
    this._notifyMainZone()
    return doomed
  }
  /**
   * sa#563 — LES DEUX DÉPLACEMENTS ENTRE LA GRILLE ET LA PLACE FLOTTANTE, et rien d'autre : le
   * volet garde son sujet, sa nature, ses figures et sa sélection — `setMainZoneOccupantPlace`
   * n'écrit QUE `place`. C'est la promesse du point 4 de la recette, et elle tient parce qu'il
   * n'y a rien à transporter : un occupant flottant et un occupant de la grille sont le même
   * objet à deux endroits.
   *
   * La GÉOMÉTRIE, elle, se garde des deux côtés : elle n'est reposée que si le volet n'en a
   * jamais eu, de sorte qu'un aller-retour repose le volet exactement là où il flottait.
   */
  public setMainZoneOccupantPlace(id: string, place: Type_MainZonePlace): void {
    const o = this._host._main_zone_occupants.find(x => x.id === id)
    if (!o || o.place === place) return
    o.place = place
    if (place === 'floating') this._ensureFloatingGeometry(id)
    this._normalizeMainZoneOccupants()
    this._notifyMainZone()
  }
  /** Donne au volet une géométrie s'il n'en a pas — la demandée, la sienne, ou celle par défaut. */
  protected _ensureFloatingGeometry(id: string, geometry?: Type_PopupGeometry): void {
    const o = this._host._main_zone_occupants.find(x => x.id === id)
    if (!o) return
    if (geometry === undefined && o.geometry !== undefined) return
    o.geometry = clampMainZoneFloatingGeometry(geometry ?? defaultMainZoneFloatingGeometry())
  }
  /**
   * sa#563 — FERME LE PLUS ANCIEN VOLET FLOTTANT tant que le plafond est dépassé.
   *
   * `incoming_id` est celui qu'on s'apprête à ouvrir : il ne compte pas dans les anciens, mais
   * il compte dans le total. L'ordre de la liste d'occupants est celui des ouvertures, donc le
   * premier trouvé est le plus ancien — même règle qu'`enforcePopupCap`, dont ce geste reprend
   * la place.
   */
  public enforceMainZoneFloatingCap(incoming_id: string): void {
    const opened = this._host._main_zone_occupants
      .filter(o => o.place === 'floating' && o.id !== incoming_id)
      .map(o => o.id)
    let excess = opened.length - (MAX_MAIN_ZONE_FLOATING - 1)
    for (let i = 0; i < opened.length && excess > 0; i++, excess--) this.hideMainZoneOccupant(opened[i])
  }
  /**
   * Remplace la liste des fenêtres à sujet DIAGRAMME SUR LA FEUILLE COURANTE (état d'URL) : les
   * places se calculent, l'ordre donné est conservé. Les fenêtres à identifiant propre ne sont
   * pas décrites par l'URL et sont CONSERVÉES telles quelles : une fenêtre à sujet élément
   * parce que l'objet qu'elle épingle n'a pas de sens dans une adresse, et — même raison — une
   * fenêtre canevas sur une AUTRE FEUILLE, dont l'identifiant `w_N` ne nomme aucune
   * représentation du registre (os#1385 lot 0). Les recréer depuis la liste d'identifiants les
   * transformerait en fenêtres diagramme vides sur une nature inconnue.
   *
   * os#1498 — UNE FENÊTRE DE NATURE `allow_many` EST DE CELLES-LÀ, et le prédicat d'OCCUPANT est
   * ce qui le dit : son sujet est un diagramme de la feuille courante, seul son `w_N` la trahit.
   * Symétriquement, un `w_N` qui figurerait dans la liste donnée est IGNORÉ — il ne nomme aucune
   * représentation, et le recréer fabriquerait une fenêtre fantôme sans rien à dessiner. Le cas
   * n'arrive que d'une adresse écrite par une version qui l'y mettait ; la fenêtre qu'il désigne,
   * si elle est encore là, est conservée plus bas avec les autres.
   */
  public setMainZoneOccupantIds(ids: string[]): void {
    const host = this._host
    const kept = new Map(host._main_zone_occupants.map(o => [o.id, o]))
    // sa#563 — LES VOLETS FLOTTANTS SONT CONSERVÉS EUX AUSSI, et pour la même raison que les
    // fenêtres à identifiant propre : l'URL décrit la GRILLE — ce qui partage l'écran —, pas ce
    // qui flotte au-dessus. Un volet flottant peut par ailleurs porter un sujet diagramme sur la
    // feuille courante (la vue d'un groupe d'étiquettes, dont l'identifiant EST sa nature) : sans
    // cette ligne, il tomberait dans la liste reconstruite et disparaîtrait sans un mot.
    // os#1498 — le juge des identifiants propres est celui de l'OCCUPANT (une nature `allow_many`
    // porte un `w_N` avec un sujet diagramme), et non le seul sujet.
    const conserved = host._main_zone_occupants.filter(
      o => mainZoneOccupantUsesOwnWindowId(o) || o.place === 'floating')
    host._main_zone_occupants = []
    ids.forEach(id => {
      if (isOwnMainZoneWindowId(id)) return
      const prev = kept.get(id)
      host._main_zone_occupants.push(prev
        ? { ...prev }
        : { id, subject: { kind: 'diagram' }, representation: id, place: 'right', size: 1 })
    })
    // Un identifiant CITÉ PAR L'URL qui désigne aussi un volet conservé est déjà dans la liste :
    // la déduplication de la normalisation garde le premier, c'est-à-dire celui qu'on vient de
    // reprendre tel quel — donc sa place, flottante le cas échéant.
    host._main_zone_occupants.push(...conserved)
    this._normalizeMainZoneOccupants()
    this._notifyMainZone()
  }
  /** Poids des occupants d'une pile, écrits par ses poignées de redimensionnement. */
  public setMainZoneStackSizes(sizes: { [id: string]: number }): void {
    this._host._main_zone_occupants.forEach(o => {
      const s = sizes[o.id]
      if (typeof s === 'number' && Number.isFinite(s) && s > 0) o.size = s
    })
    this._notifyMainZone()
  }
  public isMainZoneDetached(id: string): boolean { return this._host._main_zone_detached.has(id) }
  public setMainZoneDetached(id: string, detached: boolean): void {
    if (detached === this._host._main_zone_detached.has(id)) return
    if (detached) this._host._main_zone_detached.add(id)
    else this._host._main_zone_detached.delete(id)
    this._notifyMainZone()
  }
  /**
   * L'invariant de la grande zone, rétabli après chaque mutation : au moins un occupant ;
   * exactement un `main` ; le canevas, s'il est là, EST ce `main` (contrainte du SVG, cf. en-
   * tête) ; pas de doublon ; des poids finis et positifs.
   */
  protected _normalizeMainZoneOccupants(): void {
    const host = this._host
    const seen = new Set<string>()
    let list = host._main_zone_occupants.filter(o => {
      if (seen.has(o.id) || !MAIN_ZONE_PLACES.includes(o.place)) return false
      seen.add(o.id)
      return true
    })
    // Sujet et représentation absents (liste construite par un ancien appelant) : fenêtre
    // diagramme dont l'id est la représentation, l'invariant de compatibilité.
    //
    // La ré-affirmation `representation = id` ne vaut QUE pour les fenêtres nommées par leur
    // représentation. Une fenêtre canevas sur une autre feuille porte un `w_N` : lui appliquer
    // la règle lui donnerait `w_N` comme nature, que le registre ne connaît pas — la fenêtre
    // n'aurait plus rien à dessiner, et le fichier la rouvrirait vide (os#1385 lot 0).
    //
    // os#1498 — et pas davantage à une fenêtre de nature `allow_many` (la vue par groupe), dont
    // le sujet EST un diagramme de la feuille courante : seul son identifiant `w_N` dit qu'elle a
    // un id propre, d'où le prédicat d'OCCUPANT. Sans lui, la première normalisation venue —
    // c'est-à-dire l'ouverture elle-même — lui donnerait sa clé de session pour nature, et la
    // fenêtre s'ouvrirait vide.
    list.forEach(o => {
      if (!o.subject || !MAIN_ZONE_SUBJECT_KINDS.includes(o.subject.kind)) o.subject = { kind: 'diagram' }
      if (!o.representation) o.representation = o.id
      if (!mainZoneOccupantUsesOwnWindowId(o)) o.representation = o.id
    })
    // sa#563 — IL FAUT TOUJOURS UN OCCUPANT DE LA GRILLE, et pas seulement un occupant.
    //
    // La liste vide rallumait le canevas ; une liste qui ne contient QUE des volets flottants
    // pose exactement le même problème sous un autre visage — la grille n'a plus de `main`, donc
    // la promotion ci-dessous happerait un volet flottant pour lui donner toute la page. Un volet
    // qu'on vient d'ouvrir au-dessus du diagramme ne doit pas devenir le diagramme.
    if (list.filter(o => o.place !== 'floating').length === 0) {
      // Le canevas peut DÉJÀ être là, flottant : on le fait redescendre dans la grille plutôt que
      // d'en poser un second, qui porterait le même identifiant.
      const canvas = list.find(o => o.id === MAIN_ZONE_CANVAS_ID)
      if (canvas) canvas.place = 'main'
      else {
        list = [
          { id: MAIN_ZONE_CANVAS_ID, subject: { kind: 'diagram' }, representation: MAIN_ZONE_CANVAS_ID, place: 'main', size: 1 },
          ...list
        ]
      }
    }
    if (host._main_zone_active_id !== null && !list.some(o => o.id === host._main_zone_active_id)) {
      host._main_zone_active_id = null
      // os#1394 — la vignette active appartenait à cette fenêtre : elle part avec elle.
      host._main_zone_active_pane_key = null
      // os#1423 — la sélection aussi : elle ne vit que dans la fenêtre active, qui n'est plus là.
      host._main_zone_selected_pane_keys = []
    }
    const mains = list.filter(o => o.place === 'main')
    if (mains.length === 0) {
      // Personne en principale : le diagramme s'il est là, sinon le premier de la colonne
      // droite, sinon le premier venu DE LA GRILLE. sa#563 — jamais un flottant : la garde
      // ci-dessus a assuré qu'il en reste au moins un, et happer un volet flottant pour lui
      // donner toute la page défierait le geste qui vient de le faire flotter.
      const grid = list.filter(o => o.place !== 'floating')
      const promoted = grid.find(o => o.id === MAIN_ZONE_CANVAS_ID)
        ?? grid.find(o => o.place === 'right') ?? grid[0]
      promoted.place = 'main'
    } else mains.slice(1).forEach(o => { o.place = 'right' })
    list.forEach(o => { if (!Number.isFinite(o.size) || o.size <= 0) o.size = 1 })
    // sa#563 — un volet flottant a TOUJOURS une géométrie : l'hôte n'a alors aucun cas de
    // « cadre manquant » à traiter, et un fichier qui l'aurait perdue se rouvre au centre plutôt
    // qu'invisible. Bornée, pour la même raison qu'à l'écriture (cf. `setMainZoneOccupantGeometry`).
    list.forEach(o => {
      if (o.place !== 'floating') return
      o.geometry = clampMainZoneFloatingGeometry(o.geometry ?? defaultMainZoneFloatingGeometry())
    })
    host._main_zone_occupants = list
    // sa#566 — le plein écran part avec son volet.
    if (host._main_zone_maximized_id !== null && !list.some(o => o.id === host._main_zone_maximized_id)) {
      host._main_zone_maximized_id = null
    }
    // os#1418 — les figures des fenêtres qui viennent de disparaître s'en vont avec elles. Ici
    // et non dans chaque voie de fermeture : `hideMainZoneOccupant`, `setMainZoneOccupantIds`,
    // le changement de nature en place et la déduplication mènent tous ici, et un seul ménage
    // vaut mieux que quatre qu'il faudrait penser à ajouter au cinquième appelant.
    this._pruneOrphanFigures()
  }

  /**
   * Fait d'une fenêtre LA principale : elle échange sa place (et son poids) avec l'occupant
   * `main` du moment, qui prend la sienne — la grande zone garde exactement une principale
   * sans qu'aucune fenêtre ne disparaisse. Une fenêtre détachée se ré-attache pour cela.
   */
  public makeMainZoneOccupantMain(id: string): void {
    const o = this._host._main_zone_occupants.find(x => x.id === id)
    if (!o || o.place === 'main') return
    const main = this._host._main_zone_occupants.find(x => x.place === 'main')
    // sa#563 — L'ÉCHANGE NE REND PAS LE DIAGRAMME FLOTTANT. Promouvoir un volet flottant en
    // fenêtre principale est un geste sur LUI ; renvoyer l'ancienne principale flotter à sa
    // place ferait décoller le diagramme d'un clic qui ne parlait pas de lui. Elle prend la
    // colonne droite, comme elle le ferait pour n'importe quelle autre promotion.
    if (main) { main.place = o.place === 'floating' ? 'right' : o.place; main.size = o.size }
    o.place = 'main'
    o.size = 1
    this._host._main_zone_detached.delete(id)
    this._normalizeMainZoneOccupants()
    this._notifyMainZone()
  }

  // --- Compatibilité : les quatre occupants historiques par leur ancien nom -----------------
  // Conservés parce que dix appelants (OS+, éditeur, état d'URL) les écrivent encore, et que
  // le geste qu'ils expriment — « montre le tableur » — est exactement `showMainZoneOccupant`.
  //
  // os#1404 — LES TROIS PREMIERS DÉSIGNENT LEUR FENÊTRE PAR SON IDENTIFIANT, ET C'EST POUR ÇA
  // QU'ILS N'ONT PAS L'ASYMÉTRIE DE L'UNITAIRE. Diagramme, tableur et documentation sont des
  // natures d'échelle DIAGRAMME (cf. registerBaseRepresentations) : leur sujet est le document
  // entier, il n'y a rien à y épingler, et l'invariant `id === representation` fait que getter
  // et setter parlent de la même et unique fenêtre. Une fenêtre de ces natures DÉPAYSÉE sur une
  // autre feuille porte un id propre `w_N` : le getter l'ignore et le setter en ouvre une pour
  // la feuille courante — ce qui est exactement ce qu'on veut, la fenêtre de la feuille B n'étant
  // pas celle qu'on demande. Vérifié, rien à corriger : l'asymétrie était propre à l'unitaire,
  // seul accesseur à chercher par NATURE au travers de fenêtres qui peuvent avoir des sujets
  // différents.
  public get main_zone_show_diagram() { return this.isMainZoneOccupant(MAIN_ZONE_CANVAS_ID) }
  public set main_zone_show_diagram(v: boolean) {
    if (v) this.showMainZoneOccupant(MAIN_ZONE_CANVAS_ID); else this.hideMainZoneOccupant(MAIN_ZONE_CANVAS_ID)
  }
  public get main_zone_show_spreadsheet() { return this.isMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID) }
  public set main_zone_show_spreadsheet(v: boolean) {
    if (v) this.showMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID); else this.hideMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID)
  }
  public get main_zone_show_doc() { return this.isMainZoneOccupant(MAIN_ZONE_DOC_ID) }
  public set main_zone_show_doc(v: boolean) {
    if (v) this.showMainZoneOccupant(MAIN_ZONE_DOC_ID); else this.hideMainZoneOccupant(MAIN_ZONE_DOC_ID)
  }
  // os#1387 — « montrer l'unitaire » ouvre une FENÊTRE D'ÉLÉMENT « Unit. » qui suit la sélection
  // (le panneau OS+ à hôte externe n'est plus offert). Les appelants OS+ (bouton, clic droit)
  // gardent leur geste.
  //
  // os#1404 — L'ACCESSEUR NE PARLE QUE DES FENÊTRES QUI SUIVENT, JAMAIS DES ÉPINGLÉES.
  //
  // Il regardait la seule NATURE de l'occupant, sans son sujet : une fenêtre Unit. épinglée sur
  // un nœud suffisait donc à le dire « montré », et le garde `if (!this.main_zone_show_unitary)`
  // rendait alors le bouton muet. Deux portes, et la première fermait la seconde : la fenêtre
  // épinglée ignorait la sélection — ce qui est son rôle — et le geste qui aurait ouvert une
  // fenêtre vivante était devenu inopérant précisément parce qu'elle existait.
  //
  // Une fenêtre épinglée et une fenêtre qui suit sont deux objets différents, et les avoir
  // toutes deux est un usage légitime (c'est ainsi qu'on compare). Le bouton ouvre donc TOUJOURS
  // une fenêtre qui suit, quel que soit le nombre d'épinglées ; et la fermeture ne touche que
  // celles qui suivent — refermer une fenêtre que l'auteur a composée et épinglée serait pire
  // que le défaut qu'on corrige.
  public get main_zone_show_unitary() {
    return this._host._main_zone_occupants
      .some(o => o.representation === MAIN_ZONE_UNIT_WINDOW_ID && o.subject.kind === 'selection')
  }
  public set main_zone_show_unitary(v: boolean) {
    if (v) {
      if (!this.main_zone_show_unitary) this.openMainZoneWindow({ kind: 'selection' }, MAIN_ZONE_UNIT_WINDOW_ID)
    } else {
      this._host._main_zone_occupants
        .filter(o => o.representation === MAIN_ZONE_UNIT_WINDOW_ID && o.subject.kind === 'selection')
        .forEach(o => this.hideMainZoneOccupant(o.id))
    }
  }
  public get main_zone_doc_detached() { return this.isMainZoneDetached(MAIN_ZONE_DOC_ID) }
  public set main_zone_doc_detached(v: boolean) { this.setMainZoneDetached(MAIN_ZONE_DOC_ID, v) }
  public get main_zone_unitary_detached() { return this.isMainZoneDetached(MAIN_ZONE_UNITARY_ID) }
  public set main_zone_unitary_detached(v: boolean) { this.setMainZoneDetached(MAIN_ZONE_UNITARY_ID, v) }

  public get doc_external() { return this._host._doc_external }
  public set doc_external(v: { title: string, markdown: string } | null) {
    this._host._doc_external = v
    this._notifyMainZone()
  }
  public get main_zone_split_ratio() { return this._host._main_zone_split_ratio }
  public set main_zone_split_ratio(v: number) {
    this._host._main_zone_split_ratio = v
    this._notifyMainZone()
  }
  public get main_zone_bottom_px() { return this._host._main_zone_bottom_px }
  public set main_zone_bottom_px(v: number) {
    this._host._main_zone_bottom_px = v
    this._notifyMainZone()
  }
  public addMainZoneListener(l: () => void): () => void {
    return this._host._event_bus.subscribe(MAIN_ZONE_TOPIC, l)
  }
  /** Notifie les abonnés de la grande zone (barre du haut + MainZoneTabs). Exposé pour
   *  que des features injectées (ex. l'onglet « Unit. » OS+) puissent re-rendre le bouton. */
  public notifyMainZone() { this._notifyMainZone() }

  // #248 — API pub/sub générique par topic. Toute nouvelle feature s'abonne à son topic via
  // `subscribe(topic, listener)` (désabonnement au démontage, cf. useModelBinding) et notifie via
  // `notify(topic)`, plutôt qu'une ref nue ou la liste globale de la grande zone.
  //
  // os#1385 — ROUTÉ PAR TOPIC (cf. `_busFor`) : un signal d'espace de travail part sur le bus
  // de l'hôte, un signal de contenu sur celui de ce document. Le `PanelManager` de l'hôte
  // notifie donc le même bus que celui où les composants s'abonnent par la configuration du
  // document principal — c'est exactement le comportement d'aujourd'hui.
  public subscribe(topic: string, l: () => void): () => void {
    return this._busFor(topic).subscribe(topic, l)
  }
  public notify(topic: string): void {
    this._busFor(topic).notify(topic)
  }

  // Panneau « Unit. » (sankey unitaire, feature OS+) affiché à côté de Diagramme/Tableur/Doc.
  // `unitary_tab_available` est renseigné par OS+ (ModalUnitarySankeyOSP) ; reste neutre en OS pur.
  // Le bouton de la topbar n'apparaît que si disponible et son état ouvert/surligné suit désormais
  // `main_zone_show_unitary` (le panneau est un membre de la grande zone, persisté). `toggleUnitaryTab`
  // reste exposé pour les points d'entrée OS+ (clic droit / onglet tooltip de nœud).
  protected _unitary_tab_available: boolean = false
  public get unitary_tab_available(): boolean { return this._host._unitary_tab_available }
  public set unitary_tab_available(v: boolean) { this._host._unitary_tab_available = v }

  // sa#508 — dernier import réussi (format d'entrée du dialogue de persistance :
  // 'excel', 'json'…), posé juste avant la notification IMPORT_TOPIC. Lu par
  // les abonnés du topic ; jamais persisté.
  protected _last_import: { format: string } | null = null
  public get last_import(): { format: string } | null { return this._host._last_import }
  public set last_import(v: { format: string } | null) { this._host._last_import = v }

  // sa#531 — dernier export d'image ('png', 'svg', 'pdf'), posé juste avant la
  // notification EXPORT_TOPIC. Même contrat que `last_import` : lu par les
  // abonnés du topic, jamais persisté.
  protected _last_export: { format: string } | null = null
  public get last_export(): { format: string } | null { return this._host._last_export }
  public set last_export(v: { format: string } | null) { this._host._last_export = v }

  // sa#531 — FICHIER DU TUTORIEL OUVERT, posé au chargement depuis le menu Aide
  // et remis à null dès qu'un autre document est chargé. C'est ce qui permet de
  // dire qu'un changement de vue est un passage d'ÉTAPE : sans lui, les deux
  // gestes sont le même clic. Jamais persisté — rouvrir son propre diagramme ne
  // recommence pas une leçon.
  protected _current_tutorial: string | null = null
  public get current_tutorial(): string | null { return this._host._current_tutorial }
  public set current_tutorial(v: string | null) { this._host._current_tutorial = v }

  // sa#531 — dernière étape franchie, posée juste avant TUTORIAL_TOPIC : le
  // fichier, le rang de la vue dans l'ordre du document, et si c'est la
  // dernière. Lu par les abonnés du topic.
  protected _last_tutorial_step: { file: string, rank: number, last: boolean } | null = null
  public get last_tutorial_step(): { file: string, rank: number, last: boolean } | null {
    return this._host._last_tutorial_step
  }

  public set last_tutorial_step(v: { file: string, rank: number, last: boolean } | null) {
    this._host._last_tutorial_step = v
  }

  // sa#1354 — Applicateur de NIVEAU, injecté par la couche éditeur.
  //
  // Les autres axes du contrôleur se restaurent par un simple setter ; le niveau
  // d'agrégation, lui, emporte l'agrégation/désagrégation effective des nœuds
  // (préférences par nœud, expansions, cadres englobants), et cette logique vit
  // dans `Toolbar.handleTagSelection` — donc au-dessus d'OpenSankey, qui ne peut
  // pas l'appeler. D'où ce créneau, sur le même patron que
  // `unitary_tab_available` : la couche qui sait faire s'y déclare.
  //
  // Absent (viewer OS pur, tests), `applyUrlStateParams` ignore le niveau sans
  // erreur : l'URL reste lisible, elle restaure simplement un axe de moins.
  protected _level_selection_applier: ((tagg_id: string, tag_id: string) => void) | null = null
  public get level_selection_applier(): ((tagg_id: string, tag_id: string) => void) | null {
    return this._host._level_selection_applier
  }
  public set level_selection_applier(v: ((tagg_id: string, tag_id: string) => void) | null) {
    this._host._level_selection_applier = v
  }
  protected _toggleUnitaryTab: () => void = () => { /* injecté par OS+ */ }
  public get toggleUnitaryTab(): () => void { return this._host._toggleUnitaryTab }
  public set toggleUnitaryTab(v: () => void) { this._host._toggleUnitaryTab = v }
  /**
   * Largeur (px) réservée à droite par la colonne d'occupants (chrome droit compris). Source
   * unique de vérité : calculée depuis les occupants et window.innerWidth, donc valable pour
   * N'IMPORTE quelle drawing area (maître ou vue recréée à la volée) sans état par instance.
   * La mise en page (MainZoneTabs) lit la même `mainZoneRightColumnWidthPx`.
   */
  public getMainZoneRightReservedPx(): number {
    // Le chrome droit (colonne d'outils + barre latérale) se réserve toujours : il occupe
    // l'extrême droite et la colonne d'occupants se décale d'autant vers la gauche.
    const tools = this.getRightChromeReservedPx()
    // La colonne droite n'existe que si quelque chose y vit ET qu'une zone principale la borde ;
    // un occupant détaché n'y compte pas (cf. mainZoneOccupantsIn).
    if (this.main_zone_main_id === null || this.mainZoneOccupantsIn('right').length === 0) return tools
    // sa#566 — un volet en plein écran : la colonne n'est pas dessinée, elle ne réserve rien.
    if (this.main_zone_maximized_id !== null) return tools
    return mainZoneRightColumnWidthPx(this._host._main_zone_split_ratio) + tools
  }

  /**
   * Hauteur (px) réservée en bas par le bandeau d'occupants. Symétrique de la réserve droite :
   * lue par window_fitting_height de toute drawing area, donc le diagramme se recadre dans la
   * hauteur restante. 0 sans bandeau.
   */
  public getMainZoneBottomReservedPx(): number {
    if (this.main_zone_main_id === null || this.mainZoneOccupantsIn('bottom').length === 0) return 0
    if (this.main_zone_maximized_id !== null) return 0
    return mainZoneBottomBandHeightPx(
      this._host._main_zone_bottom_px, window.innerHeight - MAIN_ZONE_MIN_BOTTOM_PX
    )
  }

  /**
   * sa#566 — UN VOLET, sérialisé seul : la forme d'une entrée de `main_zone.occupants`.
   *
   * Deux lecteurs, et une seule écriture pour qu'ils ne divergent jamais : la grande zone entière
   * (`mainZoneStateToJSON`, avec le rang du volet) et le VOLET D'UNE VUE (`mainZoneWindowToJSON`,
   * sans rang ni lien de vue — une vue sait qui elle est, et le rang d'un volet fermé ne dit rien).
   */
  protected _mainZoneOccupantToJSON(o: Type_MainZoneOccupant, order?: number): Type_JSON {
    // os#1387 — le sujet est un objet imbriqué (kind, id, sheet), la représentation une
    // chaîne : la forme de lecture s'en accommode sans ces deux clés (fichiers antérieurs).
    const subject: Type_JSON = { kind: o.subject.kind }
    if ('id' in o.subject) subject['id'] = o.subject.id
    if ('ids' in o.subject) subject['ids'] = [...o.subject.ids]
    // os#1387 — les clés de vignettes sont écrites DÈS QU'IL Y A DES OBJETS, même quand elles
    // valent leurs identifiants : c'est ce qui rend le fichier relisable tel quel quand deux
    // vignettes montrent le même nœud, cas où `ids` seul ne dit plus laquelle est laquelle.
    if ('ids' in o.subject && o.subject.ids.length > 0) subject['keys'] = mainZonePaneKeys(o.subject)
    // os#1420 — un sujet à CRITÈRE n'écrit que le critère (groupe + étiquette) : les nœuds qu'il
    // désigne se redemandent au diagramme à l'ouverture, et les écrire ici les figerait — ce qui
    // est exactement ce à quoi ce sujet sert à échapper.
    if ('tagg_id' in o.subject) subject['tagg_id'] = o.subject.tagg_id
    if ('tag_id' in o.subject) subject['tag_id'] = o.subject.tag_id
    if ('sheet' in o.subject && o.subject.sheet) subject['sheet'] = o.subject.sheet
    // os#1482 — la VUE demandée, seulement pour un sujet diagramme et seulement si elle est
    // dite : une fenêtre ouverte à la main n'en porte pas, et le fichier reste identique.
    const view = mainZoneSubjectView(o.subject)
    if (view !== '') subject['view'] = view
    // L'ordre des clés est celui d'avant sa#566 : `order` s'intercale entre le poids et la nature,
    // et c'est ce qui garde le fichier d'un document sans vue enregistrée identique octet pour octet.
    const entry: Type_JSON = { place: o.place, size: o.size }
    if (order !== undefined) entry['order'] = order
    entry['representation'] = o.representation
    entry['subject'] = subject
    // sa#563 — LA GÉOMÉTRIE, seulement quand il y en a une. Un volet qui n'a jamais flotté
    // n'écrit pas la clé, et le fichier d'un document sans volet flottant reste identique
    // octet pour octet à celui qu'écrivait la version d'avant (même règle que `figures`).
    if (o.geometry) {
      entry['geometry'] = { x: o.geometry.x, y: o.geometry.y, w: o.geometry.w, h: o.geometry.h }
    }
    // os#1418 — LES FIGURES remplacent `options`. Une figure qui n'a rien à dire (elle suit le
    // style de sa nature) rend `undefined` et ne s'écrit pas ; une fenêtre dont aucune figure
    // ne dit rien n'écrit pas la clé `figures` du tout. C'est ce qui rend un fichier
    // d'aujourd'hui — où personne n'a réglé de vignette — identique OCTET POUR OCTET à celui
    // qu'écrivait la version d'avant.
    //
    // os#1421 — UNE FIGURE PROMUE N'EST PAS ÉCRITE DEUX FOIS. Elle vit dans la clé racine
    // `figures` (le registre), et sa vignette n'écrit qu'un RENVOI `{ ref: 'f_N' }`. Deux copies
    // des mêmes réglages divergeraient à la première relecture partielle, et surtout la vignette
    // n'est plus la propriétaire : la même figure peut être posée sur un nœud et n'être montrée
    // dans aucune fenêtre.
    const figs = this._figures[o.id]
    if (figs) {
      const figures: Type_JSON = {}
      Object.entries(figs).forEach(([key, fig]) => {
        if (fig.id !== null) { figures[key] = { ref: fig.id }; return }
        const json = fig.toJSON()
        if (json) figures[key] = json
      })
      if (Object.keys(figures).length > 0) entry['figures'] = figures
    }
    // sa#566 — LE LIEN À LA VUE, écrit seulement quand il existe et seulement dans la grande zone :
    // un volet éphémère n'écrit pas la clé, d'où un fichier inchangé pour qui n'enregistre rien.
    if (order !== undefined && o.saved_view) entry['saved_view'] = o.saved_view
    // La forme d'une VUE retient qu'elle était en plein écran ; la grande zone, elle, le dit une
    // fois pour toutes (`main_zone.maximized`), puisqu'un seul volet peut l'être.
    if (order === undefined && this.main_zone_maximized_id === o.id) entry['maximized'] = true
    return entry
  }

  /**
   * Sérialise l'état de la grande zone (clé `main_zone` du fichier). Les occupants vont dans un
   * DICTIONNAIRE indexé par id — la seule forme d'objet que `Type_JSON` sait porter — avec leur
   * rang, puisque l'ordre des piles compte et que l'ordre des clés JSON n'est pas un contrat.
   *
   * os#1385 — LES FENÊTRES viennent de l'hôte, LES FIGURES du document : seul le document
   * PRINCIPAL écrit cette clé (garde `is_main` dans `_toJSON`), sinon chaque document du même
   * espace écrirait la même disposition dans son entrée.
   */
  public mainZoneStateToJSON(): Type_JSON {
    const occupants: Type_JSON = {}
    this._host._main_zone_occupants.forEach((o, order) => {
      occupants[o.id] = this._mainZoneOccupantToJSON(o, order)
    })
    const state: Type_JSON = {
      occupants,
      split_ratio: this._host._main_zone_split_ratio,
      bottom_px: this._host._main_zone_bottom_px
    }
    // sa#566 — seulement quand un volet est en plein écran : fichier inchangé sinon.
    const maximized = this.main_zone_maximized_id
    if (maximized !== null) state['maximized'] = maximized
    return state
  }

  /**
   * sa#566 — UNE ENTRÉE DE `main_zone.occupants`, relue seule. Symétrique de
   * `_mainZoneOccupantToJSON` : la grande zone entière et le volet d'une vue passent par elle.
   * Les réglages sont rendus BRUTS (`figures`, ou `options` d'un fichier d'avant), leur lecture
   * attendant les identifiants définitifs (cf. `_loadFiguresFromJSON`).
   */
  protected _parseMainZoneOccupantEntry(id: string, v: unknown) {
    const e = (v && typeof v === 'object' && !Array.isArray(v)) ? v as Type_JSON : {}
    const place = getStringFromJSON(e, 'place', 'right') as Type_MainZonePlace
    // os#1387 — sujet et représentation ; absents (fichier d'avant) = fenêtre diagramme.
    const s = e['subject']
    const sj = (s && typeof s === 'object' && !Array.isArray(s)) ? s as Type_JSON : {}
    const kind = getStringFromJSON(sj, 'kind', 'diagram')
    const sheet = getStringFromJSON(sj, 'sheet', '')
    const obj_id = getStringFromJSON(sj, 'id', '')
    const raw_ids = sj['ids']
    const ids = Array.isArray(raw_ids) ? raw_ids.filter((x): x is string => typeof x === 'string' && x !== '') : []
    // os#1387 — les clés de vignettes, tableau PARALLÈLE à `ids`. Absentes (fichier
    // antérieur, où un objet ne pouvait figurer qu'une fois) ou plus courtes qu'`ids`
    // (fichier tronqué) : `mainZonePaneKeys` retombe sur les identifiants, exactement ce
    // que ces fichiers voulaient dire. La liste est ramenée à la longueur d'`ids`, sans
    // quoi une clé orpheline décalerait toutes les suivantes d'un cran.
    const raw_keys = sj['keys']
    const keys = Array.isArray(raw_keys) ? raw_keys.map(x => (typeof x === 'string' ? x : '')) : []
    // os#1420 — le critère d'un sujet épinglé à une étiquette : GROUPE et ÉTIQUETTE, les deux
    // ou rien. Une moitié de critère ne désigne pas « moins de nœuds », elle n'en désigne
    // aucun tout en prétendant le contraire : la fenêtre retombe alors sur le défaut du
    // jalon — elle SUIT la sélection —, ce qui la rend immédiatement utile plutôt que muette.
    const tagg_id = getStringFromJSON(sj, 'tagg_id', '')
    const tag_id = getStringFromJSON(sj, 'tag_id', '')
    let subject: Type_MainZoneSubject = { kind: 'diagram' }
    if (kind === 'selection') subject = { kind: 'selection' }
    else if ((kind === 'node' || kind === 'link') && obj_id !== '') subject = { kind, id: obj_id }
    else if (kind === 'elements') subject = { kind: 'elements', ids, keys: mainZonePaneKeys({ ids, keys }) }
    else if (kind === 'tag') {
      subject = (tagg_id !== '' && tag_id !== '') ? { kind: 'tag', tagg_id, tag_id } : { kind: 'selection' }
    }
    if (subject.kind !== 'selection' && sheet !== '') subject = { ...subject, sheet }
    // os#1482 — la vue demandée ne vaut que pour un sujet diagramme (cf. `mainZoneSubjectView`).
    const view = getStringFromJSON(sj, 'view', '')
    if (subject.kind === 'diagram' && view !== '') subject = { ...subject, view }
    // os#1418 — DEUX FORMATS DE RÉGLAGES, et un seul des deux par fenêtre : `figures` (le
    // format d'aujourd'hui, une entrée par vignette) ou `options` (celui d'avant, un sac
    // par fenêtre avec son sous-dictionnaire `panes`). Tous deux gardés BRUTS ici : la
    // migration a besoin des styles déjà lus, et des identifiants DÉFINITIFS, donc elle
    // n'a pas lieu avant que les deux soient établis (cf. `_loadFiguresFromJSON`).
    const figs = e['figures']
    const figures = (figs && typeof figs === 'object' && !Array.isArray(figs)) ? figs as Type_JSON : undefined
    const opts = e['options']
    const options = (opts && typeof opts === 'object' && !Array.isArray(opts)) ? { ...(opts as Type_JSON) } : undefined
    // sa#563 — la géométrie d'un volet flottant. Absente d'un fichier antérieur, et d'un
    // volet qui n'a jamais flotté : la normalisation en pose une si la place l'exige.
    const geo = e['geometry']
    const geometry = (geo && typeof geo === 'object' && !Array.isArray(geo))
      ? clampMainZoneFloatingGeometry({
        x: getNumberFromJSON(geo as Type_JSON, 'x', 0),
        y: getNumberFromJSON(geo as Type_JSON, 'y', 0),
        w: getNumberFromJSON(geo as Type_JSON, 'w', MAIN_ZONE_FLOATING_DEFAULT_SIZE.w),
        h: getNumberFromJSON(geo as Type_JSON, 'h', MAIN_ZONE_FLOATING_DEFAULT_SIZE.h)
      })
      : undefined
    // 24/09/2026 — UNE NATURE RETIREE SE RELIT COMME CE QU'ELLE EST DEVENUE. Le disque a
    // fusionne avec la couronne ; son identifiant est pourtant ecrit dans tout classeur ou
    // l'auteur en avait ouvert un. On traduit ICI, a la lecture, et on POSE ce qu'il faut
    // pour que le dessin soit le meme (les anneaux) — cf. `retiredRepresentations`.
    const stored_repr = getStringFromJSON(e, 'representation', id)
    const representation = canonicalRepresentationId(stored_repr)
    const retired_options = retiredRepresentationOptions(stored_repr)
    if (Object.keys(retired_options).length > 0 && figures && typeof figures === 'object') {
      Object.values(figures as Type_JSON).forEach(f => {
        if (f && typeof f === 'object' && !Array.isArray(f)) {
          Object.assign(f as Type_JSON, retired_options)
        }
      })
    }
    // sa#566 — la vue que ce volet EST, s'il est enregistré (cf. `Type_MainZoneOccupant.saved_view`).
    const saved_view = getStringFromJSON(e, 'saved_view', '')
    return {
      id,
      subject,
      representation,
      place: MAIN_ZONE_PLACES.includes(place) ? place : 'right',
      size: getNumberFromJSON(e, 'size', 1),
      order: getNumberFromJSON(e, 'order', Number.MAX_SAFE_INTEGER),
      geometry,
      figures,
      options,
      saved_view: saved_view !== '' ? saved_view : undefined,
      maximized: getBooleanFromJSON(e, 'maximized', false)
    }
  }

  /**
   * Restaure l'état de la grande zone depuis le JSON (clé `main_zone`).
   *
   * Deux formats lus. Le courant (`occupants`), et l'ANCIEN — quatre booléens, six dispositions
   * de doc, trois ratios — ramené aux trois piles : la doc « accolée au tableur » va sous lui
   * dans la colonne droite (avant lui pour sheet-top/left), la doc « en bas » va au bandeau, et
   * les ratios historiques deviennent des poids de pile. Un fichier ancien s'ouvre donc comme
   * avant, à la simplification près qu'on a arbitrée.
   *
   * os#1385 — ÉCRIT LA DISPOSITION DE L'HÔTE : seul le document PRINCIPAL la relit (garde
   * `is_main` dans `_fromJSON`). Sans cette garde, ouvrir une feuille B dans une fenêtre
   * réécrirait la grande zone de l'écran avec celle enregistrée dans l'entrée de B.
   */
  public mainZoneStateFromJSON(json: Type_JSON) {
    const host = this._host
    const raw = json['occupants']
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const entries = Object.entries(raw as Type_JSON)
        .map(([id, v]) => this._parseMainZoneOccupantEntry(id, v))
        .sort((a, b) => a.order - b.order)
      // os#1418 — l'annuaire des figures repart de zéro avec la grande zone qu'il décrit : ses
      // clés sont des identifiants de fenêtres, et celles du fichier qu'on ouvre ne sont pas
      // celles de la session qui s'achève.
      this._figures = {}
      // Les réglages BRUTS, indexés par l'identifiant du fichier. Ils suivront les remaniements
      // d'identifiants ci-dessous, pour que la migration travaille sur l'id DÉFINITIF.
      const raw_figures = new Map<string, { figures?: Type_JSON, options?: Type_JSON }>()
      entries.forEach(({ id, figures, options }) => {
        if (figures || options) raw_figures.set(id, { figures, options })
      })
      host._main_zone_occupants = entries.map(({ id, subject, representation, place, size, geometry, saved_view }) => {
        const o: Type_MainZoneOccupant = { id, subject, representation, place, size }
        if (geometry) o.geometry = geometry
        if (saved_view) o.saved_view = saved_view
        return o
      })
      // sa#566 — les notes de volets fermés parlaient de l'état qu'on quitte.
      host._saved_window_snapshots = {}
      // os#1387 — un fichier écrit avec le panneau unitaire à hôte externe : sa fenêtre devient
      // une fenêtre d'élément « Unit. » qui suit la sélection, même place, même poids.
      host._main_zone_occupants = host._main_zone_occupants.map(o => {
        if (o.id !== MAIN_ZONE_UNITARY_ID) return o
        const new_id = `w_${++host._main_zone_window_seq}`
        // Les réglages SUIVENT la fenêtre renommée : sans ce transfert, un fichier d'avant
        // rouvrirait son unitaire aux valeurs d'usine — la migration ne trouverait plus rien
        // sous le nouvel identifiant.
        const raw = raw_figures.get(o.id)
        if (raw) { raw_figures.delete(o.id); raw_figures.set(new_id, raw) }
        return { ...o, id: new_id, subject: { kind: 'selection' } as Type_MainZoneSubject, representation: MAIN_ZONE_UNIT_WINDOW_ID }
      })
      // Réaligner le compteur d'ids `w_N` sur le fichier, pour ne jamais réutiliser un id.
      host._main_zone_window_seq = Math.max(host._main_zone_window_seq, ...host._main_zone_occupants
        .map(o => OWN_MAIN_ZONE_WINDOW_ID.exec(o.id)).map(m => (m ? Number(m[1]) : 0)))
      // La normalisation AVANT la migration : elle peut écarter une fenêtre (doublon, place
      // inconnue), et migrer les réglages d'une fenêtre qui n'existera pas les sèmerait sous un
      // identifiant orphelin — que `figureOf` refuserait d'ailleurs d'indexer.
      this._normalizeMainZoneOccupants()
      this._loadFiguresFromJSON(raw_figures)
    } else if ('show_diagram' in json || 'show_spreadsheet' in json || 'show_doc' in json || 'show_unitary' in json) {
      const show_diagram = getBooleanFromJSON(json, 'show_diagram', true)
      const show_sheet = getBooleanFromJSON(json, 'show_spreadsheet', false)
      const show_doc = getBooleanFromJSON(json, 'show_doc', false)
      const show_unit = getBooleanFromJSON(json, 'show_unitary', false)
      const layout = getStringFromJSON(json, 'doc_layout', 'sheet-right') as Type_MainZoneDocLayout
      const unitary_ratio = getNumberFromJSON(json, 'unitary_ratio', 0.6)
      const doc_sheet_ratio = getNumberFromJSON(json, 'doc_sheet_ratio', 0.5)
      const doc_bottom = DOC_LAYOUTS_BOTTOM.includes(layout)
      const doc_in_column = show_doc && !doc_bottom
      // Le groupe tableur/doc avait `unitary_ratio` de la colonne, l'unitaire le reste ; dans le
      // groupe, le tableur avait `doc_sheet_ratio`. Les poids reproduisent ces parts.
      const group = show_unit ? unitary_ratio : 1
      const sheet_size = doc_in_column ? group * doc_sheet_ratio : group
      const doc_size = show_sheet ? group * (1 - doc_sheet_ratio) : group
      const diagramWindow = (id: string, place: Type_MainZonePlace, size: number): Type_MainZoneOccupant =>
        ({ id, subject: { kind: 'diagram' }, representation: id, place, size })
      const list: Type_MainZoneOccupant[] = []
      if (show_diagram) list.push(diagramWindow(MAIN_ZONE_CANVAS_ID, 'main', 1))
      const doc_first = layout === 'sheet-top' || layout === 'sheet-left'
      if (doc_in_column && doc_first) list.push(diagramWindow(MAIN_ZONE_DOC_ID, 'right', doc_size))
      if (show_sheet) list.push(diagramWindow(MAIN_ZONE_SPREADSHEET_ID, 'right', sheet_size))
      if (doc_in_column && !doc_first) list.push(diagramWindow(MAIN_ZONE_DOC_ID, 'right', doc_size))
      if (show_unit) {
        list.push({
          id: `w_${++host._main_zone_window_seq}`, subject: { kind: 'selection' },
          representation: MAIN_ZONE_UNIT_WINDOW_ID, place: 'right', size: 1 - unitary_ratio
        })
      }
      if (show_doc && doc_bottom) list.push(diagramWindow(MAIN_ZONE_DOC_ID, 'bottom', 1))
      host._main_zone_occupants = list
    }
    // sa#566 — le volet en plein écran, s'il est encore là (`setMainZoneMaximized` le vérifie).
    const maximized = getStringFromJSON(json, 'maximized', '')
    host._main_zone_maximized_id = (maximized !== '' && host._main_zone_occupants.some(o => o.id === maximized))
      ? maximized : null
    this._normalizeMainZoneOccupants()
    host._main_zone_split_ratio = getNumberFromJSON(json, 'split_ratio', host._main_zone_split_ratio)
    host._main_zone_bottom_px = getNumberFromJSON(
      json, 'bottom_px', getNumberFromJSON(json, 'doc_bottom_px', host._main_zone_bottom_px)
    )
    this._notifyMainZone()
  }

  /**
   * os#1418/1419 — LES RÉGLAGES DES FENÊTRES, relus ou MIGRÉS.
   *
   * Deux formats, un seul par fenêtre :
   *
   *  - `figures` : le format d'aujourd'hui. Une entrée par clé de vignette, relue telle quelle
   *    par `Class_Figure.fromJSON` (qui rapporte les clés qu'aucune nature ne déclare).
   *
   *  - `options` : le format d'avant (sac par fenêtre + sous-dictionnaire `panes`). MIGRÉ en
   *    reproduisant EXACTEMENT la résolution qui avait cours, vignette par vignette :
   *      1. ce que LA VIGNETTE disait (`panes[clé]`) gagne toujours ;
   *      2. sinon, si la nature a un défaut non vide, la figure le SUIT — on n'écrit donc rien,
   *         ce qui est mieux que ce que faisait l'ancien code : la figure suivra le style même
   *         s'il change ensuite, là où la résolution d'avant refigeait le défaut de l'instant ;
   *      3. sinon, le repli au niveau de la FENÊTRE devient une surcharge propre.
   *    L'ordre de ces trois sources est celui de `mainZonePaneOptionsOf` d'avant os#1418, et il
   *    est reproduit EN BLOC (et non clé par clé) parce que c'est ainsi qu'il décidait : une
   *    vignette qui disait quoi que ce soit ne voyait plus rien du défaut ni du repli.
   *
   * QUELLES CLÉS DE VIGNETTE ? Celles du sujet : `keys` pour un sujet `elements`, l'identifiant
   * de l'objet pour `node`/`link`, `FIGURE_DIAGRAM_PANE_KEY` pour un sujet diagramme. Un sujet
   * 'selection' n'en a AUCUNE de connue à ce moment — il suit le dessin, et rien n'est encore
   * sélectionné : on migre alors les vignettes que `panes` nomme (ce sont les objets que
   * l'auteur avait regardés) et on met le repli de la fenêtre dans la figure de clé `''`. Ce
   * choix est un compromis assumé : une fenêtre qui suit n'a pas de vignette stable à qui donner
   * le repli, et la figure `''` est la seule adresse qui survive au changement de sélection.
   */
  protected _loadFiguresFromJSON(raw: Map<string, { figures?: Type_JSON, options?: Type_JSON }>): void {
    raw.forEach((entry, id) => {
      // os#1385 — la FENÊTRE est de l'hôte, la FIGURE qu'on lui attache est de ce document.
      const o = this._host._main_zone_occupants.find(x => x.id === id)
      if (!o) return
      if (entry.figures) {
        Object.entries(entry.figures).forEach(([key, v]) => {
          // os#1421 — DEUX FORMES sous `figures[clé]` : un RENVOI au registre (`{ ref: 'f_N' }`,
          // ce qu'on écrit depuis qu'une figure peut être posée ailleurs) ou le sac INLINE (une
          // figure qui n'a jamais été promue, hier comme aujourd'hui).
          const ref = (v && typeof v === 'object' && !Array.isArray(v)) ? (v as Type_JSON)['ref'] : undefined
          if (typeof ref === 'string' && ref !== '') {
            const fig = this._figures_by_id[ref]
            if (fig) {
              // L'INSTANCE DU REGISTRE rejoint l'annuaire : c'est le même objet des deux côtés,
              // donc régler la vignette règle ce que montre le nœud qui la cite.
              const by_key = this._figures[id] ?? (this._figures[id] = {})
              by_key[key] = fig
              return
            }
            // Renvoi dans le vide (registre tronqué, fichier recomposé à la main) : on le DIT, et
            // la vignette repart d'une figure neuve qui suit le style de sa nature — plutôt qu'une
            // vignette muette dont personne ne saurait dire pourquoi elle a perdu ses réglages.
            this._figure_report.add({
              nature: o.representation, key: ref,
              where: `main_zone[${id}].figures[${key}].ref`, reason: 'unknown_key'
            })
            this.figureOf(id, key)
            return
          }
          this.figureOf(id, key).fromJSON(v, this._figure_report, `main_zone[${id}].figures[${key}]`)
        })
        return
      }
      const options = entry.options
      if (!options) return
      const nature = this.figureNature(o.representation)
      const win = mainZoneWindowLevelOptions(options)
      const win_has_something = Object.keys(win).length > 0
      // « Le défaut de la nature dit quelque chose » : son style `default` s'écarte de l'usine.
      const default_says_something = nature.toJSON() !== undefined
      const load = (key: string, bag: Type_JSON, where: string) => {
        Object.keys(bag).forEach(k => {
          if (!nature.isDeclared(k)) {
            this._figure_report.add({ nature: nature.id, key: k, where, reason: 'unknown_key' })
          }
          this._figure_report.countMigrated()
        })
        this.figureOf(id, key).loadOwn(bag as Type_OptionBag)
      }
      const migratePane = (key: string) => {
        const own = ownMainZonePaneOptions(options, key)
        if (own) load(key, own, `main_zone[${id}].options.panes[${key}]`)
        else if (default_says_something) { /* la figure suit le style : rien à écrire */ }
        else if (win_has_something) load(key, win, `main_zone[${id}].options`)
      }
      const subject: Type_MainZoneSubject = o.subject
      if (subject.kind === 'elements') (subject.keys ?? []).forEach(migratePane)
      else if (subject.kind === 'node' || subject.kind === 'link') migratePane(subject.id)
      else if (subject.kind === 'selection') {
        const panes = options[MAIN_ZONE_PANES_KEY]
        if (panes && typeof panes === 'object' && !Array.isArray(panes)) {
          Object.keys(panes as Type_JSON).forEach(migratePane)
        }
        if (win_has_something) load(FIGURE_DIAGRAM_PANE_KEY, win, `main_zone[${id}].options`)
      } else if (win_has_something) {
        // Sujet diagramme : une seule figure, et le sac de la fenêtre EST ce qu'elle disait.
        load(FIGURE_DIAGRAM_PANE_KEY, win, `main_zone[${id}].options`)
      }
    })
  }

  /* ========================================
    Timeout dict
  =========================================== */

  protected _waiting_processes: { [id: string]: NodeJS.Timeout } = {}
  protected _waiting_time_for_processes: number = 50 // ms

  private _ref_close_filter_drawer: MutableRefObject<((_: boolean) => void)>
  // Bascule (ouvre/ferme) le drawer de filtres depuis la colonne d'outils (le bouton flottant
  // historique étant masqué en éditeur). Renseigné par ToolbarFilter.
  private _ref_toggle_filter_drawer: MutableRefObject<(() => void)>
  // OS#1273 — Ouvre/bascule la barre de recherche d'élément (Ctrl+F). Renseigné
  // par le composant ElementSearchOverlay ; appelé depuis le gestionnaire clavier.
  private _ref_toggle_search: MutableRefObject<(() => void)>
  private _ref_toolbar: MutableRefObject<(() => void)>

  private _ref_rerender_submodules_menus: MutableRefObject<() => void>


  // Update component Menu
  private _ref_to_splashscreen_updater: MutableRefObject<() => void>
  private _ref_to_menu_updater: MutableRefObject<() => void>
  private _ref_to_submenu_updater: MutableRefObject<() => void>
  private _ref_to_spreadsheet: MutableRefObject<(() => void)>
  private _ref_to_doc: MutableRefObject<(() => void)>

  // Ref to state if configuration is opened
  private _ref_menu_opened: MutableRefObject<[boolean, (b: boolean) => void]>
  private _ref_to_toolbar_link_visual_filter_updater: MutableRefObject<(() => void)>
  private _ref_to_toolbar_level_tag_filter_updater: MutableRefObject<() => void>
  private _ref_to_unitarytag_filter_updater: MutableRefObject<() => void>
  private _ref_to_toolbar_node_tag_updater: MutableRefObject<(() => void)>
  private _ref_to_toolbar_link_tag_updater: MutableRefObject<(() => void)>
  private _ref_to_toolbar_data_tag_updater: MutableRefObject<(() => void)>
  /* ========================================
   Ref to button on the top menu in the app
   ========================================*/

  private _refs_to_btn_toogle_top_menus: { [id: string]: RefObject<HTMLButtonElement> } = {}

  // Update component OpenSankeyConfigurationsMenus
  protected _ref_to_menu_config_updater: MutableRefObject<() => void>

  // #1243 — Update de l'inspecteur piloté par la sélection. Slot dédié : déclenché
  // à chaque changement de composition de la sélection (add/remove/purge) pour que
  // l'inspecteur re-résolve sa cible. Distinct des updaters de sous-menus (que
  // l'inspecteur réutilise en tant qu'enfants) pour éviter tout vol de slot.
  private _ref_to_inspector_updater: MutableRefObject<() => void>

  private _ref_to_menu_config_layout_updater: MutableRefObject<() => void>
  private _ref_to_menu_contextual_config_layout_updater: MutableRefObject<() => void>

  // #1333 (lot A) — panneau d'import de l'image de fond. Le slot vivait dans
  // Class_MenuConfigOSP tant que le panneau était injecté par OpenSankey+ ; il a
  // suivi le panneau dans la couche d'édition.
  private _ref_to_config_DA_bg_image_updater: MutableRefObject<() => void>

  // Update component SankeyNodeEdition
  private _ref_to_menu_config_nodes_selection_updater: MutableRefObject<() => void>

  // Update component SankeyNodeDimEdition
  private _ref_to_menu_config_nodes_dim_selection_updater: MutableRefObject<() => void>

  // Update stock data section in Structure/Données > Noeuds
  private _ref_to_menu_config_nodes_stock_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationNodesAttributes
  private _ref_to_menu_config_apparence_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationNodesAttributes
  private _ref_to_menu_config_styles_updater: MutableRefObject<() => void>
  private _ref_to_menu_config_styles_editor_updater: MutableRefObject<() => void>

  // update SankeyMenuConfigurationNodesTags
  private _ref_to_menu_config_nodes_tags_updater: MutableRefObject<() => void>

  // update SankeyMenuConfigurationNodesDimTags
  private _ref_to_menu_config_nodes_dim_tags_updater: MutableRefObject<() => void>



  // Update component MenuConfigurationNodesTooltip
  private _ref_to_menu_config_nodes_tooltips_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_config_links_selection_updater: MutableRefObject<() => void>
  private _ref_to_menu_config_containers_selection_updater: MutableRefObject<() => void>
  private _ref_to_menu_config_links_data_updater: MutableRefObject<() => void>
  private _ref_to_menu_contextual_config_links_data_updater: MutableRefObject<() => void>
  private _ref_to_menu_config_links_tags_updater: MutableRefObject<() => void>
  private _ref_to_menu_config_links_tooltips_updater: MutableRefObject<() => void>
  private _ref_to_menu_config_tags_updater: { [_: string]: MutableRefObject<() => void> } = {}
  private _ref_to_menu_context_nodes_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_context_links_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_context_drawing_area_updater: MutableRefObject<(() => void)>
  private _ref_to_toolbar_updater: MutableRefObject<() => void>
  private _ref_to_save_in_cache_indicator: MutableRefObject<(b: boolean) => void>
  private _ref_to_save_in_cache_indicator_value: MutableRefObject<boolean>
  // sa#424 (lot 4) — signal de RAFRAÎCHISSEMENT de l'alerte « aucun fichier
  // téléchargé » portée par le bouton d'enregistrement. Un signal distinct est
  // nécessaire : réutiliser l'indicateur de cache en lui repassant sa valeur
  // courante ne redessine rien (React abandonne un setState de valeur égale), et
  // l'alerte restait donc affichée après le premier téléchargement.
  private _ref_to_last_download_updater: MutableRefObject<() => void>
  // Session toggle "ne jamais enregistrer la vue" : when true, switching away
  // from an edited view discards changes silently (no "Vue non enregistrée"
  // modal). Reset by clicking the cache cloud icon. Lives here (OS base) so the
  // OS-base cloud button and the OSP view machinery share one flag.
  private _ref_to_never_save_view_session: MutableRefObject<(b: boolean) => void>
  private _ref_to_never_save_view_session_value: MutableRefObject<boolean>

  private _ref_to_save_diagram_updater: MutableRefObject<() => void>
  private _ref_to_load_diagram_updater: MutableRefObject<() => void>
  private _ref_universal_converter_set_config: MutableRefObject<(_: ConverterConfig, file_path: string, launch_at_opening: boolean, default_solver_options?: { with_reconciled?: boolean, with_completed?: boolean }) => void>

  private _ref_to_updater_modal_apply_layout: MutableRefObject<() => void>
  // os#1385 — LES SEPT POINTS D'INJECTION DE MENUS SONT DE L'ESPACE DE TRAVAIL : les menus
  // qu'ils garnissent sont ceux de la barre du haut, unique, et les fermetures qu'on y pose
  // capturent UNE application (cf. UnitaryExcelSourceOSP). Leurs formes vivent au-dessus de
  // la classe (Type_ExtraApplyLayoutTab & co.), le stockage n'a de sens que sur l'hôte.
  /** If provided, row keys returning true will be greyed in UpdateModeGrid */
  protected _apply_layout_is_row_disabled?: (key: string) => boolean = undefined
  public get apply_layout_is_row_disabled(): ((key: string) => boolean) | undefined {
    return this._host._apply_layout_is_row_disabled
  }
  public set apply_layout_is_row_disabled(v: ((key: string) => boolean) | undefined) {
    this._host._apply_layout_is_row_disabled = v
  }
  /** Optional extra tab injected into UpdateModeGrid by OSP or other extensions */
  protected _extra_apply_layout_tab?: Type_ExtraApplyLayoutTab = undefined
  public get extra_apply_layout_tab(): Type_ExtraApplyLayoutTab | undefined {
    return this._host._extra_apply_layout_tab
  }
  public set extra_apply_layout_tab(v: Type_ExtraApplyLayoutTab | undefined) {
    this._host._extra_apply_layout_tab = v
  }
  /** Optional extra menu items appended to the top export dropdown (PNG/PDF/SVG list). Injected by OSP or other extensions. */
  protected _extra_export_menu_items?: Type_ExtraExportMenuItems = undefined
  public get extra_export_menu_items(): Type_ExtraExportMenuItems | undefined {
    return this._host._extra_export_menu_items
  }
  public set extra_export_menu_items(v: Type_ExtraExportMenuItems | undefined) {
    this._host._extra_export_menu_items = v
  }
  /**
   * sa#399 — Entrées supplémentaires du menu « Enregistrer » (dropdown dédié + groupe
   * Enregistrer du menu Fichier). Injectées par OSP (dépôt dans la bibliothèque de
   * briques) ou d'autres extensions. `label` et `hidden` sont des fonctions évaluées
   * au rendu : l'entrée suit la langue active et peut n'apparaître que pour un compte
   * connecté (une entrée cachée n'est pas rendue du tout, contrairement à `disabled`).
   */
  protected _extra_save_menu_items?: Type_LazyLabelMenuItems = undefined
  public get extra_save_menu_items(): Type_LazyLabelMenuItems | undefined {
    return this._host._extra_save_menu_items
  }
  public set extra_save_menu_items(v: Type_LazyLabelMenuItems | undefined) {
    this._host._extra_save_menu_items = v
  }
  /**
   * sa#424 (lot 5) — Commandes ajoutées EN BAS du menu Fichier, après le dernier
   * séparateur. Sert au « Partager… » que la couche SaaS y pose : partager n'est
   * ni un format ni une destination d'enregistrement, c'est une commande à part.
   *
   * Point d'injection plutôt qu'appel direct : l'éditeur open-source ignore tout
   * de la publication (qui vit dans OS+ / SA), et doit continuer à l'ignorer.
   * Même contrat que `extra_save_menu_items` — `label` et `hidden` évalués au
   * rendu, pour suivre la langue et l'état de connexion.
   */
  protected _extra_file_menu_items?: Type_LazyLabelMenuItems = undefined
  public get extra_file_menu_items(): Type_LazyLabelMenuItems | undefined {
    return this._host._extra_file_menu_items
  }
  public set extra_file_menu_items(v: Type_LazyLabelMenuItems | undefined) {
    this._host._extra_file_menu_items = v
  }
  /**
   * Optional handler that saves one standalone JSON file per view, packaged in a
   * single zip. Injected by OSP (views are an OSP feature). When set, the
   * persistence dialog's ``save_one_json_per_view`` JSON output option routes the
   * blob→json save through this instead of the single-file saveToJSON.
   */
  protected _save_all_views_as_json?: (kwargs: Type_JSON) => Promise<void> | void = undefined
  public get save_all_views_as_json(): ((kwargs: Type_JSON) => Promise<void> | void) | undefined {
    return this._host._save_all_views_as_json
  }
  public set save_all_views_as_json(v: ((kwargs: Type_JSON) => Promise<void> | void) | undefined) {
    this._host._save_all_views_as_json = v
  }
  /** Optional extra menu items appended to the top "Aide" dropdown (after Visite guidée / Tutoriels). Injected by SA (e.g. Sankeythèque) or other extensions. */
  protected _extra_help_menu_items?: Type_ExtraHelpMenuItems = undefined
  public get extra_help_menu_items(): Type_ExtraHelpMenuItems | undefined {
    return this._host._extra_help_menu_items
  }
  public set extra_help_menu_items(v: Type_ExtraHelpMenuItems | undefined) {
    this._host._extra_help_menu_items = v
  }
  /** sa#560 — surface de retour sur échec, posée par la couche SaaS (cf. Type_ReportProcessFailure). */
  protected _report_process_failure?: Type_ReportProcessFailure = undefined
  public get report_process_failure(): Type_ReportProcessFailure | undefined {
    return this._host._report_process_failure
  }
  public set report_process_failure(v: Type_ReportProcessFailure | undefined) {
    this._host._report_process_failure = v
  }
  private _ref_to_modal_pref_updater: MutableRefObject<() => void>
  protected _ref_to_toolbar_bottom_updater: MutableRefObject<() => void>
  // OS#85 — re-render des onglets de feuilles (bas de la grande zone).
  protected _ref_to_sheet_tabs_updater: MutableRefObject<() => void> = { current: () => null }
  // OS#85 — barre des feuilles dépliée ? Pendant bas de la bascule de barre latérale : elle
  // mange le bas du dessin, on doit pouvoir la replier. État de session (comme la barre
  // latérale), pas une préférence enregistrée.
  protected _sheet_tabs_visible: boolean = true

  private _ref_to_nodetag_filter_updater: MutableRefObject<() => void>
  private _ref_to_datatag_filter_updater: MutableRefObject<() => void>

  private _dict_setter_show_dialog: IType_DictHookRefSetterShowDialogComponents

  private _selector_only_visible_elements: boolean = false
  private _ref_selected_style: MutableRefObject<string> = { current: 'default' }

  private _ref_to_updater_node_disagregate: MutableRefObject<(b: boolean) => void> = { current: () => null }
  private _ref_to_updater_node_agregate: MutableRefObject<(b: boolean) => void> = { current: () => null }

  private _never_see_again: MutableRefObject<boolean> = { current: (localStorage.getItem('dontSeeAgainWelcome') === '1') }
  private _show_splashscreen: boolean = false


  private _additionalMenus: MutableRefObject<Type_AdditionalMenus> = { current: {
    external_top_buttons_item: {},

    // Menu config : cf. Type_AdditionalMenus — l'injection du panneau de config
    // passe désormais par les registres (#1243).
    extra_background_element: <></>,

    additional_nav_item: [],
    additional_bottom_item: [],
    additional_tools_item: [],

    formations_menu: {},
    template_module_key: ['essential'],
  } }

  /**
   * os#1385 — SANS ARGUMENT : la configuration de l'ESPACE DE TRAVAIL (elle est son propre
   * hôte). AVEC `host` : la configuration d'un DOCUMENT, qui délègue à `host` tout ce qui
   * est unique par espace de travail.
   */
  constructor(host?: Class_MenuConfig) {
    this._host = host ?? this
    // OS#300 — modèle des panneaux, partageant le bus de ce menu (créé en
    // initialiseur de champ, donc déjà disponible ici).
    //
    // os#1385 — CONSTRUIT SEULEMENT PAR L'HÔTE : un document rend celui de son espace de
    // travail (cf. `get panels`), sur le bus de l'hôte, donc les coquilles PanelShell
    // s'abonnent toutes au bus où le gestionnaire notifie — quel que soit le document par
    // lequel elles y arrivent.
    if (host === undefined) this._panels = new Class_PanelManager(this._event_bus)
    this._ref_to_drawer_sequence_data_tag_updater = { current: () => null }
    // Init menu component updater ------------------------------------------------------
    this._ref_rerender_submodules_menus = { current: () => null }
    this._ref_to_splashscreen_updater = { current: () => null }
    this._ref_to_menu_updater = { current: () => null }
    this._ref_to_submenu_updater = { current: () => null }
    this._ref_to_spreadsheet = { current: () => null }
    this._ref_to_doc = { current: () => null }
    this._ref_to_menu_config_updater = { current: () => null }
    this._ref_to_inspector_updater = { current: () => null }
    this._ref_menu_opened = { current: [false, () => null] }

    // Layout
    this._ref_to_menu_config_layout_updater = { current: () => null }
    this._ref_to_menu_contextual_config_layout_updater = { current: () => null } //contextual ref updater
    this._ref_to_config_DA_bg_image_updater = { current: () => null }

    // Dimensions
    this._ref_to_menu_config_nodes_dim_selection_updater = { current: () => null }
    this._ref_to_menu_config_nodes_dim_tags_updater = { current: () => null }

    // Nodes
    this._ref_to_menu_config_nodes_selection_updater = { current: () => null }
    this._ref_to_menu_config_nodes_stock_updater = { current: () => null }

    this._ref_to_menu_config_apparence_updater = { current: () => null }
    this._ref_to_menu_config_styles_updater = { current: () => null }
    this._ref_to_menu_config_styles_editor_updater = { current: () => null }
    this._ref_to_menu_config_nodes_tags_updater = { current: () => null }
    this._ref_to_menu_config_nodes_tooltips_updater = { current: () => null }

    // Links
    this._ref_to_menu_config_links_selection_updater = { current: () => null }
    this._ref_to_menu_config_containers_selection_updater = { current: () => null }
    this._ref_to_menu_config_links_data_updater = { current: () => null }
    this._ref_to_menu_contextual_config_links_data_updater = { current: () => null }


    this._ref_to_menu_config_links_tags_updater = { current: () => null }
    this._ref_to_menu_config_links_tooltips_updater = { current: () => null }
    // Tags
    this._ref_to_menu_config_tags_updater['level_taggs'] = { current: () => null }
    this._ref_to_menu_config_tags_updater['node_taggs'] = { current: () => null }
    this._ref_to_menu_config_tags_updater['flux_taggs'] = { current: () => null }
    this._ref_to_menu_config_tags_updater['data_taggs'] = { current: () => null }

    // Toolbar+
    // os#1442 — LE DÉFAUT N'EST PLUS UN TROU. Il valait `() => null` : un document dont aucun
    // bouton d'enregistrement n'est monté — c'est-à-dire TOUT document de feuille, qui n'a pas
    // de barre du haut à lui — voyait les quarante sites d'appel lui annoncer « modifié » et
    // n'en gardait rien. Son `_value` restait à `true` pour toujours, et l'indicateur par
    // document ne pouvait pas exister. Le défaut enregistre donc, et annonce.
    //
    // Quand une barre du haut EST montée, `useModelSlot` remplace ce défaut par son propre
    // gestionnaire, qui écrit la même valeur et annonce le même topic (cf. MenuTop) : les deux
    // chemins disent la même chose, et c'est `_value` qui fait foi dans les deux cas.
    this._ref_to_save_in_cache_indicator = {
      current: (b: boolean) => {
        if (this._ref_to_save_in_cache_indicator_value.current === b) return
        this._ref_to_save_in_cache_indicator_value.current = b
        this.notify(SAVE_STATE_TOPIC)
      }
    }
    this._ref_to_save_in_cache_indicator_value = { current: true }
    this._ref_to_last_download_updater = { current: () => null }
    this._ref_to_never_save_view_session = { current: (_: boolean) => null }
    this._ref_to_never_save_view_session_value = { current: false }
    this._ref_to_toolbar_updater = { current: () => null }
    this._ref_to_toolbar_link_visual_filter_updater = { current: () => null }
    this._ref_to_toolbar_node_tag_updater = { current: () => null }
    this._ref_to_toolbar_link_tag_updater = { current: () => null }
    this._ref_to_toolbar_data_tag_updater = { current: () => null }
    this._ref_to_toolbar_level_tag_filter_updater = { current: () => null }
    this._ref_to_unitarytag_filter_updater = { current: () => null }

    // Init context menu components updater ---------------------------------------------

    this._ref_to_menu_context_nodes_updater = { current: () => null }
    this._ref_to_menu_context_links_updater = { current: () => null }
    this._ref_to_menu_context_drawing_area_updater = { current: () => null }

    // Init filtering components updater ------------------------------------------------

    this._ref_to_nodetag_filter_updater = { current: () => null }
    // this._ref_to_fluxtag_filter_updater = { current: () => null }
    this._ref_to_datatag_filter_updater = { current: () => null }

    // Init save diagram JSON components updater ------------------------------------------------

    this._ref_to_save_diagram_updater = { current: () => null }
    this._ref_to_load_diagram_updater = { current: () => null }

    // Init ApplyLayoutDialog components updater ------------------------------------------------

    this._ref_to_updater_modal_apply_layout = { current: () => null }

    // Init ModalPreference components updater ------------------------------------------------

    this._ref_to_modal_pref_updater = { current: () => null }

    // Init ToolBarBottom components updater ------------------------------------------------
    this._ref_to_toolbar_bottom_updater = { current: () => null }

    // Init dict of setter show dialog -------------------------------------------------
    this._ref_universal_converter_set_config = { current: (_: ConverterConfig, _file_path: string, _launch_at_opening: boolean) => null }

    this._dict_setter_show_dialog = {
      // Modal - Welcome
      ref_setter_modal_welcome_active_page: { current: () => null },
      ref_setter_show_modal_welcome: { current: () => null },
      ref_setter_show_modal_support: { current: () => null },

      ref_setter_show_modal_file_converter: { current: () => null },
      ref_setter_show_modal_rich_text_editor: { current: () => null },
      ref_setter_show_shape_attribute_editor: { current: () => null },
      ref_setter_show_value_type_editor: { current: () => null },
      ref_setter_show_tooltip_editor: { current: () => null },
      ref_setter_show_units_editor: { current: () => null },
      ref_setter_show_unitary_process_editor: { current: () => null },
      ref_setter_show_lca_catalog_explorer: { current: () => null },
      ref_setter_show_sankeymatic_editor: { current: () => null },

      ref_setter_show_modal_export: { current: () => null },
      ref_setter_show_modal_new_document: { current: () => null },
      ref_setter_show_modal_png_saver: { current: () => null },
      ref_setter_png_saver_res_h: { current: () => null },
      ref_setter_png_saver_res_v: { current: () => null },

      ref_setter_show_modal_pdf_saver: { current: () => null },
      // Modal - Style & Layout
      ref_setter_show_modal_styles: { current: () => null },

      ref_setter_show_modal_apply_layout: { current: () => null },

      ref_setter_show_modal_styles_containers: { current: () => null },
      // Other modals
      ref_setter_show_modal_preference: { current: () => null },
      ref_setter_show_modal_templates_lib: { current: () => null },
      ref_setter_show_gallery_source: { current: () => null },
      ref_setter_show_spreadsheet: { current: () => null },

      ref_setter_show_menu_node_icon: { current: () => null },
      ref_setter_show_modal_import_icons: { current: () => null }
    }

    this._ref_to_menu_config_container_updater = { current: () => null }
    this._ref_to_menu_context_container_updater = { current: () => null }

    this._r_setter_editor_content_fo_node = { current: () => null }
    this._r_editor_content_set_elements = { current: () => null }
    this._r_rich_text_editor_refresh = { current: () => null }
    this._icon_selector_set_elements = { current: () => null }
    this._r_value_formatting_set_elements = { current: () => null }
    this._r_value_type_set_elements = { current: () => null }

    this._ref_to_menu_config_node_name_label_bg_updater = { current: () => null }
    this._ref_to_menu_config_link_scientific_precision_updater = { current: () => null }

    this._ref_to_menu_config_node_icon_updater = { current: () => null }

    this._ref_close_filter_drawer = { current: () => null }
    this._ref_toggle_filter_drawer = { current: () => undefined }
    this._ref_toggle_search = { current: () => undefined }
    this._ref_toolbar = { current: () => null }
  }

  // PUBLIC METHODS =====================================================================

  public closeAllMenus() {
    this.closeConfigMenu()
    // os#1385 — par l'accesseur : les dialogues sont ceux de l'espace de travail.
    const dialogs = this.dict_setter_show_dialog
    dialogs.ref_setter_show_modal_welcome.current(false)
    dialogs.ref_setter_show_modal_support.current(false)
    dialogs.ref_setter_show_modal_file_converter.current(false)
    dialogs.ref_setter_show_modal_rich_text_editor.current(false)
    dialogs.ref_setter_show_shape_attribute_editor.current(false)
    dialogs.ref_setter_show_value_type_editor.current(false)
    dialogs.ref_setter_show_tooltip_editor.current(false)
    dialogs.ref_setter_show_units_editor.current(false)
    dialogs.ref_setter_show_unitary_process_editor.current(false)
    dialogs.ref_setter_show_lca_catalog_explorer.current(false)
    dialogs.ref_setter_show_sankeymatic_editor.current(false)
    dialogs.ref_setter_show_modal_export.current(false)
    dialogs.ref_setter_show_modal_new_document.current(false)
    dialogs.ref_setter_show_modal_png_saver.current(false)
    dialogs.ref_setter_show_modal_pdf_saver.current(false)
    dialogs.ref_setter_show_modal_styles.current(false)
    dialogs.ref_setter_show_modal_apply_layout.current(false)
    dialogs.ref_setter_show_modal_styles_containers.current(false)
    dialogs.ref_setter_show_modal_preference.current(false)
    dialogs.ref_setter_show_modal_templates_lib.current(false)
    dialogs.ref_setter_show_gallery_source.current(null)
    dialogs.ref_setter_show_spreadsheet.current(false)
    this.ref_close_filter_drawer.current(false)
    // OS#321 — la RECHERCHE et la GALERIE DE MODÈLES sont des menus comme les
    // autres : Échap les referme, qu'elles soient en pop-up ou ancrées en barre
    // latérale (où plus aucune croix ne les ferme). Par leur porte propre, pour
    // que la requête de l'une et l'état de l'autre repartent à zéro.
    this.panels.closeThrough('search')
    this.panels.closeThrough('templates')
  }

  /**
   * Open menu configuration
   * @memberof Class_MenuConfig
   */
  public openConfigMenu() {
    // Ouverture AUTOMATIQUE de la config (sélection d'éléments au tracé de flux,
    // légende, stock…) : on la neutralise si le tableur est affiché, sinon elle
    // le refermerait (colonne droite partagée). L'ouverture MANUELLE passe par
    // setConfigOpen (bouton) et reste possible — elle ferme alors le tableur.
    if (this.main_zone_show_spreadsheet) return
    const opened = this.ref_menu_opened
    if (
      opened.current &&
      opened.current[0] === false
    ) {
      opened.current[1](true)
    }
  }

  /**
   * Open menu configuration
   * @memberof Class_MenuConfig
   */
  public closeConfigMenu() {
    const opened = this.ref_menu_opened
    if (
      opened.current &&
      opened.current[0] === true
    ) {
      opened.current[1](false)
    }
  }

  // OS#300 Lot 5 — l'INFO-BULLE D'INSPECTEUR au survol a été RETIRÉE.
  //
  // Elle montrait des champs d'édition là où le survol d'un élément doit montrer
  // le diagramme : c'est désormais la présentation composée qui s'y affiche, en
  // édition comme en lecture. Sa machinerie (sélection temporaire de l'élément
  // survolé, restauration de la sélection à la fermeture, épinglage à la 1re
  // édition) n'avait plus d'appelant.

  // #1243 — La matrice est déposée : les ex-openConfigMenuElementsNodes/Links/
  // NodesLinks/Containers, qui ouvraient le panneau PUIS forçaient (après 200 ms)
  // le type et l'élément de la matrice, n'ont plus d'objet — l'inspecteur dérive
  // sa cible de la sélection. Leurs appelants (interactions de canvas, légende,
  // stock) appellent désormais openConfigMenu() tout court.

  public updateComponentRelatedToLayoutApparence() {
    this._add_waiting_process(
      'updateComponentRelatedToLayoutApparence',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_layout_updater.current()
        _this._ref_to_menu_contextual_config_layout_updater.current()
        _this._ref_to_config_DA_bg_image_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToNodesSelection() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesSelection',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_selection_updater.current()
        _this._r_rich_text_editor_refresh.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToNodesDimSelection() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesSelection',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_dim_selection_updater.current()
      }
    )
  }

  public updateComponentRelatedToStyles() {
    this._ref_to_menu_config_styles_updater.current()
    this._ref_to_menu_config_styles_editor_updater.current()
    this._ref_to_menu_config_apparence_updater.current()
  }

  public updateComponentRelatedToContainersApparence() {
    this._ref_to_menu_config_apparence_updater.current()
  }
  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToNodesTags() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesTags',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_tags_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToNodesDimTags() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesTags',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_dim_tags_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToNodesTooltips() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesTooltips',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_tooltips_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToLinksSelection() {
    this._ref_to_menu_config_links_selection_updater.current()
    this._r_rich_text_editor_refresh.current()
  }
  public updateComponentRelatedToContainerSelection() {
    this._ref_to_menu_config_containers_selection_updater.current()
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToLinksData() {
    this._add_waiting_process(
      'updateComponentRelatedToLinksData',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_links_data_updater.current()
        _this.updateSpreadsheet()
        _this._ref_to_menu_contextual_config_links_data_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToLinksTags() {
    this._add_waiting_process(
      'updateComponentRelatedToLinksTags',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_links_tags_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToLinksTooltips() {
    this._add_waiting_process(
      'updateComponentRelatedToLinksTooltips',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_links_tooltips_updater.current()
      }
    )
  }

  /**
   * Update all menus using related refs to update function
   * @memberof Class_MenuConfig
   */
  public updateAllMenuComponents() {
    this._ref_to_menu_updater.current()
    // Reconstruit les menus injectés par les submodules (OS+/LC) : leurs JSX (titres de panneaux de
    // config, libellés de la colonne d'outils…) sont figés dans additionalMenus.current avec les t(…)
    // évalués à la construction. Sans ce rerender, un changement de langue ne les met pas à jour
    // (ils restaient dans la langue initiale). Le re-render est porté par un setState de composant
    // (WrapperInitializeAdditionalMenus), donc dans le bon scope React.
    this.ref_rerender_submodules_menus.current()
    // TDODO : to have an updater in OpenSankeyMenusDictBuilder so if we cahnge language it update language of submenus,
    //  for now OpenSankeyMenusDictBuilder is a function so the updater crash the app because the re-render is out of the correct scope
    // this._ref_to_submenu_updater.current()
    this.updateMenuConfigComponent()
    this.updateInspector() // #1243
    this.updateComponentRelatedToLayoutApparence()
    this.updateAllComponentsRelatedToNodes()
    this.updateAllComponentsRelatedToLinks()
    this.updateAllComponentsRelatedToToolbar()
    this.updateAllComponentsRelatedToDataTags()
    this.updateAllComponentsRelatedToNodeTags()
    this.updateAllComponentsRelatedToFluxTags()
    this.updateAllComponentsRelatedToLevelTags()
    this.updateAllComponentsRelatedToContainers()
    this.updateComponentPref()
    this._ref_to_toolbar_bottom_updater.current()
    // OS#85 — onglets de feuilles (un chargement de document a pu en changer la liste).
    this._ref_to_sheet_tabs_updater.current()
    // Resynchronise le panneau Doc markdown (un nouveau fichier / diagramme a pu être chargé).
    this.ref_to_doc.current()
    this.dict_setter_show_dialog.ref_setter_modal_welcome_active_page.current(v => !v)
  }

  public updateComponentPref() {
    this.ref_to_modal_pref_updater.current()
  }

  public updateMenuConfigComponent() {
    this.ref_to_menu_config_updater.current()
  }

  /**
   * Reconstruit le classeur du Tableur (si l'onglet est ouvert) en DEBOUNCE. Le rebuild
   * (buildAndApply) dispose+recrée l'unit Univer entier : c'est lourd, et il était appelé
   * directement à chaque update de nœuds/flux -> grosse latence dans la zone de dessin tableur
   * ouvert. Un id de process partagé collapse les rafales d'updates en un seul rebuild.
   * @memberof Class_MenuConfig
   */
  public updateSpreadsheet() {
    if (!this._spreadsheet_is_selection_source) this._spreadsheet_rebuild_needed = true
    this._add_waiting_process(
      'ref_to_spreadsheet',
      (_this: Class_MenuConfig) => {
        if (!_this._spreadsheet_rebuild_needed) return
        _this._spreadsheet_rebuild_needed = false
        _this._ref_to_spreadsheet.current()
      }
    )
  }

  /**
   * os#1387 — LE TABLEUR EST LA SOURCE de ce changement de sélection : ne le reconstruis pas.
   *
   * Sélectionner un élément passe par `updateAllComponentsRelatedToNodes`, donc par
   * `updateSpreadsheet` : c'est bon quand la sélection vient du canevas, c'est absurde quand
   * elle vient d'un clic dans le tableur lui-même — le rebuild dispose et recrée l'unit Univer
   * SOUS les doigts de l'utilisateur, au moment précis où il navigue dans les cellules.
   *
   * Le drapeau ne fait PAS taire le rebuild, il s'abstient seulement de le DEMANDER : si une
   * édition de cellule de la même rafale en a réclamé un (elle, elle a changé des valeurs), le
   * besoin reste marqué et le rebuild a lieu comme avant. C'est ce qui distingue ce garde-fou
   * d'une annulation du process en attente, qui, elle, emporterait le rebuild légitime.
   */
  public withSpreadsheetAsSelectionSource(fn: () => void) {
    const before = this._spreadsheet_is_selection_source
    this._spreadsheet_is_selection_source = true
    try { fn() } finally { this._spreadsheet_is_selection_source = before }
  }

  /** Un rebuild du classeur a été demandé par autre chose que le tableur lui-même. */
  private _spreadsheet_rebuild_needed = false
  /** Vrai le temps d'un geste de pointage venu du tableur (cf. withSpreadsheetAsSelectionSource). */
  private _spreadsheet_is_selection_source = false

  /**
   * Re-render all menus for node config
   * - SankeyNodeEdition
   * - OpenSankeyConfigurationNodesAttributes
   * - OpenSankeyConfigurationNodesTags
   * - MenuConfigurationNodesTooltip
   * @memberof Class_MenuConfig
   */
  public updateAllComponentsRelatedToNodes() {
    this.updateSpreadsheet()
    this.updateComponentRelatedToNodesSelection()
    this.updateAllComponentsRelatedToNodesConfig()
    this.updateComponentRelatedToStyles()
    this.updateInspector() // #1243 — re-résoudre la cible sur changement de sélection
  }

  /**
   * Re-render all submenus for node config
   * - OpenSankeyConfigurationNodesAttributes
   * - OpenSankeyConfigurationNodesTags
   * - MenuConfigurationNodesTooltip
   * @memberof Class_MenuConfig
   */
  public updateAllComponentsRelatedToNodesConfig() {
    this.updateComponentRelatedToApparence()
    this.updateComponentRelatedToNodesTags()
    this.updateComponentRelatedToNodesTooltips()
    this._ref_to_menu_config_nodes_stock_updater.current()
  }

  /**
   * Re-render all menus for link config
   * - SankeyMenuConfigurationLinks
   * - MenuConfigurationLinksData
   * - MenuConfigurationLinksAppearence
   * - MenuConfigurationLinksTags
   * @memberof Class_MenuConfig
   */
  public updateAllComponentsRelatedToLinks() {
    this.updateSpreadsheet()
    this._ref_to_menu_context_links_updater.current()
    this.updateComponentRelatedToLinksSelection()
    this.updateAllComponentsRelatedToLinksConfig()
    this.updateComponentRelatedToStyles()
    this.updateInspector() // #1243 — re-résoudre la cible sur changement de sélection
  }

  public updateAllComponentsRelatedToContainers() {
    this._ref_to_menu_config_container_updater.current()
    this._ref_to_menu_config_containers_selection_updater.current()
    this.updateInspector() // #1243 — re-résoudre la cible sur changement de sélection
  }

  public updateAllComponentsRelatedToContainersStyles() {
    this._ref_to_menu_config_styles_updater.current()
    this.ref_to_menu_config_styles_editor_updater.current()
  }
  /**
   * Re-render all submenus for link config
   * - MenuConfigurationLinksData
   * - MenuConfigurationLinksAppearence
   * - MenuConfigurationLinksTags
   * @memberof Class_MenuConfig
   */
  public updateAllComponentsRelatedToLinksConfig() {
    this.updateComponentRelatedToLinksData()
    this.updateComponentRelatedToApparence()
    this.updateComponentRelatedToStyles()
    this.updateComponentRelatedToLinksTags()
    this.updateComponentRelatedToLinksTooltips()
  }

  public updateAllComponentsRelatedToContainersConfig() {
    // this.updateComponentRelatedToLinksData()
    this.updateComponentRelatedToApparence()
    this.updateComponentRelatedToStyles()
    // this.updateComponentRelatedToLinksTags()
    // this.updateComponentRelatedToLinksTooltips()
  }

  /**
   * Re-render all submenus for tags config
   * - SankeyMenuConfigurationNodes
   * - OpenSankeyConfigurationNodesTags
   * - SankeyMenuConfigurationLinks
   * - OpenSankeyConfigurationLinksTags
   * - OpenSankeyConfigurationLinksData
   * - ToolbarBuilder
   * @memberof Class_MenuConfig
   */
  public updateAllComponentsRelatedToTags() {
    this.updateComponentRelatedToNodesSelection()
    this.updateComponentRelatedToNodesTags()
    this.updateComponentRelatedToLinksSelection()
    this.updateComponentRelatedToLinksTags()
    this.updateComponentRelatedToLinksData()
    this.updateAllComponentsRelatedToToolbar()
    this.updateAllComponentsRelatedToLevelTags()
    this.updateAllComponentsRelatedToDataTags()

  }

  public updateAllComponentsRelatedToLevelTags() {
    this.updateComponentRelatedToNodesDimTags()
    this._ref_to_menu_config_tags_updater['level_taggs'].current()
    this._ref_to_toolbar_level_tag_filter_updater.current()
  }

  public updateAllComponentsRelatedToNodeTags() {
    this._ref_to_nodetag_filter_updater.current()
    this._ref_to_toolbar_node_tag_updater.current()
    this._ref_to_toolbar_level_tag_filter_updater.current()
    this._ref_to_unitarytag_filter_updater.current()
    this.updateComponentRelatedToNodesTags()
    this._ref_to_menu_config_tags_updater['node_taggs'].current()
  }

  public updateAllComponentsRelatedToFluxTags() {
    this._ref_to_nodetag_filter_updater.current()
    this._ref_to_toolbar_link_tag_updater.current()
    this.updateComponentRelatedToLinksTags()
    this._ref_to_menu_config_tags_updater['flux_taggs'].current()
  }

  public updateAllComponentsRelatedToDataTags() {
    this._ref_to_datatag_filter_updater.current()
    this.updateComponentRelatedToLinksData()
    this.updateComponentRelatedToLinksTags()
    this._ref_to_menu_config_tags_updater['data_taggs'].current()
    this._ref_to_drawer_sequence_data_tag_updater.current()
    this._ref_to_toolbar_data_tag_updater.current()
  }

  public updateAllComponentsRelatedToTagsType(type: Type_MacroTagGroup) {
    if (type === 'data_taggs')
      this.updateAllComponentsRelatedToDataTags()
    else if (type === 'flux_taggs')
      this.updateAllComponentsRelatedToFluxTags()
    else if (type === 'node_taggs')
      this.updateAllComponentsRelatedToNodeTags()
    else if (type === 'level_taggs')
      this.updateAllComponentsRelatedToLevelTags()
    else
      this.updateAllComponentsRelatedToLevelTags()
  }

  public updateAllComponentsRelatedToToolbar() {
    this.ref_toolbar.current()
    this._ref_to_toolbar_updater.current()
    this._ref_to_toolbar_link_visual_filter_updater.current()
    this._ref_to_toolbar_node_tag_updater.current()
    this._ref_to_toolbar_link_tag_updater.current()
    this._ref_to_toolbar_data_tag_updater.current()
    this._ref_to_toolbar_level_tag_filter_updater.current()
  }

  public toggle_selector_on_visible_elements() {
    this._host._selector_only_visible_elements = !this._host._selector_only_visible_elements
    this.updateAllComponentsRelatedToNodes()
  }

  /**
   * Update modal Save diagram JSON
   *
   * @memberof Class_MenuConfig
   */
  public updateComponentSaveDiagramJSON() {
    this.ref_to_save_diagram_updater.current()
  }
  /**
   * Update modal Load diagram JSON
   *
   * @memberof Class_MenuConfig
   */
  public updateComponentLoadDiagramJSON() {
    this.ref_to_load_diagram_updater.current()
  }

  /**
   * Function to update ApplyLayoutDialog component,
   * can be overrided in submodule if we add subcomponent to ApplyLayoutDialog
   *
   * @memberof Class_MenuConfig
   */
  public updateComponentApplyLayout() {
    this.ref_to_updater_modal_apply_layout.current()
  }

  // PROTECTED METHODS ==================================================================

  /**
   * Create a timed out process - Used to avoid multiple reloading of components
   *
   * The process_func is meant to be use by setTimeout(),
   * and inside setTimeOut 'this' keyword has another meaning,
   * so the current object must be passed directly as an argument.
   * see : https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#the_this_problem
   *
   * @protected
   * @param {string} process_id
   * @param {(_: Class_MenuConfig) => void} process_func
   * @memberof Class_MenuConfig
   */
  public _add_waiting_process(
    process_id: string,
    process_func: (_: Class_MenuConfig) => void
  ) {
    this._cancel_waiting_process(process_id)
    this._waiting_processes[process_id] = setTimeout(
      (_this) => { process_func(_this) },
      this._waiting_time_for_processes,
      this
    )
  }
  private _ref_to_drawer_sequence_data_tag_updater: MutableRefObject<(() => void)>
  /**
   * Launch datatagg sequence, it go through each tag of a group and draw sankey
   *
   * @param {Class_DataTagGroup} tagg
   * @memberof Class_MenuConfigOSP
   */
  public launchDataSequence(tagg: Class_DataTagGroup) {
    const curr_tag = tagg.first_selected_tags as Class_DataTag | undefined
    const tagg_list = tagg.tags_list

    if (curr_tag && this._is_playing_sequence && tagg_list.length > 1) {
      const idx_curr_tag = tagg_list.indexOf(curr_tag)

      if (idx_curr_tag < tagg_list.length - 1) {
        // Draw sankey with next tag selected
        const next_tag = tagg_list[idx_curr_tag + 1]
        tagg.selectTagsFromId(next_tag.id)
        // Lauch timeout to recursively call launchDataSequence
        setTimeout(() => {
          this.updateAllComponentsRelatedToDataTags()
          this.launchDataSequence(tagg)
        }, this._timeout_sequence)

      }
      //If we are at the last tag of the group & loop sequence is at true then select first tag of the group
      else if (this._is_sequence_loop && idx_curr_tag == tagg_list.length - 1) {
        // Draw sankey with first tag of the group
        const first_tag = tagg_list[0]
        tagg.selectTagsFromId(first_tag.id)
        // Lauch timeout to recursively call launchDataSequence
        setTimeout(() => {
          this.updateAllComponentsRelatedToDataTags()
          this.launchDataSequence(tagg)
        }, this._timeout_sequence)
      } else {//get here when there is no next tag
        this._is_playing_sequence = false
        this.updateAllComponentsRelatedToDataTags()
      }
    } else {//get here when there curr_tag is undefined wich can be an error or we stop the sequence
      this._is_playing_sequence = false
      this.updateAllComponentsRelatedToDataTags()
    }
  }

  /**
   * Cancel a timed out process - It wont happen
   * @protected
   * @param {string} process_id
   * @memberof Class_MenuConfig
   */
  protected _cancel_waiting_process(process_id: string) {
    if (this._waiting_processes[process_id] !== undefined)
      clearTimeout(this._waiting_processes[process_id])
  }

  public updateComponentRelatedToApparence() {
    this._ref_to_menu_config_apparence_updater.current()
  }

  //Var used for the dataTagg sequence component
  private _is_playing_sequence: boolean = false
  private _is_sequence_loop: boolean = false

  public get ref_to_drawer_sequence_data_tag_updater(): MutableRefObject<(() => void)> { return this._ref_to_drawer_sequence_data_tag_updater }

  public get is_playing_sequence(): boolean { return this._is_playing_sequence }
  public set is_playing_sequence(b: boolean) { this._is_playing_sequence = b }

  public get is_sequence_loop(): boolean { return this._is_sequence_loop }
  public set is_sequence_loop(value: boolean) { this._is_sequence_loop = value }

  public get timeout_sequence(): number { return this._timeout_sequence }
  public set timeout_sequence(value: number) { this._timeout_sequence = value }

  // os#1385 — les refs ci-dessous marquées « hôte » rendent l'objet de l'ESPACE DE TRAVAIL :
  // un document secondaire repeint la même barre du haut, les mêmes dialogues.
  public get ref_rerender_submodules_menus() {
    return this._host._ref_rerender_submodules_menus
  }
  public get ref_to_menu_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_updater
  }

  public get ref_to_submenu_updater(): MutableRefObject<() => void> {
    return this._host._ref_to_submenu_updater
  }

  public get ref_to_spreadsheet(): MutableRefObject<(() => void)> {
    return this._ref_to_spreadsheet
  }

  public get ref_to_doc(): MutableRefObject<(() => void)> {
    return this._ref_to_doc
  }

  public get ref_menu_opened(): MutableRefObject<[boolean, (b: boolean) => void]> {
    return this._host._ref_menu_opened
  }

  public get ref_to_splashscreen_updater(): MutableRefObject<() => void> {
    return this._host._ref_to_splashscreen_updater
  }

  public get never_see_again(): MutableRefObject<boolean> {
    return this._host._never_see_again
  }

  public get show_splashscreen(): boolean {
    return this._host._show_splashscreen
  }

  public set show_splashscreen(_: boolean) {
    this._host._show_splashscreen = _
    this.ref_to_splashscreen_updater?.current()
    this._ref_to_toolbar_updater?.current()
    this.ref_to_submenu_updater?.current()
    this._ref_to_menu_updater?.current()
  }

  // Top menu components ----------------------------------------------------------------

  public init_refs_to_btn_toogle_top_menus(id: string) {
    this._host._refs_to_btn_toogle_top_menus[id] = { current: null }
  }

  public get refs_to_btn_toogle_top_menus(): { [id: string]: RefObject<HTMLButtonElement> } {
    return this._host._refs_to_btn_toogle_top_menus
  }


  public get ref_to_menu_config_updater(): MutableRefObject<() => void> {
    return this._host._ref_to_menu_config_updater
  }

  // #1243 — Slot de re-render de l'inspecteur piloté par la sélection.
  public get ref_to_inspector_updater(): MutableRefObject<() => void> {
    return this._ref_to_inspector_updater
  }

  /**
   * #1255 — Onglet que l'inspecteur doit tenir ouvert, demandé par la visite guidée (l'onglet
   * actif est un état local d'InspectorPanel, inatteignable depuis le modèle).
   *
   * C'est une demande PERSISTANTE, pas une commande ponctuelle : l'inspecteur réinitialise son
   * onglet à chaque changement de composition de sélection, et le tour sélectionne justement un
   * élément avant de demander son onglet — une commande ponctuelle serait écrasée par cette
   * réinitialisation. Tant que la demande est posée, elle l'emporte ; un clic de l'utilisateur sur
   * un onglet la lève (il reprend la main), tout comme la fin de l'étape ou du tour.
   */
  private _inspector_requested_tab_id: string | null = null
  public get inspector_requested_tab_id(): string | null {
    return this._host._inspector_requested_tab_id
  }
  public set inspector_requested_tab_id(_: string | null) {
    this._host._inspector_requested_tab_id = _
  }

  // #1243 — Déclenche un re-render de l'inspecteur (résolution de cible). Appelé
  // sur chaque changement de composition de sélection. Debouncé comme les autres
  // updaters pour absorber les rafales (sélection au lasso, add/remove multiples).
  public updateInspector() {
    // os#1394 — LA SÉLECTION REPREND LA MAIN sur l'inspecteur. Le drapeau est posé ici et non
    // dans le processus différé : il doit valoir dès le geste, pas un tour de boucle plus tard,
    // sans quoi un clic sur une fenêtre juste après une sélection serait jugé dans le désordre.
    //
    // os#1431 — SAUF QUAND ON TRAVAILLE DANS UNE FIGURE (retour de Julien, 19/09 : « je clique sur
    // le nœud central, l'interface du diagramme apparaît, puis celle de la figure apparaît et
    // redisparaît »). Depuis qu'une étoile EST un Sankey (os#1422), cliquer dedans SÉLECTIONNE :
    // deux gestes écrivaient donc ce drapeau en sens contraire — « tu touches une figure » puis,
    // un tour de boucle plus tard, « une sélection a changé » —, d'où le clignotement.
    //
    // La fenêtre ACTIVE tranche, comme partout ailleurs dans le panneau et la colonne d'outils :
    // tant qu'elle montre une figure d'élément, l'inspecteur parle de cette figure. Une sélection
    // qui bouge dans le diagramme passe, elle, par un clic dans sa fenêtre — qui la rend active
    // avant que la sélection ne notifie (cf. la capture posée sur les fenêtres hébergées).
    const active = this._host._main_zone_active_id !== null
      ? this._host._main_zone_occupants.find(o => o.id === this._host._main_zone_active_id)
      : undefined
    if (!active || active.subject.kind === 'diagram') this._host._inspector_focus = 'selection'
    this._add_waiting_process(
      'updateInspector',
      (_this: Class_MenuConfig) => {
        _this._ref_to_inspector_updater.current()
        // Multi-abonnés (bus #248) : tout composant qui suit la sélection sans
        // posséder de slot (ex. récapitulatif de l'outil de sélection).
        _this._event_bus.notify(SELECTION_TOPIC)
      }
    )
  }

  public get ref_universal_converter_set_config() {
    return this._host._ref_universal_converter_set_config
  }

  // Layout  menus ----------------------------------------------------------------------

  public get ref_to_menu_config_layout_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_layout_updater
  }

  public get ref_to_menu_contextual_config_layout_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_contextual_config_layout_updater
  }

  public get ref_to_config_DA_bg_image_updater(): MutableRefObject<() => void> {
    return this._ref_to_config_DA_bg_image_updater
  }

  public get ref_to_menu_context_drawing_area_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_context_drawing_area_updater
  }

  // Nodes menus ------------------------------------------------------------------------

  public get ref_to_menu_config_nodes_selection_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_selection_updater
  }

  public get ref_to_menu_config_nodes_stock_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_stock_updater
  }

  public get ref_to_menu_config_nodes_dim_selection_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_dim_selection_updater
  }

  public get ref_to_menu_config_apparence_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_apparence_updater
  }
  public get ref_to_menu_config_styles_editor_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_styles_editor_updater
  }
  public get ref_to_menu_config_nodes_tags_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_tags_updater
  }

  public get ref_to_menu_config_nodes_dim_tags_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_dim_tags_updater
  }

  public get ref_to_menu_config_nodes_tooltips_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_config_nodes_tooltips_updater
  }

  // Nodes context menu -----------------------------------------------------------------

  public get ref_to_menu_context_nodes_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_context_nodes_updater
  }

  public get ref_to_updater_node_disagregate(): MutableRefObject<(b: boolean) => void> {
    return this._ref_to_updater_node_disagregate
  }

  public get ref_to_updater_node_agregate(): MutableRefObject<(b: boolean) => void> {
    return this._ref_to_updater_node_agregate
  }

  // Links menus ------------------------------------------------------------------------

  public get ref_to_menu_config_links_selection_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_selection_updater
  }

  public get ref_to_menu_config_containers_selection_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_containers_selection_updater

  }
  public get ref_to_menu_config_links_data_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_data_updater
  }

  public get ref_to_menu_contextual_config_links_data_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_contextual_config_links_data_updater
  }

  public get ref_to_menu_config_styles_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_styles_updater
  }

  public get ref_to_menu_config_links_tags_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_tags_updater
  }

  public get ref_to_menu_config_links_tooltips_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_config_links_tooltips_updater
  }

  // Link context menu

  public get ref_to_menu_context_links_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_context_links_updater
  }

  // Tags menus -------------------------------------------------------------------------

  public get ref_to_menu_config_tags_updater(): { [_: string]: MutableRefObject<() => void> } {
    return this._ref_to_menu_config_tags_updater
  }

  // Toolbar -----------------------------------------------------------------------------

  public get ref_to_save_in_cache_indicator(): MutableRefObject<(b: boolean) => void> {
    return this._ref_to_save_in_cache_indicator
  }

  public get ref_to_save_in_cache_indicator_value(): MutableRefObject<boolean> {
    return this._ref_to_save_in_cache_indicator_value
  }

  public get ref_to_last_download_updater(): MutableRefObject<() => void> {
    return this._ref_to_last_download_updater
  }

  public get ref_to_never_save_view_session(): MutableRefObject<(b: boolean) => void> {
    return this._ref_to_never_save_view_session
  }

  public get ref_to_never_save_view_session_value(): MutableRefObject<boolean> {
    return this._ref_to_never_save_view_session_value
  }

  public get ref_to_toolbar_updater(): MutableRefObject<() => void> {
    return this._ref_to_toolbar_updater
  }

  public get ref_to_nodetag_filter_updater(): MutableRefObject<() => void> {
    return this._ref_to_nodetag_filter_updater
  }

  // public get ref_to_fluxtag_filter_updater(): MutableRefObject<() => void> {
  //   return this._ref_to_fluxtag_filter_updater
  // }

  public get ref_to_datatag_filter_updater(): MutableRefObject<() => void> {
    return this._ref_to_datatag_filter_updater
  }

  // Getter dict of ref setter show dialog
  public get dict_setter_show_dialog(): IType_DictHookRefSetterShowDialogComponents {
    return this._host._dict_setter_show_dialog
  }

  public get ref_selected_style(): MutableRefObject<string> {
    return this._ref_selected_style
  }

  // AJUSTEMENT #5 — contenant dont l'auteur arrange la disposition dans le
  // composeur. État d'ÉDITION (jamais enregistré : ce n'est pas une propriété du
  // document, seulement l'onglet où l'auteur travaille en ce moment), tenu ici
  // plutôt qu'en `useState` local pour survivre aux re-rendus de l'inspecteur —
  // qui se remonte à chaque changement de sélection.
  protected _presentation_composer_mode: Type_PanelMode = 'tooltip'
  public get presentation_composer_mode(): Type_PanelMode {
    return this._host._presentation_composer_mode
  }
  public set presentation_composer_mode(mode: Type_PanelMode) {
    this._host._presentation_composer_mode = mode
    this.updateInspector()
  }


  public get ref_to_save_diagram_updater(): MutableRefObject<() => void> {
    return this._host._ref_to_save_diagram_updater
  }
  public get ref_to_load_diagram_updater(): MutableRefObject<() => void> {
    return this._host._ref_to_load_diagram_updater
  }

  // Getter ref updater ApplyLayoutDialog OS component
  public get ref_to_updater_modal_apply_layout(): MutableRefObject<() => void> {
    return this._host._ref_to_updater_modal_apply_layout
  }

  public get ref_to_modal_pref_updater() {
    return this._host._ref_to_modal_pref_updater
  }

  public get ref_to_toolbar_bottom_updater(): MutableRefObject<() => void> {
    return this._ref_to_toolbar_bottom_updater
  }

  // OS#85 — onglets de feuilles (bas de la grande zone).
  public get ref_to_sheet_tabs_updater(): MutableRefObject<() => void> {
    return this._ref_to_sheet_tabs_updater
  }

  /** OS#85 — la barre des feuilles est-elle dépliée ? */
  public get sheet_tabs_visible(): boolean { return this._host._sheet_tabs_visible }
  /** Replie / déplie la barre des feuilles. Le recadrage du dessin (la barre du bas change
   *  de hauteur) est déclenché par la barre elle-même, une fois le DOM à jour — la hauteur
   *  réservée est LUE dans le DOM (DrawingArea.getBottomBarHeight). */
  public toggleSheetTabs(): void {
    // Le PLI est de l'espace de travail (une seule barre à l'écran) ; l'updater qui la
    // repeint est du document — ce sont ses feuilles qu'elle liste.
    this._host._sheet_tabs_visible = !this._host._sheet_tabs_visible
    this._ref_to_sheet_tabs_updater.current()
  }

  public get ref_to_menu_config_node_icon_updater() { return this._ref_to_menu_config_node_icon_updater }

  /**
   * os#1472 — CES TROIS REFS SONT DES MEMBRES D HOTE, et elles ne l etaient pas.
   *
   * Elles branchent une MODALE UNIQUE de l espace de travail — le catalogue d icones, l editeur de
   * contenu, l editeur de texte riche — a ce qu elle doit editer. La modale est montee une fois,
   * par le document hote : elle enregistre donc son  ref sur LA configuration de l hote.
   *
   * Lues sans passer par l hote, elles rendaient le ref du document COURANT. Or l inspecteur parle
   * du document ACTIF, et depuis os#1446 ce peut etre un document de FIGURE — celui qui porte les
   * parts. Sa ref a lui n avait jamais ete branchee : elle vaut `() => null`.
   *
   * Le symptome, vu par Julien trois fois : « l icone ne marche toujours pas ». La modale s ouvrait
   * (son ouverture, elle, est deja deleguee a l hote par `dict_setter_show_dialog`), on y
   * choisissait un pictogramme, et rien ne se passait — le catalogue avait recu une liste VIDE
   * d elements a modifier, donc il ecrivait dans un objet jetable.
   *
   * C est la meme regle que pour les dialogues : ce qui est unique a l ecran vit sur l hote.
   */
  public get r_editor_content_set_elements() { return this._host._r_editor_content_set_elements }
  public get r_rich_text_editor_refresh() { return this._host._r_rich_text_editor_refresh }
  public get icon_selector_set_elements() { return this._host._icon_selector_set_elements }

  public get ref_to_menu_config_node_name_label_bg_updater(): MutableRefObject<(() => void)> { return this._ref_to_menu_config_node_name_label_bg_updater }

  public get ref_to_menu_config_link_scientific_precision_updater(): MutableRefObject<(() => void)> { return this._ref_to_menu_config_link_scientific_precision_updater }

  public get ref_to_menu_config_containers_updater(): MutableRefObject<(() => void)> { return this._ref_to_menu_config_container_updater }
  public get ref_to_menu_context_container_updater() { return this._ref_to_menu_context_container_updater }

  public get r_setter_editor_content_fo_node(): MutableRefObject<Dispatch<SetStateAction<string>> | undefined> { return this._r_setter_editor_content_fo_node }
  public get r_value_formatting_set_elements() { return this._r_value_formatting_set_elements }

  public get r_value_type_set_elements() { return this._r_value_type_set_elements }

  public get ref_close_filter_drawer(): MutableRefObject<((_: boolean) => void)> { return this._host._ref_close_filter_drawer }
  public get ref_toggle_filter_drawer(): MutableRefObject<(() => void)> { return this._host._ref_toggle_filter_drawer }
  public get ref_toggle_search(): MutableRefObject<(() => void)> { return this._host._ref_toggle_search }
  public get ref_toolbar(): MutableRefObject<(() => void)> { return this._host._ref_toolbar }
  public get ref_to_toolbar_node_tag_updater(): MutableRefObject<(() => void)> { return this._ref_to_toolbar_node_tag_updater }
  public get ref_to_toolbar_link_tag_updater(): MutableRefObject<(() => void)> { return this._ref_to_toolbar_link_tag_updater }
  public get ref_to_toolbar_data_tag_updater(): MutableRefObject<(() => void)> { return this._ref_to_toolbar_data_tag_updater }
  public get ref_to_toolbar_level_tag_filter_updater(): MutableRefObject<() => void> { return this._ref_to_toolbar_level_tag_filter_updater }
  public get ref_to_unitarytag_filter_updater(): MutableRefObject<() => void> { return this._ref_to_unitarytag_filter_updater }

  public get ref_to_toolbar_link_visual_filter_updater(): MutableRefObject<(() => void)> { return this._ref_to_toolbar_link_visual_filter_updater }

  /**
   * Order of buttons in top menu
   *
   * @memberof Class_MenuConfig
   */
  public get menu_top_order(): string[][] {
    return this._menu_top_order
  }

  public get spreadsheet_freeze() { return this._spreadsheet_freeze }
  public set spreadsheet_freeze(_) { this._spreadsheet_freeze = _ }

  public get spreadsheet_placement_mode() { return this._spreadsheet_placement_mode }
  public set spreadsheet_placement_mode(_: 'auto' | 'none' | 'increment') { this._spreadsheet_placement_mode = _ }

  public get spreadsheet_matrix_mode() { return this._spreadsheet_matrix_mode }
  public set spreadsheet_matrix_mode(_: 'cross' | 'value') { this._spreadsheet_matrix_mode = _ }

  // #1243 — accesseurs de la matrice (type_menu_configuration_selected,
  // style_config, elements_configurable_selected) supprimés avec elle.
  public get flow_color_origin_type(): string[] { return this._flow_color_origin_type }
  public get shape_type(): string[] { return this._shape_type }

  public get additionalMenus() { return this._host._additionalMenus }

  /* ========================================
  Updater of component for containers related menus
  ========================================*/
  private _ref_to_menu_config_container_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_context_container_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_config_node_name_label_bg_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_config_link_scientific_precision_updater: MutableRefObject<(() => void)>

  // Updater of config node icon
  private _ref_to_menu_config_node_icon_updater: MutableRefObject<(() => void)>

  // config ref related to node FO elements
  private _r_setter_editor_content_fo_node: MutableRefObject<Dispatch<SetStateAction<string>> | undefined>
  protected _r_editor_content_set_elements: MutableRefObject<((
    _: Class_NodeBase[] | Class_LinkElement[],
    prefix: 'name_label' | 'value_label' | 'icon'
  ) => void)>
  protected _r_rich_text_editor_refresh: MutableRefObject<() => void>
  protected _icon_selector_set_elements: MutableRefObject<((
    _: Class_NodeBase[] | Class_LinkElement[],
    prefix: 'name_label' | 'value_label' | 'icon'
  ) => void)>
  private _r_value_formatting_set_elements: MutableRefObject<(
    elements: Class_NodeBase[] | Class_ElementStyle[] | Class_LinkElement[],
    attributePath: string
  ) => void>

  private _r_value_type_set_elements: MutableRefObject<(
    _selected_links: Class_LinkElement[],
    _unit_data_tagg: Class_DataTagGroup,
    _refreshThis: () => void
  ) => void>

  public updateComponentRelatedToContainers() {
    this._ref_to_menu_config_container_updater.current()
    this._ref_to_menu_context_container_updater.current()
  }

}

