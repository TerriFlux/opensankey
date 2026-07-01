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
import { Class_DataTag, Class_LevelTag, Class_Tag } from '../types/Tag'
import { Class_DataTagGroup } from '../types/TagGroup'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Type_DisaggregationGap } from '../types/Utils'
import { PAPER_TARGET_FONT_SIZES, Type_StraightMode } from '../Elements/ElementsAttributesConfig'
import { NodeImportExportAboveBelowStyle, NodeImportExportCloseStyle, NodeLeftExtremityStyle, NodeRightExtremityStyle, NodeSectorStyle } from '../Elements/ElementStyle'


/**
 * Class responsible for node and link positioning logic
 * Handles auto-sankey computation, parametrization, and trade arrangements
 */
export class NodePositioning {
  private drawingArea: Class_DrawingArea

  // #1231 — Mode proportionnel : cadre de référence capturé à l'entrée du mode
  // (et après drag / changement de vue). Trois repères : médiane (centre de gravité),
  // haut et bas. `_prop_ref_col_sums` = somme des hauteurs de nœuds par colonne au
  // datatag de référence ; sert à calculer le facteur de compression f = plus petit
  // ratio (somme courante / somme de référence) sur les colonnes. Transitoires.
  private _prop_median_y: number | undefined = undefined
  private _prop_top_y: number | undefined = undefined
  private _prop_bottom_y: number | undefined = undefined
  private _prop_ref_col_sums: Map<number, number> | undefined = undefined

  // #1231 — Flux de référence (sélectionné au clic droit) du mode proportionnel. Si défini
  // et visible :
  //  - la médiane (centre de gravité, FIXE) = centre vertical du flux à mi-parcours,
  //  - le facteur f = épaisseur courante du flux / épaisseur capturée (`_prop_ref_flux_thickness`).
  // Sinon : fallback sur l'ancien calcul (moyenne des centres de colonnes / max ratio de sommes).
  // Transitoires (jamais persistés).
  private _prop_reference_link: Class_LinkElement | undefined = undefined

  // #1231b — Élément de référence GÉNÉRALISÉ : un nœud (dans sa représentation stock) peut
  // jouer le même rôle que le flux de référence. Mutuellement exclusif avec
  // `_prop_reference_link` (un seul élément de référence à la fois). Si défini et visible :
  //  - la médiane (centre de gravité) = centre vertical du nœud,
  //  - le facteur f = stock courant / stock au datatag de référence.
  // La valeur du stock = stock initial (cf. Node.currentStockInitialForHeight). Transitoire.
  private _prop_reference_node: Class_NodeElement | undefined = undefined

  // #1231 — Datatag de RÉFÉRENCE (ids des tags datatag sélectionnés au moment où le flux de
  // référence a été défini). Les pourcentages sont calculés pour le couple (flux, datatag) :
  // f = valeur(flux, datatag courant) / valeur(flux, datatag de réf). PERSISTÉ (avec le flux
  // de référence) ; le MODE proportionnel lui-même n'est pas persisté.
  private _prop_reference_datatag_ids: string[] | undefined = undefined

  // #1231 — Mode « échelle adaptée » : au lieu de bouger les nœuds, on ajuste l'échelle
  // (valeur→px) pour que le flux de référence garde TOUJOURS la même épaisseur. Comme
  // l'épaisseur ∝ valeur / échelle, on garde `échelle / valeur_flux` constant : à chaque
  // datatag, échelle = échelle_ref × (valeur_flux_courante / valeur_flux_ref). On capture
  // l'échelle et la valeur du flux à l'entrée du mode. Transitoires.
  private _scale_adapted_ref_value: number | undefined = undefined
  private _scale_adapted_ref_scale: number | undefined = undefined

  // #1231 — Drapeau de suppression de la compression proportionnelle pendant une
  // opération STRUCTURELLE (englobement, désagrégation, expansion…). Ces opérations
  // créent des états transitoires où une colonne contient à la fois le parent ET ses
  // enfants (ex. englobement : parent-cadre + enfants visibles) → la somme de colonne
  // double brièvement → f bondit (max ratio) → tout le diagramme se dilate, et la
  // re-capture en fin d'opération FIGE cet état dilaté. La compression ne doit réagir
  // qu'aux changements de datatag/vue, pas aux changements de structure. Posé autour de
  // l'opération, levé juste avant la re-capture finale (cf. NodeActions/Hierarchies).
  public suppressProportionalCompression = false

  // #1231 — Mode « écart » (ex-paramétrique) : réutilise intégralement le cadre du mode
  // proportionnel (médiane globale `_prop_median_y`, facteur f via `_prop_ref_col_sums`,
  // centre de réf PAR NŒUD `_prop_center_ref` sur NodeBase). Seule l'application diffère :
  // le NŒUD DU HAUT de chaque colonne prend sa position % (comme le mode proportionnel),
  // puis le reste s'empile dessous avec des écarts constants. Pas de champ dédié.

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
    echangeTag?: Class_Tag,
    user_forced_recycling_ids?: Set<string>
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
      // Préserver les liens forcés recyclage par l'utilisateur (snapshot de
      // shape_is_recycling=true pris en début de calcul).
      Object.values(this.drawingArea.sankey.nodes_dict[node.id].output_links_list)
        .forEach(link => {
          const link_data = this.drawingArea.sankey.links_dict[link.id]
          if (user_forced_recycling_ids && user_forced_recycling_ids.has(link.id)) {
            link_data.shape_is_recycling = true
            return
          }
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
    // Recalcul automatique : on relâche tous les cadenas d'ancres E/S posés
    // manuellement par l'utilisateur (drag de poignée / menu "Ordre des flux E/S").
    this.drawingArea.sankey.links_list.forEach(l => l.resetAnchorLocks())
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

    // Snapshot des liens dont l'utilisateur a verrouillé le statut recyclage
    // AVANT recalcul. Sémantique (issue OpenSankey#711, retour Alexandre 13/05) :
    // tristate via shape_is_recycling_locked (cadenas) + shape_is_recycling :
    //   - locked + true  → forcé recyclage (le calcul auto le préserve)
    //   - locked + false → forcé non-recyclage (préservé visuellement ; limitation :
    //     pas de support DFS dédié, le cycle peut quand même être coupé ailleurs ;
    //     si le DFS choisit ce flux comme back-edge, il restera affiché droit
    //     mais l'index horizontal sera incohérent)
    //   - unlocked       → auto, l'algo décide librement
    const user_forced_recycling_ids = new Set<string>(
      this.drawingArea.sankey.visible_links_list
        .filter(l => l.shape_is_recycling_locked === true && l.shape_is_recycling === true)
        .map(l => l.id)
    )
    const user_forbidden_recycling_ids = new Set<string>(
      this.drawingArea.sankey.visible_links_list
        .filter(l => l.shape_is_recycling_locked === true && l.shape_is_recycling === false)
        .map(l => l.id)
    )

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
      // Mark recycling links — préserver les liens verrouillés par l'utilisateur.
      nodes_to_process.forEach(node => {
        const node_index = horizontal_indexes_per_nodes_ids[node.id]
        node.output_links_list.forEach(link => {
          const link_data = this.drawingArea.sankey.links_dict[link.id]
          if (user_forced_recycling_ids.has(link.id)) {
            link_data.shape_is_recycling = true
            return
          }
          if (user_forbidden_recycling_ids.has(link.id)) {
            link_data.shape_is_recycling = false
            return
          }
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

      // Pré-amorçage : les liens marqués recyclage par l'utilisateur
      // (snapshot user_forced_recycling_ids) sont injectés dans la liste des
      // liens recyclage avant le DFS. Ainsi, la détection de cycles les
      // considère déjà coupés et ne descend pas par eux pour calculer les
      // index horizontaux.
      user_forced_recycling_ids.forEach(link_id => {
        possible_recycling_links_ids.push(link_id)
      })

      // Initialiser tous les nœuds à index -1
      nodes_to_process.forEach(node => {
        horizontal_indexes_per_nodes_ids[node.id] = -1
      })

      // Identifier et traiter les nœuds sources en priorité.
      // On compte les liens « structurels » (is_visible_ignoring_zero) et pas seulement
      // is_visible : un flux à valeur nulle (souvent fraîchement créé) doit quand même
      // relier ses nœuds pour l'indexation horizontale, sinon le nœud cible apparaît
      // comme une source/un nœud isolé et se retrouve mal placé en X (position_u, lui,
      // ignore déjà la valeur — d'où la divergence X/U observée).
      const hasLayoutInput = (node: Class_NodeElement) => node.input_links_list.some(l => l.is_visible_ignoring_zero)
      const hasLayoutOutput = (node: Class_NodeElement) => node.output_links_list.some(l => l.is_visible_ignoring_zero)
      const source_nodes = nodes_to_process.filter(node => !hasLayoutInput(node) && hasLayoutOutput(node))
      const lone_nodes = nodes_to_process.filter(node => !hasLayoutInput(node) && !hasLayoutOutput(node))

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

      // Set des liens reconnus comme recyclage par la détection de cycles.
      // possible_recycling_links_ids contient les back-edges trouvées par DFS
      // (computeHorizontalIndexImproved) ET les liens pré-amorcés par
      // l'utilisateur (cf. ÉTAPE 1). On utilise cette source de vérité pour
      // le marquage final, plutôt qu'une comparaison node_index >= target_index :
      // quand l'utilisateur force UN flux d'un cycle comme recyclage, le DFS
      // coupe à cet endroit et n'identifie PAS d'autres back-edges dans ce
      // cycle ; mais la comparaison d'index re-flaguait quand même les autres
      // arêtes du cycle (qui se retrouvent backward après relaxation
      // topologique des index). Le set unique garantit la sémantique
      // « candidate » : un seul flux user-forcé suffit à forcer les autres
      // du même cycle à non-recyclage.
      const auto_recycling_set = new Set(possible_recycling_links_ids)

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

          // Marquer les liens de recyclage. auto_recycling_set inclut déjà
          // les liens pré-amorcés par l'utilisateur (cf. ÉTAPE 1), donc le
          // statut user-forcé est naturellement préservé. Pour les liens
          // user-interdits (locked + false), on force shape_is_recycling=false
          // même si le DFS les a identifiés comme back-edge — limitation
          // documentée plus haut.
          node.output_links_list.forEach(link => {
            const link_data = this.drawingArea.sankey.links_dict[link.id]
            if (user_forbidden_recycling_ids.has(link.id)) {
              link_data.shape_is_recycling = false
              return
            }
            link_data.shape_is_recycling = auto_recycling_set.has(link.id)
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
   * #1230 — Mode coordonnées absolues : garde le centre des nœuds fixe quand leur
   * taille de rendu change (échelle globale des flux, valeur, bascule de
   * vue/datatag). Pendant du `recomputeParametricLayout` pour le mode absolu,
   * appelé en tête de `drawElements` avant `_sankey.draw()` pour que le coin
   * recalculé soit utilisé dès cette frame.
   *
   * N'agit que sur les nœuds « libres » en absolu : exclut les nœuds `relative`
   * (collés à un voisin, position auto-calculée) et les cadres tied (taille pilotée
   * par l'enveloppe de leurs enfants — re-centrer se battrait avec
   * `expandToContainAttachedNodes`).
   */
  public anchorAbsoluteNodesByCenter() {
    this.drawingArea.sankey.nodes_list.forEach(n => {
      if (!n.is_visible) return
      if (n.shape_position_type === 'relative') return
      if (n.tied_to_nodes && n.attached_node.length > 0) return
      n.anchorByCenterIfResized()
    })
  }

  /**
   * #1231 (1.1.5) — Force le retour des nœuds « libres » à leur vraie position absolue
   * (coin = centre stocké − taille/2), en ignorant l'heuristique « taille inchangée » de
   * `anchorByCenterIfResized` (qui recommiterait le coin d'affichage). Mêmes exclusions que
   * `anchorAbsoluteNodesByCenter`. Appelé en sortie de proportionnel / échelle.
   */
  public deriveAbsoluteNodesFromCenter() {
    this.drawingArea.sankey.nodes_list.forEach(n => {
      if (!n.is_visible) return
      if (n.shape_position_type === 'relative') return
      if (n.tied_to_nodes && n.attached_node.length > 0) return
      n.forceDeriveFromCenter()
    })
  }

  /**
   * Mix de positionnement PAR NŒUD, indépendant du mode global.
   *
   * Les nœuds marqués `absolute` restent placés par le mode global (absolu garde le
   * centre fixe, proportionnel comprime, etc.) — on n'y touche pas. Les nœuds marqués
   * `parametric` (« Ecartement ») se recalent verticalement sous le nœud directement
   * AU-DESSUS d'eux dans leur colonne (`position_u`, ordre `position_v`), à l'écart
   * constant `shape_position_dy`. Le nœud du dessus peut être un nœud absolu (servant
   * d'ancre) ou un parametric déjà calé → une pile de parametrics pend sous l'ancre
   * absolue.
   *
   * Le premier nœud d'une colonne, s'il est `parametric`, n'a pas de nœud au-dessus :
   * il conserve la position que le mode global vient de lui donner (repli
   * proportionnel/absolu courant).
   *
   * À appeler en fin de placement global, AVANT `_sankey.draw()`. À NE PAS appeler en
   * mode global `parametric` (recomputeParametricLayout empile déjà la colonne entière).
   *
   * Exclus : nœuds invisibles, échange, `relative` (collés à un voisin), enfants de
   * cadre englobant (positionnés par leur container).
   */
  public anchorParametricNodesToAbsolute() {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    const isContainerChild = (n: Class_NodeElement): boolean =>
      n.dimensions_as_child.some(d => d.container_mode)

    const members = this.drawingArea.sankey.visible_nodes_list.filter(n => {
      if (!n.is_visible) return false
      if (echangeTag && n.hasGivenTag(echangeTag)) return false
      if (n.shape_position_type === 'relative') return false
      if (isContainerChild(n)) return false
      return true
    })

    // Rien à faire si aucune colonne ne contient de nœud parametric.
    if (!members.some(n => n.shape_position_type === 'parametric')) return

    const columns = new Map<number, Class_NodeElement[]>()
    members.forEach(n => {
      const col = columns.get(n.position_u) ?? []
      col.push(n)
      columns.set(n.position_u, col)
    })

    columns.forEach(column => {
      const sorted = [...column].sort((a, b) => {
        if (a.position_v !== b.position_v) return a.position_v - b.position_v
        return a.position_y - b.position_y
      })
      let prev_bottom: number | null = null
      sorted.forEach(node => {
        if (node.shape_position_type === 'parametric' && prev_bottom !== null) {
          node.position_y = prev_bottom + (node.shape_position_dy ?? 0)
          node.applyPosition()
        }
        prev_bottom = node.position_y + node.getShapeHeightToUse()
      })
    })
  }

  /**
   * #1231 — Nœuds « libres » éligibles au mode proportionnel : visibles, non-échange,
   * non-relatifs, hors cadres tied. (Filtre commun capture/replacement.)
   */
  private proportionalEligibleNodes(): Class_NodeElement[] {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    return this.drawingArea.sankey.visible_nodes_list.filter(n => {
      if (!n.is_visible) return false
      if (echangeTag && n.hasGivenTag(echangeTag)) return false
      if (n.shape_position_type === 'relative') return false
      if (n.tied_to_nodes && n.attached_node.length > 0) return false
      // #1231 — un nœud DANS un cadre englobant (tied) suit le cadre : on l'exclut de la
      // compression proportionnelle indépendante. Sinon l'englobement (qui ajoute des
      // enfants éligibles et exclut le parent-cadre) faisait varier le facteur f et
      // re-spreadait les autres nœuds (ex. bois mort) → l'opération n'était pas
      // indépendante du mode (KO en %, OK en absolu).
      if (n.attached_container && n.attached_container.length > 0) return false
      return true
    })
  }

  /**
   * #1231 — Mode proportionnel : somme des hauteurs de nœuds par colonne (`position_u`)
   * au datatag courant. Proxy de la « somme des valeurs par colonne » (hauteur ∝ valeur
   * à échelle constante). Sert à calculer le facteur de compression f.
   */
  private proportionalColumnSums(nodes: Class_NodeElement[]): Map<number, number> {
    const sums = new Map<number, number>()
    nodes.forEach(n => {
      sums.set(n.position_u, (sums.get(n.position_u) ?? 0) + n.getShapeHeightToUse())
    })
    return sums
  }

  /**
   * #1231 — Étendue géométrique verticale de chaque colonne (`position_u`) : haut = bord
   * supérieur du nœud le plus haut, bas = bord inférieur du nœud le plus bas, centre =
   * milieu géométrique de la pile. C'est la **définition unique de la « médiane » d'une
   * colonne**, partagée par le mode paramétrique (ancre = centre géométrique gardé fixe)
   * et le mode proportionnel (centre de gravité = moyenne des centres géométriques).
   */
  /**
   * #1231 — (Re)capture la médiane (centre géométrique) de CHAQUE colonne sur l'état
   * courant, pour le mode paramétrique. À appeler à l'entrée du mode et en fin de drag
   * (état cohérent positions↔hauteurs). La médiane est ensuite gardée FIXE par
   * recomputeParametricLayout au changement de datatag/dimension. Même définition que
   * le proportionnel (columnGeometricExtents). Reconstruit la map (vide les u périmés).
   */
  public static columnGeometricExtents(
    nodes: Class_NodeElement[]
  ): Map<number, { top: number, bottom: number, center: number }> {
    const tops = new Map<number, number>()
    const bottoms = new Map<number, number>()
    nodes.forEach(n => {
      const u = n.position_u
      const top = n.position_y
      const bottom = n.position_y + n.getShapeHeightToUse()
      tops.set(u, Math.min(tops.get(u) ?? Infinity, top))
      bottoms.set(u, Math.max(bottoms.get(u) ?? -Infinity, bottom))
    })
    const out = new Map<number, { top: number, bottom: number, center: number }>()
    tops.forEach((top, u) => {
      const bottom = bottoms.get(u) ?? top
      out.set(u, { top, bottom, center: (top + bottom) / 2 })
    })
    return out
  }

  /**
   * Place verticalement les enfants d'une opération STRUCTURELLE (désagrégation,
   * expansion latérale, englobement) dans le slot vertical du parent `[parent_top,
   * parent_top + parent_h]`, selon le mode d'écart configuré sur la DrawingArea
   * (`effective_gap_mode` = surcharge transitoire ?? réglage global), cf.
   * Type_DisaggregationGap :
   *  - 'fill'        : écart égal pour remplir exactement le slot (≥ 0). Historique #1231.
   *  - 'keep'        : aucun repositionnement VERTICAL (les enfants gardent leur position_y).
   *  - 'children_dy' : empile depuis `parent_top`, écart = shape_position_dy de chaque enfant.
   *  - 'constant'    : empile depuis `parent_top`, écart = disaggregation_gap_value, réécrit dans dy.
   *
   * N.B. : ne touche QUE position_y (+ shape_position_dy selon le mode). L'appelant gère
   * position_u / position_x (qui diffèrent selon l'opération : colonne du parent pour la
   * désagrégation, colonne adjacente décalée pour l'expansion) et les applique TOUJOURS,
   * même en 'keep' (qui ne conserve que le Y des enfants).
   * L'ordre du tableau `children` détermine l'empilement (haut → bas).
   */
  public layoutChildrenInParentSlot(
    children: Class_NodeElement[],
    parent_top: number,
    parent_h: number
  ): void {
    const mode = this.drawingArea.effective_gap_mode
    if (children.length === 0) return
    // 'keep' ne touche pas au Y (les enfants gardent leur position_y) ; les autres modes
    // empilent depuis parent_top. Dans TOUS les cas, le x a déjà été posé par l'appelant.
    if (mode !== 'keep') {
      const default_dy = this.drawingArea.sankey.default_style.shape_position_dy
      const const_gap = this.drawingArea.disaggregation_gap_value
      const sum_h = children.reduce((s, c) => s + c.getShapeHeightToUse(), 0)
      const fill_gap = children.length > 1
        ? Math.max(0, (parent_h - sum_h) / (children.length - 1))
        : 0
      let cursor = parent_top
      children.forEach((c, i) => {
        if (i > 0) {
          const gap = mode === 'fill'
            ? fill_gap
            : mode === 'children_dy'
              ? (c.shape_position_dy ?? default_dy)
              : const_gap
          cursor += gap
          // 'fill' fixe un écart CALCULÉ (propre à ce slot) → on le matérialise dans dy pour que
          // le ré-empilement au dessin le reproduise. 'constant' est au contraire lu EN DIRECT
          // depuis disaggregation_gap_value (containerChildGap) : ne rien figer, sinon éditer la
          // valeur ne changerait pas les englobements déjà en place.
          if (mode === 'fill') c.shape_position_dy = gap
        }
        c.position_y = cursor
        cursor += c.getShapeHeightToUse()
      })
    }
    // #1230/#1231 — CAPITAL : ré-ancrer le centre (#1230) sur la position FINALE des enfants.
    // Sinon le setAbsoluteMode() de fin d'opération, s'il vient du mode proportionnel/échelle,
    // appelle deriveAbsoluteNodesFromCenter() qui restaurerait le centre PÉRIMÉ des enfants
    // (capturé avant qu'ils soient masqués/déplacés) et écraserait le x/y qu'on vient de poser.
    children.forEach(c => c.captureCenterFromCorner())
  }

  /**
   * #1231 — Flux de référence du mode proportionnel (sélectionné au clic droit).
   * Invalidé automatiquement s'il n'est plus visible (désagrégation, suppression…).
   */
  public get proportionalReferenceLink(): Class_LinkElement | undefined {
    if (this._prop_reference_link && !this._prop_reference_link.is_visible) return undefined
    return this._prop_reference_link
  }

  /** #1231b — Nœud de référence (visibilité-gated), pour l'état coché du menu nœud. */
  public get proportionalReferenceNode(): Class_NodeElement | undefined {
    if (this._prop_reference_node && !this._prop_reference_node.is_visible) return undefined
    return this._prop_reference_node
  }

  /** #1231b — Élément de référence BRUT (lien OU nœud), sans filtre de visibilité. */
  private get _rawReference(): Class_LinkElement | Class_NodeElement | undefined {
    return this._prop_reference_link ?? this._prop_reference_node
  }

  /** #1231b — Élément de référence visibilité-gated (undefined si masqué). */
  private get _gatedReference(): Class_LinkElement | Class_NodeElement | undefined {
    const ref = this._rawReference
    if (ref && !ref.is_visible) return undefined
    return ref
  }

  // #1231b — Nettoie les marqueurs persistés de référence (lien ET nœud) sur TOUS les
  // éléments, sauf `keep` (l'élément qu'on est en train de désigner). Le set n'a pas
  // d'action → pas de dessin parasite (cf. ElementsAttributesConfig).
  private clearReferenceMarkers(keep?: Class_LinkElement | Class_NodeElement) {
    this.drawingArea.sankey.links_list.forEach(l => {
      if (l.shape_is_reference_flux && l !== keep) l.shape_is_reference_flux = false
    })
    this.drawingArea.sankey.nodes_list.forEach(n => {
      if (n.shape_is_reference_stock && n !== keep) n.shape_is_reference_stock = false
    })
  }

  public setProportionalReferenceLink(link: Class_LinkElement | undefined) {
    // Un seul élément de référence à la fois : on retire tout marqueur (lien/nœud) existant.
    this.clearReferenceMarkers(link)
    this._prop_reference_link = link
    this._prop_reference_node = undefined
    if (link) {
      link.shape_is_reference_flux = true
      // Mémoriser le datatag courant comme datatag de référence (couple élément/datatag).
      this._prop_reference_datatag_ids = this.drawingArea.sankey.selected_data_tags_list.map(t => t.id)
    } else {
      this._prop_reference_datatag_ids = undefined
    }
  }

  /**
   * #1231b — Désigne (ou retire) un NŒUD-STOCK comme élément de référence. Mutuellement
   * exclusif avec le flux de référence. Le marqueur persisté `shape_is_reference_stock` est
   * posé sur le nœud (relu au chargement par `attachReferenceLinkFromAttributes`).
   */
  public setProportionalReferenceNode(node: Class_NodeElement | undefined) {
    this.clearReferenceMarkers(node)
    this._prop_reference_node = node
    this._prop_reference_link = undefined
    if (node) {
      node.shape_is_reference_stock = true
      this._prop_reference_datatag_ids = this.drawingArea.sankey.selected_data_tags_list.map(t => t.id)
    } else {
      this._prop_reference_datatag_ids = undefined
    }
  }

  /** #1231 — Datatag de référence (ids) — accesseurs pour la persistance (cf. DrawingArea toJSON/fromJSON). */
  public get proportionalReferenceDatatagIds(): string[] | undefined { return this._prop_reference_datatag_ids }
  public set proportionalReferenceDatatagIds(ids: string[] | undefined) {
    this._prop_reference_datatag_ids = (ids && ids.length > 0) ? ids : undefined
  }

  /** #1231 — Résout les ids du datatag de référence en objets Class_DataTag (via les groupes du sankey). */
  private resolveReferenceDataTags(): Class_DataTag[] {
    const ids = this._prop_reference_datatag_ids
    if (!ids || ids.length === 0) return []
    const out: Class_DataTag[] = []
    this.drawingArea.sankey.data_taggs_list.forEach(tagg => {
      ids.forEach(id => { const t = tagg.tags_dict[id]; if (t) out.push(t) })
    })
    return out
  }

  /**
   * #1231 — Valeur (absolue) du flux de référence AU DATATAG DE RÉFÉRENCE. Définit le
   * dénominateur du facteur f. Fallback sur la valeur courante si aucun datatag de réf
   * (rétrocompat). undefined si pas de flux de référence ou valeur indisponible.
   */
  private referenceFluxRefValue(): number | undefined {
    // Élément brut (pas le getter visibilité-gated) : en mode vue l'élément de référence peut
    // être caché par le filtre, mais sa valeur de référence (dénominateur de l'échelle) reste
    // définie. Pour le proportionnel ce chemin n'est emprunté que si visible → inchangé.
    const tags = this.resolveReferenceDataTags()
    // #1231b — Nœud-stock de référence : valeur = stock initial (cf. currentStockInitialForHeight).
    const node = this._prop_reference_node
    if (node) {
      // #1231b — On ancre l'échelle adaptée sur la hauteur RÉELLEMENT rendue du nœud
      // (max stock / bande de flux), pas sur la seule valeur de stock.
      if (tags.length > 0) {
        const v = node.stockInitialForDataTags(tags)
        if (v != null && isFinite(v)) return node.stockValueAugmentedByFluxBand(v)
      }
      const vc = node.currentStockInitialForHeight()
      return (vc != null && isFinite(vc)) ? node.stockValueAugmentedByFluxBand(vc) : undefined
    }
    const ref = this._prop_reference_link
    if (!ref) return undefined
    if (tags.length > 0) {
      const v = ref.valueForDataTags(tags)
      if (v != null && isFinite(v)) return Math.abs(v)
    }
    const vc = ref.valueCurrent
    return (vc != null && isFinite(vc)) ? Math.abs(vc) : undefined
  }

  /**
   * #1231b — Valeur COURANTE (datatags sélectionnés, hors vue) de l'élément de référence.
   * Flux : épaisseur via valeur courante. Nœud-stock : stock initial courant. abs ; 0 si rien.
   */
  private referenceCurrentValue(): number {
    const node = this._prop_reference_node
    if (node) {
      // #1231b — Ancrage sur la hauteur réelle (max stock / bande de flux).
      const v = node.currentStockInitialForHeight()
      return (v != null && isFinite(v)) ? node.stockValueAugmentedByFluxBand(v) : 0
    }
    const ref = this._prop_reference_link
    return ref ? Math.abs(ref.valueCurrent ?? 0) : 0
  }

  /**
   * #1231b — Valeur de l'élément de référence dans la VUE courante (correspondant visible).
   * Flux : somme des liens enfants visibles (referenceFluxViewValue). Nœud-stock : somme des
   * stocks des nœuds descendants visibles portant l'étiquette view tag sélectionnée.
   */
  private referenceViewValue(): number {
    const node = this._prop_reference_node
    if (node) return this.referenceStockViewValue(node)
    const ref = this._prop_reference_link
    return ref ? this.referenceFluxViewValue(ref) : 0
  }

  /**
   * #1231 — Au chargement (persistance) : ré-attache le flux de référence depuis le marqueur
   * persisté `shape_is_reference_flux`. La capture (médiane proportionnelle / échelle) se
   * fait paresseusement au 1er dessin (anchorProportionalNodes / applyAdaptedScale).
   */
  public attachReferenceLinkFromAttributes() {
    const flagged_link = this.drawingArea.sankey.links_list.find(l => l.shape_is_reference_flux)
    const flagged_node = this.drawingArea.sankey.nodes_list.find(n => n.shape_is_reference_stock)
    this._prop_reference_link = flagged_link ?? undefined
    // #1231b — Un seul élément de référence à la fois : si les deux marqueurs cohabitent
    // (fichier incohérent), le flux prime et on ignore le nœud.
    this._prop_reference_node = flagged_link ? undefined : (flagged_node ?? undefined)
  }

  /**
   * #1231 — Réinitialise complètement l'état du mode proportionnel : retire le flux de
   * référence (et son marqueur persisté) et oublie le cadre de référence capturé (médiane,
   * sommes par colonne, épaisseur du flux). Les positions courantes des nœuds sont
   * conservées (elles deviennent les positions absolues). Appelé au passage en mode absolu :
   * on repart « propre », un futur retour en proportionnel re-capture tout.
   */
  public resetProportionalState() {
    this.setProportionalReferenceLink(undefined)
    this._prop_median_y = undefined
    this._prop_top_y = undefined
    this._prop_bottom_y = undefined
    this._prop_ref_col_sums = undefined
  }

  /** #1231 — Centre vertical d'un flux à mi-parcours = moyenne des lignes centrales source/cible. */
  private fluxCenterY(link: Class_LinkElement): number {
    return (link.position_y_start + link.position_y_end) / 2
  }

  /** #1231 — Épaisseur représentative d'un flux = moyenne des épaisseurs source/cible (px). */
  private fluxThickness(link: Class_LinkElement): number {
    return (link.thicknessSource + link.thicknessTarget) / 2
  }

  /**
   * #1231 — Mode « échelle adaptée » : capture l'échelle courante et la valeur du flux de
   * référence. Sert de base au ratio appliqué ensuite (`applyAdaptedScale`). À l'entrée du
   * mode, valeur_courante == valeur_ref → échelle inchangée → pas de saut.
   */
  public captureScaleReference() {
    // Élément brut : on doit pouvoir capturer la valeur de référence même si l'élément est
    // momentanément masqué par un filtre vue (cf. referenceFluxRefValue).
    const ref = this._rawReference
    const v = ref ? this.referenceFluxRefValue() : undefined
    if (ref && v && v > 0) {
      // Valeur au datatag de référence (couple flux/datatag) ; échelle de base = échelle courante.
      this._scale_adapted_ref_value = v
      this._scale_adapted_ref_scale = this.drawingArea.scale
    } else {
      this._scale_adapted_ref_value = undefined
      this._scale_adapted_ref_scale = undefined
    }
  }

  /**
   * #1231 — Mode « échelle adaptée » : ajuste l'échelle (valeur→px) du diagramme pour que le
   * flux de référence garde sa taille de référence à tous les datatags. Appelé en tête de
   * `drawElements` avant `_sankey.draw()`. No-op sans flux de référence ou sans capture.
   * Écrit directement `_scale` + le domaine de `_scaleValueToPx` (le setter `scale` redraw →
   * récursion ; on l'évite).
   */
  public applyAdaptedScale() {
    // En mode vue, l'élément de référence peut être masqué par le filtre → on prend l'élément brut
    // (sa valeur de réf reste le « gabarit » de taille). Hors vue, version visibilité-gated.
    const view_active = this.drawingArea.sankey.view_mode_active
    const ref = view_active ? this._rawReference : this._gatedReference
    if (!ref) return
    // Capture paresseuse (1er dessin / après chargement) : base = échelle + valeur courantes
    // → ratio 1 à cette frame, pas de saut.
    if (this._scale_adapted_ref_value === undefined || this._scale_adapted_ref_scale === undefined) {
      this.captureScaleReference()
      return
    }
    // En mode vue : v = valeur du CORRESPONDANT de la vue (enfant visible portant l'étiquette
    // sélectionnée). new_scale = ref_scale × correspondant / valeur_réf → le correspondant est
    // dessiné à la taille de référence (une vue plus petite dilate l'échelle pour normaliser le
    // correspondant). Hors vue : valeur courante de l'élément de référence (datatags).
    const v = view_active
      ? this.referenceViewValue()
      : this.referenceCurrentValue()
    if (v <= 0) return
    const new_scale = this._scale_adapted_ref_scale * v / this._scale_adapted_ref_value
    if (isFinite(new_scale) && new_scale > 0) {
      this.drawingArea._scale = new_scale
      this.drawingArea._scaleValueToPx.domain([0, new_scale])
    }
  }

  /**
   * Mode vue — valeur du flux de référence dans la VUE courante : somme des liens visibles dont
   * la source descend de `ref.source`, la cible descend de `ref.target`, ET dont les DEUX
   * extrémités portent l'étiquette view tag sélectionnée (viewTagVisibility === true). Ce dernier
   * filtre est indispensable car la hiérarchie a plusieurs dimensions (essences ET propriétés) :
   * sans lui on cumulerait les liens croisés (ex. essence chêne → propriété domaniale).
   */
  private referenceFluxViewValue(ref: Class_LinkElement): number {
    const src = ref.source as Class_NodeElement
    const tgt = ref.target as Class_NodeElement
    const src_set = new Set<Class_NodeElement>([src, ...src.getListDescendantOfNode()])
    const tgt_set = new Set<Class_NodeElement>([tgt, ...tgt.getListDescendantOfNode()])
    let sum = 0
    this.drawingArea.sankey.visible_links_list.forEach(l => {
      const ls = l.source as Class_NodeElement
      const lt = l.target as Class_NodeElement
      if (!src_set.has(ls) || !tgt_set.has(lt)) return
      if (ls.viewTagVisibility() !== true || lt.viewTagVisibility() !== true) return
      const v = l.valueCurrent
      if (v != null && isFinite(v)) sum += Math.abs(v)
    })
    return sum
  }

  /**
   * #1231b — Mode vue — valeur du nœud-stock de référence dans la VUE courante : somme des
   * stocks des nœuds visibles qui descendent du nœud de référence ET portent l'étiquette view
   * tag sélectionnée (viewTagVisibility === true). Analogue stock de referenceFluxViewValue.
   */
  private referenceStockViewValue(node: Class_NodeElement): number {
    const node_set = new Set<Class_NodeElement>([node, ...node.getListDescendantOfNode()])
    let sum = 0
    this.drawingArea.sankey.visible_nodes_list.forEach(n => {
      if (!node_set.has(n)) return
      if (!n.has_stock) return
      if (n.viewTagVisibility() !== true) return
      const v = n.currentStockInitialForHeight()
      if (v != null && isFinite(v)) sum += Math.abs(v)
    })
    // #1231b — Ancrage sur la hauteur réelle : si la bande de flux du nœud de
    // référence dépasse la hauteur-stock (cumul des correspondants visibles), on
    // ancre l'échelle sur cette bande.
    return node.stockValueAugmentedByFluxBand(sum)
  }

  /**
   * #1231 — Sortie du mode « échelle adaptée » : restaure l'échelle de base capturée (pour
   * ne pas laisser le diagramme à une échelle adaptée d'un autre datatag) et oublie la
   * capture. L'échelle restaurée s'affiche au prochain dessin.
   */
  public clearScaleAdaptation() {
    if (this._scale_adapted_ref_scale !== undefined && this._scale_adapted_ref_scale > 0) {
      this.drawingArea._scale = this._scale_adapted_ref_scale
      this.drawingArea._scaleValueToPx.domain([0, this._scale_adapted_ref_scale])
    }
    this._scale_adapted_ref_value = undefined
    this._scale_adapted_ref_scale = undefined
  }

  /**
   * #1231 — Mode « échelle adaptée » : dérive le coin de chaque nœud « libre » depuis son CENTRE
   * stocké, SANS jamais recommiter le coin dans le centre. Remplace `anchorAbsoluteNodesByCenter`
   * dans la branche scale_adapted de `drawElements` : on garde la même dérivation centre→coin,
   * mais on supprime la branche « taille inchangée → captureCenterFromCorner » qui figerait le
   * recalage d'affichage (anti-chevauchement / clamp, cf. `resolveScaleAdaptedOverlaps`) dans le
   * centre persisté → ce recalage se traînerait alors d'un viewtag/datatag à l'autre.
   *
   * Le centre reste la SEULE vérité : il n'est modifié que par les gestes utilisateur (drag,
   * resize → `settleCenterAnchor`) et les opérations structurelles, jamais par le dessin. À chaque
   * frame on repart donc du centre propre, et le recalage d'espacement est recalculé pour le
   * datatag/viewtag courant (transitoire, jamais persistant).
   *
   * Mêmes exclusions que `anchorAbsoluteNodesByCenter` : nœuds visibles, libres (non relatifs),
   * hors cadres tied. Lazy-init du centre au 1er dessin (fichier sans centre encore posé).
   */
  public deriveScaleAdaptedCornersFromCenter() {
    this.drawingArea.sankey.nodes_list.forEach(n => {
      if (!n.is_visible) return
      if (n.shape_position_type === 'relative') return
      if (n.tied_to_nodes && n.attached_node.length > 0) return
      if (n.center_x === undefined || n.center_y === undefined) {
        n.captureCenterFromCorner() // init unique ; le coin est déjà cohérent
      } else {
        n.forceDeriveFromCenter() // coin = centre − taille/2, sans recommit du centre
      }
    })
  }

  /**
   * #1231 — Mode « échelle adaptée » : décale un nœud verticalement de `dy` POUR L'AFFICHAGE
   * seulement (coin `position_y`), SANS toucher au centre stocké. Le recalage d'espacement est
   * propre au datatag/viewtag courant : il est recalculé à chaque dessin à partir du centre
   * (cf. `deriveScaleAdaptedCornersFromCenter`) et ne doit donc jamais être persisté, sinon il se
   * traînerait d'un datatag/viewtag à l'autre. No-op si `dy` nul.
   */
  private shiftNodeY(n: Class_NodeElement, dy: number) {
    if (!dy) return
    n.position_y += dy
  }

  /**
   * #1231 — Mode « échelle adaptée » : anti-chevauchement par colonne (DEPUIS LE HAUT) + clamp
   * du haut du diagramme. Appelé après `deriveScaleAdaptedCornersFromCenter` dans la branche
   * scale_adapted de `drawElements`.
   *
   * En mode échelle, les nœuds grossissent autour de leur centre FIXE quand l'échelle monte
   * (bascule datatag/viewtag). Deux effets indésirables :
   *  - deux nœuds d'une même colonne peuvent se recouvrir ;
   *  - le nœud du haut, dont le coin = centre − hauteur/2, peut passer AU-DESSUS du haut du
   *    diagramme (y < 0).
   *
   * On ne re-layoute PAS le diagramme :
   *  1. anti-chevauchement : le nœud le plus haut de chaque colonne garde sa place, chaque nœud
   *     suivant est descendu juste assez pour rétablir l'écart minimal (push vers le bas only) ;
   *  2. clamp du haut : si le sommet de la colonne dépasse y=0, on décale TOUTE la colonne vers
   *     le bas pour que son sommet tienne pile au haut du diagramme.
   * Ces décalages sont D'AFFICHAGE (coin seulement, cf. `shiftNodeY`) : recalculés à chaque
   * dessin depuis le centre, donc propres au datatag/viewtag courant et jamais persistés.
   *
   * Mêmes conventions de colonne que `backCalculateShapePositionDyFromY` : groupage par
   * `position_u`, exclusion des nœuds `echange` (import/export, placés au niveau de leur flux),
   * des nœuds relatifs et des cadres tied. `écart_min` = `shape_position_dy` GLOBAL.
   */
  public resolveScaleAdaptedOverlaps() {
    const min_gap = this.drawingArea.sankey.styles_dict['default'].shape_position_dy ?? 50
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    const columns = new Map<number, Class_NodeElement[]>()
    this.drawingArea.sankey.visible_nodes_list.forEach(n => {
      if (!n.is_visible) return
      if (echangeTag && n.hasGivenTag(echangeTag)) return
      if (n.shape_position_type === 'relative') return
      if (n.tied_to_nodes && n.attached_node.length > 0) return
      const arr = columns.get(n.position_u) ?? []
      arr.push(n)
      columns.set(n.position_u, arr)
    })
    columns.forEach(col => {
      // Ordre vertical = ordre LOGIQUE de la colonne (`position_v`), PAS la géométrie courante :
      // en échelle adaptée, position_y est dérivée du centre et peut différer d'un pouième entre
      // deux nœuds quasi alignés → un tri par position_y inverserait leur ordre (ex. v=1 au-dessus
      // de v=0) et le push figerait l'inversion. position_v est l'ordre stable (calculé au load,
      // u/v verrouillés). position_y en départage seulement les v égaux (ne devrait pas arriver).
      col.sort((a, b) => (a.position_v - b.position_v) || (a.position_y - b.position_y))
      // DEBUG #1231 (temporaire) — dump de l'ordre par colonne pour diagnostiquer le non-respect
      // de position_v en mode échelle adaptée (à retirer une fois la cause confirmée).
      if (col.length > 1) {
        // eslint-disable-next-line no-console
        console.log('[scaleAdapted overlap] u=' + col[0].position_u + ' →',
          col.map(n => `${n.name}(v=${n.position_v}, y=${Math.round(n.position_y)}, u=${n.position_u})`).join('  |  '))
      }
      // 1. anti-chevauchement, depuis le haut : descendre les nœuds qui se recouvrent.
      for (let i = 1; i < col.length; i++) {
        const prev = col[i - 1]
        const curr = col[i]
        const min_top = prev.position_y + prev.getShapeHeightToUse() + min_gap
        if (curr.position_y < min_top) this.shiftNodeY(curr, min_top - curr.position_y)
      }
      // 2. clamp du haut : le sommet de la colonne (nœud le plus haut, jamais descendu) ne doit
      //    pas dépasser y=0. Sinon on décale toute la colonne vers le bas (affichage seulement).
      const top = col[0].position_y
      if (top < 0) col.forEach(n => this.shiftNodeY(n, -top))
    })
  }

  /**
   * #1231 — Capture le cadre de référence du mode proportionnel sur l'état courant.
   * Deux régimes selon qu'un flux de référence est sélectionné ou non :
   *  - AVEC flux de référence : médiane (centre de gravité, FIXE) = centre vertical du flux
   *    à mi-parcours ; l'épaisseur du flux est mémorisée comme référence du facteur f.
   *  - SANS flux de référence (fallback) : médiane = moyenne, sur les colonnes, des **centres
   *    géométriques** de pile ; sommes de hauteurs par colonne mémorisées pour f (max ratio).
   * Dans les deux cas on capture le centre de référence de chaque nœud (pour le replacement).
   * Appelé à l'entrée du mode, après un drag et au changement de vue. `position_u` doit
   * être à jour (cf. `inferPositionUFromX`).
   */
  public captureProportionalReference() {
    const nodes = this.proportionalEligibleNodes()
    if (nodes.length === 0) {
      this._prop_median_y = undefined
      this._prop_top_y = undefined
      this._prop_bottom_y = undefined
      this._prop_ref_col_sums = undefined
      return
    }
    // Médiane = moyenne des centres géométriques de pile par colonne.
    const extents = NodePositioning.columnGeometricExtents(nodes)
    let top_y = Infinity
    let bottom_y = -Infinity
    let center_sum = 0
    extents.forEach(({ top, bottom, center }) => {
      center_sum += center
      if (top < top_y) top_y = top
      if (bottom > bottom_y) bottom_y = bottom
    })
    this._prop_median_y = center_sum / extents.size
    this._prop_top_y = top_y
    this._prop_bottom_y = bottom_y
    this._prop_ref_col_sums = this.proportionalColumnSums(nodes)
    nodes.forEach(n => n.captureProportionalCenterRef())

    // #1231 — Avec élément de référence : la médiane (centre de gravité fixe) se cale sur le
    // centre vertical de l'élément (flux à mi-parcours, ou centre du nœud-stock). Le facteur f
    // est value-based (cf. proportionalFactor) : rien à capturer ici pour f (il dérive du couple
    // élément/datatag de référence persisté).
    const ref_center = this.referenceCenterY()
    if (ref_center !== undefined) {
      this._prop_median_y = ref_center
    }
  }

  /** #1231b — Centre vertical de l'élément de référence (visibilité-gated). undefined si aucun. */
  private referenceCenterY(): number | undefined {
    const ref = this._gatedReference
    if (!ref) return undefined
    const node = this._prop_reference_node
    if (node && ref === node) {
      return node.position_y + node.getShapeHeightToUse() / 2
    }
    return this.fluxCenterY(ref as Class_LinkElement)
  }

  /**
   * #1231 — Facteur de compression/dilatation courant.
   *  - AVEC flux de référence : f = épaisseur courante du flux / épaisseur capturée. Tout le
   *    diagramme se comprime/dilate autour de la médiane (centre du flux) selon ce ratio.
   *  - SANS (fallback) : plus GRAND ratio (somme de hauteurs par colonne courante / référence)
   *    sur les colonnes communes.
   * 1 si pas de référence exploitable.
   */
  private proportionalFactor(nodes: Class_NodeElement[]): number {
    // #1231 — Régime « flux de référence » : f = ratio de VALEUR du flux de référence entre le
    // datatag courant et le datatag de référence (couple persisté flux/datatag). f=1 au datatag
    // de réf ; indépendant du moment où l'on (r)entre en mode %.
    // En mode vue, le flux de référence peut être masqué par le filtre → lien brut. Le facteur
    // est piloté par la valeur du CORRESPONDANT de la vue (somme des flux enfants visibles
    // portant l'étiquette sélectionnée) rapportée à la valeur du flux de référence : une vue
    // plus petite que le total donne f<1 → le diagramme se comprime (rétracte).
    const view_active = this.drawingArea.sankey.view_mode_active
    const ref = view_active ? this._rawReference : this._gatedReference
    if (ref) {
      const ref_val = this.referenceFluxRefValue()
      const cur = view_active
        ? this.referenceViewValue()
        : this.referenceCurrentValue()
      if (ref_val && ref_val > 0 && cur > 0) {
        const f = cur / ref_val
        return (isFinite(f) && f > 0) ? f : 1
      }
      return 1
    }
    if (!this._prop_ref_col_sums) return 1
    const cur = this.proportionalColumnSums(nodes)
    let f = 0
    this._prop_ref_col_sums.forEach((ref_sum, u) => {
      if (ref_sum <= 0) return
      const cur_sum = cur.get(u) ?? 0
      const ratio = cur_sum / ref_sum
      if (ratio > f) f = ratio
    })
    if (!isFinite(f) || f <= 0) return 1
    return f
  }

  /**
   * #1231 — Mode proportionnel : comprime/dilate le diagramme verticalement autour de
   * la médiane (centre de gravité fixe) par le facteur de flux. Appelé en tête de
   * `drawElements` avant `_sankey.draw()`. Capture la référence au 1er appel si absente.
   */
  public anchorProportionalNodes() {
    // #1231 — Pendant une opération structurelle, ne pas comprimer : on laisse les
    // positions calculées par l'opération (remplissage du slot, etc.) telles quelles ;
    // la re-capture finale les fixera comme nouvelle référence (f=1).
    if (this.suppressProportionalCompression) return
    const nodes = this.proportionalEligibleNodes()
    if (nodes.length === 0) return
    if (this._prop_median_y === undefined || !this._prop_ref_col_sums) {
      this.captureProportionalReference()
      return
    }
    // #1231 (1.1.5) — anti-chevauchement GLOBAL : le facteur de compression effectif est
    // borné par le bas par le facteur minimal qui empêche TOUTE colonne de chevaucher
    // (proportionalMinFactor). Appliqué uniformément à tous les nœuds, c'est une
    // transformation linéaire autour de la médiane → l'ordre vertical par pourcentage est
    // préservé EXACTEMENT entre colonnes (un nœud plus haut le reste, gauche ou droite), et
    // la colonne la plus dense « tire » tout le diagramme. Plus de plancher par colonne.
    const f = this.proportionalFactor(nodes)
    // Plancher anti-chevauchement (écart minimum entre nœuds). En mode vue, les nœuds révélés par
    // le filtre n'ont pas de position verticale propre (le fichier les stocke empilés) : deux
    // peuvent se retrouver quasi collés et le facteur dépasserait 1, dilatant tout le diagramme à
    // l'infini. On le PLAFONNE donc à 1 en vue : on applique l'écart minimum tant qu'il « tient »
    // dans la disposition d'origine, mais on ne dilate jamais au-delà (pas d'explosion, et la vue
    // ne se contracte pas plus que nécessaire). Hors vue : comportement normal (ensemble fixe).
    const min_factor = this.proportionalMinFactor(nodes)
    const capped_min = this.drawingArea.sankey.view_mode_active ? Math.min(min_factor, 1) : min_factor
    const f_eff = Math.max(f, capped_min)
    nodes.forEach(n => n.applyProportionalCompression(this._prop_median_y!, f_eff))
  }

  /**
   * #1231 — Espacement des colonnes en mode proportionnel (option « écarts × f avec plancher »).
   * Raisonne en DISTANCES ENTRE CENTRES (et non en positions absolues) :
   *  - distance de référence entre deux nœuds voisins = écart de leurs centres capturés ;
   *  - distance voulue = max(distance_réf × f, ½h_haut + ½h_bas + écart_min) ;
   *  - la pile est centrée sur le centre comprimé de la colonne
   *    (médiane + (centre_réf_colonne − médiane) × f).
   * Propriétés :
   *  - à f = 1 et sans chevauchement de départ, reproduit EXACTEMENT le layout (centre de
   *    colonne = (cref_premier+cref_dernier)/2, indépendant de la médiane) → sélectionner/retirer
   *    le flux de référence ne bouge rien ;
   *  - garantit un écart ≥ écart_min entre voisins (jamais de chevauchement) ;
   *  - l'espacement suit le flux (× f) tant qu'il reste au-dessus du plancher.
   * `écart_min` = `shape_position_dy` GLOBAL (petit, ~50px) : un dy par-nœud aberrant (ex. 434)
   * forcerait un grand écart même quand le layout d'origine est plus serré → faux déplacements.
   */
  private proportionalMinFactor(nodes: Class_NodeElement[]): number {
    const min_gap = this.drawingArea.sankey.styles_dict['default'].shape_position_dy ?? 50
    // Paires de centres de réf quasi confondus : aucun facteur fini ne les sépare (déjà
    // superposées en absolu) → ignorées, sinon f_min exploserait.
    const EPS = 1
    const cols = new Map<number, Class_NodeElement[]>()
    nodes.forEach(n => {
      const arr = cols.get(n.position_u) ?? []
      arr.push(n)
      cols.set(n.position_u, arr)
    })
    let f_min = 0
    cols.forEach(col => {
      if (col.length < 2) return
      const cref = (n: Class_NodeElement) => n.center_y ?? n._prop_center_ref ?? (n.position_y + n.getShapeHeightToUse() / 2)
      col.sort((a, b) => cref(a) - cref(b))
      for (let i = 0; i < col.length - 1; i++) {
        const gap_ref = cref(col[i + 1]) - cref(col[i])
        if (gap_ref <= EPS) continue
        // Facteur minimal pour que l'écart de centres comprimé reste ≥ ½h_haut+½h_bas+min_gap.
        const min_dist = col[i].getShapeHeightToUse() / 2 + col[i + 1].getShapeHeightToUse() / 2 + min_gap
        const need = min_dist / gap_ref
        if (need > f_min) f_min = need
      }
    })
    return f_min
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
   * Positionne le label des nœuds en fonction de leur connectivité, via les
   * styles d'extrémité (NodeLeftExtremityStyle / NodeRightExtremityStyle).
   * Les nœuds centraux et lone ne reçoivent aucun style ni mutation d'attribut.
   * Si l'utilisateur a déjà personnalisé name_label_horiz / name_label_vert
   * localement, le style n'est pas (ré)appliqué pour préserver l'override.
   * @private
   */
  private setNodeLabelPositioning(node: Class_NodeElement) {
    const styles_dict = this.drawingArea.sankey.styles_dict
    const left_style = styles_dict[NodeLeftExtremityStyle]
    const right_style = styles_dict[NodeRightExtremityStyle]

    const is_source = node.hasOutputLinks() && !node.hasInputLinks()
    const is_sink = node.hasInputLinks() && !node.hasOutputLinks()

    const target_style = is_source ? left_style : (is_sink ? right_style : undefined)
    const other_style = is_source ? right_style : (is_sink ? left_style : undefined)

    // Nœuds centraux ou lone : retirer les styles d'extrémité éventuellement
    // présents, sans toucher aux attributs.
    if (!target_style) {
      if (left_style && node.hasStyle(left_style.id)) node.removeStyleById(left_style.id)
      if (right_style && node.hasStyle(right_style.id)) node.removeStyleById(right_style.id)
      return
    }

    // Nettoyer le style d'extrémité opposé s'il était appliqué.
    if (other_style && node.hasStyle(other_style.id)) {
      node.removeStyleById(other_style.id)
    }

    // Préserver tout override local user sur name_label_horiz/vert.
    if (node.isAttributeOverloaded('name_label_horiz') || node.isAttributeOverloaded('name_label_vert')) {
      return
    }

    if (!node.hasStyle(target_style.id)) {
      node.addStyle(target_style)
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
          // is_visible_ignoring_zero (et pas is_visible) : un flux à valeur nulle (souvent
          // fraîchement créé) doit quand même aligner verticalement son nœud cible sur sa
          // source, sinon le nœud reste à son Y par défaut (cf. fix horizontal analogue).
          const non_recycling_input_links = this.drawingArea.sankey.nodes_dict[node_id].input_links_list.filter(l =>
            l.is_visible_ignoring_zero && !l.shape_is_recycling && !(echangeTag && l.source.hasGivenTag(echangeTag))
          )

          if (non_recycling_input_links.length > 0) {
            const recycling_links = this.drawingArea.sankey.nodes_dict[node_id].input_links_list.filter(l =>
              l.is_visible_ignoring_zero && l.shape_is_recycling
            )

            if (recycling_links.length > 0) {
              this.drawingArea.sankey.nodes_dict[node_id].position_y += recycling_links[0].thickness
            } else if (non_recycling_input_links.filter(l =>
              l.source.output_links_list.filter(ol => ol.is_visible_ignoring_zero).length == 1
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
    const type_tagg = this.drawingArea.sankey.node_taggs_dict['type de noeud']
    const echangeTag = type_tagg.tags_dict['echange']
    const sectorTag = type_tagg.tags_dict['secteur']
    const all_import_nodes = process_nodes.filter(n =>
      n.hasGivenTag(echangeTag) && n.output_links_list.length > 0
    )
    const all_export_nodes = process_nodes.filter(n =>
      n.hasGivenTag(echangeTag) && n.input_links_list.length > 0
    )
    const other_nodes = process_nodes.filter(n => !n.hasGivenTag(echangeTag))

    // mfa_problem#222 : les échanges-secteur (tag `secteur` cumulé) se rattachent
    // à des produits et doivent être placés horizontalement (import à gauche /
    // export à droite du produit connecté), en miroir du placement vertical
    // (haut/bas) des échanges-produit qui, lui, fonctionne déjà. On sépare donc
    // les deux familles ; le bloc vertical historique ne traite que les produits.
    const is_sector = (n: Class_NodeElement) => (sectorTag !== undefined) && n.hasGivenTag(sectorTag)
    const import_nodes = all_import_nodes.filter(n => !is_sector(n))
    const export_nodes = all_export_nodes.filter(n => !is_sector(n))
    const import_nodes_sector = all_import_nodes.filter(is_sector)
    const export_nodes_sector = all_export_nodes.filter(is_sector)

    let max_vertical_y = 0
    let min_vertical_y = 5000
    other_nodes.forEach(n => {
      max_vertical_y = Math.max(n.position_y + n.getShapeHeightToUse(), max_vertical_y)
      min_vertical_y = Math.min(n.position_y, min_vertical_y)
    })
    max_vertical_y = max_vertical_y + 200
    min_vertical_y = min_vertical_y - 200

    // Échanges-secteur : positionnés en DELTA par rapport au produit connecté
    // (import vs son target, export vs son source) — décalage X/Y = shape_position_dx
    // / shape_position_dy du nœud, exactement comme le placement X des produits.
    // (et non une position absolue, qui les envoyait au bord du diagramme).
    import_nodes_sector.forEach(node => {
      const target_node = node.output_links_list[0].target
      node.position_u = target_node.position_u
      node.position_v = target_node.position_v
      if (compute_xy) {
        node.position_x = target_node.position_x + node.shape_position_dx
        node.position_y = target_node.position_y + node.shape_position_dy
      }
    })
    export_nodes_sector.forEach(node => {
      const source_node = node.input_links_list[0].source
      node.position_u = source_node.position_u
      node.position_v = source_node.position_v
      if (compute_xy) {
        node.position_x = source_node.position_x + node.shape_position_dx
        node.position_y = source_node.position_y + node.shape_position_dy
      }
    })

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
   * Écart vertical AVANT un enfant de cadre englobant, selon le mode d'écart courant :
   *  - 'constant'  : `const_gap` (lu EN DIRECT sur `disaggregation_gap_value`) — éditer la valeur
   *                  modifie donc tous les englobements existants au prochain dessin, l'écart
   *                  n'étant volontairement PAS figé dans `shape_position_dy`.
   *  - autres modes: `shape_position_dy` de l'enfant (fill = valeur calculée figée au slot ;
   *                  children_dy = écart propre à l'enfant ; keep = les enfants ne sont pas
   *                  ré-empilés, cf. appelants).
   */
  public static containerChildGap(
    child: Class_NodeElement,
    mode: Type_DisaggregationGap,
    const_gap: number
  ): number {
    return mode === 'constant' ? const_gap : (child.shape_position_dy ?? 0)
  }

  /**
   * Empile verticalement les enfants d'un cadre englobant, comme `stackNodesVertically` mais avec
   * l'écart résolu par `containerChildGap` (constant lu en direct). Utilisé par le mode parametric
   * (Phase C de `recomputeParametricLayout`) et les autres modes (`restackContainerChildren`).
   */
  public static stackContainerChildren(
    nodes: Class_NodeElement[],
    anchor_y: number,
    mode: Type_DisaggregationGap,
    const_gap: number
  ) {
    let cursor_y = anchor_y
    nodes.forEach((node, i) => {
      if (i > 0) cursor_y += NodePositioning.containerChildGap(node, mode, const_gap)
      node.position_y = cursor_y
      node.applyPosition()
      cursor_y += node.getShapeHeightToUse()
    })
  }

  /** Hauteur totale de la pile de `stackContainerChildren` (écart constant lu en direct). */
  public static totalContainerStackHeight(
    nodes: Class_NodeElement[],
    mode: Type_DisaggregationGap,
    const_gap: number
  ): number {
    return nodes.reduce((sum, n, i) =>
      sum + n.getShapeHeightToUse() + (i > 0 ? NodePositioning.containerChildGap(n, mode, const_gap) : 0), 0)
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

    // Mode d'écart des enfants de cadre + valeur constante LIVE (cf. containerChildGap) : partagés
    // par le sizing (Phase A) et l'empilement (Phase C) pour que l'écart 'constant' reste éditable.
    const gap_mode = this.drawingArea.effective_gap_mode
    const const_gap = this.drawingArea.disaggregation_gap_value

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
      // Sum children heights + écarts (constant lu en direct) + top/bottom margins.
      const stack_h = NodePositioning.totalContainerStackHeight(children, gap_mode, const_gap)
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

    // #1231 — Mode « écart » : le NŒUD DU HAUT de chaque colonne suit EXACTEMENT le mode
    // pourcentage (même centre = médiane_globale + (centre_ref − médiane) × f), puis le
    // reste de la colonne s'empile dessous avec des écarts CONSTANTS. Conséquence voulue :
    // les nœuds du haut (et les colonnes à 1 nœud) sont placés à l'identique du mode %.
    // Réutilise le cadre du mode proportionnel ; capture paresseuse si absente.
    if (this._prop_median_y === undefined || !this._prop_ref_col_sums) {
      this.captureProportionalReference()
    }
    const median = this._prop_median_y
    const factor = this.proportionalFactor(this.proportionalEligibleNodes())

    const columns = new Map<number, Class_NodeElement[]>()
    top_level_nodes.forEach(n => {
      if (scope.type === 'column' && n.position_u !== scope.u) return
      const col = columns.get(n.position_u) ?? []
      col.push(n)
      columns.set(n.position_u, col)
    })
    columns.forEach((column) => {
      if (column.length === 0) return
      const sorted = sortByV(column)
      const top = sorted[0]
      const top_ref = top._prop_center_ref
      let anchor_y: number
      if (median !== undefined && top_ref !== undefined) {
        // Centre du nœud du haut = sa position en mode % ; l'ancre (bord haut) en découle.
        const top_center = median + (top_ref - median) * factor
        anchor_y = top_center - top.getShapeHeightToUse() / 2
      } else {
        anchor_y = top.position_y // fallback : pas de référence (relative/échange/tied)
      }
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
      NodePositioning.stackContainerChildren(children, anchor_y, gap_mode, const_gap)
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
   * Ré-empile les enfants de chaque cadre englobant (`container_mode`) sur la position et la
   * hauteur COURANTES du cadre — pendant de la Phase C de `recomputeParametricLayout`, mais pour
   * les modes de positionnement NON-parametric (absolu, proportionnel, échelle adaptée).
   *
   * Pourquoi : dans ces modes, le placement global (`anchorAbsoluteNodesByCenter`,
   * `anchorProportionalNodes`…) garde le CENTRE de chaque enfant fixe quand sa taille change
   * (changement de datatag/vue/échelle). Des enfants empilés jointivement (écart constant) finissent
   * donc par se chevaucher ou se disperser dès que leur valeur change.
   *
   * Empilement À PLAT des FEUILLES : on collecte les feuilles réelles (pas les sous-cadres) dans
   * l'ordre hiérarchique et on les espace UNIFORMÉMENT — écart identique quel que soit le niveau
   * d'imbrication. Empiler récursivement les sous-cadres ajouterait leurs marges (`shape_margin_top`
   * /`_bottom`) entre deux groupes → l'écart casserait au 2ᵉ niveau. Chaque sous-cadre est ensuite
   * réancré (`reanchorTiedFrame`) pour envelopper ses feuilles ; sa taille suit via `_envelopeSize()`.
   * Le cadre de premier niveau garde sa position (il sert d'ancre).
   *
   * L'écart est résolu par `containerChildGap` : en mode 'constant' il est lu EN DIRECT sur
   * `disaggregation_gap_value` (éditer la valeur ré-englobe au prochain dessin, sans être figé dans
   * les feuilles) ; sinon = `shape_position_dy` persisté. En mode 'keep' rien n'est ré-empilé.
   *
   * À appeler en FIN de placement (après le mode global + `anchorParametricNodesToAbsolute`), pour
   * écraser le re-centrage individuel des feuilles. Nœuds « échange » et enfants invisibles exclus.
   */
  public restackContainerChildren() {
    const mode = this.drawingArea.effective_gap_mode
    // 'keep' = les enfants conservent leur position_y manuelle → aucun ré-empilement.
    if (mode === 'keep') return
    const const_gap = this.drawingArea.disaggregation_gap_value
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']

    const isContainerParent = (n: Class_NodeElement): boolean =>
      n.dimensions_as_parent.some(d => d.container_mode)

    const sortByV = (nodes: Class_NodeElement[]): Class_NodeElement[] =>
      [...nodes].sort((a, b) =>
        a.position_v !== b.position_v ? a.position_v - b.position_v : a.position_y - b.position_y)

    // Enfants directs VISIBLES d'un cadre (dédupliqués sur les dims container_mode).
    const directChildren = (container: Class_NodeElement): Class_NodeElement[] => {
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

    // Feuilles visibles d'un cadre, dans l'ordre hiérarchique (DFS + tri par v) : on descend dans
    // les sous-cadres et on ne renvoie QUE les vraies feuilles (pas les cadres eux-mêmes).
    const leavesInOrder = (container: Class_NodeElement): Class_NodeElement[] => {
      const out: Class_NodeElement[] = []
      sortByV(directChildren(container)).forEach(c => {
        if (isContainerParent(c)) out.push(...leavesInOrder(c))
        else out.push(c)
      })
      return out
    }

    // Réancre les sous-cadres imbriqués (bottom-up) sur l'enveloppe de leurs feuilles.
    const reanchorSubFrames = (container: Class_NodeElement) => {
      directChildren(container).forEach(c => {
        if (isContainerParent(c)) { reanchorSubFrames(c); c.reanchorTiedFrame() }
      })
    }

    this.drawingArea.sankey.visible_nodes_list
      .filter(isContainerParent)
      .filter(n => !n.dimensions_as_child.some(d => d.container_mode))
      .forEach(container => {
        const leaves = leavesInOrder(container)
        if (leaves.length === 0) return
        // Empilement uniforme des feuilles depuis le haut du cadre de premier niveau.
        let cursor = container.position_y + container.shape_margin_top
        leaves.forEach((leaf, i) => {
          if (i > 0) cursor += NodePositioning.containerChildGap(leaf, mode, const_gap)
          leaf.position_y = cursor
          leaf.applyPosition()
          cursor += leaf.getShapeHeightToUse()
        })
        // Le centre stocké de chaque feuille devient sa position empilée : sinon le prochain
        // anchorByCenterIfResized (mode absolu) tenterait de restaurer un centre périmé.
        leaves.forEach(l => l.captureCenterFromCorner())
        // Les sous-cadres enveloppent leurs feuilles ; le cadre de premier niveau reste ancré.
        reanchorSubFrames(container)
      })
  }

  /**
   * Redresse immédiatement un flux marqué « à garder droit » (clic droit → « Rendre
   * droit ») — issue su-model/opensankey#665, refonte #1231.
   *
   * Le marquage (`shape_must_stay_straight`) est posé par l'appelant ; ici on relance
   * simplement un `drawElements`, dont le post-process `enforceStraightLinks` applique
   * ET maintient la droiture à chaque dessin (dans les 3 modes). Plus de back-calc
   * d'écarts : la droiture n'est plus figée dans la métadonnée paramétrique, elle est
   * re-calculée à chaque frame.
   *
   * @returns toujours `true` (le redraw a été déclenché).
   */
  public straightenLink(link: Class_LinkElement): boolean {
    if (link.shape_is_recycling || link.source === link.target) return false
    this.drawingArea.drawElements()
    return true
  }

  /**
   * #665 (refonte #1231) — Post-processing « flux droit » appliqué APRÈS placement,
   * dans les **trois modes** (paramétrique, absolu, proportionnel). Modèle simple
   * **par flux** : pour chaque flux marqué `shape_must_stay_straight`, on déplace le
   * **nœud cible** verticalement pour que son accroche coïncide avec celle de la source
   * (source = référence). Pas de groupes rigides, pas de back-calc d'écarts : la
   * droiture est re-appliquée à chaque dessin (ce post-process tourne après
   * `_sankey.draw()` à chaque `drawElements`), donc rien à « figer ».
   *
   * Les flux sont traités triés par `position_u` de la source (amont → aval) pour que
   * les chaînes A→B→C se propagent correctement (B déplacé avant de traiter B→C). Sur
   * un nœud cible de deux flux marqués incompatibles, le dernier traité gagne.
   *
   * Option par flux `shape_straight_include_children` : redresse aussi les flux
   * « enfant-enfant » (source et cible descendantes des nœuds du flux marqué dans la
   * hiérarchie de dimensions) → la droiture survit à la désagrégation.
   *
   * À appeler après un draw (les accroches `getOutputLinkStartingPoint`/
   * `getInputLinkEndingPoint` reflètent les épaisseurs courantes ; l'offset relatif est
   * invariant par translation). Géométrie pure ; le caller redessine si `true`.
   *
   * @returns `true` si au moins un nœud cible a bougé (le caller redessine).
   */
  public enforceStraightLinks(): boolean {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    const isStraightenable = (L: Class_LinkElement): boolean =>
      L.is_visible && !L.shape_is_recycling && L.source !== L.target &&
      !(echangeTag && (L.source.hasGivenTag(echangeTag) || L.target.hasGivenTag(echangeTag)))

    // Mode d'ancrage effectif d'un flux. Source de vérité = `shape_straight_mode`
    // (enum). Rétrocompat : un ancien fichier ne portant que `shape_must_stay_straight`
    // se comporte comme l'ancien modèle, soit l'ancrage 'source'. 'none' = libre.
    const effectiveMode = (L: Class_LinkElement): Type_StraightMode | null => {
      const m = L.shape_straight_mode
      if (m && m !== 'none') return m
      return L.shape_must_stay_straight ? 'source' : null
    }

    // Flux à redresser → mode. Marqués visibles + (si include_children) flux visibles
    // dont source ET cible descendent des nœuds d'un flux marqué (même hidden) ; les
    // enfants héritent du mode du parent.
    const to_straighten = new Map<Class_LinkElement, Type_StraightMode>()
    this.drawingArea.sankey.links_list.forEach(L => {
      const mode = effectiveMode(L as Class_LinkElement)
      if (!mode) return
      if (isStraightenable(L)) to_straighten.set(L as Class_LinkElement, mode)
      if (L.shape_straight_include_children) {
        this.collectDescendantStraightLinks(L as Class_LinkElement, isStraightenable)
          .forEach(c => { if (!to_straighten.has(c)) to_straighten.set(c, mode) })
      }
    })
    if (to_straighten.size === 0) return false

    // Offsets d'accroche relatifs (invariants par translation), capturés depuis le
    // cache AVANT tout déplacement.
    type SItem = { L: Class_LinkElement, mode: Type_StraightMode, startOff: number, endOff: number }
    const items: SItem[] = []
    to_straighten.forEach((mode, L) => {
      const s = (L.source as Class_NodeElement).getOutputLinkStartingPoint(L)
      const e = (L.target as Class_NodeElement).getInputLinkEndingPoint(L)
      if (!s || !e) return
      items.push({ L, mode, startOff: s.y - L.source.position_y, endOff: e.y - L.target.position_y })
    })
    // Amont → aval : un nœud déplacé comme cible doit l'être avant d'être source.
    items.sort((a, b) => a.L.source.position_u - b.L.source.position_u)

    let moved = false
    items.forEach(({ L, mode, startOff, endOff }) => {
      const srcAccr = L.source.position_y + startOff   // y de l'accroche côté source
      const tgtAccr = L.target.position_y + endOff      // y de l'accroche côté cible
      // Écart vertical constant à maintenir entre l'accroche source et l'accroche
      // cible (px, y croît vers le bas → positif = cible plus bas). 0 = horizontal.
      const off = L.shape_straight_offset || 0
      // Lignes cibles src/tgt telles que `tgtLine - srcLine == off`. Le nœud de
      // référence du mode reste en place (delta nul), l'autre est amené pour
      // satisfaire l'écart. off = 0 redonne exactement l'ancienne droiture.
      let srcLine: number, tgtLine: number
      switch (mode) {
      case 'target':
        tgtLine = tgtAccr; srcLine = tgtAccr - off; break
      case 'highest': // ancre = accroche la plus haute (min y)
        if (srcAccr <= tgtAccr) { srcLine = srcAccr; tgtLine = srcAccr + off }
        else { tgtLine = tgtAccr; srcLine = tgtAccr - off }
        break
      case 'lowest': // ancre = accroche la plus basse (max y)
        if (srcAccr >= tgtAccr) { srcLine = srcAccr; tgtLine = srcAccr + off }
        else { tgtLine = tgtAccr; srcLine = tgtAccr - off }
        break
      // 'source' (défaut) et 'absolute' (réservé → repli sur 'source' pour l'instant).
      default: srcLine = srcAccr; tgtLine = srcAccr + off; break
      }
      const ds = srcLine - srcAccr
      if (Math.abs(ds) > 0.5) { L.source.position_y += ds; moved = true }
      const dt = tgtLine - tgtAccr
      if (Math.abs(dt) > 0.5) { L.target.position_y += dt; moved = true }
    })
    return moved
  }

  /**
   * #1231 — Flux « enfant-enfant » d'un flux marqué avec `shape_straight_include_children` :
   * flux visibles redressables dont la source descend (hiérarchie de dimensions) de la
   * source du flux marqué ET la cible descend de sa cible. Calculé à la volée (rien à
   * marquer sur les enfants) → la droiture survit à la désagrégation.
   */
  private collectDescendantStraightLinks(
    parent_link: Class_LinkElement,
    isStraightenable: (L: Class_LinkElement) => boolean
  ): Class_LinkElement[] {
    const src_desc = NodePositioning.collectNodeDescendants(parent_link.source as Class_NodeElement)
    const tgt_desc = NodePositioning.collectNodeDescendants(parent_link.target as Class_NodeElement)
    return this.drawingArea.sankey.links_list.filter(L =>
      L !== parent_link && isStraightenable(L) &&
      src_desc.has(L.source as Class_NodeElement) && tgt_desc.has(L.target as Class_NodeElement)
    ) as Class_LinkElement[]
  }

  /**
   * #1231 — Ensemble { nœud + tous ses descendants } via la hiérarchie de dimensions
   * (`dimensions_as_parent.children`). Utilisé pour propager la droiture aux flux
   * désagrégés.
   */
  public static collectNodeDescendants(node: Class_NodeElement): Set<Class_NodeElement> {
    const out = new Set<Class_NodeElement>()
    const stack: Class_NodeElement[] = [node]
    while (stack.length > 0) {
      const n = stack.pop()!
      if (out.has(n)) continue
      out.add(n)
      n.dimensions_as_parent.forEach(dim => {
        dim.children.forEach(c => {
          if (!out.has(c as Class_NodeElement)) stack.push(c as Class_NodeElement)
        })
      })
    }
    return out
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
    if (node.position_v == -1) {
      // v is computed at the first path
      node.position_v = current_v
    }
    let new_current_v = current_v
    const desagregated_nodes = ([...new Set(node.dimensions_as_parent.flatMap(d => d.children))] as Class_NodeElement[]).filter(n => n.hasGivenTag(tag))
    desagregated_nodes.forEach(nn => {


      const shift_y = (desagregated_nodes.length - 1) / 2 * node.shape_position_dy

      let current_y = node.position_y - shift_y
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
