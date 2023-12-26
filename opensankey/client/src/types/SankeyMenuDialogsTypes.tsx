
// /**
//  * Define ApplyLayoutDialog
//  *
//  * @type {{ show_apply_layout: any; set_show_apply_layout: any; sankey_data: any; set_sankey_data: any; }}
//  */
// const ApplyLayoutDialogPropTypes = {
//   t:PropTypes.func.isRequired,
//   show_apply_layout : PropTypes.bool.isRequired,
//   set_show_apply_layout: PropTypes.func.isRequired,
//   sankey_data : PropTypes.shape(SankeyDataPropTypes).isRequired,
//   set_sankey_data : PropTypes.func.isRequired,
//   updateLayout:PropTypes.func.isRequired,
//   convert_data:PropTypes.func.isRequired,
//   node_hspace:PropTypes.number.isRequired,
//   set_node_hspace:PropTypes.func.isRequired,
//   node_vspace:PropTypes.number.isRequired,
//   set_node_vspace:PropTypes.func.isRequired,
//   diagramSelector: PropTypes.func.isRequired,
//   elementToDispose:PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
//   apply_transformation_additional_elements: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
//   DefaultSankeyData: PropTypes.func.isRequired,
// }

import { TFunction } from "i18next";
import { SankeyData } from "./Types";
import { updateLayoutFuncType } from "./FunctionTypes";

// /**
//  *
//  * @typedef {ApplyLayoutDialogTypes}
//  */
// type ApplyLayoutDialogTypes = InferProps<typeof ApplyLayoutDialogPropTypes>


// const ExcelModalPropTypes = {
//   t:PropTypes.func.isRequired,
//   UploadExcelImpl: PropTypes.func.isRequired,
//   handleCloseDialog: PropTypes.func.isRequired,
//   show_excel_dialog: PropTypes.bool.isRequired,
//   set_show_excel_dialog: PropTypes.func.isRequired,
//   url_prefix: PropTypes.string.isRequired,
//   callback: PropTypes.func.isRequired,
//   launch: PropTypes.func.isRequired
// }

// type ExcelModalTypes = InferProps<typeof ExcelModalPropTypes>


export type OpenSankeyDiagramSelectorFType = (
  t: TFunction, 
  convert_data: (s:SankeyData,DefaultSankeyData:()=>void)=>null,
  sankey_data: SankeyData,
  set_sankey_data: (s:SankeyData)=>null,
  prev_sankey_data: SankeyData,
  set_prev_sankey_data: (s:SankeyData)=>void, 
  updateLayout: updateLayoutFuncType, 
  elementToDispose : string[],
  DefaultSankeyData: ()=>SankeyData
) => JSX.Element


