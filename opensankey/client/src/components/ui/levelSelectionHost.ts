// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1511 — CHANGER DE NIVEAU D'AGRÉGATION (étiquettes de niveau), hors de tout composant.
//
// Sorti de la barre d'outils de l'éditeur : le panneau Navigation l'appelle, et aussi la
// restauration de l'état d'URL (`level_selection_applier`, os#1354), quand ce panneau n'est pas
// monté. Le geste porte son propre instantané d'annulation.

import type { Class_ApplicationData } from '../../types/ApplicationData'
import type { Class_TagGroup } from '../../types/TagGroup'
import type { Class_NodeElement } from '../../Elements/Node'
import type { Class_NodeDimension, Type_DisaggregationKind } from '../../Elements/NodeDimension'
import { disaggregate, aggregate, disaggregationExpansion, applyContainerModeForDim } from '../../Algorithms/Hierarchies'

export const applyLevelSelection = (
  app_data: Class_ApplicationData,
  tagg: Class_TagGroup,
  tag_id: string,
  updateComponents: () => void = () => undefined,
  /**
   * os#1522 — CE QUI PRÉCÈDE LE CHANGEMENT DE NIVEAU, dans le MÊME pas d'annulation. La liste
   * « Mixte » s'en sert : choisir un niveau depuis une coupe irrégulière ré-agrège d'abord les
   * désagrégations locales (`resetLocalHierarchy`), puis applique le niveau — un seul Annuler.
   */
  prepare?: () => void
): void => {
  const drawing_area = app_data.drawing_area
  const values = [tag_id]

  const run = () => {
    prepare?.()
    // Mémoriser AVANT de changer la sélection (et APRÈS `prepare`, qui change ce qui est
    // visible) : le sens du mouvement et les nœuds visibles du niveau courant en dépendent.
    const old_level_idx = tagg.tags_list.findIndex(t => t.is_selected)
    const nodes_before = [...drawing_area.sankey.visible_nodes_list]
    drawing_area.withBypassRedraws(() => {
      tagg.selectTagsFromId(tag_id)
      app_data.drawing_area.bypass_redraws = true
      // #1231 — Désagrégation/agrégation GLOBALE = application des fonctions LOCALES
      // nœud par nœud (mêmes positions que le clic droit : enfants remplissent le slot
      // du parent). On part des nœuds visibles du niveau précédent. La contrainte ±1
      // (dropdown) garantit un seul cran. En désagrégation uniforme « simple »,
      // `showAccordingToLevelTags()` ci-dessous nettoie les force-flags (visibilité
      // pilotée par les level-tags) ; en présence d'un type hybride mémorisé
      // (englobant/expansion) on garde les flags (cf. `any_hybrid`).
      const new_level_idx = tagg.tags_list.findIndex(t => t.id === values[0])
      // #1231 — DÉSAGRÉGATION : chaque nœud applique le type qu'il a MÉMORISÉ
      // (clic droit local : simple / englobant / expansion), au lieu de toujours
      // désagréger « simple ». La préférence survit aux agrégations et au
      // rechargement (cf. Class_NodeDimension.preferred_disaggregation).
      let any_hybrid = false
      // os#1508 — un LOT : chaque geste ne réorganise ni ne recale plus ses voisins, le sélecteur le
      // fait une fois après la boucle (reorganizeIOLinksOf + setAbsoluteMode, ci-dessous).
      app_data.drawing_area.withHierarchyBatch(() => {
        if (old_level_idx >= 0 && new_level_idx > old_level_idx) {
          nodes_before.forEach(n => {
            const dim = n.dimensions_as_parent.find(d => d.id === tagg.id) as Class_NodeDimension | undefined
            if (!dim || dim.children.length === 0) return
            const pref: Type_DisaggregationKind | null = dim.preferred_disaggregation
            if (pref === 'expanded_left' || pref === 'expanded_right') {
            // Le parent est encore VISIBLE ici (on n'a pas encore appelé
            // showAccordingToLevelTags) → la redistribution des valeurs sur les
            // liens d'expansion a le bon contexte.
              any_hybrid = true
              // finalize=false : batch sous bypass_redraws ; un unique draw()+recenter()
              // est fait après la boucle (sinon un redraw complet par nœud → O(N²)).
              disaggregationExpansion(app_data, n as Class_NodeElement, pref === 'expanded_left', dim.children[0] as Class_NodeElement, false)
            } else if (pref === 'split_links') {
            // Flux éclatés mémorisés : le parent reste, ses flux se divisent en bandes.
              any_hybrid = true
              dim.setSplitLinks()
              ;(n as Class_NodeElement).buildSplitLinks(dim)
            } else if (pref && pref !== 'children') {
              any_hybrid = true
              applyContainerModeForDim(app_data, dim, pref)
            } else {
              disaggregate(app_data, n as Class_NodeElement, dim.children[0].id, false)
            }
          })
        } else if (old_level_idx >= 0 && new_level_idx < old_level_idx) {
          nodes_before.forEach(n => {
            const dim = n.dimensions_as_child.find(d => d.id === tagg.id)
            if (dim) {
              aggregate(app_data, n as Class_NodeElement, dim.parent.id, false)
            }
          })
        }
      })
      // #1231 — `showAccordingToLevelTags()` efface TOUS les force-flags (y compris
      // container/expansion) pour piloter la visibilité par les level-tags. On ne le
      // fait QUE si la désagrégation est uniforme « simple » : dès qu'un nœud utilise
      // un type hybride (englobant/expansion), l'état est volontairement hybride et on
      // garde ses flags. L'agrégation (sens inverse) repasse toujours par le mode propre.
      if (!any_hybrid) {
        app_data.drawing_area.sankey.showAccordingToLevelTags()
      }
      app_data.drawing_area.sankey.nodes_list.forEach(n => n.dimensionsUpdated())
      // #1231 — un changement de niveau (désagrégation/agrégation globale) est une commande
      // de positionnement → mode absolu (réf flux/datatag persistée conservée).
      // os#1364 — sauf sur une carte : un document géographique le reste, ses positions
      // dérivent des coordonnées (cf. `settlePositionModeAfterHierarchyGesture`).
      if (app_data.drawing_area.sankey.styles_dict['default'].shape_position_type !== 'geographic') {
        app_data.drawing_area.setAbsoluteMode()
      }
      // Réordonnancement E/S AVANT le draw (sous bypass_redraws=true encore actif) : il ne
      // réordonne que _links_order (géométrie relative, invariante par la translation du
      // recenter), donc son draw() interne est bypassé. Ainsi le draw() ci-dessous rend
      // directement le bon ordre — au lieu d'un 3e rendu complet après recenter (le draw()
      // réactivait le rendu → une passe entière gaspillée + rendu transitoire mal ordonné).
      app_data.drawing_area.reorganizeIOLinksOf(app_data.drawing_area.sankey.nodes_list)
      app_data.drawing_area.draw()
      app_data.drawing_area.recenter()
      app_data.drawing_area.orderElementOnDA()

    }, false)
    updateComponents()
  }

  app_data.runWithSnapshotUndo(run, updateComponents)
}
