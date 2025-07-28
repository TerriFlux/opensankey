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

import { TFunction } from 'i18next'
import {
  SankeyData,
  SankeyNode,
  treeFolderType
} from '../../../Persistence/LegacyType'

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