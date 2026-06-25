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

import * as d3 from 'd3'
import { Class_NodeBase } from './NodeBase'

import {
  Class_LinkElement,
  sortLinksElementsByRelativeNodesPositions
} from './Link'
import { Class_Handler } from './Handler'
import { reorganizeIOOrder } from './reorganizeIOOrder'
import { format_value, Type_JSON } from '../types/Utils'
import { default_element_color } from './ElementsAttributesConfig'
import { SankeyAnimation } from '../Algorithms/SankeyAnimation'
import { draw_arrow_part } from './NodeDrawShape'
import { Class_Sankey } from '../types/Sankey'
import { Class_Tag } from '../types/Tag'
import { NodeTooltip } from './TooltipsNode'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_NodeDimension, NodeDimensionsManager } from './NodeDimension'
import { Class_DataTagGroup, Class_LevelTagGroup, Class_TagGroup, Class_ViewTagGroup } from '../types/TagGroup'
import { NodeTagsManager } from './NodeTagsManager'
import { NodeDrawValueLabel } from './DrawLabel'
import { Class_StockValue, Class_ElementValueTree } from './LinkValues'
import { Class_StockShape } from './StockShape'
import { Type_Side } from './ElementsAttributesConfig'
import { NodeStyle, NodeImportCloseStyle, NodeExportCloseStyle, NodeImportExportCloseStyle, LinkImportCloseStyle, LinkExportCloseStyle, LinkImportExportCloseStyle, LinkImportExportAboveBelowStyle, NodeExportBelowStyle, NodeImportAboveStyle, NodeImportExportAboveBelowStyle, NodeSectorStyle, LinkStyle } from './ElementStyle'
// 
// CLASSE PRINCIPALE AVEC LIENS RÉINTÉGRÉS *********************************************

/**
 * Class that define a node element and how to interact with it
 *
 * @class Class_NodeElement
 * @extends {ClassAbstract_NodeElement}
 */
export class Class_NodeElement extends Class_NodeBase {
  public _nodeTooltip: NodeTooltip
  public _nodeDimensionsManager: NodeDimensionsManager
  protected _dimensions_as_parent: { [id: string]: Class_NodeDimension } = {}
  protected _dimensions_as_child: { [id: string]: Class_NodeDimension } = {}
  protected _leveltaggs_as_antitagged: Class_LevelTagGroup[] = []
  protected _nodeDrawValueLabel: NodeDrawValueLabel
  protected d3_selection_g_value_label: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null = null
  protected _sibling_node: Class_NodeElement | undefined = undefined
  public _nodeTagsManager: NodeTagsManager
  protected _tags: Class_Tag[] = []
  protected _taggs_dict: { [x: string]: Class_Tag[] } = {}
  protected _are_related_node_tags_selected: boolean | undefined = undefined
  protected _node_tags_fingerprint: string = ''
  protected _are_related_dimensions_selected: boolean | undefined = undefined
  protected _tooltip_text: string = ''

  // Stock values (parallel to link values but for nodes)
  public has_stock: boolean = false
  // Visibility of the node-like stock shape (SA#1229). Independent of has_stock
  // (whether a stock exists) and of stock_label_is_visible (the legacy stock
  // box). Default false: the shape is only drawn when explicitly enabled.
  public stock_shape_is_visible: boolean = false
  // Editable captions for the legacy stock box labels (SA#1229): replace the
  // former hardcoded "SI:" / "ΔS:" prefixes. Formatting (font/size/...) stays
  // block-wide via stock_label_*; these only customize the caption TEXT.
  public stock_si_caption: string = 'Stock'
  public stock_delta_caption: string = 'Δ Stock'
  // When true, the node's own rectangle height encodes its stock level instead
  // of the flux thickness. Independent of the stock shape (#1229).
  public use_stock_for_height: boolean = false
  // Per-node scale multiplier for stock-driven height, mirroring the flux
  // local_link_scale ("Facteur d'échelle"): the base flux scale is multiplied
  // by this factor (larger factor = shorter node). Default 1.
  public stock_height_scale_factor: number = 1
  public has_material_balance: boolean = true
  public _stock_values: Class_StockValue | Class_ElementValueTree

  // Sankey unitaire : id du flux de référence choisi pour le mode « normalisé » quand
  // CE nœud est le centre de l'unitaire. Mémorisé par nœud (restauré au changement de
  // nœud central dans le modal). En mémoire seulement (non persisté en JSON pour l'instant).
  public unitary_ref_link_id: string | null = null

  // Stock visual sub-element (SA#1229): node-like shape stacked above the node
  // that reuses the full node attribute machinery. Lazily created when the node
  // has a stock. Not a graph node — owned and drawn by this host.
  public _stock_shape: Class_StockShape | null = null

  /**
   * Get current stock value based on selected data tags.
   * Returns the leaf Class_StockValue matching current datatag selection.
   */
  public get stock_value(): Class_StockValue | null {
    if (this._stock_values instanceof Class_StockValue)
      return this._stock_values
    else
      return this._stock_values.getValueForDataTags(this.sankey.selected_data_tags_list) as Class_StockValue | null
  }

  /**
   * Creates an instance of Class_NodeBase.
   */
  constructor(
    id: string,
    name: string,
    drawing_area: Class_DrawingArea
  ) {
    // Init parent class attributes
    //super(id, drawing_area, drawing_area.sankey, 'g_elements_sankey')
    const default_node_style = drawing_area.sankey.styles_dict[NodeStyle]
    super(id, name, drawing_area, default_node_style)
    this._nodeTooltip = new NodeTooltip(this)

    this._nodeDimensionsManager = new NodeDimensionsManager(this)
    this._nodeDrawValueLabel = new NodeDrawValueLabel(this)
    this._nodeTagsManager = new NodeTagsManager(this)
    drawing_area.list_g_element.unshift(this.id)

    // Init stock values tree (expand for each data tag group, like link values)
    this._stock_values = new Class_StockValue(this)
    drawing_area.sankey.data_taggs_list.forEach(data_tagg => {
      this._stock_values = this._stock_values.expand(data_tagg as Class_DataTagGroup) as Class_StockValue | Class_ElementValueTree
    })
  }

  public createValue(
    parent: Class_ElementValueTree | Class_NodeElement
  ) {
    return new Class_StockValue(parent)
  }

  protected _links_visibilities_fingerprint: string = ''
  protected _are_links_visibilities_ok: boolean | undefined = undefined

  private _input_links: { [id: string]: Class_LinkElement } = {}
  private _output_links: { [id: string]: Class_LinkElement } = {}
  private _links_order: Class_LinkElement[] = []
  private _input_links_ending_point: { [id: string]: { x: number, y: number } } = {}
  private _output_links_starting_point: { [id: string]: { x: number, y: number } } = {}
  private _input_links_handle: { [x: string]: Class_Handler } = {}
  private _output_links_handle: { [x: string]: Class_Handler } = {}
  private _link_dragged: Class_LinkElement | undefined

  public resetLinkVisibilitiesMemorization() {
    this._are_links_visibilities_ok = undefined
  }

  protected _orderD3Elements() {
    super._orderD3Elements()
    this._nodeDrawValueLabel.d3_selection?.raise()
    this.d3_selection?.selectAll('.stock_box').raise()
  }

  public copyTagsReferencingFrom(
    node_to_copy: Class_NodeElement,
    matching_tagg: { [_: string]: string },
    matching_tags: { [_: string]: { [_: string]: string } }
  ) {
    this._nodeTagsManager.copyTagsReferencingFrom(node_to_copy, matching_tagg, matching_tags)
  }

  /**
   * Select the right color to use for this node (attribute / style / tags / ...)
   */
  public getShapeColorToUse() {
    // Default color
    let shape_color = default_element_color
    if (
      (this.shape_color_sustainable)
    ) {
      return this.shape_color
    }
    if (!this.sankey.node_taggs_list.some(tagg => tagg.use_colors)) {
      return this.shape_color
    }
    // Is the color defined by tags
    const taggs_activated = this.taggs_list
      .filter(tagg => tagg.use_colors)
    if (taggs_activated.length > 0) {
      const tagg_for_colormap = taggs_activated[0]
      const tags_for_colormap = this.tags_list
        .filter(tag => (tag.group === tagg_for_colormap))
      const selected_tags_for_colormap = tags_for_colormap
        .filter(tag => tag.is_selected)

      if (selected_tags_for_colormap.length === 1) {
        // Exactly one visible tag in the color group: unambiguous, use its color
        shape_color = selected_tags_for_colormap[0].color
      } else {
        // 0 or >=2 visible tags: ambiguous or none, keep the node's own color (#1208)
        shape_color = this.shape_color
      }
    } else {
      // Node doesn't belong to any color-group tag: keep its own color
      shape_color = this.shape_color
    }

    return shape_color
  }


  protected override cleanForDeletion() {
    this._nodeDimensionsManager.cleanForDeletion()
    this._nodeTagsManager.cleanForDeletion()
    // Cleanup stock visual sub-element (SA#1229)
    if (this._stock_shape) {
      this._stock_shape.delete()
      this._stock_shape = null
    }
    // Cleanup links (lignes 282-297)
    this._links_order = []
    Object.values(this._input_links).forEach(link => {
      this.removeInputLink(link)
      link.delete()
    })
    Object.values(this._output_links).forEach(link => {
      this.removeOutputLink(link)
      link.delete()
    })
    this._input_links = {}
    this._output_links = {}
    this._links_order = []
    this._input_links_handle = {}
    this._output_links_handle = {}

    // Call parent
    super.cleanForDeletion()
  }
  protected _copyFrom(_: Class_NodeElement): void {
    super._copyFrom(_)
    this.copyDimensionsFrom(_ as Class_NodeElement)
    this._tooltip_text = _._tooltip_text
    this._nodeTagsManager.copyTagsFrom(_)
  }

  // Stock appearance fields are plain instance fields (not _storage
  // attributes), so the generic copyAttrFrom would drop them — carry them
  // explicitly so view sync (UpdateFrom) and full copies keep them. This
  // includes the stock/delta label captions and the stock-shape visibility,
  // which otherwise stay frozen on the old view after an updateFrom.
  public copyAttrFrom(_: Class_NodeElement): void {
    super.copyAttrFrom(_)
    this.use_stock_for_height = _.use_stock_for_height
    this.stock_height_scale_factor = _.stock_height_scale_factor
    this.stock_shape_is_visible = _.stock_shape_is_visible
    this.stock_si_caption = _.stock_si_caption
    this.stock_delta_caption = _.stock_delta_caption
  }

  public copyDimensionsFrom(node_to_copy: Class_NodeElement) {
    // Vraie copie : on efface d'abord les dimensions actuelles du nœud
    // (sans quoi getOrCreateLowerDimension matche sur (id, parent) et crée
    // une dim supplémentaire au lieu de reparenter quand src et dest
    // diffèrent sur parent_name).
    this._nodeDimensionsManager.dimensions_as_child.forEach(dim => {
      this._nodeDimensionsManager.removeDimensionAsChild(dim)
    })
    this._nodeDimensionsManager.dimensions_as_parent.forEach(dim => {
      this._nodeDimensionsManager.removeDimensionAsParent(dim)
    })
    const json_object = {}
    node_to_copy._nodeDimensionsManager.toJSON(json_object)
    this._nodeDimensionsManager.fromJSON(json_object, false)
  }

  // 🔄 LINK COPY METHODS - RÉINTÉGRÉS DIRECTEMENT
  public keepLinkOrderingFrom(
    node_to_copy: Class_NodeElement,
    matching_link_id: { [_: string]: string; }
  ) {
    const prev_links_order = [...this._links_order]
    this._links_order = []

    // Fill with links that exist in current sankey and avoid duplicates.
    // When source and current share a link id (common case on layout apply),
    // matching_link_id has no entry for it — fall back to the same id.
    node_to_copy.links_order
      .forEach(link_to_copy => {
        const copied_id = matching_link_id[link_to_copy.id] ?? link_to_copy.id
        const link = this.drawing_area.sankey.links_dict[copied_id] as Class_LinkElement
        if ((link !== undefined) && (!this._links_order.includes(link)))
          this._links_order.push(link)
      })

    // after copying node_to_copy._link_orders add the remaining links
    const to_keep = prev_links_order.filter(l => !this._links_order.includes(l))
    to_keep.forEach(l => this._links_order.push(l))

    // Rebuild _input_links / _output_links in the same order as _links_order
    // (input_links_list / output_links_list rely on the dict insertion order).
    const new_input_links: { [id: string]: Class_LinkElement } = {}
    const new_output_links: { [id: string]: Class_LinkElement } = {}
    this._links_order.forEach(link => {
      if (link.id in this._input_links) new_input_links[link.id] = link
      if (link.id in this._output_links) new_output_links[link.id] = link
    })
    // Safety: preserve any link that was in the original dicts but not in _links_order
    Object.entries(this._input_links).forEach(([id, link]) => {
      if (!(id in new_input_links)) new_input_links[id] = link
    })
    Object.entries(this._output_links).forEach(([id, link]) => {
      if (!(id in new_output_links)) new_output_links[id] = link
    })
    this._input_links = new_input_links
    this._output_links = new_output_links
  }
  public dimensionsFromJSON(
    json_node_object: Type_JSON,
    create_tag: boolean,
    matching_nodes_id: { [_: string]: string } = {},
    matching_taggs_id: { [_: string]: string } = {},
    matching_tags_id: { [_: string]: { [_: string]: string } } = {},
  ) {
    this._nodeDimensionsManager.fromJSON(json_node_object, create_tag, matching_nodes_id, matching_taggs_id, matching_tags_id)
  }

  public get sibling() { return this._sibling_node }
  public set sibling(_) { this._sibling_node = _ }

  /**
   * Issue #1225 — remonte la chaîne dim_as_child via les dims désagrégées
   * (force_show_children) jusqu'à trouver une dim is_expanded. Renvoie le
   * parent expansé et le côté de l'expansion, ou null si ce nœud n'est pas
   * (transitivement) enfant d'une expansion.
   *
   * Utilisé en plusieurs endroits (Link.is_allowed_by_container_modes,
   * Link._computeExpansionValue, NodeActions._restackEnglobingDim) pour
   * traiter de la même façon les enfants directs et les petits-enfants
   * d'une expansion en cascade.
   */
  public findExpandedAncestor(): { ancestor: Class_NodeElement, side: 'left' | 'right' } | null {
    const visited = new Set<string>()
    let cur: Class_NodeElement | undefined = this as unknown as Class_NodeElement
    while (cur && !visited.has(cur.id)) {
      visited.add(cur.id)
      let next: Class_NodeElement | undefined
      for (const d of cur.dimensions_as_child) {
        if (d.expanded_left) return { ancestor: d.parent as Class_NodeElement, side: 'left' }
        if (d.expanded_right) return { ancestor: d.parent as Class_NodeElement, side: 'right' }
        if (d.force_show_children) { next = d.parent as Class_NodeElement; break }
      }
      cur = next
    }
    return null
  }
  /**
   * Draw given node on drawing area
   */
  protected _draw() {
    super._draw()
    this._nodeDrawValueLabel.drawGenericLabel()
    // Si la valeur est collée au label : recaler le bloc nom+valeur sur la
    // forme et redessiner le fond du name_label pour qu'il les englobe.
    this._nodeDrawNameLabel.refreshStickLayout()
    this.drawStockBox()
    this._drawStockShape()
  }

  /**
   * Manage the lifecycle of the stock visual sub-element (SA#1229): lazily
   * create it when the node carries a stock, draw it, or remove it otherwise.
   */
  private _drawStockShape() {
    if (this.has_stock && this.stock_shape_is_visible) {
      if (!this._stock_shape) {
        this._stock_shape = new Class_StockShape(this, this.drawing_area)
      }
      this._stock_shape.draw()
    } else if (this._stock_shape) {
      this._stock_shape.unDraw()
    }
  }

  public override drawNameLabel() {
    super.drawNameLabel()
    // Quand stick_to_label est on, la valeur se positionne par rapport à la
    // BBox du <text> du name_label. Une mise à jour isolée du name_label doit
    // donc re-déclencher le draw de la valeur (et le fond combiné).
    if (this.value_label_stick_to_label && this._nodeDrawValueLabel) {
      this._nodeDrawValueLabel.drawGenericLabel()
      this._nodeDrawNameLabel.refreshStickLayout()
    }
  }

  /**
   * Draw stock indicator box near the node shape.
   * Position controlled by stock_horiz, stock_vert, stock_inside.
   * Box width = stock_box_width * nodeWidth (ratio).
   */
  public drawStockBox() {
    this.d3_selection?.selectAll('.stock_box').remove()

    const stock_val = this.stock_value
    if (!this.has_stock || !this.stock_label_is_visible || !stock_val) return
    // Pick data vs result depending on the drawing area display mode,
    // mirroring Link.valueCurrent: 'data' shows raw data, anything else
    // (reconciled / calculated) shows the result, falling back to data.
    const type_data = this.drawing_area.type_data
    const use_result = type_data !== 'data'
    const si = use_result
      ? (stock_val.stockInitialResult ?? stock_val.stockInitialData)
      : stock_val.stockInitialData
    const dv = use_result
      ? (stock_val.stockVariationResult ?? stock_val.stockVariationData)
      : stock_val.stockVariationData
    if (si === null && dv === null) return
    if (!this.d3_selection_g_shape) return
    const nodeW = this.getShapeWidthToUse()
    const nodeH = this.getShapeHeightToUse()

    // Read attributes from config system (stock_label_*)
    const baseFontSize = this.stock_label_font_size
    const horiz = this.stock_label_horiz
    const vert = this.stock_label_vert
    const insideH = this.stock_label_inside_horiz
    const insideV = this.stock_label_inside_vert
    const bgColor = this.stock_label_background_color_sustainable
      ? this.stock_label_background_color : this.getShapeColorToUse()
    const bgVisible = this.stock_label_background_color_visible
    const borderVisible = this.stock_label_background_border_visible
    const borderColor = this.stock_label_background_border_color_sustainable
      ? this.stock_label_background_border_color : this.getShapeColorToUse()
    const borderThickness = this.stock_label_background_border_thickness
    const borderDashed = this.stock_label_background_border_dashed
    const borderRadius = this.stock_label_background_border_radius
    const bgOpacity = this.stock_label_background_opacity
    const textColor = this.stock_label_color

    const padding = 4
    const margin = 4
    // Issue #165 : en mode verrouill\u00e9 la police demand\u00e9e est en px \u00e9cran. On
    // pr\u00e9compense par font_compensation (= 1/k live) pour annuler l'\u00e9chelle SVG
    // appliqu\u00e9e par d3-zoom au rep\u00e8re local ; en mode d\u00e9verrouill\u00e9 elle vaut 1.
    const k_inv = this.drawing_area?.font_compensation ?? 1

    // Build text lines (SF redundant with SI + delta)
    // Use format_value to handle units, decimals, scientific notation, etc.
    const lines: string[] = []
    const unitName = this.stock_label_unit ?? ''
    const formatStock = (v: number) =>
      format_value('free_value', v, this, unitName, 'stock_label')
    // Stacked layout (SA#1229), no width management for now:
    //   <stock caption> / <stock value> / (blank) / <delta caption> / <delta value>
    if (si !== null) {
      if (this.stock_si_caption) lines.push(this.stock_si_caption)
      lines.push(formatStock(si))
    }
    // Blank line separating the stock group from the delta group.
    if (si !== null && dv !== null) lines.push('')
    if (dv !== null) {
      if (this.stock_delta_caption) lines.push(this.stock_delta_caption)
      const sign = dv >= 0 ? '+' : ''
      lines.push(sign + formatStock(dv))
    }
    if (lines.length === 0) return

    // Font size honoured as set (no auto-shrink). Lines are simply stacked and
    // the box auto-sizes to the content (no wrap / box_width for now).
    const fontSize = baseFontSize * k_inv
    const lineH = fontSize + 3
    const boxH = lines.length * lineH + padding * 2

    const g = this.d3_selection?.append('g').classed('stock_box', true)
    const content = g?.append('g')

    let maxW = 0
    lines.forEach((line, i) => {
      const t = content?.append('text')
        .attr('x', 0)
        .attr('y', padding + (i + 1) * lineH - 2)
        .attr('text-anchor', 'start')
        .attr('font-size', fontSize)
        .attr('font-family', this.stock_label_font_family)
        .attr('font-weight', this.stock_label_bold ? 'bold' : 'normal')
        .attr('font-style', this.stock_label_italic ? 'italic' : 'normal')
        .style('text-transform', this.stock_label_uppercase ? 'uppercase' : 'none')
        .attr('fill', textColor)
        .text(line)
      const w = t?.node()?.getBBox().width ?? 0
      if (w > maxW) maxW = w
    })
    const boxW = maxW + 2 * padding

    // Box placement relative to the node (horiz / vert), same rules as before.
    let boxX = 0
    if (horiz === 'left') {
      boxX = insideH ? margin : -boxW - margin
    } else if (horiz === 'right') {
      boxX = insideH ? nodeW - boxW - margin : nodeW + margin
    } else {
      boxX = (nodeW - boxW) / 2
    }
    let boxY = 0
    if (vert === 'top') {
      boxY = insideV ? margin : -boxH - margin
    } else if (vert === 'bottom') {
      boxY = insideV ? nodeH - boxH - margin : nodeH + margin
    } else {
      boxY = (nodeH - boxH) / 2
    }

    // Place the text content inside the box, then draw the background BEHIND it.
    content?.attr('transform', 'translate(' + (boxX + padding) + ', ' + boxY + ')')
    if (this.stock_label_background_visible) {
      g?.insert('rect', ':first-child')
        .attr('x', boxX)
        .attr('y', boxY)
        .attr('width', boxW)
        .attr('height', boxH)
        .attr('rx', borderRadius)
        .attr('fill', bgVisible ? bgColor : 'none')
        .attr('fill-opacity', bgOpacity)
        .attr('stroke', borderVisible ? borderColor : 'none')
        .attr('stroke-width', borderThickness)
        .attr('stroke-dasharray', borderDashed ? '4,2' : '')
    }
  }
  //public get value_label() { return this._nodeDrawValueLabel.getValueLabel() }
  public drawValueLabel() {
    if (!this._nodeDrawValueLabel) return
    this._nodeDrawValueLabel.drawGenericLabel()
    // En mode stick, le <g> de la valeur est recréé sans transform : sans ce
    // recalage il reste à sa position non-ancrée (drift au redraw suivant le
    // toggle). Symétrique de drawNameLabel / drawElements / _draw.
    if (this.value_label_stick_to_label) {
      this._nodeDrawNameLabel?.refreshStickLayout()
    }
    this._orderD3Elements()
  }

  /**
   * Recursive function to return list of descendant nodes
   */
  public getListDescendantOfNode(): Class_NodeElement[] {
    let nodeList: Class_NodeElement[] = []

    this.dimensions_as_parent.forEach(dim => {
      nodeList = [...nodeList, ...(dim.children as Class_NodeElement[])]
      dim.children.forEach(child => {
        const castChild = child as Class_NodeElement
        nodeList = [...nodeList, ...castChild.getListDescendantOfNode()]
      })
    })

    return [...new Set(nodeList)]
  }
  public getListAncestorOfNode(): Class_NodeElement[] {
    let nodeList: Class_NodeElement[] = []
    this.dimensions_as_child.forEach(dim => {
      nodeList = [...nodeList, dim.parent as Class_NodeElement, ...dim.parent.getListAncestorOfNode()]
    })
    return [...new Set(nodeList)]
  }

  // Source 'tag' du label : display_name du tag de nœud assigné au nœud dans le
  // groupe choisi (le premier si plusieurs). Aucun tag dans ce groupe → nom du
  // nœud.
  protected override resolveTagLabel(): string {
    const group_id = this.name_label_tag_group_id
    if (group_id === '') return this.name_label
    const tag = this.tags_list.find(t => t.group.id === group_id)
    return tag ? tag.display_name : this.name_label
  }

  // Source 'ancestor' du label : remonte le long de la dimension choisie
  // (name_label_dimension_id = id d'un groupe de level tags) jusqu'à l'ancêtre
  // racine, et affiche son nom. Dimension vide → première dimension dont le nœud
  // est enfant. Aucun ancêtre → nom de l'élément (il EST déjà la racine).
  protected override resolveAncestorLabel(): string {
    let dim_id = this.name_label_dimension_id
    if (dim_id === '') dim_id = this.dimensions_as_child[0]?.id ?? ''
    if (dim_id === '') return this.name_label
    let current = this.dimensions_as_child.find(d => d.id === dim_id)?.parent as Class_NodeElement | undefined
    if (!current) return this.name_label
    const seen = new Set<string>([this.id])
    while (current && !seen.has(current.id)) {
      seen.add(current.id)
      const next = current.dimensions_as_child.find(d => d.id === dim_id)?.parent as Class_NodeElement | undefined
      if (!next) break
      current = next
    }
    return current ? current.name_label : this.name_label
  }

  // TAGS METHODS =======================================================================
  public hasGivenTag(tag: Class_Tag) { return this._nodeTagsManager.hasGivenTag(tag) }
  public tagsUpdated() { this._are_related_node_tags_selected = undefined }
  public addTag(tag: Class_Tag) {
    this._nodeTagsManager.addTag(tag)
    this.tagsUpdated()
    this.draw()
  }
  public removeTag(tag: Class_Tag) {
    this._nodeTagsManager.removeTag(tag)
    this.tagsUpdated()
    this.draw()
  }

  public get grouped_taggs_dict() { return this._taggs_dict }
  public get tags_list() { return this._tags }
  public get taggs_dict() {
    const taggs: { [_: string]: Class_TagGroup } = {}
    this.tags_list.forEach(tag => {
      if (!taggs[tag.group.id])
        taggs[tag.group.id] = tag.group
    })
    return taggs
  }
  public get tags_dict() {
    const tags: { [_: string]: Class_Tag } = {}
    this.tags_list.forEach(tag => {
      if (!tags[tag.group.id])
        tags[tag.group.id] = tag
    })
    return tags
  }
  public get taggs_list() { return Object.values(this.taggs_dict) }

  public dimensionsUpdated() {
    this._are_related_dimensions_selected = undefined
    this.updateVisibilityFingerprint()
  }

  public addNewDimensionAsParent(_: Class_NodeDimension) {
    this._nodeDimensionsManager.addNewDimensionAsParent(_)
    this.dimensionsUpdated()
  }

  public addNewDimensionAsChild(_: Class_NodeDimension) {
    this._nodeDimensionsManager.addNewDimensionAsChild(_)
    this.dimensionsUpdated()
  }

  public addAsAntiTagged(_: Class_LevelTagGroup) {
    this._nodeTagsManager.addAsAntiTagged(_)
    this.dimensionsUpdated()
  }

  public removeDimensionAsParent(_: Class_NodeDimension) {
    this._nodeDimensionsManager.removeDimensionAsParent(_)
    this.dimensionsUpdated()
  }

  public removeDimensionAsChild(_: Class_NodeDimension) {
    this._nodeDimensionsManager.removeDimensionAsChild(_)
    this.dimensionsUpdated()
  }

  public removeAsAntiTagged(_: Class_LevelTagGroup) {
    this._nodeTagsManager.removeAsAntiTagged(_)
    this.dimensionsUpdated()
  }

  public nodeDimensionAsParent(child: Class_NodeElement) {
    return this._nodeDimensionsManager.nodeDimensionAsParent(child)
  }

  public nodeDimensionAsChild(parent: Class_NodeElement) {
    return this._nodeDimensionsManager.nodeDimensionAsChild(parent)
  }

  // PUBLIC DRAWING METHODS =============================================================

  public unDraw() {
    super.unDraw()
    this.d3_selection?.selectAll('.link_cap_input').remove()
    this.d3_selection?.selectAll('.link_cap_output').remove()
    // 🔄 UNDRAW HANDLES - RÉINTÉGRÉ DIRECTEMENT
    this._links_order
      .forEach(link => {
        link.unDraw()
        if (link.source === this) this._output_links_handle[link.id].unDraw()
        if (link.target === this) this._input_links_handle[link.id].unDraw()
      })
  }

  public drawAsSelected() {
    super.drawAsSelected()
    // Les poignées du label apparaissent au clic sur le <text> du label,
    // pas à la sélection de la forme. Refresh quand même pour que unDraw()
    // soit appelé en cas de désélection.
    this._nodeDrawValueLabel?.refreshLabelResizeHandles()
    this.links_order_visible
      .forEach(link => {
        if (link.source === this) this._output_links_handle[link.id].draw()
        if (link.target === this) this._input_links_handle[link.id].draw()
      })
  }

  // 🔄 DRAW LINKS - RÉINTÉGRÉ DIRECTEMENT
  public drawLinks() {
    this._process_or_bypass(() => this._drawLinks())
  }

  // 🔄 DRAW LINKS ARROW - RÉINTÉGRÉ DIRECTEMENT
  public drawLinksArrow() {
    this._drawLinksArrow()
    this._orderD3Elements()
  }

  public drawLinksSourceNotch() {
    this._drawLinksSourceNotch()
    this._orderD3Elements()
  }

  /**
   * Launch animation from this node
   */
  public launchAnimation() {
    const animation = new SankeyAnimation(this.drawing_area, this)
    animation.launchAnimation()
  }

  // 🔄 SHAPE SIZE METHODS - RÉINTÉGRÉS DIRECTEMENT
  public getShapeWidthToUse() {
    // In structure mode, node size must not be proportional to flow values
    // — links are all drawn at the clamped (>= 2px / minimum_flux) thickness.
    // Use the clamped sum so the node grows with the *number* of links, not
    // their values, and arrows (which also live in clamped space) align with
    // the node edges. This mirrors the natural behaviour of "data + intervals"
    // mode (where valueCurrent is null, so raw thickness is already 2).
    const clamped = this.drawing_area.is_structure_display
    // for_sizing=true : la taille du nœud doit refléter ses propres flux
    // même si ceux-ci sont masqués par un container_mode (cas typique :
    // enfants d'un parent en mode englobant entrées/sorties parent).
    const sum_of_top_thickness = this.getSumOfLinksThickness('top', clamped, true)
    const sum_of_bottom_thickness = this.getSumOfLinksThickness('bottom', clamped, true)
    // super.getShapeWidthToUse() inclut shape_min_width ET, si tied,
    // la largeur de l'enveloppe des enfants attachés (mode englobant).
    return Math.max(sum_of_top_thickness, sum_of_bottom_thickness, super.getShapeWidthToUse())
  }

  /**
   * Current stock initial value used for stock-driven node sizing. Result in
   * reconciled/calculated mode, raw data otherwise (mirrors drawStockBox).
   */
  public currentStockInitialForHeight(): number | null {
    if (!this.has_stock) return null
    const sv = this.stock_value
    if (!sv) return null
    const use_result = this.drawing_area.type_data !== 'data'
    const si = use_result ? (sv.stockInitialResult ?? sv.stockInitialData) : sv.stockInitialData
    return (si === null || si === undefined) ? null : si
  }

  public getShapeHeightToUse() {
    if (this.use_stock_for_height) {
      const si = this.currentStockInitialForHeight()
      if (si !== null) {
        // Mirror the flux local_link_scale: base flux scale divided by the
        // per-node factor (larger factor = shorter node).
        const factor = this.stock_height_scale_factor > 0 ? this.stock_height_scale_factor : 1
        return Math.max(this.drawing_area.scaleValueToPx(Math.abs(si)) / factor, 1)
      }
    }
    const echangeTag = this.sankey.node_taggs_dict['type de noeud'] ? this.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] as Class_Tag : undefined
    const clamped = this.drawing_area.is_structure_display
    const sum_of_left_thickness = this.getSumOfLinksThickness('left', clamped, true)
    const sum_of_right_thickness = this.getSumOfLinksThickness('right', clamped, true)
    if (echangeTag && this.hasGivenTag(echangeTag)) {
      // TODO code to be rewritten when rearchitecturing code for Import Export
      return Math.max(sum_of_left_thickness, sum_of_right_thickness, 3)
    }
    return Math.max(sum_of_left_thickness, sum_of_right_thickness, super.getShapeHeightToUse())
  }

  // 🔄 LINKS METHODS - RÉINTÉGRÉS DIRECTEMENT ========================================

  public hasInputLinks() { return (this.input_links_list.length > 0) }
  public hasOutputLinks() { return (this.output_links_list.length > 0) }

  public hasVisibleInputLinks() { return (this.input_links_list.filter(l=>l.is_visible).length > 0) }
  public hasVisibleOutputLinks() { return (this.output_links_list.filter(l=>l.is_visible).length > 0) }

  public addInputLink(link: Class_LinkElement) {
    if (!this._input_links[link.id]) {
      this._input_links[link.id] = link
      if (this._links_order.includes(link)) {
        console.log('this._links_order.includes(link)')
      } else {
        this._links_order.push(link)
      }
      this.addMovingHandleForGivenLink(link, 'input')
      link.target = this
      this.drawLinks()
      this.drawValueLabel()
    }
  }

  public addOutputLink(link: Class_LinkElement) {
    if (!this._output_links[link.id]) {
      this._output_links[link.id] = link
      if (this._links_order.includes(link)) {
        console.log('this._links_order.includes(link)')
      } else {
        this._links_order.push(link)
      }
      this.addMovingHandleForGivenLink(link, 'output')
      link.source = this
      this.drawLinks()
      this.drawValueLabel()
    }
  }

  public deleteInputLink(link: Class_LinkElement) {
    if (this._input_links[link.id] !== undefined) {
      this.removeInputLink(link)
      link.delete()
      this.draw()
    }
  }

  public deleteOutputLink(link: Class_LinkElement) {
    if (this._output_links[link.id] !== undefined) {
      this.removeOutputLink(link)
      link.delete()
      this.draw()
    }
  }

  public deleteRecyclingLinkOnSameNode(link: Class_LinkElement) {
    if (this._output_links[link.id] !== undefined && this._input_links[link.id] !== undefined) {
      this.removeOutputLink(link)
      this.removeInputLink(link)
      link.delete()
      this.draw()
    }
  }

  public removeInputLink(link: Class_LinkElement) {
    this._input_links_handle[link.id]?.unDraw()
    delete this._input_links_handle[link.id]
    delete this._input_links_ending_point[link.id]
    delete this._input_links[link.id]
    this.removeLinkFromOrderingLinksList(link)
  }

  public removeOutputLink(link: Class_LinkElement) {
    this._output_links_handle[link.id]?.unDraw()
    delete this._output_links_handle[link.id]
    delete this._output_links_starting_point[link.id]
    delete this._output_links[link.id]
    this.removeLinkFromOrderingLinksList(link)
  }

  public swapInputLink(link: Class_LinkElement, node: Class_NodeElement) {
    if (this._input_links[link.id] !== undefined) {
      this.removeInputLink(link)
      node.addInputLink(link)
      this.drawLinks()
      this.drawValueLabel()
    }
  }

  public swapOutputLink(link: Class_LinkElement, node: Class_NodeElement) {
    if (this._output_links[link.id] !== undefined) {
      this.removeOutputLink(link)
      node.addOutputLink(link)
      this.drawLinks()
      this.drawValueLabel()
    }
  }

  public getFirstInputLink() {
    if (this.hasInputLinks()) return this.input_links_list[0]
    else return undefined
  }

  public getFirstOutputLink() {
    if (this.hasOutputLinks()) return this.output_links_list[0]
    else return undefined
  }

  public getInputLinksForGivenSide(_: Type_Side) {
    const links_for_side = this.getLinksOrdered(_)
    const input_links_for_side = links_for_side
      .filter(link => link.id in this._input_links)
    return input_links_for_side
  }

  public getOutputLinksForGivenSide(_: Type_Side) {
    const links_for_side = this.getLinksOrdered(_)
    const output_links_for_side = links_for_side
      .filter(link => link.id in this._output_links)
    return output_links_for_side
  }

  public getLinksOrdered(_: Type_Side) {
    const doublon: Class_LinkElement[] = []
    return this._links_order.filter(link => {
      const check = !doublon.includes(link) &&
        ((link.target === this && link.target_side === _) ||
          (link.source === this && link.source_side === _))
      doublon.push(link)
      return (check)
    })
  }

  public getInputLinkEndingPoint(link: Class_LinkElement) {
    if (this._input_links[link.id] !== undefined) {
      return this._input_links_ending_point[link.id]
    }
    return undefined
  }

  public getOutputLinkStartingPoint(link: Class_LinkElement) {
    if (this._output_links[link.id] !== undefined) {
      return this._output_links_starting_point[link.id]
    }
    return undefined
  }

  /**
   * Re-derive the I/O links order from the relative node positions.
   *
   * @param release_locks When true (default), the anchor locks ("cadenas" of the
   *   "Ordre des flux E/S" menu) set manually on this node are released first and
   *   every link is re-sorted — this is the explicit "recalcul automatique" the lock
   *   tooltip refers to (Réorganiser button, computeAutoSankey, expand/contract…).
   *   When false, locked anchors are PRESERVED : they keep their frozen side and
   *   their slot in the order, and only the unlocked links are re-sorted around
   *   them. A manual node drag passes false so it no longer undoes a user-locked
   *   arrangement (the lock promises "déplacer le noeud opposé ne la repositionnera plus").
   */
  public reorganizeIOLinks(release_locks: boolean = true) {
    if (release_locks)
      this._links_order.forEach(l => l.setAnchorLockedForNode(this, false))
    const echangeTag = this.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    const import_links = this.input_links_list.filter(l => l.source.hasGivenTag(echangeTag as Class_Tag))
    const export_links = this.output_links_list.filter(l => l.target.hasGivenTag(echangeTag as Class_Tag))
    const recycling_links = this._links_order.filter(l => l.shape_is_recycling)

    this._links_order = reorganizeIOOrder(
      this._links_order,
      import_links,
      export_links,
      recycling_links,
      (l) => l.getAnchorLockedForNode(this),
      (link_a, link_b) => sortLinksElementsByRelativeNodesPositions(link_a, link_b, this),
      release_locks
    )
    this.draw()
  }

  public reorganizeIOFromListIds(l: string[]) {
    this._links_order.sort((link_a, link_b) => l.indexOf(link_a.id) - l.indexOf(link_b.id))
  }

  public moveLinkToPositionInOrderBefore(
    link_to_move: Class_LinkElement,
    link_target_pos: Class_LinkElement
  ) {
    if (
      this._links_order.includes(link_to_move) &&
      this._links_order.includes(link_target_pos)
    ) {
      const idx_link_to_move = this._links_order.indexOf(link_to_move)
      this._links_order.splice(idx_link_to_move, 1)
      const idx_link_trgt = this._links_order.indexOf(link_target_pos)
      this._links_order.splice(idx_link_trgt, 0, link_to_move)
      this.draw()
    }
  }

  public moveLinkToPositionInOrderAfter(
    link_to_move: Class_LinkElement,
    link_target_pos: Class_LinkElement
  ) {
    if (
      this._links_order.includes(link_to_move) &&
      this._links_order.includes(link_target_pos)
    ) {
      const idx_link_to_move = this._links_order.indexOf(link_to_move)
      this._links_order.splice(idx_link_to_move, 1)
      const idx_link_trgt = this._links_order.indexOf(link_target_pos)
      this._links_order.splice(idx_link_trgt + 1, 0, link_to_move)
      this.draw()
    }
  }

  protected drawElements() {
    super.drawElements()
    if (!this._nodeDrawValueLabel) return
    this._nodeDrawValueLabel.drawGenericLabel()
    // En mode stick, le fond combiné nom+valeur n'est dessiné que via
    // refreshStickLayout — il faut le rappeler après chaque redraw.
    if (this.value_label_stick_to_label) {
      this._nodeDrawNameLabel?.refreshStickLayout()
    }
    this._drawLinksStartCaps()
  }
  /**
   * Apply node position to it shape in d3
   */
  public applyPosition() {
    if (this.d3_selection !== null) {
      // Relative positioning (import/export nodes glued to a source/target
      // neighbor) is unchanged by PR 3 — this is a separate codepath from
      // parametric and keeps its self-computing semantics.
      if (
        this.shape_position_type === 'relative' &&
        !this._drag && !this.sankey.drawing_area.ghost_link
      ) {
        if (this.hasInputLinks()) {
          const input_link = this.getFirstInputLink()
          const source_node = input_link!.source
          this._position.x = source_node.position_x + this.shape_position_dx + source_node.getShapeWidthToUse()
          this._position.y = source_node.position_y + this.shape_position_dy + source_node.getShapeHeightToUse()
        } else if (this.hasOutputLinks()) {
          const output_link = this.getFirstOutputLink()
          const target_node = output_link!.target
          this._position.x = target_node.position_x + this.shape_position_dx - this.getShapeWidthToUse()
          this._position.y = target_node.position_y + this.shape_position_dy
        }
      }
      // Parametric positioning (PR 3): this used to walk the column to find
      // a `nodeAbove` and compute `position_y = nodeAbove.y + nodeAbove.h +
      // this.shape_position_dy`, with a special "nested container bypass"
      // early-return. All of that is gone. position_y is now computed by
      // `Class_NodePositioning.recomputeParametricLayout` at the start of
      // each `drawElements` pass, so by the time we reach this method the
      // value is fresh — we only need to emit the SVG transform.
      this.input_links_list.filter(l => l.source.shape_position_type == 'relative').forEach(l => l.source.applyPosition())
      this.output_links_list.filter(l => l.target.shape_position_type == 'relative').forEach(l => l.target.applyPosition())

      super.applyPosition()
    }
    // Redraw links
    this._drawLinks()
  }
  // 🔄 PRIVATE DRAWING METHODS - RÉINTÉGRÉS DIRECTEMENT ===========================

  /**
   * Call what is necessary each time a link is modified
   */
  private _drawLinks() {
    // Links positions are modified by nodes's position changes
    if (!this.sankey.drawing_area.bypass_compute_positions)
      this.updateLinksPositions()
    else
      this.sankey.visible_links_list.forEach(l => l.draw())
    // Node shape -> affected if links are added or removed, or if links values change
    this.drawShape()
  }

  /**
   * Function that draw all the arrow of link visible linked to this node
   */
  private _drawLinksArrow() {
    // Target arrows: this node is the target, arrow drawn on link.target_side.
    const target_arrows = this.input_links_list
      .filter(link => link.is_visible && link.shape_is_arrow && link.isRelatedD3SelectionPresentAndSynced)
      .map(link => ({
        link,
        is_source_arrow: false,
        arrow_side: link.target_side,
        link_thickness: link.thicknessTarget,
        is_horizontal_at_anchor: link.is_horizontal || link.is_vertical_horizontal
      }))
    // Source arrows: this node is the source, arrow drawn on link.source_side
    // (independent of the target arrow — a link can carry both; graphical only,
    // the data flow direction is unchanged).
    const source_arrows = this.output_links_list
      .filter(link => link.is_visible && link.shape_arrow_at_source && link.isRelatedD3SelectionPresentAndSynced)
      .map(link => ({
        link,
        is_source_arrow: true,
        arrow_side: link.source_side,
        link_thickness: link.thicknessSource,
        is_horizontal_at_anchor: link.is_horizontal || link.is_horizontal_vertical
      }))
    const list_link_to_add_arrow = [...target_arrows, ...source_arrows]
      .sort((a, b) => this._links_order.indexOf(a.link) - this._links_order.indexOf(b.link))

    const node_height = this.getShapeHeightToUse()
    const node_width = this.getShapeWidthToUse()

    // Two layout modes, driven by drawing_area.arrow_use_standalone_layout :
    //
    // - standalone (default true, issue #681) : each arrow is an independent
    //   triangle, base = link's clamped thickness, base center = link's
    //   actual visible end center. Always aligned with the link stroke,
    //   even when flows are clamped above their raw value (the typical
    //   case where bases on the same side visually overlap).
    //
    // - fan (opt-in, set flag to false) : all arrows on a node side share
    //   a single fan whose total height = Σ clamped thicknesses. Each link
    //   gets a cumulative offset inside that fan, which produces sloped
    //   tips that converge toward the node side center. Looks nice when no
    //   flow gets clamped (raw == clamped), drifts otherwise.
    const use_standalone = this.drawing_area.arrow_use_standalone_layout
    let cum_v_left = 0
    let cum_h_top = 0
    let cum_v_right = 0
    let cum_h_bottom = 0
    const sumLinkLeft = !use_standalone ? this.getSumOfLinksThickness('left', true) : 0
    const sumLinkRight = !use_standalone ? this.getSumOfLinksThickness('right', true) : 0
    const sumLinkTop = !use_standalone ? this.getSumOfLinksThickness('top', true) : 0
    const sumLinkBottom = !use_standalone ? this.getSumOfLinksThickness('bottom', true) : 0

    list_link_to_add_arrow
      .forEach(item => {
        const link = item.link
        const arrow_side = item.arrow_side
        const node_arrow_shift = 0
        const arrows_adjustment = 0

        const link_arrow_side_right = arrow_side == 'right'
        const link_arrow_side_left = arrow_side == 'left'
        const link_arrow_side_top = arrow_side == 'top'
        const link_arrow_side_bottom = arrow_side == 'bottom'

        // Visible link thickness at the anchor (clamped to minimum_flux / 2px).
        const link_value = item.link_thickness
        // Côté source ou cible : déterminé par la nature de cette entrée (un flux
        // peut porter une flèche aux deux extrémités), pas par un drapeau du flux.
        const is_reversed = item.is_source_arrow
        // Arrow length : in fan mode, the user-set shape_arrow_size is used
        // as-is. In standalone, cap the length to link_value so a wide flow
        // doesn't end with a squashed triangle (height/base <<1) — unless
        // the link is structural, in which case keep the full length to
        // produce a "needle" signalling "no quantity" rather than a
        // vanishing 2×2 dot.
        const cap_arrow_length = use_standalone && !link.linkIsStructure()
        const arrow_length = cap_arrow_length
          ? Math.min(link.shape_arrow_size, link_value)
          : link.shape_arrow_size

        let xt: number
        let yt: number
        let arrow_half_height: number
        let arrow_already_computed: number
        if (!use_standalone) {
          // Fan : arrow_half_height = side total / 2, position centered on node side.
          let total_cumul_of_side = 0
          let current_cumul_of_side = 0
          if (link_arrow_side_left) {
            xt = + this.position_x - this.shape_margin_left
            yt = + this.position_y + node_height / 2
            current_cumul_of_side = cum_v_left ; total_cumul_of_side = sumLinkLeft
            cum_v_left += link_value
          }
          else if (link_arrow_side_right) {
            xt = + this.position_x + node_width + this.shape_margin_right
            yt = + this.position_y + node_height / 2
            current_cumul_of_side = cum_v_right ; total_cumul_of_side = sumLinkRight
            cum_v_right += link_value
          }
          else if (link_arrow_side_top) {
            xt = + this.position_x + node_width / 2
            yt = + this.position_y
            current_cumul_of_side = cum_h_top ; total_cumul_of_side = sumLinkTop
            cum_h_top += link_value
          }
          else {
            xt = + this.position_x + node_width / 2
            yt = + this.position_y + node_height
            current_cumul_of_side = cum_h_bottom ; total_cumul_of_side = sumLinkBottom
            cum_h_bottom += link_value
          }
          arrow_half_height = total_cumul_of_side / 2
          arrow_already_computed = current_cumul_of_side
        }
        else {
          // Standalone : base centered on link's actual visible end, half_height = link/2,
          // no cumulative offset → draw_arrow_part renders a clean pointed triangle.
          if (link_arrow_side_left) {
            xt = + this.position_x - this.shape_margin_left
            yt = is_reversed ? link.position_y_start : link.position_y_end
          }
          else if (link_arrow_side_right) {
            xt = + this.position_x + node_width + this.shape_margin_right
            yt = is_reversed ? link.position_y_start : link.position_y_end
          }
          else if (link_arrow_side_top) {
            xt = is_reversed ? link.position_x_start : link.position_x_end
            yt = + this.position_y
          }
          else {
            xt = is_reversed ? link.position_x_start : link.position_x_end
            yt = + this.position_y + node_height
          }
          arrow_half_height = link_value / 2
          arrow_already_computed = 0
        }
        const p5 = [xt, yt]

        const is_horizontal_at_target = item.is_horizontal_at_anchor
        const is_revert = (is_horizontal_at_target && link_arrow_side_right) || (!is_horizontal_at_target && link_arrow_side_bottom)

        const arrow_path = draw_arrow_part(
          arrow_half_height,
          p5,
          +link_value,
          arrow_already_computed,
          is_horizontal_at_target,
          is_revert,
          arrow_length,
          node_arrow_shift,
          arrows_adjustment
        )
        // Router vers la bonne extrémité : chaque flèche est stockée séparément
        // sur le flux pour que cible et source ne s'écrasent pas.
        if (item.is_source_arrow) {
          link.shape_arrow_path_source = arrow_path
        } else {
          link.shape_arrow_path = arrow_path
        }
      })

    //this._drawLinksStartCaps()
  }

  /**
   * Compute the "source notch" (negative arrow) chevrons for this node's
   * outgoing links. All links leaving the same node side share a SINGLE notch:
   * one chevron whose base spans every link's attach band on that side and whose
   * apex is pushed into the ribbon (toward the targets) by the deepest requested
   * notch size. The resulting path is pushed onto every participating link, which
   * draws a background-colored copy on its own d3 selection — so the notch is
   * carved consistently whatever the global element z-order.
   */
  private _drawLinksSourceNotch() {
    const links = this.output_links_list.filter(
      link => link.is_visible && link.shape_source_notch && link.isRelatedD3SelectionPresentAndSynced
    )
    if (links.length === 0)
      return

    const sides: Type_Side[] = ['left', 'right', 'top', 'bottom']
    sides.forEach(side => {
      const side_links = links.filter(link => link.source_side === side)
      if (side_links.length === 0)
        return

      const depth = Math.max(...side_links.map(link => link.shape_source_notch_size ?? 0))
      if (!(depth > 0))
        return

      let path: string
      if (side === 'left' || side === 'right') {
        // Base = vertical segment at the node edge, spanning all attach bands.
        const x_base = side_links[0].position_x_start
        let y_min = Infinity, y_max = -Infinity
        side_links.forEach(link => {
          const half = link.thicknessSource / 2
          y_min = Math.min(y_min, link.position_y_start - half)
          y_max = Math.max(y_max, link.position_y_start + half)
        })
        const apex_x = x_base + (side === 'right' ? depth : -depth)
        const y_mid = (y_min + y_max) / 2
        path = 'M ' + x_base + ',' + y_min
          + ' L ' + apex_x + ',' + y_mid
          + ' L ' + x_base + ',' + y_max
          + ' Z'
      }
      else {
        // Base = horizontal segment at the node edge, spanning all attach bands.
        const y_base = side_links[0].position_y_start
        let x_min = Infinity, x_max = -Infinity
        side_links.forEach(link => {
          const half = link.thicknessSource / 2
          x_min = Math.min(x_min, link.position_x_start - half)
          x_max = Math.max(x_max, link.position_x_start + half)
        })
        const apex_y = y_base + (side === 'bottom' ? depth : -depth)
        const x_mid = (x_min + x_max) / 2
        path = 'M ' + x_min + ',' + y_base
          + ' L ' + x_mid + ',' + apex_y
          + ' L ' + x_max + ',' + y_base
          + ' Z'
      }

      side_links.forEach(link => { link.shape_source_notch_path = path })
    })
  }

  /**
   * Redraw links to recolor them
   */
  protected updateLinksColor() { this._links_order.forEach(link => { if (link.is_visible) link.drawShape() }) }



  // 🔄 PRIVATE HELPER METHODS - RÉINTÉGRÉS DIRECTEMENT ============================

  private getSumOfLinksThickness(side: Type_Side, clamped = false, for_sizing = false) {
    // Per-link cumulation. Structural flows in force_min mode contribute
    // 0 (raw) / minimum_flux (clamped) via Link.thickness*/Raw getters, while
    // value-bearing flows contribute their proportional thickness — so mixed
    // sides naturally size to "sum of real values + minimum_flux per structural".
    let sum = 0
    this.getLinksOrdered(side)
      .filter(link => for_sizing ? link.is_visible_for_sizing_of(this) : link.is_visible)
      .forEach(link => {
        // Default (clamped=false): raw thickness so node height and anchor offsets
        // stay proportional to link values. Visual draw still uses the clamped
        // thickness (min 2px) which can cause overlaps on thin links.
        // clamped=true: used by arrow geometry so linkSize and cumul live in the
        // same space as the visible trait (>= minimum_flux).
        if (clamped) {
          sum = sum + (link.source === this ? link.thicknessSource : link.thicknessTarget)
        } else {
          sum = sum + (link.source === this ? link.thicknessSourceRaw : link.thicknessTargetRaw)
        }
      })
    return sum
  }

  private getLinksStartingPositionOffSet(side: Type_Side) {
    // The cumulative packing also consumes the user-set anchor deltas, so the
    // alignment offset must account for them to keep the stack coherent.
    const occupied = this.getSumOfLinksThickness(side) + this.getSumOfAnchorDeltas(side)
    if (side === 'left' || side === 'right') {
      const free = this.getShapeHeightToUse() - occupied
      // 'top' = flush against the node top, 'center' = historical centering,
      // 'bottom' = flush against the node bottom.
      const align = this.shape_anchor_align_vertical
      const offset = align === 'top' ? 0 : align === 'bottom' ? free : free / 2
      return Math.max(0, offset)
    }
    else {
      const free = this.getShapeWidthToUse() - occupied
      // 'left' = flush against the node left, 'center' = historical centering,
      // 'right' = flush against the node right.
      const align = this.shape_anchor_align_horizontal
      const offset = align === 'left' ? 0 : align === 'right' ? free : free / 2
      return Math.max(0, offset)
    }
  }

  /** Sum of the user-set anchor deltas of this node's visible links on `side`. */
  private getSumOfAnchorDeltas(side: Type_Side) {
    let sum = 0
    this.getLinksOrdered(side)
      .filter(link => link.is_visible)
      .forEach(link => {
        sum += (link.source === this) ? link.source_anchor_delta : link.target_anchor_delta
      })
    return sum
  }

  private removeLinkFromOrderingLinksList(link: Class_LinkElement) {
    this._links_order = this._links_order.filter(l => l.id !== link.id)
  }

  private addMovingHandleForGivenLink(
    link: Class_LinkElement,
    type: 'input' | 'output'
  ) {
    const handle = new Class_Handler(
      ('handle_' + this.id + type + '_' + link.id),
      this.drawing_area,
      this,
      this.dragStartHandlerMoveLink,
      this.dragHandlerMoveLink,
      this.dragEndHandlerMoveLink,
      {
        filled: true,
        color: '#F7AD7C',
        class: 'node_io'
      },
      link
    )
    if (type === 'input')
      this._input_links_handle[link.id] = handle
    else // type === 'output'
      this._output_links_handle[link.id] = handle
  }

  private updateLinksPositions() {
    // Reference position
    const x0 = this.position_x
    const y0 = this.position_y
    // Compute width & Height (based on links values)
    const width = this.getShapeWidthToUse()
    const height = this.getShapeHeightToUse()
    // Offsets positions : based on others links + node's heigth / width
    let dy_right = this.getLinksStartingPositionOffSet('right')
    let dy_left = this.getLinksStartingPositionOffSet('left')
    let dx_top = this.getLinksStartingPositionOffSet('top')
    let dx_bottom = this.getLinksStartingPositionOffSet('bottom')
    // List of links to redraw
    const link_to_redraw: Class_LinkElement[] = [] // avoid recomputation

    const doublon: Class_LinkElement[] = []

    // Loop on all links to compute starting / ending position
    this._links_order
      .forEach(link => {
        // Filter out and undraw unvisible links
        if (!link.is_visible) {
          link.unDraw()
          if (link.source === this) {
            delete this._output_links_starting_point[link.id]
            this._output_links_handle[link.id].unDraw()
          }
          if (link.target === this) {
            delete this._input_links_ending_point[link.id]
            this._input_links_handle[link.id].unDraw()
          }
          return
        }
        // Get positioning parameters - use source or target thickness depending on which end this node is.
        // Raw (non-clamped) thickness is used for anchor offsets so positions stay proportional
        // to link values; the link is drawn with its clamped thickness centered on this anchor.
        const is_source = link.source === this
        const is_self_loop = link.source === this && link.target === this
        const thickness = is_source ? link.thicknessSourceRaw : link.thicknessTargetRaw
        const handle_position_shift = 5
        // Current node is link's source
        if (is_source && !doublon.includes(link)) {
          let link_starting_point: { x: number, y: number } = { x: x0, y: y0 }
          let link_starting_handle_point: { x: number, y: number } = { x: x0, y: y0 }
          // User-set spacing inserted before this anchor (cf. "Ordre des flux E/S").
          const anchor_delta = link.source_anchor_delta
          if (link.source_side === 'right') {
            dy_right = dy_right + anchor_delta
            link_starting_point = { x: (x0 + width), y: (y0 + dy_right + thickness / 2) }
            link_starting_handle_point = { x: (link_starting_point.x + handle_position_shift), y: link_starting_point.y }
            dy_right = dy_right + thickness
          }
          else if (link.source_side === 'left') {
            dy_left = dy_left + anchor_delta
            link_starting_point = { x: x0, y: (y0 + dy_left + thickness / 2) }
            link_starting_handle_point = { x: (link_starting_point.x - handle_position_shift), y: link_starting_point.y }
            dy_left = dy_left + thickness
          }
          else if (link.source_side === 'top') {
            dx_top = dx_top + anchor_delta
            link_starting_point = { x: (x0 + dx_top + thickness / 2), y: y0 }
            link_starting_handle_point = { x: link_starting_point.x, y: link_starting_point.y - handle_position_shift }
            dx_top = dx_top + thickness
          }
          else {  // link.source_side === 'bottom'
            dx_bottom = dx_bottom + anchor_delta
            link_starting_point = { x: (x0 + dx_bottom + thickness / 2), y: (y0 + height) }
            link_starting_handle_point = { x: link_starting_point.x, y: link_starting_point.y + handle_position_shift }
            dx_bottom = dx_bottom + thickness
          }
          // Draw link if position has not been set before
          let need_to_draw = (
            (this._output_links_starting_point[link.id] === undefined) ||
            (!link.isRelatedD3SelectionPresentAndSynced())
          )
          if (!need_to_draw) {
            // Or if diff is at least one pixel
            const dx = this._output_links_starting_point[link.id].x - link_starting_point.x
            const dy = this._output_links_starting_point[link.id].y - link_starting_point.y
            need_to_draw = ((Math.abs(dx) >= 1) || (Math.abs(dy) >= 1))
          }
          // If one of these two conditions match, add link to redraw list
          if (need_to_draw) {
            // Will redraw if it's the case
            link_to_redraw.push(link)
            // Save position
            this._output_links_starting_point[link.id] = link_starting_point
            // Update handle
            if (this._output_links_handle[link.id] !== undefined) {
              this._output_links_handle[link.id]
                .setPosXY(
                  link_starting_handle_point.x,
                  link_starting_handle_point.y)
              // Set a class to the handler corresponding to the source side of link, it is use for css cursor
              this._output_links_handle[link.id]
                .d3_selection?.attr('class', 'node_io ' + link.source_side)
            }
          }
          doublon.push(link)
        }
        // Or current node is link's target
        // For self-loops we run BOTH branches in the same iteration so the
        // ending point is also computed (otherwise _input_links_ending_point
        // is never set and the link's _position_ending stays at (0,0)).
        if ((!is_source || is_self_loop) && link.target === this) {
          let link_ending_point: { x: number, y: number } = { x: x0, y: y0 }
          let link_ending_handle_point: { x: number, y: number } = { x: x0, y: y0 }
          // User-set spacing inserted before this anchor (cf. "Ordre des flux E/S").
          const anchor_delta = link.target_anchor_delta
          if (link.target_side === 'right') {
            dy_right = dy_right + anchor_delta
            link_ending_point = { x: (x0 + width), y: (y0 + dy_right + thickness / 2) }
            link_ending_handle_point = { x: (link_ending_point.x + handle_position_shift), y: link_ending_point.y }
            dy_right = dy_right + thickness
          }
          else if (link.target_side === 'left') {
            dy_left = dy_left + anchor_delta
            link_ending_point = { x: x0, y: (y0 + dy_left + thickness / 2) }
            link_ending_handle_point = { x: (link_ending_point.x - handle_position_shift), y: link_ending_point.y }
            dy_left = dy_left + thickness
          }
          else if (link.target_side === 'top') {
            dx_top = dx_top + anchor_delta
            link_ending_point = { x: (x0 + dx_top + thickness / 2), y: y0 }
            link_ending_handle_point = { x: link_ending_point.x, y: (link_ending_point.y - handle_position_shift) }
            dx_top = dx_top + thickness
          }
          else {  // link.target_side === 'bottom'
            dx_bottom = dx_bottom + anchor_delta
            link_ending_point = { x: (x0 + dx_bottom + thickness / 2), y: (y0 + height) }
            link_ending_handle_point = { x: link_ending_point.x, y: (link_ending_point.y + handle_position_shift) }
            dx_bottom = dx_bottom + thickness
          }
          // Draw link if position has not been set before
          let need_to_draw = (
            (this._input_links_ending_point[link.id] === undefined) ||
            (!link.isRelatedD3SelectionPresentAndSynced())
          )
          if (!need_to_draw) {
            // Or if diff is at least one pixel
            const dx = this._input_links_ending_point[link.id].x - link_ending_point.x
            const dy = this._input_links_ending_point[link.id].y - link_ending_point.y
            need_to_draw = ((Math.abs(dx) >= 1) || (Math.abs(dy) >= 1))
          }
          // If one of these two conditions match, add link to redraw list
          if (need_to_draw) {
            link_to_redraw.push(link)
            // Save position
            this._input_links_ending_point[link.id] = link_ending_point
            // Update handle
            if (this._input_links_handle[link.id] !== undefined) {
              this._input_links_handle[link.id]
                .setPosXY(
                  link_ending_handle_point.x,
                  link_ending_handle_point.y)
              // Set a class to the handler corresponding to the target side of link, it is use for css cursor
              this._input_links_handle[link.id]
                .d3_selection?.attr('class', 'node_io ' + link.target_side)
            }
          }
        }
      })

    // Loop on all visible link to draw
    // Note : Two loops is best because link drawing can trigger other nodes drawLink() methode
    // -> So to avoid mutual blocking between node, it's best to compute first all links positions and then loop
    //    again on links to draw them
    link_to_redraw
      .forEach(link => {
        link.draw()
        //if (link.source === this && this._output_links_handle[link.id]) this._output_links_handle[link.id].draw()
        //if (link.target === this && this._input_links_handle[link.id]) this._input_links_handle[link.id].draw()
      })
  }

  // 🔄 DRAG EVENT HANDLERS FOR LINK HANDLES - RÉINTÉGRÉS DIRECTEMENT =============

  private dragHandlerMoveLink = (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
    if (this._link_dragged && (event.dy !== 0 || event.dx !== 0)) {
      // Get link currently dragged
      const link_dragged = this._link_dragged as Class_LinkElement
      // Search if handler is for a link incoming or outcoming from the node
      const handle_src_or_trgt = (link_dragged.target === this) ? 'target' : 'source'
      const dragged_side = (handle_src_or_trgt === 'target') ? link_dragged.target_side : link_dragged.source_side
      const node_ref_io = (handle_src_or_trgt === 'target') ? this.input_links_list : this.output_links_list

      // Create an array from links_order with only the links in or out the same side of the dragged link
      const list_links_node_side = this._links_order
        .filter(link => {
          const curr_link_side = (handle_src_or_trgt === 'source') ? link.source_side : link.target_side
          return node_ref_io.includes(link) && (curr_link_side == dragged_side)
        })

      // Get index of dragged link in this filtered array
      const idx_drgd_link = list_links_node_side.indexOf(link_dragged)

      // Variable to know in which directions we move the mouse
      const move_to_the_top = Math.sign(event.dy) == -1
      const move_to_the_left = Math.sign(event.dx) == -1

      // If we move the mouse vertically then this variable should be true,
      // it will allow to swap dragged link with previous/next link coming/going on the same side (left/right) to the node_ref
      const is_handler_on_horiz_side = (
        ((handle_src_or_trgt === 'target') && (link_dragged.is_horizontal || link_dragged.is_vertical_horizontal)) ||
        ((handle_src_or_trgt === 'source') && (link_dragged.is_horizontal || link_dragged.is_horizontal_vertical)))

      // If we move the mouse horizontally then this variable should be true ,
      // it will allow to swap dragged link with previous/next link coming/going on the same side (below/above) to the node_ref
      const is_handler_on_vert_side = (
        ((handle_src_or_trgt === 'target') && (link_dragged.is_vertical || link_dragged.is_horizontal_vertical)) ||
        ((handle_src_or_trgt === 'source') && (link_dragged.is_vertical || link_dragged.is_vertical_horizontal)))

      // Move link to the above / left
      if ((
        (move_to_the_top && is_handler_on_horiz_side) ||
        (move_to_the_left && is_handler_on_vert_side)) &&
        idx_drgd_link > 0
      ) {
        // Move dragged link before the previous link coming/going th the node
        const prev_link = list_links_node_side[idx_drgd_link - 1]
        this.moveLinkToPositionInOrderBefore(link_dragged, prev_link)
      }
      // Move link to the below / right
      else if ((
        (!move_to_the_top && is_handler_on_horiz_side) ||
        (!move_to_the_left && is_handler_on_vert_side)) &&
        (idx_drgd_link < list_links_node_side.length - 1)
      ) {
        // Move dragged link after the next link coming/going th the node
        const next_link = list_links_node_side[idx_drgd_link + 1]
        this.moveLinkToPositionInOrderAfter(link_dragged, next_link)
      }
    }
  }

  private dragStartHandlerMoveLink = (_event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
    const handler = _event.subject as Class_Handler
    const link_ref = handler.ref_element_optional
    if (link_ref && link_ref instanceof Class_LinkElement) {
      this._link_dragged = link_ref as Class_LinkElement

      const saveCurrOder = this._links_order.map(l => l.id)
      this.drawing_area.application_data.history.saveUndo(() => {
        this.reorganizeIOFromListIds(saveCurrOder)
        this.draw()
      })
    }
  }

  private dragEndHandlerMoveLink = (_event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
    // The user manually moved this anchor : lock its side so a later move of
    // the opposite node won't reposition it.
    if (this._link_dragged) (this._link_dragged as Class_LinkElement).setAnchorLockedForNode(this, true)
    this._link_dragged = undefined

    const saveCurrOder = this._links_order.map(l => l.id)
    this.drawing_area.application_data.history.saveRedo(() => {
      this.reorganizeIOFromListIds(saveCurrOder)
      this.draw()
    })
  }

  public get is_unitary_tag() {
    const unitary_tagg = this.sankey.view_taggs_dict['unitary']?.id || this.sankey.view_taggs_dict['product_unitary']?.id || this.sankey.view_taggs_dict['sector_unitary']?.id
    if (unitary_tagg) {
      const node_type = this.sankey.node_taggs_dict['type de noeud']
      const productTag = node_type?.tags_dict['produit']
      const sectorTag = node_type?.tags_dict['secteur']
      const is_product = this.hasGivenTag(productTag)
      const is_sector = this.hasGivenTag(sectorTag)
      const the_unitary_tagg = is_product ? 'product_unitary' : is_sector ? 'sector_unitary' : 'unitary'
      return this._taggs_dict[the_unitary_tagg]  && (this._taggs_dict[the_unitary_tagg][0].group as Class_ViewTagGroup).activated && this._taggs_dict[the_unitary_tagg][0].is_selected
    }
    return false
  }

  /**
   * Filtre « mode vue » (cf. Class_ViewTagGroup.view_mode), version PLATE qui
   * court-circuite les level tags. Retourne :
   *  - undefined : aucun groupe view tag en mode filtre, OU ce nœud ne porte aucun
   *    de ces groupes → porte node-tag/dimension normale ;
   *  - true  : le nœud porte une étiquette SÉLECTIONNÉE d'un groupe en mode filtre ;
   *  - false : le nœud porte une autre étiquette (non sélectionnée) d'un tel groupe.
   * (Visibilité seulement — pas de remontée vers les ancêtres ; cf. #173 pour ça.)
   */
  public viewTagVisibility(): boolean | undefined {
    const groups = this.sankey.view_mode_groups
    if (groups.length === 0) return undefined
    // INTERSECTION (AND) de tous les groupes en mode filtre : un nœud n'est visible
    // que s'il satisfait CHAQUE groupe auquel il est concerné. Croiser deux filtres
    // affine donc le détail (on retire globalement des nœuds). Retourne undefined si
    // le nœud n'est concerné par aucun groupe (porte node-tag/dimension normale).
    let concerned = false
    let visible = true
    for (const g of groups) {
      const own = this.grouped_taggs_dict[g.id]
      if (own && own.length > 0) {
        // Porte ce groupe : doit avoir une étiquette sélectionnée.
        concerned = true
        if (!own.some(tag => tag.is_selected)) visible = false
      } else if (this.dimensions_as_parent.some(dim =>
        dim.children.some(c => (c.grouped_taggs_dict[g.id]?.length ?? 0) > 0))) {
        // Ne porte pas le groupe mais a un enfant qui le porte = AGRÉGAT de la vue
        // (ex. nœud niveau 1 « bois ») → caché, sinon il s'afficherait EN PLUS des
        // feuilles (superposition).
        concerned = true
        visible = false
      }
    }
    return concerned ? visible : undefined
  }

  public get are_related_node_tags_selected(): boolean {
    if (
      (this._are_related_node_tags_selected === undefined) ||
      (this.sankey.node_tags_fingerprint !== this._node_tags_fingerprint)
    ) {
      let are_related_node_tags_selected: boolean
      const list_tag = this.tags_list
      if (list_tag.length > 0) {
        let display = true
        Object.entries(this._taggs_dict).filter(([key, _]) => this.sankey.node_taggs_dict[key]).forEach(([_, tag_list]) => {
          display = (tag_list.filter(tag => tag.is_selected).length > 0) ? display : false
        })
        const unitary_tagg = this.sankey.view_taggs_dict['unitary']?.id || this.sankey.view_taggs_dict['product_unitary']?.id || this.sankey.view_taggs_dict['sector_unitary']?.id
        if (unitary_tagg) {
          const node_type = this.sankey.node_taggs_dict['type de noeud']
          const productTag = node_type?.tags_dict['produit']
          const sectorTag = node_type?.tags_dict['secteur']
          const is_product = this.hasGivenTag(productTag)
          const is_sector = this.hasGivenTag(sectorTag)
          const the_unitary_tagg = is_product ? 'product_unitary' : is_sector ? 'sector_unitary' : 'unitary'
          // Un voisin est « le centre unitaire » s'il est sélectionné dans SON propre
          // groupe (produit/secteur), pas dans l'opposé du type de CE nœud. L'ancien
          // code supposait une structure bipartite produit↔secteur : un voisin produit
          // d'un nœud produit (ex. Production biologique → Bois sur pied) était cherché
          // dans 'sector_unitary' → jamais trouvé → nœud masqué.
          const isSelectedUnitaryCenter = (node: Class_NodeElement) => {
            const tagg = node.hasGivenTag(productTag) ? 'product_unitary' : node.hasGivenTag(sectorTag) ? 'sector_unitary' : 'unitary'
            return node.grouped_taggs_dict[tagg] &&
              (node.grouped_taggs_dict[tagg][0].group as Class_ViewTagGroup).activated &&
              node.grouped_taggs_dict[tagg][0].is_selected
          }
          display = /*display &&*/
            ((this._taggs_dict[the_unitary_tagg]  && (this._taggs_dict[the_unitary_tagg][0].group as Class_ViewTagGroup).activated && this._taggs_dict[the_unitary_tagg][0].is_selected)
              || this.input_links_list.filter(l => isSelectedUnitaryCenter(l.source)).length > 0
              || this.output_links_list.filter(l => isSelectedUnitaryCenter(l.target)).length > 0
            )
        }
        are_related_node_tags_selected = display
      } else {
        are_related_node_tags_selected = true
      }

      // Mode filtre vue (généralisation du mécanisme unitaire) : un groupe view tag
      // en mode filtre cache un nœud qui ne porte aucune de ses étiquettes sélectionnées.
      // Décidé ICI (caché par node_tags_fingerprint) pour que la visibilité des liens
      // se recalcule. Court-circuit des level tags via are_related_dimensions_selected.
      const vt = this.viewTagVisibility()
      if (vt !== undefined) are_related_node_tags_selected = vt && are_related_node_tags_selected

      if (are_related_node_tags_selected !== this._are_related_node_tags_selected) {
        this.updateVisibilityFingerprint()
      }

      this._are_related_node_tags_selected = are_related_node_tags_selected
      this._node_tags_fingerprint = this.sankey.node_tags_fingerprint
    }
    return this._are_related_node_tags_selected
  }

  public get is_visible() {
    // Vue courante OU (mode « afficher aussi les flux porteurs de données »)
    // nœud révélé parce qu'attaché à un flux portant une valeur collectée saisie.
    // Dans les deux cas, la porte orphelin s'applique encore.
    if (this.is_visible_without_orphan || this.is_revealed_by_data) {
      return this.orphan_visible
    }
    return false
  }

  /**
   * Vrai si ce nœud n'est PAS visible dans la vue courante mais est révélé par le
   * mode « afficher aussi les flux porteurs de données » (extrémité d'un flux
   * portant une valeur collectée saisie). Sert à reconnecter ces nœuds au
   * diagramme via les flux structurels (cf. `Class_LinkElement.is_visible`).
   * Lit `is_visible_without_orphan` (pas `is_visible`) pour rester non récursif.
   */
  public get is_revealed_by_data(): boolean {
    return this.drawing_area.application_data.reveal_data_links &&
      super.is_visible &&
      !this.is_visible_without_orphan &&
      this.is_attached_to_collected_data_link
  }

  /**
   * Vrai si ce nœud est l'extrémité d'au moins un flux (feuille, sans child_links)
   * porteur d'une valeur collectée saisie. Sert au mode « afficher aussi les flux
   * porteurs de données » (cf. `Class_ApplicationData.reveal_data_links`).
   */
  public get is_attached_to_collected_data_link(): boolean {
    const carries = (l: Class_LinkElement) =>
      Object.values(l.child_links).length == 0 && l.has_collected_data
    return this.input_links_list.some(carries) || this.output_links_list.some(carries)
  }
  public get is_visible_without_orphan() {
    return (
      super.is_visible &&
      this.are_related_node_tags_selected &&
      this.are_related_dimensions_selected &&
      this.are_links_visibilities_ok
    )
  }

  public get links_order_visible(): Class_LinkElement[] { return this._links_order.filter(link => link.is_visible) }
  public get links_order(): Class_LinkElement[] { return this._links_order }

  // TAGS GETTERS =======================================================================


  public get input_links_dict() { return this._input_links }
  public get input_links_list() { return Object.values(this._input_links) }
  public get visible_input_links_list() { return Object.values(this._input_links).filter(l => l.is_visible) }
  public get output_links_dict() { return this._output_links }
  public get output_links_list() { return Object.values(this._output_links) }
  public get visible_output_links_list() { return Object.values(this._output_links).filter(l => l.is_visible) }
  public get link_dragged(): Class_LinkElement | undefined { return this._link_dragged }
  public set link_dragged(value: Class_LinkElement | undefined) { this._link_dragged = value }


  // 🔄 LINKS VISIBILITY - RÉINTÉGRÉ DIRECTEMENT
  private get are_links_visibilities_ok() {
    const links_visibilities_fingerprint = this.getLinksVisibilitiesFingerprint()
    if (
      (this._are_links_visibilities_ok === undefined ||
        links_visibilities_fingerprint !== this._links_visibilities_fingerprint)
    ) {
      const are_links_visibilities_ok = this.checkIfLinksVisibilitiesAreOK()

      if (are_links_visibilities_ok !== this._are_links_visibilities_ok) {
        this.updateVisibilityFingerprint()
      }

      this._are_links_visibilities_ok = are_links_visibilities_ok
      this._links_visibilities_fingerprint = links_visibilities_fingerprint
    }
    return this._are_links_visibilities_ok
  }

  private getLinksVisibilitiesFingerprint() {
    let links_visibilities_fingerprint = ''
    this._links_order
      .forEach(link => links_visibilities_fingerprint = links_visibilities_fingerprint + link.visibility_fingerprint + link.source.visibility_fingerprint + link.target.visibility_fingerprint)
    return links_visibilities_fingerprint + '_' + this.sankey.data_tags_fingerprint
  }

  private get orphan_visible() {
    if (this.visible_input_links_list.length + this.visible_output_links_list.length == 0) {
      // Option globale « Nœuds orphelins » (drawing_area) OU override par-nœud
      // (shape_orphan_node_visible) : un nœud sans lien visible reste affiché.
      if (this.shape_orphan_node_visible || this.drawing_area.show_orphan_nodes) return true
      else return false
    }
    return true
  }

  private checkIfLinksVisibilitiesAreOK() {
    if (this.input_links_list.length + this.output_links_list.length == 0) {
      return true
    }
    const input_links_visible = this.input_links_list.filter(link =>
      (link.is_not_zero || link.is_forced_visible_when_zero) &&
      link.are_related_flux_tags_selected &&
      link.source.are_related_node_tags_selected &&
      link.source.are_related_dimensions_selected
    )
    if (input_links_visible.length > 0) {
      return true
    }
    const output_links_visible = this.output_links_list.filter(link =>
      (link.is_not_zero || link.is_forced_visible_when_zero) &&
      link.are_related_flux_tags_selected &&
      link.target.are_related_node_tags_selected &&
      link.target.are_related_dimensions_selected
    )
    if (output_links_visible.length > 0) {
      return true
    }
    return false
  }

  // SPECIAL METHODS FOR IMPORT/EXPORT =================================================

  // 🔄 SPLIT IMPORT EXPORT - RÉINTÉGRÉ DIRECTEMENT
  public SplitIOrE(importation: boolean) {
    (importation ? this.output_links_list : this.input_links_list).forEach((input_or_output_link) => {
      const extremity_node = importation ? input_or_output_link.target : input_or_output_link.source
      const le_nom = this.name + ' - ' + (importation ? 'Importations' : 'Exportations') + ' - ' + extremity_node.name
      let idTrade = extremity_node.id + '-' + this.id + (importation ? 'Importations' : 'Exportations')
      idTrade = idTrade.replaceAll(' ', '')

      const new_node = (this.sankey as Class_Sankey).addNewNode(idTrade, le_nom)
      new_node.sibling = this

      // Handle dimensions and tags...
      Object.values(this.dimensions_as_child)
        .forEach(dim => {
          const node_parent = dim.parent
          const name = extremity_node.id + '-' + node_parent.id + (importation ? 'Importations' : 'Exportations')
          this._nodeDimensionsManager.getOrCreateLowerDimension(
            this.sankey.nodes_dict[name],
            new_node,
            dim.id
          )
        })

      // Continue with rest of the implementation...
      this.tags_list.forEach(tag => {
        new_node.addTag(tag)
      })

      // Déterminer les styles selon le MODE import/export persisté (drapeau dédié,
      // anciennement déduit à tort de `shape_position_type === 'parametric'`).
      const isAboveBelow = this.drawing_area.import_export_above_below

      const node_importation_style = isAboveBelow ? NodeImportAboveStyle : NodeImportCloseStyle
      const node_exportation_style = isAboveBelow ? NodeExportBelowStyle : NodeExportCloseStyle
      const node_importexport_style = isAboveBelow ? NodeImportExportAboveBelowStyle : NodeImportExportCloseStyle

      const link_importation_style = isAboveBelow ? '' : LinkImportCloseStyle
      const link_exportation_style = isAboveBelow ? '' : LinkExportCloseStyle
      const link_importexport_style = isAboveBelow ? LinkImportExportAboveBelowStyle : LinkImportExportCloseStyle

      // Appliquer les styles au nouveau noeud
      const styles_dict = new_node.sankey.styles_dict
      new_node.replaceStyles([
        styles_dict[NodeSectorStyle],
        styles_dict[node_importexport_style],
        styles_dict[importation ? node_importation_style : node_exportation_style]
      ])

      // Appliquer les styles au lien
      input_or_output_link.replaceStyles([
        styles_dict[LinkStyle],
        styles_dict[link_importexport_style]
      ])

      // Ajouter le style DIRECTIONNEL du flux (Flux import/export collé) dès qu'il est
      // défini (= mode proche ; vide en haut/bas). Auparavant conditionné au mode haut/bas, donc
      // JAMAIS appliqué à la régénération → « Flux import/export collé » présent après setTrade
      // (toggle) mais PERDU au rechargement (splitTrade régénère le flux sans ce style). On
      // s'aligne ainsi sur setTrade qui pose bien [LinkStyle, LinkImportExportCloseStyle, Link(Import|Export)CloseStyle].
      const specific_link_style = importation ? link_importation_style : link_exportation_style
      if (specific_link_style) {
        input_or_output_link.addStyle(styles_dict[specific_link_style])
      }

      input_or_output_link.shape_is_recycling = false

      extremity_node.tags_list.forEach(tag => {
        if (tag.group.id === 'type de noeud') {
          return
        }
        new_node.addTag(tag)
      })

      if (importation) {
        input_or_output_link.source = new_node
        new_node.addOutputLink(input_or_output_link)
      } else {
        input_or_output_link.target = new_node
        new_node.addInputLink(input_or_output_link)
      }
    })
  }

  public setTradeDimensions(importation: boolean) { this._nodeDimensionsManager.setTradeDimensions(importation) }


  protected eventMaintainedClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventMaintainedClick(event)
    this._nodeEventsHandler.handleMaintainedClick(event)
  }

  public drawTooltip() {
    this._nodeTooltip.drawTooltip()
  }

  public get is_child() { return this._nodeDimensionsManager.is_child }
  public get is_parent() { return this._nodeDimensionsManager.is_parent }
  public get is_multi_parent() { return this._nodeDimensionsManager.is_multi_parent }
  public get dimensions_as_parent() { return this._nodeDimensionsManager.dimensions_as_parent }
  public get is_multi_children() { return this._nodeDimensionsManager.is_multi_children }
  public get dimensions_as_child() { return this._nodeDimensionsManager.dimensions_as_child }

  public get are_related_dimensions_selected(): boolean {
    if (this.is_unitary_tag) return true
    // Mode filtre vue (généralisation de is_unitary_tag) : un nœud gouverné par un
    // groupe view tag en mode filtre court-circuite les level tags. Le show/hide réel
    // est décidé par are_related_node_tags_selected (fingerprinté).
    if (this.sankey.view_mode_active && this.viewTagVisibility() !== undefined) return true

    if (this._are_related_dimensions_selected === undefined) {
      const are_related_dimensions_selected = this._nodeDimensionsManager.checkIfRelatedDimensionsAreSelected()

      if (are_related_dimensions_selected !== this._are_related_dimensions_selected) {
        this.updateVisibilityFingerprint()
      }

      this._are_related_dimensions_selected = are_related_dimensions_selected
    }
    return this._are_related_dimensions_selected
  }

  // REMAINING MANAGERS DATA ACCESS =====================================================

  public get internalTagsData() {
    return {
      tags: this._tags,
      taggs_dict: this._taggs_dict,
      leveltaggs_as_antitagged: this._leveltaggs_as_antitagged
    }
  }

  public get internalDimensionsData() {
    return {
      dimensions_as_parent: this._dimensions_as_parent,
      dimensions_as_child: this._dimensions_as_child,

    }
  }

  public get tooltip_text() { return this._tooltip_text }
  public set tooltip_text(_: string) { this._tooltip_text = _ }

  public get data_value() {
    let input_val = 0
    let output_val = 0

    // Filtre par défaut = visibilité réelle. Fallback (cf. data_label) :
    // si tout est masqué par container_mode, on retombe sur la visibilité
    // « intention utilisateur » — sinon la valeur d'un parent englobant en
    // mode `in_children_out_children` (et autres cas symétriques) est nulle.
    const visible = (l: Class_LinkElement) => l.is_visible
    const visible_user = (l: Class_LinkElement) => l.is_visible_ignoring_container_modes
    const has_any_visible =
      this.input_links_list.some(visible) || this.output_links_list.some(visible)
    const filt = has_any_visible ? visible : visible_user

    // Éviter les problèmes de float
    let max_digit_in = 0
    const link_in = this.input_links_list
      .filter(filt)
      .map(link => {
        // For input links, what arrives at the node = target value (or source if no target set)
        const v = link.valueCurrentTarget ?? link.valueCurrent
        const decimal_digit = String(v).split('.')[1]
        if (decimal_digit !== undefined) {
          max_digit_in = Math.max(max_digit_in, decimal_digit.length)
        }
        return v
      })

    const pow_in = Math.pow(10, max_digit_in)
    link_in.forEach(v => input_val += (v ?? 0) * pow_in)

    let max_digit_out = 0
    const link_out = this.output_links_list
      .filter(filt)
      .map(link => {
        const v = link.valueCurrent
        const decimal_digit = String(v).split('.')[1]
        if (decimal_digit !== undefined) {
          max_digit_out = Math.max(max_digit_out, decimal_digit.length)
        }
        return v
      })

    const pow_out = Math.pow(10, max_digit_out)
    link_out.forEach(v => output_val += (v ?? 0) * pow_out)
    return Math.max(input_val / pow_in, output_val / pow_out)
  }

  public get data_label(): string {
    return this._computeValueLabelText('value_label')
  }

  /**
   * Valeur du nœud rendue dans le slot du libellé de nom quand celui-ci est en
   * mode « value » (name_label_is_value). Même calcul que data_label, mais
   * formaté avec les attributs name_label_* (unité, décimales…).
   */
  public get name_value_label(): string {
    return this._computeValueLabelText('name_label')
  }

  private _computeValueLabelText(prefix: 'name_label' | 'value_label'): string {
    let input_val = 0
    let output_val = 0

    // Si TOUS les liens du nœud sont masqués (cas typique : parent englobant
    // en mode `in_children_out_children`, dont les liens d'entrée et de
    // sortie sont tous masqués par container_mode), on retombe sur la
    // visibilité « intention utilisateur » — sinon le label resterait vide
    // et l'utilisateur ne pourrait jamais afficher la valeur du nœud.
    const visible = (l: Class_LinkElement) => l.is_visible
    const visible_user = (l: Class_LinkElement) => l.is_visible_ignoring_container_modes
    const has_any_visible =
      this.input_links_list.some(visible) || this.output_links_list.some(visible)
    const filt = has_any_visible ? visible : visible_user

    // Éviter les problèmes de float
    let max_digit_in = 0
    const link_in = this.input_links_list
      .filter(filt)
      .map(link => {
        // For input links, what arrives at the node = target value (or source if no target set)
        const v = link.valueCurrentTarget ?? link.valueCurrent
        const decimal_digit = String(v).split('.')[1]
        if (decimal_digit !== undefined) {
          max_digit_in = Math.max(max_digit_in, decimal_digit.length)
        }
        return { link, v }
      })

    const pow_in = Math.pow(10, max_digit_in)
    link_in.forEach(({ v }) => input_val += (v ?? 0) * pow_in)

    let max_digit_out = 0
    const link_out = this.output_links_list
      .filter(filt)
      .map(link => {
        // For output links, what leaves the node = source value
        const v = link.valueCurrent
        const decimal_digit = String(v).split('.')[1]
        if (decimal_digit !== undefined) {
          max_digit_out = Math.max(max_digit_out, decimal_digit.length)
        }
        return { link, v }
      })

    const pow_out = Math.pow(10, max_digit_out)
    link_out.forEach(({ v }) => output_val += (v ?? 0) * pow_out)

    const total_in = input_val / pow_in
    const total_out = output_val / pow_out
    const has_in = link_in.length > 0
    const has_out = link_out.length > 0

    const unit = prefix === 'value_label' ? this.value_label_unit : this.name_label_unit
    const fmt = (v: number) => format_value(
      this.sankey.drawing_area.type_data,
      v,
      this,
      unit,
      prefix
    )

    // No flux at all
    if (!has_in && !has_out) return ''
    // Only one direction: show that value
    if (!has_in) return fmt(total_out)
    if (!has_out) return fmt(total_in)
    // Both directions: apply display mode chosen by the user. Le sélecteur
    // in/out/both n'existe que pour value_label ; le name_label reste sur 'both'.
    const mode = prefix === 'value_label' ? this.value_label_in_out_display_mode : 'both'
    if (mode === 'in') return fmt(total_in)
    if (mode === 'out') return fmt(total_out)
    // mode === 'both': if both values render identically (e.g. after significant
    // digits / decimals rounding), collapse to a single value; otherwise show "in→out"
    const fmt_in = fmt(total_in)
    const fmt_out = fmt(total_out)
    if (fmt_in === fmt_out) return fmt_in
    return fmt_in + '\u2192' + fmt_out
  }
  public get selected_elements_list() {
    return this.sankey.drawing_area.selected_nodes_list
  }
  public set_contextualized_element(element: Class_NodeBase) {
    this.drawing_area.node_contextualised = element as Class_NodeElement
  }

  /**
   * Dessine le début des flux sur les ellipses pour un rendu plus fluide
   */
  /**
   * Dessine le début des flux sur les ellipses pour un rendu plus fluide
   */
  private _drawLinksStartCaps() {
    // Caps seulement sur les nœuds elliptiques ; l'activation est par flux
    // (attribut shape_link_caps), pas au niveau du nœud.
    if (this.shape_type !== 'ellipse') return

    // Nettoyer les caps précédents
    this.d3_selection?.selectAll('.link_cap_output').remove()
    this.d3_selection?.selectAll('.link_cap_input').remove()

    const node_width = this.getShapeWidthToUse() + this.shape_margin_right + this.shape_margin_left
    const node_height = this.getShapeHeightToUse() + this.shape_margin_top + this.shape_margin_bottom
    const rx = node_width / 2
    const ry = node_height / 2

    // Tenir compte des marges !
    const cx = (node_width / 2) - this.shape_margin_left
    const cy = (node_height / 2) - this.shape_margin_top

    // Traiter chaque côté
    const sides: Type_Side[] = ['right', 'left', 'top', 'bottom']

    sides.forEach(side => {
      // Récupérer les liens pour ce côté dans l'ordre
      const output_links = this._links_order.filter(link =>
        link.is_visible && link.shape_link_caps && !link.shape_arrow_at_source && link.source === this && link.source_side === side
      )
      const input_links = this._links_order.filter(link =>
        link.is_visible && link.shape_link_caps && !link.shape_is_arrow && link.target === this && link.target_side === side
      )

      // Dessiner les caps pour ce côté
      this._drawCapsForSide(output_links, side, cx, cy, rx, ry, 'output')
      this._drawCapsForSide(input_links, side, cx, cy, rx, ry, 'input')
    })
  }

  /**
   * Dessine les caps pour tous les liens d'un côté donné
   */
  private _drawCapsForSide(
    links: Class_LinkElement[],
    side: Type_Side,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    type: 'input' | 'output'
  ) {
    if (links.length === 0) return

    // Calculer la somme totale des épaisseurs (using appropriate thickness per link end)
    const totalThickness = links.reduce((sum, link) => sum + (link.source === this ? link.thicknessSource : link.thicknessTarget), 0)

    // Offset de départ (tient compte des marges via getLinksStartingPositionOffSet)
    const startOffset = this.getLinksStartingPositionOffSet(side)

    // Cumul en cours
    let currentCumul = 0

    // Dessiner un cap par flux
    links.forEach(link => {
      const thickness = link.source === this ? link.thicknessSource : link.thicknessTarget
      const color = type == 'input' ? link.getArrowColorToUse() : link.getShapeColorToUse()

      // Créer le cap découpé pour ce flux spécifique
      const capPath = this._createEllipseCapPart(
        side, cx, cy, rx, ry,
        startOffset,           // Début de la zone totale
        totalThickness,        // Taille totale
        currentCumul,          // Position actuelle dans la zone
        thickness              // Taille de ce flux
      )

      // Dessiner le cap
      this.d3_selection?.append('path')
        .attr('class', `link_cap_${type}`)
        .attr('d', capPath)
        .attr('fill', color)
        .attr('opacity', link.shape_opacity)
        .attr('stroke', link.shape_border_visible ? link.shape_border_color : 'none')
        .attr('stroke-width', link.shape_border_visible ? link.shape_border_thickness : 0)

      // Incrémenter le cumul
      currentCumul += thickness
    })
  }

  /**
   * Crée une partie découpée du cap d'ellipse (comme draw_arrow_part)
   */
  private _createEllipseCapPart(
    side: Type_Side,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    startOffset: number,
    totalThickness: number,
    currentCumul: number,
    linkThickness: number
  ): string {
    const capLength = 0
  
    if (side === 'right') {
      const y1 = startOffset + currentCumul
      const y2 = startOffset + currentCumul + linkThickness
    
      const term1 = Math.pow((y1 - cy) / ry, 2)
      const term2 = Math.pow((y2 - cy) / ry, 2)
    
      const x1 = cx + rx * Math.sqrt(Math.max(0, 1 - term1))
      const x2 = cx + rx * Math.sqrt(Math.max(0, 1 - term2))
    
      const xRect = cx + rx  // Bord droit du rectangle
      const xOut = xRect + capLength
    
      return `M ${x1},${y1}
            L ${xRect},${y1}
            L ${xOut},${y1}
            L ${xOut},${y2}
            L ${xRect},${y2}
            L ${x2},${y2}
            A ${rx} ${ry} 0 0 0 ${x1},${y1} Z`
    
    } else if (side === 'left') {
      const y1 = startOffset + currentCumul
      const y2 = startOffset + currentCumul + linkThickness
    
      const term1 = Math.pow((y1 - cy) / ry, 2)
      const term2 = Math.pow((y2 - cy) / ry, 2)
    
      const x1 = cx - rx * Math.sqrt(Math.max(0, 1 - term1))
      const x2 = cx - rx * Math.sqrt(Math.max(0, 1 - term2))
    
      const xRect = cx - rx  // Bord gauche du rectangle
      const xOut = xRect - capLength
    
      return `M ${x1},${y1}
            L ${xRect},${y1}
            L ${xOut},${y1}
            L ${xOut},${y2}
            L ${xRect},${y2}
            L ${x2},${y2}
            A ${rx} ${ry} 0 0 1 ${x1},${y1} Z`
    
    } else if (side === 'bottom') {
      const x1 = startOffset + currentCumul
      const x2 = startOffset + currentCumul + linkThickness
    
      const term1 = Math.pow((x1 - cx) / rx, 2)
      const term2 = Math.pow((x2 - cx) / rx, 2)
    
      const y1 = cy + ry * Math.sqrt(Math.max(0, 1 - term1))
      const y2 = cy + ry * Math.sqrt(Math.max(0, 1 - term2))
    
      const yRect = cy + ry  // Bord bas du rectangle
      const yOut = yRect + capLength
    
      return `M ${x1},${y1}
            L ${x1},${yRect}
            L ${x1},${yOut}
            L ${x2},${yOut}
            L ${x2},${yRect}
            L ${x2},${y2}
            A ${rx} ${ry} 0 0 1 ${x1},${y1} Z`
    
    } else { // top
      const x1 = startOffset + currentCumul
      const x2 = startOffset + currentCumul + linkThickness
    
      const term1 = Math.pow((x1 - cx) / rx, 2)
      const term2 = Math.pow((x2 - cx) / rx, 2)
    
      const y1 = cy - ry * Math.sqrt(Math.max(0, 1 - term1))
      const y2 = cy - ry * Math.sqrt(Math.max(0, 1 - term2))
    
      const yRect = cy - ry  // Bord haut du rectangle
      const yOut = yRect - capLength
    
      return `M ${x1},${y1}
            L ${x1},${yRect}
            L ${x1},${yOut}
            L ${x2},${yOut}
            L ${x2},${yRect}
            L ${x2},${y2}
            A ${rx} ${ry} 0 0 0 ${x1},${y1} Z`
    }
  }
}