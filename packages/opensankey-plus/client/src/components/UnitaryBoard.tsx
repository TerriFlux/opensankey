import { updateUnitaryStyles } from "../deps/OpenSankey/Algorithms/UnitaryBoard"
import { elementStyleConfigs, node_exchanges_style, node_unitary_styles } from "../deps/OpenSankey/Elements/ElementStyle"
import { Class_NodeElement } from "../deps/OpenSankey/Elements/Node"
import { DrawingAreaPersistence } from "../deps/OpenSankey/Persistence/SankeyPersistence"
import { compressJSONToGzip } from "../deps/OpenSankey/Persistence/UniversalJSONCompression"
import { Class_Tag } from "../deps/OpenSankey/types/Tag"
import { Class_ViewTagGroup } from "../deps/OpenSankey/types/TagGroup"
import { makeId } from "../deps/OpenSankey/types/Utils"
import { Class_ApplicationDataOSP } from "../types/ApplicationDataOSP"
import { Class_DrawingAreaOSP, DrawingAreaPersistenceOSP } from "../types/DrawingAreaOSP"

/**
 * Crée une vue unitaire - soit un board avec tous les nœuds, soit une vue focalisée sur un nœud spécifique
 * @param app_data - L'application data
 * @param node_ref - Le nœud de référence (optionnel). Si fourni, crée une vue focalisée sur ce nœud
 */
export const createUnitaryView = (
  app_data: Class_ApplicationDataOSP,
  node_ref?: Class_NodeElement
) => {
  // If no base sankey is given, we take the currently active sankey
  const base_drawing_area = app_data.drawing_area
  base_drawing_area.purgeSelection()

  // If no view existed previously, we add the active sankey as master sankey
  if (!app_data.has_views && !app_data.master_drawing_area) {
    app_data.master_drawing_area = app_data.drawing_area
    app_data.drawing_area.sankey.setInvisible()
    app_data.drawing_area.purgeSelection()
    app_data.drawing_area.unDraw()
  }

  // Create the new sankey
  const new_drawing_area = app_data.createNewDrawingArea(makeId('unitary_view'))
  new_drawing_area.is_unitary = true
  new_drawing_area.bypass_redraws = true

  // Copy current sankey
  const name = node_ref ? 'Unitary view of ' + node_ref.name : 'Board Unitary View'
  const id = new_drawing_area.id
  const copy = DrawingAreaPersistenceOSP.toJSON(base_drawing_area as Class_DrawingAreaOSP, { keep_siblings: true })
  copy.id = id
  DrawingAreaPersistenceOSP.fromJSON(new_drawing_area, copy)
  new_drawing_area.name = name

  // Supprimer les containers
  new_drawing_area.sankey.containers_list.forEach(cont => {
    new_drawing_area.deleteContainer(cont)
  })

  // Créer les styles unitaires
  node_unitary_styles.forEach(style_id =>
    new_drawing_area.sankey.create_internal_style(style_id, elementStyleConfigs)
  )

  // Récupérer les tags de type de nœud existants
  const node_type = new_drawing_area.sankey.node_taggs_dict['type de noeud']
  const echangeTag = node_type?.tags_dict['echange']
  const productTag = node_type?.tags_dict['produit']
  const sectorTag = node_type?.tags_dict['secteur']

  // Filtrer les nœuds par type
  const products_nodes = new_drawing_area.sankey.nodes_list.filter(n => n.hasGivenTag(productTag))
  const sector_nodes = new_drawing_area.sankey.nodes_list.filter(n => n.hasGivenTag(sectorTag))
  const exchange_nodes = new_drawing_area.sankey.nodes_list.filter(n => n.hasGivenTag(echangeTag))
  exchange_nodes.forEach(n => {
    node_exchanges_style.forEach(s => {
      n.removeStyleById(s)
      n.links_order.forEach(l => l.removeStyleById(s))
    })
    n.removeTag(echangeTag)
    n.addTag(sectorTag)
  })
  const other_nodes = new_drawing_area.sankey.nodes_list.filter(n =>
    !n.hasGivenTag(echangeTag) &&
    !n.hasGivenTag(productTag) &&
    !n.hasGivenTag(sectorTag)
  )

  // Créer les ViewTagGroup et établir les relations
  let unitary_tags_groups: Class_ViewTagGroup[] = []

  if (node_type && (sectorTag || productTag)) {
    // Cas avec distinction secteurs/produits
    const sector_unitary_tag_group = new_drawing_area.sankey.addViewTagGroup(
      'sector_unitary',
      'Sankey Unitaire Secteurs'
    )
    unitary_tags_groups.push(sector_unitary_tag_group)

    const product_unitary_tag_group = new_drawing_area.sankey.addViewTagGroup(
      'product_unitary',
      'Sankey Unitaire Produits'
    )
    unitary_tags_groups.push(product_unitary_tag_group)

    // Établir la relation de sibling entre les deux groupes
    sector_unitary_tag_group.addSibling(product_unitary_tag_group)

    // Déterminer quel groupe activer selon le node_ref
    let activate_sectors = true
    if (node_ref) {
      if (new_drawing_area.sankey.nodes_dict[node_ref.id].hasGivenTag(productTag)) {
        activate_sectors = false
      } else if (new_drawing_area.sankey.nodes_dict[node_ref.id].hasGivenTag(sectorTag)) {
        activate_sectors = true
      }
    }

    // Activer/désactiver les groupes
    sector_unitary_tag_group.activated = activate_sectors
    product_unitary_tag_group.activated = !activate_sectors

    // Ajouter les tags pour les secteurs
    sector_nodes.forEach(n => {
      const tag = sector_unitary_tag_group.addTag(n.name)
      n.addTag(tag as Class_Tag)
      // Si on crée une vue focalisée, seul le tag du node_ref est sélectionné
      // Si on crée un board, le premier tag est sélectionné par défaut
      if (node_ref) {
        tag.is_selected = n.id === node_ref.id
      } else {
        tag.is_selected = false
      }
    })

    // Ajouter les tags pour les produits
    products_nodes.forEach(n => {
      const tag = product_unitary_tag_group.addTag(n.name)
      n.addTag(tag as Class_Tag)
      if (node_ref) {
        tag.is_selected = n.id === node_ref.id
      } else {
        tag.is_selected = false
      }
    })

    // S'assurer qu'au moins un tag est sélectionné dans le groupe actif
    const active_group = activate_sectors ? sector_unitary_tag_group : product_unitary_tag_group
    if (active_group.selected_tags_list.length === 0 && active_group.tags_list.length > 0) {
      active_group.tags_list[0].is_selected = true
    }

  } else {
    // Cas simple : un seul groupe pour tous les nœuds
    const unitary_tag_group = new_drawing_area.sankey.addViewTagGroup(
      'unitary',
      'Sankey Unitaire'
    )
    unitary_tags_groups.push(unitary_tag_group)
    unitary_tag_group.activated = true

    // Ajouter les tags pour tous les nœuds (hors échange)
    other_nodes.forEach(n => {
      const tag = unitary_tag_group.addTag(n.name)
      n.addTag(tag as Class_Tag)
      if (node_ref) {
        tag.is_selected = n.id === node_ref.id
      } else {
        tag.is_selected = false
      }
    })

    // S'assurer qu'au moins un tag est sélectionné
    if (unitary_tag_group.selected_tags_list.length === 0 && unitary_tag_group.tags_list.length > 0) {
      unitary_tag_group.tags_list[0].is_selected = true
    }
  }

  // Configurer tous les groupes avec banner 'one'
  unitary_tags_groups.forEach(tagGroup => {
    tagGroup.banner = 'one'
  })

  // Configuration commune
  new_drawing_area.removeMinimumLinkThickness()
  new_drawing_area.removeMaximumLinkThickness()
  new_drawing_area.filter_label = 0
  new_drawing_area.filter_link_value = 0

  // Appliquer les styles unitaires
  updateUnitaryStyles(new_drawing_area)

  // Dessiner et centrer
  new_drawing_area.draw()
  new_drawing_area.to_recenter = true
  new_drawing_area.recenter()
  new_drawing_area.unDraw()

  // Sauvegarder la vue
  app_data.views_dict[new_drawing_area.id] = {
    'name': new_drawing_area.name,
    'json': compressJSONToGzip(DrawingAreaPersistenceOSP.toJSON(new_drawing_area))
  }
  app_data.heredited_attr[new_drawing_area.id] = {}
  app_data.pushViewIdInViewOrder(new_drawing_area.id)

  return new_drawing_area
}

/**
 * Crée une vue unitaire focalisée sur un nœud spécifique
 * @param app_data - L'application data
 * @param node_ref - Le nœud de référence
 */
export const createUnitaryNewView = (
  app_data: Class_ApplicationDataOSP,
  node_ref: Class_NodeElement
) => {
  return createUnitaryView(app_data, node_ref)
}