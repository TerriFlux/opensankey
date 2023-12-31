import { TFunction } from 'i18next'
import { SankeyData, SankeyLink, SankeyNode, showMenuComponentsType } from './Types'

export type ContextMenuNodeFType = (
  contextualised_node : SankeyNode|undefined,
  set_contextualised_node:(n:SankeyNode|undefined)=>void,
  set_show_agregation: (_:boolean)=>void,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
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
) => JSX.Element