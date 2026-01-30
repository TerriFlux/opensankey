import {
    node_unitary_styles, SankeyUnitaryNodeStyle, SankeyUnitaryNodeInputStyle, SankeyUnitaryNodeOutputStyle,
    LinkOutUnitaryStyle, LinkInUnitaryStyle
} from "../Elements/ElementStyle"
import { Class_DrawingArea } from "../types/DrawingArea"

// Fonction utilitaire pour gérer les styles unitaires dynamiquement
export const updateUnitaryStyles = (drawing_area: Class_DrawingArea) => {
    drawing_area.bypass_redraws = true
    drawing_area.legend.position_x = 50
    drawing_area.legend.position_y = 500
    drawing_area.legend.stick_to_drawing = false
    const center_nodes = drawing_area.sankey.visible_nodes_list
        .filter(node => node.tags_dict['unitary']?.is_selected)

    if (center_nodes.length === 0) return

    // Réinitialiser tous les styles unitaires d'abord
    drawing_area.sankey.visible_nodes_list.forEach(node => {
        node_unitary_styles.forEach(s => node.removeStyleById(s))
    })
    drawing_area.sankey.visible_links_list.forEach(link => {
        node_unitary_styles.forEach(s => link.removeStyleById(s))
    })

    // Appliquer le style central aux nœuds sélectionnés
    center_nodes.forEach(n => {
        n.addStyle(drawing_area.sankey.styles_dict[SankeyUnitaryNodeStyle])
        n.resetAttributes()
    })

    // Créer un Set pour une recherche plus rapide
    const centerNodeIds = new Set(center_nodes.map(n => n.id))

    // Appliquer les styles aux autres nœuds
    drawing_area.sankey.visible_nodes_list
        .forEach(node => {
            if (centerNodeIds.has(node.id)) return

            const visibleInputLinks = node.input_links_list.filter(l => l.is_visible)
            const visibleOutputLinks = node.output_links_list.filter(l => l.is_visible)

            if (visibleInputLinks.length === 0) {
                node.addStyle(drawing_area.sankey.styles_dict[SankeyUnitaryNodeInputStyle])
            } else if (visibleOutputLinks.length === 0) {
                node.addStyle(drawing_area.sankey.styles_dict[SankeyUnitaryNodeOutputStyle])
            }
            node.resetAttributes()
        })

    // Styler les liens
    center_nodes.forEach(n => {
        n.output_links_list.filter(l => l.is_visible).forEach(l => {
            l.addStyle(drawing_area.sankey.styles_dict[LinkOutUnitaryStyle])
            l.resetAttributes()
        })
        n.input_links_list.filter(l => l.is_visible).forEach(l => {
            l.addStyle(drawing_area.sankey.styles_dict[LinkInUnitaryStyle])
            l.resetAttributes()
        })
    })

    let max_value = 0
    center_nodes.forEach(n => max_value = Math.max(max_value, n.data_value))
    //let scale = app_data.drawing_area.sankey.nodes_dict[center_node.id].data_value
    drawing_area.scale = max_value / 3
    drawing_area.nodePositioning.computeAutoSankey(false, true)
    drawing_area.sankey.visible_nodes_list
        .forEach(node => {
            node.resetAttributes()
        })
    center_nodes.forEach(n => n.reorganizeIOLinks())
    drawing_area.sankey.default_style.shape_position_type = 'parametric'
    drawing_area.sankey.nodes_list
        .forEach(node => { node.position_v = -1 })

    drawing_area.nodePositioning.computeParametrization(true)
}