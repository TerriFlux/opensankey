import { TFunction } from "i18next"
import { GetLinkValueFuncType, drag_legend_g_elementFuncType } from "./FunctionTypes"
import { SankeyData, SankeyLink, SankeyNode } from "./Types"

export type OpenSankeyDrawLegend = (
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  display_nodes : { [node_id: string]: SankeyNode },
  GetLinkValue:GetLinkValueFuncType,
  t:TFunction,
  pointer_pos:{current:number[]},
  set_tag_contextualised:(t:string)=>void,
  legend_clicked:boolean,
  set_legend_clicked:(b:boolean)=>void,
) => JSX.Element

export type drag_legend=(data:SankeyData,
  set_data:(d:SankeyData)=>void
)=> void

export type context_legend_tags=(
  tag_contextualised:string|undefined,
  set_tag_contextualised:(t:string|undefined)=>void,
  data:SankeyData,set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]},
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction,
  pointer_pos:{current:number[]},
  GetLinkValue:GetLinkValueFuncType,
)=> JSX.Element
