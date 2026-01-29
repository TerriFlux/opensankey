import { elementStyleConfigs, node_unitary_styles } from "../deps/OpenSankey/Elements/ElementStyle"
import { Class_NodeElement } from "../deps/OpenSankey/Elements/Node"
import { DrawingAreaPersistence } from "../deps/OpenSankey/Persistence/SankeyPersistence"
import { compressJSONToGzip } from "../deps/OpenSankey/Persistence/UniversalJSONCompression"
import { Class_Tag } from "../deps/OpenSankey/types/Tag"
import { makeId } from "../deps/OpenSankey/types/Utils"
import { Class_ApplicationDataOSP } from "../types/ApplicationDataOSP"

export const createUnitaryBoard = (app_data: Class_ApplicationDataOSP) => {
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
    const name = 'Board Unitary View'
    const id = new_drawing_area.id
    const copy = DrawingAreaPersistence.toJSON(base_drawing_area, { keep_siblings: true })
    copy.id = id
    DrawingAreaPersistence.fromJSON(new_drawing_area, copy)
    new_drawing_area.name = name

    new_drawing_area.sankey.containers_list.forEach(cont => {
        new_drawing_area.deleteContainer(cont)
    })
    node_unitary_styles.forEach(style_id => new_drawing_area.sankey.create_internal_style(style_id, elementStyleConfigs))
    const unitary_tag_group = new_drawing_area.sankey.addNodeTagGroup('unitary','Sankey Unitaire',false)
    unitary_tag_group.banner = 'unitary'
    const echangeTag = new_drawing_area.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    const other_nodes = new_drawing_area.sankey.nodes_list.filter(n => !n.hasGivenTag(echangeTag))
    other_nodes.forEach(n => {
        const tag = unitary_tag_group.addTag(n.name)
        n.addTag(tag as Class_Tag)
        tag.is_selected = false
    })
    new_drawing_area.legend.setInvisible()
    app_data.views_dict[new_drawing_area.id] = {
        'name': new_drawing_area.name,
        'json': compressJSONToGzip(DrawingAreaPersistence.toJSON(new_drawing_area))
    }
    app_data.pushViewIdInViewOrder(new_drawing_area.id)
    return new_drawing_area

}