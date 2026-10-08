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
import { nodeTransformsDimension } from '../../Algorithms/DimensionTransform'

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

type Type_Snapshot = { banner: string, carriers: string[], selected: string[], bands: boolean | undefined, focus: string[], hidden: string[] }

const snapshot = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup): Type_Snapshot => ({
  banner: (tagg as unknown as { banner: string }).banner,
  carriers: dimensionCarriersOf(app_data, tagg).map(node => node.id),
  selected: tagg.selected_tags_list.map(tag => tag.id),
  bands: tagg.member_bands,
  focus: tagg.stored_focus_ids,
  hidden: tagg.stored_hidden_ids
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
  drawing_area.rebuildDimensionNodes()
  drawing_area.draw()
  app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
  app_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
}

const restore = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, state: Type_Snapshot) =>
  restoreAll(app_data, [[tagg, state]])

/** Une bannière à choix unique ne lit qu'un membre. */
const UNIQUE_BANNERS = ['one', 'topbar', 'sequence']

/**
 * La bannière `banner` ferait-elle lire UN SEUL membre de `tagg` ? Pas « un membre » sur une dimension
 * hiérarchisée : additive, elle le reçoit en choix multiple (`Class_DataTagGroup.admissibleBanner`).
 */
const readsOneMember = (tagg: Class_DataTagGroup, banner: string) =>
  UNIQUE_BANNERS.includes(banner) && !(banner !== 'sequence' && tagg.is_hierarchical)

/** Le placement des nœuds engendrés d'une dimension : il appartient au dessin « en nœuds ». */
type Type_NodesPlacement = { member_bands: boolean | undefined, reference_node_id: string | undefined }

const nodesPlacementOf = (tagg: Class_DataTagGroup): Type_NodesPlacement =>
  ({ member_bands: tagg.member_bands, reference_node_id: tagg.reference_node_id })

const setNodesPlacement = (tagg: Class_DataTagGroup, placement: Type_NodesPlacement) => {
  tagg.member_bands = placement.member_bands
  tagg.reference_node_id = placement.reference_node_id
}

/**
 * os#1526 — ⇅ DANS LE TABLEAU DU DIAGRAMME : les deux dimensions ÉCHANGENT LEUR DESSIN (Julien,
 * 06/10 : « si l'une est en bandes et l'autre en nœuds, on inverse avec la double flèche »). C'est
 * le sens de l'ordre des dimensions sur un diagramme : il n'y a pas d'imbrication à réordonner,
 * seulement quelle dimension découpe les flux en bandes et laquelle découpe les nœuds.
 *
 * Le dessin échangé est TOUT le dessin, pour que le résultat soit celui qu'on aurait obtenu en
 * posant la configuration directement :
 *  - la bannière et les nœuds porteurs. Une dimension en nœuds n'a pas de bannière qui compte
 *    (`drawing` = 'nodes' dès qu'un nœud la porte) : celle qui prend les nœuds garde donc la sienne
 *    et TOUS ses membres choisis — lui passer la bannière « un membre » de l'autre la réduisait au
 *    premier membre, et le diagramme se vidait ;
 *  - le PLACEMENT des nœuds (`member_bands` : un diagramme par membre ou l'écart des enfants,
 *    `reference_node_id`) : resté sur l'ancienne dimension, « nœuds à écart constant » devenait,
 *    sur la nouvelle, des bandes par membre automatiques ;
 *  - les positions manuelles : celle qui arrive sur les porteurs est placée AUTOMATIQUEMENT. Ses
 *    membres peuvent porter des positions d'un autre dessin (position commune d'un ancien fichier,
 *    « [SOCLE] Pays partenaires » : les filières, toutes empilées à x = 955 au milieu du
 *    diagramme) ; c'est la règle de « Placer », qui efface aussi les positions manuelles.
 * Un seul pas d'historique, un seul dessin ; l'annulation rend tout.
 */
export const swapDimensionDrawings = (
  app_data: Class_ApplicationData, a: Class_DataTagGroup, b: Class_DataTagGroup
) => {
  if (a === b) return
  const before_a = snapshot(app_data, a)
  const before_b = snapshot(app_data, b)
  const placement_a = nodesPlacementOf(a)
  const placement_b = nodesPlacementOf(b)
  const positions_before = manualPositionsOf([a, b])
  const take = (tagg: Class_DataTagGroup, own: Type_Snapshot, other: Type_Snapshot): Type_Snapshot => {
    const takes_nodes = other.carriers.length > 0
    const banner = takes_nodes ? own.banner : other.banner
    return {
      banner,
      carriers: other.carriers,
      selected: !takes_nodes && readsOneMember(tagg, banner) ? own.selected.slice(0, 1) : own.selected,
      bands: other.bands,
      focus: own.focus,
      hidden: own.hidden
    }
  }
  const after: [Class_DataTagGroup, Type_Snapshot][] = [[a, take(a, before_a, before_b)], [b, take(b, before_b, before_a)]]
  // Les dimensions qui arrivent sur des porteurs : placement automatique.
  const arriving = [a, b].filter((_tagg, i) => [before_b, before_a][i].carriers.length > 0)
  app_data.history.saveUndo(() => {
    setNodesPlacement(a, placement_a)
    setNodesPlacement(b, placement_b)
    setManualPositions([a, b], positions_before)
    restoreAll(app_data, [[a, before_a], [b, before_b]])
  })
  const redo = () => {
    setNodesPlacement(a, placement_b)
    setNodesPlacement(b, placement_a)
    setManualPositions(arriving, undefined)
    restoreAll(app_data, after)
  }
  app_data.history.saveRedo(redo)
  redo()
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
  commit(app_data, tagg, {
    ...now, banner, carriers: [], selected: unique ? now.selected.slice(0, 1) : now.selected, bands: undefined
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
  commit(app_data, tagg, { ...now, carriers, bands: false })
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
  if (tagg.member_bands !== undefined) return tagg.member_bands
  // Sous le diagramme par membre d'une autre dimension, celle-ci se découpe dans ses bandes.
  const demandee = (app_data.drawing_area.sankey.data_taggs_list as Class_DataTagGroup[])
    .some(other => other !== tagg && other.member_bands === true)
  return !demandee && dimensionCarriersOf(app_data, tagg).length >= 2
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
      .filter(other => other !== tagg && other.member_bands === true)
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
  commit(app_data, tagg, { ...now, carriers, bands: false })
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
