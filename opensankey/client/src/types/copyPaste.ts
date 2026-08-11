// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #242 — Domaine « copy-paste » extrait de Class_DrawingArea en fonction libre prenant la DA
// en paramètre (pattern SankeyAnimation). N'accède qu'à des membres publics de la DA. La
// classe garde une méthode-délégatrice `copyNodes`.

import type { Class_DrawingArea } from './DrawingArea'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_ContainerElement } from '../Elements/TextZone'

/**
 * Duplique les nœuds `node_ids` (et les liens internes à la sélection) avec un offset de 50 px,
 * puis sélectionne les copies. Tout se fait sous `withBypassRedraws` (un seul rendu final).
 *
 * Annulable : l'undo supprime les copies créées. Le redo rejoue la duplication — les ids
 * `_copy` étant libérés par l'undo, il recrée exactement les mêmes. On retient les éléments
 * du DERNIER passage, sinon l'undo d'après viserait des instances périmées.
 */
export function copyNodes(da: Class_DrawingArea, node_ids: string[]) {
  copyElements(da, node_ids, [])
}

/**
 * os#1340 (Ctrl+D) — duplique la SÉLECTION courante : nœuds (+ liens internes) et zones de
 * texte, en une seule transition d'historique. Les copies deviennent la nouvelle sélection.
 */
export function duplicateSelection(da: Class_DrawingArea) {
  copyElements(
    da,
    da.selected_nodes_list.map(n => n.id),
    da.selected_containers_list.map(c => c.id)
  )
}

/**
 * os#1340 (alt-glisser = cloner) — comme duplicateSelection mais SANS décalage : les copies
 * naissent exactement sous les originaux, puis le geste de drag les emporte.
 */
export function cloneSelectionInPlace(da: Class_DrawingArea) {
  copyElements(
    da,
    da.selected_nodes_list.map(n => n.id),
    da.selected_containers_list.map(c => c.id),
    0
  )
}

/**
 * Duplication unifiée nœuds + zones de texte (cf. copyNodes pour le contrat undo/redo).
 * `container_ids` : zones de texte à dupliquer avec le même offset que les nœuds.
 */
export function copyElements(da: Class_DrawingArea, node_ids: string[], container_ids: string[], offset = 50) {
  const sankey = da.sankey
  let created_nodes: Class_NodeElement[] = []
  let created_links: Class_LinkElement[] = []
  let created_containers: Class_ContainerElement[] = []

  const copy = () => da.withBypassRedraws(() => {
    created_nodes = []
    created_links = []
    created_containers = []
    const source_nodes = node_ids.map(id => sankey.nodes_dict[id]).filter(n => n !== undefined)
    const source_containers = container_ids
      .map(id => sankey.containers_dict[id])
      .filter(c => c !== undefined)
    da.purgeSelection()
    const selected_node_ids = new Set(node_ids)
    const matching_link_id: { [_: string]: string } = {}
    const node_copy_map = new Map<string, Class_NodeElement>()

    source_nodes.forEach(node => {
      const new_node = sankey.addNewNode(node.id + '_copy', node.name)
      node_copy_map.set(node.id, new_node)
      new_node.copyFrom(node)
      new_node.position_x = node.position_x + offset
      new_node.position_y = node.position_y + offset
      da.addElementToSelection(new_node)
      created_nodes.push(new_node)
    })

    source_nodes.forEach(node => {
      node.output_links_list.forEach(link => {
        if (selected_node_ids.has(link.target.id)) {
          const new_source = node_copy_map.get(node.id)
          const new_target = node_copy_map.get(link.target.id)
          if (new_source && new_target) {
            const new_link = sankey.addNewLink(new_source, new_target)
            new_link.copyFrom(link)
            new_link.source = new_source
            new_link.target = new_target
            matching_link_id[link.id] = new_link.id
            da.addElementToSelection(new_link)
            created_links.push(new_link)
          }
        }
      })
    })

    source_nodes.forEach(node => {
      const new_node = node_copy_map.get(node.id)
      if (new_node) new_node.keepLinkOrderingFrom(node, matching_link_id)
    })

    // os#1340 — zones de texte : même schéma que les nœuds (id + '_copy', copyFrom, offset).
    source_containers.forEach(container => {
      const new_container = sankey.addNewContainer(container.id + '_copy', container.name)
      new_container.copyFrom(container)
      new_container.position_x = container.position_x + offset
      new_container.position_y = container.position_y + offset
      da.addElementToSelection(new_container)
      created_containers.push(new_container)
    })
  })

  // Liens puis nœuds, comme deleteSelection : deleteNode supprime en cascade les liens
  // attachés, les retirer d'abord évite de repasser sur des liens déjà détruits.
  const undo = () => da.withBypassRedraws(() => {
    created_links.forEach(link => da.deleteLink(link))
    created_nodes.forEach(node => da.deleteNode(node))
    created_containers.forEach(container => da.deleteContainer(container))
  })

  da.saveUndo(undo)
  da.saveRedo(copy)
  copy()
}
