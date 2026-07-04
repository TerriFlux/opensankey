import {
  SankeyUnitaryNodeStyle, SankeyUnitaryNodeInputStyle, SankeyUnitaryNodeOutputStyle,
  LinkOutUnitaryStyle, LinkInUnitaryStyle
} from '../Elements/ElementStyle'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_DataTagGroup, Class_ViewTagGroup } from '../types/TagGroup'

// Fonction utilitaire pour gérer les styles unitaires dynamiquement
export const updateUnitaryStyles = (drawing_area: Class_DrawingArea) => {
  const center_nodes = drawing_area.sankey.visible_nodes_list
    .filter(node => node.tags_dict['unitary']?.is_selected ||
            (node.tags_dict['product_unitary']?.group as Class_ViewTagGroup)?.activated && node.tags_dict['product_unitary']?.is_selected ||
            (node.tags_dict['sector_unitary']?.group as Class_ViewTagGroup)?.activated && node.tags_dict['sector_unitary']?.is_selected)

  // IMPORTANT : ne poser bypass_redraws qu'APRÈS ce garde. Sinon, pour un view tag
  // GÉNÉRIQUE (pas de nœud central unitaire), on return early en laissant
  // bypass_redraws=true → tous les draw()/recenter() suivants deviennent no-op
  // (positions calculées mais pas rendues : « il faut re-sélectionner pour voir »).
  if (center_nodes.length === 0) return
  drawing_area.bypass_redraws = true

  // Mémoriser le nœud central : areaAutoFit (scopé is_unitary) cale ce nœud au centre
  // de la fenêtre plutôt que la bbox, pour qu'il reste au même endroit d'un focus à
  // l'autre (l'étoile est asymétrique → centrer la bbox ferait sauter le central).
  drawing_area.unitary_center_node_id = center_nodes[0].id

  // Le repositionnement de la légende fait partie du layout du board unitaire :
  // on ne le fait QUE quand des nœuds unitaires sont actifs. Le faire avant ce
  // garde écrasait la position de la légende sur tout diagramme normal à chaque
  // appel (ex. changement de niveau d'agrégation), la collant à gauche.
  drawing_area.legend.position_x = 50
  drawing_area.legend.position_y = 250
  drawing_area.legend.stick_to_drawing = false
  const node_type = drawing_area.sankey.node_taggs_dict['type de noeud']
  const productTag = node_type?.tags_dict['produit']
  const _sectorTag = node_type?.tags_dict['secteur']

  // Repartir d'une feuille blanche : retirer TOUS les styles assignés (styles
  // unitaires/exchange/product d'un précédent passage, mais AUSSI les styles
  // custom de l'utilisateur) pour ne garder que le style de base (index 0).
  // Sinon les attributs label/valeur d'un style custom assigné fuient et le
  // board unitaire n'affiche pas une mise en forme homogène. resetAttributes()
  // (plus bas) ne nettoie que les overrides locaux, pas les styles assignés.
  drawing_area.sankey.nodes_list.forEach(node => node.removeAllStyles())
  drawing_area.sankey.links_list.forEach(link => link.removeAllStyles())

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
    // Échelle par data tag = max de la valeur des nœuds centraux SOUS ce tag (data_value
    // dépend du tag sélectionné). On garde l'invariant « un seul tag sélectionné » en
    // (dé)sélectionnant au fil de l'itération — O(T) au lieu de l'ancienne double boucle
    // O(T²) (qui ré-désélectionnait tous les tags à chaque itération).
    unit_taggs[0].tags_list.forEach(tag2 => tag2.setUnSelected())
    unit_taggs[0].tags_list.forEach(tag => {
      tag.setSelected()
      let linksMaxValue = 0
      center_nodes.forEach(n => linksMaxValue = Math.max(linksMaxValue, n.data_value))
      tag.scale = (linksMaxValue + 1) / 1.5
      tag.setUnSelected()
    })
    selectedTag.setSelected()
  } else {
    let max_value = 0
    center_nodes.forEach(n => max_value = Math.max(max_value, n.data_value))
    drawing_area.scale = max_value / 1.5
  }
  // Appliquer formes et marges AVANT computeAutoSankey : elles modifient la HAUTEUR
  // des nœuds (capsule vs rect + marges), dont dépendent le placement vertical
  // symétrique et l'ordre des flux E/S. Si on les changeait après, les positions
  // seraient calculées sur les hauteurs par défaut puis devenaient incohérentes
  // (symptôme : croisements à la création, corrigés en relançant computeAutoSankey).
  drawing_area.sankey.nodes_list
    .forEach(n => {
      n.resetAttributes()
      // Neutraliser toute représentation de STOCK : un nœud à stock (ex. « Bois sur
      // pied ») a sa hauteur pilotée par le stock (use_stock_for_height) et/ou affiche
      // une forme de stock — il sortait alors à une taille différente des autres
      // centraux dans le board unitaire (où la taille doit être homogène, pilotée par
      // les flux). Ce sont des champs directs du nœud (ni style, ni remis par
      // resetAttributes) → on les force ici.
      n.use_stock_for_height = false
      n.stock_shape_is_visible = false
      if (n.hasGivenTag(productTag)) {
        n.shape_type = 'capsule'
      } else {
        n.shape_type = 'rect'
        n.shape_margin_top = 20
        n.shape_margin_bottom = 20
      }
    })
  // Reproduire le pipeline du bouton « disposition auto » (computeAutoSankeyWithToast),
  // qui sort un résultat centré et sans croisement — sans le toast ni l'undo :
  //   1. computeAutoSankey (positions) avec les espacements par défaut
  //   2. computeParametrization (recalcule colonnes/centrage vertical)
  //   3. reorganizeIOLinks sur TOUS les nœuds (ordre des flux E/S cohérent)
  // L'ancien code se limitait à computeAutoSankey + reorganize du seul nœud central,
  // d'où les croisements et le défaut de centrage à la création (corrigés dès qu'on
  // relançait la disposition auto).
  // Espacements par défaut du style (NE PAS utiliser app_data.layout_v/h_spacing : ce
  // réglage est dimensionné pour le GRAND diagramme principal et donne des écarts
  // énormes sur le board unitaire compact). NB : le board est forcé en 'free'
  // (cf. buildUnitaryDrawingArea) — sinon le mode papier hérité du source remplit la
  // hauteur de la page et ces espacements sont ignorés.
  const default_dx = drawing_area.sankey.styles_dict['default'].shape_position_dx ?? 0
  const default_dy = drawing_area.sankey.styles_dict['default'].shape_position_dy ?? 0
  drawing_area.nodePositioning.computeAutoSankey(false, true, default_dx, default_dy)
  //drawing_area.nodePositioning.computeParametrization(true)
  drawing_area.sankey.visible_nodes_list.forEach(n => n.reorganizeIOLinks())
  // Rester en mode 'absolute' : les positions x/y calculées ci-dessus sont respectées
  // telles quelles au rendu. L'ancien mode 'parametric' rappelait
  // recomputeParametricLayout à chaque redraw, ré-empilant chaque colonne par le haut
  // → la symétrie était perdue.
  drawing_area.sankey.default_style.shape_position_type = 'absolute'
  // Commit le coin courant (positions de computeAutoSankey) comme nouveau centre de
  // vérité. Sans ça, le cache _center_x/_center_y hérité de l'état précédent reste
  // obsolète : au 1er draw, anchorByCenterIfResized voit la taille changée (capsule/
  // marges/échelle) et exécute applyCenterToCorner → les nœuds sautent à leur ancien
  // centre, écrasant la disposition symétrique. C'est exactement ce que fait le
  // else-branch de DrawingArea.setAbsoluteMode().
  drawing_area.sankey.nodes_list.forEach(n => n.settleCenterAnchor())
}