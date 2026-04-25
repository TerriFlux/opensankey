import {
  node_unitary_styles, SankeyUnitaryNodeStyle, SankeyUnitaryNodeInputStyle, SankeyUnitaryNodeOutputStyle,
  LinkOutUnitaryStyle, LinkInUnitaryStyle,
  node_exchanges_style,
  product_sector_styles
} from '../Elements/ElementStyle'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_DataTagGroup, Class_ViewTagGroup } from '../types/TagGroup'

// Fonction utilitaire pour gérer les styles unitaires dynamiquement
export const updateUnitaryStyles = (drawing_area: Class_DrawingArea) => {
  drawing_area.bypass_redraws = true
  drawing_area.legend.position_x = 50
  drawing_area.legend.position_y = 250
  drawing_area.legend.stick_to_drawing = false
  const center_nodes = drawing_area.sankey.visible_nodes_list
    .filter(node => node.tags_dict['unitary']?.is_selected ||
            (node.tags_dict['product_unitary']?.group as Class_ViewTagGroup)?.activated && node.tags_dict['product_unitary']?.is_selected ||
            (node.tags_dict['sector_unitary']?.group as Class_ViewTagGroup)?.activated && node.tags_dict['sector_unitary']?.is_selected)


  if (center_nodes.length === 0) return
  const node_type = drawing_area.sankey.node_taggs_dict['type de noeud']
  const productTag = node_type?.tags_dict['produit']
  const sectorTag = node_type?.tags_dict['secteur']

  // Réinitialiser tous les styles unitaires d'abord
  drawing_area.sankey.nodes_list.forEach(node => {
    node_unitary_styles.forEach(s => node.removeStyleById(s))
    node_exchanges_style.forEach(s => node.removeStyleById(s))
    product_sector_styles.forEach(s => node.removeStyleById(s))
  })
  drawing_area.sankey.links_list.forEach(link => {
    node_unitary_styles.forEach(s => link.removeStyleById(s))
    node_exchanges_style.forEach(s => link.removeStyleById(s))
    product_sector_styles.forEach(s => link.removeStyleById(s))
  })

  // Appliquer le style central aux nœuds sélectionnés
  center_nodes.forEach(n => {
    n.addStyle(drawing_area.sankey.styles_dict[SankeyUnitaryNodeStyle])
    n.resetAttributes()
  })

  // Créer un Set pour une recherche plus rapide
  const centerNodeIds = new Set(center_nodes.map(n => n.id))

  // Appliquer les styles aux autres nœuds
  drawing_area.sankey.nodes_list
    .forEach(node => {
      if (centerNodeIds.has(node.id)) return

      const visibleInputLinks = node.input_links_list.filter(l => l.source == center_nodes[0])
      const visibleOutputLinks = node.output_links_list.filter(l => l.target == center_nodes[0])

      if (visibleInputLinks.length === 0) {
        node.addStyle(drawing_area.sankey.styles_dict[SankeyUnitaryNodeInputStyle])
      } else if (visibleOutputLinks.length === 0) {
        node.addStyle(drawing_area.sankey.styles_dict[SankeyUnitaryNodeOutputStyle])
      }
      node.resetAttributes()
    })

  // Styler les liens
  center_nodes.forEach(n => {
    n.output_links_list.forEach(l => {
      l.addStyle(drawing_area.sankey.styles_dict[LinkOutUnitaryStyle])
      l.resetAttributes()
    })
    n.input_links_list.forEach(l => {
      l.addStyle(drawing_area.sankey.styles_dict[LinkInUnitaryStyle])
      l.resetAttributes()
    })
  })

  const unit_taggs = drawing_area.sankey.getTagGroupsAsList('data_taggs').filter(tagg => tagg.is_unit) as Class_DataTagGroup[]
  if (unit_taggs.length > 0) {
    const selectedTag = unit_taggs[0].tags_list.filter(tag => tag.is_selected)[0]
    unit_taggs[0].tags_list.forEach(tag => {
      unit_taggs[0].tags_list.forEach(tag2 => tag2.setUnSelected())
      tag.setSelected()
      let linksMaxValue = 0
      center_nodes.forEach(n => linksMaxValue = Math.max(linksMaxValue, n.data_value))
      linksMaxValue += 1
      tag.scale = linksMaxValue/1.5
    })
    unit_taggs[0].tags_list.forEach(tag2 => tag2.setUnSelected())
    selectedTag.setSelected()
  } else {
    let max_value = 0
    center_nodes.forEach(n => max_value = Math.max(max_value, n.data_value))
    drawing_area.scale = max_value / 1.5
  }
  drawing_area.nodePositioning.computeAutoSankey(false, true)
  drawing_area.sankey.nodes_list
    .forEach(n => {
      n.resetAttributes()
      if (n.hasGivenTag(productTag)) {
        n.shape_type = 'capsule'
      } else {
        n.shape_type = 'rect'
        n.shape_margin_top = 20
        n.shape_margin_bottom = 20
      }
    })
  center_nodes.forEach(n => n.reorganizeIOLinks())
  drawing_area.sankey.default_style.shape_position_type = 'parametric'
  drawing_area.sankey.nodes_list
    .forEach(node => { node.position_v = -1 })

  drawing_area.nodePositioning.computeParametrization(true)
}