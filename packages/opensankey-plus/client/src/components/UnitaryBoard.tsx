import { updateUnitaryStyles } from "../deps/OpenSankey/Algorithms/UnitaryBoard"
import { elementStyleConfigs, LinkInUnitaryStyle, LinkOutUnitaryStyle, node_unitary_styles, SankeyUnitaryNodeInputStyle, SankeyUnitaryNodeOutputStyle, SankeyUnitaryNodeStyle } from "../deps/OpenSankey/Elements/ElementStyle"
import { Class_NodeElement } from "../deps/OpenSankey/Elements/Node"
import { DrawingAreaPersistence } from "../deps/OpenSankey/Persistence/SankeyPersistence"
import { compressJSONToGzip } from "../deps/OpenSankey/Persistence/UniversalJSONCompression"
import { Class_DrawingArea } from "../deps/OpenSankey/types/DrawingArea"
import { Class_Tag } from "../deps/OpenSankey/types/Tag"
import { makeId } from "../deps/OpenSankey/types/Utils"
import { Class_ApplicationDataOSP } from "../types/ApplicationDataOSP"

/**
 * Crée une vue unitaire - soit un board avec tous les nœuds, soit une vue focalisée sur un nœud spécifique
 * @param app_data - L'application data
 * @param node_ref - Le nœud de référence (optionnel). Si fourni, crée une vue focalisée sur ce nœud
 * @param is_board - Si true, crée un board avec tous les nœuds (ignoré si node_ref est fourni)
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
    const name = node_ref
        ? 'Unitary view of ' + node_ref.name
        : 'Board Unitary View'
    const id = new_drawing_area.id
    const copy = DrawingAreaPersistence.toJSON(base_drawing_area, { keep_siblings: true })
    copy.id = id
    DrawingAreaPersistence.fromJSON(new_drawing_area, copy)
    new_drawing_area.name = name

    // Supprimer les containers
    new_drawing_area.sankey.containers_list.forEach(cont => {
        new_drawing_area.deleteContainer(cont)
    })

    // Créer les styles unitaires
    node_unitary_styles.forEach(style_id =>
        new_drawing_area.sankey.create_internal_style(style_id, elementStyleConfigs)
    )

    // Créer le tag group unitaire
    const unitary_tag_group = new_drawing_area.sankey.addNodeTagGroup('unitary', 'Sankey Unitaire', false)
    unitary_tag_group.banner = 'one'

    const echangeTag = new_drawing_area.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    const other_nodes = new_drawing_area.sankey.nodes_list.filter(n => !n.hasGivenTag(echangeTag))

    // Créer un tag pour chaque nœud non-échange
    other_nodes.forEach(n => {
        const tag = unitary_tag_group.addTag(n.name)
        n.addTag(tag as Class_Tag)
        // Si on crée un board, tous les tags sont désélectionnés
        // Si on crée une vue focalisée, seul le tag du node_ref sera sélectionné
        tag.is_selected = n.id == node_ref?.id ? true : false
    })

    // Configuration commune
    new_drawing_area.removeMinimumLinkThickness()
    new_drawing_area.removeMaximumLinkThickness()
    new_drawing_area.filter_label = 0
    new_drawing_area.filter_link_value = 0

    updateUnitaryStyles(new_drawing_area)
    new_drawing_area.draw()
    new_drawing_area.to_recenter = true
    new_drawing_area.recenter()
    new_drawing_area.unDraw()
    app_data.views_dict[new_drawing_area.id] = {
        'name': new_drawing_area.name,
        'json': compressJSONToGzip(DrawingAreaPersistence.toJSON(new_drawing_area))
    }
    app_data.pushViewIdInViewOrder(new_drawing_area.id)

    return new_drawing_area
}

// Fonctions de compatibilité pour garder l'ancienne API
export const createUnitaryBoard = (app_data: Class_ApplicationDataOSP) => {
    return createUnitaryView(app_data, undefined)
}

export const createUnitaryNewView = (app_data: Class_ApplicationDataOSP, node_ref: Class_NodeElement) => {
    return createUnitaryView(app_data, node_ref)
}
