import { TFunction } from 'i18next'
import { SankeyData, SankeyLink, SankeyNode, TagsCatalog, showMenuComponentsType } from './Types'

/**
 * Function that generate dropdown for each groupTag of linkTags
 *
 * @param {TagsCatalog} fluxTags
 * @param {SankeyData} data
 * @param {(data: SankeyData) => void} set_data
 * @returns {(void) => any}
 */
export type AddAllDropDownFluxFType = (
  t:TFunction,
  fluxTags: TagsCatalog,
  data: SankeyData,
  set_data: (data: SankeyData) => void
) => JSX.Element

export type OpenSankeyMenusFType = (
  t:TFunction,
  Reinitialization:()=>void,
  DefaultSankeyData:()=>SankeyData,
  showMenuComponents:showMenuComponentsType,
  showStyleEdition:()=>void,
  showStyleEditionLink:()=>void,
  set_never_see_again:(b:boolean)=>void,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  external_edition_item:JSX.Element[],
  external_file_item:JSX.Element[],
  externale_save_item:JSX.Element[],
  set_tags_selected:(o:{[x:string]:string})=>void,
  convert_data:(d:SankeyData,DefaultSankeyData: ()=>SankeyData)=>void
) => {[s:string]:JSX.Element | JSX.Element[]}

export type OpenSankeyModalWelcomeFType = (
  t:TFunction,
  active_page:string,
  set_active_page:(s:string)=>void,
  showMenuComponents : showMenuComponentsType,
  never_see_again:boolean,
  set_never_see_again:(b:boolean)=>void,
  additional_shortcut_item:JSX.Element[],
  external_pagination:JSX.Element[],
  external_content:{
    read_me: string | JSX.Element | JSX.Element[];
    intro: JSX.Element;
    rc: JSX.Element;
    licence: JSX.Element;
    news: JSX.Element;
  },
  exemple_menu: object
)=> JSX.Element



export type ContextMenuNodeFType = (
  contextualised_node:SankeyNode|undefined,set_contextualised_node:(n:SankeyNode|undefined)=>void,
  data:SankeyData,set_data:(d:SankeyData)=>void,
  display_nodes:{[id:string]:SankeyNode},
  display_links:{[id:string]:SankeyLink},
  multi_selected_nodes:{current:SankeyNode[]},
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction,
  showMenuComponents : showMenuComponentsType,
  set_agregation_node:(_:string)=>void,
  set_is_agregation:(_:boolean)=>void,
  set_display_link_opacity:(_:string)=>void,
  pointer_pos:{current:number[]},
  additional_context_element_menu:JSX.Element[],
  additional_context_element_other:JSX.Element[]
)=> JSX.Element

export type MenuDraggableFType = (
  content:JSX.Element|JSX.Element[],
  pointer_pos:{current:number[]},
  title:string,
  set_display_menu:(b:boolean)=>void,
  width_menu?:number
)=> JSX.Element

export type ContextMenuLinkFType = (
  contextualised_link:SankeyLink|undefined,
  set_contextualised_node:(n:SankeyNode|undefined)=>void,
  set_show_menu_link_data:(b:boolean)=>void,
  set_show_menu_link_appearence:(b:boolean)=>void,
  data:SankeyData,set_data:(d:SankeyData)=>void,
  tags_selected:{[k: string]: string},
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction,
  pointer_pos:{current:number[]}
) => JSX.Element

export type ContextZddFType = (
  showMenuComponents:showMenuComponentsType,
  data:SankeyData,set_data:(d:SankeyData)=>void,
  pointer_pos:{current:number[]},
  node_hspace:number,
  set_node_hspace:(n:number)=>void,
  node_vspace:number,
  set_node_vspace:(n:number)=>void,
  t:TFunction
)=> JSX.Element

export type OpenSankeySaveButtonFType = (t:TFunction) => JSX.Element
 
export type LastCheckpointTimeFType = (t:TFunction) => JSX.Element
