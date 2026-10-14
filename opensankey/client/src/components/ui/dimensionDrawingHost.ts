// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1511 — COMMENT UNE DIMENSION SE DESSINE, réglable depuis son bouton de la barre du haut.
//
// Julien, 30/09 : « dans ce bouton de la topbar, il faut ajouter les options par bandes ou par
// nœud, avec des sous-menus », puis « et aussi les options de désagrégation pour les nœuds ».
//
// Trois dessins, les mêmes que la liste de l'éditeur de groupe d'OS+ (« un membre à la fois »,
// « plusieurs, en bandes », « plusieurs, en nœuds ») : la bannière dit un membre ou plusieurs en
// bandes, et « en nœuds » n'est pas une bannière — ce sont les NŒUDS qui portent la dimension
// (`driving_dimension`), plusieurs possibles le long d'une chaîne (« suivre orge tout le long »).
// La désagrégation en nœuds se règle donc en cochant ces nœuds.
//
// Même discipline que `positionModeHost` : les gestes vivent ici, sans Chakra, pour rester
// testables ; les classes ne sont prises qu'en `import type`, et la marque des nœuds engendrés vient
// d'un module sans dépendance. Chaque geste s'annule.

import type { Class_ApplicationData } from '../../types/ApplicationData'
import type { Class_DataTagGroup, Type_DimensionDrawing } from '../../types/TagGroup'
import type { Class_DataTag, Type_MemberManualPositions } from '../../types/Tag'
import type { Class_NodeElement } from '../../Elements/Node'
import type { Type_DisaggregationGap } from '../../types/Utils'
import type { Type_MembersOrder } from '../../Algorithms/DimensionMemberOrder'
import { isGeneratedMemberId } from '../../Elements/GeneratedMemberMark'
import { withValueTreeAnswers } from '../../Elements/LinkValues'
import { nodeTransformsDimension } from '../../Algorithms/DimensionTransform'
import { expansionSideOf } from '../../Algorithms/DimensionExpansion'
import {
  diagramExpansion, diagramReaderLevel, diagramReaderPick, diagramReaderSeveral, diagramReaderSubDistinguish,
  diagramReaderSubPick, diagramReaderToggle, fromDiagram, isEmptyDiagramPatch, readerBlockerOf, readerRootsOf, swapInOrder,
  toDiagramPatch
} from '../../Representations/dimensionViewState'
import type { Type_DiagramPatch, Type_DimensionViewState, Type_ViewSankey } from '../../Representations/dimensionViewState'

export type { Type_DimensionDrawing } from '../../types/TagGroup'

/**
 * Les nœuds RÉGLÉS pour porter la dimension — ceux que l'éditeur coche, sans ceux qu'un diagramme
 * par membre y ajoute (cf. `Node.driving_dimension`).
 */
export const dimensionCarriersOf = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup): Class_NodeElement[] =>
  (app_data.drawing_area.sankey.nodes_list as Class_NodeElement[]).filter(node => node.own_driving_dimension === tagg)

/** Les nœuds qui peuvent la porter : tous, sauf ceux qu'une désagrégation a engendrés. */
export const dimensionCarrierCandidates = (app_data: Class_ApplicationData): Class_NodeElement[] =>
  (app_data.drawing_area.sankey.nodes_list as Class_NodeElement[]).filter(node => !isGeneratedMemberId(node.id))

/** Le dessin de la dimension, tel que le lecteur le voit : la dimension le décide (`drawing`). */
export const dimensionDrawingOf = (_app_data: Class_ApplicationData, tagg: Class_DataTagGroup): Type_DimensionDrawing =>
  tagg.drawing

/**
 * os#1511 — LES POSITIONS MANUELLES des nœuds engendrés d'une dimension (cf.
 * `Class_DataTag.positionOn`). Un nœud engendré déplacé à la main reste où on l'a posé, quel que
 * soit le placement ; choisir un placement ou un écart dans « Placer », c'est donc demander le
 * placement AUTOMATIQUE : ces gestes effacent les positions manuelles de la dimension, dans le
 * même pas d'historique — l'annulation les rend.
 */
type Type_ManualPositions = [Class_DataTag, Type_MemberManualPositions][]

const manualPositionsOf = (dimensions: Class_DataTagGroup[]): Type_ManualPositions =>
  dimensions.flatMap(tagg => (tagg.tags_list as Class_DataTag[])
    .filter(membre => membre.has_manual_position)
    .map(membre => [membre, membre.manual_positions] as [Class_DataTag, Type_MemberManualPositions]))

/** `undefined` : effacer (placement automatique) ; sinon, rendre l'état relevé. */
const setManualPositions = (dimensions: Class_DataTagGroup[], state: Type_ManualPositions | undefined) => {
  if (state === undefined) {
    dimensions.forEach(tagg => (tagg.tags_list as Class_DataTag[]).forEach(membre => membre.clearManualPositions()))
    return
  }
  state.forEach(([membre, positions]) => membre.restoreManualPositions(positions))
}

/** Les dimensions que des nœuds portent : celles qu'un réglage global d'écart replace. */
const dimensionsDrawnAsNodes = (app_data: Class_ApplicationData): Class_DataTagGroup[] => [...new Set(
  (app_data.drawing_area.sankey.nodes_list as Class_NodeElement[])
    .map(node => node.driving_dimension)
    .filter((tagg): tagg is Class_DataTagGroup => tagg !== undefined))]

type Type_Snapshot = {
  banner: string, carriers: string[], selected: string[], bands: boolean | undefined, focus: string[], hidden: string[],
  parked: string[]
}

const snapshot = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup): Type_Snapshot => ({
  banner: (tagg as unknown as { banner: string }).banner,
  carriers: dimensionCarriersOf(app_data, tagg).map(node => node.id),
  selected: tagg.selected_tags_list.map(tag => tag.id),
  bands: tagg.member_bands,
  focus: tagg.stored_focus_ids,
  hidden: tagg.stored_hidden_ids,
  parked: tagg.parked_carrier_ids
})

/**
 * Pose une coupe. Hiérarchisée : `selectMembers` (le niveau courant se déduit des membres, cf.
 * `Class_DataTagGroup.current_level_index` : rien d'autre à restaurer). Plate : la
 * sélection ordinaire, qui impose au passage le mode d'affichage de la dimension (#370) et ne
 * s'inscrit pas dans l'historique — c'est le geste qui s'y inscrit, une fois.
 */
const poseSelection = (tagg: Class_DataTagGroup, selected: string[]) => {
  if (selected.length === 0) return
  if (tagg.is_hierarchical) tagg.selectMembers(selected)
  else tagg.selectTagsFromIds(selected)
}

/** Pose les états de une ou plusieurs dimensions, puis UN redécoupage et UN dessin. */
const restoreAll = (app_data: Class_ApplicationData, states: [Class_DataTagGroup, Type_Snapshot][]) => {
  const { drawing_area } = app_data
  // Les porteurs d'abord détachés, puis rattachés : un nœud ne porte qu'une dimension, et un échange
  // (⇅) en fait passer d'une dimension à l'autre.
  states.forEach(([tagg, state]) => {
    ;(tagg as unknown as { banner: string }).banner = state.banner
    tagg.member_bands = state.bands
    tagg.focus_ids = state.focus
    tagg.hidden_ids = state.hidden
    tagg.parked_carrier_ids = state.parked
    dimensionCarrierCandidates(app_data).forEach(node => {
      if (!state.carriers.includes(node.id) && node.driving_dimension === tagg) node.setDrivingDimensionId(undefined)
    })
  })
  states.forEach(([tagg, state]) => {
    dimensionCarrierCandidates(app_data).forEach(node => {
      if (state.carriers.includes(node.id) && node.driving_dimension !== tagg) node.driving_dimension = tagg
    })
  })
  // Un aperçu (menu unitaire) a pu laisser `bypass_redraws` posé : le dessin final doit passer.
  drawing_area.bypass_redraws = false
  drawing_area.withBypassRedraws(() => states.forEach(([tagg, state]) => poseSelection(tagg, state.selected)), false)
  // os#1511 — UNE portée de mémoire pour le rebâti ET le dessin qui le suit : les valeurs des bandes
  // des flux d'origine, calculées au rebâti, servent encore au dessin (cf. `withValueTreeAnswers`).
  withValueTreeAnswers(() => {
    drawing_area.rebuildDimensionNodes()
    drawing_area.draw()
  })
  app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
  app_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
}

const restore = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, state: Type_Snapshot) =>
  restoreAll(app_data, [[tagg, state]])

/** Une bannière à choix unique ne lit qu'un membre. */
const UNIQUE_BANNERS = ['one', 'topbar', 'sequence']

/**
 * La bannière `banner` ferait-elle lire UN SEUL membre de `tagg` ? Oui pour « un membre », même sur
 * une dimension hiérarchisée depuis le 08/10 (Julien : « la sélection des filières doit se faire
 * comme Unité ou Année, par un sélecteur simple »).
 */
const readsOneMember = (_tagg: Class_DataTagGroup, banner: string) => UNIQUE_BANNERS.includes(banner)

/** Le placement des nœuds engendrés d'une dimension : il appartient au dessin « en nœuds ». */
type Type_NodesPlacement = { member_bands: boolean | undefined, reference_node_id: string | undefined }

const nodesPlacementOf = (tagg: Class_DataTagGroup): Type_NodesPlacement =>
  ({ member_bands: tagg.member_bands, reference_node_id: tagg.reference_node_id })

const setNodesPlacement = (tagg: Class_DataTagGroup, placement: Type_NodesPlacement) => {
  tagg.member_bands = placement.member_bands
  tagg.reference_node_id = placement.reference_node_id
}

// ── 11/10/2026 — LA PORTE DU MODÈLE COMMUN ──────────────────────────────────────────────────────────

const viewSankeyOf = (app_data: Class_ApplicationData): Type_ViewSankey =>
  app_data.drawing_area.sankey as unknown as Type_ViewSankey

/**
 * 11/10/2026 (os#1511) — POSER UN PATCH DU MODÈLE COMMUN (`toDiagramPatch`) : LA PORTE par laquelle
 * le tableau du diagramme, ⇅ et les commandes du lecteur écrivent. Les dimensions touchées prennent
 * leur nouvel état (bannière, porteurs, sélection, portée, décochés, placement des nœuds, expansion),
 * les lignes leur nouvel ordre, les positions manuelles s'effacent là où le patch demande le placement
 * automatique ; puis UN redécoupage et UN dessin. Un seul pas d'historique, l'annulation rend tout.
 * Un patch vide n'écrit rien.
 */
export const applyDiagramPatch = (app_data: Class_ApplicationData, patch: Type_DiagramPatch) => {
  if (isEmptyDiagramPatch(patch)) return
  const sankey = app_data.drawing_area.sankey
  const taggs = Object.keys(patch.dims)
    .map(id => sankey.data_taggs_dict[id] as unknown as Class_DataTagGroup | undefined)
    .filter((t): t is Class_DataTagGroup => t !== undefined)
  const before = taggs.map(t => [t, snapshot(app_data, t)] as [Class_DataTagGroup, Type_Snapshot])
  const after = before.map(([t, s]) => {
    const p = patch.dims[t.id]
    return [t, {
      banner: p.banner ?? s.banner,
      carriers: p.carriers ?? s.carriers,
      selected: p.selected ?? s.selected,
      bands: 'member_bands' in p ? p.member_bands : s.bands,
      focus: p.focus ?? s.focus,
      hidden: p.hidden ?? s.hidden,
      parked: p.parked ?? s.parked
    }] as [Class_DataTagGroup, Type_Snapshot]
  })
  const placements = taggs.map(t => [t, nodesPlacementOf(t), t.nodes_expansion] as [Class_DataTagGroup, Type_NodesPlacement, boolean])
  const auto = taggs.filter(t => patch.dims[t.id].auto_place === true)
  const positions_before = manualPositionsOf(auto)
  const order_before = [...sankey.getTagGroupsOrder('data_taggs')]
  app_data.history.saveUndo(() => {
    placements.forEach(([t, placement, expansion]) => {
      setNodesPlacement(t, placement)
      if (t.nodes_expansion !== expansion) t.nodes_expansion = expansion
    })
    setManualPositions(auto, positions_before)
    if (patch.order !== undefined) sankey.setTagGroupsOrder('data_taggs', [...order_before])
    restoreAll(app_data, before)
  })
  const redo = () => {
    if (patch.order !== undefined) sankey.setTagGroupsOrder('data_taggs', [...patch.order])
    taggs.forEach(t => {
      const p = patch.dims[t.id]
      if ('member_bands' in p) t.member_bands = p.member_bands
      if ('reference_node_id' in p) t.reference_node_id = p.reference_node_id
      if (p.expansion !== undefined) t.nodes_expansion = p.expansion
    })
    setManualPositions(auto, undefined)
    restoreAll(app_data, after)
  }
  app_data.history.saveRedo(redo)
  redo()
}

/** Un geste du modèle commun sur le diagramme : l'état lu, transformé, écrit par `applyDiagramPatch`. */
export const applyDiagramGesture = (
  app_data: Class_ApplicationData,
  gesture: (state: Type_DimensionViewState, sankey: Type_ViewSankey) => Type_DimensionViewState
) => {
  const sankey = viewSankeyOf(app_data)
  applyDiagramPatch(app_data, toDiagramPatch(gesture(fromDiagram(sankey), sankey), sankey))
}

/**
 * os#1526 — ⇅ DANS LE TABLEAU DU DIAGRAMME (Julien, 06/10 : « si l'une est en bandes et l'autre en
 * nœuds, on inverse avec la double flèche »). 11/10/2026 — c'est L'ORDRE DU MODÈLE COMMUN
 * (`swapInOrder`) : sur le diagramme, le dessin est attaché à la place, les deux dimensions échangent
 * donc TOUT leur dessin (bannière et porteurs, placement des nœuds, placement automatique de celle qui
 * arrive sur des porteurs — « [SOCLE] Pays partenaires » : les filières n'y restent pas empilées à
 * x = 955) et leurs LIGNES (Julien, 08/10 : la ligne suit son dessin). Celle qui prend les nœuds garde
 * sa bannière et TOUS ses membres. Un seul pas d'historique, un seul dessin.
 */
export const swapDimensionDrawings = (
  app_data: Class_ApplicationData, a: Class_DataTagGroup, b: Class_DataTagGroup
) => {
  if (a === b) return
  applyDiagramGesture(app_data, (state, sankey) => swapInOrder(state, sankey, a.id, b.id))
}

/** Pose un état et l'inscrit dans l'historique, avec l'état d'avant pour l'annuler. */
const commit = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, next: Type_Snapshot) => {
  const before = snapshot(app_data, tagg)
  app_data.history.saveUndo(() => restore(app_data, tagg, before))
  app_data.history.saveRedo(() => restore(app_data, tagg, next))
  restore(app_data, tagg, next)
}

/**
 * os#1511 — COUPER UNE DIMENSION : les membres dessinés deviennent `ids`. LE geste de coupe, que
 * tous les sélecteurs appellent (barre du haut, panneau, clic droit, couronne) : la sélection,
 * les nœuds d'axe redécoupés, le dessin, les menus — et l'annulation.
 *
 * L'ordre des `ids` est indifférent : `selectMembers` écarte l'ancêtre d'un membre demandé et
 * déduit le niveau du plus profond, quel que soit l'ordre (le « membre cliqué en tête » que les
 * sélecteurs recopiaient ne changeait plus rien).
 *
 * `multi` : une figure montre toujours plusieurs membres ; une dimension en choix unique qu'aucun
 * nœud ne porte passe alors en choix multiple, dans le même pas d'historique.
 */
export const applyDimensionCut = (
  app_data: Class_ApplicationData, tagg: Class_DataTagGroup, ids: string[], options: { multi?: boolean, focus?: string[] } = {}
) => {
  if (ids.length === 0) return
  const now = snapshot(app_data, tagg)
  const banner = options.multi && now.carriers.length === 0 ? 'multi' : now.banner
  // 07/10/2026 — la PORTÉE du diagramme (zoom partagé) : celle que le geste dit (`focus`), sinon elle
  // reste tant que la nouvelle sélection y tient, et tombe sinon — dans le même pas d'historique.
  const focus = options.focus ?? (focusHolds(tagg, now.focus, ids) ? now.focus : [])
  commit(app_data, tagg, { ...now, banner, selected: ids, focus, hidden: hiddenKept(tagg, now.hidden, ids) })
}

/**
 * 07/10/2026 — LES DÉCOCHÉS QUI RESTENT après une nouvelle sélection : ceux qui ne sont pas choisis
 * et dont un frère l'est (ils gardent leur ligne parmi les montrés) ; les autres tombent.
 */
const hiddenKept = (tagg: Class_DataTagGroup, hidden: string[], ids: string[]): string[] => {
  const chosen = ids.map(id => tagg.tags_dict[id] as Class_DataTag | undefined).filter((m): m is Class_DataTag => m !== undefined)
  return hidden.filter(h => {
    const m = tagg.tags_dict[h] as Class_DataTag | undefined
    return m !== undefined && !ids.includes(h) && chosen.some(c => c.parent === m.parent)
  })
}

/**
 * 07/10/2026 — DÉCOCHER DANS LE DIAGRAMME (os#1511 : en LIÉ, les décochés sont partagés). Les
 * décochés deviennent `hidden`, la sélection `ids` (les montrés moins les décochés) : le diagramme ne
 * dessine plus un décoché, les fenêtres liées gardent sa ligne, grisée. Un pas d'historique.
 */
export const applyDimensionHidden = (
  app_data: Class_ApplicationData, tagg: Class_DataTagGroup, hidden: string[], ids: string[]
) => {
  if (ids.length === 0) return
  const now = snapshot(app_data, tagg)
  const banner = now.carriers.length === 0 && ids.length > 1 && UNIQUE_BANNERS.includes(now.banner) ? 'multi' : now.banner
  commit(app_data, tagg, { ...now, banner, selected: ids, hidden: [...hidden] })
}

/** Toute la sélection `ids` tient-elle sous la portée `focus` (non vide) ? */
const focusHolds = (tagg: Class_DataTagGroup, focus: string[], ids: string[]): boolean => {
  const F = focus.map(id => tagg.tags_dict[id] as Class_DataTag | undefined).filter((m): m is Class_DataTag => m !== undefined)
  if (F.length === 0) return false
  return ids.every(id => {
    const m = tagg.tags_dict[id] as Class_DataTag | undefined
    return m !== undefined && F.some(f => m === f || m.hasAncestor(f))
  })
}

/**
 * 07/10/2026 — ZOOMER LE DIAGRAMME (os#1511, revirement de Julien : en LIÉ, le zoom est partagé).
 * La portée de la dimension devient `focus` (vide = la racine) et sa sélection `ids`, restreinte à
 * la portée : le diagramme ne montre plus que les flux, bandes et nœuds de la portée. Toutes les
 * fenêtres liées lisent la même portée. Un pas d'historique, d'où que vienne le geste.
 * `ids` vide : la sélection ne change pas. La bannière ne change pas : en choix unique (un membre à
 * la fois, sans nœud porteur), le diagramme ne descend pas — sa sélection devient la portée elle-même
 * (« Céréales »), et ne bouge pas quand on remonte à la racine.
 */
export const applyDimensionFocus = (
  app_data: Class_ApplicationData, tagg: Class_DataTagGroup, focus: string[], ids: string[]
) => {
  const now = snapshot(app_data, tagg)
  // Un membre à la fois : le diagramme montrait un membre seul. Plusieurs déjà choisis malgré la
  // bannière (une figure liée les y a posés) : il découpe, la sélection suit comme en choix multiple.
  const unique = UNIQUE_BANNERS.includes(now.banner) && now.carriers.length === 0 && now.selected.length <= 1
  const selected = unique
    ? (focus.length === 1 ? [...focus] : now.selected)
    : (ids.length > 0 ? ids : now.selected)
  const banner = !unique && now.carriers.length === 0 && selected.length > 1 && UNIQUE_BANNERS.includes(now.banner) ? 'multi' : now.banner
  commit(app_data, tagg, { ...now, banner, selected, focus: [...focus], hidden: hiddenKept(tagg, now.hidden, selected) })
}

/** os#1511 — UN NIVEAU ENTIER : tous les membres que montre le niveau `index` (annulable). */
export const applyDimensionLevel = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, index: number) => {
  const levels = tagg.levels.length
  if (levels === 0 || !Number.isFinite(index)) return
  const level = Math.min(Math.max(0, index), levels - 1)
  const membres = tagg.membersAtLevel(level)
  if (membres.length === 0) return
  // Un niveau ENTIER : plus de portée.
  commit(app_data, tagg, { ...snapshot(app_data, tagg), selected: membres.map(m => m.id), focus: [] })
}

/**
 * Le dessin choisi dans la liste de l'éditeur de groupe : une bannière (un membre, plusieurs en
 * bandes, séquence, aucun…). Quitter « en nœuds » détache TOUS les porteurs ; une bannière à choix
 * unique ne garde que le premier membre choisi — un choix unique à plusieurs membres ne rendrait
 * plus aucune valeur.
 */
export const applyDimensionBanner = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, banner: string) => {
  const now = snapshot(app_data, tagg)
  const unique = readsOneMember(tagg, banner)
  // Une bannière quitte aussi le diagramme par membre : sous lui, tous les nœuds portent la dimension.
  // Les porteurs quittés sont MIS DE CÔTÉ (Julien, 12/10) : en bandes, une colonne d'extrémité qui la
  // portait s'efface (cf. `DimensionDisaggregation.foldBandedExtremities`) ; revenir en nœuds la rend.
  commit(app_data, tagg, {
    ...now, banner, carriers: [], selected: unique ? now.selected.slice(0, 1) : now.selected, bands: undefined,
    parked: now.carriers.length > 0 ? now.carriers : now.parked
  })
}

/**
 * Les nœuds qui portent la dimension deviennent exactement `node_ids` (annulable). Choisir ses
 * nœuds, c'est le dessin « en nœuds » : on quitte le diagramme par membre (Julien, 07/10 : « en
 * mode un diagramme par membre, je n'arrive pas à revenir au mode en nœuds »).
 */
export const applyDimensionCarriers = (
  app_data: Class_ApplicationData, tagg: Class_DataTagGroup, node_ids: string[]
) => {
  // Un nœud qui TRANSFORME la dimension ne se coche pas (cf. `carrierRefusal`) ; décocher, toujours.
  const now = snapshot(app_data, tagg)
  const carriers = node_ids.filter(id => now.carriers.includes(id) || carrierRefusal(app_data, tagg, id) === undefined)
  commit(app_data, tagg, { ...now, carriers, bands: false, parked: carriers.length > 0 ? [] : now.parked })
}

/**
 * os#1511 — LE NŒUD DE RÉFÉRENCE de la dimension (« tout placer autour de lui ») ; `undefined` ou
 * vide : aucun, la mise en page habituelle. Efface les positions manuelles de la dimension.
 * Annulable.
 */
export const applyReferenceNode = (
  app_data: Class_ApplicationData, tagg: Class_DataTagGroup, node_id: string | undefined
) => {
  const before = tagg.reference_node_id
  const positions_before = manualPositionsOf([tagg])
  const apply = (value: string | undefined, positions: Type_ManualPositions | undefined) => {
    tagg.reference_node_id = value
    setManualPositions([tagg], positions)
    app_data.drawing_area.rebuildDimensionNodes()
    app_data.drawing_area.draw()
    app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
  }
  app_data.history.saveUndo(() => apply(before, positions_before))
  app_data.history.saveRedo(() => apply(node_id, undefined))
  apply(node_id, undefined)
}

/**
 * REVENIR « EN NŒUDS » (Julien, 14/10 : « si je passe de nœuds à bandes je perds la sélection des
 * nœuds ; quand je reviens je dois les resélectionner ») — les porteurs mis de côté au passage en
 * bandes (`parked_carrier_ids`) REDEVIENNENT porteurs : c'est pour cela qu'on les gardait. Ceux qui
 * n'existent plus ou ne peuvent plus porter la dimension (`carrierRefusal`) sont écartés. Sans
 * porteur mis de côté, `fallback` (le premier candidat, cf. l'éditeur de groupe) ; rien sinon.
 * Annulable (cf. `applyDimensionCarriers`). Rend les ids rattachés.
 */
export const applyDimensionNodes = (
  app_data: Class_ApplicationData, tagg: Class_DataTagGroup, fallback?: string
): string[] => {
  const nodes = app_data.drawing_area.sankey.nodes_dict
  const remis = tagg.parked_carrier_ids
    .filter(id => nodes[id] !== undefined && carrierRefusal(app_data, tagg, id) === undefined)
  const ids = remis.length > 0 ? remis : (fallback !== undefined ? [fallback] : [])
  if (ids.length > 0) applyDimensionCarriers(app_data, tagg, ids)
  return ids
}

/**
 * Un membre à la fois, ou plusieurs en bandes. Quitter « en nœuds » détache TOUS les porteurs.
 * Revenir à un seul membre garde le premier qui était choisi — un choix unique à plusieurs membres
 * ne rendrait plus aucune valeur.
 */
export const applyDimensionDrawing = (
  app_data: Class_ApplicationData, tagg: Class_DataTagGroup, drawing: 'one' | 'multi'
) => applyDimensionBanner(app_data, tagg, drawing)

/**
 * L'ÉCART VERTICAL DES ENFANTS d'un nœud désagrégé (Julien, 30/09 : « je parlais aussi de ces
 * options »). Le même réglage que `DisaggregationGapControl` (onglet Hiérarchie), avec le même
 * geste : global à la zone de dessin, annulable, et le dessin ré-empile aussitôt les enfants.
 *
 * Efface les positions manuelles des nœuds engendrés : ceux de `tagg` s'il est donné (menu
 * « Placer » de la dimension), sinon ceux de toutes les dimensions dessinées en nœuds (le réglage
 * est global). Même un mode déjà coché : c'est le moyen de revenir au placement automatique.
 */
export const applyDisaggregationGap = (
  app_data: Class_ApplicationData, mode: Type_DisaggregationGap, tagg?: Class_DataTagGroup
) => {
  // Choisir un mode d'écart pour une dimension rangée en bandes, c'est quitter les bandes : sous
  // elles le mode n'a pas d'effet (Julien, 30/09 : « il ne respecte pas le mode remplir le slot »).
  const leave_bands = tagg !== undefined && dimensionInMemberBands(app_data, tagg)
  const dimensions = tagg !== undefined ? [tagg] : dimensionsDrawnAsNodes(app_data)
  const before = {
    mode: app_data.drawing_area.disaggregation_gap_mode,
    bands: tagg?.member_bands,
    positions: manualPositionsOf(dimensions)
  }
  const apply = (value: Type_DisaggregationGap, bands: boolean | undefined, positions?: Type_ManualPositions) => {
    app_data.drawing_area.disaggregation_gap_mode = value
    if (tagg !== undefined) tagg.member_bands = bands
    setManualPositions(dimensions, positions)
    // Les nœuds engendrés par une dimension se placent à la désagrégation, pas au dessin :
    // sans la refaire, le nouveau mode ne se voyait que sur les hiérarchies de nœuds.
    app_data.drawing_area.rebuildDimensionNodes()
    app_data.drawing_area.draw()
    app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
    app_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
  }
  const bands_after = leave_bands ? false : tagg?.member_bands
  app_data.history.saveUndo(() => apply(before.mode, before.bands, before.positions))
  app_data.history.saveRedo(() => apply(mode, bands_after))
  apply(mode, bands_after)
}

/**
 * os#1511 — UN DIAGRAMME PAR MEMBRE : la dimension se range-t-elle en bandes ? Même règle que
 * `DimensionDisaggregation.bandesParMembre` + `axesEnBandes` (réglage de la dimension, automatique
 * dès deux porteurs), lue ici sans importer l'algorithme : ce module reste une feuille.
 */
export const dimensionInMemberBands = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup): boolean => {
  // Demandé : en vigueur, quels que soient les porteurs (ils le deviennent tous). Automatique : dès
  // deux porteurs réglés.
  // Seulement DEMANDÉ (Julien, 08/10) : plus de passage d'office dès deux porteurs.
  void app_data
  return tagg.draws_member_bands
}

/**
 * Range la dimension en bandes (un diagramme par membre), ou revient au mode d'écart des enfants.
 * Efface les positions manuelles de la dimension (retour au placement automatique).
 *
 * Les bandes répètent le diagramme entier : tous les nœuds y portent la dimension, mais sans que
 * leur réglage change (`Node.driving_dimension`) — revenir en arrière rend le diagramme d'avant.
 */
export const applyMemberBands = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, on: boolean) => {
  // Un seul diagramme par membre à la fois : tous les nœuds portent SA dimension.
  const others = on
    ? (app_data.drawing_area.sankey.data_taggs_list as Class_DataTagGroup[])
      .filter(other => other !== tagg && other.draws_member_bands)
    : []
  const before = tagg.member_bands
  const positions_before = manualPositionsOf([tagg])
  const apply = (value: boolean | undefined, others_value: boolean | undefined, positions?: Type_ManualPositions) => {
    others.forEach(other => { other.member_bands = others_value })
    tagg.member_bands = value
    setManualPositions([tagg], positions)
    app_data.drawing_area.rebuildDimensionNodes()
    app_data.drawing_area.draw()
    app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
    app_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
  }
  app_data.history.saveUndo(() => apply(before, true, positions_before))
  app_data.history.saveRedo(() => apply(on, undefined))
  apply(on, undefined)
}

/**
 * os#1511 (lot 5) — L'EXPANSION offerte ? Il faut un nœud porteur À UNE EXTRÉMITÉ (sans flux d'un
 * côté) : c'est là seulement que le côté de l'expansion ne fait pas de doute (Julien, 10/10).
 */
export const dimensionOffersExpansion = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup): boolean =>
  dimensionCarriersOf(app_data, tagg).some(node => expansionSideOf(node) !== undefined)

/**
 * os#1511 (lot 5) — EN NŒUDS, L'EXPANSION AUX EXTRÉMITÉS (cf. `DimensionExpansion`) : les membres
 * ouverts gardent leur nœud, leurs enfants s'ouvrent vers l'extérieur. Annulable. 14/10/2026 — un
 * geste du modèle commun (`diagramExpansion`), posé par la porte `applyDiagramPatch` : le menu de la
 * dimension et la couronne liée qui passe en sunburst (`couronneGestures.setDrawing`) écrivent par là.
 */
export const applyNodesExpansion = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, on: boolean) =>
  applyDiagramGesture(app_data, (state, sankey) => diagramExpansion(state, sankey, tagg.id, on))

/**
 * os#1511 — LES MEMBRES DE CETTE DIMENSION COLORENT LES FLUX d'un diagramme par membre, au lieu de
 * ceux de la bande (Julien, 07/10 : « comment faire pour que la couleur devienne celle de Ressources
 * et emplois »). Une seule dimension colore à la fois. Annulable.
 */
export const applyMembersColorFlows = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, on: boolean) => {
  const dimensions = app_data.drawing_area.sankey.data_taggs_list as Class_DataTagGroup[]
  const before = dimensions.map(d => [d, d.paints_flows] as [Class_DataTagGroup, boolean])
  const after = dimensions.map(d => [d, d === tagg ? on : (on ? false : d.paints_flows)] as [Class_DataTagGroup, boolean])
  const apply = (state: [Class_DataTagGroup, boolean][]) => {
    state.forEach(([d, v]) => { d.paints_flows = v })
    app_data.drawing_area.draw()
    app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
  }
  app_data.history.saveUndo(() => apply(before))
  app_data.history.saveRedo(() => apply(after))
  apply(after)
}

/**
 * os#1511 — ORDRE DES MEMBRES dessinés, en bandes comme en nœuds (annulable). L'ordre des nœuds
 * se décide à la désagrégation : on la refait ; celui des bandes au dessin.
 */
export const applyMembersOrder = (
  app_data: Class_ApplicationData, tagg: Class_DataTagGroup, ordre: Type_MembersOrder
) => {
  const before = tagg.members_order
  const apply = (value: Type_MembersOrder) => {
    tagg.members_order = value
    app_data.drawing_area.rebuildDimensionNodes()
    app_data.drawing_area.draw()
    app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
  }
  app_data.history.saveUndo(() => apply(before))
  app_data.history.saveRedo(() => apply(ordre))
  apply(ordre)
}

/**
 * 03/10/2026 — UN SEUL PAS D'ANNULATION pour un geste du diagramme suivi d'un réglage de figure :
 * les annulations que `run` empile (le geste de l'hôte, l'écriture de la figure) sont recueillies,
 * puis posées en UNE entrée, avec `undoAlso` / `redoAlso` en plus.
 */
export const inOneHistoryStep = (
  history: { saveUndo: (f: () => void) => void, saveRedo: (f: () => void) => void },
  run: () => void, undoAlso: () => void = () => undefined, redoAlso: () => void = () => undefined
) => {
  const undos: (() => void)[] = []
  const redos: (() => void)[] = []
  const own = history as unknown as { [k: string]: unknown }
  const had_own = Object.prototype.hasOwnProperty.call(own, 'saveUndo')
  const saveUndo = own.saveUndo
  const saveRedo = own.saveRedo
  own.saveUndo = (f: () => void) => { undos.push(f) }
  own.saveRedo = (f: () => void) => { redos.push(f) }
  try {
    run()
  } finally {
    // Une instance de classe retrouve les méthodes de son prototype ; un objet simple, les siennes.
    if (had_own) { own.saveUndo = saveUndo; own.saveRedo = saveRedo } else { delete own.saveUndo; delete own.saveRedo }
  }
  history.saveUndo(() => { undoAlso(); [...undos].reverse().forEach(f => f()) })
  history.saveRedo(() => { redos.forEach(f => f()); redoAlso() })
}

// ── os#1511 (Jean-Yves, 09/10) — LES GESTES DES COMMANDES DU LECTEUR ──────────────────────────────
//
// Une case « Distinguer… », une liste de niveaux, une liste de membres avec « Sélectionner
// plusieurs » (cf. `Class_DataTagGroup.reader_control`). Le tableau du diagramme les MONTRE
// (`diagramNavigationTable`) ; 11/10/2026 — leurs règles sont des gestes du MODÈLE COMMUN
// (`diagramReader*`), posés ici par la porte `applyDiagramPatch` : chacun UN pas d'historique.

/** Les membres du premier niveau dont descend la sélection de `tagg` (eux-mêmes s'ils en sont). */
export const readerChosenRoots = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup): string[] => {
  const d = fromDiagram(viewSankeyOf(app_data)).dims[tagg.id]
  return d === undefined ? [] : readerRootsOf(tagg, d)
}

/**
 * Une AUTRE dimension superpose-t-elle plusieurs membres en bandes, SANS que le lecteur puisse la
 * ramener à un seul (elle n'a pas de commande) ? La case « Distinguer… » de `tagg` est alors GELÉE :
 * deux dimensions en bandes, on ne verrait plus rien (règle de Jean-Yves).
 *
 * os#1511 (Jean-Yves, 14/10 : « on doit d'abord désélectionner types de matières ou sous-filières
 * avant de pouvoir sélectionner l'alternative ») — une dimension qui A une commande ne gèle plus :
 * cocher l'autre case la ramène à un seul membre dans le même pas (`releaseOtherBands` du modèle).
 */
export const readerToggleBlocker = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup): Class_DataTagGroup | undefined => {
  const sankey = viewSankeyOf(app_data)
  const id = readerBlockerOf(fromDiagram(sankey), sankey, tagg.id)
  return id === undefined ? undefined : app_data.drawing_area.sankey.data_taggs_dict[id] as unknown as Class_DataTagGroup
}

/** Le lecteur choisit des membres : choix multiple dès plusieurs, sans portée. */
export const applyReaderPick = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, ids: string[]) => {
  if (ids.length === 0) return
  applyDiagramGesture(app_data, (state, sankey) => diagramReaderPick(state, sankey, tagg.id, ids))
}

/** Le lecteur choisit un NIVEAU entier (liste de niveaux). */
export const applyReaderLevel = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, depth: number) =>
  applyDiagramGesture(app_data, (state, sankey) => diagramReaderLevel(state, sankey, tagg.id, depth))

/**
 * La case « Distinguer… » : cochée, le deuxième niveau ; décochée, le premier. Cochée, elle libère
 * d'abord les autres dimensions superposées, dans le même pas (`diagramReaderToggle`).
 */
export const applyReaderToggle = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, on: boolean): void =>
  applyDiagramGesture(app_data, (state, sankey) => diagramReaderToggle(state, sankey, tagg.id, on))

/**
 * Le lecteur choisit des SOUS-MEMBRES de `root` : aucun ou tous, c'est `root` ; plusieurs, ils se
 * superposent en bandes, et les cases « Distinguer… » des autres dimensions se décochent (cf.
 * `readerToggleBlocker`), dans le même pas.
 */
export const applyReaderSubPick = (
  app_data: Class_ApplicationData, tagg: Class_DataTagGroup, root: Class_DataTag, ids: string[]
) => applyDiagramGesture(app_data, (state, sankey) => diagramReaderSubPick(state, sankey, tagg.id, root.id, ids))

/**
 * os#1511 (Jean-Yves, 11/10) — « DISTINGUER LES SOUS-FILIÈRES » : cochée, les sous-membres de `root`
 * en bandes (et les autres cases « Distinguer… » se décochent : on ne peut pas distinguer deux
 * dimensions à la fois) ; décochée, `root` seul. Un pas.
 */
export const applyReaderSubDistinguish = (
  app_data: Class_ApplicationData, tagg: Class_DataTagGroup, root: Class_DataTag, on: boolean
) => applyDiagramGesture(app_data, (state, sankey) => diagramReaderSubDistinguish(state, sankey, tagg.id, root.id, on))

/**
 * « Sélectionner plusieurs » : cochée, un diagramme par membre sur les membres choisis — de
 * n'importe quel niveau, mélangés (Jean-Yves, 11/10) ; décochée, un seul diagramme, sur le premier. Un pas.
 */
export const applyReaderSeveral = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, on: boolean) =>
  applyDiagramGesture(app_data, (state, sankey) => diagramReaderSeveral(state, sankey, tagg.id, on))

/** Coche ou décoche un nœud porteur : c'est ce qui désagrège ce nœud selon la dimension. */
export const toggleDimensionCarrier = (
  app_data: Class_ApplicationData, tagg: Class_DataTagGroup, node_id: string
) => {
  const now = snapshot(app_data, tagg)
  if (!now.carriers.includes(node_id) && carrierRefusal(app_data, tagg, node_id) !== undefined) return
  const carriers = now.carriers.includes(node_id)
    ? now.carriers.filter(id => id !== node_id)
    : [...now.carriers, node_id]
  // Cocher un nœud dans « En nœuds » quitte le diagramme par membre (cf. `applyDimensionCarriers`).
  commit(app_data, tagg, { ...now, carriers, bands: false, parked: carriers.length > 0 ? [] : now.parked })
}

/**
 * os#1511 — POURQUOI CE NŒUD NE PEUT PAS PORTER la dimension, ou `undefined` s'il le peut : un nœud
 * qui la TRANSFORME (aucun membre commun entre ses entrées et ses sorties, cf.
 * `nodeTransformsDimension`) se découperait en morceaux sans lien. La raison sert de libellé.
 */
export const carrierRefusal = (
  app_data: Class_ApplicationData, tagg: Class_DataTagGroup, node_id: string
): 'transforms' | undefined => {
  const node = app_data.drawing_area.sankey.nodes_dict[node_id] as Class_NodeElement | undefined
  if (node === undefined) return undefined
  return nodeTransformsDimension(node, tagg) ? 'transforms' : undefined
}
