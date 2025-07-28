// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux
// ==================================================================================================

// OpenSankey imports
import { Class_LinkElement } from '../deps/OpenSankey/Elements/Link'
import {
  Class_LinkAttribute,
  Class_LinkStyle
} from '../deps/OpenSankey/Elements/LinkAttributes'
import { Class_NodeElement } from '../deps/OpenSankey/Elements/Node'
import { Class_DrawingArea } from '../deps/OpenSankey/types/DrawingArea'
import {
  getBooleanFromJSON,
  Type_ElementPosition,
  Type_JSON,
} from '../deps/OpenSankey/types/Utils'

import { Class_MenuConfigOSP } from './MenuConfigOSP'

export const default_shape_shape_is_gradient = false

// CLASS Link ELEMENT PLUS **************************************************************

/**
 * Override OpenSankey's class to take in account specifities of OpenSankey+ app
 * @export
 * @class Class_LinkElementOSP
 * @extends {Class_LinkElement}
 */
export class Class_LinkElementOSP extends Class_LinkElement {


  protected _display: {
    position_starting: Type_ElementPosition,
    position_ending: Type_ElementPosition,
    style: Class_LinkStyle[],
    attributes: Class_LinkAttributeOSP,
    position_x_label?: number
    position_y_label?: number
    position_offset_label?: number
  }

  /**
   * Creates an instance of Class_LinkElementOSP.
   * @param {string} id
   * @param {Class_NodeElement} source
   * @param {Class_NodeElement} target
   * @param {Class_DrawingArea} drawing_area
   * @param {Class_MenuConfigOSP} menu_config
   * @memberof Class_LinkElementOSP
   */
  constructor(
    id: string,
    source: Class_NodeElement,
    target: Class_NodeElement,
    drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfigOSP,
  ) {
    // Heritance
    super(id, source, target, drawing_area, menu_config)
    // Override menu config
    this._menu_config = menu_config
    // Display
    this._display = {
      position_starting: {
        x: 0,
        y: 0,
        u: 0,
        v: 0
      },
      position_ending: {
        x: 0,
        y: 0,
        u: 0,
        v: 0
      },
      style: [drawing_area.sankey.default_link_style],
      attributes: new Class_LinkAttributeOSP()
    }
    // Link with style
    this._display.style[0].addReference(this)
    this.source.addOutputLink(this)
    this.target.addInputLink(this)// Target
    // Instanciate display on svg
    this._link_control_points.computeControlPoints()
    this.draw()
  }

  public override _draw() {
    // Don't put this condition in is_visible because we need node to take into account link value of links visualy filtered for node size
    if (this.is_value_above_threshold) {
      super._draw()
    }
  }

  public getPathColorToUse() {

    // CLean gradient
    this.drawing_area.d3_selection_def_gradient?.select('#def_gradient_' + this.source.id + '-' + this.target.id).remove()

    // Apply gradient if needed
    if (this.shape_color_rule == 'gradient') {

      const defGradient = this.drawing_area.d3_selection_def_gradient
      const n_source = this.source
      const n_source_color = n_source.getShapeColorToUse()

      const n_target = this.target
      const n_target_color = n_target.getShapeColorToUse()
      const l_ori = this.shape_orientation
      const l_recy = this.shape_is_recycling

      const width_src = n_source.getShapeWidthToUse()
      const height_src = n_target.getShapeHeightToUse()
      const width_trgt = n_target.getShapeWidthToUse()
      // Create a gradient
      const gradient = defGradient?.append('defs')
        .attr('id', 'def_gradient_' + n_source.id + '-' + n_target.id)
        .append('linearGradient')
        .attr('id', 'gradient-' + n_source.id + '-' + n_target.id)
        .attr('gradientUnits', 'userSpaceOnUse')

      gradient?.append('stop')
        .attr('id', 'stop-start')
        .attr('offset', '0%')
        .attr('stop-color', () => {
          if (n_source.position_x <= n_target.position_x) {
            return n_source_color
          }
          else {
            return n_target_color
          }
        })
        .attr('stop-opacity', 1)

      gradient?.append('stop')
        .attr('id', 'stop-end')
        .attr('offset', '100%')
        .attr('stop-color', () => {
          if (n_source.position_x <= n_target.position_x) {
            return n_target_color
          }
          else {
            return n_source_color
          }
        })
        .attr('stop-opacity', 1)

      // In case the link is horizontal-horizontal or horizontal-vertical
      // the gradient will gradually change from left to right
      if (l_ori === 'hh' || l_ori === 'hv') {

        if ((!l_recy && n_source.position_x < n_target.position_x) || (l_recy && n_source.position_x >= n_target.position_x)) {
          // In case when when link isn't recycling & the source is at the left of target
          // or the link is recycling but the source is at the right of the target
          // the gradient go from color of source to color of target

          // Position lienear gradient (it start & stop position )
          gradient
            ?.attr('x1', n_source.position_x + width_src)
            .attr('y1', '0')
            .attr('x2', n_target.position_x)
            .attr('y2', 0)

          // Set starting gradient color & ending gradient color
          gradient?.select('#stop-start').attr('stop-color', n_source_color)
          gradient?.select('#stop-end').attr('stop-color', n_target_color)
        }
        else {

          // Position lienear gradient (it start & stop position )
          gradient
            ?.attr('x1', n_target.position_x + width_trgt)
            .attr('y1', '0')
            .attr('x2', n_source.position_x)
            .attr('y2', 0)

          // Set starting gradient color & ending gradient color
          gradient?.select('#stop-start').attr('stop-color', n_target_color)
          gradient?.select('#stop-end').attr('stop-color', n_source_color)
        }
      }
      // In case the link is vertical-vertical or vertical-horizontal
      // the gradient will gradually change from top to bottom
      else if (l_ori === 'vv' || l_ori === 'vh') {

        if (n_source.position_y < n_target.position_y) {
          // In case when when link isn't recycling & the source is on top of target
          // or the link is recycling but the source is at the bottom of the target
          // the gradient go from color of source to color of target

          // Position lienear gradient (it start & stop position )
          gradient?.attr('x1', 0)
            .attr('y1', n_source.position_y + height_src)
            .attr('x2', 0)
            .attr('y2', n_target.position_y)

          // Set starting gradient color & ending gradient color
          gradient?.select('#stop-start').attr('stop-color', n_source_color)
          gradient?.select('#stop-end').attr('stop-color', n_target_color)
        }
        else {

          // Position lienear gradient (it start & stop position )
          gradient?.attr('x1', 0)
            .attr('y1', n_target.position_y + height_src)
            .attr('x2', 0)
            .attr('y2', n_source.position_y)

          // Set starting gradient color & ending gradient color
          gradient?.select('#stop-start').attr('stop-color', n_target_color)
          gradient?.select('#stop-end').attr('stop-color', n_source_color)
        }
      }
      // else if (l_ori === 'vh') {
      //   d3.select(' .opensankey #gradient-' + n_source.id + '-' + n_target.id + ' #stop-start').attr('stop-color', () => {
      //     if (n_source.position_x < n_target.position_x) {
      //       gradient?.attr('x1', n_source.position_x + width_src - 10)
      //         .attr('y1', '0')
      //         .attr('x2', n_target.position_x)
      //         .attr('y2', 0)
      //       return n_source_color
      //     } else {
      //       gradient?.attr('x1', n_target.position_x + width_trgt + 10)
      //         .attr('y1', '0')
      //         .attr('x2', n_source.position_x)
      //         .attr('y2', 0)
      //       return n_target_color
      //     }
      //   }
      //   )
      //   d3.select(' .opensankey #gradient-' + n_source.id + '-' + n_target.id + ' #stop-end').attr('stop-color', () => {
      //     if (n_source.position_x > n_target.position_x) {
      //       return n_source_color
      //     } else {
      //       return n_target_color
      //     }
      //   }
      //   )
      // }
      return 'url(#gradient-' + n_source.id + '-' + n_target.id + ')'

    } else if (this.shape_color_rule == 'auto' && this.drawing_area.sankey.flux_taggs_list.filter(tagg => tagg.show_legend).length == 0) {
      if(this.source.taggs_list.filter(tagg => tagg.show_legend).length>0){
        return this.source.getShapeColorToUse()
      }else if(this.target.taggs_list.filter(tagg => tagg.show_legend).length>0){
        return this.target.getShapeColorToUse()
      }
    }

    // Otherwise use default
    return super.getPathColorToUse()
  }

  public getArrowColorToUse() {
    if (this.shape_color_rule == 'gradient') {
      const link_arrow_side_right = this.target_side == 'right'
      const link_arrow_side_bottom = this.target_side == 'bottom'
      const is_horizontal_at_target = this.is_horizontal || this.is_vertical_horizontal
      const is_revert = (is_horizontal_at_target && link_arrow_side_right) || (!is_horizontal_at_target && link_arrow_side_bottom)

      const source_color = this.source.getShapeColorToUse()
      const target_color = this.target.getShapeColorToUse()
      const shape_orientation = this.shape_orientation  // save to avoid recomputings
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
    else {
      return super.getArrowColorToUse()
    }
  }

  //  GETTER & SETTER =============================================
}

// CLASS LINK ATTRIBUTES ****************************************************************

/**
 * Define all attributes that can be applyied to a link
 *
 * @export
 * @class Class_LinkAttribute
 */
export class Class_LinkAttributeOSP extends Class_LinkAttribute {

  // PROTECTED ATTRIBUTES ===============================================================


  // PUBLIC METHODES ====================================================================

  public toJSON() {
    const json_object = super.toJSON()
    return json_object
  }

  public fromJSON(json_local_object: Type_JSON) {
    super.fromJSON(json_local_object)
  }

  public copyFrom(element: Class_LinkAttributeOSP) {
    super.copyFrom(element)
  }

  public override fromLegacyJSON(json_local_object: Type_JSON): void {
    super.fromLegacyJSON(json_local_object)
    if (json_local_object['version'] === undefined) {
      const was_gradient = getBooleanFromJSON(json_local_object, 'gradient', default_shape_shape_is_gradient) as boolean
      if (was_gradient) {
        this.shape_color_rule = 'gradient'
      }
    }

  }
}

