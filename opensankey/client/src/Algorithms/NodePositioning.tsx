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
import { NodePositioningAutoSankey } from './NodePositioningAutoSankey'
import * as StraightLinks from './NodePositioningStraightLinks'
import * as Crossings from './NodePositioningCrossings'
import * as Trade from './NodePositioningTrade'


/**
 * Class responsible for node and link positioning logic
 * Handles auto-sankey computation, parametrization, and trade arrangements
 */
export class NodePositioning {
  public readonly drawingArea: Class_DrawingArea

  // #1231 — Mode proportionnel : cadre de référence capturé à l'entrée du mode
  // (et après drag / changement de vue). Trois repères : médiane (centre de gravité),
  // haut et bas. `_prop_ref_col_sums` = somme des hauteurs de nœuds par colonne au
  // datatag de référence ; sert à calculer le facteur de compression f = plus petit
  // ratio (somme courante / somme de référence) sur les colonnes. Transitoires.
  private _prop_median_y: number | undefined = undefined
  private _prop_top_y: number | undefined = undefined
  private _prop_bottom_y: number | undefined = undefined
  private _prop_ref_col_sums: Map<number, number> | undefined = undefined




  // #1231 — Mode « échelle adaptée » : au lieu de bouger les nœuds, on ajuste l'échelle
  // (valeur→px) pour que le flux de référence garde TOUJOURS la même épaisseur. Comme
  // l'épaisseur ∝ valeur / échelle, on garde `échelle / valeur_flux` constant : à chaque
  // datatag, échelle = échelle_ref × (valeur_flux_courante / valeur_flux_ref). On capture
  // l'échelle et la valeur du flux à l'entrée du mode. Transitoires.
  private _scale_adapted_ref_value: number | undefined = undefined
  private _scale_adapted_ref_scale: number | undefined = undefined

  // #1231 — Drapeau de suppression de la compression proportionnelle pendant une
  // opération STRUCTURELLE (englobement, désagrégation, expansion…). Ces opérations
  // créent des états transitoires où une colonne contient à la fois le parent ET ses
  // enfants (ex. englobement : parent-cadre + enfants visibles) → la somme de colonne
  // double brièvement → f bondit (max ratio) → tout le diagramme se dilate, et la
  // re-capture en fin d'opération FIGE cet état dilaté. La compression ne doit réagir
  // qu'aux changements de datatag/vue, pas aux changements de structure. Posé autour de
  // l'opération, levé juste avant la re-capture finale (cf. NodeActions/Hierarchies).
  public suppressProportionalCompression = false

  // #1231 — Mode « écart » (ex-paramétrique) : réutilise intégralement le cadre du mode
  // proportionnel (médiane globale `_prop_median_y`, facteur f via `_prop_ref_col_sums`,
  // centre de réf PAR NŒUD `_prop_center_ref` sur NodeBase). Seule l'application diffère :
  // le NŒUD DU HAUT de chaque colonne prend sa position % (comme le mode proportionnel),
  // puis le reste s'empile dessous avec des écarts constants. Pas de champ dédié.

  public readonly cycles: NodePositioningCyclesCore
  // #243 c5 — Socle « element de reference » (flux ou noeud-stock), partage par le mode
  // proportionnel ET le mode echelle adaptee. Cf. NodePositioningReference.
  public readonly reference: NodePositioningReference
  private _auto: NodePositioningAutoSankey

  constructor(drawingArea: Class_DrawingArea) {
    this.drawingArea = drawingArea
    this.cycles = new NodePositioningCyclesCore(drawingArea)
    this.reference = new NodePositioningReference(drawingArea)
    this._auto = new NodePositioningAutoSankey(this)
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
   * #1231 — Nœuds « libres » éligibles au mode proportionnel : visibles, non-échange,
   * non-relatifs, hors cadres tied. (Filtre commun capture/replacement.)
   */
  private proportionalEligibleNodes(): Class_NodeElement[] {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    return this.drawingArea.sankey.visible_nodes_list.filter(n => {
      if (!n.is_visible) return false
      if (echangeTag && n.hasGivenTag(echangeTag)) return false
      if (n.shape_position_type === 'relative') return false
      if (n.tied_to_nodes && n.attached_node.length > 0) return false
      // #1231 — un nœud DANS un cadre englobant (tied) suit le cadre : on l'exclut de la
      // compression proportionnelle indépendante. Sinon l'englobement (qui ajoute des
      // enfants éligibles et exclut le parent-cadre) faisait varier le facteur f et
      // re-spreadait les autres nœuds (ex. bois mort) → l'opération n'était pas
      // indépendante du mode (KO en %, OK en absolu).
      if (n.attached_container && n.attached_container.length > 0) return false
      return true
    })
  }

  /**
   * #1231 — Mode proportionnel : somme des hauteurs de nœuds par colonne (`position_u`)
   * au datatag courant. Proxy de la « somme des valeurs par colonne » (hauteur ∝ valeur
   * à échelle constante). Sert à calculer le facteur de compression f.
   */
  private proportionalColumnSums(nodes: Class_NodeElement[]): Map<number, number> {
    const sums = new Map<number, number>()
    nodes.forEach(n => {
      sums.set(n.position_u, (sums.get(n.position_u) ?? 0) + n.getShapeHeightToUse())
    })
    return sums
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

  /**
   * Place verticalement les enfants d'une opération STRUCTURELLE (désagrégation,
   * expansion latérale, englobement) dans le slot vertical du parent `[parent_top,
   * parent_top + parent_h]`, selon le mode d'écart configuré sur la DrawingArea
   * (`effective_gap_mode` = surcharge transitoire ?? réglage global), cf.
   * Type_DisaggregationGap :
   *  - 'fill'        : écart égal pour remplir exactement le slot (≥ 0). Historique #1231.
   *  - 'keep'        : aucun repositionnement VERTICAL (les enfants gardent leur position_y).
   *  - 'children_dy' : empile depuis `parent_top`, écart = shape_position_dy de chaque enfant.
   *  - 'constant'    : empile depuis `parent_top`, écart = disaggregation_gap_value, réécrit dans dy.
   *
   * N.B. : ne touche QUE position_y (+ shape_position_dy selon le mode). L'appelant gère
   * position_u / position_x (qui diffèrent selon l'opération : colonne du parent pour la
   * désagrégation, colonne adjacente décalée pour l'expansion) et les applique TOUJOURS,
   * même en 'keep' (qui ne conserve que le Y des enfants).
   * L'ordre du tableau `children` détermine l'empilement (haut → bas).
   */
  public layoutChildrenInParentSlot(
    children: Class_NodeElement[],
    parent_top: number,
    parent_h: number
  ): void {
    const mode = this.drawingArea.effective_gap_mode
    if (children.length === 0) return
    // 'keep' ne touche pas au Y (les enfants gardent leur position_y) ; les autres modes
    // empilent depuis parent_top. Dans TOUS les cas, le x a déjà été posé par l'appelant.
    if (mode !== 'keep') {
      const default_dy = this.drawingArea.sankey.default_style.shape_position_dy
      const const_gap = this.drawingArea.disaggregation_gap_value
      const sum_h = children.reduce((s, c) => s + c.getShapeHeightToUse(), 0)
      const fill_gap = children.length > 1
        ? Math.max(0, (parent_h - sum_h) / (children.length - 1))
        : 0
      let cursor = parent_top
      children.forEach((c, i) => {
        if (i > 0) {
          const gap = mode === 'fill'
            ? fill_gap
            : mode === 'children_dy'
              ? (c.shape_position_dy ?? default_dy)
              : const_gap
          cursor += gap
          // 'fill' fixe un écart CALCULÉ (propre à ce slot) → on le matérialise dans dy pour que
          // le ré-empilement au dessin le reproduise. 'constant' est au contraire lu EN DIRECT
          // depuis disaggregation_gap_value (containerChildGap) : ne rien figer, sinon éditer la
          // valeur ne changerait pas les englobements déjà en place.
          if (mode === 'fill') c.shape_position_dy = gap
        }
        c.position_y = cursor
        cursor += c.getShapeHeightToUse()
      })
    }
    // #1230/#1231 — CAPITAL : ré-ancrer le centre (#1230) sur la position FINALE des enfants.
    // Sinon le setAbsoluteMode() de fin d'opération, s'il vient du mode proportionnel/échelle,
    // appelle deriveAbsoluteNodesFromCenter() qui restaurerait le centre PÉRIMÉ des enfants
    // (capturé avant qu'ils soient masqués/déplacés) et écraserait le x/y qu'on vient de poser.
    children.forEach(c => c.captureCenterFromCorner())
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

  /**
   * #1231 — Réinitialise complètement l'état du mode proportionnel : retire le flux de
   * référence (et son marqueur persisté) et oublie le cadre de référence capturé (médiane,
   * sommes par colonne, épaisseur du flux). Les positions courantes des nœuds sont
   * conservées (elles deviennent les positions absolues). Appelé au passage en mode absolu :
   * on repart « propre », un futur retour en proportionnel re-capture tout.
   */
  public resetProportionalState() {
    this.reference.setProportionalReferenceLink(undefined)
    this._prop_median_y = undefined
    this._prop_top_y = undefined
    this._prop_bottom_y = undefined
    this._prop_ref_col_sums = undefined
  }



  /**
   * #1231 — Mode « échelle adaptée » : capture l'échelle courante et la valeur du flux de
   * référence. Sert de base au ratio appliqué ensuite (`applyAdaptedScale`). À l'entrée du
   * mode, valeur_courante == valeur_ref → échelle inchangée → pas de saut.
   */
  public captureScaleReference() {
    // Élément brut : on doit pouvoir capturer la valeur de référence même si l'élément est
    // momentanément masqué par un filtre vue (cf. referenceFluxRefValue).
    const ref = this.reference.rawReference
    const v = ref ? this.reference.referenceFluxRefValue() : undefined
    if (ref && v && v > 0) {
      // Valeur au datatag de référence (couple flux/datatag) ; échelle de base = échelle courante.
      this._scale_adapted_ref_value = v
      this._scale_adapted_ref_scale = this.drawingArea.scale
    } else {
      this._scale_adapted_ref_value = undefined
      this._scale_adapted_ref_scale = undefined
    }
  }

  /**
   * #1231 — Mode « échelle adaptée » : ajuste l'échelle (valeur→px) du diagramme pour que le
   * flux de référence garde sa taille de référence à tous les datatags. Appelé en tête de
   * `drawElements` avant `_sankey.draw()`. No-op sans flux de référence ou sans capture.
   * Écrit directement `_scale` + le domaine de `_scaleValueToPx` (le setter `scale` redraw →
   * récursion ; on l'évite).
   */
  public applyAdaptedScale() {
    // En mode vue, l'élément de référence peut être masqué par le filtre → on prend l'élément brut
    // (sa valeur de réf reste le « gabarit » de taille). Hors vue, version visibilité-gated.
    const view_active = this.drawingArea.sankey.view_mode_active
    const ref = view_active ? this.reference.rawReference : this.reference.gatedReference
    if (!ref) return
    // Capture paresseuse (1er dessin / après chargement) : base = échelle + valeur courantes
    // → ratio 1 à cette frame, pas de saut.
    if (this._scale_adapted_ref_value === undefined || this._scale_adapted_ref_scale === undefined) {
      this.captureScaleReference()
      return
    }
    // En mode vue : v = valeur du CORRESPONDANT de la vue (enfant visible portant l'étiquette
    // sélectionnée). new_scale = ref_scale × correspondant / valeur_réf → le correspondant est
    // dessiné à la taille de référence (une vue plus petite dilate l'échelle pour normaliser le
    // correspondant). Hors vue : valeur courante de l'élément de référence (datatags).
    const v = view_active
      ? this.reference.referenceViewValue()
      : this.reference.referenceCurrentValue()
    if (v <= 0) return
    const new_scale = this._scale_adapted_ref_scale * v / this._scale_adapted_ref_value
    if (isFinite(new_scale) && new_scale > 0) {
      this.drawingArea._scale = new_scale
      this.drawingArea._scaleValueToPx.domain([0, new_scale])
    }
  }



  /**
   * #1231 — Sortie du mode « échelle adaptée » : restaure l'échelle de base capturée (pour
   * ne pas laisser le diagramme à une échelle adaptée d'un autre datatag) et oublie la
   * capture. L'échelle restaurée s'affiche au prochain dessin.
   */
  public clearScaleAdaptation() {
    if (this._scale_adapted_ref_scale !== undefined && this._scale_adapted_ref_scale > 0) {
      this.drawingArea._scale = this._scale_adapted_ref_scale
      this.drawingArea._scaleValueToPx.domain([0, this._scale_adapted_ref_scale])
    }
    this._scale_adapted_ref_value = undefined
    this._scale_adapted_ref_scale = undefined
  }

  /**
   * #1231 — Mode « échelle adaptée » : dérive le coin de chaque nœud « libre » depuis son CENTRE
   * stocké, SANS jamais recommiter le coin dans le centre. Remplace `anchorAbsoluteNodesByCenter`
   * dans la branche scale_adapted de `drawElements` : on garde la même dérivation centre→coin,
   * mais on supprime la branche « taille inchangée → captureCenterFromCorner » qui figerait le
   * recalage d'affichage (anti-chevauchement / clamp, cf. `resolveScaleAdaptedOverlaps`) dans le
   * centre persisté → ce recalage se traînerait alors d'un viewtag/datatag à l'autre.
   *
   * Le centre reste la SEULE vérité : il n'est modifié que par les gestes utilisateur (drag,
   * resize → `settleCenterAnchor`) et les opérations structurelles, jamais par le dessin. À chaque
   * frame on repart donc du centre propre, et le recalage d'espacement est recalculé pour le
   * datatag/viewtag courant (transitoire, jamais persistant).
   *
   * Mêmes exclusions que `anchorAbsoluteNodesByCenter` : nœuds visibles, libres (non relatifs),
   * hors cadres tied. Lazy-init du centre au 1er dessin (fichier sans centre encore posé).
   */
  public deriveScaleAdaptedCornersFromCenter() {
    this.drawingArea.sankey.nodes_list.forEach(n => {
      if (!n.is_visible) return
      if (n.shape_position_type === 'relative') return
      if (n.tied_to_nodes && n.attached_node.length > 0) return
      if (n.center_x === undefined || n.center_y === undefined) {
        n.captureCenterFromCorner() // init unique ; le coin est déjà cohérent
      } else {
        n.forceDeriveFromCenter() // coin = centre − taille/2, sans recommit du centre
      }
    })
  }

  /**
   * #1231 — Mode « échelle adaptée » : décale un nœud verticalement de `dy` POUR L'AFFICHAGE
   * seulement (coin `position_y`), SANS toucher au centre stocké. Le recalage d'espacement est
   * propre au datatag/viewtag courant : il est recalculé à chaque dessin à partir du centre
   * (cf. `deriveScaleAdaptedCornersFromCenter`) et ne doit donc jamais être persisté, sinon il se
   * traînerait d'un datatag/viewtag à l'autre. No-op si `dy` nul.
   */
  private shiftNodeY(n: Class_NodeElement, dy: number) {
    if (!dy) return
    n.position_y += dy
  }

  /**
   * #1231 — Mode « échelle adaptée » : anti-chevauchement par colonne (DEPUIS LE HAUT) + clamp
   * du haut du diagramme. Appelé après `deriveScaleAdaptedCornersFromCenter` dans la branche
   * scale_adapted de `drawElements`.
   *
   * En mode échelle, les nœuds grossissent autour de leur centre FIXE quand l'échelle monte
   * (bascule datatag/viewtag). Deux effets indésirables :
   *  - deux nœuds d'une même colonne peuvent se recouvrir ;
   *  - le nœud du haut, dont le coin = centre − hauteur/2, peut passer AU-DESSUS du haut du
   *    diagramme (y < 0).
   *
   * On ne re-layoute PAS le diagramme :
   *  1. anti-chevauchement : le nœud le plus haut de chaque colonne garde sa place, chaque nœud
   *     suivant est descendu juste assez pour rétablir l'écart minimal (push vers le bas only) ;
   *  2. clamp du haut : si le sommet de la colonne dépasse y=0, on décale TOUTE la colonne vers
   *     le bas pour que son sommet tienne pile au haut du diagramme.
   * Ces décalages sont D'AFFICHAGE (coin seulement, cf. `shiftNodeY`) : recalculés à chaque
   * dessin depuis le centre, donc propres au datatag/viewtag courant et jamais persistés.
   *
   * Mêmes conventions de colonne que `backCalculateShapePositionDyFromY` : groupage par
   * `position_u`, exclusion des nœuds `echange` (import/export, placés au niveau de leur flux),
   * des nœuds relatifs et des cadres tied. `écart_min` = `shape_position_dy` GLOBAL.
   */
  public resolveScaleAdaptedOverlaps() {
    const min_gap = this.drawingArea.sankey.styles_dict['default'].shape_position_dy ?? 50
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    const columns = new Map<number, Class_NodeElement[]>()
    this.drawingArea.sankey.visible_nodes_list.forEach(n => {
      if (!n.is_visible) return
      if (echangeTag && n.hasGivenTag(echangeTag)) return
      if (n.shape_position_type === 'relative') return
      if (n.tied_to_nodes && n.attached_node.length > 0) return
      const arr = columns.get(n.position_u) ?? []
      arr.push(n)
      columns.set(n.position_u, arr)
    })
    columns.forEach(col => {
      // Ordre vertical = ordre LOGIQUE de la colonne (`position_v`), PAS la géométrie courante :
      // en échelle adaptée, position_y est dérivée du centre et peut différer d'un pouième entre
      // deux nœuds quasi alignés → un tri par position_y inverserait leur ordre (ex. v=1 au-dessus
      // de v=0) et le push figerait l'inversion. position_v est l'ordre stable (calculé au load,
      // u/v verrouillés). position_y en départage seulement les v égaux (ne devrait pas arriver).
      col.sort((a, b) => (a.position_v - b.position_v) || (a.position_y - b.position_y))
      // 1. anti-chevauchement, depuis le haut : descendre les nœuds qui se recouvrent.
      for (let i = 1; i < col.length; i++) {
        const prev = col[i - 1]
        const curr = col[i]
        const min_top = prev.position_y + prev.getShapeHeightToUse() + min_gap
        if (curr.position_y < min_top) this.shiftNodeY(curr, min_top - curr.position_y)
      }
      // 2. clamp du haut : le sommet de la colonne (nœud le plus haut, jamais descendu) ne doit
      //    pas dépasser y=0. Sinon on décale toute la colonne vers le bas (affichage seulement).
      const top = col[0].position_y
      if (top < 0) col.forEach(n => this.shiftNodeY(n, -top))
    })
  }

  /**
   * #1231 — Capture le cadre de référence du mode proportionnel sur l'état courant.
   * Deux régimes selon qu'un flux de référence est sélectionné ou non :
   *  - AVEC flux de référence : médiane (centre de gravité, FIXE) = centre vertical du flux
   *    à mi-parcours ; l'épaisseur du flux est mémorisée comme référence du facteur f.
   *  - SANS flux de référence (fallback) : médiane = moyenne, sur les colonnes, des **centres
   *    géométriques** de pile ; sommes de hauteurs par colonne mémorisées pour f (max ratio).
   * Dans les deux cas on capture le centre de référence de chaque nœud (pour le replacement).
   * Appelé à l'entrée du mode, après un drag et au changement de vue. `position_u` doit
   * être à jour (cf. `inferPositionUFromX`).
   */
  public captureProportionalReference() {
    const nodes = this.proportionalEligibleNodes()
    if (nodes.length === 0) {
      this._prop_median_y = undefined
      this._prop_top_y = undefined
      this._prop_bottom_y = undefined
      this._prop_ref_col_sums = undefined
      return
    }
    // Médiane = moyenne des centres géométriques de pile par colonne.
    const extents = NodePositioning.columnGeometricExtents(nodes)
    let top_y = Infinity
    let bottom_y = -Infinity
    let center_sum = 0
    extents.forEach(({ top, bottom, center }) => {
      center_sum += center
      if (top < top_y) top_y = top
      if (bottom > bottom_y) bottom_y = bottom
    })
    this._prop_median_y = center_sum / extents.size
    this._prop_top_y = top_y
    this._prop_bottom_y = bottom_y
    this._prop_ref_col_sums = this.proportionalColumnSums(nodes)
    nodes.forEach(n => n.captureProportionalCenterRef())

    // #1231 — Avec élément de référence : la médiane (centre de gravité fixe) se cale sur le
    // centre vertical de l'élément (flux à mi-parcours, ou centre du nœud-stock). Le facteur f
    // est value-based (cf. proportionalFactor) : rien à capturer ici pour f (il dérive du couple
    // élément/datatag de référence persisté).
    const ref_center = this.referenceCenterY()
    if (ref_center !== undefined) {
      this._prop_median_y = ref_center
    }
  }

  /** #1231b — Centre vertical de l'élément de référence (visibilité-gated). undefined si aucun. */
  private referenceCenterY(): number | undefined {
    const ref = this.reference.gatedReference
    if (!ref) return undefined
    const node = this.reference.rawReferenceNode
    if (node && ref === node) {
      return node.position_y + node.getShapeHeightToUse() / 2
    }
    return this.reference.fluxCenterY(ref as Class_LinkElement)
  }

  /**
   * #1231 — Facteur de compression/dilatation courant.
   *  - AVEC flux de référence : f = épaisseur courante du flux / épaisseur capturée. Tout le
   *    diagramme se comprime/dilate autour de la médiane (centre du flux) selon ce ratio.
   *  - SANS (fallback) : plus GRAND ratio (somme de hauteurs par colonne courante / référence)
   *    sur les colonnes communes.
   * 1 si pas de référence exploitable.
   */
  private proportionalFactor(nodes: Class_NodeElement[]): number {
    // #1231 — Régime « flux de référence » : f = ratio de VALEUR du flux de référence entre le
    // datatag courant et le datatag de référence (couple persisté flux/datatag). f=1 au datatag
    // de réf ; indépendant du moment où l'on (r)entre en mode %.
    // En mode vue, le flux de référence peut être masqué par le filtre → lien brut. Le facteur
    // est piloté par la valeur du CORRESPONDANT de la vue (somme des flux enfants visibles
    // portant l'étiquette sélectionnée) rapportée à la valeur du flux de référence : une vue
    // plus petite que le total donne f<1 → le diagramme se comprime (rétracte).
    const view_active = this.drawingArea.sankey.view_mode_active
    const ref = view_active ? this.reference.rawReference : this.reference.gatedReference
    if (ref) {
      const ref_val = this.reference.referenceFluxRefValue()
      const cur = view_active
        ? this.reference.referenceViewValue()
        : this.reference.referenceCurrentValue()
      if (ref_val && ref_val > 0 && cur > 0) {
        const f = cur / ref_val
        return (isFinite(f) && f > 0) ? f : 1
      }
      return 1
    }
    if (!this._prop_ref_col_sums) return 1
    const cur = this.proportionalColumnSums(nodes)
    let f = 0
    this._prop_ref_col_sums.forEach((ref_sum, u) => {
      if (ref_sum <= 0) return
      const cur_sum = cur.get(u) ?? 0
      const ratio = cur_sum / ref_sum
      if (ratio > f) f = ratio
    })
    if (!isFinite(f) || f <= 0) return 1
    return f
  }

  /**
   * #1231 — Mode proportionnel : comprime/dilate le diagramme verticalement autour de
   * la médiane (centre de gravité fixe) par le facteur de flux. Appelé en tête de
   * `drawElements` avant `_sankey.draw()`. Capture la référence au 1er appel si absente.
   */
  public anchorProportionalNodes() {
    // #1231 — Pendant une opération structurelle, ne pas comprimer : on laisse les
    // positions calculées par l'opération (remplissage du slot, etc.) telles quelles ;
    // la re-capture finale les fixera comme nouvelle référence (f=1).
    if (this.suppressProportionalCompression) return
    const nodes = this.proportionalEligibleNodes()
    if (nodes.length === 0) return
    if (this._prop_median_y === undefined || !this._prop_ref_col_sums) {
      this.captureProportionalReference()
      return
    }
    // #1231 (1.1.5) — anti-chevauchement GLOBAL : le facteur de compression effectif est
    // borné par le bas par le facteur minimal qui empêche TOUTE colonne de chevaucher
    // (proportionalMinFactor). Appliqué uniformément à tous les nœuds, c'est une
    // transformation linéaire autour de la médiane → l'ordre vertical par pourcentage est
    // préservé EXACTEMENT entre colonnes (un nœud plus haut le reste, gauche ou droite), et
    // la colonne la plus dense « tire » tout le diagramme. Plus de plancher par colonne.
    const f = this.proportionalFactor(nodes)
    // Plancher anti-chevauchement (écart minimum entre nœuds). En mode vue, les nœuds révélés par
    // le filtre n'ont pas de position verticale propre (le fichier les stocke empilés) : deux
    // peuvent se retrouver quasi collés et le facteur dépasserait 1, dilatant tout le diagramme à
    // l'infini. On le PLAFONNE donc à 1 en vue : on applique l'écart minimum tant qu'il « tient »
    // dans la disposition d'origine, mais on ne dilate jamais au-delà (pas d'explosion, et la vue
    // ne se contracte pas plus que nécessaire). Hors vue : comportement normal (ensemble fixe).
    const min_factor = this.proportionalMinFactor(nodes)
    const capped_min = this.drawingArea.sankey.view_mode_active ? Math.min(min_factor, 1) : min_factor
    const f_eff = Math.max(f, capped_min)
    nodes.forEach(n => n.applyProportionalCompression(this._prop_median_y!, f_eff))
  }

  /**
   * #1231 — Espacement des colonnes en mode proportionnel (option « écarts × f avec plancher »).
   * Raisonne en DISTANCES ENTRE CENTRES (et non en positions absolues) :
   *  - distance de référence entre deux nœuds voisins = écart de leurs centres capturés ;
   *  - distance voulue = max(distance_réf × f, ½h_haut + ½h_bas + écart_min) ;
   *  - la pile est centrée sur le centre comprimé de la colonne
   *    (médiane + (centre_réf_colonne − médiane) × f).
   * Propriétés :
   *  - à f = 1 et sans chevauchement de départ, reproduit EXACTEMENT le layout (centre de
   *    colonne = (cref_premier+cref_dernier)/2, indépendant de la médiane) → sélectionner/retirer
   *    le flux de référence ne bouge rien ;
   *  - garantit un écart ≥ écart_min entre voisins (jamais de chevauchement) ;
   *  - l'espacement suit le flux (× f) tant qu'il reste au-dessus du plancher.
   * `écart_min` = `shape_position_dy` GLOBAL (petit, ~50px) : un dy par-nœud aberrant (ex. 434)
   * forcerait un grand écart même quand le layout d'origine est plus serré → faux déplacements.
   */
  private proportionalMinFactor(nodes: Class_NodeElement[]): number {
    const min_gap = this.drawingArea.sankey.styles_dict['default'].shape_position_dy ?? 50
    // Paires de centres de réf quasi confondus : aucun facteur fini ne les sépare (déjà
    // superposées en absolu) → ignorées, sinon f_min exploserait.
    const EPS = 1
    const cols = new Map<number, Class_NodeElement[]>()
    nodes.forEach(n => {
      const arr = cols.get(n.position_u) ?? []
      arr.push(n)
      cols.set(n.position_u, arr)
    })
    let f_min = 0
    cols.forEach(col => {
      if (col.length < 2) return
      const cref = (n: Class_NodeElement) => n.center_y ?? n._prop_center_ref ?? (n.position_y + n.getShapeHeightToUse() / 2)
      col.sort((a, b) => cref(a) - cref(b))
      for (let i = 0; i < col.length - 1; i++) {
        const gap_ref = cref(col[i + 1]) - cref(col[i])
        if (gap_ref <= EPS) continue
        // Facteur minimal pour que l'écart de centres comprimé reste ≥ ½h_haut+½h_bas+min_gap.
        const min_dist = col[i].getShapeHeightToUse() / 2 + col[i + 1].getShapeHeightToUse() / 2 + min_gap
        const need = min_dist / gap_ref
        if (need > f_min) f_min = need
      }
    })
    return f_min
  }








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

  /**
   * Point d'entrée unique pour le recompute du layout paramétrique (PR 3).
   *
   * Traite une colonne (ensemble de nœuds visibles partageant un même
   * `position_u`) comme une pile verticale triée par `position_v` croissant,
   * ancrée sur le `position_y` courant du nœud de plus petit V, et espacée
   * par `shape_position_dy` via `stackNodesVertically` (cf. PR 2).
   *
   * **Responsabilité stricte : empilement géométrique uniquement.** `position_v`
   * est supposé déjà à jour à l'entrée — les call sites qui ont besoin de le
   * recalculer (nouveau diagramme, bascule de mode, data tag change) doivent
   * appeler `computeParametricV` avant. Cette séparation des responsabilités
   * était le point 1 de la discussion PR 3 : V est une donnée métier, le
   * recompute est un calcul géométrique pur.
   *
   * **Limitation de l'étape 1 (ce commit)** : les containers ne sont **pas**
   * traités récursivement. Les nœuds enfants d'un container (i.e. ceux avec
   * `dimensions_as_child.some(d => d.container_mode)`) sont exclus du
   * stacking de colonne — l'ancien chemin `Node.applyPosition` les prend en
   * charge via sa logique `nodeAbove`. L'intégration récursive des
   * containers comme sous-colonnes est prévue dans un commit ultérieur de
   * PR 3.
   *
   * **Scopes supportés** :
   * - `{ type: 'all' }` : toutes les colonnes top-level de la drawing area.
   * - `{ type: 'column', u: number }` : une seule colonne (utile pour fin
   *   de drag, désagrégation latérale).
   * - `{ type: 'subtree', node }` : réservé à l'étape containers récursifs
   *   (commit ultérieur) — non implémenté ici, lève une erreur explicite.
   *
   * Les nœuds « échange » (tag `type de noeud` / `echange`) sont exclus du
   * stacking, comme dans tous les autres chemins paramétriques.
   *
   * **Dead code temporaire** : tant que `Node.applyPosition` n'est pas
   * réduit à un pass-through, appeler `recomputeParametricLayout` n'a aucun
   * effet visible — le prochain `applyPosition` écrase les positions qu'on
   * vient de poser. C'est volontaire : ce commit ajoute uniquement la
   * plomberie, la bascule de `applyPosition` et la migration des call sites
   * viennent dans un commit séparé pour isoler les régressions éventuelles.
   */
  public recomputeParametricLayout(
    scope: { type: 'all' } | { type: 'column', u: number } | { type: 'subtree', node: Class_NodeElement }
  ) {
    if (scope.type === 'subtree') {
      throw new Error(
        '[recomputeParametricLayout] scope \'subtree\' not implemented yet ' +
        '— requires container recursion (future commit of PR 3).'
      )
    }

    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']

    // Mode d'écart des enfants de cadre + valeur constante LIVE (cf. containerChildGap) : partagés
    // par le sizing (Phase A) et l'empilement (Phase C) pour que l'écart 'constant' reste éditable.
    const gap_mode = this.drawingArea.effective_gap_mode
    const const_gap = this.drawingArea.disaggregation_gap_value

    // --- Helpers ---

    // A container is any node that is a parent of at least one dimension
    // running in container_mode. Nested containers are handled recursively.
    const isContainerParent = (n: Class_NodeElement): boolean =>
      n.dimensions_as_parent.some(d => d.container_mode)

    // A "top-level" node for the column stacking is a visible, non-exchange
    // node that is NOT itself sitting inside a container. Top-level nodes
    // include: plain leaves, plain intermediates, AND top-level containers
    // (containers that are not themselves children of another container).
    // Container children — at any depth — are excluded; they are positioned
    // by the recursive container descent pass.
    const isTopLevel = (n: Class_NodeElement): boolean => {
      if (!n.is_visible) return false
      if (echangeTag && n.hasGivenTag(echangeTag)) return false
      if (n.dimensions_as_child.some(d => d.container_mode)) return false
      return true
    }

    // Sort container children by position_v, with a stable tie-break on
    // the current position_y so equal-V or unassigned-V (-1) nodes don't
    // dance around between recomputes.
    const sortByV = (nodes: Class_NodeElement[]): Class_NodeElement[] => {
      return [...nodes].sort((a, b) => {
        if (a.position_v !== b.position_v) return a.position_v - b.position_v
        return a.position_y - b.position_y
      })
    }

    // Collect direct container children of a given container parent.
    // Dedupes across multiple container_mode dimensions and keeps only
    // visible non-exchange nodes (the rest do not contribute to the
    // envelope).
    const collectContainerChildren = (container: Class_NodeElement): Class_NodeElement[] => {
      const seen = new Set<Class_NodeElement>()
      const children: Class_NodeElement[] = []
      container.dimensions_as_parent
        .filter(d => d.container_mode)
        .forEach(dim => {
          dim.children.forEach(child => {
            const c = child as Class_NodeElement
            if (seen.has(c)) return
            seen.add(c)
            if (!c.is_visible) return
            if (echangeTag && c.hasGivenTag(echangeTag)) return
            children.push(c)
          })
        })
      return children
    }

    // --- Phase A : bottom-up sizing of nested containers ---
    //
    // Sets shape_min_height / shape_min_width of every container parent to
    // the envelope size its (recursively-sized) children would produce,
    // WITHOUT writing any position. Positions are decided in phase B and C.
    //
    // Recursion walks post-order: we need each child's final height before
    // we can sum them into the enclosing container's envelope. For a leaf
    // child, getShapeHeightToUse() already returns its intrinsic height.
    const sized = new Set<Class_NodeElement>()
    const sizeContainerRecursive = (container: Class_NodeElement) => {
      if (sized.has(container)) return
      sized.add(container)
      const children = sortByV(collectContainerChildren(container))
      if (children.length === 0) return
      // Recurse first: each container-parent child must have its own
      // envelope size computed before we read its height.
      children.forEach(c => {
        if (isContainerParent(c)) sizeContainerRecursive(c)
      })
      // Sum children heights + écarts (constant lu en direct) + top/bottom margins.
      const stack_h = NodePositioning.totalContainerStackHeight(children, gap_mode, const_gap)
      const envelope_h = stack_h + container.shape_margin_top + container.shape_margin_bottom
      // Width: max of child widths + left/right margins. Container children
      // are supposed to be aligned on the container's x axis in the current
      // layout, so max(child.width) is a safe upper bound.
      const max_child_w = children.reduce(
        (m, c) => Math.max(m, c.getShapeWidthToUse()), 0
      )
      const envelope_w = max_child_w + container.shape_margin_left + container.shape_margin_right
      container.shape_min_height = envelope_h
      container.shape_min_width = envelope_w
    }

    // --- Phase B : top-level column stacking ---
    //
    // Collect every visible, non-exchange, non-container-child node. Group
    // by position_u. For each column, sort by position_v (anchor = current
    // y of the lowest-V node) and stack via stackNodesVertically. Top-level
    // containers participate as normal nodes in this pass — their height
    // is accurate after phase A.
    const top_level_nodes = this.drawingArea.sankey.visible_nodes_list.filter(isTopLevel)
    // Run phase A on every top-level container before we rely on their
    // getShapeHeightToUse() in phase B.
    top_level_nodes
      .filter(isContainerParent)
      .forEach(c => sizeContainerRecursive(c))

    // #1231 — Mode « écart » : le NŒUD DU HAUT de chaque colonne suit EXACTEMENT le mode
    // pourcentage (même centre = médiane_globale + (centre_ref − médiane) × f), puis le
    // reste de la colonne s'empile dessous avec des écarts CONSTANTS. Conséquence voulue :
    // les nœuds du haut (et les colonnes à 1 nœud) sont placés à l'identique du mode %.
    // Réutilise le cadre du mode proportionnel ; capture paresseuse si absente.
    if (this._prop_median_y === undefined || !this._prop_ref_col_sums) {
      this.captureProportionalReference()
    }
    const median = this._prop_median_y
    const factor = this.proportionalFactor(this.proportionalEligibleNodes())

    const columns = new Map<number, Class_NodeElement[]>()
    top_level_nodes.forEach(n => {
      if (scope.type === 'column' && n.position_u !== scope.u) return
      const col = columns.get(n.position_u) ?? []
      col.push(n)
      columns.set(n.position_u, col)
    })
    columns.forEach((column) => {
      if (column.length === 0) return
      const sorted = sortByV(column)
      const top = sorted[0]
      const top_ref = top._prop_center_ref
      let anchor_y: number
      if (median !== undefined && top_ref !== undefined) {
        // Centre du nœud du haut = sa position en mode % ; l'ancre (bord haut) en découle.
        const top_center = median + (top_ref - median) * factor
        anchor_y = top_center - top.getShapeHeightToUse() / 2
      } else {
        anchor_y = top.position_y // fallback : pas de référence (relative/échange/tied)
      }
      NodePositioning.stackNodesVertically(sorted, anchor_y)
    })

    // --- Phase C : top-down positioning of container descendants ---
    //
    // Containers that participated in phase B may now have a different y
    // than they had going in. Their children need to be re-stacked at the
    // new (container.y + margin_top) anchor. Recursive: if a child is
    // itself a container, we descend into it after positioning it.
    const positioned = new Set<Class_NodeElement>()
    const positionContainerChildrenRecursive = (container: Class_NodeElement) => {
      if (positioned.has(container)) return
      positioned.add(container)
      const children = sortByV(collectContainerChildren(container))
      if (children.length === 0) return
      const anchor_y = container.position_y + container.shape_margin_top
      NodePositioning.stackContainerChildren(children, anchor_y, gap_mode, const_gap)
      children.forEach(c => {
        if (isContainerParent(c)) positionContainerChildrenRecursive(c)
      })
    }
    // When the scope is 'column', only descend into top-level containers
    // that live in the target column; the others retain their current
    // (already-valid) descendant layout.
    top_level_nodes
      .filter(isContainerParent)
      .filter(c => scope.type !== 'column' || c.position_u === scope.u)
      .forEach(c => positionContainerChildrenRecursive(c))
  }

  /**
   * Ré-empile les enfants de chaque cadre englobant (`container_mode`) sur la position et la
   * hauteur COURANTES du cadre — pendant de la Phase C de `recomputeParametricLayout`, mais pour
   * les modes de positionnement NON-parametric (absolu, proportionnel, échelle adaptée).
   *
   * Pourquoi : dans ces modes, le placement global (`anchorAbsoluteNodesByCenter`,
   * `anchorProportionalNodes`…) garde le CENTRE de chaque enfant fixe quand sa taille change
   * (changement de datatag/vue/échelle). Des enfants empilés jointivement (écart constant) finissent
   * donc par se chevaucher ou se disperser dès que leur valeur change.
   *
   * Empilement À PLAT des FEUILLES : on collecte les feuilles réelles (pas les sous-cadres) dans
   * l'ordre hiérarchique et on les espace UNIFORMÉMENT — écart identique quel que soit le niveau
   * d'imbrication. Empiler récursivement les sous-cadres ajouterait leurs marges (`shape_margin_top`
   * /`_bottom`) entre deux groupes → l'écart casserait au 2ᵉ niveau. Chaque sous-cadre est ensuite
   * réancré (`reanchorTiedFrame`) pour envelopper ses feuilles ; sa taille suit via `_envelopeSize()`.
   * Le cadre de premier niveau garde sa position (il sert d'ancre).
   *
   * L'écart est résolu par `containerChildGap` : en mode 'constant' il est lu EN DIRECT sur
   * `disaggregation_gap_value` (éditer la valeur ré-englobe au prochain dessin, sans être figé dans
   * les feuilles) ; sinon = `shape_position_dy` persisté. En mode 'keep' rien n'est ré-empilé.
   *
   * À appeler en FIN de placement (après le mode global + `anchorParametricNodesToAbsolute`), pour
   * écraser le re-centrage individuel des feuilles. Nœuds « échange » et enfants invisibles exclus.
   */
  public restackContainerChildren() {
    const mode = this.drawingArea.effective_gap_mode
    // 'keep' = les enfants conservent leur position_y manuelle → aucun ré-empilement.
    if (mode === 'keep') return
    const const_gap = this.drawingArea.disaggregation_gap_value
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']

    const isContainerParent = (n: Class_NodeElement): boolean =>
      n.dimensions_as_parent.some(d => d.container_mode)

    const sortByV = (nodes: Class_NodeElement[]): Class_NodeElement[] =>
      [...nodes].sort((a, b) =>
        a.position_v !== b.position_v ? a.position_v - b.position_v : a.position_y - b.position_y)

    // Enfants directs VISIBLES d'un cadre (dédupliqués sur les dims container_mode).
    const directChildren = (container: Class_NodeElement): Class_NodeElement[] => {
      const seen = new Set<Class_NodeElement>()
      const children: Class_NodeElement[] = []
      container.dimensions_as_parent
        .filter(d => d.container_mode)
        .forEach(dim => {
          dim.children.forEach(child => {
            const c = child as Class_NodeElement
            if (seen.has(c)) return
            seen.add(c)
            if (!c.is_visible) return
            if (echangeTag && c.hasGivenTag(echangeTag)) return
            children.push(c)
          })
        })
      return children
    }

    // Feuilles visibles d'un cadre, dans l'ordre hiérarchique (DFS + tri par v) : on descend dans
    // les sous-cadres et on ne renvoie QUE les vraies feuilles (pas les cadres eux-mêmes).
    const leavesInOrder = (container: Class_NodeElement): Class_NodeElement[] => {
      const out: Class_NodeElement[] = []
      sortByV(directChildren(container)).forEach(c => {
        if (isContainerParent(c)) out.push(...leavesInOrder(c))
        else out.push(c)
      })
      return out
    }

    // Réancre les sous-cadres imbriqués (bottom-up) sur l'enveloppe de leurs feuilles.
    const reanchorSubFrames = (container: Class_NodeElement) => {
      directChildren(container).forEach(c => {
        if (isContainerParent(c)) { reanchorSubFrames(c); c.reanchorTiedFrame() }
      })
    }

    this.drawingArea.sankey.visible_nodes_list
      .filter(isContainerParent)
      .filter(n => !n.dimensions_as_child.some(d => d.container_mode))
      .forEach(container => {
        const leaves = leavesInOrder(container)
        if (leaves.length === 0) return
        // Empilement uniforme des feuilles depuis le haut du cadre de premier niveau.
        let cursor = container.position_y + container.shape_margin_top
        leaves.forEach((leaf, i) => {
          if (i > 0) cursor += NodePositioning.containerChildGap(leaf, mode, const_gap)
          leaf.position_y = cursor
          leaf.applyPosition()
          cursor += leaf.getShapeHeightToUse()
        })
        // Le centre stocké de chaque feuille devient sa position empilée : sinon le prochain
        // anchorByCenterIfResized (mode absolu) tenterait de restaurer un centre périmé.
        leaves.forEach(l => l.captureCenterFromCorner())
        // Les sous-cadres enveloppent leurs feuilles ; le cadre de premier niveau reste ancré.
        reanchorSubFrames(container)
      })
  }

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

  /**
   * Back-calcule `shape_position_dy` de chaque nœud visible depuis sa `position_y`
   * absolue. Pour chaque colonne (groupée par `position_u`), les nœuds sont triés par
   * y et le dy de chacun est déduit du gap avec le nœud précédent. Utilisé à la bascule
   * absolu→paramétrique et en fin de drag pour que le déplacement vertical d'un nœud
   * persiste (sinon `applyPosition` rappelle le nœud à sa position dérivée du dy).
   * Retourne le nombre de chevauchements clampés (raw_dy < 0 → dy = 0).
   */
  public backCalculateShapePositionDyFromY(): number {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    const visible_relevant = this.drawingArea.sankey.visible_nodes_list.filter(n =>
      !echangeTag || !n.hasGivenTag(echangeTag)
    )
    const columns: { [u: number]: Class_NodeElement[] } = {}
    visible_relevant.forEach(n => {
      if (!(n.position_u in columns)) columns[n.position_u] = []
      columns[n.position_u].push(n)
    })
    let overlap_count = 0
    Object.values(columns).forEach(column => {
      column.sort((a, b) => a.position_y - b.position_y)
      for (let i = 1; i < column.length; i++) {
        const prev = column[i - 1]
        const curr = column[i]
        const raw_dy = curr.position_y - (prev.position_y + prev.getShapeHeightToUse())
        if (raw_dy < 0) overlap_count++
        curr.shape_position_dy = Math.max(0, raw_dy)
      }
    })
    return overlap_count
  }

  /**
   * Déduit `position_u` depuis `position_x` pour les nœuds visibles non
   * verrouillés. À appeler explicitement aux endroits où une position absolue
   * vient d'être modifiée (drop de ghost link, fin de drag, contraction). Ce
   * calcul **ne fait plus partie** de `computeParametrization` pour éviter le
   * couplage bidirectionnel u ↔ x qui faisait dériver les colonnes à chaque
   * recalcul (notamment quand l'envelope d'un container modifie x).
   *
   * **Clustering plutôt que rounding indépendant (PR 3 step 5)** : l'ancienne
   * implémentation faisait `u = Math.round(x / dx)` sur chaque nœud
   * indépendamment. Deux nœuds visuellement alignés (à 1-2 px près) tombaient
   * parfois de part et d'autre de la frontière de rounding (ex. x=1898.88 →
   * u=9 et x=1901.47 → u=10 avec dx=200, frontière à 1900), ce qui les
   * affectait à des colonnes différentes sans intention utilisateur.
   *
   * La nouvelle implémentation regroupe d'abord les nœuds en **clusters**
   * (tri par x croissant, puis fusion glissante : un nœud rejoint le cluster
   * courant si son x est à moins de `tolerance` du max-x du cluster), puis
   * calcule un `u` commun par cluster. Conséquences :
   *
   * - Deux nœuds quasi alignés tombent dans le même cluster → même `u`,
   *   toujours, peu importe où ils sont par rapport aux frontières de
   *   rounding.
   * - Un cluster contenant un nœud `u`-verrouillé hérite du `u` du verrou
   *   (le verrou définit la colonne d'autorité).
   * - Un cluster sans verrou calcule son `u` depuis le x moyen du cluster,
   *   ce qui reste proche de l'ancien comportement pour les colonnes
   *   bien-formées.
   *
   * `tolerance` est fixée à 5 % de `dx` (plafonnée à 10 px min), valeur bien
   * au-dessus du bruit pixel et très en dessous d'une demi-colonne.
   */
  public inferPositionUFromX() {
    const dx = this.drawingArea.sankey.styles_dict['default'].shape_position_dx!
    const clusters = this.clusterNodesByX()

    // For each cluster, decide the u once, then apply to every non-locked
    // member. A cluster containing a u-locked node inherits its u; otherwise
    // we compute u from the cluster's mean x.
    for (const cluster of clusters) {
      const locked = cluster.find(n => n.shape_position_u_locked === true)
      let cluster_u: number
      if (locked) {
        cluster_u = locked.position_u
      } else {
        const mean_x = cluster.reduce((sum, n) => sum + n.position_x, 0) / cluster.length
        cluster_u = Math.round(mean_x / dx)
      }
      cluster.forEach(n => {
        if (n.shape_position_u_locked !== true) n.position_u = cluster_u
      })
    }
  }

  /**
   * Nœuds éligibles à une colonne : visibles et non taggés « échange » (ces derniers sont
   * placés par arrangeTrade et n'appartiennent à aucune colonne). Les nœuds `u`-verrouillés
   * restent dans leur cluster — ils en ancrent la valeur.
   */
  private nodesEligibleForColumns(): Class_NodeElement[] {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ?
      this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    return this.drawingArea.sankey.visible_nodes_list.filter(n => {
      if (!n.is_visible) return false
      if (echangeTag && n.hasGivenTag(echangeTag)) return false
      return true
    })
  }

  /**
   * Regroupe les nœuds en colonnes d'après leur `position_x`, par fusion glissante : on trie par
   * x puis on ouvre un nouveau cluster dès que l'écart au max-x du cluster courant dépasse la
   * tolérance. C'est le max-x — et non le x de tête — qui est la bonne référence : une chaîne de
   * nœuds distants deux à deux de moins que la tolérance forme une seule colonne, même si les
   * extrêmes en sont plus éloignés.
   *
   * Clusters retournés dans l'ordre croissant des x.
   */
  private clusterNodesByX(): Class_NodeElement[][] {
    const dx = this.drawingArea.sankey.styles_dict['default'].shape_position_dx!
    const tolerance = Math.max(10, dx * 0.05)

    const eligible = this.nodesEligibleForColumns()
    if (eligible.length === 0) return []

    const sorted = [...eligible].sort((a, b) => a.position_x - b.position_x)
    const clusters: Class_NodeElement[][] = []
    let current: Class_NodeElement[] = []
    let current_max_x = -Infinity
    for (const node of sorted) {
      if (current.length === 0 || node.position_x - current_max_x <= tolerance) {
        current.push(node)
        if (node.position_x > current_max_x) current_max_x = node.position_x
      } else {
        clusters.push(current)
        current = [node]
        current_max_x = node.position_x
      }
    }
    if (current.length > 0) clusters.push(current)
    return clusters
  }

  /**
   * Colonnes ORDINALES (0, 1, 2…) déduites des `position_x` courants. Ne mute rien.
   *
   * Distinct de `inferPositionUFromX`, qui écrit `position_u` en arrondissant `x / dx` : cet
   * arrondi peut attribuer le même `u` à deux colonnes voisines ou en sauter une. Pour décider
   * si un flux « recule », seul l'ORDRE des colonnes compte, et l'ordinal est strictement
   * monotone en x.
   */
  public computeColumnsFromX(): { [node_id: string]: number } {
    const columns: { [node_id: string]: number } = {}
    this.clusterNodesByX().forEach((cluster, index) => {
      cluster.forEach(node => { columns[node.id] = index })
    })
    return columns
  }

  /**
   * sankeyapplication#153 — Recalcul incrémental du statut recyclage après une action de
   * l'utilisateur (typiquement un déplacement de nœud). Un flux dont la cible ne se trouve plus
   * à droite de sa source passe en recyclage, et réciproquement.
   *
   * Ne déplace AUCUN nœud et ne touche ni `position_u` ni `position_v` : une mise en page
   * manuelle est préservée telle quelle. Le verrouillage tri-state de l'utilisateur prime.
   *
   * @returns pour chaque flux dont le statut a changé, sa valeur précédente (pour l'undo).
   */
  public updateRecyclingFromPositions(): { [link_id: string]: boolean } {
    return this.cycles.markRecyclingLinks(
      this.nodesEligibleForColumns(),
      this.computeColumnsFromX()
    )
  }

  /**
  * Computes u,v for nodes in the drawing area
  * Utilise l'algorithme amélioré
  *
  * Quand `use_horizontal_index` est true, `position_u` est recalculé via l'analyse
  * topologique (detectAllCyclesAndOptimize). Sinon, `position_u` est supposé déjà
  * à jour (ne plus dériver depuis x ici — appeler `inferPositionUFromX` côté caller
  * si nécessaire).
  */
  public computeParametrization(use_horizontal_index: boolean) {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ?
      this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    const nodes_to_process = this.drawingArea.sankey.visible_nodes_list.filter(n =>
      !echangeTag || !n.hasGivenTag(echangeTag))

    // Locked nodes keep their existing position_u so the user can pin a node to a
    // specific column across recomputes.
    if (use_horizontal_index) {
      const result = this.detectAllCyclesAndOptimize(nodes_to_process)
      const horizontal_indexes_per_nodes_ids = result.horizontal_indexes

      nodes_to_process.forEach(node => {
        if (node.shape_position_u_locked === true) return
        const node_index = horizontal_indexes_per_nodes_ids[node.id]
        node.position_u = node_index + 1
      })
    }
    const first_level_tagg = this.drawingArea.sankey.level_taggs_list.filter(
      tagg => tagg.activated
    )[0]?.tags_list[0]
    //if (first_level_tagg)
    this.computeParametricV(first_level_tagg as Class_LevelTag)
    // // Sort input and output links for each node based on their connected nodes' position_v
    // this.drawingArea.sankey.nodes_list.forEach(node => {
    //   // Get current links order
    //   const current_links_order = [...node.links_order]

    //   // Sort input links based on source node position_v
    //   const sorted_input_links = node.input_links_list.sort((link1, link2) => {
    //     const source1_v = link1.source.position_v
    //     const source2_v = link2.source.position_v

    //     if (source1_v >= 0 || source2_v >= 0) {
    //       return source1_v - source2_v
    //     } else {
    //       return source2_v - source1_v
    //     }
    //   })

    //   // Sort output links based on target node position_v
    //   const sorted_output_links = node.output_links_list.sort((link1, link2) => {
    //     const target1_v = link1.target.position_v
    //     const target2_v = link2.target.position_v

    //     if (target1_v >= 0 || target2_v >= 0) {
    //       return target1_v - target2_v
    //     } else {
    //       return target2_v - target1_v
    //     }
    //   })

    //   // Create new sorted order: import links first, other links, export links last
    //   const other_links = current_links_order.filter(link =>
    //     !sorted_input_links.includes(link) && !sorted_output_links.includes(link)
    //   )

    //   // Separate import and export links from input/output links
    //   const import_links = sorted_input_links.filter(link =>
    //     echangeTag && link.source.hasGivenTag(echangeTag)
    //   )
    //   const export_links = sorted_output_links.filter(link =>
    //     echangeTag && link.target.hasGivenTag(echangeTag)
    //   )
    //   const regular_input_links = sorted_input_links.filter(link =>
    //     !echangeTag || !link.source.hasGivenTag(echangeTag)
    //   )
    //   const regular_output_links = sorted_output_links.filter(link =>
    //     !echangeTag || !link.target.hasGivenTag(echangeTag)
    //   )

    //   const new_links_order = [
    //     ...import_links,        // Import links first
    //     ...regular_input_links, // Regular input links
    //     ...other_links,         // Other links (like recycling)
    //     ...regular_output_links,// Regular output links
    //     ...export_links         // Export links last
    //   ]

    //   // Use reorganizeIOFromListIds to update the internal order
    //   const new_links_ids = new_links_order.map(link => link.id)
    //   node.reorganizeIOFromListIds(new_links_ids)
    //})
  }
  // Fonction qui calcule les colonnes
  private computeColumns(): { [_: number]: Class_NodeElement[] } {
    const columns: { [_: number]: Class_NodeElement[] } = {}
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ? this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined

    this.drawingArea.sankey.visible_nodes_list.forEach(n => {
      if (n.hasGivenTag(echangeTag!)) {
        return
      }
      if (!(n.position_u in columns)) {
        columns[n.position_u] = [n]
      } else {
        columns[n.position_u].push(n)
      }
    })
    return columns
  }

  // Fonction qui applique le V pour un level tag donné
  public applyVForLevelTag(columns: { [_: number]: Class_NodeElement[] }, tag: Class_LevelTag) {
    Object.values(columns).forEach(column => {
      column.sort((n1, n2) => n1.position_y - n2.position_y)
      let current_v = 0
      column.forEach(n => {
        if (n.shape_position_v_locked !== true) {
          n.position_v = -1
        }
        current_v = this.applyVDesagregate(n, current_v, tag)
      })
    })
    Object.values(columns).forEach(column => {
      column.forEach(n => this.applyVAgregate(n))
    })
  }

  // Fonction principale refactorisée
  public computeParametricV(tag: Class_LevelTag | undefined) {
    const columns = this.computeColumns()

    if (this.drawingArea.sankey.level_taggs_list.length == 0) {
      Object.values(columns).forEach(column => {
        column.sort((n1, n2) => n1.position_y - n2.position_y)
        let current_v = 0
        column.forEach(n => {
          if (n.shape_position_v_locked === true) {
            current_v++
            return
          }
          n.position_v = current_v++
        })
      })
    }

    //this.drawingArea.sankey.level_taggs_list.forEach(tagGroup => {
    this.applyVForLevelTag(columns, tag as Class_LevelTag )
    //})

    this.drawingArea.sankey.sortNodes()
  }

  // Fonction qui compute le V paramétrique pour un tag spécifique
  public computeParametricVForTagg(tag: Class_LevelTag) {
    const columns = this.computeColumns()
    this.applyVForLevelTag(columns, tag)
    this.drawingArea.sankey.sortNodes()
  }
  /**
   * Apply v aggregation for nodes
   */
  public applyVAgregate(node: Class_NodeElement) {
    // const nodeDimParent = node.nodeDimensionAsChild(tagGroup)
    // if (!nodeDimParent) {
    //   return
    // }
    node.dimensions_as_child.forEach(nodeDimParent => {
      if (nodeDimParent.parent.position_v != -1) {
        // v is computed at the first path
        return
      }
      nodeDimParent.parent.position_x = node.position_x
      nodeDimParent.parent.position_y = node.position_y
      nodeDimParent.parent.position_u = node.position_u
      nodeDimParent.parent.position_v = node.position_v
      this.applyVAgregate(nodeDimParent.parent as Class_NodeElement)
    })
  }

  /**
   * Apply v disaggregation for nodes
   */
  public applyVDesagregate(
    node: Class_NodeElement,
    current_v: number,
    tag: Class_LevelTag
  ) {
    if (node.position_v == -1) {
      // v is computed at the first path
      node.position_v = current_v
    }
    let new_current_v = current_v
    const desagregated_nodes = ([...new Set(node.dimensions_as_parent.flatMap(d => d.children))] as Class_NodeElement[]).filter(n => n.hasGivenTag(tag))
    desagregated_nodes.forEach(nn => {


      const shift_y = (desagregated_nodes.length - 1) / 2 * node.shape_position_dy

      let current_y = node.position_y - shift_y
      nn.position_v = -1
      nn.position_x = node.position_x
      nn.position_u = node.position_u
      nn.position_y = current_y
      current_y += nn.getShapeHeightToUse() + nn.shape_position_dy
      if (tag.group.tags_list[tag.group.tags_list.indexOf(tag)])
        new_current_v = this.applyVDesagregate(nn, new_current_v, tag.group.tags_list[tag.group.tags_list.indexOf(tag)] as Class_LevelTag)

    })
    return new_current_v + 1
  }

  // UTILITY METHODS ====================================================================


  /**
   * Reposition visible nodes so that their left/top side is close to a grid line
   */
  protected _arrangeNodesToGrid() {
    const grid_size = this.drawingArea.grid_size
    this.drawingArea.sankey.visible_nodes_list.forEach(node => {
      const shift_x = node.position_x - (node.position_x % grid_size)
      const shift_y = node.position_y - (node.position_y % grid_size)
      node.setPosXY(shift_x, shift_y)
    })
    Object.values(this.drawingArea.sankey.containers_dict).forEach(container => {
      if (container.tied_to_nodes) return
      container.position_x = container.position_x - (container.position_x % grid_size)
      container.position_y = container.position_y - (container.position_y % grid_size)
      container.draw()
    })
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
