import { PlusApplicationContextType, PlusComponentUpdaterType, SankeyPlusApplicationDataType, SankeyPlusData } from './Types'
import { OpenSankeyDiagramSelectorFType } from 'open-sankey/src/dialogs/types/SankeyMenuDialogsTypes'

export type plus_convert_dataFType = (
  data:SankeyPlusData,
  DefaultSankeyData: ()=>SankeyPlusData
)=> void

export type SankeyPlusDiagramSelectorFType = (
  dict_variable_application_data:SankeyPlusApplicationDataType,
) => OpenSankeyDiagramSelectorFType

export type PlusTranformationElementsFType = {
  dict_variable_application_data:SankeyPlusApplicationDataType,
  applicationContext:PlusApplicationContextType,
  ComponentUpdater:PlusComponentUpdaterType
}

export type plus_sankey_layoutFType=(
  data:SankeyPlusData,
  new_layout:SankeyPlusData,
  mode:string[]
)=> void