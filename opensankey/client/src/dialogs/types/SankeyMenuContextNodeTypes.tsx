import {
  applicationDataType
} from '../../types/LegacyType'

export type ContextMenuNodeFType = {
  applicationData: applicationDataType,
  additional_context_element_menu: JSX.Element[],
  additional_context_element_other: JSX.Element[],
}