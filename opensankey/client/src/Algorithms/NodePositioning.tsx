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
import { Class_Tag } from '../types/Tag'
import { Class_DataTagGroup, Class_LevelTagGroup } from '../types/TagGroup'
import { Class_DrawingArea } from '../types/DrawingArea'




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
      const incomingLinks = node.input_links_list.filter(link =>
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


      // Algorithme d3-sankey-circular - les liens sont déjà marqués
      Object.values(this.drawingArea.sankey.nodes_dict[node.id].output_links_list)
        .forEach(link => {
          if (!recycling_links_ids.includes(link.id)) {
            this.drawingArea.sankey.links_dict[link.id].shape_is_recycling = false
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
   * @param {Class_NodeElement} node Node to start exploring from
   * @param {Class_NodeElement[]} nodes_to_process
   * @param {number} starting_index
   * @param {string[]} visited_nodes_ids List of nodes (by their id) that have been visited. Helps to find recycling flux
   * @param {string[]} recycling_links_ids Links (by their id) that are detected as recycling link
   * @param {object} horizontal_indexes_per_nodes_ids Current horizontal index for given node id
   */
  public computeHorizontalIndex(
    node: Class_NodeElement,
    nodes_to_process: Class_NodeElement[],
    starting_index: number,
    visited_nodes_ids: string[],
    recycling_links_ids: string[],
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number }
  ) {
    // Update node index
    if (!horizontal_indexes_per_nodes_ids[node.id]) {
      horizontal_indexes_per_nodes_ids[node.id] = starting_index
    }
    else {
      if (starting_index > horizontal_indexes_per_nodes_ids[node.id]) {
        horizontal_indexes_per_nodes_ids[node.id] = starting_index
      }
    }

    // From current node, use output links to recurse on following node
    node
      .output_links_list
      .filter(link =>
      // Computes only for link to visible nodes
      // and not for nodes related to recycling flux
        (nodes_to_process.includes(this.drawingArea.sankey.links_dict[link.id].target as Class_NodeElement) &&
        !recycling_links_ids.includes(link.id)))
      .forEach(link => {
        // Next node to recurse on
        const next_node = this.drawingArea.sankey.nodes_dict[this.drawingArea.sankey.links_dict[link.id].target.id]
        // But first we check if next node has not been already visited
        if (!visited_nodes_ids.includes(next_node.id)) {
          // Recursive calling
          this.computeHorizontalIndex(
            next_node,
            nodes_to_process,
            starting_index + 1,
            [...visited_nodes_ids, node.id],
            recycling_links_ids,
            horizontal_indexes_per_nodes_ids
          )
        }
        else {
          // If next node has already been visited then this means
          // that link between current node and next node is a recycling flux
          recycling_links_ids.push(link.id)
        }
      })
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
    optimize_crossing: boolean
  ) {
    console.log('🔧 Calcul automatique des positions - version améliorée')

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
      this.drawingArea.scale = this.drawingArea.maximum_flux ?
        Math.max(this.drawingArea.maximum_flux, linksMaxValue) : linksMaxValue
    }

    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ?
      this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    const nodes_to_process = this.drawingArea.sankey.visible_nodes_list.filter(n =>
      !echangeTag || !n.hasGivenTag(echangeTag))

    // ÉTAPE 1: Calcul des index horizontaux - VERSION AMÉLIORÉE
    const horizontal_indexes_per_nodes_ids: { [node_id: string]: number } = {}
    const possible_recycling_links_ids: string[] = []

    // Initialiser tous les nœuds à index -1
    nodes_to_process.forEach(node => {
      horizontal_indexes_per_nodes_ids[node.id] = -1
    })

    // Identifier et traiter les nœuds sources en priorité
    const source_nodes = nodes_to_process.filter(node => !node.hasInputLinks() && node.hasOutputLinks())
    const lone_nodes = nodes_to_process.filter(node => !node.hasInputLinks() && !node.hasOutputLinks())

    console.log('🌱 Nœuds sources:', source_nodes.map(n => n.id))
    console.log('🏝️ Nœuds isolés:', lone_nodes.map(n => n.id))

    // Traiter les nœuds sources
    source_nodes.forEach(node => {
      if (horizontal_indexes_per_nodes_ids[node.id] === -1) {
        console.log(`🚀 Traitement depuis le nœud source: ${node.id}`)
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
        console.log(`🔄 Traitement composante isolée depuis: ${node.id}`)
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

    console.log('📊 Index horizontaux après calcul:', horizontal_indexes_per_nodes_ids)
    console.log('♻️ Liens de recyclage détectés:', possible_recycling_links_ids)

    // ÉTAPE 3: Construction des structures de données (logique existante)
    let max_horizontal_index = 0
    const nodes_per_horizontal_indexes: { [index: number]: Class_NodeElement[] } = {}

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

        // Marquer les liens de recyclage
        node.output_links_list.forEach(link => {
          const target_node_id = this.drawingArea.sankey.links_dict[link.id].target.id
          const target_index = horizontal_indexes_per_nodes_ids[target_node_id]

          if (target_index !== undefined && node_index >= target_index) {
            this.drawingArea.sankey.links_dict[link.id].shape_is_recycling = true
          } else {
            this.drawingArea.sankey.links_dict[link.id].shape_is_recycling = false
          }
        })
      }
    })

    // ÉTAPE 4: Repositionnement des nœuds sans entrée (logique existante préservée)
    this.repositionNodesWithoutInputs(
      nodes_per_horizontal_indexes,
      horizontal_indexes_per_nodes_ids,
      max_horizontal_index
    )

    // ÉTAPE 5: Calcul des positions finales (logique existante)
    this.computeFinalPositions(
      nodes_per_horizontal_indexes,
      horizontal_indexes_per_nodes_ids,
      max_horizontal_index,
      optimize_crossing
    )

    const tmp = this.drawingArea.sankey.nodes_list.filter(n =>
      !echangeTag || !n.hasGivenTag(echangeTag))
    tmp.forEach(n => this.setNodeLabelPositioning(n))
  }

  /**
   * Version améliorée de computeHorizontalIndex qui évite les problèmes de positionnement
   */
  private computeHorizontalIndexImproved(
    node: Class_NodeElement,
    nodes_to_process: Class_NodeElement[],
    starting_index: number,
    visited_nodes_ids: string[],
    recycling_links_ids: string[],
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number }
  ) {
    // Mettre à jour l'index du nœud actuel
    const current_index = Math.max(starting_index, horizontal_indexes_per_nodes_ids[node.id] || 0)
    horizontal_indexes_per_nodes_ids[node.id] = current_index

    console.log(`📍 Nœud ${node.id}: index ${current_index}`)

    // Parcourir les liens sortants
    node.output_links_list
      .filter(link => {
        const target = this.drawingArea.sankey.links_dict[link.id].target
        return nodes_to_process.some(n => n.id === target.id) &&
          !recycling_links_ids.includes(link.id)
      })
      .forEach(link => {
        const next_node = this.drawingArea.sankey.nodes_dict[
          this.drawingArea.sankey.links_dict[link.id].target.id
        ]

        if (!visited_nodes_ids.includes(next_node.id)) {
          // Récursion normale
          this.computeHorizontalIndexImproved(
            next_node,
            nodes_to_process,
            current_index + 1,
            [...visited_nodes_ids, node.id],
            recycling_links_ids,
            horizontal_indexes_per_nodes_ids
          )
        } else {
          // Cycle détecté -> lien de recyclage
          console.log(`♻️ Lien de recyclage détecté: ${link.id} (${node.id} → ${next_node.id})`)
          recycling_links_ids.push(link.id)
        }
      })
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
    optimize_crossing: boolean
  ) {
    // Utiliser la logique existante de positionnement vertical
    // mais avec les corrections de la méthode updateNodesPositions précédente

    const height_per_nodes_ids: { [node_id: string]: number } = {}
    const height_cumul_per_indexes: number[] = []
    const node_id_per_hxv_indexes: string[][] = []
    let max_height_cumul = 0

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
        height_cumul_for_index += node_height
      })


      height_cumul_for_index += (nodes_per_horizontal_indexes[h_index].length - 1) * this.drawingArea.sankey.node_styles_dict['default'].position.dy!
      if (height_cumul_for_index > max_height_cumul) {
        max_height_cumul = height_cumul_for_index
      }
      height_cumul_per_indexes.push(height_cumul_for_index)
      node_id_per_hxv_indexes.push(nodes_ids_per_vertical_index)
    }
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ?
      this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    // Positionnement final avec la logique corrigée
    this.updateNodesPositions(
      node_id_per_hxv_indexes,
      height_per_nodes_ids,
      height_cumul_per_indexes,
      max_height_cumul,
      max_horizontal_index,
      echangeTag
    )
    this.optimizeCrossingsPositioning(optimize_crossing)
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
        this.computeMargins(node, h_index, max_horizontal_index, node.position_dx, node.position_dx)

        // Set label positioning if launched from process
        if (launched_from_process) {
          this.setNodeLabelPositioning(node)
        }
      })

      // Get horizontal index that needs the most vertical space
      height_cumul_for_index += (nodes_per_horizontal_indexes[h_index].length - 1) * this.drawingArea.sankey.node_styles_dict['default'].position.dy!
      if (height_cumul_for_index > max_height_cumul) {
        max_height_cumul = height_cumul_for_index
      }
      height_cumul_per_indexes.push(height_cumul_for_index)
      node_id_per_hxv_indexes.push(nodes_ids_per_vertical_index)
    }

    max_horizontal_index = (node_id_per_hxv_indexes.length - 1)

    // Update horizontal and vertical position of nodes
    this.updateNodesPositions(
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
      const node_label_width = this.drawingArea.sankey.node_styles_dict[style_node.id].name_label_box_width!
      const needed_margin = this.drawingArea.grid_size + node_label_width
      if (needed_margin > h_left_margin) {
        h_left_margin = needed_margin
      }
    }

    // Compute right horizontal margin
    if (h_index == max_horizontal_index) {
      const style_node = node.getStyleWithAttr('name_label_box_width')
      const node_label_width = this.drawingArea.sankey.node_styles_dict[style_node.id].name_label_box_width!
      const needed_margin = this.drawingArea.grid_size + node_label_width
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
  private updateNodesPositions(
    node_id_per_hxv_indexes: string[][],
    height_per_nodes_ids: { [node_id: string]: number },
    height_cumul_per_indexes: number[],
    max_height_cumul: number,
    max_horizontal_index: number,
    echangeTag?: Class_Tag
  ) {

    const v_margin = this.drawingArea.sankey.node_styles_dict['default'].position.dy!

    let shift = 0
    const horizontal_spacing = this.drawingArea.sankey.nodes_dict[node_id_per_hxv_indexes[0][0]].position_dx

    console.log('🔧 Positionnement des nœuds (sans optimisation croisements)...')

    // ÉTAPE 1: Calculer les positions X
    for (let horizontal_index = 0; horizontal_index <= max_horizontal_index; horizontal_index++) {
      if (!node_id_per_hxv_indexes[horizontal_index]) {
        continue
      }
      const h_position_for_index = horizontal_spacing + horizontal_index * horizontal_spacing
      node_id_per_hxv_indexes[horizontal_index].forEach((node_id) => {
        this.drawingArea.sankey.nodes_dict[node_id].position_x = h_position_for_index
      })
    }
    let prev_col_width = 0
    // ÉTAPE 2: Calculer les positions Y avec la logique center_biggest_nodes
    for (let horizontal_index = 0; horizontal_index <= max_horizontal_index; horizontal_index++) {
      if (!node_id_per_hxv_indexes[horizontal_index]) {
        continue
      }

      const center_biggest_nodes = (node_id_per_hxv_indexes[horizontal_index].length > 2) && false
      const h_position_for_index = prev_col_width + horizontal_spacing + horizontal_index * horizontal_spacing
      const v_margin_for_index = v_margin + (max_height_cumul - height_cumul_per_indexes[horizontal_index]) / 2
      let upper_node_height_and_margin = Math.max(0, v_margin_for_index + shift)

      console.log(`🏛️ Colonne ${horizontal_index}: center_biggest_nodes=${center_biggest_nodes}`)

      // if (center_biggest_nodes === true) {
      //   // LOGIQUE ALTERNÉE : Du bas vers le haut, puis du haut vers le bas
      //   let last_index = (node_id_per_hxv_indexes[horizontal_index].length - 1)
      //   let col_max_w_col = 0
      //   for (let index = last_index; index >= 0; index -= 2) {
      //     const node_id = node_id_per_hxv_indexes[horizontal_index][index]

      //     this.drawingArea.sankey.nodes_dict[node_id].position_x = h_position_for_index
      //     this.drawingArea.sankey.nodes_dict[node_id].position_y = upper_node_height_and_margin

      //     const node_height = height_per_nodes_ids[node_id]
      //     upper_node_height_and_margin += node_height + v_margin

      //     const node_w = this.drawingArea.sankey.nodes_dict[node_id].shape_min_width
      //     if (node_w > col_max_w_col) col_max_w_col = node_w

      //     last_index = index
      //   }

      //   if (last_index == 0) {
      //     last_index = 1
      //   } else {
      //     last_index = 0
      //   }

      //   for (let index = last_index; index < node_id_per_hxv_indexes[horizontal_index].length; index += 2) {
      //     const node_id = node_id_per_hxv_indexes[horizontal_index][index]

      //     this.drawingArea.sankey.nodes_dict[node_id].position_x = h_position_for_index
      //     this.drawingArea.sankey.nodes_dict[node_id].position_y = upper_node_height_and_margin

      //     const node_height = height_per_nodes_ids[node_id]
      //     upper_node_height_and_margin += node_height + v_margin
      //   }
      //   if (col_max_w_col > 50) prev_col_width += col_max_w_col
      // } else {
      // LOGIQUE SIMPLE : Positionnement séquentiel avec alignements spéciaux
      let col_max_w_col = 0
      node_id_per_hxv_indexes[horizontal_index].forEach((node_id, idx) => {
        this.drawingArea.sankey.nodes_dict[node_id].position_x = h_position_for_index
        this.drawingArea.sankey.nodes_dict[node_id].position_y = upper_node_height_and_margin

        // Logique d'alignement pour les liens spéciaux
        const import_link = this.drawingArea.sankey.nodes_dict[node_id].input_links_list.filter(l =>
          echangeTag && l.source.hasGivenTag(echangeTag)
        )

        if (import_link.length > 0) {
          this.drawingArea.sankey.nodes_dict[node_id].position_y -= import_link[0].thickness
          if (idx == 0) {
            shift = this.drawingArea.sankey.nodes_dict[node_id].position_y - upper_node_height_and_margin
          }
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
              if (idx == 0) {
                shift = this.drawingArea.sankey.nodes_dict[node_id].position_y - upper_node_height_and_margin
              }
            } else if (non_recycling_input_links.filter(l =>
              l.source.output_links_list.filter(ol => ol.is_visible).length == 1
            ).length == 1 && idx == 0) {
              // Alignement des centres
              const source_node = non_recycling_input_links[0].source
              const current_node = this.drawingArea.sankey.nodes_dict[node_id]
              const source_center_y = source_node.position_y + source_node.getShapeHeightToUse() / 2
              const current_node_half_height = current_node.getShapeHeightToUse() / 2
              const aligned_position_y = source_center_y - current_node_half_height

              this.drawingArea.sankey.nodes_dict[node_id].position_y = aligned_position_y

              if (idx == 0) {
                shift = this.drawingArea.sankey.nodes_dict[node_id].position_y - upper_node_height_and_margin
              }
            }
          }
        }

        const node_height = height_per_nodes_ids[node_id]
        upper_node_height_and_margin += node_height + v_margin

        const node_w = this.drawingArea.sankey.nodes_dict[node_id].shape_min_width
        if (node_w > col_max_w_col) col_max_w_col = node_w
      })
      if (col_max_w_col > 50) prev_col_width = col_max_w_col
      //}

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
  public optimizeCrossingsPositioning(apply_optimization: boolean = true) {
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

    // Regrouper les nœuds par position X approximative
    nodes_to_process.forEach(node => {
      const h_index = Math.round(node.position_x / node.position_dx)
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
    const v_margin = this.drawingArea.sankey.node_styles_dict['default'].position.dy!
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
        const adjustment = column_adjustments[node_id]
        if (Math.abs(adjustment) > 0.1) { // Seuil minimum pour éviter les micro-ajustements
          const current_y = this.drawingArea.sankey.nodes_dict[node_id].position_y
          const new_y = Math.max(0, current_y + adjustment) // Éviter les Y négatifs

          this.drawingArea.sankey.nodes_dict[node_id].position_y = new_y
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
      if (node.style.length < 2) node.style = [
        this.drawingArea.sankey.node_styles_dict['NodeSectorStyle'],
        this.drawingArea.sankey.node_styles_dict['NodeImportExportCloseStyle']
      ]
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

    let max_vertical_offset = 0
    other_nodes.forEach(n =>
      max_vertical_offset = Math.max(n.position_y + n.getShapeHeightToUse(), max_vertical_offset)
    )
    max_vertical_offset = max_vertical_offset + 200

    import_nodes.forEach(node => {
      const output_link = node.output_links_list[0]
      const target_node = output_link.target
      node.position_u = target_node.position_u
      node.position_v = target_node.position_v
      if (compute_xy) {
        const x = target_node.position_x + node.position_dx
        node.position_x = x
        node.position_y = 50
      }
    })

    export_nodes.forEach(node => {
      const input_link = node.input_links_list[0]
      const source_node = input_link.source
      node.position_u = source_node.position_u
      node.position_v = source_node.position_v
      if (node.position_x < source_node.position_x) {
        node.position_x = source_node.position_x + 1
      }
      if (compute_xy) {
        const x = source_node.position_x + node.position_dx
        node.position_x = x
        node.position_y = max_vertical_offset
      }
    })
  }

  // PARAMETRIZATION METHODS ============================================================

  /**
   * Computes u,v for nodes in the drawing area
   * Utilise l'algorithme amélioré
   */
  public computeParametrization(use_horizontal_index: boolean) {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ?
      this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    const nodes_to_process = this.drawingArea.sankey.visible_nodes_list.filter(n =>
      !echangeTag || !n.hasGivenTag(echangeTag))

    // Utiliser l'algorithme amélioré
    if (use_horizontal_index) {
      const result = this.detectAllCyclesAndOptimize(nodes_to_process)
      const horizontal_indexes_per_nodes_ids = result.horizontal_indexes

      nodes_to_process.forEach(node => {
        const node_index = horizontal_indexes_per_nodes_ids[node.id]
        node.display.position.u = node_index + 1
      })
    } else {
      nodes_to_process.forEach(node => {
        node.display.position.u = Math.round(node.display.position.x / this.drawingArea.sankey.node_styles_dict['default'].position.dx!)
      })
    }

    this.computeParametricV()
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

    // Calcul des positions dy
    Object.values(columns).forEach(column => {
      column.sort((n1, n2) => n1.position_y - n2.position_y)
      column.forEach((n, i) => {
        if (i == 0) {
          return
        }
        const dy = n.position_y - column[i - 1].position_y - column[i - 1].getShapeHeightToUse()
        if (dy !== 0) {
          n.position_dy = dy
        } else {
          //delete n.local!.dy
        }
      })
    })

    return columns
  }

  // Fonction qui applique le V pour un level tag donné
  private applyVForLevelTag(columns: { [_: number]: Class_NodeElement[] }, tagGroup: Class_LevelTagGroup) {
    Object.values(columns).forEach(column => {
      column.sort((n1, n2) => n1.position_y - n2.position_y)
      let current_v = 0
      column.forEach(n => {
        n.position_v = -1 
        current_v = this.applyVDesagregate(n, current_v, tagGroup)
      }) 
    })
    Object.values(columns).forEach(column => {
      column.forEach(n => this.applyVAgregate(n, tagGroup))
    })
  }

  // Fonction principale refactorisée
  public computeParametricV() {
    const columns = this.computeColumns()

    if (this.drawingArea.sankey.level_taggs_list.length == 0) {
      Object.values(columns).forEach(column => {
        column.sort((n1, n2) => n1.position_y - n2.position_y)
        let current_v = 0
        column.forEach(n => n.position_v = current_v++)
      })
    }

    this.drawingArea.sankey.level_taggs_list.forEach(tagGroup => {
      this.applyVForLevelTag(columns, tagGroup)
    })

    this.drawingArea.sankey.sortNodes()
  }

  // Fonction qui compute le V paramétrique pour un tag spécifique
  public computeParametricVForTagg(tagGroup: Class_LevelTagGroup) {
    const columns = this.computeColumns()
    this.applyVForLevelTag(columns, tagGroup)
    this.drawingArea.sankey.sortNodes()
  }
  /**
   * Apply v aggregation for nodes
   */
  public applyVAgregate(node: Class_NodeElement, tagGroup: Class_LevelTagGroup) {
    const nodeDimParent = node.nodeDimensionAsChild(tagGroup)
    if (!nodeDimParent) {
      return
    }
    if (nodeDimParent.parent.display.position.v != -1) {
      // v is computed at the first path
      return
    }
    nodeDimParent.parent.display.position.y = node.position_y
    nodeDimParent.parent.display.position.u = node.position_u
    nodeDimParent.parent.display.position.v = node.position_v
    this.applyVAgregate(nodeDimParent.parent as Class_NodeElement, tagGroup)
  }

  /**
   * Apply v disaggregation for nodes
   */
  public applyVDesagregate(
    node: Class_NodeElement,
    current_v: number,
    tagGroup: Class_LevelTagGroup
  ) {
    // if (node.master_node) {
    //   return current_v
    // }
    if (node.display.position.v == -1) {
      // v is computed at the first path
      node.display.position.v = current_v
    }
    let new_current_v = current_v
    // let desagregated_nodes: Class_NodeElement[] = []
    //node.dimensions_as_parent_pure.forEach(d => {
    const d = node.nodeDimensionAsParent(tagGroup)
    if (!d) return new_current_v + 1
    if (d.children.includes(node)) return new_current_v + 1
    const desagregated_nodes = d.children

    const shift_y = (desagregated_nodes.length - 1) / 2 * node.position_dy
    if (desagregated_nodes.length > 0) {
      let current_y = node.position_y + node.getShapeHeightToUse() / 2 - shift_y - desagregated_nodes[0].getShapeHeightToUse()
      desagregated_nodes.forEach(nn => {
        if (nn.master_node) {
          return
        }
        nn.display.position.v = -1
        nn.display.position.x = node.position_x
        nn.display.position.u = node.position_u
        nn.display.position.y = current_y
        current_y += nn.getShapeHeightToUse() + nn.position_dy
        new_current_v = this.applyVDesagregate(nn, new_current_v, tagGroup)
      })
    }
    //})
    return new_current_v + 1
  }

  // UTILITY METHODS ====================================================================

  /**
   * Auto-compute sankey with waiting toast
   */
  public computeAutoSankeyWithToast(launched_from_process: boolean, optimize_crossing: boolean) {
    this.drawingArea.application_data.sendWaitingToast(
      () => {
        // If it's not launched_from_process then we assume it's user input so we save it undoing
        if (!launched_from_process) {
          const node_pos = Object.fromEntries(this.drawingArea.sankey.visible_nodes_list.map(n => [n.id, { x: n.display.position.x, y: n.display.position.y, links_order: n.links_order_visible.map(l => l.id) }]))
          const link_recy = Object.fromEntries(this.drawingArea.sankey.visible_links_list.map(l => [l.id, l.shape_is_recycling]))

          const inv_computeAutoSankey = () => {
            this.drawingArea.sankey.visible_links_list.forEach(l => l.shape_is_recycling = link_recy[l.id])
            // Reposition node to old pos
            this.drawingArea.sankey.visible_nodes_list.forEach(n => {
              n.display.position.x = node_pos[n.id].x
              n.display.position.y = node_pos[n.id].y
              // Reset old node IO order
              n.reorganizeIOFromListIds(node_pos[n.id].links_order)
              n.draw()
            })
            this.drawingArea.areaAutoFit(true)
          }
          this.drawingArea.saveUndo(inv_computeAutoSankey)
        }

        // Compute auto pos of nodes
        this.computeAutoSankey(launched_from_process, optimize_crossing)
        this.computeParametrization(true)

        if (launched_from_process) {
          // Split trade nodes
          // this.splitTrade()
          // Computes u v,x and initial y for trade nodes
          this.arrangeTrade(true)
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
        // Update area
        this.drawingArea.areaAutoFit(true)
        // Toggle saving indicator
        this.drawingArea.application_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)

        // If it's not launched_from_process then we assume it's user input so we save it undoing
        if (!launched_from_process) {
          const node_pos = Object.fromEntries(this.drawingArea.sankey.visible_nodes_list.map(n => [n.id, { x: n.display.position.x, y: n.display.position.y, links_order: n.links_order_visible.map(l => l.id) }]))
          const link_recy = Object.fromEntries(this.drawingArea.sankey.visible_links_list.map(l => [l.id, l.shape_is_recycling]))

          const _computeAutoSankey = () => {
            this.drawingArea.sankey.visible_links_list.forEach(l => l.shape_is_recycling = link_recy[l.id])

            // Reposition node to old pos
            this.drawingArea.sankey.visible_nodes_list.forEach(n => {
              n.display.position.x = node_pos[n.id].x
              n.display.position.y = node_pos[n.id].y
              // Reset old node IO order
              n.reorganizeIOFromListIds(node_pos[n.id].links_order)
              n.draw()
            })
            this.drawingArea.areaAutoFit(true)
          }
          this.drawingArea.saveRedo(_computeAutoSankey)
        }
      },
      {
        success: {
          title: this.drawingArea.application_data.t('toast.compute_auto_sankey.success.title')
        },
        loading: {
          title: this.drawingArea.application_data.t('toast.compute_auto_sankey.loading.title')
        }
      }
    )
  }

  /**
   * Reposition visible nodes so that their left/top side is close to a grid line
   */
  protected _arrangeNodesToGrid() {
    this.drawingArea.sankey.visible_nodes_list.forEach(node => {
      const shift_x = node.position_x - (node.position_x % this.drawingArea.grid_size)// get position so that the node position_x is set to previous horizontal grid line
      const shift_y = node.position_y - (node.position_y % this.drawingArea.grid_size)// get position so that the node position_y is set to previous vertical grid line
      node.setPosXY(shift_x, shift_y)
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
      const safety_margin = this.drawingArea.sankey.node_styles_dict['default'].position.dy!
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
    const node_pos = Object.fromEntries(sankey.visible_nodes_list.map(n => [n.id, { x: n.display.position.x, y: n.display.position.y }]))

    const _arrangeNodesToGrid = () => {
      this._arrangeNodesToGrid()
      app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    }

    const inv_arrangeNodesToGrid = () => {
      sankey.visible_nodes_list.forEach(n => {
        n.setPosXY(node_pos[n.id].x, node_pos[n.id].y)
      })
    }

    app_data.history.saveUndo(inv_arrangeNodesToGrid)
    app_data.history.saveRedo(_arrangeNodesToGrid)
    _arrangeNodesToGrid()
  }
}
