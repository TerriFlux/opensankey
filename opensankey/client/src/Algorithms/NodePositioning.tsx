// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================


import {
  Class_NodeElement
} from '../Elements/Node'
import {
  Class_LinkElement
} from '../Elements/Link'
import { Class_LevelTag } from '../types/Tag'
import { Class_DrawingArea } from '../types/DrawingArea'
import * as Geometry from './NodePositioningGeometry'
import { NodePositioningCyclesCore } from './NodePositioningCyclesCore'
import { NodePositioningReference } from './NodePositioningReference'
import { NodePositioningScaleAdapted } from './NodePositioningScaleAdapted'
import { NodePositioningAutoSankey } from './NodePositioningAutoSankey'
import { NodePositioningProportional } from './NodePositioningProportional'
import { NodePositioningParametric } from './NodePositioningParametric'
import * as StraightLinks from './NodePositioningStraightLinks'
import * as Crossings from './NodePositioningCrossings'
import * as Trade from './NodePositioningTrade'


/**
 * Class responsible for node and link positioning logic
 * Handles auto-sankey computation, parametrization, and trade arrangements
 */
export class NodePositioning {
  public readonly drawingArea: Class_DrawingArea


  // #243 c5 — Mode « echelle adaptee » extrait dans NodePositioningScaleAdapted.
  // Delegateurs : appeles par DrawingArea (drawElements), displayModes, ContextLinkConfig
  // et NodeActions.
  public captureScaleReference() { return this._scale.captureScaleReference() }

  public applyAdaptedScale() { return this._scale.applyAdaptedScale() }

  public clearScaleAdaptation() { return this._scale.clearScaleAdaptation() }

  public deriveScaleAdaptedCornersFromCenter() { return this._scale.deriveScaleAdaptedCornersFromCenter() }

  public resolveScaleAdaptedOverlaps() { return this._scale.resolveScaleAdaptedOverlaps() }


  // #1231 / #243 (split modes) — le drapeau de suppression de compression proportionnelle vit
  // desormais dans NodePositioningProportional (ecrit par NodeActions/Hierarchies autour des
  // operations structurelles). Delegateur pour compat de l'API publique.
  public get suppressProportionalCompression(): boolean { return this.proportional.suppressProportionalCompression }

  public set suppressProportionalCompression(v: boolean) { this.proportional.suppressProportionalCompression = v }

  public readonly cycles: NodePositioningCyclesCore
  // #243 c5 — Socle « element de reference » (flux ou noeud-stock), partage par le mode
  // proportionnel ET le mode echelle adaptee. Cf. NodePositioningReference.
  public readonly reference: NodePositioningReference
  private _scale: NodePositioningScaleAdapted
  private _auto: NodePositioningAutoSankey
  // #243 (split modes) — mode proportionnel (%) et mode parametrique/grille extraits.
  public readonly proportional: NodePositioningProportional
  private _parametric: NodePositioningParametric

  constructor(drawingArea: Class_DrawingArea) {
    this.drawingArea = drawingArea
    this.cycles = new NodePositioningCyclesCore(drawingArea)
    this.reference = new NodePositioningReference(drawingArea)
    this._scale = new NodePositioningScaleAdapted(this)
    this._auto = new NodePositioningAutoSankey(this)
    this.proportional = new NodePositioningProportional(this)
    this._parametric = new NodePositioningParametric(this)
  }


  // POSITIONING COMPUTATION METHODS ===================================================

  // Socle UNIQUE « cycles + index horizontal » : NodePositioningCyclesCore (#243 c8, unifié par
  // opensankey#1253). `position_x` (computeAutoSankey) et `position_u` (computeParametrization ->
  // detectAllCyclesAndOptimize) passent tous deux par `computeHorizontalIndexes`.
  // Délégateurs conservés : `computeHorizontalIndex` a un appelant EXTERNE (SankeyAnimation) ;
  // `detectAllCyclesAndOptimize` et `computeRecyclingHorizontalIndex` sont publics.
  public detectAllCyclesAndOptimize(nodes_to_process: Class_NodeElement[]): {
    recycling_links: string[],
    horizontal_indexes: { [node_id: string]: number }
  } {
    return this.cycles.detectAllCyclesAndOptimize(nodes_to_process)
  }

  public computeHorizontalIndex(
    start_node: Class_NodeElement,
    nodes_to_process: Class_NodeElement[],
    starting_index: number,
    _visited_nodes_ids: string[],
    recycling_links_ids: string[],
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number }
  ) {
    return this.cycles.computeHorizontalIndex(
      start_node, nodes_to_process, starting_index,
      _visited_nodes_ids, recycling_links_ids, horizontal_indexes_per_nodes_ids
    )
  }

  public computeRecyclingHorizontalIndex(
    nodes_to_process: Class_NodeElement[],
    link: Class_LinkElement,
    recycling_links_ids: string[],
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number }
  ) {
    return this.cycles.computeRecyclingHorizontalIndex(
      nodes_to_process, link, recycling_links_ids, horizontal_indexes_per_nodes_ids
    )
  }

  private repositionNodesWithoutInputs(
    nodes_per_horizontal_indexes: { [index: number]: Class_NodeElement[] },
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
    max_horizontal_index: number
  ) {
    return this.cycles.repositionNodesWithoutInputs(
      nodes_per_horizontal_indexes, horizontal_indexes_per_nodes_ids, max_horizontal_index
    )
  }


  // #243 c9 — L'orchestrateur `computeAutoSankey` et son pipeline de positionnement final vivent
  // dans NodePositioningAutoSankey. Delegateurs conserves : les trois methodes ont des appelants
  // externes (Toolbar, ApplicationData, UnitaryBoard, SpreadSheet, dialogs, bridge Univer...).
  public computeAutoSankey(
    launched_from_process: boolean,
    optimize_crossing: boolean,
    h_spacing?: number,
    v_spacing?: number,
    sources_mode: 'before_neighbor' | 'left_extremity' = 'before_neighbor',
    sinks_mode: 'after_neighbor' | 'right_extremity' = 'after_neighbor',
    skip_horizontal: boolean = false,
    skip_vertical: boolean = false,
    apply_target_fonts: boolean = true
  ) {
    return this._auto.computeAutoSankey(
      launched_from_process, optimize_crossing, h_spacing, v_spacing,
      sources_mode, sinks_mode, skip_horizontal, skip_vertical, apply_target_fonts
    )
  }

  public computeAutoSankeyWithToast(
    launched_from_process: boolean,
    optimize_crossing: boolean,
    h_spacing?: number,
    v_spacing?: number,
    sources_mode: 'before_neighbor' | 'left_extremity' = 'before_neighbor',
    sinks_mode: 'after_neighbor' | 'right_extremity' = 'after_neighbor',
    skip_horizontal: boolean = false,
    skip_vertical: boolean = false,
    apply_target_fonts: boolean = true
  ) {
    return this._auto.computeAutoSankeyWithToast(
      launched_from_process, optimize_crossing, h_spacing, v_spacing,
      sources_mode, sinks_mode, skip_horizontal, skip_vertical, apply_target_fonts
    )
  }

  public computeScale() { return this._auto.computeScale() }


  /**
   * #1230 — Mode coordonnées absolues : garde le centre des nœuds fixe quand leur
   * taille de rendu change (échelle globale des flux, valeur, bascule de
   * vue/datatag). Pendant du `recomputeParametricLayout` pour le mode absolu,
   * appelé en tête de `drawElements` avant `_sankey.draw()` pour que le coin
   * recalculé soit utilisé dès cette frame.
   *
   * N'agit que sur les nœuds « libres » en absolu : exclut les nœuds `relative`
   * (collés à un voisin, position auto-calculée) et les cadres tied (taille pilotée
   * par l'enveloppe de leurs enfants — re-centrer se battrait avec
   * `expandToContainAttachedNodes`).
   */
  public anchorAbsoluteNodesByCenter() {
    this.drawingArea.sankey.nodes_list.forEach(n => {
      if (!n.is_visible) return
      if (n.shape_position_type === 'relative') return
      if (n.tied_to_nodes && n.attached_node.length > 0) return
      n.anchorByCenterIfResized()
    })
  }

  /**
   * #1231 (1.1.5) — Force le retour des nœuds « libres » à leur vraie position absolue
   * (coin = centre stocké − taille/2), en ignorant l'heuristique « taille inchangée » de
   * `anchorByCenterIfResized` (qui recommiterait le coin d'affichage). Mêmes exclusions que
   * `anchorAbsoluteNodesByCenter`. Appelé en sortie de proportionnel / échelle.
   */
  public deriveAbsoluteNodesFromCenter() {
    this.drawingArea.sankey.nodes_list.forEach(n => {
      if (!n.is_visible) return
      if (n.shape_position_type === 'relative') return
      if (n.tied_to_nodes && n.attached_node.length > 0) return
      n.forceDeriveFromCenter()
    })
  }

  /**
   * Mix de positionnement PAR NŒUD, indépendant du mode global.
   *
   * Les nœuds marqués `absolute` restent placés par le mode global (absolu garde le
   * centre fixe, proportionnel comprime, etc.) — on n'y touche pas. Les nœuds marqués
   * `parametric` (« Ecartement ») se recalent verticalement sous le nœud directement
   * AU-DESSUS d'eux dans leur colonne (`position_u`, ordre `position_v`), à l'écart
   * constant `shape_position_dy`. Le nœud du dessus peut être un nœud absolu (servant
   * d'ancre) ou un parametric déjà calé → une pile de parametrics pend sous l'ancre
   * absolue.
   *
   * Le premier nœud d'une colonne, s'il est `parametric`, n'a pas de nœud au-dessus :
   * il conserve la position que le mode global vient de lui donner (repli
   * proportionnel/absolu courant).
   *
   * À appeler en fin de placement global, AVANT `_sankey.draw()`. À NE PAS appeler en
   * mode global `parametric` (recomputeParametricLayout empile déjà la colonne entière).
   *
   * Exclus : nœuds invisibles, échange, `relative` (collés à un voisin), enfants de
   * cadre englobant (positionnés par leur container).
   */
  public anchorParametricNodesToAbsolute() {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    const isContainerChild = (n: Class_NodeElement): boolean =>
      n.dimensions_as_child.some(d => d.container_mode)

    const members = this.drawingArea.sankey.visible_nodes_list.filter(n => {
      if (!n.is_visible) return false
      if (echangeTag && n.hasGivenTag(echangeTag)) return false
      if (n.shape_position_type === 'relative') return false
      if (isContainerChild(n)) return false
      return true
    })

    // Rien à faire si aucune colonne ne contient de nœud parametric.
    if (!members.some(n => n.shape_position_type === 'parametric')) return

    const columns = new Map<number, Class_NodeElement[]>()
    members.forEach(n => {
      const col = columns.get(n.position_u) ?? []
      col.push(n)
      columns.set(n.position_u, col)
    })

    columns.forEach(column => {
      const sorted = [...column].sort((a, b) => {
        if (a.position_v !== b.position_v) return a.position_v - b.position_v
        return a.position_y - b.position_y
      })
      let prev_bottom: number | null = null
      sorted.forEach(node => {
        if (node.shape_position_type === 'parametric' && prev_bottom !== null) {
          node.position_y = prev_bottom + (node.shape_position_dy ?? 0)
          node.applyPosition()
        }
        prev_bottom = node.position_y + node.getShapeHeightToUse()
      })
    })
  }


  /**
   * #1231 — Étendue géométrique verticale de chaque colonne (`position_u`) : haut = bord
   * supérieur du nœud le plus haut, bas = bord inférieur du nœud le plus bas, centre =
   * milieu géométrique de la pile. C'est la **définition unique de la « médiane » d'une
   * colonne**, partagée par le mode paramétrique (ancre = centre géométrique gardé fixe)
   * et le mode proportionnel (centre de gravité = moyenne des centres géométriques).
   */
  /**
   * #1231 — (Re)capture la médiane (centre géométrique) de CHAQUE colonne sur l'état
   * courant, pour le mode paramétrique. À appeler à l'entrée du mode et en fin de drag
   * (état cohérent positions↔hauteurs). La médiane est ensuite gardée FIXE par
   * recomputeParametricLayout au changement de datatag/dimension. Même définition que
   * le proportionnel (columnGeometricExtents). Reconstruit la map (vide les u périmés).
   */
  // #243 — statiques de géométrie pure déplacées dans NodePositioningGeometry.ts (réexports).
  public static columnGeometricExtents = Geometry.columnGeometricExtents

  // #243 (split modes) — impl dans NodePositioningParametric.
  public layoutChildrenInParentSlot(
    children: Class_NodeElement[],
    parent_top: number,
    parent_h: number
  ): void {
    this._parametric.layoutChildrenInParentSlot(children, parent_top, parent_h)
  }


  // #243 c5 — Delegateurs vers le socle « element de reference » (NodePositioningReference).
  // API publique consommee par la persistance (DrawingArea toJSON/fromJSON), les menus
  // contextuels (ContextLinkConfig / NodeActions) et displayModes.
  public get proportionalReferenceLink(): Class_LinkElement | undefined {
    return this.reference.proportionalReferenceLink
  }

  public get proportionalReferenceNode(): Class_NodeElement | undefined {
    return this.reference.proportionalReferenceNode
  }

  public get proportionalReferenceDatatagIds(): string[] | undefined {
    return this.reference.proportionalReferenceDatatagIds
  }

  public set proportionalReferenceDatatagIds(ids: string[] | undefined) {
    this.reference.proportionalReferenceDatatagIds = ids
  }

  public setProportionalReferenceLink(link: Class_LinkElement | undefined) {
    this.reference.setProportionalReferenceLink(link)
  }

  public setProportionalReferenceNode(node: Class_NodeElement | undefined) {
    this.reference.setProportionalReferenceNode(node)
  }

  public attachReferenceLinkFromAttributes() {
    this.reference.attachReferenceLinkFromAttributes()
  }

  public resetProportionalState() { this.proportional.resetProportionalState() }


  public captureProportionalReference() { this.proportional.captureProportionalReference() }


  public anchorProportionalNodes() { this.proportional.anchorProportionalNodes() }


  /**
   * NOUVELLE ÉTAPE : Optimisation des croisements de flux
   * À appeler APRÈS le positionnement initial des nœuds
   *
   * @param {boolean} apply_optimization - Active/désactive l'optimisation
   */
  public optimizeCrossingsPositioning(apply_optimization: boolean = true, h_spacing?: number, v_spacing?: number) {
    Crossings.optimizeCrossingsPositioning(this.drawingArea, apply_optimization, h_spacing, v_spacing)
  }

  // TRADE ARRANGEMENT METHODS ==========================================================

  /**
   * Initially there is only one node per type of exchanges.
   * it must be split to have one import and one export per product
   * International will be split to give InternationalProduct1Importation InternationalProduct1Exportation
   */
  public splitTrade() { Trade.splitTrade(this.drawingArea) }

  public arrangeTrade(compute_xy: boolean) { Trade.arrangeTrade(this.drawingArea, compute_xy) }

  // PARAMETRIZATION METHODS ============================================================

  /**
   * Empile verticalement une liste de nœuds en partant d'une ancre (top du premier
   * nœud). Invariant canonique du mode paramétrique :
   *
   *   n_0.y = anchor_y
   *   n_{i+1}.y = n_i.y + n_i.height + n_{i+1}.shape_position_dy
   *
   * `shape_position_dy` est lu sur chaque nœud (cascade de style respectée) et est
   * la **seule** source de vérité pour l'espacement. Le dy du premier nœud est
   * ignoré (il n'a pas de prédécesseur). `applyPosition()` est appelé sur chaque
   * nœud après la mise à jour.
   *
   * L'ordre des nœuds est celui de la liste passée — à trier par le caller selon
   * son propre critère (position_v, position_y, etc.).
   */
  public static stackNodesVertically = Geometry.stackNodesVertically
  public static totalStackHeight = Geometry.totalStackHeight
  public static containerChildGap = Geometry.containerChildGap
  public static stackContainerChildren = Geometry.stackContainerChildren
  public static totalContainerStackHeight = Geometry.totalContainerStackHeight

  // #243 (split modes) — impl dans NodePositioningParametric.
  public recomputeParametricLayout(
    scope: { type: 'all' } | { type: 'column', u: number } | { type: 'subtree', node: Class_NodeElement }
  ) {
    this._parametric.recomputeParametricLayout(scope)
  }

  public restackContainerChildren() { this._parametric.restackContainerChildren() }

  /**
   * Redresse immédiatement un flux marqué « à garder droit » (clic droit → « Rendre
   * droit ») — issue su-model/opensankey#665, refonte #1231.
   *
   * Le marquage (`shape_must_stay_straight`) est posé par l'appelant ; ici on relance
   * simplement un `drawElements`, dont le post-process `enforceStraightLinks` applique
   * ET maintient la droiture à chaque dessin (dans les 3 modes). Plus de back-calc
   * d'écarts : la droiture n'est plus figée dans la métadonnée paramétrique, elle est
   * re-calculée à chaque frame.
   *
   * @returns toujours `true` (le redraw a été déclenché).
   */
  public straightenLink(link: Class_LinkElement): boolean {
    return StraightLinks.straightenLink(this.drawingArea, link)
  }

  /**
   * #665 (refonte #1231) — Post-processing « flux droit » appliqué APRÈS placement,
   * dans les **trois modes** (paramétrique, absolu, proportionnel). Modèle simple
   * **par flux** : pour chaque flux marqué `shape_must_stay_straight`, on déplace le
   * **nœud cible** verticalement pour que son accroche coïncide avec celle de la source
   * (source = référence). Pas de groupes rigides, pas de back-calc d'écarts : la
   * droiture est re-appliquée à chaque dessin (ce post-process tourne après
   * `_sankey.draw()` à chaque `drawElements`), donc rien à « figer ».
   *
   * Les flux sont traités triés par `position_u` de la source (amont → aval) pour que
   * les chaînes A→B→C se propagent correctement (B déplacé avant de traiter B→C). Sur
   * un nœud cible de deux flux marqués incompatibles, le dernier traité gagne.
   *
   * Option par flux `shape_straight_include_children` : redresse aussi les flux
   * « enfant-enfant » (source et cible descendantes des nœuds du flux marqué dans la
   * hiérarchie de dimensions) → la droiture survit à la désagrégation.
   *
   * À appeler après un draw (les accroches `getOutputLinkStartingPoint`/
   * `getInputLinkEndingPoint` reflètent les épaisseurs courantes ; l'offset relatif est
   * invariant par translation). Géométrie pure ; le caller redessine si `true`.
   *
   * @returns `true` si au moins un nœud cible a bougé (le caller redessine).
   */
  public enforceStraightLinks(): boolean {
    return StraightLinks.enforceStraightLinks(this.drawingArea)
  }

  /**
   * #1231 — Ensemble { nœud + tous ses descendants } via la hiérarchie de dimensions
   * (`dimensions_as_parent.children`). Utilisé pour propager la droiture aux flux
   * désagrégés.
   */
  public static collectNodeDescendants = Geometry.collectNodeDescendants

  public backCalculateShapePositionDyFromY(): number {
    return this._parametric.backCalculateShapePositionDyFromY()
  }

  public inferPositionUFromX() { this._parametric.inferPositionUFromX() }


  public computeColumnsFromX(): { [node_id: string]: number } {
    return this._parametric.computeColumnsFromX()
  }

  public updateRecyclingFromPositions(only_touching_nodes?: Set<string>): { [link_id: string]: boolean } {
    return this._parametric.updateRecyclingFromPositions(only_touching_nodes)
  }

  public computeParametrization(use_horizontal_index: boolean) {
    this._parametric.computeParametrization(use_horizontal_index)
  }

  public applyVForLevelTag(columns: { [_: number]: Class_NodeElement[] }, tag: Class_LevelTag) {
    this._parametric.applyVForLevelTag(columns, tag)
  }

  public computeParametricV(tag: Class_LevelTag | undefined) {
    this._parametric.computeParametricV(tag)
  }

  public computeParametricVForTagg(tag: Class_LevelTag) {
    this._parametric.computeParametricVForTagg(tag)
  }
  public applyVAgregate(node: Class_NodeElement) {
    this._parametric.applyVAgregate(node)
  }

  public applyVDesagregate(
    node: Class_NodeElement,
    current_v: number,
    tag: Class_LevelTag
  ) {
    return this._parametric.applyVDesagregate(node, current_v, tag)
  }

  // UTILITY METHODS ====================================================================


  // #243 (split modes) — impl dans NodePositioningParametric ; wrapper undo/redo ci-dessous.
  protected _arrangeNodesToGrid() {
    this._parametric._arrangeNodesToGrid()
  }

  /**
   * Align node pos with grid lines & save it's undo
   *
   */
  public arrangeNodesToGrid = () => {
    const app_data = this.drawingArea.application_data
    const { sankey } = this.drawingArea
    const node_pos = Object.fromEntries(sankey.visible_nodes_list.map(n => [n.id, { x: n.position_x, y: n.position_y }]))
    const container_pos = Object.fromEntries(
      Object.entries(sankey.containers_dict)
        .filter(([, c]) => !c.tied_to_nodes)
        .map(([id, c]) => [id, { x: c.position_x, y: c.position_y }])
    )

    const _arrangeNodesToGrid = () => {
      this._arrangeNodesToGrid()
      app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    }

    const inv_arrangeNodesToGrid = () => {
      sankey.visible_nodes_list.forEach(n => {
        n.setPosXY(node_pos[n.id].x, node_pos[n.id].y)
      })
      Object.entries(container_pos).forEach(([id, pos]) => {
        const container = sankey.containers_dict[id]
        if (container) {
          container.position_x = pos.x
          container.position_y = pos.y
          container.draw()
        }
      })
    }

    app_data.history.saveUndo(inv_arrangeNodesToGrid)
    app_data.history.saveRedo(_arrangeNodesToGrid)
    _arrangeNodesToGrid()
  }
}
