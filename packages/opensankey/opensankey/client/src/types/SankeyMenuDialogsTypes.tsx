import { TFunction } from 'i18next'
import { SankeyData } from './Types'
import { ConvertDataFuncType  } from './SankeyConvertTypes'
import { updateLayoutFuncType } from './SankeyUtilsTypes'

export type OpenSankeyDiagramSelectorFType = (
  t: TFunction, 
  convert_data: ConvertDataFuncType,
  sankey_data: SankeyData,
  set_sankey_data: (s:SankeyData)=>void,
  prev_sankey_data: SankeyData,
  set_prev_sankey_data: (s:SankeyData)=>void, 
  updateLayout: updateLayoutFuncType, 
  elementToDispose : string[],
  DefaultSankeyData: ()=>SankeyData
) => JSX.Element


