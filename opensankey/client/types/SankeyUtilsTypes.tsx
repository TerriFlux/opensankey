import { TFunction } from "i18next"
import { 
  AddDataTagsFuncType, AddGroupTagFuncType, AddNewNodeFuncType, AddTagFuncType, AdjustSankeyZoneFuncType, AggregateFuncType, 
  ApplyStyleToNodesFuncType, AssignLinkLocalAttributeFuncType, AssignLinkStyleAttributeFuncType, AssignLinkValueToCorrectVarFuncType, 
  AssignNodeLocalAttributeFuncType, AssignNodeStyleAttributeFuncType, AssignNodeValueToCorrectVarFuncType, ClickSaveDiagramFuncType, 
  ClickSaveExcelFuncType, ComputeTotalOffsetsFuncType, CreateObjectFuncType, DefaultLinkFuncType, DefaultLinkStyleFuncType, 
  DefaultNodeFuncType, DefaultNodeProductStyleFuncStyle, DefaultNodeSectorStyleFuncStyle, DefaultNodeStyleFuncType, DefaultSankeyDataFuncType, 
  DeleteLinkFuncType, DeleteNodeFuncType, DesaggregateFuncType, DownloadExamplesFuncType, DownloadExempleExcelFuncType, FindMaxLinkValueFuncType, 
  GetLinkAttributeValueFromStyleFuncType, GetLinkValueFuncType, GetNodeAttributeValueFromStyleFuncType, GetVerticalMarginForSankeyZoneFuncType, 
  IsAllLinkAttrSameValueFuncType, IsAllNodeAttrSameValueFuncType, IsLinkDisplayingValueLocalFuncType, IsNodeDisplayingValueLocalFuncType, 
  LinkColorFuncType, LinkTextFuncType, LinkVisibleFunctType, NodeContextHasAggregateFuncType, NodeContextHasDesaggregateFuncType, 
  NodeDisplayedFuncType, ProcessExampleFuncType, RecursionDataTagFuncType, RetrieveExcelResultsFuncType, ReturnCorrectLinkAttributeValueFuncType, 
  ReturnCorrectNodeAttributeValueFuncType, ReturnLocalLinkValueFuncType, ReturnLocalNodeValueFuncType, ReturnValueLinkFuncType, ReturnValueNodeFuncType, 
  SetNodeStyleToTypeNodeFuncType, TestLinkValueFuncType, ToPrecisionFuncType, UploadExcelImplFuncType, UploadExempleFuncType, 
  reorganize_node_inputLinksIdFuncType, reorganize_node_outputLinksIdFuncType, synchronizeNodesandLinksIdFuncType, updateLayoutFuncType 
} from "./FunctionTypes"
import { SankeyData, SankeyNode } from "./Types"

export type CutName = (t: string, n: number) => string

// Create emptyicon for treefolder component
export type FileIcon = () => JSX.Element

export type FolderIcon = () => JSX.Element

export type FolderOpenIcon = () => JSX.Element

export type GetRandomInt=(max:number) => number

// Tooltipe added to input in menu when add a local value (for nodes & links local attributes)
export type TooltipValueSurcharge=(k:string,t:TFunction)=> JSX.Element

export type IsAllNodeNotLocalAttrSameValue=(data:SankeyData,m_s_n:SankeyNode[],k_list:(keyof SankeyNode)[])=>[boolean,boolean]
