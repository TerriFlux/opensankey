import { Class_ApplicationDataOSP } from '../../types/ApplicationDataOSP'


export type FCType_DataTagSelector = {
    new_data: Class_ApplicationDataOSP,
    in_popover: boolean
  }
  
export type FCType_DataTagGroupFilter={
    new_data:Class_ApplicationDataOSP
  }
  
export type FCType_FlowValueFilter={
    new_data:Class_ApplicationDataOSP
  }

export type FCType_ToolbarFilter={
    new_data:Class_ApplicationDataOSP
  }

export type FCType_NodeTagGroupFilter = {
    new_data: Class_ApplicationDataOSP,
    level: boolean,
  }

/**
   * Function that generate dropdown for each groupTag of linkTags
   * @param {Class_ApplicationDataOSP} applicationData
   */
export type FCType_FlowTagGroupFilterFType = {
    new_data: Class_ApplicationDataOSP
  }
  