import { MutableRefObject } from 'react'
import { GetLinkValueFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { SankeyData, applicationContextType, applicationDataType, contextMenuType, applicationStateType, ComponentUpdaterType, NodeFunctionTypes, LinkFunctionTypes } from '../../types/Types'

export type DrawLegendFType = (
  applicationData:applicationDataType,
  applicationContext:applicationContextType,
  contextMenu:contextMenuType,
  GetLinkValue:GetLinkValueFuncType,
  legend_clicked:MutableRefObject<boolean>,
  ComponentUpdater:ComponentUpdaterType,
  reDrawLegend:()=>void,
  resizeCanvas:(applicationData:applicationDataType)=>void
) => JSX.Element

export type drag_legendFType=(
  resizeCanvas:(applicationData:applicationDataType)=>void,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  applicationData:applicationDataType,
  applicationState:applicationStateType

)=> (selection: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>, ...args: unknown[]) => void

export type ContextLegendTagsFType = {
  applicationContext:applicationContextType,
  applicationData:applicationDataType,
  applicationState:applicationStateType,
  contextMenu:contextMenuType,
  GetLinkValue:GetLinkValueFuncType,
  ComponentUpdater:ComponentUpdaterType
}

export type drag_legend_g_elementFuncType = (data: SankeyData, event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void


// Create a type that contain parameters needed for the function DrawLegend
// This is for :
//  - 1 : Compact function parameters length
//  - 2 : Create a type that automatically match drawLegend needed parameter 
export type reDrawLegend_FuncType=Parameters<DrawLegendFType>