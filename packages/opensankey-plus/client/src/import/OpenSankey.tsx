import * as OpensankeyUtils from 'open-sankey/dist/lib/SankeyUtils'
import * as OpenSankeyDrawFunc from 'open-sankey/dist/lib/SankeyDrawFunction'
import * as OpensankeyDragFunc from 'open-sankey/dist/lib/SankeyDrag'
import * as OpensankeyConvert from 'open-sankey/dist/lib/SankeyConvert'
import { DragLegendGElement} from 'open-sankey/dist/lib/SankeyDrawLegend'

import { 
  ReturnValueLinkFuncType, ReturnValueNodeFuncType, IsAllLinkAttrSameValueFuncType, IsLinkDisplayingValueLocalFuncType, 
  NodeColorFuncType, GetSankeyMinWidthAndHeightFuncType, IsNodeDisplayingValueLocalFuncType, IsAllNodeAttrSameValueFuncType, 
  AssignNodeValueToCorrectVarFuncType, LinkColorFuncType, AssignLinkValueToCorrectVarFuncType, DefaultLinkStyleFuncType, 
  DefaultLinkFuncType, DefaultNodeFuncType, updateLayoutFuncType, AdjustSankeyZoneFuncType, NodeDisplayedFuncType, reorganize_node_inputLinksIdFuncType, reorganize_node_outputLinksIdFuncType, synchronizeNodesandLinksIdFuncType 
} from 'open-sankey/src/types/SankeyUtilsTypes'
import { complete_sankey_dataFunctType, ConvertDataFuncType, convert_nodesFuncType, convert_linksFuncType, convert_tagsFuncType } from 'open-sankey/src/types/SankeyConvertTypes'
import { 
  drawArrowsType, NodeVisibleOnsSvgFuncType, 
  LinkVisibleOnsSvgFuncType, DeselectVisualyNodesFuncType, RemoveAnimateFuncType, 
  SvgDragMiddleMouseStartFuncType, SvgDragMiddleMouseMoveFuncType, SimpleGNodeClickFuncType, DrawGridFType 
} from 'open-sankey/src/types/SankeyDrawFunctionTypes'
import { LinkStrokeFuncType } from 'open-sankey/src/types/SankeyDrawLinksTypes'
import { drag_elementsFuncType, drag_node_textFuncType, opposing_drag_elementsFuncType, return_out_of_bound_elementFuncType } from 'open-sankey/src/types/SankeyDragTypes'
import { drag_legend_g_elementFuncType } from 'open-sankey/src/types/SankeyDrawLegendTypes'

export const ReturnValueLink=OpensankeyUtils.ReturnValueLink as ReturnValueLinkFuncType

export const ReturnValueNode=OpensankeyUtils.ReturnValueNode as ReturnValueNodeFuncType

export const IsAllLinkAttrSameValue=OpensankeyUtils.IsAllLinkAttrSameValue as IsAllLinkAttrSameValueFuncType

export const IsLinkDiplayingValueLocal =OpensankeyUtils.IsLinkDiplayingValueLocal as IsLinkDisplayingValueLocalFuncType

export const NodeColor = OpensankeyUtils.NodeColor as NodeColorFuncType

export const LinkStrokeOSTyped = OpenSankeyDrawFunc.LinkStroke as LinkStrokeFuncType

export const DrawArrows = OpenSankeyDrawFunc.DrawArrows as drawArrowsType

export const DrawGrid = OpenSankeyDrawFunc.DrawGrid as DrawGridFType

export const GetSankeyMinWidthAndHeight = OpenSankeyDrawFunc.GetSankeyMinWidthAndHeight as GetSankeyMinWidthAndHeightFuncType

export const NodeVisibleOnsSvg = OpenSankeyDrawFunc.NodeVisibleOnsSvg as NodeVisibleOnsSvgFuncType

export const LinkVisibleOnSvg = OpenSankeyDrawFunc.LinkVisibleOnSvg as LinkVisibleOnsSvgFuncType

export const DeselectVisualyNodes = OpenSankeyDrawFunc.DeselectVisualyNodes as DeselectVisualyNodesFuncType

export const RemoveAnimate = OpenSankeyDrawFunc.RemoveAnimate as RemoveAnimateFuncType

export const SvgDragMiddleMouseStart = OpenSankeyDrawFunc.SvgDragMiddleMouseStart as SvgDragMiddleMouseStartFuncType

export const SvgDragMiddleMouseMove = OpenSankeyDrawFunc.SvgDragMiddleMouseMove as SvgDragMiddleMouseMoveFuncType

export const SimpleGNodeClick = OpenSankeyDrawFunc.SimpleGNodeClick as SimpleGNodeClickFuncType

export const IsNodeDisplayingValueLocal = OpensankeyUtils.IsNodeDisplayingValueLocal as IsNodeDisplayingValueLocalFuncType

export const IsAllNodeAttrSameValue = OpensankeyUtils.IsAllNodeAttrSameValue as IsAllNodeAttrSameValueFuncType

export const AssignNodeValueToCorrectVar:AssignNodeValueToCorrectVarFuncType = OpensankeyUtils.AssignNodeValueToCorrectVar

export const OpposingDragElements:opposing_drag_elementsFuncType = OpensankeyDragFunc.OpposingDragElements

export const drag_elements:drag_elementsFuncType = OpensankeyDragFunc.drag_elements

export const drag_node_text:drag_node_textFuncType = OpensankeyDragFunc.drag_node_text

export const return_out_of_bound_element:return_out_of_bound_elementFuncType =OpensankeyDragFunc.return_out_of_bound_element

export const DragLegendGElementOSTyped:drag_legend_g_elementFuncType = DragLegendGElement

export const LinkColor:LinkColorFuncType=OpensankeyUtils.LinkColor

export const AssignLinkValueToCorrectVar:AssignLinkValueToCorrectVarFuncType = OpensankeyUtils.AssignLinkValueToCorrectVar

export const DefaultLinkStyle:DefaultLinkStyleFuncType = OpensankeyUtils.DefaultLinkStyle

export const DefaultLink:DefaultLinkFuncType = OpensankeyUtils.DefaultLink

export const DefaultNode:DefaultNodeFuncType = OpensankeyUtils.DefaultNode

export const updateLayoutOSTyped:updateLayoutFuncType = OpensankeyUtils.updateLayout

export const AdjustSankeyZone:AdjustSankeyZoneFuncType= OpensankeyUtils.AdjustSankeyZone

export const synchronizeNodesandLinksIdOSTyped:synchronizeNodesandLinksIdFuncType = OpensankeyUtils.synchronizeNodesandLinksId

export const complete_sankey_data:complete_sankey_dataFunctType = OpensankeyConvert.complete_sankey_data

export const convert_data:ConvertDataFuncType = OpensankeyConvert.convert_data

export const convert_nodes:convert_nodesFuncType = OpensankeyConvert.convert_nodes

export const convert_links:convert_linksFuncType = OpensankeyConvert.convert_links

export const convert_tags:convert_tagsFuncType = OpensankeyConvert.convert_tags

export const NodeDisplayed:NodeDisplayedFuncType = OpensankeyUtils.NodeDisplayed

export const reorganize_node_outputLinksIdOSTyped:reorganize_node_outputLinksIdFuncType = OpensankeyUtils.reorganize_node_outputLinksId

export const reorganize_node_inputLinksIdOSTyped:reorganize_node_inputLinksIdFuncType = OpensankeyUtils.reorganize_node_inputLinksId