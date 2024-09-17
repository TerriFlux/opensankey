import { OSPApplicationDataType, OSPData } from './Types'
import { FType_DiagramSelector } from '../src/deps/OpenSankey/dialogs/types/SankeyMenuDialogsTypes'
import { Type_GenericApplicationDataOSP } from '../src/types/TypesOSP'

export type FType_ConvertDataOSP = (
  data: OSPData,
  DefaultSankeyData: () => OSPData
) => void

export type FType_DiagramSelectorOSP = (
  applicationData: OSPApplicationDataType,
) => FType_DiagramSelector

export type FCType_TransformationElementsOSP = {
  new_data_plus: Type_GenericApplicationDataOSP,
}

export type FType_sankeyLayoutOSP = (
  data: OSPData,
  new_layout: OSPData,
  mode: string[]
) => void