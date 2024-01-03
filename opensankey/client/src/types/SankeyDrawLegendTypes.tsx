import { MutableRefObject } from 'react'
import { GetLinkValueFuncType } from './SankeyUtilsTypes'
import { SankeyData, applicationContextType, applicationDataType, contextMenuType, elementsSelectedType } from './Types'

export type DrawLegendFType = (
  applicationData:applicationDataType,
  applicationContext:applicationContextType,
  contextMenu:contextMenuType,
  GetLinkValue:GetLinkValueFuncType,
  legend_clicked:MutableRefObject<boolean>
) => JSX.Element

export type drag_legendFType=(
  data:SankeyData,
  set_data:(d:SankeyData)=>void
)=> (selection: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>, ...args: unknown[]) => void

export type ContextLegendTagsFType=(
  applicationData:applicationDataType,
  applicationContext:applicationContextType,
  elementsSelected:elementsSelectedType,
  contextMenu:contextMenuType,
  GetLinkValue:GetLinkValueFuncType,
)=> JSX.Element

export type drag_legend_g_elementFuncType = (data: SankeyData, event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void