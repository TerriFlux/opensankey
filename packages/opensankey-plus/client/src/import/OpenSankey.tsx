// import * as sankeyUtils from 'open-sankey/dist/configmenus/SankeyUtils'
// import * as sankeyLoad from 'open-sankey/dist/dialogs/SankeyPersistence'
// import * as SankeyDrawFunc from 'open-sankey/dist/draw/SankeyDrawFunction'
// import * as SankeyDrawEventFunc from 'open-sankey/dist/draw/SankeyDrawEventFunction'
// import * as sankeyConvert from 'open-sankey/dist/configmenus/SankeyConvert'
// import * as SankeyTooltip from 'open-sankey/dist/draw/SankeyTooltip'
// import * as SankeyDrawNodes from 'open-sankey/dist/draw/SankeyDrawNodes'
// import * as SankeyDrawLinks from 'open-sankey/dist/draw/SankeyDrawLinks'
// import * as SankeyDrawLegend from 'open-sankey/dist/draw/SankeyDrawLegend'
// import * as SankeyDrawNodesLabel from 'open-sankey/dist/draw/SankeyDrawNodesLabel'
// import * as SankeyMenuConfiguration from 'open-sankey/dist/configmenus/SankeyMenuConfiguration'
import * as SankeyMenuTop from 'open-sankey/dist/topmenus/SankeyMenuTop'
// import * as SankeyMenuConfigurationLayout from 'open-sankey/dist/configmenus/SankeyMenuConfigurationLayout'
// import * as SankeyMenuConfigurationNodesAttributes from 'open-sankey/dist/configmenus/SankeyMenuConfigurationNodesAttributes'
// import * as sankeyDragNodeFunc from 'open-sankey/dist/draw/SankeyDragNodes'
// import * as OpenSankeyMenuConfigurationNodesTooltip from 'open-sankey/dist/configmenus/SankeyMenuConfigurationNodesTooltip'
// import * as SankeyMenuConfigurationNodes from 'open-sankey/dist/configmenus/SankeyMenuConfigurationNodes'
import * as SankeyMenuDialogs from 'open-sankey/dist/dialogs/SankeyMenuDialogs'
// import * as SankeyMenuConfigurationNodesIO from 'open-sankey/dist/configmenus/SankeyMenuConfigurationNodesIO'
// import * as MenuConfigurationNodesTags from 'open-sankey/dist/configmenus/SankeyMenuConfigurationNodesTags'
// import * as ConfigurationLinksTags from 'open-sankey/dist/configmenus/SankeyMenuConfigurationLinksTags'
// import * as OpenSankeyMenuConfigurationLinks from 'open-sankey/dist/configmenus/SankeyMenuConfigurationLinks'
// import * as SankeyMenuConfigurationLinksData from 'open-sankey/dist/configmenus/SankeyMenuConfigurationLinksData'
// import * as SankeyMenuConfigurationLinksAppearence from 'open-sankey/dist/configmenus/SankeyMenuConfigurationLinksAppearence'
// import * as SankeyMenuConfigurationLinksTooltip from 'open-sankey/dist/configmenus/SankeyMenuConfigurationLinksTooltip'
import * as SankeyMenuBanner from 'open-sankey/dist/configmenus/SankeyMenuBanner'
// import * as SankeyDraw from 'open-sankey/dist/draw/SankeyDraw'
// import * as SankeyLayout from 'open-sankey/dist/draw/SankeyDrawLayout'
// import * as SankeyShape from 'open-sankey/dist/draw/SankeyDrawShapes'
import * as SankeyPersistence from 'open-sankey/dist/dialogs/SankeyPersistence'
import * as OSModule from 'open-sankey/dist/OSModule'
import OSSankeyApp from 'open-sankey/dist/SankeyApp'
import {FunctionComponent} from 'react'
// import { DrawAddNodesFtype } from 'open-sankey/src/draw/types/SankeyDrawNodesLabelTypes'
// import { LinkTooltipsContentFType, NodeTooltipsContentFType } from 'open-sankey/src/draw/types/SankeyTooltipTypes'
import { OSTooltpFuncType,
} from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'
// import {ConvertDataFuncType, complete_sankey_dataFunctType, convert_linksFuncType, convert_nodesFuncType, convert_tagsFuncType} from 'open-sankey/src/configmenus/types/SankeyConvertTypes'
// import { DeleteGNodesFType, DrawAllNodesFType, drawNodeShapeFType, updateDrawNodeShapeFType } from 'open-sankey/src/draw/types/SankeyDrawNodesTypes'
// // import { DrawAddNodesFtype } from 'open-sankey/src/draw/types/SankeyDrawNodesLabelTypes'
// import { AddDrawLinksEventsFType, DrawAllLinksFType, LinkStrokeFuncType, drawAddLinksFType, drawLinkShapeFType } from 'open-sankey/src/draw/types/SankeyDrawLinksTypes'
// import { DrawLegendFType, drag_legend_g_elementFuncType } from 'open-sankey/src/draw/types/SankeyDrawLegendTypes'
// import { OpenSankeyConfigurationsMenusFType } from 'open-sankey/src/configmenus/types/SankeyMenuConfigurationTypes'
// import {SankeyMenuConfigurationNodesIOFType} from 'open-sankey/src/configmenus/types/SankeyMenuConfigurationNodesIOTypes'
// import {
//   MenuDraggableFType, Modale_resolution_pngFType, OpenSankeyMenusFType, OpenSankeySaveButtonFType
// } from 'open-sankey/src/topmenus/types/SankeyMenuTopTypes'
// import { keyHandlerFType } from 'open-sankey/src/draw/types/SankeyDrawTypes'
// import { OpenSankeyMenuConfigurationLayoutFType } from 'open-sankey/src/configmenus/types/SankeyMenuConfigurationLayoutTypes'
// import { OpenSankeyConfigurationNodesAttributesFType } from 'open-sankey/src/configmenus/types/SankeyMenuConfigurationNodesAttributesTypes'
// import { OpenSankeyMenuConfigurationNodesFType } from 'open-sankey/src/configmenus/types/SankeyMenuConfigurationNodesTypes'
// import { MenuConfigurationLinksFType } from 'open-sankey/src/configmenus/types/SankeyMenuConfigurationLinksTypes'
// import { MenuConfigurationLinksDataFType } from 'open-sankey/src/configmenus/types/SankeyMenuConfigurationLinksDataTypes'
// import { MenuConfigurationLinksAppearenceFType } from 'open-sankey/src/configmenus/types/SankeyMenuConfigurationLinksAppearenceTypes'
// import { addAllDropDownNodeFType, addSimpleLevelDropDownFType, setDiagramFuncType, ToolbarBuilderFType } from 'open-sankey/src/configmenus/types/SankeyMenuBannerTypes'
// import { OpenSankeyDefaultModalePreferenceContentFType, preferenceCheckFType } from 'open-sankey/src/dialogs/types/SankeyMenuPreferencesTypes'
// import {
//   RepositionneSidebarFuncType,
//   DeselectVisualyNodesFuncType, DrawGridFType,
//   LinkVisibleOnsSvgFuncType, NodeVisibleOnsSvgFuncType,
//   RemoveAnimateFuncType,
//   DrawArrowsType,
//   resizeDrawingAreaFuncType,
//   hideLinkOnDragElementFuncType,
// } from 'open-sankey/src/draw/types/SankeyDrawFunctionTypes'
// import { OpenSankeyDiagramSelectorFType} from 'open-sankey/src/dialogs/types/SankeyMenuDialogsTypes'
// import {ApplySaveJSONTypes} from 'open-sankey/src/dialogs/SankeyMenuDialogs'
// import { computeHorizontalIndexFuncType, reorganize_node_inputLinksIdFuncType, reorganize_node_outputLinksIdFuncType,
//   synchronizeNodesandLinksIdFuncType,
//   updateLayoutFuncType,
// } from 'open-sankey/src/draw/types/SankeyDrawLayoutTypes'

// import {EventOnZoneMouseDownFuncType, EventOnZoneMouseMoveFuncType, EventOnZoneMouseUpFuncType, SimpleGNodeClickFuncType, SvgDragMiddleMouseMoveFuncType, SvgDragMiddleMouseStartFuncType, ZoomFunctionFuncType, actualizeDrawAreaFrameFType, applyZoomEventFType, selectOpenSankeyElementsInSelectionZoneFType} from 'open-sankey/src/draw/types/SankeyDrawEventFunctionTypes'
// import { ClickSaveDiagramFuncType, ClickSaveExcelFuncType, RetrieveExcelResultsFuncType, UploadExempleFuncType } from 'open-sankey/src/dialogs/types/SankeyPersistenceTypes'
// import { SankeyMenuConfigurationNodesTooltipFType } from 'open-sankey/src/configmenus/types/SankeyMenuConfigurationNodesTooltipTypes'
// import { MenuConfigurationLinksTooltipFType } from 'open-sankey/src/configmenus/types/SankeyMenuConfigurationLinksTooltipTypes'
// import { SankeyMenuConfigurationNodesTagsFType } from 'open-sankey/src/configmenus/types/SankeyMenuConfigurationNodesTagsTypes'
// import { MenuConfigurationLinksTagsFType } from 'open-sankey/src/configmenus/types/SankeyMenuConfigurationLinksTagsTypes'
// import { DrawLinkStartSabotFType } from 'open-sankey/src/draw/types/SankeyShapesTypes'
// import { DrawAllType, dict_hook_ref_setter_show_dialog_componentsType, initializeAdditionalMenusType, initializeApplicationDataType, initializeCloseAllMenuContextType, initializeMenuConfigurationFuncType, initializeReinitializationType, module_dialogsType } from 'open-sankey/src/types/Types'
// import { DragLegendGElement } from 'open-sankey/dist/draw/SankeyDrawLegend'
import {OSTooltip as custom_Tolltip} from 'open-sankey/dist/types/Utils'
import {DefaultSankeyData as custom_DefaultSankeyData} from 'open-sankey/dist/types/Legacy'
import { initializeAdditionalMenusType, initializeReinitializationType, module_dialogsType, SankeyAppTypes } from 'open-sankey/src/types/LegacyType'
import { OpenSankeyDiagramSelectorFType } from 'open-sankey/src/dialogs/types/SankeyMenuDialogsTypes'
import { ClickSaveDiagramFuncType } from 'open-sankey/src/dialogs/types/SankeyPersistenceTypes'
import { MenuDraggableFType } from 'open-sankey/src/topmenus/types/SankeyMenuTopTypes'
import { addAllDropDownNodeFType, setDiagramFuncType } from 'open-sankey/src/configmenus/types/SankeyMenuBannerTypes'
// /**************************************************************************************************/
// export const OpenSankeyConfigurationsMenus =
//   SankeyMenuConfiguration.OpenSankeyConfigurationsMenus as OpenSankeyConfigurationsMenusFType
// // export const DrawNodes =
// //   SankeyDrawNodes.DrawNodes as DrawAllNodesFType
// // export const OpenSankeyDrawNodesLabel =
// //   SankeyDrawNodesLabel.OpenSankeyDrawNodesLabel as OpenSankeyDrawNodesLabelFType
// export const NodeTooltipsContent =
//   SankeyTooltip.NodeTooltipsContent as NodeTooltipsContentFType
// // export const DrawLinks =
// //   SankeyDrawLinks.DrawLinks as DrawLinksFType
// export const DrawLegend =
//   SankeyDrawLegend.DrawLegend as DrawLegendFType
// export const LinkTooltipsContent =
//   SankeyTooltip.LinkTooltipsContent as LinkTooltipsContentFType
// // export const DragLegendGElement =
// //   SankeyDrawLegend.DragLegendGElement as DrawLegendFType
// export const ReturnValueLink=sankeyUtils
//   .ReturnValueLink as ReturnValueLinkFuncType
// export const ReturnValueNode=sankeyUtils
//   .ReturnValueNode as ReturnValueNodeFuncType
// export const IsAllLinkAttrSameValue=sankeyUtils
//   .IsAllLinkAttrSameValue as IsAllLinkAttrSameValueFuncType
// export const IsLinkDiplayingValueLocal =sankeyUtils
//   .IsLinkDiplayingValueLocal as IsLinkDisplayingValueLocalFuncType
// export const NodeColor =
//   sankeyUtils.NodeColor as NodeColorFuncType
// export const LinkStrokeOSTyped =
//   SankeyDrawFunc.LinkStroke as LinkStrokeFuncType
// export const DrawArrows =
//   SankeyDrawFunc.DrawArrows as DrawArrowsType
// export const DrawGrid =
//   SankeyDrawFunc.DrawGrid as DrawGridFType
// export const GetSankeyMinWidthAndHeight =
//   SankeyDrawFunc.GetSankeyMinWidthAndHeight as GetSankeyMinWidthAndHeightFuncType
// export const NodeVisibleOnsSvg =
//   SankeyDrawFunc.NodeVisibleOnsSvg as NodeVisibleOnsSvgFuncType
// export const LinkVisibleOnSvg =
//   SankeyDrawFunc.LinkVisibleOnSvg as LinkVisibleOnsSvgFuncType
// export const DeselectVisualyNodes =
//   SankeyDrawFunc.DeselectVisualyNodes as DeselectVisualyNodesFuncType
// export const RemoveAnimate =
//   SankeyDrawFunc.RemoveAnimate as RemoveAnimateFuncType
// export const SvgDragMiddleMouseStart =
//   SankeyDrawEventFunc.SvgDragMiddleMouseStart as SvgDragMiddleMouseStartFuncType
// export const SvgDragMiddleMouseMove =
//   SankeyDrawEventFunc.SvgDragMiddleMouseMove as SvgDragMiddleMouseMoveFuncType
// export const SimpleGNodeClick =
//   SankeyDrawEventFunc.SimpleGNodeClick as SimpleGNodeClickFuncType
// export const IsNodeDisplayingValueLocal =
//   sankeyUtils.IsNodeDisplayingValueLocal as IsNodeDisplayingValueLocalFuncType
// export const IsAllNodeAttrSameValue =
//   sankeyUtils.IsAllNodeAttrSameValue as IsAllNodeAttrSameValueFuncType
// export const AssignNodeValueToCorrectVar =
//   sankeyUtils.AssignNodeValueToCorrectVar as AssignNodeValueToCorrectVarFuncType
// export const LinkColor =sankeyUtils
//   .LinkColor as LinkColorFuncType
// export const AssignLinkValueToCorrectVar =
//   sankeyUtils.AssignLinkValueToCorrectVar as AssignLinkValueToCorrectVarFuncType
// export const DefaultLinkStyle =
//   sankeyUtils.DefaultLinkStyle as DefaultLinkStyleFuncType
// export const DefaultLink =
//   sankeyUtils.DefaultLink as DefaultLinkFuncType
// export const DefaultNode =
//   sankeyUtils.DefaultNode as DefaultNodeFuncType
// export const updateLayoutOSTyped =
//   SankeyLayout.updateLayout as updateLayoutFuncType
// export const AdjustSankeyZone =
//   sankeyUtils.AdjustSankeyZone as AdjustSankeyZoneFuncType
// // export const synchronizeNodesandLinksIdOSTypedsynchronizeNodesandLinksIdFuncType =
// //   SankeyLayout.synchronizeNodesandLinksId as synchronizeNodesandLinksIdFuncType
// export const complete_sankey_data : complete_sankey_dataFunctType =
//   sankeyConvert.complete_sankey_data
// export const convert_data =
//   sankeyConvert.convert_data as ConvertDataFuncType
// export const convert_nodes =
//   sankeyConvert.convert_nodes as convert_nodesFuncType
// export const convert_links =
//   sankeyConvert.convert_links as convert_linksFuncType
// export const convert_tags =
//   sankeyConvert.convert_tags as convert_tagsFuncType
// export const NodeDisplayed =
//   sankeyUtils.NodeDisplayed as NodeDisplayedFuncType
// export const reorganize_node_outputLinksIdOSTyped =
//   SankeyLayout.reorganize_node_outputLinksId as reorganize_node_outputLinksIdFuncType
// export const reorganize_node_inputLinksIdOSTyped =
//   SankeyLayout.reorganize_node_inputLinksId as reorganize_node_inputLinksIdFuncType
export const DefaultSankeyData =custom_DefaultSankeyData 
// export const GetLinkValue =
//   sankeyUtils.GetLinkValue as GetLinkValueFuncType
// export const LinkTextOSTyped =
//   sankeyUtils.LinkText as LinkTextFuncType
// export const LinkVisible =
//   sankeyUtils.LinkVisible as LinkVisibleFunctType
// export const ClickSaveExcel =
//   sankeyLoad.ClickSaveExcel as ClickSaveExcelFuncType
// export const UploadExemple =
// sankeyLoad.UploadExemple as UploadExempleFuncType
// export const RetrieveExcelResults:
//   RetrieveExcelResultsFuncType = sankeyLoad.RetrieveExcelResults
// export const ZoomFunction =
//   SankeyDrawEventFunc.ZoomFunction as ZoomFunctionFuncType
// export const RepositionneSidebar =
//   SankeyDrawFunc.RepositionneSidebar as RepositionneSidebarFuncType
// export const EventOnZoneMouseDown =
//   SankeyDrawEventFunc.EventOnZoneMouseDown as EventOnZoneMouseDownFuncType
// export const EventOnZoneMouseMove =
//   SankeyDrawEventFunc.EventOnZoneMouseMove as EventOnZoneMouseMoveFuncType
// export const EventOnZoneMouseUp =
//   SankeyDrawEventFunc.EventOnZoneMouseUp as EventOnZoneMouseUpFuncType
// export const OpenSankeyMenus =
//   SankeyMenuTop.OpenSankeyMenus as OpenSankeyMenusFType
export const MenuDraggable =
  SankeyMenuTop.MenuDraggable as FunctionComponent<MenuDraggableFType>
// export const OpenSankeySaveButton =
//   SankeyMenuTop.OpenSankeySaveButton as OpenSankeySaveButtonFType
// // export const LastCheckpointTime =
// //   SankeyMenuTop.LastCheckpointTime as LastCheckpointTimeFType
// export const OpenSankeyMenuConfigurationLayout = SankeyMenuConfigurationLayout
//   .OpenSankeyMenuConfigurationLayout as FunctionComponent<OpenSankeyMenuConfigurationLayoutFType>
// export const OpenSankeyConfigurationNodesAttributes=SankeyMenuConfigurationNodesAttributes
//   .OpenSankeyConfigurationNodesAttributes as OpenSankeyConfigurationNodesAttributesFType
// export const OpenSankeyMenuConfigurationNodes=SankeyMenuConfigurationNodes
//   .OpenSankeyMenuConfigurationNodes as OpenSankeyMenuConfigurationNodesFType
export const OpenSankeyDiagramSelector=SankeyMenuDialogs
  .OpenSankeyDiagramSelector as OpenSankeyDiagramSelectorFType
// export const OpenSankeyMenuConfigurationNodesIO=
//   SankeyMenuConfigurationNodesIO.SankeyMenuConfigurationNodesIO as FunctionComponent<SankeyMenuConfigurationNodesIOFType>
// export const SankeyMenuConfigurationLinks=
//   OpenSankeyMenuConfigurationLinks.MenuConfigurationLinks as MenuConfigurationLinksFType
// export const MenuConfigurationLinksData=SankeyMenuConfigurationLinksData
//   .MenuConfigurationLinksData as FunctionComponent<MenuConfigurationLinksDataFType>
// export const MenuConfigurationLinksAppearence =
//   SankeyMenuConfigurationLinksAppearence.MenuConfigurationLinksAppearence as
//    MenuConfigurationLinksAppearenceFType
// export const OpenSankeyToolbarBuilder=SankeyMenuBanner
//   .ToolbarBuilder as FunctionComponent<ToolbarBuilderFType>
export const AddAllDropDownNode=SankeyMenuBanner
  .AddAllDropDownNode as FunctionComponent<addAllDropDownNodeFType>
// export const addSimpleLevelDropDown=SankeyMenuBanner
//   .addSimpleLevelDropDown as addSimpleLevelDropDownFType
export const setDiagram=SankeyMenuBanner
  .setDiagram as setDiagramFuncType
// export const OpenSankeyDefaultModalePreferenceContent =
//   SankeyMenuPreferences.OpenSankeyDefaultModalePreferenceContent as
//    OpenSankeyDefaultModalePreferenceContentFType
// export const preferenceCheck =
//   SankeyMenuPreferences.preferenceCheck as preferenceCheckFType
// export const keyHandler =
//   SankeyDraw.keyHandler as keyHandlerFType
// export const ApplySaveJSONDialog :
//   FunctionComponent<ApplySaveJSONTypes> = SankeyMenuDialogs.ApplySaveJSONDialog

// export const SankeyMenuConfigurationNodesTooltip:FunctionComponent<SankeyMenuConfigurationNodesTooltipFType>=OpenSankeyMenuConfigurationNodesTooltip.SankeyMenuConfigurationNodesTooltip

// export const MenuConfigurationLinksTooltip:
//   FunctionComponent<MenuConfigurationLinksTooltipFType>=SankeyMenuConfigurationLinksTooltip.MenuConfigurationLinksTooltip

// export const SankeyMenuConfigurationNodesTags:FunctionComponent<SankeyMenuConfigurationNodesTagsFType>=MenuConfigurationNodesTags.SankeyMenuConfigurationNodesTags

// export const MenuConfigurationLinksTags:FunctionComponent<MenuConfigurationLinksTagsFType>=ConfigurationLinksTags.MenuConfigurationLinksTags

// // export const SankeyMenuFileExport:SankeyMenuFileExportFType=SankeyMenuTop.SankeyMenuFileExport

// export const DrawAllNodes:DrawAllNodesFType=SankeyDrawNodes.DrawAllNodes
// export const drawAddNodes:drawNodeShapeFType=SankeyDrawNodes.drawAddNodes
// export const updateDrawNodeShape:updateDrawNodeShapeFType=SankeyDrawNodes.updateDrawNodeShape



// export const DrawAllLinks:DrawAllLinksFType=SankeyDrawLinks.DrawAllLinks
// export const drawAddLinks:drawAddLinksFType=SankeyDrawLinks.drawAddLinks
// export const drawLinkShape:drawLinkShapeFType=SankeyDrawLinks.drawLinkShape
// export const AddDrawLinksEvent:AddDrawLinksEventsFType=SankeyDrawLinks.AddDrawLinksEvent

// export const RedrawNodesLabel:DrawAddNodesFtype=SankeyDrawNodesLabel.RedrawNodesLabel
// export const DeleteGNodes:DeleteGNodesFType=SankeyDrawNodes.DeleteGNodes
// export const applyZoomEvent:applyZoomEventFType=SankeyDrawEventFunc.applyZoomEvent

// export const resizeDrawingArea:resizeDrawingAreaFuncType=SankeyDrawFunc.resizeDrawingArea

// export const DrawLinkStartSabot:DrawLinkStartSabotFType=SankeyShape.DrawLinkStartSabot

// export const Modale_resolution_png:Modale_resolution_pngFType=SankeyMenuTop.Modale_resolution_png

// export const DrawAll = OSModule.DrawAll as DrawAllType
// export const closeAllMenu = OSModule.closeAllMenu as (dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
//   contextMenu:contextMenuType)=>()=>void
// export const initializeApplicationContext = OSModule.initializeApplicationContext as initializeApplicationContextType
// export const initializeApplicationData = OSModule.initializeApplicationData as initializeApplicationDataType
// export const initializeApplicationDraw = OSModule.initializeApplicationDraw as initializeApplicationDrawType
// export const initializeComponentUpdater = OSModule.initializeComponentUpdater as unknown as initializeComponentUpdaterType
// export const initializeContextMenu = OSModule.initializeContextMenu as initializeContextMenuType
// export const initializeElementSelected = OSModule.initializeElementSelected as initializeElementSelectedType
// export const initializeLinkFunctions = OSModule.initializeLinkFunctions as initializeLinkFunctionsType
// export const initializeNodeFunctions = OSModule.initializeNodeFunctions as initializeNodeFunctionsType
// export const initializeProcessFunctions = OSModule.initializeProcessFunctions as initializeProcessFunctionsType 
export const initializeReinitialization = OSModule.initializeReinitialization as initializeReinitializationType
// export const initializeShowDialog = OSModule.initializeShowDialog as initializeShowDialogType
// export const initializeUIElementsRef = OSModule.initializeUIElementsRef as initializeUIElementsRefType
export const initializeAdditionalMenus = OSModule.initializeAdditionalMenus as initializeAdditionalMenusType
export const moduleDialogs = OSModule.moduleDialogs as module_dialogsType
// export const initializeMenuConfiguration=OSModule.initializeMenuConfiguration as initializeMenuConfigurationFuncType
export const SankeyApp = OSSankeyApp as FunctionComponent<SankeyAppTypes> 
// export const InstallEventsOnSVG = OSModule.InstallEventsOnSVG as InstallEventsOnSVGType
// export const hideLinkOnDragElement:hideLinkOnDragElementFuncType=SankeyDrawFunc.hideLinkOnDragElement
export const OSTooltip:FunctionComponent<OSTooltpFuncType>=custom_Tolltip
// export const DragLegendGElementOSTyped:drag_legend_g_elementFuncType = DragLegendGElement
// export const OpposingDragElements:opposing_DragElementsFuncType =sankeyDragNodeFunc.OpposingDragElements
// export const ReturnOutOfBoundElement:ReturnOutOfBoundElementFuncType =sankeyDragNodeFunc.ReturnOutOfBoundElement
// export const drag_node_text:drag_node_textFuncType = sankeyDragNodeFunc.drag_node_text
// export const synchronizeNodesandLinksIdOSTyped:synchronizeNodesandLinksIdFuncType = SankeyLayout.synchronizeNodesandLinksId
// export const actualizeDrawAreaFrame:actualizeDrawAreaFrameFType = SankeyDrawEventFunc.actualizeDrawAreaFrame
// export const DragElements:DragElementsFuncType = sankeyDragNodeFunc.DragElements
// export const selectOpenSankeyElementsInSelectionZone : selectOpenSankeyElementsInSelectionZoneFType = SankeyDrawEventFunc.selectOpenSankeyElementsInSelectionZone

// export const initializeCloseAllMenuContext:initializeCloseAllMenuContextType =OSModule.initializeCloseAllMenuContext
// export const initializeKeyHandler:initializeKeyHandlerType = OSModule.initializeKeyHandler
export const ClickSaveDiagram:ClickSaveDiagramFuncType = SankeyPersistence.ClickSaveDiagram

// export const computeHorizontalIndex:computeHorizontalIndexFuncType=SankeyLayout.computeHorizontalIndex