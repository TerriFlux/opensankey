// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

import { Class_ApplicationData, initial_window_height, initial_window_width } from './ApplicationData'
import { Class_DrawingArea } from './DrawingArea'
import { Class_Sankey } from './Sankey'
import { Class_LinkAttribute, Class_LinkElement, Class_LinkStyle } from './Link'
import { Class_NodeElement } from './Node'
import { Class_MenuConfig } from './MenuConfig'
import { default_main_sankey_id, default_style_id, default_style_name, Type_ElementPosition } from './Utils'

// STANDARD TYPES FOR OPENSANKEY AND MORE *********************************************************

export type Type_GenericApplicationDataOS = Class_ApplicationData<Type_GenericDrawingAreaOS, Type_GenericSankeyOS, Type_GenericNodeElementOS, Type_GenericLinkElementOS>
export type Type_GenericDrawingAreaOS = Class_DrawingArea<Type_GenericSankeyOS, Type_GenericNodeElementOS, Type_GenericLinkElementOS>
export type Type_GenericSankeyOS = Class_Sankey<Type_GenericDrawingAreaOS, Type_GenericNodeElementOS, Type_GenericLinkElementOS>
export type Type_GenericNodeElementOS = Class_NodeElement<Type_GenericDrawingAreaOS, Type_GenericSankeyOS, Type_GenericLinkElementOS>
export type Type_GenericLinkElementOS = Class_LinkElement<Type_GenericDrawingAreaOS, Type_GenericSankeyOS, Type_GenericNodeElementOS>


// STANDARD CLASSES FOR OPENSANKEY AND MORE *******************************************************

// APPLICATION DATA ===============================================================================

export class Class_ApplicationDataOS
  extends Class_ApplicationData<
    Class_DrawingAreaOS, Class_SankeyOS, Class_NodeElementOS, Class_LinkElementOS
  > {
  protected createNewDrawingArea(): Class_DrawingAreaOS {
    const drawing_area = new Class_DrawingAreaOS(
      initial_window_height,
      initial_window_width,
      this
    )
    return drawing_area
  }
}

// DRAWING AREA ===================================================================================
export class Class_DrawingAreaOS
  extends Class_DrawingArea<
    Class_SankeyOS, Class_NodeElementOS, Class_LinkElementOS
  > {
  protected createNewSankey() {
    const sankey = new Class_SankeyOS(this, this.application_data.menu_configuration)
    return sankey
  }
}

// SANKEY =========================================================================================
export class Class_SankeyOS
  extends Class_Sankey<
    Class_DrawingAreaOS, Class_NodeElementOS, Class_LinkElementOS
  > {

  protected _link_styles: { [_: string]: Class_LinkStyle } = {}

  constructor(drawing_area: Class_DrawingAreaOS,
    menu_config: Class_MenuConfig,
    id: string = default_main_sankey_id) {
    super(drawing_area, menu_config, id)
    this._link_styles[default_style_id] = this.creacteNewLinkStyle(default_style_id, default_style_name, false)

  }

  protected createNewNode(id: string, name: string): Class_NodeElementOS {
    const node = new Class_NodeElementOS(id, name, this.drawing_area, this._menu_config)
    return node
  }

  protected createNewLink(id: string, source: Class_NodeElementOS, target: Class_NodeElementOS): Class_LinkElementOS {
    const link = new Class_LinkElementOS(id, source, target, this.drawing_area, this._menu_config)
    return link
  }
  protected creacteNewLinkStyle(id: string, name: string, is_deletable?: boolean): Class_LinkStyle {
    const style = new Class_LinkStyle(id, name, is_deletable)
    return style
  }

  public get default_link_style() {
    return this._link_styles[default_style_id]
  }
}

// NODE ===========================================================================================
export class Class_NodeElementOS
  extends Class_NodeElement<
    Class_DrawingAreaOS, Class_SankeyOS, Class_LinkElementOS
  > {
  public copyInputLink(link: Class_LinkElement<Class_DrawingAreaOS, Class_SankeyOS, Class_NodeElementOS>): Class_LinkElementOS {
    const new_link = new Class_LinkElementOS(
      link.id,
      this.main_sankey.nodes_dict[link.source.id] as Class_NodeElementOS,
      this,
      this.drawing_area,
      this.menu_config
    )
    return new_link
  }

  public copyOutputLink(link: Class_LinkElement<Class_DrawingAreaOS, Class_SankeyOS, Class_NodeElementOS>): Class_LinkElementOS {
    const new_link = new Class_LinkElementOS(
      link.id,
      this,
      this.main_sankey.nodes_dict[link.target.id] as Class_NodeElementOS,
      this.drawing_area,
      this.menu_config
    )
    return new_link
  }
}

// LINK ===========================================================================================
export class Class_LinkElementOS
  extends Class_LinkElement<
    Class_DrawingAreaOS, Class_SankeyOS, Class_NodeElementOS
  > {

  protected _display: {
    drawing_area: Class_DrawingAreaOS,
    displaying_order: number,
    position_starting: Type_ElementPosition,
    position_ending: Type_ElementPosition,
    style: Class_LinkStyle,
    attributes: Class_LinkAttribute
    position_x_label?: number // optional var used when label is dragged (if label doesn't follow link path)
    position_y_label?: number // optional var used when label is dragged (if label doesn't follow link path)
    position_offset_label?: number // optional var used when label is dragged (if label follow link path)
  }

  constructor(
    id: string,
    source: Class_NodeElementOS,
    target: Class_NodeElementOS,
    drawing_area: Class_DrawingAreaOS,
    menu_config: Class_MenuConfig
  ) {
    super(id, source, target, drawing_area, menu_config)
    // Display
    this._display = {
      drawing_area: drawing_area,
      displaying_order: drawing_area.addElement(),
      position_starting: {
        type: 'absolute',
        x: 0,
        y: 0,
        u: 0,
        v: 0
      },
      position_ending: {
        type: 'absolute',
        x: 0,
        y: 0,
        u: 0,
        v: 0
      },
      style: drawing_area.sankey.default_link_style as Class_LinkStyle,
      attributes: new Class_LinkAttribute()
    }
    // Link with style
    this._display.style.addReference(this)
  }
}





