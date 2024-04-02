import * as OpensankeyUtils from 'open-sankey/dist/configmenus/SankeyUtils'
import * as OpenSankeyDrawFunc from 'open-sankey/dist/draw/SankeyDrawFunction'
import * as OpenSankeyDrawEventFunc from 'open-sankey/dist/draw/SankeyDrawEventFunction'
// import * as OpensankeyDragLinksFunc from 'open-sankey/dist/lib/SankeyDragLinks'
import * as OpensankeyDragNodeFunc from 'open-sankey/dist/draw/SankeyDragNodes'
import * as OpensankeyConvert from 'open-sankey/dist/configmenus/SankeyConvert'
import * as OpenSankeyLayout from 'open-sankey/dist/draw/SankeyDrawLayout'
import { DragLegendGElement} from 'open-sankey/dist/draw/SankeyDrawLegend'

import { 
  ReturnValueLinkFuncType, ReturnValueNodeFuncType, IsAllLinkAttrSameValueFuncType, IsLinkDisplayingValueLocalFuncType, 
  NodeColorFuncType, GetSankeyMinWidthAndHeightFuncType, IsNodeDisplayingValueLocalFuncType, IsAllNodeAttrSameValueFuncType, 
  AssignNodeValueToCorrectVarFuncType, LinkColorFuncType, AssignLinkValueToCorrectVarFuncType, DefaultLinkStyleFuncType, 
  DefaultLinkFuncType, DefaultNodeFuncType, AdjustSankeyZoneFuncType, NodeDisplayedFuncType 
} from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'
import { complete_sankey_dataFunctType, ConvertDataFuncType, convert_nodesFuncType, convert_linksFuncType, convert_tagsFuncType } from 'open-sankey/src/configmenus/types/SankeyConvertTypes'
import { 
  DrawArrowsType, NodeVisibleOnsSvgFuncType, 
  LinkVisibleOnsSvgFuncType, DeselectVisualyNodesFuncType, RemoveAnimateFuncType, 
  DrawGridFType, 
  SelectVisualyNodesFType,
  SelectVisualyLinksFType
} from 'open-sankey/src/draw/types/SankeyDrawFunctionTypes'
import { LinkStrokeFuncType } from 'open-sankey/src/draw/types/SankeyDrawLinksTypes'
import { DragElementsFuncType, drag_node_textFuncType, opposing_DragElementsFuncType, ReturnOutOfBoundElementFuncType } from 'open-sankey/src/draw/types/SankeyDragTypes'
import { drag_legend_g_elementFuncType } from 'open-sankey/src/draw/types/SankeyDrawLegendTypes'
import { reorganize_node_inputLinksIdFuncType, reorganize_node_outputLinksIdFuncType, synchronizeNodesandLinksIdFuncType, updateLayoutFuncType } from 'open-sankey/src/draw/types/SankeyDrawLayoutTypes'
import {SimpleGNodeClickFuncType, SvgDragMiddleMouseMoveFuncType, SvgDragMiddleMouseStartFuncType, actualizeDrawAreaFrameFType} from 'open-sankey/src/draw/types/SankeyDrawEventFunctionTypes'

export const ReturnValueLink=OpensankeyUtils.ReturnValueLink as ReturnValueLinkFuncType

export const ReturnValueNode=OpensankeyUtils.ReturnValueNode as ReturnValueNodeFuncType

export const IsAllLinkAttrSameValue=OpensankeyUtils.IsAllLinkAttrSameValue as IsAllLinkAttrSameValueFuncType

export const IsLinkDiplayingValueLocal =OpensankeyUtils.IsLinkDiplayingValueLocal as IsLinkDisplayingValueLocalFuncType

export const NodeColor = OpensankeyUtils.NodeColor as NodeColorFuncType

export const LinkStrokeOSTyped = OpenSankeyDrawFunc.LinkStroke as LinkStrokeFuncType

export const DrawArrows = OpenSankeyDrawFunc.DrawArrows as DrawArrowsType

export const DrawGrid = OpenSankeyDrawFunc.DrawGrid as DrawGridFType

export const GetSankeyMinWidthAndHeight = OpenSankeyDrawFunc.GetSankeyMinWidthAndHeight as GetSankeyMinWidthAndHeightFuncType

export const NodeVisibleOnsSvg = OpenSankeyDrawFunc.NodeVisibleOnsSvg as NodeVisibleOnsSvgFuncType

export const LinkVisibleOnSvg = OpenSankeyDrawFunc.LinkVisibleOnSvg as LinkVisibleOnsSvgFuncType

export const DeselectVisualyNodes = OpenSankeyDrawFunc.DeselectVisualyNodes as DeselectVisualyNodesFuncType

export const SelectVisualyNodes = OpenSankeyDrawFunc.SelectVisualyNodes as SelectVisualyNodesFType

export const SelectVisualyLinks = OpenSankeyDrawFunc.SelectVisualyLinks as SelectVisualyLinksFType

export const RemoveAnimate = OpenSankeyDrawFunc.RemoveAnimate as RemoveAnimateFuncType

export const SvgDragMiddleMouseStart = OpenSankeyDrawEventFunc.SvgDragMiddleMouseStart as SvgDragMiddleMouseStartFuncType

export const SvgDragMiddleMouseMove = OpenSankeyDrawEventFunc.SvgDragMiddleMouseMove as SvgDragMiddleMouseMoveFuncType

export const SimpleGNodeClick = OpenSankeyDrawEventFunc.SimpleGNodeClick as SimpleGNodeClickFuncType

export const IsNodeDisplayingValueLocal = OpensankeyUtils.IsNodeDisplayingValueLocal as IsNodeDisplayingValueLocalFuncType

export const IsAllNodeAttrSameValue = OpensankeyUtils.IsAllNodeAttrSameValue as IsAllNodeAttrSameValueFuncType

export const AssignNodeValueToCorrectVar:AssignNodeValueToCorrectVarFuncType = OpensankeyUtils.AssignNodeValueToCorrectVar

export const OpposingDragElements:opposing_DragElementsFuncType = OpensankeyDragNodeFunc.OpposingDragElements

export const DragElements:DragElementsFuncType = OpensankeyDragNodeFunc.DragElements

export const drag_node_text:drag_node_textFuncType = OpensankeyDragNodeFunc.drag_node_text

export const ReturnOutOfBoundElement:ReturnOutOfBoundElementFuncType =OpensankeyDragNodeFunc.ReturnOutOfBoundElement

export const DragLegendGElementOSTyped:drag_legend_g_elementFuncType = DragLegendGElement

export const LinkColor:LinkColorFuncType=OpensankeyUtils.LinkColor

export const AssignLinkValueToCorrectVar:AssignLinkValueToCorrectVarFuncType = OpensankeyUtils.AssignLinkValueToCorrectVar

export const DefaultLinkStyle:DefaultLinkStyleFuncType = OpensankeyUtils.DefaultLinkStyle

export const DefaultLink:DefaultLinkFuncType = OpensankeyUtils.DefaultLink

export const DefaultNode:DefaultNodeFuncType = OpensankeyUtils.DefaultNode

export const updateLayoutOSTyped:updateLayoutFuncType = OpenSankeyLayout.updateLayout

export const AdjustSankeyZone:AdjustSankeyZoneFuncType= OpensankeyUtils.AdjustSankeyZone

export const synchronizeNodesandLinksIdOSTyped:synchronizeNodesandLinksIdFuncType = OpenSankeyLayout.synchronizeNodesandLinksId

export const complete_sankey_data:complete_sankey_dataFunctType = OpensankeyConvert.complete_sankey_data

export const convert_data:ConvertDataFuncType = OpensankeyConvert.convert_data

export const convert_nodes:convert_nodesFuncType = OpensankeyConvert.convert_nodes

export const convert_links:convert_linksFuncType = OpensankeyConvert.convert_links

export const convert_tags:convert_tagsFuncType = OpensankeyConvert.convert_tags

export const NodeDisplayed:NodeDisplayedFuncType = OpensankeyUtils.NodeDisplayed

export const reorganize_node_outputLinksIdOSTyped:reorganize_node_outputLinksIdFuncType = OpenSankeyLayout.reorganize_node_outputLinksId

export const reorganize_node_inputLinksIdOSTyped:reorganize_node_inputLinksIdFuncType = OpenSankeyLayout.reorganize_node_inputLinksId

export const actualizeDrawAreaFrame:actualizeDrawAreaFrameFType = OpenSankeyDrawEventFunc.actualizeDrawAreaFrame