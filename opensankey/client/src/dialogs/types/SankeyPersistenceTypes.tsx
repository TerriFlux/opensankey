
import { SankeyData, applicationDataType } from '../../types/Types'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Type_JSON } from '../../types/Utils'

import { DefaultSankeyDataFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { ConvertDataFuncType } from '../../configmenus/types/SankeyConvertTypes'

/**
 * Description placeholder
 *
 * @param {{url_prefix:string,finishReconciliation:(x:boolean)=>void,value:number[],result:string,setResult:(x:string)=>void}} {url_prefix,finishReconciliation,value,result,setResult}
 * @returns {void; value: {}; result: string; setResult: (x: string) => void; }) => any}
 */
export type CounterType={
  url_prefix:string,
  finishReconciliation:(x:boolean)=>void,
  value:number[],
  result:string,
  set_result:(_:string)=>void
}
export type ProcessExampleFuncType = (
  applicationData:applicationDataType,
    convert_data: ConvertDataFuncType,
    postProcessLoadExcel: (server_data: SankeyData) => void,
    DefaultSankeyData: DefaultSankeyDataFuncType
) => SankeyData

export type RetrieveExcelResultsFuncType = (
  applicationData : applicationDataType,
  text: string,
) => void

export type SaveDiagramOptionsType = {
  mode_save : boolean,
  mode_visible_element: boolean
}

export type ClickSaveDiagramFuncType = (
  ApplicationClass:Class_ApplicationData,
  options: SaveDiagramOptionsType
) => void

export type DownloadExamplesFuncType = (file_name: string, the_url_prefix: string, filetype: string) => void

export type UploadExcelImplFuncType = (set_show_excel_dialog: (b: boolean) => void, input_file: Blob, the_url_prefix: string) => void

export type UploadExempleFuncType = (file_name: string, the_url_prefix: string, data: SankeyData, set_data: (data: SankeyData) => void, Reinitialization: () => void, convert_data: ConvertDataFuncType, DefaultSankeyData: DefaultSankeyDataFuncType) => void

export type ClickSaveExcelFuncType = (
  url_prefix: string,
  data_as_JSON: Type_JSON,
  file_name?: string
) => void

