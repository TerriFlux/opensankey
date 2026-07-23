// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #243 — Optimisation des croisements de flux extraite de NodePositioning en fonctions libres
// prenant la DrawingArea (n'utilisent que `drawingArea`, aucun état de NodePositioning).
// NodePositioning garde une méthode-délégatrice `optimizeCrossingsPositioning`.

import type { Class_DrawingArea } from '../types/DrawingArea'

type CrossingAnalysis = {
  crossing_flows: Array<{
    source_id: string,
    target_id: string,
    crossed_nodes: string[],
    link_id: string
  }>,
  nodes_crossed_by: { [node_id: string]: string[] }
}

export function optimizeCrossingsPositioning(
  da: Class_DrawingArea,
  apply_optimization: boolean = true,
  h_spacing?: number,
  v_spacing?: number
) {
  if (!apply_optimization) {
    return
  }


  const echangeTag = da.sankey.node_taggs_dict['type de noeud'] ?
    da.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
  const nodes_to_process = da.sankey.visible_nodes_list.filter(n =>
    !echangeTag || !n.hasGivenTag(echangeTag))

  // Créer la structure node_id_per_hxv_indexes à partir des positions actuelles
  const horizontal_positions: { [node_id: string]: number } = {}
  const nodes_per_horizontal_indexes: { [index: number]: string[] } = {}
  let max_horizontal_index = 0

  // Regrouper les nœuds par colonne
  // En mode papier, utiliser position_u (les X sont espaces differemment)
  const paper_mode = da.is_paper_mode
  nodes_to_process.forEach(node => {
    const h_index = paper_mode
      ? Math.max(0, node.position_u - 1)
      : Math.round(node.position_x / (h_spacing ?? node.shape_position_dx))
    horizontal_positions[node.id] = h_index

    if (!nodes_per_horizontal_indexes[h_index]) {
      nodes_per_horizontal_indexes[h_index] = []
    }
    nodes_per_horizontal_indexes[h_index].push(node.id)

    if (h_index > max_horizontal_index) {
      max_horizontal_index = h_index
    }
  })

  // Trier les nœuds par position Y dans chaque colonne
  Object.keys(nodes_per_horizontal_indexes).forEach(h_index_str => {
    const h_index = parseInt(h_index_str)
    nodes_per_horizontal_indexes[h_index].sort((a, b) => {
      const node_a_y = da.sankey.nodes_dict[a].position_y
      const node_b_y = da.sankey.nodes_dict[b].position_y
      return node_a_y - node_b_y
    })
  })

  // Convertir en format attendu par analyzeCrossingFlows
  const node_id_per_hxv_indexes: string[][] = []
  for (let i = 0; i <= max_horizontal_index; i++) {
    node_id_per_hxv_indexes.push(nodes_per_horizontal_indexes[i] || [])
  }

  // Analyser les croisements
  const crossing_analysis = analyzeCrossingFlows(da, node_id_per_hxv_indexes, max_horizontal_index)

  if (crossing_analysis.crossing_flows.length === 0) {
    return
  }

  // Appliquer les ajustements pour chaque colonne
  const v_margin = v_spacing ?? da.sankey.styles_dict['default'].shape_position_dy!

  for (let horizontal_index = 0; horizontal_index <= max_horizontal_index; horizontal_index++) {
    if (!node_id_per_hxv_indexes[horizontal_index] || node_id_per_hxv_indexes[horizontal_index].length === 0) {
      continue
    }

    const column_adjustments = calculateColumnAdjustments(
      horizontal_index,
      node_id_per_hxv_indexes[horizontal_index],
      crossing_analysis,
      v_margin
    )

    // Appliquer les ajustements
    Object.keys(column_adjustments).forEach(node_id => {
      const node_ref = da.sankey.nodes_dict[node_id]
      // Ne pas déplacer un nœud verrouillé verticalement : son ordre doit être préservé.
      if (node_ref.shape_position_v_locked === true) return
      const adjustment = column_adjustments[node_id]
      if (Math.abs(adjustment) > 0.1) { // Seuil minimum pour éviter les micro-ajustements
        const current_y = node_ref.position_y
        const new_y = Math.max(0, current_y + adjustment) // Éviter les Y négatifs

        node_ref.position_y = new_y
      }
    })
  }

}

/** Analyse les flux qui traversent d'autres nœuds. */
function analyzeCrossingFlows(
  da: Class_DrawingArea,
  node_id_per_hxv_indexes: string[][],
  max_horizontal_index: number
): CrossingAnalysis {
  const crossing_flows: CrossingAnalysis['crossing_flows'] = []
  const nodes_crossed_by: { [node_id: string]: string[] } = {}

  // Créer un mapping position horizontale -> nœuds
  const horizontal_positions: { [node_id: string]: number } = {}
  for (let h_index = 0; h_index <= max_horizontal_index; h_index++) {
    if (node_id_per_hxv_indexes[h_index]) {
      node_id_per_hxv_indexes[h_index].forEach(node_id => {
        horizontal_positions[node_id] = h_index
      })
    }
  }

  // Analyser chaque flux
  da.sankey.visible_links_list.forEach(link => {
    if (link.shape_is_recycling) {
      // Ignorer les liens de recyclage
      return
    }
    const source_pos = horizontal_positions[link.source.id]
    const target_pos = horizontal_positions[link.target.id]

    if (source_pos !== undefined && target_pos !== undefined) {
      const crossed_nodes: string[] = []

      // Identifier les nœuds entre source et target
      const min_pos = Math.min(source_pos, target_pos)
      const max_pos = Math.max(source_pos, target_pos)

      for (let h_index = min_pos + 1; h_index < max_pos; h_index++) {
        if (node_id_per_hxv_indexes[h_index]) {
          node_id_per_hxv_indexes[h_index].forEach(node_id => {
            crossed_nodes.push(node_id)

            if (!nodes_crossed_by[node_id]) {
              nodes_crossed_by[node_id] = []
            }
            nodes_crossed_by[node_id].push(link.id)
          })
        }
      }

      if (crossed_nodes.length > 0) {
        crossing_flows.push({
          source_id: link.source.id,
          target_id: link.target.id,
          crossed_nodes,
          link_id: link.id
        })
      }
    }
  })

  return { crossing_flows, nodes_crossed_by }
}

/**
 * Calcule les ajustements de position Y pour éviter les croisements. Ajuste à la fois les nœuds
 * traversés (vers le bas) et les nœuds targets (vers le haut). Fonction pure sur ses entrées.
 */
function calculateColumnAdjustments(
  horizontal_index: number,
  column_node_ids: string[],
  crossing_analysis: CrossingAnalysis,
  v_margin: number
): { [node_id: string]: number } {
  const adjustments: { [node_id: string]: number } = {}

  // ÉTAPE 1: Ajuster les nœuds traversés (descendre)
  column_node_ids.forEach(node_id => {
    const crossings = crossing_analysis.nodes_crossed_by[node_id] || []

    if (crossings.length > 0) {
      // Ce nœud est traversé par des flux - le descendre
      const crossing_penalty = crossings.length * v_margin * 0.5
      adjustments[node_id] = crossing_penalty

    }
  })

  // ÉTAPE 2: Ajuster les nœuds targets des flux qui traversent (monter)
  crossing_analysis.crossing_flows.forEach(flow => {
    // Si le target de ce flux est dans la colonne actuelle
    if (column_node_ids.includes(flow.target_id)) {
      const target_adjustment = -v_margin * 0.5 * flow.crossed_nodes.length // Valeur négative = monter

      // Cumuler les ajustements si le nœud est déjà ajusté
      if (adjustments[flow.target_id]) {
        adjustments[flow.target_id] += target_adjustment
      } else {
        adjustments[flow.target_id] = target_adjustment
      }

    }

    // BONUS: Ajuster aussi le nœud source si nécessaire
    if (column_node_ids.includes(flow.source_id)) {
      const source_adjustment = -v_margin * 0.5 // Ajustement plus léger pour le source

      if (adjustments[flow.source_id]) {
        adjustments[flow.source_id] += source_adjustment
      } else {
        adjustments[flow.source_id] = source_adjustment
      }

    }
  })

  return adjustments
}
