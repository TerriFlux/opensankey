import { SankeyNode, applicationDataType, display_styleType,GetLinkValueFuncType} from '../../types/LegacyType'


export type DrawArrowsType = (
  n: SankeyNode,
  applicationData:applicationDataType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType,
  display_style: display_styleType
) => void