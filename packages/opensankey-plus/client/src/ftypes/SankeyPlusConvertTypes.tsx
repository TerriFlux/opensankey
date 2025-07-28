
import { FType_DiagramSelector } from '../deps/OpenSankey/components/dialogs/types/SankeyMenuDialogsTypes'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'

import { OSPApplicationDataType, OSPData } from '../types/LegacyTypes'

export type FType_DiagramSelectorOSP = (
  applicationData: OSPApplicationDataType,
) => FType_DiagramSelector

export type FCType_TransformationElementsOSP = {
  new_data_plus: Class_ApplicationDataOSP,
}

export type FType_SankeyLayoutOSP = (
  data: OSPData,
  new_layout: OSPData,
  mode: string[]
) => void