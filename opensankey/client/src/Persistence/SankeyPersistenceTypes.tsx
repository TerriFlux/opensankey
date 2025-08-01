// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import { SankeyData } from './LegacyType'
import { Type_JSON } from '../types/Utils'
import { Class_ApplicationData } from '../types/ApplicationData'

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
  applicationData: Class_ApplicationData,
  postProcessLoadExcel: (server_data: SankeyData) => void,
) => void

export type FType_RetrieveExcelResults = (
  new_data: Class_ApplicationData,
  text: string,
) => void

export type Type_SaveDiagramOptions = {
  mode_save?: boolean,
  mode_visible_element?: boolean
}

export type FType_ClickSaveDiagram = (
  new_data: Class_ApplicationData
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
  applicationData: Class_ApplicationData
) => void

export type FType_JSONtoExcel = (
  data_as_json: Type_JSON,
  url_prefix: string,
  file_name: string,
  save_options:JSON
) => void
