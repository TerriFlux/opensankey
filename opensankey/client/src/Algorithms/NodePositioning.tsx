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


import {
  Class_NodeElement
} from '../Elements/Node'
import {
  Class_LinkElement
} from '../Elements/Link'
import { Class_LevelTag, Class_Tag } from '../types/Tag'
import { Class_DataTagGroup } from '../types/TagGroup'
import { Class_DrawingArea } from '../types/DrawingArea'
import { PAPER_TARGET_FONT_SIZES } from '../Elements/ElementsAttributesConfig'
import { NodeImportExportAboveBelowStyle, NodeImportExportCloseStyle, NodeSectorStyle } from '../Elements/ElementStyle'


/**
 * Class responsible for node and link positioning logic
 * Handles auto-sankey computation, parametrization, and trade arrangements
 */
export class NodePositioning {
  private drawingArea: Class_DrawingArea

  constructor(drawingArea: Class_DrawingArea) {
    this.drawingArea = drawingArea
  }


  // POSITIONING COMPUTATION METHODS ===================================================

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
   * Finalise le positionnement après le calcul des index horizontaux
   * Commun aux deux algorithmes
   * @private
   */
  private _finishPositioning(
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
    recycling_links_ids: string[],
    launched_from_process: boolean,
    echangeTag?: Class_Tag
  ) {
    // Use results from previous index computing
    let max_horizontal_index = 0
    const nodes_per_horizontal_indexes: { [index: number]: Class_NodeElement[] } = {}

    this.drawingArea.sankey.visible_nodes_list.forEach(node => {
      // Previously computed index for given node
      const node_index = horizontal_indexes_per_nodes_ids[node.id]
      // Update reversed dict index-> nodes
      if (!nodes_per_horizontal_indexes[node_index]) {
        nodes_per_horizontal_indexes[node_index] = []
      }
      nodes_per_horizontal_indexes[node_index].push(this.drawingArea.sankey.nodes_dict[node.id])
      // Update max horizontal index
      if (node_index > max_horizontal_index) {
        max_horizontal_index = node_index
      }


      // Algorithme d3-sankey-circular - les liens sont déjà marqués.
      // Ne pas écraser le statut des liens dont le recyclage est verrouillé.
      Object.values(this.drawingArea.sankey.nodes_dict[node.id].output_links_list)
        .forEach(link => {
          const link_data = this.drawingArea.sankey.links_dict[link.id]
          if (link_data.shape_is_recycling_locked === true) return
          if (!recycling_links_ids.includes(link.id)) {
            link_data.shape_is_recycling = false
          }
        })
    })

    // Handle nodes with no input links
    this.adjustNodesWithoutInputs(
      nodes_per_horizontal_indexes,
      horizontal_indexes_per_nodes_ids,
      max_horizontal_index
    )

    // Position nodes based on computed indexes
    this.positionNodesFromIndexes(
      nodes_per_horizontal_indexes,
      horizontal_indexes_per_nodes_ids,
      max_horizontal_index,
      launched_from_process,
      echangeTag
    )

    // NOUVEAU : Calculer automatiquement shape_middle_recycling après positionnement
    if (recycling_links_ids.length > 0) {
      this.computeRecyclingMiddleShape(recycling_links_ids)
    }
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
   * Version améliorée de computeAutoSankey qui corrige le positionnement
   * en gardant la logique existante
   */
  public computeAutoSankey(
    launched_from_process: boolean,
    optimize_crossing: boolean,
    h_spacing?: number,
    v_spacing?: number,
    sources_mode: 'before_neighbor' | 'left_extremity' = 'before_neighbor',
    sinks_mode: 'after_neighbor' | 'right_extremity' = 'after_neighbor',
    skip_horizontal: boolean = false,
    skip_vertical: boolean = false,
    apply_target_fonts: boolean = true
  ) {
    console.log('🔧 Calcul automatique des positions - version améliorée')
    this.drawingArea.bypass_redraws = true
    // Calculate max value of flows (inchangé)
    const unit_taggs = this.drawingArea.sankey.getTagGroupsAsList('data_taggs').filter(tagg => tagg.is_unit) as Class_DataTagGroup[]
    if (unit_taggs.length > 0) {
      const selectedTag = unit_taggs[0].tags_list.filter(tag => tag.is_selected)[0]
      unit_taggs[0].tags_list.forEach(tag => {
        unit_taggs[0].tags_list.forEach(tag2 => tag2.setUnSelected())
        tag.setSelected()
        let linksMaxValue = 0
        this.drawingArea.sankey.links_list.forEach(link => {
          const linkMaxValue = link.getMaxValue()
          linksMaxValue = Math.max(
            linksMaxValue,
            linkMaxValue ? linkMaxValue : 0
          )
        })
        linksMaxValue += 1
        if (launched_from_process) {
          tag.scale = linksMaxValue
        }
      })
      unit_taggs[0].tags_list.forEach(tag2 => tag2.setUnSelected())
      selectedTag.setSelected()
    }
    if (launched_from_process) {
      this.computeScale()
    }

    let is_zero = true
    this.drawingArea.sankey.links_list.forEach(l => is_zero = is_zero && l.is_zero)
    if (is_zero) { this.drawingArea.data_source = 'structure' }

    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ?
      this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    const nodes_to_process = this.drawingArea.sankey.visible_nodes_list.filter(n =>
      !echangeTag || !n.hasGivenTag(echangeTag))

    const horizontal_indexes_per_nodes_ids: { [node_id: string]: number } = {}
    let max_horizontal_index = 0
    let nodes_per_horizontal_indexes: { [index: number]: Class_NodeElement[] } = {}

    if (skip_horizontal) {
      // Skip horizontal recalculation — use existing position_u values
      const has_valid_u = nodes_to_process.some(n => n.position_u > 0)
      if (!has_valid_u) {
        this.inferPositionUFromX()
        this.computeParametrization(false)
      }
      // Build structures from existing U (position_u is 1-based, h_index is 0-based)
      nodes_to_process.forEach(node => {
        const u = Math.max(0, node.position_u - 1)
        horizontal_indexes_per_nodes_ids[node.id] = u
        if (!nodes_per_horizontal_indexes[u]) nodes_per_horizontal_indexes[u] = []
        nodes_per_horizontal_indexes[u].push(node)
        if (u > max_horizontal_index) max_horizontal_index = u
      })
      // Mark recycling links — sauf si l'utilisateur a verrouillé le statut.
      nodes_to_process.forEach(node => {
        const node_index = horizontal_indexes_per_nodes_ids[node.id]
        node.output_links_list.forEach(link => {
          const link_data = this.drawingArea.sankey.links_dict[link.id]
          if (link_data.shape_is_recycling_locked === true) return
          const target_node_id = link_data.target.id
          const target_index = horizontal_indexes_per_nodes_ids[target_node_id]
          if (target_index !== undefined && node_index >= target_index) {
            link_data.shape_is_recycling = true
          } else {
            link_data.shape_is_recycling = false
          }
        })
      })
    } else {
      // ÉTAPE 1: Calcul des index horizontaux - VERSION AMÉLIORÉE
      const possible_recycling_links_ids: string[] = []

      // Pré-amorçage : les liens dont le statut recyclage est verrouillé par
      // l'utilisateur (shape_is_recycling_locked === true et shape_is_recycling
      // === true) sont injectés dans la liste des liens recyclage avant le DFS.
      // Ainsi, la détection de cycles les considère déjà coupés et ne descend
      // pas par eux pour calculer les index horizontaux.
      this.drawingArea.sankey.visible_links_list.forEach(link => {
        if (link.shape_is_recycling_locked === true && link.shape_is_recycling === true) {
          possible_recycling_links_ids.push(link.id)
        }
      })

      // Initialiser tous les nœuds à index -1
      nodes_to_process.forEach(node => {
        horizontal_indexes_per_nodes_ids[node.id] = -1
      })

      // Identifier et traiter les nœuds sources en priorité
      const source_nodes = nodes_to_process.filter(node => !node.hasVisibleInputLinks() && node.hasVisibleOutputLinks())
      const lone_nodes = nodes_to_process.filter(node => !node.hasVisibleInputLinks() && !node.hasVisibleOutputLinks())

      console.log('source nodes:', source_nodes.map(n => n.id))
      console.log('lone nodes:', lone_nodes.map(n => n.id))

      // Traiter les nœuds sources
      source_nodes.forEach(node => {
        if (horizontal_indexes_per_nodes_ids[node.id] === -1) {
          this.computeHorizontalIndexImproved(
            node,
            nodes_to_process,
            0, // Commencer à 0 pour les sources
            [],
            possible_recycling_links_ids,
            horizontal_indexes_per_nodes_ids
          )
        }
      })

      // Traiter les nœuds isolés
      lone_nodes.forEach(node => {
        horizontal_indexes_per_nodes_ids[node.id] = 0
      })

      // Traiter les nœuds restants (composantes isolées avec cycles)
      nodes_to_process.forEach(node => {
        if (horizontal_indexes_per_nodes_ids[node.id] === -1) {
          this.computeHorizontalIndexImproved(
            node,
            nodes_to_process,
            0,
            [],
            possible_recycling_links_ids,
            horizontal_indexes_per_nodes_ids
          )
        }
      })

      // ÉTAPE 2: Double vérification des liens de recyclage (logique existante)
      const checked_recycling_links_ids: string[] = []
      possible_recycling_links_ids.forEach(link_id => {
        this.computeRecyclingHorizontalIndex(
          nodes_to_process,
          this.drawingArea.sankey.links_dict[link_id],
          checked_recycling_links_ids,
          horizontal_indexes_per_nodes_ids
        )
      })

      // ÉTAPE 2 bis: Forcer l'index horizontal des nœuds dont la colonne est verrouillée.
      nodes_to_process.forEach(node => {
        if (node.shape_position_u_locked === true) {
          const locked_index = Math.max(0, Math.round(node.position_u) - 1)
          horizontal_indexes_per_nodes_ids[node.id] = locked_index
        }
      })

      // ÉTAPE 3: Construction des structures de données (logique existante)
      this.drawingArea.sankey.visible_nodes_list.forEach(node => {
        const node_index = horizontal_indexes_per_nodes_ids[node.id]

        if (node_index !== undefined && node_index >= 0) {
          if (!nodes_per_horizontal_indexes[node_index]) {
            nodes_per_horizontal_indexes[node_index] = []
          }
          nodes_per_horizontal_indexes[node_index].push(this.drawingArea.sankey.nodes_dict[node.id])

          if (node_index > max_horizontal_index) {
            max_horizontal_index = node_index
          }

          // Marquer les liens de recyclage — sauf si l'utilisateur a verrouillé le statut.
          node.output_links_list.forEach(link => {
            const link_data = this.drawingArea.sankey.links_dict[link.id]
            if (link_data.shape_is_recycling_locked === true) return
            const target_node_id = link_data.target.id
            const target_index = horizontal_indexes_per_nodes_ids[target_node_id]

            if (target_index !== undefined && node_index >= target_index) {
              link_data.shape_is_recycling = true
            } else {
              link_data.shape_is_recycling = false
            }
          })
        }
      })

      // ÉTAPE 3 bis: Mode 'right_extremity'
      if (sinks_mode === 'right_extremity') {
        const sink_nodes = nodes_to_process.filter(node =>
          !node.hasVisibleOutputLinks() && node.hasVisibleInputLinks())
        if (sink_nodes.length > 0) {
          sink_nodes.forEach(node => {
            const old_index = horizontal_indexes_per_nodes_ids[node.id]
            if (old_index === undefined || old_index < 0) return
            if (old_index === max_horizontal_index) return
            if (nodes_per_horizontal_indexes[old_index]) {
              const i = nodes_per_horizontal_indexes[old_index].indexOf(node)
              if (i > -1) nodes_per_horizontal_indexes[old_index].splice(i, 1)
            }
            horizontal_indexes_per_nodes_ids[node.id] = max_horizontal_index
            if (!nodes_per_horizontal_indexes[max_horizontal_index]) {
              nodes_per_horizontal_indexes[max_horizontal_index] = []
            }
            nodes_per_horizontal_indexes[max_horizontal_index].push(node)
          })
        }
      }

      // ÉTAPE 4: Repositionnement des nœuds sans entrée (sauf si mode 'left_extremity')
      if (sources_mode !== 'left_extremity') {
        this.repositionNodesWithoutInputs(
          nodes_per_horizontal_indexes,
          horizontal_indexes_per_nodes_ids,
          max_horizontal_index
        )
      }
    }

    nodes_per_horizontal_indexes = Object.fromEntries(
      Object.entries(nodes_per_horizontal_indexes).filter(([_, value]) => value.length > 0)
    )

    // ÉTAPE 5: Calcul des positions finales (logique existante)
    this.computeFinalPositions(
      nodes_per_horizontal_indexes,
      horizontal_indexes_per_nodes_ids,
      max_horizontal_index,
      optimize_crossing,
      h_spacing,
      v_spacing,
      skip_vertical,
      apply_target_fonts
    )

    const tmp = this.drawingArea.sankey.nodes_list.filter(n =>
      !echangeTag || !n.hasGivenTag(echangeTag))
    tmp.forEach(n => this.setNodeLabelPositioning(n))

    // Paper mode: two-pass — render first, measure real bbox, then scale to fill paper
    if (this.drawingArea.is_paper_mode && this.drawingArea.paper_format !== 'free') {
      this.drawingArea.bypass_redraws = false
      this.drawingArea.drawElements()

      const bbox = this.drawingArea.d3_selection_elements_group?.node()?.getBBox()
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        const pad_left = Class_DrawingArea.mmToPx(this.drawingArea.margin_left_mm)
        const pad_right = Class_DrawingArea.mmToPx(this.drawingArea.margin_right_mm)
        const pad_top = Class_DrawingArea.mmToPx(this.drawingArea.margin_top_mm)
        const pad_bottom = Class_DrawingArea.mmToPx(this.drawingArea.margin_bottom_mm)
        const paper_w = this.drawingArea.width
        const paper_h = this.drawingArea.height

        // Target area: paper minus margins
        const target_left = pad_left
        const target_right = paper_w - pad_right
        const target_top = pad_top
        const target_bottom = paper_h - pad_bottom
        const target_w = target_right - target_left
        const target_h = target_bottom - target_top

        // Current content extent
        const content_left = bbox.x
        const content_w = bbox.width
        const content_top = bbox.y
        const content_h = bbox.height

        // Scale X: stretch/compress so content fills target width
        const scale_x = content_w > 0 ? target_w / content_w : 1
        // Scale Y: stretch/compress so content fills target height
        const scale_y = content_h > 0 ? target_h / content_h : 1

        // Apply: remap each node position from [content_left..content_right] to [target_left..target_right]
        nodes_to_process.forEach(n => {
          n.position_x = (n.position_x - content_left) * scale_x + target_left
          n.position_y = (n.position_y - content_top) * scale_y + target_top
        })

        this.drawingArea.drawElements()
      }
    }
  }

  public computeScale() {
    let linksMaxValue = 0
    this.drawingArea.sankey.links_list.forEach(link => {
      const linkMaxValue = link.getMaxValue()
      linksMaxValue = Math.max(
        linksMaxValue,
        linkMaxValue ? linkMaxValue : 0
      )
    })
    linksMaxValue += 1

    this.drawingArea.scale = this.drawingArea.maximum_flux ?
      Math.max(this.drawingArea.maximum_flux, linksMaxValue) : linksMaxValue
  }

  /**
   * Version améliorée de computeHorizontalIndex qui évite les problèmes de positionnement.
   * Algorithme : DFS itératif pour tri topologique + détection de cycles,
   * puis relaxation en une passe (chemin le plus long). O(V+E).
   */
  private computeHorizontalIndexImproved(
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
        if (!link_data || !link.is_visible) return
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
        if (!link_data || !link.is_visible) return
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
  private repositionNodesWithoutInputs(
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

  /**
   * Calcul des positions finales (extrait de la logique existante)
   */
  private computeFinalPositions(
    nodes_per_horizontal_indexes: { [index: number]: Class_NodeElement[] },
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
    max_horizontal_index: number,
    optimize_crossing: boolean,
    h_spacing?: number,
    v_spacing?: number,
    skip_vertical: boolean = false,
    apply_target_fonts: boolean = true
  ) {
    // Utiliser la logique existante de positionnement vertical
    // mais avec les corrections de la méthode updateNodesPositions précédente

    const height_per_nodes_ids: { [node_id: string]: number } = {}
    const height_cumul_per_indexes: number[] = []
    const node_id_per_hxv_indexes: string[][] = []
    let max_height_cumul = 0
    let prev_col_width = 0

    // Paper mode: compute spacing from paper dimensions and apply target fonts
    const paper_mode = this.drawingArea.is_paper_mode && this.drawingArea.paper_format !== 'free'
    let first_col_x: number

    if (paper_mode) {
      first_col_x = Class_DrawingArea.mmToPx(this.drawingArea.margin_left_mm)

      // Apply target font sizes (optional)
      if (apply_target_fonts) {
        const fmt = this.drawingArea.paper_format as Exclude<typeof this.drawingArea.paper_format, 'free'>
        const targetFonts = PAPER_TARGET_FONT_SIZES[fmt]
        this.drawingArea.sankey.visible_nodes_list.forEach(n => {
          n.name_label_font_size = targetFonts.node_name
          n.value_label_font_size = targetFonts.node_value
        })
        this.drawingArea.sankey.links_list.forEach(l => {
          l.name_label_font_size = targetFonts.link_name
          l.value_label_font_size = targetFonts.link_value
        })
        // Don't change legend_police — the legend has its own scale transform
      }
    } else {
      // Fixed left margin so the first column always starts at the same x
      first_col_x = 200
    }

    if (paper_mode) {
      // Paper mode: simple even distribution — each column gets a slot of width dx
      const pad_left_x = Class_DrawingArea.mmToPx(this.drawingArea.margin_left_mm)
      const pad_right_x = Class_DrawingArea.mmToPx(this.drawingArea.margin_right_mm)
      const available_w = this.drawingArea.width - pad_left_x - pad_right_x
      const num_cols = max_horizontal_index + 1
      const new_dx = available_w / Math.max(num_cols, 1)

      for (let h_index = 0; h_index <= max_horizontal_index; h_index++) {
        if (!nodes_per_horizontal_indexes[h_index]) continue
        nodes_per_horizontal_indexes[h_index].forEach(node => {
          node.position_x = h_index * new_dx + pad_left_x
          node.shape_position_dx = new_dx
        })
      }
    } else {
      for (let h_index = 0; h_index <= max_horizontal_index; h_index++) {
        if (!nodes_per_horizontal_indexes[h_index]) {
          continue
        }
        let col_max_w_col = 0
        const effective_h = h_spacing ?? nodes_per_horizontal_indexes[h_index][0]?.shape_position_dx ?? 0
        nodes_per_horizontal_indexes[h_index].forEach(node => {
          node.position_x = first_col_x + prev_col_width + effective_h * h_index
          const node_w = node.shape_min_width
          if (node_w > col_max_w_col) col_max_w_col = node_w
        })
        if (col_max_w_col > 50) prev_col_width = col_max_w_col
      }
    }

    // Calcul des hauteurs et tri vertical (logique existante)
    for (let h_index = 0; h_index <= max_horizontal_index; h_index++) {
      if (!nodes_per_horizontal_indexes[h_index]) {
        continue
      }

      let height_cumul_for_index = 0
      let max_vertical_index = 0
      const sortcoef_per_nodes_ids: { [node_id: string]: number } = {}
      const vertical_indexes_per_node_id: { [node_id: string]: number } = {}
      const nodes_ids_per_vertical_index: string[] = []
      const effective_v = v_spacing ?? nodes_per_horizontal_indexes[h_index][0]?.shape_position_dy ?? 0

      if (skip_vertical) {
        // Keep existing vertical order — sort by current position_y
        const sorted_by_y = [...nodes_per_horizontal_indexes[h_index]]
          .sort((a, b) => a.position_y - b.position_y)
        sorted_by_y.forEach((node, idx) => {
          const node_height = node.getShapeHeightToUse()
          height_per_nodes_ids[node.id] = node_height
          vertical_indexes_per_node_id[node.id] = idx
          nodes_ids_per_vertical_index.push(node.id)
          height_cumul_for_index += node_height + effective_v
        })
        max_vertical_index = sorted_by_y.length
      } else {
        nodes_per_horizontal_indexes[h_index].forEach(node => {
          const node_height = node.getShapeHeightToUse()
          const node_sortcoef = node_height * (0.8 + 0.2 / (node.output_links_list.length + node.input_links_list.length))

          height_per_nodes_ids[node.id] = node_height
          sortcoef_per_nodes_ids[node.id] = node_sortcoef
          vertical_indexes_per_node_id[node.id] = max_vertical_index
          nodes_ids_per_vertical_index.push(node.id)

          // Tri à bulles (logique existante)
          if (max_vertical_index > 0) {
            for (let v_index = max_vertical_index; v_index > 0; v_index--) {
              const prev_v_index = v_index - 1
              const prev_node_id = nodes_ids_per_vertical_index[prev_v_index]
              const prev_node_sortcoef = sortcoef_per_nodes_ids[prev_node_id]

              if (prev_node_sortcoef < node_sortcoef) {
                vertical_indexes_per_node_id[node.id] = prev_v_index
                nodes_ids_per_vertical_index[prev_v_index] = node.id
                vertical_indexes_per_node_id[prev_node_id] = v_index
                nodes_ids_per_vertical_index[v_index] = prev_node_id
              } else {
                break
              }
            }
          }
          max_vertical_index += 1
          height_cumul_for_index += node_height + effective_v
        })
      }

      // Réordonnancement selon les verrous V (shape_position_v_locked).
      // Les nœuds verrouillés sont placés dans l'ordre croissant de leur position_v
      // (utilisée comme cible d'index 1-based, clampée aux bornes). En cas de collision
      // de cible, on préserve l'ordre relatif des nœuds verrouillés. Les nœuds libres
      // remplissent les créneaux restants dans leur ordre issu du tri par sortcoef.
      const col_nodes = nodes_per_horizontal_indexes[h_index]
      const locked_nodes = col_nodes
        .filter(n => n.shape_position_v_locked === true)
        .slice()
        .sort((a, b) => a.position_v - b.position_v)
      if (locked_nodes.length > 0 && nodes_ids_per_vertical_index.length > 1) {
        const N = nodes_ids_per_vertical_index.length
        const locked_set = new Set(locked_nodes.map(n => n.id))
        const unlocked_in_order = nodes_ids_per_vertical_index.filter(id => !locked_set.has(id))
        const final_arr: (string | null)[] = new Array(N).fill(null)
        let last_assigned = -1
        locked_nodes.forEach(n => {
          const target = Math.max(0, Math.min(N - 1, Math.round(n.position_v) - 1))
          let slot = Math.max(target, last_assigned + 1)
          while (slot < N && final_arr[slot] !== null) slot += 1
          if (slot >= N) {
            // Pas de place à droite → recule vers la gauche pour garder le nœud dans la colonne
            slot = N - 1
            while (slot >= 0 && final_arr[slot] !== null) slot -= 1
          }
          if (slot >= 0 && slot < N) {
            final_arr[slot] = n.id
            last_assigned = slot
          }
        })
        let u_i = 0
        for (let i = 0; i < N; i++) {
          if (final_arr[i] === null) {
            final_arr[i] = unlocked_in_order[u_i++] ?? null
          }
        }
        for (let i = 0; i < N; i++) {
          const id = final_arr[i]
          if (id !== null) {
            nodes_ids_per_vertical_index[i] = id
            vertical_indexes_per_node_id[id] = i
          }
        }
      }

      //height_cumul_for_index += (nodes_per_horizontal_indexes[h_index].length - 1) * this.drawingArea.sankey.styles_dict['default'].shape_position_dy!
      if (height_cumul_for_index > max_height_cumul) {
        max_height_cumul = height_cumul_for_index
      }
      height_cumul_per_indexes.push(height_cumul_for_index)
      node_id_per_hxv_indexes.push(nodes_ids_per_vertical_index)
    }
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ?
      this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    // Positionnement final avec la logique corrigée
    this.updateNodesPositionsY(
      node_id_per_hxv_indexes,
      height_per_nodes_ids,
      height_cumul_per_indexes,
      max_height_cumul,
      max_horizontal_index,
      echangeTag,
      h_spacing,
      v_spacing
    )
    this.optimizeCrossingsPositioning(optimize_crossing, h_spacing, v_spacing)
  }

  /**
   * Adjust positioning for nodes that have no input links
   * @private
   */
  private adjustNodesWithoutInputs(
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
          node.output_links_list.forEach((link) => {
            if (this.drawingArea.sankey.nodes_dict[this.drawingArea.sankey.links_dict[link.id].source.id].is_visible &&
              this.drawingArea.sankey.nodes_dict[this.drawingArea.sankey.links_dict[link.id].target.id].is_visible
            ) {
              const target_node = this.drawingArea.sankey.nodes_dict[this.drawingArea.sankey.links_dict[link.id].target.id]
              if (target_node === undefined) {
                return
              }
              if (horizontal_indexes_per_nodes_ids[target_node.id] < horizontal_indexes_per_nodes_ids[node.id]) {
                return
              }
              if (horizontal_indexes_per_nodes_ids[target_node.id] < min_next_horizontal_index) {
                min_next_horizontal_index = horizontal_indexes_per_nodes_ids[target_node.id]
              }
            }
          })

          if (horizontal_indexes_per_nodes_ids[node.id] < min_next_horizontal_index - 1) {
            to_splice.push(node as Class_NodeElement)
            horizontal_indexes_per_nodes_ids[node.id] = min_next_horizontal_index - 1
            if (!nodes_per_horizontal_indexes[min_next_horizontal_index - 1]) {
              nodes_per_horizontal_indexes[min_next_horizontal_index - 1] = []
            }
            nodes_per_horizontal_indexes[min_next_horizontal_index - 1].push(node)
          }
        }
      })

      to_splice.forEach(node =>
        nodes_per_horizontal_indexes[horizontal_index].splice(
          nodes_per_horizontal_indexes[horizontal_index].indexOf(node), 1
        )
      )

      // Compacter les indices pour qu'ils commencent à 0
      this.compactHorizontalIndexes(nodes_per_horizontal_indexes, horizontal_indexes_per_nodes_ids, max_horizontal_index)
    }
  }
  /**
   * Compact horizontal indexes to start from 0 and remove gaps
   * @private
   */
  private compactHorizontalIndexes(
    nodes_per_horizontal_indexes: { [index: number]: Class_NodeElement[] },
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
    max_horizontal_index: number
  ) {
    // Trouver le premier index non vide
    let first_non_empty_index = -1
    for (let i = 0; i <= max_horizontal_index; i++) {
      if (nodes_per_horizontal_indexes[i] && nodes_per_horizontal_indexes[i].length > 0) {
        first_non_empty_index = i
        break
      }
    }

    // Si le premier index non vide n'est pas 0, décaler tout
    if (first_non_empty_index > 0) {
      const offset = first_non_empty_index

      // Créer un nouveau mapping temporaire
      const new_nodes_per_horizontal_indexes: { [index: number]: Class_NodeElement[] } = {}

      // Décaler les indices dans nodes_per_horizontal_indexes
      for (let i = first_non_empty_index; i <= max_horizontal_index; i++) {
        if (nodes_per_horizontal_indexes[i] && nodes_per_horizontal_indexes[i].length > 0) {
          new_nodes_per_horizontal_indexes[i - offset] = nodes_per_horizontal_indexes[i]
          delete nodes_per_horizontal_indexes[i]
        }
      }

      // Copier les nouveaux indices
      Object.assign(nodes_per_horizontal_indexes, new_nodes_per_horizontal_indexes)

      // Mettre à jour horizontal_indexes_per_nodes_ids
      Object.keys(horizontal_indexes_per_nodes_ids).forEach(node_id => {
        horizontal_indexes_per_nodes_ids[node_id] -= offset
      })
    }
  }
  /**
   * Position nodes based on computed horizontal indexes
   * @private
   */
  private positionNodesFromIndexes(
    nodes_per_horizontal_indexes: { [index: number]: Class_NodeElement[] },
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
    max_horizontal_index: number,
    launched_from_process: boolean,
    echangeTag?: Class_Tag
  ) {

    // Loop on all index "columns"
    const height_cumul_per_indexes: number[] = []
    const height_per_nodes_ids: { [node_id: string]: number } = {}
    const node_id_per_hxv_indexes: string[][] = []
    let max_height_cumul = 0

    // Calculate heights and margins for each column
    for (let h_index = 0; h_index <= max_horizontal_index; h_index++) {
      if (!nodes_per_horizontal_indexes[h_index]) {
        continue
      }

      let height_cumul_for_index = 0
      let max_vertical_index = 0
      const sortcoef_per_nodes_ids: { [node_id: string]: number } = {}
      const vertical_indexes_per_node_id: { [node_id: string]: number } = {}
      const nodes_ids_per_vertical_index: string[] = []

      // Process each node in the column
      nodes_per_horizontal_indexes[h_index].forEach(node => {
        const node_height = node.getShapeHeightToUse()
        const node_sortcoef = node_height * (0.8 + 0.2 / (node.output_links_list.length + node.input_links_list.length))

        // Vertically sort nodes according to their height
        height_per_nodes_ids[node.id] = node_height
        sortcoef_per_nodes_ids[node.id] = node_sortcoef
        vertical_indexes_per_node_id[node.id] = max_vertical_index
        nodes_ids_per_vertical_index.push(node.id)

        if (max_vertical_index > 0) {
          // Bubble sort algorithm
          for (let v_index = max_vertical_index; v_index > 0; v_index--) {
            const prev_v_index = v_index - 1
            const prev_node_id = nodes_ids_per_vertical_index[prev_v_index]
            const prev_node_sortcoef = sortcoef_per_nodes_ids[prev_node_id]

            if (prev_node_sortcoef < node_sortcoef) {
              // Update referencing for bubble node
              vertical_indexes_per_node_id[node.id] = prev_v_index
              nodes_ids_per_vertical_index[prev_v_index] = node.id
              // Update referencing for prev node
              vertical_indexes_per_node_id[prev_node_id] = v_index
              nodes_ids_per_vertical_index[v_index] = prev_node_id
            }
            else {
              break
            }
          }
        }
        max_vertical_index += 1

        // Compute cumulative height for given index
        height_cumul_for_index += node_height

        // Compute margins for label display
        this.computeMargins(node, h_index, max_horizontal_index, node.shape_position_dx, node.shape_position_dx)

        // Set label positioning if launched from process
        if (launched_from_process) {
          this.setNodeLabelPositioning(node)
        }
      })

      // Get horizontal index that needs the most vertical space
      height_cumul_for_index += (nodes_per_horizontal_indexes[h_index].length - 1) * this.drawingArea.sankey.styles_dict['default'].shape_position_dy!
      if (height_cumul_for_index > max_height_cumul) {
        max_height_cumul = height_cumul_for_index
      }
      height_cumul_per_indexes.push(height_cumul_for_index)
      node_id_per_hxv_indexes.push(nodes_ids_per_vertical_index)
    }

    max_horizontal_index = (node_id_per_hxv_indexes.length - 1)

    // Update horizontal and vertical position of nodes
    this.updateNodesPositionsY(
      node_id_per_hxv_indexes,
      height_per_nodes_ids,
      height_cumul_per_indexes,
      max_height_cumul,
      max_horizontal_index,
      echangeTag
    )
  }

  /**
   * Compute margins for node labels
   * @private
   */
  private computeMargins(
    node: Class_NodeElement,
    h_index: number,
    max_horizontal_index: number,
    h_left_margin: number,
    h_right_margin: number
  ) {
    // Compute left horizontal margin
    if (h_index == 0) {
      const style_node = node.getStyleWithAttr('name_label_box_width')
      const node_shape_min_width = this.drawingArea.sankey.styles_dict[style_node.id].name_label_box_width!
      const needed_margin = this.drawingArea.grid_size + node_shape_min_width
      if (needed_margin > h_left_margin) {
        h_left_margin = needed_margin
      }
    }

    // Compute right horizontal margin
    if (h_index == max_horizontal_index) {
      const style_node = node.getStyleWithAttr('name_label_box_width')
      const node_shape_min_width = this.drawingArea.sankey.styles_dict[style_node.id].name_label_box_width!
      const needed_margin = this.drawingArea.grid_size + node_shape_min_width
      if (needed_margin > h_right_margin) {
        h_right_margin = needed_margin
      }
    }
  }

  /**
   * Set label positioning for nodes based on their connectivity
   * @private
   */
  private setNodeLabelPositioning(node: Class_NodeElement) {
    if (!node.hasInputLinks() && !node.hasOutputLinks()) {
      // Node is lone node
      node.name_label_horiz = 'middle'
      node.name_label_vert = 'middle'
    }
    else if (node.input_links_list.length === 0) {
      // Node is a source : no input link
      node.name_label_horiz = 'left'
      node.name_label_vert = 'middle'
    }
    else if (node.output_links_list.length === 0) {
      // Node is a sink : no output link
      node.name_label_horiz = 'right'
      node.name_label_vert = 'middle'
    }
    else {
      // Node is in the middle of the sankey
      node.name_label_horiz = 'left'
      node.name_label_vert = 'middle'
    }
  }

  /**
   * Version simplifiée de updateNodesPositions sans la logique de croisements
   */
  private updateNodesPositionsY(
    node_id_per_hxv_indexes: string[][],
    height_per_nodes_ids: { [node_id: string]: number },
    height_cumul_per_indexes: number[],
    max_height_cumul: number,
    max_horizontal_index: number,
    echangeTag?: Class_Tag,
    h_spacing?: number,
    v_spacing?: number
  ) {
    if (node_id_per_hxv_indexes.length === 0) {
      return
    }
    const v_margin = v_spacing ?? this.drawingArea.sankey.styles_dict['default'].shape_position_dy!

    const horizontal_spacing = h_spacing ?? this.drawingArea.sankey.nodes_dict[node_id_per_hxv_indexes[0][0]].shape_position_dx

    // Paper mode: compute per-column v_spacing to fit within paper height
    const paper_mode = this.drawingArea.is_paper_mode && this.drawingArea.paper_format !== 'free'
    let paper_pad_top = 0
    let paper_available_h = 0
    if (paper_mode) {
      paper_pad_top = Class_DrawingArea.mmToPx(this.drawingArea.margin_top_mm)
      const paper_pad_bottom = Class_DrawingArea.mmToPx(this.drawingArea.margin_bottom_mm)
      paper_available_h = this.drawingArea.height - paper_pad_top - paper_pad_bottom
    }

    // Paper mode: precompute spacing to fill available height
    let paper_v_margin_computed = false
    let paper_effective_v = 0
    let tallest_total = 0

    for (let horizontal_index = 0; horizontal_index <= max_horizontal_index; horizontal_index++) {
      if (!node_id_per_hxv_indexes[horizontal_index]) {
        continue
      }

      let upper_node_height_and_margin: number
      let effective_v_margin: number

      if (paper_mode) {
        // Paper mode: compute spacing so the tallest column fills the available height.
        // Shorter columns are centered relative to the tallest.
        const col_node_ids = node_id_per_hxv_indexes[horizontal_index]
        const col_pure_height = col_node_ids.reduce((sum, nid) => sum + height_per_nodes_ids[nid], 0)

        // For the tallest column, compute the spacing that fills paper_available_h
        // We need max_pure_height (without spacing) to compute the right spacing
        // max_height_cumul includes old spacing, so recompute from pure heights
        if (horizontal_index === 0 || !paper_v_margin_computed) {
          // Compute pure heights for all columns to find the tallest
          let tallest_pure = 0
          let tallest_count = 0
          for (let ci = 0; ci <= max_horizontal_index; ci++) {
            if (!node_id_per_hxv_indexes[ci]) continue
            const pure = node_id_per_hxv_indexes[ci].reduce((s, nid) => s + height_per_nodes_ids[nid], 0)
            const cnt = node_id_per_hxv_indexes[ci].length
            const total = pure + v_margin * (cnt - 1)
            if (total > tallest_total) {
              tallest_total = total
              tallest_pure = pure
              tallest_count = cnt
            }
          }
          // Spacing so tallest column fills available height
          if (tallest_count > 1) {
            paper_effective_v = Math.max(5, (paper_available_h - tallest_pure) / (tallest_count - 1))
          } else {
            paper_effective_v = 0
          }
          // Recompute tallest_total with paper spacing
          tallest_total = tallest_pure + paper_effective_v * (tallest_count - 1)
          paper_v_margin_computed = true
        }

        effective_v_margin = paper_effective_v
        // Center this column relative to the tallest
        const col_total_with_spacing = col_pure_height + paper_effective_v * (col_node_ids.length - 1)
        const center_offset = Math.max(0, (tallest_total - col_total_with_spacing) / 2)
        upper_node_height_and_margin = paper_pad_top + center_offset
      } else {
        // Free mode: center columns vertically
        const v_margin_for_index = v_margin + (max_height_cumul - height_cumul_per_indexes[horizontal_index]) / 2
        upper_node_height_and_margin = Math.max(0, v_margin_for_index)
        effective_v_margin = v_margin
      }

      node_id_per_hxv_indexes[horizontal_index].forEach((node_id, idx) => {
        this.drawingArea.sankey.nodes_dict[node_id].position_y = upper_node_height_and_margin

        // Logique d'alignement pour les liens spéciaux (ajustement local au nœud,
        // pas reporté sur la colonne suivante)
        const import_link = this.drawingArea.sankey.nodes_dict[node_id].input_links_list.filter(l =>
          echangeTag && l.source.hasGivenTag(echangeTag)
        )

        if (import_link.length > 0) {
          this.drawingArea.sankey.nodes_dict[node_id].position_y -= import_link[0].thickness
        } else {
          const non_recycling_input_links = this.drawingArea.sankey.nodes_dict[node_id].input_links_list.filter(l =>
            l.is_visible && !l.shape_is_recycling && !(echangeTag && l.source.hasGivenTag(echangeTag))
          )

          if (non_recycling_input_links.length > 0) {
            const recycling_links = this.drawingArea.sankey.nodes_dict[node_id].input_links_list.filter(l =>
              l.is_visible && l.shape_is_recycling
            )

            if (recycling_links.length > 0) {
              this.drawingArea.sankey.nodes_dict[node_id].position_y += recycling_links[0].thickness
            } else if (non_recycling_input_links.filter(l =>
              l.source.output_links_list.filter(ol => ol.is_visible).length == 1
            ).length == 1 && idx == 0) {
              // Alignement des centres : si le premier nœud de la colonne a une
              // unique source 1-vers-1, on l'aligne verticalement avec cette source.
              const source_node = non_recycling_input_links[0].source
              const current_node = this.drawingArea.sankey.nodes_dict[node_id]
              const source_center_y = source_node.position_y + source_node.getShapeHeightToUse() / 2
              const current_node_half_height = current_node.getShapeHeightToUse() / 2
              const aligned_position_y = source_center_y - current_node_half_height

              this.drawingArea.sankey.nodes_dict[node_id].position_y = aligned_position_y
            }
          }
        }

        const node_height = height_per_nodes_ids[node_id]
        upper_node_height_and_margin += node_height + effective_v_margin
      })

    }

    // Calcul des dimensions finales
    const possible_width = (horizontal_spacing + max_horizontal_index * horizontal_spacing + horizontal_spacing)
    const possible_height = (v_margin * 2 + max_height_cumul)

    this.drawingArea.width = (this.drawingArea.window_fitting_width < possible_width) ? possible_width : this.drawingArea.window_fitting_width
    this.drawingArea.height = (this.drawingArea.window_fitting_height < possible_height) ? possible_height : this.drawingArea.window_fitting_height
  }

  /**
   * NOUVELLE ÉTAPE : Optimisation des croisements de flux
   * À appeler APRÈS le positionnement initial des nœuds
   *
   * @param {boolean} apply_optimization - Active/désactive l'optimisation
   */
  public optimizeCrossingsPositioning(apply_optimization: boolean = true, h_spacing?: number, v_spacing?: number) {
    if (!apply_optimization) {
      console.log('🔧 Optimisation des croisements désactivée')
      return
    }

    console.log('🔍 Début de l\'optimisation des croisements de flux...')

    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ?
      this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    const nodes_to_process = this.drawingArea.sankey.visible_nodes_list.filter(n =>
      !echangeTag || !n.hasGivenTag(echangeTag))

    // Créer la structure node_id_per_hxv_indexes à partir des positions actuelles
    const horizontal_positions: { [node_id: string]: number } = {}
    const nodes_per_horizontal_indexes: { [index: number]: string[] } = {}
    let max_horizontal_index = 0

    // Regrouper les nœuds par colonne
    // En mode papier, utiliser position_u (les X sont espaces differemment)
    const paper_mode = this.drawingArea.is_paper_mode
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
        const node_a_y = this.drawingArea.sankey.nodes_dict[a].position_y
        const node_b_y = this.drawingArea.sankey.nodes_dict[b].position_y
        return node_a_y - node_b_y
      })
    })

    // Convertir en format attendu par analyzeCrossingFlows
    const node_id_per_hxv_indexes: string[][] = []
    for (let i = 0; i <= max_horizontal_index; i++) {
      node_id_per_hxv_indexes.push(nodes_per_horizontal_indexes[i] || [])
    }

    // Analyser les croisements
    const crossing_analysis = this.analyzeCrossingFlows(node_id_per_hxv_indexes, max_horizontal_index)
    console.log('🔍 Croisements détectés:', crossing_analysis.crossing_flows.length)

    if (crossing_analysis.crossing_flows.length === 0) {
      console.log('✅ Aucun croisement détecté, optimisation non nécessaire')
      return
    }

    // Appliquer les ajustements pour chaque colonne
    const v_margin = v_spacing ?? this.drawingArea.sankey.styles_dict['default'].shape_position_dy!
    let total_adjustments = 0

    for (let horizontal_index = 0; horizontal_index <= max_horizontal_index; horizontal_index++) {
      if (!node_id_per_hxv_indexes[horizontal_index] || node_id_per_hxv_indexes[horizontal_index].length === 0) {
        continue
      }

      const column_adjustments = this.calculateColumnAdjustments(
        horizontal_index,
        node_id_per_hxv_indexes[horizontal_index],
        crossing_analysis,
        v_margin
      )

      // Appliquer les ajustements
      Object.keys(column_adjustments).forEach(node_id => {
        const node_ref = this.drawingArea.sankey.nodes_dict[node_id]
        // Ne pas déplacer un nœud verrouillé verticalement : son ordre doit être préservé.
        if (node_ref.shape_position_v_locked === true) return
        const adjustment = column_adjustments[node_id]
        if (Math.abs(adjustment) > 0.1) { // Seuil minimum pour éviter les micro-ajustements
          const current_y = node_ref.position_y
          const new_y = Math.max(0, current_y + adjustment) // Éviter les Y négatifs

          node_ref.position_y = new_y
          total_adjustments++

          console.log(`📍 Ajustement ${node_id}: ${current_y.toFixed(1)} → ${new_y.toFixed(1)} (${adjustment > 0 ? '+' : ''}${adjustment.toFixed(1)})`)
        }
      })
    }

    console.log(`✅ Optimisation terminée: ${total_adjustments} nœuds ajustés`)
  }

  /**
   * Analyse les flux qui traversent d'autres nœuds
   */
  private analyzeCrossingFlows(
    node_id_per_hxv_indexes: string[][],
    max_horizontal_index: number
  ): {
    crossing_flows: Array<{
      source_id: string,
      target_id: string,
      crossed_nodes: string[],
      link_id: string
    }>,
    nodes_crossed_by: { [node_id: string]: string[] }
  } {
    const crossing_flows: Array<{
      source_id: string,
      target_id: string,
      crossed_nodes: string[],
      link_id: string
    }> = []
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
    this.drawingArea.sankey.visible_links_list.forEach(link => {
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
 * Calcule les ajustements de position Y pour éviter les croisements
 * Ajuste à la fois les nœuds traversés (vers le bas) et les nœuds targets (vers le haut)
 */
  private calculateColumnAdjustments(
    horizontal_index: number,
    column_node_ids: string[],
    crossing_analysis: {
      crossing_flows: Array<{
        source_id: string,
        target_id: string,
        crossed_nodes: string[],
        link_id: string
      }>,
      nodes_crossed_by: { [node_id: string]: string[] }
    },
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

        console.log(`📍 Nœud ${node_id} traversé par ${crossings.length} flux -> descendre: +${crossing_penalty}`)
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

        console.log(`📍 Nœud target ${flow.target_id} du flux traversant -> monter: ${target_adjustment}`)
      }

      // BONUS: Ajuster aussi le nœud source si nécessaire
      if (column_node_ids.includes(flow.source_id)) {
        const source_adjustment = -v_margin * 0.5 // Ajustement plus léger pour le source

        if (adjustments[flow.source_id]) {
          adjustments[flow.source_id] += source_adjustment
        } else {
          adjustments[flow.source_id] = source_adjustment
        }

        console.log(`📍 Nœud source ${flow.source_id} du flux traversant -> ajuster: ${source_adjustment}`)
      }
    })

    return adjustments
  }

  // TRADE ARRANGEMENT METHODS ==========================================================

  /**
   * Initially there is only one node per type of exchanges.
   * it must be split to have one import and one export per product
   * International will be split to give InternationalProduct1Importation InternationalProduct1Exportation
   */
  public splitTrade() {
    if (!this.drawingArea.sankey.node_taggs_dict['type de noeud']) {
      return
    }

    const trade_nodes = this.drawingArea.sankey.nodes_list.filter(n =>
      n.hasGivenTag(this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'])
    )

    // first split the nodes
    trade_nodes.forEach(node => {
      if (node.style.length < 2) {
        node.addStyle(this.drawingArea.sankey.styles_dict[NodeSectorStyle])
        node.addStyle(this.drawingArea.sankey.styles_dict[NodeImportExportCloseStyle])
      }
      if (node.output_links_list.length > 0) {
        (node as Class_NodeElement).SplitIOrE(true)
      }
      if (node.input_links_list.length > 0) {
        (node as Class_NodeElement).SplitIOrE(false)
      }
      node.setInvisible()
    })

    const split_trade_nodes = this.drawingArea.sankey.nodes_list.filter(n =>
      n.hasGivenTag(this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'])
    )

    // set dimensions. It must be done after each trade node has been split
    split_trade_nodes.forEach(node => {
      if (!node.sibling) return
      (node as Class_NodeElement).setTradeDimensions(true);
      (node as Class_NodeElement).setTradeDimensions(false)
    })
  }

  /**
   * Computes u,v,x and initial y for trade nodes
   *
   * @param {boolean} compute_xy
   */
  public arrangeTrade(compute_xy: boolean) {
    if (!this.drawingArea.sankey.node_taggs_dict['type de noeud']) {
      return
    }

    const process_nodes = this.drawingArea.sankey.nodes_list
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange']
    const import_nodes = process_nodes.filter(n =>
      n.hasGivenTag(echangeTag) && n.output_links_list.length > 0
    )
    const export_nodes = process_nodes.filter(n =>
      n.hasGivenTag(echangeTag) && n.input_links_list.length > 0
    )
    const other_nodes = process_nodes.filter(n => !n.hasGivenTag(echangeTag))

    let max_vertical_y = 0
    let min_vertical_y = 5000
    other_nodes.forEach(n => {
      max_vertical_y = Math.max(n.position_y + n.getShapeHeightToUse(), max_vertical_y)
      min_vertical_y = Math.min(n.position_y, min_vertical_y)
    })
    max_vertical_y = max_vertical_y + 200
    min_vertical_y = min_vertical_y - 200

    import_nodes.forEach(node => {
      const output_link = node.output_links_list[0]
      const target_node = output_link.target
      node.position_u = target_node.position_u
      node.position_v = target_node.position_v
      if (compute_xy) {
        const x = target_node.position_x + node.shape_position_dx
        node.position_x = x
        //node.position_y = 50
      }
    })

    if (import_nodes.length > 0 && import_nodes[0].style.find(style => style.id == NodeImportExportAboveBelowStyle)) {
      let cont = this.drawingArea.sankey.containers_dict['import']
      if (!cont) {
        cont = this.drawingArea.sankey.addNewContainer('import', 'Importations')
        cont.position_y = min_vertical_y
        cont.tied_to_nodes = true
      }

      import_nodes.forEach(node => {
        node.getListDescendantOfNode().forEach(n => {
          cont.attachNodeToCont(n)
        })
        cont.attachNodeToCont(node)
      })
    } else {
      delete this.drawingArea.sankey.containers_dict['import']
    }

    export_nodes.forEach(node => {
      const input_link = node.input_links_list[0]
      const source_node = input_link.source
      node.position_u = source_node.position_u
      node.position_v = source_node.position_v
      if (node.position_x < source_node.position_x) {
        node.position_x = source_node.position_x + 1
      }
      if (compute_xy) {
        const x = source_node.position_x + node.shape_position_dx
        node.position_x = x
        //node.position_y = max_vertical_y
      }
    })

    if (export_nodes.length > 0 && export_nodes[0].style.find(style => style.id == NodeImportExportAboveBelowStyle)) {
      let cont = this.drawingArea.sankey.containers_dict['export']
      if (!cont) {
        cont = this.drawingArea.sankey.addNewContainer('export', 'Exportations')
        cont.position_y = max_vertical_y
        cont.tied_to_nodes = true
      }

      export_nodes.forEach(node => {
        node.getListDescendantOfNode().forEach(n => {
          cont.attachNodeToCont(n)
        })
        cont.attachNodeToCont(node)
      })
    } else {
      delete this.drawingArea.sankey.containers_dict['export']
    }
  }

  // PARAMETRIZATION METHODS ============================================================

  /**
   * Empile verticalement une liste de nœuds en partant d'une ancre (top du premier
   * nœud). Invariant canonique du mode paramétrique :
   *
   *   n_0.y = anchor_y
   *   n_{i+1}.y = n_i.y + n_i.height + n_{i+1}.shape_position_dy
   *
   * `shape_position_dy` est lu sur chaque nœud (cascade de style respectée) et est
   * la **seule** source de vérité pour l'espacement. Le dy du premier nœud est
   * ignoré (il n'a pas de prédécesseur). `applyPosition()` est appelé sur chaque
   * nœud après la mise à jour.
   *
   * L'ordre des nœuds est celui de la liste passée — à trier par le caller selon
   * son propre critère (position_v, position_y, etc.).
   */
  public static stackNodesVertically(nodes: Class_NodeElement[], anchor_y: number) {
    let cursor_y = anchor_y
    nodes.forEach((node, i) => {
      if (i > 0) cursor_y += node.shape_position_dy ?? 0
      node.position_y = cursor_y
      node.applyPosition()
      cursor_y += node.getShapeHeightToUse()
    })
  }

  /**
   * Hauteur totale de la pile produite par `stackNodesVertically` :
   * somme des hauteurs + somme des `shape_position_dy` des nœuds (sauf le premier).
   */
  public static totalStackHeight(nodes: Class_NodeElement[]): number {
    return nodes.reduce((sum, n, i) => {
      return sum + n.getShapeHeightToUse() + (i > 0 ? (n.shape_position_dy ?? 0) : 0)
    }, 0)
  }

  /**
   * Point d'entrée unique pour le recompute du layout paramétrique (PR 3).
   *
   * Traite une colonne (ensemble de nœuds visibles partageant un même
   * `position_u`) comme une pile verticale triée par `position_v` croissant,
   * ancrée sur le `position_y` courant du nœud de plus petit V, et espacée
   * par `shape_position_dy` via `stackNodesVertically` (cf. PR 2).
   *
   * **Responsabilité stricte : empilement géométrique uniquement.** `position_v`
   * est supposé déjà à jour à l'entrée — les call sites qui ont besoin de le
   * recalculer (nouveau diagramme, bascule de mode, data tag change) doivent
   * appeler `computeParametricV` avant. Cette séparation des responsabilités
   * était le point 1 de la discussion PR 3 : V est une donnée métier, le
   * recompute est un calcul géométrique pur.
   *
   * **Limitation de l'étape 1 (ce commit)** : les containers ne sont **pas**
   * traités récursivement. Les nœuds enfants d'un container (i.e. ceux avec
   * `dimensions_as_child.some(d => d.container_mode)`) sont exclus du
   * stacking de colonne — l'ancien chemin `Node.applyPosition` les prend en
   * charge via sa logique `nodeAbove`. L'intégration récursive des
   * containers comme sous-colonnes est prévue dans un commit ultérieur de
   * PR 3.
   *
   * **Scopes supportés** :
   * - `{ type: 'all' }` : toutes les colonnes top-level de la drawing area.
   * - `{ type: 'column', u: number }` : une seule colonne (utile pour fin
   *   de drag, désagrégation latérale).
   * - `{ type: 'subtree', node }` : réservé à l'étape containers récursifs
   *   (commit ultérieur) — non implémenté ici, lève une erreur explicite.
   *
   * Les nœuds « échange » (tag `type de noeud` / `echange`) sont exclus du
   * stacking, comme dans tous les autres chemins paramétriques.
   *
   * **Dead code temporaire** : tant que `Node.applyPosition` n'est pas
   * réduit à un pass-through, appeler `recomputeParametricLayout` n'a aucun
   * effet visible — le prochain `applyPosition` écrase les positions qu'on
   * vient de poser. C'est volontaire : ce commit ajoute uniquement la
   * plomberie, la bascule de `applyPosition` et la migration des call sites
   * viennent dans un commit séparé pour isoler les régressions éventuelles.
   */
  public recomputeParametricLayout(
    scope: { type: 'all' } | { type: 'column', u: number } | { type: 'subtree', node: Class_NodeElement }
  ) {
    if (scope.type === 'subtree') {
      throw new Error(
        '[recomputeParametricLayout] scope \'subtree\' not implemented yet ' +
        '— requires container recursion (future commit of PR 3).'
      )
    }

    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']

    // --- Helpers ---

    // A container is any node that is a parent of at least one dimension
    // running in container_mode. Nested containers are handled recursively.
    const isContainerParent = (n: Class_NodeElement): boolean =>
      n.dimensions_as_parent.some(d => d.container_mode)

    // A "top-level" node for the column stacking is a visible, non-exchange
    // node that is NOT itself sitting inside a container. Top-level nodes
    // include: plain leaves, plain intermediates, AND top-level containers
    // (containers that are not themselves children of another container).
    // Container children — at any depth — are excluded; they are positioned
    // by the recursive container descent pass.
    const isTopLevel = (n: Class_NodeElement): boolean => {
      if (!n.is_visible) return false
      if (echangeTag && n.hasGivenTag(echangeTag)) return false
      if (n.dimensions_as_child.some(d => d.container_mode)) return false
      return true
    }

    // Sort container children by position_v, with a stable tie-break on
    // the current position_y so equal-V or unassigned-V (-1) nodes don't
    // dance around between recomputes.
    const sortByV = (nodes: Class_NodeElement[]): Class_NodeElement[] => {
      return [...nodes].sort((a, b) => {
        if (a.position_v !== b.position_v) return a.position_v - b.position_v
        return a.position_y - b.position_y
      })
    }

    // Collect direct container children of a given container parent.
    // Dedupes across multiple container_mode dimensions and keeps only
    // visible non-exchange nodes (the rest do not contribute to the
    // envelope).
    const collectContainerChildren = (container: Class_NodeElement): Class_NodeElement[] => {
      const seen = new Set<Class_NodeElement>()
      const children: Class_NodeElement[] = []
      container.dimensions_as_parent
        .filter(d => d.container_mode)
        .forEach(dim => {
          dim.children.forEach(child => {
            const c = child as Class_NodeElement
            if (seen.has(c)) return
            seen.add(c)
            if (!c.is_visible) return
            if (echangeTag && c.hasGivenTag(echangeTag)) return
            children.push(c)
          })
        })
      return children
    }

    // --- Phase A : bottom-up sizing of nested containers ---
    //
    // Sets shape_min_height / shape_min_width of every container parent to
    // the envelope size its (recursively-sized) children would produce,
    // WITHOUT writing any position. Positions are decided in phase B and C.
    //
    // Recursion walks post-order: we need each child's final height before
    // we can sum them into the enclosing container's envelope. For a leaf
    // child, getShapeHeightToUse() already returns its intrinsic height.
    const sized = new Set<Class_NodeElement>()
    const sizeContainerRecursive = (container: Class_NodeElement) => {
      if (sized.has(container)) return
      sized.add(container)
      const children = sortByV(collectContainerChildren(container))
      if (children.length === 0) return
      // Recurse first: each container-parent child must have its own
      // envelope size computed before we read its height.
      children.forEach(c => {
        if (isContainerParent(c)) sizeContainerRecursive(c)
      })
      // Sum children heights + dy + top/bottom margins.
      const stack_h = NodePositioning.totalStackHeight(children)
      const envelope_h = stack_h + container.shape_margin_top + container.shape_margin_bottom
      // Width: max of child widths + left/right margins. Container children
      // are supposed to be aligned on the container's x axis in the current
      // layout, so max(child.width) is a safe upper bound.
      const max_child_w = children.reduce(
        (m, c) => Math.max(m, c.getShapeWidthToUse()), 0
      )
      const envelope_w = max_child_w + container.shape_margin_left + container.shape_margin_right
      container.shape_min_height = envelope_h
      container.shape_min_width = envelope_w
    }

    // --- Phase B : top-level column stacking ---
    //
    // Collect every visible, non-exchange, non-container-child node. Group
    // by position_u. For each column, sort by position_v (anchor = current
    // y of the lowest-V node) and stack via stackNodesVertically. Top-level
    // containers participate as normal nodes in this pass — their height
    // is accurate after phase A.
    const top_level_nodes = this.drawingArea.sankey.visible_nodes_list.filter(isTopLevel)
    // Run phase A on every top-level container before we rely on their
    // getShapeHeightToUse() in phase B.
    top_level_nodes
      .filter(isContainerParent)
      .forEach(c => sizeContainerRecursive(c))

    const columns = new Map<number, Class_NodeElement[]>()
    top_level_nodes.forEach(n => {
      if (scope.type === 'column' && n.position_u !== scope.u) return
      const col = columns.get(n.position_u) ?? []
      col.push(n)
      columns.set(n.position_u, col)
    })
    columns.forEach(column => {
      if (column.length === 0) return
      const sorted = sortByV(column)
      const anchor_y = sorted[0].position_y
      NodePositioning.stackNodesVertically(sorted, anchor_y)
    })

    // --- Phase C : top-down positioning of container descendants ---
    //
    // Containers that participated in phase B may now have a different y
    // than they had going in. Their children need to be re-stacked at the
    // new (container.y + margin_top) anchor. Recursive: if a child is
    // itself a container, we descend into it after positioning it.
    const positioned = new Set<Class_NodeElement>()
    const positionContainerChildrenRecursive = (container: Class_NodeElement) => {
      if (positioned.has(container)) return
      positioned.add(container)
      const children = sortByV(collectContainerChildren(container))
      if (children.length === 0) return
      const anchor_y = container.position_y + container.shape_margin_top
      NodePositioning.stackNodesVertically(children, anchor_y)
      children.forEach(c => {
        if (isContainerParent(c)) positionContainerChildrenRecursive(c)
      })
    }
    // When the scope is 'column', only descend into top-level containers
    // that live in the target column; the others retain their current
    // (already-valid) descendant layout.
    top_level_nodes
      .filter(isContainerParent)
      .filter(c => scope.type !== 'column' || c.position_u === scope.u)
      .forEach(c => positionContainerChildrenRecursive(c))
  }

  /**
   * Back-calcule `shape_position_dy` de chaque nœud visible depuis sa `position_y`
   * absolue. Pour chaque colonne (groupée par `position_u`), les nœuds sont triés par
   * y et le dy de chacun est déduit du gap avec le nœud précédent. Utilisé à la bascule
   * absolu→paramétrique et en fin de drag pour que le déplacement vertical d'un nœud
   * persiste (sinon `applyPosition` rappelle le nœud à sa position dérivée du dy).
   * Retourne le nombre de chevauchements clampés (raw_dy < 0 → dy = 0).
   */
  public backCalculateShapePositionDyFromY(): number {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    const visible_relevant = this.drawingArea.sankey.visible_nodes_list.filter(n =>
      !echangeTag || !n.hasGivenTag(echangeTag)
    )
    const columns: { [u: number]: Class_NodeElement[] } = {}
    visible_relevant.forEach(n => {
      if (!(n.position_u in columns)) columns[n.position_u] = []
      columns[n.position_u].push(n)
    })
    let overlap_count = 0
    Object.values(columns).forEach(column => {
      column.sort((a, b) => a.position_y - b.position_y)
      for (let i = 1; i < column.length; i++) {
        const prev = column[i - 1]
        const curr = column[i]
        const raw_dy = curr.position_y - (prev.position_y + prev.getShapeHeightToUse())
        if (raw_dy < 0) overlap_count++
        curr.shape_position_dy = Math.max(0, raw_dy)
      }
    })
    return overlap_count
  }

  /**
   * Déduit `position_u` depuis `position_x` pour les nœuds visibles non
   * verrouillés. À appeler explicitement aux endroits où une position absolue
   * vient d'être modifiée (drop de ghost link, fin de drag, contraction). Ce
   * calcul **ne fait plus partie** de `computeParametrization` pour éviter le
   * couplage bidirectionnel u ↔ x qui faisait dériver les colonnes à chaque
   * recalcul (notamment quand l'envelope d'un container modifie x).
   *
   * **Clustering plutôt que rounding indépendant (PR 3 step 5)** : l'ancienne
   * implémentation faisait `u = Math.round(x / dx)` sur chaque nœud
   * indépendamment. Deux nœuds visuellement alignés (à 1-2 px près) tombaient
   * parfois de part et d'autre de la frontière de rounding (ex. x=1898.88 →
   * u=9 et x=1901.47 → u=10 avec dx=200, frontière à 1900), ce qui les
   * affectait à des colonnes différentes sans intention utilisateur.
   *
   * La nouvelle implémentation regroupe d'abord les nœuds en **clusters**
   * (tri par x croissant, puis fusion glissante : un nœud rejoint le cluster
   * courant si son x est à moins de `tolerance` du max-x du cluster), puis
   * calcule un `u` commun par cluster. Conséquences :
   *
   * - Deux nœuds quasi alignés tombent dans le même cluster → même `u`,
   *   toujours, peu importe où ils sont par rapport aux frontières de
   *   rounding.
   * - Un cluster contenant un nœud `u`-verrouillé hérite du `u` du verrou
   *   (le verrou définit la colonne d'autorité).
   * - Un cluster sans verrou calcule son `u` depuis le x moyen du cluster,
   *   ce qui reste proche de l'ancien comportement pour les colonnes
   *   bien-formées.
   *
   * `tolerance` est fixée à 5 % de `dx` (plafonnée à 10 px min), valeur bien
   * au-dessus du bruit pixel et très en dessous d'une demi-colonne.
   */
  public inferPositionUFromX() {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ?
      this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    const dx = this.drawingArea.sankey.styles_dict['default'].shape_position_dx!
    const tolerance = Math.max(10, dx * 0.05)

    // Nodes eligible for u assignment: visible and not tagged as "échange".
    // u-locked nodes are kept in the cluster (they anchor the u value) but
    // their u is not overwritten below.
    const eligible = this.drawingArea.sankey.visible_nodes_list.filter(n => {
      if (!n.is_visible) return false
      if (echangeTag && n.hasGivenTag(echangeTag)) return false
      return true
    })
    if (eligible.length === 0) return

    // Sliding merge clustering: sort by x, then walk forward and start a new
    // cluster whenever the gap to the current cluster's max-x exceeds
    // `tolerance`. The max-x (not the starting x) is the right reference: a
    // chain of nodes each within `tolerance` of the previous one should form
    // a single cluster even if the head-to-tail distance exceeds `tolerance`.
    const sorted = [...eligible].sort((a, b) => a.position_x - b.position_x)
    const clusters: Class_NodeElement[][] = []
    let current: Class_NodeElement[] = []
    let current_max_x = -Infinity
    for (const node of sorted) {
      if (current.length === 0 || node.position_x - current_max_x <= tolerance) {
        current.push(node)
        if (node.position_x > current_max_x) current_max_x = node.position_x
      } else {
        clusters.push(current)
        current = [node]
        current_max_x = node.position_x
      }
    }
    if (current.length > 0) clusters.push(current)

    // For each cluster, decide the u once, then apply to every non-locked
    // member. A cluster containing a u-locked node inherits its u; otherwise
    // we compute u from the cluster's mean x.
    for (const cluster of clusters) {
      const locked = cluster.find(n => n.shape_position_u_locked === true)
      let cluster_u: number
      if (locked) {
        cluster_u = locked.position_u
      } else {
        const mean_x = cluster.reduce((sum, n) => sum + n.position_x, 0) / cluster.length
        cluster_u = Math.round(mean_x / dx)
      }
      cluster.forEach(n => {
        if (n.shape_position_u_locked !== true) n.position_u = cluster_u
      })
    }
  }

  /**
  * Computes u,v for nodes in the drawing area
  * Utilise l'algorithme amélioré
  *
  * Quand `use_horizontal_index` est true, `position_u` est recalculé via l'analyse
  * topologique (detectAllCyclesAndOptimize). Sinon, `position_u` est supposé déjà
  * à jour (ne plus dériver depuis x ici — appeler `inferPositionUFromX` côté caller
  * si nécessaire).
  */
  public computeParametrization(use_horizontal_index: boolean) {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ?
      this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    const nodes_to_process = this.drawingArea.sankey.visible_nodes_list.filter(n =>
      !echangeTag || !n.hasGivenTag(echangeTag))

    // Locked nodes keep their existing position_u so the user can pin a node to a
    // specific column across recomputes.
    if (use_horizontal_index) {
      const result = this.detectAllCyclesAndOptimize(nodes_to_process)
      const horizontal_indexes_per_nodes_ids = result.horizontal_indexes

      nodes_to_process.forEach(node => {
        if (node.shape_position_u_locked === true) return
        const node_index = horizontal_indexes_per_nodes_ids[node.id]
        node.position_u = node_index + 1
      })
    }
    const first_level_tagg = this.drawingArea.sankey.level_taggs_list.filter(
      tagg => tagg.activated
    )[0]?.tags_list[0]
    //if (first_level_tagg)
    this.computeParametricV(first_level_tagg as Class_LevelTag)
    // // Sort input and output links for each node based on their connected nodes' position_v
    // this.drawingArea.sankey.nodes_list.forEach(node => {
    //   // Get current links order
    //   const current_links_order = [...node.links_order]

    //   // Sort input links based on source node position_v
    //   const sorted_input_links = node.input_links_list.sort((link1, link2) => {
    //     const source1_v = link1.source.position_v
    //     const source2_v = link2.source.position_v

    //     if (source1_v >= 0 || source2_v >= 0) {
    //       return source1_v - source2_v
    //     } else {
    //       return source2_v - source1_v
    //     }
    //   })

    //   // Sort output links based on target node position_v
    //   const sorted_output_links = node.output_links_list.sort((link1, link2) => {
    //     const target1_v = link1.target.position_v
    //     const target2_v = link2.target.position_v

    //     if (target1_v >= 0 || target2_v >= 0) {
    //       return target1_v - target2_v
    //     } else {
    //       return target2_v - target1_v
    //     }
    //   })

    //   // Create new sorted order: import links first, other links, export links last
    //   const other_links = current_links_order.filter(link =>
    //     !sorted_input_links.includes(link) && !sorted_output_links.includes(link)
    //   )

    //   // Separate import and export links from input/output links
    //   const import_links = sorted_input_links.filter(link =>
    //     echangeTag && link.source.hasGivenTag(echangeTag)
    //   )
    //   const export_links = sorted_output_links.filter(link =>
    //     echangeTag && link.target.hasGivenTag(echangeTag)
    //   )
    //   const regular_input_links = sorted_input_links.filter(link =>
    //     !echangeTag || !link.source.hasGivenTag(echangeTag)
    //   )
    //   const regular_output_links = sorted_output_links.filter(link =>
    //     !echangeTag || !link.target.hasGivenTag(echangeTag)
    //   )

    //   const new_links_order = [
    //     ...import_links,        // Import links first
    //     ...regular_input_links, // Regular input links
    //     ...other_links,         // Other links (like recycling)
    //     ...regular_output_links,// Regular output links
    //     ...export_links         // Export links last
    //   ]

    //   // Use reorganizeIOFromListIds to update the internal order
    //   const new_links_ids = new_links_order.map(link => link.id)
    //   node.reorganizeIOFromListIds(new_links_ids)
    //})
  }
  // Fonction qui calcule les colonnes
  private computeColumns(): { [_: number]: Class_NodeElement[] } {
    const columns: { [_: number]: Class_NodeElement[] } = {}
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ? this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined

    this.drawingArea.sankey.visible_nodes_list.forEach(n => {
      if (n.hasGivenTag(echangeTag!)) {
        return
      }
      if (!(n.position_u in columns)) {
        columns[n.position_u] = [n]
      } else {
        columns[n.position_u].push(n)
      }
    })
    return columns
  }

  // Fonction qui applique le V pour un level tag donné
  public applyVForLevelTag(columns: { [_: number]: Class_NodeElement[] }, tag: Class_LevelTag) {
    Object.values(columns).forEach(column => {
      column.sort((n1, n2) => n1.position_y - n2.position_y)
      let current_v = 0
      column.forEach(n => {
        if (n.shape_position_v_locked !== true) {
          n.position_v = -1
        }
        current_v = this.applyVDesagregate(n, current_v, tag)
      })
    })
    Object.values(columns).forEach(column => {
      column.forEach(n => this.applyVAgregate(n))
    })
  }

  // Fonction principale refactorisée
  public computeParametricV(tag: Class_LevelTag | undefined) {
    const columns = this.computeColumns()

    if (this.drawingArea.sankey.level_taggs_list.length == 0) {
      Object.values(columns).forEach(column => {
        column.sort((n1, n2) => n1.position_y - n2.position_y)
        let current_v = 0
        column.forEach(n => {
          if (n.shape_position_v_locked === true) {
            current_v++
            return
          }
          n.position_v = current_v++
        })
      })
    }

    //this.drawingArea.sankey.level_taggs_list.forEach(tagGroup => {
    this.applyVForLevelTag(columns, tag as Class_LevelTag )
    //})

    this.drawingArea.sankey.sortNodes()
  }

  // Fonction qui compute le V paramétrique pour un tag spécifique
  public computeParametricVForTagg(tag: Class_LevelTag) {
    const columns = this.computeColumns()
    this.applyVForLevelTag(columns, tag)
    this.drawingArea.sankey.sortNodes()
  }
  /**
   * Apply v aggregation for nodes
   */
  public applyVAgregate(node: Class_NodeElement) {
    // const nodeDimParent = node.nodeDimensionAsChild(tagGroup)
    // if (!nodeDimParent) {
    //   return
    // }
    node.dimensions_as_child.forEach(nodeDimParent => {
      if (nodeDimParent.parent.position_v != -1) {
        // v is computed at the first path
        return
      }
      nodeDimParent.parent.position_x = node.position_x
      nodeDimParent.parent.position_y = node.position_y
      nodeDimParent.parent.position_u = node.position_u
      nodeDimParent.parent.position_v = node.position_v
      this.applyVAgregate(nodeDimParent.parent as Class_NodeElement)
    })
  }

  /**
   * Apply v disaggregation for nodes
   */
  public applyVDesagregate(
    node: Class_NodeElement,
    current_v: number,
    tag: Class_LevelTag
  ) {
    // if (node.master_node) {
    //   return current_v
    // }
    if (node.position_v == -1) {
      // v is computed at the first path
      node.position_v = current_v
    }
    let new_current_v = current_v
    let desagregated_nodes = ([...new Set(node.dimensions_as_parent.flatMap(d => d.children))] as Class_NodeElement[]).filter(n => n.hasGivenTag(tag))
    desagregated_nodes.forEach(nn => {


      const shift_y = (desagregated_nodes.length - 1) / 2 * node.shape_position_dy

      let current_y = node.position_y - shift_y
      if (nn.master_node) {
        return
      }
      nn.position_v = -1
      nn.position_x = node.position_x
      nn.position_u = node.position_u
      nn.position_y = current_y
      current_y += nn.getShapeHeightToUse() + nn.shape_position_dy
      if (tag.group.tags_list[tag.group.tags_list.indexOf(tag)])
        new_current_v = this.applyVDesagregate(nn, new_current_v, tag.group.tags_list[tag.group.tags_list.indexOf(tag)] as Class_LevelTag)

    })
    return new_current_v + 1
  }

  // UTILITY METHODS ====================================================================

  /**
   * Auto-compute sankey with waiting toast
   */
  public computeAutoSankeyWithToast(
    launched_from_process: boolean,
    optimize_crossing: boolean,
    h_spacing?: number,
    v_spacing?: number,
    sources_mode: 'before_neighbor' | 'left_extremity' = 'before_neighbor',
    sinks_mode: 'after_neighbor' | 'right_extremity' = 'after_neighbor',
    skip_horizontal: boolean = false,
    skip_vertical: boolean = false,
    apply_target_fonts: boolean = true
  ) {

    // If it's not launched_from_process then we assume it's user input so we save it undoing
    if (!launched_from_process) {
      const node_pos = Object.fromEntries(this.drawingArea.sankey.visible_nodes_list.map(n => [n.id, { x: n.position_x, y: n.position_y, links_order: n.links_order_visible.map(l => l.id) }]))
      const link_recy = Object.fromEntries(this.drawingArea.sankey.visible_links_list.map(l => [l.id, l.shape_is_recycling]))

      const inv_computeAutoSankey = () => {
        this.drawingArea.sankey.visible_links_list.forEach(l => l.shape_is_recycling = link_recy[l.id])
        // Reposition node to old pos
        this.drawingArea.sankey.visible_nodes_list.forEach(n => {
          n.position_x = node_pos[n.id].x
          n.position_y = node_pos[n.id].y
          // Reset old node IO order
          n.reorganizeIOFromListIds(node_pos[n.id].links_order)
          n.draw()
        })
        this.drawingArea.areaAutoFit()
      }
      this.drawingArea.saveUndo(inv_computeAutoSankey)
    }

    // Compute auto pos of nodes
    this.computeAutoSankey(launched_from_process, optimize_crossing, h_spacing, v_spacing, sources_mode, sinks_mode, skip_horizontal, skip_vertical, apply_target_fonts)
    this.computeParametrization(true)

    if (launched_from_process) {
      // Split trade nodes
      // this.splitTrade()
      // Computes u v,x and initial y for trade nodes
      //this.arrangeTrade(true)
    }

    // Default color + auto reorg of links
    this.drawingArea.sankey.visible_nodes_list.forEach(n => {
      //n.resetPositionAttribute('dy')
      n.reorganizeIOLinks()
    })

    if (launched_from_process) {
      // Update default data on recycling mode
      this.drawingArea.sankey.links_list.forEach(l => {
        if (l.shape_is_recycling) {
          l.shape_starting_tangeant = 0.01
          l.shape_ending_tangeant = 0.01
        }
      })
    }

    this.drawingArea.draw()
    this.drawingArea.to_recenter = true
    this.drawingArea.recenter()
    this.drawingArea.to_recenter = false
    // this.drawingArea.draw()
    // Update area
    this.drawingArea.areaAutoFit()
    this.drawingArea.draw()
    // Toggle saving indicator
    this.drawingArea.application_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)

    // If it's not launched_from_process then we assume it's user input so we save it undoing
    if (!launched_from_process) {
      const node_pos = Object.fromEntries(this.drawingArea.sankey.visible_nodes_list.map(n => [n.id, { x: n.position_x, y: n.position_y, links_order: n.links_order_visible.map(l => l.id) }]))
      const link_recy = Object.fromEntries(this.drawingArea.sankey.visible_links_list.map(l => [l.id, l.shape_is_recycling]))

      const _computeAutoSankey = () => {
        this.drawingArea.sankey.visible_links_list.forEach(l => l.shape_is_recycling = link_recy[l.id])

        // Reposition node to old pos
        this.drawingArea.sankey.visible_nodes_list.forEach(n => {
          n.position_x = node_pos[n.id].x
          n.position_y = node_pos[n.id].y
          // Reset old node IO order
          n.reorganizeIOFromListIds(node_pos[n.id].links_order)
          n.draw()
        })
        this.drawingArea.areaAutoFit()
      }
      this.drawingArea.saveRedo(_computeAutoSankey)
    }
  }

  /**
   * Reposition visible nodes so that their left/top side is close to a grid line
   */
  protected _arrangeNodesToGrid() {
    const grid_size = this.drawingArea.grid_size
    this.drawingArea.sankey.visible_nodes_list.forEach(node => {
      const shift_x = node.position_x - (node.position_x % grid_size)
      const shift_y = node.position_y - (node.position_y % grid_size)
      node.setPosXY(shift_x, shift_y)
    })
    Object.values(this.drawingArea.sankey.containers_dict).forEach(container => {
      if (container.tied_to_nodes) return
      container.position_x = container.position_x - (container.position_x % grid_size)
      container.position_y = container.position_y - (container.position_y % grid_size)
      container.draw()
    })
  }

  /**
   * Calcule automatiquement la valeur de shape_middle_recycling pour que le flux
   * de recyclage passe sous les nœuds à gauche du nœud source (mais pas ceux qui
   * sont dessous et non connectés)
   */
  private computeRecyclingMiddleShape(
    recycling_links_ids: string[]
  ) {
    console.log('🔄 Calcul automatique du shape_middle_recycling...')
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ?
      this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined

    recycling_links_ids.forEach(link_id => {
      const link = this.drawingArea.sankey.links_dict[link_id]
      const source_node = link.source
      const target_node = link.target

      console.log(`🔧 Traitement du lien de recyclage: ${link_id} (${source_node.id} → ${target_node.id})`)

      // 1. Identifier les nœuds à gauche du nœud source
      const nodes_to_avoid: Class_NodeElement[] = []

      // 2. Calculer la position Y minimale pour passer sous ces nœuds
      let min_y_to_avoid = source_node.position_y // Position par défaut

      this.drawingArea.sankey.visible_nodes_list.filter(n => !n.hasGivenTag(echangeTag!)).forEach(node => {
        const node_bottom = node.position_y + node.getShapeHeightToUse()
        if (node_bottom > min_y_to_avoid) {
          min_y_to_avoid = node_bottom
        }
      })

      // 3. Ajouter une marge de sécurité
      const safety_margin = this.drawingArea.sankey.styles_dict['default'].shape_position_dy!
      //min_y_to_avoid += safety_margin

      // 4. Calculer shape_middle_recycling en fonction de l'orientation du lien
      const source_x = source_node.position_x
      const source_y = source_node.position_y
      const target_x = target_node.position_x
      const target_y = target_node.position_y

      // Point de référence (centre du segment source-target)
      const ref_x = (source_x + target_x) / 2
      const ref_y = (source_y + target_y) / 2

      let calculated_middle_recycling: number

      if (link.is_horizontal) {
        // Pour un flux horizontal, shape_middle_recycling affecte Y
        calculated_middle_recycling = min_y_to_avoid - ref_y
      } else if (link.is_vertical) {
        // Pour un flux vertical, shape_middle_recycling affecte X
        // On décale vers la gauche pour éviter les nœuds
        const min_x_to_avoid = Math.min(...nodes_to_avoid.map(n => n.position_x)) - safety_margin
        calculated_middle_recycling = min_x_to_avoid - ref_x
      } else {
        // Pour un flux diagonal, calculer le décalage perpendiculaire
        const dx = target_x - source_x
        const dy = target_y - source_y
        const length = Math.sqrt(dx * dx + dy * dy)

        if (length > 0) {
          // Vecteur perpendiculaire normalisé
          // const perp_x = -dy / length
          // const perp_y = dx / length

          // Distance nécessaire pour éviter les nœuds
          const distance_to_avoid = min_y_to_avoid - ref_y
          calculated_middle_recycling = distance_to_avoid / Math.sqrt(2)
        } else {
          calculated_middle_recycling = safety_margin
        }
      }

      // 5. Appliquer la valeur calculée
      link.shape_middle_recycling = calculated_middle_recycling

      console.log(`✅ shape_middle_recycling calculé pour ${link_id}: ${calculated_middle_recycling}`)
    })
  }
  /**
   * Align node pos with grid lines & save it's undo
   *
   */
  public arrangeNodesToGrid = () => {
    const app_data = this.drawingArea.application_data
    const { sankey } = this.drawingArea
    const node_pos = Object.fromEntries(sankey.visible_nodes_list.map(n => [n.id, { x: n.position_x, y: n.position_y }]))
    const container_pos = Object.fromEntries(
      Object.entries(sankey.containers_dict)
        .filter(([, c]) => !c.tied_to_nodes)
        .map(([id, c]) => [id, { x: c.position_x, y: c.position_y }])
    )

    const _arrangeNodesToGrid = () => {
      this._arrangeNodesToGrid()
      app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    }

    const inv_arrangeNodesToGrid = () => {
      sankey.visible_nodes_list.forEach(n => {
        n.setPosXY(node_pos[n.id].x, node_pos[n.id].y)
      })
      Object.entries(container_pos).forEach(([id, pos]) => {
        const container = sankey.containers_dict[id]
        if (container) {
          container.position_x = pos.x
          container.position_y = pos.y
          container.draw()
        }
      })
    }

    app_data.history.saveUndo(inv_arrangeNodesToGrid)
    app_data.history.saveRedo(_arrangeNodesToGrid)
    _arrangeNodesToGrid()
  }
}
