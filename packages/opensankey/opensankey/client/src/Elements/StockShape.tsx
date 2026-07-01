// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

import type { Class_DrawingArea } from '../types/DrawingArea'
import { Class_NodeBase } from './NodeBase'
import { NodeDrawValueLabel } from './DrawLabel'
import { NodeStyle } from './ElementStyle'
import { format_value } from '../types/Utils'
// Type-only import: avoids a runtime import cycle with Node.tsx (which imports
// this module to instantiate the stock shape).
import type { Class_NodeElement } from './Node'

/**
 * Visual sub-element representing a node's stock.
 *
 * Design (cf SA#1229): rather than a parallel set of `stock_shape_*` styling
 * attributes, the stock is modelled as a node-like element that REUSES the full
 * Class_NodeBase attribute machinery — shape_*, name_label_*, value_label_*,
 * color, icon — so it benefits from every node appearance attribute for free
 * and plugs into the existing node appearance menus.
 *
 * It is NOT a graph node: it is owned by its host Class_NodeElement, drawn as a
 * child of the host's SVG group (so it moves with the node, stacked above it),
 * and never registered in sankey.nodes / drawing_area.list_g_element. Its value
 * is sourced from the host's Class_StockValue (stock_value), not from links.
 */
export class Class_StockShape extends Class_NodeBase {
  protected override class_name = 'gg_stock_shape'
  private _host: Class_NodeElement
  protected _nodeDrawValueLabel: NodeDrawValueLabel
  // Vertical gap (px, node-local frame) between the host node's top and the
  // bottom of the stock shape.
  private _gap: number = 4

  constructor(host: Class_NodeElement, drawing_area: Class_DrawingArea) {
    const default_style = drawing_area.sankey.styles_dict[NodeStyle]
    super('stock_' + host.id, '', drawing_area, default_style)
    this._host = host
    // NodeDrawValueLabel is typed against Class_NodeElement but only reads
    // `data_label` + value_label_* attributes, all provided here.
    this._nodeDrawValueLabel = new NodeDrawValueLabel(this as unknown as Class_NodeElement)
    // Stock value must be readable on the shape: nodes hide their value label by
    // default, but for a stock the value IS the point.
    this.value_label_is_visible = true
  }

  public get host(): Class_NodeElement { return this._host }

  /**
   * Current stock initial value for the selected data tags (year). Result in
   * reconciled/calculated mode, raw data otherwise. Mirrors drawStockBox.
   */
  private _currentStockInitial(): number | null {
    return this._host.stock_initial_value
  }

  /**
   * Seuil d'affichage du label de stock (#seuil px) : compare |stock initial| (mode
   * valeur) ou l'épaisseur rendue scaleValueToPx(|.|) (mode pixel) au seuil
   * `filter_stock[_px]`. Piloté par le même helper que drawStockBox (legacy).
   */
  public override get is_above_label_threshold(): boolean {
    const si = this._currentStockInitial()
    // Hauteur RÉELLEMENT rendue de cette forme de stock (getShapeHeightToUse).
    return this.drawing_area.stockLabelPassesThreshold(
      si === null ? null : Math.abs(si),
      this.getShapeHeightToUse()
    )
  }

  /**
   * Height encodes the stock magnitude, scaled like link thickness (so it
   * updates when the selected year/data tag changes). Overrides the node's
   * shape_min_height-based sizing.
   */
  public override getShapeHeightToUse(): number {
    const si = this._currentStockInitial()
    if (si === null) return 0
    return this.drawing_area.scaleValueToPx(Math.abs(si))
  }

  /**
   * Width matches the host node so the stock sits flush above it.
   */
  public override getShapeWidthToUse(): number {
    return this._host.getShapeWidthToUse()
  }

  /**
   * Visible only when the host carries a stock and is itself visible.
   */
  public override get is_visible(): boolean {
    if (!this._host.has_stock) return false
    if (!this._host.is_visible) return false
    return this._host.stock_value !== null
  }

  /**
   * Attach this shape's d3 group INSIDE the host node's group (instead of the
   * drawing-area parent group), so it follows the node. Replicates the
   * essentials of Class_NodeBase._initDraw without the parent-group lookup.
   */
  protected override _initDraw() {
    const host_sel = this._host.d3_selection
    if (!host_sel) return
    host_sel.select('#' + this.svg_group).remove()
    this.d3_selection = host_sel.append('g').attr('id', this.svg_group)
    this.d3_selection.attr('class', this.class_name).datum(this)
    this.d3_selection.style('display', 'inline')
    this.d3_selection.attr('font-family', this.name_label_font_family)
    this.d3_selection_g_shape = this.d3_selection.append('g').attr('class', 'g_node_shape')
  }

  /**
   * Draw the shape + name label + icon (inherited from Class_NodeBase) plus the
   * stock value label. Event listeners are wired so the shape is selectable
   * (click), but it is NOT independently draggable — it follows its host (drag
   * events are neutralized below).
   */
  protected override _draw() {
    this._initDraw()
    this.setEventsListeners()
    this.drawElements()
    this._nodeDrawValueLabel.drawGenericLabel()
    this.applyPosition()
  }

  /**
   * Select this stock shape and open the node appearance menu bound to it.
   * stopPropagation is essential: the shape's d3 group is a child of the host
   * node's group, so without it the click would bubble up and select the host.
   */
  public override eventSimpleLMBClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    const da = this.drawing_area
    if (!da.editable || !da.isInSelectionMode()) return
    event.stopPropagation()
    const mc = da.application_data.menu_configuration
    da.purgeSelection()
    da.addElementToSelection(this)
    mc.elements_configurable_selected.style = ['element']
    mc.type_menu_configuration_selected = 'style'
    mc.openConfigMenu()
    mc.tab_selected = 'shape'
    mc.ref_to_menu_config_updater.current()
    mc.updateAllComponentsRelatedToNodes()
  }

  // Not independently draggable — it follows the host node. Neutralize drag.
  protected override eventMouseDragStart() { /* no-op */ }
  protected override eventMouseDrag() { /* no-op */ }
  public override eventMouseDragEnd() { /* no-op */ }

  /**
   * Selection feedback: just re-render the shape (NodeDrawShape applies the
   * selected stroke when is_selected). No resize/drag handles.
   */
  public override drawAsSelected() {
    if (!this._nodeDrawShape) return
    this._nodeDrawShape.drawShape()
  }

  /**
   * Stacked flush above the host node, horizontally centered on it. Coordinates
   * are node-local (the group is a child of the host's group).
   */
  public override applyPosition() {
    const host_w = this._host.getShapeWidthToUse()
    const w = this.getShapeWidthToUse()
    const h = this.getShapeHeightToUse()
    const x = (host_w - w) / 2
    const y = -(h + this._gap)
    this.d3_selection?.attr('transform', 'translate(' + x + ', ' + y + ')')
  }

  /**
   * Formatted stock value, read by NodeDrawValueLabel. Mirrors drawStockBox:
   * result in reconciled/calculated mode, raw data otherwise.
   */
  public get data_label(): string {
    const si = this._currentStockInitial()
    if (si === null) return ''
    return format_value(
      this.drawing_area.type_data,
      si,
      this as unknown as Class_NodeElement,
      this.value_label_unit,
      'value_label'
    )
  }
}
