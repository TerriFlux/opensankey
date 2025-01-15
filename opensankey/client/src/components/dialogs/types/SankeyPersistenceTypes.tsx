
import { SankeyData } from '../../../types/LegacyType'
import { Type_GenericApplicationData } from '../../../types/Types'
import { Type_JSON } from '../../../types/Utils'

/**
 * Description placeholder
 *
 * @param {{url_prefix:string,finishReconciliation:(x:boolean)=>void,value:number[],result:string,setResult:(x:string)=>void}} {url_prefix,finishReconciliation,value,result,setResult}
 * @returns {void; value: {}; result: string; setResult: (x: string) => void; }) => any}
 */
export type FCType_Counter = {
  url_prefix: string,
  finishReconciliation: (x: boolean) => void,
  value: number[],
  result: string,
  set_result: (_: string) => void
}

export type FType_ProcessExample = (
  applicationData: Type_GenericApplicationData,
  postProcessLoadExcel: (server_data: SankeyData) => void,
) => void

export type FType_RetrieveExcelResults = (
  new_data: Type_GenericApplicationData,
  text: string,
) => void

export type Type_SaveDiagramOptions = {
  mode_save?: boolean,
  mode_visible_element?: boolean
}

export type FType_ClickSaveDiagram = (
  new_data: Type_GenericApplicationData
) => void

export type FType_DownloadExamples = (
  file_name: string,
  filetype: string
) => void

export type FType_UploadExcelImpl = (
  set_show_excel_dialog: (b: boolean) => void,
  input_file: Blob,
  the_url_prefix: string
) => void

export type FType_UploadExemple = (
  file_name: string,
  applicationData: Type_GenericApplicationData
) => void

export type FType_JSONtoExcel = (
  data_as_json: Type_JSON,
  url_prefix: string,
  file_name?: string
) => void
