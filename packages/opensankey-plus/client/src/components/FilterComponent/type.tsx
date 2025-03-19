import { Type_GenericApplicationDataOSP } from '../../types/TypesOSP'

export type FCType_DataTagSelector = {
    new_data: Type_GenericApplicationDataOSP,
    in_popover: boolean
  }
  
export type FCType_DataTagGroupFilter={
    new_data:Type_GenericApplicationDataOSP
  }
  
export type FCType_FlowValueFilter={
    new_data:Type_GenericApplicationDataOSP
  }

export type FCType_ToolbarFilter={
    new_data:Type_GenericApplicationDataOSP
  }

export type FCType_NodeTagGroupFilter = {
    new_data: Type_GenericApplicationDataOSP,
    level: boolean,
  }

/**
   * Function that generate dropdown for each groupTag of linkTags
   * @param {Type_GenericApplicationDataOSP} applicationData
   */
export type FCType_FlowTagGroupFilterFType = {
    new_data: Type_GenericApplicationDataOSP
  }
  