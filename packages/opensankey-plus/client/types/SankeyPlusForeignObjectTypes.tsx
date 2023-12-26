import { TFunction } from 'i18next'
import { SankeyData, SankeyPlusData, SankeyPlusNode } from './Types'
import { NodeTooltipsContentFType } from 'open-sankey/src/types/SankeyTooltipTypes'
import { GetLinkValueFuncType } from 'open-sankey/src/types/FunctionTypes'

export type SankeyPlusNodeFOFType = (
  t:TFunction,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  is_activated:boolean,
  editor_content_fo_node:string,
  set_editor_content_fo_node:(s:string)=>void
) => JSX.Element

export type SankeyPlusDrawNodesFOFType = (
  data:SankeyPlusData,
  display_nodes : { [node_id: string]: SankeyPlusNode },
  mode_selection:{current:string},
  NodeTooltipsContent: NodeTooltipsContentFType,
  GetLinkValue:GetLinkValueFuncType
) => void

