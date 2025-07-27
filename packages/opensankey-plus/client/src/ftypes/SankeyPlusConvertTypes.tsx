
import { FType_DiagramSelector } from '../deps/OpenSankey/components/dialogs/types/SankeyMenuDialogsTypes'

import { OSPApplicationDataType, OSPData } from '../types/LegacyTypes'
import { Type_GenericApplicationDataOSP } from '../types/TypesOSP'

export type FType_DiagramSelectorOSP = (
  applicationData: OSPApplicationDataType,
) => FType_DiagramSelector

export type FCType_TransformationElementsOSP = {
  new_data_plus: Type_GenericApplicationDataOSP,
}

export type FType_SankeyLayoutOSP = (
  data: OSPData,
  new_layout: OSPData,
  mode: string[]
) => void