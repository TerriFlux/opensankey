// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// SOCLE UNIQUE « cycles + index horizontal » (opensankey#1253).
//
// L'index horizontal etait calcule par DEUX algorithmes distincts qui pouvaient diverger :
//   - `position_x` : etapes 1/2 de `computeAutoSankey` (DFS topologique + relaxation),
//   - `position_u` : `computeParametrization` -> `detectAllCyclesAndOptimize` (profondeurs +
//     detection de recyclage par comparaison de profondeurs).
// Ils partagent desormais `computeHorizontalIndexes()` : meme graphe -> memes colonnes en x et en u.
//
// Sous-service compose detenu par NodePositioning ; le champ s'appelle `drawingArea` (et non `_da`)
// parce que les corps de methodes ont ete deplaces verbatim depuis NodePositioning lors de #243 c8.

import type { Class_DrawingArea } from '../types/DrawingArea'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'

/**
 * Topologie « structurelle » : le seul filtre de liens du socle.
 *
 * Un flux a valeur nulle (typiquement fraichement cree, valeur pas encore saisie) reste
 * structurellement present et doit etre traverse — sinon son noeud cible n'obtient pas de colonne
 * et garde son X par defaut, alors que sa colonne u, elle, etait correcte (symptome historique
 * « bonne colonne u mais noeud mal place, corrige apres reload »).
 */
function isStructuralLink(link: Class_LinkElement): boolean {
  return link.is_visible_ignoring_zero
}

/**
 * Un index est « non assigne » soit parce que le noeud est absent du dictionnaire (appelant qui
 * part d'un objet vide, cf. SankeyAnimation), soit parce qu'il porte la sentinelle -1 utilisee par
 * `computeHorizontalIndexes`. Les deux conventions coexistent : le socle accepte les deux.
 */
function isUnassigned(index: number | undefined): boolean {
  return index === undefined || index < 0
}

export class NodePositioningCyclesCore {
  public readonly drawingArea: Class_DrawingArea

  constructor(drawingArea: Class_DrawingArea) {
    this.drawingArea = drawingArea
  }

  /**
   * Liens que l'utilisateur a explicitement verrouilles comme liens de recyclage.
   * Pre-amorces dans la detection de cycles : le DFS les considere deja coupes et ne descend pas
   * par eux, donc aucune autre arete du meme cycle n'est flaguee back-edge.
   */
  public get user_forced_recycling_link_ids(): Set<string> {
    return new Set(
      this.drawingArea.sankey.visible_links_list
        .filter(link => link.shape_is_recycling_locked === true && link.shape_is_recycling === true)
        .map(link => link.id)
    )
  }

  /** Liens que l'utilisateur a explicitement verrouilles comme NON recyclage. */
  public get user_forbidden_recycling_link_ids(): Set<string> {
    return new Set(
      this.drawingArea.sankey.visible_links_list
        .filter(link => link.shape_is_recycling_locked === true && link.shape_is_recycling === false)
        .map(link => link.id)
    )
  }

  /**
   * SOCLE : calcule l'index horizontal (colonne, base 0) de chaque noeud et la liste des liens de
   * recyclage. Unique point d'entree pour `position_x` (computeAutoSankey) comme pour `position_u`
   * (computeParametrization) — cf. `detectAllCyclesAndOptimize`.
   *
   * 1. Amorcage : tous les noeuds a -1, liens de recyclage forces par l'utilisateur deja coupes.
   * 2. Propagation depuis les sources (aucune entree structurelle), puis les noeuds isoles, puis
   *    les composantes restantes (cycles purs sans source).
   * 3. Compaction : chaque lien de recyclage tente de decaler sa source vers un trou de colonne.
   * 4. Verrouillage : les noeuds dont la colonne est epinglee reprennent leur `position_u`.
   */
  public computeHorizontalIndexes(nodes_to_process: Class_NodeElement[]): {
    recycling_links: string[],
    horizontal_indexes: { [node_id: string]: number }
  } {
    const horizontal_indexes: { [node_id: string]: number } = {}
    const recycling_links: string[] = [...this.user_forced_recycling_link_ids]

    nodes_to_process.forEach(node => { horizontal_indexes[node.id] = -1 })

    const hasStructuralInput = (node: Class_NodeElement) => node.input_links_list.some(isStructuralLink)
    const hasStructuralOutput = (node: Class_NodeElement) => node.output_links_list.some(isStructuralLink)

    // Sources d'abord : elles ancrent la colonne 0 et donnent l'ordre topologique.
    nodes_to_process
      .filter(node => !hasStructuralInput(node) && hasStructuralOutput(node))
      .forEach(node => {
        if (horizontal_indexes[node.id] === -1) {
          this.computeHorizontalIndex(node, nodes_to_process, 0, [], recycling_links, horizontal_indexes)
        }
      })

    // Noeuds isoles : aucune arete structurelle, colonne 0.
    nodes_to_process
      .filter(node => !hasStructuralInput(node) && !hasStructuralOutput(node))
      .forEach(node => { horizontal_indexes[node.id] = 0 })

    // Reste : composantes qui n'ont aucune source (cycle pur) — on amorce sur un noeud arbitraire.
    nodes_to_process.forEach(node => {
      if (horizontal_indexes[node.id] === -1) {
        this.computeHorizontalIndex(node, nodes_to_process, 0, [], recycling_links, horizontal_indexes)
      }
    })

    // Compaction. `checked` est volontairement distinct de `recycling_links` : la re-exploration
    // depuis la source decalee ne doit pas repolluer la liste finale des liens de recyclage.
    const checked: string[] = []
    recycling_links.forEach(link_id => {
      const link = this.drawingArea.sankey.links_dict[link_id]
      if (link === undefined) return
      this.computeRecyclingHorizontalIndex(nodes_to_process, link, checked, horizontal_indexes)
    })

    // Colonnes epinglees par l'utilisateur : elles ecrasent le resultat de l'algorithme.
    nodes_to_process.forEach(node => {
      if (node.shape_position_u_locked === true) {
        horizontal_indexes[node.id] = Math.max(0, Math.round(node.position_u) - 1)
      }
    })

    return { recycling_links, horizontal_indexes }
  }

  /**
   * Detecte les cycles et calcule les index horizontaux qui pilotent `position_u`.
   *
   * Historiquement un algorithme distinct (profondeurs + recyclage par comparaison de profondeurs),
   * d'ou la divergence x/u ; c'est aujourd'hui le socle commun (opensankey#1253). Signature
   * conservee : appele par `computeParametrization`.
   */
  public detectAllCyclesAndOptimize(nodes_to_process: Class_NodeElement[]): {
    recycling_links: string[],
    horizontal_indexes: { [node_id: string]: number }
  } {
    return this.computeHorizontalIndexes(nodes_to_process)
  }

  /**
   * Reflague `shape_is_recycling` d'apres des colonnes deja connues : un flux est en recyclage
   * s'il ne progresse pas vers la droite (colonne cible <= colonne source). Le verrouillage
   * tri-state de l'utilisateur (OpenSankey#711) prime toujours sur la geometrie.
   *
   * Utilise par la branche `skip_horizontal` de computeAutoSankey (colonnes issues de position_u)
   * et par le recalcul incremental apres un deplacement de noeud (sankeyapplication#153, colonnes
   * deduites des x). Les noeuds hors `horizontal_indexes` (echange) ne contraignent rien.
   *
   * @returns pour chaque lien dont le statut a CHANGE, sa valeur precedente (utile a l'undo).
   */
  public markRecyclingLinks(
    nodes_to_process: Class_NodeElement[],
    horizontal_indexes: { [node_id: string]: number }
  ): { [link_id: string]: boolean } {
    const forced = this.user_forced_recycling_link_ids
    const forbidden = this.user_forbidden_recycling_link_ids
    const previous_values: { [link_id: string]: boolean } = {}

    const assign = (link: Class_LinkElement, value: boolean) => {
      if (link.shape_is_recycling === value) return
      previous_values[link.id] = link.shape_is_recycling
      link.shape_is_recycling = value
    }

    nodes_to_process.forEach(node => {
      const node_index = horizontal_indexes[node.id]
      node.output_links_list.forEach(link => {
        const link_data = this.drawingArea.sankey.links_dict[link.id]
        if (link_data === undefined) return
        if (forced.has(link.id)) return assign(link_data, true)
        if (forbidden.has(link.id)) return assign(link_data, false)

        // Extremite sans colonne (noeud d'echange) : jamais du recyclage. C'est deja ce que
        // pose splitTrade a la creation du noeud d'echange.
        const target_index = horizontal_indexes[link_data.target.id]
        if (target_index === undefined || node_index === undefined) return assign(link_data, false)
        assign(link_data, node_index >= target_index)
      })
    })

    return previous_values
  }

  /**
   * Explore les branches issues de `start_node` et affecte leur index horizontal.
   * DFS iteratif (tri topologique + detection des back-edges) puis relaxation en une passe
   * (plus long chemin). O(V+E). Les back-edges rencontrees sont ajoutees a `recycling_links_ids`.
   *
   * @param {Class_NodeElement} start_node Noeud de depart
   * @param {Class_NodeElement[]} nodes_to_process Sous-graphe considere
   * @param {number} starting_index Index affecte a `start_node` s'il n'en a pas de plus grand
   * @param {string[]} _visited_nodes_ids Inutilise (compatibilite d'API)
   * @param {string[]} recycling_links_ids Liens deja coupes ; enrichi des back-edges detectees
   * @param {object} horizontal_indexes_per_nodes_ids Index courant par id de noeud (mute en place)
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

    // Arete traversable : reste dans le sous-graphe, structurelle, et non coupee.
    const traversableTargetId = (link: Class_LinkElement): string | undefined => {
      const link_data = this.drawingArea.sankey.links_dict[link.id]
      if (!link_data || !isStructuralLink(link)) return undefined
      const target_id = link_data.target.id
      if (!nodes_set.has(target_id) || recycling_set.has(link.id)) return undefined
      return target_id
    }

    // Phase 1 : DFS iteratif — detection de cycles + ordre topologique.
    // Couleurs : undefined = non visite, 'gray' = en cours, 'black' = termine.
    const color = new Map<string, 'gray' | 'black'>()
    const topo_order: Class_NodeElement[] = []
    const dfs_stack: [Class_NodeElement, 'enter' | 'exit'][] = [[start_node, 'enter']]

    while (dfs_stack.length > 0) {
      const [node, phase] = dfs_stack.pop()!

      if (phase === 'exit') {
        color.set(node.id, 'black')
        topo_order.push(node) // post-order = topologique inverse
        continue
      }

      const c = color.get(node.id)
      if (c === 'black' || c === 'gray') continue

      color.set(node.id, 'gray')
      dfs_stack.push([node, 'exit'])

      node.output_links_list.forEach(link => {
        const target_id = traversableTargetId(link)
        if (target_id === undefined) return

        const c_target = color.get(target_id)
        if (c_target === 'gray') {
          // Arete arriere = cycle -> lien de recyclage
          recycling_links_ids.push(link.id)
          recycling_set.add(link.id)
        } else if (c_target !== 'black') {
          dfs_stack.push([this.drawingArea.sankey.nodes_dict[target_id], 'enter'])
        }
      })
    }

    // Phase 2 : relaxation en ordre topologique reel (topo_order est en post-order).
    const start_index = horizontal_indexes_per_nodes_ids[start_node.id]
    if (isUnassigned(start_index) || starting_index > start_index) {
      horizontal_indexes_per_nodes_ids[start_node.id] = starting_index
    }

    for (let i = topo_order.length - 1; i >= 0; i--) {
      const node = topo_order[i]
      const node_idx = horizontal_indexes_per_nodes_ids[node.id]
      if (isUnassigned(node_idx)) continue // non atteignable depuis les sources

      node.output_links_list.forEach(link => {
        const target_id = traversableTargetId(link)
        if (target_id === undefined) return

        const proposed = node_idx + 1
        if (proposed > (horizontal_indexes_per_nodes_ids[target_id] ?? -Infinity)) {
          horizontal_indexes_per_nodes_ids[target_id] = proposed
        }
      })
    }
  }

  /**
   * Compacte le graphe autour d'un lien de recyclage : si la source du lien peut reculer dans un
   * « trou » de colonne laisse par ses propres predecesseurs, on l'y decale et on repropage.
   *
   * @param {Class_NodeElement[]} nodes_to_process Sous-graphe considere
   * @param {Class_LinkElement} link Lien identifie comme lien de recyclage
   * @param {string[]} recycling_links_ids Liens coupes pour la repropagation
   * @param {object} horizontal_indexes_per_nodes_ids Index courant par id de noeud (mute en place)
   */
  public computeRecyclingHorizontalIndex(
    nodes_to_process: Class_NodeElement[],
    link: Class_LinkElement,
    recycling_links_ids: string[],
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number }
  ) {
    const target_node_id = link.target.id
    const source_node_id = link.source.id

    // Rien a compacter si la source est deja strictement avant la cible (ses index ont pu etre
    // retraites par un appel precedent), ni si l'une des deux extremites est hors du sous-graphe
    // et n'a donc pas d'index.
    const source_index = horizontal_indexes_per_nodes_ids[source_node_id]
    const target_index = horizontal_indexes_per_nodes_ids[target_node_id]
    if (source_index === undefined || target_index === undefined) return
    if (source_index < target_index) return

    // Colonnes des predecesseurs structurels de la source. On ignore les predecesseurs hors
    // sous-graphe (noeuds d'echange par exemple) : sans index, ils ne contraignent rien.
    const source_node = this.drawingArea.sankey.nodes_dict[source_node_id]
    const indexes_before_source_node = source_node.input_links_list
      .filter(isStructuralLink)
      .map(input_link => horizontal_indexes_per_nodes_ids[
        this.drawingArea.sankey.links_dict[input_link.id].source.id
      ])
      .filter(index => index !== undefined)

    const min_index = indexes_before_source_node.length > 0
      ? Math.min(...indexes_before_source_node)
      : -1

    // Premier trou entre le predecesseur le plus a gauche et la source : on y decale la source.
    const horizontal_index_of_source_node = horizontal_indexes_per_nodes_ids[source_node_id]
    for (let index = min_index + 1; index < horizontal_index_of_source_node; index++) {
      if (!indexes_before_source_node.includes(index)) {
        horizontal_indexes_per_nodes_ids[source_node_id] = index
        this.computeHorizontalIndex(
          source_node,
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
