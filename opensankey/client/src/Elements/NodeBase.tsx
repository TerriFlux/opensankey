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

import * as d3 from '../d3Modules'
import i18next from 'i18next'

import { Type_LangMap, normalizeLang, resolveLangMap } from '../Persistence/persistenceMigrations'
import { Class_ElementStyle } from './Element'
import { NodeDrawNameLabel } from './DrawLabel'
import { Class_DrawingArea } from '../types/DrawingArea'
import { NodeDrawShape } from './NodeDrawShape'
import { Class_Handler } from './Handler'
import { Class_BaseShape } from './Element'
import { NodeEventsHandler } from './NodeEventsHandler'
import { isLegendElementId } from './legendIds'
import { applyTemplate, resolveTagGroupToken } from './LabelTemplate'
import { tiedFrameRefitLeft } from './tiedFrameRefit'
import { envelopeBBoxOfMembers, Type_EnvelopeMember } from './envelopeBBox'

export const default_selected_stroke_width = 3
//export const label_margin = 0

// Sources possibles pour le contenu du label de nom d'un nœud / d'une zone de
// texte. Voir l'attribut de style name_label_source (NAME_LABEL_CONFIG).
export type Type_NameLabelSource = 'name' | 'custom' | 'tag' | 'ancestor' | 'template'

export function sortNodesElements(
  a: Class_NodeBase | Class_ElementStyle,
  b: Class_NodeBase | Class_ElementStyle
) {
  if (a.name > b.name) return 1
  else if (a.name < b.name) return -1
  else return 0
}

export abstract class Class_NodeBase extends Class_BaseShape {
  private _drag_handler: {
    top: Class_Handler,
    bottom: Class_Handler,
    left: Class_Handler,
    right: Class_Handler,
  }
  // OS#1276b — poignées d'extrémité pour une ligne libre (shape_type === 'line').
  // Créées paresseusement (la plupart des nœuds ne sont pas des lignes) ; en mode
  // ligne elles REMPLACENT les 4 poignées de redimensionnement de boîte ci-dessus.
  private _line_endpoint_handler: { a: Class_Handler, b: Class_Handler } | null = null
  public _nodeEventsHandler: NodeEventsHandler
  public d3_selection_g_shape: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null = null

  private _position_u: number
  private _position_v: number

  // OS#1299 — nom multilingue : map { langue -> nom }, comme la documentation
  // markdown (cf. persistenceMigrations). Le getter/setter `name` expose une
  // string résolue/écrite pour la langue ACTIVE de l'app (i18next) : traduire un
  // diagramme = basculer la langue de l'app puis renommer. Une seule langue =
  // comportement historique inchangé (sérialisée en string).
  protected _name_map: Type_LangMap
  // Le contenu du label de nom (source, texte libre, groupe de tags, dimension)
  // est désormais porté par le système d'attributs/styles (_storage) :
  // name_label_source / name_label_text / name_label_tag_group_id /
  // name_label_dimension_id, définis dans NAME_LABEL_CONFIG. Voir
  // Type_NameLabelSource pour la sémantique des valeurs de source. Ils sont ainsi
  // propagés par le pinceau et « appliquer le style aux enfants », et éditables
  // dans le menu de configuration des styles.
  protected _nodeDrawShape: NodeDrawShape
  protected _nodeDrawNameLabel: NodeDrawNameLabel
  protected _nodeDrawIcon: NodeDrawNameLabel

  protected _drag: boolean = false
  protected _drag_start_pos: { [x: string]: [number, number] } = {}
  // Snapshot of (shape_min_width, shape_min_height) for tied frames that may
  // auto-grow during a drag; consumed by handleMouseDragEnd to build a single
  // undo step covering positions AND sizes.
  protected _drag_start_sizes: { [x: string]: [number, number] } = {}
  protected first_drag_move = true
  protected _node_current_dx = 0
  protected _node_current_dy = 0

  // Tied/attached frame capability — shared by Class_NodeElement and Class_ContainerElement.
  // _attached_node: elements this one geometrically encloses (when _tied_to_nodes is true).
  // _attached_container: elements that geometrically enclose this one (inverse link).
  protected _tied_to_nodes: boolean = false
  protected _attached_node: Class_NodeBase[] = []
  protected _attached_container: Class_NodeBase[] = []

  // #1230 — Mode coordonnées absolues : ancrage par le centre. `_center_anchor_{w,h}`
  // mémorise la taille de rendu à laquelle le coin haut-gauche (position_x/y) a été
  // « posé ». Quand la taille change pour une raison automatique (échelle des flux,
  // valeur, bascule de vue/datatag) sans que la position ait été touchée
  // explicitement, `anchorByCenterIfResized()` décale le coin d'une demi-variation
  // pour garder le centre fixe. Transitoire (jamais persisté). undefined = pas
  // encore initialisé (1er draw / chargement) → on ne décale pas, on ne fait que poser.
  protected _center_anchor_w: number | undefined = undefined
  protected _center_anchor_h: number | undefined = undefined

  // #1231 (migration 1.1.5) — CENTRE géométrique du nœud = future vérité persistée
  // (datatag/échelle-indépendant). Pour l'instant maintenu EN PARALLÈLE du coin
  // (position_x/y) sans être encore autoritaire : `captureCenterFromCorner()` le
  // dérive du coin courant, `applyCenterToCorner()` ferait l'inverse au dessin. Le
  // « flip » (rendre le centre autoritaire + câbler tous les gestes pour qu'ils le
  // committent) est l'étape suivante. undefined = pas encore initialisé.
  protected _center_x: number | undefined = undefined
  protected _center_y: number | undefined = undefined

  // #1231 — Mode proportionnel : centre vertical de référence (capturé à l'entrée du
  // mode / après un drag, cf. NodePositioning.captureProportionalReference). À chaque
  // dessin, le centre affiché = médiane + (center_ref − médiane) × f, où f est le
  // facteur de compression/dilatation déduit du flux. Transitoire (jamais persisté).
  // undefined = pas de référence capturée → on ne replace pas.
  public _prop_center_ref: number | undefined = undefined

  protected class_name = 'gg_nodes'
  constructor(
    id: string,
    name: string,
    drawing_area: Class_DrawingArea,
    default_style: Class_ElementStyle,
    parent_svg = 'g_elements_sankey'
  ) {
    // Init parent class attributes
    super(
      id, drawing_area, parent_svg,
      default_style
    )

    this._name_map = { [normalizeLang(i18next.language)]: name }
    this._nodeDrawShape = new NodeDrawShape(this)
    this._nodeDrawNameLabel = new NodeDrawNameLabel(this, 'name_label')
    this._nodeDrawIcon = new NodeDrawNameLabel(this, 'icon')
    this._nodeEventsHandler = new NodeEventsHandler(this)

    this._position_u = 0
    this._position_v = 0
    // Free labels drag handlers
    this._drag_handler = {
      top: new Class_Handler(
        'zdt_top_handle_' + id,
        drawing_area,
        this,
        this.dragHandleStart(),
        this.dragTopHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_top_handle' }),
      bottom: new Class_Handler(
        'zdt_bottom_handle_' + id,
        drawing_area,
        this,
        this.dragHandleStart(),
        this.dragBottomHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_bottom_handle' }),
      left: new Class_Handler(
        'zdt_left_handle_' + id,
        drawing_area,
        this,
        this.dragHandleStart(),
        this.dragLeftHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_left_handle' }),
      right: new Class_Handler(
        'zdt_right_handle_' + id,
        drawing_area,
        this,
        this.dragHandleStart(),
        this.dragRightHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_right_handle' }),
    }

    //drawing_area.list_g_element.unshift(this.id)

    // Tous les helpers (_nodeDrawShape, _nodeDrawNameLabel, _nodeDrawIcon,
    // _nodeEventsHandler) sont maintenant assignés ; les actions de setters
    // peuvent à nouveau s'exécuter. Cf. Class_ProtoElement._suspend_actions.
    // NB : pour ClassTemplate_Legend (extends NodeBase, ctor minimal qui
    //      n'écrit aucun attribut config), ce flip suffit. Pour
    //      Class_NodeElement (extends NodeBase), le ctor de Node assigne
    //      ses propres helpers (_nodeDrawValueLabel, _nodeTooltip, etc.)
    //      AVANT toute écriture d'attribut config, donc OK aussi.
    this._suspend_actions = false
  }

  protected _copyFrom(_: Class_NodeBase): void {
    super._copyFrom(_)
    // Copie de la MAP complète (pas la string résolue) : les traductions non
    // actives doivent survivre à la copie (vues, duplication, undo).
    this._name_map = { ..._._name_map }
    // name_label_source/text/tag_group_id/dimension_id sont des attributs _storage,
    // déjà copiés par copyAttrFrom (appelé dans Element._copyFrom via super).
    this._position_u = _._position_u
    this._position_v = _._position_v

  }

  public drawAsSelected() {
    // Guard: actions déclenchées par des setters d'attributs config peuvent
    // tirer pendant la chaîne `super()` de cette classe, AVANT que
    // _nodeDrawShape/_nodeDrawNameLabel/_nodeDrawIcon ne soient assignés.
    if (!this._nodeDrawShape) return
    this._nodeDrawShape.drawShape()
    // On clear la sub-sélection du label AVANT drawDragHandlers : une sélection
    // au niveau ÉLÉMENT (typiquement clic sur la forme) doit (ré)afficher les
    // poignées de forme, que drawDragHandlers masque tant qu'un label est
    // sous-sélectionné.
    // NB: on NE redessine PAS les labels ici. Sinon un simple clic
    // (re-sélection) détruit et recrée le <text> entre les deux clics d'un
    // double-clic → le dblclick natif ne déclenche pas l'éditeur du label.
    // L'utilisateur doit cliquer sur le <text> du label pour faire
    // (ré)apparaître les poignées de boîte de label.
    this.selected_label_prefix = null
    this.drawDragHandlers()
    // Poignées dans `g_handlers` (Class_Handler) — refresh appelle unDraw si
    // le label n'est plus sub-sélectionné.
    this._nodeDrawNameLabel?.refreshLabelResizeHandles()
    this._nodeDrawIcon?.refreshLabelResizeHandles()
    // this._nodeDrawShape.updateSelectedStroke(this.is_selected)
  }

  protected drawElements() {
    if (!this._nodeDrawShape || !this._nodeDrawNameLabel || !this._nodeDrawIcon) return
    this._nodeDrawShape.drawShape()
    if (this._is_selected) {
      this.drawDragHandlers()
    }
    // Icône/image AVANT les textes : une image de nœud peut remplir toute la
    // boîte (import e!Sankey) — le label doit rester lisible par-dessus.
    this._nodeDrawIcon.drawGenericLabel()
    this._nodeDrawNameLabel.drawGenericLabel()
  }
  public drawIcon() {
    if (!this._nodeDrawIcon) return
    this._nodeDrawIcon.drawGenericLabel()
    // drawGenericLabel append le <g> en fin de nœud : re-trier pour que les
    // labels repassent au-dessus de l'icône/image.
    this._orderD3Elements()
  }
  public drawShape() {
    if (!this._nodeDrawShape) return
    this._nodeDrawShape.drawShape()
    if (this._is_selected) {
      this.drawDragHandlers()
    }
    this._orderD3Elements()
  }

  public drawNameLabel() {
    if (this.drawing_area.bypass_redraws) return
    if (!this._nodeDrawNameLabel) return
    this._nodeDrawNameLabel.drawGenericLabel()
    this._orderD3Elements()
  }

  public drawFO() {
    if (!this._nodeDrawNameLabel) return
    this._nodeDrawNameLabel.drawGenericLabel()
  }

  public useDefaultStyle() {
    this.removeAllStyles()
  }

  public eventMouseOver(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventMouseOver(event)
    this._nodeEventsHandler.handleMouseOver(event)
  }

  //public getShapeColorToUse() { return this.shape_color }

  public setInputLabelVisible(initialValue?: string) { this._nodeDrawNameLabel.setInputLabelVisible(initialValue) }
  public setInputLabelInvisible() { this._nodeDrawNameLabel.setInputLabelInvisible() }

  public shiftVertically(shift: number) { this._position.y += shift }

  protected _draw() {
    super._draw()
    this.drawElements()
    this.applyPosition()
  }

  protected _initDraw() {
    super._initDraw()
    this.d3_selection?.attr('class', this.class_name).datum(this)
    this.d3_selection?.style('display', 'inline')
    this.d3_selection?.attr('font-family', this.name_label_font_family)
    this.d3_selection_g_shape = this.d3_selection?.append('g').attr('class', 'g_node_shape') ?? null
  }

  /**
   * #377 — objet de dessin du LIBELLÉ de cette forme. Exposé pour que le label de valeur puisse
   * connaître la hauteur déjà consommée par le libellé (règle « libellé prioritaire, puis
   * valeur »). Lecture seule : l'instance est créée au constructeur et ne change jamais.
   */
  public get name_label_drawer(): NodeDrawNameLabel {
    return this._nodeDrawNameLabel
  }

  public getShapeWidthToUse() {
    return Math.max(this.shape_min_width, this._envelopeSize().w)
  }

  public getShapeHeightToUse() {
    return Math.max(this.shape_min_height, this._envelopeSize().h)
  }

  /**
   * Seuil d'affichage du label (#seuil px). true = le label peut s'afficher.
   * Base : pas de seuil (les sous-classes nœud/stock connaissent leur valeur et
   * redéfinissent ce getter en s'appuyant sur drawing_area.{node,stock}LabelPassesThreshold).
   */
  public get is_above_label_threshold(): boolean {
    return true
  }

  /**
   * #1230 — Mode coordonnées absolues : garde le CENTRE du nœud fixe quand sa
   * taille de rendu change pour une raison automatique (échelle globale des flux,
   * valeur, bascule de vue/datatag). À appeler une fois par cycle de dessin, avant
   * que le nœud ne soit dessiné (cf. `Class_NodePositioning.anchorAbsoluteNodesByCenter`).
   *
   * Compare la taille courante à l'ancrage mémorisé : si elle a changé, décale le
   * coin haut-gauche (position_x/y) d'une demi-variation pour que le centre ne
   * bouge pas, puis ré-ancre. Idempotent : sans changement de taille, no-op. Au
   * tout premier appel (ancrage undefined) on ne fait que mémoriser — la position
   * chargée/initiale est donc préservée telle quelle.
   */
  public anchorByCenterIfResized() {
    const w = this.getShapeWidthToUse()
    const h = this.getShapeHeightToUse()
    // #1231 (1.1.5) — dérivation HYBRIDE coin <-> centre. Le centre stocké est la vérité.
    // Lazy-init au 1er passage (chargement) = conversion coin->centre des fichiers < 1.1.5.
    if (this._center_x === undefined || this._center_y === undefined) {
      this.captureCenterFromCorner()
      this._center_anchor_w = w
      this._center_anchor_h = h
      return
    }
    const size_changed = (w !== this._center_anchor_w) || (h !== this._center_anchor_h)
    if (size_changed) {
      // Taille changée pour une raison AUTOMATIQUE (datatag / échelle / valeur) : on dérive
      // le coin depuis le centre, qui reste FIXE. C'est ce qui supprime la dérive de position
      // et la dépendance au chemin (navigation datatag, retour échelle->absolu, etc.).
      this.applyCenterToCorner()
    } else {
      // Taille inchangée : si le coin a été déplacé explicitement (drag, flèches, op
      // structurelle), on recommit le centre depuis le coin. Sinon c'est un no-op (le coin
      // vaut déjà centre − taille/2).
      this.captureCenterFromCorner()
    }
    this._center_anchor_w = w
    this._center_anchor_h = h
  }

  /**
   * #1230 — Re-cale l'ancrage du centre sur la taille de rendu courante. À appeler
   * après tout redimensionnement EXPLICITE par l'utilisateur (poignées de resize,
   * qui gardent volontairement le bord opposé fixe et déplacent donc le centre) et
   * au passage en mode absolu, pour que `anchorByCenterIfResized()` ne « re-centre »
   * pas par-dessus l'action voulue au prochain dessin complet.
   */
  public settleCenterAnchor() {
    this._center_anchor_w = this.getShapeWidthToUse()
    this._center_anchor_h = this.getShapeHeightToUse()
    // #1231 (1.1.5) — maintien parallèle du centre : tout « settle » (geste explicite,
    // resize, bascule de mode) commit le coin courant comme nouveau centre de vérité.
    this.captureCenterFromCorner()
  }

  /**
   * #1231 (1.1.5) — Dérive le CENTRE depuis le coin courant (position_x/y) + la taille
   * de rendu courante. C'est aussi la conversion coin→centre des fichiers < 1.1.5
   * (appelée au 1er draw, datatag du save restauré → exact en mode absolu).
   */
  public captureCenterFromCorner() {
    this._center_x = this.position_x + this.getShapeWidthToUse() / 2
    this._center_y = this.position_y + this.getShapeHeightToUse() / 2
  }

  /**
   * #1231 (1.1.5) — Dérive le COIN (position_x/y) depuis le centre stocké + la taille
   * de rendu courante. No-op si le centre n'a pas encore été initialisé. Deviendra le
   * calcul autoritaire au dessin une fois le flip effectué.
   */
  public applyCenterToCorner() {
    if (this._center_x === undefined || this._center_y === undefined) return
    this.position_x = this._center_x - this.getShapeWidthToUse() / 2
    this.position_y = this._center_y - this.getShapeHeightToUse() / 2
  }

  /**
   * #1231 (1.1.5) — Dérivation FORCÉE du coin depuis le centre, en resynchronisant l'ancre
   * de taille. À appeler en SORTIE d'un mode d'affichage (proportionnel / échelle) pour
   * ramener le nœud à sa vraie position absolue (centre stocké) au lieu de figer le coin
   * d'affichage (comprimé / rescalé). No-op si le centre n'est pas encore initialisé.
   */
  public forceDeriveFromCenter() {
    if (this._center_x === undefined || this._center_y === undefined) return
    this.applyCenterToCorner()
    this._center_anchor_w = this.getShapeWidthToUse()
    this._center_anchor_h = this.getShapeHeightToUse()
  }

  /**
   * #1231 (1.1.5) — Translation RIGIDE du centre stocké (et de la référence proportionnelle)
   * du même vecteur qu'un décalage de position_x/y. À appeler quand le coin est translaté en
   * bloc SANS passer par les gestes habituels (typiquement `DrawingArea.recenter()`), sinon le
   * centre persisté (`centerForPersistence`) reste périmé et les nœuds « reviennent » à leur
   * place pré-décalage au rechargement. No-op sur les champs non encore initialisés.
   */
  public translateStoredCenter(dx: number, dy: number) {
    if (this._center_x !== undefined) this._center_x += dx
    if (this._center_y !== undefined) this._center_y += dy
    if (this._prop_center_ref !== undefined) this._prop_center_ref += dy
  }

  /** #1231 (1.1.5) — Centre stocké (lecture), undefined si pas encore initialisé. */
  public get center_x() { return this._center_x }
  public get center_y() { return this._center_y }

  /**
   * #1231 (1.1.5) — Centre à PERSISTER (format 1.1.5 : x/y du JSON = centre). Si le centre
   * n'a pas encore été initialisé (nœud jamais dessiné), on le dérive du coin courant.
   */
  public centerForPersistence(): { x: number, y: number } {
    return {
      x: this._center_x ?? (this.position_x + this.getShapeWidthToUse() / 2),
      y: this._center_y ?? (this.position_y + this.getShapeHeightToUse() / 2),
    }
  }

  /**
   * #1231 (1.1.5) — Chargement d'un fichier ≥ 1.1.5 (x/y = centre) : pose le centre comme
   * vérité. On dérive aussi un coin provisoire cohérent ; le 1er draw recalculera le coin
   * exact depuis le centre (applyCenterToCorner via anchorByCenterIfResized).
   */
  public setStoredCenter(x: number, y: number) {
    this._center_x = x
    this._center_y = y
    this.position_x = x - this.getShapeWidthToUse() / 2
    this.position_y = y - this.getShapeHeightToUse() / 2
  }

  /**
   * #1231 — Mode proportionnel : mémorise le centre vertical courant comme référence.
   * Appelé par `captureProportionalReference` (entrée du mode, après un drag, changement
   * de vue). Le replacement ultérieur scale ce centre autour de la médiane par le facteur f.
   */
  public captureProportionalCenterRef() {
    this.settleCenterAnchor() // neutralise les variations d'épaisseur (#1230) pour les frames suivantes
    this._prop_center_ref = this.position_y + this.getShapeHeightToUse() / 2
  }

  /**
   * #1231 — Mode proportionnel : replace le centre vertical à
   * `median + (center_ref − median) × f` (compression/dilatation autour de la médiane,
   * centre de gravité fixe). No-op si aucune référence n'a été capturée.
   */
  public applyProportionalCompression(median_y: number, factor: number) {
    // #1231 (1.1.5) — la compression part du CENTRE stocké (vérité invariante), pas du
    // coin courant. Fallback _prop_center_ref pour les nœuds jamais passés par la dérivation.
    const ref = this._center_y ?? this._prop_center_ref
    if (ref === undefined) return
    const new_center_y = median_y + (ref - median_y) * factor
    this.position_y = new_center_y - this.getShapeHeightToUse() / 2
  }

  /**
   * Taille (w, h) du bbox des enfants attachés visibles, marges incluses,
   * calculée dynamiquement quand ce nœud est un cadre tied. Sans ça, à la
   * sortie d'un mode englobant le parent resterait figé à la taille bumpée
   * via `shape_min_*` (l'ancien `expandToContainAttachedNodes` écrivait dans
   * shape_min_*, ce qui ne se restaurait pas tout seul). Ici on lit
   * l'enveloppe à la volée — comme `is_visible_for_sizing_of(node)` le fait
   * pour les enfants masqués par container_mode.
   */
  protected _envelopeSize(): { w: number, h: number } {
    if (!this._tied_to_nodes || this._attached_node.length === 0) return { w: 0, h: 0 }
    const bbox = this._computeEnvelopeBBox(this._attached_node)
    if (!bbox) return { w: 0, h: 0 }
    return {
      w: (bbox.max_x - bbox.min_x) + this.shape_margin_left + this.shape_margin_right,
      h: (bbox.max_y - bbox.min_y) + this.shape_margin_top + this.shape_margin_bottom,
    }
  }

  protected _orderD3Elements() {
    this.d3_selection_g_shape?.raise()
    // Icône/image sous les textes (cf. drawElements) : le label de nom doit
    // rester au-dessus d'une image qui remplit la boîte du nœud.
    this._nodeDrawIcon.d3_selection?.raise()
    this._nodeDrawNameLabel.d3_selection?.raise()
  }

  // P1 (refonte événements) — la désambiguïsation simple/double-clic est faite
  // UNE fois par Class_ProtoElement.eventSimpleLMBClick (timer unique). NodeBase
  // ne fait plus que réagir aux clics CONFIRMÉS via ces deux hooks.
  protected override onSingleLMBClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    this._nodeEventsHandler.handleSimpleLMBClick(event)
    // OSP Extension — ouverture d'un hyperlien porté par le nœud/la ZDT.
    if (this.hyperlink) {
      window.open(this.hyperlink)
    }
  }

  // P2 — double-clic CONFIRMÉ : éditer le label sous le curseur (l'ancien handler
  // du <text> DrawLabel est supprimé ; le clic label passe désormais par le
  // discriminateur unique). Le type de label vient de la cible DOM.
  protected override onDoubleLMBClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    if (!this.drawing_area.editable) return
    const labelType = this._nodeEventsHandler.getClickedLabelType(event.target as Element)
    if (labelType === 'value_label') { this.openValueLabelEditor(); return }
    // name_label / icon -> éditer le nom (pour une ZDT, le texte EST le nom).
    // Sur la forme nue ('shape') : rien (comportement historique).
    if (labelType === 'name_label' || labelType === 'icon') this.setInputLabelVisible()
  }

  /** P2 — édition du label de VALEUR ; surchargé par les feuilles qui en ont un. */
  protected openValueLabelEditor() { /* no-op ici (pas de label de valeur) */ }

  // P2 — sous-sélection d'un label : pose selected_label_prefix puis n'affiche
  // que les poignées de la boîte du label (drawDragHandlers masque celles de la
  // forme ; chaque label ne (re)dessine ses poignées que si son prefix matche).
  public drawSelectedLabelHandles(prefix: 'name_label' | 'value_label' | 'icon' | null) {
    this.selected_label_prefix = prefix
    this.drawDragHandlers()
    this._nodeDrawNameLabel?.refreshLabelResizeHandles()
    this._nodeDrawIcon?.refreshLabelResizeHandles()
  }

  protected eventMouseDrag(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    super.eventMouseDrag(event)
    this._nodeEventsHandler.handleMouseDrag(event)
    // Geometric frame: drag pushes attached elements along (skipping
    // those already moved by the selection drag, to avoid double offset).
    if (this._tied_to_nodes && this.drawing_area.isInSelectionMode()) {
      const da = this.drawing_area
      const already_moved = new Set<Class_NodeBase>([
        ...da.selected_nodes_list as unknown as Class_NodeBase[],
        ...da.selected_containers_list as unknown as Class_NodeBase[],
        this
      ])
      this._attached_node.forEach(n => {
        if (!n.is_visible) return
        if (already_moved.has(n)) return
        n.position_x += event.dx
        n.position_y += event.dy
        n.applyPosition()
        already_moved.add(n)
      })
    }
    // #680 — Recadrage CONTINU pendant le glissé, en SUIVANT la direction du drag :
    // - mode largeur/hauteur/tout → dézoom au fur et à mesure que le nœud s'éloigne ;
    // - mode 'aucun' → no-op : la caméra ne bouge pas (revu post-#680) ;
    // - sur l'axe libre, la zone de dessin s'élargit et suit l'élément (bord poussé épinglé).
    // NB : le recadrage change le transform en cours de drag → un léger décalage du pointeur
    // par tick est possible (assumé : comportement voulu « au fur et à mesure »).
    this.drawing_area.accumulateFitDrag(event.dx, event.dy)
    this.drawing_area.applyAutoFitMode(false)
  }
  protected eventMouseDragStart(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    super.eventMouseDragStart(event)
    this.drawing_area.beginFitDrag() // #680 — réinitialise l'accumulateur de direction du glissé
    this._nodeEventsHandler.handleMouseDragStart(event)
  }
  public eventMouseDragEnd(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    super.eventMouseDragEnd(event)
    if (this.drawing_area.isInSelectionMode()) {
      // Auto-grow containing frames whose attached child just moved
      // (push only the impacted side; never shrink). Propagation
      // récursive vers le haut : un conteneur englobant emboîté doit
      // aussi croître quand son enfant (lui-même un conteneur) vient
      // de grandir. Sans ça, dans des modes englobants emboîtés, seule
      // la boîte la plus immédiate suit le drag, pas ses ancêtres.
      const visited = new Set<Class_NodeBase>([this])
      const propagate = (node: Class_NodeBase) => {
        node._attached_container.forEach(cont => {
          if (visited.has(cont)) return
          visited.add(cont)
          if (cont.tied_to_nodes) cont.expandToContainAttachedNodes()
          cont.draw()
          propagate(cont)
        })
      }
      propagate(this)
      this.drawing_area.orderElementOnDA()
    }
    this._nodeEventsHandler.handleMouseDragEnd(event)
    // #680 — Cadrage FINAL du mode (suit encore la direction accumulée du glissé), puis on
    // clôt le drag (efface la direction). Mode 'none' → no-op ; modes largeur/
    // hauteur/tout → cadrage maintenu bord à bord.
    this.drawing_area.applyAutoFitMode(false)
    this.drawing_area.endFitDrag()
  }

  protected eventMaintainedClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventMaintainedClick(event)
    // this._nodeEventsHandler.handleMaintainedClick(event)
  }

  protected eventSimpleRMBClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventSimpleRMBClick(event)
    this._nodeEventsHandler.handleSimpleRMBClick(event)
  }

  public eventMouseMove(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventMouseMove(event)
    this._nodeEventsHandler.handleMouseMove()
  }

  public eventMouseOut(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventMouseOut(event)
    this._nodeEventsHandler.handleMouseOut()
  }

  // Nom résolu pour la langue active de l'app (repli en→fr→première dispo).
  // Avec une seule langue dans la map (cas historique), renvoie toujours cette
  // valeur quelle que soit la langue active. Le `?? {}` protège les accès
  // pendant la chaîne super() du constructeur (map pas encore assignée).
  public get name() { return resolveLangMap(this._name_map ?? {}, i18next.language) }
  public set name(_: string) {
    const lang = normalizeLang(i18next.language)
    if (!this._name_map) this._name_map = {}
    // Vider le nom dans une langue alors que d'autres langues existent =
    // SUPPRIMER cette traduction (le nom retombe sur l'autre langue). Vider le
    // nom quand c'est la seule langue = nom vide (comportement historique).
    const other_langs = Object.keys(this._name_map).filter(l => l !== lang)
    if (_ === '' && other_langs.length > 0) delete this._name_map[lang]
    else this._name_map[lang] = _
    // Sous un thème à palette par nom, renommer périme la table des couleurs.
    // `Class_ContainerElement` hérite de cette classe sans être un nœud : c'est
    // `Sankey` qui filtre.
    this.sankey?.onNodeRenamed(this)
    this.drawNameLabel()
  }
  /** Map complète { langue -> nom } (persistance / copie). */
  public get name_lang_map(): Type_LangMap { return this._name_map }
  public set name_lang_map(_: Type_LangMap) { this._name_map = _ }
  public get name_label() {
    const resolved_name = this.name
    if (this.name_label_separator !== '') {
      const splitted_label = resolved_name.split(this.name_label_separator)
      return (splitted_label.length > 1 && this.name_label_separator_part == 'after') ? splitted_label[splitted_label.length - 1] : splitted_label[0]
    }
    return resolved_name
  }

  // Compat historique : name_label_custom <=> source 'custom'. Conserve le
  // comportement des appelants existants (édition inline/rich text, titre…).
  // name_label_source est un attribut _storage (NAME_LABEL_CONFIG) ; l'affecter
  // déclenche l'action drawNameLabel.
  public get name_label_custom() { return this.name_label_source === 'custom' }
  public set name_label_custom(_: boolean) { this.name_label_source = _ ? 'custom' : 'name' }

  // Texte effectivement affiché par le name_label, selon la source choisie. Sert
  // de source unique au rendu (getLabelText) et à l'init du rich text.
  public get name_label_effective(): string {
    switch (this.name_label_source) {
    case 'custom': return this.name_label_text
    case 'tag': return this.resolveTagLabel()
    case 'ancestor': return this.resolveAncestorLabel()
    case 'template': return this.resolveTemplateLabel()
    default: return this.name_label
    }
  }

  // Texte BRUT à éditer : identique au libellé effectif pour un élément normal,
  // mais surchargé par le titre (Class_ContainerElement) pour préserver les
  // jetons {Tag} au lieu de leur valeur interpolée. Sert aux chemins d'édition
  // (input inline, init rich text) : on édite « {Month} », pas « January ».
  public get name_label_effective_editable(): string {
    // OS#1314 — un gabarit s'édite tel qu'il est écrit, jetons compris.
    if (this.name_label_source === 'template') return this.name_label_template
    return this.name_label_effective
  }

  // Sources 'tag' et 'ancestor' : surchargées par Class_NodeElement (qui porte
  // les tags et les dimensions). Par défaut (zone de texte / base) → nom de
  // l'élément, car un container n'a ni tags assignés ni dimensions.
  protected resolveTagLabel(): string {
    return this.name_label
  }

  // OS#1314 — source 'template' : gabarit à jetons interpolé au dessin. La base
  // ne connaît que les jetons universels ({Name} + valeur sélectionnée des
  // groupes de data/view tags, comme le titre) ; Class_NodeElement enrichit avec
  // les valeurs, le bilan et les tags assignés.
  protected resolveTemplateLabel(): string {
    return applyTemplate(this.name_label_template, token => this.resolveTemplateToken(token))
  }

  /**
   * Résolution d'UN jeton. Renvoie null pour un jeton inconnu (laissé tel quel
   * dans le texte). Surchargé par les sous-classes, qui délèguent ici pour les
   * jetons universels.
   */
  protected resolveTemplateToken(token: string): string | null {
    if (token === 'Name') return this.name_label
    return resolveTagGroupToken(
      token,
      this.sankey.data_taggs_list,
      this.sankey.view_taggs_list
    )
  }

  protected resolveAncestorLabel(): string {
    return this.name_label
  }

  public get attached_container(): Class_NodeBase[] { return this._attached_container }
  public get attached_node(): Class_NodeBase[] { return this._attached_node }
  public get tied_to_nodes(): boolean { return this._tied_to_nodes }
  public set tied_to_nodes(b: boolean) { this._tied_to_nodes = b }

  // Bidirectional link: this._attached_node[i].attached_container contains this.
  public attachNodeToCont(node: Class_NodeBase) {
    if (!this._attached_node.includes(node)) {
      this._attached_node.push(node)
    }
    if (!node._attached_container.includes(this)) {
      node._attached_container.push(this)
    }
  }

  // Inverse direction: I (container) attach myself onto `node`.
  public attachContToNode(node: Class_NodeBase) {
    this.attachNodeToCont(node)
  }

  public dettachNodeFromCont(node: Class_NodeBase) {
    const idx_n = this._attached_node.indexOf(node)
    if (idx_n >= 0) this._attached_node.splice(idx_n, 1)
    const idx_c = node._attached_container.indexOf(this)
    if (idx_c >= 0) node._attached_container.splice(idx_c, 1)
    // OS#1254 — désolidariser une zone d'un cadre de la légende (racine ou
    // bloc de groupe) casse la mise en forme générée (markBroken est inerte
    // pendant la régénération elle-même).
    if (isLegendElementId(this.id)) this.drawing_area.legend.markBroken()
  }

  public dettachContFromNode(node: Class_NodeBase) {
    this.dettachNodeFromCont(node)
  }

  // Fit-to-attached: explicit action only. Snaps every side onto the
  // attached bbox (may shrink the frame).
  public computeSizeAndPositionFromAttachedNodes() {
    const bbox = this._computeEnvelopeBBox(this._attached_node)
    if (!bbox) return
    this._applyEnvelopeBBox(bbox)
  }

  // Auto-grow only: extends sides outward when an attached node overflows;
  // never shrinks. Used during drag so the frame follows children outward.
  // Ne touche QUE la position (re-ancrage du parent au top-left de
  // l'enveloppe). La taille (w, h) est désormais calculée dynamiquement
  // par getShape{Height,Width}ToUse() via `_envelopeSize()` — on n'écrit
  // plus shape_min_*, sinon la valeur reste figée et empêche le parent de
  // retrouver sa taille « fit aux flux » à la sortie du mode englobant.
  public expandToContainAttachedNodes() {
    const bbox = this._computeEnvelopeBBox(this._attached_node)
    if (!bbox) return
    const cur_left = this.position_x + this.shape_margin_left
    const cur_top = this.position_y + this.shape_margin_top
    const new_left = Math.min(cur_left, bbox.min_x)
    const new_top = Math.min(cur_top, bbox.min_y)
    if (new_left === cur_left && new_top === cur_top) return
    this.position_x = new_left - this.shape_margin_left
    this.position_y = new_top - this.shape_margin_top
  }

  /**
   * OS#1259 — Fait GRANDIR le cadre (grow-only, TOUS les côtés) pour contenir ses
   * membres. `expandToContainAttachedNodes` ne bougeait le coin que vers le
   * haut/gauche, et la taille via `_envelopeSize` = ÉTALEMENT des membres (donc
   * constante pour un membre unique qui s'éloigne) : rien n'étendait le cadre
   * vers la droite/bas. Ici on prend l'UNION de la boîte de contenu courante et
   * de la bbox des membres, et on écrit position + `shape_min_*` (donc ça
   * persiste au save). `settleCenterAnchor()` recale l'ancre centre/coin (#1231)
   * pour que le prochain dessin ne re-centre pas par-dessus. Grow-only : ne
   * rétrécit jamais (un membre ramené à l'intérieur ne réduit pas le cadre).
   */
  public growFrameToContainMembers() {
    if (!this._tied_to_nodes || this._attached_node.length === 0) return
    const bbox = this._computeEnvelopeBBox(this._attached_node)
    if (!bbox) return
    const ml = this.shape_margin_left, mt = this.shape_margin_top
    const mr = this.shape_margin_right, mb = this.shape_margin_bottom
    // Boîte de CONTENU courante (aire intérieure, hors marges).
    const cur_left = this.position_x + ml
    const cur_top = this.position_y + mt
    const cur_right = this.position_x + this.getShapeWidthToUse() - mr
    const cur_bottom = this.position_y + this.getShapeHeightToUse() - mb
    // Union grow-only avec la bbox des membres.
    const new_left = Math.min(cur_left, bbox.min_x)
    const new_top = Math.min(cur_top, bbox.min_y)
    const new_right = Math.max(cur_right, bbox.max_x)
    const new_bottom = Math.max(cur_bottom, bbox.max_y)
    if (new_left === cur_left && new_top === cur_top
      && new_right === cur_right && new_bottom === cur_bottom) return
    this.position_x = new_left - ml
    this.position_y = new_top - mt
    this.shape_min_width = (new_right - new_left) + ml + mr
    this.shape_min_height = (new_bottom - new_top) + mt + mb
    this.settleCenterAnchor()
  }

  /**
   * OS#1259 (clamp) — Pendant qu'on REDIMENSIONNE le cadre, contraint chaque
   * membre à rester dans sa boîte de CONTENU : si un membre dépasse (cadre
   * rétréci sous sa taille), on rétrécit sa taille pour qu'il tienne, puis on
   * repousse sa position dans les bornes. Inverse de growFrameToContainMembers.
   * Ne touche pas un membre qui tient déjà (« dès que ça dépasse »). Un membre
   * qui est lui-même un cadre tied ne descend pas sous l'enveloppe de SES
   * membres (getShapeWidthToUse = max(shape_min, enveloppe)).
   */
  public clampMembersToFrame() {
    if (!this._tied_to_nodes || this._attached_node.length === 0) return
    const inner_left = this.position_x + this.shape_margin_left
    const inner_top = this.position_y + this.shape_margin_top
    const inner_right = this.position_x + this.getShapeWidthToUse() - this.shape_margin_right
    const inner_bottom = this.position_y + this.getShapeHeightToUse() - this.shape_margin_bottom
    const inner_w = Math.max(1, inner_right - inner_left)
    const inner_h = Math.max(1, inner_bottom - inner_top)
    this._attached_node.forEach(m => {
      if (!m.is_visible) return
      let changed = false
      // Rétrécir la taille si le membre est plus grand que l'aire intérieure.
      if (m.getShapeWidthToUse() > inner_w) { m.shape_min_width = inner_w; changed = true }
      if (m.getShapeHeightToUse() > inner_h) { m.shape_min_height = inner_h; changed = true }
      const mw = m.getShapeWidthToUse()
      const mh = m.getShapeHeightToUse()
      // Repousser (minimal) pour que le membre reste dans les bornes.
      let mx = m.position_x, my = m.position_y
      if (mx + mw > inner_right) mx = inner_right - mw
      if (my + mh > inner_bottom) my = inner_bottom - mh
      if (mx < inner_left) mx = inner_left
      if (my < inner_top) my = inner_top
      if (mx !== m.position_x || my !== m.position_y) { m.position_x = mx; m.position_y = my; changed = true }
      if (changed) { m.settleCenterAnchor(); m.draw() }
    })
  }

  /**
   * #363 — Recale le bord GAUCHE du cadre sur l'enveloppe LABELS INCLUS de ses
   * membres. La TAILLE du cadre est déjà label-incluse
   * (`_envelopeSize` lit le `getBBox()` du SVG), mais son coin ne l'était qu'en
   * fin de drag (`expandToContainAttachedNodes`) : un fichier dont les libellés
   * de nœuds débordent à gauche (`name_label_horiz: 'left'` +
   * `name_label_inside_horiz: false`) s'ouvrait donc avec un cadre de la bonne
   * largeur mais TRANSLATÉ vers la droite du débord — il entourait les formes,
   * pas les libellés — jusqu'au premier clic sur un membre.
   *
   * HORIZONTAL seulement, à dessein : le bord haut d'un cadre appartient au mode
   * de positionnement actif, qui le réécrit à chaque dessin (empilement de
   * colonne par `anchorParametricNodesToAbsolute`, ancre de centre par
   * `anchorByCenterIfResized`). Le corriger ici le ferait osciller d'un dessin au
   * suivant, et comme le ré-empilement des enfants (`restackContainerChildren`,
   * Phase C de `recomputeParametricLayout`) s'ancre sur le haut du cadre, chaque
   * passe ferait remonter la pile d'un débord de libellé — dérive sans fin. Rien,
   * en revanche, ne réécrit le x d'un cadre : la correction y est stable.
   *
   * À appeler APRÈS le dessin : le débord des libellés n'entre dans le
   * `getBBox()` qu'une fois ceux-ci rendus.
   *
   * @returns true si le coin a bougé — au caller de redessiner le cadre.
   */
  public refitTiedFrameToLabels(): boolean {
    if (!this._tied_to_nodes || this._attached_node.length === 0) return false
    const bbox = this._computeEnvelopeBBox(this._attached_node)
    if (!bbox) return false
    // Décision isolée en fonction pure (testable sans d3/DOM) : cf. tiedFrameRefit.
    const new_left = tiedFrameRefitLeft({
      current_left: this.position_x + this.shape_margin_left,
      envelope_min_x: bbox.min_x,
      envelope_max_x: bbox.max_x,
      margin_left: this.shape_margin_left,
      margin_right: this.shape_margin_right,
      shape_min_width: this.shape_min_width,
    })
    if (new_left === null) return false
    this.position_x = new_left - this.shape_margin_left
    return true
  }

  // Full re-fit of the top-left onto the attached-node envelope (grows AND
  // shrinks, unlike expandToContainAttachedNodes which only grows). The size
  // stays dynamic (_envelopeSize) — we only move the corner. Called after an
  // operation that moves the nodes without going through a drag (view switch /
  // layout apply via updateFrom), where the frame would otherwise keep its old
  // position and sit offset from its nodes until the user nudges it manually.
  public reanchorTiedFrame() {
    if (!this._tied_to_nodes || this._attached_node.length === 0) return
    const bbox = this._computeEnvelopeBBox(this._attached_node)
    if (!bbox) return
    this.position_x = bbox.min_x - this.shape_margin_left
    this.position_y = bbox.min_y - this.shape_margin_top
  }

  /**
   * os#671 / os#1347 — hook de CONTRAINTE fourni par le modèle au geste de drag
   * (smart guides) : sur quels axes la position déposée fait-elle autorité —
   * donc mérite un alignement magnétique ? Base (conteneurs, zones, légende…) :
   * position libre sur les deux axes. `Class_NodeElement` raffine selon la mise
   * en page pilotée par les données (cf. Node.getFreeDragSnapAxes).
   */
  public getFreeDragSnapAxes(): { x: boolean, y: boolean } {
    return { x: true, y: true }
  }

  public setDragStartPositions(positions: { [x: string]: [number, number] }) { this._drag_start_pos = positions }
  public getDragStartPositions(): { [x: string]: [number, number] } { return this._drag_start_pos }
  public setDragStartSizes(sizes: { [x: string]: [number, number] }) { this._drag_start_sizes = sizes }
  public getDragStartSizes(): { [x: string]: [number, number] } { return this._drag_start_sizes }
  public setDragState(drag: boolean) { this._drag = drag }
  public getDragState(): boolean { return this._drag }
  public setFirstDragMove(value: boolean) { this.first_drag_move = value }
  public getFirstDragMove(): boolean { return this.first_drag_move }
  public updateNodeCurrentDelta(dx: number, dy: number) { this._node_current_dx += dx; this._node_current_dy += dy }
  public resetNodeCurrentDelta() { this._node_current_dx = 0; this._node_current_dy = 0 }
  public getNodeCurrentDeltas(): { dx: number, dy: number } {
    return { dx: this._node_current_dx, dy: this._node_current_dy }
  }

  /**
   * Activate the control points alignement guide
   *
   * @private
   * @return {*}
   * @memberof Class_ContainerElement
   */
  protected dragHandleStart() {
    return () => {
      const old_val = {
        x: this.position_x,
        y: this.position_y,
        w: this.getShapeWidthToUse(),
        h: this.getShapeHeightToUse(),
        // OS#1276b — offsets d'extrémité de ligne : sans eux, l'undo d'un drag de
        // poignée d'extrémité ne restaurerait que la boîte, pas la géométrie du
        // segment. No-op pour un resize de boîte (les offsets n'y changent pas).
        x1: this.shape_line_x1,
        y1: this.shape_line_y1,
        x2: this.shape_line_x2,
        y2: this.shape_line_y2,
      }
      this.drawing_area.application_data.history.saveUndo(() => {
        this.shape_min_width = old_val.w
        this.shape_min_height = old_val.h
        this.shape_line_x1 = old_val.x1
        this.shape_line_y1 = old_val.y1
        this.shape_line_x2 = old_val.x2
        this.shape_line_y2 = old_val.y2
        this._position.x = old_val.x
        this._position.y = old_val.y
        this.settleCenterAnchor() // #1230 restauration taille+position : ré-ancre le centre
        this.draw()
      })
    }
  }

  /**
    * Deactivate the control points alignement guide
    * @private
    * @return {*}
    * @memberof Class_ContainerElement
    */
  protected dragHandleEnd() {
    return () => {
      this.drawing_area.application_data.menu_configuration.updateComponentRelatedToApparence

      const old_val = {
        x: this.position_x,
        y: this.position_y,
        w: this.getShapeWidthToUse(),
        h: this.getShapeHeightToUse(),
        // OS#1276b — cf. dragHandleStart : le redo doit aussi rétablir le segment.
        x1: this.shape_line_x1,
        y1: this.shape_line_y1,
        x2: this.shape_line_x2,
        y2: this.shape_line_y2,
      }
      this.drawing_area.application_data.history.saveRedo(() => {
        this.shape_min_width = old_val.w
        this.shape_min_height = old_val.h
        this.shape_line_x1 = old_val.x1
        this.shape_line_y1 = old_val.y1
        this.shape_line_x2 = old_val.x2
        this.shape_line_y2 = old_val.y2
        this._position.x = old_val.x
        this._position.y = old_val.y
        this.settleCenterAnchor() // #1230 restauration taille+position : ré-ancre le centre
        this.draw()
      })
    }
  }

  /**
   * Event when we drag the top handle
   *
   * @private
   * @return {*}
   * @memberof Class_ContainerElement
   */
  protected dragTopHandler() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      // Early return if tied to nodes
      // if (this.tied_to_nodes && this.at_extremity_of_attached_nodes && ['left', 'right'].includes(this.extremity_position))
      //   return

      this.shape_min_height -= event.dy
      this.position_y = this.position_y + event.dy
      this.settleCenterAnchor() // #1230 resize manuel : bord opposé fixe, on ré-ancre
      // OS#1259 (clamp) — redimensionner le cadre contraint ses membres à rester dedans.
      this.clampMembersToFrame()
      this.draw()

      // Reposition drag handler with updated with & pos of the free label
      this.drawDragHandlers()
    }
  }

  /**
   * Event when we drag the bottom handle
   *
   * @private
   * @return {*}
   * @memberof Class_ContainerElement
   */
  protected dragBottomHandler() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      // Early return if tied to nodes
      // if (this.tied_to_nodes && this.at_extremity_of_attached_nodes && ['left', 'right'].includes(this.extremity_position))
      //   return

      this.shape_min_height += event.dy
      this.settleCenterAnchor() // #1230 resize manuel : bord opposé fixe, on ré-ancre
      // OS#1259 (clamp) — redimensionner le cadre contraint ses membres à rester dedans.
      this.clampMembersToFrame()
      this.draw()

      // Reposition drag handler with updated with & pos of the free label
      this.drawDragHandlers()
    }
  }

  /**
   * Event when we drag the left handle
   *
   * @private
   * @return {*}
   * @memberof Class_ContainerElement
   */
  protected dragLeftHandler() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      // Early return if tied to nodes
      // if (this.tied_to_nodes && this.at_extremity_of_attached_nodes && ['top', 'bottom'].includes(this.extremity_position))
      //   return

      this.shape_min_width -= event.dx
      this.setPosXY(this.position_x + event.dx, this.position_y)
      this.settleCenterAnchor() // #1230 resize manuel : bord opposé fixe, on ré-ancre
      // OS#1259 (clamp) — redimensionner le cadre contraint ses membres à rester dedans.
      this.clampMembersToFrame()
      this.draw()

      // Reposition drag handler with updated with & pos of the free label
      this.drawDragHandlers()
    }
  }

  /**
   * Event when we drag the right handle
   *
   * @private
   * @return {*}
   * @memberof Class_ContainerElement
   */
  protected dragRightHandler() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      // Early return if tied to nodes
      // if (this.tied_to_nodes && this.at_extremity_of_attached_nodes && ['top', 'bottom'].includes(this.extremity_position))
      //   return

      this.shape_min_width += event.dx
      this.settleCenterAnchor() // #1230 resize manuel : bord opposé fixe, on ré-ancre
      // OS#1259 (clamp) — redimensionner le cadre contraint ses membres à rester dedans.
      this.clampMembersToFrame()
      this.draw()

      // Reposition drag handler with updated with & pos of the free label
      this.drawDragHandlers()
    }
  }

  // Handles must sit on the visible shape edges, which include the
  // shape_margin_* offsets (the rendered shape is translated by
  // (-margin_left, -margin_top) and sized W+ml+mr × H+mt+mb).
  private computeTopHandlerPos() {
    const ml = this.shape_margin_left
    const mr = this.shape_margin_right
    const mt = this.shape_margin_top
    this._drag_handler.top.position_x = this.position_x + (this.getShapeWidthToUse() + mr - ml) / 2
    this._drag_handler.top.position_y = this.position_y - mt
  }

  private computeBottomHandlerPos() {
    const ml = this.shape_margin_left
    const mr = this.shape_margin_right
    const mb = this.shape_margin_bottom
    this._drag_handler.bottom.position_x = this.position_x + (this.getShapeWidthToUse() + mr - ml) / 2
    this._drag_handler.bottom.position_y = this.position_y + this.getShapeHeightToUse() + mb
  }

  private computeLeftHandlerPos() {
    const ml = this.shape_margin_left
    const mt = this.shape_margin_top
    const mb = this.shape_margin_bottom
    this._drag_handler.left.position_x = this.position_x - ml
    this._drag_handler.left.position_y = this.position_y + (this.getShapeHeightToUse() + mb - mt) / 2
  }

  private computeRightHandlerPos() {
    // right handle pos
    const mr = this.shape_margin_right
    const mt = this.shape_margin_top
    const mb = this.shape_margin_bottom
    this._drag_handler.right.position_x = this.position_x + this.getShapeWidthToUse() + mr
    this._drag_handler.right.position_y = this.position_y + (this.getShapeHeightToUse() + mb - mt) / 2
  }

  /**
   * OS#1276b — garantit que les 4 offsets d'extrémité (shape_line_x1…y2) décrivent
   * un vrai segment. Idempotent : si le segment est déjà non dégénéré (A ≠ B) on ne
   * touche à rien. S'il est dégénéré (cas d'un ancien fichier « diagonale de boîte »
   * où les offsets valent 0, ou d'une création qui n'a posé que shape_line_flip), on
   * les dérive de la boîte (w = shape_min_width, h = shape_min_height) et du sens
   * historique shape_line_flip :
   *   flip=false → A=(0,0), B=(w,h)   « \ »
   *   flip=true  → A=(0,h), B=(w,0)   « / »
   * La boîte et position_x/y restent inchangées (les offsets sont déjà normalisés
   * min=0). Appelé au chargement (ContainerPersistence.fromJSON) et à la création.
   */
  public ensureLineEndpoints() {
    if (this.shape_type !== 'line') return
    const x1 = this.shape_line_x1, y1 = this.shape_line_y1
    const x2 = this.shape_line_x2, y2 = this.shape_line_y2
    // Segment déjà défini (extrémités distinctes) : rien à faire.
    if (x1 !== x2 || y1 !== y2) return
    const w = this.shape_min_width
    const h = this.shape_min_height
    if (this.shape_line_flip) {
      this.shape_line_x1 = 0; this.shape_line_y1 = h
      this.shape_line_x2 = w; this.shape_line_y2 = 0
    } else {
      this.shape_line_x1 = 0; this.shape_line_y1 = 0
      this.shape_line_x2 = w; this.shape_line_y2 = h
    }
  }

  /**
   * OS#1276b — drag d'une extrémité de ligne libre. Recalcule la position monde de
   * l'extrémité déplacée (offset local + event.dx/dy), puis RENORMALISE tout le
   * segment pour que min(x1,x2)=0 et min(y1,y2)=0 : le décalage est absorbé par
   * position_x/y (le coin haut-gauche suit le min), les 4 offsets et la boîte dérivée
   * (shape_min_width/height) sont réécrits. Ainsi tous les invariants « position =
   * coin haut-gauche, boîte = max des offsets » restent vrais (resize, hit, ordre-Z).
   */
  protected dragEndpointHandler(which: 'a' | 'b') {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      let x1 = this.shape_line_x1, y1 = this.shape_line_y1
      let x2 = this.shape_line_x2, y2 = this.shape_line_y2
      if (which === 'a') { x1 += event.dx; y1 += event.dy }
      else { x2 += event.dx; y2 += event.dy }
      // Renormalisation : le coin haut-gauche encaisse le min, les offsets repartent de 0.
      const min_x = Math.min(x1, x2)
      const min_y = Math.min(y1, y2)
      this.setPosXY(this.position_x + min_x, this.position_y + min_y)
      x1 -= min_x; x2 -= min_x
      y1 -= min_y; y2 -= min_y
      this.shape_line_x1 = x1; this.shape_line_y1 = y1
      this.shape_line_x2 = x2; this.shape_line_y2 = y2
      this.shape_min_width = Math.max(x1, x2)
      this.shape_min_height = Math.max(y1, y2)
      this.settleCenterAnchor() // #1230 : la géométrie a changé, ré-ancre le centre
      this.draw()
      this.drawDragHandlers()
    }
  }

  private _ensureLineEndpointHandlers(): { a: Class_Handler, b: Class_Handler } {
    if (this._line_endpoint_handler) return this._line_endpoint_handler
    this._line_endpoint_handler = {
      a: new Class_Handler(
        'line_a_handle_' + this.id,
        this.drawing_area,
        this,
        this.dragHandleStart(),
        this.dragEndpointHandler('a'),
        this.dragHandleEnd(),
        { class: 'line_endpoint_handle' }),
      b: new Class_Handler(
        'line_b_handle_' + this.id,
        this.drawing_area,
        this,
        this.dragHandleStart(),
        this.dragEndpointHandler('b'),
        this.dragHandleEnd(),
        { class: 'line_endpoint_handle' }),
    }
    return this._line_endpoint_handler
  }

  /**
   * Draw all control points
   *
   * @private
   * @memberof Class_ContainerElement
   */
  public drawDragHandlers() {
    // Sous-sélection d'un label (clic sur son <text>) : on ne montre QUE les
    // poignées de la boîte du label, pas celles de la forme. On masque donc tout
    // jeu de poignées de forme tant qu'un label est sous-sélectionné.
    if (this.selected_label_prefix != null) {
      this._drag_handler.top.unDraw()
      this._drag_handler.bottom.unDraw()
      this._drag_handler.left.unDraw()
      this._drag_handler.right.unDraw()
      this._line_endpoint_handler?.a.unDraw()
      this._line_endpoint_handler?.b.unDraw()
      return
    }
    // OS#1276b — ligne libre : deux poignées aux extrémités absolues (position + offset
    // local), en lieu et place des 4 poignées de boîte. Chaque poignée renormalise le
    // segment (cf. dragEndpointHandler). Le drag du CORPS de la ligne reste le drag
    // normal du conteneur (eventMouseDrag), rien de spécial ici.
    if (this.shape_type === 'line') {
      // Masque les 4 poignées de boîte si elles avaient été dessinées.
      this._drag_handler.top.unDraw()
      this._drag_handler.bottom.unDraw()
      this._drag_handler.left.unDraw()
      this._drag_handler.right.unDraw()
      const h = this._ensureLineEndpointHandlers()
      h.a.position_x = this.position_x + this.shape_line_x1
      h.a.position_y = this.position_y + this.shape_line_y1
      h.b.position_x = this.position_x + this.shape_line_x2
      h.b.position_y = this.position_y + this.shape_line_y2
      h.a.draw()
      h.b.draw()
      return
    }
    // Compute positions
    this.computeTopHandlerPos()
    this.computeBottomHandlerPos()
    this.computeLeftHandlerPos()
    this.computeRightHandlerPos()
    // Draw
    this._drag_handler.top.draw()
    this._drag_handler.bottom.draw()
    this._drag_handler.left.draw()
    this._drag_handler.right.draw()
  }

  public applyPosition() {
    this.d3_selection?.attr(
      'transform',
      'translate(' + this.position_x + ', ' + this.position_y + ')')
  }

  /**
   * Compute the enclosing bounding box of a list of nodes. Prefers the
   * SVG getBBox so the label overhang is naturally included in the
   * envelope, and falls back to the logical geometry (position + shape
   * size) when the node has not been rendered yet or the SVG bbox is
   * empty. The SVG bbox is local to the node's g element, so it stays
   * valid even if the g's transform has not yet been flushed — we
   * combine it with the fresh node.position_x/y rather than the SVG's
   * absolute coordinates.
   * Returns null if no node is visible.
   * Shared utility used by containers (TextZone) and aggregation container mode.
   */
  protected _computeEnvelopeBBox(
    nodes: Class_NodeBase[]
  ): { min_x: number, min_y: number, max_x: number, max_y: number } | null {
    const members: Type_EnvelopeMember[] = []
    nodes.forEach(node => {
      if (!node.is_visible) return
      // Pour un nœud lui-même cadre tied (container avec enfants attachés),
      // la taille logique est la vérité : `getShape{Width,Height}ToUse()`
      // intègre dynamiquement l'enveloppe (cf. `_envelopeSize()`). Le
      // `getBBox()` du SVG, lui, peut être en retard d'un tick après un
      // re-stack en cascade et renvoyer l'ancienne taille — d'où des
      // ancêtres englobants mal dimensionnés sans ce contournement.
      const prefer_logical = node._tied_to_nodes && node._attached_node.length > 0
      const svg_bbox = prefer_logical ? null : node.d3_selection?.node()?.getBBox()
      members.push({
        position_x: node.position_x,
        position_y: node.position_y,
        logical_w: node.getShapeWidthToUse(),
        logical_h: node.getShapeHeightToUse(),
        svg_bbox: svg_bbox ?? null,
      })
    })
    // Décision isolée en fonction pure (testable sans d3/DOM) : X labels inclus
    // (#363), Y sur les seules boîtes des membres (#392). Cf. envelopeBBox.
    return envelopeBBoxOfMembers(members)
  }

  /**
   * Apply the given envelope bbox as this node's position and min size,
   * padded by the shape_margin_* attributes.
   */
  protected _applyEnvelopeBBox(
    bbox: { min_x: number, min_y: number, max_x: number, max_y: number }
  ) {
    this.position_x = bbox.min_x - this.shape_margin_left
    this.position_y = bbox.min_y - this.shape_margin_top
    this.shape_min_width = bbox.max_x - bbox.min_x + this.shape_margin_left + this.shape_margin_right
    this.shape_min_height = bbox.max_y - bbox.min_y + this.shape_margin_top + this.shape_margin_bottom
  }

  public get position_u() { return this._position_u }
  public set position_u(_: number) { this._position_u = _ }
  public get position_v() { return this._position_v }
  public set position_v(_: number) { this._position_v = _ }

  public get selected_elements_list(): Class_NodeBase[] {
    return []
  }
  public set_contextualized_element(_element: Class_NodeBase) {

  }
}