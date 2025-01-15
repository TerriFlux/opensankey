import { Type_GenericApplicationData } from '../../../types/Types'

export type FType_DiagramSelector = (
  new_data: Type_GenericApplicationData
) => JSX.Element

export type FType_InitializeDiagrammSelector = (
  new_data: Type_GenericApplicationData
) => FType_DiagramSelector

/**
 * Define ApplyLayoutDialog
 *
 * @type {{ ref_setter_show_modal_apply_layout: any; set_show_apply_layout: any; sankey_data: any; set_sankey_data: any; }}
 */
export type FCType_ApplyLayoutDialog = {
  applicationData: Type_GenericApplicationData,
  diagramSelector: FType_DiagramSelector,
  apply_transformation_additional_elements: JSX.Element[],
}

