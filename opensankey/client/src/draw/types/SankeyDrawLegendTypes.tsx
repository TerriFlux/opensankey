import { MutableRefObject } from 'react'
import { GetLinkValueFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { SankeyData, applicationContextType, dict_variable_application_dataType, contextMenuType, dict_variable_elements_selectedType, ComponentUpdaterType } from '../../types/Types'

export type DrawLegendFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  applicationContext:applicationContextType,
  contextMenu:contextMenuType,
  GetLinkValue:GetLinkValueFuncType,
  legend_clicked:MutableRefObject<boolean>,
  ComponentUpdater:ComponentUpdaterType
) => JSX.Element

export type drag_legendFType=(
  data:SankeyData,
  reDrawLegend:()=>void
)=> (selection: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>, ...args: unknown[]) => void

export type ContextLegendTagsFType = {
  applicationContext:applicationContextType,
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
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