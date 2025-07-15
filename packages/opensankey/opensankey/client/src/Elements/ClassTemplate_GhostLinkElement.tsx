import { ClassAbstract_DrawingArea, ClassAbstract_Sankey } from '../types/Abstract';
import { ClassAbstract_NodeElement } from '../types/AbstractNode';
import type { Class_MenuConfig } from '../types/MenuConfig';
import { Type_ElementPosition } from '../types/Utils';
import { ClassTemplate_LinkElement } from './Link';
import { Class_LinkStyle, Class_LinkAttribute } from './LinkAttributes';

// CLASS GHOST LINK *********************************************************************

export class ClassTemplate_GhostLinkElement<
  Type_GenericDrawingArea extends ClassAbstract_DrawingArea,
  Type_GenericSankey extends ClassAbstract_Sankey,
  Type_GenericNodeElement extends ClassAbstract_NodeElement<Type_GenericDrawingArea, Type_GenericSankey>
>
  extends ClassTemplate_LinkElement<
    Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement
  > {

  protected _display: {
    drawing_area: Type_GenericDrawingArea;
    sankey: Type_GenericSankey;
    position_starting: Type_ElementPosition;
    position_ending: Type_ElementPosition;
    style: Class_LinkStyle[];
    attributes: Class_LinkAttribute;
    position_x_label?: number; // optional var used when label is dragged (if label doesn't follow link path)
    position_y_label?: number; // optional var used when label is dragged (if label doesn't follow link path)
    position_offset_label?: number; // optional var used when label is dragged (if label follow link path)
  };

  constructor(
    id: string,
    source: Type_GenericNodeElement,
    target: Type_GenericNodeElement,
    drawing_area: Type_GenericDrawingArea,
    menu_config: Class_MenuConfig
  ) {
    super(id, source, target, drawing_area, menu_config);
    // Display
    this._display = {
      drawing_area: drawing_area,
      sankey: drawing_area.sankey as Type_GenericSankey,
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
    };
    // Link with style
    this._display.style[0].addReference(this);

    this.source.addOutputLink(this);
    this.target.addInputLink(this); // Target

    // Instanciate display on svg
    this._link_control_points.computeControlPoints();
  }

  // GETTER / SETTER ====================================================================
  public get is_visible() { return (this._is_visible && this.sankey.is_visible); }
}
