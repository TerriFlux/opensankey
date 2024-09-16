import { MutableRefObject } from 'react'
import { Type_GenericApplicationDataOS } from '../../types/TypesOS'

export type FType_OpenSankeyDiagramSelector = (
  new_data: Type_GenericApplicationDataOS,
  elementToDispose: MutableRefObject<string[]>,
) => JSX.Element

export type FType_InitializeDiagrammSelector = (
  new_data: Type_GenericApplicationDataOS
) => FType_OpenSankeyDiagramSelector

/**
 * Define ApplyLayoutDialog
 *
 * @type {{ ref_setter_show_modal_apply_layout: any; set_show_apply_layout: any; sankey_data: any; set_sankey_data: any; }}
 */
export type FCType_ApplyLayoutDialog = {
  new_data: Type_GenericApplicationDataOS,
  diagramSelector: FType_OpenSankeyDiagramSelector,
  apply_transformation_additional_elements: JSX.Element[],
}

