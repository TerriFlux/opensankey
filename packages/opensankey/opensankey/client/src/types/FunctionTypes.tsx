import { Requireable } from 'react'
import { SankeyData, SankeyLink, SankeyLinkAttrLocal, SankeyLinkStyle, SankeyLinkValue, SankeyLinkValueDict, SankeyNode, SankeyNodeAttrLocal, SankeyNodeStyle, TagsCatalog, TagsGroup, display_styleType } from './Types'
import { InferProps } from 'prop-types'

export type GetLinkValueFuncType=(data: SankeyData,idLink: string,up?:boolean)=> SankeyLinkValue 

export type AddDataTagsFuncType=(dataTags: TagsGroup[], v: {[key: string]: SankeyLinkValue | SankeyLinkValueDict }, depth: number) => void

export type FindMaxLinkValueFuncType = (max_node_value: number,value_dict: SankeyLinkValue | SankeyLinkValueDict)=> number

export type TestLinkValueFuncType = (
    data:SankeyData, 
    nodes: { [node_id: string]: SankeyNode }, 
    d: SankeyLink,
    GetLinkValue:GetLinkValueFuncType
) => string | number | { value: number; display_value: string; tags: {}; extension: {}; }

export type ComputeTotalOffsetsFuncType=(inv_scale:(t:number)=>number,
node: SankeyNode,
data: SankeyData,
display_nodes: { [node_id: string]: SankeyNode },
display_links: { [node_id: string]: SankeyLink },
TestLinkValue: TestLinkValueFuncType,
ref_link: SankeyLink | undefined,
GetLinkValue:GetLinkValueFuncType
)=> number[]

export type DefaultSankeyDataFuncType = ()=>SankeyData 

export type LinkColorFuncType = (l: SankeyLink,data:SankeyData,GetLinkValue:GetLinkValueFuncType)=>string

export type LinkVisibleFunctType = (l: SankeyLink, data: SankeyData, display_nodes : {[d:string]:SankeyNode},GetLinkValue: GetLinkValueFuncType) => boolean 

export type DefaultNodeFuncType = (data: SankeyData) => SankeyNode

export type DefaultNodeStyleFuncType = () => SankeyNodeStyle

export type DefaultNodeSectorStyleFuncStyle = () => SankeyNodeStyle

export type DefaultNodeProductStyleFuncStyle = () => SankeyNodeStyle

export type DefaultLinkStyleFuncType = () => SankeyLinkStyle

export type CreateObjectFuncType = (data: SankeyData, l: string[]) => SankeyLinkValue

export type DefaultLinkFuncType = (data: SankeyData) => SankeyLink

export type DeleteLinkFuncType = (data: SankeyData,link: SankeyLink)=> void

export type DeleteNodeFuncType = (data: SankeyData,node: SankeyNode)=> void

export type DownloadExamplesFuncType = (file_name: string,the_url_prefix: string,filetype: string)=> void

export type ProcessExampleFuncType = (
    data: SankeyData,
    updateLayout:updateLayoutFuncType,
    convert_data:ConvertDataFuncType,
    callback: (server_data: SankeyData) => void,
    DefaultSankeyData: DefaultSankeyDataFuncType
)=> SankeyData

export type SetNodeStyleToTypeNode = (data:SankeyData)=> void

export type updateLayoutFuncType = (data: SankeyData,new_layout: SankeyData,mode:string[],synchronize?:boolean)=> void 

export type SetNodeStyleToTypeNodeFuncType = (data:SankeyData)=>void

export type UploadExcelImplFuncType = (set_show_excel_dialog: (b: boolean) => void,input_file: Blob,the_url_prefix: string)=>void

export type UploadExempleFuncType = (file_name: string,the_url_prefix: string,data: SankeyData,set_data: (data: SankeyData) => void,Reinitialization: ()=>void,convert_data:ConvertDataFuncType,DefaultSankeyData:DefaultSankeyDataFuncType)=>void

export type DownloadExempleExcelFuncType = (file_name: string)=>void 

export type ClickSaveExcelFuncType = (url_prefix:string,data:SankeyData)=> void

export type NodeColorFuncType = (n: SankeyNode,data:SankeyData)=> string

export type GetVerticalMarginForSankeyZoneFuncType = ()=>number

export type AdjustSankeyZoneFuncType = (data:SankeyData,GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,show_nav?:boolean,vertical?:boolean)=>void

export type GetSankeyMinWidthAndHeightFuncType = (data:SankeyData)=>number[]

export type ToPrecisionFuncType = (v: number,nb_scientific?:number)=> string | number

export type LinkTextFuncType = (data: SankeyData,d: SankeyLink,GetLinkValue:GetLinkValueFuncType)=>string

export type ClickSaveDiagramFuncType = (data:SankeyData,name?:string)=>void

export type AddTagFuncType =(data:SankeyData,type_tag_name:'nodeTags' | 'fluxTags' | 'dataTags',tags_group_key:string)=> void

export type AddGroupTagFuncType = (data:SankeyData,type_tag_name:'nodeTags' | 'fluxTags' | 'dataTags',tags_group_key:string,elementNameProp:string)=> string

export type ReturnValueNodeFuncType = (data:SankeyData,n:SankeyNode,k:keyof SankeyNodeAttrLocal | keyof SankeyNodeStyle)=>string | number | boolean

export type GetNodeAttributeValueFromStyleFuncType  =(data:SankeyData,n:SankeyNodeStyle,k:keyof SankeyNodeStyle)=> string | number | boolean

export type ReturnLocalNodeValueFuncType = (n:SankeyNode,key:keyof SankeyNodeAttrLocal)=>string | number | boolean | null | undefined

export type IsAllNodeAttrSameValueFuncType=(data:SankeyData,m_s_n:SankeyNode[]|SankeyNodeStyle[],k_list:(keyof SankeyNodeAttrLocal)[],menu_for_style:boolean)=> { [x: string]: [string | number | boolean, boolean] }

export type IsNodeDisplayingValueLocalFuncType = (m_s_n:{current:SankeyNode[]},k:keyof SankeyNodeAttrLocal,menu_for_style:boolean)=> boolean

export type AssignNodeValueToCorrectVarFuncType = (n:SankeyNode|SankeyNodeStyle,k:keyof SankeyNodeAttrLocal,v:boolean|string|number,menu_for_style:boolean)=> void

export type ReturnCorrectNodeAttributeValueFuncType = (data:SankeyData,n:SankeyNode|SankeyNodeStyle,k:keyof SankeyNodeAttrLocal | keyof SankeyNodeStyle,menu_for_style:boolean)=>string | number | boolean

export type AssignNodeLocalAttributeFuncType = (n:SankeyNode,k:keyof SankeyNodeAttrLocal,v:boolean|string|number)=> void

export type AssignNodeStyleAttributeFuncType = (n:SankeyNodeStyle,k:keyof SankeyNodeStyle,v:boolean|string|number)=>void

export type NodeDisplayedFuncType =(data:SankeyData,node:SankeyNode,skip_link_zero?:boolean)=>boolean

export type ReturnValueLinkFuncType = (data:SankeyData,l:SankeyLink,k:keyof SankeyLinkAttrLocal | keyof SankeyLinkStyle)=>string | number | boolean

export type GetLinkAttributeValueFromStyleFuncType  =(data:SankeyData,n:SankeyLinkStyle,k:keyof SankeyLinkStyle)=> string | number | boolean

export type ReturnLocalLinkValueFuncType = (n:SankeyLink,key:keyof SankeyLinkAttrLocal)=>string | number | boolean | null | undefined

export type IsAllLinkAttrSameValueFuncType=(data:SankeyData,m_s_n:SankeyLink[]|SankeyLinkStyle[],k_list:(keyof SankeyLinkAttrLocal)[],menu_for_style:boolean)=> { [x: string]: [string | number | boolean, boolean] }

export type IsLinkDisplayingValueLocalFuncType = (m_s_n:{current:SankeyLink[]},k:keyof SankeyLinkAttrLocal,menu_for_style:boolean)=> boolean

export type AssignLinkValueToCorrectVarFuncType = (n:SankeyLink|SankeyLinkStyle,k:keyof SankeyLinkAttrLocal,v:boolean|string|number,menu_for_style:boolean)=> void

export type ReturnCorrectLinkAttributeValueFuncType = (data:SankeyData,n:SankeyLink|SankeyLinkStyle,k:keyof SankeyLinkAttrLocal | keyof SankeyLinkStyle,menu_for_style:boolean)=>string | number | boolean

export type AssignLinkLocalAttributeFuncType = (n:SankeyLink,k:keyof SankeyLinkAttrLocal,v:boolean|string|number)=> void

export type AssignLinkStyleAttributeFuncType = (n:SankeyLinkStyle,k:keyof SankeyLinkStyle,v:boolean|string|number)=>void

export type NodeContextHasAggregateFuncType = (n:SankeyNode,data:SankeyData)=>boolean

export type AggregateFuncType = (n: SankeyNode, data: SankeyData, set_agregation_node: (s: string) => void, set_is_agregation: (b: boolean) => void, set_show_agregation: (b: boolean) => void) => void

export type DesaggregateFuncType = (n: SankeyNode, data: SankeyData, display_nodes: {
    [id: string]: SankeyNode;
}, display_links: {
    [id: string]: SankeyLink;
}, set_agregation_node: (s: string) => void, set_is_agregation: (b: boolean) => void, set_show_agregation: (b: boolean) => void) => void

export type  NodeContextHasDesaggregateFuncType = (n: SankeyNode, data: SankeyData) => boolean

export type ApplyStyleToNodesFuncType = (data: SankeyData, set_data: (d: SankeyData) => void, multi_selected_nodes: {current: SankeyNode[];}) => void

export type AddNewNodeFuncType = (data: SankeyData, set_data: (d: SankeyData) => void, multi_selected_nodes: {current: SankeyNode[];}) => void

export type RecursionDataTagFuncType = (data: SankeyData, DT: TagsCatalog, ind: number, suffix: string, link_to_copy: SankeyLink, new_links: {[link_id: string]: SankeyLink;}) => void

export type ConvertDataFuncType = (data: SankeyData, DefaultSankeyData: () => SankeyData) => void

export type setDiagramFuncType = (the_diagram: string, set_data: (d: SankeyData) => void, convert_data: ConvertDataFuncType, DefaultSankeyData:DefaultSankeyDataFuncType) => void

export type LinkStrokeFuncType = (l: SankeyLink, data: SankeyData, GetLinkValue: GetLinkValueFuncType) => string

export type drawCurveType = (
    data: SankeyData,
    set_data:(d:SankeyData)=>void,
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: display_styleType,
    nodeTags: TagsCatalog,
    link: SankeyLink,
    error_msg: { text?: string } | undefined,
    multi_selected_links:{current: SankeyLink[] },
    LinkText:LinkTextFuncType,
    GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
    GetLinkValue:GetLinkValueFuncType,
    DrawArrows:drawArrowsType
  ) => string
  
  
export type drawArrowsType = (
    n: SankeyNode,
    data:SankeyData,
    display_nodes: { [node_id: string]: SankeyNode },
    display_links: { [node_id: string]: SankeyLink },
    scale:(t:number)=>number,
    inv_scale:(t:number)=>number,
    GetLinkValue:GetLinkValueFuncType,
    display_style: display_styleType
  ) => void

export type DrawGridFuncType = (data: SankeyData) => void

export type NodeVisibleOnsSvgFuncType = () => string[]

export type LinkVisibleOnsSvgFuncType = () => string[]

export type DeselectVisualyNodesFuncType = (n: SankeyNode) => void

export type RemoveAnimateFuncType = () => void

export type SvgDragMiddleMouseStartFuncType = () => void

export type SvgDragMiddleMouseMoveFuncType = (event: d3.D3DragEvent<Element, unknown, unknown>, data: SankeyData) => void

export type SimpleGNodeClickFuncType = (event: React.MouseEvent<HTMLButtonElement>, d: SankeyNode, data: SankeyData, set_data: (d: SankeyData) => void, nodes_accordion_ref: {
    current: HTMLDivElement
} | null, multi_selected_nodes: {
    current: SankeyNode[];
}, mode_selection: {
    current: string;
}, accordion_ref: {
    current: HTMLDivElement;
} | null, button_ref: {
    current: HTMLLabelElement;
} | null, accept_simple_click: {
    current: boolean;
}) => void

export type opposing_drag_elementsFuncType = (out_of_zone_item: (SankeyNode)[], event: {dx: number;dy: number;x: number;y: number;}, dragged: SankeyNode, data: SankeyData, multi_selected_nodes: {current: SankeyNode[];}) => void

export type drag_elementsFuncType = (dragged: SankeyNode,
  data: SankeyData,
  event: {dx: number;dy: number;x: number;y: number;},
  Smulti_selected_nodes: {current: SankeyNode[];},
  set_data: (d: SankeyData) => void,
  Sdisplay_nodes: {[node_id: string]: SankeyNode;},
  Sdisplay_links: {[link_id: string]: SankeyLink;},
  multi_selected_links: {current: SankeyLink[];},
  LinkText: LinkTextFuncType,
  GetSankeyMinWidthAndHeight: GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue: GetLinkValueFuncType,
  DrawArrows: drawArrowsType,
  scale: (t: number) => number,
  inv_scale: (t: number) => number
) => void

export type drag_node_textFuncType = (node: SankeyNode, event: d3.D3DragEvent<Element, unknown, unknown>) => void

export type return_out_of_bound_elementFuncType = (dragged: SankeyNode,
   data: SankeyData,
   event: {dx: number;dy: number;x: number;  y: number;},
   multi_selected_nodes: {current: SankeyNode[];},
   node_visible: string[]
  ) => SankeyNode[]

export type drag_legend_g_elementFuncType = (data: SankeyData, event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void

export type synchronizeNodesandLinksIdFuncType = (dataModify: SankeyData, dataRef: SankeyData) => void

export type complete_sankey_dataFunctType = (data: SankeyData, DefaultSankeyData: () => SankeyData, DefaultNode: (data: SankeyData) => SankeyNode, DefaultLink: (data: SankeyData) => SankeyLink) => void

export type convert_nodesFuncType = (data: SankeyData) => void

export type convert_linksFuncType = (data: SankeyData) => void

export type convert_tagsFuncType = (data: SankeyData) => void

export type reorganize_node_outputLinksIdFuncType = (data: SankeyData,
   node: SankeyNode,
   nodes: {[idNode: string]: SankeyNode;},
   links: {[idLink: string]: SankeyLink;}
  ) => void

export type reorganize_node_inputLinksIdFuncType = (data: SankeyData,
    node: SankeyNode,
    nodes: {[idNode: string]: SankeyNode;},
    links: {[idLink: string]: SankeyLink;}
   ) => void

export type SetNodeHeightFuncType = (
    n: SankeyNode, display_nodes: {[node_id: string]: SankeyNode;},
    display_links: {[link_id: string]: SankeyLink;},
    data: SankeyData,
    scale: (t: number) => number,
    inv_scale: (t: number) => number,
    GetLinkValue: GetLinkValueFuncType
) => void

export type ValueSelectedParameterFuncType = (data: SankeyData, multi_selected_links: {
    current: SankeyLink[];
}, tags_selected: {
    [k: string]: string;
}) => SankeyLinkValue

export type callbackFuncType = (server_data: SankeyData) => void

export type RetrieveExcelResultsFuncType = (
    text: string,
    set_data: (d: SankeyData) => void,
    updateLayout: updateLayoutFuncType,
    callback:callbackFuncType,
    GetSankeyMinWidthAndHeight: GetSankeyMinWidthAndHeightFuncType,
    convert_data: ConvertDataFuncType,
    defaultData: () => SankeyData
 ) => void

export type ZoomFunctionFuncType = (evt: d3.D3ZoomEvent<SVGElement, unknown>, data: SankeyData) => void

export type RepositionneSidebarFuncType = (show_nav: boolean) => void

export type EventOnSankeyZoneMouseDownFuncType =(mode_selection: {
    current: string;
}, data: SankeyData, set_data: (d: SankeyData) => void, set_first_selected_node: React.Dispatch<React.SetStateAction<object>>, token: boolean, set_show_toast_limit_node: (b: boolean) => void, evt2: unknown, start_point: {
    current: number[];
}, closeAllMenuContext: () => void) => void

export type EventOnSankeyZoneMouseMoveFuncType = (mode_selection: {
    current: string;
}, data: SankeyData, first_selected_node: object, set_first_selected_node: React.Dispatch<React.SetStateAction<object>>, evt: MouseEvent, start_point: {
    current: number[];
}) => void

export  type EventOnSankeyZoneMouseUpFuncType = (mode_selection: {
    current: string;
}, data: SankeyData, set_data: (d: SankeyData) => void, multi_selected_nodes: {
    current: SankeyNode[];
}, multi_selected_links: {
    current: SankeyLink[];
}, first_selected_node: object, set_first_selected_node: React.Dispatch<React.SetStateAction<object>>, token: boolean, set_show_toast_limit_node: (b: boolean) => void, accordion_ref: InferProps<{
    current: Requireable<HTMLDivElement>;
}> | null, button_ref: InferProps<{
    current: Requireable<HTMLLabelElement>;
}> | null, links_accordion_ref: InferProps<{
    current: Requireable<HTMLDivElement>;
}> | null, set_displayed_input_link_value: (s: string) => void, evt: MouseEvent, start_point: {
    current: number[];
}, set_legend_clicked: (b: boolean) => void) => void

export type ComputeAutoSankeyFuncType = (data: SankeyData, h_space: number) => void