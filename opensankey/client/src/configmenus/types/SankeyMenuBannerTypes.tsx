import { Type_AdditionalMenus, Type_GenericApplicationDataOS } from '../../types/TypesOS'

export type FType_SetDiagram = (
  the_diagram: string,
  new_data: Type_GenericApplicationDataOS
) => void


export type FCType_AddAllDropDownNode = {
  new_data: Type_GenericApplicationDataOS,
  level: boolean,
}

/**
 * Function that generate dropdown for each groupTag of linkTags
 * @param {applicationContextType} applicationContext
 * @param {applicationDataType} applicationData
 */
export type FCType_AddAllDropDownFluxFType = {
  new_data: Type_GenericApplicationDataOS
}

/**
 * Fucntion to create the toolbar component, the toolbar is used to edit the sankey quicly
 */
export type FCType_ToolbarBuilder = {
  new_data: Type_GenericApplicationDataOS,
  additionalMenu: Type_AdditionalMenus,
}

export type FType_StretchButtons = (
  new_data: Type_GenericApplicationDataOS
) => JSX.Element


export type FCType_DataTagSelector = {
  new_data: Type_GenericApplicationDataOS,
  in_popover: boolean
}