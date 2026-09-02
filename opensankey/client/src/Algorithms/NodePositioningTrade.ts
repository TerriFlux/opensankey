// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #243 — Placement des nœuds d'échange (import/export) extrait de NodePositioning en fonctions
// libres prenant la DrawingArea (n'utilisent que `drawingArea`). NodePositioning garde des
// méthodes-délégatrices publiques splitTrade/arrangeTrade.

import { NodeImportExportAboveBelowStyle, NodeImportExportCloseStyle, NodeSectorStyle } from '../Elements/ElementStyle'
import type { Class_DrawingArea } from '../types/DrawingArea'
import type { Class_NodeElement } from '../Elements/Node'

/**
 * Les nœuds d'échange, ANCÊTRES D'ABORD.
 *
 * `SplitIOrE` recâble la hiérarchie d'un enfant en allant chercher le produit
 * DÉJÀ ÉCLATÉ de son parent (`<extrémité>-<parent><suffixe>`). Si le parent n'a
 * pas encore été éclaté, la recherche ne trouve rien, la dimension n'est pas
 * créée, et l'enfant se retrouve sans dimension gouvernante — donc visible à
 * TOUS les niveaux (`checkIfRelatedDimensionsAreSelected` rend `true` faute de
 * groupe de niveaux porté).
 *
 * L'ordre de `nodes_list` étant celui du fichier, le rendu dépendait donc de
 * l'ordre de déclaration : un agrégat déclaré APRÈS ses enfants faisait
 * dessiner le parent ET ses enfants en même temps (Bois Savoie :
 * `HorsPaysDeSavoie` avec `AutresRegionsFrancaises` et `International`, soit
 * trois fois le même flux d'échange par produit).
 *
 * Parcours en profondeur, post-ordre, et sûr en cas de cycle : un nœud déjà en
 * cours de visite n'est pas revisité — il sera place par son propre appel.
 */
function tradeNodesAncestorsFirst(nodes: Class_NodeElement[]): Class_NodeElement[] {
  const in_scope = new Map(nodes.map(node => [node.id, node]))
  const placed = new Set<string>()
  const visiting = new Set<string>()
  const ordered: Class_NodeElement[] = []
  const visit = (node: Class_NodeElement) => {
    if (placed.has(node.id) || visiting.has(node.id)) {
      return
    }
    visiting.add(node.id)
    Object.values(node.dimensions_as_child).forEach(dim => {
      const parent = in_scope.get(dim.parent?.id)
      if (parent !== undefined) {
        visit(parent)
      }
    })
    visiting.delete(node.id)
    placed.add(node.id)
    ordered.push(node)
  }
  nodes.forEach(visit)
  return ordered
}

/**
 * Initially there is only one node per type of exchanges. It must be split to have one import and
 * one export per product (International → InternationalProduct1Importation / …Exportation).
 */
export function splitTrade(da: Class_DrawingArea) {
  if (!da.sankey.node_taggs_dict['type de noeud']) {
    return
  }

  const trade_nodes = tradeNodesAncestorsFirst(da.sankey.nodes_list.filter(n =>
    n.hasGivenTag(da.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'])
  ) as Class_NodeElement[])

  // first split the nodes
  trade_nodes.forEach(node => {
    if (node.style.length < 2) {
      node.addStyle(da.sankey.styles_dict[NodeSectorStyle])
      node.addStyle(da.sankey.styles_dict[NodeImportExportCloseStyle])
    }
    // Un nœud DÉJÀ éclaté n'est pas éclaté une seconde fois — et surtout pas
    // masqué : c'est lui que la page doit montrer. Les fichiers anciens
    // stockent l'échange sous sa forme éclatée plutôt qu'agrégée, et la
    // seconde génération perdrait sa hiérarchie de niveaux
    // (cf. Class_NodeElement.is_split_trade_node).
    if ((node as Class_NodeElement).is_split_trade_node) {
      return
    }
    if (node.output_links_list.length > 0) {
      (node as Class_NodeElement).SplitIOrE(true)
    }
    if (node.input_links_list.length > 0) {
      (node as Class_NodeElement).SplitIOrE(false)
    }
    node.setInvisible()
  })

  const split_trade_nodes = da.sankey.nodes_list.filter(n =>
    n.hasGivenTag(da.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'])
  )

  // set dimensions. It must be done after each trade node has been split
  split_trade_nodes.forEach(node => {
    if (!node.sibling) return
    (node as Class_NodeElement).setTradeDimensions(true);
    (node as Class_NodeElement).setTradeDimensions(false)
  })
}

/** Computes u,v,x and initial y for trade nodes. */
export function arrangeTrade(da: Class_DrawingArea, compute_xy: boolean) {
  if (!da.sankey.node_taggs_dict['type de noeud']) {
    return
  }

  const process_nodes = da.sankey.nodes_list
  const type_tagg = da.sankey.node_taggs_dict['type de noeud']
  const echangeTag = type_tagg.tags_dict['echange']
  const sectorTag = type_tagg.tags_dict['secteur']
  const all_import_nodes = process_nodes.filter(n =>
    n.hasGivenTag(echangeTag) && n.output_links_list.length > 0
  )
  const all_export_nodes = process_nodes.filter(n =>
    n.hasGivenTag(echangeTag) && n.input_links_list.length > 0
  )
  const other_nodes = process_nodes.filter(n => !n.hasGivenTag(echangeTag))

  // mfa_problem#222 : les échanges-secteur (tag `secteur` cumulé) se rattachent à des produits et
  // doivent être placés horizontalement (import à gauche / export à droite du produit connecté),
  // en miroir du placement vertical (haut/bas) des échanges-produit. On sépare donc les deux
  // familles ; le bloc vertical historique ne traite que les produits.
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

  // Échanges-secteur : positionnés en DELTA par rapport au produit connecté (import vs son target,
  // export vs son source) — décalage X/Y = shape_position_dx / shape_position_dy du nœud, exactement
  // comme le placement X des produits (et non une position absolue, qui les envoyait au bord).
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
    let cont = da.sankey.containers_dict['import']
    if (!cont) {
      cont = da.sankey.addNewContainer('import', 'Importations')
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
    delete da.sankey.containers_dict['import']
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
    let cont = da.sankey.containers_dict['export']
    if (!cont) {
      cont = da.sankey.addNewContainer('export', 'Exportations')
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
    delete da.sankey.containers_dict['export']
  }
}
