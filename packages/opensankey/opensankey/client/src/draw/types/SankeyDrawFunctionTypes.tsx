import { SankeyNode, applicationDataType, display_styleType } from '../../types/Types'
import { GetLinkValueFuncType } from '../../configmenus/types/SankeyUtilsTypes'


export type DrawArrowsType = (
  n: SankeyNode,
  applicationData:applicationDataType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType,
  display_style: display_styleType
) => void