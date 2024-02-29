import { TFunction } from 'i18next'
import { LinkFunctionTypes, SankeyData, SankeyLink, SankeyLinkAttrLocal, SankeyLinkStyle, SankeyLinkValue, SankeyLinkValueDict, SankeyNode, SankeyNodeAttrLocal, SankeyNodeStyle, TagsCatalog, TagsGroup, dict_variable_application_dataType } from '../../types/Types'

export type CutNameFType = (t: string, n: number) => string

// Create emptyicon for treefolder component
export type FileIconFType = () => JSX.Element

export type FolderIconFType = () => JSX.Element

export type FolderOpenIconFType = () => JSX.Element

export type GetRandomIntFType =(max:number) => number

// Tooltipe added to input in menu when add a local value (for nodes & links local attributes)
export type TooltipValueSurchargeFType =(k:string,t:TFunction)=> JSX.Element

export type IsAllNodeNotLocalAttrSameValueFType =(data:SankeyData,m_s_n:SankeyNode[],k_list:(keyof SankeyNode)[])=>[boolean,boolean]

export type GetLinkValueFuncType=(data: SankeyData,idLink: string,up?:boolean)=> SankeyLinkValue 

export type TestLinkValueFuncType = (
    data:SankeyData, 
    nodes: { [node_id: string]: SankeyNode }, 
    d: SankeyLink,
    GetLinkValue:GetLinkValueFuncType
) => string | number | SankeyLinkValue

export type ComputeTotalOffsetsFuncType=(inv_scale:(t:number)=>number,
node: SankeyNode,
data: SankeyData,
display_nodes: { [node_id: string]: SankeyNode },
display_links: { [node_id: string]: SankeyLink },
TestLinkValue: TestLinkValueFuncType,
ref_link: SankeyLink | undefined,
GetLinkValue:GetLinkValueFuncType
)=> number[]

export type AddDataTagsFuncType=(dataTags: TagsGroup[], v: {[key: string]: SankeyLinkValue | SankeyLinkValueDict }, depth: number) => void

export type FindMaxLinkValueFuncType = (max_node_value: number,value_dict: SankeyLinkValue | SankeyLinkValueDict)=> number

export type DefaultSankeyDataFuncType = ()=>SankeyData 

export type LinkColorFuncType = (l: SankeyLink,data:SankeyData,GetLinkValue:GetLinkValueFuncType)=>string

export type LinkVisibleFunctType = (l: SankeyLink, data: SankeyData, display_nodes : {[d:string]:SankeyNode},GetLinkValue: GetLinkValueFuncType) => boolean 

export type DefaultNodeFuncType = (data: SankeyData) => SankeyNode

export type DefaultNodeStyleFuncType = () => SankeyNodeStyle

export type DefaultNodeSectorStyleFuncStyle = () => SankeyNodeStyle

export type DefaultNodeProductStyleFuncStyle = () => SankeyNodeStyle

export type DefaultLinkStyleFuncType = () => SankeyLinkStyle

export type CreateObjectFuncType = (data: SankeyData, l: string[]) => SankeyLinkValueDict| SankeyLinkValue

export type DefaultLinkFuncType = (data: SankeyData) => SankeyLink

export type DeleteLinkFuncType = (data: SankeyData,link: SankeyLink)=> void

export type DeleteNodeFuncType = (data: SankeyData,node: SankeyNode)=> void

export type SetNodeStyleToTypeNode = (data:SankeyData)=> void

export type SetNodeStyleToTypeNodeFuncType = (data:SankeyData)=>void

export type NodeColorFuncType = (n: SankeyNode,data:SankeyData)=> string

export type GetVerticalMarginForSankeyZoneFuncType = ()=>number

export type AdjustSankeyZoneFuncType = (data:SankeyData,GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,show_nav?:boolean,vertical?:boolean)=>void

export type GetSankeyMinWidthAndHeightFuncType = (data:SankeyData)=>number[]

export type ToPrecisionFuncType = (v: number,nb_scientific?:number)=> string | number

export type LinkTextFuncType = (data: SankeyData,d: SankeyLink,GetLinkValue:GetLinkValueFuncType)=>string

export type AddTagFuncType =(data:SankeyData,type_tag_name:'nodeTags' | 'fluxTags' | 'dataTags',tags_group_key:string,is_auto_from_add_grp_tag?:boolean)=> void

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

export type  NodeContextHasDesaggregateFuncType = (n: SankeyNode, data: SankeyData) => boolean

export type ApplyStyleToNodesFuncType = (dict_variable_application_data:dict_variable_application_dataType, multi_selected_nodes: {current: SankeyNode[];},
  link_function:LinkFunctionTypes
    ) => void

export type AddNewNodeFuncType = (dict_variable_application_data:dict_variable_application_dataType, multi_selected_nodes: {current: SankeyNode[];},
  link_function:LinkFunctionTypes
    
    ) => void

export type RecursionDataTagFuncType = (data: SankeyData, DT: TagsCatalog, ind: number, suffix: string, link_to_copy: SankeyLink, new_links: {[link_id: string]: SankeyLink;}) => void

export type createDefaultLinkValueForNewDataTagType=(link_value:SankeyLinkValueDict,index_of_grp_tag:number,current_index:number)=>[string, SankeyLinkValueDict | SankeyLinkValue]