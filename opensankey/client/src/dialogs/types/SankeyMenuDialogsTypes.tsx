import { applicationDataType } from '../../types/LegacyType'

import { MutableRefObject } from 'react'

export type OpenSankeyDiagramSelectorFType = (
  applicationData:applicationDataType,
  
  elementToDispose : MutableRefObject<string[]>,

) => JSX.Element

export type initializeDiagrammSelectorFType=(applicationData:applicationDataType)=>OpenSankeyDiagramSelectorFType

/**
 * Define ApplyLayoutDialog
 *
 * @type {{ ref_setter_show_apply_layout: any; set_show_apply_layout: any; sankey_data: any; set_sankey_data: any; }}
 */
export type ApplyLayoutDialogTypes = {
  
  applicationData:applicationDataType,
  diagramSelector: OpenSankeyDiagramSelectorFType,
  apply_transformation_additional_elements: JSX.Element[],
}

