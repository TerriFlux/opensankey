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

const restore = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, state: Type_Snapshot) => {
  const { drawing_area } = app_data
  ;(tagg as unknown as { banner: string }).banner = state.banner
  dimensionCarrierCandidates(app_data).forEach(node => {
    const carries = state.carriers.includes(node.id)
    if (carries && node.driving_dimension !== tagg) node.driving_dimension = tagg
    else if (!carries && node.driving_dimension === tagg) node.setDrivingDimensionId(undefined)
  })
  // Un aperçu (menu unitaire) a pu laisser `bypass_redraws` posé : le dessin final doit passer.
  drawing_area.bypass_redraws = false
  drawing_area.withBypassRedraws(() => poseSelection(tagg, state.selected), false)
  drawing_area.rebuildDimensionNodes()
  drawing_area.draw()
  app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
  app_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
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
  const unique = banner === 'one' || banner === 'topbar' || banner === 'sequence'
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
 * vide : aucun, la mise en page habituelle. Annulable.
 */
export const applyReferenceNode = (
  app_data: Class_ApplicationData, tagg: Class_DataTagGroup, node_id: string | undefined
) => {
  const before = tagg.reference_node_id
  const apply = (value: string | undefined) => {
    tagg.reference_node_id = value
    app_data.drawing_area.rebuildDimensionNodes()
    app_data.drawing_area.draw()
    app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
  }
  app_data.history.saveUndo(() => apply(before))
  app_data.history.saveRedo(() => apply(node_id))
  apply(node_id)
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
 */
export const applyDisaggregationGap = (
  app_data: Class_ApplicationData, mode: Type_DisaggregationGap, tagg?: Class_DataTagGroup
) => {
  // Choisir un mode d'écart pour une dimension rangée en bandes, c'est quitter les bandes : sous
  // elles le mode n'a pas d'effet (Julien, 30/09 : « il ne respecte pas le mode remplir le slot »).
  const leave_bands = tagg !== undefined && dimensionInMemberBands(app_data, tagg)
  const before = { mode: app_data.drawing_area.disaggregation_gap_mode, bands: tagg?.member_bands }
  const apply = (value: Type_DisaggregationGap, bands: boolean | undefined) => {
    app_data.drawing_area.disaggregation_gap_mode = value
    if (tagg !== undefined) tagg.member_bands = bands
    // Les nœuds engendrés par une dimension se placent à la désagrégation, pas au dessin :
    // sans la refaire, le nouveau mode ne se voyait que sur les hiérarchies de nœuds.
    app_data.drawing_area.rebuildDimensionNodes()
    app_data.drawing_area.draw()
    app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
    app_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
  }
  const bands_after = leave_bands ? false : tagg?.member_bands
  app_data.history.saveUndo(() => apply(before.mode, before.bands))
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

/** Range la dimension en bandes (un diagramme par membre), ou revient au mode d'écart des enfants. */
export const applyMemberBands = (app_data: Class_ApplicationData, tagg: Class_DataTagGroup, on: boolean) => {
  const before = tagg.member_bands
  const apply = (value: boolean | undefined) => {
    tagg.member_bands = value
    app_data.drawing_area.rebuildDimensionNodes()
    app_data.drawing_area.draw()
    app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
    app_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
  }
  app_data.history.saveUndo(() => apply(before))
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
