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
// ==================================================================================================

import { ClassTemplate_ApplicationData } from './ApplicationData'
import { ClassTemplate_DrawingArea } from './DrawingArea'
import { ClassTemplate_Sankey } from './Sankey'
import { ClassTemplate_LinkElement } from'../Elements/Link'
import { Class_LinkAttribute, Class_LinkStyle } from'../Elements/LinkAttributes'
import { ClassTemplate_NodeElement } from'../Elements/Node'
import { Class_NodeStyle } from '../Elements/NodeAttributes'
import { Class_MenuConfig } from '../types/MenuConfig'
import { default_main_sankey_id, default_style_id, default_style_name, Type_ElementPosition } from '../types/Utils'
import { ClassTemplate_ZoneSelection } from'../Elements/SelectionZone'
import { Class_IconLibrary } from './IconLibrairie'
import { typeButtonElementConfigurable } from '../components/topmenus/SankeyMenus'

// STANDARD TYPES FOR OPENSANKEY AND MORE *********************************************************

export type Type_GenericApplicationData = ClassTemplate_ApplicationData<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>
export type Type_GenericDrawingArea = ClassTemplate_DrawingArea<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>
export type Type_GenericSankey = ClassTemplate_Sankey<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>
export type Type_GenericNodeElement = ClassTemplate_NodeElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>
export type Type_GenericLinkElement = ClassTemplate_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>

export type Type_AdditionalMenus = {
  // Top Menu
  external_edition_item: JSX.Element[],
  external_file_export_item: JSX.Element[],
  externale_save_item: JSX.Element[],
  externale_navbar_item: { [_: string]: JSX.Element }
  external_top_buttons_item: {[x:string]:JSX.Element},

  // Config menu
  additional_menu_type:{[x:string]:string}
  additional_menu_button_element_configurable:typeButtonElementConfigurable
  additional_menu_config_content:{
    data:{[x:string]:JSX.Element},
    context:{[x:string]:JSX.Element},
    style:{[x:string]:JSX.Element},
  }
  additional_new_menu_config_content:{[x:string]:{[x:string]:JSX.Element}}
additional_node_config_style:JSX.Element[]

  footer:JSX.Element[]

  // Mise en page
  extra_background_element: JSX.Element
  apply_transformation_additional_elements: JSX.Element[]

  // Nodes
  advanced_appearence_content: JSX.Element[],
  advanced_label_content: JSX.Element[],

  context_node_order: string[],
  additional_context_node_element: { [_: string]: JSX.Element },
  // Links
  additional_menu_configuration_links: { [_: string]: JSX.Element },
  additional_data_element: JSX.Element[],
  additional_link_appearence_items: ((_:boolean)=>JSX.Element)[],
  additional_link_appearence_value: ((_:boolean)=>JSX.Element)[],
  additional_link_visual_filter_content: JSX.Element[],

  context_link_order: string[],
  additional_context_link_element: { [_: string]: JSX.Element },

  // Preferences
  additional_preferences: JSX.Element[],

  // Other menus
  additional_file_save_json_option: JSX.Element[],
  additional_file_export_item: JSX.Element[],


  additional_nav_item: JSX.Element[],

  formations_menu: object,

  toolbar_order: string[],

  template_module_key: string[]
}


// STANDARD CLASSES FOR OPENSANKEY AND MORE *******************************************************

// APPLICATION DATA ===============================================================================

export class Class_ApplicationData
  extends ClassTemplate_ApplicationData<
    Class_DrawingArea, Class_Sankey, Class_NodeElement, Class_LinkElement
  > {


  // PUBLIC METHODS ====================================================================

  public createNewMenuConfiguration(): Class_MenuConfig {
    return new Class_MenuConfig()
  }

  public createNewDrawingArea(id?: string): Class_DrawingArea {
    const drawing_area = new Class_DrawingArea(
      this,
      id
    )
    return drawing_area
  }

  public createNewIconLibrary(): Class_IconLibrary {
    return new Class_IconLibrary()
  }
}


// DRAWING AREA ===================================================================================

export class Class_DrawingArea
  extends ClassTemplate_DrawingArea<
    Class_Sankey, Class_NodeElement, Class_LinkElement
  > {

  constructor(
    application_data: Class_ApplicationData,
    id?: string
  ) {
    super(application_data, id)
  }

  protected createNewSankey(id: string = default_main_sankey_id) {
    const sankey = new Class_Sankey(this, this.application_data.menu_configuration, id)
    return sankey
  }

  protected createNewSelectionZone() {
    return new Class_ZoneSelection(this, this.application_data.menu_configuration)
  }
}

// SANKEY =========================================================================================

export class Class_Sankey
  extends ClassTemplate_Sankey<
    Class_DrawingArea, Class_NodeElement, Class_LinkElement
  > {

  protected _link_styles: { [_: string]: Class_LinkStyle } = {}
  protected _node_styles: { [_: string]: Class_NodeStyle } = {}

  constructor(
    drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig,
    id: string = default_main_sankey_id
  ) {
    super(drawing_area, menu_config, id)
    this._link_styles[default_style_id] = this.createNewLinkStyle(default_style_id, default_style_name, false)
    this._node_styles[default_style_id] = this.createNewNodeStyle(default_style_id, default_style_name, false)
  }

  protected createNewNode(id: string, name: string): Class_NodeElement {
    const node = new Class_NodeElement(id, name, this.drawing_area, this._menu_config)
    return node
  }

  protected createNewLink(id: string, source: Class_NodeElement, target: Class_NodeElement): Class_LinkElement {
    const link = new Class_LinkElement(id, source, target, this.drawing_area, this._menu_config)
    return link
  }

  protected createNewLinkStyle(id: string, name: string, is_deletable?: boolean): Class_LinkStyle {
    const style = new Class_LinkStyle(id, name, is_deletable)
    return style
  }

  public get default_link_style() {
    return this._link_styles[default_style_id]
  }
}

// NODE ===========================================================================================

export class Class_NodeElement
  extends ClassTemplate_NodeElement<
    Class_DrawingArea, Class_Sankey, Class_LinkElement
  > {
    
}

// LINK ===========================================================================================

export class Class_LinkElement
  extends ClassTemplate_LinkElement<
    Class_DrawingArea, Class_Sankey, Class_NodeElement
  > {

  protected _display: {
    drawing_area: Class_DrawingArea,
    sankey: Class_Sankey,
    //displaying_order: number,
    position_starting: Type_ElementPosition,
    position_ending: Type_ElementPosition,
    style: Class_LinkStyle[],
    attributes: Class_LinkAttribute
    position_x_label?: number // optional var used when label is dragged (if label doesn't follow link path)
    position_y_label?: number // optional var used when label is dragged (if label doesn't follow link path)
    position_offset_label?: number // optional var used when label is dragged (if label follow link path)
  }

  constructor(
    id: string,
    source: Class_NodeElement,
    target: Class_NodeElement,
    drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig
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
      style: [drawing_area.sankey.default_link_style as Class_LinkStyle],
      attributes: new Class_LinkAttribute()
    }
    // Link with style
    this._display.style[0].addReference(this)
    this.source.addOutputLink(this)
    this.target.addInputLink(this)// Target
    // Instanciate display on svg
    if (!this.sankey.drawing_area.bypass_redraws) {
      this._link_control_points.computeControlPoints()
    }
    this.draw()
  }
}

// SELECTION ZONE =================================================================================

export class Class_ZoneSelection extends ClassTemplate_ZoneSelection<Class_DrawingArea, Class_Sankey> {
  constructor(drawing_area: Class_DrawingArea, menu_config: Class_MenuConfig) {
    super(drawing_area, menu_config)
  }
}





