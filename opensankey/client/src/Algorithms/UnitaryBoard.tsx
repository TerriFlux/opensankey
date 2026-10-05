import {
  SankeyUnitaryNodeStyle, SankeyUnitaryNodeInputStyle, SankeyUnitaryNodeOutputStyle,
  LinkOutUnitaryStyle, LinkInUnitaryStyle
} from '../Elements/ElementStyle'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_DataTagGroup } from '../types/TagGroup'
import { getNameLabelValues } from '../Elements/ElementsAttributesConfig'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_Sankey } from '../types/Sankey'

/**
 * os#1422 — CE FICHIER DIT DEUX CHOSES, ET ELLES SONT MAINTENANT NOMMÉES.
 *
 * `applyUnitaryBoardStyles` pose l'HABILLAGE du board unitaire (styles centre /
 * entrée / sortie / flux, capsules, marges, neutralisation du stock) ;
 * `layoutUnitaryBoard` pose sa DISPOSITION (légende, échelle, disposition auto,
 * ordre des flux E/S, mode absolu, ancre). `updateUnitaryStyles` appelle les deux
 * dans cet ordre et reste le point d'entrée du board : son appelant
 * (`opensankey-plus/components/UnitaryBoard.tsx`, `buildUnitaryDrawingArea`) ne
 * voit aucune différence.
 *
 * POURQUOI LES SÉPARER : l'ÉTOILE VIVANTE (os#1422, `Representations/star/`) veut
 * les deux moitiés, mais pas dans les mêmes conditions que le board — le board
 * REPART D'USINE (`resetBaseStylesToFactory`), l'étoile PART DU DIAGRAMME (son
 * style par défaut est une copie de celui du diagramme). Elle a donc son propre
 * enchaînement, qui sème d'abord puis habille : cf. `buildStarDocument`.
 */

/**
 * Le nœud central d'un board unitaire, ou `undefined` s'il n'y en a pas.
 *
 * os#1382 (U5) — LE CENTRE EST DÉSORMAIS DONNÉ, plus deviné. Auparavant on le
 * dérivait des view tags `unitary` / `product_unitary` / `sector_unitary` que le
 * board créait sur le diagramme copié ; l'aperçu unitaire est maintenant rendu
 * depuis une BRIQUE extraite (`Algorithms/UnitaryExtraction.ts`), qui porte son
 * centre dans sa section racine `process`. Deux sources, dans cet ordre :
 *   1. `center_node_id`, quand l'appelant sait de quel nœud il parle ;
 *   2. `drawing_area.sankey.unitary_process.central_node_id`, posé par l'extraction.
 * Sans ni l'un ni l'autre — ou si l'id ne désigne aucun nœud — il n'y a pas de board.
 */
export const resolveUnitaryCenterNode = (
  drawing_area: Class_DrawingArea,
  center_node_id?: string
): Class_NodeElement | undefined => {
  const resolved_center_id = center_node_id ?? drawing_area.sankey.unitary_process?.central_node_id
  return resolved_center_id !== undefined
    ? drawing_area.sankey.nodes_dict[resolved_center_id]
    : undefined
}

/**
 * Pose styles, échelle et disposition du board unitaire autour d'UN nœud central.
 */
export const updateUnitaryStyles = (drawing_area: Class_DrawingArea, center_node_id?: string) => {
  const center_node = resolveUnitaryCenterNode(drawing_area, center_node_id)

  // IMPORTANT : ne poser bypass_redraws qu'APRÈS ce garde. Sinon, pour un diagramme
  // sans nœud central unitaire, on return early en laissant bypass_redraws=true →
  // tous les draw()/recenter() suivants deviennent no-op (positions calculées mais
  // pas rendues : « il faut re-sélectionner pour voir »).
  if (center_node === undefined) return
  drawing_area.bypass_redraws = true

  applyUnitaryBoardStyles(drawing_area, center_node)
  layoutUnitaryBoard(drawing_area, center_node)
}

/**
 * MOITIÉ HABILLAGE — les styles unitaires posés sur les éléments du board.
 *
 * L'ÉTOILE VIVANTE L'APPELLE AUSSI (os#1422, retour de Julien du 18/09 : « ils n'ont
 * pas leur style de sankey unitaire »). La demande « construit initialement avec le
 * style par défaut de ce diagramme » disait d'où l'étoile PART, pas qu'elle renonce à
 * ressembler à un tableau unitaire : le SEMIS est le style par défaut du diagramme
 * (copié sur celui de l'étoile, cf. `buildStarDocument`), et les styles unitaires ne
 * surchargent par-dessus que ce qui fait un tableau unitaire. Comme un style interne
 * n'est PAS pré-rempli (`create_internal_style` → `createNewElementStyle(..., true)`),
 * tout ce qu'il ne déclare pas retombe mécaniquement sur ce semis.
 *
 * `tags_sankey` — OÙ LIRE LE GROUPE D'ÉTIQUETTES « type de noeud ». Le board unitaire
 * travaille sur un clone JSON du diagramme, qui porte donc ses propres étiquettes :
 * son défaut (`drawing_area.sankey`) est juste. L'ÉTOILE, elle, n'a aucune étiquette à
 * elle — ses nœuds délèguent `hasGivenTag` à leur sujet (règle 3 du contrat du lot 6) —
 * et doit donc désigner le sankey SOURCE, sans quoi `productTag` serait `undefined` et
 * aucun produit n'aurait sa capsule.
 */
export const applyUnitaryBoardStyles = (
  drawing_area: Class_DrawingArea,
  center_node: Class_NodeElement,
  tags_sankey: Class_Sankey = drawing_area.sankey
) => {
  const center_nodes = [center_node]
  const node_type = tags_sankey.node_taggs_dict['type de noeud']
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
}

/**
 * MOITIÉ DISPOSITION — légende, échelle, disposition auto, ordre des flux E/S,
 * mode absolu, ancre. TOUJOURS APPELÉE APRÈS L'HABILLAGE, par le board comme par
 * l'étoile : elle lit les espacements sur `SankeyUnitaryNodeInputStyle` (cf. plus
 * bas), qui n'existe qu'une fois les styles unitaires créés.
 *
 * L'échelle était calculée AVANT les formes et les marges dans l'ancienne fonction
 * unique ; elle est ici calculée après. C'est sans effet : `data_value` est une
 * somme de valeurs de flux, elle ne lit ni la forme, ni les marges, ni le stock.
 */
export const layoutUnitaryBoard = (
  drawing_area: Class_DrawingArea,
  center_node: Class_NodeElement
) => {
  const center_nodes = [center_node]

  // Mémoriser le nœud central : areaAutoFit (scopé is_unitary) cale ce nœud au centre
  // de la fenêtre plutôt que la bbox, pour qu'il reste au même endroit d'un focus à
  // l'autre (l'étoile est asymétrique → centrer la bbox ferait sauter le central).
  drawing_area.unitary_center_node_id = center_nodes[0].id

  // Le repositionnement de la légende fait partie du layout du board unitaire :
  // on ne le fait QUE quand des nœuds unitaires sont actifs. Le faire avant le
  // garde du centre écrasait la position de la légende sur tout diagramme normal à
  // chaque appel (ex. changement de niveau d'agrégation), la collant à gauche.
  drawing_area.legend.position_x = 50
  drawing_area.legend.position_y = 250
  drawing_area.legend.stick_to_drawing = false

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
  // Reproduire le pipeline du bouton « disposition auto » (computeAutoSankeyWithToast),
  // qui sort un résultat centré et sans croisement — sans le toast ni l'undo :
  //   1. computeAutoSankey (positions) avec les espacements par défaut
  //   2. computeParametrization (recalcule colonnes/centrage vertical)
  //   3. reorganizeIOLinks sur TOUS les nœuds (ordre des flux E/S cohérent)
  // L'ancien code se limitait à computeAutoSankey + reorganize du seul nœud central,
  // d'où les croisements et le défaut de centrage à la création (corrigés dès qu'on
  // relançait la disposition auto).
  // ESPACEMENTS : CEUX DES STYLES UNITAIRES, et pas ceux du style `default`.
  //
  // Les styles qu'on vient d'appliquer portent la disposition voulue pour l'étoile :
  // `shape_position_dx: 250`, `shape_position_dy: 25` (SankeyUnitaryNode{,Input,Output}
  // Style, cf. Elements/ElementStyle). Le style `default` remis à l'usine, lui, ne
  // déclare aucun de ces deux attributs et retombe sur les valeurs de la classe de
  // style, dont un pas vertical de 50 — soit le DOUBLE de l'espacement unitaire. Le
  // passer ici, ce que faisait ce code, étirait donc l'étoile en hauteur jusqu'à lui
  // faire remplir la page, au lieu de l'aperçu compact voulu. Le style unitaire
  // existait bien ; il n'était simplement jamais consulté pour la disposition.
  // (Mesuré par le test « espace les entrees avec le style unitaire » :
  // unitaryExtraction.test.ts rendait 50 au lieu de 25 sur deux entrées empilées.)
  //
  // Pourquoi les passer EXPLICITEMENT plutôt que de ne rien passer ? Parce que les deux
  // axes ne retombent pas sur la même chose quand l'argument manque
  // (NodePositioningAutoSankey, computeNodesPositions) :
  //     horizontal : `h_spacing ?? nodes_dict[…].shape_position_dx`  → le STYLE du nœud
  //     vertical   : `v_spacing ?? styles_dict['default'].shape_position_dy` → 50
  // Le vertical ignore le style de l'élément. Tant que cette asymétrie est là, c'est à
  // l'appelant de dire ce qu'il veut, sur les deux axes.
  //
  // NE PAS revenir à `app_data.layout_v/h_spacing` : ce réglage est dimensionné pour le
  // GRAND diagramme principal. NB : le board est forcé en 'free' (buildUnitaryDrawingArea),
  // sinon le mode papier hérité du source remplirait la hauteur de la page et tout
  // espacement serait ignoré.
  const unitary_style = drawing_area.sankey.styles_dict[SankeyUnitaryNodeInputStyle]
  const default_style = drawing_area.sankey.styles_dict['default']
  const unitary_dx = unitary_style?.shape_position_dx ?? default_style.shape_position_dx ?? 0
  const unitary_dy = unitary_style?.shape_position_dy ?? default_style.shape_position_dy ?? 0
  drawing_area.nodePositioning.computeAutoSankey(false, true, unitary_dx, unitary_dy)
  //drawing_area.nodePositioning.computeParametrization(true)
  // sa#602 — AVANT l'ordre des flux E/S : il lit les positions, et l'écartement ne change pas
  // l'ordre des nœuds dans une colonne.
  spreadUnitaryLabels(drawing_area, center_node, unitary_dy)
  drawing_area.reorganizeIOLinksOf(drawing_area.sankey.visible_nodes_list)
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
/**
 * sa#602 — L'ÉCART LAISSÉ ENTRE DEUX ENCOMBREMENTS VOISINS, en fraction de la police la plus
 * grande des deux. Un quart de ligne : c'est à peu près ce que la disposition laisse déjà entre
 * deux libellés d'une ligne au bout de flux minces (pas vertical de 25 pour une police de 20),
 * donc une étoile dont aucun libellé ne passe à la ligne n'est pas touchée.
 */
const UNITARY_LABEL_GAP_RATIO = 0.25

/**
 * sa#602 — L'ENCOMBREMENT VERTICAL D'UNE EXTRÉMITÉ, relatif au haut de sa forme : la forme
 * elle-même, son libellé, et le libellé de valeur (le pourcentage) des flux qui la relient au
 * centre. `font` est la plus grande police en jeu, qui règle l'écart avec le voisin.
 *
 * La hauteur du libellé est celle que le dessin lui donnera : `getRequiredLabelHeight` compte les
 * lignes du repli dans la largeur de boîte (d3-textwrap avance d'`1em` par ligne), sans DOM — ce
 * qui compte ici, puisque l'étoile se dispose hors écran, avant tout dessin. Sa position suit
 * `NodeDrawLabelBase.getLabelPos`.
 */
const unitaryFootprintOf = (
  node: Class_NodeElement,
  center_node: Class_NodeElement,
  font_compensation: number
): { lo: number, hi: number, font: number } => {
  const h = node.getShapeHeightToUse()
  let lo = 0
  let hi = h
  let font = 0
  const label_h = node.name_label_drawer.getRequiredLabelHeight()
  // Position absolue : le libellé n'est plus attaché à son nœud, il ne réserve rien autour de lui.
  if (label_h > 0 && !getNameLabelValues(node, 'name_label').position_absolute) {
    font = node.name_label_font_size * font_compensation
    const shift = node.name_label_vert_shift ?? 0
    const capsule = node.shape_type === 'capsule'
    const margin_top = capsule ? node.getShapeWidthToUse() / 2 : node.shape_margin_top
    const margin_bottom = capsule ? node.getShapeWidthToUse() / 2 : node.shape_margin_bottom
    let top: number
    if (node.name_label_vert === 'top') {
      top = node.name_label_inside_vert ? shift : -margin_top + shift - label_h
    } else if (node.name_label_vert === 'bottom') {
      top = node.name_label_inside_vert ? h + shift - label_h : h + margin_bottom + shift
    } else {
      top = h / 2 + shift - label_h / 2
    }
    lo = Math.min(lo, top)
    hi = Math.max(hi, top + label_h)
  }
  // Le pourcentage est posé au bout du flux, centré sur lui : au milieu de l'extrémité.
  const links = [...node.input_links_list, ...node.output_links_list]
    .filter(l => (l.source === center_node || l.target === center_node) && l.value_label_is_visible)
  links.forEach(l => {
    const value_h = l.value_label_font_size * font_compensation
    font = Math.max(font, value_h)
    lo = Math.min(lo, h / 2 - value_h / 2)
    hi = Math.max(hi, h / 2 + value_h / 2)
  })
  return { lo, hi, font }
}

/**
 * sa#602 — AUCUN LIBELLÉ D'EXTRÉMITÉ NE RECOUVRE SON VOISIN.
 *
 * Le grief : sur une étoile chargée (Vinification, 9 sorties), un libellé long passe sur deux ou
 * trois lignes, et sa hauteur dépasse l'écart entre deux flux fins — « Pertes de fermentation
 * (CO2) » recouvrait ses deux voisins. La disposition auto empile les FORMES avec un pas fixe et
 * ne connaît pas les libellés.
 *
 * On RÉSERVE donc à chaque extrémité la hauteur qu'elle occupe vraiment (cf. `unitaryFootprintOf`),
 * colonne par colonne, de haut en bas : un nœud garde l'écart que la disposition lui donnait avec
 * son prédécesseur et ne descend que si leurs encombrements se touchent. Le décalage s'ajoute à
 * celui des nœuds du dessous, si bien que l'ORDRE ne change pas et que le libellé reste en face de
 * son flux (pas de trait de rappel à dessiner). La colonne écartée est ensuite recentrée sur son
 * ancien milieu, pour que l'étoile reste symétrique autour du centre. Une colonne où rien ne se
 * touche n'est pas modifiée du tout.
 *
 * Ni la largeur des libellés ni leur police ne changent : ce sont des réglages de figure que
 * l'auteur peut vouloir, on ne les force pas.
 */
export const spreadUnitaryLabels = (
  drawing_area: Class_DrawingArea,
  center_node: Class_NodeElement,
  v_spacing: number
): void => {
  const font_compensation = drawing_area.font_compensation
  const columns = new Map<number, Class_NodeElement[]>()
  const visible_nodes = drawing_area.sankey.visible_nodes_list
  visible_nodes.forEach(node => {
    if (node === center_node) return
    const column = columns.get(node.position_x) ?? []
    column.push(node)
    columns.set(node.position_x, column)
  })

  let moved = false
  columns.forEach(column => {
    column.sort((a, b) => a.position_y - b.position_y)
    let offset = 0
    let prev_bottom: number | null = null
    let prev_font = 0
    const tops = column.map(node => {
      const { lo, hi, font } = unitaryFootprintOf(node, center_node, font_compensation)
      let top = node.position_y + offset
      if (prev_bottom !== null) {
        const needed = prev_bottom + UNITARY_LABEL_GAP_RATIO * Math.max(prev_font, font) - lo
        if (top < needed) {
          offset += needed - top
          top = needed
        }
      }
      prev_bottom = top + hi
      prev_font = font
      return top
    })
    if (offset === 0) return
    moved = true
    column.forEach((node, i) => { node.position_y = tops[i] - offset / 2 })
  })
  if (!moved) return

  // Recentrer peut faire passer le haut d'une colonne au-dessus de zéro : on redescend tout le
  // dessin d'un bloc (centre compris, l'étoile ne se déforme pas), et la zone suit en hauteur.
  const min_top = Math.min(...visible_nodes.map(n => n.position_y))
  if (min_top < v_spacing) visible_nodes.forEach(n => { n.position_y += v_spacing - min_top })
  const max_bottom = Math.max(...visible_nodes.map(n => n.position_y + n.getShapeHeightToUse()))
  if (drawing_area.height < max_bottom + v_spacing) drawing_area.height = max_bottom + v_spacing
}
