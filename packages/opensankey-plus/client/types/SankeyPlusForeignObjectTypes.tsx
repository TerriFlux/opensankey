import { TFunction } from 'i18next'
import { PlusElementsSelectedType, PlusNodeFuntionType, SankeyPlusData, SankeyPlusNode } from './Types'
import { NodeTooltipsContentFType } from 'open-sankey/src/draw/types/SankeyTooltipTypes'
import { GetLinkValueFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'
import { dict_variable_elements_selectedType } from 'open-sankey/src/types/Types'

export type SankeyPlusNodeFOFType = {
  t:TFunction,
  data:SankeyPlusData,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  is_activated:boolean,
  dict_variable_elements_selected:PlusElementsSelectedType,
  node_function:PlusNodeFuntionType
 }

export type PlusDrawNodesFOFType = (
  data:SankeyPlusData,
  display_nodes : { [node_id: string]: SankeyPlusNode },
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  NodeTooltipsContent: NodeTooltipsContentFType,
  GetLinkValue:GetLinkValueFuncType,
  t:TFunction
) => void

