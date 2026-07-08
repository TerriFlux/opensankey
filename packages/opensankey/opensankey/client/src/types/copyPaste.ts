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

/**
 * Duplique les nœuds `node_ids` (et les liens internes à la sélection) avec un offset de 50 px,
 * puis sélectionne les copies. Tout se fait sous `withBypassRedraws` (un seul rendu final).
 */
export function copyNodes(da: Class_DrawingArea, node_ids: string[]) {
  const sankey = da.sankey
  da.withBypassRedraws(() => {
    const offset = 50
    const source_nodes = node_ids.map(id => sankey.nodes_dict[id]).filter(n => n !== undefined)
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
          }
        }
      })
    })

    source_nodes.forEach(node => {
      const new_node = node_copy_map.get(node.id)
      if (new_node) new_node.keepLinkOrderingFrom(node, matching_link_id)
    })
  })
}
