// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux
// Date : 03/09/2024
// All rights reserved for TerriFlux
// ==================================================================================================

// Import OpenSankey
import { default_main_sankey_id, default_style_id, default_style_name, Type_ElementPosition } from '../deps/OpenSankey/types/Utils'

// Local imports
import { Class_MenuConfigOSP } from './MenuConfigOSP'
import { ClassTemplate_ApplicationDataOSP } from './ApplicationDataOSP'
import { ClassTemplate_DrawingAreaOSP } from './DrawingAreaOSP'
import { ClassTemplate_SankeyOSP } from './SankeyOSP'
import { ClassTemplate_NodeElementOSP } from './NodeOSP'
import { Class_LinkAttributeOSP, ClassTemplate_LinkElementOSP, Class_LinkStyleOSP } from './LinkOSP'
import { Class_ContainerElement } from './FreeLabel'
import { ClassTemplate_ZoneSelectionOSP } from './SelectionZoneOSP'
import { Class_IconLibraryOSP } from './IconLibrairieOSP'
import { Class_NodeAttribute, Class_NodeStyle } from '../deps/OpenSankey/Elements/NodeAttributes'

// STANDARD TYPES FOR OPENSANKEY+ AND MORE **********************************************

export type Type_GenericApplicationDataOSP = ClassTemplate_ApplicationDataOSP<Type_GenericDrawingAreaOSP, Type_GenericSankeyOSP, Type_GenericNodeElementOSP, Type_GenericLinkElementOSP>
export type Type_GenericDrawingAreaOSP = ClassTemplate_DrawingAreaOSP<Type_GenericSankeyOSP, Type_GenericNodeElementOSP, Type_GenericLinkElementOSP>
export type Type_GenericSankeyOSP = ClassTemplate_SankeyOSP<Type_GenericDrawingAreaOSP, Type_GenericNodeElementOSP, Type_GenericLinkElementOSP>
export type Type_GenericNodeElementOSP = ClassTemplate_NodeElementOSP<Type_GenericDrawingAreaOSP, Type_GenericSankeyOSP, Type_GenericLinkElementOSP>
export type Type_GenericLinkElementOSP = ClassTemplate_LinkElementOSP<Type_GenericDrawingAreaOSP, Type_GenericSankeyOSP, Type_GenericNodeElementOSP>
export type Type_GenericContainerElement = Class_ContainerElement<Type_GenericDrawingAreaOSP, Type_GenericSankeyOSP>

// STANDARD CLASSES FOR OPENSANKEY+ AND MORE ********************************************

// APPLICATION DATA =====================================================================

export class Class_ApplicationDataOSP
  extends ClassTemplate_ApplicationDataOSP<
    Class_DrawingAreaOSP,
    Class_SankeyOSP,
    Class_NodeElementOSP,
    Class_LinkElementOSP
  > {


  public createNewMenuConfiguration(): Class_MenuConfigOSP {
    return new Class_MenuConfigOSP()
  }

  public createNewDrawingArea(id?: string): Class_DrawingAreaOSP {
    const drawing_area = new Class_DrawingAreaOSP(
      this,
      id
    )
    return drawing_area
  }
  public createNewIconLibrary(): Class_IconLibraryOSP {
    return new Class_IconLibraryOSP()
  }
}

// DRAWING AREA =========================================================================

export class Class_DrawingAreaOSP
  extends ClassTemplate_DrawingAreaOSP<
    Class_SankeyOSP,
    Class_NodeElementOSP,
    Class_LinkElementOSP
  > {
  protected createNewSankey(id?: string) {
    const sankey = new Class_SankeyOSP(this, this.application_data.menu_configuration, id)
    return sankey
  }

  protected createNewSelectionZone(): ClassTemplate_ZoneSelectionOSP<Class_DrawingAreaOSP, Class_SankeyOSP> {
    return new ClassTemplate_ZoneSelectionOSP<Class_DrawingAreaOSP, Class_SankeyOSP>(this, this.application_data.menu_configuration)
  }
}

// SANKEY ===============================================================================

export class Class_SankeyOSP
  extends ClassTemplate_SankeyOSP<
    Class_DrawingAreaOSP,
    Class_NodeElementOSP,
    Class_LinkElementOSP
  > {

  protected _link_styles: { [_: string]: Class_LinkStyleOSP } = {}
  protected _node_styles: { [_: string]: Class_NodeStyle } = {}

  constructor(
    drawing_area: Class_DrawingAreaOSP,
    menu_config: Class_MenuConfigOSP,
    id: string = default_main_sankey_id
  ) {
    super(drawing_area, menu_config, id)
    this._link_styles[default_style_id] = this.createNewLinkStyle(default_style_id, default_style_name, false)
    this._node_styles[default_style_id] = this.createNewNodeStyle(default_style_id, default_style_name, false)
  }

  protected createNewNode(id: string, name: string): Class_NodeElementOSP {
    const node = new Class_NodeElementOSP(id, name, this.drawing_area, this._menu_config)
    return node
  }

  protected createNewLink(id: string, source: Class_NodeElementOSP, target: Class_NodeElementOSP): Class_LinkElementOSP {
    const link = new Class_LinkElementOSP(id, source, target, this.drawing_area, this._menu_config)
    return link
  }

  protected createNewLinkStyle(id: string, name: string, is_deletable?: boolean): Class_LinkStyleOSP {
    const style = new Class_LinkStyleOSP(id, name, is_deletable)
    return style
  }

  public get default_link_style() {
    return this._link_styles[default_style_id]
  }
}

// NODE =================================================================================

export class Class_NodeElementOSP
  extends ClassTemplate_NodeElementOSP<
    Class_DrawingAreaOSP, Class_SankeyOSP, Class_LinkElementOSP
  > {

  protected _display: {
    drawing_area: Class_DrawingAreaOSP,
    sankey: Class_SankeyOSP,
    position: Type_ElementPosition,
    style: Class_NodeStyle[],
    attributes: Class_NodeAttribute
    position_x_label?: number// Relative x position of label when dragged (optionnal)
    position_y_label?: number// Relative y position of label when dragged (optionnal)
  }

  constructor(id: string, name: string,
    drawing_area: Class_DrawingAreaOSP,
    menu_config: Class_MenuConfigOSP
  ) {
    super(id, name, drawing_area, menu_config)
    this._display = {
      drawing_area: drawing_area,
      sankey: this.sankey,
      position: this.display.position,
      style: [drawing_area.sankey.default_node_style],
      attributes: new Class_NodeAttribute()
    }
  }
}

// LINK =================================================================================

export class Class_LinkElementOSP
  extends ClassTemplate_LinkElementOSP<
    Class_DrawingAreaOSP, Class_SankeyOSP, Class_NodeElementOSP
  > {

  protected _display: {
    drawing_area: Class_DrawingAreaOSP,
    sankey: Class_SankeyOSP,
    //displaying_order: number,
    position_starting: Type_ElementPosition,
    position_ending: Type_ElementPosition,
    style: Class_LinkStyleOSP[],
    attributes: Class_LinkAttributeOSP,
    position_x_label?: number
    position_y_label?: number
    position_offset_label?: number
  }

  constructor(
    id: string,
    source: Class_NodeElementOSP,
    target: Class_NodeElementOSP,
    drawing_area: Class_DrawingAreaOSP,
    menu_config: Class_MenuConfigOSP
  ) {
    super(id, source, target, drawing_area, menu_config)
    // Display
    this._display = {
      drawing_area: drawing_area,
      sankey: drawing_area.sankey,
      //displaying_order: drawing_area.addElement(),
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
}
