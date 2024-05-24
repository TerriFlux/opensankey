import { OSPApplicationContextType, OSPComponentUpdaterType, OSPApplicationDataType, OSPData } from './Types'
import { OpenSankeyDiagramSelectorFType } from 'open-sankey/src/dialogs/types/SankeyMenuDialogsTypes'

export type plus_convert_dataFType = (
  data:OSPData,
  DefaultSankeyData: ()=>OSPData
)=> void

export type OSPDiagramSelectorFType = (
  applicationData:OSPApplicationDataType,
) => OpenSankeyDiagramSelectorFType

export type OSPTransformationElementsFType = {
  applicationData:OSPApplicationDataType,
  applicationContext:OSPApplicationContextType,
  ComponentUpdater:OSPComponentUpdaterType
}

export type plus_sankey_layoutFType=(
  data:OSPData,
  new_layout:OSPData,
  mode:string[]
)=> void