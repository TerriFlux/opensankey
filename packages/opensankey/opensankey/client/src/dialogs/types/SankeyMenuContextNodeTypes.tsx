import { 
  agregationType, 
  applicationDataType} from '../../types/Types'

export type ContextMenuNodeFType = {
  applicationData : applicationDataType,
  agregation: agregationType,
  additional_context_element_menu:JSX.Element[],
  additional_context_element_other:JSX.Element[],
 }