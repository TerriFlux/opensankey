// DrawLabelBase.ts - Classe de base commune pour tous les labels

import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import {
  BASE_SHAPE_CONFIG, getLinkLabelSpecificValue,
  getNameLabelValues, getShapeValue,
  getValueLabelValues, LinkLabelSpecificValues,
  NameLabelAttributeTypes,
  ShapePrefix,
  ValueLabelAttributeTypes
} from './ElementsAttributesConfig'
import { Class_Handler } from './Handler'
import {
  Type_PathLabelHPosition
} from './ElementsAttributesConfig'
import { Class_NodeBase, default_selected_stroke_width } from './NodeBase'
import { Class_NodeElement } from './Node'
import { Class_LinkElement } from './Link'
import { LinkControlPoints } from './LinkControlPoints'
import { Class_BaseShape } from './Element'


type DisplayPrefix = 'name' | 'value'
type LabelPrefix = 'name_label' | 'value_label' | 'icon'

type d3_selection_type = d3.Selection<SVGGElement, unknown, SVGGElement, unknown>

let _measureCanvasCtx: CanvasRenderingContext2D | null = null
function getMeasureContext(): CanvasRenderingContext2D | null {
  if (_measureCanvasCtx) return _measureCanvasCtx
  if (typeof document === 'undefined') return null
  _measureCanvasCtx = document.createElement('canvas').getContext('2d')
  return _measureCanvasCtx
}

// Construit la chaîne `font` canvas (style/poids/famille du <text>) avec une
// taille de police imposée (px). Sert à mesurer la césure en espace écran
// (issue #165) : la font effectivement rendue est compensée du zoom
// (font_size / zoom), valeur qui peut dépasser la limite de taille de
// canvas.measureText et fausser la mesure. On mesure donc avec la font_size
// brute (écran) ; le ratio glyphe/boîte étant identique à l'espace local, les
// points de césure sont les mêmes.
function getCanvasFontStringAtSize(
  textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>,
  fontSizePx: number
): string {
  const node = textElement.node()
  if (!node || typeof window === 'undefined') return `${fontSizePx}px sans-serif`
  const computed = window.getComputedStyle(node)
  return `${computed.fontStyle || 'normal'} ${computed.fontWeight || 'normal'} ${fontSizePx}px ${computed.fontFamily || 'sans-serif'}`
}

// Insert spaces inside words that exceed maxWidth, with a trailing hyphen at each
// break point so d3-textwrap can wrap the resulting sub-words onto separate lines.
export function breakLongWords(text: string, maxWidth: number, font: string): string {
  if (!text || maxWidth <= 0) return text
  const ctx = getMeasureContext()
  if (!ctx) return text
  ctx.font = font
  const hyphenWidth = ctx.measureText('-').width
  const usableWidth = Math.max(maxWidth - hyphenWidth, hyphenWidth * 2)
  return text.split(/(\s+)/).map(token => {
    if (token === '' || /^\s+$/.test(token)) return token
    if (ctx.measureText(token).width <= maxWidth) return token
    const parts: string[] = []
    let current = ''
    for (const ch of Array.from(token)) {
      const next = current + ch
      if (ctx.measureText(next).width > usableWidth && current.length > 0) {
        parts.push(current + '-')
        current = ch
      } else {
        current = next
      }
    }
    if (current) parts.push(current)
    return parts.join(' ')
  }).join('')
}

/**
 * BBox d'un élément SVG dans le repère de son parent, en tenant compte de SA
 * PROPRE transform (rotation de verticalText, etc.) — `getBBox()` seul l'ignore.
 */
function getTransformedBBox(
  node: SVGGraphicsElement
): { x: number, y: number, width: number, height: number } {
  const b = node.getBBox()
  const t = node.transform.baseVal.consolidate()
  if (!t) return { x: b.x, y: b.y, width: b.width, height: b.height }
  const m = t.matrix
  const corners = [
    [b.x, b.y],
    [b.x + b.width, b.y],
    [b.x, b.y + b.height],
    [b.x + b.width, b.y + b.height]
  ].map(([x, y]) => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }))
  const xs = corners.map(c => c.x)
  const ys = corners.map(c => c.y)
  const x_min = Math.min(...xs)
  const y_min = Math.min(...ys)
  return { x: x_min, y: y_min, width: Math.max(...xs) - x_min, height: Math.max(...ys) - y_min }
}

/**
 * Class_Handler pour les poignées de redimensionnement de label.
 *
 * Diffère du Class_Handler standard : la visibilité ne dépend PAS de
 * `_ref_element.is_selected`. La sub-sélection du label (clic sur son <text>)
 * suffit à afficher les poignées ; sinon, cliquer sur le label seul (qui
 * stopPropagation pour ne pas toggler la sélection de la forme) laisserait
 * `is_selected = false` et `draw()` resterait no-op.
 *
 * Le filtrage selected_label_prefix === this.prefix est fait en amont par
 * `_shouldShowResizeHandles` (qui appelle unDraw si non remplie), donc ici
 * on garde juste `_is_visible && ref_element.is_visible`.
 */
class Class_LabelResizeHandler extends Class_Handler {
  public override get is_visible(): boolean {
    return this._is_visible && this.ref_element.is_visible
  }
}

/**
 * Classe de base abstraite pour tous les labels (nodes et links)
 */
export abstract class DrawLabelBase {
  protected _element: Class_BaseShape
  protected readonly prefix: LabelPrefix
  protected _label_values!: NameLabelAttributeTypes | ValueLabelAttributeTypes

  // Flags de configuration
  protected enableEditing: boolean = false
  // Quand vrai, drawGenericLabel dessine la structure éditable (texte + input)
  // même si le label est vide / sous le seuil — nécessaire pour éditer la valeur
  // d'un flux encore en pointillé (sans valeur), qui n'a normalement aucun label.
  protected _force_editable_draw: boolean = false

  public d3_selection: d3_selection_type | null = null

  // Poignées de redimensionnement de la "boîte" du label (label.box_width).
  // Implémentées avec Class_Handler (mêmes infrastructure / parent / drag que
  // les poignées de redimensionnement des nœuds : `g_handlers` au top-level,
  // coords absolues dans le repère `g_drawing`, taille divisée par le zoom).
  // Créées paresseusement à la première sub-sélection du label.
  private _resize_handle_left: Class_Handler | null = null
  private _resize_handle_right: Class_Handler | null = null
  private _resize_drag_state: {
    initial_width: number
    prev_suspend: boolean
    accumulated_dx: number
  } = { initial_width: 0, prev_suspend: false, accumulated_dx: 0 }

  protected abstract createLabelGroup(): d3_selection_type | null

  constructor(element: Class_BaseShape, prefix: LabelPrefix) {
    this._element = element
    this.prefix = prefix
  }

  // =================== MÉTHODES ABSTRAITES ===================

  protected abstract getLabelText(): string | number
  protected abstract shouldDrawLabel(): boolean
  protected abstract getIconSize(): [number, number]
  protected abstract getLabelPos(): [number, number, string, string?]
  protected abstract updateLabelPos(): void
  protected abstract applyTextStyle(selection: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown> | undefined): void
  protected abstract getD3Selection(): d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null | undefined
  protected abstract getElementId(): string

  // Callbacks
  protected onInputChange?(value: string): void

  // =================== MÉTHODES COMMUNES ===================

  protected getTextSelector(): string {
    return `.${this.prefix}_text`
  }

  /**
   * Returns the label's font-size compensated for the drawing area's live zoom
   * (issue #165, mode « police verrouillée »). Labels live in the local
   * coordinate system that d3-zoom scales by k ; without compensation a 20px
   * font renders as 20*k screen px — invisible when k ≈ 1e-4 (large Sankey
   * scale) or varying with every wheel zoom. En mode verrouillé, on multiplie
   * par font_compensation (= 1/k live) pour annuler le scale SVG : la taille
   * écran reste égale à _label_values.font_size quel que soit le zoom. En mode
   * déverrouillé, font_compensation vaut 1 (police native qui scale avec le
   * zoom). Toute la logique de positionnement dérivée de font_size (line height,
   * offsets multi-ligne, boîte d'édition) doit passer par ce getter.
   */
  protected getEffectiveFontSize(): number {
    const raw = this._label_values.font_size
    const comp = this._element.drawing_area?.font_compensation ?? 1
    return raw * comp
  }

  /**
   * Issue #1232 — transform de placement d'un foreignObject rich text :
   * translate au coin haut-gauche local + scale(comp) pour annuler le zoom en
   * mode police verrouillée. comp === 1 (mode déverrouillé) → translate seul,
   * rendu strictement identique au comportement historique. Partagé entre
   * drawFO (pose initiale) et updateGenericPosition (drag) pour rester cohérent.
   */
  protected foScaleTransform(x: number, y: number, comp: number): string {
    return comp !== 1 ? `translate(${x}, ${y}) scale(${comp})` : `translate(${x}, ${y})`
  }

  // =================== STICK TO LABEL (valeur collée au libellé) ===================
  // Sélecteurs des <text> nom/valeur — surchargés côté liens (classes link_*).
  protected getStickNameTextSelector(): string {
    return '.name_label_text'
  }
  protected getStickValueTextSelector(): string {
    return '.value_label_text'
  }

  /**
   * ✅ Dessine un background générique (texte, icône, FO)
   */
  protected drawGenericBackground(
    parent: d3_selection_type,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: {
      bgPrefix?: ShapePrefix
      className?: string
      anchor?: string
    }
  ) {

    const bgPrefix = options?.bgPrefix ?? `${this.prefix}_background` as ShapePrefix
    const className = options?.className ?? `${this.prefix}_background`

    parent.select(`.${className}`).remove()

    const bgValues = getShapeValue(
      this._element as unknown as Class_NodeBase | Class_LinkElement,
      bgPrefix,
      BASE_SHAPE_CONFIG
    )

    if (!bgValues.visible) return null

    // Largeur du fond :
    //   - locked   → valeur fixe pilotée par l'utilisateur (bgValues.box_width).
    //   - unlocked → s'adapte à la largeur effective du contenu (bbox du
    //     texte ou bbox combinée en mode stick). label.box_width n'est que
    //     la limite de wrap, pas la largeur visible du label.
    let bg_x = x
    let bg_width = width
    if (bgValues.width_locked) {
      bg_width = bgValues.box_width
    }
    if (options?.anchor === 'start') {
      bg_x = x
    } else if (options?.anchor === 'end') {
      bg_x = x + width - bg_width
    } else {
      bg_x = x + width / 2 - bg_width / 2
    }

    const type_to_use = bgValues.type === 'ellipse' ? 'ellipse' : (bgValues.type === 'rect' ? 'rect' : 'path')
    const bgElement = parent.append(type_to_use)
      .classed(`${this.prefix}_bg`, true)
      .classed(this.prefix, true)
      .classed(className, true)
      .attr('id', `${className}_${this.getElementId()}`)
      .attr('fill', bgValues.color_visible ? (bgValues.color_sustainable ? bgValues.color : this._element.getShapeColorToUse()) : 'none')
      .attr('fill-opacity', bgValues.opacity)
      .attr('stroke', bgValues.border_visible ? (bgValues.border_color_sustainable ? bgValues.border_color : this._element.getShapeColorToUse()) : 'none')
      .attr('stroke-width', bgValues.border_thickness)
      .attr('stroke-dasharray', bgValues.border_dashed ? '5,3' : '')

    if (bgValues.type === 'ellipse') {
      bgElement
        .attr('cx', bg_x + bg_width / 2)
        .attr('cy', y + height / 2)
        .attr('rx', bg_width / 2 + bgValues.margin_left + bgValues.margin_right)
        .attr('ry', height / 2 + bgValues.margin_top + bgValues.margin_bottom)
    } else if (bgValues.type === 'rect') {
      bgElement
        .attr('x', bg_x - bgValues.margin_left)
        .attr('y', y - bgValues.margin_top)
        .attr('width', bg_width + bgValues.margin_left + bgValues.margin_right)
        .attr('height', height + bgValues.margin_top + bgValues.margin_bottom)
        .attr('rx', bgValues.border_radius)
    }
    bgElement.lower()
    return bgElement
  }

  /**
   * Poignées de redimensionnement de la "boîte" du label (label.box_width).
   *
   * Architecture (calquée sur les poignées de redimensionnement des nœuds
   * `_drag_handler.{left,right,top,bottom}`) :
   *   - les poignées sont des `Class_Handler` instanciés dans le top-level
   *     `g_handlers` du drawing area, repère absolu = repère `g_drawing` ;
   *   - leur position est calculée en transformant le point d'ancrage du
   *     label (label_pos_x en repère local du <g> label) vers ce repère
   *     absolu via la matrice CTM relative — fonctionne uniformément pour
   *     nœuds (dont le <g> a un translate) et liens (dont le <g> n'en a pas) ;
   *   - le drag utilise `event.dx` directement (déjà en repère `g_drawing`),
   *     même unité que `box_width`. La poignée tirée suit toujours le
   *     curseur 1:1, l'autre poignée bouge selon le facteur (2 pour ancre
   *     'middle' qui est symétrique, 1 pour 'start'/'end' où seul le bord
   *     libre bouge — l'autre étant ancré, ne sera pas dessinée).
   *   - taille du carré compensée par `1/zoomScale` (héritée de Class_Handler).
   *
   * Visibilité : tied à la sub-sélection du label (`selected_label_prefix`).
   * À chaque appel, refreshLabelResizeHandles re-positionne et re-dessine
   * (ou cache) les poignées en fonction de l'état courant.
   */
  public refreshLabelResizeHandles(): void {
    if (!this._shouldShowResizeHandles()) {
      this._resize_handle_left?.unDraw()
      this._resize_handle_right?.unDraw()
      return
    }

    this._ensureResizeHandlesCreated()

    const positions = this._computeResizeHandlesAbsolutePos()
    if (!positions) {
      this._resize_handle_left?.unDraw()
      this._resize_handle_right?.unDraw()
      return
    }

    // Bord ancré (start → gauche, end → droite) : on ne dessine que le bord
    // libre, sinon la poignée ancrée ne suivrait pas le curseur (elle reste
    // sur label_pos_x) et c'est l'autre bord du label qui "fuit".
    const anchor = positions.anchor
    if (anchor === 'start') {
      this._resize_handle_left?.unDraw()
    } else {
      this._resize_handle_left!.setPosXY(positions.left[0], positions.left[1])
      this._resize_handle_left!.draw()
    }
    if (anchor === 'end') {
      this._resize_handle_right?.unDraw()
    } else {
      this._resize_handle_right!.setPosXY(positions.right[0], positions.right[1])
      this._resize_handle_right!.draw()
    }
    // Curseur ew-resize une fois le <g> draw() (chaque draw recrée le DOM).
    this._resize_handle_left?.d3_selection?.style('cursor', 'ew-resize')
    this._resize_handle_right?.d3_selection?.style('cursor', 'ew-resize')
  }

  private _shouldShowResizeHandles(): boolean {
    if (!this.d3_selection) return false
    if (!this._element.drawing_area?.editable) return false
    if ((this._element as Class_BaseShape).selected_label_prefix !== this.prefix) return false
    if (this._label_values == null) return false
    const box_width = (this._label_values as { box_width?: number }).box_width ?? 0
    return Number.isFinite(box_width) && box_width > 0
  }

  /**
   * Crée paresseusement les deux Class_Handler avec leurs callbacks de drag.
   * Les callbacks accèdent à `this.prefix`, `this._element`, etc. via closure.
   */
  private _ensureResizeHandlesCreated(): void {
    if (this._resize_handle_left && this._resize_handle_right) return

    const widthAttr = `${this.prefix}_box_width`
    const element = this._element as unknown as {
      _suspend_actions?: boolean
      drawNameLabel?: () => void
      drawValueLabel?: () => void
    }

    const fullRedraw = () => {
      if (this.prefix === 'name_label' && typeof element.drawNameLabel === 'function') {
        element.drawNameLabel()
      } else if (this.prefix === 'value_label' && typeof element.drawValueLabel === 'function') {
        element.drawValueLabel()
      } else {
        this.drawGenericLabel()
      }
    }

    const state = this._resize_drag_state

    const dragStart = () => () => {
      this._element.drawing_area.bypass_redraws = true
      state.prev_suspend = Boolean(element._suspend_actions)
      element._suspend_actions = true
      state.initial_width = Number(Reflect.get(element, widthAttr) ?? 0)
      state.accumulated_dx = 0
    }

    const dragMove = (side: 'left' | 'right') =>
      (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
        // event.dx est dans le repère `g_handlers` = repère `g_drawing` (le
        // zoom est sur `g_drawing` lui-même, donc ses descendants partagent
        // ce repère "drawing-area zoomed"). C'est exactement l'unité de
        // box_width → addition directe, pas de conversion.
        state.accumulated_dx += event.dx
        const anchor = this._currentTextAnchor()
        const factor = anchor === 'middle' ? 2 : 1
        const bw_sign = side === 'right' ? 1 : -1
        const new_box_width = Math.max(
          10,
          state.initial_width + bw_sign * state.accumulated_dx * factor
        )
        Reflect.set(element, widthAttr, new_box_width)
        // Repositionner les poignées sans redessiner le label (bypass_redraws
        // est ON). Le texte sera reflowed au redraw final dans 'end'.
        const positions = this._computeResizeHandlesAbsolutePos()
        if (positions) {
          if (anchor !== 'start')
            this._resize_handle_left?.setPosXY(positions.left[0], positions.left[1])
          if (anchor !== 'end')
            this._resize_handle_right?.setPosXY(positions.right[0], positions.right[1])
        }
      }

    const dragEnd = () => () => {
      element._suspend_actions = state.prev_suspend
      this._element.drawing_area.bypass_redraws = false
      const final_width = Number(Reflect.get(element, widthAttr))
      const initial_width = state.initial_width
      if (Math.abs(final_width - initial_width) > 0.5) {
        const inv = () => {
          Reflect.set(element, widthAttr, initial_width)
          fullRedraw()
        }
        const redo = () => {
          Reflect.set(element, widthAttr, final_width)
          fullRedraw()
        }
        this._element.drawing_area.application_data.history.saveUndo(inv)
        this._element.drawing_area.application_data.history.saveRedo(redo)
      }
      fullRedraw()
    }

    this._resize_handle_left = new Class_LabelResizeHandler(
      `label_resize_${this.prefix}_left_${this.getElementId()}`,
      this._element.drawing_area,
      this._element,
      dragStart(),
      dragMove('left'),
      dragEnd(),
      { class: 'label_resize_handle label_resize_handle_left' }
    )
    this._resize_handle_right = new Class_LabelResizeHandler(
      `label_resize_${this.prefix}_right_${this.getElementId()}`,
      this._element.drawing_area,
      this._element,
      dragStart(),
      dragMove('right'),
      dragEnd(),
      { class: 'label_resize_handle label_resize_handle_right' }
    )
  }

  private _currentTextAnchor(): string {
    const text_node = this.d3_selection?.select(this.getTextSelector()).node() as SVGTextElement | null
    return text_node?.getAttribute('text-anchor') ?? 'middle'
  }

  /**
   * Calcule la position absolue (repère `g_handlers` = `g_drawing`) des
   * deux poignées à partir de la position d'ancrage du label en repère
   * local et de la box_width courante. Utilise la matrice CTM relative
   * `g_handlers` ← `label_g` pour traverser uniformément les transforms
   * intermédiaires (translate du nœud, identité pour les liens).
   */
  private _computeResizeHandlesAbsolutePos(): {
    left: [number, number]
    right: [number, number]
    anchor: string
  } | null {
    if (!this.d3_selection) return null
    const label_g = this.d3_selection.node() as SVGGraphicsElement | null
    const handlers_grp = this._element.drawing_area.d3_selection_handlers?.node() as SVGGraphicsElement | null
    if (!label_g || !handlers_grp) return null
    const label_ctm = label_g.getCTM()
    const handlers_ctm = handlers_grp.getCTM()
    if (!label_ctm || !handlers_ctm) return null
    const rel = handlers_ctm.inverse().multiply(label_ctm)

    const text_node = this.d3_selection.select(this.getTextSelector()).node() as SVGGraphicsElement | null
    if (!text_node) return null
    const text_bbox = text_node.getBBox()
    const handle_y_local = text_bbox.y + text_bbox.height / 2

    const [label_pos_x] = this.getLabelPos()
    const anchor = (text_node as SVGTextElement).getAttribute('text-anchor') ?? 'middle'
    const box_width = Number((this._label_values as { box_width?: number })?.box_width ?? 0)

    let bl_local: number, br_local: number
    if (anchor === 'start') {
      bl_local = label_pos_x
      br_local = label_pos_x + box_width
    } else if (anchor === 'end') {
      bl_local = label_pos_x - box_width
      br_local = label_pos_x
    } else {
      bl_local = label_pos_x - box_width / 2
      br_local = label_pos_x + box_width / 2
    }

    const transformPoint = (x: number, y: number): [number, number] => [
      rel.a * x + rel.c * y + rel.e,
      rel.b * x + rel.d * y + rel.f,
    ]
    return {
      left: transformPoint(bl_local, handle_y_local),
      right: transformPoint(br_local, handle_y_local),
      anchor,
    }
  }

  /**
   * ✅ Dessine le background du label
   */
  protected drawBackground(
    group: d3_selection_type | undefined,
    tspanWidths: number[]
  ) {
    if (!group) return

    // En mode stick, le fond du value_label est skip : c'est refreshStickLayout()
    // (côté name_label) qui dessine un fond unifié englobant nom + valeur.
    const stick_el = this._element as unknown as Class_NodeElement
    if (
      this.prefix === 'value_label' &&
      stick_el.value_label_stick_to_label &&
      stick_el.name_label_background_visible
    ) {
      group.select(`.${this.prefix}_background`).remove()
      return
    }

    const textSelection = group?.select(this.getTextSelector())
    const bbox = (textSelection?.node() as SVGGElement)?.getBBox()
      ?? { x: 0, y: 0, height: 0, width: 0 }
    // Ancrage du texte (start/middle/end) — sert à caler le fond verrouillé
    // sur la forme du nœud, exactement comme le texte.
    const anchor = textSelection?.attr('text-anchor') ?? 'middle'

    const bgElement = this.drawGenericBackground(
      group,
      bbox.x,
      bbox.y,
      bbox.width,
      bbox.height,
      { anchor }
    )

    if (bgElement) {
      //@ts-expect-error xxx
      this.verticalText(tspanWidths, bgElement)
    }
  }

  // =================== STICK TO LABEL : helpers communs ===================

  /**
   * BBox du <text> du name_label — réf. pour positionner la valeur en mode stick.
   * Tient compte de la transform propre du <text> (rotation si vertical_text),
   * sinon la valeur se collerait à la bbox horizontale et ne suivrait pas.
   */
  protected getStickNameTextBBox(): { x: number, y: number, width: number, height: number } | null {
    const textNode = this._element.d3_selection
      ?.select(this.getStickNameTextSelector()).node() as SVGGraphicsElement | null
    if (!textNode) return null
    try {
      const b = getTransformedBBox(textNode)
      if (b.width === 0 && b.height === 0) return null
      return b
    } catch {
      return null
    }
  }

  /**
   * Position d'un value_label collé (stick_to_label) : calculée par rapport à la
   * bbox du <text> du name_label, selon horiz/vert/inside/shift du value_label.
   */
  protected computeStickPos(
    nameBBox: { x: number, y: number, width: number, height: number }
  ): [number, number, string, string] {
    let label_pos_x = 0
    let label_anchor: string = 'start'

    if (this._label_values.position_absolute) {
      label_pos_x = this._label_values.position_x
      label_anchor = 'middle'
    } else {
      const inside_horiz = this._label_values.inside_horiz
      if (this._label_values.horiz === 'right') {
        label_anchor = inside_horiz ? 'end' : 'start'
        label_pos_x = nameBBox.x + nameBBox.width + this._label_values.horiz_shift
      } else if (this._label_values.horiz === 'left') {
        label_anchor = inside_horiz ? 'start' : 'end'
        label_pos_x = nameBBox.x + this._label_values.horiz_shift
      } else if (this._label_values.horiz === 'middle') {
        label_anchor = 'middle'
        label_pos_x = nameBBox.x + nameBBox.width / 2 + this._label_values.horiz_shift
      }
    }

    let label_pos_y = 0
    let label_baseline: string = 'text-before-edge'

    if (this._label_values.position_absolute) {
      label_pos_y = this._label_values.position_y
      label_baseline = 'middle'
    } else {
      const inside_vert = this._label_values.inside_vert
      if (this._label_values.vert === 'top') {
        label_pos_y = nameBBox.y + this._label_values.vert_shift
        label_baseline = inside_vert ? 'text-before-edge' : 'text-after-edge'
      } else if (this._label_values.vert === 'bottom') {
        label_pos_y = nameBBox.y + nameBBox.height + this._label_values.vert_shift
        label_baseline = inside_vert ? 'text-after-edge' : 'text-before-edge'
      } else if (this._label_values.vert === 'middle') {
        label_pos_y = nameBBox.y + nameBBox.height / 2 + this._label_values.vert_shift
        label_baseline = 'middle'
      }
    }

    return [label_pos_x, label_pos_y, label_anchor, label_baseline]
  }

  /**
   * En mode stick, le bloc combiné est-il recalé verticalement sur l'ancrage du
   * name_label ? Vrai pour les nœuds (name_label centré/ancré sur la forme).
   * Faux pour les liens : le name_label y est positionné par rapport au flux
   * (convention de baseline propre aux liens), on le laisse en place et la
   * valeur se contente d'y coller.
   */
  protected stickRecentersVertically(): boolean {
    return true
  }

  /**
   * Quand value_label_stick_to_label est on, à appeler sur le drawer du
   * name_label APRÈS que le value_label ait rendu son <text> :
   *  1. recale le bloc combiné (nom + valeur) pour qu'il soit ancré sur la forme
   *     comme le serait le name_label seul — les deux <g> (nom + valeur) sont
   *     décalés ensemble de (dx, dy) ;
   *  2. redessine le fond du name_label pour qu'il englobe nom + valeur (le fond
   *     du value_label est skip côté drawBackground).
   */
  public refreshStickLayout(): void {
    if (this.prefix !== 'name_label') return
    if (!this.d3_selection) return
    const el = this._element as unknown as Class_NodeElement
    if (!el.value_label_stick_to_label) return
    if (!el.value_label_is_visible) return
    if (!this._label_values.is_visible) return

    const nameTextNode = this.d3_selection
      .select(this.getStickNameTextSelector()).node() as SVGGraphicsElement | null
    const valueTextNode = this._element.d3_selection
      ?.select(this.getStickValueTextSelector()).node() as SVGGraphicsElement | null
    if (!nameTextNode || !valueTextNode) return

    // BBox tenant compte de la transform propre des <text> (rotation si
    // vertical_text), sinon ni la valeur ni le fond ne suivent le nom tourné.
    let nameBBox: { x: number, y: number, width: number, height: number }
    let valueBBox: { x: number, y: number, width: number, height: number }
    try {
      nameBBox = getTransformedBBox(nameTextNode)
      valueBBox = getTransformedBBox(valueTextNode)
    } catch {
      return
    }

    // Co-centrage vertical : quand la valeur est posée À CÔTÉ du nom
    // (value vert='middle'), 'dominant-baseline:middle' (métrique de la police)
    // ne coïncide pas avec le centre géométrique de la bbox → nom et valeur
    // paraissent décalés (l'un trop haut, l'autre trop bas). On aligne le centre
    // géométrique de la valeur sur celui du nom : les deux se retrouvent alors
    // centrés verticalement dans le fond combiné.
    let value_dy = 0
    if (el.value_label_vert === 'middle') {
      value_dy = (nameBBox.y + nameBBox.height / 2) - (valueBBox.y + valueBBox.height / 2)
    }
    const value_y = valueBBox.y + value_dy

    const x_min = Math.min(nameBBox.x, valueBBox.x)
    const y_min = Math.min(nameBBox.y, value_y)
    const x_max = Math.max(nameBBox.x + nameBBox.width, valueBBox.x + valueBBox.width)
    const y_max = Math.max(nameBBox.y + nameBBox.height, value_y + valueBBox.height)

    // Le name_label est positionné pour être ancré seul sur la forme, et la
    // valeur se contente de coller à son bord → le bloc combiné nom+valeur
    // n'est pas calé sur la forme. On recale l'ensemble en décalant les deux
    // <g> (nom + valeur) de (dx, dy), pour que le point d'ancrage du bloc
    // combiné tombe là où le name_label devrait être ancré :
    //   - horizontal : centre/bord selon le text-anchor (horiz)
    //   - vertical   : centre/bord selon la dominant-baseline (vert) — nœuds
    //     uniquement (cf. stickRecentersVertically).
    const [name_label_pos_x, name_label_pos_y, name_label_anchor, name_label_baseline] = this.getLabelPos()
    const current_anchor_x =
      name_label_anchor === 'start'
        ? x_min
        : name_label_anchor === 'end'
          ? x_max
          : (x_min + x_max) / 2
    const current_anchor_y =
      name_label_baseline === 'text-before-edge'
        ? y_min
        : name_label_baseline === 'text-after-edge'
          ? y_max
          : (y_min + y_max) / 2
    const dx = name_label_pos_x - current_anchor_x
    const dy = this.stickRecentersVertically()
      ? name_label_pos_y - current_anchor_y
      : 0
    // Le nom prend le recalage du bloc ; la valeur prend en plus son co-centrage.
    const name_transform = (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01)
      ? `translate(${dx},${dy})`
      : null
    const value_total_dy = dy + value_dy
    const value_transform = (Math.abs(dx) > 0.01 || Math.abs(value_total_dy) > 0.01)
      ? `translate(${dx},${value_total_dy})`
      : null
    this.d3_selection.attr('transform', name_transform)
    d3.select(valueTextNode.parentNode as SVGGElement).attr('transform', value_transform)

    // Le fond englobe le bloc combiné. Il est ajouté dans g_name_label (déjà
    // décalé de (dx,dy)), donc dessiné sur les coordonnées locales du contenu :
    // il suit le bloc recalé. L'anchor du name_label sert au fond à largeur
    // verrouillée pour rester calé comme le texte.
    if (el.name_label_background_visible) {
      this.drawGenericBackground(
        this.d3_selection,
        x_min,
        y_min,
        x_max - x_min,
        y_max - y_min,
        { anchor: name_label_anchor }
      )
    }
  }

  /**
   * ✅ Dessine un ForeignObject
   */
  public drawFO() {
    const d3_selection = this.getD3Selection()
    if (!d3_selection) return

    const has_fo = this._label_values.has_fo
    const fo_content = this._label_values.fo_content
    if (!has_fo || !fo_content) return

    const [label_pos_x, label_pos_y, label_anchor, label_baseline] = this.getLabelPos()

    this.d3_selection = d3_selection.append('g')
      .attr('id', `g_fo_${this.prefix}_${this.getElementId()}`)

    const d3_selection_g_FO = this.d3_selection.append('foreignObject')
      .attr('id', `${this.prefix}_fo_${this.getElementId()}`)
      .attr('class', 'element_fo')
      .attr('x', label_pos_x)
      .attr('y', label_pos_y)

    // Largeur pilotée par l'utilisateur (box_width du menu), bornée par
    // shape_min_width pour ne pas être plus étroit que l'élément. On la fixe
    // sur le foreignObject AVANT d'attacher la div, sinon `width:100%` côté
    // div tombe sur un containing block de 0 et le browser mesure le mot le
    // plus long (ex. "PAP" ≈ 30px) — c'était la cause du blocage à width=30.
    const width = Math.max(this._label_values.box_width, this._element.shape_min_width)
    d3_selection_g_FO.attr('width', width)

    const d3_div_selection = d3_selection_g_FO.append('xhtml:div')
      .attr('class', 'ql-editor')
      .style('width', '100%')
      .html(fo_content)

    if (this._label_values.inside_vert && this._label_values.inside_horiz) {
      d3_selection_g_FO
        .attr('width', this._element.shape_min_width)
        .attr('height', this._element.shape_min_height)
        .attr('x', 0)
        .attr('y', 0)
      d3_div_selection.attr('width', this._element.shape_min_width)
    } else {
      // Mesure synchrone : lire `offsetHeight` force un layout immédiat,
      // pas de requestAnimationFrame ni de race au redraw.
      const divNode = d3_div_selection.node() as HTMLDivElement
      const height = divNode.offsetHeight || divNode.scrollHeight

      // Issue #1232 — police verrouillée : le foreignObject vit dans le repère
      // zoomé (facteur k). En texte simple, font-size est compensée par
      // font_compensation (=1/k) ; pour le rich text (tailles inline arbitraires
      // venant de Quill) on contre-scale tout le FO à la place, comme la légende
      // (cf. Legend.applyPosition). L'empreinte locale visible vaut donc
      // width*comp × height*comp. En mode déverrouillé, comp = 1 (no-op).
      const comp = this._element.drawing_area?.font_compensation ?? 1

      if (this.getEffectiveTextAngle() === -90) {
        // Colonne tournée : colWidth=height, colHeight=width (mêmes principes
        // que NodeDrawLabelBase.verticalText, mais pour foreignObject).
        // Issue #1232 : dimensions VISIBLES en coords locales (compensées par
        // comp), car le positionnement se fait dans le repère des dims du nœud
        // (shape_*) qui, elles, vivent en coords locales.
        const colWidth = height * comp
        const colHeight = width * comp
        const shape_w = this._element.shape_min_width
        const shape_h = this._element.shape_min_height
        const margin_l = this._element.shape_margin_left
        const margin_r = this._element.shape_margin_right
        const margin_t = this._element.shape_margin_top
        const margin_b = this._element.shape_margin_bottom
        const horiz = this._label_values.horiz
        const vert = this._label_values.vert
        const inside_h = this._label_values.inside_horiz
        const inside_v = this._label_values.inside_vert
        const horiz_shift = this._label_values.horiz_shift ?? 0
        const vert_shift = this._label_values.vert_shift ?? 0

        let tx: number
        let ty: number
        if (this._label_values.position_absolute) {
          tx = (this._label_values.position_x ?? 0) - colWidth / 2
          ty = (this._label_values.position_y ?? 0) - colHeight / 2
        } else {
          if (horiz === 'left') {
            tx = inside_h ? horiz_shift : -colWidth - margin_l + horiz_shift
          } else if (horiz === 'right') {
            tx = inside_h ? shape_w - colWidth + horiz_shift : shape_w + margin_r + horiz_shift
          } else {
            tx = (shape_w - colWidth) / 2 + horiz_shift
          }
          if (vert === 'top') {
            ty = inside_v ? vert_shift : -colHeight - margin_t + vert_shift
          } else if (vert === 'bottom') {
            ty = inside_v ? shape_h - colHeight + vert_shift : shape_h + margin_b + vert_shift
          } else {
            ty = (shape_h - colHeight) / 2 + vert_shift
          }
        }

        // ty + colHeight : colHeight = width*comp = hauteur visible de la
        // colonne (cf. dérivation issue #1232). rotate(-90) puis scale(comp) :
        // le scale étant uniforme, il commute avec la rotation. Le FO est rendu
        // à sa taille native (width×height) et placé/contre-scalé par le transform.
        const v_transform = comp !== 1
          ? `translate(${tx}, ${ty + colHeight}) rotate(-90) scale(${comp})`
          : `translate(${tx}, ${ty + colHeight}) rotate(-90)`
        d3_selection_g_FO
          .attr('width', width)
          .attr('height', height)
          .attr('x', 0)
          .attr('y', 0)
          .attr('transform', v_transform)

        this.drawGenericBackground(
          this.d3_selection!,
          0,
          0,
          width,
          height,
          { className: 'element_fo_background' }
        )
        const bg = this.d3_selection?.select('.element_fo_background')
        if (bg && !bg.empty()) {
          bg.attr('transform', v_transform)
        }
      } else {
        // Empreinte locale visible (compensée). Le coin haut-gauche est calculé
        // avec ces dimensions pour que l'ancrage (middle/end, baseline) reste
        // correct quel que soit le zoom.
        const vis_width = width * comp
        const vis_height = height * comp

        let adjusted_x = label_pos_x
        if (label_anchor === 'middle') {
          adjusted_x = label_pos_x - vis_width / 2
        } else if (label_anchor === 'end') {
          adjusted_x = label_pos_x - vis_width
        }

        let adjusted_y = label_pos_y
        if (label_baseline === 'text-after-edge') {
          adjusted_y = label_pos_y - vis_height
        } else if (label_baseline === 'middle') {
          adjusted_y = label_pos_y - vis_height / 2
        }

        // FO rendu à sa taille CSS native (width×height), amené au coin
        // haut-gauche local puis contre-scalé par comp (translate … scale).
        const h_transform = this.foScaleTransform(adjusted_x, adjusted_y, comp)
        d3_selection_g_FO
          .attr('width', width)
          .attr('height', height)
          .attr('x', 0)
          .attr('y', 0)
          .attr('transform', h_transform)

        // Le fond est dessiné à la taille native (0,0,width,height) et reçoit le
        // même transform : il reste ainsi aligné et à taille écran constante,
        // exactement comme le texte.
        this.drawGenericBackground(
          this.d3_selection!,
          0,
          0,
          width,
          height,
          { className: 'element_fo_background' }
        )
        const bg = this.d3_selection?.select('.element_fo_background')
        if (bg && !bg.empty()) {
          bg.attr('transform', h_transform)
        }

        // Angle libre (≠ 0 et ≠ −90, ce dernier passant par la colonne ci-dessus) :
        // on tourne tout le groupe FO autour du point d'ancrage du label. FO et fond
        // gardent leur h_transform interne et suivent donc la rotation ensemble.
        const fo_angle = this.getEffectiveTextAngle()
        if (fo_angle !== 0) {
          this.d3_selection?.attr('transform', `rotate(${fo_angle}, ${label_pos_x}, ${label_pos_y})`)
        }
      }
    }

    if (this._element.name_label_has_fo && this._element.name_label_inside_horiz && this._element.name_label_inside_vert) {
      return
    }

    if (!this._element.drawing_area?.editable) {
      return
    }
    d3_selection_g_FO.call(d3.drag<SVGForeignObjectElement, unknown>()
      .filter(evt => (evt.which == 1 && evt.altKey))
      .on('start', ev => this.dragGenericStart(ev))
      .on('drag', ev => this.dragGenericMove(ev))
      .on('end', ev => this.dragGenericEnd(ev))
    )

  }

  protected abstract getIconPos(): [number, number]

  public drawImage() {
    if (!this._element.d3_selection || !this._label_values.image_src) return

    const [icon_pos_x, icon_pos_y] = this.getIconPos()
    const [icon_width, icon_height] = this.getIconSize()

    // Créer le groupe
    this.d3_selection = this._element.d3_selection.append('g')
      .attr('id', `g_image_${this.prefix}_${this.getElementId()}`)
      .classed('illustration', true)
      .classed(`illustration_${this.prefix}`, true)

    // Dessiner le background
    this.drawGenericBackground(
      this.d3_selection,
      icon_pos_x,
      icon_pos_y,
      icon_width,
      icon_height,
      {
        bgPrefix: `${this.prefix}_background` as ShapePrefix,
        className: `${this.prefix}_image_background`
      }
    )

    // ✅ Appeler une méthode protégée pour obtenir les dimensions finales
    const [final_x, final_y, final_width, final_height] = this.getImageDimensions(icon_pos_x, icon_pos_y, icon_width, icon_height)

    // Dessiner l'image
    const _imageElement = this.d3_selection.append('image')
      .attr('id', `image_${this.prefix}_${this.getElementId()}`)
      .attr('class', 'illustration image')
      .attr('xlink:href', this._label_values.image_src)
      .attr('x', final_x)
      .attr('y', final_y)
      .attr('width', final_width)
      .attr('height', final_height)
      .attr('opacity', this._element.shape_opacity)

    // Setup drag
    this.setupImageDrag()
  }

  // ✅ Méthode protégée à override dans les sous-classes
  protected getImageDimensions(
    icon_pos_x: number,
    icon_pos_y: number,
    icon_width: number,
    icon_height: number
  ): [number, number, number, number] {
    // Implémentation par défaut
    if (this._label_values.inside_vert && this._label_values.inside_horiz) {
      return [0, 0, this._element.shape_min_width, this._element.shape_min_height]
    }
    return [icon_pos_x, icon_pos_y, icon_width, icon_height]
  }

  protected setupImageDrag(): void {
    if (this._element.icon_is_image && this._element.icon_inside_horiz && this._element.icon_inside_vert) {
      return
    }

    if (!this._element.drawing_area?.editable) {
      return
    }

    this.d3_selection?.call(d3.drag<SVGGElement, unknown>()
      .filter(evt => (evt.which == 1) && evt.altKey && this._element.drawing_area?.isInSelectionMode())
      .on('start', ev => this.dragGenericStart(ev))
      .on('drag', ev => this.dragGenericMove(ev))
      .on('end', ev => this.dragGenericEnd(ev))
    )
  }
  /**
   * ✅ Dessine une icône
   */
  public drawIcon() {
    if (!this._element.d3_selection || !this._label_values.is_visible || !this._label_values.icon_name || !this._label_values.color) return

    const [icon_pos_x, icon_pos_y] = this.getIconPos()
    const [icon_width, icon_height] = this.getIconSize()

    this.d3_selection = this._element.d3_selection.append('g')
      .attr('id', `g_icon_${this.prefix}_${this.getElementId()}`)
      .classed('illustration', true)
      .classed(`illustration_${this.prefix}`, true)

    // ✅ CORRECTION : Dessiner le background AVANT le SVG de l'icône
    this.drawGenericBackground(
      this.d3_selection,
      icon_pos_x,
      icon_pos_y,
      icon_width,
      icon_height,
      {
        bgPrefix: `${this.prefix}_background` as ShapePrefix,
        className: `${this.prefix}_icon_background`
      }
    )

    const d3_selection_icon_svg = this.d3_selection.append('svg')
      .attr('id', `icon_svg_${this.prefix}_${this.getElementId()}`)
      .attr('class', 'illustration_svg')
      .attr('viewBox', this._label_values.view_box ? this._label_values.view_box : '0 0 1000 1000')
      .attr('x', icon_pos_x)
      .attr('y', icon_pos_y)

    if (this._label_values.inside_vert && this._label_values.inside_horiz) {
      d3_selection_icon_svg
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', (this._element as Class_NodeElement).getShapeWidthToUse())
        .attr('height', (this._element as Class_NodeElement).getShapeHeightToUse())
    } else {
      d3_selection_icon_svg
        .attr('height', icon_height)
        .attr('width', icon_width)
    }

    d3_selection_icon_svg
      .append('g')
      .append('path')
      .style('fill', this._label_values.color_sustainable ? this._label_values.color : this._element.getShapeColorToUse())
      .style('opacity', this._element.shape_opacity)
      .attr('d', this._element.sankey.getIconFromCatalog(this._label_values.icon_name))

    // ✅ Appliquer le drag générique unifié
    if (this._element.drawing_area?.editable) {
      this.d3_selection?.call(d3.drag<SVGGElement, unknown>()
        .filter(evt => (evt.which == 1) && evt.altKey && this._element.drawing_area?.isInSelectionMode())
        .on('start', ev => this.dragGenericStart(ev))
        .on('drag', ev => this.dragGenericMove(ev))
        .on('end', ev => this.dragGenericEnd(ev))
      )
    }
  }

  // =================== DRAG & DROP GÉNÉRIQUE UNIFIÉ ===================

  /**
   * ✅ Drag générique unifié pour tous les types (text, FO, icon, image)
   */
  protected dragGenericStart(_event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    if (this._label_values.position_absolute) {
      // MODE ABSOLU : sauvegarder position_x/position_y
      const old_val: [number, number, boolean] = [
        this._label_values.position_x,
        this._label_values.position_y,
        this._label_values.position_absolute
      ]

      const inv = () => {
        this._label_values.position_x = old_val[0]
        this._label_values.position_y = old_val[1]
        this._label_values.position_absolute = old_val[2]
        this.drawGenericLabel()
      }

      this._element.drawing_area.application_data.history.saveUndo(inv)
    } else {
      // MODE RELATIF : sauvegarder horiz_shift/vert_shift
      const old_val: [number, number] = [
        this._label_values.horiz_shift,
        this._label_values.vert_shift
      ]

      const inv = () => {
        this._label_values.horiz_shift = old_val[0]
        this._label_values.vert_shift = old_val[1]
        this.drawGenericLabel()
      }

      this._element.drawing_area.application_data.history.saveUndo(inv)
    }
  }

  protected dragGenericMove(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    this._element.drawing_area.bypass_redraws = true
    if (this._label_values.position_absolute) {
      // MODE ABSOLU : éditer position_x/position_y
      this._label_values.position_x = (this._label_values.position_x ?? 0) + event.dx
      this._label_values.position_y = (this._label_values.position_y ?? 0) + event.dy
    } else {
      // MODE RELATIF : éditer horiz_shift/vert_shift
      this._label_values.horiz_shift = (this._label_values.horiz_shift ?? 0) + event.dx
      this._label_values.vert_shift = (this._label_values.vert_shift ?? 0) + event.dy
    }
    this._element.drawing_area.bypass_redraws = false
    // Mettre à jour la position visuelle
    this.updateGenericPosition()
  }

  protected dragGenericEnd(_event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    if (this._label_values.position_absolute) {
      const new_val: [number, number, boolean] = [
        this._label_values.position_x,
        this._label_values.position_y,
        this._label_values.position_absolute
      ]

      const redo = () => {
        this._label_values.position_x = new_val[0]
        this._label_values.position_y = new_val[1]
        this._label_values.position_absolute = new_val[2]
        this.drawGenericLabel()
      }

      this._element.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this._element.drawing_area.application_data.history.saveRedo(redo)
      redo()
    } else {
      const new_val: [number, number] = [
        this._label_values.horiz_shift,
        this._label_values.vert_shift
      ]

      const redo = () => {
        this._label_values.horiz_shift = new_val[0]
        this._label_values.vert_shift = new_val[1]
        this.drawGenericLabel()
      }

      this._element.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this._element.drawing_area.application_data.history.saveRedo(redo)
      redo()
    }
  }

  /**
   * ✅ Mise à jour visuelle pendant le drag
   */
  /**
   * ✅ Mise à jour visuelle pendant le drag
   */
  protected updateGenericPosition() {
    if (!this.d3_selection) return

    // Pour FO
    const fo = this.d3_selection.select('.element_fo')
    if (!fo.empty()) {
      // Le rich text vertical est positionné par un transform translate+rotate
      // dérivé des dims du nœud (cf. drawFO) ; le recalculer ici dupliquerait
      // toute cette géométrie. On laisse donc le drag-end (drawGenericLabel) le
      // replacer correctement plutôt que d'écraser sa rotation pendant le drag.
      if (this.getEffectiveTextAngle() !== 0) return

      const [label_pos_x, label_pos_y, label_anchor, label_baseline] = this.getLabelPos()
      // Issue #1232 : même compensation qu'à la pose initiale (drawFO).
      const comp = this._element.drawing_area?.font_compensation ?? 1

      // Récupérer les dimensions natives du FO, puis l'empreinte locale visible.
      const foWidth = parseFloat(fo.attr('width')) || 0
      const foHeight = parseFloat(fo.attr('height')) || 0
      const vis_width = foWidth * comp
      const vis_height = foHeight * comp

      // Appliquer les mêmes ajustements que dans drawFO
      let adjusted_x = label_pos_x
      if (label_anchor === 'middle') {
        adjusted_x = label_pos_x - vis_width / 2
      } else if (label_anchor === 'end') {
        adjusted_x = label_pos_x - vis_width
      }

      let adjusted_y = label_pos_y
      if (label_baseline === 'text-after-edge') {
        adjusted_y = label_pos_y - vis_height
      } else if (label_baseline === 'middle') {
        adjusted_y = label_pos_y - vis_height / 2
      }
      const transform = this.foScaleTransform(adjusted_x, adjusted_y, comp)
      fo.attr('x', 0).attr('y', 0).attr('transform', transform)

      // Mettre à jour le background aussi (même transform → reste aligné)
      const foBg = this.d3_selection.select('.element_fo_background')
      if (!foBg.empty()) {
        foBg.attr('x', 0).attr('y', 0).attr('transform', transform)
      }

      return
    }

    // Pour Image
    const img = this.d3_selection.select('image')
    if (!img.empty()) {
      const [new_x, new_y] = this.getIconPos()
      img.attr('x', new_x).attr('y', new_y)
      return
    }

    // Pour Icon (SVG)
    const iconSvg = this.d3_selection.select('.illustration_svg')
    if (!iconSvg.empty()) {
      const [new_x, new_y] = this.getIconPos()
      iconSvg.attr('x', new_x).attr('y', new_y)
      return
    }

    // ✅ Pour Text, utiliser updateLabelPos() directement
    this.updateLabelPos()
  }

  /**
   * ✅ Input d'édition générique (contenteditable, multi-ligne, WYSIWYG)
   */
  public setInputLabelVisible(initialValue?: string) {
    const foSel = this.d3_selection?.select(`.${this.prefix}_fo_input`)
    foSel?.style('display', null)
    this.d3_selection?.select(`.${this.prefix}_text`).style('display', 'none')
    const inputId = `${this.prefix}_input_${this.getElementId()}`
    const input = document.getElementById(inputId) as HTMLElement | null
    if (!input) return
    input.focus()
    const sel = window.getSelection()
    const range = document.createRange()
    // Qu'on entre en édition par double-clic (initialValue === undefined) ou par
    // frappe directe sur un élément sélectionné (ultra-shortcut #688), on adopte
    // le même comportement : sélectionner tout le mot existant (équivalent
    // input.select()), focus au début. La touche tapée sert uniquement à entrer
    // en édition, elle n'est pas insérée en fin de mot.
    void initialValue
    range.selectNodeContents(input)
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  public setInputLabelInvisible() {
    this.drawGenericLabel()
  }

  /**
   * Ouvre l'éditeur inline de valeur même quand le flux n'a pas encore de valeur
   * (flux en pointillé) : dans ce cas aucun label n'est dessiné, donc aucun input
   * n'existe à révéler. On force alors le dessin de la structure éditable puis on
   * affiche l'input. Sert au double-clic sur le tracé du flux lui-même.
   */
  public openInlineEditor() {
    if (!this._element.drawing_area.editable || !this.enableEditing) return
    const inputId = `${this.prefix}_input_${this.getElementId()}`
    if (!document.getElementById(inputId)) {
      this._force_editable_draw = true
      this.drawGenericLabel()
      this._force_editable_draw = false
    }
    this.setInputLabelVisible()
  }

  /**
   * ✅ Crée le foreignObject + input d'édition inline.
   * Reste masqué par défaut ; révélé par setInputLabelVisible.
   */
  protected drawLabelInput(
    d3_selection: d3_selection_type | null,
    box_pos_x: number,
    box_pos_y: number,
    box_width: number,
    box_height: number = 30,
    // force_nowrap : éditeur étroit qui grandit avec le contenu (pas de wrap, pas
    // de largeur fixe) — pour la valeur d'un flux (numérique, jamais multi-mots),
    // dont la « boîte » de label (box_width, ~300px) donnerait une zone d'édition
    // démesurément large.
    force_nowrap: boolean = false
  ) {
    if (!this._element.drawing_area.editable) return

    // WYSIWYG : on utilise un <div contenteditable> à la largeur du label
    // (label.box_width). Le texte wrappe au même point que le rendu, et la
    // boîte grandit verticalement à mesure que des lignes sont ajoutées.
    // Quand wrap_long_words est on, les mots longs cassent aussi.
    // Quand le label tient sur une ligne sans espace, la boîte d\'édition
    // déborde horizontalement (overflow visible) plutôt que de wrapper.
    const lbl = this._label_values as { box_width?: number, wrap_long_words?: boolean, font_size?: number } | undefined
    const target_width = force_nowrap ? box_width : (lbl?.box_width ?? box_width)
    const wrap_long = force_nowrap ? false : (lbl?.wrap_long_words ?? false)
    // Compensation zoom (issue #165) : le foreignObject vit dans le repère
    // local zoomé, donc la CSS font-size en px y est aussi multipliée par k.
    const comp = this._element.drawing_area?.font_compensation ?? 1
    const raw_font_size = lbl?.font_size ?? 12
    const font_size = raw_font_size * comp
    const line_height = Math.max(font_size * 1.3, 14 * comp)
    // Hauteur généreuse pour ne pas clipper plusieurs lignes ; overflow visible.
    const fo_height = Math.max(box_height, line_height * 10)

    const fo = d3_selection?.append('foreignObject')
      .classed(this.prefix, true)
      .classed(`${this.prefix}_fo_input`, true)
      .attr('x', box_pos_x)
      .attr('y', box_pos_y)
      .attr('width', target_width)
      .attr('height', fo_height)
      .attr('overflow', 'visible')
      .style('display', 'none')

    if (!fo) return

    // Comportement demandé :
    //  - césure (wrap_long_words) ON  → la boîte fait `target_width` et le
    //    texte wrappe en bout de ligne (y compris en cassant les mots longs).
    //  - césure OFF                  → la boîte grandit horizontalement au
    //    fur et à mesure qu'on tape (pas de wrap).
    const div = fo.append('xhtml:div')
      .classed(this.prefix, true)
      .classed(`${this.prefix}_input`, true)
      .attr('id', `${this.prefix}_input_${this._element.id}`)
      .attr('contenteditable', 'true')
      .style('display', 'inline-block')
      .style('min-height', `${line_height}px`)
      .style('font-size', `${font_size}px`)
      .style('line-height', `${line_height}px`)
      .style('outline', '1px solid #1f77b4')
      .style('background', 'rgba(255,255,255,0.95)')
      .style('padding', '1px 2px')
      .style('box-sizing', 'content-box')
      .style('cursor', 'text')
    if (wrap_long) {
      div
        .style('width', `${target_width}px`)
        .style('white-space', 'pre-wrap')
        .style('overflow-wrap', 'break-word')
        .style('word-break', 'break-word')
    } else {
      div
        .style('white-space', 'nowrap')
      // En mode étroit (valeur), garantir une largeur minimale cliquable même
      // quand le flux n'a pas encore de valeur (input vide).
      if (force_nowrap) {
        div.style('min-width', `${target_width}px`)
      }
    }
    (div.node() as HTMLDivElement).textContent = this.getInputInitialValue()
    div
      // Empêcher les events souris de bubbler vers le <g> de l'élément :
      // sinon mouseup/click déclenche eventSimpleLMBClick → drawAsSelected →
      // redraw du label → l'input disparaît dès qu'on relâche la souris.
      .on('mousedown', (evt: MouseEvent) => { evt.stopPropagation() })
      .on('mouseup', (evt: MouseEvent) => { evt.stopPropagation() })
      .on('click', (evt: MouseEvent) => { evt.stopPropagation() })
      .on('dblclick', (evt: MouseEvent) => { evt.stopPropagation() })
      .on('input', (evt: Event) => {
        this._element.sankey.drawing_area.bypass_redraws = true
        const text = (evt.target as HTMLElement).innerText ?? ''
        this.onInputChange?.(text)
        this._element.sankey.drawing_area.bypass_redraws = false
      })
      .on('keydown', (evt: KeyboardEvent) => {
        // Enter valide (sans insérer de saut de ligne) ; Shift+Enter insère
        // un saut ; Escape valide aussi (le blur déclenche le redraw final).
        if (evt.key === 'Enter' && !evt.shiftKey) {
          evt.preventDefault();
          (evt.target as HTMLElement).blur()
        } else if (evt.key === 'Escape') {
          (evt.target as HTMLElement).blur()
        }
      })
      .on('blur', () => this.setInputLabelInvisible())
  }

  protected getInputInitialValue(): string {
    return String(this.getLabelText() ?? '')
  }

  /**
   * ✅ Attache un double-click sur le texte du label pour ouvrir l'input d'édition.
   */
  protected attachDoubleClickEdit(
    textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>
  ): void {
    if (!this._element.drawing_area.editable) return
    textElement.style('cursor', 'text')
      .on('click', (evt: MouseEvent) => {
        // Clic sur le label : sélectionne l'élément + sous-sélectionne ce
        // label (les poignées n'apparaîtront que pour ce label).
        // stopPropagation pour éviter le double-trigger via le <g> du nœud
        // (qui purge + ré-ajoute → flicker visuel).
        evt.stopPropagation()
        const el = this._element as Class_BaseShape
        const drawing_area = el.drawing_area
        // Sélectionne l'élément (via _selection) sinon Escape/purgeSelection
        // n'itère pas dessus et la sub-sélection reste collée (poignées qui
        // ne disparaissent pas en clic ailleurs / Escape).
        if (!el.is_selected) {
          drawing_area.addElementToSelection(el)
        }
        // Set APRÈS addElementToSelection (qui passe par drawAsSelected →
        // clear de selected_label_prefix).
        el.selected_label_prefix = this.prefix as 'name_label' | 'value_label' | 'icon'
        this.refreshLabelResizeHandles()
      })
      .on('dblclick', (evt: MouseEvent) => {
        evt.stopPropagation()
        evt.preventDefault()
        this.setInputLabelVisible()
      })
  }

  // =================== MÉTHODES ABSTRAITES (réduites au minimum) ===================

  protected abstract getTextClasses(): string[]
  protected abstract getTextElementId(): string

  protected applySpecialTextContent(
    _textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>,
    _labelText: string
  ): boolean {
    return false
  }

  protected applyTextDragHandlers(
    _textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>
  ): void {
    if (this._element.drawing_area?.editable) {
      this.d3_selection?.call(d3.drag<SVGGElement, unknown>()
        .filter(evt => (evt.which == 1) && evt.altKey && (this._element.drawing_area?.isInSelectionMode()))
        .on('start', ev => this.dragGenericStart(ev))
        .on('drag', ev => this.dragGenericMove(ev))
        .on('end', ev => this.dragGenericEnd(ev))
      )
    }
  }

  protected cleanupPreviousLabel() {
    this.d3_selection?.remove()
  }

  // =================== MÉTHODE GÉNÉRIQUE DE DESSIN ===================

  public drawGenericLabel() {
    const d3_selection = this.getD3Selection()
    if (!d3_selection) return

    this.cleanupPreviousLabel()

    if (this._label_values.has_fo) {
      return this.drawFO()
    }
    if (this._label_values.is_icon && this._label_values.is_visible) {
      return this.drawIcon()
    }
    if (this._label_values.is_image && this._label_values.is_visible) {
      return this.drawImage()
    }

    if (!this._force_editable_draw && !this.shouldDrawLabel()) return

    const labelText = String(this.getLabelText())
    if (!labelText && !this._force_editable_draw) return

    this.d3_selection = d3_selection.append('g')
      .attr('id', `g_${this.prefix}`)

    const additionalClasses = this.getTextClasses()

    const textElement = this.d3_selection.append('text')
      .attr('id', this.getTextElementId())

    additionalClasses.forEach(cls => textElement.classed(cls, true))
    textElement.classed(`${this.prefix}_text`, true)

    this.applyTextStyle(textElement)

    let tspanWidths: number[] = []

    const hasSpecialContent = this.applySpecialTextContent(textElement, labelText)

    if (!hasSpecialContent) {
      const k_inv_local = this._element.drawing_area?.font_compensation ?? 1
      // Issue #165 — box_width est défini par l'utilisateur en px écran. En mode
      // police verrouillée la font est grossie de k_inv en coords locales pour
      // rester constante à l'écran ; on grossit box_width du MÊME facteur, donc
      // le ratio glyphe/boîte reste identique au mode natif et le wrap volontaire
      // (libellés multi-mots) se déclenche exactement comme avant à box_width px
      // écran. Pas d'override sur la largeur naturelle du texte : ça désactivait
      // tout retour à la ligne dès que la compensation était active.
      const eff_box_width = this._label_values.box_width * k_inv_local
      let processedText = labelText
      if (this._label_values.wrap_long_words) {
        // Césure mesurée en px écran (font_size + box_width bruts) : canvas.measureText
        // n'est pas fiable à la taille compensée. textwrap re-placera ensuite les
        // sous-mots sur les bonnes lignes en coords locales via eff_box_width.
        processedText = breakLongWords(
          labelText,
          this._label_values.box_width,
          getCanvasFontStringAtSize(textElement, this._label_values.font_size)
        )
      }
      const hasSpaces = processedText.includes(' ')

      if (hasSpaces) {
        const wrapper = textwrap()
          .bounds({ height: 100 * k_inv_local, width: eff_box_width })
          .method('tspans')

        textElement
          .text(processedText)
          .call(wrapper)

        // ✅ Nettoyer les tspans vides
        textElement.selectAll('tspan')
          .filter(function () {
            const text = d3.select(this).text()
            return !text || text.trim() === ''
          })
          .remove()

        // ✅ Réinitialiser le dy du premier tspan restant
        const firstTspan = textElement.select('tspan')
        if (!firstTspan.empty()) {
          firstTspan.attr('dy', 0)
        }
      } else {
        // Mot unique : pas de wrapping nécessaire
        textElement.text(processedText)
      }

      const tspans = textElement.selectAll('tspan').nodes() as SVGTSpanElement[]
      tspans.forEach(tspan => {
        tspanWidths.push(tspan.getComputedTextLength())
      })

      this.updateLabelPos()
      this.applyMultilineAlignment(textElement, tspanWidths)
    } else {
      requestAnimationFrame(() => {
        const textPathNode = textElement.select('textPath').node() as SVGTextPathElement
        if (textPathNode && this.d3_selection) {
          const textLength = textPathNode.getComputedTextLength()
          tspanWidths = [textLength]

          this.drawBackground(this.d3_selection, tspanWidths)
          this.verticalText(tspanWidths, textElement)
        }
      })
    }

    if (!hasSpecialContent) {
      // verticalText réancre le `<text>` avant que drawBackground ne lise sa bbox locale
      // (sinon le bg se positionnerait sur l'ancienne bbox horizontale, déphasée du texte
      // tourné). drawBackground appliquera la même transform au bg → bg suit le texte.
      this.verticalText(tspanWidths, textElement)
      this.drawBackground(this.d3_selection, tspanWidths)
    }

    this.applyTextDragHandlers(textElement)
    this.finalizeLabelCreation(textElement)

    // Poignées de redimensionnement (label.box_width) — Class_Handler dans
    // `g_handlers`, en coords absolues `g_drawing` (cf. doc de la méthode).
    // Re-positionne les poignées après chaque redraw du label si elles
    // étaient affichées (sub-sélection active), sinon ne fait rien.
    this.refreshLabelResizeHandles()
  }

  protected verticalText(_tspanWidths: number[], _textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>): number | undefined {
    return undefined
  }

  /**
   * Angle effectif de rotation du texte, en degrés (−180..180).
   * `text_angle` (widget d'angle) prime ; à 0, on retombe sur la rétro-compat
   * `vertical_text` → −90° (les liens surchargent pour tenir compte de is_vertical).
   * −90° emprunte la géométrie de colonne historique (alignée au bord) ; tout
   * autre angle non nul est une rotation générique autour du point d'ancrage.
   */
  protected getEffectiveTextAngle(): number {
    const raw = Number((this._label_values as { text_angle?: number }).text_angle ?? 0)
    const clamped = Math.max(-180, Math.min(180, Number.isFinite(raw) ? raw : 0))
    if (clamped !== 0) return clamped
    return this._label_values.vertical_text ? -90 : 0
  }

  protected applyMultilineAlignment(
    textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>,
    tspanWidths: number[]
  ): void {
    if (tspanWidths.length === 0) return

    // Quand le texte est tourné (vertical_text), le décalage `y` selon `vert` et le `dx`
    // par tspan calculé ici se retrouvent perpendiculaires à la lecture après rotation,
    // ce qui décale les lignes latéralement au lieu de les empiler. La position d'ancrage
    // est déjà encodée dans label_pos_x/label_pos_y/label_anchor/label_baseline via
    // getLabelPos ; on laisse le wrapper d3 gérer le `dy` em par tspan, et la rotation
    // appliquée par verticalText() s'occupe du reste.
    // Pour un angle libre (≠ ±90), on laisse l'alignement multi-ligne se faire
    // normalement : la rotation générique de verticalText() pivote ensuite le
    // bloc déjà aligné autour de son point d'ancrage.
    const _align_angle = this.getEffectiveTextAngle()
    if (_align_angle === 90 || _align_angle === -90) return

    const [label_pos_x, label_pos_y, label_anchor] = this.getLabelPos()
    const maxWidth = Math.max(...tspanWidths, 1)

    textElement.attr('x', label_pos_x)

    const vert = this._label_values.vert
    const lineCount = Math.max(0, tspanWidths.length - 1)
    // Issue #165 : décalages multi-ligne en coords locales doivent suivre la
    // taille de police effectivement rendue (compensée du fit-zoom).
    const font_size = this.getEffectiveFontSize()
    const inside_vert = this._label_values.inside_vert  // ✅ AJOUTÉ

    // ✅ MODIFIÉ : Ne pas décaler vers le haut si inside_vert et vert === 'top'
    if (vert === 'top' && lineCount > 0 && !inside_vert) {  // ✅ Ajout de !inside_vert
      textElement.attr('y', label_pos_y - lineCount * font_size)
    }
    // ✅ AJOUT : Pour bottom + inside_vert, remonter le texte
    else if (vert === 'bottom' && lineCount > 0 && inside_vert) {
      textElement.attr('y', label_pos_y - lineCount * font_size)
    } else if (vert === 'middle' && lineCount > 0) {
      textElement.attr('y', label_pos_y - (lineCount * font_size / 2))
    }
    // ✅ Si inside_vert et vert === 'top', on garde label_pos_y tel quel (pas de décalage)

    const tspans = textElement.selectAll('tspan').nodes() as SVGTSpanElement[]
    tspans.forEach((node, i) => {
      const tspan = d3.select(node)
      const lineWidth = tspanWidths[i]
      let offsetX = 0
      const diffWidth = maxWidth - lineWidth

      if (this._label_values.text_align === 'left') {
        if (label_anchor === 'end') {
          offsetX = -diffWidth
        } else if (label_anchor === 'middle') {
          offsetX = -diffWidth / 2
        } else if (label_anchor === 'start') {
          offsetX = 0
        }
      } else if (this._label_values.text_align === 'middle') {
        if (label_anchor === 'end') {
          offsetX = -diffWidth / 2
        } else if (label_anchor === 'middle') {
          offsetX = 0
        } else if (label_anchor === 'start') {
          offsetX = diffWidth / 2
        }
      } else if (this._label_values.text_align === 'right') {
        if (label_anchor === 'end') {
          offsetX = 0
        } else if (label_anchor === 'middle') {
          offsetX = diffWidth / 2
        } else if (label_anchor === 'start') {
          offsetX = diffWidth
        }
      }

      tspan.attr('x', label_pos_x).attr('dx', offsetX)
    })
  }

  protected finalizeLabelCreation(
    _textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>
  ): void {
    // Override dans les sous-classes si nécessaire
  }
}

/**
 * Classe de base pour les labels de nodes
 */
export abstract class NodeDrawLabelBase extends DrawLabelBase {
  protected get node(): Class_NodeBase {
    return this._element as Class_NodeBase
  }

  constructor(node: Class_NodeBase, prefix: LabelPrefix) {
    super(node, prefix)

    if (prefix === 'name_label') {
      this._label_values = getNameLabelValues(this.node, prefix)
    } else if (prefix === 'value_label') {
      this._label_values = getValueLabelValues(this.node, prefix)
    } else {
      this._label_values = getValueLabelValues(this.node, prefix)
    }
  }

  protected override verticalText(tspanWidths: number[], textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>): number | undefined {
    const angle = this.getEffectiveTextAngle()
    if (angle === 0) return undefined

    // Angle libre (≠ −90) : le texte a été posé/aligné normalement par
    // updateLabelPos + applyMultilineAlignment ; on le pivote simplement autour
    // de son point d'ancrage. Le fond reçoit le même transform (cf. drawBackground)
    // et suit donc le texte. −90 garde la géométrie de colonne historique ci-dessous.
    if (angle !== -90) {
      const [px, py] = this.getLabelPos()
      textElement.attr('transform', `rotate(${angle}, ${px}, ${py})`)
      return undefined
    }

    // Pivot dynamique = pivot mobile : tourner autour de (label_pos_x, label_pos_y) couple
    // l'extent pré-rotation (text-anchor sur X, baseline sur Y) avec la position post-rotation
    // (axes échangés). Résultat : changer `vert` décale horizontalement et inversement.
    //
    // Solution : on neutralise l'ancrage du texte (x=0, y=0, anchor=start, baseline=text-before-edge)
    // et on calcule la position cible de la COLONNE tournée à partir de horiz/vert/inside_*/*_shift,
    // puis on applique `translate(...) rotate(-90)` (ordre SVG : rotate appliquée d'abord).
    //
    // Texte horizontal pré-rotation : box (0, 0)-(textWidth, colWidth) avec colWidth = lineCount * lineHeight.
    // Après rotate(-90, 0, 0)   : box (0, -textWidth)-(colWidth, 0).
    // Translate (tx, ty + textWidth) → box finale (tx, ty)-(tx + colWidth, ty + textWidth).
    // Issue #165 : lineHeight aligné sur la police effective (compensée fit-zoom).
    const lineHeight = this.getEffectiveFontSize()
    const textWidth = tspanWidths.length ? Math.max(...tspanWidths) : 0
    const numLines = Math.max(1, tspanWidths.length)
    const colWidth = numLines * lineHeight
    const colHeight = textWidth

    const horiz = this._label_values.horiz
    const vert = this._label_values.vert
    const inside_h = this._label_values.inside_horiz
    const inside_v = this._label_values.inside_vert
    const horiz_shift = this._label_values.horiz_shift ?? 0
    const vert_shift = this._label_values.vert_shift ?? 0

    let tx: number
    let ty: number

    if (this._label_values.position_absolute) {
      // En mode absolu, position_x/position_y donnaient le centre du texte horizontal.
      // On garde la même sémantique : centre la colonne tournée sur ce point.
      tx = (this._label_values.position_x ?? 0) - colWidth / 2
      ty = (this._label_values.position_y ?? 0) - colHeight / 2
    } else {
      const shape_w = this.node.getShapeWidthToUse()
      const shape_h = this.node.getShapeHeightToUse()
      const margin_l = this._element.shape_margin_left
      const margin_r = this._element.shape_margin_right
      const margin_t = this._element.shape_margin_top
      const margin_b = this._element.shape_margin_bottom

      if (horiz === 'left') {
        tx = inside_h ? horiz_shift : -colWidth - margin_l + horiz_shift
      } else if (horiz === 'right') {
        tx = inside_h ? shape_w - colWidth + horiz_shift : shape_w + margin_r + horiz_shift
      } else {
        tx = (shape_w - colWidth) / 2 + horiz_shift
      }

      if (vert === 'top') {
        ty = inside_v ? vert_shift : -colHeight - margin_t + vert_shift
      } else if (vert === 'bottom') {
        ty = inside_v ? shape_h - colHeight + vert_shift : shape_h + margin_b + vert_shift
      } else {
        ty = (shape_h - colHeight) / 2 + vert_shift
      }
    }

    // Réancrage neutre : seul le `<text>` est concerné par x/anchor/baseline ;
    // les `<rect>` de background ignorent ces attributs. Idempotent.
    if ((textElement.node() as Element)?.tagName === 'text') {
      textElement
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'text-before-edge')

      // Multiline + text_align : chaque tspan i devient une colonne. Pré-rotation, le
      // tspan i s'étend de x ∈ [0, tspanWidth_i] et y ∈ [i*lh, (i+1)*lh]. Après rotate(-90)
      // CCW, l'axe X pré devient axe -Y post (low x → low -y = haut écran, mais en SVG y
      // augmente vers le bas, donc low x → BAS de la colonne tournée). Donc :
      //   - text_align=left  → caractères flush à x=0 → flush au BAS de la colonne (= début
      //                        de ligne en lecture bottom-to-top)
      //   - text_align=right → caractères flush à x=textWidth → flush au HAUT
      //   - text_align=middle → centrés
      // dx par tspan = (textWidth - tspanWidth) selon text_align.
      // d3-textwrap pose dx=-prev_line_width sur les tspans suivants pour ramener au début
      // de ligne avant retour ; on reprend le contrôle du positionnement via `x` absolu, donc
      // on reset dx=0 (sinon position effective = x + dx, toujours fausse).
      const text_align = this._label_values.text_align
      textElement.selectAll('tspan').nodes().forEach((node, i) => {
        const tspanWidth = tspanWidths[i] ?? 0
        const slack = textWidth - tspanWidth
        let x = 0
        if (text_align === 'middle') {
          x = slack / 2
        } else if (text_align === 'right') {
          x = slack
        }
        d3.select(node as SVGTSpanElement)
          .attr('x', x)
          .attr('dx', 0)
          .attr('text-anchor', 'start')
          .attr('dominant-baseline', 'text-before-edge')
      })
    }

    textElement.attr('transform', `translate(${tx}, ${ty + textWidth}) rotate(-90)`)

    return 0
  }

  protected getIconSize() {
    return [this._element.icon_box_width, this._element.icon_box_width] as [number, number]
    //return [24, 24] as [number, number]
  }

  protected getIconPos(): [number, number] {
    const [icon_width, icon_height] = this.getIconSize()
    const [label_pos_x, label_pos_y, label_anchor, label_baseline] = this.getLabelPos()

    let icon_pos_x = label_pos_x
    if (label_anchor === 'middle') {
      icon_pos_x = label_pos_x - icon_width / 2
    } else if (label_anchor === 'end') {
      icon_pos_x = label_pos_x - icon_width
    }

    let icon_pos_y = label_pos_y
    if (label_baseline === 'text-after-edge') {
      icon_pos_y = label_pos_y - icon_height
    } else if (label_baseline === 'middle') {
      icon_pos_y = label_pos_y - icon_height / 2
    }

    return [icon_pos_x, icon_pos_y]
  }

  // public override drawImage() {
  //   if (!this._element.d3_selection || !this._label_values.image_src) return

  //   // ✅ Appeler la méthode parent qui gère maintenant le background
  //   super.drawImage()

  //   // ✅ Ajustement spécifique pour les nodes
  //   const imageElement = this.d3_selection?.select('image')
  //   if (imageElement && !imageElement.empty()) {
  //     imageElement
  //       .attr('height', this.node.getShapeHeightToUse() + 'px')
  //       .attr('width', this.node.getShapeWidthToUse() + 'px')
  //   }
  // }

  protected getD3Selection() {
    return this._element.d3_selection
  }

  protected getElementId(): string {
    return this._element.id
  }

  protected getLabelPos(): [number, number, string, string] {
    let label_pos_x = 0
    let label_anchor = 'start'
    let label_pos_y: number
    let label_baseline: string

    let label_margin_left = this._element.shape_margin_left
    let label_margin_right = this._element.shape_margin_right
    let label_margin_top = this._element.shape_margin_top
    let label_margin_bottom = this._element.shape_margin_bottom

    if (this.node.shape_type === 'capsule') {
      label_margin_bottom = this.node.getShapeWidthToUse() / 2
      label_margin_top = this.node.getShapeWidthToUse() / 2
    }
    if (this.node.shape_type === 'capsule_h') {
      label_margin_left = this.node.getShapeHeightToUse() / 2
      label_margin_right = this.node.getShapeHeightToUse() / 2
    }

    if (this._label_values.position_absolute) {
      label_pos_x = this._label_values.position_x
      label_anchor = 'middle'
    } else {
      const shape_width = this.node.getShapeWidthToUse()
      const label_pos_dx = this._element.is_selected ? default_selected_stroke_width : 0
      const inside_horiz = this._label_values.inside_horiz

      if (this._label_values.horiz === 'right') {
        if (inside_horiz) {
          label_anchor = 'end'
          label_pos_x = shape_width + this._label_values.horiz_shift
        } else {
          label_anchor = 'start'
          label_pos_x = shape_width + label_pos_dx + label_margin_right + this._label_values.horiz_shift
        }
      } else if (this._label_values.horiz === 'left') {
        if (inside_horiz) {
          label_anchor = 'start'
          label_pos_x = this._label_values.horiz_shift
        } else {
          label_pos_x = 0 - label_margin_left + this._label_values.horiz_shift
          label_anchor = 'end'
        }
      }
      else if (this._label_values.horiz === 'middle') {
        label_pos_x = shape_width / 2 + this._label_values.horiz_shift
        label_anchor = 'middle'
      }
    }

    const label_pos_dy = this._element.is_selected ? default_selected_stroke_width : 0
    const shape_height = this.node.getShapeHeightToUse()
    const inside_vert = this._label_values.inside_vert

    label_pos_y = label_pos_dy + shape_height + this._label_values.vert_shift
    label_baseline = 'text-before-edge'

    if (this._label_values.position_absolute) {
      label_pos_y = this._label_values.position_y
      label_baseline = 'middle'
    } else {
      if (this._label_values.vert === 'top') {
        if (inside_vert) {
          label_pos_y = this._label_values.vert_shift
          label_baseline = 'text-before-edge'
        } else {
          label_pos_y = -label_margin_top + -label_pos_dy + this._label_values.vert_shift
          label_baseline = 'text-after-edge'
        }
      }
      else if (this._label_values.vert === 'bottom') {
        if (inside_vert) {
          label_pos_y = shape_height + this._label_values.vert_shift
          label_baseline = 'text-after-edge'
        } else {
          label_pos_y = label_pos_y + label_margin_bottom
        }
      }
      else if (this._label_values.vert === 'middle') {
        label_pos_y = shape_height / 2 + this._label_values.vert_shift
        label_baseline = 'middle'
      }
    }

    return [label_pos_x, label_pos_y, label_anchor, label_baseline]
  }

  protected updateLabelPos(): void {
    const [label_pos_x, label_pos_y, label_anchor, label_baseline] = this.getLabelPos()
    this.d3_selection?.selectAll(this.getTextSelector())
      .attr('x', label_pos_x)
      .attr('y', label_pos_y)
      .attr('dominant-baseline', label_baseline)
      .attr('text-anchor', label_anchor)

    // ✅ AJOUTER : Mettre à jour aussi les x des tspans
    this.d3_selection?.select(this.getTextSelector()).selectAll('tspan')
      .attr('x', label_pos_x)  // LIGNE AJOUTÉE
      .attr('dominant-baseline', label_baseline)
      .attr('text-anchor', label_anchor)
  }

  protected applyTextStyle(
    selection: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown> | undefined
  ) {
    selection
      ?.attr('fill', this._label_values.color_sustainable ? this._label_values.color : this._element.getShapeColorToUse())
      .attr('font-weight', this._label_values.bold ? 'bold' : 'normal')
      .attr('font-style', this._label_values.italic ? 'italic' : 'normal')
      .attr('font-size', String(this.getEffectiveFontSize()) + 'px')
      .attr('font-family', this._label_values.font_family)
      .style('text-transform', this._label_values.uppercase ? 'uppercase' : 'none')
      .attr('stroke', 'none')
  }
  protected override getImageDimensions(
    icon_pos_x: number,
    icon_pos_y: number,
    icon_width: number,
    icon_height: number
  ): [number, number, number, number] {
    if (this._label_values.inside_vert && this._label_values.inside_horiz) {
      return [0, 0, this.node.getShapeWidthToUse(), this.node.getShapeHeightToUse()]
    }
    return [icon_pos_x, icon_pos_y, icon_width, icon_height]
  }

  protected getTextClasses(): string[] {
    return [this.prefix]
  }

  protected getTextElementId(): string {
    return `${this.prefix}_text_${this._element.id}`
  }

  protected editingEnabled(): boolean {
    return this.enableEditing
  }

  protected override finalizeLabelCreation(
    textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>
  ): void {
    if (this.editingEnabled()) {
      const [label_pos_x, label_pos_y, label_anchor] = this.getLabelPos()

      // La zone d'édition doit avoir la même largeur que la "boîte" du label
      // (label.box_width = la limite de wrap, donc l'enveloppe des poignées
      // de redimensionnement). Le <foreignObject> créé par drawLabelInput
      // utilise déjà cette largeur ; il faut que le positionnement (box_pos_x
      // en fonction de l'ancre) parte de la même valeur, sinon le FO se
      // retrouve décalé latéralement par rapport au label (visible quand le
      // texte naturel est plus court que box_width).
      // Issue #165 : eff_font_size = police compensée (constante à l'écran en
      // mode verrouillé) pour que le positionnement de la box suive les glyphes.
      const eff_font_size = this.getEffectiveFontSize()
      const box_width = this._label_values.box_width

      let box_pos_x = label_pos_x
      let box_pos_y = label_pos_y

      const vert = this._label_values.vert
      if (vert === 'top') {
        const lineCount = (textElement.selectAll('tspan').nodes().length ?? 1) - 1
        box_pos_y -= lineCount * eff_font_size
      } else if (vert === 'middle') {
        box_pos_y -= eff_font_size / 2
      }

      if (label_anchor === 'end') {
        box_pos_x = box_pos_x - box_width
      } else if (label_anchor === 'middle') {
        box_pos_x = box_pos_x - box_width / 2
      }

      this.drawLabelInput(this.d3_selection, box_pos_x, box_pos_y, box_width)
      this.attachDoubleClickEdit(textElement)
    }
  }

  public override setInputLabelInvisible() {
    this.d3_selection?.select(`.${this.prefix}_fo_input`).style('display', 'none')
    this.d3_selection?.select(`.${this.prefix}_text`).style('display', 'inline-block')

    this.drawGenericLabel()
    this._element.drawing_area.application_data.menu_configuration.updateComponentRelatedToNodesSelection()
  }

  protected createLabelGroup(): d3_selection_type | null {
    if (!this._element.d3_selection) return null
    this.d3_selection = this._element.d3_selection.append('g')
      .attr('id', `g_${this.prefix}`)

    return this.d3_selection
  }
}

export class NodeDrawNameLabel extends NodeDrawLabelBase {
  constructor(node: Class_NodeBase, prefix: 'name_label' | 'icon') {
    super(node, prefix)
    this.enableEditing = true
  }

  protected getLabelText(): string {
    if (this._label_values.has_fo) return ''
    if (this._label_values.icon_name != '') return ''
    if (this.prefix === 'name_label' && this._label_values.is_value && this.node instanceof Class_NodeElement) {
      return this.node.name_value_label
    }
    return this.node.name_label_effective
  }

  protected shouldDrawLabel(): boolean {
    return this._label_values.is_visible
  }

  // En mode « value », le libellé affiche une valeur calculée : on désactive
  // l'édition inline (sinon un double-clic renommerait le nœud).
  protected override editingEnabled(): boolean {
    return this.enableEditing && !(this.prefix === 'name_label' && this._label_values.is_value)
  }

  protected onInputChange(value: string): void {
    // En mode label personnalisé, l'édition inline écrit dans le champ de label
    // indépendant (le nœud n'est PAS renommé) ; en mode 'name' elle renomme le
    // nœud (historique) ; pour les sources dérivées (tag/ancestor) le label ne
    // s'édite pas directement → on ignore la saisie.
    if (this.node.name_label_source === 'custom') {
      this.node.name_label_text = value
    } else if (this.node.name_label_source === 'name') {
      this.node.name = value
    }
    // Sync texte → fo_content uniquement en mode rich text
    if (this._label_values.has_fo) {
      this.node.name_label_fo_content = `<p>${value}</p>`
    }
  }
}

export class NodeDrawValueLabel extends NodeDrawLabelBase {
  constructor(node: Class_NodeElement) {
    super(node, 'value_label')
    this.enableEditing = false
  }

  protected get _nodeElement(): Class_NodeElement {
    return this._element as Class_NodeElement
  }

  protected getLabelText(): string {
    if (this._label_values.has_fo) return ''
    if (this._label_values.icon_name != '') return ''
    return this._nodeElement.data_label
  }

  protected shouldDrawLabel(): boolean {
    if (this._element.drawing_area.type_data === 'structure') return false
    if (!this._label_values.is_visible) return false
    if (this._nodeElement.value_label_stick_to_label && !this._nodeElement.name_label_is_visible) return false
    return true
  }

  protected override getLabelPos(): [number, number, string, string] {
    if (!this._nodeElement.value_label_stick_to_label) {
      return super.getLabelPos()
    }
    const nameBBox = this.getStickNameTextBBox()
    if (!nameBBox) return super.getLabelPos()
    return this.computeStickPos(nameBBox)
  }
}

export abstract class LinkDrawLabelBase extends DrawLabelBase {
  protected readonly displayPrefix: DisplayPrefix
  protected _link_control_points: LinkControlPoints
  protected _link_control_points_internal: {
    readonly controlPoints: {
      starting_curve_point: Class_Handler
      ending_curve_point: Class_Handler
      starting_bezier_point: Class_Handler
      ending_bezier_point: Class_Handler
      middle_recycling_point: Class_Handler
      is_dragged: boolean
    }
  }
  private _specific_label_values: LinkLabelSpecificValues

  protected get link(): Class_LinkElement {
    return this._element as Class_LinkElement
  }

  constructor(
    link: Class_LinkElement,
    link_control_points: LinkControlPoints,
    prefix: LabelPrefix
  ) {
    super(link, prefix)
    this._specific_label_values = getLinkLabelSpecificValue(link, prefix)
    this._link_control_points = link_control_points
    this._link_control_points_internal = {
      controlPoints: link_control_points.createInternalAccess().controlPoints()
    }
    this.displayPrefix = prefix === 'name_label' ? 'name' : 'value'
    if (prefix === 'name_label') {
      this._label_values = getNameLabelValues(this.link, prefix)
    } else {
      this._label_values = getValueLabelValues(this.link, prefix)
    }
  }

  /**
   * Rétro-compat liens : `vertical_text` historique vaut +90° sur un lien vertical
   * (texte top→bottom, sens du flux) et −90° sinon (bottom→top). Dès que l'angle
   * explicite `text_angle` est posé, il prime.
   */
  protected override getEffectiveTextAngle(): number {
    const raw = Number((this._label_values as { text_angle?: number }).text_angle ?? 0)
    const clamped = Math.max(-180, Math.min(180, Number.isFinite(raw) ? raw : 0))
    if (clamped !== 0) return clamped
    if (this._label_values.vertical_text) return this.link.is_vertical ? 90 : -90
    return 0
  }

  protected override verticalText(_tspanWidths: number[], textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>): number | undefined {
    const angle = this.getEffectiveTextAngle()
    if (angle === 0) return undefined

    const [label_pos_x, label_pos_y] = this.getLabelPos()
    // Issue #165 : décalage proportionnel à la police effective.
    const dx = this.getEffectiveFontSize() / 2

    // Rotation autour du point d'ancrage du label. L'angle vient du widget
    // (text_angle) ou, à défaut, de la rétro-compat vertical_text (±90 selon is_vertical).
    textElement.attr('transform', `translate(${-dx}, 0) rotate(${angle}, ${label_pos_x}, ${label_pos_y})`)

    return -dx
  }

  protected getD3Selection() {
    return this._element.d3_selection
  }

  protected getElementId(): string {
    return this._element.id
  }

  protected override getTextSelector(): string {
    return `.link_${this.displayPrefix}_text`
  }

  // Côté liens, les <text> portent les classes link_name_text / link_value_text.
  protected override getStickNameTextSelector(): string {
    return '.link_name_text'
  }
  protected override getStickValueTextSelector(): string {
    return '.link_value_text'
  }

  // Côté liens, le name_label est positionné par rapport au flux (bord haut/bas
  // de l'épaisseur) : on ne le recale pas verticalement en top/bottom, la valeur
  // se contente d'y coller. En revanche, quand le nom est centré sur le flux
  // (vert='middle'), on recale le bloc combiné nom+valeur pour qu'il soit centré
  // sur le flux, pas seulement le nom.
  protected override stickRecentersVertically(): boolean {
    return this._label_values.vert === 'middle'
  }

  protected getTextPathSelector(): string {
    return `.link_${this.displayPrefix}_textpath`
  }

  protected getFontSize(): number {
    // Comparaison vs link.thickness en coords locales : on raisonne en taille
    // logique puis on compense le fit-zoom à la fin pour garder une police
    // constante à l'écran (issue #165).
    let font_size = this._label_values.font_size
    if (font_size > this.link.thickness && this.link.is_multi_link) {
      font_size = this.link.thickness
    }
    const comp = this._element.drawing_area?.font_compensation ?? 1
    return font_size * comp
  }

  /**
   * Get the effective thickness at the label's horizontal position.
   * For tapered links, interpolates between source and target thickness.
   */
  protected getThicknessAtLabelPos(): number {
    if (!this.link.isTapered) return this.link.thickness
    const horiz = this._label_values.horiz || 'left'
    if (horiz === 'left') return this.link.thicknessSource
    if (horiz === 'right') return this.link.thicknessTarget
    return (this.link.thicknessSource + this.link.thicknessTarget) / 2
  }

  protected getLabelPos(): [number, number, string, string] {
    let label_pos_y = this.link.position_y_start
    const label_pos_y_end = this.link.position_y_end
    const going_up = label_pos_y_end - label_pos_y < 0
    let label_pos_x = this.link.position_x_start
    let label_anchor = 'start'
    let label_baseline = 'text-before-edge'
    const thickness = this.getThicknessAtLabelPos()

    if (this._label_values.position_absolute) {
      label_pos_x = this._label_values.position_x
    } else {
      if (this._label_values.horiz === 'middle') {
        label_anchor = 'middle'
        label_pos_x = (this._link_control_points_internal.controlPoints.starting_bezier_point.position_x +
          this._link_control_points_internal.controlPoints.ending_bezier_point.position_x) / 2
        label_pos_y = (this._link_control_points_internal.controlPoints.starting_bezier_point.position_y +
          this._link_control_points_internal.controlPoints.ending_bezier_point.position_y) / 2
      } else if (this._label_values.horiz === 'right') {
        label_anchor = 'end'
        label_pos_x = this.link.position_x_end
        label_pos_y = this.link.position_y_end
      }
      // ✅ TOUJOURS appliquer horiz_shift
      label_pos_x += this._label_values.horiz_shift
    }

    if (this._label_values.position_absolute) {
      label_pos_y = this._label_values.position_y
      label_baseline = 'middle'
    } else {
      const inside_vert = this._label_values.inside_vert ?? false
      let shouldPlaceTop = this._label_values.vert === 'top'

      if (this._specific_label_values.pos_auto && this.getFontSize() > thickness) {
        const horiz = this._label_values.horiz || 'left'
        if (horiz === 'left') {
          shouldPlaceTop = !going_up
        } else if (horiz === 'middle' || horiz === 'right') {
          shouldPlaceTop = going_up
        }
      }

      if (shouldPlaceTop) {
        if (inside_vert) {
          label_pos_y -= thickness / 2 - this.getFontSize()
          label_baseline = 'text-before-edge'
        } else {
          label_pos_y -= thickness / 2
          label_baseline = 'text-after-edge'
        }
      } else if (this._label_values.vert === 'bottom' || this._specific_label_values.pos_auto && this.getFontSize() > thickness) {
        if (inside_vert) {
          label_pos_y += thickness / 2
          label_baseline = 'text-after-edge'
        } else {
          label_pos_y += thickness / 2 + this.getFontSize()
          label_baseline = 'text-before-edge'
        }
      } else if (this._label_values.vert === 'middle') {
        label_pos_y += this.getFontSize() / 3
        label_baseline = 'middle'
      }

      // For vertical links with vertical_text, the -90° rotation inverts the text-anchor direction.
      // With -90°: text-anchor:'start' goes UP (outside the link), 'end' goes DOWN (inside).
      // Flip start↔end so horiz positioning places text correctly inside/outside the link.
      // if (this.link.is_vertical && this._label_values.vertical_text) {
      //   if (label_anchor === 'start') label_anchor = 'end'
      //   else if (label_anchor === 'end') label_anchor = 'start'
      // }

      // ✅ TOUJOURS appliquer vert_shift
      label_pos_y += this._label_values.vert_shift
    }

    // For vertical links with vertical_text, remap axes:
    // horiz controls label_pos_x (within link cross-section), vert controls label_pos_y (along flow)
    // Réservé au mode colonne ±90 ; un angle libre tourne autour de l'ancrage normal.
    if (this.link.is_vertical && Math.abs(this.getEffectiveTextAngle()) === 90 && !this._label_values.position_absolute) {
      const cx = this.link.position_x_start
      const half_thickness = this.link.thickness / 2
      if (this._label_values.horiz === 'left') {
        label_pos_x = cx - half_thickness + this._label_values.horiz_shift
        label_anchor = 'start'
      } else if (this._label_values.horiz === 'middle') {
        label_pos_x = cx + this._label_values.horiz_shift
        label_anchor = 'middle'
      } else {
        label_pos_x = cx + half_thickness + this._label_values.horiz_shift
        label_anchor = 'end'
      }
      if (this._label_values.vert === 'top') {
        label_pos_y = this.link.position_y_start + this._label_values.vert_shift
      } else if (this._label_values.vert === 'bottom') {
        label_pos_y = this.link.position_y_end + this._label_values.vert_shift
      } else {
        label_pos_y = (this.link.position_y_start + this.link.position_y_end) / 2 + this._label_values.vert_shift
      }
    }

    return [label_pos_x, label_pos_y, label_anchor, label_baseline]
  }

  protected updateLabelPos() {
    const [label_pos_x, label_pos_y, label_anchor] = this.getLabelPos()
    const textSelector = this.getTextSelector()
    this.d3_selection?.selectAll(textSelector)
      .attr('x', label_pos_x)
      .attr('y', label_pos_y)
      .attr('text-anchor', label_anchor)
  }

  protected applyTextStyle(
    selection: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown> | undefined
  ) {
    // Si la couleur du label est verrouillée (color_sustainable), elle prime toujours.
    // Sinon : quand le label déborde au-dessus du flux (trop gros pour tenir dedans), il prend
    // la couleur du flux (association visuelle ; pas de corps de flux derrière lui pour le porter) ;
    // dans les autres cas, comportement habituel (= couleur du flux quand non verrouillé).
    const fill = this._label_values.color_sustainable
      ? this._label_values.color
      : this._element.getShapeColorToUse()
    selection
      ?.attr('font-size', String(this.getFontSize()) + 'px')
      .attr('font-family', this._label_values.font_family)
      .attr('fill', fill)
      .attr('font-weight', this._label_values.bold ? 'bold' : 'normal')
      .attr('font-style', this._label_values.italic ? 'italic' : 'normal')
      .style('text-transform', this._label_values.uppercase ? 'uppercase' : 'none')
  }

  protected getTextPathSide(): 'left' | 'right' {
    return this.link.source.position_x > this.link.target.position_x ? 'right' : 'left'
  }

  protected getTextPathOffset(): [number, string, number, string] {
    let label_anchor = 'start'
    let label_position = 1
    let label_ortho_position = 0
    let label_dominant_baseline = 'text-after-edge'

    const thickness = this._element.sankey.drawing_area.type_data !== 'structure' ? this.link.thickness : 2
    const inside_vert = this._label_values.inside_vert ?? false  // ✅ AJOUTÉ

    if (this._label_values.position_offset !== 0) {
      label_position = this._label_values.position_offset
    } else {
      if (this._label_values.horiz === 'middle') {
        label_anchor = 'middle'
        label_position = 50
      } else if (this._label_values.horiz === 'right') {
        label_anchor = 'end'
        label_position = 99
      }
    }

    // ✅ CORRIGÉ : Inversion des baselines pour top
    if (this._label_values.vert === 'top' || (this._specific_label_values.pos_auto && this.getFontSize() > this.link.thickness)) {
      if (inside_vert) {
        // À l'intérieur, en haut : le texte descend depuis le bord supérieur
        label_ortho_position = -thickness / 2
        label_dominant_baseline = 'text-before-edge'  // ✅ Le haut du texte touche le bord
      } else {
        // À l'extérieur, en haut : le texte est au-dessus du flux
        label_ortho_position = -thickness / 2
        label_dominant_baseline = 'text-after-edge'  // ✅ Le bas du texte touche le bord
      }
    } else if (this._label_values.vert === 'middle') {
      label_ortho_position = 0
      label_dominant_baseline = 'middle'
    } else if (this._label_values.vert === 'bottom') {
      if (inside_vert) {
        // À l'intérieur, en bas : le texte monte depuis le bord inférieur
        label_ortho_position = thickness / 2
        label_dominant_baseline = 'text-after-edge'  // ✅ Le bas du texte touche le bord
      } else {
        // À l'extérieur, en bas : le texte est en dessous du flux
        label_ortho_position = thickness / 2
        label_dominant_baseline = 'text-before-edge'  // ✅ Le haut du texte touche le bord
      }
    }

    return [label_position, label_anchor, label_ortho_position, label_dominant_baseline]
  }

  protected updateTextPathOffset() {
    const [label_position, label_anchor, label_ortho_position, label_dominant_baseline] = this.getTextPathOffset()
    const ortho_position = label_ortho_position

    const textPathSelector = this.getTextPathSelector()
    const textSelector = this.getTextSelector()

    this._element.d3_selection?.select(textPathSelector).attr('text-anchor', label_anchor)
    this._element.d3_selection?.select(textPathSelector).attr('startOffset', label_position + '%')
    this._element.d3_selection?.select(textSelector).attr('dy', ortho_position)
    this._element.d3_selection?.select(textPathSelector).attr('dominant-baseline', label_dominant_baseline)
  }

  protected getTextClasses(): string[] {
    return ['link', `link_${this.displayPrefix}_text`]
  }

  protected getTextElementId(): string {
    return `${this.displayPrefix}_text_${this._element.id}`
  }

  protected override applySpecialTextContent(
    textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>,
    labelText: string
  ): boolean {
    if (this.link.shape_border_visible) return false
    if (!this.link.source || !this.link.target) return false
    const x0 = this.link.position_x_start
    const y0 = this.link.position_y_start
    const xf = this.link.position_x_end
    const yf = this.link.position_y_end
    const dist = Math.sqrt((xf - x0) * (xf - x0) + (yf - y0) * (yf - y0))
    const show_as_path = /*Math.abs(yf - y0) < 50 ||*/ ((dist / this.link.thickness) > 2)
    // En mode stick_to_label, nom et valeur doivent être en <text> droit pour
    // pouvoir se coller l'un à l'autre — on désactive le rendu textPath.
    if (this._specific_label_values.on_path && show_as_path && this.link.shape_type !== 'bezier_outline' && !this.link.isTapered && !this.link.value_label_stick_to_label) {
      const d3_textpath_selection = textElement.append('textPath')
        .classed('link', true)
        .classed(`link_${this.displayPrefix}`, true)
        .classed(`link_${this.displayPrefix}_textpath`, true)
        .attr('id', `${this.displayPrefix}_textpath_${this._element.id}`)
        .attr('href', '#' + this._element.id)
        .attr('side', this.getTextPathSide())
        .text(String(labelText))
        .attr('spacing', 'exact')
        .attr('method', 'align')

      this.updateTextPathOffset()

      // ✅ Drag spécial pour textPath
      if (this._element.drawing_area.editable) {
        d3_textpath_selection.call(d3.drag<SVGTextPathElement, unknown>()
          .filter(evt => (evt.which == 1) && evt.altKey && this._element.drawing_area.isInSelectionMode())
          .on('start', ev => this.dragTextPathStart(ev))
          .on('drag', ev => this.dragTextPathMove(ev))
          .on('end', ev => this.dragTextPathEnd(ev))
        )
      }

      return true
    }

    return false
  }

  protected override applyTextDragHandlers(
    textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>
  ): void {
    if (this._specific_label_values.on_path) return

    if (this._element.drawing_area.editable) {
      textElement.call(d3.drag<SVGTextElement, unknown>()
        .filter(evt => (evt.which == 1) && evt.altKey && this._element.drawing_area.isInSelectionMode())
        .on('start', ev => this.dragGenericStart(ev))
        .on('drag', ev => this.dragGenericMove(ev))
        .on('end', ev => this.dragGenericEnd(ev))
      )
    }
  }

  protected createLabelGroup(): d3_selection_type | null {
    if (!this.link.source || !this.link.target) return null
    if (!this._element.d3_selection) return null
    this.d3_selection = this._element.d3_selection.append('g')
      .attr('id', `g_${this.displayPrefix}_label`)
      .classed(`link_${this.displayPrefix}`, true)

    return this.d3_selection
  }

  protected override finalizeLabelCreation(
    _textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>
  ): void {
    this.drawFO()
  }

  // =================== DRAG TEXTPATH (SPÉCIFIQUE) ===================

  protected dragTextPathStart(_event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    const old_val: [number, Type_PathLabelHPosition] = [
      this._label_values.position_offset,
      this._label_values.horiz
    ]

    if (this._label_values.position_offset === undefined) {
      const [label_offset] = this.getTextPathOffset()
      this._label_values.position_offset = label_offset
      //this._label_values.horiz = 'dragged'
    }

    const inv = () => {
      this._label_values.position_offset = old_val[0]
      this._label_values.horiz = old_val[1]
    }

    this._element.drawing_area.application_data.history.saveUndo(inv)
  }

  protected dragTextPathMove(event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    const relative_dx = event.dx / (this.link.target.position_x - this.link.source.position_x) * 100
    let newOffset = ((this._label_values.position_offset ?? 0) + relative_dx)

    if (newOffset < 0) newOffset = 0
    else if (newOffset > 100) newOffset = 100

    this._label_values.position_offset = newOffset
    this.updateTextPathOffset()
  }

  protected dragTextPathEnd(_event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    this._element.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()

    const new_val: [number, Type_PathLabelHPosition] = [
      this._label_values.position_offset,
      this._label_values.horiz
    ]

    const redo = () => {
      this._label_values.position_offset = new_val[0]
      this._label_values.horiz = new_val[1]
      this.drawGenericLabel()
    }

    this._element.drawing_area.application_data.history.saveRedo(redo)
    redo()
  }

  protected getIconSize(): [number, number] {
    return [this._element.icon_box_width, this._element.icon_box_width] as [number, number]
  }

  protected getIconPos(): [number, number] {
    const [icon_width, icon_height] = this.getIconSize()
    const [label_pos_x, label_pos_y, label_anchor] = this.getLabelPos()

    let icon_pos_x = label_pos_x
    if (label_anchor === 'middle') {
      icon_pos_x = label_pos_x - icon_width / 2
    } else if (label_anchor === 'end') {
      icon_pos_x = label_pos_x - icon_width
    }

    const icon_pos_y = label_pos_y - icon_height / 2

    return [icon_pos_x, icon_pos_y]
  }

  public override drawImage() {
    if (!this.d3_selection || !this._label_values.image_src) return
    super.drawImage()

    const link = this._element as Class_LinkElement
    const iconSize = link.thickness * 2

    this.d3_selection.attr('width', iconSize + 'px')
  }
}

export class LinkDrawNameLabel extends LinkDrawLabelBase {
  constructor(link: Class_LinkElement, link_control_points: LinkControlPoints, prefix: 'name_label' | 'icon') {
    super(link, link_control_points, prefix)
  }

  protected getLabelText() {
    if (this._label_values.has_fo) return ''
    if (this._label_values.icon_name != '') return ''
    if (this._label_values.is_value) {
      return this.link.data_label(this.prefix as 'name_label')
    }
    const text_source = this.prefix === 'name_label' ? this.link.name_label_text_source : 'custom'
    switch (text_source) {
    case 'none': return ''
    case 'source': return this.link.source?.name_label_effective ?? ''
    case 'target': return this.link.target?.name_label_effective ?? ''
    case 'source_target': {
      const s = this.link.source?.name_label_effective ?? ''
      const t = this.link.target?.name_label_effective ?? ''
      return `${s} → ${t}`
    }
    case 'tag': {
      // Tag de flux assigné au lien dans le groupe choisi (premier si plusieurs).
      const group_id = this.link.name_label_flux_tag_group_id
      if (group_id === '') return this.link.text_value
      const tag = this.link.flux_tags_list.find(t => t.group.id === group_id)
      return tag ? tag.display_name : this.link.text_value
    }
    case 'custom':
    default:
      return this.link.text_value
    }
  }

  protected shouldDrawLabel(): boolean {
    const link_text = this.getLabelText()
    const link_val = this.link.valueCurrent
    const text_source = this.prefix === 'name_label' ? this.link.name_label_text_source : 'custom'

    return (
      this._label_values.is_visible &&
      !this._label_values.has_fo &&
      text_source !== 'none' &&
      ((link_text ?? '') !== '') &&
      !(link_val !== undefined && link_val !== null && link_val <= this._element.drawing_area.filter_label)
    )
  }
}

export class LinkDrawValueLabel extends LinkDrawLabelBase {
  constructor(link: Class_LinkElement, link_control_points: LinkControlPoints) {
    super(link, link_control_points, 'value_label')
    this.enableEditing = true
  }

  protected getLabelText() {
    if (this._label_values.has_fo) return ''
    if (this._label_values.icon_name != '') return ''
    return this.link.data_label(this.prefix as 'value_label')
  }

  protected override getLabelPos(): [number, number, string, string] {
    // En mode stick, la valeur se positionne par rapport à la bbox du <text>
    // du name_label du flux. Sinon, positionnement normal le long du flux.
    if (!this.link.value_label_stick_to_label) {
      return super.getLabelPos()
    }
    const nameBBox = this.getStickNameTextBBox()
    if (!nameBBox) return super.getLabelPos()
    return this.computeStickPos(nameBBox)
  }

  protected override updateLabelPos(): void {
    // En mode stick, la position vient de computeStickPos et est exprimée via
    // la dominant-baseline — que LinkDrawLabelBase.updateLabelPos n'applique pas
    // (les liens encodent l'offset vertical directement dans label_pos_y). Il
    // faut donc l'appliquer ici, sinon la valeur reste sur la ligne du nom.
    if (!this.link.value_label_stick_to_label) {
      super.updateLabelPos()
      return
    }
    const [label_pos_x, label_pos_y, label_anchor, label_baseline] = this.getLabelPos()
    this.d3_selection?.selectAll(this.getTextSelector())
      .attr('x', label_pos_x)
      .attr('y', label_pos_y)
      .attr('text-anchor', label_anchor)
      .attr('dominant-baseline', label_baseline ?? 'text-before-edge')
  }

  protected override getInputInitialValue(): string {
    const v = this.link.valueCurrent
    return v === null || v === undefined ? '' : String(v)
  }

  protected override onInputChange(value: string): void {
    const trimmed = value.trim()
    if (trimmed === '') {
      this.link.valueCurrent = null
      return
    }
    const parsed = Number(trimmed.replace(',', '.'))
    if (!Number.isNaN(parsed)) {
      this.link.valueCurrent = parsed
    }
  }

  public override setInputLabelInvisible() {
    super.setInputLabelInvisible()
    // Typing was wrapped in bypass_redraws, so source/target thickness and
    // positions weren't updated. Redraw them now that editing is done.
    this.link.drawWithNodes()
  }

  protected override finalizeLabelCreation(
    textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>
  ): void {
    super.finalizeLabelCreation(textElement)
    if (!this.enableEditing || this._label_values.has_fo) return

    const [label_pos_x, label_pos_y, label_anchor] = this.getLabelPos()
    // Largeur cohérente avec le <foreignObject> (label.box_width = limite de
    // wrap, enveloppe des poignées). Évite le décalage latéral du FO par
    // rapport au label quand le texte naturel est plus court.
    // Issue #165 : eff_font_size = police compensée (constante à l'écran en mode
    // verrouillé) pour que le positionnement de la box suive les glyphes.
    const eff_font_size = this.getEffectiveFontSize()
    // Éditeur de valeur étroit : une valeur est numérique et courte, la box_width
    // du label (~300px) donnait une zone d'édition démesurée. On part d'une boîte
    // compacte qui grandit avec le contenu (force_nowrap).
    const box_width = 60 * (this._element.drawing_area?.font_compensation ?? 1)

    let box_pos_x = label_pos_x
    if (label_anchor === 'end') box_pos_x -= box_width
    else if (label_anchor === 'middle') box_pos_x -= box_width / 2

    const box_pos_y = label_pos_y - eff_font_size / 2

    this.drawLabelInput(this.d3_selection, box_pos_x, box_pos_y, box_width, 30, true)
    this.attachDoubleClickEdit(textElement)
    // Also handle double-click on the textPath child (when value label follows the flow curve)
    const textPath = textElement.select<SVGTextPathElement>('textPath')
    if (!textPath.empty()) {
      textPath.style('cursor', 'text')
        .on('dblclick', (evt: MouseEvent) => {
          evt.stopPropagation()
          evt.preventDefault()
          this.setInputLabelVisible()
        })
    }
  }

  protected shouldDrawLabel(): boolean {
    const link_val = this.link.valueCurrent

    if (this._element.drawing_area.type_data === 'structure') return false
    if ((link_val ?? 0) < this._element.drawing_area.filter_label) return false

    // const x0 = this.link.position_x_start
    // const y0 = this.link.position_y_start
    // const xf = this.link.position_x_end
    // const yf = this.link.position_y_end
    // const dist = Math.sqrt((xf - x0) * (xf - x0) + (yf - y0) * (yf - y0))

    // if (this.link.shape_orientation !== 'vh' &&
    //   this.link.shape_orientation !== 'hv' /*&&
    //   Math.abs(yf - y0) > 50 &&
    //   (dist / this.link.thickness) < 1.1*/) {
    //   return false
    // }

    return true
  }
}