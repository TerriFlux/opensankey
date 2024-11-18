// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 03/09/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Import OpenSankey
import { default_main_sankey_id, default_style_id, default_style_name, Type_ElementPosition } from '../deps/OpenSankey/types/Utils'

// Local imports
import { Class_MenuConfigPlus } from './MenuConfigPlus'
import { Class_ApplicationDataPlus } from './ApplicationDataPlus'
import { Class_DrawingAreaPlus } from './DrawingAreaPlus'
import { Class_SankeyPlus } from './SankeyPlus'
import { Class_NodeAttributePlus, Class_NodeElementPlus, Class_NodeStylePlus } from './NodePlus'
import { Class_LinkAttributePlus, Class_LinkElementPlus, Class_LinkStylePlus } from './LinkPlus'
import { Class_ContainerElement } from './FreeLabel'
import { Class_ZoneSelectionPlus } from './Selection_ZonePlus'

// STANDARD TYPES FOR OPENSANKEY+ AND MORE **********************************************

export type Type_GenericApplicationDataOSP = Class_ApplicationDataPlus<Type_GenericDrawingAreaOSP, Type_GenericSankeyOSP, Type_GenericNodeElementOSP, Type_GenericLinkElementOSP>
export type Type_GenericDrawingAreaOSP = Class_DrawingAreaPlus<Type_GenericSankeyOSP, Type_GenericNodeElementOSP, Type_GenericLinkElementOSP>
export type Type_GenericSankeyOSP = Class_SankeyPlus<Type_GenericDrawingAreaOSP, Type_GenericNodeElementOSP, Type_GenericLinkElementOSP>
export type Type_GenericNodeElementOSP = Class_NodeElementPlus<Type_GenericDrawingAreaOSP, Type_GenericSankeyOSP, Type_GenericLinkElementOSP>
export type Type_GenericLinkElementOSP = Class_LinkElementPlus<Type_GenericDrawingAreaOSP, Type_GenericSankeyOSP, Type_GenericNodeElementOSP>
export type Type_GenericContainerElement = Class_ContainerElement<Type_GenericDrawingAreaOSP, Type_GenericSankeyOSP>

// STANDARD CLASSES FOR OPENSANKEY+ AND MORE ********************************************

// APPLICATION DATA =====================================================================

export class Class_ApplicationDataOSP
  extends Class_ApplicationDataPlus<
    Class_DrawingAreaOSP,
    Class_SankeyOSP,
    Class_NodeElementOSP,
    Class_LinkElementOSP
  > {

  public createNewMenuConfiguration(): Class_MenuConfigPlus {
    return new Class_MenuConfigPlus()
  }

  public createNewDrawingArea(id?: string): Class_DrawingAreaOSP {
    const drawing_area = new Class_DrawingAreaOSP(
      this,
      id
    )
    return drawing_area
  }
}

// DRAWING AREA =========================================================================

export class Class_DrawingAreaOSP
  extends Class_DrawingAreaPlus<
    Class_SankeyOSP,
    Class_NodeElementOSP,
    Class_LinkElementOSP
  > {
  protected createNewSankey(id?: string) {
    const sankey = new Class_SankeyOSP(this, this.application_data.menu_configuration, id)
    return sankey
  }

  protected createNewSelectionZone(): Class_ZoneSelectionPlus<Class_DrawingAreaOSP, Class_SankeyOSP> {
    return new Class_ZoneSelectionPlus<Class_DrawingAreaOSP, Class_SankeyOSP>(this, this.application_data.menu_configuration)
  }
}

// SANKEY ===============================================================================

export class Class_SankeyOSP
  extends Class_SankeyPlus<
    Class_DrawingAreaOSP,
    Class_NodeElementOSP,
    Class_LinkElementOSP
  > {

  protected _link_styles: { [_: string]: Class_LinkStylePlus } = {}
  protected _node_styles: { [_: string]: Class_NodeStylePlus } = {}

  constructor(
    drawing_area: Class_DrawingAreaOSP,
    menu_config: Class_MenuConfigPlus,
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

  protected createNewLinkStyle(id: string, name: string, is_deletable?: boolean): Class_LinkStylePlus {
    const style = new Class_LinkStylePlus(id, name, is_deletable)
    return style
  }

  protected createNewNodeStyle(id: string, name: string, is_deletable?: boolean): Class_NodeStylePlus {
    return new Class_NodeStylePlus(id,name,is_deletable)
  }

  public get default_link_style() {
    return this._link_styles[default_style_id]
  }
}

// NODE =================================================================================

export class Class_NodeElementOSP
  extends Class_NodeElementPlus<
    Class_DrawingAreaOSP, Class_SankeyOSP, Class_LinkElementOSP
  > {

  protected _display: {
      drawing_area: Class_DrawingAreaOSP,
      sankey: Class_SankeyOSP,
      position: Type_ElementPosition,
      style: Class_NodeStylePlus,
      attributes: Class_NodeAttributePlus
      position_x_label?: number// Relative x position of label when dragged (optionnal)
      position_y_label?: number// Relative y position of label when dragged (optionnal)
    }
  constructor(id:string,name:string,
    drawing_area: Class_DrawingAreaOSP,
    menu_config: Class_MenuConfigPlus
  ){
    super(id,name,drawing_area,menu_config)
    this._display={
      drawing_area: drawing_area,
      sankey: this.sankey,
      position: this.display.position,

      style: drawing_area.sankey.default_node_style,
      attributes: new Class_NodeAttributePlus()

    }
  }

}

// LINK =================================================================================

export class Class_LinkElementOSP
  extends Class_LinkElementPlus<
    Class_DrawingAreaOSP, Class_SankeyOSP, Class_NodeElementOSP
  > {

  protected _display: {
    drawing_area: Class_DrawingAreaOSP,
    sankey: Class_SankeyOSP,
    displaying_order: number,
    position_starting: Type_ElementPosition,
    position_ending: Type_ElementPosition,
    style: Class_LinkStylePlus,
    attributes: Class_LinkAttributePlus,
    position_x_label?: number
    position_y_label?: number
    position_offset_label?: number
  }

  constructor(
    id: string,
    source: Class_NodeElementOSP,
    target: Class_NodeElementOSP,
    drawing_area: Class_DrawingAreaOSP,
    menu_config: Class_MenuConfigPlus
  ) {
    super(id, source, target, drawing_area, menu_config)
    // Display
    this._display = {
      drawing_area: drawing_area,
      sankey: drawing_area.sankey,
      displaying_order: drawing_area.addElement(),
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
      style: drawing_area.sankey.default_link_style,
      attributes: new Class_LinkAttributePlus()
    }
    // Link with style
    this._display.style.addReference(this)
    this.source.addOutputLink(this)
    this.target.addInputLink(this)// Target
    // Instanciate display on svg
    this.computeControlPoints()
    this.draw()
  }
}
