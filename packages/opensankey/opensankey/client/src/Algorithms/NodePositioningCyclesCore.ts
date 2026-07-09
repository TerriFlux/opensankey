// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #243 c8 — SOCLE « cycles + index horizontal », partagé par les DEUX algorithmes de placement :
//   - `computeAutoSankey` (calcule position_x),
//   - `computeParametrization` -> `detectAllCyclesAndOptimize` (calcule position_u).
// La divergence historique entre les deux est EN AVAL ; le socle, lui, est commun. L'extraire une
// seule fois est le prealable a leur unification (opensankey#1253).
//
// Sous-service compose detenu par NodePositioning : le champ s'appelle `drawingArea` pour que les
// corps de methodes soient deplaces VERBATIM (aucune reecriture interne, `this.drawingArea` et les
// appels entre methodes du socle restent tels quels). NodePositioning conserve des delegateurs.

import type { Class_DrawingArea } from '../types/DrawingArea'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'

export class NodePositioningCyclesCore {
  public readonly drawingArea: Class_DrawingArea

  constructor(drawingArea: Class_DrawingArea) {
    this.drawingArea = drawingArea
  }

  /**
   * Algorithme hybride optimisé qui détecte les cycles ET repositionne les nœuds
   */
  public detectAllCyclesAndOptimize(nodes_to_process: Class_NodeElement[]): {
    recycling_links: string[],
    horizontal_indexes: { [node_id: string]: number }
  } {
    console.log('🔍 Début de la détection de cycles avec optimisation des positions...')

    // Étape 1: Calculer les profondeurs initiales (comme d3-sankey-circular)
    const nodeDepths = this.calculateNodeDepths(nodes_to_process)
    console.log('📊 Profondeurs calculées:', nodeDepths)

    // Étape 2: Identifier TOUS les liens potentiellement circulaires
    const potential_recycling_links: string[] = []
    nodes_to_process.forEach(sourceNode => {
      sourceNode.output_links_list
        .filter(link => {
          const target = this.drawingArea.sankey.links_dict[link.id].target
          return nodes_to_process.some(n => n.id === target.id)
        })
        .forEach(link => {
          const targetNode = this.drawingArea.sankey.links_dict[link.id].target
          const sourceDepth = nodeDepths[sourceNode.id] || 0
          const targetDepth = nodeDepths[targetNode.id] || 0

          // Si source >= target dans la profondeur, c'est potentiellement circulaire
          if (sourceDepth >= targetDepth) {
            potential_recycling_links.push(link.id)
            console.log('🔄 Lien potentiellement circulaire:', link.id,
              `(${sourceNode.id}[depth:${sourceDepth}] → ${targetNode.id}[depth:${targetDepth}])`)
          }
        })
    })

    console.log('🔄 Liens potentiellement circulaires détectés:', potential_recycling_links)

    // Étape 3: Initialiser les index horizontaux avec les profondeurs
    const horizontal_indexes: { [node_id: string]: number } = {}
    nodes_to_process.forEach(node => {
      horizontal_indexes[node.id] = nodeDepths[node.id] || 0
    })

    console.log('📊 Index horizontaux initiaux (basés sur profondeurs):', horizontal_indexes)

    // Étape 4: Utiliser la logique d'optimisation pour choisir les meilleurs liens de recyclage
    const final_recycling_links: string[] = []

    potential_recycling_links.forEach(link_id => {
      const link = this.drawingArea.sankey.links_dict[link_id]

      console.log(`🔧 Test d'optimisation pour le lien: ${link_id}`)

      // Appliquer la logique d'optimisation
      const result = this.optimizeRecyclingLink(
        nodes_to_process,
        link,
        final_recycling_links,
        horizontal_indexes
      )

      if (!result.wasOptimized) {
        // Le lien n'a pas pu être optimisé, c'est le bon lien de recyclage
        final_recycling_links.push(link_id)
        console.log('♻️ Lien de recyclage final sélectionné:', link_id)
      } else {
        console.log('✅ Lien optimisé (repositionné):', link_id)

        // Si une optimisation a créé un nouveau lien de recyclage, l'ajouter
        if (result.newRecyclingLink) {
          final_recycling_links.push(result.newRecyclingLink)
          console.log('♻️ Nouveau lien de recyclage après optimisation:', result.newRecyclingLink)
        }
      }
    })

    console.log('🎯 Index horizontaux optimisés finaux:', horizontal_indexes)
    console.log('♻️ Liens de recyclage finaux:', final_recycling_links)

    return {
      recycling_links: final_recycling_links,
      horizontal_indexes: horizontal_indexes
    }
  }

  /**
   * Adapte la logique de computeRecyclingHorizontalIndex pour l'optimisation
   * Retourne le nouveau lien de recyclage si une optimisation a eu lieu
   */
  private optimizeRecyclingLink(
    nodes_to_process: Class_NodeElement[],
    link: Class_LinkElement,
    recycling_links_ids: string[],
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number }
  ): { wasOptimized: boolean, newRecyclingLink?: string } {
    const target_node_id = link.target.id
    const source_node_id = link.source.id

    // Vérifier si on peut optimiser ce lien
    if (horizontal_indexes_per_nodes_ids[source_node_id] >=
      horizontal_indexes_per_nodes_ids[target_node_id]) {

      // Chercher un gap dans les index des prédécesseurs
      const indexes_before_source_node: number[] = []
      let min_index = -1

      this.drawingArea.sankey.nodes_dict[source_node_id]
        .input_links_list
        .forEach(input_link => {
          const index = horizontal_indexes_per_nodes_ids[
            this.drawingArea.sankey.links_dict[input_link.id].source.id
          ]
          if (min_index >= 0) {
            if (index < min_index) {
              min_index = index
            }
          } else {
            min_index = index
          }
          indexes_before_source_node.push(index)
        })

      // Chercher un gap et optimiser si possible
      const horizontal_index_of_source_node = horizontal_indexes_per_nodes_ids[source_node_id]
      for (let index = min_index + 1; index < horizontal_index_of_source_node; index++) {
        if (!indexes_before_source_node.includes(index)) {
          // Gap trouvé ! On peut optimiser ce nœud
          console.log(`🔧 Optimisation pour ${source_node_id}: ${horizontal_index_of_source_node} → ${index}`)
          horizontal_indexes_per_nodes_ids[source_node_id] = index

          // Recalculer les index pour les nœuds suivants
          this.computeHorizontalIndex(
            this.drawingArea.sankey.nodes_dict[source_node_id],
            nodes_to_process,
            index,
            [],
            recycling_links_ids,
            horizontal_indexes_per_nodes_ids
          )

          // NOUVEAU : Chercher le nouveau lien de recyclage créé
          let newRecyclingLink: string | undefined

          // Parcourir tous les liens pour trouver celui qui est maintenant circulaire
          nodes_to_process.forEach(node => {
            node.output_links_list.forEach(outLink => {
              const target = this.drawingArea.sankey.links_dict[outLink.id].target
              if (nodes_to_process.some(n => n.id === target.id)) {
                const sourceIndex = horizontal_indexes_per_nodes_ids[node.id]
                const targetIndex = horizontal_indexes_per_nodes_ids[target.id]

                // Si on trouve un nouveau lien circulaire
                if (sourceIndex >= targetIndex && outLink.id !== link.id) {
                  newRecyclingLink = outLink.id
                  console.log(`🔄 Nouveau lien de recyclage détecté après optimisation: ${outLink.id}`)
                }
              }
            })
          })

          return { wasOptimized: true, newRecyclingLink }
        }
      }
    }

    return { wasOptimized: false }
  }

  /**
   * Calcule la profondeur (depth) de chaque nœud en ignorant les cycles potentiels
   */
  private calculateNodeDepths(nodes_to_process: Class_NodeElement[]): { [nodeId: string]: number } {
    const depths: { [nodeId: string]: number } = {}
    const visited = new Set<string>()
    const visiting = new Set<string>() // Pour détecter les cycles temporairement

    const calculateDepth = (nodeId: string): number => {
      if (visited.has(nodeId)) {
        return depths[nodeId] || 0
      }

      if (visiting.has(nodeId)) {
        // Cycle détecté pendant le calcul - on retourne une profondeur arbitraire
        return 0
      }

      visiting.add(nodeId)

      const node = this.drawingArea.sankey.nodes_dict[nodeId]
      if (!node) {
        visiting.delete(nodeId)
        return 0
      }

      // Si le nœud n'a pas de liens entrants, sa profondeur est 0
      const incomingLinks = node.input_links_list.filter(link=>link.is_visible).filter(link =>
        nodes_to_process.some(n => n.id === this.drawingArea.sankey.links_dict[link.id].source.id)
      )

      if (incomingLinks.length === 0) {
        depths[nodeId] = 0
      } else {
        // La profondeur est 1 + la profondeur maximale des prédécesseurs
        let maxPredecessorDepth = -1
        incomingLinks.forEach(link => {
          const sourceId = this.drawingArea.sankey.links_dict[link.id].source.id
          const predecessorDepth = calculateDepth(sourceId)
          maxPredecessorDepth = Math.max(maxPredecessorDepth, predecessorDepth)
        })
        depths[nodeId] = maxPredecessorDepth + 1
      }

      visited.add(nodeId)
      visiting.delete(nodeId)

      return depths[nodeId]
    }

    // Calculer la profondeur pour tous les nœuds
    nodes_to_process.forEach(node => {
      if (!visited.has(node.id)) {
        calculateDepth(node.id)
      }
    })

    return depths
  }

  /**
   * Explore all node's branches to compute all their nodes horizontal index
   *
   * @param {Class_NodeElement} start_node Node to start exploring from
   * @param {Class_NodeElement[]} nodes_to_process
   * @param {number} starting_index
   * @param {string[]} _visited_nodes_ids Unused (kept for API compatibility)
   * @param {string[]} recycling_links_ids Links (by their id) that are detected as recycling link
   * @param {object} horizontal_indexes_per_nodes_ids Current horizontal index for given node id
   */
  public computeHorizontalIndex(
    start_node: Class_NodeElement,
    nodes_to_process: Class_NodeElement[],
    starting_index: number,
    _visited_nodes_ids: string[],
    recycling_links_ids: string[],
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number }
  ) {
    const nodes_set = new Set(nodes_to_process.map(n => n.id))
    const recycling_set = new Set(recycling_links_ids)

    // Phase 1 : DFS itératif — détection de cycles + ordre topologique
    const color = new Map<string, 'gray' | 'black'>()
    const topo_order: Class_NodeElement[] = []
    const dfs_stack: [Class_NodeElement, 'enter' | 'exit'][] = [[start_node, 'enter']]

    while (dfs_stack.length > 0) {
      const [node, phase] = dfs_stack.pop()!

      if (phase === 'exit') {
        color.set(node.id, 'black')
        topo_order.push(node)
        continue
      }

      const c = color.get(node.id)
      if (c === 'black' || c === 'gray') continue

      color.set(node.id, 'gray')
      dfs_stack.push([node, 'exit'])

      node.output_links_list.forEach(link => {
        const link_data = this.drawingArea.sankey.links_dict[link.id]
        if (!link_data) return
        const target_id = link_data.target.id
        if (!nodes_set.has(target_id) || recycling_set.has(link.id)) return

        const c_target = color.get(target_id)
        if (c_target === 'gray') {
          recycling_links_ids.push(link.id)
          recycling_set.add(link.id)
        } else if (c_target !== 'black') {
          dfs_stack.push([this.drawingArea.sankey.nodes_dict[target_id], 'enter'])
        }
      })
    }

    // Phase 2 : relaxation en ordre topologique (topo_order[last] = start_node)
    if (horizontal_indexes_per_nodes_ids[start_node.id] === undefined ||
        starting_index > horizontal_indexes_per_nodes_ids[start_node.id]) {
      horizontal_indexes_per_nodes_ids[start_node.id] = starting_index
    }

    for (let i = topo_order.length - 1; i >= 0; i--) {
      const node = topo_order[i]
      const node_idx = horizontal_indexes_per_nodes_ids[node.id]
      if (node_idx === undefined) continue

      node.output_links_list.forEach(link => {
        const link_data = this.drawingArea.sankey.links_dict[link.id]
        if (!link_data) return
        const target_id = link_data.target.id
        if (!nodes_set.has(target_id) || recycling_set.has(link.id)) return

        const proposed = node_idx + 1
        if (proposed > (horizontal_indexes_per_nodes_ids[target_id] ?? -Infinity)) {
          horizontal_indexes_per_nodes_ids[target_id] = proposed
        }
      })
    }
  }

  /**
   * Recompute index for link tagged as recycling links
   * We need to recompute positioning of next_node,
   * because of recycling link, its position can be all wrong
   *
   * @param {Class_NodeElement[]} nodes_to_process
   * @param {Class_LinkElement} link Link that has been previously tagged as possible recycling link
   * @param {string[]} recycling_links_ids Links (by their id) that are detected as recycling link
   * @param {object} horizontal_indexes_per_nodes_ids Current index for given node id
   */
  public computeRecyclingHorizontalIndex(
    nodes_to_process: Class_NodeElement[],
    link: Class_LinkElement,
    recycling_links_ids: string[],
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number }
  ) {
    // Get id for source and target
    const target_node_id = link.target.id
    const source_node_id = link.source.id

    // Compute only if horizontal indexes for source >= horizontal index for target
    // which can not be the case if these nodes' indexes have been reprocessed
    // by this same function
    if (horizontal_indexes_per_nodes_ids[source_node_id] >=
      horizontal_indexes_per_nodes_ids[target_node_id]) {
      // For source node, check if there is a gap
      // between its horizontal index and all the horizontal
      // indexes of nodes that are sources of its own inputs links
      const indexes_before_source_node: number[] = []
      let min_index = -1
      this.drawingArea.sankey.nodes_dict[source_node_id]
        .input_links_list
        .forEach(input_link => {
          const index = horizontal_indexes_per_nodes_ids[this.drawingArea.sankey.links_dict[input_link.id].source.id]
          if (min_index >= 0) {
            if (index < min_index) {
              min_index = index
            }
          }
          else {
            min_index = index
          }
          indexes_before_source_node.push(index)
        })

      // If there is a gap, we recompute source node horizontal indexing
      const horizontal_index_of_source_node = horizontal_indexes_per_nodes_ids[source_node_id]
      for (let index = min_index + 1; index < horizontal_index_of_source_node; index++) {
        // Gap check here
        if (!indexes_before_source_node.includes(index)) {
          horizontal_indexes_per_nodes_ids[source_node_id] = index
          // TODO force indexing for following nodes
          this.computeHorizontalIndex(
            this.drawingArea.sankey.nodes_dict[source_node_id],
            nodes_to_process,
            index,
            [],
            recycling_links_ids,
            horizontal_indexes_per_nodes_ids
          )
          break
        }
      }
    }
  }

  /**
   * Version améliorée de computeHorizontalIndex qui évite les problèmes de positionnement.
   * Algorithme : DFS itératif pour tri topologique + détection de cycles,
   * puis relaxation en une passe (chemin le plus long). O(V+E).
   */
  public computeHorizontalIndexImproved(
    start_node: Class_NodeElement,
    nodes_to_process: Class_NodeElement[],
    starting_index: number,
    _initial_visited: string[],
    recycling_links_ids: string[],
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number }
  ) {
    const nodes_set = new Set(nodes_to_process.map(n => n.id))
    const recycling_set = new Set(recycling_links_ids)

    // Phase 1 : DFS itératif — détection de cycles + ordre topologique
    // Couleurs : undefined = non visité, 'gray' = en cours, 'black' = terminé
    const color = new Map<string, 'gray' | 'black'>()
    const topo_order: Class_NodeElement[] = []
    const dfs_stack: [Class_NodeElement, 'enter' | 'exit'][] = [[start_node, 'enter']]

    while (dfs_stack.length > 0) {
      const [node, phase] = dfs_stack.pop()!

      if (phase === 'exit') {
        color.set(node.id, 'black')
        topo_order.push(node)  // post-order = topologique inversé
        continue
      }

      const c = color.get(node.id)
      if (c === 'black' || c === 'gray') continue  // déjà traité ou en cours

      color.set(node.id, 'gray')
      dfs_stack.push([node, 'exit'])

      node.output_links_list.forEach(link => {
        const link_data = this.drawingArea.sankey.links_dict[link.id]
        if (!link_data || !link.is_visible_ignoring_zero) return
        const target_id = link_data.target.id
        if (!nodes_set.has(target_id) || recycling_set.has(link.id)) return

        const c_target = color.get(target_id)
        if (c_target === 'gray') {
          // Arête arrière = cycle -> lien de recyclage
          recycling_links_ids.push(link.id)
          recycling_set.add(link.id)
        } else if (c_target !== 'black') {
          dfs_stack.push([this.drawingArea.sankey.nodes_dict[target_id], 'enter'])
        }
      })
    }

    // Phase 2 : relaxation en ordre topologique (topo_order[last] = start_node)
    // Initialiser le nœud de départ si pas encore assigné
    if (horizontal_indexes_per_nodes_ids[start_node.id] < 0) {
      horizontal_indexes_per_nodes_ids[start_node.id] = starting_index
    }

    // Parcourir en sens inverse de topo_order = ordre topologique réel
    for (let i = topo_order.length - 1; i >= 0; i--) {
      const node = topo_order[i]
      const node_idx = horizontal_indexes_per_nodes_ids[node.id]
      if (node_idx < 0) continue  // nœud non initialisé (non atteignable depuis les sources)

      node.output_links_list.forEach(link => {
        const link_data = this.drawingArea.sankey.links_dict[link.id]
        if (!link_data || !link.is_visible_ignoring_zero) return
        const target_id = link_data.target.id
        if (!nodes_set.has(target_id) || recycling_set.has(link.id)) return

        const proposed = node_idx + 1
        if (proposed > horizontal_indexes_per_nodes_ids[target_id]) {
          horizontal_indexes_per_nodes_ids[target_id] = proposed
        }
      })
    }
  }

  /**
   * Repositionnement des nœuds sans entrée (logique existante préservée)
   */
  public repositionNodesWithoutInputs(
    nodes_per_horizontal_indexes: { [index: number]: Class_NodeElement[] },
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
    max_horizontal_index: number
  ) {
    for (let horizontal_index = 0; horizontal_index <= max_horizontal_index; horizontal_index++) {
      if (!nodes_per_horizontal_indexes[horizontal_index]) {
        continue
      }

      const to_splice: Class_NodeElement[] = []

      nodes_per_horizontal_indexes[horizontal_index].forEach(node => {
        if (!node.hasInputLinks()) {
          let min_next_horizontal_index = max_horizontal_index + 1

          node.output_links_list.forEach(link => {
            if (this.drawingArea.sankey.nodes_dict[this.drawingArea.sankey.links_dict[link.id].source.id].is_visible &&
              this.drawingArea.sankey.nodes_dict[this.drawingArea.sankey.links_dict[link.id].target.id].is_visible) {

              const target_node = this.drawingArea.sankey.nodes_dict[this.drawingArea.sankey.links_dict[link.id].target.id]
              if (target_node === undefined) return

              if (horizontal_indexes_per_nodes_ids[target_node.id] < horizontal_indexes_per_nodes_ids[node.id]) {
                return
              }

              if (horizontal_indexes_per_nodes_ids[target_node.id] < min_next_horizontal_index) {
                min_next_horizontal_index = horizontal_indexes_per_nodes_ids[target_node.id]
              }
            }
          })

          if (horizontal_indexes_per_nodes_ids[node.id] < min_next_horizontal_index - 1) {
            to_splice.push(node)
            horizontal_indexes_per_nodes_ids[node.id] = Math.max(0, min_next_horizontal_index - 1) // Éviter les index négatifs

            if (!nodes_per_horizontal_indexes[min_next_horizontal_index - 1]) {
              nodes_per_horizontal_indexes[min_next_horizontal_index - 1] = []
            }
            nodes_per_horizontal_indexes[min_next_horizontal_index - 1].push(node)

            console.log(`🔧 Repositionnement nœud sans entrée ${node.id}: index ${min_next_horizontal_index - 1}`)
          }
        }
      })

      to_splice.forEach(node => {
        const index = nodes_per_horizontal_indexes[horizontal_index].indexOf(node)
        if (index > -1) {
          nodes_per_horizontal_indexes[horizontal_index].splice(index, 1)
        }
      })
    }
  }
}
