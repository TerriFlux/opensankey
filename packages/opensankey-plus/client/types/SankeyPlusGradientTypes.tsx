import { OSPApplicationDataType, OSPData, OSPLink, OSPNode } from './Types'
// import { GetLinkValueFuncType } from '../src/deps/OpenSankey/configmenus/types/SankeyUtilsTypes'
// import { SankeyNode, display_styleType } from '../src/deps/OpenSankey/types/Types'
// import { LinkStrokeFType } from '../src/deps/OpenSankey/draw/types/SankeyDrawFunctionTypes'

export type MenuConfLinkApparenceGradientFType={
  applicationData:OSPApplicationDataType,
  is_activated:boolean,
  menu_for_style:boolean,
}

// export type OSPLinkStrokeFType = LinkStrokeFType

// Function used to create gradient for each link, but are used only if the link has the gradient varibale at true
export type dragNodeRedrawGradientFType=(
  nodes:{ [node_id: string]: OSPNode },
  link:OSPLink,
  data:OSPData,
)=>void


// export type OSPDrawArrowsFType = (
//   n: SankeyNode,
//   applicationData:OSPApplicationDataType,
//   scale:(t:number)=>number,
//   inv_scale:(t:number)=>number,
//   GetLinkValue:GetLinkValueFuncType,
//   display_style: display_styleType,
// ) => void
