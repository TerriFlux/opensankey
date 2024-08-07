import { TFunction } from 'i18next'
import { 
  SankeyData, applicationDataType } from '../../types/Types'
import { ConvertDataFuncType } from './SankeyConvertTypes'
import { DefaultSankeyDataFuncType } from './SankeyUtilsTypes'

export type setDiagramFuncType = (
  the_diagram: string,
  set_data: (d: SankeyData) => void,
  convert_data: ConvertDataFuncType,
  DefaultSankeyData:DefaultSankeyDataFuncType
) => void

export type addSimpleLevelDropDownFType = {
  applicationData:applicationDataType
}


export type addAllDropDownNodeFType = {
  
  applicationData:applicationDataType,
  level:boolean,
}

/**
 * Function that generate dropdown for each groupTag of linkTags
 * @param {applicationContextType} applicationContext
 * @param {applicationDataType} applicationData
 */
export type AddAllDropDownFluxFType = {
  applicationData: applicationDataType
}

/**
 * Fucntion to create the toolbar component, the toolbar is used to edit the sankey quicly
 */
export type ToolbarBuilderFType = {
  
  applicationData:applicationDataType,
  filter:number,
  set_current_filter:(n:number)=>void,
  url_prefix: string,
  additional_link_visual_filter_content:JSX.Element[],
}

export type stretchButtonsFType=(
  applicationData : applicationDataType,
  t:TFunction
)=>JSX.Element


export type DataTagSelectorType = {
  applicationData:applicationDataType,
  in_popover:boolean
}