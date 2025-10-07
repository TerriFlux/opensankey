
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_Sankey } from '../types/Sankey'
import { Type_ElementPosition } from '../types/Utils'
import { Class_LinkElement } from './Link'
import { Class_LinkAttribute } from './LinkAttributes'
import { Class_LinkStyle } from './ElementStyle'
import { Class_NodeElement } from './Node'

// CLASS GHOST LINK *********************************************************************

export class ClassTemplate_GhostLinkElement
  extends Class_LinkElement {

  public _display: {
    drawing_area: Class_DrawingArea;
    sankey: Class_Sankey;
    position_starting: Type_ElementPosition;
    position_ending: Type_ElementPosition;
    style: Class_LinkStyle[];
    attributes: Class_LinkAttribute;
    position_x_label?: number; // optional var used when label is dragged (if label doesn't follow link path)
    position_y_label?: number; // optional var used when label is dragged (if label doesn't follow link path)
    position_offset_label?: number; // optional var used when label is dragged (if label follow link path)
  }

  constructor(
    id: string,
    source: Class_NodeElement,
    target: Class_NodeElement,
    drawing_area: Class_DrawingArea
  ) {
    super(id, source, target, drawing_area)
    // Display
    this._display = {
      drawing_area: drawing_area,
      sankey: drawing_area.sankey as Class_Sankey,
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
      style: [drawing_area.sankey.default_link_style as Class_LinkStyle],
      attributes: new Class_LinkAttribute()
    }
    // Link with style
    this._display.style[0].addReference(this)

    this.source.addOutputLink(this)
    this.target.addInputLink(this) // Target

    // Instanciate display on svg
    this._link_control_points.computeControlPoints()
  }

  // GETTER / SETTER ====================================================================
  public get is_visible() { return (this._is_visible && this.sankey.is_visible) }
}
