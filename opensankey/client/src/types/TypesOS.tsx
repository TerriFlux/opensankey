// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 03/09/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

import { Class_ApplicationData, initial_window_height, initial_window_width } from './ApplicationData'
import { Class_DrawingArea } from './DrawingArea'
import { Class_Sankey } from './Sankey'
import { Class_LinkAttribute, Class_LinkElement, Class_LinkStyle } from './Link'
import { Class_NodeElement, Class_NodeStyle } from './Node'
import { Class_MenuConfig } from './MenuConfig'
import { default_main_sankey_id, default_style_id, default_style_name, Type_ElementPosition } from './Utils'
import { Class_ZoneSelection } from './Selection_Zone'

// STANDARD TYPES FOR OPENSANKEY AND MORE *********************************************************

export type Type_GenericApplicationDataOS = Class_ApplicationData<Type_GenericDrawingAreaOS, Type_GenericSankeyOS, Type_GenericNodeElementOS, Type_GenericLinkElementOS>
export type Type_GenericDrawingAreaOS = Class_DrawingArea<Type_GenericSankeyOS, Type_GenericNodeElementOS, Type_GenericLinkElementOS>
export type Type_GenericSankeyOS = Class_Sankey<Type_GenericDrawingAreaOS, Type_GenericNodeElementOS, Type_GenericLinkElementOS>
export type Type_GenericNodeElementOS = Class_NodeElement<Type_GenericDrawingAreaOS, Type_GenericSankeyOS, Type_GenericLinkElementOS>
export type Type_GenericLinkElementOS = Class_LinkElement<Type_GenericDrawingAreaOS, Type_GenericSankeyOS, Type_GenericNodeElementOS>

export type Type_AdditionalMenus = {
  // Top Menu
  external_edition_item: JSX.Element[],
  external_file_item: JSX.Element[],
  external_file_export_item: JSX.Element[],
  externale_save_item: JSX.Element[],
  externale_navbar_item: { [_: string]: JSX.Element }

  // Mise en page
  extra_background_element: JSX.Element
  apply_transformation_additional_elements: JSX.Element[]

  // Nodes
  advanced_appearence_content: JSX.Element[],
  advanced_label_content: JSX.Element[],
  advanced_label_value_content: JSX.Element[],
  additional_menu_configuration_nodes: { [_: string]: JSX.Element },
  additional_context_element_menu: JSX.Element[],
  additional_context_element_other: JSX.Element[],
  additional_node_label_layout_content:JSX.Element[],

  // Links
  additional_data_element: JSX.Element[],
  additional_link_appearence_items: JSX.Element[],
  additional_link_visual_filter_content: JSX.Element[],

  // Preferences
  additional_preferences: JSX.Element[],

  // Configuration Menu
  additional_configuration_menus_edition_elements: JSX.Element[]
  additional_configuration_menus_primary_accordion_elements: JSX.Element[]

  // Other menus
  additional_edition_item: JSX.Element[],
  additional_file_save_json_option: JSX.Element[],
  additional_file_item: JSX.Element[],
  additional_file_export_item: JSX.Element[],

  sankey_menus: { [_: string]: JSX.Element },

  additional_nav_item: JSX.Element[],

  example_menu: { [k: string]: JSX.Element; }
  formations_menu: { [k: string]: JSX.Element; },

  cards_template: JSX.Element
}


// STANDARD CLASSES FOR OPENSANKEY AND MORE *******************************************************

// APPLICATION DATA ===============================================================================

export class Class_ApplicationDataOS
  extends Class_ApplicationData<
    Class_DrawingAreaOS, Class_SankeyOS, Class_NodeElementOS, Class_LinkElementOS
  > {

    public createNewMenuConfiguration(): Class_MenuConfig {
      return new Class_MenuConfig()
    }
  public createNewDrawingArea(id?:string): Class_DrawingAreaOS {
    const drawing_area = new Class_DrawingAreaOS(
      initial_window_height,
      initial_window_width,
      this,
      id
    )
    return drawing_area
  }
}

// DRAWING AREA ===================================================================================

export class Class_DrawingAreaOS
  extends Class_DrawingArea<
    Class_SankeyOS, Class_NodeElementOS, Class_LinkElementOS
  > {

  constructor(_height: number,
    _width: number,
    application_data: Class_ApplicationDataOS,
    id?:string
  ) {
    super(_height, _width, application_data,id)
  }

  protected createNewSankey(id: string = default_main_sankey_id) {
    const sankey = new Class_SankeyOS(this, this.application_data.menu_configuration, id)
    return sankey
  }

  protected createNewSelectionZone(){
    return new Class_ZoneSelectionOS(this, this.application_data.menu_configuration)
  }

}

export class Class_ZoneSelectionOS extends Class_ZoneSelection<Class_DrawingAreaOS,Class_SankeyOS>{
  constructor(drawing_area:Class_DrawingAreaOS,menu_config:Class_MenuConfig){
    super(drawing_area,menu_config)
  }
}

// SANKEY =========================================================================================

export class Class_SankeyOS
  extends Class_Sankey<
    Class_DrawingAreaOS, Class_NodeElementOS, Class_LinkElementOS
  > {

  protected _link_styles: { [_: string]: Class_LinkStyle } = {}
  protected _node_styles: { [_: string]: Class_NodeStyle } = {}

  constructor(
    drawing_area: Class_DrawingAreaOS,
    menu_config: Class_MenuConfig,
    id: string = default_main_sankey_id
  ) {
    super(drawing_area, menu_config, id)
    this._link_styles[default_style_id] = this.createNewLinkStyle(default_style_id, default_style_name, false)
  }

  protected createNewNode(id: string, name: string): Class_NodeElementOS {
    const node = new Class_NodeElementOS(id, name, this.drawing_area, this._menu_config)
    return node
  }

  protected createNewLink(id: string, source: Class_NodeElementOS, target: Class_NodeElementOS): Class_LinkElementOS {
    const link = new Class_LinkElementOS(id, source, target, this.drawing_area, this._menu_config)
    return link
  }

  protected createNewLinkStyle(id: string, name: string, is_deletable?: boolean): Class_LinkStyle {
    const style = new Class_LinkStyle(id, name, is_deletable)
    return style
  }

  protected createNewNodeStyle(id: string, name: string, is_deletable?: boolean): Class_NodeStyle {
    return new Class_NodeStyle(id,name,is_deletable)
  }

  public get default_link_style() {
    return this._link_styles[default_style_id]
  }
}

// NODE ===========================================================================================

export class Class_NodeElementOS
  extends Class_NodeElement<
    Class_DrawingAreaOS, Class_SankeyOS, Class_LinkElementOS
  > {}

// LINK ===========================================================================================

export class Class_LinkElementOS
  extends Class_LinkElement<
    Class_DrawingAreaOS, Class_SankeyOS, Class_NodeElementOS
  > {

  protected _display: {
    drawing_area: Class_DrawingAreaOS,
    sankey: Class_SankeyOS,
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
      sankey: drawing_area.sankey,
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
    this.source.addOutputLink(this)
    this.target.addInputLink(this)// Target
    // Instanciate display on svg
    this.computeControlPoints()
    this.draw()
  }
}





