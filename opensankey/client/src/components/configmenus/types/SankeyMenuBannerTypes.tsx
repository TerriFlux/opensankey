import { Type_AdditionalMenus, Type_GenericApplicationData } from '../../../types/Types'

export type FType_SetDiagram = (
  the_diagram: string,
  new_data: Type_GenericApplicationData
) => void


export type FCType_AddAllDropDownNode = {
  new_data: Type_GenericApplicationData,
  level: boolean,
}

/**
 * Function that generate dropdown for each groupTag of linkTags
 * @param {applicationContextType} applicationContext
 * @param {applicationDataType} applicationData
 */
export type FCType_AddAllDropDownFluxFType = {
  new_data: Type_GenericApplicationData
}

/**
 * Fucntion to create the toolbar component, the toolbar is used to edit the sankey quicly
 */
export type FCType_ToolbarBuilder = {
  new_data: Type_GenericApplicationData,
  additionalMenu: Type_AdditionalMenus,
}

export type FType_StretchButtons = (
  new_data: Type_GenericApplicationData
) => JSX.Element


export type FCType_DataTagSelector = {
  new_data: Type_GenericApplicationData,
  in_popover: boolean
}