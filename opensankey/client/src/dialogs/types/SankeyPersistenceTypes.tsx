import { DefaultSankeyDataFuncType } from '../../configmenus/types/SankeyUtilsTypes'

import { ConvertDataFuncType } from '../../configmenus/types/SankeyConvertTypes'
import { updateLayoutFuncType } from '../../draw/types/SankeyDrawLayoutTypes'
import { SankeyData, callbackFuncType, applicationDataType, dict_variable_elements_selectedType } from '../../types/Types'
import { GetSankeyMinWidthAndHeightFuncType } from '../../configmenus/types/SankeyUtilsTypes'

/**
 * Description placeholder
 *
 * @param {{url_prefix:string,finishReconciliation:(x:boolean)=>void,value:number[],result:string,setResult:(x:string)=>void}} {url_prefix,finishReconciliation,value,result,setResult}
 * @returns {void; value: {}; result: string; setResult: (x: string) => void; }) => any}
 */
export type CounterFType = (
  {
    url_prefix,
    finishReconciliation,
    value,
    result,
    setResult
  }:{
    url_prefix:string,
    finishReconciliation:(x:boolean)=>void,
    value:number[],
    result:string,
    setResult:(x:string)=>void
  }
) => unknown

export type ProcessExampleFuncType = (
  applicationData:applicationDataType,
    updateLayout: updateLayoutFuncType,
    convert_data: ConvertDataFuncType,
    callback: (server_data: SankeyData) => void,
    DefaultSankeyData: DefaultSankeyDataFuncType
) => SankeyData

export type RetrieveExcelResultsFuncType = (
  applicationData : applicationDataType,
  text: string,
  updateLayout: updateLayoutFuncType,
  callback: callbackFuncType,
  GetSankeyMinWidthAndHeight: GetSankeyMinWidthAndHeightFuncType,
  convert_data: ConvertDataFuncType,
  defaultData: () => SankeyData
) => void

export type SaveDiagramOptionsType = {
  mode_save : boolean,
  mode_visible_element: boolean
}

export type ClickSaveDiagramFuncType = (
  applicationData : applicationDataType,
  data:SankeyData,
  elementsSelected:dict_variable_elements_selectedType,
  options: SaveDiagramOptionsType
) => void

export type DownloadExamplesFuncType = (file_name: string, the_url_prefix: string, filetype: string) => void

export type UploadExcelImplFuncType = (set_show_excel_dialog: (b: boolean) => void, input_file: Blob, the_url_prefix: string) => void

export type UploadExempleFuncType = (file_name: string, the_url_prefix: string, data: SankeyData, set_data: (data: SankeyData) => void, Reinitialization: () => void, convert_data: ConvertDataFuncType, DefaultSankeyData: DefaultSankeyDataFuncType) => void


export type ClickSaveExcelFuncType = (url_prefix: string, data: SankeyData,file_name?:string) => void

//export default SankeyLoad
