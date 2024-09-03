import { OSPApplicationDataType } from './Types'
//import { NodeTooltipsContentFType } from '../src/deps/OpenSankey/draw/types/SankeyTooltipTypes'
// import { GetLinkValueFuncType } from '../src/deps/OpenSankey/configmenus/types/SankeyUtilsTypes'
// import { applicationStateType } from '../src/deps/OpenSankey/types/Types'

export type OSPNodeFOFType = {
    applicationData:OSPApplicationDataType,
  is_activated:boolean,
 }

// export type OSPDrawNodesFOFType = (
//   data:OSPData,
//   display_nodes : { [node_id: string]: OSPNode },
//   applicationState:applicationStateType,
//   NodeTooltipsContent: NodeTooltipsContentFType,
//   GetLinkValue:GetLinkValueFuncType,
//   t:TFunction
// ) => void

