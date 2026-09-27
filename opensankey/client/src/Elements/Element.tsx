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
import { MouseEvent } from 'react'

import { Type_LangMap, normalizeLang, resolveLangMap } from '../Persistence/persistenceMigrations'
// Depuis `elementBasics` (module FEUILLE) et NON depuis `types/Utils` : `Utils` importe `Node` à
// l'exécution, et `Node` mène à `NodeBase` → `DrawLabel` → `Handler`, qui fait
// `class Class_Handler extends Class_BaseElement` au niveau module. Passer par `Utils` recréerait
// donc le cycle Element → … → Handler → Element et le TDZ sur `Class_BaseElement`.
// Invariant à préserver : aucun chemin runtime d'`Element.tsx` vers `Handler.tsx`.
import {
  const_default_position_x,
  const_default_position_y,
  randomId,
  default_style_id
} from '../types/elementBasics'
import type { Type_BaseElementPosition } from '../types/elementBasics'
// `import type` obligatoire : `DrawingArea` mène à `Node` → `Handler`, qui étend `Class_BaseElement`
// au niveau module (cf. invariant en tête d'`elementBasics.ts`).
import type { Class_DrawingArea } from '../types/DrawingArea'
import {
  AttributeConfig,
  IconLabelAttributeTypes,
  LinkLabelSpecificValues, ALL_ATTRIBUTES_CONFIG, LinkShapeSpecificValues,
  NameLabelAttributeTypes, NodeShapeSpecificAttributeTypes, ShapeAttributeTypes, StockLabelAttributeTypes,
  Type_OrientationSetting, ValueLabelAttributeTypes,
  ConfigType,
  Type_NameLabelSource
} from './ElementsAttributesConfig'
// SA#541 — module FEUILLE (aucun import) : il ne rouvre pas le cycle décrit plus haut.
import { buildColorLockIndex, tagStyleLayers, topLayerDefining, untaggedDefaultsStyle, Type_StylePropertyReader } from './tagStyles'
import type { Type_TagStyleLayer, Type_TagStyleOwner } from './tagStyles'
// SA#551 — module FEUILLE lui aussi
import { previewedTagGroups } from './tagGroupPriority'
// os#1445 — module FEUILLE lui aussi (aucun import, cf. son en-tête) : le nommage remonte ici
// SANS rouvrir le cycle Element → … → Handler, puisque le gabarit à jetons ne connaît pas le
// modèle — ses résolveurs lui sont injectés sous forme de fonction.
import { applyTemplate, resolveTagGroupToken } from './LabelTemplate'

// SA#541 — index « couleur → cadenas », calculé au PREMIER usage : `ElementsAttributesConfig` et
// `Element` se chargent en cycle, la config peut ne pas exister encore à l'évaluation du module.
let tag_style_color_locks: { [attribute: string]: string } | undefined = undefined
function colorLockOf(attribute: string): string | undefined {
  if (tag_style_color_locks === undefined) tag_style_color_locks = buildColorLockIndex(Object.keys(ALL_ATTRIBUTES_CONFIG))
  return tag_style_color_locks[attribute]
}

/** SA#541 — porteur d'un style d'étiquette tel qu'un élément le voit (étiquette ou groupe). */
export type Type_ElementTagStyleOwner = Type_TagStyleOwner & { name: string }
/** SA#541 — couche de style imposée à un élément par une étiquette ou un groupe (cf. tagStyles.ts). */
export type Type_ElementTagStyleLayer = Type_TagStyleLayer<Class_ElementStyle, Type_ElementTagStyleOwner>
const NO_TAG_STYLE_LAYERS: readonly Type_ElementTagStyleLayer[] = []

// OS#1299 — attributs portant du TEXTE AFFICHÉ traduisible (même modèle que le
// nom des nœuds/zones de texte) : stockés en interne comme string (historique)
// OU map { langue -> texte }. Le getter dynamique des ÉLÉMENTS résout la langue
// active de l'app ; le setter écrit sous la langue active en préservant les
// autres langues. La persistance `local` sérialise string si monolingue
// (rétro-compatible), map sinon (cf. ProtoElementPersistence).
// NB : les STYLES gardent des strings brutes (leurs menus lisent/écrivent direct).
export const TRANSLATABLE_TEXT_ATTRIBUTES: ReadonlySet<string> = new Set([
  'name_label_text',
  'name_label_fo_content',
])

export abstract class Class_BaseElement {
  public d3_selection: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null = null
  private _drawing_area: Class_DrawingArea
  protected _is_visible: boolean = false
  protected _visibility_fingerprint: string

  private _is_currently_deleted = false

  protected _position: Type_BaseElementPosition
  protected _is_selected: boolean = false
  protected _svg_parent_group: string
  protected _id: string
  protected _is_mouse_over: boolean = false
  protected _is_mouse_grabbed: boolean = false

  constructor(
    id: string,
    drawing_area: Class_DrawingArea,
    is_visible: boolean,
    svg_parent_group: string,
  ) {
    this._id = id
    this._is_visible = is_visible
    this._svg_parent_group = svg_parent_group

    this._drawing_area = drawing_area
    this._position = {
      x: const_default_position_x,
      y: const_default_position_y
    }
    this._visibility_fingerprint = randomId()
  }

  protected _process_or_bypass(
    process_func: () => void
  ) {
    if (this._drawing_area.bypass_redraws)
      return
    process_func()
  }

  public setEventsListeners() {
    // os#1340 — feedback visuel du verrouillage (curseur par défaut via CSS).
    this.d3_selection?.classed('locked_element', this.is_locked)
    this.d3_selection?.on(
      'contextmenu',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        this.eventSimpleRMBClick(event))
    // Right mouse button clicks
    this.d3_selection?.on(
      'click',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) => {
        // Prevent browser default on Cmd+Click (Mac opens new tab)
        if (event.metaKey) {
          event.preventDefault()
        }
        if (this.drawing_area.isInStylePaintMode()) {
          d3.selectAll('.sankey-tooltip').remove()
          if (this instanceof Class_ProtoElement)
            this.drawing_area.applyStyleFromPaintSource(this)
          if (!event.ctrlKey && !event.metaKey)
            this.drawing_area.exitStylePaintMode()
          return
        }
        this.eventSimpleLMBClick(event)
      })
    if (this.drawing_area.editable) {
      // P1 (refonte événements) — plus de `dblclick` NATIF : le double-clic est
      // désambiguïsé par le SEUL discriminateur `eventSimpleLMBClick`
      // (Class_ProtoElement) qui appelle onDoubleLMBClick. Garder le dblclick
      // natif ici doublerait le déclenchement (le navigateur émet click+dblclick).

      // Changed call of drag, we have to use only on time call because otherwise each .call erase the previous .call event
      // #1259 — le drag est TOUJOURS câblé ; c'est le `filter` qui décide PAR
      // GESTE selon le mode courant. Avant, le câblage dépendait du mode au
      // moment du draw : une ZDT dessinée pendant le chargement (mode sélection
      // pas encore actif) restait non draggable tant qu'un redraw — typiquement
      // sa sélection — ne re-câblait pas ses listeners. Le filter reprend le
      // défaut d3 (!ctrlKey && !button) + exclut édition et pot de peinture.
      this.d3_selection?.call(
        d3.drag<SVGGElement, unknown>()
          .filter((event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
            !event.ctrlKey && !event.button
            && this.drawing_area.isInSelectionMode()
            && !this.drawing_area.isInStylePaintMode()
            // os#1340 — un élément verrouillé ne se déplace pas.
            && !this.is_locked)
          .on('start',
            (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) =>
              this.eventMouseDragStart(event))
          .on('drag',
            (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) =>
              this.eventMouseDrag(event))
          .on('end',
            (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) =>
              this.eventMouseDragEnd(event))
      )
    }
    // Right mouse button maintained
    this.d3_selection?.on(
      'mousedown',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        this.eventMaintainedClick(event))
    this.d3_selection?.on(
      'mouseup',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        this.eventReleasedClick(event))
    // Mouse cursor goes over this
    this.d3_selection?.on(
      'mouseover',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        this.eventMouseOver(event))
    this.d3_selection?.on(
      'mouseout',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        this.eventMouseOut(event))
    // Mouse cursor move
    this.d3_selection?.on(
      'mousemove',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        this.eventMouseMove(event))
  }
  public delete() {
    if (this._is_currently_deleted === false) {
      // Set deletion boolean to true
      this._is_currently_deleted = true
      // Remove from drawing area
      this.unDraw()
      // Abstract method for cleaning relations between elements
      this.cleanForDeletion()
      
    }
  }
  protected cleanForDeletion() {
    // Does nothing here
  }

  public copyFrom(element_to_copy: Class_BaseElement) {
    // Remove from drawing area
    this.unDraw()
    // Copy intrasect values
    this._copyFrom(element_to_copy)
    // We will need to check all visibility tests after copy
    this.updateVisibilityFingerprint()
  }

  protected _copyFrom(element: Class_BaseElement) {
    this._is_visible = element._is_visible
    this._is_selected = element._is_selected
    this._position.x = element.position_x
    this._position.y = element.position_y
    this._positionWritten()
    this._svg_parent_group = element._svg_parent_group
  }

  public draw() {
    this._process_or_bypass(() => {
      // OS#1246 — data-join keyé (réutilisation du <g> racine) au lieu de
      // remove/re-append systématique : si l'élément reste affichable on
      // réutilise son <g> existant (via _initDraw), sinon on le retire (exit).
      if (this._shouldBeDrawn()) {
        // Avant, draw() appelait unDraw() à chaque passage, ce qui invalidait
        // aussi les caches de géométrie par-draw (ex. Link._arrow_shape). Le <g>
        // racine étant désormais réutilisé (plus d'unDraw systématique), on
        // conserve CETTE invalidation-là explicitement, sinon les sous-formes
        // calculées paresseusement (pointes de flèche, encoche source) sont
        // redessinées depuis un cache périmé → mauvaise taille/position.
        this._invalidateDrawCaches()
        this._draw()
      } else {
        this.unDraw()
      }
    })
  }

  /**
   * OS#1246 — invalide les caches de géométrie recalculés à chaque draw.
   * Auparavant porté par les surcharges de unDraw() (appelé à chaque draw) ;
   * extrait ici pour rester exécuté malgré la réutilisation du <g> racine.
   * No-op par défaut ; surchargé là où existe un cache paresseux (Link).
   */
  protected _invalidateDrawCaches() { }

  /**
   * Gate affichage pour le data-join (OS#1246). Détermine si l'élément doit
   * avoir un <g> dans le DOM. Surchargée par les sous-classes qui ont des
   * conditions d'affichage supplémentaires (ex. seuil de valeur des flux),
   * de sorte que le passage sous condition déclenche bien un exit (unDraw)
   * au lieu de laisser un <g> orphelin dans le DOM réutilisé.
   */
  public _shouldBeDrawn(): boolean {
    return this.is_visible && !this._is_currently_deleted
  }

  protected _draw() {
    this._initDraw()
    this.setEventsListeners()
  }

  public unDraw() {
    if (this.d3_selection !== null) {
      this.d3_selection.remove()
      this.d3_selection = null
    }
  }

  protected _initDraw() {
    const d3_drawing_area = this.drawing_area.d3_selection
    if (d3_drawing_area !== null) {
      // drawing_area est relue en live (jamais capturée en closure) : au
      // reset()/changement de vue (createNewDrawingArea) le parent ci-dessous
      // est le nouveau groupe, donc select() ne trouve rien et on re-append.
      // os#1385 (lot 3) — `_svg_parent_group` nomme le groupe STRUCTUREL de la zone
      // (`g_elements_sankey`, `g_handlers`, `g_select_zone`) ; son identifiant DOM réel est
      // préfixé par la zone hors du conteneur principal (cf. DrawingArea.domId). On le résout
      // donc par la zone, sans quoi l'élément ne trouverait plus son groupe et ne se
      // dessinerait pas du tout dans une fenêtre de feuille.
      const d3_drawing_area_selection = d3_drawing_area
        .selectAll(this.drawing_area.domIdSelector(this._svg_parent_group))
      if (d3_drawing_area_selection.nodes().length > 0) {
        // Data-join keyé par id : on réutilise le <g> racine existant s'il est
        // déjà dans le DOM (enter/update), sinon on l'append (enter). Le <g>
        // racine — qui porte l'id, la classe, le transform et les handlers —
        // persiste ainsi entre deux draw() ; seules ses sous-formes sont
        // vidées puis reconstruites (remove/re-append interne conservé pour
        // l'instant, cf. OS#1246). selectAll('*') ne cible que les descendants,
        // donc le root et ses listeners d'événements survivent.
        const existing = d3_drawing_area_selection.select<SVGGElement>('#' + this.svg_group)
        if (!existing.empty()) {
          this.d3_selection = existing
          this.d3_selection.selectAll('*').remove()
        } else {
          this.d3_selection = d3_drawing_area_selection.append('g')
          this.d3_selection.attr('id', this.svg_group)
        }
      }
    }
  }
  public setPosXY(x: number, y: number) {
    this._position.x = x; this._position.y = y; this._positionWritten(); this.applyPosition()
  }
  /** os#1508 — une position change : la mémo des tailles de nœuds (lot de réorganisations) tombe. */
  protected _positionWritten() { this._drawing_area?.invalidateNodeSizeMemo() }
  protected applyPosition() {
    this.d3_selection?.attr(
      'transform',
      'translate(' + this.position_x + ', ' + this.position_y + ')')
  }
  public get position_x() { return this._position.x }
  public set position_x(_) { this._position.x = _; this._positionWritten() }
  public get position_y() { return this._position.y }
  public set position_y(_) { this._position.y = _; this._positionWritten() }

  public get drawing_area() { return this._drawing_area }
  public get is_visible() {
    return (this.sankey.is_visible && this._is_visible)
  }
  /**
   * sa#283 lot 4 — état de visibilité PROPRE : le seul drapeau `_is_visible`, celui que
   * `setVisible()` / `setInvisible()` posent, SANS la porte du diagramme (`sankey.is_visible`)
   * ni les portes dérivées des sous-classes (tags, niveaux, flux visibles, modes englobants).
   *
   * Lecteur légitime : un overlay RÉVERSIBLE qui doit mémoriser l'état d'origine avant de
   * masquer, puis le restaurer à l'identique (vues contextuelles, `ContextsRuntime`). Pour
   * savoir si un élément s'affiche, c'est `is_visible` qu'il faut lire, pas ceci.
   */
  public get is_own_visible(): boolean { return this._is_visible }
  public get visibility_fingerprint() { return this._visibility_fingerprint }
  public setVisible() { this._is_visible = true; this.updateVisibilityFingerprint(); this.draw() }
  public setInvisible() { this._is_visible = false; this.updateVisibilityFingerprint(); this.draw() }
  public updateVisibilityFingerprint() { this._visibility_fingerprint = randomId() }

  public setSelected() { this._is_selected = true; this.drawAsSelected() }
  public setUnSelected() { this._is_selected = false; this.drawAsSelected() }
  public get is_selected() { return this._is_selected }
  protected drawAsSelected() { }

  // os#1340 — verrouillage : un élément verrouillé n'est ni sélectionnable
  // (garde centrale dans DrawingArea.addElementToSelection) ni déplaçable
  // (filtre du d3.drag ci-dessus). Les feuilles portant l'attribut
  // `shape_is_locked` (Class_BaseShape) surchargent ce prédicat.
  public get is_locked(): boolean { return false }

  public get id() { return this._id }
  public get sankey() { return this.drawing_area.sankey }
  public get svg_parent_group() { return this._svg_parent_group }
  public get svg_group() { return 'gg_' + this._id.replace(/[^a-zA-Z0-9]/g, '') }

  public isMouseOver() { return this._is_mouse_over }
  public setMouseOver() { this._is_mouse_over = true }
  public unsetMouseOver() { this._is_mouse_over = false }

  protected eventSimpleLMBClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Clear tooltips presents
    d3.selectAll('.sankey-tooltip').remove()
    // TODO do something
  }

  protected eventDoubleLMBClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // TODO Ajouter déclemenchement editeur nom de noeud
  }

  protected eventSimpleRMBClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Clear tooltips presents
    d3.selectAll('.sankey-tooltip').remove()
    // TODO Ajouter ouverture menu contextuel (clic droit) sur noeud
  }

  protected eventMaintainedClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    /* TODO définir clique gauche sur element */
    this._is_mouse_grabbed = true
  }

  protected eventReleasedClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    /* TODO définir clique gauche sur element */
    this._is_mouse_grabbed = false
  }

  protected eventMouseOver(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    this.sankey.nodes_list.forEach(n => n.unsetMouseOver())
    this.sankey.links_list.forEach(l => l.unsetMouseOver())
    // Update mouse over indicator for element
    this.setMouseOver()
  }

  protected eventMouseOut(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Update mouse left indicator for element
    this.unsetMouseOver()
  }

  protected eventMouseMove(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    /* TODO définir  */
  }

  protected eventMouseDragStart(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    /* TODO définir  */
  }

  protected eventMouseDrag(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    /* TODO définir  */
  }

  protected eventMouseDragEnd(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    /* TODO définir  */
  }
}
// Les accesseurs d'attributs sont posés sur le prototype au premier élément construit
// (cf. `createDynamicProperties`).
let dynamic_properties_on_prototype = false

export abstract class Class_ProtoElement extends Class_BaseElement {

  protected _clickTimer: NodeJS.Timeout | null = null
  protected _clickDelay: number = 250 // ms - délai pour distinguer simple/double clic
  protected _storage: StorageType<ConfigType> = {}
  protected _config: ConfigType

  // Suspend les actions des setters dynamiques pendant la chaîne de
  // construction. Indispensable car Babel CRA loose émet pour chaque
  // déclaration `prop!:` de Class_BaseShape un `this.prop = void 0` au
  // début du constructeur de la classe, ce qui passe par le dynamic
  // setter installé par createDynamicProperties() AVANT que les feuilles
  // (NodeBase, Node, Link, Legend...) n'aient assigné leurs helpers
  // (_nodeDrawShape, _link_shape, _stock_values, ...). Tant que ce flag
  // est true, les actions (drawShape, drawElements, drawStockBox, ...)
  // sont skippées. Chaque feuille remet ce flag à false à la fin de son
  // constructeur (cf. NodeBase, Link).
  protected _suspend_actions: boolean = true


  protected _position: Type_BaseElementPosition
  protected _style: Class_ElementStyle[]

  // SA#541 — couches de style imposées par les étiquettes, MÉMORISÉES : `getElementProperty` est
  // la lecture la plus fréquente du rendu. Clé = époque des styles d'étiquette du diagramme +
  // sélection qui fixe la valeur portée (flux), cf. `tag_style_layers`.
  private _tag_style_layers: readonly Type_ElementTagStyleLayer[] = NO_TAG_STYLE_LAYERS
  private _tag_style_epoch: number = -1
  private _tag_style_selection: string = ''

  constructor(
    id: string,
    drawing_area: Class_DrawingArea,
    svg_parent_group: string,
    style: Class_ElementStyle
  ) {
    super(id, drawing_area, true, svg_parent_group)

    this._position = {
      x: const_default_position_x,
      y: const_default_position_y
    }
    const default_style = drawing_area.sankey.default_style
    if (style.id == default_style_id) {
      this._style = [default_style]
    } else {
      this._style = [default_style, style]
    }
    this._config = ALL_ATTRIBUTES_CONFIG
    this._style.forEach(s => s.addReference(this))
    this.createDynamicProperties()
  }

  // ============================================================================
  // P1 (refonte événements) — UNIQUE discriminateur simple/double-clic. C'est le
  // SEUL gestionnaire du `click` du <g> PERSISTANT (câblé dans
  // setEventsListeners via eventSimpleLMBClick). Un 2e clic dans `_clickDelay` ms
  // annule le simple en attente et déclenche le double ; sinon le simple part
  // après le délai. Remplace les timers dupliqués de NodeBase et Link (et, en P2,
  // la détection manuelle du label). Les feuilles surchargent
  // `onSingleLMBClick` / `onDoubleLMBClick` — plus jamais le timer lui-même.
  // ============================================================================
  public override eventSimpleLMBClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    // Tout clic (simple ou 1er d'un double) purge les tooltips (ex-comportement
    // de Class_BaseElement.eventSimpleLMBClick, désormais court-circuité).
    d3.selectAll('.sankey-tooltip').remove()
    if (this._clickTimer) {
      clearTimeout(this._clickTimer)
      this._clickTimer = null
      this.onDoubleLMBClick(event)
      return
    }
    this._clickTimer = setTimeout(() => {
      this._clickTimer = null
      this.onSingleLMBClick(event)
    }, this._clickDelay)
  }

  /** Simple clic CONFIRMÉ (après désambiguïsation). Surchargé par les feuilles. */
  protected onSingleLMBClick(_event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    /* no-op par défaut */
  }

  /** Double clic CONFIRMÉ. Surchargé par les feuilles (édition, etc.). */
  protected onDoubleLMBClick(_event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    /* no-op par défaut */
  }

  // Les accesseurs dynamiques sont les MÊMES pour tous les éléments (`_config` vaut
  // ALL_ATTRIBUTES_CONFIG pour chacun) : ils sont installés UNE fois sur le prototype de
  // Class_ProtoElement, pas sur chaque instance. Mesuré sur SOCLE pays partenaires (34 000 flux) :
  // ~150 `defineProperty` et deux fermetures par attribut et par flux pesaient plusieurs secondes
  // de construction, et autant de ramasse-miettes. Le comportement est inchangé : `this` est
  // l'instance dans chaque accesseur, comme avant.
  protected createDynamicProperties() {
    if (this._config !== ALL_ATTRIBUTES_CONFIG) {
      // Configuration propre à cet élément : accesseurs d'instance, comme avant.
      Class_ProtoElement._defineDynamicProperties(this, this._config)
      return
    }
    if (dynamic_properties_on_prototype) return
    dynamic_properties_on_prototype = true
    Class_ProtoElement._defineDynamicProperties(Class_ProtoElement.prototype, this._config)
  }

  private static _defineDynamicProperties(target: object, config: ConfigType) {
    (Object.keys(config) as Array<keyof ConfigType>).forEach(key => {
      const is_translatable = TRANSLATABLE_TEXT_ATTRIBUTES.has(key as string)
      Object.defineProperty(target, key, {
        get: function (this: Class_ProtoElement) {
          const raw = this.getElementProperty(key as keyof ConfigType)
          // OS#1299 — texte traduisible : une map { langue -> texte } est résolue
          // pour la langue active (les strings historiques passent telles quelles).
          if (is_translatable && raw !== null && typeof raw === 'object') {
            return resolveLangMap(raw as Type_LangMap, i18next.language)
          }
          return raw
        },
        set: function (this: Class_ProtoElement, value: ExtractAttributeValue<ConfigType[typeof key]>) {
          const attribute = this._config[key]
          let store_value: unknown = value

          // OS#1299 — texte traduisible : écrire = poser la valeur sous la langue
          // active, en préservant les traductions existantes (héritées du storage
          // local OU d'un style). Vider alors que d'autres langues existent =
          // supprimer cette traduction (repli à l'affichage). Une string
          // historique (langue inconnue) est simplement remplacée.
          if (is_translatable && typeof value === 'string') {
            const lang = normalizeLang(i18next.language)
            const raw = this.getElementProperty(key as keyof ConfigType)
            const map: Type_LangMap =
              (raw !== null && typeof raw === 'object') ? { ...(raw as Type_LangMap) } : {}
            if (value === '' && Object.keys(map).some(l => l !== lang)) delete map[lang]
            else map[lang] = value
            store_value = map
          }

          // Méthodes nommées par la configuration (setter, callback, actions), lues sur l'instance.
          const self = this as unknown as Record<string, unknown>
          if (attribute.setter) {
            const setter = self[attribute.setter]
            if (typeof setter === 'function') {
              setter.call(this, store_value)
            }
          } else {
            this._storage[key] = store_value as ExtractAttributeValue<ConfigType[typeof key]>
          }

          if (attribute.callback) {
            const callback = self[attribute.callback]
            if (typeof callback === 'function') {
              callback.call(this)
            }
          }
          if (attribute.actions && !this._suspend_actions) {
            attribute.actions.forEach(action => {
              const actionMethod = self[action]
              if (typeof actionMethod === 'function') {
                actionMethod.call(this)
              }
            })
          }
        },
        enumerable: true,
        configurable: true
      })
    })
  }

  public get attributes() {
    return this._storage
  }
  public set attributes(_) {
    this._storage = _
  }
  public getStyleWithAttr(k: keyof Class_ElementStyle | keyof ConfigType) {
    // Parcours du dernier style au premier, sans recopier la liste : cette lecture est sur le
    // chemin de chaque attribut résolu par le style, donc des millions de fois par dessin.
    const styles = this._style
    for (let i = styles.length - 1; i >= 0; i--) {
      if (styles[i][k as keyof Class_ElementStyle] !== undefined) return styles[i]
    }
    return styles[0]
  }

  public getStylesWithAttr(k: keyof ConfigType) {
    return this._style.filter(s => s[k as keyof Class_ElementStyle] !== undefined)
  }

  public getStyleProperty(k: keyof ConfigType) {
    const valueOfStyle = this.getStyleWithAttr(k)
    if (valueOfStyle && valueOfStyle[k as keyof Class_ElementStyle] !== undefined) {
      return valueOfStyle[k as keyof Class_ElementStyle]
    }
    return this._config[k].default
  }
  public getElementProperty(k: keyof ConfigType) {
    // SA#541 — un style d'étiquette l'emporte sur la mise en forme locale et sur les styles de
    // l'élément, pour les seuls paramètres qu'il définit. Sans style d'étiquette dans le diagramme
    // (tous les fichiers existants), `tagStyleLayerImposing` rend `undefined` sans rien calculer.
    const imposed = this.tagStyleLayerImposing(k)
    if (imposed !== undefined) return imposed.style.getElementProperty(k)
    if (this._storage[k] !== undefined) {
      return this._storage[k]
    }
    return this.getStyleProperty(k)
  }

  /**
   * SA#541 — couches de style imposées à cet élément par ses étiquettes, de la MOINS prioritaire à
   * la PLUS prioritaire (ordre des listes, cf. `tagStyles.ts`). Liste vide tant que le diagramme
   * n'a aucun style d'étiquette.
   */
  public get tag_style_layers(): readonly Type_ElementTagStyleLayer[] {
    const sankey = this.drawing_area?.sankey
    if (!sankey || !sankey.has_tag_styles) return NO_TAG_STYLE_LAYERS
    const epoch = sankey.tag_styles_epoch
    const selection = this.tagStyleSelectionKey()
    if (epoch !== this._tag_style_epoch || selection !== this._tag_style_selection) {
      const layers = this.computeTagStyleLayers()
      // `null` : l'élément n'est pas encore construit — surtout ne rien mémoriser.
      if (layers === null) return NO_TAG_STYLE_LAYERS
      this._tag_style_layers = layers
      this._tag_style_epoch = epoch
      this._tag_style_selection = selection
    }
    return this._tag_style_layers
  }

  /**
   * SA#541 — la couche qui impose le paramètre `k`, ou `undefined` : aucune couche ne le définit,
   * ou c'est une couleur que l'élément a verrouillée par son cadenas (`<k>_sustainable` posé sur
   * l'élément — le seul cadenas qui existe).
   */
  public tagStyleLayerImposing(k: keyof ConfigType): Type_ElementTagStyleLayer | undefined {
    const layers = this.tag_style_layers
    if (layers.length === 0) return undefined
    const lock = colorLockOf(k as string)
    if (lock !== undefined && this._storage[lock as keyof ConfigType] === true) return undefined
    return topLayerDefining(layers, style => style.getElementProperty(k))
  }

  /**
   * SA#541 — une couche définit la couleur `k`, mais le cadenas de couleur posé sur l'élément la
   * tient à distance : la couleur de l'élément doit alors l'emporter, y compris sur les règles de
   * couleur qui, sans style d'étiquette, ignorent ce cadenas (flux).
   */
  public isTagStyleLockedOut(k: keyof ConfigType): boolean {
    const lock = colorLockOf(k as string)
    if (lock === undefined || this._storage[lock as keyof ConfigType] !== true) return false
    return topLayerDefining(this.tag_style_layers, style => style.getElementProperty(k)) !== undefined
  }

  /**
   * SA#541 — la couleur `k` est-elle PROPRE à l'élément plutôt que dérivée de la couleur de sa
   * forme ? Bordure, fonds et libellés suivent la couleur de la forme sauf cadenas
   * (`<k>_sustainable`) : une couleur imposée par un style d'étiquette doit tenir de même, sans
   * allumer pour autant le cadenas que montre l'inspecteur.
   */
  public keepsOwnColor(k: keyof ConfigType): boolean {
    // Lecture directe du cadenas, comme le faisait le site appelant : le résultat est inchangé
    // pour tout élément sans style d'étiquette.
    if ((this as unknown as { [attribute: string]: unknown })[`${String(k)}_sustainable`] === true) return true
    return this.tagStyleLayerImposing(k) !== undefined
  }

  /** SA#541 — couches propres à la famille de l'élément (nœud, flux) ; `null` s'il n'est pas prêt. */
  protected computeTagStyleLayers(): readonly Type_ElementTagStyleLayer[] | null {
    return NO_TAG_STYLE_LAYERS
  }

  /** SA#541 — ce qui, en plus des étiquettes, change ce que porte l'élément (flux : sélection de données). */
  protected tagStyleSelectionKey(): string {
    return ''
  }

  /**
   * SA#541 — couches d'après les groupes de la famille de l'élément et les étiquettes qu'il porte.
   * Le style `default`, pré-rempli de TOUS les défauts usine, n'est jamais une couche : il
   * imposerait chaque paramètre du diagramme.
   */
  protected resolveTagStyleLayers(
    groups: readonly (Type_ElementTagStyleOwner & { id: string, use_colors?: boolean, tags_list: readonly Type_ElementTagStyleOwner[] })[],
    carries: (tag: Type_ElementTagStyleOwner) => boolean
  ): Type_ElementTagStyleLayer[] {
    // SA#551 — aperçu au survol d'un groupe de la légende : les seuls styles de ce groupe, ouvert ou
    // non, s'appliquent aux éléments de sa famille (cf. tagGroupPriority.previewedTagGroups).
    groups = previewedTagGroups(groups, this.sankey.tag_style_preview_group_id)
    const styles = this.sankey.styles_dict
    // Interrupteur du groupe « Appliquer les styles associés » (`use_colors`) : fermé, le groupe
    // n'impose rien — interrupteur par groupe, fermé par défaut (arbitrage du chantier).
    const switched_on = groups.filter(group => group.use_colors === true)
    // SA#553 — valeurs par défaut des paramètres que règlent les autres étiquettes, pour les éléments
    // de l'étiquette générée. Défaut usine de l'attribut (même configuration pour nœuds et flux).
    const config = this._config as { [k: string]: { default?: unknown } | undefined }
    return tagStyleLayers<Type_ElementTagStyleOwner, Type_ElementTagStyleOwner, Class_ElementStyle>(switched_on, carries, style_id => {
      const style = styles[style_id]
      return (style && !style.is_default_style) ? style : undefined
    }, tag_styles => untaggedDefaultsStyle(
      tag_styles as unknown as Type_StylePropertyReader[],
      k => config[k]?.default
    ) as unknown as Class_ElementStyle)
  }

  public get style(): readonly Class_ElementStyle[] {
    return this._style
  }

  /**
   * Ajoute un style à l'élément
   * Le style est ajouté en fin de liste (donc prioritaire)
   */
  public addStyle(style: Class_ElementStyle): void {
    if (!style) return

    // Vérifier que le style n'est pas déjà présent
    if (this._style.some(s => s.id === style.id)) {
      console.warn(`Style ${style.id} is already applied to element ${this.id}`)
      return
    }

    this._style.push(style)
    style.addReference(this)
    this.draw()
  }

  /**
   * Retire un style de l'élément par son instance
   */
  public removeStyle(style: Class_ElementStyle): void {
    if (!style) return
    this.removeStyleById(style.id)
  }

  /**
   * Retire un style de l'élément par son ID
   */
  public removeStyleById(styleId: string): void {
    // Vérifier si le style existe
    const stylesToRemove = this._style.filter(s => s.id === styleId)

    if (stylesToRemove.length === 0) {
      console.warn(`Style ${styleId} not found on element ${this.id}`)
      return
    }

    // Vérifier si le style par défaut est concerné
    if (this._style[0]?.id === styleId) {
      console.warn(`Cannot remove default style from element ${this.id}`)
      return
    }

    // Filtrer tous les styles avec cet id sauf le premier (default)
    this._style = this._style.filter((s, index) => s.id !== styleId || index === 0)

    // Nettoyer les références pour tous les styles retirés
    stylesToRemove.forEach(style => {
      if (style !== this._style[0]) {
        style.removeReference(this)
      }
    })

    this.draw()
  }

  /**
   * Retire tous les styles sauf le style par défaut
   */
  public removeAllStyles(): void {
    // Conserver uniquement le premier style (style par défaut)
    const stylesToRemove = this._style.slice(1)
    this._style = [this._style[0]]

    stylesToRemove.forEach(style => style.removeReference(this))
    this.draw()
  }

  /**
   * Remplace tous les styles (sauf le défaut) par de nouveaux styles
   * Utile pour des opérations en batch
   */
  public replaceStyles(styles: Class_ElementStyle[]): void {
    if (!styles || styles.length === 0) return

    // Retirer tous les styles actuels sauf le défaut
    const stylesToRemove = this._style.slice(1)
    stylesToRemove.forEach(style => style.removeReference(this))

    // Garder le style par défaut et ajouter les nouveaux
    this._style = [this._style[0], ...styles]
    styles.forEach(style => style.addReference(this))

    this.draw()
  }

  /**
   * Vérifie si un style est appliqué à l'élément
   */
  public hasStyle(styleId: string): boolean {
    return this._style.some(s => s.id === styleId)
  }

  /**
   * Obtient un style par son ID
   */
  public getStyleById(styleId: string): Class_ElementStyle | undefined {
    return this._style.find(s => s.id === styleId)
  }

  /**
   * Obtient tous les styles sauf le style par défaut
   */
  public getCustomStyles(): Class_ElementStyle[] {
    return this._style.slice(1)
  }

  public resetAttributes() {
    this._storage = {}
    this.draw()
  }

  public shouldSaveAttribute(
    key: keyof ConfigType,
    value: string | number | boolean | undefined
  ): boolean {
    return this.getStylesWithAttr(key).length > 1 || (value !== undefined && value !== this.getStyleProperty(key))
  }

  public useDefaultStyle() {
  }

  public isAttributeOverloaded(attr: keyof ConfigType) {
    if (this._storage[attr] === undefined) return false
    if (this._storage[attr] === this.getStyleWithAttr(attr)[attr as keyof Class_ElementStyle]) return false
    return true
  }

  public delete_attribute(k: keyof ConfigType) {
    delete this._storage[k]
  }

  protected cleanForDeletion() {
    this.style.forEach(s => s.removeReference(this))
  }

  public isEqual(_: this) {
    return Object.keys(this._config).every(attr => this[attr as keyof Class_ProtoElement] === _[attr as keyof Class_ProtoElement])
  }

  public copyAttrFrom(element_to_copy: Class_ProtoElement) {
    this._storage = {};
    (Object.keys(element_to_copy._storage) as Array<keyof ConfigType>).forEach(key => {
      // Minimise an override against the SOURCE's own resolved style, not the
      // target's. A key held in the source `_storage` that differs from the
      // source's style is a genuine, intentional override and must survive the
      // copy verbatim. Comparing against the target style (the previous
      // behaviour) wrongly dropped an override that happened to match a TARGET
      // style which a later step then replaces — e.g. on "apply layout from a
      // source diagram", `styleNode` (UpdateFrom) swaps the target's extremity
      // style right after `attrNode`, so extremity-node label anchors
      // (name_label_horiz / name_label_vert) were lost (#195). For shared-style
      // cases (view ↔ master) source and target styles coincide, so this is a
      // no-op and the "transparent view" minimisation is preserved.
      if (element_to_copy._storage[key] !== element_to_copy.getStyleProperty(key as keyof ConfigType)) {
        this._storage[key] = element_to_copy._storage[key]
      }
    })
  }

  public snapshotStorage(): Partial<ConfigType> {
    return { ...this._storage } as Partial<ConfigType>
  }

  public restoreStorage(snapshot: Partial<ConfigType>): void {
    this._storage = { ...snapshot } as Partial<ConfigType>
  }
  protected _copyFrom(element_to_copy: Class_ProtoElement) {
    super._copyFrom(element_to_copy)
    this.copyAttrFrom(element_to_copy)
    this.updateVisibilityFingerprint()
  }

  /**
   * OS#1246 — « la représentation DOM de cet élément est-elle à jour ? ».
   *
   * Cherchait auparavant un <g id=...> sous le groupe parent : l'EXISTENCE de
   * l'id valait « synchronisé ». Insuffisant depuis les data-joins — un enter
   * peut pré-créer un <g> VIDE, que l'ancienne version déclarait synchronisé,
   * si bien que le nœud sautait le dessin et laissait un flux invisible.
   * On vérifie donc la sélection vivante ET un marqueur de CONTENU. Au passage
   * c'est moins cher : plus de double requête DOM par élément et par frame.
   */
  public isRelatedD3SelectionPresentAndSynced() {
    const node = this.d3_selection?.node()
    if (!node || !node.isConnected)
      return false
    return this._hasDrawnContent()
  }

  /**
   * Marqueur de contenu dessiné, complément de
   * isRelatedD3SelectionPresentAndSynced(). Base : la présence du <g> suffit.
   * Surchargé là où un <g> peut légitimement être présent mais vide (Link).
   */
  protected _hasDrawnContent(): boolean { return true }

  protected _process_or_bypass(
    process_func: () => void
  ) {
    if (this.drawing_area.bypass_redraws)
      return
    process_func()
  }

  public saveUndo(f: (_: Class_ProtoElement) => void) {
    this.drawing_area.application_data.history.saveUndo(() => { f(this) })
  }

  public saveRedo(f: (_: Class_ProtoElement) => void) {
    this.drawing_area.application_data.history.saveRedo(() => { f(this) })
  }

}
export abstract class Class_BaseShape extends Class_ProtoElement {
  // Sous-sélection : préfixe du label actuellement focus (clic sur le <text>
  // du label). Sert à n'afficher les poignées de redimensionnement du label
  // que quand l'utilisateur a cliqué sur le label lui-même, pas sur la forme.
  // null si aucun label n'est sub-sélectionné.
  public selected_label_prefix: 'name_label' | 'value_label' | 'icon' | null = null

  // OS#1299 — nom multilingue : map { langue -> nom }, comme la documentation markdown (cf.
  // persistenceMigrations). Le couple `name` expose une string résolue/écrite pour la langue
  // ACTIVE de l'app (i18next) : traduire un diagramme = basculer la langue puis renommer. Une
  // seule langue = comportement historique inchangé (sérialisée en string).
  //
  // DÉCLARÉE EN TÊTE, ET CE N'EST PAS DE LA COQUETTERIE. Babel émet, au début du constructeur de
  // CETTE classe, un `this.prop = void 0` par déclaration `prop!:` ci-dessous, et chacun passe par
  // le setter dynamique installé par `createDynamicProperties()`. Poser la map AVANT eux garantit
  // qu'aucun de ces passages ne trouve `_name_map` indéfinie (cf. `_suspend_actions`).
  protected _name_map: Type_LangMap = {}

  // =================== SHAPE ATTRIBUTES (shape_*) ===================
  shape_visible!: ShapeAttributeTypes['visible']
  shape_type!: ShapeAttributeTypes['type']
  shape_min_width!: ShapeAttributeTypes['min_width'] //only nodes
  shape_min_height!: ShapeAttributeTypes['min_height'] //only nodes
  shape_color_visible!: ShapeAttributeTypes['color_visible']
  shape_color!: ShapeAttributeTypes['color']
  shape_opacity!: ShapeAttributeTypes['opacity']
  shape_color_sustainable!: ShapeAttributeTypes['color_sustainable']

  // =================== BORDER ATTRIBUTES (border_*) ===================
  shape_border_visible!: ShapeAttributeTypes['border_visible']
  shape_border_color!: ShapeAttributeTypes['border_color']
  shape_border_color_sustainable!: ShapeAttributeTypes['border_color_sustainable']
  shape_border_thickness!: ShapeAttributeTypes['border_thickness']
  shape_border_dashed!: ShapeAttributeTypes['border_dashed']
  shape_border_radius!: ShapeAttributeTypes['border_radius']

  // =================== SHADOW ATTRIBUTES (shadow_*) ===================
  shape_shadow_visible!: ShapeAttributeTypes['shadow_visible']

  // =================== NAME LABEL ATTRIBUTES (name_label_*) ===================
  // Visibility & Font
  name_label_has_fo!: NameLabelAttributeTypes['has_fo']
  name_label_fo_content!: NameLabelAttributeTypes['fo_content']

  name_label_is_visible!: NameLabelAttributeTypes['is_visible']
  name_label_font_family!: NameLabelAttributeTypes['font_family']
  name_label_font_size!: NameLabelAttributeTypes['font_size']
  name_label_uppercase!: NameLabelAttributeTypes['uppercase']
  name_label_bold!: NameLabelAttributeTypes['bold']
  name_label_italic!: NameLabelAttributeTypes['italic']
  name_label_color!: NameLabelAttributeTypes['color']
  // Separator
  name_label_separator!: NameLabelAttributeTypes['separator']
  name_label_separator_part!: NameLabelAttributeTypes['separator_part']
  // Contenu du label (cf. Type_NameLabelSource) — désormais portés par le style.
  name_label_source!: NameLabelAttributeTypes['source']
  name_label_text!: NameLabelAttributeTypes['text']
  name_label_template!: NameLabelAttributeTypes['template']
  name_label_tag_group_id!: NameLabelAttributeTypes['tag_group_id']
  name_label_dimension_id!: NameLabelAttributeTypes['dimension_id']

  // Position
  name_label_horiz!: NameLabelAttributeTypes['horiz']
  name_label_vert!: NameLabelAttributeTypes['vert']
  name_label_horiz_shift!: NameLabelAttributeTypes['horiz_shift']
  name_label_vert_shift!: NameLabelAttributeTypes['vert_shift']
  name_label_box_width!: NameLabelAttributeTypes['box_width'] // same as name_label_background_min_width ?
  name_label_vertical_text!: NameLabelAttributeTypes['vertical_text']
  name_label_text_angle!: NameLabelAttributeTypes['text_angle']
  name_label_position_x!: NameLabelAttributeTypes['position_x']
  name_label_position_y!: NameLabelAttributeTypes['position_y']
  name_label_position_offset!: NameLabelAttributeTypes['position_offset']
  name_label_text_align!: NameLabelAttributeTypes['text_align']
  name_label_inside_horiz!: NameLabelAttributeTypes['inside_horiz']
  name_label_inside_vert!: NameLabelAttributeTypes['inside_vert']

  name_label_scientific_notation!: ValueLabelAttributeTypes['scientific_notation']
  name_label_significant_digits!: ValueLabelAttributeTypes['significant_digits']
  name_label_nb_significant_digits!: ValueLabelAttributeTypes['nb_significant_digits']
  name_label_custom_digit!: ValueLabelAttributeTypes['custom_digit']
  name_label_nb_digit!: ValueLabelAttributeTypes['nb_digit']

  // Units
  name_label_unit_visible!: ValueLabelAttributeTypes['unit_visible']
  name_label_unit_type!: ValueLabelAttributeTypes['unit_type']
  name_label_unit!: ValueLabelAttributeTypes['unit']
  name_label_unit_factor!: ValueLabelAttributeTypes['unit_factor']

  // Background
  name_label_background_visible!: NameLabelAttributeTypes['background_visible']
  name_label_background_color!: NameLabelAttributeTypes['background_color']
  name_label_background_opacity!: NameLabelAttributeTypes['background_opacity']
  name_label_background_type!: NameLabelAttributeTypes['background_type']
  name_label_background_min_width!: NameLabelAttributeTypes['background_min_width']
  name_label_background_min_height!: NameLabelAttributeTypes['background_min_height']
  name_label_background_color_visible!: NameLabelAttributeTypes['background_color_visible']
  name_label_background_color_sustainable!: NameLabelAttributeTypes['background_color_sustainable']
  name_label_background_border_visible!: NameLabelAttributeTypes['background_border_visible']
  name_label_background_border_color!: NameLabelAttributeTypes['background_border_color']
  name_label_background_border_color_sustainable!: NameLabelAttributeTypes['background_border_color_sustainable']
  name_label_background_border_thickness!: NameLabelAttributeTypes['background_border_thickness']
  name_label_background_border_dashed!: NameLabelAttributeTypes['background_border_dashed']
  name_label_background_border_radius!: NameLabelAttributeTypes['background_border_radius']


  // =================== VALUE LABEL ATTRIBUTES (value_label_*) ===================
  // Visibility & Font
  value_label_has_fo!: ValueLabelAttributeTypes['has_fo']
  value_label_fo_content!: ValueLabelAttributeTypes['fo_content']

  value_label_is_visible!: ValueLabelAttributeTypes['is_visible']
  value_label_font_family!: ValueLabelAttributeTypes['font_family']
  value_label_font_size!: ValueLabelAttributeTypes['font_size']
  value_label_uppercase!: ValueLabelAttributeTypes['uppercase']
  value_label_bold!: ValueLabelAttributeTypes['bold']
  value_label_italic!: ValueLabelAttributeTypes['italic']
  value_label_color!: ValueLabelAttributeTypes['color']

  // Position
  value_label_horiz!: ValueLabelAttributeTypes['horiz']
  value_label_vert!: ValueLabelAttributeTypes['vert']
  value_label_horiz_shift!: ValueLabelAttributeTypes['horiz_shift']
  value_label_vert_shift!: ValueLabelAttributeTypes['vert_shift']
  value_label_box_width!: ValueLabelAttributeTypes['box_width']
  value_label_vertical_text!: ValueLabelAttributeTypes['vertical_text']
  value_label_text_angle!: ValueLabelAttributeTypes['text_angle']
  value_label_position_x!: ValueLabelAttributeTypes['position_x']
  value_label_position_y!: ValueLabelAttributeTypes['position_y']
  value_label_position_offset!: ValueLabelAttributeTypes['position_offset']
  value_label_text_align!: ValueLabelAttributeTypes['text_align']
  value_label_inside_horiz!: ValueLabelAttributeTypes['inside_horiz']
  value_label_inside_vert!: ValueLabelAttributeTypes['inside_vert']
  value_label_stick_to_label!: ValueLabelAttributeTypes['stick_to_label']
  // Background
  value_label_background_visible!: ValueLabelAttributeTypes['background_visible']
  value_label_background_color!: ValueLabelAttributeTypes['background_color']
  value_label_background_opacity!: ValueLabelAttributeTypes['background_opacity']
  value_label_background_type!: ValueLabelAttributeTypes['background_type']
  value_label_background_min_width!: ValueLabelAttributeTypes['background_min_width']
  value_label_background_min_height!: ValueLabelAttributeTypes['background_min_height']
  value_label_background_color_visible!: ValueLabelAttributeTypes['background_color_visible']
  value_label_background_color_sustainable!: ValueLabelAttributeTypes['background_color_sustainable']
  value_label_background_border_visible!: ValueLabelAttributeTypes['background_border_visible']
  value_label_background_border_color!: ValueLabelAttributeTypes['background_border_color']
  value_label_background_border_thickness!: ValueLabelAttributeTypes['background_border_thickness']
  value_label_background_border_dashed!: ValueLabelAttributeTypes['background_border_dashed']
  value_label_background_border_radius!: ValueLabelAttributeTypes['background_border_radius']

  // Formatting
  value_label_scientific_notation!: ValueLabelAttributeTypes['scientific_notation']
  value_label_significant_digits!: ValueLabelAttributeTypes['significant_digits']
  value_label_nb_significant_digits!: ValueLabelAttributeTypes['nb_significant_digits']
  value_label_custom_digit!: ValueLabelAttributeTypes['custom_digit']
  value_label_nb_digit!: ValueLabelAttributeTypes['nb_digit']
  value_label_in_out_display_mode!: ValueLabelAttributeTypes['in_out_display_mode']

  // Units
  value_label_unit_visible!: ValueLabelAttributeTypes['unit_visible']
  value_label_unit_type!: ValueLabelAttributeTypes['unit_type']
  value_label_unit!: ValueLabelAttributeTypes['unit']
  value_label_unit_factor!: ValueLabelAttributeTypes['unit_factor']

  value_label_on_path!: LinkLabelSpecificValues['on_path']
  value_label_pos_auto!: LinkLabelSpecificValues['pos_auto']
  value_label_text_source!: LinkLabelSpecificValues['text_source']

  name_label_on_path!: LinkLabelSpecificValues['on_path']
  name_label_pos_auto!: LinkLabelSpecificValues['pos_auto']
  name_label_text_source!: LinkLabelSpecificValues['text_source']
  name_label_flux_tag_group_id!: LinkLabelSpecificValues['flux_tag_group_id']

  // =================== STOCK LABEL ATTRIBUTES (stock_label_*) ===================
  stock_label_is_visible!: StockLabelAttributeTypes['is_visible']
  stock_label_font_family!: StockLabelAttributeTypes['font_family']
  stock_label_font_size!: StockLabelAttributeTypes['font_size']
  stock_label_color!: StockLabelAttributeTypes['color']
  stock_label_bold!: StockLabelAttributeTypes['bold']
  stock_label_italic!: StockLabelAttributeTypes['italic']
  stock_label_uppercase!: StockLabelAttributeTypes['uppercase']
  stock_label_horiz!: StockLabelAttributeTypes['horiz']
  stock_label_vert!: StockLabelAttributeTypes['vert']
  stock_label_inside_horiz!: StockLabelAttributeTypes['inside_horiz']
  stock_label_inside_vert!: StockLabelAttributeTypes['inside_vert']
  stock_label_box_width!: StockLabelAttributeTypes['box_width']
  stock_label_pos_auto!: StockLabelAttributeTypes['pos_auto']
  stock_label_shrink_to_fit!: StockLabelAttributeTypes['shrink_to_fit']
  stock_label_background_visible!: StockLabelAttributeTypes['background_visible']
  stock_label_background_color!: StockLabelAttributeTypes['background_color']
  stock_label_background_opacity!: StockLabelAttributeTypes['background_opacity']
  stock_label_background_color_visible!: StockLabelAttributeTypes['background_color_visible']
  stock_label_background_color_sustainable!: StockLabelAttributeTypes['background_color_sustainable']
  stock_label_background_border_visible!: StockLabelAttributeTypes['background_border_visible']
  stock_label_background_border_color!: StockLabelAttributeTypes['background_border_color']
  stock_label_background_border_color_sustainable!: StockLabelAttributeTypes['background_border_color_sustainable']
  stock_label_background_border_thickness!: StockLabelAttributeTypes['background_border_thickness']
  stock_label_background_border_dashed!: StockLabelAttributeTypes['background_border_dashed']
  stock_label_background_border_radius!: StockLabelAttributeTypes['background_border_radius']
  // Number formatting & units
  stock_label_scientific_notation!: StockLabelAttributeTypes['scientific_notation']
  stock_label_significant_digits!: StockLabelAttributeTypes['significant_digits']
  stock_label_nb_significant_digits!: StockLabelAttributeTypes['nb_significant_digits']
  stock_label_custom_digit!: StockLabelAttributeTypes['custom_digit']
  stock_label_nb_digit!: StockLabelAttributeTypes['nb_digit']
  stock_label_unit_visible!: StockLabelAttributeTypes['unit_visible']
  stock_label_unit_type!: StockLabelAttributeTypes['unit_type']
  stock_label_unit!: StockLabelAttributeTypes['unit']
  stock_label_unit_factor!: StockLabelAttributeTypes['unit_factor']

  shape_orphan_node_visible!: boolean
  shape_position_type!: NodeShapeSpecificAttributeTypes['position_type']
  shape_position_dx!: NodeShapeSpecificAttributeTypes['position_dx']
  shape_position_dy!: NodeShapeSpecificAttributeTypes['position_dy']
  shape_anchor_align_vertical!: NodeShapeSpecificAttributeTypes['anchor_align_vertical']
  shape_anchor_align_horizontal!: NodeShapeSpecificAttributeTypes['anchor_align_horizontal']
  shape_io_reorg_mode!: NodeShapeSpecificAttributeTypes['io_reorg_mode']
  shape_anchor_mode!: NodeShapeSpecificAttributeTypes['anchor_mode']
  shape_link_inset!: NodeShapeSpecificAttributeTypes['link_inset']
  shape_hatch!: NodeShapeSpecificAttributeTypes['hatch']
  shape_is_reference_stock!: NodeShapeSpecificAttributeTypes['is_reference_stock']
  shape_line_flip!: NodeShapeSpecificAttributeTypes['line_flip']
  shape_line_x1!: NodeShapeSpecificAttributeTypes['line_x1']
  shape_line_y1!: NodeShapeSpecificAttributeTypes['line_y1']
  shape_line_x2!: NodeShapeSpecificAttributeTypes['line_x2']
  shape_line_y2!: NodeShapeSpecificAttributeTypes['line_y2']
  shape_position_u_locked!: boolean
  shape_position_v_locked!: boolean
  // os#1340 — verrouillage : ni sélectionnable ni déplaçable (cf. get is_locked).
  shape_is_locked!: boolean
  shape_margin_bottom!: ShapeAttributeTypes['margin_bottom']
  shape_margin_top!: ShapeAttributeTypes['margin_top']
  shape_margin_left!: ShapeAttributeTypes['margin_left']
  shape_margin_right!: ShapeAttributeTypes['margin_right']

  // =================== ICON ATTRIBUTES (icon_*) ===================
  icon_color!: IconLabelAttributeTypes['color']
  icon_is_visible!: IconLabelAttributeTypes['is_visible']
  icon_icon_name!: IconLabelAttributeTypes['icon_name']
  icon_box_width!: IconLabelAttributeTypes['box_width']
  icon_view_box!: IconLabelAttributeTypes['view_box']
  icon_color_sustainable!: IconLabelAttributeTypes['color_sustainable']
  icon_horiz!: IconLabelAttributeTypes['horiz']
  icon_vert!: IconLabelAttributeTypes['vert']
  icon_horiz_shift!: IconLabelAttributeTypes['horiz_shift']
  icon_vert_shift!: IconLabelAttributeTypes['vert_shift']
  icon_inside_horiz!: IconLabelAttributeTypes['inside_horiz']
  icon_inside_vert!: IconLabelAttributeTypes['inside_vert']
  icon_is_image!: IconLabelAttributeTypes['is_image']
  icon_image_src!: IconLabelAttributeTypes['image_src']

  hyperlink!: string | undefined

  shape_local_link_scale!: LinkShapeSpecificValues['local_link_scale']
  shape_is_curved!: LinkShapeSpecificValues['is_curved']
  shape_curvature!: LinkShapeSpecificValues['curvature']
  shape_is_recycling!: LinkShapeSpecificValues['is_recycling']
  shape_is_recycling_locked!: LinkShapeSpecificValues['is_recycling_locked']
  shape_is_structure!: LinkShapeSpecificValues['is_structure']
  shape_must_stay_straight!: LinkShapeSpecificValues['must_stay_straight']
  shape_straight_include_children!: LinkShapeSpecificValues['straight_include_children']
  shape_straight_mode!: LinkShapeSpecificValues['straight_mode']
  shape_straight_offset!: LinkShapeSpecificValues['straight_offset']
  shape_is_reference_flux!: LinkShapeSpecificValues['is_reference_flux']
  shape_show_as_path_locked!: LinkShapeSpecificValues['show_as_path_locked']
  shape_orientation!: LinkShapeSpecificValues['orientation']
  shape_starting_curve!: LinkShapeSpecificValues['starting_curve']
  shape_ending_curve!: LinkShapeSpecificValues['ending_curve']
  shape_starting_tangeant!: LinkShapeSpecificValues['starting_tangeant']
  shape_ending_tangeant!: LinkShapeSpecificValues['ending_tangeant']
  shape_middle_recycling!: LinkShapeSpecificValues['middle_recycling']
  shape_waypoints!: LinkShapeSpecificValues['waypoints']
  shape_source_anchor_offset!: LinkShapeSpecificValues['source_anchor_offset']
  shape_target_anchor_offset!: LinkShapeSpecificValues['target_anchor_offset']
  shape_is_arrow!: LinkShapeSpecificValues['is_arrow']
  shape_arrow_at_source!: LinkShapeSpecificValues['arrow_at_source']
  shape_arrow_size!: LinkShapeSpecificValues['arrow_size']
  shape_arrow_size_ratio!: LinkShapeSpecificValues['arrow_size_ratio']
  shape_arrow_standalone!: LinkShapeSpecificValues['arrow_standalone']
  shape_arrow_min_width!: LinkShapeSpecificValues['arrow_min_width']
  shape_structure_force_min!: LinkShapeSpecificValues['structure_force_min']
  shape_uncertainty_display!: LinkShapeSpecificValues['uncertainty_display']
  shape_source_notch!: LinkShapeSpecificValues['source_notch']
  shape_source_notch_size!: LinkShapeSpecificValues['source_notch_size']
  shape_source_notch_size_ratio!: LinkShapeSpecificValues['source_notch_size_ratio']
  shape_is_dashed!: LinkShapeSpecificValues['is_dashed']
  shape_color_rule!: LinkShapeSpecificValues['color_rule']
  shape_visible_when_zero!: LinkShapeSpecificValues['visible_when_zero']
  shape_link_caps!: LinkShapeSpecificValues['link_caps']

  // ================= LE NOM, ET L'AFFICHAGE DU NOM (os#1445) =================
  //
  // Arbitrage de Julien (20/09) : « il faut une notion d'élément, et un nœud, un flux, une part
  // sont des éléments », et « il y a le nom et le display du nom ».
  //
  // Le nommage vivait jusqu'ici sur les FEUILLES — écrit trois fois (`Class_NodeBase`,
  // `Class_LinkElement`, la zone de texte) alors qu'il décrit l'ÉLÉMENT. `Class_BaseShape` est
  // l'élément qui a une forme, un libellé et une valeur : c'est ici que « le nom » appartient, et
  // les trois natures connues (nœud, flux, part) en héritent d'un seul jet.
  //
  // DEUX NOTIONS, ET ELLES NE SE CONFONDENT PAS :
  //   · `name`                  — le NOM de l'élément, la donnée du document ;
  //   · `name_label_effective`  — ce que le diagramme AFFICHE, qui peut être tout autre chose
  //                               (texte libre, étiquette, ancêtre, gabarit à jetons).
  // Renommer l'affichage n'écrit jamais le nom : c'est la règle qui tranche l'alias d'une part
  // comme le titre d'une zone de texte.

  /**
   * Nom résolu pour la langue active de l'app (repli en→fr→première dispo). Avec une seule
   * langue dans la map (cas historique), renvoie toujours cette valeur quelle que soit la langue
   * active. Le `?? {}` protège les accès pendant la chaîne `super()` du constructeur.
   */
  public get name(): string { return resolveLangMap(this._name_map ?? {}, i18next.language) }
  public set name(_: string) {
    const lang = normalizeLang(i18next.language)
    if (!this._name_map) this._name_map = {}
    // Vider le nom dans une langue alors que d'autres langues existent = SUPPRIMER cette
    // traduction (le nom retombe sur l'autre langue). Vider le nom quand c'est la seule langue =
    // nom vide (comportement historique).
    const other_langs = Object.keys(this._name_map).filter(l => l !== lang)
    if (_ === '' && other_langs.length > 0) delete this._name_map[lang]
    else this._name_map[lang] = _
    this.onNameChanged()
  }

  /**
   * Suite d'un renommage. La base n'a RIEN à faire : elle ne sait pas si l'élément se dessine, ni
   * comment. Les feuilles qui ont une conséquence à en tirer (le nœud : périmer la palette par nom
   * et redessiner son libellé) la posent ici — et non dans le setter, qui doit rester la seule
   * écriture de la map quelle que soit la nature de l'élément.
   */
  protected onNameChanged() { /* rien à redessiner au niveau de l'élément */ }

  /** Map complète { langue -> nom } (persistance / copie). */
  public get name_lang_map(): Type_LangMap { return this._name_map }
  public set name_lang_map(_: Type_LangMap) { this._name_map = _ }

  /** Le nom tel que le libellé le montre par défaut : coupé au séparateur si l'auteur en a posé un. */
  public get name_label(): string {
    const resolved_name = this.name
    if (this.name_label_separator !== '') {
      const splitted_label = resolved_name.split(this.name_label_separator)
      return (splitted_label.length > 1 && this.name_label_separator_part == 'after')
        ? splitted_label[splitted_label.length - 1]
        : splitted_label[0]
    }
    return resolved_name
  }

  // Compat historique : name_label_custom <=> source 'custom'. Conserve le comportement des
  // appelants existants (édition inline/rich text, titre…). name_label_source est un attribut
  // _storage (NAME_LABEL_CONFIG) ; l'affecter déclenche l'action drawNameLabel.
  public get name_label_custom() { return this.name_label_source === 'custom' }
  public set name_label_custom(_: boolean) { this.name_label_source = _ ? 'custom' : 'name' }

  /**
   * os#1451 — LA SOURCE DE LIBELLÉ RÉELLEMENT EN VIGUEUR, une seule énumération pour toute la
   * famille (Type_NameLabelSource).
   *
   * La base répond l'attribut commun, et c'est tout. Le point d'entrée existe pour la seule nature
   * qui a gardé une écriture à elle — le flux, dont le format enregistré dit `name_label_text_source`
   * (cf. `Class_LinkElement`) : il arbitre ici entre les deux écritures au lieu que le DESSIN le
   * fasse, ce qui laissait au flux une cascade héritée que rien ne lisait.
   */
  public get name_label_source_effective(): Type_NameLabelSource {
    return this.name_label_source
  }

  /**
   * Texte effectivement affiché par le name_label, selon la source choisie. Source unique du rendu
   * (getLabelText) et de l'init du rich text.
   */
  public get name_label_effective(): string {
    switch (this.name_label_source_effective) {
    case 'none': return ''
    case 'custom': return this.resolveCustomLabel()
    case 'tag': return this.resolveTagLabel()
    case 'ancestor': return this.resolveAncestorLabel()
    case 'template': return this.resolveTemplateLabel()
    case 'source':
    case 'target':
    case 'source_target': return this.resolveEndpointLabel(this.name_label_source_effective)
    default: return this.name_label
    }
  }

  /**
   * Texte BRUT à éditer : identique au libellé effectif pour un élément normal, mais surchargé par
   * le titre (Class_ContainerElement) pour préserver les jetons {Tag} au lieu de leur valeur
   * interpolée. Sert aux chemins d'édition (input inline, init rich text) : on édite « {Month} »,
   * pas « January ».
   */
  public get name_label_effective_editable(): string {
    // OS#1314 — un gabarit s'édite tel qu'il est écrit, jetons compris.
    if (this.name_label_source_effective === 'template') return this.name_label_template
    return this.name_label_effective
  }

  /**
   * Source 'custom' : le texte libre du libellé, celui qu'on écrit sans renommer l'élément. La
   * base répond l'attribut commun `name_label_text` ; le FLUX le surcharge, car son texte à lui est
   * porté par sa valeur (`text_value`, un texte par combinaison d'étiquettes de données).
   */
  protected resolveCustomLabel(): string {
    return this.name_label_text
  }

  /**
   * os#1451 — sources 'source' / 'target' / 'source_target' : le libellé affiché des EXTRÉMITÉS.
   * Elles ne veulent dire quelque chose que pour un élément qui a deux bouts — le flux les
   * surcharge. Pour les autres, le repli est le nom, comme pour 'tag' et 'ancestor' ci-dessous.
   */
  protected resolveEndpointLabel(_which: 'source' | 'target' | 'source_target'): string {
    return this.name_label
  }

  // Sources 'tag' et 'ancestor' : elles demandent des ÉTIQUETTES ASSIGNÉES et des DIMENSIONS, que
  // seul `Class_NodeElement` possède — il les surcharge. La base en donne une version neutre qui
  // retombe sur le nom, car un flux, une part, une zone de texte ou un cadre n'ont ni l'une ni
  // l'autre : le repli est une réponse, pas un manque.
  protected resolveTagLabel(): string {
    return this.name_label
  }

  protected resolveAncestorLabel(): string {
    return this.name_label
  }

  // OS#1314 — source 'template' : gabarit à jetons interpolé au dessin. La base ne connaît que les
  // jetons universels ({Name} + valeur sélectionnée des groupes de data/view tags, comme le titre) ;
  // Class_NodeElement enrichit avec les valeurs, le bilan et les tags assignés.
  protected resolveTemplateLabel(): string {
    return applyTemplate(this.name_label_template, token => this.resolveTemplateToken(token))
  }

  /**
   * Résolution d'UN jeton. Renvoie null pour un jeton inconnu (laissé tel quel dans le texte).
   * Surchargé par les sous-classes, qui délèguent ici pour les jetons universels.
   */
  protected resolveTemplateToken(token: string): string | null {
    if (token === 'Name') return this.name_label
    return resolveTagGroupToken(
      token,
      this.sankey.data_taggs_list,
      this.sankey.view_taggs_list
    )
  }

  public getShapeColorToUse() {
    return this.shape_color
  }

  // os#1340 — verrouillage : lit l'attribut de style `shape_is_locked` (défaut false).
  public override get is_locked(): boolean { return this.shape_is_locked === true }
}

export abstract class Class_LinkAttribute extends Class_BaseShape {
  constructor(
    id: string,
    drawing_area: Class_DrawingArea,
    svg_parent_group: string,
    default_style: Class_ElementStyle
  ) {
    super(
      id, drawing_area, svg_parent_group,
      default_style,
    )
  }

  // Setters personnalisés pour la logique complexe
  private customShapeOrientation(value: Type_OrientationSetting) {
    if ((!this.shape_is_recycling) && (
      ((this.shape_orientation === 'vh') || (this.shape_orientation === 'hv')) &&
      ((value === 'hh') || (value === 'vv'))
    )) {
      if (this.shape_starting_curve !== undefined) this.attributes.shape_starting_curve = this.shape_starting_curve / 2
      if (this.shape_ending_curve !== undefined) this.attributes.shape_ending_curve = this.shape_ending_curve / 2
    }
    this.attributes.shape_orientation = value
    this.updateLinkAndSourceTarget()
  }

  private customStartingCurve(value: number) {
    if (value !== undefined && value >= 0) {
      if (!this.shape_is_recycling) {
        if ((this.shape_orientation === 'vh') || (this.shape_orientation === 'hv')) {
          this.attributes.shape_starting_curve = value <= 1.0 ? value : 1.0
        } else {
          const endingCurve = this.shape_ending_curve ?? this._config.shape_ending_curve.default
          this.attributes.shape_starting_curve = (value + endingCurve) <= 1.0 ? value : 1.0 - endingCurve
        }
      } else {
        this.attributes.shape_starting_curve = value
      }
    } else {
      this.attributes.shape_starting_curve = value
    }
  }

  private customEndingCurve(value: number) {
    if (value !== undefined && value >= 0) {
      if (!this.shape_is_recycling) {
        if ((this.shape_orientation === 'vh') || (this.shape_orientation === 'hv')) {
          this.attributes.shape_ending_curve = value <= 1.0 ? value : 1.0
        } else {
          const startingCurve = this.shape_starting_curve ?? this._config.shape_starting_curve.default
          this.attributes.shape_ending_curve = (value + startingCurve) <= 1.0 ? value : 1.0 - startingCurve
        }
      } else {
        this.attributes.shape_ending_curve = value
      }
    } else {
      this.attributes.shape_ending_curve = value
    }
  }

  private customStartingTangeant(value: number) {
    this.attributes['shape_starting_tangeant'] = (value !== undefined && value > 0) ? value : value

  }

  private customEndingTangeant(value: number) {
    this.attributes['shape_ending_tangeant'] = (value !== undefined && value > 0) ? value : value

  }

  private customShapeIsRecycling(value: boolean) {
    const was_recycling = this.attributes.shape_is_recycling ?? false
    // Flip the flag first so any draw triggered by the outer dynamic-setter
    // actions (drawWithNodes, drawElements, drawControlPoint — see
    // is_recycling.actions) reads the new state. fromJSON writes directly
    // into `attributes` and never reaches this setter, so user-saved
    // tangent values are preserved on load.
    this.attributes.shape_is_recycling = value
    // Transition false → true: collapse Bézier tangent handles to 1% so the
    // recycling loop is tight. The 25% default (= shape_*_tangeant default)
    // would balloon the loop out.
    if (value && !was_recycling) {
      this.attributes.shape_starting_tangeant = 0.01
      this.attributes.shape_ending_tangeant = 0.01
    }
    // Transition true → false: restore tangent handles to their default so
    // the normal Bézier renders with its usual curvature. Without this the
    // tangents stay at 1%, producing a near-degenerate path whose control
    // points sit on top of the endpoints (issue #140). Direct attribute
    // writes — the per-attribute draw actions would fire mid-transition;
    // the link path is redrawn cleanly by the outer is_recycling actions.
    else if (!value && was_recycling) {
      this.attributes.shape_starting_tangeant = this._config.shape_starting_tangeant.default
      this.attributes.shape_ending_tangeant = this._config.shape_ending_tangeant.default
      // Recycling mode lifts the per-axis curve clamp; bring each curve
      // back to at most 25% so a normal flow doesn't render with the
      // wide curves that only make sense for a recycling loop.
      this.attributes.shape_starting_curve = Math.min(
        this.shape_starting_curve ?? this._config.shape_starting_curve.default,
        0.25
      )
      this.attributes.shape_ending_curve = Math.min(
        this.shape_ending_curve ?? this._config.shape_ending_curve.default,
        0.25
      )
    }
  }


  // Méthodes abstraites
  // protected update() { }
  protected updateLinkAndSourceTarget() { }
}

// Type helper pour extraire le type de valeur d'un AttributeConfig
export type ExtractAttributeValue<T> = T extends AttributeConfig<infer U> ? U : never

// Type pour le storage basé sur CONFIG
export type StorageType<CONFIG extends Record<string, AttributeConfig<unknown>>> = {
  -readonly [K in keyof CONFIG]?: ExtractAttributeValue<CONFIG[K]>
}
export class Class_ElementStyle {
  shape_visible!: ShapeAttributeTypes['visible']
  shape_type!: ShapeAttributeTypes['type']
  shape_min_width!: ShapeAttributeTypes['min_width'] //only nodes
  shape_min_height!: ShapeAttributeTypes['min_height'] //only nodes
  shape_color_visible!: ShapeAttributeTypes['color_visible']
  shape_color!: ShapeAttributeTypes['color']
  shape_opacity!: ShapeAttributeTypes['opacity']
  shape_color_sustainable!: ShapeAttributeTypes['color_sustainable']

  // =================== BORDER ATTRIBUTES (border_*) ===================
  shape_border_visible!: ShapeAttributeTypes['border_visible']
  shape_border_color!: ShapeAttributeTypes['border_color']
  shape_border_thickness!: ShapeAttributeTypes['border_thickness']
  shape_border_dashed!: ShapeAttributeTypes['border_dashed']
  shape_border_radius!: ShapeAttributeTypes['border_radius']

  // =================== SHADOW ATTRIBUTES (shadow_*) ===================
  shape_shadow_visible!: ShapeAttributeTypes['shadow_visible']

  // =================== NAME LABEL ATTRIBUTES (name_label_*) ===================
  // Visibility & Font
  name_label_has_fo!: NameLabelAttributeTypes['has_fo']
  name_label_fo_content!: NameLabelAttributeTypes['fo_content']

  name_label_is_visible!: NameLabelAttributeTypes['is_visible']
  name_label_font_family!: NameLabelAttributeTypes['font_family']
  name_label_font_size!: NameLabelAttributeTypes['font_size']
  name_label_uppercase!: NameLabelAttributeTypes['uppercase']
  name_label_bold!: NameLabelAttributeTypes['bold']
  name_label_italic!: NameLabelAttributeTypes['italic']
  name_label_color!: NameLabelAttributeTypes['color']
  // Separator
  name_label_separator!: NameLabelAttributeTypes['separator']
  name_label_separator_part!: NameLabelAttributeTypes['separator_part']
  // Contenu du label (cf. Type_NameLabelSource) — désormais portés par le style.
  name_label_source!: NameLabelAttributeTypes['source']
  name_label_text!: NameLabelAttributeTypes['text']
  name_label_template!: NameLabelAttributeTypes['template']
  name_label_tag_group_id!: NameLabelAttributeTypes['tag_group_id']
  name_label_dimension_id!: NameLabelAttributeTypes['dimension_id']

  // Position
  name_label_horiz!: NameLabelAttributeTypes['horiz']
  name_label_vert!: NameLabelAttributeTypes['vert']
  name_label_horiz_shift!: NameLabelAttributeTypes['horiz_shift']
  name_label_vert_shift!: NameLabelAttributeTypes['vert_shift']
  name_label_box_width!: NameLabelAttributeTypes['box_width'] // same as name_label_background_min_width ?
  name_label_vertical_text!: NameLabelAttributeTypes['vertical_text']
  name_label_text_angle!: NameLabelAttributeTypes['text_angle']
  name_label_position_x!: NameLabelAttributeTypes['position_x']
  name_label_position_y!: NameLabelAttributeTypes['position_y']
  name_label_position_offset!: NameLabelAttributeTypes['position_offset']
  name_label_position_absolute!: NameLabelAttributeTypes['position_absolute']
  name_label_text_align!: NameLabelAttributeTypes['text_align']
  name_label_inside_horiz!: NameLabelAttributeTypes['inside_horiz']
  name_label_inside_vert!: NameLabelAttributeTypes['inside_vert']
  // Background
  name_label_background_visible!: NameLabelAttributeTypes['background_visible']
  name_label_background_color!: NameLabelAttributeTypes['background_color']
  name_label_background_opacity!: NameLabelAttributeTypes['background_opacity']
  name_label_background_type!: NameLabelAttributeTypes['background_type']
  name_label_background_min_width!: NameLabelAttributeTypes['background_min_width']
  name_label_background_min_height!: NameLabelAttributeTypes['background_min_height']
  name_label_background_color_visible!: NameLabelAttributeTypes['background_color_visible']
  name_label_background_color_sustainable!: NameLabelAttributeTypes['background_color_sustainable']
  name_label_background_border_visible!: NameLabelAttributeTypes['background_border_visible']
  name_label_background_border_color!: NameLabelAttributeTypes['background_border_color']
  name_label_background_border_thickness!: NameLabelAttributeTypes['background_border_thickness']
  name_label_background_border_dashed!: NameLabelAttributeTypes['background_border_dashed']
  name_label_background_border_radius!: NameLabelAttributeTypes['background_border_radius']


  // =================== VALUE LABEL ATTRIBUTES (value_label_*) ===================
  // Visibility & Font
  value_label_has_fo!: ValueLabelAttributeTypes['has_fo']
  value_label_fo_content!: ValueLabelAttributeTypes['fo_content']

  value_label_is_visible!: ValueLabelAttributeTypes['is_visible']
  value_label_font_family!: ValueLabelAttributeTypes['font_family']
  value_label_font_size!: ValueLabelAttributeTypes['font_size']
  value_label_uppercase!: ValueLabelAttributeTypes['uppercase']
  value_label_bold!: ValueLabelAttributeTypes['bold']
  value_label_italic!: ValueLabelAttributeTypes['italic']
  value_label_color!: ValueLabelAttributeTypes['color']

  // Position
  value_label_horiz!: ValueLabelAttributeTypes['horiz']
  value_label_vert!: ValueLabelAttributeTypes['vert']
  value_label_horiz_shift!: ValueLabelAttributeTypes['horiz_shift']
  value_label_vert_shift!: ValueLabelAttributeTypes['vert_shift']
  value_label_box_width!: ValueLabelAttributeTypes['box_width']
  value_label_vertical_text!: ValueLabelAttributeTypes['vertical_text']
  value_label_text_angle!: ValueLabelAttributeTypes['text_angle']
  value_label_position_x!: ValueLabelAttributeTypes['position_x']
  value_label_position_y!: ValueLabelAttributeTypes['position_y']
  value_label_position_offset!: ValueLabelAttributeTypes['position_offset']
  value_label_position_absolute!: ValueLabelAttributeTypes['position_absolute']
  value_label_text_align!: ValueLabelAttributeTypes['text_align']
  value_label_inside_horiz!: ValueLabelAttributeTypes['inside_horiz']
  value_label_inside_vert!: ValueLabelAttributeTypes['inside_vert']

  // Background
  value_label_background_visible!: ValueLabelAttributeTypes['background_visible']
  value_label_background_color!: ValueLabelAttributeTypes['background_color']
  value_label_background_opacity!: ValueLabelAttributeTypes['background_opacity']
  value_label_background_type!: ValueLabelAttributeTypes['background_type']
  value_label_background_min_width!: ValueLabelAttributeTypes['background_min_width']
  value_label_background_min_height!: ValueLabelAttributeTypes['background_min_height']
  value_label_background_color_visible!: ValueLabelAttributeTypes['background_color_visible']
  value_label_background_color_sustainable!: ValueLabelAttributeTypes['background_color_sustainable']
  value_label_background_border_visible!: ValueLabelAttributeTypes['background_border_visible']
  value_label_background_border_color!: ValueLabelAttributeTypes['background_border_color']
  value_label_background_border_thickness!: ValueLabelAttributeTypes['background_border_thickness']
  value_label_background_border_dashed!: ValueLabelAttributeTypes['background_border_dashed']
  value_label_background_border_radius!: ValueLabelAttributeTypes['background_border_radius']

  // Formatting
  value_label_scientific_notation!: ValueLabelAttributeTypes['scientific_notation']
  value_label_significant_digits!: ValueLabelAttributeTypes['significant_digits']
  value_label_nb_significant_digits!: ValueLabelAttributeTypes['nb_significant_digits']
  value_label_custom_digit!: ValueLabelAttributeTypes['custom_digit']
  value_label_nb_digit!: ValueLabelAttributeTypes['nb_digit']
  value_label_in_out_display_mode!: ValueLabelAttributeTypes['in_out_display_mode']

  // Units
  value_label_unit_visible!: ValueLabelAttributeTypes['unit_visible']
  value_label_unit_type!: ValueLabelAttributeTypes['unit_type']
  value_label_unit!: ValueLabelAttributeTypes['unit']
  value_label_unit_factor!: ValueLabelAttributeTypes['unit_factor']

  // =================== ICON ATTRIBUTES (icon_*) ===================
  icon_color!: IconLabelAttributeTypes['color']
  icon_is_visible!: IconLabelAttributeTypes['is_visible']
  icon_icon_name!: IconLabelAttributeTypes['icon_name']
  icon_view_box!: IconLabelAttributeTypes['view_box']
  icon_color_sustainable!: IconLabelAttributeTypes['color_sustainable']
  icon_horiz!: IconLabelAttributeTypes['horiz']
  icon_vert!: IconLabelAttributeTypes['vert']
  icon_horiz_shift!: IconLabelAttributeTypes['horiz_shift']
  icon_vert_shift!: IconLabelAttributeTypes['vert_shift']
  icon_inside_horiz!: IconLabelAttributeTypes['inside_horiz']
  icon_inside_vert!: IconLabelAttributeTypes['inside_vert']

  icon_is_image!: IconLabelAttributeTypes['is_image']
  icon_image_src!: IconLabelAttributeTypes['image_src']

  // =================== HYPERLINK ATTRIBUTES ===================
  hyperlink!: string | undefined

  shape_local_link_scale!: LinkShapeSpecificValues['local_link_scale']
  shape_is_curved!: LinkShapeSpecificValues['is_curved']
  shape_curvature!: LinkShapeSpecificValues['curvature']
  shape_is_recycling!: LinkShapeSpecificValues['is_recycling']
  shape_is_recycling_locked!: LinkShapeSpecificValues['is_recycling_locked']
  shape_is_structure!: LinkShapeSpecificValues['is_structure']
  shape_must_stay_straight!: LinkShapeSpecificValues['must_stay_straight']
  shape_straight_include_children!: LinkShapeSpecificValues['straight_include_children']
  shape_straight_mode!: LinkShapeSpecificValues['straight_mode']
  shape_straight_offset!: LinkShapeSpecificValues['straight_offset']
  shape_is_reference_flux!: LinkShapeSpecificValues['is_reference_flux']
  shape_show_as_path_locked!: LinkShapeSpecificValues['show_as_path_locked']
  shape_orientation!: LinkShapeSpecificValues['orientation']
  shape_starting_curve!: LinkShapeSpecificValues['starting_curve']
  shape_ending_curve!: LinkShapeSpecificValues['ending_curve']
  shape_starting_tangeant!: LinkShapeSpecificValues['starting_tangeant']
  shape_ending_tangeant!: LinkShapeSpecificValues['ending_tangeant']
  shape_middle_recycling!: LinkShapeSpecificValues['middle_recycling']
  shape_waypoints!: LinkShapeSpecificValues['waypoints']
  shape_source_anchor_offset!: LinkShapeSpecificValues['source_anchor_offset']
  shape_target_anchor_offset!: LinkShapeSpecificValues['target_anchor_offset']
  shape_is_arrow!: LinkShapeSpecificValues['is_arrow']
  shape_arrow_at_source!: LinkShapeSpecificValues['arrow_at_source']
  shape_arrow_size!: LinkShapeSpecificValues['arrow_size']
  shape_arrow_size_ratio!: LinkShapeSpecificValues['arrow_size_ratio']
  shape_arrow_standalone!: LinkShapeSpecificValues['arrow_standalone']
  shape_arrow_min_width!: LinkShapeSpecificValues['arrow_min_width']
  shape_structure_force_min!: LinkShapeSpecificValues['structure_force_min']
  shape_uncertainty_display!: LinkShapeSpecificValues['uncertainty_display']
  shape_source_notch!: LinkShapeSpecificValues['source_notch']
  shape_source_notch_size!: LinkShapeSpecificValues['source_notch_size']
  shape_source_notch_size_ratio!: LinkShapeSpecificValues['source_notch_size_ratio']
  shape_is_dashed!: LinkShapeSpecificValues['is_dashed']
  shape_color_rule!: LinkShapeSpecificValues['color_rule']
  shape_visible_when_zero!: LinkShapeSpecificValues['visible_when_zero']
  shape_link_caps!: LinkShapeSpecificValues['link_caps']

  value_label_on_path!: LinkLabelSpecificValues['on_path']
  value_label_pos_auto!: LinkLabelSpecificValues['pos_auto']
  value_label_text_source!: LinkLabelSpecificValues['text_source']

  name_label_on_path!: LinkLabelSpecificValues['on_path']
  name_label_pos_auto!: LinkLabelSpecificValues['pos_auto']
  name_label_text_source!: LinkLabelSpecificValues['text_source']
  name_label_flux_tag_group_id!: LinkLabelSpecificValues['flux_tag_group_id']

  // =================== STOCK LABEL ATTRIBUTES (stock_label_*) ===================
  stock_label_is_visible!: StockLabelAttributeTypes['is_visible']
  stock_label_font_size!: StockLabelAttributeTypes['font_size']
  stock_label_color!: StockLabelAttributeTypes['color']
  stock_label_bold!: StockLabelAttributeTypes['bold']
  stock_label_italic!: StockLabelAttributeTypes['italic']
  stock_label_uppercase!: StockLabelAttributeTypes['uppercase']
  stock_label_horiz!: StockLabelAttributeTypes['horiz']
  stock_label_vert!: StockLabelAttributeTypes['vert']
  stock_label_inside_horiz!: StockLabelAttributeTypes['inside_horiz']
  stock_label_inside_vert!: StockLabelAttributeTypes['inside_vert']
  stock_label_background_color!: StockLabelAttributeTypes['background_color']
  stock_label_background_border_color!: StockLabelAttributeTypes['background_border_color']

  shape_orphan_node_visible!: boolean
  shape_position_type!: NodeShapeSpecificAttributeTypes['position_type']
  shape_position_dx!: NodeShapeSpecificAttributeTypes['position_dx']
  shape_position_dy!: NodeShapeSpecificAttributeTypes['position_dy']
  shape_anchor_align_vertical!: NodeShapeSpecificAttributeTypes['anchor_align_vertical']
  shape_anchor_align_horizontal!: NodeShapeSpecificAttributeTypes['anchor_align_horizontal']
  shape_io_reorg_mode!: NodeShapeSpecificAttributeTypes['io_reorg_mode']
  shape_anchor_mode!: NodeShapeSpecificAttributeTypes['anchor_mode']
  shape_link_inset!: NodeShapeSpecificAttributeTypes['link_inset']
  shape_hatch!: NodeShapeSpecificAttributeTypes['hatch']
  shape_is_reference_stock!: NodeShapeSpecificAttributeTypes['is_reference_stock']
  shape_line_flip!: NodeShapeSpecificAttributeTypes['line_flip']
  shape_line_x1!: NodeShapeSpecificAttributeTypes['line_x1']
  shape_line_y1!: NodeShapeSpecificAttributeTypes['line_y1']
  shape_line_x2!: NodeShapeSpecificAttributeTypes['line_x2']
  shape_line_y2!: NodeShapeSpecificAttributeTypes['line_y2']
  shape_position_u_locked!: boolean
  shape_position_v_locked!: boolean
  // os#1340 — verrouillage : ni sélectionnable ni déplaçable (cf. get is_locked).
  shape_is_locked!: boolean
  shape_margin_bottom!: ShapeAttributeTypes['margin_bottom']
  shape_margin_top!: ShapeAttributeTypes['margin_top']
  shape_margin_left!: ShapeAttributeTypes['margin_left']
  shape_margin_right!: ShapeAttributeTypes['margin_right']

  private _storage: Record<string, unknown> = {}
  private _config: Record<string, AttributeConfig<unknown>>
  private _id: string
  private _name: string
  private _references: { [_: string]: Class_BaseElement } = {}

  private _default_style: Class_ElementStyle | undefined
  private _drawing_area: Class_DrawingArea | undefined

  // os#1418 — `default_style` et `drawing_area` sont OPTIONNELS : un style de FIGURE (cf.
  // Representations/Figure) n'a pas de zone de dessin, et le style `default` d'une nature n'a
  // pas de style parent — exactement comme le `default` du diagramme, construit avant que
  // `Class_Sankey.default_style` existe. Rien ne change pour les appelants qui les passent.
  constructor(
    config: Record<string, AttributeConfig<unknown>>,
    id: string,
    name: string,
    is_deletable: boolean,
    default_style?: Class_ElementStyle,
    drawing_area?: Class_DrawingArea
  ) {
    this._config = config
    this._id = id
    this._name = name
    this._default_style = default_style
    this._drawing_area = drawing_area

    if (!is_deletable) {
      Object.entries(this._config).forEach(([key, config]) => {
        this._storage[key] = config.default
      })
    }
    this.createDynamicProperties()
  }
  public getElementProperty(k: keyof ConfigType) {
    if (this._storage[k] !== undefined) {
      return this._storage[k]
    }
    return undefined
  }
  protected createDynamicProperties() {
    (Object.keys(this._config) as Array<keyof ConfigType>).forEach(key => {
      Object.defineProperty(this, key, {
        get: () => this.getElementProperty(key as keyof ConfigType),
        set: (value: ExtractAttributeValue<ConfigType[typeof key]>) => {
          this._storage[key] = value
          Object.values(this._references).forEach(ref => ref.draw())
          // SA#541 — les éléments qui reçoivent ce style par une étiquette n'en sont pas des
          // références : sans cette ligne, éditer le style ne les redessinerait pas.
          this._drawing_area?.sankey?.redrawTagStyleCarriers(this)
        },
        enumerable: true,
        configurable: true
      })
    })
  }

  public deleteAttribute(key: string): void {
    delete this._storage[key]
  }

  public copyFrom(element: Class_ElementStyle) {
    // Remise à zéro avant copie, comme copyAttrFrom pour les éléments : un style
    // « hérité » doit devenir identique à sa source, sinon les clés posées dans la
    // vue mais absentes du maître survivaient au ré-héritage (incohérence styles vs
    // éléments). Seule la branche styleDA « update » de updateFrom est concernée
    // (les autres appelants copient sur un style fraîchement créé, donc déjà vide).
    this._storage = {}
    Object.keys(element._storage).forEach(key => {
      this._storage[key] = element._storage[key]
    })
  }

  /** Vrai pour le style 'default' (socle sans style parent). Sert à la persistance :
   * le 'default' ne sauve que ce qui diffère du défaut usine, les autres styles sauvent
   * toute valeur explicitement stockée (cf. StylePersistence.toJSON). */
  public get is_default_style(): boolean { return !this._default_style }

  /** Un attribut est-il explicitement porté par CE style (présent dans son storage) ?
   * Les styles non-'default' ne sont pas pré-remplis : leur storage ne contient que les
   * valeurs de seed + chargées + posées par l'utilisateur, donc « explicites ». */
  public isAttributeExplicit(attr: keyof ConfigType): boolean {
    return this._storage[attr] !== undefined
  }


  public isAttributeOverloaded(
    attr: keyof ConfigType
  ) {
    if (!this._default_style ) {
      return this._storage[attr] !== undefined && this._storage[attr] !== this._config[attr]?.default
    }
    // Style non-défaut : surchargé = stocké ET différent de la valeur du style par défaut
    const default_value = this._default_style.getElementProperty(attr) ?? this._config[attr]?.default
    return this._storage[attr] !== undefined && this._storage[attr] !== default_value
  }

  public delete() {
    // if (this._is_deletable) {
    //   //Object.values(this._references).forEach(ref => ref.useDefaultStyle())
    this._references = {}
    // }
  }

  public addReference(ref: Class_BaseElement) {
    if (!this._references[ref.id]) {
      this._references[ref.id] = ref
    }
  }

  public removeReference(ref: Class_BaseElement) {
    if (this._references[ref.id] !== undefined) {
      delete this._references[ref.id]
    }
  }

  /** SA#541 — nombre d'éléments qui portent ce style dans leur PROPRE liste de styles. */
  public get reference_count(): number { return Object.keys(this._references).length }
  public get attributes() { return this._storage }
  public set attributes(value: Record<string, unknown>) {
    this._storage = value
    this.redrawReferences()
  }

  /** Redessine tous les éléments qui référencent ce style. */
  public redrawReferences() {
    Object.values(this._references).forEach(ref => ref.draw())
    // SA#541 — idem pour les porteurs d'étiquettes qui imposent ce style
    this._drawing_area?.sankey?.redrawTagStyleCarriers(this)
  }

  /**
   * Enlève toutes les surcharges du style par rapport au style par défaut
   * (réhéritage). Reconstruit un nouveau _storage pour ne pas muter un éventuel
   * snapshot d'undo. Sur le style par défaut, isAttributeOverloaded est faux
   * partout (valeurs == défaut) donc aucun attribut n'est retiré.
   */
  public resetOverloadedAttributes() {
    const new_storage: Record<string, unknown> = {}
    Object.keys(this._storage).forEach(key => {
      if (!this.isAttributeOverloaded(key as keyof ConfigType)) {
        new_storage[key] = this._storage[key]
      }
    })
    this._storage = new_storage
    this.redrawReferences()
  }

  public get id() { return this._id }
  public get name() { return this._name }
  public set name(value: string) { this._name = value }

  // Typé plein pour les appelants du diagramme : un style de FIGURE (Representations/Figure)
  // n'a pas de zone de dessin, mais personne ne la lui demande.
  public get drawing_area(): Class_DrawingArea { return this._drawing_area as Class_DrawingArea }
}