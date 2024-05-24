import { TFunction } from 'i18next'
import { OSPElementsSelectedType, OSPNodeFuntionType, OSPData, OSPNode } from './Types'
import { NodeTooltipsContentFType } from 'open-sankey/src/draw/types/SankeyTooltipTypes'
import { GetLinkValueFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'
import { applicationStateType } from 'open-sankey/src/types/Types'

export type OSPNodeFOFType = {
  t:TFunction,
  data:OSPData,
  multi_selected_nodes:{current:OSPNode[]},
  is_activated:boolean,
  applicationState:OSPElementsSelectedType,
  node_function:OSPNodeFuntionType
 }

export type OSPDrawNodesFOFType = (
  data:OSPData,
  display_nodes : { [node_id: string]: OSPNode },
  applicationState:applicationStateType,
  NodeTooltipsContent: NodeTooltipsContentFType,
  GetLinkValue:GetLinkValueFuncType,
  t:TFunction
) => void

