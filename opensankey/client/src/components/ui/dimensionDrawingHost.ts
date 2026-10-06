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

export type { Type_DimensionDrawing } from '../../types/TagGroup'

/** Les nœuds qui portent la dimension. */
export const dimensionCarriersOf = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup): Class_NodeElement[] =>
  (app_data.drawing_area.sankey.nodes_list as Class_NodeElement[]).filter(node => node.driving_dimension === tagg)

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

type Type_Snapshot = { banner: string, carriers: string[], selected: string[] }

const snapshot = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup): Type_Snapshot => ({
  banner: (tagg as unknown as { banner: string }).banner,
  carriers: dimensionCarriersOf(app_data, tagg).map(node => node.id),
  selected: tagg.selected_tags_list.map(tag => tag.id)
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
 * os#1526 — ⇅ DANS LE TABLEAU DU DIAGRAMME : les deux dimensions ÉCHANGENT LEUR DESSIN (Julien,
 * 06/10 : « si l'une est en bandes et l'autre en nœuds, on inverse avec la double flèche »). Chacune
 * prend la bannière et les nœuds porteurs de l'autre ; ses membres choisis restent les siens (le
 * premier seulement, si elle passe à un membre). Un seul pas d'historique, un seul dessin.
 */
export const swapDimensionDrawings = (
  app_data: Class_ApplicationData, a: Class_DataTagGroup, b: Class_DataTagGroup
) => {
  if (a === b) return
  const before_a = snapshot(app_data, a)
  const before_b = snapshot(app_data, b)
  const take = (own: Type_Snapshot, other: Type_Snapshot): Type_Snapshot => ({
    banner: other.banner,
    carriers: other.carriers,
    selected: UNIQUE_BANNERS.includes(other.banner) ? own.selected.slice(0, 1) : own.selected
  })
  const after: [Class_DataTagGroup, Type_Snapshot][] = [[a, take(before_a, before_b)], [b, take(before_b, before_a)]]
  app_data.history.saveUndo(() => restoreAll(app_data, [[a, before_a], [b, before_b]]))
  app_data.history.saveRedo(() => restoreAll(app_data, after))
  restoreAll(app_data, after)
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
  app_data: Class_ApplicationData, tagg: Class_DataTagGroup, ids: string[], options: { multi?: boolean } = {}
) => {
  if (ids.length === 0) return
  const now = snapshot(app_data, tagg)
  const banner = options.multi && now.carriers.length === 0 ? 'multi' : now.banner
  commit(app_data, tagg, { ...now, banner, selected: ids })
}

/** os#1511 — UN NIVEAU ENTIER : tous les membres que montre le niveau `index` (annulable). */
export const applyDimensionLevel = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, index: number) => {
  const levels = tagg.levels.length
  if (levels === 0 || !Number.isFinite(index)) return
  const level = Math.min(Math.max(0, index), levels - 1)
  const membres = tagg.membersAtLevel(level)
  if (membres.length === 0) return
  commit(app_data, tagg, { ...snapshot(app_data, tagg), selected: membres.map(m => m.id) })
}

/**
 * Le dessin choisi dans la liste de l'éditeur de groupe : une bannière (un membre, plusieurs en
 * bandes, séquence, aucun…). Quitter « en nœuds » détache TOUS les porteurs ; une bannière à choix
 * unique ne garde que le premier membre choisi — un choix unique à plusieurs membres ne rendrait
 * plus aucune valeur.
 */
export const applyDimensionBanner = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, banner: string) => {
  const now = snapshot(app_data, tagg)
  const unique = UNIQUE_BANNERS.includes(banner)
  commit(app_data, tagg, { ...now, banner, carriers: [], selected: unique ? now.selected.slice(0, 1) : now.selected })
}

/** Les nœuds qui portent la dimension deviennent exactement `node_ids` (annulable). */
export const applyDimensionCarriers = (
  app_data: Class_ApplicationData, tagg: Class_DataTagGroup, node_ids: string[]
) => {
  commit(app_data, tagg, { ...snapshot(app_data, tagg), carriers: node_ids })
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
  const porteurs = dimensionCarriersOf(app_data, tagg).length
  return porteurs >= 2 && (tagg.member_bands ?? true)
}

/**
 * Range la dimension en bandes (un diagramme par membre), ou revient au mode d'écart des enfants.
 * Efface les positions manuelles de la dimension (retour au placement automatique).
 */
export const applyMemberBands = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, on: boolean) => {
  const before = tagg.member_bands
  const positions_before = manualPositionsOf([tagg])
  const apply = (value: boolean | undefined, positions?: Type_ManualPositions) => {
    tagg.member_bands = value
    setManualPositions([tagg], positions)
    app_data.drawing_area.rebuildDimensionNodes()
    app_data.drawing_area.draw()
    app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
    app_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
  }
  app_data.history.saveUndo(() => apply(before, positions_before))
  app_data.history.saveRedo(() => apply(on))
  apply(on)
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
  const carriers = now.carriers.includes(node_id)
    ? now.carriers.filter(id => id !== node_id)
    : [...now.carriers, node_id]
  commit(app_data, tagg, { ...now, carriers })
}
