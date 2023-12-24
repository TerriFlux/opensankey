import { TFunction } from "i18next"
import { SankeyData, SankeyPlusData, SankeyPlusNode } from "./Types"
import { NodeTooltipsContentFType } from "open-sankey/types/SankeyTooltipTypes"

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
  data:SankeyData,
  display_nodes : { [node_id: string]: SankeyPlusNode },
  mode_selection:{current:string},
  NodeTooltipsContent: NodeTooltipsContentFType
) => JSX.Element

