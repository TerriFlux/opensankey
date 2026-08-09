// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1346 (lot 6 draw.io) — « Motifs » réutilisables (scratchpad).
//
// Un motif est un SOUS-DIAGRAMME sérialisé : un sous-ensemble de nœuds + les flux internes
// à ce sous-ensemble, au format JSON de persistance COURANT de l'application. La capture et
// la réinsertion réutilisent la sérialisation par élément existante (NodeElementPersistence /
// LinkElementPersistence) — pas de format parallèle : un motif est un fragment de fichier.
//
// Domaine MODÈLE pur (pattern copyPaste.ts, #242) : fonctions libres prenant la DrawingArea,
// aucune UI. Le panneau (opensankey-editor) porte le stockage localStorage et le drag-drop.
//
// Choix de capture :
//  - les clés de LIENS du nœud (`inputLinksId` / `outputLinksId` / `links_order`) sont
//    retirées : elles référencent des ids du document d'origine ; les flux recréés se
//    ré-attachent d'eux-mêmes via addNewLink, l'ordre retombe sur l'ordre géométrique ;
//  - les `dimensions` (agrégation parent/enfant) sont retirées : un motif inséré ne doit
//    pas se greffer sur la hiérarchie d'un autre document (ni de son propre document
//    d'origine via des ids homonymes) ;
//  - les tags/valeurs sont CONSERVÉS : dans le même document ils se réattachent par id ;
//    dans un autre document, les groupes absents sont ignorés (NodeTagsManager.fromJSON
//    et LinkValues.fromJSON sont tolérants), le motif dégrade proprement en géométrie+styles.

import type { Class_DrawingArea } from './DrawingArea'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'
import type { Type_JSON } from './Utils'
import {
  LinkElementPersistence,
  NodeElementPersistence,
} from '../Persistence/SankeyPersistence'

/** Motif sérialisé : fragments de fichier au format courant, indexés par id d'origine. */
export type Type_Motif = {
  name: string
  nodes: { [id: string]: Type_JSON }
  links: { [id: string]: Type_JSON }
}

// Clés de nœud retirées à la capture (cf. en-tête).
const STRIPPED_NODE_KEYS = ['dimensions', 'inputLinksId', 'outputLinksId', 'links_order']

/**
 * Capture la sélection courante (nœuds sélectionnés + flux internes à la sélection) en motif.
 * `null` si aucun nœud n'est sélectionné.
 */
export function captureMotifFromSelection(da: Class_DrawingArea): Type_Motif | null {
  const selected = da.selected_nodes_list
  if (selected.length === 0) return null
  const selected_ids = new Set(selected.map(n => n.id))
  const nodes: { [id: string]: Type_JSON } = {}
  selected.forEach(node => {
    const json = NodeElementPersistence.toJSON(node, {})
    STRIPPED_NODE_KEYS.forEach(k => delete json[k])
    nodes[node.id] = json
  })
  const links: { [id: string]: Type_JSON } = {}
  selected.forEach(node => {
    node.output_links_list.forEach(link => {
      if (selected_ids.has(link.target.id) && !links[link.id]) {
        links[link.id] = LinkElementPersistence.toJSON(link, {})
      }
    })
  })
  const name = selected[0].name + (selected.length > 1 ? ' +' + String(selected.length - 1) : '')
  return { name, nodes, links }
}

/** Premier id libre dérivé de `base` (jamais le suffixe `_0` d'addNewNode, qui mute aussi le nom). */
function freeNodeId(da: Class_DrawingArea, base: string): string {
  if (!da.sankey.nodes_dict[base]) return base
  let i = 1
  while (da.sankey.nodes_dict[base + '_m' + String(i)]) i++
  return base + '_m' + String(i)
}

/** Centre du motif : centre de la bbox des centres de nœuds (x/y = CENTRES, format courant). */
function motifCenter(motif: Type_Motif): { x: number, y: number } | null {
  let min_x = Infinity, min_y = Infinity, max_x = -Infinity, max_y = -Infinity
  Object.values(motif.nodes).forEach(j => {
    const x = Number(j['x'])
    const y = Number(j['y'])
    if (!Number.isFinite(x) || !Number.isFinite(y)) return
    if (x < min_x) min_x = x
    if (x > max_x) max_x = x
    if (y < min_y) min_y = y
    if (y > max_y) max_y = y
  })
  if (!Number.isFinite(min_x)) return null
  return { x: (min_x + max_x) / 2, y: (min_y + max_y) / 2 }
}

/**
 * Insère `motif` dans le diagramme, centré sur le point MONDE `(world_x, world_y)`, et
 * sélectionne les éléments créés. Ids remappés vers des ids libres (un motif peut être
 * inséré dans son propre document d'origine). Annulable : l'undo supprime les copies,
 * le redo rejoue l'insertion (pattern copyNodes). Renvoie `false` si le motif est vide.
 */
export function insertMotif(
  da: Class_DrawingArea,
  motif: Type_Motif,
  world_x: number,
  world_y: number
): boolean {
  const center = motifCenter(motif)
  if (!center) return false
  const dx = world_x - center.x
  const dy = world_y - center.y
  // Version de LECTURE : les motifs sont produits par cette application au format courant →
  // aucune branche de migration legacy ne doit jouer. Même convention que le loader
  // (effectiveLoadVersion renvoie la version app pour un fichier portant format_version) ;
  // le paramètre est typé number mais transporte de fait la chaîne de version.
  const version = da.application_data.version as unknown as number

  let created_nodes: Class_NodeElement[] = []
  let created_links: Class_LinkElement[] = []

  const insert = () => da.withBypassRedraws(() => {
    created_nodes = []
    created_links = []
    da.purgeSelection()
    const sankey = da.sankey
    const node_map = new Map<string, Class_NodeElement>()
    Object.entries(motif.nodes).forEach(([old_id, node_json_src]) => {
      const json = JSON.parse(JSON.stringify(node_json_src)) as Type_JSON
      json['x'] = Number(json['x']) + dx
      json['y'] = Number(json['y']) + dy
      const node = sankey.addNewNode(freeNodeId(da, old_id), old_id)
      NodeElementPersistence.fromJSON(version, node, json, { pos_is_center: true })
      node_map.set(old_id, node)
      da.addElementToSelection(node)
      created_nodes.push(node)
    })
    Object.values(motif.links).forEach(link_json_src => {
      const json = JSON.parse(JSON.stringify(link_json_src)) as Type_JSON
      const source = node_map.get(String(json['idSource']))
      const target = node_map.get(String(json['idTarget']))
      if (!source || !target) return
      // Points de contrôle libres (os#1301) : coordonnées MONDE → suivre le décalage.
      const local = json['local'] as Type_JSON | undefined
      const wps = local?.['shape_waypoints']
      if (local && Array.isArray(wps)) {
        local['shape_waypoints'] = (wps as unknown as { x: number, y: number }[]).map(p => ({
          x: Number(p.x) + dx,
          y: Number(p.y) + dy
        })) as unknown as Type_JSON
      }
      const link = sankey.addNewLink(source, target)
      LinkElementPersistence.fromJSON(version, link, json, {})
      da.addElementToSelection(link)
      created_links.push(link)
    })
  })

  // Liens puis nœuds, comme deleteSelection / copyNodes : deleteNode supprime en cascade
  // les liens attachés, les retirer d'abord évite de repasser sur des liens détruits.
  const undo = () => da.withBypassRedraws(() => {
    created_links.forEach(link => da.deleteLink(link))
    created_nodes.forEach(node => da.deleteNode(node))
  })

  da.saveUndo(undo)
  da.saveRedo(insert)
  insert()
  return created_nodes.length > 0
}
