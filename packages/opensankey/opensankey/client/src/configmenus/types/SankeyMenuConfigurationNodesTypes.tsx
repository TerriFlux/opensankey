import { TFunction } from 'i18next'
import {
  SankeyData,
  SankeyNode,
  treeFolderType
} from '../../types/LegacyType'

export type tree_data_nodesFType = (t: TFunction<'translation', undefined>, data: SankeyData, multi_selected_nodes: { current: SankeyNode[] }, node_visible: string[],
  filter_node_selector: string[]
) => treeFolderType

export type add_childrenFType = (
  nodes: { [x: string]: SankeyNode }, n: SankeyNode, multi_selected_nodes: { current: SankeyNode[] }, displayed_node_selector: boolean, node_visible: string[], filter_node_selector: string[]
) => treeFolderType[]


export type getNodeFromTreeFType = (
  path: number[],
  tree: treeFolderType
) => { id: string, checked?: number }


export type check_node_has_node_typeFType = (
  n: SankeyNode,
  filter_node_selector: string[]
) => boolean