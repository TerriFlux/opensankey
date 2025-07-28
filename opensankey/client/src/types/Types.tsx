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

import { typeButtonElementConfigurable } from '../components/topmenus/SankeyMenus'

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






