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

// External imports
import * as d3 from '../d3Modules'

import type {
  Class_DataTag,
  Class_FluxTag,
  Class_ProtoTag,
  Class_Tag,
} from '../types/Tag'
import type { Class_DataTagGroup, Class_FluxTagGroup, Class_TagGroup } from '../types/TagGroup'
import { flowPainterOf } from '../types/TagGroup'
import { isGeneratedMemberId, parseGeneratedId } from './GeneratedMemberMark'
import { OTHERS_COLOR, OTHERS_EXCEPTION_SHARE_PCT, OTHERS_ID } from '../Algorithms/DimensionOthers'
import { ordonnerMembres } from '../Algorithms/DimensionMemberOrder'
// os#1511 — import de VALEUR vers un module qui ne nous importe qu'en TYPE : les imports de type
// sont effacés à la compilation, il n'y a donc pas de cycle à l'exécution.
import { membersOfGeneratedNode } from '../Algorithms/DimensionDisaggregation'

import { Type_BaseElementPosition, link_data_label, link_template_label } from '../types/Utils'
import type { Type_Origin } from '../types/Origin'
import { Class_ElementValueTree, Class_LinkValue, Class_ElementTaggedValue, rememberInValueScope } from './LinkValues'
import { LinkDrawShape } from './LinkDrawShape'
import { LinkControlPoints } from './LinkControlPoints'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_NodeElement } from './Node'
import type { Class_NodeDimension } from './NodeDimension'
import { Type_Side, getNameLabelValues, Type_NameLabelSource, Type_Orientation } from './ElementsAttributesConfig'
import { formatDigits, formatElementValue } from './ValueFormatting'
import { resolveLinkOrientation } from './linkOrientation'
import { transferAnchorLock } from './anchorLockTransfer'
import { clampLinkThickness } from './flowThickness'
import { effectiveOpacity } from './elementOpacity'
import { shadeAmongSiblings } from './splitBandColor'
import { topLayerDefining } from './tagStyles'
import { domSafeId } from './domSafeId'
import { resolveScaleCarrierTag } from '../types/ScaleResolution'
import { countLinkDraw } from '../types/DrawCounters'
import { Class_LinkAttribute } from './Element'
import { LinkDrawNameLabel, LinkDrawValueLabel } from './DrawLabel'
import { Class_ApplicationData } from '../types/ApplicationData'
import { LinkStyle } from './ElementStyle'
import {
  openPresentationFor, opensPresentationOnClick, canPresentTooltip,
  matchesPresentationTrigger,
  schedulePresentationHover, schedulePresentationHoverClose, closePresentationTooltip
} from '../components/panels/presentation/openPresentation'

/** os#1511 — une bande d'une dimension dessinée en bandes, avant sa part relative (`share`). */
export type Type_DimensionBand = {
  id: string, px: number, color: string | null, value: number, opacity?: number,
  folded?: { id: string, value: number }[]
}

const side_order: { [_ in Type_Side]: number } = {
  'right': 0,
  'bottom': 1,
  'left': 2,
  'top': 3
}

// export const default_shape_type_is_gradient = false
// SPECIFIC FUNCTIONS ********************************************************************

export function defaultLinkId(
  source: Class_NodeElement,
  target: Class_NodeElement
) {
  // coherent with code in python (Constructor of flux)
  return source.id + '---' + target.id
}



/**
 * Allows to sort links alphabethically per id
 * @export
 * @param {(Class_LinkElement | Class_ElementStyle)} a
 * @param {(Class_LinkElement | Class_ElementStyle)} b
 * @return {*}
 */
export function sortLinksElementsByIds(
  a: Class_LinkElement,
  b: Class_LinkElement
) {
  if (a.id > b.id) return 1
  else if (a.id < b.id) return -1
  else return 0
}

/**
 * Allows to sort links of a given node by comparing their source / target relatives positions
 * @export
 * @param {Class_LinkElement} link_a
 * @param {Class_LinkElement} link_b
 * @param {Class_NodeElement} node
 * @return {*}
 */
export function sortLinksElementsByRelativeNodesPositions(
  link_a: Class_LinkElement,
  link_b: Class_LinkElement,
  node: Class_NodeElement
) {
  // Check relation between reference node and the two links
  const is_node_source_for_link_a = (link_a.source === node)
  const is_node_target_for_link_a = (link_a.target === node)
  const is_node_source_for_link_b = (link_b.source === node)
  const is_node_target_for_link_b = (link_b.target === node)
  // Failsafe
  if (
    (!is_node_source_for_link_a && !is_node_target_for_link_a) ||
    (!is_node_source_for_link_b && !is_node_target_for_link_b)
  )
    return 0 // Dont move - somethings is wrong
  // Get nodes that we need to compare
  let node_a: Class_NodeElement
  let node_b: Class_NodeElement
  let side_a: Type_Side
  let side_b: Type_Side
  if (is_node_source_for_link_a) {
    node_a = link_a.target
    side_a = link_a.source_side
  }
  else {
    node_a = link_a.source
    side_a = link_a.target_side
  }
  if (is_node_source_for_link_b) {
    node_b = link_b.target
    side_b = link_b.source_side
  }
  else {
    node_b = link_b.source
    side_b = link_b.target_side
  }
  // Side check : Node position comparaison if links are on the same side ?
  if (side_a === side_b) {
    // For "horizontal" sides
    if (side_a === 'right' || side_a === 'left') {
      if (node_a.position_y > node_b.position_y)
        return 1
      else if (node_a.position_y < node_b.position_y)
        return -1
      else
        return 0
    }
    // For "vertical" sides
    else {
      if (node_a.position_x > node_b.position_x)
        return 1
      else if (node_a.position_x < node_b.position_x)
        return -1
      else
        return 0
    }
  }
  // Otherwise, use side "priority"
  else {
    if (side_order[side_a] < side_order[side_b])
      return -1
    else
      return 1
  }
}


/**
 * SA#541 — étiquettes portées par une valeur : celles de la feuille et celles de ses valeurs
 * coordonnées (#285), comme le fait `Class_ElementValue.hasGivenTag`.
 */
function valueTags(value: Class_LinkValue | null): Class_Tag[] {
  if (!value) return []
  // SA#580 - y compris les etiquettes que les groupes par regles attribuent a la valeur
  const tags = [...value.effective_flux_tags_list]
  value.tagged_values_list.forEach(tv => tags.push(...tv.tags_list))
  return tags
}

/**
 * Class that define how to display a link element and how to interact with it
 *
 * @class Class_LinkElement
 */
export class Class_LinkElement extends Class_LinkAttribute {
  // SA#487 / SA#507 — les intentions qu'une cellule Valeur peut porter, et la
  // notation employée pour l'écrire. Ce sont des CLÉS partagées avec le parser
  // et le moteur (io_excel_constants.DATA_VALUE_OBJECTIVE_*) : elles ne se
  // traduisent pas, et ne se renomment pas à la légère.
  public static readonly VALUE_OBJECTIVE_MIN = 'min'
  public static readonly VALUE_OBJECTIVE_MAX = 'max'
  public static readonly VALUE_OBJECTIVE_APPROACH = 'target'

  private _position_ending: Type_BaseElementPosition

  private _tooltip_text: string = ''

  private _is_unit_reference = false

  // Visibility memorized - source & target
  protected _source_visibility_fingerprint: string
  protected _target_visibility_fingerprint: string
  protected _are_source_and_target_displayed: boolean | undefined = undefined

  // Visibility memorized - flux tags
  protected _flux_tags_fingerprint: string = ''
  protected _are_related_flux_tags_selected: boolean | undefined = undefined

  // Visibility memorized - values
  protected _datatags_fingerprint: string = ''
  protected _is_not_zero: boolean | undefined = undefined

  // PRIVATE ATTRIBUTES =================================================================
  private _link_shape: LinkDrawShape
  protected _link_control_points: LinkControlPoints
  protected _link_draw_label: LinkDrawNameLabel
  protected _link_draw_value: LinkDrawValueLabel
  protected _link_draw_icon: LinkDrawNameLabel

  private _source: Class_NodeElement
  private _target: Class_NodeElement
  private _values: Class_ElementValueTree | Class_LinkValue
  // Pointe de flèche côté cible (shape_is_arrow) et côté source (shape_arrow_at_source),
  // indépendantes : un flux peut en porter zéro, une ou deux. Chacune est calculée par
  // le nœud correspondant (cible / source) puis stockée ici.
  private _arrow_shape: string | undefined
  private _arrow_shape_source: string | undefined
  /**
   * os#1374 — Époque d'éventail à laquelle chaque pointe a été posée (cf.
   * `Class_DrawingArea.arrow_epoch`). `-1` = jamais posée.
   */
  private _arrow_stamp = -1
  private _arrow_stamp_source = -1
  /**
   * os#1384 — ANCRE dont chaque pointe a été déduite, à côté de l'époque. L'époque seule ne
   * suffit pas : elle ne change qu'à `Class_Sankey.draw`, alors qu'À L'INTÉRIEUR d'une passe les
   * ancres bougent encore (un nœud placé après la cible, une migration de coordonnées après le
   * premier dessin). Une pointe posée avant que l'ancre soit connue portait le numéro de l'époque
   * courante, survivait donc à l'invalidation, et le `draw()` qui avait la bonne ancre réutilisait
   * la forme périmée — mesuré à l'import e!Sankey « Building Energy Footprint » : pointe centrée
   * sur y = 0 au lieu de 679,647, corps du flux juste.
   */
  private _arrow_stamp_anchor = ''
  private _arrow_stamp_source_anchor = ''
  // Source notch (negative arrow) chevron, computed at node level and shared by
  // every link leaving the same node side (so several links draw a single notch).
  private _source_notch_shape: string | undefined

  // Boolean var only used when enlarging thickness when mouse hovering link
  private _artifical_enlargement: boolean = false
  // Bande survolée (id de `tagged_value_bands`), transitoire : l'info-bulle ne montre qu'elle.
  private _hovered_band_id: string | undefined = undefined
  public get hovered_band_id(): string | undefined { return this._hovered_band_id }

  // Transient marker (not persisted) — true if this link was created as part of
  // a lateral expansion (parent ↔ child of an expanded NodeDimension).
  // Used by contract() to know which links to delete when collapsing back.
  private _is_expansion_link: boolean = false
  // FLUX ÉCLATÉ (cf. Class_NodeDimension.split_links) : ce flux parent↔X est la bande d'UN
  // enfant du parent ; `_split_origin` est le flux enfant↔X qu'il reproduit (valeurs copiées),
  // `_split_child` l'enfant (sa couleur, son nom). Transitoires : jamais enregistrés.
  private _split_origin: Class_LinkElement | null = null
  private _split_child: Class_NodeElement | null = null
  // Flux agrégé parent↔X remplacé à l'écran par les bandes de ses enfants : masqué tant que le
  // parent est en flux éclatés. Transitoire (recalculé par `Node.refreshSplitHiding`).
  private _hidden_by_split: boolean = false
  // #411 — pourquoi ce flux existe. Renseigné par le parser (voie de création,
  // onglet, ligne, déclencheur) et restitué depuis le JSON. `undefined` = le
  // fichier ne le dit pas : l'inspecteur l'annonce comme inconnu, jamais comme
  // une saisie de l'utilisateur.
  private _origin: Type_Origin | undefined = undefined
  // #426 — index de l'explication « d'où vient ta valeur » commune à toutes les
  // combinaisons d'étiquettes de ce flux, dans le catalogue du diagramme. Une
  // cellule qui répond autre chose porte le sien (cf. Class_LinkValue).
  private _determination: number | null = null

  // I/O anchor lock & delta — per link end ('source' / 'target').
  // The "anchor" of a link is its attachment point on a node side; the side
  // is normally re-derived from node relative positions (cf. source_side /
  // target_side getters). When the user manually arranges the I/O order
  // (dragging the handle, or the arrows in the "Ordre des flux E/S" menu)
  // the anchor is locked: its side is frozen so moving the *opposite* node
  // no longer flips it. Locks are released by any automatic layout pass
  // (Class_NodePositioning.computeAutoSankey, Node.reorganizeIOLinks).
  // os#1510 — NORMALE SORTANTE de l'ancre quand la source accroche en radial : posée par le
  // nœud à chaque mise en page (cf. Node.updateLinksPositions), jamais persistée. `null` =
  // ancrage par côté, le tracé part le long de l'axe comme depuis toujours.
  private _source_anchor_normal: { x: number, y: number } | null = null
  // os#1510 lot 2 — la même chose à l'ARRIVÉE : normale sortante du contour de la cible.
  private _target_anchor_normal: { x: number, y: number } | null = null
  private _source_side_locked: boolean = false
  private _target_side_locked: boolean = false
  private _source_side_frozen: Type_Side | undefined = undefined
  private _target_side_frozen: Type_Side | undefined = undefined
  // Extra gap (px) inserted *before* this end's anchor in the node-side
  // cumulative packing, so anchors arriving on a node can be spaced out.
  private _source_anchor_delta: number = 0
  private _target_anchor_delta: number = 0

  /**
   * _scaleValueToPx transform a value to a proportional size in px according to data scale
   *
   * @private
   * @memberof Class_DrawingArea
   */
  private _scaleValueToPx = d3.scaleLinear()
    .domain([0, 1])
    .range([0, 100])

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_LinkElement.
   * @param {string} id
   * @param {Class_DrawingArea} drawing_area
   * @memberof Class_LinkElement
   */
  constructor(
    id: string,
    source: Class_NodeElement,
    target: Class_NodeElement,
    drawing_area: Class_DrawingArea
  ) {
    const link_style = drawing_area.sankey.styles_dict[LinkStyle]
    super(id, drawing_area, 'g_elements_sankey', link_style)

    this._link_control_points = new LinkControlPoints(this, drawing_area)
    //this._link_control_points_internal = this._link_control_points.createInternalAccess()
    this._link_shape = new LinkDrawShape(this, this._link_control_points)
    this._link_draw_label = new LinkDrawNameLabel(this, this._link_control_points, 'name_label')
    this._link_draw_value = new LinkDrawValueLabel(this, this._link_control_points)
    this._link_draw_icon = new LinkDrawNameLabel(this, this._link_control_points, 'icon')

    // Values
    this._values = this.createValue(this)
    // os#1511 — un flux ENGENDRÉ est un POINT du cube, pas un cube. Il naît d'un choix de
    // coordonnées, sa valeur est donc déjà résolue : il porte un scalaire, et déplier les
    // dimensions ne lui apporterait rien.
    //
    // Ce n'est pas qu'une économie de principe. L'arbre est DENSE — un enfant par membre, à
    // chaque étage —, donc sur le SOCLE « Pays partenaires » (148 produits × 263 pays × 3
    // années) un flux neuf alloue 116 772 feuilles, soit 318 Mo. La désagrégation en crée un
    // par membre : une vingtaine au chargement, et le navigateur mourait avant d'afficher quoi
    // que ce soit. Mesuré le 28/09.
    if (!isGeneratedMemberId(id)) {
      drawing_area.sankey.data_taggs_list
        .forEach(data_tagg => {
          this._values = this._values.expand(data_tagg as Class_DataTagGroup)
        })
    }
    // Source
    this._source = source
    this._source_visibility_fingerprint = source.visibility_fingerprint
    this._target = target
    this._target_visibility_fingerprint = target.visibility_fingerprint
    if (this.id != 'ghost_link') {
      drawing_area.list_g_element.push(this.id)
    }

    this._position_ending = { x: 0, y: 0 }

    this.source.addOutputLink(this)
    this.target.addInputLink(this)
    if (!this.sankey.drawing_area.bypass_redraws) {
      this._link_control_points.computeControlPoints()
    }
    // Tous les helpers sont assignés : on réactive les actions des setters.
    // Cf. Class_ProtoElement._suspend_actions.
    this._suspend_actions = false
    this.draw()
  }

  public createValue(
    parent: Class_ElementValueTree | Class_LinkElement
  ) {
    return new Class_LinkValue(parent as Class_LinkElement)
  }

  // CLEANING ===========================================================================

  /**
   * Define deletion behavior
   * @memberof Class_LinkElement
   */
  protected cleanForDeletion() {
    if (this._clickTimer) {
      clearTimeout(this._clickTimer)
      this._clickTimer = null
    }
    if (this._source !== this._target) {
      // Unref self from source node
      this._source.deleteOutputLink(this)
      // Unref self from target node
      this._target.deleteInputLink(this)
    } else {
      // Special case when link have the same source & target
      this._source.deleteRecyclingLinkOnSameNode(this)
    }
    // Delete control points
    this._link_control_points.cleanForDeletion()
    // Remove reference of self in style
    this.style.forEach(s => s.removeReference(this))
    // Delete related values
    this._values.delete()
  }

  // Anchor deltas are plain instance fields (not _storage attributes), so the
  // generic copyAttrFrom would drop them — carry them explicitly so view sync
  // (UpdateFrom) and full copies keep the per-anchor gaps.
  public copyAttrFrom(_: Class_LinkElement): void {
    super.copyAttrFrom(_)
    this.source_anchor_delta = _.source_anchor_delta
    this.target_anchor_delta = _.target_anchor_delta
  }

  // I/O anchor lock ("cadenas" of the "Ordre des flux E/S" menu). Carried with
  // the link ORDER (Node.keepLinkOrderingFrom), not with copyAttrFrom : the lock
  // and the order it pins are one setting, transferred together when a layout is
  // re-applied so the locked arrangement survives the next reorg (issue #202).
  // Both the flag AND the frozen side are copied — see transferAnchorLock.
  public copyAnchorLockFrom(_: Class_LinkElement): void {
    const next = transferAnchorLock<Type_Side>({
      source_side_locked: _._source_side_locked,
      source_side_frozen: _._source_side_frozen,
      target_side_locked: _._target_side_locked,
      target_side_frozen: _._target_side_frozen,
    })
    this._source_side_locked = next.source_side_locked
    this._source_side_frozen = next.source_side_frozen
    this._target_side_locked = next.target_side_locked
    this._target_side_frozen = next.target_side_frozen
  }

  //public copyFrom(_: Class_ProtoElement<typeof ALL_ATTRIBUTES_CONFIG>) {
  /**
   * os#1440 — `node_map` : COMMENT RETROUVER LES EXTRÉMITÉS, quand elles ont changé de nom.
   *
   * Les deux blocs ci-dessous résolvent les extrémités par l'IDENTIFIANT de la source, cherché
   * dans le diagramme d'ARRIVÉE, et CRÉENT le nœud quand il n'y est pas. C'est juste dans leur
   * cas d'origine — appliquer une mise en page, synchroniser une vue —, où les deux diagrammes
   * partagent leurs identifiants : ce qui manque est un nœud qu'il faut effectivement ajouter.
   *
   * Cela devient faux dès que la copie RENOMME ses nœuds, ce que fait toute duplication
   * (`id + '_copy'`). Dans un même document le défaut ne se voyait pas : l'identifiant d'origine
   * y existe toujours, la recherche le trouve, et l'appelant écrase aussitôt les deux extrémités
   * par les bonnes copies. D'un document à l'autre il n'existe pas, et la ligne 419 plantait
   * alors dans le document d'accueil un nœud parasite par extrémité — orphelin, jamais effacé
   * par l'annulation qui ne connaît que les copies, et portant le nom d'un nœud de l'autre
   * fichier. Un collage de deux nœuds reliés en déposait quatre.
   *
   * `node_map` dit « telle extrémité de la source EST telle copie ici », et la question de la
   * création ne se pose plus. Omis, le comportement d'avant est inchangé.
   */
  public copyFrom(_: Class_LinkElement, node_map?: Map<string, Class_NodeElement>) {
    super.copyFrom(_)
    // Source relations
    if (this._source.id !== _._source.id) {
      let source = node_map?.get(_._source.id) ?? this.sankey.nodes_dict[_._source.id] as Class_NodeElement
      if (source === undefined) {
        source = this.sankey.addNewNode(_._source.id, _._source.name) as Class_NodeElement
        // source.copyFrom(_._source)
      }
      this.source = source
    }
    // target relations
    if (this._target.id !== _._target.id) {
      let target = node_map?.get(_._target.id) ?? this.sankey.nodes_dict[_._target.id] as Class_NodeElement
      if (target === undefined) {
        target = this.sankey.addNewNode(_._target.id, _._target.name) as Class_NodeElement
        // target.copyFrom(_._target)
      }
      this.target = target
    }
    //this._display.style = _._display.style

    // Local attributes
    this._position = structuredClone(_._position)
    this._position_ending = structuredClone(_._position_ending)
    // this._position_x_value = _._position_x_value
    // this._position_y_value = _._position_y_value
    // this._position_offset_value = _._position_offset_value
    // this._position_x_name = _._position_x_name
    // this._position_y_name = _._position_y_name
    // this._position_offset_name = _._position_offset_name
    // Tooltips
    this.tooltip_text = _.tooltip_text
    // Values
    if (_._values instanceof Class_LinkValue) {
      this._values = this.createValue(this)
      this._values.copyFrom(_._values)
    }
    else if (_._values instanceof Class_ElementValueTree) {
      const first_data_tag_group = this.sankey.data_taggs_dict[_._values.data_tag_group.id] as Class_DataTagGroup
      if (first_data_tag_group) {
        this._values = new Class_ElementValueTree(this, first_data_tag_group)
        this._values.copyFrom(_._values)
      }
    }
  }

  public copyValues(_: Class_LinkElement) {
    // Values
    if (_._values instanceof Class_LinkValue) {
      this._values = this.createValue(this)
      this._values.copyFrom(_._values)
    }
    else if (_._values instanceof Class_ElementValueTree) {
      const first_data_tag_group = this.sankey.data_taggs_dict[_._values.data_tag_group.id] as Class_DataTagGroup
      if (first_data_tag_group) {
        this._values = new Class_ElementValueTree(this, first_data_tag_group)
        this._values.copyFrom(_._values)
      }
    }
  }

  public addValues(_: Class_LinkElement) {
    // Values
    if (_._values instanceof Class_LinkValue) {
      //this._values = this.createValue(this)
      (this._values as Class_LinkValue).addFrom(_._values)
    }
    else if (_._values instanceof Class_ElementValueTree) {
      const first_data_tag_group = this.sankey.data_taggs_dict[_._values.data_tag_group.id] as Class_DataTagGroup
      if (first_data_tag_group) {
        //this._values = new Class_ElementValueTree(this, first_data_tag_group)
        (this._values as Class_ElementValueTree).addFrom(_._values)
      }
    }
  }


  // PUBLIC METHODS =====================================================================

  public unDraw() {
    super.unDraw()
    this._link_control_points.unDrawControlPoints()
    this._invalidateDrawCaches()
  }

  /**
   * OS#1246 — caches de géométrie du flux recalculés paresseusement à chaque
   * draw (cf. _drawArrow / _drawSourceNotch : recalcul seulement si undefined).
   * Doit être vidé à chaque (re)dessin pour suivre les changements de position/
   * taille des nœuds ; appelé par draw() (réutilisation du <g>) ET par unDraw().
   */
  protected _invalidateDrawCaches() {
    // os#1374 — Une pointe posée pendant l'époque d'éventail courante n'est PAS périmée : la
    // vider ferait redemander au nœud l'éventail entier de son côté, alors qu'il vient de le
    // calculer pour ces positions-là. Hors d'un `Class_Sankey.draw` (`keeps_arrow_caches` faux),
    // on vide comme avant — c'est ce que réclament le glisser-déposer et `refreshArrow`.
    // os#1384 — ...À CONDITION qu'elle ait été déduite de l'ancre COURANTE. L'époque ne change
    // qu'entre deux passes ; l'ancre, elle, se fixe PENDANT la passe. Comparer les deux garde le
    // gain d'os#1374 (une fois les positions posées, l'ancre ne bouge plus et le cache tient)
    // sans laisser survivre une pointe calculée trop tôt.
    const da = this.sankey.drawing_area
    const keeps = da.keeps_arrow_caches
    // Court-circuit voulu : la clé d'ancre n'est calculée que si l'époque concorde déjà.
    const target_fresh = keeps && this._arrow_stamp === da.arrow_epoch &&
      this._arrow_stamp_anchor === this._targetAnchorKey()
    const source_fresh = keeps && this._arrow_stamp_source === da.arrow_epoch &&
      this._arrow_stamp_source_anchor === this._sourceAnchorKey()
    if (!target_fresh) this._arrow_shape = undefined
    if (!source_fresh) this._arrow_shape_source = undefined
    this._source_notch_shape = undefined
  }

  /**
   * os#1384 — Ancre RÉELLEMENT consommée par l'éventail, côté cible puis côté source : ce sont
   * les mêmes valeurs que `Class_NodeElement.drawLinksArrow` lit pour placer l'apex
   * (`bandTransversePos`), donc deux pointes d'ancres identiques ont la même géométrie.
   */
  //
  // Lue sur le NŒUD (`getInputLinkEndingPoint` / `getOutputLinkStartingPoint`, posés par
  // `updateLinksPositions`), pas sur la copie que ce flux en garde : `_draw` ne recopie cette
  // copie qu'au dessin du flux, donc un éventail calculé pour un nœud avant le dessin de ses
  // autres flux se stampait avec leur ancre PÉRIMÉE, et chacun de ces flux, en se dessinant,
  // voyait une ancre « nouvelle » et redemandait l'éventail entier. Mesuré : un éventail par
  // flux (2 616 pour 2 616 flux sur SOCLE Toutes filières), soit le défaut qu'os#1374 corrigeait.
  private _targetAnchorKey(): string {
    const p = this.target?.getInputLinkEndingPoint(this)
    return p ? p.x + '|' + p.y : this.position_x_end + '|' + this.position_y_end
  }

  private _sourceAnchorKey(): string {
    const p = this.source?.getOutputLinkStartingPoint(this)
    return p ? p.x + '|' + p.y : this.position_x_start + '|' + this.position_y_start
  }

  /**
   * OS#1246 — un <g class="gg_links"> peut exister sans tracé : il est pré-créé
   * par l'enter du data-join, et c'est le nœud source/cible qui le remplit
   * (updateLinksPositions). Le contenu qui fait foi est la forme posée par
   * LinkDrawShape.drawShape : `.link_shape` (forme pleine) ou `.link_path`
   * (simple trait), selon le mode de tracé.
   */
  protected _hasDrawnContent(): boolean {
    const node = this.d3_selection?.node()
    if (!node) return false
    return node.querySelector('.link_shape, .link_path') !== null
  }

  public drawShape() {
    if (!this._link_shape) return
    this._link_shape.drawShape()
    this._applySourceNotchMask()
    this._orderD3Elements()
  }

  public drawArrow() {
    if (!this.d3_selection) return
    this._drawArrow()
    this._applySourceNotchMask()
    this._orderD3Elements()
  }

  /**
   * OS#1302 — action des attributs d'apparence de pointe (shape_arrow_standalone,
   * shape_arrow_spike_*). La géométrie de pointe est calculée paresseusement et
   * mise en cache (_arrow_shape[_source]) : la redessiner sans invalider le cache
   * ne fait que re-render la forme périmée. On vide donc le cache avant de
   * redessiner ; _drawArrow rappelle alors le nœud pour recalculer tout l'éventail
   * du côté (les pointes voisines suivent le changement de somme). Cf. le bug où
   * changer un réglage de pointe ne mettait pas à jour le dessin.
   */
  public refreshArrow() {
    if (!this.d3_selection) return
    this._arrow_shape = undefined
    this._arrow_shape_source = undefined
    this._drawArrow()
    this._applySourceNotchMask()
    this._orderD3Elements()
  }

  public drawSourceNotch() {
    if (!this.d3_selection) return
    this._drawSourceNotch()
    this._orderD3Elements()
  }

  public drawValueLabel() {
    if (this.drawing_area.bypass_redraws) return
    if (!this._link_draw_value) return
    // En mode stick, la valeur se cale sur la bbox du <text> du name_label :
    // on rafraîchit le nom d'abord pour avoir une bbox à jour.
    if (this.value_label_stick_to_label && this._link_draw_label) {
      this._link_draw_label.drawGenericLabel()
    }
    this._link_draw_value.drawGenericLabel()
    if (this.value_label_stick_to_label && this._link_draw_label) {
      this._link_draw_label.refreshStickLayout()
    }
    // #285 — les labels de bande vivent dans le repère zoomé (dessinés au
    // drawShape) : le refresh de labels (zoom, verrou de police, menu de
    // l'étiquette de valeur, seuil) ne les recrée pas, on les rhabille ici.
    this.refreshBandLabels()
    this._orderD3Elements()
  }

  /** #285 — filtre de taille appliqué PAR BANDE (pas sur le total du flux) :
   *  en mode pixel, l'épaisseur écran de la bande ; en mode valeur, sa valeur. */
  public bandLabelPassesFilter(band_value: number, band_px: number): boolean {
    const da = this.drawing_area
    return da.filter_unit === 'pixel'
      ? (!(da.filter_label_px > 0) || band_px * da.getZoomScale() >= da.filter_label_px)
      : band_value >= da.filter_label
  }

  /** #285 — habille les labels de bande déjà présents dans le DOM (posés sans style par
   *  LinkDrawShape.drawTaggedValueBands, qui y range valeur, épaisseurs et unité en data-band-*),
   *  sans les reconstruire. Une étiquette de bande EST l'étiquette de valeur du flux, découpée :
   *  elle en suit tous les réglages — format des nombres, unité, police compensée du zoom, gras,
   *  italique, majuscules, couleur verrouillée, « Masquer si ça dépasse » — et le seuil « Lib. ». */
  public refreshBandLabels() {
    const labels = this.d3_selection?.selectAll<SVGTextElement, unknown>('.link_band_label')
    if (!labels || labels.empty()) return
    const lv = getNameLabelValues(this, 'value_label')
    const fs = (lv.font_size ?? 12) * (this.drawing_area.font_compensation ?? 1)
    // Unité du flux si elle est visible (value_label_unit_visible) ; une bande d'un groupe de
    // type unité porte la sienne, déjà dans son unité : précision seule, pas de conversion.
    const flux_unit = this.value_label_unit_visible ? this.unit_name('value_label') : ''
    labels
      .attr('font-size', fs)
      .attr('font-family', lv.font_family)
      .attr('font-weight', lv.bold ? 'bold' : 'normal')
      .attr('font-style', lv.italic ? 'italic' : 'normal')
      .style('text-transform', lv.uppercase ? 'uppercase' : 'none')
      .attr('fill', lv.color_sustainable ? lv.color : '#000')
      .text((_, i, nodes) => {
        const el = nodes[i]
        const value = Number(el.getAttribute('data-band-value'))
        const own_unit = el.getAttribute('data-band-own-unit') === 'true'
        const text = own_unit ? formatDigits(value, lv) : formatElementValue(value, this)
        const unit = own_unit ? (el.getAttribute('data-band-unit') ?? '') : flux_unit
        return unit ? `${text} ${unit}` : text
      })
      .style('display', (_, i, nodes) => {
        const el = nodes[i]
        const passes = this.bandLabelPassesFilter(
          Number(el.getAttribute('data-band-value')), Number(el.getAttribute('data-band-px')))
        const fits = !lv.prune_if_unfitting || fs <= Number(el.getAttribute('data-band-thickness'))
        return passes && fits ? 'inline' : 'none'
      })
  }

  /**
   * #377 — objet de dessin du LIBELLÉ du flux. Exposé pour que le label de valeur puisse
   * connaître la hauteur déjà consommée par le libellé (règle « libellé prioritaire, puis
   * valeur »). Lecture seule : l'instance est créée au constructeur et ne change jamais.
   */
  public get name_label_drawer(): LinkDrawNameLabel {
    return this._link_draw_label
  }

  public drawNameLabel() {
    if (this.drawing_area.bypass_redraws) return
    if (!this._link_draw_label) return
    this._link_draw_label.drawGenericLabel()
    // Quand stick_to_label est on, la valeur se positionne par rapport au
    // name_label : redessiner la valeur puis recaler le bloc combiné.
    if (this.value_label_stick_to_label && this._link_draw_value) {
      this._link_draw_value.drawGenericLabel()
      this._link_draw_label.refreshStickLayout()
    }
    this._orderD3Elements()
  }

  public drawWithNodes() {
    if (this.source && this.target) {
      this.source.draw()
      this.target.draw()
    }
  }

  public drawAsSelected() {
    this._link_control_points.drawControlPoint()
    // Tout changement de sélection au niveau élément (clic sur le flux)
    // clear la sub-sélection du label — l'utilisateur doit cliquer sur
    // le <text> d'un label pour faire (ré)apparaître les poignées.
    this.selected_label_prefix = null
    // Poignées dans `g_handlers` (Class_Handler) — refresh appelle unDraw si
    // le label n'est plus sub-sélectionné.
    this._link_draw_label?.refreshLabelResizeHandles()
    this._link_draw_value?.refreshLabelResizeHandles()
    this._link_draw_icon?.refreshLabelResizeHandles()
  }

  /**
   * Reverse source with target
   * @memberof Class_LinkElement
   */
  public inverse() {
    // Save prev source & target + remove link/nodes relationships
    const tmp_target = this._target
    tmp_target.removeInputLink(this) // remove link from curr IO dict
    const tmp_source = this._source
    tmp_source.removeOutputLink(this) // remove link from curr IO dict
    // Set source & target attributes
    this._source = tmp_target
    this._target = tmp_source
    // Set to recompute visibility from nodes after
    this._are_source_and_target_displayed = undefined
    // add link to corresponding IO
    this._source.addOutputLink(this)
    this._target.addInputLink(this)
    // Draw
    this.drawElements()
  }

  /**
   * Check if given tag is referenced by link's data
   * @param {Class_Tag} tag
   * @return {*}
   * @memberof Class_LinkElement
   */
  public hasGivenTag(tag: Class_Tag) {
    // SA#553 - l'etiquette generee d'un groupe de NOEUDS n'est jamais portee par un flux
    if (tag?.is_untagged && !(tag.group.id in this.sankey.flux_taggs_dict)) return false
    const value = this.value
    if (value)
      return value.hasGivenTag(tag)
    return false
  }

  /**
   * SA#541 — styles imposés par les étiquettes de la VALEUR AFFICHÉE (feuille de la sélection
   * courante d'étiquettes de données) : la fiabilité change avec l'année ou l'unité (778 flux sur
   * 800 du Lait SOCLE). `null` tant que l'arbre de valeurs n'existe pas.
   */
  protected override computeTagStyleLayers() {
    if (this._values === undefined) return null
    const carried = valueTags(this.value)
    return this.resolveTagStyleLayers(
      this.sankey.tagGroupsInPriorityOrder('flux_taggs'),
      tag => carried.includes(tag as Class_Tag)
    )
  }

  /** SA#541 — changer d'année ou d'unité change la valeur affichée, donc ses étiquettes. */
  protected override tagStyleSelectionKey() {
    return this.sankey.data_tags_fingerprint
  }

  public tagsUpdated() {
    this._are_related_flux_tags_selected = undefined
  }

  /**
   * Add and cross-reference a Tag with a link
   * @param {Class_Tag} tag
   * @memberof Class_LinkElement
   */
  public addTag(tag: Class_Tag) {
    const value = this.value
    if (value) {
      value.addTag(tag)
      // Set to recompute visibility from tags after
      this.tagsUpdated()
    }
  }

  /**
   * Remove given tag and cross-reference from link
   * @param {Class_Tag} tag
   * @memberof Class_LinkElement
   */
  public removeTag(tag: Class_Tag) {
    const value = this.value
    if (value) {
      value.removeTag(tag)
      // Set to recompute visibility from tags after
      this.tagsUpdated()
    }
  }

  public addDataTagGroup(tagg: Class_DataTagGroup) {
    // Expand values tree
    this._values = this._values.expand(tagg)
    // Set to recompute visibility from tags after -> new data tagg = new values = new flux tags
    this.tagsUpdated()
  }

  // #285 — replie sans perte le niveau du groupe avant sa suppression
  // (cf. Class_ElementValueTree.collapseGroup)
  public collapseDataTagGroup(
    tagg: Class_DataTagGroup,
    tag_for: (tag_id: string) => Class_Tag | undefined,
    selected_tag_id: string | undefined = undefined
  ) {
    if (this._values instanceof Class_ElementValueTree)
      this._values.collapseGroup(tagg, tag_for, selected_tag_id)
  }

  public removeDataTagGroup(tagg: Class_DataTagGroup) {
    if (this._values instanceof Class_ElementValueTree) {
      // Prune values tree
      this._values = this._values.prune(tagg) as Class_ElementValueTree | Class_LinkValue
      // Set to recompute visibility from tags after -> less data tagg = differents values = different flux tags
      this.tagsUpdated()
    }
  }

  public addDataTag(tag: Class_DataTag) {
    if (this._values instanceof Class_ElementValueTree) {
      // Extend current value tree branch
      this._values.extend(tag)
      // Set to recompute visibility from tags after -> new data tag = new value = new flux tags
      this.tagsUpdated()
    }
  }

  public removeDataTag(tag: Class_DataTag) {
    if (this._values instanceof Class_ElementValueTree) {
      // reduce current value tree branch
      this._values.reduce(tag)
      // Set to recompute visibility from tags after -> less data tag = differente value = different flux tags
      this.tagsUpdated()
    }
  }

  /**
   * os#1511 — La couleur du membre montré d'une dimension colorée dessinée « un membre à la fois »
   * (`Class_DataTagGroup.single_member_color`, qui décide). `undefined` sinon : le flux garde sa
   * règle habituelle.
   */
  private _memberBandColor(): string | undefined {
    // os#1511 — UN DIAGRAMME PAR MEMBRE : chaque bande prend la couleur de son membre (Julien,
    // 07/10 : « sans couleur »). Lue sur les nœuds engendrés des deux bouts.
    // QUI PEINT LES FLUX (Julien, 07/10 : « il faut pouvoir choisir dans la légende, et le premier
    // choix c'est Ressources et emplois qui peint les branches, et pas les diagrammes ») :
    //  1. la dimension choisie dans la légende (`use_colors`, une seule à la fois) ;
    //  2. à défaut, une dimension EN NŒUDS dont un bout porte un membre (les postes) ;
    //  3. à défaut, la bande (la filière).
    // Un membre sans couleur enregistrée prend celle de la carte par défaut (`displayColorOf`).
    const dimensions = this.sankey.data_taggs_list as Class_DataTagGroup[]
    // Un flux d'origine (non découpé) se peint aussi, par ses données, quand une dimension en nœuds
    // est choisie pour peindre (hors diagramme par membre, les flux non découpés existent).
    if (!isGeneratedMemberId(this.id)) {
      const peintre = flowPainterOf(dimensions)
      return peintre === undefined ? undefined : this._couleurParDonnees(peintre, [])
    }
    const aux_bouts = this._membresAuxBouts()
    const couleurDe = (tagg: Class_DataTagGroup) => {
      const membres = [...new Set(aux_bouts.filter(membre => membre.group === tagg))]
      return membres.length === 1 ? tagg.displayColorOf(membres[0]) : undefined
    }
    const peintre = flowPainterOf(dimensions)
    if (peintre === undefined) return undefined
    return couleurDe(peintre) ?? this._couleurParDonnees(peintre, aux_bouts)
  }

  /**
   * os#1511 — LA COULEUR LUE DANS LES DONNÉES du flux d'origine, quand aucun bout ne porte un membre
   * du peintre (Julien, 08/10 : « pourquoi Type de matière ne porte pas sa couleur, là il est
   * gris » — Matière première → Transformation ne touche aucun nœud découpé par type de matière,
   * mais ses données ne disent que « matière première »). Un seul membre du peintre présent à la
   * coordonnée du flux (bande et autres coupes comprises) : sa couleur ; plusieurs : rien.
   */
  /**
   * os#1511 — LES MEMBRES QUE PORTENT LES BOUTS d'un flux engendré, une fois chacun. 10/10/2026
   * (lot 5, expansion) — un flux d'expansion relie un membre ouvert à son enfant : seul l'ENFANT fait
   * la coordonnée (le parent, son ancêtre, la contient) ; lus tous deux, le cube les aurait croisés.
   */
  private _membresAuxBouts(): Class_DataTag[] {
    const membres = [...new Set([this.source, this.target]
      .flatMap(bout => membersOfGeneratedNode(bout as Class_NodeElement)))]
    return membres.filter(m => !membres.some(autre => autre !== m && autre.hasAncestor(m)))
  }

  private _couleurParDonnees(peintre: Class_DataTagGroup, aux_bouts: Class_DataTag[]): string | undefined {
    const parsed = parseGeneratedId(this.id)
    const origine = parsed === undefined ? this : this.sankey.links_dict[parsed.origin] as Class_LinkElement | undefined
    if (origine === undefined) return undefined
    const autres = [...new Set(aux_bouts.filter(membre => membre.group !== peintre))]
    const groupes_bouts = new Set(autres.map(membre => membre.group))
    const base = (origine.selected_data_tags_list as Class_DataTag[])
      .filter(tag => tag.group !== peintre && !groupes_bouts.has(tag.group))
      .concat(autres)
    const presents = (peintre.selected_tags_list as Class_DataTag[]).filter(membre => {
      const contributions = origine.contributingValuesFor(base.concat([membre]))
      return contributions !== null && contributions.some(valeur => (this.readLayer(valeur) ?? 0) !== 0)
    })
    return presents.length === 1 ? peintre.displayColorOf(presents[0]) : undefined
  }

  private _singleMemberDimensionColor(): string | undefined {
    for (const tagg of this.sankey.data_taggs_list) {
      const color = tagg.single_member_color
      if (color !== undefined) return color
    }
    return undefined
  }

  public getShapeColorToUse(): string {
    this.drawing_area.d3_selection_def_gradient?.select('#def_gradient_' + this.source.id + '-' + this.target.id).remove()

    // SA#541 — un style d'étiquette qui définit la couleur l'emporte sur toutes les règles
    // (dégradé, extrémités, coloration par groupe). Le cadenas de couleur posé sur le flux lui rend
    // SA couleur et l'emporte donc aussi : sans ce second terme, les règles ci-dessous — qui n'ont
    // jamais lu ce cadenas — remplaçaient la couleur locale (constaté au test local du 2026-09-14).
    if (this.tagStyleLayerImposing('shape_color') !== undefined || this.isTagStyleLockedOut('shape_color')) {
      return this.shape_color
    }
    // Flux éclaté : la bande porte la couleur de l'enfant qu'elle représente, nuancée si des sœurs
    // de la même dimension éclatée partagent cette couleur (cf. splitBandColor.ts).
    if (this._split_child) {
      const child = this._split_child
      const dim = child.dimensions_as_child.find(d => d.split_links)
      if (!dim) return child.getShapeColorToUse()
      const siblings = dim.children as Class_NodeElement[]
      return shadeAmongSiblings(siblings.map(c => c.getShapeColorToUse()), siblings.indexOf(child))
    }

    // Apply gradient if needed
    if (this.shape_color_rule == 'gradient') {

      const defGradient = this.drawing_area.d3_selection_def_gradient
      const n_source = this.source
      const n_source_color = n_source.getShapeColorToUse()

      const n_target = this.target
      const n_target_color = n_target.getShapeColorToUse()
      // Create a gradient
      const gradient = defGradient?.append('defs')
        .attr('id', 'def_gradient_' + n_source.id + '-' + n_target.id)
        .append('linearGradient')
        .attr('id', 'gradient-' + n_source.id + '-' + n_target.id)
        .attr('gradientUnits', 'userSpaceOnUse')

      gradient?.append('stop')
        .attr('id', 'stop-start')
        .attr('offset', '0%')
        .attr('stop-color', n_source_color)
        .attr('stop-opacity', 1)

      gradient?.append('stop')
        .attr('id', 'stop-end')
        .attr('offset', '100%')
        .attr('stop-color', n_target_color)
        .attr('stop-opacity', 1)

      // Le gradient suit la diagonale entre le point de depart (cote source) et
      // le point d'arrivee (cote cible) du trace. Cela couvre toute l'etendue du
      // flux, y compris les traces en L (hv / vh) ou un gradient purement
      // horizontal ou vertical se retrouvait comprime sur le premier segment.
      gradient
        ?.attr('x1', this.position_x_start)
        .attr('y1', this.position_y_start)
        .attr('x2', this.position_x_end)
        .attr('y2', this.position_y_end)

      return 'url(#gradient-' + n_source.id + '-' + n_target.id + ')'

    } else if (this.shape_color_rule == 'auto' && this.drawing_area.sankey.flux_taggs_list.filter(tagg => this.sankey.tagGroupAppliesFormatting(tagg) && !tagg.uses_tag_styles).length == 0) {
      // 0. os#1511 — UN MEMBRE À LA FOIS : le flux prend la couleur du membre montré (Julien, 30/09 :
      // « quand on choisit un membre à la fois, il ne met pas les couleurs »). En bandes, chaque
      // bande porte la couleur de son membre ; un seul membre, c'est une seule bande, donc la même
      // couleur — sans quoi choisir « Sucre » rendait le flux gris.
      // os#1511 (Julien, 13/10 : « sur le flux d'équilibrage je n'arrive pas à changer sa couleur en
      // gris ») — UNE COULEUR POSÉE SUR LE FLUX LUI-MÊME l'emporte sur celle que lui donne une
      // dimension : l'inspecteur la montrait surchargée, et le dessin gardait celle des postes. Elle
      // ne passe QUE devant la dimension : les règles d'étiquettes ci-dessous restent ce qu'elles
      // étaient (les rendus figés du corpus le vérifient), et la règle 5 la rend s'il n'y en a pas.
      const member_color = this.isAttributeOverloaded('shape_color')
        ? undefined
        : this._memberBandColor() ?? this._singleMemberDimensionColor()
      if (member_color !== undefined) return member_color
      const node_type = this.drawing_area.sankey.node_taggs_dict['type de noeud']
      const productTag = node_type?.tags_dict['produit']
      const source_color_tags = this.source.tags_list.filter(tag => tag.is_selected && this.sankey.tagGroupAppliesFormatting(tag.group))
      const target_color_tags = this.target.tags_list.filter(tag => tag.is_selected && this.sankey.tagGroupAppliesFormatting(tag.group))

      // 1. Common color tag between source and target → priority
      // (#1208) Only use the common-tag shortcut when each side has exactly one
      // visible color tag — otherwise the choice is ambiguous and we must defer
      // to getShapeColorToUse() which applies the "exactly 1 visible tag" rule.
      if (source_color_tags.length === 1 && target_color_tags.length === 1) {
        const common_tag = source_color_tags.find(tagg => target_color_tags.includes(tagg))
        if (common_tag) return common_tag.color
      }

      // 2. Only one side has a color tag → take that side
      if (source_color_tags.length > 0 && target_color_tags.length === 0) return this.source.getShapeColorToUse()
      if (target_color_tags.length > 0 && source_color_tags.length === 0) return this.target.getShapeColorToUse()

      // 3. Both have color tags (no common) → prefer the product node, sinon
      // l'extremite. Un noeud est une "extremite" s'il n'a de liens que d'un
      // seul cote (source pure ou puits pur) : sur un modele en etoile (un hub
      // qui redistribue), le flux suit alors la couleur du noeud feuille plutot
      // que celle du hub. Ce departage ne sert qu'a choisir entre deux couleurs
      // de tags deja actives — il ne s'applique pas quand aucun tag ne colore
      // (use_colors off), auquel cas le flux garde sa couleur propre (regle 5).
      if (source_color_tags.length > 0 && target_color_tags.length > 0) {
        if (this.source.hasGivenTag(productTag)) return this.source.getShapeColorToUse()
        if (this.target.hasGivenTag(productTag)) return this.target.getShapeColorToUse()
        const source_is_extremity = this.source.hasInputLinks() !== this.source.hasOutputLinks()
        const target_is_extremity = this.target.hasInputLinks() !== this.target.hasOutputLinks()
        if (target_is_extremity && !source_is_extremity) return this.target.getShapeColorToUse()
        if (source_is_extremity && !target_is_extremity) return this.source.getShapeColorToUse()
        return this.source.getShapeColorToUse()
      }

      // 4. No color tags → prefer the product node
      if (this.source.hasGivenTag(productTag)) return this.source.getShapeColorToUse()
      if (this.target.hasGivenTag(productTag)) return this.target.getShapeColorToUse()

      // 5. Fallback: couleur propre du flux
      return this.shape_color //this.source.getShapeColorToUse()
    }
    const type_source = this.shape_color_rule
    if (type_source == 'source') {
      return this.source.getShapeColorToUse()
    } else if (type_source == 'target') {
      return this.target.getShapeColorToUse()
    }
    // Default color
    let shape_color = this.shape_color
    // Test if tagg of flow or data are activated, if so use color from tag associated to link
    const dataTagColorActivated = this.selected_data_tags_list.filter(tag => this.sankey.tagGroupAppliesFormatting(tag.group))
    // Do we apply color of flux tags ?
    // SA#541 — un groupe qui fonctionne par styles ne colore plus par la couleur de ses étiquettes
    const flux_taggs_activated = this.flux_taggs_list
      .filter(tagg => this.sankey.tagGroupAppliesFormatting(tagg) && !tagg.uses_tag_styles)
    if (flux_taggs_activated.length > 0) {
      const tagg_for_colormap = flux_taggs_activated[0]
      const tags_for_colormap = this.flux_tags_list
        .filter(tag => (tag.group === tagg_for_colormap))
        .filter(tag => tag.is_selected)
      // Only color the link when exactly one tag is visible (#1208).
      // 0 or >=2 visible tags: keep the link's own color.
      if (tags_for_colormap.length === 1)
        shape_color = tags_for_colormap[0].color
    }
    else if (dataTagColorActivated.length > 0) {
      // Do we apply colors of data tags ? Same one-visible-tag rule (#1208).
      if (dataTagColorActivated.length === 1)
        shape_color = dataTagColorActivated[0].color
    }

    return shape_color
  }

  public getArrowColorToUse() {
    if (this.shape_color_rule == 'gradient') {
      const link_arrow_side_right = this.target_side == 'right'
      const link_arrow_side_bottom = this.target_side == 'bottom'
      const is_horizontal_at_target = this.is_target_horizontal
      const is_revert = (is_horizontal_at_target && link_arrow_side_right) || (!is_horizontal_at_target && link_arrow_side_bottom)

      const source_color = this.source.getShapeColorToUse()
      const target_color = this.target.getShapeColorToUse()
      const shape_orientation = this.orientation_in_effect  // save to avoid recomputings
      const shape_is_recycling = this.shape_is_recycling  // save to avoid recomputings
      if (shape_orientation === 'hh' || shape_orientation === 'hv') {
        if (
          (!shape_is_recycling && this.source.position_x < this.target.position_x) ||
          (shape_is_recycling && this.source.position_x >= this.target.position_x)
        )
          return is_revert ? source_color : target_color
        else
          return is_revert ? target_color : source_color
      }
      else {
        if (this.source.position_y < this.target.position_y)
          return is_revert ? source_color : target_color
        else
          return is_revert ? target_color : source_color
      }
    }
    return this.getShapeColorToUse()
  }

  /**
   * Return maximum value possible for this link
   *
   * @return {*}
   * @memberof Class_LinkElement
   */
  public getMaxValue() {
    return Math.max(this.valueCurrent ?? 0)
    //return this._values.getMaxValue()
  }

  public getAllValues() {
    return this._values.getAllValues()
  }

  public setDomainLocalScale(_: number | undefined) {
    if (_ !== undefined) {
      this._scaleValueToPx.domain([0, _])
    }
  }

  public setValuesForDataTags(tags: Class_DataTag[], val: Class_LinkValue) {
    if (this._values instanceof Class_ElementValueTree) {
      this._values.setValueForDataTags(tags, val)
    } else {
      this._values = val
    }
  }

  /**
   * os#1511 (Julien, 14/10, panorama de l'agriculture : faire cohabiter les bandes des filières
   * végétales et animales) — LA DIMENSION QUI DÉCOUPE CE FLUX en bandes, parmi celles qui en font
   * (`Class_DataTagGroup.draws_bands`) :
   *  - une seule : elle ;
   *  - plusieurs : celle qui VENTILE ce flux (au moins une bande à valeur) — les flux végétaux par
   *    culture, les flux animaux par filière animale ;
   *  - plusieurs le ventilent (Matière végétale → Élevage) : celle qui ventile aussi les flux qui
   *    SORTENT de son nœud d'arrivée — le flux prend la lecture de la suite du diagramme (arbitrage
   *    de Julien : « filière animale ») ; à défaut, la première de la liste.
   */
  public bandDimension(): Class_DataTagGroup | undefined {
    // os#1511 — retenue le temps d'un dessin (cf. `rememberInValueScope`) ; pas d'un rebâti : elle
    // lit les flux qui sortent du nœud d'arrivée, que le rebâti refait.
    return rememberInValueScope(this, 'band_dimension', () => this._bandDimension(), true)
  }

  private _bandDimension(): Class_DataTagGroup | undefined {
    const candidates = (this.sankey.data_taggs_list as Class_DataTagGroup[]).filter(tagg => tagg.draws_bands)
    if (candidates.length <= 1) return candidates[0]
    const ventile = (lien: Class_LinkElement, dim: Class_DataTagGroup) =>
      lien.dimensionBandsRaw(dim).some(band => band.value > 0)
    const miennes = candidates.filter(dim => ventile(this, dim))
    if (miennes.length <= 1) return miennes[0] ?? candidates[0]
    const sorties = this.target.output_links_list.filter(lien => lien !== this && lien.is_visible)
    return miennes.find(dim => sorties.some(lien => ventile(lien, dim))) ?? miennes[0]
  }

  /**
   * os#1511 — les bandes d'une dimension en bandes sur CE flux, AVANT tout repli « Autres » : une
   * par membre choisi de valeur positive, dans l'ordre de la sélection. Public : la dimension les
   * lit sur tous les flux visibles pour décider ce qui se replie au total
   * (`Class_DataTagGroup.globalFoldedMembers`).
   */
  public dimensionBandsRaw(multi_dim: Class_DataTagGroup): Type_DimensionBand[] {
    if (this._is_expansion_link) return []
    const band_style = (tags: Class_Tag[]) => this._bandStyle(tags)
    const bands: Type_DimensionBand[] = []
    // os#1511 (Julien, 14/10 : « il faut que ce soit rapide ») — les VALEURS des bandes ne dépendent
    // que du cube et de la sélection : retenues le temps d'un dessin ou d'un rebâti, où un même flux
    // les redemandait pour son épaisseur, ses deux bouts, sa dimension de bandes et ses voisins. Les
    // pixels, eux, suivent l'échelle et se recalculent à chaque fois.
    this._dimensionBandValues(multi_dim).forEach(({ tag, leaf, v }) => {
      const { color: styled_color, ...styled_opacity } = band_style(valueTags(leaf))
      // sa#283 — bande par tranche à l'échelle PROPRE de son tag quand il en porte une
      // (groupes d'unité : comportement historique, own_scale ≡ scale ; groupes
      // ordinaires : nouveau, un tag legacy sans échelle propre passe dans le else).
      const band_own_scale = tag.own_scale
      if (band_own_scale !== undefined && band_own_scale > 0) {
        this.setDomainLocalScale(band_own_scale)
        bands.push({ id: tag.id, px: Math.max(0, this._scaleValueToPx(v)), color: styled_color ?? tag.color, value: v, ...styled_opacity })
      }
      else {
        bands.push({ id: tag.id, px: Math.max(0, this.scaleValueToPx(v)), color: styled_color ?? tag.color, value: v, ...styled_opacity })
      }
    })
    return bands
  }

  /** os#1511 — les valeurs des bandes de `multi_dim` sur ce flux (cf. `dimensionBandsRaw`). */
  private _dimensionBandValues(multi_dim: Class_DataTagGroup): { tag: Class_DataTag, leaf: Class_LinkValue | null, v: number }[] {
    return rememberInValueScope(this, `band_values|${multi_dim.id}`, () => this._computeDimensionBandValues(multi_dim))
  }

  private _computeDimensionBandValues(multi_dim: Class_DataTagGroup): { tag: Class_DataTag, leaf: Class_LinkValue | null, v: number }[] {
    const values: { tag: Class_DataTag, leaf: Class_LinkValue | null, v: number }[] = []
    // os#1511 — UN FLUX ENGENDRÉ ne porte qu'un scalaire : il naît d'un choix de coordonnées
    // et ne sait pas se redécouper par un autre axe. Ses bandes se lisent donc sur le flux
    // D'ORIGINE, à la coordonnée de son membre. Sans cela, chaque bande valait le total du
    // flux — deux filières à 1 385 kt chacune au lieu de 1 280 et 105.
    const parsed = parseGeneratedId(this.id)
    const origine = parsed !== undefined ? this.sankey.links_dict[parsed.origin] : undefined
    // os#1511 — LES MEMBRES SE LISENT SUR LES NŒUDS, pas dans l'identifiant du flux. Depuis
    // que DEUX axes peuvent se croiser (« les filières à gauche, les pays à droite »), un flux
    // engendré est une CASE et porte donc jusqu'à deux coordonnées ; les chercher dans son id
    // obligerait à savoir de quelle dimension vient chaque morceau, alors que ses nœuds le
    // disent déjà.
    // Un bout « Autres » représente plusieurs membres repliés : ils entrent tous dans la
    // coordonnée, le cube les somme (cf. membersOfGeneratedNode).
    // UNE FOIS CHACUN : les deux bouts d'une chaîne sur une même dimension (Matière transformée →
    // Emplois, tous deux découpés par type de matière) portent le même membre ; lu deux fois, il
    // doublait chaque bande (Julien, 08/10 : 26 381 en sortie pour 13 191 en entrée).
    const membres_axes = this._membresAuxBouts()
    // os#1511 (Julien, 14/10, SOCLE transfo : Type de matière en bandes, « le flux Ressources →
    // Matière première est tout petit ») — UNE AUTRE DIMENSION À PLUSIEURS MEMBRES CHOISIS (les
    // postes : production, importations, déstockage…) : le point que lit `valueForTag` n'en retient
    // qu'un (560 kt d'importations au lieu de 64 492). La bande se lit alors en SOMME sur la
    // coordonnée complète, comme pour un membre parent.
    const groupes_axes_ids = new Set(membres_axes.map(membre => membre.group.id))
    const compte_par_groupe = new Map<string, number>()
    ;((origine ?? this).selected_data_tags_list as Class_DataTag[]).forEach(autre => {
      if (autre.group.id === multi_dim.id || groupes_axes_ids.has(autre.group.id)) return
      compte_par_groupe.set(autre.group.id, (compte_par_groupe.get(autre.group.id) ?? 0) + 1)
    })
    const autre_dimension_multiple = [...compte_par_groupe.values()].some(n => n > 1)
    multi_dim.selected_tags_list.forEach(tag => {
      const leaf = this.valueForTag(tag as Class_DataTag) as Class_LinkValue | null
      let v = (origine !== undefined && membres_axes.length > 0) || autre_dimension_multiple
        ? null
        : (leaf === null ? null : this.readLayer(leaf))
      // os#1511 — une bande sur un membre PARENT vaut la somme de ses feuilles. `valueForTag`
      // adresse un point du cube : sur une dimension hiérarchisée, « Europe » n'y porte rien,
      // la donnée étant sur l'Espagne et l'Italie. Sans ce repli, cocher Europe et Afrique ne
      // dessinait AUCUNE bande — et comme l'épaisseur du flux vient des bandes, le flux
      // disparaissait entièrement. Constaté à l'écran le 28/09.
      if (v === null || v <= 0) {
        const porteur = origine ?? this
        const groupes_axes = new Set(membres_axes.map(membre => membre.group.id))
        const coordonnee = (porteur.selected_data_tags_list as Class_DataTag[])
          .filter(autre => autre.group.id !== multi_dim.id && !groupes_axes.has(autre.group.id))
          .concat([tag as Class_DataTag])
          .concat(membres_axes)
        // Pas de repli sur la racine pour la dimension des bandes : chaque bande vaudrait le total.
        const contributions = porteur.contributingValuesFor(coordonnee, new Set([multi_dim.id]))
        if (contributions !== null) {
          const somme = contributions.reduce((total, valeur) => total + (this.readLayer(valeur) ?? 0), 0)
          if (somme > 0) v = somme
        }
      }
      if (v === null || v <= 0) return
      values.push({ tag: tag as Class_DataTag, leaf, v })
    })
    return values
  }

  /** SA#541 — couleur et opacité imposées à une bande par les styles des étiquettes de sa valeur. */
  private _bandStyle(tags: Class_Tag[]): { color?: string, opacity?: number } {
    if (!this.sankey.has_tag_styles) return {}
    const layers = this.resolveTagStyleLayers(
      this.sankey.tagGroupsInPriorityOrder('flux_taggs'),
      tag => tags.includes(tag as Class_Tag)
    )
    const out: { color?: string, opacity?: number } = {}
    const color_layer = topLayerDefining(layers, style => style.getElementProperty('shape_color'))
    if (color_layer && this.attributes.shape_color_sustainable !== true) {
      out.color = color_layer.style.getElementProperty('shape_color') as string
    }
    const opacity_layer = topLayerDefining(layers, style => style.getElementProperty('shape_opacity'))
    if (opacity_layer) out.opacity = opacity_layer.style.getElementProperty('shape_opacity') as number
    return out
  }

  /**
   * #285 — bandes internes : subdivision de l'épaisseur du flux,
   * proportionnelle aux valeurs coordonnées VISIBLES de la feuille courante.
   * Choix d'affichage déclenché par la bannière `multi` d'un groupe libre
   * (sinon le flux montre sa seule valeur principale) ; une bande disparaît si
   * un tag de sa coordonnée est désélectionné. Les parts sont relatives à la
   * somme des valeurs visibles — les valeurs d'un flux ne sont PAS additives,
   * l'épaisseur du flux reste pilotée par la valeur principale.
   */
  public get tagged_value_bands(): { id: string, px: number, share: number, color: string | null, value: number, unit?: string, label_visible?: boolean, opacity?: number, folded?: { id: string, value: number }[] }[] {
    if (this._is_expansion_link) return []
    // SA#541 — une bande est une valeur à part entière : les styles des étiquettes de SA valeur
    // imposent sa couleur et son opacité. Rien n'est calculé sans style d'étiquette.
    const band_style = (tags: Class_Tag[]) => this._bandStyle(tags)
    // 1) Dimension en bannière `multi` : une bande par tag SÉLECTIONNÉ, à la
    //    valeur de sa tranche (remplace l'ancien mécanisme de liens enfants —
    //    plus aucun lien fantôme dans le modèle).
    // os#1511 — une dimension ATTACHÉE à un nœud fait des NŒUDS, jamais des bandes. Sans cette
    // exclusion, la mettre en choix multiple produisait les deux à la fois pour le même axe.
    // Une seule dimension se dessine en nœuds ; les autres restent en bandes.
    const multi_dim = this.bandDimension()
    if (multi_dim) {
      const bands: Type_DimensionBand[] = this.dimensionBandsRaw(multi_dim)
      // os#1511 — « AUTRES » (règle arrêtée avec Julien le 01/10) : le repli se décide AU TOTAL de
      // la dimension sur les flux visibles (moins de 0,5 %, ou au-delà du 19e — même règle que la
      // couronne), pour que la légende reste courte et qu'un membre soit replié partout ou nulle
      // part. EXCEPTION : un membre replié au total reste en propre sur un flux où il pèse au moins
      // 5 % (`OTHERS_EXCEPTION_SHARE_PCT`) — le cas d'une bande grosse sur un seul flux.
      const replies_au_total = multi_dim.globalFoldedMembers()
      const total_flux = bands.reduce((acc, band) => acc + band.value, 0)
      const exception = (band: Type_DimensionBand) =>
        total_flux > 0 && band.value / total_flux >= OTHERS_EXCEPTION_SHARE_PCT / 100
      const folded = bands.filter(band => replies_au_total.has(band.id) && !exception(band))
      const kept = bands.filter(band => !folded.includes(band))
      // os#1511 — ORDRE DES BANDES : le même qu'en nœuds (`members_order`, cf.
      // Algorithms/DimensionMemberOrder) — par défaut du plus grand au plus petit au premier niveau,
      // l'ordre de l'arbre plus bas ; « Autres » toujours en dernier. Trier à plat éparpillait les
      // sous-régions d'une région éclatée entre les autres régions.
      const par_membre = new Map(kept.map(band => [multi_dim.tags_dict[band.id] as Class_DataTag, band]))
      const ordre = ordonnerMembres(multi_dim, [...par_membre.keys()], multi_dim.members_order,
        membre => par_membre.get(membre)?.value ?? 0)
      kept.splice(0, kept.length, ...ordre.map(membre => par_membre.get(membre) as typeof kept[number]))
      bands.splice(0, bands.length, ...kept)
      // os#1511 (09/10, vues synthétiques SOCLE) — UN SEUL MEMBRE CHOISI : sa bande unique, à la
      // couleur du membre (gris pour « Matière »), recouvrait la couleur que la dimension qui peint
      // les flux leur donne. La bande prend alors celle du peintre, s'il y en a un.
      if (multi_dim.selected_tags_list.length === 1) {
        // os#1511 (13/10) — la couleur posée sur le flux lui-même passe avant celle du peintre.
        const peinte = this.isAttributeOverloaded('shape_color') ? this.shape_color : this._memberBandColor()
        if (peinte !== undefined) bands.forEach(band => { band.color = peinte })
      }
      if (folded.length > 0) {
        bands.splice(0, bands.length, ...kept, {
          id: OTHERS_ID,
          px: folded.reduce((acc, band) => acc + band.px, 0),
          color: OTHERS_COLOR,
          value: folded.reduce((acc, band) => acc + band.value, 0),
          // Ce que la bande replie SUR CE FLUX, du plus grand au plus petit : l'info-bulle le détaille.
          folded: folded.map(band => ({ id: band.id, value: band.value })).sort((a, b) => b.value - a.value)
        })
      }
      const dim_total = bands.reduce((acc, band) => acc + band.px, 0)
      if (dim_total <= 0) return []
      return bands.map(band => ({ ...band, share: band.px / dim_total }))
    }
    // 2) Valeurs coordonnées des groupes libres (bannière `multi` requise)
    const expand = this.sankey.flux_taggs_list.some(tagg => tagg.banner === 'multi')
    if (!expand) return []
    const tvs = (this.value?.tagged_values_list ?? []).filter(tv =>
      tv.value !== null &&
      tv.value > 0 &&
      tv.tags_list.every(tag => tag.is_selected))
    // OS#1286 — unité du registre attachée au tag (groupe « de type unité ») :
    // le coefficient convertit la valeur exprimée dans l'unité vers l'unité de
    // base, à l'échelle du dessin (t/kt/Mt cohérents automatiquement).
    const unit_tag_of = (tv: Class_ElementTaggedValue): Class_FluxTag | undefined =>
      tv.tags_list
        .map(tag => tag as Class_FluxTag)
        .find(tag => (tag.group as Class_FluxTagGroup).is_unit_type && tag.resolved_unit)
    // §3.0ter — largeur de bande = valeur convertie avec l'échelle DE SON TAG
    // (si le groupe déclare des échelles distinctes) ; sinon échelle du dessin.
    const px_for = (tv: Class_ElementTaggedValue): number => {
      const v = tv.value as number
      const unit_tag = unit_tag_of(tv)
      if (unit_tag) {
        const resolved = unit_tag.resolved_unit
        const coeff = resolved ? resolved.unit_type.displayFactor(resolved.unit) : 1
        // Échelle PROPRE à la grandeur (façon e!Sankey) si définie, sinon
        // échelle globale du dessin ; le facteur convertit vers l'unité de
        // référence des données, sur laquelle l'échelle s'exprime (os#1518).
        const base_scale = resolved?.unit_type.display_scale ?? this.sankey.drawing_area.scale
        this.setDomainLocalScale(base_scale / (coeff || 1))
        return this._scaleValueToPx(v)
      }
      const scale_tag = tv.tags_list
        .map(tag => tag as Class_FluxTag)
        .find(tag => tag.scale !== undefined
          && (tag.group as Class_FluxTagGroup).has_own_scales)
      if (scale_tag?.scale) {
        this.setDomainLocalScale(scale_tag.scale)
        return this._scaleValueToPx(v)
      }
      return this.scaleValueToPx(v)
    }
    const color_for = (tv: Class_ElementTaggedValue): string | null => {
      const colored_tag = tv.tags_list
        .find(tag => this.sankey.tagGroupAppliesFormatting(tag.group as Class_TagGroup)) ?? tv.tags_list[0]
      return colored_tag?.color ?? null
    }
    const unit_for = (tv: Class_ElementTaggedValue): string | undefined =>
      unit_tag_of(tv)?.resolved_unit?.unit.label
    // SA#541 — étiquettes d'une bande = les siennes + celles de la feuille qui la contient (une
    // fiabilité posée sur la feuille vaut pour chacune de ses valeurs coordonnées).
    const leaf_tags = this.value?.effective_flux_tags_list ?? []
    const bands = tvs.map(tv => {
      const { color: styled_color, ...styled_opacity } = band_style([...tv.tags_list, ...leaf_tags])
      return { id: tv.id, px: Math.max(0, px_for(tv)), color: styled_color ?? color_for(tv), value: tv.value as number, unit: unit_for(tv), label_visible: tv.label_visible, ...styled_opacity }
    })
    const total = bands.reduce((acc, band) => acc + band.px, 0)
    if (total <= 0) return []
    return bands.map(band => ({ ...band, share: band.px / total }))
  }

  /** §3.0ter — épaisseur totale quand le flux s'affiche en bandes : somme des
   *  largeurs de bandes (chacune à l'échelle de son tag). */
  private get _bands_total_px(): number | null {
    const bands = this.tagged_value_bands
    if (bands.length === 0) return null
    return bands.reduce((acc, band) => acc + band.px, 0)
  }

  /** #285 — le flux affiche des bandes issues d'un groupe porteur ADDITIF : la
   *  valeur du flux (label principal) est le TOTAL, les bandes montrent le
   *  détail SANS label par bande. À l'inverse (unité), pas de total et un label
   *  par bande. Sert à DrawLabel (garder/masquer le label) et aux labels de bande. */
  public get has_additive_bands(): boolean {
    return (this.value?.tagged_values_list?.length ?? 0) > 0
      && this.sankey.flux_taggs_list.some(tagg => tagg.is_additive_carrier)
  }


  /**
   * Set up element on d3 svg area
   * @private
   * @memberof Class_LinkElement
   */
  /**
   * OS#1246 — le flux ne doit avoir un <g> que s'il est visible ET au-dessus
   * du seuil de valeur. Sans ce gate, un flux passant sous le seuil garderait
   * son <g> racine réutilisé dans le DOM (l'ancien early-return de _draw ne le
   * supprimait pas). Le retour false fait déclencher un unDraw (exit) par draw().
   */
  public _shouldBeDrawn(): boolean {
    return super._shouldBeDrawn() && this.is_value_above_threshold
  }

  protected _draw() {
    if (!this.is_value_above_threshold) {
      return
    }
    // Heritance
    super._draw()
    // Get starting point
    const starting_point = this.source.getOutputLinkStartingPoint(this)
    if (starting_point) {
      this._position.x = starting_point.x
      this._position.y = starting_point.y
    }
    // Get ending point
    const ending_point = this.target.getInputLinkEndingPoint(this)
    if (ending_point) {
      this._position_ending.x = ending_point.x
      this._position_ending.y = ending_point.y
    }
    // Draw only if we have starting & ending points
    if (starting_point && ending_point) {
      // os#1384 — RE-invalider ICI, pas seulement dans `draw()`. `Element.draw()` appelle
      // `_invalidateDrawCaches()` AVANT `_draw()`, donc avant les lignes ci-dessus qui
      // rafraîchissent `_position` / `_position_ending` depuis les nœuds : le garde d'ancre y
      // compare l'ancre de la passe PRÉCÉDENTE et conclut « rien n'a bougé » alors que l'ancre
      // change juste après. Une pointe calculée quand l'ancre valait encore (0,0) survivait donc
      // au dessin qui, lui, traçait le corps à la bonne place — corps juste, pointe restée en
      // haut (import e!Sankey « Building Energy Footprint »). Le second appel voit les positions
      // définitives ; quand rien n'a bougé il ne vide rien, donc le gain d'os#1374 tient.
      this._invalidateDrawCaches()
      // Draw elements
      this.drawElements()
    }
  }

  protected _initDraw(): void {
    super._initDraw()
    // Update class attributes
    this.d3_selection?.attr('class', 'gg_links').datum(this)
    // Le flux fantôme est un APERÇU de geste : il ne doit jamais capter le pointeur.
    // Sa pointe étant désormais posée exactement sous la pointe du stylo, sa bande
    // recouvre le nœud visé ; or Class_BaseElement.eventMouseOver ÉTEINT le drapeau
    // de survol de TOUS les nœuds avant de marquer l'élément survolé. Sans ce
    // pointer-events:none, le nœud sous le curseur perdrait son drapeau et le
    // relâché retomberait dans la branche « dans le vide » (nœud créé au lieu du
    // raccordement) — exactement le symptôme qu'on corrige.
    if (this.id === 'ghost_link')
      this.d3_selection?.style('pointer-events', 'none')
  }


  public drawIcon() {
    if (!this._link_draw_icon) return
    this._link_draw_icon.drawGenericLabel()
  }
  /**
   * Draw arrow shape on d3
   * @protected
   * @memberof Class_LinkElement
   */
  protected _drawArrow() {
    // Speed-up computing
    if (!this.d3_selection)
      return
    const draw_target = this.shape_is_arrow && this.is_visible
    const draw_source = this.shape_arrow_at_source && this.is_visible
    // Phase 1 — calcul paresseux : si une pointe demandée n'est pas encore connue,
    // demander au nœud correspondant de la calculer. Ce calcul réinjecte le path via
    // le setter shape_arrow_path[_source] qui rappelle drawArrow ; on laisse cette
    // ré-entrée faire le rendu une fois toutes les pointes connues, et on sort ici
    // pour ne pas dessiner deux fois (cas des deux flèches sur le même flux).
    let triggered = false
    if (draw_target && this._arrow_shape === undefined) {
      this.target.drawLinksArrow(); triggered = true
    }
    if (draw_source && this._arrow_shape_source === undefined) {
      this.source.drawLinksArrow(); triggered = true
    }
    if (triggered)
      return
    // Phase 2 — rendu : (re)dessiner toutes les pointes connues et demandées.
    const border_visible = this.shape_border_visible
    const border_color = this.shape_border_color
    const border_dashed = this.shape_border_dashed
    const border_thickness = this.shape_border_thickness
    // Clean previous shape
    this.d3_selection?.selectAll('.link_arrow').remove()
    this.d3_selection?.selectAll('.link_arrow_clip').remove()
    const arrow_color = this.getArrowColorToUse() // Avoid recomputing
    // Append one arrow path (factorisé pour les deux extrémités).
    const appendArrowPath = (d: string, fill: string = arrow_color, clip_id?: string) => {
      const path = this.d3_selection?.append('path')
        .attr('class', 'link_arrow')
        .attr('d', d)
        .attr('fill', this.shape_color_visible ? fill : 'none')
        .attr('fill-opacity', effectiveOpacity(this, { dim: 'no_data' }))
        .attr('stroke', border_visible ? border_color : 'none')
        .attr('stroke-width', border_visible ? border_thickness : 0)
        .attr('stroke-opacity', border_visible ? 1 : 0)
        .attr('stroke-dasharray', border_dashed ? '10,2' : '')
      if (clip_id) path?.attr('clip-path', `url(#${clip_id})`)
    }
    // #285 — flèche par bandes : quand le flux affiche ses valeurs en bandes,
    // la pointe est dessinée une fois PAR bande, clippée sur la tranche
    // transverse de la bande et peinte à sa couleur.
    const bands = this.tagged_value_bands
    const appendBandArrows = (d: string, at_source: boolean) => {
      const full = at_source ? this.thicknessSource : this.thicknessTarget
      const x_end = at_source ? this.position_x_start : this.position_x_end
      const y_end = at_source ? this.position_y_start : this.position_y_end
      const is_hh = this.orientation_in_effect === 'hh'
      const safe_id = domSafeId(this.id) // sa#586 — injectif : url(#…) se résout dans tout le document
      let cum = 0
      bands.forEach(({ color, share }, band_idx) => {
        const lo = cum
        cum += share
        const clip_id = `arrowband_${safe_id}_${at_source ? 's' : 't'}_${band_idx}`
        const reach = full + 100 // couvre largement la profondeur de la pointe
        this.d3_selection?.append('clipPath')
          .attr('class', 'link_arrow_clip')
          .attr('id', clip_id)
          .append('rect')
          .attr('x', is_hh ? x_end - reach : x_end - full / 2 + lo * full)
          .attr('y', is_hh ? y_end - full / 2 + lo * full : y_end - reach)
          .attr('width', is_hh ? 2 * reach : share * full)
          .attr('height', is_hh ? share * full : 2 * reach)
        appendArrowPath(d, color ?? arrow_color, clip_id)
      })
    }
    if (draw_target && this._arrow_shape !== undefined) {
      if (bands.length > 0) appendBandArrows(this._arrow_shape, false)
      else appendArrowPath(this._arrow_shape)
    }
    if (draw_source && this._arrow_shape_source !== undefined) {
      if (bands.length > 0) appendBandArrows(this._arrow_shape_source, true)
      else appendArrowPath(this._arrow_shape_source)
    }
  }

  /**
   * Draw the "source notch" (negative arrow) on this link's d3 selection.
   * The chevron is computed once at the source node for ALL links leaving the
   * same side (so they share a single notch), then applied on each participating
   * link as an SVG <mask> that carves the chevron out of the link's own paint
   * (shape/path/bordure/pointe) : vraie découpe transparente, ce qui est derrière
   * l'encoche (nœuds, flux croisés, fond) reste visible — contrairement à
   * l'ancien recouvrement peint couleur de fond qui masquait tout.
   * @protected
   */
  protected _drawSourceNotch() {
    if (!this.d3_selection)
      return
    // Clean previous notch mask
    this.d3_selection?.selectAll('.link_source_notch_mask').remove()
    if (this.shape_source_notch && this.is_visible) {
      if (this._source_notch_shape === undefined) {
        // Recompute at node level : le setter shape_source_notch_path rappelle
        // drawSourceNotch sur chaque flux participant (récursion contrôlée).
        this.source.drawLinksSourceNotch()
      }
      else {
        const mask = this.d3_selection.append('mask')
          .attr('class', 'link_source_notch_mask')
          .attr('id', this._sourceNotchMaskId())
          .attr('maskUnits', 'userSpaceOnUse')
          .attr('x', -1e5).attr('y', -1e5)
          .attr('width', 2e5).attr('height', 2e5)
        mask.append('rect')
          .attr('x', -1e5).attr('y', -1e5)
          .attr('width', 2e5).attr('height', 2e5)
          .attr('fill', 'white')
        mask.append('path')
          .attr('d', this._source_notch_shape)
          .attr('fill', 'black')
      }
    }
    this._applySourceNotchMask()
  }

  /** Id du mask d'encoche — id du flux échappé (sa#586 : injectivement) pour rester un fragment url(#...) valide. */
  private _sourceNotchMaskId(): string {
    return 'link_source_notch_mask_' + domSafeId(this.id)
  }

  /**
   * (Ré)applique l'attribut mask de l'encoche sur les tracés peints du flux.
   * Les <path> (shape/path/bordure/pointe) sont détruits/recréés par
   * drawShape/_drawArrow et perdent l'attribut, alors que le <mask> lui-même
   * persiste dans le <g> du flux — d'où ce rattrapage dans chaque point
   * d'entrée public qui recrée les tracés.
   * @protected
   */
  protected _applySourceNotchMask() {
    if (!this.d3_selection) return
    const has_mask = !this.d3_selection.select('.link_source_notch_mask').empty()
    this.d3_selection.selectAll('.link_shape, .link_path, .link_path_border, .link_arrow, .link_uncertainty_band')
      .attr('mask', has_mask ? 'url(#' + this._sourceNotchMaskId() + ')' : null)
  }

  /**
   * Draw all d3 elements on link d3 selection
   * @protected
   * @memberof Class_LinkElement
   */
  public drawElements() {
    // os#1376 — compté ICI, avant la garde ci-dessous, pour rester comparable aux références
    // mesurées sur os#1372 (18 230 dessins pour 1 823 flux au chargement de SOCLE Céréales) :
    // la sonde qui a produit ces chiffres instrumentait le tout premier statement de la méthode.
    countLinkDraw(this.id)
    if (!this._link_shape || !this._link_draw_value || !this._link_draw_label || !this._link_draw_icon) return
    this._link_shape.drawShape()
    this._drawArrow()
    this._drawSourceNotch()
    // Le nom est dessiné avant la valeur : en mode stick, la valeur se cale sur
    // la bbox du <text> du name_label.
    this._link_draw_label.drawGenericLabel()
    this._link_draw_value.drawGenericLabel()
    this._link_draw_icon.drawGenericLabel()
    if (this.value_label_stick_to_label) {
      this._link_draw_label.refreshStickLayout()
    }
    this._orderD3Elements()
  }

  public drawControlPoint() {
    this._link_control_points.drawControlPoint()
  }

  /**
   * Put d3 elements in correct display order
   * @protected
   * @memberof Class_NodeElement
   */
  protected _orderD3Elements() {
    this.d3_selection?.selectAll('.link_shape').raise()
    this.d3_selection?.selectAll('.link_path').raise()
    // os#1511 — les BANDES au-dessus du tracé principal : invisible sous elles, celui-ci captait
    // encore le survol (une opacité nulle ne coupe pas les événements SVG), et l'info-bulle ne
    // savait jamais quelle bande montrer. Le tracé reste dessous : sa zone de survol élargie des
    // flux fins (`_artifical_enlargement`) continue de répondre hors des bandes.
    this.d3_selection?.selectAll('.link_band').raise()
    this.d3_selection?.selectAll('.link_band_label').raise()
    this.d3_selection?.selectAll('.link_arrow').raise()

    this._link_draw_label.d3_selection?.raise()
    this._link_draw_value.d3_selection?.raise()
    //this._link_draw_image.d3_selection?.raise()
    this._link_draw_icon.d3_selection?.raise()
  }
  // P1 (refonte événements) — double-clic CONFIRMÉ (désambiguïsé par le
  // discriminateur unique de Class_ProtoElement) : éditer la valeur inline.
  // Marche aussi quand le flux est en pointillé (sans label) : openInlineEditor
  // force l'input. Inutile en mode structure.
  protected override onDoubleLMBClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    const drawing_area = this.drawing_area
    if (!drawing_area.editable || drawing_area.type_data == 'structure') return
    if (!this.is_selected) {
      drawing_area.addElementToSelection(this)
    }
    this._link_draw_value.openInlineEditor()
  }

  // P1 — simple clic CONFIRMÉ : sélection du flux (idem ex-eventSimpleLMBClick,
  // sans le timer, désormais porté par Class_ProtoElement).
  protected override onSingleLMBClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    const drawing_area = this.drawing_area
    // os#1385 (lot 3, D4) — c'est la ZONE qui dit si on édite ici, pas le droit de la page :
    // `da.editable` croise le droit du DOCUMENT et « je suis la zone vivante de mon document »
    // (même correction qu'au clic sur un nœud, cf. NodeEventsHandler). Conséquence visible :
    // sur un board unitaire — une zone fabriquée à côté, donc non éditable — un clic sur un
    // FLUX prend désormais le chemin lecteur (présentation composée, puis purge de la
    // sélection), exactement comme un clic sur un nœud ; il ouvrait jusqu'ici l'inspecteur
    // d'édition du document principal depuis un aperçu qu'on ne peut pas modifier.
    if (!drawing_area.editable) {
      // OS#305 Lot 3 — LECTEUR : le clic ouvre la présentation composée (rien
      // ne s'ouvre si l'auteur n'a rien composé pour ce flux).
      openPresentationFor(
        drawing_area.application_data,
        this as unknown as Parameters<typeof openPresentationFor>[1],
        { x: event.clientX, y: event.clientY }
      )
      drawing_area.purgeSelection()
      return
    }
    // EDITION MODE ===========================================================
    if (drawing_area.isInEditionMode()) {
      drawing_area.purgeSelection()
      drawing_area.closeAllMenus()
    }
    // SELECTION MODE =========================================================
    else if (drawing_area.isInSelectionMode()) {
      // CTRL (or CMD on Mac) = multi-sélection
      if (event.ctrlKey || event.metaKey) {
        this.addOrRemoveLinkFromSelection()
        // #1243 — matrice déposée : l'inspecteur dérive sa cible de la sélection.
        this.drawing_area.application_data.menu_configuration.ref_to_menu_config_updater.current()
        this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      }
      // Simple clic (sans modificateur) = sélection + ouverture de l'inspecteur
      else {
        drawing_area.selectOnly(this)
        drawing_area.application_data.menu_configuration.ref_to_toolbar_bottom_updater.current()
        // Le clic n'ouvre la présentation qu'en LECTURE (cf.
        // opensPresentationOnClick) : en édition, sélectionner un flux est un
        // geste de travail, pas une demande d'ouvrir une pop-up.
        if (opensPresentationOnClick(drawing_area.application_data)) {
          openPresentationFor(
            drawing_area.application_data,
            this as unknown as Parameters<typeof openPresentationFor>[1],
            { x: event.clientX, y: event.clientY }
          )
        }
      }
    }
  }

  protected eventSimpleRMBClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // os#1385 (lot 3, D4) — même lecture qu'au clic simple : la ZONE, pas la page. Un clic
    // droit sur un flux d'une zone non éditable (board unitaire, aperçu) n'ouvre plus le menu
    // contextuel d'édition ; dans la fenêtre d'une feuille, à qui le document donne le droit
    // d'éditer, il l'ouvre comme dans le canevas principal.
    if (!this.drawing_area.editable) {
      return
    }
    // Apply parent behavior first
    super.eventSimpleRMBClick(event)
    // SELECTION MODE =========================================================

    event.preventDefault()
    this.drawing_area.pointer_pos = [event.pageX, event.pageY]
    if (!this.drawing_area.selected_links_list.includes(this)) {
      this.drawing_area.purgeSelection()
      this.drawing_area.addElementToSelection(this)
    }
    this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    this.drawing_area.link_contextualised = this
    this.drawing_area.application_data.menu_configuration.ref_to_menu_context_links_updater.current()
    this.drawing_area.setToModeEdition(false)
  }

  protected addOrRemoveLinkFromSelection() {
    if (this.drawing_area.selected_links_list.includes(this)) {
      // Remove link from selection
      this.drawing_area.removeElementFromSelection(this)
    } else {
      // Add link to selection
      this.drawing_area.addElementToSelection(this)
    }
  }

  /**
   * Define event when mouse moves over element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  public eventMouseOver(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Apply parent behavior first
    super.eventMouseOver(event)
    // os#1511 — LA BANDE SURVOLÉE (Julien, 30/09 : « l'info-bulle doit montrer l'info uniquement
    // pour le dataTag correspondant à la bande »). `mouseover` remonte de chaque enfant du flux :
    // passer d'une bande à l'autre le redéclenche. L'info-bulle d'un même élément ne se refait
    // pas d'elle-même, on la ferme donc pour qu'elle se rouvre sur la nouvelle bande.
    const band = (event.target as unknown as Element | null)?.closest?.('.link_band')
    const band_id = band?.getAttribute('data-band-id') ?? undefined
    if (band_id !== this._hovered_band_id) {
      const had_band = this._hovered_band_id !== undefined
      this._hovered_band_id = band_id
      if (had_band) closePresentationTooltip(this.drawing_area.application_data)
    }
    // ALT
    if (this.thickness < 15) {
      this._artifical_enlargement = true
      // Artificially enlarge link thickness if too thin
      this.d3_selection?.select('.link_path').attr('stroke-width', 15)
    }
    // OS#305 — LECTEUR : survol satisfaisant le déclencheur du document ->
    // présentation composée en info-bulle. Remplace le survol que fournissait le
    // mixin d'info-bulle hérité, retiré avec son mécanisme.
    // En ÉDITION AUSSI : survoler montre à l'auteur ce que verra son lecteur,
    // par le chemin exact du lecteur — ce qui rend le bouton « Aperçu » inutile.
    const app_data = this.drawing_area.application_data
    if (event.buttons === 0
      && matchesPresentationTrigger(this as unknown as Parameters<typeof canPresentTooltip>[0], event)
      && canPresentTooltip(this as unknown as Parameters<typeof canPresentTooltip>[0])) {
      const rect = (event.target as HTMLElement)?.getBoundingClientRect?.()
      schedulePresentationHover(
        app_data,
        this as unknown as Parameters<typeof canPresentTooltip>[0],
        {
          x: event.clientX || (rect ? Math.round(rect.right) : 0),
          y: event.clientY || (rect ? Math.round(rect.top) : 0)
        }
      )
    }
  }

  /**
 * Define event when mouse moves in the element
 *
 * @protected
 * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
 * @memberof Class_LinkElement
 */
  public eventMouseMove(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>): void {
    super.eventMouseMove(event)
  }

  /**
   * Define event when mouse move out of element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  public eventMouseOut(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventMouseOut(event)
    // Quitter le flux (et non passer d'une bande à l'autre) oublie la bande survolée.
    const vers = (event as unknown as { relatedTarget: Node | null }).relatedTarget
    if (!vers || !this.d3_selection?.node()?.contains(vers)) this._hovered_band_id = undefined
    // OS#305 — quitter le flux programme la fermeture de son info-bulle de
    // présentation (annulée si le curseur y entre, cf. PanelShell).
    schedulePresentationHoverClose(this.drawing_area.application_data)

    // reset link thickness
    if (this._artifical_enlargement) {
      this._artifical_enlargement = false
      this.d3_selection?.select('.link_path').attr('stroke-width', this.thickness)
    }

  }

  protected scaleValueToPx(_: number) {
    const current_value = this.value
    // sa#283 — porteur d'échelle GÉNÉRALISÉ (principe du UnitTag étendu à tous les
    // dataTags) : tag d'unité DE LA VALEUR, ou unique tag de dataTag SÉLECTIONNÉ à
    // échelle propre — le groupe le plus tardif de taggs_order gagne (résolution unique,
    // cf. ScaleResolution ; même résolution que le porteur de Class_ScaleOverrides).
    // Sans porteur : échelle de la zone de dessin, comme toujours. Quand seuls les
    // groupes d'unité portent des échelles (tout le parc), le porteur EST le tag d'unité
    // de la valeur : comportement strictement identique à l'historique.
    // os#1511 (Julien, 09/10 : « l'échelle n'a toujours pas changé ») — l'échelle calée sur un nœud
    // de référence prime sur l'échelle propre de l'unité : toutes les unités suivent le nœud.
    if (this.drawing_area.reference_scale_applied) {
      return this.shape_local_link_scale
        ? this.drawing_area.scaleValueToPx(_) / this.shape_local_link_scale
        : this.drawing_area.scaleValueToPx(_)
    }
    const unit_tag = current_value?.unit_data_tag()
    // os#1511 — le porteur ne dépend que de la sélection et des tags à échelle propre, fixes pendant
    // un dessin ou un rebâti (les surcharges d'épaisseur changent la VALEUR d'une échelle, pas le
    // tag qui la porte) : résolu une fois par portée au lieu de chaque pixel (cf. `rememberInValueScope`).
    const carrier = rememberInValueScope(this.sankey, `scale_carrier|${unit_tag?.id ?? ''}`,
      () => resolveScaleCarrierTag(this.sankey, unit_tag))
    const carrier_scale = carrier?.own_scale
    if (carrier_scale !== undefined && !this.shape_local_link_scale) {
      this.setDomainLocalScale(carrier_scale)
      return this._scaleValueToPx(_)
    }
    if (this.shape_local_link_scale) {
      if (carrier_scale !== undefined) {
        this.setDomainLocalScale(carrier_scale * this.shape_local_link_scale)
      } else {
        this.setDomainLocalScale(this.sankey.drawing_area.scale * this.shape_local_link_scale)
      }
      return this._scaleValueToPx(_)
    } else {
      return this.drawing_area.scaleValueToPx(_)
    }
  }

  // PRIVATE METHODS ====================================================================
  //================= Functions for link label if it is a simple text  =================
  private redrawNodesSourceTarget() {

    this.source.draw()
    this.target.draw()

    if (this.source.shape_position_type == 'parametric') {
      // if the positioning mode of source is parametric we need to reposition all nodes below
      const same_source_u = this.sankey.visible_nodes_list.filter(n => n.position_u == this.source.position_u && n.position_v > this.source.position_v)
      same_source_u.forEach(n => n.draw())
    }
    if (this.target.shape_position_type == 'parametric') {
      // if the positioning mode of target is parametric we need to reposition all nodes below
      const same_target_u = this.sankey.visible_nodes_list.filter(n => n.position_u == this.target.position_u && n.position_v > this.target.position_v)
      same_target_u.forEach(n => n.draw())
    }
  }

  // GETTERS / SETTERS ==================================================================
  public defaultLinkName(
    source: Class_NodeElement,
    target: Class_NodeElement
  ) {
    // coherent with code in python (Constructor of flux)
    return source.name + '---' + target.name
  }

  /**
   * Le nom d'un flux, et c'est une SURCHARGE LÉGITIME du nom de l'élément (`Class_BaseShape.name`,
   * os#1445) : un flux n'a pas de nom à lui, il se nomme par ses deux extrémités. Il est donc
   * DÉRIVÉ, jamais écrit — renommer un flux n'a pas de sens, on renomme ses bouts. D'où l'accesseur
   * en lecture seule, qui masque volontairement l'écriture offerte par la base.
   *
   * Tout le reste du nommage — `name_label`, `name_label_effective` et sa cascade — vient de la
   * base sans une ligne ici : c'est exactement ce que l'homogénéisation a gagné.
   * @readonly
   * @memberof Class_LinkElement
   */
  public override get name() {
    return this.defaultLinkName(this._source, this._target)
  }

  /**
   * os#1451 — LA SOURCE DE LIBELLÉ D'UN FLUX, DITE DANS L'ÉNUMÉRATION COMMUNE.
   *
   * Le flux a gardé une écriture à lui, `name_label_text_source` : c'est ce que l'inspecteur des
   * flux écrit, ce que l'import e!Sankey pose, et surtout ce que les FICHIERS ENREGISTRÉS portent.
   * Elle ne disparaît pas — on ne migre pas le parc pour une question de vocabulaire — mais elle
   * cesse d'être une seconde énumération : ses valeurs SONT celles de `Type_NameLabelSource`, et
   * c'est ici, sur l'élément, que les deux écritures s'arbitrent — plus dans le dessin.
   *
   * ARBITRAGE, ET IL EST À COMPORTEMENT CONSTANT :
   *  · l'écriture propre au flux prime dès qu'elle dit autre chose que son défaut ('custom') —
   *    tout fichier existant garde donc exactement le libellé qu'il affichait ;
   *  · sinon l'attribut commun décide, ce qui ferme le piège laissé par os#1445 : régler la source
   *    d'un flux depuis l'inspecteur générique ne restait plus sans effet ;
   *  · 'name' — le DÉFAUT de l'attribut commun — et 'ancestor' désignent chez un flux le texte
   *    qu'il porte : un flux n'a pas de nom propre (il se nomme par ses deux bouts) et n'a pas
   *    d'ancêtre. C'est ce qu'il a toujours affiché, et c'est ce qui garantit qu'un diagramme
   *    enregistré se rouvre à l'identique.
   */
  public override get name_label_source_effective(): Type_NameLabelSource {
    const link_own_source = this.name_label_text_source as Type_NameLabelSource
    if (link_own_source !== undefined && link_own_source !== 'custom') return link_own_source
    const common_source = this.name_label_source
    if (common_source === 'name' || common_source === 'ancestor') return 'custom'
    return common_source
  }

  /** Le texte propre d'un flux n'est pas `name_label_text` : il est porté par sa VALEUR, donc par
   * la combinaison d'étiquettes de données sélectionnée. */
  protected override resolveCustomLabel(): string {
    return this.text_value
  }

  /** Source 'tag' : l'étiquette de FLUX assignée dans le groupe choisi (la première si plusieurs).
   * Sans groupe désigné, ou sans étiquette assignée, le flux dit son texte — jamais rien. */
  protected override resolveTagLabel(): string {
    const group_id = this.name_label_flux_tag_group_id
    if (group_id === '') return this.text_value
    const tag = this.flux_tags_list.find(t => t.group.id === group_id)
    return tag ? tag.display_name : this.text_value
  }

  /** OS#1314 — le gabarit d'un flux connaît ses propres jetons ({Value}, {Source}, {EntryName}…). */
  protected override resolveTemplateLabel(): string {
    return this.template_label
  }

  /** Les seules sources que le flux est seul à pouvoir honorer : le libellé AFFICHÉ de ses bouts. */
  protected override resolveEndpointLabel(which: 'source' | 'target' | 'source_target'): string {
    const source_label = this.source?.name_label_effective ?? ''
    const target_label = this.target?.name_label_effective ?? ''
    if (which === 'source') return source_label
    if (which === 'target') return target_label
    return `${source_label} → ${target_label}`
  }

  public get has_result() {
    return this._values.has_result
  }
  public get has_intervals() {
    return this._values.has_intervals
  }
  public get has_data() {
    return this._values.has_data
  }
  public set_only_data() {
    return this._values.set_only_data()
  }
  public get is_zero() {
    return this.valueCurrent === 0
  }

  /**
   * #fn — un flux à valeur nulle reste affiché si l'option GLOBALE « flux nuls
   * visibles » (drawing_area.show_zero_links, Paramètres d'affichage) est active,
   * OU si ce flux porte l'attribut PAR-FLUX `shape_visible_when_zero`. Lu dans
   * `_is_visible_ignoring_container_modes` pour outrepasser le filtre `is_not_zero`.
   */
  public get is_forced_visible_when_zero(): boolean {
    // #188 — a structurally-absent flux does not exist for this dataTag: it must
    // never be revealed by the global "show zero links" option.
    if (this.is_structurally_absent_for_current_datatags) return false
    return this.drawing_area.show_zero_links || this.shape_visible_when_zero
  }

  /**
   * #188 — true when this flux is structurally absent for the currently selected
   * dataTags (pruned by the no-propagation option; #161 marker on the leaf). The
   * flux does not exist for that dataTag, so it must stay hidden even with
   * "show zero links" on or in structure mode — overriding the null-value path
   * in is_not_zero (valueCurrent is null for an absent leaf, which would
   * otherwise read as "!= 0" and reveal the link as a dashed phantom).
   * Legacy/default files carry no marker, so this is always false there.
   */
  public get is_structurally_absent_for_current_datatags(): boolean {
    if (this._values instanceof Class_LinkValue) return this._values.structurally_absent
    return this._values.getStructurallyAbsentForDataTags(this.selected_data_tags_list as Class_DataTag[])
  }


  // Transient marker for expansion links — set by Hierarchies.disaggregationExpansion,
  // read by contract() to know which links to delete. Not persisted.
  public get is_expansion_link() { return this._is_expansion_link }
  public set is_expansion_link(v: boolean) { this._is_expansion_link = v }

  // FLUX ÉCLATÉS ======================================================================
  public get is_split_link() { return this._split_origin !== null }
  public get split_origin(): Class_LinkElement | null { return this._split_origin }
  public get split_child(): Class_NodeElement | null { return this._split_child }
  /** Fait de ce flux la bande de `child` : valeurs et étiquettes de flux copiées de `origin`. */
  public markAsSplitOf(origin: Class_LinkElement, child: Class_NodeElement) {
    this._split_origin = origin
    this._split_child = child
    this.copyValues(origin) // valeurs ET étiquettes de flux (portées par la valeur)
  }
  public get hidden_by_split() { return this._hidden_by_split }
  public set hidden_by_split(v: boolean) {
    if (this._hidden_by_split === v) return
    this._hidden_by_split = v
    this.updateVisibilityFingerprint()
  }

  // #411 — traçabilité de l'origine du flux.
  public get origin() { return this._origin }
  public set origin(v: Type_Origin | undefined) { this._origin = v }

  // #426 — traçabilité de la détermination de la valeur du flux.
  public get determination() { return this._determination }
  public set determination(v: number | null) { this._determination = v }

  public get is_visible() {
    if (this.is_visible_ignoring_container_modes && this.is_allowed_by_container_modes) return true
    // Mode « afficher aussi les flux porteurs de données » : EN PLUS de la vue
    // courante (union, pas filtre). On court-circuite les portes niveau/dimension/
    // container pour révéler un flux normalement masqué par son niveau.
    if (
      this.drawing_area.application_data.reveal_data_links &&
      super.is_visible && !this._hidden_by_split
    ) {
      // (a) le flux de donnée lui-même
      if (this.has_collected_data) return true
      // (b) flux structurel reliant un nœud nouvellement révélé à un nœud déjà
      //     visible (ou à un autre nœud révélé) → reconnecte le nœud au diagramme.
      //     On lit is_visible_without_orphan (pas is_visible) pour éviter la
      //     récursion orphan_visible ↔ is_visible des liens.
      const src_vis = this._source.is_visible_without_orphan || this._source.is_revealed_by_data
      const tgt_vis = this._target.is_visible_without_orphan || this._target.is_revealed_by_data
      if (src_vis && tgt_vis && (this._source.is_revealed_by_data || this._target.is_revealed_by_data)) {
        return true
      }
    }
    return false
  }

  /**
   * Vrai si ce flux porte une valeur collectée SAISIE (donnée mesurée ou borne
   * min) sur au moins un datatag — à la différence de `has_data` qui inclut
   * aussi les flux définis par ratio/pourcentage (sans valeur mesurée).
   */
  public get has_collected_data(): boolean {
    return this._values.has_collected_data
  }

  /**
   * Décide si ce lien doit être compté dans le sizing de `node`
   * (getShape{Height,Width}ToUse). Plus permissif qu'`is_visible` :
   * un lien masqué *uniquement* par `is_allowed_by_container_modes` est
   * inclus côté endpoint INTERNE au container (parent ou enfant de la dim
   * en container_mode qui le masque). L'endpoint externe, lui, voit déjà
   * le lien jumeau remonté sur le parent — il NE doit pas le compter en
   * plus, sinon sa taille double.
   */
  public is_visible_for_sizing_of(node: Class_NodeElement): boolean {
    if (this.is_visible) return true
    if (!this.is_visible_ignoring_container_modes) return false
    // Le lien est masqué par `is_allowed_by_container_modes` quelque part.
    // On ne le compte dans le sizing de `node` QUE si `node` est lui-même
    // un endpoint du lien ET un enfant d'une dim englobante dont le mode
    // masque précisément ce côté du lien (sortie ou entrée de l'enfant).
    // Dans tous les autres cas il existe des liens jumeaux visibles
    // (côté enfants ou côté parent) qui portent déjà la valeur — les
    // ajouter doublerait la taille (bug observé sur deux englobants
    // i_c_o_c reliés enfant↔enfant et sur l'arête parent↔enfant masquée
    // qui retombait sur les enfants externes via la dim sœur).
    //
    // #1231 — on ne compte la face MASQUÉE que si la face OPPOSÉE du nœud
    // n'a aucun lien visible. En `in_children_out_parent` (resp.
    // `in_parent_out_children`) la face entrée (resp. sortie) reste visible
    // et porte déjà le débit réel : sommer en plus la face masquée — qui
    // contient les variantes jumelles à TOUS les niveaux d'agrégation de
    // l'autre extrémité (agrégé + désagrégés) — gonflait la hauteur d'un
    // facteur. On ne retombe sur la face masquée que quand les DEUX faces
    // sont masquées (cas `in_parent_out_parent`, seule source de hauteur).
    const s = this._source
    const t = this._target
    const my_dims = [...node.dimensions_as_parent, ...node.dimensions_as_child]
    return my_dims.some(d => {
      if (!d.container_mode) return false
      if (!d.children.includes(node)) return false
      const mode = d.container_mode
      if (s === node) {
        // sortie du nœud-enfant masquée par ce mode → à compter pour son sizing,
        // mais seulement si la face entrée ne porte rien de visible.
        return (mode === 'in_children_out_parent' || mode === 'in_parent_out_parent') &&
          !node.hasVisibleInputLinks()
      }
      if (t === node) {
        // entrée du nœud-enfant masquée par ce mode → à compter pour son sizing,
        // mais seulement si la face sortie ne porte rien de visible.
        return (mode === 'in_parent_out_children' || mode === 'in_parent_out_parent') &&
          !node.hasVisibleOutputLinks()
      }
      return false
    })
  }

  /**
   * Identique à `is_visible` mais sans le filtre `is_allowed_by_container_modes`.
   * Exposé public pour les agrégats côté nœud (data_value / data_label) :
   * dans un mode englobant qui masque TOUS les liens d'un endpoint
   * (typiquement `in_children_out_children` côté parent), le filtre
   * `is_visible` retourne 0 lien et la valeur du nœud disparaît — alors
   * que l'utilisateur, lui, considère ces liens comme visibles.
   */
  public get is_visible_ignoring_container_modes(): boolean {
    return this._is_visible_ignoring_container_modes(true)
  }

  /**
   * Variante de `is_visible_ignoring_container_modes` qui IGNORE la condition
   * `is_not_zero`. Un flux à valeur nulle (typiquement fraîchement créé, valeur
   * pas encore saisie) reste structurellement présent : il doit quand même
   * définir la topologie pour le placement automatique. Cf. `is_visible_ignoring_zero`.
   */
  public get is_visible_ignoring_container_modes_and_zero(): boolean {
    return this._is_visible_ignoring_container_modes(false)
  }

  private _is_visible_ignoring_container_modes(require_non_zero: boolean): boolean {
    if (this.sankey.drawing_area.drawing_link) {
      return super.is_visible
    }
    return (
      super.is_visible &&
      !this._hidden_by_split &&
      this.are_source_and_target_displayed &&
      this.are_related_flux_tags_selected &&
      (!require_non_zero || this.is_not_zero || this.is_forced_visible_when_zero)
    )
  }

  /**
   * Visibilité « structurelle » pour le placement automatique : identique à
   * `is_visible` mais en ignorant la valeur nulle. Le calcul d'index horizontal
   * (computeAutoSankey, qui pilote position_x) doit traverser un flux à 0 comme
   * le fait detectAllCyclesAndOptimize (qui pilote position_u) — sinon le nœud
   * cible d'un flux sans valeur n'est pas atteint et reste mal placé en X.
   */
  public get is_visible_ignoring_zero(): boolean {
    return this.is_visible_ignoring_container_modes_and_zero && this.is_allowed_by_container_modes
  }

  /**
   * Container display mode link filter.
   *
   * When a dimension is in container mode, parent and children are visible
   * at the same time and the links are split by side:
   * - 'in_children_out_parent': inputs land on children, outputs leave from parent
   * - 'in_parent_out_children': inputs land on parent, outputs leave from children
   * - 'in_children_out_children': inputs and outputs both on children (parent is a pure envelope, no flux)
   * - 'in_parent_out_parent': inputs and outputs both on parent (children carry no flux of their own)
   *
   * Links inside a group (child → child of the same dimension) stay visible in
   * all modes. If any impacted dimension hides this link, the link is hidden.
   */
  public get is_allowed_by_container_modes(): boolean {
    const source = this._source
    const target = this._target

    // Liens d'expansion latérale (issue #1225) — règles directionnelles.
    //
    // En expand_left : les enfants apparaissent à GAUCHE du parent.
    //   - Enfants gardent leurs INPUTS (flux venant de plus à gauche),
    //     filtrent leurs OUTPUTS sauf le lien d'expansion (enfant→parent).
    //   - Parent filtre ses INPUTS (remplacés par les liens d'expansion),
    //     garde ses OUTPUTS (vers la droite).
    //
    // En expand_right : symétrique.
    //   - Enfants gardent leurs OUTPUTS (vers plus à droite), filtrent leurs
    //     INPUTS sauf le lien d'expansion (parent→enfant).
    //   - Parent filtre ses OUTPUTS, garde ses INPUTS.
    //
    // A. Lien d'expansion parent↔enfant : toujours visible (marker transient
    //    OU dim is_expanded structurellement).
    if (this._is_expansion_link) return true
    const isExpansionLink =
      source.dimensions_as_parent.some(d => d.is_expanded && d.children.some(c => c.id === target.id)) ||
      target.dimensions_as_parent.some(d => d.is_expanded && d.children.some(c => c.id === source.id))
    if (isExpansionLink) return true

    // B/C — transitivité (issue #1225) via Class_NodeElement.findExpandedAncestor.
    // B. Source enfant (transitif) d'une dim is_expanded, lien = OUTPUT de S.
    //    expanded_left → caché si target ≠ ancêtre.
    const sourceAncestor = source.findExpandedAncestor()
    if (sourceAncestor && sourceAncestor.side === 'left' && sourceAncestor.ancestor.id !== target.id) {
      return false
    }
    // C. Target enfant (transitif), lien = INPUT de T.
    //    expanded_right → caché si source ≠ ancêtre.
    const targetAncestor = target.findExpandedAncestor()
    if (targetAncestor && targetAncestor.side === 'right' && targetAncestor.ancestor.id !== source.id) {
      return false
    }
    // D. Source = parent d'une dim is_expanded (T n'étant pas un enfant de
    //    cette dim — déjà couvert en A). Lien S→T est un OUTPUT de S.
    //    - expanded_right : parent filtre ses outputs → caché
    //    - expanded_left  : parent garde ses outputs → on continue
    for (const d of source.dimensions_as_parent) {
      if (d.expanded_right && !d.children.some(c => c.id === target.id)) return false
    }
    // E. Target = parent d'une dim is_expanded. Lien S→T est un INPUT de T.
    //    - expanded_left  : parent filtre ses inputs → caché
    //    - expanded_right : parent garde ses inputs → on continue
    for (const d of target.dimensions_as_parent) {
      if (d.expanded_left && !d.children.some(c => c.id === source.id)) return false
    }

    // Walk up via dimensions_as_child pour collecter TOUS les dims qui
    // peuvent impacter ce lien, y compris les ancêtres englobants
    // grands-parents. Sans ça, après désagrégation d'un nœud englobé
    // (ex. BO disaggrégé en BO F / BO R sous bois en container_mode),
    // les liens des nouveaux sous-nœuds ne seraient plus filtrés et
    // resteraient visibles alors que le contrat « in_parent_out_parent »
    // de bois doit s'appliquer transitivement.
    const collectAncestorDims = (n: Class_NodeElement): Set<Class_NodeDimension> => {
      const dims = new Set<Class_NodeDimension>()
      const seen_nodes = new Set<string>()
      const stack: Class_NodeElement[] = [n]
      while (stack.length > 0) {
        const cur = stack.pop()!
        if (seen_nodes.has(cur.id)) continue
        seen_nodes.add(cur.id)
        cur.dimensions_as_parent.forEach(d => dims.add(d))
        cur.dimensions_as_child.forEach(d => {
          dims.add(d)
          stack.push(d.parent)
        })
      }
      return dims
    }

    // Helper transitif : n est-il "contenu" comme enfant par dim ? Soit
    // directement dans dim.children, soit via la chaîne dimensions_as_child
    // de ses ancêtres.
    const isInternalAsChild = (n: Class_NodeElement, dim: Class_NodeDimension): boolean => {
      const seen = new Set<string>()
      const stack: Class_NodeElement[] = [n]
      while (stack.length > 0) {
        const cur = stack.pop()!
        if (seen.has(cur.id)) continue
        seen.add(cur.id)
        if (dim.children.includes(cur)) return true
        cur.dimensions_as_child.forEach(cd => stack.push(cd.parent))
      }
      return false
    }

    const impacting_dims = new Set<Class_NodeDimension>()
    collectAncestorDims(source).forEach(d => impacting_dims.add(d))
    collectAncestorDims(target).forEach(d => impacting_dims.add(d))
    if (impacting_dims.size === 0) return true

    const seen = new Set<string>()
    for (const dim of impacting_dims) {
      if (!dim.container_mode) continue
      if (seen.has(dim.id + '@' + dim.parent.id)) continue
      seen.add(dim.id + '@' + dim.parent.id)
      const source_is_parent = source === dim.parent
      const target_is_parent = target === dim.parent
      const source_is_child = !source_is_parent && isInternalAsChild(source, dim)
      const target_is_child = !target_is_parent && isInternalAsChild(target, dim)
      if (!source_is_parent && !target_is_parent && !source_is_child && !target_is_child) continue
      // child ↔ child inside the same group — always visible
      if (source_is_child && target_is_child) continue
      // parent ↔ own child (shouldn't normally exist) — hide to avoid clutter
      if ((source_is_parent && target_is_child) || (source_is_child && target_is_parent)) {
        return false
      }
      // Exactly one endpoint internal to this dimension
      const mode = dim.container_mode
      if (source_is_parent) {
        // Outgoing link from the parent
        if (mode === 'in_parent_out_children') return false
        if (mode === 'in_children_out_children') return false
      } else if (target_is_parent) {
        // Incoming link to the parent
        if (mode === 'in_children_out_parent') return false
        if (mode === 'in_children_out_children') return false
      } else if (source_is_child) {
        // Outgoing link from a child
        if (mode === 'in_children_out_parent') return false
        if (mode === 'in_parent_out_parent') return false
      } else if (target_is_child) {
        // Incoming link to a child
        if (mode === 'in_parent_out_children') return false
        if (mode === 'in_parent_out_parent') return false
      }
    }
    return true
  }

  /**
   * Get source node
   * @memberof Class_LinkElement
   */
  public get source(): Class_NodeElement {
    return this._source
  }

  /**
   * set source node
   * @memberof Class_LinkElement
   */
  public set source(_: Class_NodeElement) {
    if (this.source !== _) {
      // Memorize old source
      const old_source = this._source
      // Set source attr
      this._source = _
      this.drawing_area?.invalidateNodeSizeMemo() // os#1508
      // Set to recompute visibility from nodes after
      this._are_source_and_target_displayed = undefined
      // Clean old source
      old_source.swapOutputLink(this, _)

      // If we set a source from himself then make the link a recycing one
      if (this.target === this.source) {
        this.shape_is_recycling = true
      }
    }
  }

  /**
   * Get starting node side for link
   * @readonly
   * @type {Type_Side}
   * @memberof Class_LinkElement
   */
  /** os#1510 — la normale sortante d'une ancre radiale, ou `null` (cf. `_source_anchor_normal`). */
  public get source_anchor_normal(): { x: number, y: number } | null { return this._source_anchor_normal }
  public set source_anchor_normal(value: { x: number, y: number } | null) { this._source_anchor_normal = value }
  public get target_anchor_normal(): { x: number, y: number } | null { return this._target_anchor_normal }
  public set target_anchor_normal(value: { x: number, y: number } | null) { this._target_anchor_normal = value }

  public get source_side(): Type_Side {
    // Locked anchor : keep the side captured when the user locked it, so
    // moving the opposite node does not flip this anchor.
    if (this._source_side_locked && this._source_side_frozen !== undefined)
      return this._source_side_frozen
    // os#1508 — pendant un lot de réorganisations E/S, le côté calculé est mémorisé (cf. DrawingArea).
    const memo = this.drawing_area.link_side_memo
    const hit = memo?.get(this)
    if (hit?.s !== undefined) return hit.s
    const s = this._computed_source_side
    if (memo) memo.set(this, { ...hit, s })
    return s
  }

  /**
   * Le point par lequel ce flux rejoint `node` (une de ses extrémités) : le dernier point de la
   * route à l'arrivée, le premier au départ — point de passage (Alt+clic) ou waypoint routé.
   * `null` sans route : c'est alors le nœud opposé qui dit d'où vient le flux. `s` et `t` sont
   * les centres source et cible (cf. `passPointsWorldBetween`).
   *
   * Julien, 13/10 : sur SOCLE transfo, Ressources → Matière transformée passe SOUS Transformation
   * mais était rangé au-dessus de Transformation → Matière transformée à l'arrivée, parce que
   * Ressources est plus haut : les deux flux se croisaient juste avant le nœud.
   */
  public routePointNear(node: Class_NodeElement, s: [number, number], t: [number, number]): [number, number] | null {
    const at_source = node === this.source
    const wps = this.shape_waypoints
    if (!this.shape_is_recycling && Array.isArray(wps) && wps.length > 0) {
      const w = at_source ? wps[0] : wps[wps.length - 1]
      return [w.x, w.y]
    }
    const pp = this._link_control_points.passPointsWorldBetween(s, t)
    if (pp.length === 0) return null
    return at_source ? pp[0] : pp[pp.length - 1]
  }

  /** Side derived from node relative positions, ignoring any anchor lock. */
  /**
   * opensankey#1301 — auto-suivi du côté d'accroche : le côté du nœud `node` qui
   * FAIT FACE au point `pt` (1er/dernier waypoint). Les waypoints découplent la
   * direction de départ/arrivée de la position relative des nœuds, donc le côté
   * doit suivre la route, pas « où est l'autre nœud ». `undefined` si pas de point.
   */
  private _waypointFacingSide(
    node: Class_NodeElement,
    pt: { x: number, y: number } | undefined
  ): Type_Side | undefined {
    if (!pt) return undefined
    // Centre estimé depuis la TAILLE BRUTE (shape_min_width/height), PAS
    // getShapeWidthToUse() : cette dernière dérive la bande des liens ordonnés, qui
    // lit source_side → récursion infinie (source_side → _computed_source_side →
    // _waypointFacingSide → getShapeWidthToUse → getLinksOrdered → source_side …).
    // position_x/y sont, eux, déjà lus sans risque par le calcul de côté d'origine.
    const cx = node.position_x + node.shape_min_width / 2
    const cy = node.position_y + node.shape_min_height / 2
    const dx = pt.x - cx, dy = pt.y - cy
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left'
    return dy >= 0 ? 'bottom' : 'top'
  }

  private get _computed_source_side(): Type_Side {
    // Failsafe : because of constructor
    if (this.source === undefined || this.target === undefined) {
      return 'right'
    }
    // Normal behavior
    if (!this.shape_is_recycling) {
      // opensankey#1301 — auto-suivi : le côté suit le 1er waypoint s'il y en a.
      const wps = this.shape_waypoints
      if (Array.isArray(wps) && wps.length > 0) {
        const side = this._waypointFacingSide(this.source, wps[0])
        if (side) return side
      }
      if (this.is_horizontal || this.is_horizontal_vertical) {
        if (this.source.position_x <= this.target.position_x)
          return 'right'
        else
          return 'left'
      }
      else {
        if (this.source.position_y <= this.target.position_y)
          return 'bottom'
        else
          return 'top'
      }
    }
    // Recylcing mode
    // Inégalité STRICTE : source et cible dans la même colonne (x égaux), c'est le recyclage
    // ordinaire — le flux part vers l'avant puis revient. Avec `<=`, l'égalité le faisait sortir
    // à gauche (démo Déchets, « Refus criblage » dans la vue agrégée). Même règle côté cible.
    else {
      if (this.is_horizontal || this.is_horizontal_vertical) {
        if (this.source.position_x < this.target.position_x)
          return 'left'
        else
          return 'right'
      }
      else {
        if (this.source.position_y < this.target.position_y)
          return 'top'
        else
          return 'bottom'
      }
    }
  }

  /**
   * get destination node
   * @memberof Class_LinkElement
   */
  public get target(): Class_NodeElement {
    return this._target
  }

  /**
   * Set destination node
   * @memberof Class_LinkElement
   */
  public set target(_: Class_NodeElement) {
    if (this.target !== _) {
      // Memorize old target for swapping
      const old_target = this._target
      // Assign target attribute
      this._target = _
      this.drawing_area?.invalidateNodeSizeMemo() // os#1508
      // Set to recompute visibility from nodes after
      this._are_source_and_target_displayed = undefined
      // Clean old source
      old_target.swapInputLink(this, _)
      // If we set a target to himself then make the link a recycing one
      if (this.target === this.source) {
        this.shape_is_recycling = true
      }
    }
  }

  /**
   * Reverse link direction by swapping its source and target nodes.
   * Done in one shot to avoid the transient source === target state
   * that the source/target setters would otherwise read as a recycling link.
   * @memberof Class_LinkElement
   */
  public swapSourceAndTarget() {
    const old_source = this._source
    const old_target = this._target
    // Recycling link (source === target) : nothing to swap
    if (old_source === old_target)
      return
    // Re-register the link on its nodes WITHOUT going through the source/target
    // setters. Those setters (reached transitively via add*Link → `link.source = this`)
    // would momentarily see source === target and wrongly flag the link as recycling.
    // We unregister, flip the private refs, then re-register: by the time
    // add*Link runs, _source/_target already hold the new values so the setters
    // it calls are no-ops and shape_is_recycling stays untouched.
    old_source.removeOutputLink(this)
    old_target.removeInputLink(this)
    this._source = old_target
    this._target = old_source
    this.drawing_area?.invalidateNodeSizeMemo() // os#1508
    old_target.addOutputLink(this) // old_target is the new source
    old_source.addInputLink(this) // old_source is the new target
    // Set to recompute visibility from nodes after
    this._are_source_and_target_displayed = undefined
  }

  /**
   * Get starting node side for link
   * @readonly
   * @type {Type_Side}
   * @memberof Class_LinkElement
   */
  public get target_side(): Type_Side {
    // Locked anchor : keep the side captured when the user locked it, so
    // moving the opposite node does not flip this anchor.
    if (this._target_side_locked && this._target_side_frozen !== undefined)
      return this._target_side_frozen
    // os#1508 — pendant un lot de réorganisations E/S, le côté calculé est mémorisé (cf. DrawingArea).
    const memo = this.drawing_area.link_side_memo
    const hit = memo?.get(this)
    if (hit?.t !== undefined) return hit.t
    const t = this._computed_target_side
    if (memo) memo.set(this, { ...hit, t })
    return t
  }

  /** Side derived from node relative positions, ignoring any anchor lock. */
  private get _computed_target_side(): Type_Side {
    // Failsafe : because of constructor
    if (this.source === undefined || this.target === undefined) {
      return 'left'
    }
    // Normal behavior
    if (!this.shape_is_recycling) {
      // opensankey#1301 — auto-suivi : le côté cible suit le DERNIER waypoint s'il y en a.
      const wps = this.shape_waypoints
      if (Array.isArray(wps) && wps.length > 0) {
        const side = this._waypointFacingSide(this.target, wps[wps.length - 1])
        if (side) return side
      }
      if (this.is_horizontal || this.is_vertical_horizontal) {
        if (this.source.position_x <= this.target.position_x)
          return 'left'
        else
          return 'right'
      }
      else {
        if (this.source.position_y <= this.target.position_y)
          return 'top'
        else
          return 'bottom'
      }
    }
    // Recycling mode (inégalité stricte, cf. _computed_source_side)
    else {
      if (this.is_horizontal || this.is_vertical_horizontal) {
        if (this.source.position_x < this.target.position_x)
          return 'right'
        else
          return 'left'
      }
      else {
        if (this.source.position_y < this.target.position_y)
          return 'bottom'
        else
          return 'top'
      }
    }
  }

  // I/O ANCHOR LOCK & DELTA ============================================================

  public get source_side_locked(): boolean { return this._source_side_locked }
  public set source_side_locked(value: boolean) {
    this._source_side_locked = value
    // Capture the current side on lock, drop it on unlock.
    this._source_side_frozen = value ? this._computed_source_side : undefined
  }

  public get target_side_locked(): boolean { return this._target_side_locked }
  public set target_side_locked(value: boolean) {
    this._target_side_locked = value
    this._target_side_frozen = value ? this._computed_target_side : undefined
  }

  public get source_anchor_delta(): number { return this._source_anchor_delta }
  public set source_anchor_delta(value: number) {
    // Negative values are allowed (anchor pulled up / before its packed slot).
    this._source_anchor_delta = value || 0
  }

  public get target_anchor_delta(): number { return this._target_anchor_delta }
  public set target_anchor_delta(value: number) {
    // Negative values are allowed (anchor pulled up / before its packed slot).
    this._target_anchor_delta = value || 0
  }

  /** Which end of this link is attached to `node` ('source' / 'target' / undefined). */
  private endForNode(node: Class_NodeElement): 'source' | 'target' | undefined {
    if (this._source === node) return 'source'
    if (this._target === node) return 'target'
    return undefined
  }

  /** Is the anchor on `node`'s side locked ? */
  public getAnchorLockedForNode(node: Class_NodeElement): boolean {
    return this.endForNode(node) === 'target' ? this._target_side_locked : this._source_side_locked
  }

  /** Lock / unlock the anchor on `node`'s side. */
  public setAnchorLockedForNode(node: Class_NodeElement, value: boolean) {
    if (this.endForNode(node) === 'target') this.target_side_locked = value
    else this.source_side_locked = value
  }

  /** Spacing inserted before the anchor on `node`'s side. */
  public getAnchorDeltaForNode(node: Class_NodeElement): number {
    return this.endForNode(node) === 'target' ? this._target_anchor_delta : this._source_anchor_delta
  }

  /** Set the spacing inserted before the anchor on `node`'s side. */
  public setAnchorDeltaForNode(node: Class_NodeElement, value: number) {
    if (this.endForNode(node) === 'target') this.target_anchor_delta = value
    else this.source_anchor_delta = value
  }

  /** Release both anchor locks — called by automatic layout passes. */
  public resetAnchorLocks() {
    this.source_side_locked = false
    this.target_side_locked = false
  }

  /**
   * os#1511 (Julien, 14/10 : « afficher les datatags comme dans Excel ») — LES VALEURS PORTÉES par ce
   * flux, coordonnée par coordonnée : une visite par feuille du cube qui porte une donnée ou un
   * résultat, avec ses étiquettes dans l'ordre des dimensions. Sans dimension, sa seule valeur,
   * portée ou non (le flux a sa ligne quoi qu'il arrive). Les branches en attente sont lues depuis
   * leur JSON sans se construire (cf. `Class_ElementValueTree.forEachCarriedLeaf`) : la valeur
   * visitée peut être JETABLE ; pour écrire, repasser par `valueForTags(tags)`.
   */
  public forEachCarriedValue(visit: (value: Class_LinkValue, tags: Class_DataTag[]) => void) {
    if (this._values === undefined) return
    if (this._values instanceof Class_LinkValue) {
      if (!this._values.structurally_absent) visit(this._values, [])
      return
    }
    this._values.forEachCarriedLeaf((value, tags) => visit(value as Class_LinkValue, tags))
  }

  public valueForTags(_: Class_ProtoTag[]): Class_LinkValue | null {
    if (this._values instanceof Class_LinkValue)
      return this._values
    else
      return this._values.getValueForDataTags(_ as Class_DataTag[]) as Class_LinkValue | null
  }

  /**
   * os#1359 — Vrai quand ce qui est affiché est la DONNÉE COLLECTÉE, faux quand c'est le
   * résultat de la réconciliation. Un seul endroit le décide, parce que la lecture et
   * l'écriture d'une valeur doivent désigner la même couche : le jour où elles divergent,
   * une saisie va dans un jeu de données que l'utilisateur ne regarde pas.
   *
   * Attention, ce n'est PAS `data_source === 'data'` : la couche effectivement lue est
   * `type_data`, qui croise la source et le mode d'affichage des intervalles (`data_source`
   * seul, avec un `interval_display` resté à 'free_value', désigne encore le réconcilié).
   */
  private get _reads_collected_layer(): boolean {
    return this.drawing_area.type_data === 'data'
  }

  /**
   * os#1511 — LA COUCHE LUE d'une valeur de ce flux (donnée saisie ou résultat réconcilié), selon
   * `_reads_collected_layer`. Elle se recodait à six endroits de ce fichier, dans deux ordres
   * opposés : les bandes et l'agrégat d'un membre lisaient la donnée AVANT le résultat, si bien
   * qu'en mode résultats un flux engendré montrait la donnée saisie. Toute lecture passe ici.
   *
   * `collected` : la couche EXPLICITE qu'une figure veut lire (os#1511, une couronne détachée en
   * réconciliées sous un diagramme en collectées). Absent, c'est celle du dessin. Rien n'est copié
   * ni basculé : les deux couches vivent déjà sur chaque valeur, on choisit seulement laquelle lire.
   */
  public readLayer(valeur: Class_LinkValue, collected: boolean = this._reads_collected_layer): number | null {
    return valeur.readLayer(collected)
  }

  /**
   * #1231 — Valeur numérique du flux pour un jeu de datatags EXPLICITE (même extraction que
   * `valueCurrent`, mais sans dépendre de la sélection courante). Utilisé par le mode % pour
   * lire la valeur du flux de référence à son datatag de référence (couple flux/datatag).
   *
   * os#1511 — `collected` : la couche lue, celle du dessin par défaut (cf. `readLayer`).
   */
  public valueForDataTags(data_tags: Class_DataTag[], collected: boolean = this._reads_collected_layer): number | null {
    const lire = (valeur: Class_LinkValue): number | null => this.readLayer(valeur, collected)
    const v = this.valueForTags(data_tags)
    if (v) {
      const lu = lire(v)
      if (lu !== null) return lu
    }
    // os#1511 — AGRÉGAT d'un membre PARENT, à la coordonnée DEMANDÉE.
    //
    // Cette lecture est celle de TOUTES les figures épinglées (`Charts/FigureNavigation`), du
    // mode « échelle adaptée » et de l'extraction unitaire. Elle n'adressait qu'un POINT du
    // cube : épinglée sur « Céréales », une couronne ne trouvait rien — la donnée étant portée
    // par « Blé » et « Maïs » — et affichait zéro, pendant que le même diagramme, lui, montrait
    // le total (`valueCurrent` fait ce repli depuis le lot 1, mais sur la SÉLECTION seulement).
    //
    // Même règle qu'ailleurs, et c'est elle qui compte : une valeur saisie au niveau demandé
    // prime sur la somme de ses feuilles ; la somme n'est qu'un repli. Le parcours de l'arbre
    // n'a lieu que si le diagramme porte vraiment une hiérarchie.
    if (!this.sankey.data_taggs_list.some(tagg => (tagg as Class_DataTagGroup).is_hierarchical)) return null
    const contributions = this.contributingValuesFor(data_tags)
    if (contributions === null) return null
    const portees = contributions.map(lire).filter((portee): portee is number => portee !== null)
    return portees.length > 0 ? portees.reduce((total, portee) => total + portee, 0) : null
  }

  public valueForTag(tag: Class_DataTag | undefined) {
    if (!tag) return this.value
    const data_tags: Class_DataTag[] = []
    this.sankey.data_taggs_list.forEach((tagg) => {
      if (tagg == tag.group) data_tags.push(tag)
      else data_tags.push(tagg.selected_tags_list[0])
    })
    return this.valueForTags(data_tags)
  }

  public get selected_data_tags_list() {
    return this.sankey.selected_data_tags_list
  }

  /**
   * Get value object.
   * Either search correct current value with data_taggs,
   * or return directly the value when there is no data_taggs
   * @readonly
   * @memberof Class_LinkElement
   */
  public get value(): Class_LinkValue | null {
    if (this._values instanceof Class_LinkValue)
      return this._values
    else
      return this._values.getValueForDataTags(this.selected_data_tags_list as Class_DataTag[]) as Class_LinkValue | null
  }

  /**
   * os#1511 lot 1 — VALEURS CONTRIBUTRICES de ce flux pour la sélection courante, agrégat
   * compris. Pendant de `value`, qui n'adresse qu'un POINT du cube : depuis qu'une dimension
   * peut porter une hiérarchie, viser un membre PARENT doit rendre ce que portent ses
   * feuilles.
   *
   * `null` signifie ABSENT — rien à dessiner — et se distingue d'un zéro, qui est une valeur.
   * La LISTE est rendue plutôt que sa somme : la couche à lire (donnée saisie ou résultat
   * réconcilié) dépend du flux, et `valueCurrent` sait déjà la choisir.
   *
   * Un flux sans aucune dimension porte sa valeur directement : il contribue pour lui-même.
   */
  public get contributing_values(): Class_LinkValue[] | null {
    return this.contributingValuesFor(this.selected_data_tags_list as Class_DataTag[])
  }

  /**
   * os#1511 — les valeurs contributrices pour une coordonnée DONNÉE, sans passer par la
   * sélection.
   *
   * La désagrégation lit un membre après l'autre. Le faire en posant la sélection coûtait
   * 36 s sur le SOCLE pour huit membres : chaque bascule parcourt les 263 étiquettes de l'axe
   * et invalide au passage les caches de visibilité de tout le diagramme. Viser la coordonnée
   * directement ne touche à rien et ne laisse rien à restaurer.
   */
  public contributingValuesFor(
    data_tags: Class_DataTag[], sans_repli?: ReadonlySet<string>
  ): Class_LinkValue[] | null {
    if (this._values instanceof Class_LinkValue) {
      if (this._values.structurally_absent) return null
      return [this._values]
    }
    return this._values.getContributingValues(data_tags, sans_repli) as Class_LinkValue[] | null
  }

  /**
   * Épaisseur cible (px) de ce flux quand il est la référence d'échelle du view tag COURANT
   * (cf. DrawingArea.applyViewTagScaleReference). undefined si ce flux n'est pas la référence
   * du view tag courant, ou en « vue complète » (aucun view tag sélectionné). La donnée vit
   * sur la DrawingArea (par view tag), pas comme attribut de flux — la valeur dépend du view
   * tag affiché.
   */
  public get scale_reference_thickness(): number | undefined {
    const vt_id = this.sankey.current_scale_reference_viewtag_id
    if (!vt_id) return undefined
    const ref = this.drawing_area.scale_reference_by_viewtag[vt_id]
    return (ref && ref.link_id === this.id) ? ref.thickness : undefined
  }
  public set scale_reference_thickness(value: number | undefined) {
    const vt_id = this.sankey.current_scale_reference_viewtag_id
    if (!vt_id) return
    this.drawing_area.setScaleReferenceForViewTag(vt_id, (value && value > 0) ? this.id : undefined, value ?? 0)
  }

  private _is_computing = false
  public get valueCurrent() {
    return this.valueCurrentIn(this._reads_collected_layer)
  }

  /**
   * os#1511 — `valueCurrent` lu dans une couche EXPLICITE (donnée collectée si `collected`, résultat
   * réconcilié sinon) : la lecture d'une figure qui a sa propre couche. Même règle, mêmes replis
   * (agrégat d'un parent, groupes porteurs, bandes) — seul le choix de couche change.
   */
  public valueCurrentIn(collected: boolean): number | null {
    if (this._is_computing) {
      return null
    }
    this._is_computing = true
    // Issue #1225 — pour les liens d'expansion, la valeur n'est pas stockée
    // mais calculée dynamiquement à partir des flux pertinents de l'enfant
    // (côté direction d'expansion s'il en a, sinon côté opposé — le parent
    // joue alors le rôle d'agrégateur).
    if (this._is_expansion_link) {
      const v = this._computeExpansionValue()
      this._is_computing = false
      return v
    }
    let value_current = null
    value_current = this.value === null ? null : this.readLayer(this.value, collected)
    // os#1511 lot 1 — AGRÉGAT d'un membre PARENT. `value` n'adresse qu'un point du cube : sur
    // une dimension hiérarchisée, viser « Céréales » ne trouve rien, la donnée étant portée
    // par « Blé » et « Maïs ». Le flux se dessinait alors SANS VALEUR (constaté par Julien sur
    // le jeu de démonstration, 28/09) — c'est ici, et nulle part ailleurs, que l'agrégat entre
    // dans le dessin.
    //
    // Le repli ne joue que faute de valeur propre : une valeur saisie au niveau demandé prime
    // toujours sur la somme de ses feuilles. Et il ne coûte le parcours de l'arbre que si le
    // diagramme porte vraiment une hiérarchie.
    if (value_current === null && this.sankey.data_taggs_list.some(tagg => (tagg as Class_DataTagGroup).is_hierarchical)) {
      const contributions = this.contributing_values
      if (contributions !== null) {
        const portees = contributions
          .map(v => this.readLayer(v, collected))
          .filter((v): v is number => v !== null)
        if (portees.length > 0) value_current = portees.reduce((total, v) => total + v, 0)
      }
    }
    // #285 (§3.0ter) — pas de valeur principale : avec des groupes PORTEURS,
    // la valeur affichée est celle du TAG SÉLECTIONNÉ (comme pour les
    // dataTags), même si un scalaire hérité subsiste (il ne sert plus que de
    // secours solveur). À défaut : somme des visibles en bannière multi, puis
    // première valeur (compat fichiers sans flag porteur).
    {
      const tvs = (this.value?.tagged_values_list ?? []).filter(tv => tv.value !== null)
      if (tvs.length > 0) {
        const carrying = this.sankey.flux_taggs_list.filter(tagg => tagg.carries_values)
        if (carrying.length > 0) {
          // #285 — groupe porteur ADDITIF : la valeur du flux = SOMME des valeurs
          // coordonnées visibles (le total ; le détail est en bandes). Cas unité
          // (non additif) : valeur du TAG SÉLECTIONNÉ (kWh/t/€ non sommables).
          if (carrying.some(tagg => tagg.is_additive_carrier)) {
            const visible = tvs.filter(tv => tv.tags_list.every(tag => tag.is_selected))
            const summed = (visible.length > 0 ? visible : tvs)
            value_current = summed.reduce((acc, tv) => acc + (tv.value as number), 0)
          } else {
            const matches_selection = (tv: Class_ElementTaggedValue) => carrying.every(tagg => {
              const mine = tv.getTagForGroup(tagg)
              return !mine || mine.is_selected
            })
            const selected_tv = tvs.find(tv =>
              matches_selection(tv) && carrying.some(tagg => tv.getTagForGroup(tagg)))
            if (selected_tv) value_current = selected_tv.value
          }
        }
        if (value_current === null) {
          const multi = this.sankey.flux_taggs_list.some(tagg => tagg.banner === 'multi')
          if (multi) {
            const visible = tvs.filter(tv => tv.tags_list.every(tag => tag.is_selected))
            if (visible.length > 0)
              value_current = visible.reduce((acc, tv) => acc + (tv.value as number), 0)
          }
        }
        if (value_current === null) value_current = tvs[0].value
      }
      // Dimension en bannière multi : le flux affiche la somme des tranches
      // sélectionnées (l'épaisseur passe de toute façon par les bandes) —
      // sans quoi value serait null (résolution 1 tag/groupe) et le flux
      // serait pris pour un flux de structure.
      if (value_current === null) {
        // os#1511 (14/10) — la dimension qui fait les bandes d'abord (cf. `draws_bands`).
        const multi_dim = this.bandDimension() ??
          this.sankey.data_taggs_list.find(tagg => tagg.banner === 'multi' && tagg.tags_list.length > 1)
        if (multi_dim) {
          const vals = multi_dim.selected_tags_list
            .map(tag => {
              const leaf = this.valueForTag(tag as Class_DataTag) as Class_LinkValue | null
              return leaf === null ? null : this.readLayer(leaf, collected)
            })
            .filter((v): v is number => v !== null)
          if (vals.length > 0) value_current = vals.reduce((a, b) => a + b, 0)
        }
      }
    }
    this._is_computing = false
    return value_current
  }

  /**
   * Calcule la valeur affichée d'un lien d'expansion (issue #1225).
   *
   * En expand_left, le lien va `enfant → parent`. La valeur représente la
   * part de l'enfant dans le flux entrant agrégé du parent — calculée comme
   * la somme des inputs visibles de l'enfant (flux venant de plus à gauche),
   * EXCLUANT les autres liens d'expansion. Si l'enfant n'a pas d'inputs
   * (extrémité), on retombe sur ses outputs (le parent joue le rôle
   * d'agrégateur). Symétrique pour expand_right.
   */
  private _computeExpansionValue(): number | null {
    // Détermine quel endpoint est l'enfant et quel est le parent expansé,
    // ainsi que le côté d'expansion. On regarde les dimensions des deux
    // endpoints pour trouver la dim parent↔enfant en mode is_expanded.
    let childNode: Class_NodeElement | null = null
    let expand_left = false
    // Cas 1 : source est enfant, target est parent (expand_left)
    for (const d of this._source.dimensions_as_child) {
      if (d.is_expanded && d.parent.id === this._target.id) {
        childNode = this._source
        expand_left = d.expanded_left
        break
      }
    }
    // Cas 2 : target est enfant, source est parent (expand_right)
    if (!childNode) {
      for (const d of this._target.dimensions_as_child) {
        if (d.is_expanded && d.parent.id === this._source.id) {
          childNode = this._target
          expand_left = d.expanded_left
          break
        }
      }
    }
    // Cas 3 : transitivité — childNode est descendant transitif via dim
    // force_show_children. On utilise Class_NodeElement.findExpandedAncestor.
    if (!childNode) {
      const sourceAnc = this._source.findExpandedAncestor()
      if (sourceAnc && sourceAnc.ancestor.id === this._target.id) {
        childNode = this._source
        expand_left = sourceAnc.side === 'left'
      } else {
        const targetAnc = this._target.findExpandedAncestor()
        if (targetAnc && targetAnc.ancestor.id === this._source.id) {
          childNode = this._target
          expand_left = targetAnc.side === 'left'
        }
      }
    }
    if (!childNode) return null
    // Somme des flux pertinents côté direction X (côté de l'expansion).
    // En expand_left : direction X = gauche → inputs de childNode (sources à gauche).
    // En expand_right : direction X = droite → outputs de childNode (targets à droite).
    // Exclure les liens d'expansion eux-mêmes pour éviter le cycle.
    const sumLinks = (links: Class_LinkElement[]) => {
      let total = 0
      let any = false
      for (const l of links) {
        if (l === this) continue
        if (l.is_expansion_link || l.is_split_link) continue
        if (!l.is_visible_ignoring_container_modes) continue
        const v = l.value?.valueResult ?? l.value?.valueData ?? null
        if (v != null) { total += v; any = true }
      }
      return any ? total : null
    }
    const primary = expand_left ? childNode.input_links_list : childNode.output_links_list
    const fallback = expand_left ? childNode.output_links_list : childNode.input_links_list
    return sumLinks(primary) ?? sumLinks(fallback)
  }

  /**
   * Either set correct current value with data_taggs,
   *  or set directly the value when there is no data_taggs
   * @memberof Class_LinkElement
   */
  public set valueCurrent(_: number | null) {
    const value = this.value
    // Cast as number
    if (value !== null) {
      // SA#507 — quand la case Incertitude porte « infini », la case Valeur ne
      // saisit plus une mesure mais une CIBLE : « approche-toi de celle-ci ».
      // Y écrire un nombre met donc la cible à jour, au lieu de retirer
      // l'intention comme le fait une saisie ordinaire.
      //
      // CE TEST PASSE AVANT LE CHOIX DE COUCHE ci-dessous, et c'est l'ordre juste : une cible
      // n'appartient à aucune des deux couches de valeur, elle dit ce que le solveur doit
      // chercher. La ranger dans la donnée collectée ou dans le résultat reviendrait à écrire
      // une mesure là où l'auteur a exprimé une intention.
      if (value.value_objective === Class_LinkElement.VALUE_OBJECTIVE_APPROACH) {
        value.value_objective_target = _
        this.redrawNodesSourceTarget()
        return
      }
      // os#1359 — on écrit dans la couche que l'on REGARDE, symétriquement au getter.
      // Auparavant toute saisie allait dans la donnée collectée et jetait le résultat :
      // corriger un affichage en « Calculées » écrasait donc une donnée d'entrée que
      // l'utilisateur ne voyait même pas, ET perdait la réconciliation — les deux jeux
      // d'un coup, sans un mot. Les deux couches ne se recouvrent plus : l'autre survit.
      if (this._writes_into_result_layer) {
        value.valueResult = _
        this._notifyValueLayer('collected_kept')
      } else {
        // `valueData` périme le résultat de ce flux (il ne dérive plus de sa donnée) :
        // le garder afficherait un nombre réconcilié qui ne veut plus rien dire.
        if (value.valueResult !== null) this._notifyValueLayer('result_dropped')
        value.valueData = _
      }
      // SA#487 — une valeur chiffrée et un « min » / « max » ne peuvent pas
      // coexister : le moteur ne saurait pas s'il doit honorer la valeur ou
      // chercher l'optimum. Saisir un nombre retire donc l'intention, et vider
      // le champ la retire aussi — c'est la même case, elle ne porte qu'une
      // chose à la fois. Même règle que le parser Excel côté ligne de données.
      value.value_objective = null
      value.value_objective_rank = null
      // SA#507 : la cible part avec l'intention — elle n'a aucun sens sans elle,
      // et la laisser traîner la ferait resurgir à la prochaine intention posée
      // sur la même cellule.
      value.value_objective_target = null
      this.redrawNodesSourceTarget()
    }
  }

  /**
   * os#1359 — vrai quand une saisie de valeur doit aller dans la couche réconciliée
   * plutôt que dans la donnée collectée : l'utilisateur regarde un résultat de
   * réconciliation, il en corrige donc l'affichage, il ne saisit pas une donnée d'entrée.
   *
   * Faux dès qu'il n'y a pas de résultat à corriger — le cas de très loin le plus courant,
   * un diagramme construit à la main : la saisie reste alors ce qu'elle a toujours été,
   * la donnée collectée du flux.
   */
  private get _writes_into_result_layer(): boolean {
    return !this._reads_collected_layer && (this.value?.valueResult ?? null) !== null
  }

  /**
   * Dit laquelle des deux couches vient d'être écrite, et laquelle a survécu ou non.
   * Sans ce mot, l'utilisateur ne peut pas savoir que sa saisie n'est pas allée là où il
   * croyait : les deux couches portent le même nombre à l'écran, et rien ne les distingue.
   */
  private _notifyValueLayer(kind: 'collected_kept' | 'result_dropped'): void {
    const app_data = this.drawing_area.application_data
    app_data.notifyUser(
      `value_edit_${kind}`,
      app_data.t(`toast.value_edit.${kind}.title`),
      app_data.t(`toast.value_edit.${kind}.desc`),
      kind === 'result_dropped' ? 'warning' : 'info',
      // Une règle de fonctionnement, dite une fois : saisir une série de valeurs ne doit
      // pas faire clignoter le même bandeau à chaque champ quitté.
      true
    )
  }

  /**
   * SA#487 — intention d'optimisation sur la valeur de ce flux : « min », « max »
   * ou null. Écrite là où l'utilisateur formule son intention — la case Valeur —
   * exactement comme dans la colonne Valeur d'une feuille de données.
   *
   * Le rang est attribué ici, et il compte : c'est lui qui arbitre entre
   * plusieurs « min » concurrents, que le moteur fige l'un après l'autre. Dans
   * un classeur, c'est l'ordre des lignes ; dans l'application, il n'y a pas de
   * lignes — l'ordre est donc celui des déclarations, et le rang se prend à la
   * suite du plus grand déjà posé sur le diagramme.
   */
  public get valueObjectiveCurrent(): string | null {
    return this.value?.value_objective ?? null
  }

  public set valueObjectiveCurrent(_: string | null) {
    const value = this.value
    if (value === null) return
    value.value_objective = _
    if (_ === null) {
      value.value_objective_rank = null
      value.value_objective_target = null
    } else {
      value.valueData = null
      value.valueResult = null
      if (value.value_objective_rank === null) {
        value.value_objective_rank = this.nextValueObjectiveRank()
      }
      // SA#507 : « la plus petite » / « la plus grande » disent une direction,
      // pas une cible.
      if (_ !== Class_LinkElement.VALUE_OBJECTIVE_APPROACH) {
        value.value_objective_target = null
      }
    }
    this.redrawNodesSourceTarget()
  }

  /**
   * SA#507 — cible visée par une intention « au plus près de … ».
   *
   * La poser EST la déclaration : elle installe l'intention `target` et sa
   * notation, comme écrire un nombre dans la cellule Valeur en regard d'une
   * incertitude infinie. Toujours un nombre FINI — l'infini se dit « max », et
   * le laisser entrer ici comme un nombre ramènerait la sentinelle que SA#487 a
   * chassée des solveurs.
   */
  public get valueObjectiveTargetCurrent(): number | null {
    return this.value?.value_objective_target ?? null
  }

  public set valueObjectiveTargetCurrent(_: number | null) {
    const value = this.value
    if (value === null) return
    if (_ === null) {
      value.value_objective_target = null
      if (value.value_objective === Class_LinkElement.VALUE_OBJECTIVE_APPROACH) {
        this.valueObjectiveCurrent = null
      }
      return
    }
    if (!Number.isFinite(_)) return
    value.value_objective_target = _
    this.valueObjectiveCurrent = Class_LinkElement.VALUE_OBJECTIVE_APPROACH
  }

  /**
   * SA#507 — « incertitude infinie » : la case Valeur cesse d'être une mesure
   * pour devenir une cible.
   *
   * C'est la notation du classeur, portée dans l'application : une incertitude
   * infinie est une valeur qui ne contraint rien, donc pas une donnée mais un
   * souhait. L'allumer transforme la valeur saisie en cible ; l'éteindre la
   * rend au champ Valeur, de sorte que l'aller-retour ne perde rien.
   */
  public get dataUncertaintyIsInfinite(): boolean {
    return (this.value?.value_objective ?? null) !== null
  }

  public set dataUncertaintyIsInfinite(_: boolean) {
    const value = this.value
    if (value === null) return
    if (!_) {
      if (!this.dataUncertaintyIsInfinite) return
      const restored =
        value.value_objective === Class_LinkElement.VALUE_OBJECTIVE_APPROACH
          ? value.value_objective_target
          : null
      this.valueObjectiveCurrent = null
      this.valueCurrent = restored
      return
    }
    if (this.dataUncertaintyIsInfinite) return
    // La valeur déjà saisie devient la cible — c'est elle que l'utilisateur
    // regarde en cochant, et la reperdre serait incompréhensible. Rien de
    // saisi : la cible est zéro, ce que « incertitude infinie » dit d'un flux
    // d'équilibrage.
    this.valueObjectiveTargetCurrent = value.valueData ?? 0
  }

  private nextValueObjectiveRank(): number {
    let max_rank = -1
    this.drawing_area.sankey.links_list.forEach(link => {
      Object.values(link.getAllValues()).forEach(([value]) => {
        const rank = value.value_objective_rank
        if (rank !== null && rank > max_rank) max_rank = rank
      })
    })
    return max_rank + 1
  }

  /**
   * Target (destination) value for the link.
   * When null, the link has uniform thickness (same as source).
   * When set, the link tapers from source value to target value.
   */
  public get valueCurrentTarget(): number | null {
    return this.valueCurrentTargetIn(this._reads_collected_layer)
  }

  /** os#1511 — `valueCurrentTarget` dans une couche explicite (cf. `valueCurrentIn`). */
  public valueCurrentTargetIn(collected: boolean): number | null {
    if (this._is_computing) return null
    this._is_computing = true
    let value_target = null
    if (collected) {
      value_target = this.value?.valueDataTarget ?? null
    } else {
      value_target = this.value?.valueResultTarget ?? ((this.value?.value_option == 'value' || this.value?.value_option == 'intervals') ? this.value?.valueDataTarget : null) ?? null
    }
    this._is_computing = false
    return value_target
  }

  public set valueCurrentTarget(_: number | null) {
    const value = this.value
    if (value !== null) {
      // os#1359 — même règle que `valueCurrent` : la saisie va dans la couche affichée.
      if (!this._reads_collected_layer && value.valueResultTarget !== null) {
        value.valueResultTarget = _
        this._notifyValueLayer('collected_kept')
      } else {
        if (value.valueResultTarget !== null) this._notifyValueLayer('result_dropped')
        value.valueDataTarget = _
      }
      this.redrawNodesSourceTarget()
    }
  }

  // Min / Max / Uncertainty accessors ====================================================

  public get dataMin(): number | null {
    return this.value?.data_min ?? null
  }

  public set dataMin(_: number | null) {
    const value = this.value
    if (value !== null) {
      value.data_min = _
      this.drawValueLabel()
      this.drawNameLabel()
    }
  }

  public get dataMax(): number | null {
    return this.value?.data_max ?? null
  }

  public set dataMax(_: number | null) {
    const value = this.value
    if (value !== null) {
      value.data_max = _
      this.drawValueLabel()
      this.drawNameLabel()
    }
  }

  public get dataUncertainty(): number | null {
    return this.value?.data_uncertainty ?? null
  }

  public set dataUncertainty(_: number | null) {
    const value = this.value
    if (value !== null) {
      value.data_uncertainty = _
    }
  }

  /**
   * Either search correct current value with data_taggs,
   *  or return directly the value when there is no data_taggs
   * @return string
   * @memberof Class_LinkElement
   */
  public get text_value() {
    const value = this.value
    // Cast as string
    if (value !== null && value.text_value !== null) return value.text_value
    else return ''
  }

  /**
   * Either set correct current value with data_taggs,
   *  or set directly the value when there is no data_taggs
   * @memberof Class_LinkElement
   */
  public set text_value(_: string) {
    const value = this.value
    // Cast as number
    if (value !== null) {
      value.text_value = _
      this.drawNameLabel()
    }
  }



  public unit_name(prefix: 'name_label' | 'value_label') {
    if (prefix == 'value_label') {
      if (this.value_label_unit_type == 'unit_name') return this.value_label_unit
      // OS#1286 — unité résolue depuis le registre d'unités du diagramme.
      if (this.value_label_unit_type == 'unit_model')
        return this.sankey.units.resolve(this.value_label_unit)?.unit.label ?? ''
      const unit_taggs = this.sankey.getTagGroupsAsList('data_taggs').filter(tagg => tagg.is_unit) as Class_DataTagGroup[]
      if (unit_taggs.length > 0) {
        if (!this.selected_data_tags_list) return unit_taggs[0].selected_tags_list[0].name
        else return this.selected_data_tags_list.filter(tag => tag.group.is_unit)[0].name
      }
      return ''
    }
    if (this.name_label_unit_type == 'unit_name') return this.name_label_unit
    if (this.name_label_unit_type == 'unit_model')
      return this.sankey.units.resolve(this.name_label_unit)?.unit.label ?? ''
    const unit_taggs = this.sankey.getTagGroupsAsList('data_taggs').filter(tagg => tagg.is_unit) as Class_DataTagGroup[]
    if (unit_taggs.length > 0) {
      if (!this.selected_data_tags_list) return unit_taggs[0].selected_tags_list[0].name
      else return this.selected_data_tags_list.filter(tag => tag.group.is_unit)[0].name
    }
    return ''
  }

  public data_label(prefix: 'name_label' | 'value_label') {
    return link_data_label(this.sankey.drawing_area.type_data, this, prefix)
  }

  /**
   * OS#1314 — texte du label de nom construit par gabarit à jetons
   * (`name_label_text_source === 'template'`). Exposé ici pour que le rendu
   * (DrawLabel) n'ait pas à importer types/Utils : ce chemin
   * DrawLabel -> Utils -> Node -> NodeBase -> DrawLabel refermerait le cycle
   * d'initialisation des modules (cf. arch_element_handler_init_cycle).
   */
  public get template_label(): string {
    return link_template_label(this)
  }

  /**
   * Dict as [id: tag] of tags related to link
   * @readonly
   * @memberof Class_LinkElement
   */
  public get flux_tags_dict() {
    const value = this.value
    if (value)
      return this.value.flux_tags_dict
    return {}
  }

  /**
   * Array of tags related to link
   * @readonly
   * @memberof Class_LinkElement
   */
  public get flux_tags_list() {
    // SA#580 - etiquettes portees A L'ECRAN par la valeur affichee, groupes par regles compris
    const value = this.value
    if (value)
      return value.effective_flux_tags_list
    return []
  }

  /**
   * Dict as [id: tag group] of tag groups related to link
   * @readonly
   * @memberof Class_LinkElement
   */
  public get flux_taggs_dict() {
    // SA#580 - groupes des etiquettes portees a l'ecran (cf. `flux_tags_list`)
    const taggs: { [_: string]: Class_TagGroup; } = {}
    this.flux_tags_list.forEach(tag => { taggs[tag.group.id] ??= tag.group })
    return taggs
  }

  /**
   * Array of tag groups related to link
   * @readonly
   * @memberof Class_LinkElement
   */
  public get flux_taggs_list() {
    return Object.values(this.flux_taggs_dict)
  }

  public drawFO() {
    if (!this._link_draw_label) return
    this._link_draw_label.drawFO()
  }



  public linkIsStructure = () => {
    if (this.sankey.drawing_area.type_data == 'structure') return true
    if (this.sankey.drawing_area.type_data == 'data') {
      if (this.value?.value_option === 'intervals') return true
      if (this.value?.value_option != 'value' || this.value.valueData == null) return true
    }
    if (this.sankey.drawing_area.type_data == 'free_value' || this.sankey.drawing_area.type_data == 'free_interval') {
      if (this.valueCurrent == null) return true
    }
    if (this.sankey.drawing_area.type_data == 'reconciled') {
      if (this.value?.has_intervals) return true
    }
    return this.shape_is_structure
  }

  /**
   * Clamp a raw pixel thickness to the drawing area min/max limits.
   *
   * Le plancher est `minimum_flux` quand il est défini (0 compris → épaisseur
   * réelle du flux), sinon le plancher dur historique de 2px (#200). Politique
   * pure isolée dans flowThickness.ts (testable hors cycle d'imports).
   */
  private _clampThickness(linkValueInPx: number): number {
    return clampLinkThickness(
      linkValueInPx,
      this.drawing_area.minimum_flux,
      this.drawing_area.maximum_flux
    )
  }

  /**
   * Get thickness of stroke shape (source side).
   * This is the main thickness used everywhere for backward compatibility.
   * @readonly
   * @memberof Class_LinkElement
   */
  /**
   * OS#189 — facteur d'échelle temporaire appliqué à l'épaisseur pendant la
   * génération des contours de bandes d'incertitude (formes pleines). Posé puis
   * remis à null immédiatement par LinkDrawShape autour d'un getBezierPath, de
   * sorte que toute la géométrie du contour (getLineShape/getBezierShape, qui
   * lisent thickness/thicknessSource/thicknessTarget) soit régénérée à la
   * largeur min/max sans dupliquer le code de tracé. null = épaisseur nominale.
   */
  private _uncertainty_thickness_scale: number | null = null

  public setUncertaintyThicknessScale(scale: number | null) {
    this._uncertainty_thickness_scale = scale
  }

  private _scaleUncertainty(px: number): number {
    return this._uncertainty_thickness_scale != null ? px * this._uncertainty_thickness_scale : px
  }

  public get thickness() {
    // force_min only impacts STRUCTURAL flows (intervals / indéterminés / dashed).
    // Solid flows with a real value keep their proportional thickness even in
    // structure_display mode — otherwise a single value-bearing flow alongside
    // structural ones would get crushed to minimum_flux too.
    if (
      this.drawing_area.is_structure_display
      && this.shape_structure_force_min
      && this.linkIsStructure()
    ) {
      return this._scaleUncertainty(this._clampThickness(0))
    }
    const bands_px = this._bands_total_px
    if (bands_px !== null) return this._clampThickness(bands_px)
    const data_value = this.valueCurrent
    const linkValueInPx = (data_value !== null) ? this.scaleValueToPx(data_value) : 2
    return this._scaleUncertainty(this._clampThickness(linkValueInPx))
  }

  /**
   * Bornes d'incertitude à représenter (issue OS#189). L'intervalle [min, max]
   * entourant la valeur affichée suit le MODE d'affichage courant : en mode
   * `data` on prend les bornes saisies (data_min/data_max), sinon (réconcilié /
   * libre) les bornes réconciliées (result_min/result_max). Repli sur l'autre
   * jeu de bornes si celui du mode est absent. Null si aucun intervalle
   * exploitable (bornes absentes ou dégénérées max <= min).
   */
  public get uncertaintyBounds(): { min: number, max: number } | null {
    const v = this.value
    if (!v) return null
    const use_data_first = this._reads_collected_layer
    const lo = use_data_first ? (v.data_min ?? v.result_min) : (v.result_min ?? v.data_min)
    const hi = use_data_first ? (v.data_max ?? v.result_max) : (v.result_max ?? v.data_max)
    if (lo == null || hi == null || hi <= lo) return null
    return { min: lo, max: hi }
  }

  /**
   * Épaisseurs en px des trois tracés superposés min/moyenne/max servant à
   * matérialiser l'incertitude (OS#189). `meanPx` = épaisseur nominale du flux
   * (this.thickness). Renvoie null quand l'affichage est désactivé
   * (shape_uncertainty_display) ou qu'il n'y a pas d'intervalle exploitable.
   */
  public get uncertaintyBandsPx(): { minPx: number, meanPx: number, maxPx: number } | null {
    if (!this.shape_uncertainty_display) return null
    const bounds = this.uncertaintyBounds
    if (!bounds) return null
    return {
      minPx: this._clampThickness(this.scaleValueToPx(bounds.min)),
      meanPx: this.thickness,
      maxPx: this._clampThickness(this.scaleValueToPx(bounds.max))
    }
  }

  /**
   * Alias for thickness at the source end of the link.
   */
  public get thicknessSource() {
    return this.thickness
  }

  /**
   * Get thickness at the target (destination) end of the link.
   * When valueCurrentTarget is null, returns same as thicknessSource (uniform link).
   */
  public get thicknessTarget() {
    if (
      this.drawing_area.is_structure_display
      && this.shape_structure_force_min
      && this.linkIsStructure()
    ) {
      return this._scaleUncertainty(this._clampThickness(0))
    }
    const bands_px = this._bands_total_px
    if (bands_px !== null) return this._clampThickness(bands_px)
    const target_value = this.valueCurrentTarget
    if (target_value === null) return this.thickness
    const linkValueInPx = this.scaleValueToPx(target_value)
    return this._scaleUncertainty(this._clampThickness(linkValueInPx))
  }

  // Raw (non-clamped) thicknesses used by nodes to compute proportional
  // shape height and anchor offsets. The visual draw still uses the clamped
  // thicknesses (min 2px + drawing_area min/max); using the raw value here
  // keeps node height and anchor positions proportional to link values,
  // at the cost of visual overlaps for very thin links.
  // We still floor at 0 and reject NaN/Infinity so a misconfigured scale
  // (e.g. d3 extrapolation, missing domain) cannot produce broken anchor math.
  private _safeRawThickness(raw: number): number {
    if (!Number.isFinite(raw) || raw < 0) return 0
    // Respect the maximum_flux cap: a flow whose value exceeds the cap is DRAWN
    // clamped at maximum_flux, so node height and anchor offsets must use the
    // same capped value — otherwise the node grows past the visible flux stack.
    // The minimum cap is intentionally NOT applied here (see the comment block
    // above): summing the per-link 2px/minimum_flux floor would inflate nodes
    // that carry many thin links.
    if (this.drawing_area.maximum_flux && raw > this.drawing_area.maximum_flux) {
      return this.drawing_area.maximum_flux
    }
    return raw
  }

  public get thicknessSourceRaw() {
    // Per-link force_min : a structural flow contributes 0 raw thickness so
    // structural siblings stack at the same y (overlap at the node anchor),
    // while value-bearing solid flows keep claiming their proportional space
    // in the cumulative offset.
    if (
      this.drawing_area.is_structure_display
      && this.shape_structure_force_min
      && this.linkIsStructure()
    ) {
      return 0
    }
    const bands_px = this._bands_total_px
    if (bands_px !== null) return this._safeRawThickness(bands_px)
    const data_value = this.valueCurrent
    if (data_value === null) return 2
    return this._safeRawThickness(this.scaleValueToPx(data_value))
  }

  public get thicknessTargetRaw() {
    if (
      this.drawing_area.is_structure_display
      && this.shape_structure_force_min
      && this.linkIsStructure()
    ) {
      return 0
    }
    const bands_px = this._bands_total_px
    if (bands_px !== null) return this._safeRawThickness(bands_px)
    const target_value = this.valueCurrentTarget
    if (target_value === null) return this.thicknessSourceRaw
    return this._safeRawThickness(this.scaleValueToPx(target_value))
  }

  /**
   * Whether this link has different source and target thicknesses (tapered/trapezoid shape).
   */
  public get isTapered() {
    return this.valueCurrentTarget !== null && this.thicknessSource !== this.thicknessTarget
  }

  /**
   * OS#1250 phase 3 — points de contrôle du tracé, en coordonnées MONDE.
   *
   * Exposés pour borner le flux SANS mesurer le DOM : une Bézier est contenue dans
   * l'enveloppe convexe de ses points de contrôle, donc ces points (élargis de la
   * demi-épaisseur) majorent le tracé — y compris les flux de recyclage, qui bouclent
   * franchement hors du segment source→cible.
   */
  public get control_points_position() {
    return this._link_control_points.control_points_position
  }

  public get position_x_start() {
    // os#1510 — ancre radiale : le point du contour, tel quel (ni marge de côté, ni recul de flèche).
    if (this._source_anchor_normal) return this._position.x
    const source_side = this.source_side
    // Avec une flèche côté source, le trait est raccourci côté source pour laisser
    // place à la pointe (symétrique de position_x_end côté cible).
    let shifting_start_point_x = 0
    if (this.shape_arrow_at_source) {
      const is_horizontal_at_source = this.is_source_horizontal
      const is_revert = (is_horizontal_at_source && source_side === 'right') || (!is_horizontal_at_source && source_side === 'bottom')
      const sign = is_revert ? -1 : 1
      shifting_start_point_x = is_horizontal_at_source ? this.shape_arrow_size * sign : 0
    }
    const base_x = this._position.x - shifting_start_point_x
    if (source_side === 'right') {
      return base_x + this.source.shape_margin_right
    } else if (source_side === 'left') {
      return base_x - this.source.shape_margin_left
    } else {
      // top ou bottom : ajuster pour le centrage horizontal
      return base_x
    }
  }

  public get position_y_start() {
    if (this._source_anchor_normal) return this._position.y
    const source_side = this.source_side
    let shifting_start_point_y = 0
    if (this.shape_arrow_at_source) {
      const is_horizontal_at_source = this.is_source_horizontal
      const is_revert = (is_horizontal_at_source && source_side === 'right') || (!is_horizontal_at_source && source_side === 'bottom')
      const sign = is_revert ? -1 : 1
      shifting_start_point_y = !is_horizontal_at_source ? this.shape_arrow_size * sign : 0
    }
    const base_y = this._position.y - shifting_start_point_y
    if (source_side === 'top') {
      return base_y - this.source.shape_margin_top
    } else if (source_side === 'bottom') {
      return base_y + this.source.shape_margin_bottom
    } else {
      // left ou right : ajuster pour le centrage vertical
      return base_y
    }
  }

  public get position_x_end() {
    // os#1510 lot 2 — ancre radiale : le point du contour, reculé le long de la normale de la
    // taille de la pointe s'il y en a une (le corps s'arrête où la pointe commence).
    const normal = this._target_anchor_normal
    if (normal) return this._position_ending.x + (this.shape_is_arrow ? normal.x * this.shape_arrow_size : 0)
    // Calcul du décalage pour la flèche (code existant)
    let shifting_end_point_x = 0
    if (this.shape_is_arrow) {
      const is_horizontal_at_target = this.is_target_horizontal
      const is_revert = (is_horizontal_at_target && this.target_side == 'right') || (!is_horizontal_at_target && this.target_side == 'bottom')
      const sign_shifting_end_point = (is_revert) ? -1 : 1
      shifting_end_point_x = is_horizontal_at_target ? this.shape_arrow_size * sign_shifting_end_point : 0
    }

    const target_side = this.target_side
    const base_x = this._position_ending.x - shifting_end_point_x

    if (target_side === 'right') {
      return base_x + this.target.shape_margin_right
    } else if (target_side === 'left') {
      return base_x - this.target.shape_margin_left
    } else {
      // top ou bottom
      return base_x
    }
  }

  public get position_y_end() {
    const normal = this._target_anchor_normal
    if (normal) return this._position_ending.y + (this.shape_is_arrow ? normal.y * this.shape_arrow_size : 0)
    // Calcul du décalage pour la flèche (code existant)
    let shifting_end_point_y = 0
    if (this.shape_is_arrow) {
      const is_horizontal_at_target = this.is_target_horizontal
      const is_revert = (is_horizontal_at_target && this.target_side == 'right') || (!is_horizontal_at_target && this.target_side == 'bottom')
      const sign_shifting_end_point = (is_revert) ? -1 : 1
      shifting_end_point_y = !is_horizontal_at_target ? this.shape_arrow_size * sign_shifting_end_point : 0
    }

    const target_side = this.target_side
    const base_y = this._position_ending.y - shifting_end_point_y

    if (target_side === 'top') {
      return base_y - this.target.shape_margin_top
    } else if (target_side === 'bottom') {
      return base_y + this.target.shape_margin_bottom
    } else {
      // left ou right
      return base_y
    }
  }

  // public set shape_local_link_scale(value: number | undefined) {
  //   this._display.attributes.shape_local_link_scale = value
  //   this.setDomainLocalScale(value)
  //   this.redrawNodesSourceTarget()
  // }




  // Orientation
  /**
   * os#1364 — L'ORIENTATION QUI S'APPLIQUE : le réglage, ou — s'il vaut « auto » — celle que le
   * quadrant de la cible décide (cf. `linkOrientation.ts`). TOUT ce qui dessine ou ordonne lit
   * ceci, jamais `shape_orientation` : l'inspecteur seul a besoin de voir « auto ».
   *
   * Centres estimés depuis la TAILLE BRUTE (`shape_min_*`), pas `getShapeWidthToUse()` : celle-ci
   * dérive la bande des flux ordonnés, qui lit `source_side`, qui lit `is_horizontal`, qui
   * reviendrait ici — même garde que `_waypointFacingSide`.
   */
  public get orientation_in_effect(): Type_Orientation {
    const setting = this.shape_orientation
    if (setting !== 'auto') return setting
    if (this.source === undefined || this.target === undefined) return 'hh'
    const dx = (this.target.position_x + this.target.shape_min_width / 2)
      - (this.source.position_x + this.source.shape_min_width / 2)
    const dy = (this.target.position_y + this.target.shape_min_height / 2)
      - (this.source.position_y + this.source.shape_min_height / 2)
    return resolveLinkOrientation(setting, dx, dy)
  }
  public get is_horizontal() { return this.orientation_in_effect === 'hh' }
  public get is_vertical() { return this.orientation_in_effect === 'vv' }
  public get is_horizontal_vertical() { return this.orientation_in_effect === 'hv' }
  public get is_vertical_horizontal() { return this.orientation_in_effect === 'vh' }

  /**
   * opensankey#1301 — RÉGIME ROUTÉ : le flux a des points de contrôle libres et n'est
   * plus paramétrique. shape_orientation (hh/vv/vh/hv) ne s'applique plus ; axe et côté
   * à chaque extrémité dérivent de la route (cf. NOTE-WAYPOINTS.md). Exclut le recyclage.
   */
  public get is_routed(): boolean {
    return !this.shape_is_recycling && Array.isArray(this.shape_waypoints) && this.shape_waypoints.length > 0
  }

  /**
   * Axe d'accroche par EXTRÉMITÉ (h = côté gauche/droite, v = haut/bas), source de
   * vérité pour le layout du nœud et les extrémités du tracé. En régime routé, l'axe
   * suit le CÔTÉ dérivé de la route (source_side/target_side) ; sinon, l'ancienne
   * combinaison d'orientation (source = 1ère lettre, cible = 2ème).
   */
  public get is_source_horizontal(): boolean {
    if (this.is_routed) return this.source_side === 'left' || this.source_side === 'right'
    return this.is_horizontal || this.is_horizontal_vertical
  }
  public get is_target_horizontal(): boolean {
    if (this.is_routed) return this.target_side === 'left' || this.target_side === 'right'
    return this.is_horizontal || this.is_vertical_horizontal
  }

  /**
   * Set and redraw d3 path for link arrow
   */
  public set shape_arrow_path(_: string) {
    this._arrow_shape = _
    // os#1374 — estampiller la pointe : c'est ce qui la fait survivre à l'invalidation des
    // dessins de flux qui suivent, dans la même époque d'éventail.
    // os#1384 — avec l'ancre dont elle vient : une ancre qui bouge ensuite la périme.
    this._arrow_stamp = this.sankey.drawing_area.arrow_epoch
    this._arrow_stamp_anchor = this._targetAnchorKey()
    this.drawArrow()
  }

  public set shape_arrow_path_source(_: string) {
    this._arrow_shape_source = _
    this._arrow_stamp_source = this.sankey.drawing_area.arrow_epoch
    this._arrow_stamp_source_anchor = this._sourceAnchorKey()
    this.drawArrow()
  }

  public set shape_source_notch_path(_: string) {
    this._source_notch_shape = _
    this.drawSourceNotch()
  }

  public get value_label_unit_is_reference() { return this._is_unit_reference }
  public set value_label_unit_is_reference(_) { this._is_unit_reference = _; this.drawValueLabel() }

  public get datatags_fingerprint() { return this._datatags_fingerprint }

  /**
   * If link has tags :
   * - check for each tag group if the flow has at least one selected tag that isn't filtered out
   * else if the link doesn't have tag it isn't filtered by them
   * @readonly
   * @memberof Class_LinkElement
   */
  public get are_related_flux_tags_selected(): boolean {
    // SA#580 - les etiquettes d'un flux sont celles de la VALEUR AFFICHEE : changer d'annee ou
    // d'unite les change (groupes par regles, etiquettes posees par annee). L'empreinte memorisee
    // couvre donc aussi la selection des etiquettes de donnees.
    const fingerprint = this.sankey.flux_tags_fingerprint + '|' + this.sankey.data_tags_fingerprint
    if (
      (this._are_related_flux_tags_selected === undefined) ||
      (fingerprint !== this._flux_tags_fingerprint)
    ) {
      // Recompute visibility value
      let are_related_flux_tags_selected: boolean
      const list_tag = this.flux_taggs_list
      if (list_tag.length > 0) {
        let display = true
        // Check if at least one flux tag is selected in each group = ok to display
        // SA#580 - groupes par regles compris (etiquette calculee sur la valeur affichee)
        Object.values(this.value?.effective_taggs_dict ?? {})
          .forEach(tag_list => {
            display = (tag_list.filter(tag => tag.is_selected).length > 0) ? display : false
          })
        are_related_flux_tags_selected = display
      }
      else {
        are_related_flux_tags_selected = true // if no tag associated to flux then ok to display
      }
      // SA#553 - un groupe que la valeur affichee ne porte pas etait ignore : il ne l'est plus
      // quand son etiquette generee est deselectionnee, le flux en est alors un porteur masque.
      if (are_related_flux_tags_selected && this.value) {
        are_related_flux_tags_selected = !this.sankey.flux_taggs_list.some(tagg => {
          const untagged = tagg.untagged_tag
          return untagged !== undefined && !untagged.is_selected && this.hasGivenTag(untagged)
        })
      }
      // Update  fingerprint if needed
      // -> This condition allows to avoid unecessary visibility recomputing on related elements
      //    that check this link's visibility fingerprint
      if (are_related_flux_tags_selected !== this._are_related_flux_tags_selected) {
        this.updateVisibilityFingerprint()
      }
      // Update memorized values
      this._are_related_flux_tags_selected = are_related_flux_tags_selected
      this._flux_tags_fingerprint = fingerprint
    }
    return this._are_related_flux_tags_selected
  }

  /**
   * If link value for current dataTagg parameter is different of 0 then pass the check,
   *
   * @readonly
   * @memberof Class_LinkElement
   */
  public get is_not_zero(): boolean {
    // #188 — a flux structurally absent for the current dataTags does not exist
    // there: it is never "non-zero", so it stays hidden. Checked before the
    // structure-mode short-circuit (which would otherwise force it visible) and
    // before the valueCurrent path (null for an absent leaf reads as "!= 0").
    if (this.is_structurally_absent_for_current_datatags) return false
    if (this.sankey.drawing_area.type_data === 'structure') {
      return true
    }
    if (
      (this._is_not_zero === undefined) ||
      (this._datatags_fingerprint !== this.sankey.data_tags_fingerprint)
    ) {
      // Recompute visibility value
      const is_not_zero = (this.valueCurrent !== 0)
      // Update  fingerprint if needed
      // -> This condition allows to avoid unecessary visibility recomputing on related elements
      //    that check this link's visibility fingerprint
      if (is_not_zero !== this._is_not_zero) {
        this.updateVisibilityFingerprint()
      }
      // Update memorized values
      this._is_not_zero = is_not_zero
      this._datatags_fingerprint = this.sankey.data_tags_fingerprint
    }
    return this._is_not_zero
  }


  // PRIVATE GETTER / SETTER =============================================================

  /**
   * Check if node source and node target are displayed,
   * if one of them is not then we don't display the link
   *
   * @private
   * @return {*}
   * @memberof Class_LinkElement
   */
  private get are_source_and_target_displayed(): boolean {
    if (
      (this._are_source_and_target_displayed === undefined) ||
      (this._source.visibility_fingerprint !== this._source_visibility_fingerprint) ||
      (this._target.visibility_fingerprint !== this._target_visibility_fingerprint)
    ) {
      // Recompute visibility value
      const are_source_and_target_displayed = (
        (this._source?.is_visible_without_orphan ?? false) &&
        (this._target?.is_visible_without_orphan ?? false)
      )
      // Update  fingerprint if needed
      // -> This condition allows to avoid unecessary visibility recomputing on related elements
      //    that check this link's visibility fingerprint
      if (are_source_and_target_displayed !== this._are_source_and_target_displayed) {
        this.updateVisibilityFingerprint()
      }
      // Update memorized values
      this._are_source_and_target_displayed = are_source_and_target_displayed
      this._source_visibility_fingerprint = this._source.visibility_fingerprint
      this._target_visibility_fingerprint = this._target.visibility_fingerprint
    }
    return this._are_source_and_target_displayed
  }

  /**
   * If drawing area has filter_link_value above 0:
   * - check if the link value is superior to the filter
   *   if not don't display the link
   * @readonly
   * @private
   * @memberof Class_LinkElement
   */
  protected get is_value_above_threshold(): boolean {
    // Mode pixel (#seuil px) : on compare l'épaisseur rendue, pas la valeur.
    if (this.drawing_area.filter_unit === 'pixel') {
      return this.isThicknessAbovePxThreshold(this.drawing_area.filter_link_value_px)
    }
    if (this.drawing_area.filter_link_value == 0) {
      return true
    }
    // Un flux sans valeur (ghost_link en cours de création au cliquer-glisser,
    // flux de structure) n'est pas concerné par le filtre de valeur minimale :
    // Number(null) === 0, donc le seuil le masquerait à tort et le pointillé de
    // création disparaîtrait dès que le filtre est > 0.
    if (this.valueCurrent == null) {
      return true
    }
    return Number(this.valueCurrent) >= this.drawing_area.filter_link_value
  }

  /** Lecture publique du seuil de flux : un nœud dont aucun flux ne le passe est orphelin. */
  public get passes_value_threshold(): boolean {
    return this.is_value_above_threshold
  }

  /**
   * Seuil d'affichage exprimé en pixels (#seuil px). Renvoie true (= le flux passe
   * le seuil) quand : le seuil est nul/négatif (désactivé), le flux n'a pas de
   * valeur (ghost/structure — jamais masqué par un seuil), ou son épaisseur
   * PROPORTIONNELLE (scaleValueToPx, avant plancher de lisibilité minimum_flux)
   * atteint le seuil. On volontairement ne clampe pas : le seuil doit refléter la
   * taille réelle de la donnée, pas le plancher de lisibilité.
   */
  public isThicknessAbovePxThreshold(px_threshold: number): boolean {
    if (!(px_threshold > 0)) return true
    if (this.valueCurrent == null) return true
    // Pixels ÉCRAN : l'épaisseur locale (repère SVG) est multipliée par le zoom
    // live `k` pour comparer au seuil exprimé en pixels réellement affichés.
    const screen_px = this.scaleValueToPx(Number(this.valueCurrent)) * this.drawing_area.getZoomScale()
    return screen_px >= px_threshold
  }
  public get tooltip_text(): string {
    return this._tooltip_text
  }

  public set tooltip_text(value: string) {
    this._tooltip_text = value
  }

  public static updateLinks = <K extends 'valueCurrent' | 'valueCurrentTarget' | 'text_value' | 'dataMin' | 'dataMax' | 'dataUncertainty' | 'valueObjectiveCurrent' | 'dataUncertaintyIsInfinite'>(
    data: Class_ApplicationData,
    elements: Class_LinkElement[],
    key: K,
    // SA#487 — « valueObjectiveCurrent » porte un mot-clé, donc une chaîne ou
    // rien ; les autres clés restent ce qu'elles étaient.
    // SA#507 — « dataUncertaintyIsInfinite » est un interrupteur.
    value: K extends 'text_value' ? string
      : K extends 'valueObjectiveCurrent' ? string | null
        : K extends 'dataUncertaintyIsInfinite' ? boolean
          : number | null,
    refreshParentComponent: () => void
  ) => {
    const dict_old_val: { [id: string]: number | string | boolean | null } = {}
    elements.forEach(element => {
      dict_old_val[element.id] = element[key]
    })

    // Original function
    const _updateElements = () => {
      elements.forEach(element => {
        Reflect.set(element, key, value)
      })
      refreshParentComponent()
    }

    // Undo function
    const inv_updateElements = () => {
      elements.forEach(element =>
        Reflect.set(element, key, dict_old_val[element.id])
      )
      refreshParentComponent()
    }

    data.history.saveUndo(inv_updateElements)
    data.history.saveRedo(_updateElements)
    _updateElements()
  }
}
