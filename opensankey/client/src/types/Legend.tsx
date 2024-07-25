// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import { MouseEvent } from 'react'

// Local imports
import { Class_DrawingArea } from './DrawingArea'
import { Class_Element } from './Element'
import { Class_MenuConfig } from './MenuConfig'
import {
  Type_ElementPosition,
  default_element_color,
  default_element_position
} from './Utils'


// CLASS LEGEND *************************************************************************

/**
 * Class that define how we draw legend for a Sankey
 *
 * @export
 * @class Class_Legend
 * @extends {Class_Element}
 */
export class Class_Legend extends Class_Element {

  // PRIVATE ATTRIBUTES =================================================================

  // Legend Class attributes
  private _masked: boolean = false
  private _display_legend_scale: boolean = false
  private _legend_police: number = 16
  private _legend_bg_border: boolean = true
  private _legend_bg_color: string = default_element_color
  private _legend_bg_opacity: number = 100
  private _legend_show_dataTags: boolean = false
  private _node_label_separator: string = ''
  private _width: number = 180

  /**
   * Attribute for legend content positionning.
   * Souldn't have getter & setter public because the variable is only use & computed when we draw the legend
   * @private
   * @type {number}
   * @memberof Class_Legend
   */
  private _dx: number = 0

  /**
   * Attribute for legend content positionning.
   * Souldn't have getter & setter public because the variable is only use & computed when we draw the legend
   * @private
   * @type {number}
   * @memberof Class_Legend
   */
  private _dy: number = 0

  /**
   * Text wrapper function
   * @private
   * @memberof Class_Legend
   */
  private _wrapper = textwrap()
    .bounds({ height: 100, width: this._width })
    .method('tspans')

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Display attributes for legend
   * @protected
   * @type {{
   *     drawing_area: Class_DrawingArea,
   *     position: Type_ElementPosition,
   *   }}
   * @memberof Class_Legend
   */
  protected _display: {
    drawing_area: Class_DrawingArea,
    position: Type_ElementPosition,
  }

  // CONSTRUCTOR ========================================================================
  constructor(
    drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig,
  ) {
    // Init parent class attributes

    //TODO : rename grp_legend to g_legend when legacy code will be deleted as for now some legacy functions might be tirgered when interactiong with DA and look for g_legend
    super('legend', menu_config, 'grp_legend')
    // Init other class attributes
    this._display = {
      drawing_area: drawing_area,
      position: structuredClone(default_element_position)
    }
  }

  // PUBLIC METHODS =====================================================================

  public draw() {
    // Heritance of draw function
    super.draw()
    // Update class attributes
    this.d3_selection?.attr('class', 'gg_legend')
    // Apply styles
    // this.d3_selection?.style('display', this._masked ? 'none' : '')
    // Draw Background
    this.drawLegendBg()
    // Reset content positionning
    this._dx = 0
    this._dy = 0
    // Rebounds text wrapper with width of legend when drawed at this moment
    this._wrapper.bounds({ height: 100, width: this._width })
    // Draw tag color pallette applied to sankey
    this.drawTagDisplayed()
    // Draw explication for data type
    const sankey_has_interval_value = d3.selectAll('.link_value').nodes().filter(lv => d3.select(lv).html().includes('*')).length > 0
    if (sankey_has_interval_value) {
      this.drawInfoDataType()
    }
    // Draw explication for dashed links
    const sankey_has_dashed_links = d3.selectAll('.gg_links').nodes().filter(lv => d3.select(lv).attr('stroke-dasharray') !== '').length > 0
    if (sankey_has_dashed_links) {
      this.drawInfoDashedLink()
    }
    if (this._display_legend_scale) {
      this.drawSankeyScale()
    }
    this.updateLegendHeight()
  }

  public toJSON(){
    const json_object={} as {[_:string]:unknown}
    json_object['mask_legend']=this._masked
    json_object['legend_width']=this.width
    json_object['display_legend_scale']=this._display_legend_scale
    json_object['legend_police']=this._legend_police
    json_object['legend_bg_border']=this._legend_bg_border
    json_object['legend_bg_color']=this._legend_bg_color
    json_object['legend_bg_opacity']=this._legend_bg_opacity
    json_object['legend_show_dataTags']=this._legend_show_dataTags
    return json_object
  }

  /**
   * Setting value of legend from JSON
   *
   * @param {{[_:string]:any} json_object
   * @memberof Class_Legend
   */
  public fromJSON(json_object:{[_:string]:any}){
    // TODO : define default value in case data is not in JSON
    this._masked=json_object['mask_legend']??true
    this.width=json_object['legend_width']??180
    this._display_legend_scale=json_object['display_legend_scale']??false
    this._legend_police=json_object['legend_police']?? 12
    this._legend_bg_border=json_object['legend_bg_border']?? false
    this._legend_bg_color=json_object['legend_bg_color']?? 'grey'
    this._legend_bg_opacity=json_object['legend_bg_opacity']?? 0
    this._legend_show_dataTags=json_object['legend_show_dataTags']?? false
  }

  // PROTECTED METHODS ==================================================================
  protected eventMouseOver(event: MouseEvent<HTMLButtonElement, MouseEvent<Element, globalThis.MouseEvent>>): void {
    this.d3_selection?.select('.zone_for_dragging').attr('stroke-dasharray', '6,6')
    this.d3_selection?.select('.zone_for_dragging').attr('stroke', this._legend_bg_color)
  }

  protected eventMouseOut(event: MouseEvent<HTMLButtonElement, MouseEvent<Element, globalThis.MouseEvent>>): void {
    this.d3_selection?.select('.zone_for_dragging').attr('stroke-dasharray', 'unherit')
    this.d3_selection?.select('.zone_for_dragging').attr('stroke', this._legend_bg_border ? this._legend_bg_color : 'none')
  }

  protected eventMouseDragStart(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
  }

  protected eventMouseDrag(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ): void {
    this._display.position.x += (event.sourceEvent.movementX)
    this._display.position.y += (event.sourceEvent.movementY)
    this.d3_selection?.attr('transform', 'translate(' + (this.position_x) + ',' + this.position_y + ')')
  }

  protected eventMouseDragEnd(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    this.draw()
  }

  // PRIVATE METHODS ====================================================================

  /**
   * Function that draw the background of the legend, it is also used as draggable
   * element to move the legend
   * @private
   * @memberof Class_Legend
   */
  private drawLegendBg() {
    this.d3_selection?.select('.g_drag_zone_leg').remove()
    this.d3_selection?.append('g')
      .attr('class', 'g_drag_zone_leg')
      .append('rect')
      .attr('class', 'zone_for_dragging')
      .attr('width', this._width)
      .attr('height', '0px')
      .attr('rx', '2px')
      .attr('ry', '2px')
      .attr('stroke-dasharray', () => '')
      .attr('stroke', this._legend_bg_border ? this._legend_bg_color : 'none')
      .attr('stroke-width', this._legend_bg_border ? 1 : 0)
      .attr('fill', this._legend_bg_color)
      .attr('fill-opacity', this._legend_bg_opacity / 100)

    //  Event below get triggered when dragging
    // .on('mouseover', () => {
    //   this.d3_selection?.select('.zone_for_dragging').attr('stroke-dasharray', '6,6')
    //   this.d3_selection?.select('.zone_for_dragging').attr('stroke', this._legend_bg_color)
    // })
    // .on('mouseleave', () => {
    //   this.d3_selection?.select('.zone_for_dragging').attr('stroke-dasharray', 'unherit')
    //   this.d3_selection?.select('.zone_for_dragging').attr('stroke', this._legend_bg_border ? this._legend_bg_color : 'none')
    // })
    // .on('mousedown', () => {
    //   this.setSelected()
    //   this.d3_selection?.select('.zone_for_dragging').attr('stroke-dasharray', () => '6,6')
    //   //   draw_legend_handles(applicationData,legend_clicked.current ,h,ComponentUpdater,reDrawLegend,resizeCanvas)
    // })
  }

  /**
   * Function to draw tags in legend that are used in the sankey
   * (when they're activated in the toolbar)
   * @private
   * @memberof Class_Legend
   */
  private drawTagDisplayed() {
    const node_taggs = this.drawing_area.sankey.node_taggs_list
    const flux_taggs = this.drawing_area.sankey.flux_taggs_list
    const data_taggs = this.drawing_area.sankey.data_taggs_list
    // Get all grp tag insind one variable
    const all_tags = [... node_taggs, ... flux_taggs, ... data_taggs]
    all_tags
      .filter(tag_group => tag_group.show_legend)
      .forEach(tag_group => {
        // Ajout du tagGroup.name
        this.d3_selection?.append('text')
          .attr('id', 'GrpTag_title_' + tag_group.id)
          .attr('transform', 'translate(' + this._dx + ',' + this._dy + ' )')
          .attr('x', 0)
          .attr('y', 5 + this._legend_police)
          .text(tag_group.name)
          .attr('style', 'font-weight:bold;font-size:' + this._legend_police + 'px')
          .call(this._wrapper)

        if (document.getElementById('GrpTag_title_' + tag_group.id)?.getElementsByTagName('tspan')[0].innerHTML === '') {
          document.getElementById('GrpTag_title_' + tag_group.id)?.setAttribute('y', '5')
        }

        this._dy += document.getElementById('GrpTag_title_' + tag_group.id)?.getBoundingClientRect().height ?? 0
        const legendElements2 = this.d3_selection?.append('g').attr('transform', 'translate(0,' + this._legend_police + ')')

        tag_group.selected_tags_list.map(t => t) // TODO netoyer code pour enlever ça
          // .filter(tag => {
          //     // Filter tag that have elements associated to them displayed (nodes,links)
          //     if ( Object.keys(flux_taggs).includes(linksColorMap) && Object.keys(flux_taggs).includes(tag_group[0]) ) {
          //         const t = Object.values(links_dict).filter(l => {
          //             const tmp = GetLinkValue(data, l.idLink)
          //             return (
          //                 LinkVisible(l, data, display_nodes) &&
          //                 tmp.tags[linksColorMap] &&
          //                 tmp.tags[linksColorMap].includes(tag[1])
          //             )
          //         }).length
          //         return t > 0
          //     }
          //     if ( Object.keys(node_taggs).includes(nodesColorMap) && Object.keys(node_taggs).includes(tag_group[0]) ) {
          //         const node_visible = NodeVisibleOnsSvg()
          //         const t2 = Object.values(nodes_dict).filter(n => {
          //             return (
          //                 n.tags[nodesColorMap] &&
          //                 n.tags[nodesColorMap].includes(tag[1]) &&
          //                 node_visible.includes(n.idNode) &&
          //                 (n.position !== 'relative')
          //             )
          //         }).length
          //         return t2 > 0
          //     }
          //     if (linksColorMap && linksColorMap.includes('dataTags_')) {
          //         return true
          //     }
          //     return false
          // })
          .forEach((tag) => {
            const tagElement = legendElements2?.append('g')
              .attr('id', 'tag_' + tag.name.replaceAll(' ', '__')
              )
              .attr('transform', () => {
                return 'translate(' + this._dx + ',' + (this._dy) + ')'
              })
            //=========== TODO re implements event on tag displayed elements ========================
            // .on('mouseover', () => {
            //     //Recherche les noeuds liés à des flux dont on survole la légende d'étiquette
            //     const nodes_tied_to_link_hovered = ([] as string[])
            //     Object.values(links_dict).filter(l => {
            //         const tmp = GetLinkValue(data, l.idLink)
            //         return tmp.tags[tag_group[0]] && tmp.tags[tag_group[0]].includes(tag[1])
            //     }).forEach(el => {
            //         nodes_tied_to_link_hovered.push(el.idSource)
            //         nodes_tied_to_link_hovered.push(el.idTarget)
            //     })
            //     //Reduit l'opacité de tous les flux qui n'ont pas l'étiquette survolé
            //     Object.values(links_dict).filter(l => {
            //         const tmp = GetLinkValue(data, l.idLink)
            //         return !(tmp.tags[tag_group[0]] && tmp.tags[tag_group[0]].includes(tag[1]))
            //     }).forEach(el => {
            //         d3.selectAll(' .opensankey #path_' + el.idLink).attr('stroke-opacity', 0.1)
            //         d3.selectAll(' .opensankey #gg_' + el.idLink + ' text').style('opacity', 0.1)
            //         d3.selectAll(' .opensankey #path_' + el.idLink + '_arrow').attr('stroke-opacity', 0.1)
            //         d3.selectAll(' .opensankey #path_' + el.idLink + '_arrow').attr('opacity', 0.1)
            //     })
            //     //Recupère le groupTag actif, si il existe, en régardant lequel a sa légende d'afficher (pour le moment il ne peut y avoir que un groupTag de sélectionné à a fois)
            //     const tmp = Object.entries(node_taggs).filter(n => {
            //         return n[1].show_legend
            //     })
            //     let link_tied_to_node_hovered = ([] as string[])
            //     const tmp2 = (tmp.length > 0) ? tmp[0][0] : ''
            //     if (tmp.length > 0) {
            //         //Récupère les flux entrant/sortant  des noeuds dont on survole l'étiquette
            //         Object.values(nodes_dict).filter(n => {
            //             return (n.tags[tmp2] && n.tags[tmp2].includes(tag[1]))
            //         }).forEach(el => {
            //             link_tied_to_node_hovered = link_tied_to_node_hovered.concat(el.outputLinksId)
            //             link_tied_to_node_hovered = link_tied_to_node_hovered.concat(el.inputLinksId)
            //         })
            //         //Reduit l'opacité de tous les flux qui ne sont pas rattaché à un noeuds survolé par l'étiquette
            //         Object.values(links_dict).filter(l => {
            //             return link_tied_to_node_hovered.includes(l.idLink)
            //         }).forEach(el => {
            //             d3.selectAll(' .opensankey #path_' + el.idLink).attr('stroke-opacity', 0.85)
            //             d3.selectAll(' .opensankey #path_' + el.idLink + '_arrow').attr('stroke-opacity', 0.85)
            //             d3.selectAll(' .opensankey #path_' + el.idLink + '_arrow').attr('opacity', 0.85)
            //             d3.selectAll(' .opensankey #gg_' + el.idLink + ' text').style('opacity', 1)
            //         })
            //         //Reduit l'opacité de tous les noeuds qui n'ont pas l'étiquette
            //         Object.values(nodes_dict).filter(n => {
            //             return ((n.tags[tmp2] && !n.tags[tmp2].includes(tag[1]) && !nodes_tied_to_link_hovered.includes(n.idNode)) || (!n.tags[tmp2]))
            //         }).forEach(el => {
            //             d3.selectAll(' .opensankey #ggg_' + el.idNode).attr('opacity', 0.1)
            //         })
            //     } else {
            //         Object.values(nodes_dict)
            //             .filter(n => !nodes_tied_to_link_hovered.includes(n.idNode))
            //             .forEach(el => {
            //                 d3.selectAll(' .opensankey #ggg_' + el.idNode).attr('opacity', 0.1)
            //             })
            //     }
            // })
            // .on('mouseout', () => {
            //     d3.selectAll(' .opensankey .link').attr('stroke-opacity', 0.85)
            //     d3.selectAll(' .opensankey .arrow').attr('stroke-opacity', 0.85)
            //     d3.selectAll(' .opensankey .arrow').attr('opacity', 0.85)
            //     d3.selectAll(' .opensankey .gg_links text').style('opacity', 1)
            //     d3.selectAll(' .opensankey .ggg_nodes').attr('opacity', 1)
            // }).on('contextmenu', (evt) => {
            //     if (!window.SankeyToolsStatic) {
            //         evt.preventDefault()
            //         pointer_pos.current = [evt.pageX, evt.pageY]
            //         tagContext.current![0][1](tag[0])
            //     }
            // })

            // Ajout du shape
            tagElement?.append('rect')
              .attr('width', this._legend_police)
              .attr('height', this._legend_police)
              .attr('x', 0)
              .attr('y', -0.75 * this._legend_police)
              .attr('rx', 3)
              .attr('ry', 3)
              .style('fill', () => tag.color)
              .style('fill-opacity', 1)

            // Ajout du label
            tagElement?.append('text')
              .attr('x', 35)
              .attr('y', 0)
              .attr('font-size', this._legend_police + 'px')
              .text(tag.name)
              .call(this._wrapper)

            this._dy += document.getElementById('tag_' + tag.name.replaceAll(' ', '__'))?.getBoundingClientRect().height ?? 0
          })
      })
    const show_data = Object.values(data_taggs).filter(d => d.show_legend).length == 0
    if (this._legend_show_dataTags && show_data) {
      this._dy += this._legend_police
      Object.entries(data_taggs).forEach(tag_group => {
        // Ajout du tagGroup.name
        this.d3_selection?.append('text')
          .attr('id', 'leg_dataTag_' + tag_group[0])
          .attr('transform', 'translate(0,' + this._dy + ' )')
          .attr('x', 0)
          .attr('y', 0)
          .text((tag_group[1].name + ' : ' + tag_group[1].selected_tags_list.map(t => t.name).join(', ')))
          .attr('style', ('font-size:' + this._legend_police + 'px;'))
          .call(this._wrapper)
        this._dy += document.getElementById('leg_dataTag_' + tag_group[0])?.getBoundingClientRect().height ?? 0
      })
    }
  }

  /**
   * Add text to describe why there is * in some link value
   * @private
   * @memberof Class_Legend
   */
  private drawInfoDataType() {
    // Write information in the legend depending to the diagram representation:
    // - when diagramme type is : data reconciled + indetermined links (values), we explain the meaning of "*" in the link label
    // - when diagramme type is : data collected or data reconciled, we explain the meaning of dashed links
    this._dy += this._legend_police
    const free_value = this.d3_selection?.append('g')
      .attr('id', 'gg_legend_free_value')
      .style('transform', 'translate(0,' + (this._dy) + 'px)')
      .attr('font-size', this._legend_police + 'px')

    free_value?.append('text')
      .text('*')
      .attr('x', '5')

    // free_value?.append('text')
    //   .attr('x', '35')
    //   .text(t('MEP.show_legend_free_value'))
    //   .call(this._wrapper)

    free_value?.append('text')
      .attr('x', '35')
      .text('MEP.show_legend_free_value')
      .call(this._wrapper)
  }

  /**
   * Add text to describe why some link are dashed
   * (because their value are undefined, only appear when data_type
   * is set to anything but structur)
   * @private
   * @memberof Class_Legend
   */
  private drawInfoDashedLink() {
    // Create info zone
    const dashed_link = this.d3_selection?.append('g')
      .attr('id', 'gg_legend_dashed_links')
      .style('transform', 'translate(0,' + (this._dy) + 'px)')
      .attr('font-size', this._legend_police + 'px')
    // Create path as exemple
    dashed_link?.append('path')
      .attr('d', 'M 0 0 L 25 0  Z')
      .attr('fill', 'none')
      .attr('stroke-width', '5')
      .attr('stroke', 'red')
      .attr('stroke-opacity', 0.85)
      .attr('stroke-dasharray', '3,3')
    // Set explanation text for path as dashed
    dashed_link?.append('text')
      .text('MEP.legend_dashed_links')
      .call(this._wrapper)
    // Correct text position // font size
    dashed_link?.select('text')
      .attr('x', '35')
      .attr('y', this._legend_police / 2)
  }

  /**
   * Add info zone in legend for "Sankey scale"
   * @private
   * @memberof Class_Legend
   */
  private drawSankeyScale() {
    // Update vertical offset
    this._dy += this._legend_police
    // Remove previous info zone for scale
    d3.selectAll(' .opensankey #svg .g_scale').remove()
    // Create info zone for scale
    const g_scale = this.d3_selection?.append('g')
      .attr('class', 'g_scale')
      .style('transform', 'translate(0,' + (this._dy) + 'px)')
    // Add explanation text
    // g_scale?.append('text').text(t('scale')+':').style('font-size',this._legend_police+'px')
    g_scale?.append('text')
      .text('scale' + ':')
      .style('font-size', this._legend_police + 'px')
    // Set draggable behavior
    const g_draggable = g_scale?.append('g')
      .attr('class', 'g_draggable_scale')
      .style('cursor', 'grab')
      .style('transform', 'translate(' + (7 * (this._legend_police * 0.75)) + 'px, -30px)')
    g_draggable?.append('rect')
      .attr('width', '3px')
      .attr('height', '50px')
      .attr('fill', 'black')
    g_draggable?.append('text')
      .attr('class', 'measurment_scale')
      .style('transform', 'translate(5px,25px)')
      .text(Math.round((this.drawing_area.scale / 2)))
    let h: number | undefined
    g_draggable?.call(d3.drag<SVGGElement, this, unknown>()
      .subject(Object)
      .on('strat', () => {
        h = document.getElementById('gg_legend')?.getBoundingClientRect().height
      })
      .on('drag', function (event, curr_leg) {
        h = h ? h : 50
        d3.select('#gg_legend .drag_zone_leg').attr('height', h)
        if (event.x > 0 && event.x < curr_leg.width && event.y < 0 && event.y > -h + 25) {
          d3.select(' .opensankey .g_draggable_scale').style('transform', 'translate(' + (event.x - 15) + 'px,' + (event.y - 25) + 'px)')
        }
      }))
  }

  private updateLegendHeight() {
    let h = document.getElementById('g_legend')?.getBoundingClientRect().height
    h = h ? (h+this._legend_police) : 0
    d3.select('#g_legend .zone_for_dragging').attr('height', h)
    const w = document.getElementById('g_legend')?.getBoundingClientRect().width
    if (w && w > this._width * 1.1) {
      d3.select('#g_legend .zone_for_dragging').attr('width', w)
      this._width = w
    }
  }

  // GETTERS / SETTERS ==================================================================

  public get is_visible(): boolean {
    return (
      !this._masked
        )
  }

  public get masked(): boolean { return this._masked }
  public set masked(value: boolean) { this._masked = value; this.draw() }

  public get display_legend_scale(): boolean { return this._display_legend_scale }
  public set display_legend_scale(value: boolean) { this._display_legend_scale = value; this.draw() }

  public get legend_police(): number { return this._legend_police }
  public set legend_police(value: number) { this._legend_police = value; this.draw() }

  public get legend_bg_border(): boolean { return this._legend_bg_border }
  public set legend_bg_border(value: boolean) { this._legend_bg_border = value; this.draw() }

  public get legend_bg_color(): string { return this._legend_bg_color }
  public set legend_bg_color(value: string) { this._legend_bg_color = value; this.draw() }

  public get legend_bg_opacity(): number { return this._legend_bg_opacity }
  public set legend_bg_opacity(value: number) { this._legend_bg_opacity = value; this.draw() }

  public get legend_show_dataTags(): boolean { return this._legend_show_dataTags }
  public set legend_show_dataTags(value: boolean) { this._legend_show_dataTags = value; this.draw() }

  public get node_label_separator(): string { return this._node_label_separator }
  public set node_label_separator(value: string) { this._node_label_separator = value; this.draw() }

  public get width(): number { return this._width }
  public set width(value: number) { this._width = value; this.draw() }

}